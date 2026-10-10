# 197 — the planner on the owner

W18 Drill 05 (`docs/plans/profile-drilldown.md` §0.2). Run 2026-10-10, node v22.22.1: `planCampaign` alone, in-process, under the probes' settings (no clock), release kernel. One warm-up plan, one counted plan (kernel doors wrapped, GC observed), 5 plans under the CPU profiler (100 µs), one plan under the sampling heap profiler. Shares are of the profiled planner samples (idle and the inspector's own frames excluded; the GC the plans cause included). Inclusive time counts a frame once per sample.


## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

| Figure | Value |
|---|---|
| CPU per plan (counted pass, process) | 1,170 ms |
| Wall per plan (counted pass) | 616 ms |
| Profiled planner time per plan (5 plans at 100 µs, inspector frames out) | 489.1 ms |
| `planCampaign` inclusive | 84.28 % |
| JavaScript self (not wasm, boundary or GC) | 54.99 % |
| (kernel wasm) self | 29.75 % |
| (wasm boundary) self (js-to-wasm / wasm-to-js adapters) | 0.00 % |
| GC share (`(garbage collector)` self) | 15.25 % |
| GC pauses (counted pass, `PerformanceObserver`) | 30 pauses, 77.4 ms, 6.62 % of CPU |
| Kernel crossings per plan | 363,814 (5 ladder kernels) |
| Allocated per plan (sampled every 8 KiB, collected kept) | 367.1 MiB |
| Allocation rate (per profiled planner second) | 751 MiB/s |

### Kernel crossings per plan, by door

`ladder.gridView` is a JavaScript read of views over the wasm memory (`ladderViews` rebuilds them only after the memory grew): it enters no wasm. Every other door is one JS → wasm call.

| Door | Calls | Share |
|---|---:|---:|
| `ladder.gridView` | 295,170 | 81.13 % |
| `march` | 22,900 | 6.29 % |
| `bill` | 20,310 | 5.58 % |
| `sizeStacks` | 12,045 | 3.31 % |
| `marchBill` | 5,560 | 1.53 % |
| `ladder.grid` | 3,650 | 1.00 % |
| `ladder.finale` | 3,200 | 0.88 % |
| `ladder.shape` | 898 | 0.25 % |
| `bindTable` | 76 | 0.02 % |
| `ladders` | 5 | 0.00 % |

### Drill 05's candidates, ranked by measured self time

| Rank | Function | Self ms/plan | Self | Inclusive ms/plan | Inclusive | JS under it (inclusive less wasm and GC leaves) |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `evaluateVector` (engine/plan.ts) | 34.2 | 7.00 % | 284.5 | 58.17 % | 31.10 % |
| 2 | `scorer` (engine/plan.ts) | 20.7 | 4.23 % | 243.7 | 49.83 % | 22.79 % |
| 3 | `sizedShape` (engine/plan.ts) | 19.1 | 3.90 % | 113.4 | 23.19 % | 6.21 % |
| 4 | `sizer` (engine/plan.ts) | 14.3 | 2.91 % | 128.7 | 26.32 % | 9.34 % |
| 5 | `finaleFor` (engine/plan.ts) | 10.6 | 2.16 % | 32.9 | 6.73 % | 3.62 % |
| 6 | `sizeStacks` (kernel/plan.ts) | 8.5 | 1.74 % | 92.1 | 18.84 % | 1.85 % |
| 7 | `gridOnKernel` (engine/plan.ts) | 3.9 | 0.80 % | 54.9 | 11.23 % | 4.46 % |
| 8 | `finish` (engine/plan.ts) | 2.8 | 0.58 % | 36.0 | 7.36 % | 4.24 % |
| 9 | `countsKey` (engine/plan.ts) | 2.5 | 0.50 % | 3.8 | 0.78 % | 0.78 % |
| 10 | `build` (engine/retype.ts) | 2.3 | 0.48 % | 11.8 | 2.42 % | 2.42 % |
| 11 | `sizedCounts` (engine/plan.ts) | 1.2 | 0.25 % | 93.4 | 19.10 % | 2.12 % |
| 12 | `prefixFielded` (engine/plan.ts) | 0.1 | 0.02 % | 0.5 | 0.10 % | 0.10 % |
| 13 | `retypeRow` (engine/plan.ts) | 0.0 | 0.01 % | 36.8 | 7.53 % | 6.33 % |
| 14 | `copyStacks` (engine/plan.ts) | 0.0 | 0.00 % | 0.1 | 0.02 % | 0.02 % |
| — | `sizeStacks` (engine/stacker.ts) | not sampled (inlined or never called) | — | — | — | — |

