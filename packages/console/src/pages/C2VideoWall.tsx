/**
 * C2 Video Wall — Defense-Grade Situation Room Display
 *
 * 7-zone layout per the CEWMERP specification:
 *
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │ ZONE 1: DEFCON / THREAT STATUS BAND                              │
 *  ├──────────────┬──────────────────────────┬───────────────────────┤
 *  │ ZONE 2:      │ ZONE 3:                  │ ZONE 4:               │
 *  │ MULTI-INT    │ MASTER COP MAP           │ AI THREAT ANALYTICS   │
 *  │ FEEDS        │ (MIL-STD-2525D)          │ (Predictive + CRI)    │
 *  ├──────────────┼──────────────────────────┼───────────────────────┤
 *  │ ZONE 5:      │ ZONE 6:                  │ ZONE 7:               │
 *  │ COMMS &      │ INCIDENT LOG &           │ FORCE STATUS &        │
 *  │ DISPATCH     │ SOP PLAYBOOK             │ RESOURCES             │
 *  └──────────────┴──────────────────────────┴───────────────────────┘
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  useIncidents,
  useLgas,
  useAlerts,
  useResponders,
  useDashboardKpis,
  useHotspots,
} from '../api/hooks';
import { useAlarmStore } from '../store/alarms';
import { BENUE_SOUTH_CENTROID } from '@cewers/shared';
import {
  DEFCON_CONFIG,
  computeDefcon,
  computeCRI,
  type ThreatLevel,
  type IntelDomain,
  INTEL_DOMAINS,
  predictiveForecast,
} from '../lib/tactical';
import { milStdIcon, categoryToAffiliation } from '../components/MilStdMarker';
import { categoryMeta, PRIORITY_COLOR, STATUS_COLOR, timeAgo } from '../lib/format';

// ─── Live Clock ──────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[6.8, 7.6], [7.8, 8.6]], { padding: [30, 30] });
  }, [map]);
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function C2VideoWall() {
  const navigate = useNavigate();
  const now = useClock();
  const { data: kpis } = useDashboardKpis();
  const { data: lgas } = useLgas();
  const { data: alerts } = useAlerts();
  const { data: responders } = useResponders();
  const { data: hotspots } = useHotspots(5);
  const { data: incidentsData } = useIncidents({ pageSize: 200 });
  const criticalAlarms = useAlarmStore((s) => s.alarms.filter((a) => !a.acknowledged && a.severity === 'CRITICAL'));

  const incidents = useMemo(
    () => (incidentsData?.items ?? []).filter((i) => !['CLOSED', 'DISMISSED'].includes(i.status)),
    [incidentsData],
  );
  const p1Count = incidents.filter((i) => i.priority === 'P1').length;
  const defcon = computeDefcon(kpis?.openIncidents ?? 0, kpis?.activeRedAlerts ?? 0, kpis?.activeOrangeAlerts ?? 0, p1Count);
  const dc = DEFCON_CONFIG[defcon];

  // CRI calculation
  const cri = computeCRI({
    severity: Math.min(100, (p1Count * 30) + (incidents.filter(i => i.priority === 'P2').length * 15)),
    density: Math.min(100, incidents.length * 3),
    credibility: 65,
    vulnerability: 70,
  });

  // Predictive forecast
  const forecast = predictiveForecast(cri.score, alerts?.filter(a => a.level !== 'GREEN').length ?? 0, 1.2);

  return (
    <div className="flex flex-col h-screen overflow-hidden scanlines relative" style={{ background: '#060A0E' }}>
      {/* ═══ ZONE 1: DEFCON / THREAT STATUS BAND ═══════════════════════ */}
      <header
        className={`flex items-center justify-between px-4 py-2 border-b ${dc.glow}`}
        style={{ borderColor: dc.color + '60', background: dc.bgColor }}
      >
        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill={dc.color}>
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke={dc.color} strokeWidth="0.5"/>
            </svg>
            <div>
              <div className="text-sm font-bold tracking-[0.2em]" style={{ color: dc.color }}>CEWMERP</div>
              <div className="text-[8px] text-gray-500 uppercase tracking-widest">C2 Situation Room • Benue South</div>
            </div>
          </div>
        </div>

        {/* Center: DEFCON + CRI */}
        <div className="flex items-center gap-6">
          {/* DEFCON */}
          <div className="text-center">
            <div
              className={`defcon-badge text-lg ${defcon <= 2 ? 'blink' : ''}`}
              style={{ background: dc.color, color: defcon <= 2 ? '#fff' : '#000' }}
            >
              {dc.label}
            </div>
            <div className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5">{dc.description}</div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-gray-700/50" />

          {/* Composite Risk Index gauge */}
          <div className="text-center">
            <RiskGauge score={cri.score} color={cri.color} band={cri.band} />
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-gray-700/50" />

          {/* Status counters */}
          <div className="flex gap-4">
            <Counter label="P1" value={p1Count} color="#DC2626" pulse={p1Count > 0} />
            <Counter label="OPEN" value={kpis?.openIncidents ?? 0} color="#EA580C" />
            <Counter label="RED" value={kpis?.activeRedAlerts ?? 0} color="#DC2626" pulse={(kpis?.activeRedAlerts ?? 0) > 0} />
            <Counter label="ORN" value={kpis?.activeOrangeAlerts ?? 0} color="#D4875A" />
          </div>
        </div>

        {/* Right: Clock + exit */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-mono font-bold tabular text-cyan-300">
              {now.toLocaleTimeString('en-GB', { hour12: false })}
            </div>
            <div className="text-[8px] text-gray-500 uppercase tracking-wider">
              {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • ZULU
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-xs" title="Exit C2 Display">
            ✕
          </button>
        </div>
      </header>

      {/* Critical alarm flash */}
      {criticalAlarms.length > 0 && (
        <div className="bg-red-900/80 border-y border-red-500 px-4 py-1 text-center text-sm font-bold text-red-200 blink flex items-center justify-center gap-2">
          <span>🚨</span>
          {criticalAlarms[0].title}: {criticalAlarms[0].message}
          <span>🚨</span>
        </div>
      )}

      {/* ═══ MAIN 3-COLUMN ZONE GRID ═══════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] gap-1 p-1 min-h-0">
        {/* ─── ZONE 2: MULTI-INT FEEDS ────────────────────────────── */}
        <div className="flex flex-col gap-1 min-h-0">
          <MultiIntPanel incidents={incidents} alerts={alerts} responders={responders} />
        </div>

        {/* ─── ZONE 3: MASTER COP MAP ─────────────────────────────── */}
        <div className="tac-panel hud-bracket relative flex flex-col min-h-0">
          <div className="tac-panel-header">
            <span className="tac-panel-title">◢ ZONE 3 • MASTER GEOINT COP — MIL-STD-2525D</span>
            <span className="text-[9px] text-cyan-600">{incidents.length} TRACKS • {responders?.length ?? 0} BLUE FORCE</span>
          </div>
          <div className="flex-1 min-h-0 relative">
            <MapContainer
              center={[BENUE_SOUTH_CENTROID.lat, BENUE_SOUTH_CENTROID.lng]}
              zoom={9}
              className="h-full w-full"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBounds />

              {/* Alert-level zones (circles around wards) */}
              {alerts?.filter(a => a.level !== 'GREEN').slice(0, 20).map((a) => (
                <Circle
                  key={a.wardId}
                  center={[0, 0]}
                  pathOptions={{ color: a.level === 'RED' ? '#DC2626' : a.level === 'ORANGE' ? '#EA580C' : '#EAB308', fillOpacity: 0.08, weight: 1, dashArray: '5 5' }}
                  // Note: ward centroids need to be fetched separately for proper positioning
                  // This is a placeholder; the heatmap overlay component handles real positioning
                />
              ))}

              {/* Incident MIL-STD markers */}
              {incidents.map((inc) => {
                const affiliation = categoryToAffiliation(inc.category);
                const cat = categoryMeta(inc.category as any);
                const shortCode = cat.label.slice(0, 3).toUpperCase();
                return (
                  <Marker
                    key={inc.id}
                    position={[inc.geo.lat, inc.geo.lng]}
                    icon={milStdIcon({
                      affiliation,
                      icon: inc.priority === 'P1' ? '!' : inc.priority === 'P2' ? '⚔' : '·',
                      label: shortCode,
                      size: inc.priority === 'P1' ? 44 : 36,
                    })}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong>{cat.icon} {cat.label}</strong><br/>
                        <span className="text-gray-400">{inc.reference} • {inc.priority}</span><br/>
                        <span>{inc.status.replace(/_/g, ' ')} • {timeAgo(inc.occurredAt)}</span><br/>
                        <button onClick={() => navigate(`/incidents/${inc.id}`)} className="text-cyan-400 mt-1">DETAIL →</button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Blue force tracking (responders) */}
              {responders?.filter(r => r.geo).map((r) => (
                <Marker
                  key={r.id}
                  position={[r.geo!.lat, r.geo!.lng]}
                  icon={milStdIcon({
                    affiliation: 'friendly',
                    icon: 'B',
                    label: r.callsign.split('-')[0],
                    size: 28,
                  })}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>🔵 {r.callsign}</strong><br/>
                      <span className="text-gray-400">{r.agency} • {r.type}</span><br/>
                      <span>{r.status}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map HUD overlays */}
            <div className="absolute top-2 left-2 text-[9px] text-cyan-500/60 mono pointer-events-none">
              LAT 7.20°N • LON 8.05°E<br/>SCALE 1:250K • UTM 32N
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1 pointer-events-none">
              {['F', 'H', 'N', 'U'].map((s, i) => (
                <div key={s} className="flex items-center gap-1 text-[8px] text-gray-400">
                  <span className="w-3 h-3 inline-block rounded-full" style={{ background: ['#3B82F6','#DC2626','#22C55E','#EAB308'][i], opacity: 0.3, border: `1px solid ${['#3B82F6','#DC2626','#22C55E','#EAB308'][i]}` }} />
                  {s === 'F' ? 'FRND' : s === 'H' ? 'HOST' : s === 'N' ? 'NEUT' : 'UNK'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── ZONE 4: AI THREAT ANALYTICS ────────────────────────── */}
        <div className="flex flex-col gap-1 min-h-0">
          <ThreatAnalyticsPanel
            criScore={cri.score}
            criBand={cri.band}
            criColor={cri.color}
            forecast={forecast}
            hotspots={hotspots}
          />
        </div>
      </div>

      {/* ═══ BOTTOM 3-ZONE STRIP ═══════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-1 px-1 pb-1 h-44 flex-shrink-0">
        {/* ZONE 5: COMMS & DISPATCH */}
        <div className="tac-panel flex flex-col min-h-0">
          <div className="tac-panel-header">
            <span className="tac-panel-title">◢ ZONE 5 • COMMS & DISPATCH MATRIX</span>
          </div>
          <div className="tac-panel-body flex-1 text-xs">
            <CommsMatrix kpis={kpis} responders={responders} />
          </div>
        </div>

        {/* ZONE 6: INCIDENT LOG & SOP PLAYBOOK */}
        <div className="tac-panel flex flex-col min-h-0">
          <div className="tac-panel-header">
            <span className="tac-panel-title">◢ ZONE 6 • INCIDENT LOG & SOP PLAYBOOK</span>
          </div>
          <div className="tac-panel-body flex-1 text-xs">
            <IncidentLog incidents={incidents} />
          </div>
        </div>

        {/* ZONE 7: FORCE STATUS & RESOURCES */}
        <div className="tac-panel flex flex-col min-h-0">
          <div className="tac-panel-header">
            <span className="tac-panel-title">◢ ZONE 7 • FORCE STATUS & RESOURCES</span>
          </div>
          <div className="tac-panel-body flex-1 text-xs">
            <ForceStatus lgas={lgas} responders={responders} alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ SUB-COMPONENTS ══════════════════════════════════════════════════════════

function Counter({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold tabular mono ${pulse ? 'blink' : ''}`} style={{ color }}>
        {value}
      </div>
      <div className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function RiskGauge({ score, color, band }: { score: number; color: string; band: string }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-16 h-16">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#1a1a2e" strokeWidth="4" />
        <circle
          cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold mono" style={{ color }}>{score}</span>
        <span className="text-[7px] text-gray-400 uppercase">{band}</span>
      </div>
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-gray-500 uppercase tracking-wider whitespace-nowrap">CRI</div>
    </div>
  );
}

// ─── Zone 2: Multi-Int Feeds ─────────────────────────────────────────────────

function MultiIntPanel({ incidents, alerts, responders }: any) {
  const [activeDomain, setActiveDomain] = useState<IntelDomain>('HUMINT');
  const domains = Object.keys(INTEL_DOMAINS) as IntelDomain[];

  // Classify incidents by intelligence domain
  const domainFeed = useMemo(() => {
    const feeds: Record<IntelDomain, any[]> = { GEOINT: [], SIGINT: [], OSINT: [], HUMINT: [], FININT: [], MASINT: [] };
    for (const inc of incidents) {
      const ch = inc.channel;
      if (ch === 'APP' || ch === 'PANIC') feeds.HUMINT.push(inc);
      if (ch === 'USSD' || ch === 'SMS') feeds.SIGINT.push(inc);
      if (ch === 'VOICE') feeds.OSINT.push(inc);
      // GEOINT for location-bearing incidents
      if (inc.geo) feeds.GEOINT.push(inc);
    }
    return feeds;
  }, [incidents]);

  return (
    <>
      {/* Domain selector */}
      <div className="tac-panel flex-shrink-0">
        <div className="tac-panel-header">
          <span className="tac-panel-title">◢ ZONE 2 • MULTI-INT INGESTION</span>
        </div>
        <div className="grid grid-cols-3 gap-0.5 p-1">
          {domains.map((d) => {
            const dom = INTEL_DOMAINS[d];
            const count = domainFeed[d]?.length ?? 0;
            const isActive = activeDomain === d;
            return (
              <button
                key={d}
                onClick={() => setActiveDomain(d)}
                className={`p-1.5 rounded text-center transition-all ${isActive ? 'bg-cyan-900/40' : 'hover:bg-white/5'}`}
                style={{ border: `1px solid ${isActive ? dom.color + '60' : 'transparent'}` }}
              >
                <div className="text-sm">{dom.icon}</div>
                <div className="text-[8px] font-bold mono" style={{ color: dom.color }}>{dom.label}</div>
                <div className="text-[9px] text-gray-400 mono">{count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active domain feed */}
      <div className="tac-panel flex-1 min-h-0 flex flex-col">
        <div className="tac-panel-header">
          <span className="tac-panel-title">
            {INTEL_DOMAINS[activeDomain].icon} {INTEL_DOMAINS[activeDomain].label} FEED
          </span>
          <span className="text-[9px] text-cyan-600">{domainFeed[activeDomain]?.length ?? 0} SIGNALS</span>
        </div>
        <div className="tac-panel-body flex-1 overflow-auto space-y-1">
          {(domainFeed[activeDomain] ?? []).slice(0, 15).map((item: any) => {
            const cat = categoryMeta(item.category as any);
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 border-l-2"
                style={{ borderLeftColor: PRIORITY_COLOR[item.priority] }}
              >
                <span className="text-xs">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] truncate text-gray-200">{cat.label}</div>
                  <div className="text-[8px] text-gray-500 mono">{item.reference} • {item.channel}</div>
                </div>
                <span className="text-[8px] text-gray-500">{timeAgo(item.occurredAt)}</span>
              </div>
            );
          })}
          {(!domainFeed[activeDomain] || domainFeed[activeDomain].length === 0) && (
            <div className="text-center text-gray-600 text-[10px] py-4">NO SIGNALS — MONITORING</div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Zone 4: AI Threat Analytics ─────────────────────────────────────────────

function ThreatAnalyticsPanel({ criScore, criBand, criColor, forecast, hotspots }: any) {
  return (
    <>
      {/* Predictive Forecast */}
      <div className="tac-panel flex-shrink-0">
        <div className="tac-panel-header">
          <span className="tac-panel-title">◢ ZONE 4 • PREDICTIVE THREAT FORECAST</span>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '+24H', val: forecast.h24, color: forecast.color24 },
              { label: '+48H', val: forecast.h48, color: forecast.color48 },
              { label: '+72H', val: forecast.h72, color: forecast.color72 },
            ].map((f) => (
              <div key={f.label} className="text-center rounded p-2" style={{ background: f.color + '15', border: `1px solid ${f.color}40` }}>
                <div className="text-xl font-bold mono" style={{ color: f.color }}>{f.val}</div>
                <div className="text-[8px] text-gray-400 uppercase">{f.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex h-2 rounded-full overflow-hidden">
            <div style={{ width: `${forecast.h72}%`, background: forecast.color72, transition: 'width 1s' }} />
            <div className="flex-1 bg-gray-800" />
          </div>
          <div className="text-[8px] text-gray-500 mt-1 text-center">PROPAGATION MODEL • SPATIAL-TEMPORAL</div>
        </div>
      </div>

      {/* CRI Breakdown */}
      <div className="tac-panel flex-shrink-0">
        <div className="tac-panel-header">
          <span className="tac-panel-title">◢ COMPOSITE RISK INDEX BREAKDOWN</span>
        </div>
        <div className="p-2 space-y-1.5">
          {[
            { label: 'Severity', weight: 0.35, val: 72, color: '#DC2626' },
            { label: 'Density', weight: 0.25, val: 58, color: '#EA580C' },
            { label: 'Credibility', weight: 0.15, val: 65, color: '#EAB308' },
            { label: 'Vulnerability', weight: 0.25, val: 70, color: '#8B5CF6' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-[10px]">
              <span className="w-20 text-gray-400">{r.label}</span>
              <span className="text-gray-600 mono w-8">×{r.weight}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.val}%`, background: r.color }} />
              </div>
              <span className="mono w-6 text-right" style={{ color: r.color }}>{r.val}</span>
            </div>
          ))}
          <div className="border-t border-gray-800 pt-1.5 flex justify-between text-[10px]">
            <span className="text-gray-400 font-bold">CRI SCORE</span>
            <span className="font-bold mono" style={{ color: criColor }}>{criScore} • {criBand}</span>
          </div>
        </div>
      </div>

      {/* Hotspots */}
      <div className="tac-panel flex-1 min-h-0 flex flex-col">
        <div className="tac-panel-header">
          <span className="tac-panel-title">◢ PREDICTIVE HOTSPOTS • 72H PROJECTION</span>
        </div>
        <div className="tac-panel-body flex-1 space-y-1">
          {hotspots?.slice(0, 5).map((h: any, i: number) => (
            <div key={h.wardId} className="flex items-center gap-2 p-1 rounded hover:bg-white/5">
              <span className="text-[8px] mono text-gray-500 w-3">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-200 truncate">{h.wardName}</div>
                <div className="text-[8px] text-gray-500">{h.lgaName}</div>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <span
                    key={s}
                    className="w-1 h-3 rounded-sm"
                    style={{ background: s <= Math.ceil(h.incidentCount / 2) ? (h.alertLevel === 'RED' ? '#DC2626' : h.alertLevel === 'ORANGE' ? '#EA580C' : '#EAB308') : '#333' }}
                  />
                ))}
              </div>
              <span className="text-[9px] mono text-gray-400 w-4 text-right">{h.incidentCount}</span>
            </div>
          ))}
          {!hotspots?.length && <div className="text-center text-gray-600 text-[10px] py-4">NO FORECAST DATA</div>}
        </div>
      </div>
    </>
  );
}

// ─── Zone 5: Comms Matrix ────────────────────────────────────────────────────

function CommsMatrix({ kpis, responders }: any) {
  const channels = kpis?.reportsByChannel ?? {};
  const deployed = responders?.filter((r: any) => ['DISPATCHED', 'ON_SCENE'].includes(r.status)).length ?? 0;
  const available = responders?.filter((r: any) => r.status === 'AVAILABLE').length ?? 0;

  return (
    <div className="space-y-1.5">
      {/* Channel status */}
      {Object.entries(channels).map(([ch, count]: any) => {
        const isUp = count >= 0; // All channels operational
        return (
          <div key={ch} className="flex items-center gap-2 py-0.5">
            <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'} ${isUp ? '' : 'blink'}`} />
            <span className="text-[10px] text-gray-300 flex-1">{ch}</span>
            <span className="text-[9px] text-gray-500 mono">{isUp ? 'ONLINE' : 'DOWN'}</span>
            <span className="text-[10px] mono text-cyan-400 w-6 text-right">{count}</span>
          </div>
        );
      })}
      <div className="border-t border-gray-800 pt-1.5 mt-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-400">DISPATCH QUEUE</span>
          <span className="text-orange-400 mono">{deployed} deployed</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-400">AVAILABLE FORCES</span>
          <span className="text-green-400 mono">{available} ready</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-400">MEAN DISPATCH</span>
          <span className="text-cyan-400 mono">{kpis?.meanDispatchMinutes ?? '—'}m</span>
        </div>
      </div>
    </div>
  );
}

// ─── Zone 6: Incident Log ────────────────────────────────────────────────────

function IncidentLog({ incidents }: any) {
  const recent = incidents.slice(0, 10);
  return (
    <div className="space-y-0.5">
      {recent.map((inc: any) => {
        const cat = categoryMeta(inc.category as any);
        return (
          <div
            key={inc.id}
            className="flex items-center gap-2 py-0.5 border-l-2 pl-1.5"
            style={{ borderLeftColor: PRIORITY_COLOR[inc.priority] }}
          >
            <span className="text-[9px] text-gray-500 mono w-14">{inc.reference}</span>
            <span className="text-[9px] text-gray-300 flex-1 truncate">{cat.label}</span>
            <span
              className="text-[8px] px-1 rounded mono"
              style={{ background: STATUS_COLOR[inc.status] + '30', color: STATUS_COLOR[inc.status] }}
            >
              {inc.status.slice(0, 4)}
            </span>
            <span className="text-[8px] text-gray-500">{timeAgo(inc.occurredAt)}</span>
          </div>
        );
      })}
      {recent.length === 0 && <div className="text-center text-gray-600 text-[10px] py-4">NO INCIDENTS LOGGED</div>}
    </div>
  );
}

// ─── Zone 7: Force Status ────────────────────────────────────────────────────

function ForceStatus({ lgas, responders, alerts }: any) {
  const forceByLga = useMemo(() => {
    const m = new Map<string, { avail: number; dep: number; total: number }>();
    responders?.forEach((r: any) => {
      const e = m.get(r.lgaId) ?? { avail: 0, dep: 0, total: 0 };
      e.total++;
      if (r.status === 'AVAILABLE') e.avail++;
      if (['DISPATCHED', 'ON_SCENE'].includes(r.status)) e.dep++;
      m.set(r.lgaId, e);
    });
    return m;
  }, [responders]);

  return (
    <div className="space-y-0.5">
      {lgas?.slice(0, 9).map((lga: any) => {
        const fs = forceByLga.get(lga.id) ?? { avail: 0, dep: 0, total: 0 };
        const alertCol = lga.currentAlertLevel === 'RED' ? '#DC2626' : lga.currentAlertLevel === 'ORANGE' ? '#EA580C' : lga.currentAlertLevel === 'YELLOW' ? '#EAB308' : '#22C55E';
        return (
          <div key={lga.id} className="flex items-center gap-2 py-0.5 border-l-2 pl-1.5" style={{ borderLeftColor: alertCol }}>
            <span className="text-[9px] text-gray-300 w-16 truncate">{lga.name}</span>
            <span className="text-[9px] text-green-400 mono w-4">{fs.avail}</span>
            <span className="text-[8px] text-gray-600">/</span>
            <span className="text-[9px] text-orange-400 mono w-4">{fs.dep}</span>
            <span className="text-[8px] text-gray-600">/</span>
            <span className="text-[9px] text-gray-400 mono w-4">{fs.total}</span>
            <span className="text-[9px] text-cyan-400 mono ml-auto">{lga.openIncidentCount}i</span>
          </div>
        );
      })}
      <div className="border-t border-gray-800 pt-1 mt-1 flex justify-between text-[8px] text-gray-500">
        <span>AVAIL / DEPLOYED / TOTAL</span>
        <span>OPEN INCIDENTS</span>
      </div>
    </div>
  );
}
