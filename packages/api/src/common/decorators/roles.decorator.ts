import { SetMetadata } from '@nestjs/common';
import type { Role } from '@cewers/shared';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles (OR semantics — user needs at least one).
 * Combined with RolesGuard. Higher roles inherit lower roles' capabilities
 * via the RBAC hierarchy in @cewers/shared.
 *
 * Example:
 *   @Roles(Role.OPERATOR)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
