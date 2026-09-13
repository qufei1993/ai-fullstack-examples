// 演示文本清洗前后的对比效果

const dirtyText = `人工智能的发展历程

可以追溯到 1950 年代。



图灵在 1950 年发表了著名论文《计算机器与智能》，
提出了“图灵测试”这一概念。
这篇论文奠定了人工智能研究的
理论基础。


1956 年，达特茅斯会议正式提出“人工智能”这一术语。
参会者包括麦卡锡、明斯基等先驱学者。   `;

function cleanText(raw: string): string {
  return (
    raw
      .replace(/\r\n/g, "\n")
      .replace(/([^\n。？！；\.\?!])\n([^\n])/g, "$1$2")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/^[ \t]+/gm, "")
      .trim()
  );
}

console.log("=== 清洗前 ===");
console.log(dirtyText);

const cleaned = cleanText(dirtyText);

console.log("\n=== 清洗后 ===");
console.log(cleaned);

console.log(`\n字符数：${dirtyText.length} → ${cleaned.length}`);
