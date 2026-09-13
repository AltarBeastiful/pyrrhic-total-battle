# C5 — what the enemy formation is worth

Scenario B. Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37.

## Hits per kill position, by N

Every stack dies and the enemy always wipes the highest-HP living stack, so the number of times a stack strikes depends only on its kill position `p` and on `N` (`battle.ts`, `expectedHits`):

```
rounds = ceil(p / N)
slot   = p − (rounds − 1) × N
hits   = rounds − (slot === 1 ? 1 : 0)   (+1 for p = 1 when the army strikes first)
```

| N | p=1 | p=2 | p=3 | p=4 | p=5 | p=6 | p=7 | p=8 | p=9 | p=10 | p=11 | p=12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 0/1 | 1/1 | 1/1 | 1/1 | 2/2 | 2/2 | 2/2 | 3/3 | 3/3 | 3/3 | 4/4 | 4/4 |
| 4 | 0/1 | 1/1 | 1/1 | 1/1 | 1/1 | 2/2 | 2/2 | 2/2 | 2/2 | 3/3 | 3/3 | 3/3 |
| 8 | 0/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 2/2 | 2/2 | 2/2 |

**N = 3 arithmetic, spelled out.** Three enemy squads means a round is three kills. Position 1 opens round 1 and dies before its turn, so 0 hits enemy-first (1 army-first). Positions 2 and 3 strike once, in the gaps of round 1. Position 4 opens round 2: it survived round 1 and struck in its end-of-round sweep, so 1 hit; positions 5 and 6 strike in round 1’s sweep and again in round 2, so 2 hits each. In general position `p` gets `ceil(p/3)` hits, minus one when `p ≡ 1 (mod 3)`. Compared with N = 4 the staircase climbs a quarter faster, so **deep marches are worth more against a 3-squad enemy** — but only if the stacks at the bottom are the ones that hit hard.

## 8 types · msRelaxed — every 4-squad formation

Reference (1 of each): SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 — avg **4,474,506**

