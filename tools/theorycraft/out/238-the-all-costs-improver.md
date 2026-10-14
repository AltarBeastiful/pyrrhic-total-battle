# The all-costs improver — the owner's first march, inferred as a rule

experiment: 238 · armies: 19 · extraArmies: 0 · tolerances: [0,0.05,0.1,0.2,0.5,1] · fifthStop: {"damageFloor":0.8,"goldTolerance":0,"silverFloor":1,"mercFloor":1}

A row the bar did not offer (undominated ∧ in the band ∧ not a stop ∧ not a generator) with **silver no higher and queue strictly shorter than the sweet spot's, gold and dragon coins within the tolerance of the column, dmg/silver and dmg/merc at least the sweet spot's, and at least the configured share of its damage (`CAMPAIGN.planFixes.fifthStop.damageFloor`, 80 %)**; the burn is free up to the line's limit. A row that out-damages the sweet spot replaces it. Of what passes, **the most damage**. The tolerance steps from 0 — every cost strictly improved, as in the owner's march — upward, since the owner calls gold the lesser criterion.

- **burn below the next stop up** — the burn may climb to just under the next stop above the sweet spot.
- **burn ≤ the sweet spot** — the burn may not climb: the same rule at the sweet spot's own burn.

Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `rating` is the owner's rating against the sweet spot in the rule's rates (queue 40, gold 10). A matrix cell is `Δdamage % / Δqueue % / burn` of the pick against the sweet spot, `·` for no pick.

## Matrices

### burn below the next stop up

| army | gold, coins ≤ +0 % | gold, coins ≤ +5 % | gold, coins ≤ +10 % | gold, coins ≤ +20 % | gold, coins ≤ +50 % | gold, coins ≤ +100 % |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | · | · | · | · | · | · |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 |
| 2026-09-17 export, its setup (7 000 leadership) | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | · |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | · | · | · | · | · |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | · | · |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | · | · | · | · | · | · |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | · | · | · | · | · | · |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · |
| **armies with a pick** | 4 | 4 | 4 | 4 | 4 | 4 |

### burn ≤ the sweet spot

| army | gold, coins ≤ +0 % | gold, coins ≤ +5 % | gold, coins ≤ +10 % | gold, coins ≤ +20 % | gold, coins ≤ +50 % | gold, coins ≤ +100 % |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | · | · | · | · | · | · |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 | -7.7 / -10.1 / 4 |
| 2026-09-17 export, its setup (7 000 leadership) | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | · |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | · | · | · | · | · |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | · | · |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | · | · | · | · | · | · |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | · | · | · | · | · | · |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · |
| **armies with a pick** | 4 | 4 | 4 | 4 | 4 | 4 |

## Per army

### first-run army, Bear V ×1 (20 000 leadership)

No pick at any value of any line.

### first-run army, Bear V ×2 (20 000 leadership)

No pick at any value of any line.

### first-run army, Bear V ×3 (20 000 leadership)

No pick at any value of any line.

### first-run army, Bear V ×10 (20 000 leadership)

No pick at any value of any line.

### first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

No pick at any value of any line.

### first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

No pick at any value of any line.

### first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 189,503,660 | 11,640,400 | 4 | 3,128 | 41,120 | 76 d 4 h | 16.28 | 716,694 | 60,583 | 4,609 | -12.8 |
| **pick A** | 282,129,906 | 15,742,600 | 5 | 5,984 | 52,080 | 104 d 3 h | 17.92 | 780,610 | 47,147 | 5,417 | 3.7 |
| SW | 283,093,746 | 19,136,200 | 5 | 5,984 | 52,080 | 127 d 16 h | 14.79 | 780,610 | 47,308 | 5,436 | 0.0 |
| MM | 397,782,216 | 21,008,000 | 7 | 9,048 | 72,880 | 139 d 6 h | 18.93 | 824,031 | 43,964 | 5,458 | 20.2 |
| MX | 480,990,543 | 22,090,000 | 8 | 12,048 | 84,120 | 145 d 17 h | 21.77 | 857,022 | 39,923 | 5,718 | 36.6 |
| AI | 482,648,331 | 22,090,000 | 10 | 12,464 | 84,120 | 145 d 17 h | 21.85 | 851,396 | 38,723 | 5,738 | 28.5 |

**pick A** — chosen by burn below the next stop up gold, coins ≤ +0 %…gold, coins ≤ +100 %; burn ≤ the sweet spot gold, coins ≤ +0 %…gold, coins ≤ +100 %. vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00.

  - sweet spot fields ancient-terror 3, archer-3 9,900, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 5,049, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3
  - **pick A** fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1,073,738 | 766,600 | 4 | 144 | 0 | 2 d 0 h | 1.40 | 178,496 | 7,457 | ∞ | -29.2 |
| **pick A** | 1,961,382 | 1,377,100 | 4 | 296 | 0 | 3 d 14 h | 1.42 | 341,988 | 6,626 | ∞ | -1.6 |
| SW | 2,125,775 | 1,521,800 | 5 | 296 | 0 | 3 d 23 h | 1.40 | 277,147 | 7,182 | ∞ | 0.0 |
| AI | 2,577,346 | 1,521,100 | 7 | 408 | 0 | 3 d 23 h | 1.69 | 274,691 | 6,317 | ∞ | 9.5 |

