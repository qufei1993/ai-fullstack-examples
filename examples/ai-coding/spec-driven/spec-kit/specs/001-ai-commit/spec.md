# Feature Specification: AI-Commit CLI

**Feature Branch**: `001-ai-commit`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "我想开发一个 CLI 工具，读取当前 git 暂存区的 diff，调用 AI 生成 commit message，让我确认后执行 git commit。工具名叫 ai-commit，用 TypeScript 实现。"

## Clarifications

### Session 2026-05-03

- Q: AI 生成的 commit message 应该使用什么语言？ → A: 根据系统语言环境自动选择中文或英文
- Q: 用户编辑 commit message 时应该使用什么交互方式？ → A: 命令行内直接编辑（终端内提供简易文本输入，用户直接键入修改）
- Q: 是否允许用户自定义 AI 生成 commit message 的附加指令？ → A: v1 不支持自定义，使用内置的固定 prompt 模板

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 自动生成 Commit Message (Priority: P1)

开发者将代码变更添加到 git 暂存区后，运行 `ai-commit` 命令，工具自动读取暂存区 diff 内容，调用 AI 服务生成符合 Conventional Commits 规范的提交信息，并展示给开发者。

**Why this priority**: 这是工具的核心功能，没有它工具无法提供任何价值。

**Independent Test**: 可在任意 git 仓库中暂存变更后运行命令来验证——结果应为生成一条语义准确的 commit message。

**Acceptance Scenarios**:

1. **Given** 暂存区有代码变更，**When** 用户运行 `ai-commit`，**Then** 工具读取暂存区 diff 并调用 AI 生成一条符合 Conventional Commits 格式的 commit message（如 `feat(auth): add login page`）
2. **Given** 暂存区有多个文件的不同类型变更，**When** 用户运行 `ai-commit`，**Then** AI 能够综合分析所有变更，生成一个准确的摘要性 commit message
3. **Given** 暂存区的变更仅涉及单个微小修改，**When** 用户运行 `ai-commit`，**Then** AI 生成简洁且准确的 commit message，不过度冗长

---

### User Story 2 - 确认或编辑后提交 (Priority: P2)

AI 生成 commit message 后，工具将消息展示给用户，允许用户直接确认执行提交，或对消息进行编辑后再提交，或取消操作。

**Why this priority**: 用户需要对最终提交内容有控制权。AI 生成的消息可能不完全准确，需要人工审核和修改的环节。

**Independent Test**: 可在 AI 生成消息后，验证确认、编辑、取消三种操作路径是否正确执行。

**Acceptance Scenarios**:

1. **Given** AI 已生成 commit message 并展示给用户，**When** 用户选择确认，**Then** 工具使用该消息执行 `git commit`
2. **Given** AI 已生成 commit message 并展示给用户，**When** 用户选择编辑并在终端内直接修改消息，**Then** 工具使用用户修改后的消息执行 `git commit`
3. **Given** AI 已生成 commit message 并展示给用户，**When** 用户选择取消，**Then** 工具放弃本次操作，不执行任何 commit，并输出取消提示
4. **Given** 用户确认提交，**When** git commit 执行成功，**Then** 工具输出提交成功的确认信息，包含 commit hash

---

### User Story 3 - 异常情况处理 (Priority: P3)

当遇到异常情况（如暂存区无变更、AI 服务不可用、git commit 失败等）时，工具给出清晰的错误提示，帮助用户理解问题并采取相应措施。

**Why this priority**: 健壮的错误处理是良好用户体验的基础，但可以在基本功能完成后逐步完善。

**Independent Test**: 可通过模拟各种异常场景（清空暂存区、使用无效 API key、网络断开等）来验证错误提示是否清晰有用。

**Acceptance Scenarios**:

1. **Given** 暂存区没有任何文件变更，**When** 用户运行 `ai-commit`，**Then** 工具提示"没有暂存的变更，请先使用 git add 添加文件"并退出
2. **Given** AI 服务调用失败（网络问题或 API 错误），**When** 用户运行 `ai-commit`，**Then** 工具显示具体错误信息并建议用户检查网络连接和 API 配置，不执行任何提交
3. **Given** 用户未配置 AI API 密钥，**When** 用户运行 `ai-commit`，**Then** 工具提示用户需要配置 API 密钥及配置方法

