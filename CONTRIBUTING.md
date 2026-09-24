# Contributing to Pyrrhic

Pyrrhic is a free, fully client-side stacking calculator for Total Battle. There is no server, no account
and no telemetry, and there never will be. Two kinds of contribution are equally welcome: **game data** (a
number that is wrong, a unit that is missing) and **code**.

By contributing you agree that your work is published under the repository licence (AGPL-3.0-or-later).

## Getting set up

```bash
pnpm install
pnpm dev          # the app on http://localhost:5173
pnpm test         # unit tests, including the data tests
pnpm data:check   # schemas + formatting of src/data/tables
```

Node 22 or newer (see `.nvmrc`) and pnpm. Nothing else: no database, no API key.

## Game-data pull requests

This is the contribution the project needs most, and it needs no development environment at all — the JSON
files can be edited in the GitHub web editor.

1. Read [`docs/data/README.md`](docs/data/README.md): it lists every table, every field and where to read
   the value in game, with worked examples for a unit, a captain and an equipment piece.
2. Edit the file under `src/data/tables/`.
3. Run `pnpm data:format` if you can, so the diff shows only the values you changed. If you cannot, say so
   in the pull request — a maintainer will run it.
4. Bump `dataVersion` in `src/data/tables/version.json` and add a line to `src/data/CHANGELOG.md`.
5. Open the pull request and fill in the template: **what changed**, **the in-game evidence**, the version
   bump and the changelog line.

**Evidence.** A screenshot of the unit sheet, the captain screen or the equipment popup is enough; a battle
report works too. Values nobody can check are not merged. If your numbers disagree with what is in the
repository, that is fine and useful — say which one your game shows, and on which server.

Keep pull requests small and focused. "Tier 10 archers" and "fix Skadi's star values" are two pull requests;
they are reviewed in minutes. "Update all the data" is one that will sit.

A data change can break the engine regression tests — that is the point of them. If a test fails and you
believe your value is right, say so in the pull request rather than changing the test: the maintainers will
work out which side is wrong.

## Code pull requests

1. Open an issue first for anything larger than a bug fix, so the design is agreed before the work.
   `docs/PLAN.md` is the roadmap and `docs/decisions/` records the decisions already taken; a change that
   contradicts one of them needs a new ADR in the same folder.
2. Branch from `development`.
3. Before pushing:

   ```bash
   pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm data:check
   ```

   CI runs exactly these.

4. Write tests for behaviour, not for implementation details. The engine is pure and easy to test; use the
   fixtures in `docs/research/fixtures/` when the change touches the battle model.

House rules that reviewers do check:

- **No network calls in the app.** Everything runs in the browser, offline. No analytics, no fonts from a
  CDN, no error reporting.
- **All wording is ours.** Help text, tooltips and labels are written for this project; nothing is copied
  from another tool or from the game's own help.
- TypeScript strict, no `any`; the engine (`src/engine/`) stays free of React, the store and the DOM.
- Comments explain _why_, not _what_.

## Two engine paths, one test suite

The plan engine exists twice: the TypeScript engine (`src/engine/`, the reference) and the AssemblyScript
kernel (`kernel/assembly/`, set with `setKernel` in `src/engine/fast.ts`). They must never drift apart, and
the tests check that on every `pnpm test`, in two vitest projects (`vite.config.ts`):

- **`ts`** runs every test in the repository on the TypeScript path.
- **`kernel`** runs every engine-level test file again (`tests/engine/**`, `src/engine/**`) with the kernel
  set for the whole file (`tests/kernel/with-kernel.setup.ts`). A failure is prefixed with its project name,
  `[ts]` or `[kernel]`, so it says which path broke.
- `tests/kernel/**` (in `ts` only) holds the two paths to each other in one process: entry-point parity on
  seeded random inputs, the plan deep-equal on every benchmark army (`plan-equivalence`), and the benchmark's
  whole table measured both ways and compared figure for figure (`benchmark-equivalence.*`).

```bash
pnpm test                                   # both paths
pnpm vitest run --project ts                # the TypeScript path alone
pnpm vitest run --project kernel            # the kernel path alone
pnpm vitest run --project kernel tests/engine/plan.test.ts   # one engine file on the kernel
```

The benchmark (`tests/engine/plan-benchmark.test.ts`) runs in both projects; the kernel's run writes
`tools/theorycraft/out/benchmark-*.kernel.{md,json}` (gitignored), and only the TypeScript run updates the
committed `benchmark-latest.*`.

**The rule: a test is written once and runs on both paths.** Only the implementation is duplicated. Never
write a kernel copy of an engine test; put the test under `tests/engine/` and it runs on both. A new engine
behaviour is test-first: the new test must go **red on both paths** (`[ts]` and `[kernel]`), then pass on
both once the change is made in the TypeScript and in the kernel. Both paths must always have the same set
of failing tests; a test that fails on only one path is drift, whatever the test is about.

## Reporting a problem

Open an issue with what you did, what you expected and what happened. For a wrong result, the most useful
thing you can attach is the share link of your configuration plus the in-game battle report you compared it
with — both are just text, and the link carries no personal data.
