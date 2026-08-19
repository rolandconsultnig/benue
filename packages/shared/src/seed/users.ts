/**
 * Demo user accounts for development & demos.
 * One user per role. Passwords are seeded as bcrypt hashes in the API seed.
 *
 * ⚠️ DEMO ONLY — these credentials are for local development.
 * Do NOT use in any production deployment.
 */

import { Agency, Role } from '../types/enums';

export type DemoUserSeed = {
  phone: string;
  /** Plaintext password — hashed by the API seed script before storage. */
  password: string;
  name: string;
  role: Role;
  agency?: Agency;
  /** Assigned LGA code (for OPERATOR/CFP scoped to a Mini Command Centre). */
  lgaCode?: string;
};

export const DEMO_USERS: DemoUserSeed[] = [
  {
    phone: '+2348000000001',
    password: 'cewers123',
    name: 'Ada Citizen',
    role: Role.CITIZEN,
  },
  {
    phone: '+2348000000002',
    password: 'cewers123',
    name: 'Blessing CFP',
    role: Role.CFP,
    lgaCode: 'AGATU',
  },
  {
    phone: '+2348000000003',
    password: 'cewers123',
    name: 'Cyril Operator',
    role: Role.OPERATOR,
    agency: Agency.NPF,
    lgaCode: 'AGATU',
  },
  {
    phone: '+2348000000004',
    password: 'cewers123',
    name: 'Doris Analyst',
    role: Role.ANALYST,
    agency: Agency.DSS,
  },
  {
    phone: '+2348000000005',
    password: 'cewers123',
    name: 'Enoch Commander',
    role: Role.COMMANDER,
    agency: Agency.NPF,
  },
  {
    phone: '+2348000000006',
    password: 'cewers123',
    name: 'Felix Admin',
    role: Role.ADMIN,
  },
];
