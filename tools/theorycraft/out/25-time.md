# B5 — the clock

Two columns everywhere: **0 %** (what the export carries) and **+47.9 %** (what the in-game army card shows on this account, passed as `request.recovery.trainingSpeed = { guardsmen: 47.9, specialist: 47.9 }`). The bonus is a plain divisor `1 + 47.9/100 = 1.479`, applied per group, and it never touches silver.

## 1. Seconds per unit, and what a full leadership costs


The 4,343 leadership can be filled with any of these; the last column is what filling it *entirely* with that one type would cost in training time. That is the real reason a tier-1 army retrains in hours and a tier-3 army in weeks.

| unit | group | leadership | training seconds | seconds ÷ 1.479 | units in 4,343 L | full-L time 0 % | full-L time +47.9 % | silver for full L |
|---|---|---|---|---|---|---|---|---|
| ARC1 | guardsmen | 1 | 15 | 10.14 | 4,343 | 18h 5m | 12h 14m | 1,302,900 |
| ARC2 | guardsmen | 1 | 180 | 121.7 | 4,343 | 9d 1h | 6d 2h | 2,171,500 |
| RD1 | guardsmen | 2 | 30 | 20.28 | 2,171 | 18h 5m | 12h 13m | 1,302,600 |
| RD2 | guardsmen | 2 | 360 | 243.41 | 2,171 | 9d 1h | 6d 2h | 2,171,000 |
| RD3 | guardsmen | 2 | 840 | 567.95 | 2,171 | 21d 2h | 14d 6h | 3,039,400 |
| SP1 | guardsmen | 1 | 15 | 10.14 | 4,343 | 18h 5m | 12h 14m | 1,302,900 |
| SP2 | guardsmen | 1 | 180 | 121.7 | 4,343 | 9d 1h | 6d 2h | 2,171,500 |
| SW1 | specialist | 1 | 15 | 10.14 | 4,343 | 18h 5m | 12h 14m | 1,302,900 |

Mercenaries appear nowhere in this table: they have no training row, so they add **zero** seconds to a march's recovery. The hired half of a march is free in time as well as in silver — the tenth of it that the Temple refuses is simply gone, not queued.

## 2. Training time per march, per design

### Scenario A (export bonuses)

