# The elbow at heavy queue weight

experiment: 236 · armies: 19 · extraArmies: 0 · weights: [40,20,10,5,2,1] · silverFloor: 0.9 · mercFloor: 0.95

The pool is 235's: a stepping stone between the next stop down and the sweet spot, burn strictly below the next stop up's, dmg/silver at least 90 % and dmg/merc at least 95 % of the sweet spot's, admitted only if the owner's rating (gold 10, queue weight as the column) prefers it to the sweet spot. `rated` takes the best rating of those; `knee` takes the elbow of the climb from the next stop down to the sweet spot — the row where the share of the damage gap closed most outruns the share of the queue gap spent.

- **rated** — the best rating of those it admits (235, no queue gate) — for reference.
- **knee** — the elbow of the climb of those the rating admits, no queue gate.
- **knee + 10 % gate** — the elbow, and the pick must save 10 % of the sweet spot's queue.

Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `rating` is the owner's rating against the sweet spot in the rule's rates (queue 40, gold 10). A matrix cell is `Δdamage % / Δqueue % / burn` of the pick against the sweet spot, `·` for no pick.

## Matrices

### rated

| army | q40 | q20 | q10 | q5 | q2 | q1 |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | · | · | · | -11.3 / -19.1 / 4 | -11.3 / -19.1 / 4 | -21.4 / -28.2 / 4 |
| 2026-09-17 export, its setup (7 000 leadership) | · | · | · | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | -44.3 / -44.9 / 10 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | -9.4 / -0.5 / 4 | -9.4 / -0.5 / 4 | -9.4 / -0.5 / 4 | -9.4 / -0.5 / 4 | -9.4 / -0.5 / 4 | -37.7 / -44.4 / 5 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | · | · | · | · | -1.9 / -4.9 / 14 | -30.6 / -30.2 / 10 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | -18.7 / -30.2 / 12 | -18.7 / -30.2 / 12 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -50.7 / -63.6 / 1 | -50.7 / -63.6 / 1 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -27.3 / -28.1 / 1 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · |
| **armies with a pick** | 5 | 5 | 5 | 7 | 9 | 10 |

### knee

| army | q40 | q20 | q10 | q5 | q2 | q1 |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | · | · | · | -11.3 / -19.1 / 4 | -11.3 / -19.1 / 4 | -11.3 / -19.1 / 4 |
| 2026-09-17 export, its setup (7 000 leadership) | · | · | · | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | -44.3 / -44.9 / 10 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | -4.8 / -0.5 / 5 | -4.8 / -0.5 / 5 | -4.8 / -0.5 / 5 | -4.8 / -0.5 / 5 | -4.8 / -0.5 / 5 | -22.1 / -30.4 / 6 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | · | · | · | · | -1.9 / -4.9 / 14 | -1.9 / -4.9 / 14 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | -18.7 / -30.2 / 12 | -18.7 / -30.2 / 12 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -27.3 / -28.1 / 1 | -27.3 / -28.1 / 1 | -27.3 / -28.1 / 1 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · |
| **armies with a pick** | 5 | 5 | 5 | 7 | 9 | 10 |

### knee + 10 % gate

