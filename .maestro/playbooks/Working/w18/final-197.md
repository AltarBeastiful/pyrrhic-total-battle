# 197 — the planner on the owner

W18 Drill 05 (`docs/plans/profile-drilldown.md` §0.2). Run 2026-10-11, node v22.22.1: `planCampaign` alone, in-process, under the probes' settings (no clock), release kernel. One warm-up plan, one counted plan (kernel doors wrapped, GC observed), 5 plans under the CPU profiler (100 µs), one plan under the sampling heap profiler. Shares are of the profiled planner samples (idle and the inspector's own frames excluded; the GC the plans cause included). Inclusive time counts a frame once per sample.


## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

| Figure | Value |
|---|---|
| CPU per plan (counted pass, process) | 1,239 ms |
| Wall per plan (counted pass) | 670 ms |
| Profiled planner time per plan (5 plans at 100 µs, inspector frames out) | 461.3 ms |
| `planCampaign` inclusive | 87.63 % |
| JavaScript self (not wasm, boundary or GC) | 54.96 % |
| (kernel wasm) self | 33.20 % |
| (wasm boundary) self (js-to-wasm / wasm-to-js adapters) | 0.00 % |
| GC share (`(garbage collector)` self) | 11.84 % |
| GC pauses (counted pass, `PerformanceObserver`) | 27 pauses, 58.9 ms, 4.75 % of CPU |
| Kernel crossings per plan | 363,814 (5 ladder kernels) |
| Allocated per plan (sampled every 8 KiB, collected kept) | 314.1 MiB |
| Allocation rate (per profiled planner second) | 681 MiB/s |

### Kernel crossings per plan, by door

`ladder.gridView` is a JavaScript read of views over the wasm memory (`ladderViews` rebuilds them only after the memory grew): it enters no wasm. Every other door is one JS → wasm call.

| Door | Calls | Share |
|---|---:|---:|
| `ladder.gridView` | 295,170 | 81.13 % |
| `march` | 22,900 | 6.29 % |
| `bill` | 20,310 | 5.58 % |
| `sizerShape` | 12,031 | 3.31 % |
| `marchBill` | 5,560 | 1.53 % |
| `ladder.grid` | 3,650 | 1.00 % |
| `ladder.finale` | 3,200 | 0.88 % |
| `ladder.shape` | 898 | 0.25 % |
| `bindTable` | 76 | 0.02 % |
| `sizeStacks` | 14 | 0.00 % |
| `ladders` | 5 | 0.00 % |

### Drill 05's candidates, ranked by measured self time

| Rank | Function | Self ms/plan | Self | Inclusive ms/plan | Inclusive | JS under it (inclusive less wasm and GC leaves) |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `evaluateVector` (engine/plan.ts) | 38.1 | 8.26 % | 281.8 | 61.09 % | 31.09 % |
| 2 | `scorer` (engine/plan.ts) | 20.9 | 4.54 % | 234.6 | 50.86 % | 20.86 % |
| 3 | `sizer` (engine/plan.ts) | 14.3 | 3.10 % | 116.5 | 25.25 % | 6.03 % |
| 4 | `finaleFor` (engine/plan.ts) | 10.6 | 2.29 % | 33.4 | 7.24 % | 3.82 % |
| 5 | `countsKey` (engine/plan.ts) | 3.3 | 0.71 % | 4.1 | 0.89 % | 0.89 % |
| 6 | `gridOnKernel` (engine/plan.ts) | 2.8 | 0.62 % | 54.6 | 11.83 % | 4.48 % |
| 7 | `finish` (engine/plan.ts) | 2.5 | 0.54 % | 36.0 | 7.81 % | 4.39 % |
| 8 | `build` (engine/retype.ts) | 0.4 | 0.08 % | 1.2 | 0.27 % | 0.27 % |
| 9 | `sizedShape` (engine/plan.ts) | 0.3 | 0.07 % | 101.0 | 21.89 % | 2.67 % |
| 10 | `prefixFielded` (engine/plan.ts) | 0.2 | 0.04 % | 0.7 | 0.16 % | 0.16 % |
| 11 | `retypeRow` (engine/plan.ts) | 0.1 | 0.03 % | 34.4 | 7.47 % | 6.11 % |
| 12 | `sizeStacks` (kernel/plan.ts) | 0.1 | 0.01 % | 0.1 | 0.02 % | 0.01 % |
| 13 | `sizedCounts` (engine/plan.ts) | 0.0 | 0.01 % | 0.1 | 0.03 % | 0.02 % |
| 14 | `copyStacks` (engine/plan.ts) | 0.0 | 0.01 % | 0.1 | 0.03 % | 0.03 % |
| — | `sizeStacks` (engine/stacker.ts) | not sampled (inlined or never called) | — | — | — | — |

