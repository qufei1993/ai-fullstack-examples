# AI 全栈工程师实战示例仓库规范

## 项目说明

本仓库保存《AI Agent 全栈开发实战》的公开代码示例。所有文件都可能公开到 GitHub，任何修改都必须默认按公开内容处理。

- 运行环境：Node.js 22
- 包管理器：npm
- 代码语言：TypeScript，使用 ESM
- 示例目录：`examples/{module-slug}/{chapter-slug}/`

## 安装与运行

安装依赖：

```bash
npm install
```

复制 `.env.example` 为 `.env`，只在本地填写自己的配置。`.env` 已被 `.gitignore` 忽略，不得提交。

运行示例时优先使用 `package.json` 中已有的 npm script。也可以使用统一命令：

```bash
npx tsx --env-file=.env examples/{module-slug}/{chapter-slug}/{文件名}.ts
```

修改示例后，至少运行本次涉及的脚本。仓库目前没有统一测试套件，不要虚构测试命令或测试结果。

## 密钥与隐私安全

以下规则是硬性要求：

1. 严禁把真实 API Key、Access Token、Cookie、Authorization Header、密码、私钥、云服务凭据或其他认证信息写入代码、Markdown、测试、日志、截图、终端输出或 Git 历史。
2. 严禁提交 `.env`、`.env.local` 或任何包含真实凭据的配置文件。不得使用 `git add -f` 绕过忽略规则，不得修改 `.gitignore` 来允许提交这些文件。
3. 示例代码统一通过 `process.env` 读取配置。不得硬编码密钥，不得复制其他仓库或个人电脑中的 `.env` 内容。
4. `.env.example` 只能保存无效占位符和可公开配置。占位符使用 `replace_with_your_api_key`，不得使用看起来像真实密钥的随机字符串。
5. 严禁在代码、文档和截图中写入个人绝对路径、用户名、邮箱、内网地址、私有仓库地址、账号 ID 或其他可识别个人与组织的信息。
6. 检查环境变量时，只确认变量是否存在。不要使用 `cat .env`、`env`、`printenv`、`echo $API_KEY` 等命令输出敏感值。
7. 调试 API 请求时，不得打印完整请求头、SDK 客户端配置或包含凭据的错误对象。必要时只记录状态码、错误类型和经过脱敏的信息。
8. 如果发现仓库中疑似存在真实凭据，立即停止传播，不要在回复或工具输出中复述该值。只报告文件路径和风险类型，并提醒维护者撤销和轮换凭据。未经明确授权，不得自行操作外部平台上的密钥。

## 代码约定

- 模型名统一从 `process.env.MODEL` 读取。
- Anthropic 示例使用 `new Anthropic()` 创建客户端，让 SDK 自动读取 `ANTHROPIC_API_KEY` 和 `ANTHROPIC_BASE_URL`。
- 新示例继续使用稳定的 `module-slug` 和 `chapter-slug`，不要绑定课程章节编号。
- 公开示例必须可独立运行，不得依赖本书私有仓库、私人笔记或个人绝对路径。
- 修改运行路径、环境变量或依赖后，同步更新 README、`.env.example` 和 `package.json`。

## 提交前检查

运行基础检查：

```bash
git diff --check
git status --short
```

使用只输出文件名的方式检查常见密钥模式，避免把疑似密钥再次打印到终端：

```bash
git grep -l -E 'sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' -- . ':!package-lock.json'
```

如果命令返回文件名，人工检查对应文件。不要使用会打印匹配内容的扫描参数。

提交前还要确认：

- Git 状态中没有 `.env` 或其他本地配置文件。
- 新增文件不包含个人绝对路径和真实账号信息。
- README 中的命令与实际路径一致。
- 本次修改涉及的示例已经运行成功。
