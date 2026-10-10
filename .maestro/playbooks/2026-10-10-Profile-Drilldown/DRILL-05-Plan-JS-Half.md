# Drill 05: `planCampaign`'s JavaScript half

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md` §0.2, and W16's `docs/plans/refactor-speed.md` §3 (A1, C1, C2: how the
planner was profiled and memoised before). Rules: top of `DRILL-01-Measure-And-Census.md` in this folder. Gate:
`.maestro/playbooks/Working/w18/gate.sh`.

In the trace, `planCampaign` was 48 % of the pool's CPU and 60 % of that was JavaScript: `evaluateVector` → `scorer`
→ `sizer` → `sizedShape` → `sizedCounts` → `sizeStacks`, then `gridOnKernel`, `finish`/`finaleFor`, `retypeRow`, and
unnamed frames (allocation, `Map`, sort) under `build`, `copyStacks`, `countsKey`, `prefixFielded`. A port to the
kernel is exact only when done op for op, as the kernel port was (`project-kernel-port`: bit-identical on 24 cases).

## Tasks

- [x] Profile `planCampaign` alone on the timing fixture. Write `tools/theorycraft/197-the-planner-on-the-owner.test.ts`
  that plans the timing fixture's setup (and the exactness fixture's) with the probes' settings, under
  `node --cpu-prof` (or vitest's `--inspect` profile), and writes a self/inclusive-time table of the JS functions
  (wasm frames grouped) to `tools/theorycraft/out/197-the-planner-on-the-owner.md`, with the GC share, the number of
  kernel crossings per plan and the allocation rate (`--heap-prof` or `performance.measureUserAgentSpecificMemory`
  where available). Rank the candidates below by measured self time. Commit: `Experiment 197: the planner on the owner's account`.

- [ ] Remove allocation in the hottest frames only, by 197's ranking. Typical targets: `countsKey` string keys
  (`src/worker/jobs.ts`, and `planCampaign`'s own in `src/engine/plan.ts`) replaced by a numeric key where the key
  set allows it, reused scratch arrays in `build` / `copyStacks` / `prefixFielded`, no object spreads in loops. Each
  change must keep iteration orders (a `Map`'s insertion order, a sort's comparator and stability). Gate script.
  Record 197's figures before and after. Commit: `Planner: less allocation in the hot loop (W18 P3.3)`.

- [ ] Decide the port. From 197, write in Notes the JS share left in `evaluateVector` → `sizer` → `sizedShape` →
  `sizedCounts` and the number of kernel crossings per call. If the chain is still ≥ 15 % of the planner's CPU,
  write a port plan in `docs/plans/profile-drilldown.md` (new subsection under P3): which functions, the data they
  need on the kernel side, the op-for-op rule, and a parity test that runs the TS reference (`tests/kernel/declining.ts`
  gives tests a TS reference) against the kernel on the benchmark armies and both fixtures. Do not port in this
  task. Commit the doc: `W18: the planner port, planned`.

<!-- MAESTRO:HITL reason="Owner to read the planner port plan in docs/plans/profile-drilldown.md (P3) and say whether to port. Tick when decided; write the decision in Notes." artifact="docs/plans/profile-drilldown.md" -->

- [ ] If the owner said yes in Notes, port the first function of the plan's list to the kernel, op for op, with its
  parity test red first then green, then the gate script. If the owner said no or nothing is written, tick with a
  note and change nothing.

## Notes

### Experiment 197 (2026-10-11), `tools/theorycraft/out/197-the-planner-on-the-owner.md`

`THEORY=1 pnpm vitest run tools/theorycraft/197-the-planner-on-the-owner.test.ts` (~10 s). In-process, no
`--cpu-prof` flag needed: `node:inspector/promises` runs the sampling profiler (100 µs, 5 plans) and the sampling
heap profiler (collected objects kept, one plan) around `planCampaign`; a separate counted plan wraps every
`PlanKernel` / `LadderKernel` door and observes GC. Every pass is checked to give the same alternatives. Shares
exclude the inspector's own frames (its `Profiler.stop` serialisation was 24 % of the raw samples).

| Per plan | Timing fixture (2026-10-07) | Exactness fixture (2026-09-17) |
|---|---:|---:|
| Profiled planner time | 489 ms | 515 ms |
| JS self / wasm self / GC self | 55.0 / 29.8 / 15.3 % | 72.2 / 18.4 / 9.4 % |
| GC pauses (observer) | 30, 77 ms | 23, 61 ms |
| Kernel crossings (real wasm calls, `gridView` excluded) | 68,644 (+295,170 `gridView` JS reads) | 120,820 (+106,683 `gridView`) |
| Busiest door | `march` 22,900, `bill` 20,310, `sizeStacks` 12,045 | `marchBill` 90,699 |
| Allocated (sampled) | 367 MiB (751 MiB/s) | 255 MiB (495 MiB/s) |

Candidates ranked by self time (timing fixture): evaluateVector 7.0 % › scorer 4.2 › sizedShape 3.9 › sizer 2.9 ›
finaleFor 2.2 › sizeStacks (kernel wrapper) 1.9 › gridOnKernel · finish · countsKey · build · sizedCounts ·
prefixFielded · copyStacks · retypeRow (all < 1 %); `sizeStacks` of `engine/stacker.ts` never runs. On the
exactness fixture the re-typing is the other half: `retypeRow` 35.5 % inclusive, `build` (retype.ts) 2nd by self,
`walk` (retype.ts) 22 % of the bytes, `marchBill` 90 k calls.

Top allocators (timing fixture): `shapeOf` 12.9 %, `scorer` 12.7 %, `sizedShape` 10.9 %, `finaleFor` 8.1 %,
`sizer` 6.3 %, `evaluateVector` 6.3 %, iterator `next` 5.6 %, `record` 4.2 %. `countsKey` is ~1 % of bytes and
< 1 % of time: a numeric key would buy little. The JS chain evaluateVector → sizer → sizedShape → sizedCounts:
evaluateVector 58 % inclusive / 31 % JS-under-it; sizer 26 % / 9.3 %; sizedShape 23 % / 6.2 %; sizedCounts 19 % / 0.7 %.

