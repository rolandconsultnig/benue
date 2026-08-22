/**
 * Monitoring System Display — full-screen window for a single sensor system.
 *
 * Routes: /systems/drone | camera | trespass | gunshot | metal
 * Each runs in its own dedicated window (launched from the Monitoring Hub).
 * Feeds are simulated until physical sensors are integrated.
 */

import { useState, useEffect, useMemo, Fragment, type ReactNode } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { BENUE_SOUTH_CENTROID } from '@cewers/shared';
import { BENUE_SOUTH_BOUNDS } from '../lib/tactical';
import { MONITOR_SYSTEMS, type MonitorSystemId } from '../lib/monitor';

// ─── Sim helpers ──────────────────────────────────────────────────────────────

function stamp(d = new Date()) {
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

interface SimEvent {
  id: number;
  time: string;
  text: string;
  severity: 'INFO' | 'WARN' | 'ALERT';
}

let simSeq = 0;

/** Pushes a synthetic feed event every `ms`, keeping the last `cap`. */
function useSimFeed(make: () => Omit<SimEvent, 'id' | 'time'>, ms: number, cap = 24, seed = 4) {
  const mk = (): SimEvent => ({ id: ++simSeq, time: stamp(), ...make() });
  const [items, setItems] = useState<SimEvent[]>(() =>
    Array.from({ length: seed }, () => mk()).sort((a, b) => (a.time < b.time ? 1 : -1)),
  );
  useEffect(() => {
    const id = setInterval(() => setItems((prev) => [mk(), ...prev].slice(0, cap)), ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return items;
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const SEV_COLOR: Record<SimEvent['severity'], string> = {
  INFO: '#64748B',
  WARN: '#F59E0B',
  ALERT: '#EF4444',
};

// ─── Shell ────────────────────────────────────────────────────────────────────

function MonitorShell({
  id,
  children,
  events,
}: {
  id: MonitorSystemId;
  children: ReactNode;
  events: SimEvent[];
}) {
  const meta = MONITOR_SYSTEMS[id];
  const now = useNow();
  const zulu = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });
  const wat = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour12: false });

  const ticker = events.length
    ? events.map((e) => `${e.time} ▸ ${e.text}`)
    : ['ALL SENSOR NODES NOMINAL • MONITORING CONTINUES'];

  return (
    <div className="flex flex-col h-screen overflow-hidden scanlines relative" style={{ background: '#04070C' }}>
      {/* Classification */}
      <div className="classification-bar flex-shrink-0 flex items-center justify-center h-[18px] relative z-[70]">
        <span className="text-[8.5px] font-mono font-bold tracking-[0.32em] uppercase">
          Restricted // For Official Use Only // CEWERS-C2 Monitoring
        </span>
      </div>

      {/* System header */}
      <header
        className="flex items-center justify-between px-5 py-2 border-b flex-shrink-0 relative z-[65]"
        style={{
          borderColor: meta.color + '44',
          background: `linear-gradient(180deg, ${meta.color}12, #0A0F16)`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="flex items-center justify-center w-11 h-11 rounded border text-xl"
            style={{ borderColor: meta.color + '66', background: meta.color + '14', boxShadow: `0 0 16px -4px ${meta.color}55` }}
          >
            {meta.icon}
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-[0.16em] leading-none" style={{ color: meta.color }}>
              {meta.label}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mt-1">
              Benue South Senatorial District • Zone C • {meta.sensors} nodes
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="zone-plate">{meta.code}</span>
              <span className="text-[8px] mono text-amber-500/90 tracking-wider">SIMULATED FEED</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex flex-col gap-1.5">
            {['LINK', 'SENSORS', 'RECORDING'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`led ${i === 1 && id === 'camera' ? 'led-warn' : ''}`} />
                <span className="text-[8px] mono tracking-wider text-slate-500">{s}</span>
              </div>
            ))}
          </div>
          <div className="w-px h-12 bg-slate-700/50" />
          <div className="text-right">
            <div
              className="text-2xl font-mono font-bold tabular text-cyan-300 leading-none"
              style={{ textShadow: '0 0 14px rgba(6,182,212,0.45)' }}
            >
              {zulu}<span className="text-cyan-600 text-base">Z</span>
            </div>
            <div className="text-[9px] text-slate-500 mono mt-1">{wat} WAT</div>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => window.close()}
              className="text-[8px] mono text-slate-500 hover:text-red-300 border border-slate-700 hover:border-red-600 rounded px-2 py-1 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 relative z-10 p-1.5">{children}</main>

      {/* Event ticker */}
      <footer className="flex-shrink-0 h-7 flex items-stretch border-t border-slate-800 bg-[#060B13] relative z-[10]">
        <div className="flex items-center gap-2 px-3 border-r border-slate-800" style={{ background: meta.color + '10' }}>
          <span className="led" />
          <span className="text-[9px] font-mono font-bold tracking-[0.2em]" style={{ color: meta.color }}>
            {meta.code} FEED
          </span>
        </div>
        <div className="flex-1 overflow-hidden flex items-center">
          <div className="ticker-track">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="text-[10px] mono text-slate-400 px-6 flex items-center gap-2">
                <span style={{ color: meta.color }}>▸</span>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center px-3 border-l border-slate-800">
          <span className="text-[8px] mono text-slate-600 tracking-wider">CEWERS-C2 MONITORING</span>
        </div>
      </footer>

      <div className="scan-beam" />
    </div>
  );
}

