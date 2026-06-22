/**
 * 数据库 Schema + CRUD — 集成测试
 * 使用 :memory: SQLite 数据库，每次测试独立创建
 */

import Database from 'better-sqlite3';
import { initializeDatabase, verifyTables } from '../src/db/database';
import {
  insertRawCapture,
  getPendingRawCaptures,
  updateRawCaptureStatus,
  getRawCaptureById,
  insertMemory,
  getActiveMemories,
  getMemoriesByCategory,
  iterateMemory,
  insertCorrectionLog,
  moveToRecycleBin,
  getRecycleBinItems,
  insertAttachment,
  getAttachmentsByMemoryId,
  setConfig,
  getConfig,
} from '../src/db/repository';
import { hardFilter } from '../src/filter/hardFilter';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  initializeDatabase(db);
});

afterEach(() => {
  db.close();
});

// ====== Schema 验证 ======

describe('Schema 创建与验证', () => {
  test('8 张表全部成功创建', () => {
    expect(verifyTables(db)).toBe(true);
  });

  test('每张表都能写入和读取', () => {
    // raw_captures
    const capture = insertRawCapture(db, { content: 'test', source: 'clipboard', char_count: 4 });
    expect(capture.id).toBeGreaterThan(0);
    expect(capture.status).toBe('pending');

    // memories
    const memory = insertMemory(db, {
      version_group_id: 'test-uuid',
      title: '测试',
      content: '测试内容',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 80,
      change_summary: '',
    });
    expect(memory.id).toBeGreaterThan(0);

    // correction_logs
    const log = insertCorrectionLog(db, {
      memory_id: memory.id,
      original_category: '流程事',
      corrected_category: '财务',
      extracted_keyword: '报销',
    });
    expect(log.id).toBeGreaterThan(0);

    // recycle_bin
    const recycled = moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: '垃圾文本',
      source_type: 'auto_trash',
      workspace: 'default',
    });
    expect(recycled.id).toBeGreaterThan(0);

    // system_config
    setConfig(db, 'test_key', 'test_value');
    expect(getConfig(db, 'test_key')).toBe('test_value');

    // memory_embeddings
    const buffer = Buffer.from(new Float32Array([0.1, 0.2]).buffer);
    db.prepare(
      'INSERT INTO memory_embeddings (memory_id, embedding, model_version) VALUES (?, ?, ?)'
    ).run(memory.id, buffer, 'bge-small-zh-v1');
    const embRow = db.prepare('SELECT COUNT(*) as cnt FROM memory_embeddings').get() as { cnt: number };
    expect(embRow.cnt).toBe(1);

    // data_export_log
    db.prepare(
      "INSERT INTO data_export_log (export_format, record_count, file_path) VALUES ('json', 10, '/tmp/test.zip')"
    ).run();
    const expRow = db.prepare('SELECT COUNT(*) as cnt FROM data_export_log').get() as { cnt: number };
    expect(expRow.cnt).toBe(1);

    // attachments
    const att = insertAttachment(db, {
      memory_id: memory.id,
      raw_capture_id: null,
      file_name: 'photo.jpg',
      file_path: 'attachments/uuid.jpg',
      mime_type: 'image/jpeg',
      file_size: 1024,
      thumbnail_path: 'attachments/uuid_thumb.jpg',
    });
    expect(att.id).toBeGreaterThan(0);
  });
});

// ====== TC-01: 验证码拦截 ======

describe('TC-01：验证码拦截', () => {
  test('纯数字验证码硬过滤后不进 raw_captures', () => {
    const text = '382910';
    const result = hardFilter(text);

    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule1_pure_digits');

    // 拦截后直接进回收站，不入 raw_captures
    moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: text,
      source_type: 'auto_trash',
      workspace: 'default',
    });

    const recycled = getRecycleBinItems(db);
    expect(recycled.length).toBe(1);
    expect(recycled[0].content_snapshot).toBe(text);
    expect(recycled[0].source_type).toBe('auto_trash');
  });
});

// ====== TC-02: 外卖地址拦截 ======

