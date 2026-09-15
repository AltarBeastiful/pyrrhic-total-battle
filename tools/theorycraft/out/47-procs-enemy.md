# 47 — procs as an objective, and the enemy formation re-optimized jointly with the march

Scenario **C** (the bonuses the 2026-09-14 report was fought with, `harness.scenarioC`) is the headline; **B** (0015’s scenario) is reported beside the winners. Housing: leadership 4,343 · authority 2,000 · dominance 800. Caps EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37. Twelve unit types (8 troops + 4 mercenaries), every count feasible in game (`harness.feasible`). Every damage number is `simulateBattle`’s; nothing is re-derived by hand.

## 1. The proc objective

```
E(march) = Σ_stacks hits_avg(stack) × damagePerHit(stack) × (1 + doubleDamageChance(stack)/100)
hits_avg(stack) = (hits_enemyFirst(stack) + hits_armyFirst(stack)) / 2
```
A proc is a plain ×2 on one hit (0015 §1 rule 4; the 2026-09-14 report’s entry 11: RD3 struck 323,686 inclusive of 108,390 = exactly 2 × its ordinary 161,843 inclusive of 54,195), and the number of hits a stack gets depends only on its kill position and N — a proc never changes who dies — so the expectation is exact and the factor is per stack, not per battle.

| proof, on the 7-type winner as `sizeStacks` sizes it (`msRelaxed`, scenario C, N=4) | value |
|---|---|
| engine `avgDamage` — the app’s headline | 7,879,075 |
| engine `(min + max) / 2`, unrounded | 7,879,075 |
| E with **every unit’s chance forced to 0** | 8,115,447 |
| E with **every unit’s chance forced to 100** | 15,994,522 |
| E(0) × 2 | 16,230,895 |
| E at the account’s real chances | 8,288,285 (×1.0519) |

E(0) = 8,115,447 against the engine’s own `(min + max)/2` = 7,879,075; E(100 %) = 15,994,522 against 2 × E(0) = 16,230,895. The formula **is** the journal with one exact multiplier per stack: it collapses to `avgDamage` when there are no procs and doubles when they always fire. (The two differ by the display rounding of 0.5 only.)

The account’s chances (base unit chance + the account’s global +3 %): 3 % · 8 % — ARC2 3 % · RD2 8 % · RD3 8 % · EMH6 3 % · ABT6 3 % · CHR6 8 % · LGN6 3 %. Everything at 3 % is worth ×1.03, the riders and CHR6 (8 %) are worth ×1.08. `strikeTwoSquadsChance` is priced nowhere in this file: the engine does not model it and the repo has no in-game observation of it (**to check in game**).

## 2. Proc-optimal vs average-optimal (scenario C, N=4, one of each)


| march | avg (the app’s figure) | min | max | E(march), procs priced | E ÷ avg | K |
|---|---|---|---|---|---|---|
| 0015’s winner as `sizeStacks` sizes it (`msRelaxed`); K = 7 | 7,879,075 | 7,579,724 | 8,178,426 | 8,288,285 | 1.0519 | 7 |
| 0015’s exhaustive mercenary vector EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 | 8,094,822 | 7,795,471 | 8,394,173 | 8,507,529 | 1.0510 | 7 |
| average-optimal (climbed here) | 8,338,153 | 7,932,150 | 8,744,156 | 8,742,286 | 1.0485 | 8 |
| proc-optimal (climbed here) | 8,337,871 | 7,931,868 | 8,743,874 | 8,742,031 | 1.0485 | 8 |

**0015’s winner as `sizeStacks` sizes it (`msRelaxed`); K = 7** — ARC2 1,697 · RD2 848 · RD3 475 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72
**0015’s exhaustive mercenary vector EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36** — ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67
**average-optimal (climbed here)** — RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138
**proc-optimal (climbed here)** — RD3 582 · EMH6 92 · RD2 762 · ARC2 1,518 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 137

**Verdict: the optimum barely moves.** Both objectives land on the same march up to one or two units of leadership (avg 8,338,153 against 8,337,871, E 8,742,286 against 8,742,031): the difference is **−0.003 % of E**, inside the resolution of the search and inside the ±1-unit rounding of the counts. The riders and CHR6 (8 % each) are already the stacks this ladder pays twice — RD2, RD3 and CHR6 sit at the 2-hit positions in the average-optimal march — so there is no hit to move onto them. Across the other six formations (§3) the proc objective is worth between 0.00 % and +0.73 %, and it never changes the army.

