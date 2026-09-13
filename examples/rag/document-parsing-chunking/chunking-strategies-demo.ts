// 对比 fixed-size 和 recursive 两种切片策略的效果

const sampleText = `大型语言模型（LLM）的出现改变了自然语言处理领域。它们能够理解和生成连贯的文本，完成翻译、摘要、问答等复杂任务。

与传统的 NLP 模型不同，LLM 是基于 Transformer 架构训练的。Transformer 引入了注意力机制，让模型能够在处理一个词时，同时关注句子里其他所有词的上下文关系。这是 LLM 能够理解长距离依赖的根本原因。

2017 年，谷歌在论文《Attention Is All You Need》中正式提出 Transformer 架构。此后，GPT 系列、BERT、T5 等模型相继问世，推动了整个行业的跨越式发展。

RAG（检索增强生成）是将 LLM 与外部知识库结合的一种技术路线。它的核心思路是：不把所有知识压缩进模型参数，而是在推理时动态检索相关信息，作为上下文提供给模型。这样既能保持模型的推理能力，又能让模型回答训练数据之外的问题。`;

// ---- Fixed-size 切片 ----

function fixedSizeChunk(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.trim());
}

// ---- Recursive 切片 ----

const SEPARATORS = ["\n\n", "。", "？", "！", "；", "\n", "，", ""];

function splitRecursive(
  text: string,
  chunkSize: number,
  separators: string[] = SEPARATORS
): string[] {
  if (text.length <= chunkSize) return text.trim() ? [text.trim()] : [];

  const [sep, ...rest] = separators;
  if (sep === "") {
    const chunks: string[] = [];
    let s = 0;
    while (s < text.length) {
      chunks.push(text.slice(s, s + chunkSize));
      s += chunkSize;
    }
    return chunks;
  }

  const splitParts = text.split(sep);
  const parts = splitParts
    .map((part, index) => (index < splitParts.length - 1 ? part + sep : part))
    .filter((part) => part.trim());
  if (parts.length === 1) return splitRecursive(text, chunkSize, rest);

  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    const candidate = current ? current + part : part;
    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current) chunks.push(...splitRecursive(current, chunkSize, rest));
      if (part.length > chunkSize) {
        chunks.push(...splitRecursive(part, chunkSize, rest));
        current = "";
      } else {
        current = part;
      }
    }
  }
  if (current) chunks.push(...splitRecursive(current, chunkSize, rest));
  return chunks;
}

function addOverlap(chunks: string[], overlap: number): string[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks;
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    return chunks[i - 1].slice(-overlap) + chunk;
  });
}

// ---- 打印对比 ----

const CHUNK_SIZE = 80; // 用小值方便演示效果
const OVERLAP = 12;

console.log(`示例文本：${sampleText.length} 字符\n`);
console.log(`chunk_size=${CHUNK_SIZE}，overlap=${OVERLAP}\n`);

console.log("━".repeat(60));
console.log("【Fixed-size 切片】");
console.log("━".repeat(60));
const fixedChunks = fixedSizeChunk(sampleText, CHUNK_SIZE, OVERLAP);
fixedChunks.forEach((chunk, i) => {
  console.log(`\n[chunk ${i + 1}] (${chunk.length} 字符)`);
  console.log(chunk);
});

console.log("\n" + "━".repeat(60));
console.log("【Recursive 切片】");
console.log("━".repeat(60));
const recursiveChunks = addOverlap(
  splitRecursive(sampleText, CHUNK_SIZE - OVERLAP),
  OVERLAP
);
recursiveChunks.forEach((chunk, i) => {
  console.log(`\n[chunk ${i + 1}] (${chunk.length} 字符)`);
  console.log(chunk);
});

console.log("\n" + "━".repeat(60));
console.log("【对比汇总】");
console.log("━".repeat(60));
console.log(`Fixed-size：${fixedChunks.length} 个切片`);
console.log(`Recursive ：${recursiveChunks.length} 个切片`);
