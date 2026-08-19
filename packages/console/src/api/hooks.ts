/**
 * React Query hooks for all CEWERS API endpoints.
 * Import from components: `const { data } = useIncidents(filters)`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AuthSession,
  LoginDto,
  Incident,
  IncidentQuery,
  Paginated,
  Lga,
  Ward,
  AlertState,
  Responder,
  DashboardKpis,
  TrendPoint,
  CreateIncidentDto,
  UpdateIncidentDto,
} from '@cewers/shared';

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<AuthSession>('/api/auth/login', dto),
    retry: false,
    onSuccess: (session) => {
      qc.setQueryData(['session'], session);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout', { refreshToken: localStorage.getItem('cewers_refresh_token') }),
    onSettled: () => {
      qc.clear();
    },
  });
}

// ─── LGAs / Wards ────────────────────────────────────────────────────────────

export function useLgas() {
  return useQuery<Lga[]>({
    queryKey: ['lgas'],
    queryFn: () => api.get('/api/lgas'),
  });
}

export function useLga(idOrCode: string | undefined) {
  return useQuery<Lga>({
    queryKey: ['lgas', idOrCode],
    queryFn: () => api.get(`/api/lgas/${idOrCode}`),
    enabled: !!idOrCode,
  });
}

export function useWards(lgaIdOrCode: string | undefined) {
  return useQuery<Ward[]>({
    queryKey: ['lgas', lgaIdOrCode, 'wards'],
    queryFn: () => api.get(`/api/lgas/${lgaIdOrCode}/wards`),
    enabled: !!lgaIdOrCode,
  });
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export function useIncidents(query: Partial<IncidentQuery> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, val]) => {
    if (val !== undefined && val !== null && typeof val !== 'object') {
      params.set(key, String(val));
    }
  });
  const qs = params.toString();
  return useQuery<Paginated<Incident>>({
    queryKey: ['incidents', query],
    queryFn: () => api.get(`/api/incidents${qs ? `?${qs}` : ''}`),
    refetchInterval: 15_000, // poll every 15s for new incidents
  });
}

export function useIncident(id: string | undefined) {
  return useQuery<Incident>({
    queryKey: ['incidents', id],
    queryFn: () => api.get(`/api/incidents/${id}`),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIncidentDto) => api.post<Incident>('/api/incidents', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useTriageIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; priority?: string; credibility?: string; note?: string }) =>
      api.post<Incident>(`/api/incidents/${id}/triage`, dto),
    onSuccess: (incident) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incidents', incident.id] });
    },
  });
}

export function useDispatchResponder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, responderId }: { incidentId: string; responderId: string }) =>
      api.post<Incident>(`/api/incidents/${incidentId}/dispatch`, { responderId }),
    onSuccess: (incident) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incidents', incident.id] });
      qc.invalidateQueries({ queryKey: ['responders'] });
    },
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: UpdateIncidentDto & { id: string }) =>
      api.patch<Incident>(`/api/incidents/${id}`, dto),
    onSuccess: (incident) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['incidents', incident.id] });
    },
  });
}

export function useAddIncidentEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, type, note }: { incidentId: string; type: string; note?: string }) =>
      api.post<Incident>(`/api/incidents/${incidentId}/events`, { type, note }),
    onSuccess: (incident) => {
      qc.invalidateQueries({ queryKey: ['incidents', incident.id] });
    },
  });
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export function useAlerts() {
  return useQuery<AlertState[]>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/api/alerts'),
    refetchInterval: 30_000,
  });
}

export function useAlertsForLga(lgaId: string | undefined) {
  return useQuery<AlertState[]>({
    queryKey: ['alerts', 'lga', lgaId],
    queryFn: () => api.get(`/api/alerts/lga/${lgaId}`),
    enabled: !!lgaId,
  });
}

// ─── Responders ──────────────────────────────────────────────────────────────

export function useResponders(lgaId?: string) {
  return useQuery<Responder[]>({
    queryKey: ['responders', lgaId],
    queryFn: () => api.get(`/api/responders${lgaId ? `?lgaId=${lgaId}` : ''}`),
  });
}

export function useAvailableResponders(lgaId: string | undefined) {
  return useQuery<Responder[]>({
    queryKey: ['responders', 'available', lgaId],
    queryFn: () => api.get(`/api/responders/available?lgaId=${lgaId}`),
    enabled: !!lgaId,
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function useDashboardKpis() {
  return useQuery<DashboardKpis>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/api/analytics/dashboard'),
    refetchInterval: 30_000,
  });
}

export function useTrend(days = 30) {
  return useQuery<TrendPoint[]>({
    queryKey: ['analytics', 'trend', days],
    queryFn: () => api.get(`/api/analytics/trend?days=${days}`),
  });
}

export function useHotspots(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'hotspots', limit],
    queryFn: () => api.get(`/api/analytics/hotspots?limit=${limit}`),
  });
}

// ─── SOPs ────────────────────────────────────────────────────────────────────

export function useSops(category?: string) {
  return useQuery({
    queryKey: ['sops', category],
    queryFn: () => api.get(`/api/sops${category ? `?category=${category}` : ''}`),
  });
}
