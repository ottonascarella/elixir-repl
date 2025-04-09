import * as vscode from "vscode";

const pluginName = "elixir-repl";

let terminal: vscode.Terminal | undefined;

function getCurrentLine(editor: vscode.TextEditor) {
  const line = editor.document.lineAt(editor.selection.active.line);
  return line.text;
}

const commands: Record<string, (...args: any[]) => any> = {
  startSession: async () => {
    if (!terminal || terminal.exitStatus !== undefined) {
      terminal = vscode.window.createTerminal({
        isTransient: true,
        name: "IEx",
        shellPath: process.env.SHELL, // Use the user's default shell
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath, // Set working directory to the workspace root if available
      });
      terminal.sendText("iex -S mix\n");
    }
    terminal.show();
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

    const textWithNoComments = textToSend.trim().replace(/^#/, "");

    terminal.sendText(`${textWithNoComments}\n`);
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

  // Optional: Create the view in the sidebar and associate the terminal with it
  const provider = new (class
    implements vscode.TreeDataProvider<vscode.TreeItem>
  {
    getTreeItem(
      element: vscode.TreeItem,
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
      return element;
    }
    getChildren(
      element?: vscode.TreeItem | undefined,
    ): vscode.ProviderResult<vscode.TreeItem[]> {
      return [
        new vscode.TreeItem(
          "IEx Session (Click to Focus)",
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }
    _onDidChangeTreeData: vscode.EventEmitter<
      vscode.TreeItem | undefined | null | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
      vscode.TreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event;
  })();

  vscode.window.registerTreeDataProvider("elixir-repl-terminal", provider);

  context.subscriptions.push(
    vscode.commands.registerCommand("elixir-repl-terminal.focus", () => {
      if (terminal) {
        terminal.show();
      } else {
        commands.startSession();
      }
    }),
  );

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
