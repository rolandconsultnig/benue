/**
 * C2 VIDEO WALL — Benue South Senatorial District Operations Display
 *
 * Big-screen layout: one operational map, live info only.
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │ CLASSIFICATION BANNER                                        │
 *  ├─────────────────────────────────────────────────────────────┤
 *  │ STATUS BAND: ID • DEFCON • CRI • COUNTERS • LEDs • CHRONO    │
 *  ├───────────────────────────────────────────┬─────────────────┤
 *  │                                           │  LIVE TRACKS    │
 *  │        OPERATIONAL MAP                    │  (priority      │
 *  │        Benue South Senatorial District    │   ordered feed  │
 *  │        LGA tags • incident symbols        │   + force stats)│
 *  │        radar sweep • P1 ping              │                 │
 *  ├───────────────────────────────────────────┴─────────────────┤
 *  │ LIVE WIRE TICKER • UPTIME                                    │
 *  └─────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import {
  useIncidents,
  useLgas,
  useAlerts,
  useResponders,
  useDashboardKpis,
} from '../api/hooks';
import { api, getStoredUser } from '../api/client';
import { useAlarmStore } from '../store/alarms';
import { BENUE_SOUTH_CENTROID } from '@cewers/shared';
import {
  DEFCON_CONFIG,
  computeDefcon,
  computeCRI,
  BENUE_SOUTH_BOUNDS,
} from '../lib/tactical';
import { milStdIcon, categoryToAffiliation } from '../components/MilStdMarker';
import { categoryMeta, PRIORITY_COLOR, timeAgo } from '../lib/format';

const SYS_VERSION = 'v4.2.1';

const ALERT_COLOR: Record<string, string> = {
  RED: '#EF4444',
  ORANGE: '#F97316',
  YELLOW: '#EAB308',
  GREEN: '#22C55E',
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useUptime() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function C2VideoWall() {
  const navigate = useNavigate();
  const now = useClock();
  const uptime = useUptime();
  const operator = getStoredUser();

  const { data: kpis } = useDashboardKpis();
  const { data: lgas } = useLgas();
  const { data: alerts } = useAlerts();
  const { data: responders } = useResponders();
  const { data: incidentsData } = useIncidents({ pageSize: 200 });
  const { data: sysHealth } = useQuery({
    queryKey: ['c2', 'health'],
    queryFn: () => api.get<{ status?: string }>('/api/health'),
    refetchInterval: 30_000,
    retry: false,
  });
  const criticalAlarms = useAlarmStore(
    (s) => s.alarms.filter((a) => !a.acknowledged && a.severity === 'CRITICAL'),
  );

  const incidents = useMemo(
    () =>
      (incidentsData?.items ?? []).filter(
        (i) => !['CLOSED', 'DISMISSED'].includes(i.status),
      ),
    [incidentsData],
  );

  // Live rail — priority ordered, freshest first within each band
  const liveTracks = useMemo(() => {
    const order: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return [...incidents]
      .filter((i) => i.geo)
      .sort(
        (a, b) =>
          (order[a.priority] ?? 9) - (order[b.priority] ?? 9) ||
          +new Date(b.occurredAt) - +new Date(a.occurredAt),
      )
      .slice(0, 14);
  }, [incidents]);

  const p1Count = incidents.filter((i) => i.priority === 'P1').length;
  const p2Count = incidents.filter((i) => i.priority === 'P2').length;
  const defcon = computeDefcon(
    kpis?.openIncidents ?? 0,
    kpis?.activeRedAlerts ?? 0,
    kpis?.activeOrangeAlerts ?? 0,
    p1Count,
  );
  const dc = DEFCON_CONFIG[defcon];

  const cri = computeCRI({
    severity: Math.min(100, p1Count * 30 + p2Count * 15),
    density: Math.min(100, incidents.length * 3),
    credibility: 65,
    vulnerability: 70,
  });

  const deployed =
    responders?.filter((r) => ['DISPATCHED', 'ON_SCENE'].includes(r.status)).length ?? 0;
  const available = responders?.filter((r) => r.status === 'AVAILABLE').length ?? 0;
  const alertZones = (alerts ?? []).filter((a) => a.level !== 'GREEN').length;

  // Fullscreen control
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Ticker wire content
  const tickerItems = useMemo(() => {
    const items: string[] = [];
    for (const inc of incidents.slice(0, 12)) {
      const cat = categoryMeta(inc.category as any);
      items.push(
        `${inc.reference} ▸ ${cat.label.toUpperCase()} • ${inc.priority} • T-${timeAgo(inc.occurredAt).toUpperCase()}`,
      );
    }
    for (const a of (alerts ?? []).filter((a) => a.level !== 'GREEN').slice(0, 5)) {
      items.push(`ALERT ▸ ${a.level} POSTURE • ${a.lgaName.toUpperCase()} LGA`);
    }
    if (!items.length) items.push('ALL SENSORS NOMINAL • NO ACTIVE TRACKS • MONITORING CONTINUES');
    return items;
  }, [incidents, alerts]);

  const zulu = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });
  const wat = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour12: false });
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const watchNo = Math.floor(now.getUTCHours() / 12) + 1;

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden scanlines relative ${p1Count > 0 ? 'alert-edge' : ''}`}
      style={{ background: '#04070C' }}
    >
      {/* ═══ CLASSIFICATION BANNER ═════════════════════════════════ */}
      <div className="classification-bar flex-shrink-0 flex items-center justify-center h-[18px] relative z-[70]">
        <span className="text-[8.5px] font-mono font-bold tracking-[0.32em] uppercase">
          Restricted // For Official Use Only // CEWERS-C2 Situation Room
        </span>
      </div>

      {/* ═══ STATUS BAND ═══════════════════════════════════════════ */}
      <header
        className={`flex items-center justify-between px-5 py-2 border-b flex-shrink-0 relative z-[65] ${dc.glow}`}
        style={{
          borderColor: dc.color + '55',
          background: `linear-gradient(180deg, ${dc.bgColor}CC, #0A0F16)`,
        }}
      >
        {/* Left: Identity */}
        <div className="flex items-center gap-3.5 min-w-[290px]">
          <div
            className="flex items-center justify-center w-11 h-11 rounded border"
            style={{
              borderColor: dc.color + '66',
              background: dc.color + '14',
              boxShadow: `0 0 16px -4px ${dc.color}55`,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
                stroke={dc.color}
                strokeWidth="1.4"
                fill={dc.color + '22'}
              />
              <path d="M12 6v12M8 10h8" stroke={dc.color} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-[0.18em] leading-none" style={{ color: dc.color }}>
              CEWERS <span className="text-slate-100">C2</span>
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.22em] mt-1">
              Benue South Senatorial District • Zone C
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="zone-plate">SR-01</span>
              <span className="text-[8px] text-slate-500 mono uppercase">
                OP: {operator?.name?.toUpperCase() ?? 'UNKNOWN'} • WATCH {watchNo} • DOY {dayOfYear}
              </span>
            </div>
          </div>
        </div>

        {/* Center: DEFCON + CRI + Counters */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div
              className={`defcon-badge defcon-breathe text-xl ${defcon <= 2 ? 'blink-soft' : ''}`}
              style={{ background: dc.color, color: defcon === 3 || defcon === 5 ? '#0A0F16' : '#FFFFFF' }}
            >
              {dc.label}
            </div>
            <div className="text-[8px] text-slate-500 uppercase tracking-[0.16em] mt-1.5">
              {dc.description}
            </div>
          </div>

          <div className="w-px h-12 bg-slate-700/50" />

          <RiskGauge score={cri.score} color={cri.color} band={cri.band} />

          <div className="w-px h-12 bg-slate-700/50" />

          <div className="flex gap-6">
            <Counter label="P1 CRIT" value={p1Count} color="#EF4444" pulse={p1Count > 0} />
            <Counter label="OPEN" value={kpis?.openIncidents ?? 0} color="#F97316" />
            <Counter label="RED" value={kpis?.activeRedAlerts ?? 0} color="#DC2626" pulse={(kpis?.activeRedAlerts ?? 0) > 0} />
            <Counter label="ORANGE" value={kpis?.activeOrangeAlerts ?? 0} color="#D4875A" />
          </div>
        </div>

        {/* Right: Health + chrono + controls */}
        <div className="flex items-center gap-4 min-w-[270px] justify-end">
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'API LINK', ok: sysHealth !== undefined },
              { label: 'DATA FEED', ok: incidentsData !== undefined },
              { label: 'ALERT GRID', ok: alerts !== undefined },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={`led ${s.ok ? '' : 'led-down'}`} />
                <span className={`text-[8px] mono tracking-wider ${s.ok ? 'text-slate-500' : 'text-red-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="w-px h-12 bg-slate-700/50" />

          <div className="text-right">
            <div
              className="text-2xl font-mono font-bold tabular text-cyan-300 leading-none"
              style={{ textShadow: '0 0 14px rgba(6,182,212,0.45)' }}
            >
              {pad(now.getUTCHours())}:{pad(now.getUTCMinutes())}:{pad(now.getUTCSeconds())}
              <span className="text-cyan-600 text-base">Z</span>
            </div>
            <div className="text-[9px] text-slate-500 mono mt-1">
              {wat} WAT • {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={toggleFullscreen}
              className="text-[8px] mono text-slate-500 hover:text-cyan-300 border border-slate-700 hover:border-cyan-600 rounded px-1.5 py-0.5 transition-colors"
              title="Toggle fullscreen"
            >
              {isFs ? 'EXIT FS' : 'WALL FS'}
            </button>
            <button
              onClick={() => navigate('/app')}
              className="text-[8px] mono text-slate-500 hover:text-red-300 border border-slate-700 hover:border-red-600 rounded px-1.5 py-0.5 transition-colors"
              title="Exit C2 display"
            >
              STAND DOWN
            </button>
          </div>
        </div>
      </header>

      {/* Critical alarm flash band */}
      {criticalAlarms.length > 0 && (
        <div className="flex-shrink-0 relative z-[64] bg-red-950/90 border-y border-red-500/70 px-4 py-1 overflow-hidden">
          <div className="ticker-track" style={{ animationDuration: '22s' }}>
            {[...Array(2)].map((_, dup) => (
              <span key={dup} className="inline-flex items-center">
                {criticalAlarms.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-[11px] font-bold text-red-200 blink px-8">
                    <span className="text-red-400">◆ PRIORITY FLASH</span>
                    {a.title}: {a.message}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ MAIN: MAP + LIVE RAIL ═════════════════════════════════ */}
      <div className="flex-1 flex gap-1.5 p-1.5 min-h-0 relative z-[10]">
        {/* Operational map — the wall */}
        <MapZone
          incidents={incidents}
          lgas={lgas ?? []}
          responders={responders ?? []}
        />

        {/* Live tracks rail */}
        <LiveRail
          tracks={liveTracks}
          deployed={deployed}
          available={available}
          alertZones={alertZones}
          totalIncidents={incidents.length}
        />
      </div>

      {/* ═══ LIVE WIRE TICKER ══════════════════════════════════════ */}
      <footer className="flex-shrink-0 h-7 flex items-stretch border-t border-slate-800 bg-[#060B13] relative z-[10]">
        <div className="flex items-center gap-2 px-3 border-r border-slate-800 bg-cyan-950/40">
          <span className="led" />
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-cyan-300">LIVE WIRE</span>
        </div>
        <div className="flex-1 overflow-hidden flex items-center">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="text-[10px] mono text-slate-400 px-6 flex items-center gap-2">
                <span className="text-cyan-600">▸</span>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 border-l border-slate-800">
          <span className="text-[8px] mono text-slate-600 tracking-wider">UPTIME {uptime}</span>
          <span className="text-[8px] mono text-slate-700">CEWERS-C2 {SYS_VERSION}</span>
        </div>
      </footer>

      {/* Cinematic layers */}
      <div className="scan-beam" />
      <BootOverlay />
    </div>
  );
}

// ─── Boot Overlay ─────────────────────────────────────────────────────────────

function BootOverlay() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    // Hard removal backstop — the CSS fade-out normally finishes at 2.2s
    const id = setTimeout(() => setGone(true), 2600);
    return () => clearTimeout(id);
  }, []);
  if (gone) return null;
  const lines = [
    'CEWERS C2 KERNEL .................... ONLINE',
    'AUTHCRYPT LINK 256-BIT .............. SECURE',
    'GEOINT SENSOR GRID .................. SYNCED',
    'BENUE SOUTH DISTRICT FRAME .......... LOCKED',
    'MIL-STD-2525D SYMBOL LIBRARY ........ LOADED',
    'OPERATOR CONSOLE .................... READY',
  ];
  return (
    <div className="boot-overlay flex flex-col items-center justify-center gap-5">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
          stroke="#22D3EE"
          strokeWidth="1.2"
          fill="rgba(34,211,238,0.12)"
        />
        <path d="M12 6v12M8 10h8" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-extrabold tracking-[0.3em] text-cyan-300">CEWERS C2</div>
        <div className="text-[10px] mono text-slate-500 tracking-[0.35em] mt-1">
          BENUE SOUTH SENATORIAL DISTRICT • ZONE C
        </div>
      </div>
      <div className="w-[380px] space-y-1">
        {lines.map((l, i) => (
          <div
            key={l}
            className="boot-line text-[10px] mono text-cyan-600/90 flex justify-between"
            style={{ animationDelay: `${0.12 * i}s` }}
          >
            <span>{l.split(' ')[0]} {l.split(' ')[1] ?? ''}</span>
            <span className="text-emerald-500">{l.split('.').pop()?.trim()}</span>
          </div>
        ))}
        <div className="h-[3px] bg-slate-800/80 rounded-full overflow-hidden mt-3">
          <div className="boot-bar h-full bg-gradient-to-r from-cyan-600 to-cyan-300" />
        </div>
      </div>
    </div>
  );
}

// ─── Header widgets ───────────────────────────────────────────────────────────

function Counter({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean }) {
  return (
    <div className="text-center px-1">
      <div
        className={`text-2xl font-bold tabular mono leading-none ${pulse ? 'blink' : ''}`}
        style={{ color, textShadow: `0 0 12px ${color}66` }}
      >
        {value}
      </div>
      <div className="text-[7.5px] text-slate-500 uppercase tracking-[0.14em] mt-1.5">{label}</div>
    </div>
  );
}

function RiskGauge({ score, color, band }: { score: number; color: string; band: string }) {
  const ticks = 36;
  return (
    <div className="relative w-[76px] h-[76px]">
      <svg width="76" height="76" viewBox="0 0 76 76">
        {Array.from({ length: ticks }).map((_, i) => {
          const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
          const active = i / ticks <= score / 100;
          const r1 = 33, r2 = 36;
          return (
            <line
              key={i}
              x1={38 + r1 * Math.cos(a)} y1={38 + r1 * Math.sin(a)}
              x2={38 + r2 * Math.cos(a)} y2={38 + r2 * Math.sin(a)}
              stroke={active ? color : '#1E293B'}
              strokeWidth="1.6"
            />
          );
        })}
        <circle cx="38" cy="38" r="25" fill="none" stroke="#111C2E" strokeWidth="4" />
        <circle
          cx="38" cy="38" r="25" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={2 * Math.PI * 25}
          strokeDashoffset={2 * Math.PI * 25 - (score / 100) * 2 * Math.PI * 25}
          strokeLinecap="round" transform="rotate(-90 38 38)"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s', filter: `drop-shadow(0 0 5px ${color}AA)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold mono leading-none" style={{ color }}>{score}</span>
        <span className="text-[7px] text-slate-400 uppercase tracking-wider mt-1">{band}</span>
        <span className="text-[6px] text-slate-600 uppercase tracking-[0.2em] mt-px">CRI</span>
      </div>
    </div>
  );
}

