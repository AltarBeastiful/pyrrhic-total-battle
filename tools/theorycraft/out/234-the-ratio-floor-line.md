# The ratio-floor line — how far the dmg/silver and dmg/merc floors can drop

experiment: 234 · armies: 19 · extraArmies: 0 · floors: [0.95,0.9,0.85,0.8,0.75,0.7,0.6]

The rule is `rated` (`thrifty-stop.ts`): a stepping stone between the next stop down and the sweet spot, burn strictly below the next stop up's, no queue gate, and of what passes the best owner's rating against the sweet spot (queue weight 40, gold 10), taken only if that rating is above zero. Only the floors change: the share of the sweet spot's damage a silver and damage a merc a row must keep.

- **both** — dmg/silver and dmg/merc floors move together.
- **silver** — dmg/silver floor moves, dmg/merc held at 95 %.
- **merc** — dmg/merc floor moves, dmg/silver held at 95 %.

Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `rating` is the owner's rating against the sweet spot in the rule's rates (queue 40, gold 10). A matrix cell is `Δdamage % / Δqueue % / burn` of the pick against the sweet spot, `·` for no pick.

## Matrices

### both

| army | ≥ 95 % | ≥ 90 % | ≥ 85 % | ≥ 80 % | ≥ 75 % | ≥ 70 % | ≥ 60 % |
|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | · | · | · | · | · | · | · |
| 2026-09-17 export, its setup (7 000 leadership) | · | · | · | · | · | · | · |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | · | · |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | -9.4 / -0.5 / 4 | -13.9 / -0.5 / 3 | -18.5 / -0.5 / 2 | -23.0 / -0.5 / 1 | -23.0 / -0.5 / 1 | -23.0 / -0.5 / 1 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | · | · | · | · | · | · | · |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | · | · | · |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | · | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -22.4 / -19.1 / 1 | -22.4 / -19.1 / 1 | -22.4 / -19.1 / 1 | -22.4 / -19.1 / 1 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | · | -19.9 / -17.3 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · | · |
| **armies with a pick** | 2 | 5 | 5 | 5 | 5 | 5 | 5 |

### silver

| army | ≥ 95 % | ≥ 90 % | ≥ 85 % | ≥ 80 % | ≥ 75 % | ≥ 70 % | ≥ 60 % |
|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | · | · | · | · | · | · | · |
| 2026-09-17 export, its setup (7 000 leadership) | · | · | · | · | · | · | · |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | · | · |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | -9.4 / -0.5 / 4 | -13.9 / -0.5 / 3 | -18.5 / -0.5 / 2 | -23.0 / -0.5 / 1 | -23.0 / -0.5 / 1 | -23.0 / -0.5 / 1 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | · | · | · | · | · | · | · |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | · | · | · |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | · | -11.7 / -19.1 / 3 | -11.7 / -19.1 / 3 | -22.4 / -19.1 / 1 | -22.4 / -19.1 / 1 | -22.4 / -19.1 / 1 | -22.4 / -19.1 / 1 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | · | -19.9 / -17.3 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 | -15.1 / -5.6 / 1 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · | · |
| **armies with a pick** | 2 | 5 | 5 | 5 | 5 | 5 | 5 |

### merc

| army | ≥ 95 % | ≥ 90 % | ≥ 85 % | ≥ 80 % | ≥ 75 % | ≥ 70 % | ≥ 60 % |
|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×2 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×3 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Bear V ×10 (20 000 leadership) | · | · | · | · | · | · | · |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | · | · | · | · | · | · | · |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 | -5.3 / -1.4 / 2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 | -0.3 / -18.5 / 5 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | · | · | · | · | · | · | · |
| 2026-09-17 export, its setup (7 000 leadership) | · | · | · | · | · | · | · |
| 2026-09-17 export, 12 000 leadership | · | · | · | · | · | · | · |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | · | · | · | · | · | · | · |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | · | · | · | · | · | · | · |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | · | · | · | · | · | · | · |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | · | · | · | · | · | · | · |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | · | · | · | · | · | · | · |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | · | · | · | · | · | · | · |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | · | · | · | · | · | · | · |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | · | · | · | · | · | · | · |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | · | · | · | · | · | · | · |
| **armies with a pick** | 2 | 2 | 2 | 2 | 2 | 2 | 2 |

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

**pick A** — chosen by both ≥ 95 %…≥ 60 %; silver ≥ 95 %…≥ 60 %; merc ≥ 95 %…≥ 60 %. vs the sweet spot: damage -5.3 % · silver -0.7 % · burn -3 · gold +19.7 % · coins -11.2 % · queue -1.4 % · dmg/silver ×0.95 · dmg/merc ×1.55 · dmg/gold ×0.79 · dmg/coin ×1.07.

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

**pick A** — chosen by both ≥ 95 %…≥ 60 %; silver ≥ 95 %…≥ 60 %; merc ≥ 95 %…≥ 60 %. vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00.

  - sweet spot fields ancient-terror 3, archer-3 9,900, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 5,049, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3
  - **pick A** fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

