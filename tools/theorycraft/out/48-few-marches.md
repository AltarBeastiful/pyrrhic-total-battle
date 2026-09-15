# 48 — the "few marches" regime

Every number comes from the engine: `sizeStacks` decides the counts of a march, `simulateBattle` scores it (summary average damage, procs excluded), `recoveryCosts` prices it, `chunks` bills the mercenary stock. Temple 15 (÷1.53). **Scenario C** is the account as it fights today (the 2026-09-14 report), **B** is 0015's scenario; the tables are C, and §7 repeats the three plans under B so they can be read against 0015 §6.

**A march is a sequence, not a constant.** 0015 §6 played the same march every time. Here the plan is a sequence: march *m* may field a different mercenary vector, a different troop set and a different leadership from march *m+1*. The state carried between marches is exactly the game's: silver spent, gold spent, and each mercenary stock after `ceil(n/10)` of what that march fielded is gone for good.

## 1. The hand loop against the engine


`simulateCampaign` cannot express a sequence of different marches, so the campaign is played by hand. Before anything else the hand loop is checked against the engine on four plans the engine *can* express — same request, same `spend`, same marches, same silver budget.

| plan | engine `simulateCampaign` | hand loop | identical? |
|---|---|---|---|
| 7 types · 20 % · 3 marches | fought 2 · 6,286,688 dmg · 4,616,600 silver · left 88/72/68/35 | fought 2 · 6,286,688 dmg · 4,616,600 silver · left 88/72/68/35 | **yes, to the unit** |
| 7 types · 50 % · 5 marches | fought 2 · 10,851,510 dmg · 4,616,600 silver · left 82/68/64/33 | fought 2 · 10,851,510 dmg · 4,616,600 silver · left 82/68/64/33 | **yes, to the unit** |
| 7 types · 100 % · 4 marches | fought 4 · 28,539,682 dmg · 9,233,200 silver · left 68/52/48/25 | fought 4 · 28,539,682 dmg · 9,233,200 silver · left 68/52/48/25 | **yes, to the unit** |
| 8 types · 30 % · 6 marches, 2 M | fought 0 · 0 dmg · 0 silver · left 92/76/72/37 | fought 0 · 0 dmg · 0 silver · left 92/76/72/37 | **yes, to the unit** |


## 2. What one march can be (scenario C)


475 distinct marches collapse to a frontier of **261** — no other march beats them on damage, silver and lost mercenaries at the same time, so the campaign plays the frontier and nothing else. `L` is the leadership the troop stacks are sized to. `ms` sizes the troops first and keeps every mercenary stack under the smallest troop stack; `elite` fills the leadership with troops and fields the mercenaries at their cap whatever their size.

| # | troops | method | L | mercenary caps | fielded | avg damage | silver | gold | mercs lost | dmg / silver | dmg / merc lost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ARC2·RD2·RD3 | ms | 4,343 | 92/76/72/37 | 75/76/72/37 | 7,879,075 | 2,361,500 | 1,386 | 28 (8/8/8/4) | 3.34 | 281,396 |
| 2 | ARC2·RD2·RD3 | ms | 4,343 | 90/70/70/30 | 75/70/70/30 | 7,326,859 | 2,361,500 | 1,292 | 25 (8/7/7/3) | 3.10 | 293,074 |
| 3 | ARC2·SP2·RD2·RD3 | ms | 4,343 | 92/76/72/37 | 54/57/57/28 | 7,151,593 | 2,308,300 | 1,046 | 21 (6/6/6/3) | 3.10 | 340,552 |
| 4 | ARC2·RD3 | ms | 3,100 | 92/76/72/37 | 88/76/72/37 | 6,589,345 | 1,773,200 | 1,448 | 29 (9/8/8/4) | 3.72 | 227,219 |
| 5 | ARC2·SP2·RD2·RD3 | ms | 4,343 | 70/60/50/20 | 54/57/50/20 | 6,519,919 | 2,308,300 | 941 | 19 (6/6/5/2) | 2.82 | 343,154 |
| 6 | ARC2·RD3 | ms | 3,100 | 90/70/70/30 | 88/70/70/30 | 6,359,977 | 1,773,200 | 1,354 | 26 (9/7/7/3) | 3.59 | 244,615 |
| 7 | ARC2·RD2·RD3 | elite | 3,100 | 92/76/72/37 | 92/76/72/37 | 6,113,535 | 1,685,600 | 1,464 | 30 (10/8/8/4) | 3.63 | 203,785 |
| 8 | ARC2·RD2·RD3 | ms | 3,100 | 92/76/72/37 | 53/56/57/28 | 6,077,639 | 1,685,600 | 1,035 | 21 (6/6/6/3) | 3.61 | 289,411 |
| 9 | ARC2·SP2·RD2·RD3 | elite | 3,100 | 92/76/72/37 | 92/76/72/37 | 6,037,848 | 1,647,600 | 1,464 | 30 (10/8/8/4) | 3.66 | 201,262 |
| 10 | 8 troops | elite | 4,343 | 92/76/72/37 | 92/76/72/37 | 5,814,831 | 1,564,900 | 1,464 | 30 (10/8/8/4) | 3.72 | 193,828 |
| 11 | ARC2·SP2·RD2·RD3 | elite | 4,343 | 50/40/40/20 | 50/40/40/20 | 5,707,901 | 2,308,300 | 800 | 15 (5/4/4/2) | 2.47 | 380,527 |
| 12 | ARC2·SP2·RD2·RD3 | elite | 3,100 | 90/70/70/30 | 90/70/70/30 | 5,697,910 | 1,647,600 | 1,365 | 26 (9/7/7/3) | 3.46 | 219,150 |
| 13 | ARC2·RD2·RD3 | ms | 4,343 | 90/70/70/0 | 75/70/70/0 | 5,541,619 | 2,361,500 | 1,009 | 22 (8/7/7/0) | 2.35 | 251,892 |
| 14 | ARC2·SP2·RD2·RD3 | ms | 4,343 | 90/70/70/0 | 54/57/57/0 | 5,485,369 | 2,308,300 | 784 | 18 (6/6/6/0) | 2.38 | 304,743 |
| 15 | 8 troops | elite | 4,343 | 90/70/70/30 | 90/70/70/30 | 5,474,893 | 1,564,900 | 1,365 | 26 (9/7/7/3) | 3.50 | 210,573 |
| 16 | RD3 | elite | 2,000 | 92/76/72/37 | 92/76/72/37 | 5,431,083 | 1,400,000 | 1,464 | 30 (10/8/8/4) | 3.88 | 181,036 |
| 17 | ARC2·RD3 | elite | 2,000 | 90/70/70/30 | 90/70/70/30 | 5,401,469 | 1,144,000 | 1,365 | 26 (9/7/7/3) | 4.72 | 207,749 |
| 18 | ARC2·RD2·RD3 | elite | 2,000 | 92/76/72/37 | 92/76/72/37 | 5,326,671 | 1,087,600 | 1,464 | 30 (10/8/8/4) | 4.90 | 177,556 |
| 19 | ARC2·SP2·RD2·RD3 | elite | 2,000 | 92/76/72/37 | 92/76/72/37 | 5,276,845 | 1,062,800 | 1,464 | 30 (10/8/8/4) | 4.97 | 175,895 |
| 20 | ARC2·RD2·RD3 | ms | 3,100 | 70/60/50/20 | 53/56/50/20 | 5,228,320 | 1,685,600 | 931 | 19 (6/6/5/2) | 3.10 | 275,175 |
| 21 | ARC2·SP2·RD2·RD3 | elite | 3,100 | 70/60/50/20 | 70/60/50/20 | 5,165,275 | 1,647,600 | 1,035 | 20 (7/6/5/2) | 3.14 | 258,264 |
| 22 | ARC2·SP2·RD2·RD3 | ms | 3,100 | 50/40/40/20 | 38/40/40/20 | 5,059,536 | 1,647,600 | 742 | 14 (4/4/4/2) | 3.07 | 361,395 |
| 23 | ARC2·RD2·RD3 | elite | 2,000 | 90/70/70/30 | 90/70/70/30 | 4,986,733 | 1,087,600 | 1,365 | 26 (9/7/7/3) | 4.59 | 191,797 |
| 24 | ARC2·SP2·RD2·RD3 | elite | 2,000 | 90/70/70/30 | 90/70/70/30 | 4,936,907 | 1,062,800 | 1,365 | 26 (9/7/7/3) | 4.65 | 189,881 |

