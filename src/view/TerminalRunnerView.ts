import * as vscode from "vscode";
import * as yaml from "yaml";
import { posix } from 'path';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { randomUUID } from "crypto";

interface CmdFile {
    uri: vscode.Uri,
    content?: Object,
    watcher?: vscode.FileSystemWatcher
}

export class TerminalRunnerView implements vscode.WebviewViewProvider{
    public static readonly viewType = 'terminal-runner.TerminalRunnerView';
	private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];
    private _openingFiles: {[name:string]:vscode.FileSystemWatcher} = {};
    private _assignedTerminals: Map<string, vscode.Terminal> = new Map<string, vscode.Terminal>();
    constructor(
		private readonly _extensionUri: vscode.Uri,
        
	) { }

    resolveWebviewView(
        webviewView: vscode.WebviewView, 
        context: vscode.WebviewViewResolveContext<unknown>, 
        token:  vscode.CancellationToken): void | Thenable<void> {
        
        this._view = webviewView;
        this._view.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'out')]
        };
        this._setWebviewMessageListener();
        webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);
    }

    public dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async _selectCmdFile() {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: true,
            canSelectFolders: false
        };
       
       vscode.window.showOpenDialog(options).then(async fileUri => {
            if (fileUri && fileUri.length > 0) {
                this._loadAndWatchFile(fileUri[0]);
            }
       });
    }

    private async _loadAndWatchFile(uri: vscode.Uri) {
        const content = await this._loadFile(uri);
        if (!this._openingFiles[uri.fsPath]) {
            const watcher = vscode.workspace.createFileSystemWatcher(uri.fsPath);
            watcher.onDidChange(async uri => await this._loadFile(uri));
            this._openingFiles[uri.fsPath] = watcher;
        }
        
    }

    private async _loadFile(uri: vscode.Uri) {
        const fileName = uri.path.substring(uri.path.lastIndexOf('/') + 1);
        let content = undefined;
        let stat = 'success';
        try {
            const readData = await vscode.workspace.fs.readFile(uri);
            const readStr = Buffer.from(readData).toString('utf8');
            content = yaml.parse(readStr);
            vscode.window.showInformationMessage(`Load file: ${fileName} from ${uri.fsPath}`);
        } catch (err) {
            vscode.window.showInformationMessage(`Load file: ${fileName} from ${uri.fsPath} failed with error: ${ err }`);
            stat = 'failed';
        }
        this._view?.webview.postMessage({
            type: "cmd-file-loaded",
            fileName,
            path: uri.fsPath,
            content,
            stat,
        });
        return content;
    }

    private async _initCmdFile() {
        if (!vscode.workspace.workspaceFolders) {
			return vscode.window.showInformationMessage('No folder or workspace opened');
		}
        const folderUri = vscode.workspace.workspaceFolders[0].uri;
        const fileUri = folderUri.with({ path: posix.join(folderUri.path, 'cmd.yaml') });
        this._loadAndWatchFile(fileUri);
    }

    private _getCurrentOrCreateTerm() {
		return vscode.window.activeTerminal || vscode.window.createTerminal();
	}

    private _getTerminal(terminalId?: string): vscode.Terminal {
        if (terminalId) {
            if (!this._assignedTerminals.get(terminalId) || !!this._assignedTerminals.get(terminalId)?.exitStatus) {
                this._assignedTerminals.set(terminalId, vscode.window.createTerminal(terminalId));
            }
            return this._assignedTerminals.get(terminalId);
        }
        return this._getCurrentOrCreateTerm();
    }

    private _handleRunCmd(message) {
        vscode.window.showInformationMessage(message.text);
        const terminal = this._getTerminal(message.terminalId);
        console.log(terminal);
        terminal.show();
        console.log(message);
        if (message.path) {
            terminal.sendText(`cd ${message.path}`, true);
        }
        terminal.sendText(message.text, true);
    }

    private _setWebviewMessageListener() {
        this._view?.webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const text = message.text;

                switch (command) {
                    case "webwiew-ready":
                        this._initCmdFile();
                        return;
                    case "run-cmd-in-current-term":
                        vscode.window.showInformationMessage(text);
                        this._getCurrentOrCreateTerm().sendText(message.text, true);
                        return;
                    case "run-cmd":
                        this._handleRunCmd(message);
                        return;
                    case "open-new-file":
                        this._selectCmdFile();
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
        const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);
        const nonce = getNonce();
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${styleUri}">
                <title>Terminal Runner</title>
            </head>
            <body>
                <div id="root">
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                </script>
                <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
            </body>
            <!--
            <body>
                <div>
                <vscode-dropdown id="J_openingFileList">
                </vscode-dropdown>
                <vscode-button id="J_openNewFile">+</vscode-button>
                </div>
                <div id="J_cmdList">
                </div>
                <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
            </body>
            -->
            </html>
        `;
    }
}