import { select, editor } from "@inquirer/prompts";

export type ConfirmAction = "confirm" | "edit" | "regenerate" | "abort";

export interface ConfirmResult {
  action: ConfirmAction;
  message: string;
}

export async function askConfirmation(message: string): Promise<ConfirmResult> {
  console.log("\n" + "─".repeat(60));
  console.log(message);
  console.log("─".repeat(60) + "\n");

  const action = await select<ConfirmAction>({
    message: "What would you like to do?",
    choices: [
      { name: "✓  Use this message", value: "confirm" },
      { name: "✎  Edit message", value: "edit" },
      { name: "↺  Regenerate", value: "regenerate" },
      { name: "✗  Abort", value: "abort" },
    ],
  });

  if (action === "edit") {
    const edited = await editor({
      message: "Edit the commit message:",
      default: message,
    });
    return { action: "confirm", message: edited.trim() };
  }

  return { action, message };
}
