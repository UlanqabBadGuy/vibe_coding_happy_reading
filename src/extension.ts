import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import mammoth from 'mammoth';
import * as jschardet from 'jschardet';
import * as iconv from 'iconv-lite';

interface ReaderState {
  filePath: string;
  scrollTop: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  theme: string;
  chapterIndex: number;
}

let currentPanel: vscode.WebviewPanel | undefined;
let currentFilePath: string | undefined;
let currentFileName: string | undefined;
let sidebarProvider!: ReaderSidebarProvider;

export function activate(context: vscode.ExtensionContext) {
  const openReader = vscode.commands.registerCommand('graybox.openReader', () => {
    openReaderPanel(context, undefined);
  });

  const openReaderWithFile = vscode.commands.registerCommand('graybox.openReaderWithFile', (uri?: vscode.Uri) => {
    openReaderPanel(context, uri?.fsPath);
  });

  sidebarProvider = new ReaderSidebarProvider(context);
  const treeDisposable = vscode.window.registerTreeDataProvider('grayboxReaderSidebar', sidebarProvider);

  context.subscriptions.push(openReader, openReaderWithFile, treeDisposable);
}

async function openReaderPanel(context: vscode.ExtensionContext, filePath?: string) {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Two);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'grayboxReader',
      '📖 灰盒子阅读',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'media'))
        ]
      }
    );

    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
      currentFilePath = undefined;
      currentFileName = undefined;
    });
  }

  const htmlPath = path.join(context.extensionPath, 'media', 'reader.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');

  const nonce = getNonce();
  html = html.replace(/\$\{cspNonce\}/g, nonce);
  html = html.replace(/\$\{webviewCspSource\}/g, currentPanel.webview.cspSource);

  currentPanel.webview.html = html;

  currentPanel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'pickFile':
          try {
            const files = await vscode.window.showOpenDialog({
              canSelectMany: false,
              filters: { '小说文件': ['txt', 'docx'] },
              title: '选择小说文件（支持 TXT / Word）'
            });
            if (files && files.length > 0 && currentPanel) {
              const fp = files[0].fsPath;
              const ext = path.extname(fp).toLowerCase();
              const fname = path.basename(fp);
              let content: string;

              if (ext === '.docx') {
                const result = await mammoth.extractRawText({ path: fp });
                content = result.value;
              } else {
                content = readTextFile(fp);
              }

              currentFilePath = fp;
              currentFileName = fname;
              context.workspaceState.update('readerLastFile', { path: fp, name: fname });
              sidebarProvider.refresh();

              currentPanel.webview.postMessage({
                command: 'fileLoaded',
                content: content,
                fileName: fname,
                filePath: fp
              });
            }
          } catch (err: any) {
            if (currentPanel) {
              currentPanel.webview.postMessage({
                command: 'error',
                message: '文件读取失败: ' + (err.message || String(err))
              });
            }
          }
          break;

        case 'saveState':
          await context.workspaceState.update('readerState', message.state);
          break;

        case 'loadState':
          const saved = context.workspaceState.get('readerState') as ReaderState | undefined;
          if (currentPanel) {
            currentPanel.webview.postMessage({
              command: 'stateLoaded',
              state: saved || null
            });
          }
          break;
      }
    },
    undefined,
    context.subscriptions
  );

  if (filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const fname = path.basename(filePath);
      let content: string;

      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        content = result.value;
      } else {
        content = readTextFile(filePath);
      }

      currentFilePath = filePath;
      currentFileName = fname;
      context.workspaceState.update('readerLastFile', { path: filePath, name: fname });
      sidebarProvider.refresh();

      currentPanel.webview.postMessage({
        command: 'fileLoaded',
        content: content,
        fileName: fname,
        filePath: filePath
      });
    } catch (err: any) {
      if (currentPanel) {
        currentPanel.webview.postMessage({
          command: 'error',
          message: '文件读取失败: ' + (err.message || String(err))
        });
      }
    }
  }
}

class ReaderSidebarProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {
    const last = context.workspaceState.get('readerLastFile') as { path: string; name: string } | undefined;
    if (last) {
      currentFilePath = last.path;
      currentFileName = last.name;
    }
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];

    const openItem = new vscode.TreeItem('📖 打开灰盒子阅读器', vscode.TreeItemCollapsibleState.None);
    openItem.command = { command: 'graybox.openReader', title: '打开灰盒子阅读器' };
    openItem.tooltip = '点击打开小说阅读面板';
    items.push(openItem);

    if (currentFilePath && currentFileName) {
      const lastItem = new vscode.TreeItem('📄 继续阅读: ' + currentFileName, vscode.TreeItemCollapsibleState.None);
      lastItem.command = { command: 'graybox.openReader', title: '继续阅读' };
      lastItem.tooltip = '继续上次阅读: ' + currentFilePath;
      lastItem.description = '点击继续';
      items.push(lastItem);
    }

    return items;
  }
}

function readTextFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length === 0) {
    return '';
  }

  const detected = jschardet.detect(buffer);

  if (detected.encoding && detected.confidence > 0.6) {
    const norm = normalizeEncoding(detected.encoding);
    if (norm === 'utf-8') {
      return buffer.toString('utf-8');
    }
    try {
      const result = iconv.decode(buffer, norm);
      if (isReadableText(result)) {
        return result;
      }
    } catch {}
  }

  try {
    const utf8 = buffer.toString('utf-8');
    if (isReadableText(utf8)) {
      return utf8;
    }
  } catch {}

  for (const enc of ['gbk', 'gb2312', 'gb18030', 'big5', 'utf-16le', 'utf-16be']) {
    try {
      const result = iconv.decode(buffer, enc);
      if (isReadableText(result)) {
        return result;
      }
    } catch {}
  }

  return buffer.toString('utf-8');
}

function normalizeEncoding(enc: string): string {
  const lower = enc.toLowerCase().replace(/[_-]/g, '');
  const map: Record<string, string> = {
    'ascii': 'utf-8',
    'utf8': 'utf-8',
    'gb2312': 'gbk',
    'gb18030': 'gbk',
    'windows1252': 'utf-8',
    'iso88591': 'utf-8',
  };
  return map[lower] || lower;
}

function isReadableText(text: string): boolean {
  if (text.length === 0) return false;
  const sample = text.slice(0, 500);
  const mojibake = sample.split('').filter(c => {
    const cp = c.codePointAt(0) || 0;
    return cp >= 0xFFFD && cp <= 0xFFFF;
  }).length;
  if (mojibake > sample.length * 0.1) return false;
  const hasChinese = /[\u4e00-\u9fff]/.test(sample);
  const hasNormalChars = /[a-zA-Z0-9\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s\p{P}]/u.test(sample);
  if (hasChinese) return true;
  return hasNormalChars;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 64; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}