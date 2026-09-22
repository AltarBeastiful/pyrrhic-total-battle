# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired stacks cost to revive (the gold column since S-90, 2026-09-18).

**`a hired`, `a soldier` and `a monster` are each that group’s own damage over its own chunks since S-105** (2026-09-19; the owner: *"dmg per hired is still broken: it shows a damage per hired almost above total damage"*). The numerator is the group’s share of the same enemy-first journal the damage column is summed from, so the three are shares of that column. They divided the campaign’s whole damage until this run, which credited a chunk of rare stock with every point the troops struck for.

The last six columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the chunks of ten told apart into **hired soldiers** and **monsters** — monster mercenaries and dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins the monsters cost to recruit again, and damage a soldier, damage a monster and damage a dragon coin beside damage a hired unit. A campaign that spent none of one kind reads its ratio at `damage / 1`, exactly as `a hired` has always done.

**`hired burned` is the `authority` pool alone since S-102** (2026-09-19; the owner: *"apart from mercs, they [monsters] can be trained just like troops"*). A mercenary is hired and revived for gold, so it is a stock a march does not get back; a dominance monster is trained again ten at a time for silver, queue time and dragon coins, so it is a **price** and it leaves the burn. `soldiers burned + monsters burned = hired burned` therefore holds on every army that houses no dominance unit — all but the monster camp below — and on that one the difference is exactly the dominance chunks, which the dragon-coin column prices.

**Every algorithm the app offers has a row since S-118** (2026-09-21; the owner: *"make it run for all our algorithm in the future"*): the two sizers, the three sizer switches under them (the two monster ceilings only where a dominance pool exists, being a copy of the plain row otherwise), and **all five objectives** — this table asked only for average damage until then. The **troops** column is what those rows needed to be readable: it is the troop types the first march fields and the leadership it spends, and it reads **none** where an objective left every troop type at home. That happens on **8 of the 227** rows, and it is not new — `Troops first · Generate (average damage)` has been an empty march on the evening account and on Aydae-alone since S-101, showing only as a damage figure four times too low. The added rows are `variant` kind, so **no pin moves**: `bestSizer` is still the two plain sizers and their average-damage Generate.

Under each table, the **goal line** (S-101): the plan’s best stop against the captured `TotalStack · Total Optimization` row on the owner’s own three readings — damage a silver, damage a hired soldier and damage a monster — with `✓` at or above 1.0 and `✗` below it. The floors pinned on those three are today’s measured figures, so a `✗` is a discrepancy to judge and not a failing test.

Run: 2026-09-22T08:59:36.082Z, commit (working tree)

No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads `registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes a proposal for the owner to register.

## first-run army, Bear V ×1 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 37,400 | 0 | 1 | 0 | 0 | 37,400 | 18,535,192 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 19,802,016 | 45,738,400 | 0 | 1 | 0.43 | 74,800 | 0 | 1 | 0 | 0 | 74,800 | 19,802,016 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Tier ladder · Generate (damage per gold) | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Troops first · all types | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Troops first · Generate (average damage) | 4 | 3 · 20,000 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 37,400 | 0 | 1 | 0 | 0 | 37,400 | 18,535,192 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 19,802,016 | 45,738,400 | 0 | 1 | 0.43 | 74,800 | 0 | 1 | 0 | 0 | 74,800 | 19,802,016 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Troops first · Generate (damage per gold) | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 17,582,756 | 32,538,400 | 0 | 1 | 0.54 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 17,582,756 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 18,217,808 | 32,529,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,217,808 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 18,217,808 | 32,529,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,217,808 |
| Complete optimization · sweet-spot | 4 | 10 · 20,000 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 18,217,808 for 32,529,600 silver, 0 gold, 0 coins, 1 burned, 9,081,420 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 18,189,008 — **-0.2 %**.

**Over all 3 of their comparable marches**, the bar dominates **1** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at -0.2 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned =, gold =, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.000** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×2 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 56,100 | 0 | 2 | 0 | 0 | 56,100 | 18,609,992 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 19,951,616 | 45,738,400 | 160 | 2 | 0.44 | 112,200 | 0 | 2 | 0 | 0 | 112,200 | 19,951,616 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Tier ladder · Generate (damage per gold) | 4 | 3 · 20,000 | 18,369,054 | 38,394,200 | 160 | 2 | 0.48 | 93,500 | 0 | 2 | 0 | 0 | 93,500 | 18,369,054 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · all types | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · Generate (average damage) | 4 | 3 · 20,000 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 56,100 | 0 | 2 | 0 | 0 | 56,100 | 18,609,992 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 19,951,616 | 45,738,400 | 160 | 2 | 0.44 | 112,200 | 0 | 2 | 0 | 0 | 112,200 | 19,951,616 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · Generate (damage per gold) | 4 | 3 · 20,000 | 18,369,054 | 38,394,200 | 160 | 2 | 0.48 | 93,500 | 0 | 2 | 0 | 0 | 93,500 | 18,369,054 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 17,807,156 | 32,538,400 | 160 | 2 | 0.55 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 17,807,156 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,442,208 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,442,208 |
| Complete optimization · sweet-spot | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 18,442,208 for 32,529,600 silver, 160 gold, 0 coins, 2 burned, 9,081,420 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 18,413,408 — **-0.2 %**.

**Over all 3 of their comparable marches**, the bar dominates **1** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at -0.2 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned =, gold =, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.000** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×3 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,722,192 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 20,176,016 | 45,738,400 | 480 | 3 | 0.44 | 149,600 | 0 | 3 | 0 | 0 | 149,600 | 20,176,016 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Tier ladder · Generate (damage per gold) | 4 | 3 · 20,000 | 18,586,500 | 44,262,800 | 480 | 3 | 0.42 | 99,733 | 0 | 3 | 0 | 0 | 99,733 | 18,586,500 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · all types | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · Generate (average damage) | 4 | 3 · 20,000 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,722,192 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 20,176,016 | 45,738,400 | 480 | 3 | 0.44 | 149,600 | 0 | 3 | 0 | 0 | 149,600 | 20,176,016 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · Generate (damage per gold) | 4 | 3 · 20,000 | 18,586,500 | 44,262,800 | 480 | 3 | 0.42 | 99,733 | 0 | 3 | 0 | 0 | 99,733 | 18,586,500 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 19,022,916 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 3 · 20,000 | 21,427,548 | 56,000,000 | 480 | 3 | 0.38 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 21,427,548 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 10 · 20,000 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 19,022,916 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 3 · 20,000 | 18,741,088 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,741,088 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 10 · 20,000 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 3 · 20,000 | 18,741,088 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,741,088 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 10 · 20,000 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| Complete optimization · sweet-spot | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 0 | 3 | 0.57 | 112,200 | 0 | 3 | 0 | 0 | 112,200 | 18,413,408 |
| Complete optimization · all-in | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 21,427,548 for 56,000,000 silver, 480 gold, 0 coins, 3 burned, 33,600,000 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 18,750,008 — **-12.5 %**.

**Over all 9 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -12.5 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned =, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.000** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×10 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,769,392 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 22,270,416 | 45,738,400 | 4,800 | 4 | 0.49 | 635,800 | 0 | 4 | 0 | 0 | 635,800 | 22,270,416 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| Tier ladder · Generate (damage per gold) | 4 | 3 · 20,000 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,769,392 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| Troops first · all types | 4 | 10 · 20,000 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Troops first · Generate (average damage) | 4 | 3 · 20,000 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,769,392 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 22,270,416 | 45,738,400 | 4,800 | 4 | 0.49 | 635,800 | 0 | 4 | 0 | 0 | 635,800 | 22,270,416 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Troops first · Generate (damage per gold) | 4 | 10 · 20,000 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 21,152,576 | 32,525,600 | 3,840 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 0 | 0 | 4 | 0 | 0 | 0 | 21,539,692 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 3 · 20,000 | 22,474,748 | 56,000,000 | 4,800 | 4 | 0.40 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 22,474,748 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 10 · 20,000 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 0 | 0 | 4 | 0 | 0 | 0 | 21,539,692 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,798,408 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 3 · 20,000 | 19,788,288 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,788,288 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 10 · 20,000 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,798,408 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,162,288 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 3 · 20,000 | 19,788,288 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,788,288 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 10 · 20,000 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,162,288 |
| Complete optimization · sweet-spot | 4 | 10 · 20,000 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Complete optimization · all-in | 4 | 7 · 20,000 | 20,893,375 | 36,013,400 | 4,800 | 4 | 0.58 | 776,050 | 0 | 4 | 0 | 0 | 776,050 | 20,893,375 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 22,474,748 for 56,000,000 silver, 4,800 gold, 0 coins, 4 burned, 33,600,000 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 20,893,375 — **-7.0 %**.

**Over all 9 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -7.0 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned =, gold =, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.153** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 26,655,281 | 32,525,600 | 2,016 | 30 | 0.82 | 250,913 | 30 | 0 | 0 | 250,913 | 0 | 26,655,281 |
| Tier ladder · Generate (average damage) | 4 | 9 · 20,000 | 29,942,175 | 33,291,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,942,175 |
| Tier ladder · Generate (best worst case) | 4 | 9 · 20,000 | 29,942,175 | 33,291,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,942,175 |
| Tier ladder · Generate (damage per silver) | 4 | 9 · 20,000 | 29,588,383 | 32,739,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,588,383 |
| Tier ladder · Generate (damage per gold) | 4 | 9 · 20,000 | 29,942,175 | 33,291,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,942,175 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 26,655,281 | 32,525,600 | 2,016 | 30 | 0.82 | 250,913 | 30 | 0 | 0 | 250,913 | 0 | 26,655,281 |
| Troops first · all types | 4 | 10 · 20,000 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,864,429 |
| Troops first · Generate (average damage) | 4 | 9 · 20,000 | 30,054,424 | 32,908,400 | 2,008 | 30 | 0.91 | 404,435 | 30 | 0 | 0 | 404,435 | 0 | 30,054,424 |
| Troops first · Generate (best worst case) | 4 | 9 · 20,000 | 30,054,424 | 32,908,400 | 2,008 | 30 | 0.91 | 404,435 | 30 | 0 | 0 | 404,435 | 0 | 30,054,424 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,864,429 |
| Troops first · Generate (damage per gold) | 4 | 10 · 20,000 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,864,429 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,864,429 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,864,429 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 409,448 | 29 | 0 | 0 | 409,448 | 0 | 30,221,279 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 9 · 20,000 | 29,758,471 | 34,075,200 | 2,016 | 30 | 0.87 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,758,471 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 10 · 20,000 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 409,448 | 29 | 0 | 0 | 409,448 | 0 | 30,221,279 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,893,229 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 9 · 20,000 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,168,019 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 10 · 20,000 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,893,229 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 26,679,309 | 32,529,600 | 2,016 | 30 | 0.82 | 250,913 | 30 | 0 | 0 | 250,913 | 0 | 26,679,309 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 9 · 20,000 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,168,019 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 9 · 20,000 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,168,019 |
| Complete optimization · sweet-spot | 4 | 10 · 20,000 | 28,655,444 | 32,525,600 | 1,760 | 25 | 0.88 | 423,145 | 25 | 0 | 0 | 423,145 | 0 | 28,655,444 |
| Complete optimization · steady-max | 4 | 10 · 20,000 | 29,691,713 | 32,525,600 | 1,928 | 28 | 0.91 | 414,818 | 28 | 0 | 0 | 414,818 | 0 | 29,691,713 |
| Complete optimization · all-in | 4 | 9 · 20,000 | 29,841,879 | 33,291,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,841,879 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · M’s Preservation` at 30,221,279 for 32,533,600 silver, 1,968 gold, 0 coins, 29 burned, 9,085,320 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 29,841,879 — **-1.3 %**.

