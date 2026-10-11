# Next speed pass (W22): the Tight raise's bill, the journals, the planner's garbage, the re-typing, the tail

**Status: proposed 2026-10-11.** From the owner's trace `Trace-20261011T214044.json.gz` (a `dev:profile` run) and a
production re-measure at `6c932f8`. Playbook: `.maestro/playbooks/2026-10-11-Speed-W22/`.

**The rule is W16's, W18's, W19's and W20's:** nothing moves but the clock. Every plan, stop, position row, advisor row,
`scored` count and benchmark figure stays **byte-identical** (`feedback-benchmark-non-regression`); a step that moves a
reading is a trade and goes to the owner. One test, written once, runs on the kernel and on the TypeScript reference,
red before green (`feedback-one-test-both-paths`). No cache without a census (≥ 2 hits per entry and ≥ 3 % projected
CPU, exp 196). Profiling code folds out of `pnpm build`.

## 0. What is measured

### 0.1 Production, no profiler (the figures to judge by)

`SPLIT=1 node .maestro/playbooks/Working/w18/prod/run.mjs pyrrhic-my-account-2026-10-07.json 6 3` after
`pnpm kernel:build` (release), 16-thread desktop, 6 workers, answer hash `a9612b9ca0a9` (unchanged since W18):

| | figure |
|---|---:|
| four passes, wall (min of 3) | **10 994 ms** (upgrades 3 501, captain advice 1 505, captains 4 660, other 2 833) |
| pool CPU | 57.1–59.4 s |
| Tight raise (`positionTrades`) | **23.5–23.8 %** (685 calls) |
| `planCampaign` | **75.2–75.6 %** |
| pool efficiency (CPU / wall × 6) | ≈ 87 % |

W19 and W20 cut pool CPU from 63–65 s (W18 Drill 04b) to 57–59 s, but the wall moved only 11.2 → 11.0 s.

**From SPEED-01 on, W22 measures on the owner's 2026-10-11 export** (`pyrrhic-my-account-2026-10-11.json` at the repo
root, not committed), the account his live run used. The 10-07 export is kept to tie in the W18–W20 figures above.

### 0.2 The owner's trace (dev:profile, read for shape, not for shares)

23.1 s wall, 106.6 s pool CPU, 145 jobs (120 probes, 22 captains, 1 plan, 2 positions). The fixture run has 106,
so **the owner's live account does more work than the timing fixture** (the captains pass alone asks 60 probes).
The trace puts Tight at 63 % of pool CPU against 24 % in production: the profiled build runs the wasm far slower,
so wasm shares are inflated about ×4. **Ratios inside the kernel still hold** and are used below.

Kernel self time (share of all pool samples; share of the Tight raise in brackets):

| function | self | what calls it |
|---|---:|---|
| `killOrderBy` | 17.6 % (≈ 28 % of Tight) | `raiseRating` sorts the whole roster every rated vector; `raiseScore` uses the kept roster (P2.1) |
| `recoveryOf` | 14.8 % (≈ 24 % of Tight) | `raiseRating`, every rated vector |
| `journalDamage` | 7.1 % | `raiseScore` (one walk), `sizerScore` and the sizer's march (two walks) |
| `attackOrderOf` | 5.1 % | every battle |
| `raisePairwise`, `raise`, `raisePointSlots`, `raiseRating`, `raiseMove`, `raiseScore` | 21 % | the search itself |

**Projected on production:** Tight is 24 % of pool CPU, so the full sort in `raiseRating` is ≈ 6.6 % and `recoveryOf`
≈ 5.6 % of pool CPU. Exp 196 judged K2 (one kill order per rated battle) at 1.76 % when Tight was 13 % in-process;
the production share is nearly double, and the trace says the full sort is the largest single function.

