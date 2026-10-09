---
type: experiment
title: "193 — the captain trio"
created: 2026-10-09
tags: [w17, advisor, captains]
related: ["[[Progression-Advisor-Plan]]", "[[191-what-a-percent-is-worth]]", "[[192-the-upgrade-cost-readout]]"]
---

# 193 — the captain trio

Armies: 7, all built from the owner's roster of 2026-10-07 (8 captains, 56 trios), as the app plans them (`buildPlanRequest`). One lane in Node, wall and CPU one thread's. Gains are in the owner's `rate()`; "same trio" is the shortlist's best stop naming the oracle's trio, "equal gain" reaching the oracle's gain (a tie on gain between two trios counts).

Stops read: 35; stops where some trio beats the current one: 32/35 (91.4 %). Sum of the best gain per stop: oracle 556.3989, shipped (k = 8, both) 552.7016.

## Reading (measured figures only)

Written by hand from this run's figures; a re-run of the script rewrites the rest of this file, not this section.

**Which armies.** No benchmark army has a trio to choose: the rosters they carry are Aydae alone or Aydae + Alexander + Leonidas, three captains or fewer, which make one set. The only roster in the repository with more is the owner's account of 2026-10-07 (8 captains, 56 trios), so the 7 armies are that account as the app plans it (4: Aydae alone, his usual three, the three weakest, Aydae alone at 5 000 leadership) and its roster laid on the 2026-09-17 export's army (3: Aydae alone at 7 000 and 12 000, the three weakest at 7 000). 35 stops in all; a better trio exists on 32 of them (91.4 %); the 3 without are the last three stops of his usual trio (it is already the best there).

**The two screens.** The sized screen's top-1 is the best trio on **4 of 35** stops (11.4 %) and its top-1 is one trio for every stop of an army (`aydae + leonidas + minamoto` on five armies); the re-priced screen's top-1 is the best on **20 of 35** (57.1 %). The oracle's best trio sits at a sized rank of 1 to 32 and a re-priced rank of 1 to 20. The re-priced screen is the one that carries the answer.

**Can the confirm drop to top-3?** Not without a cost. The rating the shortlist leaves on the table, out of 556.40 (the sum of the best gain per stop), with the best trio of the shortlist read against the best of all 55 others:

| shortlist | trios planned | same best trio | rating lost |
|---|---|---|---|
| re-priced, k = 1 | 1 | 20/35 (57.1 %) | 160.57 (28.9 %) |
| re-priced, k = 3 | 3 | 28/35 (80.0 %) | 24.48 (4.4 %) |
| re-priced, k = 4 | 4 | 30/35 (85.7 %) | 12.59 (2.3 %) |
| re-priced, k = 8 | 8 | 32/35 (91.4 %) | 1.61 (0.3 %) |
| both, k = 3 | 3 | 24/35 (68.6 %) | 61.70 (11.1 %) |
| both, k = 8 (the shipped one) | 8 | 32/35 (91.4 %) | 3.70 (0.7 %) |

**k stays 8 and `from` becomes the re-priced screen.** At k = 8 the re-priced screen alone finds the best trio as often as both in turn (32 of 35) and loses less (1.61 against 3.70), because half of `both`'s slots go to the sized screen's near-useless top. The three stops it misses are 10.24 against 9.98 (Aydae alone at 5 000, steady max), 4.65 against 3.88 (the same army's all-in) and 32.30 against 29.64 (the three weakest at 7 000, silver saver). Top-3 loses 4.4 % of the rating, so it does not replace 8. `runCaptainAdvice` now takes `from = 'repriced'` by default (`shortlistTrios` keeps `both` as its own default; the option stays).

**Cost.** One lane in Node, no clock in any job, wall: the whole captain pass (baseline, screen, 8 trios planned in full) takes **3.4 to 5.7 s** (4.5 to 8.5 s of CPU), against **20.2 to 30.2 s** for planning all 55 other trios. The advisor's default pass (29 generic probes) on the same armies takes **10.1 to 17.8 s**. Together **13.5 to 23.0 s**; **3 of 7 armies go over the 20 s clock** (23.0, 21.3 and 21.0 s, the three at 9 000 leadership on his account). The two passes would not fit one clock on a single lane, so **C5 gets its own button** ("Compute captains", its own progress and Cancel, its own `CAMPAIGN.budgets.extra` clock): the captain pass alone is a quarter of the clock (5.7 s at most). Not measured here: the pool at six lanes (experiment 190 puts the advisor's shape at ×3.93 there), and the screen's own time inside the pass (experiment 192 style per-job timings), since the whole pass is what the button waits for.

