# B1 — what one march costs, per design

Housing leadership 4,343, authority 2,000 (the owner's correction of 2026-09-14; the export's 200 was a typo). Mercenary stock EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37 = 314 authority, so the **caps** bind, never the authority pool.

Temple 15 → revival gold ÷ 1.53. Training speed is shown at 0 % and at +47.9 % (the figure on the in-game army card, passed as `request.recovery.trainingSpeed = { guardsmen: 47.9, specialist: 47.9 }`).

## How each column is computed

- **avg damage** — `simulateBattle(...).avgDamage` on the stacks `sizeStacks` produced.
- **retrain silver** — `Σ troops n × training.silver`. Mercenaries have no `training` record, so they
  contribute nothing: they cannot be recruited again, which is the whole point of the sheet.
- **retrain gold** — under a "retrain all" the mercenaries still have to come out of the Temple, so the
  engine charges their revive gold here (`retrainOne` → `reviveOne(...).gold` for non-leadership pools).
- **revive gold** — `Σ all (n − chunks(n)) × revival.gold / 1.53`, the whole army at 90 %.
- **revive silver** — `Σ all chunks(n) × training.silver`: the tenth of every stack the Temple will not
  bring back and that must be recruited again. Mercenaries contribute 0 silver — their tenth is simply gone.
- **potions** — 3 sacred potions per unit revived, i.e. `3 × Σ (n − chunks(n))`, the potion price of the
  same 90 % the gold column buys (it is one or the other, never both).
- **merc units lost** — `Σ chunks(n)` over the hired stacks: stock that will never come back.
- **training time** — `Σ troops n × training.seconds / (1 + speed/100)` under a full retrain.

## Scenario A (export bonuses, VIP +3/+3)

### The marches

- **7-type msRelaxed (single-march winner)** (ARC2 + RD2 + RD3 + the four hired types; no SW1, no SP2) — ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
- **8-type msRelaxed** — SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43
- **8-type elite** — EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279
- **12-type elite** — EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · RD3 112
- **12-type msRelaxed** — SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · LGN6 19 · RD3 112 · EMH6 17 · ABT6 18 · CHR6 9
- **8-type msRelaxed, mercs at half spend** (caps halved (ceil): EMH6 46 · ABT6 38 · LGN6 36 · CHR6 19) — SW1 1,794 · SP2 997 · RD2 497 · EMH6 44 · RD3 279 · ABT6 38 · CHR6 19 · LGN6 36

### Damage and the bill

| design | avg damage | min damage | retrain silver | retrain gold | revive gold | revive silver | potions | merc fielded | merc lost |
|---|---|---|---|---|---|---|---|---|---|
| 7-type msRelaxed (single-march winner) | 5,573,521 | 5,417,553 | 2,361,500 | 1,386 | 11,600 | 237,200 | 8,850 | 260 | 28 |
| 8-type msRelaxed | 4,257,493 | 4,257,493 | 1,924,300 | 842 | 11,056 | 193,200 | 10,050 | 159 | 18 |
| 8-type elite | 4,136,335 | 3,471,469 | 1,924,300 | 1,464 | 11,678 | 193,200 | 10,368 | 277 | 30 |
| 12-type elite | 4,135,036 | 3,470,170 | 1,634,100 | 1,464 | 11,665 | 166,700 | 10,629 | 277 | 30 |
| 12-type msRelaxed | 2,976,259 | 2,953,811 | 1,634,100 | 335 | 10,536 | 166,700 | 10,056 | 63 | 7 |
| 8-type msRelaxed, mercs at half spend | 3,472,259 | 3,472,259 | 1,924,300 | 727 | 10,941 | 193,200 | 9,993 | 137 | 15 |

### Training time and the ratios

| design | time 0 % | time +47.9 % | damage / retrain silver | damage / revive gold | damage / merc lost | L used | A used |
|---|---|---|---|---|---|---|---|
| 7-type msRelaxed (single-march winner) | 11d 16h | 7d 21h | 2.36 | 480.48 | 199,054 | 4,343 | 297 |
| 8-type msRelaxed | 7d 4h | 4d 20h | 2.21 | 385.08 | 236,527 | 4,343 | 182 |
| 8-type elite | 7d 4h | 4d 20h | 2.15 | 354.2 | 137,878 | 4,343 | 314 |
| 12-type elite | 4d 2h | 2d 18h | 2.53 | 354.48 | 137,835 | 4,343 | 314 |
| 12-type msRelaxed | 4d 2h | 2d 18h | 1.82 | 282.48 | 425,180 | 4,343 | 72 |
| 8-type msRelaxed, mercs at half spend | 7d 4h | 4d 20h | 1.8 | 317.36 | 231,484 | 4,343 | 156 |

Most damage in one march: **7-type msRelaxed (single-march winner)** (5,573,521). Most damage per mercenary burnt: **12-type msRelaxed** (425,180 per unit of stock). Those are not the same design, which is the whole of B3.

