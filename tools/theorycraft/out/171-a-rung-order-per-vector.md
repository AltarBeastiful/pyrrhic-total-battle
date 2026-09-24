# 171 — a rung order per vector

W13 §2 step 3 (`docs/plans/every-ordering.md`). `orderFor` learns the rung order once per depth and reuses it for every mercenary vector and scale. Here, behind a worktree-only flag, it is relearned per key: **full** (key depth · scale · vector; a climb from the ranking and one from the cached order, the best by damage, never below the cached order on that ladder), **warm** (same key, one climb from the cached order), **warmNoScale** (key depth · vector, climbed from the cached order), **finale** (warm, but only on the final marches’ ladders). Every army planned with `budgetMs` off, the app’s fixes and put-back otherwise; `rate(off, variant, markerRates)`, **+** better. Four-march campaigns, worst opening (`campaignOf`). Training bonuses are not applied (W11 §6.1).


HEAD (off): plan time 23,859 ms over every army. The depth orders and their climbs are HEAD's own in every variant (columns “depth orders” and “battles: cached”).


## A. Does the learned order change? (per variant)


`keys` — distinct (depth, vector, scale) ladders the plan asked for (for **finale**, only the final marches’); `differs` — the relearned order is not the cached one; `better` — it battles strictly more damage on that very ladder; mean / max — its damage gain on that ladder, %. `battles` — ladders battled to learn (cached order’s own climbs | the per-key relearning).


### full