**Over all 9 of their comparable marches**, the bar dominates **5** at matched spend; the one it does worst on is `TotalStack · M’s Preservation` at -1.3 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 7 of their 9 marches are dominated, against the bar's 5. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.993** ✗, damage a hired soldier **1.041** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 79,635,913 | 35,450,400 | 5,536 | 34 | 2.25 | 287,394 | 30 | 84 | 31,680 | 250,913 | 630,722 | 2,514 |
| Tier ladder · Generate (average damage) | 4 | 8 · 20,000 | 103,438,192 | 37,939,200 | 19,984 | 34 | 2.73 | 584,975 | 30 | 46 | 26,200 | 569,471 | 1,483,855 | 3,948 |
| Tier ladder · Generate (best worst case) | 4 | 8 · 20,000 | 103,451,512 | 37,939,200 | 19,984 | 34 | 2.73 | 584,975 | 30 | 46 | 26,200 | 569,471 | 1,483,855 | 3,949 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 29,297,141 | 1,865,600 | 55,072 | 34 | 15.70 | 158,975 | 30 | 24 | 16,960 | 135,291 | 1,051,600 | 1,727 |
| Tier ladder · Generate (damage per gold) | 4 | 10 · 20,000 | 64,345,724 | 35,450,400 | 1,280 | 0 | 1.82 | 0 | 0 | 80 | 31,680 | 0 | 578,361 | 2,031 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 5 · 20,000 | 87,907,167 | 49,168,000 | 55,072 | 34 | 1.79 | 417,524 | 30 | 24 | 16,960 | 405,874 | 2,075,150 | 5,183 |
| Troops first · all types | 4 | 10 · 20,000 | 82,845,061 | 35,450,400 | 5,472 | 33 | 2.34 | 425,201 | 29 | 84 | 31,680 | 406,470 | 630,722 | 2,615 |
| Troops first · Generate (average damage) | 4 | 8 · 20,000 | 104,626,942 | 37,290,800 | 18,928 | 34 | 2.81 | 622,813 | 30 | 47 | 26,760 | 601,135 | 1,467,569 | 3,910 |
| Troops first · Generate (best worst case) | 4 | 8 · 20,000 | 104,631,382 | 37,290,800 | 18,928 | 34 | 2.81 | 622,813 | 30 | 47 | 26,760 | 601,135 | 1,467,569 | 3,910 |
| Troops first · Generate (damage per silver) | 4 | **none** | 29,297,141 | 1,865,600 | 55,072 | 34 | 15.70 | 158,975 | 30 | 24 | 16,960 | 135,291 | 1,051,600 | 1,727 |
| Troops first · Generate (damage per gold) | 4 | 10 · 20,000 | 64,345,724 | 35,450,400 | 1,280 | 0 | 1.82 | 0 | 0 | 80 | 31,680 | 0 | 578,361 | 2,031 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 37,003,229 | 32,712,800 | 10,848 | 33 | 1.13 | 418,401 | 29 | 8 | 2,080 | 406,470 | 892,350 | 17,790 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 82,845,061 | 35,450,400 | 5,472 | 33 | 2.34 | 425,201 | 29 | 84 | 31,680 | 406,470 | 630,722 | 2,615 |
| Tier ladder · monsters after troops | 4 | 10 · 20,000 | 79,635,913 | 35,450,400 | 5,536 | 34 | 2.25 | 287,394 | 30 | 84 | 31,680 | 250,913 | 630,722 | 2,514 |
| Troops first · monsters after mercenaries | 4 | 10 · 20,000 | 80,527,377 | 35,425,200 | 5,152 | 33 | 2.27 | 418,401 | 29 | 82 | 31,320 | 406,470 | 617,841 | 2,571 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 64,727,476 | 34,658,400 | 6,336 | 4 | 1.87 | 645,150 | 0 | 72 | 22,880 | 0 | 656,346 | 2,829 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 79,770,931 | 35,454,400 | 4,072 | 32 | 2.25 | 421,574 | 28 | 84 | 31,680 | 396,313 | 602,007 | 2,518 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 79,770,931 | 35,454,400 | 4,072 | 32 | 2.25 | 421,574 | 28 | 84 | 31,680 | 396,313 | 602,007 | 2,518 |
| Complete optimization · sweet-spot | 4 | 10 · 20,000 | 89,196,808 | 35,230,800 | 9,424 | 24 | 2.53 | 476,719 | 20 | 60 | 28,200 | 487,913 | 1,022,696 | 3,163 |
| Complete optimization · more-mercs | 4 | 10 · 20,000 | 93,298,414 | 35,230,800 | 10,272 | 26 | 2.65 | 597,802 | 22 | 60 | 28,200 | 604,494 | 1,032,046 | 3,308 |
| Complete optimization · steady-max | 4 | 9 · 20,000 | 97,458,367 | 36,436,800 | 14,232 | 32 | 2.67 | 543,725 | 28 | 57 | 28,200 | 521,221 | 1,147,440 | 3,456 |
| Complete optimization · all-in | 4 | 9 · 20,000 | 102,971,902 | 37,316,000 | 17,888 | 34 | 2.76 | 594,278 | 30 | 48 | 27,040 | 561,315 | 1,429,491 | 3,808 |

**Matched spend — NO STOP FITS** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 79,770,931 for 35,454,400 silver, 4,072 gold, 31,680 coins, 32 burned, 10,622,220 s. **No stop of ours fits inside it**, over gold.

