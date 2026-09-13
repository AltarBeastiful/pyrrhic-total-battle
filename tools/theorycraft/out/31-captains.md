# C2 — what a captain is worth

Scenario B plus one captain, nothing else. Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37. Enemy 1 melee / 1 ranged / 1 mounted / 1 flying.

The export **has no captain active**: `active.captains` is `[]`, so the profile carries an Aydae L37 ★3 entry that contributes nothing to any march the app generates from it. Every Δ below is therefore a gain over the march as it stands today.

Bonus value = `level × perLevel + stars[star]` (`derive.ts`, `captainValue`). The star table ends at index 6. There is no level table, so the 60 ★6 column assumes the game’s level cap of 60; rescale any row with the `per level` column if that is wrong.

## Baseline — 8 types · msRelaxed, no captain

SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18
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

## Baseline — winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed, no captain

ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
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

## Ranking on 8 types · msRelaxed (scenario B)

| captain | what it gives at 37 ★3 | Δ avg 37 ★3 | what it gives at 60 ★6 | Δ avg 60 ★6 | note |
|---|---|---|---|---|---|
| Hercules | armyStrengthAgainstEpicMonsters +254 | 1,786,915 | armyStrengthAgainstEpicMonsters +980 | 6,894,398 | These bonuses only apply on battles against epic monsters. |
| Heimdall | army strength +385.5 | 3,044,531 | army strength +750 | 5,819,047 |  |
| Beowulf | army health +247, army strength +247 | 2,917,505 | army health +480, army strength +480 | 4,962,607 |  |
| Leonidas | melee health +77, melee strength +194 | 1,547,865 | melee health +340, melee strength +400 | 3,966,447 |  |
| Amanitore | army health +115.5, army strength +115.5 | 1,329,106 | army health +300, army strength +300 | 3,230,755 | These bonuses only apply on group marches, in reinforcements, and in raids. |
| Cleopatra | army strength +97 | 848,509 | army strength +270 | 2,165,359 |  |
| Ye Ho-Sung | melee health +52, melee strength +82 | 965,528 | melee health +165, melee strength +165 | 1,940,247 |  |
| Logos | specialist health +42, specialist strength +52 | 694,566 | specialist health +95, specialist strength +95 | 1,223,868 |  |
| Ramses II | army health +97 | 623,235 | army health +270 | 726,082 |  |
| Sofia | army health +28.5 | 156,364 | army health +65 | 505,537 |  |
| Alexander | mounted health +77, mounted strength +194 | -269,303 | mounted health +340, mounted strength +400 | 336,846 |  |
| Xi Guiying | ranged strength +52 | -50,825 | ranged strength +95 | 9,633 |  |
| Aurora | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Brann | engineers health +42, engineers strength +52 | 0 | engineers health +95, engineers strength +95 | 0 |  |
| Brunhild | flying health +52, flying strength +82 | 0 | flying health +165, flying strength +165 | 0 |  |
| Carter | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Doria | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Dustan | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Farhad | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Helen | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Ingrid | monster health +52, monster strength +82 | 0 | monster health +165, monster strength +165 | 0 |  |
| Proscope | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Stror | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Tengel | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Wu Zetian | flying health +77, flying strength +194 | 0 | flying health +340, flying strength +400 | 0 |  |
| Aydae | guardsmen health +52, guardsmen strength +82 | 28,790 | guardsmen health +165, guardsmen strength +165 | -196,153 |  |
| Minamoto | ranged health +77, ranged strength +194 | -210,953 | ranged health +340, ranged strength +400 | -302,030 |  |
| Lucius | mounted health +52, mounted strength +82 | -487,651 | mounted health +165, mounted strength +165 | -348,491 |  |
| Skadi | guardsmen health +494, guardsmen strength +494 | -434,589 | guardsmen health +960, guardsmen strength +960 | -639,508 |  |
| Bernard | ranged health +52, ranged strength +82 | -90,180 | ranged health +165, ranged strength +165 | -718,466 |  |

## Ranking on winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed (scenario B)

