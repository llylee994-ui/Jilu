import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Memory } from '../types';
import { useAppColors } from '../theme/colors';

interface Props {
  memory: Memory;
  onPress: (memory: Memory) => void;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

const CATEGORY_DOTS: Record<string, string> = {
  人脉圈: '🟣',
  流程事: '🔵',
  术语库: '🟢',
  避坑记: '🟠',
  法规档: '🔴',
  财务: '🟡',
};

export function MemoryCard({ memory, onPress }: Props) {
  const colors = useAppColors();

  return (
    <TouchableOpacity
      onPress={() => onPress(memory)}
      style={[styles.card, { backgroundColor: colors.cardBg }]}
      activeOpacity={0.7}
    >
      {/* 版本标记 */}
      {memory.version_number > 1 && (
        <Text style={[styles.versionBadge, { color: colors.secondaryText }]}>
          ↻ {memory.version_number}个版本
        </Text>
      )}

      {/* 标题 */}
      <Text style={[styles.title, { color: colors.primaryText }]} numberOfLines={1}>
        {memory.title || memory.content.slice(0, 20)}
      </Text>

      {/* 内容摘要 */}
      <Text style={[styles.summary, { color: colors.secondaryText }]} numberOfLines={2}>
        {memory.content.length > 30 ? memory.content.slice(0, 30) + '...' : memory.content}
      </Text>

      {/* 底部元数据 */}
      <View style={styles.meta}>
        <Text style={styles.categoryDot}>
          {CATEGORY_DOTS[memory.category] || '⚪'} {memory.category}
        </Text>

        <View style={styles.rightMeta}>
          {memory.ai_score && memory.ai_score >= 70 ? (
            <Text style={[styles.aiBadge, { color: colors.secondaryText }]}>
              🤖 AI整理
            </Text>
          ) : null}
          <Text style={[styles.time, { color: colors.secondaryText }]}>
            {relativeTime(memory.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  versionBadge: {
    fontSize: 11,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryDot: {
    fontSize: 12,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    fontSize: 11,
  },
  time: {
    fontSize: 11,
  },
});
