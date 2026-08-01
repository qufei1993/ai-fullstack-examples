import OpenAI from "openai";
import type { Config } from "./config.js";

function buildSystemPrompt(language: string): string {
  const langInstruction =
    language === "zh"
      ? "Write the description and body in Chinese. Keep type and scope in English."
      : "Write the entire message in English.";

  return `You are an expert software engineer. Generate a git commit message following the Conventional Commits specification.

Format:
  <type>(<optional scope>): <description>

  <optional body>

Rules:
- type must be one of: feat, fix, chore, refactor, docs, test, style, perf
- description: short imperative sentence, no period, max 72 chars
- body: only when changes are complex or need explanation; separated by a blank line
- Output ONLY the commit message, no extra explanation or markdown
- ${langInstruction}`;
}

export async function generateCommitMessage(
  diff: string,
  config: Config
): Promise<string> {
  if (!config.apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set. Run 'ai-commit config' or set the environment variable."
    );
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: "https://api.deepseek.com",
    timeout: 30_000,
  });

  let response;
  try {
    response = await client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        { role: "system", content: buildSystemPrompt(config.language) },
        {
          role: "user",
          content: `Generate a commit message for the following git diff:\n\n${diff}`,
        },
      ],
    });
  } catch (err) {
    if (err instanceof OpenAI.APIConnectionTimeoutError) {
      throw new Error("Request timed out. Please try again.");
    }
    if (err instanceof OpenAI.APIError) {
      throw new Error(`API error ${err.status}: ${err.message}`);
    }
    throw err;
  }

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  return text.trim();
}
