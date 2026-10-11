# The scorer in the kernel: what is left of `evaluateVector` after W18 (W19)

**Status (2026-10-11, uncommitted): P0 done · P1 already shipped · P2 and P3 shipped in the JS-side form that measured best · P4 tried twice and dropped (slower) · P5 not started, its premise gone.** Owner, 2026-10-11: *"in my profiling it seems evaluatevector is heavy in the
profile and even calls itself. Would it be a good candidate for moving to kernel entirely?"* — then, after the
analysis of `Trace-20261011T174918.json.gz`: *"write a concrete plan for this"*.

**The rule is W16's and W18's: nothing moves but the clock.** Every step leaves every plan, stop, position row,
advisor row and benchmark figure **byte-identical** (`feedback-benchmark-non-regression`); a step that changes a
reading is a trade and goes to the owner, never done by default. One test, written once, runs on the TS and the
kernel projects and is red on both before it is green on both (`feedback-one-test-both-paths`). No cache without
a census (≥ 2 hits per entry and ≥ 3 % projected CPU, exp 196). Profiling code folds out of `pnpm build`.

## 0. What the trace says

`Trace-20261011T174918.json.gz` (Chrome JSON, dev build with function names, the owner's account, "Profile
everything"): **16.1 s wall, 76.9 s pool CPU on 6 workers (79 % efficient)**, 391 154 pool-worker samples.
Read with `tools/perf-trace/analyse.py` plus three one-off scripts (P0 commits them). Shares are of all pool
samples.

### 0.1 Where the pool CPU goes

| part | share | note |
|---|---:|---|
| `planCampaign` | 66.6 % | JS 39.0, wasm 19.6, builtins 8.0 |
| Tight raise (`positionTrades`) | 24.6 % | 24.0 wasm: `killOrderBy` 7.2, `recoveryOf` 5.4, `raisePointSlots` 2.3, `raisePairwise` 2.3, `raise` 2.1 |
| other | 8.7 % | GC 4.8 |

Under `planCampaign` (JS + builtins / wasm, subtree of each frame):

| frame | JS + builtins | wasm | self |
|---|---:|---:|---:|
| **`evaluateVector`** | **26.5 %** | 17.7 % | 3.7 % |
| `scorer` | 19.0 % | 17.5 % | 3.5 % |
| `sizer` (memo miss → `sizerShape`) | 6.1 % | 11.3 % | 2.1 % |
| `finish` (incl. `finaleFor`) | 4.5 % | 2.0 % | 0.8 % |
| `retypeRow` | 3.5 % | 0.7 % | |
| `undominatedRows` | 2.6 % | 0 | 1.2 % |
| `record` / `recordReplay` | 1.9 % | 0.4 % | 1.1 % |
| `summarise` | 1.9 % | 0 | 0.7 % |

Inclusive: `evaluateVector` 44.1 %, `scorer` 36.5 %, `sizer` 17.5 %, `sizedShape` 13.7 %, `gridOnKernel` 7.9 %,
`finish` 6.5 %, `finaleFor` 5.5 %, `marchOf` 4.6 %, `ratioOf` 2.2 %.

### 0.2 Reading

- **The self time of `evaluateVector` is small (3.7 %); the JS under it is not (26.5 %).** It is a long tail:
  `scorer`, `shapeOf`, `finish`, `finaleFor`, `marchOf`, `marchRecovery`, `record`, `ratioOf`, `copyStacks`, `build`,
  `countsKey`, and the builtins (Map, sort, spread) and GC they cause. No function in a top-10 list; the whole
  subtree is the cost.
- **The recursion is one level.** `evaluateVector(mercs, undefined, true)` (the derived vectors, `plan.ts:4087`)
  passes `laddersOnly`, which the same function reads to stop. It is not a search; it is the derived-vector
  re-score of C1, half of whose calls (4 408 of 9 532 per timing plan) are memo replays.
- **Its wasm half is real work, not glue:** `sizerShape` 10.6 % (`sizePool` 5.2, `journalDamage` 2.8),
  `ladderGrid` 2.1 %, `march` 2.4 %. Porting JS cannot touch it; step C below can.
- **The Tight raise is the largest single block and it is all wasm** (24.6 %): `recoveryOf` and `killOrderBy`,
  called from `position`, recomputed per probed position.
- **What W18's Drill 04b said still holds:** crossings are not the cost (the glue was ≤ 2.6 % / ≤ 7.9 %). The
  cost is the JS built around each crossing. That is why the ports below *remove the objects*, not only the calls.

## 1. The design: figures cross, objects stay

Today a vector's 80 ladder shapes are computed in one kernel call (`lk.grid`), then each shape crosses back
**one by one**: `shapeOf` builds `rungs[]` and `vector[]`, a `KernelMarch` that bills in its own crossing
(`bill` 20 310 per timing plan), `finish` walks the finale, `evaluateVector` builds a `Candidate`, `record`
prices its ratios, and the peaks (`light`, `heavy`, `pick`, `tight`) keep a handful of the 80. Nearly all of
that is built to be thrown away.

The plan: **the kernel hands back each shape's figures as one flat block, and JS builds a `Candidate` only for a
shape something keeps** (the same lazy rule as `replayed` in C2). The search's bookkeeping (`derivedMemo`, the
peaks, the learned rung order, `ProbeInput.shown`) stays in JS, as Drill 05 decided: it holds JS objects other
passes keep, and `evaluateVector`'s own orchestration is 3.7 % self.

