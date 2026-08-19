import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { Responder, Vehicle, GeoPoint } from '@cewers/shared';

@Injectable()
export class RespondersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(lgaId?: string): Promise<Responder[]> {
    const responders = await this.prisma.responder.findMany({
      where: lgaId ? { lgaId } : undefined,
      orderBy: [{ status: 'asc' }, { callsign: 'asc' }],
    });
    return Promise.all(responders.map((r) => this.serialize(r)));
  }

  async findAvailable(lgaId: string): Promise<Responder[]> {
    const responders = await this.prisma.responder.findMany({
      where: { lgaId, status: 'AVAILABLE' },
      orderBy: { callsign: 'asc' },
    });
    return Promise.all(responders.map((r) => this.serialize(r)));
  }

  async findOne(id: string): Promise<Responder> {
    const r = await this.prisma.responder.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Responder not found');
    return this.serialize(r);
  }

  /** Update a responder's live position (called by mobile app / vehicle tracker). */
  async updatePosition(id: string, geo: GeoPoint): Promise<void> {
    await this.prisma.setGeo('Responder', id, 'geo', geo.lng, geo.lat);
  }

  async updateStatus(id: string, status: string): Promise<Responder> {
    await this.prisma.responder.update({ where: { id }, data: { status: status as any } });
    return this.findOne(id);
  }

  // ─── Vehicles ─────────────────────────────────────────────────────────────

  async findVehicles(lgaId?: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: lgaId ? { lgaId } : undefined,
      orderBy: [{ status: 'asc' }, { callsign: 'asc' }],
    });
    return Promise.all(vehicles.map((v) => this.serializeVehicle(v)));
  }

  private async serialize(r: any): Promise<Responder> {
    const geo = await this.prisma.getGeo('Responder', r.id, 'geo');
    return {
      id: r.id,
      callsign: r.callsign,
      agency: r.agency,
      type: r.type,
      status: r.status,
      geo,
      lgaId: r.lgaId,
      vehicleId: r.vehicleId,
      vehicleType: null,
      currentIncidentId: r.currentIncidentId,
    };
  }

  private async serializeVehicle(v: any): Promise<Vehicle> {
    const geo = await this.prisma.getGeo('Vehicle', v.id, 'geo');
    return {
      id: v.id,
      callsign: v.callsign,
      type: v.type,
      agency: v.agency,
      lgaId: v.lgaId,
      status: v.status,
      geo,
    };
  }
}
