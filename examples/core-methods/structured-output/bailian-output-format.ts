// npx tsx --env-file=.env examples/core-methods/structured-output/bailian-output-format.ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

const MODEL = process.env.MODEL ?? "qwen-plus";

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

async function reviewCode(code: string): Promise<ReviewResult> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `请评审以下代码：\n\`\`\`typescript\n${code}\n\`\`\``,
      },
    ],
    system: `你是一个代码评审专家。所有字段内容使用中文。只输出 JSON，不要输出任何其他文字。
格式：{"summary":"...","issues":[{"type":"bug"|"style"|"performance"|"security","line":1,"message":"..."}],"score":0-100}`,
    output_config: {
      format: zodOutputFormat(ReviewResult),
    },
  });

  if (!response.parsed_output) {
    throw new Error("模型没有返回可解析的结构化结果");
  }

  return response.parsed_output;
}

const sampleCode = `
function getUser(id) {
  const user = db.find(id)
  return user.name
}
`;

reviewCode(sampleCode)
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
