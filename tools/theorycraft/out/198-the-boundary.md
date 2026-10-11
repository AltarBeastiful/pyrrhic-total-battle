# 198 — the kernel boundary

W18 Drill 04b, P3.0 (`docs/plans/profile-drilldown.md` §3). Run 2026-10-11, node v22.22.1: `planCampaign` alone, in-process, under the probes' settings (no clock), on a fresh plan kernel over the release module; the cold plan binds everything for the first time, the warm one repeats the same input on the same kernel. `WebAssembly.Instance`, `%TypedArray%.prototype.set` and the kernel doors are wrapped by the test; `src/` is untouched. Both plans' answers equal the release kernel's.


## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

### Instances and requests per plan

| Figure | Cold plan (fresh kernel) | Warm plan (same kernel, same input) |
|---|---:|---:|
| `new WebAssembly.Instance` | 1 | 0 |
| … bound (one per packed request) | 1 | 0 |
| … the sizer's own (`sizePool`) | 0 | 0 |
| … created inside `bindTable` | 1 | 0 |
| … created inside `sizeStacks` (an unbound request) | 0 | 0 |
| … created inside `marchBill` | 0 | 0 |
| `bindTable` calls | 76 | 76 |
| Distinct request objects bound | 1 | 1 |
| Distinct packed tables (by content) in new instances | 1 | 0 |
| Instances per distinct packed table | 1.00 | — |

### Crossings and copies by door, cold plan