| formation | categories present | min | avg | max | targets |
|---|---|---|---|---|---|
| 4 flying | flying | 3,421,315 | 3,524,922 | 3,628,529 | LGN6→melee CHR6→melee SW1→melee SP2→melee RD2→melee RD3→melee EMH6→melee ABT6→flying |
| 1 mounted + 3 flying | mounted+flying | 3,869,857 | 3,973,464 | 4,077,071 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→flying LGN6→mounted |
| 2 mounted + 2 flying | mounted+flying | 3,869,857 | 3,973,464 | 4,077,071 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→flying LGN6→mounted |
| 3 mounted + 1 flying | mounted+flying | 3,869,857 | 3,973,464 | 4,077,071 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→flying LGN6→mounted |
| 4 mounted | mounted | 3,167,486 | 3,276,546 | 3,385,606 | CHR6→melee ABT6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee LGN6→mounted |
| 1 ranged + 3 flying | ranged+flying | 4,250,555 | 4,354,162 | 4,457,769 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→flying CHR6→ranged |
| 1 ranged + 1 mounted + 2 flying | ranged+mounted+flying | 4,474,506 | 4,474,506 | 4,474,506 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→flying LGN6→mounted CHR6→ranged |
| 1 ranged + 2 mounted + 1 flying | ranged+mounted+flying | 4,474,506 | 4,474,506 | 4,474,506 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→flying LGN6→mounted CHR6→ranged |
| 1 ranged + 3 mounted | ranged+mounted | 3,990,532 | 4,094,500 | 4,198,468 | ABT6→melee SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee LGN6→mounted CHR6→ranged |
| 2 ranged + 2 flying | ranged+flying | 4,250,555 | 4,354,162 | 4,457,769 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→flying CHR6→ranged |
| 2 ranged + 1 mounted + 1 flying | ranged+mounted+flying | 4,474,506 | 4,474,506 | 4,474,506 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→flying LGN6→mounted CHR6→ranged |
| 2 ranged + 2 mounted | ranged+mounted | 3,990,532 | 4,094,500 | 4,198,468 | ABT6→melee SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee LGN6→mounted CHR6→ranged |
| 3 ranged + 1 flying | ranged+flying | 4,250,555 | 4,354,162 | 4,457,769 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→flying CHR6→ranged |
| 3 ranged + 1 mounted | ranged+mounted | 3,990,532 | 4,094,500 | 4,198,468 | ABT6→melee SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee LGN6→mounted CHR6→ranged |
| 4 ranged | ranged | 3,831,578 | 4,028,570 | 4,225,562 | ABT6→melee LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee CHR6→ranged |
| 1 melee + 3 flying | melee+flying | 3,421,315 | 3,524,922 | 3,628,529 | LGN6→melee CHR6→melee SW1→melee SP2→melee RD2→melee RD3→melee EMH6→melee ABT6→flying |
| 1 melee + 1 mounted + 2 flying | melee+mounted+flying | 3,869,857 | 3,973,464 | 4,077,071 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→flying LGN6→mounted |
| 1 melee + 2 mounted + 1 flying | melee+mounted+flying | 3,869,857 | 3,973,464 | 4,077,071 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→flying LGN6→mounted |
| 1 melee + 3 mounted | melee+mounted | 3,708,167 | 3,811,774 | 3,915,381 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→melee LGN6→mounted |
| 1 melee + 1 ranged + 2 flying | melee+ranged+flying | 4,250,555 | 4,354,162 | 4,457,769 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→flying CHR6→ranged |
| 1 melee + 1 ranged + 1 mounted + 1 flying | melee+ranged+mounted+flying | 4,474,506 | 4,474,506 | 4,474,506 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→flying LGN6→mounted CHR6→ranged |
| 1 melee + 1 ranged + 2 mounted | melee+ranged+mounted | 4,312,816 | 4,312,816 | 4,312,816 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→melee LGN6→mounted CHR6→ranged |
| 1 melee + 2 ranged + 1 flying | melee+ranged+flying | 4,250,555 | 4,354,162 | 4,457,769 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→flying CHR6→ranged |
| 1 melee + 2 ranged + 1 mounted | melee+ranged+mounted | 4,312,816 | 4,312,816 | 4,312,816 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→melee LGN6→mounted CHR6→ranged |
| 1 melee + 3 ranged | melee+ranged | 4,088,865 | 4,192,472 | 4,296,079 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→melee CHR6→ranged |
| 2 melee + 2 flying | melee+flying | 3,421,315 | 3,524,922 | 3,628,529 | LGN6→melee CHR6→melee SW1→melee SP2→melee RD2→melee RD3→melee EMH6→melee ABT6→flying |
| 2 melee + 1 mounted + 1 flying | melee+mounted+flying | 3,869,857 | 3,973,464 | 4,077,071 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→flying LGN6→mounted |
| 2 melee + 2 mounted | melee+mounted | 3,708,167 | 3,811,774 | 3,915,381 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→melee LGN6→mounted |
| 2 melee + 1 ranged + 1 flying | melee+ranged+flying | 4,250,555 | 4,354,162 | 4,457,769 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→flying CHR6→ranged |
| 2 melee + 1 ranged + 1 mounted | melee+ranged+mounted | 4,312,816 | 4,312,816 | 4,312,816 | SW1→mounted SP2→mounted RD2→ranged RD3→ranged EMH6→melee ABT6→melee LGN6→mounted CHR6→ranged |
| 2 melee + 2 ranged | melee+ranged | 4,088,865 | 4,192,472 | 4,296,079 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→melee CHR6→ranged |
| 3 melee + 1 flying | melee+flying | 3,421,315 | 3,524,922 | 3,628,529 | LGN6→melee CHR6→melee SW1→melee SP2→melee RD2→melee RD3→melee EMH6→melee ABT6→flying |
| 3 melee + 1 mounted | melee+mounted | 3,708,167 | 3,811,774 | 3,915,381 | CHR6→melee SW1→mounted SP2→mounted RD2→melee RD3→melee EMH6→melee ABT6→melee LGN6→mounted |
| 3 melee + 1 ranged | melee+ranged | 4,088,865 | 4,192,472 | 4,296,079 | LGN6→melee SW1→melee SP2→melee RD2→ranged RD3→ranged EMH6→melee ABT6→melee CHR6→ranged |
| 4 melee | melee | 3,259,625 | 3,363,232 | 3,466,839 | LGN6→melee CHR6→melee SW1→melee SP2→melee RD2→melee RD3→melee EMH6→melee ABT6→melee |

