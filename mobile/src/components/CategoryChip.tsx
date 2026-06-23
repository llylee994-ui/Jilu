import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MEMORY_CATEGORIES, type MemoryCategory } from '../types';
import { useAppColors } from '../theme/colors';

interface Props {
  selected: MemoryCategory | null;
  onSelect: (category: MemoryCategory | null) => void;
}

export function CategoryChipBar({ selected, onSelect }: Props) {
  const colors = useAppColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scrollView}
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
    </View>
  );
}

const CHIP_HEIGHT = 32;

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: CHIP_HEIGHT + 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: CHIP_HEIGHT / 2,
    borderWidth: 1,
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
