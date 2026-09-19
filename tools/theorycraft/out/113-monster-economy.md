# 113 — the monster economy: where the plan’s extra monster chunks go

The camp is the benchmark’s own (`monsterCamp()`, `tests/engine/plan-scenarios.ts`): a first-run army at 20 000 leadership with the monster tiers 3–5 unlocked against a **900**-dominance pool, Epic Monster Hunter VI 83 and Bear V 6 on 2 180 authority. Every figure is priced the way `tests/engine/plan-benchmark.test.ts` prices it — `simulateBattle` on the counts, damage = the **worst opening**, four marches, the sizer rows re-sized each march on the stock the last one left — and the rare stock is split by the benchmark’s own `rareStockOf` (`plan-yardsticks.ts`).

The army: **12** dominance monster types, **2** authority types (bear-5, epic-monster-hunter-6), 10 troop types. Housing L 20,000 · A 2,180 · D 900.

## §A — the three stops and the sizer rows, as the benchmark prices them

The plan answered in 7,278 ms with 3 stops.

| row | damage | silver | a silver | soldier chunks | monster chunks | a soldier | a monster | dragon coins | monster stacks | soldier stacks | troop stacks | hired stacks ≤ 10 | monster types |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Complete optimization · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| Complete optimization · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| Complete optimization · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| Tier ladder · all types | 79,635,913 | 35,450,400 | 2.246 | 30 | 84 | 2,654,530.43 | 948,046.58 | 31,680 | 13 | 1 | 10 | 36 | 13 |
| Tier ladder · Generate (average damage) | 103,438,192 | 37,939,200 | 2.726 | 30 | 46 | 3,447,939.73 | 2,248,656.35 | 26,200 | 8 | 1 | 8 | 23 | 10 |
| Troops first · all types | 82,845,061 | 35,450,400 | 2.337 | 29 | 84 | 2,856,726.24 | 986,250.73 | 31,680 | 13 | 1 | 10 | 36 | 13 |
| Troops first · Generate (average damage) | 104,626,942 | 37,290,800 | 2.806 | 30 | 47 | 3,487,564.73 | 2,226,105.15 | 26,760 | 8 | 1 | 8 | 23 | 9 |

The best sizer sequence is **Troops first · Generate (average damage)** (104,626,942 over four marches). The steady max stands at **0.911** of it on damage and **0.510** on damage a monster; it burns **84** monster chunks against **47**, and **28** soldier chunks against **30**.

**Two readings of “a monster”, and the benchmark registers the kinder one.** `plan-baseline.ts` records `standing(perMonster) = max over the plan’s stops / max over the sizer rows`, which is the **sweet spot’s** 1,332,583.41 over **Tier ladder · Generate (average damage)**’s 2,248,656.35 = **0.593** — the 0.593 in the proposal. Stop against best-sizer-sequence, which is the comparison the damage share 0.911 is, the steady max reads **0.510**. Both are below one, and the gap is the same gap. **And the chunk figures are campaign figures**: the steady max burns 84 monster chunks over **four** marches, 21 in march 1; the best sizer sequence 47 over four, 11 in its first.

## §A — the marches themselves, in kill order


### Complete optimization · sweet-spot — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | swordsman-1 | troop | 3,048 | — | 457,200 | 0 | 0 |
| 2 | archer-1 | troop | 3,042 | — | 456,300 | 1 | 254,007 |
| 3 | spearman-1 | troop | 3,036 | — | 455,400 | 1 | 211,002 |
| 4 | rider-1 | troop | 1,515 | — | 454,500 | 1 | 249,975 |
| 5 | archer-2 | troop | 1,680 | — | 453,600 | 1 | 303,912 |
| 6 | spearman-2 | troop | 1,677 | — | 452,790 | 2 | 479,958 |
| 7 | rider-2 | troop | 837 | — | 451,980 | 2 | 596,614 |
| 8 | archer-3 | troop | 939 | — | 450,720 | 2 | 754,204 |
| 9 | spearman-3 | troop | 938 | — | 450,240 | 2 | 564,300 |
| 10 | rider-3 | troop | 468 | — | 449,280 | 3 | 1,105,230 |
| 11 | gorgon-medusa | monster (dominance) | 12 | 2 | 432,000 | 3 | 1,628,640 |
| 12 | ettin | monster (dominance) | 3 | 1 | 432,000 | 3 | 1,874,880 |
| 13 | many-armed-guardian | monster (dominance) | 11 | 2 | 429,000 | 3 | 922,350 |
| 14 | epic-monster-hunter-6 | soldier (authority) | 69 | 7 | 420,210 | 4 | 3,972,384 |
| 15 | fearsome-manticore | monster (dominance) | 3 | 1 | 414,000 | 4 | 1,948,560 |
| 16 | ice-phoenix | monster (dominance) | 8 | 1 | 408,000 | 4 | 1,757,120 |
| 17 | flaming-centaur | monster (dominance) | 3 | 1 | 396,000 | 4 | 2,719,200 |
| 18 | desert-vanquisher | monster (dominance) | 3 | 1 | 378,000 | 5 | 2,223,900 |
| 19 | water-elemental | monster (dominance) | 50 | 5 | 285,000 | 5 | 1,159,000 |
| 20 | bear-5 | monster (authority) | 4 | 1 | 264,000 | 5 | 748,000 |
| 21 | magic-dragon | monster (dominance) | 2 | 1 | 90,000 | 5 | 474,000 |

Marches 2–4: they differ — march 2: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · desert-vanquisher 3 · ettin 3 · fearsome-manticore 3 · flaming-centaur 3 · gorgon-medusa 12 · ice-phoenix 8 · magic-dragon 2 · many-armed-guardian 11 · water-elemental 50 · bear-5 4 · epic-monster-hunter-6 69; march 3: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · desert-vanquisher 3 · ettin 3 · fearsome-manticore 3 · flaming-centaur 3 · gorgon-medusa 12 · ice-phoenix 8 · magic-dragon 2 · many-armed-guardian 11 · water-elemental 50 · bear-5 4 · epic-monster-hunter-6 69; march 4: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 62 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · bear-5 3 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1

### Complete optimization · more-mercs — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | swordsman-1 | troop | 3,048 | — | 457,200 | 0 | 0 |
| 2 | archer-1 | troop | 3,042 | — | 456,300 | 1 | 254,007 |
| 3 | spearman-1 | troop | 3,036 | — | 455,400 | 1 | 211,002 |
| 4 | rider-1 | troop | 1,515 | — | 454,500 | 1 | 249,975 |
| 5 | archer-2 | troop | 1,680 | — | 453,600 | 1 | 303,912 |
| 6 | spearman-2 | troop | 1,677 | — | 452,790 | 2 | 479,958 |
| 7 | rider-2 | troop | 837 | — | 451,980 | 2 | 596,614 |
| 8 | archer-3 | troop | 939 | — | 450,720 | 2 | 754,204 |
| 9 | spearman-3 | troop | 938 | — | 450,240 | 2 | 564,300 |
| 10 | rider-3 | troop | 468 | — | 449,280 | 3 | 1,105,230 |
| 11 | water-elemental | monster (dominance) | 78 | 8 | 444,600 | 3 | 1,084,824 |
| 12 | gorgon-medusa | monster (dominance) | 12 | 2 | 432,000 | 3 | 1,628,640 |
| 13 | ettin | monster (dominance) | 3 | 1 | 432,000 | 3 | 1,874,880 |
| 14 | many-armed-guardian | monster (dominance) | 11 | 2 | 429,000 | 4 | 1,229,800 |
| 15 | epic-monster-hunter-6 | soldier (authority) | 69 | 7 | 420,210 | 4 | 3,972,384 |
| 16 | fearsome-manticore | monster (dominance) | 3 | 1 | 414,000 | 4 | 1,948,560 |
| 17 | ice-phoenix | monster (dominance) | 8 | 1 | 408,000 | 4 | 1,757,120 |
| 18 | flaming-centaur | monster (dominance) | 3 | 1 | 396,000 | 5 | 3,399,000 |
| 19 | desert-vanquisher | monster (dominance) | 3 | 1 | 378,000 | 5 | 2,223,900 |
| 20 | bear-5 | monster (authority) | 4 | 1 | 264,000 | 5 | 748,000 |
| 21 | magic-dragon | monster (dominance) | 2 | 1 | 90,000 | 5 | 474,000 |