**Over all 3 of their comparable marches**, the bar dominates **0** at matched spend; none of its stops fits inside any of them.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✗, burned ✗, gold ✗, dragonCoins ✗, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.226** ✓, damage a hired soldier **1.525** ✓, damage a monster **2.375** ✓. All three are at or above the goal. And the fourth currency, where one is spent: **damage a dragon coin 1.512** ✓ — the monsters’ own price (S-102).

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (average damage) | 4 | 8 · 4,000 | 8,461,931 | 6,157,800 | 1,352 | 24 | 1.37 | 245,689 | 24 | 0 | 0 | 245,689 | 0 | 8,461,931 |
| Tier ladder · Generate (best worst case) | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (damage per silver) | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 4,000 | 3,388,215 | 9,374,400 | 312 | 6 | 0.36 | 108,402 | 6 | 0 | 0 | 108,402 | 0 | 3,388,215 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Troops first · all types | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (average damage) | 4 | 8 · 4,000 | 8,518,588 | 6,157,800 | 1,336 | 24 | 1.38 | 256,063 | 24 | 0 | 0 | 256,063 | 0 | 8,518,588 |
| Troops first · Generate (best worst case) | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (damage per silver) | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (damage per gold) | 4 | 2 · 4,000 | 3,388,215 | 9,374,400 | 312 | 6 | 0.36 | 108,402 | 6 | 0 | 0 | 108,402 | 0 | 3,388,215 |
| Troops first · Generate (damage per dragon coin) | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · allow damage trades | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| TotalStack · optimize (as captured, repeated) | 4 | 8 · 3,999 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,762,880 |
| Kai’s calculator · extract (as captured, repeated) | 4 | 7 · 4,000 | 8,616,241 | 6,203,200 | 1,544 | 27 | 1.39 | 228,940 | 27 | 0 | 0 | 228,940 | 0 | 8,616,241 |
| TotalStack · M’s Preservation | 4 | 8 · 3,999 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,762,880 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 8 · 4,000 | 8,750,417 | 6,086,400 | 1,352 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,750,417 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 8 · 3,999 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,762,880 |
| TotalStack · Total Optimization | 4 | 8 · 4,000 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,380,649 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 8 · 4,000 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,380,649 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 8 · 4,000 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,380,649 |
| TotalStack · Elite Preservation | 4 | 8 · 4,000 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,262,390 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8 · 4,000 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,262,390 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8 · 4,000 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,262,390 |
| Complete optimization · silver-saver | 4 | 8 · 2,020 | 5,212,861 | 3,820,600 | 736 | 19 | 1.36 | 189,918 | 19 | 0 | 0 | 189,918 | 0 | 5,212,861 |
| Complete optimization · sweet-spot | 4 | 8 · 4,000 | 8,222,546 | 6,083,200 | 1,176 | 21 | 1.35 | 265,255 | 21 | 0 | 0 | 265,255 | 0 | 8,222,546 |
| Complete optimization · all-in | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · M’s Preservation` at 8,762,880 for 6,084,400 silver, 1,344 gold, 0 coins, 24 burned, 1,370,160 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 8,519,930 — **-2.8 %**.

**Over all 11 of their comparable marches**, the bar dominates **6** at matched spend; the one it does worst on is `TotalStack · optimize (as captured, repeated)` at -2.8 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.017** ✓, damage a hired soldier **1.013** ✓, damage a monster —. All three are at or above the goal.

## 2026-09-17 export, its setup (7 000 leadership)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 7,000 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 108,291 | 93 | 0 | 0 | 108,291 | 0 | 18,589,604 |
| Tier ladder · Generate (average damage) | 4 | 3 · 7,000 | 24,032,714 | 14,192,200 | 6,656 | 93 | 1.69 | 180,940 | 93 | 0 | 0 | 180,940 | 0 | 24,032,714 |
| Tier ladder · Generate (best worst case) | 4 | 3 · 7,000 | 24,309,346 | 15,270,400 | 6,656 | 93 | 1.59 | 186,144 | 93 | 0 | 0 | 186,144 | 0 | 24,309,346 |
| Tier ladder · Generate (damage per silver) | 4 | 6 · 7,000 | 20,813,019 | 11,034,000 | 6,656 | 93 | 1.89 | 143,964 | 93 | 0 | 0 | 143,964 | 0 | 20,813,019 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 7,000 | 8,126,524 | 16,132,800 | 960 | 8 | 0.50 | 230,945 | 8 | 0 | 0 | 230,945 | 0 | 8,126,524 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 7,000 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 108,291 | 93 | 0 | 0 | 108,291 | 0 | 18,589,604 |
| Troops first · all types | 4 | 7 · 7,000 | 23,341,980 | 10,957,600 | 4,064 | 55 | 2.13 | 339,326 | 55 | 0 | 0 | 339,326 | 0 | 23,341,980 |
| Troops first · Generate (average damage) | 4 | 3 · 7,000 | 24,634,972 | 14,192,200 | 6,200 | 86 | 1.74 | 209,894 | 86 | 0 | 0 | 209,894 | 0 | 24,634,972 |
| Troops first · Generate (best worst case) | 4 | 3 · 7,000 | 24,768,804 | 13,274,000 | 5,728 | 79 | 1.87 | 234,700 | 79 | 0 | 0 | 234,700 | 0 | 24,768,804 |
| Troops first · Generate (damage per silver) | 4 | 5 · 7,000 | 23,413,982 | 10,740,200 | 4,296 | 58 | 2.18 | 327,467 | 58 | 0 | 0 | 327,467 | 0 | 23,413,982 |
| Troops first · Generate (damage per gold) | 4 | 7 · 7,000 | 10,236,388 | 10,957,600 | 1,088 | 16 | 0.93 | 305,860 | 16 | 0 | 0 | 305,860 | 0 | 10,236,388 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 7,000 | 23,341,980 | 10,957,600 | 4,064 | 55 | 2.13 | 339,326 | 55 | 0 | 0 | 339,326 | 0 | 23,341,980 |
| Troops first · allow damage trades | 4 | 7 · 7,000 | 23,796,216 | 10,957,600 | 4,088 | 55 | 2.17 | 301,637 | 55 | 0 | 0 | 301,637 | 0 | 23,796,216 |
| TotalStack · M’s Preservation | 4 | 7 · 7,000 | 11,013,524 | 10,972,800 | 960 | 16 | 1.00 | 273,665 | 16 | 0 | 0 | 273,665 | 0 | 11,013,524 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 2 · 7,000 | 13,742,586 | 16,016,000 | 3,472 | 51 | 0.86 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 13,742,586 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 1 · 7,000 | 7,807,482 | 8,400,000 | 3,472 | 51 | 0.93 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · Total Optimization | 4 | 7 · 7,000 | 11,007,500 | 10,965,600 | 960 | 16 | 1.00 | 273,665 | 16 | 0 | 0 | 273,665 | 0 | 11,007,500 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 1 · 7,000 | 7,807,482 | 19,600,000 | 3,472 | 51 | 0.40 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 5 · 7,000 | 13,253,664 | 12,696,000 | 1,632 | 24 | 1.04 | 305,860 | 24 | 0 | 0 | 305,860 | 0 | 13,253,664 |
| TotalStack · Elite Preservation | 4 | 7 · 7,000 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 8,487,048 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 1 · 7,000 | 7,807,482 | 19,600,000 | 3,472 | 51 | 0.40 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 7 · 7,000 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 8,487,048 |
| Complete optimization · silver-saver | 4 | 7 · 5,086 | 16,115,314 | 8,695,000 | 2,544 | 32 | 1.85 | 350,864 | 32 | 0 | 0 | 350,864 | 0 | 16,115,314 |
| Complete optimization · sweet-spot | 4 | 7 · 6,975 | 18,796,348 | 10,906,900 | 2,760 | 35 | 1.72 | 357,360 | 35 | 0 | 0 | 357,360 | 0 | 18,796,348 |
| Complete optimization · more-mercs | 4 | 7 · 7,000 | 21,363,106 | 10,957,600 | 3,536 | 47 | 1.95 | 345,567 | 47 | 0 | 0 | 345,567 | 0 | 21,363,106 |
| Complete optimization · steady-max | 4 | 7 · 7,000 | 22,770,620 | 10,957,600 | 4,000 | 55 | 2.08 | 328,937 | 55 | 0 | 0 | 328,937 | 0 | 22,770,620 |
| Complete optimization · all-in | 4 | 3 · 7,000 | 23,619,920 | 15,179,600 | 6,608 | 92 | 1.56 | 186,943 | 92 | 0 | 0 | 186,943 | 0 | 23,619,920 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 13,742,586 for 16,016,000 silver, 3,472 gold, 0 coins, 51 burned, 7,459,200 s. Our best stop inside that budget (5 %) is `Complete optimization · more-mercs` at 21,363,106 — **+55.5 %**.

**Over all 9 of their comparable marches**, the bar dominates **6** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at +55.5 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✗, burned ✗, gold ✗, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **2.070** ✓, damage a hired soldier **1.306** ✓, damage a monster —. All three are at or above the goal.

## 2026-09-17 export, 12 000 leadership

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 12,000 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 162,142 | 93 | 0 | 0 | 162,142 | 0 | 28,513,298 |
| Tier ladder · Generate (average damage) | 4 | 7 · 12,000 | 30,640,313 | 20,399,600 | 6,656 | 93 | 1.50 | 214,130 | 93 | 0 | 0 | 214,130 | 0 | 30,640,313 |
| Tier ladder · Generate (best worst case) | 4 | 4 · 12,000 | 31,818,133 | 23,752,400 | 6,656 | 93 | 1.34 | 236,141 | 93 | 0 | 0 | 236,141 | 0 | 31,818,133 |
| Tier ladder · Generate (damage per silver) | 4 | 7 · 12,000 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 162,142 | 93 | 0 | 0 | 162,142 | 0 | 28,513,298 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 12,000 | 12,615,536 | 27,657,600 | 960 | 8 | 0.46 | 230,945 | 8 | 0 | 0 | 230,945 | 0 | 12,615,536 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 12,000 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 162,142 | 93 | 0 | 0 | 162,142 | 0 | 28,513,298 |
| Troops first · all types | 4 | 7 · 12,000 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| Troops first · Generate (average damage) | 4 | 5 · 12,000 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 293,769 | 85 | 0 | 0 | 293,769 | 0 | 33,277,720 |
| Troops first · Generate (best worst case) | 4 | 5 · 12,000 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 293,769 | 85 | 0 | 0 | 293,769 | 0 | 33,277,720 |
| Troops first · Generate (damage per silver) | 4 | 7 · 12,000 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| Troops first · Generate (damage per gold) | 4 | 2 · 12,000 | 12,615,536 | 27,657,600 | 960 | 8 | 0.46 | 230,945 | 8 | 0 | 0 | 230,945 | 0 | 12,615,536 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 12,000 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| Troops first · allow damage trades | 4 | 7 · 12,000 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| TotalStack · M’s Preservation | 4 | 7 · 12,000 | 18,971,864 | 18,808,800 | 1,696 | 24 | 1.01 | 316,592 | 24 | 0 | 0 | 316,592 | 0 | 18,971,864 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 5 · 12,000 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 318,738 | 40 | 0 | 0 | 318,738 | 0 | 22,894,812 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 5 · 12,000 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 318,738 | 40 | 0 | 0 | 318,738 | 0 | 22,894,812 |
| TotalStack · Total Optimization | 4 | 7 · 12,000 | 18,833,644 | 18,800,000 | 1,664 | 24 | 1.00 | 311,226 | 24 | 0 | 0 | 311,226 | 0 | 18,833,644 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 5 · 12,000 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 315,519 | 40 | 0 | 0 | 315,519 | 0 | 22,753,836 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 5 · 12,000 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 315,519 | 40 | 0 | 0 | 315,519 | 0 | 22,753,836 |
| TotalStack · Elite Preservation | 4 | 7 · 12,000 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 14,551,348 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 1 · 12,000 | 7,807,482 | 33,600,000 | 3,472 | 51 | 0.23 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 7 · 12,000 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 14,551,348 |
| Complete optimization · silver-saver | 4 | 7 · 6,347 | 20,864,973 | 12,129,500 | 2,984 | 45 | 1.72 | 308,097 | 45 | 0 | 0 | 308,097 | 0 | 20,864,973 |
| Complete optimization · sweet-spot | 4 | 7 · 12,000 | 31,546,458 | 18,790,400 | 4,824 | 67 | 1.68 | 333,911 | 67 | 0 | 0 | 333,911 | 0 | 31,546,458 |
| Complete optimization · steady-max | 4 | 5 · 12,000 | 31,963,845 | 21,035,600 | 5,784 | 82 | 1.52 | 290,661 | 82 | 0 | 0 | 290,661 | 0 | 31,963,845 |

**Matched spend — NO STOP FITS** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 22,894,812 for 21,785,600 silver, 2,848 gold, 0 coins, 40 burned, 7,191,120 s. **No stop of ours fits inside it**, over burned.

**Over all 9 of their comparable marches**, the bar dominates **3** at matched spend; the one it does worst on is `TotalStack · Elite Preservation` at +43.4 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.717** ✓, damage a hired soldier **1.073** ✓, damage a monster —. All three are at or above the goal.

## live account of 2026-09-18 (one hired type, 20 000 leadership)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Tier ladder · Generate (average damage) | 4 | 2 · 20,000 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 26,302,610 | 40,886,800 | 2,016 | 30 | 0.64 | 196,846 | 30 | 0 | 0 | 196,846 | 0 | 26,302,610 |
| Tier ladder · Generate (damage per silver) | 4 | 6 · 20,000 | 24,618,792 | 29,954,400 | 2,016 | 30 | 0.82 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 24,618,792 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 20,000 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Troops first · all types | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Troops first · Generate (average damage) | 4 | 2 · 20,000 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 26,302,610 | 40,886,800 | 2,016 | 30 | 0.64 | 196,846 | 30 | 0 | 0 | 196,846 | 0 | 26,302,610 |
| Troops first · Generate (damage per silver) | 4 | 6 · 20,000 | 24,618,792 | 29,954,400 | 2,016 | 30 | 0.82 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 24,618,792 |
| Troops first · Generate (damage per gold) | 4 | 2 · 20,000 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Troops first · allow damage trades | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| TotalStack · M’s Preservation | 4 | 7 · 20,000 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,980,608 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 7 · 20,000 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,980,608 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 7 · 20,000 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,980,608 |
| TotalStack · Total Optimization | 4 | 7 · 20,000 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 7 · 20,000 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 7 · 20,000 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · Elite Preservation | 4 | 7 · 20,000 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7 · 20,000 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 7 · 20,000 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| Complete optimization · silver-saver | 4 | 7 · 9,298 | 18,256,930 | 18,959,900 | 1,368 | 20 | 0.96 | 309,021 | 20 | 0 | 0 | 309,021 | 0 | 18,256,930 |
| Complete optimization · sweet-spot | 4 | 7 · 19,955 | 28,270,883 | 30,516,200 | 1,760 | 25 | 0.93 | 317,110 | 25 | 0 | 0 | 317,110 | 0 | 28,270,883 |
| Complete optimization · steady-max | 4 | 7 · 19,955 | 28,727,202 | 30,179,700 | 1,904 | 28 | 0.95 | 307,403 | 28 | 0 | 0 | 307,403 | 0 | 28,727,202 |
| Complete optimization · all-in | 4 | 7 · 19,955 | 29,743,332 | 30,928,400 | 2,016 | 30 | 0.96 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,743,332 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 29,222,440 for 31,335,200 silver, 2,016 gold, 0 coins, 30 burned, 7,625,940 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 29,743,332 — **+1.8 %**.

**Over all 9 of their comparable marches**, the bar dominates **9** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +1.8 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.033** ✓, damage a hired soldier **1.043** ✓, damage a monster —. All three are at or above the goal.

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 11,000 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 17,749 | 874 | 0 | 0 | 17,749 | 0 | 28,558,757 |
| Tier ladder · Generate (average damage) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 36,832,597 |
| Tier ladder · Generate (best worst case) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 36,832,597 |
| Tier ladder · Generate (damage per silver) | 4 | 4 · 11,000 | 19,639,033 | 13,848,800 | 62,736 | 874 | 1.42 | 15,186 | 874 | 0 | 0 | 15,186 | 0 | 19,639,033 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 11,000 | 11,246,948 | 25,163,200 | 480 | 4 | 0.45 | 243,219 | 4 | 0 | 0 | 243,219 | 0 | 11,246,948 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 11,000 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 17,749 | 874 | 0 | 0 | 17,749 | 0 | 28,558,757 |
| Troops first · all types | 4 | 7 · 11,000 | 28,435,661 | 17,179,200 | 5,176 | 78 | 1.66 | 250,529 | 78 | 0 | 0 | 250,529 | 0 | 28,435,661 |
| Troops first · Generate (average damage) | 4 | **none** | 8,250,197 | 0 | 62,736 | 874 | — | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 8,250,197 |
| Troops first · Generate (best worst case) | 4 | 1 · 11,000 | 47,025,017 | 30,800,000 | 29,944 | 420 | 1.53 | 111,964 | 420 | 0 | 0 | 111,964 | 0 | 47,025,017 |
| Troops first · Generate (damage per silver) | 4 | 5 · 11,000 | 30,430,044 | 16,279,000 | 5,736 | 82 | 1.87 | 278,204 | 82 | 0 | 0 | 278,204 | 0 | 30,430,044 |
| Troops first · Generate (damage per gold) | 4 | 2 · 11,000 | 11,246,948 | 25,163,200 | 480 | 4 | 0.45 | 243,219 | 4 | 0 | 0 | 243,219 | 0 | 11,246,948 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 11,000 | 28,435,661 | 17,179,200 | 5,176 | 78 | 1.66 | 250,529 | 78 | 0 | 0 | 250,529 | 0 | 28,435,661 |
| Troops first · allow damage trades | 4 | 7 · 11,000 | 32,134,337 | 17,179,200 | 5,240 | 78 | 1.87 | 244,717 | 78 | 0 | 0 | 244,717 | 0 | 32,134,337 |
| TotalStack · M’s Preservation | 4 | 7 · 11,000 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 275,055 | 74 | 0 | 0 | 275,055 | 0 | 32,984,363 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 9,549 | 864 | 0 | 0 | 9,549 | 0 | 36,832,597 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 7 · 11,000 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 275,055 | 74 | 0 | 0 | 275,055 | 0 | 32,984,363 |
| TotalStack · Total Optimization | 4 | 7 · 11,000 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 277,022 | 74 | 0 | 0 | 277,022 | 0 | 33,333,894 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 30,616 | 428 | 1.20 | 19,276 | 428 | 0 | 0 | 19,276 | 0 | 36,832,597 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 7 · 11,000 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 277,022 | 74 | 0 | 0 | 277,022 | 0 | 33,333,894 |
| TotalStack · Elite Preservation | 4 | 7 · 11,000 | 30,966,094 | 17,233,600 | 62,040 | 864 | 1.80 | 18,121 | 864 | 0 | 0 | 18,121 | 0 | 30,966,094 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 9,549 | 864 | 0 | 0 | 9,549 | 0 | 36,832,597 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 4 · 11,000 | 22,905,506 | 16,332,000 | 62,136 | 868 | 1.40 | 16,768 | 868 | 0 | 0 | 16,768 | 0 | 22,905,506 |
| Complete optimization · silver-saver | 4 | 7 · 6,921 | 20,649,596 | 12,339,900 | 3,064 | 50 | 1.67 | 261,252 | 50 | 0 | 0 | 261,252 | 0 | 20,649,596 |
| Complete optimization · sweet-spot | 4 | 7 · 10,992 | 28,140,302 | 17,072,400 | 4,056 | 61 | 1.65 | 285,220 | 61 | 0 | 0 | 285,220 | 0 | 28,140,302 |
| Complete optimization · more-mercs | 4 | 7 · 11,000 | 29,851,070 | 17,179,200 | 4,872 | 70 | 1.74 | 299,381 | 70 | 0 | 0 | 299,381 | 0 | 29,851,070 |
| Complete optimization · steady-max | 4 | 7 · 11,000 | 30,693,083 | 17,179,200 | 5,040 | 76 | 1.79 | 286,825 | 76 | 0 | 0 | 286,825 | 0 | 30,693,083 |
| Complete optimization · all-in | 4 | 5 · 11,000 | 31,714,657 | 18,768,000 | 6,192 | 88 | 1.69 | 272,129 | 88 | 0 | 0 | 272,129 | 0 | 31,714,657 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under Total Optimization (averageDamage)` at 36,832,597 for 30,800,000 silver, 30,616 gold, 0 coins, 428 burned, 18,480,000 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 31,714,657 — **-13.9 %**.

