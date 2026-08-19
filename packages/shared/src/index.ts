/**
 * @cewers/shared — Barrel
 *
 * Single import surface for the API, console, mobile app, and USSD service:
 *   import { Role, BENUE_SOUTH_LGAS, can } from '@cewers/shared';
 */

// Types & DTOs
export * from './types/index';
export * from './types/enums';

// RBAC
export { Capability, resolveCapabilities, can, canAll, canAny } from './rbac';

// Seed data
export {
  BENUE_SOUTH_LGAS,
  BENUE_SOUTH_CENTROID,
  getLgaByCode,
  getLgaByName,
  type LgaSeed,
} from './seed/lgas';
export {
  BENUE_SOUTH_WARDS,
  getWardsByLga,
  TOTAL_WARDS,
  type WardSeed,
} from './seed/wards';
export { CATEGORIES, CATEGORY_BY_VALUE, type CategoryMeta } from './seed/categories';
export { SOPS, sopsForCategory, type SopSeed } from './seed/sops';
export { DEMO_USERS, type DemoUserSeed } from './seed/users';
