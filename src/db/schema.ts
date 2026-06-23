/**
 * 迹录 — 数据库 Schema（8 张表 + 索引）
 * 与 01_核心数据字典_Schema.md 一一对应
 */

export const SCHEMA_SQL = `
-- ====== 表 A：raw_captures（待整理箱 - 原始捕获层） ======
CREATE TABLE IF NOT EXISTS raw_captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'clipboard',
    char_count INTEGER,
    status TEXT DEFAULT 'pending',
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ====== 表 B：memories（主记忆库 - 核心资产） ======
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_group_id TEXT NOT NULL,
    version_parent_id INTEGER,
    version_number INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    category TEXT CHECK(category IN ('人脉圈','流程事','术语库','避坑记','法规档','财务')),
    custom_tags TEXT,
    workspace TEXT DEFAULT 'default',
    importance INTEGER DEFAULT 0,
    ai_score INTEGER,
    change_summary TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_parent_id) REFERENCES memories(id)
);
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(workspace, is_active);
CREATE INDEX IF NOT EXISTS idx_memories_group ON memories(version_group_id);

-- ====== 表 C：correction_logs（标签修正日志） ======
CREATE TABLE IF NOT EXISTS correction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id INTEGER NOT NULL,
    original_category TEXT NOT NULL,
    corrected_category TEXT NOT NULL,
    extracted_keyword TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memory_id) REFERENCES memories(id)
);
CREATE INDEX IF NOT EXISTS idx_correction_keyword ON correction_logs(extracted_keyword, created_at);

-- ====== 表 D：recycle_bin（回收站） ======
CREATE TABLE IF NOT EXISTS recycle_bin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_memory_id INTEGER,
    content_snapshot TEXT NOT NULL,
    source_type TEXT DEFAULT 'user_delete',
    workspace TEXT DEFAULT 'default',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_memory_id) REFERENCES memories(id)
);
CREATE INDEX IF NOT EXISTS idx_recycle_created ON recycle_bin(created_at);
CREATE INDEX IF NOT EXISTS idx_recycle_workspace ON recycle_bin(workspace);

-- ====== 表 E：system_config（系统配置） ======
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ====== 表 F：memory_embeddings（向量索引） ======
CREATE TABLE IF NOT EXISTS memory_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id INTEGER NOT NULL,
    embedding BLOB NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    model_version TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_embeddings_memory ON memory_embeddings(memory_id);

-- ====== 表 G：data_export_log（导出记录） ======
CREATE TABLE IF NOT EXISTS data_export_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    export_format TEXT NOT NULL DEFAULT 'json',
    record_count INTEGER,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ====== 表 H：attachments（多媒体附件） ======
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id INTEGER,
    raw_capture_id INTEGER,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER,
    thumbnail_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE SET NULL,
    FOREIGN KEY (raw_capture_id) REFERENCES raw_captures(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_attachments_memory ON attachments(memory_id);
CREATE INDEX IF NOT EXISTS idx_attachments_raw ON attachments(raw_capture_id);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '新对话',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'agent')),
    text TEXT NOT NULL,
    type TEXT DEFAULT 'chat' CHECK(type IN ('chat', 'memory_saved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
`;

export const ALL_TABLE_NAMES = [
  'raw_captures',
  'memories',
  'correction_logs',
  'recycle_bin',
  'system_config',
  'memory_embeddings',
  'data_export_log',
  'attachments',
  'conversations',
  'messages',
] as const;
