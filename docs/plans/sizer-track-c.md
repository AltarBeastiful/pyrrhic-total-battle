# Track C: the sizer's kernel cost (W20)

**Status: proposed 2026-10-11.** Follows `docs/plans/scorer-in-the-kernel.md` §6.1, which found that after the scorer
work the largest block left in the planner is the sizer's wasm, not any JavaScript around it.

**The rule is W16's, W18's and W19's:** nothing moves but the clock. Every step leaves every plan, stop, row and
benchmark figure **byte-identical** (`feedback-benchmark-non-regression`); a step that changes a reading is a trade
and goes to the owner. One test, written once, runs on the kernel and on the TypeScript reference
(`sizedShapeDeclined`, `decliningKernel`) and is red before it is green (`feedback-one-test-both-paths`). No cache
without a census (≥ 2 hits per entry and ≥ 3 % projected CPU, exp 196). Profiling code folds out of `pnpm build`.

## 0. What is measured

All on the timing fixture (`pyrrhic-my-account-2026-10-07.json`, never committed), one `planCampaign`.

| figure | value | source |
|---|---:|---|
| `sizerShape` calls that miss the memo | 12 031 | 197 crossings |
| `sizerShape` inclusive (JS wrapper + wasm) | 95.7 ms of 376 (25 %) | 197 profile after W19 |
| wasm self in the pool-CPU trace | `sizePool` 5.3 %, `journalDamage` 4.7 %, `killOrderBy` + `attackOrderOf` (sizer share unknown) | trace 20261011T174918 |
| per miss | ≈ 8 µs | 95.7 ms / 12 031 |
| `sizerShape` JS wrapper self | 8.5 ms (2.3 %) | `lay`, scratch fill, result objects |

Where the kernel does it (`kernel/assembly/index.ts`): `sizerShape` → `sizeStacks` → for each of the three pools a
`sizePool` (a bisection of up to 200 steps, each step a pass over the pool's slots; it breaks early at a fixed
point) → the ceilings and tens → **`relaxPreservation`** for the `msRelaxed` method only (`F_MS | F_RELAXED`): up to
500 attempts, each trying every hired slot with a `sizerScore` = `killOrderBy` + `attackOrderOf` + two
`journalDamage` walks. Then a final `killOrderBy`.

## 1. What each method shares (the reason to expect hits)

The three methods the planner asks (`SIZER_DEPTHS`: `elite`, `ms`, `msRelaxed`) differ only in the ceilings and in
the relaxation; the troop pool is sized **the same way under all three**:

- **Pool 0 (troops)**: `sizePool(slots of leadership units, housing.leadership, ceiling NaN)`. Its inputs are the
  prefix mask (`S_PREFIX` / `prefixAll`), the request's caps and the table. **Not** the hired counts. So it is the
  same answer for every call with the same prefix: the planner has 1 + `troops.length` prefixes, a dozen distinct
  inputs against 12 031 calls. Expected: > 99 % hits.
- **Pool 1 (authority)**: inputs are the hired caps of the authority types (their given counts), the capacity, and
  the ceiling (`troopFloor − 1` under `ms`, none under `elite`). The ceiling is a function of pool 0, so it is
  per prefix too. Hits depend on how often the same hired vector recurs per prefix: unknown, a census question.
- **Pool 2 (dominance)**: as pool 1, with the monster ceiling.
- **`relaxPreservation`** starts from pools 0–2 and walks; its start state is the `ms` answer. The `ms` and
  `msRelaxed` calls over the same hired vector and prefix share everything up to the walk, and the planner asks
  them back to back (`Object.values(SIZER_DEPTHS)` in the finale, the three depths in `evaluateVector`).

## 2. Steps

Each is its own story, gate and commit. **Stop after any step that buys < 3 % of the timing fixture's planner time**
(in-process A/B, arms interleaved in one process, ≥ 30 plans per arm, median and min, as W19 did; 197's profiled
time is ±6 % noise).

### C0. Census (half a day)

Counters in the profile kernel build only (`isDefined(CENSUS)`, as `cKillOrdersSizer`), reported by a theory file
in the style of 196 (`tools/theorycraft/203-sizer-census.test.ts`, `THEORY=1`), per plan, for both fixtures:

1. `sizerShape` calls by method (and by `prefixAll` or prefix length).
2. `sizePool` calls by pool, **bisection steps taken** (so the early break is counted), and the **distinct inputs**
   per pool: a hash of (slots' hp, cost, cap; capacity; ceiling). Hits = calls − distinct.
3. `relaxPreservation`: calls, attempts, `sizerScore` calls, and how many attempts end in "no candidate fits" or
   "no improvement" on the first try (the walk that does nothing).
4. Time per phase in the kernel (sum of `performance.now()` is not available in wasm: instead the sample share of
   `sizePool`, the relax walk and the final order from a profile build trace, read with
   `tools/perf-trace/subtree.py --under sizerShape`).
5. The census of the **result**: how many misses return a stack list identical to an earlier one (bits), which
   bounds what any pool-level cache can save.

*Gate:* the table lands in `tools/theorycraft/out/203-sizer-census.md`; each later step quotes its projected share
from it. A step whose projection is below 3 % is not built.

### C1. The troop pool, once per prefix (est. 2–4 %, from §1)

In `sizeStacks`, cache pool 0's `zCount` and `troopFloor` under a key of the slot rows (the leadership rows in
rank order, which the prefix mask and the request's units fix), their caps and the capacity. A hit copies the
counts instead of running `sizePool`. The kernel holds a small table (≤ 16 entries, linear scan, replaced
round-robin): no allocation per call, and the key is compared bit for bit, so a hit is the same answer by
construction. The cache lives in the instance's scratch, keyed per bound request; `bind` resets it.

*Gate:* `tests/kernel/sizer-pool-cache-parity.test.ts`: on every benchmark army and both fixtures, every recorded
`sizedShape` call (the recorder of `sizer-shape-parity.test.ts`) is answered with the cache and with it flushed
before the call: `Object.is` stacks. Plan level: the plan JSON is identical with the cache off (a kernel build
flag read through a header word, so one binary serves both arms). Red first on a deliberately stale key (cap left
out).

### C2. Pools 1 and 2 by their inputs (est. 1–3 %, only if C0 shows hits)

The same table for the authority and dominance pools, keyed by (rows, caps, capacity, ceiling). The caps are the
hired counts, so hits are those calls whose hired vector recurs per prefix and method; C0 §2 says how many. Not
built below the 3 % line.

### C3. A bisection that starts from a bracket (est. 1–3 %)

`sizePool` bisects `[0, (capacity + 1) · maxHp]` for up to 200 steps (fixed-point break). The result `low` is the
largest `h` whose `usedAt(h) ≤ capacity`, and `usedAt` is monotone non-decreasing in `h`. Two exact shortcuts, both
reaching the **same fixed point** `low`:

1. Start from the previous call's `[low, high]` for the same pool where the new capacity and caps give
   `usedAt(low_prev) ≤ capacity < usedAt(high_prev)`, verified with two evaluations: if the bracket holds, the
   bisection continues from it. The bisection's trajectory differs from the full one, but the answer is the same
   only if the loop converges to the same bit pattern; it does when both reach the exact adjacent-doubles fixed
   point (the engine's own 200-step loop does). **This must be proved on data, not assumed**: the parity test
   compares `low` bit for bit over every recorded call, and a single difference stops the step.
2. Early exit when `usedAt(ceiling) ≤ capacity` (already there for the ceiling case).

*Gate:* as C1, plus a door-level test of `sizePool` against the engine's `sizePool` (the existing
`tests/golden/sizepool.json`) and the recorded calls.

### C4. The relaxed walk, incrementally (est. 2–5 %, the riskiest)

`relaxPreservation` scores every candidate of every attempt from scratch (`killOrderBy` over all slots, attack
order, two journals). Per attempt only one slot's count changes by `step`, so:

- the **kill order** moves one stack: P2.1's incremental kill order (`e2c03f5`, −14.6 % on the raise) is the model;
- the **attack order** sorts by `count × T_STR`: one stack moves;
- the two journals still walk, but a candidate whose bound cannot beat `chosenAvg` need not be scored: the
  `ms`-relaxed score is `min` and `avg` of the two journals, and a candidate's damage cannot exceed an upper bound
  from its stacks' strikes. **Not exact unless the bound is proved**; leave to C0 §3 to say whether any attempt
  prunes.

Take the first bullet only (exact, as P2.1 was) unless C0 shows the walk is long. The relaxed method is one of
three, so the share is bounded by C0 §1.

*Gate:* as P2.1: byte-identical on the 18 armies and both fixtures, a shadow check in the profile build that
recomputes the full order and compares (`6385674` for the raise is the pattern).

### C5. The JS wrapper (est. ≤ 2 %)

`sizerShape` in `src/kernel/plan.ts` is 8.5 ms self per plan: `mark.fill(0)`, `shape.cap.set(caps)`, a loop over
the hired stacks, result objects for rungs and hired stacks. The memo wrapper above it (`sizerKeptOf`) hashes and
compares the stacks. Candidates: write the hired counts straight from the memo's key arrays, build the result
stacks lazily (the callers copy them again: `copyStacks`, 13.7 MiB a plan). Only after C1–C4, since they change
how often this runs.

## 3. Gates and the final measure

Every step: `pnpm typecheck`, `pnpm lint`, `prettier --check`; the full suite (≈ 265 s; same count, no red but the
known `raise-census`); `tests/kernel/**` parity; benchmark-equivalence over the 18 armies figure for figure; no
`tools/theorycraft/out/benchmark-latest.*` change; the in-process A/B recorded here with its runs; the `release`
and `profile` kernel builds both rebuilt and committed together if `kernel/build` is tracked.

| | HEAD 8f6b546 | after C1 | after C2 | after C3 | after C4 | after C5 |
|---|---:|---:|---:|---:|---:|---:|
| timing plan, in-process median / min (ms) | 311 / 302 | | | | | |
| `sizerShape` inclusive (197) | 95.7 ms | | | | | |
| kernel wasm self (197) | 143 ms | | | | | |

**Expectation (a ceiling):** `sizerShape` 25 % → 10–15 % of the profiled time, planner wall −10 to −15 % on this
account. The honest risk is C3 (exactness of a different trajectory) and C4 (a kill-order shadow that must stay
green on every army).

## 4. Order, and what is not in this plan

C0 → C1 → (C2 if hits) → C3 → C4 → C5. Playbook to follow in `.maestro/playbooks/2026-10-11-Sizer-Track-C/`, one
document per step, orchestrator + Opus workers with compact reports.

Not in this plan: the Tight raise's `recoveryOf` / `killOrderBy` (24.6 % of pool CPU in the trace; its own census
first, `scorer-in-the-kernel.md` §3 Track B), the scorer's JS (W19, done: what is left is < 1 % in the ladder path),
`retypeRow` (6 %), `undominatedRows` (1 %), GC (12 %: allocation per plan is 250 MiB, of which the scorer's
sizer-depth shapes are 57 MiB and are rebuilt per memo miss), and the page's main thread.
