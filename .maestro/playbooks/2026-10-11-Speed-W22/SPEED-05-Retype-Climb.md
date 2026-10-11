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

- [x] Census. On the timing fixture, in-process, count per plan: `retypeMarch` calls, how many take the
  `retypeWalk` door and how many climb in JS (and why: a clock, a declining kernel, a shape the door does not take),
  the `climb` steps per call, and the time under each path (experiment 197's profiler). Write the table into Notes.
  If the JS climb is below 2 % of the planner, tick the next task `WON'T DO` with the figures.

- [x] Port the paid part. Either widen `retypeWalk` to the cases that still climb in JS, or add a `retypeClimb` door
  that runs `climb`'s loop in the kernel with the march it already has (read `retypeWalk`'s door for the pattern:
  header word for the rates, scratch per instance). TypeScript kept as the declining reference. One parity test on
  both paths (every recorded `retypeMarch` call, `Object.is` on every field), red first on a deliberate off-by-one
  in the step, then green. Gates: plan JSON, advisor golden, plan benchmark diff none. A/B in-process, keep at ≥ 2 %
  of the planner. Commit: `Kernel: retype climb as one door (W22 step 5)`.

- [ ] Fill "after 5" in `docs/plans/next-speed.md` §3 (production split harness ×3, hash unchanged). Commit the doc:
  `W22: the retype climb measured`.

## Notes

- Step 1 (census, experiment 211, `tools/theorycraft/211-the-retype-census.test.ts`, needs the patch
  `Working/w22/211-retype-census.patch` on `src/engine/retype.ts`; table in `tools/theorycraft/out/211-the-retype-census.md`;
  10-11 fixture, 3 plans in-process, planner 278 ms wall per plan):

  | Path | Calls/plan | ms/plan | % of planner | Steps/call | Battled/call |
  |---|---:|---:|---:|---:|---:|
  | `retypeWalk` door | 5.0 | 3.1 | 1.1 % | – | 1 (3 × 11) |
  | JS climb (11 × 11, perms > 10 000; no clock, so none by deadline, none declined) | 6.0 | 17.9 | 6.4 % | 13.0 | 600 |

  Inside the JS climb (ms/plan): `build` 6.2, kernel battles (`marchBill`) 4.7, the rest 7.0 (neighbour arrays,
  `join` keys and the `seen` map, rate). Every climb is tierCandidate (three starts sharing one `seen`). Above the
  2 % bar, so the door is ported: the kernel climbs, builds, battles and rates; JS keeps `outOfTime` (deadline ⇒ JS).
- Step 2 (the `retypeClimb` door): `kernel/assembly/index.ts` `retypeClimb` runs the three climbs of `retypeMarch` in
  one call (build, battle, rate, the seen table as an open-addressed hash with a stamp per call, same neighbour order
  and tie rules); `PlanKernel.retypeClimb` (`src/engine/fast.ts`, `src/kernel/plan.ts`, whose `layRetype` now lays
  both `retypeWalk` and `retypeClimb`); `retypeMarch` uses it when there is no deadline and falls back to the
  TypeScript climb (the reference) when the door declines (k > 16, m > 255, or the table 3/4 full). Parity
  `tests/kernel/retype-climb-parity.test.ts` (door against a plain TypeScript climb on every recorded call, also under
  step caps 1 and 2 since the planner's cap of 60 is never reached; plan JSON door against declined). Red first on a
  deliberate off-by-one (`step <= steps`): 22 failures at door level (the plan-level test stays green, as the cap is
  not reached there); green after. Gate (`Working/w22/gate.sh`): all PASS (plan benchmark diff none, 184 positions
  on the kernel pass). A/B (experiment 212, 40 and 60 rounds interleaved, door declined against on): wall −7.4 % and
  −5.7 % of the planner (q1 −4.9 / −3.5 %), CPU −13.6 / −4.1 %: kept (≥ 2 %).
