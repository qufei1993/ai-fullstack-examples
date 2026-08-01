## Why

开发者在提交代码时，手动编写符合规范的 commit message 耗时且容易遗漏变更要点。`ai-commit` 通过读取 git 暂存区 diff，自动调用 AI 生成高质量 commit message，经用户确认后执行提交，提升工作效率并保证提交信息的一致性。

## What Changes

- 新增 `ai-commit` CLI 可执行程序（TypeScript 实现，发布为 npm 包）
- 读取 `git diff --staged` 获取暂存区差异
- 调用 DeepSeek API 分析 diff 并生成 commit message
- 在终端展示生成的 message，让用户确认、编辑或取消
- 确认后自动执行 `git commit -m "<message>"`
- 支持通过配置文件或环境变量设置 API Key 和模型参数

## Capabilities

### New Capabilities
- `diff-reader`: 读取 git 暂存区 diff 并做预处理（截断超长 diff、过滤二进制文件）
- `ai-generator`: 调用 AI API，将 diff 转换为 commit message（支持 Conventional Commits 格式）
- `interactive-confirm`: 在终端展示生成结果，提供确认/编辑/重新生成/取消交互流程
- `git-commit-executor`: 接收确认后的 message，执行 `git commit` 命令
- `config-loader`: 从 `~/.ai-commit.json` 或环境变量加载 API Key、模型、提示词等配置

### Modified Capabilities
<!-- 无现有规格需要修改 -->

## Impact

- **新增依赖**: `openai`（兼容 DeepSeek API）、`commander`（CLI 框架）、`@inquirer/prompts`（交互确认）
- **运行环境**: Node.js 22，需要 git 已安装
- **API 密钥**: 需要用户自行配置 `DEEPSEEK_API_KEY`
- **无破坏性变更**：全新工具，不影响任何现有系统
