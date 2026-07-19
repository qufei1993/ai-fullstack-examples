# AI 全栈工程师实战示例

《AI Agent 全栈开发实战》的公开代码示例仓库。

## 目录分类

`examples/` 下的一级目录按技术模块划分，不按课程阶段划分。课程阶段决定学习和发布顺序，技术模块用于保持示例路径稳定，两者不是同一维度。

- `ai-coding/`：Prompt Engineering、MCP、Skills 和 Coding Agent 协作等 AI 编程示例
- `core-methods/`：结构化输出、Context Engineering、Harness Engineering 和 Prompt 回归等 LLM 应用开发核心方法

结构化输出属于课程第一阶段的 LLM 工程基础，同时也是 AI 应用开发的核心方法，因此放在 `examples/core-methods/structured-output/`。

## Prompt Engineering

示例目录：`examples/ai-coding/prompt-engineering/`

- `01-temperature.ts`：对比 Temperature 0 和 1 的输出差异
- `02-few-shot.ts`：对比 Zero-shot 和 Few-shot 分类效果

### 运行环境

- Node.js 22
- Anthropic SDK
- 支持 Anthropic API 格式的模型服务

### 本地运行

安装依赖：

```bash
npm install
```

复制 `.env.example` 为 `.env`，再填写自己的 API Key、服务地址和模型名。不要把 `.env` 提交到 Git。

```bash
npm run prompt:temperature
npm run prompt:few-shot
```

也可以直接运行：

```bash
npx tsx --env-file=.env examples/ai-coding/prompt-engineering/01-temperature.ts
npx tsx --env-file=.env examples/ai-coding/prompt-engineering/02-few-shot.ts
```

## 结构化输出与结果校验

示例目录：`examples/core-methods/structured-output/`

- `bailian-output-format.ts`：使用 `output_config.format` 请求结构化输出
- `bailian-streaming-output-format.ts`：流式输出 JSON，并在结束后读取解析对象
- `parse-with-retry.ts`：使用 JSON 提取、Zod 校验和错误反馈重试兜底

这组示例使用阿里云百炼的 Anthropic 兼容接口。复制 `.env.example` 为 `.env`，填写自己的百炼 API Key 后直接运行：

```bash
npx tsx --env-file=.env examples/core-methods/structured-output/bailian-output-format.ts
npx tsx --env-file=.env examples/core-methods/structured-output/bailian-streaming-output-format.ts
npx tsx --env-file=.env examples/core-methods/structured-output/parse-with-retry.ts
```

## 安全说明

- 仓库不包含真实 API Key、账号凭据或本地 `.env`
- 示例不依赖个人电脑的绝对路径
- 提交代码前请确认没有把终端输出、系统用户名或其他隐私信息写入文件