Per-stack ledger — hits in kill order, and what each stack is worth once its chance is priced:

*average-optimal*

| # | stack | units | total HP | per hit | chance | hits E | hits A | hits avg | E contribution |
|---|---|---|---|---|---|---|---|---|---|
| 1 | RD3 | 582 | 1,458,492 | 812,006 | 8 % | 0 | 1 | 0.5 | 438,483 |
| 2 | EMH6 | 92 | 1,451,116 | 1,677,105 | 3 % | 1 | 1 | 1 | 1,727,418 |
| 3 | ARC2 | 1,519 | 1,072,414 | 535,903 | 3 % | 1 | 1 | 1 | 551,980 |
| 4 | RD2 | 761 | 1,072,249 | 531,482 | 8 % | 1 | 1 | 1 | 574,001 |
| 5 | LGN6 | 72 | 1,071,144 | 800,280 | 3 % | 1 | 1 | 1 | 824,288 |
| 6 | CHR6 | 36 | 1,071,144 | 1,071,144 | 8 % | 2 | 2 | 2 | 2,313,671 |
| 7 | ABT6 | 71 | 1,058,326 | 1,079,200 | 3 % | 2 | 2 | 2 | 2,223,152 |
| 8 | SP2 | 138 | 97,290 | 43,346 | 3 % | 2 | 2 | 2 | 89,293 |

*proc-optimal*

| # | stack | units | total HP | per hit | chance | hits E | hits A | hits avg | E contribution |
|---|---|---|---|---|---|---|---|---|---|
| 1 | RD3 | 582 | 1,458,492 | 812,006 | 8 % | 0 | 1 | 0.5 | 438,483 |
| 2 | EMH6 | 92 | 1,451,116 | 1,677,105 | 3 % | 1 | 1 | 1 | 1,727,418 |
| 3 | RD2 | 762 | 1,073,658 | 532,181 | 8 % | 1 | 1 | 1 | 574,755 |
| 4 | ARC2 | 1,518 | 1,071,708 | 535,550 | 3 % | 1 | 1 | 1 | 551,617 |
| 5 | LGN6 | 72 | 1,071,144 | 800,280 | 3 % | 1 | 1 | 1 | 824,288 |
| 6 | CHR6 | 36 | 1,071,144 | 1,071,144 | 8 % | 2 | 2 | 2 | 2,313,671 |
| 7 | ABT6 | 71 | 1,058,326 | 1,079,200 | 3 % | 2 | 2 | 2 | 2,223,152 |
| 8 | SP2 | 137 | 96,585 | 43,032 | 3 % | 2 | 2 | 2 | 88,646 |

## 2b. How much room there is, and the spread the app hides

- 3 % stacks carry **5,258,380** of the march’s 8,338,153 average damage (63.1 %).
- 8 % stacks carry **3,079,773** of the march’s 8,338,153 average damage (36.9 %).

The factor on the average-optimal march is **×1.0485** and on the proc-optimal ×1.0485. The ceiling for any march of this size is ×1.08 (every point of damage on an 8 % stack; ×1.03 is the floor, all of it on a 3 % stack), so the whole proc lever is 3.01 % wide here and **re-arranging the march captures 0.00 % of it**. The reason the lever is small is structural: the damage sits in the mercenaries and three of the four carry 3 %, so there is no way to put the damage on an 8 % stack without giving up more damage than the proc is worth.

The band the app would have to print to show this (the same two journals with the chance factor applied) — and, beside it, the app’s own min→max lever, which is bigger and free:

| march | min | avg | max | min + procs | avg + procs | max + procs | max ÷ min |
|---|---|---|---|---|---|---|---|
| 0015’s winner as `sizeStacks` sizes it (`msRelaxed`); K = 7 | 7,579,724 | 7,879,075 | 8,178,426 | 7,979,954 | 8,288,285 | 8,596,617 | 1.079 |
| 0015’s exhaustive mercenary vector EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 | 7,795,471 | 8,094,822 | 8,394,173 | 8,199,198 | 8,507,529 | 8,815,861 | 1.077 |
| average-optimal (climbed here) | 7,932,150 | 8,338,153 | 8,744,156 | 8,303,803 | 8,742,286 | 9,180,769 | 1.102 |
| proc-optimal (climbed here) | 7,931,868 | 8,337,871 | 8,743,874 | 8,303,547 | 8,742,031 | 9,180,514 | 1.102 |

