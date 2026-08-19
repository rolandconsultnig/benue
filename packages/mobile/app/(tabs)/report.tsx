/**
 * Report Screen — the core citizen reporting flow.
 *
 * Steps: Category → Details (description + photo + location) → Submit
 * Submissions work offline — queued if no connectivity.
 */

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, type IncidentCategory, type CategoryMeta, Channel } from '@cewers/shared';
import { useLocation, useCamera } from '../../src/hooks/useLocation';
import { api, isOnline } from '../../src/api/client';
import { enqueueReport, getQueueCount } from '../../src/api/offline';

export default function ReportScreen() {
  const [selectedCat, setSelectedCat] = useState<CategoryMeta | null>(null);
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { coords, loading: locLoading, getLocation } = useLocation();
  const { photo, loading: camLoading, takePhoto, clearPhoto } = useCamera();

  const handleSubmit = async () => {
    if (!selectedCat || !description.trim()) {
      Alert.alert('Required', 'Please select a category and describe the incident.');
      return;
    }

    setSubmitting(true);

    // Ensure we have location — await the returned coords directly
    let geo = coords;
    if (!geo) {
      geo = await getLocation();
    }

    const dto = {
      category: selectedCat.value as IncidentCategory,
      description: description.trim(),
      geo: geo || { lng: 8.05, lat: 7.2 }, // fallback to Benue South centroid
      channel: Channel.APP,
      anonymous,
      priorityHint: selectedCat.defaultPriority,
    };

    try {
      const online = await isOnline();
      if (online) {
        await api.post('/api/incidents', dto);
      } else {
        await enqueueReport(dto, false);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedCat(null);
        setDescription('');
        clearPhoto();
        router.navigate('/(tabs)');
      }, 2000);
    } catch (err: any) {
      // Fallback: queue it for later sync
      try {
        await enqueueReport(dto, false);
        Alert.alert('Saved', 'Report saved and will sync when online.');
        router.navigate('/(tabs)');
      } catch {
        Alert.alert('Error', err.message || 'Failed to submit report.');
      }
    }
    setSubmitting(false);
  };

  // ─── Success view ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successText}>Report Submitted</Text>
        <Text style={styles.successSub}>Your report has been sent to the Situation Room.</Text>
      </SafeAreaView>
    );
  }

  // ─── Main report flow ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Category grid */}
        <Text style={styles.sectionTitle}>What are you reporting?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryCard,
                selectedCat?.value === cat.value && styles.categorySelected,
              ]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCat?.value === cat.value && styles.categoryLabelSelected,
                ]}
                numberOfLines={2}
              >
                {cat.label}
              </Text>
              {cat.defaultPriority === 'P1' && (
                <View style={styles.urgentTag}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        {selectedCat && (
          <>
            <Text style={styles.sectionTitle}>Describe what's happening</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide details: location, people involved, what you saw..."
              placeholderTextColor="#556677"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Location */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.locButton} onPress={getLocation} disabled={locLoading}>
                {locLoading ? (
                  <ActivityIndicator size="small" color="#D4875A" />
                ) : (
                  <Text style={styles.locIcon}>📍</Text>
                )}
                <Text style={styles.locText}>
                  {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Get Location'}
                </Text>
              </TouchableOpacity>

              {/* Photo */}
              <TouchableOpacity style={styles.locButton} onPress={takePhoto} disabled={camLoading}>
                {camLoading ? (
                  <ActivityIndicator size="small" color="#D4875A" />
                ) : photo ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.photoPreview} />
                ) : (
                  <>
                    <Text style={styles.locIcon}>📷</Text>
                    <Text style={styles.locText}>Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Anonymous toggle */}
            <View style={styles.anonRow}>
              <View>
                <Text style={styles.anonLabel}>Report anonymously</Text>
                <Text style={styles.anonSub}>Your identity will not be attached</Text>
              </View>
              <Switch
                value={anonymous}
                onValueChange={setAnonymous}
                trackColor={{ false: '#2A3340', true: '#D4875A' }}
                thumbColor="#fff"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1419' },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#8899AA', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    width: '31%', backgroundColor: '#162028', borderRadius: 10, padding: 10,
    marginBottom: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#233040', position: 'relative',
  },
  categorySelected: { borderColor: '#D4875A', backgroundColor: '#2A1A10' },
  categoryIcon: { fontSize: 24, marginBottom: 6 },
  categoryLabel: { fontSize: 9, color: '#8899AA', textAlign: 'center', lineHeight: 12 },
  categoryLabelSelected: { color: '#D4875A', fontWeight: '600' },
  urgentTag: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#B3261E',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  urgentText: { fontSize: 7, color: '#fff', fontWeight: 'bold' },
  textArea: {
    backgroundColor: '#162028', borderWidth: 1, borderColor: '#233040', borderRadius: 10,
    padding: 14, color: '#fff', fontSize: 15, minHeight: 100, marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  locButton: {
    flex: 1, backgroundColor: '#162028', borderWidth: 1, borderColor: '#233040',
    borderRadius: 10, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  locIcon: { fontSize: 18 },
  locText: { fontSize: 12, color: '#8899AA' },
  photoPreview: { width: 40, height: 40, borderRadius: 6 },
  anonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 8 },
  anonLabel: { fontSize: 14, color: '#CDD5DD', fontWeight: '500' },
  anonSub: { fontSize: 11, color: '#556677', marginTop: 2 },
  submitButton: {
    backgroundColor: '#D4875A', borderRadius: 10, padding: 16, alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  successContainer: { flex: 1, backgroundColor: '#0D1419', justifyContent: 'center', alignItems: 'center' },
  successIcon: { fontSize: 60 },
  successText: { fontSize: 22, fontWeight: 'bold', color: '#22C55E', marginTop: 16 },
  successSub: { fontSize: 14, color: '#8899AA', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
