import * as vscode from 'vscode';

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

export function activate(context: vscode.ExtensionContext) {
    console.log('恭喜，您的扩展 "vscode-fast-debug-log" 现在已激活！');

    let disposable = vscode.commands.registerCommand('vscode-fast-debug-log.addDebugLog', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动的编辑器');
            return;
        }

        const document = editor.document;
        const languageId = document.languageId;

        // 检查文件类型
        if (!SUPPORTED_LANGUAGES.includes(languageId)) {
            vscode.window.showWarningMessage(`当前文件类型 ${languageId} 不支持，仅支持 js, ts, jsx, tsx 文件`);
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('请先选择要添加调试日志的代码区域');
            return;
        }

        // 获取选中的行范围
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        // 获取编辑器配置的缩进设置
        const eol = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';

        // 在每一行的末尾换行插入 debug 语句
        const edits: vscode.TextEdit[] = [];
        
        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
            const line = document.lineAt(lineNum);
            const lineText = line.text;
            
            // 跳过空行
            if (lineText.trim().length === 0) {
                continue;
            }

            // 跳过只包含大括号的行（如 } 或 {）
            const trimmedLine = lineText.trim();
            if (trimmedLine === '}' || trimmedLine === '{' || trimmedLine === '};' || trimmedLine === '{;') {
                continue;
            }

            // 获取当前行的缩进（用于保持缩进一致）
            const indentMatch = lineText.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';

            // 生成橘色的 debug 语句，保持相同的缩进
            const debugStatement = `${eol}${indent}console.log('%c🐞 DEBUG', 'color: orange; font-weight: bold');`;

            // 在行的末尾插入（换行后插入）
            const lineEndPosition = line.range.end;
            edits.push(new vscode.TextEdit(new vscode.Range(lineEndPosition, lineEndPosition), debugStatement));
        }

        // 应用编辑（从后往前应用，避免行号变化影响）
        if (edits.length > 0) {
            // 反转编辑顺序，从后往前应用
            edits.reverse();
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, edits);
            vscode.workspace.applyEdit(workspaceEdit).then(success => {
                if (success) {
                    vscode.window.showInformationMessage(`已添加 ${edits.length} 个调试日志`);
                } else {
                    vscode.window.showErrorMessage('添加调试日志失败');
                }
            });
        } else {
            vscode.window.showWarningMessage('没有可添加调试日志的行');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
