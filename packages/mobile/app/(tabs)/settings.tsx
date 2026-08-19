/**
 * Settings — language selector, account info, sign out.
 */

import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/store/auth';
import { LANGUAGES, type Language, getStrings } from '../../src/i18n';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<Language>('en');
  const t = getStrings(lang);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.phone}>{user?.phone}</Text>
                <Text style={styles.role}>{user?.role}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LANGUAGE</Text>
          <View style={styles.card}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langRow, lang === l.code && styles.langSelected]}
                onPress={() => { setLang(l.code); AsyncStorage.setItem('cewers_lang', l.code); }}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <Text style={styles.langLabel}>{l.label}</Text>
                {lang === l.code && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <Row label="App Version" value="0.1.0" />
            <Row label="Region" value="Benue South" />
            <Row label="Zone" value="Zone C" />
            <Row label="LGAs Covered" value="9" />
          </View>
        </View>

        {/* Emergency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMERGENCY NUMBERS</Text>
          <View style={styles.card}>
            <Row label="Police (NPF)" value="199 / 112" />
            <Row label="NSCDC" value="112" />
            <Row label="Emergency" value="112" />
            <Row label="CEWERS Hotline" value="Toll-free" />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>CEWERS • Confidential — For Official Use</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1419' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '600', color: '#445566', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  card: { backgroundColor: '#162028', borderRadius: 10, borderWidth: 1, borderColor: '#233040', overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D4875A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 16, fontWeight: '600', color: '#CDD5DD' },
  phone: { fontSize: 12, color: '#556677', marginTop: 2 },
  role: { fontSize: 10, color: '#D4875A', marginTop: 4, fontWeight: '500', textTransform: 'uppercase' },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1A2330', gap: 12 },
  langSelected: { backgroundColor: '#2A1A10' },
  langFlag: { fontSize: 20 },
  langLabel: { fontSize: 14, color: '#CDD5DD', flex: 1 },
  checkMark: { fontSize: 16, color: '#D4875A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1A2330' },
  rowLabel: { fontSize: 13, color: '#8899AA' },
  rowValue: { fontSize: 13, color: '#CDD5DD', fontWeight: '500' },
  signOutButton: { marginHorizontal: 16, marginTop: 24, backgroundColor: '#1A0808', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#B3261E40' },
  signOutText: { color: '#B3261E', fontSize: 15, fontWeight: '600' },
  footer: { fontSize: 9, color: '#334455', textAlign: 'center', marginTop: 20 },
});
