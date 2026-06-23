# 迹录 - 实施计划 v2

## 产品定位
「有记忆的私人职场 Agent」——两个输入、两个输出

```
Input:  剪贴板捕获 / 聊天对话
           ↓
        Agent（过滤 → 打分 → 分类 → RAG）
           ↓
Output: 记忆库（浏览编辑） / 智能生成（简历·指南）
```

## 核心功能（必须）
1. 聊天式录入：用户跟 Agent 对话，Agent 自动提取记忆入库
2. 剪贴板捕获：悬浮球感知复制，自动过滤入库
3. 智能生成：基于个人记忆库，生成简历/职场指南等

## 次要功能（可后挂，Phase 5 一起做）
- 引导页三步流程
- 暗黑模式
- 多工作空间
- 标签习惯学习（correction_logs）
- 夜间自动整理
- 数据导出（JSON/Markdown + 附件 ZIP）
- 附件（拍照/选图/PDF）
- 版本链历史查看
- 通知推送

## 阶段拆解

### Phase 1 ✅ — 数据层 + 硬规则过滤器
- 8 张表的 SQL DDL + TypeScript 类型
- `hard_filter()` 6 条规则
- 基础 CRUD（Node.js + better-sqlite3）
- 32 个单测通过

### Phase 2 ✅ — AI 引擎 + 入库流水线
- `ILlmService` 接口 + `MockLlmService`
- `processCapture()` 流水线（硬规则 → AI 打分 → 分流）
- 标签习惯学习（analyzeHabits / approveHabit / rejectHabit）
- 61 个单测通过

### Phase 3 🔄 — 移动端骨架 + 聊天窗口（当前）
移动端已做：
- Expo 开发构建（Android Studio，不是 Expo Go）
- 4 个底部 Tab + 页面（待整理 / 记忆库 / 回收站 / 设置）
- 手动新增/编辑/删除记忆
- SafeAreaView 防重叠 + Ionicons 图标

待做：
- **新增「聊天」Tab 作为主界面**
- 聊天 UI（对话气泡 + 输入框）
- Mock 对话回复（关键词匹配）
- 聊天中提取记忆（输入格式："记一下：xxx"）

### Phase 4 — 悬浮球 + 剪贴板监听
- 悬浮球组件（磨砂玻璃、羽毛笔图标、震动+呼吸灯）
- 剪贴板监听（前台 + 后台）
- 权限授权流程
- 聊天→记忆自动提取

### Phase 5 — 真实模型 + 智能生成 + 收尾
- Mock 替换为 llama.cpp（Qwen2.5-1.5B GGUF）
- 模型下载与加载
- RAG 管线（memory_embeddings → 检索 → 生成）
- 简历生成 / 职场指南生成
- 夜间后台整理
- 回收站 7 天自动清理
- 数据导出
- 次要功能清单全部挂载
