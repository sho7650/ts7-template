# Design decisions

A record of what this template decided and why. When a decision changes, update its entry and note the reason for the change.

## D1. Environment: Nix flake dev shell + direnv; mise does not manage this project

- **Decision**: Node.js and pnpm come from the dev shell in `flake.nix`, loaded automatically by direnv (`use flake`).
- **Why**: The TypeScript 7 compiler, oxlint and oxfmt ship native binaries through npm, so Nix adds value only by pinning the Node.js and pnpm binaries and by reproducing the same environment in CI with `nix develop`. Letting both mise and Nix manage Node.js creates two sources of truth and makes it unclear which Node.js is running, so this project relies on Nix alone.

## D2. Runtime: Node.js 26

- **Decision**: Use `nodejs_26` from nixpkgs-unstable.
- **Why**: Node.js 26 is scheduled to enter LTS in late October 2026, so stability is a small concern, and it matches the goal of tracking current features.

## D3. Formatter: oxfmt

- **Decision**: Use oxfmt (0.x).
- **Why**: It unifies linting (oxlint) and formatting on the Oxc toolchain. It is still 0.x and experimental, which fits the goal of exploring the latest toolchain. Biome remains available as a stable point of comparison.

## D4. Repository layout: single package

- **Decision**: Start as a single package rather than a workspace.
- **Why**: A monorepo from day one adds configuration and obscures TypeScript 7 itself. Splitting into a pnpm workspace later is straightforward.

## D5. nixpkgs updates: manual for now

- **Decision**: `flake.lock` pins a nixpkgs-unstable commit, and `nix flake update` is run manually. Automated weekly updates (Renovate or GitHub Actions) are deferred.
- **Why**: Day-level freshness is unnecessary, and Nix provides only Node.js and pnpm, so a stale lock carries little risk.

## D6. No emit; import with `.ts` extensions

- **Decision**: `noEmit: true` + `allowImportingTsExtensions: true`. Imports are written as `./foo.ts` and files run directly with `node src/x.ts`. `rewriteRelativeImportExtensions` is not used.
- **Why**: For code that only needs to run, a zero-transpile workflow is the cleanest expression of Node.js type stripping. `rewriteRelativeImportExtensions` only takes effect when emitting, so it is meaningless with `noEmit`. Add a separate `tsconfig.build.json` if the project ever needs to publish a library.

## D7. tsconfig strictness

- **Decision**: `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` + `noImplicitReturns` + `noFallthroughCasesInSwitch`. `noUnusedLocals/Parameters` are not used.
- **Why**: Maximize type safety while leaving unused-variable detection to oxlint's `no-unused-vars`, which can report temporary unused code during TDD as a warning. `noPropertyAccessFromIndexSignature` adds more noise than safety, and `isolatedDeclarations` targets libraries. `strict` is already the default in TypeScript 7 but is stated explicitly so the config documents its intent.

## D8. Tests live next to the source

- **Decision**: Place `src/foo.ts` and `src/foo.test.ts` side by side.
- **Why**: It makes moving between the code and its specification fast during red → green, and a feature can be deleted as one folder. Vitest and oxlint distinguish tests by the `*.test.ts` pattern.

## D9. Enforce an 80% coverage threshold from day one

- **Decision**: Set an 80% threshold in `vitest.config.ts` so `pnpm run check` fails below it.
- **Why**: With TDD, coverage should naturally stay near 100%. Falling below the threshold signals code written without a test first, so the tooling enforces test-first.

## D10. oxlint rule strength

- **Decision**: correctness, suspicious and perf as errors; pedantic as warnings. Plugins: `typescript`, `unicorn`, `import`, `vitest`. Type-aware linting enabled. style and nursery are not used.
- **Why**: Type-aware rules such as `no-floating-promises` are the main attraction. style overlaps with the formatter and nursery is unstable. pedantic is useful but produces false positives, so it stays at warning level.

## D11. oxfmt style: defaults

- **Decision**: Keep the Prettier-compatible defaults (double quotes, semicolons, width 80).
- **Why**: Customizing moves away from learning the tool itself, and defaults make comparisons with Biome or Prettier easier.

## D12. Git: commit step by step

- **Decision**: Commit in small steps (flake, then package.json, then each config, and so on).
- **Why**: The history then documents how the environment was assembled and is easy to review later.

## D13. Sample code: a minimal `greet` function

- **Decision**: Ship `src/greet.ts` with one test, and call it from `src/index.ts` via `import { greet } from "./greet.ts"`.
- **Why**: Projects created from this template will delete the sample first, so it should be minimal and domain-neutral. It still demonstrates a passing `check` pipeline and running a `.ts` import directly with `node`. (The initial environment check used a `retry` function; it was replaced when the repository became a public template.)

