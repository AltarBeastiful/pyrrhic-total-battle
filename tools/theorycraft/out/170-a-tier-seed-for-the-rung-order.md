# 170 — a tier seed for the rung order

W13 §2 step 2 (`docs/plans/every-ordering.md`). `orderFor` (`makeScorer`, `plan.ts`) with `CAMPAIGN.planFixes.tierSeed`: the swap climb that learns which type takes which rung climbs a second time from S-22’s tier order (the same types, the first to die on the biggest rung), and the better climb by damage is kept (the ranking’s on a tie). Each army planned twice, `budgetMs` off, the app’s fixes and put-back otherwise: **off** (the engine at HEAD) and **on**. Four-march campaigns, worst opening (`campaignOf`); `rate(off, on, markerRates)`, **+** better, **−** worse. Training bonuses are not applied (W11 §6.1).


## A. The rung orders learned, and where the tier seed’s climb won (on)


| army | rung orders learned | tier = ranking | tier climb wins | ties | ladders battled: ranking | tier (extra) | plan ms off | on | added |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 16 | 2 | 0 | 14 | 536 | 832 | 103 | 55 | -48 |
| first-run army, Bear V ×2 (20 000 leadership | 24 | 3 | 0 | 21 | 812 | 1,240 | 71 | 60 | -11 |
| first-run army, Bear V ×3 (20 000 leadership | 32 | 4 | 0 | 28 | 1,144 | 1,664 | 68 | 72 | 4 |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 5 | 0 | 30 | 969 | 1,275 | 104 | 99 | -5 |
| first-run army, Epic Monster Hunter VI ×83 ( | 39 | 5 | 0 | 34 | 1,369 | 1,897 | 199 | 176 | -23 |
| first-run army, monster tiers 3–5 at 900 dom | 36 | 5 | 0 | 31 | 1,032 | 1,412 | 8,750 | 8,534 | -216 |
| the 4 000-leadership case of 2026-09-15 (Tot | 34 | 10 | 0 | 24 | 1,141 | 1,556 | 733 | 675 | -58 |
| 2026-09-17 export, its setup (7 000 leadersh | 32 | 18 | 0 | 12 | 476 | 446 | 1,670 | 1,590 | -80 |
| 2026-09-17 export, 12 000 leadership | 23 | 10 | 0 | 7 | 430 | 376 | 1,563 | 1,587 | 24 |
| live account of 2026-09-18 (one hired type,  | 40 | 20 | 0 | 20 | 1,472 | 1,483 | 87 | 94 | 7 |
| live account, evening (hunters 83, legionari | 36 | 30 | 0 | 6 | 483 | 396 | 1,167 | 1,162 | -5 |
| Aydae alone, 4 975 (one captain, four hired  | 12 | 6 | 0 | 5 | 299 | 358 | 1,134 | 1,124 | -10 |
| the owner’s live camp of 2026-09-18 (arbales | 12 | 8 | 0 | 4 | 289 | 324 | 788 | 791 | 3 |
| his camp of 2026-09-19, the localStorage dum | 12 | 8 | 0 | 4 | 284 | 299 | 156 | 156 | 0 |
| his camp of 2026-09-19, as his message reads | 16 | 12 | 0 | 4 | 297 | 304 | 99 | 102 | 3 |
| his TotalStack profile of 2026-09-19 (5 225  | 24 | 10 | 0 | 14 | 451 | 528 | 3,046 | 3,036 | -10 |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 10 | 0 | 7 | 337 | 381 | 3,822 | 3,949 | 127 |


**Totals:** 440 rung orders learned; the tier order was the ranking’s already on 166; the tier seed’s climb ended strictly above the ranking’s on **0**, on the same damage on 265, below it on 9. Ladders battled: 11,821 by the ranking’s climb, **14,771 extra** by the tier seed’s. Plan time over every army, budget off: 23,560 ms off, 23,262 ms on (−1.26 %).


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
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/3 → 6/3 of 9 | ✓ |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/2 → 3/2 of 9 | ✓ |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 0 / 4 / 0 | 0 | SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/0 → 6/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 0 / 3 / 0 | 0 | HS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/2 → 5/2 of 9 | ✓ |


**Totals.** Stops better / equal / worse: **0 / 61 / 0**; worst 0 (first-run army, Bear V ×1 (20 000 leadership SW). TotalStack at matched spend (dominated / no fit): 70/13 → **70/13**. Armies breaking a criterion (on): 0.

| reading | armies better | armies worse |
|---|---:|---:|
| most damage | 0 | 0 |
| least silver | 0 | 0 |
| fewest hired | 0 | 0 |
| least gold | 0 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 0 | 0 |
| dmg/silver | 0 | 0 |
| dmg/hired | 0 | 0 |
| dmg/gold | 0 | 0 |
| dmg/coin | 0 | 0 |


### Every stop that moved

| army | stop off → on | first march off → on | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| — |


## C. The permanent test (§3): no march on the bar beaten by its own tier order by more than 0.01


| engine | marches | pass | fail | inadmissible twins |
|---|---:|---:|---:|---:|
| off | 139 | 22 | 0 | 117 |
| on | 139 | 22 | 0 | 117 |


**Failures (off):**

- none


**Failures (on):**

- none

