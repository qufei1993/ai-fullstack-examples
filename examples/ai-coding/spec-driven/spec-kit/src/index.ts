#!/usr/bin/env node

import chalk from 'chalk';
import { getStagedDiff } from './git.js';
import { loadConfig, validateConfig } from './config.js';
import { buildPrompt } from './prompt.js';
import { generateCommitMessage } from './ai.js';
import { confirmAndCommit } from './ui.js';
import { isErrorInfo } from './types.js';
import type { ErrorInfo } from './types.js';

async function main(): Promise<void> {
  console.log(chalk.blue('🔍 正在分析暂存区变更...\n'));

  const diff = getStagedDiff();
  if (isErrorInfo(diff)) {
    console.error(chalk.red(`❌ ${diff.detail}`));
    console.error(chalk.yellow(`   ${diff.suggestion}`));
    process.exit(exitCode(diff));
  }

  const config = loadConfig();
  if (isErrorInfo(config)) {
    console.error(chalk.red(`❌ ${config.detail}`));
    console.error(chalk.yellow(`   ${config.suggestion}`));
    process.exit(exitCode(config));
  }

  const configError = validateConfig(config);
  if (configError) {
    console.error(chalk.red(`❌ ${configError.detail}`));
    console.error(chalk.yellow(`   ${configError.suggestion}`));
    process.exit(exitCode(configError));
  }

  const { systemPrompt, userMessage } = buildPrompt(diff);

  console.log(chalk.blue('🤖 正在调用 AI 生成 commit message...\n'));

  const result = await generateCommitMessage(config, systemPrompt, userMessage);

  if (isErrorInfo(result)) {
    console.error(chalk.red(`❌ ${result.detail}`));
    console.error(chalk.yellow(`   ${result.suggestion}`));
    process.exit(exitCode(result));
  }

  console.log(chalk.green('📋 AI 生成的 commit message:'));
  console.log(chalk.white('━'.repeat(40)));
  console.log(chalk.bold.white(result.raw));
  console.log(chalk.white('━'.repeat(40)));
  console.log();

  const commitResult = await confirmAndCommit(result.raw);

  if (commitResult.status === 'cancelled') {
    console.log(chalk.yellow('🚫 已取消提交'));
    process.exit(4);
  }

  if (commitResult.status === 'error') {
    console.error(chalk.red(`❌ ${commitResult.message}`));
    if (commitResult.error) {
      console.error(chalk.yellow(`   ${commitResult.error.suggestion}`));
    }
    process.exit(5);
  }

  console.log(chalk.green('✅ 提交成功!'));
  console.log(
    chalk.white(`   commit: ${commitResult.commitHash} ${result.raw}`),
  );
}

function exitCode(result: ErrorInfo): number {
  switch (result.code) {
    case 'NO_STAGED_CHANGES':
      return 1;
    case 'API_ERROR':
      return 2;
    case 'CONFIG_ERROR':
      return 3;
    case 'GIT_ERROR':
      return 5;
    default:
      return 1;
  }
}

main().catch((err) => {
  console.error(chalk.red(`❌ 未知错误: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
