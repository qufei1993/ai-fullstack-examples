import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

// ---- 类型定义 ----

interface ChunkMetadata {
  source: string;
  section?: string;
  chunkIndex: number;
  totalChunks?: number;
}

interface DocumentChunk {
  text: string;
  metadata: ChunkMetadata;
}

// ---- 文本清洗 ----

function cleanText(raw: string): string {
  return (
    raw
      // CJK 兼容字符（PDF 字体编码 artifact）转为标准汉字
      .normalize("NFKC")
      .replace(/\r\n/g, "\n")
      // 去除页码 artifact，如 "-- 1 of 3 --"
      .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
      // 合并段落内软换行：\n 前后都是非句末标点的字符，认为是软换行
      .replace(/([^\n。？！；\.\?!])\n([^\n])/g, "$1$2")
      // 压缩连续空行为最多一个空行
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/^[ \t]+/gm, "")
      .trim()
  );
}

// ---- Recursive 切片器（支持中文标点） ----

const CHINESE_SEPARATORS = [
  "\n\n",
  "。",
  "？",
  "！",
  "；",
  "\n",
  "，",
  "",
];

function splitRecursive(
  text: string,
  chunkSize: number,
  separators: string[] = CHINESE_SEPARATORS
): string[] {
  if (text.length <= chunkSize) {
    return text.trim() ? [text.trim()] : [];
  }

  const [sep, ...remainingSeps] = separators;

  if (sep === "") {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + chunkSize));
      start += chunkSize;
    }
    return chunks;
  }

  const splitParts = text.split(sep);
  const parts = splitParts
    .map((part, index) => (index < splitParts.length - 1 ? part + sep : part))
    .filter((part) => part.trim());

  if (parts.length === 1) {
    return splitRecursive(text, chunkSize, remainingSeps);
  }

  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? current + part : part;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(...splitRecursive(current, chunkSize, remainingSeps));
      }
      if (part.length > chunkSize) {
        chunks.push(...splitRecursive(part, chunkSize, remainingSeps));
        current = "";
      } else {
        current = part;
      }
    }
  }

  if (current) {
    chunks.push(...splitRecursive(current, chunkSize, remainingSeps));
  }

  return chunks;
}

function addOverlap(chunks: string[], overlap: number): string[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks;
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    return chunks[i - 1].slice(-overlap) + chunk;
  });
}

// ---- 主流程 ----

async function parsePDF(filePath: string): Promise<string> {
  const parser = new PDFParse({ url: filePath });
  const data = await parser.getText();
  return data.text;
}

async function processDocument(filePath: string): Promise<DocumentChunk[]> {
  const fileName = path.basename(filePath);
  console.log(`\n处理文件：${fileName}`);

  const rawText = await parsePDF(filePath);
  console.log(`原始文本长度：${rawText.length} 字符`);

  const cleanedText = cleanText(rawText);
  console.log(`清洗后文本长度：${cleanedText.length} 字符`);

  const CHUNK_SIZE = 512;
  const OVERLAP = Math.floor(CHUNK_SIZE * 0.15); // 约 77 字符，15% overlap

  // 先为 overlap 预留空间，保证追加上下文后仍不超过 CHUNK_SIZE
  const splitChunks = splitRecursive(cleanedText, CHUNK_SIZE - OVERLAP);
  const rawChunks = addOverlap(splitChunks, OVERLAP);

  const chunks: DocumentChunk[] = rawChunks.map((text, index) => ({
    text,
    metadata: {
      source: fileName,
      chunkIndex: index,
      totalChunks: rawChunks.length,
    },
  }));

  console.log(`切片数量：${chunks.length}，chunk_size=${CHUNK_SIZE}，overlap=${OVERLAP}`);
  return chunks;
}

function printChunks(chunks: DocumentChunk[]) {
  console.log("\n=== 切片结果预览（前 3 个） ===\n");
  const preview = chunks.slice(0, 3);
  for (const chunk of preview) {
    console.log(`[chunk ${chunk.metadata.chunkIndex + 1}/${chunk.metadata.totalChunks}]`);
    console.log(`来源：${chunk.metadata.source}`);
    console.log(`文本（${chunk.text.length} 字符）：`);
    console.log(chunk.text.slice(0, 200) + (chunk.text.length > 200 ? "…" : ""));
    console.log();
  }
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error(
      "用法：npx tsx --env-file=.env examples/rag/document-parsing-chunking/parse-and-chunk.ts <PDF 文件路径>"
    );
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在：${filePath}`);
    process.exit(1);
  }

  const chunks = await processDocument(filePath);
  printChunks(chunks);

  const outPath = filePath.replace(/\.[^.]+$/, "") + "-chunks.json";
  fs.writeFileSync(outPath, JSON.stringify(chunks, null, 2), "utf-8");
  console.log(`\n全部 ${chunks.length} 个切片已写入：${outPath}`);
}

main().catch(console.error);
