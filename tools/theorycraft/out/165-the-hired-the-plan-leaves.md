# 165 — the hired the plan leaves under its own shelter

W12 §2b. The plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march campaigns priced as the benchmark prices stops (`campaignOf`, worst opening = enemy-first journal), ranked with `rate(top, x, markerRates)` (silver 5, gold 5, hired 5, coins 8, queue 40). Hired stacks are starred. Training bonuses are not applied (W11 §6.1).


## A. The owner’s live camp of 2026-09-18

**The bar.** Top = **MX**. Every marker, four marches:

| stop | first march | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | rating vs MX |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | archer-1 1,107, rider-1 443, spearman-1 846, spearman-2 462, archer-2 568, rider-2 226, rider-3 126, bear-5 2*, legionary-6 10*, arbalester-6 10* | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 6,092 | — | -29.77 |
| SS | rider-2 909, rider-3 501, arbalester-6 66*, bear-5 8*, legionary-6 8* | 8,393,455 | 6,773,900 | 34 | 5,480 | 0 | 753 | 1.239 | 159,825 | 1,532 | — | -33.84 |
| SW | archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370, arbalester-6 76*, legionary-6 60*, bear-5 7* | 15,862,148 | 9,850,300 | 52 | 6,344 | 0 | 1,025 | 1.610 | 208,337 | 2,500 | — | -22.32 |
| MM | rider-3 2,441, arbalester-6 403*, bear-5 21*, legionary-6 10* | 22,611,290 | 12,196,000 | 142 | 18,080 | 0 | 1,839 | 1.854 | 151,032 | 1,251 | — | -23.07 |
| MX | rider-3 2,487, arbalester-6 403*, bear-5 49*, legionary-6 408* | 40,085,840 | 12,389,200 | 268 | 39,152 | 0 | 1,871 | 3.236 | 145,228 | 1,024 | — | 0.00 |

**Step 1 — the vector exists.** The S-97 pass (`shelteredMaxima`, depth 1) builds the biggest one-type tight ladder the leadership pays for — rider-3 2,487, floor 4.68M HP — and fills every hired type to `min(anchor at 3 repeats, ceil(floor / hp) − 1)`: **arbalester-6 403*, bear-5 49*, legionary-6 408***. It burns 87 chunks a march, above the winner’s own burn, so the pass hands it to `sweep` (`evaluateVector` + the winner’s rungs). The ladder-family entries carry **no shape**, so the pass never scores the ladder that defined them (`if (!shape) continue`).

**Step 2 — every shape the search scores it on loses it.**

| shape tried on the vector | what it fields (repeat) | repeat dmg | finale dmg | search total (3 + finale) | why |
|---|---|---:|---:|---:|---|
| ladders, depth 1–8 × 10 growths (`ladder`) | — | — | — | — | 0 of 80 affordable: the floor is set at (1 + gap) × the biggest hired stack = 5.84M HP, above the biggest floor the leadership pays for (4.68M) |
| sizer Elite over every troop type, the vector as caps, sheltered | legionary-6 23*, bear-5 2*, arbalester-6 30* | 2.23M | | | the sizer’s own floor is low (many stacks), so the vector is lowered back |
| sizer MS over every troop type, the vector as caps, sheltered | arbalester-6 30*, legionary-6 23*, bear-5 2* | 2.23M | | | the sizer’s own floor is low (many stacks), so the vector is lowered back |
| sizer MS relaxed over every troop type, the vector as caps, sheltered | bear-5 2*, arbalester-6 30*, legionary-6 23* | 2.23M | | | the sizer’s own floor is low (many stacks), so the vector is lowered back |
| the winner’s rungs (`WINNER_RUNGS_DEPTH`): rider-2 1,602, rider-3 883 | arbalester-6 182*, bear-5 17*, legionary-6 145* | 4.91M | — | 14.73M | the winner is the multi-stack march `consider` prefers; its floor shelters under half of the vector |
| **its own ladder**: rider-3 2,487 (never tried) | arbalester-6 403*, bear-5 49*, legionary-6 408* | 12.43M | — | 37.30M | fits: every hired stack under the one troop stack (this scorer carries no sizer, so no finale here; the plan’s is the whole-army sizer’s, Step 3) |

