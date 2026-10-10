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

- [ ] Write a shadow check for an incremental kill order, before writing the incremental code. In
  `kernel/assembly/index.ts`, add a profile-target-only function `killOrderCheck` that compares the current
  `stackType`/`stackCount`/`stackHp` arrays and `k` with a fresh `killOrderBy` run into scratch buffers, and traps
  (`unreachable()`) on any difference. Add a test in `tests/kernel/raise-kernel.test.ts` (or a new
  `tests/kernel/kill-order.test.ts`) that runs the experiment 184 marches and the exactness fixture's Tight pricing
  on the profile build with the check on, and is skipped on the release build. It must pass on the current code
  (the check compares the sort with itself), which proves the harness works. Commit: `Kernel: shadow check for the kill order (W18)`.

- [ ] Make the raise's kill order incremental. In the raise searches (`raisePairwise` around line 2353,
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

- [ ] Fuse the sizer's two journals only if the census says so (K6). Read Drill 01's Notes for K6; if `WON'T DO`, tick
  with a note. Otherwise, in `sizerScore` (around line 748) and the twin around line 371, both journals use the same
  `k`, kill order and attack order (`attackOrderOf` runs once already). The raise uses one journal only, so this is
  plan-side. A fusion is exact only if each total receives the same additions in the same order: keep two
  accumulators and two copies of the `dead`/`acted`/`cursor` state, and do not reorder any `+=`. If the fused walk
  is not clearly faster on `pnpm kernel:bench` (≥ 5 % on the sizer bench), revert and say so. Gate script.
  Commit: `Kernel: one walk for the sizer's two journals (W18 K6)`.

- [ ] Re-measure this phase. Run experiment 196 again (release counters off, timings on) and
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
