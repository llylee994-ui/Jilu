/**
 * MockLlmService — 确定性 AI 服务测试
 */

import { MockLlmService } from '../src/ai/MockLlmService';

const mockLlm = new MockLlmService();

describe('MockLlmService — 职场关联度打分', () => {
  test('高分：包含工作关键词 → 85 分', async () => {
    const score = await mockLlm.scoreWorkplaceRelevance('下周一跟张姐过PPT，记得带市场数据');
    expect(score).toBe(85);
  });

  test('高分：面试场景 → 85 分', async () => {
    const score = await mockLlm.scoreWorkplaceRelevance('明天下午3点面试');
    expect(score).toBe(85);
  });

  test('中分：报销额度关键词 → 55 分', async () => {
    const score = await mockLlm.scoreWorkplaceRelevance('本月报销额度还剩2000');
    expect(score).toBe(55);
  });

  test('低分：日常闲聊 → 15 分', async () => {
    const score = await mockLlm.scoreWorkplaceRelevance('今天天气不错，晚上吃啥');
    expect(score).toBe(15);
  });

  test('低分：周末娱乐 → 15 分', async () => {
    const score = await mockLlm.scoreWorkplaceRelevance('周末去哪里逛街');
    expect(score).toBe(15);
  });

  test('默认分：无关键词匹配 → 50 分', async () => {
    const score = await mockLlm.scoreWorkplaceRelevance('一条中性的文本');
    expect(score).toBe(50);
  });
});

describe('MockLlmService — 内容分类', () => {
  test('张姐 → 人脉圈', async () => {
    const category = await mockLlm.classifyContent('张姐在市场部');
    expect(category).toBe('人脉圈');
  });

  test('报销 → 财务', async () => {
    const category = await mockLlm.classifyContent('本月报销额度还剩2000');
    expect(category).toBe('财务');
  });

  test('PPT/周报 → 流程事', async () => {
    const category = await mockLlm.classifyContent('准备下周的PPT和项目方案');
    expect(category).toBe('流程事');
  });

  test('避坑/踩雷 → 避坑记', async () => {
    const category = await mockLlm.classifyContent('千万不要用旧版API，上次踩雷了');
    expect(category).toBe('避坑记');
  });

  test('法规 → 法规档', async () => {
    const category = await mockLlm.classifyContent('劳动法新规：社保缴纳比例调整');
    expect(category).toBe('法规档');
  });

  test('无匹配 → 默认流程事', async () => {
    const category = await mockLlm.classifyContent('一条没有分类特征的文本');
    expect(category).toBe('流程事');
  });
});

describe('MockLlmService — 标题生成', () => {
  test('截取前 15 字符作为标题', async () => {
    const title = await mockLlm.generateTitle('下周一10点跟张姐过PPT记得带市场数据分析报告');
    expect(title.length).toBeLessThanOrEqual(16);
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain('下周一');
  });

  test('过滤标点符号', async () => {
    const title = await mockLlm.generateTitle('（重要）张姐，市场数据');
    expect(title).toBe('重要张姐市场数据');
  });

  test('空文本返回兜底标题', async () => {
    const title = await mockLlm.generateTitle('');
    expect(title).toBe('未命名记忆');
  });
});

describe('MockLlmService — Prompt 模板', () => {
  test('打分 Prompt 包含文本内容', () => {
    const prompt = mockLlm.getScorePrompt('测试文本');
    expect(prompt).toContain('测试文本');
    expect(prompt).toContain('0到100');
  });

  test('分类 Prompt 包含六类选项', () => {
    const prompt = mockLlm.getClassifyPrompt('测试文本');
    expect(prompt).toContain('人脉圈');
    expect(prompt).toContain('流程事');
    expect(prompt).toContain('财务');
  });

  test('标题 Prompt 限制长度', () => {
    const prompt = mockLlm.getTitlePrompt('测试文本');
    expect(prompt).toContain('不超过15个字');
  });
});
