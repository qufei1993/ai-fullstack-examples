import type { AIConfig, DeepSeekResponse, ErrorInfo, CommitMessage } from './types.js';

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

export async function generateCommitMessage(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<CommitMessage | ErrorInfo> {
  const body = JSON.stringify({
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 200,
    stream: false,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${config.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status === 401) {
          return {
            code: 'API_ERROR',
            detail: 'API 密钥无效 (401 Unauthorized)',
            suggestion: '请检查 DEEPSEEK_API_KEY 是否正确配置',
          };
        }
        if (response.status === 429) {
          return {
            code: 'API_ERROR',
            detail: 'API 请求频率超限 (429 Too Many Requests)',
            suggestion: '请稍后重试',
          };
        }
        return {
          code: 'API_ERROR',
          detail: `API 返回错误 (${response.status}): ${errorText}`,
          suggestion: '请检查网络连接和 API 配置',
        };
      }

      const data: DeepSeekResponse = await response.json();
      const rawMessage = data.choices?.[0]?.message?.content?.trim();

      if (!rawMessage) {
        return {
          code: 'API_ERROR',
          detail: 'AI 未返回有效的 commit message',
          suggestion: '请重试，或检查暂存区 diff 内容是否可读',
        };
      }

      return parseCommitMessage(rawMessage);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (lastError.name === 'AbortError') {
        return {
          code: 'API_ERROR',
          detail: 'AI API 请求超时',
          suggestion: '请检查网络连接，或稍后重试',
        };
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  return {
    code: 'API_ERROR',
    detail: `AI API 调用失败: ${lastError?.message || 'Unknown error'}`,
    suggestion: '请检查网络连接和 API 配置',
  };
}

const CONVENTIONAL_PATTERN = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?:\s*(.+)$/;

function parseCommitMessage(raw: string): CommitMessage {
  const match = raw.match(CONVENTIONAL_PATTERN);

  if (match) {
    return {
      raw,
      type: match[1],
      scope: match[2]?.replace(/[()]/g, '') || null,
      description: match[3],
      language: /[一-鿿]/.test(match[3]) ? 'zh' : 'en',
    };
  }

  return {
    raw,
    type: 'chore',
    scope: null,
    description: raw,
    language: /[一-鿿]/.test(raw) ? 'zh' : 'en',
  };
}