| design | avg damage | retrain 0 % | retrain +47.9 % | revive 0 % | revive +47.9 % | damage per day (retrain, +47.9 %) | marches per 30 days |
|---|---|---|---|---|---|---|---|
| 7-type msRelaxed (single-march winner) | 5,573,521 | 11d 16h | 7d 21h | 1d 4h | 19h 4m | 705,346 | 3.8 |
| 8-type msRelaxed (owner's) | 4,257,493 | 7d 4h | 4d 20h | 17h 17m | 11h 41m | 877,989 | 6.2 |
| 8-type elite | 4,136,335 | 7d 4h | 4d 20h | 17h 17m | 11h 41m | 853,003 | 6.2 |
| 12-type elite | 4,135,036 | 4d 2h | 2d 18h | 10h 13m | 6h 54m | 1,487,671 | 10.8 |
| 12-type msRelaxed | 2,976,259 | 4d 2h | 2d 18h | 10h 13m | 6h 54m | 1,070,775 | 10.8 |

**Share per unit type — 7-type msRelaxed (single-march winner)**: ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72

| unit | count | seconds each | retrain seconds (+47.9 %) | share of the march | revive seconds (the tenth) | silver | share of silver |
|---|---|---|---|---|---|---|---|
| ARC2 | 1,699 | 180 | 2d 9h | 30.3 % | 5h 44m | 849,500 | 36.0 % |
| RD2 | 847 | 360 | 2d 9h | 30.2 % | 5h 44m | 847,000 | 35.9 % |
| EMH6 | 75 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| RD3 | 475 | 840 | 3d 2h | 39.5 % | 7h 34m | 665,000 | 28.2 % |
| ABT6 | 76 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| CHR6 | 37 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| LGN6 | 72 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |

**Share per unit type — 8-type msRelaxed (owner's)**: SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43

| unit | count | seconds each | retrain seconds (+47.9 %) | share of the march | revive seconds (the tenth) | silver | share of silver |
|---|---|---|---|---|---|---|---|
| SW1 | 1,794 | 15 | 5h 3m | 4.3 % | 30m | 538,200 | 28.0 % |
| SP2 | 997 | 180 | 1d 9h | 29.0 % | 3h 22m | 498,500 | 25.9 % |
| RD2 | 497 | 360 | 1d 9h | 28.9 % | 3h 22m | 497,000 | 25.8 % |
| LGN6 | 47 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| RD3 | 279 | 840 | 1d 20h | 37.8 % | 4h 25m | 390,600 | 20.3 % |
| ABT6 | 46 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| CHR6 | 23 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| EMH6 | 43 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |

### Scenario B (bonuses proven in game)

| design | avg damage | retrain 0 % | retrain +47.9 % | revive 0 % | revive +47.9 % | damage per day (retrain, +47.9 %) | marches per 30 days |
|---|---|---|---|---|---|---|---|
| 7-type msRelaxed (single-march winner) | 7,843,624 | 11d 16h | 7d 21h | 1d 4h | 19h 4m | 992,634 | 3.8 |
| 8-type msRelaxed (owner's) | 4,474,506 | 5d 21h | 3d 23h | 14h 19m | 9h 41m | 1,125,269 | 7.5 |
| 8-type elite | 5,764,696 | 5d 21h | 3d 23h | 14h 19m | 9h 41m | 1,449,731 | 7.5 |
| 12-type elite | 5,946,764 | 3d 19h | 2d 13h | 9h 26m | 6h 23m | 2,314,865 | 11.7 |
| 12-type msRelaxed | 3,802,488 | 3d 19h | 2d 13h | 9h 26m | 6h 23m | 1,480,174 | 11.7 |

**Share per unit type — 7-type msRelaxed (single-march winner)**: ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72

| unit | count | seconds each | retrain seconds (+47.9 %) | share of the march | revive seconds (the tenth) | silver | share of silver |
|---|---|---|---|---|---|---|---|
| ARC2 | 1,697 | 180 | 2d 9h | 30.3 % | 5h 44m | 848,500 | 35.9 % |
| RD2 | 848 | 360 | 2d 9h | 30.2 % | 5h 44m | 848,000 | 35.9 % |
| EMH6 | 75 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| RD3 | 475 | 840 | 3d 2h | 39.5 % | 7h 34m | 665,000 | 28.2 % |
| ABT6 | 76 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| CHR6 | 37 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| LGN6 | 72 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |

**Share per unit type — 8-type msRelaxed (owner's)**: SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18

| unit | count | seconds each | retrain seconds (+47.9 %) | share of the march | revive seconds (the tenth) | silver | share of silver |
|---|---|---|---|---|---|---|---|
| SW1 | 2,307 | 15 | 6h 29m | 6.8 % | 39m | 692,100 | 38.5 % |
| SP2 | 796 | 180 | 1d 2h | 28.2 % | 2h 42m | 398,000 | 22.1 % |
| RD2 | 397 | 360 | 1d 2h | 28.1 % | 2h 42m | 397,000 | 22.1 % |
| RD3 | 223 | 840 | 1d 11h | 36.9 % | 3h 37m | 312,200 | 17.4 % |
| EMH6 | 35 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| ABT6 | 37 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| LGN6 | 37 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |
| CHR6 | 18 | — (hired) | 0m | 0.0 % | 0m | 0 | 0.0 % |


## 3. What reviving does to the clock


The Temple is instant for the 90 % it returns; only `ceil(n/10)` of each stack goes back into the training queue. So the revive column above is the retrain column divided by roughly ten — the same factor as the silver, for the same reason, and it is the single biggest lever on how often this account can march.

| scenario | design | retrain +47.9 % | revive +47.9 % | ÷ | 30 marches, retrain | 30 marches, revive |
|---|---|---|---|---|---|---|
| A | 7-type msRelaxed (single-march winner) | 7d 21h | 19h 4m | 9.9 | 237d 1h | 23d 20h |
| A | 8-type msRelaxed (owner's) | 4d 20h | 11h 41m | 10.0 | 145d 11h | 14d 14h |
| B | 7-type msRelaxed (single-march winner) | 7d 21h | 19h 4m | 9.9 | 237d 1h | 23d 20h |
| B | 8-type msRelaxed (owner's) | 3d 23h | 9h 41m | 9.9 | 119d 7h | 12d 2h |

## 4. Unsettled: parallel queues or one queue


**The repo cannot tell you whether the game trains several unit types at the same time or one after the
other, and this must be checked in game before any of the durations above is used as a calendar.**

What we do know: `recoveryCosts` **sums** the per-type seconds, and that sum reproduces every captured
TotalStack duration exactly — 5 d 23 h, 4 d 11 h, 4 d 1 h and the revive-all 1 d 2 h → 21 h 40 m
(battle-model-observations §4). So the *number TotalStack shows* is the sum, and our engine matches it.

What that does **not** establish is what the game does with that number. Three possibilities, all
consistent with everything in the repo:

1. **One queue, one barracks** — the sum is the wall-clock wait, and the tables above are calendars.
2. **One queue per building** — several barracks train in parallel and the wall-clock wait is the largest
   per-building term, not the sum. In the owner's 8-type march RD3 alone is 84 % of the seconds, so under
   this reading a march would be ready in about 4 d rather than 4 d 20 h — a small difference here, a large
   one for a wide 12-type march whose time is spread across many types.
3. **Fully parallel per unit type** — the wait is `max` over types, which for the 12-type march would cut
   3 d 19 h down to the RD3 term alone.

The distinction matters most for B6: replacing SW1 (15 s a unit) with SP3 (420 s) multiplies the march's
training time by about six *if the times add up*, and barely moves it if the barracks run in parallel.
Until someone starts two different trainings in game and watches the timers, treat every duration in this
file as **TotalStack's number**, which it certainly is, and not as a proven wall-clock wait.

## What B5 says


- The owner's 8-type march retrains in **7 d 4 h** at 0 % and **4 d 20 h** at +47.9 %; the single-march
  winner (ARC2 + RD2 + RD3) is far worse at **11 d 16 h / 7 d 21 h**, because ARC2 at 180 s and RD3 at 840 s
  replace SW1 at 15 s. Buying more damage per march buys it in days.
- **Time and silver are nearly the same constraint here**, but not exactly: tier-1 types are cheap in both,
  ARC2 is cheap in silver and dear in time, RD3 is dear in both. The 12-type marches are the fastest
  (3 d 19 h) because they spread the leadership over many cheap tier-1 stacks.
- **Reviving divides the clock by ten**, the same way it divides the silver. On this account that is the
  difference between one march every five days and one march every twelve hours.
- **Whether the queues are parallel is unsettled and must be checked in game** (section 4).
