import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDatabase } from '../db/database';
import { getMessagesByConversation, insertMessage, updateConversationTitle } from '../db/repository';
import type { MessageRow } from '../db/repository';
import { handleUserMessage, type ChatMessage } from '../services/MockChatAgent';
import { useAppColors } from '../theme/colors';
import type { ChatStackParamList } from '../navigation/ChatStack';

type RouteProps = RouteProp<ChatStackParamList, 'Chat'>;

export function ChatScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const { conversationId } = route.params;
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [memoryMode, setMemoryMode] = useState(false); // 「记一下」开关
  const [loaded, setLoaded] = useState(false);

  // 加载历史消息
  useEffect(() => {
    async function load() {
      const db = await getDatabase();
      const rows = await getMessagesByConversation(db, conversationId);
      if (rows.length === 0) {
        // 新对话：插入欢迎消息
        const welcome: ChatMessage = {
          id: 'welcome',
          role: 'agent',
          text: '嗨！我是迹录，你的职场记忆助手 📝\n\n你可以：\n· 跟我聊聊工作上的事\n· 打开「📝 记一下」开关，说的话会自动存入记忆库\n· 以后我还能帮你写简历和职场指南\n\n今天有什么想记录的？',
          type: 'chat',
          timestamp: Date.now(),
        };
        await insertMessage(db, {
          conversation_id: conversationId,
          role: 'agent',
          text: welcome.text,
          type: 'chat',
        });
        setMessages([welcome]);
      } else {
        setMessages(
          rows.map((r: MessageRow) => ({
            id: r.id.toString(),
            role: r.role as ChatMessage['role'],
            text: r.text,
            type: r.type as ChatMessage['type'],
            timestamp: new Date(r.created_at).getTime(),
          }))
        );
      }
      setLoaded(true);
    }
    load();
  }, [conversationId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const finalText = memoryMode ? `记一下：${text}` : text;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: finalText,
      type: 'chat',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setMemoryMode(false);
    setSending(true);

    try {
      const db = await getDatabase();
      // 保存用户消息
      await insertMessage(db, {
        conversation_id: conversationId,
        role: 'user',
        text: finalText,
        type: 'chat',
      });

      // 获取 Agent 回复
      const replies = await handleUserMessage(db, finalText);

      // 保存 Agent 回复
      for (const reply of replies) {
        await insertMessage(db, {
          conversation_id: conversationId,
          role: 'agent',
          text: reply.text,
          type: reply.type,
        });
      }

      // 自动更新会话标题（取用户第一条非命令消息的前20字）
      if (!memoryMode) {
        const title = text.slice(0, 20);
        await updateConversationTitle(db, conversationId, title);
      }

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

  const formatChatTime = (ts: number): string => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (isToday) return `${hh}:${mm}`;
    const M = d.getMonth() + 1;
    const D = d.getDate();
    return `${M}/${D} ${hh}:${mm}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isMemorySaved = item.type === 'memory_saved';

    return (
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 5,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {!isUser && (
          <Text style={{ fontSize: 10, color: colors.secondaryText, marginBottom: 2, marginLeft: 4 }}>
            Agent
          </Text>
        )}
        <View
          style={{
            maxWidth: '82%',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: isMemorySaved
              ? colors.success + '18'
              : isUser
                ? colors.accent
                : colors.cardBg,
            borderWidth: isMemorySaved ? 1 : 0,
            borderColor: isMemorySaved ? colors.success + '40' : 'transparent',
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

        {/* 时间戳 */}
        <Text
          style={{
            fontSize: 10,
            color: colors.secondaryText,
            marginTop: 3,
            marginLeft: isUser ? 0 : 4,
            marginRight: isUser ? 4 : 0,
          }}
        >
          {formatChatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 4 }}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* 「记一下」快捷键 + 输入栏 */}
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.divider,
          paddingBottom: insets.bottom + 4,
        }}
      >
        {/* 快捷键区 */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setMemoryMode(!memoryMode)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: memoryMode ? colors.success + '25' : colors.background,
              borderWidth: memoryMode ? 1 : 0,
              borderColor: memoryMode ? colors.success + '50' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>📝</Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: memoryMode ? colors.success : colors.secondaryText,
              }}
            >
              记一下
            </Text>
            {memoryMode && (
              <Text style={{ fontSize: 11, color: colors.success, marginLeft: 4 }}>
                ON
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 输入栏 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 12,
            paddingTop: 4,
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
            placeholder={
              memoryMode
                ? '正在记录到记忆库...'
                : '输入消息...'
            }
            placeholderTextColor={memoryMode ? colors.success : colors.secondaryText}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => {
              if (input.trim()) sendMessage();
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending || !input.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: input.trim() ? (memoryMode ? colors.success : colors.accent) : colors.divider,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 2,
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
