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
