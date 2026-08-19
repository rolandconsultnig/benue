/** Incident Detail — shows full timeline + status for a submitted report. */

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../src/api/client';
import { categoryMeta, timeAgo, STATUS_COLOR, PRIORITY_COLOR } from '../../src/lib/format';
import type { Incident } from '@cewers/shared';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<Incident>(`/api/incidents/${id}`)
      .then(setIncident)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#D4875A" />
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={{ color: '#556677' }}>Report not found</Text>
      </SafeAreaView>
    );
  }

  const cat = categoryMeta(incident.category);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{cat.icon}</Text>
          <Text style={styles.headerTitle}>{cat.label}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[incident.priority] }]}>
            <Text style={styles.priorityText}>{incident.priority}</Text>
          </View>
        </View>
        <Text style={styles.reference}>{incident.reference}</Text>
        <Text style={styles.description}>{incident.description}</Text>

        {/* Status badges */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[incident.status] }]}>
            <Text style={styles.statusText}>{incident.status.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.channelBadge}>
            <Text style={styles.channelText}>via {incident.channel}</Text>
          </View>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>TIMELINE</Text>
        <View style={styles.timeline}>
          {incident.events.map((event, i) => (
            <View key={event.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: i === 0 ? '#D4875A' : '#334455' }]} />
              {i < incident.events.length - 1 && <View style={styles.timelineLine} />}
              <View style={styles.timelineContent}>
                <Text style={styles.timelineType}>{event.type.replace(/_/g, ' ')}</Text>
                {event.note && <Text style={styles.timelineNote}>{event.note}</Text>}
                <Text style={styles.timelineMeta}>
                  {event.actorName || 'System'} • {timeAgo(event.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0D1419', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#0D1419' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#CDD5DD', flex: 1 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  reference: { fontSize: 11, color: '#445566', fontFamily: 'monospace', marginBottom: 12 },
  description: { fontSize: 14, color: '#8899AA', lineHeight: 20, marginBottom: 16 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '600', textTransform: 'uppercase' },
  channelBadge: { backgroundColor: '#233040', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  channelText: { fontSize: 11, color: '#8899AA' },
  sectionTitle: { fontSize: 10, fontWeight: '600', color: '#445566', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, zIndex: 1 },
  timelineLine: { position: 'absolute', left: 4, top: 14, width: 2, height: '100%', backgroundColor: '#233040' },
  timelineContent: { flex: 1, marginLeft: 12 },
  timelineType: { fontSize: 13, fontWeight: '600', color: '#CDD5DD' },
  timelineNote: { fontSize: 12, color: '#667788', marginTop: 2 },
  timelineMeta: { fontSize: 10, color: '#445566', marginTop: 2 },
});
