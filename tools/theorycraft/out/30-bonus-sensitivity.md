# C1 — what one bonus point is worth

Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37 (314 authority at full, so the **caps** bind and the authority housing never does). Enemy 1 melee / 1 ranged / 1 mounted / 1 flying, so N = 4 and every stack dies.

Read the two tables as two different questions. **Frozen counts** = the march on screen, one bonus point more, nobody re-sized. **Re-solved** = press Generate again and let the sizer spend the housing differently. Neither is noise-free: even at frozen counts a *health* point changes total HP, hence the kill order, hence which stack sits at position 1 and loses its enemy-first hit — worth up to ±0.8 M on a march whose stacks are near-equal in HP. A `linear? no` row is exactly that: an order flip, not a non-linear formula. The formula itself is strictly linear in every strength key (Mechanism 1 and 4 below prove it term by term).

## Baselines


**B · winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed** — ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
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

**B · 8 types · msRelaxed** — SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18
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

**B · 12 types · elite** — EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 92 | 1,361,508 | 1,673,370 | 536,001 | 0/1 | 0 | 1,673,370 |
| 2 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 1/1 | 1,150,868 | 1,150,868 |
| 3 | CHR6 | 37 | 1,024,974 | 1,096,680 | 403,522 | 1/1 | 1,096,680 | 1,096,680 |
| 4 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 1/1 | 796,176 | 796,176 |
| 5 | SW1 | 1,066 | 241,982 | 101,803 | 91,143 | 1/1 | 101,803 | 101,803 |
| 6 | ARC1 | 661 | 241,265 | 117,328 | 95,184 | 2/2 | 234,656 | 234,656 |
| 7 | SP1 | 660 | 240,900 | 107,580 | 94,710 | 2/2 | 215,160 | 215,160 |
| 8 | RD1 | 329 | 239,841 | 115,808 | 94,423 | 1/1 | 115,808 | 115,808 |
| 9 | ARC2 | 365 | 239,805 | 127,787 | 94,608 | 2/2 | 255,574 | 255,574 |
| 10 | SP2 | 365 | 239,440 | 113,661 | 94,280 | 3/3 | 340,983 | 340,983 |
| 11 | RD2 | 182 | 238,784 | 126,126 | 94,021 | 3/3 | 378,378 | 378,378 |
| 12 | RD3 | 102 | 237,966 | 141,331 | 93,677 | 3/3 | 423,993 | 423,993 |

min 5,110,079 · avg 5,946,764 · max 6,783,449 · hits 20/21 · silver 1,603,300 · gold 1,464 · time 3d 19h · pools L 4,343/4,343 A 314/2,000

**A · winner 7 types · msRelaxed (check)** — ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,699 | 472,322 | 311,936 | 157,497 | 0/1 | 0 | 311,936 |
| 2 | RD2 | 847 | 470,932 | 306,445 | 157,034 | 1/1 | 306,445 | 306,445 |
| 3 | EMH6 | 75 | 470,475 | 1,084,020 | 156,818 | 1/1 | 1,084,020 | 1,084,020 |
| 4 | RD3 | 475 | 469,775 | 378,480 | 156,560 | 1/1 | 378,480 | 378,480 |
| 5 | ABT6 | 76 | 446,196 | 883,728 | 148,732 | 1/1 | 883,728 | 883,728 |
| 6 | CHR6 | 37 | 434,454 | 837,976 | 144,818 | 2/2 | 1,675,952 | 1,675,952 |
| 7 | LGN6 | 72 | 422,712 | 544,464 | 140,904 | 2/2 | 1,088,928 | 1,088,928 |

min 5,417,553 · avg 5,573,521 · max 5,729,489 · hits 8/9 · silver 2,361,500 · gold 2,120 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

**A · 8 types · msRelaxed (check)** — SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | SW1 | 1,794 | 278,070 | 110,331 | 92,391 | 0/0 | 0 | 0 |
| 2 | SP2 | 997 | 277,166 | 145,363 | 92,422 | 1/1 | 145,363 | 145,363 |
| 3 | RD2 | 497 | 276,332 | 179,815 | 92,144 | 1/1 | 179,815 | 179,815 |
| 4 | LGN6 | 47 | 275,937 | 355,414 | 91,979 | 1/1 | 355,414 | 355,414 |
| 5 | RD3 | 279 | 275,931 | 222,307 | 91,958 | 1/1 | 222,307 | 222,307 |
| 6 | ABT6 | 46 | 270,066 | 534,888 | 90,022 | 2/2 | 1,069,776 | 1,069,776 |
| 7 | CHR6 | 23 | 270,066 | 520,904 | 90,022 | 2/2 | 1,041,808 | 1,041,808 |
| 8 | EMH6 | 43 | 269,739 | 621,505 | 89,909 | 2/2 | 1,243,010 | 1,243,010 |

min 4,257,493 · avg 4,257,493 · max 4,257,493 · hits 10/10 · silver 1,924,300 · gold 1,288 · time 7d 4h · pools L 4,343/4,343 A 182/2,000

**A · 12 types · elite (check)** — EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · RD3 112
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 92 | 577,116 | 1,329,731 | 192,363 | 0/1 | 0 | 1,329,731 |
| 2 | ABT6 | 76 | 446,196 | 883,728 | 148,732 | 1/1 | 883,728 | 883,728 |
| 3 | CHR6 | 37 | 434,454 | 837,976 | 144,818 | 1/1 | 837,976 | 837,976 |
| 4 | LGN6 | 72 | 422,712 | 544,464 | 140,904 | 1/1 | 544,464 | 544,464 |
| 5 | SW1 | 730 | 113,150 | 44,895 | 37,595 | 1/1 | 44,895 | 44,895 |
| 6 | ARC1 | 728 | 112,840 | 61,880 | 37,492 | 2/2 | 123,760 | 123,760 |
| 7 | SP1 | 727 | 112,685 | 51,617 | 37,441 | 2/2 | 103,234 | 103,234 |
| 8 | RD1 | 363 | 112,167 | 60,984 | 37,389 | 2/2 | 121,968 | 121,968 |
| 9 | ARC2 | 403 | 112,034 | 73,991 | 37,358 | 2/2 | 147,982 | 147,982 |
| 10 | SP2 | 403 | 112,034 | 58,757 | 37,358 | 3/3 | 176,271 | 176,271 |
| 11 | RD2 | 201 | 111,756 | 72,722 | 37,265 | 3/3 | 218,166 | 218,166 |
| 12 | RD3 | 112 | 110,768 | 89,242 | 36,915 | 3/3 | 267,726 | 267,726 |

