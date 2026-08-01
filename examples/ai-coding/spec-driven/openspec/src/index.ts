#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { readStagedDiff } from "./diff.js";
import { generateCommitMessage } from "./generator.js";
import { askConfirmation } from "./confirm.js";
import { executeCommit } from "./commit.js";

const program = new Command();

program
  .name("ai-commit")
  .description("AI-powered git commit message generator using DeepSeek")
  .version("0.1.0")
  .option("--dry-run", "generate message and print it without committing")
  .option("--model <model>", "override the AI model to use")
  .action(async (options: { dryRun?: boolean; model?: string }) => {
    const config = loadConfig(options.model ? { model: options.model } : {});

    let diff: string;
    try {
      diff = readStagedDiff();
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }

    let message: string;
    try {
      console.log("Generating commit message...");
      message = await generateCommitMessage(diff, config);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }

    if (options.dryRun) {
      console.log("\n" + message);
      process.exit(0);
    }

    while (true) {
      let result;
      try {
        result = await askConfirmation(message);
      } catch {
        console.log("\nAborted. No commit was made.");
        process.exit(0);
      }

      if (result.action === "abort") {
        console.log("Aborted. No commit was made.");
        process.exit(0);
      }

      if (result.action === "regenerate") {
        try {
          console.log("Regenerating...");
          message = await generateCommitMessage(diff, config);
        } catch (err) {
          console.error((err as Error).message);
          process.exit(1);
        }
        continue;
      }

      if (result.action === "confirm") {
        try {
          executeCommit(result.message);
        } catch (err) {
          const exitCode = (err as { exitCode?: number }).exitCode ?? 1;
          process.exit(exitCode);
        }
        break;
      }
    }
  });

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
