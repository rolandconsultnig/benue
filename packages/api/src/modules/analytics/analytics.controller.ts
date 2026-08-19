import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IncidentCategory } from '@cewers/shared';
import { Capability } from '@cewers/shared';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from '../../common/guards/capabilities.guard';
import { Capabilities } from '../../common/decorators/capabilities.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CapabilitiesGuard)
@Capabilities(Capability.VIEW_ANALYTICS)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Headline KPIs for the dashboard header' })
  dashboard() {
    return this.analytics.dashboardKpis();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Daily incident trend (last N days)' })
  trend(@Query('days') days?: string, @Query('category') category?: IncidentCategory) {
    return this.analytics.trend(days ? parseInt(days, 10) : 30, category);
  }

  @Get('hotspots')
  @ApiOperation({ summary: 'Top hotspot wards by recent incident count' })
  hotspots(@Query('limit') limit?: string) {
    return this.analytics.hotspots(limit ? parseInt(limit, 10) : 10);
  }
}
