/**
 * 插件常量配置
 */

export const SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact'
] as const;

export const CONSOLE_METHODS = [
    'log',
    'warn',
    'error',
    'info',
    'debug'
] as const;

export const DEBUG_LOG_COLOR = 'orange';
export const DEBUG_LOG_FONT_WEIGHT = 'bold';
export const DEBUG_EMOJI = '🐞';

export const COMMAND_IDS = {
    ADD_DEBUG_LOG: 'vscode-fast-debug-log.addDebugLog',
    REMOVE_DEBUG_LOG: 'vscode-fast-debug-log.removeDebugLog'
} as const;