| army | q40 | q20 | q10 | q5 | q2 | q1 |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | · | · | · | · | · | · |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | · | · | · | -11.3 / -19.1 / 4 | -11.3 / -19.1 / 4 | -11.3 / -19.1 / 4 |
| 2026-09-17 export, its setup (7 000 leadership) | · | · | · | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 | -7.7 / -19.9 / 7 |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | -44.3 / -44.9 / 10 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | · | · | · | · | -22.1 / -30.4 / 6 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | · | · | · | · | -22.6 / -24.9 / 11 | -22.6 / -24.9 / 11 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | -18.7 / -30.2 / 12 | -18.7 / -30.2 / 12 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -19.9 / -17.3 / 1 | -27.3 / -28.1 / 1 | -27.3 / -28.1 / 1 | -27.3 / -28.1 / 1 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · |
| **armies with a pick** | 3 | 3 | 3 | 5 | 7 | 9 |

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

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 20,298,165 | 8,686,000 | 2 | 3,304 | 5,400 | 29 d 12 h | 2.34 | 733,818 | 6,144 | 3,759 | 1.2 |
| **pick A** | 21,751,874 | 8,728,200 | 2 | 3,304 | 6,000 | 29 d 19 h | 2.49 | 805,781 | 6,583 | 3,625 | 6.3 |
| SW | 22,973,020 | 8,789,200 | 5 | 2,760 | 6,760 | 30 d 5 h | 2.61 | 520,974 | 8,324 | 3,398 | 0.0 |
| MM | 24,383,400 | 8,789,200 | 6 | 3,048 | 6,760 | 30 d 5 h | 2.77 | 669,208 | 8,000 | 3,607 | 1.1 |
| MX | 25,860,303 | 9,190,100 | 8 | 4,384 | 6,760 | 34 d 10 h | 2.81 | 590,048 | 5,899 | 3,825 | -6.6 |
| AI | 26,479,061 | 9,190,100 | 10 | 4,800 | 6,760 | 34 d 10 h | 2.88 | 470,578 | 5,516 | 3,917 | -13.4 |

**pick A** — chosen by rated q40…q1; knee q40…q1. vs the sweet spot: damage -5.3 % · silver -0.7 % · burn -3 · gold +19.7 % · coins -11.2 % · queue -1.4 % · dmg/silver ×0.95 · dmg/merc ×1.55 · dmg/gold ×0.79 · dmg/coin ×1.07.

  - sweet spot fields archer-1 3,042, archer-2 1,670, archer-3 936, bear-5 2, desert-vanquisher 3, epic-monster-hunter-6 31, ettin 2, fearsome-manticore 3, flaming-centaur 3, gorgon-medusa 11, ice-phoenix 8, magic-dragon 9, many-armed-guardian 10, rider-1 1,518, rider-2 834, rider-3 472, spearman-1 3,030, spearman-2 1,680, spearman-3 942, stone-gargoyle 26, swordsman-1 3,048
  - **pick A** fields archer-1 3,042, archer-2 1,680, archer-3 939, bear-5 4, desert-vanquisher 3, emerald-dragon 10, epic-monster-hunter-6 10, ettin 3, fearsome-manticore 3, flaming-centaur 3, gorgon-medusa 10, ice-phoenix 8, magic-dragon 9, many-armed-guardian 10, rider-1 1,515, rider-2 837, rider-3 468, spearman-1 3,036, spearman-2 1,677, spearman-3 938, stone-gargoyle 10, swordsman-1 3,048

### first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 189,503,660 | 11,640,400 | 4 | 3,128 | 41,120 | 76 d 4 h | 16.28 | 716,694 | 60,583 | 4,609 | -12.8 |
| **pick A** | 282,129,906 | 15,742,600 | 5 | 5,984 | 52,080 | 104 d 3 h | 17.92 | 780,610 | 47,147 | 5,417 | 3.7 |
| SW | 283,093,746 | 19,136,200 | 5 | 5,984 | 52,080 | 127 d 16 h | 14.79 | 780,610 | 47,308 | 5,436 | 0.0 |
| MM | 397,782,216 | 21,008,000 | 7 | 9,048 | 72,880 | 139 d 6 h | 18.93 | 824,031 | 43,964 | 5,458 | 20.2 |
| MX | 480,990,543 | 22,090,000 | 8 | 12,048 | 84,120 | 145 d 17 h | 21.77 | 857,022 | 39,923 | 5,718 | 36.6 |
| AI | 482,648,331 | 22,090,000 | 10 | 12,464 | 84,120 | 145 d 17 h | 21.85 | 851,396 | 38,723 | 5,738 | 28.5 |

**pick A** — chosen by rated q40…q1; knee q40…q1; knee + 10 % gate q40…q1. vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00.

  - sweet spot fields ancient-terror 3, archer-3 9,900, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 5,049, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3
  - **pick A** fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1,073,738 | 766,600 | 4 | 144 | 0 | 2 d 0 h | 1.40 | 178,496 | 7,457 | ∞ | -29.2 |
