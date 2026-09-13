# A1 — lost hits and the opening attack

Method: for every base × method × bonus scenario the sizer produces a march (`evaluate`); each stack's simulated hits (from the engine journals, `lines`) are compared with `expectedHits(position, 4, armyFirst)`. A **lost hit** is a stack the enemy wipes before its turn because its base-damage rank is worse than its HP rank. Then a best-improvement hill climb over small integer count changes (take m units off one type and put the freed housing on another — the two may sit in different pools —, spend spare housing, or leave units out; every step checked with `feasible`, scored with `evaluateCounts`) measures what buying the hits back is worth. Enemy: 4 squads (melee/ranged/mounted/flying, the export's own). Housing: leadership 4,343, authority 2,000; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37.

## A · E8 owner's 8 types (SW1 SP2 RD2 RD3 + mercs) · elite

EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 192,363 | 1 | 0/0 | 1/1 | — | 1,329,731 |
| 2 | ABT6 | 148,732 | 2 | 1/1 | 1/1 | — | 883,728 |
| 3 | CHR6 | 144,818 | 3 | 1/1 | 1/1 | — | 837,976 |
| 4 | LGN6 | 140,904 | 4 | 1/1 | 1/1 | — | 544,464 |
| 5 | SW1 | 92,391 | 6 | 1/1 | 1/1 | — | 110,331 |
| 6 | SP2 | 92,422 | 5 | 2/2 | 2/2 | — | 145,363 |
| 7 | RD2 | 92,144 | 7 | 2/2 | 2/2 | — | 179,815 |
| 8 | RD3 | 91,958 | 8 | 2/2 | 2/2 | — | 222,307 |

min 3,471,469 · avg 4,136,335 · max 4,801,200 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 192,363), kill position 1; it **is** the first victim; army-first gain max − min = 1,329,731 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SP2 −4 → RD3 +2 → avg 4,138,355 · SP2 −6 → RD2 +3 → avg 4,138,777

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,794 · RD2 500 · RD3 281 · SP2 987
→ avg 4,138,777 (**+2,442**, +0.06 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before SP2

## A · E8 owner's 8 types (SW1 SP2 RD2 RD3 + mercs) · ms

SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 92,391 | 2 | 0/0 | 0/1 | — | 110,331 |
| 2 | SP2 | 92,422 | 1 | 1/1 | 1/1 | — | 145,363 |
| 3 | RD2 | 92,144 | 3 | 1/1 | 1/1 | — | 179,815 |
| 4 | RD3 | 91,958 | 4 | 1/1 | 1/1 | — | 222,307 |
| 5 | ABT6 | 90,022 | 5 | 1/1 | 1/1 | — | 534,888 |
| 6 | LGN6 | 90,022 | 6 | 2/2 | 2/2 | — | 347,852 |
| 7 | CHR6 | 90,022 | 7 | 2/2 | 2/2 | — | 520,904 |
| 8 | EMH6 | 89,909 | 8 | 2/2 | 2/2 | — | 621,505 |

min 4,062,895 · avg 4,062,895 · max 4,062,895 · pools L 4,343/4,343 A 181/2,000

opening attack goes to **SP2** (top base damage 92,422), kill position 2; the first victim is SW1 (position 1); army-first gain max − min = 0 — no stack gains a hit

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SP2 −1 → LGN6 +1 → avg 4,312,513 · SP2 −2 → RD3 +1 → avg 4,313,018 · SP2 +1 (spare housing) → avg 4,313,164

→ SW1 1,794 · RD3 280 · SP2 995 · RD2 497 · LGN6 47 · ABT6 46 · CHR6 23 · EMH6 43
→ avg 4,313,164 (**+250,269**, +6.16 %); lost hits now none
→ hired units still fall after every troop stack: yes

## A · E8 owner's 8 types (SW1 SP2 RD2 RD3 + mercs) · msRelaxed

SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 92,391 | 2 | 0/0 | 0/1 | — | 110,331 |
| 2 | SP2 | 92,422 | 1 | 1/1 | 1/1 | — | 145,363 |
| 3 | RD2 | 92,144 | 3 | 1/1 | 1/1 | — | 179,815 |
| 4 | LGN6 | 91,979 | 4 | 1/1 | 1/1 | — | 355,414 |
| 5 | RD3 | 91,958 | 5 | 1/1 | 1/1 | — | 222,307 |
| 6 | ABT6 | 90,022 | 6 | 2/2 | 2/2 | — | 534,888 |
| 7 | CHR6 | 90,022 | 7 | 2/2 | 2/2 | — | 520,904 |
| 8 | EMH6 | 89,909 | 8 | 2/2 | 2/2 | — | 621,505 |

min 4,257,493 · avg 4,257,493 · max 4,257,493 · pools L 4,343/4,343 A 182/2,000

opening attack goes to **SP2** (top base damage 92,422), kill position 2; the first victim is SW1 (position 1); army-first gain max − min = 0 — no stack gains a hit

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SP2 −2 → RD3 +1 → avg 4,313,164

→ SW1 1,794 · RD3 280 · SP2 995 · RD2 497 · LGN6 47 · ABT6 46 · CHR6 23 · EMH6 43
→ avg 4,313,164 (**+55,671**, +1.31 %); lost hits now none
→ hired units still fall after every troop stack: yes

## A · K7 priority winner, 7 types (ARC2 RD2 RD3 + mercs) · elite

EMH6 92 · ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 192,363 | 1 | 0/0 | 1/1 | — | 1,329,731 |
| 2 | ARC2 | 157,497 | 2 | 1/1 | 1/1 | — | 311,936 |
| 3 | RD2 | 157,034 | 3 | 1/1 | 1/1 | — | 306,445 |
| 4 | RD3 | 156,560 | 4 | 1/1 | 1/1 | — | 378,480 |
| 5 | ABT6 | 148,732 | 5 | 1/1 | 1/1 | — | 883,728 |
| 6 | CHR6 | 144,818 | 6 | 2/2 | 2/2 | — | 837,976 |
| 7 | LGN6 | 140,904 | 7 | 2/2 | 2/2 | — | 544,464 |

min 4,645,469 · avg 5,310,335 · max 5,975,200 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 192,363), kill position 1; it **is** the first victim; army-first gain max − min = 1,329,731 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −23 (left out) → avg 5,646,121 · ARC2 −4 → RD2 +2 → avg 5,648,494 · ARC2 −4 → RD3 +2 → avg 5,649,354

→ RD2 849 · RD3 477 · ARC2 1,691 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72
→ avg 5,649,354 (**+339,019**, +6.38 %); lost hits now none
→ hired units still fall after every troop stack: yes

