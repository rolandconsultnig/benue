/**
 * CEWERS Domain Enums
 * Single source of truth shared by API, console, and mobile app.
 * Mirrors the Prisma enum definitions in packages/api/prisma/schema.prisma.
 */

// ─── Identity & Access ────────────────────────────────────────────────────────

/** User roles, in ascending capability order. Used for RBAC guards. */
export enum Role {
  CITIZEN = 'CITIZEN',
  /** Community Focal Point — trained volunteer reporter */
  CFP = 'CFP',
  /** Mini Command Centre / Situation Room operator */
  OPERATOR = 'OPERATOR',
  /** Intelligence analyst (Fusion Cell) */
  ANALYST = 'ANALYST',
  /** Senior commander — can override alert levels, authorise Tier-3 response */
  COMMANDER = 'COMMANDER',
  ADMIN = 'ADMIN',
}

export const ROLE_HIERARCHY: Role[] = [
  Role.CITIZEN,
  Role.CFP,
  Role.OPERATOR,
  Role.ANALYST,
  Role.COMMANDER,
  Role.ADMIN,
];

/** Security agencies that operate within CEWERS (force-multiplier model). */
export enum Agency {
  NPF = 'NPF', // Nigeria Police Force
  DSS = 'DSS',
  NSCDC = 'NSCDC', // Nigeria Security & Civil Defense Corps
  ARMY_OPWS = 'ARMY_OPWS', // Operation Whirl Stroke
  SEMA = 'SEMA', // State Emergency Management Agency
  NEMA = 'NEMA',
  VIGILANTE = 'VIGILANTE',
  FIRE_SERVICE = 'FIRE_SERVICE',
  FRSC = 'FRSC', // Federal Road Safety Corps
  HEALTH = 'HEALTH',
  OTHER = 'OTHER',
}

// ─── Reporting Channels ───────────────────────────────────────────────────────

/** The five public reporting channels. All funnel into IncidentsService.report(). */
export enum Channel {
  APP = 'APP',
  USSD = 'USSD',
  SMS = 'SMS',
  VOICE = 'VOICE',
  PANIC = 'PANIC',
}

export const ALL_CHANNELS: Channel[] = [Channel.APP, Channel.USSD, Channel.SMS, Channel.VOICE, Channel.PANIC];

// ─── Incident Taxonomy ────────────────────────────────────────────────────────

/**
 * The 15-category standardised report taxonomy from the proposal (Section 5.2).
 * These are the incident types citizens and operators can report.
 */
export enum IncidentCategory {
  ARMED_GROUP_MOVEMENT = 'ARMED_GROUP_MOVEMENT',
  SUSPICIOUS_GATHERING = 'SUSPICIOUS_GATHERING',
  THREATS_INCITEMENT = 'THREATS_INCITEMENT',
  CROP_DESTRUCTION = 'CROP_DESTRUCTION',
  LAND_BOUNDARY_DISPUTE = 'LAND_BOUNDARY_DISPUTE',
  KIDNAPPING = 'KIDNAPPING',
  ATTACK_IN_PROGRESS = 'ATTACK_IN_PROGRESS',
  DISPLACEMENT = 'DISPLACEMENT',
  CATTLE_RUSTLING = 'CATTLE_RUSTLING',
  HIGHWAY_ROBBERY = 'HIGHWAY_ROBBERY',
  MISSING_PERSON = 'MISSING_PERSON',
  SUSPICIOUS_STRANGERS = 'SUSPICIOUS_STRANGERS',
  WEAPON_SIGHTING = 'WEAPON_SIGHTING',
  GBV = 'GBV', // Gender-based violence / protection incident
  RUMOUR_VERIFICATION = 'RUMOUR_VERIFICATION',
}

// ─── Incident Lifecycle ───────────────────────────────────────────────────────

