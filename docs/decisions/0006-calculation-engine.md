# ADR-0006 — Calculation engine: pure, deterministic, worker-hosted, fixture-validated

Status: Accepted (2026-09-12)

## Context
TotalStack computes on its server, so its algorithm is unknown; we only have inputs, outputs and help texts. We
must design our own algorithm and prove it matches observed in-game behaviour. Some operations (priority search)
can take seconds.

## Options considered
- Where the math lives: inside React components/hooks, or a **pure module** with plain data in/out.
- Threading: main thread only, **Web Worker** for everything, or worker only for long searches.
- Stacking algorithm: geometric tier ratios (Kaiculator-style 1.9× per tier), **flat HP profile with strict
  ordering and exact pool fill** (what the fixture shows TotalStack doing), or a general optimiser (LP/ILP) from
  the start.
- Validation: unit tests on invented numbers, or **regression fixtures from real TotalStack outputs and in-game
  battle reports**.

## Decision
- `src/engine` is plain TypeScript with no React, DOM or store imports. Public API: `aggregateBonuses(sources) →
  totals`, `effectiveUnit(unit, totals) → {hp, str, …}`, `buildKillOrder(config) → stackIds[]`,
  `sizeStacks(config, totals) → Result`, `simulateBattle(result, config) → Summary`, `searchPriority(config,
  objective, budget) → Result`. All functions are deterministic for the same inputs (no `Math.random`; searches use
  a seeded PRNG when randomised restarts are needed).
- The stacking core implements the flat-profile algorithm from PLAN §3.4 (binary search on an HP ceiling, per-rank
  decrement, round-robin repair to strict ordering and exact fill). It is the simplest algorithm that reproduces
  the fixture and is O(stacks × log capacity). A general optimiser is deliberately not introduced until a story
  shows the simple algorithm failing on a real case.
- Every engine call runs in a Web Worker (`src/worker/calc.worker.ts`) through a tiny typed request/response
  protocol with job ids, progress events and cancellation. Simple runs finish in milliseconds either way; using the
  worker uniformly avoids two code paths and keeps the UI responsive during searches. A same-thread fallback exists
  for tests and for environments without workers.
- Validation is fixture-driven: `tests/fixtures/*.json` hold (a) real TotalStack inputs/outputs captured from the
  author's account and (b) real in-game battle reports with known stacks. The battle model (PLAN §3.5) is marked
  *unvalidated* until at least three in-game reports match within rounding; the summary UI shows a "model
  confidence" note until then.
- Numbers: unit counts are integers; HP/strength are floats; money/time are integers in base units (silver, gold,
  seconds). Percentages are stored as entered (e.g. `39.5`) and converted once in `aggregateBonuses`.

## Consequences
- The engine can be tested exhaustively and quickly, reused by a CLI or another UI, and reviewed by players who do
  not know React.
- Worker protocol adds a little plumbing (serialisable inputs only: no class instances, no functions).
- Any change to engine behaviour must come with a fixture or a documented in-game observation.
