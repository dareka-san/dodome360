#!/bin/bash
set -euo pipefail

cd -- "$(dirname -- "$0")"
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"
export GH_HOST=github.com

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

owner=dareka-san
project=${PWD##*/}
[[ "$project" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]] ||
  fail 'テンプレートをコピーし、英数字で始まるプロジェクト名を付けてください。'
[[ ! "$project" =~ ^[aA][sS][sS][eE][tT][sS]$ ]] ||
  fail 'assets は共通アセット用のリポジトリです。'

command -v gh >/dev/null || fail 'GitHub CLI が必要です。ターミナルで brew install gh を実行してください。'
login=$(gh api --hostname github.com user --jq .login) ||
  fail 'gh auth login --hostname github.com --web --git-protocol https --scopes workflow を実行してください。'
[[ "$login" == "$owner" ]] || fail "GitHub CLI で $owner に切り替えてください。現在のアカウントは $login です。"

[[ -e .git && $(git branch --show-current) == main ]] ||
  fail 'start-dev.command で Git を初期化し、main ブランチを開いてください。'
commit=$(git rev-parse --verify HEAD 2>/dev/null) ||
  fail 'VS Code のソース管理で初回コミットを作ってください。'
[[ -z $(git status --porcelain) ]] ||
  fail '変更が残っています。VS Code で公開する内容をコミットしてから再実行してください。'
git cat-file -e HEAD:.github/workflows/pages.yml 2>/dev/null ||
  fail '.github/workflows/pages.yml をコミットに含めてください。'

repo="$owner/$project"
remote="https://github.com/$repo.git"
configured_remote=$(git remote get-url --push origin 2>/dev/null || true)
case "$configured_remote" in
  ""|"$remote"|"https://github.com/$repo") ;;
  *) fail "origin の push 先が $repo と異なります。" ;;
esac

printf '公開先: https://github.com/%s\n' "$repo"
if ! gh repo view "$repo" --json visibility >/dev/null 2>&1; then
  gh repo create "$repo" --public
fi
visibility=$(gh repo view "$repo" --json visibility --jq .visibility)
[[ "$visibility" == PUBLIC ]] || fail "$repo は公開リポジトリではありません。"

pages_api="repos/$repo/pages"
if page_type=$(gh api --hostname github.com "$pages_api" --jq .build_type 2>/dev/null); then
  [[ "$page_type" == workflow ]] || fail '既存の Pages の公開元を Settings → Pages で GitHub Actions に変更してください。'
else
  gh api --hostname github.com --method POST "$pages_api" -f build_type=workflow >/dev/null
fi

if [[ -z "$configured_remote" ]]; then
  git remote add origin "$remote"
fi

if ! GIT_TERMINAL_PROMPT=0 git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin main; then
  fail 'push に失敗しました。workflow 権限のエラーなら gh auth refresh --hostname github.com --scopes workflow を実行してください。'
fi

printf '%s\n' 'GitHub Actions の実行を待っています…'
run_id=
for ((attempt = 0; attempt < 20; attempt++)); do
  run_id=$(gh run list --repo "$repo" --workflow pages.yml --branch main --commit "$commit" \
    --limit 1 --json databaseId --jq '.[0].databaseId // empty' 2>/dev/null) || run_id=
  [[ -z "$run_id" ]] || break
  sleep 3
done
[[ -n "$run_id" ]] || fail "実行が見つかりません。https://github.com/$repo/actions を確認してください。"
if ! gh run watch "$run_id" --repo "$repo" --exit-status; then
  fail "公開に失敗しました。https://github.com/$repo/actions/runs/$run_id を確認してください。"
fi

url=$(gh api --hostname github.com "$pages_api" --jq .html_url)
for ((attempt = 0; attempt < 20; attempt++)); do
  if curl -fsS --max-time 5 -o /dev/null "$url"; then
    printf '公開 URL: %s\n' "$url"
    open "$url"
    exit 0
  fi
  sleep 3
done
fail "デプロイは成功しましたが、公開 URL の応答を確認できませんでした。$url"
