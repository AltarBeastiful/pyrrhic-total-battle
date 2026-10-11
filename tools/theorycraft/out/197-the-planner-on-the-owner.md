# 197 — the planner on the owner

W18 Drill 05 (`docs/plans/profile-drilldown.md` §0.2). Run 2026-10-11, node v22.22.1: `planCampaign` alone, in-process, under the probes' settings (no clock), release kernel. One warm-up plan, one counted plan (kernel doors wrapped, GC observed), 5 plans under the CPU profiler (100 µs), one plan under the sampling heap profiler. Shares are of the profiled planner samples (idle and the inspector's own frames excluded; the GC the plans cause included). Inclusive time counts a frame once per sample.


## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

| Figure | Value |
|---|---|
| CPU per plan (counted pass, process) | 1,143 ms |
| Wall per plan (counted pass) | 622 ms |
| Profiled planner time per plan (5 plans at 100 µs, inspector frames out) | 488.2 ms |
| `planCampaign` inclusive | 87.67 % |
| JavaScript self (not wasm, boundary or GC) | 56.81 % |
| (kernel wasm) self | 31.50 % |
| (wasm boundary) self (js-to-wasm / wasm-to-js adapters) | 0.00 % |
| GC share (`(garbage collector)` self) | 11.68 % |
| GC pauses (counted pass, `PerformanceObserver`) | 29 pauses, 57.2 ms, 5.00 % of CPU |
| Kernel crossings per plan | 363,814 (5 ladder kernels) |
| Allocated per plan (sampled every 8 KiB, collected kept) | 368.3 MiB |
| Allocation rate (per profiled planner second) | 755 MiB/s |

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
| 1 | `evaluateVector` (engine/plan.ts) | 37.3 | 7.64 % | 303.0 | 62.07 % | 33.41 % |
| 2 | `sizedShape` (engine/plan.ts) | 21.8 | 4.47 % | 121.7 | 24.94 % | 6.74 % |
| 3 | `scorer` (engine/plan.ts) | 20.3 | 4.16 % | 256.7 | 52.58 % | 24.03 % |
| 4 | `sizer` (engine/plan.ts) | 15.9 | 3.25 % | 138.9 | 28.46 % | 10.26 % |
| 5 | `sizeStacks` (kernel/plan.ts) | 8.4 | 1.73 % | 98.3 | 20.13 % | 1.93 % |
| 6 | `finaleFor` (engine/plan.ts) | 8.3 | 1.70 % | 32.1 | 6.58 % | 3.33 % |
| 7 | `finish` (engine/plan.ts) | 3.9 | 0.80 % | 36.2 | 7.42 % | 4.17 % |
| 8 | `gridOnKernel` (engine/plan.ts) | 3.1 | 0.64 % | 55.0 | 11.26 % | 4.13 % |
| 9 | `countsKey` (engine/plan.ts) | 2.5 | 0.52 % | 3.7 | 0.77 % | 0.77 % |
| 10 | `build` (engine/retype.ts) | 1.6 | 0.32 % | 7.9 | 1.61 % | 1.61 % |
| 11 | `sizedCounts` (engine/plan.ts) | 1.0 | 0.20 % | 99.2 | 20.32 % | 2.12 % |
| 12 | `prefixFielded` (engine/plan.ts) | 0.1 | 0.03 % | 0.9 | 0.19 % | 0.19 % |
| 13 | `copyStacks` (engine/plan.ts) | 0.1 | 0.02 % | 0.1 | 0.03 % | 0.03 % |
| 14 | `retypeRow` (engine/plan.ts) | 0.1 | 0.01 % | 36.0 | 7.36 % | 6.12 % |
| — | `sizeStacks` (engine/stacker.ts) | not sampled (inlined or never called) | — | — | — | — |

### Top 40 frames by self time

