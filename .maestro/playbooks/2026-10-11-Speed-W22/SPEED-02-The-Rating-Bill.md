# Speed 02: the Tight rating, one kill order and a bill from per-type terms

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §1 steps 1–2. Rules: top of `SPEED-01-Baseline-And-Gate.md` in this folder. Gate:
`.maestro/playbooks/Working/w22/gate.sh`. Read SPEED-01's Notes (experiment 205) first.

**Why first.** In the owner's trace `killOrderBy` is the largest kernel function (≈ 28 % of the Tight raise) and
`recoveryOf` the second (≈ 24 %). Both run inside `raiseRating` (`kernel/assembly/index.ts`), once per rated
vector. `raiseScore` already gets its kill order from the kept roster of W18 P2.1 (`raiseKillOrder`, −14.6 % on the
raise); `raiseRating` still calls `killOrderBy(types, rRows, rWork, T_ORDER)` and rebuilds the whole roster. Tight is
24 % of production pool CPU, so the two are worth up to ≈ 6 % and ≈ 5 % of it. Both are exact refactors.

## Tasks

- [x] One kill order for the rating. Read `raiseScore`, `raiseKillOrder`, `killOrderCheck` and `raiseRating`, and
  every caller of `raiseRating` (`raisePointSlots`, its whole-vector twin, `raisePairwise`, `raiseMove`). Using 205's
  counts, pick:
  (a) when the counts `raiseRating` is asked about are bit for bit the counts `raiseScore` last ordered, reuse that
  roster (and the `stackType` / `stackCount` it leaves, which `recoveryOf` reads; check nothing between overwrote
  them, `attackOrderOf` and `journalDamage` included);
  (b) otherwise a second kept roster for the rating (its own copy and its own counts), updated by the same
  take-out-and-put-back, rebuilt in full under the same conditions as P2.1's (start of a `raise()`, more than
  `KEEP_MOVES` types changed, a NaN HP or rank).
  Extend the `KILL_CHECK` shadow so the profile build compares the rating's roster to a full `killOrderBy`. Test
  first, red on a deliberately wrong roster (for example skip the put-back), then green: the raise goldens
  (`tests/golden/raise*.json`), the kernel raise parity tests, and the advisor golden byte-identical; `scored`
  unchanged. A/B in-process on the timing fixture (experiment 184's Tight raise timing, arms interleaved, ≥ 30
  rounds): keep it if Tight drops ≥ 2 % of pool CPU (≈ 8 % of the raise). Commit:
  `Kernel: the rating reads the kept kill order (W22 step 1)`.

- [x] The bill from per-type terms. In `recoveryOf(k)` every stack's four terms (silver, gold, dragon coins, queue
  seconds) depend only on its type, its count, the mode, and under mode 2 whether its tier is its family's top
  revived tier (`topTier`). Keep, per type, the count the terms were last computed for, the top-tier flag, and the
  four terms; recompute a type's terms only when one of those changed; then **add the terms in kill order exactly as
  today** (the same `+=` sequence, so the floats are bit for bit the same). Reset the table when the table, the mode
  or the temple divisor changes (`bind`, `setTable`, a new `raise()`). Keep `recoveryOf`'s other callers (the plan's
  march bill) on the cached path only if their table and mode are the raise's; otherwise leave them on the full
  path. Shadow check in the profile build: recompute in full and compare the four totals with `==` (and both NaN).
  Red first on a stale key (leave the count out), then green on the same gates as above. A/B as above, keep at ≥ 2 %.
  Commit: `Kernel: the recovery bill from per-type terms (W22 step 2)`.

- [x] Production re-measure: `pnpm kernel:build`, the split harness ×3 (`SPLIT=1 … run.mjs <fixture> 6 3`), answer
  hash unchanged. Fill "after 1" and "after 2" in `docs/plans/next-speed.md` §3. Gate script, all PASS. Commit the
  doc: `W22: the rating measured`.

## Notes

### Task 1: one kill order for the rating: WON'T DO (2.4 % of the raise)

Built the single kept roster (`raiseRating` and the plan's own bill call `raiseKillOrder`, which tracks whichever
counts were last asked; (a) and (b) fold into one roster because every rating after a battle asks the battle's counts
and the rest move one or two slots). The `KILL_CHECK` shadow was extended to the rating: red on a deliberately
wrong roster (the put-back skipped, then a corrupted slot, trapping in `raiseRating`), green on both of
`tests/kernel/kill-order.test.ts`'s tests (253 s). Experiment 208 (new, `tools/theorycraft/208-the-rating-ab.test.ts`,
temporary `raiseAb` switch, patch in `docs/research/patches/w22-208-rating-kept-order.patch`) replays the 199 Tight
searches of the 10-11 account's generic-probe pass, interleaved, 30 rounds: new 3 240.5 ms vs old 3 318.4 ms,
**−2.4 % of the raise ≈ 1.2 % of pool CPU**, below the 2 % bar. Reverted. The profile build's 28 % for `killOrderBy`
was dev:profile inflation (a full sort of ~10 stacks is ~1–2 % of the raise on the release kernel).

### Task 2: the bill from per-type terms: WON'T DO (upper bound under the bar)

Measured before building: the old arm calling `recoveryOf` 20 extra times per rating costs 3 767 ms on a 3 378 ms
raise, so one `recoveryOf` is **5.6 % of the raise** (≈ 2.7 % of pool CPU, Tight being 49 % of it). A free bill
would not reach the 8 % of the raise the bar asks for, and a cache that still sums the terms in kill order saves
about half. Not built (probe patch: `Working/w22/208-bill-probe.patch`).

### Task 3: production re-measure

Kernel unchanged, so the release kernel is the 10-11 baseline's: `SPLIT=1 … run.mjs <10-11> 6 3` gave 12 096 ms
(machine variance against 13 832 ms), pool CPU 65.4–69.0 s, Tight 49.4–49.6 %, planner 47.7–47.9 %, hash
`a9c9defd5d22 427cfa3135cd` unchanged (`Working/w22/prod-after-02.txt`). Plan §3 "after 1" / "after 2" filled
(asterisked: same kernel) and the WON'T DO write-up added. Gate: kernel:build, test, plan-benchmark, benchmark diff,
184 PASS; typecheck and lint failed on an unused import in the new 208 file, fixed, both clean afterwards.

