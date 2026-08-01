import { execSync } from "child_process";

const MAX_FILE_LINES = 200;
const TRUNCATE_FILE_KEEP = 100;
const MAX_TOTAL_LINES = 4000;
const TRUNCATE_TOTAL_KEEP = 3000;

function isInGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function processBinaryFiles(diff: string): string {
  return diff.replace(
    /^diff --git a\/(.+) b\/(.+)\nindex [^\n]+\nBinary files (.+) differ$/gm,
    (_, _a, b, details) => {
      const status = details.includes("/dev/null") && details.startsWith("/dev/null")
        ? "added"
        : details.endsWith("/dev/null")
        ? "deleted"
        : "modified";
      return `[binary] ${b}: ${status}`;
    }
  );
}

function truncatePerFile(diff: string): string {
  const fileSections = diff.split(/(?=^diff --git )/m);
  return fileSections
    .map((section) => {
      const lines = section.split("\n");
      if (lines.length <= MAX_FILE_LINES) return section;
      const omitted = lines.length - TRUNCATE_FILE_KEEP;
      return (
        lines.slice(0, TRUNCATE_FILE_KEEP).join("\n") +
        `\n... (truncated, ${omitted} lines omitted)`
      );
    })
    .join("");
}

function truncateTotal(diff: string): string {
  const lines = diff.split("\n");
  if (lines.length <= MAX_TOTAL_LINES) return diff;

  const fileSections = diff.split(/(?=^diff --git )/m);
  const totalFiles = fileSections.filter((s) => s.trim()).length;
  const truncatedLines = lines.slice(0, TRUNCATE_TOTAL_KEEP);
  const truncatedFilesCount = fileSections.filter(
    (s) => s.trim() && !truncatedLines.join("\n").includes(s.split("\n")[0])
  ).length;

  return (
    truncatedLines.join("\n") +
    `\n... (truncated: showing ${TRUNCATE_TOTAL_KEEP}/${lines.length} lines, ` +
    `${totalFiles} files total, ~${truncatedFilesCount} files truncated)`
  );
}

export function readStagedDiff(): string {
  if (!isInGitRepo()) {
    throw new Error("Not a git repository");
  }

  let diff: string;
  try {
    diff = execSync("git diff --staged", { encoding: "utf-8" });
  } catch {
    throw new Error("Failed to run git diff --staged");
  }

  if (!diff.trim()) {
    throw new Error("No staged changes found. Please run 'git add' first.");
  }

  diff = processBinaryFiles(diff);
  diff = truncatePerFile(diff);
  diff = truncateTotal(diff);

  return diff;
}
