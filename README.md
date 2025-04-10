# Elixir REPL

A VS Code extension for interacting with an Elixir IEx session.

## Features

* Starts an IEx session with `iex -S mix`.
* Allows sending `recompile()` to the IEx session.
* Allows sending selected text (or current line) from the editor to the IEx session.
* Allows clearing the IEx session.

## Usage

* `ctrl+x ctrl+x   ` - Starts a session (or opens it's terminal in case it's been open)
* `ctrl+x c        ` - Recompiles project
* `ctrl+x .        ` - Evaluates current line or current selection
* `ctrl+x backspace` - Starts a session

## Building it

Firstly install `vsce` globally:
```bash
npm install -g @vscode/vsce
```

Install project's deps:
```bash
npm install
```

Run build & package (compilation runs automatically):
```bash
vsce package
```

After that, you should find the `vsix` file in the root, which you can install:
```bash
code --install-extension my-file.vsix
```