Marches 2–4: they differ — march 2: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · desert-vanquisher 3 · ettin 3 · fearsome-manticore 3 · flaming-centaur 3 · gorgon-medusa 12 · ice-phoenix 8 · magic-dragon 2 · many-armed-guardian 11 · water-elemental 78 · bear-5 4 · epic-monster-hunter-6 69; march 3: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · desert-vanquisher 3 · ettin 3 · fearsome-manticore 3 · flaming-centaur 3 · gorgon-medusa 12 · ice-phoenix 8 · magic-dragon 2 · many-armed-guardian 11 · water-elemental 78 · bear-5 4 · epic-monster-hunter-6 69; march 4: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 62 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · bear-5 3 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1

### Complete optimization · steady-max — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | swordsman-1 | troop | 3,048 | — | 457,200 | 0 | 0 |
| 2 | archer-1 | troop | 3,042 | — | 456,300 | 1 | 254,007 |
| 3 | spearman-1 | troop | 3,036 | — | 455,400 | 1 | 211,002 |
| 4 | rider-1 | troop | 1,515 | — | 454,500 | 1 | 249,975 |
| 5 | archer-2 | troop | 1,680 | — | 453,600 | 1 | 303,912 |
| 6 | spearman-2 | troop | 1,677 | — | 452,790 | 2 | 479,958 |
| 7 | rider-2 | troop | 837 | — | 451,980 | 2 | 596,614 |
| 8 | archer-3 | troop | 939 | — | 450,720 | 2 | 754,204 |
| 9 | spearman-3 | troop | 938 | — | 450,240 | 2 | 564,300 |
| 10 | rider-3 | troop | 468 | — | 449,280 | 3 | 1,105,230 |
| 11 | water-elemental | monster (dominance) | 76 | 8 | 433,200 | 3 | 1,057,008 |
| 12 | gorgon-medusa | monster (dominance) | 12 | 2 | 432,000 | 3 | 1,628,640 |
| 13 | ettin | monster (dominance) | 3 | 1 | 432,000 | 3 | 1,874,880 |
| 14 | many-armed-guardian | monster (dominance) | 11 | 2 | 429,000 | 4 | 1,229,800 |
| 15 | epic-monster-hunter-6 | soldier (authority) | 69 | 7 | 420,210 | 4 | 3,972,384 |
| 16 | fearsome-manticore | monster (dominance) | 3 | 1 | 414,000 | 4 | 1,948,560 |
| 17 | ice-phoenix | monster (dominance) | 8 | 1 | 408,000 | 4 | 1,757,120 |
| 18 | flaming-centaur | monster (dominance) | 3 | 1 | 396,000 | 5 | 3,399,000 |
| 19 | desert-vanquisher | monster (dominance) | 3 | 1 | 378,000 | 5 | 2,223,900 |
| 20 | bear-5 | monster (authority) | 4 | 1 | 264,000 | 5 | 748,000 |
| 21 | magic-dragon | monster (dominance) | 2 | 1 | 90,000 | 5 | 474,000 |
| 22 | battle-boar | monster (dominance) | 3 | 1 | 35,100 | 6 | 171,288 |
| 23 | emerald-dragon | monster (dominance) | 1 | 1 | 13,500 | 6 | 76,950 |

Marches 2–4: they differ — march 2: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · battle-boar 3 · desert-vanquisher 3 · emerald-dragon 1 · ettin 3 · fearsome-manticore 3 · flaming-centaur 3 · gorgon-medusa 12 · ice-phoenix 8 · magic-dragon 2 · many-armed-guardian 11 · water-elemental 76 · bear-5 4 · epic-monster-hunter-6 69; march 3: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · battle-boar 3 · desert-vanquisher 3 · emerald-dragon 1 · ettin 3 · fearsome-manticore 3 · flaming-centaur 3 · gorgon-medusa 12 · ice-phoenix 8 · magic-dragon 2 · many-armed-guardian 11 · water-elemental 76 · bear-5 4 · epic-monster-hunter-6 69; march 4: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 62 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · bear-5 3 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1

### Tier ladder · all types — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | epic-monster-hunter-6 | soldier (authority) | 83 | 9 | 505,470 | 0 | 0 |
| 2 | swordsman-1 | troop | 3,048 | — | 457,200 | 1 | 182,880 |
| 3 | archer-1 | troop | 3,042 | — | 456,300 | 1 | 254,007 |
| 4 | spearman-1 | troop | 3,036 | — | 455,400 | 1 | 211,002 |
| 5 | rider-1 | troop | 1,515 | — | 454,500 | 1 | 249,975 |
| 6 | archer-2 | troop | 1,680 | — | 453,600 | 2 | 607,824 |
| 7 | spearman-2 | troop | 1,677 | — | 452,790 | 2 | 479,958 |
| 8 | rider-2 | troop | 837 | — | 451,980 | 2 | 596,614 |
| 9 | archer-3 | troop | 939 | — | 450,720 | 2 | 754,204 |
| 10 | spearman-3 | troop | 938 | — | 450,240 | 3 | 846,450 |
| 11 | rider-3 | troop | 468 | — | 449,280 | 3 | 1,105,230 |
| 12 | bear-5 | monster (authority) | 6 | 1 | 396,000 | 3 | 673,200 |
| 13 | water-elemental | monster (dominance) | 46 | 5 | 262,200 | 3 | 639,768 |
| 14 | battle-boar | monster (dominance) | 22 | 3 | 257,400 | 4 | 837,408 |
| 15 | emerald-dragon | monster (dominance) | 19 | 2 | 256,500 | 4 | 974,700 |
| 16 | gorgon-medusa | monster (dominance) | 7 | 1 | 252,000 | 4 | 1,266,720 |
| 17 | desert-vanquisher | monster (dominance) | 2 | 1 | 252,000 | 4 | 1,186,080 |
| 18 | stone-gargoyle | monster (dominance) | 16 | 2 | 249,600 | 5 | 1,185,600 |
| 19 | many-armed-guardian | monster (dominance) | 6 | 1 | 234,000 | 5 | 838,500 |
| 20 | magic-dragon | monster (dominance) | 5 | 1 | 225,000 | 5 | 1,185,000 |
| 21 | ice-phoenix | monster (dominance) | 4 | 1 | 204,000 | 5 | 1,098,200 |
| 22 | ettin | monster (dominance) | 1 | 1 | 144,000 | 6 | 1,249,920 |
| 23 | fearsome-manticore | monster (dominance) | 1 | 1 | 138,000 | 6 | 974,280 |
| 24 | flaming-centaur | monster (dominance) | 1 | 1 | 132,000 | 6 | 1,359,600 |

