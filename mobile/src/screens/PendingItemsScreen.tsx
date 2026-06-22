import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../db/database';
import { getPendingRawCaptures, updateRawCaptureStatus, insertMemory, moveToRecycleBin } from '../db/repository';
import { hardFilter } from '../types';
import { MockLlmService } from '../types';
import { useAppColors } from '../theme/colors';
import type { RawCapture } from '../types';

const llm = new MockLlmService();

export function PendingItemsScreen() {
  const colors = useAppColors();
  const [items, setItems] = useState<RawCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const db = await getDatabase();
        const rows = await getPendingRawCaptures(db);
        if (!cancelled) { setItems(rows); setLoading(false); }
      }
      load();
      return () => { cancelled = true; };
    }, [])
  );

  const handleSmartOrganize = async () => {
    setProcessing(true);
    const db = await getDatabase();
    let trashed = 0, stored = 0, pending = 0;

    for (const item of items) {
      // 硬规则
      const filterResult = hardFilter(item.content);
      if (filterResult.verdict === 'TRASH') {
        await moveToRecycleBin(db, {
          original_memory_id: null,
          content_snapshot: item.content,
          source_type: 'auto_trash',
          workspace: 'default',
        });
        await updateRawCaptureStatus(db, item.id, 'trashed');
        trashed++;
        continue;
      }

      const score = await llm.scoreWorkplaceRelevance(item.content);

      if (score >= 70) {
        const category = await llm.classifyContent(item.content);
        const title = await llm.generateTitle(item.content);
        await insertMemory(db, {
          version_group_id: '', // 由 repository 自动生成
          title,
          content: item.content,
          category,
          custom_tags: '',
          workspace: 'default',
          importance: 0,
          ai_score: score,
          change_summary: '',
        });
        await updateRawCaptureStatus(db, item.id, 'processed');
        stored++;
      } else if (score < 30) {
        await moveToRecycleBin(db, {
          original_memory_id: null,
          content_snapshot: item.content,
          source_type: 'auto_trash',
          workspace: 'default',
        });
        await updateRawCaptureStatus(db, item.id, 'trashed');
        trashed++;
      } else {
        pending++;
      }
    }

    // 刷新列表
    const remaining = await getPendingRawCaptures(db);
    setItems(remaining);
    setProcessing(false);

    Alert.alert(
      '整理完成',
      `🗑️ 丢弃 ${trashed} 条\n📥 入库 ${stored} 条\n⏳ 待定 ${pending} 条`,
      [{ text: '好的' }]
    );
  };

  const handleKeep = async (item: RawCapture) => {
    const db = await getDatabase();
    const score = await llm.scoreWorkplaceRelevance(item.content);
    const category = await llm.classifyContent(item.content);
    const title = await llm.generateTitle(item.content);
    await insertMemory(db, {
      version_group_id: '',
      title,
      content: item.content,
      category,
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: score,
      change_summary: '',
    });
    await updateRawCaptureStatus(db, item.id, 'processed');
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleTrash = async (item: RawCapture) => {
    const db = await getDatabase();
    await moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: item.content,
      source_type: 'user_delete',
      workspace: 'default',
    });
    await updateRawCaptureStatus(db, item.id, 'trashed');
    setItems((prev) => prev.filter((i) => i.id !== item.id));
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
      {/* 顶部智能整理按钮 */}
      {items.length > 0 && (
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={handleSmartOrganize}
            disabled={processing}
            style={{
              backgroundColor: processing ? colors.divider : colors.accent,
              borderRadius: 20,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              {processing ? '🤖 整理中...' : '🤖 一键智能整理'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🎉</Text>
          <Text style={{ fontSize: 15, color: colors.secondaryText, textAlign: 'center' }}>
            今天干干净净的，继续加油吧！
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
              <Text style={{ fontSize: 14, color: colors.primaryText, lineHeight: 20, marginBottom: 10 }}>
                {item.content.length > 100 ? item.content.slice(0, 100) + '...' : item.content}
              </Text>
              <Text style={{ fontSize: 11, color: colors.secondaryText, marginBottom: 10 }}>
                {item.captured_at}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleKeep(item)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.success + '20',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.success, fontWeight: '700' }}>保留入库</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTrash(item)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.divider,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.secondaryText, fontWeight: '600' }}>丢弃</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