min 3,470,170 · avg 4,135,036 · max 4,799,901 · hits 21/22 · silver 1,634,100 · gold 2,240 · time 4d 2h · pools L 4,343/4,343 A 314/2,000

## B · winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed

baseline avg **7,843,624**

### Frozen counts (same march, more bonus)

| key | +1 | +5 | +10 | Δ / point | linear? |
|---|---|---|---|---|---|
| health army | 0 | 0 | 0 | 0 | yes |
| health guardsmen | 0 | 0 | 0 | 0 | yes |
| health specialist | 0 | 0 | 0 | 0 | yes |
| health melee | 0 | 0 | -796,176 | -79,618 | **no** |
| health ranged | 0 | 0 | 0 | 0 | yes |
| health mounted | -619,684 | -948,764 | -894,576 | -89,458 | **no** |
| strength army | 12,325 | 61,623 | 123,246 | 12,325 | yes |
| strength guardsmen | 12,325 | 61,623 | 123,246 | 12,325 | yes |
| strength specialist | 0 | 0 | 0 | 0 | yes |
| strength melee | 2,736 | 13,680 | -1,069,320 | -106,932 | **no** |
| strength ranged | 2,208 | 11,038 | 22,077 | 2,208 | yes |
| strength mounted | -1,358,302 | -949,848 | -920,556 | -92,056 | **no** |
| special armyStrengthAgainstEpicMonsters | 12,325 | 61,623 | 123,246 | 12,325 | yes |
| special doubleDamageChance | 0 | 0 | 0 | 0 | yes |

### Re-solved (press Generate again)

| key | +1 | +5 | +10 | counts move? | march at +10 |
|---|---|---|---|---|---|
| health army | 693 | 1,036 | 0 | yes | — |
| health guardsmen | 693 | 1,036 | 0 | yes | — |
| health specialist | 0 | 0 | 0 | no | — |
| health melee | 0 | 0 | -796,176 | no | — |
| health ranged | 1,379 | -286,667 | -258,777 | yes | ARC2 1,655 · RD2 861 · RD3 483 · EMH6 76 · ABT6 76 · CHR6 37 · LGN6 72 |
| health mounted | -658,846 | -570,131 | 78,517 | yes | ARC2 1,739 · EMH6 77 · RD2 834 · RD3 468 · CHR6 37 · ABT6 76 · LGN6 72 |
| strength army | 12,325 | 61,623 | 123,246 | no | — |
| strength guardsmen | 12,325 | 61,623 | 123,246 | no | — |
| strength specialist | 0 | 0 | 0 | no | — |
| strength melee | 2,736 | 13,680 | -1,069,320 | no | — |
| strength ranged | 2,208 | 11,038 | 22,077 | no | — |
| strength mounted | -12,331 | -285,957 | -256,665 | yes | ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| special armyStrengthAgainstEpicMonsters | 12,325 | 61,623 | 123,246 | no | — |
| special doubleDamageChance | 0 | 0 | 0 | no | — |

**Double damage is not in either table's numbers.** The engine keeps procs out of `avgDamage` on purpose, so both `doubleDamageChance` rows read 0. By hand: a proc is a plain ×2 on one hit, features included, so a stack's expected damage is `hits × damage × (1 + chance/100)`. The chances this march already carries are worth **407,268** on top of 7,843,624 (+5.19 %):
- ARC2: 3 % × 0.5 hits × 594,120 = 8,912
- RD2: 8 % × 1 hits × 587,664 = 47,013
- EMH6: 3 % × 1 hits × 1,364,160 = 40,925
- RD3: 8 % × 1 hits × 658,160 = 52,653
- ABT6: 3 % × 1 hits × 1,150,868 = 34,526
- CHR6: 8 % × 2 hits × 1,096,680 = 175,469
- LGN6: 3 % × 2 hits × 796,176 = 47,771

The army-wide key touches every stack, so one point of `doubleDamageChance` is worth exactly avg / 100 = **78,436 per point**, perfectly linear. That is larger than any single strength point in the table above — double damage is the most valuable percentage on this account, and it is the one the app's headline figure does not show.

## B · 8 types · msRelaxed

baseline avg **4,474,506**

### Frozen counts (same march, more bonus)

| key | +1 | +5 | +10 | Δ / point | linear? |
|---|---|---|---|---|---|
| health army | 0 | 0 | 0 | 0 | yes |
| health guardsmen | -123,937 | -463,909 | -243,590 | -24,359 | **no** |
| health specialist | 0 | 0 | 0 | 0 | yes |
| health melee | -409,146 | -181,684 | -181,684 | -18,168 | **no** |
| health ranged | 0 | -483,974 | -483,974 | -48,397 | **no** |
| health mounted | -137,560 | -429,615 | -326,527 | -32,653 | **no** |
| strength army | 7,036 | 35,176 | 70,351 | 7,035 | yes |
| strength guardsmen | 7,036 | 35,176 | 70,351 | 7,035 | yes |
| strength specialist | 0 | 0 | 115,927 | 11,593 | **no** |
| strength melee | 2,123 | -687,239 | -676,627 | -67,663 | **no** |
| strength ranged | 1,406 | -116,907 | -109,877 | -10,988 | **no** |
| strength mounted | -121,141 | -233,893 | -780,203 | -78,020 | **no** |
| special armyStrengthAgainstEpicMonsters | 7,036 | 35,176 | 70,351 | 7,035 | yes |
| special doubleDamageChance | 0 | 0 | 0 | 0 | yes |

### Re-solved (press Generate again)

