# C3 — titles, artifacts, equipment

Scenario B plus **one** entry, nothing else. Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37. Enemy 1 melee / 1 ranged / 1 mounted / 1 flying. Baselines: 8 types **4,474,506**, winner **7,843,624**.

> **Obtainability is a game question.** Nothing below says the owner can get any of these, or how. A title is awarded, an artifact is levelled, a piece of equipment is forged and upgraded to a quality; the report only prices them as if they were switched on.

## Inventory — which entries carry a key that matters here

Wanted: `strength` on `guardsmen` / `army` / `ranged` / `mounted`, or `armyStrengthAgainstEpicMonsters`, or a double-damage chance. `strikeTwoSquadsChance` is listed where it exists but **the engine does not model it** (battle.ts: "no in-game observation of it yet"), so it never moves a number here.

### Titles (`titles.json`, 28 entries)

| title | contribution | in scope? |
|---|---|---|
| Administrator | army health +25 | no |
| Battlemaster | army health +150, army strength +150, doubleDamageChance +5, strikeTwoSquadsChance +5 | yes |
| Blademaster | army health +10, army strength +10 | yes |
| Brave Warrior | army health +25, army strength +25 | yes |
| Centurion | army health +25 | no |
| Chief | army health +10 | no |
| Daredevil | army health +10, army strength +10 | yes |
| Dark Knight | army health +25, army strength +25 | yes |
| Dealer | army health +10 | no |
| Dog | army strength +-10 | yes |
| Emperor | strikeTwoSquadsChance +10 | no |
| Experienced Warrior | strikeTwoSquadsChance +5 | no |
| Field Marshal | army strength +10 | yes |
| Goldfinger | army health +25 | no |
| Great Marshal | army health +25, army strength +25 | yes |
| Headhunter | army strength +10 | yes |
| Healer | army health +10 | no |
| Hero of Battle | army health +75, army strength +75, doubleDamageChance +2, strikeTwoSquadsChance +2 | yes |
| Legendary Commander | army strength +25 | yes |
| Lifestream Lord | army health +25 | no |
| Magister Militum | army strength +25 | yes |
| Noble Governor | army health +10 | no |
| Punching Bag | army health +-10 | no |
| Ronin | strikeTwoSquadsChance +5 | no |
| Tribune | army strength +25 | yes |
| Triumphal Warrior | strikeTwoSquadsChance +10 | no |
| War Hero | army health +25, army strength +25 | yes |
| Warlord | army health +100, army strength +100 | yes |

### Other pills (`otherPills.json`)

| pill | contribution | in scope? |
|---|---|---|
| Clan Health Bonus | army health +25 | no |
| Clan Strength Bonus | army strength +25 | yes |
| Kingdom Strength Bonus | army strength +25 | yes |
| Personal Health Bonus | army health +25 | no |
| Personal Strength Bonus | army strength +25 | yes |

### Equipment at godlike (`equipment.json`, top row of `byQuality`)

| piece | godlike contribution | in scope? |
|---|---|---|
| Emerald Guardian | melee health +128, melee strength +128, melee vs mounted +64 | no |
| Emperor's Wrath | army health +42.7, army strength +42.7 | yes |
| Guardian of Justice | guardsmen health +85.3, guardsmen strength +85.3 | yes |
| Guardsmen's Courage | guardsmen health +30, guardsmen strength +30, guardsmenDoubleDamageChance +2 | yes |
| Immortal Warrior | army health +100, army strength +100, doubleDamageChance +2 | yes |
| Path of the Skybreaker | flying health +128, flying strength +128, flying vs mounted +64 | no |
| Sagittarius's Fury | ranged health +128, ranged strength +128, ranged vs melee +64 | yes |
| Skillful Engineer | engineers health +30, engineers strength +30, engineersDoubleDamageChance +2 | no |
| Specialists' Authority | specialist health +30, specialist strength +30, specialistsDoubleDamageChance +2 | yes |
| Steppe Enslaver | mounted health +128, mounted strength +128, mounted vs ranged +64 | yes |
| War Master | specialist health +85.3, specialist strength +85.3 | no |
| Warrior of Ragnarök | doubleDamageChance +2, strikeTwoSquadsChance +2, armyStrengthAgainstEpicMonsters +210 | yes |

