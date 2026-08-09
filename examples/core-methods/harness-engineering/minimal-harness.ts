// 教学版 Harness，用来理解工具注册、权限拦截、反馈循环三条核心边界。
// 不是生产级安全沙箱，symlink 逃逸、并发、审计日志等场景不在覆盖范围内。
// 运行方式：npx tsx --env-file=.env examples/core-methods/harness-engineering/minimal-harness.ts
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const client = new Anthropic();

// 所有文件操作限制在工作区根目录内，防止路径逃逸
const WORKSPACE_ROOT = path.resolve(process.cwd());

// read 和 write 都拒绝的敏感路径模式
const SENSITIVE_PATTERNS = [".env", "secrets/", "/etc/", ".ssh"];

// 1. 工具注册：声明 AI 可以使用的工具，未注册的工具 AI 调不到
const tools: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "读取工作区内的文件内容",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "相对于工作区根目录的文件路径",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "write_file",
    description: "向工作区内的文件写入内容",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "相对于工作区根目录的文件路径",
        },
        content: { type: "string", description: "写入内容" },
      },
      required: ["file_path", "content"],
    },
  },
];

// 2. 权限控制：read 和 write 都检查，路径逃逸和敏感文件都拦截
function checkPermission(
  _toolName: string,
  input: Record<string, string>
): { allowed: boolean; reason?: string } {
  const rawPath = input.file_path ?? "";
  const resolvedPath = path.resolve(WORKSPACE_ROOT, rawPath);

  // 禁止路径逃逸出工作区
  if (
    !resolvedPath.startsWith(WORKSPACE_ROOT + path.sep) &&
    resolvedPath !== WORKSPACE_ROOT
  ) {
    return { allowed: false, reason: `路径越界：${rawPath} 超出工作区范围` };
  }

  // 敏感路径：read 和 write 都拒绝
  for (const pattern of SENSITIVE_PATTERNS) {
    if (rawPath.includes(pattern)) {
      return { allowed: false, reason: `禁止访问敏感路径：${rawPath}` };
    }
  }

  return { allowed: true };
}

// 工具执行层：先过权限检查，再实际执行
async function executeTool(
  toolName: string,
  input: Record<string, string>
): Promise<string> {
  const permission = checkPermission(toolName, input);
  if (!permission.allowed) {
    return `[权限拒绝] ${permission.reason}`;
  }

  const resolvedPath = path.resolve(WORKSPACE_ROOT, input.file_path);

  if (toolName === "read_file") {
    try {
      return fs.readFileSync(resolvedPath, "utf-8");
    } catch {
      return `[错误] 无法读取文件：${input.file_path}`;
    }
  }

  if (toolName === "write_file") {
    try {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      fs.writeFileSync(resolvedPath, input.content, "utf-8");
      return `[成功] 已写入：${input.file_path}`;
    } catch {
      return `[错误] 无法写入文件：${input.file_path}`;
    }
  }

  return `[错误] 未知工具：${toolName}`;
}

// 3. Agent 循环，含轮次上限：MAX_TURNS 防止死循环，工具错误以消息形式回传让 AI 自我修正
async function runAgent(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  const MAX_TURNS = 10;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model: process.env.MODEL!,
      max_tokens: 4096,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.type === "text" ? textBlock.text : "(无文本输出)";
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, string>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push(
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults }
      );
    }
  }

  return "[错误] 超过最大轮次限制";
}

const result = await runAgent(
  "请读取 package.json 文件，然后把其中的 name 字段写入 examples/core-methods/harness-engineering/output.txt"
);
console.log(result);
