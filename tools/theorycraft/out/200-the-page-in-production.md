# 200 — the page in production

W18 Drill 06 (`docs/plans/profile-drilldown.md` P0.2; the drill calls it "198", a number Drill 04b had already
taken). Run 2026-10-11 on HEAD 065d364: `VITE_PROFILING=1 pnpm build`, `pnpm preview` (port 4174), Chromium from
Playwright (`e2e/profile-trace.spec.ts`, `PYRRHIC_TRACE=1`), 16-thread desktop. The exactness fixture
(`tests/fixtures/pyrrhic-my-account-2026-09-17 (2).json`) imported as the active profile, then "Profile everything"
pressed under a CDP trace (`devtools.timeline, blink.user_timing, v8.execute,
disabled-by-default-v8.cpu_profiler`). Three runs; read with `tools/perf-trace/analyse.py` (its new Chrome JSON
path, frame names restored from the build's source maps). Traces: `.maestro/playbooks/Working/w18/trace-prod{,-2,-3}.json.gz`.

## The answer: main-thread busy share per phase, three runs

Busy = union of the main thread's trace events inside the phase (table 5 below). The bar of the next task is 20 %.

| phase | run 1 | run 2 | run 3 | over 20 %? |
|---|---:|---:|---:|---|
| generate | 23.7 % | 22.5 % | 22.8 % | yes (the plan's own render, not the advisor) |
| upgrades-default | 10.7 % | 9.9 % | 9.4 % | no |
| captains | 29.4 % | 28.1 % | 28.6 % | **yes** |
| other | 40.4 % | 40.5 % | 38.6 % | **yes** |
| the run | 23.8 % | 22.9 % | 22.6 % | |
| (wall of the run, ms) | 7 900 | 9 376 | 10 482 | |

The wall moves with the machine's load (pool CPU 37.4 / 44.5 / 50.3 s for the same work); the shares do not.

Reading:

- The page's main-thread cost in production is **scripting**, almost all of it React: over the run React render
  is 899 ms and commit 168 ms of 1 990 ms sampled (run 1); style 26 ms, layout 77 ms, paint 283 ms. Style and
  layout are small, so P4.3 (fewer Mantine `Box` wrappers for style/layout's sake) is not called for.
- Render time is Mantine's `Box` machinery (`_Box`, `factory`, `polymorphicFactory`: 725 of 899 ms), the
  wrappers under the advisor's rows; of our components `AdvisorRowLine`, `Figure`, `MarchCost`, `StopList` lead.
  Captains and other render 2.7× and 5.5× what upgrades-default renders (248 and 507 against 92 ms) in fewer
  probes (10 and 23 against 35); likely because each settled probe re-renders a card that by then holds the
  earlier passes' rows too (not measured per render here).
- The pool is untouched by the page: 93.5 % of pool CPU is `planCampaign` (re-typing 35 % of `runProbe`), the
  Tight raise 1.0 % on this fixture.

## Run 1, full tables

### 1. Phases and pool jobs

Wall from the `pyrrhic:*` slices; job CPU is the summed duration of the `job:*` slices that start inside the
phase (one job runs alone on its worker). Idle share = 1 − CPU / (wall × busy tracks).

| phase | job | count | CPU ms | min | avg | max | tracks | idle share |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **pyrrhic:generate** (580 ms wall) | all | 7 | 443 | | | | 1 | 23.7 % |
| | `job:plan` | 1 | 430 | 430 | 430 | 430 | 1 | 25.8 % |
| | `job:positions` | 5 | 9 | 0 | 2 | 6 | 1 | 98.4 % |
| | `job:boot` | 1 | 3 | 3 | 3 | 3 | 1 | 99.5 % |
| **pyrrhic:upgrades-default** (3 517 ms wall) | all | 41 | 19 931 | | | | 6 | 5.5 % |
| | `job:probe` | 35 | 19 907 | 3 | 569 | 762 | 6 | 5.7 % |
| | `job:boot` | 6 | 24 | 3 | 4 | 7 | 6 | 99.9 % |
| **pyrrhic:captains** (1 498 ms wall) | all | 11 | 5 400 | | | | 6 | 39.9 % |
| | `job:probe` | 10 | 5 397 | 403 | 540 | 698 | 6 | 40.0 % |
| | `job:captains` | 1 | 3 | 3 | 3 | 3 | 1 | 99.8 % |
| **pyrrhic:other** (2 304 ms wall) | all | 23 | 11 637 | | | | 6 | 15.8 % |
| | `job:probe` | 23 | 11 637 | 1 | 506 | 823 | 6 | 15.8 % |
| **total** | | 82 | **37 411** | | | | | |

Total wall of the phases: **7 900 ms**; pool CPU: **37.4 s**.

### 2. Pool-worker CPU by part and leaf kind

V8 samples on the 7 pool workers (threads whose stacks contain `timedJob`), idle removed; 
median sample gap 163 µs. Busy samples: 191 771. V8 does not sample at an even pace, so read
shares here and CPU time from table 1.

| part | leaf kind | samples | share |
|---|---|---:|---:|
| **planCampaign** | all | 179 362 | **93.5 %** |
| | JS | 143 309 | 74.7 % |
| | wasm (kernel/) | 34 704 | 18.1 % |
| | unnamed | 1 349 | 0.7 % |
| **other** | all | 10 517 | **5.5 %** |
| | garbage collector | 8 447 | 4.4 % |
| | JS | 1 932 | 1.0 % |
| | unnamed | 108 | 0.1 % |
| | wasm (kernel/) | 30 | 0.0 % |
| **Tight raise (positionTrades)** | all | 1 892 | **1.0 %** |
| | wasm (kernel/) | 959 | 0.5 % |
| | JS | 930 | 0.5 % |
| | unnamed | 3 | 0.0 % |

### 3. Call tree under `runProbe` (pool workers)

Every advisor probe, all pool workers together.
Inclusive samples, depth 7, frames ≥ 1 % of `runProbe`.

| frame | samples | share |
|---|---:|---:|
| `runProbe` | 180 119 | 100.0 % |
| &nbsp;&nbsp;└ `planCampaign` | 176 868 | 98.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRow` | 63 653 | 35.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 63 563 | 35.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 55 520 | 30.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 55 492 | 30.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 55 305 | 30.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 53 235 | 29.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 7 819 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 7 805 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 7 801 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 7 771 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `ownLadderCandidates` | 46 978 | 26.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 46 950 | 26.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 46 710 | 25.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 44 360 | 24.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 44 330 | 24.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 44 232 | 24.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 43 828 | 24.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 30 848 | 17.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 10 551 | 5.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 5 870 | 3.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 4 895 | 2.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 4 153 | 2.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `grid` | 3 328 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 7 516 | 4.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 6 999 | 3.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleOnKernel` | 2 731 | 1.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finale` | 2 329 | 1.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 1 896 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 6 604 | 3.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizedShape` | 5 074 | 2.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizerShape` | 4 916 | 2.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `js-to-wasm:idddid:i` | 3 141 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 7 767 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 4 050 | 2.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 3 544 | 2.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 2 026 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `record` | 2 010 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `walkDown` | 3 293 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sweep` | 3 185 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 3 051 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 2 411 | 1.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `undominatedRows` | 1 946 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `buildAllIn` | 1 935 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `figuresOf` | 1 879 | 1.0 % |

### 4. Call tree on the main thread

The renderer's main thread (`CrRendererMain`), all of it from its `(root)` frame, idle removed.
Inclusive samples, depth 7, frames ≥ 1 % of `(root)`.

| frame | samples | share |
|---|---:|---:|
| `(root)` | 11 452 | 100.0 % |
| &nbsp;&nbsp;└ `performWorkUntilDeadline` | 3 902 | 34.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRootViaSchedulerTask` | 3 859 | 33.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 3 851 | 33.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootConcurrent` | 2 935 | 25.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopConcurrentByScheduler` | 2 932 | 25.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performUnitOfWork` | 1 916 | 16.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 1 837 | 16.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 874 | 7.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 794 | 6.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 514 | 4.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 512 | 4.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 490 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 441 | 3.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 387 | 3.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 385 | 3.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `commitRoot` | 383 | 3.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushMutationEffects` | 368 | 3.2 % |
| &nbsp;&nbsp;└ `(program)` | 3 784 | 33.0 % |
| &nbsp;&nbsp;└ `scheduleMicrotask` | 3 130 | 27.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `processRootScheduleInMicrotask` | 3 129 | 27.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushSyncWorkAcrossRoots_impl` | 3 124 | 27.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performSyncWorkOnRoot` | 3 121 | 27.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 3 120 | 27.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 2 485 | 21.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 2 479 | 21.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 632 | 5.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 632 | 5.5 % |
| &nbsp;&nbsp;└ `(garbage collector)` | 265 | 2.3 % |
| &nbsp;&nbsp;└ `(unnamed)` | 125 | 1.1 % |

### 5. The main thread's own time per phase

Exclusive time of the renderer main thread's `devtools.timeline` / `v8.execute` events, clipped to each
phase: scripting (JS tasks, microtasks, posted messages), GC, style (`UpdateLayoutTree`), layout, paint
(`PrePaint`, `Paint`, `Layerize`, `Commit`), other (`HitTest` and the rest). Busy is their union;
idle = wall − busy. ms.

| phase | wall | busy | busy share | scripting | GC | style | layout | paint | other | idle |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 580 | 137 | 23.7 % | 83 | 0 | 8 | 34 | 12 | 0 | 443 |
| pyrrhic:upgrades-default | 3 517 | 375 | 10.7 % | 181 | 21 | 10 | 16 | 126 | 21 | 3 142 |
| pyrrhic:captains | 1 498 | 441 | 29.4 % | 360 | 17 | 4 | 6 | 48 | 6 | 1 057 |
| pyrrhic:other | 2 304 | 930 | 40.4 % | 761 | 36 | 5 | 20 | 98 | 11 | 1 374 |
| **the run** | 7 900 | 1 884 | 23.8 % | 1 385 | 74 | 26 | 77 | 283 | 39 | 6 017 |

### 6. The main thread's JS per phase, from its samples

V8 samples of the main thread, idle dropped, each weighted by the gap to the next sample. React render:
the stack holds `renderWithHooks`, and the component is the frame it called; React commit: `commitRoot`
and the effects; `(program)` is the browser's own work outside JS. ms.

| phase | sampled | React render | React commit | other JS | (program) | (garbage collector) |
|---|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 144 | 52 | 48 | 20 | 24 | 0 |
| pyrrhic:upgrades-default | 428 | 92 | 15 | 41 | 259 | 21 |
| pyrrhic:captains | 456 | 248 | 31 | 66 | 94 | 17 |
| pyrrhic:other | 962 | 507 | 74 | 123 | 218 | 39 |
| **the run** | 1 990 | 899 | 168 | 250 | 595 | 78 |

React render by component (the 15 largest over the run), ms:

| component | pyrrhic:generate | pyrrhic:upgrades-default | pyrrhic:captains | pyrrhic:other | **the run** |
|---|---:|---:|---:|---:|---:|
| `_Box` | 11.7 | 35.4 | 111.2 | 258.8 | 417.2 |
| `factory` | 13.0 | 19.8 | 44.7 | 87.6 | 165.2 |
| `polymorphicFactory` | 7.0 | 15.4 | 43.2 | 76.9 | 142.6 |
| `(self)` | 5.2 | 6.1 | 12.0 | 22.8 | 46.1 |
| `AdvisorRowLine` | 0.0 | 0.0 | 6.5 | 14.7 | 21.2 |
| `Figure` | 0.2 | 0.2 | 6.3 | 11.6 | 18.3 |
| `MarchCost` | 0.0 | 0.6 | 5.0 | 10.6 | 16.3 |
| `forwardRef` | 0.7 | 3.2 | 2.8 | 4.3 | 11.0 |
| `StopList` | 0.0 | 0.2 | 5.8 | 2.8 | 8.8 |
| `AdvisorFold` | 0.7 | 3.6 | 1.7 | 1.8 | 7.8 |
| `PassSection` | 0.2 | 0.9 | 2.7 | 3.1 | 6.9 |
| `Glyph` | 0.0 | 0.1 | 1.7 | 2.6 | 4.4 |
| `CaptainSection` | 0.0 | 0.3 | 0.2 | 2.2 | 2.7 |
| `MarchRecap` | 1.1 | 0.2 | 0.4 | 0.0 | 1.7 |
| `MarchSection` | 0.6 | 0.3 | 0.2 | 0.6 | 1.7 |

