/**
 * Phone number normalization & search helper for Nigerian phone formats.
 * Handles:
 *   - "08012345678" -> "+2348012345678"
 *   - "2348012345678" -> "+2348012345678"
 *   - "+234 801 234 5678" -> "+2348012345678"
 *   - "080-1234-5678" -> "+2348012345678"
 */

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');

  // 11 digits starting with 0 (standard Nigerian local format: 080xxxxxxxx)
  if (/^0\d{10}$/.test(cleaned)) {
    return '+234' + cleaned.slice(1);
  }

  // 13 digits starting with 234 (without +)
  if (/^234\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // E.164 with +
  if (/^\+\d{10,15}$/.test(cleaned)) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Returns all possible storage variants for a phone number
 * so user lookups succeed even if stored in different legacy formats.
 */
export function getPhoneVariants(raw: string): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');
  const normalized = normalizePhone(cleaned);

  const variants = new Set<string>();
  variants.add(trimmed);
  variants.add(cleaned);
  variants.add(normalized);

  if (normalized.startsWith('+234')) {
    // 080... format
    variants.add('0' + normalized.slice(4));
    // 234... format without plus
    variants.add(normalized.slice(1));
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    variants.add('+234' + cleaned.slice(1));
    variants.add('234' + cleaned.slice(1));
  }

  return Array.from(variants).filter((v) => v.length > 0);
}