On the average-optimal march the procs are worth **+404,133 (+4.85 %)** on the average; the army-first lever alone is worth +406,003 on the same average (4.9 %), and the two stack.

Search: 466122 engine evaluations over 996 seeds (8.8 s). Best average seed: “ARC2+RD3 · mercenaries under the floor”; best proc seed: “RD2+RD3 · mercenaries under the floor”.

## 3. The enemy as a lever: the march re-optimized per formation

Best march per formation (scenario C), with the same counts scored under B beside it. The hill-climb searches subset × counts; the seeds are the 510 subset/sizing combinations of the header.

| enemy | N | best march (kill order) | K | avg (C) | E (C) | the same counts under B |
|---|---|---|---|---|---|---|
| N=3 · no flying squad | 3 | ARC2 1,605 · ABT6 76 · RD3 449 · RD2 795 · EMH6 71 · CHR6 37 · LGN6 72 · SP2 250 | 8 | 9,063,829 | 9,504,917 | 7,563,358 |
| N=4 · one of each | 4 | RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138 | 8 | 8,338,153 | 8,742,286 | 7,341,414 |
| N=4 · no flying squad | 4 | RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138 | 8 | 7,996,440 | 8,390,322 | 6,999,701 |
| N=4 · no ranged squad | 4 | CHR6 37 · LGN6 72 · RD3 424 · ARC2 1,501 · SP2 1,499 · EMH6 67 · ABT6 70 · RD2 247 · ARC1 1 | 9 | 7,226,977 | 7,486,547 | 6,440,643 |
| N=4 · no mounted squad | 4 | ARC2 1,605 · RD3 452 · CHR6 37 · LGN6 72 · RD2 751 · EMH6 67 · ABT6 70 · SP2 311 · ARC1 11 · RD1 5 | 10 | 7,678,213 | 8,021,627 | 6,600,611 |
| N=4 · no melee squad | 4 | RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138 | 8 | 8,338,153 | 8,742,286 | 7,341,414 |
| N=8 · Arachne's (2 of each) | 8 | ARC2 2,773 · RD3 781 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · RD2 4 | 7 | 6,315,085 | 6,614,205 | 5,690,693 |
The last column is the **same count vector** scored under B, and it is deliberately lower than the scenario-B optima of 0015: the counts are optimal under C, and B’s different bonuses move the ladder, so a vector that is optimal in one scenario is not in the other. Every number in this file is the engine’s under the bonus scenario its column names.

Against the **fixed** 0015 march (7 types, `msRelaxed`, re-sized in each formation) — the comparison 0015 §5 made across formations:

| enemy | fixed 0015 march (C) | re-optimized (C) | gain | fixed 0015 march (B, 0015’s own number) | note |
|---|---|---|---|---|---|
| N=3 · no flying squad | 8,684,591 | 9,063,829 | +379,238 (+4.4 %) | 8,644,808 | ARC2 / ABT6 lose the flying squad and fall back to melee |
| N=4 · one of each | 7,879,075 | 8,338,153 | +459,078 (+5.8 %) | 7,843,624 | the export's own formation; every feature fires |
| N=4 · no flying squad | 7,695,451 | 7,996,440 | +300,989 (+3.9 %) | 7,660,000 | ARC2 / ABT6 → melee (+78 / +394 % against +101 / +509) |
| N=4 · no ranged squad | 6,121,252 | 7,226,977 | +1,105,725 (+18.1 %) | 6,085,801 | CHR6, RD2, RD3 lose everything: their only category line is ranged |
| N=4 · no mounted squad | 7,071,955 | 7,678,213 | +606,258 (+8.6 %) | 7,036,504 | LGN6, SP2, SP1, SW1 fall back to a bare base hit |
| N=4 · no melee squad | 7,879,075 | 8,338,153 | +459,078 (+5.8 %) | 7,843,624 | the engine’s fallback target is absent; nobody loses a category line |
| N=8 · Arachne's (2 of each) | 5,977,897 | 6,315,085 | +337,188 (+5.6 %) | 5,950,768 | all four categories, but a round is eight kills: K ≤ 9 strikes at most once |

