import { SetMetadata } from '@nestjs/common';
import type { Capability } from '@cewers/shared';

export const CAPABILITIES_KEY = 'capabilities';

/**
 * Restrict a route by capability (granular RBAC). Uses the shared
 * capability matrix which already accounts for role-hierarchy inheritance.
 *
 * ALL listed capabilities are required. Use @Capabilities() for the common
 * case; pair with CapabilitiesGuard.
 *
 * Example:
 *   @Capabilities(Capability.DISPATCH_RESPONDER)
 *   @UseGuards(JwtAuthGuard, CapabilitiesGuard)
 */
export const Capabilities = (...caps: Capability[]) => SetMetadata(CAPABILITIES_KEY, caps);
