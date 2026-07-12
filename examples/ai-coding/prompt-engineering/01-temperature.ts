/**
 * Prompt Engineering 示例 01：Temperature 对输出的影响
 *
 * 对应文章"为什么同一个 Prompt 输出会不一样"一节。
 *
 * 用"给产品起一个名字"这类任务：
 *   - 有约束（4 字以内、体现产品特点）
 *   - 但没有唯一答案
 *
 * 同一个 Temperature 连续跑 5 次，看输出是否一致：
 *   - Temperature 0：每次几乎相同
 *   - Temperature 1：每次不一样
 *
 * 注意：deepseek-v4-pro 需传 thinking: disabled 才能让 Temperature 生效。
 *
 * 运行（Node.js 22）：      npx tsx --env-file=.env examples/ai-coding/prompt-engineering/01-temperature.ts
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = process.env.MODEL;
if (!MODEL) {
  throw new Error("缺少 MODEL 环境变量，请检查 .env 配置");
}
const RUNS = 5;

// System 严格约束格式，防止模型自己扩展输出
const SYSTEM = "只输出一个产品名，不超过 4 个汉字，不要标点，不要解释，不要列多个选项。";
const USER = "给一款耳机起名：音质出色，但续航只有 3 小时。";

function getText(content: Anthropic.ContentBlock[]): string {
  return content.find((b) => b.type === "text")?.text?.trim() ?? "";
}

async function generate(temperature: number): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 50,
    temperature,
    system: SYSTEM,
    thinking: { type: "disabled" }, // 关闭思考模式，Temperature 才生效
    messages: [{ role: "user", content: USER }],
  } as any);
  return getText(res.content);
}

async function runGroup(temperature: number) {
  const results: string[] = [];
  for (let i = 0; i < RUNS; i++) {
    results.push(await generate(temperature));
  }
  const unique = new Set(results).size;
  console.log(`\nTemperature ${temperature}（跑 ${RUNS} 次）：`);
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  console.log(`  → 共 ${unique} 种不同结果`);
}

async function run() {
  console.log(`模型：${MODEL}（关闭思考模式）`);
  console.log(`System：${SYSTEM}`);
  console.log(`任务：${USER}`);

  await runGroup(0);
  await runGroup(1);

  console.log("\n文章结论：分类、提取等有标准答案的任务用 Temperature 0，");
  console.log("创意写作、头脑风暴等开放任务可以调高到 0.7~1.0。");
}

run();