| Frame | Self ms/plan | Self | Inclusive |
|---|---:|---:|---:|
| `(kernel wasm)` | 153.8 | 31.50 % | 31.50 % |
| `(garbage collector)` | 57.0 | 11.68 % | 11.68 % |
| `evaluateVector engine/plan.ts` | 37.3 | 7.64 % | 62.07 % |
| `sizedShape engine/plan.ts` | 21.8 | 4.47 % | 24.94 % |
| `scorer engine/plan.ts` | 20.3 | 4.16 % | 52.58 % |
| `sizer engine/plan.ts` | 15.9 | 3.25 % | 28.46 % |
| `planCampaign engine/plan.ts` | 12.4 | 2.53 % | 87.67 % |
| `sizeStacks kernel/plan.ts` | 8.4 | 1.73 % | 20.13 % |
| `finaleFor engine/plan.ts` | 8.3 | 1.70 % | 6.58 % |
| `retypeMarch engine/retype.ts` | 7.2 | 1.47 % | 8.37 % |
| `(anonymous) engine/retype.ts@76` | 6.3 | 1.29 % | 1.29 % |
| `undominatedRows engine/plan.ts` | 5.7 | 1.18 % | 1.22 % |
| `laddersNow engine/plan.ts` | 5.7 | 1.17 % | 1.33 % |
| `shapeOf engine/plan.ts` | 5.6 | 1.16 % | 3.61 % |
| `march kernel/plan.ts` | 5.4 | 1.10 % | 5.59 % |
| `record engine/plan.ts` | 4.6 | 0.94 % | 2.18 % |
| `figuresOf engine/plan.ts` | 4.2 | 0.86 % | 2.20 % |
| `priceMarch engine/plan.ts` | 4.0 | 0.81 % | 0.90 % |
| `finish engine/plan.ts` | 3.9 | 0.80 % | 7.42 % |
| `bill kernel/plan.ts` | 3.8 | 0.77 % | 1.84 % |
| `summarise engine/plan.ts` | 3.7 | 0.76 % | 1.80 % |
| `lay kernel/plan.ts` | 3.7 | 0.75 % | 0.94 % |
| `consider engine/retype.ts` | 3.7 | 0.75 % | 4.01 % |
| `billedOf engine/plan.ts` | 3.5 | 0.71 % | 1.48 % |
| `gridOnKernel engine/plan.ts` | 3.1 | 0.64 % | 11.26 % |
| `marchBill kernel/plan.ts` | 2.9 | 0.60 % | 2.14 % |
| `countsKey engine/plan.ts` | 2.5 | 0.52 % | 0.77 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 2.5 | 0.52 % | 88.26 % |
| `where engine/plan.ts` | 2.1 | 0.44 % | 0.44 % |
| `jsonOf engine/plan.ts` | 2.0 | 0.41 % | 0.41 % |
| `tighterShape engine/plan.ts` | 1.9 | 0.40 % | 1.15 % |
| `get buffer` | 1.9 | 0.39 % | 0.39 % |
| `(anonymous) engine/plan.ts@3304` | 1.8 | 0.37 % | 0.50 % |
| `ladderViews kernel/plan.ts` | 1.8 | 0.37 % | 0.37 % |
| `marchOf engine/plan.ts` | 1.6 | 0.33 % | 5.97 % |
| `strongest engine/plan.ts` | 1.6 | 0.33 % | 1.44 % |
| `build engine/retype.ts` | 1.6 | 0.32 % | 1.61 % |
| `compact engine/plan.ts` | 1.6 | 0.32 % | 0.32 % |
| `grid kernel/plan.ts` | 1.5 | 0.31 % | 6.34 % |
| `shelterUnder engine/plan.ts` | 1.5 | 0.30 % | 0.30 % |

### Top 30 frames by inclusive time

