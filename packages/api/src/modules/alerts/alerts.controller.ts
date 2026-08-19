import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AlertLevel, AlertState, CreateEwiIndicatorDto } from '@cewers/shared';
import { Capability } from '@cewers/shared';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from '../../common/guards/capabilities.guard';
import { Capabilities } from '../../common/decorators/capabilities.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CapabilitiesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List alert states for all wards' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findAll(): Promise<AlertState[]> {
    return this.alerts.findAll();
  }

  @Get('lga/:lgaId')
  @ApiOperation({ summary: 'List alert states for all wards in an LGA' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findForLga(@Param('lgaId') lgaId: string): Promise<AlertState[]> {
    return this.alerts.findForLga(lgaId);
  }

  @Get('ward/:wardId')
  @ApiOperation({ summary: 'Get the alert state for a single ward' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findByWard(@Param('wardId') wardId: string) {
    return this.alerts.findByWard(wardId);
  }

  @Post('ward/:wardId/override')
  @ApiOperation({ summary: 'Manually override a ward alert level (COMMANDER+)' })
  @Capabilities(Capability.OVERRIDE_ALERT_LEVEL)
  override(
    @Param('wardId') wardId: string,
    @Body() dto: { level: AlertLevel; reason: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.alerts.override(wardId, dto.level, dto.reason, user);
  }

  @Post('ward/:wardId/clear-override')
  @ApiOperation({ summary: 'Clear a manual override and recompute' })
  @Capabilities(Capability.OVERRIDE_ALERT_LEVEL)
  clearOverride(@Param('wardId') wardId: string) {
    return this.alerts.clearOverride(wardId);
  }

  @Post('indicators')
  @ApiOperation({ summary: 'Add an EWI indicator (triggers ward recompute)' })
  @Capabilities(Capability.ADD_EWI_INDICATOR)
  addIndicator(@Body() dto: CreateEwiIndicatorDto, @CurrentUser() user: RequestUser) {
    return this.alerts.addIndicator(dto, user);
  }

  @Get('indicators')
  @ApiOperation({ summary: 'List active EWI indicators' })
  @Capabilities(Capability.VIEW_COP_MAP)
  listIndicators(@Query('wardId') wardId?: string) {
    return this.alerts.listIndicators(wardId);
  }

  @Post('recompute')
  @ApiOperation({ summary: 'Force recompute of all ward alert levels' })
  @Capabilities(Capability.OVERRIDE_ALERT_LEVEL)
  recomputeAll() {
    return this.alerts.recomputeAll();
  }
}
