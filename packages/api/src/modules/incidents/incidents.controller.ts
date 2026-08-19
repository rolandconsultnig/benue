import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Incident, IncidentQuery, Paginated } from '@cewers/shared';
import { Capability } from '@cewers/shared';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, UpdateIncidentDto, AddEventDto, IncidentQueryDto } from './dto/incident.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from '../../common/guards/capabilities.guard';
import { Capabilities } from '../../common/decorators/capabilities.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Report a new incident (any channel; all roles)' })
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: RequestUser): Promise<Incident> {
    return this.incidents.report(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Query incidents (filter by LGA/category/status/priority/bbox)' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @Capabilities(Capability.VIEW_COP_MAP)
  findMany(@Query() query: IncidentQueryDto): Promise<Paginated<Incident>> {
    return this.incidents.findMany(query as IncidentQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single incident with full timeline + media' })
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<Incident> {
    return this.incidents.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an incident (status transitions, priority, assignment)' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @Capabilities(Capability.TRIAGE_INCIDENT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: RequestUser,
  ): Promise<Incident> {
    return this.incidents.update(id, dto, user);
  }

  @Post(':id/triage')
  @ApiOperation({ summary: 'Triage an incident (verify + set priority & credibility)' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @Capabilities(Capability.TRIAGE_INCIDENT)
  triage(
    @Param('id') id: string,
    @Body() dto: { priority?: string; credibility?: string; note?: string },
    @CurrentUser() user: RequestUser,
  ): Promise<Incident> {
    return this.incidents.triage(id, dto as any, user);
  }

  @Post(':id/dispatch')
  @ApiOperation({ summary: 'Dispatch a responder to an incident' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @Capabilities(Capability.DISPATCH_RESPONDER)
  dispatch(
    @Param('id') id: string,
    @Body() dto: { responderId: string },
    @CurrentUser() user: RequestUser,
  ): Promise<Incident> {
    return this.incidents.dispatch(id, dto.responderId, user);
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Add a timeline event / note to an incident' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @Capabilities(Capability.TRIAGE_INCIDENT)
  addEvent(
    @Param('id') id: string,
    @Body() dto: AddEventDto,
    @CurrentUser() user: RequestUser,
  ): Promise<Incident> {
    return this.incidents.addEvent(id, dto, user);
  }
}
