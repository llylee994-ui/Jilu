/**
 * 迹录 Mobile — expo-sqlite 数据库适配层
 * 提供与 Node.js 版本相同功能的异步 API
 */
import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * 获取数据库实例（异步，自动初始化 Schema）
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('jilu.db');
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');
    await initializeDatabase();
  }
  return db;
}

/**
 * 初始化数据库：执行建表 SQL
 */
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(SCHEMA_SQL);
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * 获取内存数据库（仅用于测试，单独导出）
 */
export async function openMemoryDatabase(): Promise<SQLite.SQLiteDatabase> {
  const memDb = await SQLite.openDatabaseAsync(':memory:');
  await memDb.execAsync('PRAGMA foreign_keys = ON');
  await memDb.execAsync(SCHEMA_SQL);
  return memDb;
}