### Artifacts (`artifacts.json`, 15 entries)

Only Heart of the Forest carries a level table. The others resolve through `entry.manual` — the numbers the player reads off their own artifact — so the table can say **which key** each feeds and nothing about how much. The `random bonus` column is the extra roll the artifact can carry; its value is also typed by the player.

| artifact | keys | level table? | random bonus options |
|---|---|---|---|
| Fan of the Five Winds | guardsmen strength | no (manual) | armyStrength, guardsmanStrength |
| Forest Crown | army health, army strength | no (manual) | armyStrengthAndHealth |
| Ghostflame Lantern | army strength, armyStrengthAgainstEpicMonsters | no (manual) | armyStrength, armyStrengthAgainstEpicMonsters, armyStrengthAndHealth |
| Griffinwing Mask | monster health, monster strength | no (manual) | monsterHealth, monsterStrength, monsterStrengthAndHealth |
| Heart of the Forest | army strength | **yes** | armyHealth, armyStrength, armyStrengthAndHealth |
| Ifrit Lord's Belt | army health, army strength | no (manual) | armyHealth, armyStrength, armyStrengthAndHealth |
| Knight of Dalarna | mounted health, mounted strength | no (manual) | mountedHealth, mountedStrength, mountedStrengthAndHealth |
| Medallion of Unity | guardsmen health, army strength | no (manual) | armyHealth, guardsmanHealth |
| Philosopher's Stone | specialist health, specialist strength | no (manual) | specialistHealth, specialistStrength, specialistStrengthAndHealth |
| Ruby Brooch | melee health, melee strength | no (manual) | meleeHealth, meleeStrength, meleeStrengthAndHealth |
| Source Flask | guardsmen health, guardsmen strength | no (manual) | guardsmanHealth, guardsmanStrength, guardsmanStrengthAndHealth |
| Technobomb | engineers health, engineers strength | no (manual) | engineerHealth, engineerStrength, engineerStrengthAndHealth |
| Valkyrie Diadem | flying health, flying strength | no (manual) | flyingHealth, flyingStrength, flyingStrengthAndHealth |
| Warden's Quiver | ranged health, ranged strength | no (manual) | rangedHealth, rangedStrength, rangedStrengthAndHealth |
| Zeus' Lightning | army strength, doubleDamageChance | no (manual) | doubleDamageChance |

**Heart of the Forest, priced from its own table** (`base[level] + star[star]`, army strength):

| level ★star | army strength | Δ avg 8 types | Δ avg winner |
|---|---|---|---|
| L1 ★0.1 | +90 | 795,226 | 1,109,210 |
| L20 ★0.4 | +167 | 1,381,339 | 2,058,201 |
| L30 ★1.0 | +220 | 1,784,767 | 2,711,401 |
| L40 ★2.0 | +345 | 2,736,248 | 4,251,970 |
| L50 ★3.0 | +490 | 3,839,966 | 6,039,030 |
| L60 ★5.0 | +720 | 5,590,692 | 8,873,676 |

## Top of the list on the 8 types · msRelaxed march (scenario B)

| # | entry | contribution | Δ avg | % of baseline |
|---|---|---|---|---|
| 1 | Heart of the Forest L60 ★5.0 | army strength +720 | 5,590,692 | 124.95 % |
| 2 | Battlemaster | army health +150, army strength +150, doubleDamageChance +5, strikeTwoSquadsChance +5 | 1,892,974 | 42.31 % |
| 3 | Warrior of Ragnarök (godlike) | doubleDamageChance +2, strikeTwoSquadsChance +2, armyStrengthAgainstEpicMonsters +210 | 1,477,371 | 33.02 % |
| 4 | Warlord | army health +100, army strength +100 | 1,431,542 | 31.99 % |
| 5 | Immortal Warrior (godlike) | army health +100, army strength +100, doubleDamageChance +2 | 1,431,542 | 31.99 % |
| 6 | Emerald Guardian (godlike) | melee health +128, melee strength +128, melee vs mounted +64 | 1,391,959 | 31.11 % |
| 7 | War Master (godlike) | specialist health +85.3, specialist strength +85.3 | 1,194,805 | 26.7 % |
| 8 | Hero of Battle | army health +75, army strength +75, doubleDamageChance +2, strikeTwoSquadsChance +2 | 926,688 | 20.71 % |
| 9 | Emperor's Wrath (godlike) | army health +42.7, army strength +42.7 | 599,432 | 13.4 % |
| 10 | Specialists' Authority (godlike) | specialist health +30, specialist strength +30, specialistsDoubleDamageChance +2 | 478,779 | 10.7 % |
| 11 | Blademaster | army health +10, army strength +10 | 380,188 | 8.5 % |
| 12 | Daredevil | army health +10, army strength +10 | 380,188 | 8.5 % |