### Top 40 frames by self time

| Frame | Self ms/plan | Self | Inclusive |
|---|---:|---:|---:|
| `(kernel wasm)` | 153.2 | 33.20 % | 33.20 % |
| `(garbage collector)` | 54.6 | 11.84 % | 11.84 % |
| `evaluateVector engine/plan.ts` | 38.1 | 8.26 % | 61.09 % |
| `scorer engine/plan.ts` | 20.9 | 4.54 % | 50.86 % |
| `retypeMarch engine/retype.ts` | 15.5 | 3.37 % | 8.42 % |
| `sizer engine/plan.ts` | 14.3 | 3.10 % | 25.25 % |
| `planCampaign engine/plan.ts` | 13.0 | 2.82 % | 87.63 % |
| `sizerShape kernel/plan.ts` | 11.5 | 2.49 % | 21.83 % |
| `finaleFor engine/plan.ts` | 10.6 | 2.29 % | 7.24 % |
| `shapeOf engine/plan.ts` | 6.0 | 1.30 % | 3.63 % |
| `undominatedRows engine/plan.ts` | 5.7 | 1.24 % | 1.29 % |
| `march kernel/plan.ts` | 5.1 | 1.11 % | 5.67 % |
| `record engine/plan.ts` | 4.8 | 1.04 % | 2.41 % |
| `priceMarch engine/plan.ts` | 4.8 | 1.04 % | 1.16 % |
| `figuresOf engine/plan.ts` | 4.1 | 0.88 % | 2.29 % |
| `bill kernel/plan.ts` | 4.0 | 0.86 % | 2.11 % |
| `lay kernel/plan.ts` | 3.6 | 0.78 % | 1.02 % |
| `marchBill kernel/plan.ts` | 3.5 | 0.75 % | 2.33 % |
| `laddersNow engine/plan.ts` | 3.4 | 0.74 % | 0.93 % |
| `countsKey engine/plan.ts` | 3.3 | 0.71 % | 0.89 % |
| `summarise engine/plan.ts` | 3.2 | 0.70 % | 1.90 % |
| `billedOf engine/plan.ts` | 2.9 | 0.63 % | 1.57 % |
| `gridOnKernel engine/plan.ts` | 2.8 | 0.62 % | 11.83 % |
| `finish engine/plan.ts` | 2.5 | 0.54 % | 7.81 % |
| `walk engine/retype.ts` | 2.4 | 0.51 % | 1.11 % |
| `jsonOf engine/plan.ts` | 2.3 | 0.51 % | 0.51 % |
| `strongest engine/plan.ts` | 2.1 | 0.47 % | 1.46 % |
| `ladderViews kernel/plan.ts` | 2.1 | 0.46 % | 0.46 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 2.1 | 0.45 % | 88.11 % |
| `where engine/plan.ts` | 1.8 | 0.40 % | 0.40 % |
| `tighterShape engine/plan.ts` | 1.8 | 0.38 % | 1.17 % |
| `marchOf engine/plan.ts` | 1.7 | 0.36 % | 6.04 % |
| `(anonymous) engine/plan.ts@3314` | 1.5 | 0.33 % | 0.45 % |
| `(anonymous) engine/fast.ts@14` | 1.5 | 0.32 % | 0.32 % |
| `restoreFinale engine/plan.ts` | 1.5 | 0.32 % | 0.32 % |
| `grid kernel/plan.ts` | 1.4 | 0.31 % | 6.76 % |
| `gridView kernel/plan.ts` | 1.4 | 0.30 % | 0.69 % |
| `scoreOwnLadder engine/plan.ts` | 1.3 | 0.29 % | 0.41 % |
| `marchRecovery engine/plan.ts` | 1.3 | 0.29 % | 2.43 % |
| `fitsHousing engine/plan.ts` | 1.3 | 0.29 % | 0.29 % |

### Top 30 frames by inclusive time

