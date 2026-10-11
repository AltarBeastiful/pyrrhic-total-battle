# Speed 05: `retypeRow`'s climb in the kernel

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §1 step 5. Rules: top of `SPEED-01-Baseline-And-Gate.md`. Gate:
`.maestro/playbooks/Working/w22/gate.sh`.

**Why.** `retypeRow` → `retypeRowNow` → `retypeOne` → `retypeMarch` → `climb` is 3.5 % of the owner's trace (≈ 11 % of
the planner): JS 1.7 %, builtins 1.3 % (`build` allocates), wasm 0.5 %. The `retypeWalk` kernel door
(`src/kernel/plan.ts`, parity test `tests/kernel/retype-walk-parity.test.ts`) already walks the whole space in one
call where no clock applies (`src/engine/retype.ts` around line 206); the rest still climbs in JS around the
kernel's march. High effort (a new door), so it comes after the cheaper steps, and only what the census pays.

## Tasks

- [ ] Census. On the timing fixture, in-process, count per plan: `retypeMarch` calls, how many take the
  `retypeWalk` door and how many climb in JS (and why: a clock, a declining kernel, a shape the door does not take),
  the `climb` steps per call, and the time under each path (experiment 197's profiler). Write the table into Notes.
  If the JS climb is below 2 % of the planner, tick the next task `WON'T DO` with the figures.

- [ ] Port the paid part. Either widen `retypeWalk` to the cases that still climb in JS, or add a `retypeClimb` door
  that runs `climb`'s loop in the kernel with the march it already has (read `retypeWalk`'s door for the pattern:
  header word for the rates, scratch per instance). TypeScript kept as the declining reference. One parity test on
  both paths (every recorded `retypeMarch` call, `Object.is` on every field), red first on a deliberate off-by-one
  in the step, then green. Gates: plan JSON, advisor golden, plan benchmark diff none. A/B in-process, keep at ≥ 2 %
  of the planner. Commit: `Kernel: retype climb as one door (W22 step 5)`.

- [ ] Fill "after 5" in `docs/plans/next-speed.md` §3 (production split harness ×3, hash unchanged). Commit the doc:
  `W22: the retype climb measured`.

## Notes