/** Incident workflow status. Transitions are enforced in IncidentsService. */
export enum IncidentStatus {
  /** Just reported, awaiting triage */
  PENDING = 'PENDING',
  /** Being verified / cross-checked by an operator or analyst */
  IN_TRIAGE = 'IN_TRIAGE',
  /** Verified, response being coordinated */
  DISPATCHED = 'DISPATCHED',
  /** Responders on scene */
  ON_SCENE = 'ON_SCENE',
  /** Situation resolved, pending close-out */
  RESOLVED = 'RESOLVED',
  /** Closed; after-action review complete */
  CLOSED = 'CLOSED',
  /** Could not be verified — false report or insufficient info */
  DISMISSED = 'DISMISSED',
}

export const INCIDENT_STATUS_FLOW: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.PENDING]: [IncidentStatus.IN_TRIAGE, IncidentStatus.DISMISSED],
  [IncidentStatus.IN_TRIAGE]: [IncidentStatus.DISPATCHED, IncidentStatus.DISMISSED],
  [IncidentStatus.DISPATCHED]: [IncidentStatus.ON_SCENE, IncidentStatus.RESOLVED],
  [IncidentStatus.ON_SCENE]: [IncidentStatus.RESOLVED],
  [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED],
  [IncidentStatus.CLOSED]: [],
  [IncidentStatus.DISMISSED]: [],
};

/** Urgency priority (P1 = highest). Assigned during triage within 5 minutes. */
export enum Priority {
  P1 = 'P1', // Immediate — life-threatening, active attack
  P2 = 'P2', // Urgent — dispatch required
  P3 = 'P3', // Routine — investigate
  P4 = 'P4', // Low — log / monitor
}

/** Credibility grade. Cross-checked against secondary sources. */
export enum Credibility {
  A = 'A', // Confirmed by multiple reliable sources
  B = 'B', // Probable — single reliable source or multiple uncorroborated
  C = 'C', // Possible — single uncorroborated source
  D = 'D', // Doubtful — implausible or unverifiable
}

// ─── Timeline Events ──────────────────────────────────────────────────────────

export enum IncidentEventType {
  CREATED = 'CREATED',
  TRIAGED = 'TRIAGED',
  VERIFIED = 'VERIFIED',
  DISPATCHED = 'DISPATCHED',
  EN_ROUTE = 'EN_ROUTE',
  ON_SCENE = 'ON_SCENE',
  UPDATED = 'UPDATED',
  NOTE_ADDED = 'NOTE_ADDED',
  MEDIA_ATTACHED = 'MEDIA_ATTACHED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  DISMISSED = 'DISMISSED',
  REOPENED = 'REOPENED',
  ESCALATED = 'ESCALATED',
}

// ─── Alert Levels (EWI scoring) ───────────────────────────────────────────────

/**
 * Four-tier alert levels per ward, from the proposal (Section 5.3).
 * Each maps to a score band and a response posture.
 */
export enum AlertLevel {
  GREEN = 'GREEN', // 0-25  Normal
  YELLOW = 'YELLOW', // 26-50 Elevated
  ORANGE = 'ORANGE', // 51-75 High
  RED = 'RED', // 76-100 Imminent/Active
}

export const ALERT_LEVEL_SCORE: Record<AlertLevel, { min: number; max: number }> = {
  [AlertLevel.GREEN]: { min: 0, max: 25 },
  [AlertLevel.YELLOW]: { min: 26, max: 50 },
  [AlertLevel.ORANGE]: { min: 51, max: 75 },
  [AlertLevel.RED]: { min: 76, max: 100 },
};

export const ALERT_LEVEL_COLOR: Record<AlertLevel, string> = {
  [AlertLevel.GREEN]: '#2E7D32',
  [AlertLevel.YELLOW]: '#B58900',
  [AlertLevel.ORANGE]: '#D4875A',
  [AlertLevel.RED]: '#B3261E',
};

export const ALERT_LEVEL_RESPONSE: Record<AlertLevel, string> = {
  [AlertLevel.GREEN]: 'Routine monitoring',
  [AlertLevel.YELLOW]: 'Increased patrol; engage CFPs; community dialogue',
  [AlertLevel.ORANGE]: 'Pre-position QRF; alert all agencies; warn vulnerable villages',
  [AlertLevel.RED]: 'Full response activation; deploy; convene Crisis Management Team',
};

