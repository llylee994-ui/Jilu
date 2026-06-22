import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDatabase } from '../db/database';
import { getActiveMemories, getMemoriesByCategory } from '../db/repository';
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

  const handlePress = (memory: Memory) => {
    navigation.navigate('DetailEdit', { memoryId: memory.id });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CategoryChipBar selected={filter} onSelect={setFilter} />

      {memories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>✨</Text>
          <Text style={{ fontSize: 15, color: colors.secondaryText, textAlign: 'center' }}>
            还没有记忆，去复制点工作内容吧
          </Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MemoryCard memory={item} onPress={handlePress} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