**pick A** — chosen by burn below the next stop up gold, coins ≤ +0 %…gold, coins ≤ +100 %; burn ≤ the sweet spot gold, coins ≤ +0 %…gold, coins ≤ +100 %. vs the sweet spot: damage -7.7 % · silver -9.5 % · burn -1 · gold 0.0 % · coins 0.0 % · queue -10.1 % · dmg/silver ×1.02 · dmg/merc ×1.23 · dmg/gold ×0.92 · dmg/coin —.

  - sweet spot fields arbalester-6 10, archer-1 747, archer-2 413, chariot-6 6, epic-monster-hunter-6 10, legionary-6 11, rider-1 375, rider-2 208, rider-3 117, spearman-1 564, spearman-2 312, swordsman-1 564
  - **pick A** fields arbalester-6 10, archer-1 673, archer-2 360, chariot-6 6, epic-monster-hunter-6 10, legionary-6 10, rider-1 318, rider-2 191, rider-3 103, spearman-1 534, spearman-2 291, swordsman-1 545

### 2026-09-17 export, its setup (7 000 leadership)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 3,203,983 | 2,482,500 | 4 | 360 | 0 | 6 d 22 h | 1.29 | 407,682 | 8,900 | ∞ | -13.6 |
| SS | 3,549,139 | 1,985,200 | 6 | 504 | 0 | 5 d 13 h | 1.79 | 381,901 | 7,042 | ∞ | -9.9 |
| **pick A** | 4,098,844 | 2,178,700 | 7 | 576 | 0 | 6 d 2 h | 1.88 | 388,293 | 7,116 | ∞ | -3.2 |
| SW | 4,442,817 | 2,722,500 | 7 | 576 | 0 | 7 d 14 h | 1.63 | 388,293 | 7,713 | ∞ | 0.0 |
| MX | 6,148,584 | 2,740,100 | 14 | 1,016 | 0 | 7 d 17 h | 2.24 | 342,757 | 6,052 | ∞ | 10.6 |
| AI | 6,550,179 | 3,717,800 | 22 | 1,640 | 0 | 17 d 15 h | 1.76 | 220,200 | 3,994 | ∞ | -24.5 |

**pick A** — chosen by burn below the next stop up gold, coins ≤ +0 %…gold, coins ≤ +100 %; burn ≤ the sweet spot gold, coins ≤ +0 %…gold, coins ≤ +100 %. vs the sweet spot: damage -7.7 % · silver -20.0 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -19.9 % · dmg/silver ×1.15 · dmg/merc ×1.00 · dmg/gold ×0.92 · dmg/coin —.

  - sweet spot fields arbalester-6 20, archer-1 1,520, archer-2 812, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20, rider-1 691, rider-2 391, rider-3 207, spearman-1 1,337, spearman-2 728
  - **pick A** fields arbalester-6 20, archer-1 1,216, archer-2 649, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20, rider-1 553, rider-2 313, rider-3 166, spearman-1 1,069, spearman-2 583

### 2026-09-17 export, 12 000 leadership

No pick at any value of any line.

### live account of 2026-09-18 (one hired type, 20 000 leadership)

No pick at any value of any line.

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4,018,658 | 3,666,300 | 4 | 328 | 0 | 10 d 2 h | 1.10 | 388,797 | 12,252 | ∞ | -19.6 |
| SS | 4,559,792 | 2,681,700 | 10 | 600 | 0 | 7 d 8 h | 1.70 | 277,200 | 7,600 | ∞ | -18.3 |
| **pick A** | 6,972,311 | 4,074,700 | 14 | 936 | 0 | 11 d 3 h | 1.71 | 304,072 | 7,449 | ∞ | -1.0 |
| SW | 7,108,497 | 4,243,200 | 14 | 936 | 0 | 11 d 17 h | 1.68 | 304,072 | 7,595 | ∞ | 0.0 |
| MX | 8,693,352 | 4,295,200 | 19 | 1,272 | 0 | 11 d 23 h | 2.02 | 303,341 | 6,834 | ∞ | 11.3 |
| AI | 9,336,448 | 4,979,300 | 25 | 1,816 | 0 | 19 d 4 h | 1.88 | 271,179 | 5,141 | ∞ | 1.2 |

**pick A** — chosen by burn below the next stop up gold, coins ≤ +0 %…gold, coins ≤ +100 %; burn ≤ the sweet spot gold, coins ≤ +0 %…gold, coins ≤ +100 %. vs the sweet spot: damage -1.9 % · silver -4.0 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -4.9 % · dmg/silver ×1.02 · dmg/merc ×1.00 · dmg/gold ×0.98 · dmg/coin —.

  - sweet spot fields arbalester-6 37, archer-1 2,465, archer-2 1,316, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38, rider-1 1,047, rider-2 594, rider-3 308, spearman-1 2,121, spearman-2 1,112
  - **pick A** fields arbalester-6 37, archer-1 2,553, archer-2 1,310, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38, rider-1 1,021, rider-2 514, rider-3 294, spearman-1 1,912, spearman-2 1,084

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

No pick at any value of any line.

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

No pick at any value of any line.

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

No pick at any value of any line.

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

No pick at any value of any line.

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

No pick at any value of any line.

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

No pick at any value of any line.

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

No pick at any value of any line.

