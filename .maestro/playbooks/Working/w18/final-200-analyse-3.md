# Trace analysis: `trace-final-3.json.gz`

Chrome JSON trace; source maps: `dist/assets`. Pool-worker samplers (profile index): [2, 3, 4, 5, 6, 7, 8]; main thread: [0].

## 1. Phases and pool jobs

Wall from the `pyrrhic:*` slices; job CPU is the summed duration of the `job:*` slices that start inside the
phase (one job runs alone on its worker). Idle share = 1 − CPU / (wall × busy tracks).

| phase | job | count | CPU ms | min | avg | max | tracks | idle share |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **pyrrhic:generate** (684 ms wall) | all | 7 | 531 | | | | 1 | 22.4 % |
| | `job:plan` | 1 | 517 | 517 | 517 | 517 | 1 | 24.4 % |
| | `job:positions` | 5 | 10 | 0 | 2 | 7 | 1 | 98.5 % |
| | `job:boot` | 1 | 4 | 4 | 4 | 4 | 1 | 99.5 % |
| **pyrrhic:upgrades-default** (4 150 ms wall) | all | 41 | 23 534 | | | | 6 | 5.5 % |
| | `job:probe` | 35 | 23 504 | 2 | 672 | 935 | 6 | 5.6 % |
| | `job:boot` | 6 | 30 | 3 | 5 | 6 | 6 | 99.9 % |
| **pyrrhic:captains** (1 822 ms wall) | all | 11 | 6 697 | | | | 6 | 38.7 % |
| | `job:probe` | 10 | 6 694 | 525 | 669 | 847 | 6 | 38.8 % |
| | `job:captains` | 1 | 3 | 3 | 3 | 3 | 1 | 99.8 % |
| **pyrrhic:other** (2 513 ms wall) | all | 23 | 12 890 | | | | 6 | 14.5 % |
| | `job:probe` | 23 | 12 890 | 1 | 560 | 842 | 6 | 14.5 % |
| **total** | | 82 | **43 652** | | | | | |

Total wall of the phases: **9 169 ms**; pool CPU: **43.7 s**.

## 2. Pool-worker CPU by part and leaf kind

V8 samples on the 7 pool workers (threads whose stacks contain `timedJob`), idle removed; 
median sample gap 164 µs. Busy samples: 211 216. V8 does not sample at an even pace, so read
shares here and CPU time from table 1.

| part | leaf kind | samples | share |
|---|---|---:|---:|
| **planCampaign** | all | 198 270 | **93.9 %** |
| | JS | 160 379 | 75.9 % |
| | wasm (kernel/) | 36 474 | 17.3 % |
| | unnamed | 1 417 | 0.7 % |
| **other** | all | 10 876 | **5.1 %** |
| | garbage collector | 8 616 | 4.1 % |
| | JS | 2 086 | 1.0 % |
| | unnamed | 128 | 0.1 % |
| | wasm (kernel/) | 46 | 0.0 % |
| **Tight raise (positionTrades)** | all | 2 070 | **1.0 %** |
| | wasm (kernel/) | 1 070 | 0.5 % |
| | JS | 999 | 0.5 % |
| | unnamed | 1 | 0.0 % |

## 3. Call tree under `runProbe` (pool workers)

Every advisor probe, all pool workers together.
Inclusive samples, depth 7, frames ≥ 1 % of `runProbe`.

| frame | samples | share |
|---|---:|---:|
| `runProbe` | 198 811 | 100.0 % |
| &nbsp;&nbsp;└ `planCampaign` | 195 291 | 98.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRow` | 72 277 | 36.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 72 165 | 36.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 63 185 | 31.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 63 154 | 31.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 62 953 | 31.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 60 471 | 30.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 8 692 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 8 681 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 8 676 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 8 645 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `ownLadderCandidates` | 52 021 | 26.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 51 971 | 26.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 51 693 | 26.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 146 | 24.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 112 | 24.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 004 | 24.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 46 989 | 23.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 32 680 | 16.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 11 191 | 5.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 6 176 | 3.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 5 047 | 2.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 4 298 | 2.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `grid` | 3 549 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 7 936 | 4.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 7 380 | 3.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleOnKernel` | 2 767 | 1.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finale` | 2 378 | 1.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 2 085 | 1.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 7 073 | 3.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizedShape` | 5 367 | 2.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizerShape` | 5 201 | 2.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `js-to-wasm:idddid:i` | 3 261 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 8 762 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 4 499 | 2.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 3 954 | 2.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 2 302 | 1.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `record` | 2 201 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `walkDown` | 3 257 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sweep` | 3 137 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 2 996 | 1.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 2 359 | 1.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `buildAllIn` | 2 174 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `strongest` | 1 993 | 1.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `figuresOf` | 2 130 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `undominatedRows` | 2 062 | 1.0 % |

## 4. Call tree on the main thread

The renderer's main thread (`CrRendererMain`), all of it from its `(root)` frame, idle removed.
Inclusive samples, depth 7, frames ≥ 1 % of `(root)`.

