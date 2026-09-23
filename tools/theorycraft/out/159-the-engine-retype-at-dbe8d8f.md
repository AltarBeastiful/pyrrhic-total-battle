# 159 — the engine’s `retypeMarch` against 157-rated

Every march of every stop on the bar as shipped, re-typed twice: by the tool (`silver-aware.ts`, `rated` — damage, silver and queue scored) and by the engine (`src/engine/retype.ts` — `rate()` on the whole march bill). Four-march campaigns, the bar as `planCampaign` builds it today.

## Every use case

| use case | stops | marches | tool = engine (marches) | stops equal to the unit | engine pass | tool pass | gold / hired / coins movable (candidates) | rating better / equal / worse | worst |
|---|---:|---:|---:|---:|---:|---:|---|---|---:|
| first-run army, Bear V ×1 (20 000 leader | 1 | 4 | 4 of 4 | 1 of 1 | 0.04 s | 0.02 s | 0 of 2 marches | 1 / 0 / 0 | 1.59 |
| first-run army, Bear V ×2 (20 000 leader | 1 | 4 | 4 of 4 | 1 of 1 | 0.04 s | 0.02 s | 0 of 3 marches | 1 / 0 / 0 | 1.58 |
| first-run army, Bear V ×3 (20 000 leader | 2 | 8 | 8 of 8 | 2 of 2 | 0.05 s | 0.03 s | 0 of 4 marches | 2 / 0 / 0 | 1.55 |
| first-run army, Bear V ×10 (20 000 leade | 2 | 8 | 8 of 8 | 2 of 2 | 0.03 s | 0.03 s | 0 of 5 marches | 2 / 0 / 0 | 1.40 |
| first-run army, Epic Monster Hunter VI × | 4 | 16 | 16 of 16 | 4 of 4 | 0.08 s | 0.07 s | 0 of 10 marches | 4 / 0 / 0 | 0.98 |
| first-run army, monster tiers 3–5 at 900 | 5 | 20 | 20 of 20 | 5 of 5 | 0.19 s | 0.16 s | 0 of 12 marches | 5 / 0 / 0 | 0.22 |
| the 4 000-leadership case of 2026-09-15  | 3 | 12 | 12 of 12 | 3 of 3 | 0.04 s | 0.03 s | 0 of 8 marches | 3 / 0 / 0 | 2.84 |
| 2026-09-17 export, its setup (7 000 lead | 5 | 20 | 20 of 20 | 5 of 5 | 0.02 s | 0.02 s | 0 of 10 marches | 5 / 0 / 0 | 1.25 |
| 2026-09-17 export, 12 000 leadership | 4 | 16 | 16 of 16 | 4 of 4 | 0.02 s | 0.02 s | 0 of 7 marches | 4 / 0 / 0 | 3.34 |
| live account of 2026-09-18 (one hired ty | 4 | 16 | 16 of 16 | 4 of 4 | 0.01 s | 0.01 s | 0 of 10 marches | 1 / 3 / 0 | 0.00 |
| live account, evening (hunters 83, legio | 5 | 20 | 20 of 20 | 5 of 5 | 0.06 s | 0.05 s | 0 of 12 marches | 5 / 0 / 0 | 4.59 |
| Aydae alone, 4 975 (one captain, four hi | 4 | 16 | 16 of 16 | 4 of 4 | 0.02 s | 0.02 s | 0 of 8 marches | 4 / 0 / 0 | 0.03 |
| the owner’s live camp of 2026-09-18 (arb | 5 | 20 | 20 of 20 | 5 of 5 | 0.01 s | 0.01 s | 0 of 6 marches | 5 / 0 / 0 | 1.79 |
| his camp of 2026-09-19, the localStorage | 5 | 20 | 20 of 20 | 5 of 5 | 0.04 s | 0.04 s | 0 of 7 marches | 4 / 1 / 0 | 0.00 |
| his camp of 2026-09-19, as his message r | 5 | 20 | 20 of 20 | 5 of 5 | 0.01 s | 0.01 s | 0 of 12 marches | 5 / 0 / 0 | 0.75 |
| his TotalStack profile of 2026-09-19 (5  | 3 | 12 | 12 of 12 | 3 of 3 | 0.01 s | 0.02 s | 0 of 4 marches | 3 / 0 / 0 | 0.40 |
| his usual setup of 2026-09-19 (Aydae alo | 3 | 12 | 12 of 12 | 3 of 3 | 0.03 s | 0.03 s | 0 of 4 marches | 3 / 0 / 0 | 0.28 |


**Reproduction.** The engine picks the tool’s counts on **244 of 244** marches; **61 of 61** stops are the same campaign to the unit (damage, silver, gold, hired, coins, queue). Re-typed stops: **57 of 61**. Against the rows 157-rated printed (`out/157-a-silver-aware-ladder-rated.md`, 57 rows): **57** printed identically; 0 only in 157, 0 only here.

**The markers 157 left out.** Over every admissible candidate of every distinct march (124 marches), a re-typing that moves gold, the hired burn or dragon coins exists on **0**. Marches past the exhaustive walk (5,000 assignments), where the probe reads the climb only: 91; re-typings found by the climb: 77.

**The owner’s rating on every stop** (`rate(shipped, re-typed, CAMPAIGN.markerRates)` on the four-march campaign bill): **57 better, 4 equal, 0 worse** of 61; the worst is **0.00** (live account of 2026-09-18 (one hired ty SW).

**Time.** The slowest engine pass: **0.19 s** (first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)).

