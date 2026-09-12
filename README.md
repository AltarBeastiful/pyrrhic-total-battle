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

The service worker is not registered by `pnpm dev` (it would only fight hot reloading);
start the dev server with `VITE_PWA_DEV=1 pnpm dev` to exercise it.

## Install / offline

Pyrrhic is a progressive web app: once you have opened it, it keeps working with no network at
all. A service worker (`public/sw.js`) stores the page, its scripts and styles, the calculation
worker and the icons on first visit, so a later visit — plane, metro, dead Wi-Fi — starts from
that copy. Navigations still try the network first, so a new release is picked up as soon as one
is reachable; when a new version has been downloaded, a small "A new version of Pyrrhic is
available" bar offers to reload, and nothing is swapped underneath a running calculation until
you accept.

Browsers that support it (Chrome, Edge, Android, and Safari through "Add to Home Screen") can
install it as a standalone app: an **Install app** button appears at the bottom of the page when
your browser offers it, or use the install icon in the address bar. Installing changes nothing
about the privacy story — there is still no server, no account and no telemetry, and everything
the worker caches comes from where you loaded the app from.

No dependency was added for any of this: the worker, its precache list (generated at build time
by a ~40-line plugin in `vite.config.ts`, rules in `src/pwa/precache.ts`) and the icons
(`node src/pwa/generate-icons.mjs`, a hand-written PNG encoder over `node:zlib`) are all in the
repository, which keeps ADR-0003's dependency list short and ADR-0002's "no third-party code at
runtime" literally true.

## Documentation

- [Implementation plan and backlog](docs/PLAN.md) — architecture, engine specification, milestones.
- [Decision records](docs/decisions/) — why the project is client-only, which stack it uses, how
  persistence, share links, the engine and the game-data format are designed.

## Licence

[AGPL-3.0-or-later](LICENSE). Game data is factual and shared under the same repository terms.

Design tokens, icon rules and the wording glossary live in `docs/design.md`; sync setup in `docs/sync.md`.