The cheapest members of the same frontier — the marches that cost little or no silver:

| # | troops | method | L | mercenary caps | fielded | avg damage | silver | mercs lost | dmg / merc lost |
|---|---|---|---|---|---|---|---|---|---|
| 1 | none (mercenaries only) | elite | 0 | 92/76/72/37 | 92/76/72/37 | 3,894,931 | 0 | 30 | 129,831 |
| 2 | none (mercenaries only) | elite | 0 | 90/70/70/30 | 90/70/70/30 | 3,554,993 | 0 | 26 | 136,731 |
| 3 | none (mercenaries only) | elite | 0 | 70/60/50/20 | 70/60/50/20 | 2,700,859 | 0 | 20 | 135,043 |
| 4 | none (mercenaries only) | elite | 0 | 90/70/70/0 | 90/70/70/0 | 2,662,373 | 0 | 23 | 115,755 |
| 5 | none (mercenaries only) | elite | 0 | 50/40/40/20 | 50/40/40/20 | 2,103,415 | 0 | 15 | 140,228 |
| 6 | none (mercenaries only) | elite | 0 | 40/30/30/10 | 40/30/30/10 | 1,451,578 | 0 | 11 | 131,962 |
| 7 | none (mercenaries only) | elite | 0 | 30/30/20/10 | 30/30/20/10 | 1,249,281 | 0 | 9 | 138,809 |
| 8 | none (mercenaries only) | elite | 0 | 40/30/30/0 | 40/30/30/0 | 1,154,038 | 0 | 10 | 115,404 |

The frontier's 261 members are mostly variations on five regimes, and they are what the
campaign has to choose between:

- **Full sponges, full mercenaries** (`ms`, L 4,343, 92/76/72/37): 7.88 M for 2.36 M silver and 28
  mercenaries. The strongest single march on the board; 0015 §6 measured the same shape at 7.84 M under B.
- **Small sponges, full mercenaries** (`elite`, L 1,162, 92/76/72/37): 4.73 M for **631,800 silver** and
  **30** mercenaries — 7.5 damage a silver, twice the full sponge's 3.3, because the troops are only
  asked to be a hit slot, not a wall. The mercenary stacks die first here (they out-HP the troops), so
  the stock pays for the damage.