Under **scenario B** the same search run from scratch on the N=4 formation gives:

- **RD3 584 · EMH6 92 · ARC2 1,520 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 133** — K = 8, avg 8,300,884, E 8,703,213. 0015’s exhaustive single-march winner under the same scenario is 8,061,308; this is 239,576 on top of it (3.0 %), and the structure — two fat troop stacks above four mercenary stacks at their caps — is identical in both scenarios.

**Does the objective move the enemy’s optimum too?** Each winner is re-climbed under the proc objective and the two are compared; a `—` means the march is byte-for-byte the same.

| enemy | average-optimal: avg | its E | proc-optimal: avg | its E | E gain | march changed? |
|---|---|---|---|---|---|---|
| N=3 · no flying squad | 9,063,829 | 9,504,917 | 9,063,829 | 9,504,917 | +0 (0.00 %) | no — identical |
| N=4 · one of each | 8,338,153 | 8,742,286 | 8,338,153 | 8,742,286 | +0 (0.00 %) | no — identical |
| N=4 · no flying squad | 7,996,440 | 8,390,322 | 7,996,440 | 8,390,322 | +0 (0.00 %) | no — identical |
| N=4 · no ranged squad | 7,226,977 | 7,486,547 | 7,226,977 | 7,486,547 | +0 (0.00 %) | no — identical |
| N=4 · no mounted squad | 7,678,213 | 8,021,627 | 7,687,459 | 8,080,244 | +58,617 (0.73 %) | ARC2 1,605 · ABT6 76 · RD3 452 · LGN6 72 · RD2 751 · EMH6 67 · CHR6 35 · SP2 312 · ARC1 10 · RD1 5 |
| N=4 · no melee squad | 8,338,153 | 8,742,286 | 8,338,153 | 8,742,286 | +0 (0.00 %) | no — identical |
| N=8 · Arachne's (2 of each) | 6,315,085 | 6,614,205 | 6,308,875 | 6,631,938 | +17,733 (0.27 %) | RD2 1,390 · RD3 781 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 1 |

**What one unit of each type is worth per hit, formation by formation** (the engine’s `hitDamage` at count 1, so the numbers are comparable across stacks; a cell below the N=4 column is a feature the formation took away). This is the table that answers “which units belong”:

| unit | N3 | N4 | N4−fly | N4−rng | N4−mnt | N4−mel | N8 |
|---|---|---|---|---|---|---|---|
| SW1 | mounted 61 | mounted 61 | mounted 61 | mounted 61 | melee 51 ↓ | mounted 61 | mounted 61 |
| ARC1 | melee 172 | flying 179 | melee 172 ↓ | flying 179 | flying 179 | flying 179 | flying 179 |
| SP1 | mounted 165 | mounted 165 | mounted 165 | mounted 165 | melee 145 ↓ | mounted 165 | mounted 165 |
| RD1 | ranged 355 | ranged 355 | ranged 355 | melee 290 ↓ | ranged 355 | ranged 355 | ranged 355 |
| ARC2 | melee 332 | flying 353 | melee 332 ↓ | flying 353 | flying 353 | flying 353 | flying 353 |
| SP2 | mounted 314 | mounted 314 | mounted 314 | mounted 314 | melee 261 ↓ | mounted 314 | mounted 314 |
| RD2 | ranged 698 | ranged 698 | ranged 698 | melee 522 ↓ | ranged 698 | ranged 698 | ranged 698 |
| RD3 | ranged 1,395 | ranged 1,395 | ranged 1,395 | melee 928 ↓ | ranged 1,395 | ranged 1,395 | ranged 1,395 |
| EMH6 | melee 18,229 | melee 18,229 | melee 18,229 | melee 18,229 | melee 18,229 | melee 18,229 | melee 18,229 |
| ABT6 | melee 13,015 | flying 15,200 | melee 13,015 ↓ | flying 15,200 | flying 15,200 | flying 15,200 | flying 15,200 |
| LGN6 | mounted 11,115 | mounted 11,115 | mounted 11,115 | mounted 11,115 | melee 5,510 ↓ | mounted 11,115 | mounted 11,115 |
| CHR6 | ranged 29,754 | ranged 29,754 | ranged 29,754 | melee 11,020 ↓ | ranged 29,754 | ranged 29,754 | ranged 29,754 |