// ─── Early Warning Indicators (EWI) ───────────────────────────────────────────

/**
 * EWI indicator groups from the proposal (Section 5.3).
 * Structural = root causes; Proximate = triggers; Acute = imminent signals.
 */
export enum EwiGroup {
  STRUCTURAL = 'STRUCTURAL',
  PROXIMATE = 'PROXIMATE',
  ACUTE = 'ACUTE',
}

export enum EwiIndicatorType {
  // Structural
  RAINFALL_DEFICIT = 'RAINFALL_DEFICIT',
  CROP_FAILURE = 'CROP_FAILURE',
  CATTLE_ROUTE_ENCROACHMENT = 'CATTLE_ROUTE_ENCROACHMENT',
  CONFLICT_RECURRENCE = 'CONFLICT_RECURRENCE',
  ARMS_AVAILABILITY = 'ARMS_AVAILABILITY',
  // Proximate
  UNUSUAL_CATTLE_MOVEMENT = 'UNUSUAL_CATTLE_MOVEMENT',
  THREAT_MESSAGES = 'THREAT_MESSAGES',
  WATER_DISPUTE = 'WATER_DISPUTE',
  RETALIATION_CYCLE = 'RETALIATION_CYCLE',
  MARKET_SCHOOL_CLOSURE = 'MARKET_SCHOOL_CLOSURE',
  NIGHT_FOREST_MOVEMENT = 'NIGHT_FOREST_MOVEMENT',
  // Acute
  ARMED_ASSEMBLY = 'ARMED_ASSEMBLY',
  ATTACK_RECON = 'ATTACK_RECON',
  MASS_PANIC = 'MASS_PANIC',
  COMMS_BLACKOUT = 'COMMS_BLACKOUT',
}

/** Weight contribution per group toward the composite ward score (0-100). */
export const EWI_GROUP_WEIGHT: Record<EwiGroup, number> = {
  [EwiGroup.STRUCTURAL]: 0.2,
  [EwiGroup.PROXIMATE]: 0.35,
  [EwiGroup.ACUTE]: 0.45,
};

// ─── Responders ───────────────────────────────────────────────────────────────

export enum ResponderType {
  PATROL = 'PATROL',
  QRF = 'QRF', // Quick Reaction Force
  MEDIC = 'MEDIC',
  FIRE = 'FIRE',
  VIGILANTE_TEAM = 'VIGILANTE_TEAM',
  PEACE_COMMITTEE = 'PEACE_COMMITTEE', // For mediation response
}

export enum ResponderStatus {
  AVAILABLE = 'AVAILABLE',
  DISPATCHED = 'DISPATCHED',
  ON_SCENE = 'ON_SCENE',
  RETURNING = 'RETURNING',
  OFF_DUTY = 'OFF_DUTY',
}

export enum VehicleType {
  PATROL_VEHICLE = 'PATROL_VEHICLE',
  MOTORCYCLE = 'MOTORCYCLE',
  BOAT = 'BOAT', // For riverine (Ado, Agatu)
  AMBULANCE = 'AMBULANCE',
}

// ─── Response Tiers ───────────────────────────────────────────────────────────

export enum ResponseTier {
  TIER_1_LOCAL = 'TIER_1_LOCAL', // DPO + LGA Security Committee
  TIER_2_LGA = 'TIER_2_LGA', // Mini Command Centre
  TIER_3_STATE = 'TIER_3_STATE', // State Situation Room
  TIER_4_FEDERAL = 'TIER_4_FEDERAL', // NPF HQ / Defence HQ
}

export enum ResponseModality {
  KINETIC = 'KINETIC',
  MEDIATION = 'MEDIATION',
  HUMANITARIAN = 'HUMANITARIAN',
  PUBLIC_ALERT = 'PUBLIC_ALERT',
  COUNTER_INFO = 'COUNTER_INFO',
}

// ─── Geography ────────────────────────────────────────────────────────────────

export enum State {
  BENUE = 'BENUE',
}