**Over all 9 of their comparable marches**, the bar dominates **1** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -13.9 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 5 of their 9 marches are dominated, against the bar's 1. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.924** ✗, damage a hired soldier **1.081** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 4,975 | 16,014,855 | 7,351,600 | 62,736 | 874 | 2.18 | 11,050 | 874 | 0 | 0 | 11,050 | 0 | 16,014,855 |
| Tier ladder · Generate (average damage) | 4 | 4 · 4,975 | 19,767,678 | 10,575,600 | 62,736 | 874 | 1.87 | 14,538 | 874 | 0 | 0 | 14,538 | 0 | 19,767,678 |
| Tier ladder · Generate (best worst case) | 4 | 4 · 4,975 | 19,767,678 | 10,575,600 | 62,736 | 874 | 1.87 | 14,538 | 874 | 0 | 0 | 14,538 | 0 | 19,767,678 |
| Tier ladder · Generate (damage per silver) | 4 | 3 · 4,975 | 12,671,899 | 5,970,000 | 62,736 | 874 | 2.12 | 10,991 | 874 | 0 | 0 | 10,991 | 0 | 12,671,899 |
| Tier ladder · Generate (damage per gold) | 4 | 7 · 4,975 | 5,902,321 | 8,690,000 | 480 | 4 | 0.68 | 394,640 | 4 | 0 | 0 | 394,640 | 0 | 5,902,321 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 8 · 4,975 | 16,014,855 | 7,351,600 | 62,736 | 874 | 2.18 | 11,050 | 874 | 0 | 0 | 11,050 | 0 | 16,014,855 |
| Troops first · all types | 4 | 8 · 4,975 | 13,629,206 | 7,351,600 | 2,064 | 28 | 1.85 | 338,016 | 28 | 0 | 0 | 338,016 | 0 | 13,629,206 |
| Troops first · Generate (average damage) | 4 | **none** | 8,157,173 | 0 | 62,736 | 874 | — | 9,333 | 874 | 0 | 0 | 9,333 | 0 | 8,157,173 |
| Troops first · Generate (best worst case) | 4 | 1 · 4,974 | 23,501,117 | 13,927,200 | 15,992 | 224 | 1.69 | 104,916 | 224 | 0 | 0 | 104,916 | 0 | 23,501,117 |
| Troops first · Generate (damage per silver) | 4 | 1 · 4,975 | 12,929,213 | 5,970,000 | 7,704 | 108 | 2.17 | 119,715 | 108 | 0 | 0 | 119,715 | 0 | 12,929,213 |
| Troops first · Generate (damage per gold) | 4 | 8 · 4,975 | 6,494,548 | 7,351,600 | 512 | 8 | 0.88 | 291,224 | 8 | 0 | 0 | 291,224 | 0 | 6,494,548 |
| Troops first · Generate (damage per dragon coin) | 4 | 8 · 4,975 | 13,629,206 | 7,351,600 | 2,064 | 28 | 1.85 | 338,016 | 28 | 0 | 0 | 338,016 | 0 | 13,629,206 |
| Troops first · allow damage trades | 4 | 8 · 4,975 | 13,629,206 | 7,351,600 | 2,064 | 28 | 1.85 | 338,016 | 28 | 0 | 0 | 338,016 | 0 | 13,629,206 |
| TotalStack · M’s Preservation | 4 | 7 · 4,975 | 16,511,384 | 7,794,800 | 2,624 | 40 | 2.12 | 299,062 | 40 | 0 | 0 | 299,062 | 0 | 16,511,384 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 1 · 4,974 | 18,789,597 | 13,927,200 | 62,040 | 864 | 1.35 | 9,441 | 864 | 0 | 0 | 9,441 | 0 | 18,789,597 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 1 · 4,974 | 12,929,213 | 5,968,800 | 7,704 | 108 | 2.17 | 119,715 | 108 | 0 | 0 | 119,715 | 0 | 12,929,213 |
| TotalStack · Total Optimization | 4 | 7 · 4,975 | 16,378,468 | 7,794,000 | 2,624 | 40 | 2.10 | 299,062 | 40 | 0 | 0 | 299,062 | 0 | 16,378,468 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 1 · 4,974 | 23,501,117 | 13,927,200 | 15,992 | 224 | 1.69 | 104,916 | 224 | 0 | 0 | 104,916 | 0 | 23,501,117 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 7 · 4,975 | 16,378,468 | 7,794,000 | 2,624 | 40 | 2.10 | 299,062 | 40 | 0 | 0 | 299,062 | 0 | 16,378,468 |
| TotalStack · Elite Preservation | 4 | 7 · 4,975 | 17,106,725 | 7,794,000 | 62,040 | 864 | 2.19 | 11,478 | 864 | 0 | 0 | 11,478 | 0 | 17,106,725 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 4 · 4,975 | 19,767,786 | 10,575,600 | 62,040 | 864 | 1.87 | 14,706 | 864 | 0 | 0 | 14,706 | 0 | 19,767,786 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 7 · 4,975 | 17,106,725 | 7,794,000 | 62,040 | 864 | 2.19 | 11,478 | 864 | 0 | 0 | 11,478 | 0 | 17,106,725 |
| Complete optimization · sweet-spot | 4 | 7 · 4,975 | 15,533,933 | 7,682,800 | 2,440 | 37 | 2.02 | 300,662 | 37 | 0 | 0 | 300,662 | 0 | 15,533,933 |
| Complete optimization · steady-max | 4 | 4 · 4,975 | 17,630,102 | 8,448,400 | 4,120 | 58 | 2.09 | 237,879 | 58 | 0 | 0 | 237,879 | 0 | 17,630,102 |
| Complete optimization · all-in | 4 | 3 · 4,975 | 18,744,735 | 11,240,800 | 7,848 | 111 | 1.67 | 133,301 | 111 | 0 | 0 | 133,301 | 0 | 18,744,735 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under Total Optimization (averageDamage)` at 23,501,117 for 13,927,200 silver, 15,992 gold, 0 coins, 224 burned, 8,356,320 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 18,744,735 — **-20.2 %**.

**Over all 9 of their comparable marches**, the bar dominates **0** at matched spend; the one it does worst on is `TotalStack · priority search under Total Optimization (averageDamage)` at -20.2 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 1 of their 9 marches are dominated, against the bar's 0. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✗, burned ✓, gold ✓, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.993** ✗, damage a hired soldier **1.005** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 4,975 | 43,923,310 | 7,770,800 | 60,704 | 398 | 5.65 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 43,923,310 |
| Tier ladder · Generate (average damage) | 4 | 1 · 4,974 | 45,064,115 | 13,927,200 | 56,160 | 445 | 3.24 | 72,224 | 425 | 20 | 0 | 51,881 | 504,504 | 45,064,115 |
| Tier ladder · Generate (best worst case) | 4 | 1 · 4,974 | 50,184,710 | 13,927,200 | 60,704 | 398 | 3.60 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 50,184,710 |
| Tier ladder · Generate (damage per silver) | 4 | 1 · 4,974 | 35,372,775 | 5,968,800 | 56,160 | 445 | 5.93 | 72,224 | 425 | 20 | 0 | 51,881 | 504,504 | 35,372,775 |
| Tier ladder · Generate (damage per gold) | 4 | 1 · 4,974 | 22,049,595 | 13,927,200 | 11,968 | 169 | 1.58 | 130,471 | 169 | 0 | 0 | 130,471 | 0 | 22,049,595 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 4,975 | 43,923,310 | 7,770,800 | 60,704 | 398 | 5.65 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 43,923,310 |
| Troops first · all types | 4 | 7 · 4,975 | 8,921,776 | 7,770,800 | 2,144 | 28 | 1.15 | 174,820 | 24 | 4 | 0 | 148,517 | 332,640 | 8,921,776 |
| Troops first · Generate (average damage) | 4 | 1 · 4,974 | 50,435,355 | 13,927,200 | 51,872 | 353 | 3.62 | 142,876 | 333 | 20 | 0 | 118,826 | 543,312 | 50,435,355 |
| Troops first · Generate (best worst case) | 4 | 1 · 4,974 | 50,435,355 | 13,927,200 | 51,872 | 353 | 3.62 | 142,876 | 333 | 20 | 0 | 118,826 | 543,312 | 50,435,355 |
| Troops first · Generate (damage per silver) | 4 | 1 · 4,974 | 50,435,355 | 13,927,200 | 51,872 | 353 | 3.62 | 142,876 | 333 | 20 | 0 | 118,826 | 543,312 | 50,435,355 |
| Troops first · Generate (damage per gold) | 4 | 7 · 4,975 | 6,002,056 | 7,770,800 | 640 | 12 | 0.77 | 164,603 | 12 | 0 | 0 | 164,603 | 0 | 6,002,056 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 4,975 | 8,921,776 | 7,770,800 | 2,144 | 28 | 1.15 | 174,820 | 24 | 4 | 0 | 148,517 | 332,640 | 8,921,776 |
| Troops first · allow damage trades | 4 | 7 · 4,975 | 12,045,488 | 7,770,800 | 2,784 | 28 | 1.55 | 219,328 | 24 | 4 | 0 | 255,883 | 0 | 12,045,488 |
| TotalStack · M’s Preservation | 4 | 7 · 4,975 | 35,412,012 | 7,797,200 | 60,352 | 260 | 4.54 | 104,017 | 228 | 32 | 0 | 118,616 | 0 | 35,412,012 |
| TotalStack · Total Optimization | 4 | 7 · 4,975 | 49,229,801 | 7,794,000 | 59,176 | 374 | 6.32 | 109,269 | 346 | 28 | 0 | 118,111 | 0 | 49,229,801 |
| TotalStack · Elite Preservation | 4 | 7 · 4,975 | 49,229,801 | 7,794,000 | 59,176 | 374 | 6.32 | 109,269 | 346 | 28 | 0 | 118,111 | 0 | 49,229,801 |
| Complete optimization · sweet-spot | 4 | 7 · 4,560 | 8,980,108 | 7,241,900 | 1,664 | 19 | 1.24 | 233,912 | 15 | 4 | 0 | 229,761 | 249,480 | 8,980,108 |
| Complete optimization · more-mercs | 4 | 4 · 4,975 | 12,086,359 | 9,849,200 | 5,264 | 37 | 1.23 | 195,020 | 33 | 4 | 0 | 138,018 | 665,280 | 12,086,359 |
| Complete optimization · steady-max | 4 | 4 · 4,975 | 15,306,859 | 9,849,200 | 6,344 | 52 | 1.55 | 200,697 | 48 | 4 | 0 | 161,981 | 665,280 | 15,306,859 |
| Complete optimization · all-in | 4 | 2 · 4,975 | 10,899,547 | 6,653,700 | 17,504 | 133 | 1.64 | 81,951 | 125 | 8 | 0 | 59,255 | 436,590 | 10,899,547 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 49,229,801 for 7,794,000 silver, 59,176 gold, 0 coins, 374 burned, 1,896,300 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 10,899,547 — **-77.9 %**.

**Over all 3 of their comparable marches**, the bar dominates **0** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at -77.9 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.259** ✗, damage a hired soldier **1.945** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 4,975 | 5,904,308 | 7,770,800 | 11,120 | 156 | 0.76 | 0 | 156 | 0 | 0 | 0 | 0 | 5,904,308 |
| Tier ladder · Generate (average damage) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (best worst case) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (damage per silver) | 4 | 1 · 4,974 | 3,233,100 | 5,968,800 | 11,120 | 156 | 0.54 | 0 | 156 | 0 | 0 | 0 | 0 | 3,233,100 |
| Tier ladder · Generate (damage per gold) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 4,975 | 5,904,308 | 7,770,800 | 11,120 | 156 | 0.76 | 0 | 156 | 0 | 0 | 0 | 0 | 5,904,308 |
| Troops first · all types | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · Generate (average damage) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Troops first · Generate (best worst case) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Troops first · Generate (damage per silver) | 4 | 1 · 4,974 | 24,252,471 | 12,932,900 | 10,784 | 151 | 1.88 | 160,612 | 151 | 0 | 0 | 160,612 | 0 | 24,252,471 |
| Troops first · Generate (damage per gold) | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · allow damage trades | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| TotalStack · M’s Preservation | 4 | 7 · 4,975 | 5,002,716 | 7,797,200 | 0 | 0 | 0.64 | 0 | 0 | 0 | 0 | 0 | 0 | 5,002,716 |
| TotalStack · Total Optimization | 4 | 7 · 4,975 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 0 | 156 | 0 | 0 | 0 | 0 | 6,422,616 |
| TotalStack · Elite Preservation | 4 | 7 · 4,975 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 0 | 156 | 0 | 0 | 0 | 0 | 6,422,616 |
| Complete optimization · silver-saver | 4 | 5 · 3,918 | 7,561,467 | 7,313,300 | 848 | 12 | 1.03 | 318,189 | 12 | 0 | 0 | 318,189 | 0 | 7,561,467 |
| Complete optimization · sweet-spot | 4 | 5 · 4,964 | 9,068,238 | 8,746,700 | 1,016 | 15 | 1.04 | 306,324 | 15 | 0 | 0 | 306,324 | 0 | 9,068,238 |
| Complete optimization · more-mercs | 4 | 3 · 4,975 | 10,294,068 | 10,005,200 | 2,288 | 33 | 1.03 | 170,126 | 33 | 0 | 0 | 170,126 | 0 | 10,294,068 |
| Complete optimization · steady-max | 4 | 2 · 4,974 | 13,842,678 | 10,476,500 | 3,944 | 57 | 1.32 | 164,062 | 57 | 0 | 0 | 164,062 | 0 | 13,842,678 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 6,422,616 for 7,794,000 silver, 11,120 gold, 0 coins, 156 burned, 1,896,300 s. Our best stop inside that budget (5 %) is `Complete optimization · silver-saver` at 7,561,467 — **+17.7 %**.

**Over all 3 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +17.7 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.603** ✓, damage a hired soldier —, damage a monster —. All three are at or above the goal.

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 5,100 | 6,045,332 | 7,964,000 | 2,960 | 42 | 0.76 | 0 | 42 | 0 | 0 | 0 | 0 | 6,045,332 |
| Tier ladder · Generate (average damage) | 4 | 2 · 5,100 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| Tier ladder · Generate (best worst case) | 4 | 2 · 5,100 | 12,017,757 | 11,249,600 | 2,960 | 42 | 1.07 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 12,017,757 |
| Tier ladder · Generate (damage per silver) | 4 | 1 · 5,100 | 9,027,735 | 7,574,400 | 2,960 | 42 | 1.19 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 9,027,735 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 5,100 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 5,100 | 6,045,332 | 7,964,000 | 2,960 | 42 | 0.76 | 0 | 42 | 0 | 0 | 0 | 0 | 6,045,332 |
| Troops first · all types | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · Generate (average damage) | 4 | 2 · 5,100 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| Troops first · Generate (best worst case) | 4 | 3 · 5,100 | 12,074,020 | 11,102,400 | 2,912 | 41 | 1.09 | 159,818 | 41 | 0 | 0 | 159,818 | 0 | 12,074,020 |
| Troops first · Generate (damage per silver) | 4 | 1 · 5,100 | 9,027,735 | 7,574,400 | 2,960 | 42 | 1.19 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 9,027,735 |
| Troops first · Generate (damage per gold) | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · allow damage trades | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| TotalStack · M’s Preservation | 4 | 7 · 5,100 | 5,128,468 | 7,992,800 | 0 | 0 | 0.64 | 0 | 0 | 0 | 0 | 0 | 0 | 5,128,468 |
| TotalStack · Total Optimization | 4 | 7 · 5,100 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 0 | 42 | 0 | 0 | 0 | 0 | 6,585,128 |
| TotalStack · Elite Preservation | 4 | 7 · 5,100 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 0 | 42 | 0 | 0 | 0 | 0 | 6,585,128 |
| Complete optimization · sweet-spot | 4 | 5 · 5,100 | 10,156,338 | 9,503,600 | 1,792 | 25 | 1.07 | 258,218 | 25 | 0 | 0 | 258,218 | 0 | 10,156,338 |
| Complete optimization · more-mercs | 4 | 3 · 5,100 | 10,197,781 | 10,729,000 | 2,416 | 34 | 0.95 | 159,888 | 34 | 0 | 0 | 159,888 | 0 | 10,197,781 |
| Complete optimization · steady-max | 4 | 3 · 5,100 | 11,196,175 | 11,037,400 | 2,808 | 39 | 1.01 | 161,791 | 39 | 0 | 0 | 161,791 | 0 | 11,196,175 |
| Complete optimization · all-in | 4 | 3 · 5,100 | 11,585,381 | 11,202,400 | 2,888 | 41 | 1.03 | 158,634 | 41 | 0 | 0 | 158,634 | 0 | 11,585,381 |

**Matched spend — NO STOP FITS** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 6,585,128 for 7,990,400 silver, 2,960 gold, 0 coins, 42 burned, 1,944,480 s. **No stop of ours fits inside it**, over silver.

**Over all 3 of their comparable marches**, the bar dominates **0** at matched spend; none of its stops fits inside any of them.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 2 of their 3 marches are dominated, against the bar's 0. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✗, burned ✗, gold ✗, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.297** ✓, damage a hired soldier —, damage a monster —. All three are at or above the goal.

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 5,225 | 6,739,348 | 7,990,800 | 1,952 | 29 | 0.84 | 0 | 29 | 16 | 3,840 | 0 | 126,953 | 1,755 |
| Tier ladder · Generate (average damage) | 4 | 5 · 5,225 | 8,444,893 | 9,547,400 | 1,952 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Tier ladder · Generate (best worst case) | 4 | 5 · 5,225 | 8,444,893 | 9,547,400 | 1,952 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 627,380 | 134,400 | 1,952 | 29 | 4.67 | 0 | 29 | 12 | 1,920 | 0 | 52,282 | 327 |
| Tier ladder · Generate (damage per gold) | 4 | 5 · 5,225 | 8,444,893 | 9,547,400 | 1,952 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 5 · 5,225 | 8,145,045 | 9,413,000 | 1,952 | 29 | 0.87 | 105,962 | 29 | 12 | 1,920 | 105,962 | 104,563 | 4,242 |
| Troops first · all types | 4 | 8 · 5,225 | 7,673,968 | 7,990,800 | 1,056 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| Troops first · Generate (average damage) | 4 | 5 · 5,225 | 8,647,583 | 9,142,200 | 1,872 | 28 | 0.95 | 105,324 | 28 | 16 | 3,840 | 105,324 | 102,779 | 2,252 |
| Troops first · Generate (best worst case) | 4 | 5 · 5,225 | 8,647,583 | 9,142,200 | 1,872 | 28 | 0.95 | 105,324 | 28 | 16 | 3,840 | 105,324 | 102,779 | 2,252 |
| Troops first · Generate (damage per silver) | 4 | **none** | 627,380 | 134,400 | 1,952 | 29 | 4.67 | 0 | 29 | 12 | 1,920 | 0 | 52,282 | 327 |
| Troops first · Generate (damage per gold) | 4 | 8 · 5,225 | 7,809,640 | 7,890,000 | 1,056 | 16 | 0.99 | 104,118 | 16 | 8 | 2,400 | 104,118 | 270,864 | 3,254 |
| Troops first · Generate (damage per dragon coin) | 4 | 5 · 5,225 | 8,260,269 | 9,089,600 | 1,880 | 28 | 0.91 | 105,726 | 28 | 12 | 1,920 | 105,726 | 110,985 | 4,302 |
| Troops first · allow damage trades | 4 | 8 · 5,225 | 7,673,968 | 7,990,800 | 1,056 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| Tier ladder · monsters after troops | 4 | 8 · 5,225 | 6,739,348 | 7,990,800 | 1,952 | 29 | 0.84 | 0 | 29 | 16 | 3,840 | 0 | 126,953 | 1,755 |
| Troops first · monsters after mercenaries | 4 | 8 · 5,225 | 7,673,968 | 7,990,800 | 1,056 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| TotalStack · M’s Preservation | 4 | 8 · 5,225 | 5,187,364 | 7,862,000 | 0 | 0 | 0.66 | 0 | 0 | 12 | 1,920 | 0 | 130,251 | 2,702 |
| TotalStack · Total Optimization | 4 | 8 · 5,225 | 6,779,808 | 7,989,200 | 1,952 | 29 | 0.85 | 0 | 29 | 16 | 3,840 | 0 | 129,633 | 1,766 |
| TotalStack · Elite Preservation | 4 | 8 · 5,225 | 6,779,808 | 7,989,200 | 1,952 | 29 | 0.85 | 0 | 29 | 16 | 3,840 | 0 | 129,633 | 1,766 |
| Complete optimization · silver-saver | 4 | 8 · 2,031 | 4,919,095 | 4,431,600 | 480 | 7 | 1.11 | 131,856 | 7 | 16 | 3,840 | 131,856 | 116,603 | 1,281 |
| Complete optimization · sweet-spot | 4 | 7 · 5,225 | 8,182,228 | 8,340,000 | 1,320 | 19 | 0.98 | 109,005 | 19 | 16 | 3,840 | 109,005 | 118,153 | 2,131 |
| Complete optimization · steady-max | 4 | 6 · 5,225 | 8,408,431 | 8,702,400 | 1,584 | 25 | 0.97 | 100,404 | 25 | 16 | 3,840 | 100,404 | 110,928 | 2,190 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 6,779,808 for 7,989,200 silver, 1,952 gold, 3,840 coins, 29 burned, 1,745,160 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 8,182,228 — **+20.7 %**.

**Over all 3 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +20.7 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins ✗, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.308** ✓, damage a hired soldier —, damage a monster **0.911** ✗. **Below the goal: damage a monster** — a discrepancy for the owner, not a pin. And the fourth currency, where one is spent: **damage a dragon coin 1.240** ✓ — the monsters’ own price (S-102).

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

The plan offers 2 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 5,200 | 8,572,792 | 7,989,600 | 2,192 | 33 | 1.07 | 0 | 33 | 20 | 4,320 | 0 | 187,737 | 1,984 |
| Tier ladder · Generate (average damage) | 4 | 2 · 5,200 | 11,780,261 | 11,670,000 | 2,192 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Tier ladder · Generate (best worst case) | 4 | 2 · 5,200 | 11,780,261 | 11,670,000 | 2,192 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 1,436,400 | 235,200 | 2,192 | 33 | 6.11 | 0 | 33 | 12 | 3,360 | 0 | 119,700 | 428 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 5,200 | 11,780,261 | 11,670,000 | 2,192 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 2 · 5,200 | 10,897,675 | 11,920,800 | 2,192 | 33 | 0.91 | 150,515 | 33 | 12 | 3,360 | 150,515 | 149,625 | 3,243 |
| Troops first · all types | 4 | 8 · 5,200 | 10,574,240 | 7,989,600 | 544 | 8 | 1.32 | 307,403 | 8 | 20 | 4,320 | 307,403 | 187,737 | 2,448 |
| Troops first · Generate (average damage) | 4 | 2 · 5,200 | 11,892,528 | 11,071,800 | 1,960 | 30 | 1.07 | 165,566 | 30 | 20 | 4,080 | 165,566 | 126,534 | 2,915 |
| Troops first · Generate (best worst case) | 4 | 6 · 5,200 | 12,178,602 | 9,592,600 | 1,288 | 21 | 1.27 | 214,180 | 21 | 20 | 4,200 | 214,180 | 157,247 | 2,900 |
| Troops first · Generate (damage per silver) | 4 | **none** | 1,436,400 | 235,200 | 2,192 | 33 | 6.11 | 0 | 33 | 12 | 3,360 | 0 | 119,700 | 428 |
| Troops first · Generate (damage per gold) | 4 | 8 · 5,200 | 11,472,532 | 8,023,200 | 544 | 8 | 1.43 | 461,105 | 8 | 16 | 4,800 | 461,105 | 213,964 | 2,390 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 5,200 | 9,451,652 | 8,280,000 | 704 | 12 | 1.14 | 269,652 | 12 | 8 | 1,920 | 269,652 | 190,320 | 4,923 |
| Troops first · allow damage trades | 4 | 8 · 5,200 | 10,574,240 | 7,989,600 | 544 | 8 | 1.32 | 307,403 | 8 | 20 | 4,320 | 307,403 | 187,737 | 2,448 |
| Tier ladder · monsters after troops | 4 | 8 · 5,200 | 8,572,792 | 7,989,600 | 2,192 | 33 | 1.07 | 0 | 33 | 20 | 4,320 | 0 | 187,737 | 1,984 |
| Troops first · monsters after mercenaries | 4 | 8 · 5,200 | 10,574,240 | 7,989,600 | 544 | 8 | 1.32 | 307,403 | 8 | 20 | 4,320 | 307,403 | 187,737 | 2,448 |
| TotalStack · M’s Preservation | 4 | 7 · 5,200 | 9,138,264 | 8,451,200 | 288 | 4 | 1.08 | 323,582 | 4 | 20 | 4,320 | 323,582 | 154,358 | 2,115 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 3 · 5,200 | 11,041,652 | 11,617,600 | 2,192 | 33 | 0.95 | 150,515 | 33 | 20 | 4,320 | 150,515 | 103,393 | 2,556 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 6 · 5,200 | 11,235,848 | 8,929,600 | 896 | 16 | 1.26 | 258,866 | 16 | 20 | 4,320 | 258,866 | 171,047 | 2,601 |
| TotalStack · Total Optimization | 4 | 7 · 5,200 | 9,172,640 | 8,449,600 | 256 | 4 | 1.09 | 436,836 | 4 | 20 | 4,320 | 436,836 | 136,403 | 2,123 |
| TotalStack · priority search under Total Optimization (averageDamage) | 4 | 7 · 5,200 | 10,526,996 | 8,483,200 | 544 | 8 | 1.24 | 461,105 | 8 | 16 | 4,800 | 461,105 | 133,808 | 2,193 |
| TotalStack · priority search under Total Optimization (damagePerSilver) | 4 | 7 · 5,200 | 10,526,996 | 8,483,200 | 544 | 8 | 1.24 | 461,105 | 8 | 16 | 4,800 | 461,105 | 133,808 | 2,193 |
| TotalStack · Elite Preservation | 4 | 7 · 5,200 | 9,167,008 | 8,449,600 | 2,192 | 33 | 1.08 | 0 | 33 | 20 | 4,320 | 0 | 171,047 | 2,122 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 3 · 5,200 | 10,948,229 | 11,611,200 | 2,192 | 33 | 0.94 | 150,515 | 33 | 20 | 4,320 | 150,515 | 103,393 | 2,534 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 7 · 5,200 | 9,167,008 | 8,449,600 | 2,192 | 33 | 1.08 | 0 | 33 | 20 | 4,320 | 0 | 171,047 | 2,122 |
| Complete optimization · sweet-spot | 4 | 8 · 5,200 | 11,417,051 | 8,090,400 | 544 | 8 | 1.41 | 422,679 | 8 | 23 | 5,760 | 422,679 | 159,797 | 1,982 |
| Complete optimization · steady-max | 4 | 6 · 5,200 | 11,721,371 | 8,695,200 | 808 | 14 | 1.35 | 265,799 | 14 | 20 | 4,320 | 265,799 | 175,220 | 2,713 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (damagePerSilver)` at 11,235,848 for 8,929,600 silver, 896 gold, 4,320 coins, 16 burned, 2,584,080 s. Our best stop inside that budget (5 %) is `Complete optimization · steady-max` at 11,721,371 — **+4.3 %**.