## Left open (not changed)

1. **Seven armies, one roster.** Every army shares the account's eight captains, so 35 stops are fewer independent readings than they look; a second roster with four or more captains would test whether the re-priced screen's lead holds. None exists in the repository.
2. **The three misses are not zero.** At k = 8 the shipped pass leaves 0.3 % of the rating on three stops; a larger k (12, 16) would cost ~0.5 s a trio on one lane and was not measured.
3. **March types.** The roster holds neither Amanitore nor Hercules, so no army here exercises the march type's conditions on the trios.

## Does the screen find the full plan's best?

Per shortlist (which screen, how many trios planned in full), over every stop of every army: how often the best of the shortlist is the best of all 55 other trios, and the rating left on the table.

| from | k | same trio as oracle | equal gain | rating lost (sum) |
|---|---|---|---|---|
| sized | 1 | 4/35 (11.4 %) | 4/35 (11.4 %) | 185.1687 |
| sized | 2 | 11/35 (31.4 %) | 11/35 (31.4 %) | 143.3587 |
| sized | 3 | 11/35 (31.4 %) | 11/35 (31.4 %) | 135.7658 |
| sized | 4 | 13/35 (37.1 %) | 13/35 (37.1 %) | 124.8611 |
| sized | 8 | 26/35 (74.3 %) | 26/35 (74.3 %) | 62.2589 |
| repriced | 1 | 20/35 (57.1 %) | 20/35 (57.1 %) | 160.5676 |
| repriced | 2 | 25/35 (71.4 %) | 25/35 (71.4 %) | 75.3638 |
| repriced | 3 | 28/35 (80.0 %) | 28/35 (80.0 %) | 24.4760 |
| repriced | 4 | 30/35 (85.7 %) | 30/35 (85.7 %) | 12.5866 |
| repriced | 8 | 32/35 (91.4 %) | 32/35 (91.4 %) | 1.6138 |
| both | 1 | 4/35 (11.4 %) | 4/35 (11.4 %) | 185.1687 |
| both | 2 | 21/35 (60.0 %) | 21/35 (60.0 %) | 100.4078 |
| both | 3 | 24/35 (68.6 %) | 24/35 (68.6 %) | 61.7028 |
| both | 4 | 28/35 (80.0 %) | 28/35 (80.0 %) | 37.1648 |
| both | 8 | 32/35 (91.4 %) | 32/35 (91.4 %) | 3.6973 |

## Summary

| army | trios | stops | stops with a better trio | best gain per stop |
|---|---|---|---|---|
| 2026-10-07 account, Aydae alone (9 000 leadership) | 57 | 5 | 5 | 12.119 · 16.939 · 11.609 · 10.167 · 11.951 |
| 2026-10-07 account, Aydae + Leonidas + Alexander (9 000) | 56 | 5 | 2 | 3.334 · 2.379 · 0.000 · 0.000 · 0.000 |
| 2026-10-07 account, Carter + Helen + Bernard (9 000) | 56 | 5 | 5 | 26.719 · 21.582 · 24.725 · 23.831 · 39.325 |
| 2026-10-07 account, Aydae alone, 5 000 leadership | 57 | 5 | 5 | 12.417 · 12.607 · 2.440 · 10.245 · 4.652 |
| 2026-09-17 army, the 2026-10-07 roster, Aydae alone (7 000) | 57 | 5 | 5 | 9.884 · 3.950 · 8.261 · 7.233 · 6.998 |
| 2026-09-17 army, the 2026-10-07 roster, Carter + Helen + Bernard (7 000) | 56 | 5 | 5 | 32.296 · 57.720 · 30.169 · 41.820 · 44.559 |
| 2026-09-17 army, the 2026-10-07 roster, Aydae alone (12 000) | 57 | 5 | 5 | 9.606 · 23.013 · 5.451 · 20.441 · 7.956 |

## Cost

The oracle plans every trio in full; the shipped pass is the screen and the top 8; the advisor is the default 29 generic probes + baseline (experiment 191/192). "Together" is the shipped captain pass plus the advisor pass, wall, against the 20 s clock (`CAMPAIGN.budgets.extra`).

