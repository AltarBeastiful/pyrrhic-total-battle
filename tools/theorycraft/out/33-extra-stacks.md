# C4 — what one more unit type is worth

Scenario B. Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37. Enemy 1 melee / 1 ranged / 1 mounted / 1 flying, so N = 4.

**Read the mercenary column first.** With N = 4 the hits a stack gets are a function of its kill position only: `expectedHits(p, 4)` is 0/1 at p = 1, then 1 for p = 2…5, then 2 for p = 6…9. So the bottom of the HP ladder is worth double, and an extra type earns its place mostly by *pushing the mercenaries down into the double-hit slots* — not by the damage it does itself.

## Base march — 8 types (SW1 SP2 RD2 RD3 + 4 mercs)


**ms** — SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | SW1 | 2,307 | 523,689 | 220,319 | 197,249 | 0/0 | 0 | 0 |
| 2 | SP2 | 796 | 522,176 | 247,874 | 205,607 | 1/1 | 247,874 | 247,874 |
| 3 | RD2 | 397 | 520,864 | 275,121 | 205,090 | 1/1 | 275,121 | 275,121 |
| 4 | RD3 | 223 | 520,259 | 308,989 | 204,803 | 1/1 | 308,989 | 308,989 |
| 5 | EMH6 | 35 | 517,965 | 636,608 | 203,914 | 1/1 | 636,608 | 636,608 |
| 6 | ABT6 | 37 | 513,560 | 560,291 | 202,464 | 2/2 | 1,120,582 | 1,120,582 |
| 7 | LGN6 | 37 | 512,487 | 409,146 | 201,761 | 2/2 | 818,292 | 818,292 |
| 8 | CHR6 | 18 | 498,636 | 533,520 | 196,308 | 2/2 | 1,067,040 | 1,067,040 |

min 4,474,506 · avg 4,474,506 · max 4,474,506 · hits 10/10 · silver 1,799,300 · gold 675 · time 5d 21h · pools L 4,343/4,343 A 145/2,000

**msRelaxed** — SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | SW1 | 2,307 | 523,689 | 220,319 | 197,249 | 0/0 | 0 | 0 |
| 2 | SP2 | 796 | 522,176 | 247,874 | 205,607 | 1/1 | 247,874 | 247,874 |
| 3 | RD2 | 397 | 520,864 | 275,121 | 205,090 | 1/1 | 275,121 | 275,121 |
| 4 | RD3 | 223 | 520,259 | 308,989 | 204,803 | 1/1 | 308,989 | 308,989 |
| 5 | EMH6 | 35 | 517,965 | 636,608 | 203,914 | 1/1 | 636,608 | 636,608 |
| 6 | ABT6 | 37 | 513,560 | 560,291 | 202,464 | 2/2 | 1,120,582 | 1,120,582 |
| 7 | LGN6 | 37 | 512,487 | 409,146 | 201,761 | 2/2 | 818,292 | 818,292 |
| 8 | CHR6 | 18 | 498,636 | 533,520 | 196,308 | 2/2 | 1,067,040 | 1,067,040 |

min 4,474,506 · avg 4,474,506 · max 4,474,506 · hits 10/10 · silver 1,799,300 · gold 675 · time 5d 21h · pools L 4,343/4,343 A 145/2,000

## Base march — winner 7 types (ARC2 RD2 RD3 + 4 mercs)


**ms** — ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,114,929 | 594,120 | 439,862 | 0/1 | 0 | 594,120 |
| 2 | RD2 | 848 | 1,112,576 | 587,664 | 438,077 | 1/1 | 587,664 | 587,664 |
| 3 | RD3 | 475 | 1,108,175 | 658,160 | 436,240 | 1/1 | 658,160 | 658,160 |
| 4 | EMH6 | 74 | 1,095,126 | 1,345,971 | 431,131 | 1/1 | 1,345,971 | 1,345,971 |
| 5 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 1/1 | 1,150,868 | 1,150,868 |
| 6 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 2/2 | 2,193,360 | 2,193,360 |
| 7 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 2/2 | 1,592,352 | 1,592,352 |

min 7,528,375 · avg 7,825,435 · max 8,122,495 · hits 8/9 · silver 2,361,500 · gold 1,380 · time 11d 16h · pools L 4,343/4,343 A 296/2,000

**msRelaxed** — ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,114,929 | 594,120 | 439,862 | 0/1 | 0 | 594,120 |
| 2 | RD2 | 848 | 1,112,576 | 587,664 | 438,077 | 1/1 | 587,664 | 587,664 |
| 3 | EMH6 | 75 | 1,109,925 | 1,364,160 | 436,958 | 1/1 | 1,364,160 | 1,364,160 |
| 4 | RD3 | 475 | 1,108,175 | 658,160 | 436,240 | 1/1 | 658,160 | 658,160 |
| 5 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 1/1 | 1,150,868 | 1,150,868 |
| 6 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 2/2 | 2,193,360 | 2,193,360 |
| 7 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 2/2 | 1,592,352 | 1,592,352 |

