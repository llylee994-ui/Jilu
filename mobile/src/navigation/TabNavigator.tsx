import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChatStack } from './ChatStack';
import { MemoryListScreen } from '../screens/MemoryListScreen';
import { PendingItemsScreen } from '../screens/PendingItemsScreen';
import { TrashScreen } from '../screens/TrashScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AppIcon, type IconName } from '../components/AppIcon';
import { useAppColors } from '../theme/colors';

const Tab = createBottomTabNavigator();

type TabIconName = 'tab-chat' | 'tab-library' | 'tab-archive' | 'tab-trash' | 'tab-settings';

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
        name="ChatStack"
        component={ChatStack}
        options={{
          tabBarLabel: '聊天',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="tab-chat" size={size} tintColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MemoryList"
        component={MemoryListScreen}
        options={{
          tabBarLabel: '记忆库',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="tab-library" size={size} tintColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PendingItems"
        component={PendingItemsScreen}
        options={{
          tabBarLabel: '待整理',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="tab-archive" size={size} tintColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trash"
        component={TrashScreen}
        options={{
          tabBarLabel: '回收站',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="tab-trash" size={size} tintColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="tab-settings" size={size} tintColor={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
