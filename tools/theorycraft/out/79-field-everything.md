
## A. The plan’s shape, played with the real battle

The plan is **10 marches**: 9 repeats of one march and a finale. Both are replayed below through `simulateBattle`, so this is what the game would pay.

| march | epic-monster-hunter-6 | arbalester-6 | legionary-6 | chariot-6 | damage | strikes |
|---|---|---|---|---|---|
| #1 | 35 | 40 | 40 | 20 | **4,488,244** | 8 |
| #2 | 35 | 40 | 40 | 20 | **4,488,244** | 8 |
| #10 | 56 | 40 | 36 | 19 | **5,020,980** | 8 |
| **total** | | **45,415,176** | |

## B. Fielding everything you hold, re-planned each march

The player’s own loop: Generate on the stock you have, march it, lose the chunks, Generate again. Each march is a `planCampaign` at `marchTarget: 1`, which has no horizon to ration for, so it fields the whole stock; the stack is then decayed by the game’s own rule and the next march planned on what is left. Played through the real battle as well.

| march | epic-monster-hunter-6 | arbalester-6 | legionary-6 | chariot-6 | damage | strikes |
|---|---|---|---|---|---|
| #1 | 64 | 76 | 72 | 35 | **6,552,948** | 6 |
| #2 | 59 | 68 | 64 | 33 | **5,905,300** | 6 |
| #10 | 0 | 0 | 0 | 8 | **320,349** | 1 |
| **total** | | **35,661,622** | |

## C. One march: what pushing every mercenary to the full stock pays

The owner’s own claim is *"we surely want all mercs, it gets better damage"*. Tested on the **first march of B**, which is the best single march the engine can build on this stock, by raising one hired type at a time to everything the account holds and replaying the real battle.

| variant | epic-monster-hunter-6 | arbalester-6 | legionary-6 | chariot-6 | damage | vs B#1 | strikes |
|---|---|---|---|---|---|---|
| B#1 as planned | 64 | 76 | 72 | 35 | **6,552,948** | 6 |
| B#1 + every epic-monster-hunter | 92 | 76 | 72 | 35 | **6,938,079** | 6 |
| B#1 + every arbalester | 64 | 76 | 72 | 35 | **6,552,948** | 6 |
| B#1 + every legionary | 64 | 76 | 72 | 35 | **6,552,948** | 6 |
| B#1 + every chariot | 64 | 76 | 72 | 37 | **6,612,456** | 6 |
| B#1 + every mercenary | 92 | 76 | 72 | 37 | **6,756,477** | 6 |

(B#1 as planned is 6,552,948 damage.)

## The comparison

| strategy | 10-march total | vs A |
|---|---|---|
| **A — the plan’s constant march** | 45,415,176 | — |
| **B — field everything, re-planned each march** | 35,661,622 | -9,753,554 (-21.5 %) |

What the gap is: A fields 315 epic monster hunters over its 9 repeats, because a constant count has to survive all of them; B fields 135 in its first march alone and then whatever is left, because its horizon is the next march.
