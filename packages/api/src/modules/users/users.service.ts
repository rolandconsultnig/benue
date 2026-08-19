import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import type { AuthUser } from '@cewers/shared';
import type { Role } from '@cewers/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get the current user's profile. */
  async getProfile(userId: string): Promise<AuthUser> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true, role: true, agency: true, lgaId: true, avatarUrl: true },
    });
    if (!u) throw new NotFoundException('User not found');
    return { ...u, agency: u.agency ?? undefined, lgaId: u.lgaId ?? undefined, avatarUrl: u.avatarUrl ?? undefined };
  }

  /** List users (ADMIN only). */
  async findAll(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        agency: true,
        lgaId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create a new user (ADMIN only). */
  async create(dto: {
    phone: string;
    password: string;
    name: string;
    role: Role;
    agency?: string;
    lgaId?: string;
  }): Promise<AuthUser> {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const u = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        passwordHash,
        role: dto.role,
        agency: dto.agency as any,
        lgaId: dto.lgaId,
      },
      select: { id: true, phone: true, name: true, role: true, agency: true, lgaId: true, avatarUrl: true },
    });
    return { ...u, agency: u.agency ?? undefined, lgaId: u.lgaId ?? undefined, avatarUrl: u.avatarUrl ?? undefined };
  }

  async setActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }
}