min 7,546,564 · avg 7,843,624 · max 8,140,684 · hits 8/9 · silver 2,361,500 · gold 1,386 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

## (a) Owned types the setup leaves out, one at a time

ARC2, RD1, SP1 and ARC1 are in `excludedUnitIds`; the account can field them today. Everything else stays as it is — same housing, same caps, same bonuses.

### on top of the 8 types (SW1 SP2 RD2 RD3 + 4 mercs)

| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |
|---|---|---|---|---|---|---|---|---|---|
| — (base) | ms | 4,474,506 | 0 | — | 1,799,300 | 675 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + ARC2 | ms | 4,506,138 | 31,632 | 673 @ 657 HP | 1,856,300 | 554 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · EMH6 #8 (2/2) · CHR6 #9 (2/2) |
| + RD1 | ms | 4,056,848 | -417,658 | 539 @ 729 HP | 1,675,300 | 507 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) · EMH6 #9 (2/2) |
| + SP1 | ms | 4,042,834 | -431,672 | 1,078 @ 365 HP | 1,675,300 | 507 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) · EMH6 #9 (2/2) |
| + ARC1 | ms | 4,058,465 | -416,041 | 1,078 @ 365 HP | 1,675,300 | 507 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) · EMH6 #9 (2/2) |
| — (base) | msRelaxed | 4,474,506 | 0 | — | 1,799,300 | 675 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + ARC2 | msRelaxed | 4,506,138 | 31,632 | 673 @ 657 HP | 1,856,300 | 554 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · EMH6 #8 (2/2) · CHR6 #9 (2/2) |
| + RD1 | msRelaxed | 4,056,848 | -417,658 | 539 @ 729 HP | 1,675,300 | 507 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) · EMH6 #9 (2/2) |
| + SP1 | msRelaxed | 4,042,834 | -431,672 | 1,078 @ 365 HP | 1,675,300 | 507 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) · EMH6 #9 (2/2) |
| + ARC1 | msRelaxed | 4,058,465 | -416,041 | 1,078 @ 365 HP | 1,675,300 | 507 | 0 | 12/12 | ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) · EMH6 #9 (2/2) |

### on top of the winner 7 types (ARC2 RD2 RD3 + 4 mercs)

| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |
|---|---|---|---|---|---|---|---|---|---|
| — (base) | ms | 7,825,435 | 0 | — | 2,361,500 | 1,380 | 0 | 8/9 | EMH6 #4 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + RD1 | ms | 5,720,943 | -2,104,492 | 898 @ 729 HP | 1,923,900 | 837 | 0 | 10/10 | ABT6 #5 (1/1) · LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) |
| + SP1 | ms | 5,720,943 | -2,104,492 | 1,796 @ 365 HP | 1,923,900 | 837 | 0 | 10/10 | ABT6 #5 (1/1) · LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) |
| + ARC1 | ms | 5,880,338 | -1,945,097 | 1,796 @ 365 HP | 1,923,900 | 837 | 0 | 10/11 | ABT6 #5 (1/1) · LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) |
| — (base) | msRelaxed | 7,843,624 | 0 | — | 2,361,500 | 1,386 | 0 | 8/9 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + RD1 | msRelaxed | 5,919,911 | -1,923,713 | 898 @ 729 HP | 1,923,900 | 842 | 0 | 10/10 | LGN6 #4 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) |
| + SP1 | msRelaxed | 5,919,911 | -1,923,713 | 1,796 @ 365 HP | 1,923,900 | 842 | 0 | 10/10 | LGN6 #4 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) |
| + ARC1 | msRelaxed | 6,079,306 | -1,764,318 | 1,796 @ 365 HP | 1,923,900 | 842 | 0 | 10/11 | LGN6 #4 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) |

## (b) "If unlocked" — types the account does not have today

The export sets guardsmen tiers 1-3, specialists tier 1 only, engineers and monsters `null` (the row is switched off). So **every row in this section assumes a technology the account does not have**: SP3 and ARC3 are tier-3 guardsmen the top-tier chips exclude, SW2 is a tier-2 specialist, and Catapult I is an engineer — 10 leadership, 1,500 HP, 250 strength and **no strength-against at all**, so it always hits the melee squad with a bare base hit.

### on top of the 8 types (SW1 SP2 RD2 RD3 + 4 mercs)

| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |
|---|---|---|---|---|---|---|---|---|---|
| — (base) | ms | 4,474,506 | 0 | — | 1,799,300 | 675 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + SP3 *(if unlocked)* | ms | 4,884,050 | 409,544 | 405 @ 1,166 HP | 1,914,900 | 607 | 0 | 12/12 | LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) · ABT6 #9 (2/2) |
| + ARC3 *(if unlocked)* | ms | 4,800,080 | 325,574 | 404 @ 1,169 HP | 1,914,500 | 607 | 0 | 11/12 | LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) · ABT6 #9 (2/2) |
| + CAT1 *(if unlocked)* | ms | 2,794,620 | -1,679,886 | 193 @ 1,500 HP | 1,578,900 | 371 | 0 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + SW2 *(if unlocked)* | ms | 3,920,953 | -553,553 | 990 @ 408 HP | 1,883,700 | 512 | 0 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| — (base) | msRelaxed | 4,474,506 | 0 | — | 1,799,300 | 675 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + SP3 *(if unlocked)* | msRelaxed | 4,884,050 | 409,544 | 405 @ 1,166 HP | 1,914,900 | 607 | 0 | 12/12 | LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) · ABT6 #9 (2/2) |
| + ARC3 *(if unlocked)* | msRelaxed | 4,800,080 | 325,574 | 404 @ 1,169 HP | 1,914,500 | 607 | 0 | 11/12 | LGN6 #6 (2/2) · CHR6 #7 (2/2) · EMH6 #8 (2/2) · ABT6 #9 (2/2) |
| + CAT1 *(if unlocked)* | msRelaxed | 2,794,620 | -1,679,886 | 193 @ 1,500 HP | 1,578,900 | 371 | 0 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + SW2 *(if unlocked)* | msRelaxed | 3,920,953 | -553,553 | 990 @ 408 HP | 1,883,700 | 512 | 0 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |

### on top of the winner 7 types (ARC2 RD2 RD3 + 4 mercs)

| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |
|---|---|---|---|---|---|---|---|---|---|
| — (base) | ms | 7,825,435 | 0 | — | 2,361,500 | 1,380 | 0 | 8/9 | EMH6 #4 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + SP3 *(if unlocked)* | ms | 8,146,203 | 320,768 | 781 @ 1,166 HP | 2,483,300 | 1,182 | 0 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + ARC3 *(if unlocked)* | ms | 8,226,159 | 400,724 | 779 @ 1,169 HP | 2,483,300 | 1,182 | 0 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + CAT1 *(if unlocked)* | ms | 3,461,773 | -4,363,662 | 274 @ 1,500 HP | 1,693,500 | 523 | 0 | 9/10 | ABT6 #5 (1/1) · LGN6 #6 (2/2) · EMH6 #7 (2/2) · CHR6 #8 (2/2) |
| + SW2 *(if unlocked)* | ms | 5,956,162 | -1,869,273 | 1,679 @ 408 HP | 2,288,300 | 894 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| — (base) | msRelaxed | 7,843,624 | 0 | — | 2,361,500 | 1,386 | 0 | 8/9 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + SP3 *(if unlocked)* | msRelaxed | 8,146,203 | 302,579 | 781 @ 1,166 HP | 2,483,300 | 1,182 | 0 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + ARC3 *(if unlocked)* | msRelaxed | 8,226,159 | 382,535 | 779 @ 1,169 HP | 2,483,300 | 1,182 | 0 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + CAT1 *(if unlocked)* | msRelaxed | 3,535,182 | -4,308,442 | 274 @ 1,500 HP | 1,693,500 | 528 | 0 | 9/10 | LGN6 #1 (0/1) · ABT6 #6 (2/2) · EMH6 #7 (2/2) · CHR6 #8 (2/2) |
| + SW2 *(if unlocked)* | msRelaxed | 5,956,162 | -1,887,462 | 1,679 @ 408 HP | 2,288,300 | 894 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |

## (c) One monster type, paid from the 800 dominance nothing else uses

**Only if you own them or can train them.** The export has `monsters: null` — the row is switched off entirely, so the account fields no monsters at all and the 800 dominance is dead housing in every march this tool generates. Each row below adds exactly one monster type and lets the sizer spend that dominance on it.

Monsters are trained and revived **ten at a time** (`recovery.ts`, `CHUNK = 10`): the retrain cost is `ceil(n / 10) × training.silver` and `ceil(n / 10) × training.dragonCoins`, and "retrain all" still charges the monsters’ revive gold because monsters cannot be retrained back into a march. The per-chunk prices come straight from `monsters.json`.

**Price list, per chunk of ten** (`monsters.json`):

