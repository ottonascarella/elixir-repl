import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const pluginName = "elixir-repl";

let terminal: vscode.Terminal | undefined;

interface ProjectSettings {
  iexParams: string;
}

function getSettingsPath(): string | undefined {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) return undefined;

  const vscodePath = path.join(workspaceRoot, ".vscode");
  // Ensure .vscode directory exists
  if (!fs.existsSync(vscodePath)) {
    fs.mkdirSync(vscodePath, { recursive: true });
  }
  return path.join(vscodePath, "elixir-repl.json");
}

async function loadProjectSettings(): Promise<ProjectSettings> {
  const settingsPath = getSettingsPath();
  if (!settingsPath || !fs.existsSync(settingsPath)) {
    return { iexParams: "" };
  }

  try {
    const data = await fs.promises.readFile(settingsPath, "utf8");
    return JSON.parse(data);
  } catch {
    return { iexParams: "" };
  }
}

async function saveProjectSettings(settings: ProjectSettings): Promise<void> {
  const settingsPath = getSettingsPath();
  if (!settingsPath) return;

  await fs.promises.writeFile(
    settingsPath,
    JSON.stringify(settings, null, 2),
    "utf8",
  );
}

function getCurrentLine(editor: vscode.TextEditor) {
  const line = editor.document.lineAt(editor.selection.active.line);
  return line.text
    .trim()
    .replace(/^#+/, "")
    .replace(/^iex(?:\(\d+\))?>+\s*/, "")
    .trim();
}

const commands: Record<string, (...args: any[]) => any> = {
  startSession: async () => {
    if (!terminal || terminal.exitStatus !== undefined) {
      const settings = await loadProjectSettings();

      terminal = vscode.window.createTerminal({
        isTransient: true,
        name: "IEx",
        shellPath: process.env.SHELL,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      });
      terminal.sendText(`iex -S mix ${settings.iexParams}\n`);
    }
    terminal.show();
  },

  configureIexParams: async () => {
    const settings = await loadProjectSettings();

    const params = await vscode.window.showInputBox({
      prompt: "Enter IEx parameters for this project",
      placeHolder: "iex -s mix <anything you'd add here>",
      value: settings.iexParams,
    });

    if (params !== undefined) {
      // Only save if user didn't cancel
      await saveProjectSettings({ ...settings, iexParams: params });
      vscode.window.showInformationMessage(
        "IEx parameters saved for this project",
      );
    }
  },
  recompile: async () => {
    if (terminal && terminal.exitStatus === undefined) {
      vscode.window.activeTextEditor?.document.save();
      terminal.sendText("recompile()\n");
    } else {
      vscode.window.showErrorMessage("IEx session is not running.");
    }
  },
  clear: async () => {
    if (terminal && terminal.exitStatus === undefined) {
      terminal.sendText("clear()\n");
    } else {
      vscode.window.showErrorMessage("IEx session is not running.");
    }
  },
  sendSelected: async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active text editor.");
      return;
    }
    const selectedText = editor.document.getText(editor.selection);
    const currentLineText = getCurrentLine(editor);
    const textToSend = selectedText === "" ? currentLineText : selectedText;

    if (!terminal || terminal?.exitStatus !== undefined) {
      vscode.window.showErrorMessage("IEx session is not running");
      return;
    }

    if (textToSend === "") {
      vscode.window.showErrorMessage("No text to evaluate");
      return;
    }

    terminal.sendText(`${textToSend}\n`);
  },
};

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "elixir-repl" is now active!');

  Object.keys(commands).forEach((commandName) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `${pluginName}.${commandName}`,
        commands[commandName],
      ),
    );
  });

  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((closedTerminal) => {
      if (closedTerminal === terminal) {
        terminal = undefined;
      }
    }),
  );
}

export function deactivate() {
  terminal?.dispose();
}
