# 196 — the cache census

W18 P0.3 (`docs/plans/profile-drilldown.md`). Run 2026-10-10: the profiling run's work (Generate + upgrades-default + captains + other) in-process on one lane, no clock, profile kernel. Projected saving = hits × measured miss cost. The trace figures (Tight raise 49.1 % of busy pool CPU, raiseRating 38.4 % of it, its kill order 18.0 %, sizerScore 0.40 % of busy) are from `.maestro/playbooks/Working/w18/k-shares.py`.


## Exactness fixture (owner export 2026-09-17)

Run CPU **33,961 ms** (one lane, census hashing removed): generate 1,523, upgrades-default 16,536, captains 5,401, other 10,544 ms. Jobs: 65 (3 baselines, 55 probes). Raise calls: 425 (420 Tight), 189 ms = 0.56 % of the run; Tight 187 ms = 0.55 %.

### The raise searches

| | all | Tight |
|---|---:|---:|
| calls | 425 | 420 |
| scored (vectors asked) | 8,271,734 | 8,167,126 |
| battles (≈ distinct vectors battled, memo misses) | 22,203 | 22,036 |
| ratings | 7,745 | 7,745 |
| of which on a memo hit | 376 | 376 |
| kill orders from battles | 22,203 | 22,036 |
| kill orders from ratings | 8,165 | 8,165 |
| sizer kill orders (all kernel instances) | 558,568 | — |
| ms | 189 | 187 |

