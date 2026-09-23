# 160 — the rated re-typing, shipped in the engine

The bar with `retype: 'rated'` (the pass inside `planCampaign`, before S-94 and the fold) against the bar without it. Four-march campaigns, the rest of `CAMPAIGN.planFixes` and `CAMPAIGN.putBack` as shipped. Stops are matched by name; **+** better, **−** worse. Rating = `rate(off, on, CAMPAIGN.markerRates)` on the campaign bill (damage-percent equivalents).

## Every use case

| use case | stops off → on | re-typed | rated better / equal / worse | worst | most damage | least silver | fewest hired lost | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit | criteria on the new bar | pass time |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|
| first-run army, Bear V ×1 (20 000 leader | 1 → 1 | 1 | 1 / 0 / 0 | 1.59 | **18,479,500 (+1.6 %)** | 32,525,600 | 1 | 0 | 0 | **2,524 h (−0.1 %)** | **0.568 (+1.6 %)** | 112,200 | 0 | — | 1 → 3 | 0 → 0 | ✓ | 37 ms |
| first-run army, Bear V ×2 (20 000 leader | 1 → 1 | 1 | 1 / 0 / 0 | 1.58 | **18,703,900 (+1.6 %)** | 32,525,600 | 2 | 160 | 0 | **2,524 h (−0.1 %)** | **0.575 (+1.6 %)** | 168,300 | **116,899 (+1.6 %)** | — | 1 → 3 | 0 → 0 | ✓ | 49 ms |
| first-run army, Bear V ×3 (20 000 leader | 2 → 2 | 2 | 2 / 0 / 0 | 1.55 | **19,040,500 (+1.5 %)** | 32,525,600 | 3 | 0 | 0 | **2,524 h (−0.1 %)** | **0.585 (+1.5 %)** | 224,400 | **39,668 (+1.5 %)** | — | 2 → 8 | 0 → 0 | ✓ | 36 ms |
| first-run army, Bear V ×10 (20 000 leade | 2 → 2 | 2 | 2 / 0 / 0 | 1.40 | **21,290,233 (+1.9 %)** | 32,525,600 | 4 | 3,200 | 0 | **2,524 h (−0.1 %)** | **0.647 (+1.4 %)** | 776,050 | **6,581 (+1.4 %)** | — | 2 → 4 | 0 → 0 | ✓ | 38 ms |
| first-run army, Epic Monster Hunter VI × | 4 → 4 | 4 | 4 / 0 / 0 | 0.98 | **30,140,049 (+1.0 %)** | 32,525,600 | 11 | 736 | 0 | **2,524 h (−0.1 %)** | **0.922 (+1.0 %)** | 423,145 | **30,998 (+1.3 %)** | — | 5 → 7 | 0 → 0 | ✓ | 84 ms |
| first-run army, monster tiers 3–5 at 900 | 5 → 5 | 5 | 5 / 0 / 0 | 0.22 | **103,197,710 (+0.2 %)** | **34,920,400 (+0.0 %)** | 15 | 9,424 | 24,120 | **2,863 h (−0.1 %)** | **2.766 (+0.2 %)** | 597,802 | **9,496 (+0.3 %)** | **3,816 (+0.2 %)** | 0 → 0 | 3 → 3 | ✓ | 200 ms |
| the 4 000-leadership case of 2026-09-15  | 3 → 3 | 2 | 2 / 1 / 0 | 0.00 | **8,985,057 (+5.5 %)** | 3,820,600 | 19 | 736 | 0 | 238 h | **1.476 (+5.4 %)** | 265,255 | **7,254 (+2.4 %)** | — | 6 → 10 | 0 → 0 | ✓ | 46 ms |
| 2026-09-17 export, its setup (7 000 lead | 5 → 5 | 4 | 4 / 1 / 0 | 0.00 | **24,936,555 (+5.8 %)** | 8,695,000 | 26 | 2,112 | 0 | 583 h | **2.216 (+6.7 %)** | 357,360 | **7,252 (+1.6 %)** | — | 6 → 6 | 3 → 3 | ✓ | 38 ms |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 3 | 3 / 1 / 0 | 0.00 | **34,617,571 (+8.3 %)** | 12,129,500 | 30 | 2,408 | 0 | 814 h | **1.833 (+4.5 %)** | 369,197 | **9,304 (+3.3 %)** | — | 3 → 3 | 2 → 2 | ✓ | 35 ms |
| live account of 2026-09-18 (one hired ty | 4 → 4 | 0 | 0 / 4 / 0 | 0.00 | 29,743,332 | 18,959,900 | 20 | 1,368 | 0 | 1,317 h | 0.963 | 317,110 | 16,063 | — | 9 → 9 | 0 → 0 | ✓ | 10 ms |
| live account, evening (hunters 83, legio | 5 → 5 | 4 | 4 / 1 / 0 | 0.00 | **34,784,291 (+9.7 %)** | 12,339,900 | 32 | 2,296 | 0 | 814 h | **1.985 (+11.1 %)** | **332,927 (+10.4 %)** | **8,941 (+6.7 %)** | — | 1 → 6 | 0 → 0 | ✓ | 70 ms |
| Aydae alone, 4 975 (one captain, four hi | 4 → 4 | 4 | 4 / 0 / 0 | 0.03 | **18,750,522 (+0.0 %)** | **5,777,000 (−0.2 %)** | 19 | 1,288 | 0 | **323 h (+0.3 %)** | **2.089 (+0.1 %)** | 325,749 | **7,337 (+0.2 %)** | — | 0 → 0 | 0 → 0 | ✓ | 21 ms |
| the owner’s live camp of 2026-09-18 (arb | 5 → 5 | 4 | 4 / 1 / 0 | 0.00 | **40,085,840 (+1.4 %)** | 6,773,900 | 16 | 1,448 | 0 | **476 h (+0.1 %)** | **3.236 (+1.4 %)** | **257,643 (+10.7 %)** | **6,092 (+6.8 %)** | — | 0 → 0 | 0 → 0 | ✓ | 7 ms |
| his camp of 2026-09-19, the localStorage | 5 → 5 | 3 | 3 / 2 / 0 | 0.00 | 23,589,127 | 7,313,300 | 6 | 392 | 0 | **510 h (−0.1 %)** | 1.808 | 318,189 | **17,713 (+4.6 %)** | — | 2 → 2 | 1 → 1 | ✓ | 39 ms |
| his camp of 2026-09-19, as his message r | 5 → 5 | 4 | 4 / 0 / 0 | 0.75 | **11,587,344 (+0.0 %)** | **7,741,400 (+7.5 %)** | 15 | 1,056 | 0 | **657 h (+13.1 %)** | **1.167 (+9.2 %)** | 258,218 | **7,011 (+0.0 %)** | — | 2 → 2 | 1 → 1 | ✓ | 11 ms |
| his TotalStack profile of 2026-09-19 (5  | 3 → 3 | 2 | 2 / 1 / 0 | 0.00 | **8,443,234 (+0.4 %)** | 4,431,600 | 7 | 480 | 3,840 | 279 h | 1.110 | 131,856 | 10,248 | **2,199 (+0.4 %)** | 2 → 2 | 1 → 1 | ✓ | 20 ms |
| his usual setup of 2026-09-19 (Aydae alo | 3 → 3 | 3 | 3 / 0 / 0 | 0.28 | **11,756,170 (+0.3 %)** | **6,132,900 (−0.1 %)** | 5 | 352 | 3,960 | **375 h (+0.0 %)** | **1.419 (+0.6 %)** | 422,679 | **23,327 (+0.3 %)** | **2,721 (+0.3 %)** | 5 → 5 | 2 → 2 | ✓ | 18 ms |


**Stops**: 61 without the pass, 61 with it; 48 carry a re-typing. **The owner’s rating, stop by stop** (60 matched by name): **48 better, 12 equal, 0 worse**; the worst 0.00 (the 4 000-leadership case of 2026-09-15  SS). Stops whose campaign damage fell: 0. **8 of 17** use cases read no worse on any of the ten readings. **TotalStack at matched spend**: 47 / 13 → 70 / 13 (dominated / no stop fits). Use cases where a bar criterion breaks with the pass: 0.

| reading | use cases better | use cases worse |
|---|---:|---:|
| most damage | 15 | 0 |
| least silver | 2 | 2 |
| fewest hired lost | 0 | 0 |
| least gold | 0 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 4 | 7 |
| dmg a silver | 14 | 0 |
| dmg a merc | 2 | 0 |
| dmg a gold | 14 | 0 |
| dmg a coin | 3 | 0 |


**Stops on one bar only**:

- his camp of 2026-09-19, as his message r: SS only with the pass
- his camp of 2026-09-19, as his message r: MM only without the pass


## 158’s speed-up bill, on the engine’s bar

Every stop of both bars, one campaign each (the stop counts differ when the fold chose differently):

| | without the pass | with it | change |
|---|---:|---:|---:|
| queue, summed | 88,163 h | 86,993 h | -1.33 % |
| speed-ups consumed, first campaign, summed | 88,172 h | 87,001 h | -1.33 % |
| waste in that | 0.01 % | 0.01 % | |
| campaigns the stock pays, summed over stops | 692 | 705 | 1.88 % |

Matched stops the stock pays fewer whole campaigns of: **1**:

- first-run army, Epic Monster Hunter VI ×83 (20 AI: 5 → 4


## Time

The pass as the engine clocks it (`CampaignPlan.retype.ms`): slowest **200 ms** (first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)). Runs its deadline cut: 0.


## Against 157 and 158

157-rated re-typed the shipped bar after the fact: **57 of 61 stops better, 0 worse**, TotalStack **47 → 70** dominated (13 no fit), and — its own table — least silver worse on **9** use cases and the shortest queue on **11**. 158 billed it: queue **−0.67 %**, campaigns 692 → 704. Here the pass is inside the engine, which differs from 157 in two ways. (1) **The readings are guarded** (`keepReadings` in `planCampaign`): a stop whose re-typing costs the bar a reading it held — almost always the thrift end giving up a little silver or queue for damage — keeps its generated march; that is why fewer stops carry a re-typing and why TotalStack dominates fewer rows than 157’s 70. The unguarded run is kept as `160-the-retype-shipped-unguarded.md`. (2) **The fold chooses on re-typed campaigns**, so on some armies the bar holds a different set of stops (listed above); the speed-up bill is summed over each bar’s own stops, which is why its queue change is not 158’s. On the 7 000 export and the evening account the re-typed steady max beats the `all-in` outright (more damage, less silver, less burn), so S-94 drops it and the fold keeps “more mercs” instead; a variant that handed the steady max its generated march back to save the `all-in` made the fold drop the steady max instead (TotalStack 62 / 13, the same number of pins moved) and was not kept. (3) **A silver saver is never re-typed to more silver**, campaign or march (plan-criteria’s silver-saver rule; the live account of 2026-09-18 moved +3 400 a march otherwise).


## Every stop the pass changed

| use case | stop | troops off (first march) | troops on | damage | silver | dmg a silver | queue | rating |
|---|---|---|---|---|---|---|---|---:|
| first-run army, Bear V ×1 (20 000  | SW | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 18,189,008 → 18,479,500 | 32,525,600 → 32,525,600 | 0.559 → 0.568 | 2,522 h → 2,524 h | 1.59 |
| first-run army, Bear V ×2 (20 000  | SW | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 18,413,408 → 18,703,900 | 32,525,600 → 32,525,600 | 0.566 → 0.575 | 2,522 h → 2,524 h | 1.58 |
| first-run army, Bear V ×3 (20 000  | SW | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 18,413,408 → 18,703,900 | 32,525,600 → 32,525,600 | 0.566 → 0.575 | 2,522 h → 2,524 h | 1.58 |
| first-run army, Bear V ×3 (20 000  | AI | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 18,750,008 → 19,040,500 | 32,525,600 → 32,525,600 | 0.576 → 0.585 | 2,522 h → 2,524 h | 1.55 |
| first-run army, Bear V ×10 (20 000 | SW | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 20,769,608 → 21,060,100 | 32,525,600 → 32,525,600 | 0.639 → 0.647 | 2,522 h → 2,524 h | 1.40 |
| first-run army, Bear V ×10 (20 000 | AI | archer-1 5,573, archer-2 3,090, spearman-2 3,084, rider-2 1,539, archer-3 1,728, spearman-3 1,725, rider-3 861 | spearman-2 3,097, spearman-3 1,739, archer-2 3,084, rider-2 1,539, archer-1 5,530, rider-3 863, archer-3 1,722 | 20,893,375 → 21,290,233 | 36,013,400 → 36,008,300 | 0.580 → 0.591 | 3,417 h → 3,423 h | 1.90 |
| first-run army, Epic Monster Hunte | HS | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 22,524,152 → 22,814,644 | 32,525,600 → 32,525,600 | 0.693 → 0.701 | 2,522 h → 2,524 h | 1.29 |
| first-run army, Epic Monster Hunte | SW | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 28,655,444 → 28,945,936 | 32,525,600 → 32,525,600 | 0.881 → 0.890 | 2,522 h → 2,524 h | 1.01 |
| first-run army, Epic Monster Hunte | MX | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 29,691,713 → 29,982,205 | 32,525,600 → 32,525,600 | 0.913 → 0.922 | 2,522 h → 2,524 h | 0.98 |
| first-run army, Epic Monster Hunte | AI | archer-1 3,589, spearman-1 3,582, rider-1 1,788, archer-2 1,982, spearman-2 1,979, rider-2 987, archer-3 1,108, spearman-3 1,106, rider-3 552 | spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 | 29,841,879 → 30,140,049 | 33,291,200 → 33,289,200 | 0.896 → 0.905 | 2,718 h → 2,722 h | 1.00 |
| first-run army, monster tiers 3–5  | HS | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 81,258,598 → 81,548,470 | 34,921,200 → 34,920,400 | 2.327 → 2.335 | 2,861 h → 2,863 h | 0.36 |
| first-run army, monster tiers 3–5  | SW | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 89,196,808 → 89,486,680 | 35,230,800 → 35,230,000 | 2.532 → 2.540 | 2,911 h → 2,913 h | 0.32 |
| first-run army, monster tiers 3–5  | MM | swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468 | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 | 93,298,414 → 93,588,286 | 35,230,800 → 35,230,000 | 2.648 → 2.656 | 2,911 h → 2,913 h | 0.31 |
| first-run army, monster tiers 3–5  | MX | archer-1 3,589, spearman-1 3,582, rider-1 1,788, archer-2 1,982, spearman-2 1,979, rider-2 987, archer-3 1,108, spearman-3 1,106, rider-3 552 | spearman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 | 97,458,367 → 97,759,924 | 36,436,800 → 36,432,700 | 2.675 → 2.683 | 3,210 h → 3,215 h | 0.31 |
| first-run army, monster tiers 3–5  | AI | swordsman-1 3,589, archer-1 3,582, rider-1 1,788, archer-2 1,982, spearman-2 1,979, rider-2 987, archer-3 1,108, spearman-3 1,106, rider-3 552 | swordsman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 | 102,971,902 → 103,197,710 | 37,316,000 → 37,309,700 | 2.759 → 2.766 | 3,439 h → 3,444 h | 0.22 |
| the 4 000-leadership case of 2026- | SW | swordsman-1 564, archer-1 752, spearman-1 562, rider-1 375, archer-2 416, spearman-2 310, rider-2 207, rider-3 116 | swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413 | 8,222,546 → 8,530,502 | 6,083,200 → 6,087,200 | 1.352 → 1.401 | 380 h → 381 h | 3.72 |
| the 4 000-leadership case of 2026- | AI | swordsman-1 564, archer-1 752, spearman-1 562, rider-1 375, archer-2 416, spearman-2 310, rider-2 207, rider-3 116 | rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, rider-2 208, archer-1 746, archer-2 414, rider-3 116 | 8,519,930 → 8,985,057 | 6,083,200 → 6,085,400 | 1.401 → 1.476 | 380 h → 381 h | 5.45 |
| 2026-09-17 export, its setup (7 00 | HS | spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740 | spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740 | 15,079,846 → 15,315,363 | 10,186,900 → 10,187,600 | 1.480 → 1.503 | 683 h → 683 h | 1.56 |
| 2026-09-17 export, its setup (7 00 | SW | spearman-1 1,337, spearman-2 728, rider-2 391, rider-1 691, archer-1 1,520, rider-3 207, archer-2 812 | spearman-1 1,337, spearman-2 728, rider-2 391, rider-1 691, archer-1 1,520, rider-3 207, archer-2 812 | 18,796,348 → 19,031,865 | 10,906,900 → 10,907,600 | 1.723 → 1.745 | 731 h → 731 h | 1.25 |
| 2026-09-17 export, its setup (7 00 | MX | archer-1 1,569, spearman-1 1,272, rider-1 696, archer-2 866, spearman-2 703, rider-2 384, rider-3 215 | spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215 | 22,770,620 → 24,291,732 | 10,957,600 → 10,960,100 | 2.078 → 2.216 | 739 h → 740 h | 6.67 |
| 2026-09-17 export, its setup (7 00 | AI | archer-2 2,932, rider-2 1,303, rider-3 731 | archer-2 2,190, spearman-2 1,776, rider-3 547, rider-2 969 | 23,563,675 → 24,936,555 | 15,169,600 → 12,715,900 | 1.553 → 1.961 | 1,790 h → 1,213 h | 17.52 |
| 2026-09-17 export, 12 000 leadersh | HS | spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303 | spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303 | 21,679,374 → 22,404,202 | 17,808,200 → 17,808,900 | 1.217 → 1.258 | 1,194 h → 1,195 h | 3.34 |
| 2026-09-17 export, 12 000 leadersh | SW | archer-1 2,687, spearman-1 2,179, rider-1 1,193, archer-2 1,485, spearman-2 1,205, rider-2 659, rider-3 370 | archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658 | 31,546,458 → 34,445,770 | 18,790,400 → 18,793,200 | 1.679 → 1.833 | 1,268 h → 1,269 h | 9.19 |
| 2026-09-17 export, 12 000 leadersh | MX | rider-1 2,007, archer-2 2,499, spearman-2 2,027, rider-2 1,108, rider-3 622 | spearman-1 3,659, spearman-2 2,032, rider-2 1,112, rider-3 624, archer-2 2,483 | 31,963,845 → 34,617,571 | 21,035,600 → 20,720,700 | 1.520 → 1.671 | 1,814 h → 1,811 h | 8.61 |
| live account, evening (hunters 83, | HS | archer-1 2,306, rider-1 923, spearman-2 979, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464 | archer-1 2,306, spearman-2 1,000, rider-1 905, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464 | 19,234,820 → 20,528,010 | 15,338,100 → 15,336,600 | 1.254 → 1.338 | 1,010 h → 1,013 h | 6.72 |
| live account, evening (hunters 83, | SW | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537 | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537 | 28,140,302 → 29,432,388 | 17,072,400 → 17,071,800 | 1.648 → 1.724 | 1,124 h → 1,125 h | 4.59 |
| live account, evening (hunters 83, | MX | archer-1 2,560, spearman-1 2,030, rider-1 1,040, archer-2 1,414, spearman-2 1,122, rider-2 575, rider-3 322 | archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322 | 30,693,083 → 34,103,988 | 17,179,200 → 17,179,800 | 1.787 → 1.985 | 1,149 h → 1,150 h | 11.11 |
| live account, evening (hunters 83, | AI | spearman-1 3,050, rider-1 1,563, archer-2 2,124, rider-2 865, rider-3 485 | spearman-1 3,476, spearman-2 1,931, rider-2 989, rider-3 555, archer-2 2,410 | 31,714,657 → 34,784,291 | 18,768,000 → 19,233,100 | 1.690 → 1.809 | 1,539 h → 1,667 h | 8.49 |
| Aydae alone, 4 975 (one captain, f | HS | swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, rider-3 81, archer-2 283, rider-2 139 | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, archer-2 288, rider-2 142, rider-3 79 | 9,427,601 → 9,450,218 | 5,764,300 → 5,777,000 | 1.636 → 1.636 | 324 h → 323 h | 0.20 |
| Aydae alone, 4 975 (one captain, f | SW | archer-1 1,004, spearman-1 1,002, rider-1 500, archer-2 554, spearman-2 553, rider-2 276, rider-3 155 | spearman-1 1,004, archer-1 1,002, rider-2 278, rider-1 499, spearman-2 553, archer-2 552, rider-3 155 | 15,533,933 → 15,598,199 | 7,682,800 → 7,684,400 | 2.022 → 2.030 | 500 h → 500 h | 0.41 |
| Aydae alone, 4 975 (one captain, f | MX | archer-1 2,058, archer-2 1,141, rider-2 569, rider-3 319 | archer-1 2,058, rider-3 321, archer-2 1,138, rider-2 568 | 17,630,102 → 17,649,575 | 8,448,400 → 8,449,700 | 2.087 → 2.089 | 696 h → 696 h | 0.10 |
| Aydae alone, 4 975 (one captain, f | AI | archer-2 1,945, rider-2 970, rider-3 545 | spearman-2 1,945, rider-3 546, archer-2 1,938 | 18,744,735 → 18,750,522 | 11,240,800 → 11,241,200 | 1.668 → 1.668 | 1,425 h → 1,425 h | 0.03 |
| the owner’s live camp of 2026-09-1 | HS | archer-1 1,107, rider-1 443, spearman-2 470, spearman-1 829, archer-2 568, rider-3 127, rider-2 223 | archer-1 1,107, rider-1 443, spearman-1 846, spearman-2 462, archer-2 568, rider-2 226, rider-3 126 | 8,260,768 → 8,820,632 | 7,241,900 → 7,251,100 | 1.141 → 1.216 | 477 h → 476 h | 6.75 |
| the owner’s live camp of 2026-09-1 | SW | archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370 | archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370 | 15,306,859 → 15,862,148 | 9,849,200 → 9,850,300 | 1.554 → 1.610 | 1,024 h → 1,025 h | 3.62 |
| the owner’s live camp of 2026-09-1 | MM | rider-3 2,441 | rider-3 2,441 | 22,056,001 → 22,611,290 | 12,194,900 → 12,196,000 | 1.809 → 1.854 | 1,839 h → 1,839 h | 2.52 |
| the owner’s live camp of 2026-09-1 | MX | rider-3 2,487 | rider-3 2,487 | 39,530,551 → 40,085,840 | 12,388,100 → 12,389,200 | 3.191 → 3.236 | 1,871 h → 1,871 h | 1.40 |
| his camp of 2026-09-19, the localS | HS | archer-1 1,208, spearman-2 523, spearman-1 923, rider-1 464, archer-2 620, rider-3 139, rider-2 243 | archer-1 1,208, spearman-2 523, rider-1 475, spearman-1 904, archer-2 620, rider-2 248, rider-3 137 | 6,638,052 → 6,943,378 | 7,723,100 → 7,733,000 | 0.860 → 0.898 | 510 h → 510 h | 4.57 |
| his camp of 2026-09-19, the localS | SW | spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057 | spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057 | 9,068,238 → 9,367,909 | 8,746,700 → 8,747,300 | 1.037 → 1.071 | 760 h → 760 h | 3.30 |
| his camp of 2026-09-19, the localS | MM | rider-2 1,593, rider-3 894 | spearman-2 3,104, rider-3 894 | 13,842,678 → 14,142,349 | 10,476,500 → 10,354,100 | 1.321 → 1.366 | 1,234 h → 1,222 h | 2.42 |
| his camp of 2026-09-19, as his mes | HS | archer-1 1,438, rider-2 319, spearman-2 611, rider-1 553, archer-2 738, rider-3 166 | spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166 | 7,402,685 → 7,403,726 | 8,369,100 → 8,072,700 | 0.885 → 0.917 | 756 h → 747 h | 0.75 |
| his camp of 2026-09-19, as his mes | SW | rider-1 828, archer-2 1,125, spearman-2 893, rider-2 457, rider-3 256 | spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116 | 10,156,338 → 11,049,924 | 9,503,600 → 9,468,000 | 1.069 → 1.167 | 967 h → 965 h | 8.88 |
| his camp of 2026-09-19, as his mes | MX | archer-2 2,246, rider-2 914, rider-3 513 | spearman-2 1,787, rider-3 514, rider-2 913 | 11,196,175 → 11,198,137 | 11,037,400 → 10,310,100 | 1.014 → 1.086 | 1,328 h → 1,255 h | 1.47 |
| his camp of 2026-09-19, as his mes | AI | spearman-2 1,962, rider-2 1,005, rider-3 564 | spearman-2 1,962, rider-3 565, rider-2 1,004 | 11,585,381 → 11,587,344 | 11,202,400 → 10,702,600 | 1.034 → 1.083 | 1,354 h → 1,304 h | 1.00 |
| his TotalStack profile of 2026-09- | SW | archer-1 1,053, spearman-1 1,051, rider-1 525, archer-2 583, spearman-2 582, rider-2 290, rider-3 163 | spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163 | 8,182,228 → 8,250,733 | 8,340,000 → 8,344,200 | 0.981 → 0.989 | 570 h → 571 h | 0.82 |
| his TotalStack profile of 2026-09- | MX | archer-1 1,316, rider-1 658, archer-2 730, spearman-2 729, rider-2 363, rider-3 204 | spearman-2 733, archer-2 732, rider-2 365, archer-1 1,310, rider-1 654, rider-3 204 | 8,408,431 → 8,443,234 | 8,702,400 → 8,706,000 | 0.966 → 0.970 | 658 h → 660 h | 0.40 |
| his usual setup of 2026-09-19 (Ayd | HS | swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, archer-2 289, rider-2 141, rider-3 78 | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, rider-3 82, archer-2 282, rider-2 139 | 8,183,996 → 8,211,151 | 6,127,800 → 6,132,900 | 1.336 → 1.339 | 375 h → 375 h | 0.32 |
| his usual setup of 2026-09-19 (Ayd | SW | swordsman-1 1,253, archer-1 797, spearman-1 795, rider-1 396, archer-2 440, spearman-2 439, rider-2 219, rider-3 123 | swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123 | 11,417,051 → 11,485,771 | 8,090,400 → 8,092,800 | 1.411 → 1.419 | 506 h → 507 h | 0.59 |
| his usual setup of 2026-09-19 (Ayd | MX | archer-1 1,313, rider-1 654, archer-2 726, spearman-2 725, rider-2 361, rider-3 203 | spearman-2 730, rider-2 364, archer-2 726, rider-1 653, archer-1 1,300, rider-3 203 | 11,721,371 → 11,756,170 | 8,695,200 → 8,698,800 | 1.348 → 1.351 | 661 h → 663 h | 0.28 |