| key | +1 | +5 | +10 | counts move? | march at +10 |
|---|---|---|---|---|---|
| health army | 0 | 242,537 | 308,536 | yes | SW1 2,281 · SP2 806 · RD2 402 · RD3 226 · LGN6 38 · CHR6 19 · EMH6 35 · ABT6 37 |
| health guardsmen | 37,549 | 151,067 | -88,356 | yes | SW1 2,350 · SP2 779 · RD2 389 · RD3 218 · EMH6 34 · ABT6 36 · LGN6 36 · CHR6 18 |
| health specialist | 1,316 | 310,857 | 403,643 | yes | SW1 2,237 · SP2 824 · LGN6 39 · RD2 411 · RD3 230 · EMH6 36 · ABT6 38 · CHR6 19 |
| health melee | 29,493 | -129,033 | 129,783 | yes | SW1 2,254 · SP2 797 · RD2 414 · RD3 232 · LGN6 37 · EMH6 36 · ABT6 38 · CHR6 19 |
| health ranged | 0 | -30,286 | 61,174 | yes | SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · ABT6 36 · EMH6 35 · LGN6 37 · CHR6 18 |
| health mounted | 26,651 | -73,070 | -477,908 | yes | SW1 2,333 · SP2 806 · RD2 386 · RD3 216 · CHR6 18 · EMH6 35 · ABT6 37 · LGN6 37 |
| strength army | 7,036 | 35,176 | 70,351 | no | — |
| strength guardsmen | 7,036 | 35,176 | 70,351 | no | — |
| strength specialist | 0 | 0 | 115,927 | no | — |
| strength melee | 2,123 | 33,805 | 39,192 | yes | LGN6 38 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · CHR6 18 |
| strength ranged | 1,406 | -116,907 | -109,877 | no | — |
| strength mounted | 31,214 | -233,893 | -378,834 | yes | CHR6 19 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 |
| special armyStrengthAgainstEpicMonsters | 7,036 | 35,176 | 70,351 | no | — |
| special doubleDamageChance | 0 | 0 | 0 | no | — |

**Double damage is not in either table's numbers.** The engine keeps procs out of `avgDamage` on purpose, so both `doubleDamageChance` rows read 0. By hand: a proc is a plain ×2 on one hit, features included, so a stack's expected damage is `hits × damage × (1 + chance/100)`. The chances this march already carries are worth **216,793** on top of 4,474,506 (+4.85 %):
- SW1: 3 % × 0 hits × 220,319 = 0
- SP2: 3 % × 1 hits × 247,874 = 7,436
- RD2: 8 % × 1 hits × 275,121 = 22,010
- RD3: 8 % × 1 hits × 308,989 = 24,719
- EMH6: 3 % × 1 hits × 636,608 = 19,098
- ABT6: 3 % × 2 hits × 560,291 = 33,617
- LGN6: 3 % × 2 hits × 409,146 = 24,549
- CHR6: 8 % × 2 hits × 533,520 = 85,363

The army-wide key touches every stack, so one point of `doubleDamageChance` is worth exactly avg / 100 = **44,745 per point**, perfectly linear. That is larger than any single strength point in the table above — double damage is the most valuable percentage on this account, and it is the one the app's headline figure does not show.

## B · 12 types · elite

baseline avg **5,946,764**

### Frozen counts (same march, more bonus)

| key | +1 | +5 | +10 | Δ / point | linear? |
|---|---|---|---|---|---|
| health army | 115,808 | 115,808 | 0 | 0 | **no** |
| health guardsmen | -1,520 | 88,425 | -27,383 | -2,738 | **no** |
| health specialist | 0 | 0 | 0 | 0 | yes |
| health melee | -91,307 | -91,307 | -887,483 | -88,748 | **no** |
| health ranged | -1,520 | -129,307 | -129,307 | -12,931 | **no** |
| health mounted | 1,661 | -299,547 | -1,396,227 | -139,623 | **no** |
| strength army | 10,942 | 54,696 | 109,393 | 10,939 | **no** |
| strength guardsmen | 10,409 | 52,031 | 104,063 | 10,406 | **no** |
| strength specialist | 533 | 2,665 | 5,330 | 533 | yes |
| strength melee | 3,548 | -99,594 | -1,178,543 | -117,854 | **no** |
| strength ranged | 10,988 | 22,036 | 35,848 | 3,585 | **no** |
| strength mounted | -101,404 | -202,631 | -1,333,369 | -133,337 | **no** |
| special armyStrengthAgainstEpicMonsters | 10,942 | 54,696 | 109,393 | 10,939 | **no** |
| special doubleDamageChance | 0 | 0 | 0 | 0 | yes |

### Re-solved (press Generate again)

| key | +1 | +5 | +10 | counts move? | march at +10 |
|---|---|---|---|---|---|
| health army | 115,778 | 118,713 | 7,057 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,048 · ARC1 665 · SP1 664 · RD1 331 · ARC2 367 · SP2 367 · RD2 183 · RD3 102 |
| health guardsmen | 114,104 | 105,055 | -16,939 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,098 · ARC1 655 · SP1 654 · RD1 326 · ARC2 361 · SP2 361 · RD2 180 · RD3 101 |
| health specialist | 116,810 | 12,279 | 32,028 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,015 · ARC1 671 · SP1 670 · RD1 335 · ARC2 371 · SP2 370 · RD2 185 · RD3 103 |
| health melee | 8,960 | 36,637 | -875,496 | yes | EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37 · SW1 1,026 · ARC1 678 · SP1 650 · RD1 338 · ARC2 374 · SP2 359 · RD2 186 · RD3 104 |
| health ranged | -1,629 | -537 | 1,992 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,076 · ARC1 641 · SP1 666 · RD1 333 · ARC2 354 · SP2 368 · RD3 103 · RD2 183 |
| health mounted | -1,399 | -9,392 | -1,110,003 | yes | EMH6 92 · CHR6 37 · ABT6 76 · LGN6 72 · SW1 1,077 · ARC1 669 · SP1 667 · RD1 320 · ARC2 369 · SP2 369 · RD2 177 · RD3 99 |
| strength army | 10,942 | 54,696 | 109,393 | no | — |
| strength guardsmen | 10,409 | 52,031 | 104,063 | no | — |
| strength specialist | 533 | 2,665 | 5,330 | no | — |
| strength melee | 3,548 | -99,594 | -1,178,543 | no | — |
| strength ranged | 10,988 | 22,036 | 35,848 | no | — |
| strength mounted | -101,404 | -202,631 | -1,333,369 | no | — |
| special armyStrengthAgainstEpicMonsters | 10,942 | 54,696 | 109,393 | no | — |
| special doubleDamageChance | 0 | 0 | 0 | no | — |

