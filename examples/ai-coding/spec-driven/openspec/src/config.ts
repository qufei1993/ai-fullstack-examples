import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface Config {
  apiKey: string;
  model: string;
  language: "en" | "zh";
  maxTokens: number;
}

const DEFAULTS: Config = {
  apiKey: "",
  model: "deepseek-chat",
  language: "en",
  maxTokens: 1024,
};

function readConfigFile(): Partial<Config> {
  const configPath = join(homedir(), ".ai-commit.json");
  try {
    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as Partial<Config>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    console.warn("Warning: ~/.ai-commit.json is invalid JSON, using defaults.");
    return {};
  }
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const fileConfig = readConfigFile();

  const envConfig: Partial<Config> = {};
  if (process.env.DEEPSEEK_API_KEY) envConfig.apiKey = process.env.DEEPSEEK_API_KEY;
  if (process.env.MODEL) envConfig.model = process.env.MODEL;
  if (process.env.AI_COMMIT_LANGUAGE) {
    const lang = process.env.AI_COMMIT_LANGUAGE;
    if (lang === "en" || lang === "zh") envConfig.language = lang;
  }

  return { ...DEFAULTS, ...fileConfig, ...envConfig, ...overrides };
}
