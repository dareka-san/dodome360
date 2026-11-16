#!/bin/bash
set -e

cd -- "$(dirname -- "$0")"

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  export PATH="$HOME/.local/nodejs/current/bin:$PATH"
fi

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  printf '%s\n' 'Node.js と npm が見つかりません。Node.js 24 を使える状態にしてから再実行してください。' >&2
  exit 1
fi

if [ ! -e .git ]; then
  git init -b main
fi

if [ -z "$(git config --get user.name)" ]; then
  git config --local user.name 'Kano Sasaki'
fi

if [ -z "$(git config --get user.email)" ]; then
  git config --local user.email '46549441+dareka-san@users.noreply.github.com'
fi

npm ci
exec npm run dev
