---
type: analysis
title: Performance Candidates - Loop 00001
created: 2026-10-09
tags:
  - performance
  - candidates
related:
  - '[[LOOP_00001_GAME_PLAN]]'
---

# Performance Candidates

> `[AUTO_IMPLEMENT_COMPLEXITY]` / `[AUTO_IMPLEMENT_GAIN]` were not in the agent prompt of this run (as the game plan already noted); no policy filter was applied.

---

## Tactic 1: Pool vs main-thread contention and oversubscription - Executed 2026-10-09

### Finding 1: Serial baseline phase runs on one worker while the others sit idle (or are still booting)
- **File:** `src/worker/advisor.ts`, `src/worker/captainAdvice.ts`
- **Line(s):** advisor.ts 86-90; captainAdvice.ts 154-157 (baseline), 176-182 (screen)
- **Pattern Found:** `await pool.map([baselineJob], ...)` before the fan-out; in `runCaptainAdvice` a second single-job `pool.map([screenJob])` (the whole 1 140-trio screen is ONE job by design) before the confirm fan-out.
- **Context:** Every advisor pass starts with one whole-campaign plan (the baseline), then fans out probes that need its `stops`. During the baseline, `size-1` workers do nothing, and the captain pass has two such serial phases. The baseline is the critical path of every pass (cf. 12.7 s per Tight stop on wide boxes).

### Finding 2: `start()` spawns and boots all `size` workers even when the first pass is one job
- **File:** `src/worker/pool.ts`
- **Line(s):** 79-87 (`start`), 96 (`start()` in `run`)
- **Pattern Found:** `while (clients.length < size) clients.push(createClient())` on the first `map`, whatever `jobs.length` is.
- **Context:** The first `map` of a pass is the one-job baseline, yet up to 6 module workers are created at once; each runs `loadKernel` (fetch + `WebAssembly.compile` + instantiate, `calc.worker.ts` 37) concurrently with the baseline's own worker, competing for cores and memory with the baseline and the page. Workers could be started `min(size, jobs.length)` at a time, so the baseline gets a quiet machine and the fan-out grows the pool.

### Finding 3: Pool size ignores the other worker clients the page already owns
- **File:** `src/worker/pool.ts`; `src/ui/calcClient.ts`; `src/ui/sections/march/raiseSearch.ts`; `src/ui/sections/march/positionsSearch.ts`
- **Line(s):** pool.ts 56-63 (`poolSize`); calcClient.ts 10-12; raiseSearch.ts 126; positionsSearch.ts 139
- **Pattern Found:** `Math.min(6, hardwareConcurrency - 1)` while the page also holds the shared `getCalcClient()` worker, a raise client and a positions client (each its own worker with its own kernel), plus the UI thread.
- **Context:** On an 8-core machine that is 6 pool workers + up to 3 other busy workers + main thread = oversubscription when a Generate/raise/positions search runs during an advisor pass; the comment "a 20 s pass never sits in front of a Generate" holds for memory/queues but not for CPU. Phones (`hardwareConcurrency` 8 on 4 big + 4 little cores) get 6 workers on mixed cores. No priority or pass-concurrency limit exists.

### Finding 4: Jobs are dispatched in probe order, not longest-first
- **File:** `src/worker/pool.ts`; `src/worker/advisor.ts`; `src/worker/captainUpgrades.ts`
- **Line(s):** pool.ts 123-127 (`next += 1` lane loop); advisor.ts 105-118; captainUpgrades.ts 182-208
- **Pattern Found:** lanes pull `jobs[next]` in the caller's order; `PoolJob` carries no cost estimate.
- **Context:** One long whole-campaign job started last leaves the other workers idle at the tail (tail latency); with ~30 probes over 6 workers, ordering by expected cost (wide boxes, Tight stops, big-troop families) bounds the makespan. Results already come back in job order, so reordering dispatch is answer-neutral.

### Finding 5: A cut or abort terminates every worker, throwing away warm kernels
- **File:** `src/worker/pool.ts`
- **Line(s):** 140-145 (`if (pass.signal.aborted) { stopAll(); ... }`)
- **Pattern Found:** `stopAll()` disposes all clients on any abort, including the normal budget cut (`CAMPAIGN.budgets.extra`) that the engine design expects.
- **Context:** The next pass pays the Finding 2 boot cost again for all workers, even those that finished their jobs and were idle. Only workers still inside a job that ignores its signal need replacing. Interacts with the 60 s idle teardown (`IDLE_MS`), which already trades startup cost for phone memory.

### Finding 6: Fixed three-phase barriers between sub-passes of one pass (budget arithmetic and idle gaps)
- **File:** `src/worker/captainUpgrades.ts`, `src/worker/captainAdvice.ts`
- **Line(s):** captainUpgrades.ts 165 (screen `map`) and 220 (plan `map`); captainAdvice.ts 178, 204
- **Pattern Found:** a `pool.map` screens, `await`s all, then a second `pool.map` plans; `onSettled` counts only whole-job completions.
- **Context:** Plan jobs of an ask whose screen already finished cannot start until every other ask's screen is done, so workers idle at each barrier (same tail issue as Finding 4, once per phase). Also `total` for progress is computed up front and cannot reflect a cut phase.

### Tactic Summary
- **Issues Found:** 6
- **Files Affected:** 7 (`src/worker/pool.ts`, `advisor.ts`, `captainAdvice.ts`, `captainUpgrades.ts`, `src/ui/calcClient.ts`, `src/ui/sections/march/raiseSearch.ts`, `positionsSearch.ts`)
- **Status:** EXECUTED
- **Not measured:** no timings were taken (that is Tactic 9); gains are structural estimates. All fixes must keep results identical across pool sizes (pool.test.ts already pins job-order results).
