# Drill 02: The Tight raise, exact refactors only (no new cache)

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md`, §0.2 and §5 (census). Rules: see the top of `DRILL-01-Measure-And-Census.md`
in this folder (nothing moves but the clock; `scored` stays pinned; do not stage the owner's files). Gate:
`.maestro/playbooks/Working/w18/gate.sh` (written by Drill 01; it restores the owner's benchmark files afterwards).

The Tight raise is about half of the pool's CPU. In it, `killOrderBy` is 34.5 %, `journalDamage` 19.5 %,
`recoveryOf` 16.3 %, `attackOrderOf` 12.8 % (`kernel/assembly/index.ts`). Each task here keeps the exact sequence of
vectors scored, the same comparisons in the same order, and the same floating-point operations in the same order.

## Tasks

- [x] Share the kill order between the score and the rating (census item K2). Read Drill 01's Notes for K2's verdict;
  if it is `WON'T DO`, tick this task with a note and do nothing. Otherwise: in `kernel/assembly/index.ts`, on a memo
  miss under `rRated`, `raisePointSlots` (around line 2110) and its twin around line 2256 call `raiseScore(rWork)`
  (which runs `killOrderBy(types, rRows, rWork, T_ORDER)`) then `raiseRating(value)` (which runs the same
  `killOrderBy` again on the same `rWork`). Split `raiseRating` into a part that takes an already-built kill order
  (`k`, with `stackType`/`stackCount` as left by `raiseScore`) and keep the old entry for the memo-hit path. Check
  that `attackOrderOf` and `journalDamage` do not overwrite `stackType`/`stackCount` (they write `stackDamage`,
  `stackBase`, `attackers`, `dead`, `acted`); if they do, do not share. Run `pnpm kernel:build`, then the gate
  script. Every golden, the advisor golden and `scored` must be identical. Record `pnpm kernel:bench` and the raise
  part of experiment 184's timing before and after in Notes. Commit: `Kernel: one kill order per rated battle (W18 K2)`.

- [x] Write a shadow check for an incremental kill order, before writing the incremental code. In
  `kernel/assembly/index.ts`, add a profile-target-only function `killOrderCheck` that compares the current
  `stackType`/`stackCount`/`stackHp` arrays and `k` with a fresh `killOrderBy` run into scratch buffers, and traps
  (`unreachable()`) on any difference. Add a test in `tests/kernel/raise-kernel.test.ts` (or a new
  `tests/kernel/kill-order.test.ts`) that runs the experiment 184 marches and the exactness fixture's Tight pricing
  on the profile build with the check on, and is skipped on the release build. It must pass on the current code
  (the check compares the sort with itself), which proves the harness works. Commit: `Kernel: shadow check for the kill order (W18)`.

- [x] Make the raise's kill order incremental. In the raise searches (`raisePairwise` around line 2353,
  `raiseClimbSearch` around line 2319, and `raiseWalk`), a scored vector differs from the last one by one or two
  slots, yet `raiseScore` rebuilds and insertion-sorts every live stack. Keep the sorted roster from the previous
  score and, when a slot's count changes, move only that stack: remove it, recompute its HP (`count * cell(t, T_HP)`),
  and re-insert it; a count going to 0 removes the stack, a count leaving 0 inserts it. **Ties must come out exactly
  as `killOrderBy` orders them**: HP descending, then on equal HP the order the comparison `prevRank > rank` gives,
  and on equal HP and equal rank the input row order (insertion sort is stable on row order). Fall back to the full
  `killOrderBy` whenever the previous roster is not valid (start of a search, after `raiseResync`, after anything
  else writes `stackType`, such as the sizer or `raiseRating`). Run the shadow-check test from the previous task on
  the profile build: it must pass on every scored vector. Then the gate script on the release build. If any reading
  moves, revert and record why in Notes. Record `pnpm kernel:bench`, experiment 184 timing and the experiment 196
  rerun (CPU in `killOrderBy`) in Notes. Commit: `Kernel: incremental kill order in the raise search (W18 P2.1)`.

- [x] Fuse the sizer's two journals only if the census says so (K6). Read Drill 01's Notes for K6; if `WON'T DO`, tick
  with a note. Otherwise, in `sizerScore` (around line 748) and the twin around line 371, both journals use the same
  `k`, kill order and attack order (`attackOrderOf` runs once already). The raise uses one journal only, so this is
  plan-side. A fusion is exact only if each total receives the same additions in the same order: keep two
  accumulators and two copies of the `dead`/`acted`/`cursor` state, and do not reorder any `+=`. If the fused walk
  is not clearly faster on `pnpm kernel:bench` (≥ 5 % on the sizer bench), revert and say so. Gate script.
  Commit: `Kernel: one walk for the sizer's two journals (W18 K6)`.

