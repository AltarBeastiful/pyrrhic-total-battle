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

- [x] Remove allocation in the hottest frames only, by 197's ranking. Typical targets: `countsKey` string keys
  (`src/worker/jobs.ts`, and `planCampaign`'s own in `src/engine/plan.ts`) replaced by a numeric key where the key
  set allows it, reused scratch arrays in `build` / `copyStacks` / `prefixFielded`, no object spreads in loops. Each
  change must keep iteration orders (a `Map`'s insertion order, a sort's comparator and stability). Gate script.
  Record 197's figures before and after. Commit: `Planner: less allocation in the hot loop (W18 P3.3)`.

- [x] Decide the port. From 197, write in Notes the JS share left in `evaluateVector` → `sizer` → `sizedShape` →
  `sizedCounts` and the number of kernel crossings per call. If the chain is still ≥ 15 % of the planner's CPU,
  write a port plan in `docs/plans/profile-drilldown.md` (new subsection under P3): which functions, the data they
  need on the kernel side, the op-for-op rule, and a parity test that runs the TS reference (`tests/kernel/declining.ts`
  gives tests a TS reference) against the kernel on the benchmark armies and both fixtures. Do not port in this
  task. Commit the doc: `W18: the planner port, planned`.

<!-- MAESTRO:HITL reason="Owner to read the planner port plan in docs/plans/profile-drilldown.md (P3) and say whether to port. Tick when decided; write the decision in Notes." artifact="docs/plans/profile-drilldown.md" -->

- [x] Human step done: Owner to read the planner port plan in docs/plans/profile-drilldown.md (P3) and say whether to port. Tick when decided; write the decision in Notes.
- [x] If the owner said yes in Notes, port the first function of the plan's list to the kernel, op for op, with its
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

### P3.3 less allocation (2026-10-11)

Kept, all exact (no iteration order touched; `src/engine/plan.ts`):

- `KernelMarch` holds the kernel's bill in four private fields instead of a `{ silver, recovery, rungs, mercs }`
  object per march: one object less on every ladder shape, and those marches live on in `derivedMemo`.
- `finaleFor` writes the spent stock of the hired types into one scratch record instead of copying the whole
  `stock` per call, and folds `leftoverHp` instead of `Math.max(...map)` over a `map().filter()`.
- `sizer` builds each prefix's id set once per depth instead of per memo miss.

Tried and reverted (measured worse): caps built key by key over the sized units only in `sizedShape` (the
object spread is V8's fast clone; reordering the spread after the filter alone raised `sizedShape`'s sampled
bytes 38 → 49 MiB), and the derived-memo key concatenated in a loop instead of `map().join()` (cons strings,
`evaluateVector` 21 → 24 MiB). `countsKey`, `build`, `copyStacks`, `prefixFielded` were left: < 1 % each in 197.

197 before (2 runs on HEAD 44605fd) → after (3 runs), per plan:

| Figure | Timing before | Timing after | Exactness before | Exactness after |
|---|---:|---:|---:|---:|
| GC pauses (observer) | 30, 81–88 ms | 29, 57–60 ms | 22, 40–41 ms | 19, 28–29 ms |
| GC share of profiled samples | 15.1–15.9 % | 11.7–11.8 % | 9.7–10.1 % | 7.8–8.2 % |
| CPU per plan (counted pass, process) | 1,223–1,321 ms | 1,100–1,143 ms | 626–682 ms | 601–630 ms |
| Profiled planner time | 495–540 ms | 470–497 ms | 488–500 ms | 473–507 ms |
| Allocated (sampled, one plan) | 354 MiB | 368–371 MiB | 256 MiB | 253–255 MiB |

The sampled byte count does not move beyond its noise (and attribution shifts with inlining); the GC time is
the reading that moved, about −30 % on both fixtures. Profiled time is within run-to-run noise.

Gate (2026-10-11): kernel:build, typecheck, lint, `pnpm test` (295 s, advisor golden included), plan-benchmark
alone (162 s), benchmark diff vs HEAD (empty), 184 (110 s, run alone after the tool's 10-minute limit cut the
gate script on its last step): all PASS. Logs `.maestro/playbooks/Working/w18/p33-*`, `197-before-*`, `197-final-*`.


### The port, decided (2026-10-11): plan written, waits on the owner

From 197 on 9c96e15 (after P3.3), as shares of `planCampaign`'s CPU (JS under each frame ÷ `planCampaign`
inclusive):

| JS under | Timing fixture | Exactness fixture |
|---|---:|---:|
| `evaluateVector` (the chain) | **38.1 %** | 13.6 % |
| `sizer` | 11.7 % | 2.8 % |
| `sizedShape` | 7.7 % | 1.7 % |
| `sizedCounts` | 2.4 % | 0.7 % |

Kernel crossings per `evaluateVector` call: **7.2** real calls (+31 `gridView` reads) on the timing fixture
(68,644 over 9,532 calls, 4,408 of them derived-memo replays); 7.9 on the exactness export without the 90,699
`marchBill` calls, most of them re-typing's. One `sizeStacks` crossing per sizer memo miss (12,045 vs 12,031).
Counts from a one-off instrumented run of 197 (counters reverted, nothing committed).

