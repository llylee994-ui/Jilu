/**
 * 本地 LLM 的 Prompt 模板（写死，禁止修改）
 */

export const SCORE_PROMPT = `请对以下文本进行评分，仅需输出一个0到100的整数，代表其与"职场工作内容"的关联程度。100分代表绝对核心的工作任务/人际关系，0分代表完全私人的日常闲聊。

文本内容：{content}`;

export const CLASSIFY_PROMPT = `请将以下文本归类到以下六类之一。只输出类别名称，不要解释。
类别：人脉圈、流程事、术语库、避坑记、法规档、财务

文本内容：{content}`;

export const TITLE_PROMPT = `请为以下文本生成一个不超过15个字的简短标题，提取核心主题。只输出标题，不要解释。

文本内容：{content}`;

/** 填充 Prompt 中的 {content} 占位符 */
export function fillPrompt(template: string, content: string): string {
  return template.replace('{content}', content);
}