| **pick B** | 1,670,387 | 1,100,500 | 4 | 248 | 0 | 2 d 20 h | 1.52 | 299,124 | 6,735 | ∞ | -9.6 |
| **pick A** | 1,884,530 | 1,239,400 | 4 | 288 | 0 | 3 d 5 h | 1.52 | 337,542 | 6,544 | ∞ | -2.9 |
| SW | 2,125,775 | 1,521,800 | 5 | 296 | 0 | 3 d 23 h | 1.40 | 277,147 | 7,182 | ∞ | 0.0 |
| AI | 2,577,346 | 1,521,100 | 7 | 408 | 0 | 3 d 23 h | 1.69 | 274,691 | 6,317 | ∞ | 9.5 |

**pick A** — chosen by rated q5…q2; knee q5…q1; knee + 10 % gate q5…q1. vs the sweet spot: damage -11.3 % · silver -18.6 % · burn -1 · gold -2.7 % · coins 0.0 % · queue -19.1 % · dmg/silver ×1.09 · dmg/merc ×1.22 · dmg/gold ×0.91 · dmg/coin —.

  - sweet spot fields arbalester-6 10, archer-1 747, archer-2 413, chariot-6 6, epic-monster-hunter-6 10, legionary-6 11, rider-1 375, rider-2 208, rider-3 117, spearman-1 564, spearman-2 312, swordsman-1 564
  - **pick A** fields arbalester-6 10, archer-1 605, archer-2 324, chariot-6 6, epic-monster-hunter-6 10, legionary-6 9, rider-1 286, rider-2 172, rider-3 93, spearman-1 481, spearman-2 261, swordsman-1 491

**pick B** — chosen by rated q1. vs the sweet spot: damage -21.4 % · silver -27.7 % · burn -1 · gold -16.2 % · coins 0.0 % · queue -28.2 % · dmg/silver ×1.09 · dmg/merc ×1.08 · dmg/gold ×0.94 · dmg/coin —.

  - sweet spot fields arbalester-6 10, archer-1 747, archer-2 413, chariot-6 6, epic-monster-hunter-6 10, legionary-6 11, rider-1 375, rider-2 208, rider-3 117, spearman-1 564, spearman-2 312, swordsman-1 564
  - **pick B** fields arbalester-6 10, archer-1 538, archer-2 288, chariot-6 4, epic-monster-hunter-6 10, legionary-6 8, rider-1 254, rider-2 153, rider-3 82, spearman-1 427, spearman-2 232, swordsman-1 436

### 2026-09-17 export, its setup (7 000 leadership)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 3,203,983 | 2,482,500 | 4 | 360 | 0 | 6 d 22 h | 1.29 | 407,682 | 8,900 | ∞ | -13.6 |
| SS | 3,549,139 | 1,985,200 | 6 | 504 | 0 | 5 d 13 h | 1.79 | 381,901 | 7,042 | ∞ | -9.9 |
| **pick A** | 4,098,844 | 2,178,700 | 7 | 576 | 0 | 6 d 2 h | 1.88 | 388,293 | 7,116 | ∞ | -3.2 |
| SW | 4,442,817 | 2,722,500 | 7 | 576 | 0 | 7 d 14 h | 1.63 | 388,293 | 7,713 | ∞ | 0.0 |
| MX | 6,148,584 | 2,740,100 | 14 | 1,016 | 0 | 7 d 17 h | 2.24 | 342,757 | 6,052 | ∞ | 10.6 |
| AI | 6,550,179 | 3,717,800 | 22 | 1,640 | 0 | 17 d 15 h | 1.76 | 220,200 | 3,994 | ∞ | -24.5 |

**pick A** — chosen by rated q5…q1; knee q5…q1; knee + 10 % gate q5…q1. vs the sweet spot: damage -7.7 % · silver -20.0 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -19.9 % · dmg/silver ×1.15 · dmg/merc ×1.00 · dmg/gold ×0.92 · dmg/coin —.

  - sweet spot fields arbalester-6 20, archer-1 1,520, archer-2 812, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20, rider-1 691, rider-2 391, rider-3 207, spearman-1 1,337, spearman-2 728
  - **pick A** fields arbalester-6 20, archer-1 1,216, archer-2 649, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20, rider-1 553, rider-2 313, rider-3 166, spearman-1 1,069, spearman-2 583

