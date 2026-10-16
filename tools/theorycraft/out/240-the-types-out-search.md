# The types taken out, fed to the search — every stop, off and on

experiment: 240 · armies: 21 · typesOutSearch: {"dropTypes":3,"trims":2} · fifthStop: {"damageFloor":0.8,"goldTolerance":0,"silverFloor":1,"mercFloor":1,"dropTypes":3,"trims":2}

**Off** is the bar as committed (843179c). **On** feeds the search's frontier, under the prefix family's freeze, the Elite sizer's sheltered maximum for every set of up to `dropTypes` troop types taken out, and the same with each capped merc trimmed `1 … trims` chunks. Figures are one repeated march. A stop that moved is listed off then on; `rating` is `rate(off, on, markerRates)`, positive when the new march is better by the owner's rates.

## Summary

| army | stops moved | Δ per stop (damage % / silver % / burn / queue % · rating) | plan ms off → on |
|---|---:|---|---:|
| first-run army, Bear V ×1 (20 000 leadership) | 0 / 1 | · | 24 → 10 |
| first-run army, Bear V ×2 (20 000 leadership) | 0 / 1 | · | 17 → 14 |
| first-run army, Bear V ×3 (20 000 leadership) | 3 / 3 | sweet-spot: +4.3 / +22.0 / +0 / +72.9 · -1.9<br>thrifty: **new**<br>all-in: **gone** | 13 → 11 |
| first-run army, Bear V ×10 (20 000 leadership) | 0 / 2 | · | 18 → 19 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 1 / 5 | silver-saver: **new** | 36 → 54 |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 0 / 5 | · | 403 → 328 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 0 / 6 | · | 467 → 462 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 0 / 4 | · | 65 → 60 |
| 2026-09-17 export, its setup (7 000 leadership) | 0 / 6 | · | 186 → 155 |
| 2026-09-17 export, 12 000 leadership | 6 / 6 | silver-saver: -5.4 / +0.0 / -2 / +0.0 · -0.3<br>burn-saver: -5.6 / -27.3 / +2 / -27.3 · -17.0<br>sweet-spot: -28.3 / -0.6 / -8 / -1.6 · -10.4<br>thrifty: **new**<br>more-mercs: **new**<br>steady-max: -2.2 / -9.0 / -3 / -23.2 · 5.6 | 136 → 143 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 0 / 4 | · | 47 → 49 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 0 / 6 | · | 116 → 113 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 1 / 5 | more-mercs: **new** | 50 → 55 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 3 / 6 | silver-saver: +46.4 / +16.3 / +1 / -50.4 · 46.6<br>sweet-spot: -5.4 / +0.0 / -4 / +0.0 · 2.6<br>thrifty: **gone** | 70 → 87 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 0 / 5 | · | 33 → 35 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 2 / 5 | silver-saver: +13.3 / +1.6 / +2 / -18.0 · -24.3<br>sweet-spot: +0.2 / +0.3 / +0 / +0.6 · 0.2 | 33 → 24 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 0 / 3 | · | 86 → 85 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 1 / 4 | more-mercs: **new** | 104 → 107 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 0 / 2 | · | 121 → 147 |
| export · pyrrhic-my-account-2026-10-13.json | 2 / 6 | silver-saver: **new**<br>burn-saver: -8.4 / -10.0 / +0 / +6.3 · -25.2 | 158 → 169 |
| export · pyrrhic-my-account-2026-10-14.json | 3 / 6 | silver-saver: **new**<br>burn-saver: -9.9 / -7.1 / -1 / -5.6 · -20.1<br>thrifty: +0.0 / +0.0 / +0 / +0.0 · 0.0 | 122 → 124 |
| **all** | 22 stops on 9 armies | | 2307 → 2251 |

## Every army, every stop

### first-run army, Bear V ×1 (20 000 leadership)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | same | 4,704,025 | 8,131,400 | 1 | 0 | 0 | 26 d 7 h | 0.579 | 112,200 |  |

### first-run army, Bear V ×2 (20 000 leadership)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | same | 4,816,225 | 8,131,400 | 1 | 160 | 0 | 26 d 7 h | 0.592 | 224,400 |  |