describe('TC-02：外卖地址拦截', () => {
  test('外卖取餐码被硬过滤拦截', () => {
    const text = '取餐码：A3B2C1 麦当劳';
    const result = hardFilter(text);

    expect(result.verdict).toBe('TRASH');
    expect(result.ruleId).toBe('rule2_delivery');

    moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: text,
      source_type: 'auto_trash',
      workspace: 'default',
    });
    expect(getRecycleBinItems(db).length).toBe(1);
  });
});

// ====== TC-03: 工作内容捕获 ======

describe('TC-03：工作内容捕获', () => {
  test('正常工作内容通过硬规则后进入 raw_captures', () => {
    const text = '下周一10点跟张姐过PPT，记得带市场数据';
    const result = hardFilter(text);

    expect(result.verdict).toBe('PASS');

    const capture = insertRawCapture(db, {
      content: text,
      source: 'clipboard',
      char_count: text.length,
    });

    expect(capture.status).toBe('pending');
    expect(capture.content).toBe(text);

    // raw_captures 中存在该记录
    const pending = getPendingRawCaptures(db);
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe(capture.id);
  });
});

// ====== memories CRUD ======

describe('memories 基础操作', () => {
  test('插入并查询记忆', () => {
    const memory = insertMemory(db, {
      version_group_id: 'group-1',
      title: '张姐-市场部',
      content: '张姐在市场部负责品牌推广',
      category: '人脉圈',
      custom_tags: '内推,贵人',
      workspace: 'default',
      importance: 3,
      ai_score: 85,
      change_summary: '',
    });

    expect(memory.title).toBe('张姐-市场部');
    expect(memory.category).toBe('人脉圈');
    expect(memory.is_active).toBe(1);
    expect(memory.version_number).toBe(1);
  });

  test('按分类筛选记忆', () => {
    insertMemory(db, {
      version_group_id: 'g1',
      title: '记忆A',
      content: '…',
      category: '人脉圈',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 80,
      change_summary: '',
    });
    insertMemory(db, {
      version_group_id: 'g2',
      title: '记忆B',
      content: '…',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 70,
      change_summary: '',
    });

    const contacts = getMemoriesByCategory(db, '人脉圈');
    expect(contacts.length).toBe(1);
    expect(contacts[0].title).toBe('记忆A');
  });

  test('按 workspace 隔离', () => {
    insertMemory(db, {
      version_group_id: 'g1',
      title: '主空间',
      content: '…',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 0,
      change_summary: '',
    });
    insertMemory(db, {
      version_group_id: 'g2',
      title: '副业空间',
      content: '…',
      category: '流程事',
      custom_tags: '',
      workspace: 'side-project',
      importance: 0,
      ai_score: 0,
      change_summary: '',
    });

    expect(getActiveMemories(db, 'default').length).toBe(1);
    expect(getActiveMemories(db, 'side-project').length).toBe(1);
    expect(getActiveMemories(db, 'unknown').length).toBe(0);
  });
});

// ====== TC-07: 版本迭代 ======

describe('TC-07：版本迭代更新', () => {
  test('修改记忆后旧版本存档，新版本生效', () => {
    const original = insertMemory(db, {
      version_group_id: 'group-v',
      title: '张姐-市场部',
      content: '张姐在市场部',
      category: '人脉圈',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 80,
      change_summary: '',
    });

    const { old, new: next } = iterateMemory(
      db,
      original.id,
      { title: '张姐-销售部', content: '张姐在销售部' },
      '部门由市场部改为销售部'
    );

    expect(old.is_active).toBe(0);
    expect(next.is_active).toBe(1);
    expect(next.version_group_id).toBe(original.version_group_id);
    expect(next.version_number).toBe(2);
    expect(next.version_parent_id).toBe(original.id);
    expect(next.title).toBe('张姐-销售部');
    expect(next.change_summary).toBe('部门由市场部改为销售部');
  });
});

// ====== TC-08: 标签学习日志 ======

