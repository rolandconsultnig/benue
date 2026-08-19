import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Responder, Vehicle, GeoPoint } from '@cewers/shared';
import { Capability } from '@cewers/shared';
import { RespondersService } from './responders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from '../../common/guards/capabilities.guard';
import { Capabilities } from '../../common/decorators/capabilities.decorator';

@ApiTags('responders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CapabilitiesGuard)
@Controller('responders')
export class RespondersController {
  constructor(private readonly responders: RespondersService) {}

  @Get()
  @ApiOperation({ summary: 'List responders (optionally filtered by LGA)' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findAll(@Query('lgaId') lgaId?: string): Promise<Responder[]> {
    return this.responders.findAll(lgaId);
  }

  @Get('available')
  @ApiOperation({ summary: 'List available responders for an LGA (for dispatch)' })
  @Capabilities(Capability.DISPATCH_RESPONDER)
  findAvailable(@Query('lgaId') lgaId: string): Promise<Responder[]> {
    return this.responders.findAvailable(lgaId);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles' })
  @Capabilities(Capability.VIEW_COP_MAP)
  findVehicles(@Query('lgaId') lgaId?: string): Promise<Vehicle[]> {
    return this.responders.findVehicles(lgaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Responder> {
    return this.responders.findOne(id);
  }

  @Patch(':id/position')
  @ApiOperation({ summary: 'Update responder position (mobile app / vehicle tracker)' })
  @Capabilities(Capability.VIEW_COP_MAP)
  updatePosition(@Param('id') id: string, @Body() geo: GeoPoint) {
    return this.responders.updatePosition(id, geo);
  }

  @Patch(':id/status')
  @Capabilities(Capability.DISPATCH_RESPONDER)
  updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.responders.updateStatus(id, dto.status);
  }
}
