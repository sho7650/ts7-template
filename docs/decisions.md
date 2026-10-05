# 設計判断ログ

環境構築時に決めたことと、その理由の記録。判断を変えたときは該当項目を更新し、変更理由を追記する。

## D1. 環境管理: Nix flake devShell + direnv。このディレクトリでは mise を使わない

- **決定**: Node.js と pnpm は `flake.nix` の devShell が提供し、direnv (`use flake`) で自動ロードする。
- **理由**: tsgo / oxlint / oxfmt は npm 経由でネイティブバイナリが入るため、Nix の価値は「Node/pnpm 本体のバージョン固定」と「CI でも `nix develop` で同一環境を再現できること」にある。mise と Nix の両方に Node を管理させると真実の源が二重になり、どちらの Node が動いているか分からなくなるので、このディレクトリでは Nix に一本化する。

## D2. Runtime: Node.js 26

- **決定**: nixpkgs-unstable の `nodejs_26` を使う。
- **理由**: グローバル環境 (mise) も 26 で揃っており、2026-10 下旬に LTS 入りする予定のため安定性の懸念は小さい。最新機能を追うという目的にも合う。

## D3. Formatter: oxfmt

- **決定**: oxfmt (0.x) を使う。
- **理由**: lint (oxlint) と format を Oxc ツールチェーンに統一できる。0.x で実験的だが、「最新ツールチェーンを触る」というこのリポジトリの目的にはむしろ合っている。Biome は安定版の比較対象として後で試せる。

## D4. リポジトリ構成: 単一パッケージ

- **決定**: workspace にせず、単一パッケージで始める。
- **理由**: 最初から monorepo にすると設定量が増え、TS7 そのものが見えにくくなる。必要になったら pnpm workspace へ分割できる。

## D5. nixpkgs の更新方針: 当面は手動、CI 導入後に自動化

- **決定**: `flake.lock` で nixpkgs-unstable のコミットを固定し、`nix flake update` は手動で行う。CI 導入後は Renovate / GitHub Actions で週次の自動更新に移行する。
- **理由**: 実験場なので日単位の鮮度は不要。Nix が持つのは Node/pnpm だけなので、lock が古くなってもリスクは小さい。

## D6. emit しない。import は `.ts` 拡張子

- **決定**: `noEmit: true` + `allowImportingTsExtensions: true`。import は `./foo.ts` と書き、`node src/x.ts` で直接実行する。`rewriteRelativeImportExtensions` は使わない。
- **理由**: 動かすだけの実験場では「トランスパイル工程ゼロ」の思想が最もきれいに出る。`rewriteRelativeImportExtensions` は emit 時にしか効かないため、noEmit では意味がない (当初プランの誤りを修正)。ライブラリ公開が必要になったら `tsconfig.build.json` を別途用意する。

## D7. tsconfig の厳しさ

- **決定**: `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` + `noImplicitReturns` + `noFallthroughCasesInSwitch`。`noUnusedLocals/Parameters` は使わない。
- **理由**: 型安全性を最大限に上げつつ、未使用変数の検出は oxlint の `no-unused-vars` に任せる (TDD 途中の一時的な未使用を warn で段階的に扱えるため)。`noPropertyAccessFromIndexSignature` は得られる安全性に比べてノイズが多く、`isolatedDeclarations` はライブラリ向けの設定なので不要。TS7 では `strict` はデフォルトで true だが、設定ファイルを設計意図のドキュメントにするため明示する。

## D8. テストはソースと同じ場所に置く

- **決定**: `src/foo.ts` と `src/foo.test.ts` を並べる。
- **理由**: TDD の RED→GREEN で対象と仕様を行き来しやすい。実験が増えたときもフォルダ単位で丸ごと消せる。Vitest や oxlint の設定は `*.test.ts` のパターンで区別できる。

## D9. カバレッジ 80% の閾値を初日から強制する

- **決定**: `vitest.config.ts` に threshold 80% を設定し、`pnpm check` で下回れば失敗させる。
- **理由**: TDD なら自然に 100% 近くになるはずで、下回ったら「テストを先に書かなかった」というシグナルになる。テストファーストの原則を仕組みで担保する。

## D10. oxlint のルール強度

- **決定**: correctness + suspicious + perf を error、pedantic を warn にする。plugin は `typescript` / `unicorn` / `import` / `vitest`。type-aware を有効にする。style と nursery は使わない。
- **理由**: `no-floating-promises` などの type-aware ルールがこの構成の目玉。style は formatter と重複し、nursery は不安定なので除外する。pedantic は有用だが誤検知もあるため warn に留める。