## 2. Steps

Each step is its own story, gate and commit. **Stop after any step that buys < 3 % of the timing fixture's
planner CPU** (in-process A/B, alternating door/declined in one process, ≥ 3 runs; 197's profiled time is ±6 %
noise, so judge by A/B, as P3.4 did). The estimates are ceilings from §0, not promises.

### P0. Make the measurement repeatable (half a day)

1. Commit `tools/perf-trace/subtree.py`: per-function **self** ranking, **JS+builtins vs wasm** under a list of
   frames, **kernel self by nearest JS caller** and **builtins/GC by nearest JS frame** (the three scripts used
   for §0, in `analyse.py`'s style, standard library only for JSON traces). Document in the README.
2. Record the baseline on HEAD: this trace's figures (§0) plus a **production** trace from
   `e2e/profile-trace.spec.ts` (the dev trace over-weights the page; the pool is unaffected).
3. Per-plan call counts (one-off counted run, not committed, as in 197): `shapeOf` calls, `bill` crossings,
   `finish`, `finaleFor` hits/misses, `record`, `ratioOf`, `Candidate`s built vs kept per vector. This decides
   whether C is worth it before it is written.

*Gate:* README updated; the baseline table lives in §4 below.

### P1. The grid billed and read as figures (est. 3–5 %)

`lk.grid` already lays every shape; make it also **bill each shape in the same call** (the old Drill-05 step 2:
`bill` 20 310 crossings a plan), and write per shape into the grid view: status, damage, hired damage, rounded
silver, gold, mercLost, strikes, `KernelMarch`'s bill (silver, gold, dragon coins, seconds). Then `shapeOf`
reads figures instead of crossing, and `KernelMarch` builds its stacks lazily (only for a shape that leaves the
vector's evaluation).

*Kernel:* `ladderGrid` writes `G_GRID_OUT` rows with the bill (`recoveryBill` already exists, `kernel/assembly/index.ts`).
*TS:* `src/kernel/plan.ts` `gridView()`, `shapeOf`, `KernelMarch.billedSilver`.
*Gate:* `tests/kernel/ladder-kernel.test.ts` and the plan-equivalence golden unchanged; a new
`tests/kernel/grid-bill-parity.test.ts` holds each shape's figures `Object.is` to the per-shape bill on every
benchmark army and both fixtures; red first on a deliberately broken bill (e.g. no dragon coins).

### P2. The finale in the kernel (est. 3–5 %)

`finish` is 6.5 % inclusive, `finaleFor` 5.5 %: the spent-stock bookkeeping (`spentStock`, `chunks`,
`sustain`), the leftovers, the cached finale (`cacheHit`/`cachedFinale`, keyed by marches and the vector's
counts when there is no silver budget), then `total`/`silver`/`mercLost`. The finale **grid** is already a kernel
call (`ladder.finale`); the port is what surrounds it.

- New door `finaleFigures(marches, vector counts, sustain, stock, silverLeft)` → status + the finale's figures
  and its rungs/sheltered vector in the ladder scratch. The **cache stays in JS** keyed as today (a hit costs no
  crossing; `saveFinale`/`restoreFinale` keep their shape, so the derived memo is untouched).
- With a silver budget the finale depends on each ladder's cost (`silverBudget - marches * march.silver`), so the
  door takes `silverLeft` per call; the no-budget path is the one the profile exercises.
- `finish` then only adds `marches * march.damage + finale.damage` and friends, in the engine's order.

*Gate:* op-for-op translation (the kernel-port rule: same f64 operations, same association); parity test on the
recorded `finaleFor` calls of every army and both fixtures (door level) and the plan JSON with the door and
declined (plan level), as `sizer-shape-parity.test.ts` does. `decliningKernel` gets `finaleFigures: () => null`.

### P3. Lazy candidates: `evaluateVector` reads figures (est. 5–8 %)

With P1 and P2 each grid shape is a row of numbers. Rewrite the grid loop of `evaluateVector` (the
`for depth / for scale` body, `plan.ts:4034–4060`) to work on the row:

- `pick` (strict `>` on `total`), `tight` (`depth > tight.depth` at scale 1), the `light`/`heavy` peaks of
  `record` (`total / spent`, `perSilver`, `perMerc`, strict `>`, in the same order) are decided **on the row's
  numbers**; `ratioOf`'s three figures come from the row (`marches * round(silver) + finale.silver`,
  `marches * mercLost + finale.mercLost`, `marches * round(hiredDamage) + finale.hiredDamage`).
- A `Candidate` object is built only for the shape that `pick`, `tight`, `light`, `heavy` or `consider` keeps, and
  for the shapes `booked` keeps for the derived memo (`DerivedScore.shapes`: built lazily, the memo entry stores
  rows and the few materialised candidates, and `recordReplay` replays rows).
- The derived-vector recursion (`derived`, `sameJoinedCounts`) is unchanged.

This is the step that removes the allocation (builtins 8.9 % self, GC 4.8 % of the trace), not only calls.
*Risk:* `record`'s copies (`{ ...candidate, spent }`) are what the peaks hand to later passes; the kept copy must
be identical in every field, key order included, so the plan JSON is the same. *Gate:* plan JSON identical with
the old loop (kept as `evaluateVectorDeclined` behind a module flag, as `sizedShapeDeclined`) on all 18 armies
and both fixtures; the benchmark-equivalence run unchanged; A/B ≥ 3 %.

### P4. The sizer branch after the memo (est. 2–4 %)

Depth ≤ 0 shapes (the sizer's own) run `scorer`'s JS tail on **every** call, memo hit or miss (22 732 calls
against 12 031 misses per timing plan): the last-stack-wins scan, `lastsMarches` against `sustain`, the second
`shelterUnder`, `fitsHousing`, `marchOf` + bill, the budget check. New door `sizerTail(sized rungs, sized mercs,
marches, budget)` taking the memo's answer (rows + counts) and answering in the ladder scratch, `-1` for no shape.
The sizer memo itself stays in JS (a hit costs no crossing for the memo; one for the tail).

*Gate:* as P2. Do P4 **after** P3: P3 changes what a "shape" is on the JS side, and the tail should write the
same row.

### P5. Only if P1–P4 leave `evaluateVector`'s JS subtree ≥ 15 % of planner CPU: the whole loop

Move the depth × scale loop of `evaluateVector` (not its memo or its recursion) into one `evaluateGrid` kernel
call returning rows plus `pick`/`tight` indices. Not planned: the thin remainder is the orchestration that Drill
05 chose to keep. Re-measure at the end of P4 and decide then.

## 3. Two parallel tracks, not ports (each its own story, owner-gated where it moves a reading)

**Track B: the Tight raise's `recoveryOf` and `killOrderBy`** (24.6 % of pool CPU, all wasm; `recoveryOf` 5.4 %
and `killOrderBy` 7.2 % called from `position`). P2.1 made the kill order incremental (−14.6 %). Next:
1. Census first (exp 196's rule): per `position`, how many `recoveryOf` calls have the same input as an earlier
   one in the same raise; keep only if ≥ 2 hits per entry and ≥ 3 % projected CPU.
2. If it passes: an incremental `recoveryOf` for the moved slot only (exactly equal, f64 for f64), gated
   byte-identical like P2.1. **Not a trade** unless it changes a figure.

**Track C: `sizerShape`'s kernel cost** (13.3 % incl, `sizePool` 5.2 %, `journalDamage` 2.8 %, ~12 000 memo
misses a plan). Candidates, in order of safety: (1) `sizePool` bisection warm-started from the previous call's
bounds when the pool and caps match (exact if the fixed point is the same; W16's "stops at fixed point"
already did half); (2) skip the `journalDamage` battle where the shelter step cannot change the answer. Each is
an exactness-gated kernel change with a parity test over every recorded `sizerShape` call.

## 4. Gates and the final measure

Every step: `pnpm typecheck`, `pnpm lint`, `prettier --check`; the full suite on both projects (251 s; same
count, no red); `tests/kernel/**` parity; benchmark-equivalence over the 18 armies figure for figure; no
`tools/theorycraft/out/benchmark-latest.*` change; the in-process A/B recorded here with its three runs.

| | trace 20261011T174918 (HEAD 1c2be3b + `retypeWalk`) | after P1 | after P2 | after P3 | after P4 | final trace |
|---|---:|---:|---:|---:|---:|---:|
| pool CPU | 76.9 s | | | | | |
| wall | 16.1 s | | | | | |
| JS+builtins under `evaluateVector` | 26.5 % | | | | | |
| GC | 4.8 % | | | | | |
| timing plan, in-process | | | | | | |

**Expectation (a ceiling, not a promise):** JS under `evaluateVector` 26.5 % → ~10 %; pool CPU −12 to −18 %;
wall −1.5 to −2.5 s on this account. The honest risk is P3: it is the largest gain and the one that touches how
`record` hands objects to later passes.

## 5. Order, and what is not in this plan

Order: P0 → P1 → P2 → P3 → P4 → re-measure → (P5?). Tracks B and C can run beside, since they touch the raise
and the sizer kernel, not the scorer. Playbook to follow in `.maestro/playbooks/2026-10-11-Scorer-In-The-Kernel/`
(one document per step, as DRILL-01…06), orchestrator + Opus workers with compact reports.

Not in this plan: the exhaustive re-typing walk (done, `retypeWalk`), the climb (`climb` 3.3 % incl; re-measure
after P4), `undominatedRows` (2.6 %), `summarise` (1.9 %), the pool's scheduling trades P1.3/P1.4 (on branches
for the owner), the page's main thread (needs a production trace first), and the whole-`plan.ts` port (revisit
when the scores have settled and the baseline is registered, `project-performance-roadmap`).

