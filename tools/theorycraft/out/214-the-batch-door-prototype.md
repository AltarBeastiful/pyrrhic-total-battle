# 214 — the batch door prototype

Run 2026-10-12, node v22.22.2: `planCampaign` in-process, probes' settings (no clock), a fresh plan kernel over the release module, its exports and doors timed by the test. The live account is given first; the 198b timing fixture and the owner exactness fixture follow for the like-for-like comparison. The prototype (`src/kernel/plan.ts`'s `marchMany`/`marchBillMany`, routed in `src/engine/plan.ts`'s `orderFor` and `src/engine/retype.ts`) is behind `setBatchDoors`, off by default.

## The census (batch off)

## Live account (`pyrrhic-my-account-2026-10-11.json`)

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 5, release kernel) | 209.5 ms |
| … min / max | 176.2 / 221.7 ms |
| Planner wall per plan, timed (median of 5) | 309.9 ms |
| Timer cost, calibrated: inside an empty door / a timed raw call seen from its door / by its own timer | 46 / 186 / 39 ns |
| All doors, **glue** (wrapper minus wasm, corrected) | **16.2 ms (7.73 %)** |
| … inside wasm | 45.2 ms (21.57 %) |
| … glue upper bound (no timer correction) | 35.2 ms (16.81 %) |

Per plan. Shares are of the untimed planner wall; "glue" is the door wrapper minus its raw wasm calls, both corrected for the timers.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `sizerShape` | 8,970 | 8,970 | 25.77 | 20.42 | 5.36 | 597 ns | 2.56 % | 3.38 % |
| `bill` | 14,472 | 14,472 | 5.17 | 2.33 | 2.84 | 196 ns | 1.35 % | 2.68 % |
| `march` | 10,372 | 10,372 | 8.14 | 5.40 | 2.74 | 264 ns | 1.31 % | 2.26 % |
| `ladder.gridView` | 240,863 | 0 | 1.28 | 0.00 | 1.28 | 5 ns | 0.61 % | 5.87 % |
| `ladder.grid` | 2,943 | 2,943 | 11.55 | 10.44 | 1.11 | 377 ns | 0.53 % | 0.80 % |
| `ladder.finale` | 2,021 | 2,021 | 3.73 | 2.66 | 1.07 | 529 ns | 0.51 % | 0.70 % |
| `bindTable` | 45 | 0 | 1.06 | 0.00 | 1.06 | 23,663 ns | 0.51 % | 0.51 % |
| `ladder.shape` | 2,734 | 2,734 | 1.09 | 0.71 | 0.37 | 136 ns | 0.18 % | 0.43 % |
| `retypeClimb` | 6 | 6 | 3.00 | 2.89 | 0.11 | 18,333 ns | 0.05 % | 0.05 % |
| `ladders` | 9 | 0 | 0.08 | 0.00 | 0.08 | 8,927 ns | 0.04 % | 0.04 % |
| `sizeStacks` | 29 | 29 | 0.12 | 0.05 | 0.08 | 2,665 ns | 0.04 % | 0.04 % |
| `marchBill` | 31 | 31 | 0.11 | 0.05 | 0.07 | 2,106 ns | 0.03 % | 0.03 % |
| `retypeWalk` | 5 | 5 | 0.29 | 0.25 | 0.04 | 8,962 ns | 0.02 % | 0.02 % |
| **total** | | | **61.40** | **45.19** | **16.21** | | **7.73 %** | **16.81 %** |

## 198b timing fixture (`pyrrhic-my-account-2026-10-07.json`)

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 5, release kernel) | 280.6 ms |
| … min / max | 274.6 / 319.9 ms |
| Planner wall per plan, timed (median of 5) | 448.4 ms |
| Timer cost, calibrated: inside an empty door / a timed raw call seen from its door / by its own timer | 46 / 187 / 39 ns |
| All doors, **glue** (wrapper minus wasm, corrected) | **20.3 ms (7.23 %)** |
| … inside wasm | 111.0 ms (39.56 %) |
| … glue upper bound (no timer correction) | 44.6 ms (15.89 %) |