### 2026-09-17 export, 12 000 leadership

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4,400,680 | 4,370,200 | 4 | 360 | 0 | 12 d 4 h | 1.01 | 407,682 | 12,224 | ∞ | -25.7 |
| SS | 4,446,760 | 2,477,300 | 10 | 616 | 0 | 6 d 22 h | 1.80 | 287,777 | 7,219 | ∞ | -25.3 |
| **pick A** | 4,870,455 | 2,614,000 | 10 | 680 | 0 | 7 d 7 h | 1.86 | 321,401 | 7,162 | ∞ | -21.6 |
| SW | 8,739,455 | 4,698,300 | 17 | 1,224 | 0 | 13 d 5 h | 1.86 | 336,530 | 7,140 | ∞ | 0.0 |
| MX | 8,796,722 | 5,340,800 | 22 | 1,544 | 0 | 20 d 18 h | 1.65 | 282,201 | 5,697 | ∞ | -12.0 |

**pick A** — chosen by rated q1; knee q1; knee + 10 % gate q1. vs the sweet spot: damage -44.3 % · silver -44.4 % · burn -7 · gold -44.4 % · coins 0.0 % · queue -44.9 % · dmg/silver ×1.00 · dmg/merc ×0.96 · dmg/gold ×1.00 · dmg/coin —.

  - sweet spot fields arbalester-6 40, archer-1 2,687, archer-2 1,483, chariot-6 16, epic-monster-hunter-6 66, legionary-6 34, rider-1 1,191, rider-2 658, rider-3 371, spearman-1 2,179, spearman-2 1,210
  - **pick A** fields arbalester-6 28, archer-1 1,459, archer-2 779, chariot-6 10, epic-monster-hunter-6 24, legionary-6 24, rider-1 663, rider-2 376, rider-3 199, spearman-1 1,283, spearman-2 699

### live account of 2026-09-18 (one hired type, 20 000 leadership)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 3,703,985 | 3,587,300 | 4 | 288 | 0 | 9 d 21 h | 1.03 | 323,582 | 12,861 | ∞ | -25.9 |
| **pick B** | 6,448,908 | 7,732,100 | 4 | 288 | 0 | 21 d 2 h | 0.83 | 323,582 | 22,392 | ∞ | 0.6 |
| **pick D** | 4,433,970 | 4,323,000 | 5 | 344 | 0 | 11 d 19 h | 1.03 | 310,639 | 12,889 | ∞ | -22.4 |
| **pick A** | 6,772,490 | 7,732,100 | 5 | 360 | 0 | 21 d 2 h | 0.88 | 323,582 | 18,812 | ∞ | 0.1 |
| **pick C** | 5,546,047 | 5,406,200 | 6 | 432 | 0 | 14 d 18 h | 1.03 | 323,582 | 12,838 | ∞ | -15.3 |
| SW | 7,115,941 | 7,699,700 | 6 | 432 | 0 | 21 d 5 h | 0.92 | 323,582 | 16,472 | ∞ | 0.0 |
| MX | 7,374,807 | 7,699,700 | 7 | 488 | 0 | 21 d 5 h | 0.96 | 314,337 | 15,112 | ∞ | -1.0 |
| AI | 7,860,179 | 7,699,700 | 9 | 592 | 0 | 21 d 5 h | 1.02 | 298,414 | 13,277 | ∞ | -3.2 |

**pick A** — chosen by knee q40…q2. vs the sweet spot: damage -4.8 % · silver +0.4 % · burn -1 · gold -16.7 % · coins 0.0 % · queue -0.5 % · dmg/silver ×0.95 · dmg/merc ×1.00 · dmg/gold ×1.14 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick A** fields archer-1 4,843, archer-2 2,485, epic-monster-hunter-6 50, rider-1 1,938, rider-2 975, rider-3 559, spearman-1 3,626, spearman-2 2,057

**pick B** — chosen by rated q40…q2. vs the sweet spot: damage -9.4 % · silver +0.4 % · burn -2 · gold -33.3 % · coins 0.0 % · queue -0.5 % · dmg/silver ×0.90 · dmg/merc ×1.00 · dmg/gold ×1.36 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick B** fields archer-1 4,843, archer-2 2,485, epic-monster-hunter-6 40, rider-1 1,938, rider-2 975, rider-3 559, spearman-1 3,626, spearman-2 2,057

