# The types taken out — the thrifty stop with marches the search never sizes

experiment: 239 · armies: 21 · fifthStop: {"damageFloor":0.8,"goldTolerance":0,"silverFloor":1,"mercFloor":1,"dropTypes":3,"trims":2} · pools: dropTypes 0 / 1 / 2 / 3

The thrifty stop's pool is the band (`dropTypes 0`), or the band plus, for every set of up to `dropTypes` troop types taken out, the Elite sizer's sheltered maximum over the rest with the whole sustainable stock as caps, and the same with each capped mercenary trimmed `1 … trims` chunks under it. The rule is `engine/thriftyStop.ts` with the burn allowed up to the next stop up's (inclusive). A cell is `Δdamage % / Δsilver % / Δqueue % / burn` of the pick against the sweet spot, `·` for no pick. Every other stop is asserted the same march under every pool.

| army | drop ≤ 0 | drop ≤ 1 | drop ≤ 2 | drop ≤ 3 | plan ms (0 / 1 / 2 / 3) |
|---|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | 75 / 22 / 24 / 21 |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | 40 / 57 / 62 / 27 |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | 40 / 25 / 68 / 33 |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | 62 / 128 / 133 / 105 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | 182 / 149 / 184 / 169 |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | · | · | · | · | 1873 / 1382 / 1231 / 2168 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -17.7 / -18.5 / 5 | -0.3 / -17.7 / -18.5 / 5 | -0.3 / -17.7 / -18.5 / 5 | -0.3 / -17.7 / -18.5 / 5 | 2713 / 2222 / 2222 / 2069 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | -7.7 / -9.5 / -10.1 / 4 | -7.7 / -9.5 / -10.1 / 4 | -7.7 / -9.5 / -10.1 / 4 | -7.7 / -9.5 / -10.1 / 4 | 334 / 304 / 304 / 188 |
| 2026-09-17 export, its setup (7 000 leadership) | -7.7 / -20.0 / -19.9 / 7 | -7.7 / -20.0 / -19.9 / 7 | -7.7 / -20.0 / -19.9 / 7 | -7.7 / -20.0 / -19.9 / 7 | 1001 / 1036 / 702 / 596 |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | 845 / 680 / 525 / 516 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | · | · | · | 269 / 282 / 253 / 220 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | -1.9 / -4.0 / -4.9 / 14 | -1.9 / -4.0 / -4.9 / 14 | -1.9 / -4.0 / -4.9 / 14 | -1.9 / -4.0 / -4.9 / 14 | 429 / 452 / 414 / 468 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | 200 / 218 / 214 / 182 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | -10.0 / -16.1 / -33.3 / 12 | 328 / 314 / 272 / 436 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | 138 / 122 / 144 / 260 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | 145 / 96 / 181 / 106 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | · | · | · | · | 503 / 611 / 464 / 341 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | · | · | · | · | 529 / 684 / 528 / 626 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | 511 / 657 / 481 / 449 |
| export · pyrrhic-my-account-2026-10-13.json | -5.3 / -11.0 / -30.7 / 4 | -5.3 / -11.0 / -30.7 / 4 | -5.3 / -11.0 / -30.7 / 4 | -5.3 / -11.0 / -30.7 / 4 | 699 / 752 / 775 / 606 |
| export · pyrrhic-my-account-2026-10-14.json | · | -8.5 / -11.4 / -34.7 / 3 | +0.8 / -5.5 / -19.1 / 4 | +0.8 / -5.5 / -19.1 / 4 | 551 / 791 / 514 / 705 |
| **armies with a pick** | 5 | 6 | 6 | 7 | |
| **plan ms, all armies** | 11466 | 10984 | 9696 | 10291 | |

## Per army, at the configured pool

### first-run army, Bear V ×1 (20 000 leadership)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | 4,704,025 | 8,131,400 | 1 | 0 | 0 | 26 d 7 h | 0.579 | 112,200 |

### first-run army, Bear V ×2 (20 000 leadership)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | 4,816,225 | 8,131,400 | 1 | 160 | 0 | 26 d 7 h | 0.592 | 224,400 |

### first-run army, Bear V ×3 (20 000 leadership)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | 4,704,025 | 8,131,400 | 1 | 0 | 0 | 26 d 7 h | 0.579 | 112,200 |
| all-in | 4,928,425 | 8,131,400 | 1 | 320 | 0 | 26 d 7 h | 0.606 | 336,600 |

### first-run army, Bear V ×10 (20 000 leadership)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | 5,265,025 | 8,131,400 | 1 | 800 | 0 | 26 d 7 h | 0.647 | 673,200 |
| all-in | 5,581,060 | 9,919,400 | 1 | 1,440 | 0 | 45 d 11 h | 0.563 | 748,000 |