### first-run army, Bear V ×3 (20 000 leadership)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **sweet-spot** | off | 4,704,025 | 8,131,400 | 1 | 0 | 0 | 26 d 7 h | 0.579 | 112,200 |  |
| **sweet-spot** | on | 4,908,249 | 9,921,000 | 1 | 0 | 0 | 45 d 11 h | 0.495 | 74,800 | -1.9 |
| **thrifty** | on | 4,631,402 | 8,131,400 | 1 | 0 | 0 | 26 d 6 h | 0.570 | 112,200 | new |
| **all-in** | off | 4,928,425 | 8,131,400 | 1 | 320 | 0 | 26 d 7 h | 0.606 | 336,600 |  |
| **all-in** | on | gone | | | | | | | | |

sweet-spot on: bear-5 1 · spearman-2 3,096 · rider-2 1,546 · archer-2 3,084 · spearman-3 1,732 · archer-1 5,530 · rider-3 863 · archer-3 1,722

thrifty on: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · bear-5 1

### first-run army, Bear V ×10 (20 000 leadership)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | same | 5,265,025 | 8,131,400 | 1 | 800 | 0 | 26 d 7 h | 0.647 | 673,200 |  |
| all-in | same | 5,581,060 | 9,919,400 | 1 | 1,440 | 0 | 45 d 11 h | 0.563 | 748,000 |  |

### first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **silver-saver** | on | 5,139,731 | 7,759,200 | 5 | 360 | 0 | 23 d 5 h | 0.662 | 287,854 | new |
| burn-saver | same | 5,023,606 | 8,131,400 | 1 | 72 | 0 | 26 d 7 h | 0.618 | 431,781 |  |
| sweet-spot | same | 7,182,511 | 8,131,400 | 6 | 432 | 0 | 26 d 7 h | 0.883 | 431,781 |  |
| steady-max | same | 7,571,113 | 8,131,400 | 7 | 496 | 0 | 26 d 7 h | 0.931 | 425,613 |  |
| all-in | same | 7,973,870 | 8,513,200 | 9 | 592 | 0 | 30 d 10 h | 0.937 | 398,198 |  |

silver-saver on: epic-monster-hunter-6 50 · swordsman-1 3,659 · archer-1 3,652 · spearman-1 3,645 · rider-1 1,819 · archer-2 2,016 · archer-3 1,132 · rider-3 565 · spearman-3 1,128

### first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | same | 20,298,165 | 8,686,000 | 2 | 3,304 | 5,400 | 29 d 12 h | 2.337 | 733,818 |  |
| sweet-spot | same | 22,973,020 | 8,789,200 | 5 | 2,760 | 6,760 | 30 d 5 h | 2.614 | 520,974 |  |
| more-mercs | same | 24,383,400 | 8,789,200 | 6 | 3,048 | 6,760 | 30 d 5 h | 2.774 | 669,208 |  |
| steady-max | same | 25,860,303 | 9,190,100 | 8 | 4,384 | 6,760 | 34 d 10 h | 2.814 | 590,048 |  |
| all-in | same | 26,479,061 | 9,190,100 | 10 | 4,800 | 6,760 | 34 d 10 h | 2.881 | 470,578 |  |

### first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 189,503,660 | 11,640,400 | 4 | 3,128 | 41,120 | 76 d 4 h | 16.280 | 716,694 |  |
| sweet-spot | same | 283,093,746 | 19,136,200 | 5 | 5,984 | 52,080 | 127 d 16 h | 14.794 | 780,610 |  |
| thrifty | same | 282,129,906 | 15,742,600 | 5 | 5,984 | 52,080 | 104 d 3 h | 17.921 | 780,610 |  |
| more-mercs | same | 397,782,216 | 21,008,000 | 7 | 9,048 | 72,880 | 139 d 6 h | 18.935 | 824,031 |  |
| steady-max | same | 480,990,543 | 22,090,000 | 8 | 12,048 | 84,120 | 145 d 17 h | 21.774 | 857,022 |  |
| all-in | same | 482,648,331 | 22,090,000 | 10 | 12,464 | 84,120 | 145 d 17 h | 21.849 | 851,396 |  |

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 1,073,738 | 766,600 | 4 | 144 | 0 | 1 d 24 h | 1.401 | 178,496 |  |
| sweet-spot | same | 2,125,775 | 1,521,800 | 5 | 296 | 0 | 3 d 23 h | 1.397 | 277,147 |  |
| thrifty | same | 1,961,382 | 1,377,100 | 4 | 296 | 0 | 3 d 14 h | 1.424 | 341,988 |  |
| all-in | same | 2,577,346 | 1,521,100 | 7 | 408 | 0 | 3 d 23 h | 1.694 | 274,691 |  |

