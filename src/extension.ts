import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('恭喜，您的扩展 "vscode-fast-debug-log" 现在已激活！');

    let disposable = vscode.commands.registerCommand('vscode-fast-debug-log.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from vscode-fast-debug-log!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
