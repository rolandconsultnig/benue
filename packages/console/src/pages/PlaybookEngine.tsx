/**
 * SOP Playbook Automation Engine
 * Real-time escalation and response orchestration with SLA countdown timers and step execution.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents, useSops, useResponders } from '../api/hooks';
import { categoryMeta, PRIORITY_COLOR } from '../lib/format';
import { DEFCON_CONFIG, type ThreatLevel } from '../lib/tactical';

const SLA_THRESHOLDS = {
  DISPATCH_TARGET: 5 * 60,
  DISPATCH_MAX: 10 * 60,
  ON_SCENE_URBAN: 15 * 60,
  ON_SCENE_RURAL: 30 * 60,
};

type SlaStatus = 'OK' | 'WARNING' | 'BREACH' | 'MET';

function computeSla(
  incident: any,
  now: Date,
): { dispatch: SlaStatus; onScene: SlaStatus; elapsedSec: number } {
  const elapsedSec = Math.floor((now.getTime() - new Date(incident.occurredAt).getTime()) / 1000);

  let dispatch: SlaStatus = 'OK';
  if (incident.dispatchedAt) {
    dispatch = 'MET';
  } else if (elapsedSec > SLA_THRESHOLDS.DISPATCH_MAX) {
    dispatch = 'BREACH';
  } else if (elapsedSec > SLA_THRESHOLDS.DISPATCH_TARGET) {
    dispatch = 'WARNING';
  }

  let onScene: SlaStatus = 'OK';
  if (incident.onSceneAt) {
    onScene = 'MET';
  } else if (incident.dispatchedAt) {
    const dispatchElapsed = Math.floor(
      (now.getTime() - new Date(incident.dispatchedAt).getTime()) / 1000,
    );
    if (dispatchElapsed > SLA_THRESHOLDS.ON_SCENE_RURAL) onScene = 'BREACH';
    else if (dispatchElapsed > SLA_THRESHOLDS.ON_SCENE_URBAN) onScene = 'WARNING';
  }

  return { dispatch, onScene, elapsedSec };
}

const SLA_COLOR: Record<SlaStatus, { text: string; bg: string }> = {
  OK: { text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  WARNING: { text: 'text-amber-400', bg: 'bg-amber-500/20' },
  BREACH: { text: 'text-red-400', bg: 'bg-red-500/20' },
  MET: { text: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PlaybookEngine() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: incidentsData } = useIncidents({ pageSize: 200 });
  const { data: sops } = useSops();
  const { data: responders } = useResponders();

  const activeIncidents = useMemo(
    () => (incidentsData?.items ?? []).filter((i) => !['CLOSED', 'DISMISSED'].includes(i.status)),
    [incidentsData],
  );

  const incidentsWithSla = useMemo(
    () => activeIncidents.map((inc) => ({ ...inc, sla: computeSla(inc, now) })),
    [activeIncidents, now],
  );

  const slaStats = useMemo(() => {
    let breaches = 0,
      warnings = 0;
    for (const inc of incidentsWithSla) {
      if (inc.sla.dispatch === 'BREACH' || inc.sla.onScene === 'BREACH') breaches++;
      else if (inc.sla.dispatch === 'WARNING' || inc.sla.onScene === 'WARNING') warnings++;
    }
    return { breaches, warnings, total: incidentsWithSla.length };
  }, [incidentsWithSla]);

  const selected = incidentsWithSla.find((i) => i.id === selectedIncident);
  const selectedSops = useMemo(() => {
    if (!selected) return [];
    return ((sops as any[]) ?? []).filter((s: any) => s.triggers?.includes(selected.category));
  }, [selected, sops]);

  const availableResponders = useMemo(() => {
    if (!selected) return [];
    return (responders ?? []).filter(
      (r) => r.lgaId === selected.lgaId && r.status === 'AVAILABLE',
    );
  }, [selected, responders]);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none bg-[#070B12] p-4 md:p-6 space-y-4">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">⚡</span>
            <h1 className="text-xl font-bold uppercase tracking-wider text-white font-mono">
              SOP Playbook Automation & Orchestration
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated SLA monitoring, escalation chain triggers, and checklist execution
          </p>
        </div>

        {/* SLA Summary Strip */}
        <div className="flex items-center gap-3">
          <div className="glass-card px-3 py-1.5 border-slate-800 text-center font-mono">
            <div className="text-xs font-bold text-cyan-400">{slaStats.total}</div>
            <div className="text-[9px] text-slate-500 uppercase">ACTIVE</div>
          </div>
          <div className="glass-card px-3 py-1.5 border-slate-800 text-center font-mono">
            <div className="text-xs font-bold text-amber-400">{slaStats.warnings}</div>
            <div className="text-[9px] text-slate-500 uppercase">WARNING</div>
          </div>
          <div className="glass-card px-3 py-1.5 border-red-500/40 text-center font-mono bg-red-950/20">
            <div className="text-xs font-bold text-red-400 animate-pulse">{slaStats.breaches}</div>
            <div className="text-[9px] text-red-400 uppercase">BREACH</div>
          </div>
        </div>
      </div>

      {/* ─── TWO COLUMN LAYOUT: SLA BOARD + PLAYBOOK EXECUTION ──────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-4 min-h-0 overflow-hidden">
        {/* Left: SLA Matrix Board */}
        <div className="glass-card p-4 border-slate-800 bg-slate-900/80 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Active Response SLA Board
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {activeIncidents.length} TARGETS MONITORED
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {incidentsWithSla.map((inc) => {
              const cat = categoryMeta(inc.category as any);
              const isSelected = selectedIncident === inc.id;
              const hasBreach = inc.sla.dispatch === 'BREACH' || inc.sla.onScene === 'BREACH';

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500/80 bg-orange-500/10 shadow-md'
                      : hasBreach
                        ? 'border-red-500/40 bg-red-950/20'
                        : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{cat.icon}</span>
                      <span className="font-bold text-xs text-slate-200 truncate">{cat.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">[{inc.reference}]</span>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{
                        background: `${PRIORITY_COLOR[inc.priority]}20`,
                        color: PRIORITY_COLOR[inc.priority],
                      }}
                    >
                      {inc.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">Dispatch:</span>
                      <span className={`text-[10px] font-bold ${SLA_COLOR[inc.sla.dispatch].text}`}>
                        {inc.sla.dispatch}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">On-Scene:</span>
                      <span className={`text-[10px] font-bold ${SLA_COLOR[inc.sla.onScene].text}`}>
                        {inc.sla.onScene}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      ⏱ {formatElapsed(inc.sla.elapsedSec)}
                    </span>
                  </div>
                </div>
              );
            })}

            {activeIncidents.length === 0 && (
              <div className="py-16 text-center text-xs font-mono text-slate-500">
                ALL CLEAR — NO ACTIVE SLA TARGETS IN MEMORY
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Playbook Execution Detail */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
          {selected ? (
            <>
              {/* Target Incident Snapshot */}
              <div className="glass-card p-4 border-slate-800 bg-slate-900/80 flex-shrink-0">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Incident {selected.reference}
                  </span>
                  <button
                    onClick={() => navigate(`/incidents/${selected.id}`)}
                    className="text-[11px] font-mono text-orange-400 hover:underline"
                  >
                    Open Telemetry →
                  </button>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 mb-2">{selected.description}</p>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Channel: {selected.channel}</span>
                  <span>Credibility: Grade {selected.credibility}</span>
                </div>
              </div>

              {/* Playbook Steps Checklist */}
              <div className="glass-card p-4 border-slate-800 bg-slate-900/80 flex-1 overflow-y-auto">
                <div className="text-xs font-mono font-bold text-slate-200 uppercase mb-3 pb-2 border-b border-slate-800">
                  Applicable Playbooks ({selectedSops.length})
                </div>

                <div className="space-y-3">
                  {selectedSops.map((sop: any) => (
                    <div
                      key={sop.code}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800"
                    >
                      <div className="font-bold text-xs text-orange-400 font-mono">
                        {sop.code}: {sop.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Lead: {sop.leadAgency} • Protocol Tier: {sop.defaultTier.replace(/_/g, ' ')}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {sop.steps.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-slate-300 leading-snug">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {selectedSops.length === 0 && (
                    <div className="py-6 text-center text-xs font-mono text-slate-500">
                      NO AUTOMATED PLAYBOOK REGISTERED FOR THIS CATEGORY
                    </div>
                  )}
                </div>
              </div>

              {/* Ready Responders for Dispatch */}
              <div className="glass-card p-4 border-slate-800 bg-slate-900/80 flex-shrink-0">
                <div className="text-xs font-mono font-bold text-slate-200 uppercase mb-2 pb-1 border-b border-slate-800">
                  Ready Responders ({availableResponders.length})
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                  {availableResponders.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-1.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-slate-200">{r.callsign}</span>
                      <span className="text-emerald-400 text-[10px]">READY</span>
                    </div>
                  ))}
                  {availableResponders.length === 0 && (
                    <div className="col-span-2 text-center text-red-400 text-xs font-mono py-1">
                      ⚠️ NO STANDBY UNITS IN TARGET SECTOR
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card flex-1 flex items-center justify-center p-8 text-center text-slate-500 font-mono text-xs border-slate-800">
              <div>
                <span className="text-3xl block mb-2">⚡</span>
                SELECT AN INCIDENT TARGET TO VIEW AUTOMATED PLAYBOOK EXECUTION
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM DEFCON ESCALATION STRIP ──────────────────────────── */}
      <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-800 flex-shrink-0">
        {([1, 2, 3, 4, 5] as ThreatLevel[]).map((level) => {
          const dc = DEFCON_CONFIG[level];
          return (
            <div
              key={level}
              className="p-2 rounded-lg border text-center font-mono"
              style={{
                borderColor: `${dc.color}40`,
                backgroundColor: `${dc.bgColor}80`,
              }}
            >
              <div className="text-xs font-bold" style={{ color: dc.color }}>
                {dc.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{dc.posture}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
