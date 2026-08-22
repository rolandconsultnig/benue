import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { PrismaModule } from './prisma.module';
import { JwtStrategy } from './modules/auth/jwt.strategy';
import { AppHealthController } from './app.health';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LgasModule } from './modules/lgas/lgas.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { RespondersModule } from './modules/responders/responders.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SopsModule } from './modules/sops/sops.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    // Global config — loads .env from the repo root
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),

    // Rate limiting (global default: 100 req/min per IP)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Background jobs (EWI recompute cron)
    ScheduleModule.forRoot(),

    // Core
    PrismaModule,
    RealtimeModule,

    // Feature modules
    AuthModule,
    UsersModule,
    LgasModule,
    IncidentsModule,
    AlertsModule,
    RespondersModule,
    AnalyticsModule,
    SopsModule,
    MediaModule,
  ],
  controllers: [AppHealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    JwtStrategy,
  ],
})
export class AppModule {}
