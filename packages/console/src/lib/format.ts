/**
 * Display utilities — colours, labels, time formatting.
 * Centralises the mapping from enum values to human-readable UI.
 */

import {
  ALERT_LEVEL_COLOR,
  ALERT_LEVEL_RESPONSE,
  type AlertLevel,
  type IncidentCategory,
  type IncidentStatus,
  type Priority,
  type Channel,
  CATEGORIES,
  CATEGORY_BY_VALUE,
  type CategoryMeta,
} from '@cewers/shared';

export function alertColor(level: string): string {
  return ALERT_LEVEL_COLOR[level as AlertLevel] || '#5B6770';
}

export function alertResponse(level: string): string {
  return ALERT_LEVEL_RESPONSE[level as AlertLevel] || '';
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

export const CREDIBILITY_COLOR: Record<string, string> = {
  A: '#2E7D32',
  B: '#2563EB',
  C: '#B58900',
  D: '#9CA3AF',
};

export const CHANNEL_COLOR: Record<string, string> = {
  APP: '#2563EB',
  USSD: '#7C3AED',
  SMS: '#0891B2',
  VOICE: '#D97706',
  PANIC: '#B3261E',
};

export function categoryMeta(cat: IncidentCategory): CategoryMeta {
  return CATEGORY_BY_VALUE[cat] || CATEGORIES[0];
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function statusLabel(status: IncidentStatus): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
