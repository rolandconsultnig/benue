/**
 * Real-Time Situation Monitor
 *
 * A dedicated full-screen dashboard for wall projection in the Situation Room.
 * No sidebar, no navigation chrome — pure operational display.
 * Auto-refreshes everything; designed for a TV/video wall.
 *
 * Route: /monitor  (accessible to all authenticated staff)
 *
 * Layout (optimised for 1920×1080 or larger):
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │  HEADER: CEWERS | LIVE CLOCK | ALERT BANNER                     │
 *  ├──────────────────────────┬──────────────────────────────────────┤
 *  │                          │  ACTIVE OPERATIONS (live timers)     │
 *  │     LIVE MAP             ├──────────────────────────────────────┤
 *  │  (incidents + responders)│  KPI TICKERS                         │
 *  │                          ├──────────────────────────────────────┤
 *  │                          │  LIVE FEED (scrolling)               │
 *  ├──────────────────────────┴──────────────────────────────────────┤
 *  │  LGA STATUS STRIP (9 LGAs • alert level • incidents • forces)   │
 *  └─────────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  useIncidents,
  useLgas,
  useAlerts,
  useResponders,
  useDashboardKpis,
} from '../api/hooks';
import { useAlarmStore } from '../store/alarms';
import {
  BENUE_SOUTH_CENTROID,
  type AlertLevel,
} from '@cewers/shared';
import {
  alertColor,
  categoryMeta,
  PRIORITY_COLOR,
  STATUS_COLOR,
  timeAgo,
} from '../lib/format';

// ─── Live clock hook ─────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Auto-fit map to Benue South bounds ───────────────────────────────────────

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [6.8, 7.6],
        [7.8, 8.6],
      ],
      { padding: [20, 20] },
    );
  }, [map]);
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SituationMonitor() {
  const navigate = useNavigate();
  const now = useClock();
  const { data: kpis } = useDashboardKpis();
  const { data: lgas } = useLgas();
  const { data: alerts } = useAlerts();
  const { data: responders } = useResponders();
  const { data: incidentsData } = useIncidents({ pageSize: 200 });
  const alarms = useAlarmStore((s) => s.alarms);
  const unackCount = useAlarmStore((s) => s.unacknowledgedCount);

  const incidents = useMemo(
    () => (incidentsData?.items ?? []).filter((i) => !['CLOSED', 'DISMISSED'].includes(i.status)),
    [incidentsData],
  );

  const activeOps = useMemo(
    () => incidents.filter((i) => ['DISPATCHED', 'ON_SCENE'].includes(i.status)),
    [incidents],
  );

  // Build alert level lookup: wardId → level
  const alertByWard = useMemo(() => {
    const m = new Map<string, string>();
    alerts?.forEach((a) => m.set(a.wardId, a.level));
    return m;
  }, [alerts]);

  // Force status per LGA
  const forceStatus = useMemo(() => {
    const m = new Map<string, { avail: number; dep: number }>();
    responders?.forEach((r) => {
      const e = m.get(r.lgaId) ?? { avail: 0, dep: 0 };
      if (r.status === 'AVAILABLE') e.avail++;
      if (['DISPATCHED', 'ON_SCENE'].includes(r.status)) e.dep++;
      m.set(r.lgaId, e);
    });
    return m;
  }, [responders]);

  // Determine the current alert banner
  const criticalAlarm = alarms.find((a) => !a.acknowledged && a.severity === 'CRITICAL');
  const highAlarm = alarms.find((a) => !a.acknowledged && a.severity === 'HIGH');

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-white overflow-hidden">
      {/* ═══ HEADER BAR ═══════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-6 py-2.5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🛡️</span>
          <div>
            <div className="font-bold text-lg tracking-wide">CEWERS</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              Conflict Early Warning & Response • Benue South
            </div>
          </div>
        </div>

        {/* Live status badges */}
        <div className="flex items-center gap-6 text-sm">
          <StatusBadge label="Open" value={kpis?.openIncidents ?? '—'} color="#D4875A" />
          <StatusBadge label="Active Ops" value={activeOps.length} color="#2563EB" />
          <StatusBadge label="Red Alerts" value={kpis?.activeRedAlerts ?? 0} color="#B3261E" pulse={kpis?.activeRedAlerts > 0} />
          <StatusBadge label="Orange" value={kpis?.activeOrangeAlerts ?? 0} color="#D4875A" />
        </div>

        {/* Clock */}
        <div className="text-right">
          <div className="text-2xl font-mono font-bold tabular-nums">
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">
            {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* ═══ ALARM BANNER (if active critical/high alarm) ═══════════════ */}
      {(criticalAlarm || highAlarm) && (
        <div
          className={`px-6 py-1.5 text-center font-bold text-sm flex items-center justify-center gap-3 flex-shrink-0 ${
            criticalAlarm ? 'bg-alert-red animate-pulse' : 'bg-brand-accent'
          }`}
        >
          <span className="text-lg">{criticalAlarm ? '🚨' : '⚠️'}</span>
          {criticalAlarm?.title || highAlarm?.title}: {criticalAlarm?.message || highAlarm?.message}
        </div>
      )}

      {/* ═══ MAIN GRID ════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-2 p-2 overflow-hidden min-h-0">
        {/* ─── LEFT: MAP ─────────────────────────────────────────────── */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 min-h-0">
          <MapContainer
            center={[BENUE_SOUTH_CENTROID.lat, BENUE_SOUTH_CENTROID.lng]}
            zoom={9}
            className="h-full w-full"
            scrollWheelZoom={false}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitBounds />

            {/* Incident markers */}
            {incidents.map((inc) => {
              const color = PRIORITY_COLOR[inc.priority] || '#5B6770';
              return (
                <CircleMarker
                  key={inc.id}
                  center={[inc.geo.lat, inc.geo.lng]}
                  radius={inc.priority === 'P1' ? 14 : inc.priority === 'P2' ? 10 : 7}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>{categoryMeta(inc.category as any).icon} {categoryMeta(inc.category as any).label}</strong>
                      <br />
                      <span className="text-xs text-gray-500">{inc.reference} • {inc.priority}</span>
                      <br />
                      <span className="text-xs">{inc.status.replace(/_/g, ' ')} • {timeAgo(inc.occurredAt)}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Responder markers */}
            {responders?.map((r) =>
              r.geo ? (
                <CircleMarker
                  key={r.id}
                  center={[r.geo.lat, r.geo.lng]}
                  radius={5}
                  pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.4, weight: 1, dashArray: '3' }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>🚓 {r.callsign}</strong>
                      <br />
                      <span className="text-xs text-gray-500">{r.agency} • {r.status}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null,
            )}
          </MapContainer>

          {/* Map label overlay */}
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
            🗺️ Common Operating Picture — {incidents.length} active incidents
          </div>
        </div>

        {/* ─── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          {/* Active Operations Board */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                ⚡ Active Operations
              </h3>
              <span className="text-xs text-white/40">{activeOps.length} ongoing</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-auto">
              {activeOps.length > 0 ? (
                activeOps.slice(0, 5).map((op) => {
                  const cat = categoryMeta(op.category as any);
                  const elapsed = op.dispatchedAt ? Math.round((now.getTime() - new Date(op.dispatchedAt).getTime()) / 60_000) : 0;
                  return (
                    <div
                      key={op.id}
                      onClick={() => navigate(`/incidents/${op.id}`)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border-l-4"
                      style={{ borderLeftColor: PRIORITY_COLOR[op.priority] }}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{cat.label}</div>
                        <div className="text-[10px] text-white/40">{op.reference} • {op.status.replace(/_/g, ' ')}</div>
                      </div>
                      <span className={`text-xs font-mono font-bold ${elapsed > 30 ? 'text-alert-red' : 'text-white/60'}`}>
                        {elapsed}m
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-white/30 py-3 text-center">No active responses</div>
              )}
            </div>
          </div>

          {/* KPI Ticker Strip */}
          {kpis && (
            <div className="grid grid-cols-3 gap-2 flex-shrink-0">
              <MiniKpi label="Today" value={kpis.incidentsToday} color="#2563EB" />
              <MiniKpi label="Dispatch" value={kpis.meanDispatchMinutes != null ? `${kpis.meanDispatchMinutes}m` : '—'} color="#2E7D32" />
              <MiniKpi label="Resolve" value={`${Math.round(kpis.resolutionRate * 100)}%`} color="#D4875A" />
            </div>
          )}

          {/* Live Feed */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                📡 Live Intelligence Feed
              </h3>
              <span className="flex items-center gap-1 text-xs text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="flex-1 overflow-auto space-y-1 pr-1">
              {incidents.slice(0, 20).map((inc) => {
                const cat = categoryMeta(inc.category as any);
                return (
                  <div key={inc.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 flex-shrink-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PRIORITY_COLOR[inc.priority] }}
                    />
                    <span className="text-xs flex-1 truncate">
                      {cat.icon} {cat.label}
                    </span>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(inc.occurredAt)}</span>
                  </div>
                );
              })}
              {incidents.length === 0 && (
                <div className="text-xs text-white/30 text-center py-4">Awaiting reports...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LGA STATUS STRIP (bottom) ══════════════════════════════════ */}
      <div className="flex-shrink-0 grid grid-cols-9 gap-1 px-2 pb-2">
        {lgas?.map((lga) => {
          const fs = forceStatus.get(lga.id) ?? { avail: 0, dep: 0 };
          const col = alertColor(lga.currentAlertLevel);
          return (
            <div
              key={lga.id}
              className="bg-white/5 rounded-lg p-2 border-t-2 text-center"
              style={{ borderTopColor: col }}
            >
              <div className="text-xs font-bold truncate">{lga.name}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full" style={{ background: col }} />
                <span className="text-[10px] text-white/40">{lga.openIncidentCount} inc</span>
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                <span className="text-green-400">{fs.avail}</span>•<span className="text-orange-400">{fs.dep}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ EXIT BUTTON ════════════════════════════════════════════════ */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-3 right-3 z-[1000] text-white/20 hover:text-white/60 text-xs"
        title="Exit monitor mode"
      >
        ✕ Exit Display
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ label, value, color, pulse }: { label: string; value: string | number; color: string; pulse?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`text-xl font-bold tabular-nums ${pulse ? 'animate-pulse' : ''}`}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function MiniKpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-2 text-center">
      <div className="text-lg font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
    </div>
  );
}
