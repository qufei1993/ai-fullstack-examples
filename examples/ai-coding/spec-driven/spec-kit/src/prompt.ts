import type { StagedDiff } from './types.js';

function getLanguage(): 'zh' | 'en' {
  const lang = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  return lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const SYSTEM_PROMPTS: Record<'zh' | 'en', string> = {
  zh: `你是一个 Conventional Commits 规范专家。根据 git diff 内容生成一条简洁准确的提交信息。

规则：
1. 严格遵循格式：<type>[可选 scope]: <简短描述>
2. type 必须从以下选择：feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
3. scope 可选，根据变更文件路径推断（如 auth, api, ui 等）
4. 描述部分不超过 72 个字符，使用中文
5. 只返回提交信息本身，不要任何解释或 markdown 格式
6. 不要包含前后引号或代码块标记`,

  en: `You are a Conventional Commits expert. Generate a concise and accurate commit message based on the git diff.

Rules:
1. Strictly follow format: <type>[optional scope]: <short description>
2. type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
3. scope is optional, infer from changed file paths (e.g., auth, api, ui)
4. Description no more than 72 characters, in English
5. Return only the commit message, no explanations or markdown formatting
6. Do not wrap in quotes or code blocks`,
};

export function buildPrompt(diff: StagedDiff): { systemPrompt: string; userMessage: string } {
  const lang = getLanguage();

  let userMessage = `Here is the git diff --cached content:\n\n\`\`\`diff\n${diff.content}\n\`\`\``;

  if (diff.isTruncated) {
    userMessage += `\n\n(Note: diff was truncated from ${diff.lineCount} to 10000 lines)`;
  }

  if (diff.files.length > 0) {
    userMessage += `\n\nChanged files:\n${diff.files.map((f) => `- ${f}`).join('\n')}`;
  }

  return {
    systemPrompt: SYSTEM_PROMPTS[lang],
    userMessage,
  };
}
