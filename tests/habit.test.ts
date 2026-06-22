/**
 * 标签习惯学习 — 测试
 */

import Database from 'better-sqlite3';
import { initializeDatabase } from '../src/db/database';
import { insertMemory, insertCorrectionLog } from '../src/db/repository';
import { analyzeHabits, approveHabit, rejectHabit } from '../src/services/habitLearner';
import { getConfig } from '../src/db/repository';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  initializeDatabase(db);
});

afterEach(() => {
  db.close();
});

describe('analyzeHabits — 习惯发现', () => {
  test('同一关键词被修正 ≥3 次且方向一致（≥60%）→ 被发现', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-habit',
      title: '报销单',
      content: '本月报销单',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 70,
      change_summary: '',
    });

    // 3 次修正：流程事 → 财务
    for (let i = 0; i < 3; i++) {
      insertCorrectionLog(db, {
        memory_id: memory.id,
        original_category: '流程事',
        corrected_category: '财务',
        extracted_keyword: '报销',
      });
    }

    const analysis = analyzeHabits(db);
    expect(analysis.discoveries.length).toBe(1);
    expect(analysis.discoveries[0].keyword).toBe('报销');
    expect(analysis.discoveries[0].fromCategory).toBe('流程事');
    expect(analysis.discoveries[0].toCategory).toBe('财务');
    expect(analysis.discoveries[0].correctionCount).toBe(3);
    expect(analysis.discoveries[0].consistencyRate).toBe(1);
    expect(analysis.suggestions.length).toBe(1);
    expect(analysis.suggestions[0]).toContain('报销');
    expect(analysis.suggestions[0]).toContain('流程事');
    expect(analysis.suggestions[0]).toContain('财务');
  });

  test('修正次数不足 3 → 不触发', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-low',
      title: '测试',
      content: '测试',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 70,
      change_summary: '',
    });

    // 仅 2 次修正
    for (let i = 0; i < 2; i++) {
      insertCorrectionLog(db, {
        memory_id: memory.id,
        original_category: '流程事',
        corrected_category: '财务',
        extracted_keyword: '报销',
      });
    }

    const analysis = analyzeHabits(db);
    expect(analysis.discoveries.length).toBe(0);
    expect(analysis.suggestions.length).toBe(0);
  });

  test('修正方向不一致（<60%）→ 不触发', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-mixed',
      title: '测试',
      content: '测试',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 70,
      change_summary: '',
    });

    // 2 次→财务，2 次→人脉圈，总次数 4，一致性 50%
    insertCorrectionLog(db, { memory_id: memory.id, original_category: '流程事', corrected_category: '财务', extracted_keyword: '混合' });
    insertCorrectionLog(db, { memory_id: memory.id, original_category: '流程事', corrected_category: '财务', extracted_keyword: '混合' });
    insertCorrectionLog(db, { memory_id: memory.id, original_category: '流程事', corrected_category: '人脉圈', extracted_keyword: '混合' });
    insertCorrectionLog(db, { memory_id: memory.id, original_category: '流程事', corrected_category: '人脉圈', extracted_keyword: '混合' });

    const analysis = analyzeHabits(db);
    expect(analysis.discoveries.length).toBe(0);
  });
});

describe('approveHabit / rejectHabit', () => {
  test('同意习惯后存入 system_config', () => {
    approveHabit(db, '报销', '财务');
    const mapping = getConfig(db, 'keyword_category_mapping');
    expect(mapping).toBeDefined();

    const parsed = JSON.parse(mapping!);
    expect(parsed['报销']).toBe('财务');
  });

  test('拒绝习惯后清空对应 correction_logs 关键词', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-reject',
      title: '测试',
      content: '测试',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 70,
      change_summary: '',
    });

    insertCorrectionLog(db, {
      memory_id: memory.id,
      original_category: '流程事',
      corrected_category: '财务',
      extracted_keyword: '报销',
    });

    rejectHabit(db, '报销');

    // 验证 correction_logs 中该关键词已被清空
    const rows = db
      .prepare('SELECT * FROM correction_logs WHERE extracted_keyword = ?')
      .all('报销');
    expect(rows.length).toBe(0);
  });
});
