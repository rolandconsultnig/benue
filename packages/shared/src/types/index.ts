/**
 * CEWERS Shared Types & DTOs
 * Plain data shapes exchanged across API ↔ Console ↔ Mobile.
 * (Validation decorators live in the API package; these are transport shapes.)
 */

import type {
  Agency,
  AlertLevel,
  Channel,
  Credibility,
  EwiGroup,
  EwiIndicatorType,
  IncidentCategory,
  IncidentEventType,
  IncidentStatus,
  MediaType,
  Priority,
  ResponderStatus,
  ResponderType,
  ResponseModality,
  ResponseTier,
  Role,
  VehicleType,
} from './enums';

/** GeoJSON point [longitude, latitude]. Stored as PostGIS geography(Point). */
export type GeoPoint = {
  lng: number;
  lat: number;
};

export type LgaRef = {
  id: string;
  name: string;
  capital: string;
};

export type WardRef = {
  id: string;
  name: string;
  lgaId: string;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  phone: string;
  name: string;
  role: string;
  agency?: string | null;
  lgaId?: string | null;
  avatarUrl?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type LoginDto = {
  phone: string;
  password: string;
};

export type RegisterDto = {
  phone: string;
  password: string;
  name: string;
  role?: Role;
  agency?: Agency;
  lgaId?: string;
};

export type RefreshDto = {
  refreshToken: string;
};

// ─── Incidents ────────────────────────────────────────────────────────────────

export type CreateIncidentDto = {
  category: IncidentCategory;
  description: string;
  geo: GeoPoint;
  /** ISO date or null. Defaults to now on the server. */
  occurredAt?: string;
  channel: Channel;
  /** Anonymous reports omit reporterId. */
  anonymous?: boolean;
  /** Caller-set priority hint; operator confirms during triage. */
  priorityHint?: string;
  /** Media asset IDs uploaded beforehand via /media. */
  mediaIds?: string[];
};

export type UpdateIncidentDto = {
  status?: IncidentStatus;
  priority?: Priority;
  credibility?: Credibility;
  category?: IncidentCategory;
  description?: string;
  assignedResponderId?: string;
  responseTier?: ResponseTier;
  responseModality?: ResponseModality;
};

export type IncidentEventDto = {
  type: IncidentEventType;
  note?: string;
};

export type Incident = {
  id: string;
  reference: string; // Human-readable, e.g. CEW-2024-00001
  category: IncidentCategory;
  status: IncidentStatus;
  priority: Priority;
  credibility: Credibility;
  description: string;
  geo: GeoPoint;
  lgaId: string;
  wardId: string | null;
  channel: Channel;
  reporterId: string | null;
  assignedResponderId: string | null;
  responseTier: ResponseTier | null;
  responseModality: ResponseModality | null;
  occurredAt: string;
  createdAt: string;
  dispatchedAt: string | null;
  onSceneAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  media: MediaAsset[];
  events: IncidentEvent[];
};

export type IncidentEvent = {
  id: string;
  type: IncidentEventType;
  note: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
};

export type MediaAsset = {
  id: string;
  type: MediaType;
  storageKey: string;
  url: string;
  geo: GeoPoint | null;
  createdAt: string;
};

export type CreateMediaAssetDto = {
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  geo?: GeoPoint;
};

export type PresignedUpload = {
  id: string;
  storageKey: string;
  url: string;
  expiresAt: string;
};

export type IncidentQuery = {
  lgaId?: string;
  wardId?: string;
  category?: IncidentCategory;
  status?: IncidentStatus;
  priority?: Priority;
  channel?: Channel;
  /** ISO date range. */
  from?: string;
  to?: string;
  /** Bounding box for map viewport queries. */
  bbox?: { southWest: GeoPoint; northEast: GeoPoint };
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ─── LGAs / Wards ─────────────────────────────────────────────────────────────

export type Lga = LgaRef & {
  state: string;
  centroid: GeoPoint;
  wardCount: number;
  populationEstimate?: number;
  currentAlertLevel: AlertLevel;
  openIncidentCount: number;
};

export type Ward = WardRef & {
  centroid: GeoPoint;
  currentAlertLevel: AlertLevel;
  currentScore: number;
  openIncidentCount: number;
};

// ─── Alerts / EWI ─────────────────────────────────────────────────────────────

export type AlertState = {
  wardId: string;
  wardName: string;
  lgaId: string;
  lgaName: string;
  level: AlertLevel;
  score: number;
  computedAt: string;
  contributingIndicators: { type: EwiIndicatorType; group: EwiGroup; weight: number }[];
};

export type CreateEwiIndicatorDto = {
  wardId: string;
  type: EwiIndicatorType;
  group: EwiGroup;
  weight: number; // 0-100 contribution within its group
  source: string;
  note?: string;
  expiresAt?: string;
};

// ─── Responders ───────────────────────────────────────────────────────────────

export type Responder = {
  id: string;
  callsign: string;
  agency: Agency;
  type: ResponderType;
  status: ResponderStatus;
  geo: GeoPoint | null;
  lgaId: string;
  vehicleId: string | null;
  vehicleType: VehicleType | null;
  currentIncidentId: string | null;
};

export type Vehicle = {
  id: string;
  callsign: string;
  type: VehicleType;
  agency: Agency;
  lgaId: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  geo: GeoPoint | null;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export type DashboardKpis = {
  totalIncidents: number;
  openIncidents: number;
  incidentsToday: number;
  incidentsThisWeek: number;
  meanDispatchMinutes: number | null;
  meanOnSceneMinutesRural: number | null;
  activeRedAlerts: number;
  activeOrangeAlerts: number;
  reportsByChannel: Record<Channel, number>;
  incidentsByCategory: Record<IncidentCategory, number>;
  resolutionRate: number; // 0-1
};

export type TrendPoint = {
  date: string; // ISO date (day)
  count: number;
  category?: IncidentCategory;
};

// ─── Realtime events (Socket.IO payloads) ─────────────────────────────────────

export type RealtimeEvent =
  | { type: 'incident.created'; incidentId: string; lgaId: string }
  | { type: 'incident.updated'; incidentId: string; changes: string[] }
  | { type: 'incident.dispatched'; incidentId: string; responderId: string }
  | { type: 'alert.changed'; wardId: string; fromLevel: AlertLevel; toLevel: AlertLevel; score: number }
  | { type: 'responder.moved'; responderId: string; geo: GeoPoint }
  | { type: 'presence'; operatorId: string; online: boolean };
