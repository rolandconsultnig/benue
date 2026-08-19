import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import {
  CATEGORIES,
  INCIDENT_STATUS_FLOW,
  type Incident,
  type IncidentQuery,
  type Paginated,
  type GeoPoint,
  type RealtimeEvent,
} from '@cewers/shared';
import { RealtimeEmitter, REALTIME_EMITTER } from '../realtime/realtime.events';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateIncidentDto, UpdateIncidentDto, AddEventDto } from './dto/incident.dto';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REALTIME_EMITTER) private readonly realtime: RealtimeEmitter,
  ) {}

  // ─── Report a new incident (entry point for all 5 channels) ───────────────

  async report(dto: CreateIncidentDto, user?: RequestUser): Promise<Incident> {
    // 1. Resolve the LGA + ward for the report location
    const { lga, ward } = await this.resolveLocation(dto.geo);
    if (!lga) {
      throw new BadRequestException('Report location is outside Benue South LGAs');
    }

    // 2. Generate a sequential reference (CEW-2024-00001)
    const reference = await this.nextReference();

    // 3. Pick default priority from category if not hinted
    const categoryMeta = CATEGORIES.find((c) => c.value === dto.category);
    const priority = dto.priorityHint ?? categoryMeta?.defaultPriority ?? 'P3';

    // 4. Panic channel auto-elevates to P1 and bypasses triage queue
    const isPanic = dto.channel === 'PANIC';
    const initialStatus = isPanic ? 'IN_TRIAGE' : 'PENDING';

    const reporterId = dto.anonymous ? null : user?.id ?? null;

    // 5. Create
    const incident = await this.prisma.incident.create({
      data: {
        reference,
        category: dto.category as any,
        status: initialStatus as any,
        priority: priority as any,
        credibility: 'C' as any,
        description: dto.description,
        // geo column is set via raw SQL (setGeo) after create — it's nullable
        channel: dto.channel as any,
        lgaId: lga.id,
        wardId: ward?.id ?? null,
        reporterId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
      include: { events: true, media: true },
    });

    await this.prisma.setGeo('Incident', incident.id, 'geo', dto.geo.lng, dto.geo.lat);

    // 6. Add the CREATED timeline event
    await this.prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        type: 'CREATED',
        actorId: reporterId,
        actorName: user?.name ?? 'Anonymous',
        note: `Reported via ${dto.channel}.`,
        createdAt: incident.occurredAt,
      },
    });

    // 7. Attach media if provided
    if (dto.mediaIds && dto.mediaIds.length > 0) {
      await this.prisma.mediaAsset.updateMany({
        where: { id: { in: dto.mediaIds } },
        data: { incidentId: incident.id },
      });
    }

    // 8. Realtime: notify the situation room + the LGA room
    const event: RealtimeEvent = { type: 'incident.created', incidentId: incident.id, lgaId: lga.id };
    this.realtime.broadcast('incident.created', { incidentId: incident.id, reference, lgaId: lga.id, category: dto.category, priority });
    this.realtime.emit(`lga:${lga.id}`, 'incident.created', event);

    this.logger.log(`✓ Incident ${reference} reported via ${dto.channel} (${dto.category})`);
    return this.findOne(incident.id);
  }

  // ─── Update / lifecycle transitions ───────────────────────────────────────

  async update(id: string, dto: UpdateIncidentDto, user: RequestUser): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    // Enforce status flow
    if (dto.status && dto.status !== incident.status) {
      this.assertTransition(incident.status, dto.status);
    }

    const before = { status: incident.status, priority: incident.priority, assignedResponderId: incident.assignedResponderId };
    const data: Prisma.IncidentUpdateInput = {};
    if (dto.status) data.status = dto.status;
    if (dto.priority) data.priority = dto.priority;
    if (dto.credibility) data.credibility = dto.credibility;
    if (dto.category) data.category = dto.category;
    if (dto.description) data.description = dto.description;
    if (dto.assignedResponderId) data.assignedResponder = { connect: { id: dto.assignedResponderId } };
    if (dto.responseTier) data.responseTier = dto.responseTier;
    if (dto.responseModality) data.responseModality = dto.responseModality;

    // Lifecycle timestamps
    if (dto.status === 'DISPATCHED' && !incident.dispatchedAt) data.dispatchedAt = new Date();
    if (dto.status === 'ON_SCENE' && !incident.onSceneAt) data.onSceneAt = new Date();
    if (dto.status === 'RESOLVED' && !incident.resolvedAt) data.resolvedAt = new Date();
    if (dto.status === 'CLOSED' && !incident.closedAt) data.closedAt = new Date();

    await this.prisma.incident.update({ where: { id }, data });

    // Record a timeline event for the transition
    if (dto.status && dto.status !== before.status) {
      await this.recordEvent(id, this.eventForStatus(dto.status), user, undefined);
    }

    // Realtime
    const changes = Object.keys(data);
    this.realtime.broadcast('incident.updated', { incidentId: id, changes });
    this.realtime.emit(`lga:${incident.lgaId}`, 'incident.updated', { type: 'incident.updated', incidentId: id, changes });

    return this.findOne(id);
  }

  // ─── Triage: operator verifies + sets priority/credibility ────────────────

  async triage(id: string, dto: { priority?: any; credibility?: any; note?: string }, user: RequestUser): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    if (!['PENDING', 'IN_TRIAGE'].includes(incident.status)) {
      throw new BadRequestException(`Incident already triaged (status: ${incident.status})`);
    }

    await this.prisma.incident.update({
      where: { id },
      data: {
        status: 'IN_TRIAGE',
        priority: dto.priority ?? incident.priority,
        credibility: dto.credibility ?? incident.credibility,
      },
    });
    await this.recordEvent(id, 'TRIAGED', user, dto.note);
    return this.findOne(id);
  }

  // ─── Dispatch: assign a responder ─────────────────────────────────────────

  async dispatch(id: string, responderId: string, user: RequestUser): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    const responder = await this.prisma.responder.findUnique({ where: { id: responderId } });
    if (!responder) throw new NotFoundException('Responder not found');
    if (responder.status !== 'AVAILABLE') {
      throw new BadRequestException(`Responder ${responder.callsign} is not available (status: ${responder.status})`);
    }

    await this.prisma.$transaction([
      this.prisma.incident.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          assignedResponderId: responderId,
          dispatchedAt: new Date(),
        },
      }),
      this.prisma.responder.update({
        where: { id: responderId },
        data: { status: 'DISPATCHED', currentIncidentId: id },
      }),
    ]);

    await this.recordEvent(id, 'DISPATCHED', user, `Responder ${responder.callsign} dispatched.`);
    this.realtime.broadcast('incident.dispatched', { incidentId: id, responderId });
    return this.findOne(id);
  }

  // ─── Add a free-form timeline event (note) ────────────────────────────────

  async addEvent(id: string, dto: AddEventDto, user: RequestUser): Promise<Incident> {
    await this.recordEvent(id, dto.type, user, dto.note);
    return this.findOne(id);
  }

  // ─── Query / read ─────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } }, media: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return this.serializeIncident(incident);
  }

  async findByReference(reference: string): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({
      where: { reference },
      include: { events: { orderBy: { createdAt: 'asc' } }, media: true },
    });
    if (!incident) throw new NotFoundException(`Incident ${reference} not found`);
    return this.serializeIncident(incident);
  }

  async findMany(query: IncidentQuery): Promise<Paginated<Incident>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 50, 200);
    const where = this.buildWhere(query);

    // Bounding-box query hits PostGIS directly
    let bboxIds: string[] | null = null;
    if (query.bbox) {
      const rows = await this.prisma.findInBbox<{ id: string }>(
        'Incident',
        'geo',
        query.bbox.southWest,
        query.bbox.northEast,
      );
      bboxIds = rows.map((r) => r.id);
    }
    const finalWhere = bboxIds ? { ...where, id: { in: bboxIds } } : where;

    const [total, items] = await Promise.all([
      this.prisma.incident.count({ where: finalWhere }),
      this.prisma.incident.findMany({
        where: finalWhere,
        include: { events: { take: 1, orderBy: { createdAt: 'desc' } }, media: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: await Promise.all(items.map((i) => this.serializeIncident(i))),
      total,
      page,
      pageSize,
    };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private buildWhere(query: IncidentQuery): Prisma.IncidentWhereInput {
    const where: Prisma.IncidentWhereInput = {};
    if (query.lgaId) where.lgaId = query.lgaId;
    if (query.wardId) where.wardId = query.wardId;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.channel) where.channel = query.channel;
    if (query.from || query.to) {
      where.occurredAt = {};
      if (query.from) where.occurredAt.gte = new Date(query.from);
      if (query.to) where.occurredAt.lte = new Date(query.to);
    }
    return where;
  }

  private assertTransition(from: string, to: string) {
    const allowed = (INCIDENT_STATUS_FLOW as any)[from] as string[] | undefined;
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException(`Invalid status transition: ${from} → ${to}`);
    }
  }

  private eventForStatus(status: string): any {
    const map: Record<string, any> = {
      IN_TRIAGE: 'TRIAGED',
      DISPATCHED: 'DISPATCHED',
      ON_SCENE: 'ON_SCENE',
      RESOLVED: 'RESOLVED',
      CLOSED: 'CLOSED',
      DISMISSED: 'DISMISSED',
    };
    return map[status] ?? 'UPDATED';
  }

  private async recordEvent(incidentId: string, type: any, user: RequestUser, note?: string) {
    await this.prisma.incidentEvent.create({
      data: { incidentId, type, actorId: user.id, actorName: user.name, note },
    });
  }

  private async nextReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.incident.count({ where: { reference: { startsWith: `CEW-${year}-` } } });
    return `CEW-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async resolveLocation(point: GeoPoint): Promise<{ lga: any; ward: any }> {
    // Nearest ward within 15km (returns only id + lng/lat/distance)
    const nearest = await this.prisma.findNearby<any>('Ward', 'centroid', point, 15_000);
    if (nearest.length === 0) return { lga: null, ward: null };
    const nearestWardId = nearest[0].id;
    const ward = await this.prisma.ward.findUnique({ where: { id: nearestWardId } });
    const lga = ward ? await this.prisma.lga.findUnique({ where: { id: ward.lgaId } }) : null;
    return { lga, ward };
  }

  private async serializeIncident(i: any): Promise<Incident> {
    const geo = await this.prisma.getGeo('Incident', i.id, 'geo');
    return {
      id: i.id,
      reference: i.reference,
      category: i.category,
      status: i.status,
      priority: i.priority,
      credibility: i.credibility,
      description: i.description,
      geo: geo ?? { lng: 0, lat: 0 },
      lgaId: i.lgaId,
      wardId: i.wardId,
      channel: i.channel,
      reporterId: i.reporterId,
      assignedResponderId: i.assignedResponderId,
      responseTier: i.responseTier,
      responseModality: i.responseModality,
      occurredAt: i.occurredAt,
      createdAt: i.createdAt,
      dispatchedAt: i.dispatchedAt,
      onSceneAt: i.onSceneAt,
      resolvedAt: i.resolvedAt,
      closedAt: i.closedAt,
      media: (i.media ?? []).map((m: any) => ({
        id: m.id,
        type: m.type,
        storageKey: m.storageKey,
        url: m.url,
        geo: null,
        createdAt: m.createdAt,
      })),
      events: (i.events ?? []).map((e: any) => ({
        id: e.id,
        type: e.type,
        note: e.note,
        actorId: e.actorId,
        actorName: e.actorName,
        createdAt: e.createdAt,
      })),
    };
  }
}