**Step 3 — the finale, and how the plan prices a campaign.** The plan plays 3 repeats at the three-repeat sustain (arbalester 403) and a **finale** of what is left (`finaleFor`). The finale’s ladders are sized off the biggest **leftover** stack (here legionary 879, 10.07M HP) × (1 + gap): none is affordable, so the finale is the whole-army sizer’s, which fields a token of hired. The finale is the same for every candidate of one vector, bar MX included. Unlimited bears: the plan reads stock = pool / cost (103) and sustain ∞; 164 read 103 — the same count. Four equal marches at the four-march sustain (164) and 3 + finale at the three-repeat sustain (the plan) burn the stock alike; the gap between them is the finale alone.

| campaign | marches (first · last) | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | rating vs MX | worse than MX on |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| bar MX (3 repeats + its finale) | rider-3 2,487, arbalester-6 403*, bear-5 49*, legionary-6 408* · spearman-1 921, spearman-2 511, rider-2 262, rider-1 470, archer-2 639, archer-1 1,147, rider-3 146, arbalester-6 30*, legionary-6 23*, bear-5 2* | 40,085,840 | 12,389,200 | 268 | 39,152 | 0 | 1,871 | 3.236 | 145,228 | 1,024 | — | 0.00 | — |
| the vector on its own ladder, 3 repeats + the finale the plan builds (the fix) | rider-3 2,487, arbalester-6 403*, bear-5 49*, legionary-6 408* · spearman-1 921, spearman-2 511, rider-2 262, rider-1 470, archer-2 639, archer-1 1,147, rider-3 146, arbalester-6 30*, legionary-6 23*, bear-5 2* | 40,085,840 | 12,389,200 | 268 | 39,152 | 0 | 1,871 | 3.236 | 145,228 | 1,024 | — | 0.00 | — |
| the same, the finale on its own ladder too (leftovers sheltered) | rider-3 2,487, arbalester-6 403*, bear-5 49*, legionary-6 408* · rider-3 2,487, arbalester-6 362*, bear-5 49*, legionary-6 408* | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 961 | — | 7.81 | silver, hired, gold, queue, dmg/hired, dmg/gold |
| 164’s march, 4 equal marches | rider-3 2,441, arbalester-6 371*, bear-5 48*, legionary-6 400* · rider-3 2,441, arbalester-6 371*, bear-5 48*, legionary-6 400* | 47,473,092 | 13,669,600 | 332 | 49,696 | 0 | 2,278 | 3.473 | 142,991 | 955 | — | 5.66 | silver, hired, gold, queue, dmg/hired, dmg/gold |
| its own ladder, 4-march sustain, 4 equal marches | rider-3 2,487, arbalester-6 371*, bear-5 49*, legionary-6 408* · rider-3 2,487, arbalester-6 371*, bear-5 49*, legionary-6 408* | 48,038,372 | 13,927,200 | 336 | 50,560 | 0 | 2,321 | 3.449 | 142,971 | 950 | — | 5.85 | silver, hired, gold, queue, dmg/hired, dmg/gold |

Journal (enemy first), the fix’s repeat: rider-3 4.68MHP→0 · legionary-6* 4.67MHP→1 · bear-5* 4.62MHP→1 · arbalester-6* 3.68MHP→1. No hired stack is wiped before it strikes.


## B. Every army: the top stop against the best filled march

**filled** = a stop’s first-march troops, every hired type at its four-march sustain (`largestSustained(cap, 4)`; an unlimited type at pool / cost, as 164), sheltered (`shelterCounts`), marched four times; the best of the stops by `rate(top, x)`. **S-97 d1** = the biggest one-type tight ladder the leadership pays for, the sustain sheltered under it, four times — the shape the fix scores. TS kept = TotalStack rows every stop deals less than and rates ≤ 0 against (162’s test), for the bar and for the bar plus that march. Criteria on the filled march: sheltered (yes by construction), sustained 4 marches, fields every held hired type (S-58 B).

