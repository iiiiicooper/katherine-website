#!/usr/bin/env bash
set -euo pipefail

# Simple reusable Git commit helper.
# Usage:
#   ./scripts/git-commit.sh -m "message" [-t type] [-s scope]
# Examples:
#   ./scripts/git-commit.sh -m "更新配置" -t chore
#   ./scripts/git-commit.sh -m "修复初始化崩溃" -t fix -s startup

usage() {
  echo "Usage: $0 -m \"message\" [-t type] [-s scope]"
  echo "Types: feat, fix, chore, docs, style, refactor, perf, test, build, ci"
  exit 1
}

TYPE="chore"
SCOPE=""
MESSAGE=""

while getopts ":t:s:m:" opt; do
  case $opt in
    t) TYPE="$OPTARG" ;;
    s) SCOPE="$OPTARG" ;;
    m) MESSAGE="$OPTARG" ;;
    *) usage ;;
  esac
done

if [[ -z "$MESSAGE" ]]; then
  usage
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "当前目录不是 Git 仓库"
  exit 1
fi

# Stage all changes
git add -A

# If nothing staged, exit
if git diff --cached --quiet; then
  echo "没有需要提交的改动"
  exit 0
fi

SUBJECT="$TYPE"
if [[ -n "$SCOPE" ]]; then
  SUBJECT+="($SCOPE)"
fi
SUBJECT+=": $MESSAGE"

git commit -m "$SUBJECT"

branch=$(git rev-parse --abbrev-ref HEAD)
echo "推送到 origin/$branch..."
git push origin "$branch"
echo "完成：$SUBJECT"