### 2026-09-17 export, its setup (7 000 leadership)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 3,549,139 | 1,985,200 | 6 | 504 | 0 | 5 d 13 h | 1.788 | 381,901 |  |
| burn-saver | same | 3,203,983 | 2,482,500 | 4 | 360 | 0 | 6 d 22 h | 1.291 | 407,682 |  |
| sweet-spot | same | 4,442,817 | 2,722,500 | 7 | 576 | 0 | 7 d 14 h | 1.632 | 388,293 |  |
| thrifty | same | 4,098,844 | 2,178,700 | 7 | 576 | 0 | 6 d 2 h | 1.881 | 388,293 |  |
| steady-max | same | 6,148,584 | 2,740,100 | 14 | 1,016 | 0 | 7 d 17 h | 2.244 | 342,757 |  |
| all-in | same | 6,550,179 | 3,717,800 | 22 | 1,640 | 0 | 17 d 15 h | 1.762 | 220,200 |  |

### 2026-09-17 export, 12 000 leadership

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **silver-saver** | off | 4,446,760 | 2,477,300 | 10 | 616 | 0 | 6 d 22 h | 1.795 | 287,777 |  |
| **silver-saver** | on | 4,208,215 | 2,477,300 | 8 | 584 | 0 | 6 d 22 h | 1.699 | 329,903 | -0.3 |
| **burn-saver** | off | 4,400,680 | 4,370,200 | 4 | 360 | 0 | 12 d 4 h | 1.007 | 407,682 |  |
| **burn-saver** | on | 4,154,395 | 3,178,100 | 6 | 496 | 0 | 8 d 21 h | 1.307 | 356,743 | -17.0 |
| **sweet-spot** | off | 8,739,455 | 4,698,300 | 17 | 1,224 | 0 | 13 d 5 h | 1.860 | 336,530 |  |
| **sweet-spot** | on | 6,269,353 | 4,668,300 | 9 | 720 | 0 | 13 d 0 h | 1.343 | 367,968 | -10.4 |
| **thrifty** | on | 5,677,544 | 3,734,200 | 9 | 720 | 0 | 10 d 10 h | 1.520 | 367,968 | new |
| **more-mercs** | on | 7,314,470 | 4,668,300 | 14 | 920 | 0 | 13 d 0 h | 1.567 | 311,202 | new |
| **steady-max** | off | 8,796,722 | 5,340,800 | 22 | 1,544 | 0 | 20 d 18 h | 1.647 | 282,201 |  |
| **steady-max** | on | 8,602,781 | 4,861,700 | 19 | 1,336 | 0 | 15 d 22 h | 1.770 | 300,498 | 5.6 |

silver-saver on: spearman-1 1,216 · spearman-2 663 · rider-2 356 · rider-1 629 · archer-1 1,383 · rider-3 188 · archer-2 739 · arbalester-6 28 · chariot-6 10 · epic-monster-hunter-6 24 · legionary-6 10

burn-saver on: spearman-1 1,560 · spearman-2 850 · rider-2 457 · rider-1 806 · archer-1 1,774 · rider-3 242 · archer-2 947 · arbalester-6 18 · chariot-6 16 · epic-monster-hunter-6 10 · legionary-6 10

sweet-spot on: spearman-1 2,292 · spearman-2 1,249 · rider-2 671 · rider-1 1,184 · archer-1 2,606 · rider-3 355 · archer-2 1,392 · arbalester-6 20 · chariot-6 10 · epic-monster-hunter-6 40 · legionary-6 20

thrifty on: spearman-1 1,833 · spearman-2 999 · rider-2 537 · rider-1 947 · archer-1 2,085 · rider-3 284 · archer-2 1,113 · arbalester-6 20 · chariot-6 10 · epic-monster-hunter-6 40 · legionary-6 20

more-mercs on: spearman-1 2,292 · spearman-2 1,249 · rider-2 671 · rider-1 1,184 · archer-1 2,606 · rider-3 355 · archer-2 1,392 · arbalester-6 31 · chariot-6 12 · epic-monster-hunter-6 50 · legionary-6 26

