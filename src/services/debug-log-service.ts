/**
 * 调试日志服务
 * 提供添加和删除调试日志的核心功能
 */

import * as vscode from 'vscode';
import { DebugLogConfig, EditorContext, StatementRange, ConsoleLogRange } from '../types';
import { StatementDetector } from '../utils/statement-detector';
import { ConsoleDetector } from '../utils/console-detector';
import {
    DEBUG_EMOJI,
    DEBUG_LOG_COLOR,
    DEBUG_LOG_FONT_WEIGHT
} from '../config/constants';

export class DebugLogService {
    /**
     * 添加调试日志
     */
    static async addDebugLogs(
        context: EditorContext,
        config: DebugLogConfig
    ): Promise<boolean> {
        const { document, selection } = context;
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        const eol = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
        const labelText = config.label ? ` ${config.label}` : '';
        const emoji = config.emoji || DEBUG_EMOJI;
        const color = config.color || DEBUG_LOG_COLOR;
        const fontWeight = config.fontWeight || DEBUG_LOG_FONT_WEIGHT;

        // 获取所有完整语句
        const statements = StatementDetector.getCompleteStatements(
            document,
            startLine,
            endLine
        );

        if (statements.length === 0) {
            return false;
        }

        const edits: vscode.TextEdit[] = [];
        let debugIndex = 1;

        for (const statement of statements) {
            const line = document.lineAt(statement.startLine);
            const indentMatch = line.text.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';

            // 生成调试语句
            const debugStatement = this.generateDebugStatement(
                emoji,
                labelText,
                debugIndex,
                color,
                fontWeight,
                indent,
                eol
            );

            const lineEndPosition = line.range.end;
            edits.push(
                new vscode.TextEdit(
                    new vscode.Range(lineEndPosition, lineEndPosition),
                    debugStatement
                )
            );

            debugIndex++;
        }

        // 应用编辑（从后往前应用）
        if (edits.length > 0) {
            edits.reverse();
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, edits);
            const success = await vscode.workspace.applyEdit(workspaceEdit);
            return success;
        }

        return false;
    }

    /**
     * 删除调试日志
     */
    static async removeDebugLogs(
        context: EditorContext
    ): Promise<number> {
        const { document, selection } = context;
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        // 查找所有 console.log 语句
        const consoleLogs = ConsoleDetector.findConsoleLogs(
            document,
            startLine,
            endLine
        );

        if (consoleLogs.length === 0) {
            return 0;
        }

        const edits: vscode.TextEdit[] = [];

        // 从后往前处理，避免行号变化影响
        for (let i = consoleLogs.length - 1; i >= 0; i--) {
            const logRange = consoleLogs[i];
            const edit = this.createDeleteEdit(document, logRange);
            if (edit) {
                edits.push(edit);
            }
        }

        if (edits.length > 0) {
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, edits);
            const success = await vscode.workspace.applyEdit(workspaceEdit);
            return success ? edits.length : 0;
        }

        return 0;
    }

    /**
     * 生成调试语句
     */
    private static generateDebugStatement(
        emoji: string,
        labelText: string,
        index: number,
        color: string,
        fontWeight: string,
        indent: string,
        eol: string
    ): string {
        return `${eol}${indent}console.log('%c${emoji}${labelText} ${index}', 'color: ${color}; font-weight: ${fontWeight}');`;
    }

    /**
     * 创建删除编辑
     */
    private static createDeleteEdit(
        document: vscode.TextDocument,
        logRange: ConsoleLogRange
    ): vscode.TextEdit | null {
        const startLineObj = document.lineAt(logRange.startLine);
        const endLineObj = document.lineAt(logRange.endLine);

        if (logRange.startLine === logRange.endLine) {
            // 单行 console.log
            const trimmed = startLineObj.text.trim();
            if (
                trimmed.startsWith('console.') &&
                (trimmed.endsWith(';') || trimmed.endsWith(')'))
            ) {
                // 整行删除
                return new vscode.TextEdit(
                    startLineObj.rangeIncludingLineBreak,
                    ''
                );
            } else {
                // 行内包含其他内容，尝试删除 console.log 部分
                const consoleLogMatch = startLineObj.text.match(
                    /^(\s*)(.*?)(\s*console\.(log|warn|error|info|debug)\s*\([^)]*\)\s*;?\s*)(.*)$/
                );
                if (consoleLogMatch) {
                    const before = consoleLogMatch[1] + consoleLogMatch[2];
                    const after = consoleLogMatch[5];
                    const newLine = before + after;
                    if (newLine.trim().length > 0) {
                        return new vscode.TextEdit(startLineObj.range, newLine);
                    } else {
                        return new vscode.TextEdit(
                            startLineObj.rangeIncludingLineBreak,
                            ''
                        );
                    }
                }
            }
        } else {
            // 多行 console.log
            const startPos = new vscode.Position(logRange.startLine, 0);
            const beforeConsole = startLineObj.text.substring(
                0,
                startLineObj.text.indexOf('console.')
            );

            if (beforeConsole.trim().length === 0) {
                // 整行删除，包括换行符
                const endLineBreakPos = new vscode.Position(
                    logRange.endLine,
                    endLineObj.rangeIncludingLineBreak.end.character
                );
                const fullRange = new vscode.Range(startPos, endLineBreakPos);
                return new vscode.TextEdit(fullRange, '');
            } else {
                // 只删除 console.log 部分
                const endPos = new vscode.Position(
                    logRange.endLine,
                    endLineObj.range.end.character
                );
                const range = new vscode.Range(startPos, endPos);
                return new vscode.TextEdit(range, '');
            }
        }

        return null;
    }
}