### Top 40 frames by self time

| Frame | Self ms/plan | Self | Inclusive |
|---|---:|---:|---:|
| `(kernel wasm)` | 145.5 | 29.75 % | 29.75 % |
| `(garbage collector)` | 74.6 | 15.25 % | 15.25 % |
| `evaluateVector engine/plan.ts` | 34.2 | 7.00 % | 58.17 % |
| `scorer engine/plan.ts` | 20.7 | 4.23 % | 49.83 % |
| `sizedShape engine/plan.ts` | 19.1 | 3.90 % | 23.19 % |
| `sizer engine/plan.ts` | 14.3 | 2.91 % | 26.32 % |
| `finaleFor engine/plan.ts` | 10.6 | 2.16 % | 6.73 % |
| `planCampaign engine/plan.ts` | 9.5 | 1.94 % | 84.28 % |
| `(anonymous) engine/retype.ts@76` | 9.5 | 1.94 % | 1.94 % |
| `sizeStacks kernel/plan.ts` | 8.5 | 1.74 % | 18.84 % |
| `shapeOf engine/plan.ts` | 6.2 | 1.26 % | 3.52 % |
| `march kernel/plan.ts` | 5.4 | 1.10 % | 5.49 % |
| `consider engine/retype.ts` | 5.1 | 1.04 % | 5.69 % |
| `undominatedRows engine/plan.ts` | 5.0 | 1.02 % | 1.08 % |
| `figuresOf engine/plan.ts` | 4.3 | 0.87 % | 2.33 % |
| `priceMarch engine/plan.ts` | 4.0 | 0.83 % | 0.93 % |
| `gridOnKernel engine/plan.ts` | 3.9 | 0.80 % | 11.23 % |
| `bill kernel/plan.ts` | 3.8 | 0.79 % | 1.79 % |
| `summarise engine/plan.ts` | 3.6 | 0.73 % | 1.78 % |
| `record engine/plan.ts` | 3.5 | 0.71 % | 1.87 % |
| `laddersNow engine/plan.ts` | 3.3 | 0.68 % | 0.74 % |
| `strongest engine/plan.ts` | 3.3 | 0.67 % | 1.73 % |
| `lay kernel/plan.ts` | 3.3 | 0.67 % | 0.86 % |
| `billedOf engine/plan.ts` | 3.2 | 0.65 % | 1.56 % |
| `marchBill kernel/plan.ts` | 2.9 | 0.59 % | 1.96 % |
| `finish engine/plan.ts` | 2.8 | 0.58 % | 7.36 % |
| `(anonymous) engine/plan.ts@3278` | 2.7 | 0.55 % | 0.78 % |
| `countsKey engine/plan.ts` | 2.5 | 0.50 % | 0.78 % |
| `build engine/retype.ts` | 2.3 | 0.48 % | 2.42 % |
| `climb engine/retype.ts` | 2.3 | 0.46 % | 4.95 % |
| `jsonOf engine/plan.ts` | 2.2 | 0.44 % | 0.44 % |
| `ladderViews kernel/plan.ts` | 2.1 | 0.44 % | 0.44 % |
| `where engine/plan.ts` | 1.9 | 0.39 % | 0.39 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 1.9 | 0.39 % | 84.70 % |
| `marchRecovery engine/plan.ts` | 1.8 | 0.37 % | 2.16 % |
| `tighterShape engine/plan.ts` | 1.8 | 0.36 % | 1.22 % |
| `gridView kernel/plan.ts` | 1.7 | 0.35 % | 0.70 % |
| `compact engine/plan.ts` | 1.7 | 0.34 % | 0.34 % |
| `marchOf engine/plan.ts` | 1.6 | 0.33 % | 5.77 % |
| `get buffer` | 1.6 | 0.32 % | 0.32 % |

### Top 30 frames by inclusive time