Marches 2–4: they differ — march 2: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · epic-monster-hunter-6 74 · spearman-3 938 · rider-3 468 · bear-5 5 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1; march 3: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 66 · bear-5 4 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1; march 4: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 59 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · bear-5 3 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1

### Tier ladder · Generate (average damage) — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | archer-1 | troop | 4,366 | — | 654,900 | 0 | 0 |
| 2 | rider-1 | troop | 2,178 | — | 653,400 | 1 | 359,370 |
| 3 | archer-2 | troop | 2,416 | — | 652,320 | 1 | 437,054 |
| 4 | spearman-2 | troop | 2,411 | — | 650,970 | 1 | 345,014 |
| 5 | rider-2 | troop | 1,203 | — | 649,620 | 1 | 428,749 |
| 6 | archer-3 | troop | 1,351 | — | 648,480 | 2 | 1,085,124 |
| 7 | spearman-3 | troop | 1,348 | — | 647,040 | 2 | 810,956 |
| 8 | rider-3 | troop | 673 | — | 646,080 | 2 | 1,059,572 |
| 9 | magic-dragon | monster (dominance) | 14 | 2 | 630,000 | 2 | 1,327,200 |
| 10 | desert-vanquisher | monster (dominance) | 5 | 1 | 630,000 | 3 | 2,223,900 |
| 11 | gorgon-medusa | monster (dominance) | 17 | 2 | 612,000 | 3 | 2,307,240 |
| 12 | ice-phoenix | monster (dominance) | 12 | 2 | 612,000 | 3 | 1,976,760 |
| 13 | ettin | monster (dominance) | 4 | 1 | 576,000 | 3 | 2,499,840 |
| 14 | fearsome-manticore | monster (dominance) | 4 | 1 | 552,000 | 4 | 2,598,080 |
| 15 | flaming-centaur | monster (dominance) | 4 | 1 | 528,000 | 4 | 3,625,600 |
| 16 | epic-monster-hunter-6 | soldier (authority) | 83 | 9 | 505,470 | 4 | 4,778,376 |
| 17 | bear-5 | monster (authority) | 6 | 1 | 396,000 | 4 | 897,600 |

Marches 2–4: they differ — march 2: archer-1 4,366 · rider-1 2,178 · archer-2 2,416 · spearman-2 2,411 · rider-2 1,203 · archer-3 1,351 · spearman-3 1,348 · rider-3 673 · magic-dragon 14 · desert-vanquisher 5 · gorgon-medusa 17 · ice-phoenix 12 · ettin 4 · fearsome-manticore 4 · flaming-centaur 4 · epic-monster-hunter-6 74 · bear-5 5; march 3: archer-1 4,366 · rider-1 2,178 · archer-2 2,416 · spearman-2 2,411 · rider-2 1,203 · archer-3 1,351 · spearman-3 1,348 · rider-3 673 · magic-dragon 14 · desert-vanquisher 5 · gorgon-medusa 17 · ice-phoenix 12 · ettin 4 · fearsome-manticore 4 · flaming-centaur 4 · epic-monster-hunter-6 66 · bear-5 4; march 4: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · fearsome-manticore 3 · ice-phoenix 8 · stone-gargoyle 26 · magic-dragon 9 · gorgon-medusa 11 · flaming-centaur 3 · many-armed-guardian 10 · desert-vanquisher 3 · epic-monster-hunter-6 59 · ettin 2 · bear-5 3

### Troops first · all types — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | swordsman-1 | troop | 3,048 | — | 457,200 | 0 | 0 |
| 2 | archer-1 | troop | 3,042 | — | 456,300 | 1 | 254,007 |
| 3 | spearman-1 | troop | 3,036 | — | 455,400 | 1 | 211,002 |
| 4 | rider-1 | troop | 1,515 | — | 454,500 | 1 | 249,975 |
| 5 | archer-2 | troop | 1,680 | — | 453,600 | 1 | 303,912 |
| 6 | spearman-2 | troop | 1,677 | — | 452,790 | 2 | 479,958 |
| 7 | rider-2 | troop | 837 | — | 451,980 | 2 | 596,614 |
| 8 | archer-3 | troop | 939 | — | 450,720 | 2 | 754,204 |
| 9 | spearman-3 | troop | 938 | — | 450,240 | 2 | 564,300 |
| 10 | rider-3 | troop | 468 | — | 449,280 | 3 | 1,105,230 |
| 11 | epic-monster-hunter-6 | soldier (authority) | 73 | 8 | 444,570 | 3 | 3,152,001 |
| 12 | bear-5 | monster (authority) | 6 | 1 | 396,000 | 3 | 673,200 |
| 13 | water-elemental | monster (dominance) | 46 | 5 | 262,200 | 3 | 639,768 |
| 14 | battle-boar | monster (dominance) | 22 | 3 | 257,400 | 4 | 837,408 |
| 15 | emerald-dragon | monster (dominance) | 19 | 2 | 256,500 | 4 | 974,700 |
| 16 | gorgon-medusa | monster (dominance) | 7 | 1 | 252,000 | 4 | 1,266,720 |
| 17 | desert-vanquisher | monster (dominance) | 2 | 1 | 252,000 | 4 | 1,186,080 |
| 18 | stone-gargoyle | monster (dominance) | 16 | 2 | 249,600 | 5 | 1,185,600 |
| 19 | many-armed-guardian | monster (dominance) | 6 | 1 | 234,000 | 5 | 838,500 |
| 20 | magic-dragon | monster (dominance) | 5 | 1 | 225,000 | 5 | 1,185,000 |
| 21 | ice-phoenix | monster (dominance) | 4 | 1 | 204,000 | 5 | 1,098,200 |
| 22 | ettin | monster (dominance) | 1 | 1 | 144,000 | 6 | 1,249,920 |
| 23 | fearsome-manticore | monster (dominance) | 1 | 1 | 138,000 | 6 | 974,280 |
| 24 | flaming-centaur | monster (dominance) | 1 | 1 | 132,000 | 6 | 1,359,600 |

Marches 2–4: they differ — march 2: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 73 · bear-5 5 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1; march 3: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 67 · bear-5 4 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1; march 4: swordsman-1 3,048 · archer-1 3,042 · spearman-1 3,036 · rider-1 1,515 · archer-2 1,680 · spearman-2 1,677 · rider-2 837 · archer-3 939 · spearman-3 938 · rider-3 468 · epic-monster-hunter-6 60 · water-elemental 46 · battle-boar 22 · emerald-dragon 19 · gorgon-medusa 7 · desert-vanquisher 2 · stone-gargoyle 16 · many-armed-guardian 6 · magic-dragon 5 · ice-phoenix 4 · bear-5 3 · ettin 1 · fearsome-manticore 1 · flaming-centaur 1

