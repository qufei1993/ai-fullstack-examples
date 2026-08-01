# CLI Contract: ai-commit

## Command

```bash
ai-commit
```

无参数，无子命令。所有配置通过环境变量或配置文件指定。

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | 提交成功 |
| 1 | 暂存区为空 |
| 2 | AI API 调用失败 |
| 3 | 配置错误（缺少 API Key 等） |
| 4 | 用户取消操作 |
| 5 | git commit 执行失败 |

## Input

- `git diff --cached` — 暂存区变更内容（工具自动读取，非用户传入）
- 用户交互输入（通过 `readline`）：
  - `Y` / `y` / `Enter` — 确认提交
  - `N` / `n` — 取消操作
  - `E` / `e` — 编辑消息

## Output (stdout)

### 正常流程

```
🔍 正在分析暂存区变更...

📋 AI 生成的 commit message:
━━━━━━━━━━━━━━━━━━━━━━
feat(auth): add login page validation
━━━━━━━━━━━━━━━━━━━━━━

确认提交? [Y] 确认  [E] 编辑  [N] 取消:
```

### 编辑模式

```
📝 请输入新的 commit message:
> _
```

### 提交成功

```
✅ 提交成功!
   commit: a1b2c3d feat(auth): add login page validation
```

### 暂存区为空

```
❌ 没有暂存的变更，请先使用 git add 添加文件
```

### AI 服务错误

```
❌ AI 服务调用失败: [具体错误信息]
   请检查网络连接和 API 配置
```

## Configuration

### 配置文件 `~/.ai-commit/config.json`

```json
{
  "apiKey": "replace_with_your_api_key",
  "baseURL": "https://api.deepseek.com",
  "model": "deepseek-v4-flash"
}
```

### 环境变量（优先级高于配置文件）

| Variable | Description |
|----------|-------------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | API endpoint URL |
| `MODEL` | 模型名称 |
