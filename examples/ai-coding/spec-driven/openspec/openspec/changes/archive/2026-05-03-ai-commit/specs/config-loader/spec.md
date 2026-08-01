## ADDED Requirements

### Requirement: 从环境变量加载配置
系统 SHALL 优先从以下环境变量读取配置：`DEEPSEEK_API_KEY`、`MODEL`、`AI_COMMIT_LANGUAGE`。

#### Scenario: 环境变量优先级最高
- **WHEN** 同时存在环境变量和配置文件中的相同配置项
- **THEN** 系统使用环境变量的值，忽略配置文件中的值

### Requirement: 从配置文件加载配置
系统 SHALL 从 `~/.ai-commit.json` 读取持久化配置，支持的字段包括 `apiKey`、`model`、`language`、`maxTokens`。

#### Scenario: 配置文件存在且格式正确
- **WHEN** `~/.ai-commit.json` 存在且为有效 JSON
- **THEN** 系统加载其中的配置值作为默认值（可被环境变量覆盖）

#### Scenario: 配置文件不存在
- **WHEN** `~/.ai-commit.json` 不存在
- **THEN** 系统使用内置默认值（model: `deepseek-chat`，language: `en`，maxTokens: 1024），不报错

#### Scenario: 配置文件格式错误
- **WHEN** `~/.ai-commit.json` 存在但不是有效 JSON
- **THEN** 系统输出警告"Warning: ~/.ai-commit.json is invalid JSON, using defaults."并继续使用默认值

### Requirement: 支持语言配置
系统 SHALL 支持通过 `language` 配置项指定 commit message 的语言，默认为英文（`en`），支持 `zh`（中文）。

#### Scenario: 配置语言为中文
- **WHEN** 配置 `language: "zh"` 或 `AI_COMMIT_LANGUAGE=zh`
- **THEN** AI 生成的 commit message description 和 body 使用中文，type/scope 保持英文

#### Scenario: 默认英文输出
- **WHEN** 未配置语言
- **THEN** AI 生成的 commit message 全部使用英文