### Troops first · Generate (average damage) — march 1 of 4
| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |
|---|---|---|---|---|---|---|---|
| 1 | archer-1 | troop | 4,366 | — | 654,900 | 0 | 0 |
| 2 | rider-1 | troop | 2,178 | — | 653,400 | 1 | 359,370 |
| 3 | archer-2 | troop | 2,416 | — | 652,320 | 1 | 437,054 |
| 4 | spearman-2 | troop | 2,411 | — | 650,970 | 1 | 345,014 |
| 5 | rider-2 | troop | 1,203 | — | 649,620 | 1 | 428,749 |
| 6 | archer-3 | troop | 1,351 | — | 648,480 | 2 | 1,085,124 |
| 7 | spearman-3 | troop | 1,348 | — | 647,040 | 2 | 810,956 |
| 8 | rider-3 | troop | 673 | — | 646,080 | 2 | 1,059,572 |
| 9 | magic-dragon | monster (dominance) | 14 | 2 | 630,000 | 2 | 1,327,200 |
| 10 | desert-vanquisher | monster (dominance) | 5 | 1 | 630,000 | 3 | 2,223,900 |
| 11 | gorgon-medusa | monster (dominance) | 17 | 2 | 612,000 | 3 | 2,307,240 |
| 12 | ice-phoenix | monster (dominance) | 12 | 2 | 612,000 | 3 | 1,976,760 |
| 13 | ettin | monster (dominance) | 4 | 1 | 576,000 | 3 | 2,499,840 |
| 14 | fearsome-manticore | monster (dominance) | 4 | 1 | 552,000 | 4 | 2,598,080 |
| 15 | flaming-centaur | monster (dominance) | 4 | 1 | 528,000 | 4 | 3,625,600 |
| 16 | epic-monster-hunter-6 | soldier (authority) | 83 | 9 | 505,470 | 4 | 4,778,376 |
| 17 | bear-5 | monster (authority) | 6 | 1 | 396,000 | 4 | 897,600 |

Marches 2–4: they differ — march 2: swordsman-1 3,589 · archer-1 3,582 · rider-1 1,788 · archer-2 1,982 · spearman-2 1,979 · rider-2 987 · archer-3 1,108 · spearman-3 1,106 · rider-3 552 · flaming-centaur 4 · ice-phoenix 10 · many-armed-guardian 13 · gorgon-medusa 14 · desert-vanquisher 4 · magic-dragon 11 · epic-monster-hunter-6 74 · ettin 3 · fearsome-manticore 3 · bear-5 5; march 3: swordsman-1 3,589 · archer-1 3,582 · rider-1 1,788 · archer-2 1,982 · spearman-2 1,979 · rider-2 987 · archer-3 1,108 · spearman-3 1,106 · rider-3 552 · flaming-centaur 4 · ice-phoenix 10 · many-armed-guardian 13 · gorgon-medusa 14 · desert-vanquisher 4 · magic-dragon 11 · ettin 3 · fearsome-manticore 3 · epic-monster-hunter-6 66 · bear-5 4; march 4: swordsman-1 3,589 · archer-1 3,582 · rider-1 1,788 · archer-2 1,982 · spearman-2 1,979 · rider-2 987 · archer-3 1,108 · spearman-3 1,106 · rider-3 552 · flaming-centaur 4 · ice-phoenix 10 · many-armed-guardian 13 · gorgon-medusa 14 · desert-vanquisher 4 · magic-dragon 11 · ettin 3 · fearsome-manticore 3 · epic-monster-hunter-6 59 · bear-5 3

## §B — the chunk rule, and how the 900-dominance pool is bounded

Each uncapped hired type is bounded by **its own whole pool, as if it were the only one there** (`planCampaign`: `stock[id] = floor(housing[pool] / cost)`), and every dominance monster is uncapped by construction — `caps` is written only for the mercenaries the player selected. So the plan’s grid reads each of the twelve monster types as a stock big enough to fill the pool on its own:

| type | dominance cost | HP each | stock the plan reads | that stock’s share of the pool |
|---|---|---|---|---|
| battle-boar | 6 | 11,700 | 150 | 100.0 % |
| desert-vanquisher | 20 | 126,000 | 45 | 100.0 % |
| emerald-dragon | 7 | 13,500 | 128 | 99.6 % |
| ettin | 23 | 144,000 | 39 | 99.7 % |
| fearsome-manticore | 22 | 138,000 | 40 | 97.8 % |
| flaming-centaur | 21 | 132,000 | 42 | 98.0 % |
| gorgon-medusa | 10 | 36,000 | 90 | 100.0 % |
| ice-phoenix | 15 | 51,000 | 60 | 100.0 % |
| magic-dragon | 13 | 45,000 | 69 | 99.7 % |
| many-armed-guardian | 11 | 39,000 | 81 | 99.0 % |
| stone-gargoyle | 8 | 15,600 | 112 | 99.6 % |
| water-elemental | 3 | 5,700 | 300 | 100.0 % |

The twelve stocks together ask for **10,739** dominance against a pool of **900** — 11.932× the housing. Nothing in the grid reconciles them: `fitsHousing` refuses a shape that overruns the pool, and `sizeStacks` fills it and stops, so what survives is whatever the shelter and the pool leave — a little of a lot of types.

**`chunks(n)` as the plan bills it against `recoveryCosts`** — the same stops, march by march:

| stop | plan `mercLost` (campaign) | Σ `chunks(n)` over hired stacks | recap dragon coins | plan `dragonCoins` | recap silver | plan silver |
|---|---|---|---|---|---|---|
| sweet-spot | 97 | 97 | 28,440 | 28,440 | 35,274,000 | 35,274,000 |
| more-mercs | 106 | 106 | 29,520 | 29,520 | 35,349,600 | 35,349,600 |
| steady-max | 112 | 112 | 31,080 | 31,080 | 35,458,800 | 35,458,800 |

**What one chunk buys, type by type.** A chunk of ten is the same price whatever it is spent on, so the figure that decides whether a hired type is worth fielding at all is its **damage a chunk** on the march it stands in. The steady max’s own march 1 against the best sizer sequence’s:

*Complete optimization · steady-max, march 1*

| type | what | count | chunks | pool spent | damage (worst opening) | **a chunk** |
|---|---|---|---|---|---|---|
| flaming-centaur | monster (dominance) | 3 | 1 | 63 dominance | 3,399,000 | 3,399,000 |
| desert-vanquisher | monster (dominance) | 3 | 1 | 60 dominance | 2,223,900 | 2,223,900 |
| fearsome-manticore | monster (dominance) | 3 | 1 | 66 dominance | 1,948,560 | 1,948,560 |
| ettin | monster (dominance) | 3 | 1 | 69 dominance | 1,874,880 | 1,874,880 |
| ice-phoenix | monster (dominance) | 8 | 1 | 120 dominance | 1,757,120 | 1,757,120 |
| gorgon-medusa | monster (dominance) | 12 | 2 | 120 dominance | 1,628,640 | 814,320 |
| bear-5 | monster (authority) | 4 | 1 | 84 authority | 748,000 | 748,000 |
| many-armed-guardian | monster (dominance) | 11 | 2 | 121 dominance | 1,229,800 | 614,900 |
| epic-monster-hunter-6 | soldier (authority) | 69 | 7 | 69 authority | 3,972,384 | 567,483.43 |
| magic-dragon | monster (dominance) | 2 | 1 | 26 dominance | 474,000 | 474,000 |
| battle-boar | monster (dominance) | 3 | 1 | 18 dominance | 171,288 | 171,288 |
| water-elemental | monster (dominance) | 76 | 8 | 228 dominance | 1,057,008 | 132,126 |
| emerald-dragon | monster (dominance) | 1 | 1 | 7 dominance | 76,950 | 76,950 |

