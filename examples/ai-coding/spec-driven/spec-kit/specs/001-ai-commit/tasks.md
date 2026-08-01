# Tasks: AI-Commit CLI

**Input**: Design documents from `/specs/001-ai-commit/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 未明确要求测试，本任务列表不包含测试任务。

**Organization**: 任务按 user story 分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属 user story（US1, US2, US3）
- 每个任务描述包含具体文件路径

---

## Phase 1: Setup (项目初始化)

**Purpose**: 项目基础结构和依赖安装

- [x] T001 初始化 npm 项目，创建 `package.json`，安装依赖（`chalk`, `typescript`, `tsx`, `vitest`）
- [x] T002 [P] 配置 `tsconfig.json`，target ES2022，module NodeNext，outDir dist
- [x] T003 [P] 配置 `vitest.config.ts`，设置测试环境

---

## Phase 2: Foundational (共享基础设施)

**Purpose**: 所有 user story 依赖的核心模块，必须先于任何 story 完成

**⚠️ CRITICAL**: 此阶段完成前，不得开始任何 user story 工作

- [x] T004 定义所有共享类型（StagedDiff, CommitMessage, AIConfig, CLIResult, ErrorInfo）在 `src/types.ts`
- [x] T005 [P] 实现配置读取模块（环境变量 + `~/.ai-commit/config.json`，优先级：env > 文件）在 `src/config.ts`
- [x] T006 [P] 实现 git 操作模块（获取 `git diff --cached`、获取文件列表、检测二进制文件）在 `src/git.ts`
- [x] T007 [P] 构建 AI prompt 模板（根据系统语言自动选择中/英文，Conventional Commits 格式约束）在 `src/prompt.ts`

**Checkpoint**: 基础设施就绪 — 所有模块可以被 user story 引用

---

## Phase 3: User Story 1 - 自动生成 Commit Message (Priority: P1) 🎯 MVP

**Goal**: 读取暂存区 diff，调用 DeepSeek API 生成 Conventional Commits 格式的 commit message，并在终端展示

**Independent Test**: 在任意 git 仓库中 `git add` 后运行 `npx tsx src/index.ts`，看到 AI 生成的 commit message

### Implementation for User Story 1

- [x] T008 [US1] 实现 AI API 调用模块（`POST https://api.deepseek.com/v1/chat/completions`，Bearer 认证，30s 超时，1 次重试）在 `src/ai.ts`
- [x] T009 [US1] 实现 CLI 主入口：串联 diff 读取 → prompt 构建 → AI 调用 → 消息展示的完整流程，以及展示后退出，在 `src/index.ts`

**Checkpoint**: User Story 1 完整可用 — 运行命令即可看到 AI 生成的 commit message

---

## Phase 4: User Story 2 - 确认或编辑后提交 (Priority: P2)

**Goal**: AI 生成消息后，提供 Y（确认）/ E（编辑）/ N（取消）交互，确认或编辑后执行 `git commit`

**Independent Test**: 运行 ai-commit 后分别测试 Y/E/N 三种路径，验证各自行为正确

### Implementation for User Story 2

- [x] T010 [US2] 实现终端 UI 交互模块（readline 实现 Y-确认 / E-编辑 / N-取消，彩色输出）在 `src/ui.ts`
- [x] T011 [US2] 扩展 CLI 主入口：集成 UI 交互流程，确认/编辑后调用 `git commit`，输出 commit hash，在 `src/index.ts`

**Checkpoint**: User Story 1 + 2 均可用 — 完整的 确认 → 提交 流程

---

## Phase 5: User Story 3 - 异常情况处理 (Priority: P3)

**Goal**: 所有异常场景都有清晰可操作的中文错误提示，安全退出不执行意外操作

**Independent Test**: 模拟空暂存区、无效 API key、网络断开等场景，验证错误提示清晰且进程安全退出

### Implementation for User Story 3

- [x] T012 [P] [US3] 添加暂存区为空检查，输出"没有暂存的变更，请先使用 git add 添加文件"，exit code 1，在 `src/index.ts`
- [x] T013 [P] [US3] 添加 AI API 错误处理（网络超时 → 提示检查网络，401 → 提示检查 API key，其他 → 显示错误详情+建议），exit code 2，在 `src/ai.ts`
- [x] T014 [P] [US3] 添加配置验证错误处理（缺少 API key → 提示配置方法，无效 URL → 提示检查 endpoint），exit code 3，在 `src/config.ts`
- [x] T015 [P] [US3] 添加 git 特殊状态检查（merge conflict / rebase in progress → 给出相应提示），在 `src/git.ts`
- [x] T016 [P] [US3] 添加 commit message 特殊字符转义（引号、换行符等），确保 `git commit -m` 正常执行，在 `src/git.ts`
- [x] T017 [P] [US3] 添加超大 diff 截断逻辑（超过 10000 行截断至前 10000 行，附加 `[... truncated]` 标记，保留完整文件列表），在 `src/git.ts`

