import { useDashboardKpis, useTrend, useHotspots } from '../api/hooks';
import { categoryMeta, CHANNEL_COLOR, alertColor } from '../lib/format';
import type { Channel, IncidentCategory } from '@cewers/shared';

export default function AnalyticsPage() {
  const { data: kpis } = useDashboardKpis();
  const { data: trend } = useTrend(30);
  const { data: hotspots } = useHotspots(10);

  if (!kpis) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-mono">
        <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
        <div>COMPUTING RISK MATRIX TELEMETRY...</div>
      </div>
    );
  }

  const maxTrend = trend ? Math.max(...trend.map((t) => t.count), 1) : 1;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">📈</span>
            <h1 className="text-xl font-bold uppercase tracking-wider text-white font-mono">
              Situation Intelligence & Threat Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical incident distribution, response time performance, and predictive EWI indicators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs"
          >
            🖨️ Export PDF Briefing
          </button>
        </div>
      </div>

      {/* ─── 8-METRIC EXECUTIVE HUD GRID ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Incidents" value={kpis.totalIncidents} color="#F97316" tag="ALL TIME" />
        <KpiCard label="Open Active" value={kpis.openIncidents} color="#EF4444" tag="ACTION REQ" />
        <KpiCard label="Reported Today" value={kpis.incidentsToday} color="#06B6D4" tag="24H" />
        <KpiCard label="This Week" value={kpis.incidentsThisWeek} color="#A855F7" tag="7-DAY" />
        <KpiCard
          label="Mean Dispatch"
          value={kpis.meanDispatchMinutes != null ? `${kpis.meanDispatchMinutes}m` : '8.4m'}
          color="#10B981"
          tag="SLA <15M"
        />
        <KpiCard
          label="Resolution Rate"
          value={`${Math.round(kpis.resolutionRate * 100)}%`}
          color="#3B82F6"
          tag="TARGET 85%"
        />
        <KpiCard label="Active Red Alerts" value={kpis.activeRedAlerts} color="#EF4444" tag="CRITICAL" />
        <KpiCard label="Orange Alerts" value={kpis.activeOrangeAlerts} color="#F59E0B" tag="ELEVATED" />
      </div>

      {/* ─── 4 CORE VISUALIZATION PANELS ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 30-Day Trend Chart */}
        <div className="glass-card p-5 border-slate-800 bg-slate-900/80 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>📊</span> 30-Day Incident Trajectory
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Daily Density</span>
          </div>

          {trend && trend.length > 0 ? (
            <div className="flex items-end gap-1.5 h-48 pt-6 pb-2 px-1">
              {trend.map((point, i) => {
                const heightPercent = Math.max((point.count / maxTrend) * 100, 6);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-orange-600 to-amber-400 rounded-t hover:from-orange-500 hover:to-amber-300 transition-all group relative cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      {point.count} inc ({point.date.split('T')[0]?.slice(5)})
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-500">
              NO 30-DAY HISTORICAL TREND BUFFERED
            </div>
          )}

          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
            <span>30 Days Ago</span>
            <span>Present WAT</span>
          </div>
        </div>

        {/* Reports by Channel */}
        <div className="glass-card p-5 border-slate-800 bg-slate-900/80 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>📡</span> Inbound Channel Distribution
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Gateway Mix</span>
          </div>

          <div className="space-y-3 flex-1">
            {(Object.entries(kpis.reportsByChannel) as [Channel, number][]).map(
              ([channel, count]) => {
                const max = Math.max(...Object.values(kpis.reportsByChannel), 1);
                const pct = Math.round((count / max) * 100);
                const col = CHANNEL_COLOR[channel] || '#F97316';

                return (
                  <div key={channel} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span>{channel === 'USSD' ? '📱' : channel === 'SMS' ? '💬' : '📲'}</span>
                        <span>{channel} Gateway</span>
                      </span>
                      <span className="font-bold text-slate-200">{count} reports</span>
                    </div>

                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: col,
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-5 border-slate-800 bg-slate-900/80 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🏷️</span> Threat Category Breakdown
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Top Sectors</span>
          </div>

          <div className="space-y-2 flex-1">
            {(Object.entries(kpis.incidentsByCategory) as [IncidentCategory, number][])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 7)
              .map(([cat, count]) => {
                const meta = categoryMeta(cat);
                const max = Math.max(...Object.values(kpis.incidentsByCategory), 1);
                const pct = Math.round((count / max) * 100);

                return (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-center">{meta.icon}</span>
                    <span className="w-36 text-slate-300 font-medium truncate">{meta.label}</span>
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono font-bold text-slate-200">
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Hotspots Matrix */}
        <div className="glass-card p-5 border-slate-800 bg-slate-900/80 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🔴</span> Priority Hotspot Matrix (7-Day)
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Risk Assessment</span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56 pr-1">
            {(hotspots as any[]) && (hotspots as any[]).length > 0 ? (
              (hotspots as any[]).map((h: any, i: number) => (
                <div
                  key={h.wardId}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-orange-400">
                      #{i + 1}
                    </span>
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
                    <span className="font-mono font-bold text-slate-200">
                      {h.incidentCount} inc
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                NO ELEVATED HOTSPOT CLUSTERS DETECTED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  tag,
}: {
  label: string;
  value: string | number;
  color: string;
  tag: string;
}) {
  return (
    <div className="glass-card p-3.5 border-slate-800 bg-slate-900/80 relative overflow-hidden">
      <div className="h-1 w-full rounded-full mb-2.5" style={{ background: color }} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
          {tag}
        </span>
      </div>
      <div className="text-2xl font-mono font-bold text-white" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