(↓ marks a cell lower than the same unit’s N=4 value, i.e. a feature the formation removed. The target moves with the formation because `chooseTarget` follows the largest strength-against among the categories actually present.)

**Which units earn their place.** Row = unit, cell = count in that formation’s winner (— = not fielded).

| unit | N3 | N4 | N4−fly | N4−rng | N4−mnt | N4−mel | N8 |
|---|---|---|---|---|---|---|---|
| SW1 | — | — | — | — | — | — | — |
| ARC1 | — | — | — | 1 | 11 | — | — |
| SP1 | — | — | — | — | — | — | — |
| RD1 | — | — | — | — | 5 | — | — |
| ARC2 | 1,605 | 1,519 | 1,519 | 1,501 | 1,605 | 1,519 | 2,773 |
| SP2 | 250 | 138 | 138 | 1,499 | 311 | 138 | — |
| RD2 | 795 | 761 | 761 | 247 | 751 | 761 | 4 |
| RD3 | 449 | 582 | 582 | 424 | 452 | 582 | 781 |
| EMH6 | 71 | 92 | 92 | 67 | 67 | 92 | 92 |
| ABT6 | 76 | 71 | 71 | 70 | 70 | 71 | 76 |
| LGN6 | 72 | 72 | 72 | 72 | 72 | 72 | 72 |
| CHR6 | 37 | 36 | 36 | 37 | 37 | 36 | 37 |

| enemy | K | Σ hits (mean of the two journals) | mercenary hits | troop leadership | mercenary authority | smallest troop stack | top stack | mercenary hits, E/A, in kill order |
|---|---|---|---|---|---|---|---|---|
| N=3 · no flying squad | 8 | 12.5 | 7 | 4,343 | 293 | 176,250 | 1,133,130 ARC2 | ABT6 1/1 · EMH6 2/2 · CHR6 2/2 · LGN6 2/2 |
| N=4 · one of each | 8 | 10.5 | 6 | 4,343 | 307 | 97,290 | 1,458,492 RD3 | EMH6 1/1 · LGN6 1/1 · CHR6 2/2 · ABT6 2/2 |
| N=4 · no flying squad | 8 | 10.5 | 6 | 4,343 | 307 | 97,290 | 1,458,492 RD3 | EMH6 1/1 · LGN6 1/1 · CHR6 2/2 · ABT6 2/2 |
| N=4 · no ranged squad | 9 | 12.5 | 5.5 | 4,343 | 283 | 392 | 1,100,898 CHR6 | CHR6 0/1 · LGN6 1/1 · EMH6 2/2 · ABT6 2/2 |
| N=4 · no mounted squad | 10 | 15.5 | 6 | 4,343 | 283 | 3,915 | 1,133,130 ARC2 | CHR6 1/1 · LGN6 1/1 · EMH6 2/2 · ABT6 2/2 |
| N=4 · no melee squad | 8 | 10.5 | 6 | 4,343 | 307 | 97,290 | 1,458,492 RD3 | EMH6 1/1 · LGN6 1/1 · CHR6 2/2 · ABT6 2/2 |
| N=8 · Arachne's (2 of each) | 7 | 6.5 | 4 | 4,343 | 314 | 5,636 | 1,957,738 ARC2 | EMH6 1/1 · ABT6 1/1 · CHR6 1/1 · LGN6 1/1 |

## 3b. The rule for K, the floor and N

The marginal stack is pure arithmetic (`expectedHits`, the engine’s closed form): the K-th stack in kill order adds `expectedHits(K, N)` hits of its own damage per hit, while every stack in front of the mercenaries also pushes them one position deeper. The staircases:

| K | hits(K) N=3 | hits(K) N=4 | hits(K) N=8 | Δ at N=3 | Δ at N=4 | Δ at N=8 |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 0 | +0 | +0 | +0 |
| 2 | 1 | 1 | 1 | +1 | +1 | +1 |
| 3 | 1 | 1 | 1 | +0 | +0 | +0 |
| 4 | 1 | 1 | 1 | +0 | +0 | +0 |
| 5 | 2 | 1 | 1 | +1 | +0 | +0 |
| 6 | 2 | 2 | 1 | +0 | +1 | +0 |
| 7 | 2 | 2 | 1 | +0 | +0 | +0 |
| 8 | 3 | 2 | 1 | +1 | +0 | +0 |
| 9 | 3 | 2 | 1 | +0 | +0 | +0 |
| 10 | 3 | 3 | 2 | +0 | +1 | +1 |
| 11 | 4 | 3 | 2 | +1 | +0 | +0 |
| 12 | 4 | 3 | 2 | +0 | +0 | +0 |
| 13 | 4 | 3 | 2 | +0 | +0 | +0 |
| 14 | 5 | 4 | 2 | +1 | +1 | +0 |
| 15 | 5 | 4 | 2 | +0 | +0 | +0 |
| 16 | 5 | 4 | 2 | +0 | +0 | +0 |

