---
type: analysis
title: Performance Game Plan - Loop 00001
created: 2026-10-09
tags:
  - performance
  - kernel
  - workers
related:
  - '[[1_ANALYZE]]'
---

# Performance Game Plan

> Scope from the owner: the last feature (W17 progression advisor) added a lot of worker-pool compute
> on top of the main generation compute. Review the **kernel code** (AssemblyScript) and the **bottleneck**
> across main thread, calc workers and pool, and improve both.
>
> Note: `[AUTO_IMPLEMENT_COMPLEXITY]` / `[AUTO_IMPLEMENT_GAIN]` were not present in the agent prompt of this
> run, so no policy filter is applied here. Later documents must read them again or ask the owner.
> Hard constraint (project memory): **benchmark is non-regression** - a scenario must never get worse, outputs
> stay byte-identical (`tests/golden`, `tests/engine/plan-benchmark.test.ts`), workers never re-base pins.

## Codebase Profile
- **Language/Framework:** TypeScript (React 19 + Mantine 9, Vite, Vitest, Playwright) with an AssemblyScript/WASM
  battle kernel (`kernel/assembly/index.ts`, 2617 lines, `optimizeLevel 3`, stub runtime, `noAssert`).
- **Size:** ~30k lines of TS in `src/` (of which `src/engine/plan.ts` alone is 7748 lines) + 2.7k lines of AS.
- **Key Directories:** `kernel/assembly/` (battle, march, bill, sizePool, sizeStacks, rate/rateMany, enumerate,
  ladder*, raise*), `src/kernel/` (JS loader/packers: `index.ts`, `plan.ts`, `raise.ts`, `pack.ts`, `boot.ts`),
  `src/engine/` (plan, campaign, advisor, probes, retype, search, stacker), `src/worker/` (`pool.ts`, `client.ts`,
  `calc.worker.ts`, `jobs.ts`, `advisor.ts`, `captainAdvice.ts`, `captainUpgrades.ts`, `protocol.ts`),
  `tests/kernel/`, `tests/engine/plan-*`, `tools/theorycraft/`.
- **Performance Libraries / Tools:** WASM kernel (previous steps: plan x2.2, sizer x4.7, scorer x7.1, ~x8.2 total);
  `pnpm kernel:bench` (`tests/kernel/bench.test.ts`, battles/s); `pnpm bench:baseline`
  (`tests/engine/plan-benchmark.test.ts`); worker pool capped at `min(6, hardwareConcurrency-1)`, lazy start,
  60 s idle termination; per-worker kernel instance; wall-clock budgets (`budgetMs`) on advisor passes.

## Investigation Tactics

Ordered by likely impact. Each is discovery-only: find WHERE, not WHAT to fix.

### [EXECUTED] Tactic 1: Pool vs main-thread contention and oversubscription
- **Target:** CPU oversubscription and scheduling: pool of up to 6 workers + the page's main calc worker + raise
  clients + UI thread all share `hardwareConcurrency` cores; a pass "never sits in front of a Generate" only if
  cores are free. Also job granularity (a whole plan per job) and tail latency (one long job after the rest idle).
- **Search Pattern:** `poolSize`, `MAX_WORKERS`, `createCalcClient`, `createCalcPool`, `pool.map(`, `budgetMs`,
  `next += 1`/job dispatch loop in `run`, number of jobs vs workers in each `pool.map` caller.
- **Files to Check:** `src/worker/pool.ts`, `src/worker/client.ts`, `src/worker/calc.worker.ts`,
  `src/worker/advisor.ts`, `src/worker/captainAdvice.ts`, `src/worker/captainUpgrades.ts`, `src/ui/calcClient.ts`,
  `src/ui/sections/march/positionsSearch.ts`.
- **Why It Matters:** the user-visible bottleneck of the last feature; job ordering (longest first), pool size
  and pass concurrency decide wall-clock for advisor passes and whether Generate stutters while they run.

### Tactic 2: Redundant work across jobs and workers (no shared cache)
- **Target:** every worker owns its own kernel and caches; jobs from the same advisor pass repeat the same
  baseline plan, packing, table upload, ladder shapes and retype work.
- **Search Pattern:** `new Map(`, `retypeCache`, `countsJson`, `memo`, `cache`, per-job `createKernel(`/`compileKernel`/
  `new WebAssembly.Instance`, module recompilation per worker, `packTable`/`pack` calls inside loops.
- **Files to Check:** `src/engine/plan.ts` (cache sites near lines 6114, 6561), `src/engine/probes.ts`,
  `src/engine/advisor.ts`, `src/kernel/index.ts`, `src/kernel/plan.ts`, `src/kernel/boot.ts`, `src/worker/jobs.ts`.
- **Why It Matters:** same-input recomputation multiplies by pool size; wasm instance + table upload per job and
  per-worker `WebAssembly.compile` add startup latency and memory on phones.

### Tactic 3: JS/WASM boundary traffic and allocation
- **Target:** `.slice()` copies, fresh `Float64Array` views per call, `Record<string, number>` to packed
  `Float64Array` conversions in hot loops, views invalidated by `memory.grow`, `JSON.stringify` keys.
- **Search Pattern:** `new Float64Array(`, `.slice()`, `.set(`, `Object.entries(`, `JSON.stringify`, `structuredClone`,
  `memory.buffer`, per-call `alloc(` in `src/kernel/*.ts`; `postMessage` payload size in `client.ts`/`protocol.ts`.
- **Files to Check:** `src/kernel/index.ts` (lines ~151-250), `src/kernel/raise.ts` (~119-180), `src/kernel/pack.ts`,
  `src/kernel/plan.ts`, `src/engine/plan.ts` (6117, 6561), `src/worker/protocol.ts`, `src/worker/client.ts`.
