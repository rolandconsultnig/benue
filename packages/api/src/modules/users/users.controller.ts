import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser, Role } from '@cewers/shared';
import { Capability } from '@cewers/shared';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilitiesGuard } from '../../common/guards/capabilities.guard';
import { Capabilities } from '../../common/decorators/capabilities.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current user's profile" })
  getMe(@CurrentUser() user: RequestUser): Promise<AuthUser> {
    return this.users.getProfile(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all users (ADMIN)' })
  @UseGuards(CapabilitiesGuard)
  @Capabilities(Capability.MANAGE_USERS)
  findAll(@Query('role') role?: Role) {
    return this.users.findAll(role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user (ADMIN)' })
  @UseGuards(CapabilitiesGuard)
  @Capabilities(Capability.MANAGE_USERS)
  create(
    @Body() dto: { phone: string; password: string; name: string; role: Role; agency?: string; lgaId?: string },
  ): Promise<AuthUser> {
    return this.users.create(dto);
  }

  @Patch(':id/active')
  @ApiOperation({ summary: 'Activate or deactivate a user (ADMIN)' })
  @UseGuards(CapabilitiesGuard)
  @Capabilities(Capability.MANAGE_USERS)
  setActive(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
    return this.users.setActive(id, dto.isActive);
  }
}