| Frame | Inclusive ms/plan | Inclusive | Self |
|---|---:|---:|---:|
| `(root)` | 489.1 | 100.00 % | 0.00 % |
| `runFixture theorycraft/197-the-planner-on-the-owner.test.ts` | 414.5 | 84.75 % | 0.00 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 414.3 | 84.70 % | 0.39 % |
| `planCampaign engine/plan.ts` | 412.2 | 84.28 % | 1.94 % |
| `evaluateVector engine/plan.ts` | 284.5 | 58.17 % | 7.00 % |
| `scorer engine/plan.ts` | 243.7 | 49.83 % | 4.23 % |
| `(kernel wasm)` | 145.5 | 29.75 % | 29.75 % |
| `sizer engine/plan.ts` | 128.7 | 26.32 % | 2.91 % |
| `sizedShape engine/plan.ts` | 113.4 | 23.19 % | 3.90 % |
| `sizedCounts engine/plan.ts` | 93.4 | 19.10 % | 0.25 % |
| `sizeStacks kernel/plan.ts` | 92.1 | 18.84 % | 1.74 % |
| `(garbage collector)` | 74.6 | 15.25 % | 15.25 % |
| `gridOnKernel engine/plan.ts` | 54.9 | 11.23 % | 0.80 % |
| `retypeOne engine/plan.ts` | 42.0 | 8.59 % | 0.18 % |
| `retypeMarch engine/retype.ts` | 41.0 | 8.38 % | 0.19 % |
| `retypeRow engine/plan.ts` | 36.8 | 7.53 % | 0.01 % |
| `retypeRowNow engine/plan.ts` | 36.7 | 7.51 % | 0.05 % |
| `finish engine/plan.ts` | 36.0 | 7.36 % | 0.58 % |
| `(anonymous) engine/plan.ts@5247` | 35.9 | 7.34 % | 0.01 % |
| `finaleFor engine/plan.ts` | 32.9 | 6.73 % | 2.16 % |
| `grid kernel/plan.ts` | 29.8 | 6.09 % | 0.22 % |
| `marchOf engine/plan.ts` | 28.2 | 5.77 % | 0.33 % |
| `consider engine/retype.ts` | 27.8 | 5.69 % | 1.04 % |
| `march kernel/plan.ts` | 26.8 | 5.49 % | 1.10 % |
| `climb engine/retype.ts` | 24.2 | 4.95 % | 0.46 % |
| `shapeOf engine/plan.ts` | 17.2 | 3.52 % | 1.26 % |
| `sweep engine/plan.ts` | 16.9 | 3.45 % | 0.10 % |
| `walkDown engine/plan.ts` | 12.0 | 2.45 % | 0.08 % |
| `build engine/retype.ts` | 11.8 | 2.42 % | 0.48 % |
| `figuresOf engine/plan.ts` | 11.4 | 2.33 % | 0.87 % |

### Top 25 allocating frames (sampled bytes, one plan)

| Frame | MiB | Share |
|---|---:|---:|
| `shapeOf engine/plan.ts` | 45.67 | 12.44 % |
| `scorer engine/plan.ts` | 44.66 | 12.16 % |
| `sizedShape engine/plan.ts` | 39.09 | 10.65 % |
| `finaleFor engine/plan.ts` | 26.42 | 7.20 % |
| `sizer engine/plan.ts` | 22.59 | 6.15 % |
| `evaluateVector engine/plan.ts` | 22.45 | 6.11 % |
| `next` | 20.05 | 5.46 % |
| `record engine/plan.ts` | 15.27 | 4.16 % |
| `sizeStacks kernel/plan.ts` | 12.20 | 3.32 % |
| `climb engine/retype.ts` | 6.75 | 1.84 % |
| `(anonymous) engine/plan.ts@1086` | 6.48 | 1.76 % |
| `build engine/retype.ts` | 5.95 | 1.62 % |
| `(anonymous) engine/plan.ts@1106` | 4.97 | 1.35 % |
| `replayed engine/plan.ts` | 4.04 | 1.10 % |
| `priceMarch engine/plan.ts` | 3.82 | 1.04 % |
| `join` | 3.70 | 1.01 % |
| `march kernel/plan.ts` | 3.69 | 1.00 % |
| `sort` | 3.26 | 0.89 % |
| `Set` | 3.20 | 0.87 % |
| `marchRecovery engine/plan.ts` | 3.09 | 0.84 % |
| `filter` | 3.08 | 0.84 % |
| `add` | 2.86 | 0.78 % |
| `set` | 2.85 | 0.78 % |
| `finish engine/plan.ts` | 2.67 | 0.73 % |
| `map` | 2.64 | 0.72 % |

