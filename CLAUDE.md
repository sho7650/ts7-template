# ts7-template

A TypeScript 7 project template. Design decisions and their reasons live in `docs/decisions.md`. Read it before changing the setup, and record any change there.

## Running commands

Node.js and pnpm come from `flake.nix`. Agent shells are non-interactive and have no direnv hook, so **always prefix commands with `direnv exec .`** (D15). Without the prefix, a globally installed Node.js may run instead.

```sh
direnv exec . pnpm run check      # typecheck → lint → format:check → test:coverage
direnv exec . pnpm run test:run
direnv exec . node src/index.ts
```

pnpm 12 has no `-s` flag; use `pnpm run <script>`.

## Responsibilities

- Running: Node.js type stripping (`node src/x.ts`); nothing is emitted
- Type errors: `tsc` (TypeScript 7)
- Suspicious code: `oxlint` (type-aware, `typeCheck` disabled)
- Formatting: `oxfmt`
- Behavior: `vitest`; tests live next to the source as `src/**/*.test.ts`