Per plan. Shares are of the untimed planner wall; "glue" is the door wrapper minus its raw wasm calls, both corrected for the timers.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `sizerShape` | 12,031 | 12,031 | 65.61 | 59.58 | 6.03 | 501 ns | 2.15 % | 2.98 % |
| `bill` | 20,310 | 20,310 | 7.70 | 3.37 | 4.33 | 213 ns | 1.54 % | 2.95 % |
| `march` | 13,456 | 13,456 | 13.36 | 9.67 | 3.69 | 274 ns | 1.32 % | 2.25 % |
| `bindTable` | 76 | 0 | 1.83 | 0.00 | 1.83 | 24,025 ns | 0.65 % | 0.65 % |
| `ladder.finale` | 3,200 | 3,200 | 6.39 | 4.85 | 1.54 | 481 ns | 0.55 % | 0.77 % |
| `ladder.grid` | 3,650 | 3,650 | 27.37 | 26.13 | 1.23 | 338 ns | 0.44 % | 0.69 % |
| `ladder.gridView` | 300,281 | 0 | 1.00 | 0.00 | 1.00 | 3 ns | 0.36 % | 5.31 % |
| `retypeClimb` | 18 | 18 | 6.90 | 6.67 | 0.23 | 12,907 ns | 0.08 % | 0.08 % |
| `ladder.shape` | 898 | 898 | 0.53 | 0.38 | 0.15 | 171 ns | 0.05 % | 0.12 % |
| `marchBill` | 54 | 54 | 0.23 | 0.11 | 0.11 | 2,068 ns | 0.04 % | 0.04 % |
| `sizeStacks` | 14 | 14 | 0.08 | 0.02 | 0.06 | 4,510 ns | 0.02 % | 0.02 % |
| `ladders` | 5 | 0 | 0.05 | 0.00 | 0.05 | 9,846 ns | 0.02 % | 0.02 % |
| `retypeWalk` | 1 | 1 | 0.22 | 0.20 | 0.02 | 17,323 ns | 0.01 % | 0.01 % |
| **total** | | | **131.27** | **110.99** | **20.28** | | **7.23 %** | **15.89 %** |

## Exactness fixture (owner export 2026-09-17)

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 5, release kernel) | 142.0 ms |
| … min / max | 138.3 / 145.2 ms |
| Planner wall per plan, timed (median of 5) | 201.1 ms |
| Timer cost, calibrated: inside an empty door / a timed raw call seen from its door / by its own timer | 47 / 187 / 39 ns |
| All doors, **glue** (wrapper minus wasm, corrected) | **9.7 ms (6.82 %)** |
| … inside wasm | 70.5 ms (49.64 %) |
| … glue upper bound (no timer correction) | 19.7 ms (13.86 %) |

Per plan. Shares are of the untimed planner wall; "glue" is the door wrapper minus its raw wasm calls, both corrected for the timers.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `bindTable` | 203 | 0 | 2.78 | 0.00 | 2.78 | 13,672 ns | 1.96 % | 1.96 % |
| `sizerShape` | 4,842 | 4,842 | 7.47 | 5.49 | 1.98 | 409 ns | 1.39 % | 2.06 % |
| `ladder.finale` | 2,094 | 2,094 | 7.37 | 6.26 | 1.11 | 530 ns | 0.78 % | 1.07 % |
| `march` | 5,930 | 5,930 | 3.09 | 2.16 | 0.93 | 157 ns | 0.66 % | 1.47 % |
| `bill` | 7,880 | 7,880 | 1.60 | 0.68 | 0.92 | 116 ns | 0.65 % | 1.73 % |
| `ladder.gridView` | 110,382 | 0 | 0.64 | 0.00 | 0.64 | 6 ns | 0.45 % | 4.12 % |
| `ladder.grid` | 1,323 | 1,323 | 9.12 | 8.57 | 0.55 | 419 ns | 0.39 % | 0.57 % |
| `retypeWalk` | 52 | 52 | 46.99 | 46.60 | 0.39 | 7,521 ns | 0.28 % | 0.28 % |
| `ladder.shape` | 2,276 | 2,276 | 0.79 | 0.57 | 0.22 | 96 ns | 0.15 % | 0.47 % |
| `marchBill` | 136 | 136 | 0.24 | 0.14 | 0.10 | 743 ns | 0.07 % | 0.09 % |
| `ladders` | 9 | 0 | 0.06 | 0.00 | 0.06 | 6,121 ns | 0.04 % | 0.04 % |
| `sizeStacks` | 5 | 5 | 0.02 | 0.01 | 0.02 | 3,336 ns | 0.01 % | 0.01 % |
| **total** | | | **80.16** | **70.47** | **9.69** | | **6.82 %** | **13.86 %** |

## The batched path, same census

## Live account, batch on

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 5, release kernel) | 179.9 ms |
| … min / max | 171.0 / 215.0 ms |
| Planner wall per plan, timed (median of 5) | 315.3 ms |
| Timer cost, calibrated: inside an empty door / a timed raw call seen from its door / by its own timer | 45 / 187 / 40 ns |
| All doors, **glue** (wrapper minus wasm, corrected) | **14.7 ms (8.17 %)** |
| … inside wasm | 46.2 ms (25.69 %) |
| … glue upper bound (no timer correction) | 33.4 ms (18.54 %) |

