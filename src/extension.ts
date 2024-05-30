// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { exec } from "child_process";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("public.helloWorld", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const repoPath = workspaceFolders?.[0].uri.fsPath;
    const command = "git branch -a";

    vscode.window.showInformationMessage("Hello World from public!");
    const stdout = await execAsync(command, { cwd: repoPath });
    const branches = stdout
      .toString()
      .split("\n")
      .filter((branch) => branch !== "");

    vscode.window.createTreeView("gitBranchesExplorer", {
      treeDataProvider: new GitBranchesProvider(branches),
    });
  });

  let branchClicked = vscode.commands.registerCommand("public.branch.click", (branch) => {
    let workspacePath = vscode.workspace.rootPath;
    exec(`git checkout ${branch}`, { cwd: workspacePath }, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage("Failed to checkout branch: " + err.message);
        return;
      }
      // 刷新终端
      if (vscode.window.activeTerminal) {
        vscode.window.activeTerminal.sendText("");
      }
    });
  });

  context.subscriptions.push(branchClicked);
  context.subscriptions.push(disposable);
}

export function deactivate() {}

function execAsync(command: string, options: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout);
    });
  });
}

// 树状视图类
class GitBranchesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> =
    new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private branches: string[]) {
    this.branches = branches;
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (element) {
      // 如果点击了一个分支，这里可以提供进一步的子节点或者操作
      return Promise.resolve([]);
    } else {
      // 把每个分支字符串转换成一个TreeItem
      return Promise.resolve(
        this.branches.map((branch) => {
          const tree = new vscode.TreeItem(branch);
          tree.command = {
            title: "branch-click",
            command: "public.branch.click",
            arguments: [branch],
          };
          return tree;
        })
      );
    }
  }

  // 调用这个方法来刷新树视图
  refresh(branches: string[]) {
    this.branches = branches;
    this._onDidChangeTreeData.fire();
  }
}