*Troops first · Generate (average damage), march 1*

| type | what | count | chunks | pool spent | damage (worst opening) | **a chunk** |
|---|---|---|---|---|---|---|
| flaming-centaur | monster (dominance) | 4 | 1 | 84 dominance | 3,625,600 | 3,625,600 |
| fearsome-manticore | monster (dominance) | 4 | 1 | 88 dominance | 2,598,080 | 2,598,080 |
| ettin | monster (dominance) | 4 | 1 | 92 dominance | 2,499,840 | 2,499,840 |
| desert-vanquisher | monster (dominance) | 5 | 1 | 100 dominance | 2,223,900 | 2,223,900 |
| gorgon-medusa | monster (dominance) | 17 | 2 | 170 dominance | 2,307,240 | 1,153,620 |
| ice-phoenix | monster (dominance) | 12 | 2 | 180 dominance | 1,976,760 | 988,380 |
| bear-5 | monster (authority) | 6 | 1 | 126 authority | 897,600 | 897,600 |
| magic-dragon | monster (dominance) | 14 | 2 | 182 dominance | 1,327,200 | 663,600 |
| epic-monster-hunter-6 | soldier (authority) | 83 | 9 | 83 authority | 4,778,376 | 530,930.67 |

**The four cheapest types a point of dominance — stone-gargoyle, emerald-dragon, battle-boar, water-elemental — hold 10 of the steady max march’s 21 monster chunks (47.6 %) and buy 1,305,246 of its 25,080,732 damage (5.2 %).** On the same march 8 of the 11 monster stacks fielded are ten units or fewer — each paying the same chunk of ten as a stack of ten.

**S-58 B off** (`refuseDroppedTypes: false`) — the same camp, the same budgets, 3 stops:

| row | damage | silver | a silver | soldier chunks | monster chunks | a soldier | a monster | dragon coins | monster stacks | soldier stacks | troop stacks | hired stacks ≤ 10 | monster types |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S-58 B **on** · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| S-58 B **off** · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| S-58 B **on** · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| S-58 B **off** · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| S-58 B **on** · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| S-58 B **off** · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |

**Why neither flag moves it: no vector the grid builds ever drops a hired type.** The crossed types’ lists are `[max, 0.7 max, 0.45 max, 0.2 max, floor]` with `floor = tokenFloor ? min(10, max) : 0`, and the **riding** types — every hired type past the four the grid crosses, which on this camp is ten of the fourteen — ride `shares = [1, 0.7, 0.45, 0.2]`, a list with **no zero in it** (`planCampaign`, the grid). So with `tokenFloor` on, every candidate vector fields **all fourteen** hired types, and with it off, at best the four crossed ones can go to nothing. Measured, the same camp under all four settings:

| row | damage | silver | a silver | soldier chunks | monster chunks | a soldier | a monster | dragon coins | monster stacks | soldier stacks | troop stacks | hired stacks ≤ 10 | monster types |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A on · B on (the app) · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| A on · B on (the app) · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| A on · B on (the app) · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| A on · B off · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| A on · B off · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| A on · B off · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| A **off** · B on · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| A **off** · B on · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| A **off** · B on · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| A **off** · B **off** · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| A **off** · B **off** · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| A **off** · B **off** · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |

## §C — the burn ladder, and where the sizer’s march would sit on it

**The two arithmetics agree on this army**, so a rival priced by `simulateBattle` may be put on the plan’s own ladder: sweet-spot 23,947,236 (plan) against 23,947,236 (recap) · more-mercs 24,860,310 (plan) against 24,860,310 (recap) · steady-max 25,080,732 (plan) against 25,080,732 (recap).

The frontier carries 5169 rows, 2538 of them undominated and 2524 of those kept by the band. The ladder below is those rows one plan a burn level, best damage at each, exactly as `planCampaign` builds it — **before** the put-back round, which re-sizes a rung and can move its burn (the stops’ own burns are in the last column, read off `plan.alternatives`).

| burn (chunks a march) | soldier | monster | damage a march | silver a march | a burn chunk | a silver | burning more buys more | stop |
|---|---|---|---|---|---|---|---|---|
| 19 | 4 | 15 | 16,169,381 | 8,756,200 | 851,020.05 | 1.847 | kept | — |
| 20 | 4 | 16 | 16,898,611 | 8,764,600 | 844,930.55 | 1.928 | kept | — |
| 21 | 5 | 16 | 17,808,422 | 8,764,600 | 848,020.1 | 2.032 | kept | — |
| 22 | 5 | 17 | 19,004,664 | 8,773,000 | 863,848.36 | 2.166 | kept | — |
| 23 | 7 | 16 | 23,947,236 | 8,803,800 | 1,041,184.17 | 2.720 | kept | sweet-spot |
| 24 | 6 | 18 | 19,961,763 | 8,729,900 | 831,740.13 | 2.287 | **dropped** | — |
| 25 | 4 | 21 | 15,304,667 | 5,633,900 | 612,186.68 | 2.717 | **dropped** | — |
| 26 | 7 | 19 | 24,860,310 | 8,829,000 | 956,165.77 | 2.816 | kept | more-mercs |
| 27 | 7 | 20 | 25,031,598 | 8,845,800 | 927,096.22 | 2.830 | kept | — |
| 28 | 7 | 21 | 25,080,732 | 8,865,400 | 895,740.43 | 2.829 | kept | steady-max |

The bar’s own stops sit at sweet-spot 23 · more-mercs 26 · steady-max 28 chunks a march.

**The sizer’s own march** (Troops first · Generate (average damage), march 1) burns **20** chunks a march (9 soldier · 11 monster) for 26,760,435 damage and 9,716,600 silver — 2.754 a silver, 1,338,021.75 a burn chunk.

| the four questions the bar asks of a plan | the sizer’s march |
|---|---|
| is there a ladder rung at its burn? | yes — 16,898,611 damage for 8,764,600 silver, and the sizer’s march hits **58.4 % harder** than it for 10.9 % more silver |

**The sizer’s march is off the plan’s frontier in the direction that matters.** It hits harder than **every** rung of the ladder — the top of it is 25,080,732 at 28 chunks — while burning 8 chunks fewer, and it costs 9.6 % more silver than that top rung, which is the one axis it does not win on (so it is undominated, not dominant). Put on the ladder it would be the rung at 20 and, because “burning more buys more” drops every level above the most damage, the 6 rungs above it would go with it — the bar would be the thrift end and this march. The search never prices it because no vector it builds can leave a hired type out (§B).
| band, the token-field arm (damage ≥ half the winner’s march) | passes (26,760,435 against half of 25,080,732) |
| band, the silver arm (≥ half the plan’s damage a silver) | passes (2.754 against half of 2.689) |
| band, more than one troop stack | passes (8) |
| S-58 B, fields every stocked hired type | **refused** — it never fields battle-boar, emerald-dragon, stone-gargoyle, water-elemental |

## §D — what would close the gap, measured

### D1 — the plan over **fewer monster types**

The request is narrowed to the k monster types with the most damage a point of dominance; nothing in the engine changes. This is the “tighter shape over fewer types with bigger stacks” family, asked of the search rather than imposed on its answer.

