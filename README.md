# Elixir REPL

A VS Code extension for interacting with an Elixir IEx session.

## Features

* Starts an IEx session with `iex -S mix`.
* Allows sending `recompile()` to the IEx session.
* Allows sending selected text (or current line) from the editor to the IEx session.
* Allows clearing the IEx session.

## Usage

1.  Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2.  Run the "Elixir REPL: Start IEx Session" command to start a new IEx terminal.
3.  To recompile your Elixir project, run the "Elixir REPL: Recompile" command.
4.  Select text in an Elixir editor and run the "Elixir REPL: Send Selected Text" command (or use the context menu) to execute it in the IEx session.
