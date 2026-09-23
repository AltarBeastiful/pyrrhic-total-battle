# 156 — the cheapest sponge

The bar as shipped (hired saver, fold to five, troop wall). Four-march campaigns, worst opening, default recovery; silver is what retraining a stack costs under that recovery plan.

## §A — the evening pair: the all-in’s repeated march, stack by stack

| stack (kill order) | pool | count | HP | silver | dealt worst-opening |
|---|---|---:|---:|---:|---:|
| spearman-1 | leadership | 3,050 | 921,100 | 915,000 | 0 |
| rider-1 | leadership | 1,563 | 919,044 | 937,800 | 507,975 |
| archer-2 | leadership | 2,124 | 917,568 | 1,062,000 | 0 |
| rider-2 | leadership | 865 | 915,170 | 865,000 | 557,406 |
| rider-3 | leadership | 485 | 912,770 | 679,000 | 630,112 |
| legionary-6 | authority | 79 | 905,103 | 0 (hired: gold) | 1,696,130 |
| epic-monster-hunter-6 | authority | 83 | 798,626 | 0 (hired: gold) | 2,685,730 |
| arbalester-6 | authority | 60 | 547,200 | 0 (hired: gold) | 1,589,160 |
| chariot-6 | authority | 10 | 223,440 | 0 (hired: gold) | 572,280 |

Every troop type the account holds, cheapest silver a point of HP first:

| troop | HP a unit | silver a unit | leadership a unit | silver a 1 000 HP | damage a 1 000 HP |
|---|---:|---:|---:|---:|---:|
| rider-3 | 1,882 | 1,400 | 2 | 743.9 | 690.2 |
| spearman-2 | 543 | 500 | 1 | 920.8 | 545.1 |
| rider-2 | 1,058 | 1,000 | 2 | 945.2 | 608.7 |
| spearman-1 | 302 | 300 | 1 | 993.4 | 513.2 |
| rider-1 | 588 | 600 | 2 | 1020.4 | 552.7 |
| archer-2 | 432 | 500 | 1 | 1157.4 | 601.9 |
| archer-1 | 240 | 300 | 1 | 1250.0 | 533.3 |


## §B — what the plan costs to compute