| monster type | damage a unit | dominance cost | damage a dominance point | HP each |
|---|---|---|---|---|
| flaming-centaur | 226,600 | 21 | 10,790.48 | 132,000 |
| ettin | 208,320 | 23 | 9,057.39 | 144,000 |
| desert-vanquisher | 148,260 | 20 | 7,413 | 126,000 |
| fearsome-manticore | 162,380 | 22 | 7,380.91 | 138,000 |
| gorgon-medusa | 45,240 | 10 | 4,524 | 36,000 |
| ice-phoenix | 54,910 | 15 | 3,660.67 | 51,000 |
| magic-dragon | 47,400 | 13 | 3,646.15 | 45,000 |
| many-armed-guardian | 27,950 | 11 | 2,540.91 | 39,000 |
| stone-gargoyle | 14,820 | 8 | 1,852.5 | 15,600 |
| emerald-dragon | 12,825 | 7 | 1,832.14 | 13,500 |
| battle-boar | 9,516 | 6 | 1,586 | 11,700 |
| water-elemental | 4,636 | 3 | 1,545.33 | 5,700 |

| row | damage | silver | a silver | soldier chunks | monster chunks | a soldier | a monster | dragon coins | monster stacks | soldier stacks | troop stacks | hired stacks ≤ 10 | monster types |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Complete optimization · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| Complete optimization · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| Complete optimization · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| top 1 monster types · silver-saver | 33,098,365 | 35,239,300 | 0.939 | 11 | 12 | 3,008,942.27 | 2,758,197.08 | 6,720 | 2 | 1 | 10 | 10 | 2 |
| top 1 monster types · sweet-spot | 40,404,802 | 46,599,100 | 0.867 | 11 | 15 | 3,673,163.82 | 2,693,653.47 | 9,240 | 2 | 1 | 5 | 7 | 2 |
| top 1 monster types · more-mercs | 39,270,632 | 36,387,700 | 1.079 | 22 | 12 | 1,785,028.73 | 3,272,552.67 | 6,720 | 2 | 1 | 9 | 7 | 2 |
| top 1 monster types · steady-max | 50,218,827 | 53,676,700 | 0.936 | 28 | 21 | 1,793,529.54 | 2,391,372.71 | 14,280 | 2 | 1 | 2 | 4 | 2 |
| top 1 monster types · all-in | 42,800,741 | 42,271,600 | 1.013 | 30 | 24 | 1,426,691.37 | 1,783,364.21 | 16,800 | 2 | 1 | 1 | 4 | 2 |
| top 2 monster types · sweet-spot | 54,157,469 | 44,659,800 | 1.213 | 11 | 15 | 4,923,406.27 | 3,610,497.93 | 9,560 | 3 | 1 | 5 | 12 | 3 |
| top 2 monster types · more-mercs | 57,402,428 | 44,659,800 | 1.285 | 22 | 12 | 2,609,201.27 | 4,783,535.67 | 9,560 | 2 | 1 | 5 | 6 | 3 |
| top 2 monster types · steady-max | 58,777,523 | 44,659,800 | 1.316 | 28 | 15 | 2,099,197.25 | 3,918,501.53 | 9,560 | 3 | 1 | 5 | 9 | 3 |
| top 3 monster types · silver-saver | 50,491,190 | 33,652,000 | 1.500 | 20 | 16 | 2,524,559.5 | 3,155,699.38 | 10,240 | 4 | 1 | 10 | 16 | 4 |
| top 3 monster types · sweet-spot | 57,861,641 | 39,019,000 | 1.483 | 22 | 16 | 2,630,074.59 | 3,616,352.56 | 10,240 | 4 | 1 | 7 | 16 | 4 |
| top 3 monster types · more-mercs | 64,628,936 | 42,518,200 | 1.520 | 28 | 16 | 2,308,176.29 | 4,039,308.5 | 10,240 | 4 | 1 | 5 | 16 | 4 |
| top 3 monster types · steady-max | 71,238,170 | 45,275,800 | 1.573 | 28 | 22 | 2,544,220.36 | 3,238,098.64 | 15,160 | 4 | 1 | 5 | 10 | 4 |
| top 3 monster types · all-in | 73,177,574 | 47,947,200 | 1.526 | 30 | 28 | 2,439,252.47 | 2,613,484.79 | 20,480 | 4 | 1 | 4 | 4 | 4 |
| top 4 monster types · sweet-spot | 69,825,968 | 39,369,000 | 1.774 | 22 | 20 | 3,173,907.64 | 3,491,298.4 | 13,760 | 5 | 1 | 6 | 20 | 5 |
| top 4 monster types · more-mercs | 70,470,290 | 39,369,000 | 1.790 | 25 | 20 | 2,818,811.6 | 3,523,514.5 | 13,760 | 5 | 1 | 6 | 20 | 5 |
| top 4 monster types · steady-max | 84,506,858 | 45,385,800 | 1.862 | 28 | 23 | 3,018,102.07 | 3,674,211.22 | 16,160 | 5 | 1 | 5 | 17 | 5 |
| top 6 monster types · sweet-spot | 70,137,445 | 34,543,200 | 2.030 | 14 | 32 | 5,009,817.5 | 2,191,795.16 | 19,360 | 7 | 1 | 10 | 24 | 7 |
| top 6 monster types · more-mercs | 76,915,780 | 34,543,200 | 2.227 | 22 | 32 | 3,496,171.82 | 2,403,618.13 | 19,360 | 7 | 1 | 10 | 24 | 7 |
| top 6 monster types · steady-max | 90,926,194 | 40,072,200 | 2.269 | 28 | 35 | 3,247,364.07 | 2,597,891.26 | 21,160 | 7 | 1 | 7 | 21 | 7 |
| top 6 monster types · all-in | 92,141,605 | 42,022,000 | 2.193 | 30 | 40 | 3,071,386.83 | 2,303,540.13 | 23,360 | 7 | 1 | 7 | 20 | 7 |
| top 8 monster types · sweet-spot | 92,130,493 | 34,820,400 | 2.646 | 25 | 38 | 3,685,219.72 | 2,424,486.66 | 22,440 | 9 | 1 | 10 | 34 | 9 |
| top 8 monster types · more-mercs | 95,426,005 | 34,928,400 | 2.732 | 28 | 41 | 3,408,071.61 | 2,327,463.54 | 23,640 | 9 | 1 | 10 | 31 | 9 |
| top 8 monster types · steady-max | 101,674,807 | 36,336,000 | 2.798 | 28 | 47 | 3,631,243.11 | 2,163,293.77 | 26,520 | 9 | 1 | 9 | 25 | 9 |
| top 8 monster types · all-in | 102,971,902 | 37,316,000 | 2.759 | 30 | 48 | 3,432,396.73 | 2,145,247.96 | 27,040 | 9 | 1 | 9 | 24 | 9 |

The hardest campaign of the narrowed family is **top 8 monster types · all-in** — 102,971,902 damage for 37,316,000 silver on 48 monster chunks and 30 soldier chunks. Against the plan’s own steady max that is 8.0 % more damage for 5.2 % more silver and 36 **fewer** monster chunks, and its damage a monster is 2,145,247.96 against 1,135,104.08 (×1.890). Against the best sizer sequence it stands at 0.984 on damage (the bar today: 0.911) and 0.964 on damage a monster (today: 0.510).

