import jzz from "jzz";
import say from "say";
import * as vscode from "vscode";
import { window } from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let prevLineNumber = vscode.window.activeTextEditor?.selection.active.line || -1;

  //Read line number upon focusing on document
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

  //Play sound with varying pitch depending on indentation
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (editor !== window.activeTextEditor) return;
      const line = editor.document.lineAt(editor.selection.active.line);
      const indentChar = line.text.charAt(0);
      const leadingSpace = line.text.length - line.text.trimStart().length;
      let indent = 0;
      if (indentChar === "\t") {
        // used tabs
        indent = leadingSpace;
      } else if (indentChar === " ") {
        // used spaces
        indent = Math.ceil(leadingSpace / (editor.options.tabSize! as number));
      }
      if (indent === 0) return;
      const outputChannel = jzz().openMidiOut().or("error");
      outputChannel.note(0, 10 + 10 * indent, 127, 100);
    })
  );

  //Play sound when user goes on same line as an error.
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (editor !== window.activeTextEditor) return;
      const currLine = editor.selection.active.line;
      let diagnostics = vscode.languages.getDiagnostics(editor.document.uri).filter((e) => {
        return e.range.start.line === currLine;
      });
      console.log(`diagnostics: ${diagnostics.length} prevLine: ${prevLineNumber} curr: ${currLine}`);
      if (diagnostics.length > 0 && currLine !== prevLineNumber) {
        const outputChannel = jzz().openMidiOut().or("error");
        outputChannel.program(1, 81);
        outputChannel.note(1, 50, 127, 100);
        const lineDisposable = window.onDidChangeTextEditorSelection((event) => {
          const editor = event.textEditor;
          if (editor !== window.activeTextEditor) return;
          if (editor.selection.active.line !== currLine) {
            lineDisposable.dispose();
            commandDisposable.dispose();
          }
        });
        const commandDisposable = vscode.commands.registerCommand("audible-code.ReadErrors", async () => {
          for (const diagnostic of diagnostics) {
            await OutputTTS(diagnostic.message);
          }
        });
      }
      prevLineNumber = currLine;
    })
  );

  //Register command to read current line
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
  return new Promise((res, rej) => {
    say.speak(message, undefined, undefined, res);
  });
}
