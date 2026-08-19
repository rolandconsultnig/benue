import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IncidentCategory } from '@cewers/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma.service';

@ApiTags('sops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sops')
export class SopsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all SOPs (optionally filtered by trigger category)' })
  findAll(@Query('category') category?: IncidentCategory) {
    return this.prisma.sop.findMany({
      where: category ? { triggers: { has: category } } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get a single SOP by code (e.g. SOP-01)' })
  findOne(@Param('code') code: string) {
    return this.prisma.sop.findUnique({ where: { code: code.toUpperCase() } });
  }
}