Fit over the 420 Tight searches: ms = 0.057 + 11.266 µs · battles + -11.035 µs · ratings. A rating costs **9.267 µs** (trace share, the fit was not positive; the trace's share gives 9.267 µs); **raiseRating is 38.40 % of the rated searches' time** (trace: 38.4 %).

**Against the trace**: the Tight raise is 0.55 % of this run's CPU, the trace's pool workers spent 49.1 % in it. Every candidate whose miss cost comes from the raise reads on this run's own clock, so its share here is the in-process one; see the verdict section of the plan for what the gap means.

### The JS census

| phase | jobs | shows | read hits | priced | re-priced across jobs | ms | baselines | repeated |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| generate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| upgrades-default | 30 | 295 | 105 | 190 | 0 | 0 | 1 | 0 |
| captains | 10 | 94 | 0 | 94 | 0 | 0 | 1 | 0 |
| other | 18 | 169 | 38 | 131 | 35 | 29 | 1 | 0 |
| **run** | 58 | 558 | 143 | 415 (365 distinct) | 50 | 40 | 3 | 2 |

### The candidates

| candidate | entries | hits | hits per entry | miss cost | projected saving | share of run CPU | how |
|---|---:|---:|---|---:|---:|---:|---|
| K1 rated value memo | 7,369 | 376 | 0.05 overall; per search mean 0.77, median 1.00, max 26.00 | 9.267 µs | 3 ms | **0.01 %** | entries = rated misses (distinct rated vectors under the score memo); hits = ratingsOnHit |
| K2 shared kill order | — (refactor) | 7,369 | 1 per rated miss | 4.344 µs | 32 ms | **0.09 %** | duplicated killOrderBy = rated misses; cost = rating × 0.47 (trace's kill-order share of raiseRating) |
| K3 shownMarch across jobs (exact request key) | 365 | 50 | mean 0.14, median 0.0, max 5 | 0.515 ms | 40 ms | **0.12 %** | saving = Σ measured ms of the re-priced marches |
| K3 shownMarch across jobs (kernel input key) | 266 | 149 | mean 0.56, median 0.0, max 21 | 0.214 ms | 65 ms | **0.19 %** | Tight raise calls whose packed input an earlier job already raised; saving = Σ measured ms of those calls |
| K4 baseline across passes | 1 | 2 | mean 2.00, median 2.0, max 2 | 451.580 ms | 903 ms | **2.66 %** | 3 baseline jobs, median measured |
| K5 Generate ↔ advisor (exact key) | 5 | 5 | — | 0.410 ms | 2 ms | **0.01 %** | bar keys a probe job priced again |
| K5 Generate ↔ advisor (kernel input key) | 5 | 110 | 22.00 mean | 0.410 ms | 48 ms | **0.14 %** | probe Tight raises on a bar march; saving = Σ their measured ms |
| K6 sizer journals fused | — (refactor) | 558,568 | — | — | 42 ms | **0.13 %** | calls = sizerScore + buildStacks (one counter); ceiling = one of the two journals, trace 0.25 % of busy pool CPU for both |

## Timing fixture (`pyrrhic-my-account-2026-10-07.json`, not committed)

Run CPU **87,398 ms** (one lane, census hashing removed): generate 1,086, upgrades-default 32,826, captains 32,554, other 21,204 ms. Jobs: 102 (3 baselines, 83 probes). Raise calls: 695 (690 Tight), 11,668 ms = 13.35 % of the run; Tight 11,621 ms = 13.30 %.

### The raise searches

| | all | Tight |
|---|---:|---:|
| calls | 695 | 690 |
| scored (vectors asked) | 164,750,012 | 163,603,293 |
| battles (≈ distinct vectors battled, memo misses) | 8,318,749 | 8,259,973 |
| ratings | 13,062,719 | 13,062,719 |
| of which on a memo hit | 4,839,797 | 4,839,797 |
| kill orders from battles | 8,318,749 | 8,259,973 |
| kill orders from ratings | 13,063,409 | 13,063,409 |
| sizer kill orders (all kernel instances) | 5,554,819 | — |
| ms | 11,668 | 11,621 |

Fit over the 690 Tight searches: ms = 2.112 + 0.599 µs · battles + 0.400 µs · ratings. A rating costs **0.400 µs** (fit; the trace's share gives 0.342 µs); **raiseRating is 44.91 % of the rated searches' time** (trace: 38.4 %).

**Against the trace**: the Tight raise is 13.30 % of this run's CPU, the trace's pool workers spent 49.1 % in it. Every candidate whose miss cost comes from the raise reads on this run's own clock, so its share here is the in-process one; see the verdict section of the plan for what the gap means.

### The JS census

| phase | jobs | shows | read hits | priced | re-priced across jobs | ms | baselines | repeated |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| generate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| upgrades-default | 30 | 290 | 95 | 195 | 0 | 0 | 1 | 0 |
| captains | 36 | 343 | 12 | 331 | 19 | 260 | 1 | 0 |
| other | 20 | 188 | 29 | 159 | 15 | 340 | 1 | 0 |
| **run** | 86 | 821 | 136 | 685 (641 distinct) | 44 | 851 | 3 | 2 |

### The candidates

| candidate | entries | hits | hits per entry | miss cost | projected saving | share of run CPU | how |
|---|---:|---:|---|---:|---:|---:|---|
| K1 rated value memo | 8,222,922 | 4,839,797 | 0.59 overall; per search mean 1.63, median 0.50, max 19.92 | 0.400 µs | 1,934 ms | **2.21 %** | entries = rated misses (distinct rated vectors under the score memo); hits = ratingsOnHit |
| K2 shared kill order | — (refactor) | 8,222,922 | 1 per rated miss | 0.187 µs | 1,540 ms | **1.76 %** | duplicated killOrderBy = rated misses; cost = rating × 0.47 (trace's kill-order share of raiseRating) |
| K3 shownMarch across jobs (exact request key) | 641 | 44 | mean 0.07, median 0.0, max 5 | 1.053 ms | 851 ms | **0.97 %** | saving = Σ measured ms of the re-priced marches |
| K3 shownMarch across jobs (kernel input key) | 631 | 54 | mean 0.09, median 0.0, max 7 | 0.390 ms | 1,049 ms | **1.20 %** | Tight raise calls whose packed input an earlier job already raised; saving = Σ measured ms of those calls |
| K4 baseline across passes | 1 | 2 | mean 2.00, median 2.0, max 2 | 609.236 ms | 1,218 ms | **1.39 %** | 3 baseline jobs, median measured |
| K5 Generate ↔ advisor (exact key) | 5 | 5 | — | 0.558 ms | 3 ms | **0.00 %** | bar keys a probe job priced again |
| K5 Generate ↔ advisor (kernel input key) | 5 | 40 | 8.00 mean | 0.558 ms | 919 ms | **1.05 %** | probe Tight raises on a bar march; saving = Σ their measured ms |
| K6 sizer journals fused | — (refactor) | 5,554,819 | — | — | 109 ms | **0.13 %** | calls = sizerScore + buildStacks (one counter); ceiling = one of the two journals, trace 0.25 % of busy pool CPU for both |