- **Small sponges, small mercenaries** (`ms`, L 1,162, 20/20/10/10 — 0015's "cheap march"): 1.90 M for
  631,800 silver and 6 mercenaries: 3.0 damage a silver, but **316 k damage per mercenary** — the stock
  is what it saves.
- **No troops at all** (`L 0`): a mercenaries-only march, and it costs **zero silver** — a hired unit has
  no Army-tab price, so the whole bill is the mercenaries' gold. It is the cheapest damage in the game per
  silver and the worst per mercenary, because with no wall in front of them the mercenary stacks are the
  first four to die and the biggest of them loses its strike. This regime did not exist in 0015 §6: it is
  what a *silver* budget looks like when it is genuinely short.
- **No mercenaries**: a troop-only march, 0.6–1.6 M for 0.4–2.5 M silver. The floor of the plan, and the
  only thing left when the stock is gone.


## 3. The plan for M marches and a silver budget (scenario C, retrain)


The best sequence of up to M marches for a silver purse, all paid by recruiting again in the Army tab (the mercenaries' 90 % still costs gold whatever the plan — that gold is in the table). Each cell is the winner of the beam over the action set of §2. "fielded" is the mercenary vector of each march in order; the damage after it is that march's average damage.

### Retrain (silver only)

| M | silver budget | fought | the marches (mercenaries fielded · damage) | total damage | silver | gold | mercs lost | mercenaries left | damage / silver |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 500,000 | 1 | 92/76/72/37 4.54M | 4,538,413 | 489,200 | 1,464 | 30 | 82/68/64/33 | 9.28 |
| 1 | 1,100,000 | 1 | 92/76/72/37 5.33M | 5,326,671 | 1,087,600 | 1,464 | 30 | 82/68/64/33 | 4.90 |
| 1 | 2,000,000 | 1 | 88/76/72/37 6.59M | 6,589,345 | 1,773,200 | 1,448 | 29 | 83/68/64/33 | 3.72 |
| 1 | 5,000,000 | 1 | 75/76/72/37 7.88M | 7,879,075 | 2,361,500 | 1,386 | 28 | 84/68/64/33 | 3.34 |
| 2 | 500,000 | 2 | 92/76/72/37 4.54M → 82/68/64/33 3.47M | 8,012,661 | 489,200 | 2,766 | 57 | 73/61/57/29 | 16.38 |
| 2 | 1,100,000 | 2 | 92/76/72/37 5.33M → 82/68/64/33 3.47M | 8,800,919 | 1,087,600 | 2,766 | 57 | 73/61/57/29 | 8.09 |
| 2 | 2,000,000 | 2 | 92/76/72/37 4.26M → 53/56/57/28 6.08M | 10,336,602 | 1,971,600 | 2,499 | 51 | 76/62/58/30 | 5.24 |
| 2 | 5,000,000 | 2 | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 4,723,000 | 2,657 | 54 | 76/61/57/29 | 3.22 |
| 3 | 500,000 | 3 | 92/76/72/37 4.54M → 82/68/64/33 3.47M → 73/61/57/29 3.09M | 11,101,655 | 489,200 | 3,927 | 81 | 65/54/51/26 | 22.69 |
| 3 | 1,100,000 | 3 | 92/76/72/37 4.11M → 82/68/64/33 3.84M → 71/61/57/29 4.03M | 11,984,176 | 1,095,800 | 3,916 | 81 | 65/54/51/26 | 10.94 |
| 3 | 2,000,000 | 3 | 92/76/72/37 4.11M → 82/68/64/33 3.65M → 53/56/57/28 6.08M | 13,837,512 | 1,998,000 | 3,801 | 78 | 67/55/51/26 | 6.93 |
| 3 | 5,000,000 | 3 | 75/76/72/37 7.88M → 84/68/64/33 3.89M → 54/57/57/28 7.15M | 18,919,569 | 4,993,800 | 3,744 | 76 | 69/55/51/26 | 3.79 |
| 5 | 500,000 | 5 | 92/76/72/37 4.54M → 82/68/64/33 3.47M → 73/61/57/29 3.09M → 65/54/51/26 2.75M → 58/48/45/23 2.44M | 16,298,150 | 489,200 | 5,872 | 122 | 52/43/40/20 | 33.32 |
| 5 | 1,100,000 | 5 | 92/76/72/37 3.89M → 82/68/64/33 3.69M → 71/61/57/29 4.03M → 65/54/51/26 3.12M → 58/48/45/23 2.44M | 17,180,671 | 1,095,800 | 5,861 | 122 | 52/43/40/20 | 15.68 |
| 5 | 2,000,000 | 5 | 92/76/72/37 3.89M → 82/68/64/33 3.65M → 53/56/57/28 6.08M → 67/55/51/26 3.01M → 60/49/45/23 2.48M | 19,100,865 | 1,998,000 | 5,778 | 119 | 54/44/40/20 | 9.56 |
| 5 | 5,000,000 | 5 | 75/76/72/37 7.88M → 84/68/64/33 3.67M → 54/57/57/28 7.15M → 69/55/51/26 3.02M → 62/49/45/23 2.49M | 24,224,111 | 4,992,600 | 5,736 | 118 | 55/44/40/20 | 4.85 |
| 10 | 500,000 | 10 | 70/60/50/20 2.88M → 39/30/30/10 1.97M → 81/67/64/30 3.36M → 72/60/57/30 3.09M → 64/54/51/28 2.80M → 57/48/45/25 2.49M → 50/40/40/20 2.10M → 46/39/36/20 2.01M → 41/35/32/18 1.80M → 36/31/28/16 1.59M | 24,101,877 | 493,000 | 8,811 | 179 | 32/27/25/14 | 48.89 |
| 10 | 1,100,000 | 10 | 90/70/70/30 3.55M → 83/69/65/30 3.42M → 24/26/20/10 3.00M → 71/59/56/30 3.06M → 63/53/50/27 2.74M → 56/47/45/24 2.44M → 50/40/40/20 2.10M → 45/38/36/19 1.95M → 40/34/32/17 1.74M → 36/30/28/15 1.54M | 25,554,477 | 1,062,800 | 8,920 | 180 | 32/27/25/13 | 24.04 |
| 10 | 2,000,000 | 10 | 53/56/57/28 6.08M → 30/30/20/10 1.47M → 83/67/64/30 3.55M → 74/60/57/30 3.11M → 66/54/51/27 2.79M → 59/48/45/24 2.48M → 53/43/40/20 2.18M → 47/38/36/19 1.97M → 42/34/32/17 1.76M → 37/30/28/15 1.55M | 26,943,115 | 1,998,000 | 8,737 | 179 | 33/27/25/13 | 13.49 |
| 10 | 5,000,000 | 10 | 92/76/72/37 3.89M → 54/57/57/28 7.15M → 53/56/57/28 6.08M → 39/40/40/20 2.53M → 66/52/48/25 3.58M → 59/46/43/20 2.31M → 50/40/38/20 2.08M → 48/37/34/18 1.91M → 43/33/30/16 1.70M → 38/29/27/14 1.50M | 32,753,452 | 4,973,900 | 8,890 | 181 | 34/26/24/12 | 6.59 |

### Revive (Temple 15, gold)

| M | silver budget | fought | the marches (mercenaries fielded · damage) | total damage | silver | gold | mercs lost | mercenaries left | damage / silver |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 500,000 | 1 | 75/76/72/37 7.88M | 7,879,075 | 237,200 | 11,600 | 28 | 84/68/64/33 | 33.22 |
| 1 | 1,100,000 | 1 | 75/76/72/37 7.88M | 7,879,075 | 237,200 | 11,600 | 28 | 84/68/64/33 | 33.22 |
| 1 | 2,000,000 | 1 | 75/76/72/37 7.88M | 7,879,075 | 237,200 | 11,600 | 28 | 84/68/64/33 | 33.22 |
| 1 | 5,000,000 | 1 | 75/76/72/37 7.88M | 7,879,075 | 237,200 | 11,600 | 28 | 84/68/64/33 | 33.22 |
| 2 | 500,000 | 2 | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 474,400 | 23,085 | 54 | 76/61/57/29 | 32.08 |
| 2 | 1,100,000 | 2 | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 474,400 | 23,085 | 54 | 76/61/57/29 | 32.08 |
| 2 | 2,000,000 | 2 | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 474,400 | 23,085 | 54 | 76/61/57/29 | 32.08 |
| 2 | 5,000,000 | 2 | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 474,400 | 23,085 | 54 | 76/61/57/29 | 32.08 |
| 3 | 500,000 | 3 | 75/76/72/37 7.88M → 84/68/64/33 3.86M → 54/57/57/28 7.15M | 18,887,177 | 498,300 | 25,347 | 76 | 69/55/51/26 | 37.90 |
| 3 | 1,100,000 | 3 | 75/76/72/37 7.88M → 75/68/64/33 7.34M → 54/57/57/28 7.15M | 22,372,271 | 706,900 | 34,343 | 75 | 70/55/51/26 | 31.65 |
| 3 | 2,000,000 | 3 | 75/76/72/37 7.88M → 75/68/64/33 7.34M → 54/57/57/28 7.15M | 22,372,271 | 706,900 | 34,343 | 75 | 70/55/51/26 | 31.65 |
| 3 | 5,000,000 | 3 | 75/76/72/37 7.88M → 75/68/64/33 7.34M → 54/57/57/28 7.15M | 22,372,271 | 706,900 | 34,343 | 75 | 70/55/51/26 | 31.65 |
| 5 | 500,000 | 5 | 75/76/72/37 7.88M → 84/68/64/33 3.86M → 54/57/57/28 7.15M → 69/55/51/26 2.81M → 62/49/45/23 2.49M | 24,186,990 | 498,300 | 27,339 | 118 | 55/44/40/20 | 48.54 |
| 5 | 1,100,000 | 5 | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 53/56/57/28 6.08M → 54/57/54/28 7.08M → 54/52/48/25 6.62M | 34,086,727 | 1,099,600 | 53,240 | 104 | 62/46/43/22 | 31.00 |
| 5 | 2,000,000 | 5 | 75/76/72/37 7.88M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/56/52/27 6.95M → 54/50/46/24 6.46M | 35,589,027 | 1,167,200 | 56,464 | 110 | 60/45/41/21 | 30.49 |
| 5 | 5,000,000 | 5 | 75/76/72/37 7.88M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/56/52/27 6.95M → 54/50/46/24 6.46M | 35,589,027 | 1,167,200 | 56,464 | 110 | 60/45/41/21 | 30.49 |
| 10 | 500,000 | 10 | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 39/40/40/20 2.53M → 76/60/56/29 3.09M → 68/54/50/26 2.77M → 61/48/45/23 2.47M → 54/43/40/20 2.19M → 48/38/36/18 1.95M → 43/34/32/16 1.74M → 38/30/28/14 1.53M | 32,573,207 | 500,000 | 30,368 | 179 | 34/27/25/12 | 65.15 |
| 10 | 1,100,000 | 10 | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/54/28 7.08M → 53/52/48/25 5.42M → 62/46/43/20 2.34M → 50/40/38/20 2.08M → 50/37/34/18 1.93M → 45/33/30/16 1.72M → 40/29/27/14 1.52M | 43,553,746 | 1,099,600 | 56,880 | 179 | 36/26/24/12 | 39.61 |
| 10 | 2,000,000 | 10 | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/54/28 7.08M → 54/52/48/25 6.62M → 54/46/43/20 6.03M → 38/40/38/20 5.02M → 52/37/34/18 5.40M → 38/33/30/16 4.39M → 39/29/27/14 2.04M | 58,035,642 | 1,996,500 | 95,850 | 177 | 38/26/24/12 | 29.07 |
| 10 | 5,000,000 | 10 | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/54/28 7.08M → 54/52/48/25 6.62M → 54/46/43/20 6.03M → 50/40/38/20 5.66M → 50/37/34/18 5.36M → 46/33/30/16 4.96M → 41/29/27/14 4.56M | 61,743,585 | 2,325,000 | 110,835 | 179 | 36/26/24/12 | 26.56 |

Rows where `fought` is below M are budgets that cannot pay for M marches: the plan fights as many as the purse allows, which is the honest answer to "the best plan for M marches" when M is not affordable. The same question with silver out of the picture is below.

#### The plan for M marches with silver unlimited (stock-bound)

| M | mode | sequence (mercenaries fielded · damage) | total damage | silver | gold | mercs lost | mercenaries left |
|---|---|---|---|---|---|---|---|
| 1 | retrain | 75/76/72/37 7.88M | 7,879,075 | 2,361,500 | 1,386 | 28 | 84/68/64/33 |
| 2 | retrain | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 4,723,000 | 2,657 | 54 | 76/61/57/29 |
| 3 | retrain | 75/76/72/37 7.88M → 75/68/64/33 7.34M → 54/57/57/28 7.15M | 22,372,271 | 7,031,300 | 3,703 | 75 | 70/55/51/26 |
| 5 | retrain | 75/76/72/37 7.88M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/56/52/27 6.95M → 54/50/46/24 6.46M | 35,589,027 | 11,594,700 | 5,402 | 110 | 60/45/41/21 |
| 10 | retrain | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/54/28 7.08M → 54/52/48/25 6.62M → 54/46/43/20 6.03M → 50/40/38/20 5.66M → 50/37/34/18 5.36M → 46/33/30/16 4.96M → 41/29/27/14 4.56M | 61,743,585 | 23,083,000 | 8,717 | 179 | 36/26/24/12 |
| 1 | revive | 75/76/72/37 7.88M | 7,879,075 | 237,200 | 11,600 | 28 | 84/68/64/33 |
| 2 | revive | 75/76/72/37 7.88M → 75/68/64/33 7.34M | 15,220,678 | 474,400 | 23,085 | 54 | 76/61/57/29 |
| 3 | revive | 75/76/72/37 7.88M → 75/68/64/33 7.34M → 54/57/57/28 7.15M | 22,372,271 | 706,900 | 34,343 | 75 | 70/55/51/26 |
| 5 | revive | 75/76/72/37 7.88M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/56/52/27 6.95M → 54/50/46/24 6.46M | 35,589,027 | 1,167,200 | 56,464 | 110 | 60/45/41/21 |
| 10 | revive | 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/57/28 7.15M → 54/57/54/28 7.08M → 54/52/48/25 6.62M → 54/46/43/20 6.03M → 50/40/38/20 5.66M → 50/37/34/18 5.36M → 46/33/30/16 4.96M → 41/29/27/14 4.56M | 61,743,585 | 2,325,000 | 110,835 | 179 | 36/26/24/12 |

#### The search checked against brute force and against its own width

A beam is a heuristic, so it is checked where an exhaustive answer is affordable: **M = 1** against every one of the 465 designs, **M = 2** against every pair of the frontier, and **M = 3 and M = 10** against the same search run at four times the beam width.

| check | brute force | beam | same? |
|---|---|---|---|
| M = 1, 500,000 silver: best of all 475 designs | 4,538,413 (ARC2·RD2·RD3 elite L900) | 4,538,413 | **yes** |
| M = 1, 1,100,000 silver: best of all 475 designs | 5,326,671 (ARC2·RD2·RD3 elite L2,000) | 5,326,671 | **yes** |
| M = 1, 2,000,000 silver: best of all 475 designs | 6,589,345 (ARC2·RD3 ms L3,100) | 6,589,345 | **yes** |
| M = 1, 5,000,000 silver: best of all 475 designs | 7,879,075 (ARC2·RD2·RD3 ms L4,343) | 7,879,075 | **yes** |
| M = 2, 1,100,000 silver: every pair of the 261 frontier marches | 8,800,919 | 8,800,919 | **yes** |
| M = 2, 2,000,000 silver: every pair of the 261 frontier marches | 10,336,602 | 10,336,602 | **yes** |
| M = 3, 1,100,000 silver: beam width 150 against width 600 | 11,984,176 | 11,984,176 | **yes** |
| M = 10, 5,000,000 silver: beam width 150 against width 600 | 32,753,452 | 33,059,210 | **NO** |


## 4. Does the schedule matter? Front-loading, back-loading, burning the last stock


Three marches, the same three troop stacks (`ARC2·RD2·RD3`), and each march's sponge sized to the smallest leadership that still puts every troop stack above every mercenary stack — so no schedule is charged for a wall it does not need and none is caught with mercenaries dying first. The schedules are explicit mercenary vectors, not fractions, so the same multiset can be played in either order: **descending** 60/50/40/20 → 40/30/30/10 → 20/20/10/10 and **ascending** 20/20/10/10 → 40/30/30/10 → 60/50/40/20 field the same three vectors in opposite orders.

#### Retrain, 20,000,000 silver

| schedule | fielded | damage per march | total damage | silver | gold | mercs burned | damage / merc burned | mercenaries left |
|---|---|---|---|---|---|---|---|---|
| constant 60/50/40/20 | 60/50/40/20 → 60/50/40/20 → 60/50/40/20 | 5.49M → 5.49M → 5.49M | 16,462,314 | 7,084,500 | 2,682 | 51 | 322,790 | 74/61/60/31 |
| constant 40/30/30/10 | 40/30/30/10 → 40/30/30/10 → 40/30/30/10 | 3.56M → 3.56M → 3.56M | 10,669,374 | 5,056,800 | 1,695 | 33 | 323,314 | 80/67/63/34 |
| constant 20/20/10/10 | 20/20/10/10 → 20/20/10/10 → 20/20/10/10 | 1.90M → 1.90M → 1.90M | 5,705,343 | 1,895,400 | 987 | 18 | 316,964 | 86/70/69/34 |
| **descending** big → mid → small | 60/50/40/20 → 40/30/30/10 → 20/20/10/10 | 5.49M → 3.56M → 1.90M | 10,945,677 | 4,678,900 | 1,788 | 34 | 321,932 | 80/66/64/33 |
| **ascending** small → mid → big | 20/20/10/10 → 40/30/30/10 → 60/50/40/20 | 1.90M → 3.56M → 5.49M | 10,945,677 | 4,678,900 | 1,788 | 34 | 321,932 | 80/66/64/33 |
| keep back, **burn the last stock** mid → mid → everything left | 40/30/30/10 → 40/30/30/10 → 84/70/66/35 | 3.56M → 3.56M → 7.23M | 14,346,176 | 5,732,700 | 2,484 | 49 | 292,779 | 75/63/59/31 |

#### Retrain, 1,500,000 silver (a budget that cannot pay for all three)

| schedule | fielded | damage per march | total damage | silver | gold | mercs burned | damage / merc burned | mercenaries left |
|---|---|---|---|---|---|---|---|---|
| constant 60/50/40/20 |  |  | 0 | 0 | 0 | 0 | 0 | 92/76/72/37 *(stopped: budget)* |
| constant 40/30/30/10 |  |  | 0 | 0 | 0 | 0 | 0 | 92/76/72/37 *(stopped: budget)* |
| constant 20/20/10/10 | 20/20/10/10 → 20/20/10/10 | 1.90M → 1.90M | 3,803,562 | 1,263,600 | 658 | 12 | 316,964 | 88/72/70/35 *(stopped: budget)* |
| **descending** big → mid → small |  |  | 0 | 0 | 0 | 0 | 0 | 92/76/72/37 *(stopped: budget)* |
| **ascending** small → mid → big | 20/20/10/10 | 1.90M | 1,901,781 | 631,800 | 329 | 6 | 316,964 | 90/74/71/36 *(stopped: budget)* |
| keep back, **burn the last stock** mid → mid → everything left |  |  | 0 | 0 | 0 | 0 | 0 | 92/76/72/37 *(stopped: budget)* |

#### Revive, 5,000,000 silver

| schedule | fielded | damage per march | total damage | silver | gold | mercs burned | damage / merc burned | mercenaries left |
|---|---|---|---|---|---|---|---|---|
| constant 60/50/40/20 | 60/50/40/20 → 60/50/40/20 → 60/50/40/20 | 5.49M → 5.49M → 5.49M | 16,462,314 | 711,600 | 33,324 | 51 | 322,790 | 74/61/60/31 |
| constant 40/30/30/10 | 40/30/30/10 → 40/30/30/10 → 40/30/30/10 | 3.56M → 3.56M → 3.56M | 10,669,374 | 508,800 | 23,562 | 33 | 323,314 | 80/67/63/34 |
| constant 20/20/10/10 | 20/20/10/10 → 20/20/10/10 → 20/20/10/10 | 1.90M → 1.90M → 1.90M | 5,705,343 | 192,600 | 9,177 | 18 | 316,964 | 86/70/69/34 |
| **descending** big → mid → small | 60/50/40/20 → 40/30/30/10 → 20/20/10/10 | 5.49M → 3.56M → 1.90M | 10,945,677 | 471,000 | 22,021 | 34 | 321,932 | 80/66/64/33 |
| **ascending** small → mid → big | 20/20/10/10 → 40/30/30/10 → 60/50/40/20 | 1.90M → 3.56M → 5.49M | 10,945,677 | 471,000 | 22,021 | 34 | 321,932 | 80/66/64/33 |
| keep back, **burn the last stock** mid → mid → everything left | 40/30/30/10 → 40/30/30/10 → 84/70/66/35 | 3.56M → 3.56M → 7.23M | 14,346,176 | 576,400 | 27,277 | 49 | 292,779 | 75/63/59/31 |

**The order does not matter; the total does — and the tenth rule is why.** Reading the two schedules that
field the same three vectors:

- **Descending and ascending are the same plan.** Damage, silver and stock burned come out identical to
  the unit, because the bill for a march is `ceil(n/10)` per type and the sum over a multiset does not
  care about the order. A mercenary stack's damage is its size times the number of hits it gets, and its
  hits come from its *position*, which the sponge fixes — not from when in the campaign it fights. There
  is no compounding, no ramp and no discount to be had from ordering within a fixed multiset.
- **Order only matters when the purse runs out — and then it is not buying damage, it is choosing which
  marches reach the purse at all.** At `1,500,000` silver the descending schedule cannot pay for its
  *first* march (a 60/50/40/20 vector needs a 1.7 M-silver sponge) and fights nothing at all; the ascending
  one buys the cheap march first and gets one march in; the constant 20/20/10/10 gets two. Back-loading
  does not add damage, it only makes sure the marches that *are* affordable are the cheap ones.
- **"Burn the last of the stock" wins by exactly the units a rationed plan was holding back.** It is the
  same three marches with the last one fielding everything left instead of 40/30/30/10: more mercenaries
  fielded, more damage, more silver, more stock gone. It is a bigger plan, not a better-ordered one.

So 0015 §6's constant-size plan was not leaving anything on the table by being constant: given a fixed
total spend and a fixed number of marches, every order is worth the same. What the campaign can choose
is **how much stock to burn in total**, and that is what §3 chooses.

#### The exchange rate the campaign actually faces: the sponge

M = 10, retrain. Three ways to spend the same stock: **field everything that is left every march with a real sponge in front of it** (each march charged the smallest leadership that protects its vector), the same schedule with the purse this account really has, and **the plan of §3**.

| schedule | silver budget | total damage | silver | mercs burned | damage / merc burned | damage / silver |
|---|---|---|---|---|---|---|
| field everything left, minimum sponge | uncapped | 53,307,880 | 19,637,500 | 193 | 276,207 | 2.71 |
| the same, with his purse | 1,100,000 | 0 | 0 | 0 | 0 | 0.00 |
| **the plan of §3** | 1,100,000 | 25,554,477 | 1,062,800 | 180 | 141,969 | 24.04 |

This is the whole of the campaign decision in three lines. **Fielding everything with a real sponge is the
most damage the stock can be made to deal** — 53.3 M, 276 K a mercenary — and it costs 19.6 M silver,
because a vector of 92/76/72/37 needs a 2.4 M-silver wall in front of it or the mercenaries die first.
**At 1.1 M silver that schedule is not payable at all: it fights zero marches.** The plan of §3 does the
opposite and wins his purse: it fields *cheap, unprotected* marches (mercenaries only, no troops to pay
for) and spends the silver where a wall buys the most hits, so its damage per mercenary is less than half
of the all-out figure but its damage per silver is **nine times higher** (24 against 2.7).

So the answer to "is he short of silver or of mercenaries" is: **he is short of the resource he cannot
print.** With 1.1 M silver the mercenaries cannot all be protected and the stock is what limits the
damage; with the gold of §6 the Temple converts silver into gold and *then* the silver stops binding and
the stock does, which is exactly what plan B buys.


## 5. The exchange rate: what is he short of?


Marginal value, measured by re-running the best plan at the margin — +100,000 silver, or +1 / +10

| setting | +100,000 silver buys |
|---|---|
| M = 3, 1,100,000 silver, retrain | **260,965** damage per 100,000 silver → 2.61 damage per silver |
| M = 3, 2,000,000 silver, retrain | **144,381** damage per 100,000 silver → 1.44 damage per silver |
| M = 10, 5,000,000 silver, retrain | **103,042** damage per 100,000 silver → 1.03 damage per silver |
| M = 3, 1,100,000 silver, revive | **0** damage per 100,000 silver → 0.00 damage per silver |

| mercenary stock | M = 3, 2 M silver, retrain: +1 unit | +10 units | damage per unit of stock |
|---|---|---|---|
| EMH6 (92 in stock) | 9,114 | 91,147 | 9,115 |
| ABT6 (76 in stock) | 15,200 | 121,600 | 12,160 |
| LGN6 (72 in stock) | 11,115 | 88,920 | 8,892 |
| CHR6 (37 in stock) | 29,754 | 119,016 | 11,902 |

**A mercenary of stock is worth exactly what it hits for, and the four types are not interchangeable.**
+10 units buys ten times +1 to the digit, because the damage of a stack is linear in its size: the marginal
unit is fielded in a later march where the stock was the binding constraint, and it adds one unit's share of
that stack's hits. Ranked by damage per unit of stock in the winning plan: **CHR6 29,754 · ABT6 15,200 ·
LGN6 11,115 · EMH6 9,114** — which is the reverse of the "damage per hit" ranking of §2, and it is not an
accident: CHR6 and ABT6 sit *below* the EMH6 stack in the kill order, so they keep their strike in both
journals, while the biggest EMH6 stack is the first victim and loses its enemy-first hit (0/1 hits: it is
worth half of what it hits for).

Two consequences he can act on. **(a)** The stock to be short of is CHR6, not EMH6 — the smallest stock of
the four is also the most valuable per unit. **(b)** The chunk rule still sets the *price*: stock is billed
`ceil(n/10)`, so fielding 71 units costs what 80 costs, and a plan that fields a ragged vector is paying
for units it is not using. Damage is linear in units, the bill is not, which is why the frontier designs
all field round numbers.

| per-mercenary damage in the winning design (M = 3, 2 M, retrain) | fielded | damage per hit | hits | damage per march | damage per fielded unit |
|---|---|---|---|---|---|
| EMH6 | 92 | 1,677,105 | 0/1 | 1,677,105 | 1,677,105 |
| ABT6 | 76 | 1,155,200 | 1/1 | 2,310,400 | 1,155,200 |
| CHR6 | 37 | 1,100,898 | 1/1 | 2,201,796 | 1,100,898 |
| LGN6 | 72 | 800,280 | 1/1 | 1,600,560 | 800,280 |
| SW1 | 172 | 10,406 | 1/1 | 20,812 | 10,406 |
| ARC1 | 67 | 11,993 | 2/2 | 47,972 | 11,993 |
| ARC2 | 37 | 13,054 | 2/2 | 52,216 | 13,054 |
| SP1 | 66 | 10,857 | 2/2 | 43,428 | 10,857 |
| RD1 | 33 | 11,715 | 2/2 | 46,860 | 11,715 |
| SP2 | 36 | 11,308 | 3/3 | 67,848 | 11,308 |
| RD2 | 18 | 12,571 | 3/3 | 75,426 | 12,571 |
| RD3 | 10 | 13,952 | 3/3 | 83,712 | 13,952 |


## 6. Revive or retrain, per unit type


Reviving instead of retraining one unit saves `training.silver × 1.53 / revival.gold` of silver per gold

| rank | unit | training silver | revival gold | gold at temple 15 | **silver saved per gold** | silver saved per potion (3 a unit) | seconds saved per gold |
|---|---|---|---|---|---|---|---|
| 1 | RD3 | 1,400 | 8 | 5.23 | **267.75** | 467 | 161 |
| 2 | ARC2 | 500 | 4 | 2.61 | **191.25** | 167 | 69 |
| 3 | SP2 | 500 | 4 | 2.61 | **191.25** | 167 | 69 |
| 4 | RD2 | 1,000 | 8 | 5.23 | **191.25** | 333 | 69 |
| 5 | SW1 | 300 | 4 | 2.61 | **114.75** | 100 | 6 |
| 6 | ARC1 | 300 | 4 | 2.61 | **114.75** | 100 | 6 |
| 7 | SP1 | 300 | 4 | 2.61 | **114.75** | 100 | 6 |
| 8 | RD1 | 600 | 8 | 5.23 | **114.75** | 200 | 6 |
| 9 | EMH6 | — (hired) | 8 | 5.23 | **0 — saves no silver** | 0 | 0 |
| 10 | ABT6 | — (hired) | 8 | 5.23 | **0 — saves no silver** | 0 | 0 |
| 11 | LGN6 | — (hired) | 8 | 5.23 | **0 — saves no silver** | 0 | 0 |
| 12 | CHR6 | — (hired) | 16 | 10.46 | **0 — saves no silver** | 0 | 0 |

**Hand-check on a real march** (the first march of the M = 3, 2 M plan):

| stack | units | retrain silver | revive silver | retrain gold | revive gold |
|---|---|---|---|---|---|
| EMH6 | 92 | 0 | 0 | 428.76 | 428.76 |
| ABT6 | 76 | 0 | 0 | 355.56 | 355.56 |
| CHR6 | 37 | 0 | 0 | 345.1 | 345.1 |
| LGN6 | 72 | 0 | 0 | 334.64 | 334.64 |
| ARC2 | 37 | 18,500 | 2,000 | 0 | 86.27 |
| RD2 | 18 | 18,000 | 2,000 | 0 | 83.66 |
| RD3 | 10 | 14,000 | 1,400 | 0 | 47.06 |
| **total** | | 50,500 | 5,400 | 1,464 | 1,681 |

Reviving divides this march's silver by 9.4 and adds 217 gold. The mercenaries' gold (1,464.05) is charged either way — nothing buys a mercenary back.

**What to do with gold.** Ranked by silver saved per gold spent: **RD3 268**, then every tier-2 type at
191 (ARC2, SP2, RD2 — a rider II costs twice an archer II and revives for twice the gold, so they tie),
then every tier-1 type at 115 (SW1, ARC1, SP1, RD1), then the four mercenaries at **0**. Gold spent on
reviving a mercenary saves no silver at all — it is charged under the retrain plan too, because a hired
unit has no Army-tab price. The Temple's own TOP 1–4 selective revive spends the first four steps on
the four tier-6 mercenaries, which saves exactly nothing; TOP 5 and beyond start on the troops.

So: **spend gold on the troops, never on the mercenaries, and if gold is short start with RD3.** The
honest caveat is that the game UI may bill troops per unit and monsters/mercenaries per chunk of ten
(`reviveOne` bills `chunks()` for every pool) — see §9.

## 7. Three plans for this week


| plan | fought | silver | gold | training time | total damage | mercs lost | mercenaries left |
|---|---|---|---|---|---|---|---|
| A — his purse, no gold (10 marches) | 10 | 1,062,800 | 8,920 | 5d 0h | 25,554,477 | 180 | 32/27/25/13 |
| B — his purse plus gold (10 marches) | 10 | 1,099,600 | 56,880 | 5d 6h | 43,553,746 | 179 | 36/26/24/12 |
| C — keep some stock for next week (3 marches) | 3 | 706,900 | 34,343 | 3d 10h | 22,372,271 | 75 | 70/55/51/26 |

### A — his purse, no gold (10 marches)

**The marches, in order** (retrain prices):

- **m1** — EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30 → 3,554,993 damage, 0 silver, 1,365 gold, 0m training, loses 26 mercenaries (9/7/7/3)
- **m2** — EMH6 83 · ABT6 69 · LGN6 65 · CHR6 30 → 3,420,415 damage, 0 silver, 1,297 gold, 0m training, loses 26 mercenaries (9/7/7/3)
- **m3** — EMH6 24 · ABT6 26 · LGN6 20 · CHR6 10 · ARC2 562 · SP2 562 · RD2 281 · RD3 157 → 3,000,849 damage, 1,062,800 silver, 418 gold, 5d 0h training, loses 9 mercenaries (3/3/2/1)
- **m4** — EMH6 71 · ABT6 59 · LGN6 56 · CHR6 30 → 3,059,004 damage, 0 silver, 1,150 gold, 0m training, loses 23 mercenaries (8/6/6/3)
- **m5** — EMH6 63 · ABT6 53 · LGN6 50 · CHR6 27 → 2,738,934 damage, 0 silver, 1,025 gold, 0m training, loses 21 mercenaries (7/6/5/3)
- **m6** — EMH6 56 · ABT6 47 · LGN6 45 · CHR6 24 → 2,439,094 damage, 0 silver, 910 gold, 0m training, loses 19 mercenaries (6/5/5/3)
- **m7** — EMH6 50 · ABT6 40 · LGN6 40 · CHR6 20 → 2,103,415 damage, 0 silver, 800 gold, 0m training, loses 15 mercenaries (5/4/4/2)
- **m8** — EMH6 45 · ABT6 38 · LGN6 36 · CHR6 19 → 1,953,228 damage, 0 silver, 732 gold, 0m training, loses 15 mercenaries (5/4/4/2)
- **m9** — EMH6 40 · ABT6 34 · LGN6 32 · CHR6 17 → 1,742,886 damage, 0 silver, 648 gold, 0m training, loses 14 mercenaries (4/4/4/2)
- **m10** — EMH6 36 · ABT6 30 · LGN6 28 · CHR6 15 → 1,541,659 damage, 0 silver, 575 gold, 0m training, loses 12 mercenaries (4/3/3/2)

Sizer settings: RD3 elite L0 caps 90/70/70/30 · RD3 elite L0 caps 90/70/70/30 · ARC2·SP2·RD2·RD3 ms L2,000 caps 30/30/20/10 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 50/40/40/20 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 92/76/72/37

First march, stack by stack (`evaluateCounts`, the same numbers the app would show):

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | EMH6 | 90 | 1,419,570 | 1,640,646 | 528,003 | 0/1 | 0 | 1,640,646 |
| 2 | ABT6 | 70 | 1,043,420 | 1,064,000 | 387,030 | 1/1 | 1,064,000 | 1,064,000 |
| 3 | LGN6 | 70 | 1,041,390 | 778,050 | 385,700 | 1/1 | 778,050 | 778,050 |
| 4 | CHR6 | 30 | 892,620 | 892,620 | 330,600 | 1/1 | 892,620 | 892,620 |

min 2,734,670 · avg 3,554,993 · max 4,375,316 · hits 3/4 · silver 0 · gold 1,365 · time 0m · pools L 0/4,343 A 290/2,000

**Right when:** **silver ≈ 1.1 M, gold under about 10 K.** Every troop stack is recruited again in the Army tab (the mercenaries' 90 % is gold either way: about 9 K for the ten marches). It is the most damage that purse can buy in ten marches, and it spends most of the stock doing it.

### B — his purse plus gold (10 marches)

**The marches, in order** (revive prices):

- **m1** — EMH6 54 · ABT6 57 · LGN6 57 · CHR6 28 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 → 7,151,593 damage, 232,500 silver, 11,258 gold, 1d 2h training, loses 21 mercenaries (6/6/6/3)
- **m2** — EMH6 54 · ABT6 57 · LGN6 57 · CHR6 28 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 → 7,151,593 damage, 232,500 silver, 11,258 gold, 1d 2h training, loses 21 mercenaries (6/6/6/3)
- **m3** — EMH6 54 · ABT6 57 · LGN6 57 · CHR6 28 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 → 7,151,593 damage, 232,500 silver, 11,258 gold, 1d 2h training, loses 21 mercenaries (6/6/6/3)
- **m4** — EMH6 54 · ABT6 57 · LGN6 54 · CHR6 28 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 → 7,084,903 damage, 232,500 silver, 11,242 gold, 1d 2h training, loses 21 mercenaries (6/6/6/3)
- **m5** — EMH6 53 · ABT6 52 · LGN6 48 · CHR6 25 · ARC2 1,212 · RD2 605 · RD3 339 → 5,420,600 damage, 169,600 silver, 8,230 gold, 20h 8m training, loses 20 mercenaries (6/6/5/3)
- **m6** — EMH6 62 · ABT6 46 · LGN6 43 · CHR6 20 → 2,337,337 damage, 0 silver, 889 gold, 0m training, loses 19 mercenaries (7/5/5/2)
- **m7** — EMH6 50 · ABT6 40 · LGN6 38 · CHR6 20 → 2,081,185 damage, 0 silver, 790 gold, 0m training, loses 15 mercenaries (5/4/4/2)
- **m8** — EMH6 50 · ABT6 37 · LGN6 34 · CHR6 18 → 1,931,617 damage, 0 silver, 732 gold, 0m training, loses 15 mercenaries (5/4/4/2)
- **m9** — EMH6 45 · ABT6 33 · LGN6 30 · CHR6 16 → 1,721,276 damage, 0 silver, 648 gold, 0m training, loses 14 mercenaries (5/4/3/2)
- **m10** — EMH6 40 · ABT6 29 · LGN6 27 · CHR6 14 → 1,522,049 damage, 0 silver, 575 gold, 0m training, loses 12 mercenaries (4/3/3/2)

Sizer settings: ARC2·SP2·RD2·RD3 ms L4,343 caps 92/76/72/37 · ARC2·SP2·RD2·RD3 ms L4,343 caps 92/76/72/37 · ARC2·SP2·RD2·RD3 ms L4,343 caps 92/76/72/37 · ARC2·SP2·RD2·RD3 ms L4,343 caps 92/76/72/37 · ARC2·RD2·RD3 ms L3,100 caps 92/76/72/37 · RD3 elite L0 caps 70/60/50/20 · RD3 elite L0 caps 50/40/40/20 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 92/76/72/37 · RD3 elite L0 caps 92/76/72/37

First march, stack by stack (`evaluateCounts`, the same numbers the app would show):

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,221 | 862,026 | 430,769 | 319,780 | 0/1 | 0 | 430,769 |
| 2 | SP2 | 1,220 | 860,100 | 383,202 | 318,420 | 1/1 | 383,202 | 383,202 |
| 3 | RD2 | 609 | 858,081 | 425,326 | 317,898 | 1/1 | 425,326 | 425,326 |
| 4 | RD3 | 342 | 857,052 | 477,158 | 317,376 | 1/1 | 477,158 | 477,158 |
| 5 | EMH6 | 54 | 851,742 | 984,388 | 316,802 | 1/1 | 984,388 | 984,388 |
| 6 | ABT6 | 57 | 849,642 | 866,400 | 315,153 | 2/2 | 1,732,800 | 1,732,800 |
| 7 | LGN6 | 57 | 847,989 | 633,555 | 314,070 | 2/2 | 1,267,110 | 1,267,110 |
| 8 | CHR6 | 28 | 833,112 | 833,112 | 308,560 | 2/2 | 1,666,224 | 1,666,224 |

min 6,936,208 · avg 7,151,593 · max 7,366,977 · hits 10/11 · silver 2,308,300 · gold 1,046 · time 10d 22h · pools L 4,343/4,343 A 224/2,000

**Right when:** **the same ≈ 1.1 M silver and about 55 K gold.** The Temple brings back 90 % of every stack, so the troops cost a tenth of the silver and the purse buys real sponges: +64 % damage over plan A for the same silver and the same stock burned. This is the plan to fight if the gold is there.

### C — keep some stock for next week (3 marches)

**The marches, in order** (revive prices):

- **m1** — EMH6 75 · ABT6 76 · LGN6 72 · CHR6 37 · ARC2 1,697 · RD2 848 · RD3 475 → 7,879,075 damage, 237,200 silver, 11,600 gold, 1d 4h training, loses 28 mercenaries (8/8/8/4)
- **m2** — EMH6 75 · ABT6 68 · LGN6 64 · CHR6 33 · ARC2 1,697 · RD2 848 · RD3 475 → 7,341,603 damage, 237,200 silver, 11,485 gold, 1d 4h training, loses 26 mercenaries (8/7/7/4)
- **m3** — EMH6 54 · ABT6 57 · LGN6 57 · CHR6 28 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 → 7,151,593 damage, 232,500 silver, 11,258 gold, 1d 2h training, loses 21 mercenaries (6/6/6/3)

Sizer settings: ARC2·RD2·RD3 ms L4,343 caps 92/76/72/37 · ARC2·RD2·RD3 ms L4,343 caps 92/76/72/37 · ARC2·SP2·RD2·RD3 ms L4,343 caps 92/76/72/37

First march, stack by stack (`evaluateCounts`, the same numbers the app would show):

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,697 | 1,198,082 | 598,702 | 444,444 | 0/1 | 0 | 598,702 |
| 2 | RD2 | 848 | 1,194,832 | 592,243 | 442,656 | 1/1 | 592,243 | 592,243 |
| 3 | RD3 | 475 | 1,190,350 | 662,720 | 440,800 | 1/1 | 662,720 | 662,720 |
| 4 | EMH6 | 75 | 1,182,975 | 1,367,205 | 440,003 | 1/1 | 1,367,205 | 1,367,205 |
| 5 | ABT6 | 76 | 1,132,856 | 1,155,200 | 420,204 | 1/1 | 1,155,200 | 1,155,200 |
| 6 | CHR6 | 37 | 1,100,898 | 1,100,898 | 407,740 | 2/2 | 2,201,796 | 2,201,796 |
| 7 | LGN6 | 72 | 1,071,144 | 800,280 | 396,720 | 2/2 | 1,600,560 | 1,600,560 |

min 7,579,724 · avg 7,879,075 · max 8,178,426 · hits 8/9 · silver 2,361,500 · gold 1,386 · time 11d 16h · pools L 4,343/4,343 A 297/2,000

**Right when:** **the same silver and about 35 K gold, and he does not want the stock gone.** Three full-sponge marches burn 75 of the 277 hired units for 22.4 M — 298 K a mercenary against plan B's 232 K — and leave him 202 mercenaries should a better week come. Pick it over B only if the stock matters more than this week's damage.

**How the three compare.**

- **Gold is the best buy on this account.** B beats A by **17,999,269 damage**
  (70 %) for **47,960 more gold** and
  36,800 more silver — 375 damage per gold. The
  Temple is turning gold into sponge HP, and sponge HP is what keeps the mercenary stacks striking.
- **Stock is the one resource nothing buys back.** A burns 180 of the 277 hired units, B
  179, C only 75. Per mercenary burned C is the best of the three
  (298,297 against A's 141,969 and B's 243,317) — fewer, better-protected marches is how
  a stock is made to last, and it is the only lever that does not spend silver or gold.
- **What silver is worth.** A spends all 1,062,800 of its purse on one protected march in the
  middle of ten; the other nine are mercenaries-only marches that cost **no silver at all** (a hired unit
  has no Army-tab price), which is why the same purse reaches so far. The last 100 K of silver in A buys
  about 278,315 damage (§5), and that rate — not the march it is spent on — is what he is
  choosing between.


## 8. The same plans under B (0015's scenario)


| M | budget | mode | fought | sequence | total damage (B) | silver | gold | left |
|---|---|---|---|---|---|---|---|---|
| 1 | 1,100,000 | retrain | 1 | 92/76/72/37 5.33M | 5,326,671 | 1,087,600 | 1,464 | 82/68/64/33 |
| 3 | 1,100,000 | retrain | 3 | 92/76/72/37 4.11M → 82/68/64/33 3.84M → 71/61/57/29 4.03M | 11,984,176 | 1,095,800 | 3,916 | 65/54/51/26 |
| 3 | 1,100,000 | revive | 3 | 75/76/72/37 7.88M → 75/68/64/33 7.34M → 54/57/57/28 7.15M | 22,372,271 | 706,900 | 34,343 | 70/55/51/26 |
| 3 | 2,000,000 | retrain | 3 | 92/76/72/37 4.11M → 82/68/64/33 3.65M → 53/56/57/28 6.08M | 13,837,512 | 1,998,000 | 3,801 | 67/55/51/26 |
| 10 | 5,000,000 | retrain | 10 | 92/76/72/37 3.89M → 54/57/57/28 7.15M → 53/56/57/28 6.08M → 39/40/40/20 2.53M → 66/52/48/25 3.58M → 59/46/43/20 2.31M → 50/40/38/20 2.08M → 48/37/34/18 1.91M → 43/33/30/16 1.70M → 38/29/27/14 1.50M | 32,753,452 | 4,973,900 | 8,890 | 34/26/24/12 |


## 9. To check in game, and what failed


- **Per unit or per chunk in the recovery UI — unresolved, and load-bearing.** `recovery.ts` bills
  `chunks(n) × training.silver` for *every* pool on the revive path (`reviveOne`), and `n ×
  training.silver` for troops on the retrain path (`retrainOne`). The two agree for troops at a tenth of
  the price (170 chunks ≈ 170 units for a 1,697-unit stack), which is why §6's ÷10 came out right, but a
  UI that billed them per chunk of ten *recruited* would raise the same bill for a stack of 44 and for a
  stack of 50, and would make every retrain plan in §3 and §7 five to ten per cent cheaper than stated.
  **In-game reading that settles it:** lose a troop stack of about 45 units (a count that is not a
  multiple of ten) in a march, open the Army tab and read the exact silver the recruit screen asks for —
  `45 × training.silver` means per unit, `5 × training.silver` means per chunk.
- **Whether the March pane can hold a troop budget below the housing — unresolved, and the plans depend
  on it.** Every plan in §7 is a set of (sizer method, leadership target, mercenary caps): the cheap
  marches are `L 0` — no troops at all, the whole leadership left unused — and the protected one is a
  leadership well under 4,343. 0015 §6 already flagged the missing engine feature ("a troop budget in
  `CampaignSettings`"); the app reaches the same marches today by **excluding every troop type from the
  march** (the cheap ones) or by editing the counts of the four troop stacks directly (the protected one).
  **To check in the app:** open a march, drop all eight troop types, and see whether the mercenary stacks
  are still sized to their stock — if they are, the `L 0` marches of §7 are executable as they stand.
- **Whether training runs in parallel across unit types — unresolved.** It decides whether time, not
  silver, is the real second constraint on a 10-march campaign: at the account's +47.9 % training speed
  the full 7-type march needs 7 d 21 h of training serially and about 2 d in parallel. **In-game
  reading:** queue a troop type in the Army tab and a second, different type at the same time; if both
  timers run, training is parallel.
- **Failed hypotheses**, all measured in §4 and §3. (a) "front-loading the mercenaries wins": it does not
  — the same multiset of marches in either order gives the same damage, silver and stock to the unit; only
  the *total* burn matters. (b) "rationing mercenaries across a fixed number of marches preserves damage":
  it does not, and for the same reason — the decay is multiplicative on what is left, so rationing fields
  strictly fewer units and never buys a hit. (c) "a fourth sponge stack always pays": it does not — the
  four-sponge set and the 8-troop set only appear at the top of the damage range, where silver is not
  binding. (d) "a march with no troops is a waste": it is not — nine of plan A's ten marches have no
  troops at all and cost **zero silver**, and they are what lets a 1.1 M
  purse buy ten marches. What the troops buy is *hits*: 24 damage a silver in plan A against 2.7 for a
  campaign that protects every vector (§4).
- **Not modelled by the engine, so not claimed here:** double damage and strike-two-squads procs (upside
  the summary excludes), the enemy formation changing between marches, and the training time of the
  retrain plans (a plan that costs 2.4 M silver and 11 days of training is not executable this week —
  §7 states the time where it matters).
