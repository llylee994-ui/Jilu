import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { getDatabase } from '../db/database';
import { getMemoryById, insertMemory } from '../db/repository';
import { MEMORY_CATEGORIES, type Memory, type MemoryCategory } from '../types';
import { useAppColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';

type RouteProps = RouteProp<RootStackParamList, 'DetailEdit'>;

export function DetailEditScreen() {
  const colors = useAppColors();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { memoryId } = route.params;

  const isNew = !memoryId; // true = 新建模式，false = 编辑模式

  const [memory, setMemory] = useState<Memory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('流程事');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(!isNew);

  // 编辑模式：加载已有记忆
  useEffect(() => {
    if (isNew) return;
    async function load() {
      const db = await getDatabase();
      const mem = await getMemoryById(db, memoryId!);
      if (mem) {
        setMemory(mem);
        setTitle(mem.title);
        setContent(mem.content);
        setCategory(mem.category);
        setTags(mem.custom_tags);
      }
      setLoading(false);
    }
    load();
  }, [memoryId]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('内容不能为空', '请输入记忆内容');
      return;
    }

    const db = await getDatabase();

    if (isNew) {
      // 新建模式
      await insertMemory(db, {
        version_group_id: '',
        title: title.trim() || content.trim().slice(0, 20),
        content: content.trim(),
        category,
        custom_tags: tags,
        workspace: 'default',
        importance: 0,
        ai_score: 0,
        change_summary: '',
      });
    } else if (memory) {
      // 编辑模式
      await db.runAsync(
        `UPDATE memories SET title=?, content=?, category=?, custom_tags=?, updated_at=datetime('now') WHERE id=?`,
        [title, content, category, tags, memory.id]
      );
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    if (!memory) return;
    Alert.alert('移入回收站', '确定要删除这条记忆吗？7天内可以在回收站恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (!memory) return;
          const db = await getDatabase();
          await db.runAsync(
            "INSERT INTO recycle_bin (original_memory_id, content_snapshot, source_type, workspace) VALUES (?, ?, 'user_delete', ?)",
            [memory.id, memory.content, memory.workspace]
          );
          await db.runAsync('DELETE FROM memories WHERE id = ?', [memory.id]);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* 标题 */}
      <Text style={[styles.label, { color: colors.secondaryText }]}>标题</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.divider, color: colors.primaryText, backgroundColor: colors.cardBg }]}
        value={title}
        onChangeText={setTitle}
        placeholder="给这段记忆起个标题"
        placeholderTextColor={colors.secondaryText}
      />

      {/* 分类 */}
      <Text style={[styles.label, { color: colors.secondaryText }]}>分类</Text>
      <View style={styles.categoryRow}>
        {MEMORY_CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.catBtn,
                {
                  backgroundColor: active ? colors.accent : colors.cardBg,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text style={{ fontSize: 13, color: active ? '#FFFFFF' : colors.primaryText }}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 内容 */}
      <Text style={[styles.label, { color: colors.secondaryText }]}>内容</Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { borderColor: colors.divider, color: colors.primaryText, backgroundColor: colors.cardBg },
        ]}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        placeholder="记忆的详细内容..."
        placeholderTextColor={colors.secondaryText}
      />

      {/* 标签 */}
      <Text style={[styles.label, { color: colors.secondaryText }]}>标签</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.divider, color: colors.primaryText, backgroundColor: colors.cardBg }]}
        value={tags}
        onChangeText={setTags}
        placeholder="如 内推,贵人（逗号分隔）"
        placeholderTextColor={colors.secondaryText}
      />

      {/* 版本历史占位 */}
      {memory && memory.version_number > 1 && (
        <View style={{ marginTop: 20, padding: 12, borderRadius: 8, backgroundColor: colors.cardBg }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            查看历史版本 →
          </Text>
          <Text style={{ color: colors.secondaryText, fontSize: 12, marginTop: 4 }}>
            该记忆共有 {memory.version_number} 个版本
          </Text>
        </View>
      )}

      {/* 保存按钮 */}
      <TouchableOpacity
        onPress={handleSave}
        style={[styles.saveBtn, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
          {isNew ? '创建' : '保存'}
        </Text>
      </TouchableOpacity>

      {/* 删除按钮（仅编辑模式） */}
      {!isNew && (
        <TouchableOpacity onPress={handleDelete} style={{ paddingVertical: 20 }}>
          <Text style={{ color: colors.danger, textAlign: 'center', fontSize: 15 }}>
            移入回收站
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = {
  label: { fontSize: 13, fontWeight: '600' as const, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 8 },
  textArea: { minHeight: 120 },
  categoryRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  saveBtn: { borderRadius: 20, paddingVertical: 14, alignItems: 'center' as const, marginTop: 24 },
};
