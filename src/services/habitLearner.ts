import Database from 'better-sqlite3';
import { getConfig, setConfig } from '../db/repository';

export interface HabitDiscovery {
  keyword: string;
  fromCategory: string;
  toCategory: string;
  correctionCount: number;
  consistencyRate: number; // 0-1
}

export interface HabitAnalysis {
  discoveries: HabitDiscovery[];
  suggestions: string[]; // 面向用户的确认请求文案
}

/**
 * 标签习惯学习——分析 correction_logs 中高频修正模式
 *
 * 触发条件（两个都要满足）：
 *   - 近 7 天同一关键词被修正 ≥ 3 次
 *   - 60% 以上修正方向一致（都从 A 类改到 B 类）
 */
export function analyzeHabits(db: Database.Database): HabitAnalysis {
  const rows = db
    .prepare(
      `SELECT
         extracted_keyword,
         original_category,
         corrected_category,
         COUNT(*) as cnt
       FROM correction_logs
       WHERE created_at > datetime('now', '-7 days')
         AND extracted_keyword IS NOT NULL
         AND extracted_keyword != ''
       GROUP BY extracted_keyword, original_category, corrected_category
       ORDER BY cnt DESC`
    )
    .all() as {
    extracted_keyword: string;
    original_category: string;
    corrected_category: string;
    cnt: number;
  }[];

  // 按关键词聚合
  const byKeyword = new Map<string, { from: string; to: string; cnt: number }[]>();
  for (const row of rows) {
    const entries = byKeyword.get(row.extracted_keyword) || [];
    entries.push({ from: row.original_category, to: row.corrected_category, cnt: row.cnt });
    byKeyword.set(row.extracted_keyword, entries);
  }

  const discoveries: HabitDiscovery[] = [];
  const suggestions: string[] = [];

  for (const [keyword, entries] of byKeyword) {
    const total = entries.reduce((sum, e) => sum + e.cnt, 0);
    if (total < 3) continue; // 修正次数不足 3 次

    // 找最常见的修正方向
    const top = entries.reduce((best, e) => (e.cnt > best.cnt ? e : best), entries[0]);
    const consistencyRate = top.cnt / total;

    if (consistencyRate >= 0.6) {
      const discovery: HabitDiscovery = {
        keyword,
        fromCategory: top.from,
        toCategory: top.to,
        correctionCount: total,
        consistencyRate: Math.round(consistencyRate * 100) / 100,
      };
      discoveries.push(discovery);

      suggestions.push(
        `宝，发现你最近${total}次都把"${keyword}"相关的记忆从"${top.from}"挪到了"${top.to}"，下次再遇到这类内容，我直接帮你打"${top.to}"标签，好吗？`
      );
    }
  }

  return { discoveries, suggestions };
}

/**
 * 用户同意标签习惯后，将映射规则存入 system_config
 */
export function approveHabit(db: Database.Database, keyword: string, category: string): void {
  const existing = getConfig(db, 'keyword_category_mapping');
  const mapping: Record<string, string> = existing ? JSON.parse(existing) : {};
  mapping[keyword] = category;
  setConfig(db, 'keyword_category_mapping', JSON.stringify(mapping));
}

/**
 * 用户拒绝标签习惯后，清除该关键词的学习计数
 * 通过在 correction_logs 中为这些记录标记 extracted_keyword 为 NULL 实现（软清理）
 */
export function rejectHabit(db: Database.Database, keyword: string): void {
  db.prepare(
    `UPDATE correction_logs SET extracted_keyword = NULL WHERE extracted_keyword = ?`
  ).run(keyword);
}