## 6. What was done (2026-10-11)

- **P0.** `tools/perf-trace/subtree.py` committed to the tree (README section); on `Trace-20261011T174918.json.gz` it
  reproduces §0 within 0.5 points (`evaluateVector` 44.4 % inclusive, JS 24.9 + builtins 1.8, wasm 17.8, self 3.7).
  No production trace was recorded.
- **P1 was already in the code.** `ladderGrid` writes each shape's bill (`out[figuresAt + 6]`) and `KernelMarch.bill`
  only stores it; `KernelMarch` already builds its stacks lazily. The remaining `bill` door calls (20 310 a plan) are
  `ratioOf`'s fallback for candidates the grid did not bill. Nothing to port.
- **Counted run, timing fixture, one plan** (temporary counters, reverted): `evaluateVector` 9 532, 47 019 candidates
  built and `record`ed, 35 467 `shapeOf`, 47 424 `finish`, 3 200 `finaleFor`; the peaks kept 1 + 16 + 9. The memo
  path booked ≤ 110 vectors × 80.
- **P3, narrower than written (P1 + P3 together).** `ShapeScorer.row` answers an armed, budget-free ladder shape's
  **numbers** (total, march silver, bill, mercLost, hired damage, the final march's three) from the kernel grid,
  running the final-march cache in the same order as `finish`; `evaluateVector` asks `keeps` (the `record`
  comparisons in the same arithmetic, conservative by construction), the pick and the tight test of those numbers,
  and only a shape one of them takes is built (`rowShape`, then booked exactly as before). A vector the derived memo
  books builds every shape, as before. 30 358 rows a plan, 5 111 built (83 % not). `scorerRows.on = false` is the
  test hook for the old path. No rows, no change, for a silver budget, a sizer depth, or a rung order to learn.
- **Gates.** `tests/kernel/scorer-rows-parity.test.ts` (21 cases: every benchmark army and both fixtures, plan JSON
  identical with rows on and off) is green; red when the pick test is broken, **not** red when `keeps` is broken
  (the light/heavy peaks coincide with the pick or tight shape on all 21 cases, so that predicate is held by
  construction, not by a test). Full suite: 1 865 pass, 1 red, `tests/kernel/raise-census.test.ts` (profile-build
  census), which fails on the working tree's uncommitted kernel build changes, not on this one. Typecheck shows two
  errors from the same uncommitted work (`MarkerRates` in `fast.ts`, `retypeWalk` in `ported-declines.test.ts`).
- **A/B** (in-process, alternating on/off, timing fixture, medians of 9, 20, 20 plans): 377 / 392 ms, 364 / 379,
  363 / 372: **−2.4 % to −3.7 %** planner wall. At the plan's own 3 % stop line, so P2 and P4 (each smaller) are not
  started; the owner decides whether to continue.

### 6.1 Second pass: P2, P4, P5 (2026-10-11)

Measured with an in-process A/B (timing fixture, interleaved, 30 plans per arm, median / min, ms); the arms are
`scorerRows` flags, so the parity test holds each to the old plan JSON.

| arm | median / min | vs old |
|---|---:|---:|
| old (`on: false`) | 341–348 / 328–331 | |
| rows + replay skip | 322–337 / 313–315 | −3 to −5 % |
| **+ finale sizer cache** | **311–312 / 302** | **−8.5 to −10.6 %** |
| + sizer-depth rows (`sizerRow`, `SizedTail`) | 336–349 / 317–331 | **slower** than the arm above by ~7 % |
| + sizer tail kept per memo entry | 330 / 320 vs 324 / 310 | no gain |

- **P2, as it turned out.** `finaleFor`'s JS was not the bookkeeping (self 1.1 %) but the three sizer-method
  attempts: a `marchOf` crossing and two `copyStacks` per method per call. The sizer's memo entry is now read
  without copying (`ShapeContext.sizerKept`), its final-march attempt is marched once per entry
  (`finaleMarchOf`, per scorer) and its stacks are copied only when the attempt is taken. That is most of the gain
  (`march` crossings 22 900 → 12 868 a plan). No kernel door: the battle was already in wasm, only repeated.
- **P3 addition: the derived replay is skipped when it cannot change a peak.** Each memo entry keeps the best of
  its shapes by `record`'s three tests; a replay whose peaks already stand at or above all three is not walked.
  4 408 of 4 408 replays a plan are skipped (about 350 000 `recordReplay` calls).
- **P4 dropped.** A sizer-depth row (figures and bill from a cached tail per memo entry) and the lighter variant
  (cache only the shelter, housing and march per entry) were both built, held to the plan JSON, and measured:
  the first slower, the second flat. The shape is rebuilt per memo *miss* (12 031 a plan) either way, and
  `evaluateVector` must build the shape whenever it differs from the vector asked (`derived`). Removed.
- **P5 not started.** The condition (JS under `evaluateVector` ≥ 15 %) is read off the 197 profile and still
  holds (28 %), but what is under it is the sizer, not the grid loop: `sizerShape` is 25 % of the profiled time
  (143 ms of kernel wasm in all, `sizePool`/`journalDamage`), `scorer.row` 11 % of which 9 % is the grid itself.
  The depth × scale loop in the kernel would save its ~0.6 % self. **The next lever is Track C** (the sizer's
  kernel cost), not a port of the loop.
- **Gates.** Full suite: 1 886 pass, 1 red (`raise-census`, as before). Lint, prettier, typecheck clean for the
  files touched (the two typecheck errors belong to the other session's uncommitted work).
