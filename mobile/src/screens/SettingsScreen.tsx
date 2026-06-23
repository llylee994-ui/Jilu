import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { getDatabase } from '../db/database';
import { setConfig, getConfig } from '../db/repository';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppColors } from '../theme/colors';

export function SettingsScreen() {
  const colors = useAppColors();
  const [autoClean, setAutoClean] = useState(true);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    async function load() {
      const db = await getDatabase();
      const clean = await getConfig(db, 'auto_clean_enabled');
      const nick = await getConfig(db, 'user_nickname');
      setAutoClean(clean !== 'false');
      setNickname(nick || '宝');
    }
    load();
  }, []);

  const toggleAutoClean = async (val: boolean) => {
    setAutoClean(val);
    const db = await getDatabase();
    await setConfig(db, 'auto_clean_enabled', val.toString());
  };

  return (
    <ScreenWrapper title="设置">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 工作空间 */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primaryText, marginBottom: 4 }}>
            当前工作空间
          </Text>
          <Text style={{ fontSize: 14, color: colors.accent }}>默认工作空间</Text>
        </View>

        {/* 夜间整理 */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primaryText }}>夜间自动整理</Text>
              <Text style={{ fontSize: 12, color: colors.secondaryText, marginTop: 2 }}>
                每日凌晨3-5点，充电+锁屏时执行
              </Text>
            </View>
            <Switch
              value={autoClean}
              onValueChange={toggleAutoClean}
              trackColor={{ true: colors.accent }}
            />
          </View>
        </View>

        {/* 数据导出 */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primaryText, marginBottom: 8 }}>
            数据导出
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.accent + '20',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
              onPress={() => Alert.alert('导出 JSON', 'V1 导出功能将在下个迭代完成')}
            >
              <Text style={{ color: colors.accent, fontWeight: '700' }}>JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.accent + '20',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
              onPress={() => Alert.alert('导出 Markdown', 'V1 导出功能将在下个迭代完成')}
            >
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Markdown</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI 模型信息 */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primaryText, marginBottom: 4 }}>
            AI 模型
          </Text>
          <Text style={{ fontSize: 13, color: colors.secondaryText }}>
            MockLlmService · 关键词匹配模式
          </Text>
          <Text style={{ fontSize: 11, color: colors.secondaryText, marginTop: 4 }}>
            真实模型将在 Phase 5 接入
          </Text>
        </View>

        {/* 称呼 */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primaryText, marginBottom: 4 }}>
            称呼
          </Text>
          <Text style={{ fontSize: 14, color: colors.secondaryText }}>
            昵称：{nickname || '宝'}
          </Text>
        </View>

        {/* 关于 */}
        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primaryText, marginBottom: 4 }}>
            关于迹录
          </Text>
          <Text style={{ fontSize: 13, color: colors.secondaryText }}>
            版本 0.1.0 · Phase 3
          </Text>
          <Text style={{ fontSize: 12, color: colors.secondaryText, marginTop: 4 }}>
            100% 离线 · 本地优先 · 数据永不上云
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
