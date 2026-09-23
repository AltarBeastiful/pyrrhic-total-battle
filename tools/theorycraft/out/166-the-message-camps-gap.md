# 166 — the message camp’s gap from SW

W12 §2c. The plan as shipped at 0a688ac (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march campaigns priced as the benchmark prices stops (`campaignOf`, worst opening = enemy-first journal), ranked with `rate(before, after, markerRates)` (silver 5, gold 5, hired 5, coins 8, queue 40). Hired stacks are starred. Training bonuses are not applied (W11 §6.1).


## A. SW through `planCampaign`, step by step (his camp of 2026-09-19, as his message reads it)

**The bar at 0a688ac.** Top = AI.

| stop | first march · last march | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | rating vs AI |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 10* · spearman-2 2,643, rider-3 747, epic-monster-hunter-6 117* | 7,403,726 | 8,072,700 | 15 | 1,056 | 0 | 747 | 0.917 | 190,913 | 7,011 | — | -4.75 |
| SS | archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 20* · rider-2 1,321, rider-3 728, epic-monster-hunter-6 114* | 8,331,637 | 7,741,400 | 18 | 1,248 | 0 | 657 | 1.076 | 210,328 | 6,676 | — | 1.25 |
| SW | spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50* · spearman-2 2,795, rider-3 790, epic-monster-hunter-6 99* | 11,049,924 | 9,468,000 | 25 | 1,792 | 0 | 965 | 1.167 | 258,218 | 6,166 | — | 13.71 |
| MX | spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 100* · spearman-2 3,050, rider-3 862, epic-monster-hunter-6 90* | 11,198,137 | 10,310,100 | 39 | 2,808 | 0 | 1,255 | 1.086 | 161,791 | 3,988 | — | -1.00 |
| AI | spearman-2 1,962, rider-3 565, rider-2 1,004, epic-monster-hunter-6 110* · spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 87* | 11,587,344 | 10,702,600 | 41 | 2,888 | 0 | 1,304 | 1.083 | 158,634 | 4,012 | — | 0.00 |

The bar’s SW is step 4 below to the unit: **yes** (re-typed: yes, rating 8.88).


**The trace.** Each step’s campaign as the plan builds it (three repeats + the finale), and the same repeat played a fourth time instead of the finale. “finale → repeat” rates the repeat march against the finale march alone. 165 §B’s *filled* march is exactly step 4’s repeat: SW already fields the four-march sustain (50 hunters, `largestSustained(120, 4)`), so the whole +10.22 is the finale.

| step | how | repeat (× 3) · finale | campaign | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | finale → repeat, one march (rate) | repeat sustained a 4th time | rating of 4 × repeat vs 3 + finale | vs SW | vs top |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|
| 1. the search’s burn-ladder rung (7 chunks a march) | the winner’s rungs with 70 hunters (`WINNER_RUNGS_DEPTH`); its finale is `finaleFor` on the 99 hunters three repeats leave | rider-2 1,640, rider-3 904, epic-monster-hunter-6 70* · rider-2 1,434, rider-3 790, epic-monster-hunter-6 99* | 3 + finale | 9,549,141 | 11,256,800 | 31 | 2,224 | 0 | 1,453 | 0.848 | 161,269 | 4,294 | — | -3.61 | yes (lasts 8) | | -28.24 | -9.43 |
| | | | 4 × repeat | 9,228,056 | 11,622,400 | 28 | 2,016 | 0 | 1,500 | 0.794 | 161,791 | 4,577 | — | | | | **-0.29** | -27.32 | -10.07 |
| 2. the tighter shape (S-93, `tighterShape`) | the sizer over a prefix of five troop types, Elite, the 70 hunters as caps: fields 50 (5 chunks); **the finale is not re-sized** | rider-1 828, archer-2 1,125, spearman-2 893, rider-2 457, rider-3 256, epic-monster-hunter-6 50* · rider-2 1,434, rider-3 790, epic-monster-hunter-6 99* | 3 + finale | 10,156,338 | 9,503,600 | 25 | 1,792 | 0 | 967 | 1.069 | 258,218 | 5,668 | — | 17.97 | yes (lasts 15) | | -8.17 | 5.93 |
| | | | 4 × repeat | 10,037,652 | 9,284,800 | 20 | 1,440 | 0 | 853 | 1.081 | 323,582 | 6,971 | — | | | | **7.52** | -0.55 | 10.41 |
| 3. the put-back (`putBackOn`) and the tighter shape again | no put-back taken, nothing tightened: the row of step 2 | rider-1 828, archer-2 1,125, spearman-2 893, rider-2 457, rider-3 256, epic-monster-hunter-6 50* · rider-2 1,434, rider-3 790, epic-monster-hunter-6 99* | 3 + finale | 10,156,338 | 9,503,600 | 25 | 1,792 | 0 | 967 | 1.069 | 258,218 | 5,668 | — | 17.97 | yes (lasts 15) | | -8.17 | 5.93 |
| | | | 4 × repeat | 10,037,652 | 9,284,800 | 20 | 1,440 | 0 | 853 | 1.081 | 323,582 | 6,971 | — | | | | **7.52** | -0.55 | 10.41 |
| 4. the rated re-typing (W11, `retypeRow`) — the bar’s SW | each march re-typed in place, hired kept to the unit: the repeat +11.9 % damage, the finale spearman-2 for rider-2 (same damage, cheaper) | spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50* · spearman-2 2,795, rider-3 790, epic-monster-hunter-6 99* | 3 + finale | 11,049,924 | 9,468,000 | 25 | 1,792 | 0 | 965 | 1.167 | 258,218 | 6,166 | — | 29.01 | yes (lasts 15) | | 0.00 | 13.71 |
| | | | 4 × repeat | 11,229,100 | 9,286,000 | 20 | 1,440 | 0 | 855 | 1.209 | 323,582 | 7,798 | — | | | | **10.22** | 10.22 | 20.69 |

**Where it is lost.** At step 1 the rung’s repeat burns 7 chunks, and the finale spending the 99 hunters left is worth more than a fourth repeat. Step 2 lowers the repeat to 50 hunters (5 chunks) and leaves the finale sized for the 7-chunk repeat — `tighterShape` says so itself (*“the finale is not re-sized … what it does not do is spend the stock the tightening freed”*). From that step on, the repeat is sustained a fourth time and beats the finale on every reading; nothing in the plan asks. `finaleFor` could not have offered it: every finale it scores fields **all** the leftovers (lowered only by the shelter), never a subset such as the repeat itself. Step 4 widens the gap (the re-typed repeat gains 11.9 %, the finale 0 %).


## B. The prototype: the repeat played once more in place of the finale, gated by `rate()`

Patch (worktree of 0a688ac, not shipped): in `planCampaign`, after each row’s re-typing (`retypeRow`), a row with a finale whose repeat the stock sustains one march more (`lastsMarches ≥ repeats + 1` on every hired type) plays that repeat in place of the finale when `rate(finale, repeat, markerRates) > 0` on the plan’s own march prices (`toMarch`), and S-58 B still holds. The row keeps its march count; its totals move by (repeat − finale). `keepReadings` and everything after the re-typing read the folded row. Each stop is rated `rate(before, after)` on the benchmark’s campaign bill, stops matched by pick.

| army | stops better / equal / worse (worst) | most damage | least silver | fewest hired lost | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS dominated | TS no fit | criteria before | criteria after |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 0 / 1 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 0 / 1 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 0 / 2 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 8 → 8 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 0 / 2 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 4 → 4 | 0 → 0 | ✓ | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 1 / 3 / 0 (0.00) | = | = | = | = | = | = | = | **+2.04 %** | = | = | 7 → 7 | 0 → 0 | ✓ | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 3 → 3 | ✓ | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 10 → 10 | 0 → 0 | ✓ | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 6 → 6 | 3 → 3 | ✓ | ✓ |
| 2026-09-17 export, 12 000 leadership | 0 / 4 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 2 → 2 | ✓ | ✓ |
| live account of 2026-09-18 (one hired type,  | 1 / 3 / 0 (0.00) | = | = | = | = | = | = | = | **+2.04 %** | **+2.26 %** | = | 9 → 9 | 0 → 0 | ✓ | ✓ |
| live account, evening (hunters 83, legionari | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 6 → 6 | 0 → 0 | ✓ | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 0 / 4 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 0 → 0 | ✓ | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 0 → 0 | ✓ | ✓ |
| his camp of 2026-09-19, the localStorage dum | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his camp of 2026-09-19, as his message reads | 2 / 3 / 0 (0.00) | = | **+6.97 %** | **+46.67 %** | **+45.45 %** | = | **+27.95 %** | **+3.61 %** | **+25.31 %** | **+82.96 %** | = | 2 → 2 | 1 → 1 | ✓ | SW beats MX |
| his TotalStack profile of 2026-09-19 (5 225  | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 1 / 2 / 0 (0.00) | **+0.09 %** | = | = | = | = | = | **+2.02 %** | **+9.09 %** | = | = | 5 → 5 | 2 → 2 | ✓ | SW beats MX |


Stops rated (after against before): **5 better / 56 equal / 0 worse**; no stop rated worse; 0 stops on one bar only. TotalStack at matched spend (dominated / no stop fits): 70 / 13 → 70 / 13. Armies with a bar criterion broken: 0 → 2.

| reading | armies better | armies worse |
|---|---:|---:|
| most damage | 1 | 0 |
| least silver | 1 | 0 |
| fewest hired lost | 1 | 0 |
| least gold | 1 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 1 | 0 |
| dmg a silver | 2 | 0 |
| dmg a merc | 4 | 0 |
| dmg a gold | 2 | 0 |
| dmg a coin | 0 | 0 |


### Every stop that moved (last march before → after)

| army | stop | last march before | last march after | damage | silver | hired lost | gold | coins | queue h | rating |
|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Epic Monster Hunter VI ×83 ( | SW | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 65* | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 60* | 28,945,936 → 28,730,044 | 32,525,600 → 32,525,600 | 25 → 24 | 1,760 → 1,728 | 0 → 0 | 2,524 → 2,524 | **0.42** |
| live account of 2026-09-18 (one hired type,  | SW | archer-1 4,585, rider-1 1,834, spearman-2 1,948, spearman-1 3,433, archer-2 2,353, rider-3 529, rider-2 923, epic-monster-hunter-6 65* | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 60* | 28,270,883 → 28,384,288 | 30,516,200 → 30,928,400 | 25 → 24 | 1,760 → 1,728 | 0 → 0 | 1,999 → 2,026 | **1.26** |
| his camp of 2026-09-19, as his message reads | SS | rider-2 1,321, rider-3 728, epic-monster-hunter-6 114* | archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 20* | 8,331,637 → 7,388,536 | 7,741,400 → 7,201,600 | 18 → 8 | 1,248 → 576 | 0 → 0 | 657 → 473 | **12.65** |
| his camp of 2026-09-19, as his message reads | SW | spearman-2 2,795, rider-3 790, epic-monster-hunter-6 99* | spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50* | 11,049,924 → 11,229,100 | 9,468,000 → 9,286,000 | 25 → 20 | 1,792 → 1,440 | 0 → 0 | 965 → 855 | **10.22** |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123, epic-monster-hunter-6 19*, water-elemental 18*, battle-boar 8*, emerald-dragon 7*, stone-gargoyle 6* | swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123, stone-gargoyle 12*, epic-monster-hunter-6 19*, emerald-dragon 13*, battle-boar 1*, water-elemental 2* | 11,485,771 → 11,766,708 | 8,092,800 → 8,126,400 | 8 → 8 | 544 → 544 | 5,760 → 6,240 | 507 → 512 | **1.29** |


## B2. The same, guarded: a fold that leaves a stop beaten by another stop (or beaten itself) is handed back

| army | stops better / equal / worse (worst) | most damage | least silver | fewest hired lost | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS dominated | TS no fit | criteria before | criteria after |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 0 / 1 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 0 / 1 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 0 / 2 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 8 → 8 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 0 / 2 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 4 → 4 | 0 → 0 | ✓ | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 1 / 3 / 0 (0.00) | = | = | = | = | = | = | = | **+2.04 %** | = | = | 7 → 7 | 0 → 0 | ✓ | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 3 → 3 | ✓ | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 10 → 10 | 0 → 0 | ✓ | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 6 → 6 | 3 → 3 | ✓ | ✓ |
| 2026-09-17 export, 12 000 leadership | 0 / 4 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 2 → 2 | ✓ | ✓ |
| live account of 2026-09-18 (one hired type,  | 1 / 3 / 0 (0.00) | = | = | = | = | = | = | = | **+2.04 %** | **+2.26 %** | = | 9 → 9 | 0 → 0 | ✓ | ✓ |
| live account, evening (hunters 83, legionari | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 6 → 6 | 0 → 0 | ✓ | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 0 / 4 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 0 → 0 | ✓ | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 0 → 0 | ✓ | ✓ |
| his camp of 2026-09-19, the localStorage dum | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his camp of 2026-09-19, as his message reads | 1 / 4 / 0 (0.00) | = | **+6.97 %** | **+46.67 %** | **+45.45 %** | = | **+27.95 %** | = | **+25.31 %** | **+82.96 %** | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 5 → 5 | 2 → 2 | ✓ | ✓ |


Stops rated (after against before): **3 better / 58 equal / 0 worse**; no stop rated worse; 0 stops on one bar only. TotalStack at matched spend (dominated / no stop fits): 70 / 13 → 70 / 13. Armies with a bar criterion broken: 0 → 0.

| reading | armies better | armies worse |
|---|---:|---:|
| most damage | 0 | 0 |
| least silver | 1 | 0 |
| fewest hired lost | 1 | 0 |
| least gold | 1 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 1 | 0 |
| dmg a silver | 0 | 0 |
| dmg a merc | 3 | 0 |
| dmg a gold | 2 | 0 |
| dmg a coin | 0 | 0 |


### Every stop that moved (last march before → after)

| army | stop | last march before | last march after | damage | silver | hired lost | gold | coins | queue h | rating |
|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Epic Monster Hunter VI ×83 ( | SW | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 65* | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 60* | 28,945,936 → 28,730,044 | 32,525,600 → 32,525,600 | 25 → 24 | 1,760 → 1,728 | 0 → 0 | 2,524 → 2,524 | **0.42** |
| live account of 2026-09-18 (one hired type,  | SW | archer-1 4,585, rider-1 1,834, spearman-2 1,948, spearman-1 3,433, archer-2 2,353, rider-3 529, rider-2 923, epic-monster-hunter-6 65* | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 60* | 28,270,883 → 28,384,288 | 30,516,200 → 30,928,400 | 25 → 24 | 1,760 → 1,728 | 0 → 0 | 1,999 → 2,026 | **1.26** |
| his camp of 2026-09-19, as his message reads | SS | rider-2 1,321, rider-3 728, epic-monster-hunter-6 114* | archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 20* | 8,331,637 → 7,388,536 | 7,741,400 → 7,201,600 | 18 → 8 | 1,248 → 576 | 0 → 0 | 657 → 473 | **12.65** |


## B3. The same, and a rung a folded stop beats on damage, silver, burn and gold is dropped from the bar

| army | stops better / equal / worse (worst) | most damage | least silver | fewest hired lost | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS dominated | TS no fit | criteria before | criteria after |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 0 / 1 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×2 (20 000 leadership | 0 / 1 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×3 (20 000 leadership | 0 / 2 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 8 → 8 | 0 → 0 | ✓ | ✓ |
| first-run army, Bear V ×10 (20 000 leadershi | 0 / 2 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 4 → 4 | 0 → 0 | ✓ | ✓ |
| first-run army, Epic Monster Hunter VI ×83 ( | 1 / 3 / 0 (0.00) | = | = | = | = | = | = | = | **+2.04 %** | = | = | 7 → 7 | 0 → 0 | ✓ | ✓ |
| first-run army, monster tiers 3–5 at 900 dom | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 3 → 3 | ✓ | ✓ |
| the 4 000-leadership case of 2026-09-15 (Tot | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 10 → 10 | 0 → 0 | ✓ | ✓ |
| 2026-09-17 export, its setup (7 000 leadersh | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 6 → 6 | 3 → 3 | ✓ | ✓ |
| 2026-09-17 export, 12 000 leadership | 0 / 4 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 3 → 3 | 2 → 2 | ✓ | ✓ |
| live account of 2026-09-18 (one hired type,  | 1 / 3 / 0 (0.00) | = | = | = | = | = | = | = | **+2.04 %** | **+2.26 %** | = | 9 → 9 | 0 → 0 | ✓ | ✓ |
| live account, evening (hunters 83, legionari | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 6 → 6 | 0 → 0 | ✓ | ✓ |
| Aydae alone, 4 975 (one captain, four hired  | 0 / 4 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 0 → 0 | ✓ | ✓ |
| the owner’s live camp of 2026-09-18 (arbales | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 0 → 0 | 0 → 0 | ✓ | ✓ |
| his camp of 2026-09-19, the localStorage dum | 0 / 5 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his camp of 2026-09-19, as his message reads | 2 / 2 / 0 (0.00) | = | **+6.97 %** | **+46.67 %** | **+45.45 %** | = | **+27.95 %** | **+3.61 %** | **+25.31 %** | **+82.96 %** | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his TotalStack profile of 2026-09-19 (5 225  | 0 / 3 / 0 (0.00) | = | = | = | = | = | = | = | = | = | = | 2 → 2 | 1 → 1 | ✓ | ✓ |
| his usual setup of 2026-09-19 (Aydae alone,  | 1 / 1 / 0 (0.00) | **+3.27 %** | = | = | = | = | = | **+2.02 %** | **+9.09 %** | = | **+3.27 %** | 5 → 2 | 2 → 2 | ✓ | ✓ |


Stops rated (after against before): **5 better / 54 equal / 0 worse**; no stop rated worse; 3 stops on one bar only. TotalStack at matched spend (dominated / no stop fits): 70 / 13 → 67 / 13. Armies with a bar criterion broken: 0 → 0.

| reading | armies better | armies worse |
|---|---:|---:|
| most damage | 1 | 0 |
| least silver | 1 | 0 |
| fewest hired lost | 1 | 0 |
| least gold | 1 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 1 | 0 |
| dmg a silver | 2 | 0 |
| dmg a merc | 4 | 0 |
| dmg a gold | 2 | 0 |
| dmg a coin | 1 | 0 |


### Every stop that moved (last march before → after)

| army | stop | last march before | last march after | damage | silver | hired lost | gold | coins | queue h | rating |
|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Epic Monster Hunter VI ×83 ( | SW | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 65* | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, epic-monster-hunter-6 60* | 28,945,936 → 28,730,044 | 32,525,600 → 32,525,600 | 25 → 24 | 1,760 → 1,728 | 0 → 0 | 2,524 → 2,524 | **0.42** |
| live account of 2026-09-18 (one hired type,  | SW | archer-1 4,585, rider-1 1,834, spearman-2 1,948, spearman-1 3,433, archer-2 2,353, rider-3 529, rider-2 923, epic-monster-hunter-6 65* | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 60* | 28,270,883 → 28,384,288 | 30,516,200 → 30,928,400 | 25 → 24 | 1,760 → 1,728 | 0 → 0 | 1,999 → 2,026 | **1.26** |
| his camp of 2026-09-19, as his message reads | SS | rider-2 1,321, rider-3 728, epic-monster-hunter-6 114* | archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 20* | 8,331,637 → 7,388,536 | 7,741,400 → 7,201,600 | 18 → 8 | 1,248 → 576 | 0 → 0 | 657 → 473 | **12.65** |
| his camp of 2026-09-19, as his message reads | SW | spearman-2 2,795, rider-3 790, epic-monster-hunter-6 99* | spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50* | 11,049,924 → 11,229,100 | 9,468,000 → 9,286,000 | 25 → 20 | 1,792 → 1,440 | 0 → 0 | 965 → 855 | **10.22** |
| his camp of 2026-09-19, as his message reads | MX | only before | | | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123, epic-monster-hunter-6 19*, water-elemental 18*, battle-boar 8*, emerald-dragon 7*, stone-gargoyle 6* | swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123, stone-gargoyle 12*, epic-monster-hunter-6 19*, emerald-dragon 13*, battle-boar 1*, water-elemental 2* | 11,485,771 → 11,766,708 | 8,092,800 → 8,126,400 | 8 → 8 | 544 → 544 | 5,760 → 6,240 | 507 → 512 | **1.29** |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | only before | | | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone,  | AI | only after | | | | | | | | |


## C. Verdict (as measured on the worktree patch, 2026-09-23)

- **The losing step is the tighter shape (S-93)**, not the search, the shelter or the sustain: it lowers the repeat from 7 chunks to 5 and keeps the finale the 7-chunk repeat left, and no later step asks whether the repeat, now sustained a fourth time, beats that finale. The re-typing widens the gap from +7.52 to +10.22.
- **B (plain):** the message camp’s SW becomes the filled march (+10.22) and its SS folds too (+12.65, though −11.3 % damage); two SW elsewhere +0.42 and +1.26, usual setup SW +1.29. No stop rated worse, no reading worse, TotalStack unchanged — but two bars now carry a stop beaten by another (SW beats MX on the message camp and on his usual setup).
- **B2 (guarded):** no criterion broken, no stop worse, TotalStack unchanged, but the message camp’s SW fold is handed back: the gap §2c asks about stays open (only SS moves there).
- **B3 (drop the beaten rung):** captures +10.22 with no criterion broken, but drops MX on two bars and TotalStack at matched spend falls 70 → 67 dominated (his usual setup 5 → 2): a marker worse.
- **No overlap with 6a7d00c**, which scores S-97 ladder maxima on their own ladder inside the search; this acts on rows after the search, on the finale the tighter shape leaves. It is the row-level sibling of §2d (the finale sized by the march’s own shape).