All 35 multisets collapse onto 15 distinct presence sets with no mismatch: **how many of each squad the enemy brings changes nothing**, only which categories are there at all (and N, which is 4 throughout this table).

## winner 7 types · msRelaxed — every 4-squad formation

Reference (1 of each): ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72 — avg **7,843,624**

| formation | categories present | min | avg | max | targets |
|---|---|---|---|---|---|
| 4 flying | flying | 4,981,621 | 5,278,681 | 5,575,741 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→melee |
| 1 mounted + 3 flying | mounted+flying | 5,788,741 | 6,085,801 | 6,382,861 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→mounted |
| 2 mounted + 2 flying | mounted+flying | 5,788,741 | 6,085,801 | 6,382,861 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→mounted |
| 3 mounted + 1 flying | mounted+flying | 5,788,741 | 6,085,801 | 6,382,861 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→mounted |
| 4 mounted | mounted | 5,053,745 | 5,273,676 | 5,493,607 | ARC2→melee RD2→melee EMH6→melee RD3→melee ABT6→melee CHR6→melee LGN6→mounted |
| 1 ranged + 3 flying | ranged+flying | 6,739,444 | 7,036,504 | 7,333,564 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→melee |
| 1 ranged + 1 mounted + 2 flying | ranged+mounted+flying | 7,546,564 | 7,843,624 | 8,140,684 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→mounted |
| 1 ranged + 2 mounted + 1 flying | ranged+mounted+flying | 7,546,564 | 7,843,624 | 8,140,684 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→mounted |
| 1 ranged + 3 mounted | ranged+mounted | 6,811,568 | 7,031,499 | 7,251,430 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→mounted |
| 2 ranged + 2 flying | ranged+flying | 6,739,444 | 7,036,504 | 7,333,564 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→melee |
| 2 ranged + 1 mounted + 1 flying | ranged+mounted+flying | 7,546,564 | 7,843,624 | 8,140,684 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→mounted |
| 2 ranged + 2 mounted | ranged+mounted | 6,811,568 | 7,031,499 | 7,251,430 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→mounted |
| 3 ranged + 1 flying | ranged+flying | 6,739,444 | 7,036,504 | 7,333,564 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→melee |
| 3 ranged + 1 mounted | ranged+mounted | 6,811,568 | 7,031,499 | 7,251,430 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→mounted |
| 4 ranged | ranged | 6,004,448 | 6,224,379 | 6,444,310 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→melee |
| 1 melee + 3 flying | melee+flying | 4,981,621 | 5,278,681 | 5,575,741 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→melee |
| 1 melee + 1 mounted + 2 flying | melee+mounted+flying | 5,788,741 | 6,085,801 | 6,382,861 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→mounted |
| 1 melee + 2 mounted + 1 flying | melee+mounted+flying | 5,788,741 | 6,085,801 | 6,382,861 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→mounted |
| 1 melee + 3 mounted | melee+mounted | 5,622,681 | 5,902,177 | 6,181,673 | ARC2→melee RD2→melee EMH6→melee RD3→melee ABT6→melee CHR6→melee LGN6→mounted |
| 1 melee + 1 ranged + 2 flying | melee+ranged+flying | 6,739,444 | 7,036,504 | 7,333,564 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→melee |
| 1 melee + 1 ranged + 1 mounted + 1 flying | melee+ranged+mounted+flying | 7,546,564 | 7,843,624 | 8,140,684 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→mounted |
| 1 melee + 1 ranged + 2 mounted | melee+ranged+mounted | 7,380,504 | 7,660,000 | 7,939,496 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→mounted |
| 1 melee + 2 ranged + 1 flying | melee+ranged+flying | 6,739,444 | 7,036,504 | 7,333,564 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→melee |
| 1 melee + 2 ranged + 1 mounted | melee+ranged+mounted | 7,380,504 | 7,660,000 | 7,939,496 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→mounted |
| 1 melee + 3 ranged | melee+ranged | 6,573,384 | 6,852,880 | 7,132,376 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→melee |
| 2 melee + 2 flying | melee+flying | 4,981,621 | 5,278,681 | 5,575,741 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→melee |
| 2 melee + 1 mounted + 1 flying | melee+mounted+flying | 5,788,741 | 6,085,801 | 6,382,861 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→mounted |
| 2 melee + 2 mounted | melee+mounted | 5,622,681 | 5,902,177 | 6,181,673 | ARC2→melee RD2→melee EMH6→melee RD3→melee ABT6→melee CHR6→melee LGN6→mounted |
| 2 melee + 1 ranged + 1 flying | melee+ranged+flying | 6,739,444 | 7,036,504 | 7,333,564 | ARC2→flying RD2→ranged EMH6→melee RD3→ranged ABT6→flying CHR6→ranged LGN6→melee |
| 2 melee + 1 ranged + 1 mounted | melee+ranged+mounted | 7,380,504 | 7,660,000 | 7,939,496 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→mounted |
| 2 melee + 2 ranged | melee+ranged | 6,573,384 | 6,852,880 | 7,132,376 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→melee |
| 3 melee + 1 flying | melee+flying | 4,981,621 | 5,278,681 | 5,575,741 | ARC2→flying RD2→melee EMH6→melee RD3→melee ABT6→flying CHR6→melee LGN6→melee |
| 3 melee + 1 mounted | melee+mounted | 5,622,681 | 5,902,177 | 6,181,673 | ARC2→melee RD2→melee EMH6→melee RD3→melee ABT6→melee CHR6→melee LGN6→mounted |
| 3 melee + 1 ranged | melee+ranged | 6,573,384 | 6,852,880 | 7,132,376 | ARC2→melee RD2→ranged EMH6→melee RD3→ranged ABT6→melee CHR6→ranged LGN6→melee |
| 4 melee | melee | 4,815,561 | 5,095,057 | 5,374,553 | ARC2→melee RD2→melee EMH6→melee RD3→melee ABT6→melee CHR6→melee LGN6→melee |

