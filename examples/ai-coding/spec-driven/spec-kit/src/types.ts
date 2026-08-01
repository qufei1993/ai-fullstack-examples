export interface StagedDiff {
  files: string[];
  content: string;
  lineCount: number;
  isTruncated: boolean;
}

export interface CommitMessage {
  raw: string;
  type: string;
  scope: string | null;
  description: string;
  language: 'zh' | 'en';
}

export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface ErrorInfo {
  code: 'NO_STAGED_CHANGES' | 'API_ERROR' | 'CONFIG_ERROR' | 'GIT_ERROR';
  detail: string;
  suggestion: string;
}

export interface CLIResult {
  status: 'success' | 'cancelled' | 'error';
  message: string;
  commitHash: string | null;
  error: ErrorInfo | null;
}

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function isErrorInfo<T extends object>(
  value: T | ErrorInfo,
): value is ErrorInfo {
  return 'code' in value;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
