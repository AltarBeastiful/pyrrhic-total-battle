# The refactor phase: where the time still goes (W16)

**Status: proposed 2026-10-01.** Owner, 2026-10-01: *"understand why the worse plan takes so much time even in
assembly script. Lets enter a refactor phase as we have the benchmark to ensure no regression. Let's see if
there's speed improvements possible in AssemblyScript or remaining complexity/time spent in ts."*

**The rule of the phase: nothing moves but the clock.** Every step must leave every plan, every stop, every
position row and every benchmark figure **byte-identical** on both paths (TS reference and kernel). A step that
changes any reading is not a refactor, it is a trade, and goes to the owner.
The TS engine stays the reference; the kernel keeps its TS fallback.

## 0. The two slow things, as measured today

There are two different waits, and they have different causes.

### 0.1 The positions table, worst case 2.16 s a march on the kernel

`out/184-the-positions-on-the-kernel.md`, the owner's live camp of 2026-09-18, stop `more-mercs`:

| position | box | scored |
|---|---|---|
| Best v2 | 908,684 | **5,977,076** |
| Safe | 908,684 | **5,977,076** |
| Tight | 908,684 | **4,696,776** |

**The search scores 6.6× more vectors than the box holds.** A box over `walkCap` (300 000) is not walked; it is
searched from 64 seeded restarts, each a pairwise sweep (every pair of slots, every count of both) then a
one-stack climb, to convergence (`raiseSearch`, kernel/assembly/index.ts). Each restart re-scores vectors the
earlier ones already scored, and nothing remembers a score. Walking the whole box would cost 908 684 battles;
the search costs 16.65 M over the three positions (~130 ns a score). Two more redundancies sit on top:

- `Best v2` and `Safe` ran **the same search to the same answer** on this stop (Safe's burn cap did not bind),
  and `Tight` walks the same box under a tighter cap. The score of a vector does not depend on the position;
  only the cap test does.
- The 12 000 export `burn-saver` (729 267 box → 838 398 scored) and the TotalStack profile `steady-max`
  (351 900 → 259 936) are the same shape, smaller.

### 0.2 The planner, worst case 4.29 s on the kernel

`out/benchmark-latest.kernel.md`, *"Where the time goes"*: the monster camp (tiers 3–5 at 900 dominance) is
4 290 ms; the next are 1.6 s (his TotalStack profile, his usual setup). Step 5 of the kernel port
stopped at ×8.2 with *"the rest is diffuse JS churn/GC; retype 2 %, summarise 5 %"*.
**That breakdown is from 2026-09-24 and predates W14–W15 and S-14x**; it has to be measured again before anything
is chosen (step A1).

## 1. Steps

Each step: a measurement, the change, the gate (§2), one commit. Order is by measured gain over risk.

**A. Measure (no code change)**
- **A1** Profile `planCampaign` on the three slowest benchmark armies, kernel path: wasm vs TS self time, the
  top TS functions, allocation/GC share, the number of kernel crossings and their marshalling cost.
- **A2** Instrument the raise search on the five largest boxes: scored vs distinct vectors, overlap between
  the three positions, share of refused (housing/cap) vectors, time a score.
- **A3** The gates' own baseline: run them on HEAD, record which are red already and how long each takes.

**B. The raise search (kernel + its TS twin, `src/engine/exact.ts`)**
- **B1** A score memo keyed by the count vector, per march: a vector is scored once whatever the restart. The
  answer cannot move (the scorer is a pure function of the vector), only `scored` does — which becomes
  *battles fought* and must stay equal on both paths (experiment 184 asserts it).
- **B2** One memo across the three exhaustive positions of a march: store the raw score and the burn, apply the
  position's cap on read.
- **B3** (if A2 says the memo is not enough) a cheaper scorer for the walk: the vectors differ in one or two
  slots, so the housing and refusal tests can run before the battle.

**C. The planner (from A1's findings; candidates, not decisions)**
- move what remains hot in TS across the boundary, or batch the crossings it makes;
- cut allocation in the scorer/summariser path (typed arrays reused instead of objects per march);
- memoise per `planCampaign` what is recomputed per stop.

**D. Complexity in TS** — dead paths left by S-14x, duplicated readers of the same march, the `src/engine/fast.ts`
door, done only where they sit on a measured hot path or block a C step.

## 2. The gate (every step)

- `pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`.
- `tests/kernel/parity.test.ts`, `plan-equivalence`, `benchmark-equivalence.*` (kernel vs TS, figure for figure).
- `tests/engine/plan-benchmark.test.ts` on both projects: the regenerated `benchmark-latest*.json` identical to
  HEAD **apart from timings and stamp**.
- Experiment 184: every position row equal on both paths, `scored` included.
- The timing table re-measured on the same machine, before and after, in the commit message.

## 3. Results

**A1 (2026-10-01, measured alone, warm, HEAD f3520cb).** The 4 290 ms is **not reproducible**: the benchmark's
timing table was taken under CPU contention (a parallel suite). Alone, the monster camp plans in **~0.9 s** on the
kernel (TS ~7.0 s), the TotalStack profile in ~265 ms, his usual setup in ~350 ms. The gate's timings must come
from single-file runs. Profile: TS engine 52–56 %, wasm 26–32 %, GC 12 %, glue 4–5 %, crossings < 0.2 % (~75 k
calls, marshalling is not the cost). `evaluateVector` (plan.ts) is 65 % inclusive and its nested derived calls are
**96 % exact repeats** (~37 % of wall) → step C1 (memo with side-effect replay); then lazy shape objects from the
grid (−15–20 % + GC), summarise once (−5 %), a precomputed counts key for `sameCounts` (−3 %).

**A2 (2026-10-01).** The raise search re-scores, it does not search wide: on the live camp's `more-mercs` stop
`Best v2` asks 5 977 076 scores for **207 386 distinct** vectors; `Tight` battles 839 420 vectors and throws away
839 340 of them on the burn cap, which is tested **after** the battle. `held`, `seed` and the slots are the same for
the three positions of a stop and the battle does not depend on the position, only the cap does: one memo per
march takes the stop from 16.65 M scores to 842 284 battles (×19.8), the 12 000 export's `burn-saver` ×6.6. The
scorer is a pure function of the vector (seeded RNG, strict `>`), so a memo cannot move an answer → steps B1–B3.

**B1–B3 (a6104b3).** A dense memo over the box (`BoxMemo`, up to 2²² vectors), shared by the three exhaustive
positions of a march, and the burn cap tested before the battle, on both paths. 63 stops × 5 positions
byte-identical on both paths; `scored` unchanged. Owner's live camp, worst march: kernel **2 162 → 649 ms**,
TS **183 973 → 10 304 ms**. Open: no memo above 2²² vectors; the kernel memo region is never freed (~7 MB at the
widest benchmark box).

**A3 (2026-10-01, HEAD f3520cb).** The gate is green on HEAD: build, typecheck, lint, parity 56, plan-equivalence 73,
benchmark-equivalence 7 + 11, raise-kernel 109, raise-positions 18 × 2, plan-benchmark 19 × 2, experiment 184 (needs
`THEORY=1`); the regenerated benchmark JSON identical to HEAD apart from `run`, `planMs`, `searchMs`. ~20 min
sequential. The "WIP pin" lines in the benchmark log are soft readings inside passing tests, not reds.

**C1 (3140985).** `evaluateVector`'s derived calls memoised per rung orders learned and `winnerRungs`, side effects
replayed (`record`, `consider(tight)`, the kept final march restored); `summarise` bills a march once; `sameCounts`
caches its JSON. 18 armies × both paths byte-identical; gate green. Planner: monster camp kernel 1.01 → ~0.7 s
(TS 8.5 → ~5.7 s), TotalStack profile 300 → 210 ms, usual setup 365 → 275 ms (shared machine, medians).
**Found, not changed (a trade for the owner):** the scorer's kept final march is keyed on the vector alone, so
after a rung order is learned it answers **stale** — 624 of the monster camp's 800 first scorings read one. The
memo reproduces that faithfully; fixing it would move readings and must be measured as an experiment.

**C2 (2026-10-01, re-profiled at 1ada9f1).** After C1 the grid's shape objects are no longer hot: of 333 k scorer
calls on the monster camp 292 k are empty grid cells and only 27 k build a shape. What was hot: the sizer's memo
(its string key hashed on 19 k calls, a fifth of the sizer), the 225 k shape copies a derived-vector replay booked
and re-priced to keep a few dozen, and `summarise` building a row for every frontier candidate when a few dozen
survive `undominatedRows`. Changed: the sizer memo keyed on a number with an exact compare; a replay builds a copy
only where `record` keeps it, its ratios read off the kept shape; the frontier thinned on `summarise`'s own three
figures before any row is built (every row still built under `withFrontier`); a few allocation cuts (`sizedShape`
one pass, the sizer-shape count scan, `countsKey`). 18 armies × both paths byte-identical (with and without
`withFrontier`); gate green. Planner, interleaved medians: monster camp kernel ~575 → ~450 ms (TS ~5.5 → ~3.7 s),
TotalStack profile ~190 → ~160 ms (TS ~1.9 → ~1.4 s), usual setup ~233 → ~206 ms (TS ~2.35 → ~1.78 s).
What is left on the kernel path is mostly real work: the sizer's own wasm (12 k distinct calls), the ladder grid,
the march battles, and GC ~14 %.

**E1 (2026-10-01, at e075c63).** The scorer's kept final march is keyed on the rung orders it was walked under as
well as the vector (one walked while an order was learned matches nothing), so it is walked again after an order
is learned instead of answered stale; the kept final march lives in the TS scorer on both paths (the kernel's
`ladderFinale` is called from inside the walk and keeps nothing), so it is one fix. C1's replay drops its stale
matching (`staleReads`, `finaleFresh`, `holdsFinale`, `DerivedScore.stale`): the orders are the whole condition.
Measured as an experiment: the 19 benchmark cases on both paths, **every figure identical** to HEAD (no reading
moved, better or worse), kernel and TS equal. Why: a probe re-walked each stale read and compared it — 98 stale
reads over the benchmark, **0** whose final march differed in damage or silver (the orders learned after a final
march was kept never changed that march). The trade C1 feared is empty on the benchmark; the fix is a correctness
guard. Planner time unchanged within noise (kernel total 2 567 → 2 371 ms, TS 13 187 → 13 079 ms, single runs).

**E4 (2026-10-01, at 7183e98).** The benchmark's own timing table was the thing not to trust: a single
`performance.now()` sample around `planCampaign` (`plan-measure.ts`) reads whatever the OS scheduler gave this
process that millisecond, and `pnpm test` runs dozens of other files' workers at the same time — the monster
camp's 4,290 ms against a 0.45–0.9 s alone reading is that, not the planner doing more work. Fix: one warm-up
call (discarded) then three timed calls, the **median by wall time** kept as `planMs`; `process.cpuUsage` on the
same three calls gives `planCpuMs` beside it, and `isContended(planMs, planCpuMs)` — `planMs` over 1.25×
`planCpuMs` — is read off those two rather than stored as a third field, so a before/after `bench-diff` has
nothing new to trip on (both fields end in `Ms`, already ignored by name). `measure()` takes an optional
`timingRuns`, defaulting to the three above; `benchmark-equivalence.ts` passes `1` since it strips every timing
field before comparing and gets no benefit from a trustworthy one, so its own runtime is unchanged. Gate green on
both projects (ts, kernel); bench-diff OK on both (the committed `benchmark-latest.json` and a kept local
`.kernel.json` snapshot), confirming the four extra `planCampaign` calls an army move no reading — only which of
them the clock read. Runtime: `plan-benchmark.test.ts` alone, ts 185 s → 221 s (+19 %), kernel 55 s → 81 s
(+47 %); the report itself now says in prose how the timing was taken and prints `planCpuMs`/`contended?` beside
`planMs` so a reader does not have to take the wall clock on faith.

**E5 (2026-10-02, at c2224cb; experiment 186, `tools/theorycraft/out/186-a-bigger-compute-budget*.md`).** The
compute budgets raised in an experiment only — **no shipped default moved**. Made injectable for it, defaults
unchanged (bench-diff OK): `CampaignInput.limits` over `PLAN_LIMITS` (`src/engine/plan.ts`; `RetypeOptions`
`exhaustive`/`climbSteps` under it) and `createRaiseKernel(module, search = EXACT_DEFAULTS)`.

*The budgets.* Wall clock: `CAMPAIGN.budgets.plan` 40 s (`config.ts:267`) and the re-typing's 5 % of it
(`RETYPE_SHARE`, `plan.ts:96`); `budgets.search` 8 s (`config.ts:241`), `COMPARE_BUDGET_MS` 4 s
(`objectiveCompare.ts:40`). Counts: the seed climb's 8 seeds × 16 rounds and the sweep's 16 rounds
(`PLAN_LIMITS`, `plan.ts:125`; used at 4245/4383), `CROSSED_TYPES` 4 (`plan.ts:102`), `MAX_MARCHES` 12 (unused
at a fixed horizon), `DEPTHS`/`LADDER_GROWTHS`/`MERC_FRACTIONS`/`MAX_SCALE` (the grid's shape), the re-typing's
`EXHAUSTIVE` 5 000 and `CLIMB_STEPS` 60 (`retype.ts:28, 30`), the raise box search's `walkCap` 300 000 /
`restarts` 64 / `maxSweeps` 24 (`kernel/raise.ts:71`) under `MEMO_CAP` 2²² (`kernel/assembly/index.ts:1720`),
the raise seed climb's 16 samples × 3 passes (wasm constants), the priority search's `EXHAUSTIVE_LIMIT` 12 /
`MAX_RESTARTS` 64 / `SHORTLIST` 8 (`search.ts:38, 44`, `campaign.ts:202`), `MAX_RELAX_STEPS` 500
(`stacker.ts:102`). The rung-order climb runs to convergence (no cap). **No wall clock binds any more** — not
even on the 20 000-dominance camp, which now plans in **1.4–1.7 s** (4 % of its clock; experiment 129's 40.9 s
was the TS engine), so it could now be registered as a benchmark army. What binds is two counts.

*What moves* (single-file runs, load ≈ 2). Over the 18 benchmark armies (63 stops) and the 20 000 camp:
- `budgetMs` ×4, `crossedTypes` 5, `climbSeeds` 32, `sweepRounds` 64, `retypeClimbSteps` 240: **nothing**.
- `retypeExhaustive` 5 000 → 10 000: **12 stops better, 0 worse** (rated +0.04…+0.35, e.g. the live account's
  sweet spot 28,384,288 → 28,463,764 for −0.42 % silver), saturated at 10 000 (20 000 and 40 000 read the
  same); costs +0.1–0.3 s on the armies it touches (planner total over 18 armies 2,335 → 3,752 ms).
- `climbRounds` 16 → 32 (no benchmark army moves): the 20 000 camp's bar 4 → 5 stops, steady max
  881,449,780 → **1,704,237,793** (+93 %, silver +33 %), sweet spot +47 % damage for −17 % burn, all-in 1,916,899,710 → 1,924,929,114 for
  −2.2 % silver (rated −0.72: gold +13 %); 1,661 → 1,818 ms. 24 moves nothing; 32 alone does it.
  At 64 the evening account's bar re-folds (a 43.2 M steady max burning 331, its all-in dropped: most damage +24 %, dmg/silver −0.28 %). **At 256 and beyond it regresses**:
  the 900-dominance camp loses 6.9 % most damage, 9 % dmg/hired; at 1 024 Aydae-alone re-folds too. The climb's winner seeds
  the burn-level sweep after it, so the bar is not monotone in the climb's length.
- Raise positions: `walkCap` 1 048 576 / 4 194 304 walks the 9 boxes the search used to search — **all 189
  `Best v2`/`Safe`/`Tight` answers identical**; 382 → 473 ms over every stop.

*Recommendation (the owner's trade).* `retypeExhaustive` 10 000 (+0.1–0.3 s a Generate, 12 stops better, none
worse); `climbRounds` 32 only with the 20 000 camp registered, since it is the only army it moves; leave the
clocks, the raise search and the other counts as they are.

## 4. Round 2 (owner, 2026-10-01)

*"do 1, checking benchmarks and ensuring no regressions. For 2, do you mean some kind of cache? delegate a subagent
to create a plan and validate it independently. 3. don't bother cleanup, first task will be to retire the ts
version; we've kept it for too long now and most of our users have webassembly. 4. fix it. 5. when all is done, as
we've improved massively speed, we could try raising our compute budget to check if that solves more cases or
improve anywhere."*

- **E1** the stale kept final march, fixed as an experiment: a reading change, so the benchmark decides — any
  scenario worse is a trade for the owner, not a merge.
- **E2** cheaper battles for the raise search (reuse across neighbouring vectors): a plan, then an independent
  validation of it, before any code.
- **E3** retire the TypeScript engine path: the kernel becomes the only engine; the gate becomes kernel-only
  against the registered baseline. Planned first, built after E1.
- **E4** the benchmark's timing table measured so contention cannot write it.
- **E5** last: raise the compute budgets and measure what more the plan solves.

**E3 S1 census (2026-10-01).** How often the kernel declines (`null` / `LADDER_ENGINE`) and the TS engine answers
instead, counted with a temporary env-gated counter at every decline site in `src/kernel/plan.ts` and
`src/kernel/raise.ts` (not committed; reverted after this measurement), one tag per site, run over
`vitest run --project kernel tests/engine/plan-benchmark.test.ts` (19 scenario tests, the 18 benchmark armies ×
the Tier ladder / Troops first / Complete optimization methods each runs) and, separately,
`THEORY=1 vitest run tools/theorycraft/184-the-positions-on-the-kernel.test.ts` (63 stops × 5 positions, raise
kernel). The sanity check first: a forced custom-kill-order call through the same counter prints its tag, so a
silent zero means no decline, not a broken counter.

| reason | kernel lines | plan benchmark | experiment 184 |
|---|---|---|---|
| custom kill order | `plan.ts:434` | 0 | — |
| training cost reduction / speed | `plan.ts:377, 494` | 0 | — |
| unpackable request | `plan.ts:286` | 0 | — |
| unbound entry | `plan.ts:333, 335, 337, 343, 415, 443, 498, 513, 519` | 0 | — |
| rung-order learning (`LADDER_ENGINE`) | `plan.ts:569, 571, 599` | 0 | — |
| other guard (enemy-stack bounds, grid/depth limits, NaN ceiling) | `plan.ts:381, 447, 454, 479, 495, 502, 503, 504, 682` | 0 | — |
| unpackable raise | `raise.ts:102` (`raise.ts:134` is the same event, propagated) | — | 0 |
| raise search declined (`answered !== 1`) | `raise.ts:155` | — | 0 |

**Zero, every reason, on both runs.** Across the full plan benchmark (sizers and plans both — the 19 tests cover
far more than 19 `planCampaign` calls once Tier ladder / Troops first / Complete optimization are each counted)
and every stop × position experiment 184 prices, the kernel never once falls through to TS. This is the
precondition S5a named ("after S1, zero declines") for dropping the stacker/retype TS bodies behind a hard
throw rather than a renamed fallback.

**But the benchmark and the owner's account never ask the two reasons that matter.** `tests/engine/
plan-scenarios.ts` sets no `customOrder` and no non-empty `trainingCostReduction`/`trainingSpeed` anywhere in
its 18 scenarios, and neither does any of the owner's six saved exports
(`tests/fixtures/pyrrhic-my-account-*.json`): every one reads `trainingCostReduction: {}`,
`trainingSpeed: {}`, and `options.method` is always `elite` / `plan` / `ms`, never `custom`. Both are real UI
features all the same — `BattleSection.tsx`'s kill-order editor sets `method: 'custom'` with a `customOrder`
list, and the profile schema carries per-group training reduction/speed — and the decline code is exercised
directly in unit tests (`tests/kernel/plan-kernel.test.ts`, `tests/engine/killOrder.test.ts`, and others), so it
is live, correct, and simply untried by anyone's real army. **Recommendation:** keep these two as named,
explicit TS fallbacks (`…Declined`) rather than deleting them with S5a's hard throw — a real player could reach
either from the Battle section today, and the census has nothing to say about what happens when one does. The
remaining reasons (unpackable request/raise, unbound entry, rung-order learning, the other guards) are internal
invariants with no UI path to them at all on a request the app itself built; S5a's hard-throw plan stands for
those.

**E3 S5c/S6 (2026-10-01).** The kernel is mandatory at every door of `src/engine/plan.ts`:
`requiredPlanKernel()` (`src/engine/fast.ts`) throws `KernelUnavailableError` — now defined beside the doors
and re-exported by `src/kernel/boot.ts`, which removes the import cycle S5a worked around — and `sizePool`/
`marchBill` use it too. The custom kill order and the training reductions were ported to the kernel before
this step (the decline port), so what still declines is internal: an entry not bound to the kernel's table or
an empty march (`marchOfDeclined`), a bill under another recovery (`marchRecoveryDeclined`), units out of the
request's order or a sizer refusal (`sizedCountsDeclined`), and the scorer's ladders where a rung order is
still being learned (`LADDER_ENGINE`) or `ladders` cannot bind — `orderFor`'s climb is orchestration and
stays TypeScript. No TypeScript computation became unreachable: each decline path is the TS a door replaced.
`tests/kernel/**` take their reference on a kernel that declines every door it may (`tests/kernel/
declining.ts`) instead of `setKernel(null)`. Experiments 176/177/178 lost their TS toggles and TS columns.
