import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma.service';
import type { AuthSession, AuthUser } from '@cewers/shared';
import type { Role } from '@cewers/shared';
import { LoginDto, RegisterDto, RefreshDto } from './dto/auth.dto';
import { normalizePhone, getPhoneVariants } from '../../common/utils/phone';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const normalizedPhone = normalizePhone(dto.phone);
    const variants = getPhoneVariants(dto.phone);

    const existing = await this.prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (existing) throw new ConflictException('A user with this phone number already exists');

    const cleanPassword = dto.password.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        name: dto.name.trim(),
        passwordHash,
        role: (dto.role ?? 'CITIZEN') as Role,
        agency: dto.agency || null,
        lgaId: dto.lgaId || null,
        isActive: true,
      },
    });

    return this.issueSession(user.id, user.phone, user.name, user.role, user.agency, user.lgaId);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const rawPhone = dto.phone ? dto.phone.trim() : '';
    const variants = getPhoneVariants(rawPhone);

    const user = await this.prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const cleanPassword = dto.password ? dto.password.trim() : '';
    const ok = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueSession(user.id, user.phone, user.name, user.role, user.agency, user.lgaId);
  }

  async refresh(dto: RefreshDto): Promise<AuthSession> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Rotate: revoke the old token, issue a new session
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(
      stored.user.id,
      stored.user.phone,
      stored.user.name,
      stored.user.role,
      stored.user.agency,
      stored.user.lgaId,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async issueSession(
    userId: string,
    phone: string,
    name: string,
    role: string,
    agency: string | null,
    lgaId: string | null,
  ): Promise<AuthSession> {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshDays = parseInt(this.config.get<string>('JWT_REFRESH_TTL', '7d').replace(/\D/g, ''), 10) || 7;

    const payload = { sub: userId, phone, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    const user: AuthUser = { id: userId, phone, name, role: role as Role, agency, lgaId };

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ttlToSeconds(accessTtl),
      user,
    };
  }

  private ttlToSeconds(ttl: string): number {
    const m = ttl.match(/^(\d+)([smhd])$/);
    if (!m) return 900;
    const n = parseInt(m[1], 10);
    const unit = m[2];
    return n * { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  }
}
