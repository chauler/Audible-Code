import jzz from "jzz";
import say from "say";
import * as vscode from "vscode";
import { window } from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let config = vscode.workspace.getConfiguration("audibleCode");
  let prevLineNumber = vscode.window.activeTextEditor?.selection.active.line || -1;

  //Update config object throughout extension upon configuration change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("audibleCode")) {
        config = vscode.workspace.getConfiguration("audibleCode");
      }
    })
  );

  //Read line number upon focusing on document
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (!editor || !config.readLineNumber.enabled) return;
      ReadLine();
    })
  );

  //Play sound with varying pitch depending on indentation
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (editor !== window.activeTextEditor || !config.soundCues.indentSounds.enabled) return;
      const lineNumber = editor.selection.active.line;
      const line = editor.document.lineAt(lineNumber);
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
      if (lineNumber !== prevLineNumber) {
        const outputChannel = jzz().openMidiOut().or("error");
        outputChannel.note(0, 10 + 10 * indent, 127, 100);
      }
      setTimeout(() => {
        if (window.activeTextEditor) prevLineNumber = lineNumber;
      }, 0);
    })
  );

  //Play sound when user goes on same line as an error.
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (editor !== window.activeTextEditor || !config.soundCues.errorSounds.enabled) return;
      const currLine = editor.selection.active.line;
      let diagnostics = vscode.languages.getDiagnostics(editor.document.uri).filter((e) => {
        return e.range.start.line === currLine;
      });

      diagnostics = diagnostics.filter((e) => {
        return (
          (config.soundCues.severityTypes.Error ? e.severity === 0 : 0) ||
          (config.soundCues.severityTypes.Warning ? e.severity === 1 : 0) ||
          (config.soundCues.severityTypes.Information ? e.severity === 3 : 0)
        );
      });

      if (diagnostics.length > 0 && currLine !== prevLineNumber) {
        const outputChannel = jzz().openMidiOut().or("error");
        outputChannel.program(1, 81);
        outputChannel.note(1, 50, 127, 100);
      }
      setTimeout(() => {
        if (window.activeTextEditor) prevLineNumber = window.activeTextEditor.selection.active.line;
      }, 0);
    })
  );

  const commandDisposable = vscode.commands.registerCommand("audible-code.ReadErrors", async () => {
    const editor = window.activeTextEditor;
    if (!editor) return;

    const currLine = editor.selection.active.line;
    let diagnostics = vscode.languages.getDiagnostics(editor.document.uri).filter((e) => {
      return e.range.start.line === currLine;
    });

    diagnostics = diagnostics.filter((e) => {
      return (
        (config.errorReading.severityTypes.Error ? e.severity === 0 : 0) ||
        (config.errorReading.severityTypes.Warning ? e.severity === 1 : 0) ||
        (config.errorReading.severityTypes.Information ? e.severity === 3 : 0)
      );
    });

    for (const diagnostic of diagnostics) {
      await OutputTTS(diagnostic.message);
    }
  });

  //Reading Suggestions -- NOT IMPLEMENTED
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(async (event) => {
      const editor = event.textEditor;
      if (editor !== window.activeTextEditor) return;
      //const itemlist = await vscode.commands.executeCommand(
      //  "vscode.executeCompletionItemProvider",
      //  editor.document.uri,
      //  editor.selection.active
      //);
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

function StopTTS() {
  return new Promise((res, rej) => {
    say.stop(() => {
      console.log("done cancelling");
      res("");
    });
  });
}

function ReadLine() {
  //When the onDidChangeActiveTextEditor event is fired, the selection is at a default
  //line 0, column 0 position. In order to read an accurate line number, we must wait for
  //the editor to restore the previous position, firing an onDidChangeTextEditorSelection
  //event. We listen for this, then immediately dispose the listener.
  const disposable = window.onDidChangeTextEditorSelection(async (event) => {
    if (event.textEditor !== window.activeTextEditor) return;
    const line = event.selections[0].active.line + 1;
    //TTS may take a while, so go ahead and dispose this now rather than waiting and potentially triggering again
    disposable.dispose();
    //await StopTTS();
    //console.log("first test");
    await OutputTTS(`Line ${line.toString()}`);
  });
}

class LineReader {
  static _instance: LineReader | undefined = undefined;
  _currentlySpeaking = [];
  constructor() {
    if (LineReader._instance) {
      return LineReader._instance;
    }
    LineReader._instance = this;
  }
}
