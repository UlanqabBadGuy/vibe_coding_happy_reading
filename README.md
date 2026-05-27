# 灰盒子阅读器

<p align="center">
  <img src="media/logo.png" alt="灰盒子阅读器 Logo" width="128" height="128">
</p>

<p align="center">
  <strong>专为 Vibe Coding 等待中的程序员打造的 VS Code 阅读器插件</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-%5E1.74.0-blue?logo=visual-studio-code" alt="VS Code Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## ✨ 功能特性

- **📖 多格式支持**：支持 TXT、DOCX 格式的小说文件导入阅读
- **🎨 精美主题**：4 套精心设计的阅读主题（羊皮纸 / 纯白 / 护眼绿 / 夜间模式）
- **📐 自由排版**：支持调整字体大小、行间距，打造最舒适的阅读体验
- **🔤 智能编码**：自动检测 TXT 文件编码（UTF-8、GBK、GB2312、Big5 等），告别乱码
- **📑 章节导航**：自动识别章节，快速跳转
- **📌 阅读进度**：自动保存阅读进度，下次打开自动恢复
- **⌨️ 快捷键**：`Cmd+Shift+R`（Mac）/ `Ctrl+Shift+R`（Windows/Linux）一键打开阅读器

---

## 📸 界面预览

> 插件安装后，点击左侧活动栏的 📖 图标即可打开阅读器侧边栏。

---

## 🚀 安装方法

### 方式一：从 VSIX 安装

1. 下载 `graybox-0.0.1.vsix`
2. 打开 VS Code，按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows/Linux）
3. 输入并选择 `Extensions: Install from VSIX...`
4. 选择下载的 `.vsix` 文件
5. 安装完成后重启 VS Code

### 方式二：从 VS Code 市场安装（推荐）

> 待发布到 VS Code 市场后，可直接在扩展面板搜索 "灰盒子阅读器" 安装。

---

## 📖 使用指南

### 打开阅读器

- **快捷键**：`Cmd+Shift+R`（Mac）/ `Ctrl+Shift+R`（Windows/Linux）
- **侧边栏**：点击左侧活动栏的 📖 图标
- **命令面板**：`Cmd+Shift+P` → 输入 "打开灰盒子阅读器"

### 导入小说

1. 在阅读器界面点击 **"选择文件"**
2. 选择本地 `.txt` 或 `.docx` 文件
3. 开始阅读！

### 阅读设置

| 功能 | 操作 |
|------|------|
| 调整字体大小 | 点击 "A+" / "A-" 按钮 |
| 切换主题 | 点击主题按钮（羊皮纸 / 纯白 / 护眼绿 / 夜间） |
| 调整行间距 | 使用行间距滑块 |
| 章节跳转 | 点击章节列表中的章节标题 |

---

## 🛠️ 技术栈

- **TypeScript**：插件核心逻辑
- **VS Code Extension API**：Webview、TreeView、Commands
- **Mammoth.js**：DOCX 文件解析
- **jschardet + iconv-lite**：编码自动检测与转换

---

## 📄 许可证

[MIT](LICENSE)

---

<p align="center">
  用 ❤️ 为等待编译的程序员打造
</p>