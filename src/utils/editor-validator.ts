/**
 * 编辑器验证工具
 * 用于验证编辑器状态和文件类型
 */

import * as vscode from 'vscode';
import { EditorContext } from '../types';
import { SUPPORTED_LANGUAGES } from '../config/constants';

export class EditorValidator {
    /**
     * 验证编辑器上下文
     */
    static validateEditorContext(): EditorContext | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动的编辑器');
            return null;
        }

        const document = editor.document;
        const selection = editor.selection;

        if (selection.isEmpty) {
            return null;
        }

        return {
            editor,
            document,
            selection
        };
    }

    /**
     * 验证文件类型是否支持
     */
    static validateLanguage(languageId: string): boolean {
        return SUPPORTED_LANGUAGES.includes(
            languageId as typeof SUPPORTED_LANGUAGES[number]
        );
    }

    /**
     * 验证并获取编辑器上下文
     */
    static validateAndGetContext(
        requireSelection: boolean = true,
        customMessage?: string
    ): EditorContext | null {
        const context = this.validateEditorContext();
        if (!context) {
            if (requireSelection) {
                vscode.window.showWarningMessage(
                    customMessage || '请先选择代码区域'
                );
            }
            return null;
        }

        const { document } = context;
        const languageId = document.languageId;

        if (!this.validateLanguage(languageId)) {
            vscode.window.showWarningMessage(
                `当前文件类型 ${languageId} 不支持，仅支持 js, ts, jsx, tsx 文件`
            );
            return null;
        }

        return context;
    }
}
