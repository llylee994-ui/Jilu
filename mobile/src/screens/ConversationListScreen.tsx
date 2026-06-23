import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDatabase } from '../db/database';
import { createConversation, getConversations, deleteConversation } from '../db/repository';
import { useAppColors } from '../theme/colors';
import type { Conversation } from '../db/repository';
import type { ChatStackParamList } from '../navigation/ChatStack';

type NavProp = NativeStackNavigationProp<ChatStackParamList, 'ConversationList'>;

export function ConversationListScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<NavProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const db = await getDatabase();
        const rows = await getConversations(db);
        if (!cancelled) setConversations(rows);
      }
      load();
      return () => { cancelled = true; };
    }, [])
  );

  const handleNewConversation = async () => {
    const db = await getDatabase();
    const conv = await createConversation(db);
    const rows = await getConversations(db);
    setConversations(rows);
    navigation.navigate('Chat', { conversationId: conv.id, title: conv.title });
  };

  const handleEnter = (conv: Conversation) => {
    navigation.navigate('Chat', { conversationId: conv.id, title: conv.title });
  };

  const handleDelete = (conv: Conversation) => {
    Alert.alert('删除对话', '确定要删除这个对话吗？消息将无法恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const db = await getDatabase();
          await deleteConversation(db, conv.id);
          const rows = await getConversations(db);
          setConversations(rows);
        },
      },
    ]);
  };

  const relativeTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return '今天';
    if (days < 2) return '昨天';
    if (days < 7) return `${days}天前`;
    return `${Math.floor(days / 7)}周前`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* 新建按钮 */}
      <TouchableOpacity
        onPress={handleNewConversation}
        style={{
          margin: 16,
          backgroundColor: colors.accent,
          borderRadius: 20,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
          ＋ 新建对话
        </Text>
      </TouchableOpacity>

      {conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>💬</Text>
          <Text style={{ fontSize: 15, color: colors.secondaryText, textAlign: 'center' }}>
            还没有对话，点击上方按钮开始和 Agent 聊天
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleEnter(item)}
              onLongPress={() => handleDelete(item)}
              style={{
                backgroundColor: colors.cardBg,
                marginHorizontal: 16,
                marginBottom: 8,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.primaryText,
                    marginBottom: 4,
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.secondaryText }}>
                  {relativeTime(item.updated_at)}
                </Text>
              </View>
              <Text style={{ color: colors.secondaryText, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
