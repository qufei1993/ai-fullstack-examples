import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AIConfig, ErrorInfo } from './types.js';

const CONFIG_FILE = join(homedir(), '.ai-commit', 'config.json');

export function loadConfig(): AIConfig | ErrorInfo {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL;
  const model = process.env.MODEL;

  if (apiKey && baseURL && model) {
    return { apiKey, baseURL, model };
  }

  try {
    const fileContent = readFileSync(CONFIG_FILE, 'utf-8');
    const fileConfig = JSON.parse(fileContent) as Partial<AIConfig>;

    return {
      apiKey: apiKey || fileConfig.apiKey || '',
      baseURL: baseURL || fileConfig.baseURL || 'https://api.deepseek.com',
      model: model || fileConfig.model || 'deepseek-v4-flash',
    };
  } catch {
    if (apiKey) {
      return {
        apiKey,
        baseURL: baseURL || 'https://api.deepseek.com',
        model: model || 'deepseek-v4-flash',
      };
    }

    return {
      code: 'CONFIG_ERROR',
      detail: '未配置 DeepSeek API 密钥',
      suggestion:
        '请设置环境变量 DEEPSEEK_API_KEY，或在 ~/.ai-commit/config.json 中配置 apiKey。' +
        '\n获取 API Key: https://platform.deepseek.com/api_keys',
    };
  }
}

export function validateConfig(config: AIConfig): ErrorInfo | null {
  if (!config.apiKey) {
    return {
      code: 'CONFIG_ERROR',
      detail: '未配置 DeepSeek API 密钥',
      suggestion:
        '请设置环境变量 DEEPSEEK_API_KEY，或在 ~/.ai-commit/config.json 中配置 apiKey。' +
        '\n获取 API Key: https://platform.deepseek.com/api_keys',
    };
  }

  try {
    new URL(config.baseURL);
  } catch {
    return {
      code: 'CONFIG_ERROR',
      detail: `无效的 API endpoint: ${config.baseURL}`,
      suggestion: '请检查 DEEPSEEK_BASE_URL 或配置文件中的 baseURL 是否为有效 URL',
    };
  }

  return null;
}
