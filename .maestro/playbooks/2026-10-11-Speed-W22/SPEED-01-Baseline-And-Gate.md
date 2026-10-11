# Speed 01: the baseline, the gate, the name of the tail

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` (read §0 first: the measured figures and why the owner's trace is read for shape only).

## The rules of the whole playbook

- **Nothing moves but the clock.** Every plan, stop, position row, advisor row, `scored` count and benchmark figure
  stays byte-identical. A change that moves any reading is a *trade*: stop, write it in Notes, leave it on a branch
  for the owner. Never re-base a pin or a golden (`tests/golden/*.json`, `tools/theorycraft/out/benchmark-latest.*`).
- **One test, both paths, red first.** A parity test runs on the kernel and on the TypeScript reference
  (`decliningKernel`, `tests/kernel/declining.ts`); show it red on a deliberately broken change before green.
- **No cache without a census** (≥ 2 hits per entry and ≥ 3 % projected pool CPU). An exact refactor is kept when its
  in-process A/B buys ≥ 2 %; otherwise revert it and write `WON'T DO` with the figures in Notes and in the plan.
- **Judge speed in production or in-process, never on a `dev:profile` trace.** Rebuild the release kernel
  (`pnpm kernel:build`) before any timing: `kernel/build/kernel.wasm` may be the profile build left by `dev:profile`.
- **Profiling code folds out of `pnpm build`** (`isDefined(CENSUS)` in the kernel, the profiling flag in TS); grep
  `dist/` to check.
- Do not stage `todos.md`, `.maestro/playbooks/performance-optimization/`, or any `pyrrhic-my-account-*.json` at the
  repo root (personal data). Scratch output goes to `.maestro/playbooks/Working/w22/`.
- Commit trailer: the model that runs the session (`feedback-commit-attribution`).

## The two fixtures

- **Exactness**: `tests/fixtures/pyrrhic-my-account-2026-09-17 (2).json` (`ownerProfile()` in
  `tests/engine/plan-scenarios.ts`). The advisor golden runs on it. Tight is small on it (0.55 % of CPU), so it does
  not exercise the raise much: the raise goldens (`tests/golden/raise*.json`) and the timing fixture do.
- **Timing**: `pyrrhic-my-account-2026-10-11.json` at the repo root (the owner's current account, exported
  2026-10-11; his live run asked 145 jobs against 106 on the older export), not committed. **Every timing and A/B in
  this playbook runs on it.** The older `pyrrhic-my-account-2026-10-07.json` stays as a second timing fixture, only
  to compare with the W18–W20 figures (the 6c932f8 column of the plan was measured on it). Read either only when
  present; never copy them into the tree. Theory files that hard-code the 10-07 name take the fixture from an
  environment variable (`PYRRHIC_TIMING_FIXTURE`, default the 10-11 file) when touched by this playbook.

## Tasks

- [x] Write the W22 gate. Copy `.maestro/playbooks/Working/w18/gate.sh` and `bench-diff.sh` to
  `.maestro/playbooks/Working/w22/`. Change the restore: snapshot `tools/theorycraft/out/benchmark-latest.{json,md}`
  **at the start of the run** (into a `mktemp -d`) and put that snapshot back at exit, instead of copying
  `benchmark-pre-w18.*` (stale now). Log to `Working/w22/`. Run it once on HEAD; record pass/fail and time of each
  step in Notes. No commit (scratch).

- [x] Record the production baseline. `pnpm kernel:build`, then
  `SPLIT=1 node .maestro/playbooks/Working/w18/prod/run.mjs pyrrhic-my-account-2026-10-11.json 6 3`; save the output
  as `Working/w22/prod-baseline-1011.txt`. Once more on the 10-07 export (`prod-baseline-1007.txt`, expected hash
  `a9612b9ca0a9`, ≈ 11.0 s) to tie it to the W20 figures. Note in Notes for each: min wall per pass, pool CPU, Tight
  and planner CPU, answer hash; the 10-11 hash is the one every later step must keep. Then the in-process figures
  every later step compares against, on the 10-11 export: experiment 197 (planner per plan, GC pauses, allocated
  MiB per plan) and experiment 184 (`THEORY=1`, Tight per call). Save them as `Working/w22/197-baseline.md`,
  `184-baseline.md`. Add a "6c932f8, 10-11" column to `docs/plans/next-speed.md` §3 and fill it.

- [x] Count the raise's kill orders and bills by caller, on the profile kernel. Experiment 196's counters exist
  (`cKillOrdersScore`, `cKillOrdersRating`, `cKillOrdersSizer`, `cRatings`). Add a small theory file
  `tools/theorycraft/205-the-rating-census.test.ts` (`THEORY=1`, profile kernel, timing fixture, one advisor run
  in-process as 196 does) that reports per Tight raise: `raiseScore` calls, `raiseRating` calls, how many ratings
  ask for **the same counts bit for bit** as the `raiseScore` just before them (add a profile-only counter beside
  `cKillOrdersRating`), how many types changed between consecutive ratings (histogram 0, 1, 2, 3+), and, for
  `recoveryOf`, how many of its stacks have the same (type, count) as in the previous call. Write
  `tools/theorycraft/out/205-the-rating-census.md`. This sizes SPEED-02's two steps. Commit:
  `Experiment 205: the rating's kill orders and bills, counted (W22)`.

- [ ] Time every job, and name the tail. On the 10-11 export, in-process (one lane, no clock), time every job of
  every pass (`runProbe`, the captains jobs, the baselines) with `performance.now()`, split into `planCampaign` and
  `positionTrades`. Save one row per job to `Working/w22/job-times-1011.json`: pass, probe id, kind, total ms, plan
  ms, Tight ms, Tight calls, plus **every input feature that could predict the cost** (the probe's plan input:
  stack types fielded, leadership / authority / dominance capacities, hired types, horizon, marches; the bar's
  number of stops; whether the probe changes the troop set). Do the same on the 10-07 export
  (`job-times-1007.json`). SPEED-06 fits its cost estimate on these files. In Notes, list the 10 longest jobs of the
  10-11 export with their figures and how far the longest sits from the median. Write the longest into
  `docs/plans/next-speed.md` §1 step 6. Commit the timing harness only (not the account data):
  `W22: per-job timings and their inputs`.

## Notes

### Task 1: the gate (done)

`Working/w22/gate.sh` and `bench-diff.sh` copied from w18. The restore now snapshots `benchmark-latest.{json,md}`
into a `mktemp -d` at the start and puts them back at exit (no `benchmark-pre-w18.*`). Logs go to `Working/w22/`.
First run on HEAD (9e052a8), all PASS, ~9m56 wall:

| step | result | time |
| --- | --- | --- |
| pnpm kernel:build | PASS | 2 s |
| pnpm typecheck | PASS | 1 s |
| pnpm lint | PASS | 23 s |
| pnpm test | PASS | 295 s |
| plan-benchmark alone | PASS | 159 s |
| benchmark diff vs HEAD | PASS | 0 s |
| 184 positions on the kernel | PASS | 115 s |

Tree unchanged after the run (only the untracked personal files). Scratch, not committed.

### Task 2: production baseline (done)

`pnpm kernel:build` (release), then the SPLIT harness, 6 workers, 3 runs. Files in `Working/w22/`.

| export | min wall, all passes | per pass (upgrades / captainAdvice / captains / other) | pool CPU | Tight CPU | planner CPU | hash |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| 10-11 (`prod-baseline-1011.txt`) | 13 832 ms | 2791 / 1330 / 8679 / 2334 | 75.1–77.2 s (142 jobs) | 37.1–38.2 s (908–916 calls, ≈ 40.7 ms each) | 35.8–36.7 s | `a9c9defd5d22 427cfa3135cd` |
| 10-07 (`prod-baseline-1007.txt`) | 12 620 ms | 4023 / 1752 / 5332 / 3194 | 65.8–68.5 s (106 jobs) | 15.7–16.4 s | 49.5–51.5 s | `a9612b9ca0a9` (matches) |

The 10-07 hash ties to W20; wall and CPU run ~15 % above the recorded 11.0 s / 57–59 s (machine slower today, same
code), so this session's own figures are the reference. **The 10-11 hash is the one every later step keeps.** On the
10-11 export Tight is half the pool CPU (49 %), the planner 48 %.

In-process, 10-11 export: `197-baseline.md` (`PLANNER_ACCOUNT=pyrrhic-my-account-2026-10-11.json`): 1 030 ms CPU /
426 ms wall per plan, 285 180 kernel crossings, 16 GC pauses = 40.3 ms (3.9 % of CPU), **179.5 MiB allocated per
plan**. `184-baseline.md` (`THEORY=1`; 184 runs on the benchmark armies, not the account): 68 stops, 340
readings, one march all five positions median 0.7 ms, worst 86 013 ms. Plan §3 has the new column. The tracked
`out/197…`, `out/184…` files were restored with `git checkout` after copying.

### Task 3: the rating census, experiment 205 (done)

Profile-only counters beside `cKillOrdersRating` (`kernel/assembly/index.ts`, folded out of the release by
`isDefined(CENSUS)`; `raiseCensus` now writes 15 f64, read in `src/kernel/raise.ts`, typed in `RaiseCensus`).
`tools/theorycraft/205-the-rating-census.test.ts` (`THEORY=1`, ~80 s) writes `out/205-the-rating-census.md`.
Release kernel rebuilt after the profile build; `raise-census` test green; typecheck and lint clean.

On the 10-11 export, 921 Tight raises:

- `raiseScore` 22.45 M (24 377 per raise), `raiseRating` 35.06 M (38 069 per raise), 12.64 M of those on a memo hit.
- **Every rating that follows a battle asks for the same counts bit for bit as that battle** (22.42 M, 100 % of the
  misses, 63.9 % of all ratings): its `killOrderBy` is a rebuild of the one `raiseScore` just built, so SPEED-02 step 1
  (share the roster) can serve all of them. The memo-hit ratings (36 %) have no battle before them, but they still
  pay a kill order.
- Between consecutive ratings 92.5 % change one type, 7.1 % two, 0.4 % three or more, 0 % none: a kept roster
  moved by one slot (as `raiseKillOrder` does for the battle) covers 99.6 %.
- `recoveryOf`: 405 M stacks billed, **90.7 % have the same (type, count) as in the previous call** of the same
  search: an incremental bill (subtract and re-add the changed stack) is a real lever.
- Exactness fixture (420 raises): same shape, 100 % of ratings equal the preceding battle's counts (a memo-hit
  rating may also repeat the previous battle's vector, so the share of misses reads 105 % there), 78.9 % one type
  moved, 83.8 % of recovery stacks unchanged.
- 196 only had its type list adjusted for the new fields.
