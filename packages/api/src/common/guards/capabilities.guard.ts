import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { canAll, type Capability, type Role } from '@cewers/shared';
import { CAPABILITIES_KEY } from '../decorators/capabilities.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';

/**
 * Granular capability guard. Checks @Capabilities(...) metadata against
 * the user's role using the shared RBAC matrix (which already accounts for
 * role-hierarchy inheritance).
 *
 * ALL listed capabilities are required (AND semantics).
 */
@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Capability[]>(CAPABILITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');

    if (!canAll(user.role as Role, required)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required capabilities: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
