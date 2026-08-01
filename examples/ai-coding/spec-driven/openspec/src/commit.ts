import { spawnSync } from "child_process";

export function executeCommit(message: string): void {
  const result = spawnSync("git", ["commit", "-m", message], {
    stdio: "inherit",
    encoding: "utf-8",
  });

  if (result.error) {
    throw new Error(`Failed to run git commit: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw Object.assign(new Error("git commit failed"), { exitCode: result.status });
  }
}
