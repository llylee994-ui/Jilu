// ====== 迹录 - TypeScript 类型定义 ======
// 与 01_核心数据字典_Schema.md 严格对应，共 8 张表

// ---- 枚举 ----

export type CaptureStatus = 'pending' | 'processed' | 'trashed';
export type CaptureSource = 'clipboard' | 'manual';

export const MEMORY_CATEGORIES = [
  '人脉圈',
  '流程事',
  '术语库',
  '避坑记',
  '法规档',
  '财务',
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type RecycleSourceType = 'auto_trash' | 'user_delete';
export type ExportFormat = 'json' | 'markdown';

// ---- 表 A：raw_captures ----

export interface RawCapture {
  id: number;
  content: string;
  source: CaptureSource;
  char_count: number;
  status: CaptureStatus;
  captured_at: string; // ISO datetime
}

export type RawCaptureInsert = Pick<RawCapture, 'content' | 'source' | 'char_count'>;

// ---- 表 B：memories ----

export interface Memory {
  id: number;
  version_group_id: string; // UUID
  version_parent_id: number | null;
  version_number: number;
  is_active: 0 | 1;
  title: string;
  content: string;
  category: MemoryCategory;
  custom_tags: string;
  workspace: string;
  importance: number; // 0-5
  ai_score: number | null;
  change_summary: string;
  created_at: string;
  updated_at: string;
}

export type MemoryInsert = Pick<
  Memory,
  | 'version_group_id'
  | 'title'
  | 'content'
  | 'category'
  | 'custom_tags'
  | 'workspace'
  | 'importance'
  | 'ai_score'
  | 'change_summary'
> & { version_parent_id?: number | null; version_number?: number };

// ---- 表 C：correction_logs ----

export interface CorrectionLog {
  id: number;
  memory_id: number;
  original_category: string;
  corrected_category: string;
  extracted_keyword: string;
  created_at: string;
}

export type CorrectionLogInsert = Pick<
  CorrectionLog,
  'memory_id' | 'original_category' | 'corrected_category' | 'extracted_keyword'
>;

// ---- 表 D：recycle_bin ----

export interface RecycleBinItem {
  id: number;
  original_memory_id: number | null;
  content_snapshot: string;
  source_type: RecycleSourceType;
  workspace: string;
  created_at: string;
}

export type RecycleBinInsert = Pick<
  RecycleBinItem,
  'original_memory_id' | 'content_snapshot' | 'source_type' | 'workspace'
>;

// ---- 表 E：system_config ----

export interface SystemConfig {
  key: string;
  value: string;
  updated_at: string;
}

// ---- 表 F：memory_embeddings ----

export interface MemoryEmbedding {
  id: number;
  memory_id: number;
  embedding: Buffer; // float32 array as binary blob
  chunk_index: number;
  model_version: string;
  created_at: string;
}

export type EmbeddingInsert = Pick<
  MemoryEmbedding,
  'memory_id' | 'embedding' | 'chunk_index' | 'model_version'
>;

// ---- 表 G：data_export_log ----

export interface ExportLog {
  id: number;
  export_format: ExportFormat;
  record_count: number;
  file_path: string;
  created_at: string;
}

// ---- 表 H：attachments ----

export interface Attachment {
  id: number;
  memory_id: number | null;
  raw_capture_id: number | null;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  thumbnail_path: string | null;
  created_at: string;
}

export type AttachmentInsert = Pick<
  Attachment,
  'memory_id' | 'raw_capture_id' | 'file_name' | 'file_path' | 'mime_type' | 'file_size' | 'thumbnail_path'
>;

// ---- 硬规则过滤器返回类型 ----

export interface FilterResult {
  verdict: 'TRASH' | 'PASS';
  ruleId: string | null; // 命中规则ID，PASS 时为 null
}
