import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { ILlmService } from '../ai/types';
import { hardFilter } from '../filter/hardFilter';
import {
  getPendingRawCaptures,
  updateRawCaptureStatus,
  insertMemory,
  moveToRecycleBin,
} from '../db/repository';
import { RawCapture, Memory, RecycleBinItem } from '../models';

export interface ProcessResult {
  captureId: number;
  verdict: 'trashed' | 'stored' | 'pending';
  reason: string; // 如 "rule1_pure_digits" / "ai_score_85" / "ai_score_55"
  memory?: Memory;
  recycleItem?: RecycleBinItem;
}

export interface NightlySummary {
  total: number;
  trashed: number;
  stored: number;
  pending: number;
  results: ProcessResult[];
}

/**
 * 处理单条待整理记录
 * 执行流程：硬规则过滤 → AI 打分 → 分类落地
 */
export async function processCapture(
  db: Database.Database,
  item: RawCapture,
  llmService: ILlmService,
  workspace: string = 'default'
): Promise<ProcessResult> {
  const text = item.content;

  // 1. 硬规则过滤
  const filterResult = hardFilter(text);
  if (filterResult.verdict === 'TRASH') {
    const recycleItem = moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: text,
      source_type: 'auto_trash',
      workspace,
    });
    updateRawCaptureStatus(db, item.id, 'trashed');

    return {
      captureId: item.id,
      verdict: 'trashed',
      reason: filterResult.ruleId!,
      recycleItem,
    };
  }

  // 2. AI 打分
  const score = await llmService.scoreWorkplaceRelevance(text);

  // 3. 分流
  if (score >= 70) {
    const category = await llmService.classifyContent(text);
    const title = await llmService.generateTitle(text);

    const memory = insertMemory(db, {
      version_group_id: uuidv4(),
      title,
      content: text,
      category,
      custom_tags: '',
      workspace,
      importance: 0,
      ai_score: score,
      change_summary: '',
    });
    updateRawCaptureStatus(db, item.id, 'processed');

    return {
      captureId: item.id,
      verdict: 'stored',
      reason: `ai_score_${score}`,
      memory,
    };
  }

  if (score < 30) {
    const recycleItem = moveToRecycleBin(db, {
      original_memory_id: null,
      content_snapshot: text,
      source_type: 'auto_trash',
      workspace,
    });
    updateRawCaptureStatus(db, item.id, 'trashed');

    return {
      captureId: item.id,
      verdict: 'trashed',
      reason: `ai_score_${score}`,
      recycleItem,
    };
  }

  // 30-70 分：留在待整理箱，status 保持 pending
  return {
    captureId: item.id,
    verdict: 'pending',
    reason: `ai_score_${score}`,
  };
}

/**
 * 夜间自动整理：处理所有 status='pending' 的记录
 */
export async function runNightlyCleanup(
  db: Database.Database,
  llmService: ILlmService,
  workspace: string = 'default'
): Promise<NightlySummary> {
  const pending = getPendingRawCaptures(db);
  const results: ProcessResult[] = [];

  for (const item of pending) {
    const result = await processCapture(db, item, llmService, workspace);
    results.push(result);
  }

  const trashed = results.filter((r) => r.verdict === 'trashed').length;
  const stored = results.filter((r) => r.verdict === 'stored').length;
  const pendingCount = results.filter((r) => r.verdict === 'pending').length;

  return {
    total: pending.length,
    trashed,
    stored,
    pending: pendingCount,
    results,
  };
}