steady-max on: epic-monster-hunter-6 82 · legionary-6 34 · arbalester-6 40 · chariot-6 16 · spearman-1 2,723 · spearman-2 1,512 · rider-2 827 · rider-1 1,485 · archer-2 1,848 · rider-3 462

### live account of 2026-09-18 (one hired type, 20 000 leadership)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 3,703,985 | 3,587,300 | 4 | 288 | 0 | 9 d 21 h | 1.033 | 323,582 |  |
| sweet-spot | same | 7,115,941 | 7,699,700 | 6 | 432 | 0 | 21 d 5 h | 0.924 | 323,582 |  |
| steady-max | same | 7,374,807 | 7,699,700 | 7 | 488 | 0 | 21 d 5 h | 0.958 | 314,337 |  |
| all-in | same | 7,860,179 | 7,699,700 | 9 | 592 | 0 | 21 d 5 h | 1.021 | 298,414 |  |

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 4,559,792 | 2,681,700 | 10 | 600 | 0 | 7 d 8 h | 1.700 | 277,200 |  |
| burn-saver | same | 4,018,658 | 3,666,300 | 4 | 328 | 0 | 10 d 2 h | 1.096 | 388,797 |  |
| sweet-spot | same | 7,108,497 | 4,243,200 | 14 | 936 | 0 | 11 d 17 h | 1.675 | 304,072 |  |
| thrifty | same | 6,972,311 | 4,074,700 | 14 | 936 | 0 | 11 d 3 h | 1.711 | 304,072 |  |
| steady-max | same | 8,693,352 | 4,295,200 | 19 | 1,272 | 0 | 11 d 23 h | 2.024 | 303,341 |  |
| all-in | same | 9,336,448 | 4,979,300 | 25 | 1,816 | 0 | 19 d 4 h | 1.875 | 271,179 |  |

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | same | 2,041,005 | 1,312,900 | 4 | 264 | 0 | 3 d 1 h | 1.555 | 326,680 |  |
| sweet-spot | same | 4,090,332 | 1,948,700 | 10 | 648 | 0 | 5 d 12 h | 2.099 | 295,181 |  |
| **more-mercs** | on | 4,427,027 | 2,256,200 | 16 | 1,008 | 0 | 8 d 15 h | 1.962 | 229,303 | new |
| steady-max | same | 4,774,124 | 2,203,800 | 17 | 1,208 | 0 | 8 d 5 h | 2.166 | 226,038 |  |
| all-in | same | 5,372,331 | 2,705,900 | 26 | 1,816 | 0 | 13 d 10 h | 1.985 | 164,796 |  |

more-mercs on: epic-monster-hunter-6 41 · arbalester-6 43 · legionary-6 43 · chariot-6 8 · archer-1 1,676 · archer-2 930 · rider-3 261 · spearman-2 924 · rider-2 461

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **silver-saver** | off | 2,054,337 | 1,587,400 | 9 | 1,648 | 0 | 8 d 14 h | 1.294 | 155,938 |  |
| **silver-saver** | on | 3,008,375 | 1,846,900 | 10 | 1,288 | 0 | 4 d 6 h | 1.629 | 246,030 | 46.6 |
| burn-saver | same | 2,016,069 | 1,761,200 | 3 | 304 | 0 | 4 d 20 h | 1.145 | 277,917 |  |
| **sweet-spot** | off | 4,358,805 | 2,635,500 | 15 | 1,936 | 0 | 12 d 10 h | 1.654 | 204,722 |  |
| **sweet-spot** | on | 4,124,017 | 2,635,500 | 11 | 1,680 | 0 | 12 d 10 h | 1.565 | 257,822 | 2.6 |
| **thrifty** | off | 3,921,131 | 2,210,100 | 12 | 1,592 | 0 | 8 d 7 h | 1.774 | 232,599 |  |
| **thrifty** | on | gone | | | | | | | | |
| more-mercs | same | 6,608,519 | 3,417,400 | 45 | 5,848 | 0 | 23 d 18 h | 1.934 | 146,856 |  |
| steady-max | same | 12,433,369 | 3,481,800 | 87 | 12,872 | 0 | 24 d 4 h | 3.571 | 142,912 |  |