The chain is ≥ 15 % on the owner's account, so the port plan is written: `docs/plans/profile-drilldown.md`
§P3.4 — (1) the sizer shape as one kernel door, (2) the grid billed inside `lk.grid`, (3) `finish`/`finaleFor`
only if still ≥ 15 %; `evaluateVector`'s bookkeeping and re-typing not in it; op-for-op rule; parity test
`tests/kernel/sizer-shape-parity.test.ts` (declining kernel vs real, door and plan level, benchmark armies +
both fixtures). Nothing ported.

### The port, not started (2026-10-11)

The human gate was ticked, but no decision is written in these Notes nor in `docs/plans/profile-drilldown.md`
§P3.4 (still "not started, waits on the owner"). By the task's rule ("if the owner said no or nothing is written,
tick with a note and change nothing"), nothing was ported. To port later: write "yes" here and re-open the task.

### Owner decision (2026-10-11): **yes, port**

Owner, 2026-10-11: yes to the planner port of `docs/plans/profile-drilldown.md` §P3.4. Port the first function
of the plan's list (the sizer shape as one kernel door), op for op, parity test red first then green, then the
gate script. Task re-opened.

### The port, step 1 done (2026-10-11): the sizer shape, one kernel door

Ported: `sizedShape` + `sizedCounts`'s request building, op for op, as the kernel export `sizerShape`
(`kernel/assembly/index.ts`: caps over the hired counts, the unit filter, the method's option bits, the kernel's
own `sizeStacks`, troops and hired split in the sizer's order, `shelterUnder` and its filter), behind
`PlanKernel.sizerShape` (`src/engine/fast.ts`, `src/kernel/plan.ts`; base caps, `byId`'s entries and each prefix's
mask read once and kept per request / map / set). `sizedShape` asks it first, so every caller takes it; the TS
body is now `sizedShapeDeclined`, unchanged. One crossing replaces the `sizeStacks` one (timing plan: 12,031
`sizerShape`, 14 `sizeStacks` left; the total crossing count is unchanged at 363,814).

**Narrower than the plan's step 1**: the scorer's sizer branch after the memo (scan, `lastsMarches`, second
shelter, housing, march, bill) is not in the door, because it also runs on the memo's hits (22,732 calls against
12,031 misses) and needs a door that takes the memo's answer. It is the next candidate (`sizer` 6.2 %, `scorer`
21 % JS-under left on the timing fixture); not started.

Parity, `tests/kernel/sizer-shape-parity.test.ts` (one test, both paths): every benchmark army + both fixtures,
door level (up to 1,500 recorded calls a plan, the door must not decline, entries and `Object.is` counts against
the declining kernel's TS) and plan level (plan JSON with the door and with it declined, `ms` aside). Red: the
loader rebuilds the wasm itself, so the first run already had the door; a deliberately broken door (no shelter)
failed 32 of 42 (`Working/w18/p34-parity-red-broken.log`); green 42/42. `ported-declines.test.ts` counts the
new door too (no decline on any feature combination).

197 before (2 runs, 2a558ca) → after (3 runs), per plan:

| Figure | Timing before | Timing after | Exactness before | Exactness after |
|---|---:|---:|---:|---:|
| JS under `sizedShape` | 7.06 / 6.80 % | 2.56–2.77 % | 1.83 / 1.64 % | 0.53–0.60 % |
| JS under `sizer` | 10.30 / 10.37 % | 6.16–6.23 % | 2.71 / 2.51 % | 1.35–1.64 % |
| Allocated (sampled) | 366 / 368 MiB | 313–316 MiB | 296 / 254 MiB | 242 MiB |
| GC share of samples | 11.4 / 12.4 % | 11.5–12.3 % | 8.2 / 8.3 % | 7.4–7.8 % |
| Profiled planner time | 475 / 449 ms | 482–488 ms | 453 / 444 ms | 438–439 ms |

197's profiled time spreads ±6 % between identical runs, so the clock was read by an in-process A/B instead
(`Working/w18/p34-ab.test.ts.txt`, `p34-ab.txt`: door vs door declined, same process, 40 alternating rounds,
3 runs): timing plan wall median 447.6–470.5 → 410.5–432.7 ms (**−7.6 to −8.3 %**), process CPU 735–753 →
619–645 ms (−14 to −16 %); exactness 409.0–433.6 → 393.9–419.5 ms (−3.3 to −4.1 %). Over the plan's 3 % bar.

Gate (2026-10-11): kernel:build, typecheck, lint, plan-benchmark alone (171 s), benchmark diff vs HEAD (empty),
184 (122 s): PASS (`Working/w18/gate-20261011-112428.log`). Its `pnpm test` failed on two monster camps of the
new parity test hitting vitest's 5 s default under the parallel suite (not a parity failure); with a 300 s
timeout, typecheck, lint and `pnpm test` re-run: PASS, 1,817 tests, 312 s (advisor golden and every
`tests/golden/` pin included, none touched) (`Working/w18/p34-test.log`).