| captain | what it gives at 37 ★3 | Δ avg 37 ★3 | what it gives at 60 ★6 | Δ avg 60 ★6 | note |
|---|---|---|---|---|---|
| Hercules | armyStrengthAgainstEpicMonsters +254 | 3,130,436 | armyStrengthAgainstEpicMonsters +980 | 12,078,059 | These bonuses only apply on battles against epic monsters. |
| Skadi | guardsmen health +494, guardsmen strength +494 | 6,089,711 | guardsmen health +960, guardsmen strength +960 | 11,830,361 |  |
| Heimdall | army strength +385.5 | 4,751,114 | army strength +750 | 9,243,413 |  |
| Beowulf | army health +247, army strength +247 | 3,045,203 | army health +480, army strength +480 | 5,915,009 |  |
| Amanitore | army health +115.5, army strength +115.5 | 1,424,340 | army health +300, army strength +300 | 3,698,478 | These bonuses only apply on group marches, in reinforcements, and in raids. |
| Cleopatra | army strength +97 | 1,195,482 | army strength +270 | 3,327,629 |  |
| Aydae | guardsmen health +52, guardsmen strength +82 | 1,011,420 | guardsmen health +165, guardsmen strength +165 | 2,034,475 |  |
| Alexander | mounted health +77, mounted strength +194 | -66,368 | mounted health +340, mounted strength +400 | 943,244 |  |
| Minamoto | ranged health +77, ranged strength +194 | 213,987 | ranged health +340, ranged strength +400 | 532,739 |  |
| Ye Ho-Sung | melee health +52, melee strength +82 | 296,401 | melee health +165, melee strength +165 | 225,587 |  |
| Leonidas | melee health +77, melee strength +194 | 142,651 | melee health +340, melee strength +400 | 174,230 |  |
| Bernard | ranged health +52, ranged strength +82 | 239,772 | ranged health +165, ranged strength +165 | 64,481 |  |
| Ramses II | army health +97 | 693 | army health +270 | 693 |  |
| Sofia | army health +28.5 | 693 | army health +65 | 693 |  |
| Aurora | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Brann | engineers health +42, engineers strength +52 | 0 | engineers health +95, engineers strength +95 | 0 |  |
| Brunhild | flying health +52, flying strength +82 | 0 | flying health +165, flying strength +165 | 0 |  |
| Carter | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Doria | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Dustan | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Farhad | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Helen | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Ingrid | monster health +52, monster strength +82 | 0 | monster health +165, monster strength +165 | 0 |  |
| Logos | specialist health +42, specialist strength +52 | 0 | specialist health +95, specialist strength +95 | 0 |  |
| Proscope | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Stror | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Tengel | nothing (no bonus in the table) | 0 | nothing (no bonus in the table) | 0 |  |
| Wu Zetian | flying health +77, flying strength +194 | 0 | flying health +340, flying strength +400 | 0 |  |
| Lucius | mounted health +52, mounted strength +82 | 171,116 | mounted health +165, mounted strength +165 | -105,277 |  |
| Xi Guiying | ranged strength +52 | -472,866 | ranged strength +95 | -377,937 |  |

## Health-only captains, and why they are nearly worthless here

- **health only:** Ramses II, Sofia
- **strength only:** Cleopatra, Heimdall, Xi Guiying
- **both:** Alexander, Amanitore, Aydae, Beowulf, Bernard, Brann, Brunhild, Ingrid, Leonidas, Logos, Lucius, Minamoto, Skadi, Wu Zetian, Ye Ho-Sung
- **a special key:** Hercules (armyStrengthAgainstEpicMonsters)
- **no bonus in the table at all:** Aurora, Carter, Doria, Dustan, Farhad, Helen, Proscope, Stror, Tengel

Health is absent from the damage formula (C1, Mechanism 1): `damage = count × strength × (1 + Σ strength %) + count × base strength × strengthAgainst / 100`. A health captain can only reach the damage through the sizer, and it only reaches it when the bonus is **uneven across the units the march fields**. The bonuses are additive inside one bracket, so a key every unit carries just rescales the whole HP ladder and the sizer’s flat profile is scale-invariant: the counts come back bit-identical.

- On the **winner march** every one of the seven types is a guardsman, so `army` health is uniform and Ramses II 60 ★6 (+270 army health) moves the average by **693** — six digits smaller than a strength captain of the same tier.
- On the **8-type march** it is not uniform: SW1 is a specialist (Σ health 51 in scenario B) and the rest are guardsmen (Σ health 143). Adding +270 army health takes SW1 from ×2.51 to ×5.21 but the guardsmen only from ×3.43 to ×6.13, so the *ratio* moves, the flat profile re-solves and the mercenary ceiling rises. That is the whole of Ramses II’s +726,082 there: not one point of extra damage per hit, only a different count vector.

So "health is worthless" is too strong; the correct statement is **health pays only through unevenness**, it pays nothing at all when the march is homogeneous, and it is never a rate you can extrapolate — it is a step function of which stack ends up in which kill position.