One row per entry: Heart of the Forest joins at the top of its own ladder (L60 ★5.0) so the five leaders are five different things. Its lower levels are in the table above.

## Top of the list on the winner 7 types · msRelaxed march (scenario B)

| # | entry | contribution | Δ avg | % of baseline |
|---|---|---|---|---|
| 1 | Heart of the Forest L60 ★5.0 | army strength +720 | 8,873,676 | 113.13 % |
| 2 | Warrior of Ragnarök (godlike) | doubleDamageChance +2, strikeTwoSquadsChance +2, armyStrengthAgainstEpicMonsters +210 | 2,588,156 | 33 % |
| 3 | Battlemaster | army health +150, army strength +150, doubleDamageChance +5, strikeTwoSquadsChance +5 | 1,849,586 | 23.58 % |
| 4 | Warlord | army health +100, army strength +100 | 1,233,288 | 15.72 % |
| 5 | Immortal Warrior (godlike) | army health +100, army strength +100, doubleDamageChance +2 | 1,233,288 | 15.72 % |
| 6 | Guardian of Justice (godlike) | guardsmen health +85.3, guardsmen strength +85.3 | 1,052,095 | 13.41 % |
| 7 | Hero of Battle | army health +75, army strength +75, doubleDamageChance +2, strikeTwoSquadsChance +2 | 925,140 | 11.79 % |
| 8 | Emperor's Wrath (godlike) | army health +42.7, army strength +42.7 | 527,392 | 6.72 % |
| 9 | Guardsmen's Courage (godlike) | guardsmen health +30, guardsmen strength +30, guardsmenDoubleDamageChance +2 | 369,737 | 4.71 % |
| 10 | Emerald Guardian (godlike) | melee health +128, melee strength +128, melee vs mounted +64 | 323,228 | 4.12 % |
| 11 | Brave Warrior | army health +25, army strength +25 | 309,208 | 3.94 % |
| 12 | Dark Knight | army health +25, army strength +25 | 309,208 | 3.94 % |

One row per entry: Heart of the Forest joins at the top of its own ladder (L60 ★5.0) so the five leaders are five different things. Its lower levels are in the table above.

## The top five in full (winner march, scenario B)

1. **Heart of the Forest L60 ★5.0** — army strength +720
2. **Warrior of Ragnarök (godlike)** — doubleDamageChance +2, strikeTwoSquadsChance +2, armyStrengthAgainstEpicMonsters +210
3. **Battlemaster** — army health +150, army strength +150, doubleDamageChance +5, strikeTwoSquadsChance +5
4. **Warlord** — army health +100, army strength +100
5. **Immortal Warrior (godlike)** — army health +100, army strength +100, doubleDamageChance +2

### Heart of the Forest L60 ★5.0
ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,114,929 | 1,693,776 | 1,539,518 | 0/1 | 0 | 1,693,776 |
| 2 | RD2 | 848 | 1,112,576 | 1,686,672 | 1,537,085 | 1/1 | 1,686,672 | 1,686,672 |
| 3 | EMH6 | 75 | 1,109,925 | 2,460,360 | 1,533,158 | 1/1 | 2,460,360 | 2,460,360 |
| 4 | RD3 | 475 | 1,108,175 | 1,752,560 | 1,530,640 | 1/1 | 1,752,560 | 1,752,560 |
| 5 | ABT6 | 76 | 1,054,880 | 2,190,548 | 1,455,552 | 1/1 | 2,190,548 | 2,190,548 |
| 6 | CHR6 | 37 | 1,024,974 | 2,109,000 | 1,415,842 | 2/2 | 4,218,000 | 4,218,000 |
| 7 | LGN6 | 72 | 997,272 | 1,781,136 | 1,377,576 | 2/2 | 3,562,272 | 3,562,272 |

