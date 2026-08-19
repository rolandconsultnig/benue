import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import {
  ALERT_LEVEL_SCORE,
  EWI_GROUP_WEIGHT,
  type AlertLevel,
  type AlertState,
  type CreateEwiIndicatorDto,
  type EwiGroup,
  type RealtimeEvent,
} from '@cewers/shared';
import { RealtimeEmitter, REALTIME_EMITTER } from '../realtime/realtime.events';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REALTIME_EMITTER) private readonly realtime: RealtimeEmitter,
  ) {}

  // ─── Recompute all ward alert levels (every 5 minutes) ─────────────────────

  @Cron(CronExpression.EVERY_5_MINUTES)
  async recomputeAll() {
    this.logger.debug('↻ Recomputing alert levels for all wards...');
    const wards = await this.prisma.ward.findMany({ select: { id: true } });
    for (const ward of wards) {
      await this.recomputeWard(ward.id);
    }
    this.logger.log(`✓ Recomputed alert levels for ${wards.length} wards`);
  }

  /** Recompute the risk score for a single ward from its active indicators. */
  async recomputeWard(wardId: string): Promise<AlertState | null> {
    const indicators = await this.prisma.ewiIndicator.findMany({
      where: { wardId, isActive: true },
    });

    // Expire indicators past their expiry
    const now = new Date();
    const active = indicators.filter((i) => !i.expiresAt || i.expiresAt > now);

    // Score per group: max weight in each group × group weight, summed.
    // (max within a group avoids double-counting correlated indicators.)
    const groupScores: Record<EwiGroup, number> = {
      STRUCTURAL: 0,
      PROXIMATE: 0,
      ACUTE: 0,
    };
    for (const ind of active) {
      if (ind.weight > groupScores[ind.group]) groupScores[ind.group] = ind.weight;
    }

    const score = Math.round(
      Object.entries(EWI_GROUP_WEIGHT).reduce(
        (sum, [group, weight]) => sum + groupScores[group as EwiGroup] * weight,
        0,
      ),
    );
    const level = this.levelForScore(score);

    // Build the contributing-indicators snapshot
    const contributingIndicators = active.map((i) => ({
      type: i.type,
      group: i.group,
      weight: i.weight,
    }));

    // Fetch prior level for the realtime event
    const prior = await this.prisma.alertState.findUnique({ where: { wardId } });
    const priorLevel = (prior?.level ?? 'GREEN') as AlertLevel;

    // Upsert
    const updated = await this.prisma.alertState.upsert({
      where: { wardId },
      update: {
        level: level as any,
        score,
        contributingIndicators,
        computedAt: now,
        // Don't overwrite an override unless the score justifies escalation
        isOverridden: prior?.isOverridden && level === priorLevel ? true : false,
      },
      create: { wardId, level: level as any, score, contributingIndicators, computedAt: now },
    });

    // Emit alert.changed if the level shifted
    if (priorLevel !== level) {
      const event = {
        type: 'alert.changed' as const,
        wardId,
        fromLevel: priorLevel,
        toLevel: level,
        score,
      };
      this.realtime.broadcast('alert.changed', event);
      this.logger.warn(
        `⚠ Alert ${priorLevel} → ${level} (score ${score}) for ward ${wardId}`,
      );
    }

    return this.serialize(updated);
  }

  // ─── Manual override (COMMANDER+ capability) ──────────────────────────────

  async override(
    wardId: string,
    level: AlertLevel,
    reason: string,
    user: RequestUser,
  ): Promise<AlertState | null> {
    const ward = await this.prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) throw new NotFoundException('Ward not found');

    await this.prisma.alertState.upsert({
      where: { wardId },
      update: { level, score: ALERT_LEVEL_SCORE[level].max, isOverridden: true, overrideReason: reason, computedAt: new Date() },
      create: { wardId, level, score: ALERT_LEVEL_SCORE[level].max, isOverridden: true, overrideReason: reason },
    });

    this.realtime.broadcast('alert.changed', { type: 'alert.changed', wardId, fromLevel: 'GREEN', toLevel: level, score: ALERT_LEVEL_SCORE[level].max });
    this.logger.log(`🔔 Alert overridden to ${level} for ward ${wardId} by ${user.name}: ${reason}`);
    return this.findByWard(wardId);
  }

  async clearOverride(wardId: string): Promise<AlertState | null> {
    await this.prisma.alertState.update({
      where: { wardId },
      data: { isOverridden: false, overrideReason: null },
    });
    return this.recomputeWard(wardId);
  }

  // ─── EWI indicators CRUD ──────────────────────────────────────────────────

  async addIndicator(dto: CreateEwiIndicatorDto, user: RequestUser) {
    const indicator = await this.prisma.ewiIndicator.create({
      data: {
        wardId: dto.wardId,
        type: dto.type,
        group: dto.group,
        weight: dto.weight,
        source: dto.source,
        note: dto.note,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    // Adding an indicator triggers an immediate recompute for that ward
    await this.recomputeWard(dto.wardId);
    this.logger.log(`✓ EWI indicator ${dto.type} added to ward ${dto.wardId} by ${user.name}`);
    return indicator;
  }

  async listIndicators(wardId?: string) {
    return this.prisma.ewiIndicator.findMany({
      where: { wardId, isActive: true },
      orderBy: { observedAt: 'desc' },
    });
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findForLga(lgaId: string): Promise<AlertState[]> {
    const states = await this.prisma.alertState.findMany({
      where: { ward: { lgaId } },
      include: { ward: { select: { name: true, lgaId: true, lga: { select: { name: true } } } } },
    });
    return states.map((s) => this.serialize(s));
  }

  async findAll(): Promise<AlertState[]> {
    const states = await this.prisma.alertState.findMany({
      include: { ward: { select: { name: true, lgaId: true, lga: { select: { name: true } } } } },
    });
    return states.map((s) => this.serialize(s));
  }

  async findByWard(wardId: string): Promise<AlertState | null> {
    const s = await this.prisma.alertState.findUnique({
      where: { wardId },
      include: { ward: { select: { name: true, lgaId: true, lga: { select: { name: true } } } } },
    });
    return s ? this.serialize(s) : null;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  levelForScore(score: number): string {
    if (score >= ALERT_LEVEL_SCORE.RED.min) return 'RED';
    if (score >= ALERT_LEVEL_SCORE.ORANGE.min) return 'ORANGE';
    if (score >= ALERT_LEVEL_SCORE.YELLOW.min) return 'YELLOW';
    return 'GREEN';
  }

  private serialize(s: any): AlertState {
    return {
      wardId: s.wardId,
      wardName: s.ward?.name ?? '',
      lgaId: s.ward?.lgaId ?? '',
      lgaName: s.ward?.lga?.name ?? '',
      level: s.level as AlertLevel,
      score: s.score,
      computedAt: s.computedAt,
      contributingIndicators: Array.isArray(s.contributingIndicators)
        ? s.contributingIndicators
        : (s.contributingIndicators as any[] ?? []),
    };
  }
}
