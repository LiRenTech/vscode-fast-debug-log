/**
 * VSCode 扩展主入口文件
 */

import * as vscode from 'vscode';
import { COMMAND_IDS } from './config/constants';
import { AddDebugLogCommand } from './commands/add-debug-log';
import { RemoveDebugLogCommand } from './commands/remove-debug-log';

export function activate(context: vscode.ExtensionContext) {
    console.log('恭喜，您的扩展 "vscode-fast-debug-log" 现在已激活！');

    // 注册添加调试日志命令
    const addDisposable = vscode.commands.registerCommand(
        COMMAND_IDS.ADD_DEBUG_LOG,
        () => AddDebugLogCommand.execute()
    );

    // 注册删除调试日志命令
    const removeDisposable = vscode.commands.registerCommand(
        COMMAND_IDS.REMOVE_DEBUG_LOG,
        () => RemoveDebugLogCommand.execute()
    );

    context.subscriptions.push(addDisposable, removeDisposable);
}

export function deactivate() {}
