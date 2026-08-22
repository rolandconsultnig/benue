/**
 * Monitoring Systems Hub — launcher console.
 *
 * Five sensor-system tabs; clicking a tab opens that system's monitoring
 * display in its own dedicated window (placeable on a wall screen).
 */

import { useState } from 'react';
import {
  MONITOR_SYSTEMS,
  MONITOR_SYSTEM_IDS,
  launchMonitorWindow,
  type MonitorSystemId,
} from '../lib/monitor';

export default function MonitoringHub() {
  const [active, setActive] = useState<MonitorSystemId>('drone');

  const launch = (id: MonitorSystemId) => {
    setActive(id);
    launchMonitorWindow(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100">
            Monitoring Systems
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">
            Sensor display windows • Benue South Senatorial District • Zone C
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] mono text-slate-500">
          <span className="led" />
          ALL SYSTEMS CALIBRATED
        </div>
      </div>

      {/* Launch tabs — each click opens the system in its own window */}
      <div className="glass-card p-2">
        <div className="grid grid-cols-5 gap-2">
          {MONITOR_SYSTEM_IDS.map((id) => {
            const sys = MONITOR_SYSTEMS[id];
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => launch(id)}
                className={`group relative flex flex-col items-center gap-2 rounded-lg px-3 py-4 transition-all border ${
                  isActive ? 'bg-slate-800/70' : 'bg-slate-900/40 hover:bg-slate-800/50 border-transparent'
                }`}
                style={
                  isActive
                    ? { borderColor: sys.color + '66', boxShadow: `0 0 18px -6px ${sys.color}88, inset 0 0 12px ${sys.color}14` }
                    : undefined
                }
              >
                <span className="text-2xl">{sys.icon}</span>
                <span
                  className="text-[10px] font-bold tracking-[0.12em] font-mono uppercase"
                  style={{ color: isActive ? sys.color : '#94A3B8' }}
                >
                  {sys.short}
                </span>
                <span className="text-[8px] mono text-slate-600">{sys.code}</span>
                <span
                  className="absolute bottom-1.5 text-[8px] mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: sys.color }}
                >
                  OPEN ↗
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[9px] text-slate-600 mono tracking-wider mt-2">
          SELECTING A SYSTEM LAUNCHES ITS DISPLAY IN A DEDICATED WINDOW — POSITION IT ON ANY WALL SCREEN
        </p>
      </div>

      {/* System overview cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {MONITOR_SYSTEM_IDS.map((id) => {
          const sys = MONITOR_SYSTEMS[id];
          return (
            <div key={id} className="glass-card-hover p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
                    style={{ borderColor: sys.color + '44', background: sys.color + '12' }}
                  >
                    {sys.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 tracking-wide">{sys.label}</div>
                    <div className="text-[9px] mono text-slate-500 tracking-wider">{sys.code} • {sys.sensors} SENSOR NODES</div>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-[8px] mono text-emerald-400">
                  <span className="led" /> ONLINE
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{sys.desc}</p>

              <div className="flex items-center justify-between">
                <span className="text-[8px] mono text-amber-500/90 border border-amber-500/25 bg-amber-500/10 rounded px-1.5 py-0.5 tracking-wider">
                  SIMULATED FEED — AWAITING SENSOR INTEGRATION
                </span>
                <button
                  onClick={() => launch(id)}
                  className="text-[10px] font-semibold mono px-3 py-1.5 rounded-md transition-all"
                  style={{ color: sys.color, border: `1px solid ${sys.color}55`, background: sys.color + '10' }}
                >
                  LAUNCH DISPLAY →
                </button>
              </div>
            </div>
          );
        })}

        {/* C2 wall launcher card */}
        <div className="glass-card-hover p-4 flex flex-col gap-3 border-orange-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border border-orange-500/40 bg-orange-500/10">
                🖥️
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 tracking-wide">C2 VIDEO WALL</div>
                <div className="text-[9px] mono text-slate-500 tracking-wider">SR-01 • MAIN WALL DISPLAY</div>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[8px] mono text-emerald-400">
              <span className="led" /> ONLINE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed flex-1">
            Master operations display — district operational map, live tracks and threat posture. Runs in its own
            dedicated window.
          </p>
          <div className="flex items-center justify-end">
            <button
              onClick={() => launchMonitorWindow()}
              className="text-[10px] font-semibold mono px-3 py-1.5 rounded-md text-orange-400 border border-orange-500/55 bg-orange-500/10 transition-all"
            >
              LAUNCH C2 WALL →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
