import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Role } from '@cewers/shared';
import type { RequestUser } from '../decorators/current-user.decorator';

/**
 * Role-based access guard. Checks @Roles(...) metadata against the
 * authenticated user's role. Uses OR semantics: user needs at least one
 * of the listed roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');

    const ok = requiredRoles.includes(user.role as Role);
    if (!ok) {
      throw new ForbiddenException(
        `Role '${user.role}' is not permitted. Required: ${requiredRoles.join(' or ')}`,
      );
    }
    return true;
  }
}
