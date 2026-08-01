# Implementation Plan: AI-Commit CLI

**Branch**: `001-ai-commit` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-commit/spec.md`

## Summary

开发一个名为 `ai-commit` 的 TypeScript CLI 工具。用户在 git 暂存区添加变更后运行该命令，工具读取 `git diff --cached` 内容，通过 DeepSeek API 生成符合 Conventional Commits 规范的 commit message，在终端展示后由用户确认/编辑/取消，确认后执行 `git commit`。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22
**Primary Dependencies**: `chalk` (终端彩色输出)；AI API 调用使用 Node.js 内置 `fetch` 直接请求 DeepSeek API（无需额外 SDK）
**Storage**: 配置文件 `~/.ai-commit/config.json` 或环境变量存储 API 密钥及 endpoint
**Testing**: vitest
**Target Platform**: macOS, Linux, WSL（跨平台，Node.js 运行时）
**Project Type**: CLI (单包 npm 工具)
**Performance Goals**: 端到端起消息生成时间 < 10 秒
**Constraints**: 安装体积 < 50MB，npm 全局安装
**Scale/Scope**: 单用户本地使用，单次调用

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 文件当前为模板占位状态，无实质性约束条款。无违反项，可通过。

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-commit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts             # CLI 入口，命令定义与参数解析
├── git.ts               # Git 操作封装（获取 diff，执行 commit）
├── ai.ts                # AI API 调用封装
├── config.ts            # 配置文件读取与解析
├── prompt.ts            # System prompt 模板构建
├── ui.ts                # 终端交互（展示消息，确认/编辑/取消流程）
└── types.ts             # TypeScript 类型定义

tests/
├── unit/
│   ├── git.test.ts
│   ├── ai.test.ts
│   ├── config.test.ts
│   └── prompt.test.ts
└── integration/
    └── cli.test.ts
```

**Structure Decision**: 选择单项目结构 (Option 1)。ai-commit 是一个纯 CLI 工具，无前端/后端分离需求，所有代码放在 `src/` 下，按功能模块拆分。

## Complexity Tracking

> 无 Constitution 违规项，无需填写。