Measured optima: N3 N=3 K=8, Σ hits 12.5, mercenary hits 7, floor 176,250, 4,343 leadership on troops · N4 N=4 K=8, Σ hits 10.5, mercenary hits 6, floor 97,290, 4,343 leadership on troops · N4−fly N=4 K=8, Σ hits 10.5, mercenary hits 6, floor 97,290, 4,343 leadership on troops · N4−rng N=4 K=9, Σ hits 12.5, mercenary hits 5.5, floor 392, 4,343 leadership on troops · N4−mnt N=4 K=10, Σ hits 15.5, mercenary hits 6, floor 3,915, 4,343 leadership on troops · N4−mel N=4 K=8, Σ hits 10.5, mercenary hits 6, floor 97,290, 4,343 leadership on troops · N8 N=8 K=7, Σ hits 6.5, mercenary hits 4, floor 5,636, 4,343 leadership on troops.

## 3c. Robustness: random restarts, and the exhaustive mercenary grid

Hill-climbing returns a local optimum and the seed list is finite, so two independent checks. **Restarts**: 24 random feasible count vectors per formation, climbed with a smaller budget (2,000 evaluations) and compared with the winner — how often does a fresh basin beat it, and how often does it come within 1 %? **Mercenary grid**: every EMH6 × ABT6 × LGN6 × CHR6 combination inside the caps in steps of five with the winner’s troop counts frozen. The grid can only ever be *worse* — the mercenary counts and the troop floor move together, so freezing the troops breaks the relation that makes the march work — but it proves the mercenary half is not what is left on the table.

| enemy | winner avg | best restart | restarts beating the winner | restarts within 1 % | grid best (troops frozen) |
|---|---|---|---|---|---|
| N=3 · no flying squad | 9,063,829 | 8,629,023 | 0 / 24 | 0 / 24 | 8,850,880 |
| N=4 · one of each | 8,338,153 | 7,644,872 | 0 / 24 | 0 / 24 | 8,037,556 |
| N=4 · no flying squad | 7,996,440 | 7,290,881 | 0 / 24 | 0 / 24 | 7,784,288 |
| N=4 · no ranged squad | 7,226,977 | 6,793,596 | 0 / 24 | 0 / 24 | 6,964,923 |
| N=4 · no mounted squad | 7,678,213 | 6,681,031 | 0 / 24 | 0 / 24 | 7,588,157 |
| N=4 · no melee squad | 8,338,153 | 7,644,872 | 0 / 24 | 0 / 24 | 8,037,556 |
| N=8 · Arachne's (2 of each) | 6,315,085 | 6,292,897 | 0 / 24 | 24 / 24 | 6,181,688 |

## 3d. Are the winners actually optima? Spare budget, single additions, single transfers

Hill-climbing returns a local optimum, so the winners are checked two ways. **Single addition**: add any count of any unit type the march left out (a stack added at the bottom sits at the deepest, best-paid kill position). **Single transfer**: move units out of one stack and spend the freed leadership in another — the move that reaches a different ladder shape. If either finds an improvement, the winner is not an optimum.

| enemy | leadership left | authority left | best single addition | Δ avg | best single transfer | Δ avg |
|---|---|---|---|---|---|---|
| N=3 · no flying squad | 0 | 1,707 | none | +0 | none | +0 |
| N=4 · one of each | 0 | 1,693 | none | +0 | none | +0 |
| N=4 · no flying squad | 0 | 1,693 | none | +0 | none | +0 |
| N=4 · no ranged squad | 0 | 1,717 | none | +0 | none | +0 |
| N=4 · no mounted squad | 0 | 1,717 | none | +0 | ARC1 1 → SP2 1 | +164 |
| N=4 · no melee squad | 0 | 1,693 | none | +0 | none | +0 |
| N=8 · Arachne's (2 of each) | 0 | 1,686 | none | +0 | none | +0 |

