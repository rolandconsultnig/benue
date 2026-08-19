import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { DashboardKpis, TrendPoint } from '@cewers/shared';
import { Channel, IncidentCategory } from '@cewers/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Compute the headline KPIs for the dashboard header. */
  async dashboardKpis(): Promise<DashboardKpis> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      totalIncidents,
      openIncidents,
      incidentsToday,
      incidentsThisWeek,
      redAlerts,
      orangeAlerts,
      dispatchStats,
      channelAgg,
      categoryAgg,
      resolved,
      closed,
    ] = await Promise.all([
      this.prisma.incident.count(),
      this.prisma.incident.count({
        where: { status: { in: ['PENDING', 'IN_TRIAGE', 'DISPATCHED', 'ON_SCENE'] } },
      }),
      this.prisma.incident.count({ where: { occurredAt: { gte: todayStart } } }),
      this.prisma.incident.count({ where: { occurredAt: { gte: weekStart } } }),
      this.prisma.alertState.count({ where: { level: 'RED' } }),
      this.prisma.alertState.count({ where: { level: 'ORANGE' } }),
      this.computeDispatchTimes(),
      this.groupCount('channel'),
      this.groupCount('category'),
      this.prisma.incident.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.incident.count({ where: { status: 'CLOSED' } }),
    ]);

    const reportsByChannel = this.zeroFilledChannel(channelAgg);
    const incidentsByCategory = this.zeroFilledCategory(categoryAgg);
    const resolutionRate = totalIncidents > 0 ? resolved / totalIncidents : 0;

    return {
      totalIncidents,
      openIncidents,
      incidentsToday,
      incidentsThisWeek,
      meanDispatchMinutes: dispatchStats.dispatch,
      meanOnSceneMinutesRural: dispatchStats.onScene,
      activeRedAlerts: redAlerts,
      activeOrangeAlerts: orangeAlerts,
      reportsByChannel,
      incidentsByCategory,
      resolutionRate,
    };
  }

  /** Daily incident trend for the last N days, optionally split by category. */
  async trend(days = 30, category?: IncidentCategory): Promise<TrendPoint[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: Prisma.IncidentWhereInput = { occurredAt: { gte: since } };
    if (category) where.category = category;

    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "occurredAt") AS day, COUNT(*)::bigint AS count
      FROM "Incident"
      WHERE "occurredAt" >= ${since} ${category ? Prisma.sql`AND category = ${category}::"IncidentCategory"` : Prisma.empty}
      GROUP BY day ORDER BY day ASC
    `;

    return rows.map((r) => ({
      date: r.day.toISOString(),
      count: Number(r.count),
      category,
    }));
  }

  /** Top hotspot wards (open incidents in last 7 days). */
  async hotspots(limit = 10) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.$queryRaw<
      { wardId: string; wardName: string; lgaName: string; count: bigint; level: string; score: number }[]
    >`
      SELECT i."wardId", w.name AS "wardName", l.name AS "lgaName",
             COUNT(*)::bigint AS count,
             COALESCE(a.level, 'GREEN') AS level,
             COALESCE(a.score, 0) AS score
      FROM "Incident" i
      JOIN "Ward" w ON w.id = i."wardId"
      JOIN "Lga" l ON l.id = w."lgaId"
      LEFT JOIN "AlertState" a ON a."wardId" = i."wardId"
      WHERE i."occurredAt" >= ${since} AND i."wardId" IS NOT NULL
      GROUP BY i."wardId", w.name, l.name, a.level, a.score
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      wardId: r.wardId,
      wardName: r.wardName,
      lgaName: r.lgaName,
      incidentCount: Number(r.count),
      alertLevel: r.level,
      score: r.score,
    }));
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async computeDispatchTimes(): Promise<{ dispatch: number | null; onScene: number | null }> {
    const dispatched = await this.prisma.incident.findMany({
      where: { NOT: [{ dispatchedAt: null }] },
      select: { occurredAt: true, dispatchedAt: true, onSceneAt: true },
      take: 500,
      orderBy: { dispatchedAt: 'desc' },
    });
    if (dispatched.length === 0) return { dispatch: null, onScene: null };

    const dispatchMins = dispatched
      .filter((i) => i.dispatchedAt)
      .map((i) => (i.dispatchedAt.getTime() - i.occurredAt.getTime()) / 60_000);
    const onSceneMins = dispatched
      .filter((i) => i.onSceneAt && i.dispatchedAt)
      .map((i) => (i.onSceneAt.getTime() - i.dispatchedAt.getTime()) / 60_000);

    return {
      dispatch: dispatchMins.length ? Math.round(dispatchMins.reduce((a, b) => a + b, 0) / dispatchMins.length) : null,
      onScene: onSceneMins.length ? Math.round(onSceneMins.reduce((a, b) => a + b, 0) / onSceneMins.length) : null,
    };
  }

  private async groupCount(field: 'channel' | 'category') {
    const grouped = await this.prisma.incident.groupBy({
      by: [field],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ key: g[field], count: g._count._all }));
  }

  private zeroFilledChannel(rows: { key: string; count: number }[]): Record<Channel, number> {
    const out: Record<string, number> = {};
    for (const c of Object.values(Channel)) out[c] = 0;
    for (const r of rows) out[r.key] = r.count;
    return out as Record<Channel, number>;
  }

  private zeroFilledCategory(rows: { key: string; count: number }[]): Record<IncidentCategory, number> {
    const out: Record<string, number> = {};
    for (const c of Object.values(IncidentCategory)) out[c] = 0;
    for (const r of rows) out[r.key] = r.count;
    return out as Record<IncidentCategory, number>;
  }
}
