# DevProject の Astro テンプレート

## 新しいプロジェクトを始める

1. `DevProject/_template` フォルダをコピーします。
2. コピーを `DevProject` 直下に置きます。
3. コピーしたフォルダにプロジェクト名を付けます。GitHub リポジトリにも同じ名前を使います。
4. コピー先の `start-dev.command` を Finder でダブルクリックします。Node.js 24 が使える環境で、ローカル Git の初期化、`npm ci`、`npm run dev` を順に実行します。

Git の作者名やメールアドレスが未設定の場合は、`Kano Sasaki` と `dareka-san` の GitHub `noreply` アドレスをコピー先のリポジトリに設定します。

開発 URL はターミナルに表示されます。既定では `http://localhost:4321/プロジェクト名/` です。停止するにはターミナルで `Control+C` を押します。

`src/pages/index.astro` の `title`、`tags`、`drawingDescription` を作品に合わせて編集します。`src/scripts/engine.js` には動作確認用として meshshader の描画コードが入っています。作品の描画コードに差し替えるときは `#drawing` を使用します。

共通 CSS とロゴ画像は `https://dareka-san.github.io/assets/` から読み込みます。

## 共通アセットを更新する

`DevProject/_assets` は [dareka-san/assets](https://github.com/dareka-san/assets) のローカルリポジトリです。CSS や画像を更新したら、`DevProject` 直下で差分を確認してからコミットし、`main` に push します。

```sh
git -C _assets status --short
git -C _assets add -A -- css images
git -C _assets diff --cached --stat
git -C _assets commit -m "fix: 共通アセットを更新"
git -C _assets push origin main
```

`main` への push で GitHub Pages が更新されます。同じ公開 URL を参照しているプロジェクトは、次にそのファイルを取得したときに新しい内容が反映されます。ファイル名や配置を変えたときは、該当プロジェクトの参照先も更新してください。

## ビルドと公開

- `npm run build` で `dist/` に出力し、JavaScript を Terser で minify します。
- `npm run preview` でビルド済みページを確認できます。

### Mac で最初の一度だけ

```sh
brew install gh
gh auth login --hostname github.com --web --git-protocol https --scopes workflow
```

`dareka-san` でログインします。ログイン済みで `workflow` 権限を追加する場合は `gh auth refresh --hostname github.com --scopes workflow` を実行します。

### プロジェクトごとの初回公開

1. フォルダ名を英数字で始め、英数字・ハイフン・アンダースコアで付けます。
2. VS Code で公開する内容を `main` にコミットします。初回コミットに `.github/workflows/pages.yml` を含めます。
3. コピー先の `publish.command` を Finder でダブルクリックします。フォルダと同じ名前で `dareka-san` に公開リポジトリを作成し、Pages を GitHub Actions に設定して `main` を push します。デプロイが成功して公開 URL が応答すると、ブラウザで開きます。

2回目以降は VS Code から `main` に push すると、GitHub Actions がビルドと公開を実行します。
