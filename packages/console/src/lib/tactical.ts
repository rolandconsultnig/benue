/**
 * Tactical Utilities — DEFCON levels, MIL-STD-2525D symbols,
 * NATO Admiralty credibility, Composite Risk Index, threat domains.
 */

// ─── DEFCON / Threat Level ────────────────────────────────────────────────────

export type ThreatLevel = 1 | 2 | 3 | 4 | 5;

export const DEFCON_CONFIG: Record<ThreatLevel, {
  label: string;
  color: string;
  bgColor: string;
  glow: string;
  description: string;
  posture: string;
}> = {
  1: {
    label: 'DEFCON 1',
    color: '#DC2626',
    bgColor: '#450A0A',
    glow: 'threat-glow-red',
    description: 'MAXIMUM — Active attack / nuclear readiness',
    posture: 'Full RRF deployment. CMT convened. All forces on highest alert.',
  },
  2: {
    label: 'DEFCON 2',
    color: '#EA580C',
    bgColor: '#431407',
    glow: 'threat-glow-orange',
    description: 'HIGH — Confirmed imminent threat',
    posture: 'Pre-position QRF. Alert all agencies. Warn vulnerable villages.',
  },
  3: {
    label: 'DEFCON 3',
    color: '#EAB308',
    bgColor: '#422006',
    glow: 'threat-glow-green',
    description: 'ELEVATED — Significant risk indicators',
    posture: 'Increased patrol. Engage CFPs. Community dialogue.',
  },
  4: {
    label: 'DEFCON 4',
    color: '#3B82F6',
    bgColor: '#0C1E3A',
    glow: '',
    description: 'GUARDED — Routine monitoring with heightened awareness',
    posture: 'Routine monitoring. Intelligence gathering.',
  },
  5: {
    label: 'DEFCON 5',
    color: '#22C55E',
    bgColor: '#052E16',
    glow: '',
    description: 'NORMAL — No significant threat',
    posture: 'Normal operations. Baseline monitoring.',
  },
};

/** Calculate DEFCON from open incidents + alert levels */
export function computeDefcon(
  openIncidents: number,
  redAlerts: number,
  orangeAlerts: number,
  p1Incidents: number,
): ThreatLevel {
  if (p1Incidents > 0 || redAlerts > 0) return 1;
  if (orangeAlerts > 1 || openIncidents > 15) return 2;
  if (orangeAlerts > 0 || openIncidents > 8) return 3;
  if (openIncidents > 3) return 4;
  return 5;
}

// ─── Composite Risk Index ─────────────────────────────────────────────────────
// Per the spec: CRI = w1*Severity + w2*Density + w3*Credibility + w4*Vulnerability

export function computeCRI(params: {
  severity: number;     // 0-100 (incident priority weighted)
  density: number;      // 0-100 (incidents per km² normalized)
  credibility: number;  // 0-100 (NATO Admiralty mapped)
  vulnerability: number; // 0-100 (population + historical recurrence)
}): { score: number; band: string; color: string } {
  const w = { sev: 0.35, den: 0.25, cred: 0.15, vuln: 0.25 };
  const score = Math.round(
    w.sev * params.severity +
    w.den * params.density +
    w.cred * params.credibility +
    w.vuln * params.vulnerability,
  );

  if (score >= 80) return { score, band: 'CRITICAL', color: '#DC2626' };
  if (score >= 60) return { score, band: 'HIGH', color: '#EA580C' };
  if (score >= 40) return { score, band: 'ELEVATED', color: '#EAB308' };
  if (score >= 20) return { score, band: 'GUARDED', color: '#3B82F6' };
  return { score, band: 'LOW', color: '#22C55E' };
}

// ─── NATO Admiralty Credibility System (A1–F6) ───────────────────────────────