## Exactness fixture (owner export 2026-09-17)

| Figure | Value |
|---|---|
| CPU per plan (counted pass, process) | 961 ms |
| Wall per plan (counted pass) | 613 ms |
| Profiled planner time per plan (5 plans at 100 µs, inspector frames out) | 514.6 ms |
| `planCampaign` inclusive | 90.29 % |
| JavaScript self (not wasm, boundary or GC) | 72.19 % |
| (kernel wasm) self | 18.40 % |
| (wasm boundary) self (js-to-wasm / wasm-to-js adapters) | 0.00 % |
| GC share (`(garbage collector)` self) | 9.41 % |
| GC pauses (counted pass, `PerformanceObserver`) | 23 pauses, 61.2 ms, 6.37 % of CPU |
| Kernel crossings per plan | 227,503 (9 ladder kernels) |
| Allocated per plan (sampled every 8 KiB, collected kept) | 254.5 MiB |
| Allocation rate (per profiled planner second) | 495 MiB/s |

### Kernel crossings per plan, by door

`ladder.gridView` is a JavaScript read of views over the wasm memory (`ladderViews` rebuilds them only after the memory grew): it enters no wasm. Every other door is one JS → wasm call.

| Door | Calls | Share |
|---|---:|---:|
| `ladder.gridView` | 106,683 | 46.89 % |
| `marchBill` | 90,699 | 39.87 % |
| `march` | 11,489 | 5.05 % |
| `bill` | 7,880 | 3.46 % |
| `sizeStacks` | 4,847 | 2.13 % |
| `ladder.shape` | 2,276 | 1.00 % |
| `ladder.finale` | 2,094 | 0.92 % |
| `ladder.grid` | 1,323 | 0.58 % |
| `bindTable` | 203 | 0.09 % |
| `ladders` | 9 | 0.00 % |

### Drill 05's candidates, ranked by measured self time

| Rank | Function | Self ms/plan | Self | Inclusive ms/plan | Inclusive | JS under it (inclusive less wasm and GC leaves) |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `evaluateVector` (engine/plan.ts) | 17.6 | 3.42 % | 101.9 | 19.80 % | 13.16 % |
| 2 | `build` (engine/retype.ts) | 13.5 | 2.62 % | 74.0 | 14.38 % | 14.38 % |
| 3 | `scorer` (engine/plan.ts) | 8.3 | 1.61 % | 81.2 | 15.78 % | 9.08 % |
| 4 | `finaleFor` (engine/plan.ts) | 5.7 | 1.12 % | 24.5 | 4.76 % | 2.25 % |
| 5 | `sizedShape` (engine/plan.ts) | 5.1 | 0.99 % | 21.9 | 4.26 % | 1.75 % |
| 6 | `sizer` (engine/plan.ts) | 4.9 | 0.95 % | 27.8 | 5.41 % | 2.89 % |
| 7 | `finish` (engine/plan.ts) | 3.5 | 0.69 % | 28.5 | 5.53 % | 3.02 % |
| 8 | `sizeStacks` (kernel/plan.ts) | 2.6 | 0.51 % | 16.1 | 3.13 % | 0.61 % |
| 9 | `gridOnKernel` (engine/plan.ts) | 2.1 | 0.40 % | 26.6 | 5.16 % | 2.26 % |
| 10 | `sizedCounts` (engine/plan.ts) | 0.5 | 0.11 % | 16.6 | 3.23 % | 0.71 % |
| 11 | `countsKey` (engine/plan.ts) | 0.5 | 0.09 % | 0.6 | 0.12 % | 0.12 % |
| 12 | `prefixFielded` (engine/plan.ts) | 0.4 | 0.07 % | 0.7 | 0.14 % | 0.14 % |
| 13 | `retypeRow` (engine/plan.ts) | 0.2 | 0.03 % | 182.7 | 35.51 % | 28.50 % |
| 14 | `copyStacks` (engine/plan.ts) | 0.0 | 0.01 % | 0.0 | 0.01 % | 0.01 % |
| — | `sizeStacks` (engine/stacker.ts) | not sampled (inlined or never called) | — | — | — | — |