function EventFeed({ title, events, accent }: { title: string; events: SimEvent[]; accent: string }) {
  return (
    <div className="tac-panel flex-1 min-h-0 flex flex-col">
      <div className="tac-panel-header py-1.5">
        <span className="tac-panel-title text-[10px]">{title}</span>
        <span className="text-[9px] mono" style={{ color: accent }}>{events.length} EVENTS</span>
      </div>
      <div className="tac-panel-body flex-1 space-y-0.5 py-1.5">
        {events.slice(0, 12).map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 py-1 px-2 rounded border-l-2 hover:bg-white/5"
            style={{ borderLeftColor: SEV_COLOR[e.severity] }}
          >
            <span className="text-[9px] mono text-slate-500 flex-shrink-0">{e.time}</span>
            <span className="text-[10.5px] text-slate-300 flex-1 truncate">{e.text}</span>
            <span
              className="text-[8px] mono px-1 rounded flex-shrink-0"
              style={{ background: SEV_COLOR[e.severity] + '25', color: SEV_COLOR[e.severity] }}
            >
              {e.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Entry ────────────────────────────────────────────────────────────────────

export default function MonitoringSystem() {
  const { systemId } = useParams();
  if (!systemId || !(systemId in MONITOR_SYSTEMS)) {
    return <Navigate to="/systems" replace />;
  }
  switch (systemId as MonitorSystemId) {
    case 'drone': return <DroneMonitor />;
    case 'camera': return <CameraMonitor />;
    case 'trespass': return <TrespassMonitor />;
    case 'gunshot': return <GunshotMonitor />;
    case 'metal': return <MetalMonitor />;
  }
}

// ═══ DRONE MONITORING ═════════════════════════════════════════════════════════

const DRONES = [
  { callsign: 'FALCON-1', mission: 'AGATU PATROL ORBIT', center: [7.5833, 8.0417], radius: 0.045, speed: 0.55, alt: 420 },
  { callsign: 'FALCON-2', mission: 'OTUKPO URBAN WATCH', center: [7.0333, 8.15], radius: 0.028, speed: 0.8, alt: 260 },
  { callsign: 'FALCON-3', mission: 'ADO RIVERINE SWEEP', center: [7.0833, 8.2969], radius: 0.05, speed: 0.45, alt: 380 },
];

interface DroneState {
  callsign: string;
  mission: string;
  lat: number;
  lng: number;
  alt: number;
  bat: number;
  sig: number;
  spd: number;
  hdg: number;
  mode: string;
}

function useDrones(): DroneState[] {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);
  return useMemo(
    () =>
      DRONES.map((d, i) => {
        const theta = tick * d.speed * 0.12 + i * 2.1;
        return {
          callsign: d.callsign,
          mission: d.mission,
          lat: d.center[0] + d.radius * Math.sin(theta),
          lng: d.center[1] + d.radius * Math.cos(theta),
          alt: d.alt + Math.sin(tick * 0.3 + i) * 12,
          bat: Math.max(35, 92 - ((tick + i * 40) % 580) * 0.1),
          sig: 72 + Math.round(Math.abs(Math.sin(tick * 0.11 + i)) * 27),
          spd: 58 + Math.round(Math.abs(Math.sin(tick * 0.2 + i)) * 14),
          hdg: Math.round(((theta * 180) / Math.PI + 90 + 360) % 360),
          mode: 'PATROL',
        };
      }),
    [tick],
  );
}

function droneIcon(color: string, callsign: string): L.DivIcon {
  return L.divIcon({
    className: 'drone-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;
                    color:${color};font-size:13px;font-weight:700;text-shadow:0 0 8px ${color};
                    filter:drop-shadow(0 0 5px ${color}AA);">✈</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:700;color:${color};
                    text-shadow:0 0 4px #000;background:rgba(4,7,12,0.6);padding:0 4px;border-radius:2px;
                    margin-top:1px;white-space:nowrap;">${callsign}</div>
      </div>
    `,
    iconSize: [0, 0],
  });
}

function FitDistrict() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(BENUE_SOUTH_BOUNDS, { padding: [24, 24] });
  }, [map]);
  return null;
}

function DroneMonitor() {
  const drones = useDrones();
  const lead = drones[0];
  const events = useSimFeed(
    () => {
      const d = pick(drones);
      const kinds = [
        { text: `${d.callsign} ▸ EO/IR snapshot queued • sector ${pick(['A1', 'B3', 'C2', 'D4'])}`, severity: 'INFO' as const },
        { text: `${d.callsign} ▸ thermal anomaly flagged for review • conf ${rand(55, 88)}%`, severity: 'WARN' as const },
        { text: `${d.callsign} ▸ battery at ${d.bat}% — swap window in ${rand(8, 22)} min`, severity: 'INFO' as const },
        { text: `${d.callsign} ▸ waypoint handover • next leg ${rand(2, 9)} km`, severity: 'INFO' as const },
      ];
      return pick(kinds);
    },
    6000,
  );

  return (
    <MonitorShell id="drone" events={events}>
      <div className="grid grid-cols-[1fr_360px] gap-1.5 h-full min-h-0">
        {/* Patrol map */}
        <div className="tac-panel hud-bracket relative min-h-0 flex flex-col">
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
              {drones.map((d) => (
                <Fragment key={d.callsign}>
                  <Circle
                    center={[d.lat, d.lng]}
                    radius={1400}
                    pathOptions={{ color: '#22D3EE', weight: 1, fillOpacity: 0.05, dashArray: '4 6' }}
                  />
                  <Marker position={[d.lat, d.lng]} icon={droneIcon('#22D3EE', d.callsign)} />
                </Fragment>
              ))}
            </MapContainer>
            <div className="radar-sweep" />
            <div className="absolute top-3 left-3 z-[10] pointer-events-none">
              <div className="zone-plate" style={{ fontSize: '10px', padding: '2px 8px' }}>
                UAS PATROL GRID • BENUE SOUTH
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry + EO/IR */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* EO/IR feed */}
          <div className="tac-panel relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at 40% 55%, #16283C 0%, #0B1420 55%, #070D15 100%)',
              }}
            />
            {/* terrain-ish grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0 22px, rgba(34,211,238,0.06) 22px 23px), repeating-linear-gradient(90deg, transparent 0 22px, rgba(34,211,238,0.06) 22px 23px)',
              }}
            />
            {/* reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-28 h-28">
                <div className="absolute inset-0 rounded-full border border-cyan-400/30" />
                <div className="absolute inset-[30%] rounded-full border border-cyan-400/40" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/40" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/40" />
              </div>
            </div>
            {/* HUD chrome */}
            <div className="absolute top-2 left-2 text-[9px] mono text-cyan-300/80 leading-tight">
              EO/IR • 640×512 • 30 FPS
              <br />ZOOM ×{rand(2, 4)} • IR-HOT
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[9px] mono text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 blink" /> REC
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8.5px] mono text-cyan-300/70">
              <span>{lead.lat.toFixed(4)}N {lead.lng.toFixed(4)}E</span>
              <span>ALT {Math.round(lead.alt)}M • HDG {String(lead.hdg).padStart(3, '0')}°</span>
            </div>
            <div className="absolute inset-x-0 bottom-6 text-center text-[8px] mono text-slate-600 tracking-[0.3em]">
              SIMULATED SENSOR FEED
            </div>
          </div>

          {/* Telemetry cards */}
          <div className="tac-panel flex-1 min-h-0 flex flex-col">
            <div className="tac-panel-header py-1.5">
              <span className="tac-panel-title text-[10px]">AIRFRAME TELEMETRY</span>
              <span className="text-[9px] text-cyan-600 mono">{drones.length} AIRBORNE</span>
            </div>
            <div className="tac-panel-body flex-1 space-y-2 py-2">
              {drones.map((d) => (
                <div key={d.callsign} className="rounded-md p-2 border border-slate-800 bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300 mono">{d.callsign}</span>
                    <span className="text-[8px] mono text-slate-500">{d.mission}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                    {[
                      { l: 'ALT', v: `${Math.round(d.alt)}m` },
                      { l: 'SPD', v: `${d.spd}km/h` },
                      { l: 'HDG', v: `${String(d.hdg).padStart(3, '0')}°` },
                      { l: 'SIG', v: `${d.sig}%` },
                    ].map((x) => (
                      <div key={x.l} className="text-center rounded bg-slate-950/60 border border-slate-800 py-1">
                        <div className="text-[10px] mono text-slate-200">{x.v}</div>
                        <div className="text-[6.5px] text-slate-500 uppercase tracking-wider">{x.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[7.5px] text-slate-500 uppercase tracking-wider w-7">BAT</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.bat}%`,
                          background: d.bat > 60 ? '#22C55E' : d.bat > 40 ? '#EAB308' : '#EF4444',
                        }}
                      />
                    </div>
                    <span className="text-[8px] mono w-9 text-right" style={{ color: d.bat > 60 ? '#22C55E' : '#F59E0B' }}>
                      {Math.round(d.bat)}%
                    </span>
                    <span className="text-[8px] mono text-cyan-500 border border-cyan-500/30 rounded px-1">{d.mode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MonitorShell>
  );
}

// ═══ CAMERA MONITORING ════════════════════════════════════════════════════════

const CAMS = [
  { id: 'OTK-MKT-01', name: 'Otukpo Market Junction', zone: 'OTUKPO' },
  { id: 'OTK-BNK-02', name: 'First Bank Otukpo', zone: 'OTUKPO' },
  { id: 'ODG-CHK-03', name: 'Odugbeho Checkpoint', zone: 'AGATU' },
  { id: 'OKP-HWY-04', name: 'Okpokwu Highway PT', zone: 'OKPOKWU' },
  { id: 'IGU-BRG-05', name: 'Igumale Bridge', zone: 'ADO', offline: true },
  { id: 'OJU-FRS-06', name: 'Oju Forest Edge', zone: 'OJU' },
];

function CameraMonitor() {
  const now = useNow();
  const [motionSector, setMotionSector] = useState({ x: 30, y: 40 });
  const events = useSimFeed(
    () => {
      const cam = pick(CAMS.filter((c) => !c.offline));
      return pick([
        { text: `MOTION ▸ ${cam.id} ${cam.name} • sector ${pick(['A1', 'B2', 'C3'])} • conf ${rand(62, 94)}%`, severity: 'INFO' as const },
        { text: `PERSON DETECTED ▸ ${cam.id} • loitering ${rand(15, 90)}s after curfew window`, severity: 'WARN' as const },
        { text: `FEED HEALTHY ▸ ${cam.id} • bitrate restored ${rand(2, 6)} Mbps`, severity: 'INFO' as const },
        { text: `CROWD FORMATION ▸ ${cam.id} ${cam.name} • est. ${rand(8, 40)} persons`, severity: 'WARN' as const },
      ]);
    },
    7000,
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMotionSector({ x: rand(18, 68), y: rand(22, 58) });
    }, 3400);
    return () => clearInterval(id);
  }, []);

  return (
    <MonitorShell id="camera" events={events}>
      <div className="grid grid-cols-[1fr_320px] gap-1.5 h-full min-h-0">
        {/* CCTV grid */}
        <div className="grid grid-cols-3 grid-rows-2 gap-1.5 min-h-0">
          {CAMS.map((cam, idx) => (
            <div key={cam.id} className="tac-panel hud-bracket relative overflow-hidden flex flex-col min-h-0">
              {/* feed header */}
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 bg-slate-900/50 flex-shrink-0 z-[2]">
                <span className="text-[9px] mono font-bold text-slate-300">{cam.id}</span>
                <span className="text-[8px] mono text-slate-500 truncate px-1">{cam.name.toUpperCase()}</span>
                {cam.offline ? (
                  <span className="text-[8px] mono text-red-400 blink">OFFLINE</span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] mono text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 blink" /> REC
                  </span>
                )}
              </div>
              {/* feed body */}
              <div className="flex-1 relative overflow-hidden min-h-0">
                {cam.offline ? (
                  <div className="absolute inset-0 bg-[#0A0D12] flex flex-col items-center justify-center gap-1">
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent 0 3px, rgba(148,163,184,0.25) 3px 4px)',
                      }}
                    />
                    <span className="text-[10px] mono text-red-400 blink">NO SIGNAL</span>
                    <span className="text-[8px] mono text-slate-600">RE-establishing uplink…</span>
                  </div>
                ) : (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(ellipse at ${35 + idx * 6}% ${40 + idx * 4}%, #131F30 0%, #0A1119 60%, #060B12 100%)`,
                      }}
                    />
                    <div className="scan-beam" style={{ animationDuration: `${7 + idx}s` }} />
                    {/* motion box on the market cam */}
                    {cam.id === 'OTK-MKT-01' && (
                      <div
                        className="absolute border-2 rounded-sm z-[3] transition-all duration-700"
                        style={{
                          left: `${motionSector.x}%`,
                          top: `${motionSector.y}%`,
                          width: '22%',
                          height: '34%',
                          borderColor: '#F59E0B',
                          boxShadow: '0 0 12px -2px #F59E0B88',
                        }}
                      >
                        <span className="absolute -top-4 left-0 text-[7px] mono text-amber-400 bg-amber-950/80 px-1 rounded">
                          MOTION {rand(70, 95)}%
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-2 text-[8px] mono text-slate-400/80">
                      {stamp(now)} • {cam.zone} LGA
                    </div>
                    <div className="absolute bottom-1 right-2 text-[8px] mono text-slate-500">
                      {rand(2, 6)}.4 Mbps
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Health + events */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="tac-panel flex-shrink-0">
            <div className="tac-panel-header py-1.5">
              <span className="tac-panel-title text-[10px]">GRID HEALTH</span>
              <span className="text-[9px] mono text-blue-400">{CAMS.length - 1}/{CAMS.length} ONLINE</span>
            </div>
            <div className="p-2 space-y-1">
              {CAMS.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-[10px]">
                  <span className={`led ${c.offline ? 'led-down' : ''}`} />
                  <span className="mono text-slate-400 w-[74px]">{c.id}</span>
                  <span className="text-slate-300 flex-1 truncate">{c.name}</span>
                  {c.offline && <span className="text-[8px] mono text-red-400 blink">LOST</span>}
                </div>
              ))}
            </div>
          </div>
          <EventFeed title="VISION ANALYTICS EVENTS" events={events} accent="#60A5FA" />
        </div>
      </div>
    </MonitorShell>
  );
}

