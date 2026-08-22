import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import type { AuthUser } from '@cewers/shared';
import type { Role } from '@cewers/shared';
import { normalizePhone, getPhoneVariants } from '../../common/utils/phone';

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
    const rawPhone = dto.phone ? dto.phone.trim() : '';
    const normalizedPhone = normalizePhone(rawPhone);
    const variants = getPhoneVariants(rawPhone);

    const existing = await this.prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (existing) throw new ConflictException('Phone already registered');

    const cleanPassword = dto.password ? dto.password.trim() : '';
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const u = await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        name: dto.name.trim(),
        passwordHash,
        role: dto.role,
        agency: (dto.agency as any) || null,
        lgaId: dto.lgaId || null,
        isActive: true,
      },
      select: { id: true, phone: true, name: true, role: true, agency: true, lgaId: true, avatarUrl: true },
    });
    return { ...u, agency: u.agency ?? undefined, lgaId: u.lgaId ?? undefined, avatarUrl: u.avatarUrl ?? undefined };
  }

  async setActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }
}