| Frame | Inclusive ms/plan | Inclusive | Self |
|---|---:|---:|---:|
| `(root)` | 461.3 | 100.00 % | 0.00 % |
| `runFixture theorycraft/197-the-planner-on-the-owner.test.ts` | 406.7 | 88.16 % | 0.00 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 406.5 | 88.11 % | 0.45 % |
| `planCampaign engine/plan.ts` | 404.2 | 87.63 % | 2.82 % |
| `evaluateVector engine/plan.ts` | 281.8 | 61.09 % | 8.26 % |
| `scorer engine/plan.ts` | 234.6 | 50.86 % | 4.54 % |
| `(kernel wasm)` | 153.2 | 33.20 % | 33.20 % |
| `sizer engine/plan.ts` | 116.5 | 25.25 % | 3.10 % |
| `sizedShape engine/plan.ts` | 101.0 | 21.89 % | 0.07 % |
| `sizerShape kernel/plan.ts` | 100.7 | 21.83 % | 2.49 % |
| `(garbage collector)` | 54.6 | 11.84 % | 11.84 % |
| `gridOnKernel engine/plan.ts` | 54.6 | 11.83 % | 0.62 % |
| `retypeOne engine/plan.ts` | 40.2 | 8.70 % | 0.24 % |
| `retypeMarch engine/retype.ts` | 38.8 | 8.42 % | 3.37 % |
| `finish engine/plan.ts` | 36.0 | 7.81 % | 0.54 % |
| `retypeRow engine/plan.ts` | 34.4 | 7.47 % | 0.03 % |
| `retypeRowNow engine/plan.ts` | 34.2 | 7.42 % | 0.01 % |
| `(anonymous) engine/plan.ts@5283` | 33.7 | 7.30 % | 0.02 % |
| `finaleFor engine/plan.ts` | 33.4 | 7.24 % | 2.29 % |
| `grid kernel/plan.ts` | 31.2 | 6.76 % | 0.31 % |
| `marchOf engine/plan.ts` | 27.9 | 6.04 % | 0.36 % |
| `march kernel/plan.ts` | 26.2 | 5.67 % | 1.11 % |
| `shapeOf engine/plan.ts` | 16.8 | 3.63 % | 1.30 % |
| `sweep engine/plan.ts` | 16.5 | 3.59 % | 0.06 % |
| `walkDown engine/plan.ts` | 11.7 | 2.55 % | 0.06 % |
| `marchRecovery engine/plan.ts` | 11.2 | 2.43 % | 0.29 % |
| `record engine/plan.ts` | 11.1 | 2.41 % | 1.04 % |
| `marchBill kernel/plan.ts` | 10.8 | 2.33 % | 0.75 % |
| `figuresOf engine/plan.ts` | 10.5 | 2.29 % | 0.88 % |
| `bill kernel/plan.ts` | 9.7 | 2.11 % | 0.86 % |

### Top 25 allocating frames (sampled bytes, one plan)

| Frame | MiB | Share |
|---|---:|---:|
| `shapeOf engine/plan.ts` | 45.91 | 14.62 % |
| `scorer engine/plan.ts` | 44.85 | 14.28 % |
| `finaleFor engine/plan.ts` | 26.27 | 8.36 % |
| `evaluateVector engine/plan.ts` | 22.91 | 7.30 % |
| `sizer engine/plan.ts` | 22.40 | 7.13 % |
| `next` | 20.60 | 6.56 % |
| `record engine/plan.ts` | 14.96 | 4.76 % |
| `sizerShape kernel/plan.ts` | 14.14 | 4.50 % |
| `(anonymous) engine/plan.ts@1103` | 6.28 | 2.00 % |
| `figuresOf engine/plan.ts` | 6.18 | 1.97 % |
| `climb engine/retype.ts` | 5.53 | 1.76 % |
| `(anonymous) engine/plan.ts@1123` | 5.02 | 1.60 % |
| `priceMarch engine/plan.ts` | 4.84 | 1.54 % |
| `march kernel/plan.ts` | 3.91 | 1.25 % |
| `replayed engine/plan.ts` | 3.85 | 1.23 % |
| `join` | 3.84 | 1.22 % |
| `countsKey engine/plan.ts` | 3.66 | 1.17 % |
| `marchOf engine/plan.ts` | 3.44 | 1.10 % |
| `sort` | 3.22 | 1.02 % |
| `consider engine/plan.ts` | 3.06 | 0.97 % |
| `set` | 2.92 | 0.93 % |
| `walk engine/retype.ts` | 2.82 | 0.90 % |
| `finish engine/plan.ts` | 2.74 | 0.87 % |
| `shelterUnder engine/plan.ts` | 2.68 | 0.85 % |
| `bill kernel/plan.ts` | 2.49 | 0.79 % |