All 35 multisets collapse onto 15 distinct presence sets with no mismatch: **how many of each squad the enemy brings changes nothing**, only which categories are there at all (and N, which is 4 throughout this table).

## Which stack loses which feature, and to what

A stack’s `strengthAgainst` is read from its own row in `troops.json` / `mercenaries.json`. `chooseTarget` takes the largest entry among the categories actually present; with none it hits the melee squad for a bare base hit. The account’s units:

| stack | strength-against | needs | falls back to |
|---|---|---|---|
| SW1 | mounted +20 %, beasts +40 % | mounted | nothing category-based; its constant lines still apply |
| SP2 | mounted +59 %, beasts +120 % | mounted | nothing category-based; its constant lines still apply |
| RD2 | ranged +98 %, engineers +81 % | ranged | nothing category-based; its constant lines still apply |
| RD3 | ranged +146 %, engineers +122 % | ranged | nothing category-based; its constant lines still apply |
| EMH6 | epicMonsters +609 % | — | nothing category-based; its constant lines still apply |
| ABT6 | melee +394 %, flying +509 % | flying | melee +394 % |
| LGN6 | mounted +295 %, beasts +608 % | mounted | nothing category-based; its constant lines still apply |
| CHR6 | ranged +493 %, engineers +410 % | ranged | nothing category-based; its constant lines still apply |
| ARC2 | melee +78 %, flying +101 % | flying | melee +78 % |
| ARC1 | melee +52 %, flying +67 % | flying | melee +52 % |
| RD1 | ranged +65 %, engineers +54 % | ranged | nothing category-based; its constant lines still apply |
| SP1 | mounted +39 %, beasts +80 % | mounted | nothing category-based; its constant lines still apply |