Best improvement a single addition or a single transfer can find on any winner: N3: +0 · N4: +0 · N4−fly: +0 · N4−rng: +0 · N4−mnt: +164 · N4−mel: +0 · N8: +0. Leadership is spent to the last point in every winner — the housing does not bind, the kill order does (a stack is only worth its position).

## 4. The rules the numbers give

**1. The housing never binds; the kill order does.** Leadership is spent to the last point in all seven winners (4,343 / 4,343 / 4,343 / 4,343 / 4,343 / 4,343 / 4,343 of 4,343) and the mercenaries sit at their caps or one step under (authority 283–314 of 2,000). Authority is never the constraint — the stock and the ladder are.

**2. K is set by the next step of the hit staircase, and the step moves with N.** Total hits are fixed by (K, N) alone; what the march controls is *which* positions those hits land on. Measured: N3 N=3 K=8 (Σ 12.5 hits, 7 of them the mercenaries’) · N4 N=4 K=8 (Σ 10.5 hits, 6 of them the mercenaries’) · N4−fly N=4 K=8 (Σ 10.5 hits, 6 of them the mercenaries’) · N4−rng N=4 K=9 (Σ 12.5 hits, 5.5 of them the mercenaries’) · N4−mnt N=4 K=10 (Σ 15.5 hits, 6 of them the mercenaries’) · N4−mel N=4 K=8 (Σ 10.5 hits, 6 of them the mercenaries’) · N8 N=8 K=7 (Σ 6.5 hits, 4 of them the mercenaries’).

The staircase says why: at N=4 the second hit arrives at p=6 and the third at p=10, so a march stops at K=8 — positions 6, 7 and 8 are paid twice and a ninth stack would be paid twice as well but only by taking leadership out of the stacks already being paid. At N=3 the second hit is at p=5 and the third at p=8, so K=8 already reaches the third hit and the same 8 stacks collect 12.5 hits instead of 10.5 — **N=3 is worth 19 % of hit count for the identical march**. At N=8 the second hit only arrives at p=10, one stack past a whole round, so the march stops at K=7: an eighth or ninth stack would be paid exactly what the seventh is paid and would have to be paid for out of the stacks above it.

The winners' ladders, enemy-first / army-first hits by kill position:

- N=4: RD3 p1 0/1 · EMH6 p2 1/1 · ARC2 p3 1/1 · RD2 p4 1/1 · LGN6 p5 1/1 · CHR6 p6 2/2 · ABT6 p7 2/2 · SP2 p8 2/2
- N=3: ARC2 p1 0/1 · ABT6 p2 1/1 · RD3 p3 1/1 · RD2 p4 1/1 · EMH6 p5 2/2 · CHR6 p6 2/2 · LGN6 p7 2/2 · SP2 p8 3/3
- N=8: ARC2 p1 0/1 · RD3 p2 1/1 · EMH6 p3 1/1 · ABT6 p4 1/1 · CHR6 p5 1/1 · LGN6 p6 1/1 · RD2 p7 1/1

**3. Losing a category feature moves leadership, not membership.** SW1 and SP1 are never fielded in any of the seven winners; ARC2 and RD3 are in all seven; EMH6 is in all seven and never loses a point of its +609 % because that line is on `epicMonsters`, a constant `constantStrengthAgainst` adds whatever the target is. What a denied category does is shrink the stacks that lose their feature and hand the leadership to the ones that keep theirs: at N=4 SW1, ARC1, SP1, RD1 are left out entirely and RD3 582 and RD2 761 sit in front of the mercenaries; with **no ranged squad** the same two fall to RD3 424 and RD2 247 while SP2 rises from 138 to 1,499, and the march goes one stack deeper (K=9) — the units do not leave the march, their share of the leadership does. The one true exclusion is SW1, and it is excluded for a reason the enemy cannot change: the specialist’s ×1.51 health against the guardsmen’s ×2.43 makes it the dearest sponge per HP this account owns.

**4. The formation that changes nothing.** “No melee squad” produces the byte-identical winner to “one of each” (avg 8,338,153): with melee, ranged, mounted and flying all present and four squads on the board, no unit in this account picks the melee squad as its target, so removing it changes neither the targets nor N. A melee squad is worth exactly nothing to this account.