| captain | key | Δ avg 8 types | Δ avg winner | counts move? |
|---|---|---|---|---|
| Ramses II 60 ★6 | army | 726,082 | 693 | yes |
| Sofia 60 ★6 | army | 505,537 | 693 | yes |
| Cleopatra 60 ★6 | army | 2,165,359 | 3,327,629 | no |
| Heimdall 60 ★6 | army | 5,819,047 | 9,243,413 | no |
| Xi Guiying 60 ★6 | ranged | 9,633 | -377,937 | no |
| Hercules 60 ★6 | armyStrengthAgainstEpicMonsters | 6,894,398 | 12,078,059 | no |

## Aydae L37 ★3 — what activating the captain the profile already holds would do

Aydae is guardsmen health `1/level`, stars `[0, 0, 15, 15, 45, 45, 105]`, and guardsmen strength `1/level`, stars `[0, 15, 15, 45, 45, 105, 105]`. At L37 ★3 that is **37 × 1 + 15 = 52 guardsmen health** and **37 × 1 + 45 = 82 guardsmen strength** (`captainValue` gives 52 and 82).
Resolved: guardsmen health +52, guardsmen strength +82.

| march | avg without | avg with Aydae 37 ★3 | Δ | avg with Aydae 60 ★6 | Δ |
|---|---|---|---|---|---|
| 8 types · msRelaxed | 4,474,506 | 4,503,296 | 28,790 | 4,278,353 | -196,153 |
| winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed | 7,843,624 | 8,855,044 | 1,011,420 | 9,878,099 | 2,034,475 |

Winner march with Aydae 37 ★3: ARC2 1,697 · RD2 847 · RD3 476 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,354,206 | 719,358 | 565,101 | 0/1 | 0 | 719,358 |
| 2 | RD2 | 847 | 1,349,271 | 711,988 | 562,577 | 1/1 | 711,988 | 711,988 |
| 3 | RD3 | 476 | 1,348,032 | 784,448 | 562,061 | 1/1 | 784,448 | 784,448 |
| 4 | EMH6 | 75 | 1,347,450 | 1,489,005 | 561,803 | 1/1 | 1,489,005 | 1,489,005 |
| 5 | ABT6 | 76 | 1,280,144 | 1,269,276 | 534,280 | 1/1 | 1,269,276 | 1,269,276 |
| 6 | CHR6 | 37 | 1,244,310 | 1,211,972 | 518,814 | 2/2 | 2,423,944 | 2,423,944 |
| 7 | LGN6 | 72 | 1,210,680 | 908,352 | 504,792 | 2/2 | 1,816,704 | 1,816,704 |

min 8,495,365 · avg 8,855,044 · max 9,214,723 · hits 8/9 · silver 2,361,900 · gold 1,386 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

## Reading the ranking

- Every mercenary this account fields carries the `guardsmen` tag, and in the winner march *every* unit does (ARC2, RD2, RD3 are guardsmen troops). So on that march a `guardsmen` captain and an `army` captain are the same bonus, and the ranking is simply "how many strength points does this captain give", scaled by C1’s rate.
- Hercules is the only captain on a special key: `armyStrengthAgainstEpicMonsters`, 2 per level with stars up to +860. Against an epic monster it is the biggest single bonus in the table, and C1 shows a strength-against point is worth exactly what an army strength point is worth.
- Skadi (guardsmen, 2 per level, stars to 840) and Heimdall (army strength, 1.5 per level, stars to 660) are the next tier. `captains.json` notes that Sofia’s ÷2, Amanitore’s ×1.5 and Skadi’s ×2 are already baked into `perLevel`, so they must not be applied twice.
- Captains keyed on `melee`, `ranged`, `mounted`, `flying`, `monster`, `engineers` or `specialist` only touch part of the march (and nothing at all when the march fields none of that category), which is why they rank below the army/guardsmen ones despite larger per-level numbers.
- Amanitore only counts on group marches, reinforcements and raids, and Hercules only against epic monsters — which is the only battle this tool models, so Hercules’ condition is always met here.
- **Negative rows are real, not bugs.** Aydae 60 ★6 loses 196,153 on the 8-type march and Xi Guiying loses 377,937 on the winner march. A captain that boosts only part of the army moves those stacks up the HP ladder (health) or up the attack order (strength), and with N = 4 enemy squads only the last two kill positions are struck twice — so pushing a 1.2 M-per-hit mercenary out of a double-hit slot costs more than the bonus adds. Uneven bonuses have to be checked, not assumed; uniform ones (army / guardsmen here) never do this.
- Whether the owner **has** a given captain, and at what level and star, is a game question this report cannot answer.