**Double damage is not in either table's numbers.** The engine keeps procs out of `avgDamage` on purpose, so both `doubleDamageChance` rows read 0. By hand: a proc is a plain ×2 on one hit, features included, so a stack's expected damage is `hits × damage × (1 + chance/100)`. The chances this march already carries are worth **279,146** on top of 5,946,764 (+4.69 %):
- EMH6: 3 % × 0.5 hits × 1,673,370 = 25,101
- ABT6: 3 % × 1 hits × 1,150,868 = 34,526
- CHR6: 8 % × 1 hits × 1,096,680 = 87,734
- LGN6: 3 % × 1 hits × 796,176 = 23,885
- SW1: 3 % × 1 hits × 101,803 = 3,054
- ARC1: 3 % × 2 hits × 117,328 = 7,040
- SP1: 3 % × 2 hits × 107,580 = 6,455
- RD1: 8 % × 1 hits × 115,808 = 9,265
- ARC2: 3 % × 2 hits × 127,787 = 7,667
- SP2: 3 % × 3 hits × 113,661 = 10,229
- RD2: 8 % × 3 hits × 126,126 = 30,270
- RD3: 8 % × 3 hits × 141,331 = 33,919

The army-wide key touches every stack, so one point of `doubleDamageChance` is worth exactly avg / 100 = **59,468 per point**, perfectly linear. That is larger than any single strength point in the table above — double damage is the most valuable percentage on this account, and it is the one the app's headline figure does not show.

## A · winner 7 types · msRelaxed (check)

baseline avg **5,573,521**

### Frozen counts (same march, more bonus)

| key | +1 | +5 | +10 | Δ / point | linear? |
|---|---|---|---|---|---|
| health army | 0 | 0 | 0 | 0 | yes |
| health guardsmen | 0 | 0 | 0 | 0 | yes |
| health specialist | 0 | 0 | 0 | 0 | yes |
| health melee | 0 | -544,464 | 339,264 | 33,926 | **no** |
| health ranged | 0 | 0 | -883,728 | -88,373 | **no** |
| health mounted | -528,957 | -483,205 | -1,321,181 | -132,118 | **no** |
| strength army | 12,324 | 61,619 | 123,237 | 12,324 | yes |
| strength guardsmen | 12,324 | 61,619 | 123,237 | 12,324 | yes |
| strength specialist | 0 | 0 | 0 | 0 | yes |
| strength melee | 2,736 | -824,296 | -810,616 | -81,062 | **no** |
| strength ranged | 2,209 | 11,043 | -284,359 | -28,436 | **no** |
| strength mounted | -692,122 | -668,695 | -1,181,422 | -118,142 | **no** |
| special armyStrengthAgainstEpicMonsters | 12,324 | 61,619 | 123,237 | 12,324 | yes |
| special doubleDamageChance | 0 | 0 | 0 | 0 | yes |

### Re-solved (press Generate again)

| key | +1 | +5 | +10 | counts move? | march at +10 |
|---|---|---|---|---|---|
| health army | -13,840 | 178 | 0 | yes | — |
| health guardsmen | -13,840 | 178 | 0 | yes | — |
| health specialist | 0 | 0 | 0 | no | — |
| health melee | 0 | -544,464 | 339,264 | no | — |
| health ranged | -152,927 | -128,555 | -549,978 | yes | ARC2 1,603 · RD2 878 · RD3 492 · ABT6 75 · EMH6 77 · CHR6 37 · LGN6 72 |
| health mounted | -306,324 | -234,367 | -207,612 | yes | ARC2 1,795 · RD2 816 · RD3 458 · EMH6 79 · CHR6 37 · ABT6 76 · LGN6 72 |
| strength army | 12,324 | 61,619 | 123,237 | no | — |
| strength guardsmen | 12,324 | 61,619 | 123,237 | no | — |
| strength specialist | 0 | 0 | 0 | no | — |
| strength melee | 2,736 | -824,296 | -810,616 | no | — |
| strength ranged | 2,209 | 11,043 | -284,359 | no | — |
| strength mounted | -164,566 | -141,139 | -646,639 | yes | ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| special armyStrengthAgainstEpicMonsters | 12,324 | 61,619 | 123,237 | no | — |
| special doubleDamageChance | 0 | 0 | 0 | no | — |

**Double damage is not in either table's numbers.** The engine keeps procs out of `avgDamage` on purpose, so both `doubleDamageChance` rows read 0. By hand: a proc is a plain ×2 on one hit, features included, so a stack's expected damage is `hits × damage × (1 + chance/100)`. The chances this march already carries are worth **118,044** on top of 5,573,521 (+2.12 %):
- ARC2: 0 % × 0.5 hits × 311,936 = 0
- RD2: 5 % × 1 hits × 306,445 = 15,322
- EMH6: 0 % × 1 hits × 1,084,020 = 0
- RD3: 5 % × 1 hits × 378,480 = 18,924
- ABT6: 0 % × 1 hits × 883,728 = 0
- CHR6: 5 % × 2 hits × 837,976 = 83,798
- LGN6: 0 % × 2 hits × 544,464 = 0

The army-wide key touches every stack, so one point of `doubleDamageChance` is worth exactly avg / 100 = **55,735 per point**, perfectly linear. That is larger than any single strength point in the table above — double damage is the most valuable percentage on this account, and it is the one the app's headline figure does not show.

## A · 8 types · msRelaxed (check)

baseline avg **4,257,493**

### Frozen counts (same march, more bonus)