## D14. Disable mise explicitly in this directory

- **Decision**: Commit a `mise.toml` with `[settings] disable_tools = ["node", "pnpm"]`. Developers who use mise need to run `mise trust` once.
- **Why**: If a developer's global mise config manages Node.js or pnpm, mise and direnv both modify `PATH`, and which binary wins depends on shell hook order. mise documents using it together with direnv as unsupported. Declaring in the repository that mise does not manage these tools removes the dependence on hook order without touching anyone's global config. The file has no effect for developers who do not use mise.

## D15. Non-interactive shells run commands through `direnv exec .`

- **Decision**: Tools that run commands in a non-interactive shell without a direnv hook (AI coding agents, scripts) use `direnv exec . pnpm ...`. This rule is stated in `CLAUDE.md`.
- **Why**: Without a direnv hook the flake environment is not loaded, and a globally installed Node.js may run instead, breaking D1's single source of truth. With nix-direnv's cache it is faster than `nix develop --command`.

## D16. Use pnpm from nixpkgs as is, guarded by devEngines

- **Decision**: Do not use the `packageManager` field. Validate the version only, with `devEngines.packageManager: { name: "pnpm", version: "^12.3.0", onFail: "error" }`.
- **Why**: Since pnpm 11, a version in `packageManager` makes pnpm download and switch to that version by default (`pmOnFail: download`), which turns the Nix-provided pnpm into a mere bootstrap and contradicts D1. nixpkgs lags a few minor versions, which matters little here, and it catches up with `nix flake update` (D5). If the latest version is required, pin it with a flake overlay.

## D17. Guard the Node.js version with devEngines.runtime

- **Decision**: `devEngines.runtime: { name: "node", version: "^26", onFail: "error" }`.
- **Why**: Running outside the flake environment by mistake fails immediately. It uses the same mechanism as D16, and `onFail: "error"` never downloads anything, so Nix remains the single source of truth (D1).

## D18. Commit VS Code settings

- **Decision**: `.vscode/extensions.json` recommends the TypeScript 7 (`TypeScriptTeam.native-preview`), Oxc and direnv extensions. `.vscode/settings.json` sets `js/ts.experimental.useTsgo: true`, `js/ts.tsdk.path: "node_modules/typescript"`, Oxc as the formatter and format on save.
- **Why**: The TypeScript 7 extension bundles its own TypeScript, so without `tsdk.path` the editor and CLI can run different versions. Keeping the settings in the repository also documents the design.

## D19. oxlint / oxfmt configuration and responsibilities

- **Decision**: `.oxlintrc.json` (the JS/TS config format is experimental) sets `options.typeAware: true` and `options.typeCheck: false`. oxfmt keeps its defaults in an `.oxfmtrc.json` generated by `--init`.
- **Why**: Setting type-aware in the config file also enables it in editor integrations. `typeCheck` stays off to keep the boundary "type errors belong to tsc, suspicious code belongs to oxlint"; two tools reporting the same error blurs ownership. `.oxfmtrc.json` makes it explicit which formatter the project uses, even with default contents.

## D20. CI: GitHub Actions with upstream Nix on Ubuntu

- **Decision**: `.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, on `ubuntu-latest` only, with `permissions: contents: read`. Steps: `actions/checkout@v7` → `cachix/install-nix-action@v31` → `nix flake check` → `nix develop --command pnpm install --frozen-lockfile` → `nix develop --command pnpm run check`. No extra caching. Actions are pinned by major tag. Automated dependency updates (Dependabot / Renovate) are deferred along with D5.
- **Why**: `cachix/install-nix-action` installs upstream Nix, matching local development; `DeterminateSystems/nix-installer-action` installs Determinate Nix by default and calls upstream Nix "not a supported configuration". macOS runners are expensive and `aarch64-darwin` is covered locally. Node.js and pnpm come from cache.nixos.org quickly enough that extra caching is not worth the complexity yet.

## D21. Public template: MIT license, no Intel Mac support

- **Decision**: Publish under the MIT license. The flake supports `aarch64-darwin`, `aarch64-linux` and `x86_64-linux`; `x86_64-darwin` is dropped.
- **Why**: Without a license others cannot legally reuse the template. The pinned nixpkgs-unstable no longer evaluates for `x86_64-darwin` (see the nixpkgs 26.11 release notes), so listing it would make `nix flake check --all-systems` fail.
