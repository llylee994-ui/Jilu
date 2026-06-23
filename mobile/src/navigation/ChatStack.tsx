import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConversationListScreen } from '../screens/ConversationListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { useAppColors } from '../theme/colors';

export type ChatStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: number; title: string };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
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
        name="ConversationList"
        component={ConversationListScreen}
        options={{ title: '💬 迹录 Agent' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.title, headerBackTitle: '返回' })}
      />
    </Stack.Navigator>
  );
}