| monster | tier | category · race | dominance/unit | HP | strength | strength-against | silver /10 | dragon coins /10 | revive gold/unit |
|---|---|---|---|---|---|---|---|---|---|
| Ancient Terror (AT) | 7 | mounted · beast | 41 | 840,000 | 280,000 | ranged +752 | 246,000 | 1,640 | 656 |
| Battle Boar (BB) | 3 | mounted · beast | 6 | 11,700 | 3,900 | ranged +113, mounted +144 | 16,800 | 240 | 96 |
| Black Dragon (BD) | 7 | flying · dragon | 44 | 900,000 | 300,000 | melee +570, beasts +729 | 264,000 | 1,760 | 704 |
| Crystal Dragon (CD) | 6 | melee · dragon | 33 | 360,000 | 120,000 | mounted +258, elementals +608 | 172,000 | 1,320 | 528 |
| Desert Vanquisher (DV) | 5 | mounted · dragon | 20 | 126,000 | 42,000 | ranged +253, elementals +324 | 88,000 | 800 | 320 |
| Destructive Colossus (DC) | 7 | ranged · giant | 43 | 870,000 | 290,000 | melee +752, flying +547 | 258,000 | 1,720 | 688 |
| Devastator I (DEV1) | 8 | mounted · dragon | 53 | 1,950,000 | 650,000 | ranged +1,281, giants +667 | 361,000 | 2,120 | 848 |
| Devastator II (DEV2) | 9 | mounted · dragon | 53 | 3,510,000 | 1,170,000 | ranged +1,922, giants +1,000 | 403,000 | 2,120 | 848 |
| Emerald Dragon (ED) | 3 | flying · dragon | 7 | 13,500 | 4,500 | mounted +185, giants +72 | 19,600 | 280 | 112 |
| Ettin (ETT) | 5 | melee · giant | 23 | 144,000 | 48,000 | mounted +334 | 101,200 | 920 | 368 |
| Fearsome Manticore (FM) | 5 | flying · beast | 22 | 138,000 | 46,000 | flying +253, giants +324 | 96,800 | 880 | 352 |
| Fire Phoenix I (FPH1) | 8 | flying · elemental | 54 | 1,980,000 | 660,000 | melee +701, dragons +1,247 | 367,000 | 2,160 | 864 |
| Fire Phoenix II (FPH2) | 9 | flying · elemental | 54 | 3,570,000 | 1,190,000 | melee +1,051, dragons +1,871 | 411,000 | 2,160 | 864 |
| Flaming Centaur (FC) | 5 | mounted · elemental | 21 | 132,000 | 44,000 | ranged +415, beasts +162 | 92,400 | 840 | 336 |
| Gorgon Medusa (GM) | 4 | ranged · beast | 10 | 36,000 | 12,000 | melee +277, flying +108 | 36,000 | 400 | 160 |
| Ice Phoenix (IP) | 4 | flying · elemental | 15 | 51,000 | 17,000 | flying +223, dragons +162 | 54,000 | 600 | 240 |
| Jungle Destroyer (JD) | 6 | melee · beast | 34 | 390,000 | 130,000 | mounted +623, dragons +243 | 177,000 | 1,360 | 544 |
| Kraken I (KRK1) | 8 | melee · giant | 55 | 2,010,000 | 670,000 | mounted +991, beasts +957 | 374,000 | 2,200 | 880 |
| Kraken II (KRK2) | 9 | melee · giant | 55 | 3,630,000 | 1,210,000 | mounted +1,486, beasts +1,435 | 418,000 | 2,200 | 880 |
| Magic Dragon (MD) | 4 | ranged · dragon | 13 | 45,000 | 15,000 | melee +169, ranged +216 | 46,800 | 520 | 208 |
| Many-Armed Guardian (MAG) | 4 | melee · giant | 11 | 39,000 | 13,000 | mounted +115, elementals +270 | 39,600 | 440 | 176 |
| Ruby Golem (RG) | 6 | melee · elemental | 35 | 390,000 | 130,000 | melee +486, mounted +380 | 182,000 | 1,400 | 560 |
| Stone Gargoyle (SG) | 3 | flying · giant | 8 | 15,600 | 5,200 | melee +185, beasts +72 | 22,400 | 320 | 128 |
| Trickster I (TRK1) | 8 | ranged · beast | 52 | 1,920,000 | 640,000 | flying +940, elementals +1,008 | 354,000 | 2,080 | 832 |
| Trickster II (TRK2) | 9 | ranged · beast | 52 | 3,450,000 | 1,150,000 | flying +1,410, elementals +1,512 | 395,000 | 2,080 | 832 |
| Troll Rider (TR) | 6 | mounted · giant | 30 | 330,000 | 110,000 | ranged +380 | 157,000 | 1,200 | 480 |
| Water Elemental (WE) | 3 | ranged · elemental | 3 | 5,700 | 1,900 | melee +113, flying +144 | 8,400 | 120 | 48 |
| Wind Lord (WL) | 7 | melee · elemental | 45 | 930,000 | 310,000 | mounted +387, dragons +911 | 270,000 | 1,800 | 720 |

### one monster on top of the 8 types (SW1 SP2 RD2 RD3 + 4 mercs) (`msRelaxed`)

| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |
|---|---|---|---|---|---|---|---|---|---|
| — (base) | msRelaxed | 4,474,506 | 0 | — | 1,799,300 | 675 | 0 | 10/10 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + DEV2 *(only if you own them)* | msRelaxed | 16,939,814 | 12,465,308 | 1 @ 3,510,000 HP | 2,202,300 | 675 | 2,120 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + KRK2 *(only if you own them)* | msRelaxed | 14,706,414 | 10,231,908 | 1 @ 3,630,000 HP | 2,217,300 | 675 | 2,200 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + TRK2 *(only if you own them)* | msRelaxed | 13,799,364 | 9,324,858 | 1 @ 3,467,250 HP | 2,194,300 | 675 | 2,080 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + FPH2 *(only if you own them)* | msRelaxed | 11,959,564 | 7,485,058 | 1 @ 3,570,000 HP | 2,210,300 | 675 | 2,160 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + DEV1 *(only if you own them)* | msRelaxed | 9,599,364 | 5,124,858 | 1 @ 1,950,000 HP | 2,160,300 | 675 | 2,120 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + KRK1 *(only if you own them)* | msRelaxed | 8,765,964 | 4,291,458 | 1 @ 2,010,000 HP | 2,173,300 | 675 | 2,200 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + TRK1 *(only if you own them)* | msRelaxed | 8,442,314 | 3,967,808 | 1 @ 1,929,600 HP | 2,153,300 | 675 | 2,080 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + FPH1 *(only if you own them)* | msRelaxed | 7,754,414 | 3,279,908 | 1 @ 1,980,000 HP | 2,166,300 | 675 | 2,160 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + JD *(only if you own them)* | msRelaxed | 6,354,306 | 1,879,800 | 1 @ 390,000 HP | 1,976,300 | 675 | 1,360 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + DC *(only if you own them)* | msRelaxed | 6,347,964 | 1,873,458 | 1 @ 874,350 HP | 2,057,300 | 675 | 1,720 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + AT *(only if you own them)* | msRelaxed | 6,303,914 | 1,829,408 | 1 @ 840,000 HP | 2,045,300 | 675 | 1,640 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + BD *(only if you own them)* | msRelaxed | 6,116,114 | 1,641,608 | 1 @ 900,000 HP | 2,063,300 | 675 | 1,760 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + RG *(only if you own them)* | msRelaxed | 5,998,106 | 1,523,600 | 1 @ 390,000 HP | 1,981,300 | 675 | 1,400 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + WL *(only if you own them)* | msRelaxed | 5,865,964 | 1,391,458 | 1 @ 930,000 HP | 2,069,300 | 675 | 1,800 | 11/12 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + FC *(only if you own them)* | msRelaxed | 5,834,106 | 1,359,600 | 3 @ 132,000 HP | 1,891,700 | 1,114 | 840 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + ETT *(only if you own them)* | msRelaxed | 5,724,426 | 1,249,920 | 3 @ 144,000 HP | 1,900,500 | 1,156 | 920 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + GM *(only if you own them)* | msRelaxed | 5,595,734 | 1,121,228 | 14 @ 36,180 HP | 1,871,300 | 1,940 | 800 | 11/12 | CHR6 #1 (0/1) · EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) |
| + TR *(only if you own them)* | msRelaxed | 5,530,506 | 1,056,000 | 1 @ 330,000 HP | 1,956,300 | 675 | 1,200 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + MD *(only if you own them)* | msRelaxed | 5,520,606 | 1,046,100 | 11 @ 45,225 HP | 1,892,900 | 1,898 | 1,040 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + DV *(only if you own them)* | msRelaxed | 5,511,734 | 1,037,228 | 4 @ 126,000 HP | 1,887,300 | 1,312 | 800 | 11/12 | CHR6 #1 (0/1) · EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) |
| + FM *(only if you own them)* | msRelaxed | 5,448,786 | 974,280 | 3 @ 138,000 HP | 1,896,100 | 1,135 | 880 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + IP *(only if you own them)* | msRelaxed | 5,423,854 | 949,348 | 10 @ 51,000 HP | 1,853,300 | 2,097 | 600 | 11/12 | CHR6 #1 (0/1) · EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) |
| + CD *(only if you own them)* | msRelaxed | 5,333,706 | 859,200 | 1 @ 360,000 HP | 1,971,300 | 675 | 1,320 | 12/12 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · LGN6 #7 (2/2) · CHR6 #8 (2/2) |
| + BB *(only if you own them)* | msRelaxed | 5,111,114 | 636,608 | 45 @ 11,700 HP | 1,883,300 | 3,184 | 1,200 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + ED *(only if you own them)* | msRelaxed | 5,111,114 | 636,608 | 39 @ 13,500 HP | 1,877,700 | 3,237 | 1,120 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + MAG *(only if you own them)* | msRelaxed | 5,111,114 | 636,608 | 14 @ 39,000 HP | 1,878,500 | 2,055 | 880 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + SG *(only if you own them)* | msRelaxed | 5,111,114 | 636,608 | 34 @ 15,600 HP | 1,888,900 | 3,184 | 1,280 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |
| + WE *(only if you own them)* | msRelaxed | 5,111,114 | 636,608 | 91 @ 5,729 HP | 1,883,300 | 3,216 | 1,200 | 11/11 | EMH6 #6 (2/2) · ABT6 #7 (2/2) · LGN6 #8 (2/2) · CHR6 #9 (2/2) |

### one monster on top of the winner 7 types (ARC2 RD2 RD3 + 4 mercs) (`msRelaxed`)

| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |
|---|---|---|---|---|---|---|---|---|---|
| — (base) | msRelaxed | 7,843,624 | 0 | — | 2,361,500 | 1,386 | 0 | 8/9 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + DEV2 *(only if you own them)* | msRelaxed | 21,102,063 | 13,258,439 | 1 @ 3,510,000 HP | 2,764,500 | 1,380 | 2,120 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + KRK2 *(only if you own them)* | msRelaxed | 18,868,663 | 11,025,039 | 1 @ 3,630,000 HP | 2,779,500 | 1,380 | 2,200 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + TRK2 *(only if you own them)* | msRelaxed | 17,961,613 | 10,117,989 | 1 @ 3,467,250 HP | 2,756,500 | 1,380 | 2,080 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + FPH2 *(only if you own them)* | msRelaxed | 16,121,813 | 8,278,189 | 1 @ 3,570,000 HP | 2,772,500 | 1,380 | 2,160 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + DEV1 *(only if you own them)* | msRelaxed | 13,761,613 | 5,917,989 | 1 @ 1,950,000 HP | 2,722,500 | 1,380 | 2,120 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + KRK1 *(only if you own them)* | msRelaxed | 12,928,213 | 5,084,589 | 1 @ 2,010,000 HP | 2,735,500 | 1,380 | 2,200 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + DC *(only if you own them)* | msRelaxed | 12,791,024 | 4,947,400 | 1 @ 874,350 HP | 2,619,500 | 1,386 | 1,720 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + AT *(only if you own them)* | msRelaxed | 12,614,824 | 4,771,200 | 1 @ 840,000 HP | 2,607,500 | 1,386 | 1,640 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + TRK1 *(only if you own them)* | msRelaxed | 12,604,563 | 4,760,939 | 1 @ 1,929,600 HP | 2,715,500 | 1,380 | 2,080 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + FPH1 *(only if you own them)* | msRelaxed | 11,916,663 | 4,073,039 | 1 @ 1,980,000 HP | 2,728,500 | 1,380 | 2,160 | 10/11 | EMH6 #5 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + BD *(only if you own them)* | msRelaxed | 11,863,624 | 4,020,000 | 1 @ 900,000 HP | 2,625,500 | 1,386 | 1,760 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + JD *(only if you own them)* | msRelaxed | 11,603,224 | 3,759,600 | 2 @ 390,000 HP | 2,538,500 | 1,741 | 1,360 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + TR *(only if you own them)* | msRelaxed | 11,011,624 | 3,168,000 | 3 @ 330,000 HP | 2,518,500 | 2,013 | 1,200 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + RG *(only if you own them)* | msRelaxed | 10,890,824 | 3,047,200 | 2 @ 390,000 HP | 2,543,500 | 1,752 | 1,400 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + WL *(only if you own them)* | msRelaxed | 10,863,024 | 3,019,400 | 1 @ 930,000 HP | 2,631,500 | 1,386 | 1,800 | 10/11 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #7 (2/2) |
| + FC *(only if you own them)* | msRelaxed | 10,807,292 | 2,963,668 | 8 @ 132,000 HP | 2,453,900 | 2,923 | 840 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + GM *(only if you own them)* | msRelaxed | 10,355,292 | 2,511,668 | 30 @ 36,180 HP | 2,469,500 | 4,209 | 1,200 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + FM *(only if you own them)* | msRelaxed | 10,293,532 | 2,449,908 | 8 @ 138,000 HP | 2,458,300 | 2,996 | 880 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + CD *(only if you own them)* | msRelaxed | 10,283,292 | 2,439,668 | 3 @ 360,000 HP | 2,533,500 | 2,076 | 1,320 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + IP *(only if you own them)* | msRelaxed | 10,147,602 | 2,303,978 | 21 @ 51,000 HP | 2,523,500 | 4,209 | 1,800 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + MD *(only if you own them)* | msRelaxed | 10,135,692 | 2,292,068 | 24 @ 45,225 HP | 2,501,900 | 4,241 | 1,560 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + SG *(only if you own them)* | msRelaxed | 10,046,712 | 2,203,088 | 71 @ 15,600 HP | 2,540,700 | 6,656 | 2,560 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + ED *(only if you own them)* | msRelaxed | 10,046,142 | 2,202,518 | 82 @ 13,500 HP | 2,537,900 | 6,729 | 2,520 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + WE *(only if you own them)* | msRelaxed | 9,892,907 | 2,049,283 | 193 @ 5,729 HP | 2,529,500 | 6,813 | 2,400 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + BB *(only if you own them)* | msRelaxed | 9,888,996 | 2,045,372 | 94 @ 11,700 HP | 2,529,500 | 6,656 | 2,400 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + MAG *(only if you own them)* | msRelaxed | 9,777,092 | 1,933,468 | 28 @ 39,000 HP | 2,480,300 | 4,261 | 1,320 | 10/11 | EMH6 #3 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + DV *(only if you own them)* | msRelaxed | 9,309,741 | 1,466,117 | 9 @ 126,000 HP | 2,449,500 | 3,064 | 800 | 10/10 | EMH6 #2 (1/1) · ABT6 #6 (2/2) · CHR6 #7 (2/2) · LGN6 #8 (2/2) |
| + ETT *(only if you own them)* | msRelaxed | 9,301,864 | 1,458,240 | 7 @ 144,000 HP | 2,462,700 | 2,829 | 920 | 9/10 | EMH6 #3 (1/1) · ABT6 #5 (1/1) · CHR6 #6 (2/2) · LGN6 #8 (2/2) |