---

### Edge Cases

- 暂存区 diff 非常大（超过 AI 模型的 token 限制）时，工具应截断或提示用户分批提交
- 暂存区包含二进制文件时，diff 输出可能无意义，工具应识别并排除二进制文件
- git 仓库处于特殊状态（如 merge conflict、rebase in progress）时，工具应给出相应提示
- 用户配置的 AI 模型不支持或 API endpoint 不可达时，应有合理的超时和重试机制
- 提交信息中包含特殊字符（如引号、换行符）时，需正确转义才能通过 git commit 执行
- `.gitignore` 中忽略的文件被强制 `git add` 进入暂存区时应正常处理

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 工具 MUST 能够读取当前 git 仓库暂存区的 `git diff --cached` 内容
- **FR-002**: 工具 MUST 将 diff 内容发送至 AI 服务，请求生成符合 Conventional Commits 规范的 commit message
- **FR-003**: 工具 MUST 将 AI 生成的 commit message 展示给用户进行确认
- **FR-004**: 用户 MUST 能够直接确认使用生成的消息执行 `git commit`
- **FR-005**: 用户 MUST 能够在确认前编辑 AI 生成的消息
- **FR-006**: 用户 MUST 能够取消操作，不执行任何提交
- **FR-007**: 工具 MUST 在暂存区为空时给出明确提示并安全退出
- **FR-008**: 工具 MUST 在 AI 服务调用失败时给出用户可理解的错误信息
- **FR-009**: 工具 MUST 支持通过配置文件或环境变量配置 AI 服务的 API 密钥和 endpoint
- **FR-010**: AI 生成的 commit message MUST 遵循 Conventional Commits 格式（`<type>[optional scope]: <description>`）
- **FR-013**: 工具 MUST 根据系统语言环境自动选择 commit message 语言（中文系统生成中文消息，其他系统生成英文消息）
- **FR-011**: 工具 MUST 对输出中的特殊字符进行正确处理，确保 git commit 命令正常执行
- **FR-012**: 工具 MUST 排除暂存区中的二进制文件，不将其 diff 发送给 AI

### Key Entities

- **Commit Message**: AI 生成或用户编辑后的提交信息，格式遵循 Conventional Commits（`<type>[optional scope]: <description>`），包含类型（feat/fix/chore 等）、可选范围和描述
- **Staged Diff**: git 暂存区的变更内容，是 AI 生成 commit message 的输入源，排除二进制文件
- **AI Service Configuration**: 用户配置的 AI 服务连接信息，包含 API 密钥、endpoint 地址和模型名称

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户在暂存变更后，从运行 `ai-commit` 到看到生成消息的时间不超过 10 秒（在网络正常情况下）
- **SC-002**: AI 生成的 commit message 在 80% 以上的情况下无需用户编辑即可直接使用
- **SC-003**: 相比手动编写 commit message，使用该工具可将提交操作总耗时减少 50% 以上
- **SC-004**: 新用户在首次使用时，凭借错误提示和文档，能在 2 分钟内完成初始配置并成功生成第一条 commit message
- **SC-005**: 100% 的异常场景（空暂存区、API 故障、网络问题）都有清晰可操作的中文错误提示

## Assumptions

- 目标用户是使用命令行的软件开发者，熟悉 git 基本操作
- 用户已配置好 DeepSeek API 密钥
- 工具默认使用 DeepSeek API（deepseek-v4-flash 模型），但支持通过配置切换为其他兼容接口
- 生成的 commit message 遵循 Conventional Commits 规范
- 工具仅支持本地 git 仓库操作，不涉及远程仓库交互
- 暂存区 diff 通常不超过 10000 行，超过时需截断处理
- 用户的操作系统和 shell 支持 Node.js/TypeScript 运行时
- 工具以全局 npm 包形式分发，用户通过 `npm install -g` 安装
- v1 版本不支持用户自定义 AI prompt，使用内置的固定 prompt 模板；自定义指令功能延后至后续版本评估
