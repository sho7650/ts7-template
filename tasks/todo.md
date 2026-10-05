# TS7 環境構築プラン

設計判断と理由は [docs/decisions.md](../docs/decisions.md) (D1〜D19) を参照。

## 構成

| 領域            | 採用                                                        | 判断     |
| --------------- | ----------------------------------------------------------- | -------- |
| 環境管理        | Nix flake devShell + direnv。mise は `mise.toml` で無効化   | D1, D14  |
| Runtime         | Node.js 26 (nixpkgs-unstable `nodejs_26`)                   | D2, D17  |
| Package manager | pnpm (nixpkgs) + `devEngines.packageManager` でガード       | D16      |
| Language        | TypeScript 7.0.2 (`noEmit`、`.ts` 拡張子で import)          | D6, D7   |
| Test            | Vitest 5.0.3 + coverage-v8 (閾値 80%)、テストはソースと並置 | D8, D9   |
| Lint            | oxlint 1.86 + oxlint-tsgolint (type-aware、typeCheck 無効)  | D10, D19 |
| Format          | oxfmt 0.71 (デフォルト設定)                                 | D3, D11  |
| Editor          | VS Code 設定をコミット (TS7 拡張 + Oxc + direnv)            | D18      |
| 構成            | 単一パッケージ                                              | D4       |

## タスク

- [x] `git init` + `.gitignore`
- [x] `flake.nix` + `flake.lock` + `.envrc` + `mise.toml` → node 26.10.0 / pnpm 12.3.4 が Nix store から解決されることを確認
- [x] `package.json` (devEngines, scripts) + devDependencies (exact pin)
- [x] `tsconfig.json` / `vitest.config.ts` / `.oxlintrc.json` / `.oxfmtrc.json`
- [x] `.vscode/` + プロジェクト `CLAUDE.md`
- [x] 検証: `node src/index.ts` / `typecheck` / `lint` / `format:check` が通る
- [x] 検証: devEngines のガードが node / pnpm の版不一致でエラーになる
- [x] 検証: 型エラーは tsc のみ、floating promise は oxlint のみが検出する
- [x] retry の最初のテスト (seam 合意後) で `test:run` / `test:coverage` / `check` を通す

## 後回し

- GitHub Actions (`nix develop -c pnpm run check`)、flake.lock の自動更新
- lefthook 等の git hooks
- `node:test` / Bun / Deno / Biome 比較実験

## Review

- `direnv exec . pnpm run check` が exit 0、警告ゼロ、カバレッジ 100% (retry 3 テスト)。
- 3 層の責務分担を実証: 型エラーは tsc だけ、`no-floating-promises` は oxlint (type-aware) だけが検出した。
- devEngines のガードは node / pnpm の版不一致で `ERR_PNPM_BAD_RUNTIME_VERSION` / `ERR_PNPM_BAD_PM_VERSION` を出して止まる。
- 気づいた点:
  - pnpm 12 は `-s` を持たない。`pnpm run <script>` を使う。
  - oxfmt は package.json のキーを並べ替え、Markdown も整形対象にする。
  - Vitest の fake timers は `node:timers/promises` の `setTimeout` も制御できる。
  - pnpm が `curl ... | sh` での更新を勧める通知を出すが、D16 に反するので従わない (`nix flake update` で追従する)。
