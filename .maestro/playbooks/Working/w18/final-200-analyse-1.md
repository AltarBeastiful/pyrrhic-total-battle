# Trace analysis: `trace-final-1.json.gz`

Chrome JSON trace; source maps: `dist/assets`. Pool-worker samplers (profile index): [2, 3, 4, 5, 6, 7, 8]; main thread: [0].

## 1. Phases and pool jobs

Wall from the `pyrrhic:*` slices; job CPU is the summed duration of the `job:*` slices that start inside the
phase (one job runs alone on its worker). Idle share = 1 − CPU / (wall × busy tracks).

| phase | job | count | CPU ms | min | avg | max | tracks | idle share |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **pyrrhic:generate** (703 ms wall) | all | 7 | 545 | | | | 1 | 22.4 % |
| | `job:plan` | 1 | 532 | 532 | 532 | 532 | 1 | 24.3 % |
| | `job:positions` | 5 | 10 | 0 | 2 | 7 | 1 | 98.5 % |
| | `job:boot` | 1 | 3 | 3 | 3 | 3 | 1 | 99.6 % |
| **pyrrhic:upgrades-default** (4 245 ms wall) | all | 41 | 24 064 | | | | 6 | 5.5 % |
| | `job:probe` | 35 | 24 016 | 2 | 686 | 960 | 6 | 5.7 % |
| | `job:boot` | 6 | 48 | 7 | 8 | 9 | 6 | 99.8 % |
| **pyrrhic:captains** (1 680 ms wall) | all | 11 | 6 194 | | | | 6 | 38.5 % |
| | `job:probe` | 10 | 6 189 | 456 | 619 | 834 | 6 | 38.6 % |
| | `job:captains` | 1 | 5 | 5 | 5 | 5 | 1 | 99.7 % |
| **pyrrhic:other** (2 452 ms wall) | all | 23 | 12 648 | | | | 6 | 14.0 % |
| | `job:probe` | 23 | 12 648 | 1 | 550 | 854 | 6 | 14.0 % |
| **total** | | 82 | **43 452** | | | | | |

Total wall of the phases: **9 080 ms**; pool CPU: **43.5 s**.

## 2. Pool-worker CPU by part and leaf kind

V8 samples on the 7 pool workers (threads whose stacks contain `timedJob`), idle removed; 
median sample gap 165 µs. Busy samples: 209 582. V8 does not sample at an even pace, so read
shares here and CPU time from table 1.

| part | leaf kind | samples | share |
|---|---|---:|---:|
| **planCampaign** | all | 196 901 | **93.9 %** |
| | JS | 158 916 | 75.8 % |
| | wasm (kernel/) | 36 700 | 17.5 % |
| | unnamed | 1 285 | 0.6 % |
| **other** | all | 10 792 | **5.1 %** |
| | garbage collector | 8 659 | 4.1 % |
| | JS | 1 967 | 0.9 % |
| | unnamed | 118 | 0.1 % |
| | wasm (kernel/) | 48 | 0.0 % |
| **Tight raise (positionTrades)** | all | 1 889 | **0.9 %** |
| | wasm (kernel/) | 1 025 | 0.5 % |
| | JS | 858 | 0.4 % |
| | unnamed | 6 | 0.0 % |

## 3. Call tree under `runProbe` (pool workers)

Every advisor probe, all pool workers together.
Inclusive samples, depth 7, frames ≥ 1 % of `runProbe`.

| frame | samples | share |
|---|---:|---:|
| `runProbe` | 197 099 | 100.0 % |
| &nbsp;&nbsp;└ `planCampaign` | 193 808 | 98.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRow` | 71 389 | 36.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 71 298 | 36.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 62 202 | 31.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 62 169 | 31.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 61 973 | 31.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 59 527 | 30.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 8 827 | 4.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 8 815 | 4.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 8 813 | 4.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 8 795 | 4.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `ownLadderCandidates` | 52 219 | 26.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 52 163 | 26.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 51 878 | 26.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 327 | 25.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 305 | 25.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 193 | 25.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 46 570 | 23.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 32 784 | 16.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 11 207 | 5.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 6 284 | 3.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 5 145 | 2.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 4 397 | 2.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `grid` | 3 517 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 7 792 | 4.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 7 197 | 3.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleOnKernel` | 2 818 | 1.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finale` | 2 364 | 1.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 7 245 | 3.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizedShape` | 5 560 | 2.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizerShape` | 5 377 | 2.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `js-to-wasm:idddid:i` | 3 411 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 8 407 | 4.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 4 308 | 2.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 3 778 | 1.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 2 222 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `record` | 2 051 | 1.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `walkDown` | 3 574 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sweep` | 3 456 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 3 280 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 2 574 | 1.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `buildAllIn` | 2 157 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `strongest` | 1 981 | 1.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `figuresOf` | 2 105 | 1.1 % |

## 4. Call tree on the main thread

The renderer's main thread (`CrRendererMain`), all of it from its `(root)` frame, idle removed.
Inclusive samples, depth 7, frames ≥ 1 % of `(root)`.

