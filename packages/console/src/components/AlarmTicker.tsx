/**
 * Alarm Ticker — C2 Situation Room Top Status Bar
 * Persistent tactical telemetry bar with military clocks, real-time alarm stream, and audio controls.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarmStore, type AlarmSeverity } from '../store/alarms';

const SEVERITY_CONFIG: Record<
  AlarmSeverity,
  { bg: string; text: string; border: string; glow: string; icon: string }
> = {
  CRITICAL: {
    bg: 'bg-red-950/80',
    text: 'text-red-400',
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    icon: '🚨',
  },
  HIGH: {
    bg: 'bg-orange-950/70',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
    icon: '⚠️',
  },
  MEDIUM: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    glow: '',
    icon: '⚡',
  },
  INFO: {
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-400',
    border: 'border-cyan-500/40',
    glow: '',
    icon: 'ℹ️',
  },
};

export default function AlarmTicker() {
  const navigate = useNavigate();
  const {
    alarms,
    unacknowledgedCount,
    acknowledge,
    acknowledgeAll,
    alarmEnabled,
    toggleAlarmEnabled,
  } = useAlarmStore();
  const [expanded, setExpanded] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const active = alarms.filter((a) => !a.acknowledged);
  const latest = active[0];

  const watString = time.toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const utcString = time.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const sev = latest ? SEVERITY_CONFIG[latest.severity] : null;

  return (
    <div className="relative z-40 flex-shrink-0 border-b border-slate-800 bg-[#0A0F1D]/95 backdrop-blur-md">
      {/* Top Status Bar Row */}
      <div className="flex h-11 items-center justify-between px-4 text-xs font-mono">
        {/* Left: System Status & Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  latest ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  latest ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="font-bold tracking-wider text-slate-300">
              {latest ? 'ALERT ACTIVE' : 'SYSTEM NOMINAL'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 pl-3 border-l border-slate-800">
            <span>
              WAT <strong className="text-slate-200">{watString}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              UTC <span className="text-slate-300">{utcString}</span>
            </span>
          </div>
        </div>

        {/* Center: Active Alarm Marquee or Status */}
        <div className="flex-1 mx-4 min-w-0 flex items-center justify-center">
          {latest ? (
            <div
              onClick={() => latest.incidentId && navigate(`/incidents/${latest.incidentId}`)}
              className={`flex items-center gap-2.5 px-3 py-1 rounded-lg cursor-pointer border ${sev?.bg} ${sev?.border} ${sev?.glow} transition-all hover:scale-[1.01]`}
            >
              <span className="text-sm">{sev?.icon}</span>
              <span className={`font-bold uppercase tracking-wide text-xs truncate ${sev?.text}`}>
                {latest.title}
              </span>
              <span className="text-slate-400 text-xs truncate max-w-xs md:max-w-md hidden md:inline">
                {latest.message}
              </span>
              {unacknowledgedCount > 1 && (
                <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  +{unacknowledgedCount - 1} MORE
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-xs hidden md:flex items-center gap-2 font-sans tracking-wide">
              <span>🛡️ All operational zones reporting within normal security thresholds</span>
            </div>
          )}
        </div>

        {/* Right: Controls & Audio */}
        <div className="flex items-center gap-2">
          {active.length > 0 && (
            <button
              onClick={acknowledgeAll}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors"
            >
              ACK ALL ({active.length})
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              expanded
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            LOG ({alarms.length})
          </button>

          <button
            onClick={toggleAlarmEnabled}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title={alarmEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
          >
            {alarmEnabled ? '🔔' : '🔕'}
          </button>
        </div>
      </div>

      {/* Expandable History Drawer */}
      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/95 p-3 max-h-72 overflow-y-auto shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Recent Alarm Log
            </span>
            <span className="text-[11px] text-slate-500">Showing last {alarms.length} entries</span>
          </div>

          <div className="space-y-1.5">
            {alarms.slice(0, 20).map((alarm) => {
              const sc = SEVERITY_CONFIG[alarm.severity];
              return (
                <div
                  key={alarm.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors ${
                    alarm.acknowledged
                      ? 'border-slate-800/60 bg-slate-900/30 opacity-60'
                      : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span>{sc.icon}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${sc.text}`}>
                        {alarm.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{alarm.message}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(alarm.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    {!alarm.acknowledged && (
                      <button
                        onClick={() => acknowledge(alarm.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500 hover:text-white transition-colors"
                      >
                        ACK
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {alarms.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                No active or historical alarms in memory buffer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
