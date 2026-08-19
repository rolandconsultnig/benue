import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  useIncident,
  useAvailableResponders,
  useDispatchResponder,
  useUpdateIncident,
  useAddIncidentEvent,
  useSops,
} from '../api/hooks';
import {
  categoryMeta,
  PRIORITY_COLOR,
  STATUS_COLOR,
  CHANNEL_COLOR,
  formatDateTime,
  timeAgo,
} from '../lib/format';
import { IncidentStatus } from '@cewers/shared';

const STATUS_OPTIONS: IncidentStatus[] = [
  IncidentStatus.PENDING,
  IncidentStatus.IN_TRIAGE,
  IncidentStatus.DISPATCHED,
  IncidentStatus.ON_SCENE,
  IncidentStatus.RESOLVED,
  IncidentStatus.CLOSED,
  IncidentStatus.DISMISSED,
];

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: incident, isLoading } = useIncident(id);
  const { data: responders } = useAvailableResponders(incident?.lgaId);
  const { data: sops } = useSops(incident?.category);
  const dispatchMut = useDispatchResponder();
  const updateMut = useUpdateIncident();
  const addEventMut = useAddIncidentEvent();
  const [note, setNote] = useState('');

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-mono">
        <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
        <div>DECRYPTING INCIDENT TELEMETRY...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs font-mono">
        ⚠️ INCIDENT RECORD NOT FOUND IN DATABASE
      </div>
    );
  }

  const cat = categoryMeta(incident.category as any);
  const relevantSops = sops || [];

  const handleStatusChange = async (status: IncidentStatus) => {
    await updateMut.mutateAsync({ id: incident.id, status });
  };

  const handleDispatch = async (responderId: string) => {
    await dispatchMut.mutateAsync({ incidentId: incident.id, responderId });
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    await addEventMut.mutateAsync({ incidentId: incident.id, type: 'NOTE_ADDED', note });
    setNote('');
  };

  const prioCol = PRIORITY_COLOR[incident.priority] || '#64748B';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 select-none">
      {/* Back to Triage link */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost text-xs text-slate-400 hover:text-slate-200"
      >
        ← Return to Incident Queue
      </button>

      {/* ─── INCIDENT HEADER HUD ─────────────────────────────────────── */}
      <div className="glass-card p-5 md:p-6 border-slate-800 relative overflow-hidden bg-slate-900/90 shadow-2xl">
        <div
          className="absolute left-0 top-0 bottom-0 w-2"
          style={{ background: prioCol }}
        />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pl-2 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  {cat.label}
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    [{incident.reference}]
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sector: {incident.lgaId || 'Benue South'} • Zone C Homeland Security
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed max-w-3xl mt-2">
              {incident.description}
            </p>
          </div>

          <div
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase text-white flex-shrink-0 shadow-lg"
            style={{
              background: prioCol,
              boxShadow: `0 0 20px ${prioCol}40`,
            }}
          >
            {incident.priority} PRIORITY
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pl-2">
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase inline-block"
              style={{
                background: `${STATUS_COLOR[incident.status]}20`,
                color: STATUS_COLOR[incident.status],
              }}
            >
              {incident.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Channel</div>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase inline-block"
              style={{
                background: `${CHANNEL_COLOR[incident.channel]}20`,
                color: CHANNEL_COLOR[incident.channel],
              }}
            >
              📡 {incident.channel}
            </span>
          </div>

          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Credibility</div>
            <span className="font-bold text-orange-400">GRADE {incident.credibility}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Timestamp</div>
            <div className="text-slate-300 truncate">{formatDateTime(incident.occurredAt)}</div>
            <div className="text-[10px] text-slate-500">{timeAgo(incident.occurredAt)}</div>
          </div>
        </div>

        {/* Status Transition Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 pl-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">
            Advance Operational Status
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const active = s === incident.status;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={updateMut.isPending || active}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all ${
                    active
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── TWO COLUMN: AUDIT TIMELINE + DISPATCH / SOPS ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audit Timeline */}
        <div className="glass-card p-5 border-slate-800 bg-slate-900/80 flex flex-col">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>⏱️</span> Operational Event Timeline
          </h2>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-96 pr-2">
            {incident.events.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                  {i < incident.events.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-800 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {event.type.replace(/_/g, ' ')}
                  </div>
                  {event.note && (
                    <div className="text-xs text-slate-400 mt-1 p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      {event.note}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {event.actorName || 'C2 System'} • {formatDateTime(event.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Operator Note */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Log tactical note into event stream..."
              className="c2-input text-xs flex-1"
            />
            <button
              onClick={handleAddNote}
              disabled={!note.trim() || addEventMut.isPending}
              className="btn-secondary text-xs"
            >
              Log Note
            </button>
          </div>
        </div>

        {/* Dispatch Console + SOPs */}
        <div className="space-y-4">
          {/* Dispatch Responder Panel */}
          <div className="glass-card p-5 border-slate-800 bg-slate-900/80">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 pb-2 border-b border-slate-800 flex items-center gap-2">
              <span>🚓</span> Unit Dispatch Console
            </h2>

            {incident.assignedResponderId ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span>✓</span>
                <span>UNIT ASSIGNED AND DEPLOYED TO TARGET ZONE</span>
              </div>
            ) : responders && responders.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {responders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200 font-mono flex items-center gap-2">
                        <span>🚓</span>
                        <span>{r.callsign}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.agency} • {r.type}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDispatch(r.id)}
                      disabled={dispatchMut.isPending}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Authorize Dispatch →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-mono text-slate-500">
                No available units currently standing by in this LGA sector.
              </div>
            )}
          </div>

          {/* SOP Guidance Checklists */}
          {(relevantSops as any[]).length > 0 && (
            <div className="glass-card p-5 border-slate-800 bg-slate-900/80">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 pb-2 border-b border-slate-800 flex items-center gap-2">
                <span>⚙️</span> Standard Operating Procedures (SOP)
              </h2>
              <div className="space-y-3">
                {(relevantSops as any[]).map((sop: any) => (
                  <div
                    key={sop.code}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800"
                  >
                    <div className="font-bold text-xs text-orange-400 font-mono">
                      {sop.code}: {sop.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Lead: {sop.leadAgency} • Protocol Tier: {sop.defaultTier.replace(/_/g, ' ')}
                    </div>
                    <div className="mt-2 text-xs text-slate-300 space-y-1 pl-2 border-l border-slate-800">
                      {sop.steps.map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-orange-500 font-mono text-[10px]">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
