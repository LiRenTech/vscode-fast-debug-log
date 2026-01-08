/**
 * 添加调试日志命令
 */

import * as vscode from 'vscode';
import { DebugLogService } from '../services/debug-log-service';
import { EditorValidator } from '../utils/editor-validator';

export class AddDebugLogCommand {
    /**
     * 执行添加调试日志命令
     */
    static async execute(): Promise<void> {
        const context = EditorValidator.validateAndGetContext(
            true,
            '请先选择要添加调试日志的代码区域'
        );

        if (!context) {
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

        // 构建配置
        const config = {
            label: userInput.trim() || undefined
        };

        // 添加调试日志
        const success = await DebugLogService.addDebugLogs(context, config);

        if (success) {
            vscode.window.showInformationMessage('调试日志添加成功');
        } else {
            vscode.window.showWarningMessage('没有可添加调试日志的行');
        }
    }
}
