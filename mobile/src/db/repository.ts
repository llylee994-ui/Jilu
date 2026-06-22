/**
 * 迹录 Mobile — 异步 CRUD Repository
 * expo-sqlite 版本的完整数据库操作
 */
import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import type {
  RawCapture,
  RawCaptureInsert,
  Memory,
  MemoryInsert,
  MemoryCategory,
  CorrectionLog,
  CorrectionLogInsert,
  RecycleBinItem,
  RecycleBinInsert,
  Attachment,
  AttachmentInsert,
} from '../types';

// ====== raw_captures ======

export async function insertRawCapture(
  db: SQLite.SQLiteDatabase,
  data: RawCaptureInsert
): Promise<RawCapture> {
  const result = await db.runAsync(
    'INSERT INTO raw_captures (content, source, char_count) VALUES (?, ?, ?)',
    [data.content, data.source, data.char_count]
  );
  return (await db.getFirstAsync('SELECT * FROM raw_captures WHERE id = ?', [
    result.lastInsertRowId,
  ])) as unknown as RawCapture;
}

export async function getPendingRawCaptures(
  db: SQLite.SQLiteDatabase
): Promise<RawCapture[]> {
  return (await db.getAllAsync(
    "SELECT * FROM raw_captures WHERE status = 'pending' ORDER BY captured_at DESC"
  )) as unknown as RawCapture[];
}

export async function updateRawCaptureStatus(
  db: SQLite.SQLiteDatabase,
  id: number,
  status: string
): Promise<void> {
  await db.runAsync('UPDATE raw_captures SET status = ? WHERE id = ?', [status, id]);
}

// ====== memories ======

export async function insertMemory(
  db: SQLite.SQLiteDatabase,
  data: MemoryInsert
): Promise<Memory> {
  const vgid = data.version_group_id || uuidv4();
  const vn = data.version_number || 1;

  const result = await db.runAsync(
    `INSERT INTO memories
       (version_group_id, version_parent_id, version_number, title, content, category, custom_tags, workspace, importance, ai_score, change_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vgid,
      data.version_parent_id ?? null,
      vn,
      data.title,
      data.content,
      data.category,
      data.custom_tags || '',
      data.workspace || 'default',
      data.importance || 0,
      data.ai_score ?? null,
      data.change_summary || '',
    ]
  );

  return (await db.getFirstAsync('SELECT * FROM memories WHERE id = ?', [
    result.lastInsertRowId,
  ])) as unknown as Memory;
}

export async function getMemoryById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Memory | null> {
  return (await db.getFirstAsync('SELECT * FROM memories WHERE id = ?', [
    id,
  ])) as unknown as Memory | null;
}

export async function getActiveMemories(
  db: SQLite.SQLiteDatabase,
  workspace: string = 'default'
): Promise<Memory[]> {
  return (await db.getAllAsync(
    'SELECT * FROM memories WHERE workspace = ? AND is_active = 1 ORDER BY updated_at DESC',
    [workspace]
  )) as unknown as Memory[];
}

export async function getMemoriesByCategory(
  db: SQLite.SQLiteDatabase,
  category: MemoryCategory,
  workspace: string = 'default'
): Promise<Memory[]> {
  return (await db.getAllAsync(
    'SELECT * FROM memories WHERE workspace = ? AND is_active = 1 AND category = ? ORDER BY updated_at DESC',
    [workspace, category]
  )) as unknown as Memory[];
}

// ====== recycle_bin ======

export async function moveToRecycleBin(
  db: SQLite.SQLiteDatabase,
  data: RecycleBinInsert
): Promise<RecycleBinItem> {
  const result = await db.runAsync(
    'INSERT INTO recycle_bin (original_memory_id, content_snapshot, source_type, workspace) VALUES (?, ?, ?, ?)',
    [data.original_memory_id ?? null, data.content_snapshot, data.source_type, data.workspace]
  );
  return (await db.getFirstAsync('SELECT * FROM recycle_bin WHERE id = ?', [
    result.lastInsertRowId,
  ])) as unknown as RecycleBinItem;
}

export async function getRecycleBinItems(
  db: SQLite.SQLiteDatabase,
  workspace: string = 'default'
): Promise<RecycleBinItem[]> {
  return (await db.getAllAsync(
    "SELECT * FROM recycle_bin WHERE workspace = ? AND created_at > datetime('now', '-7 days') ORDER BY created_at DESC",
    [workspace]
  )) as unknown as RecycleBinItem[];
}

export async function restoreFromRecycleBin(
  db: SQLite.SQLiteDatabase,
  recycleId: number
): Promise<RawCapture | null> {
  const item = (await db.getFirstAsync('SELECT * FROM recycle_bin WHERE id = ?', [
    recycleId,
  ])) as unknown as RecycleBinItem | null;
  if (!item) return null;

  const capture = await insertRawCapture(db, {
    content: item.content_snapshot,
    source: 'manual',
    char_count: item.content_snapshot.length,
  });
  await db.runAsync('DELETE FROM recycle_bin WHERE id = ?', [recycleId]);
  return capture;
}

// ====== correction_logs ======

export async function insertCorrectionLog(
  db: SQLite.SQLiteDatabase,
  data: CorrectionLogInsert
): Promise<CorrectionLog> {
  const result = await db.runAsync(
    'INSERT INTO correction_logs (memory_id, original_category, corrected_category, extracted_keyword) VALUES (?, ?, ?, ?)',
    [data.memory_id, data.original_category, data.corrected_category, data.extracted_keyword]
  );
  return (await db.getFirstAsync('SELECT * FROM correction_logs WHERE id = ?', [
    result.lastInsertRowId,
  ])) as unknown as CorrectionLog;
}

// ====== system_config ======

export async function setConfig(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    [key, value]
  );
}

export async function getConfig(
  db: SQLite.SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = (await db.getFirstAsync('SELECT value FROM system_config WHERE key = ?', [
    key,
  ])) as { value: string } | null;
  return row?.value ?? null;
}

// ====== attachments ======

export async function insertAttachment(
  db: SQLite.SQLiteDatabase,
  data: AttachmentInsert
): Promise<Attachment> {
  const result = await db.runAsync(
    'INSERT INTO attachments (memory_id, raw_capture_id, file_name, file_path, mime_type, file_size, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      data.memory_id ?? null,
      data.raw_capture_id ?? null,
      data.file_name,
      data.file_path,
      data.mime_type,
      data.file_size,
      data.thumbnail_path ?? null,
    ]
  );
  return (await db.getFirstAsync('SELECT * FROM attachments WHERE id = ?', [
    result.lastInsertRowId,
  ])) as unknown as Attachment;
}