export const ADMIRALTY_RATINGS = [
  { code: 'A1', reliability: 'Completely reliable', credibility: 'Confirmed', score: 100, color: '#22C55E' },
  { code: 'A2', reliability: 'Completely reliable', credibility: 'Probably true', score: 90, color: '#22C55E' },
  { code: 'A3', reliability: 'Completely reliable', credibility: 'Possibly true', score: 80, color: '#84CC16' },
  { code: 'B1', reliability: 'Usually reliable', credibility: 'Confirmed', score: 85, color: '#84CC16' },
  { code: 'B2', reliability: 'Usually reliable', credibility: 'Probably true', score: 75, color: '#EAB308' },
  { code: 'B3', reliability: 'Usually reliable', credibility: 'Possibly true', score: 65, color: '#EAB308' },
  { code: 'C1', reliability: 'Fairly reliable', credibility: 'Confirmed', score: 70, color: '#EAB308' },
  { code: 'C2', reliability: 'Fairly reliable', credibility: 'Probably true', score: 55, color: '#F97316' },
  { code: 'C3', reliability: 'Fairly reliable', credibility: 'Possibly true', score: 45, color: '#F97316' },
  { code: 'D1', reliability: 'Not usually reliable', credibility: 'Confirmed', score: 50, color: '#F97316' },
  { code: 'D2', reliability: 'Not usually reliable', credibility: 'Probably true', score: 35, color: '#EF4444' },
  { code: 'D3', reliability: 'Not usually reliable', credibility: 'Possibly true', score: 25, color: '#EF4444' },
  { code: 'E', reliability: 'Not judged', credibility: 'Doubtful', score: 15, color: '#DC2626' },
  { code: 'F6', reliability: 'Cannot judge', credibility: 'Improbable', score: 5, color: '#DC2626' },
];

export function admiraltyFromCredibility(cred: string): typeof ADMIRALTY_RATINGS[0] {
  const map: Record<string, string> = { A: 'A2', B: 'B2', C: 'C2', D: 'D2' };
  return ADMIRALTY_RATINGS.find((a) => a.code === (map[cred] || 'C2'))!;
}

// ─── MIL-STD-2525D Symbol Identifiers ────────────────────────────────────────
// Simplified: generates SVG path data for tactical symbols.

export type MilStdAffiliation = 'friendly' | 'hostile' | 'neutral' | 'unknown';

export const MILSTD_COLOR: Record<MilStdAffiliation, string> = {
  friendly: '#3B82F6',  // Blue
  hostile: '#DC2626',   // Red
  neutral: '#22C55E',   // Green
  unknown: '#EAB308',   // Yellow
};

export const MILSTD_SHAPE: Record<MilStdAffiliation, 'circle' | 'diamond' | 'square' | 'rect'> = {
  friendly: 'circle',
  hostile: 'diamond',
  neutral: 'square',
  unknown: 'rect',
};

// ─── Multi-INT Domain Labels ──────────────────────────────────────────────────

export type IntelDomain = 'GEOINT' | 'SIGINT' | 'OSINT' | 'HUMINT' | 'FININT' | 'MASINT';

export const INTEL_DOMAINS: Record<IntelDomain, { label: string; icon: string; color: string; desc: string }> = {
  GEOINT: { label: 'GEOINT', icon: '🛰️', color: '#3B82F6', desc: 'Geospatial Intelligence' },
  SIGINT: { label: 'SIGINT', icon: '📡', color: '#8B5CF6', desc: 'Signals Intelligence' },
  OSINT: { label: 'OSINT', icon: '🌐', color: '#06B6D4', desc: 'Open Source Intelligence' },
  HUMINT: { label: 'HUMINT', icon: '🛡️', color: '#22C55E', desc: 'Human Intelligence' },
  FININT: { label: 'FININT', icon: '💱', color: '#EAB308', desc: 'Financial Intelligence' },
  MASINT: { label: 'MASINT', icon: '🔬', color: '#EC4899', desc: 'Measurement Intelligence' },
};

// ─── Predictive Forecast (24/48/72h) ─────────────────────────────────────────

export function predictiveForecast(
  baseScore: number,
  activeIndicators: number,
  trendSlope: number,
): { h24: number; h48: number; h72: number; color24: string; color48: string; color72: string } {
  // Simple propagation model: base + indicator pressure * time + trend momentum
  const pressure = activeIndicators * 3;
  const h24 = Math.min(100, Math.round(baseScore + pressure * 0.5 + trendSlope * 8));
  const h48 = Math.min(100, Math.round(baseScore + pressure * 0.8 + trendSlope * 16));
  const h72 = Math.min(100, Math.round(baseScore + pressure * 1.0 + trendSlope * 24));

  const band = (s: number) => (s >= 80 ? '#DC2626' : s >= 60 ? '#EA580C' : s >= 40 ? '#EAB308' : '#3B82F6');

  return { h24, h48, h72, color24: band(h24), color48: band(h48), color72: band(h72) };
}
