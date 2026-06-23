/**
 * MockChatAgent — 聊天 Agent 模拟
 * Phase 3 用关键词匹配，Phase 5 替换为真实 LLM + RAG
 */
import * as SQLite from 'expo-sqlite';
import { insertMemory, getActiveMemories } from '../db/repository';
import { MockLlmService } from '../ai/MockLlmService';
import type { Memory } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  type: 'chat' | 'memory_saved';
  timestamp: number;
}

const llm = new MockLlmService();

/**
 * 处理用户消息，返回 Agent 回复
 * 特殊命令：
 *   "记一下：xxx" / "记住：xxx" → 自动提取记忆入库
 *   "帮我写简历" / "生成简历" → 提示功能在开发中
 */
export async function handleUserMessage(
  db: SQLite.SQLiteDatabase,
  userText: string
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const now = Date.now();

  // ---- 记忆提取命令 ----
  const memoryMatch = userText.match(/^(?:记一下|记住|帮我记|记录)[：:]\s*(.+)/);
  if (memoryMatch) {
    const content = memoryMatch[1].trim();
    if (content) {
      const score = await llm.scoreWorkplaceRelevance(content);
      const category = await llm.classifyContent(content);
      const title = await llm.generateTitle(content);

      await insertMemory(db, {
        version_group_id: '',
        title,
        content,
        category,
        custom_tags: '',
        workspace: 'default',
        importance: 0,
        ai_score: score,
        change_summary: '',
      });

      const catNames: Record<string, string> = {
        '人脉圈': '👤 人脉圈',
        '流程事': '📋 流程事',
        '术语库': '📚 术语库',
        '避坑记': '💣 避坑记',
        '法规档': '⚖️ 法规档',
        '财务': '💰 财务',
      };

      messages.push({
        id: `sys-${now}`,
        role: 'agent',
        text: `已记住 ✨\n\n「${title}」\n分类：${catNames[category] || category}\n关联度：${score} 分\n\n去记忆库可以随时查看和编辑～`,
        type: 'memory_saved',
        timestamp: now,
      });
      return messages;
    }
  }

  // ---- 简历/指南生成 ----
  if (/简历|写简历|生成简历|求职|CV/.test(userText)) {
    const memories = await getActiveMemories(db);
    const count = memories.length;

    messages.push({
      id: `agent-${now}`,
      role: 'agent',
      text: count === 0
        ? '你现在还没有记忆呢。先跟我说说你做过什么吧，比如：\n\n「记一下：去年主导了供应链优化项目，节省了 20% 成本」\n\n攒够了经历我就能帮你写简历了 📝'
        : `目前你记录了 ${count} 条工作记忆。等 Phase 5 接入真实模型后，我就能根据这些经历帮你生成个性化简历了。\n\n现在先多存一些工作内容吧～`,
      type: 'chat',
      timestamp: now,
    });
    return messages;
  }

  // ---- 查询记忆 ----
  if (/有什么|记忆|查一下|帮我找|搜索/.test(userText)) {
    const memories = await getActiveMemories(db);
    if (memories.length === 0) {
      messages.push({
        id: `agent-${now}`,
        role: 'agent',
        text: '还没有记忆呢。跟我说说你的工作吧，比如：「记一下：今天跟张姐讨论了 Q3 预算方案」',
        type: 'chat',
        timestamp: now,
      });
    } else {
      const recent = memories.slice(0, 3);
      const list = recent.map((m) => `· ${m.title || m.content.slice(0, 15)}（${m.category}）`).join('\n');
      messages.push({
        id: `agent-${now}`,
        role: 'agent',
        text: `你最近有 ${memories.length} 条记忆，最近的几条是：\n\n${list}\n\n可以去「记忆库」Tab 查看全部～`,
        type: 'chat',
        timestamp: now,
      });
    }
    return messages;
  }

  // ---- 默认对话 ----
  const greetings = [/你好|hi|hello|嗨|早|晚上好/];
  const isGreeting = greetings.some((re) => re.test(userText));

  if (isGreeting) {
    messages.push({
      id: `agent-${now}`,
      role: 'agent',
      text: '嗨！我是迹录，你的职场记忆助手 📝\n\n你可以：\n· 跟我聊聊工作上的事\n· 用「记一下：xxx」让我帮你存记忆\n· 以后我还能帮你写简历和职场指南\n\n今天有什么想记录的？',
      type: 'chat',
      timestamp: now,
    });
  } else {
    messages.push({
      id: `agent-${now}`,
      role: 'agent',
      text: '收到～ 如果你想让我记住这段内容，可以用「记一下：」开头发给我。\n\n或者继续聊聊，我会帮你整理思路 ✨',
      type: 'chat',
      timestamp: now,
    });
  }

  return messages;
}