### first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 5,023,606 | 8,131,400 | 1 | 72 | 0 | 26 d 7 h | 0.618 | 431,781 |
| sweet-spot | 7,182,511 | 8,131,400 | 6 | 432 | 0 | 26 d 7 h | 0.883 | 431,781 |
| steady-max | 7,571,113 | 8,131,400 | 7 | 496 | 0 | 26 d 7 h | 0.931 | 425,613 |
| all-in | 7,973,870 | 8,513,200 | 9 | 592 | 0 | 30 d 10 h | 0.937 | 398,198 |

### first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 20,298,165 | 8,686,000 | 2 | 3,304 | 5,400 | 29 d 12 h | 2.337 | 733,818 |
| sweet-spot | 22,973,020 | 8,789,200 | 5 | 2,760 | 6,760 | 30 d 5 h | 2.614 | 520,974 |
| more-mercs | 24,383,400 | 8,789,200 | 6 | 3,048 | 6,760 | 30 d 5 h | 2.774 | 669,208 |
| steady-max | 25,860,303 | 9,190,100 | 8 | 4,384 | 6,760 | 34 d 10 h | 2.814 | 590,048 |
| all-in | 26,479,061 | 9,190,100 | 10 | 4,800 | 6,760 | 34 d 10 h | 2.881 | 470,578 |

### first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | 189,503,660 | 11,640,400 | 4 | 3,128 | 41,120 | 76 d 4 h | 16.280 | 716,694 |
| **thrifty** | 282,129,906 | 15,742,600 | 5 | 5,984 | 52,080 | 104 d 3 h | 17.921 | 780,610 |
| sweet-spot | 283,093,746 | 19,136,200 | 5 | 5,984 | 52,080 | 127 d 16 h | 14.794 | 780,610 |
| more-mercs | 397,782,216 | 21,008,000 | 7 | 9,048 | 72,880 | 139 d 6 h | 18.935 | 824,031 |
| steady-max | 480,990,543 | 22,090,000 | 8 | 12,048 | 84,120 | 145 d 17 h | 21.774 | 857,022 |
| all-in | 482,648,331 | 22,090,000 | 10 | 12,464 | 84,120 | 145 d 17 h | 21.849 | 851,396 |

thrifty vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold +0.0 % · coins +0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · rating 3.7

fields rider-3 3,825, archer-3 7,500, ancient-terror 3, battle-boar 239, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3, bear-5 2, epic-monster-hunter-6 40

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | 1,073,738 | 766,600 | 4 | 144 | 0 | 1 d 24 h | 1.401 | 178,496 |
| **thrifty** | 1,961,382 | 1,377,100 | 4 | 296 | 0 | 3 d 14 h | 1.424 | 341,988 |
| sweet-spot | 2,125,775 | 1,521,800 | 5 | 296 | 0 | 3 d 23 h | 1.397 | 277,147 |
| all-in | 2,577,346 | 1,521,100 | 7 | 408 | 0 | 3 d 23 h | 1.694 | 274,691 |

thrifty vs the sweet spot: damage -7.7 % · silver -9.5 % · burn -1 · gold +0.0 % · coins 0.0 % · queue -10.1 % · dmg/silver ×1.02 · dmg/merc ×1.23 · rating -1.6

fields swordsman-1 545, spearman-1 534, spearman-2 291, rider-2 191, archer-1 673, rider-3 103, archer-2 360, rider-1 318, epic-monster-hunter-6 10, arbalester-6 10, legionary-6 10, chariot-6 6

### 2026-09-17 export, its setup (7 000 leadership)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 3,203,983 | 2,482,500 | 4 | 360 | 0 | 6 d 22 h | 1.291 | 407,682 |
| silver-saver | 3,549,139 | 1,985,200 | 6 | 504 | 0 | 5 d 13 h | 1.788 | 381,901 |
| **thrifty** | 4,098,844 | 2,178,700 | 7 | 576 | 0 | 6 d 2 h | 1.881 | 388,293 |
| sweet-spot | 4,442,817 | 2,722,500 | 7 | 576 | 0 | 7 d 14 h | 1.632 | 388,293 |
| steady-max | 6,148,584 | 2,740,100 | 14 | 1,016 | 0 | 7 d 17 h | 2.244 | 342,757 |
| all-in | 6,550,179 | 3,717,800 | 22 | 1,640 | 0 | 17 d 15 h | 1.762 | 220,200 |

thrifty vs the sweet spot: damage -7.7 % · silver -20.0 % · burn +0 · gold +0.0 % · coins 0.0 % · queue -19.9 % · dmg/silver ×1.15 · dmg/merc ×1.00 · rating -3.2

fields spearman-1 1,069, spearman-2 583, rider-2 313, rider-1 553, archer-1 1,216, rider-3 166, archer-2 649, arbalester-6 20, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20

