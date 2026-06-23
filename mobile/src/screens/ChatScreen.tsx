import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDatabase } from '../db/database';
import { handleUserMessage, type ChatMessage } from '../services/MockChatAgent';
import { useAppColors } from '../theme/colors';

export function ChatScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: '嗨！我是迹录，你的职场记忆助手 📝\n\n你可以：\n· 跟我聊聊工作上的事\n· 用「记一下：xxx」让我帮你存记忆\n· 以后我还能帮你写简历和职场指南\n\n今天有什么想记录的？',
      type: 'chat',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      type: 'chat',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const db = await getDatabase();
      const replies = await handleUserMessage(db, text);
      setMessages((prev) => [...prev, ...replies]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'agent',
          text: '出了点小问题，再试一次？',
          type: 'chat',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isMemorySaved = item.type === 'memory_saved';

    return (
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 6,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: isMemorySaved
              ? colors.success + '15'
              : isUser
                ? colors.accent
                : colors.cardBg,
            borderWidth: isMemorySaved ? 1 : 0,
            borderColor: isMemorySaved ? colors.success + '30' : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: isUser ? '#FFFFFF' : colors.primaryText,
            }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* 标题栏 */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 10,
          paddingHorizontal: 16,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.divider,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primaryText }}>
          💬 迹录 Agent
        </Text>
        <Text style={{ fontSize: 12, color: colors.secondaryText, marginTop: 2 }}>
          跟我说说你的工作，我帮你记住
        </Text>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 8 }}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* 输入栏 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          paddingBottom: insets.bottom + 4,
          backgroundColor: colors.cardBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.divider,
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.primaryText,
            maxHeight: 100,
          }}
          placeholder="输入消息... 用「记一下：」存记忆"
          placeholderTextColor={colors.secondaryText}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sending || !input.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: input.trim() ? colors.accent : colors.divider,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

