import * as vscode from 'vscode';

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

// 检测是否是完整语句（不是多行语句的一部分）
function isCompleteStatement(lineText: string, document: vscode.TextDocument, lineNum: number): boolean {
    const trimmed = lineText.trim();
    
    // 跳过空行
    if (trimmed.length === 0) {
        return false;
    }
    
    // 跳过注释行
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return false;
    }
    
    // 跳过只包含大括号的行
    if (trimmed === '}' || trimmed === '{' || trimmed === '};' || trimmed === '{;') {
        return false;
    }
    
    // 如果以分号结尾，通常是完整语句
    if (trimmed.endsWith(';')) {
        return true;
    }
    
    // 如果以右花括号结尾，通常是完整语句（但我们已经跳过了只有 } 的行）
    if (trimmed.endsWith('}')) {
        return true;
    }
    
    // 检查行尾是否有未完成的字符（表示是多行语句的一部分）
    const lineEnd = trimmed.slice(-2); // 检查最后两个字符
    
    // 如果以这些字符结尾，可能是未完成的语句
    const incompletePatterns = [
        /,\s*$/,           // 逗号结尾
        /\(\s*$/,          // 左括号结尾
        /\[\s*$/,          // 左方括号结尾
        /\.\s*$/,          // 点号结尾（链式调用）
        /[+\-*/%]\s*$/,    // 运算符结尾
        /&&\s*$/,          // 逻辑与
        /\|\|\s*$/,        // 逻辑或
        /\?\s*$/,          // 三元运算符
        /:\s*$/,           // 冒号（但要注意对象字面量和三元运算符）
        /=\s*$/,           // 赋值（但分号结尾的赋值是完整的）
    ];
    
    // 检查是否匹配未完成模式
    for (const pattern of incompletePatterns) {
        if (pattern.test(trimmed)) {
            // 检查下一行是否存在且不是注释或空行
            if (lineNum < document.lineCount - 1) {
                const nextLine = document.lineAt(lineNum + 1).text.trim();
                if (nextLine.length > 0 && !nextLine.startsWith('//') && !nextLine.startsWith('*')) {
                    return false; // 可能是未完成的语句
                }
            }
        }
    }
    
    // 检查是否是模板字符串的中间行（以反引号内的内容判断比较复杂，这里简化处理）
    // 如果行中包含未闭合的反引号，可能是模板字符串的一部分
    const backtickCount = (lineText.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0 && lineNum < document.lineCount - 1) {
        // 奇数个反引号，可能是未闭合的模板字符串
        const nextLine = document.lineAt(lineNum + 1).text.trim();
        if (nextLine.length > 0 && !nextLine.startsWith('//')) {
            return false;
        }
    }
    
    // 其他情况，如果下一行是空行或注释，认为是完整的
    if (lineNum < document.lineCount - 1) {
        const nextLine = document.lineAt(lineNum + 1).text.trim();
        if (nextLine.length === 0 || nextLine.startsWith('//') || nextLine.startsWith('*')) {
            return true;
        }
    } else {
        // 最后一行，认为是完整的
        return true;
    }
    
    // 默认认为是完整的（保守策略）
    return true;
}

// 检测一行是否包含 console.log 语句的开头
function isConsoleLogStart(lineText: string): boolean {
    const trimmed = lineText.trim();
    // 匹配 console.log(... 或 console.warn(... 等
    const consoleLogPattern = /^\s*console\.(log|warn|error|info|debug)\s*\(/;
    return consoleLogPattern.test(trimmed);
}

// 查找 console.log 语句的结束位置（处理多行情况）
function findConsoleLogEnd(document: vscode.TextDocument, startLine: number): number | null {
    let lineNum = startLine;
    let openParens = 0;
    let inString = false;
    let stringChar = '';
    
    while (lineNum < document.lineCount) {
        const line = document.lineAt(lineNum);
        const lineText = line.text;
        
        for (let i = 0; i < lineText.length; i++) {
            const char = lineText[i];
            const prevChar = i > 0 ? lineText[i - 1] : '';
            
            // 处理字符串
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && prevChar !== '\\') {
                inString = false;
                stringChar = '';
            }
            
            // 只在非字符串内计算括号
            if (!inString) {
                if (char === '(') {
                    openParens++;
                } else if (char === ')') {
                    openParens--;
                    if (openParens === 0) {
                        // 找到结束位置，检查后面是否有分号
                        const restOfLine = lineText.substring(i + 1).trim();
                        if (restOfLine.startsWith(';') || restOfLine.length === 0) {
                            return lineNum;
                        }
                    }
                }
            }
        }
        
        lineNum++;
    }
    
    return null; // 未找到结束位置
}

// 删除选中区域内的所有 console.log 语句
async function removeDebugLogs(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection) {
    const startLine = selection.start.line;
    const endLine = selection.end.line;
    
    const edits: vscode.TextEdit[] = [];
    const processedLines = new Set<number>(); // 记录已处理的行，避免重复删除
    
    // 从前往后遍历，找到所有 console.log 语句
    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
        if (processedLines.has(lineNum)) {
            continue;
        }
        
        const line = document.lineAt(lineNum);
        const lineText = line.text;
        
        // 检查是否包含 console.log 开头
        if (!isConsoleLogStart(lineText)) {
            continue;
        }
        
        // 查找 console.log 语句的结束位置
        const endLineNum = findConsoleLogEnd(document, lineNum);
        
        if (endLineNum !== null && endLineNum <= endLine) {
            // 找到完整的 console.log 语句
            const startLineObj = document.lineAt(lineNum);
            const endLineObj = document.lineAt(endLineNum);
            
            // 检查整行是否只有 console.log
            const startTrimmed = startLineObj.text.trim();
            const endTrimmed = endLineObj.text.trim();
            
            if (lineNum === endLineNum) {
                // 单行 console.log
                if (startTrimmed.startsWith('console.') && (startTrimmed.endsWith(';') || startTrimmed.endsWith(')'))) {
                    // 整行删除
                    edits.push(new vscode.TextEdit(startLineObj.rangeIncludingLineBreak, ''));
                } else {
                    // 行内包含其他内容，尝试删除 console.log 部分
                    const consoleLogMatch = lineText.match(/^(\s*)(.*?)(\s*console\.(log|warn|error|info|debug)\s*\([^)]*\)\s*;?\s*)(.*)$/);
                    if (consoleLogMatch) {
                        const before = consoleLogMatch[1] + consoleLogMatch[2];
                        const after = consoleLogMatch[5];
                        const newLine = before + after;
                        if (newLine.trim().length > 0) {
                            edits.push(new vscode.TextEdit(startLineObj.range, newLine));
                        } else {
                            edits.push(new vscode.TextEdit(startLineObj.rangeIncludingLineBreak, ''));
                        }
                    }
                }
            } else {
                // 多行 console.log，删除整个范围
                const startPos = new vscode.Position(lineNum, 0);
                const endPos = new vscode.Position(endLineNum, endLineObj.range.end.character);
                const range = new vscode.Range(startPos, endPos);
                
                // 检查开始行前面是否有其他内容
                const beforeConsole = startLineObj.text.substring(0, startLineObj.text.indexOf('console.'));
                if (beforeConsole.trim().length === 0) {
                    // 整行删除，包括换行符
                    const endLineBreakPos = new vscode.Position(endLineNum, endLineObj.rangeIncludingLineBreak.end.character);
                    const fullRange = new vscode.Range(startPos, endLineBreakPos);
                    edits.push(new vscode.TextEdit(fullRange, ''));
                } else {
                    // 只删除 console.log 部分
                    edits.push(new vscode.TextEdit(range, ''));
                }
                
                // 标记已处理的行
                for (let i = lineNum; i <= endLineNum; i++) {
                    processedLines.add(i);
                }
            }
            
            processedLines.add(lineNum);
        }
    }
    
    if (edits.length > 0) {
        // 从后往前排序，避免行号变化影响
        edits.sort((a, b) => {
            const aStart = a.range.start.line;
            const bStart = b.range.start.line;
            return bStart - aStart;
        });
        
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, edits);
        const success = await vscode.workspace.applyEdit(workspaceEdit);
        if (success) {
            vscode.window.showInformationMessage(`已删除 ${edits.length} 个调试日志`);
        } else {
            vscode.window.showErrorMessage('删除调试日志失败');
        }
    } else {
        vscode.window.showInformationMessage('未找到调试日志');
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('恭喜，您的扩展 "vscode-fast-debug-log" 现在已激活！');

    // 添加调试日志命令
    let addDisposable = vscode.commands.registerCommand('vscode-fast-debug-log.addDebugLog', async () => {
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

        // 弹出输入框让用户输入标签
        const userInput = await vscode.window.showInputBox({
            prompt: '请输入调试标签（可选，留空则只显示序号）',
            placeHolder: '例如: test, debug, check 等',
            validateInput: (value) => {
                // 可以添加验证逻辑，比如限制长度等
                return null; // null 表示验证通过
            }
        });

        // 如果用户取消输入，则退出
        if (userInput === undefined) {
            return;
        }

        // 获取选中的行范围
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        // 获取编辑器配置的缩进设置
        const eol = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';

        // 构建标签文本
        const labelText = userInput.trim() ? ` ${userInput.trim()}` : '';

        // 在每一行的末尾换行插入 debug 语句
        const edits: vscode.TextEdit[] = [];
        let debugIndex = 1; // 序号从1开始
        
        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
            const line = document.lineAt(lineNum);
            const lineText = line.text;
            
            // 检查是否是完整语句
            if (!isCompleteStatement(lineText, document, lineNum)) {
                continue;
            }

            // 获取当前行的缩进（用于保持缩进一致）
            const indentMatch = lineText.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';

            // 生成橘色的 debug 语句，格式：🐞{userInput} 6
            const debugStatement = `${eol}${indent}console.log('%c🐞${labelText} ${debugIndex}', 'color: orange; font-weight: bold');`;
            debugIndex++; // 递增序号

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
            const success = await vscode.workspace.applyEdit(workspaceEdit);
            if (success) {
                vscode.window.showInformationMessage(`已添加 ${edits.length} 个调试日志`);
            } else {
                vscode.window.showErrorMessage('添加调试日志失败');
            }
        } else {
            vscode.window.showWarningMessage('没有可添加调试日志的行');
        }
    });

    // 删除调试日志命令
    let removeDisposable = vscode.commands.registerCommand('vscode-fast-debug-log.removeDebugLog', async () => {
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
            vscode.window.showWarningMessage('请先选择要删除调试日志的代码区域');
            return;
        }

        await removeDebugLogs(editor, document, selection);
    });

    context.subscriptions.push(addDisposable, removeDisposable);
}

export function deactivate() {}