| frame | samples | share |
|---|---:|---:|
| `(root)` | 7 349 | 100.0 % |
| &nbsp;&nbsp;└ `(program)` | 3 808 | 51.8 % |
| &nbsp;&nbsp;└ `scheduleMicrotask` | 1 685 | 22.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `processRootScheduleInMicrotask` | 1 683 | 22.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushSyncWorkAcrossRoots_impl` | 1 675 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performSyncWorkOnRoot` | 1 675 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 1 675 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 1 234 | 16.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 1 232 | 16.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 440 | 6.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 440 | 6.0 % |
| &nbsp;&nbsp;└ `performWorkUntilDeadline` | 1 310 | 17.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRootViaSchedulerTask` | 1 281 | 17.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 1 277 | 17.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootConcurrent` | 689 | 9.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopConcurrentByScheduler` | 688 | 9.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 563 | 7.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 446 | 6.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeUnitOfWork` | 105 | 1.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeWork` | 93 | 1.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 464 | 6.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 461 | 6.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 450 | 6.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 409 | 5.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 121 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 120 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `commitRoot` | 118 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushMutationEffects` | 100 | 1.4 % |
| &nbsp;&nbsp;└ `(unnamed)` | 142 | 1.9 % |
| &nbsp;&nbsp;└ `(garbage collector)` | 107 | 1.5 % |

## 5. The main thread's own time per phase

Exclusive time of the renderer main thread's `devtools.timeline` / `v8.execute` events, clipped to each
phase: scripting (JS tasks, microtasks, posted messages), GC, style (`UpdateLayoutTree`), layout, paint
(`PrePaint`, `Paint`, `Layerize`, `Commit`), other (`HitTest` and the rest). Busy is their union;
idle = wall − busy. ms.

| phase | wall | busy | busy share | scripting | GC | style | layout | paint | other | idle |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 703 | 159 | 22.6 % | 97 | 0 | 8 | 39 | 15 | 0 | 544 |
| pyrrhic:upgrades-default | 4 245 | 407 | 9.6 % | 201 | 16 | 15 | 14 | 139 | 22 | 3 838 |
| pyrrhic:captains | 1 680 | 206 | 12.3 % | 118 | 4 | 4 | 9 | 61 | 10 | 1 474 |
| pyrrhic:other | 2 452 | 344 | 14.0 % | 197 | 6 | 6 | 15 | 108 | 12 | 2 108 |
| **the run** | 9 081 | 1 117 | 12.3 % | 613 | 26 | 34 | 78 | 322 | 44 | 7 964 |

## 6. The main thread's JS per phase, from its samples

V8 samples of the main thread, idle dropped, each weighted by the gap to the next sample. React render:
the stack holds `renderWithHooks`, and the component is the frame it called; React commit: `commitRoot`
and the effects; `(program)` is the browser's own work outside JS. ms.

| phase | sampled | React render | React commit | other JS | (program) | (garbage collector) |
|---|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 168 | 61 | 52 | 24 | 31 | 0 |
| pyrrhic:upgrades-default | 479 | 95 | 18 | 51 | 298 | 17 |
| pyrrhic:captains | 224 | 69 | 7 | 36 | 108 | 4 |
| pyrrhic:other | 383 | 118 | 15 | 47 | 197 | 6 |
| **the run** | 1 255 | 342 | 93 | 159 | 634 | 28 |

React render by component (the 15 largest over the run), ms:

| component | pyrrhic:generate | pyrrhic:upgrades-default | pyrrhic:captains | pyrrhic:other | **the run** |
|---|---:|---:|---:|---:|---:|
| `_Box` | 16.5 | 33.9 | 26.2 | 40.3 | 116.9 |
| `factory` | 15.5 | 16.9 | 16.6 | 23.0 | 72.1 |
| `polymorphicFactory` | 6.9 | 18.6 | 10.5 | 21.9 | 58.0 |
| `(self)` | 3.8 | 5.9 | 3.2 | 4.5 | 17.3 |
| `PassSection` | 0.0 | 1.0 | 3.1 | 8.5 | 12.6 |
| `AdvisorFold` | 0.5 | 7.8 | 1.6 | 2.4 | 12.2 |
| `forwardRef` | 1.2 | 2.1 | 1.8 | 4.2 | 9.3 |
| `StopList` | 0.0 | 0.2 | 0.7 | 2.7 | 3.5 |
| `Disclosure` | 0.2 | 0.4 | 0.5 | 1.9 | 3.0 |
| `Figure` | 0.0 | 0.2 | 1.0 | 1.2 | 2.3 |
| `Transition` | 1.1 | 0.6 | 0.2 | 0.2 | 2.1 |
| `MarchRecap` | 1.3 | 0.2 | 0.3 | 0.4 | 2.1 |
| `genericFactory` | 1.6 | 0.2 | 0.2 | 0.2 | 2.1 |
| `AdvisorRowLine` | 0.0 | 0.3 | 0.3 | 1.2 | 1.8 |
| `PlanFold` | 0.8 | 0.2 | 0.1 | 0.4 | 1.5 |

