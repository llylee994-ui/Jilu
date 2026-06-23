import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../db/database';
import { getRecycleBinItems, restoreFromRecycleBin } from '../db/repository';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppColors } from '../theme/colors';
import type { RecycleBinItem } from '../types';

export function TrashScreen() {
  const colors = useAppColors();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const db = await getDatabase();
        const rows = await getRecycleBinItems(db);
        if (!cancelled) { setItems(rows); setLoading(false); }
      }
      load();
      return () => { cancelled = true; };
    }, [])
  );

  const handleRestore = async (item: RecycleBinItem) => {
    const db = await getDatabase();
    await restoreFromRecycleBin(db, item.id);
    const rows = await getRecycleBinItems(db);
    setItems(rows);
    Alert.alert('已恢复', '内容已移回待整理箱，可重新整理入库。');
  };

  const daysLeft = (dateStr: string): number => {
    const created = new Date(dateStr).getTime();
    const expiry = created + 7 * 24 * 60 * 60 * 1000;
    const remaining = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  };

  return (
    <ScreenWrapper title="回收站">
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🗑️</Text>
          <Text style={{ fontSize: 15, color: colors.secondaryText, textAlign: 'center' }}>
            回收站空空如也
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.cardBg,
                marginHorizontal: 16,
                marginBottom: 10,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.primaryText, marginBottom: 6 }} numberOfLines={2}>
                {item.content_snapshot}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: colors.secondaryText }}>
                  {item.source_type === 'auto_trash' ? '🤖 自动丢弃' : '👤 手动删除'} · 剩余 {daysLeft(item.created_at)} 天
                </Text>
                <TouchableOpacity onPress={() => handleRestore(item)}>
                  <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>↩️ 恢复</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        />
      )}
    </ScreenWrapper>
  );
}
