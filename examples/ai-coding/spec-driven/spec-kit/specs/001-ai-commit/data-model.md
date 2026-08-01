# Data Model: AI-Commit CLI

**Date**: 2026-05-03

## Entities

### 1. StagedDiff

Git 暂存区的变更内容，AI 生成 commit message 的输入源。

| Field | Type | Description |
|-------|------|-------------|
| `files` | `string[]` | 暂存区文件路径列表（排除二进制文件） |
| `content` | `string` | `git diff --cached` 的完整输出文本 |
| `lineCount` | `number` | diff 总行数 |
| `isTruncated` | `boolean` | 是否因行数超限被截断 |

**Validation**: `files` 非空时 `content` 必非空。`isTruncated` 为 true 时 `content` 末尾包含截断标记。

### 2. CommitMessage

AI 生成或用户编辑后的提交信息。

| Field | Type | Description |
|-------|------|-------------|
| `raw` | `string` | 完整的 commit message 文本（含 description 和 body） |
| `type` | `string` | Conventional Commits 类型（feat/fix/chore 等） |
| `scope` | `string \| null` | 可选的影响范围 |
| `description` | `string` | 变更简述 |
| `language` | `'zh' \| 'en'` | 消息语言 |

**Validation**: `type` 必须在 Conventional Commits 允许的类型列表中。`description` 非空且 ≤ 72 字符。

### 3. AIConfig

AI 服务的连接配置。

| Field | Type | Description |
|-------|------|-------------|
| `apiKey` | `string` | DeepSeek API 密钥 |
| `baseURL` | `string` | API endpoint URL |
| `model` | `string` | 模型标识符 |

**Config Priority**: 环境变量 > `~/.ai-commit/config.json`

**Validation**: `apiKey` 非空，`baseURL` 为有效 URL，`model` 非空。

### 4. CLIResult

CLI 命令执行的返回结果。

| Field | Type | Description |
|-------|------|-------------|
| `status` | `'success' \| 'cancelled' \| 'error'` | 执行结果状态 |
| `message` | `string` | 面向用户的提示信息 |
| `commitHash` | `string \| null` | 成功提交后的 commit hash |
| `error` | `ErrorInfo \| null` | 失败时的错误详情 |

### 5. ErrorInfo

错误详情。

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 错误代码（NO_STAGED_CHANGES / API_ERROR / CONFIG_ERROR / GIT_ERROR） |
| `detail` | `string` | 面向用户的错误描述 |
| `suggestion` | `string` | 建议的修复操作 |

## State Flow

```
[User runs ai-commit]
       │
       ▼
  ┌─────────────┐
  │ 检查暂存区   │── StagedDiff 为空 ──→ 输出错误提示，退出
  └──────┬──────┘
         │ 有变更
         ▼
  ┌─────────────┐
  │ 读取 AIConfig│── 配置无效 ──→ 输出配置指引，退出
  └──────┬──────┘
         │ 配置有效
         ▼
  ┌─────────────┐
  │ 构建 Prompt  │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ 调用 AI API  │── API 调用失败 ──→ 输出错误+重试建议，退出
  └──────┬──────┘
         │ 成功
         ▼
  ┌────────────┐
  │ 展示消息    │
  │ 用户选择:   │
  │ Y-确认     │──→ git commit ──→ 输出成功信息
  │ E-编辑     │──→ 用户修改消息 ──→ git commit ──→ 输出成功信息
  │ N-取消     │──→ 输出取消信息，退出
  └────────────┘
```
