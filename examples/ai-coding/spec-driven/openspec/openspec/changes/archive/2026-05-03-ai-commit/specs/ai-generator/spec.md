## ADDED Requirements

### Requirement: 调用 AI 生成 commit message
系统 SHALL 将预处理后的 diff 内容发送给 DeepSeek API，并返回符合 Conventional Commits 格式的 commit message。

#### Scenario: 成功生成 commit message
- **WHEN** diff 内容非空且 API Key 有效
- **THEN** 系统返回一条以 `type(scope): description` 格式开头的 commit message，类型为 feat/fix/chore/refactor/docs/test/style/perf 之一

#### Scenario: API Key 未配置
- **WHEN** 环境变量 `DEEPSEEK_API_KEY` 未设置且配置文件中无 apiKey
- **THEN** 系统输出错误"DEEPSEEK_API_KEY is not set. Run 'ai-commit config' or set the environment variable."并以退出码 1 退出

#### Scenario: API 请求超时
- **WHEN** API 请求超过 30 秒未返回
- **THEN** 系统输出错误"Request timed out. Please try again."并以退出码 1 退出

#### Scenario: API 返回错误
- **WHEN** API 返回 4xx/5xx 错误
- **THEN** 系统输出包含错误状态码和消息的错误提示，并以退出码 1 退出

### Requirement: 支持 Conventional Commits 格式
系统 SHALL 在 system prompt 中明确要求 AI 生成符合 Conventional Commits 规范的消息，包含 type、可选 scope 和 description，以及可选的 body 和 footer。

#### Scenario: 生成带 body 的 commit message
- **WHEN** diff 变更较复杂（修改多个模块或有重要说明）
- **THEN** 生成的 message 在首行之后包含空行和 body，body 说明关键变更原因

#### Scenario: 生成简洁的单行 message
- **WHEN** diff 变更简单（如修改单个文件的小调整）
- **THEN** 生成的 message 只有一行，不包含冗余 body

### Requirement: 可配置模型参数
系统 SHALL 允许用户通过配置指定使用的 DeepSeek 模型和 max_tokens，默认模型为 `deepseek-chat`，默认 max_tokens 为 1024。

#### Scenario: 使用默认模型
- **WHEN** 用户未在配置中指定模型
- **THEN** 系统使用 `deepseek-chat` 发送请求

#### Scenario: 用户自定义模型
- **WHEN** 配置文件或 `--model` 参数指定了其他有效模型名称
- **THEN** 系统使用该模型名称发送请求