### Top 40 frames by self time

| Frame | Self ms/plan | Self | Inclusive |
|---|---:|---:|---:|
| `(kernel wasm)` | 94.7 | 18.40 % | 18.40 % |
| `consider engine/retype.ts` | 60.6 | 11.79 % | 44.96 % |
| `(anonymous) engine/retype.ts@76` | 60.6 | 11.77 % | 11.77 % |
| `walk engine/retype.ts` | 54.8 | 10.65 % | 58.64 % |
| `(garbage collector)` | 48.4 | 9.41 % | 9.41 % |
| `marchBill kernel/plan.ts` | 21.7 | 4.21 % | 16.11 % |
| `evaluateVector engine/plan.ts` | 17.6 | 3.42 % | 19.80 % |
| `outOfTime engine/retype.ts` | 15.5 | 3.00 % | 3.00 % |
| `build engine/retype.ts` | 13.5 | 2.62 % | 14.38 % |
| `marchBill engine/retype.ts` | 11.4 | 2.22 % | 18.52 % |
| `scorer engine/plan.ts` | 8.3 | 1.61 % | 15.78 % |
| `planCampaign engine/plan.ts` | 6.2 | 1.21 % | 90.29 % |
| `finaleFor engine/plan.ts` | 5.7 | 1.12 % | 4.76 % |
| `sizedShape engine/plan.ts` | 5.1 | 0.99 % | 4.26 % |
| `sizer engine/plan.ts` | 4.9 | 0.95 % | 5.41 % |
| `finish engine/plan.ts` | 3.5 | 0.69 % | 5.53 % |
| `get buffer` | 2.9 | 0.56 % | 0.56 % |
| `billedOf engine/plan.ts` | 2.6 | 0.51 % | 0.93 % |
| `sizeStacks kernel/plan.ts` | 2.6 | 0.51 % | 3.13 % |
| `gridOnKernel engine/plan.ts` | 2.1 | 0.40 % | 5.16 % |
| `(anonymous) engine/fast.ts@14` | 2.1 | 0.40 % | 0.40 % |
| `packRequest kernel/pack.ts` | 2.1 | 0.40 % | 0.66 % |
| `priceMarch engine/plan.ts` | 2.0 | 0.40 % | 0.47 % |
| `march kernel/plan.ts` | 2.0 | 0.38 % | 1.55 % |
| `retypeMarch engine/retype.ts` | 1.8 | 0.35 % | 61.85 % |
| `retypeOne engine/plan.ts` | 1.8 | 0.35 % | 62.25 % |
| `rate engine/rating.ts` | 1.6 | 0.31 % | 0.31 % |
| `(anonymous) kernel/layout.ts@5` | 1.6 | 0.30 % | 0.30 % |
| `tighterShape engine/plan.ts` | 1.5 | 0.30 % | 1.01 % |
| `summarise engine/plan.ts` | 1.5 | 0.29 % | 0.68 % |
| `marchRecovery engine/plan.ts` | 1.4 | 0.28 % | 0.71 % |
| `laddersNow engine/plan.ts` | 1.4 | 0.27 % | 0.33 % |
| `(anonymous) engine/plan.ts@3278` | 1.4 | 0.27 % | 0.39 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 1.3 | 0.26 % | 90.55 % |
| `undominatedRows engine/plan.ts` | 1.3 | 0.26 % | 0.38 % |
| `ratioOf engine/plan.ts` | 1.3 | 0.25 % | 0.46 % |
| `(anonymous) kernel/plan.ts@249` | 1.2 | 0.24 % | 0.24 % |
| `figuresOf engine/plan.ts` | 1.2 | 0.24 % | 1.09 % |
| `marchOfTs engine/plan.ts` | 1.0 | 0.20 % | 0.38 % |
| `bill kernel/plan.ts` | 1.0 | 0.19 % | 0.43 % |

### Top 30 frames by inclusive time