- **Why It Matters:** the kernel got 7-8x faster, so boundary costs and GC are now a larger share of each call
  (exp 175 found 55/129 marches leave rating; diffuse JS churn was noted when porting paused at step 5).

### Tactic 4: Kernel inner loops - battle simulation and scoring
- **Target:** per-battle cost in `battle`/`battleMany`/`march`/`rate`/`rateMany`: `cell(type, field)` table lookups,
  repeated `Math.ceil`/`Math.floor`/division, `memory.fill` of `dead`/`acted` per round, f64 math where i32 would do,
  branchiness in target selection.
- **Search Pattern:** `cell(`, `chunks(`, `memory.fill`, `Math.ceil`, `Math.floor`, `/ ` inside loops, `load<f64>`/
  `store<f64>` in the round loop; compare against `kernel:bench` battles/s.
- **Files to Check:** `kernel/assembly/index.ts` lines ~143-500 (battle, battleMany, march, bill),
  ~961-1140 (rate, rateMany), `kernel/assembly/layout.ts`, `kernel/asconfig.json`.
- **Why It Matters:** every plan evaluates enormous numbers of battles; a few percent per battle compounds in
  every worker.

### Tactic 5: Kernel search routines - sizers, enumerate, ladders, raise
- **Target:** algorithmic cost of `sizePool`, `sizeStacks`, `enumerate`, `ladderGrid`/`ladderFinale` (memo copies
  of `rMemo*`), `raise*` (`CLIMB_SAMPLES`, random restarts), repeated `memory.copy` of whole vectors, linear scans
  over candidates, unsorted rank grouping (index.ts ~836).
- **Search Pattern:** nested `for` loops over `nCand`/`types`/`nSlots`, `memory.copy(`, memo tables
  (`rMemo`, `gWork`), `raiseRandom`, early-exit conditions, `converge`/restart counts.
- **Files to Check:** `kernel/assembly/index.ts` lines ~610-960, ~1141-1272, ~1273-2300, ~2271-2617.
- **Why It Matters:** after the scorer port these are the remaining kernel hot spots on ladders and the exact raise.

### Tactic 6: Build flags and codegen options
- **Target:** unused compiler/runtime features: WASM SIMD, bulk-memory already used, `--lowMemoryLimit`,
  initial/max memory, `converge: false`, `shrinkLevel 0`, `noAssert`, stub runtime (no GC) leaks across long jobs.
- **Search Pattern:** `asconfig.json` keys, `kernel/build/kernel.wasm` size, `--enable simd`, `memory.grow` /
  heap high-water mark; whether scratch pointers are reset between jobs in long-lived workers.
- **Files to Check:** `kernel/asconfig.json`, `package.json` (`kernel:build`), `kernel/assembly/index.ts` (`alloc`
  ~143), `src/kernel/layout.ts`.
- **Why It Matters:** cheap, low-risk wins (or proof there are none) and a guard against memory growth in
  workers kept alive for 60 s.

### Tactic 7: Engine hot paths in TypeScript (`plan.ts`, `campaign.ts`, `retype.ts`, `search.ts`)
- **Target:** the TS orchestration that still dominates after the kernel port: O(n^2) scans, sorts in loops,
  object spreads/`Record` rebuilds per candidate, `Date.now()` polling, per-march re-derivation.
- **Search Pattern:** `.sort(`, `...counts`, `Object.entries(`, `Object.keys(`, `.filter(` then `.map(` chains in loops,
  `Date.now()`, `for (const .* of .*)` nested in the ladder/trace code; profile with `node --cpu-prof` on the
  benchmark scenarios to rank by self time.
- **Files to Check:** `src/engine/plan.ts` (7748 lines), `src/engine/campaign.ts`, `src/engine/retype.ts`,
  `src/engine/search.ts`, `src/engine/stacker.ts`, `src/engine/probes.ts`, `src/engine/advisor.ts`.
- **Why It Matters:** `plan.ts` is the main-thread compute of every Generate and the body of every pool job.

### Tactic 8: Messaging, progress and main-thread UI cost during passes
- **Target:** progress callbacks and `onSettled` flooding React state, large result objects cloned between worker
  and page, re-renders of the advisor/plan cards while a pass runs, store derivations (`derive.ts`) recomputed per tick.
- **Search Pattern:** `onSettled`, `onProgress`, `SearchProgress`, `useStore(` selectors without equality, `set(` in
  zustand during passes, `useMemo` gaps in advisor/plan sections.
- **Files to Check:** `src/worker/client.ts`, `src/worker/protocol.ts`, `src/state/store.ts`, `src/state/derive.ts`,
  `src/ui/sections/**` (advisor, plan, march), `src/ui/calcClient.ts`.
- **Why It Matters:** keeps the page responsive while workers saturate the other cores.

### Tactic 9: Measurement gaps
- **Target:** missing numbers to rank the above: no per-job time breakdown (kernel vs JS vs boundary vs postMessage),
  no pool utilisation metric, benchmark runs on a single thread only.
- **Search Pattern:** `performance.now`, `Date.now`, `console.time` in `src/worker/*`, `tests/kernel/bench.test.ts`,
  `tests/engine/plan-measure.ts`, `tools/theorycraft/`.
- **Files to Check:** `tests/kernel/bench.test.ts`, `tests/engine/plan-measure.ts`, `tests/engine/plan-benchmark.test.ts`,
  `src/worker/pool.ts`, `scripts/plan-baseline.ts`.
- **Why It Matters:** every fix must be gated on an experiment plus benchmark (project rule); a profile taken first
  prevents optimizing the wrong layer.
