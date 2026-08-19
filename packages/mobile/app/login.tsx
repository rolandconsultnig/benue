/**
 * Login Screen — phone + password authentication.
 * Defaults to demo credentials for first-time users.
 */

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/store/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+2348000000001');
  const [password, setPassword] = useState('cewers123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.title}>CEWERS</Text>
        <Text style={styles.subtitle}>Conflict Early Warning System</Text>
        <Text style={styles.region}>Benue South</Text>

        {/* Form */}
        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+2348000000000"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Demo: +2348000000001 / cewers123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2330' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#D4875A', textAlign: 'center', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: '#8899AA', textAlign: 'center', marginTop: 4 },
  region: { fontSize: 14, color: '#D4875A', textAlign: 'center', marginTop: 8, fontWeight: '600' },
  form: { marginTop: 40 },
  label: { fontSize: 12, color: '#8899AA', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#0D1419', borderWidth: 1, borderColor: '#2A3340',
    borderRadius: 8, padding: 14, color: '#fff', fontSize: 16, marginBottom: 16,
  },
  button: {
    backgroundColor: '#D4875A', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  error: {
    backgroundColor: '#FDECEA', color: '#B3261E', padding: 10, borderRadius: 8,
    marginBottom: 16, fontSize: 14, textAlign: 'center',
  },
  footer: { fontSize: 11, color: '#556677', textAlign: 'center', marginTop: 30 },
});
