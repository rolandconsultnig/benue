import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { Lga, Ward, GeoPoint } from '@cewers/shared';

@Injectable()
export class LgasService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all 9 LGAs with their current alert level and open incident count. */
  async findAll(): Promise<Lga[]> {
    const lgas = await this.prisma.lga.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { wards: true, incidents: true } },
      },
    });

    // Open incidents + alert level aggregation per LGA
    return Promise.all(
      lgas.map(async (lga) => {
        const openIncidents = await this.prisma.incident.count({
          where: {
            lgaId: lga.id,
            status: { in: ['PENDING', 'IN_TRIAGE', 'DISPATCHED', 'ON_SCENE'] },
          },
        });
        const centroid = await this.prisma.getGeo('Lga', lga.id, 'centroid');

        // Highest alert level across this LGA's wards
        const alerts = await this.prisma.alertState.findMany({
          where: { ward: { lgaId: lga.id } },
          select: { level: true },
        });
        const currentAlertLevel = this.highestAlert(alerts.map((a) => a.level as any));

        return {
          id: lga.id,
          code: lga.code,
          name: lga.name,
          capital: lga.capital,
          state: lga.state,
          centroid: centroid ?? { lng: 0, lat: 0 },
          wardCount: lga._count.wards,
          populationEstimate: lga.populationEstimate ?? undefined,
          currentAlertLevel,
          openIncidentCount: openIncidents,
        } satisfies Lga & { code: string };
      }),
    );
  }

  async findOne(idOrCode: string): Promise<Lga & { code: string }> {
    const lga = await this.prisma.lga.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }] },
      include: { _count: { select: { wards: true, incidents: true } } },
    });
    if (!lga) throw new NotFoundException(`LGA '${idOrCode}' not found`);

    const openIncidents = await this.prisma.incident.count({
      where: {
        lgaId: lga.id,
        status: { in: ['PENDING', 'IN_TRIAGE', 'DISPATCHED', 'ON_SCENE'] },
      },
    });
    const centroid = await this.prisma.getGeo('Lga', lga.id, 'centroid');
    const alerts = await this.prisma.alertState.findMany({
      where: { ward: { lgaId: lga.id } },
      select: { level: true },
    });

    return {
      id: lga.id,
      code: lga.code,
      name: lga.name,
      capital: lga.capital,
      state: lga.state,
      centroid: centroid ?? { lng: 0, lat: 0 },
      wardCount: lga._count.wards,
      populationEstimate: lga.populationEstimate ?? undefined,
      currentAlertLevel: this.highestAlert(alerts.map((a) => a.level as any)),
      openIncidentCount: openIncidents,
    };
  }

  /** List wards for an LGA, each with its current alert level + open incidents. */
  async findWards(lgaIdOrCode: string): Promise<Ward[]> {
    const lga = await this.prisma.lga.findFirst({
      where: { OR: [{ id: lgaIdOrCode }, { code: lgaIdOrCode.toUpperCase() }] },
      select: { id: true },
    });
    if (!lga) throw new NotFoundException(`LGA '${lgaIdOrCode}' not found`);

    const wards = await this.prisma.ward.findMany({
      where: { lgaId: lga.id },
      orderBy: { name: 'asc' },
      include: { alerts: { select: { level: true, score: true } } },
    });

    return Promise.all(
      wards.map(async (w) => {
        const openIncidents = await this.prisma.incident.count({
          where: {
            wardId: w.id,
            status: { in: ['PENDING', 'IN_TRIAGE', 'DISPATCHED', 'ON_SCENE'] },
          },
        });
        const centroid = await this.prisma.getGeo('Ward', w.id, 'centroid');
        const alert = w.alerts[0];
        return {
          id: w.id,
          code: w.code,
          name: w.name,
          lgaId: w.lgaId,
          centroid: centroid ?? { lng: 0, lat: 0 },
          currentAlertLevel: (alert?.level ?? 'GREEN') as any,
          currentScore: alert?.score ?? 0,
          openIncidentCount: openIncidents,
        } satisfies Ward & { code: string };
      }),
    );
  }

  /** Find the LGA + ward containing a geographic point. */
  async locatePoint(point: GeoPoint): Promise<{ lga: Lga & { code: string } | null; ward: Ward | null }> {
    // PostGIS: wards are point centroids, not polygons (no official boundaries yet).
    // Use nearest ward within 15km as a proxy.
    const nearest = await this.prisma.findNearby<any>(
      'Ward',
      'centroid',
      point,
      15_000, // 15 km
    );
    if (nearest.length === 0) return { lga: null, ward: null };

    const ward = nearest[0];
    const lga = await this.findOne(ward.lgaId);
    return { lga, ward: { ...ward, currentAlertLevel: 'GREEN' as any, currentScore: 0, openIncidentCount: 0 } };
  }

  private highestAlert(levels: string[]): any {
    const order = ['RED', 'ORANGE', 'YELLOW', 'GREEN'];
    for (const lvl of order) {
      if (levels.includes(lvl)) return lvl;
    }
    return 'GREEN';
  }
}
