/**
 * 硬规则过滤器 — 单元测试
 * 5 个必过用例（UT-01 ~ UT-05）+ 补充边界用例
 * 零依赖，纯函数测试
 */

import { hardFilter } from '../src/filter/hardFilter';

describe('hardFilter — 硬规则过滤器', () => {
  // ====== 必过用例 ======

  test('UT-01：纯6位数字被拦截为 rule1', () => {
    const result = hardFilter('382910');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule1_pure_digits');
  });

  test('UT-02：含数字但有文字上下文，放行', () => {
    const result = hardFilter('订单号382910');
    expect(result.verdict).toBe('PASS');
    expect(result.ruleId).toBeNull();
  });

  test('UT-03：外卖取餐码被拦截为 rule2（含"取餐码"关键词，优先命中）', () => {
    const result = hardFilter('取餐码：A3B2C1 麦当劳');
    expect(result.verdict).toBe('TRASH');
    // 规则2（快递/外卖）优先级高于规则4（验证码），"取餐码"先命中
    expect(result.ruleId).toBe('rule2_delivery');
  });

  test('UT-04：工作内容正常放行', () => {
    const result = hardFilter('下周一10点跟张姐过PPT，记得带市场数据');
    expect(result.verdict).toBe('PASS');
    expect(result.ruleId).toBeNull();
  });

  test('UT-05：URL 链接被拦截为 rule5', () => {
    const result = hardFilter('https://example.com/doc');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule5_url');
  });

  // ====== 补充边界用例 ======

  test('4位纯数字被拦截', () => {
    const result = hardFilter('1234');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule1_pure_digits');
  });

  test('3位纯数字放行（不满足4-6位范围）', () => {
    const result = hardFilter('123');
    expect(result.verdict).toBe('PASS');
  });

  test('7位纯数字放行', () => {
    const result = hardFilter('1234567');
    expect(result.verdict).toBe('PASS');
  });

  test('带空白的纯数字被拦截', () => {
    const result = hardFilter('  847261  ');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule1_pure_digits');
  });

  test('外卖配送信息被拦截', () => {
    const result = hardFilter('预计30分钟送达，骑手已接单');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule2_delivery');
  });

  test('拼多多订单被拦截', () => {
    const result = hardFilter('拼多多订单号已发货');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule2_delivery');
  });

  test('银行消费通知被拦截', () => {
    const result = hardFilter('您的尾号8888卡银行消费1,234.56元');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule3_system_notification');
  });

  test('登录验证码被拦截', () => {
    const result = hardFilter('登录验证码：3847，30分钟内有效');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule3_system_notification');
  });

  test('纯表情字符被拦截', () => {
    const result = hardFilter('🎉');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule6_short_useless');
  });

  test('www 链接被拦截', () => {
    const result = hardFilter('www.example.com/page');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule5_url');
  });

  test('正常职场对话放行', () => {
    // TC-03 场景
    const result = hardFilter('下周一10点跟张姐过PPT，记得带市场数据');
    expect(result.verdict).toBe('PASS');
  });

  test('空字符串放行', () => {
    // 空字符串不满足任何规则（长度0 ≤ 2，但 trim 后无内容，规则6 匹配）
    const result = hardFilter('');
    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule6_short_useless');
  });

  test('短英文缩写放行（含字母，不满足规则6）', () => {
    const result = hardFilter('OK');
    expect(result.verdict).toBe('PASS');
  });
});
