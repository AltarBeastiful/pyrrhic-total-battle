# Speed 04: the planner's garbage

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §1 step 4. Rules: top of `SPEED-01-Baseline-And-Gate.md`. Gate:
`.maestro/playbooks/Working/w22/gate.sh`.

**Why.** The planner is 75 % of production pool CPU and its JavaScript is spread thin (no function above 2.4 % self),
so porting more of it to the kernel buys little (the kernel port paused for that reason). What is concentrated is
allocation: experiment 197 measures **368 MiB allocated per plan** and GC at **11.8 %** of the planner. Known
sources: the sizer-depth shapes rebuilt on every memo miss (57 MiB a plan), `copyStacks` (13.7 MiB a plan), `build`
in `src/engine/retype.ts`, `countsKey` strings, the `Candidate` objects `evaluateVector` still builds. W18 Drill 05
P3.3 already cut GC pauses −30 % this way (flat `KernelMarch` bill, `finaleFor` scratch, cached prefix sets); its
Notes list two attempts that measured worse (key-by-key caps object, string concat): do not repeat them.

## Tasks

- [x] Census of allocation sites. Extend experiment 197 (or add `tools/theorycraft/206-the-planner-garbage.test.ts`)
  to print, on the timing fixture, the sampled heap profile's top 15 allocation sites by MiB per plan (bottom-up:
  the JS function that allocated, its caller), and the GC pause ms per plan (`PerformanceObserver`, the figure to
  judge by; sampled heap bytes are too noisy to judge a change). Write `tools/theorycraft/out/206-the-planner-garbage.md`.
  Commit: `Experiment 206: where the planner allocates (W22)`.

- [x] Fix the largest site. Pick the top site from 206 whose fix is local: reuse a buffer held by the memo or the
  scratch (as `finaleFor` does), build a result lazily when its caller only reads a field, or return a typed view
  instead of an array of objects. Answers byte-identical (plan JSON, advisor golden, plan benchmark diff none, the
  site's own parity test if it is a kernel door). A/B in-process (≥ 30 rounds interleaved, GC pause ms and planner
  CPU): keep at ≥ 2 % of the planner. Commit: `Planner: <site> without garbage (W22 step 4a)`.

- [x] Fix the second site, the same way. Commit: `Planner: <site> without garbage (W22 step 4b)`.

- [x] Fix the third site only if 206 projects it ≥ 2 % of the planner. Commit: `(W22 step 4c)`. WON'T DO: no remaining site projects ≥ 2 % (see Notes).

- [x] Fill "after 4" in `docs/plans/next-speed.md` §3 (production split harness ×3, hash unchanged), and the
  allocated MiB per plan and GC pause ms before and after in Notes. Commit the doc: `W22: the planner's garbage measured`.

## Notes

- Step 1 (census, `tools/theorycraft/206-the-planner-garbage.test.ts`, 10-11 fixture): 182.6 MiB sampled per plan
  (197 read 179.5; the 368 MiB quoted in the plan is the older figure), GC 12.2 pauses = 32.3 ms per plan, CPU 468 ms.
  Top sites: `scorer` (called by `evaluateVector`) 38.8 MiB 21 %; `next` (iterator, from `evaluateVector`) 15.1 MiB 8 %;
  `sizerShape` kernel door (from `sizerKeptOf`) 8.9 MiB; `evaluateVector` itself 8.0 MiB; `marchRecovery` (from `record`)
  6.0 MiB; `replayed` 3.5; `sizerKeptOf` 3.5; `finaleFor` 3.5; `countsKey` 3.0. Full table in
  `tools/theorycraft/out/206-the-planner-garbage.md`. Steps 4a–4c start from `scorer` and the `next` iterator.
- Step 4a (`evaluateVector` loops, experiment 210, `tools/theorycraft/210-the-planner-garbage-ab.test.ts`): the
  top sites were `scorer` and the `next` iterator; with `--no-turbo-inlining` the `scorer` self share fell to
  17.7 MiB and `copyStacks` showed 13 MiB. First try (the scorer reads the sizer's mercs off the memo entry,
  saving one `copyStacks`) was ≈ 3 MiB, inside the noise (±5 % CPU, ±1.5 % wall in an old-against-old run):
  reverted. Kept: indexed loops in place of `for…of` in `evaluateVector` (the `next` site). 60 rounds
  interleaved, two runs: wall −6.6 / −8.2 %, first quartile −3.9 / −3.6 %, GC pauses 12 → 11 per plan (−8.3 %);
  CPU −3.8 / +8.0 % (all threads, too noisy). Answers equal arm to arm; gate: typecheck, lint, tests, plan
  benchmark, bench diff, 184 all pass.
- Step 4b (`marchRecovery`'s `[...rungs, ...mercs].filter` replaced by a module scratch array, experiment 210 label
  `bill`/`bill2`, 60 rounds interleaved each): run 1 CPU −2.6 %, wall −8.1 % (q1 −2.7 %), GC 28.2 → 28.2 ms; run 2
  CPU +26.8 % (noise), wall −4.4 % (q1 +0.9 %), GC −3.0 %. Not reproducible, GC pauses unchanged at 11: reverted
  (WON'T DO, under the 2 % bar). The remaining top sites are either memoised results (`sizerShape` door, `sizerKeptOf`
  kept records: retained, not garbage) or each ≤ 1.9 % of allocation, so 4c (needs ≥ 2 % projected) is also WON'T DO.
- Step 5 (docs): after 4 production, 3 runs: min wall 13 577 ms, pool CPU 73.7–76.5 s, Tight 37.5–38.6 s, planner 34.0–35.8 s,
  hash a9c9defd5d22 unchanged (`Working/w22/prod-after-04.txt`; machine slower than earlier re-runs, so 4a's in-process gain is not visible at this noise).
