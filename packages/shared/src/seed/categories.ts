/**
 * Threat category display metadata.
 * The enum values live in enums.ts; this gives them human labels, icons, and
 * default priority for triage defaults.
 */

import { IncidentCategory, Priority } from '../types/enums';

export type CategoryMeta = {
  value: IncidentCategory;
  label: string;
  /** Short description for citizen-facing reporting menus. */
  description: string;
  /** Default priority when reported (operator confirms during triage). */
  defaultPriority: Priority;
  /** Emoji / symbol for compact UI badges. */
  icon: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    value: IncidentCategory.ATTACK_IN_PROGRESS,
    label: 'Attack in Progress',
    description: 'An armed attack on a community is happening right now.',
    defaultPriority: Priority.P1,
    icon: '🔥',
  },
  {
    value: IncidentCategory.KIDNAPPING,
    label: 'Kidnapping / Abduction',
    description: 'Someone has been abducted or a kidnap attempt is underway.',
    defaultPriority: Priority.P1,
    icon: '🚨',
  },
  {
    value: IncidentCategory.ARMED_GROUP_MOVEMENT,
    label: 'Movement of Armed Groups',
    description: 'Sighting of armed individuals or groups moving toward an area.',
    defaultPriority: Priority.P2,
    icon: '👥',
  },
  {
    value: IncidentCategory.WEAPON_SIGHTING,
    label: 'Weapon Sighting',
    description: ' sighting of illegal weapons (guns, machetes in quantity).',
    defaultPriority: Priority.P2,
    icon: '🔫',
  },
  {
    value: IncidentCategory.CATTLE_RUSTLING,
    label: 'Cattle Rustling',
    description: 'Livestock theft by armed groups.',
    defaultPriority: Priority.P2,
    icon: '🐄',
  },
  {
    value: IncidentCategory.HIGHWAY_ROBBERY,
    label: 'Highway Robbery / Roadblock',
    description: 'Armed robbery or illegal roadblock on a highway.',
    defaultPriority: Priority.P2,
    icon: '🛣️',
  },
  {
    value: IncidentCategory.DISPLACEMENT,
    label: 'Displacement / Population Movement',
    description: 'People fleeing their homes due to a threat.',
    defaultPriority: Priority.P2,
    icon: '🏃',
  },
  {
    value: IncidentCategory.GBV,
    label: 'GBV / Protection Incident',
    description: 'Gender-based violence or protection incident.',
    defaultPriority: Priority.P2,
    icon: '⚠️',
  },
  {
    value: IncidentCategory.SUSPICIOUS_GATHERING,
    label: 'Suspicious Gathering / Mobilisation',
    description: 'A group assembling in a way that suggests mobilisation.',
    defaultPriority: Priority.P3,
    icon: '🔴',
  },
  {
    value: IncidentCategory.THREATS_INCITEMENT,
    label: 'Threats / Hate Speech / Incitement',
    description: 'Threatening messages, ultimatums, or inciting rhetoric.',
    defaultPriority: Priority.P3,
    icon: '💬',
  },
  {
    value: IncidentCategory.CROP_DESTRUCTION,
    label: 'Crop Destruction / Grazing Violation',
    description: 'Crops destroyed or livestock grazing on farmland.',
    defaultPriority: Priority.P3,
    icon: '🌾',
  },
  {
    value: IncidentCategory.LAND_BOUNDARY_DISPUTE,
    label: 'Land / Boundary Dispute Escalation',
    description: 'A land or chieftaincy dispute is escalating.',
    defaultPriority: Priority.P3,
    icon: '🗺️',
  },
  {
    value: IncidentCategory.MISSING_PERSON,
    label: 'Missing Person',
    description: 'A person is missing under concerning circumstances.',
    defaultPriority: Priority.P3,
    icon: '❓',
  },
  {
    value: IncidentCategory.SUSPICIOUS_STRANGERS,
    label: 'Suspicious Vehicle / Strangers',
    description: 'Unknown vehicle or strangers causing concern.',
    defaultPriority: Priority.P4,
    icon: '🚗',
  },
  {
    value: IncidentCategory.RUMOUR_VERIFICATION,
    label: 'Rumour Verification Request',
    description: 'A rumour is circulating that needs verification.',
    defaultPriority: Priority.P4,
    icon: '🔊',
  },
];

export const CATEGORY_BY_VALUE: Record<IncidentCategory, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<IncidentCategory, CategoryMeta>;
