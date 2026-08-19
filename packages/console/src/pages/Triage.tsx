import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents, useTriageIncident, useLgas } from '../api/hooks';
import {
  categoryMeta,
  PRIORITY_COLOR,
  STATUS_COLOR,
  CHANNEL_COLOR,
  timeAgo,
} from '../lib/format';
import type { Priority } from '@cewers/shared';

const STATUSES = ['PENDING', 'IN_TRIAGE', 'DISPATCHED', 'ON_SCENE', 'RESOLVED', 'CLOSED'];

export default function TriagePage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const triageMut = useTriageIncident();
  const { data: lgas } = useLgas();

  const { data, isLoading } = useIncidents({
    status: statusFilter as any,
    pageSize: 100,
  });

  const rawIncidents = useMemo(() => data?.items ?? [], [data]);

  const incidents = useMemo(() => {
    return rawIncidents.filter((inc) => {
      const matchesSearch =
        !searchQuery ||
        inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLga = !selectedLga || inc.lgaId === selectedLga;
      return matchesSearch && matchesLga;
    });
  }, [rawIncidents, searchQuery, selectedLga]);

  const handleQuickTriage = async (id: string, priority: string) => {
    try {
      await triageMut.mutateAsync({ id, priority, credibility: 'C' });
    } catch (err) {
      console.error('Triage action failed:', err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 select-none">
      {/* ─── PAGE HEADER & SEARCH BAR ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">📋</span>
            <h1 className="text-xl font-bold uppercase tracking-wider text-white font-mono">
              Incident Triage & Verification Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Authenticate incoming field intelligence, assign DEFCON priorities, and authorize dispatches.
          </p>
        </div>

        {/* Search & LGA Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref or keywords..."
            className="c2-input text-xs w-48 md:w-56"
          />

          <select
            value={selectedLga}
            onChange={(e) => setSelectedLga(e.target.value)}
            className="c2-input text-xs w-36 bg-slate-950 text-slate-200"
          >
            <option value="">All LGAs</option>
            {lgas?.map((lga) => (
              <option key={lga.id} value={lga.id}>
                {lga.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── STATUS MATRIX TABS ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1">
        {STATUSES.map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-orange-500 text-orange-400 bg-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>

      {/* ─── INCIDENT LIST ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-mono">
          <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
          <div>QUERYING INCIDENT REPOSITORY...</div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="glass-card py-16 text-center text-slate-500 text-xs font-mono border-slate-800">
          <span className="text-3xl block mb-2">🛡️</span>
          NO INCIDENTS CURRENTLY IN [{statusFilter.replace(/_/g, ' ')}] QUEUE
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const cat = categoryMeta(inc.category as any);
            const prioCol = PRIORITY_COLOR[inc.priority] || '#64748B';

            return (
              <div
                key={inc.id}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="glass-card p-4 hover:border-slate-700 hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
              >
                {/* Left Priority Accent Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ background: prioCol }}
                />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pl-2">
                  {/* Core Incident Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="font-bold text-sm text-slate-100">{cat.label}</span>
                      <span className="text-xs font-mono text-slate-500">[{inc.reference}]</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                        style={{
                          background: `${prioCol}20`,
                          color: prioCol,
                          border: `1px solid ${prioCol}40`,
                        }}
                      >
                        {inc.priority} PRIORITY
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                      {inc.description}
                    </p>

                    {/* Telemetry Chips */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background: `${STATUS_COLOR[inc.status]}20`,
                          color: STATUS_COLOR[inc.status],
                        }}
                      >
                        {inc.status.replace(/_/g, ' ')}
                      </span>

                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background: `${CHANNEL_COLOR[inc.channel]}20`,
                          color: CHANNEL_COLOR[inc.channel],
                        }}
                      >
                        📡 {inc.channel}
                      </span>

                      <span>📍 {inc.geo ? `${inc.geo.lat.toFixed(3)}, ${inc.geo.lng.toFixed(3)}` : 'SECTOR'}</span>
                      <span>⏱ {timeAgo(inc.occurredAt)}</span>
                    </div>
                  </div>

                  {/* Quick Priority Action Pills for Pending */}
                  {inc.status === 'PENDING' && (
                    <div
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                        Authorize Priority
                      </span>
                      <div className="flex gap-1.5">
                        {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => handleQuickTriage(inc.id, p)}
                            disabled={triageMut.isPending}
                            className="w-8 h-8 rounded-lg text-xs font-mono font-bold text-white transition-all transform active:scale-95 shadow-md hover:brightness-110 disabled:opacity-50"
                            style={{ background: PRIORITY_COLOR[p] }}
                            title={`Authorize ${p}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
