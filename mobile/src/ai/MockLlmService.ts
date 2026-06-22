import { ILlmService } from './types';
import { fillPrompt, SCORE_PROMPT, CLASSIFY_PROMPT, TITLE_PROMPT } from './prompts';
import { MemoryCategory } from '../types/models';

/**
 * 关键词匹配规则
 * 用于测试环境的确定性 LLM 模拟
 */
interface ScoreRule {
  keywords: RegExp[];
  score: number;
}

interface CategoryRule {
  keywords: RegExp[];
  category: MemoryCategory;
}

const SCORE_RULES: ScoreRule[] = [
  // 高优先级：特定中分场景（必须在通用高分规则之前）
  {
    keywords: [/报销额度/],
    score: 55,
  },
  // 通用高分：职场工作关键词
  {
    keywords: [/周报|PPT|会议|张姐|市场数据|面试|报销单|季度|规划|项目|需求|方案|上线|发布/],
    score: 85,
  },
  // 低分：日常闲聊
  {
    keywords: [/天气|吃啥|晚上|电影|周末|打游戏|追剧|逛街|旅游攻略|吃什么/],
    score: 15,
  },
];

const CATEGORY_RULES: CategoryRule[] = [
  { keywords: [/张姐|同事|老板|领导|导师|客户|HR|面试官|内推/], category: '人脉圈' },
  // 财务类必须在流程事之前（报销/发票等词可能同时命中的情况）
  { keywords: [/报销额度|发票|预算.*费用|报销单|账单|扣税/], category: '财务' },
  { keywords: [/PPT|周报|会议|项目|排期|流程|审批|上线|预算/], category: '流程事' },
  { keywords: [/术语|缩写|行话|技术栈|名词解释|简称|专业/], category: '术语库' },
  { keywords: [/避坑|踩雷|不要|千万别|教训|翻车|坑/], category: '避坑记' },
  { keywords: [/法规|合规|政策|制度|规定|劳动法|社保|公积金/], category: '法规档' },
  // 兜底财务匹配
  { keywords: [/报销|费用/], category: '财务' },
];

const DEFAULT_CATEGORY: MemoryCategory = '流程事';
const FALLBACK_SCORE = 50;

/**
 * MockLlmService — 基于关键词匹配的确定性 LLM 模拟
 *
 * 规则：
 *   - 匹配 SCORE_RULES 返回固定分数，未匹配返回 50
 *   - 匹配 CATEGORY_RULES 返回对应分类，未匹配返回 "流程事"
 *   - 标题取 content 前 15 个字符（去除标点）
 *   - 不调用任何外部模型，输出完全确定
 */
export class MockLlmService implements ILlmService {
  async scoreWorkplaceRelevance(content: string): Promise<number> {
    // 按优先级匹配（高优先级规则先匹配）
    for (const rule of SCORE_RULES) {
      if (rule.keywords.some((re) => re.test(content))) {
        return rule.score;
      }
    }
    return FALLBACK_SCORE;
  }

  async classifyContent(content: string): Promise<MemoryCategory> {
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((re) => re.test(content))) {
        return rule.category;
      }
    }
    return DEFAULT_CATEGORY;
  }

  async generateTitle(content: string): Promise<string> {
    // 简单策略：取前 15 个字符，过滤掉常见标点（含中英文）和空格
    const clean = content.replace(/[，,。.！!？?：:；;、\s（）【】「」『』—…《》]+/g, '').trim();
    const title = clean.slice(0, 15);
    return title || '未命名记忆';
  }

  /**
   * 获取实际会发送给真实模型的 Prompt（用于调试和日志）
   */
  getScorePrompt(content: string): string {
    return fillPrompt(SCORE_PROMPT, content);
  }

  getClassifyPrompt(content: string): string {
    return fillPrompt(CLASSIFY_PROMPT, content);
  }

  getTitlePrompt(content: string): string {
    return fillPrompt(TITLE_PROMPT, content);
  }
}
