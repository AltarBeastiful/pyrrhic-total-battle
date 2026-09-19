# 110 — where monsters stand in the generated stack

The enemy wipes the highest-HP living stack first, so a stack of a rare resource at or above the lowest **troop** stack is the enemy’s first kill. A row marked **EXPOSED** is one of those.

A *monster mercenary* is a `mercenary` tagged `monster` (Bear V, Cyclops V, Gargoyle V …), paid from the **authority** pool. A *dominance monster* is the `monsters.json` table, `pool === "dominance"` — TotalStack’s `monsterMinTier`/`monsterMaxTier` units. The owner’s camps hold only the first kind, so the second is measured on a synthetic camp built here.

The data knows 28 dominance monsters (tiers 3–9) and 28 monster mercenaries.

## first-run army, Bear V ×1 (20 000 leadership)

Monster types in the army: bear-5 (monster merc (authority)). Housing L 20,000 · A 40,000 · D 0.

## first-run army, Bear V ×1 (20 000 leadership) — (a) the plan’s stops


### sweet-spot (elite) — 4 marches, 1 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

**the troops-only tail (×3)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **1** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 0 dominance type(s), housing 0).

## first-run army, Bear V ×1 (20 000 leadership) — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

**Troops first (`ms`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

## first-run army, Bear V ×2 (20 000 leadership)

Monster types in the army: bear-5 (monster merc (authority)). Housing L 20,000 · A 40,000 · D 0.

## first-run army, Bear V ×2 (20 000 leadership) — (a) the plan’s stops


### sweet-spot (elite) — 4 marches, 1 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 2 | 132,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 1 | 66,000 | monster merc (authority) |

**the troops-only tail (×2)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **2** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 0 dominance type(s), housing 0).

## first-run army, Bear V ×2 (20 000 leadership) — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 2 | 132,000 | monster merc (authority) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 2 | 132,000 | monster merc (authority) |

**Troops first (`ms`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 2 | 132,000 | monster merc (authority) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 2 | 132,000 | monster merc (authority) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 2 | 132,000 | monster merc (authority) |

## first-run army, Bear V ×10 (20 000 leadership)

Monster types in the army: bear-5 (monster merc (authority)). Housing L 20,000 · A 40,000 · D 0.

## first-run army, Bear V ×10 (20 000 leadership) — (a) the plan’s stops


### sweet-spot (elite) — 4 marches, 1 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 6 | 396,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 6 | 396,000 | monster merc (authority) |

### all-in (ms) — 4 marches, 1 burned

**march 1 of the sequence** — lowest troop stack 826,560 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 5,573 | 835,950 | troop (leadership) |
| 2 | archer-2 | 3,090 | 834,300 | troop (leadership) |
| 3 | spearman-2 | 3,084 | 832,680 | troop (leadership) |
| 4 | rider-2 | 1,539 | 831,060 | troop (leadership) |
| 5 | archer-3 | 1,728 | 829,440 | troop (leadership) |
| 6 | spearman-3 | 1,725 | 828,000 | troop (leadership) |
| 7 | rider-3 | 861 | 826,560 | troop (leadership) |
| 8 | bear-5 | 10 | 660,000 | monster merc (authority) |

**march 2 of the sequence** — lowest troop stack 646,080 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 4,366 | 654,900 | troop (leadership) |
| 2 | rider-1 | 2,178 | 653,400 | troop (leadership) |
| 3 | archer-2 | 2,416 | 652,320 | troop (leadership) |
| 4 | spearman-2 | 2,411 | 650,970 | troop (leadership) |
| 5 | rider-2 | 1,203 | 649,620 | troop (leadership) |
| 6 | archer-3 | 1,351 | 648,480 | troop (leadership) |
| 7 | spearman-3 | 1,348 | 647,040 | troop (leadership) |
| 8 | rider-3 | 673 | 646,080 | troop (leadership) |
| 9 | bear-5 | 9 | 594,000 | monster merc (authority) |

**march 3 of the sequence** — lowest troop stack 529,920 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 3,589 | 538,350 | troop (leadership) |
| 2 | spearman-1 | 3,582 | 537,300 | troop (leadership) |
| 3 | rider-1 | 1,788 | 536,400 | troop (leadership) |
| 4 | archer-2 | 1,982 | 535,140 | troop (leadership) |
| 5 | spearman-2 | 1,979 | 534,330 | troop (leadership) |
| 6 | rider-2 | 987 | 532,980 | troop (leadership) |
| 7 | archer-3 | 1,108 | 531,840 | troop (leadership) |
| 8 | spearman-3 | 1,106 | 530,880 | troop (leadership) |
| 9 | rider-3 | 552 | 529,920 | troop (leadership) |
| 10 | bear-5 | 8 | 528,000 | monster merc (authority) |

**march 4 of the sequence** — lowest troop stack 529,920 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 3,589 | 538,350 | troop (leadership) |
| 2 | spearman-1 | 3,582 | 537,300 | troop (leadership) |
| 3 | rider-1 | 1,788 | 536,400 | troop (leadership) |
| 4 | archer-2 | 1,982 | 535,140 | troop (leadership) |
| 5 | spearman-2 | 1,979 | 534,330 | troop (leadership) |
| 6 | rider-2 | 987 | 532,980 | troop (leadership) |
| 7 | archer-3 | 1,108 | 531,840 | troop (leadership) |
| 8 | spearman-3 | 1,106 | 530,880 | troop (leadership) |
| 9 | rider-3 | 552 | 529,920 | troop (leadership) |
| 10 | bear-5 | 7 | 462,000 | monster merc (authority) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **6** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 0 dominance type(s), housing 0).

## first-run army, Bear V ×10 (20 000 leadership) — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 449,280 HP; **1** rare stack(s) at or above it: bear-5 10 = 660,000 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | bear-5 | 10 | 660,000 | monster merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 5 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 6 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 7 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 8 | rider-2 | 837 | 451,980 | troop (leadership) |
| 9 | archer-3 | 939 | 450,720 | troop (leadership) |
| 10 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 11 | rider-3 | 468 | 449,280 | troop (leadership) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 449,280 HP; **1** rare stack(s) at or above it: bear-5 10 = 660,000 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | bear-5 | 10 | 660,000 | monster merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 5 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 6 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 7 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 8 | rider-2 | 837 | 451,980 | troop (leadership) |
| 9 | archer-3 | 939 | 450,720 | troop (leadership) |
| 10 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 11 | rider-3 | 468 | 449,280 | troop (leadership) |

