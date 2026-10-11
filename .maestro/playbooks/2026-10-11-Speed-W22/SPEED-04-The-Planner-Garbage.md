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

- [ ] Fix the largest site. Pick the top site from 206 whose fix is local: reuse a buffer held by the memo or the
  scratch (as `finaleFor` does), build a result lazily when its caller only reads a field, or return a typed view
  instead of an array of objects. Answers byte-identical (plan JSON, advisor golden, plan benchmark diff none, the
  site's own parity test if it is a kernel door). A/B in-process (≥ 30 rounds interleaved, GC pause ms and planner
  CPU): keep at ≥ 2 % of the planner. Commit: `Planner: <site> without garbage (W22 step 4a)`.

- [ ] Fix the second site, the same way. Commit: `Planner: <site> without garbage (W22 step 4b)`.

- [ ] Fix the third site only if 206 projects it ≥ 2 % of the planner. Commit: `(W22 step 4c)`.

- [ ] Fill "after 4" in `docs/plans/next-speed.md` §3 (production split harness ×3, hash unchanged), and the
  allocated MiB per plan and GC pause ms before and after in Notes. Commit the doc: `W22: the planner's garbage measured`.

## Notes

- Step 1 (census, `tools/theorycraft/206-the-planner-garbage.test.ts`, 10-11 fixture): 182.6 MiB sampled per plan
  (197 read 179.5; the 368 MiB quoted in the plan is the older figure), GC 12.2 pauses = 32.3 ms per plan, CPU 468 ms.
  Top sites: `scorer` (called by `evaluateVector`) 38.8 MiB 21 %; `next` (iterator, from `evaluateVector`) 15.1 MiB 8 %;
  `sizerShape` kernel door (from `sizerKeptOf`) 8.9 MiB; `evaluateVector` itself 8.0 MiB; `marchRecovery` (from `record`)
  6.0 MiB; `replayed` 3.5; `sizerKeptOf` 3.5; `finaleFor` 3.5; `countsKey` 3.0. Full table in
  `tools/theorycraft/out/206-the-planner-garbage.md`. Steps 4a–4c start from `scorer` and the `next` iterator.
