# ts7-template

A minimal TypeScript 7 project template built on native toolchains: Nix provides the runtime, Node.js runs `.ts` files directly, and the type checker, linter and formatter are all native binaries.

## Stack

| Area            | Tool                                                    |
| --------------- | ------------------------------------------------------- |
| Environment     | Nix flake dev shell + direnv                            |
| Runtime         | Node.js 26 (type stripping, no build step)              |
| Package manager | pnpm 12                                                 |
| Type checking   | TypeScript 7 (`tsc`, native)                            |
| Testing         | Vitest 5 + V8 coverage (80% threshold)                  |
| Linting         | oxlint + oxlint-tsgolint (type-aware)                   |
| Formatting      | oxfmt                                                   |
| CI              | GitHub Actions (`nix develop --command pnpm run check`) |

The reasons behind each choice are recorded in [docs/decisions.md](docs/decisions.md).

## Requirements

- [Nix](https://nixos.org/download/) with flakes enabled
- [direnv](https://direnv.net/), ideally with [nix-direnv](https://github.com/nix-community/nix-direnv)

Supported systems: `aarch64-darwin`, `aarch64-linux`, `x86_64-linux`.

## Getting started

Create a repository from this template (on GitHub, **Use this template**, or `gh repo create <name> --template <owner>/ts7-template`), then:

```sh
direnv allow          # loads Node.js and pnpm from flake.nix
mise trust            # only if you use mise (see docs/decisions.md D14)
pnpm install
pnpm run check
```

Without direnv, prefix commands with `nix develop --command`.

After creating your project:

1. Change `name` in `package.json`.
2. Replace the `greet` sample in `src/`.
3. Update the copyright line in `LICENSE`.

## Scripts

| Script                   | What it does                                    |
| ------------------------ | ----------------------------------------------- |
| `pnpm run dev`           | Run `src/index.ts` with `node --watch`          |
| `pnpm run typecheck`     | Type-check with TypeScript 7                    |
| `pnpm test`              | Run Vitest in watch mode                        |
| `pnpm run test:run`      | Run tests once                                  |
| `pnpm run test:coverage` | Run tests with coverage thresholds              |
| `pnpm run lint`          | Lint with oxlint (type-aware)                   |
| `pnpm run format`        | Format with oxfmt                               |
| `pnpm run format:check`  | Check formatting                                |
| `pnpm run check`         | typecheck → lint → format:check → test:coverage |

## Conventions

- Import local modules with the `.ts` extension (`import { greet } from "./greet.ts"`); nothing is emitted.
- Put tests next to the source as `*.test.ts`.
- Type errors belong to `tsc`; oxlint reports suspicious code only (`typeCheck` is disabled).

## Editor

Open the folder in VS Code and install the recommended extensions (TypeScript 7, Oxc, direnv). The workspace settings point the editor at `node_modules/typescript` so the editor and CLI use the same TypeScript version.

## License

[MIT](LICENSE)
