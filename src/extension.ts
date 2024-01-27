import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("audible-code.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from Audible Code!");
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
