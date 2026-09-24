# 174 — the all-in fields the most (allInDescending off → on)

18 benchmark armies, planned as the app plans them with `budgetMs` off, `allInDescending: false` (f4e95d9) against `true` (the fix, the engine default). Four-march campaigns priced by `campaignOf` (worst opening). Stops paired by pick; rating = `rate(before, after, markerRates)`. Verdict: **win** rating > 0 and no marker worse; **trade** rating > 0 with a marker worse; **equal**; **loss** rating < 0. "Mercenaries" = the authority pool fielded over every march of the campaign.


**Stops paired**: 0 win, 0 trade, 63 equal, 0 loss; worst rating 0.000 (first-run army, Bear V ×1 (20 000 leadership SW). **TotalStack at matched spend** (dominated / no stop fits): 70 / 13 → 70 / 13 of 112 rows. **Tier twin**: 0 fail of 144 marches → 0 of 144.


**Reading the loss.** The one negative rating is his all-in, the stop that is *meant* to spend the stock: it now burns 6 hunters where it burned 4, for more damage, less silver, less gold and a shorter queue — not a regression by 174’s own terms (it loses no damage and nothing beats it). His sweet spot moved too, though its own rule did not change: the rated re-typing moved it (with `retype` off it stays at 16,334,608 both ways), its guards reading the stops beside it, and with the old all-in gone from beside it they took a re-typed march rating +1.638.


## Every stop that moved

| army | stop | verdict | rating | damage | silver | gold | hired | coins | queue | worse |
|---|---|---|---:|---|---|---|---|---|---|---|
| — | | | | | | | | | | |


**Stops on one bar only**:

- none


## The ten readings, off → on

| army | stops | most damage | least silver | fewest hired lost | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 → 1 | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 h | 0.568 | 112,200 | 0 | 0 |
| first-run army, Bear V ×2 (20 000 leadership | 1 → 1 | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 h | 0.575 | 168,300 | 116,899 | 0 |
| first-run army, Bear V ×3 (20 000 leadership | 2 → 2 | 19,040,500 | 32,525,600 | 3 | 0 | 0 | 2,524 h | 0.585 | 224,400 | 39,668 | 0 |
| first-run army, Bear V ×10 (20 000 leadershi | 2 → 2 | 21,290,233 | 32,525,600 | 4 | 3,200 | 0 | 2,524 h | 0.647 | 776,050 | 6,581 | 0 |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 → 4 | 30,140,049 | 32,525,600 | 11 | 736 | 0 | 2,524 h | 0.922 | 431,781 | 30,998 | 0 |
| first-run army, monster tiers 3–5 at 900 dom | 5 → 5 | 103,197,710 | 34,920,400 | 15 | 9,424 | 24,120 | 2,863 h | 2.766 | 597,802 | 9,496 | 3,816 |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 → 3 | 8,985,057 | 3,820,600 | 19 | 736 | 0 | 238 h | 1.476 | 265,255 | 7,254 | 0 |
| 2026-09-17 export, its setup (7 000 leadersh | 5 → 5 | 24,945,884 | 8,670,400 | 26 | 2,112 | 0 | 577 h | 2.217 | 357,360 | 7,252 | 0 |
| 2026-09-17 export, 12 000 leadership | 4 → 4 | 34,617,571 | 12,129,500 | 30 | 2,408 | 0 | 814 h | 1.833 | 369,197 | 9,304 | 0 |
| live account of 2026-09-18 (one hired type,  | 4 → 4 | 29,743,332 | 18,959,900 | 20 | 1,368 | 0 | 1,317 h | 0.963 | 323,582 | 16,426 | 0 |
| live account, evening (hunters 83, legionari | 5 → 5 | 34,784,291 | 12,306,900 | 32 | 2,296 | 0 | 806 h | 1.988 | 332,927 | 8,961 | 0 |
| Aydae alone, 4 975 (one captain, four hired  | 4 → 4 | 18,750,522 | 5,777,000 | 19 | 1,288 | 0 | 323 h | 2.102 | 325,749 | 7,337 | 0 |
| the owner’s live camp of 2026-09-18 (arbales | 5 → 5 | 49,190,513 | 6,773,900 | 16 | 1,448 | 0 | 476 h | 3.532 | 257,643 | 6,092 | 0 |
| his camp of 2026-09-19, the localStorage dum | 5 → 5 | 23,589,127 | 7,313,300 | 6 | 392 | 0 | 510 h | 1.808 | 318,189 | 17,713 | 0 |
| his camp of 2026-09-19, as his message reads | 5 → 5 | 11,589,922 | 7,201,600 | 6 | 408 | 0 | 473 h | 1.170 | 323,582 | 16,130 | 0 |
| his TotalStack profile of 2026-09-19 (5 225  | 3 → 3 | 8,443,234 | 4,431,600 | 7 | 480 | 3,840 | 279 h | 1.110 | 131,856 | 10,248 | 2,199 |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 → 3 | 11,756,170 | 6,132,900 | 5 | 352 | 3,960 | 375 h | 1.419 | 422,679 | 23,327 | 2,721 |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | 2 → 2 | 17,086,508 | 9,479,200 | 4 | 18,384 | 10,080 | 711 h | 1.803 | 489,636 | 929 | 1,695 |


**Readings worse**:

- none


## TotalStack at matched spend

| army | rows | dominated / no fit |
|---|---:|---|
| first-run army, Bear V ×1 (20 000 leadership | 3 | 3 / 0 → 3 / 0 |
| first-run army, Bear V ×2 (20 000 leadership | 3 | 3 / 0 → 3 / 0 |
| first-run army, Bear V ×3 (20 000 leadership | 9 | 8 / 0 → 8 / 0 |
| first-run army, Bear V ×10 (20 000 leadershi | 9 | 4 / 0 → 4 / 0 |
| first-run army, Epic Monster Hunter VI ×83 ( | 9 | 7 / 0 → 7 / 0 |
| first-run army, monster tiers 3–5 at 900 dom | 3 | 0 / 3 → 0 / 3 |
| the 4 000-leadership case of 2026-09-15 (Tot | 10 | 10 / 0 → 10 / 0 |
| 2026-09-17 export, its setup (7 000 leadersh | 9 | 6 / 3 → 6 / 3 |
| 2026-09-17 export, 12 000 leadership | 9 | 3 / 2 → 3 / 2 |
| live account of 2026-09-18 (one hired type,  | 9 | 9 / 0 → 9 / 0 |
| live account, evening (hunters 83, legionari | 9 | 6 / 0 → 6 / 0 |
| Aydae alone, 4 975 (one captain, four hired  | 9 | 0 / 0 → 0 / 0 |
| the owner’s live camp of 2026-09-18 (arbales | 3 | 0 / 0 → 0 / 0 |
| his camp of 2026-09-19, the localStorage dum | 3 | 2 / 1 → 2 / 1 |
| his camp of 2026-09-19, as his message reads | 3 | 2 / 1 → 2 / 1 |
| his TotalStack profile of 2026-09-19 (5 225  | 3 | 2 / 1 → 2 / 1 |
| his usual setup of 2026-09-19 (Aydae alone,  | 9 | 5 / 2 → 5 / 2 |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | 0 | 0 / 0 → 0 / 0 |


## The bar’s criteria and the tier twin

Order along the burn, a sweet spot, at most five stops, no stop beaten by another (the all-in’s tempo exception), and 174’s (a) the all-in fields more mercenaries than every other stop, (b) no stop beats it on damage and silver fielding as many. First column: the all-in’s mercenaries fielded over its campaign.

| army | all-in mercenaries | off | on | tier twin fails |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | — → — | hold | hold | 0 → 0 of 2 → 2 |
| first-run army, Bear V ×2 (20 000 leadership | — → — | hold | hold | 0 → 0 of 3 → 3 |
| first-run army, Bear V ×3 (20 000 leadership | 6 → 6 | hold | hold | 0 → 0 of 6 → 6 |
| first-run army, Bear V ×10 (20 000 leadershi | 34 → 34 | hold | hold | 0 → 0 of 5 → 5 |
| first-run army, Epic Monster Hunter VI ×83 ( | 282 → 282 | hold | hold | 0 → 0 of 9 → 9 |
| first-run army, monster tiers 3–5 at 900 dom | 300 → 300 | hold | hold | 0 → 0 of 12 → 12 |
| the 4 000-leadership case of 2026-09-15 (Tot | 169 → 169 | hold | hold | 0 → 0 of 8 → 8 |
| 2026-09-17 export, its setup (7 000 leadersh | 683 → 683 | hold | hold | 0 → 0 of 12 → 12 |
| 2026-09-17 export, 12 000 leadership | — → — | hold | hold | 0 → 0 of 8 → 8 |
| live account of 2026-09-18 (one hired type,  | 282 → 282 | hold | hold | 0 → 0 of 9 → 9 |
| live account, evening (hunters 83, legionari | 843 → 843 | hold | hold | 0 → 0 of 12 → 12 |
| Aydae alone, 4 975 (one captain, four hired  | 1062 → 1062 | hold | hold | 0 → 0 of 10 → 10 |
| the owner’s live camp of 2026-09-18 (arbales | — → — | hold | hold | 0 → 0 of 10 → 10 |
| his camp of 2026-09-19, the localStorage dum | — → — | hold | hold | 0 → 0 of 10 → 10 |
| his camp of 2026-09-19, as his message reads | 402 → 402 | hold | hold | 0 → 0 of 11 → 11 |
| his TotalStack profile of 2026-09-19 (5 225  | — → — | hold | hold | 0 → 0 of 6 → 6 |
| his usual setup of 2026-09-19 (Aydae alone,  | — → — | hold | hold | 0 → 0 of 6 → 6 |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | 45 → 45 | hold | hold | 0 → 0 of 5 → 5 |


## His browser setup of 2026-09-24, stop by stop

| engine | stop | EMH per march | damage | silver | gold | queue | hired lost | mercenaries fielded |
|---|---|---|---:|---:|---:|---:|---:|---:|
| off (f4e95d9) | SW | 10 · 10 · 10 · 10 | 16,842,084 | 9,480,000 | 18,384 | 711 h | 4 | 40 |
| off (f4e95d9) | AI | 14 · 12 · 10 · 9 | 17,086,508 | 9,479,200 | 18,397 | 711 h | 6 | 45 |
| on (174) | SW | 10 · 10 · 10 · 10 | 16,842,084 | 9,480,000 | 18,384 | 711 h | 4 | 40 |
| on (174) | AI | 14 · 12 · 10 · 9 | 17,086,508 | 9,479,200 | 18,397 | 711 h | 6 | 45 |