| Frame | Inclusive ms/plan | Inclusive | Self |
|---|---:|---:|---:|
| `(root)` | 514.6 | 100.00 % | 0.00 % |
| `runFixture theorycraft/197-the-planner-on-the-owner.test.ts` | 466.1 | 90.59 % | 0.01 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 465.9 | 90.55 % | 0.26 % |
| `planCampaign engine/plan.ts` | 464.6 | 90.29 % | 1.21 % |
| `retypeOne engine/plan.ts` | 320.3 | 62.25 % | 0.35 % |
| `retypeMarch engine/retype.ts` | 318.3 | 61.85 % | 0.35 % |
| `walk engine/retype.ts` | 301.7 | 58.64 % | 10.65 % |
| `consider engine/retype.ts` | 231.3 | 44.96 % | 11.79 % |
| `retypeRow engine/plan.ts` | 182.7 | 35.51 % | 0.03 % |
| `retypeRowNow engine/plan.ts` | 182.5 | 35.47 % | 0.06 % |
| `(anonymous) engine/plan.ts@5247` | 181.6 | 35.30 % | 0.01 % |
| `ownLadderCandidates engine/plan.ts` | 138.9 | 26.99 % | 0.03 % |
| `evaluateVector engine/plan.ts` | 101.9 | 19.80 % | 3.42 % |
| `marchBill engine/retype.ts` | 95.3 | 18.52 % | 2.22 % |
| `(kernel wasm)` | 94.7 | 18.40 % | 18.40 % |
| `marchBill kernel/plan.ts` | 82.9 | 16.11 % | 4.21 % |
| `scorer engine/plan.ts` | 81.2 | 15.78 % | 1.61 % |
| `build engine/retype.ts` | 74.0 | 14.38 % | 2.62 % |
| `(anonymous) engine/retype.ts@76` | 60.6 | 11.77 % | 11.77 % |
| `(garbage collector)` | 48.4 | 9.41 % | 9.41 % |
| `finish engine/plan.ts` | 28.5 | 5.53 % | 0.69 % |
| `sizer engine/plan.ts` | 27.8 | 5.41 % | 0.95 % |
| `gridOnKernel engine/plan.ts` | 26.6 | 5.16 % | 0.40 % |
| `finaleFor engine/plan.ts` | 24.5 | 4.76 % | 1.12 % |
| `sizedShape engine/plan.ts` | 21.9 | 4.26 % | 0.99 % |
| `sizedCounts engine/plan.ts` | 16.6 | 3.23 % | 0.11 % |
| `sizeStacks kernel/plan.ts` | 16.1 | 3.13 % | 0.51 % |
| `outOfTime engine/retype.ts` | 15.5 | 3.00 % | 3.00 % |
| `shapeOf engine/plan.ts` | 13.0 | 2.53 % | 0.18 % |
| `grid kernel/plan.ts` | 10.6 | 2.05 % | 0.06 % |

### Top 25 allocating frames (sampled bytes, one plan)

| Frame | MiB | Share |
|---|---:|---:|
| `walk engine/retype.ts` | 56.09 | 22.04 % |
| `scorer engine/plan.ts` | 33.57 | 13.19 % |
| `marchBill kernel/plan.ts` | 20.84 | 8.19 % |
| `finaleFor engine/plan.ts` | 13.84 | 5.44 % |
| `join` | 12.53 | 4.92 % |
| `add` | 12.52 | 4.92 % |
| `set` | 11.89 | 4.67 % |
| `sizedShape engine/plan.ts` | 10.75 | 4.23 % |
| `evaluateVector engine/plan.ts` | 8.16 | 3.21 % |
| `next` | 7.86 | 3.09 % |
| `finish engine/plan.ts` | 6.80 | 2.67 % |
| `ratioOf engine/plan.ts` | 5.67 | 2.23 % |
| `sizer engine/plan.ts` | 4.96 | 1.95 % |
| `delete` | 3.40 | 1.34 % |
| `sizeStacks kernel/plan.ts` | 3.25 | 1.28 % |
| `finaleOnKernel engine/plan.ts` | 2.18 | 0.86 % |
| `tighterShape engine/plan.ts` | 2.15 | 0.85 % |
| `rate engine/rating.ts` | 1.99 | 0.78 % |
| `sort` | 1.97 | 0.77 % |
| `figuresOf engine/plan.ts` | 1.93 | 0.76 % |
| `march kernel/plan.ts` | 1.92 | 0.75 % |
| `Set` | 1.66 | 0.65 % |
| `build engine/retype.ts` | 1.46 | 0.57 % |
| `ladderOnKernel engine/plan.ts` | 1.35 | 0.53 % |
| `priceMarch engine/plan.ts` | 1.30 | 0.51 % |