## Exactness fixture (owner export 2026-09-17)

| Figure | Value |
|---|---|
| CPU per plan (counted pass, process) | 753 ms |
| Wall per plan (counted pass) | 493 ms |
| Profiled planner time per plan (5 plans at 100 µs, inspector frames out) | 417.0 ms |
| `planCampaign` inclusive | 92.29 % |
| JavaScript self (not wasm, boundary or GC) | 71.12 % |
| (kernel wasm) self | 21.55 % |
| (wasm boundary) self (js-to-wasm / wasm-to-js adapters) | 0.00 % |
| GC share (`(garbage collector)` self) | 7.33 % |
| GC pauses (counted pass, `PerformanceObserver`) | 19 pauses, 32.4 ms, 4.30 % of CPU |
| Kernel crossings per plan | 227,503 (9 ladder kernels) |
| Allocated per plan (sampled every 8 KiB, collected kept) | 243.7 MiB |
| Allocation rate (per profiled planner second) | 584 MiB/s |

### Kernel crossings per plan, by door

`ladder.gridView` is a JavaScript read of views over the wasm memory (`ladderViews` rebuilds them only after the memory grew): it enters no wasm. Every other door is one JS → wasm call.

| Door | Calls | Share |
|---|---:|---:|
| `ladder.gridView` | 106,683 | 46.89 % |
| `marchBill` | 90,699 | 39.87 % |
| `march` | 11,489 | 5.05 % |
| `bill` | 7,880 | 3.46 % |
| `sizerShape` | 4,842 | 2.13 % |
| `ladder.shape` | 2,276 | 1.00 % |
| `ladder.finale` | 2,094 | 0.92 % |
| `ladder.grid` | 1,323 | 0.58 % |
| `bindTable` | 203 | 0.09 % |
| `ladders` | 9 | 0.00 % |
| `sizeStacks` | 5 | 0.00 % |

### Drill 05's candidates, ranked by measured self time

| Rank | Function | Self ms/plan | Self | Inclusive ms/plan | Inclusive | JS under it (inclusive less wasm and GC leaves) |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `evaluateVector` (engine/plan.ts) | 12.6 | 3.03 % | 78.3 | 18.77 % | 11.39 % |
| 2 | `scorer` (engine/plan.ts) | 6.8 | 1.63 % | 65.1 | 15.62 % | 8.15 % |
| 3 | `finaleFor` (engine/plan.ts) | 4.6 | 1.09 % | 20.5 | 4.91 % | 2.20 % |
| 4 | `sizer` (engine/plan.ts) | 3.8 | 0.92 % | 19.3 | 4.64 % | 1.70 % |
| 5 | `gridOnKernel` (engine/plan.ts) | 1.6 | 0.40 % | 24.7 | 5.92 % | 2.69 % |
| 6 | `finish` (engine/plan.ts) | 0.9 | 0.22 % | 21.4 | 5.14 % | 2.43 % |
| 7 | `countsKey` (engine/plan.ts) | 0.3 | 0.08 % | 0.5 | 0.13 % | 0.13 % |
| 8 | `retypeRow` (engine/plan.ts) | 0.1 | 0.03 % | 158.3 | 37.97 % | 28.87 % |
| 9 | `build` (engine/retype.ts) | 0.1 | 0.02 % | 0.1 | 0.02 % | 0.02 % |
| 10 | `prefixFielded` (engine/plan.ts) | 0.0 | 0.01 % | 0.1 | 0.02 % | 0.02 % |
| 11 | `sizedCounts` (engine/plan.ts) | 0.0 | 0.01 % | 0.1 | 0.02 % | 0.01 % |
| 12 | `sizedShape` (engine/plan.ts) | 0.0 | 0.01 % | 14.7 | 3.52 % | 0.58 % |
| 13 | `sizeStacks` (kernel/plan.ts) | 0.0 | 0.00 % | 0.0 | 0.01 % | 0.00 % |
| — | `sizeStacks` (engine/stacker.ts) | not sampled (inlined or never called) | — | — | — | — |
| — | `copyStacks` (engine/plan.ts) | not sampled (inlined or never called) | — | — | — | — |