| army | trios | oracle wall ms | oracle CPU ms | captains wall ms | captains CPU ms | cut | advisor wall ms | advisor CPU ms | together s |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-07 account, Aydae alone (9 000 leadership) | 57 | 29,108 | 47,274 | 5,114 | 7,795 | 0 | 17,844 | 30,223 | 23.0 |
| 2026-10-07 account, Aydae + Leonidas + Alexander (9 000) | 56 | 28,372 | 45,554 | 5,305 | 8,128 | 0 | 16,037 | 26,430 | 21.3 |
| 2026-10-07 account, Carter + Helen + Bernard (9 000) | 56 | 30,151 | 48,529 | 5,679 | 8,545 | 0 | 15,300 | 23,576 | 21.0 |
| 2026-10-07 account, Aydae alone, 5 000 leadership | 57 | 22,732 | 36,761 | 4,127 | 6,701 | 0 | 12,963 | 22,955 | 17.1 |
| 2026-09-17 army, the 2026-10-07 roster, Aydae alone (7 000) | 57 | 20,735 | 30,001 | 3,662 | 5,256 | 0 | 12,346 | 16,143 | 16.0 |
| 2026-09-17 army, the 2026-10-07 roster, Carter + Helen + Bernard (7 000) | 56 | 20,168 | 28,598 | 3,401 | 4,490 | 0 | 10,141 | 13,680 | 13.5 |
| 2026-09-17 army, the 2026-10-07 roster, Aydae alone (12 000) | 57 | 25,568 | 38,372 | 3,854 | 5,573 | 0 | 13,724 | 19,162 | 17.6 |

## 2026-10-07 account, Aydae alone (9 000 leadership)

57 trios (current: aydae); 5 stops. Oracle: 56 trios planned in full (0 cut, 0 failed), 29,108 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 5,114 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| burn-saver | aydae + ingrid + leonidas | 12.1188 | aydae + leonidas + minamoto | aydae + ingrid + minamoto | 5 | 2 | aydae + ingrid + leonidas | 12.1188 |
| silver-saver | aydae + ingrid + minamoto | 16.9388 | aydae + leonidas + minamoto | aydae + ingrid + minamoto | 15 | 1 | aydae + ingrid + minamoto | 16.9388 |
| sweet-spot | aydae + ingrid + leonidas | 11.6085 | aydae + leonidas + minamoto | aydae + ingrid + minamoto | 5 | 2 | aydae + ingrid + leonidas | 11.6085 |
| more-mercs | alexander + aydae + leonidas | 10.1667 | aydae + leonidas + minamoto | aydae + ingrid + minamoto | 2 | 8 | alexander + aydae + leonidas | 10.1667 |
| steady-max | aydae + bernard + ingrid | 11.9511 | aydae + leonidas + minamoto | aydae + ingrid + minamoto | 18 | 3 | aydae + bernard + ingrid | 11.9511 |

## 2026-10-07 account, Aydae + Leonidas + Alexander (9 000)

56 trios (current: alexander + aydae + leonidas); 5 stops. Oracle: 55 trios planned in full (0 cut, 0 failed), 28,372 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 5,305 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| burn-saver | aydae + ingrid + leonidas | 3.3344 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 4 | 1 | aydae + ingrid + leonidas | 3.3344 |
| sweet-spot | aydae + ingrid + leonidas | 2.3787 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 4 | 1 | aydae + ingrid + leonidas | 2.3787 |
| more-mercs | current | 0.0000 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | — | — | current | 0.0000 |
| steady-max | current | 0.0000 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | — | — | current | 0.0000 |
| all-in | current | 0.0000 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | — | — | current | 0.0000 |

## 2026-10-07 account, Carter + Helen + Bernard (9 000)

56 trios (current: bernard + carter + helen); 5 stops. Oracle: 55 trios planned in full (0 cut, 0 failed), 30,151 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 5,679 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| burn-saver | aydae + ingrid + leonidas | 26.7191 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 5 | 1 | aydae + ingrid + leonidas | 26.7191 |
| silver-saver | aydae + ingrid + minamoto | 21.5820 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 15 | 2 | aydae + ingrid + minamoto | 21.5820 |
| sweet-spot | aydae + ingrid + leonidas | 24.7251 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 5 | 1 | aydae + ingrid + leonidas | 24.7251 |
| more-mercs | alexander + aydae + leonidas | 23.8312 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 2 | 3 | alexander + aydae + leonidas | 23.8312 |
| steady-max | alexander + aydae + minamoto | 39.3249 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 7 | 13 | alexander + aydae + minamoto | 39.3249 |

