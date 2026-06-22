import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  RawCapture,
  RawCaptureInsert,
  Memory,
  MemoryInsert,
  CorrectionLog,
  CorrectionLogInsert,
  RecycleBinItem,
  RecycleBinInsert,
  MemoryCategory,
  Attachment,
  AttachmentInsert,
} from '../models';

// ====== 通用工具 ======

function run(db: Database.Database, sql: string, params: Record<string, unknown> = {}): void {
  db.prepare(sql).run(params);
}

function get<T>(db: Database.Database, sql: string, params: Record<string, unknown> = {}): T | undefined {
  return db.prepare(sql).get(params) as T | undefined;
}

function all<T>(db: Database.Database, sql: string, params: Record<string, unknown> = {}): T[] {
  return db.prepare(sql).all(params) as T[];
}

// ====== raw_captures ======

export function insertRawCapture(db: Database.Database, data: RawCaptureInsert): RawCapture {
  const result = db.prepare(
    `INSERT INTO raw_captures (content, source, char_count) VALUES (@content, @source, @char_count)`
  ).run({ content: data.content, source: data.source, char_count: data.char_count });

  return getRawCaptureById(db, Number(result.lastInsertRowid))!;
}

export function getRawCaptureById(db: Database.Database, id: number): RawCapture | undefined {
  return get<RawCapture>(db, 'SELECT * FROM raw_captures WHERE id = @id', { id });
}

export function getPendingRawCaptures(db: Database.Database): RawCapture[] {
  return all<RawCapture>(db, "SELECT * FROM raw_captures WHERE status = 'pending' ORDER BY captured_at DESC");
}

export function updateRawCaptureStatus(
  db: Database.Database,
  id: number,
  status: 'pending' | 'processed' | 'trashed'
): void {
  run(db, 'UPDATE raw_captures SET status = @status WHERE id = @id', { status, id });
}

// ====== memories ======

export function insertMemory(db: Database.Database, data: MemoryInsert): Memory {
  const version_group_id = data.version_group_id || uuidv4();
  const version_number = data.version_number || 1;

  const result = db.prepare(`
    INSERT INTO memories (version_group_id, version_parent_id, version_number, title, content, category, custom_tags, workspace, importance, ai_score, change_summary)
    VALUES (@version_group_id, @version_parent_id, @version_number, @title, @content, @category, @custom_tags, @workspace, @importance, @ai_score, @change_summary)
  `).run({
    version_group_id,
    version_parent_id: data.version_parent_id ?? null,
    version_number,
    title: data.title,
    content: data.content,
    category: data.category,
    custom_tags: data.custom_tags || '',
    workspace: data.workspace || 'default',
    importance: data.importance || 0,
    ai_score: data.ai_score ?? null,
    change_summary: data.change_summary || '',
  });

  return getMemoryById(db, Number(result.lastInsertRowid))!;
}

export function getMemoryById(db: Database.Database, id: number): Memory | undefined {
  return get<Memory>(db, 'SELECT * FROM memories WHERE id = @id', { id });
}

export function getActiveMemories(db: Database.Database, workspace: string = 'default'): Memory[] {
  return all<Memory>(
    db,
    'SELECT * FROM memories WHERE workspace = @workspace AND is_active = 1 ORDER BY updated_at DESC',
    { workspace }
  );
}

export function getMemoriesByCategory(
  db: Database.Database,
  category: MemoryCategory,
  workspace: string = 'default'
): Memory[] {
  return all<Memory>(
    db,
    'SELECT * FROM memories WHERE workspace = @workspace AND is_active = 1 AND category = @category ORDER BY updated_at DESC',
    { workspace, category }
  );
}

/**
 * 版本迭代更新：将旧记录标为历史，创建新记录
 * @returns 新旧两条记录
 */