### Top 40 frames by self time

| Frame | Self ms/plan | Self | Inclusive |
|---|---:|---:|---:|
| `retypeMarch engine/retype.ts` | 180.5 | 43.27 % | 66.54 % |
| `(kernel wasm)` | 89.9 | 21.55 % | 21.55 % |
| `(garbage collector)` | 30.6 | 7.33 % | 7.33 % |
| `marchBill kernel/plan.ts` | 21.9 | 5.24 % | 19.78 % |
| `evaluateVector engine/plan.ts` | 12.6 | 3.03 % | 18.77 % |
| `scorer engine/plan.ts` | 6.8 | 1.63 % | 15.62 % |
| `finaleFor engine/plan.ts` | 4.6 | 1.09 % | 4.91 % |
| `sizer engine/plan.ts` | 3.8 | 0.92 % | 4.64 % |
| `shapeOf engine/plan.ts` | 3.7 | 0.90 % | 2.91 % |
| `planCampaign engine/plan.ts` | 3.2 | 0.77 % | 92.29 % |
| `get buffer` | 2.9 | 0.70 % | 0.70 % |
| `sizerShape kernel/plan.ts` | 2.2 | 0.53 % | 3.49 % |
| `packRequest kernel/pack.ts` | 2.0 | 0.47 % | 0.65 % |
| `retypeOne engine/plan.ts` | 1.9 | 0.45 % | 67.01 % |
| `effectiveTable engine/plan.ts` | 1.7 | 0.41 % | 1.86 % |
| `gridOnKernel engine/plan.ts` | 1.6 | 0.40 % | 5.92 % |
| `march kernel/plan.ts` | 1.6 | 0.37 % | 1.56 % |
| `eliteOrder engine/killOrder.ts` | 1.5 | 0.37 % | 0.37 % |
| `(anonymous) engine/plan.ts@3314` | 1.5 | 0.36 % | 0.37 % |
| `rate engine/rating.ts` | 1.4 | 0.35 % | 0.35 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 1.4 | 0.33 % | 92.63 % |
| `bindTable kernel/plan.ts` | 1.3 | 0.32 % | 1.11 % |
| `laddersNow engine/plan.ts` | 1.2 | 0.29 % | 0.36 % |
| `(anonymous) kernel/layout.ts@5` | 1.2 | 0.29 % | 0.29 % |
| `figuresOf engine/plan.ts` | 1.2 | 0.28 % | 0.81 % |
| `priceMarch engine/plan.ts` | 1.2 | 0.28 % | 0.34 % |
| `summarise engine/plan.ts` | 1.1 | 0.27 % | 0.57 % |
| `strongest engine/plan.ts` | 1.1 | 0.26 % | 0.80 % |
| `bill kernel/plan.ts` | 1.1 | 0.26 % | 0.47 % |
| `undominatedRows engine/plan.ts` | 1.0 | 0.25 % | 0.25 % |
| `billedOf engine/plan.ts` | 0.9 | 0.22 % | 0.55 % |
| `finish engine/plan.ts` | 0.9 | 0.22 % | 5.14 % |
| `ladderViews kernel/plan.ts` | 0.9 | 0.21 % | 0.21 % |
| `marchResult engine/plan.ts` | 0.8 | 0.20 % | 1.78 % |
| `marchOf engine/plan.ts` | 0.8 | 0.20 % | 1.79 % |
| `tighterShape engine/plan.ts` | 0.8 | 0.19 % | 0.61 % |
| `sizerSame engine/plan.ts` | 0.8 | 0.19 % | 0.19 % |
| `(anonymous) engine/fast.ts@14` | 0.8 | 0.18 % | 0.18 % |
| `lay kernel/plan.ts` | 0.7 | 0.18 % | 0.28 % |
| `marchOfTs engine/plan.ts` | 0.7 | 0.17 % | 0.29 % |

### Top 30 frames by inclusive time