| key | +1 | +5 | +10 | Δ / point | linear? |
|---|---|---|---|---|---|
| health army | 37,650 | 37,650 | 0 | 0 | **no** |
| health guardsmen | -142,165 | -1,087,626 | -1,087,626 | -108,763 | **no** |
| health specialist | 0 | 0 | 0 | 0 | yes |
| health melee | -317,764 | -317,764 | -177,707 | -17,771 | **no** |
| health ranged | 0 | -792,303 | -792,303 | -79,230 | **no** |
| health mounted | -291,791 | -978,185 | -978,185 | -97,818 | **no** |
| strength army | 8,819 | 44,096 | 88,195 | 8,820 | yes |
| strength guardsmen | 8,819 | 44,096 | 88,195 | 8,820 | yes |
| strength specialist | 55,614 | 57,408 | 59,651 | 5,965 | **no** |
| strength melee | -88,117 | -80,956 | -72,004 | -7,200 | **no** |
| strength ranged | 1,748 | -63,941 | -55,201 | -5,520 | **no** |
| strength mounted | -676,716 | -840,281 | -822,604 | -82,260 | **no** |
| special armyStrengthAgainstEpicMonsters | 8,819 | 44,096 | 88,195 | 8,820 | yes |
| special doubleDamageChance | 0 | 0 | 0 | 0 | yes |

### Re-solved (press Generate again)

| key | +1 | +5 | +10 | counts move? | march at +10 |
|---|---|---|---|---|---|
| health army | -124,818 | 54,935 | 0 | yes | — |
| health guardsmen | 53,368 | -148,228 | -258,556 | yes | SW1 1,892 · SP2 959 · RD2 478 · RD3 268 · ABT6 45 · LGN6 45 · EMH6 42 · CHR6 22 |
| health specialist | -226,425 | 69,950 | 185,925 | yes | SW1 1,696 · SP2 1,035 · LGN6 49 · RD2 516 · RD3 290 · EMH6 45 · ABT6 48 · CHR6 24 |
| health melee | -386,987 | 8,499 | 65,699 | yes | SW1 1,733 · SP2 964 · RD2 527 · RD3 296 · LGN6 45 · EMH6 46 · ABT6 49 · CHR6 24 |
| health ranged | 0 | -217,854 | -241,110 | yes | SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 42 · LGN6 46 · CHR6 23 · EMH6 43 |
| health mounted | -302,589 | -210,828 | -465,999 | yes | SW1 1,851 · SP2 1,030 · RD2 468 · RD3 263 · CHR6 22 · EMH6 45 · ABT6 48 · LGN6 48 |
| strength army | 8,819 | 44,096 | 88,195 | no | — |
| strength guardsmen | 8,819 | 44,096 | 88,195 | no | — |
| strength specialist | 55,614 | 57,408 | 59,651 | no | — |
| strength melee | -88,117 | -80,956 | -72,004 | no | — |
| strength ranged | 1,748 | -63,941 | -55,201 | no | — |
| strength mounted | -684,278 | -670,136 | -652,459 | yes | SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 |
| special armyStrengthAgainstEpicMonsters | 8,819 | 44,096 | 88,195 | no | — |
| special doubleDamageChance | 0 | 0 | 0 | no | — |

**Double damage is not in either table's numbers.** The engine keeps procs out of `avgDamage` on purpose, so both `doubleDamageChance` rows read 0. By hand: a proc is a plain ×2 on one hit, features included, so a stack's expected damage is `hits × damage × (1 + chance/100)`. The chances this march already carries are worth **72,197** on top of 4,257,493 (+1.7 %):
- SW1: 0 % × 0 hits × 110,331 = 0
- SP2: 0 % × 1 hits × 145,363 = 0
- RD2: 5 % × 1 hits × 179,815 = 8,991
- LGN6: 0 % × 1 hits × 355,414 = 0
- RD3: 5 % × 1 hits × 222,307 = 11,115
- ABT6: 0 % × 2 hits × 534,888 = 0
- CHR6: 5 % × 2 hits × 520,904 = 52,090
- EMH6: 0 % × 2 hits × 621,505 = 0

The army-wide key touches every stack, so one point of `doubleDamageChance` is worth exactly avg / 100 = **42,575 per point**, perfectly linear. That is larger than any single strength point in the table above — double damage is the most valuable percentage on this account, and it is the one the app's headline figure does not show.

## A · 12 types · elite (check)

baseline avg **4,135,036**

### Frozen counts (same march, more bonus)

| key | +1 | +5 | +10 | Δ / point | linear? |
|---|---|---|---|---|---|
| health army | 0 | -71,764 | 0 | 0 | **no** |
| health guardsmen | -82,464 | -229,177 | -155,186 | -15,519 | **no** |
| health specialist | 0 | 0 | 0 | 0 | yes |
| health melee | -95,140 | -639,604 | -639,604 | -63,960 | **no** |
| health ranged | -90,976 | -90,976 | -90,976 | -9,098 | **no** |
| health mounted | -87,542 | -1,052,385 | -1,052,385 | -105,238 | **no** |
| strength army | 11,674 | 58,361 | 116,719 | 11,672 | **no** |
| strength guardsmen | 11,309 | 56,536 | 113,069 | 11,307 | **no** |
| strength specialist | 365 | 1,825 | 3,650 | 365 | yes |
| strength melee | -58,330 | -882,113 | -910,127 | -91,013 | **no** |
| strength ranged | -48,719 | -37,131 | -22,643 | -2,264 | **no** |
| strength mounted | -167,962 | -1,034,519 | -1,013,056 | -101,306 | **no** |
| special armyStrengthAgainstEpicMonsters | 11,674 | 58,361 | 116,719 | 11,672 | **no** |
| special doubleDamageChance | 0 | 0 | 0 | 0 | yes |

### Re-solved (press Generate again)

