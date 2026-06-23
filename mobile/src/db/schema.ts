/**
 * 迹录 Mobile — SQL Schema（与共享层保持一致）
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS raw_captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'clipboard',
    char_count INTEGER,
    status TEXT DEFAULT 'pending',
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS data_export_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    export_format TEXT NOT NULL DEFAULT 'json',
    record_count INTEGER,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
