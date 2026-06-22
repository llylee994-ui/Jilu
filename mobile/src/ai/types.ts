import { MemoryCategory } from '../types/models';

/**
 * ILlmService — 本地 LLM 服务抽象接口
 * 生产实现：LlmServiceImpl（llama.cpp 集成）
 * 测试实现：MockLlmService（关键词匹配）
 */
export interface ILlmService {
  /** 职场关联度打分，返回 0-100 整数 */
  scoreWorkplaceRelevance(content: string): Promise<number>;

  /** 判断分类，返回六类之一 */
  classifyContent(content: string): Promise<MemoryCategory>;

  /** 生成简短标题（不超过15字） */
  generateTitle(content: string): Promise<string>;
}
