import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — thin wrapper around PrismaClient with Nest lifecycle hooks.
 *
 * Also exposes typed PostGIS helpers so the rest of the codebase doesn't
 * hand-write ST_SetSRID/ST_MakePoint raw SQL. All geo columns go through here.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✓ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // ─── PostGIS helpers ──────────────────────────────────────────────────────

  /** Set a geography(Point,4326) column from [lng, lat]. */
  async setGeo(table: string, id: string, column: string, lng: number, lat: number): Promise<void> {
    await this.$executeRawUnsafe(
      `UPDATE "${table}" SET "${column}" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
      lng,
      lat,
      id,
    );
  }

  /**
   * Find rows whose geo column is within a bounding box.
   * Used by the COP map viewport queries.
   */
  async findInBbox<T>(
    table: string,
    geoColumn: string,
    southWest: { lng: number; lat: number },
    northEast: { lng: number; lat: number },
    extraWhere?: string,
  ): Promise<any[]> {
    const whereClause = extraWhere ? `AND ${extraWhere}` : '';
    return this.$queryRawUnsafe(
      `SELECT id, ST_X("${geoColumn}"::geometry) AS lng, ST_Y("${geoColumn}"::geometry) AS lat
       FROM "${table}"
       WHERE "${geoColumn}" IS NOT NULL
         AND ST_Within("${geoColumn}"::geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))
         ${whereClause}
       ORDER BY "createdAt" DESC`,
      southWest.lng,
      southWest.lat,
      northEast.lng,
      northEast.lat,
    ) as unknown as Promise<T[]>;
  }

  /** Find rows within a radius (metres) of a point. */
  async findNearby<T>(
    table: string,
    geoColumn: string,
    point: { lng: number; lat: number },
    radiusMeters: number,
    extraWhere?: string,
  ): Promise<any[]> {
    const whereClause = extraWhere ? `AND ${extraWhere}` : '';
    return this.$queryRawUnsafe(
      `SELECT id,
              ST_X("${geoColumn}"::geometry) AS lng,
              ST_Y("${geoColumn}"::geometry) AS lat,
              ST_Distance("${geoColumn}", ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
       FROM "${table}"
       WHERE "${geoColumn}" IS NOT NULL
         AND ST_DWithin("${geoColumn}", ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
         ${whereClause}
       ORDER BY distance_m ASC`,
      point.lng,
      point.lat,
      radiusMeters,
    ) as unknown as Promise<T[]>;
  }

  /** Read the [lng, lat] of a single row's geo column. */
  async getGeo(table: string, id: string, column: string): Promise<{ lng: number; lat: number } | null> {
    const rows = await this.$queryRawUnsafe<{ lng: number; lat: number }[]>(
      `SELECT ST_X("${column}"::geometry) AS lng, ST_Y("${column}"::geometry) AS lat
       FROM "${table}" WHERE id = $1 AND "${column}" IS NOT NULL`,
      id,
    );
    return rows[0] ?? null;
  }
}