The planner (`planCampaign`, 32 % of the trace): JS 61 %, wasm 27 %, builtins 12 %; no JS function above 2.4 % self
(`evaluateVector` 2.4, `scorer` 1.4, `sizerKeptOf` 1.2, `planCampaign` 1.0, `scorer.row` 0.9, `sizerShape` 0.8,
`consider` 0.7). Exp 197: **368 MiB allocated per plan, GC 11.8 % of the planner**. `retypeRow` 3.5 % of the trace
(≈ 11 % of the planner): `climb` 2.8 %, `build` 1.3 % in builtins.

The tail: in the trace's "other" pass one probe took **5 222 ms**, started at +1 658 ms; for 2.9 s of the 6.9 s pass
one or two workers were busy. On the fixture the same pass has 14.6 s CPU (2.4 s at 6 workers) and takes 2.8 s.

## 1. The steps, by reward for effort

| # | step | doc | effort | projected (pool CPU, production) | kind |
|---|---|---|---|---|---|
| 0 | baseline, gate, every job timed with its inputs | `SPEED-01` | ½ day | — | measure |
| 1 | `raiseRating` reads the kept kill order | `SPEED-02` | low | up to ≈ 6 % | exact refactor |
| 2 | `recoveryOf` from per-type terms | `SPEED-02` | low | ≈ 3–4 % | exact refactor |
| 3 | the two journal walks in one pass (sizer and march) | `SPEED-03` | low–medium | ≈ 1–3 % | exact refactor |
| 4 | the planner's garbage | `SPEED-04` | medium | ≈ 3–6 % (GC is 11.8 % of the planner) | exact refactor, census first |
| 5 | `retypeRow`'s climb in the kernel | `SPEED-05` | high | ≈ 2–4 % | kernel door |
| 6 | jobs ordered by an estimated cost, longest first | `SPEED-06` | high, complex | ≈ 0.4 s wall on the 10-07 export, ≈ 1–2 s on the owner's live account | scheduling; the cut set is the owner's call |
| 7 | final measure | `SPEED-07` | ½ day | — | measure |