- [x] Re-measure this phase. Run experiment 196 again (release counters off, timings on) and
  `tools/perf-trace/analyse.py` on a new trace if the owner has recorded one (see Manual Follow-Up). Add a row per
  committed step to the progress table in `docs/plans/profile-drilldown.md` §3 (before, after, commit).
  Commit the doc: `W18: Drill 02 measured`.

## Manual Follow-Up (not executed by Auto Run)

- Owner: record a new trace of "Profile everything" with `pnpm dev:profile` on the same account, save it beside the
  first one, so the next phase can quote it.

## Notes

### K2 one kill order per rated battle (2026-10-10) — skipped, census says WON'T DO

- Drill 01's verdict: **K2 WON'T DO** (in-process saving 0.09 % on the exactness fixture, 1.76 % on the timing
  fixture, under the 2 % refactor bar; `docs/plans/profile-drilldown.md` §5). Ticked with no code change, as the
  task says.
- The verdict carries a re-open condition: if a browser run of a worker job with no profiler attached confirms the
  trace's 49.1 % Tight share (vs 13.3 % in-process), K2 scales to ≈ 5.6 % and should be built then. That run has
  not been done (it is P0.4 / the owner's new trace in Manual Follow-Up), so the condition is not met yet.
- No `pnpm kernel:bench` / experiment 184 figures recorded: nothing changed.

### P2.1a the kill order's shadow check (2026-10-10)

- **Kernel**: `killOrderCheck(k, countsPtr)` in `kernel/assembly/index.ts`, called from `raiseScore` right after
  the kill order is built (one line, `if (isDefined(KILL_CHECK))`). It swaps the `stackType`/`stackCount`/`stackHp`
  pointers to scratch (`kcType`/`kcCount`/`kcHp`, reserved in `setTable` only under `KILL_CHECK`), reruns
  `killOrderBy` on the same counts, restores them, and traps (`unreachable()`) unless `k` and every entry match
  **bit for bit** (counts and HP compared as `i64`). The checks passed go to census slot 6 (`raiseCensus` now
  writes `f64 × 7`; −1 on a build without the check), surfaced as optional `RaiseCensus.killOrderChecks`
  (`src/kernel/raise.ts` `CENSUS = 7`; experiment 196's scratch `alloc(48)` → `alloc(56)`).
- **Flag**: `KILL_CHECK` is not in the profile target either, so `pnpm dev:profile` traces carry no check;
  `loadProfileKernelModule({ killCheck: true })` (`tests/kernel/load.ts`) adds `--use KILL_CHECK=1` on top of the
  profile target (asc appends CLI `use` to the target's). **Release wasm byte-identical to HEAD's** (`cmp` of a
  HEAD-source build vs the new one), and the plain profile wat has no `killOrderCheck`.
- **Test** `tests/kernel/kill-order.test.ts`, on request only (~5 min, both kernels over 184's corpus):
  `KILL_CHECK=1 pnpm vitest run tests/kernel/kill-order.test.ts`. Skipped without the flag, and skipped when the
  loaded kernel reports no check count. (1) every stop of every criteria army (184's `planCampaign` call), all five
  `POSITIONS`, 312.5 s; (2) the exactness fixture's Generate bar (`runPlan` + `runPositions` per stop on the elite
  request), 0.5 s. Each answer is also held to the release kernel's (`scored` included), and the check count must
  be > 0. **Both pass** on the current code.
- Gate: not the full script — the release wasm is byte-identical, so no reading can move; ran `pnpm typecheck`,
  `pnpm lint`, prettier, `raise-census.test.ts` (pass).

### P2.1 the incremental kill order (2026-10-10)

- **Kernel** (`kernel/assembly/index.ts`): `raiseScore` now calls `raiseKillOrder(counts)` instead of
  `killOrderBy(types, rRows, counts, T_ORDER)`. The raise keeps **its own copy** of the last roster it fought
  (`rkType`/`rkCount`/`rkHp`, length `rkK`) and the counts it was built from (`rkLast`); nothing else writes
  those buffers, so the sizer, `raiseRating` or `battle` writing `stackType` cannot stale it, and no search
  needs a hook. Each score diffs the counts against `rkLast` bit for bit (`i64`) and moves only the changed
  types (`raiseMove`: remove by type, recompute `count × cell(t, T_HP)`, insert at the first stack it sorts
  before under the key HP desc → `T_ORDER` asc → type index asc — `killOrderBy`'s stable insertion sort on
  `rRows` = identity gives exactly that key), then copies the roster into `stackType`/`stackCount`/`stackHp`.
  Full `killOrderBy` (and a fresh copy) at the start of every `raise()` (`rkK = -1`), when more than
  `KEEP_MOVES` = 4 types changed, and whenever an HP or rank is NaN (the sort then follows no key). Not tuned.
- **Shadow check** (`KILL_CHECK=1 pnpm vitest run tests/kernel/kill-order.test.ts`): **pass**, 2 tests,
  308 s — every scored vector of 184's corpus (all five positions) and the exactness fixture's Generate bar
  held bit for bit to a fresh `killOrderBy`, answers held to the release kernel.
- **Gate** (`gate-20261010-205449.log.summary`), all **PASS**: kernel:build 2 s, typecheck 1 s, lint 19 s,
  `pnpm test` 282 s, plan-benchmark 157 s, bench-diff vs HEAD no difference, 184 109 s. Goldens (raise,
  advisor, `scored`) unmoved; prettier clean. Nothing moved, so nothing reverted.
- **Experiment 184, raise timing** (`times.kernel`, 68 raises, `p21-measure.sh`): sum **129.7 s → 110.7 s
  (−14.6 %)**; the big walk 103.7 s → 88.9 s; the other 67 raises 25.9 s → 21.8 s (−15.7 %); median 0.61 →
  0.75 ms (sub-ms raises, noise).
- **`pnpm kernel:bench`** (battleMany, a path this change does not touch): before 1 071 885 / 366 010
  battles/s, after 870 549 / 296 889 — the TS reference fell by the same 19–22 % in the same run, so this is
  machine load, not the kernel (ratios ×36.3 / ×34.8 → ×37.9 / ×34.0).
- **Experiment 196 rerun** with `--execArgv=--cpu-prof` on both fixtures (profile kernel, self time,
  `.maestro/playbooks/Working/w18/cpuprof-self.mjs`): `killOrderBy` **5 008 ms → 3 800 ms** of 83.1 / 81.7 s;
  the new `raiseMove` 586 ms (`raiseKillOrder` is inlined into `raiseScore`, 293 ms); net kill-order cost
  ≈ −0.6 s (≈ 0.75 % of the run). Census counts unchanged (`cKillOrdersScore` still counts one per battle).
  What is left in `killOrderBy` is mostly `raiseRating` (13.1 M on the timing fixture vs 8.3 M battles) and
  the sizer (5.6 M).
- **Follow-up, not built (needs the owner):** `raiseRating` could call `raiseKillOrder(rWork)` too — on a miss
  `rWork` is the vector just scored (zero moves, three copies), on a memo hit it differs by the slots moved —
  exact by the same check. That is K2's saving and more, and K2 is recorded `WON'T DO`, so it is left for the
  owner to re-open.

### K6 the sizer's two journals fused (2026-10-10) — skipped, census says WON'T DO

- Drill 01's verdict: **K6 WON'T DO** (0.13 % ceiling on both fixtures, under the 2 % refactor bar;
  `docs/plans/profile-drilldown.md` §5). K6 is sizer time, not raise time, so the trace's Tight share does not scale
  it and there is no re-open condition. Ticked with no code change, as the task says; no bench figures recorded.

### Drill 02 measured (2026-10-10)

- Experiment 196 rerun on HEAD 1ebb705 (`THEORY=1 pnpm vitest run tools/theorycraft/196-the-cache-census.test.ts`,
  82 s, pass): every count identical to the committed census (battles, ratings, kill orders, JS census hits).
  Timing fixture run CPU 87.40 s → 84.21 s, Tight raise 11,621 → 10,867 ms (−6.5 %); exactness fixture
  33.96 → 33.45 s (raise 0.57 % of it, noise). Report kept in `.maestro/playbooks/Working/w18/d02-196-the-cache-census.md`;
  the committed `tools/theorycraft/out/196-the-cache-census.md` was restored (it stays the census of record).
- No new owner trace exists (only `chrome-202696-18048.pftrace.gz`), so `analyse.py` was not rerun — Manual
  Follow-Up still open.
- §3 of `docs/plans/profile-drilldown.md` has one row per Drill 02 step (K2, P2.1a, P2.1, K6) with before, after, commit.
