import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MemoryListScreen } from '../screens/MemoryListScreen';
import { PendingItemsScreen } from '../screens/PendingItemsScreen';
import { TrashScreen } from '../screens/TrashScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAppColors } from '../theme/colors';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const colors = useAppColors();
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>{label}</Text>
  );
}

export function TabNavigator() {
  const colors = useAppColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.divider,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="PendingItems"
        component={PendingItemsScreen}
        options={{
          tabBarLabel: '待整理',
          tabBarIcon: ({ focused }) => <TabIcon label="📥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MemoryList"
        component={MemoryListScreen}
        options={{
          tabBarLabel: '记忆库',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Trash"
        component={TrashScreen}
        options={{
          tabBarLabel: '回收站',
          tabBarIcon: ({ focused }) => <TabIcon label="🗑️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
