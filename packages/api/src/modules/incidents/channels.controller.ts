/**
 * Channels Controller — public endpoint for USSD/SMS/Voice/Panic submissions.
 *
 * These channels don't have JWT-authenticated users (citizens on feature phones),
 * so this endpoint is @Public() but accepts a simple channel API key for
 * service-to-service auth (the USSD gateway uses this key).
 *
 * Reports are created as anonymous unless a phone number is provided.
 */

import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import type { CreateIncidentDto } from '@cewers/shared';
import { IncidentsService } from './incidents.service';
import { IsEnum, IsObject, IsOptional, IsString, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

class ChannelIncidentDto {
  @IsString() category!: string;
  @IsString() description!: string;
  @IsLongitude() lng!: number;
  @IsLatitude() lat!: number;
  @IsString() channel!: string; // USSD | SMS | VOICE | PANIC
  @IsOptional() @IsString() reporterPhone?: string;
  @IsOptional() @IsString() priorityHint?: string;
}

@ApiTags('channels')
@Controller('channels')
export class ChannelsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post('incident')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an incident from a reporting channel (USSD/SMS/Voice/Panic) — no JWT required' })
  async submit(@Body() dto: ChannelIncidentDto, @Headers() headers: Record<string, string>) {
    // Simple channel API key validation (skip in dev mode)
    const apiKey = headers['x-channel-key'];
    const expectedKey = process.env.CHANNEL_API_KEY;
    // In dev: allow all. In prod: require the key.
    if (expectedKey && apiKey !== expectedKey) {
      return { statusCode: 401, message: 'Invalid channel API key' };
    }

    return this.incidents.report(
      {
        category: dto.category as any,
        description: dto.description,
        geo: { lng: dto.lng, lat: dto.lat },
        channel: dto.channel as any,
        anonymous: !dto.reporterPhone,
        priorityHint: dto.priorityHint as any,
      },
      // No user context — truly anonymous
      undefined,
    );
  }
}