- **ABT6** wants a **flying** squad (+509 %); without one it drops to melee (+394 %) and, if neither melee nor flying is there, to a bare hit.
- **CHR6, RD1, RD2, RD3** want a **ranged** squad (+493 / +65 / +98 / +146 %); the engineers line never fires because an epic monster has no engineer squad.
- **LGN6, SP1, SP2, SW1** want a **mounted** squad (+295 / +39 / +59 / +20 %); their `beasts` line is a race, not a category, and the standard formation carries no race, so it never fires either.
- **ARC1, ARC2** want **flying** (+67 / +101 %), else melee (+52 / +78 %).
- **EMH6 is the exception**: its +609 % is on `epicMonsters`, a *constant* strength-against that `constantStrengthAgainst` adds whatever the target is. It never loses its feature, whatever the formation, which is exactly why it is the best unit this account can field.

## 8 types · msRelaxed — 3-squad formations, one category missing at a time

**Three squads cannot carry four categories.** One category is always absent, so there is no "3 squads with everything present" row to compute; the four rows below are the four ways to drop one. For comparison the 4-squad reference and a 3-squad formation that doubles a category are included — they confirm again that only the presence set matters.

| formation | N | missing | min | avg | max | who lost a feature |
|---|---|---|---|---|---|---|
| 1 of each (reference) | 4 | — | 4,474,506 | 4,474,506 | 4,474,506 | — |
| 1 ranged + 1 mounted + 1 flying | 3 | melee | 5,644,634 | 5,644,634 | 5,644,634 | nobody |
| 1 melee + 1 mounted + 1 flying | 3 | ranged | 4,483,806 | 4,587,413 | 4,691,020 | CHR6 ranged→melee, RD2 ranged→melee, RD3 ranged→melee |
| 1 melee + 1 ranged + 1 flying | 3 | mounted | 5,187,597 | 5,187,597 | 5,187,597 | SW1 mounted→melee, SP2 mounted→melee, LGN6 mounted→melee |
| 1 melee + 1 ranged + 1 mounted | 3 | flying | 5,482,944 | 5,482,944 | 5,482,944 | ABT6 flying→melee |
| 2 melee + 1 ranged | 3 | mounted, flying | 5,025,907 | 5,025,907 | 5,025,907 | SW1 mounted→melee, SP2 mounted→melee, ABT6 flying→melee, LGN6 mounted→melee |
| 1 melee + 2 ranged | 3 | mounted, flying | 5,025,907 | 5,025,907 | 5,025,907 | SW1 mounted→melee, SP2 mounted→melee, ABT6 flying→melee, LGN6 mounted→melee |

Two effects fight each other in these rows. Dropping a category **costs** the stacks that wanted it (a lost feature is 300-500 % of a base hit for a mercenary), but dropping from N = 4 to N = 3 **pays**, because the hits staircase climbs faster and the stacks at the bottom of the ladder get more turns. Which wins depends on the march.

## winner 7 types · msRelaxed — 3-squad formations, one category missing at a time

**Three squads cannot carry four categories.** One category is always absent, so there is no "3 squads with everything present" row to compute; the four rows below are the four ways to drop one. For comparison the 4-squad reference and a 3-squad formation that doubles a category are included — they confirm again that only the presence set matters.

