/**
 * 语句检测工具
 * 用于检测代码行是否是完整语句
 */

import * as vscode from 'vscode';
import { StatementRange } from '../types';

export class StatementDetector {
    /**
     * 检测是否是完整语句（不是多行语句的一部分）
     */
    static isCompleteStatement(
        lineText: string,
        document: vscode.TextDocument,
        lineNum: number
    ): boolean {
        const trimmed = lineText.trim();

        // 跳过空行
        if (trimmed.length === 0) {
            return false;
        }

        // 跳过注释行
        if (this.isCommentLine(trimmed)) {
            return false;
        }

        // 跳过只包含大括号的行
        if (this.isBraceOnlyLine(trimmed)) {
            return false;
        }

        // 如果以分号或右花括号结尾，通常是完整语句
        if (trimmed.endsWith(';') || trimmed.endsWith('}')) {
            return true;
        }

        // 检查是否是未完成的语句
        if (this.isIncompleteStatement(trimmed, document, lineNum)) {
            return false;
        }

        // 检查是否是模板字符串的中间行
        if (this.isTemplateStringMiddleLine(lineText, document, lineNum)) {
            return false;
        }

        // 其他情况，如果下一行是空行或注释，认为是完整的
        if (lineNum < document.lineCount - 1) {
            const nextLine = document.lineAt(lineNum + 1).text.trim();
            if (nextLine.length === 0 || this.isCommentLine(nextLine)) {
                return true;
            }
        } else {
            // 最后一行，认为是完整的
            return true;
        }

        // 默认认为是完整的（保守策略）
        return true;
    }

    /**
     * 检测是否是注释行
     */
    private static isCommentLine(trimmed: string): boolean {
        return (
            trimmed.startsWith('//') ||
            trimmed.startsWith('/*') ||
            trimmed.startsWith('*')
        );
    }

    /**
     * 检测是否是只包含大括号的行
     */
    private static isBraceOnlyLine(trimmed: string): boolean {
        return (
            trimmed === '}' ||
            trimmed === '{' ||
            trimmed === '};' ||
            trimmed === '{;'
        );
    }

    /**
     * 检测是否是未完成的语句
     */
    private static isIncompleteStatement(
        trimmed: string,
        document: vscode.TextDocument,
        lineNum: number
    ): boolean {
        const incompletePatterns = [
            /,\s*$/,           // 逗号结尾
            /\(\s*$/,          // 左括号结尾
            /\[\s*$/,          // 左方括号结尾
            /\.\s*$/,          // 点号结尾（链式调用）
            /[+\-*/%]\s*$/,    // 运算符结尾
            /&&\s*$/,          // 逻辑与
            /\|\|\s*$/,        // 逻辑或
            /\?\s*$/,          // 三元运算符
            /:\s*$/,           // 冒号
            /=\s*$/,           // 赋值
        ];

        for (const pattern of incompletePatterns) {
            if (pattern.test(trimmed)) {
                // 检查下一行是否存在且不是注释或空行
                if (lineNum < document.lineCount - 1) {
                    const nextLine = document.lineAt(lineNum + 1).text.trim();
                    if (
                        nextLine.length > 0 &&
                        !this.isCommentLine(nextLine)
                    ) {
                        return true; // 可能是未完成的语句
                    }
                }
            }
        }

        return false;
    }

    /**
     * 检测是否是模板字符串的中间行
     */
    private static isTemplateStringMiddleLine(
        lineText: string,
        document: vscode.TextDocument,
        lineNum: number
    ): boolean {
        const backtickCount = (lineText.match(/`/g) || []).length;
        if (backtickCount % 2 !== 0 && lineNum < document.lineCount - 1) {
            // 奇数个反引号，可能是未闭合的模板字符串
            const nextLine = document.lineAt(lineNum + 1).text.trim();
            if (nextLine.length > 0 && !nextLine.startsWith('//')) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取选中区域内的所有完整语句范围
     */
    static getCompleteStatements(
        document: vscode.TextDocument,
        startLine: number,
        endLine: number
    ): StatementRange[] {
        const statements: StatementRange[] = [];

        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
            const line = document.lineAt(lineNum);
            if (this.isCompleteStatement(line.text, document, lineNum)) {
                statements.push({
                    startLine: lineNum,
                    endLine: lineNum
                });
            }
        }

        return statements;
    }
}