No pick at any value of any line.

### 2026-09-17 export, its setup (7 000 leadership)

No pick at any value of any line.

### 2026-09-17 export, 12 000 leadership

No pick at any value of any line.

### live account of 2026-09-18 (one hired type, 20 000 leadership)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **pick D** | 5,478,162 | 7,732,100 | 1 | 72 | 0 | 21 d 2 h | 0.71 | 323,582 | 76,086 | ∞ | 1.9 |
| **pick C** | 5,801,744 | 7,732,100 | 2 | 144 | 0 | 21 d 2 h | 0.75 | 323,582 | 40,290 | ∞ | 1.5 |
| **pick B** | 6,125,326 | 7,732,100 | 3 | 216 | 0 | 21 d 2 h | 0.79 | 323,582 | 28,358 | ∞ | 1.0 |
| SS | 3,703,985 | 3,587,300 | 4 | 288 | 0 | 9 d 21 h | 1.03 | 323,582 | 12,861 | ∞ | -25.9 |
| **pick A** | 6,448,908 | 7,732,100 | 4 | 288 | 0 | 21 d 2 h | 0.83 | 323,582 | 22,392 | ∞ | 0.6 |
| SW | 7,115,941 | 7,699,700 | 6 | 432 | 0 | 21 d 5 h | 0.92 | 323,582 | 16,472 | ∞ | 0.0 |
| MX | 7,374,807 | 7,699,700 | 7 | 488 | 0 | 21 d 5 h | 0.96 | 314,337 | 15,112 | ∞ | -1.0 |
| AI | 7,860,179 | 7,699,700 | 9 | 592 | 0 | 21 d 5 h | 1.02 | 298,414 | 13,277 | ∞ | -3.2 |

**pick A** — chosen by both ≥ 90 %; silver ≥ 90 %. vs the sweet spot: damage -9.4 % · silver +0.4 % · burn -2 · gold -33.3 % · coins 0.0 % · queue -0.5 % · dmg/silver ×0.90 · dmg/merc ×1.00 · dmg/gold ×1.36 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick A** fields archer-1 4,843, archer-2 2,485, epic-monster-hunter-6 40, rider-1 1,938, rider-2 975, rider-3 559, spearman-1 3,626, spearman-2 2,057

**pick B** — chosen by both ≥ 85 %; silver ≥ 85 %. vs the sweet spot: damage -13.9 % · silver +0.4 % · burn -3 · gold -50.0 % · coins 0.0 % · queue -0.5 % · dmg/silver ×0.86 · dmg/merc ×1.00 · dmg/gold ×1.72 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick B** fields archer-1 4,843, archer-2 2,485, epic-monster-hunter-6 30, rider-1 1,938, rider-2 975, rider-3 559, spearman-1 3,626, spearman-2 2,057

**pick C** — chosen by both ≥ 80 %; silver ≥ 80 %. vs the sweet spot: damage -18.5 % · silver +0.4 % · burn -4 · gold -66.7 % · coins 0.0 % · queue -0.5 % · dmg/silver ×0.81 · dmg/merc ×1.00 · dmg/gold ×2.45 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick C** fields archer-1 4,843, archer-2 2,485, epic-monster-hunter-6 20, rider-1 1,938, rider-2 975, rider-3 559, spearman-1 3,626, spearman-2 2,057

**pick D** — chosen by both ≥ 75 %…≥ 60 %; silver ≥ 75 %…≥ 60 %. vs the sweet spot: damage -23.0 % · silver +0.4 % · burn -5 · gold -83.3 % · coins 0.0 % · queue -0.5 % · dmg/silver ×0.77 · dmg/merc ×1.00 · dmg/gold ×4.62 · dmg/coin —.

  - sweet spot fields archer-1 4,473, archer-2 2,388, epic-monster-hunter-6 60, rider-1 1,900, rider-2 1,078, rider-3 559, spearman-1 3,849, spearman-2 2,017
  - **pick D** fields archer-1 4,843, archer-2 2,485, epic-monster-hunter-6 10, rider-1 1,938, rider-2 975, rider-3 559, spearman-1 3,626, spearman-2 2,057

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

No pick at any value of any line.

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

No pick at any value of any line.

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

No pick at any value of any line.

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

No pick at any value of any line.

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

No pick at any value of any line.

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1,000,201 | 811,300 | 1 | 72 | 960 | 2 d 4 h | 1.23 | 168,840 | 13,892 | 1,042 | -14.6 |
| **pick B** | 1,633,911 | 1,997,700 | 1 | 72 | 960 | 5 d 1 h | 0.82 | 168,840 | 22,693 | 1,702 | 3.2 |
| **pick A** | 1,858,420 | 1,997,700 | 3 | 216 | 960 | 5 d 1 h | 0.93 | 112,560 | 8,604 | 1,936 | 1.7 |
| SW | 2,104,714 | 2,115,100 | 5 | 352 | 960 | 6 d 6 h | 1.00 | 110,309 | 5,979 | 2,192 | 0.0 |
| MX | 2,168,812 | 2,235,700 | 7 | 440 | 960 | 7 d 11 h | 0.97 | 99,696 | 4,929 | 2,259 | -9.1 |