## Scenario B (bonuses proven in game 2026-09-13)

### The marches

- **7-type msRelaxed (single-march winner)** (ARC2 + RD2 + RD3 + the four hired types; no SW1, no SP2) — ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72
- **8-type msRelaxed** — SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18
- **8-type elite** — EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223
- **12-type elite** — EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102
- **12-type msRelaxed** — SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102 · EMH6 16 · ABT6 17 · LGN6 17 · CHR6 8
- **8-type msRelaxed, mercs at half spend** (caps halved (ceil): EMH6 46 · ABT6 38 · LGN6 36 · CHR6 19) — SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 36 · CHR6 18

### Damage and the bill

| design | avg damage | min damage | retrain silver | retrain gold | revive gold | revive silver | potions | merc fielded | merc lost |
|---|---|---|---|---|---|---|---|---|---|
| 7-type msRelaxed (single-march winner) | 7,843,624 | 7,546,564 | 2,361,500 | 1,386 | 11,600 | 237,200 | 8,847 | 260 | 28 |
| 8-type msRelaxed | 4,474,506 | 4,474,506 | 1,799,300 | 675 | 10,886 | 181,500 | 10,386 | 127 | 14 |
| 8-type elite | 5,764,696 | 4,928,011 | 1,799,300 | 1,464 | 11,676 | 181,500 | 10,788 | 277 | 30 |
| 12-type elite | 5,946,764 | 5,110,079 | 1,603,300 | 1,464 | 11,668 | 163,200 | 10,800 | 277 | 30 |
| 12-type msRelaxed | 3,802,488 | 3,744,584 | 1,603,300 | 303 | 10,507 | 163,200 | 10,212 | 58 | 7 |
| 8-type msRelaxed, mercs at half spend | 4,452,390 | 4,452,390 | 1,799,300 | 669 | 10,881 | 181,500 | 10,383 | 126 | 14 |

### Training time and the ratios

| design | time 0 % | time +47.9 % | damage / retrain silver | damage / revive gold | damage / merc lost | L used | A used |
|---|---|---|---|---|---|---|---|
| 7-type msRelaxed (single-march winner) | 11d 16h | 7d 21h | 3.32 | 676.17 | 280,129 | 4,343 | 297 |
| 8-type msRelaxed | 5d 21h | 3d 23h | 2.49 | 411.03 | 319,608 | 4,343 | 145 |
| 8-type elite | 5d 21h | 3d 23h | 3.2 | 493.72 | 192,157 | 4,343 | 314 |
| 12-type elite | 3d 19h | 2d 13h | 3.71 | 509.66 | 198,225 | 4,343 | 314 |
| 12-type msRelaxed | 3d 19h | 2d 13h | 2.37 | 361.9 | 543,213 | 4,343 | 66 |
| 8-type msRelaxed, mercs at half spend | 5d 21h | 3d 23h | 2.47 | 409.19 | 318,028 | 4,343 | 144 |

Most damage in one march: **7-type msRelaxed (single-march winner)** (7,843,624). Most damage per mercenary burnt: **12-type msRelaxed** (543,213 per unit of stock). Those are not the same design, which is the whole of B3.

## Per unit type: the retrain price of one unit


| unit | pool | group | leadership | training silver | training seconds | revival gold | gold at temple 15 |
|---|---|---|---|---|---|---|---|
| ARC1 | leadership | guardsmen | 1 | 300 | 15 | 4 | 2.61 |
| ARC2 | leadership | guardsmen | 1 | 500 | 180 | 4 | 2.61 |
| RD1 | leadership | guardsmen | 2 | 600 | 30 | 8 | 5.23 |
| RD2 | leadership | guardsmen | 2 | 1,000 | 360 | 8 | 5.23 |
| RD3 | leadership | guardsmen | 2 | 1,400 | 840 | 8 | 5.23 |
| SP1 | leadership | guardsmen | 1 | 300 | 15 | 4 | 2.61 |
| SP2 | leadership | guardsmen | 1 | 500 | 180 | 4 | 2.61 |
| SW1 | leadership | specialist | 1 | 300 | 15 | 4 | 2.61 |
| ABT6 | authority | guardsmen | 1 | — (cannot be retrained) | — | 8 | 5.23 |
| CHR6 | authority | guardsmen | 2 | — (cannot be retrained) | — | 16 | 10.46 |
| EMH6 | authority | guardsmen | 1 | — (cannot be retrained) | — | 8 | 5.23 |
| LGN6 | authority | guardsmen | 1 | — (cannot be retrained) | — | 8 | 5.23 |

The four hired types (EMH6, ABT6, LGN6, CHR6) have no training row at all. That single fact is why a campaign is a stock problem and not a silver problem: silver buys troops back, nothing buys mercenaries back, and the Temple only ever returns nine of every ten.