| frame | samples | share |
|---|---:|---:|
| `(root)` | 7 724 | 100.0 % |
| &nbsp;&nbsp;└ `(program)` | 3 859 | 50.0 % |
| &nbsp;&nbsp;└ `scheduleMicrotask` | 1 846 | 23.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `processRootScheduleInMicrotask` | 1 846 | 23.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushSyncWorkAcrossRoots_impl` | 1 841 | 23.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performSyncWorkOnRoot` | 1 840 | 23.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 1 838 | 23.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 1 373 | 17.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 1 368 | 17.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 465 | 6.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 463 | 6.0 % |
| &nbsp;&nbsp;└ `performWorkUntilDeadline` | 1 465 | 19.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRootViaSchedulerTask` | 1 435 | 18.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 1 427 | 18.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootConcurrent` | 796 | 10.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopConcurrentByScheduler` | 793 | 10.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 641 | 8.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 495 | 6.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeUnitOfWork` | 126 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeWork` | 108 | 1.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 508 | 6.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 508 | 6.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 498 | 6.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 451 | 5.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 121 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 115 | 1.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `commitRoot` | 113 | 1.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushMutationEffects` | 91 | 1.2 % |
| &nbsp;&nbsp;└ `(garbage collector)` | 149 | 1.9 % |
| &nbsp;&nbsp;└ `(unnamed)` | 114 | 1.5 % |

## 5. The main thread's own time per phase

Exclusive time of the renderer main thread's `devtools.timeline` / `v8.execute` events, clipped to each
phase: scripting (JS tasks, microtasks, posted messages), GC, style (`UpdateLayoutTree`), layout, paint
(`PrePaint`, `Paint`, `Layerize`, `Commit`), other (`HitTest` and the rest). Busy is their union;
idle = wall − busy. ms.

| phase | wall | busy | busy share | scripting | GC | style | layout | paint | other | idle |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 684 | 148 | 21.6 % | 90 | 0 | 7 | 42 | 10 | 0 | 536 |
| pyrrhic:upgrades-default | 4 150 | 458 | 11.0 % | 217 | 38 | 11 | 15 | 147 | 30 | 3 692 |
| pyrrhic:captains | 1 822 | 221 | 12.1 % | 132 | 3 | 4 | 7 | 66 | 8 | 1 601 |
| pyrrhic:other | 2 513 | 427 | 17.0 % | 243 | 9 | 6 | 17 | 136 | 16 | 2 087 |
| **the run** | 9 170 | 1 254 | 13.7 % | 683 | 50 | 28 | 81 | 358 | 54 | 7 916 |

## 6. The main thread's JS per phase, from its samples

V8 samples of the main thread, idle dropped, each weighted by the gap to the next sample. React render:
the stack holds `renderWithHooks`, and the component is the frame it called; React commit: `commitRoot`
and the effects; `(program)` is the browser's own work outside JS. ms.

| phase | sampled | React render | React commit | other JS | (program) | (garbage collector) |
|---|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 154 | 60 | 54 | 18 | 21 | 0 |
| pyrrhic:upgrades-default | 543 | 114 | 17 | 51 | 314 | 47 |
| pyrrhic:captains | 239 | 75 | 7 | 40 | 113 | 4 |
| pyrrhic:other | 472 | 145 | 17 | 56 | 244 | 9 |
| **the run** | 1 408 | 394 | 96 | 167 | 692 | 59 |

React render by component (the 15 largest over the run), ms:

| component | pyrrhic:generate | pyrrhic:upgrades-default | pyrrhic:captains | pyrrhic:other | **the run** |
|---|---:|---:|---:|---:|---:|
| `_Box` | 15.8 | 44.2 | 33.4 | 66.8 | 160.2 |
| `factory` | 14.9 | 21.8 | 12.7 | 24.2 | 73.5 |
| `polymorphicFactory` | 6.4 | 18.0 | 11.5 | 23.1 | 59.0 |
| `(self)` | 5.1 | 6.1 | 3.6 | 6.7 | 21.5 |
| `forwardRef` | 1.1 | 4.9 | 1.8 | 6.6 | 14.4 |
| `AdvisorFold` | 0.6 | 6.9 | 1.8 | 2.5 | 11.9 |
| `PassSection` | 0.1 | 4.0 | 2.3 | 2.8 | 9.2 |
| `StopList` | 0.0 | 0.0 | 1.2 | 2.0 | 3.2 |
| `Disclosure` | 0.0 | 1.4 | 0.6 | 1.1 | 3.1 |
| `MarchRecap` | 1.3 | 0.2 | 0.3 | 0.6 | 2.3 |
| `Figure` | 0.2 | 0.3 | 0.5 | 1.3 | 2.3 |
| `genericFactory` | 1.9 | 0.2 | 0.2 | 0.0 | 2.3 |
| `MarchSection` | 0.8 | 0.2 | 0.4 | 0.7 | 2.0 |
| `Popover` | 1.6 | 0.0 | 0.2 | 0.0 | 1.8 |
| `CaptainSection` | 0.0 | 0.2 | 0.2 | 1.3 | 1.6 |

