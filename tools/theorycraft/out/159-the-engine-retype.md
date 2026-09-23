# 159 — the engine’s `retypeMarch` against 157-rated

Every march of every stop on the bar as shipped, re-typed twice: by the tool (`silver-aware.ts`, `rated` — damage, silver and queue scored) and by the engine (`src/engine/retype.ts` — `rate()` on the whole march bill). Four-march campaigns, the bar as `planCampaign` builds it today.

## Every use case

| use case | stops | marches | tool = engine (marches) | stops equal to the unit | engine pass | tool pass | gold / hired / coins movable (candidates) | rating better / equal / worse | worst |
|---|---:|---:|---:|---:|---:|---:|---|---|---:|
| first-run army, Bear V ×1 (20 000 leader | 1 | 4 | 4 of 4 | 1 of 1 | 0.04 s | 0.02 s | 0 of 2 marches | 1 / 0 / 0 | 1.59 |
| first-run army, Bear V ×2 (20 000 leader | 1 | 4 | 4 of 4 | 1 of 1 | 0.03 s | 0.02 s | 0 of 3 marches | 1 / 0 / 0 | 1.58 |
| first-run army, Bear V ×3 (20 000 leader | 2 | 8 | 8 of 8 | 2 of 2 | 0.03 s | 0.03 s | 0 of 4 marches | 2 / 0 / 0 | 1.55 |
| first-run army, Bear V ×10 (20 000 leade | 2 | 8 | 8 of 8 | 2 of 2 | 0.03 s | 0.03 s | 0 of 5 marches | 2 / 0 / 0 | 1.40 |
| first-run army, Epic Monster Hunter VI × | 3 | 12 | 12 of 12 | 3 of 3 | 0.05 s | 0.04 s | 0 of 6 marches | 3 / 0 / 0 | 0.98 |
| first-run army, monster tiers 3–5 at 900 | 5 | 20 | 20 of 20 | 5 of 5 | 0.19 s | 0.16 s | 0 of 12 marches | 5 / 0 / 0 | 0.22 |
| the 4 000-leadership case of 2026-09-15  | 3 | 12 | 12 of 12 | 3 of 3 | 0.04 s | 0.03 s | 0 of 8 marches | 3 / 0 / 0 | 2.84 |
| 2026-09-17 export, its setup (7 000 lead | 5 | 20 | 20 of 20 | 5 of 5 | 0.02 s | 0.02 s | 0 of 10 marches | 5 / 0 / 0 | 1.25 |
| 2026-09-17 export, 12 000 leadership | 4 | 16 | 16 of 16 | 4 of 4 | 0.02 s | 0.02 s | 0 of 7 marches | 4 / 0 / 0 | 3.34 |
| live account of 2026-09-18 (one hired ty | 4 | 16 | 16 of 16 | 4 of 4 | 0.01 s | 0.01 s | 0 of 10 marches | 1 / 3 / 0 | 0.00 |
| live account, evening (hunters 83, legio | 5 | 20 | 20 of 20 | 5 of 5 | 0.05 s | 0.05 s | 0 of 12 marches | 5 / 0 / 0 | 4.59 |
| Aydae alone, 4 975 (one captain, four hi | 4 | 16 | 16 of 16 | 4 of 4 | 0.02 s | 0.02 s | 0 of 8 marches | 4 / 0 / 0 | 0.03 |
| the owner’s live camp of 2026-09-18 (arb | 5 | 20 | 20 of 20 | 5 of 5 | 0.01 s | 0.01 s | 0 of 6 marches | 5 / 0 / 0 | 1.79 |
| his camp of 2026-09-19, the localStorage | 5 | 20 | 20 of 20 | 5 of 5 | 0.04 s | 0.03 s | 0 of 7 marches | 4 / 1 / 0 | 0.00 |
| his camp of 2026-09-19, as his message r | 5 | 20 | 20 of 20 | 5 of 5 | 0.01 s | 0.01 s | 0 of 12 marches | 5 / 0 / 0 | 0.09 |
| his TotalStack profile of 2026-09-19 (5  | 3 | 12 | 12 of 12 | 3 of 3 | 0.02 s | 0.01 s | 0 of 4 marches | 3 / 0 / 0 | 0.40 |
| his usual setup of 2026-09-19 (Aydae alo | 3 | 12 | 12 of 12 | 3 of 3 | 0.01 s | 0.01 s | 0 of 4 marches | 3 / 0 / 0 | 0.28 |


**Reproduction.** The engine picks the tool’s counts on **240 of 240** marches; **60 of 60** stops are the same campaign to the unit (damage, silver, gold, hired, coins, queue). Re-typed stops: **56 of 60**. Against the rows 157-rated printed (`out/157-a-silver-aware-ladder-rated.md`, 57 rows): **54** printed identically; 3 only in 157, 2 only here.

**The markers 157 left out.** Over every admissible candidate of every distinct march (120 marches), a re-typing that moves gold, the hired burn or dragon coins exists on **0**. Marches past the exhaustive walk (5,000 assignments), where the probe reads the climb only: 87; re-typings found by the climb: 73.

**The owner’s rating on every stop** (`rate(shipped, re-typed, CAMPAIGN.markerRates)` on the four-march campaign bill): **56 better, 4 equal, 0 worse** of 60; the worst is **0.00** (live account of 2026-09-18 (one hired ty SW).

**Time.** The slowest engine pass: **0.19 s** (first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)).

## Rows that differ from 157-rated

- 157: | first-run army, Epic Monster Hunte | AI | archer-1 3,589, spearman-1 3,582, rider-1 1,788, archer-2 1,982, spearman-2 1,979, rider-2 987, archer-3 1,108, spearman-3 1,106, rider-3 552 | spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 | 29,841,879 → 30,140,049 | 33,291,200 → 33,289,200 | 0.896 → 0.905 | 2,718 h → 2,722 h |
- 157: | 2026-09-17 export, its setup (7 00 | AI | archer-2 3,030, spearman-2 2,458, rider-3 756 | spearman-2 2,463, rider-3 758, rider-2 1,344 | 23,619,920 → 23,701,457 | 15,179,600 → 14,189,800 | 1.556 → 1.670 | 1,793 h → 1,695 h |
- 157: | his camp of 2026-09-19, as his mes | MM | archer-2 2,246, rider-2 914, rider-3 513 | spearman-2 1,787, rider-3 514, rider-2 913 | 10,197,781 → 10,199,743 | 10,729,000 → 10,006,200 | 0.950 → 1.019 | 1,288 h → 1,216 h |
- 159: | 2026-09-17 export, its setup (7 00 | AI | archer-2 2,932, rider-2 1,303, rider-3 731 | spearman-2 2,383, rider-3 733, rider-2 1,300 | 23,563,675 → 23,566,183 | 15,169,600 → 14,070,800 | 1.553 → 1.675 | 1,790 h → 1,681 h |
- 159: | his camp of 2026-09-19, as his mes | MM | archer-2 1,664, spearman-2 1,322, rider-2 677, rider-3 380 | archer-2 1,664, spearman-2 1,322, rider-3 381, rider-2 676 | 10,104,337 → 10,106,299 | 10,569,400 → 10,535,100 | 0.956 → 0.959 | 1,235 h → 1,232 h |

