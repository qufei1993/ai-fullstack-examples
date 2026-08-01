## 1. 项目初始化

- [x] 1.1 初始化 npm 项目，配置 `package.json`（name: `ai-commit`，bin 字段，engines: node>=22）
- [x] 1.2 安装依赖：`openai`（兼容 DeepSeek API）、`commander`、`@inquirer/prompts`
- [x] 1.3 安装开发依赖：`typescript`、`tsup`、`@types/node`
- [x] 1.4 配置 `tsconfig.json`（target: ES2022，module: NodeNext）
- [x] 1.5 配置 `tsup.config.ts`（输出 CJS + ESM，设置 `entry: src/index.ts`）

## 2. Config Loader

- [x] 2.1 创建 `src/config.ts`，定义 `Config` 接口（apiKey, model, language, maxTokens）
- [x] 2.2 实现从 `~/.ai-commit.json` 读取配置，文件不存在时静默返回空对象
- [x] 2.3 实现配置文件格式错误时输出 warning 并使用默认值的逻辑
- [x] 2.4 实现环境变量覆盖逻辑（`DEEPSEEK_API_KEY`、`MODEL`、`AI_COMMIT_LANGUAGE`）
- [x] 2.5 导出 `loadConfig()` 函数，返回合并后的配置（默认值 + 文件 + 环境变量）

## 3. Diff Reader

- [x] 3.1 创建 `src/diff.ts`，实现 `readStagedDiff()` 函数，执行 `git diff --staged`
- [x] 3.2 处理非 git 仓库和空暂存区的错误情况，抛出带描述信息的错误
- [x] 3.3 实现二进制文件检测，将二进制 diff 替换为 `[binary] <path>: <status>` 摘要
- [x] 3.4 实现单文件超 200 行截断逻辑（保留前 100 行 + truncated 提示）
- [x] 3.5 实现总 diff 超 4000 行截断逻辑（保留前 3000 行 + 统计摘要）

## 4. AI Generator

- [x] 4.1 创建 `src/generator.ts`，使用 `openai` SDK 初始化 DeepSeek 客户端（`baseURL: "https://api.deepseek.com"`）
- [x] 4.2 编写 system prompt，要求生成 Conventional Commits 格式，支持语言参数
- [x] 4.3 实现 `generateCommitMessage(diff, config)` 函数，调用 `messages.create`
- [x] 4.4 设置 30 秒超时，处理超时和 API 错误，抛出带用户友好消息的错误
- [x] 4.5 从响应中提取文本内容并去除首尾空白后返回

## 5. Interactive Confirm

- [x] 5.1 创建 `src/confirm.ts`，实现 `askConfirmation(message)` 函数
- [x] 5.2 使用 `@inquirer/prompts` 的 `select` 展示四个选项：确认/编辑/重新生成/取消
- [x] 5.3 实现"编辑"选项：使用 `editor` prompt 让用户修改 message
- [x] 5.4 返回包含动作类型和最终 message 的结果对象

## 6. Git Commit Executor

- [x] 6.1 创建 `src/commit.ts`，实现 `executeCommit(message)` 函数
- [x] 6.2 使用 `child_process.spawnSync` 执行 `git commit -m "<message>"`
- [x] 6.3 将 git 的 stdout/stderr 输出到用户终端
- [x] 6.4 若 git 返回非零退出码，抛出包含退出码的错误

## 7. CLI 入口

- [x] 7.1 创建 `src/index.ts`，使用 `commander` 定义 `ai-commit` 命令
- [x] 7.2 添加 `--dry-run` 选项（只输出 message，不交互）
- [x] 7.3 添加 `--model <model>` 选项，覆盖配置文件中的模型
- [x] 7.4 实现主流程：loadConfig → readStagedDiff → generateCommitMessage → (dry-run or) askConfirmation → executeCommit
- [x] 7.5 实现重新生成循环：用户选择"重新生成"时重新调用 `generateCommitMessage`
- [x] 7.6 在顶层捕获所有错误，输出用户友好错误信息后以退出码 1 退出
- [x] 7.7 在文件顶部添加 shebang `#!/usr/bin/env node`

## 8. 构建与验证

- [x] 8.1 运行 `npx tsup` 确认构建产物生成在 `dist/`
- [x] 8.2 运行 `npm link` 本地安装，验证 `ai-commit --help` 可执行
- [x] 8.3 在含有暂存变更的 git 仓库中运行 `ai-commit --dry-run`，验证输出正确的 commit message
- [x] 8.4 验证暂存区为空时的错误提示
- [x] 8.5 验证 `--model` 参数和环境变量覆盖逻辑
