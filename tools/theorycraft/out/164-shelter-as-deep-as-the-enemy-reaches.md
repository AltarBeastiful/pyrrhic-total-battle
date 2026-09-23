# 164 — the shelter, as deep as the enemy reaches

W12 §2. Every benchmark army, the plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march campaigns priced as the benchmark prices stops (`campaignOf`, worst opening = enemy-first journal). A **candidate** is one march repeated four times, every hired stack capped by the four-march sustain (`largestSustained(cap, 4)`). Raw candidates: Elite / MS / MS-relaxed sizer at 10 %…100 % of the sustain, TotalStack rows re-capped, each stop’s troops under its own first-march hired and under the full sustain. Each rule is applied to every raw candidate, then `retypeMarch` on that rule’s best six and the rule applied again. **(a)** `shelterCounts` (every hired stack under the lowest troop stack); **(b)** the journal rule: the highest-HP hired stack that dies before striking in the enemy-first journal is lowered to just under the next stack in the kill order that is not itself a hired stack wiped before striking, repeated until no hired stack dies before striking (greedy, smallest cut per step), then each hired stack raised back to the highest of its raw count and the just-under-another-stack boundaries that keeps every hired stack striking; **(c)** no shelter. The **best** of a rule is its candidate with the highest `rate(top, candidate, markerRates)` against the highest-damage stop (**top**). **pre-strike hired** = hired stacks the enemy wipes before they strike (first march).


## A. Per army: the best candidate of each rule, rated against the top stop

Cells: four-march damage · hired lost · **rating vs top**. "stops with a pre-strike hired stack": stops of the shipped bar with a hired stack the enemy wipes before it strikes, in any march.

