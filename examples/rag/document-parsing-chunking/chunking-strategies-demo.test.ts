import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("递归切片不会丢失句子分隔符", () => {
  const result = spawnSync(
    "npx",
    ["tsx", "examples/rag/document-parsing-chunking/chunking-strategies-demo.ts"],
    { cwd: process.cwd(), encoding: "utf-8" }
  );

  assert.equal(result.status, 0, result.stderr);
  const recursiveOutput = result.stdout
    .split("【Recursive 切片】")[1]
    ?.split("【对比汇总】")[0];

  assert.ok(recursiveOutput, "缺少 Recursive 切片输出");
  assert.match(recursiveOutput, /训练的。Transformer/);
});