## 2026-10-07 account, Aydae alone, 5 000 leadership

57 trios (current: aydae); 5 stops. Oracle: 56 trios planned in full (0 cut, 0 failed), 22,732 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 4,127 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| burn-saver | aydae + ingrid + leonidas | 12.4175 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 8 | 1 | aydae + ingrid + leonidas | 12.4175 |
| sweet-spot | aydae + ingrid + leonidas | 12.6070 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 8 | 1 | aydae + ingrid + leonidas | 12.6070 |
| more-mercs | aydae + ingrid + leonidas | 2.4398 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 8 | 1 | aydae + ingrid + leonidas | 2.4398 |
| steady-max | alexander + aydae + bernard | 10.2445 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 10 | 20 | aydae + ingrid + leonidas | 9.9796 |
| all-in | alexander + aydae + minamoto | 4.6522 | aydae + leonidas + minamoto | aydae + ingrid + leonidas | 9 | 11 | alexander + aydae + ingrid | 3.8793 |

## 2026-09-17 army, the 2026-10-07 roster, Aydae alone (7 000)

57 trios (current: aydae); 5 stops. Oracle: 56 trios planned in full (0 cut, 0 failed), 20,735 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 3,662 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| burn-saver | alexander + aydae + leonidas | 9.8842 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 2 | 1 | alexander + aydae + leonidas | 9.8842 |
| silver-saver | alexander + aydae + leonidas | 3.9498 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 2 | 1 | alexander + aydae + leonidas | 3.9498 |
| sweet-spot | aydae + bernard + leonidas | 8.2612 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 10 | 4 | aydae + bernard + leonidas | 8.2612 |
| more-mercs | alexander + aydae + leonidas | 7.2332 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 2 | 1 | alexander + aydae + leonidas | 7.2332 |
| steady-max | alexander + aydae + leonidas | 6.9985 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 2 | 1 | alexander + aydae + leonidas | 6.9985 |

## 2026-09-17 army, the 2026-10-07 roster, Carter + Helen + Bernard (7 000)

56 trios (current: bernard + carter + helen); 5 stops. Oracle: 55 trios planned in full (0 cut, 0 failed), 20,168 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 3,401 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| silver-saver | aydae + carter + leonidas | 32.2957 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 11 | 7 | aydae + carter + helen | 29.6361 |
| sweet-spot | aydae + bernard + leonidas | 57.7205 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 10 | 2 | aydae + bernard + leonidas | 57.7205 |
| more-mercs | alexander + aydae + leonidas | 30.1694 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 2 | 1 | alexander + aydae + leonidas | 30.1694 |
| steady-max | aydae + leonidas + minamoto | 41.8203 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 1 | 4 | aydae + leonidas + minamoto | 41.8203 |
| all-in | alexander + aydae + bernard | 44.5590 | aydae + leonidas + minamoto | alexander + aydae + leonidas | 32 | 3 | alexander + aydae + bernard | 44.5590 |

## 2026-09-17 army, the 2026-10-07 roster, Aydae alone (12 000)

57 trios (current: aydae); 5 stops. Oracle: 56 trios planned in full (0 cut, 0 failed), 25,568 ms wall. Shipped (k = 8, both screens): 8 planned, 0 cut, 3,854 ms wall.

| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |
|---|---|---|---|---|---|---|---|---|
| burn-saver | alexander + aydae + leonidas | 9.6055 | aydae + carter + leonidas | alexander + aydae + leonidas | 5 | 1 | alexander + aydae + leonidas | 9.6055 |
| sweet-spot | aydae + leonidas + minamoto | 23.0130 | aydae + carter + leonidas | alexander + aydae + leonidas | 6 | 2 | aydae + leonidas + minamoto | 23.0130 |
| silver-saver | alexander + aydae + leonidas | 5.4511 | aydae + carter + leonidas | alexander + aydae + leonidas | 5 | 1 | alexander + aydae + leonidas | 5.4511 |
| more-mercs | alexander + aydae + leonidas | 20.4413 | aydae + carter + leonidas | alexander + aydae + leonidas | 5 | 1 | alexander + aydae + leonidas | 20.4413 |
| steady-max | alexander + aydae + leonidas | 7.9560 | aydae + carter + leonidas | alexander + aydae + leonidas | 5 | 1 | alexander + aydae + leonidas | 7.9560 |

