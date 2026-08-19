/**
 * Home Screen — the panic/SOS button + quick actions + queue status.
 *
 * The panic button is press-and-hold (2 seconds) to prevent accidental triggers.
 * When activated, it grabs the current location and fires immediately,
 * bypassing the offline queue if online, or queuing as IMMEDIATE if offline.
 */

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Vibration, Alert,
  Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/store/auth';
import { useLocation } from '../../src/hooks/useLocation';
import { enqueueReport, getQueueCount, syncQueue, onSync } from '../../src/api/offline';
import { Channel, IncidentCategory } from '@cewers/shared';

export default function HomeScreen() {
  const { user } = useAuth();
  const { coords, getLocation } = useLocation();
  const [panicHolding, setPanicHolding] = useState(false);
  const [panicSent, setPanicSent] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getQueueCount().then(setQueueCount);
    const unsub = onSync(() => getQueueCount().then(setQueueCount));
    const interval = setInterval(() => getQueueCount().then(setQueueCount), 10_000);
    return () => { unsub(); clearInterval(interval); };
  }, []);

  const triggerPanic = async () => {
    setPanicSent(true);
    Vibration.vibrate([200, 100, 200, 100, 400]);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}

    // Get location — await the returned coords directly (not stale state)
    const loc = await getLocation();

    // Fire panic report immediately
    try {
      const { api, isOnline } = await import('../../src/api/client');
      const online = await isOnline();
      const geo = loc || { lng: 8.05, lat: 7.2 }; // fallback to Benue South centroid

      const dto = {
        category: IncidentCategory.ATTACK_IN_PROGRESS,
        description: 'PANIC / SOS triggered from mobile app',
        geo,
        channel: Channel.PANIC,
        priorityHint: 'P1',
      };

      if (online) {
        await api.post('/api/panic', { lng: geo.lng, lat: geo.lat });
      } else {
        await enqueueReport(dto, true);
      }
    } catch {
      // If all else fails, enqueue
      await enqueueReport({
        category: IncidentCategory.ATTACK_IN_PROGRESS,
        description: 'PANIC / SOS',
        geo: coords || { lng: 0, lat: 0 },
        channel: Channel.PANIC,
        priorityHint: 'P1',
      }, true);
    }

    setTimeout(() => {
      setPanicSent(false);
      setPanicHolding(false);
    }, 4000);
  };

  const startHold = () => {
    setPanicHolding(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    holdTimer.current = setTimeout(() => {
      triggerPanic();
    }, 2000);
  };

  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setPanicHolding(false);
    progress.setValue(0);
  };

  const progressHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>🛡️ CEWERS</Text>
        <Text style={styles.welcome}>Welcome, {user?.name?.split(' ')[0]}</Text>
      </View>

      {/* Connection status */}
      <View style={styles.statusBar}>
        <ConnectionIndicator />
        {queueCount > 0 && (
          <View style={styles.queueBadge}>
            <Text style={styles.queueText}>{queueCount} pending sync</Text>
          </View>
        )}
      </View>

      {/* PANIC BUTTON */}
      <View style={styles.panicContainer}>
        {panicSent ? (
          <View style={styles.panicSentContainer}>
            <Text style={styles.panicSentIcon}>🚨</Text>
            <Text style={styles.panicSentText}>SOS ACTIVATED</Text>
            <Text style={styles.panicSentSubtext}>Help is on the way. Stay safe.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.panicButton}
            onPressIn={startHold}
            onPressOut={cancelHold}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[styles.panicProgress, { height: panicHolding ? progressHeight : '0%' }]}
            />
            <View style={styles.panicContent}>
              <Text style={styles.panicIcon}>🆘</Text>
              <Text style={styles.panicText}>
                {panicHolding ? 'HOLD...' : 'SOS'}
              </Text>
              <Text style={styles.panicSubtext}>
                {panicHolding ? 'Keep holding' : 'Press & hold 2 seconds'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.actionsGrid}>
        <QuickAction icon="📢" label="Report Incident" sub="16 categories" onPress={() => router.push('/(tabs)/report')} />
        <QuickAction icon="📋" label="My Reports" sub="View history" onPress={() => router.push('/(tabs)/reports')} />
        <QuickAction icon="🔍" label="Nearby LGA" sub="Local info" onPress={() => router.push('/(tabs)/report')} />
        <QuickAction icon="⚙️" label="Settings" sub="Language & account" onPress={() => router.push('/(tabs)/settings')} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CEWERS Benue South • For Official Use</Text>
      </View>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Text style={styles.quickActionSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function ConnectionIndicator() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { isOnline } = await import('../../src/api/client');
      setOnline(await isOnline());
    };
    check();
    const interval = setInterval(check, 10_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
  return (
    <View style={styles.connIndicator}>
      <View style={[styles.connDot, { backgroundColor: online ? '#22C55E' : '#B3261E' }]} />
      <Text style={styles.connText}>{online ? 'Online' : 'Offline'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1419' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#D4875A', letterSpacing: 1 },
  welcome: { fontSize: 14, color: '#8899AA', marginTop: 2 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  connIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { fontSize: 11, color: '#667788' },
  queueBadge: { backgroundColor: '#42200620', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#EAB30840' },
  queueText: { fontSize: 10, color: '#EAB308' },
  panicContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  panicButton: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#1A0808',
    borderWidth: 3, borderColor: '#B3261E',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#B3261E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  panicProgress: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#B3261E30',
  },
  panicContent: { alignItems: 'center', zIndex: 1 },
  panicIcon: { fontSize: 50 },
  panicText: { fontSize: 32, fontWeight: 'bold', color: '#B3261E', letterSpacing: 4, marginTop: 5 },
  panicSubtext: { fontSize: 10, color: '#886644', marginTop: 4 },
  panicSentContainer: { alignItems: 'center' },
  panicSentIcon: { fontSize: 60 },
  panicSentText: { fontSize: 24, fontWeight: 'bold', color: '#B3261E', marginTop: 10, letterSpacing: 2 },
  panicSentSubtext: { fontSize: 14, color: '#8899AA', marginTop: 8, textAlign: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  quickAction: {
    width: '48%', backgroundColor: '#162028', borderRadius: 12, padding: 16,
    marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#233040',
  },
  quickActionIcon: { fontSize: 28, marginBottom: 8 },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#CDD5DD' },
  quickActionSub: { fontSize: 10, color: '#556677', marginTop: 2 },
  footer: { paddingBottom: 10 },
  footerText: { fontSize: 9, color: '#334455', textAlign: 'center' },
});
