# 169 — tier order as a candidate of the re-typing

W13 §2 step 1 (`docs/plans/every-ordering.md`). `retypeMarch` with `CAMPAIGN.planFixes.tierCandidate`: the march’s own types in S-22’s kill order over its own slots (first to die on the biggest slot, each type at least its slot’s HP) always tried, and the climb seeded from the march as it is, that tier order and the ranking’s order (`rankTroops`). Every guard downstream untouched. Each army planned twice, `budgetMs` off: **off** (the engine at HEAD) and **on**. Four-march campaigns, worst opening (`campaignOf`); `rate(off, on, markerRates)`, **+** better, **−** worse. Training bonuses are not applied (W11 §6.1).


## A. The re-typing’s calls, and which start the kept assignment came from (on)


| army | re-typings | exhaustive / climb | kept: exhaustive | kept: as-is | kept: tier | kept: ranking | none positive | off: kept / none |
|---|---:|---|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership | 2 | 0 / 2 | 0 | 2 | 0 | 0 | 0 | 2 / 0 |
| first-run army, Bear V ×2 (20 000 leadership | 3 | 0 / 3 | 0 | 3 | 0 | 0 | 0 | 3 / 0 |
| first-run army, Bear V ×3 (20 000 leadership | 4 | 0 / 4 | 0 | 4 | 0 | 0 | 0 | 4 / 0 |
| first-run army, Bear V ×10 (20 000 leadershi | 6 | 0 / 6 | 0 | 6 | 0 | 0 | 0 | 6 / 0 |
| first-run army, Epic Monster Hunter VI ×83 ( | 10 | 0 / 10 | 0 | 10 | 0 | 0 | 0 | 10 / 0 |
| first-run army, monster tiers 3–5 at 900 dom | 12 | 0 / 12 | 0 | 12 | 0 | 0 | 0 | 12 / 0 |
| the 4 000-leadership case of 2026-09-15 (Tot | 8 | 0 / 8 | 0 | 8 | 0 | 0 | 0 | 8 / 0 |
| 2026-09-17 export, its setup (7 000 leadersh | 15 | 6 / 9 | 1 | 3 | 5 | 3 | 3 | 12 / 3 |
| 2026-09-17 export, 12 000 leadership | 13 | 5 / 8 | 5 | 5 | 0 | 0 | 3 | 10 / 3 |
| live account of 2026-09-18 (one hired type,  | 12 | 0 / 12 | 0 | 2 | 0 | 0 | 10 | 2 / 10 |
| live account, evening (hunters 83, legionari | 14 | 4 / 10 | 4 | 5 | 0 | 4 | 1 | 13 / 1 |
| Aydae alone, 4 975 (one captain, four hired  | 8 | 5 / 3 | 2 | 3 | 0 | 0 | 3 | 5 / 3 |
| the owner’s live camp of 2026-09-18 (arbales | 6 | 4 / 2 | 1 | 2 | 0 | 0 | 3 | 3 / 3 |
| his camp of 2026-09-19, the localStorage dum | 7 | 5 / 2 | 2 | 2 | 0 | 0 | 3 | 4 / 3 |
| his camp of 2026-09-19, as his message reads | 14 | 12 / 2 | 8 | 2 | 4 | 0 | 0 | 14 / 0 |
| his TotalStack profile of 2026-09-19 (5 225  | 6 | 0 / 6 | 0 | 4 | 0 | 2 | 0 | 6 / 0 |
| his usual setup of 2026-09-19 (Aydae alone,  | 8 | 4 / 4 | 3 | 4 | 0 | 0 | 1 | 7 / 1 |


**Totals:** 148 re-typings, 45 exhaustive / 103 climb; kept from the exhaustive walk 26, as-is 77, tier 9, ranking 9; none positive 27. A start is credited with an assignment it battled first (the three climbs share one memo, as-is climbed before tier, tier before ranking); “tier” includes the tier candidate itself, tried before any search.


## B. The gate: every stop against HEAD


| army | stops off → on | better / equal / worse | worst | per stop | most damage | least silver | fewest hired | least gold | fewest coins | shortest queue | dmg/silver | dmg/hired | dmg/gold | dmg/coin | TS matched off → on | criteria on |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/0 → 8/0 of 9 | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/0 → 4/0 of 9 | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/0 → 7/0 of 9 | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SW 0, MM 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/3 → 0/3 of 3 | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10/0 → 10/0 of 10 | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 2 / 3 / 0 | 0 | HS 0, SS 0, SW 0, MX +0.04, AI +0.03 | **+0.04 %** | 0 | 0 | 0 | 0 | 0 | **+0.05 %** | 0 | 0 | 0 | 6/3 → 6/3 of 9 | ✓ |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/2 → 3/2 of 9 | ✓ |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 0 / 4 / 0 | 0 | SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 3 / 2 / 0 | 0 | HS +0.23, SS 0, SW +0.16, MX +0.14, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+0.13 %** | 0 | **+0.23 %** | 0 | 6/0 → 6/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 2 / 3 / 0 | 0 | HS 0, SS 0, SW 0, MX +0.02, AI +0.01 | **+0.02 %** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 1 / 2 / 0 | 0 | SS 0, SW +0.00, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 0 / 3 / 0 | 0 | HS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/2 → 5/2 of 9 | ✓ |


**Totals.** Stops better / equal / worse: **8 / 53 / 0**; worst 0 (first-run army, Bear V ×1 (20 000 leadership SW). TotalStack at matched spend (dominated / no fit): 70/13 → **70/13**. Armies breaking a criterion (on): 0.

| reading | armies better | armies worse |
|---|---:|---:|
| most damage | 2 | 0 |
| least silver | 0 | 0 |
| fewest hired | 0 | 0 |
| least gold | 0 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 0 | 0 |
| dmg/silver | 2 | 0 |
| dmg/hired | 0 | 0 |
| dmg/gold | 1 | 0 |
| dmg/coin | 0 | 0 |


### Every stop that moved

| army | stop off → on | first march off → on | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| 2026-09-17 export, its setup (7 000 leadersh | MX → MX | spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215, legionary-6 33*, epic-monster-hunter-6 38*, arbalester-6 40*, chariot-6 16* → spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215, legionary-6 33*, epic-monster-hunter-6 38*, arbalester-6 40*, chariot-6 16* | 24,291,732 → 24,300,665 | 10,960,100 → 10,959,000 | 55 → 55 | 4,000 → 4,000 | 740 → 740 | +0.04 |
| 2026-09-17 export, its setup (7 000 leadersh | AI → AI | archer-2 2,190, spearman-2 1,776, rider-3 547, rider-2 969, epic-monster-hunter-6 97*, legionary-6 42*, arbalester-6 50*, chariot-6 20* → archer-2 2,190, spearman-2 1,776, rider-3 547, rider-2 969, epic-monster-hunter-6 97*, legionary-6 42*, arbalester-6 50*, chariot-6 20* | 24,936,555 → 24,945,884 | 12,715,900 → 12,717,200 | 73 → 73 | 5,360 → 5,360 | 1,213 → 1,213 | +0.03 |
| live account, evening (hunters 83, legionari | HS → HS | archer-1 2,306, spearman-2 1,000, rider-1 905, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464, chariot-6 8*, legionary-6 10*, epic-monster-hunter-6 10*, arbalester-6 10* → archer-1 2,306, spearman-2 1,000, rider-1 905, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464, chariot-6 8*, legionary-6 10*, epic-monster-hunter-6 10*, arbalester-6 10* | 20,528,010 → 20,575,534 | 15,336,600 → 15,338,400 | 32 → 32 | 2,296 → 2,296 | 1,013 → 1,014 | +0.23 |
| live account, evening (hunters 83, legionari | SW → SW | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38* → archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38* | 29,432,388 → 29,479,912 | 17,071,800 → 17,073,600 | 61 → 61 | 4,056 → 4,056 | 1,125 → 1,125 | +0.16 |
| live account, evening (hunters 83, legionari | MX → MX | archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 52*, epic-monster-hunter-6 61*, arbalester-6 50*, chariot-6 8* → archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 52*, epic-monster-hunter-6 61*, arbalester-6 50*, chariot-6 8* | 34,103,988 → 34,151,512 | 17,179,800 → 17,181,600 | 76 → 76 | 5,040 → 5,040 | 1,150 → 1,150 | +0.14 |
| his camp of 2026-09-19, as his message reads | MX → MX | spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 100* → spearman-2 1,787, rider-2 915, rider-3 514, epic-monster-hunter-6 100* | 11,054,977 → 11,058,844 | 9,891,900 → 9,897,900 | 35 → 35 | 2,504 → 2,504 | 1,113 → 1,113 | +0.02 |
| his camp of 2026-09-19, as his message reads | AI → AI | spearman-2 1,962, rider-3 565, rider-2 1,004, epic-monster-hunter-6 110* → spearman-2 1,962, rider-3 565, rider-2 1,004, epic-monster-hunter-6 110* | 11,587,344 → 11,589,922 | 10,702,600 → 10,706,600 | 41 → 41 | 2,888 → 2,888 | 1,304 → 1,305 | +0.01 |
| his TotalStack profile of 2026-09-19 (5 225  | SW → SW | spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163, epic-monster-hunter-5 49*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3* → spearman-1 1,053, rider-2 293, spearman-2 584, archer-1 1,048, rider-1 524, archer-2 580, rider-3 163, epic-monster-hunter-5 49*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3* | 8,250,733 → 8,250,940 | 8,344,200 → 8,344,200 | 19 → 19 | 1,320 → 1,320 | 571 → 571 | +0.00 |


## C. The time the pass adds (`CampaignPlan.retype.ms`, budget off)


| army | re-typing ms off | on | added | plan ms off | on | share of the 2,000 ms deadline (on) |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 30 | 28 | -2 | 92 | 55 | 1 % |
| first-run army, Bear V ×2 (20 000 leadership | 27 | 31 | 4 | 64 | 66 | 2 % |
| first-run army, Bear V ×3 (20 000 leadership | 28 | 37 | 9 | 63 | 69 | 2 % |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 42 | 7 | 89 | 89 | 2 % |
| first-run army, Epic Monster Hunter VI ×83 ( | 66 | 85 | 19 | 185 | 172 | 4 % |
| first-run army, monster tiers 3–5 at 900 dom | 145 | 230 | 85 | 8,691 | 8,578 | 12 % |
| the 4 000-leadership case of 2026-09-15 (Tot | 35 | 41 | 6 | 712 | 655 | 2 % |
| 2026-09-17 export, its setup (7 000 leadersh | 30 | 34 | 4 | 1,674 | 1,616 | 2 % |
| 2026-09-17 export, 12 000 leadership | 31 | 41 | 10 | 1,553 | 1,564 | 2 % |
| live account of 2026-09-18 (one hired type,  | 7 | 16 | 9 | 78 | 90 | 1 % |
| live account, evening (hunters 83, legionari | 54 | 71 | 17 | 1,138 | 1,156 | 4 % |
| Aydae alone, 4 975 (one captain, four hired  | 17 | 23 | 6 | 1,114 | 1,113 | 1 % |
| the owner’s live camp of 2026-09-18 (arbales | 7 | 9 | 2 | 798 | 791 | 0 % |
| his camp of 2026-09-19, the localStorage dum | 33 | 34 | 1 | 157 | 154 | 2 % |
| his camp of 2026-09-19, as his message reads | 10 | 15 | 5 | 97 | 101 | 1 % |
| his TotalStack profile of 2026-09-19 (5 225  | 18 | 28 | 10 | 3,049 | 3,070 | 1 % |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 22 | 5 | 3,871 | 3,703 | 1 % |


Worst re-typing time on: 230 ms; most added: 85 ms; the deadline in the app is RETYPE_SHARE 0.05 × 40,000 ms = 2,000 ms.


## D. The permanent test (§3): no march on the bar beaten by its own tier order by more than 0.01


| engine | marches | pass | fail | inadmissible twins |
|---|---:|---:|---:|---:|
| off | 139 | 19 | 3 | 117 |
| on | 139 | 22 | 0 | 117 |


**Failures (off):**

- his camp of 2026-09-19, as his message reads MX +0.03 (spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 100*)
- his camp of 2026-09-19, as his message reads AI +0.03 (spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 97*)
- his camp of 2026-09-19, as his message reads AI +0.03 (spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 87*)


**Inadmissible twins (off):**

- first-run army, Bear V ×1 (20 000 leadership SW: over the leadership, rate −1.49
- first-run army, Bear V ×1 (20 000 leadership SW: over the leadership, rate −1.53
- first-run army, Bear V ×2 (20 000 leadership SW: over the leadership, rate −1.46
- first-run army, Bear V ×2 (20 000 leadership SW: over the leadership, rate −1.49
- first-run army, Bear V ×2 (20 000 leadership SW: over the leadership, rate −1.53
- first-run army, Bear V ×3 (20 000 leadership SW: over the leadership, rate −1.49
- first-run army, Bear V ×3 (20 000 leadership SW: over the leadership, rate −1.53
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.42
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.46
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.49
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.53
- first-run army, Bear V ×10 (20 000 leadershi SW: over the leadership, rate −1.33
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −3.51
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −0.85
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −1.38
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −1.41
- first-run army, Epic Monster Hunter VI ×83 ( HS: over the leadership, rate −1.40
- first-run army, Epic Monster Hunter VI ×83 ( HS: over the leadership, rate −0.91
- first-run army, Epic Monster Hunter VI ×83 ( SW: over the leadership, rate −0.98
- first-run army, Epic Monster Hunter VI ×83 ( MX: over the leadership, rate −0.93
- first-run army, Epic Monster Hunter VI ×83 ( MX: over the leadership, rate −0.97
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.92
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.97
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.95
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.99
- first-run army, monster tiers 3–5 at 900 dom HS: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom HS: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom SW: over the leadership, rate −0.31
- first-run army, monster tiers 3–5 at 900 dom SW: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom MM: over the leadership, rate −0.29
- first-run army, monster tiers 3–5 at 900 dom MM: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom MX: over the leadership, rate −0.29
- first-run army, monster tiers 3–5 at 900 dom MX: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.10
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.19
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.29
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.30
- the 4 000-leadership case of 2026-09-15 (Tot SS: less damage (−3.01 %), rate −3.15
- the 4 000-leadership case of 2026-09-15 (Tot SW: over the leadership, rate −1.06
- the 4 000-leadership case of 2026-09-15 (Tot SW: over the leadership, rate −1.05
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −5.03
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −5.51
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −5.70
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −1.14
- 2026-09-17 export, its setup (7 000 leadersh HS: less damage (−12.31 %), rate −12.39
- 2026-09-17 export, its setup (7 000 leadersh HS: over the leadership, rate −0.23
- 2026-09-17 export, its setup (7 000 leadersh SS: less damage (−8.84 %), rate −8.94
- 2026-09-17 export, its setup (7 000 leadersh SS: over the leadership, rate −4.10
- 2026-09-17 export, its setup (7 000 leadersh SW: over the leadership, rate −9.81
- 2026-09-17 export, its setup (7 000 leadersh SW: over the leadership, rate −0.23
- 2026-09-17 export, its setup (7 000 leadersh MX: over the leadership, rate −0.21
- 2026-09-17 export, its setup (7 000 leadersh MX: over the leadership, rate −10.10
- 2026-09-17 export, its setup (7 000 leadersh AI: over the leadership, rate +0.00
- 2026-09-17 export, its setup (7 000 leadersh AI: over the leadership, rate −0.21
- 2026-09-17 export, its setup (7 000 leadersh AI: over the leadership, rate −7.05
- 2026-09-17 export, 12 000 leadership HS: less damage (−15.80 %), rate −15.87
- 2026-09-17 export, 12 000 leadership HS: over the leadership, rate −7.85
- 2026-09-17 export, 12 000 leadership SS: less damage (−8.81 %), rate −8.91
- 2026-09-17 export, 12 000 leadership SW: over the leadership, rate −8.27
- 2026-09-17 export, 12 000 leadership SW: over the leadership, rate −8.78
- 2026-09-17 export, 12 000 leadership MX: less damage (−7.28 %), rate −7.29
- 2026-09-17 export, 12 000 leadership MX: over the leadership, rate −8.78
- live account of 2026-09-18 (one hired type,  SS: less damage (−8.28 %), rate −8.31
- live account of 2026-09-18 (one hired type,  SS: over the leadership, rate −11.45
- live account of 2026-09-18 (one hired type,  SW: over the leadership, rate −9.32
- live account of 2026-09-18 (one hired type,  MX: over the leadership, rate −8.99
- live account of 2026-09-18 (one hired type,  MX: less damage (−8.94 %), rate −8.97
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −8.44
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −8.76
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −9.07
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −9.36
- live account, evening (hunters 83, legionari HS: less damage (−7.83 %), rate −7.86
- live account, evening (hunters 83, legionari HS: over the leadership, rate −15.18
- live account, evening (hunters 83, legionari SS: less damage (−4.96 %), rate −5.00
- live account, evening (hunters 83, legionari SS: over the leadership, rate −0.56
- live account, evening (hunters 83, legionari SW: over the leadership, rate −5.16
- live account, evening (hunters 83, legionari SW: over the leadership, rate −15.85
- live account, evening (hunters 83, legionari MX: over the leadership, rate −8.12
- live account, evening (hunters 83, legionari MX: over the leadership, rate −16.09
- live account, evening (hunters 83, legionari AI: less damage (−6.74 %), rate −6.77
- live account, evening (hunters 83, legionari AI: less damage (−7.13 %), rate −7.15
- live account, evening (hunters 83, legionari AI: less damage (−7.54 %), rate −7.56
- live account, evening (hunters 83, legionari AI: over the leadership, rate −8.55
- Aydae alone, 4 975 (one captain, four hired  HS: less damage (−0.53 %), rate −0.53
- Aydae alone, 4 975 (one captain, four hired  HS: over the leadership, rate −0.48
- Aydae alone, 4 975 (one captain, four hired  SW: over the leadership, rate −0.38
- Aydae alone, 4 975 (one captain, four hired  SW: over the leadership, rate −0.48
- Aydae alone, 4 975 (one captain, four hired  MX: over the leadership, rate −0.01
- Aydae alone, 4 975 (one captain, four hired  MX: over the leadership, rate −0.11
- Aydae alone, 4 975 (one captain, four hired  AI: over the leadership, rate −1.36
- the owner’s live camp of 2026-09-18 (arbales HS: less damage (−7.49 %), rate −7.51
- the owner’s live camp of 2026-09-18 (arbales HS: over the leadership, rate −19.90
- the owner’s live camp of 2026-09-18 (arbales SW: over the leadership, rate −19.90
- his camp of 2026-09-19, the localStorage dum HS: over the leadership, rate −10.42
- his camp of 2026-09-19, the localStorage dum HS: over the leadership, rate −13.55
- his camp of 2026-09-19, the localStorage dum SS: less damage (−12.44 %), rate −12.55
- his camp of 2026-09-19, the localStorage dum SW: over the leadership, rate −12.55
- his camp of 2026-09-19, the localStorage dum SW: over the leadership, rate −13.55
- his camp of 2026-09-19, the localStorage dum MM: over the leadership, rate −13.55
- his camp of 2026-09-19, as his message reads HS: less damage (−13.21 %), rate −13.26
- his camp of 2026-09-19, as his message reads HS: over the leadership, rate −0.96
- his camp of 2026-09-19, as his message reads SS: less damage (−8.23 %), rate −8.27
- his camp of 2026-09-19, as his message reads SW: over the leadership, rate −10.56
- his camp of 2026-09-19, as his message reads SW: over the leadership, rate −0.96
- his camp of 2026-09-19, as his message reads MX: over the leadership, rate −0.40
- his camp of 2026-09-19, as his message reads AI: over the leadership, rate +0.02
- his TotalStack profile of 2026-09-19 (5 225  SS: less damage (−0.47 %), rate −0.53
- his TotalStack profile of 2026-09-19 (5 225  SW: over the leadership, rate −0.76
- his TotalStack profile of 2026-09-19 (5 225  SW: over the leadership, rate −4.94
- his TotalStack profile of 2026-09-19 (5 225  MX: over the leadership, rate −0.22
- his TotalStack profile of 2026-09-19 (5 225  MX: over the leadership, rate −4.94
- his usual setup of 2026-09-19 (Aydae alone,  HS: less damage (−0.56 %), rate −0.59
- his usual setup of 2026-09-19 (Aydae alone,  HS: over the leadership, rate −0.63
- his usual setup of 2026-09-19 (Aydae alone,  SW: over the leadership, rate −0.57
- his usual setup of 2026-09-19 (Aydae alone,  SW: over the leadership, rate −0.63
- his usual setup of 2026-09-19 (Aydae alone,  MX: over the leadership, rate −0.17
- his usual setup of 2026-09-19 (Aydae alone,  MX: over the leadership, rate −0.63


**Failures (on):**

- none


**Inadmissible twins (on):**

- first-run army, Bear V ×1 (20 000 leadership SW: over the leadership, rate −1.49
- first-run army, Bear V ×1 (20 000 leadership SW: over the leadership, rate −1.53
- first-run army, Bear V ×2 (20 000 leadership SW: over the leadership, rate −1.46
- first-run army, Bear V ×2 (20 000 leadership SW: over the leadership, rate −1.49
- first-run army, Bear V ×2 (20 000 leadership SW: over the leadership, rate −1.53
- first-run army, Bear V ×3 (20 000 leadership SW: over the leadership, rate −1.49
- first-run army, Bear V ×3 (20 000 leadership SW: over the leadership, rate −1.53
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.42
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.46
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.49
- first-run army, Bear V ×3 (20 000 leadership AI: over the leadership, rate −1.53
- first-run army, Bear V ×10 (20 000 leadershi SW: over the leadership, rate −1.33
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −3.51
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −0.85
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −1.38
- first-run army, Bear V ×10 (20 000 leadershi AI: over the leadership, rate −1.41
- first-run army, Epic Monster Hunter VI ×83 ( HS: over the leadership, rate −1.40
- first-run army, Epic Monster Hunter VI ×83 ( HS: over the leadership, rate −0.91
- first-run army, Epic Monster Hunter VI ×83 ( SW: over the leadership, rate −0.98
- first-run army, Epic Monster Hunter VI ×83 ( MX: over the leadership, rate −0.93
- first-run army, Epic Monster Hunter VI ×83 ( MX: over the leadership, rate −0.97
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.92
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.97
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.95
- first-run army, Epic Monster Hunter VI ×83 ( AI: over the leadership, rate −0.99
- first-run army, monster tiers 3–5 at 900 dom HS: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom HS: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom SW: over the leadership, rate −0.31
- first-run army, monster tiers 3–5 at 900 dom SW: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom MM: over the leadership, rate −0.29
- first-run army, monster tiers 3–5 at 900 dom MM: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom MX: over the leadership, rate −0.29
- first-run army, monster tiers 3–5 at 900 dom MX: over the leadership, rate −0.35
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.10
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.19
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.29
- first-run army, monster tiers 3–5 at 900 dom AI: over the leadership, rate −0.30
- the 4 000-leadership case of 2026-09-15 (Tot SS: less damage (−3.01 %), rate −3.15
- the 4 000-leadership case of 2026-09-15 (Tot SW: over the leadership, rate −1.06
- the 4 000-leadership case of 2026-09-15 (Tot SW: over the leadership, rate −1.05
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −5.03
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −5.51
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −5.70
- the 4 000-leadership case of 2026-09-15 (Tot AI: over the leadership, rate −1.14
- 2026-09-17 export, its setup (7 000 leadersh HS: less damage (−12.31 %), rate −12.39
- 2026-09-17 export, its setup (7 000 leadersh HS: over the leadership, rate −0.23
- 2026-09-17 export, its setup (7 000 leadersh SS: less damage (−8.84 %), rate −8.94
- 2026-09-17 export, its setup (7 000 leadersh SS: over the leadership, rate −4.10
- 2026-09-17 export, its setup (7 000 leadersh SW: over the leadership, rate −9.81
- 2026-09-17 export, its setup (7 000 leadersh SW: over the leadership, rate −0.23
- 2026-09-17 export, its setup (7 000 leadersh MX: over the leadership, rate −0.21
- 2026-09-17 export, its setup (7 000 leadersh MX: over the leadership, rate −14.04
- 2026-09-17 export, its setup (7 000 leadersh AI: over the leadership, rate +0.00
- 2026-09-17 export, its setup (7 000 leadersh AI: over the leadership, rate −0.21
- 2026-09-17 export, its setup (7 000 leadersh AI: over the leadership, rate −7.19
- 2026-09-17 export, 12 000 leadership HS: less damage (−15.80 %), rate −15.87
- 2026-09-17 export, 12 000 leadership HS: over the leadership, rate −7.85
- 2026-09-17 export, 12 000 leadership SS: less damage (−8.81 %), rate −8.91
- 2026-09-17 export, 12 000 leadership SW: over the leadership, rate −8.27
- 2026-09-17 export, 12 000 leadership SW: over the leadership, rate −8.78
- 2026-09-17 export, 12 000 leadership MX: less damage (−7.28 %), rate −7.29
- 2026-09-17 export, 12 000 leadership MX: over the leadership, rate −8.78
- live account of 2026-09-18 (one hired type,  SS: less damage (−8.28 %), rate −8.31
- live account of 2026-09-18 (one hired type,  SS: over the leadership, rate −11.45
- live account of 2026-09-18 (one hired type,  SW: over the leadership, rate −9.32
- live account of 2026-09-18 (one hired type,  MX: over the leadership, rate −8.99
- live account of 2026-09-18 (one hired type,  MX: less damage (−8.94 %), rate −8.97
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −8.44
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −8.76
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −9.07
- live account of 2026-09-18 (one hired type,  AI: over the leadership, rate −9.36
- live account, evening (hunters 83, legionari HS: less damage (−7.83 %), rate −7.86
- live account, evening (hunters 83, legionari HS: over the leadership, rate −15.66
- live account, evening (hunters 83, legionari SS: less damage (−4.96 %), rate −5.00
- live account, evening (hunters 83, legionari SS: over the leadership, rate −0.56
- live account, evening (hunters 83, legionari SW: over the leadership, rate −5.16
- live account, evening (hunters 83, legionari SW: over the leadership, rate −16.34
- live account, evening (hunters 83, legionari MX: over the leadership, rate −8.12
- live account, evening (hunters 83, legionari MX: over the leadership, rate −16.58
- live account, evening (hunters 83, legionari AI: less damage (−6.74 %), rate −6.77
- live account, evening (hunters 83, legionari AI: less damage (−7.13 %), rate −7.15
- live account, evening (hunters 83, legionari AI: less damage (−7.54 %), rate −7.56
- live account, evening (hunters 83, legionari AI: over the leadership, rate −8.55
- Aydae alone, 4 975 (one captain, four hired  HS: less damage (−0.53 %), rate −0.53
- Aydae alone, 4 975 (one captain, four hired  HS: over the leadership, rate −0.48
- Aydae alone, 4 975 (one captain, four hired  SW: over the leadership, rate −0.38
- Aydae alone, 4 975 (one captain, four hired  SW: over the leadership, rate −0.48
- Aydae alone, 4 975 (one captain, four hired  MX: over the leadership, rate −0.01
- Aydae alone, 4 975 (one captain, four hired  MX: over the leadership, rate −0.11
- Aydae alone, 4 975 (one captain, four hired  AI: over the leadership, rate −1.36
- the owner’s live camp of 2026-09-18 (arbales HS: less damage (−7.49 %), rate −7.51
- the owner’s live camp of 2026-09-18 (arbales HS: over the leadership, rate −19.90
- the owner’s live camp of 2026-09-18 (arbales SW: over the leadership, rate −19.90
- his camp of 2026-09-19, the localStorage dum HS: over the leadership, rate −10.42
- his camp of 2026-09-19, the localStorage dum HS: over the leadership, rate −13.55
- his camp of 2026-09-19, the localStorage dum SS: less damage (−12.44 %), rate −12.55
- his camp of 2026-09-19, the localStorage dum SW: over the leadership, rate −12.55
- his camp of 2026-09-19, the localStorage dum SW: over the leadership, rate −13.55
- his camp of 2026-09-19, the localStorage dum MM: over the leadership, rate −13.55
- his camp of 2026-09-19, as his message reads HS: less damage (−13.21 %), rate −13.26
- his camp of 2026-09-19, as his message reads HS: over the leadership, rate −0.96
- his camp of 2026-09-19, as his message reads SS: less damage (−8.23 %), rate −8.27
- his camp of 2026-09-19, as his message reads SW: over the leadership, rate −10.56
- his camp of 2026-09-19, as his message reads SW: over the leadership, rate −0.96
- his camp of 2026-09-19, as his message reads MX: over the leadership, rate −0.40
- his camp of 2026-09-19, as his message reads AI: over the leadership, rate +0.02
- his TotalStack profile of 2026-09-19 (5 225  SS: less damage (−0.47 %), rate −0.53
- his TotalStack profile of 2026-09-19 (5 225  SW: over the leadership, rate −0.77
- his TotalStack profile of 2026-09-19 (5 225  SW: over the leadership, rate −4.94
- his TotalStack profile of 2026-09-19 (5 225  MX: over the leadership, rate −0.22
- his TotalStack profile of 2026-09-19 (5 225  MX: over the leadership, rate −4.94
- his usual setup of 2026-09-19 (Aydae alone,  HS: less damage (−0.56 %), rate −0.59
- his usual setup of 2026-09-19 (Aydae alone,  HS: over the leadership, rate −0.63
- his usual setup of 2026-09-19 (Aydae alone,  SW: over the leadership, rate −0.57
- his usual setup of 2026-09-19 (Aydae alone,  SW: over the leadership, rate −0.63
- his usual setup of 2026-09-19 (Aydae alone,  MX: over the leadership, rate −0.17
- his usual setup of 2026-09-19 (Aydae alone,  MX: over the leadership, rate −0.63


## E. Recorded (2026-09-24)

- **Without the own-slots twin** (the search alone, three seeds and the tier candidate): 6 better / 55 equal / 0 worse, TotalStack 70/13, no reading worse, no criterion broken; the tier seed kept nothing (as-is 77, ranking 9) and the permanent test stayed 19 pass / 3 fail. The three failures (message camp: MX’s repeat, the all-in’s last two marches) are re-typings of `archer-2 2 246, rider-2 914, rider-3 513` into `spearman-2 1 787, rider-3 514, rider-2 913`: rated on the slots of the march handed in, the kept march then stands on slots of its own (whole units), where its own tier order (rider-2 915 over rider-3 514) rates +0.03 above it. Hence the own-slots twin, offered to the kept march while it rates above it (this run): 8 / 53 / 0, 22 / 0.
- **Suite with the flag on**: 35 red / 1 161 (34 / 1 162 at HEAD); the one new red is a pin — `plan.test.ts` › the owner’s account at 7 000 leadership › the all-in is the campaign it was: 24,936,555 → 24,945,884 damage for 12,715,900 → 12,717,200 silver (rated +0.03). Without the own-slots twin the same stop moved to 24,944,758 for 12,714,600 (better on both). Workers do not re-base pins, so the flag ships **off** until the owner registers it.

