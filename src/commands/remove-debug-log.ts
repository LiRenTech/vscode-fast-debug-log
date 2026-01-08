/**
 * 删除调试日志命令
 */

import * as vscode from 'vscode';
import { DebugLogService } from '../services/debug-log-service';
import { EditorValidator } from '../utils/editor-validator';

export class RemoveDebugLogCommand {
    /**
     * 执行删除调试日志命令
     */
    static async execute(): Promise<void> {
        const context = EditorValidator.validateAndGetContext(
            true,
            '请先选择要删除调试日志的代码区域'
        );

        if (!context) {
            return;
        }

        // 删除调试日志
        const count = await DebugLogService.removeDebugLogs(context);

        if (count > 0) {
            vscode.window.showInformationMessage(`已删除 ${count} 个调试日志`);
        } else {
            vscode.window.showInformationMessage('未找到调试日志');
        }
    }
}
