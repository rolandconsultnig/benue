/** Shared format utilities for the mobile app. */
import { CATEGORY_BY_VALUE, CATEGORIES, type CategoryMeta, type IncidentCategory } from '@cewers/shared';

export function categoryMeta(cat: string): CategoryMeta {
  return CATEGORY_BY_VALUE[cat as IncidentCategory] || CATEGORIES[0];
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const STATUS_COLOR: Record<string, string> = {
  PENDING: '#6B7280',
  IN_TRIAGE: '#B58900',
  DISPATCHED: '#D4875A',
  ON_SCENE: '#2563EB',
  RESOLVED: '#2E7D32',
  CLOSED: '#4B5563',
  DISMISSED: '#9CA3AF',
};

export const PRIORITY_COLOR: Record<string, string> = {
  P1: '#B3261E',
  P2: '#D4875A',
  P3: '#B58900',
  P4: '#5B6770',
};
