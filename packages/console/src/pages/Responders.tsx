import { useState, useMemo } from 'react';
import { useResponders, useLgas } from '../api/hooks';

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  AVAILABLE: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  DISPATCHED: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  ON_SCENE: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  RETURNING: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  OFF_DUTY: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const AGENCY_LABEL: Record<string, string> = {
  NPF: 'Nigeria Police Force',
  DSS: 'State Security Service',
  NSCDC: 'Civil Defence (NSCDC)',
  ARMY_OPWS: 'Operation Whirl Stroke',
  SEMA: 'State Emergency (SEMA)',
  NEMA: 'National Emergency (NEMA)',
  VIGILANTE: 'Community Vigilante',
  FIRE_SERVICE: 'Federal Fire Service',
  FRSC: 'Road Safety (FRSC)',
  HEALTH: 'Emergency Medical',
  OTHER: 'Inter-Agency',
};

export default function RespondersPage() {
  const { data: lgas } = useLgas();
  const [lgaFilter, setLgaFilter] = useState<string>('');
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  const { data: responders } = useResponders(lgaFilter || undefined);

  const filteredResponders = useMemo(() => {
    if (!responders) return [];
    if (!agencyFilter) return responders;
    return responders.filter((r) => r.agency === agencyFilter);
  }, [responders, agencyFilter]);

  const stats = useMemo(() => {
    if (!responders) return { total: 0, available: 0, deployed: 0, onScene: 0 };
    const available = responders.filter((r) => r.status === 'AVAILABLE').length;
    const deployed = responders.filter((r) => r.status === 'DISPATCHED').length;
    const onScene = responders.filter((r) => r.status === 'ON_SCENE').length;
    return {
      total: responders.length,
      available,
      deployed,
      onScene,
    };
  }, [responders]);

  const agencies = useMemo(() => {
    const set = new Set<string>();
    responders?.forEach((r) => set.add(r.agency));
    return Array.from(set);
  }, [responders]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 select-none">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">🛡️</span>
            <h1 className="text-xl font-bold uppercase tracking-wider text-white font-mono">
              Force Readiness & Tactical Asset Roster
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inter-agency deployment readiness, patrol units, and quick reaction forces across Zone C
          </p>
        </div>
      </div>

      {/* ─── READINESS TELEMETRY STRIP ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3.5 border-slate-800 bg-slate-900/80">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            Total Deployed Units
          </div>
          <div className="text-2xl font-mono font-bold text-white">{stats.total}</div>
        </div>

        <div className="glass-card p-3.5 border-slate-800 bg-slate-900/80">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            Available On Standby
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">{stats.available}</div>
        </div>

        <div className="glass-card p-3.5 border-slate-800 bg-slate-900/80">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            Dispatched In Transit
          </div>
          <div className="text-2xl font-mono font-bold text-orange-400">{stats.deployed}</div>
        </div>

        <div className="glass-card p-3.5 border-slate-800 bg-slate-900/80">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            Engaged On Scene
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">{stats.onScene}</div>
        </div>
      </div>

      {/* ─── LGA & AGENCY FILTER PILLS ──────────────────────────────── */}
      <div className="glass-card p-3 border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        {/* LGA Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setLgaFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              !lgaFilter
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            ALL 9 LGAS
          </button>
          {lgas?.map((lga) => (
            <button
              key={lga.id}
              onClick={() => setLgaFilter(lga.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                lgaFilter === lga.id
                  ? 'bg-orange-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {lga.name}
            </button>
          ))}
        </div>

        {/* Agency Select Filter */}
        <select
          value={agencyFilter}
          onChange={(e) => setAgencyFilter(e.target.value)}
          className="c2-input text-xs w-48 bg-slate-950 text-slate-200"
        >
          <option value="">All Security Agencies</option>
          {agencies.map((a) => (
            <option key={a} value={a}>
              {AGENCY_LABEL[a] || a}
            </option>
          ))}
        </select>
      </div>

      {/* ─── UNIT ROSTER GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredResponders?.map((r) => {
          const sc = STATUS_COLOR[r.status] || STATUS_COLOR.OFF_DUTY;

          return (
            <div
              key={r.id}
              className="glass-card p-4 border-slate-800 hover:border-slate-700 bg-slate-900/80 transition-all shadow-md group"
            >
              <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                <div>
                  <div className="font-bold text-xs font-mono text-slate-100 flex items-center gap-1.5">
                    <span>🚓</span>
                    <span>{r.callsign}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {AGENCY_LABEL[r.agency] || r.agency}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${sc.bg} ${sc.text} ${sc.border}`}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Type:</span>
                  <span className="text-slate-300">{r.type.replace(/_/g, ' ')}</span>
                </div>
                {r.geo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Fix:</span>
                    <span className="text-slate-300">
                      {r.geo.lat.toFixed(3)}, {r.geo.lng.toFixed(3)}
                    </span>
                  </div>
                )}
                {r.currentIncidentId && (
                  <div className="mt-2 p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-1.5 font-bold">
                    <span>⚠️</span>
                    <span>DEPLOYED ON ACTIVE TARGET</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredResponders.length === 0 && (
        <div className="glass-card py-20 text-center text-slate-500 text-xs font-mono border-slate-800">
          NO UNITS MATCHING SELECTED JURISDICTION FILTERS
        </div>
      )}
    </div>
  );
}