min 15,870,412 · avg 16,717,300 · max 17,564,188 · hits 8/9 · silver 2,361,500 · gold 1,386 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

### Warrior of Ragnarök (godlike)
ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,114,929 | 914,853 | 439,862 | 0/1 | 0 | 914,853 |
| 2 | RD2 | 848 | 1,112,576 | 908,208 | 438,077 | 1/1 | 908,208 | 908,208 |
| 3 | EMH6 | 75 | 1,109,925 | 1,683,885 | 436,958 | 1/1 | 1,683,885 | 1,683,885 |
| 4 | RD3 | 475 | 1,108,175 | 977,360 | 436,240 | 1/1 | 977,360 | 977,360 |
| 5 | ABT6 | 76 | 1,054,880 | 1,454,108 | 415,872 | 1/1 | 1,454,108 | 1,454,108 |
| 6 | CHR6 | 37 | 1,024,974 | 1,391,940 | 403,522 | 2/2 | 2,783,880 | 2,783,880 |
| 7 | LGN6 | 72 | 997,272 | 1,083,456 | 392,616 | 2/2 | 2,166,912 | 2,166,912 |

min 9,974,353 · avg 10,431,780 · max 10,889,206 · hits 8/9 · silver 2,361,500 · gold 1,386 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

## The whole quality ladder, for the pieces that matter

Equipment scales steeply with quality. The three pieces that top the ranking, at every quality `equipment.json` carries:

| piece | poor | common | uncommon | rare | epic | legendary | ascendant | godlike |
|---|---|---|---|---|---|---|---|---|
| Warrior of Ragnarök | 184,869 | 308,114 | 431,360 | 554,605 | 739,473 | 1,109,210 | 1,725,437 | 2,588,156 |
| Immortal Warrior | — | — | 185,939 | 309,208 | 616,228 | 740,250 | 925,140 | 1,233,288 |
| Guardian of Justice | 132,581 | 198,265 | 280,855 | 379,100 | 492,982 | 641,642 | 823,237 | 1,052,095 |
| Emperor's Wrath | 67,601 | 99,650 | 141,208 | 190,869 | 246,491 | 321,534 | 412,752 | 527,392 |

## Reading it

- **`armyStrengthAgainstEpicMonsters` is the single most valuable line in any of the three tables.** Warrior of Ragnarök carries +210 of it at godlike — a features point is worth exactly what an army strength point is worth (C1), and 210 of them beats every percentage bonus on offer.
- **Battlemaster is the best title by a wide margin** (army +150 / +150 plus 5 % double damage and 5 % strike-two-squads), then Warlord (+100 / +100), then Hero of Battle (+75 / +75 and 2 % / 2 %). Everything else in `titles.json` is +25 or less, and eight titles carry only `strikeTwoSquadsChance`, which the engine does not model at all — those score exactly 0 here and their real value is unknown.
- **The health halves of these entries are nearly free upside and nearly no damage.** Every piece that grants army health and army strength together is scored on the strength half; the health half only re-shuffles the kill order (C1, Mechanism 4).
- **Double damage is under-counted by every number in this file.** `avgDamage` does not price a proc, so Immortal Warrior’s and Battlemaster’s double-damage points show up as 0 here. By C1, one point is worth avg / 100 — 78,436 on the winner march — so Battlemaster’s 5 points are worth about another 392,181 of expected damage on top of its row.
- **Artifacts cannot be ranked from the tables.** Fourteen of the fifteen have no level table, so their contribution is whatever the player types. The one that can be priced, Heart of the Forest, reaches +720 army strength at L60 ★5.0 and is then the largest single strength source anywhere in the data, larger than any captain star.
- Again: **obtainability is a game question.** This report prices, it does not advise.
