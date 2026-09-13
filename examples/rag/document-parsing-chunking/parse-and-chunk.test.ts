import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

interface Chunk {
  text: string;
}

test("生成的每个切片都不超过配置的字符上限", () => {
  const fixturePath = path.resolve(
    "examples/rag/document-parsing-chunking/sample-document.pdf"
  );
  const workdir = mkdtempSync(path.join(tmpdir(), "rag-chunk-test-"));
  const pdfPath = path.join(workdir, "sample-document.pdf");
  copyFileSync(fixturePath, pdfPath);

  const result = spawnSync(
    "npx",
    [
      "tsx",
      "examples/rag/document-parsing-chunking/parse-and-chunk.ts",
      pdfPath,
    ],
    { cwd: process.cwd(), encoding: "utf-8" }
  );

  assert.equal(result.status, 0, result.stderr);

  const outputPath = path.join(workdir, "sample-document-chunks.json");
  const chunks = JSON.parse(readFileSync(outputPath, "utf-8")) as Chunk[];
  const longest = Math.max(...chunks.map((chunk) => chunk.text.length));

  assert.ok(longest <= 512, `最长切片为 ${longest} 字符`);
});