**pick C** — chosen by knee q1; knee + 10 % gate q1. vs the sweet spot: damage -22.1 % · silver -29.8 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -30.4 % · dmg/silver ×1.11 · dmg/merc ×1.00 · dmg/gold ×0.78 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick C** fields archer-1 3,386, archer-2 1,737, epic-monster-hunter-6 60, rider-1 1,355, rider-2 682, rider-3 391, spearman-1 2,535, spearman-2 1,438

**pick D** — chosen by rated q1. vs the sweet spot: damage -37.7 % · silver -43.9 % · burn -1 · gold -20.4 % · coins 0.0 % · queue -44.4 % · dmg/silver ×1.11 · dmg/merc ×0.96 · dmg/gold ×0.78 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick D** fields archer-1 2,708, archer-2 1,390, epic-monster-hunter-6 48, rider-1 1,084, rider-2 545, rider-3 312, spearman-1 2,028, spearman-2 1,150

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4,018,658 | 3,666,300 | 4 | 328 | 0 | 10 d 2 h | 1.10 | 388,797 | 12,252 | ∞ | -19.6 |
| SS | 4,559,792 | 2,681,700 | 10 | 600 | 0 | 7 d 8 h | 1.70 | 277,200 | 7,600 | ∞ | -18.3 |
| **pick C** | 4,931,162 | 2,988,500 | 10 | 648 | 0 | 8 d 4 h | 1.65 | 293,890 | 7,610 | ∞ | -15.2 |
| **pick B** | 5,501,565 | 3,216,900 | 11 | 736 | 0 | 8 d 19 h | 1.71 | 305,272 | 7,475 | ∞ | -10.7 |
| **pick A** | 6,972,311 | 4,074,700 | 14 | 936 | 0 | 11 d 3 h | 1.71 | 304,072 | 7,449 | ∞ | -1.0 |
| SW | 7,108,497 | 4,243,200 | 14 | 936 | 0 | 11 d 17 h | 1.68 | 304,072 | 7,595 | ∞ | 0.0 |
| MX | 8,693,352 | 4,295,200 | 19 | 1,272 | 0 | 11 d 23 h | 2.02 | 303,341 | 6,834 | ∞ | 11.3 |
| AI | 9,336,448 | 4,979,300 | 25 | 1,816 | 0 | 19 d 4 h | 1.88 | 271,179 | 5,141 | ∞ | 1.2 |

**pick A** — chosen by rated q2; knee q2…q1. vs the sweet spot: damage -1.9 % · silver -4.0 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -4.9 % · dmg/silver ×1.02 · dmg/merc ×1.00 · dmg/gold ×0.98 · dmg/coin —.

  - sweet spot fields arbalester-6 37, archer-1 2,465, archer-2 1,316, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38, rider-1 1,047, rider-2 594, rider-3 308, spearman-1 2,121, spearman-2 1,112
  - **pick A** fields arbalester-6 37, archer-1 2,553, archer-2 1,310, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38, rider-1 1,021, rider-2 514, rider-3 294, spearman-1 1,912, spearman-2 1,084

**pick B** — chosen by knee + 10 % gate q2…q1. vs the sweet spot: damage -22.6 % · silver -24.2 % · burn -3 · gold -21.4 % · coins 0.0 % · queue -24.9 % · dmg/silver ×1.02 · dmg/merc ×1.00 · dmg/gold ×0.98 · dmg/coin —.

  - sweet spot fields arbalester-6 37, archer-1 2,465, archer-2 1,316, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38, rider-1 1,047, rider-2 594, rider-3 308, spearman-1 2,121, spearman-2 1,112
  - **pick B** fields arbalester-6 29, archer-1 2,016, archer-2 1,034, chariot-6 5, epic-monster-hunter-6 35, legionary-6 30, rider-1 806, rider-2 406, rider-3 232, spearman-1 1,509, spearman-2 856