### 2026-09-17 export, 12 000 leadership

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 4,400,680 | 4,370,200 | 4 | 360 | 0 | 12 d 4 h | 1.007 | 407,682 |
| silver-saver | 4,446,760 | 2,477,300 | 10 | 616 | 0 | 6 d 22 h | 1.795 | 287,777 |
| sweet-spot | 8,739,455 | 4,698,300 | 17 | 1,224 | 0 | 13 d 5 h | 1.860 | 336,530 |
| steady-max | 8,796,722 | 5,340,800 | 22 | 1,544 | 0 | 20 d 18 h | 1.647 | 282,201 |

### live account of 2026-09-18 (one hired type, 20 000 leadership)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | 3,703,985 | 3,587,300 | 4 | 288 | 0 | 9 d 21 h | 1.033 | 323,582 |
| sweet-spot | 7,115,941 | 7,699,700 | 6 | 432 | 0 | 21 d 5 h | 0.924 | 323,582 |
| steady-max | 7,374,807 | 7,699,700 | 7 | 488 | 0 | 21 d 5 h | 0.958 | 314,337 |
| all-in | 7,860,179 | 7,699,700 | 9 | 592 | 0 | 21 d 5 h | 1.021 | 298,414 |

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 4,018,658 | 3,666,300 | 4 | 328 | 0 | 10 d 2 h | 1.096 | 388,797 |
| silver-saver | 4,559,792 | 2,681,700 | 10 | 600 | 0 | 7 d 8 h | 1.700 | 277,200 |
| **thrifty** | 6,972,311 | 4,074,700 | 14 | 936 | 0 | 11 d 3 h | 1.711 | 304,072 |
| sweet-spot | 7,108,497 | 4,243,200 | 14 | 936 | 0 | 11 d 17 h | 1.675 | 304,072 |
| steady-max | 8,693,352 | 4,295,200 | 19 | 1,272 | 0 | 11 d 23 h | 2.024 | 303,341 |
| all-in | 9,336,448 | 4,979,300 | 25 | 1,816 | 0 | 19 d 4 h | 1.875 | 271,179 |

thrifty vs the sweet spot: damage -1.9 % · silver -4.0 % · burn +0 · gold +0.0 % · coins 0.0 % · queue -4.9 % · dmg/silver ×1.02 · dmg/merc ×1.00 · rating -1.0

fields archer-1 2,553, rider-1 1,021, spearman-2 1,084, spearman-1 1,912, archer-2 1,310, rider-3 294, rider-2 514, arbalester-6 37, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 2,041,005 | 1,312,900 | 4 | 264 | 0 | 3 d 1 h | 1.555 | 326,680 |
| sweet-spot | 4,090,332 | 1,948,700 | 10 | 648 | 0 | 5 d 12 h | 2.099 | 295,181 |
| steady-max | 4,774,124 | 2,203,800 | 17 | 1,208 | 0 | 8 d 5 h | 2.166 | 226,038 |
| all-in | 5,372,331 | 2,705,900 | 26 | 1,816 | 0 | 13 d 10 h | 1.985 | 164,796 |

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 2,016,069 | 1,761,200 | 3 | 304 | 0 | 4 d 20 h | 1.145 | 277,917 |
| silver-saver | 2,054,337 | 1,587,400 | 9 | 1,648 | 0 | 8 d 14 h | 1.294 | 155,938 |
| **thrifty** | 3,921,131 | 2,210,100 | 12 | 1,592 | 0 | 8 d 7 h | 1.774 | 232,599 |
| sweet-spot | 4,358,805 | 2,635,500 | 15 | 1,936 | 0 | 12 d 10 h | 1.654 | 204,722 |
| more-mercs | 6,608,519 | 3,417,400 | 45 | 5,848 | 0 | 23 d 18 h | 1.934 | 146,856 |
| steady-max | 12,433,369 | 3,481,800 | 87 | 12,872 | 0 | 24 d 4 h | 3.571 | 142,912 |

thrifty vs the sweet spot: damage -10.0 % · silver -16.1 % · burn -3 · gold -17.8 % · coins 0.0 % · queue -33.3 % · dmg/silver ×1.07 · dmg/merc ×1.14 · rating 1.6