## A · K7 priority winner, 7 types (ARC2 RD2 RD3 + mercs) · ms

ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 157,497 | 1 | 0/0 | 1/1 | — | 311,936 |
| 2 | RD2 | 157,034 | 2 | 1/1 | 1/1 | — | 306,445 |
| 3 | RD3 | 156,560 | 3 | 1/1 | 1/1 | — | 378,480 |
| 4 | EMH6 | 154,727 | 4 | 1/1 | 1/1 | — | 1,069,566 |
| 5 | ABT6 | 148,732 | 5 | 1/1 | 1/1 | — | 883,728 |
| 6 | CHR6 | 144,818 | 6 | 2/2 | 2/2 | — | 837,976 |
| 7 | LGN6 | 140,904 | 7 | 2/2 | 2/2 | — | 544,464 |

min 5,403,099 · avg 5,559,067 · max 5,715,035 · pools L 4,343/4,343 A 296/2,000

opening attack goes to **ARC2** (top base damage 157,497), kill position 1; it **is** the first victim; army-first gain max − min = 311,936 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −5 (left out) → avg 5,646,121 · ARC2 −4 → RD2 +2 → avg 5,648,494 · ARC2 −4 → RD3 +2 → avg 5,649,354

→ RD2 849 · RD3 477 · ARC2 1,691 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72
→ avg 5,649,354 (**+90,287**, +1.62 %); lost hits now none
→ hired units still fall after every troop stack: yes

## A · K7 priority winner, 7 types (ARC2 RD2 RD3 + mercs) · msRelaxed

ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 157,497 | 1 | 0/0 | 1/1 | — | 311,936 |
| 2 | RD2 | 157,034 | 2 | 1/1 | 1/1 | — | 306,445 |
| 3 | EMH6 | 156,818 | 3 | 1/1 | 1/1 | — | 1,084,020 |
| 4 | RD3 | 156,560 | 4 | 1/1 | 1/1 | — | 378,480 |
| 5 | ABT6 | 148,732 | 5 | 1/1 | 1/1 | — | 883,728 |
| 6 | CHR6 | 144,818 | 6 | 2/2 | 2/2 | — | 837,976 |
| 7 | LGN6 | 140,904 | 7 | 2/2 | 2/2 | — | 544,464 |

min 5,417,553 · avg 5,573,521 · max 5,729,489 · pools L 4,343/4,343 A 297/2,000

opening attack goes to **ARC2** (top base damage 157,497), kill position 1; it **is** the first victim; army-first gain max − min = 311,936 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −6 (left out) → avg 5,646,121 · ARC2 −4 → RD2 +2 → avg 5,648,494 · ARC2 −4 → RD3 +2 → avg 5,649,354

→ RD2 849 · RD3 477 · ARC2 1,691 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72
→ avg 5,649,354 (**+75,833**, +1.36 %); lost hits now none
→ hired units still fall after every troop stack: yes

## A · K8 winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs) · elite

EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 192,363 | 1 | 0/0 | 1/1 | — | 1,329,731 |
| 2 | ABT6 | 148,732 | 2 | 1/1 | 1/1 | — | 883,728 |
| 3 | CHR6 | 144,818 | 3 | 1/1 | 1/1 | — | 837,976 |
| 4 | LGN6 | 140,904 | 4 | 1/1 | 1/1 | — | 544,464 |
| 5 | ARC2 | 113,372 | 5 | 1/1 | 1/1 | — | 224,543 |
| 6 | SP2 | 113,094 | 6 | 2/2 | 2/2 | — | 177,876 |
| 7 | RD2 | 112,909 | 7 | 2/2 | 2/2 | — | 220,336 |
| 8 | RD3 | 112,394 | 8 | 2/2 | 2/2 | — | 271,709 |

min 3,830,553 · avg 4,495,419 · max 5,160,284 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 192,363), kill position 1; it **is** the first victim; army-first gain max − min = 1,329,731 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −38 (left out) → avg 4,771,801 · ARC2 −4 → RD2 +2 → avg 4,775,262 · ABT6 −19 (left out) → avg 5,016,194 · CHR6 −1 (left out) → avg 5,140,302 · RD2 −1 → RD3 +1 → avg 5,141,534 · SP2 −1 → ARC2 +1 → avg 5,141,572