Per plan. Shares are of the untimed planner wall; "glue" is the door wrapper minus its raw wasm calls, both corrected for the timers.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `sizerShape` | 8,970 | 8,970 | 24.63 | 20.82 | 3.81 | 425 ns | 2.12 % | 3.08 % |
| `bill` | 14,472 | 14,472 | 5.32 | 2.36 | 2.96 | 204 ns | 1.64 % | 3.19 % |
| `march` | 10,002 | 10,002 | 7.73 | 5.33 | 2.40 | 239 ns | 1.33 % | 2.40 % |
| `ladder.gridView` | 240,863 | 0 | 1.17 | 0.00 | 1.17 | 5 ns | 0.65 % | 6.61 % |
| `bindTable` | 45 | 0 | 1.15 | 0.00 | 1.15 | 25,565 ns | 0.64 % | 0.64 % |
| `ladder.finale` | 2,021 | 2,021 | 3.68 | 2.70 | 0.98 | 486 ns | 0.55 % | 0.76 % |
| `ladder.grid` | 2,943 | 2,943 | 11.43 | 10.45 | 0.98 | 331 ns | 0.54 % | 0.86 % |
| `retypeClimb` | 6 | 6 | 3.82 | 3.27 | 0.55 | 91,807 ns | 0.31 % | 0.31 % |
| `ladder.shape` | 2,734 | 2,734 | 1.09 | 0.74 | 0.34 | 126 ns | 0.19 % | 0.48 % |
| `marchMany` | 22 | 22 | 0.25 | 0.13 | 0.12 | 5,267 ns | 0.06 % | 0.07 % |
| `ladders` | 9 | 0 | 0.09 | 0.00 | 0.09 | 9,847 ns | 0.05 % | 0.05 % |
| `retypeWalk` | 5 | 5 | 0.37 | 0.30 | 0.07 | 14,219 ns | 0.04 % | 0.04 % |
| `sizeStacks` | 29 | 29 | 0.10 | 0.05 | 0.05 | 1,878 ns | 0.03 % | 0.03 % |
| `marchBill` | 31 | 31 | 0.09 | 0.05 | 0.04 | 1,393 ns | 0.02 % | 0.03 % |
| **total** | | | **60.91** | **46.21** | **14.70** | | **8.17 %** | **18.54 %** |

## 198b fixture, batch on

| Figure | Value |
|---|---:|
| Planner wall per plan, untimed (median of 5, release kernel) | 277.5 ms |
| … min / max | 272.2 / 290.4 ms |
| Planner wall per plan, timed (median of 5) | 463.8 ms |
| Timer cost, calibrated: inside an empty door / a timed raw call seen from its door / by its own timer | 47 / 190 / 39 ns |
| All doors, **glue** (wrapper minus wasm, corrected) | **20.6 ms (7.41 %)** |
| … inside wasm | 111.0 ms (40.00 %) |
| … glue upper bound (no timer correction) | 45.1 ms (16.25 %) |

Per plan. Shares are of the untimed planner wall; "glue" is the door wrapper minus its raw wasm calls, both corrected for the timers.

| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `sizerShape` | 12,031 | 12,031 | 66.27 | 60.26 | 6.01 | 499 ns | 2.16 % | 3.02 % |
| `bill` | 20,310 | 20,310 | 8.09 | 3.45 | 4.64 | 228 ns | 1.67 % | 3.12 % |
| `march` | 13,043 | 13,043 | 12.91 | 9.56 | 3.35 | 257 ns | 1.21 % | 2.14 % |
| `bindTable` | 76 | 0 | 1.95 | 0.00 | 1.95 | 25,673 ns | 0.70 % | 0.70 % |
| `ladder.finale` | 3,200 | 3,200 | 6.38 | 4.83 | 1.55 | 484 ns | 0.56 % | 0.79 % |
| `ladder.grid` | 3,650 | 3,650 | 26.61 | 25.37 | 1.24 | 340 ns | 0.45 % | 0.71 % |
| `ladder.gridView` | 300,281 | 0 | 1.12 | 0.00 | 1.12 | 4 ns | 0.40 % | 5.46 % |
| `retypeClimb` | 18 | 18 | 6.81 | 6.57 | 0.24 | 13,306 ns | 0.09 % | 0.09 % |
| `marchMany` | 37 | 37 | 0.36 | 0.22 | 0.14 | 3,839 ns | 0.05 % | 0.05 % |
| `ladder.shape` | 898 | 898 | 0.53 | 0.39 | 0.14 | 152 ns | 0.05 % | 0.11 % |
| `marchBill` | 54 | 54 | 0.19 | 0.11 | 0.08 | 1,487 ns | 0.03 % | 0.03 % |
| `ladders` | 5 | 0 | 0.05 | 0.00 | 0.05 | 9,338 ns | 0.02 % | 0.02 % |
| `sizeStacks` | 14 | 14 | 0.04 | 0.02 | 0.03 | 1,851 ns | 0.01 % | 0.01 % |
| `retypeWalk` | 1 | 1 | 0.22 | 0.20 | 0.02 | 15,869 ns | 0.01 % | 0.01 % |
| **total** | | | **131.54** | **110.99** | **20.55** | | **7.41 %** | **16.25 %** |

