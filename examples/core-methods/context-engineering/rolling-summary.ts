// 滚动摘要：多轮对话的上下文压缩示例
// 运行方式：npx tsx --env-file=.env examples/core-methods/context-engineering/rolling-summary.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

type Message = { role: "user" | "assistant"; content: string };

// 对话状态：压缩后的历史摘要 + 最近几轮的原始消息
interface ChatState {
  summary: string;       // 早期对话的压缩摘要，附在 system prompt 里
  recentMessages: Message[]; // 最近 N 轮的原文，直接作为 messages 传入
}

// 保留最近 3 轮（6 条消息）的原文，超出部分压缩进摘要
const RECENT_TURNS_LIMIT = 3;

// 将一批旧消息压缩成摘要。
// 如果已有摘要，则增量合并（不重新摘要全部历史），避免信息损失叠加。
async function compressMessages(
  messages: Message[],
  existingSummary: string
): Promise<string> {
  const history = messages
    .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`)
    .join("\n\n");

  const prompt = existingSummary
    // 有旧摘要时：把新消息合并进去，而不是从头重新摘要
    ? `当前摘要：\n${existingSummary}\n\n新增对话：\n${history}\n\n请将上面内容合并更新成一段简洁摘要，保留重要信息和决策，去掉冗余细节。只输出摘要内容。`
    : `请将以下对话压缩成一段简洁摘要，保留重要信息和决策，去掉冗余细节。只输出摘要内容。\n\n${history}`;

  const response = await client.messages.create({
    model: process.env.MODEL!,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  // DeepSeek 思考模型返回的第一个 block 是 thinking 类型，需要找 text 类型
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

async function chat(
  state: ChatState,
  userInput: string,
  system: string
): Promise<{ reply: string; newState: ChatState }> {
  // 把历史摘要拼入 system prompt，让模型知道早期对话发生了什么
  const summarySection = state.summary
    ? `\n\n[早期对话摘要]\n${state.summary}`
    : "";

  const response = await client.messages.create({
    model: process.env.MODEL!,
    max_tokens: 1024,
    system: system + summarySection,
    // messages 只传最近几轮原文 + 本轮用户输入
    messages: [...state.recentMessages, { role: "user", content: userInput }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const reply = textBlock?.type === "text" ? textBlock.text : "";

  // 把本轮对话追加进去，得到完整的消息列表
  const updated: Message[] = [
    ...state.recentMessages,
    { role: "user", content: userInput },
    { role: "assistant", content: reply },
  ];

  // 每轮对话 = 1 条 user + 1 条 assistant，所以上限是轮数 × 2
  const maxMessages = RECENT_TURNS_LIMIT * 2;

  if (updated.length > maxMessages) {
    // 从头部切出超出部分准备压缩，保留尾部最新的 maxMessages 条
    // 例如 updated 有 8 条（4 轮），maxMessages = 6：
    //   toCompress = updated[0..1]（最旧的 2 条）
    //   toKeep    = updated[2..7]（最新的 6 条）
    const toCompress = updated.slice(0, updated.length - maxMessages);
    const toKeep = updated.slice(updated.length - maxMessages);

    console.log(`  [压缩] 将 ${toCompress.length} 条消息合并进摘要`);
    // 传入现有摘要做增量更新，不是每次从头重新摘要
    const newSummary = await compressMessages(toCompress, state.summary);
    return { reply, newState: { summary: newSummary, recentMessages: toKeep } };
  }

  return { reply, newState: { ...state, recentMessages: updated } };
}

async function main() {
  const system = "你是一个 TypeScript 架构顾问，帮助用户设计后端系统。回答简洁，每次不超过 150 字。";
  let state: ChatState = { summary: "", recentMessages: [] };

  const turns = [
    "我们在做一个实时评论情感分析系统。",
    "每天大约有 10 万条评论，延迟要求 200 ms 以内。",
    "技术栈是 Node.js + PostgreSQL，架构上有什么建议？",
    "批处理和实时处理各有什么取舍？",
    "任务队列用 Redis 还是 RabbitMQ 比较合适？",
    "如何保证任务不丢失？",
    "消费端如何横向扩展？",
    "整体确定了，帮我估算一下大概需要多少服务器资源？",
  ];

  for (let i = 0; i < turns.length; i++) {
    const userInput = turns[i];
    const beforeInfo = state.summary
      ? `摘要 ${state.summary.length} 字 + ${state.recentMessages.length} 条原文`
      : `原文 ${state.recentMessages.length} 条`;

    console.log(`\n--- 第 ${i + 1} 轮 ---`);
    console.log(`用户: ${userInput}`);
    console.log(`上下文（压缩前）: ${beforeInfo}`);

    const result = await chat(state, userInput, system);
    state = result.newState;

    const afterInfo = state.summary
      ? `摘要 ${state.summary.length} 字 + ${state.recentMessages.length} 条原文`
      : `原文 ${state.recentMessages.length} 条`;

    console.log(`助手（仅打印 20 个字符）: ${result.reply.slice(0, 20)}...`);
    console.log(`上下文（压缩后）: ${afterInfo}`);
  }

  const lastReply = [...state.recentMessages].reverse().find((m) => m.role === "assistant");
  console.log("\n--- 最后一轮完整回答 ---");
  console.log(lastReply?.content || "（无）");

  console.log("\n--- 最终摘要内容 ---");
  console.log(state.summary || "（无摘要）");
}

main().catch(console.error);
