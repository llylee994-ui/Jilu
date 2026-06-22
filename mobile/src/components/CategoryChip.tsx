import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MEMORY_CATEGORIES, type MemoryCategory } from '../types';
import { useAppColors } from '../theme/colors';

interface Props {
  selected: MemoryCategory | null; // null = 全部
  onSelect: (category: MemoryCategory | null) => void;
}

export function CategoryChipBar({ selected, onSelect }: Props) {
  const colors = useAppColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={{ backgroundColor: colors.background, borderBottomWidth: 0 }}
    >
      {/* 全部 */}
      <TouchableOpacity
        onPress={() => onSelect(null)}
        style={[
          styles.chip,
          {
            backgroundColor: selected === null ? colors.accent : colors.cardBg,
            borderColor: colors.divider,
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: selected === null ? '#FFFFFF' : colors.primaryText },
          ]}
        >
          全部
        </Text>
      </TouchableOpacity>

      {/* 六类 */}
      {MEMORY_CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(active ? null : cat)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.accent : colors.cardBg,
                borderColor: colors.divider,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? '#FFFFFF' : colors.primaryText },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