// ═══ TRESPASS MONITORING ══════════════════════════════════════════════════════

const ZONES = [
  { id: 'ZF-01', name: 'Odugbeho Farmland Belt', lga: 'AGATU', beams: 6 },
  { id: 'ZF-02', name: 'Otukpo Perimeter Alpha', lga: 'OTUKPO', beams: 4 },
  { id: 'ZF-03', name: 'Ogbadibo Border Crossing', lga: 'OGBADIBO', beams: 5 },
  { id: 'ZF-04', name: 'Oju Forest Edge Line', lga: 'OJU', beams: 6 },
  { id: 'ZF-05', name: 'Okpokwu Highway Corridor', lga: 'OKPOKWU', beams: 3 },
  { id: 'ZF-06', name: 'Apa Returnee Settlement', lga: 'APA', beams: 4 },
];

function TrespassMonitor() {
  const [breachZone, setBreachZone] = useState<string | null>(null);
  const events = useSimFeed(
    () => {
      const z = pick(ZONES);
      return pick([
        { text: `PERIMETER BREACH ▸ ${z.id} ${z.name} • beam ${rand(1, z.beams)} • ${rand(1, 3)} contacts`, severity: 'ALERT' as const },
        { text: `ANIMAL/WILDLIFE FILTERED ▸ ${z.id} • classifier rejected contact`, severity: 'INFO' as const },
        { text: `ZONE REARMED ▸ ${z.id} ${z.name} • operator ack`, severity: 'INFO' as const },
        { text: `LOITERING ▸ ${z.id} • contact held ${rand(2, 9)} min at fence line`, severity: 'WARN' as const },
      ]);
    },
    6500,
  );

  // Flash the zone card when a breach event lands
  useEffect(() => {
    const id = setInterval(() => {
      setBreachZone(pick(ZONES).id);
      setTimeout(() => setBreachZone(null), 4200);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <MonitorShell id="trespass" events={events}>
      <div className="grid grid-cols-[1fr_340px] gap-1.5 h-full min-h-0">
        {/* Zone cards */}
        <div className="grid grid-cols-2 grid-rows-3 gap-1.5 min-h-0">
          {ZONES.map((z) => {
            const breached = breachZone === z.id;
            return (
              <div
                key={z.id}
                className={`tac-panel relative flex flex-col justify-between p-3 ${breached ? 'blink-soft' : ''}`}
                style={
                  breached
                    ? { borderColor: '#EF4444', boxShadow: '0 0 22px -6px #EF4444AA, inset 0 0 18px -8px #EF4444' }
                    : undefined
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] font-bold text-slate-100">{z.name}</div>
                    <div className="text-[9px] mono text-slate-500 mt-0.5">{z.id} • {z.lga} LGA</div>
                  </div>
                  <span
                    className="text-[8px] mono px-1.5 py-0.5 rounded border"
                    style={
                      breached
                        ? { color: '#FCA5A5', borderColor: '#EF444466', background: '#EF44441A' }
                        : { color: '#34D399', borderColor: '#22C55E44', background: '#22C55E14' }
                    }
                  >
                    {breached ? 'BREACH' : 'ARMED'}
                  </span>
                </div>

                {/* beam matrix */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex gap-1">
                    {Array.from({ length: z.beams }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-4 rounded-sm ${breached && i === rand(0, z.beams - 1) ? 'blink' : ''}`}
                        style={{
                          background: breached && i === 0 ? '#EF4444' : '#22C55E66',
                          boxShadow: `0 0 7px -1px ${breached ? '#EF4444' : '#22C55E'}`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] mono text-slate-500">{z.beams} BEAM SENSORS</span>
                  <span className="ml-auto text-[8px] mono text-slate-600">
                    LAST: {stamp(new Date(Date.now() - rand(2, 55) * 60000))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Events */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="tac-panel flex-shrink-0 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Perimeter Posture</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'ZONES ARMED', v: ZONES.length, c: '#22C55E' },
                { l: 'ACTIVE BREACH', v: breachZone ? 1 : 0, c: '#EF4444' },
                { l: 'BEAM SENSORS', v: ZONES.reduce((a, z) => a + z.beams, 0), c: '#F59E0B' },
                { l: '24H EVENTS', v: rand(12, 38), c: '#60A5FA' },
              ].map((s) => (
                <div key={s.l} className="text-center rounded-md py-2" style={{ background: s.c + '10', border: `1px solid ${s.c}30` }}>
                  <div className="text-xl font-bold mono" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[7.5px] text-slate-500 uppercase tracking-[0.12em] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <EventFeed title="INTRUSION EVENTS" events={events} accent="#F59E0B" />
        </div>
      </div>
    </MonitorShell>
  );
}

// ═══ GUNSHOT DETECTION ════════════════════════════════════════════════════════

const ACO_SENSORS = [
  { id: 'ACO-1', lga: 'AGATU', status: 'ONLINE' },
  { id: 'ACO-2', lga: 'OTUKPO', status: 'ONLINE' },
  { id: 'ACO-3', lga: 'OKPOKWU', status: 'ONLINE' },
  { id: 'ACO-4', lga: 'OJU', status: 'ONLINE' },
  { id: 'ACO-5', lga: 'OGBADIBO', status: 'DEGRADED' },
  { id: 'ACO-6', lga: 'ADO', status: 'ONLINE' },
];

const GUN_CLASSES = ['ASSAULT RIFLE — 7.62MM', 'PISTOL — 9MM', 'UNKNOWN — SINGLE SHOT', 'ASSAULT RIFLE — 5.56MM'];

function GunshotMonitor() {
  const [wave, setWave] = useState<number[]>(() => Array.from({ length: 28 }, () => rand(8, 40)));
  const [spike, setSpike] = useState(false);

  const events = useSimFeed(
    () => ({
      text: `SHOT DETECTED ▸ ${pick(ACO_SENSORS).lga} LGA • bearing ${rand(0, 359)}° • ${pick(GUN_CLASSES)} • conf ${rand(74, 97)}%`,
      severity: 'ALERT' as const,
    }),
    11000,
    24,
    3,
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSpike(Math.random() < 0.12);
      setWave(Array.from({ length: 28 }, () => rand(8, 45)));
    }, 550);
    return () => clearInterval(id);
  }, []);

  return (
    <MonitorShell id="gunshot" events={events}>
      <div className="grid grid-cols-[300px_1fr_340px] gap-1.5 h-full min-h-0">
        {/* Sensor network */}
        <div className="tac-panel flex flex-col min-h-0">
          <div className="tac-panel-header py-1.5">
            <span className="tac-panel-title text-[10px]">ACOUSTIC NODES</span>
            <span className="text-[9px] mono text-red-400">{ACO_SENSORS.filter((s) => s.status === 'ONLINE').length}/{ACO_SENSORS.length} UP</span>
          </div>
          <div className="tac-panel-body flex-1 space-y-1 py-2">
            {ACO_SENSORS.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded p-2 border border-slate-800 bg-slate-900/40">
                <span className={`led ${s.status === 'DEGRADED' ? 'led-warn' : ''}`} />
                <div className="flex-1">
                  <div className="text-[11px] mono font-bold text-slate-200">{s.id}</div>
                  <div className="text-[8px] text-slate-500">{s.lga} LGA • MAST {rand(6, 18)}M</div>
                </div>
                <span className="text-[8px] mono" style={{ color: s.status === 'ONLINE' ? '#64748B' : '#F59E0B' }}>
                  {s.status}
                </span>
              </div>
            ))}
            <div className="pt-1 text-[8px] mono text-slate-600 text-center">
              MESH BACKHAUL 86% • NTP SYNC ±2MS
            </div>
          </div>
        </div>

        {/* Bearing scope + waveform */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* bearing scope */}
          <div className="tac-panel hud-bracket relative flex-1 min-h-0 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[min(46vh,88%)] aspect-square rounded-full overflow-hidden border border-slate-700/60">
                {/* rings */}
                {[100, 72, 44].map((s) => (
                  <div
                    key={s}
                    className="absolute rounded-full border border-slate-700/50"
                    style={{ inset: `${(100 - s) / 2}%` }}
                  />
                ))}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/40" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/40" />
                <div className="radar-sweep" />
                {/* compass */}
                <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] mono text-slate-400">N</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] mono text-slate-500">S</span>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] mono text-slate-500">W</span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] mono text-slate-500">E</span>
                {/* detection blips */}
                {events.slice(0, 4).map((e, i) => {
                  const bearing = rand(0, 359);
                  const r = 30 + (i % 2) * 8;
                  const a = (bearing * Math.PI) / 180;
                  return (
                    <span
                      key={e.id}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${50 + r * Math.sin(a)}%`,
                        top: `${50 - r * Math.cos(a)}%`,
                        background: '#EF4444',
                        boxShadow: '0 0 10px 1px #EF4444',
                        opacity: 1 - i * 0.22,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="absolute top-3 left-3 z-[10]">
              <div className="zone-plate" style={{ fontSize: '10px', padding: '2px 8px' }}>BEARING SCOPE • TRIANGULATION</div>
            </div>
          </div>

          {/* waveform */}
          <div className="tac-panel flex-shrink-0 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="tac-panel-title text-[10px]">ACOUSTIC WAVEFORM — LIVE</span>
              <span className={`text-[9px] mono ${spike ? 'text-red-400 blink' : 'text-slate-500'}`}>
                {spike ? '▲ SPIKE CLASSIFYING' : 'AMBIENT 34dB'}
              </span>
            </div>
            <div className="flex items-end gap-[3px] h-14">
              {wave.map((h, i) => {
                const hot = spike && i > 8 && i < 20;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${hot ? Math.min(100, h * 2.2) : h}%`,
                      background: hot ? '#EF4444' : '#F87171' + '55',
                      boxShadow: hot ? '0 0 8px -1px #EF4444' : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Detections */}
        <EventFeed title="DETECTION LOG" events={events} accent="#EF4444" />
      </div>
    </MonitorShell>
  );
}

// ═══ METAL DETECTION ══════════════════════════════════════════════════════════

const GATES = [
  { id: 'MDI-OTK-01', name: 'Otukpo Motor Park', type: 'WALK-THROUGH', sensitivity: 78 },
  { id: 'MDI-ODG-02', name: 'Odugbeho Market Entry', type: 'WALK-THROUGH', sensitivity: 84 },
  { id: 'MDI-OKP-03', name: 'Okpokwu Highway Checkpoint', type: 'VEHICLE SCAN', sensitivity: 66 },
  { id: 'MDI-OTK-04', name: 'Otukpa Border Road', type: 'HANDHELD ARRAY', sensitivity: 72 },
];

const METAL_PROFILES = ['MACHETE-CLASS BLADE', 'LARGE METAL MASS', 'WEAPON-LIKABLE PROFILE', 'TOOL ASSEMBLY', 'MULTIPLE SMALL OBJECTS'];

function MetalMonitor() {
  const [throughput, setThroughput] = useState(() => GATES.map(() => rand(40, 220)));
  const events = useSimFeed(
    () => {
      const g = pick(GATES);
      const profile = pick(METAL_PROFILES);
      const alarm = profile !== 'TOOL ASSEMBLY';
      return {
        text: `${alarm ? 'ALARM' : 'SCAN CLEAR'} ▸ ${g.id} ${g.name} • ${profile} • action: ${alarm ? 'MANUAL INSPECTION' : 'PASS'}`,
        severity: (alarm ? 'WARN' : 'INFO') as SimEvent['severity'],
      };
    },
    8000,
  );

  useEffect(() => {
    const id = setInterval(() => {
      setThroughput((t) => t.map((v) => v + (Math.random() < 0.6 ? 1 : 0)));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <MonitorShell id="metal" events={events}>
      <div className="grid grid-cols-[1fr_340px] gap-1.5 h-full min-h-0">
        {/* Gates */}
        <div className="grid grid-cols-2 grid-rows-2 gap-1.5 min-h-0">
          {GATES.map((g, i) => {
            const alarmed = events[0]?.text.startsWith('ALARM') && events[0].text.includes(g.id);
            return (
              <div
                key={g.id}
                className={`tac-panel relative flex flex-col p-3 ${alarmed ? 'blink-soft' : ''}`}
                style={alarmed ? { borderColor: '#F59E0B', boxShadow: '0 0 20px -6px #F59E0B99' } : undefined}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] font-bold text-slate-100">{g.name}</div>
                    <div className="text-[9px] mono text-slate-500 mt-0.5">{g.id} • {g.type}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[8px] mono text-emerald-400">
                    <span className="led" /> ACTIVE
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3 flex-1">
                  {/* sensitivity gauge */}
                  <div className="flex-1">
                    <div className="flex justify-between text-[7.5px] mono text-slate-500 uppercase tracking-wider mb-1">
                      <span>Sensitivity</span>
                      <span style={{ color: '#A78BFA' }}>{g.sensitivity}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="meter-fill h-full rounded-full" style={{ width: `${g.sensitivity}%`, background: 'linear-gradient(90deg,#7C3AED99,#A78BFA)' }} />
                    </div>
                    <div className="flex justify-between text-[7.5px] mono text-slate-500 uppercase tracking-wider mb-1 mt-2.5">
                      <span>Detection Rate</span>
                      <span style={{ color: '#22C55E' }}>{rand(88, 99)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="meter-fill h-full rounded-full" style={{ width: `${rand(88, 99)}%`, background: 'linear-gradient(90deg,#16A34A99,#22C55E)' }} />
                    </div>
                  </div>

                  {/* throughput */}
                  <div className="text-center px-2">
                    <div className="text-2xl font-bold mono text-violet-300 tabular">{throughput[i]}</div>
                    <div className="text-[7px] text-slate-500 uppercase tracking-[0.12em] mt-1">Scans Today</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Events */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="tac-panel flex-shrink-0 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Screening Posture</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'GATES ACTIVE', v: GATES.length, c: '#A78BFA' },
                { l: 'ALARMS 24H', v: rand(3, 14), c: '#F59E0B' },
                { l: 'SCAN TOTAL', v: throughput.reduce((a, b) => a + b, 0), c: '#22D3EE' },
                { l: 'AVG DWELL', v: `${rand(3, 9)}s`, c: '#22C55E' },
              ].map((s) => (
                <div key={s.l} className="text-center rounded-md py-2" style={{ background: s.c + '10', border: `1px solid ${s.c}30` }}>
                  <div className="text-xl font-bold mono" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[7.5px] text-slate-500 uppercase tracking-[0.12em] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <EventFeed title="DETECTION EVENTS" events={events} accent="#A78BFA" />
        </div>
      </div>
    </MonitorShell>
  );
}