**pick C** — chosen by rated q1. vs the sweet spot: damage -30.6 % · silver -29.6 % · burn -4 · gold -30.8 % · coins 0.0 % · queue -30.2 % · dmg/silver ×0.98 · dmg/merc ×0.97 · dmg/gold ×1.00 · dmg/coin —.

  - sweet spot fields arbalester-6 37, archer-1 2,465, archer-2 1,316, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38, rider-1 1,047, rider-2 594, rider-3 308, spearman-1 2,121, spearman-2 1,112
  - **pick C** fields arbalester-6 35, archer-1 1,872, archer-2 960, chariot-6 8, epic-monster-hunter-6 31, legionary-6 10, rider-1 749, rider-2 377, rider-3 216, spearman-1 1,402, spearman-2 795

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

No pick at any value of any line.

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 2,016,069 | 1,761,200 | 3 | 304 | 0 | 4 d 20 h | 1.14 | 277,917 | 6,632 | ∞ | -21.2 |
| SS | 2,054,337 | 1,587,400 | 9 | 1,648 | 0 | 8 d 14 h | 1.29 | 155,938 | 1,247 | ∞ | -34.7 |
| **pick A** | 3,544,681 | 2,264,700 | 12 | 1,128 | 0 | 8 d 16 h | 1.57 | 222,881 | 3,142 | ∞ | -6.9 |
| SW | 4,358,805 | 2,635,500 | 15 | 1,936 | 0 | 12 d 10 h | 1.65 | 204,722 | 2,251 | ∞ | 0.0 |
| MM | 6,608,519 | 3,417,400 | 45 | 5,848 | 0 | 23 d 18 h | 1.93 | 146,856 | 1,130 | ∞ | -16.8 |
| MX | 12,433,369 | 3,481,800 | 87 | 12,872 | 0 | 24 d 4 h | 3.57 | 142,912 | 966 | ∞ | 24.0 |

**pick A** — chosen by rated q2…q1; knee q2…q1; knee + 10 % gate q2…q1. vs the sweet spot: damage -18.7 % · silver -14.1 % · burn -3 · gold -41.7 % · coins 0.0 % · queue -30.2 % · dmg/silver ×0.95 · dmg/merc ×1.09 · dmg/gold ×1.40 · dmg/coin —.

  - sweet spot fields arbalester-6 76, archer-2 1,625, bear-5 7, legionary-6 60, rider-2 660, rider-3 370, spearman-2 1,290
  - **pick A** fields arbalester-6 51, archer-2 1,098, bear-5 4, legionary-6 41, rider-1 807, rider-2 446, rider-3 250, spearman-2 871

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

No pick at any value of any line.

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

No pick at any value of any line.

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1,000,201 | 811,300 | 1 | 72 | 960 | 2 d 4 h | 1.23 | 168,840 | 13,892 | 1,042 | -14.6 |
| **pick B** | 1,037,858 | 850,800 | 1 | 72 | 960 | 2 d 7 h | 1.22 | 168,840 | 14,415 | 1,081 | -13.2 |
| **pick A** | 1,858,420 | 1,997,700 | 3 | 216 | 960 | 5 d 1 h | 0.93 | 112,560 | 8,604 | 1,936 | 1.7 |
| SW | 2,104,714 | 2,115,100 | 5 | 352 | 960 | 6 d 6 h | 1.00 | 110,309 | 5,979 | 2,192 | 0.0 |
| MX | 2,168,812 | 2,235,700 | 7 | 440 | 960 | 7 d 11 h | 0.97 | 99,696 | 4,929 | 2,259 | -9.1 |

**pick A** — chosen by rated q40…q5; knee q40…q1; knee + 10 % gate q40…q1. vs the sweet spot: damage -11.7 % · silver -5.6 % · burn -2 · gold -38.6 % · coins 0.0 % · queue -19.1 % · dmg/silver ×0.93 · dmg/merc ×1.02 · dmg/gold ×1.44 · dmg/coin ×0.88.

  - sweet spot fields archer-1 1,048, archer-2 580, battle-boar 4, emerald-dragon 3, epic-monster-hunter-5 49, rider-1 524, rider-2 293, rider-3 163, spearman-1 1,053, spearman-2 584, stone-gargoyle 3, water-elemental 10
  - **pick A** fields archer-1 798, archer-2 442, battle-boar 3, emerald-dragon 3, epic-monster-hunter-5 30, rider-1 398, rider-2 220, rider-3 123, spearman-1 797, spearman-2 441, stone-gargoyle 5, swordsman-1 1,265, water-elemental 7

