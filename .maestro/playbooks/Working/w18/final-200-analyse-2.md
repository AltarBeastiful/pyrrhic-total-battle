# Trace analysis: `trace-final-2.json.gz`

Chrome JSON trace; source maps: `dist/assets`. Pool-worker samplers (profile index): [2, 3, 4, 5, 6, 7, 8]; main thread: [0].

## 1. Phases and pool jobs

Wall from the `pyrrhic:*` slices; job CPU is the summed duration of the `job:*` slices that start inside the
phase (one job runs alone on its worker). Idle share = 1 − CPU / (wall × busy tracks).

| phase | job | count | CPU ms | min | avg | max | tracks | idle share |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **pyrrhic:generate** (653 ms wall) | all | 7 | 509 | | | | 1 | 22.1 % |
| | `job:plan` | 1 | 496 | 496 | 496 | 496 | 1 | 24.1 % |
| | `job:positions` | 5 | 10 | 0 | 2 | 7 | 1 | 98.5 % |
| | `job:boot` | 1 | 3 | 3 | 3 | 3 | 1 | 99.6 % |
| **pyrrhic:upgrades-default** (4 195 ms wall) | all | 41 | 23 798 | | | | 6 | 5.5 % |
| | `job:probe` | 35 | 23 768 | 2 | 679 | 911 | 6 | 5.6 % |
| | `job:boot` | 6 | 30 | 4 | 5 | 6 | 6 | 99.9 % |
| **pyrrhic:captains** (1 645 ms wall) | all | 11 | 6 317 | | | | 6 | 36.0 % |
| | `job:probe` | 10 | 6 315 | 386 | 631 | 821 | 6 | 36.0 % |
| | `job:captains` | 1 | 2 | 2 | 2 | 2 | 1 | 99.9 % |
| **pyrrhic:other** (2 558 ms wall) | all | 23 | 13 171 | | | | 6 | 14.2 % |
| | `job:probe` | 23 | 13 171 | 1 | 573 | 921 | 6 | 14.2 % |
| **total** | | 82 | **43 795** | | | | | |

Total wall of the phases: **9 051 ms**; pool CPU: **43.8 s**.

## 2. Pool-worker CPU by part and leaf kind

V8 samples on the 7 pool workers (threads whose stacks contain `timedJob`), idle removed; 
median sample gap 164 µs. Busy samples: 207 349. V8 does not sample at an even pace, so read
shares here and CPU time from table 1.

| part | leaf kind | samples | share |
|---|---|---:|---:|
| **planCampaign** | all | 194 428 | **93.8 %** |
| | JS | 157 922 | 76.2 % |
| | wasm (kernel/) | 35 139 | 16.9 % |
| | unnamed | 1 367 | 0.7 % |
| **other** | all | 10 990 | **5.3 %** |
| | garbage collector | 8 799 | 4.2 % |
| | JS | 2 038 | 1.0 % |
| | unnamed | 124 | 0.1 % |
| | wasm (kernel/) | 29 | 0.0 % |
| **Tight raise (positionTrades)** | all | 1 931 | **0.9 %** |
| | wasm (kernel/) | 1 060 | 0.5 % |
| | JS | 867 | 0.4 % |
| | unnamed | 4 | 0.0 % |

## 3. Call tree under `runProbe` (pool workers)

Every advisor probe, all pool workers together.
Inclusive samples, depth 7, frames ≥ 1 % of `runProbe`.

| frame | samples | share |
|---|---:|---:|
| `runProbe` | 194 923 | 100.0 % |
| &nbsp;&nbsp;└ `planCampaign` | 191 537 | 98.3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRow` | 71 054 | 36.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 70 941 | 36.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 62 094 | 31.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 62 062 | 31.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 61 859 | 31.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 59 502 | 30.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeRowNow` | 8 588 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `map` | 8 572 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 8 571 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 8 549 | 4.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `ownLadderCandidates` | 52 449 | 26.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeOne` | 52 413 | 26.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `retypeMarch` | 52 135 | 26.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 569 | 25.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 544 | 25.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `walk` | 49 430 | 25.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 44 527 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 31 207 | 16.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 10 707 | 5.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 6 028 | 3.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 4 959 | 2.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 4 239 | 2.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `grid` | 3 324 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finish` | 7 716 | 4.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleFor` | 7 183 | 3.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finaleOnKernel` | 2 690 | 1.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `finale` | 2 300 | 1.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 2 012 | 1.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizer` | 6 734 | 3.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizedShape` | 5 027 | 2.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sizerShape` | 4 856 | 2.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `js-to-wasm:idddid:i` | 3 086 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 8 095 | 4.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 4 026 | 2.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `gridOnKernel` | 3 515 | 1.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `shapeOf` | 2 096 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `record` | 2 028 | 1.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `walkDown` | 3 361 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `sweep` | 3 248 | 1.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `evaluateVector` | 3 092 | 1.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `ShapeScorer` | 2 434 | 1.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `buildAllIn` | 2 229 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `strongest` | 2 049 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `figuresOf` | 2 060 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `undominatedRows` | 1 992 | 1.0 % |

## 4. Call tree on the main thread

The renderer's main thread (`CrRendererMain`), all of it from its `(root)` frame, idle removed.
Inclusive samples, depth 7, frames ≥ 1 % of `(root)`.

| frame | samples | share |
|---|---:|---:|
| `(root)` | 7 049 | 100.0 % |
| &nbsp;&nbsp;└ `(program)` | 3 609 | 51.2 % |
| &nbsp;&nbsp;└ `scheduleMicrotask` | 1 615 | 22.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `processRootScheduleInMicrotask` | 1 614 | 22.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushSyncWorkAcrossRoots_impl` | 1 607 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performSyncWorkOnRoot` | 1 606 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 1 605 | 22.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 1 184 | 16.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 1 181 | 16.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 421 | 6.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 420 | 6.0 % |
| &nbsp;&nbsp;└ `performWorkUntilDeadline` | 1 193 | 16.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRootViaSchedulerTask` | 1 175 | 16.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `performWorkOnRoot` | 1 171 | 16.6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootConcurrent` | 644 | 9.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopConcurrentByScheduler` | 641 | 9.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 543 | 7.7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 425 | 6.0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeUnitOfWork` | 76 | 1.1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `renderRootSync` | 416 | 5.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `workLoopSync` | 415 | 5.9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `beginWork` | 408 | 5.8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `updateFunctionComponent` | 366 | 5.2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRootWhenReady` | 108 | 1.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `completeRoot` | 104 | 1.5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `commitRoot` | 102 | 1.4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ `flushMutationEffects` | 86 | 1.2 % |
| &nbsp;&nbsp;└ `(garbage collector)` | 227 | 3.2 % |
| &nbsp;&nbsp;└ `(unnamed)` | 115 | 1.6 % |

