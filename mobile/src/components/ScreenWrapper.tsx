import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../theme/colors';

interface Props {
  title: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}

/**
 * 统一页面容器：SafeArea 顶部间距 + 标题栏 + 内容区
 * 所有页面的状态栏不会与内容重叠
 */
export function ScreenWrapper({ title, children, rightAction }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部标题栏 */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: colors.background,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
          {title}
        </Text>
        {rightAction && <View>{rightAction}</View>}
      </View>

      {/* 内容 */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
