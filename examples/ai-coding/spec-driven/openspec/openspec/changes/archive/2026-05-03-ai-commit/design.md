## Context

`ai-commit` 是一个独立的 Node.js CLI 工具，以 npm 全局包发布。用户通过终端运行 `ai-commit`，工具自动读取当前 git 仓库的暂存区 diff，交由 AI 生成 commit message，再由用户交互确认后完成提交。整个流程在本地终端内完成，无需额外服务端。

当前痛点：开发者需要手动思考并编写符合 Conventional Commits 规范的消息，在 diff 复杂时容易遗漏变更要点，且风格不统一。

## Goals / Non-Goals

**Goals:**
- 单命令完成"暂存区 diff → AI 生成 → 确认 → 提交"全流程
- 支持 Conventional Commits 格式（feat/fix/chore 等）
- 交互式确认：用户可接受、编辑、重新生成或取消
- 通过环境变量或 `~/.ai-commit.json` 配置 API Key 和模型
- TypeScript 实现，使用 Node.js 22

**Non-Goals:**
- 不支持多个 AI 提供商（第一版仅支持 DeepSeek）
- 不提供 GUI / VS Code 插件
- 不自动添加文件到暂存区（`git add` 由用户负责）
- 不生成多条候选 message 供选择（第一版）
- 不支持 git hooks 自动触发

## Decisions

### D1: AI SDK 选择 — `openai`（兼容 DeepSeek API）
DeepSeek API 完全兼容 OpenAI 接口规范，直接使用 `openai` npm 包，配置 `baseURL: "https://api.deepseek.com"` 即可接入。无需引入私有 SDK，类型完善，社区熟悉度高。

**备选方案**: 使用原生 `fetch` 直接调 HTTP → 需自行处理类型和错误，维护成本高。

### D2: CLI 框架 — `commander`
轻量、零依赖，TypeScript 支持完善。`ai-commit` 命令行参数简单（`--dry-run`、`--model`），无需复杂路由。

**备选方案**: `yargs` → 功能过剩；原生 `process.argv` → 维护成本高。

### D3: 交互确认 — `@inquirer/prompts`
原生支持 TypeScript，提供 `select`（确认/编辑/重新生成/取消）和 `editor`（打开编辑器修改 message）prompt。

**备选方案**: `inquirer` v8 → ESM/CJS 混用问题多；`readline` → 需要自行实现 UI。

### D4: diff 截断策略
直接将超长 diff 完整发送会消耗大量 token 并可能超出模型上下文。截断规则：
1. 单文件超过 200 行 diff → 只保留前 100 行 + `... (truncated)`
2. 总 diff 超过 4000 行 → 只保留前 3000 行 + 统计摘要
3. 二进制文件 → 仅保留文件名和状态（新增/删除/修改）

### D5: 发布格式 — CommonJS + ESM 双格式
使用 `tsup` 打包，输出 `dist/index.cjs` 和 `dist/index.mjs`，兼容不同模块系统。`package.json` 中设置 `bin.ai-commit` 指向 CJS 入口，确保全局安装后 `ai-commit` 命令可用。

## Risks / Trade-offs

- **API Key 安全** → 用户自行管理，工具不存储 Key，仅从环境变量/配置文件读取；配置文件权限建议 `chmod 600`
- **AI 输出质量不稳定** → 提供"重新生成"选项，允许用户多次尝试；提供精细 system prompt 约束格式
- **大型 monorepo diff 过长** → 通过 D4 截断策略缓解，后续可增加 `--max-lines` 参数
- **网络超时** → 设置 30s 超时，失败时给出清晰错误提示，不中断 git 状态

## Migration Plan

全新工具，无迁移需求。发布步骤：
1. `npm publish --access public` 发布到 npmjs.com
2. 用户通过 `npm install -g ai-commit` 安装
3. 设置 `DEEPSEEK_API_KEY` 环境变量后即可使用

## Open Questions

- 是否需要支持多语言 commit message（中/英）？→ 暂定通过 system prompt 中的语言指令配置
- 是否集成 git hooks（`prepare-commit-msg`）？→ 第一版不做，保持工具独立性