| Frame | Inclusive ms/plan | Inclusive | Self |
|---|---:|---:|---:|
| `(root)` | 488.2 | 100.00 % | 0.00 % |
| `runFixture theorycraft/197-the-planner-on-the-owner.test.ts` | 431.1 | 88.32 % | 0.01 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 430.8 | 88.26 % | 0.52 % |
| `planCampaign engine/plan.ts` | 428.0 | 87.67 % | 2.53 % |
| `evaluateVector engine/plan.ts` | 303.0 | 62.07 % | 7.64 % |
| `scorer engine/plan.ts` | 256.7 | 52.58 % | 4.16 % |
| `(kernel wasm)` | 153.8 | 31.50 % | 31.50 % |
| `sizer engine/plan.ts` | 138.9 | 28.46 % | 3.25 % |
| `sizedShape engine/plan.ts` | 121.7 | 24.94 % | 4.47 % |
| `sizedCounts engine/plan.ts` | 99.2 | 20.32 % | 0.20 % |
| `sizeStacks kernel/plan.ts` | 98.3 | 20.13 % | 1.73 % |
| `(garbage collector)` | 57.0 | 11.68 % | 11.68 % |
| `gridOnKernel engine/plan.ts` | 55.0 | 11.26 % | 0.64 % |
| `retypeOne engine/plan.ts` | 41.6 | 8.52 % | 0.13 % |
| `retypeMarch engine/retype.ts` | 40.9 | 8.37 % | 1.47 % |
| `finish engine/plan.ts` | 36.2 | 7.42 % | 0.80 % |
| `retypeRow engine/plan.ts` | 36.0 | 7.36 % | 0.01 % |
| `retypeRowNow engine/plan.ts` | 35.9 | 7.35 % | 0.02 % |
| `(anonymous) engine/plan.ts@5273` | 35.1 | 7.18 % | 0.02 % |
| `finaleFor engine/plan.ts` | 32.1 | 6.58 % | 1.70 % |
| `grid kernel/plan.ts` | 30.9 | 6.34 % | 0.31 % |
| `marchOf engine/plan.ts` | 29.1 | 5.97 % | 0.33 % |
| `march kernel/plan.ts` | 27.3 | 5.59 % | 1.10 % |
| `consider engine/retype.ts` | 19.6 | 4.01 % | 0.75 % |
| `sweep engine/plan.ts` | 17.6 | 3.61 % | 0.05 % |
| `shapeOf engine/plan.ts` | 17.6 | 3.61 % | 1.16 % |
| `climb engine/retype.ts` | 15.8 | 3.24 % | 0.19 % |
| `walkDown engine/plan.ts` | 12.5 | 2.57 % | 0.05 % |
| `figuresOf engine/plan.ts` | 10.7 | 2.20 % | 0.86 % |
| `record engine/plan.ts` | 10.6 | 2.18 % | 0.94 % |

### Top 25 allocating frames (sampled bytes, one plan)

| Frame | MiB | Share |
|---|---:|---:|
| `shapeOf engine/plan.ts` | 46.56 | 12.64 % |
| `scorer engine/plan.ts` | 44.82 | 12.17 % |
| `sizedShape engine/plan.ts` | 38.61 | 10.48 % |
| `finaleFor engine/plan.ts` | 27.37 | 7.43 % |
| `sizer engine/plan.ts` | 22.72 | 6.17 % |
| `evaluateVector engine/plan.ts` | 22.36 | 6.07 % |
| `next` | 20.48 | 5.56 % |
| `record engine/plan.ts` | 15.49 | 4.20 % |
| `sizeStacks kernel/plan.ts` | 11.96 | 3.25 % |
| `climb engine/retype.ts` | 6.92 | 1.88 % |
| `(anonymous) engine/plan.ts@1102` | 6.92 | 1.88 % |
| `consider engine/retype.ts` | 5.32 | 1.44 % |
| `(anonymous) engine/plan.ts@1122` | 5.05 | 1.37 % |
| `priceMarch engine/plan.ts` | 4.06 | 1.10 % |
| `replayed engine/plan.ts` | 3.98 | 1.08 % |
| `march kernel/plan.ts` | 3.66 | 0.99 % |
| `join` | 3.47 | 0.94 % |
| `sort` | 3.29 | 0.89 % |
| `Set` | 3.24 | 0.88 % |
| `set` | 3.15 | 0.85 % |
| `marchRecovery engine/plan.ts` | 3.01 | 0.82 % |
| `billedOf engine/plan.ts` | 2.90 | 0.79 % |
| `finish engine/plan.ts` | 2.83 | 0.77 % |
| `filter` | 2.79 | 0.76 % |
| `add` | 2.74 | 0.74 % |

