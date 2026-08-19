import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Channel, IncidentCategory } from '@cewers/shared';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class PanicDto {
  @IsLongitude() lng!: number;
  @IsLatitude() lat!: number;
  @IsOptional() @IsString() note?: string;
}

/**
 * Panic / SOS endpoint.
 *
 * Bypasses triage: auto-creates an IN_TRIAGE incident at P1 and broadcasts
 * to all operators immediately. Designed for one-tap activation from the
 * mobile app or a hardware SOS button.
 */
@ApiTags('panic')
@Controller('panic')
export class PanicController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Trigger a panic / SOS alert (auto P1, bypasses triage)' })
  trigger(@Body() dto: PanicDto, @CurrentUser() user: RequestUser) {
    return this.incidents.report(
      {
        category: IncidentCategory.ATTACK_IN_PROGRESS,
        description: dto.note ?? 'PANIC / SOS triggered',
        geo: { lng: dto.lng, lat: dto.lat },
        channel: Channel.PANIC,
        priorityHint: 'P1',
        anonymous: false,
      },
      user,
    );
  }
}
