/**
 * Realtime socket hook — connects to the API's Socket.IO namespace,
 * authenticates with the JWT, feeds the alarm store, and invalidates
 * React Query caches for live updates.
 */

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from './client';
import { useAlarmStore } from '../store/alarms';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useRealtime() {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const addAlarm = useAlarmStore((s) => s.addAlarm);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socket = io(`${SOCKET_URL}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Realtime connected');
      socket.emit('join:situation-room');
    });

    // ─── Alarm-triggering events ───────────────────────────────────────

    socket.on('incident.created', (data: any) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });

      // Determine alarm severity
      if (data.channel === 'PANIC') {
        addAlarm({
          type: 'PANIC_SOS',
          severity: 'CRITICAL',
          title: 'PANIC / SOS ACTIVATED',
          message: `Emergency panic alert received. Auto-dispatch in progress.`,
          incidentId: data.incidentId,
        });
      } else if (data.priority === 'P1') {
        addAlarm({
          type: 'P1_INCIDENT',
          severity: 'CRITICAL',
          title: 'P1 INCIDENT REPORTED',
          message: `${data.category?.replace(/_/g, ' ')} — immediate response required.`,
          incidentId: data.incidentId,
        });
      } else if (data.priority === 'P2') {
        addAlarm({
          type: 'NEW_INCIDENT',
          severity: 'HIGH',
          title: 'New P2 Incident',
          message: `${data.category?.replace(/_/g, ' ')} reported via ${data.channel}.`,
          incidentId: data.incidentId,
        });
      } else {
        addAlarm({
          type: 'NEW_INCIDENT',
          severity: 'MEDIUM',
          title: 'New Incident Reported',
          message: `${data.category?.replace(/_/g, ' ')} via ${data.channel}.`,
          incidentId: data.incidentId,
        });
      }
    });

    socket.on('incident.dispatched', (data: any) => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['responders'] });
      addAlarm({
        type: 'DISPATCH_UPDATE',
        severity: 'INFO',
        title: 'Responder Dispatched',
        message: `Responder assigned to incident.`,
        incidentId: data.incidentId,
      });
    });

    socket.on('incident.updated', () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
    });

    socket.on('alert.changed', (data: any) => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['lgas'] });

      // Escalation alarm
      const severity = data.toLevel === 'RED' ? 'CRITICAL' : data.toLevel === 'ORANGE' ? 'HIGH' : 'INFO';
      const title =
        data.toLevel === 'RED'
          ? '🔴 RED ALERT — IMMINENT THREAT'
          : data.toLevel === 'ORANGE'
            ? '🟠 ORANGE ALERT — HIGH RISK'
            : `Alert changed to ${data.toLevel}`;
      addAlarm({
        type: 'ALERT_ESCALATION',
        severity,
        title,
        message: `Ward alert level changed from ${data.fromLevel} to ${data.toLevel} (score: ${data.score}).`,
        wardId: data.wardId,
      });
    });

    socket.on('responder.moved', () => {
      qc.invalidateQueries({ queryKey: ['responders'] });
    });

    socket.on('disconnect', () => {
      console.log('⚡ Realtime disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [qc, addAlarm]);
}