| formation | N | missing | min | avg | max | who lost a feature |
|---|---|---|---|---|---|---|
| 1 of each (reference) | 4 | — | 7,546,564 | 7,843,624 | 8,140,684 | — |
| 1 ranged + 1 mounted + 1 flying | 3 | melee | 8,697,432 | 8,994,492 | 9,291,552 | nobody |
| 1 melee + 1 mounted + 1 flying | 3 | ranged | 6,939,609 | 7,236,669 | 7,533,729 | RD2 ranged→melee, RD3 ranged→melee, CHR6 ranged→melee |
| 1 melee + 1 ranged + 1 flying | 3 | mounted | 7,890,312 | 8,187,372 | 8,484,432 | LGN6 mounted→melee |
| 1 melee + 1 ranged + 1 mounted | 3 | flying | 8,365,312 | 8,644,808 | 8,924,304 | ARC2 flying→melee, ABT6 flying→melee |
| 2 melee + 1 ranged | 3 | mounted, flying | 7,558,192 | 7,837,688 | 8,117,184 | ARC2 flying→melee, ABT6 flying→melee, LGN6 mounted→melee |
| 1 melee + 2 ranged | 3 | mounted, flying | 7,558,192 | 7,837,688 | 8,117,184 | ARC2 flying→melee, ABT6 flying→melee, LGN6 mounted→melee |

Two effects fight each other in these rows. Dropping a category **costs** the stacks that wanted it (a lost feature is 300-500 % of a base hit for a mercenary), but dropping from N = 4 to N = 3 **pays**, because the hits staircase climbs faster and the stacks at the bottom of the ladder get more turns. Which wins depends on the march.

## 8 types · msRelaxed — Arachne's Invasion (8 squads, 2 of each)

SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | SW1 | 2,307 | 523,689 | 220,319 | 197,249 | 0/0 | 0 | 0 |
| 2 | SP2 | 796 | 522,176 | 247,874 | 205,607 | 1/1 | 247,874 | 247,874 |
| 3 | RD2 | 397 | 520,864 | 275,121 | 205,090 | 1/1 | 275,121 | 275,121 |
| 4 | RD3 | 223 | 520,259 | 308,989 | 204,803 | 1/1 | 308,989 | 308,989 |
| 5 | EMH6 | 35 | 517,965 | 636,608 | 203,914 | 1/1 | 636,608 | 636,608 |
| 6 | ABT6 | 37 | 513,560 | 560,291 | 202,464 | 1/1 | 560,291 | 560,291 |
| 7 | LGN6 | 37 | 512,487 | 409,146 | 201,761 | 1/1 | 409,146 | 409,146 |
| 8 | CHR6 | 18 | 498,636 | 533,520 | 196,308 | 1/1 | 533,520 | 533,520 |

min 2,971,549 · avg 2,971,549 · max 2,971,549 · hits 7/7 · silver 1,799,300 · gold 675 · time 5d 21h · pools L 4,343/4,343 A 145/2,000

With the event id removed but the same 8-squad formation: avg 2,971,549 — **identical**. The event switches on the `swarmUnits` strength-against, and **no unit this account fields has one** (the twelve `swarmUnits` rows in `mercenaries.json` are Chitinous Defender, Combat Anteater, Grim Stalker and Wasp Man — none of them selected). So Arachne’s changes exactly one thing here: N = 8.

At N = 8 the whole march fits inside one round: `expectedHits(p, 8)` is 0/1 at p = 1 and 1 everywhere up to p = 9. **Nobody is hit twice.** That is why the 8-squad formation is the worst of the three for this account even though every category is present and every feature fires — the march is only 7 or 8 stacks deep, so it never reaches the second round where the extra hits live.

## winner 7 types · msRelaxed — Arachne's Invasion (8 squads, 2 of each)

ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,114,929 | 594,120 | 439,862 | 0/1 | 0 | 594,120 |
| 2 | RD2 | 848 | 1,112,576 | 587,664 | 438,077 | 1/1 | 587,664 | 587,664 |
| 3 | EMH6 | 75 | 1,109,925 | 1,364,160 | 436,958 | 1/1 | 1,364,160 | 1,364,160 |
| 4 | RD3 | 475 | 1,108,175 | 658,160 | 436,240 | 1/1 | 658,160 | 658,160 |
| 5 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 1/1 | 1,150,868 | 1,150,868 |
| 6 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 1/1 | 1,096,680 | 1,096,680 |
| 7 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 1/1 | 796,176 | 796,176 |

