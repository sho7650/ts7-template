# TS7 環境構築プラン

## 決定事項

| 領域 | 採用 | 備考 |
|---|---|---|
| 環境管理 | Nix flake devShell + direnv (`use flake`) | このディレクトリでは mise を使わない |
| Runtime | Node.js 26 (nixpkgs-unstable `nodejs_26` 26.10.0) | 2026-10 下旬に LTS 入り予定 |
| Package manager | pnpm (nixpkgs 12.3.4) + `packageManager: pnpm@12.8.1` | pnpm 自身がバージョンを切り替える |
| Language | TypeScript 7.0.2 | 型チェック専用 (`noEmit`) |
| Test | Vitest 5.0.3 + @vitest/coverage-v8 | |
| Lint | oxlint 1.86 + oxlint-tsgolint 7.0.x (type-aware) | |
| Format | oxfmt 0.71 | 0.x の実験枠 |
| 実行 | Node native type stripping (`node src/index.ts`) | bundler なし |
| 構成 | 単一パッケージ (src/, test/) | |

## タスク

- [ ] `git init` + `.gitignore` (node_modules, coverage, .direnv, result)
- [ ] `flake.nix` (nixpkgs-unstable, devShell: nodejs_26, pnpm) + `flake.lock`
- [ ] `.envrc` (`use flake`) → `direnv allow`
- [ ] `package.json` (type: module, packageManager, engines, scripts)
- [ ] devDependencies を pnpm add (exact pin)
- [ ] `tsconfig.json` (NodeNext, strict, erasableSyntaxOnly, verbatimModuleSyntax, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noEmit)
- [ ] `vitest.config.ts` (coverage v8, threshold 80%)
- [ ] `.oxlintrc.json` (type-aware 有効)
- [ ] `.oxfmtrc.json`
- [ ] サンプル `src/index.ts` + `test/*.test.ts` で疎通確認
- [ ] 検証: `node src/index.ts` / `pnpm typecheck` / `pnpm lint` / `pnpm format:check` / `pnpm test:run` / `pnpm test:coverage` がすべて通る
- [ ] 検証: 型エラー・floating promise を意図的に仕込み、tsc と tsgolint が検出することを確認

## scripts (予定)

```
dev            node --watch src/index.ts
typecheck      tsc
test           vitest
test:run       vitest run
test:coverage  vitest run --coverage
lint           oxlint --type-aware
format         oxfmt
format:check   oxfmt --check
check          typecheck && lint && format:check && test:run
```

## 後回し (今回やらない)

- GitHub Actions (`nix develop -c pnpm check`)
- lefthook 等の git hooks
- `node:test` / Bun / Deno 比較実験

## Review

(完了後に記入)