→ LGN6 72 · CHR6 36 · ARC2 1,220 · RD2 610 · SP2 1,219 · EMH6 54 · RD3 342 · ABT6 57
→ avg 5,141,572 (**+646,153**, +14.37 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6, CHR6, EMH6 now fall(s) before RD3

## A · K8 winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs) · ms

ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 113,372 | 1 | 0/0 | 1/1 | — | 224,543 |
| 2 | SP2 | 113,094 | 2 | 1/1 | 1/1 | — | 177,876 |
| 3 | RD2 | 112,909 | 3 | 1/1 | 1/1 | — | 220,336 |
| 4 | RD3 | 112,394 | 4 | 1/1 | 1/1 | — | 271,709 |
| 5 | ABT6 | 111,549 | 5 | 1/1 | 1/1 | — | 662,796 |
| 6 | LGN6 | 111,549 | 6 | 2/2 | 2/2 | — | 431,034 |
| 7 | EMH6 | 110,818 | 7 | 2/2 | 2/2 | — | 766,041 |
| 8 | CHR6 | 109,592 | 8 | 2/2 | 2/2 | — | 634,144 |

min 4,995,155 · avg 5,107,427 · max 5,219,698 · pools L 4,343/4,343 A 223/2,000

opening attack goes to **ARC2** (top base damage 113,372), kill position 1; it **is** the first victim; army-first gain max − min = 224,543 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: ABT6 −1 (left out) → avg 5,315,933 · ARC2 −2 → SP2 +2 → avg 5,339,045 · RD2 −2 → RD3 +2 → avg 5,339,915

→ SP2 1,222 · ARC2 1,221 · RD3 343 · RD2 607 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 28
→ avg 5,339,915 (**+232,488**, +4.55 %); lost hits now none
→ hired units still fall after every troop stack: yes

## A · K8 winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs) · msRelaxed

LGN6 58 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | LGN6 | 113,506 | 1 | 0/0 | 1/1 | — | 438,596 |
| 2 | ARC2 | 113,372 | 2 | 1/1 | 1/1 | — | 224,543 |
| 3 | SP2 | 113,094 | 3 | 1/1 | 1/1 | — | 177,876 |
| 4 | RD2 | 112,909 | 4 | 1/1 | 1/1 | — | 220,336 |
| 5 | RD3 | 112,394 | 5 | 1/1 | 1/1 | — | 271,709 |
| 6 | ABT6 | 111,549 | 6 | 2/2 | 2/2 | — | 662,796 |
| 7 | EMH6 | 110,818 | 7 | 2/2 | 2/2 | — | 766,041 |
| 8 | CHR6 | 109,592 | 8 | 2/2 | 2/2 | — | 634,144 |

min 5,020,426 · avg 5,239,724 · max 5,459,022 · pools L 4,343/4,343 A 224/2,000

opening attack goes to **LGN6** (top base damage 113,506), kill position 1; it **is** the first victim; army-first gain max − min = 438,596 — the extra hit lands on LGN6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: ARC2 −5 → SP2 +5 → avg 5,369,531 · RD2 −3 → RD3 +3 → avg 5,370,836 · RD2 −3 → ARC2 +6 → avg 5,370,851

→ SP2 1,225 · LGN6 58 · ARC2 1,224 · RD3 344 · RD2 603 · ABT6 57 · EMH6 53 · CHR6 28
→ avg 5,370,851 (**+131,127**, +2.50 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6 now fall(s) before RD2

## A · T12 all 12 types · elite

EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · RD3 112

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 192,363 | 1 | 0/0 | 1/1 | — | 1,329,731 |
| 2 | ABT6 | 148,732 | 2 | 1/1 | 1/1 | — | 883,728 |
| 3 | CHR6 | 144,818 | 3 | 1/1 | 1/1 | — | 837,976 |
| 4 | LGN6 | 140,904 | 4 | 1/1 | 1/1 | — | 544,464 |
| 5 | SW1 | 37,595 | 5 | 1/1 | 1/1 | — | 44,895 |
| 6 | ARC1 | 37,492 | 6 | 2/2 | 2/2 | — | 61,880 |
| 7 | SP1 | 37,441 | 7 | 2/2 | 2/2 | — | 51,617 |
| 8 | RD1 | 37,389 | 8 | 2/2 | 2/2 | — | 60,984 |
| 9 | ARC2 | 37,358 | 9 | 2/2 | 2/2 | — | 73,991 |
| 10 | SP2 | 37,358 | 10 | 3/3 | 3/3 | — | 58,757 |
| 11 | RD2 | 37,265 | 11 | 3/3 | 3/3 | — | 72,722 |
| 12 | RD3 | 36,915 | 12 | 3/3 | 3/3 | — | 89,242 |

min 3,470,170 · avg 4,135,036 · max 4,799,901 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 192,363), kill position 1; it **is** the first victim; army-first gain max − min = 1,329,731 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SP1 −4 → SP2 +4 → avg 4,150,870 · RD2 −1 → RD3 +1 → avg 4,152,172

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 730 · SP2 407 · ARC1 728 · RD1 363 · SP1 723 · ARC2 403 · RD3 113 · RD2 200
→ avg 4,152,172 (**+17,136**, +0.41 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD2

## A · T12 all 12 types · ms

SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · RD3 112 · EMH6 17 · ABT6 18 · LGN6 18 · CHR6 9

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 37,595 | 1 | 0/0 | 1/1 | — | 44,895 |
| 2 | ARC1 | 37,492 | 2 | 1/1 | 1/1 | — | 61,880 |
| 3 | SP1 | 37,441 | 3 | 1/1 | 1/1 | — | 51,617 |
| 4 | RD1 | 37,389 | 4 | 1/1 | 1/1 | — | 60,984 |
| 5 | ARC2 | 37,358 | 5 | 1/1 | 1/1 | — | 73,991 |
| 6 | SP2 | 37,358 | 6 | 2/2 | 2/2 | — | 58,757 |
| 7 | RD2 | 37,265 | 7 | 2/2 | 2/2 | — | 72,722 |
| 8 | RD3 | 36,915 | 8 | 2/2 | 2/2 | — | 89,242 |
| 9 | EMH6 | 35,545 | 9 | 2/2 | 2/2 | — | 245,711 |
| 10 | ABT6 | 35,226 | 10 | 3/3 | 3/3 | — | 209,304 |
| 11 | LGN6 | 35,226 | 11 | 3/3 | 3/3 | — | 136,116 |
| 12 | CHR6 | 35,226 | 12 | 3/3 | 3/3 | — | 203,832 |

min 2,829,092 · avg 2,851,540 · max 2,873,987 · pools L 4,343/4,343 A 71/2,000

opening attack goes to **SW1** (top base damage 37,595), kill position 1; it **is** the first victim; army-first gain max − min = 44,895 — the extra hit lands on SW1 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: LGN6 +54 (spare housing) → avg 3,057,573 · EMH6 +50 (spare housing) → avg 3,439,057 · CHR6 +27 (spare housing) → avg 3,767,228 · ABT6 +53 (spare housing) → avg 4,085,541 · SP1 −4 → SP2 +4 → avg 4,101,375 · RD2 −1 → RD3 +1 → avg 4,102,677

→ LGN6 72 · CHR6 36 · EMH6 67 · ABT6 71 · SW1 730 · SP2 407 · ARC1 728 · RD1 363 · SP1 723 · ARC2 403 · RD3 113 · RD2 200
→ avg 4,102,677 (**+1,251,137**, +43.88 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6, CHR6, EMH6, ABT6 now fall(s) before RD2

## A · T12 all 12 types · msRelaxed

SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · LGN6 19 · RD3 112 · EMH6 17 · ABT6 18 · CHR6 9

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 37,595 | 1 | 0/0 | 1/1 | — | 44,895 |
| 2 | ARC1 | 37,492 | 2 | 1/1 | 1/1 | — | 61,880 |
| 3 | SP1 | 37,441 | 3 | 1/1 | 1/1 | — | 51,617 |
| 4 | RD1 | 37,389 | 4 | 1/1 | 1/1 | — | 60,984 |
| 5 | ARC2 | 37,358 | 5 | 1/1 | 1/1 | — | 73,991 |
| 6 | SP2 | 37,358 | 6 | 2/2 | 2/2 | — | 58,757 |
| 7 | RD2 | 37,265 | 7 | 2/2 | 2/2 | — | 72,722 |
| 8 | LGN6 | 37,183 | 8 | 2/2 | 2/2 | — | 143,678 |
| 9 | RD3 | 36,915 | 9 | 2/2 | 2/2 | — | 89,242 |
| 10 | EMH6 | 35,545 | 10 | 3/3 | 3/3 | — | 245,711 |
| 11 | ABT6 | 35,226 | 11 | 3/3 | 3/3 | — | 209,304 |
| 12 | CHR6 | 35,226 | 12 | 3/3 | 3/3 | — | 203,832 |

min 2,953,811 · avg 2,976,259 · max 2,998,706 · pools L 4,343/4,343 A 72/2,000

opening attack goes to **SW1** (top base damage 37,595), kill position 1; it **is** the first victim; army-first gain max − min = 44,895 — the extra hit lands on SW1 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: LGN6 +53 (spare housing) → avg 3,057,573 · EMH6 +50 (spare housing) → avg 3,439,057 · CHR6 +27 (spare housing) → avg 3,767,228 · ABT6 +53 (spare housing) → avg 4,085,541 · SP1 −4 → SP2 +4 → avg 4,101,375 · RD2 −1 → RD3 +1 → avg 4,102,677

→ LGN6 72 · CHR6 36 · EMH6 67 · ABT6 71 · SW1 730 · SP2 407 · ARC1 728 · RD1 363 · SP1 723 · ARC2 403 · RD3 113 · RD2 200
→ avg 4,102,677 (**+1,126,418**, +37.85 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6, CHR6, EMH6, ABT6 now fall(s) before RD2

## B · E8 owner's 8 types (SW1 SP2 RD2 RD3 + mercs) · elite

EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 536,001 | 1 | 0/0 | 1/1 | — | 1,673,370 |
| 2 | ABT6 | 415,872 | 2 | 1/1 | 1/1 | — | 1,150,868 |
| 3 | CHR6 | 403,522 | 3 | 1/1 | 1/1 | — | 1,096,680 |
| 4 | LGN6 | 392,616 | 4 | 1/1 | 1/1 | — | 796,176 |
| 5 | SW1 | 197,249 | 8 | 1/1 | 1/1 | — | 220,319 |
| 6 | SP2 | 205,607 | 5 | 2/2 | 2/2 | — | 247,874 |
| 7 | RD2 | 205,090 | 6 | 2/2 | 2/2 | — | 275,121 |
| 8 | RD3 | 204,803 | 7 | 2/2 | 2/2 | — | 308,989 |

min 4,928,011 · avg 5,764,696 · max 6,601,381 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 536,001), kill position 1; it **is** the first victim; army-first gain max − min = 1,673,370 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SW1 −2 → RD3 +1 → avg 5,767,275 · SW1 −2 → RD2 +1 → avg 5,768,470

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,303 · RD3 224 · SP2 796 · RD2 398
→ avg 5,768,470 (**+3,774**, +0.07 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD2

## B · E8 owner's 8 types (SW1 SP2 RD2 RD3 + mercs) · ms

SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 197,249 | 7 | 0/0 | 0/1 | — | 220,319 |
| 2 | SP2 | 205,607 | 1 | 1/1 | 1/1 | — | 247,874 |
| 3 | RD2 | 205,090 | 2 | 1/1 | 1/1 | — | 275,121 |
| 4 | RD3 | 204,803 | 3 | 1/1 | 1/1 | — | 308,989 |
| 5 | EMH6 | 203,914 | 4 | 1/1 | 1/1 | — | 636,608 |
| 6 | ABT6 | 202,464 | 5 | 2/2 | 2/2 | — | 560,291 |
| 7 | LGN6 | 201,761 | 6 | 2/2 | 2/2 | — | 409,146 |
| 8 | CHR6 | 196,308 | 8 | 2/2 | 2/2 | — | 533,520 |

min 4,474,506 · avg 4,474,506 · max 4,474,506 · pools L 4,343/4,343 A 145/2,000

opening attack goes to **SP2** (top base damage 205,607), kill position 2; the first victim is SW1 (position 1); army-first gain max − min = 0 — no stack gains a hit

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SW1 −25 → LGN6 +25 → avg 4,853,551 · RD2 −28 → EMH6 +56 → avg 4,987,037 · RD3 −19 → CHR6 +19 → avg 5,273,012 · SP2 −39 → ABT6 +39 → avg 5,526,884 · LGN6 +10 (spare housing) → avg 5,637,464 · RD3 +18 (spare housing) → avg 5,687,346 · RD2 +25 (spare housing) → avg 5,721,996 · SP2 +32 (spare housing) → avg 5,741,926 · EMH6 +1 (spare housing) → avg 5,751,020 · SW1 +40 (spare housing) → avg 5,754,840

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,322 · RD3 222 · SP2 789 · RD2 394
→ avg 5,754,840 (**+1,280,334**, +28.61 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD2

## B · E8 owner's 8 types (SW1 SP2 RD2 RD3 + mercs) · msRelaxed

SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 197,249 | 7 | 0/0 | 0/1 | — | 220,319 |
| 2 | SP2 | 205,607 | 1 | 1/1 | 1/1 | — | 247,874 |
| 3 | RD2 | 205,090 | 2 | 1/1 | 1/1 | — | 275,121 |
| 4 | RD3 | 204,803 | 3 | 1/1 | 1/1 | — | 308,989 |
| 5 | EMH6 | 203,914 | 4 | 1/1 | 1/1 | — | 636,608 |
| 6 | ABT6 | 202,464 | 5 | 2/2 | 2/2 | — | 560,291 |
| 7 | LGN6 | 201,761 | 6 | 2/2 | 2/2 | — | 409,146 |
| 8 | CHR6 | 196,308 | 8 | 2/2 | 2/2 | — | 533,520 |

min 4,474,506 · avg 4,474,506 · max 4,474,506 · pools L 4,343/4,343 A 145/2,000

opening attack goes to **SP2** (top base damage 205,607), kill position 2; the first victim is SW1 (position 1); army-first gain max − min = 0 — no stack gains a hit

No lost hit: every stack strikes as often as the closed form says.

Small count changes: SW1 −25 → LGN6 +25 → avg 4,853,551 · RD2 −28 → EMH6 +56 → avg 4,987,037 · RD3 −19 → CHR6 +19 → avg 5,273,012 · SP2 −39 → ABT6 +39 → avg 5,526,884 · LGN6 +10 (spare housing) → avg 5,637,464 · RD3 +18 (spare housing) → avg 5,687,346 · RD2 +25 (spare housing) → avg 5,721,996 · SP2 +32 (spare housing) → avg 5,741,926 · EMH6 +1 (spare housing) → avg 5,751,020 · SW1 +40 (spare housing) → avg 5,754,840

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,322 · RD3 222 · SP2 789 · RD2 394
→ avg 5,754,840 (**+1,280,334**, +28.61 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD2

## B · K7 priority winner, 7 types (ARC2 RD2 RD3 + mercs) · elite

EMH6 92 · ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 536,001 | 1 | 0/0 | 1/1 | — | 1,673,370 |
| 2 | ARC2 | 439,862 | 2 | 1/1 | 1/1 | — | 594,120 |
| 3 | RD2 | 438,077 | 3 | 1/1 | 1/1 | — | 587,664 |
| 4 | RD3 | 436,240 | 4 | 1/1 | 1/1 | — | 658,160 |
| 5 | ABT6 | 415,872 | 5 | 1/1 | 1/1 | — | 1,150,868 |
| 6 | CHR6 | 403,522 | 6 | 2/2 | 2/2 | — | 1,096,680 |
| 7 | LGN6 | 392,616 | 7 | 2/2 | 2/2 | — | 796,176 |

min 6,776,524 · avg 7,613,209 · max 8,449,894 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 536,001), kill position 1; it **is** the first victim; army-first gain max − min = 1,673,370 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −23 (left out) → avg 7,892,838 · ARC2 −4 → RD2 +2 → avg 7,895,358 · ARC2 −6 → RD3 +3 → avg 7,897,415

→ RD2 850 · RD3 478 · ARC2 1,687 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72
→ avg 7,897,415 (**+284,206**, +3.73 %); lost hits now none
→ hired units still fall after every troop stack: yes

## B · K7 priority winner, 7 types (ARC2 RD2 RD3 + mercs) · ms

ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 439,862 | 1 | 0/0 | 1/1 | — | 594,120 |
| 2 | RD2 | 438,077 | 2 | 1/1 | 1/1 | — | 587,664 |
| 3 | RD3 | 436,240 | 3 | 1/1 | 1/1 | — | 658,160 |
| 4 | EMH6 | 431,131 | 4 | 1/1 | 1/1 | — | 1,345,971 |
| 5 | ABT6 | 415,872 | 5 | 1/1 | 1/1 | — | 1,150,868 |
| 6 | CHR6 | 403,522 | 6 | 2/2 | 2/2 | — | 1,096,680 |
| 7 | LGN6 | 392,616 | 7 | 2/2 | 2/2 | — | 796,176 |

min 7,528,375 · avg 7,825,435 · max 8,122,495 · pools L 4,343/4,343 A 296/2,000

opening attack goes to **ARC2** (top base damage 439,862), kill position 1; it **is** the first victim; army-first gain max − min = 594,120 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −5 (left out) → avg 7,892,838 · ARC2 −4 → RD2 +2 → avg 7,895,358 · ARC2 −6 → RD3 +3 → avg 7,897,415

→ RD2 850 · RD3 478 · ARC2 1,687 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72
→ avg 7,897,415 (**+71,980**, +0.92 %); lost hits now none
→ hired units still fall after every troop stack: yes

## B · K7 priority winner, 7 types (ARC2 RD2 RD3 + mercs) · msRelaxed

ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 439,862 | 1 | 0/0 | 1/1 | — | 594,120 |
| 2 | RD2 | 438,077 | 2 | 1/1 | 1/1 | — | 587,664 |
| 3 | EMH6 | 436,958 | 3 | 1/1 | 1/1 | — | 1,364,160 |
| 4 | RD3 | 436,240 | 4 | 1/1 | 1/1 | — | 658,160 |
| 5 | ABT6 | 415,872 | 5 | 1/1 | 1/1 | — | 1,150,868 |
| 6 | CHR6 | 403,522 | 6 | 2/2 | 2/2 | — | 1,096,680 |
| 7 | LGN6 | 392,616 | 7 | 2/2 | 2/2 | — | 796,176 |

min 7,546,564 · avg 7,843,624 · max 8,140,684 · pools L 4,343/4,343 A 297/2,000

opening attack goes to **ARC2** (top base damage 439,862), kill position 1; it **is** the first victim; army-first gain max − min = 594,120 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: EMH6 −6 (left out) → avg 7,892,838 · ARC2 −4 → RD2 +2 → avg 7,895,358 · ARC2 −6 → RD3 +3 → avg 7,897,415

→ RD2 850 · RD3 478 · ARC2 1,687 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72
→ avg 7,897,415 (**+53,791**, +0.69 %); lost hits now none
→ hired units still fall after every troop stack: yes

## B · K8 winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs) · elite

EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 536,001 | 1 | 0/0 | 1/1 | — | 1,673,370 |
| 2 | ABT6 | 415,872 | 2 | 1/1 | 1/1 | — | 1,150,868 |
| 3 | CHR6 | 403,522 | 3 | 1/1 | 1/1 | — | 1,096,680 |
| 4 | LGN6 | 392,616 | 4 | 1/1 | 1/1 | — | 796,176 |
| 5 | ARC2 | 316,483 | 5 | 1/1 | 1/1 | — | 427,472 |
| 6 | SP2 | 315,126 | 6 | 2/2 | 2/2 | — | 379,908 |
| 7 | RD2 | 314,609 | 7 | 2/2 | 2/2 | — | 422,037 |
| 8 | RD3 | 314,093 | 8 | 2/2 | 2/2 | — | 473,875 |

min 6,022,836 · avg 6,859,521 · max 7,696,206 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 536,001), kill position 1; it **is** the first victim; army-first gain max − min = 1,673,370 — the extra hit lands on EMH6 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: ABT6 −19 (left out) → avg 7,055,047 · CHR6 −9 (left out) → avg 7,196,170 · EMH6 −39 (left out) → avg 7,415,534 · ARC2 −16 → RD3 +8 → avg 7,421,018 · SP2 −10 → RD3 +5 → avg 7,424,832 · LGN6 −13 (left out) → avg 7,433,222 · RD3 −14 → RD2 +14 → avg 7,453,601 · RD2 −18 → SP2 +36 → avg 7,474,204 · RD2 −1 → ARC2 +2 → avg 7,474,211

→ SP2 1,246 · LGN6 59 · RD3 341 · ARC2 1,207 · RD2 604 · ABT6 57 · EMH6 53 · CHR6 28
→ avg 7,474,211 (**+614,690**, +8.96 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6 now fall(s) before RD2

## B · K8 winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs) · ms

ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 316,483 | 1 | 0/0 | 1/1 | — | 427,472 |
| 2 | SP2 | 315,126 | 2 | 1/1 | 1/1 | — | 379,908 |
| 3 | RD2 | 314,609 | 3 | 1/1 | 1/1 | — | 422,037 |
| 4 | RD3 | 314,093 | 4 | 1/1 | 1/1 | — | 473,875 |
| 5 | ABT6 | 311,904 | 5 | 1/1 | 1/1 | — | 863,151 |
| 6 | LGN6 | 310,821 | 6 | 2/2 | 2/2 | — | 630,306 |
| 7 | EMH6 | 308,783 | 7 | 2/2 | 2/2 | — | 964,006 |
| 8 | CHR6 | 305,368 | 8 | 2/2 | 2/2 | — | 829,920 |

min 6,987,435 · avg 7,201,171 · max 7,414,907 · pools L 4,343/4,343 A 223/2,000

opening attack goes to **ARC2** (top base damage 316,483), kill position 1; it **is** the first victim; army-first gain max − min = 427,472 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: LGN6 +15 (spare housing) → avg 7,415,534 · ARC2 −16 → RD3 +8 → avg 7,421,018 · SP2 −10 → RD3 +5 → avg 7,424,832 · LGN6 −13 (left out) → avg 7,433,222 · RD3 −14 → RD2 +14 → avg 7,453,601 · RD2 −18 → SP2 +36 → avg 7,474,204 · RD2 −1 → ARC2 +2 → avg 7,474,211

→ SP2 1,246 · LGN6 59 · RD3 341 · ARC2 1,207 · RD2 604 · ABT6 57 · EMH6 53 · CHR6 28
→ avg 7,474,211 (**+273,040**, +3.79 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6 now fall(s) before RD2

## B · K8 winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs) · msRelaxed

ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 316,483 | 1 | 0/0 | 1/1 | — | 427,472 |
| 2 | SP2 | 315,126 | 2 | 1/1 | 1/1 | — | 379,908 |
| 3 | RD2 | 314,609 | 3 | 1/1 | 1/1 | — | 422,037 |
| 4 | RD3 | 314,093 | 4 | 1/1 | 1/1 | — | 473,875 |
| 5 | ABT6 | 311,904 | 5 | 1/1 | 1/1 | — | 863,151 |
| 6 | LGN6 | 310,821 | 6 | 2/2 | 2/2 | — | 630,306 |
| 7 | EMH6 | 308,783 | 7 | 2/2 | 2/2 | — | 964,006 |
| 8 | CHR6 | 305,368 | 8 | 2/2 | 2/2 | — | 829,920 |

min 6,987,435 · avg 7,201,171 · max 7,414,907 · pools L 4,343/4,343 A 223/2,000

opening attack goes to **ARC2** (top base damage 316,483), kill position 1; it **is** the first victim; army-first gain max − min = 427,472 — the extra hit lands on ARC2 (position 1)

No lost hit: every stack strikes as often as the closed form says.

Small count changes: LGN6 +15 (spare housing) → avg 7,415,534 · ARC2 −16 → RD3 +8 → avg 7,421,018 · SP2 −10 → RD3 +5 → avg 7,424,832 · LGN6 −13 (left out) → avg 7,433,222 · RD3 −14 → RD2 +14 → avg 7,453,601 · RD2 −18 → SP2 +36 → avg 7,474,204 · RD2 −1 → ARC2 +2 → avg 7,474,211

→ SP2 1,246 · LGN6 59 · RD3 341 · ARC2 1,207 · RD2 604 · ABT6 57 · EMH6 53 · CHR6 28
→ avg 7,474,211 (**+273,040**, +3.79 %); lost hits now none
→ hired units still fall after every troop stack: no — LGN6 now fall(s) before RD2

## B · T12 all 12 types · elite

EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 536,001 | 1 | 0/0 | 1/1 | — | 1,673,370 |
| 2 | ABT6 | 415,872 | 2 | 1/1 | 1/1 | — | 1,150,868 |
| 3 | CHR6 | 403,522 | 3 | 1/1 | 1/1 | — | 1,096,680 |
| 4 | LGN6 | 392,616 | 4 | 1/1 | 1/1 | — | 796,176 |
| 5 | SW1 | 91,143 | 12 | 1/1 | 1/1 | — | 101,803 |
| 6 | ARC1 | 95,184 | 5 | 2/2 | 2/2 | — | 117,328 |
| 7 | SP1 | 94,710 | 6 | 2/2 | 2/2 | — | 107,580 |
| 8 | RD1 | 94,423 | 8 | 1/2 | 1/2 | **1 × 115,808** | 115,808 |
| 9 | ARC2 | 94,608 | 7 | 2/2 | 2/2 | — | 127,787 |
| 10 | SP2 | 94,280 | 9 | 3/3 | 3/3 | — | 113,661 |
| 11 | RD2 | 94,021 | 10 | 3/3 | 3/3 | — | 126,126 |
| 12 | RD3 | 93,677 | 11 | 3/3 | 3/3 | — | 141,331 |

min 5,110,079 · avg 5,946,764 · max 6,783,449 · pools L 4,343/4,343 A 314/2,000

opening attack goes to **EMH6** (top base damage 536,001), kill position 1; it **is** the first victim; army-first gain max − min = 1,673,370 — the extra hit lands on EMH6 (position 1)

Lost: RD1 (position 8, 1 of 2, −115,808) — **115,808** off the enemy-first total.

Small count changes: ARC2 −1 → SP2 +1 → avg 6,076,267 · SW1 −2 → RD1 +1 → avg 6,076,780 · SW1 −1 → ARC2 +1 → avg 6,077,738 · SP1 −1 → SP2 +1 → avg 6,078,036 · ARC2 −3 → RD3 +1 → avg 6,079,041 · SW1 +1 (spare housing) → avg 6,079,136 · ARC1 −1 → SP2 +1 → avg 6,079,402 · RD2 −1 → ARC2 +2 → avg 6,079,423

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,064 · SP2 368 · ARC1 660 · RD1 330 · SP1 659 · RD3 103 · ARC2 364 · RD2 181
→ avg 6,079,423 (**+132,659**, +2.23 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD2

## B · T12 all 12 types · ms

SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102 · EMH6 16 · ABT6 17 · LGN6 17 · CHR6 8

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 91,143 | 11 | 0/0 | 0/1 | — | 101,803 |
| 2 | ARC1 | 95,184 | 1 | 1/1 | 1/1 | — | 117,328 |
| 3 | SP1 | 94,710 | 2 | 1/1 | 1/1 | — | 107,580 |
| 4 | RD1 | 94,423 | 4 | 0/1 | 1/1 | **1 × 115,808** | 115,808 |
| 5 | ARC2 | 94,608 | 3 | 1/1 | 1/1 | — | 127,787 |
| 6 | SP2 | 94,280 | 5 | 2/2 | 2/2 | — | 113,661 |
| 7 | RD2 | 94,021 | 6 | 2/2 | 2/2 | — | 126,126 |
| 8 | RD3 | 93,677 | 7 | 2/2 | 2/2 | — | 141,331 |
| 9 | EMH6 | 93,218 | 8 | 2/2 | 2/2 | — | 291,021 |
| 10 | ABT6 | 93,024 | 9 | 3/3 | 3/3 | — | 257,431 |
| 11 | LGN6 | 92,701 | 10 | 3/3 | 3/3 | — | 187,986 |
| 12 | CHR6 | 87,248 | 12 | 3/3 | 3/3 | — | 237,120 |

min 3,744,584 · avg 3,802,488 · max 3,860,392 · pools L 4,343/4,343 A 66/2,000

opening attack goes to **ARC1** (top base damage 95,184), kill position 2; the first victim is SW1 (position 1); army-first gain max − min = 115,808 — the extra hit lands on RD1 (position 4)

Lost: RD1 (position 4, 0 of 1, −115,808) — **115,808** off the enemy-first total.

Small count changes: CHR6 +29 (spare housing) → avg 4,116,180 · RD1 −38 → EMH6 +76 → avg 4,819,630 · SW1 −59 → ABT6 +59 → avg 5,486,712 · LGN6 +55 (spare housing) → avg 5,967,841 · RD1 +60 (spare housing) → avg 6,027,551 · RD1 −28 → SW1 +56 → avg 6,058,097 · ARC2 −10 → RD1 +5 → avg 6,065,205 · ARC2 +6 (spare housing) → avg 6,071,505 · RD1 +2 (spare housing) → avg 6,072,913 · ARC2 +3 (spare housing) → avg 6,076,063

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,063 · ARC1 661 · SP1 660 · RD1 330 · SP2 365 · ARC2 364 · RD2 182 · RD3 102
→ avg 6,076,063 (**+2,273,575**, +59.79 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD3

## B · T12 all 12 types · msRelaxed

SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102 · EMH6 16 · ABT6 17 · LGN6 17 · CHR6 8

| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |
|---|---|---|---|---|---|---|---|
| 1 | SW1 | 91,143 | 11 | 0/0 | 0/1 | — | 101,803 |
| 2 | ARC1 | 95,184 | 1 | 1/1 | 1/1 | — | 117,328 |
| 3 | SP1 | 94,710 | 2 | 1/1 | 1/1 | — | 107,580 |
| 4 | RD1 | 94,423 | 4 | 0/1 | 1/1 | **1 × 115,808** | 115,808 |
| 5 | ARC2 | 94,608 | 3 | 1/1 | 1/1 | — | 127,787 |
| 6 | SP2 | 94,280 | 5 | 2/2 | 2/2 | — | 113,661 |
| 7 | RD2 | 94,021 | 6 | 2/2 | 2/2 | — | 126,126 |
| 8 | RD3 | 93,677 | 7 | 2/2 | 2/2 | — | 141,331 |
| 9 | EMH6 | 93,218 | 8 | 2/2 | 2/2 | — | 291,021 |
| 10 | ABT6 | 93,024 | 9 | 3/3 | 3/3 | — | 257,431 |
| 11 | LGN6 | 92,701 | 10 | 3/3 | 3/3 | — | 187,986 |
| 12 | CHR6 | 87,248 | 12 | 3/3 | 3/3 | — | 237,120 |

min 3,744,584 · avg 3,802,488 · max 3,860,392 · pools L 4,343/4,343 A 66/2,000

opening attack goes to **ARC1** (top base damage 95,184), kill position 2; the first victim is SW1 (position 1); army-first gain max − min = 115,808 — the extra hit lands on RD1 (position 4)

Lost: RD1 (position 4, 0 of 1, −115,808) — **115,808** off the enemy-first total.

Small count changes: CHR6 +29 (spare housing) → avg 4,116,180 · RD1 −38 → EMH6 +76 → avg 4,819,630 · SW1 −59 → ABT6 +59 → avg 5,486,712 · LGN6 +55 (spare housing) → avg 5,967,841 · RD1 +60 (spare housing) → avg 6,027,551 · RD1 −28 → SW1 +56 → avg 6,058,097 · ARC2 −10 → RD1 +5 → avg 6,065,205 · ARC2 +6 (spare housing) → avg 6,071,505 · RD1 +2 (spare housing) → avg 6,072,913 · ARC2 +3 (spare housing) → avg 6,076,063

→ EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,063 · ARC1 661 · SP1 660 · RD1 330 · SP2 365 · ARC2 364 · RD2 182 · RD3 102
→ avg 6,076,063 (**+2,273,575**, +59.79 %); lost hits now none
→ hired units still fall after every troop stack: no — EMH6, ABT6, CHR6, LGN6 now fall(s) before RD3

## Summary

| scenario | base | method | stacks | avg damage | lost hits | damage lost | army-first gain | best small change | gain |
|---|---|---|---|---|---|---|---|---|---|
| A | E8 | elite | 8 | 4,136,335 | 0 | 0 | 1,329,731 | SP2 −4 → RD3 +2, SP2 −6 → RD2 +3 | +2,442 |
| A | E8 | ms | 8 | 4,062,895 | 0 | 0 | 0 | SP2 −1 → LGN6 +1, SP2 −2 → RD3 +1, SP2 +1 (spare housing) | +250,269 |
| A | E8 | msRelaxed | 8 | 4,257,493 | 0 | 0 | 0 | SP2 −2 → RD3 +1 | +55,671 |
| A | K7 | elite | 7 | 5,310,335 | 0 | 0 | 1,329,731 | EMH6 −23 (left out), ARC2 −4 → RD2 +2, ARC2 −4 → RD3 +2 | +339,019 |
| A | K7 | ms | 7 | 5,559,067 | 0 | 0 | 311,936 | EMH6 −5 (left out), ARC2 −4 → RD2 +2, ARC2 −4 → RD3 +2 | +90,287 |
| A | K7 | msRelaxed | 7 | 5,573,521 | 0 | 0 | 311,936 | EMH6 −6 (left out), ARC2 −4 → RD2 +2, ARC2 −4 → RD3 +2 | +75,833 |
| A | K8 | elite | 8 | 4,495,419 | 0 | 0 | 1,329,731 | EMH6 −38 (left out), ARC2 −4 → RD2 +2, ABT6 −19 (left out), CHR6 −1 (left out), RD2 −1 → RD3 +1, SP2 −1 → ARC2 +1 | +646,153 |
| A | K8 | ms | 8 | 5,107,427 | 0 | 0 | 224,543 | ABT6 −1 (left out), ARC2 −2 → SP2 +2, RD2 −2 → RD3 +2 | +232,488 |
| A | K8 | msRelaxed | 8 | 5,239,724 | 0 | 0 | 438,596 | ARC2 −5 → SP2 +5, RD2 −3 → RD3 +3, RD2 −3 → ARC2 +6 | +131,127 |
| A | T12 | elite | 12 | 4,135,036 | 0 | 0 | 1,329,731 | SP1 −4 → SP2 +4, RD2 −1 → RD3 +1 | +17,136 |
| A | T12 | ms | 12 | 2,851,540 | 0 | 0 | 44,895 | LGN6 +54 (spare housing), EMH6 +50 (spare housing), CHR6 +27 (spare housing), ABT6 +53 (spare housing), SP1 −4 → SP2 +4, RD2 −1 → RD3 +1 | +1,251,137 |
| A | T12 | msRelaxed | 12 | 2,976,259 | 0 | 0 | 44,895 | LGN6 +53 (spare housing), EMH6 +50 (spare housing), CHR6 +27 (spare housing), ABT6 +53 (spare housing), SP1 −4 → SP2 +4, RD2 −1 → RD3 +1 | +1,126,418 |
| B | E8 | elite | 8 | 5,764,696 | 0 | 0 | 1,673,370 | SW1 −2 → RD3 +1, SW1 −2 → RD2 +1 | +3,774 |
| B | E8 | ms | 8 | 4,474,506 | 0 | 0 | 0 | SW1 −25 → LGN6 +25, RD2 −28 → EMH6 +56, RD3 −19 → CHR6 +19, SP2 −39 → ABT6 +39, LGN6 +10 (spare housing), RD3 +18 (spare housing), RD2 +25 (spare housing), SP2 +32 (spare housing), EMH6 +1 (spare housing), SW1 +40 (spare housing) | +1,280,334 |
| B | E8 | msRelaxed | 8 | 4,474,506 | 0 | 0 | 0 | SW1 −25 → LGN6 +25, RD2 −28 → EMH6 +56, RD3 −19 → CHR6 +19, SP2 −39 → ABT6 +39, LGN6 +10 (spare housing), RD3 +18 (spare housing), RD2 +25 (spare housing), SP2 +32 (spare housing), EMH6 +1 (spare housing), SW1 +40 (spare housing) | +1,280,334 |
| B | K7 | elite | 7 | 7,613,209 | 0 | 0 | 1,673,370 | EMH6 −23 (left out), ARC2 −4 → RD2 +2, ARC2 −6 → RD3 +3 | +284,206 |
| B | K7 | ms | 7 | 7,825,435 | 0 | 0 | 594,120 | EMH6 −5 (left out), ARC2 −4 → RD2 +2, ARC2 −6 → RD3 +3 | +71,980 |
| B | K7 | msRelaxed | 7 | 7,843,624 | 0 | 0 | 594,120 | EMH6 −6 (left out), ARC2 −4 → RD2 +2, ARC2 −6 → RD3 +3 | +53,791 |
| B | K8 | elite | 8 | 6,859,521 | 0 | 0 | 1,673,370 | ABT6 −19 (left out), CHR6 −9 (left out), EMH6 −39 (left out), ARC2 −16 → RD3 +8, SP2 −10 → RD3 +5, LGN6 −13 (left out), RD3 −14 → RD2 +14, RD2 −18 → SP2 +36, RD2 −1 → ARC2 +2 | +614,690 |
| B | K8 | ms | 8 | 7,201,171 | 0 | 0 | 427,472 | LGN6 +15 (spare housing), ARC2 −16 → RD3 +8, SP2 −10 → RD3 +5, LGN6 −13 (left out), RD3 −14 → RD2 +14, RD2 −18 → SP2 +36, RD2 −1 → ARC2 +2 | +273,040 |
| B | K8 | msRelaxed | 8 | 7,201,171 | 0 | 0 | 427,472 | LGN6 +15 (spare housing), ARC2 −16 → RD3 +8, SP2 −10 → RD3 +5, LGN6 −13 (left out), RD3 −14 → RD2 +14, RD2 −18 → SP2 +36, RD2 −1 → ARC2 +2 | +273,040 |
| B | T12 | elite | 12 | 5,946,764 | 1 | 115,808 | 1,673,370 | ARC2 −1 → SP2 +1, SW1 −2 → RD1 +1, SW1 −1 → ARC2 +1, SP1 −1 → SP2 +1, ARC2 −3 → RD3 +1, SW1 +1 (spare housing), ARC1 −1 → SP2 +1, RD2 −1 → ARC2 +2 | +132,659 |
| B | T12 | ms | 12 | 3,802,488 | 1 | 115,808 | 115,808 | CHR6 +29 (spare housing), RD1 −38 → EMH6 +76, SW1 −59 → ABT6 +59, LGN6 +55 (spare housing), RD1 +60 (spare housing), RD1 −28 → SW1 +56, ARC2 −10 → RD1 +5, ARC2 +6 (spare housing), RD1 +2 (spare housing), ARC2 +3 (spare housing) | +2,273,575 |
| B | T12 | msRelaxed | 12 | 3,802,488 | 1 | 115,808 | 115,808 | CHR6 +29 (spare housing), RD1 −38 → EMH6 +76, SW1 −59 → ABT6 +59, LGN6 +55 (spare housing), RD1 +60 (spare housing), RD1 −28 → SW1 +56, ARC2 −10 → RD1 +5, ARC2 +6 (spare housing), RD1 +2 (spare housing), ARC2 +3 (spare housing) | +2,273,575 |

## One correction to the "army first" rule

The short rule "striking first is worth a hit only if the top base-damage stack is also the first victim" is **not quite right**, and this pass has a counter-example. What "your army first" really does is insert **one extra army action** before the first enemy attack; that action is taken by the top base-damage stack, and it shifts every later in-between attack of round 1 one slot down the attack order. The extra action turns into an extra hit whenever the shift lets one more stack strike before it is wiped — which is normally the first victim, but not always.

Counter-example, scenario B over all 12 types (`ms` and `msRelaxed`): the opening attack goes to ARC1 at kill position 2, **not** to the first victim SW1 — and yet max − min = 115,808, the extra hit landing on **RD1 at position 4**. Enemy-first, round 1 runs ARC1, SP1, ARC2 in the three in-between slots and RD1 is wiped by the fourth enemy attack before its turn; army-first, ARC1 takes the opening slot, the three in-between slots become SP1, ARC2, RD1, and RD1 gets its strike in. SW1 stays at 0 hits in both. In the other 22 marches of this pass the opener is the first victim (and gains a full hit) or the gain is 0.