// ─── Operational Map ──────────────────────────────────────────────────────────

function FitDistrict() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(BENUE_SOUTH_BOUNDS, { padding: [26, 26] });
  }, [map]);
  return null;
}

function MouseTracker({ onChange }: { onChange: (p: { lat: number; lng: number } | null) => void }) {
  useMapEvents({
    mousemove: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
    mouseout: () => onChange(null),
  });
  return null;
}

/** District LGA tag — name plate coloured by the LGA's live alert level. */
function lgaTagIcon(lga: any): L.DivIcon {
  const color = ALERT_COLOR[lga.currentAlertLevel] ?? ALERT_COLOR.GREEN;
  return L.divIcon({
    className: 'lga-tag',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;transform:translate(-50%,-50%);">
        <div style="width:7px;height:7px;border:1.5px solid ${color};background:${color}33;transform:rotate(45deg);box-shadow:0 0 8px -1px ${color};"></div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:0.22em;color:${color};text-shadow:0 0 4px #000,0 0 8px #000;white-space:nowrap;background:rgba(4,7,12,0.55);padding:1px 6px;border-radius:2px;border:1px solid ${color}44;">${lga.name.toUpperCase()}</div>
      </div>
    `,
    iconSize: [0, 0],
  });
}

function MapZone({ incidents, lgas, responders }: any) {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);

  const newestP1 = useMemo(
    () =>
      [...incidents]
        .filter((i: any) => i.priority === 'P1' && i.geo)
        .sort((a: any, b: any) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0],
    [incidents],
  );

  return (
    <div className="tac-panel hud-bracket relative flex-1 min-w-0 flex flex-col boot-in" style={{ animationDelay: '0.25s' }}>
      <div className="flex-1 min-h-0 relative">
        <MapContainer
          center={[BENUE_SOUTH_CENTROID.lat, BENUE_SOUTH_CENTROID.lng]}
          zoom={9}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitDistrict />
          <MouseTracker onChange={setCursor} />

          {/* LGA tags */}
          {lgas.map((lga: any) => (
            <Marker key={lga.id} position={[lga.centroid.lat, lga.centroid.lng]} icon={lgaTagIcon(lga)}>
              <Popup>
                <div className="text-xs">
                  <strong>{lga.name.toUpperCase()} LGA</strong><br />
                  <span className="text-gray-400">HQ {lga.capital}</span><br />
                  <span style={{ color: ALERT_COLOR[lga.currentAlertLevel] }}>
                    {lga.currentAlertLevel} POSTURE
                  </span>{' '}
                  • {lga.openIncidentCount} open incidents
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Newest P1 — expanding ping ring */}
          {newestP1?.geo && (
            <Marker
              position={[newestP1.geo.lat, newestP1.geo.lng]}
              interactive={false}
              icon={L.divIcon({
                html: '<div class="track-ping" style="width:46px;height:46px;margin:-23px 0 0 -23px"></div>',
                className: '',
                iconSize: [0, 0],
              })}
            />
          )}

          {/* Incident MIL-STD markers */}
          {incidents.filter((inc: any) => inc.geo).map((inc: any) => {
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
                  size: inc.priority === 'P1' ? 48 : 38,
                })}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>{cat.icon} {cat.label}</strong><br />
                    <span className="text-gray-400">{inc.reference} • {inc.priority}</span><br />
                    <span>{inc.status.replace(/_/g, ' ')} • {timeAgo(inc.occurredAt)}</span><br />
                    <button onClick={() => navigate(`/incidents/${inc.id}`)} className="text-cyan-400 mt-1">DETAIL →</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Blue force tracking */}
          {responders.filter((r: any) => r.geo).map((r: any) => (
            <Marker
              key={r.id}
              position={[r.geo.lat, r.geo.lng]}
              icon={milStdIcon({ affiliation: 'friendly', icon: 'B', label: r.callsign.split('-')[0], size: 26 })}
            >
              <Popup>
                <div className="text-xs">
                  <strong>🔵 {r.callsign}</strong><br />
                  <span className="text-gray-400">{r.agency} • {r.type}</span><br />
                  <span>{r.status}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Cinematic sensor overlays */}
        <div className="radar-sweep" />

        {/* HUD: NW — district plate & cursor readout */}
        <div className="absolute top-3 left-3 z-[10] pointer-events-none space-y-1">
          <div className="zone-plate" style={{ fontSize: '10px', padding: '2px 8px' }}>
            BENUE SOUTH SENATORIAL DISTRICT • ZONE C
          </div>
          <div className="text-[9px] text-cyan-500/80 mono leading-tight">
            {cursor
              ? `CUR ${cursor.lat.toFixed(4)}°N ${cursor.lng.toFixed(4)}°E`
              : '9 LGAs • AGATU • APA • ADO • OBI • OJU • OKPOKWU • OGBADIBO • OHIMINI • OTUKPO'}
          </div>
        </div>

        {/* HUD: NE — compass */}
        <div className="absolute top-3 right-3 z-[10] pointer-events-none flex flex-col items-center">
          <span className="text-cyan-400 text-sm leading-none">▲</span>
          <span className="text-[9px] mono text-cyan-500/80 tracking-widest">N</span>
        </div>

        {/* HUD: SW — affiliation legend */}
        <div className="absolute bottom-3 left-3 z-[10] pointer-events-none flex gap-3">
          {[
            { s: 'FRND', c: '#3B82F6' },
            { s: 'HOST', c: '#DC2626' },
            { s: 'NEUT', c: '#22C55E' },
            { s: 'UNK', c: '#EAB308' },
          ].map((x) => (
            <div key={x.s} className="flex items-center gap-1.5 text-[9px] mono" style={{ color: x.c + 'CC' }}>
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: x.c + '33', border: `1px solid ${x.c}` }} />
              {x.s}
            </div>
          ))}
        </div>

        {/* HUD: SE — sensor status */}
        <div className="absolute bottom-3 right-3 z-[10] pointer-events-none text-right">
          <div className="zone-plate inline-block">SENSOR SWEEP ACTIVE</div>
          <div className="text-[9px] text-cyan-600/80 mono mt-1">
            {incidents.length} TRACKS • {lgas.length} LGAS • SCAN 14S
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Tracks Rail ─────────────────────────────────────────────────────────

function LiveRail({ tracks, deployed, available, alertZones, totalIncidents }: any) {
  const navigate = useNavigate();
  return (
    <div className="tac-panel w-[340px] flex-shrink-0 flex flex-col min-h-0 boot-in" style={{ animationDelay: '0.33s' }}>
      <div className="tac-panel-header py-2">
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200">Live Tracks</span>
          <span className="zone-plate">{totalIncidents} ACTIVE</span>
        </span>
        <span className="led" />
      </div>

      {/* Force posture chips */}
      <div className="grid grid-cols-3 gap-1.5 p-2 border-b border-slate-800/80">
        {[
          { label: 'DEPLOYED', value: deployed, color: '#F97316' },
          { label: 'READY', value: available, color: '#22C55E' },
          { label: 'ALERT ZONES', value: alertZones, color: '#DC2626' },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center rounded-md py-1.5"
            style={{ background: s.color + '10', border: `1px solid ${s.color}35` }}
          >
            <div className="text-lg font-bold mono leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[7.5px] text-slate-500 uppercase tracking-[0.12em] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Priority-ordered live feed */}
      <div className="flex-1 overflow-auto space-y-1 p-1.5">
        {tracks.map((inc: any) => {
          const cat = categoryMeta(inc.category as any);
          return (
            <button
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-white/5 border-l-[3px] text-left transition-colors"
              style={{ borderLeftColor: PRIORITY_COLOR[inc.priority] }}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-slate-200 truncate">{cat.label}</div>
                <div className="text-[9px] text-slate-500 mono mt-0.5">
                  {inc.reference} • {inc.channel} • {inc.status.replace(/_/g, ' ').toLowerCase()}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-[9px] mono font-bold" style={{ color: PRIORITY_COLOR[inc.priority] }}>
                  {inc.priority}
                </span>
                <span className="text-[8.5px] text-slate-500 mt-0.5">{timeAgo(inc.occurredAt)}</span>
              </div>
            </button>
          );
        })}
        {tracks.length === 0 && (
          <div className="text-center text-slate-600 text-[11px] py-8 mono">NO ACTIVE TRACKS — MONITORING</div>
        )}
      </div>
    </div>
  );
}
