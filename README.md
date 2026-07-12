# AI 全栈工程师实战示例

《Node.js AI Agent 全栈开发实战》的公开代码示例仓库。

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

## 安全说明

- 仓库不包含真实 API Key、账号凭据或本地 `.env`
- 示例不依赖个人电脑的绝对路径
- 提交代码前请确认没有把终端输出、系统用户名或其他隐私信息写入文件