min 5,653,708 · avg 5,950,768 · max 6,247,828 · hits 6/7 · silver 2,361,500 · gold 1,386 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

With the event id removed but the same 8-squad formation: avg 5,950,768 — **identical**. The event switches on the `swarmUnits` strength-against, and **no unit this account fields has one** (the twelve `swarmUnits` rows in `mercenaries.json` are Chitinous Defender, Combat Anteater, Grim Stalker and Wasp Man — none of them selected). So Arachne’s changes exactly one thing here: N = 8.

At N = 8 the whole march fits inside one round: `expectedHits(p, 8)` is 0/1 at p = 1 and 1 everywhere up to p = 9. **Nobody is hit twice.** That is why the 8-squad formation is the worst of the three for this account even though every category is present and every feature fires — the march is only 7 or 8 stacks deep, so it never reaches the second round where the extra hits live.

## Summary — N and the presence set, side by side

| march | 1 each (N=4) | 3 squads, best | 3 squads, worst | Arachne (N=8) |
|---|---|---|---|---|
| 8 types · msRelaxed | 4,474,506 | 5,644,634 (1 ranged + 1 mounted + 1 flying) | 4,587,413 (1 melee + 1 mounted + 1 flying) | 2,971,549 |
| winner 7 types · msRelaxed | 7,843,624 | 8,994,492 (1 ranged + 1 mounted + 1 flying) | 7,236,669 (1 melee + 1 mounted + 1 flying) | 5,950,768 |

## Target choice, unit by unit, in three formations

| unit | 1 each | no flying | no mounted | no ranged | melee only |
|---|---|---|---|---|---|
| SW1 | mounted +20 % | mounted +20 % | melee +0 % | mounted +20 % | melee +0 % |
| SP2 | mounted +59 % | mounted +59 % | melee +0 % | mounted +59 % | melee +0 % |
| RD2 | ranged +98 % | ranged +98 % | ranged +98 % | melee +0 % | melee +0 % |
| RD3 | ranged +146 % | ranged +146 % | ranged +146 % | melee +0 % | melee +0 % |
| EMH6 | melee +609 % | melee +609 % | melee +609 % | melee +609 % | melee +609 % |
| ABT6 | flying +509 % | melee +394 % | flying +509 % | flying +509 % | melee +394 % |
| LGN6 | mounted +295 % | mounted +295 % | melee +0 % | mounted +295 % | melee +0 % |
| CHR6 | ranged +493 % | ranged +493 % | ranged +493 % | melee +0 % | melee +0 % |
| ARC2 | flying +101 % | melee +78 % | flying +101 % | flying +101 % | melee +78 % |

The last column is the extreme case: four melee squads. ABT6 keeps +394 %, LGN6 and SW1 and SP2 lose everything (their only lines are mounted and beasts), the riders and CHR6 lose everything (ranged and engineers), and EMH6 still carries its whole +609 %. A march built for that formation would be ABT6, ARC2 and EMH6 and nothing else.

## Reading it

- **Only two things about the enemy matter: N, and which categories are present.** The multiplicity of a squad changes nothing — verified on all 35 four-squad multisets above, with no mismatch.
- **N is usually the bigger term.** Going from 4 squads to 3 shortens the round and gives the bottom of the ladder an extra turn; going from 4 to 8 (Arachne’s) means nobody gets a second turn at all, which is the largest single swing in this file.
- **A lost feature is expensive but survivable.** A mercenary’s strength-against is 300-500 % of its base strength, so losing it roughly halves that stack’s hit; EMH6 never loses its, which is why the account’s best unit is also its most formation-proof.
- **`armyStrengthAgainstEpicMonsters` is the only bonus that is immune to the formation** — it is added by `constantStrengthAgainst` whatever the target is. Against a hostile formation it is worth strictly more than any category bonus of the same size.
