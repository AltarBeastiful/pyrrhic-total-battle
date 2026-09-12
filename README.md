# Pyrrhic

Pyrrhic is a free stacking calculator for Total Battle epic monsters. It runs entirely in your browser:
there is no account, no server and no telemetry of any kind — no analytics, no error reporting, no
third-party fonts, no remote data (see [ADR-0002](docs/decisions/0002-client-only-architecture.md)).
Your profiles, saved stacks and settings live in this browser's local storage; you can export them as a
JSON file or share a whole configuration through a link that carries the data in the URL fragment, which
browsers never send to a server. The code is AGPL-3.0, so any hosted copy has to stay open too.

## Quick start

Requires Node 22 (see `.nvmrc`) and pnpm 10.

```sh
pnpm install     # install dependencies
pnpm dev         # start the dev server on http://localhost:5173
pnpm test        # run the unit tests once (pnpm test:watch to keep them running)
```

## Other commands

| Command          | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm build`     | Production build into `dist/` (relative asset paths)          |
| `pnpm preview`   | Serve the production build locally                            |
| `pnpm typecheck` | TypeScript, strict, no emit                                   |
| `pnpm lint`      | ESLint                                                        |
| `pnpm format`    | Prettier, write (`pnpm format:check` to only check)           |
| `pnpm e2e`       | Playwright smoke tests (`pnpm exec playwright install` first) |

## Documentation

- [Implementation plan and backlog](docs/PLAN.md) — architecture, engine specification, milestones.
- [Decision records](docs/decisions/) — why the project is client-only, which stack it uses, how
  persistence, share links, the engine and the game-data format are designed.

## Licence

[AGPL-3.0-or-later](LICENSE). Game data is factual and shared under the same repository terms.
