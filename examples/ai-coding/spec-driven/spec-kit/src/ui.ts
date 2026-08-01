import * as readline from 'node:readline';
import chalk from 'chalk';
import { commit } from './git.js';
import { isErrorInfo } from './types.js';
import type { CLIResult } from './types.js';

function ask(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function confirmAndCommit(message: string): Promise<CLIResult> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const choice = await ask(
    rl,
    `${chalk.cyan('确认提交?')} ${chalk.green('[Y]')} 确认  ${chalk.yellow('[E]')} 编辑  ${chalk.red('[N]')} 取消: `,
  );

  const normalized = choice.toLowerCase();

  if (normalized === 'y' || normalized === 'yes' || normalized === '') {
    rl.close();
    return doCommit(message);
  }

  if (normalized === 'e' || normalized === 'edit') {
    const newMessage = await ask(rl, chalk.cyan('\n📝 请输入新的 commit message:\n> '));
    rl.close();

    if (!newMessage.trim()) {
      return {
        status: 'cancelled',
        message: '输入为空，已取消提交',
        commitHash: null,
        error: null,
      };
    }

    return doCommit(newMessage.trim());
  }

  rl.close();

  if (normalized === 'n' || normalized === 'no') {
    return {
      status: 'cancelled',
      message: '用户取消操作',
      commitHash: null,
      error: null,
    };
  }

  return {
    status: 'cancelled',
    message: '无效输入，已取消提交',
    commitHash: null,
    error: null,
  };
}

function doCommit(message: string): CLIResult {
  const result = commit(message);

  if (isErrorInfo(result)) {
    return {
      status: 'error',
      message: result.detail,
      commitHash: null,
      error: result,
    };
  }

  return {
    status: 'success',
    message: '提交成功',
    commitHash: result.hash,
    error: null,
  };
}
