import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 9, color, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1A2330', borderTopColor: '#2A3340', height: 60 },
        tabBarActiveTintColor: '#D4875A',
        tabBarInactiveTintColor: '#667788',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="🛡️" label="Home" color={color} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="📢" label="Report" color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="📋" label="My Reports" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="⚙️" label="Settings" color={color} /> }}
      />
    </Tabs>
  );
}