## D11. oxfmt のスタイル: デフォルト

- **決定**: Prettier 互換のデフォルト (ダブルクォート、セミコロンあり、幅 80) のまま使う。
- **理由**: 設定を変えるほどツール自体の学習から離れる。デフォルトのままなら Biome / Prettier との比較もしやすい。

## D12. Git: ステップごとにコミットする

- **決定**: flake → package.json → 各 config のように段階的にコミットする。
- **理由**: 学習用の実験場なので、`git log` が「環境をどう組み立てたか」の記録として後から振り返れる。

## D13. 疎通確認を兼ねた最初の TDD 題材: リトライ制御

- **決定**: 疎通確認はリトライ制御 (`retry`) の最初の数テストで行う。
- **理由**: 非同期処理を含むため、type-aware lint の目玉である `no-floating-promises` と Vitest の fake timers (`vi.useFakeTimers`) を自然に試せる。環境全体の価値を一度に確認できる。今回は疎通確認に必要な最小限のテストに留め、本格的な実装は別タスクにする。

## D14. mise をこのディレクトリで明示的に無効化する

- **決定**: プロジェクト直下に `mise.toml` を置き、`[settings] disable_tools = ["node", "pnpm"]` を設定する (`mise trust` が必要)。
- **理由**: fish では direnv の PATH が mise より前に来るため現状でも flake の node が使われるが、それは hook の登録順に依存した偶然であり、mise 公式も direnv との併用を "unsupported" としている。mise 自身に「ここでは管理しない」と宣言させることで順序依存をなくす。グローバル設定 (`.miserc.toml`) は変更しない。

## D15. Claude Code からのコマンドは `direnv exec .` 経由で実行する

- **決定**: Claude Code (zsh, 非対話) からは `direnv exec . pnpm ...` の形で実行し、このルールをプロジェクトの `CLAUDE.md` に明記する。
- **理由**: Claude Code の zsh には direnv hook がなく、非対話シェルなので `.zshrc` に hook を足しても発火しない。そのままだと mise の node が使われ、D1 の「真実の源は一つ」が崩れる。nix-direnv のキャッシュがあるので `nix develop -c` より高速。

## D16. pnpm は nixpkgs のものをそのまま使い、devEngines でガードする

- **決定**: `packageManager` フィールドは使わず、`devEngines.packageManager: { name: "pnpm", version: "^12.3.0", onFail: "error" }` でバージョンを検証のみ行う。
- **理由**: pnpm 11+ では `packageManager` に版を書くと既定 (`pmOnFail: download`) で pnpm が自分で別バージョンをダウンロードして切り替えるため、Nix の pnpm が単なるブートストラップになり D1 と矛盾する。nixpkgs は数マイナー遅れるが実験場では影響が小さく、`nix flake update` (D5) で追従できる。最新版が必要になったら flake の overlay で固定する。

## D17. Node のバージョンを devEngines.runtime でガードする

- **決定**: `devEngines.runtime: { name: "node", version: "^26", onFail: "error" }`。
- **理由**: flake 環境外で誤って実行したときに即座に気づける。D16 と同じ仕組みで統一でき、`onFail: "error"` なのでダウンロードは起きず Nix 一本化 (D1) を維持できる。

## D18. VS Code 設定をリポジトリにコミットする

- **決定**: `.vscode/extensions.json` で TypeScript 7 (`TypeScriptTeam.native-preview`)・Oxc・direnv 拡張を推奨し、`.vscode/settings.json` で `js/ts.experimental.useTsgo: true`、`js/ts.tsdk.path: "node_modules/typescript"`、Oxc を formatter、保存時フォーマットを設定する。
- **理由**: TS7 拡張は TypeScript を同梱しており、`tsdk.path` を指定しないとエディタと CLI で TS のバージョンがずれ得る。設定をリポジトリに置くことで設計意図のドキュメントにもなる。

## D19. oxlint / oxfmt の設定と責務分担

- **決定**: `.oxlintrc.json` (JS/TS 設定形式は experimental のため不採用) に `options.typeAware: true`、`options.typeCheck: false` を設定する。oxfmt はデフォルトのまま `.oxfmtrc.json` を `--init` で生成する。
- **理由**: type-aware を設定ファイル側に書くとエディタ連携でも有効になる。`typeCheck` を切るのは「型エラーは tsc、怪しいコードは oxlint」という責務境界を保つため (同じエラーを二つのツールが報告すると誰が責任を持つか曖昧になる)。`.oxfmtrc.json` は中身がデフォルトでも「このツールを使っている」ことを明示する役割がある。
