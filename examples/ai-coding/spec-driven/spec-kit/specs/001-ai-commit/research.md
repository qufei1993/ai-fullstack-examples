# Research: AI-Commit CLI

**Date**: 2026-05-03

## 1. AI API 调用

**Decision**: 使用 Node.js 内置 `fetch` 直接调用 DeepSeek API（`deepseek-v4-flash` 模型）

**Rationale**:
- DeepSeek API 与 OpenAI Chat Completions 接口兼容，REST 调用简单
- `deepseek-v4-flash` 是 DeepSeek-V4 系列快速模型，速度快、成本低，适合 commit message 生成
- 使用 Node.js 22 内置的 `fetch` API，零额外依赖
- 支持通过配置切换 `baseURL` 和其他兼容模型

**Alternatives considered**:
- `openai` SDK：可设置 `baseURL` 指向 DeepSeek，但增加额外依赖
- `@anthropic-ai/sdk`：仅适用于 Anthropic API，不适合 DeepSeek

**Implementation notes**:
- 使用 `DEEPSEEK_API_KEY` 环境变量，或从配置文件读取
- API endpoint: `POST https://api.deepseek.com/v1/chat/completions`
- 认证方式: `Authorization: Bearer <api_key>`
- 支持通过配置切换 `baseURL` 和 `model`
- 超时时间 30 秒，重试 1 次

## 2. CLI 框架

**Decision**: 不使用第三方 CLI 框架，使用 Node.js 内置 `process.argv` 解析

**Rationale**:
- 工具只有一个无参数入口命令 `ai-commit`，无需复杂参数解析
- 避免为简单需求引入 `commander`/`yargs` 等依赖，减少安装体积
- 后续如需添加参数（如 `--dry-run`），手动解析扩展即可

**Alternatives considered**:
- commander：功能完善但为单命令工具引入过于厚重
- yargs：同上
- citty：轻量但仍有额外依赖

## 3. 终端交互

**Decision**: 使用 Node.js 内置 `readline` 模块实现确认/编辑/取消交互

**Rationale**:
- readline 是 Node.js 内置模块，无需额外依赖
- 可轻松实现 "按 Y 确认 / 按 N 取消 / 按 E 编辑" 的交互模式
- 编辑模式下，展示当前消息，让用户输入新内容（单行输入）

**Alternatives considered**:
- inquirer：交互丰富但依赖较重，对简单三选一场景过度
- prompts：轻量但仍需额外依赖

## 4. Git 操作

**Decision**: 使用 `child_process.execSync` 调用本地 git 命令

**Rationale**:
- 所有主流的 git 操作（diff, commit）都有稳定可靠的 CLI
- 避免引入 `simple-git` 等第三方库，保持依赖最小化
- git CLI 保证在 macOS/Linux/WSL 上表现一致

**Commands used**:
- `git diff --cached` — 获取暂存区 diff
- `git diff --cached --name-only` — 获取暂存文件列表
- `git diff --cached --binary -- <file>` — 检测二进制文件
- `git commit -m "<message>"` — 执行提交

## 5. Token 限制处理

**Decision**: 截断策略 — 超过 10000 行的 diff 截断至前 10000 行，并在 prompt 中提示

**Rationale**:
- deepseek-v4-flash 的 context window 足够大（128K tokens），但根据 spec 假设控制输入规模
- 截断时保留文件路径列表，确保 AI 了解变更范围
- 提示用户分批提交更好，但 v1 先做截断

**Implementation**:
- 超过阈值时，在 diff 末尾添加 `[... truncated, showing first 10000 lines]` 标记
- 完整文件列表仍会发送给 AI

## 6. Conventional Commits 格式

**Decision**: 严格遵循 Conventional Commits v1.0.0 规范

**Format**: `<type>[optional scope]: <description>`

**Supported types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rationale**:
- 业界标准，被大多数项目接受
- AI prompt 中明确列举所有类型，确保生成格式正确

## 7. 配置管理

**Decision**: 使用 JSON 配置文件 + 环境变量，支持按优先级读取

**Priority**: 环境变量 > 配置文件

**Config location**: `~/.ai-commit/config.json`

**Config schema**:
```json
{
  "apiKey": "replace_with_your_api_key",
  "baseURL": "https://api.deepseek.com",
  "model": "deepseek-v4-flash"
}
```

**Environment variables**:
- `DEEPSEEK_API_KEY` — API 密钥（最高优先级）
- `DEEPSEEK_BASE_URL` — API endpoint
- `MODEL`：模型名称