## The door, in isolation


The same 80 shapes/vectors, one process: `marchBill` and `march` a call versus `marchBillMany` and `marchMany` once. ns here are of one whole call of 80, divided by 80.

| Door call | ns per shape, one crossing each | ns per shape, one crossing | Saved ns per shape | Saved % |
|---|---:|---:|---:|---:|
| `marchBill → battleMany` | 895.2 | 883.3 | 11.9 | 1.3 % |
| `march → marchMany` | 547.9 | 497.1 | 50.9 | 9.3 % |

Doors are exact: marchBillMany 80 vectors: damage and silver equal `marchBill` on every one. marchMany 80 shapes: damage, silver and hired share equal `march` on every one.

## The A/B (live account `pyrrhic-my-account-2026-10-11.json`)

`planCampaign` in-process, probes' settings (no clock), release kernel, 40 rounds per arm, interleaved (the arm that goes first alternating), answers held equal to the batch-off arm. This machine carries a wide tail (the medians sit well above the mins), so the **mins** are read as the best estimate of the effect and the medians as an upper bound on the noise.

| arm | median wall ms | min wall ms | median CPU ms | min CPU ms |
|---|---:|---:|---:|---:|
| new | 175.6 | 169.5 | 254.6 | 216.0 |
| old | 175.4 | 170.2 | 248.3 | 210.0 |

Gain, min-to-min: **0.38 %** wall, **-2.86 %** CPU. Gain, median: **-0.16 %** wall, **-2.53 %** CPU. The planner is ~45 % of the pool's CPU on this account, so a -2.86 % planner-CPU gain is -6.36 % of pool CPU.

## Verdict

**The census has moved.** On today's engine the live account's doors cost **16.2 ms of glue a plan (7.73 %)**, and the biggest single door is `sizerShape` (5.36 ms, 2.56 %). `marchBill`, the door 198b found at 90,699 calls on the owner fixture, is now **31 calls a plan (0.03 % of the wall)** — the `sizerShape`, `retypeWalk`/`retypeClimb` and ladder-grid doors added since W18–W22 moved that arithmetic behind wasm, so the loop 198b named is cold.

**The batch door, routed.** Behind `setBatchDoors(true)` the routed loops turn `march` 10,372 calls into 10,002 + 22 `marchMany` crossings a plan (the `orderFor` rung-order climb); the re-typing loops that name `marchBillMany` do not run on this fixture (the kernel `retypeWalk`/`retypeClimb` doors answer them), so `marchBill` stays 31 calls. Folding 370 `march` crossings into 22 saves about 370 × 264 ns ≈ **0.10 ms a plan (0.05 % of the wall)** — the ceiling of what routing these loops can buy.

**What the crossing itself buys.** In isolation, the same 80 shapes one crossing each versus one crossing: `march → marchMany` saves a few percent a shape, `marchBill → battleMany` is a wash — the JS↔wasm crossing is not the cost. Each door's "glue" is the **JS packing and reading** (writing each stack's row and count, reading each figure, building a result object), and a batch crossing does exactly the same per-element work, only once. Batching removes the call dispatch, not the arithmetic.

**The planner A/B.** The batched arm's answers are byte-identical to the shipped path's on all three fixtures (asserted in the census and the A/B). Min-to-min the batched path moves the live plan by 0.38 % wall and -2.86 % CPU; the medians are -0.16 % / -2.53 %. The two disagree in sign and sit inside this machine's own spread (the medians several times the mins), so the honest reading is **no measured effect** — consistent with the ~0.1 % ceiling above and with the door-level wash.

**Verdict.** Well under the 2 % bar: routing the remaining hand-batchable loops buys at most a few tenths of a percent of the planner wall, and the door-level measurement shows why — the glue is JS packing that a batch crossing does not remove. A batch door would pay only if it also moved the packing into wasm (the caller handing compact data the kernel expands) — a different, larger change than this prototype. **Not worth merging.**
