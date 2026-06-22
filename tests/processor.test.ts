/**
 * processCapture 入库流水线 — 集成测试
 * 覆盖 TC-04（高分入库）、TC-05（低分丢弃）、TC-06（中分待定）
 */

import Database from 'better-sqlite3';
import { initializeDatabase } from '../src/db/database';
import { insertRawCapture, getPendingRawCaptures, getActiveMemories, getRecycleBinItems } from '../src/db/repository';
import { processCapture, runNightlyCleanup } from '../src/services/processor';
import { MockLlmService } from '../src/ai/MockLlmService';
import { RawCapture } from '../src/models';

let db: Database.Database;
let llm: MockLlmService;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  initializeDatabase(db);
  llm = new MockLlmService();
});

afterEach(() => {
  db.close();
});

describe('TC-04：高分自动入库', () => {
  test('工作内容（≥70分）经整理后进入 memories 表', async () => {
    const capture = insertRawCapture(db, {
      content: '下周一10点跟张姐过PPT，记得带市场数据',
      source: 'clipboard',
      char_count: 21,
    });

    const result = await processCapture(db, capture, llm);

    expect(result.verdict).toBe('stored');
    expect(result.memory).toBeDefined();
    expect(result.memory!.ai_score).toBe(85);
    expect(result.memory!.is_active).toBe(1);
    expect(result.memory!.version_group_id).toBeTruthy();

    // raw_captures 状态更新
    const pending = getPendingRawCaptures(db);
    expect(pending.length).toBe(0);
  });
});

describe('TC-05：低分自动丢弃', () => {
  test('日常闲聊（<30分）直接进回收站', async () => {
    const capture = insertRawCapture(db, {
      content: '今天天气不错，晚上吃啥',
      source: 'clipboard',
      char_count: 12,
    });

    const result = await processCapture(db, capture, llm);

    expect(result.verdict).toBe('trashed');
    expect(result.recycleItem).toBeDefined();
    expect(result.recycleItem!.source_type).toBe('auto_trash');
    expect(result.memory).toBeUndefined();

    // memories 中无该记录
    const active = getActiveMemories(db);
    expect(active.length).toBe(0);

    // recycle_bin 中存在
    const recycled = getRecycleBinItems(db);
    expect(recycled.length).toBe(1);
    expect(recycled[0].content_snapshot).toBe('今天天气不错，晚上吃啥');
  });
});

describe('TC-06：中分待定保留', () => {
  test('报销额度（30-70分）留在待整理箱', async () => {
    const capture = insertRawCapture(db, {
      content: '本月报销额度还剩2000',
      source: 'clipboard',
      char_count: 11,
    });

    const result = await processCapture(db, capture, llm);

    expect(result.verdict).toBe('pending');
    expect(result.memory).toBeUndefined();
    expect(result.recycleItem).toBeUndefined();

    // 仍留在 raw_captures
    const pending = getPendingRawCaptures(db);
    expect(pending.length).toBe(1);
    expect(pending[0].content).toBe('本月报销额度还剩2000');

    // 没有进 memories
    expect(getActiveMemories(db).length).toBe(0);

    // 没有进 recycle_bin
    expect(getRecycleBinItems(db).length).toBe(0);
  });
});

describe('夜间批量整理', () => {
  test('混合数据处理后生成正确的统计摘要', async () => {
    // 布置数据：3条不同命运的内容
    insertRawCapture(db, {
      content: '下周一跟张姐过PPT',
      source: 'clipboard',
      char_count: 10,
    });
    insertRawCapture(db, {
      content: '今天天气不错',
      source: 'clipboard',
      char_count: 7,
    });
    insertRawCapture(db, {
      content: '本月报销额度还剩2000',
      source: 'clipboard',
      char_count: 11,
    });

    const summary = await runNightlyCleanup(db, llm);

    expect(summary.total).toBe(3);
    expect(summary.stored).toBe(1);  // PPT → 85 分入库
    expect(summary.trashed).toBe(1); // 天气 → 15 分丢弃
    expect(summary.pending).toBe(1); // 报销 → 55 分待定
    expect(summary.stored + summary.trashed + summary.pending).toBe(3);
  });
});

describe('硬规则优先于 AI 打分', () => {
  test('硬规则拦截的数据不经过 AI 打分', async () => {
    // 虽然含"周报"关键词（AI 会打高分），但因纯数字被硬规则拦截
    const capture = insertRawCapture(db, {
      content: '382910', // 纯数字验证码
      source: 'clipboard',
      char_count: 6,
    });

    // 用 spy 验证 AI 未被调用
    const scoreSpy = jest.spyOn(llm, 'scoreWorkplaceRelevance');

    const result = await processCapture(db, capture, llm);

    expect(result.verdict).toBe('trashed');
    expect(result.reason).toBe('rule1_pure_digits');
    expect(scoreSpy).not.toHaveBeenCalled();

    scoreSpy.mockRestore();
  });

  test('含 URL 的正常内容也被硬规则拦截，跳过大模型', async () => {
    const capture = insertRawCapture(db, {
      content: 'https://docs.example.com 这里有周报模板',
      source: 'clipboard',
      char_count: 38,
    });

    const scoreSpy = jest.spyOn(llm, 'scoreWorkplaceRelevance');

    const result = await processCapture(db, capture, llm);

    expect(result.verdict).toBe('trashed');
    expect(result.reason).toBe('rule5_url');
    expect(scoreSpy).not.toHaveBeenCalled();

    scoreSpy.mockRestore();
  });
});