silver-saver on: spearman-1 1,583 · rider-1 810 · spearman-2 876 · rider-2 448 · arbalester-6 50 · bear-5 5 · legionary-6 40

sweet-spot on: archer-2 1,625 · spearman-2 1,290 · rider-2 660 · rider-3 370 · arbalester-6 60 · bear-5 7 · legionary-6 40

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 1,882,911 | 1,790,200 | 3 | 216 | 0 | 6 d 22 h | 1.052 | 323,582 |  |
| burn-saver | same | 1,581,389 | 1,920,900 | 1 | 64 | 0 | 5 d 7 h | 0.823 | 291,224 |  |
| sweet-spot | same | 2,385,168 | 2,268,000 | 4 | 272 | 0 | 8 d 18 h | 1.052 | 307,403 |  |
| more-mercs | same | 3,976,648 | 2,803,600 | 18 | 1,248 | 0 | 15 d 4 h | 1.418 | 156,398 |  |
| steady-max | same | 6,050,983 | 3,346,000 | 38 | 2,688 | 0 | 23 d 6 h | 1.808 | 159,236 |  |

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **silver-saver** | off | 1,852,405 | 1,795,200 | 2 | 144 | 0 | 4 d 22 h | 1.032 | 323,582 |  |
| **silver-saver** | on | 2,098,967 | 1,824,800 | 4 | 272 | 0 | 4 d 1 h | 1.150 | 307,403 | -24.3 |
| burn-saver | same | 1,513,423 | 1,901,800 | 1 | 72 | 0 | 6 d 3 h | 0.796 | 323,582 |  |
| **sweet-spot** | off | 2,807,275 | 2,321,500 | 5 | 360 | 0 | 8 d 22 h | 1.209 | 323,582 |  |
| **sweet-spot** | on | 2,813,789 | 2,328,600 | 5 | 360 | 0 | 8 d 23 h | 1.208 | 323,582 | 0.2 |
| steady-max | same | 2,875,325 | 2,528,100 | 10 | 720 | 0 | 12 d 13 h | 1.137 | 161,791 |  |
| all-in | same | 3,160,727 | 2,776,000 | 11 | 792 | 0 | 13 d 18 h | 1.139 | 161,791 |  |

silver-saver on: archer-1 1,541 · spearman-1 1,223 · rider-1 626 · rider-2 347 · rider-3 195 · epic-monster-hunter-6 38

sweet-spot on: epic-monster-hunter-6 50 · spearman-1 1,627 · spearman-2 903 · rider-2 463 · rider-3 260 · archer-2 1,124

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | same | 1,000,201 | 811,300 | 1 | 72 | 960 | 2 d 4 h | 1.233 | 168,840 |  |
| sweet-spot | same | 2,104,714 | 2,115,100 | 5 | 352 | 960 | 6 d 6 h | 0.995 | 110,309 |  |
| steady-max | same | 2,168,812 | 2,235,700 | 7 | 440 | 960 | 7 d 11 h | 0.970 | 99,696 |  |

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | same | 1,850,137 | 1,378,300 | 1 | 72 | 960 | 3 d 12 h | 1.342 | 323,582 |  |
| sweet-spot | same | 2,941,677 | 2,031,600 | 2 | 136 | 1,560 | 5 d 8 h | 1.448 | 461,105 |  |
| **more-mercs** | on | 2,967,094 | 2,233,600 | 3 | 216 | 1,080 | 7 d 12 h | 1.328 | 323,582 | new |
| steady-max | same | 3,031,810 | 2,233,600 | 4 | 224 | 1,080 | 7 d 12 h | 1.357 | 258,866 |  |

more-mercs on: epic-monster-hunter-6 30 · water-elemental 18 · battle-boar 8 · emerald-dragon 7 · stone-gargoyle 6 · spearman-2 730 · rider-2 364 · archer-2 726 · rider-1 653 · archer-1 1,300 · rider-3 203

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | same | 4,210,521 | 2,370,000 | 1 | 4,596 | 2,520 | 7 d 10 h | 1.777 | 489,636 |  |
| all-in | same | 4,406,179 | 2,369,600 | 2 | 4,610 | 2,520 | 7 d 10 h | 1.859 | 342,746 |  |

