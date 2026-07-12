/**
 * Prompt Engineering 示例 02：Zero-shot vs Few-shot 分类
 *
 * 对应文章"从 Zero-shot 到 Few-shot：例子的力量"一节。
 * 用文章里相同的评论示例，对比有无 Few-shot 的分类准确性，
 * 重点测试带讽刺语气的边界输入（文章建议在示例里覆盖边界情况）。
 *
 * 运行（Node.js 22）：      npx tsx --env-file=.env examples/ai-coding/prompt-engineering/02-few-shot.ts
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = process.env.MODEL;
if (!MODEL) {
  throw new Error("缺少 MODEL 环境变量，请检查 .env 配置");
}

function getText(content: Anthropic.ContentBlock[]): string {
  return content.find((b) => b.type === "text")?.text?.trim() ?? "";
}

// --- Prompt 定义（直接使用文章里的示例） ---

const ZERO_SHOT_SYSTEM = `将用户评论分类为：正面、中性、负面。只输出分类结果，不要解释。`;

// 文章里的 Few-shot 示例，最后加了一个带讽刺语气的边界例子
const FEW_SHOT_SYSTEM = `将用户评论分类为：正面、中性、负面。只输出分类结果，不要解释。

示例：
评论："音质很好，性价比高。"
分类：正面

示例：
评论："产品一般，没什么特别的。"
分类：中性

示例：
评论："快递太慢了，等了两周才到。"
分类：负面

示例（边界：带讽刺语气）：
评论："包装破损，快递三周才到，真是太周到的服务了。"
分类：负面`;

// --- 测试用例 ---

const REVIEWS = [
  // 文章里的标准例子
  { text: "这款耳机音质不错，但续航太差了。", expected: "中性" },
  // 带讽刺语气的边界情况（文章第 4 条建议：覆盖边界情况）
  { text: "等了两周终于到了，包装也破损了，真是太棒了呢。", expected: "负面" },
  { text: "性价比超高，用了半年坏了，物有所值。", expected: "负面" },
];

async function classify(system: string, review: string): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0,
    system,
    messages: [{ role: "user", content: `评论："${review}"` }],
  });
  return getText(res.content);
}

async function run() {
  console.log(`模型：${MODEL}\n`);
  console.log("=== Zero-shot vs Few-shot 对比 ===\n");

  for (const { text, expected } of REVIEWS) {
    const zeroShot = await classify(ZERO_SHOT_SYSTEM, text);
    const fewShot = await classify(FEW_SHOT_SYSTEM, text);

    const z = zeroShot === expected ? "✓" : "✗";
    const f = fewShot === expected ? "✓" : "✗";

    console.log(`评论：${text}`);
    console.log(`  期望：${expected}`);
    console.log(`  Zero-shot → ${zeroShot} ${z}`);
    console.log(`  Few-shot  → ${fewShot} ${f}`);
    console.log();
  }

  console.log("文章结论：Few-shot 在边界情况下更稳定，讽刺语气是分类任务的典型边界例子。");
}

run();
