/**
 * My Reports — shows reports submitted by this user + pending offline queue.
 * Distinguishes between synced (on server) and pending (queued offline).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '../../src/api/client';
import { getQueue, type QueuedReport, syncQueue, onSync } from '../../src/api/offline';
import { CATEGORIES } from '@cewers/shared';
import { categoryMeta, timeAgo } from '../../src/lib/format';

type Tab = 'synced' | 'pending';

export default function MyReportsScreen() {
  const [tab, setTab] = useState<Tab>('synced');
  const [syncedReports, setSyncedReports] = useState<any[]>([]);
  const [queue, setQueue] = useState<QueuedReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'synced') {
        const data = await api.get<{ items: any[] }>('/api/incidents?pageSize=50');
        setSyncedReports(data.items);
      } else {
        setQueue(await getQueue());
      }
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    loadData();
    const unsub = onSync(() => { if (tab === 'pending') getQueue().then(setQueue); });
    return () => { unsub(); };
  }, [tab, loadData]);

  const renderItem = ({ item }: { item: any }) => {
    const cat = categoryMeta(item.category);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/incident/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{cat.icon}</Text>
          <Text style={styles.cardTitle}>{cat.label}</Text>
          <Text style={[styles.priorityBadge, { backgroundColor: item.priority === 'P1' ? '#B3261E' : item.priority === 'P2' ? '#D4875A' : '#556677' }]}>
            {item.priority}
          </Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardRef}>{item.reference}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.occurredAt)}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'CLOSED' ? '#4B5563' : item.status === 'RESOLVED' ? '#22C55E' : '#D4875A' }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderQueued = ({ item }: { item: QueuedReport }) => {
    const cat = CATEGORIES.find((c) => c.value === item.dto.category);
    return (
      <View style={[styles.card, { borderColor: '#EAB30840' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{cat?.icon || '📢'}</Text>
          <Text style={styles.cardTitle}>{cat?.label || 'Report'}</Text>
          {item.isPanic && <Text style={styles.panicTag}>🆘 SOS</Text>}
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>PENDING SYNC</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.dto.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardTime}>Queued {timeAgo(item.queuedAt)}</Text>
          {item.attempts > 0 && <Text style={styles.retryText}>{item.attempts} retries</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab selector */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'synced' && styles.tabActive]}
          onPress={() => setTab('synced')}
        >
          <Text style={[styles.tabText, tab === 'synced' && styles.tabTextActive]}>
            Submitted ({syncedReports.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Pending ({queue.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync button if pending items exist */}
      {tab === 'pending' && queue.length > 0 && (
        <TouchableOpacity style={styles.syncButton} onPress={() => syncQueue().then(() => getQueue().then(setQueue))}>
          <Text style={styles.syncButtonText}>🔄 Sync Now</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={tab === 'synced' ? syncedReports : queue}
        keyExtractor={(item: any) => item.id}
        renderItem={tab === 'synced' ? renderItem : renderQueued}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#D4875A" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{tab === 'synced' ? '📋' : '✅'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'synced' ? 'No reports yet' : 'All reports synced'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1419' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#233040' },
  tabActive: { borderBottomColor: '#D4875A' },
  tabText: { fontSize: 13, color: '#556677', fontWeight: '500' },
  tabTextActive: { color: '#D4875A' },
  syncButton: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#2A1A10', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#D4875A40' },
  syncButtonText: { color: '#D4875A', fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#162028', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#233040' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardIcon: { fontSize: 20 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#CDD5DD', flex: 1 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, color: '#fff', fontWeight: 'bold' },
  panicTag: { fontSize: 11, color: '#B3261E', fontWeight: 'bold' },
  pendingBadge: { backgroundColor: '#422006', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pendingText: { fontSize: 8, color: '#EAB308', fontWeight: 'bold' },
  cardDesc: { fontSize: 12, color: '#8899AA', marginBottom: 8, lineHeight: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardRef: { fontSize: 10, color: '#445566', fontFamily: 'monospace' },
  cardTime: { fontSize: 10, color: '#445566', flex: 1 },
  retryText: { fontSize: 10, color: '#B3261E' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: '#445566', marginTop: 12 },
});