describe('TC-08：标签学习日志记录', () => {
  test('手动修改分类后写入 correction_logs', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-tc08',
      title: '报销单',
      content: '本月报销额度还剩2000',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 55,
      change_summary: '',
    });

    // 用户将"流程事"改为"财务"
    const log = insertCorrectionLog(db, {
      memory_id: memory.id,
      original_category: '流程事',
      corrected_category: '财务',
      extracted_keyword: '报销',
    });

    expect(log.original_category).toBe('流程事');
    expect(log.corrected_category).toBe('财务');
    expect(log.extracted_keyword).toBe('报销');
    expect(log.memory_id).toBe(memory.id);

    // 验证日志存储
    const rows = db
      .prepare('SELECT * FROM correction_logs WHERE memory_id = ?')
      .all(memory.id) as unknown[];
    expect(rows.length).toBe(1);
  });
});

// ====== TC-09: 回收站恢复 ======

describe('TC-09：回收站恢复', () => {
  test('从回收站恢复数据到 raw_captures', () => {
    // 先丢弃一条数据到回收站
    const recycled = moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: '验证码382910',
      source_type: 'auto_trash',
      workspace: 'default',
    });

    // 从回收站恢复 -> 重新插入 raw_captures
    const restored = insertRawCapture(db, {
      content: recycled.content_snapshot,
      source: 'manual',
      char_count: recycled.content_snapshot.length,
    });

    expect(restored.status).toBe('pending');

    // 删除回收站记录（模拟恢复操作）
    db.prepare('DELETE FROM recycle_bin WHERE id = ?').run(recycled.id);
    expect(getRecycleBinItems(db).length).toBe(0);

    // raw_captures 中存在恢复的记录
    const pending = getPendingRawCaptures(db);
    expect(pending.length).toBe(1);
    expect(pending[0].content).toBe('验证码382910');
  });
});

// ====== attachments ======

describe('attachments 附件操作', () => {
  test('插入附件并关联到记忆', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-att',
      title: '会议记录',
      content: '讨论了Q3规划',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 75,
      change_summary: '',
    });

    const att = insertAttachment(db, {
      memory_id: memory.id,
      raw_capture_id: null,
      file_name: '白板照片.jpg',
      file_path: 'attachments/abc123.jpg',
      mime_type: 'image/jpeg',
      file_size: 204800,
      thumbnail_path: 'attachments/abc123_thumb.jpg',
    });

    expect(att.file_name).toBe('白板照片.jpg');

    const attachments = getAttachmentsByMemoryId(db, memory.id);
    expect(attachments.length).toBe(1);
    expect(attachments[0].file_name).toBe('白板照片.jpg');
  });

  test('附件关联到 raw_capture（待整理阶段）', () => {
    const capture = insertRawCapture(db, {
      content: '拍了张白板',
      source: 'manual',
      char_count: 6,
    });

    const att = insertAttachment(db, {
      memory_id: null,
      raw_capture_id: capture.id,
      file_name: '白板.jpg',
      file_path: 'attachments/def456.jpg',
      mime_type: 'image/jpeg',
      file_size: 100000,
      thumbnail_path: null,
    });

    expect(att.raw_capture_id).toBe(capture.id);
    expect(att.memory_id).toBeNull();
  });
});

// ====== 标签学习统计（correction_logs 聚合查询） ======

describe('correction_logs 统计查询', () => {
  test('按关键词统计修正次数', () => {
    const memory = insertMemory(db, {
      version_group_id: 'g-stats',
      title: '报销',
      content: '报销相关',
      category: '流程事',
      custom_tags: '',
      workspace: 'default',
      importance: 0,
      ai_score: 0,
      change_summary: '',
    });

    // 模拟 3 次修正，方向一致（流程事 → 财务）
    for (let i = 0; i < 3; i++) {
      insertCorrectionLog(db, {
        memory_id: memory.id,
        original_category: '流程事',
        corrected_category: '财务',
        extracted_keyword: '报销',
      });
    }

    const rows = db
      .prepare(
        `SELECT extracted_keyword, COUNT(*) as cnt, corrected_category
         FROM correction_logs
         GROUP BY extracted_keyword, corrected_category
         HAVING cnt >= 3`
      )
      .all() as { extracted_keyword: string; cnt: number; corrected_category: string }[];

    expect(rows.length).toBe(1);
    expect(rows[0].extracted_keyword).toBe('报销');
    expect(rows[0].cnt).toBe(3);
    expect(rows[0].corrected_category).toBe('财务');
  });
});
