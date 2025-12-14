# 同步远端分支与避免冲突的步骤

当前仓库没有配置远端地址，无法直接 `git pull` 获取你线上最新的代码。要基于最新分支开发并避免合并冲突，请先完成以下操作：

1. 添加远端：
   ```bash
   git remote add origin <你的仓库地址>
   ```

2. 拉取最新基线（假设目标分支为 main，可按需替换）：
   ```bash
   git fetch origin
   git checkout -B work origin/main
   ```
   上述命令会把本地 `work` 分支重置到远端 `main` 的最新提交。

3. 之后在 `work` 分支进行开发，提交前可再次执行 `git fetch origin` 并 `git rebase origin/main`，确保与最新代码对齐，减少 PR 冲突。

> 如果远端分支名称不同，请将命令中的 `main` 替换为实际分支名。
