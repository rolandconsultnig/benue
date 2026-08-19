/**
 * Alarm Store — manages real-time alerts, notifications, and audible alarms.
 * Fed by Socket.IO events; consumed by the alarm ticker + toast components.
 */

import { create } from 'zustand';

export type AlarmSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
export type AlarmType =
  | 'PANIC_SOS'
  | 'P1_INCIDENT'
  | 'ALERT_ESCALATION'
  | 'NEW_INCIDENT'
  | 'DISPATCH_UPDATE'
  | 'COMMS_DOWN'
  | 'SYSTEM';

export interface Alarm {
  id: string;
  type: AlarmType;
  severity: AlarmSeverity;
  title: string;
  message: string;
  timestamp: string;
  incidentId?: string;
  wardId?: string;
  acknowledged: boolean;
}

interface AlarmState {
  alarms: Alarm[];
  alarmEnabled: boolean;
  addAlarm: (alarm: Omit<Alarm, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
  clearAcknowledged: () => void;
  toggleAlarmEnabled: () => void;
  unacknowledgedCount: number;
}

// Generate a short beep using the Web Audio API (no audio file needed)
function playAlarmSound(severity: AlarmSeverity) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (severity === 'CRITICAL') {
      // Triple-beep for critical (panic/P1)
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.65);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } else if (severity === 'HIGH') {
      // Single high beep
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Soft chime for medium/info
      osc.frequency.value = 523;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // AudioContext not available — silent fallback
  }
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: [],
  alarmEnabled: true,
  unacknowledgedCount: 0,

  addAlarm: (alarm) => {
    const id = `alm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullAlarm: Alarm = {
      ...alarm,
      id,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    set((state) => ({
      alarms: [fullAlarm, ...state.alarms].slice(0, 100), // keep last 100
      unacknowledgedCount: state.alarms.filter((a) => !a.acknowledged).length + 1,
    }));
    // Play sound for unacknowledged critical/high alarms
    if (get().alarmEnabled && (alarm.severity === 'CRITICAL' || alarm.severity === 'HIGH')) {
      playAlarmSound(alarm.severity);
    }
    // Browser notification if permitted
    if (Notification.permission === 'granted' && alarm.severity === 'CRITICAL') {
      new Notification(`🚨 CEWERS: ${alarm.title}`, { body: alarm.message });
    }
  },

  acknowledge: (id) => {
    set((state) => {
      const alarms = state.alarms.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
      return { alarms, unacknowledgedCount: alarms.filter((a) => !a.acknowledged).length };
    });
  },

  acknowledgeAll: () => {
    set((state) => ({
      alarms: state.alarms.map((a) => ({ ...a, acknowledged: true })),
      unacknowledgedCount: 0,
    }));
  },

  clearAcknowledged: () => {
    set((state) => ({ alarms: state.alarms.filter((a) => !a.acknowledged) }));
  },

  toggleAlarmEnabled: () => {
    set((state) => ({ alarmEnabled: !state.alarmEnabled }));
  },
}));
