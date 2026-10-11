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

- [x] Count the boundary. Write `tools/theorycraft/198-the-boundary.test.ts` (`THEORY=1`, skipped otherwise, like 196)
  that plans the timing fixture's setup and the exactness fixture's, in-process on one inline lane with no clock, and
  counts: calls per kernel door per plan, `new WebAssembly.Instance` per plan (wrap the constructor in the test, do not
  change production code), bytes copied in and out of wasm memory per plan, and how many `march`/`bill` calls share a
  bound request versus a fresh one. Write `tools/theorycraft/out/198-the-boundary.md`. Commit: `Experiment 198: the
  kernel boundary on the owner's account (W18 P3.0)`.

- [x] Time the glue. In the same test (or `tools/theorycraft/198b-the-glue.test.ts` if 198 grows), time each door with
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

### Experiment 198, the boundary counted (2026-10-11)

`tools/theorycraft/198-the-boundary.test.ts` → `tools/theorycraft/out/198-the-boundary.md`. One plan per fixture on a
fresh plan kernel (cold), then the same input again on that kernel (warm); answers equal the release kernel's. The
door totals equal 197's exactly (363,814 crossings on the timing fixture), so the wrapping counts what 197 counted.

| Per plan | Timing fixture | Exactness fixture |
|---|---:|---:|
| `new WebAssembly.Instance` (cold / warm) | **1 / 0** | **1 / 0** |
| … the sizer's own (`sizePool`) | 0 (`sizePool` is never called: the sizer runs whole in `sizeStacks`) | 0 |
| `bindTable` calls / distinct requests / distinct packed tables | 76 / 1 / 1 | 203 / 1 / 1 |
| Raw JS → wasm calls (`ladder.gridView` enters no wasm) | 68,591 | 120,636 |
| … `march` / `bill` / `marchBill`(`battle`) / `sizeStacks` | 22,900 / 20,310 / 5,560 / 12,045 | 11,489 / 7,880 / 90,699 / 4,847 |
| … `ladder.grid` / `finale` / `shape` | 3,650 / 3,200 / 898 | 1,323 / 2,094 / 2,276 |
| Bytes into wasm memory (`set` measured + element loops counted) | 13.5 MiB (1.7 + 11.8) | 11.3 MiB (0.8 + 10.5) |
| Bytes read back out | 4.3 MiB | 5.5 MiB |
| `packRequest` tables built by `bindTable` (75 of 76 dropped, request already bound) | 223 KiB | 374 KiB |
| Result objects the doors allocate | 270,282 | 165,909 |
| `march`/`bill` on a shared bound request / a fresh one | 100 % / 0 % | 100 % / 0 % |
| Raise `position` calls | 0 | 0 |

Reading: the instance hypothesis carried in is **refuted for the planner**: one plan binds one request, once, into one
instance, and every `march`/`bill` lands on it. The cost per plan is the packed table rebuilt and dropped on each of
the 75 repeat `bindTable` calls (`packRequest` runs before the `byRequest` lookup), a few KiB per crossing, and one
result object per `march`/`bill`/`marchBill` call. Each probe plan builds its own request, so a worker pays one
instance per probe, not per candidate. Whether the 68 k crossings cost time is 198b's question.

### Experiment 198b, the glue timed (2026-10-11)

`tools/theorycraft/198b-the-glue.test.ts` → `tools/theorycraft/out/198b-the-glue.md`, summary appended to
`198-the-boundary.md`. A fresh plan kernel, its raw exports (wrapped `WebAssembly.Instance`) and its doors (a `Proxy`)
timed with `performance.now()`; one cold plan untimed, then 7 warm timed plans, each interleaved with an untimed plan
on the release kernel (the denominator). Glue = a door's wrapper time, exclusive of doors it opens, minus its wasm
calls; the timers' own cost (54 ns inside an empty door, ~200 ns per timed raw call, ~41 ns inside the raw timer) is
calibrated from the doors' own records and taken off. The upper bound takes nothing off. Answers equal the release
kernel's on every timed plan.

| Per plan, share of the untimed planner wall | Timing fixture (397.9 ms) | Exactness fixture (375.4 ms) |
|---|---:|---:|
| Inside wasm, all doors | 34.6 % (197's profiler: 31.5 %) | 21.9 % |
| **Glue, all doors** | **8.1 %** (≤ 16.4 %) | **11.3 %** (≤ 21.0 %) |
| `sizeStacks` glue | **2.6 %** (≤ 3.3 %), 865 ns a call | 0.8 % |
| `march` glue | 1.7 % (≤ 2.9 %), 292 ns a call | 0.6 % |
| `bill` glue | 1.1 % (≤ 2.2 %), 218 ns a call | 0.3 % |
| `marchBill` glue | 1.0 % (≤ 1.3 %), 723 ns a call | **7.9 %** (≤ 13.0 %), 90,699 calls at 325 ns |
| `bindTable` glue (the dropped `packRequest`) | 0.6 %, 30 µs a call | 1.2 %, 22 µs a call |
| `ladder.finale` / `ladder.grid` / `ladder.shape` | 0.5 / 0.4 / 0.1 % | 0.4 / 0.2 / 0.1 % |
| `ladder.gridView` (pure view read) | ≈ 0 (≤ 4.0 %) | ≈ 0 (≤ 1.5 %) |

Reading: on the timing fixture no door's glue reaches 3 % of the planner's wall, even uncorrected; the boundary as a
whole is 8 % (≤ 16 %), spread over four doors. On the exactness fixture one door stands out: `marchBill`, 90 k calls
(the counts→row loop over `ids`, the record read, the result object) at 7.9 % corrected, 13.0 % uncorrected. That
fixture is not the one the next tasks rank on, but the decision task should name it. Timed plans run ~1.5× the
untimed wall (instrumentation), so per-door figures carry that noise; the calibrated column is the estimate,
the upper bound the ceiling.