**Stop rule** (W20's): a step that buys < 2 % of pool CPU (refactor) or < 3 % (cache) in its in-process A/B is
reverted and written up as `WON'T DO` with its figures.

### Step 1: `raiseRating` reads the kept kill order

`raiseRating(damage)` (`kernel/assembly/index.ts`) calls `killOrderBy(types, rRows, rWork, T_ORDER)`: a full rebuild
and insertion sort, for every rated vector, while `raiseScore` gets the same order (same key `T_ORDER`, same
counts when the rating follows the score of the same vector) from the kept roster of P2.1 (`raiseKillOrder`). Two
ways, in order of preference: (a) when the counts `raiseRating` is asked for are bit for bit the counts
`raiseScore` last ordered, reuse that roster (K2); (b) otherwise, a second kept roster for the rating, updated by
the same take-out-and-put-back. The `KILL_CHECK` shadow (`killOrderCheck`) covers both. `recoveryOf` reads
`stackType` / `stackCount`: check what `raiseKillOrder` leaves there.

### Step 2: `recoveryOf` from per-type terms

`recoveryOf(k)` sums, stack by stack in kill order, a bill per stack that depends only on (type, count) and, under
mode 2, on whether the type is its family's top revived tier. A vector differs from the last by one or two types.
Keep each type's four terms (silver, gold, dragon coins, seconds) with the count they were computed for; recompute
only the types whose count (or, under mode 2, top tier) changed; **sum in kill order as today** so the floats are
the same. Exact by construction; gated byte-identical with a shadow that recomputes in full.

### Step 3: the two journals in one pass

`journalDamage(k, false)` and `journalDamage(k, true)` share the kill sequence (`dead`), differ in one opening
attack. One loop with two `acted` arrays and two cursors fills both totals, each added in its own order: same
floats. Callers: `sizerScore` (the relaxed walk), the sizer's march (`R_MIN_DAMAGE` / average), and anything else
that calls both. The K6 census (196) put a ceiling of 0.13 % on it in-process; the trace says `journalDamage` is
7.1 % self. **Measure before building**: in-process A/B of a fused build on the timing fixture; below 2 %, stop.

### Step 4: the planner's garbage

368 MiB a plan. Known sources: the sizer-depth shapes rebuilt on every memo miss (57 MiB), `copyStacks` (13.7 MiB),
`build` in `src/engine/retype.ts`, `countsKey` strings. Census first: the sampled heap profile of exp 197 by
allocation site, top 10, MiB per plan. Then fix the largest two or three with reused buffers or lazy results;
measure GC pause ms (exp 197's `PerformanceObserver`), not sampled heap bytes (noisy, W18 note).

### Step 5: `retypeRow`'s climb in the kernel

`retypeRow` → `retypeRowNow` → `retypeOne` → `retypeMarch` → `climb` is JS (`src/engine/retype.ts`) around the kernel's
march; the `retypeWalk` door already does the walk in one call where it applies. Census first: how many
`retypeMarch` calls take the walk door and how many climb in JS, and the climb's share in exp 197. Port only the
climb that the census says is paid.

### Step 6: the tail of a pass, ordered by an estimated cost

P1.3 (longest first, dropped 2026-10-11) ordered probes by their time on the last run, so the first run kept list
order. The owner prefers (2026-10-11) **an estimate of each job's duration relative to the others, from its inputs,
before it runs**, so jobs go out longest first from the first Generate:

- **Time every job** with its input features on the 10-11 export, the 10-07 export and the benchmark armies
  (SPEED-01).
  **Measured (experiment 206, 2026-10-12, in-process, one lane, release kernel):** 138 jobs on the 10-11 export,
  median 394 ms, **longest 1 279 ms (`captain:alexander:level10`, captain upgrades, 3.2× the median;** plan 272 ms,
  Tight 1 001 ms in 9 calls); next `captain:bernard:level` 943 ms, `captain:alexander:level` 828 ms. The 10-07
  export: 102 jobs, median 499 ms, longest 889 ms (1.8×). Rows: `Working/w22/job-times-{1011,1007}.json`. The longest
  job is far below its pass's CPU / workers (captains 33.3 s / 6 = 5.6 s), so the "split the big probe" clause does
  not apply to these two accounts; the tail is a matter of order, not of a big job.
- **Fit `estimateCost`** (`src/worker/jobCost.ts`): pure, cheap, a ranking not a duration. Fitted on the 10-11
  export and the armies, checked on the held-out 10-07 export (experiment 207): Spearman ρ, the measured top 3 in
  the estimated top 6, and the simulated wall against list order and the measured-longest-first ideal.
- **Order the passes by it** (`w22-cost-order`, P1.3's `jobOrder.ts` plumbing, no past times). Answers identical with
  no clock; at a binding clock the cut set changes, so the merge is the owner's, with the cut-set diff at 2 s and 3 s.
- **Split the big probe** only if one job alone outlasts the pass's CPU / workers even when started first.

## 2. Gates (every step)

`.maestro/playbooks/Working/w22/gate.sh` (W18's gate, snapshotting the benchmark files at its start instead of the
W18 copy): `pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (advisor golden, raise goldens, kernel
parity), plan benchmark alone + diff against HEAD, experiment 184. Plus, per step: its parity test on both paths, the
in-process A/B (arms interleaved in one process, ≥ 30 rounds, median and min) and the production split harness
(answer hash `a9612b9ca0a9`, wall and Tight / planner CPU).

## 3. Progress

The first column is the 10-07 export; every later column is the 10-11 export. (Re-measured 2026-10-11 the 10-07 export gave 12.6 s wall, 65.8–68.5 s pool CPU, hash unchanged: the machine was slower than at W20.)

| | 6c932f8 (10-07) | 6c932f8, 10-11 | after 1 | after 2 | after 3 | after 4 | after 5 | after 6 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| prod wall, four passes (min of 3) | 10 994 ms | 13 832 ms | 12 096 ms* | 12 096 ms* | 13 057 ms* | 13 577 ms** | | |
| prod pool CPU | 57.1–59.4 s | 75.1–77.2 s | 65.4–69.0 s* | 65.4–69.0 s* | 70.9–72.3 s* | 73.7–76.5 s** | | |
| prod Tight CPU | 13.6–14.1 s | 37.1–38.2 s | 32.3–34.1 s* | 32.3–34.1 s* | 35.2–35.5 s* | 37.5–38.6 s** | | |
| prod planner CPU | 42.9–44.9 s | 35.8–36.7 s | 31.3–33.0 s* | 31.3–33.0 s* | 33.7–34.7 s* | 34.0–35.8 s** | | |
| answer hash | a9612b9ca0a9 | a9c9defd5d22 427cfa3135cd | same | same | same | same | | |

\* **After 1 and after 2 are the same kernel as the 10-11 column: both steps are WON'T DO** (below). The figures differ
from the 10-11 column by the machine alone (a re-run of unchanged code, `Working/w22/prod-after-02.txt`: 12 096 ms,
65.4–69.0 s pool CPU, Tight 49.4–49.6 %, hash unchanged); read later columns against this re-run too.

\*\* **After 4**: `Working/w22/prod-after-04.txt` (3 runs, hash unchanged). Only 4a (indexed loops in `evaluateVector`)
is kept; 4b and 4c are WON'T DO. 4a is in-process −3.6 to −8 % wall on the planner and GC pauses 12 → 11 a plan
(−8.3 %); in production it is inside the machine's noise (this run's machine was slower than the 12 096 ms re-run).
Allocation per plan on the 10-11 fixture: 182.6 MiB sampled (exp 206; the 368 MiB above was the older figure), GC 12.2
pauses = 32.3 ms a plan before, 11 pauses after. The rest of the allocation is memoised results or sites each ≤ 1.9 %.

### Step 3: WON'T DO (experiment 209, 2026-10-12)

\* After 3 is the same kernel again (the fusion was reverted; probe in `docs/research/patches/w22-209-journal-probe.patch`;
`Working/w22/prod-after-03b.txt`, machine slower than the 12 096 ms re-run). Per `planCampaign` on the 10-11 export:
19 080 `sizerScore` pairs and 3 242 sizer-march pairs. One extra pair costs **+4.1 %** (sizer) and **+3.1 %** (march)
of the planner, so all pairs are ≈ 7 % of the planner ≈ 3.4 % of pool CPU, and fusing can only save part of that.
Built `journalBoth` (one kill sequence, two `acted` arrays, two cursors; plans identical): −0.3 to −2.1 % of the
planner over three A/Bs (30–60 plans, interleaved) ≈ 0.4 % of pool CPU, under the 2 % bar. Reverted.

### Steps 1 and 2: WON'T DO (experiment 208, 2026-10-12)

The profile build's shares (`killOrderBy` 28 %, `recoveryOf` 24 % of the Tight raise) were wasm-in-`dev:profile`
inflation. Measured on the release kernel, 199 Tight searches captured from the 10-11 account's generic-probe pass,
replayed in-process, arms interleaved, 30 rounds (`tools/theorycraft/208-the-rating-ab.test.ts`, with a temporary
`raiseAb` switch: `docs/research/patches/w22-208-rating-kept-order.patch`):

- **Step 1** (the rating reads the kept kill order, built and shadow-checked red then green on `KILL_CHECK`, exact on
  every golden): new 3 240.5 ms, old 3 318.4 ms, median **−2.4 % of the raise**, ≈ 1.2 % of pool CPU (Tight is 49 %
  of it on this account). Below the 2 % bar: reverted.
- **Step 2** (the bill from per-type terms): not built. Twenty extra `recoveryOf` calls per rating cost 3 767 ms on a
  3 378 ms raise, so one `recoveryOf` is **5.6 % of the raise** (≈ 2.7 % of pool CPU). Even a free bill stays under the
  bar's 8 % of the raise; a cache that still sums the four terms in kill order recovers about half of that. WON'T DO.