**5. Both levers are real but neither is worth re-arranging the march.** The procs are worth ×1.0485 on the N=4 winner (+404,133 a march) and are free; the enemy choice is worth 25 % between the best formation (N=3) and the worst (no ranged squad). But the march does not change for either: the same troop types come back every time, and the proc optimum is the average optimum up to 1–2 units (§2). Both are dwarfed by 0015’s own lever — taking Swordsman I out of the floor, +75 %.

**6. The ceiling on this account.** The best march found anywhere in this file is the N=3 one: ARC2 1,605 · ABT6 76 · RD3 449 · RD2 795 · EMH6 71 · CHR6 37 · LGN6 72 · SP2 250, avg 9,063,829, E 9,504,917 (scenario C). The worst of the seven formations costs 1,836,852 of it.

Per-formation timings (the whole file is bounded well under 5 minutes):
- N=3 · no flying squad: 224033 evaluations over 498 seeds, 4.5 s, best seed “ARC2+RD2+RD3 · mercenaries under the floor”
- N=4 · one of each: 226764 evaluations over 498 seeds, 4.2 s, best seed “ARC2+RD3 · mercenaries under the floor”
- N=4 · no flying squad: 232762 evaluations over 498 seeds, 4.3 s, best seed “ARC2+RD3 · mercenaries under the floor”
- N=4 · no ranged squad: 264028 evaluations over 498 seeds, 5.0 s, best seed “ARC2+SP2+RD3 · mercenaries at their caps”
- N=4 · no mounted squad: 240789 evaluations over 498 seeds, 4.6 s, best seed “SP2+RD3 · mercenaries under the floor”
- N=4 · no melee squad: 226764 evaluations over 498 seeds, 4.2 s, best seed “ARC2+RD3 · mercenaries under the floor”
- N=8 · Arachne's (2 of each): 179010 evaluations over 498 seeds, 3.2 s, best seed “ARC2+RD3 · mercenaries under the floor”

§3: 1594150 evaluations in 43.9 s; the whole file, 53 s including §1, §2 and every check. (0m.)

## 5. The practical rule

**Attack a monster with three squads on the card, and make sure one of them is ranged and one is flying** — the three-squad target tested here is worth 9 % more than a four-squad one even though ARC2 and ABT6 lose their flying bonus in it (the export’s own 2026-09-11 reports show the same monster with three squads and four, so the count is readable before attacking), the same march, eight (Arachne’s) cost 24 %, and a formation with no ranged squad costs 13 % however well the march is re-optimized. **Do not re-arrange the march for it**: two troop stacks (ARC2 + RD3 against a four-squad target, with RD2 in front of the mercenaries as well at N=3) in front of the four mercenaries at their caps is the answer for every one of the seven formations tested; what moves is only the tail, and the procs (×1.0485 here, free) never change which units belong.

In counts, scenario C — **N=3 (no flying squad):** ARC2 1,605 · ABT6 76 · RD3 449 · RD2 795 · EMH6 71 · CHR6 37 · LGN6 72 · SP2 250 → **9,063,829**. **N=4 (one of each, or any four-squad target that keeps a ranged, a mounted and a flying squad):** RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138 → **8,338,153**. **N=8 (Arachne):** ARC2 2,773 · RD3 781 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · RD2 4 → **6,315,085**.

## 6. To check in game

- **Does a proc change the enemy’s behaviour?** The whole objective assumes not: a double-damage hit kills nothing extra, the enemy still wipes one stack per attack, and the victim is still the highest-HP living stack. In-game reading that would settle it: a report where a stack doubles and the *next* enemy line kills a stack that is not the highest-HP survivor.
- **`strikeTwoSquadsChance`.** Not modelled, not priced, never observed. In-game reading: a report where one stack’s entry appears twice in one round with no enemy line between them.
- **The squads on the monster card.** §3 makes N and the presence set worth 20 % and 15 % of a march, and whether the card shows them before the attack is the one input a player needs to use it. In-game reading: the monster’s card next to the report’s first lines, same monster, same hour.
- **The proc chance itself.** Taken as the unit’s base chance plus the account’s global +3 %. In-game reading: the share of doubled lines over ~100 hits of one stack in one long fight.