| key | +1 | +5 | +10 | counts move? | march at +10 |
|---|---|---|---|---|---|
| health army | -1,345 | -1,345 | 0 | yes | — |
| health guardsmen | -2,019 | -8,316 | -64,679 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 787 · ARC1 716 · SP1 715 · RD1 358 · ARC2 397 · SP2 396 · RD3 111 · RD2 197 |
| health specialist | -50,991 | 6,968 | -37,542 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 675 · ARC1 739 · SP1 737 · RD1 369 · ARC2 409 · SP2 409 · RD2 204 · RD3 114 |
| health melee | -107,803 | -641,672 | -630,111 | yes | EMH6 92 · LGN6 72 · ABT6 76 · CHR6 37 · SW1 691 · ARC1 756 · SP1 688 · RD1 378 · ARC2 419 · SP2 381 · RD2 209 · RD3 117 |
| health ranged | -150,347 | -57,335 | -53,940 | yes | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 747 · ARC1 680 · SP1 744 · RD1 372 · ARC2 376 · SP2 412 · RD2 205 · RD3 115 |
| health mounted | -133,632 | -907,286 | -916,644 | yes | EMH6 92 · CHR6 37 · ABT6 76 · LGN6 72 · SW1 750 · ARC1 749 · SP1 747 · RD1 341 · ARC2 415 · SP2 414 · RD2 188 · RD3 105 |
| strength army | 11,674 | 58,361 | 116,719 | no | — |
| strength guardsmen | 11,309 | 56,536 | 113,069 | no | — |
| strength specialist | 365 | 1,825 | 3,650 | no | — |
| strength melee | -58,330 | -882,113 | -910,127 | no | — |
| strength ranged | -48,719 | -37,131 | -22,643 | no | — |
| strength mounted | -167,962 | -1,034,519 | -1,013,056 | no | — |
| special armyStrengthAgainstEpicMonsters | 11,674 | 58,361 | 116,719 | no | — |
| special doubleDamageChance | 0 | 0 | 0 | no | — |

**Double damage is not in either table's numbers.** The engine keeps procs out of `avgDamage` on purpose, so both `doubleDamageChance` rows read 0. By hand: a proc is a plain ×2 on one hit, features included, so a stack's expected damage is `hits × damage × (1 + chance/100)`. The chances this march already carries are worth **72,292** on top of 4,135,036 (+1.75 %):
- EMH6: 0 % × 0.5 hits × 1,329,731 = 0
- ABT6: 0 % × 1 hits × 883,728 = 0
- CHR6: 5 % × 1 hits × 837,976 = 41,899
- LGN6: 0 % × 1 hits × 544,464 = 0
- SW1: 0 % × 1 hits × 44,895 = 0
- ARC1: 0 % × 2 hits × 61,880 = 0
- SP1: 0 % × 2 hits × 51,617 = 0
- RD1: 5 % × 2 hits × 60,984 = 6,098
- ARC2: 0 % × 2 hits × 73,991 = 0
- SP2: 0 % × 3 hits × 58,757 = 0
- RD2: 5 % × 3 hits × 72,722 = 10,908
- RD3: 5 % × 3 hits × 89,242 = 13,386

The army-wide key touches every stack, so one point of `doubleDamageChance` is worth exactly avg / 100 = **41,350 per point**, perfectly linear. That is larger than any single strength point in the table above — double damage is the most valuable percentage on this account, and it is the one the app's headline figure does not show.

## Mechanism 1 — health is absent from the damage formula

Per-hit damage is `count × strength × (1 + Σ strength %) + count × base strength × strengthAgainst / 100`. No health term. So at frozen counts a health bonus cannot change a single `damagePerHit`; it can only change `hpPerUnit`, hence total HP, hence the *kill order*, hence how many hits each stack gets.

| stack | count | per hit before | per hit after | HP/unit before | HP/unit after |
|---|---|---|---|---|---|
| SW1 | 2,307 | 220,319 | 220,319 | 227 | 242 |
| SP2 | 796 | 247,874 | 247,874 | 656 | 683 |
| RD2 | 397 | 275,121 | 275,121 | 1,312 | 1,366 |
| RD3 | 223 | 308,989 | 308,989 | 2,333 | 2,429 |
| EMH6 | 35 | 636,608 | 636,608 | 14,799 | 15,408 |
| ABT6 | 37 | 560,291 | 560,291 | 13,880 | 14,450 |
| LGN6 | 37 | 409,146 | 409,146 | 13,851 | 14,421 |
| CHR6 | 18 | 533,520 | 533,520 | 27,702 | 28,842 |

+10 army health at frozen counts: every `per hit` column is identical, every HP column moved, avg 4,474,506 → 4,474,506 (Δ 0). The claim is verified: **a health bonus changes damage only through counts and ordering, never through a hit.**

## Mechanism 2 — the troop / mercenary boundary

Under `ms` / `msRelaxed` the sizer gives the mercenary pool a hard ceiling of `smallest troop stack HP − 1` (`stacker.ts`, `mercCeiling`), so hired units fall after the troops. With authority at 2,000 the authority housing is no longer the binding constraint — the caps and that ceiling are. Raising **troop** health lifts the ceiling and lets more mercenaries in; raising **mercenary** health raises their per-unit HP and fewer of them fit under the same ceiling.

**Measured (8 types, `msRelaxed`, scenario B), one key at a time:**

| probe | who it touches | troop floor · mercenary counts / caps · authority · avg |
|---|---|---|
| baseline | — | floor 520,259 · EMH6 35/92 ABT6 37/76 LGN6 37/72 CHR6 18/37 · A 145 · avg 4,474,506 |
| +10 specialist health | SW1 only (troop-only in this march) | floor 536,590 · LGN6 39/72 EMH6 36/92 ABT6 38/76 CHR6 19/37 · A 151 · avg 4,878,149 |
| +50 specialist health | SW1 only | floor 599,581 · ABT6 43/76 LGN6 43/72 EMH6 40/92 CHR6 21/37 · A 168 · avg 5,260,475 |
| +10 ranged health | ABT6 only (mercenary-only in this march) | floor 520,259 · ABT6 36/76 EMH6 35/92 LGN6 37/72 CHR6 18/37 · A 144 · avg 4,535,680 |
| +50 ranged health | ABT6 only | floor 520,259 · ABT6 31/76 EMH6 35/92 LGN6 37/72 CHR6 18/37 · A 139 · avg 4,459,965 |
| +10 guardsmen health | SP2 RD2 RD3 + all four mercenaries | floor 529,522 · EMH6 34/92 ABT6 36/76 LGN6 36/72 CHR6 18/37 · A 142 · avg 4,386,150 |
| +10 army health | everything | floor 548,954 · LGN6 38/72 CHR6 19/37 EMH6 35/92 ABT6 37/76 · A 148 · avg 4,783,042 |
| +50 army health | everything | floor 658,242 · ABT6 39/76 LGN6 39/72 EMH6 36/92 CHR6 19/37 · A 152 · avg 4,763,872 |

