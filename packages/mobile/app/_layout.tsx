/**
 * Root Layout — wraps the app in AuthProvider and starts the sync engine.
 */

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/store/auth';
import { startSyncEngine, stopSyncEngine } from '../src/api/offline';
import { ActivityIndicator, View } from 'react-native';

function AppNavigator() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      startSyncEngine();
      return () => stopSyncEngine();
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A2330' }}>
        <ActivityIndicator size="large" color="#D4875A" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="login" />
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="report" options={{ presentation: 'modal', headerShown: true, title: 'Report Incident' }} />
          <Stack.Screen name="incident/[id]" />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}