| Frame | Inclusive ms/plan | Inclusive | Self |
|---|---:|---:|---:|
| `(root)` | 417.0 | 100.00 % | 0.00 % |
| `runFixture theorycraft/197-the-planner-on-the-owner.test.ts` | 386.4 | 92.66 % | 0.00 % |
| `answerOf theorycraft/197-the-planner-on-the-owner.test.ts` | 386.3 | 92.63 % | 0.33 % |
| `planCampaign engine/plan.ts` | 384.9 | 92.29 % | 0.77 % |
| `retypeOne engine/plan.ts` | 279.5 | 67.01 % | 0.45 % |
| `retypeMarch engine/retype.ts` | 277.5 | 66.54 % | 43.27 % |
| `retypeRow engine/plan.ts` | 158.3 | 37.97 % | 0.03 % |
| `retypeRowNow engine/plan.ts` | 158.2 | 37.94 % | 0.07 % |
| `(anonymous) engine/plan.ts@5283` | 157.4 | 37.73 % | 0.02 % |
| `ownLadderCandidates engine/plan.ts` | 122.2 | 29.30 % | 0.01 % |
| `(kernel wasm)` | 89.9 | 21.55 % | 21.55 % |
| `marchBill kernel/plan.ts` | 82.5 | 19.78 % | 5.24 % |
| `evaluateVector engine/plan.ts` | 78.3 | 18.77 % | 3.03 % |
| `scorer engine/plan.ts` | 65.1 | 15.62 % | 1.63 % |
| `(garbage collector)` | 30.6 | 7.33 % | 7.33 % |
| `gridOnKernel engine/plan.ts` | 24.7 | 5.92 % | 0.40 % |
| `finish engine/plan.ts` | 21.4 | 5.14 % | 0.22 % |
| `finaleFor engine/plan.ts` | 20.5 | 4.91 % | 1.09 % |
| `sizer engine/plan.ts` | 19.3 | 4.64 % | 0.92 % |
| `sizedShape engine/plan.ts` | 14.7 | 3.52 % | 0.01 % |
| `sizerShape kernel/plan.ts` | 14.6 | 3.49 % | 0.53 % |
| `shapeOf engine/plan.ts` | 12.2 | 2.91 % | 0.90 % |
| `grid kernel/plan.ts` | 9.7 | 2.33 % | 0.12 % |
| `finaleOnKernel engine/plan.ts` | 8.3 | 1.99 % | 0.16 % |
| `effectiveTable engine/plan.ts` | 7.7 | 1.86 % | 0.41 % |
| `finale kernel/plan.ts` | 7.6 | 1.83 % | 0.12 % |
| `marchOf engine/plan.ts` | 7.5 | 1.79 % | 0.20 % |
| `marchResult engine/plan.ts` | 7.4 | 1.78 % | 0.20 % |
| `march kernel/plan.ts` | 6.5 | 1.56 % | 0.37 % |
| `sweep engine/plan.ts` | 6.4 | 1.53 % | 0.10 % |

### Top 25 allocating frames (sampled bytes, one plan)

| Frame | MiB | Share |
|---|---:|---:|
| `walk engine/retype.ts` | 56.39 | 23.14 % |
| `shapeOf engine/plan.ts` | 28.26 | 11.60 % |
| `marchBill kernel/plan.ts` | 20.87 | 8.56 % |
| `join` | 12.86 | 5.28 % |
| `finaleFor engine/plan.ts` | 12.40 | 5.09 % |
| `scorer engine/plan.ts` | 12.34 | 5.06 % |
| `add` | 12.13 | 4.98 % |
| `set` | 11.99 | 4.92 % |
| `evaluateVector engine/plan.ts` | 8.36 | 3.43 % |
| `next` | 7.88 | 3.23 % |
| `sizer engine/plan.ts` | 5.25 | 2.15 % |
| `ratioOf engine/plan.ts` | 5.09 | 2.09 % |
| `sizerShape kernel/plan.ts` | 3.76 | 1.54 % |
| `delete` | 3.48 | 1.43 % |
| `finaleOnKernel engine/plan.ts` | 2.44 | 1.00 % |
| `sort` | 2.25 | 0.92 % |
| `tighterShape engine/plan.ts` | 2.24 | 0.92 % |
| `rate engine/rating.ts` | 2.04 | 0.84 % |
| `figuresOf engine/plan.ts` | 1.96 | 0.81 % |
| `marchOf engine/plan.ts` | 1.72 | 0.71 % |
| `march kernel/plan.ts` | 1.67 | 0.68 % |
| `build engine/retype.ts` | 1.48 | 0.61 % |
| `ladderOnKernel engine/plan.ts` | 1.27 | 0.52 % |
| `consider engine/plan.ts` | 1.26 | 0.52 % |
| `priceMarch engine/plan.ts` | 1.10 | 0.45 % |
