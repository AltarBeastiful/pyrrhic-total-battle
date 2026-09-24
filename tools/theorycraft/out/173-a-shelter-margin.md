# 173 — a shelter margin

Owner, 2026-09-24, shown marches sheltering their hired stacks at 1.00× the lowest troop stack: *"2 % seems fair but could be configurable without clogging the ui, maybe hidden for now and conduct an experiment"*. `CAMPAIGN.shelterMargin`: every hired stack strictly under `floor × (1 − margin)`, wherever the engine decides or checks the shelter. Every benchmark army planned as the app plans it (`CAMPAIGN.planFixes`, the put-back at the app’s rates), `budgetMs` off. Four-march campaigns priced by `campaignOf` (worst opening). Stops paired by pick against margin 0; `rate(margin 0, margin m, markerRates)`: **better** > 0, **equal** 0, **worse** < 0. Criteria are 169’s (the shelter read strictly). Margin of a march = `1 − hired top / troop floor`.


**Margin 0 against HEAD (3c4b23d)**: 17 of 17 armies byte-identical (`JSON.stringify(plan.alternatives)`).


## Per margin, against margin 0

| margin | stops better / equal / worse | worst | readings worse | TotalStack matched spend (dominated / no fit) | armies breaking a criterion | tier twin | min margin on the bar | marches under 1 % / under 2 % |
|---|---|---|---:|---|---:|---|---:|---|
| 0.00 % | 0 / 61 / 0 | — | 0 | 70 / 13 of 112 | 0 | 22 pass / 0 fail / 117 inadm. (139) | 0.01 % | 41 / 63 of 135 |
| 1.00 % | 10 / 30 / 19 | −11.446 (the owner’s live camp of 2026-09-18 (arbales SW) | 27 | 72 / 13 of 112 | 0 | 21 pass / 0 fail / 120 inadm. (141) | 1.04 % | 0 / 51 of 137 |
| 2.00 % | 12 / 19 / 26 | −6.193 (2026-09-17 export, 12 000 leadership SW) | 34 | 71 / 13 of 112 | 0 | 17 pass / 0 fail / 113 inadm. (130) | 2.09 % | 0 / 0 of 126 |
| 5.00 % | 14 / 15 / 25 | −9.669 (first-run army, monster tiers 3–5 at 900 dom HS) | 35 | 63 / 11 of 112 | 0 | 21 pass / 0 fail / 104 inadm. (125) | 5.03 % | 0 / 0 of 121 |


## Margin 1.00 % — every stop that moved

| army | stop | rating | damage | silver | gold | hired | queue | margin |
|---|---|---:|---|---|---|---|---|---|
| first-run army, Bear V ×10 (20 000 leadershi | AI | −0.956 | 21,290,233 → 21,173,742 | 36,008,300 → 36,557,600 | 4,800 → 4,800 | 4 → 4 | 3,422.97 h → 3,564.73 h | 0.43 % → 8.07 % |
| first-run army, monster tiers 3–5 at 900 dom | SW | +1.117 | 89,486,680 → 93,588,286 | 35,230,000 → 35,230,000 | 9,424 → 10,272 | 24 → 26 | 2,912.53 h → 2,912.53 h | 3.76 % → 7.83 % |
| first-run army, monster tiers 3–5 at 900 dom | MX | +1.073 | 97,759,924 → 94,497,727 | 36,432,700 → 35,147,200 | 14,232 → 12,264 | 32 → 32 | 3,214.65 h → 2,896.53 h | 0.43 % → 3.85 % |
| first-run army, monster tiers 3–5 at 900 dom | AI | −0.711 | 103,197,710 → 101,300,812 | 37,309,700 → 37,309,700 | 17,888 → 16,880 | 34 → 34 | 3,444.38 h → 3,444.38 h | 0.43 % → 3.82 % |
| first-run army, monster tiers 3–5 at 900 dom | MM | disappears | | | | | | |
| 2026-09-17 export, its setup (7 000 leadersh | HS | −3.574 | 15,315,363 → 14,744,218 | 10,187,600 → 8,694,700 | 2,112 → 2,200 | 26 → 29 | 683.17 h → 583.41 h | 0.01 % → 1.33 % |
| 2026-09-17 export, its setup (7 000 leadersh | SW | +7.639 | 19,031,865 → 22,872,845 | 10,907,600 → 10,957,100 | 2,760 → 3,528 | 35 → 47 | 731.07 h → 739.85 h | 0.01 % → 1.33 % |
| 2026-09-17 export, its setup (7 000 leadersh | MM | appears | | | | | | |
| 2026-09-17 export, its setup (7 000 leadersh | MX | +2.007 | 24,300,665 → 24,474,602 | 10,959,000 → 10,957,100 | 4,000 → 3,888 | 55 → 53 | 739.88 h → 739.85 h | 0.01 % → 1.33 % |
| 2026-09-17 export, its setup (7 000 leadersh | AI | −5.968 | 24,945,884 → 24,744,639 | 12,717,200 → 13,692,700 | 5,360 → 5,760 | 73 → 79 | 1,213.05 h → 1,450.98 h | 0.01 % → 1.33 % |
| 2026-09-17 export, its setup (7 000 leadersh | SS | disappears | | | | | | |
| 2026-09-17 export, 12 000 leadership | HS | −0.009 | 22,404,202 → 22,387,190 | 17,808,900 → 17,807,700 | 2,408 → 2,400 | 30 → 30 | 1,194.52 h → 1,194.76 h | 0.45 % → 1.96 % |
| 2026-09-17 export, 12 000 leadership | SS | +3.379 | 21,273,264 → 21,981,080 | 12,129,500 → 12,129,000 | 3,056 → 3,048 | 48 → 48 | 813.86 h → 814.37 h | 0.42 % → 1.96 % |
| 2026-09-17 export, 12 000 leadership | SW | −6.132 | 34,445,770 → 29,694,131 | 18,793,200 → 18,585,300 | 4,824 → 3,904 | 67 → 55 | 1,268.87 h → 1,246.3 h | 0.45 % → 1.96 % |
| 2026-09-17 export, 12 000 leadership | MM | appears | | | | | | |
| 2026-09-17 export, 12 000 leadership | MX | +0.432 | 34,617,571 → 34,503,971 | 20,720,700 → 20,719,500 | 5,784 → 5,776 | 82 → 79 | 1,810.6 h → 1,810.85 h | 0.41 % → 1.31 % |
| live account, evening (hunters 83, legionari | SS | −0.098 | 21,392,382 → 21,360,024 | 12,306,900 → 12,306,900 | 3,032 → 3,024 | 48 → 48 | 805.8 h → 805.8 h | 0.12 % → 1.23 % |
| live account, evening (hunters 83, legionari | AI | −0.109 | 34,784,291 → 34,719,881 | 19,233,100 → 19,233,100 | 6,272 → 6,248 | 89 → 89 | 1,667.25 h → 1,667.25 h | 0.96 % → 1.69 % |
| Aydae alone, 4 975 (one captain, four hired  | SW | −1.927 | 15,598,199 → 13,321,466 | 7,684,400 → 7,353,200 | 2,440 → 1,840 | 37 → 25 | 500.09 h → 419.57 h | 0.40 % → 3.58 % |
| Aydae alone, 4 975 (one captain, four hired  | MM | appears | | | | | | |
| Aydae alone, 4 975 (one captain, four hired  | MX | +0.517 | 18,213,822 → 18,113,655 | 8,666,100 → 8,547,500 | 4,360 → 4,208 | 61 → 61 | 748.76 h → 719.95 h | 1.27 % → 1.51 % |
| Aydae alone, 4 975 (one captain, four hired  | AI | +0.046 | 18,750,522 → 18,713,814 | 11,241,200 → 11,241,200 | 7,848 → 7,824 | 111 → 110 | 1,425.4 h → 1,425.4 h | 0.38 % → 1.04 % |
| the owner’s live camp of 2026-09-18 (arbales | HS | −0.190 | 8,820,632 → 8,794,146 | 7,251,100 → 7,251,100 | 1,448 → 1,440 | 16 → 16 | 476.29 h → 476.29 h | 0.43 % → 3.75 % |
| the owner’s live camp of 2026-09-18 (arbales | SS | −0.129 | 8,393,455 → 8,380,212 | 6,773,900 → 6,773,900 | 5,480 → 5,472 | 34 → 34 | 753.38 h → 753.38 h | 0.43 % → 3.75 % |
| the owner’s live camp of 2026-09-18 (arbales | SW | −11.446 | 15,862,148 → 12,575,433 | 9,850,300 → 9,850,300 | 6,344 → 5,232 | 52 → 37 | 1,024.55 h → 1,024.55 h | 0.43 % → 1.77 % |
| the owner’s live camp of 2026-09-18 (arbales | MM | −0.114 | 31,715,963 → 31,673,023 | 13,734,000 → 13,734,000 | 30,120 → 30,088 | 218 → 218 | 2,289 h → 2,289 h | 0.13 % → 1.11 % |
| the owner’s live camp of 2026-09-18 (arbales | MX | −0.299 | 49,190,513 → 49,018,753 | 13,927,200 → 13,927,200 | 51,192 → 51,064 | 344 → 344 | 2,321.2 h → 2,321.2 h | 0.13 % → 1.11 % |
| his camp of 2026-09-19, the localStorage dum | MM | −0.221 | 14,142,349 → 14,093,812 | 10,354,100 → 10,354,100 | 3,944 → 3,920 | 57 → 57 | 1,221.65 h → 1,221.65 h | 0.49 % → 1.06 % |
| his camp of 2026-09-19, as his message reads | SW | −0.550 | 10,462,502 → 10,365,428 | 8,940,500 → 8,940,500 | 1,272 → 1,248 | 18 → 18 | 770.42 h → 770.42 h | 0.21 % → 1.40 % |
| his camp of 2026-09-19, as his message reads | MX | −0.476 | 11,058,844 → 10,977,949 | 9,897,900 → 9,897,900 | 2,504 → 2,472 | 35 → 35 | 1,113.43 h → 1,113.43 h | 0.24 % → 1.53 % |
| his camp of 2026-09-19, as his message reads | AI | −0.084 | 11,589,922 → 11,573,743 | 10,706,600 → 10,706,600 | 2,888 → 2,880 | 41 → 41 | 1,304.83 h → 1,304.83 h | 0.36 % → 1.26 % |
| his TotalStack profile of 2026-09-19 (5 225  | SW | +6.466 | 8,250,940 → 7,506,904 | 8,344,200 → 7,995,600 | 1,320 → 864 | 19 → 12 | 571.16 h → 486.4 h | 1.36 % → 20.07 % |
| his TotalStack profile of 2026-09-19 (5 225  | MX | +7.023 | 8,443,234 → 8,250,940 | 8,706,000 → 8,344,200 | 1,584 → 1,320 | 25 → 19 | 659.98 h → 571.16 h | 0.28 % → 1.36 % |
| his TotalStack profile of 2026-09-19 (5 225  | AI | appears | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | −0.682 | 11,485,771 → 11,186,860 | 8,092,800 → 8,036,800 | 544 → 544 | 8 → 8 | 506.57 h → 497.23 h | 0.91 % → 3.23 % |

**Readings worse, criteria broken**:

- first-run army, Bear V ×10 (20 000 leadershi: most damage -0.547 %
- first-run army, Bear V ×10 (20 000 leadershi: dmg a merc -9.639 %
- first-run army, monster tiers 3–5 at 900 dom: most damage -1.838 %
- first-run army, monster tiers 3–5 at 900 dom: least gold -8.998 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a silver -1.838 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a gold -4.050 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a coin -1.838 %
- 2026-09-17 export, its setup (7 000 leadersh: most damage -0.807 %
- 2026-09-17 export, its setup (7 000 leadersh: least silver -0.280 %
- 2026-09-17 export, its setup (7 000 leadersh: fewest hired lost -11.538 %
- 2026-09-17 export, its setup (7 000 leadersh: least gold -4.167 %
- 2026-09-17 export, its setup (7 000 leadersh: shortest queue -1.152 %
- 2026-09-17 export, its setup (7 000 leadersh: dmg a merc -3.425 %
- 2026-09-17 export, its setup (7 000 leadersh: dmg a gold -7.580 %
- 2026-09-17 export, 12 000 leadership: most damage -0.328 %
- 2026-09-17 export, 12 000 leadership: shortest queue -0.062 %
- 2026-09-17 export, 12 000 leadership: dmg a silver -0.172 %
- 2026-09-17 export, 12 000 leadership: dmg a merc -0.291 %
- live account, evening (hunters 83, legionari: most damage -0.185 %
- Aydae alone, 4 975 (one captain, four hired : most damage -0.196 %
- the owner’s live camp of 2026-09-18 (arbales: most damage -0.349 %
- the owner’s live camp of 2026-09-18 (arbales: dmg a silver -0.349 %
- the owner’s live camp of 2026-09-18 (arbales: dmg a merc -0.643 %
- his camp of 2026-09-19, as his message reads: most damage -0.140 %
- his camp of 2026-09-19, as his message reads: dmg a silver -0.928 %
- his usual setup of 2026-09-19 (Aydae alone, : dmg a silver -1.924 %
- his usual setup of 2026-09-19 (Aydae alone, : dmg a merc -24.976 %


## Margin 2.00 % — every stop that moved

| army | stop | rating | damage | silver | gold | hired | queue | margin |
|---|---|---:|---|---|---|---|---|---|
| first-run army, Bear V ×10 (20 000 leadershi | AI | −0.956 | 21,290,233 → 21,173,742 | 36,008,300 → 36,557,600 | 4,800 → 4,800 | 4 → 4 | 3,422.97 h → 3,564.73 h | 0.43 % → 8.07 % |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | +0.028 | 22,814,644 → 22,771,465 | 32,525,600 → 32,525,600 | 736 → 728 | 11 → 11 | 2,523.83 h → 2,523.83 h | 1.05 % → 2.40 % |
| first-run army, monster tiers 3–5 at 900 dom | HS | −0.038 | 81,548,470 → 81,505,291 | 34,920,400 → 34,920,400 | 11,072 → 11,064 | 15 → 15 | 2,862.93 h → 2,862.93 h | 1.05 % → 2.40 % |
| first-run army, monster tiers 3–5 at 900 dom | SW | +1.117 | 89,486,680 → 93,588,286 | 35,230,000 → 35,230,000 | 9,424 → 10,272 | 24 → 26 | 2,912.53 h → 2,912.53 h | 3.76 % → 7.83 % |
| first-run army, monster tiers 3–5 at 900 dom | MX | +1.073 | 97,759,924 → 94,497,727 | 36,432,700 → 35,147,200 | 14,232 → 12,264 | 32 → 32 | 3,214.65 h → 2,896.53 h | 0.43 % → 3.85 % |
| first-run army, monster tiers 3–5 at 900 dom | AI | −0.711 | 103,197,710 → 101,300,812 | 37,309,700 → 37,309,700 | 17,888 → 16,880 | 34 → 34 | 3,444.38 h → 3,444.38 h | 0.43 % → 3.82 % |
| first-run army, monster tiers 3–5 at 900 dom | MM | disappears | | | | | | |
| 2026-09-17 export, its setup (7 000 leadersh | HS | −3.177 | 15,315,363 → 14,289,326 | 10,187,600 → 8,695,700 | 2,112 → 2,088 | 26 → 26 | 683.17 h → 583.17 h | 0.01 % → 3.04 % |
| 2026-09-17 export, its setup (7 000 leadersh | SS | −1.653 | 16,259,746 → 16,035,846 | 8,670,400 → 8,695,000 | 2,496 → 2,520 | 32 → 32 | 576.76 h → 582.94 h | 0.03 % → 3.04 % |
| 2026-09-17 export, its setup (7 000 leadersh | SW | −0.244 | 19,031,865 → 18,952,397 | 10,907,600 → 10,907,600 | 2,760 → 2,736 | 35 → 35 | 731.07 h → 731.07 h | 0.01 % → 3.04 % |
| 2026-09-17 export, its setup (7 000 leadersh | MM | appears | | | | | | |
| 2026-09-17 export, its setup (7 000 leadersh | MX | +2.792 | 24,300,665 → 24,453,353 | 10,959,000 → 10,961,000 | 4,000 → 3,712 | 55 → 53 | 739.88 h → 739.78 h | 0.01 % → 3.04 % |
| 2026-09-17 export, its setup (7 000 leadersh | AI | disappears | | | | | | |
| 2026-09-17 export, 12 000 leadership | HS | −0.086 | 22,404,202 → 22,354,994 | 17,808,900 → 17,807,700 | 2,408 → 2,392 | 30 → 30 | 1,194.52 h → 1,194.76 h | 0.45 % → 3.47 % |
| 2026-09-17 export, 12 000 leadership | SS | +3.280 | 21,273,264 → 21,948,884 | 12,129,500 → 12,129,000 | 3,056 → 3,040 | 48 → 48 | 813.86 h → 814.37 h | 0.42 % → 3.47 % |
| 2026-09-17 export, 12 000 leadership | SW | −6.193 | 34,445,770 → 29,661,935 | 18,793,200 → 18,585,300 | 4,824 → 3,896 | 67 → 55 | 1,268.87 h → 1,246.3 h | 0.45 % → 3.47 % |
| 2026-09-17 export, 12 000 leadership | MM | appears | | | | | | |
| 2026-09-17 export, 12 000 leadership | MX | +0.171 | 34,617,571 → 34,375,187 | 20,720,700 → 20,719,500 | 5,784 → 5,744 | 82 → 79 | 1,810.6 h → 1,810.85 h | 0.41 % → 2.20 % |
| live account, evening (hunters 83, legionari | HS | +0.391 | 20,575,534 → 20,284,882 | 15,338,400 → 15,304,200 | 2,296 → 2,240 | 32 → 30 | 1,013.52 h → 1,004.72 h | 1.56 % → 3.24 % |
| live account, evening (hunters 83, legionari | SS | −0.926 | 21,392,382 → 20,704,162 | 12,306,900 → 11,660,100 | 3,032 → 2,864 | 48 → 48 | 805.8 h → 763.3 h | 0.12 % → 3.24 % |
| live account, evening (hunters 83, legionari | SW | +6.344 | 29,479,912 → 33,936,200 | 17,073,600 → 17,181,600 | 4,056 → 5,000 | 61 → 73 | 1,124.63 h → 1,149.97 h | 1.56 % → 3.15 % |
| live account, evening (hunters 83, legionari | MX | disappears | | | | | | |
| live account, evening (hunters 83, legionari | AI | disappears | | | | | | |
| Aydae alone, 4 975 (one captain, four hired  | SW | −1.927 | 15,598,199 → 13,321,466 | 7,684,400 → 7,353,200 | 2,440 → 1,840 | 37 → 25 | 500.09 h → 419.57 h | 0.40 % → 3.58 % |
| Aydae alone, 4 975 (one captain, four hired  | MM | appears | | | | | | |
| Aydae alone, 4 975 (one captain, four hired  | MX | −0.605 | 18,213,822 → 18,056,859 | 8,666,100 → 8,666,100 | 4,360 → 4,304 | 61 → 61 | 748.76 h → 748.76 h | 1.27 % → 3.19 % |
| Aydae alone, 4 975 (one captain, four hired  | AI | −0.154 | 18,750,522 → 18,649,575 | 11,241,200 → 11,241,200 | 7,848 → 7,768 | 111 → 110 | 1,425.4 h → 1,425.4 h | 0.38 % → 2.37 % |
| the owner’s live camp of 2026-09-18 (arbales | HS | −0.190 | 8,820,632 → 8,794,146 | 7,251,100 → 7,251,100 | 1,448 → 1,440 | 16 → 16 | 476.29 h → 476.29 h | 0.43 % → 3.75 % |
| the owner’s live camp of 2026-09-18 (arbales | SS | +32.425 | 8,393,455 → 8,999,552 | 6,773,900 → 7,065,600 | 5,480 → 1,504 | 34 → 16 | 753.38 h → 462.37 h | 0.43 % → 19.99 % |
| the owner’s live camp of 2026-09-18 (arbales | SW | −1.305 | 15,862,148 → 12,188,559 | 9,850,300 → 8,738,800 | 6,344 → 3,264 | 52 → 28 | 1,024.55 h → 755.28 h | 0.43 % → 3.16 % |
| the owner’s live camp of 2026-09-18 (arbales | MM | −0.210 | 31,715,963 → 31,574,643 | 13,734,000 → 13,734,000 | 30,120 → 29,904 | 218 → 217 | 2,289 h → 2,289 h | 0.13 % → 2.09 % |
| the owner’s live camp of 2026-09-18 (arbales | MX | −0.579 | 49,190,513 → 48,625,233 | 13,927,200 → 13,927,200 | 51,192 → 50,328 | 344 → 340 | 2,321.2 h → 2,321.2 h | 0.13 % → 2.09 % |
| his camp of 2026-09-19, the localStorage dum | HS | −0.058 | 6,943,378 → 6,911,020 | 7,733,000 → 7,733,000 | 392 → 384 | 6 → 6 | 510.28 h → 510.28 h | 1.95 % → 5.45 % |
| his camp of 2026-09-19, the localStorage dum | SS | −2.783 | 7,561,467 → 7,064,179 | 7,313,300 → 6,762,800 | 848 → 760 | 12 → 12 | 627.01 h → 573.56 h | 1.95 % → 2.26 % |
| his camp of 2026-09-19, the localStorage dum | SW | −0.188 | 9,367,909 → 9,335,551 | 8,747,300 → 8,747,300 | 1,016 → 1,008 | 15 → 15 | 759.85 h → 759.85 h | 1.95 % → 5.45 % |
| his camp of 2026-09-19, the localStorage dum | MM | −0.853 | 14,142,349 → 13,964,380 | 10,354,100 → 10,354,100 | 3,944 → 3,864 | 57 → 57 | 1,221.65 h → 1,221.65 h | 0.49 % → 2.21 % |
| his camp of 2026-09-19, as his message reads | HS | −0.100 | 6,580,946 → 6,548,588 | 7,681,400 → 7,681,400 | 408 → 400 | 6 → 6 | 570.15 h → 570.15 h | 1.40 % → 5.05 % |
| his camp of 2026-09-19, as his message reads | SW | −0.734 | 10,462,502 → 10,333,070 | 8,940,500 → 8,940,500 | 1,272 → 1,240 | 18 → 18 | 770.42 h → 770.42 h | 0.21 % → 2.21 % |
| his camp of 2026-09-19, as his message reads | MX | −0.723 | 11,058,844 → 10,929,412 | 9,897,900 → 9,897,900 | 2,504 → 2,448 | 35 → 35 | 1,113.43 h → 1,113.43 h | 0.24 % → 2.32 % |
| his camp of 2026-09-19, as his message reads | AI | −0.168 | 11,589,922 → 11,557,564 | 10,706,600 → 10,706,600 | 2,888 → 2,872 | 41 → 41 | 1,304.83 h → 1,304.83 h | 0.36 % → 2.17 % |
| his TotalStack profile of 2026-09-19 (5 225  | SS | +0.105 | 4,919,095 → 4,907,839 | 4,431,600 → 4,431,600 | 480 → 472 | 7 → 7 | 278.7 h → 278.7 h | 1.30 % → 3.97 % |
| his TotalStack profile of 2026-09-19 (5 225  | SW | +6.466 | 8,250,940 → 7,506,904 | 8,344,200 → 7,995,600 | 1,320 → 864 | 19 → 12 | 571.16 h → 486.4 h | 1.36 % → 20.07 % |
| his TotalStack profile of 2026-09-19 (5 225  | MX | +6.894 | 8,443,234 → 8,205,916 | 8,706,000 → 8,344,200 | 1,584 → 1,288 | 25 → 19 | 659.98 h → 571.16 h | 0.28 % → 3.38 % |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | −0.682 | 11,485,771 → 11,186,860 | 8,092,800 → 8,036,800 | 544 → 544 | 8 → 8 | 506.57 h → 497.23 h | 0.91 % → 3.23 % |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | −0.232 | 11,756,170 → 11,659,096 | 8,698,800 → 8,698,800 | 808 → 784 | 14 → 14 | 662.52 h → 662.52 h | 1.25 % → 3.23 % |

**Readings worse, criteria broken**:

- first-run army, Bear V ×10 (20 000 leadershi: most damage -0.547 %
- first-run army, Bear V ×10 (20 000 leadershi: dmg a merc -9.639 %
- first-run army, monster tiers 3–5 at 900 dom: most damage -1.838 %
- first-run army, monster tiers 3–5 at 900 dom: least gold -8.998 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a silver -1.838 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a gold -4.050 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a coin -1.838 %
- 2026-09-17 export, its setup (7 000 leadersh: most damage -1.974 %
- 2026-09-17 export, its setup (7 000 leadersh: least silver -0.284 %
- 2026-09-17 export, its setup (7 000 leadersh: shortest queue -1.071 %
- 2026-09-17 export, its setup (7 000 leadersh: dmg a merc -0.635 %
- 2026-09-17 export, its setup (7 000 leadersh: dmg a gold -4.476 %
- 2026-09-17 export, 12 000 leadership: most damage -0.700 %
- 2026-09-17 export, 12 000 leadership: shortest queue -0.062 %
- 2026-09-17 export, 12 000 leadership: dmg a silver -0.546 %
- 2026-09-17 export, 12 000 leadership: dmg a merc -0.581 %
- live account, evening (hunters 83, legionari: most damage -2.438 %
- live account, evening (hunters 83, legionari: dmg a silver -0.630 %
- Aydae alone, 4 975 (one captain, four hired : most damage -0.538 %
- Aydae alone, 4 975 (one captain, four hired : dmg a silver -0.862 %
- the owner’s live camp of 2026-09-18 (arbales: most damage -1.149 %
- the owner’s live camp of 2026-09-18 (arbales: least silver -4.306 %
- the owner’s live camp of 2026-09-18 (arbales: dmg a silver -1.149 %
- his camp of 2026-09-19, the localStorage dum: dmg a merc -4.407 %
- his camp of 2026-09-19, as his message reads: most damage -0.279 %
- his camp of 2026-09-19, as his message reads: dmg a silver -1.237 %
- his TotalStack profile of 2026-09-19 (5 225 : most damage -2.811 %
- his TotalStack profile of 2026-09-19 (5 225 : dmg a silver -0.229 %
- his TotalStack profile of 2026-09-19 (5 225 : dmg a merc -1.220 %
- his TotalStack profile of 2026-09-19 (5 225 : dmg a coin -2.811 %
- his usual setup of 2026-09-19 (Aydae alone, : most damage -0.826 %
- his usual setup of 2026-09-19 (Aydae alone, : dmg a silver -1.924 %
- his usual setup of 2026-09-19 (Aydae alone, : dmg a merc -24.976 %
- his usual setup of 2026-09-19 (Aydae alone, : dmg a coin -0.826 %


## Margin 5.00 % — every stop that moved

| army | stop | rating | damage | silver | gold | hired | queue | margin |
|---|---|---:|---|---|---|---|---|---|
| first-run army, Bear V ×10 (20 000 leadershi | AI | −0.956 | 21,290,233 → 21,173,742 | 36,008,300 → 36,557,600 | 4,800 → 4,800 | 4 → 4 | 3,422.97 h → 3,564.73 h | 0.43 % → 8.07 % |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | +12.978 | 22,814,644 → 20,094,424 | 32,525,600 → 32,525,600 | 736 → 288 | 11 → 4 | 2,523.83 h → 2,523.83 h | 1.05 % → 86.44 % |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | −0.064 | 30,140,049 → 30,096,870 | 33,289,200 → 33,289,200 | 2,016 → 2,008 | 30 → 30 | 2,721.96 h → 2,721.96 h | 4.68 % → 5.83 % |
| first-run army, monster tiers 3–5 at 900 dom | HS | −9.669 | 81,548,470 → 61,640,242 | 34,920,400 → 25,926,700 | 11,072 → 2,392 | 15 → 17 | 2,862.93 h → 2,292.9 h | 1.05 % → 5.11 % |
| first-run army, monster tiers 3–5 at 900 dom | SW | −7.651 | 89,486,680 → 66,365,974 | 35,230,000 → 25,764,300 | 9,424 → 3,232 | 24 → 23 | 2,912.53 h → 2,468.52 h | 3.76 % → 5.11 % |
| first-run army, monster tiers 3–5 at 900 dom | AI | −5.247 | 103,197,710 → 83,048,575 | 37,309,700 → 35,449,600 | 17,888 → 5,464 | 34 → 32 | 3,444.38 h → 2,951.13 h | 0.43 % → 5.11 % |
| first-run army, monster tiers 3–5 at 900 dom | MM | disappears | | | | | | |
| first-run army, monster tiers 3–5 at 900 dom | MX | disappears | | | | | | |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | −2.492 | 8,985,057 → 8,753,351 | 6,085,400 → 6,071,800 | 1,336 → 1,328 | 24 → 24 | 380.74 h → 392.63 h | 4.01 % → 10.87 % |
| 2026-09-17 export, its setup (7 000 leadersh | HS | +2.856 | 15,315,363 → 15,683,245 | 10,187,600 → 10,187,800 | 2,112 → 2,064 | 26 → 26 | 683.17 h → 683.25 h | 0.01 % → 6.26 % |
| 2026-09-17 export, its setup (7 000 leadersh | SS | +0.134 | 16,259,746 → 16,295,196 | 8,670,400 → 8,695,000 | 2,496 → 2,496 | 32 → 32 | 576.76 h → 582.94 h | 0.03 % → 6.07 % |
| 2026-09-17 export, its setup (7 000 leadersh | SW | +2.280 | 19,031,865 → 19,399,747 | 10,907,600 → 10,907,800 | 2,760 → 2,712 | 35 → 35 | 731.07 h → 731.15 h | 0.01 % → 6.26 % |
| 2026-09-17 export, its setup (7 000 leadersh | MM | appears | | | | | | |
| 2026-09-17 export, its setup (7 000 leadersh | MX | +2.319 | 24,300,665 → 24,612,416 | 10,959,000 → 10,961,200 | 4,000 → 3,792 | 55 → 55 | 739.88 h → 739.87 h | 0.01 % → 6.26 % |
| 2026-09-17 export, its setup (7 000 leadersh | AI | disappears | | | | | | |
| 2026-09-17 export, 12 000 leadership | HS | −0.240 | 22,404,202 → 22,290,602 | 17,808,900 → 17,807,700 | 2,408 → 2,376 | 30 → 30 | 1,194.52 h → 1,194.76 h | 0.45 % → 6.48 % |
| 2026-09-17 export, 12 000 leadership | SS | +3.082 | 21,273,264 → 21,884,492 | 12,129,500 → 12,129,000 | 3,056 → 3,024 | 48 → 48 | 813.86 h → 814.37 h | 0.42 % → 6.48 % |
| 2026-09-17 export, 12 000 leadership | SW | −6.313 | 34,445,770 → 29,597,543 | 18,793,200 → 18,585,300 | 4,824 → 3,880 | 67 → 55 | 1,268.87 h → 1,246.3 h | 0.45 % → 6.48 % |
| 2026-09-17 export, 12 000 leadership | MM | appears | | | | | | |
| 2026-09-17 export, 12 000 leadership | MX | disappears | | | | | | |
| live account, evening (hunters 83, legionari | HS | +2.577 | 20,575,534 → 20,805,287 | 15,338,400 → 15,337,600 | 2,296 → 2,272 | 32 → 30 | 1,013.52 h → 1,013.33 h | 1.56 % → 5.47 % |
| live account, evening (hunters 83, legionari | SS | −0.434 | 21,392,382 → 21,132,571 | 12,306,900 → 12,014,100 | 3,032 → 2,992 | 48 → 48 | 805.8 h → 792.79 h | 0.12 % → 5.47 % |
| live account, evening (hunters 83, legionari | SW | +8.557 | 29,479,912 → 34,058,297 | 17,073,600 → 17,180,800 | 4,056 → 4,968 | 61 → 68 | 1,124.63 h → 1,149.78 h | 1.56 % → 5.47 % |
| live account, evening (hunters 83, legionari | MX | disappears | | | | | | |
| live account, evening (hunters 83, legionari | AI | disappears | | | | | | |
| Aydae alone, 4 975 (one captain, four hired  | HS | +0.449 | 9,450,218 → 9,415,298 | 5,777,000 → 5,565,900 | 1,288 → 1,288 | 19 → 19 | 323.18 h → 311.82 h | 3.58 % → 8.65 % |
| Aydae alone, 4 975 (one captain, four hired  | SW | −2.878 | 15,598,199 → 13,518,257 | 7,684,400 → 7,353,300 | 2,440 → 1,912 | 37 → 28 | 500.09 h → 419.65 h | 0.40 % → 8.65 % |
| Aydae alone, 4 975 (one captain, four hired  | MM | appears | | | | | | |
| Aydae alone, 4 975 (one captain, four hired  | MX | −0.813 | 18,213,822 → 17,771,068 | 8,666,100 → 8,547,500 | 4,360 → 4,088 | 61 → 61 | 748.76 h → 719.95 h | 1.27 % → 5.22 % |
| Aydae alone, 4 975 (one captain, four hired  | AI | −5.185 | 18,750,522 → 18,108,297 | 11,241,200 → 11,380,400 | 7,848 → 8,056 | 111 → 116 | 1,425.4 h → 1,471.8 h | 0.38 % → 5.03 % |
| the owner’s live camp of 2026-09-18 (arbales | HS | −0.512 | 8,820,632 → 8,746,190 | 7,251,100 → 7,251,100 | 1,448 → 1,424 | 16 → 16 | 476.29 h → 476.29 h | 0.43 % → 7.06 % |
| the owner’s live camp of 2026-09-18 (arbales | SS | +32.425 | 8,393,455 → 8,999,552 | 6,773,900 → 7,065,600 | 5,480 → 1,504 | 34 → 16 | 753.38 h → 462.37 h | 0.43 % → 19.99 % |
| the owner’s live camp of 2026-09-18 (arbales | SW | −1.301 | 15,862,148 → 13,945,622 | 9,850,300 → 9,850,300 | 6,344 → 5,120 | 52 → 34 | 1,024.55 h → 1,024.55 h | 0.43 % → 5.12 % |
| the owner’s live camp of 2026-09-18 (arbales | MM | −0.535 | 31,715,963 → 31,390,383 | 13,734,000 → 13,734,000 | 30,120 → 29,656 | 218 → 216 | 2,289 h → 2,289 h | 0.13 % → 5.03 % |
| the owner’s live camp of 2026-09-18 (arbales | MX | −1.457 | 49,190,513 → 47,888,193 | 13,927,200 → 13,927,200 | 51,192 → 49,336 | 344 → 336 | 2,321.2 h → 2,321.2 h | 0.13 % → 5.03 % |
| his camp of 2026-09-19, the localStorage dum | HS | −0.058 | 6,943,378 → 6,911,020 | 7,733,000 → 7,733,000 | 392 → 384 | 6 → 6 | 510.28 h → 510.28 h | 1.95 % → 5.45 % |
| his camp of 2026-09-19, the localStorage dum | SS | −3.022 | 7,561,467 → 7,031,821 | 7,313,300 → 6,762,800 | 848 → 752 | 12 → 12 | 627.01 h → 573.56 h | 1.95 % → 6.02 % |
| his camp of 2026-09-19, the localStorage dum | SW | −0.188 | 9,367,909 → 9,335,551 | 8,747,300 → 8,747,300 | 1,016 → 1,008 | 15 → 15 | 759.85 h → 759.85 h | 1.95 % → 5.45 % |
| his camp of 2026-09-19, the localStorage dum | MM | −1.029 | 14,142,349 → 13,721,695 | 10,354,100 → 10,354,100 | 3,944 → 3,768 | 57 → 54 | 1,221.65 h → 1,221.65 h | 0.49 % → 5.07 % |
| his camp of 2026-09-19, as his message reads | HS | −0.103 | 6,580,946 → 6,548,522 | 7,681,400 → 7,679,600 | 408 → 400 | 6 → 6 | 570.15 h → 571.68 h | 1.40 % → 5.05 % |
| his camp of 2026-09-19, as his message reads | SW | −5.427 | 10,462,502 → 8,480,030 | 8,940,500 → 8,961,200 | 1,272 → 832 | 18 → 12 | 770.42 h → 775.72 h | 0.21 % → 5.05 % |
| his camp of 2026-09-19, as his message reads | MX | −1.922 | 11,058,844 → 10,719,085 | 9,897,900 → 9,897,900 | 2,504 → 2,360 | 35 → 35 | 1,113.43 h → 1,113.43 h | 0.24 % → 5.51 % |
| his camp of 2026-09-19, as his message reads | AI | −1.871 | 11,589,922 → 11,425,499 | 10,706,600 → 11,052,900 | 2,888 → 2,840 | 41 → 41 | 1,304.83 h → 1,376.98 h | 0.36 % → 5.79 % |
| his TotalStack profile of 2026-09-19 (5 225  | SS | +0.209 | 4,919,095 → 4,896,583 | 4,431,600 → 4,431,600 | 480 → 464 | 7 → 7 | 278.7 h → 278.7 h | 1.30 % → 6.63 % |
| his TotalStack profile of 2026-09-19 (5 225  | SW | +6.466 | 8,250,940 → 7,506,904 | 8,344,200 → 7,995,600 | 1,320 → 864 | 19 → 12 | 571.16 h → 486.4 h | 1.36 % → 20.07 % |
| his TotalStack profile of 2026-09-19 (5 225  | MX | +1.742 | 8,443,234 → 8,319,418 | 8,706,000 → 8,706,000 | 1,584 → 1,520 | 25 → 22 | 659.98 h → 659.98 h | 0.28 % → 5.10 % |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | −7.965 | 8,211,151 → 7,387,084 | 6,132,900 → 6,063,900 | 352 → 320 | 5 → 5 | 374.63 h → 370.45 h | 3.23 % → 8.33 % |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | +1.123 | 11,485,771 → 11,611,932 | 8,092,800 → 8,126,400 | 544 → 512 | 8 → 8 | 506.57 h → 512.17 h | 0.91 % → 7.11 % |
| his usual setup of 2026-09-19 (Aydae alone,  | AI | appears | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | disappears | | | | | | |

**Readings worse, criteria broken**:

- first-run army, Bear V ×10 (20 000 leadershi: most damage -0.547 %
- first-run army, Bear V ×10 (20 000 leadershi: dmg a merc -9.639 %
- first-run army, Epic Monster Hunter VI ×83 (: most damage -0.143 %
- first-run army, monster tiers 3–5 at 900 dom: most damage -19.525 %
- first-run army, monster tiers 3–5 at 900 dom: fewest hired lost -13.333 %
- first-run army, monster tiers 3–5 at 900 dom: fewest coins -31.343 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a silver -6.872 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a merc -17.102 %
- first-run army, monster tiers 3–5 at 900 dom: dmg a coin -31.312 %
- the 4 000-leadership case of 2026-09-15 (Tot: most damage -2.579 %
- the 4 000-leadership case of 2026-09-15 (Tot: dmg a silver -2.361 %
- 2026-09-17 export, its setup (7 000 leadersh: most damage -1.337 %
- 2026-09-17 export, its setup (7 000 leadersh: least silver -0.284 %
- 2026-09-17 export, its setup (7 000 leadersh: shortest queue -1.071 %
- 2026-09-17 export, its setup (7 000 leadersh: dmg a merc -0.330 %
- 2026-09-17 export, 12 000 leadership: most damage -1.809 %
- 2026-09-17 export, 12 000 leadership: shortest queue -0.062 %
- 2026-09-17 export, 12 000 leadership: dmg a silver -1.294 %
- 2026-09-17 export, 12 000 leadership: dmg a merc -1.163 %
- live account, evening (hunters 83, legionari: most damage -2.087 %
- live account, evening (hunters 83, legionari: dmg a silver -0.268 %
- Aydae alone, 4 975 (one captain, four hired : most damage -3.425 %
- Aydae alone, 4 975 (one captain, four hired : dmg a silver -1.077 %
- Aydae alone, 4 975 (one captain, four hired : dmg a gold -0.370 %
- the owner’s live camp of 2026-09-18 (arbales: most damage -2.648 %
- the owner’s live camp of 2026-09-18 (arbales: least silver -4.306 %
- the owner’s live camp of 2026-09-18 (arbales: dmg a silver -2.648 %
- his camp of 2026-09-19, the localStorage dum: dmg a merc -4.407 %
- his camp of 2026-09-19, as his message reads: most damage -1.419 %
- his camp of 2026-09-19, as his message reads: dmg a silver -7.458 %
- his TotalStack profile of 2026-09-19 (5 225 : most damage -1.466 %
- his TotalStack profile of 2026-09-19 (5 225 : dmg a silver -0.458 %
- his TotalStack profile of 2026-09-19 (5 225 : dmg a merc -2.439 %
- his TotalStack profile of 2026-09-19 (5 225 : dmg a coin -1.466 %
- his usual setup of 2026-09-19 (Aydae alone, : dmg a gold -1.040 %


## the owner’s live camp of 2026-09-18

| margin | stop | damage | silver | gold | hired | queue | margin kept |
|---|---|---:|---:|---:|---:|---:|---:|
| 0.00 % | HS | 8,820,632 | 7,251,100 | 1,448 | 16 | 476.29 h | 0.43 % |
| 0.00 % | SS | 8,393,455 | 6,773,900 | 5,480 | 34 | 753.38 h | 0.43 % |
| 0.00 % | SW | 15,862,148 | 9,850,300 | 6,344 | 52 | 1,024.55 h | 0.43 % |
| 0.00 % | MM | 31,715,963 | 13,734,000 | 30,120 | 218 | 2,289 h | 0.13 % |
| 0.00 % | MX | 49,190,513 | 13,927,200 | 51,192 | 344 | 2,321.2 h | 0.13 % |
| 2.00 % | HS | 8,794,146 | 7,251,100 | 1,440 | 16 | 476.29 h | 3.75 % |
| 2.00 % | SS | 8,999,552 | 7,065,600 | 1,504 | 16 | 462.37 h | 19.99 % |
| 2.00 % | SW | 12,188,559 | 8,738,800 | 3,264 | 28 | 755.28 h | 3.16 % |
| 2.00 % | MM | 31,574,643 | 13,734,000 | 29,904 | 217 | 2,289 h | 2.09 % |
| 2.00 % | MX | 48,625,233 | 13,927,200 | 50,328 | 340 | 2,321.2 h | 2.09 % |


## his camp of 2026-09-19, as his message reads it

| margin | stop | damage | silver | gold | hired | queue | margin kept |
|---|---|---:|---:|---:|---:|---:|---:|
| 0.00 % | HS | 6,580,946 | 7,681,400 | 408 | 6 | 570.15 h | 1.40 % |
| 0.00 % | SS | 7,388,536 | 7,201,600 | 576 | 8 | 473.37 h | 19.87 % |
| 0.00 % | SW | 10,462,502 | 8,940,500 | 1,272 | 18 | 770.42 h | 0.21 % |
| 0.00 % | MX | 11,058,844 | 9,897,900 | 2,504 | 35 | 1,113.43 h | 0.24 % |
| 0.00 % | AI | 11,589,922 | 10,706,600 | 2,888 | 41 | 1,304.83 h | 0.36 % |
| 2.00 % | HS | 6,548,588 | 7,681,400 | 400 | 6 | 570.15 h | 5.05 % |
| 2.00 % | SS | 7,388,536 | 7,201,600 | 576 | 8 | 473.37 h | 19.87 % |
| 2.00 % | SW | 10,333,070 | 8,940,500 | 1,240 | 18 | 770.42 h | 2.21 % |
| 2.00 % | MX | 10,929,412 | 9,897,900 | 2,448 | 35 | 1,113.43 h | 2.32 % |
| 2.00 % | AI | 11,557,564 | 10,706,600 | 2,872 | 41 | 1,304.83 h | 2.17 % |

