import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * 应用图标组件 — 从 assets/icons/ 加载本地 PNG 图标
 *
 * 图标文件放在 mobile/assets/icons/，命名规则见 IconName 类型。
 * 替换图标时只需替换对应 PNG 文件，无需改代码。
 */

const ICONS = {
  'tab-chat': require('../../assets/icons/tab-chat.png'),
  'tab-library': require('../../assets/icons/tab-library.png'),
  'tab-archive': require('../../assets/icons/tab-archive.png'),
  'tab-trash': require('../../assets/icons/tab-trash.png'),
  'tab-settings': require('../../assets/icons/tab-settings.png'),
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  tintColor?: string;
}

export function AppIcon({ name, size = 24, tintColor }: Props) {
  return (
    <Image
      source={ICONS[name]}
      style={{
        width: size,
        height: size,
        tintColor: tintColor ?? undefined,
        resizeMode: 'contain',
      }}
    />
  );
}
