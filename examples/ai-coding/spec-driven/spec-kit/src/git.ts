import { execSync } from 'node:child_process';
import type { StagedDiff, ErrorInfo } from './types.js';

const MAX_DIFF_LINES = 10000;

export function getStagedDiff(): StagedDiff | ErrorInfo {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch {
    return {
      code: 'GIT_ERROR',
      detail: '当前目录不是 git 仓库',
      suggestion: '请在 git 仓库根目录运行 ai-commit',
    };
  }

  const status = checkGitState();
  if (status) return status;

  try {
    const filesOutput = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!filesOutput) {
      return {
        code: 'NO_STAGED_CHANGES',
        detail: '没有暂存的变更',
        suggestion: '请先使用 git add 添加要提交的文件',
      };
    }

    const allFiles = filesOutput.split('\n').filter(Boolean);
    const binaryFiles = detectBinaryFiles();
    const files = allFiles.filter((f) => !binaryFiles.includes(f));

    let diffContent = execSync('git diff --cached', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });

    const lines = diffContent.split('\n');
    const lineCount = lines.length;
    let isTruncated = false;

    if (lineCount > MAX_DIFF_LINES) {
      diffContent = lines.slice(0, MAX_DIFF_LINES).join('\n');
      diffContent += '\n[... truncated, showing first ' + MAX_DIFF_LINES + ' lines]';
      isTruncated = true;
    }

    return {
      files,
      content: diffContent,
      lineCount,
      isTruncated,
    };
  } catch (err) {
    return {
      code: 'GIT_ERROR',
      detail: `读取 git diff 失败: ${err instanceof Error ? err.message : String(err)}`,
      suggestion: '请确认 git 正常工作且暂存区可读',
    };
  }
}

function detectBinaryFiles(): string[] {
  try {
    const diffFiles = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!diffFiles) return [];

    const files = diffFiles.split('\n').filter(Boolean);
    const binaryFiles: string[] = [];

    for (const file of files) {
      try {
        execSync(`git diff --cached --binary -- "${file}"`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch {
        binaryFiles.push(file);
      }
    }

    return binaryFiles;
  } catch {
    return [];
  }
}

function checkGitState(): ErrorInfo | null {
  try {
    const mergeHead = execSync('git rev-parse --verify MERGE_HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (mergeHead) {
      return {
        code: 'GIT_ERROR',
        detail: '检测到正在进行 git merge，请先完成合并',
        suggestion: '解决合并冲突后使用 git commit 完成合并，或使用 git merge --abort 取消',
      };
    }
  } catch {
    // MERGE_HEAD not found, no merge in progress
  }

  try {
    const rebaseHead = execSync('git rev-parse --verify REBASE_HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (rebaseHead) {
      return {
        code: 'GIT_ERROR',
        detail: '检测到正在进行 git rebase，请先完成变基',
        suggestion: '使用 git rebase --continue 继续或 git rebase --abort 取消',
      };
    }
  } catch {
    // REBASE_HEAD not found, no rebase in progress
  }

  return null;
}

export function commit(message: string): { hash: string } | ErrorInfo {
  try {
    const escaped = message.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
    execSync(`git commit -m "${escaped}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return { hash };
  } catch (err) {
    return {
      code: 'GIT_ERROR',
      detail: `git commit 执行失败: ${err instanceof Error ? err.message : String(err)}`,
      suggestion: '请确认 git 正常工作',
    };
  }
}