| army | depth orders | keys | differs | better | mean gain % | max gain % | battles: cached | per key | plan ms base | variant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 16 | 160 | 76 | 76 | 0.024 | 0.145 | 536 | 10,104 | 102 | 83 |
| first-run army, Bear V ×2 (20 000 leadership | 24 | 320 | 142 | 142 | 0.026 | 0.145 | 812 | 18,084 | 68 | 115 |
| first-run army, Bear V ×3 (20 000 leadership | 32 | 320 | 127 | 127 | 0.024 | 0.145 | 1,144 | 17,115 | 64 | 118 |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 720 | 85 | 85 | 0.016 | 0.097 | 969 | 12,387 | 95 | 133 |
| first-run army, Epic Monster Hunter VI ×83 ( | 39 | 2,000 | 425 | 425 | 0.014 | 0.155 | 1,369 | 50,619 | 218 | 326 |
| first-run army, monster tiers 3–5 at 900 dom | 36 | 275,360 | 3,089 | 3,089 | 0.003 | 0.106 | 1,032 | 934,912 | 9,274 | 13,734 |
| the 4 000-leadership case of 2026-09-15 (Tot | 34 | 35,909 | 6,202 | 6,202 | 0.813 | 5.622 | 1,141 | 772,122 | 764 | 4,363 |
| 2026-09-17 export, its setup (7 000 leadersh | 32 | 93,618 | 2,384 | 2,384 | 0.362 | 31.879 | 476 | 525,333 | 1,689 | 3,555 |
| 2026-09-17 export, 12 000 leadership | 23 | 96,210 | 1,895 | 1,895 | 0.374 | 20.610 | 430 | 904,595 | 1,523 | 5,205 |
| live account of 2026-09-18 (one hired type,  | 40 | 2,291 | 162 | 162 | 0.012 | 0.161 | 1,472 | 54,723 | 90 | 252 |
| live account, evening (hunters 83, legionari | 36 | 66,469 | 2,867 | 2,867 | 18.773 | 68.226 | 483 | 414,707 | 1,125 | 2,631 |
| Aydae alone, 4 975 (one captain, four hired  | 12 | 56,425 | 1,457 | 1,457 | 0.046 | 0.217 | 299 | 193,956 | 1,097 | 1,720 |
| the owner’s live camp of 2026-09-18 (arbales | 12 | 41,214 | 678 | 678 | 21.440 | 70.422 | 289 | 118,126 | 783 | 1,035 |
| his camp of 2026-09-19, the localStorage dum | 12 | 4,143 | 130 | 130 | 0.044 | 0.391 | 284 | 30,616 | 146 | 228 |
| his camp of 2026-09-19, as his message reads | 16 | 2,343 | 93 | 93 | 0.028 | 0.161 | 297 | 16,486 | 96 | 138 |
| his TotalStack profile of 2026-09-19 (5 225  | 24 | 182,555 | 9,422 | 9,422 | 0.019 | 0.543 | 451 | 1,497,128 | 2,881 | 9,257 |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 234,776 | 2,835 | 2,835 | 0.014 | 0.414 | 337 | 831,248 | 3,844 | 6,515 |


**Totals (full):** 1,094,833 keys; the order differs on **32,069** (2.9 %), a strictly better ladder on **32,069**, mean gain 2.348 %, max 70.422 %. 6,402,261 extra ladders battled; plan time 49,408 ms against 23,859 ms (+107.08 %).


### warm


| army | depth orders | keys | differs | better | mean gain % | max gain % | battles: cached | per key | plan ms base | variant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 16 | 160 | 76 | 76 | 0.024 | 0.145 | 536 | 3,796 | 102 | 58 |
| first-run army, Bear V ×2 (20 000 leadership | 24 | 320 | 142 | 142 | 0.026 | 0.145 | 812 | 6,784 | 68 | 77 |
| first-run army, Bear V ×3 (20 000 leadership | 32 | 320 | 127 | 127 | 0.024 | 0.145 | 1,144 | 6,211 | 64 | 81 |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 720 | 85 | 85 | 0.016 | 0.097 | 969 | 4,309 | 95 | 111 |
| first-run army, Epic Monster Hunter VI ×83 ( | 39 | 2,000 | 423 | 423 | 0.014 | 0.155 | 1,369 | 16,877 | 218 | 230 |
| first-run army, monster tiers 3–5 at 900 dom | 36 | 275,360 | 3,087 | 3,087 | 0.003 | 0.106 | 1,032 | 402,058 | 9,274 | 11,160 |
| the 4 000-leadership case of 2026-09-15 (Tot | 34 | 35,909 | 6,202 | 6,202 | 0.813 | 5.622 | 1,141 | 335,398 | 764 | 2,199 |
| 2026-09-17 export, its setup (7 000 leadersh | 32 | 93,618 | 2,367 | 2,367 | 0.364 | 31.879 | 476 | 181,592 | 1,689 | 2,330 |
| 2026-09-17 export, 12 000 leadership | 23 | 96,210 | 1,886 | 1,886 | 0.375 | 20.610 | 430 | 262,318 | 1,523 | 2,638 |
| live account of 2026-09-18 (one hired type,  | 40 | 2,291 | 162 | 162 | 0.012 | 0.161 | 1,472 | 15,601 | 90 | 129 |
| live account, evening (hunters 83, legionari | 36 | 66,469 | 2,858 | 2,858 | 18.831 | 68.226 | 483 | 154,623 | 1,125 | 1,756 |
| Aydae alone, 4 975 (one captain, four hired  | 12 | 56,425 | 1,455 | 1,455 | 0.046 | 0.217 | 299 | 86,898 | 1,097 | 1,454 |
| the owner’s live camp of 2026-09-18 (arbales | 12 | 41,214 | 678 | 678 | 21.440 | 70.422 | 289 | 54,958 | 783 | 952 |
| his camp of 2026-09-19, the localStorage dum | 12 | 4,143 | 129 | 129 | 0.040 | 0.391 | 284 | 11,683 | 146 | 177 |
| his camp of 2026-09-19, as his message reads | 16 | 2,343 | 93 | 93 | 0.028 | 0.161 | 297 | 6,473 | 96 | 112 |
| his TotalStack profile of 2026-09-19 (5 225  | 24 | 182,555 | 9,384 | 9,384 | 0.019 | 0.543 | 451 | 591,935 | 2,881 | 5,658 |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 234,776 | 2,831 | 2,831 | 0.014 | 0.414 | 337 | 372,321 | 3,844 | 5,566 |


**Totals (warm):** 1,094,833 keys; the order differs on **31,985** (2.9 %), a strictly better ladder on **31,985**, mean gain 2.354 %, max 70.422 %. 2,513,835 extra ladders battled; plan time 34,688 ms against 23,859 ms (+45.39 %).


### warmNoScale


| army | depth orders | keys | differs | better | mean gain % | max gain % | battles: cached | per key | plan ms base | variant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 16 | 16 | 0 | 0 | — | 0.000 | 536 | 184 | 102 | 38 |
| first-run army, Bear V ×2 (20 000 leadership | 24 | 32 | 5 | 5 | 0.076 | 0.097 | 812 | 492 | 68 | 55 |
| first-run army, Bear V ×3 (20 000 leadership | 32 | 32 | 0 | 0 | — | 0.000 | 1,144 | 368 | 64 | 62 |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 72 | 12 | 12 | 0.025 | 0.097 | 969 | 924 | 95 | 89 |
| first-run army, Epic Monster Hunter VI ×83 ( | 39 | 200 | 66 | 66 | 0.019 | 0.155 | 1,369 | 3,421 | 218 | 182 |
| first-run army, monster tiers 3–5 at 900 dom | 36 | 27,536 | 800 | 800 | 0.003 | 0.092 | 1,032 | 65,491 | 9,274 | 9,682 |
| the 4 000-leadership case of 2026-09-15 (Tot | 34 | 3,585 | 1,451 | 1,451 | 0.541 | 4.113 | 1,141 | 88,615 | 764 | 1,100 |
| 2026-09-17 export, its setup (7 000 leadersh | 32 | 9,280 | 381 | 381 | 0.978 | 31.879 | 476 | 33,417 | 1,689 | 1,882 |
| 2026-09-17 export, 12 000 leadership | 23 | 9,488 | 512 | 512 | 0.552 | 20.610 | 430 | 49,314 | 1,523 | 1,917 |
| live account of 2026-09-18 (one hired type,  | 40 | 224 | 40 | 40 | 0.022 | 0.161 | 1,472 | 3,110 | 90 | 95 |
| live account, evening (hunters 83, legionari | 36 | 6,544 | 469 | 469 | 10.728 | 30.953 | 483 | 22,976 | 1,125 | 1,342 |
| Aydae alone, 4 975 (one captain, four hired  | 12 | 5,600 | 234 | 234 | 0.040 | 0.207 | 299 | 14,599 | 1,097 | 1,240 |
| the owner’s live camp of 2026-09-18 (arbales | 12 | 4,109 | 72 | 72 | 17.400 | 33.819 | 289 | 6,221 | 783 | 817 |
| his camp of 2026-09-19, the localStorage dum | 12 | 368 | 13 | 13 | 0.054 | 0.161 | 284 | 1,050 | 146 | 150 |
| his camp of 2026-09-19, as his message reads | 16 | 208 | 6 | 6 | 0.079 | 0.161 | 297 | 518 | 96 | 98 |
| his TotalStack profile of 2026-09-19 (5 225  | 24 | 18,433 | 3,795 | 3,795 | 0.019 | 0.543 | 451 | 169,980 | 2,881 | 3,843 |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 23,472 | 1,247 | 1,247 | 0.012 | 0.287 | 337 | 77,546 | 3,844 | 4,523 |


**Totals (warmNoScale):** 109,199 keys; the order differs on **9,103** (8.3 %), a strictly better ladder on **9,103**, mean gain 0.860 %, max 33.819 %. 538,226 extra ladders battled; plan time 27,115 ms against 23,859 ms (+13.65 %).


### finale


| army | depth orders | keys | differs | better | mean gain % | max gain % | battles: cached | per key | plan ms base | variant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 16 | 0 | 0 | 0 | — | 0.000 | 536 | 0 | 102 | 37 |
| first-run army, Bear V ×2 (20 000 leadership | 24 | 80 | 38 | 38 | 0.024 | 0.145 | 812 | 1,898 | 68 | 57 |
| first-run army, Bear V ×3 (20 000 leadership | 32 | 0 | 0 | 0 | — | 0.000 | 1,144 | 0 | 64 | 61 |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 80 | 5 | 5 | 0.009 | 0.023 | 969 | 333 | 95 | 84 |
| first-run army, Epic Monster Hunter VI ×83 ( | 39 | 560 | 86 | 86 | 0.011 | 0.032 | 1,369 | 2,992 | 218 | 167 |
| first-run army, monster tiers 3–5 at 900 dom | 36 | 1,040 | 0 | 0 | — | 0.000 | 1,032 | 1,040 | 9,274 | 8,965 |
| the 4 000-leadership case of 2026-09-15 (Tot | 34 | 1,040 | 61 | 61 | 0.567 | 3.037 | 1,141 | 4,037 | 764 | 692 |
| 2026-09-17 export, its setup (7 000 leadersh | 32 | 19,280 | 0 | 0 | — | 0.000 | 476 | 19,722 | 1,689 | 1,676 |
| 2026-09-17 export, 12 000 leadership | 23 | 18,960 | 6 | 6 | 0.000 | 0.000 | 430 | 22,749 | 1,523 | 1,746 |
| live account of 2026-09-18 (one hired type,  | 40 | 560 | 16 | 16 | 0.004 | 0.011 | 1,472 | 2,281 | 90 | 93 |
| live account, evening (hunters 83, legionari | 36 | 3,360 | 0 | 0 | — | 0.000 | 483 | 3,360 | 1,125 | 1,195 |
| Aydae alone, 4 975 (one captain, four hired  | 12 | 3,360 | 0 | 0 | — | 0.000 | 299 | 3,360 | 1,097 | 1,154 |
| the owner’s live camp of 2026-09-18 (arbales | 12 | 7,600 | 0 | 0 | — | 0.000 | 289 | 7,600 | 783 | 784 |
| his camp of 2026-09-19, the localStorage dum | 12 | 1,040 | 0 | 0 | — | 0.000 | 284 | 1,040 | 146 | 147 |
| his camp of 2026-09-19, as his message reads | 16 | 800 | 0 | 0 | — | 0.000 | 297 | 820 | 96 | 96 |
| his TotalStack profile of 2026-09-19 (5 225  | 24 | 560 | 1 | 1 | 0.007 | 0.007 | 451 | 753 | 2,881 | 3,015 |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 560 | 0 | 0 | — | 0.000 | 337 | 580 | 3,844 | 4,009 |


**Totals (finale):** 58,880 keys; the order differs on **213** (0.4 %), a strictly better ladder on **213**, mean gain 0.171 %, max 3.037 %. 72,565 extra ladders battled; plan time 23,978 ms against 23,859 ms (+0.50 %).


### fullNoRetype


| army | depth orders | keys | differs | better | mean gain % | max gain % | battles: cached | per key | plan ms base | variant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 16 | 160 | 76 | 76 | 0.024 | 0.145 | 536 | 10,104 | 26 | 56 |
| first-run army, Bear V ×2 (20 000 leadership | 24 | 320 | 142 | 142 | 0.026 | 0.145 | 812 | 18,084 | 30 | 101 |
| first-run army, Bear V ×3 (20 000 leadership | 32 | 320 | 127 | 127 | 0.024 | 0.145 | 1,144 | 17,115 | 30 | 82 |
| first-run army, Bear V ×10 (20 000 leadershi | 35 | 720 | 85 | 85 | 0.016 | 0.097 | 969 | 12,387 | 47 | 78 |
| first-run army, Epic Monster Hunter VI ×83 ( | 39 | 2,000 | 425 | 425 | 0.014 | 0.155 | 1,369 | 50,619 | 93 | 252 |
| first-run army, monster tiers 3–5 at 900 dom | 36 | 275,360 | 3,089 | 3,089 | 0.003 | 0.106 | 1,032 | 934,912 | 9,069 | 13,743 |
| the 4 000-leadership case of 2026-09-15 (Tot | 34 | 35,909 | 6,202 | 6,202 | 0.813 | 5.622 | 1,141 | 772,122 | 666 | 4,258 |
| 2026-09-17 export, its setup (7 000 leadersh | 17 | 92,978 | 2,378 | 2,378 | 0.362 | 31.879 | 340 | 523,489 | 1,528 | 3,479 |
| 2026-09-17 export, 12 000 leadership | 23 | 96,210 | 1,895 | 1,895 | 0.374 | 20.610 | 430 | 904,595 | 1,497 | 5,178 |
| live account of 2026-09-18 (one hired type,  | 40 | 2,291 | 162 | 162 | 0.012 | 0.161 | 1,472 | 54,723 | 67 | 235 |
| live account, evening (hunters 83, legionari | 22 | 65,829 | 2,867 | 2,867 | 18.773 | 68.226 | 389 | 413,086 | 1,040 | 2,540 |
| Aydae alone, 4 975 (one captain, four hired  | 12 | 56,425 | 1,457 | 1,457 | 0.046 | 0.217 | 299 | 193,956 | 1,083 | 1,701 |
| the owner’s live camp of 2026-09-18 (arbales | 12 | 41,214 | 678 | 678 | 21.440 | 70.422 | 289 | 118,126 | 733 | 997 |
| his camp of 2026-09-19, the localStorage dum | 12 | 4,143 | 130 | 130 | 0.044 | 0.391 | 284 | 30,616 | 112 | 196 |
| his camp of 2026-09-19, as his message reads | 16 | 2,343 | 93 | 93 | 0.028 | 0.161 | 297 | 16,486 | 83 | 121 |
| his TotalStack profile of 2026-09-19 (5 225  | 24 | 182,555 | 9,422 | 9,422 | 0.019 | 0.543 | 451 | 1,497,128 | 2,889 | 9,363 |
| his usual setup of 2026-09-19 (Aydae alone,  | 17 | 234,776 | 2,835 | 2,835 | 0.014 | 0.414 | 337 | 831,248 | 3,789 | 6,493 |


**Totals (fullNoRetype):** 1,093,553 keys; the order differs on **32,063** (2.9 %), a strictly better ladder on **32,063**, mean gain 2.348 %, max 70.422 %. 6,398,796 extra ladders battled; plan time 48,873 ms against 23,859 ms (+104.84 %).


## B. The gate: every stop against HEAD


| variant | better / equal / worse | worst | TS matched base → variant | armies breaking a criterion | readings better | readings worse |
|---|---|---:|---|---:|---|---|
| full | 4 / 54 / 3 | −0.03 (his usual setup of 2026-09-19 (Aydae alone,  HS) | 70/13 → 70/13 | 0 | least silver 1, shortest queue 5, dmg/gold 1 | least silver 3, dmg/silver 1, dmg/gold 3 |
| warm | 2 / 55 / 4 | −0.03 (his usual setup of 2026-09-19 (Aydae alone,  HS) | 70/13 → 70/13 | 0 | least silver 1, shortest queue 5 | least silver 3, dmg/silver 1, dmg/gold 4 |
| warmNoScale | 4 / 53 / 4 | −0.03 (his usual setup of 2026-09-19 (Aydae alone,  HS) | 70/13 → 70/13 | 0 | least silver 1, shortest queue 5 | least silver 3, dmg/silver 1, dmg/gold 5 |
| finale | 1 / 60 / 0 | 0 (first-run army, Bear V ×1 (20 000 leadership SW) | 70/13 → 70/13 | 0 | shortest queue 1 | least silver 1, dmg/silver 1 |
| fullNoRetype (against off, both without the re-typing) | 7 / 54 / 0 | 0 (first-run army, Bear V ×1 (20 000 leadership SW) | 47/13 → 47/13 | 0 | least silver 1, shortest queue 5, dmg/gold 5 | least silver 4, shortest queue 1, dmg/silver 1 |


### full


| army | stops | better / equal / worse | worst | per stop | most damage | least silver | fewest hired | least gold | fewest coins | shortest queue | dmg/silver | dmg/hired | dmg/gold | dmg/coin | TS matched | criteria |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/0 → 8/0 of 9 | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/0 → 4/0 of 9 | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/0 → 7/0 of 9 | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SW 0, MM 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/3 → 0/3 of 3 | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 → 3 | 1 / 2 / 0 | 0 | SS +0.31, SW 0, AI 0 | 0 | **−0.08 %** | 0 | 0 | 0 | **+0.85 %** | 0 | 0 | 0 | 0 | 10/0 → 10/0 of 10 | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/3 → 6/3 of 9 | ✓ |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/2 → 3/2 of 9 | ✓ |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 1 / 3 / 0 | 0 | SS +0.00, SW 0, MX 0, AI 0 | 0 | **−0.01 %** | 0 | 0 | 0 | **+0.16 %** | **−0.01 %** | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 1 / 4 / 0 | 0 | HS 0, SS 0, SW +0.17, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/0 → 6/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 0 / 3 / 1 | −0.00 | HS −0.00, SW 0, MX 0, AI 0 | 0 | **+0.03 %** | 0 | 0 | 0 | **+0.05 %** | 0 | 0 | **−0.01 %** | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 1 / 4 / 0 | 0 | HS +0.24, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | **+0.13 %** | 0 | 0 | **+0.16 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 0 / 4 / 1 | −0.00 | HS −0.00, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **−0.00 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 0 / 2 / 1 | −0.03 | HS −0.03, SW 0, MX 0 | 0 | **−0.06 %** | 0 | 0 | 0 | **+0.12 %** | 0 | 0 | **−0.02 %** | 0 | 5/2 → 5/2 of 9 | ✓ |


**Every stop that moved**

| army | stop | first march base → variant | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| the 4 000-leadership case of 2026-09-15 (Tot | SS → SS | swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* → swordsman-1 304, spearman-1 298, spearman-2 162, archer-1 383, rider-1 188, rider-3 57, archer-2 201, rider-2 98, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* | 5,212,861 → 5,228,920 | 3,820,600 → 3,823,600 | 19 → 19 | 736 → 736 | 238 → 236 | +0.31 |
| live account of 2026-09-18 (one hired type,  | SS → SS | archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* → archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* | 18,256,930 → 18,257,046 | 18,959,900 → 18,962,400 | 20 → 20 | 1,368 → 1,368 | 1,317 → 1,315 | +0.00 |
| live account, evening (hunters 83, legionari | SW → SW | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38* → spearman-1 2,120, rider-2 593, rider-1 1,047, spearman-2 1,112, archer-1 2,465, rider-3 308, archer-2 1,316, legionary-6 38*, epic-monster-hunter-6 45*, arbalester-6 37*, chariot-6 6* | 29,479,912 → 29,514,199 | 17,073,600 → 17,021,700 | 61 → 61 | 4,056 → 4,056 | 1,125 → 1,129 | +0.17 |
| Aydae alone, 4 975 (one captain, four hired  | HS → HS | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 4* → swordsman-1 902, archer-1 564, rider-1 277, spearman-2 301, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 4* | 9,450,218 → 9,449,549 | 5,777,000 → 5,775,500 | 19 → 19 | 1,288 → 1,288 | 323 → 323 | −0.00 |
| his camp of 2026-09-19, the localStorage dum | HS → HS | archer-1 1,208, spearman-2 523, rider-1 475, spearman-1 904, archer-2 620, rider-2 248, rider-3 137, epic-monster-hunter-6 9* → spearman-1 960, rider-1 483, rider-2 264, spearman-2 503, archer-1 1,116, rider-3 139, archer-2 596, epic-monster-hunter-6 9* | 6,943,378 → 6,954,706 | 7,733,000 → 7,705,400 | 6 → 6 | 392 → 392 | 510 → 510 | +0.24 |
| his camp of 2026-09-19, as his message reads | HS → HS | spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 10* → spearman-1 1,143, rider-2 319, spearman-2 611, rider-1 554, archer-2 738, rider-3 166, epic-monster-hunter-6 10* | 6,580,946 → 6,580,880 | 7,681,400 → 7,679,600 | 6 → 6 | 408 → 408 | 570 → 572 | −0.00 |
| his usual setup of 2026-09-19 (Aydae alone,  | HS → HS | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, rider-3 82, archer-2 282, rider-2 139, epic-monster-hunter-6 10*, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10* → swordsman-1 902, archer-1 564, rider-1 277, spearman-2 301, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10* | 8,211,151 → 8,209,876 | 6,132,900 → 6,136,800 | 5 → 5 | 352 → 352 | 375 → 374 | −0.03 |


### warm


| army | stops | better / equal / worse | worst | per stop | most damage | least silver | fewest hired | least gold | fewest coins | shortest queue | dmg/silver | dmg/hired | dmg/gold | dmg/coin | TS matched | criteria |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/0 → 8/0 of 9 | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/0 → 4/0 of 9 | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/0 → 7/0 of 9 | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SW 0, MM 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/3 → 0/3 of 3 | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 → 3 | 1 / 2 / 0 | 0 | SS +0.31, SW 0, AI 0 | 0 | **−0.08 %** | 0 | 0 | 0 | **+0.85 %** | 0 | 0 | 0 | 0 | 10/0 → 10/0 of 10 | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/3 → 6/3 of 9 | ✓ |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/2 → 3/2 of 9 | ✓ |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 1 / 3 / 0 | 0 | SS +0.00, SW 0, MX 0, AI 0 | 0 | **−0.01 %** | 0 | 0 | 0 | **+0.16 %** | **−0.01 %** | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/0 → 6/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 0 / 3 / 1 | −0.00 | HS −0.00, SW 0, MX 0, AI 0 | 0 | **+0.03 %** | 0 | 0 | 0 | **+0.05 %** | 0 | 0 | **−0.01 %** | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 0 / 4 / 1 | −0.00 | HS −0.00, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | **+0.00 %** | 0 | 0 | **−0.01 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 0 / 4 / 1 | −0.00 | HS −0.00, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **−0.00 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 0 / 2 / 1 | −0.03 | HS −0.03, SW 0, MX 0 | 0 | **−0.06 %** | 0 | 0 | 0 | **+0.12 %** | 0 | 0 | **−0.02 %** | 0 | 5/2 → 5/2 of 9 | ✓ |


**Every stop that moved**

| army | stop | first march base → variant | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| the 4 000-leadership case of 2026-09-15 (Tot | SS → SS | swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* → swordsman-1 304, spearman-1 298, spearman-2 162, archer-1 383, rider-1 188, rider-3 57, archer-2 201, rider-2 98, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* | 5,212,861 → 5,228,920 | 3,820,600 → 3,823,600 | 19 → 19 | 736 → 736 | 238 → 236 | +0.31 |
| live account of 2026-09-18 (one hired type,  | SS → SS | archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* → archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* | 18,256,930 → 18,257,046 | 18,959,900 → 18,962,400 | 20 → 20 | 1,368 → 1,368 | 1,317 → 1,315 | +0.00 |
| Aydae alone, 4 975 (one captain, four hired  | HS → HS | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 4* → swordsman-1 902, archer-1 564, rider-1 277, spearman-2 301, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 4* | 9,450,218 → 9,449,549 | 5,777,000 → 5,775,500 | 19 → 19 | 1,288 → 1,288 | 323 → 323 | −0.00 |
| his camp of 2026-09-19, the localStorage dum | HS → HS | archer-1 1,208, spearman-2 523, rider-1 475, spearman-1 904, archer-2 620, rider-2 248, rider-3 137, epic-monster-hunter-6 9* → archer-1 1,208, spearman-2 523, rider-1 474, spearman-1 905, archer-2 620, rider-2 248, rider-3 137, epic-monster-hunter-6 9* | 6,943,378 → 6,942,868 | 7,733,000 → 7,732,100 | 6 → 6 | 392 → 392 | 510 → 510 | −0.00 |
| his camp of 2026-09-19, as his message reads | HS → HS | spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 10* → spearman-1 1,143, rider-2 319, spearman-2 611, rider-1 554, archer-2 738, rider-3 166, epic-monster-hunter-6 10* | 6,580,946 → 6,580,880 | 7,681,400 → 7,679,600 | 6 → 6 | 408 → 408 | 570 → 572 | −0.00 |
| his usual setup of 2026-09-19 (Aydae alone,  | HS → HS | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, rider-3 82, archer-2 282, rider-2 139, epic-monster-hunter-6 10*, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10* → swordsman-1 902, archer-1 564, rider-1 277, spearman-2 301, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10* | 8,211,151 → 8,209,876 | 6,132,900 → 6,136,800 | 5 → 5 | 352 → 352 | 375 → 374 | −0.03 |


### warmNoScale


| army | stops | better / equal / worse | worst | per stop | most damage | least silver | fewest hired | least gold | fewest coins | shortest queue | dmg/silver | dmg/hired | dmg/gold | dmg/coin | TS matched | criteria |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/0 → 3/0 of 3 | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8/0 → 8/0 of 9 | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4/0 → 4/0 of 9 | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7/0 → 7/0 of 9 | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SW 0, MM 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/3 → 0/3 of 3 | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 → 3 | 1 / 2 / 0 | 0 | SS +0.31, SW 0, AI 0 | 0 | **−0.08 %** | 0 | 0 | 0 | **+0.85 %** | 0 | 0 | 0 | 0 | 10/0 → 10/0 of 10 | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/3 → 6/3 of 9 | ✓ |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/2 → 3/2 of 9 | ✓ |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 1 / 3 / 0 | 0 | SS +0.00, SW 0, MX 0, AI 0 | 0 | **−0.01 %** | 0 | 0 | 0 | **+0.16 %** | **−0.01 %** | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 2 / 3 / 0 | 0 | HS +0.00, SS 0, SW +0.00, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **−0.01 %** | 0 | 6/0 → 6/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 0 / 3 / 1 | −0.00 | HS −0.00, SW 0, MX 0, AI 0 | 0 | **+0.03 %** | 0 | 0 | 0 | **+0.05 %** | 0 | 0 | **−0.01 %** | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 0 / 4 / 1 | −0.00 | HS −0.00, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | **+0.00 %** | 0 | 0 | **−0.01 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 0 / 4 / 1 | −0.00 | HS −0.00, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **−0.00 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 0 / 2 / 1 | −0.03 | HS −0.03, SW 0, MX 0 | 0 | **−0.06 %** | 0 | 0 | 0 | **+0.12 %** | 0 | 0 | **−0.02 %** | 0 | 5/2 → 5/2 of 9 | ✓ |


**Every stop that moved**

| army | stop | first march base → variant | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| the 4 000-leadership case of 2026-09-15 (Tot | SS → SS | swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* → swordsman-1 304, spearman-1 298, spearman-2 162, archer-1 383, rider-1 188, rider-3 57, archer-2 201, rider-2 98, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* | 5,212,861 → 5,228,920 | 3,820,600 → 3,823,600 | 19 → 19 | 736 → 736 | 238 → 236 | +0.31 |
| live account of 2026-09-18 (one hired type,  | SS → SS | archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* → archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* | 18,256,930 → 18,257,046 | 18,959,900 → 18,962,400 | 20 → 20 | 1,368 → 1,368 | 1,317 → 1,315 | +0.00 |
| live account, evening (hunters 83, legionari | HS → HS | archer-1 2,306, spearman-2 1,000, rider-1 905, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464, chariot-6 8*, legionary-6 10*, epic-monster-hunter-6 10*, arbalester-6 10* → archer-1 2,306, rider-1 923, spearman-2 979, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464, chariot-6 8*, legionary-6 10*, epic-monster-hunter-6 10*, arbalester-6 10* | 20,575,534 → 20,574,430 | 15,338,400 → 15,339,300 | 32 → 32 | 2,296 → 2,296 | 1,014 → 1,011 | +0.00 |
| live account, evening (hunters 83, legionari | SW → SW | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38* → archer-1 2,668, rider-1 1,068, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, legionary-6 38*, epic-monster-hunter-6 45*, arbalester-6 37*, chariot-6 6* | 29,479,912 → 29,480,887 | 17,073,600 → 17,075,400 | 61 → 61 | 4,056 → 4,056 | 1,125 → 1,125 | +0.00 |
| Aydae alone, 4 975 (one captain, four hired  | HS → HS | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 4* → swordsman-1 902, archer-1 564, rider-1 277, spearman-2 301, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 4* | 9,450,218 → 9,449,549 | 5,777,000 → 5,775,500 | 19 → 19 | 1,288 → 1,288 | 323 → 323 | −0.00 |
| his camp of 2026-09-19, the localStorage dum | HS → HS | archer-1 1,208, spearman-2 523, rider-1 475, spearman-1 904, archer-2 620, rider-2 248, rider-3 137, epic-monster-hunter-6 9* → archer-1 1,208, spearman-2 523, rider-1 474, spearman-1 905, archer-2 620, rider-2 248, rider-3 137, epic-monster-hunter-6 9* | 6,943,378 → 6,942,868 | 7,733,000 → 7,732,100 | 6 → 6 | 392 → 392 | 510 → 510 | −0.00 |
| his camp of 2026-09-19, as his message reads | HS → HS | spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 10* → spearman-1 1,143, rider-2 319, spearman-2 611, rider-1 554, archer-2 738, rider-3 166, epic-monster-hunter-6 10* | 6,580,946 → 6,580,880 | 7,681,400 → 7,679,600 | 6 → 6 | 408 → 408 | 570 → 572 | −0.00 |
| his usual setup of 2026-09-19 (Aydae alone,  | HS → HS | swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, rider-3 82, archer-2 282, rider-2 139, epic-monster-hunter-6 10*, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10* → swordsman-1 902, archer-1 564, rider-1 277, spearman-2 301, spearman-1 531, archer-2 288, rider-2 142, rider-3 79, epic-monster-hunter-6 10*, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10* | 8,211,151 → 8,209,876 | 6,132,900 → 6,136,800 | 5 → 5 | 352 → 352 | 375 → 374 | −0.03 |


### finale


| army | stops | better / equal / worse | worst | per stop | most damage | least silver | fewest hired | least gold | fewest coins | shortest queue | dmg/silver | dmg/hired | dmg/gold | dmg/coin | TS matched | criteria |
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
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 1 / 3 / 0 | 0 | SS +0.00, SW 0, MX 0, AI 0 | 0 | **−0.01 %** | 0 | 0 | 0 | **+0.16 %** | **−0.01 %** | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/0 → 6/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 0 / 3 / 0 | 0 | HS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/2 → 5/2 of 9 | ✓ |


**Every stop that moved**

| army | stop | first march base → variant | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| live account of 2026-09-18 (one hired type,  | SS → SS | archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* → archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* | 18,256,930 → 18,257,046 | 18,959,900 → 18,962,400 | 20 → 20 | 1,368 → 1,368 | 1,317 → 1,315 | +0.00 |


### fullNoRetype


| army | stops | better / equal / worse | worst | per stop | most damage | least silver | fewest hired | least gold | fewest coins | shortest queue | dmg/silver | dmg/hired | dmg/gold | dmg/coin | TS matched | criteria |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1/0 → 1/0 of 3 | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 1 → 1 | 0 / 1 / 0 | 0 | SW 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1/0 → 1/0 of 3 | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/0 → 2/0 of 9 | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 2 → 2 | 0 / 2 / 0 | 0 | SW 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/0 → 2/0 of 9 | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5/0 → 5/0 of 9 | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SW 0, MM 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/3 → 0/3 of 3 | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 → 3 | 1 / 2 / 0 | 0 | SS +0.31, SW 0, AI 0 | 0 | **−0.08 %** | 0 | 0 | 0 | **+0.85 %** | 0 | 0 | **+0.31 %** | 0 | 6/0 → 6/0 of 10 | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6/3 → 6/3 of 9 | ✓ |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 0 / 4 / 0 | 0 | HS 0, SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3/2 → 3/2 of 9 | ✓ |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 1 / 3 / 0 | 0 | SS +0.00, SW 0, MX 0, AI 0 | 0 | **−0.01 %** | 0 | 0 | 0 | **+0.16 %** | **−0.01 %** | 0 | 0 | 0 | 9/0 → 9/0 of 9 | ✓ |
| live account, evening (hunters 83, legionari | 5 → 5 | 1 / 4 / 0 | 0 | HS 0, SS 0, SW +0.17, MX 0, AI 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1/0 → 1/0 of 9 | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 1 / 3 / 0 | 0 | HS +0.01, SW 0, MX 0, AI 0 | 0 | **−0.03 %** | 0 | 0 | 0 | **+0.47 %** | 0 | 0 | **+0.00 %** | 0 | 0/0 → 0/0 of 9 | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 0 / 5 / 0 | 0 | HS 0, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 → 0/0 of 3 | ✓ |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 1 / 4 / 0 | 0 | HS +0.30, SS 0, SW 0, MM 0, MX 0 | 0 | 0 | 0 | 0 | 0 | **−0.09 %** | 0 | 0 | **+0.24 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 1 / 4 / 0 | 0 | HS +0.00, SW 0, MM 0, MX 0, AI 0 | 0 | **−0.02 %** | 0 | 0 | 0 | **+0.20 %** | 0 | 0 | **+0.00 %** | 0 | 2/1 → 2/1 of 3 | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 0 / 3 / 0 | 0 | SS 0, SW 0, MX 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2/1 → 2/1 of 3 | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 1 / 2 / 0 | 0 | HS +0.06, SW 0, MX 0 | 0 | **+0.01 %** | 0 | 0 | 0 | **+0.25 %** | 0 | 0 | **+0.05 %** | 0 | 5/2 → 5/2 of 9 | ✓ |


**Every stop that moved**

| army | stop | first march base → variant | dmg | silver | hired | gold | queue h | rating |
|---|---|---|---|---|---|---|---|---:|
| the 4 000-leadership case of 2026-09-15 (Tot | SS → SS | swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* → swordsman-1 304, spearman-1 298, spearman-2 162, archer-1 383, rider-1 188, rider-3 57, archer-2 201, rider-2 98, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3* | 5,212,861 → 5,228,920 | 3,820,600 → 3,823,600 | 19 → 19 | 736 → 736 | 238 → 236 | +0.31 |
| live account of 2026-09-18 (one hired type,  | SS → SS | archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* → archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40* | 18,256,930 → 18,257,046 | 18,959,900 → 18,962,400 | 20 → 20 | 1,368 → 1,368 | 1,317 → 1,315 | +0.00 |
| live account, evening (hunters 83, legionari | SW → SW | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38* → spearman-1 2,120, rider-2 593, spearman-2 1,133, rider-1 1,026, archer-1 2,465, rider-3 308, archer-2 1,316, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38* | 28,140,302 → 28,172,768 | 17,072,400 → 17,014,200 | 61 → 61 | 4,056 → 4,056 | 1,124 → 1,131 | +0.17 |
| Aydae alone, 4 975 (one captain, four hired  | HS → HS | swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, arbalester-6 10*, chariot-6 4*, epic-monster-hunter-6 10*, legionary-6 10* → swordsman-1 902, rider-1 282, archer-1 553, spearman-2 301, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, arbalester-6 10*, chariot-6 4*, epic-monster-hunter-6 10*, legionary-6 10* | 9,427,601 → 9,427,946 | 5,764,300 → 5,766,100 | 19 → 19 | 1,288 → 1,288 | 324 → 323 | +0.01 |
| his camp of 2026-09-19, the localStorage dum | HS → HS | archer-1 1,208, spearman-2 523, spearman-1 923, rider-1 464, archer-2 620, rider-3 139, rider-2 243, epic-monster-hunter-6 9* → spearman-1 960, rider-2 268, rider-1 474, spearman-2 503, archer-1 1,116, rider-3 139, archer-2 596, epic-monster-hunter-6 9* | 6,638,052 → 6,653,991 | 7,723,100 → 7,700,600 | 6 → 6 | 392 → 392 | 510 → 510 | +0.30 |
| his camp of 2026-09-19, as his message reads | HS → HS | archer-1 1,438, rider-2 319, spearman-2 611, rider-1 553, archer-2 738, rider-3 166, epic-monster-hunter-6 10* → archer-1 1,438, rider-2 319, rider-1 564, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 10* | 7,402,685 → 7,402,751 | 8,369,100 → 8,370,900 | 15 → 15 | 1,056 → 1,056 | 756 → 754 | +0.00 |
| his usual setup of 2026-09-19 (Aydae alone,  | HS → HS | swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, archer-2 289, rider-2 141, rider-3 78, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10*, epic-monster-hunter-6 10* → swordsman-1 902, rider-1 282, archer-1 553, spearman-2 301, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10*, epic-monster-hunter-6 10* | 8,183,996 → 8,188,037 | 6,127,800 → 6,127,200 | 5 → 5 | 352 → 352 | 375 → 374 | +0.06 |


## C. The permanent test (§3)

| engine | marches | pass | fail | inadmissible twins |
|---|---:|---:|---:|---:|
| off | 139 | 22 | 0 | 117 |
| full | 139 | 22 | 0 | 117 |
| warm | 139 | 22 | 0 | 117 |
| warmNoScale | 139 | 22 | 0 | 117 |
| finale | 139 | 22 | 0 | 117 |

