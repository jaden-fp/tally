import React from 'react';
import { Tabs } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';

const ACTIVE_COLOR = '#1a1a1a';
const INACTIVE_COLOR = '#9ca3af';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          // Remove default shadow/elevation for a clean look
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => (
            <LucideIcons.Grid2x2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <LucideIcons.BarChart3 size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