fields spearman-1 2,037, spearman-2 1,130, rider-2 579, rider-3 325, bear-5 6, legionary-6 50, arbalester-6 60

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 1,581,389 | 1,920,900 | 1 | 64 | 0 | 5 d 7 h | 0.823 | 291,224 |
| silver-saver | 1,882,911 | 1,790,200 | 3 | 216 | 0 | 6 d 22 h | 1.052 | 323,582 |
| sweet-spot | 2,385,168 | 2,268,000 | 4 | 272 | 0 | 8 d 18 h | 1.052 | 307,403 |
| more-mercs | 3,976,648 | 2,803,600 | 18 | 1,248 | 0 | 15 d 4 h | 1.418 | 156,398 |
| steady-max | 6,050,983 | 3,346,000 | 38 | 2,688 | 0 | 23 d 6 h | 1.808 | 159,236 |

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 1,513,423 | 1,901,800 | 1 | 72 | 0 | 6 d 3 h | 0.796 | 323,582 |
| silver-saver | 1,852,405 | 1,795,200 | 2 | 144 | 0 | 4 d 22 h | 1.032 | 323,582 |
| sweet-spot | 2,807,275 | 2,321,500 | 5 | 360 | 0 | 8 d 22 h | 1.209 | 323,582 |
| steady-max | 2,875,325 | 2,528,100 | 10 | 720 | 0 | 12 d 13 h | 1.137 | 161,791 |
| all-in | 3,160,727 | 2,776,000 | 11 | 792 | 0 | 13 d 18 h | 1.139 | 161,791 |

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| silver-saver | 1,000,201 | 811,300 | 1 | 72 | 960 | 2 d 4 h | 1.233 | 168,840 |
| sweet-spot | 2,104,714 | 2,115,100 | 5 | 352 | 960 | 6 d 6 h | 0.995 | 110,309 |
| steady-max | 2,168,812 | 2,235,700 | 7 | 440 | 960 | 7 d 11 h | 0.970 | 99,696 |

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 1,850,137 | 1,378,300 | 1 | 72 | 960 | 3 d 12 h | 1.342 | 323,582 |
| sweet-spot | 2,941,677 | 2,031,600 | 2 | 136 | 1,560 | 5 d 8 h | 1.448 | 461,105 |
| steady-max | 3,031,810 | 2,233,600 | 4 | 224 | 1,080 | 7 d 12 h | 1.357 | 258,866 |

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| sweet-spot | 4,210,521 | 2,370,000 | 1 | 4,596 | 2,520 | 7 d 10 h | 1.777 | 489,636 |
| all-in | 4,406,179 | 2,369,600 | 2 | 4,610 | 2,520 | 7 d 10 h | 1.859 | 342,746 |

### export · pyrrhic-my-account-2026-10-13.json

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 6,217,678 | 2,262,839 | 1 | 2,205 | 1,080 | 7 d 6 h | 2.748 | 741,600 |
| sweet-spot | 10,002,509 | 3,035,550 | 3 | 8,531 | 4,680 | 18 d 15 h | 3.295 | 296,640 |
| **thrifty** | 9,471,089 | 2,700,825 | 4 | 4,683 | 2,520 | 12 d 22 h | 3.507 | 528,390 |
| more-mercs | 11,359,563 | 2,997,600 | 6 | 8,738 | 4,680 | 17 d 6 h | 3.790 | 556,200 |
| all-in | 12,372,248 | 3,246,250 | 15 | 11,277 | 5,560 | 22 d 7 h | 3.811 | 179,220 |

thrifty vs the sweet spot: damage -5.3 % · silver -11.0 % · burn +1 · gold -45.1 % · coins -46.2 % · queue -30.7 % · dmg/silver ×1.06 · dmg/merc ×1.78 · rating 5.8

fields spearman-3 699, archer-3 725, rider-3 355, archer-1 2,232, archer-2 1,215, rider-2 595, battle-boar 23, emerald-dragon 20, stone-gargoyle 17, water-elemental 47, epic-monster-hunter-6 38

### export · pyrrhic-my-account-2026-10-14.json

| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| burn-saver | 7,703,376 | 2,972,225 | 2 | 2,320 | 1,080 | 9 d 10 h | 2.592 | 523,619 |
| sweet-spot | 9,778,542 | 3,587,725 | 3 | 7,281 | 4,000 | 17 d 0 h | 2.726 | 418,895 |
| **thrifty** | 9,858,253 | 3,392,035 | 4 | 4,904 | 2,800 | 13 d 18 h | 2.906 | 698,158 |
| more-mercs | 11,846,314 | 4,247,275 | 7 | 8,569 | 4,000 | 24 d 6 h | 2.789 | 174,539 |
| steady-max | 13,100,296 | 4,322,875 | 9 | 9,663 | 5,080 | 24 d 19 h | 3.030 | 162,903 |

thrifty vs the sweet spot: damage +0.8 % · silver -5.5 % · burn +1 · gold -32.6 % · coins -30.0 % · queue -19.1 % · dmg/silver ×1.07 · dmg/merc ×1.67 · rating 6.0

fields archer-1 1,722, spearman-1 1,620, swordsman-2 1,302, archer-2 951, spearman-2 896, rider-2 473, archer-3 532, spearman-3 501, rider-3 265, water-elemental 50, emerald-dragon 21, battle-boar 24, stone-gargoyle 18, epic-monster-hunter-6 40