## The three best additions, in full (winner march, scenario B, `msRelaxed`)


### + DEV2 (dominance, 53 per unit) — 13,258,439 over the base

DEV2 1 · ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | DEV2 | 1 | 3,510,000 | 23,657,400 | 1,170,000 | 0/1 | 0 | 23,657,400 |
| 2 | ARC2 | 1,697 | 1,114,929 | 594,120 | 439,862 | 1/1 | 594,120 | 594,120 |
| 3 | RD2 | 848 | 1,112,576 | 587,664 | 438,077 | 1/1 | 587,664 | 587,664 |
| 4 | RD3 | 475 | 1,108,175 | 658,160 | 436,240 | 1/1 | 658,160 | 658,160 |
| 5 | EMH6 | 74 | 1,095,126 | 1,345,971 | 431,131 | 1/1 | 1,345,971 | 1,345,971 |
| 6 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 2/2 | 2,301,736 | 2,301,736 |
| 7 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 2/2 | 2,193,360 | 2,193,360 |
| 8 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 2/2 | 1,592,352 | 1,592,352 |

min 9,273,363 · avg 21,102,063 · max 32,930,763 · hits 10/11 · silver 2,764,500 · gold 1,380 · time 13d 14h · pools L 4,343/4,343 A 296/2,000
dragon coins 2,120 · chunks of 10 · warnings: Allow damage trades grew DEV2 to 1; it now falls before RD3. | 1 704 authority left unused so hired units fall after your troops. | 747 dominance left unused so hired units fall after your troops.

### + KRK2 (dominance, 55 per unit) — 11,025,039 over the base

KRK2 1 · ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | KRK2 | 1 | 3,630,000 | 19,190,600 | 1,210,000 | 0/1 | 0 | 19,190,600 |
| 2 | ARC2 | 1,697 | 1,114,929 | 594,120 | 439,862 | 1/1 | 594,120 | 594,120 |
| 3 | RD2 | 848 | 1,112,576 | 587,664 | 438,077 | 1/1 | 587,664 | 587,664 |
| 4 | RD3 | 475 | 1,108,175 | 658,160 | 436,240 | 1/1 | 658,160 | 658,160 |
| 5 | EMH6 | 74 | 1,095,126 | 1,345,971 | 431,131 | 1/1 | 1,345,971 | 1,345,971 |
| 6 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 2/2 | 2,301,736 | 2,301,736 |
| 7 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 2/2 | 2,193,360 | 2,193,360 |
| 8 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 2/2 | 1,592,352 | 1,592,352 |

min 9,273,363 · avg 18,868,663 · max 28,463,963 · hits 10/11 · silver 2,779,500 · gold 1,380 · time 13d 16h · pools L 4,343/4,343 A 296/2,000
dragon coins 2,200 · chunks of 10 · warnings: Allow damage trades grew KRK2 to 1; it now falls before RD3. | 1 704 authority left unused so hired units fall after your troops. | 745 dominance left unused so hired units fall after your troops.

### + TRK2 (dominance, 52 per unit) — 10,117,989 over the base

TRK2 1 · ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | TRK2 | 1 | 3,467,250 | 17,376,500 | 1,161,500 | 0/1 | 0 | 17,376,500 |
| 2 | ARC2 | 1,697 | 1,114,929 | 594,120 | 439,862 | 1/1 | 594,120 | 594,120 |
| 3 | RD2 | 848 | 1,112,576 | 587,664 | 438,077 | 1/1 | 587,664 | 587,664 |
| 4 | RD3 | 475 | 1,108,175 | 658,160 | 436,240 | 1/1 | 658,160 | 658,160 |
| 5 | EMH6 | 74 | 1,095,126 | 1,345,971 | 431,131 | 1/1 | 1,345,971 | 1,345,971 |
| 6 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 2/2 | 2,301,736 | 2,301,736 |
| 7 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 2/2 | 2,193,360 | 2,193,360 |
| 8 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 2/2 | 1,592,352 | 1,592,352 |

min 9,273,363 · avg 17,961,613 · max 26,649,863 · hits 10/11 · silver 2,756,500 · gold 1,380 · time 13d 13h · pools L 4,343/4,343 A 296/2,000
dragon coins 2,080 · chunks of 10 · warnings: Allow damage trades grew TRK2 to 1; it now falls before RD3. | 1 704 authority left unused so hired units fall after your troops. | 748 dominance left unused so hired units fall after your troops.

