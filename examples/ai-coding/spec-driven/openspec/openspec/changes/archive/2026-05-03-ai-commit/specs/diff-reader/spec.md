## ADDED Requirements

### Requirement: 读取 git 暂存区 diff
系统 SHALL 通过执行 `git diff --staged` 获取当前暂存区的完整 diff 内容。若当前目录不是 git 仓库或 git 命令不可用，SHALL 输出明确错误信息并以非零退出码退出。

#### Scenario: 正常读取暂存区 diff
- **WHEN** 当前目录是 git 仓库且存在已暂存的文件变更
- **THEN** 系统返回完整的 diff 字符串，格式与 `git diff --staged` 输出一致

#### Scenario: 暂存区为空
- **WHEN** 执行 `git diff --staged` 返回空字符串
- **THEN** 系统输出提示"No staged changes found. Please run 'git add' first."并以退出码 1 退出

#### Scenario: 非 git 仓库
- **WHEN** 当前目录不是 git 仓库
- **THEN** 系统输出错误"Not a git repository"并以退出码 1 退出

### Requirement: 超长 diff 截断
系统 SHALL 对超长 diff 进行截断，以避免超出 AI 模型的上下文限制。

#### Scenario: 单文件 diff 超过 200 行
- **WHEN** 某个文件的 diff 超过 200 行
- **THEN** 该文件的 diff 只保留前 100 行，末尾附加 `... (truncated, N lines omitted)` 说明

#### Scenario: 总 diff 超过 4000 行
- **WHEN** 所有文件合并后的 diff 超过 4000 行
- **THEN** 只发送前 3000 行，末尾附加总文件数和被截断的文件数统计

### Requirement: 过滤二进制文件
系统 SHALL 识别并跳过二进制文件的 diff 内容，仅保留其文件名和变更状态。

#### Scenario: 包含二进制文件
- **WHEN** 暂存区包含图片、压缩包等二进制文件
- **THEN** diff 中该文件显示为 `[binary] <path>: added|modified|deleted`，不包含二进制内容
