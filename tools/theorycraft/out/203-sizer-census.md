# 203 — the sizer census

W20 C0 (`docs/plans/sizer-track-c.md`). Run 2026-10-11, node v22.22.2: one counted `planCampaign` per fixture (probes' settings, no clock) on the profile kernel, then 5 plans under the CPU profiler. Hits = calls − distinct inputs (a 64-bit FNV-style hash of the slots' HP, cost, cap, the capacity and the ceiling, bit for bit). The log holds 131,072 hashes per instance.


## Exactness fixture (owner export 2026-09-17)

### 1. `sizerShape` misses (calls that reach the kernel)

| method | calls |
|---|---:|
| elite | 1,898 |
| ms | 1,472 |
| msRelaxed | 1,472 |
| **all** | **4,842** (4,275 with every troop fielded) |

### 2. `sizePool`

| pool | calls | on 0 slots / no capacity | bisection steps | steps per call | fixed-point breaks | ceiling shortcuts | distinct inputs | hits | hits per entry | max reuse |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool 0 (troops) | 4,847 | — | 284,782 | 58.8 | 4,847 | 0 | 11 | 4,836 (99.8 %) | 439.64 | 4,355 |
| pool 1 (authority) | 4,847 | — | 102,524 | 21.2 | 1,898 | 2,949 | 3,147 | 1,700 (35.1 %) | 0.54 | 9 |
| pool 2 (dominance) | 4,847 | — | 0 | 0.0 | 0 | 0 | 0 | 0 (—) | 0.00 | 0 |

(4,847 pool calls were on an empty pool or no capacity and ran no bisection.)

### 3. `relaxPreservation` (msRelaxed only)

| figure | value |
|---|---:|
| walks | 1,472 |
| attempts (each tries every hired slot) | 2,097 (1.4 per walk) |
| `sizerScore` calls, opening included | 4,914 (3.3 per walk) |
| attempts accepted | 625 |
| walks that accept none | 847 (57.5 %) |
| of those, first attempt picks no candidate | 374 |
| of those, first attempt does not improve | 473 |

### 4. Results and start states

| log | entries | distinct | repeats | hits per entry |
|---|---:|---:|---:|---:|
| `sizeStacks` result (rows + counts) | 4,847 | 2,119 | 2,728 (56.3 %) | 1.29 |
| relax start state (the `ms` answer) | 1,472 | 569 | 903 (61.3 %) | 1.59 |
| **`sizeStacks` whole input** (rows, caps, housing, flags) | 4,847 | 4,750 | 97 (2.0 %) | 0.02 |
| **relax walk input** (start state, caps, housing, step) | 1,472 | 1,427 | 45 (3.1 %) | 0.03 |

### 5. Where the time goes under `sizerShape` (5 plans, 100 µs sampling)

Under `sizerShape`: 81.6 ms of 991.9 ms sampled (8.2 %).

| self frame | ms | share of sizerShape | share of planner |
|---|---:|---:|---:|
| wasm kernel/assembly/index/sizePool | 39.8 | 48.8 % | 4.0 % |
| js sizerShape | 19.7 | 24.1 % | 2.0 % |
| wasm kernel/assembly/index/sizeStacks | 6.4 | 7.9 % | 0.6 % |
| wasm kernel/assembly/index/journalDamage | 5.3 | 6.5 % | 0.5 % |
| wasm kernel/assembly/index/killOrderBy | 4.5 | 5.5 % | 0.5 % |
| wasm kernel/assembly/index/sizerShape | 2.3 | 2.9 % | 0.2 % |
| wasm kernel/assembly/index/attackOrderOf | 1.8 | 2.2 % | 0.2 % |
| wasm kernel/assembly/index/sizePoolOf | 1.1 | 1.4 % | 0.1 % |
| js (anon) | 0.3 | 0.4 % | 0.0 % |
| wasm kernel/assembly/index/sizerScore | 0.3 | 0.4 % | 0.0 % |

## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

### 1. `sizerShape` misses (calls that reach the kernel)

| method | calls |
|---|---:|
| elite | 4,743 |
| ms | 3,644 |
| msRelaxed | 3,644 |
| **all** | **12,031** (11,101 with every troop fielded) |

### 2. `sizePool`

| pool | calls | on 0 slots / no capacity | bisection steps | steps per call | fixed-point breaks | ceiling shortcuts | distinct inputs | hits | hits per entry | max reuse |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pool 0 (troops) | 12,045 | — | 709,393 | 58.9 | 12,045 | 0 | 15 | 12,030 (99.9 %) | 802.00 | 11,195 |
| pool 1 (authority) | 12,045 | — | 256,122 | 21.3 | 4,743 | 7,302 | 1,398 | 10,647 (88.4 %) | 7.62 | 1,297 |
| pool 2 (dominance) | 12,045 | — | 267,683 | 23.0 | 4,700 | 6,952 | 1,932 | 9,720 (83.4 %) | 5.03 | 475 |

(393 pool calls were on an empty pool or no capacity and ran no bisection.)

### 3. `relaxPreservation` (msRelaxed only)

| figure | value |
|---|---:|
| walks | 3,644 |
| attempts (each tries every hired slot) | 9,272 (2.5 per walk) |
| `sizerScore` calls, opening included | 52,994 (14.5 per walk) |
| attempts accepted | 5,628 |
| walks that accept none | 657 (18.0 %) |
| of those, first attempt picks no candidate | 309 |
| of those, first attempt does not improve | 348 |

### 4. Results and start states

| log | entries | distinct | repeats | hits per entry |
|---|---:|---:|---:|---:|
| `sizeStacks` result (rows + counts) | 12,045 | 2,409 | 9,636 (80.0 %) | 4.00 |
| relax start state (the `ms` answer) | 3,644 | 360 | 3,284 (90.1 %) | 9.12 |
| **`sizeStacks` whole input** (rows, caps, housing, flags) | 12,045 | 11,831 | 214 (1.8 %) | 0.02 |
| **relax walk input** (start state, caps, housing, step) | 3,644 | 3,583 | 61 (1.7 %) | 0.02 |

### 5. Where the time goes under `sizerShape` (5 plans, 100 µs sampling)

Under `sizerShape`: 459.2 ms of 1,911.6 ms sampled (24.0 %).

| self frame | ms | share of sizerShape | share of planner |
|---|---:|---:|---:|
| wasm kernel/assembly/index/journalDamage | 148.2 | 32.3 % | 7.8 % |
| wasm kernel/assembly/index/sizePool | 139.5 | 30.4 % | 7.3 % |
| wasm kernel/assembly/index/killOrderBy | 52.1 | 11.3 % | 2.7 % |
| wasm kernel/assembly/index/attackOrderOf | 42.5 | 9.3 % | 2.2 % |
| js sizerShape | 35.1 | 7.6 % | 1.8 % |
| wasm kernel/assembly/index/sizeStacks | 24.0 | 5.2 % | 1.3 % |
| wasm kernel/assembly/index/sizerShape | 8.5 | 1.8 % | 0.4 % |
| wasm kernel/assembly/index/sizePoolOf | 4.9 | 1.1 % | 0.3 % |
| wasm kernel/assembly/index/sizerScore | 2.5 | 0.6 % | 0.1 % |
| js sizerBound | 0.7 | 0.2 % | 0.0 % |
| wasm js-to-wasm:idddid:i | 0.6 | 0.1 % | 0.0 % |
| js (anon) | 0.6 | 0.1 % | 0.0 % |
