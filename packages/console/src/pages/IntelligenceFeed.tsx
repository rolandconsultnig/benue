/**
 * Intelligence Feed — C2 Tactical Early Warning & Field Intel Stream
 * Unified chronological telemetry stream combining field reports, threat level mutations, and EWI indicators.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents, useAlerts } from '../api/hooks';
import { categoryMeta, PRIORITY_COLOR, timeAgo, formatDateTime, alertColor } from '../lib/format';
import type { IncidentCategory } from '@cewers/shared';

type FeedItem = {
  id: string;
  timestamp: string;
  type: 'REPORT' | 'EWI' | 'ALERT' | 'RESPONSE';
  title: string;
  detail: string;
  location?: string;
  severity?: string;
  incidentId?: string;
  wardId?: string;
};

export default function IntelligenceFeed() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const { data: incidentsData } = useIncidents({ pageSize: 100 });
  const { data: alerts } = useAlerts();

  // Merge incidents + alert states into a unified feed
  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    // Incident reports
    for (const inc of incidentsData?.items ?? []) {
      const cat = categoryMeta(inc.category as IncidentCategory);
      items.push({
        id: `inc_${inc.id}`,
        timestamp: inc.occurredAt,
        type: 'REPORT',
        title: `${cat.icon} ${cat.label}`,
        detail: inc.description,
        severity: inc.priority,
        incidentId: inc.id,
        location: inc.lgaId,
      });
    }

    // Alert-level contributions (wards above GREEN)
    for (const alert of alerts ?? []) {
      if (alert.level === 'GREEN' || alert.score < 26) continue;
      items.push({
        id: `alert_${alert.wardId}`,
        timestamp: alert.computedAt,
        type: 'ALERT',
        title: `${alert.level} THREAT WARNING — ${alert.wardName}`,
        detail: `${alert.lgaName} Sector • EWI Risk Score ${alert.score}/100 • ${alert.contributingIndicators?.length ?? 0} active indicators detected`,
        location: alert.wardName,
        severity: alert.level,
        wardId: alert.wardId,
      });
    }

    let filtered = items;
    if (filterType !== 'ALL') {
      filtered = filtered.filter((i) => i.type === filterType);
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.detail.toLowerCase().includes(query) ||
          (i.location && i.location.toLowerCase().includes(query)),
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [incidentsData, alerts, filterType, search]);

  const typeColor: Record<string, string> = {
    REPORT: '#06B6D4',
    EWI: '#A855F7',
    ALERT: '#EF4444',
    RESPONSE: '#10B981',
  };

  const typeIcon: Record<string, string> = {
    REPORT: '📢',
    EWI: '📊',
    ALERT: '🚨',
    RESPONSE: '🚓',
  };

  return (
    <div className="flex flex-col h-full select-none overflow-hidden bg-[#070B12]">
      {/* ─── HEADER HUD ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0A0E1A] border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">📡</span>
            <h2 className="font-bold text-sm uppercase tracking-wider text-white font-mono">
              Field Intelligence & Early Warning Influx
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time chronological telemetry stream from OSINT, USSD, SMS, and field reconnaissance
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter intel stream..."
            className="c2-input text-xs w-44 md:w-56"
          />

          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            {['ALL', 'REPORT', 'ALERT'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  filterType === t
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CHRONOLOGICAL FEED STREAM ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5">
        {feed.length === 0 ? (
          <div className="glass-card py-20 text-center text-slate-500 text-xs font-mono border-slate-800">
            NO MATCHING INTELLIGENCE ENTRIES DETECTED
          </div>
        ) : (
          feed.map((item) => (
            <div
              key={item.id}
              onClick={() => item.incidentId && navigate(`/incidents/${item.incidentId}`)}
              className="glass-card p-3.5 flex items-start gap-3.5 hover:border-slate-700 hover:bg-slate-900/90 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Left Color Accent Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: typeColor[item.type] }}
              />

              {/* Icon & Time */}
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5 pl-1">
                <span className="text-xl">{typeIcon[item.type]}</span>
                <span className="text-[10px] font-mono text-slate-500 mt-1.5 whitespace-nowrap">
                  {timeAgo(item.timestamp)}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs text-slate-100 truncate">{item.title}</span>
                    {item.severity && item.type === 'ALERT' && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                        style={{
                          background: `${alertColor(item.severity)}20`,
                          color: alertColor(item.severity),
                          border: `1px solid ${alertColor(item.severity)}40`,
                        }}
                      >
                        {item.severity} ALERT
                      </span>
                    )}
                    {item.severity && item.type === 'REPORT' && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                        style={{
                          background: `${PRIORITY_COLOR[item.severity]}20`,
                          color: PRIORITY_COLOR[item.severity],
                          border: `1px solid ${PRIORITY_COLOR[item.severity]}40`,
                        }}
                      >
                        {item.severity}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                    {formatDateTime(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {item.detail}
                </p>

                {item.location && (
                  <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span>{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── FOOTER TELEMETRY ────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0A0E1A] border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs font-mono text-slate-500">
        <span>
          {feed.length} EVENTS BUFFERED • LATEST INTAKE: {feed[0] ? timeAgo(feed[0].timestamp) : '—'}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SOCKET TELEMETRY ACTIVE
        </span>
      </div>
    </div>
  );
}
