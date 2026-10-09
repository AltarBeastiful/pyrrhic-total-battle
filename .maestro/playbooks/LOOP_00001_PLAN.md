---
type: analysis
title: Performance Plan - Loop 00001
created: 2026-10-09
tags:
  - performance
  - plan
related:
  - '[[LOOP_00001_CANDIDATES]]'
  - '[[LOOP_00001_GAME_PLAN]]'
---

# Performance Plan

---

## Pool boots all workers on the first `map` - Evaluated 2026-10-09 (Tactic 1, Finding 2)

**Source:** `LOOP_00001_CANDIDATES.md`, Tactic 1, Finding 2
**File:** `src/worker/pool.ts`
**Line(s):** 79-87 (`start`), 96 (`start()` in `run`)

### Current Code
```ts
const start = (): CalcClient[] => {
  if (clients.length > 0) return clients;
  const first = createClient();
  clients = [first];
  if (first.mode === 'inline') return clients;
  while (clients.length < size) clients.push(createClient());
  return clients;
};
```

### Proposed Fix
```ts
const start = (wanted: number): CalcClient[] => {
  if (clients.length === 0) clients = [createClient()];
  if (clients[0]?.mode === 'inline') return clients;
  while (clients.length < Math.min(size, wanted)) clients.push(createClient());
  return clients;
};
// run(): const workers = start(jobs.length);
```

### Assessment
- **Complexity:** LOW - ten lines in one function; the lanes already iterate over whatever `start` returns, and `pool.test.ts` pins job-order results across sizes.
- **Gain:** LOW - the premise is shaky. The surplus workers boot *while the one-job baseline runs* (a baseline is seconds long, a kernel load is tens of ms to a few hundred ms), so by the time the fan-out starts every worker is warm and the boot is hidden. Booting lazily would move that cost onto the critical path of the fan-out (the second `map`), which can only make the pass slower on a machine with free cores. The only win is on core-starved machines (phones, 2-4 cores) where the boots steal time from the baseline, and that is unmeasured (no timings yet; Tactic 9). Memory is not saved either, because the fan-out creates the workers anyway.
- **Dependencies:** none beyond `pool.ts` and a new test (`createClient` call count equals `min(size, jobs.length)` on a one-job map, then grows on the next).

### Implementation Notes
Re-evaluate only if Tactic 9 timings show the baseline slowing down measurably while workers boot (compare baseline wall time with 1 vs 6 booted workers on a 4-core profile). A better variant then is to keep eager boot but start the surplus workers after the baseline's worker has finished its own `loadKernel`. Do not combine with Finding 5 (keeping warm workers on a cut), which is the real lever on repeated passes.

### Status: WON'T DO - Low impact (hidden boot cost, likely regression on the fan-out's critical path)
