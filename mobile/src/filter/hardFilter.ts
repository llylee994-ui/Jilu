import { FilterResult } from '../types/models';

/**
 * 硬规则过滤器（6 条规则，按优先级执行）
 *
 * 规则优先级：命中即停止，不再检查后续规则
 *   规则1 — 纯 4-6 位数字，无其他文字
 *   规则2 — 快递/外卖/电商关键词
 *   规则3 — 系统通知/金融关键词
 *   规则4 — "验证码"关键词 + 数字组合
 *   规则5 — URL 链接
 *   规则6 — 极短无意义文本（≤2 字符，无中文/英文/数字）
 *
 * @returns FilterResult — verdict + 命中规则ID
 */
export function hardFilter(text: string): FilterResult {
  const stripped = text.trim();

  // 规则1：纯数字验证码（4-6位纯数字，无其他文字）
  if (/^\d{4,6}$/.test(stripped)) {
    return { verdict: 'TRASH', ruleId: 'rule1_pure_digits' };
  }

  // 规则2：快递/外卖/电商
  if (/取餐码|配送中|预计.*送达|红包到账|淘宝订单|拼多多|快递单号/.test(text)) {
    return { verdict: 'TRASH', ruleId: 'rule2_delivery' };
  }

  // 规则3：系统通知/金融
  if (/剩余流量|话费充值|银行.*消费|登录验证|您的账户|余额变动/.test(text)) {
    return { verdict: 'TRASH', ruleId: 'rule3_system_notification' };
  }

  // 规则4：带"验证码"关键词的数字组合
  if (/验证码.*\d{4,8}|\d{4,8}.*验证码/.test(text)) {
    return { verdict: 'TRASH', ruleId: 'rule4_verification_code' };
  }

  // 规则5：URL 链接
  if (/https?:\/\/\S+|www\.\S+/.test(text)) {
    return { verdict: 'TRASH', ruleId: 'rule5_url' };
  }

  // 规则6：极短无意义文本（≤2 字符，且无中文/英文/数字）
  const clean = text.replace(/\s+/g, '');
  if (clean.length <= 2 && !/[一-鿿A-Za-z0-9]/.test(clean)) {
    return { verdict: 'TRASH', ruleId: 'rule6_short_useless' };
  }

  return { verdict: 'PASS', ruleId: null };
}
