/**
 * 迹录 — 色盘定义（亮色 + 暗色双模式）
 * 与 03_交互与UI_UX规范 严格对应
 */
import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F8F6F3',
  cardBg: '#FFFFFF',
  primaryText: '#1A1A1A',
  secondaryText: '#8E8E93',
  accent: '#5E7CE6',
  accentDim: 'rgba(94, 124, 230, 0.6)',
  divider: '#E5E5EA',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
} as const;

export const darkColors = {
  background: '#1C1C1E',
  cardBg: '#2C2C2E',
  primaryText: '#E5E5EA',
  secondaryText: '#8E8E93',
  accent: '#7B93F7',
  accentDim: 'rgba(123, 147, 247, 0.6)',
  divider: '#2C2C2E',
  success: '#30D158',
  danger: '#FF453A',
  warning: '#FF9F0A',
} as const;

export type AppColors = typeof lightColors;

const AllColors = { light: lightColors, dark: darkColors };

export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? (AllColors.dark as unknown as AppColors) : AllColors.light;
}
