/**
 * RBAC Capability Matrix
 *
 * Single source of truth for role-based permissions.
 * - API uses this via the @Roles() guard.
 * - Console uses this to show/hide UI elements.
 *
 * A capability granted to a role is implicitly granted to all higher roles
 * in the hierarchy (see ROLE_HIERARCHY).
 */

import { Role, ROLE_HIERARCHY } from './types/enums';

/** All distinct capabilities in the system. */
export enum Capability {
  // Reporting
  REPORT_INCIDENT = 'REPORT_INCIDENT',
  VIEW_OWN_REPORTS = 'VIEW_OWN_REPORTS',
  // Triage / verification
  TRIAGE_INCIDENT = 'TRIAGE_INCIDENT',
  VERIFY_INCIDENT = 'VERIFY_INCIDENT',
  // Dispatch
  DISPATCH_RESPONDER = 'DISPATCH_RESPONDER',
  ASSIGN_RESPONDER = 'ASSIGN_RESPONDER',
  // Situational awareness
  VIEW_COP_MAP = 'VIEW_COP_MAP',
  VIEW_ALL_LGAS = 'VIEW_ALL_LGAS',
  // Alerts / EWI
  ADD_EWI_INDICATOR = 'ADD_EWI_INDICATOR',
  OVERRIDE_ALERT_LEVEL = 'OVERRIDE_ALERT_LEVEL',
  // Responders management
  MANAGE_RESPONDERS = 'MANAGE_RESPONDERS',
  // Admin
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_SOPS = 'MANAGE_SOPS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_AUDIT_LOG = 'VIEW_AUDIT_LOG',
}

/**
 * Capabilities granted to each role DIRECTLY (not via hierarchy).
 * Resolve with resolveCapabilities() to get the full effective set.
 */
const DIRECT_CAPABILITIES: Record<Role, Capability[]> = {
  [Role.CITIZEN]: [Capability.REPORT_INCIDENT, Capability.VIEW_OWN_REPORTS],
  [Role.CFP]: [Capability.REPORT_INCIDENT, Capability.VIEW_OWN_REPORTS, Capability.ADD_EWI_INDICATOR],
  [Role.OPERATOR]: [
    Capability.TRIAGE_INCIDENT,
    Capability.VERIFY_INCIDENT,
    Capability.DISPATCH_RESPONDER,
    Capability.ASSIGN_RESPONDER,
    Capability.VIEW_COP_MAP,
    Capability.VIEW_ANALYTICS,
  ],
  [Role.ANALYST]: [
    Capability.ADD_EWI_INDICATOR,
    Capability.TRIAGE_INCIDENT,
    Capability.VERIFY_INCIDENT,
    Capability.VIEW_COP_MAP,
    Capability.VIEW_ALL_LGAS,
    Capability.VIEW_ANALYTICS,
  ],
  [Role.COMMANDER]: [
    Capability.OVERRIDE_ALERT_LEVEL,
    Capability.MANAGE_RESPONDERS,
    Capability.VIEW_AUDIT_LOG,
  ],
  [Role.ADMIN]: [
    Capability.MANAGE_USERS,
    Capability.MANAGE_SOPS,
    Capability.MANAGE_RESPONDERS,
    Capability.VIEW_AUDIT_LOG,
  ],
};

/**
 * Resolve the full set of capabilities for a role, including those inherited
 * from lower roles in the hierarchy.
 *
 * Example: COMMANDER inherits OPERATOR + ANALYST + CFP + CITIZEN capabilities.
 */
export function resolveCapabilities(role: Role): Set<Capability> {
  const caps = new Set<Capability>();
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  for (let i = 0; i <= roleIndex; i++) {
    const r = ROLE_HIERARCHY[i];
    for (const cap of DIRECT_CAPABILITIES[r]) {
      caps.add(cap);
    }
  }
  return caps;
}

/** Check whether a role has a given capability (including inherited). */
export function can(role: Role, capability: Capability): boolean {
  return resolveCapabilities(role).has(capability);
}

/** Check whether a role has ALL of the given capabilities. */
export function canAll(role: Role, capabilities: Capability[]): boolean {
  const caps = resolveCapabilities(role);
  return capabilities.every((c) => caps.has(c));
}

/** Check whether a role has ANY of the given capabilities. */
export function canAny(role: Role, capabilities: Capability[]): boolean {
  const caps = resolveCapabilities(role);
  return capabilities.some((c) => caps.has(c));
}