The four types the narrowing leaves out at k = 8 are **stone-gargoyle, emerald-dragon, battle-boar, water-elemental** — and they are exactly the four the best sizer sequence never fields (§C). Nothing was tuned to make that happen: the ranking is damage a point of dominance, and the sizer reaches the same four by filling the pool from the top of its own order.

### D2 — a per-type minimum: a stack that costs a chunk fields a chunk’s worth

The chunk is the **game’s own** (`CHUNK = 10`, `src/engine/recovery.ts`: the game trains and revives ten at a time, and one in every chunk comes back free), not a tuning constant — which is why a minimum stated at it needs no calibration. Two readings are measured below: **drop**, where a hired stack under ten units is left out of the march, and **raise**, where it is grown to ten if the shelter and the pool allow and dropped otherwise.

The **room** the shelter leaves a monster type on the steady max’s own march:

| type | fielded | HP each | most the shelter allows | ten units’ HP | a chunk’s worth fits? |
|---|---|---|---|---|---|
| battle-boar | 3 | 11,700 | 38 | 117,000 | yes |
| desert-vanquisher | 3 | 126,000 | 3 | 1,260,000 | **no — ten units stand over the troop floor** |
| emerald-dragon | 1 | 13,500 | 33 | 135,000 | yes |
| ettin | 3 | 144,000 | 3 | 1,440,000 | **no — ten units stand over the troop floor** |
| fearsome-manticore | 3 | 138,000 | 3 | 1,380,000 | **no — ten units stand over the troop floor** |
| flaming-centaur | 3 | 132,000 | 3 | 1,320,000 | **no — ten units stand over the troop floor** |
| gorgon-medusa | 12 | 36,000 | 12 | 360,000 | yes |
| ice-phoenix | 8 | 51,000 | 8 | 510,000 | **no — ten units stand over the troop floor** |
| magic-dragon | 2 | 45,000 | 9 | 450,000 | **no — ten units stand over the troop floor** |
| many-armed-guardian | 11 | 39,000 | 11 | 390,000 | yes |
| water-elemental | 76 | 5,700 | 78 | 57,000 | yes |
| bear-5 | 4 | 66,000 | 6 | 660,000 | **no — ten units stand over the troop floor** |
| epic-monster-hunter-6 | 69 | 6,090 | 73 | 60,900 | yes |

(The lowest troop stack on that march is 449,280 HP.)

| row | damage | silver | a silver | soldier chunks | monster chunks | a soldier | a monster | dragon coins | monster stacks | soldier stacks | troop stacks | hired stacks ≤ 10 | monster types |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Complete optimization · sweet-spot | 91,948,255 | 35,274,000 | 2.607 | 28 | 69 | 3,283,866.25 | 1,332,583.41 | 28,440 | 10 | 1 | 10 | 30 | 13 |
| Complete optimization · more-mercs | 94,687,477 | 35,349,600 | 2.679 | 28 | 78 | 3,381,695.61 | 1,213,942.01 | 29,520 | 10 | 1 | 10 | 30 | 13 |
| Complete optimization · steady-max | 95,348,743 | 35,458,800 | 2.689 | 28 | 84 | 3,405,312.25 | 1,135,104.08 | 31,080 | 12 | 1 | 10 | 36 | 13 |
| a 10-unit minimum (drop) · sweet-spot | 43,317,287 | 33,281,600 | 1.302 | 28 | 39 | 1,547,045.96 | 1,110,699.67 | 9,360 | 3 | 1 | 10 | 0 | 6 |
| a 10-unit minimum (drop) · more-mercs | 46,769,447 | 33,357,200 | 1.402 | 28 | 48 | 1,670,337.39 | 974,363.48 | 10,440 | 3 | 1 | 10 | 0 | 6 |
| a 10-unit minimum (drop) · steady-max | 46,685,999 | 33,357,200 | 1.400 | 28 | 48 | 1,667,357.11 | 972,624.98 | 10,440 | 3 | 1 | 10 | 0 | 6 |
| a 10-unit minimum (raise) · sweet-spot | 45,935,595 | 33,357,200 | 1.377 | 28 | 41 | 1,640,556.96 | 1,120,380.37 | 10,200 | 3 | 1 | 10 | 2 | 6 |
| a 10-unit minimum (raise) · more-mercs | 49,387,755 | 33,432,800 | 1.477 | 28 | 50 | 1,763,848.39 | 987,755.1 | 11,280 | 3 | 1 | 10 | 2 | 6 |
| a 10-unit minimum (raise) · steady-max | 50,843,307 | 33,491,600 | 1.518 | 28 | 53 | 1,815,832.39 | 959,307.68 | 12,120 | 4 | 1 | 10 | 5 | 6 |

### D3 — S-58 B relaxed for the dominance pool

The flag is one switch in the engine, so the measurement above (§B) is the whole hired set at once. It reads as “relaxed for the dominance pool alone” exactly when the stops it produces still field both mercenary types — which the table below answers.

| stop | S-58 B on: types fielded | S-58 B off: types fielded | still fields both mercenaries? |
|---|---|---|---|
| sweet-spot | 14 | 14 | yes |
| more-mercs | 14 | 14 | yes |
| steady-max | 14 | 14 | yes |

## §D — the ten older scenarios: what each candidate would do to them

| scenario | dominance types held | stops | hired stacks under ten units, over every stop’s marches | S-58 B off: stops | S-58 B off: damage of the hardest stop | identical? |
|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 0 | 1 | 1 | 1 | 18,189,008 | byte-identical |
| first-run army, Bear V ×2 (20 000 leadership) | 0 | 1 | 2 | 1 | 18,413,408 | byte-identical |
| first-run army, Bear V ×3 (20 000 leadership) | 0 | 2 | 6 | 2 | 18,750,008 | byte-identical |
| first-run army, Bear V ×10 (20 000 leadership) | 0 | 2 | 8 | 2 | 20,893,375 | byte-identical |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 0 | 3 | 0 | 3 | 29,841,879 | byte-identical |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 0 | 3 | 32 | 3 | 8,519,930 | byte-identical |
| 2026-09-17 export, its setup (7 000 leadership) | 0 | 5 | 12 | 5 | 23,619,920 | byte-identical |
| 2026-09-17 export, 12 000 leadership | 0 | 3 | 3 | 3 | 31,963,845 | byte-identical |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 0 | 4 | 0 | 4 | 29,743,332 | byte-identical |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 0 | 5 | 20 | 5 | 31,714,657 | byte-identical |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 0 | 3 | 12 | 3 | 18,744,735 | byte-identical |

**D1 on the ten older scenarios.** The fix D1 measures is a *shape family* — the plan over a prefix of the hired types ranked by damage a point of their own pool — so on an army it would add shapes rather than remove types. A shape family can only change a bar by **winning**, so the question is whether any prefix beats what the search already offers. Measured: every prefix of every older army’s hired ranking, planned under the same budgets, against that army’s own hardest stop.