| army | top | top dmg / hired | best filled (from) | dmg / hired | rating vs top | rating vs its own stop | worse than top on | S-97 d1 dmg / hired | S-97 d1 rating | TS kept bar → +filled → +d1 | filled fields every type |
|---|---|---:|---|---:|---:|---:|---|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership | SW | 18.48M / 1 | — | — | **—** | — |  | — | — | 0 → 0 → 0 of 3 |  |
| first-run army, Bear V ×2 (20 000 leadership | SW | 18.70M / 2 | — | — | **—** | — |  | — | — | 0 → 0 → 0 of 3 |  |
| first-run army, Bear V ×3 (20 000 leadership | AI | 19.04M / 3 | — | — | **—** | — |  | — | — | 0 → 0 → 0 of 9 |  |
| first-run army, Bear V ×10 (20 000 leadershi | AI | 21.29M / 4 | SW | 21.06M / 4 | **8.18** | 0.00 | dmg, dmg/hired | 1.05M / 4 | -106.50 | 0 → 0 → 0 of 9 | yes |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | 30.14M / 30 | HS | 29.08M / 28 | **0.98** | -31.29 | dmg, dmg/silver, dmg/hired | 3.57M / 28 | -104.00 | 0 → 0 → 0 of 9 | yes |
| first-run army, monster tiers 3–5 at 900 dom | AI | 103.20M / 34 | SW | 101.56M / 32 | **7.08** | 0.71 | dmg, dmg/coin | 4.02M / 32 | -80.12 | 0 → 0 → 0 of 3 | yes |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | 8.99M / 24 | SW | 8.16M / 16 | **0.71** | 1.37 | dmg, silver, queue, dmg/silver | 1.85M / 16 | -96.06 | 0 → 0 → 0 of 10 | yes |
| 2026-09-17 export, its setup (7 000 leadersh | AI | 24.94M / 73 | MX | 22.63M / 52 | **6.03** | -4.79 | dmg | 9.80M / 80 | -79.54 | 0 → 0 → 0 of 9 | yes |
| 2026-09-17 export, 12 000 leadership | MX | 34.62M / 82 | SW | 32.91M / 64 | **6.13** | -2.67 | dmg | 9.80M / 80 | -89.13 | 0 → 0 → 0 of 9 | yes |
| live account of 2026-09-18 (one hired type,  | AI | 29.74M / 30 | SW | 28.64M / 28 | **0.17** | -1.39 | dmg, dmg/silver, dmg/hired | 4.01M / 28 | -107.87 | 0 → 0 → 0 of 9 | yes |
| live account, evening (hunters 83, legionari | AI | 34.78M / 89 | SW | 31.37M / 68 | **2.82** | 0.85 | dmg | 45.97M / 416 | -132.32 | 0 → 0 → 0 of 9 | yes |
| Aydae alone, 4 975 (one captain, four hired  | AI | 18.75M / 111 | SW | 16.05M / 40 | **19.66** | 0.14 | dmg | 22.46M / 220 | -25.57 | 0 → 0 → 0 of 9 | yes |
| the owner’s live camp of 2026-09-18 (arbales | MX | 40.09M / 268 | MX | 48.04M / 336 | **5.85** | 5.85 | silver, hired, gold, queue, dmg/hired, dmg/gold | 48.04M / 336 | 5.85 | 2 → 2 → 2 of 3 | yes |
| his camp of 2026-09-19, the localStorage dum | MX | 23.59M / 148 | MX | 22.33M / 140 | **-3.79** | -3.79 | dmg, silver, queue, dmg/silver, dmg/gold | 22.33M / 140 | -4.72 | 0 → 0 → 0 of 3 | yes |
| his camp of 2026-09-19, as his message reads | AI | 11.59M / 41 | SW | 11.23M / 20 | **20.69** | 10.22 | dmg | 5.82M / 36 | -53.99 | 0 → 0 → 0 of 3 | yes |
| his TotalStack profile of 2026-09-19 (5 225  | MX | 8.44M / 25 | SW | 8.42M / 20 | **6.72** | -0.75 | dmg, dmg/coin | 1.35M / 24 | -92.86 | 0 → 0 → 0 of 3 | yes |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | 11.76M / 14 | SW | 11.77M / 8 | **11.52** | 1.29 | coins, dmg/coin | 4.47M / 28 | -118.76 | 0 → 0 → 0 of 9 | yes |

**Every marker**, four marches:

| army | march | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | rating vs top |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | top SW: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 1* | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | — | — | 0 |
| first-run army, Bear V ×2 (20 000 leadership | top SW: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 2* | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 116,899 | — | 0 |
| first-run army, Bear V ×3 (20 000 leadership | top AI: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 3* | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 39,668 | — | 0 |
| first-run army, Bear V ×10 (20 000 leadershi | top AI: spearman-2 3,097, spearman-3 1,739, archer-2 3,084, rider-2 1,539, archer-1 5,530, rider-3 863, archer-3 1,722, bear-5 10* | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 4,435 | — | 0 |
| first-run army, Bear V ×10 (20 000 leadershi | filled (SW): swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 6* | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 6,581 | — | 8.18 |
| first-run army, Bear V ×10 (20 000 leadershi | S-97 d1: archer-3 20,000, bear-5 7* | 1,047,200 | 56,000,000 | 4 | 3,840 | 0 | 9,333 | 0.019 | 261,800 | 273 | — | -106.50 |
| first-run army, Epic Monster Hunter VI ×83 ( | top AI: spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982, epic-monster-hunter-6 83* | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 14,950 | — | 0 |
| first-run army, Epic Monster Hunter VI ×83 ( | filled (HS): swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 62* | 29,075,464 | 32,525,600 | 28 | 1,760 | 0 | 2,524 | 0.894 | 382,434 | 16,520 | — | 0.98 |
| first-run army, Epic Monster Hunter VI ×83 ( | S-97 d1: archer-3 20,000, epic-monster-hunter-6 62* | 3,569,388 | 56,000,000 | 28 | 1,760 | 0 | 9,333 | 0.064 | 127,478 | 2,028 | — | -104.00 |
| first-run army, monster tiers 3–5 at 900 dom | top AI: swordsman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982, flaming-centaur 4*, ice-phoenix 10*, many-armed-guardian 13*, epic-monster-hunter-6 83*, gorgon-medusa 14*, desert-vanquisher 4*, magic-dragon 11*, ettin 3*, fearsome-manticore 3*, bear-5 6* | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 5,769 | 3,816 | 0 |
| first-run army, monster tiers 3–5 at 900 dom | filled (SW): swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, fearsome-manticore 3*, ice-phoenix 8*, stone-gargoyle 26*, magic-dragon 9*, gorgon-medusa 11*, flaming-centaur 3*, many-armed-guardian 10*, desert-vanquisher 3*, ettin 2*, bear-5 3*, epic-monster-hunter-6 62* | 101,563,540 | 35,156,800 | 32 | 12,576 | 27,040 | 2,900 | 2.889 | 627,842 | 8,076 | 3,756 | 7.08 |
| first-run army, monster tiers 3–5 at 900 dom | S-97 d1: archer-3 20,000, bear-5 3*, epic-monster-hunter-6 62* | 4,018,188 | 56,000,000 | 32 | 3,040 | 0 | 9,333 | 0.072 | 125,568 | 1,322 | — | -80.12 |
| the 4 000-leadership case of 2026-09-15 (Tot | top AI: rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, rider-2 208, archer-1 746, archer-2 414, rider-3 116, legionary-6 14*, chariot-6 8*, arbalester-6 15*, epic-monster-hunter-6 14* | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 6,725 | — | 0 |
| the 4 000-leadership case of 2026-09-15 (Tot | filled (SW): swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 5* | 8,160,188 | 6,087,200 | 16 | 1,120 | 0 | 381 | 1.341 | 325,002 | 7,286 | — | 0.71 |
| the 4 000-leadership case of 2026-09-15 (Tot | S-97 d1: rider-3 2,000, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 5* | 1,851,904 | 11,200,000 | 16 | 1,120 | 0 | 1,867 | 0.165 | 115,744 | 1,653 | — | -96.06 |
| 2026-09-17 export, its setup (7 000 leadersh | top AI: archer-2 2,190, spearman-2 1,776, rider-3 547, rider-2 969, epic-monster-hunter-6 97*, legionary-6 42*, arbalester-6 50*, chariot-6 20* | 24,936,555 | 12,715,900 | 73 | 5,360 | 0 | 1,213 | 1.961 | 253,556 | 4,652 | — | 0 |
| 2026-09-17 export, its setup (7 000 leadersh | filled (MX): spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 38*, legionary-6 30* | 22,629,888 | 10,960,400 | 52 | 3,808 | 0 | 740 | 2.065 | 331,345 | 5,943 | — | 6.03 |
| 2026-09-17 export, its setup (7 000 leadersh | S-97 d1: rider-3 3,500, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 109*, legionary-6 30* | 9,796,484 | 19,600,000 | 80 | 5,856 | 0 | 3,267 | 0.500 | 122,456 | 1,673 | — | -79.54 |
| 2026-09-17 export, 12 000 leadership | top MX: spearman-1 3,659, spearman-2 2,032, rider-2 1,112, rider-3 624, archer-2 2,483, epic-monster-hunter-6 111*, legionary-6 34*, arbalester-6 40*, chariot-6 16* | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 5,985 | — | 0 |
| 2026-09-17 export, 12 000 leadership | filled (SW): archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 66*, legionary-6 30* | 32,909,620 | 18,793,200 | 64 | 4,608 | 0 | 1,269 | 1.751 | 325,560 | 7,142 | — | 6.13 |
| 2026-09-17 export, 12 000 leadership | S-97 d1: rider-3 6,000, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 109*, legionary-6 30* | 9,796,484 | 33,600,000 | 80 | 5,856 | 0 | 5,600 | 0.292 | 122,456 | 1,673 | — | -89.13 |
| live account of 2026-09-18 (one hired type,  | top AI: archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 83* | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 14,754 | — | 0 |
| live account of 2026-09-18 (one hired type,  | filled (SW): archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 62* | 28,643,152 | 30,928,400 | 28 | 1,760 | 0 | 2,026 | 0.926 | 286,601 | 16,275 | — | 0.17 |
| live account of 2026-09-18 (one hired type,  | S-97 d1: rider-3 10,000, epic-monster-hunter-6 62* | 4,012,416 | 56,000,000 | 28 | 1,760 | 0 | 9,333 | 0.072 | 143,301 | 2,280 | — | -107.87 |
| live account, evening (hunters 83, legionari | top AI: spearman-1 3,476, spearman-2 1,931, rider-2 989, rider-3 555, archer-2 2,410, legionary-6 90*, epic-monster-hunter-6 83*, arbalester-6 60*, chariot-6 10* | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 5,546 | — | 0 |
| live account, evening (hunters 83, legionari | filled (SW): archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 59*, legionary-6 49* | 31,372,952 | 17,036,800 | 68 | 4,768 | 0 | 1,116 | 1.841 | 314,698 | 6,580 | — | 2.82 |
| live account, evening (hunters 83, legionari | S-97 d1: rider-3 5,500, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 62*, legionary-6 903* | 45,972,168 | 30,800,000 | 416 | 29,408 | 0 | 5,133 | 1.493 | 110,510 | 1,563 | — | -132.32 |
| Aydae alone, 4 975 (one captain, four hired  | top AI: spearman-2 1,945, rider-3 546, archer-2 1,938, legionary-6 91*, epic-monster-hunter-6 83*, arbalester-6 60*, chariot-6 10* | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 2,389 | — | 0 |
| Aydae alone, 4 975 (one captain, four hired  | filled (SW): spearman-1 1,004, archer-1 1,002, rider-2 278, rider-1 499, spearman-2 553, archer-2 552, rider-3 155, arbalester-6 26*, chariot-6 7*, epic-monster-hunter-6 24*, legionary-6 26* | 16,050,792 | 7,794,800 | 40 | 2,528 | 0 | 527 | 2.059 | 287,417 | 6,349 | — | 19.66 |
| Aydae alone, 4 975 (one captain, four hired  | S-97 d1: rider-3 2,487, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 62*, legionary-6 418* | 22,464,684 | 13,927,200 | 220 | 15,456 | 0 | 2,321 | 1.613 | 102,112 | 1,453 | — | -25.57 |
| the owner’s live camp of 2026-09-18 (arbales | top MX: rider-3 2,487, arbalester-6 403*, bear-5 49*, legionary-6 408* | 40,085,840 | 12,389,200 | 268 | 39,152 | 0 | 1,871 | 3.236 | 145,228 | 1,024 | — | 0 |
| the owner’s live camp of 2026-09-18 (arbales | filled (MX): rider-3 2,487, arbalester-6 371*, bear-5 49*, legionary-6 408* | 48,038,372 | 13,927,200 | 336 | 50,560 | 0 | 2,321 | 3.449 | 142,971 | 950 | — | 5.85 |
| the owner’s live camp of 2026-09-18 (arbales | S-97 d1: rider-3 2,487, arbalester-6 371*, bear-5 49*, legionary-6 408* | 48,038,372 | 13,927,200 | 336 | 50,560 | 0 | 2,321 | 3.449 | 142,971 | 950 | — | 5.85 |
| his camp of 2026-09-19, the localStorage dum | top MX: rider-3 2,390, epic-monster-hunter-6 374* | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 2,251 | — | 0 |
| his camp of 2026-09-19, the localStorage dum | filled (MX): rider-3 2,390, epic-monster-hunter-6 345* | 22,327,160 | 13,384,000 | 140 | 9,920 | 0 | 2,231 | 1.668 | 159,480 | 2,251 | — | -3.79 |
| his camp of 2026-09-19, the localStorage dum | S-97 d1: rider-3 2,487, epic-monster-hunter-6 345* | 22,327,160 | 13,927,200 | 140 | 9,920 | 0 | 2,321 | 1.603 | 159,480 | 2,251 | — | -4.72 |
| his camp of 2026-09-19, as his message reads | top AI: spearman-2 1,962, rider-3 565, rider-2 1,004, epic-monster-hunter-6 110* | 11,587,344 | 10,702,600 | 41 | 2,888 | 0 | 1,304 | 1.083 | 158,634 | 4,012 | — | 0 |
| his camp of 2026-09-19, as his message reads | filled (SW): spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50* | 11,229,100 | 9,286,000 | 20 | 1,440 | 0 | 855 | 1.209 | 323,582 | 7,798 | — | 20.69 |
| his camp of 2026-09-19, as his message reads | S-97 d1: rider-3 2,550, epic-monster-hunter-6 90* | 5,824,476 | 14,280,000 | 36 | 2,592 | 0 | 2,380 | 0.408 | 161,791 | 2,247 | — | -53.99 |
| his TotalStack profile of 2026-09-19 (5 225  | top MX: spearman-2 733, archer-2 732, rider-2 365, archer-1 1,310, rider-1 654, rider-3 204, epic-monster-hunter-5 62*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3* | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 5,330 | 2,199 | 0 |
| his TotalStack profile of 2026-09-19 (5 225  | filled (SW): spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*, epic-monster-hunter-5 49* | 8,418,580 | 8,460,400 | 20 | 1,408 | 3,840 | 599 | 0.995 | 110,309 | 5,979 | 2,192 | 6.72 |
| his TotalStack profile of 2026-09-19 (5 225  | S-97 d1: rider-3 2,612, epic-monster-hunter-5 60* | 1,350,720 | 14,627,200 | 24 | 1,728 | 0 | 2,438 | 0.092 | 56,280 | 782 | — | -92.86 |
| his usual setup of 2026-09-19 (Aydae alone,  | top MX: spearman-2 730, rider-2 364, archer-2 726, rider-1 653, archer-1 1,300, rider-3 203, epic-monster-hunter-6 32*, water-elemental 18*, battle-boar 8*, emerald-dragon 7*, stone-gargoyle 6* | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 14,550 | 2,721 | 0 |
| his usual setup of 2026-09-19 (Aydae alone,  | filled (SW): swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123, stone-gargoyle 12*, emerald-dragon 13*, battle-boar 1*, water-elemental 2*, epic-monster-hunter-6 19* | 11,766,708 | 8,126,400 | 8 | 544 | 6,240 | 512 | 1.448 | 461,105 | 21,630 | 1,886 | 11.52 |
| his usual setup of 2026-09-19 (Aydae alone,  | S-97 d1: rider-3 2,600, epic-monster-hunter-6 69* | 4,465,432 | 14,560,000 | 28 | 1,984 | 0 | 2,427 | 0.307 | 159,480 | 2,251 | — | -118.76 |

## C. The engine fix, measured on a temporary patch (worktree of 164a67c, not shipped)

Patch: in the S-97 pass (`planCampaign`, *the top of the bar*), each **ladder-family** sheltered maximum (`shelteredMaxima`, depth k) is also scored through the scorer on **the tight ladder that defined it** (the winner-rungs path with those rungs), and `consider`ed under the same freeze. Three variants, 17 armies, every stop rated against the same pick before the patch (`rate(before, after)`):

| variant | live camp top | live camp stops vs before | other armies | TS kept (all armies) |
|---|---|---|---|---:|
| 1. own-ladder shape, ungated | MX 40.09M / 268, **+13.72** | MM +1.64, rest 0 | evening account: MX 43.13M / 331, −132.74, AI dropped; Aydae alone: MX 20.79M / 172, −75.01, AI dropped (unlimited legionaries filled to the floor: 903 and 418) | 7 → 6 |
| 2. = 1 + finale on the biggest ladder, leftovers sheltered (`finaleFor`) | MX 49.19M / 344, **+23.76** | HS −158.67, SW −11.83, SS +27.93, MM +13.64 | 7 000 export HS −4.12, SW −1.61; localStorage camp HS −219.94, SS −76.94, SW −65.75; message camp SS −6.51 | 7 → 6 |
| **3. = 1, admitted only when it rates > 0 against the search’s highest-damage candidate** (`rate`, `markerRates`) | MX **40.09M / 268, +13.72** (rider-3 2,486, arbalester-6 403*, bear-5 49*, legionary-6 408*) | MM +1.64 (21 bears where 10), rest 0.00 | **every stop of the 16 others: 0.00** | **7 → 6** (live camp 3 → 2) |

