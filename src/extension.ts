import jzz from "jzz";
import say from "say";
import * as vscode from "vscode";
import { window } from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const disposable = window.onDidChangeTextEditorSelection((event) => {
          if (event.textEditor !== window.activeTextEditor) return;
          const line = event.selections[0].active.line + 1;
          OutputTTS(`Line ${line.toString()}`);
          disposable.dispose();
        });
      }
    })
  );

  context.subscriptions.push(
    window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (editor !== window.activeTextEditor) return;
      const line = editor.document.lineAt(editor.selection.active.line);
      const indentChar = line.text.charAt(0);
      const leadingSpace = line.text.length - line.text.trimStart().length;
      console.log(line.text);
      let indent;
      if (indentChar === "\t") {
        // used tabs
        console.log(`leading: ${leadingSpace}`);
        indent = leadingSpace;
      } else if (indentChar === " ") {
        // used spaces
        console.log(`leading: ${Math.ceil(leadingSpace / (editor.options.tabSize! as number))}`);
        indent = Math.ceil(leadingSpace / (editor.options.tabSize! as number));
      } else {
        indent = 0;
      }
      console.log(`indent: ${indent}`);
      const outputChannel = jzz().openMidiOut().or("error");
      outputChannel.note(0, 10 + 10 * indent, 127, 100);
    })
  );

  let disposable = vscode.commands.registerCommand("audible-code.ReadLine", () => {
    const editor = window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      OutputTTS(`Line ${line.toString()}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function OutputTTS(message: string) {
  say.speak(message);
}
