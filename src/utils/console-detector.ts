/**
 * Console.log 检测工具
 * 用于检测和定位代码中的 console.log 语句
 */

import * as vscode from 'vscode';
import { ConsoleLogRange, ConsoleMethod } from '../types';
import { CONSOLE_METHODS } from '../config/constants';

export class ConsoleDetector {
    /**
     * 检测一行是否包含 console.log 语句的开头
     */
    static isConsoleLogStart(lineText: string): boolean {
        const trimmed = lineText.trim();
        const methods = CONSOLE_METHODS.join('|');
        const consoleLogPattern = new RegExp(`^\\s*console\\.(${methods})\\s*\\(`);
        return consoleLogPattern.test(trimmed);
    }

    /**
     * 从行文本中提取 console 方法名
     */
    static extractConsoleMethod(lineText: string): ConsoleMethod | null {
        const trimmed = lineText.trim();
        for (const method of CONSOLE_METHODS) {
            const pattern = new RegExp(`console\\.${method}\\s*\\(`);
            if (pattern.test(trimmed)) {
                return method;
            }
        }
        return null;
    }

    /**
     * 查找 console.log 语句的结束位置（处理多行情况）
     */
    static findConsoleLogEnd(
        document: vscode.TextDocument,
        startLine: number
    ): number | null {
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
                } else if (
                    inString &&
                    char === stringChar &&
                    prevChar !== '\\'
                ) {
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

    /**
     * 查找选中区域内的所有 console.log 语句范围
     */
    static findConsoleLogs(
        document: vscode.TextDocument,
        startLine: number,
        endLine: number
    ): ConsoleLogRange[] {
        const consoleLogs: ConsoleLogRange[] = [];
        const processedLines = new Set<number>();

        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
            if (processedLines.has(lineNum)) {
                continue;
            }

            const line = document.lineAt(lineNum);
            const lineText = line.text;

            if (!this.isConsoleLogStart(lineText)) {
                continue;
            }

            const method = this.extractConsoleMethod(lineText);
            if (!method) {
                continue;
            }

            const endLineNum = this.findConsoleLogEnd(document, lineNum);

            if (endLineNum !== null && endLineNum <= endLine) {
                consoleLogs.push({
                    startLine: lineNum,
                    endLine: endLineNum,
                    method
                });

                // 标记已处理的行
                for (let i = lineNum; i <= endLineNum; i++) {
                    processedLines.add(i);
                }
            }
        }

        return consoleLogs;
    }
}