| scenario | hired types | prefix | hardest stop | burn | silver | beats the bar? |
|---|---|---|---|---|---|---|
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 4 | the bar as it stands | 8,519,930 | 24 | 6,083,200 | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 4 | top 1 (epic-monster-hunter-6) | 4,167,506 | 6 | 6,020,000 | no |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 4 | top 2 (epic-monster-hunter-6, arbalester-6) | 5,920,323 | 13 | 6,041,600 | no |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 4 | top 3 (epic-monster-hunter-6, arbalester-6, chariot-6) | 7,479,048 | 17 | 6,002,800 | no |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | the bar as it stands | 23,619,920 | 92 | 15,179,600 | — |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | top 1 (epic-monster-hunter-6) | 14,115,968 | 50 | 15,179,600 | no |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | top 2 (epic-monster-hunter-6, chariot-6) | 16,633,581 | 42 | 13,108,000 | no |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | top 3 (epic-monster-hunter-6, chariot-6, arbalester-6) | 20,352,118 | 49 | 12,368,200 | no |
| 2026-09-17 export, 12 000 leadership | 4 | the bar as it stands | 31,963,845 | 82 | 21,035,600 | — |
| 2026-09-17 export, 12 000 leadership | 4 | top 1 (epic-monster-hunter-6) | 22,287,621 | 40 | 20,900,300 | no |
| 2026-09-17 export, 12 000 leadership | 4 | top 2 (epic-monster-hunter-6, chariot-6) | 25,656,701 | 48 | 20,900,300 | no |
| 2026-09-17 export, 12 000 leadership | 4 | top 3 (epic-monster-hunter-6, chariot-6, arbalester-6) | 30,197,853 | 64 | 20,900,300 | no |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 4 | the bar as it stands | 31,714,657 | 88 | 18,768,000 | — |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 4 | top 1 (epic-monster-hunter-6) | 19,319,692 | 30 | 20,004,000 | no |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 4 | top 2 (epic-monster-hunter-6, chariot-6) | 21,265,444 | 34 | 20,004,000 | no |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 4 | top 3 (epic-monster-hunter-6, chariot-6, arbalester-6) | 26,695,074 | 56 | 20,004,000 | no |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 4 | the bar as it stands | 18,744,735 | 111 | 11,240,800 | — |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 4 | top 1 (epic-monster-hunter-6) | 8,889,914 | 30 | 10,822,000 | no |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 4 | top 2 (epic-monster-hunter-6, arbalester-6) | 11,864,496 | 42 | 9,182,600 | no |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 4 | top 3 (epic-monster-hunter-6, arbalester-6, chariot-6) | 13,564,968 | 46 | 9,301,200 | no |

## §E — assessment

**The figures §E stands on.** The bar’s steady max: 95,348,743 damage, 35,458,800 silver, 28 soldier and 84 monster chunks, 1,135,104.08 a monster. The same stop over the top **8** monster types: 101,674,807, 36,336,000, 28 and 47, 2,163,293.77 a monster — 6.6 % more damage for 2.5 % more silver on 37 fewer monster chunks. The best sizer sequence: 104,626,942, 37,290,800, 30 and 47, 2,226,105.15 a monster.

**Root cause.** The plan’s extra monster chunks are not bought, they are **compulsory**. The grid the
search sweeps builds one count per hired type from that type’s own maximum, and neither of the two
lists it draws from contains a zero: the four *crossed* types read `[max, 0.7 max, 0.45 max, 0.2 max,
min(10, max)]` under S-58 A’s `tokenFloor`, and every further type — ten of the fourteen on this camp —
rides `shares = [1, 0.7, 0.45, 0.2]`. **No vector the search prices ever leaves a hired type out**, so
every march it can offer pays a chunk of ten for every type the account holds, whatever that type is
worth. The 900-dominance pool then has to be split twelve ways, and the shelter (`ceil(floor / hp) − 1`)
cuts each share down to the few units that stand under a 449 280-HP troop rung, which is where the
“many tiny stacks” come from: on the steady max’s own march, eight of the eleven dominance stacks are
ten units or fewer, and the four types that are worth least a point of dominance hold **48 % of the
march’s monster chunks for 5 % of its damage** (§B) — a single emerald dragon is a whole chunk for
76 950. The sizer is under no such obligation — `sizeStacks` fills the pool from the top of its own
order and stops — so it fields nine hired types instead of fourteen, bigger, and spends 47 monster
chunks over the campaign where the plan spends 84. Neither S-58 A nor S-58 B is the lever: with either
or both off the bar is byte-identical here (§B), because the constraint is the **grid’s shape**, not
the band’s refusals.

**The candidate fix, as a computation.** Add one shape family to the search, the hired mirror of S-93’s
troop prefix: rank the hired types by **damage a point of their own pool** (`damagePerUnit / cost`,
which `effectiveTable` already computes), and for each k in 1…|hired| score the shapes built from the
first k types alone — the same vectors, the same ladder and sizer shapes, the same shelter, with the
other types held at zero. Nothing else changes: `marchOf` already bills every non-leadership stack by
`chunks(n)`, so a march that drops a type is scored as the thrift it is, and the band, the burn ladder
and the stop rules read it like any other candidate. Measured here by narrowing the *request* instead
of the search (§D1), which offers the search the same marches: the top-8 prefix is the one that pays,
and the four types it leaves out are exactly the four the best sizer sequence never fields.

**The trade, per scenario.** On the monster camp it is a gain on three readings and a loss on one:
the steady max goes from 0.911 to 0.972 of the best sizer sequence on damage, from 0.510 to 0.972 on
damage a monster, and from 84 monster chunks to 47 — the sizer’s own figure — for 2.5 % more silver
(damage a silver 2.689 → 2.798, which is **better**, so the extra silver buys more than it costs).
On the ten older scenarios the table above is the whole of it — no prefix of any of them beats that
army’s own hardest stop on damage while spending no more burn and no more silver, so the family adds
shapes that never win and those bars stand. That is a measured claim about the *marches*, not a proof
about the engine: a new shape family also adds rungs to the burn ladder, and a rung that is not a
winner can still move the knee, so an implementation has to be re-benchmarked rather than argued from
this table.

**The refuted candidate.** A per-type minimum of a chunk’s worth (D2) is the wrong shape of rule and
the measurement says so plainly: the monsters worth fielding are exactly the ones whose ten units will
not fit under the troop floor (a flaming centaur is 132 000 HP against a 449 280-HP rung — ten of them
is three times the floor), so a ten-unit minimum deletes the high-damage monsters and keeps the cheap
ones, and the bar loses more than half its damage. The chunk itself is the game’s own (`CHUNK = 10`),
not a constant this repo chose, which is why it is worth stating and worth refusing on evidence rather
than on taste.

**Does it need the owner’s decision?** Two things do. First, whether a bar that fields **8 of the 12**
dominance types is acceptable at all: S-58 B is his own rule — *“a plan the player is offered fields a
little of everything they hold”* — and although the flag is not what causes this (§B), a prefix family
that wins by dropping four monster types is a march that fields less than everything, which is the
shape of plan he asked the bar not to show. The four dropped types are the four cheapest a point of
dominance, and his own best sizer row drops the same four, which is the argument for it. Second, the
silver: the top-8 steady max spends 2.5 % more silver than today’s. The benchmark’s silver pin is on
the **ratio**, not the spend — the plan’s best damage a silver must reach 95 % of the best sizer
sequence’s — and that reading *improves*, 2.689 / 2.806 = 0.958 today against 2.798 / 2.806 = 0.997
narrowed, so the pin is not the question. Whether a march that costs 877 000 more silver a campaign
for 6.6 % more damage and half the monsters is the trade he wants is.
