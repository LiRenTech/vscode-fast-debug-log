# 🐞 Fast Debug Log

一个高效的 VSCode 扩展，用于快速添加和删除调试日志语句。

## ✨ 功能特性

- 🚀 **快速添加调试日志**：一键在选中代码区域添加带序号的调试日志
- 🗑️ **快速删除调试日志**：一键删除选中区域内的所有 console.log 语句
- 🎨 **橘色高亮输出**：使用橘色样式突出显示调试信息
- 🏷️ **自定义标签**：支持为调试日志添加自定义标签
- 📝 **智能检测**：自动跳过注释、空行和不完整语句
- 🔧 **多文件类型支持**：支持 JavaScript、TypeScript、JSX、TSX 文件

## 📦 安装

### 从 VSIX 安装

1. 下载最新的 `.vsix` 文件
2. 在 VSCode 中按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
3. 输入 `Extensions: Install from VSIX...`
4. 选择下载的 `.vsix` 文件

### 从源码构建

```bash
# 克隆仓库
git clone <repository-url>
cd vscode-fast-debug-log

# 安装依赖
pnpm install

# 编译 TypeScript
pnpm run compile

# 打包为 VSIX 文件
# 首先安装 vsce（如果还没有安装）
pnpm install -g vsce
# 或者使用 npm: npm install -g vsce

# 打包扩展
vsce package

# 打包完成后会生成 vscode-fast-debug-log-0.0.1.vsix 文件
# 可以使用上述"从 VSIX 安装"的方法安装该文件
```

## 🚀 使用方法

### 添加调试日志

1. 在代码文件中选中要添加调试日志的代码区域
2. 右键点击，选择 **🐞 fast-add-debug-log**
3. 在弹出的输入框中输入标签（可选，留空则只显示序号）
4. 确认后，插件会在每一行完整语句后添加调试日志

**示例：**

```typescript
// 选中以下代码
const name = "test";
const age = 20;
if (age > 18) {
  console.log("Adult");
}

// 输入标签 "test" 后，变成：
const name = "test";
  console.log('%c🐞 test 1', 'color: orange; font-weight: bold');
const age = 20;
  console.log('%c🐞 test 2', 'color: orange; font-weight: bold');
if (age > 18) {
  console.log('%c🐞 test 3', 'color: orange; font-weight: bold');
  console.log("Adult");
}
```

### 删除调试日志

1. 选中包含调试日志的代码区域
2. 右键点击，选择 **🗑️ fast-remove-debug-log**
3. 插件会自动删除选中区域内的所有 console.log 语句

## 🎯 支持的文件类型

- JavaScript (`.js`)
- TypeScript (`.ts`)
- JavaScript React (`.jsx`)
- TypeScript React (`.tsx`)

## 🔍 智能特性

### 自动跳过

插件会自动跳过以下情况，不会添加调试日志：

- 空行
- 注释行（`//`、`/*`、`*`）
- 只包含大括号的行（`{`、`}`）
- 多行语句的中间行（如函数调用的参数行）

### 示例

```typescript
// 选中以下代码
const result = Math.floor(
  (value % 1000) / 100
);

// 插件会智能识别，只在完整语句后添加日志：
const result = Math.floor(
  (value % 1000) / 100
);
  console.log('%c🐞 1', 'color: orange; font-weight: bold');
```

## 🛠️ 开发

### 项目结构

```
src/
├── extension.ts              # 主入口文件
├── config/
│   └── constants.ts         # 常量配置
├── types/
│   └── index.ts             # 类型定义
├── utils/
│   ├── statement-detector.ts    # 语句检测工具
│   ├── console-detector.ts      # Console.log 检测工具
│   └── editor-validator.ts      # 编辑器验证工具
├── services/
│   └── debug-log-service.ts     # 核心服务
└── commands/
    ├── add-debug-log.ts          # 添加命令
    └── remove-debug-log.ts       # 删除命令
```

### 开发命令

```bash
# 安装依赖
pnpm install

# 编译 TypeScript
pnpm run compile

# 监听模式（自动编译）
pnpm run watch

# 打包扩展为 VSIX 文件
# 确保已安装 vsce: pnpm install -g vsce
vsce package

# 打包完成后会生成 vscode-fast-debug-log-0.0.1.vsix 文件
# 文件位置：项目根目录下
```

### 调试

1. 按 `F5` 打开新的扩展开发宿主窗口
2. 在新窗口中测试插件功能
3. 使用调试控制台查看日志输出

## 📝 命令列表

| 命令 | 描述 |
|------|------|
| `🐞 fast-add-debug-log` | 在选中区域添加调试日志 |
| `🗑️ fast-remove-debug-log` | 删除选中区域的调试日志 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 🙏 致谢

感谢使用 Fast Debug Log 扩展！