## Monsters: how many the sizer actually fields, and where the damage comes from

Every monster row above fields exactly **one** unit out of 800 dominance, and that is worth explaining. Under `ms` the monster pool gets the same ceiling as the mercenaries — `smallest troop stack HP − 1` — and a tier-7-to-9 monster has more HP in **one** unit than the whole troop stack, so `sizePool` drops it. It reappears at 1 only because `relaxPreservation` (Allow damage trades) checks the cap and the housing but **not** the ceiling, so it can push one unit in over the top; the sizer then says so in its warnings ("Allow damage trades grew DEV2 to 1; it now falls before RD3"). Under `elite` there is no ceiling at all and the dominance is spent in full.

| monster | method | units | dominance | min | avg | max | dragon coins | damage / coin |
|---|---|---|---|---|---|---|---|---|
| DEV2 | ms | 0 | 0 | 7,528,375 | 7,825,435 | 8,122,495 | 0 | 0 |
| DEV2 | msRelaxed | 1 | 53 | 9,273,363 | 21,102,063 | 32,930,763 | 2,120 | 9,953.8 |
| DEV2 | elite | 15 | 795 | 9,600,762 | 187,031,262 | 364,461,762 | 4,240 | 44,111.15 |
| KRK2 | ms | 0 | 0 | 7,528,375 | 7,825,435 | 8,122,495 | 0 | 0 |
| KRK2 | msRelaxed | 1 | 55 | 9,273,363 | 18,868,663 | 28,463,963 | 2,200 | 8,576.67 |
| KRK2 | elite | 14 | 770 | 9,600,762 | 143,934,962 | 278,269,162 | 4,400 | 32,712.49 |
| TRK2 | ms | 0 | 0 | 7,528,375 | 7,825,435 | 8,122,495 | 0 | 0 |
| TRK2 | msRelaxed | 1 | 52 | 9,273,363 | 17,961,613 | 26,649,863 | 2,080 | 8,635.39 |
| TRK2 | elite | 15 | 780 | 9,600,762 | 139,924,512 | 270,248,262 | 4,160 | 33,635.7 |
| WE | ms | 193 | 579 | 8,679,243 | 8,976,303 | 9,273,363 | 2,400 | 3,740.13 |
| WE | msRelaxed | 193 | 579 | 9,595,847 | 9,892,907 | 10,189,967 | 2,400 | 4,122.04 |
| WE | elite | 266 | 798 | 9,600,762 | 9,600,762 | 9,600,762 | 3,240 | 2,963.2 |
| BB | ms | 94 | 564 | 8,679,243 | 8,976,303 | 9,273,363 | 2,400 | 3,740.13 |
| BB | msRelaxed | 94 | 564 | 9,591,936 | 9,888,996 | 10,186,056 | 2,400 | 4,120.42 |
| BB | elite | 133 | 798 | 9,600,762 | 9,600,762 | 9,600,762 | 3,360 | 2,857.37 |

**Where the damage comes from matters.** A single huge monster lands at kill position 1, where `expectedHits(1, 4)` is **0 enemy-first and 1 army-first**. So its whole contribution sits in the maximum and none of it in the minimum: on the winner march DEV2 takes the average from 7,843,624 to 21,102,063 but the *minimum* only moves because the mercenaries were pushed down into double-hit slots. A player who is told "average damage 21 M" and then fights enemy-first sees 9.3 M. The gain is real but it is a coin flip on who strikes first, and the damage-per-dragon-coin column is the honest way to compare it with the troop and mercenary rows, which cost no coins at all.

## Reading it

- **An extra troop type is not free: it costs a kill position.** Every type added takes leadership away from the others and inserts one more stack in the ladder, which shifts everybody below it down one slot. Because the hits-per-position curve is a staircase (0/1, 1, 1, 1, 1, 2, 2, 2, 2 for N = 4), an addition is worth a lot when it pushes a mercenary from a 1-hit slot into a 2-hit slot and worth less than nothing when it does the reverse.
- **Catapult I is the clearest demonstration of a stack with no features.** It has no `strengthAgainst` entry of any kind, so it targets the melee squad with a bare `count × 250 × (1 + Σ strength %)`, and it costs 10 leadership per unit — the worst damage-per-leadership in the game data. Its only possible use is as HP on top of the ladder, and `killOrder.ts` ranks engineers first for exactly that reason.
- **Monsters are paid in dragon coins, which no other stack costs.** The dominance is free — nothing else in this account can spend it — but the retrain bill is `ceil(n/10) ×` the table price, and for the tier-7 to tier-9 monsters that is 1,600 to 2,200 dragon coins per chunk of ten. A row can look excellent on average damage and be unaffordable; `damagePerDragonCoin` is the figure to compare.
- Whether the account owns or can train a given monster, and whether the technology for SP3 / ARC3 / SW2 / Catapult I exists, are **game questions** this report cannot answer.