"Raw wasm" counts the JS → wasm calls a door makes (a door may make none: `ladder.gridView` only reads views; `bindTable` makes `alloc` × 10 + `setTable` on a new instance). "In" is bytes JS wrote into wasm memory (`set` measured + element loops counted from the raw call's arguments); "out" is bytes JS read back into its own values.

| Door | Calls | Raw wasm calls | In: `set` | In: loops | Out | Bytes per call | Declined (`null`) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ladder.gridView` | 295,170 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| `march` | 22,900 | 22,900 | 0.0 KiB | 4,754.9 KiB | 1,073.4 KiB | 260.6 | 0 |
| `bill` | 20,310 | 20,310 | 0.0 KiB | 4,088.1 KiB | 634.7 KiB | 238.1 | 0 |
| `sizeStacks` | 12,045 | 12,045 | 0.0 KiB | 2,454.7 KiB | 2,454.7 KiB | 417.4 | 0 |
| `marchBill` | 5,560 | 5,560 | 0.0 KiB | 781.9 KiB | 260.6 KiB | 192.0 | 0 |
| `ladder.grid` | 3,650 | 3,650 | 969.5 KiB | 0.0 KiB | 0.0 KiB | 272.0 | 0 |
| `ladder.finale` | 3,200 | 3,200 | 650.0 KiB | 0.0 KiB | 0.0 KiB | 208.0 | 1 |
| `ladder.shape` | 898 | 898 | 126.1 KiB | 0.0 KiB | 0.0 KiB | 143.8 | 0 |
| `bindTable` | 76 | 11 | 2.9 KiB | 0.0 KiB | 0.0 KiB | 39.6 | 0 |
| `ladders` | 5 | 17 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| **total** | **363,814** | **68,591** | **1,748.6 KiB** | **12,079.5 KiB** | **4,423.4 KiB** | | **1** |

| Figure | Value |
|---|---:|
| Bytes into wasm memory per plan | 13,828.1 KiB |
| Bytes out of wasm memory per plan | 4,423.4 KiB |
| Packed tables built in JS by `bindTable` (`packRequest`, kept or dropped) | 223.3 KiB in 76 tables |
| Result objects the doors allocate (`march`/`bill`/`marchBill` records, `sizeStacks` arrays and stacks) | 270,282 |
| Raise kernel `position` calls (the planner never asks the raise) | 0 |

### Raw wasm calls by door and export, cold plan

| Door → export | Calls |
|---|---:|
| `march → march` | 22,900 |
| `bill → bill` | 20,310 |
| `sizeStacks → sizeStacks` | 12,045 |
| `marchBill → battle` | 5,560 |
| `ladder.grid → ladderGrid` | 3,650 |
| `ladder.finale → ladderFinale` | 3,200 |
| `ladder.shape → ladderShape` | 898 |
| `ladders → ladderScratch` | 17 |
| `bindTable → alloc` | 10 |
| `bindTable → setTable` | 1 |

### Crossings and copies by door, warm plan

"Raw wasm" counts the JS → wasm calls a door makes (a door may make none: `ladder.gridView` only reads views; `bindTable` makes `alloc` × 10 + `setTable` on a new instance). "In" is bytes JS wrote into wasm memory (`set` measured + element loops counted from the raw call's arguments); "out" is bytes JS read back into its own values.

| Door | Calls | Raw wasm calls | In: `set` | In: loops | Out | Bytes per call | Declined (`null`) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ladder.gridView` | 295,170 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| `march` | 22,900 | 22,900 | 0.0 KiB | 4,754.9 KiB | 1,073.4 KiB | 260.6 | 0 |
| `bill` | 20,310 | 20,310 | 0.0 KiB | 4,088.1 KiB | 634.7 KiB | 238.1 | 0 |
| `sizeStacks` | 12,045 | 12,045 | 0.0 KiB | 2,454.7 KiB | 2,454.7 KiB | 417.4 | 0 |
| `marchBill` | 5,560 | 5,560 | 0.0 KiB | 781.9 KiB | 260.6 KiB | 192.0 | 0 |
| `ladder.grid` | 3,650 | 3,650 | 969.5 KiB | 0.0 KiB | 0.0 KiB | 272.0 | 0 |
| `ladder.finale` | 3,200 | 3,200 | 650.0 KiB | 0.0 KiB | 0.0 KiB | 208.0 | 1 |
| `ladder.shape` | 898 | 898 | 126.1 KiB | 0.0 KiB | 0.0 KiB | 143.8 | 0 |
| `bindTable` | 76 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| `ladders` | 5 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| **total** | **363,814** | **68,563** | **1,745.7 KiB** | **12,079.5 KiB** | **4,423.4 KiB** | | **1** |

| Figure | Value |
|---|---:|
| Bytes into wasm memory per plan | 13,825.2 KiB |
| Bytes out of wasm memory per plan | 4,423.4 KiB |
| Packed tables built in JS by `bindTable` (`packRequest`, kept or dropped) | 223.3 KiB in 76 tables |
| Result objects the doors allocate (`march`/`bill`/`marchBill` records, `sizeStacks` arrays and stacks) | 270,282 |
| Raise kernel `position` calls (the planner never asks the raise) | 0 |

### Raw wasm calls by door and export, warm plan

| Door → export | Calls |
|---|---:|
| `march → march` | 22,900 |
| `bill → bill` | 20,310 |
| `sizeStacks → sizeStacks` | 12,045 |
| `marchBill → battle` | 5,560 |
| `ladder.grid → ladderGrid` | 3,650 |
| `ladder.finale → ladderFinale` | 3,200 |
| `ladder.shape → ladderShape` | 898 |

### `march` and `bill`: shared or fresh bound request

**cold plan**

| Figure | Value |
|---|---:|
| Bound instances that served a `march` or `bill` | 1 of 1 |
| `march` + `bill` raw calls | 43,210 |
| … on an instance that served two or more (a shared bound request) | 43,210 (100.0 %) |
| … on an instance that served that one call alone (a fresh bound request) | 0 (0.0 %) |
| Calls on the busiest instance | 43,210 |
| Median calls per serving instance | 43,210 |

**warm plan**

| Figure | Value |
|---|---:|
| Bound instances that served a `march` or `bill` | 1 of 1 |
| `march` + `bill` raw calls | 43,210 |
| … on an instance that served two or more (a shared bound request) | 43,210 (100.0 %) |
| … on an instance that served that one call alone (a fresh bound request) | 0 (0.0 %) |
| Calls on the busiest instance | 43,210 |
| Median calls per serving instance | 43,210 |
| … on an instance the cold plan bound (alive across plans) | 43,210 (100.0 %) |

## Exactness fixture (owner export 2026-09-17)

### Instances and requests per plan

| Figure | Cold plan (fresh kernel) | Warm plan (same kernel, same input) |
|---|---:|---:|
| `new WebAssembly.Instance` | 1 | 0 |
| … bound (one per packed request) | 1 | 0 |
| … the sizer's own (`sizePool`) | 0 | 0 |
| … created inside `bindTable` | 1 | 0 |
| … created inside `sizeStacks` (an unbound request) | 0 | 0 |
| … created inside `marchBill` | 0 | 0 |
| `bindTable` calls | 203 | 203 |
| Distinct request objects bound | 1 | 1 |
| Distinct packed tables (by content) in new instances | 1 | 0 |
| Instances per distinct packed table | 1.00 | — |

### Crossings and copies by door, cold plan

"Raw wasm" counts the JS → wasm calls a door makes (a door may make none: `ladder.gridView` only reads views; `bindTable` makes `alloc` × 10 + `setTable` on a new instance). "In" is bytes JS wrote into wasm memory (`set` measured + element loops counted from the raw call's arguments); "out" is bytes JS read back into its own values.

| Door | Calls | Raw wasm calls | In: `set` | In: loops | Out | Bytes per call | Declined (`null`) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ladder.gridView` | 106,683 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| `marchBill` | 90,699 | 90,699 | 0.0 KiB | 7,794.4 KiB | 4,251.5 KiB | 136.0 | 0 |
| `march` | 11,489 | 11,489 | 0.0 KiB | 1,440.3 KiB | 538.5 KiB | 176.4 | 0 |
| `bill` | 7,880 | 7,880 | 0.0 KiB | 939.4 KiB | 246.3 KiB | 154.1 | 0 |
| `sizeStacks` | 4,847 | 4,847 | 0.0 KiB | 597.6 KiB | 597.6 KiB | 252.5 | 0 |
| `ladder.shape` | 2,276 | 2,276 | 189.3 KiB | 0.0 KiB | 0.0 KiB | 85.2 | 0 |
| `ladder.finale` | 2,094 | 2,094 | 351.7 KiB | 0.0 KiB | 0.0 KiB | 172.0 | 1 |
| `ladder.grid` | 1,323 | 1,323 | 263.6 KiB | 0.0 KiB | 0.0 KiB | 204.0 | 0 |
| `bindTable` | 203 | 11 | 1.8 KiB | 0.0 KiB | 0.0 KiB | 9.3 | 0 |
| `ladders` | 9 | 17 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| **total** | **227,503** | **120,636** | **806.5 KiB** | **10,771.8 KiB** | **5,633.9 KiB** | | **1** |

| Figure | Value |
|---|---:|
| Bytes into wasm memory per plan | 11,578.3 KiB |
| Bytes out of wasm memory per plan | 5,633.9 KiB |
| Packed tables built in JS by `bindTable` (`packRequest`, kept or dropped) | 374.3 KiB in 203 tables |
| Result objects the doors allocate (`march`/`bill`/`marchBill` records, `sizeStacks` arrays and stacks) | 165,909 |
| Raise kernel `position` calls (the planner never asks the raise) | 0 |

### Raw wasm calls by door and export, cold plan

| Door → export | Calls |
|---|---:|
| `marchBill → battle` | 90,699 |
| `march → march` | 11,489 |
| `bill → bill` | 7,880 |
| `sizeStacks → sizeStacks` | 4,847 |
| `ladder.shape → ladderShape` | 2,276 |
| `ladder.finale → ladderFinale` | 2,094 |
| `ladder.grid → ladderGrid` | 1,323 |
| `ladders → ladderScratch` | 17 |
| `bindTable → alloc` | 10 |
| `bindTable → setTable` | 1 |

### Crossings and copies by door, warm plan

"Raw wasm" counts the JS → wasm calls a door makes (a door may make none: `ladder.gridView` only reads views; `bindTable` makes `alloc` × 10 + `setTable` on a new instance). "In" is bytes JS wrote into wasm memory (`set` measured + element loops counted from the raw call's arguments); "out" is bytes JS read back into its own values.

| Door | Calls | Raw wasm calls | In: `set` | In: loops | Out | Bytes per call | Declined (`null`) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ladder.gridView` | 106,683 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| `marchBill` | 90,699 | 90,699 | 0.0 KiB | 7,794.4 KiB | 4,251.5 KiB | 136.0 | 0 |
| `march` | 11,489 | 11,489 | 0.0 KiB | 1,440.3 KiB | 538.5 KiB | 176.4 | 0 |
| `bill` | 7,880 | 7,880 | 0.0 KiB | 939.4 KiB | 246.3 KiB | 154.1 | 0 |
| `sizeStacks` | 4,847 | 4,847 | 0.0 KiB | 597.6 KiB | 597.6 KiB | 252.5 | 0 |
| `ladder.shape` | 2,276 | 2,276 | 189.3 KiB | 0.0 KiB | 0.0 KiB | 85.2 | 0 |
| `ladder.finale` | 2,094 | 2,094 | 351.7 KiB | 0.0 KiB | 0.0 KiB | 172.0 | 1 |
| `ladder.grid` | 1,323 | 1,323 | 263.6 KiB | 0.0 KiB | 0.0 KiB | 204.0 | 0 |
| `bindTable` | 203 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| `ladders` | 9 | 0 | 0.0 KiB | 0.0 KiB | 0.0 KiB | 0.0 | 0 |
| **total** | **227,503** | **120,608** | **804.7 KiB** | **10,771.8 KiB** | **5,633.9 KiB** | | **1** |

| Figure | Value |
|---|---:|
| Bytes into wasm memory per plan | 11,576.4 KiB |
| Bytes out of wasm memory per plan | 5,633.9 KiB |
| Packed tables built in JS by `bindTable` (`packRequest`, kept or dropped) | 374.3 KiB in 203 tables |
| Result objects the doors allocate (`march`/`bill`/`marchBill` records, `sizeStacks` arrays and stacks) | 165,909 |
| Raise kernel `position` calls (the planner never asks the raise) | 0 |

### Raw wasm calls by door and export, warm plan

| Door → export | Calls |
|---|---:|
| `marchBill → battle` | 90,699 |
| `march → march` | 11,489 |
| `bill → bill` | 7,880 |
| `sizeStacks → sizeStacks` | 4,847 |
| `ladder.shape → ladderShape` | 2,276 |
| `ladder.finale → ladderFinale` | 2,094 |
| `ladder.grid → ladderGrid` | 1,323 |

### `march` and `bill`: shared or fresh bound request

**cold plan**

| Figure | Value |
|---|---:|
| Bound instances that served a `march` or `bill` | 1 of 1 |
| `march` + `bill` raw calls | 19,369 |
| … on an instance that served two or more (a shared bound request) | 19,369 (100.0 %) |
| … on an instance that served that one call alone (a fresh bound request) | 0 (0.0 %) |
| Calls on the busiest instance | 19,369 |
| Median calls per serving instance | 19,369 |

**warm plan**

| Figure | Value |
|---|---:|
| Bound instances that served a `march` or `bill` | 1 of 1 |
| `march` + `bill` raw calls | 19,369 |
| … on an instance that served two or more (a shared bound request) | 19,369 (100.0 %) |
| … on an instance that served that one call alone (a fresh bound request) | 0 (0.0 %) |
| Calls on the busiest instance | 19,369 |
| Median calls per serving instance | 19,369 |
| … on an instance the cold plan bound (alive across plans) | 19,369 (100.0 %) |

## 198b — the glue, timed (2026-10-11)

From [[198b-the-glue]] (`tools/theorycraft/198b-the-glue.test.ts`, same plans; this section is not rewritten by 198's
test, rerun 198b to refresh it). Per plan, warm kernel, shares of the **untimed** planner wall; "glue" is a door's
wrapper time minus its wasm calls, timer cost taken off by calibration; the upper bound takes none off.

| Figure | Timing fixture | Exactness fixture |
|---|---:|---:|
| Planner wall per plan, untimed (median of 7) | 397.9 ms | 375.4 ms |
| Time inside wasm (all doors) | 137.5 ms (34.6 %) | 82.1 ms (21.9 %) |
| **Glue, all doors** | **32.2 ms (8.1 %)**, upper bound 16.4 % | **42.6 ms (11.3 %)**, upper bound 21.0 % |
| Largest door glue | `sizeStacks` 2.6 % (≤ 3.3 %) | `marchBill` 7.9 % (≤ 13.0 %) |
| Next | `march` 1.7 %, `bill` 1.1 %, `marchBill` 1.0 % | `bindTable` 1.2 %, `sizeStacks` 0.8 % |
| `bindTable` glue (75 of 76 / 202 of 203 calls rebuild a dropped `packRequest`) | 30 µs a call, 0.6 % | 22 µs a call, 1.2 % |
| `ladder.gridView` (295 k / 107 k calls, a view read) | ≈ 0 corrected, ≤ 4.0 % | ≈ 0 corrected, ≤ 1.5 % |