## Exactness fixture (owner export 2026-09-17)

| Figure | Value |
|---|---|
| CPU per plan (counted pass, process) | 625 ms |
| Wall per plan (counted pass) | 484 ms |
| Profiled planner time per plan (5 plans at 100 µs, inspector frames out) | 507.0 ms |
| `planCampaign` inclusive | 91.52 % |
| JavaScript self (not wasm, boundary or GC) | 72.71 % |
| (kernel wasm) self | 19.13 % |
| (wasm boundary) self (js-to-wasm / wasm-to-js adapters) | 0.00 % |
| GC share (`(garbage collector)` self) | 8.16 % |
| GC pauses (counted pass, `PerformanceObserver`) | 19 pauses, 29.3 ms, 4.69 % of CPU |
| Kernel crossings per plan | 227,503 (9 ladder kernels) |
| Allocated per plan (sampled every 8 KiB, collected kept) | 253.9 MiB |
| Allocation rate (per profiled planner second) | 501 MiB/s |

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
| 1 | `evaluateVector` (engine/plan.ts) | 18.2 | 3.60 % | 96.0 | 18.93 % | 12.41 % |
| 2 | `build` (engine/retype.ts) | 12.9 | 2.54 % | 77.9 | 15.36 % | 15.36 % |
| 3 | `scorer` (engine/plan.ts) | 6.3 | 1.25 % | 75.9 | 14.97 % | 8.29 % |
| 4 | `finaleFor` (engine/plan.ts) | 6.3 | 1.24 % | 21.6 | 4.26 % | 2.07 % |
| 5 | `sizer` (engine/plan.ts) | 5.2 | 1.02 % | 25.2 | 4.97 % | 2.56 % |
| 6 | `sizedShape` (engine/plan.ts) | 4.1 | 0.80 % | 20.0 | 3.94 % | 1.53 % |
| 7 | `sizeStacks` (kernel/plan.ts) | 2.6 | 0.51 % | 15.2 | 2.99 % | 0.58 % |
| 8 | `gridOnKernel` (engine/plan.ts) | 1.7 | 0.34 % | 26.8 | 5.29 % | 2.32 % |
| 9 | `finish` (engine/plan.ts) | 1.5 | 0.29 % | 23.2 | 4.57 % | 2.38 % |
| 10 | `countsKey` (engine/plan.ts) | 0.5 | 0.09 % | 0.8 | 0.17 % | 0.17 % |
| 11 | `sizedCounts` (engine/plan.ts) | 0.4 | 0.08 % | 15.7 | 3.10 % | 0.68 % |
| 12 | `prefixFielded` (engine/plan.ts) | 0.2 | 0.04 % | 0.4 | 0.07 % | 0.07 % |
| 13 | `retypeRow` (engine/plan.ts) | 0.1 | 0.01 % | 188.2 | 37.12 % | 29.42 % |
| 14 | `copyStacks` (engine/plan.ts) | 0.0 | 0.01 % | 0.1 | 0.01 % | 0.01 % |
| — | `sizeStacks` (engine/stacker.ts) | not sampled (inlined or never called) | — | — | — | — |

### Top 40 frames by self time