| use case | plan time | hired types (authority / dominance) | plans summarised | undominated | in the band | stops |
|---|---:|---|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | 61 ms | 1 / 0 | 2 | 2 | 1 | 1 |
| first-run army, Bear V ×2 (20 000 leadership) | 50 ms | 1 / 0 | 7 | 6 | 2 | 1 |
| first-run army, Bear V ×3 (20 000 leadership) | 38 ms | 1 / 0 | 2 | 2 | 1 | 2 |
| first-run army, Bear V ×10 (20 000 leadership) | 60 ms | 1 / 0 | 18 | 14 | 13 | 2 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 l | 109 ms | 1 / 0 | 30 | 24 | 16 | 4 |
| first-run army, monster tiers 3–5 at 900 dominance ( | 9,079 ms | 2 / 12 | 6,648 | 1,999 | 1,919 | 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’ | 693 ms | 4 / 0 | 1,075 | 132 | 14 | 3 |
| 2026-09-17 export, its setup (7 000 leadership) | 1,700 ms | 4 / 0 | 2,649 | 327 | 222 | 5 |
| 2026-09-17 export, 12 000 leadership | 1,534 ms | 4 / 0 | 2,243 | 201 | 169 | 4 |
| live account of 2026-09-18 (one hired type, 20 000 l | 71 ms | 1 / 0 | 46 | 37 | 28 | 4 |
| live account, evening (hunters 83, legionaries unlim | 1,082 ms | 4 / 0 | 1,717 | 168 | 113 | 5 |
| Aydae alone, 4 975 (one captain, four hired types —  | 1,099 ms | 4 / 0 | 1,109 | 332 | 273 | 4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485 | 804 ms | 3 / 0 | 1,028 | 292 | 117 | 5 |
| his camp of 2026-09-19, the localStorage dump (4 975 | 126 ms | 1 / 0 | 124 | 92 | 89 | 5 |
| his camp of 2026-09-19, as his message reads it (5 1 | 91 ms | 1 / 0 | 75 | 69 | 67 | 5 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120  | 2,976 ms | 1 / 4 | 3,818 | 305 | 223 | 3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 /  | 3,772 ms | 1 / 4 | 4,186 | 627 | 512 | 3 |


## §C — the cheapest sponge, swapped in on every stop

61 stops in all; **61** field a troop stack that dies before it strikes; the swap fits the leadership on **38** (23 have no room). Of those, **12** read a better damage a silver, **1** lose damage, and **0** would leave a hired stack unsheltered. Silver over the swapped stops: 491,963,900 → 487,979,800 (-0.8 %).

| use case | stop | swap (first march) | damage | silver | hired lost | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | shelter |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| the 4 000-leadership case of 2026- | SS | swordsman-1 304 → swordsman-1 305 | 5,212,861 | **3,821,500 (−0.0 %)** | 19 | 736 | 0 | **238 h (−0.0 %)** | **1.364 (−0.0 %)** | 189,918 | 7,083 | — | ✓ |
| 2026-09-17 export, its setup (7 00 | HS | spearman-1 1,218 → spearman-1 1,219 | 15,079,846 | **10,188,200 (−0.0 %)** | 26 | 2,112 | 0 | **683 h (−0.0 %)** | **1.480 (−0.0 %)** | 355,600 | 7,140 | — | ✓ |
| 2026-09-17 export, its setup (7 00 | SS | spearman-1 975 → spearman-1 976 | 16,115,314 | **8,696,300 (−0.0 %)** | 32 | 2,544 | 0 | **583 h (−0.0 %)** | **1.853 (−0.0 %)** | 350,864 | 6,335 | — | ✓ |
| 2026-09-17 export, its setup (7 00 | SW | spearman-1 1,337 → spearman-1 1,338 | 18,796,348 | **10,908,200 (−0.0 %)** | 35 | 2,760 | 0 | **731 h (−0.0 %)** | **1.723 (−0.0 %)** | 357,360 | 6,810 | — | ✓ |
| 2026-09-17 export, its setup (7 00 | MX | archer-1 1,569 → rider-1 700; rider-1 696 → archer-2 868; archer-2 866 → archer-1 1,559 | 22,770,620 | **10,959,200 (−0.0 %)** | 55 | 4,000 | 0 | **739 h (−0.0 %)** | **2.078 (−0.0 %)** | 328,937 | 5,693 | — | ✓ |
| 2026-09-17 export, its setup (7 00 | AI | archer-2 2,932 → spearman-2 2,383 | 23,619,920 | **14,356,100 (+5.4 %)** | 92 | 6,608 | 0 | **1,711 h (+4.6 %)** | **1.645 (+5.7 %)** | 186,943 | 3,574 | — | ✓ |
| 2026-09-17 export, 12 000 leadersh | HS | spearman-1 2,145 → spearman-1 2,146 | 21,679,374 | **17,809,100 (−0.0 %)** | 30 | 2,408 | 0 | **1,194 h (−0.0 %)** | **1.217 (−0.0 %)** | 369,197 | 9,003 | — | ✓ |
| 2026-09-17 export, 12 000 leadersh | SS | spearman-1 1,216 → spearman-1 1,217 | 21,273,264 | **12,130,400 (−0.0 %)** | 48 | 3,056 | 0 | **814 h (−0.0 %)** | **1.754 (−0.0 %)** | 297,347 | 6,961 | — | ✓ |
| 2026-09-17 export, 12 000 leadersh | SW | archer-1 2,687 → rider-1 1,198; rider-1 1,193 → archer-2 1,488; archer-2 1,485 → archer-1 2,672 | 31,546,458 | 18,790,400 | 67 | 4,824 | 0 | **1,268 h (−0.0 %)** | 1.679 | 333,911 | 6,539 | — | ✓ |
| 2026-09-17 export, 12 000 leadersh | MX | archer-1 2,687 → rider-1 1,198; rider-1 1,193 → archer-2 1,488; archer-2 1,485 → archer-1 2,672 | 31,963,845 | 21,035,600 | 82 | 5,784 | 0 | **1,814 h (−0.0 %)** | 1.520 | 290,661 | 5,526 | — | ✓ |
| live account of 2026-09-18 (one hi | SS | archer-1 2,257 → archer-1 2,258 | 18,256,930 | **18,598,100 (+1.9 %)** | 20 | 1,368 | 0 | **1,312 h (+0.4 %)** | **0.982 (+1.9 %)** | 309,021 | 13,346 | — | ✓ |
| live account of 2026-09-18 (one hi | SW | archer-1 4,843 → archer-1 4,844 | 28,270,883 | **30,517,400 (−0.0 %)** | 25 | 1,760 | 0 | **1,999 h (−0.0 %)** | **0.926 (−0.0 %)** | 317,110 | 16,063 | — | ✓ |
| live account of 2026-09-18 (one hi | MX | archer-1 4,843 → archer-1 4,844 | 28,727,202 | **30,180,900 (−0.0 %)** | 28 | 1,904 | 0 | **1,977 h (−0.0 %)** | **0.952 (−0.0 %)** | 307,403 | 15,088 | — | ✓ |
| live account of 2026-09-18 (one hi | AI | archer-1 4,843 → archer-1 4,844 | 29,743,332 | **30,929,600 (−0.0 %)** | 30 | 2,016 | 0 | **2,026 h (−0.0 %)** | **0.962 (−0.0 %)** | 304,167 | 14,754 | — | ✓ |
| live account, evening (hunters 83, | HS | archer-1 2,306 → archer-1 2,307 | 19,234,820 | **15,338,800 (−0.0 %)** | 32 | 2,296 | 0 | **1,011 h (−0.0 %)** | **1.254 (−0.0 %)** | 301,580 | 8,378 | — | ✓ |
| live account, evening (hunters 83, | SS | archer-1 1,680 → archer-1 1,681 | 20,649,596 | **12,340,600 (−0.0 %)** | 50 | 3,064 | 0 | **814 h (−0.0 %)** | **1.673 (−0.0 %)** | 261,252 | 6,739 | — | ✓ |
| live account, evening (hunters 83, | SW | archer-1 2,668 → archer-1 2,669 | 28,140,302 | **17,073,100 (−0.0 %)** | 61 | 4,056 | 0 | **1,124 h (−0.0 %)** | **1.648 (−0.0 %)** | 285,220 | 6,938 | — | ✓ |
| live account, evening (hunters 83, | MX | archer-1 2,560 → rider-1 1,045; rider-1 1,040 → archer-2 1,416; archer-2 1,414 → archer-1 2,546 | 30,693,083 | **17,178,400 (+0.0 %)** | 76 | 5,040 | 0 | **1,149 h (−0.0 %)** | **1.787 (+0.0 %)** | 286,825 | 6,090 | — | ✓ |
| live account, evening (hunters 83, | AI | spearman-1 3,050 → spearman-2 1,697; archer-2 2,124 → spearman-1 3,039 | **31,676,208 (−0.1 %)** | **18,551,000 (+1.2 %)** | 88 | 6,192 | 0 | **1,518 h (+1.4 %)** | **1.708 (+1.0 %)** | 272,129 | **5,116 (−0.1 %)** | — | ✓ |
| Aydae alone, 4 975 (one captain, f | HS | swordsman-1 902 → swordsman-1 903 | 9,427,601 | **5,765,200 (−0.0 %)** | 19 | 1,288 | 0 | **324 h (−0.0 %)** | **1.635 (−0.0 %)** | 325,749 | 7,320 | — | ✓ |
| Aydae alone, 4 975 (one captain, f | MX | archer-1 2,058 → spearman-2 1,144 | 17,630,102 | **8,312,200 (+1.6 %)** | 58 | 4,120 | 0 | **842 h (−21.0 %)** | **2.121 (+1.6 %)** | 237,879 | 4,279 | — | ✓ |
| the owner’s live camp of 2026-09-1 | HS | archer-1 1,107 → archer-1 1,108 | 8,260,768 | **7,243,000 (−0.0 %)** | 16 | 1,448 | 0 | **477 h (−0.0 %)** | **1.141 (−0.0 %)** | 232,812 | 5,705 | — | ✓ |
| the owner’s live camp of 2026-09-1 | SS | rider-2 909 → spearman-2 1,772 | 8,393,455 | **6,705,100 (+1.0 %)** | 34 | 5,480 | 0 | **747 h (+0.9 %)** | **1.252 (+1.0 %)** | 159,825 | 1,532 | — | ✓ |
| the owner’s live camp of 2026-09-1 | SW | archer-1 1,158 → rider-1 473; rider-1 470 → archer-2 640; archer-2 639 → archer-1 1,151 | 15,306,859 | **9,849,400 (−0.0 %)** | 52 | 6,344 | 0 | **1,024 h (−0.0 %)** | **1.554 (−0.0 %)** | 200,697 | 2,413 | — | ✓ |
| the owner’s live camp of 2026-09-1 | MM | rider-3 2,441 → rider-3 2,442 | 20,226,481 | **12,199,300 (−0.0 %)** | 136 | 13,760 | 0 | **1,839 h (−0.0 %)** | **1.658 (−0.0 %)** | 141,322 | 1,470 | — | ✓ |
| the owner’s live camp of 2026-09-1 | MX | rider-3 2,441 → rider-3 2,442 | 30,986,506 | **12,199,300 (−0.0 %)** | 208 | 28,736 | 0 | **1,839 h (−0.0 %)** | **2.540 (−0.0 %)** | 144,134 | 1,078 | — | ✓ |
| his camp of 2026-09-19, the localS | HS | archer-1 1,208 → archer-1 1,209 | 6,638,052 | **7,724,200 (−0.0 %)** | 6 | 392 | 0 | **510 h (−0.0 %)** | **0.859 (−0.0 %)** | 296,617 | 16,934 | — | ✓ |
| his camp of 2026-09-19, the localS | SS | spearman-2 719 → spearman-2 720 | 7,561,467 | **7,315,000 (−0.0 %)** | 12 | 848 | 0 | **627 h (−0.0 %)** | **1.034 (−0.0 %)** | 318,189 | 8,917 | — | ✓ |
| his camp of 2026-09-19, the localS | SW | spearman-2 911 → spearman-2 912 | 9,068,238 | **8,748,400 (−0.0 %)** | 15 | 1,016 | 0 | **760 h (−0.0 %)** | **1.037 (−0.0 %)** | 306,324 | 8,925 | — | ✓ |
| his camp of 2026-09-19, the localS | MM | rider-2 1,593 → spearman-2 3,104 | 13,842,678 | **10,353,700 (+1.2 %)** | 57 | 3,944 | 0 | **1,221 h (+1.0 %)** | **1.337 (+1.2 %)** | 164,062 | 3,510 | — | ✓ |
| his camp of 2026-09-19, the localS | MX | rider-3 2,390 → rider-3 2,391 | 23,589,127 | **13,049,400 (−0.0 %)** | 148 | 10,480 | 0 | **2,175 h (−0.0 %)** | **1.808 (−0.0 %)** | 159,386 | 2,251 | — | ✓ |
| his camp of 2026-09-19, as his mes | HS | archer-1 1,438 → spearman-1 1,143 | 7,402,685 | **8,069,100 (+3.6 %)** | 15 | 1,056 | 0 | **749 h (+0.9 %)** | **0.917 (+3.7 %)** | 190,913 | 7,010 | — | ✓ |
| his camp of 2026-09-19, as his mes | SW | rider-2 1,434 → spearman-2 2,795 | 10,156,338 | **9,467,100 (+0.4 %)** | 25 | 1,792 | 0 | **964 h (+0.4 %)** | **1.073 (+0.4 %)** | 258,218 | 5,668 | — | ✓ |
| his camp of 2026-09-19, as his mes | MM | archer-2 2,246 → spearman-2 1,787 | 10,197,781 | **10,005,000 (+6.7 %)** | 34 | 2,416 | 0 | **1,216 h (+5.6 %)** | **1.019 (+7.2 %)** | 159,888 | 4,221 | — | ✓ |
| his camp of 2026-09-19, as his mes | MX | archer-2 2,246 → spearman-2 1,787 | 11,196,175 | **10,308,900 (+6.6 %)** | 39 | 2,808 | 0 | **1,255 h (+5.5 %)** | **1.086 (+7.1 %)** | 161,791 | 3,987 | — | ✓ |
| his camp of 2026-09-19, as his mes | AI | rider-2 1,634 → spearman-2 3,184 | 11,585,381 | **10,701,400 (+4.5 %)** | 41 | 2,888 | 0 | **1,304 h (+3.7 %)** | **1.083 (+4.7 %)** | 158,634 | 4,012 | — | ✓ |
| his TotalStack profile of 2026-09- | SS | swordsman-1 515 → swordsman-1 516 | 4,919,095 | **4,432,500 (−0.0 %)** | 7 | 480 | 3,840 | **279 h (−0.0 %)** | **1.110 (−0.0 %)** | 131,856 | 10,248 | 1,281 | ✓ |
| his usual setup of 2026-09-19 (Ayd | HS | swordsman-1 902 → swordsman-1 903 | 8,183,996 | **6,128,700 (−0.0 %)** | 5 | 352 | 3,960 | **375 h (−0.0 %)** | **1.335 (−0.0 %)** | 317,110 | 23,250 | 2,067 | ✓ |

