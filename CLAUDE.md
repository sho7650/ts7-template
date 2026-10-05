# trial-ts7

TypeScript 7 の実験場。設計判断とその理由は `docs/decisions.md` にある。構成を変えるときは先に読み、変えたら追記する。

## コマンドの実行

Node.js と pnpm は `flake.nix` が提供する。Claude Code のシェル (zsh, 非対話) には direnv hook がないため、**必ず `direnv exec .` を前置する** (D15)。前置しないと mise の node が使われる。

```sh
direnv exec . pnpm run check      # typecheck → lint → format:check → test:coverage
direnv exec . pnpm run test:run
direnv exec . node src/index.ts
```

pnpm 12 は `-s` オプションを持たない。

## 責務分担

- 実行: Node の type stripping (`node src/x.ts`)。emit しない
- 型エラー: `tsc` (TypeScript 7)
- 怪しいコード: `oxlint` (type-aware、`typeCheck` は無効)
- 整形: `oxfmt`
- 振る舞い: `vitest`。テストは `src/**/*.test.ts` にソースと並べて置く
