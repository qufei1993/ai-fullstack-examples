## ADDED Requirements

### Requirement: 执行 git commit
系统 SHALL 使用用户确认的 commit message 执行 `git commit -m "<message>"` 命令，并将 git 的标准输出展示给用户。

#### Scenario: 成功执行 git commit
- **WHEN** 用户确认 message 且暂存区有变更
- **THEN** 系统执行 `git commit -m "<message>"`，显示 git 的输出（如提交哈希和摘要），退出码为 0

#### Scenario: git commit 执行失败
- **WHEN** git commit 命令返回非零退出码（如 pre-commit hook 拒绝）
- **THEN** 系统将 git 的错误输出完整展示给用户，并以相同的非零退出码退出

### Requirement: 多行 message 的正确传递
系统 SHALL 正确处理包含换行符的 commit message（首行 + body），确保多行格式在 git log 中正确显示。

#### Scenario: 传递多行 commit message
- **WHEN** AI 生成的 message 包含 body（首行之后有空行和详细说明）
- **THEN** git commit 后通过 `git log --format="%B"` 可看到完整的多行格式