**Checkpoint**: 所有异常场景均有清晰错误处理，进程安全退出

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨 story 的收尾工作

- [x] T018 [P] 配置 `package.json` 的 `bin` 字段指向 `dist/index.js`，支持 `npm install -g` 全局安装后直接使用 `ai-commit` 命令
- [x] T019 [P] 添加 build 脚本（`tsc` 编译 TypeScript）到 `package.json`
- [x] T020 端到端验证：按 `quickstart.md` 流程完整执行一遍，确保安装→配置→使用全流程正常
- [x] T021 代码审查与清理（移除调试代码、统一错误消息风格、确认所有 exit code 一致）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 — 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 — BLOCKS 所有 user story
- **User Story 1 (Phase 3)**: 依赖 Foundational 完成
- **User Story 2 (Phase 4)**: 依赖 US1 完成（US2 在 US1 的输出基础上添加交互）
- **User Story 3 (Phase 5)**: 依赖 US1 完成（US3 是对已有模块的错误处理增强）
- **Polish (Phase 6)**: 依赖所有 user story 完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成后可开始 — 不依赖其他 story
- **User Story 2 (P2)**: 依赖 US1 完成（需要 AI 调用和消息展示已就绪）
- **User Story 3 (P3)**: 依赖 US1 完成（需要在已有模块上添加错误处理），与其他 story 独立

### Within Each User Story

- 基础模块在 Foundational 阶段完成
- US1 内部：ai.ts → index.ts（index 依赖 ai）
- US2 内部：ui.ts → index.ts（index 集成 ui）
- US3 内部：所有 [P] 任务可并行执行（不同文件）

### Parallel Opportunities

- Phase 1: T002 + T003 可并行
- Phase 2: T005 + T006 + T007 可并行（都依赖 T004 types，互不依赖）
- Phase 5: T012-T017 全部可并行（6 个任务跨 4 个不同文件）
- Phase 6: T018 + T019 可并行

---

## Parallel Example: Phase 2 Foundational

```bash
# 第一步：定义类型（必须先完成）
Task: "T004 定义所有共享类型在 src/types.ts"

# 第二步：并行实现三个独立模块（全部依赖 T004）
Task: "T005 [P] 实现配置读取模块在 src/config.ts"
Task: "T006 [P] 实现 git 操作模块在 src/git.ts"
Task: "T007 [P] 构建 AI prompt 模板在 src/prompt.ts"
```

## Parallel Example: Phase 5 User Story 3

```bash
# 所有 US3 任务可并行（不同文件，独立功能）
Task: "T012 [P] [US3] 空暂存区检查在 src/index.ts"
Task: "T013 [P] [US3] AI API 错误处理在 src/ai.ts"
Task: "T014 [P] [US3] 配置验证错误处理在 src/config.ts"
Task: "T015 [P] [US3] git 特殊状态检查在 src/git.ts"
Task: "T016 [P] [US3] 特殊字符转义在 src/git.ts"
Task: "T017 [P] [US3] 超大 diff 截断在 src/git.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (CRITICAL)
3. 完成 Phase 3: User Story 1
4. **STOP and VALIDATE**: 在真实仓库中运行 `npx tsx src/index.ts`，验证能看到 AI 生成的 commit message
5. MVP 已就绪，可演示

### Incremental Delivery

1. Setup + Foundational → 基础设施就绪
2. 添加 User Story 1 → 可生成并展示消息 (MVP!)
3. 添加 User Story 2 → 可交互确认/编辑/提交
4. 添加 User Story 3 → 健壮的错误处理
5. 每个 story 都增加价值，不破坏之前的 story

### 单人开发策略

按优先级顺序依次完成：

1. T001→T002→T003 (Setup)
2. T004→(T005∥T006∥T007) (Foundational)
3. T008→T009 (US1) → **验证 MVP**
4. T010→T011 (US2) → **验证交互流程**
5. (T012∥T013∥T014∥T015∥T016∥T017) (US3) → **验证错误处理**
6. T018∥T019 → T020→T021 (Polish)

---

## Notes

- [P] 任务 = 不同文件，无依赖关系，可并行
- [Story] 标签将任务映射到特定 user story，便于追溯
- 每个 user story 应可独立完成和测试
- 每完成一个任务或逻辑组后 commit
- 在任何 checkpoint 停下来验证 story 是否独立可用
- 避免：模糊任务、同文件冲突、破坏独立性的跨 story 依赖