export function iterateMemory(
  db: Database.Database,
  memoryId: number,
  updatedFields: Partial<Pick<Memory, 'title' | 'content' | 'category' | 'custom_tags' | 'importance'>>,
  changeSummary: string
): { old: Memory; new: Memory } {
  const old = getMemoryById(db, memoryId);
  if (!old) throw new Error(`Memory ${memoryId} not found`);

  // 1. 将旧记录标为非活跃
  run(db, 'UPDATE memories SET is_active = 0 WHERE id = @id', { id: memoryId });

  // 重新获取更新后的旧记录（is_active 已变为 0）
  const deactivated = getMemoryById(db, memoryId)!;

  // 2. 创建新版本
  const newMemory = insertMemory(db, {
    version_group_id: old.version_group_id,
    version_parent_id: old.id,
    version_number: old.version_number + 1,
    title: updatedFields.title ?? old.title,
    content: updatedFields.content ?? old.content,
    category: updatedFields.category ?? old.category,
    custom_tags: updatedFields.custom_tags ?? old.custom_tags,
    workspace: old.workspace,
    importance: updatedFields.importance ?? old.importance,
    ai_score: old.ai_score,
    change_summary: changeSummary,
  });

  return { old: deactivated, new: newMemory };
}

// ====== correction_logs ======

export function insertCorrectionLog(db: Database.Database, data: CorrectionLogInsert): CorrectionLog {
  const result = db.prepare(`
    INSERT INTO correction_logs (memory_id, original_category, corrected_category, extracted_keyword)
    VALUES (@memory_id, @original_category, @corrected_category, @extracted_keyword)
  `).run(data);

  return get<CorrectionLog>(db, 'SELECT * FROM correction_logs WHERE id = @id', {
    id: Number(result.lastInsertRowid),
  })!;
}

// ====== recycle_bin ======

export function moveToRecycleBin(db: Database.Database, data: RecycleBinInsert): RecycleBinItem {
  const result = db.prepare(`
    INSERT INTO recycle_bin (original_memory_id, content_snapshot, source_type, workspace)
    VALUES (@original_memory_id, @content_snapshot, @source_type, @workspace)
  `).run(data);

  return get<RecycleBinItem>(db, 'SELECT * FROM recycle_bin WHERE id = @id', {
    id: Number(result.lastInsertRowid),
  })!;
}

export function getRecycleBinItems(db: Database.Database, workspace: string = 'default'): RecycleBinItem[] {
  return all<RecycleBinItem>(
    db,
    "SELECT * FROM recycle_bin WHERE workspace = @workspace AND created_at > datetime('now', '-7 days') ORDER BY created_at DESC",
    { workspace }
  );
}

// ====== attachments ======

export function insertAttachment(db: Database.Database, data: AttachmentInsert): Attachment {
  const result = db.prepare(`
    INSERT INTO attachments (memory_id, raw_capture_id, file_name, file_path, mime_type, file_size, thumbnail_path)
    VALUES (@memory_id, @raw_capture_id, @file_name, @file_path, @mime_type, @file_size, @thumbnail_path)
  `).run({
    memory_id: data.memory_id ?? null,
    raw_capture_id: data.raw_capture_id ?? null,
    file_name: data.file_name,
    file_path: data.file_path,
    mime_type: data.mime_type,
    file_size: data.file_size,
    thumbnail_path: data.thumbnail_path ?? null,
  });

  return get<Attachment>(db, 'SELECT * FROM attachments WHERE id = @id', {
    id: Number(result.lastInsertRowid),
  })!;
}

export function getAttachmentsByMemoryId(db: Database.Database, memoryId: number): Attachment[] {
  return all<Attachment>(db, 'SELECT * FROM attachments WHERE memory_id = @memoryId', { memoryId });
}

// ====== system_config ======

export function setConfig(db: Database.Database, key: string, value: string): void {
  run(db, `INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (@key, @value, CURRENT_TIMESTAMP)`, {
    key,
    value,
  });
}

export function getConfig(db: Database.Database, key: string): string | undefined {
  const row = get<{ value: string }>(db, 'SELECT value FROM system_config WHERE key = @key', { key });
  return row?.value;
}
