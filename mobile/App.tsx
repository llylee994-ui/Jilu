import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppColors } from './src/theme/colors';

function AppContent() {
  const colors = useAppColors();

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.cardBg,
          text: colors.primaryText,
          border: colors.divider,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '900' as const },
        },
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
