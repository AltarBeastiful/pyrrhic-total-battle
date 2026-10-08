# Phase 01: Work caps and the worker pool (W17 steps A0 and A)

This phase builds the infrastructure every progression-advice probe runs on: a deterministic work cap for clock-bounded loops (A0) and a pool of calc workers that maps many independent plans in parallel (A). It ends with a runnable timing report and a pool that returns byte-identical plans to the single worker. Source of truth: `docs/plans/progression-advisor.md` §1 and §2.

**Rules for every task in this and later phases (the owner's constraints):**
- Benchmark ratings on the marches must NEVER regress. If a gate fails, stop and fix the cause. Never re-baseline a pin, golden or `benchmark-latest`, and never loosen a test; only the owner registers a new baseline.
- Tests must pass on the kernel path (the TS engine is retired; no dual-path testing). Run `pnpm kernel:build` before tests when `kernel/` changed.
- Before creating anything new, search `src/` for an existing pattern (`src/worker/client.ts`, `jobs.ts`, `protocol.ts`, `raiseSearch.ts`) and reuse it.
- UI work cites `docs/design-rules.md` and copies the existing look; labels say "merc", not "hired" (except the act of hiring).
- Done = `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and the affected tests pass. Commit once per completed task; end each commit message with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>` (the owner's convention, not the Claude Code trailer).
- Experiment reports go to `out/<n>-<slug>.md` (next free number) with YAML front matter (`type`, `title`, `created`, `tags`, `related` using `[[wiki-links]]`) and measured figures only.

## Tasks

<!-- MAESTRO:MODEL tier="high" effort="high" reason="Touches the engine's clock-bounded loops; a wrong cap silently changes plan answers, and goldens must stay byte-identical, so this needs careful reading of plan.ts and retype.ts." -->

- [x] A0: add a work cap to every clock-bounded loop the engine uses in `planCampaign`. First read `src/engine/plan.ts` (around the `Date.now() + budgetMs` and `stop()` calls, the `RETYPE_SHARE` re-typing clock) and `src/engine/retype.ts`, `src/config.ts` (`CAMPAIGN`). Then:
  - Introduce an optional work-count cap (candidates / restarts / plans, never a duration) that pool jobs pass; `budgetMs` stays only as an outer safety cut
  - Add a top-level `budgetBound` flag on `CampaignPlan` (today only `retype.cut` exists) that is true when any clock cut fired
  - Defaults must leave every existing call byte-identical: run `pnpm bench:baseline`-style checks via `pnpm vitest run tests/engine/plan-benchmark.test.ts` and the golden tests and confirm zero reading moved
  - Fix the stale comment in `src/config.ts` (~lines 249-263) saying the 20 000-dominance camp is budget-bound; measure and state the current figure instead
  - Add unit tests proving the same input gives the same plan with a tiny and a huge `budgetMs` when the work cap is set

<!-- MAESTRO:MODEL tier="medium" effort="medium" -->

- [x] Add `CAMPAIGN.budgets.extra` (20 000 ms, the one wall-clock budget for the whole extra pass) to `src/config.ts` next to the existing budgets, with a comment that it is a safety cut reported as `cut: true`, never a search parameter. Add a `markerRates` accessor export if `MARKER_RATES` is not exported (the advisor reads `CAMPAIGN.markerRates` with `rate()`; verify the existing export first and reuse it).

> Note (A0, 2026-10-08): no new cap was needed. The search is already bounded by counts (`PLAN_LIMITS`, `retype.ts` `EXHAUSTIVE`/`CLIMB_STEPS`) and the clock is only an outer cut. Pool jobs pass **no `budgetMs`** (deterministic); the 20 s is enforced by the pool. `CampaignPlan.budgetBound` is present only when the clock fired, so goldens stay byte-identical. `CAMPAIGN.markerRates` is already exported. Test: `tests/engine/plan-budget-bound.test.ts`.

- [x] Implement `src/worker/pool.ts`: a lazy pool of `N = clamp(navigator.hardwareConcurrency - 1, 1, 6)` module workers reusing the existing `calc.worker.ts` protocol:
  - API `pool.map(jobs: CalcRequest[], { deadline, signal }) => Promise<(Result | Cut)[]>`, results in JOB ORDER regardless of finishing order; shared queue, idle workers take the next job in order
  - Detect the silent inline fallback in `createCalcClient` (`client.ts`) and run with one worker or refuse; never an inline pool that freezes the UI
  - `KernelUnavailableError` still reaches the WasmRequired panel as today
  - Cooperative cancel via the existing `cancel` message; a new Generate cancels the whole pass; a job that throws must not kill the others
  - Workers start only on demand and are terminated after ~60 s idle; no `Worker` available means the same jobs run sequentially on the main thread with the same deadline
  - The pool is separate from the page's main worker and from the raise client (`raiseSearch.ts`)

- [x] Write `src/worker/pool.test.ts` in the style of `client.test.ts`: order preserved under shuffled finishing order, cancel stops every job, a throwing job leaves the others intact, deadline cut yields `cut` entries rather than errors, idle termination, sequential fallback. Run them and fix failures.

- [x] Write a parity test (new file under `tests/`, following `tests/golden/` conventions) that plans the 18 benchmark armies through the pool at N = 1, 2 and 4 and asserts byte-identical plans to the single-worker/direct `planCampaign` result with the work cap set. Run it on the kernel path and fix any divergence in the engine, never in the expectation.

- [x] Write experiment `out/<n>-the-pool.md` (script under `scripts/` or `tests/experiments/` following the existing experiment pattern): pool speed-up for N = 1, 2, 4, 6 over the 18 armies plus the 20 000-dominance camp, reported in CPU-ms and wall-ms, with the `budgetBound` count. Include front matter and a `[[Progression-Advisor-Plan]]` link; update `docs/plans/progression-advisor.md` status line with a one-line pointer to the report.

> Note (A, 2026-10-08, S-150): jobs are `(client, signal) => Promise<T>` over `CalcClient`, not raw messages. Parity is checked in experiment 190 with real workers in Chromium (19/19 identical to Node at N = 1, 2, 4, 6, `retype.ms` aside); under Node, `pool.test.ts` checks 1 vs 3 lanes on real plans. Pre-existing red: `tests/kernel/parity.test.ts` layout (RAISE_TIGHT_DAMAGE missing from `src/kernel/layout.ts`, from 1cb2ac9).

- [x] Run the full gate: `pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`. Confirm the regenerated benchmark moved no reading (timings and stamp only). Add the story to `docs/PLAN.md` as the next free `S-nn` row in the style of the existing rows (measured figures, what is left open), then commit.
