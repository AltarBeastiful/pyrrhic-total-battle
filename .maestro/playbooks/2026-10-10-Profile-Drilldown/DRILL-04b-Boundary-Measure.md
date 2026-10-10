# Drill 04b: The boundary and the breakdown, measured before Drill 05

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md` §0.2 and §3. Rules: top of `DRILL-01-Measure-And-Census.md` in this folder.
Gate: `.maestro/playbooks/Working/w18/gate.sh`. Scratch: `.maestro/playbooks/Working/w18/`.

Why this drill exists: Drill 05 ports or trims the planner's JavaScript, and it must be aimed at the real cost. Two
questions are still open. (1) Does the JavaScript ↔ wasm boundary cost time of its own? Every kernel door is a
JavaScript call that writes rows and counts into wasm memory, reads a result back, and allocates a result object;
`bind` and `packRequest` build a `Float64Array` per request and `new WebAssembly.Instance` per bound request.
(2) The trace (49 % Tight, 48 % planner) and the in-process run (13 % Tight) disagree, so the ranking itself is not
settled. Drill 05 must not start until both are measured on the same run.

The boundary has three parts, and each is measured separately, not summed by guess:

- **Crossings**: how many times each kernel door is called per plan (`march`, `bill`, `battle`, `sizePool`,
  `sizeStacks`, `ladderShape`, the raise's `position`), and how many wasm instances are created per plan.
- **Glue**: the JavaScript time inside each door's wrapper (`lay`, `searchReduction`, `checkEnemy`, `bound.out` reads,
  the result object) minus the time inside the wasm call itself.
- **Copies**: bytes written into and read out of wasm memory per plan (`packRequest` tables, `.slice()` results,
  `Array.from` and `Int32Array.from` in `orderByRow`, `enumPtr`).

## Tasks

- [ ] Count the boundary. Write `tools/theorycraft/198-the-boundary.test.ts` (`THEORY=1`, skipped otherwise, like 196)
  that plans the timing fixture's setup and the exactness fixture's, in-process on one inline lane with no clock, and
  counts: calls per kernel door per plan, `new WebAssembly.Instance` per plan (wrap the constructor in the test, do not
  change production code), bytes copied in and out of wasm memory per plan, and how many `march`/`bill` calls share a
  bound request versus a fresh one. Write `tools/theorycraft/out/198-the-boundary.md`. Commit: `Experiment 198: the
  kernel boundary on the owner's account (W18 P3.0)`.

- [ ] Time the glue. In the same test (or `tools/theorycraft/198b-the-glue.test.ts` if 198 grows), time each door with
  `performance.now()` around the wasm call alone and around the whole wrapper, over the same plans, and report the glue
  share per door as a percentage of the planner's wall time. Do not add timers to `src/`: wrap the exports object the
  test receives from `createPlanKernel` (or time from outside through `planCampaign`). Record the figures in 198's
  report. Commit with the test: `Experiment 198b: the glue of each kernel door (W18 P3.0)`.

- [ ] Settle the Tight share. Run the profiler-free browser timing that `docs/plans/profile-drilldown.md` §0.2 asks for:
  `.maestro/playbooks/Working/w18/passes.mjs` on the timing fixture (no `--cpu-prof`, no `dev:profile` build: the
  production `pnpm build` served by `pnpm preview` on a free port), and a second run with the Tight raise disabled
  through the census-free flag only if one exists (otherwise compare with 196's figures and say so). Write the Tight
  share of pool CPU from a `performance.now()` split in the browser if the platform allows it, otherwise write that it
  could not be measured. Record both numbers in Notes and in `docs/plans/profile-drilldown.md` §0.2 (a new paragraph,
  do not overwrite the trace's figures). No commit to `src/`.

- [ ] Rank the breakdown. Write, in Notes, one table ordering every function that carries ≥ 2 % of the planner's wall
  time on the timing fixture, by its self time, its glue share (from the previous tasks), and its kind: kernel compute,
  kernel glue, JavaScript compute, allocation, or GC. This is Drill 05's input: Drill 05's experiment 197 profiles the
  same planner, and its ranking must agree with this table. Commit the doc: `W18: Drill 04b measured`.

- [ ] Decide the boundary's fix, or write that none is needed. If the glue of a door is ≥ 10 % of the planner's wall
  time, or the instance count is more than one per distinct request, write a short plan in Notes: which door, which
  copy or instance it removes, and the op-for-op argument that the answer does not move. Do not implement it here; it
  goes to Drill 05 as its first item, ahead of the JavaScript half. If no door reaches 10 %, write "boundary not a
  lever" with the figures and tick. Commit with the Notes: `W18: Drill 04b decision`.

**Run order (decided 2026-10-11, owner):** Drill 04 (caches, verdicts re-checked first) → **04b (this drill)** → Drill 05
(planner JS, with the boundary fix first if 198 says so) → Drill 06 (page). Drill 06 is deferred until 05 is done, because
its page figures depend on how much of the planner's work survives the owner's planned cuts.

## Notes

### Findings carried in (2026-10-11, from the conversation that wrote this drill)

- **Not measured yet, hypothesis only:** the kernel boundary may cost time. Code reading found: `bind()` in
  `src/kernel/plan.ts` (~line 337) and `src/kernel/raise.ts` (~line 153) allocate a `WebAssembly.Instance` and copy a
  table per request object; the bound-request cache is a `WeakMap` keyed by identity, so a planner that builds a new
  request per candidate pays that every time. `lay()` does a `Map` lookup per stack; `march`/`bill` allocate a result
  object per call; `orderByRow` builds a `Map` and an `Int32Array` per bind.
- **The Tight share is still unresolved:** trace 49 % of pool CPU, in-process 13 % of run CPU (experiment 196). The
  rerun of 196 on HEAD confirms 13.5 %, so the gap is not a stale figure.
- **Drill 04 verdicts (earlier, on the Drill 03 HEAD rerun):** K1 2.4 % / 0.59 hits per entry, K3 ≤ 1.2 %, K5 ≤ 1.0 %,
  K4 1.3–2.6 % with its wall cost already removed by P1.2. None meets the cache rule on the in-process figures; Drill 04
  must still re-check them on its own HEAD before ticking `WON'T DO`.
- Experiment numbers: 197 is Drill 05's planner profile; this drill uses 198 and 198b.
