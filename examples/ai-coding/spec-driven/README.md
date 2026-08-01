# Spec-Driven Development 示例

这里保存小册中使用 Spec Kit 和 OpenSpec 开发 `ai-commit` 的完整产物。两个目录都包含最终代码和工具生成的规格文件，方便对照两种工作流的差异。

## 目录说明

- `spec-kit/`：Spec Kit 生成的 `spec.md`、`plan.md`、`tasks.md` 等规格产物，以及最终实现。
- `openspec/`：OpenSpec 归档后的 change、主规格库和最终实现。

这些产物来自文章实战时使用的工具版本。Spec Kit 当时通过 `--ai claude` 初始化，当前版本已经改用 `--integration claude`。保留旧产物是为了让规格、截图和最终代码能够互相对应。

## 运行环境

- Node.js 22
- npm
- DeepSeek OpenAI 兼容接口

在仓库根目录安装依赖：

```bash
npm install
```

复制 `.env.example` 为 `.env`，填写 `DEEPSEEK_API_KEY`，并把 `MODEL` 改成 DeepSeek 当前支持的模型名。

运行 Spec Kit 版本：

```bash
npx tsx --env-file=.env examples/ai-coding/spec-driven/spec-kit/src/index.ts
```

运行 OpenSpec 版本：

```bash
npx tsx --env-file=.env examples/ai-coding/spec-driven/openspec/src/index.ts --dry-run
```

两个命令都需要在 Git 仓库中运行，并且暂存区已经通过 `git add` 加入变更。OpenSpec 命令使用 `--dry-run` 时只生成提交信息，不会执行 `git commit`。