## 5. The main thread's own time per phase

Exclusive time of the renderer main thread's `devtools.timeline` / `v8.execute` events, clipped to each
phase: scripting (JS tasks, microtasks, posted messages), GC, style (`UpdateLayoutTree`), layout, paint
(`PrePaint`, `Paint`, `Layerize`, `Commit`), other (`HitTest` and the rest). Busy is their union;
idle = wall − busy. ms.

| phase | wall | busy | busy share | scripting | GC | style | layout | paint | other | idle |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 653 | 146 | 22.4 % | 90 | 0 | 8 | 38 | 10 | 0 | 507 |
| pyrrhic:upgrades-default | 4 195 | 451 | 10.8 % | 198 | 64 | 10 | 15 | 139 | 26 | 3 744 |
| pyrrhic:captains | 1 645 | 213 | 12.9 % | 129 | 2 | 4 | 8 | 61 | 9 | 1 433 |
| pyrrhic:other | 2 558 | 373 | 14.6 % | 208 | 12 | 6 | 15 | 122 | 11 | 2 184 |
| **the run** | 9 051 | 1 184 | 13.1 % | 625 | 78 | 28 | 75 | 331 | 46 | 7 867 |

## 6. The main thread's JS per phase, from its samples

V8 samples of the main thread, idle dropped, each weighted by the gap to the next sample. React render:
the stack holds `renderWithHooks`, and the component is the frame it called; React commit: `commitRoot`
and the effects; `(program)` is the browser's own work outside JS. ms.

| phase | sampled | React render | React commit | other JS | (program) | (garbage collector) |
|---|---:|---:|---:|---:|---:|---:|
| pyrrhic:generate | 152 | 59 | 51 | 20 | 22 | 0 |
| pyrrhic:upgrades-default | 520 | 96 | 13 | 55 | 292 | 65 |
| pyrrhic:captains | 235 | 75 | 8 | 36 | 113 | 3 |
| pyrrhic:other | 411 | 124 | 10 | 39 | 227 | 11 |
| **the run** | 1 319 | 353 | 82 | 150 | 654 | 80 |

React render by component (the 15 largest over the run), ms:

| component | pyrrhic:generate | pyrrhic:upgrades-default | pyrrhic:captains | pyrrhic:other | **the run** |
|---|---:|---:|---:|---:|---:|
| `_Box` | 17.8 | 38.1 | 32.4 | 50.6 | 139.0 |
| `factory` | 11.3 | 18.0 | 13.5 | 19.3 | 62.0 |
| `polymorphicFactory` | 7.6 | 17.5 | 10.2 | 15.7 | 51.0 |
| `(self)` | 4.0 | 5.4 | 4.6 | 3.0 | 17.1 |
| `forwardRef` | 1.6 | 4.6 | 2.6 | 4.4 | 13.2 |
| `MarchEditedNote` | 0.2 | 0.2 | 0.2 | 7.9 | 8.4 |
| `AdvisorFold` | 0.5 | 4.1 | 1.5 | 2.2 | 8.2 |
| `PassSection` | 0.2 | 0.5 | 1.7 | 2.8 | 5.2 |
| `TrioLine` | 0.0 | 0.0 | 0.2 | 3.4 | 3.6 |
| `StopList` | 0.0 | 0.2 | 1.0 | 2.4 | 3.5 |
| `Disclosure` | 0.2 | 0.2 | 1.4 | 1.6 | 3.3 |
| `Transition` | 0.5 | 0.5 | 0.3 | 1.5 | 2.8 |
| `MarchActions` | 0.2 | 0.2 | 0.2 | 2.2 | 2.7 |
| `MarchCost` | 0.0 | 0.6 | 0.4 | 1.4 | 2.4 |
| `MarchRecap` | 1.1 | 0.3 | 0.3 | 0.0 | 1.8 |