| Frame | Self ms/plan | Self | Inclusive |
|---|---:|---:|---:|
| `(kernel wasm)` | 97.0 | 19.13 % | 19.13 % |
| `(anonymous) engine/retype.ts@76` | 65.0 | 12.82 % | 12.82 % |
| `consider engine/retype.ts` | 58.2 | 11.48 % | 46.53 % |
| `walk engine/retype.ts` | 55.9 | 11.02 % | 60.49 % |
| `(garbage collector)` | 41.4 | 8.16 % | 8.16 % |
| `marchBill kernel/plan.ts` | 22.4 | 4.41 % | 17.05 % |
| `evaluateVector engine/plan.ts` | 18.2 | 3.60 % | 18.93 % |
| `outOfTime engine/retype.ts` | 14.7 | 2.91 % | 2.91 % |
| `build engine/retype.ts` | 12.9 | 2.54 % | 15.36 % |
| `marchBill engine/retype.ts` | 10.9 | 2.15 % | 19.38 % |
| `planCampaign engine/plan.ts` | 6.5 | 1.29 % | 91.52 % |
| `scorer engine/plan.ts` | 6.3 | 1.25 % | 14.97 % |
| `finaleFor engine/plan.ts` | 6.3 | 1.24 % | 4.26 % |
| `sizer engine/plan.ts` | 5.2 | 1.02 % | 4.97 % |
| `sizedShape engine/plan.ts` | 4.1 | 0.80 % | 3.94 % |
| `shapeOf engine/plan.ts` | 3.8 | 0.75 % | 2.46 % |
| `get buffer` | 3.0 | 0.60 % | 0.60 % |
| `sizeStacks kernel/plan.ts` | 2.6 | 0.51 % | 2.99 % |
| `packRequest kernel/pack.ts` | 1.9 | 0.38 % | 0.80 % |
| `(anonymous) engine/fast.ts@14` | 1.9 | 0.38 % | 0.38 % |
| `retypeMarch engine/retype.ts` | 1.9 | 0.37 % | 63.91 % |
| `march kernel/plan.ts` | 1.8 | 0.36 % | 1.56 % |
| `priceMarch engine/plan.ts` | 1.8 | 0.36 % | 0.45 % |
| `retypeOne engine/plan.ts` | 1.8 | 0.35 % | 64.33 % |
| `laddersNow engine/plan.ts` | 1.8 | 0.35 % | 0.43 % |
| `billedOf engine/plan.ts` | 1.8 | 0.35 % | 0.65 % |
| `gridOnKernel engine/plan.ts` | 1.7 | 0.34 % | 5.29 % |
| `rate engine/rating.ts` | 1.7 | 0.34 % | 0.34 % |
| `(anonymous) engine/plan.ts@3304` | 1.7 | 0.33 % | 0.41 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 1.5 | 0.29 % | 91.81 % |
| `finish engine/plan.ts` | 1.5 | 0.29 % | 4.57 % |
| `strongest engine/plan.ts` | 1.3 | 0.25 % | 0.93 % |
| `(anonymous) kernel/plan.ts@249` | 1.2 | 0.24 % | 0.24 % |
| `figuresOf engine/plan.ts` | 1.2 | 0.24 % | 0.87 % |
| `(anonymous) kernel/layout.ts@5` | 1.2 | 0.24 % | 0.24 % |
| `tighterShape engine/plan.ts` | 1.2 | 0.23 % | 0.83 % |
| `marchResult engine/plan.ts` | 1.2 | 0.23 % | 1.91 % |
| `summarise engine/plan.ts` | 1.2 | 0.23 % | 0.60 % |
| `ratioOf engine/plan.ts` | 1.1 | 0.21 % | 0.46 % |
| `lay kernel/plan.ts` | 1.1 | 0.21 % | 0.28 % |

### Top 30 frames by inclusive time

