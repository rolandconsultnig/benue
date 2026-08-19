/**
 * SMS Report Parser — parses incoming SMS messages into incident reports.
 *
 * Format (simple keyword-based):
 *   "CEW KIDNAPPING Highway abduction near Otukpo"
 *   "CEW ATTACK Armed men attacking Odugbeho village"
 *   "CEW CATTLE 50 cattle stolen near Egba"
 *
 * Also handles:
 *   "TRACK CEW-2024-00001"  → returns status via SMS reply
 *   "HELP"                   → returns usage instructions
 */

import {
  CATEGORIES,
  IncidentCategory,
  Channel,
  type CreateIncidentDto,
} from '@cewers/shared';

export interface SmsReport {
  phoneNumber: string;
  message: string;
  keyword?: string;
  category?: IncidentCategory;
  description?: string;
  isTracking?: boolean;
  trackRef?: string;
  isHelp?: boolean;
}

// Build a keyword lookup from category labels
const CATEGORY_KEYWORDS = new Map<string, IncidentCategory>();
CATEGORIES.forEach((c) => {
  // Use first word of label + common abbreviations
  const words = c.label.toUpperCase().split(/[\s\/]+/);
  words.forEach((w) => {
    if (w.length >= 3) CATEGORY_KEYWORDS.set(w, c.value);
  });
});
// Add short aliases
CATEGORY_KEYWORDS.set('GUNS', IncidentCategory.WEAPON_SIGHTING);
CATEGORY_KEYWORDS.set('GUN', IncidentCategory.WEAPON_SIGHTING);
CATEGORY_KEYWORDS.set('FIGHT', IncidentCategory.ATTACK_IN_PROGRESS);
CATEGORY_KEYWORDS.set('RUSTLE', IncidentCategory.CATTLE_RUSTLING);
CATEGORY_KEYWORDS.set('KIDNAP', IncidentCategory.KIDNAPPING);
CATEGORY_KEYWORDS.set('ROBBERY', IncidentCategory.HIGHWAY_ROBBERY);
CATEGORY_KEYWORDS.set('ROB', IncidentCategory.HIGHWAY_ROBBERY);
CATEGORY_KEYWORDS.set('GRAZE', IncidentCategory.CROP_DESTRUCTION);
CATEGORY_KEYWORDS.set('DISPUTE', IncidentCategory.LAND_BOUNDARY_DISPUTE);
CATEGORY_KEYWORDS.set('MISSING', IncidentCategory.MISSING_PERSON);
CATEGORY_KEYWORDS.set('STRANGER', IncidentCategory.SUSPICIOUS_STRANGERS);
CATEGORY_KEYWORDS.set('RUMOUR', IncidentCategory.RUMOUR_VERIFICATION);

export function parseSms(phoneNumber: string, message: string): SmsReport {
  const report: SmsReport = { phoneNumber, message };
  const trimmed = message.trim();

  // Handle HELP
  if (/^HELP$/i.test(trimmed)) {
    report.isHelp = true;
    return report;
  }

  // Handle TRACK
  const trackMatch = trimmed.match(/^(?:TRACK|CHECK|STATUS)\s+(CEW-\d{4}-\d{5})/i);
  if (trackMatch) {
    report.isTracking = true;
    report.trackRef = trackMatch[1].toUpperCase();
    return report;
  }

  // Parse incident report: "CEW <keyword> <description>" or just "<keyword> <description>"
  const parts = trimmed.split(/\s+/);
  let keywordIdx = 0;

  // Skip "CEW" prefix if present
  if (parts[0]?.toUpperCase() === 'CEW') keywordIdx = 1;

  const keyword = parts[keywordIdx]?.toUpperCase();
  report.keyword = keyword;

  if (keyword && CATEGORY_KEYWORDS.has(keyword)) {
    report.category = CATEGORY_KEYWORDS.get(keyword);
    report.description =
      parts.slice(keywordIdx + 1).join(' ') || `${CATEGORY_KEYWORDS.get(keyword)} reported`;
  } else {
    // No keyword recognised — treat whole message as description with generic category
    report.description = trimmed;
    report.category = IncidentCategory.SUSPICIOUS_GATHERING;
  }

  return report;
}

export function smsReportToDto(report: SmsReport): CreateIncidentDto {
  return {
    category: report.category!,
    description: report.description!,
    geo: { lng: 8.05, lat: 7.2 }, // Default centroid (SMS has no GPS)
    channel: Channel.SMS,
    anonymous: true,
  };
}

export function buildHelpReply(): string {
  return 'CEWERS: Report via SMS:\nCEW KIDNAPPING <details>\nCEW ATTACK <details>\nCEW CATTLE <details>\nKeywords: KIDNAPPING, ATTACK, CATTLE, ROBBERY, GUNS, FIGHT, GRAZE, DISPUTE, MISSING\nOr call 112';
}