**Over all 9 of their comparable marches**, the bar dominates **5** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (damagePerSilver)` at +4.3 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 7 of their 9 marches are dominated, against the bar's 5. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.300** ✓, damage a hired soldier **0.968** ✗, damage a monster **1.285** ✓. **Below the goal: damage a hired soldier** — a discrepancy for the owner, not a pin. And the fourth currency, where one is spent: **damage a dragon coin 1.278** ✓ — the monsters’ own price (S-102).


## The standing at matched spend

The reading the owner’s definition of *beating* another calculator reduces to (2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*), asked of every army above: **their hardest comparable march, our best stop that spends no more of any of the four costs within 5 %, and the damage between them.** The ratio floors under each table are the derived reading — a stop that costs no more and hits harder is more efficient on all of them at once.

| army | verdict | their hardest march | our stop | Δ | of their marches | none fits | any algorithm |
|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | **short** | TotalStack · Elite Preservation | Complete optimization · sweet-spot | -0.2 % | 1/3 | 0 | 1/3 |
| first-run army, Bear V ×2 (20 000 leadership) | **short** | TotalStack · Elite Preservation | Complete optimization · sweet-spot | -0.2 % | 1/3 | 0 | 1/3 |
| first-run army, Bear V ×3 (20 000 leadership) | **short** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · all-in | -12.5 % | 2/9 | 0 | 2/9 |
| first-run army, Bear V ×10 (20 000 leadership) | **short** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · all-in | -7.0 % | 2/9 | 0 | 2/9 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | **short** | TotalStack · M’s Preservation | Complete optimization · all-in | -1.3 % | 5/9 | 0 | 7/9 |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | **no stop fits** | TotalStack · Elite Preservation | — (over gold) | — | 0/3 | 3 | 0/3 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | **short** | TotalStack · M’s Preservation | Complete optimization · all-in | -2.8 % | 6/11 | 0 | 6/11 |
| 2026-09-17 export, its setup (7 000 leadership) | **beat** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · more-mercs | +55.5 % | 6/9 | 3 | 6/9 |
| 2026-09-17 export, 12 000 leadership | **no stop fits** | TotalStack · priority search under M’s (averageDamage) | — (over burned) | — | 3/9 | 6 | 3/9 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | **beat** | TotalStack · Elite Preservation | Complete optimization · all-in | +1.8 % | 9/9 | 0 | 9/9 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | **short** | TotalStack · priority search under Total Optimization (averageDamage) | Complete optimization · all-in | -13.9 % | 1/9 | 0 | 5/9 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | **short** | TotalStack · priority search under Total Optimization (averageDamage) | Complete optimization · all-in | -20.2 % | 0/9 | 1 | 1/9 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | **short** | TotalStack · Elite Preservation | Complete optimization · all-in | -77.9 % | 0/3 | 0 | 0/3 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | **beat** | TotalStack · Elite Preservation | Complete optimization · silver-saver | +17.7 % | 2/3 | 1 | 2/3 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | **no stop fits** | TotalStack · Elite Preservation | — (over silver) | — | 0/3 | 3 | 2/3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | **beat** | TotalStack · Elite Preservation | Complete optimization · sweet-spot | +20.7 % | 2/3 | 1 | 2/3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | **beat** | TotalStack · priority search under M’s (damagePerSilver) | Complete optimization · steady-max | +4.3 % | 5/9 | 4 | 7/9 |

The last column is the diagnostic, never a verdict: how many of their marches **any** algorithm the app offers would have dominated — the sizers, their switches and all five objectives. An army where it is ahead of the column beside it is an army where the damage is provably reachable and the bar is simply not reaching it.

### The six markers

Our best stop against their best comparable march **on each marker alone**, counted over the armies above. Read them as floors rather than as the goal: winning a marker by fielding a tiny march is not winning, which is what the table above is for.

| marker | direction | we win | tie | we lose |
|---|---|---|---|---|
| damage | max | 8 | 0 | 9 |
| silver | min | 13 | 0 | 4 |
| burned | min | 6 | 4 | 7 |
| gold | min | 7 | 3 | 7 |
| dragonCoins | min | 0 | 15 | 2 |
| seconds | min | 12 | 0 | 5 |

### Where the time goes, and where a clock binds

Not asserted, and deliberately — a timing floor would be red on a slow machine. It is here because it decides what a speed-up is **worth**. `planCampaign` on an army marked *bound* stopped because it ran out of clock rather than out of ideas, so making it faster buys a **better plan**; everywhere else a speed-up buys the same plan sooner and nothing more.

| army | planner | of its budget | bound? | search, all calls | a call | of its budget |
|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 36 ms | 0 % | no | 4,069 ms over 40 | 102 ms | 1 % |
| first-run army, Bear V ×2 (20 000 leadership) | 39 ms | 0 % | no | 3,842 ms over 40 | 96 ms | 1 % |
| first-run army, Bear V ×3 (20 000 leadership) | 33 ms | 0 % | no | 3,807 ms over 40 | 95 ms | 1 % |
| first-run army, Bear V ×10 (20 000 leadership) | 48 ms | 0 % | no | 3,754 ms over 40 | 94 ms | 1 % |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 94 ms | 0 % | no | 3,853 ms over 40 | 96 ms | 1 % |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 9,548 ms | 24 % | no | 77,739 ms over 40 | 1,943 ms | 24 % |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 712 ms | 2 % | no | 9,672 ms over 40 | 242 ms | 3 % |
| 2026-09-17 export, its setup (7 000 leadership) | 1,817 ms | 5 % | no | 4,218 ms over 40 | 105 ms | 1 % |
| 2026-09-17 export, 12 000 leadership | 1,712 ms | 4 % | no | 4,469 ms over 40 | 112 ms | 1 % |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 81 ms | 0 % | no | 446 ms over 40 | 11 ms | 0 % |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 1,196 ms | 3 % | no | 4,240 ms over 40 | 106 ms | 1 % |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 1,241 ms | 3 % | no | 8,960 ms over 40 | 224 ms | 3 % |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 816 ms | 2 % | no | 2,109 ms over 40 | 53 ms | 1 % |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 122 ms | 0 % | no | 441 ms over 40 | 11 ms | 0 % |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 101 ms | 0 % | no | 457 ms over 40 | 11 ms | 0 % |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 3,388 ms | 8 % | no | 7,395 ms over 40 | 185 ms | 2 % |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 4,149 ms | 10 % | no | 7,413 ms over 40 | 185 ms | 2 % |

**0 of 17** armies leave the planner budget-bound, and the priority search is bound on none of them either.

**So on this table a speed-up buys latency and not answer quality**, and that is worth stating plainly because it is the opposite of what the engine felt like. The one army measured to fill its clock is the **20 000-dominance camp** (experiment 129: 40,843–40,934 ms against a 40,000 ms cap), and it is not a scenario here *precisely because* it does not converge — which is what W3 is for. Until W3 registers it, "faster means better answers" is a claim about **one army, and it is not on this table**.

The other reading: the priority search costs far more of a run than the planner does — 78 s over forty calls against 9.6 s on the monster camp — and within a call the **sizer** is 85–90 % of it (experiment 131). A run that wants to be shorter goes after `stacker.ts`.

**5 of 17** armies are beaten at matched spend on their hardest comparable march; 3 have no stop of ours inside their budget at all.