### export · pyrrhic-my-account-2026-10-13.json

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **silver-saver** | on | 7,015,298 | 2,217,544 | 2 | 2,771 | 1,720 | 7 d 3 h | 3.164 | 741,600 | new |
| **burn-saver** | off | 6,217,678 | 2,262,839 | 1 | 2,205 | 1,080 | 7 d 6 h | 2.748 | 741,600 |  |
| **burn-saver** | on | 5,695,118 | 2,036,250 | 1 | 2,877 | 2,160 | 7 d 17 h | 2.797 | 741,600 | -25.2 |
| sweet-spot | same | 10,002,509 | 3,035,550 | 3 | 8,531 | 4,680 | 18 d 15 h | 3.295 | 296,640 |  |
| thrifty | same | 9,471,089 | 2,700,825 | 4 | 4,683 | 2,520 | 12 d 22 h | 3.507 | 528,390 |  |
| more-mercs | same | 11,359,563 | 2,997,600 | 6 | 8,738 | 4,680 | 17 d 6 h | 3.790 | 556,200 |  |
| all-in | same | 12,372,248 | 3,246,250 | 15 | 11,277 | 5,560 | 22 d 7 h | 3.811 | 179,220 |  |

silver-saver on: water-elemental 29 · battle-boar 14 · emerald-dragon 12 · stone-gargoyle 10 · epic-monster-hunter-6 20 · rider-1 499 · archer-1 996 · spearman-1 939 · swordsman-1 1,348 · archer-2 550 · spearman-2 518 · rider-2 273 · archer-3 307 · spearman-3 290 · rider-3 153

burn-saver on: water-elemental 31 · battle-boar 15 · emerald-dragon 13 · stone-gargoyle 11 · epic-monster-hunter-6 10 · spearman-3 319 · spearman-2 566 · spearman-1 1,015 · rider-1 536 · archer-1 1,072 · archer-2 593 · rider-3 167 · archer-3 333 · rider-2 296

### export · pyrrhic-my-account-2026-10-14.json

| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **silver-saver** | on | 8,038,054 | 2,927,001 | 2 | 3,689 | 2,160 | 9 d 9 h | 2.746 | 698,158 | new |
| **burn-saver** | off | 7,703,376 | 2,972,225 | 2 | 2,320 | 1,080 | 9 d 10 h | 2.592 | 523,619 |  |
| **burn-saver** | on | 6,941,715 | 2,760,662 | 1 | 3,400 | 2,160 | 8 d 21 h | 2.515 | 698,156 | -20.1 |
| sweet-spot | same | 9,778,542 | 3,587,725 | 3 | 7,281 | 4,000 | 17 d 0 h | 2.726 | 418,895 |  |
| **thrifty** | off | 9,858,253 | 3,392,035 | 4 | 4,904 | 2,800 | 13 d 18 h | 2.906 | 698,158 |  |
| **thrifty** | on | 9,858,253 | 3,392,035 | 4 | 4,904 | 2,800 | 13 d 18 h | 2.906 | 698,158 | 0.0 |
| more-mercs | same | 11,846,314 | 4,247,275 | 7 | 8,569 | 4,000 | 24 d 6 h | 2.789 | 174,539 |  |
| steady-max | same | 13,100,296 | 4,322,875 | 9 | 9,663 | 5,080 | 24 d 19 h | 3.030 | 162,903 |  |

silver-saver on: water-elemental 38 · stone-gargoyle 14 · emerald-dragon 16 · battle-boar 18 · epic-monster-hunter-6 20 · spearman-2 693 · rider-1 659 · spearman-1 1,239 · swordsman-1 1,792 · spearman-3 387 · archer-2 726 · archer-1 1,304 · archer-3 406 · rider-2 361 · rider-3 202

burn-saver on: water-elemental 36 · stone-gargoyle 13 · emerald-dragon 15 · battle-boar 17 · epic-monster-hunter-6 10 · rider-1 620 · spearman-1 1,167 · spearman-2 648 · swordsman-1 1,683 · archer-2 683 · archer-1 1,227 · rider-2 341 · spearman-3 361 · archer-3 381 · rider-3 191

thrifty on: archer-1 1,722 · spearman-1 1,620 · swordsman-2 1,302 · archer-2 951 · spearman-2 896 · rider-2 473 · archer-3 532 · spearman-3 501 · rider-3 265 · battle-boar 24 · emerald-dragon 21 · stone-gargoyle 18 · water-elemental 50 · epic-monster-hunter-6 40

