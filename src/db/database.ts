import Database from 'better-sqlite3';
import { SCHEMA_SQL, ALL_TABLE_NAMES } from './schema';

let db: Database.Database | null = null;

/**
 * 获取数据库实例（单例）
 * @param dbPath 数据库文件路径。传 ':memory:' 用于测试
 */
export function getDatabase(dbPath: string = ':memory:'): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * 初始化数据库：执行建表 SQL
 */
export function initializeDatabase(database?: Database.Database): Database.Database {
  const target = database ?? getDatabase();
  target.exec(SCHEMA_SQL);
  return target;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 验证所有表已创建
 */
export function verifyTables(database?: Database.Database): boolean {
  const target = database ?? getDatabase();
  const existing = target
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];
  const existingNames = new Set(existing.map((r) => r.name));

  return ALL_TABLE_NAMES.every((name) => existingNames.has(name));
}
