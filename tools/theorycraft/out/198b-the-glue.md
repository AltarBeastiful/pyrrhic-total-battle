# 198b — the glue of each kernel door

W18 Drill 04b, P3.0 (`docs/plans/profile-drilldown.md` §3), the timing half of [[198-the-boundary]]. Run 2026-10-11, node v22.22.1: `planCampaign` alone, in-process, under the probes' settings (no clock). A fresh plan kernel over the release module, its exports and doors timed with `performance.now()` by the test (`src/` untouched), planned once cold (untimed) then 7 times warm, each timed plan interleaved with an untimed plan on the release kernel. Every timed answer equals the release kernel's.


## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 7, release kernel) | 397.9 ms |
| … min / max | 386.4 / 461.7 ms |
| Planner wall per plan, timed (median of 7) | 615.2 ms |
| Timer cost, calibrated: inside an empty door's timer / a timed raw call seen from its door / seen by its own timer | 54 / 198 / 41 ns |
| All doors, wrapper time per plan, uncorrected | 202.8 ms (50.96 %) |
| All doors, wrapper time per plan, corrected | 169.7 ms (42.64 %) |
| … inside wasm | 137.5 ms (34.55 %) |
| … **glue** (wrapper minus wasm) | **32.2 ms (8.09 %)** |
| … glue upper bound (no timer correction on the doors' side) | 65.3 ms (16.41 %) |

Per plan. "Wrapper" is the door's own time exclusive of doors it opens, corrected for the timers; "wasm" is the raw calls inside it; "glue" is the difference. Shares are of the untimed planner wall. The upper bound takes no timer cost off: wrapper minus wasm as the timers read them.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound | Glue share of the door |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `sizeStacks` | 12,045 | 12,045 | 89.81 | 79.39 | 10.42 | 865 ns | 2.62 % | 3.26 % | 11.61 % |
| `march` | 22,900 | 22,900 | 23.82 | 17.13 | 6.69 | 292 ns | 1.68 % | 2.89 % | 28.08 % |
| `bill` | 20,310 | 20,310 | 8.16 | 3.73 | 4.43 | 218 ns | 1.11 % | 2.19 % | 54.25 % |
| `marchBill` | 5,560 | 5,560 | 10.27 | 6.25 | 4.02 | 723 ns | 1.01 % | 1.30 % | 39.13 % |
| `bindTable` | 76 | 0 | 2.31 | 0.00 | 2.31 | 30,380 ns | 0.58 % | 0.58 % | 100.00 % |
| `ladder.finale` | 3,200 | 3,200 | 7.20 | 5.04 | 2.16 | 676 ns | 0.54 % | 0.71 % | 30.06 % |
| `ladder.grid` | 3,650 | 3,650 | 27.34 | 25.56 | 1.78 | 487 ns | 0.45 % | 0.64 % | 6.50 % |
| `ladder.shape` | 898 | 898 | 0.64 | 0.38 | 0.27 | 297 ns | 0.07 % | 0.11 % | 41.41 % |
| `ladder.gridView` | 295,170 | 0 | 0.08 | 0.00 | 0.08 | 0 ns | 0.02 % | 4.00 % | 100.00 % |
| `ladders` | 5 | 0 | 0.05 | 0.00 | 0.05 | 9,984 ns | 0.01 % | 0.01 % | 100.00 % |
| **total** | | | **169.68** | **137.48** | **32.20** | | **8.09 %** | **16.41 %** | **18.98 %** |

## Exactness fixture (owner export 2026-09-17)

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 7, release kernel) | 375.4 ms |
| … min / max | 359.3 / 396.2 ms |
| Planner wall per plan, timed (median of 7) | 499.2 ms |
| Timer cost, calibrated: inside an empty door's timer / a timed raw call seen from its door / seen by its own timer | 52 / 201 / 41 ns |
| All doors, wrapper time per plan, uncorrected | 160.8 ms (42.83 %) |
| All doors, wrapper time per plan, corrected | 124.7 ms (33.21 %) |
| … inside wasm | 82.1 ms (21.87 %) |
| … **glue** (wrapper minus wasm) | **42.6 ms (11.33 %)** |
| … glue upper bound (no timer correction on the doors' side) | 78.7 ms (20.96 %) |

Per plan. "Wrapper" is the door's own time exclusive of doors it opens, corrected for the timers; "wasm" is the raw calls inside it; "glue" is the difference. Shares are of the untimed planner wall. The upper bound takes no timer cost off: wrapper minus wasm as the timers read them.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound | Glue share of the door |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `marchBill` | 90,699 | 90,699 | 80.89 | 51.39 | 29.51 | 325 ns | 7.86 % | 12.99 % | 36.47 % |
| `bindTable` | 203 | 0 | 4.45 | 0.00 | 4.45 | 21,936 ns | 1.19 % | 1.19 % | 100.00 % |
| `sizeStacks` | 4,847 | 4,847 | 13.49 | 10.48 | 3.00 | 620 ns | 0.80 % | 1.07 % | 22.27 % |
| `march` | 11,489 | 11,489 | 6.66 | 4.53 | 2.13 | 186 ns | 0.57 % | 1.22 % | 32.03 % |
| `ladder.finale` | 2,094 | 2,094 | 7.45 | 6.05 | 1.41 | 672 ns | 0.37 % | 0.49 % | 18.88 % |
| `bill` | 7,880 | 7,880 | 1.81 | 0.77 | 1.04 | 132 ns | 0.28 % | 0.72 % | 57.47 % |
| `ladder.grid` | 1,323 | 1,323 | 9.00 | 8.33 | 0.68 | 512 ns | 0.18 % | 0.26 % | 7.53 % |
| `ladder.shape` | 2,276 | 2,276 | 0.84 | 0.58 | 0.26 | 115 ns | 0.07 % | 0.20 % | 31.17 % |
| `ladders` | 9 | 0 | 0.07 | 0.00 | 0.07 | 7,646 ns | 0.02 % | 0.02 % | 100.00 % |
| `ladder.gridView` | 106,683 | 0 | 0.00 | 0.00 | 0.00 | 0 ns | 0.00 % | 1.48 % | — |
| **total** | | | **124.67** | **82.12** | **42.55** | | **11.33 %** | **20.96 %** | **34.13 %** |
