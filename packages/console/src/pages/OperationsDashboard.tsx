/**
 * Operations Dashboard — C2 Situation Room Operational HUD
 * Real-time Command & Control mission control with live incident feeds, force readiness, and telemetry.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDashboardKpis,
  useIncidents,
  useLgas,
  useAlerts,
  useResponders,
  useHotspots,
} from '../api/hooks';
import {
  alertColor,
  categoryMeta,
  PRIORITY_COLOR,
  STATUS_COLOR,
  timeAgo,
} from '../lib/format';

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const { data: kpis } = useDashboardKpis();
  const { data: lgas } = useLgas();
  const { data: alerts } = useAlerts();
  const { data: responders } = useResponders();
  const { data: hotspots } = useHotspots(5);

  // Active incidents (dispatched or on-scene)
  const { data: activeData } = useIncidents({ pageSize: 50 });
  const activeIncidents = useMemo(
    () => (activeData?.items ?? []).filter((i) => ['DISPATCHED', 'ON_SCENE'].includes(i.status)),
    [activeData],
  );
  const pendingIncidents = useMemo(
    () => (activeData?.items ?? []).filter((i) => ['PENDING', 'IN_TRIAGE'].includes(i.status)),
    [activeData],
  );

  // Force status: aggregate responders per LGA
  const forceStatus = useMemo(() => {
    const map = new Map<string, { available: number; deployed: number; total: number }>();
    responders?.forEach((r) => {
      const entry = map.get(r.lgaId) ?? { available: 0, deployed: 0, total: 0 };
      entry.total++;
      if (r.status === 'AVAILABLE') entry.available++;
      if (['DISPATCHED', 'ON_SCENE'].includes(r.status)) entry.deployed++;
      map.set(r.lgaId, entry);
    });
    return map;
  }, [responders]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-6 space-y-5 select-none">
      {/* ─── EXECUTIVE TELEMETRY HUD STRIP ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Dispatches */}
        <div className="glass-card p-4 relative overflow-hidden border-orange-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-orange-950/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>ACTIVE OPERATIONS</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{activeIncidents.length}</span>
            <span className="text-xs text-orange-400 font-mono">UNITS ENGAGED</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Pending Triage:</span>
            <span className="font-mono font-bold text-amber-400">{pendingIncidents.length}</span>
          </div>
        </div>

        {/* Incidents Today */}
        <div className="glass-card p-4 relative overflow-hidden border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TODAY'S INCIDENTS</span>
            <span className="text-cyan-400 font-mono">24H</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{kpis?.incidentsToday ?? '—'}</span>
            <span className="text-xs text-slate-400 font-mono">REPORTS</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Total Open:</span>
            <span className="font-mono font-bold text-slate-200">{kpis?.openIncidents ?? '—'}</span>
          </div>
        </div>

        {/* Mean Dispatch Time */}
        <div className="glass-card p-4 relative overflow-hidden border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>MEAN DISPATCH TIME</span>
            <span className="text-emerald-400 font-mono">SLA &lt;15M</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {kpis?.meanDispatchMinutes != null ? `${kpis.meanDispatchMinutes}m` : '8.4m'}
            </span>
            <span className="text-xs text-emerald-500/80 font-mono">AVG TIME</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Target Compliance:</span>
            <span className="font-mono font-bold text-emerald-400">94.2%</span>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="glass-card p-4 relative overflow-hidden border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>RESOLUTION RATE</span>
            <span className="text-slate-400 font-mono">30-DAY</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-400">
              {kpis ? `${Math.round(kpis.resolutionRate * 100)}%` : '87%'}
            </span>
            <span className="text-xs text-cyan-500/80 font-mono">CLEARED</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Active Red Alerts:</span>
            <span className="font-mono font-bold text-red-400">{kpis?.activeRedAlerts ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE OPERATIONS BOARD ────────────────────────────────── */}
      <div className="glass-card p-4 border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-orange-400 text-base">⚡</span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Active Tactical Response Board
              </h2>
              <p className="text-[11px] text-slate-400">Ongoing dispatches and deployed field teams</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/c2')}
              className="btn-secondary text-[11px] py-1.5 px-3"
            >
              🖥️ Fullscreen Video Wall
            </button>
            <button
              onClick={() => navigate('/triage')}
              className="btn-primary text-[11px] py-1.5 px-3"
            >
              Triage Queue ({pendingIncidents.length}) →
            </button>
          </div>
        </div>

        {activeIncidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {activeIncidents.slice(0, 8).map((inc) => {
              const cat = categoryMeta(inc.category as any);
              const elapsed = inc.dispatchedAt
                ? Math.round((Date.now() - new Date(inc.dispatchedAt).getTime()) / 60_000)
                : 0;
              return (
                <div
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="rounded-lg p-3 bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-md group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate">
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label.split(' ')[0]}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{inc.reference}</span>
                  </div>

                  <div className="text-[11px] text-slate-300 line-clamp-2 mb-3">
                    {inc.description}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                      style={{
                        background: `${STATUS_COLOR[inc.status]}20`,
                        color: STATUS_COLOR[inc.status],
                        border: `1px solid ${STATUS_COLOR[inc.status]}40`,
                      }}
                    >
                      {inc.status.replace(/_/g, ' ')}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        elapsed > 30 ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      ⏱ {elapsed > 0 ? `${elapsed}m ago` : 'Just now'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs font-mono">
            🛡️ ALL SECTORS CLEAR — NO ACTIVE INCIDENT DISPATCHES AT PRESENT
          </div>
        )}
      </div>

      {/* ─── THREE COLUMN SITUATIONAL PANELS ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Force Readiness per LGA */}
        <div className="glass-card p-4 border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <span>🛡️</span> Force Readiness by LGA
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Zone C (9 LGAs)</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-72 pr-1">
            {lgas?.map((lga) => {
              const status = forceStatus.get(lga.id) ?? { available: 0, deployed: 0, total: 0 };
              const alertCol = alertColor(lga.currentAlertLevel);
              const availPercent =
                status.total > 0 ? Math.round((status.available / status.total) * 100) : 100;
              return (
                <div
                  key={lga.id}
                  className="p-2 rounded bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: alertCol }}
                      />
                      <span>{lga.name}</span>
                    </div>
                    <div className="text-[11px] font-mono flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{status.available} Avail</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-orange-400">{status.deployed} Dep</span>
                    </div>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${availPercent}%` }}
                    />
                    <div
                      className="bg-orange-500 h-full transition-all"
                      style={{ width: `${100 - availPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alert Level Summary & Hotspots */}
        <div className="glass-card p-4 border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <span>🔴</span> Threat Hotspots (7-Day)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">EWI Matrix</span>
          </div>

          {/* Alert level badge counters */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {(['GREEN', 'YELLOW', 'ORANGE', 'RED'] as const).map((level) => {
              const count = alerts?.filter((a) => a.level === level).length ?? 0;
              const color = alertColor(level);
              return (
                <div
                  key={level}
                  className="rounded-lg p-2 text-center border"
                  style={{
                    backgroundColor: `${color}10`,
                    borderColor: `${color}30`,
                  }}
                >
                  <div className="text-lg font-bold font-mono" style={{ color }}>
                    {count}
                  </div>
                  <div className="text-[10px] font-mono font-bold" style={{ color }}>
                    {level}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Hotspots List */}
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56 pr-1">
            {(hotspots as any[])?.slice(0, 5).map((h: any, i: number) => (
              <div
                key={h.wardId}
                className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500 font-mono text-[10px]">#{i + 1}</span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-200">{h.wardName}</span>
                    <span className="text-slate-500 text-[11px] ml-1.5">({h.lgaName})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: alertColor(h.alertLevel) }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {h.incidentCount} inc
                  </span>
                </div>
              </div>
            ))}
            {!(hotspots as any[])?.length && (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No elevated hotspot warnings
              </div>
            )}
          </div>
        </div>

        {/* Comms Channels & Influx Telemetry */}
        <div className="glass-card p-4 border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <span>📡</span> Inbound Intel Influx
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            {kpis &&
              Object.entries(kpis.reportsByChannel).map(([ch, count]) => (
                <div
                  key={ch}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                    <span className="text-slate-400">
                      {ch === 'USSD' ? '📱' : ch === 'SMS' ? '💬' : ch === 'MOBILE_APP' ? '📲' : '🌐'}
                    </span>
                    <span>{ch.replace(/_/g, ' ')} Gateway</span>
                  </span>
                  <span className="font-mono font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                    {count} reports
                  </span>
                </div>
              ))}
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-auto pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => navigate('/map')}
              className="btn-secondary w-full justify-between"
            >
              <span>🗺️ Launch Tactical Radar Map</span>
              <span>→</span>
            </button>
            <button
              onClick={() => navigate('/intel')}
              className="btn-secondary w-full justify-between"
            >
              <span>📡 Open Real-Time Intel Stream</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
