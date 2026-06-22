import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { DetailEditScreen } from '../screens/DetailEditScreen';
import { useAppColors } from '../theme/colors';

export type RootStackParamList = {
  Main: undefined;
  DetailEdit: { memoryId?: number; captureId?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const colors = useAppColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primaryText,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetailEdit"
        component={DetailEditScreen}
        options={{ title: '编辑记忆', headerBackTitle: '返回' }}
      />
    </Stack.Navigator>
  );
}
