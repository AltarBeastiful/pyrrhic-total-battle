# Speed 03: the sizer's two journals in one pass

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §1 step 3. Rules: top of `SPEED-01-Baseline-And-Gate.md`. Gate:
`.maestro/playbooks/Working/w22/gate.sh`.

**Why.** `journalDamage` is 7.1 % self in the owner's trace. `sizerScore` (the relaxed walk) and the sizer's march
(`R_MIN_DAMAGE`, the average) call it twice in a row on the same roster: `journalDamage(k, false)` then
`journalDamage(k, true)`. The two walks kill the same stacks in the same order (`dead`); they differ only in the
army's opening attack, so the `acted` marks and the cursor differ. The K6 census (196) put a ceiling of 0.13 % on
fusing them in-process, against the trace's 7.1 %: measure first, build only if the A/B pays. This is also Track C's
lead (a) in `docs/plans/sizer-track-c.md` §5.

## Tasks

- [x] Measure the ceiling. In the profile kernel, count `journalDamage` calls by caller (`raiseScore`: one walk;
  `sizerScore` and the sizer's march: pairs) on the timing fixture's advisor run, and read their share from a profile
  build in-process (experiment 197's profiler, `tools/perf-trace/subtree.py` style split). Write the table into
  Notes. If the paired calls are below 2 % of pool CPU, tick the next task with `WON'T DO` and the figures.

- [x] Fuse the paired walks. Add `journalBoth(k)`: one loop over the kill sequence that keeps two `acted` arrays
  and two cursors and fills two totals, each total receiving its values **in the same order** as its own
  `journalDamage` would, so both floats are bit for bit the same (write the argument in a comment: the end-of-round
  sweep and the `attack()` calls per orientation). Use it where both orientations are summed back to back. Keep
  `journalDamage` for the single walk of `raiseScore`. Test first, both paths: a door-level parity test that runs
  both versions over every roster the sizer parity recorder (`tests/kernel/sizer-shape-parity.test.ts`) sees and
  compares with `Object.is`; red on a deliberate swap of the two totals, then green. Gates: sizer parity, sizer
  pool-cache parity, plan JSON identical, advisor golden, plan benchmark diff none. A/B in-process (planner, timing
  fixture, `Working/w18/p34-ab.*` pattern, ≥ 30 rounds interleaved): keep at ≥ 2 % of the planner. Commit:
  `Kernel: the two journals in one pass (W22 step 3)`.

- [x] Fill "after 3" in `docs/plans/next-speed.md` §3 (production split harness ×3, hash unchanged). Commit the doc:
  `W22: the journals measured`.

## Notes

### Task 1: the ceiling

New experiment 209 (`tools/theorycraft/209-the-journal-pairs.test.ts`, temporary kernel probe
`docs/research/patches/w22-209-journal-probe.patch`): `planCampaign` on the 10-11 export, one extra pair at each
caller, 30 plans interleaved. Pairs per plan: `sizerScore` 19 080, sizer march 3 242. One extra pair: +4.1 %
(sizerScore), +3.1 % (march) of the planner, ≈ 3.4 % of pool CPU for all pairs. That is above 2 %, so the fusion
was built to measure it (the call counts and a release-kernel timing replace the profile build: the extra-pair
delta is the pair's true cost).

### Task 2: journalBoth: WON'T DO

Built `journalBoth(k)` (shared kill sequence, two `acted` arrays and cursors, each total fed in its own order);
`planCampaign` answers equal. A/B: −2.1 %, −0.3 %, −0.9 % of the planner (≈ 0.4 % of pool CPU), below the 2 % bar,
so reverted before the parity test and gates (nothing kept). Figures in `tools/theorycraft/out/209-the-journal-pairs.md`.

### Task 3: production re-measure

Kernel unchanged. Split harness ×3: 13 057 ms, pool CPU 70.9–72.3 s, Tight 49.1–49.6 %, planner 47.5–48.0 %, hash
`a9c9defd5d22` unchanged (`Working/w22/prod-after-03b.txt`). A first run (`prod-after-03.txt`, right after the
revert) printed a different hash (`a939384dff0f b23c81909d40`) and the immediate re-run matched; the first was
probably a stale build of the probe kernel in the harness' dist, not a nondeterminism of the committed kernel, but
it was not investigated further. Plan §3 "after 3" and the WON'T DO write-up added.
