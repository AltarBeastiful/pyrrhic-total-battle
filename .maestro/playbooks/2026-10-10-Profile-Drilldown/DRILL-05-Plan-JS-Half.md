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

- [ ] Profile `planCampaign` alone on the timing fixture. Write `tools/theorycraft/197-the-planner-on-the-owner.test.ts`
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
