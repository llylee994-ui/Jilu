import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDatabase } from '../db/database';
import { getActiveMemories, getMemoriesByCategory } from '../db/repository';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { MemoryCard } from '../components/MemoryCard';
import { CategoryChipBar } from '../components/CategoryChip';
import { useAppColors } from '../theme/colors';
import type { Memory, MemoryCategory } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function MemoryListScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<NavProp>();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filter, setFilter] = useState<MemoryCategory | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const db = await getDatabase();
        const rows = filter
          ? await getMemoriesByCategory(db, filter)
          : await getActiveMemories(db);
        if (!cancelled) {
          setMemories(rows);
          setLoading(false);
        }
      }
      load();
      return () => { cancelled = true; };
    }, [filter])
  );

  // 搜索过滤（客户端侧，基于已加载的分类数据）
  const filteredMemories = useMemo(() => {
    if (!search.trim()) return memories;
    const kw = search.trim().toLowerCase();
    return memories.filter(
      (m) =>
        m.title.toLowerCase().includes(kw) ||
        m.content.toLowerCase().includes(kw) ||
        m.custom_tags.toLowerCase().includes(kw)
    );
  }, [memories, search]);

  const handlePress = (memory: Memory) => {
    navigation.navigate('DetailEdit', { memoryId: memory.id });
  };

  const handleNew = () => {
    navigation.navigate('DetailEdit', {});
  };

  const newButton = (
    <TouchableOpacity onPress={handleNew}>
      <Text style={{ fontSize: 22, color: colors.accent }}>＋</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper title="记忆库" rightAction={newButton}>
      {/* 搜索栏 */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <TextInput
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.primaryText,
            borderWidth: 1,
            borderColor: colors.divider,
          }}
          placeholder="搜索记忆..."
          placeholderTextColor={colors.secondaryText}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <CategoryChipBar selected={filter} onSelect={setFilter} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredMemories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>
            {search ? '🔍' : '✨'}
          </Text>
          <Text style={{ fontSize: 15, color: colors.secondaryText, textAlign: 'center' }}>
            {search
              ? `没有找到包含"${search}"的记忆`
              : '还没有记忆，去复制点工作内容吧'}
          </Text>
          {!search && (
            <TouchableOpacity
              onPress={handleNew}
              style={{
                marginTop: 20,
                backgroundColor: colors.accent,
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>＋ 手动添加</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMemories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MemoryCard memory={item} onPress={handlePress} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        />
      )}
    </ScreenWrapper>
  );
}
