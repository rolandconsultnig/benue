import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string; // user id
  phone: string;
  role: string;
}

/**
 * JWT strategy — verifies the access token on every protected request and
 * attaches the user to `req.user`. The token payload is signed in AuthService.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        agency: true,
        lgaId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account inactive or not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      agency: user.agency,
      lgaId: user.lgaId,
    };
  }
}