| army | top | top dmg / hired | (a) dmg · hired · rating | (b) dmg · hired · rating | (c) dmg · hired · rating · pre-strike hired | stops rated > 0 (a / b / c) | stops with a pre-strike hired stack |
|---|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | SW | 18.19M / 1 | — | — | — · 0 | — / — / — | 0/1 |
| first-run army, Bear V ×2 (20 000 leadership | SW | 18.41M / 2 | — | — | — · 0 | — / — / — | 0/1 |
| first-run army, Bear V ×3 (20 000 leadership | AI | 19.04M / 3 | — | — | — · 0 | — / — / — | 0/2 |
| first-run army, Bear V ×10 (20 000 leadershi | AI | 21.29M / 4 | 18.82M · 4 · **10.97** | 18.82M · 4 · **10.97** | 18.82M · 4 · **10.97** · 0 | 2 / 2 / 2 | 0/2 |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | 30.14M / 30 | 28.73M · 24 · **2.83** | 28.73M · 24 · **2.83** | 28.73M · 24 · **2.83** · 0 | 3 / 3 / 3 | 0/4 |
| first-run army, monster tiers 3–5 at 900 dom | AI | 103.20M / 34 | 97.53M · 24 · **8.31** | 97.53M · 24 · **8.31** | 97.53M · 24 · **8.31** · 0 | 5 / 5 / 5 | 0/5 |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | 8.99M / 24 | 8.16M · 16 · **0.71** | 8.16M · 16 · **0.71** | 8.16M · 16 · **0.71** · 0 | 3 / 3 / 3 | 0/3 |
| 2026-09-17 export, its setup (7 000 leadersh | MX | 24.29M / 55 | 23.43M · 52 · **-1.51** | 23.43M · 52 · **-1.51** | 23.43M · 52 · **-1.51** · 0 | 3 / 3 / 3 | 0/5 |
| 2026-09-17 export, 12 000 leadership | MX | 34.62M / 82 | 32.91M · 64 · **6.13** | 32.91M · 64 · **6.13** | 32.91M · 64 · **6.13** · 0 | 3 / 3 / 3 | 0/4 |
| live account of 2026-09-18 (one hired type,  | AI | 29.74M / 30 | 22.10M · 4 · **9.76** | 22.10M · 4 · **9.76** | 22.10M · 4 · **9.76** · 0 | 4 / 4 / 4 | 0/4 |
| live account, evening (hunters 83, legionari | MX | 34.10M / 76 | 32.99M · 68 · **0.04** | 32.99M · 68 · **0.04** | 32.99M · 68 · **0.04** · 0 | 5 / 5 / 5 | 0/5 |
| Aydae alone, 4 975 (one captain, four hired  | AI | 18.75M / 111 | 16.05M · 40 · **19.67** | 16.05M · 40 · **19.67** | 16.05M · 40 · **19.67** · 0 | 4 / 4 / 4 | 0/4 |
| the owner’s live camp of 2026-09-18 (arbales | MX | 31.54M / 208 | 47.47M · 332 · **20.98** | 47.47M · 332 · **20.98** | 65.40M · 504 · **32.04** · 1 | 3 / 3 / 3 | 0/5 |
| his camp of 2026-09-19, the localStorage dum | MX | 23.59M / 148 | 22.33M · 140 · **-3.79** | 22.33M · 140 · **-3.79** | 22.33M · 140 · **-3.79** · 0 | 0 / 0 / 0 | 0/5 |
| his camp of 2026-09-19, as his message reads | AI | 11.59M / 41 | 11.23M · 20 · **20.69** | 11.23M · 20 · **20.69** | 11.23M · 20 · **20.69** · 0 | 5 / 5 / 5 | 0/5 |
| his TotalStack profile of 2026-09-19 (5 225  | MX | 8.44M / 25 | 6.30M · 4 · **11.67** | 6.30M · 4 · **11.67** | 6.30M · 4 · **11.67** · 0 | 3 / 3 / 3 | 0/3 |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | 11.76M / 14 | 11.77M · 8 · **11.52** | 11.77M · 8 · **11.52** | 11.77M · 8 · **11.52** · 0 | 3 / 3 / 3 | 0/3 |

## B. Every marker of each best, and of the top stop

| army | rule | source | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | hired per 1M | rating vs top | worse than top on |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership | top SW | the bar | 18,189,008 | 32,525,600 | 1 | 0 | 0 | 2,522 | 0.559 | 112,200 | — | — | 0.05 | 0 | — |
| first-run army, Bear V ×2 (20 000 leadership | top SW | the bar | 18,413,408 | 32,525,600 | 2 | 160 | 0 | 2,522 | 0.566 | 168,300 | 115,084 | — | 0.11 | 0 | — |
| first-run army, Bear V ×3 (20 000 leadership | top AI | the bar | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 39,668 | — | 0.16 | 0 | — |
| first-run army, Bear V ×10 (20 000 leadershi | top AI | the bar | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 4,435 | — | 0.19 | 0 | — |
| first-run army, Bear V ×10 (20 000 leadershi | a | Elite 20 % → retyped | 18,816,100 | 32,525,600 | 4 | 0 | 0 | 2,524 | 0.579 | 112,200 | — | — | 0.21 | 10.97 | dmg, dmg/silver, dmg/hired, dmg/gold |
| first-run army, Bear V ×10 (20 000 leadershi | b | Elite 20 % → retyped | 18,816,100 | 32,525,600 | 4 | 0 | 0 | 2,524 | 0.579 | 112,200 | — | — | 0.21 | 10.97 | dmg, dmg/silver, dmg/hired, dmg/gold |
| first-run army, Bear V ×10 (20 000 leadershi | c | Elite 20 % → retyped | 18,816,100 | 32,525,600 | 4 | 0 | 0 | 2,524 | 0.579 | 112,200 | — | — | 0.21 | 10.97 | dmg, dmg/silver, dmg/hired, dmg/gold |
| first-run army, Epic Monster Hunter VI ×83 ( | top AI | the bar | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 14,950 | — | 1.00 | 0 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | a | SW re-sheltered → retyped | 28,734,620 | 32,534,400 | 24 | 1,728 | 0 | 2,525 | 0.883 | 431,781 | 16,629 | — | 0.84 | 2.83 | dmg, dmg/silver |
| first-run army, Epic Monster Hunter VI ×83 ( | b | SW re-sheltered → retyped | 28,734,620 | 32,534,400 | 24 | 1,728 | 0 | 2,525 | 0.883 | 431,781 | 16,629 | — | 0.84 | 2.83 | dmg, dmg/silver |
| first-run army, Epic Monster Hunter VI ×83 ( | c | SW re-sheltered → retyped | 28,734,620 | 32,534,400 | 24 | 1,728 | 0 | 2,525 | 0.883 | 431,781 | 16,629 | — | 0.84 | 2.83 | dmg, dmg/silver |
| first-run army, monster tiers 3–5 at 900 dom | top AI | the bar | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 5,769 | 3,816 | 0.33 | 0 | — |
| first-run army, monster tiers 3–5 at 900 dom | a | MM re-sheltered | 97,533,600 | 35,156,800 | 24 | 12,192 | 27,040 | 2,900 | 2.774 | 669,208 | 8,000 | 3,607 | 0.25 | 8.31 | dmg, dmg/coin |
| first-run army, monster tiers 3–5 at 900 dom | b | MM re-sheltered | 97,533,600 | 35,156,800 | 24 | 12,192 | 27,040 | 2,900 | 2.774 | 669,208 | 8,000 | 3,607 | 0.25 | 8.31 | dmg, dmg/coin |
| first-run army, monster tiers 3–5 at 900 dom | c | MM re-sheltered | 97,533,600 | 35,156,800 | 24 | 12,192 | 27,040 | 2,900 | 2.774 | 669,208 | 8,000 | 3,607 | 0.25 | 8.31 | dmg, dmg/coin |
| the 4 000-leadership case of 2026-09-15 (Tot | top AI | the bar | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 6,725 | — | 2.67 | 0 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | a | SW re-sheltered | 8,160,188 | 6,087,200 | 16 | 1,120 | 0 | 381 | 1.341 | 325,002 | 7,286 | — | 1.96 | 0.71 | dmg, silver, queue, dmg/silver |
| the 4 000-leadership case of 2026-09-15 (Tot | b | SW re-sheltered | 8,160,188 | 6,087,200 | 16 | 1,120 | 0 | 381 | 1.341 | 325,002 | 7,286 | — | 1.96 | 0.71 | dmg, silver, queue, dmg/silver |
| the 4 000-leadership case of 2026-09-15 (Tot | c | SW re-sheltered | 8,160,188 | 6,087,200 | 16 | 1,120 | 0 | 381 | 1.341 | 325,002 | 7,286 | — | 1.96 | 0.71 | dmg, silver, queue, dmg/silver |
| 2026-09-17 export, its setup (7 000 leadersh | top MX | the bar | 24,291,732 | 10,960,100 | 55 | 4,000 | 0 | 740 | 2.216 | 340,059 | 6,073 | — | 2.26 | 0 | — |
| 2026-09-17 export, its setup (7 000 leadersh | a | MX re-sheltered → retyped | 23,429,548 | 10,964,000 | 52 | 3,808 | 0 | 741 | 2.137 | 331,345 | 6,153 | — | 2.22 | -1.51 | dmg, silver, queue, dmg/silver, dmg/hired |
| 2026-09-17 export, its setup (7 000 leadersh | b | MX re-sheltered → retyped | 23,429,548 | 10,964,000 | 52 | 3,808 | 0 | 741 | 2.137 | 331,345 | 6,153 | — | 2.22 | -1.51 | dmg, silver, queue, dmg/silver, dmg/hired |
| 2026-09-17 export, its setup (7 000 leadersh | c | MX re-sheltered → retyped | 23,429,548 | 10,964,000 | 52 | 3,808 | 0 | 741 | 2.137 | 331,345 | 6,153 | — | 2.22 | -1.51 | dmg, silver, queue, dmg/silver, dmg/hired |
| 2026-09-17 export, 12 000 leadership | top MX | the bar | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 5,985 | — | 2.37 | 0 | — |
| 2026-09-17 export, 12 000 leadership | a | SW re-sheltered → retyped | 32,910,708 | 18,794,800 | 64 | 4,608 | 0 | 1,269 | 1.751 | 325,560 | 7,142 | — | 1.94 | 6.13 | dmg |
| 2026-09-17 export, 12 000 leadership | b | SW re-sheltered → retyped | 32,910,708 | 18,794,800 | 64 | 4,608 | 0 | 1,269 | 1.751 | 325,560 | 7,142 | — | 1.94 | 6.13 | dmg |
| 2026-09-17 export, 12 000 leadership | c | SW re-sheltered → retyped | 32,910,708 | 18,794,800 | 64 | 4,608 | 0 | 1,269 | 1.751 | 325,560 | 7,142 | — | 1.94 | 6.13 | dmg |
| live account of 2026-09-18 (one hired type,  | top AI | the bar | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 14,754 | — | 1.01 | 0 | — |
| live account of 2026-09-18 (one hired type,  | a | Elite 10 % → retyped | 22,098,564 | 31,240,800 | 4 | 160 | 0 | 2,092 | 0.707 | 194,150 | 138,116 | — | 0.18 | 9.76 | dmg, silver, queue, dmg/silver, dmg/hired |
| live account of 2026-09-18 (one hired type,  | b | Elite 10 % → retyped | 22,098,564 | 31,240,800 | 4 | 160 | 0 | 2,092 | 0.707 | 194,150 | 138,116 | — | 0.18 | 9.76 | dmg, silver, queue, dmg/silver, dmg/hired |
| live account of 2026-09-18 (one hired type,  | c | Elite 10 % → retyped | 22,098,564 | 31,240,800 | 4 | 160 | 0 | 2,092 | 0.707 | 194,150 | 138,116 | — | 0.18 | 9.76 | dmg, silver, queue, dmg/silver, dmg/hired |
| live account, evening (hunters 83, legionari | top MX | the bar | 34,103,988 | 17,179,800 | 76 | 5,040 | 0 | 1,150 | 1.985 | 300,023 | 6,767 | — | 2.23 | 0 | — |
| live account, evening (hunters 83, legionari | a | MM re-sheltered | 32,989,524 | 17,180,800 | 68 | 4,736 | 0 | 1,150 | 1.920 | 312,794 | 6,966 | — | 2.06 | 0.04 | dmg, silver, dmg/silver |
| live account, evening (hunters 83, legionari | b | MM re-sheltered | 32,989,524 | 17,180,800 | 68 | 4,736 | 0 | 1,150 | 1.920 | 312,794 | 6,966 | — | 2.06 | 0.04 | dmg, silver, dmg/silver |
| live account, evening (hunters 83, legionari | c | MM re-sheltered | 32,989,524 | 17,180,800 | 68 | 4,736 | 0 | 1,150 | 1.920 | 312,794 | 6,966 | — | 2.06 | 0.04 | dmg, silver, dmg/silver |
| Aydae alone, 4 975 (one captain, four hired  | top AI | the bar | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 2,389 | — | 5.92 | 0 | — |
| Aydae alone, 4 975 (one captain, four hired  | a | TS re-capped (M’s Preservation) → retyped | 16,052,176 | 7,795,600 | 40 | 2,528 | 0 | 527 | 2.059 | 287,417 | 6,350 | — | 2.49 | 19.67 | dmg |
| Aydae alone, 4 975 (one captain, four hired  | b | TS re-capped (M’s Preservation) → retyped | 16,052,176 | 7,795,600 | 40 | 2,528 | 0 | 527 | 2.059 | 287,417 | 6,350 | — | 2.49 | 19.67 | dmg |
| Aydae alone, 4 975 (one captain, four hired  | c | TS re-capped (M’s Preservation) → retyped | 16,052,176 | 7,795,600 | 40 | 2,528 | 0 | 527 | 2.059 | 287,417 | 6,350 | — | 2.49 | 19.67 | dmg |
| the owner’s live camp of 2026-09-18 (arbales | top MX | the bar | 31,541,795 | 12,196,000 | 208 | 28,736 | 0 | 1,839 | 2.586 | 146,044 | 1,098 | — | 6.59 | 0 | — |
| the owner’s live camp of 2026-09-18 (arbales | a | MM troops + sustain hired | 47,473,092 | 13,669,600 | 332 | 49,696 | 0 | 2,278 | 3.473 | 142,991 | 955 | — | 6.99 | 20.98 | silver, hired, gold, queue, dmg/hired, dmg/gold |
| the owner’s live camp of 2026-09-18 (arbales | b | MM troops + sustain hired | 47,473,092 | 13,669,600 | 332 | 49,696 | 0 | 2,278 | 3.473 | 142,991 | 955 | — | 6.99 | 20.98 | silver, hired, gold, queue, dmg/hired, dmg/gold |
| the owner’s live camp of 2026-09-18 (arbales | c | MM troops + sustain hired | 65,401,800 | 13,669,600 | 504 | 91,712 | 0 | 2,278 | 4.784 | 104,596 | 713 | — | 7.71 | 32.04 | silver, hired, gold, queue, dmg/hired, dmg/gold |
| his camp of 2026-09-19, the localStorage dum | top MX | the bar | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 2,251 | — | 6.27 | 0 | — |
| his camp of 2026-09-19, the localStorage dum | a | MX re-sheltered | 22,327,160 | 13,384,000 | 140 | 9,920 | 0 | 2,231 | 1.668 | 159,480 | 2,251 | — | 6.27 | -3.79 | dmg, silver, queue, dmg/silver, dmg/gold |
| his camp of 2026-09-19, the localStorage dum | b | MX re-sheltered | 22,327,160 | 13,384,000 | 140 | 9,920 | 0 | 2,231 | 1.668 | 159,480 | 2,251 | — | 6.27 | -3.79 | dmg, silver, queue, dmg/silver, dmg/gold |
| his camp of 2026-09-19, the localStorage dum | c | MX re-sheltered | 22,327,160 | 13,384,000 | 140 | 9,920 | 0 | 2,231 | 1.668 | 159,480 | 2,251 | — | 6.27 | -3.79 | dmg, silver, queue, dmg/silver, dmg/gold |
| his camp of 2026-09-19, as his message reads | top AI | the bar | 11,587,344 | 10,702,600 | 41 | 2,888 | 0 | 1,304 | 1.083 | 158,634 | 4,012 | — | 3.54 | 0 | — |
| his camp of 2026-09-19, as his message reads | a | SW re-sheltered | 11,229,100 | 9,286,000 | 20 | 1,440 | 0 | 855 | 1.209 | 323,582 | 7,798 | — | 1.78 | 20.69 | dmg |
| his camp of 2026-09-19, as his message reads | b | SW re-sheltered | 11,229,100 | 9,286,000 | 20 | 1,440 | 0 | 855 | 1.209 | 323,582 | 7,798 | — | 1.78 | 20.69 | dmg |
| his camp of 2026-09-19, as his message reads | c | SW re-sheltered | 11,229,100 | 9,286,000 | 20 | 1,440 | 0 | 855 | 1.209 | 323,582 | 7,798 | — | 1.78 | 20.69 | dmg |
| his TotalStack profile of 2026-09-19 (5 225  | top MX | the bar | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 5,330 | 2,199 | 2.96 | 0 | — |
| his TotalStack profile of 2026-09-19 (5 225  | a | Elite 10 % → retyped | 6,298,800 | 7,995,600 | 4 | 160 | 3,840 | 486 | 0.788 | 101,304 | 39,368 | 1,640 | 0.64 | 11.67 | dmg, dmg/silver, dmg/coin |
| his TotalStack profile of 2026-09-19 (5 225  | b | Elite 10 % → retyped | 6,298,800 | 7,995,600 | 4 | 160 | 3,840 | 486 | 0.788 | 101,304 | 39,368 | 1,640 | 0.64 | 11.67 | dmg, dmg/silver, dmg/coin |
| his TotalStack profile of 2026-09-19 (5 225  | c | Elite 10 % → retyped | 6,298,800 | 7,995,600 | 4 | 160 | 3,840 | 486 | 0.788 | 101,304 | 39,368 | 1,640 | 0.64 | 11.67 | dmg, dmg/silver, dmg/coin |
| his usual setup of 2026-09-19 (Aydae alone,  | top MX | the bar | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 14,550 | 2,721 | 1.19 | 0 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | a | SW re-sheltered → retyped | 11,767,084 | 8,127,200 | 8 | 544 | 6,240 | 512 | 1.448 | 461,105 | 21,631 | 1,886 | 0.68 | 11.52 | coins, dmg/coin |
| his usual setup of 2026-09-19 (Aydae alone,  | b | SW re-sheltered → retyped | 11,767,084 | 8,127,200 | 8 | 544 | 6,240 | 512 | 1.448 | 461,105 | 21,631 | 1,886 | 0.68 | 11.52 | coins, dmg/coin |
| his usual setup of 2026-09-19 (Aydae alone,  | c | SW re-sheltered → retyped | 11,767,084 | 8,127,200 | 8 | 544 | 6,240 | 512 | 1.448 | 461,105 | 21,631 | 1,886 | 0.68 | 11.52 | coins, dmg/coin |

## C. (a) against (b), raw candidate by raw candidate (rating vs top)

"(a) passes the journal": the (a)-sheltered march already has no hired stack wiped before striking — where (a) held.

| army | raw candidates | (a) passes the journal | of those, (b) rated below (a) | (b) rated below (a), all | (b) above (a), all | best (b) − best (a) |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 0 | 0 | 0 | 0 | 0 | — |
| first-run army, Bear V ×2 (20 000 leadership | 0 | 0 | 0 | 0 | 0 | — |
| first-run army, Bear V ×3 (20 000 leadership | 0 | 0 | 0 | 0 | 0 | — |
| first-run army, Bear V ×10 (20 000 leadershi | 13 | 13 | 0 | 0 | 0 | 0.00 |
| first-run army, Epic Monster Hunter VI ×83 ( | 18 | 18 | 0 | 0 | 0 | 0.00 |
| first-run army, monster tiers 3–5 at 900 dom | 19 | 19 | 0 | 0 | 0 | 0.00 |
| the 4 000-leadership case of 2026-09-15 (Tot | 17 | 17 | 1 | 1 | 0 | 0.00 |
| 2026-09-17 export, its setup (7 000 leadersh | 34 | 34 | 3 | 3 | 1 | 0.00 |
| 2026-09-17 export, 12 000 leadership | 27 | 27 | 3 | 3 | 0 | 0.00 |
| live account of 2026-09-18 (one hired type,  | 16 | 16 | 1 | 1 | 0 | 0.00 |
| live account, evening (hunters 83, legionari | 36 | 36 | 12 | 12 | 7 | 0.00 |
| Aydae alone, 4 975 (one captain, four hired  | 34 | 34 | 12 | 12 | 3 | 0.00 |
| the owner’s live camp of 2026-09-18 (arbales | 23 | 22 | 4 | 4 | 12 | 0.00 |
| his camp of 2026-09-19, the localStorage dum | 21 | 21 | 3 | 3 | 1 | 0.00 |
| his camp of 2026-09-19, as his message reads | 20 | 20 | 2 | 2 | 1 | 0.00 |
| his TotalStack profile of 2026-09-19 (5 225  | 17 | 17 | 7 | 7 | 0 | 0.00 |
| his usual setup of 2026-09-19 (Aydae alone,  | 24 | 24 | 2 | 2 | 0 | 0.00 |

The two widest gaps where (b) rates below (a), per army:

- **the 4 000-leadership case of 2026-09-15 (Tot** — SS troops + sustain hired: (a) -23.49, 4.59M, 16 hired · (b) -29.85, 4.24M, 16 hired
  - raw: swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 10*, arbalester-6 10*, legionary-6 10*, chariot-6 5*
  - (a): swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 8*, arbalester-6 9*, legionary-6 6*, chariot-6 4*; journal swordsman-1 0.06MHP→0×0.03M · spearman-1 0.06MHP→1×0.03M · spearman-2 0.06MHP→1×0.03M · rider-2 0.06MHP→0×0.04M · archer-1 0.06MHP→1×0.03M · rider-3 0.06MHP→1×0.05M · archer-2 0.06MHP→2×0.04M · rider-1 0.05MHP→2×0.03M · arbalester-6* 0.05MHP→2×0.10M · epic-monster-hunter-6* 0.05MHP→2×0.12M · legionary-6* 0.05MHP→3×0.05M · chariot-6* 0.05MHP→3×0.09M
  - (b): swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 9*, arbalester-6 10*, legionary-6 7*, chariot-6 5*; journal swordsman-1 0.06MHP→0×0.03M · spearman-1 0.06MHP→1×0.03M · spearman-2 0.06MHP→1×0.03M · rider-2 0.06MHP→0×0.04M · arbalester-6* 0.06MHP→1×0.12M · chariot-6* 0.06MHP→1×0.11M · archer-1 0.06MHP→2×0.03M · epic-monster-hunter-6* 0.06MHP→2×0.13M · rider-3 0.06MHP→2×0.05M · archer-2 0.06MHP→2×0.04M · legionary-6* 0.06MHP→3×0.06M · rider-1 0.05MHP→3×0.03M
- **2026-09-17 export, its setup (7 000 leadersh** — HS troops + sustain hired: (a) -9.16, 20.66M, 52 hired · (b) -20.23, 18.20M, 52 hired
  - raw: spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 109*, legionary-6 30*
  - (a): spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740, arbalester-6 35*, chariot-6 14*, epic-monster-hunter-6 33*, legionary-6 28*; journal spearman-1 0.35MHP→0×0.18M · spearman-2 0.34MHP→1×0.19M · rider-2 0.34MHP→1×0.21M · rider-1 0.33MHP→1×0.18M · archer-1 0.32MHP→1×0.17M · rider-3 0.32MHP→1×0.22M · archer-2 0.31MHP→1×0.19M · arbalester-6* 0.31MHP→2×0.46M · epic-monster-hunter-6* 0.31MHP→2×0.53M · legionary-6* 0.31MHP→3×0.29M · chariot-6* 0.28MHP→3×0.38M
  - (b): spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740, arbalester-6 37*, chariot-6 14*, epic-monster-hunter-6 35*, legionary-6 30*; journal spearman-1 0.35MHP→0×0.18M · spearman-2 0.34MHP→1×0.19M · rider-2 0.34MHP→0×0.21M · rider-1 0.33MHP→1×0.18M · arbalester-6* 0.33MHP→1×0.49M · legionary-6* 0.33MHP→2×0.31M · epic-monster-hunter-6* 0.33MHP→1×0.56M · archer-1 0.32MHP→2×0.17M · rider-3 0.32MHP→2×0.22M · archer-2 0.31MHP→3×0.19M · chariot-6* 0.28MHP→3×0.38M
- **2026-09-17 export, its setup (7 000 leadersh** — SS troops + sustain hired: (a) -18.16, 15.92M, 44 hired · (b) -24.47, 14.74M, 44 hired
  - raw: spearman-1 975, spearman-2 531, rider-2 285, rider-1 504, archer-1 1,108, rider-3 151, archer-2 592, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 109*, legionary-6 30*
  - (a): spearman-1 975, spearman-2 531, rider-2 285, rider-1 504, archer-1 1,108, rider-3 151, archer-2 592, arbalester-6 28*, chariot-6 12*, epic-monster-hunter-6 26*, legionary-6 22*; journal spearman-1 0.28MHP→0×0.14M · spearman-2 0.28MHP→1×0.15M · rider-2 0.27MHP→1×0.16M · rider-1 0.26MHP→1×0.14M · archer-1 0.26MHP→1×0.14M · rider-3 0.25MHP→2×0.18M · archer-2 0.25MHP→1×0.15M · arbalester-6* 0.25MHP→1×0.37M · epic-monster-hunter-6* 0.24MHP→2×0.42M · legionary-6* 0.24MHP→3×0.23M · chariot-6* 0.24MHP→3×0.33M
  - (b): spearman-1 975, spearman-2 531, rider-2 285, rider-1 504, archer-1 1,108, rider-3 151, archer-2 592, arbalester-6 30*, chariot-6 13*, epic-monster-hunter-6 28*, legionary-6 25*; journal spearman-1 0.28MHP→0×0.14M · spearman-2 0.28MHP→1×0.15M · legionary-6* 0.27MHP→1×0.26M · rider-2 0.27MHP→1×0.16M · arbalester-6* 0.27MHP→1×0.40M · rider-1 0.26MHP→2×0.14M · epic-monster-hunter-6* 0.26MHP→1×0.45M · chariot-6* 0.26MHP→2×0.35M · archer-1 0.26MHP→2×0.14M · rider-3 0.25MHP→3×0.18M · archer-2 0.25MHP→3×0.15M
- **2026-09-17 export, 12 000 leadership** — SS troops + sustain hired: (a) -11.48, 21.16M, 52 hired · (b) -20.85, 18.19M, 52 hired
  - raw: spearman-1 1,216, spearman-2 663, rider-2 356, rider-1 629, archer-1 1,383, rider-3 188, archer-2 739, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 109*, legionary-6 30*
  - (a): spearman-1 1,216, spearman-2 663, rider-2 356, rider-1 629, archer-1 1,383, rider-3 188, archer-2 739, arbalester-6 34*, chariot-6 14*, epic-monster-hunter-6 33*, legionary-6 28*; journal spearman-1 0.35MHP→0×0.18M · spearman-2 0.34MHP→1×0.19M · rider-2 0.34MHP→1×0.21M · rider-1 0.33MHP→1×0.18M · archer-1 0.32MHP→1×0.17M · rider-3 0.32MHP→1×0.22M · archer-2 0.31MHP→1×0.19M · epic-monster-hunter-6* 0.31MHP→2×0.53M · legionary-6* 0.31MHP→2×0.29M · arbalester-6* 0.30MHP→3×0.45M · chariot-6* 0.28MHP→3×0.38M
  - (b): spearman-1 1,216, spearman-2 663, rider-2 356, rider-1 629, archer-1 1,383, rider-3 188, archer-2 739, arbalester-6 37*, chariot-6 14*, epic-monster-hunter-6 35*, legionary-6 30*; journal spearman-1 0.35MHP→0×0.18M · spearman-2 0.34MHP→1×0.19M · rider-2 0.34MHP→0×0.21M · rider-1 0.33MHP→1×0.18M · arbalester-6* 0.33MHP→1×0.49M · legionary-6* 0.33MHP→2×0.31M · epic-monster-hunter-6* 0.33MHP→1×0.56M · archer-1 0.32MHP→2×0.17M · rider-3 0.32MHP→2×0.22M · archer-2 0.31MHP→3×0.19M · chariot-6* 0.28MHP→3×0.38M
- **2026-09-17 export, 12 000 leadership** — HS troops + sustain hired: (a) -0.42, 29.55M, 60 hired · (b) -7.91, 27.41M, 64 hired
  - raw: spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 109*, legionary-6 30*
  - (a): spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 58*, legionary-6 30*; journal spearman-1 0.62MHP→0×0.32M · spearman-2 0.61MHP→1×0.33M · rider-2 0.59MHP→1×0.36M · rider-1 0.58MHP→1×0.32M · archer-1 0.57MHP→1×0.31M · rider-3 0.56MHP→2×0.39M · archer-2 0.55MHP→1×0.33M · epic-monster-hunter-6* 0.54MHP→2×0.93M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M
  - (b): spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303, arbalester-6 38*, chariot-6 14*, epic-monster-hunter-6 62*, legionary-6 30*; journal spearman-1 0.62MHP→0×0.32M · spearman-2 0.61MHP→1×0.33M · rider-2 0.59MHP→1×0.36M · rider-1 0.58MHP→1×0.32M · epic-monster-hunter-6* 0.58MHP→1×1.00M · archer-1 0.57MHP→1×0.31M · rider-3 0.56MHP→2×0.39M · archer-2 0.55MHP→2×0.33M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M
- **live account of 2026-09-18 (one hired type, ** — SS troops + sustain hired: (a) -21.68, 15.94M, 20 hired · (b) -35.09, 13.03M, 24 hired
  - raw: archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 62*
  - (a): archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 49*; journal archer-1 0.54MHP→0×0.29M · rider-1 0.53MHP→1×0.29M · spearman-2 0.52MHP→1×0.28M · spearman-1 0.51MHP→1×0.26M · archer-2 0.50MHP→1×0.30M · rider-3 0.49MHP→2×0.34M · rider-2 0.48MHP→2×0.29M · epic-monster-hunter-6* 0.47MHP→2×0.79M
  - (b): archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 53*; journal archer-1 0.54MHP→0×0.29M · rider-1 0.53MHP→1×0.29M · spearman-2 0.52MHP→1×0.28M · spearman-1 0.51MHP→1×0.26M · epic-monster-hunter-6* 0.51MHP→1×0.86M · archer-2 0.50MHP→1×0.30M · rider-3 0.49MHP→2×0.34M · rider-2 0.48MHP→2×0.29M
- **live account, evening (hunters 83, legionari** — SW troops + sustain hired: (a) -4.58, 31.37M, 68 hired · (b) -19.56, 27.29M, 76 hired
  - raw: archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 62*, legionary-6 2,180*
  - (a): archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 59*, legionary-6 49*; journal archer-1 0.64MHP→0×0.34M · rider-1 0.63MHP→1×0.35M · spearman-2 0.62MHP→1×0.34M · spearman-1 0.60MHP→1×0.31M · archer-2 0.59MHP→1×0.36M · rider-3 0.58MHP→2×0.40M · rider-2 0.57MHP→1×0.35M · epic-monster-hunter-6* 0.57MHP→2×0.95M · legionary-6* 0.56MHP→2×0.53M · arbalester-6* 0.41MHP→3×0.60M · chariot-6* 0.16MHP→3×0.20M
  - (b): archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 62*, legionary-6 55*; journal archer-1 0.64MHP→0×0.34M · legionary-6* 0.63MHP→1×0.59M · rider-1 0.63MHP→1×0.35M · spearman-2 0.62MHP→1×0.34M · spearman-1 0.60MHP→1×0.31M · epic-monster-hunter-6* 0.60MHP→1×1.00M · archer-2 0.59MHP→1×0.36M · rider-3 0.58MHP→2×0.40M · rider-2 0.57MHP→2×0.35M · arbalester-6* 0.41MHP→3×0.60M · chariot-6* 0.16MHP→3×0.20M
- **live account, evening (hunters 83, legionari** — SS troops + sustain hired: (a) -15.46, 21.60M, 52 hired · (b) -29.61, 17.52M, 56 hired
  - raw: archer-1 1,680, rider-1 672, spearman-2 713, spearman-1 1,258, archer-2 862, rider-3 194, rider-2 338, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 62*, legionary-6 2,180*
  - (a): archer-1 1,680, rider-1 672, spearman-2 713, spearman-1 1,258, archer-2 862, rider-3 194, rider-2 338, arbalester-6 39*, chariot-6 7*, epic-monster-hunter-6 37*, legionary-6 31*; journal archer-1 0.40MHP→0×0.21M · rider-1 0.40MHP→1×0.22M · spearman-2 0.39MHP→1×0.21M · spearman-1 0.38MHP→1×0.19M · archer-2 0.37MHP→1×0.22M · rider-3 0.37MHP→2×0.25M · rider-2 0.36MHP→1×0.22M · epic-monster-hunter-6* 0.36MHP→2×0.60M · arbalester-6* 0.36MHP→2×0.52M · legionary-6* 0.36MHP→3×0.33M · chariot-6* 0.16MHP→3×0.20M
  - (b): archer-1 1,680, rider-1 672, spearman-2 713, spearman-1 1,258, archer-2 862, rider-3 194, rider-2 338, arbalester-6 42*, chariot-6 7*, epic-monster-hunter-6 40*, legionary-6 35*; journal archer-1 0.40MHP→0×0.21M · legionary-6* 0.40MHP→1×0.38M · rider-1 0.40MHP→1×0.22M · spearman-2 0.39MHP→1×0.21M · epic-monster-hunter-6* 0.38MHP→1×0.65M · arbalester-6* 0.38MHP→1×0.56M · spearman-1 0.38MHP→2×0.19M · archer-2 0.37MHP→1×0.22M · rider-3 0.37MHP→2×0.25M · rider-2 0.36MHP→3×0.22M · chariot-6* 0.16MHP→3×0.20M
- **Aydae alone, 4 975 (one captain, four hired ** — HS troops + sustain hired: (a) -2.83, 9.93M, 28 hired · (b) -13.38, 8.08M, 28 hired
  - raw: swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, arbalester-6 45*, chariot-6 7*, epic-monster-hunter-6 62*, legionary-6 2,180*
  - (a): swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, arbalester-6 13*, chariot-6 6*, epic-monster-hunter-6 12*, legionary-6 13*; journal swordsman-1 0.14MHP→0×0.05M · spearman-2 0.14MHP→1×0.07M · archer-1 0.13MHP→1×0.07M · rider-1 0.13MHP→1×0.07M · spearman-1 0.13MHP→1×0.06M · rider-3 0.12MHP→2×0.09M · archer-2 0.12MHP→2×0.07M · rider-2 0.12MHP→2×0.07M · arbalester-6* 0.12MHP→2×0.17M · legionary-6* 0.12MHP→3×0.12M · epic-monster-hunter-6* 0.12MHP→3×0.19M · chariot-6* 0.11MHP→3×0.16M
  - (b): swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, arbalester-6 15*, chariot-6 7*, epic-monster-hunter-6 14*, legionary-6 15*; journal swordsman-1 0.14MHP→0×0.05M · arbalester-6* 0.14MHP→1×0.20M · legionary-6* 0.14MHP→1×0.14M · spearman-2 0.14MHP→0×0.07M · epic-monster-hunter-6* 0.13MHP→1×0.23M · archer-1 0.13MHP→2×0.07M · rider-1 0.13MHP→2×0.07M · chariot-6* 0.13MHP→2×0.18M · spearman-1 0.13MHP→2×0.06M · rider-3 0.12MHP→3×0.09M · archer-2 0.12MHP→3×0.07M · rider-2 0.12MHP→3×0.07M
- **Aydae alone, 4 975 (one captain, four hired ** — Elite 40 %: (a) 6.34, 12.54M, 28 hired · (b) -2.58, 10.89M, 28 hired
  - raw: swordsman-1 1,199, archer-1 762, spearman-1 761, rider-1 380, archer-2 421, spearman-2 420, rider-2 209, rider-3 117, legionary-6 872*, epic-monster-hunter-6 24*, arbalester-6 18*, chariot-6 2*
  - (a): swordsman-1 1,199, archer-1 762, spearman-1 761, rider-1 380, archer-2 421, spearman-2 420, rider-2 209, rider-3 117, legionary-6 19*, epic-monster-hunter-6 18*, arbalester-6 18*, chariot-6 2*; journal swordsman-1 0.18MHP→0×0.07M · archer-1 0.18MHP→1×0.10M · spearman-1 0.18MHP→1×0.09M · rider-1 0.18MHP→1×0.10M · archer-2 0.18MHP→1×0.11M · spearman-2 0.18MHP→2×0.09M · rider-2 0.18MHP→2×0.11M · rider-3 0.18MHP→2×0.13M · legionary-6* 0.17MHP→2×0.17M · epic-monster-hunter-6* 0.17MHP→3×0.29M · arbalester-6* 0.16MHP→3×0.24M · chariot-6* 0.04MHP→3×0.05M
  - (b): swordsman-1 1,199, archer-1 762, spearman-1 761, rider-1 380, archer-2 421, spearman-2 420, rider-2 209, rider-3 117, legionary-6 20*, epic-monster-hunter-6 19*, arbalester-6 18*, chariot-6 2*; journal swordsman-1 0.18MHP→0×0.07M · archer-1 0.18MHP→0×0.10M · epic-monster-hunter-6* 0.18MHP→1×0.31M · spearman-1 0.18MHP→1×0.09M · rider-1 0.18MHP→1×0.10M · legionary-6* 0.18MHP→2×0.18M · archer-2 0.18MHP→2×0.11M · spearman-2 0.18MHP→2×0.09M · rider-2 0.18MHP→2×0.11M · rider-3 0.18MHP→3×0.13M · arbalester-6* 0.16MHP→3×0.24M · chariot-6* 0.04MHP→3×0.05M
- **the owner’s live camp of 2026-09-18 (arbales** — SW troops + sustain hired: (a) -12.29, 17.44M, 60 hired · (b) -20.71, 14.90M, 64 hired
  - raw: archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370, arbalester-6 371*, bear-5 103*, legionary-6 770*
  - (a): archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370, arbalester-6 76*, legionary-6 60*, bear-5 7*; journal archer-2 0.70MHP→0×0.42M · spearman-2 0.70MHP→1×0.38M · rider-2 0.70MHP→1×0.43M · rider-3 0.70MHP→1×0.48M · arbalester-6* 0.69MHP→1×1.01M · legionary-6* 0.69MHP→2×0.64M · bear-5* 0.66MHP→2×0.39M
  - (b): archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370, arbalester-6 76*, bear-5 7*, legionary-6 61*; journal archer-2 0.70MHP→0×0.42M · spearman-2 0.70MHP→1×0.38M · legionary-6* 0.70MHP→1×0.65M · rider-2 0.70MHP→1×0.43M · rider-3 0.70MHP→1×0.48M · arbalester-6* 0.69MHP→1×1.01M · bear-5* 0.66MHP→2×0.39M
- **the owner’s live camp of 2026-09-18 (arbales** — HS troops + sustain hired: (a) -20.38, 10.40M, 24 hired · (b) -27.03, 8.45M, 28 hired
  - raw: archer-1 1,107, rider-1 443, spearman-2 470, spearman-1 829, archer-2 568, rider-3 127, rider-2 223, arbalester-6 371*, bear-5 103*, legionary-6 770*
  - (a): archer-1 1,107, rider-1 443, spearman-2 470, spearman-1 829, archer-2 568, rider-3 127, rider-2 223, arbalester-6 25*, bear-5 2*, legionary-6 20*; journal archer-1 0.27MHP→0×0.14M · rider-1 0.26MHP→1×0.14M · spearman-2 0.26MHP→1×0.14M · spearman-1 0.25MHP→1×0.13M · archer-2 0.25MHP→1×0.15M · rider-3 0.24MHP→2×0.16M · rider-2 0.24MHP→2×0.14M · legionary-6* 0.23MHP→2×0.21M · arbalester-6* 0.23MHP→2×0.33M · bear-5* 0.19MHP→3×0.11M
  - (b): archer-1 1,107, rider-1 443, spearman-2 470, spearman-1 829, archer-2 568, rider-3 127, rider-2 223, arbalester-6 27*, bear-5 2*, legionary-6 23*; journal archer-1 0.27MHP→0×0.14M · legionary-6* 0.26MHP→1×0.25M · rider-1 0.26MHP→1×0.14M · spearman-2 0.26MHP→1×0.14M · spearman-1 0.25MHP→1×0.13M · arbalester-6* 0.25MHP→1×0.36M · archer-2 0.25MHP→1×0.15M · rider-3 0.24MHP→2×0.16M · rider-2 0.24MHP→2×0.14M · bear-5* 0.19MHP→3×0.11M
- **his camp of 2026-09-19, the localStorage dum** — SW troops + sustain hired: (a) -12.26, 10.71M, 20 hired · (b) -20.28, 8.83M, 20 hired
  - raw: spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057, epic-monster-hunter-6 345*
  - (a): spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057, epic-monster-hunter-6 47*; journal spearman-2 0.49MHP→0×0.27M · rider-3 0.48MHP→1×0.33M · rider-2 0.48MHP→1×0.29M · rider-1 0.47MHP→1×0.26M · archer-2 0.46MHP→1×0.27M · epic-monster-hunter-6* 0.45MHP→2×0.76M
  - (b): spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057, epic-monster-hunter-6 48*; journal spearman-2 0.49MHP→0×0.27M · rider-3 0.48MHP→1×0.33M · rider-2 0.48MHP→1×0.29M · rider-1 0.47MHP→1×0.26M · epic-monster-hunter-6* 0.46MHP→1×0.78M · archer-2 0.46MHP→2×0.27M
- **his camp of 2026-09-19, the localStorage dum** — HS troops + sustain hired: (a) -16.89, 8.50M, 12 hired · (b) -23.60, 6.95M, 12 hired
  - raw: archer-1 1,208, spearman-2 523, spearman-1 923, rider-1 464, archer-2 620, rider-3 139, rider-2 243, epic-monster-hunter-6 345*
  - (a): archer-1 1,208, spearman-2 523, spearman-1 923, rider-1 464, archer-2 620, rider-3 139, rider-2 243, epic-monster-hunter-6 26*; journal archer-1 0.29MHP→0×0.15M · spearman-2 0.28MHP→1×0.15M · spearman-1 0.28MHP→1×0.14M · rider-1 0.27MHP→1×0.15M · archer-2 0.27MHP→1×0.16M · rider-3 0.26MHP→2×0.18M · rider-2 0.26MHP→2×0.16M · epic-monster-hunter-6* 0.25MHP→2×0.42M
  - (b): archer-1 1,208, spearman-2 523, spearman-1 923, rider-1 464, archer-2 620, rider-3 139, rider-2 243, epic-monster-hunter-6 28*; journal archer-1 0.29MHP→0×0.15M · spearman-2 0.28MHP→1×0.15M · spearman-1 0.28MHP→1×0.14M · rider-1 0.27MHP→1×0.15M · epic-monster-hunter-6* 0.27MHP→1×0.45M · archer-2 0.27MHP→1×0.16M · rider-3 0.26MHP→2×0.18M · rider-2 0.26MHP→2×0.16M
- **his camp of 2026-09-19, as his message reads** — HS troops + sustain hired: (a) 9.97, 8.90M, 16 hired · (b) -7.57, 6.90M, 16 hired
  - raw: spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 90*
  - (a): spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 32*; journal spearman-1 0.35MHP→0×0.18M · rider-2 0.34MHP→1×0.21M · rider-1 0.33MHP→1×0.18M · spearman-2 0.33MHP→1×0.18M · archer-2 0.32MHP→1×0.19M · rider-3 0.31MHP→2×0.22M · epic-monster-hunter-6* 0.31MHP→2×0.52M
  - (b): spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 33*; journal spearman-1 0.35MHP→0×0.18M · rider-2 0.34MHP→1×0.21M · rider-1 0.33MHP→1×0.18M · spearman-2 0.33MHP→1×0.18M · archer-2 0.32MHP→1×0.19M · epic-monster-hunter-6* 0.32MHP→1×0.53M · rider-3 0.31MHP→2×0.22M
- **his camp of 2026-09-19, as his message reads** — SS troops + sustain hired: (a) 5.86, 7.91M, 12 hired · (b) -6.87, 6.48M, 12 hired
  - raw: archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 90*
  - (a): archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 24*; journal archer-1 0.27MHP→0×0.14M · spearman-2 0.27MHP→1×0.14M · spearman-1 0.26MHP→1×0.13M · rider-1 0.26MHP→1×0.14M · archer-2 0.25MHP→1×0.15M · rider-3 0.24MHP→2×0.17M · rider-2 0.24MHP→2×0.15M · epic-monster-hunter-6* 0.23MHP→2×0.39M
  - (b): archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 26*; journal archer-1 0.27MHP→0×0.14M · spearman-2 0.27MHP→1×0.14M · spearman-1 0.26MHP→1×0.13M · rider-1 0.26MHP→1×0.14M · epic-monster-hunter-6* 0.25MHP→1×0.42M · archer-2 0.25MHP→1×0.15M · rider-3 0.24MHP→2×0.17M · rider-2 0.24MHP→2×0.15M
- **his TotalStack profile of 2026-09-19 (5 225 ** — SW troops + sustain hired: (a) 6.72, 8.42M, 20 hired · (b) -6.53, 7.33M, 20 hired
  - raw: spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*, epic-monster-hunter-5 60*
  - (a): spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163, epic-monster-hunter-5 49*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*; journal spearman-1 0.26MHP→0×0.11M · spearman-2 0.26MHP→1×0.12M · rider-2 0.26MHP→1×0.14M · archer-1 0.26MHP→1×0.12M · rider-1 0.26MHP→1×0.12M · archer-2 0.26MHP→2×0.14M · rider-3 0.26MHP→2×0.16M · epic-monster-hunter-5* 0.25MHP→2×0.28M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M
  - (b): spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*, epic-monster-hunter-5 50*; journal spearman-1 0.26MHP→0×0.11M · spearman-2 0.26MHP→1×0.12M · rider-2 0.26MHP→1×0.14M · archer-1 0.26MHP→0×0.12M · epic-monster-hunter-5* 0.26MHP→1×0.28M · rider-1 0.26MHP→2×0.12M · archer-2 0.26MHP→2×0.14M · rider-3 0.26MHP→2×0.16M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M
- **his TotalStack profile of 2026-09-19 (5 225 ** — Elite 70 %: (a) 7.06, 7.67M, 16 hired · (b) -1.78, 6.96M, 16 hired
  - raw: swordsman-1 1,265, archer-1 798, spearman-1 797, rider-1 398, archer-2 442, spearman-2 441, rider-2 220, rider-3 123, epic-monster-hunter-5 42*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*
  - (a): swordsman-1 1,265, archer-1 798, spearman-1 797, rider-1 398, archer-2 442, spearman-2 441, rider-2 220, rider-3 123, epic-monster-hunter-5 37*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*; journal swordsman-1 0.20MHP→0×0.08M · archer-1 0.20MHP→1×0.09M · spearman-1 0.20MHP→1×0.08M · rider-1 0.19MHP→1×0.09M · archer-2 0.19MHP→1×0.11M · spearman-2 0.19MHP→2×0.09M · rider-2 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.12M · epic-monster-hunter-5* 0.19MHP→2×0.21M · water-elemental* 0.06MHP→3×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M
  - (b): swordsman-1 1,265, archer-1 798, spearman-1 797, rider-1 398, archer-2 442, spearman-2 441, rider-2 220, rider-3 123, epic-monster-hunter-5 38*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*; journal swordsman-1 0.20MHP→0×0.08M · archer-1 0.20MHP→1×0.09M · spearman-1 0.20MHP→0×0.08M · epic-monster-hunter-5* 0.20MHP→1×0.21M · rider-1 0.19MHP→1×0.09M · archer-2 0.19MHP→2×0.11M · spearman-2 0.19MHP→2×0.09M · rider-2 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.12M · water-elemental* 0.06MHP→3×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M
- **his usual setup of 2026-09-19 (Aydae alone, ** — TS re-capped (Elite Preservation): (a) 2.82, 11.35M, 12 hired · (b) -10.85, 9.84M, 12 hired
  - raw: archer-1 1,047, spearman-1 1,047, rider-1 523, archer-2 579, spearman-2 579, rider-2 289, rider-3 162, stone-gargoyle 6*, emerald-dragon 7*, battle-boar 8*, water-elemental 18*, epic-monster-hunter-6 69*
  - (a): archer-1 1,047, spearman-1 1,047, rider-1 523, archer-2 579, spearman-2 579, rider-2 289, rider-3 162, stone-gargoyle 6*, emerald-dragon 7*, battle-boar 8*, water-elemental 18*, epic-monster-hunter-6 25*; journal archer-1 0.25MHP→0×0.13M · spearman-1 0.25MHP→1×0.12M · rider-1 0.25MHP→1×0.13M · archer-2 0.25MHP→1×0.15M · spearman-2 0.25MHP→1×0.13M · rider-2 0.25MHP→2×0.15M · rider-3 0.25MHP→2×0.17M · epic-monster-hunter-6* 0.24MHP→2×0.40M · water-elemental* 0.10MHP→2×0.08M · battle-boar* 0.10MHP→2×0.08M · emerald-dragon* 0.09MHP→3×0.09M · stone-gargoyle* 0.09MHP→3×0.09M
  - (b): archer-1 1,047, spearman-1 1,047, rider-1 523, archer-2 579, spearman-2 579, rider-2 289, rider-3 162, stone-gargoyle 6*, emerald-dragon 7*, battle-boar 8*, water-elemental 18*, epic-monster-hunter-6 26*; journal archer-1 0.25MHP→0×0.13M · spearman-1 0.25MHP→0×0.12M · rider-1 0.25MHP→1×0.13M · epic-monster-hunter-6* 0.25MHP→1×0.42M · archer-2 0.25MHP→1×0.15M · spearman-2 0.25MHP→2×0.13M · rider-2 0.25MHP→2×0.15M · rider-3 0.25MHP→2×0.17M · water-elemental* 0.10MHP→2×0.08M · battle-boar* 0.10MHP→2×0.08M · emerald-dragon* 0.09MHP→3×0.09M · stone-gargoyle* 0.09MHP→3×0.09M
- **his usual setup of 2026-09-19 (Aydae alone, ** — HS troops + sustain hired: (a) -4.35, 7.65M, 8 hired · (b) -11.76, 6.96M, 8 hired
  - raw: swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, archer-2 289, rider-2 141, rider-3 78, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10*, epic-monster-hunter-6 69*
  - (a): swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, archer-2 289, rider-2 141, rider-3 78, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10*, epic-monster-hunter-6 12*; journal swordsman-1 0.14MHP→0×0.05M · spearman-2 0.14MHP→1×0.07M · archer-1 0.13MHP→1×0.07M · rider-1 0.13MHP→1×0.07M · spearman-1 0.13MHP→1×0.06M · archer-2 0.12MHP→2×0.08M · rider-2 0.12MHP→2×0.07M · rider-3 0.12MHP→2×0.08M · epic-monster-hunter-6* 0.12MHP→2×0.19M · battle-boar* 0.08MHP→3×0.07M · emerald-dragon* 0.08MHP→3×0.08M · stone-gargoyle* 0.08MHP→3×0.07M · water-elemental* 0.06MHP→3×0.05M
  - (b): swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, archer-2 289, rider-2 141, rider-3 78, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10*, epic-monster-hunter-6 14*; journal swordsman-1 0.14MHP→0×0.05M · spearman-2 0.14MHP→0×0.07M · epic-monster-hunter-6* 0.13MHP→1×0.23M · archer-1 0.13MHP→1×0.07M · rider-1 0.13MHP→1×0.07M · spearman-1 0.13MHP→2×0.06M · archer-2 0.12MHP→2×0.08M · rider-2 0.12MHP→2×0.07M · rider-3 0.12MHP→2×0.08M · battle-boar* 0.08MHP→3×0.07M · emerald-dragon* 0.08MHP→3×0.08M · stone-gargoyle* 0.08MHP→3×0.07M · water-elemental* 0.06MHP→3×0.05M

## D. The TotalStack rows 162 kept

| army | TS row | TS dmg | kept in 162 | (a) beats it | (b) beats it | (c) beats it | rate(row, best) a / b / c |
|---|---|---:|---|---|---|---|---:|
| first-run army, Bear V ×1 (20 000 leadership | Total Optimization | 18.22M | **kept** | — | — | — | — / — / — |
| first-run army, Bear V ×1 (20 000 leadership | Elite Preservation | 18.22M | **kept** | — | — | — | — / — / — |
| first-run army, Bear V ×2 (20 000 leadership | Total Optimization | 18.44M | **kept** | — | — | — | — / — / — |
| first-run army, Bear V ×2 (20 000 leadership | Elite Preservation | 18.44M | **kept** | — | — | — | — / — / — |
| the owner’s live camp of 2026-09-18 (arbales | M’s Preservation | 35.41M | **kept** | yes | yes | yes | 8.69 / 8.69 / 32.17 |
| the owner’s live camp of 2026-09-18 (arbales | Total Optimization | 49.23M | **kept** | **no** | **no** | yes | -21.51 / -21.51 / -8.49 |
| the owner’s live camp of 2026-09-18 (arbales | Elite Preservation | 49.23M | **kept** | **no** | **no** | yes | -21.51 / -21.51 / -8.49 |

## E. Per army, in full

### first-run army, Bear V ×1 (20 000 leadership

- **sustain**: bear-5 0 · raw candidates 0 · stops: SW 18.19M/1 hired
- **top SW** first march: swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468, bear-5 1*; journal swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · spearman-1 0.46MHP→1×0.21M · rider-1 0.45MHP→1×0.25M · archer-2 0.45MHP→1×0.30M · spearman-2 0.45MHP→2×0.24M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→2×0.38M · spearman-3 0.45MHP→2×0.28M · rider-3 0.45MHP→3×0.37M · bear-5* 0.07MHP→3×0.04M

### first-run army, Bear V ×2 (20 000 leadership

- **sustain**: bear-5 0 · raw candidates 0 · stops: SW 18.41M/2 hired
- **top SW** first march: swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468, bear-5 2*; journal swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · spearman-1 0.46MHP→1×0.21M · rider-1 0.45MHP→1×0.25M · archer-2 0.45MHP→1×0.30M · spearman-2 0.45MHP→2×0.24M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→2×0.38M · spearman-3 0.45MHP→2×0.28M · rider-3 0.45MHP→3×0.37M · bear-5* 0.13MHP→3×0.07M

### first-run army, Bear V ×3 (20 000 leadership

- **sustain**: bear-5 0 · raw candidates 0 · stops: SW 18.41M/3 hired · AI 19.04M/3 hired
- **top AI** first march: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 3*; journal swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-2 0.45MHP→1×0.24M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · bear-5* 0.20MHP→3×0.11M

### first-run army, Bear V ×10 (20 000 leadershi

- **sustain**: bear-5 7 · raw candidates 13 · stops: SW 20.77M/4 hired · AI 21.29M/4 hired
- **top AI** first march: spearman-2 3,097, spearman-3 1,739, archer-2 3,084, rider-2 1,539, archer-1 5,530, rider-3 863, archer-3 1,722, bear-5 10*; journal spearman-2 0.84MHP→0×0.44M · spearman-3 0.83MHP→1×0.52M · archer-2 0.83MHP→1×0.56M · rider-2 0.83MHP→1×0.55M · archer-1 0.83MHP→1×0.46M · rider-3 0.83MHP→2×0.68M · archer-3 0.83MHP→2×0.69M · bear-5* 0.66MHP→2×0.37M
- **(a) under the lowest troop stack** — Elite 20 % → retyped: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 1*
  - dmg 18,816,100 · silver 32,525,600 · hired 4 · gold 0 · coins 0 · queue 2,524 h · dmg/silver 0.579 · dmg/hired 112,200 · dmg/gold — · dmg/coin —
  - rating vs every stop: SW 10.59 · AI 10.97
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-2 0.45MHP→1×0.24M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · bear-5* 0.07MHP→3×0.04M
- **(b) journal: never wiped before striking** — Elite 20 % → retyped: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 1*
  - dmg 18,816,100 · silver 32,525,600 · hired 4 · gold 0 · coins 0 · queue 2,524 h · dmg/silver 0.579 · dmg/hired 112,200 · dmg/gold — · dmg/coin —
  - rating vs every stop: SW 10.59 · AI 10.97
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-2 0.45MHP→1×0.24M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · bear-5* 0.07MHP→3×0.04M
- **(c) none** — Elite 20 % → retyped: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, bear-5 1*
  - dmg 18,816,100 · silver 32,525,600 · hired 4 · gold 0 · coins 0 · queue 2,524 h · dmg/silver 0.579 · dmg/hired 112,200 · dmg/gold — · dmg/coin —
  - rating vs every stop: SW 10.59 · AI 10.97
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-2 0.45MHP→1×0.24M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · bear-5* 0.07MHP→3×0.04M

### first-run army, Epic Monster Hunter VI ×83 (

- **sustain**: epic-monster-hunter-6 62 · raw candidates 18 · stops: HS 22.52M/11 hired · SW 28.95M/25 hired · MX 29.98M/28 hired · AI 30.14M/30 hired
- **top AI** first march: spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982, epic-monster-hunter-6 83*; journal spearman-1 0.54MHP→0×0.25M · spearman-3 0.54MHP→1×0.34M · archer-1 0.54MHP→1×0.30M · spearman-2 0.54MHP→1×0.28M · rider-1 0.53MHP→1×0.29M · rider-3 0.53MHP→2×0.44M · archer-3 0.53MHP→2×0.44M · archer-2 0.53MHP→2×0.36M · rider-2 0.53MHP→2×0.35M · epic-monster-hunter-6* 0.51MHP→3×1.19M
- **(a) under the lowest troop stack** — SW re-sheltered → retyped: swordsman-1 3,048, archer-1 3,042, spearman-2 1,687, rider-1 1,516, spearman-1 3,024, rider-3 472, rider-2 838, archer-2 1,670, spearman-3 939, archer-3 936, epic-monster-hunter-6 60*
  - dmg 28,734,620 · silver 32,534,400 · hired 24 · gold 1,728 · coins 0 · queue 2,525 h · dmg/silver 0.883 · dmg/hired 431,781 · dmg/gold 16,629 · dmg/coin —
  - rating vs every stop: HS -23.03 · SW 0.43 · MX 0.76 · AI 2.83
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · spearman-2 0.46MHP→1×0.24M · rider-1 0.45MHP→1×0.25M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · rider-2 0.45MHP→2×0.30M · archer-2 0.45MHP→2×0.30M · spearman-3 0.45MHP→2×0.28M · archer-3 0.45MHP→3×0.38M · epic-monster-hunter-6* 0.37MHP→3×0.86M
- **(b) journal: never wiped before striking** — SW re-sheltered → retyped: swordsman-1 3,048, archer-1 3,042, spearman-2 1,687, rider-1 1,516, spearman-1 3,024, rider-3 472, rider-2 838, archer-2 1,670, spearman-3 939, archer-3 936, epic-monster-hunter-6 60*
  - dmg 28,734,620 · silver 32,534,400 · hired 24 · gold 1,728 · coins 0 · queue 2,525 h · dmg/silver 0.883 · dmg/hired 431,781 · dmg/gold 16,629 · dmg/coin —
  - rating vs every stop: HS -23.03 · SW 0.43 · MX 0.76 · AI 2.83
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · spearman-2 0.46MHP→1×0.24M · rider-1 0.45MHP→1×0.25M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · rider-2 0.45MHP→2×0.30M · archer-2 0.45MHP→2×0.30M · spearman-3 0.45MHP→2×0.28M · archer-3 0.45MHP→3×0.38M · epic-monster-hunter-6* 0.37MHP→3×0.86M
- **(c) none** — SW re-sheltered → retyped: swordsman-1 3,048, archer-1 3,042, spearman-2 1,687, rider-1 1,516, spearman-1 3,024, rider-3 472, rider-2 838, archer-2 1,670, spearman-3 939, archer-3 936, epic-monster-hunter-6 60*
  - dmg 28,734,620 · silver 32,534,400 · hired 24 · gold 1,728 · coins 0 · queue 2,525 h · dmg/silver 0.883 · dmg/hired 431,781 · dmg/gold 16,629 · dmg/coin —
  - rating vs every stop: HS -23.03 · SW 0.43 · MX 0.76 · AI 2.83
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · spearman-2 0.46MHP→1×0.24M · rider-1 0.45MHP→1×0.25M · spearman-1 0.45MHP→1×0.21M · rider-3 0.45MHP→2×0.37M · rider-2 0.45MHP→2×0.30M · archer-2 0.45MHP→2×0.30M · spearman-3 0.45MHP→2×0.28M · archer-3 0.45MHP→3×0.38M · epic-monster-hunter-6* 0.37MHP→3×0.86M

### first-run army, monster tiers 3–5 at 900 dom

- **sustain**: bear-5 3, epic-monster-hunter-6 62 · raw candidates 19 · stops: HS 81.26M/15 hired · SW 89.49M/24 hired · MM 93.59M/26 hired · MX 97.76M/32 hired · AI 103.20M/34 hired
- **top AI** first march: swordsman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982, flaming-centaur 4*, ice-phoenix 10*, many-armed-guardian 13*, epic-monster-hunter-6 83*, gorgon-medusa 14*, desert-vanquisher 4*, magic-dragon 11*, ettin 3*, fearsome-manticore 3*, bear-5 6*; journal swordsman-1 0.54MHP→0×0.22M · spearman-3 0.54MHP→1×0.34M · archer-1 0.54MHP→1×0.30M · rider-1 0.54MHP→1×0.29M · spearman-2 0.53MHP→1×0.28M · rider-3 0.53MHP→2×0.44M · archer-3 0.53MHP→2×0.44M · archer-2 0.53MHP→2×0.36M · rider-2 0.53MHP→2×0.35M · flaming-centaur* 0.53MHP→3×0.91M · ice-phoenix* 0.51MHP→3×0.55M · many-armed-guardian* 0.51MHP→3×0.36M · epic-monster-hunter-6* 0.51MHP→3×1.19M · gorgon-medusa* 0.50MHP→4×0.63M · desert-vanquisher* 0.50MHP→4×0.59M · magic-dragon* 0.49MHP→4×0.52M · ettin* 0.43MHP→4×0.62M · fearsome-manticore* 0.41MHP→5×0.49M · bear-5* 0.40MHP→5×0.22M
- **(a) under the lowest troop stack** — MM re-sheltered: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, fearsome-manticore 3*, ice-phoenix 8*, stone-gargoyle 26*, magic-dragon 9*, gorgon-medusa 11*, flaming-centaur 3*, many-armed-guardian 10*, desert-vanquisher 3*, epic-monster-hunter-6 48*, ettin 2*, bear-5 3*
  - dmg 97,533,600 · silver 35,156,800 · hired 24 · gold 12,192 · coins 27,040 · queue 2,900 h · dmg/silver 2.774 · dmg/hired 669,208 · dmg/gold 8,000 · dmg/coin 3,607
  - rating vs every stop: HS 4.32 · SW 3.68 · MM 2.58 · MX 9.09 · AI 8.31
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-1 0.45MHP→1×0.21M · spearman-2 0.45MHP→1×0.24M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · fearsome-manticore* 0.41MHP→3×0.49M · ice-phoenix* 0.41MHP→3×0.44M · stone-gargoyle* 0.41MHP→3×0.39M · magic-dragon* 0.41MHP→4×0.43M · gorgon-medusa* 0.40MHP→4×0.50M · flaming-centaur* 0.40MHP→4×0.68M · many-armed-guardian* 0.39MHP→4×0.28M · desert-vanquisher* 0.38MHP→5×0.44M · epic-monster-hunter-6* 0.29MHP→5×0.69M · ettin* 0.29MHP→5×0.42M · bear-5* 0.20MHP→5×0.11M
- **(b) journal: never wiped before striking** — MM re-sheltered: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, fearsome-manticore 3*, ice-phoenix 8*, stone-gargoyle 26*, magic-dragon 9*, gorgon-medusa 11*, flaming-centaur 3*, many-armed-guardian 10*, desert-vanquisher 3*, epic-monster-hunter-6 48*, ettin 2*, bear-5 3*
  - dmg 97,533,600 · silver 35,156,800 · hired 24 · gold 12,192 · coins 27,040 · queue 2,900 h · dmg/silver 2.774 · dmg/hired 669,208 · dmg/gold 8,000 · dmg/coin 3,607
  - rating vs every stop: HS 4.32 · SW 3.68 · MM 2.58 · MX 9.09 · AI 8.31
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-1 0.45MHP→1×0.21M · spearman-2 0.45MHP→1×0.24M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · fearsome-manticore* 0.41MHP→3×0.49M · ice-phoenix* 0.41MHP→3×0.44M · stone-gargoyle* 0.41MHP→3×0.39M · magic-dragon* 0.41MHP→4×0.43M · gorgon-medusa* 0.40MHP→4×0.50M · flaming-centaur* 0.40MHP→4×0.68M · many-armed-guardian* 0.39MHP→4×0.28M · desert-vanquisher* 0.38MHP→5×0.44M · epic-monster-hunter-6* 0.29MHP→5×0.69M · ettin* 0.29MHP→5×0.42M · bear-5* 0.20MHP→5×0.11M
- **(c) none** — MM re-sheltered: swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936, fearsome-manticore 3*, ice-phoenix 8*, stone-gargoyle 26*, magic-dragon 9*, gorgon-medusa 11*, flaming-centaur 3*, many-armed-guardian 10*, desert-vanquisher 3*, epic-monster-hunter-6 48*, ettin 2*, bear-5 3*
  - dmg 97,533,600 · silver 35,156,800 · hired 24 · gold 12,192 · coins 27,040 · queue 2,900 h · dmg/silver 2.774 · dmg/hired 669,208 · dmg/gold 8,000 · dmg/coin 3,607
  - rating vs every stop: HS 4.32 · SW 3.68 · MM 2.58 · MX 9.09 · AI 8.31
  - journal: swordsman-1 0.46MHP→0×0.18M · archer-1 0.46MHP→1×0.25M · rider-1 0.46MHP→1×0.25M · spearman-1 0.45MHP→1×0.21M · spearman-2 0.45MHP→1×0.24M · rider-3 0.45MHP→2×0.37M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-3 0.45MHP→3×0.38M · fearsome-manticore* 0.41MHP→3×0.49M · ice-phoenix* 0.41MHP→3×0.44M · stone-gargoyle* 0.41MHP→3×0.39M · magic-dragon* 0.41MHP→4×0.43M · gorgon-medusa* 0.40MHP→4×0.50M · flaming-centaur* 0.40MHP→4×0.68M · many-armed-guardian* 0.39MHP→4×0.28M · desert-vanquisher* 0.38MHP→5×0.44M · epic-monster-hunter-6* 0.29MHP→5×0.69M · ettin* 0.29MHP→5×0.42M · bear-5* 0.20MHP→5×0.11M

### the 4 000-leadership case of 2026-09-15 (Tot

- **sustain**: epic-monster-hunter-6 10, arbalester-6 10, legionary-6 10, chariot-6 5 · raw candidates 17 · stops: SS 5.21M/19 hired · SW 8.53M/21 hired · AI 8.99M/24 hired
- **top AI** first march: rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, rider-2 208, archer-1 746, archer-2 414, rider-3 116, legionary-6 14*, chariot-6 8*, arbalester-6 15*, epic-monster-hunter-6 14*; journal rider-1 0.12MHP→0×0.06M · spearman-2 0.12MHP→1×0.07M · spearman-1 0.12MHP→1×0.06M · swordsman-1 0.12MHP→1×0.05M · rider-2 0.12MHP→1×0.08M · archer-1 0.12MHP→1×0.06M · archer-2 0.12MHP→2×0.08M · rider-3 0.11MHP→2×0.09M · legionary-6* 0.11MHP→2×0.12M · chariot-6* 0.09MHP→3×0.18M · arbalester-6* 0.09MHP→3×0.17M · epic-monster-hunter-6* 0.09MHP→3×0.20M
- **(a) under the lowest troop stack** — SW re-sheltered: swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413, legionary-6 10*, chariot-6 5*, epic-monster-hunter-6 10*, arbalester-6 10*
  - dmg 8,160,188 · silver 6,087,200 · hired 16 · gold 1,120 · coins 0 · queue 381 h · dmg/silver 1.341 · dmg/hired 325,002 · dmg/gold 7,286 · dmg/coin —
  - rating vs every stop: SS 35.89 · SW 1.37 · AI 0.71
  - journal: swordsman-1 0.12MHP→0×0.05M · spearman-1 0.12MHP→1×0.06M · spearman-2 0.12MHP→1×0.07M · rider-1 0.12MHP→1×0.06M · archer-1 0.12MHP→1×0.06M · rider-3 0.12MHP→2×0.09M · rider-2 0.12MHP→2×0.08M · archer-2 0.11MHP→2×0.08M · legionary-6* 0.08MHP→2×0.09M · epic-monster-hunter-6* 0.06MHP→3×0.14M · arbalester-6* 0.06MHP→3×0.12M · chariot-6* 0.06MHP→3×0.11M
- **(b) journal: never wiped before striking** — SW re-sheltered: swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413, legionary-6 10*, chariot-6 5*, epic-monster-hunter-6 10*, arbalester-6 10*
  - dmg 8,160,188 · silver 6,087,200 · hired 16 · gold 1,120 · coins 0 · queue 381 h · dmg/silver 1.341 · dmg/hired 325,002 · dmg/gold 7,286 · dmg/coin —
  - rating vs every stop: SS 35.89 · SW 1.37 · AI 0.71
  - journal: swordsman-1 0.12MHP→0×0.05M · spearman-1 0.12MHP→1×0.06M · spearman-2 0.12MHP→1×0.07M · rider-1 0.12MHP→1×0.06M · archer-1 0.12MHP→1×0.06M · rider-3 0.12MHP→2×0.09M · rider-2 0.12MHP→2×0.08M · archer-2 0.11MHP→2×0.08M · legionary-6* 0.08MHP→2×0.09M · epic-monster-hunter-6* 0.06MHP→3×0.14M · arbalester-6* 0.06MHP→3×0.12M · chariot-6* 0.06MHP→3×0.11M
- **(c) none** — SW re-sheltered: swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413, legionary-6 10*, chariot-6 5*, epic-monster-hunter-6 10*, arbalester-6 10*
  - dmg 8,160,188 · silver 6,087,200 · hired 16 · gold 1,120 · coins 0 · queue 381 h · dmg/silver 1.341 · dmg/hired 325,002 · dmg/gold 7,286 · dmg/coin —
  - rating vs every stop: SS 35.89 · SW 1.37 · AI 0.71
  - journal: swordsman-1 0.12MHP→0×0.05M · spearman-1 0.12MHP→1×0.06M · spearman-2 0.12MHP→1×0.07M · rider-1 0.12MHP→1×0.06M · archer-1 0.12MHP→1×0.06M · rider-3 0.12MHP→2×0.09M · rider-2 0.12MHP→2×0.08M · archer-2 0.11MHP→2×0.08M · legionary-6* 0.08MHP→2×0.09M · epic-monster-hunter-6* 0.06MHP→3×0.14M · arbalester-6* 0.06MHP→3×0.12M · chariot-6* 0.06MHP→3×0.11M

### 2026-09-17 export, its setup (7 000 leadersh

- **sustain**: arbalester-6 38, chariot-6 14, epic-monster-hunter-6 109, legionary-6 30 · raw candidates 34 · stops: HS 15.32M/26 hired · SS 16.12M/32 hired · SW 19.03M/35 hired · MM 22.87M/47 hired · MX 24.29M/55 hired
- **top MX** first march: spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215, legionary-6 33*, epic-monster-hunter-6 38*, arbalester-6 40*, chariot-6 16*; journal spearman-1 0.37MHP→0×0.19M · spearman-2 0.37MHP→1×0.20M · archer-1 0.37MHP→0×0.20M · rider-1 0.36MHP→1×0.20M · rider-2 0.36MHP→1×0.22M · archer-2 0.36MHP→1×0.22M · rider-3 0.36MHP→2×0.25M · legionary-6* 0.36MHP→2×0.35M · epic-monster-hunter-6* 0.36MHP→2×0.61M · arbalester-6* 0.36MHP→3×0.53M · chariot-6* 0.32MHP→3×0.43M
- **(a) under the lowest troop stack** — MX re-sheltered → retyped: spearman-1 1,275, spearman-2 708, rider-2 387, rider-1 695, archer-1 1,559, rider-3 217, archer-2 858, epic-monster-hunter-6 38*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
  - dmg 23,429,548 · silver 10,964,000 · hired 52 · gold 3,808 · coins 0 · queue 741 h · dmg/silver 2.137 · dmg/hired 331,345 · dmg/gold 6,153 · dmg/coin —
  - rating vs every stop: HS 15.18 · SS 17.05 · SW 5.66 · MM -1.23 · MX -1.51
  - journal: spearman-1 0.37MHP→0×0.19M · spearman-2 0.37MHP→1×0.20M · rider-2 0.37MHP→1×0.22M · rider-1 0.36MHP→1×0.20M · archer-1 0.36MHP→1×0.20M · rider-3 0.36MHP→2×0.26M · archer-2 0.36MHP→1×0.22M · epic-monster-hunter-6* 0.36MHP→2×0.61M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M
- **(b) journal: never wiped before striking** — MX re-sheltered → retyped: spearman-1 1,275, spearman-2 708, rider-2 387, rider-1 695, archer-1 1,559, rider-3 217, archer-2 858, epic-monster-hunter-6 38*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
  - dmg 23,429,548 · silver 10,964,000 · hired 52 · gold 3,808 · coins 0 · queue 741 h · dmg/silver 2.137 · dmg/hired 331,345 · dmg/gold 6,153 · dmg/coin —
  - rating vs every stop: HS 15.18 · SS 17.05 · SW 5.66 · MM -1.23 · MX -1.51
  - journal: spearman-1 0.37MHP→0×0.19M · spearman-2 0.37MHP→1×0.20M · rider-2 0.37MHP→1×0.22M · rider-1 0.36MHP→1×0.20M · archer-1 0.36MHP→1×0.20M · rider-3 0.36MHP→2×0.26M · archer-2 0.36MHP→1×0.22M · epic-monster-hunter-6* 0.36MHP→2×0.61M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M
- **(c) none** — MX re-sheltered → retyped: spearman-1 1,275, spearman-2 708, rider-2 387, rider-1 695, archer-1 1,559, rider-3 217, archer-2 858, epic-monster-hunter-6 38*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
  - dmg 23,429,548 · silver 10,964,000 · hired 52 · gold 3,808 · coins 0 · queue 741 h · dmg/silver 2.137 · dmg/hired 331,345 · dmg/gold 6,153 · dmg/coin —
  - rating vs every stop: HS 15.18 · SS 17.05 · SW 5.66 · MM -1.23 · MX -1.51
  - journal: spearman-1 0.37MHP→0×0.19M · spearman-2 0.37MHP→1×0.20M · rider-2 0.37MHP→1×0.22M · rider-1 0.36MHP→1×0.20M · archer-1 0.36MHP→1×0.20M · rider-3 0.36MHP→2×0.26M · archer-2 0.36MHP→1×0.22M · epic-monster-hunter-6* 0.36MHP→2×0.61M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M

### 2026-09-17 export, 12 000 leadership

- **sustain**: arbalester-6 38, chariot-6 14, epic-monster-hunter-6 109, legionary-6 30 · raw candidates 27 · stops: HS 22.40M/30 hired · SS 21.27M/48 hired · SW 34.45M/67 hired · MX 34.62M/82 hired
- **top MX** first march: spearman-1 3,659, spearman-2 2,032, rider-2 1,112, rider-3 624, archer-2 2,483, epic-monster-hunter-6 111*, legionary-6 34*, arbalester-6 40*, chariot-6 16*; journal spearman-1 1.05MHP→0×0.54M · spearman-2 1.05MHP→1×0.58M · rider-2 1.05MHP→1×0.64M · rider-3 1.05MHP→1×0.73M · archer-2 1.05MHP→1×0.64M · epic-monster-hunter-6* 1.04MHP→2×1.79M · legionary-6* 0.37MHP→2×0.36M · arbalester-6* 0.36MHP→2×0.53M · chariot-6* 0.32MHP→2×0.43M
- **(a) under the lowest troop stack** — SW re-sheltered → retyped: archer-1 2,687, spearman-2 1,212, spearman-1 2,177, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658, epic-monster-hunter-6 66*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
  - dmg 32,910,708 · silver 18,794,800 · hired 64 · gold 4,608 · coins 0 · queue 1,269 h · dmg/silver 1.751 · dmg/hired 325,560 · dmg/gold 7,142 · dmg/coin —
  - rating vs every stop: HS 4.69 · SS 25.49 · SW -2.67 · MX 6.13
  - journal: archer-1 0.63MHP→0×0.34M · spearman-2 0.63MHP→1×0.34M · spearman-1 0.63MHP→1×0.32M · rider-1 0.63MHP→1×0.34M · archer-2 0.62MHP→1×0.38M · rider-3 0.62MHP→2×0.44M · rider-2 0.62MHP→2×0.38M · epic-monster-hunter-6* 0.62MHP→2×1.06M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M
- **(b) journal: never wiped before striking** — SW re-sheltered → retyped: archer-1 2,687, spearman-2 1,212, spearman-1 2,177, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658, epic-monster-hunter-6 66*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
  - dmg 32,910,708 · silver 18,794,800 · hired 64 · gold 4,608 · coins 0 · queue 1,269 h · dmg/silver 1.751 · dmg/hired 325,560 · dmg/gold 7,142 · dmg/coin —
  - rating vs every stop: HS 4.69 · SS 25.49 · SW -2.67 · MX 6.13
  - journal: archer-1 0.63MHP→0×0.34M · spearman-2 0.63MHP→1×0.34M · spearman-1 0.63MHP→1×0.32M · rider-1 0.63MHP→1×0.34M · archer-2 0.62MHP→1×0.38M · rider-3 0.62MHP→2×0.44M · rider-2 0.62MHP→2×0.38M · epic-monster-hunter-6* 0.62MHP→2×1.06M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M
- **(c) none** — SW re-sheltered → retyped: archer-1 2,687, spearman-2 1,212, spearman-1 2,177, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658, epic-monster-hunter-6 66*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
  - dmg 32,910,708 · silver 18,794,800 · hired 64 · gold 4,608 · coins 0 · queue 1,269 h · dmg/silver 1.751 · dmg/hired 325,560 · dmg/gold 7,142 · dmg/coin —
  - rating vs every stop: HS 4.69 · SS 25.49 · SW -2.67 · MX 6.13
  - journal: archer-1 0.63MHP→0×0.34M · spearman-2 0.63MHP→1×0.34M · spearman-1 0.63MHP→1×0.32M · rider-1 0.63MHP→1×0.34M · archer-2 0.62MHP→1×0.38M · rider-3 0.62MHP→2×0.44M · rider-2 0.62MHP→2×0.38M · epic-monster-hunter-6* 0.62MHP→2×1.06M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M

### live account of 2026-09-18 (one hired type, 

- **sustain**: epic-monster-hunter-6 62 · raw candidates 16 · stops: SS 18.26M/20 hired · SW 28.27M/25 hired · MX 28.73M/28 hired · AI 29.74M/30 hired
- **top AI** first march: archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 83*; journal archer-1 1.16MHP→0×0.62M · rider-1 1.14MHP→1×0.63M · spearman-2 1.12MHP→1×0.61M · spearman-1 1.10MHP→1×0.56M · archer-2 1.07MHP→1×0.65M · rider-3 1.05MHP→2×0.73M · rider-2 1.03MHP→2×0.63M · epic-monster-hunter-6* 0.80MHP→2×1.34M
- **(a) under the lowest troop stack** — Elite 10 % → retyped: archer-1 4,653, spearman-2 2,053, spearman-1 3,684, rider-1 1,889, archer-2 2,566, rider-3 588, rider-2 1,043, epic-monster-hunter-6 6*
  - dmg 22,098,564 · silver 31,240,800 · hired 4 · gold 160 · coins 0 · queue 2,092 h · dmg/silver 0.707 · dmg/hired 194,150 · dmg/gold 138,116 · dmg/coin —
  - rating vs every stop: SS 40.28 · SW 12.56 · MX 11.54 · AI 9.76
  - journal: archer-1 1.12MHP→0×0.59M · spearman-2 1.11MHP→1×0.61M · spearman-1 1.11MHP→1×0.57M · rider-1 1.11MHP→1×0.61M · archer-2 1.11MHP→1×0.67M · rider-3 1.11MHP→2×0.76M · rider-2 1.10MHP→2×0.67M · epic-monster-hunter-6* 0.06MHP→2×0.10M
- **(b) journal: never wiped before striking** — Elite 10 % → retyped: archer-1 4,653, spearman-2 2,053, spearman-1 3,684, rider-1 1,889, archer-2 2,566, rider-3 588, rider-2 1,043, epic-monster-hunter-6 6*
  - dmg 22,098,564 · silver 31,240,800 · hired 4 · gold 160 · coins 0 · queue 2,092 h · dmg/silver 0.707 · dmg/hired 194,150 · dmg/gold 138,116 · dmg/coin —
  - rating vs every stop: SS 40.28 · SW 12.56 · MX 11.54 · AI 9.76
  - journal: archer-1 1.12MHP→0×0.59M · spearman-2 1.11MHP→1×0.61M · spearman-1 1.11MHP→1×0.57M · rider-1 1.11MHP→1×0.61M · archer-2 1.11MHP→1×0.67M · rider-3 1.11MHP→2×0.76M · rider-2 1.10MHP→2×0.67M · epic-monster-hunter-6* 0.06MHP→2×0.10M
- **(c) none** — Elite 10 % → retyped: archer-1 4,653, spearman-2 2,053, spearman-1 3,684, rider-1 1,889, archer-2 2,566, rider-3 588, rider-2 1,043, epic-monster-hunter-6 6*
  - dmg 22,098,564 · silver 31,240,800 · hired 4 · gold 160 · coins 0 · queue 2,092 h · dmg/silver 0.707 · dmg/hired 194,150 · dmg/gold 138,116 · dmg/coin —
  - rating vs every stop: SS 40.28 · SW 12.56 · MX 11.54 · AI 9.76
  - journal: archer-1 1.12MHP→0×0.59M · spearman-2 1.11MHP→1×0.61M · spearman-1 1.11MHP→1×0.57M · rider-1 1.11MHP→1×0.61M · archer-2 1.11MHP→1×0.67M · rider-3 1.11MHP→2×0.76M · rider-2 1.10MHP→2×0.67M · epic-monster-hunter-6* 0.06MHP→2×0.10M

### live account, evening (hunters 83, legionari

- **sustain**: arbalester-6 45, chariot-6 7, epic-monster-hunter-6 62, legionary-6 2,180 · raw candidates 36 · stops: HS 20.53M/32 hired · SS 20.65M/50 hired · SW 29.43M/61 hired · MM 33.26M/70 hired · MX 34.10M/76 hired
- **top MX** first march: archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 52*, epic-monster-hunter-6 61*, arbalester-6 50*, chariot-6 8*; journal archer-1 0.61MHP→0×0.33M · spearman-2 0.61MHP→1×0.33M · spearman-1 0.61MHP→1×0.31M · rider-1 0.61MHP→1×0.34M · archer-2 0.61MHP→1×0.37M · rider-2 0.61MHP→2×0.37M · rider-3 0.61MHP→2×0.42M · legionary-6* 0.60MHP→2×0.56M · epic-monster-hunter-6* 0.59MHP→2×0.99M · arbalester-6* 0.46MHP→3×0.66M · chariot-6* 0.18MHP→3×0.23M
- **(a) under the lowest troop stack** — MM re-sheltered: archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 49*, epic-monster-hunter-6 58*, arbalester-6 45*, chariot-6 7*
  - dmg 32,989,524 · silver 17,180,800 · hired 68 · gold 4,736 · coins 0 · queue 1,150 h · dmg/silver 1.920 · dmg/hired 312,794 · dmg/gold 6,966 · dmg/coin —
  - rating vs every stop: HS 14.21 · SS 32.77 · SW 6.25 · MM 0.31 · MX 0.04
  - journal: archer-1 0.61MHP→0×0.33M · spearman-2 0.61MHP→1×0.33M · spearman-1 0.61MHP→1×0.31M · rider-1 0.61MHP→1×0.34M · archer-2 0.61MHP→1×0.37M · rider-2 0.61MHP→2×0.37M · rider-3 0.61MHP→2×0.42M · legionary-6* 0.56MHP→2×0.53M · epic-monster-hunter-6* 0.56MHP→2×0.94M · arbalester-6* 0.41MHP→3×0.60M · chariot-6* 0.16MHP→3×0.20M
- **(b) journal: never wiped before striking** — MM re-sheltered: archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 49*, epic-monster-hunter-6 58*, arbalester-6 45*, chariot-6 7*
  - dmg 32,989,524 · silver 17,180,800 · hired 68 · gold 4,736 · coins 0 · queue 1,150 h · dmg/silver 1.920 · dmg/hired 312,794 · dmg/gold 6,966 · dmg/coin —
  - rating vs every stop: HS 14.21 · SS 32.77 · SW 6.25 · MM 0.31 · MX 0.04
  - journal: archer-1 0.61MHP→0×0.33M · spearman-2 0.61MHP→1×0.33M · spearman-1 0.61MHP→1×0.31M · rider-1 0.61MHP→1×0.34M · archer-2 0.61MHP→1×0.37M · rider-2 0.61MHP→2×0.37M · rider-3 0.61MHP→2×0.42M · legionary-6* 0.56MHP→2×0.53M · epic-monster-hunter-6* 0.56MHP→2×0.94M · arbalester-6* 0.41MHP→3×0.60M · chariot-6* 0.16MHP→3×0.20M
- **(c) none** — MM re-sheltered: archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 49*, epic-monster-hunter-6 58*, arbalester-6 45*, chariot-6 7*
  - dmg 32,989,524 · silver 17,180,800 · hired 68 · gold 4,736 · coins 0 · queue 1,150 h · dmg/silver 1.920 · dmg/hired 312,794 · dmg/gold 6,966 · dmg/coin —
  - rating vs every stop: HS 14.21 · SS 32.77 · SW 6.25 · MM 0.31 · MX 0.04
  - journal: archer-1 0.61MHP→0×0.33M · spearman-2 0.61MHP→1×0.33M · spearman-1 0.61MHP→1×0.31M · rider-1 0.61MHP→1×0.34M · archer-2 0.61MHP→1×0.37M · rider-2 0.61MHP→2×0.37M · rider-3 0.61MHP→2×0.42M · legionary-6* 0.56MHP→2×0.53M · epic-monster-hunter-6* 0.56MHP→2×0.94M · arbalester-6* 0.41MHP→3×0.60M · chariot-6* 0.16MHP→3×0.20M

### Aydae alone, 4 975 (one captain, four hired 

- **sustain**: arbalester-6 45, chariot-6 7, epic-monster-hunter-6 62, legionary-6 2,180 · raw candidates 34 · stops: HS 9.43M/19 hired · SW 15.60M/37 hired · MX 17.65M/58 hired · AI 18.75M/111 hired
- **top AI** first march: spearman-2 1,945, rider-3 546, archer-2 1,938, legionary-6 91*, epic-monster-hunter-6 83*, arbalester-6 60*, chariot-6 10*; journal spearman-2 0.84MHP→0×0.43M · rider-3 0.84MHP→1×0.58M · archer-2 0.84MHP→1×0.50M · legionary-6* 0.83MHP→1×0.84M · epic-monster-hunter-6* 0.80MHP→1×1.34M · arbalester-6* 0.55MHP→2×0.79M · chariot-6* 0.18MHP→2×0.26M
- **(a) under the lowest troop stack** — TS re-capped (M’s Preservation) → retyped: spearman-1 1,002, rider-1 501, rider-2 278, archer-1 999, spearman-2 554, archer-2 552, rider-3 155, arbalester-6 26*, legionary-6 26*, epic-monster-hunter-6 24*, chariot-6 7*
  - dmg 16,052,176 · silver 7,795,600 · hired 40 · gold 2,528 · coins 0 · queue 527 h · dmg/silver 2.059 · dmg/hired 287,417 · dmg/gold 6,350 · dmg/coin —
  - rating vs every stop: HS 20.29 · SW 0.14 · MX 7.04 · AI 19.67
  - journal: spearman-1 0.24MHP→0×0.11M · rider-1 0.24MHP→1×0.13M · rider-2 0.24MHP→1×0.14M · archer-1 0.24MHP→1×0.13M · spearman-2 0.24MHP→1×0.12M · archer-2 0.24MHP→2×0.14M · rider-3 0.24MHP→2×0.17M · arbalester-6* 0.24MHP→2×0.34M · legionary-6* 0.24MHP→2×0.24M · epic-monster-hunter-6* 0.23MHP→3×0.39M · chariot-6* 0.13MHP→3×0.18M
- **(b) journal: never wiped before striking** — TS re-capped (M’s Preservation) → retyped: spearman-1 1,002, rider-1 501, rider-2 278, archer-1 999, spearman-2 554, archer-2 552, rider-3 155, arbalester-6 26*, legionary-6 26*, epic-monster-hunter-6 24*, chariot-6 7*
  - dmg 16,052,176 · silver 7,795,600 · hired 40 · gold 2,528 · coins 0 · queue 527 h · dmg/silver 2.059 · dmg/hired 287,417 · dmg/gold 6,350 · dmg/coin —
  - rating vs every stop: HS 20.29 · SW 0.14 · MX 7.04 · AI 19.67
  - journal: spearman-1 0.24MHP→0×0.11M · rider-1 0.24MHP→1×0.13M · rider-2 0.24MHP→1×0.14M · archer-1 0.24MHP→1×0.13M · spearman-2 0.24MHP→1×0.12M · archer-2 0.24MHP→2×0.14M · rider-3 0.24MHP→2×0.17M · arbalester-6* 0.24MHP→2×0.34M · legionary-6* 0.24MHP→2×0.24M · epic-monster-hunter-6* 0.23MHP→3×0.39M · chariot-6* 0.13MHP→3×0.18M
- **(c) none** — TS re-capped (M’s Preservation) → retyped: spearman-1 1,002, rider-1 501, rider-2 278, archer-1 999, spearman-2 554, archer-2 552, rider-3 155, arbalester-6 26*, legionary-6 26*, epic-monster-hunter-6 24*, chariot-6 7*
  - dmg 16,052,176 · silver 7,795,600 · hired 40 · gold 2,528 · coins 0 · queue 527 h · dmg/silver 2.059 · dmg/hired 287,417 · dmg/gold 6,350 · dmg/coin —
  - rating vs every stop: HS 20.29 · SW 0.14 · MX 7.04 · AI 19.67
  - journal: spearman-1 0.24MHP→0×0.11M · rider-1 0.24MHP→1×0.13M · rider-2 0.24MHP→1×0.14M · archer-1 0.24MHP→1×0.13M · spearman-2 0.24MHP→1×0.12M · archer-2 0.24MHP→2×0.14M · rider-3 0.24MHP→2×0.17M · arbalester-6* 0.24MHP→2×0.34M · legionary-6* 0.24MHP→2×0.24M · epic-monster-hunter-6* 0.23MHP→3×0.39M · chariot-6* 0.13MHP→3×0.18M

### the owner’s live camp of 2026-09-18 (arbales

- **sustain**: arbalester-6 371, bear-5 103, legionary-6 770 · raw candidates 23 · stops: HS 8.26M/16 hired · SS 8.39M/34 hired · SW 15.86M/52 hired · MM 20.78M/136 hired · MX 31.54M/208 hired
- **top MX** first march: rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*; journal rider-3 4.59MHP→0×3.17M · arbalester-6* 3.68MHP→1×5.34M · bear-5* 3.30MHP→1×1.94M · legionary-6* 2.46MHP→1×2.31M
- **(a) under the lowest troop stack** — MM troops + sustain hired: rider-3 2,441, arbalester-6 371*, bear-5 48*, legionary-6 400*
  - dmg 47,473,092 · silver 13,669,600 · hired 332 · gold 49,696 · coins 0 · queue 2,278 h · dmg/silver 3.473 · dmg/hired 142,991 · dmg/gold 955 · dmg/coin —
  - rating vs every stop: HS -613.93 · SS 103.51 · SW -55.89 · MM 44.37 · MX 20.98
  - journal: rider-3 4.59MHP→0×3.17M · legionary-6* 4.58MHP→1×4.29M · bear-5* 4.53MHP→1×2.66M · arbalester-6* 3.38MHP→1×4.91M
- **(b) journal: never wiped before striking** — MM troops + sustain hired: rider-3 2,441, arbalester-6 371*, bear-5 48*, legionary-6 400*
  - dmg 47,473,092 · silver 13,669,600 · hired 332 · gold 49,696 · coins 0 · queue 2,278 h · dmg/silver 3.473 · dmg/hired 142,991 · dmg/gold 955 · dmg/coin —
  - rating vs every stop: HS -613.93 · SS 103.51 · SW -55.89 · MM 44.37 · MX 20.98
  - journal: rider-3 4.59MHP→0×3.17M · legionary-6* 4.58MHP→1×4.29M · bear-5* 4.53MHP→1×2.66M · arbalester-6* 3.38MHP→1×4.91M
- **(c) none** — MM troops + sustain hired: rider-3 2,441, arbalester-6 371*, bear-5 103*, legionary-6 770*
  - dmg 65,401,800 · silver 13,669,600 · hired 504 · gold 91,712 · coins 0 · queue 2,278 h · dmg/silver 4.784 · dmg/hired 104,596 · dmg/gold 713 · dmg/coin —
  - rating vs every stop: HS -1192.22 · SS 62.59 · SW -141.48 · MM 44.27 · MX 32.04
  - journal: bear-5* 9.72MHP→0×5.71M · legionary-6* 8.82MHP→1×8.27M · rider-3 4.59MHP→1×3.17M · arbalester-6* 3.38MHP→1×4.91M — **pre-strike hired: bear-5**

### his camp of 2026-09-19, the localStorage dum

- **sustain**: epic-monster-hunter-6 345 · raw candidates 21 · stops: HS 6.64M/6 hired · SS 7.56M/12 hired · SW 9.37M/15 hired · MM 14.14M/57 hired · MX 23.59M/148 hired
- **top MX** first march: rider-3 2,390, epic-monster-hunter-6 374*; journal rider-3 4.50MHP→0×3.11M · epic-monster-hunter-6* 3.60MHP→1×6.05M
- **(a) under the lowest troop stack** — MX re-sheltered: rider-3 2,390, epic-monster-hunter-6 345*
  - dmg 22,327,160 · silver 13,384,000 · hired 140 · gold 9,920 · coins 0 · queue 2,231 h · dmg/silver 1.668 · dmg/hired 159,480 · dmg/gold 2,251 · dmg/coin —
  - rating vs every stop: HS -719.54 · SS -255.02 · SW -219.05 · MM -9.47 · MX -3.79
  - journal: rider-3 4.50MHP→0×3.11M · epic-monster-hunter-6* 3.32MHP→1×5.58M
- **(b) journal: never wiped before striking** — MX re-sheltered: rider-3 2,390, epic-monster-hunter-6 345*
  - dmg 22,327,160 · silver 13,384,000 · hired 140 · gold 9,920 · coins 0 · queue 2,231 h · dmg/silver 1.668 · dmg/hired 159,480 · dmg/gold 2,251 · dmg/coin —
  - rating vs every stop: HS -719.54 · SS -255.02 · SW -219.05 · MM -9.47 · MX -3.79
  - journal: rider-3 4.50MHP→0×3.11M · epic-monster-hunter-6* 3.32MHP→1×5.58M
- **(c) none** — MX re-sheltered: rider-3 2,390, epic-monster-hunter-6 345*
  - dmg 22,327,160 · silver 13,384,000 · hired 140 · gold 9,920 · coins 0 · queue 2,231 h · dmg/silver 1.668 · dmg/hired 159,480 · dmg/gold 2,251 · dmg/coin —
  - rating vs every stop: HS -719.54 · SS -255.02 · SW -219.05 · MM -9.47 · MX -3.79
  - journal: rider-3 4.50MHP→0×3.11M · epic-monster-hunter-6* 3.32MHP→1×5.58M

### his camp of 2026-09-19, as his message reads

- **sustain**: epic-monster-hunter-6 90 · raw candidates 20 · stops: HS 7.40M/15 hired · SS 8.33M/18 hired · SW 11.05M/25 hired · MX 11.20M/39 hired · AI 11.59M/41 hired
- **top AI** first march: spearman-2 1,962, rider-3 565, rider-2 1,004, epic-monster-hunter-6 110*; journal spearman-2 1.07MHP→0×0.58M · rider-3 1.06MHP→1×0.73M · rider-2 1.06MHP→1×0.65M · epic-monster-hunter-6* 1.06MHP→1×1.78M
- **(a) under the lowest troop stack** — SW re-sheltered: spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50*
  - dmg 11,229,100 · silver 9,286,000 · hired 20 · gold 1,440 · coins 0 · queue 855 h · dmg/silver 1.209 · dmg/hired 323,582 · dmg/gold 7,798 · dmg/coin —
  - rating vs every stop: HS 34.36 · SS 24.73 · SW 10.22 · MX 22.55 · AI 20.69
  - journal: spearman-2 0.49MHP→0×0.27M · rider-2 0.49MHP→1×0.30M · rider-3 0.49MHP→1×0.34M · rider-1 0.48MHP→1×0.27M · archer-2 0.48MHP→1×0.29M · epic-monster-hunter-6* 0.48MHP→2×0.81M
- **(b) journal: never wiped before striking** — SW re-sheltered: spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50*
  - dmg 11,229,100 · silver 9,286,000 · hired 20 · gold 1,440 · coins 0 · queue 855 h · dmg/silver 1.209 · dmg/hired 323,582 · dmg/gold 7,798 · dmg/coin —
  - rating vs every stop: HS 34.36 · SS 24.73 · SW 10.22 · MX 22.55 · AI 20.69
  - journal: spearman-2 0.49MHP→0×0.27M · rider-2 0.49MHP→1×0.30M · rider-3 0.49MHP→1×0.34M · rider-1 0.48MHP→1×0.27M · archer-2 0.48MHP→1×0.29M · epic-monster-hunter-6* 0.48MHP→2×0.81M
- **(c) none** — SW re-sheltered: spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50*
  - dmg 11,229,100 · silver 9,286,000 · hired 20 · gold 1,440 · coins 0 · queue 855 h · dmg/silver 1.209 · dmg/hired 323,582 · dmg/gold 7,798 · dmg/coin —
  - rating vs every stop: HS 34.36 · SS 24.73 · SW 10.22 · MX 22.55 · AI 20.69
  - journal: spearman-2 0.49MHP→0×0.27M · rider-2 0.49MHP→1×0.30M · rider-3 0.49MHP→1×0.34M · rider-1 0.48MHP→1×0.27M · archer-2 0.48MHP→1×0.29M · epic-monster-hunter-6* 0.48MHP→2×0.81M

### his TotalStack profile of 2026-09-19 (5 225 

- **sustain**: epic-monster-hunter-5 60 · raw candidates 17 · stops: SS 4.92M/7 hired · SW 8.25M/19 hired · MX 8.44M/25 hired
- **top MX** first march: spearman-2 733, archer-2 732, rider-2 365, archer-1 1,310, rider-1 654, rider-3 204, epic-monster-hunter-5 62*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*; journal spearman-2 0.32MHP→0×0.15M · archer-2 0.32MHP→1×0.17M · rider-2 0.32MHP→1×0.17M · archer-1 0.32MHP→1×0.15M · rider-1 0.32MHP→1×0.15M · rider-3 0.32MHP→2×0.20M · epic-monster-hunter-5* 0.32MHP→2×0.35M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→2×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M
- **(a) under the lowest troop stack** — Elite 10 % → retyped: swordsman-1 1,265, spearman-2 445, archer-1 797, rider-1 398, spearman-1 794, rider-2 221, rider-3 124, archer-2 438, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*, epic-monster-hunter-5 6*
  - dmg 6,298,800 · silver 7,995,600 · hired 4 · gold 160 · coins 3,840 · queue 486 h · dmg/silver 0.788 · dmg/hired 101,304 · dmg/gold 39,368 · dmg/coin 1,640
  - rating vs every stop: SS 32.01 · SW 10.91 · MX 11.67
  - journal: swordsman-1 0.20MHP→0×0.08M · spearman-2 0.20MHP→1×0.09M · archer-1 0.20MHP→1×0.09M · rider-1 0.19MHP→1×0.09M · spearman-1 0.19MHP→1×0.08M · rider-2 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.12M · archer-2 0.19MHP→2×0.10M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M · epic-monster-hunter-5* 0.03MHP→3×0.03M
- **(b) journal: never wiped before striking** — Elite 10 % → retyped: swordsman-1 1,265, spearman-2 445, archer-1 797, rider-1 398, spearman-1 794, rider-2 221, rider-3 124, archer-2 438, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*, epic-monster-hunter-5 6*
  - dmg 6,298,800 · silver 7,995,600 · hired 4 · gold 160 · coins 3,840 · queue 486 h · dmg/silver 0.788 · dmg/hired 101,304 · dmg/gold 39,368 · dmg/coin 1,640
  - rating vs every stop: SS 32.01 · SW 10.91 · MX 11.67
  - journal: swordsman-1 0.20MHP→0×0.08M · spearman-2 0.20MHP→1×0.09M · archer-1 0.20MHP→1×0.09M · rider-1 0.19MHP→1×0.09M · spearman-1 0.19MHP→1×0.08M · rider-2 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.12M · archer-2 0.19MHP→2×0.10M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M · epic-monster-hunter-5* 0.03MHP→3×0.03M
- **(c) none** — Elite 10 % → retyped: swordsman-1 1,265, spearman-2 445, archer-1 797, rider-1 398, spearman-1 794, rider-2 221, rider-3 124, archer-2 438, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*, epic-monster-hunter-5 6*
  - dmg 6,298,800 · silver 7,995,600 · hired 4 · gold 160 · coins 3,840 · queue 486 h · dmg/silver 0.788 · dmg/hired 101,304 · dmg/gold 39,368 · dmg/coin 1,640
  - rating vs every stop: SS 32.01 · SW 10.91 · MX 11.67
  - journal: swordsman-1 0.20MHP→0×0.08M · spearman-2 0.20MHP→1×0.09M · archer-1 0.20MHP→1×0.09M · rider-1 0.19MHP→1×0.09M · spearman-1 0.19MHP→1×0.08M · rider-2 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.12M · archer-2 0.19MHP→2×0.10M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M · epic-monster-hunter-5* 0.03MHP→3×0.03M

### his usual setup of 2026-09-19 (Aydae alone, 

- **sustain**: epic-monster-hunter-6 69 · raw candidates 24 · stops: HS 8.18M/5 hired · SW 11.49M/8 hired · MX 11.76M/14 hired
- **top MX** first march: spearman-2 730, rider-2 364, archer-2 726, rider-1 653, archer-1 1,300, rider-3 203, epic-monster-hunter-6 32*, water-elemental 18*, battle-boar 8*, emerald-dragon 7*, stone-gargoyle 6*; journal spearman-2 0.32MHP→0×0.16M · rider-2 0.31MHP→1×0.19M · archer-2 0.31MHP→1×0.19M · rider-1 0.31MHP→1×0.17M · archer-1 0.31MHP→1×0.17M · rider-3 0.31MHP→2×0.22M · epic-monster-hunter-6* 0.31MHP→2×0.52M · water-elemental* 0.10MHP→2×0.08M · battle-boar* 0.10MHP→2×0.08M · emerald-dragon* 0.09MHP→3×0.09M · stone-gargoyle* 0.09MHP→3×0.09M
- **(a) under the lowest troop stack** — SW re-sheltered → retyped: swordsman-1 1,253, spearman-2 443, archer-1 796, spearman-1 792, rider-1 396, archer-2 440, rider-2 219, rider-3 123, stone-gargoyle 12*, epic-monster-hunter-6 19*, emerald-dragon 13*, battle-boar 1*, water-elemental 2*
  - dmg 11,767,084 · silver 8,127,200 · hired 8 · gold 544 · coins 6,240 · queue 512 h · dmg/silver 1.448 · dmg/hired 461,105 · dmg/gold 21,631 · dmg/coin 1,886
  - rating vs every stop: HS 6.23 · SW 1.29 · MX 11.52
  - journal: swordsman-1 0.19MHP→0×0.08M · spearman-2 0.19MHP→1×0.10M · archer-1 0.19MHP→1×0.10M · spearman-1 0.19MHP→1×0.09M · rider-1 0.19MHP→1×0.10M · archer-2 0.19MHP→2×0.11M · rider-2 0.19MHP→2×0.11M · rider-3 0.19MHP→2×0.13M · stone-gargoyle* 0.19MHP→2×0.18M · epic-monster-hunter-6* 0.18MHP→3×0.31M · emerald-dragon* 0.18MHP→3×0.17M · battle-boar* 0.01MHP→3×0.01M · water-elemental* 0.01MHP→3×0.01M
- **(b) journal: never wiped before striking** — SW re-sheltered → retyped: swordsman-1 1,253, spearman-2 443, archer-1 796, spearman-1 792, rider-1 396, archer-2 440, rider-2 219, rider-3 123, stone-gargoyle 12*, epic-monster-hunter-6 19*, emerald-dragon 13*, battle-boar 1*, water-elemental 2*
  - dmg 11,767,084 · silver 8,127,200 · hired 8 · gold 544 · coins 6,240 · queue 512 h · dmg/silver 1.448 · dmg/hired 461,105 · dmg/gold 21,631 · dmg/coin 1,886
  - rating vs every stop: HS 6.23 · SW 1.29 · MX 11.52
  - journal: swordsman-1 0.19MHP→0×0.08M · spearman-2 0.19MHP→1×0.10M · archer-1 0.19MHP→1×0.10M · spearman-1 0.19MHP→1×0.09M · rider-1 0.19MHP→1×0.10M · archer-2 0.19MHP→2×0.11M · rider-2 0.19MHP→2×0.11M · rider-3 0.19MHP→2×0.13M · stone-gargoyle* 0.19MHP→2×0.18M · epic-monster-hunter-6* 0.18MHP→3×0.31M · emerald-dragon* 0.18MHP→3×0.17M · battle-boar* 0.01MHP→3×0.01M · water-elemental* 0.01MHP→3×0.01M
- **(c) none** — SW re-sheltered → retyped: swordsman-1 1,253, spearman-2 443, archer-1 796, spearman-1 792, rider-1 396, archer-2 440, rider-2 219, rider-3 123, stone-gargoyle 12*, epic-monster-hunter-6 19*, emerald-dragon 13*, battle-boar 1*, water-elemental 2*
  - dmg 11,767,084 · silver 8,127,200 · hired 8 · gold 544 · coins 6,240 · queue 512 h · dmg/silver 1.448 · dmg/hired 461,105 · dmg/gold 21,631 · dmg/coin 1,886
  - rating vs every stop: HS 6.23 · SW 1.29 · MX 11.52
  - journal: swordsman-1 0.19MHP→0×0.08M · spearman-2 0.19MHP→1×0.10M · archer-1 0.19MHP→1×0.10M · spearman-1 0.19MHP→1×0.09M · rider-1 0.19MHP→1×0.10M · archer-2 0.19MHP→2×0.11M · rider-2 0.19MHP→2×0.11M · rider-3 0.19MHP→2×0.13M · stone-gargoyle* 0.19MHP→2×0.18M · epic-monster-hunter-6* 0.18MHP→3×0.31M · emerald-dragon* 0.18MHP→3×0.17M · battle-boar* 0.01MHP→3×0.01M · water-elemental* 0.01MHP→3×0.01M

