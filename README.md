# katherine-website

## Git 提交脚本与模板

- 快速提交脚本：`./scripts/git-commit.sh`
  - 用法：`./scripts/git-commit.sh -m "提交说明" [-t type] [-s scope]`
  - 常见 `type`：`feat`、`fix`、`chore`、`docs`、`refactor`、`perf`、`test`、`build`、`ci`
  - 示例：
    - `./scripts/git-commit.sh -m "更新配置" -t chore`
    - `./scripts/git-commit.sh -m "修复启动崩溃" -t fix -s startup`

- 提交模板（可选）：`.gitmessage`
  - 启用：`git config commit.template .gitmessage`
  - 之后可直接运行 `git commit`，编辑器会加载模板结构