**Can a mercenary-only health bonus be isolated?** There is no key meaning "hired units". In *this* march it is isolable by accident: the only `ranged` unit fielded is ABT6, a mercenary (ARC1 and ARC2 are left out), and the only `specialist` is SW1, a troop. So `ranged` health is a mercenary-only health bonus here and `specialist` health is a troop-only one, and the two rows above move the boundary in opposite directions exactly as predicted. In the **12-type** pool the isolation is gone (ARC1 and ARC2 are ranged troops) and no combination of keys restores it: every key a mercenary carries — `guardsmen`, `melee`, `ranged`, `mounted`, `army` — is also carried by at least one troop, and the keys are additive with no negative-only key to subtract with. Lowering `specialist` does not undo `guardsmen` on SP2/RD2/RD3, so the compensation trick fails. **It cannot be isolated in general.**

## Mechanism 2b — the sponge march: what a health point buys when the mercenaries are the payload

The exhaustive winner (ARC2 + RD2 + RD3 + the four mercenaries) is the extreme case of the boundary above. Its three troop stacks are pure sponges — they exist to sit on top of the mercenaries and soak the first enemy attacks — and almost all the damage comes from the hired units. ABT6, CHR6 and LGN6 are already at their caps; **EMH6 is not**, and what stops it is the mercenary ceiling, i.e. the smallest troop stack. So on this march a health point is not dead weight: it buys EMH6.

| probe | troop floor · mercenaries / caps · avg · Δ |
|---|---|
| baseline | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +10 army health | floor 1,153,775 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +50 army health | floor 1,336,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +10 guardsmen health | floor 1,153,775 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +50 guardsmen health | floor 1,336,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +10 specialist health | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +50 specialist health | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +10 melee health | floor 1,108,175 · EMH6 75/92 ABT6 76/76 LGN6 72/72 CHR6 37/37 · avg 7,047,448 · Δ -796,176 |
| +50 melee health | floor 1,108,175 · EMH6 75/92 LGN6 66/72 ABT6 76/76 CHR6 37/37 · avg 8,131,968 · Δ 288,344 |
| +10 ranged health | floor 1,126,839 · EMH6 76/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,584,847 · Δ -258,777 |
| +50 ranged health | floor 1,187,497 · EMH6 80/92 ABT6 70/76 CHR6 37/37 LGN6 72/72 · avg 7,635,340 · Δ -208,284 |
| +10 mounted health | floor 1,136,772 · EMH6 77/92 CHR6 37/37 ABT6 76/76 LGN6 72/72 · avg 7,922,141 · Δ 78,517 |
| +50 mounted health | floor 1,237,720 · EMH6 84/92 CHR6 37/37 ABT6 76/76 LGN6 72/72 · avg 7,459,661 · Δ -383,963 |
| +10 army strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,966,870 · Δ 123,246 |
| +50 army strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 8,459,852 · Δ 616,228 |
| +10 guardsmen strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,966,870 · Δ 123,246 |
| +50 guardsmen strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 8,459,852 · Δ 616,228 |
| +10 specialist strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +50 specialist strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,843,624 · Δ 0 |
| +10 melee strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 6,774,304 · Δ -1,069,320 |
| +50 melee strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 6,292,852 · Δ -1,550,772 |
| +10 ranged strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,865,701 · Δ 22,077 |
| +50 ranged strength | floor 1,108,175 · EMH6 75/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,366,343 · Δ -477,281 |
| +10 mounted strength | floor 1,108,175 · EMH6 74/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,586,959 · Δ -256,665 |
| +50 mounted strength | floor 1,108,175 · EMH6 74/92 ABT6 76/76 CHR6 37/37 LGN6 72/72 · avg 7,148,310 · Δ -695,314 |

**Sweep.** The re-solved rows above swing by ±0.8 M because a health point reshuffles the kill order. The sponge effect itself is the smooth part: how many mercenary units the troop floor lets in. Swept over the two keys that raise a troop stack without costing a mercenary a single unit (`ranged` lifts ARC2 and ABT6, `mounted` lifts RD2/RD3 and CHR6 — and ABT6/CHR6 are already at their caps, so their extra HP cannot cost them units):

| points | key | EMH6 | merc units | stack at position 1 | avg |
|---|---|---|---|---|---|
| +0 | ranged health | 75 | 260 | ARC2 | 7,843,624 |
| +10 | ranged health | 76 | 261 | ARC2 | 7,584,847 |
| +20 | ranged health | 77 | 262 | ARC2 | 7,046,310 |
| +30 | ranged health | 78 | 261 | ARC2 | 7,626,968 |
| +40 | ranged health | 79 | 260 | ARC2 | 7,631,501 |
| +60 | ranged health | 81 | 259 | ARC2 | 7,654,323 |
| +80 | ranged health | 83 | 258 | ARC2 | 7,675,065 |
| +100 | ranged health | 85 | 257 | ARC2 | 7,692,344 |
| +0 | mounted health | 75 | 260 | ARC2 | 7,843,624 |
| +10 | mounted health | 77 | 262 | ARC2 | 7,922,141 |
| +20 | mounted health | 78 | 263 | ARC2 | 7,359,670 |
| +30 | mounted health | 80 | 265 | ARC2 | 7,393,350 |
| +40 | mounted health | 82 | 267 | ARC2 | 6,807,318 |
| +60 | mounted health | 85 | 269 | ARC2 | 6,844,848 |
| +80 | mounted health | 88 | 271 | ARC2 | 6,882,027 |
| +100 | mounted health | 91 | 273 | ARC2 | 6,918,157 |
| +0 | guardsmen health | 75 | 260 | ARC2 | 7,843,624 |
| +10 | guardsmen health | 75 | 260 | ARC2 | 7,843,624 |
| +20 | guardsmen health | 75 | 260 | ARC2 | 7,843,624 |
| +30 | guardsmen health | 75 | 260 | ARC2 | 7,843,624 |
| +40 | guardsmen health | 75 | 260 | ARC2 | 7,843,624 |
| +60 | guardsmen health | 75 | 260 | ARC2 | 7,844,317 |
| +80 | guardsmen health | 75 | 260 | ARC2 | 7,844,317 |
| +100 | guardsmen health | 75 | 260 | ARC2 | 7,844,317 |

