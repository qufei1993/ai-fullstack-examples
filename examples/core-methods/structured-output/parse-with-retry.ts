// npx tsx --env-file=.env examples/core-methods/structured-output/parse-with-retry.ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();
const MODEL = process.env.MODEL ?? "qwen-plus";

const REVIEW_SYSTEM_PROMPT = `你是一个代码评审专家。所有字段内容使用中文。只输出 JSON，不要输出任何其他文字。
格式：{"summary":"...","issues":[{"type":"bug"|"style"|"performance"|"security","line":1,"message":"..."}],"score":0-100}`;

// ---- JSON 提取工具 ----

function extractJson(text: string): string {
  // 先找 ```json ... ``` 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // 再找第一个 { 或 [ 到最后一个 } 或 ] 之间的内容
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();

  return text.trim();
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(extractJson(text));
  } catch {
    return null;
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `字段 "${issue.path.join(".")}"：${issue.message}`)
    .join("\n");
}

// ---- 通用解析函数：支持直接重试和带反馈重试 ----

async function parseOutput<T>(
  messages: Anthropic.MessageParam[],
  schema: z.ZodType<T>,
  options: { maxRetries?: number; withFeedback?: boolean } = {}
): Promise<T> {
  const { maxRetries = 2, withFeedback = true } = options;
  let currentMessages = [...messages];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: REVIEW_SYSTEM_PROMPT,
      messages: currentMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";
    const parsed = schema.safeParse(safeJsonParse(rawText));

    if (parsed.success) {
      if (attempt > 0) console.log(`第 ${attempt + 1} 次尝试成功`);
      return parsed.data;
    }

    console.warn(`第 ${attempt + 1} 次解析失败：\n${formatZodError(parsed.error)}`);

    if (attempt === maxRetries) break;

    // 指数退避：1s, 2s, 4s...
    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (withFeedback) {
      // 把上一轮输出和具体错误发回去，让模型修正
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: rawText },
        {
          role: "user",
          content: `你的输出格式有问题，解析失败。具体错误：\n${formatZodError(parsed.error)}\n\n请修正后重新输出，只输出 JSON，不要加任何说明文字。`,
        },
      ];
    }
  }

  throw new Error(`解析失败，已重试 ${maxRetries} 次`);
}

const ReviewIssue = z.object({
  type: z.enum(["bug", "style", "performance", "security"]),
  line: z.number().int().positive(),
  message: z.string(),
  suggestion: z.string().optional(),
});

const ReviewResult = z.object({
  summary: z.string(),
  issues: z.array(ReviewIssue),
  score: z.number().min(0).max(100),
});

type ReviewResult = z.infer<typeof ReviewResult>;

// ---- 使用示例 ----

async function reviewCode(code: string): Promise<ReviewResult> {
  return parseOutput(
    [
      {
        role: "user",
        content: `请评审以下代码：\n\`\`\`typescript\n${code}\n\`\`\``,
      },
    ],
    ReviewResult,
    { maxRetries: 2, withFeedback: true }
  );
}

const sampleCode = `
function getUser(id) {
  const user = db.find(id)
  return user.name
}
`;

async function main() {
  const result = await reviewCode(sampleCode);

  console.log(result);
}

main().catch(console.error);
