# Quickstart: AI-Commit CLI

## 安装

```bash
npm install -g ai-commit
```

## 配置

### 方式一：环境变量（推荐）

```bash
export DEEPSEEK_API_KEY="replace_with_your_api_key"
```

### 方式二：配置文件

```bash
mkdir -p ~/.ai-commit
cat > ~/.ai-commit/config.json << 'EOF'
{
  "apiKey": "replace_with_your_api_key",
  "baseURL": "https://api.deepseek.com",
  "model": "deepseek-v4-flash"
}
EOF
```

## 使用

```bash
# 1. 暂存变更
git add .

# 2. 运行 ai-commit
ai-commit

# 3. 查看 AI 生成的消息，确认/编辑/取消
```

## 快速开始流程

1. 确保 Node.js 22 已安装
2. 安装 ai-commit：`npm install -g ai-commit`
3. 设置 `DEEPSEEK_API_KEY` 环境变量
4. 在任意 git 仓库中：`git add <files>` 然后 `ai-commit`
5. 确认或编辑生成的 commit message
