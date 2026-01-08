/**
 * 类型定义
 */

import * as vscode from 'vscode';

export type SupportedLanguage = 'javascript' | 'typescript' | 'javascriptreact' | 'typescriptreact';
export type ConsoleMethod = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface DebugLogConfig {
    label?: string;
    emoji?: string;
    color?: string;
    fontWeight?: string;
}

export interface StatementRange {
    startLine: number;
    endLine: number;
}

export interface ConsoleLogRange {
    startLine: number;
    endLine: number;
    method: ConsoleMethod;
}

export interface EditorContext {
    editor: vscode.TextEditor;
    document: vscode.TextDocument;
    selection: vscode.Selection;
}