| Frame | Inclusive ms/plan | Inclusive | Self |
|---|---:|---:|---:|
| `(root)` | 507.0 | 100.00 % | 0.00 % |
| `runFixture theorycraft/197-the-planner-on-the-owner.test.ts` | 465.7 | 91.84 % | 0.02 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 465.5 | 91.81 % | 0.29 % |
| `planCampaign engine/plan.ts` | 464.0 | 91.52 % | 1.29 % |
| `retypeOne engine/plan.ts` | 326.2 | 64.33 % | 0.35 % |
| `retypeMarch engine/retype.ts` | 324.1 | 63.91 % | 0.37 % |
| `walk engine/retype.ts` | 306.7 | 60.49 % | 11.02 % |
| `consider engine/retype.ts` | 235.9 | 46.53 % | 11.48 % |
| `retypeRow engine/plan.ts` | 188.2 | 37.12 % | 0.01 % |
| `retypeRowNow engine/plan.ts` | 188.1 | 37.09 % | 0.06 % |
| `(anonymous) engine/plan.ts@5273` | 187.2 | 36.92 % | 0.01 % |
| `ownLadderCandidates engine/plan.ts` | 139.2 | 27.46 % | 0.04 % |
| `marchBill engine/retype.ts` | 98.3 | 19.38 % | 2.15 % |
| `(kernel wasm)` | 97.0 | 19.13 % | 19.13 % |
| `evaluateVector engine/plan.ts` | 96.0 | 18.93 % | 3.60 % |
| `marchBill kernel/plan.ts` | 86.5 | 17.05 % | 4.41 % |
| `build engine/retype.ts` | 77.9 | 15.36 % | 2.54 % |
| `scorer engine/plan.ts` | 75.9 | 14.97 % | 1.25 % |
| `(anonymous) engine/retype.ts@76` | 65.0 | 12.82 % | 12.82 % |
| `(garbage collector)` | 41.4 | 8.16 % | 8.16 % |
| `gridOnKernel engine/plan.ts` | 26.8 | 5.29 % | 0.34 % |
| `sizer engine/plan.ts` | 25.2 | 4.97 % | 1.02 % |
| `finish engine/plan.ts` | 23.2 | 4.57 % | 0.29 % |
| `finaleFor engine/plan.ts` | 21.6 | 4.26 % | 1.24 % |
| `sizedShape engine/plan.ts` | 20.0 | 3.94 % | 0.80 % |
| `sizedCounts engine/plan.ts` | 15.7 | 3.10 % | 0.08 % |
| `sizeStacks kernel/plan.ts` | 15.2 | 2.99 % | 0.51 % |
| `outOfTime engine/retype.ts` | 14.7 | 2.91 % | 2.91 % |
| `shapeOf engine/plan.ts` | 12.5 | 2.46 % | 0.75 % |
| `grid kernel/plan.ts` | 11.3 | 2.23 % | 0.09 % |

### Top 25 allocating frames (sampled bytes, one plan)

| Frame | MiB | Share |
|---|---:|---:|
| `walk engine/retype.ts` | 56.22 | 22.14 % |
| `shapeOf engine/plan.ts` | 27.56 | 10.86 % |
| `marchBill kernel/plan.ts` | 20.24 | 7.97 % |
| `join` | 12.21 | 4.81 % |
| `add` | 12.20 | 4.80 % |
| `finaleFor engine/plan.ts` | 11.99 | 4.72 % |
| `scorer engine/plan.ts` | 11.94 | 4.70 % |
| `set` | 11.89 | 4.68 % |
| `sizedShape engine/plan.ts` | 10.52 | 4.14 % |
| `evaluateVector engine/plan.ts` | 8.92 | 3.51 % |
| `next` | 7.92 | 3.12 % |
| `ratioOf engine/plan.ts` | 5.57 | 2.20 % |
| `delete` | 3.60 | 1.42 % |
| `sizeStacks kernel/plan.ts` | 3.35 | 1.32 % |
| `copyStacks engine/plan.ts` | 2.71 | 1.07 % |
| `finaleOnKernel engine/plan.ts` | 2.44 | 0.96 % |
| `rate engine/rating.ts` | 2.27 | 0.89 % |
| `sort` | 2.17 | 0.86 % |
| `tighterShape engine/plan.ts` | 1.99 | 0.79 % |
| `figuresOf engine/plan.ts` | 1.85 | 0.73 % |
| `marchOf engine/plan.ts` | 1.77 | 0.70 % |
| `build engine/retype.ts` | 1.73 | 0.68 % |
| `march kernel/plan.ts` | 1.70 | 0.67 % |
| `Set` | 1.54 | 0.61 % |
| `sizer engine/plan.ts` | 1.41 | 0.56 % |
