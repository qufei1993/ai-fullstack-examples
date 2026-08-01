## ADDED Requirements

### Requirement: 展示生成的 commit message
系统 SHALL 在终端中清晰展示 AI 生成的 commit message，并提示用户进行下一步操作。

#### Scenario: 展示 commit message 和操作选项
- **WHEN** AI 成功返回 commit message
- **THEN** 终端显示消息内容（带视觉分隔符），以及选项：[Y] 确认提交 / [e] 编辑 / [r] 重新生成 / [n] 取消

### Requirement: 用户确认提交
系统 SHALL 在用户选择确认后，将 message 传递给 git commit 执行器。

#### Scenario: 用户选择确认
- **WHEN** 用户输入 `y` 或直接回车
- **THEN** 系统将当前 message 传递给 git commit 执行器并执行提交

### Requirement: 用户编辑 message
系统 SHALL 在用户选择编辑时，打开默认编辑器或内联编辑，允许用户修改 message 内容后再提交。

#### Scenario: 用户选择编辑
- **WHEN** 用户输入 `e`
- **THEN** 系统打开内联文本编辑，用户修改内容后按确认，系统使用修改后的 message 执行提交

### Requirement: 用户重新生成 message
系统 SHALL 在用户选择重新生成时，再次调用 AI API 并展示新的 message。

#### Scenario: 用户选择重新生成
- **WHEN** 用户输入 `r`
- **THEN** 系统重新调用 AI 生成一条新的 commit message，并再次展示确认界面

### Requirement: 用户取消操作
系统 SHALL 在用户选择取消时，不执行任何 git 操作并退出。

#### Scenario: 用户选择取消
- **WHEN** 用户输入 `n` 或按 Ctrl+C
- **THEN** 系统输出"Aborted. No commit was made."并以退出码 0 退出，不修改 git 状态

### Requirement: --dry-run 模式
系统 SHALL 支持 `--dry-run` 标志，在该模式下只展示生成的 message，不执行交互确认和 git commit。

#### Scenario: dry-run 模式运行
- **WHEN** 用户执行 `ai-commit --dry-run`
- **THEN** 系统输出生成的 commit message 后立即退出，不展示交互菜单，退出码为 0