EMH6 is the only mercenary not already at its cap, and it is the troop floor that holds it back, so a troop-side health point does buy EMH6 — but slowly (roughly one unit per 10 points, ~20 k of damage each) and the buy is swamped by whichever stack the reshuffle leaves at position 1.

**Health per point vs strength per point on the sponge march** (re-solved, Δ avg ÷ points):

| key | health Δ/pt at +10 | health Δ/pt at +50 | strength Δ/pt at +10 | strength Δ/pt at +50 |
|---|---|---|---|---|
| army | 0 | 0 | 12,325 | 12,325 |
| guardsmen | 0 | 0 | 12,325 | 12,325 |
| specialist | 0 | 0 | 0 | 0 |
| melee | -79,618 | 5,767 | -106,932 | -31,015 |
| ranged | -25,878 | -4,166 | 2,208 | -9,546 |
| mounted | 7,852 | -7,679 | -25,666 | -13,906 |

## Mechanism 3 — strength does not move counts, except through Allow damage trades

A strength bonus changes no `hpPerUnit`, so under `elite` and plain `ms` the counts are bit-identical and the whole Δ is the frozen-counts Δ. Under `msRelaxed` the relaxation pass (`relaxPreservation`) scores candidate steps on **average and minimum damage**, so a strength bonus can make it accept or refuse a step and the counts do move. Measured:

| probe | `ms` counts move? | `msRelaxed` counts move? | `ms` Δ avg | `msRelaxed` Δ avg |
|---|---|---|---|---|
| +10 army strength | no | no | 70,351 | 70,351 |
| +10 guardsmen strength | no | no | 70,351 | 70,351 |
| +10 specialist strength | no | no | 115,927 | 115,927 |
| +10 melee strength | no | **yes** | -676,627 | 39,192 |
| +10 ranged strength | no | no | -109,877 | -109,877 |
| +10 mounted strength | no | **yes** | -780,203 | -378,834 |

## Mechanism 4 — why a strength point is worth less to EMH6 than to SP2

| stack | count | base part | features part | per hit | per hit at +10 army str | ratio |
|---|---|---|---|---|---|---|
| SW1 | 2,307 | 197,249 | 23,070 | 220,319 | 231,854 | 1.05 |
| SP2 | 796 | 205,606 | 42,268 | 247,874 | 255,038 | 1.03 |
| RD2 | 397 | 205,090 | 70,031 | 275,121 | 282,267 | 1.03 |
| RD3 | 223 | 204,803 | 104,186 | 308,989 | 316,125 | 1.02 |
| EMH6 | 35 | 203,913 | 432,695 | 636,608 | 643,713 | 1.01 |
| ABT6 | 37 | 202,464 | 357,827 | 560,291 | 567,321 | 1.01 |
| LGN6 | 37 | 201,761 | 207,385 | 409,146 | 416,176 | 1.02 |
| CHR6 | 18 | 196,308 | 337,212 | 533,520 | 540,360 | 1.01 |

The strength-against ("features") part rides on the **base** strength and no bonus touches it (`units.ts`, `hitDamage`). EMH6 carries +609 % against epic monsters, so two thirds of its hit is frozen; a strength point lifts only the other third. A percentage point of strength is therefore worth the most on the stacks with the *fewest* features, and `armyStrengthAgainstEpicMonsters` behaves the other way round — it is a pure features point, identical for every unit, and lands on the same Δ as an army strength point only because both multiply `count × base strength`.

## What it all means

1. **A strength point on a key everything carries is the only clean, linear lever.** On the winner march `army` (or `guardsmen`, identical because every unit in it is a guardsman) is worth **12,325 per point**; on the 8-type march **9,815 per point**. Counts never move (except through Allow damage trades), the formula is linear, and the value is simply `Σ over stacks of hits × count × base strength / 100`.
2. **`armyStrengthAgainstEpicMonsters` is worth exactly the same as an army strength point** — both multiply `count × base strength` and both land on 12,325 on the winner march. The difference is not the rate but the ceiling: strength-against is not diluted by anything, and it is the only key that also helps a stack that has no useful feature against the formation (C5).
3. **`doubleDamageChance` is the best point on the board and the app does not show it.** One point is avg / 100 — 78,436 on the winner march, 44,745 on the 8-type march — six times an army strength point. It is expected value, not guaranteed damage, which is exactly why `simulateBattle` leaves it out of `avgDamage`; a player comparing two builds should add it back by hand.
4. **Health does not produce damage; it produces position.** At frozen counts a health point changes no `damagePerHit` at all (Mechanism 1, every column identical). What it changes is total HP, therefore the kill order, therefore which stacks land in the last positions — and with N = 4 enemy squads and 7-8 stacks, **only the last two or three positions are hit twice** (`expectedHits(6,4) = expectedHits(7,4) = 2`, `expectedHits(5,4) = 1`). Moving a 1.1 M-per-hit mercenary out of a double-hit slot costs about 1.1 M of average damage, which is why single-key health rows swing by ±0.8 M in both directions with no trend.
5. **A uniform health bonus is worth exactly zero on the winner march.** `army` and `guardsmen` health move every unit in it by the same factor, so the HP ladder only rescales: the sizer's flat profile is scale-invariant, the mercenary ceiling moves in step with the mercenaries' own HP, and the counts come back bit-identical (the sweep above: 75 EMH6 and 260 mercenary units from +0 to +100). Health only ever pays when it is **uneven** — when it lifts a troop stack without lifting the mercenary that sits under it.
6. **On the 8-type march the boundary is real and measurable.** There `specialist` health touches only SW1 (a troop) and `ranged` health only ABT6 (a mercenary), so the two halves separate: +50 specialist health lifts the troop floor and lets the mercenary stacks grow, +50 ranged health raises ABT6's own HP and shrinks it. That isolation is an accident of which types this march fields; it does not exist in the 12-type pool and cannot be reconstructed from the key set.