**pick A** — chosen by both ≥ 90 %…≥ 85 %; silver ≥ 90 %…≥ 85 %. vs the sweet spot: damage -11.7 % · silver -5.6 % · burn -2 · gold -38.6 % · coins 0.0 % · queue -19.1 % · dmg/silver ×0.93 · dmg/merc ×1.02 · dmg/gold ×1.44 · dmg/coin ×0.88.

  - sweet spot fields archer-1 1,048, archer-2 580, battle-boar 4, emerald-dragon 3, epic-monster-hunter-5 49, rider-1 524, rider-2 293, rider-3 163, spearman-1 1,053, spearman-2 584, stone-gargoyle 3, water-elemental 10
  - **pick A** fields archer-1 798, archer-2 442, battle-boar 3, emerald-dragon 3, epic-monster-hunter-5 30, rider-1 398, rider-2 220, rider-3 123, spearman-1 797, spearman-2 441, stone-gargoyle 5, swordsman-1 1,265, water-elemental 7

**pick B** — chosen by both ≥ 80 %…≥ 60 %; silver ≥ 80 %…≥ 60 %. vs the sweet spot: damage -22.4 % · silver -5.6 % · burn -4 · gold -79.5 % · coins 0.0 % · queue -19.1 % · dmg/silver ×0.82 · dmg/merc ×1.53 · dmg/gold ×3.80 · dmg/coin ×0.78.

  - sweet spot fields archer-1 1,048, archer-2 580, battle-boar 4, emerald-dragon 3, epic-monster-hunter-5 49, rider-1 524, rider-2 293, rider-3 163, spearman-1 1,053, spearman-2 584, stone-gargoyle 3, water-elemental 10
  - **pick B** fields archer-1 798, archer-2 442, battle-boar 3, emerald-dragon 4, epic-monster-hunter-5 10, rider-1 398, rider-2 220, rider-3 123, spearman-1 797, spearman-2 441, stone-gargoyle 3, swordsman-1 1,265, water-elemental 10

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1,850,137 | 1,378,300 | 1 | 72 | 960 | 3 d 12 h | 1.34 | 323,582 | 25,696 | 1,927 | -10.3 |
| **pick B** | 2,356,781 | 1,766,800 | 1 | 72 | 960 | 4 d 10 h | 1.33 | 485,373 | 32,733 | 2,455 | 2.7 |
| **pick A** | 2,497,753 | 1,989,000 | 1 | 72 | 960 | 5 d 1 h | 1.26 | 485,373 | 34,691 | 2,602 | 5.0 |
| SW | 2,941,677 | 2,031,600 | 2 | 136 | 1,560 | 5 d 8 h | 1.45 | 461,105 | 21,630 | 1,886 | 0.0 |
| MX | 3,031,810 | 2,233,600 | 4 | 224 | 1,080 | 7 d 12 h | 1.36 | 258,866 | 13,535 | 2,807 | -22.6 |

**pick A** — chosen by both ≥ 85 %…≥ 60 %; silver ≥ 85 %…≥ 60 %. vs the sweet spot: damage -15.1 % · silver -2.1 % · burn -1 · gold -47.1 % · coins -38.5 % · queue -5.6 % · dmg/silver ×0.87 · dmg/merc ×1.05 · dmg/gold ×1.60 · dmg/coin ×1.38.

  - sweet spot fields archer-1 797, archer-2 440, battle-boar 1, emerald-dragon 13, epic-monster-hunter-6 19, rider-1 396, rider-2 219, rider-3 123, spearman-1 792, spearman-2 442, stone-gargoyle 12, swordsman-1 1,253, water-elemental 2
  - **pick A** fields archer-1 797, archer-2 440, battle-boar 7, emerald-dragon 9, epic-monster-hunter-6 10, rider-1 396, rider-2 219, rider-3 123, spearman-1 795, spearman-2 439, stone-gargoyle 8, swordsman-1 1,253, water-elemental 10

**pick B** — chosen by both ≥ 90 %; silver ≥ 90 %. vs the sweet spot: damage -19.9 % · silver -13.0 % · burn -1 · gold -47.1 % · coins -38.5 % · queue -17.3 % · dmg/silver ×0.92 · dmg/merc ×1.05 · dmg/gold ×1.51 · dmg/coin ×1.30.

  - sweet spot fields archer-1 797, archer-2 440, battle-boar 1, emerald-dragon 13, epic-monster-hunter-6 19, rider-1 396, rider-2 219, rider-3 123, spearman-1 792, spearman-2 442, stone-gargoyle 12, swordsman-1 1,253, water-elemental 2
  - **pick B** fields archer-1 717, archer-2 375, battle-boar 7, emerald-dragon 9, epic-monster-hunter-6 10, rider-1 351, rider-2 184, rider-3 101, spearman-1 689, spearman-2 406, stone-gargoyle 8, swordsman-1 1,171, water-elemental 10

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

No pick at any value of any line.

