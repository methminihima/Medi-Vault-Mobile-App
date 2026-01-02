import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@components/haptic-tab';
import { IconSymbol } from '@components/ui/icon-symbol';
import { Colors } from '@constants/theme';
import { useColorScheme } from '@hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="doctor-dashboard"
        options={{
          title: 'Dashboard',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Admin',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="pharmacist-dashboard"
        options={{
          title: 'Pharmacist',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="lab-technician-dashboard"
        options={{
          title: 'Lab Technician',
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