**Troops first (`ms`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 6 | 396,000 | monster merc (authority) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 449,280 HP; **1** rare stack(s) at or above it: bear-5 7 = 462,000 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | bear-5 | 7 | 462,000 | monster merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 5 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 6 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 7 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 8 | rider-2 | 837 | 451,980 | troop (leadership) |
| 9 | archer-3 | 939 | 450,720 | troop (leadership) |
| 10 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 11 | rider-3 | 468 | 449,280 | troop (leadership) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | bear-5 | 6 | 396,000 | monster merc (authority) |

## synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180)

Monster types in the army: bear-5 (monster merc (authority)), cyclops-5 (monster merc (authority)), gargoyle-5 (monster merc (authority)). Housing L 20,000 · A 2,180 · D 0.

## synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) — (a) the plan’s stops


### sweet-spot (ms) — 4 marches, 4 burned

**the repeated march** — lowest troop stack 1,145,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-2 | 4,285 | 1,156,950 | troop (leadership) |
| 2 | spearman-2 | 4,276 | 1,154,520 | troop (leadership) |
| 3 | rider-2 | 2,133 | 1,151,820 | troop (leadership) |
| 4 | archer-3 | 2,396 | 1,150,080 | troop (leadership) |
| 5 | spearman-3 | 2,391 | 1,147,680 | troop (leadership) |
| 6 | rider-3 | 1,193 | 1,145,280 | troop (leadership) |
| 7 | gargoyle-5 | 20 | 1,140,000 | monster merc (authority) |
| 8 | cyclops-5 | 4 | 540,000 | monster merc (authority) |
| 9 | bear-5 | 4 | 264,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | cyclops-5 | 3 | 405,000 | monster merc (authority) |
| 12 | gargoyle-5 | 7 | 399,000 | monster merc (authority) |
| 13 | bear-5 | 3 | 198,000 | monster merc (authority) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **6** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 0 dominance type(s), housing 0).

## synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 449,280 HP; **2** rare stack(s) at or above it: gargoyle-5 94 = 5,358,000 HP (monster merc (authority)), cyclops-5 6 = 810,000 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | gargoyle-5 | 94 | 5,358,000 | monster merc (authority) — **EXPOSED** |
| 2 | cyclops-5 | 6 | 810,000 | monster merc (authority) — **EXPOSED** |
| 3 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 4 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 5 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 6 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 7 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 8 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 9 | rider-2 | 837 | 451,980 | troop (leadership) |
| 10 | archer-3 | 939 | 450,720 | troop (leadership) |
| 11 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 12 | rider-3 | 468 | 449,280 | troop (leadership) |
| 13 | bear-5 | 6 | 396,000 | monster merc (authority) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 449,280 HP; **2** rare stack(s) at or above it: gargoyle-5 94 = 5,358,000 HP (monster merc (authority)), cyclops-5 6 = 810,000 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | gargoyle-5 | 94 | 5,358,000 | monster merc (authority) — **EXPOSED** |
| 2 | cyclops-5 | 6 | 810,000 | monster merc (authority) — **EXPOSED** |
| 3 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 4 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 5 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 6 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 7 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 8 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 9 | rider-2 | 837 | 451,980 | troop (leadership) |
| 10 | archer-3 | 939 | 450,720 | troop (leadership) |
| 11 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 12 | rider-3 | 468 | 449,280 | troop (leadership) |
| 13 | bear-5 | 6 | 396,000 | monster merc (authority) |

**Troops first (`ms`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | cyclops-5 | 3 | 405,000 | monster merc (authority) |
| 12 | gargoyle-5 | 7 | 399,000 | monster merc (authority) |
| 13 | bear-5 | 6 | 396,000 | monster merc (authority) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 449,280 HP; **2** rare stack(s) at or above it: cyclops-5 4 = 540,000 HP (monster merc (authority)), gargoyle-5 8 = 456,000 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | cyclops-5 | 4 | 540,000 | monster merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | gargoyle-5 | 8 | 456,000 | monster merc (authority) — **EXPOSED** |
| 5 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 6 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 7 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 8 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 9 | rider-2 | 837 | 451,980 | troop (leadership) |
| 10 | archer-3 | 939 | 450,720 | troop (leadership) |
| 11 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 12 | rider-3 | 468 | 449,280 | troop (leadership) |
| 13 | bear-5 | 6 | 396,000 | monster merc (authority) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | cyclops-5 | 3 | 405,000 | monster merc (authority) |
| 12 | gargoyle-5 | 7 | 399,000 | monster merc (authority) |
| 13 | bear-5 | 6 | 396,000 | monster merc (authority) |

## synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6

Monster types in the army: battle-boar (monster (dominance)), desert-vanquisher (monster (dominance)), emerald-dragon (monster (dominance)), ettin (monster (dominance)), fearsome-manticore (monster (dominance)), flaming-centaur (monster (dominance)), gorgon-medusa (monster (dominance)), ice-phoenix (monster (dominance)), magic-dragon (monster (dominance)), many-armed-guardian (monster (dominance)), stone-gargoyle (monster (dominance)), water-elemental (monster (dominance)), bear-5 (monster merc (authority)). Housing L 20,000 · A 2,180 · D 900.

## synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 — (a) the plan’s stops


### sweet-spot (elite) — 4 marches, 7 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 60 | 365,400 | merc (authority) |
| 12 | bear-5 | 4 | 264,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 65 | 395,850 | merc (authority) |
| 12 | bear-5 | 3 | 198,000 | monster merc (authority) |

### steady-max (elite) — 4 marches, 8 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 69 | 420,210 | merc (authority) |
| 12 | bear-5 | 4 | 264,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 62 | 377,580 | merc (authority) |
| 12 | bear-5 | 3 | 198,000 | monster merc (authority) |

### all-in (elite) — 4 marches, 10 burned

**march 1 of the sequence** — lowest troop stack 529,920 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 3,589 | 538,350 | troop (leadership) |
| 2 | spearman-1 | 3,582 | 537,300 | troop (leadership) |
| 3 | rider-1 | 1,788 | 536,400 | troop (leadership) |
| 4 | archer-2 | 1,982 | 535,140 | troop (leadership) |
| 5 | spearman-2 | 1,979 | 534,330 | troop (leadership) |
| 6 | rider-2 | 987 | 532,980 | troop (leadership) |
| 7 | archer-3 | 1,108 | 531,840 | troop (leadership) |
| 8 | spearman-3 | 1,106 | 530,880 | troop (leadership) |
| 9 | rider-3 | 552 | 529,920 | troop (leadership) |
| 10 | epic-monster-hunter-6 | 83 | 505,470 | merc (authority) |
| 11 | bear-5 | 6 | 396,000 | monster merc (authority) |

**march 2 of the sequence** — lowest troop stack 529,920 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 3,589 | 538,350 | troop (leadership) |
| 2 | spearman-1 | 3,582 | 537,300 | troop (leadership) |
| 3 | rider-1 | 1,788 | 536,400 | troop (leadership) |
| 4 | archer-2 | 1,982 | 535,140 | troop (leadership) |
| 5 | spearman-2 | 1,979 | 534,330 | troop (leadership) |
| 6 | rider-2 | 987 | 532,980 | troop (leadership) |
| 7 | archer-3 | 1,108 | 531,840 | troop (leadership) |
| 8 | spearman-3 | 1,106 | 530,880 | troop (leadership) |
| 9 | rider-3 | 552 | 529,920 | troop (leadership) |
| 10 | epic-monster-hunter-6 | 74 | 450,660 | merc (authority) |
| 11 | bear-5 | 5 | 330,000 | monster merc (authority) |

**march 3 of the sequence** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 66 | 401,940 | merc (authority) |
| 12 | bear-5 | 4 | 264,000 | monster merc (authority) |

**march 4 of the sequence** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 59 | 359,310 | merc (authority) |
| 12 | bear-5 | 3 | 198,000 | monster merc (authority) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **8** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 12 dominance type(s), housing 900).

## synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 449,280 HP; **1** rare stack(s) at or above it: epic-monster-hunter-6 83 = 505,470 HP (merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | epic-monster-hunter-6 | 83 | 505,470 | merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 5 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 6 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 7 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 8 | rider-2 | 837 | 451,980 | troop (leadership) |
| 9 | archer-3 | 939 | 450,720 | troop (leadership) |
| 10 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 11 | rider-3 | 468 | 449,280 | troop (leadership) |
| 12 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 13 | water-elemental | 46 | 262,200 | monster (dominance) |
| 14 | battle-boar | 22 | 257,400 | monster (dominance) |
| 15 | emerald-dragon | 19 | 256,500 | monster (dominance) |
| 16 | gorgon-medusa | 7 | 252,000 | monster (dominance) |
| 17 | desert-vanquisher | 2 | 252,000 | monster (dominance) |
| 18 | stone-gargoyle | 16 | 249,600 | monster (dominance) |
| 19 | many-armed-guardian | 6 | 234,000 | monster (dominance) |
| 20 | magic-dragon | 5 | 225,000 | monster (dominance) |
| 21 | ice-phoenix | 4 | 204,000 | monster (dominance) |
| 22 | ettin | 1 | 144,000 | monster (dominance) |
| 23 | fearsome-manticore | 1 | 138,000 | monster (dominance) |
| 24 | flaming-centaur | 1 | 132,000 | monster (dominance) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 449,280 HP; **1** rare stack(s) at or above it: epic-monster-hunter-6 83 = 505,470 HP (merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | epic-monster-hunter-6 | 83 | 505,470 | merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 5 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 6 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 7 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 8 | rider-2 | 837 | 451,980 | troop (leadership) |
| 9 | archer-3 | 939 | 450,720 | troop (leadership) |
| 10 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 11 | rider-3 | 468 | 449,280 | troop (leadership) |
| 12 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 13 | water-elemental | 46 | 262,200 | monster (dominance) |
| 14 | battle-boar | 22 | 257,400 | monster (dominance) |
| 15 | emerald-dragon | 19 | 256,500 | monster (dominance) |
| 16 | gorgon-medusa | 7 | 252,000 | monster (dominance) |
| 17 | desert-vanquisher | 2 | 252,000 | monster (dominance) |
| 18 | stone-gargoyle | 16 | 249,600 | monster (dominance) |
| 19 | many-armed-guardian | 6 | 234,000 | monster (dominance) |
| 20 | magic-dragon | 5 | 225,000 | monster (dominance) |
| 21 | ice-phoenix | 4 | 204,000 | monster (dominance) |
| 22 | ettin | 1 | 144,000 | monster (dominance) |
| 23 | fearsome-manticore | 1 | 138,000 | monster (dominance) |
| 24 | flaming-centaur | 1 | 132,000 | monster (dominance) |

**Troops first (`ms`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 73 | 444,570 | merc (authority) |
| 12 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 13 | water-elemental | 46 | 262,200 | monster (dominance) |
| 14 | battle-boar | 22 | 257,400 | monster (dominance) |
| 15 | emerald-dragon | 19 | 256,500 | monster (dominance) |
| 16 | gorgon-medusa | 7 | 252,000 | monster (dominance) |
| 17 | desert-vanquisher | 2 | 252,000 | monster (dominance) |
| 18 | stone-gargoyle | 16 | 249,600 | monster (dominance) |
| 19 | many-armed-guardian | 6 | 234,000 | monster (dominance) |
| 20 | magic-dragon | 5 | 225,000 | monster (dominance) |
| 21 | ice-phoenix | 4 | 204,000 | monster (dominance) |
| 22 | ettin | 1 | 144,000 | monster (dominance) |
| 23 | fearsome-manticore | 1 | 138,000 | monster (dominance) |
| 24 | flaming-centaur | 1 | 132,000 | monster (dominance) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 73 | 444,570 | merc (authority) |
| 12 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 13 | water-elemental | 46 | 262,200 | monster (dominance) |
| 14 | battle-boar | 22 | 257,400 | monster (dominance) |
| 15 | emerald-dragon | 19 | 256,500 | monster (dominance) |
| 16 | gorgon-medusa | 7 | 252,000 | monster (dominance) |
| 17 | desert-vanquisher | 2 | 252,000 | monster (dominance) |
| 18 | stone-gargoyle | 16 | 249,600 | monster (dominance) |
| 19 | many-armed-guardian | 6 | 234,000 | monster (dominance) |
| 20 | magic-dragon | 5 | 225,000 | monster (dominance) |
| 21 | ice-phoenix | 4 | 204,000 | monster (dominance) |
| 22 | ettin | 1 | 144,000 | monster (dominance) |
| 23 | fearsome-manticore | 1 | 138,000 | monster (dominance) |
| 24 | flaming-centaur | 1 | 132,000 | monster (dominance) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 73 | 444,570 | merc (authority) |
| 12 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 13 | water-elemental | 46 | 262,200 | monster (dominance) |
| 14 | battle-boar | 22 | 257,400 | monster (dominance) |
| 15 | emerald-dragon | 19 | 256,500 | monster (dominance) |
| 16 | gorgon-medusa | 7 | 252,000 | monster (dominance) |
| 17 | desert-vanquisher | 2 | 252,000 | monster (dominance) |
| 18 | stone-gargoyle | 16 | 249,600 | monster (dominance) |
| 19 | many-armed-guardian | 6 | 234,000 | monster (dominance) |
| 20 | magic-dragon | 5 | 225,000 | monster (dominance) |
| 21 | ice-phoenix | 4 | 204,000 | monster (dominance) |
| 22 | ettin | 1 | 144,000 | monster (dominance) |
| 23 | fearsome-manticore | 1 | 138,000 | monster (dominance) |
| 24 | flaming-centaur | 1 | 132,000 | monster (dominance) |

## synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6

Monster types in the army: ancient-terror (monster (dominance)), battle-boar (monster (dominance)), black-dragon (monster (dominance)), crystal-dragon (monster (dominance)), desert-vanquisher (monster (dominance)), destructive-colossus (monster (dominance)), emerald-dragon (monster (dominance)), ettin (monster (dominance)), fearsome-manticore (monster (dominance)), flaming-centaur (monster (dominance)), gorgon-medusa (monster (dominance)), ice-phoenix (monster (dominance)), jungle-destroyer (monster (dominance)), magic-dragon (monster (dominance)), many-armed-guardian (monster (dominance)), ruby-golem (monster (dominance)), stone-gargoyle (monster (dominance)), troll-rider (monster (dominance)), water-elemental (monster (dominance)), wind-lord (monster (dominance)), bear-5 (monster merc (authority)). Housing L 20,000 · A 2,180 · D 20,000.

## synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 — (a) the plan’s stops


### sweet-spot (elite) — 4 marches, 7 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 60 | 365,400 | merc (authority) |
| 12 | bear-5 | 4 | 264,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 65 | 395,850 | merc (authority) |
| 12 | bear-5 | 3 | 198,000 | monster merc (authority) |

### steady-max (elite) — 4 marches, 8 burned

**the repeated march** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 69 | 420,210 | merc (authority) |
| 12 | bear-5 | 4 | 264,000 | monster merc (authority) |

**the finale** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 62 | 377,580 | merc (authority) |
| 12 | bear-5 | 3 | 198,000 | monster merc (authority) |

### all-in (elite) — 4 marches, 10 burned

**march 1 of the sequence** — lowest troop stack 529,920 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 3,589 | 538,350 | troop (leadership) |
| 2 | spearman-1 | 3,582 | 537,300 | troop (leadership) |
| 3 | rider-1 | 1,788 | 536,400 | troop (leadership) |
| 4 | archer-2 | 1,982 | 535,140 | troop (leadership) |
| 5 | spearman-2 | 1,979 | 534,330 | troop (leadership) |
| 6 | rider-2 | 987 | 532,980 | troop (leadership) |
| 7 | archer-3 | 1,108 | 531,840 | troop (leadership) |
| 8 | spearman-3 | 1,106 | 530,880 | troop (leadership) |
| 9 | rider-3 | 552 | 529,920 | troop (leadership) |
| 10 | epic-monster-hunter-6 | 83 | 505,470 | merc (authority) |
| 11 | bear-5 | 6 | 396,000 | monster merc (authority) |

**march 2 of the sequence** — lowest troop stack 529,920 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 3,589 | 538,350 | troop (leadership) |
| 2 | spearman-1 | 3,582 | 537,300 | troop (leadership) |
| 3 | rider-1 | 1,788 | 536,400 | troop (leadership) |
| 4 | archer-2 | 1,982 | 535,140 | troop (leadership) |
| 5 | spearman-2 | 1,979 | 534,330 | troop (leadership) |
| 6 | rider-2 | 987 | 532,980 | troop (leadership) |
| 7 | archer-3 | 1,108 | 531,840 | troop (leadership) |
| 8 | spearman-3 | 1,106 | 530,880 | troop (leadership) |
| 9 | rider-3 | 552 | 529,920 | troop (leadership) |
| 10 | epic-monster-hunter-6 | 74 | 450,660 | merc (authority) |
| 11 | bear-5 | 5 | 330,000 | monster merc (authority) |

**march 3 of the sequence** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 66 | 401,940 | merc (authority) |
| 12 | bear-5 | 4 | 264,000 | monster merc (authority) |

**march 4 of the sequence** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 59 | 359,310 | merc (authority) |
| 12 | bear-5 | 3 | 198,000 | monster merc (authority) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **8** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 20 dominance type(s), housing 20,000).

## synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 449,280 HP; **21** rare stack(s) at or above it: water-elemental 818 = 4,662,600 HP (monster (dominance)), battle-boar 396 = 4,633,200 HP (monster (dominance)), emerald-dragon 343 = 4,630,500 HP (monster (dominance)), stone-gargoyle 296 = 4,617,600 HP (monster (dominance)), gorgon-medusa 128 = 4,608,000 HP (monster (dominance)), magic-dragon 102 = 4,590,000 HP (monster (dominance)), many-armed-guardian 117 = 4,563,000 HP (monster (dominance)), ice-phoenix 89 = 4,539,000 HP (monster (dominance)), desert-vanquisher 36 = 4,536,000 HP (monster (dominance)), flaming-centaur 34 = 4,488,000 HP (monster (dominance)), ettin 31 = 4,464,000 HP (monster (dominance)), fearsome-manticore 32 = 4,416,000 HP (monster (dominance)), destructive-colossus 5 = 4,350,000 HP (monster (dominance)), crystal-dragon 12 = 4,320,000 HP (monster (dominance)), jungle-destroyer 11 = 4,290,000 HP (monster (dominance)), ruby-golem 11 = 4,290,000 HP (monster (dominance)), troll-rider 13 = 4,290,000 HP (monster (dominance)), ancient-terror 5 = 4,200,000 HP (monster (dominance)), wind-lord 4 = 3,720,000 HP (monster (dominance)), black-dragon 4 = 3,600,000 HP (monster (dominance)), epic-monster-hunter-6 83 = 505,470 HP (merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | water-elemental | 818 | 4,662,600 | monster (dominance) — **EXPOSED** |
| 2 | battle-boar | 396 | 4,633,200 | monster (dominance) — **EXPOSED** |
| 3 | emerald-dragon | 343 | 4,630,500 | monster (dominance) — **EXPOSED** |
| 4 | stone-gargoyle | 296 | 4,617,600 | monster (dominance) — **EXPOSED** |
| 5 | gorgon-medusa | 128 | 4,608,000 | monster (dominance) — **EXPOSED** |
| 6 | magic-dragon | 102 | 4,590,000 | monster (dominance) — **EXPOSED** |
| 7 | many-armed-guardian | 117 | 4,563,000 | monster (dominance) — **EXPOSED** |
| 8 | ice-phoenix | 89 | 4,539,000 | monster (dominance) — **EXPOSED** |
| 9 | desert-vanquisher | 36 | 4,536,000 | monster (dominance) — **EXPOSED** |
| 10 | flaming-centaur | 34 | 4,488,000 | monster (dominance) — **EXPOSED** |
| 11 | ettin | 31 | 4,464,000 | monster (dominance) — **EXPOSED** |
| 12 | fearsome-manticore | 32 | 4,416,000 | monster (dominance) — **EXPOSED** |
| 13 | destructive-colossus | 5 | 4,350,000 | monster (dominance) — **EXPOSED** |
| 14 | crystal-dragon | 12 | 4,320,000 | monster (dominance) — **EXPOSED** |
| 15 | jungle-destroyer | 11 | 4,290,000 | monster (dominance) — **EXPOSED** |
| 16 | ruby-golem | 11 | 4,290,000 | monster (dominance) — **EXPOSED** |
| 17 | troll-rider | 13 | 4,290,000 | monster (dominance) — **EXPOSED** |
| 18 | ancient-terror | 5 | 4,200,000 | monster (dominance) — **EXPOSED** |
| 19 | wind-lord | 4 | 3,720,000 | monster (dominance) — **EXPOSED** |
| 20 | black-dragon | 4 | 3,600,000 | monster (dominance) — **EXPOSED** |
| 21 | epic-monster-hunter-6 | 83 | 505,470 | merc (authority) — **EXPOSED** |
| 22 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 23 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 24 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 25 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 26 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 27 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 28 | rider-2 | 837 | 451,980 | troop (leadership) |
| 29 | archer-3 | 939 | 450,720 | troop (leadership) |
| 30 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 31 | rider-3 | 468 | 449,280 | troop (leadership) |
| 32 | bear-5 | 6 | 396,000 | monster merc (authority) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 449,280 HP; **1** rare stack(s) at or above it: epic-monster-hunter-6 83 = 505,470 HP (merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | epic-monster-hunter-6 | 83 | 505,470 | merc (authority) — **EXPOSED** |
| 2 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 3 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 4 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 5 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 6 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 7 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 8 | rider-2 | 837 | 451,980 | troop (leadership) |
| 9 | archer-3 | 939 | 450,720 | troop (leadership) |
| 10 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 11 | rider-3 | 468 | 449,280 | troop (leadership) |
| 12 | emerald-dragon | 33 | 445,500 | monster (dominance) |
| 13 | water-elemental | 78 | 444,600 | monster (dominance) |
| 14 | battle-boar | 38 | 444,600 | monster (dominance) |
| 15 | stone-gargoyle | 28 | 436,800 | monster (dominance) |
| 16 | gorgon-medusa | 12 | 432,000 | monster (dominance) |
| 17 | ettin | 3 | 432,000 | monster (dominance) |
| 18 | many-armed-guardian | 11 | 429,000 | monster (dominance) |
| 19 | fearsome-manticore | 3 | 414,000 | monster (dominance) |
| 20 | ice-phoenix | 8 | 408,000 | monster (dominance) |
| 21 | magic-dragon | 9 | 405,000 | monster (dominance) |
| 22 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 23 | flaming-centaur | 3 | 396,000 | monster (dominance) |
| 24 | jungle-destroyer | 1 | 390,000 | monster (dominance) |
| 25 | ruby-golem | 1 | 390,000 | monster (dominance) |
| 26 | desert-vanquisher | 3 | 378,000 | monster (dominance) |
| 27 | crystal-dragon | 1 | 360,000 | monster (dominance) |
| 28 | troll-rider | 1 | 330,000 | monster (dominance) |

**Troops first (`ms`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | emerald-dragon | 33 | 445,500 | monster (dominance) |
| 12 | water-elemental | 78 | 444,600 | monster (dominance) |
| 13 | battle-boar | 38 | 444,600 | monster (dominance) |
| 14 | epic-monster-hunter-6 | 73 | 444,570 | merc (authority) |
| 15 | stone-gargoyle | 28 | 436,800 | monster (dominance) |
| 16 | gorgon-medusa | 12 | 432,000 | monster (dominance) |
| 17 | ettin | 3 | 432,000 | monster (dominance) |
| 18 | many-armed-guardian | 11 | 429,000 | monster (dominance) |
| 19 | fearsome-manticore | 3 | 414,000 | monster (dominance) |
| 20 | ice-phoenix | 8 | 408,000 | monster (dominance) |
| 21 | magic-dragon | 9 | 405,000 | monster (dominance) |
| 22 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 23 | flaming-centaur | 3 | 396,000 | monster (dominance) |
| 24 | jungle-destroyer | 1 | 390,000 | monster (dominance) |
| 25 | ruby-golem | 1 | 390,000 | monster (dominance) |
| 26 | desert-vanquisher | 3 | 378,000 | monster (dominance) |
| 27 | crystal-dragon | 1 | 360,000 | monster (dominance) |
| 28 | troll-rider | 1 | 330,000 | monster (dominance) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 449,280 HP; **4** rare stack(s) at or above it: wind-lord 1 = 930,000 HP (monster (dominance)), black-dragon 1 = 900,000 HP (monster (dominance)), destructive-colossus 1 = 870,000 HP (monster (dominance)), ancient-terror 1 = 840,000 HP (monster (dominance))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | wind-lord | 1 | 930,000 | monster (dominance) — **EXPOSED** |
| 2 | black-dragon | 1 | 900,000 | monster (dominance) — **EXPOSED** |
| 3 | destructive-colossus | 1 | 870,000 | monster (dominance) — **EXPOSED** |
| 4 | ancient-terror | 1 | 840,000 | monster (dominance) — **EXPOSED** |
| 5 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 6 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 7 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 8 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 9 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 10 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 11 | rider-2 | 837 | 451,980 | troop (leadership) |
| 12 | archer-3 | 939 | 450,720 | troop (leadership) |
| 13 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 14 | rider-3 | 468 | 449,280 | troop (leadership) |
| 15 | emerald-dragon | 33 | 445,500 | monster (dominance) |
| 16 | water-elemental | 78 | 444,600 | monster (dominance) |
| 17 | battle-boar | 38 | 444,600 | monster (dominance) |
| 18 | epic-monster-hunter-6 | 73 | 444,570 | merc (authority) |
| 19 | stone-gargoyle | 28 | 436,800 | monster (dominance) |
| 20 | gorgon-medusa | 12 | 432,000 | monster (dominance) |
| 21 | ettin | 3 | 432,000 | monster (dominance) |
| 22 | many-armed-guardian | 11 | 429,000 | monster (dominance) |
| 23 | fearsome-manticore | 3 | 414,000 | monster (dominance) |
| 24 | ice-phoenix | 8 | 408,000 | monster (dominance) |
| 25 | magic-dragon | 9 | 405,000 | monster (dominance) |
| 26 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 27 | flaming-centaur | 3 | 396,000 | monster (dominance) |
| 28 | jungle-destroyer | 1 | 390,000 | monster (dominance) |
| 29 | ruby-golem | 1 | 390,000 | monster (dominance) |
| 30 | desert-vanquisher | 3 | 378,000 | monster (dominance) |
| 31 | crystal-dragon | 1 | 360,000 | monster (dominance) |
| 32 | troll-rider | 1 | 330,000 | monster (dominance) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 449,280 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | swordsman-1 | 3,048 | 457,200 | troop (leadership) |
| 2 | archer-1 | 3,042 | 456,300 | troop (leadership) |
| 3 | spearman-1 | 3,036 | 455,400 | troop (leadership) |
| 4 | rider-1 | 1,515 | 454,500 | troop (leadership) |
| 5 | archer-2 | 1,680 | 453,600 | troop (leadership) |
| 6 | spearman-2 | 1,677 | 452,790 | troop (leadership) |
| 7 | rider-2 | 837 | 451,980 | troop (leadership) |
| 8 | archer-3 | 939 | 450,720 | troop (leadership) |
| 9 | spearman-3 | 938 | 450,240 | troop (leadership) |
| 10 | rider-3 | 468 | 449,280 | troop (leadership) |
| 11 | epic-monster-hunter-6 | 73 | 444,570 | merc (authority) |
| 12 | bear-5 | 6 | 396,000 | monster merc (authority) |
| 13 | water-elemental | 69 | 393,300 | monster (dominance) |
| 14 | emerald-dragon | 29 | 391,500 | monster (dominance) |
| 15 | stone-gargoyle | 25 | 390,000 | monster (dominance) |
| 16 | many-armed-guardian | 10 | 390,000 | monster (dominance) |
| 17 | jungle-destroyer | 1 | 390,000 | monster (dominance) |
| 18 | ruby-golem | 1 | 390,000 | monster (dominance) |
| 19 | battle-boar | 33 | 386,100 | monster (dominance) |
| 20 | desert-vanquisher | 3 | 378,000 | monster (dominance) |
| 21 | gorgon-medusa | 10 | 360,000 | monster (dominance) |
| 22 | magic-dragon | 8 | 360,000 | monster (dominance) |
| 23 | crystal-dragon | 1 | 360,000 | monster (dominance) |
| 24 | ice-phoenix | 7 | 357,000 | monster (dominance) |
| 25 | troll-rider | 1 | 330,000 | monster (dominance) |
| 26 | ettin | 2 | 288,000 | monster (dominance) |
| 27 | fearsome-manticore | 2 | 276,000 | monster (dominance) |
| 28 | flaming-centaur | 2 | 264,000 | monster (dominance) |

## the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180)

Monster types in the army: bear-5 (monster merc (authority)). Housing L 4,975 · A 2,180 · D 0.

## the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) — (a) the plan’s stops


### sweet-spot (elite) — 4 marches, 8 burned

**the repeated march** — lowest troop stack 572,128 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | rider-1 | 978 | 575,064 | troop (leadership) |
| 2 | archer-2 | 1,329 | 574,128 | troop (leadership) |
| 3 | rider-2 | 541 | 572,378 | troop (leadership) |
| 4 | rider-3 | 304 | 572,128 | troop (leadership) |
| 5 | bear-5 | 6 | 566,280 | monster merc (authority) |
| 6 | arbalester-6 | 60 | 547,200 | merc (authority) |
| 7 | legionary-6 | 10 | 114,570 | merc (authority) |

**the finale** — lowest troop stack 274,772 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 2 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 3 | rider-1 | 470 | 276,360 | troop (leadership) |
| 4 | archer-2 | 639 | 276,048 | troop (leadership) |
| 5 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 6 | rider-2 | 260 | 275,080 | troop (leadership) |
| 7 | rider-3 | 146 | 274,772 | troop (leadership) |
| 8 | arbalester-6 | 30 | 273,600 | merc (authority) |
| 9 | legionary-6 | 23 | 263,511 | merc (authority) |
| 10 | bear-5 | 2 | 188,760 | monster merc (authority) |

### more-mercs (elite) — 4 marches, 9 burned

**the repeated march** — lowest troop stack 572,128 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | rider-1 | 978 | 575,064 | troop (leadership) |
| 2 | archer-2 | 1,329 | 574,128 | troop (leadership) |
| 3 | rider-2 | 541 | 572,378 | troop (leadership) |
| 4 | rider-3 | 304 | 572,128 | troop (leadership) |
| 5 | bear-5 | 6 | 566,280 | monster merc (authority) |
| 6 | arbalester-6 | 62 | 565,440 | merc (authority) |
| 7 | legionary-6 | 10 | 114,570 | merc (authority) |

**the finale** — lowest troop stack 274,772 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 2 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 3 | rider-1 | 470 | 276,360 | troop (leadership) |
| 4 | archer-2 | 639 | 276,048 | troop (leadership) |
| 5 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 6 | rider-2 | 260 | 275,080 | troop (leadership) |
| 7 | rider-3 | 146 | 274,772 | troop (leadership) |
| 8 | arbalester-6 | 30 | 273,600 | merc (authority) |
| 9 | legionary-6 | 23 | 263,511 | merc (authority) |
| 10 | bear-5 | 2 | 188,760 | monster merc (authority) |

### steady-max (ms) — 4 marches, 10 burned

**the repeated march** — lowest troop stack 696,340 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-2 | 1,625 | 702,000 | troop (leadership) |
| 2 | spearman-2 | 1,290 | 700,470 | troop (leadership) |
| 3 | rider-2 | 660 | 698,280 | troop (leadership) |
| 4 | rider-3 | 370 | 696,340 | troop (leadership) |
| 5 | arbalester-6 | 76 | 693,120 | merc (authority) |
| 6 | bear-5 | 7 | 660,660 | monster merc (authority) |
| 7 | legionary-6 | 10 | 114,570 | merc (authority) |

**the finale** — lowest troop stack 274,772 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 2 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 3 | rider-1 | 470 | 276,360 | troop (leadership) |
| 4 | archer-2 | 639 | 276,048 | troop (leadership) |
| 5 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 6 | rider-2 | 260 | 275,080 | troop (leadership) |
| 7 | rider-3 | 146 | 274,772 | troop (leadership) |
| 8 | arbalester-6 | 30 | 273,600 | merc (authority) |
| 9 | legionary-6 | 23 | 263,511 | merc (authority) |
| 10 | bear-5 | 2 | 188,760 | monster merc (authority) |

Over every march of every stop: **0** march(es) with a rare stack at or above the lowest troop stack; **6** monster stack(s) fielded, of which **0** from the dominance pool (the army holds 0 dominance type(s), housing 0).

## the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) — (b) the Battle card’s sizer methods


**Tier ladder (`elite`)** — lowest troop stack 274,772 HP; **3** rare stack(s) at or above it: bear-5 58 = 5,474,040 HP (monster merc (authority)), legionary-6 477 = 5,464,989 HP (merc (authority)), arbalester-6 485 = 4,423,200 HP (merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | bear-5 | 58 | 5,474,040 | monster merc (authority) — **EXPOSED** |
| 2 | legionary-6 | 477 | 5,464,989 | merc (authority) — **EXPOSED** |
| 3 | arbalester-6 | 485 | 4,423,200 | merc (authority) — **EXPOSED** |
| 4 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 5 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 6 | rider-1 | 470 | 276,360 | troop (leadership) |
| 7 | archer-2 | 639 | 276,048 | troop (leadership) |
| 8 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 9 | rider-2 | 260 | 275,080 | troop (leadership) |
| 10 | rider-3 | 146 | 274,772 | troop (leadership) |

**Tier ladder + *Monsters after troops* (`monstersLast`)** — lowest troop stack 274,772 HP; **3** rare stack(s) at or above it: bear-5 58 = 5,474,040 HP (monster merc (authority)), legionary-6 477 = 5,464,989 HP (merc (authority)), arbalester-6 485 = 4,423,200 HP (merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | bear-5 | 58 | 5,474,040 | monster merc (authority) — **EXPOSED** |
| 2 | legionary-6 | 477 | 5,464,989 | merc (authority) — **EXPOSED** |
| 3 | arbalester-6 | 485 | 4,423,200 | merc (authority) — **EXPOSED** |
| 4 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 5 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 6 | rider-1 | 470 | 276,360 | troop (leadership) |
| 7 | archer-2 | 639 | 276,048 | troop (leadership) |
| 8 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 9 | rider-2 | 260 | 275,080 | troop (leadership) |
| 10 | rider-3 | 146 | 274,772 | troop (leadership) |

**Troops first (`ms`)** — lowest troop stack 274,772 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 2 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 3 | rider-1 | 470 | 276,360 | troop (leadership) |
| 4 | archer-2 | 639 | 276,048 | troop (leadership) |
| 5 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 6 | rider-2 | 260 | 275,080 | troop (leadership) |
| 7 | rider-3 | 146 | 274,772 | troop (leadership) |
| 8 | arbalester-6 | 30 | 273,600 | merc (authority) |
| 9 | legionary-6 | 23 | 263,511 | merc (authority) |
| 10 | bear-5 | 2 | 188,760 | monster merc (authority) |

**Troops first + *Allow damage trades* (`msRelaxed`)** — lowest troop stack 274,772 HP; **1** rare stack(s) at or above it: bear-5 3 = 283,140 HP (monster merc (authority))

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | bear-5 | 3 | 283,140 | monster merc (authority) — **EXPOSED** |
| 2 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 3 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 4 | rider-1 | 470 | 276,360 | troop (leadership) |
| 5 | archer-2 | 639 | 276,048 | troop (leadership) |
| 6 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 7 | rider-2 | 260 | 275,080 | troop (leadership) |
| 8 | rider-3 | 146 | 274,772 | troop (leadership) |
| 9 | arbalester-6 | 30 | 273,600 | merc (authority) |
| 10 | legionary-6 | 23 | 263,511 | merc (authority) |

**Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)** — lowest troop stack 274,772 HP; **0** rare stack(s) at or above it

| kill order | stack | count | total HP | what |
|---|---|---|---|---|
| 1 | archer-1 | 1,158 | 277,920 | troop (leadership) |
| 2 | spearman-1 | 918 | 277,236 | troop (leadership) |
| 3 | rider-1 | 470 | 276,360 | troop (leadership) |
| 4 | archer-2 | 639 | 276,048 | troop (leadership) |
| 5 | spearman-2 | 508 | 275,844 | troop (leadership) |
| 6 | rider-2 | 260 | 275,080 | troop (leadership) |
| 7 | rider-3 | 146 | 274,772 | troop (leadership) |
| 8 | arbalester-6 | 30 | 273,600 | merc (authority) |
| 9 | legionary-6 | 23 | 263,511 | merc (authority) |
| 10 | bear-5 | 2 | 188,760 | monster merc (authority) |

## Summary — every army, every method

| army | method | stops | exposure | monsters |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | plan | 1 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 1 |
| first-run army, Bear V ×1 (20 000 leadership) | Tier ladder (`elite`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×1 (20 000 leadership) | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×1 (20 000 leadership) | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×1 (20 000 leadership) | Troops first + *Allow damage trades* (`msRelaxed`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×1 (20 000 leadership) | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×2 (20 000 leadership) | plan | 1 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 2 |
| first-run army, Bear V ×2 (20 000 leadership) | Tier ladder (`elite`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×2 (20 000 leadership) | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×2 (20 000 leadership) | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×2 (20 000 leadership) | Troops first + *Allow damage trades* (`msRelaxed`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×2 (20 000 leadership) | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×10 (20 000 leadership) | plan | 2 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 6 |
| first-run army, Bear V ×10 (20 000 leadership) | Tier ladder (`elite`) | — | 1 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×10 (20 000 leadership) | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 1 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×10 (20 000 leadership) | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×10 (20 000 leadership) | Troops first + *Allow damage trades* (`msRelaxed`) | — | 1 exposed stack(s) | monster stacks fielded: 1 |
| first-run army, Bear V ×10 (20 000 leadership) | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) | plan | 1 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 6 |
| synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) | Tier ladder (`elite`) | — | 2 exposed stack(s) | monster stacks fielded: 3 |
| synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 2 exposed stack(s) | monster stacks fielded: 3 |
| synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 3 |
| synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) | Troops first + *Allow damage trades* (`msRelaxed`) | — | 2 exposed stack(s) | monster stacks fielded: 3 |
| synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180) | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 3 |
| synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 | plan | 3 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 8 (dominance: 0 of 12 types held) |
| synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 | Tier ladder (`elite`) | — | 1 exposed stack(s) | monster stacks fielded: 13 |
| synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 1 exposed stack(s) | monster stacks fielded: 13 |
| synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 13 |
| synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 | Troops first + *Allow damage trades* (`msRelaxed`) | — | 0 exposed stack(s) | monster stacks fielded: 13 |
| synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6 | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 13 |
| synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 | plan | 3 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 8 (dominance: 0 of 20 types held) |
| synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 | Tier ladder (`elite`) | — | 21 exposed stack(s) | monster stacks fielded: 21 |
| synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 1 exposed stack(s) | monster stacks fielded: 17 |
| synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 17 |
| synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 | Troops first + *Allow damage trades* (`msRelaxed`) | — | 4 exposed stack(s) | monster stacks fielded: 21 |
| synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6 | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 17 |
| the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) | plan | 3 stops | 0 march(es) with an exposed rare stack | monster stacks fielded: 6 |
| the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) | Tier ladder (`elite`) | — | 3 exposed stack(s) | monster stacks fielded: 1 |
| the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) | Tier ladder + *Monsters after troops* (`monstersLast`) | — | 3 exposed stack(s) | monster stacks fielded: 1 |
| the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) | Troops first (`ms`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |
| the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) | Troops first + *Allow damage trades* (`msRelaxed`) | — | 1 exposed stack(s) | monster stacks fielded: 1 |
| the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180) | Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`) | — | 0 exposed stack(s) | monster stacks fielded: 1 |

## What this shows

### 1. On the plan side, monsters are not *unshielded* — they are **absent**

On the camp that holds 20 dominance types and 20 000 dominance housing, every sizer method fields 17
to 21 monster stacks and **the plan fields none**: `dominance: 0 of 20 types held`, on all three stops,
on every march of every stop, finale and tail included. The same on the 900-dominance camp (`0 of 12`).
So no plan stop can expose a monster, and `shelterUnder` is never reached with one.

Why (`src/engine/plan.ts`, every line pool-typed to `authority`):

| line | code | effect |
|---|---|---|
| `planCampaign` | `const mercTypes = table.filter((entry) => entry.pool === 'authority')` | the hired set the search sweeps holds no dominance type, so no monster count is ever a candidate |
| `planCampaign`, `unlimited` | `unit.pool === 'authority' && request.caps[unit.id] === undefined` | a monster has no `caps` entry either (caps come from `profile.mercenaries.selected`), so even widened it would read as a stock of nothing unless the pool bounds it |
| `sizer` | `units: request.units.filter((unit) => unit.pool === 'leadership' ? (prefix?.has(unit.id) ?? true) : fieldedIds.has(unit.id))` | `fieldedIds` is built from the mercenary vector, so **every dominance unit is filtered out of the request handed to `sizeStacks`** — this is the line that drops them |
| `sizer`, `finaleFor`, `putBackOn` | `shelterUnder(rungs, stacks.filter((stack) => stack.entry.pool === 'authority'))` | the shelter is applied to the authority pool by construction; `shelterUnder` itself is pool-agnostic and correct |
| `putBackOn` | `const keep = new Set([extra.id, ...fielded, ...mercIds])` | same drop, on the put-back pass |
| `marchOf` | `if (entry.pool === 'authority') { mercLost += chunks(...); gold += reviveOne(...) } else { silver += retrainOne(...) }` | a dominance stack would be billed as a **troop retrain**: no `mercLost`, no revive gold, no dragon coins — i.e. free on the burn axis the whole bar is ordered by |

### 2. The fix, precisely (not applied here — `plan.ts` is another worker’s file)

The shelter is one word; the rest is what has to come with it.

1. **`marchOf` first**, or the search will field monsters for free and the bar will rank on a lie.
   Make the branch three-way: `leadership` → `retrainOne(...).silver` as now; `authority` → as now;
   `dominance` → `retrainOne(...)` (which already bills by chunk, adds `reviveOne`’s gold and the
   dragon coins — `src/engine/recovery.ts`, `byChunk = unit.pool !== 'leadership'`) and `chunks(count)`
   into a burn figure. Either fold it into `mercLost` (one rare-stock axis, the bar unchanged) or add a
   `monsterLost` beside it; the first is the smaller change and matches what the bar means by “burned”.
2. **`mercTypes`** → `table.filter((entry) => entry.pool !== 'leadership')`, and **`unlimited`** →
   `unit.pool !== 'leadership' && request.caps[unit.id] === undefined`, with the stock line reading
   `request.housing[entry.unit.pool]` instead of `request.housing.authority` so an uncapped monster is
   bounded by the dominance pool exactly as an uncapped mercenary is bounded by authority. Every monster
   is uncapped today, since `buildUnits` writes `caps` only for selected mercenaries.
3. **The three `shelterUnder` filters** → `stack.entry.pool !== 'leadership'`. That is the rule S-87
   already states — *the enemy wipes the highest-HP living stack first* — which knows nothing about
   pools. With 1 and 2 done this is what actually shields the monsters.
4. **`putBackOn`’s `keep`/`mercIds`** and `shapeScorer`’s own `mercTypes` take the same widening.
5. **A guard**: `tests/engine/plan-criteria.test.ts` asserts the shelter over `pool === 'authority'`
   stacks only; widened to `pool !== 'leadership'` it would have caught this. (That file is owned by
   another worker right now — flagged, not edited.)

If the owner wants only the shelter and not the fielding, step 3 alone is correct and has **no effect**:
the monsters never reach it. The defect he is looking at is an absence, not a missing clamp.

### 3. On the sizer side (Battle card) the monsters *are* exposed — and that copies TotalStack

Report only, per the brief. `sizeStacks` (`src/engine/stacker.ts`) gives the dominance pool a ceiling
only under three conditions: `method === 'ms'`, or `options.monstersLast`, or
`ms` + `strictMercsAboveMonsters`. So:

- **Tier ladder** (`elite`, the card’s default) with monsters at full pressure: **21 exposed stacks** —
  all 20 dominance types between 3 600 000 and 4 662 600 HP over a 449 280 HP troop floor, plus the
  hunters. This is the picture behind *“the monsters are not shielded in the generated stack”*.
- **Tier ladder + *Monsters after troops*** (`monstersLast`): 21 → **1** (the hunters, a mercenary —
  Elite never shelters those). The option works, and it is off by default (`src/state/defaults.ts`:
  *“not what the captured run does, so it is off”*).
- **Troops first** (`ms`) and **+ *Monsters after mercenaries***: **0** exposed on every army here.
- **Allow damage trades** (`msRelaxed`) re-exposes them: `relaxPreservation` grows every
  **non-leadership** slot, dominance included — 4 dragons/giants at 840 000–930 000 HP over the same
  449 280 floor, and on the owner’s live camp of 2026-09-18 it puts **bear-5 3 = 283 140 HP** over a
  274 772 HP floor. The card warns about this in words (*“Let a hired stack grow past your smallest
  troop stack”*) and `sizeStacks` raises the warning only for `pool !== 'leadership'` stacks, so the
  monster case is covered by the same sentence.

### 4. A naming trap worth telling him about

Bear V, Cyclops V and Gargoyle V are **mercenaries** tagged `monster`, paid from authority. *Monsters
after troops* does nothing for them — it clamps the dominance pool only — which is why the synthetic
monster-mercenary camp reads **2 exposed** under both Tier ladder and Tier ladder + *Monsters after
troops* (gargoyle-5 94 = 5 358 000 HP, cyclops-5 6 = 810 000 HP), and why the owner’s live camp reads
**3 exposed** under both (bear-5 58 = 5 474 040, legionary-6 477 = 5 464 989, arbalester-6 485 =
4 423 200). This is exactly TotalStack’s own split — its `mercenaryCaps` holds `bear-5` and `cyclops-5`
while `monsterCounts` is a separate map fed by `monsterMinTier`/`monsterMaxTier` — so it is parity, not
a bug. On the plan side it is also why the bear armies above read **0 exposed**: bears are hired units,
and `shelterUnder` has covered every hired type since S-87.