**pick B** — chosen by rated q2…q1. vs the sweet spot: damage -50.7 % · silver -59.8 % · burn -4 · gold -79.5 % · coins 0.0 % · queue -63.6 % · dmg/silver ×1.23 · dmg/merc ×1.53 · dmg/gold ×2.41 · dmg/coin ×0.49.

  - sweet spot fields archer-1 1,048, archer-2 580, battle-boar 4, emerald-dragon 3, epic-monster-hunter-5 49, rider-1 524, rider-2 293, rider-3 163, spearman-1 1,053, spearman-2 584, stone-gargoyle 3, water-elemental 10
  - **pick B** fields archer-1 330, archer-2 170, battle-boar 3, emerald-dragon 4, epic-monster-hunter-5 10, rider-1 169, rider-2 83, rider-3 48, spearman-1 317, spearman-2 180, stone-gargoyle 3, swordsman-1 543, water-elemental 10

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1,850,137 | 1,378,300 | 1 | 72 | 960 | 3 d 12 h | 1.34 | 323,582 | 25,696 | 1,927 | -10.3 |
| **pick B** | 2,137,145 | 1,501,300 | 1 | 72 | 1,080 | 3 d 20 h | 1.42 | 485,373 | 29,683 | 1,979 | -2.9 |
| **pick A** | 2,356,781 | 1,766,800 | 1 | 72 | 960 | 4 d 10 h | 1.33 | 485,373 | 32,733 | 2,455 | 2.7 |
| SW | 2,941,677 | 2,031,600 | 2 | 136 | 1,560 | 5 d 8 h | 1.45 | 461,105 | 21,630 | 1,886 | 0.0 |
| MX | 3,031,810 | 2,233,600 | 4 | 224 | 1,080 | 7 d 12 h | 1.36 | 258,866 | 13,535 | 2,807 | -22.6 |

**pick A** — chosen by rated q40…q2; knee q40…q10; knee + 10 % gate q40…q10. vs the sweet spot: damage -19.9 % · silver -13.0 % · burn -1 · gold -47.1 % · coins -38.5 % · queue -17.3 % · dmg/silver ×0.92 · dmg/merc ×1.05 · dmg/gold ×1.51 · dmg/coin ×1.30.

  - sweet spot fields archer-1 797, archer-2 440, battle-boar 1, emerald-dragon 13, epic-monster-hunter-6 19, rider-1 396, rider-2 219, rider-3 123, spearman-1 792, spearman-2 442, stone-gargoyle 12, swordsman-1 1,253, water-elemental 2
  - **pick A** fields archer-1 717, archer-2 375, battle-boar 7, emerald-dragon 9, epic-monster-hunter-6 10, rider-1 351, rider-2 184, rider-3 101, spearman-1 689, spearman-2 406, stone-gargoyle 8, swordsman-1 1,171, water-elemental 10

**pick B** — chosen by rated q1; knee q5…q1; knee + 10 % gate q5…q1. vs the sweet spot: damage -27.3 % · silver -26.1 % · burn -1 · gold -47.1 % · coins -30.8 % · queue -28.1 % · dmg/silver ×0.98 · dmg/merc ×1.05 · dmg/gold ×1.37 · dmg/coin ×1.05.

  - sweet spot fields archer-1 797, archer-2 440, battle-boar 1, emerald-dragon 13, epic-monster-hunter-6 19, rider-1 396, rider-2 219, rider-3 123, spearman-1 792, spearman-2 442, stone-gargoyle 12, swordsman-1 1,253, water-elemental 2
  - **pick B** fields archer-1 601, archer-2 315, battle-boar 8, emerald-dragon 7, epic-monster-hunter-6 10, rider-1 294, rider-2 154, rider-3 85, spearman-1 578, spearman-2 341, stone-gargoyle 6, swordsman-1 982, water-elemental 18

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

No pick at any value of any line.

