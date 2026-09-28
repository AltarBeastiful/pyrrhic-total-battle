The control on the mercenaries’ and monsters’ blocks raises every hired stack to the last count that still sits **strictly** under the lowest troop stack — `ceil(floor / hpPerUnit) − 1`, the number `shelterUnder` lowers a stack to — bounded by the owned stock (a mercenary) and by the dominance pool (a monster), and never past the spare housing. `Most, in tens` rounds that ceiling down to a whole ten, which is how the game hands units back.

## His live account (mercenaries only) — 4 stops


| stop | position | hired | damage | vs plan | silver | gold | burn | margin | housing spare |
|---|---|---|---|---|---|---|---|---|---|
| silver-saver | — | 40 | **3,694,764** | | 3,602,400 | 288 | 4 | 19.87 % | |
| silver-saver | Most | **49** | 3,985,988 | +7.9 % | 3,602,400 | 352 | 5 | 1.84 % | 2,140 |
| silver-saver | Most, in tens | — | — | — | — | — | — | — | nothing left to raise |
| sweet-spot | — | 60 | **7,096,072** | | 7,732,100 | 432 | 6 | 44.03 % | |
| sweet-spot | Most | **83** | 7,840,310 | +10.5 % | 7,732,100 | 592 | 9 | 22.58 % | 2,120 |
| sweet-spot | Most, in tens | **80** | 7,743,236 | +9.1 % | 7,732,100 | 576 | 8 | 25.38 % | 2,120 |
| steady-max | — | 68 | **7,354,938** | | 7,732,100 | 488 | 7 | 36.57 % | |
| steady-max | Most | **83** | 7,840,310 | +6.6 % | 7,732,100 | 592 | 9 | 22.58 % | 2,112 |
| steady-max | Most, in tens | **80** | 7,743,236 | +5.3 % | 7,732,100 | 576 | 8 | 25.38 % | 2,112 |
| all-in | — | 83 | **7,840,310** | | 7,732,100 | 592 | 9 | 22.58 % | |
| all-in | Most | — | — | — | — | — | — | — | nothing left to raise |
| all-in | Most, in tens | — | — | — | — | — | — | — | nothing left to raise |


## The same account with 1 200 dominance (monsters too) — 4 stops


| stop | position | hired | damage | vs plan | silver | gold | burn | margin | housing spare |
|---|---|---|---|---|---|---|---|---|---|
| silver-saver | — | 40 | **3,694,764** | | 3,602,400 | 288 | 4 | 19.87 % | |
| silver-saver | Most | **49** | 3,985,988 | +7.9 % | 3,602,400 | 352 | 5 | 1.84 % | 3,340 |
| silver-saver | Most, in tens | — | — | — | — | — | — | — | nothing left to raise |
| sweet-spot | — | 60 | **7,096,072** | | 7,732,100 | 432 | 6 | 44.03 % | |
| sweet-spot | Most | **83** | 7,840,310 | +10.5 % | 7,732,100 | 592 | 9 | 22.58 % | 3,320 |
| sweet-spot | Most, in tens | **80** | 7,743,236 | +9.1 % | 7,732,100 | 576 | 8 | 25.38 % | 3,320 |
| steady-max | — | 68 | **7,354,938** | | 7,732,100 | 488 | 7 | 36.57 % | |
| steady-max | Most | **83** | 7,840,310 | +6.6 % | 7,732,100 | 592 | 9 | 22.58 % | 3,312 |
| steady-max | Most, in tens | **80** | 7,743,236 | +5.3 % | 7,732,100 | 576 | 8 | 25.38 % | 3,312 |
| all-in | — | 83 | **7,840,310** | | 7,732,100 | 592 | 9 | 22.58 % | |
| all-in | Most | — | — | — | — | — | — | — | nothing left to raise |
| all-in | Most, in tens | — | — | — | — | — | — | — | nothing left to raise |


## The dearest stop (all-in), stack by stack

- plan: archer-1 4843 (1,162,320 HP) · rider-1 1938 (1,139,544 HP) · spearman-2 2057 (1,116,951 HP) · spearman-1 3626 (1,095,052 HP) · archer-2 2485 (1,073,520 HP) · rider-3 559 (1,052,038 HP) · rider-2 975 (1,031,550 HP) · epic-monster-hunter-6 83 (798,626 HP)
- raised: archer-1 4843 (1,162,320 HP) · rider-1 1938 (1,139,544 HP) · spearman-2 2057 (1,116,951 HP) · spearman-1 3626 (1,095,052 HP) · archer-2 2485 (1,073,520 HP) · rider-3 559 (1,052,038 HP) · rider-2 975 (1,031,550 HP) · epic-monster-hunter-6 83 (798,626 HP)


## What the numbers say


- **10 of 16 readings moved the counts at all.** Where the plan already fields what the shelter allows, both positions do nothing — that is a march whose counts are bounded by the line rather than by the stock, and the control is drawn for the case this story is about: a stock thin against a troop floor.
- **0 of them lost damage** to the raise, which is the kill-order effect the owner’s report of 2026-09-29 made concrete: a stack with more total HP dies a round earlier and strikes that much less. It is why a `Best` position — the count that gives the most damage under the line — is a second step rather than folded into `Most`, which promises *units*, not damage.
- **The housing bound on 0 readings.** Where it did, the spare was spent in kill order from the bottom up — the owner’s *"fill the stack that strikes most first"*, the last to fall being the one that strikes most. Where it did not, the **stock** is what stops the raise, never the pool: a mercenary is bounded by what the account owns.

