# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired stacks cost to revive (the gold column since S-90, 2026-09-18).

**`a hired`, `a soldier` and `a monster` are each that group’s own damage over its own chunks since S-105** (2026-09-19; the owner: *"dmg per hired is still broken: it shows a damage per hired almost above total damage"*). The numerator is the group’s share of the same enemy-first journal the damage column is summed from, so the three are shares of that column. They divided the campaign’s whole damage until this run, which credited a chunk of rare stock with every point the troops struck for.

The last six columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the chunks of ten told apart into **hired soldiers** and **monsters** — monster mercenaries and dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins the monsters cost to recruit again, and damage a soldier, damage a monster and damage a dragon coin beside damage a hired unit. A campaign that spent none of one kind reads its ratio at `damage / 1`, exactly as `a hired` has always done.

**`hired burned` is the `authority` pool alone since S-102** (2026-09-19; the owner: *"apart from mercs, they [monsters] can be trained just like troops"*). A mercenary is hired and revived for gold, so it is a stock a march does not get back; a dominance monster is trained again ten at a time for silver, queue time and dragon coins, so it is a **price** and it leaves the burn. `soldiers burned + monsters burned = hired burned` therefore holds on every army that houses no dominance unit — all but the monster camp below — and on that one the difference is exactly the dominance chunks, which the dragon-coin column prices.

**Every algorithm the app offers has a row since S-118** (2026-09-21; the owner: *"make it run for all our algorithm in the future"*): the two sizers, the three sizer switches under them (the two monster ceilings only where a dominance pool exists, being a copy of the plain row otherwise), and **all five objectives** — this table asked only for average damage until then. The **troops** column is what those rows needed to be readable: it is the troop types the first march fields and the leadership it spends, and it reads **none** where an objective left every troop type at home. That happens on **8 of the 227** rows, and it is not new — `Troops first · Generate (average damage)` has been an empty march on the evening account and on Aydae-alone since S-101, showing only as a damage figure four times too low. The added rows are `variant` kind, so **no pin moves**: `bestSizer` is still the two plain sizers and their average-damage Generate.

Under each table, the **goal line** (S-101): the plan’s best stop against the captured `TotalStack · Total Optimization` row on the owner’s own three readings — damage a silver, damage a hired soldier and damage a monster — with `✓` at or above 1.0 and `✗` below it. The floors pinned on those three are today’s measured figures, so a `✗` is a discrepancy to judge and not a failing test.

Run: 2026-09-24T10:11:40.661Z, commit (working tree)

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
| Complete optimization · sweet-spot | 4 | 10 · 19,994 | 18,479,500 | 32,525,600 | 0 | 1 | 0.57 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,479,500 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 18,217,808 for 32,529,600 silver, 0 gold, 0 coins, 1 burned, 9,081,420 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 18,479,500 — **+1.4 %**.

**Over all 3 of their comparable marches**, the bar dominates **3** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +1.4 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned =, gold =, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.014** ✓, damage a hired soldier —, damage a monster **1.000** ✓. All three are at or above the goal.

## first-run army, Bear V ×2 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 56,100 | 0 | 2 | 0 | 0 | 56,100 | 18,609,992 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 19,951,616 | 45,738,400 | 160 | 2 | 0.44 | 112,200 | 0 | 2 | 0 | 0 | 112,200 | 19,951,616 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Tier ladder · Generate (damage per gold) | 4 | 6 · 20,000 | 18,751,210 | 35,828,800 | 160 | 2 | 0.52 | 130,900 | 0 | 2 | 0 | 0 | 130,900 | 18,751,210 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · all types | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · Generate (average damage) | 4 | 3 · 20,000 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 56,100 | 0 | 2 | 0 | 0 | 56,100 | 18,609,992 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 19,951,616 | 45,738,400 | 160 | 2 | 0.44 | 112,200 | 0 | 2 | 0 | 0 | 112,200 | 19,951,616 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · Generate (damage per gold) | 4 | 6 · 20,000 | 18,751,210 | 35,828,800 | 160 | 2 | 0.52 | 130,900 | 0 | 2 | 0 | 0 | 130,900 | 18,751,210 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 17,807,156 | 32,538,400 | 160 | 2 | 0.55 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 17,807,156 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,442,208 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,442,208 |
| Complete optimization · sweet-spot | 4 | 10 · 19,994 | 18,703,900 | 32,525,600 | 160 | 2 | 0.58 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,703,900 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 18,442,208 for 32,529,600 silver, 160 gold, 0 coins, 2 burned, 9,081,420 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 18,703,900 — **+1.4 %**.

**Over all 3 of their comparable marches**, the bar dominates **3** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +1.4 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned =, gold =, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.014** ✓, damage a hired soldier —, damage a monster **1.000** ✓. All three are at or above the goal.

## first-run army, Bear V ×3 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,722,192 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 20,176,016 | 45,738,400 | 480 | 3 | 0.44 | 149,600 | 0 | 3 | 0 | 0 | 149,600 | 20,176,016 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Tier ladder · Generate (damage per gold) | 4 | 6 · 20,000 | 19,388,212 | 39,132,000 | 480 | 3 | 0.50 | 162,067 | 0 | 3 | 0 | 0 | 162,067 | 19,388,212 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · all types | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · Generate (average damage) | 4 | 3 · 20,000 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,722,192 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 20,176,016 | 45,738,400 | 480 | 3 | 0.44 | 149,600 | 0 | 3 | 0 | 0 | 149,600 | 20,176,016 |
| Troops first · Generate (damage per silver) | 4 | 10 · 20,000 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · Generate (damage per gold) | 4 | 6 · 20,000 | 19,388,212 | 39,132,000 | 480 | 3 | 0.50 | 162,067 | 0 | 3 | 0 | 0 | 162,067 | 19,388,212 |
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
| Complete optimization · sweet-spot | 4 | 10 · 19,994 | 18,703,900 | 32,525,600 | 0 | 3 | 0.58 | 112,200 | 0 | 3 | 0 | 0 | 112,200 | 18,703,900 |
| Complete optimization · all-in | 4 | 10 · 19,994 | 19,040,500 | 32,525,600 | 480 | 3 | 0.59 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 19,040,500 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 21,427,548 for 56,000,000 silver, 480 gold, 0 coins, 3 burned, 33,600,000 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 19,040,500 — **-11.1 %**.

**Over all 9 of their comparable marches**, the bar dominates **8** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -11.1 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned =, gold ✓, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.014** ✓, damage a hired soldier —, damage a monster **1.000** ✓. All three are at or above the goal.

## first-run army, Bear V ×10 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| Tier ladder · Generate (average damage) | 4 | 3 · 20,000 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,769,392 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 22,270,416 | 45,738,400 | 4,800 | 4 | 0.49 | 635,800 | 0 | 4 | 0 | 0 | 635,800 | 22,270,416 |
| Tier ladder · Generate (damage per silver) | 4 | 10 · 20,000 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| Tier ladder · Generate (damage per gold) | 4 | 6 · 20,000 | 22,270,416 | 45,738,400 | 4,800 | 4 | 0.49 | 635,800 | 0 | 4 | 0 | 0 | 635,800 | 22,270,416 |
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
| Complete optimization · sweet-spot | 4 | 10 · 19,994 | 21,060,100 | 32,525,600 | 3,200 | 4 | 0.65 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 21,060,100 |
| Complete optimization · all-in | 4 | 7 · 19,976 | 21,290,233 | 36,008,300 | 4,800 | 4 | 0.59 | 776,050 | 0 | 4 | 0 | 0 | 776,050 | 21,290,233 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 22,474,748 for 56,000,000 silver, 4,800 gold, 0 coins, 4 burned, 33,600,000 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 21,290,233 — **-5.3 %**.

**Over all 9 of their comparable marches**, the bar dominates **4** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -5.3 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned =, gold =, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.013** ✓, damage a hired soldier —, damage a monster **1.153** ✓. All three are at or above the goal.

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

The plan offers 4 stops.

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
| Complete optimization · burn-saver | 4 | 10 · 19,994 | 22,814,644 | 32,525,600 | 736 | 11 | 0.70 | 404,304 | 11 | 0 | 0 | 404,304 | 0 | 22,814,644 |
| Complete optimization · sweet-spot | 4 | 10 · 19,994 | 28,730,044 | 32,525,600 | 1,728 | 24 | 0.88 | 431,781 | 24 | 0 | 0 | 431,781 | 0 | 28,730,044 |
| Complete optimization · steady-max | 4 | 10 · 19,994 | 29,982,205 | 32,525,600 | 1,928 | 28 | 0.92 | 414,818 | 28 | 0 | 0 | 414,818 | 0 | 29,982,205 |
| Complete optimization · all-in | 4 | 9 · 19,982 | 30,140,049 | 33,289,200 | 2,016 | 30 | 0.91 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 30,140,049 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · M’s Preservation` at 30,221,279 for 32,533,600 silver, 1,968 gold, 0 coins, 29 burned, 9,085,320 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 30,140,049 — **-0.3 %**.

**Over all 9 of their comparable marches**, the bar dominates **7** at matched spend; the one it does worst on is `TotalStack · M’s Preservation` at -0.3 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.003** ✓, damage a hired soldier **1.062** ✓, damage a monster —. All three are at or above the goal.

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 10 · 20,000 | 79,635,913 | 35,450,400 | 5,536 | 34 | 2.25 | 287,394 | 30 | 84 | 31,680 | 250,913 | 630,722 | 2,514 |
| Tier ladder · Generate (average damage) | 4 | 8 · 20,000 | 103,438,192 | 37,939,200 | 19,984 | 34 | 2.73 | 584,975 | 30 | 46 | 26,200 | 569,471 | 1,483,855 | 3,948 |
| Tier ladder · Generate (best worst case) | 4 | 8 · 20,000 | 103,451,512 | 37,939,200 | 19,984 | 34 | 2.73 | 584,975 | 30 | 46 | 26,200 | 569,471 | 1,483,855 | 3,949 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 29,737,655 | 1,885,600 | 50,624 | 34 | 15.77 | 194,110 | 30 | 26 | 17,360 | 175,111 | 941,705 | 1,713 |
| Tier ladder · Generate (damage per gold) | 4 | 10 · 20,000 | 64,345,724 | 35,450,400 | 1,280 | 0 | 1.82 | 0 | 0 | 80 | 31,680 | 0 | 578,361 | 2,031 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 6 · 20,000 | 96,666,159 | 47,684,000 | 37,280 | 34 | 2.03 | 417,524 | 30 | 32 | 18,560 | 405,874 | 2,023,835 | 5,208 |
| Troops first · all types | 4 | 10 · 20,000 | 82,845,061 | 35,450,400 | 5,472 | 33 | 2.34 | 425,201 | 29 | 84 | 31,680 | 406,470 | 630,722 | 2,615 |
| Troops first · Generate (average damage) | 4 | 8 · 20,000 | 104,626,942 | 37,290,800 | 18,928 | 34 | 2.81 | 622,813 | 30 | 47 | 26,760 | 601,135 | 1,467,569 | 3,910 |
| Troops first · Generate (best worst case) | 4 | 8 · 20,000 | 104,631,382 | 37,290,800 | 18,928 | 34 | 2.81 | 622,813 | 30 | 47 | 26,760 | 601,135 | 1,467,569 | 3,910 |
| Troops first · Generate (damage per silver) | 4 | **none** | 29,737,655 | 1,885,600 | 50,624 | 34 | 15.77 | 194,110 | 30 | 26 | 17,360 | 175,111 | 941,705 | 1,713 |
| Troops first · Generate (damage per gold) | 4 | 10 · 20,000 | 64,345,724 | 35,450,400 | 1,280 | 0 | 1.82 | 0 | 0 | 80 | 31,680 | 0 | 578,361 | 2,031 |
| Troops first · Generate (damage per dragon coin) | 4 | 10 · 20,000 | 37,003,229 | 32,712,800 | 10,848 | 33 | 1.13 | 418,401 | 29 | 8 | 2,080 | 406,470 | 892,350 | 17,790 |
| Troops first · allow damage trades | 4 | 10 · 20,000 | 82,845,061 | 35,450,400 | 5,472 | 33 | 2.34 | 425,201 | 29 | 84 | 31,680 | 406,470 | 630,722 | 2,615 |
| Tier ladder · monsters after troops | 4 | 10 · 20,000 | 79,635,913 | 35,450,400 | 5,536 | 34 | 2.25 | 287,394 | 30 | 84 | 31,680 | 250,913 | 630,722 | 2,514 |
| Troops first · monsters after mercenaries | 4 | 10 · 20,000 | 80,527,377 | 35,425,200 | 5,152 | 33 | 2.27 | 418,401 | 29 | 82 | 31,320 | 406,470 | 617,841 | 2,571 |
| TotalStack · M’s Preservation | 4 | 10 · 20,000 | 64,727,476 | 34,658,400 | 6,336 | 4 | 1.87 | 645,150 | 0 | 72 | 22,880 | 0 | 656,346 | 2,829 |
| TotalStack · Total Optimization | 4 | 10 · 20,000 | 79,770,931 | 35,454,400 | 4,072 | 32 | 2.25 | 421,574 | 28 | 84 | 31,680 | 396,313 | 602,007 | 2,518 |
| TotalStack · Elite Preservation | 4 | 10 · 20,000 | 79,770,931 | 35,454,400 | 4,072 | 32 | 2.25 | 421,574 | 28 | 84 | 31,680 | 396,313 | 602,007 | 2,518 |
| Complete optimization · burn-saver | 4 | 10 · 19,996 | 81,548,470 | 34,920,400 | 11,072 | 15 | 2.34 | 541,060 | 11 | 48 | 24,120 | 482,810 | 1,205,643 | 3,381 |
| Complete optimization · sweet-spot | 4 | 10 · 19,996 | 89,486,680 | 35,230,000 | 9,424 | 24 | 2.54 | 476,719 | 20 | 60 | 28,200 | 487,913 | 1,022,696 | 3,173 |
| Complete optimization · more-mercs | 4 | 10 · 19,996 | 93,588,286 | 35,230,000 | 10,272 | 26 | 2.66 | 597,802 | 22 | 60 | 28,200 | 604,494 | 1,032,046 | 3,319 |
| Complete optimization · steady-max | 4 | 9 · 19,983 | 97,759,924 | 36,432,700 | 14,232 | 32 | 2.68 | 543,725 | 28 | 57 | 28,200 | 521,221 | 1,147,440 | 3,467 |
| Complete optimization · all-in | 4 | 9 · 19,983 | 103,197,710 | 37,309,700 | 17,888 | 34 | 2.77 | 594,278 | 30 | 48 | 27,040 | 561,315 | 1,429,491 | 3,816 |

**Matched spend — NO STOP FITS** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 79,770,931 for 35,454,400 silver, 4,072 gold, 31,680 coins, 32 burned, 10,622,220 s. **No stop of ours fits inside it**, over gold.

**Over all 3 of their comparable marches**, the bar dominates **0** at matched spend; none of its stops fits inside any of them.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✗, burned ✗, gold ✗, dragonCoins ✗, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.229** ✓, damage a hired soldier **1.525** ✓, damage a monster **2.375** ✓. All three are at or above the goal. And the fourth currency, where one is spent: **damage a dragon coin 1.516** ✓ — the monsters’ own price (S-102).

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (average damage) | 4 | 8 · 4,000 | 8,461,931 | 6,157,800 | 1,352 | 24 | 1.37 | 245,689 | 24 | 0 | 0 | 245,689 | 0 | 8,461,931 |
| Tier ladder · Generate (best worst case) | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (damage per silver) | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (damage per gold) | 4 | 8 · 4,000 | 3,953,022 | 6,083,200 | 312 | 6 | 0.65 | 216,804 | 6 | 0 | 0 | 216,804 | 0 | 3,953,022 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 8 · 4,000 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Troops first · all types | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (average damage) | 4 | 8 · 4,000 | 8,518,588 | 6,157,800 | 1,336 | 24 | 1.38 | 256,063 | 24 | 0 | 0 | 256,063 | 0 | 8,518,588 |
| Troops first · Generate (best worst case) | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (damage per silver) | 4 | 8 · 4,000 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (damage per gold) | 4 | 8 · 4,000 | 3,953,022 | 6,083,200 | 312 | 6 | 0.65 | 216,804 | 6 | 0 | 0 | 216,804 | 0 | 3,953,022 |
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
| Complete optimization · sweet-spot | 4 | 8 · 4,000 | 8,530,502 | 6,087,200 | 1,176 | 21 | 1.40 | 265,255 | 21 | 0 | 0 | 265,255 | 0 | 8,530,502 |
| Complete optimization · all-in | 4 | 8 · 3,999 | 8,985,057 | 6,085,400 | 1,336 | 24 | 1.48 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,985,057 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · M’s Preservation` at 8,762,880 for 6,084,400 silver, 1,344 gold, 0 coins, 24 burned, 1,370,160 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 8,985,057 — **+2.5 %**.

**Over all 11 of their comparable marches**, the bar dominates **11** at matched spend; the one it does worst on is `TotalStack · optimize (as captured, repeated)` at +2.5 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.072** ✓, damage a hired soldier **1.013** ✓, damage a monster —. All three are at or above the goal.

## 2026-09-17 export, its setup (7 000 leadership)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 7,000 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 108,291 | 93 | 0 | 0 | 108,291 | 0 | 18,589,604 |
| Tier ladder · Generate (average damage) | 4 | 3 · 7,000 | 24,032,714 | 14,192,200 | 6,656 | 93 | 1.69 | 180,940 | 93 | 0 | 0 | 180,940 | 0 | 24,032,714 |
| Tier ladder · Generate (best worst case) | 4 | 3 · 7,000 | 24,309,346 | 15,270,400 | 6,656 | 93 | 1.59 | 186,144 | 93 | 0 | 0 | 186,144 | 0 | 24,309,346 |
| Tier ladder · Generate (damage per silver) | 4 | 2 · 7,000 | 20,680,875 | 10,900,200 | 6,656 | 93 | 1.90 | 155,621 | 93 | 0 | 0 | 155,621 | 0 | 20,680,875 |
| Tier ladder · Generate (damage per gold) | 4 | 6 · 7,000 | 9,266,624 | 11,597,600 | 960 | 8 | 0.80 | 461,890 | 8 | 0 | 0 | 461,890 | 0 | 9,266,624 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 7,000 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 108,291 | 93 | 0 | 0 | 108,291 | 0 | 18,589,604 |
| Troops first · all types | 4 | 7 · 7,000 | 23,341,980 | 10,957,600 | 4,064 | 55 | 2.13 | 339,326 | 55 | 0 | 0 | 339,326 | 0 | 23,341,980 |
| Troops first · Generate (average damage) | 4 | 3 · 7,000 | 24,634,972 | 14,192,200 | 6,200 | 86 | 1.74 | 209,894 | 86 | 0 | 0 | 209,894 | 0 | 24,634,972 |
| Troops first · Generate (best worst case) | 4 | 3 · 7,000 | 24,768,804 | 13,274,000 | 5,728 | 79 | 1.87 | 234,700 | 79 | 0 | 0 | 234,700 | 0 | 24,768,804 |
| Troops first · Generate (damage per silver) | 4 | 5 · 7,000 | 24,089,345 | 11,008,600 | 4,352 | 59 | 2.19 | 326,282 | 59 | 0 | 0 | 326,282 | 0 | 24,089,345 |
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
| Complete optimization · burn-saver | 4 | 7 · 6,359 | 15,315,363 | 10,187,600 | 2,112 | 26 | 1.50 | 355,600 | 26 | 0 | 0 | 355,600 | 0 | 15,315,363 |
| Complete optimization · silver-saver | 4 | 7 · 5,086 | 16,259,746 | 8,670,400 | 2,496 | 32 | 1.88 | 349,573 | 32 | 0 | 0 | 349,573 | 0 | 16,259,746 |
| Complete optimization · sweet-spot | 4 | 7 · 6,975 | 19,031,865 | 10,907,600 | 2,760 | 35 | 1.74 | 357,360 | 35 | 0 | 0 | 357,360 | 0 | 19,031,865 |
| Complete optimization · steady-max | 4 | 7 · 6,999 | 24,300,665 | 10,959,000 | 4,000 | 55 | 2.22 | 340,059 | 55 | 0 | 0 | 340,059 | 0 | 24,300,665 |
| Complete optimization · all-in | 4 | 4 · 6,998 | 24,945,884 | 12,717,200 | 5,360 | 73 | 1.96 | 253,556 | 73 | 0 | 0 | 253,556 | 0 | 24,945,884 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 13,742,586 for 16,016,000 silver, 3,472 gold, 0 coins, 51 burned, 7,459,200 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 19,031,865 — **+38.5 %**.

**Over all 9 of their comparable marches**, the bar dominates **6** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at +38.5 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✗, burned ✗, gold ✗, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **2.209** ✓, damage a hired soldier **1.306** ✓, damage a monster —. All three are at or above the goal.

## 2026-09-17 export, 12 000 leadership

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 12,000 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 162,142 | 93 | 0 | 0 | 162,142 | 0 | 28,513,298 |
| Tier ladder · Generate (average damage) | 4 | 7 · 12,000 | 30,640,313 | 20,399,600 | 6,656 | 93 | 1.50 | 214,130 | 93 | 0 | 0 | 214,130 | 0 | 30,640,313 |
| Tier ladder · Generate (best worst case) | 4 | 4 · 12,000 | 31,818,133 | 23,752,400 | 6,656 | 93 | 1.34 | 236,141 | 93 | 0 | 0 | 236,141 | 0 | 31,818,133 |
| Tier ladder · Generate (damage per silver) | 4 | 7 · 12,000 | 29,868,277 | 19,595,000 | 6,656 | 93 | 1.52 | 191,270 | 93 | 0 | 0 | 191,270 | 0 | 29,868,277 |
| Tier ladder · Generate (damage per gold) | 4 | 3 · 12,000 | 13,843,312 | 26,177,600 | 960 | 8 | 0.53 | 230,945 | 8 | 0 | 0 | 230,945 | 0 | 13,843,312 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 12,000 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 162,142 | 93 | 0 | 0 | 162,142 | 0 | 28,513,298 |
| Troops first · all types | 4 | 7 · 12,000 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| Troops first · Generate (average damage) | 4 | 5 · 12,000 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 293,769 | 85 | 0 | 0 | 293,769 | 0 | 33,277,720 |
| Troops first · Generate (best worst case) | 4 | 5 · 12,000 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 293,769 | 85 | 0 | 0 | 293,769 | 0 | 33,277,720 |
| Troops first · Generate (damage per silver) | 4 | 7 · 12,000 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| Troops first · Generate (damage per gold) | 4 | 3 · 12,000 | 13,843,312 | 26,177,600 | 960 | 8 | 0.53 | 230,945 | 8 | 0 | 0 | 230,945 | 0 | 13,843,312 |
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
| Complete optimization · burn-saver | 4 | 7 · 11,194 | 22,404,202 | 17,808,900 | 2,408 | 30 | 1.26 | 369,197 | 30 | 0 | 0 | 369,197 | 0 | 22,404,202 |
| Complete optimization · silver-saver | 4 | 7 · 6,347 | 21,273,264 | 12,129,500 | 3,056 | 48 | 1.75 | 297,347 | 48 | 0 | 0 | 297,347 | 0 | 21,273,264 |
| Complete optimization · sweet-spot | 4 | 7 · 11,999 | 34,445,770 | 18,793,200 | 4,824 | 67 | 1.83 | 333,911 | 67 | 0 | 0 | 333,911 | 0 | 34,445,770 |
| Complete optimization · steady-max | 4 | 5 · 11,646 | 34,617,571 | 20,720,700 | 5,784 | 82 | 1.67 | 290,661 | 82 | 0 | 0 | 290,661 | 0 | 34,617,571 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (averageDamage)` at 22,894,812 for 21,785,600 silver, 2,848 gold, 0 coins, 40 burned, 7,191,120 s. Our best stop inside that budget (5 %) is `Complete optimization · burn-saver` at 22,404,202 — **-2.1 %**.

**Over all 9 of their comparable marches**, the bar dominates **3** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -2.1 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.830** ✓, damage a hired soldier **1.186** ✓, damage a monster —. All three are at or above the goal.

## live account of 2026-09-18 (one hired type, 20 000 leadership)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Tier ladder · Generate (average damage) | 4 | 2 · 20,000 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 20,000 | 26,302,610 | 40,886,800 | 2,016 | 30 | 0.64 | 196,846 | 30 | 0 | 0 | 196,846 | 0 | 26,302,610 |
| Tier ladder · Generate (damage per silver) | 4 | 6 · 20,000 | 24,618,792 | 29,954,400 | 2,016 | 30 | 0.82 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 24,618,792 |
| Tier ladder · Generate (damage per gold) | 4 | 6 · 20,000 | 26,302,610 | 40,886,800 | 2,016 | 30 | 0.64 | 196,846 | 30 | 0 | 0 | 196,846 | 0 | 26,302,610 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Troops first · all types | 4 | 7 · 20,000 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Troops first · Generate (average damage) | 4 | 2 · 20,000 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Troops first · Generate (best worst case) | 4 | 6 · 20,000 | 26,302,610 | 40,886,800 | 2,016 | 30 | 0.64 | 196,846 | 30 | 0 | 0 | 196,846 | 0 | 26,302,610 |
| Troops first · Generate (damage per silver) | 4 | 6 · 20,000 | 24,618,792 | 29,954,400 | 2,016 | 30 | 0.82 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 24,618,792 |
| Troops first · Generate (damage per gold) | 4 | 6 · 20,000 | 26,302,610 | 40,886,800 | 2,016 | 30 | 0.64 | 196,846 | 30 | 0 | 0 | 196,846 | 0 | 26,302,610 |
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
| Complete optimization · sweet-spot | 4 | 7 · 19,955 | 28,384,288 | 30,928,400 | 1,728 | 24 | 0.92 | 323,582 | 24 | 0 | 0 | 323,582 | 0 | 28,384,288 |
| Complete optimization · steady-max | 4 | 7 · 19,955 | 28,727,202 | 30,179,700 | 1,904 | 28 | 0.95 | 307,403 | 28 | 0 | 0 | 307,403 | 0 | 28,727,202 |
| Complete optimization · all-in | 4 | 7 · 19,955 | 29,743,332 | 30,928,400 | 2,016 | 30 | 0.96 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,743,332 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 29,222,440 for 31,335,200 silver, 2,016 gold, 0 coins, 30 burned, 7,625,940 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 29,743,332 — **+1.8 %**.

**Over all 9 of their comparable marches**, the bar dominates **9** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +1.8 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.033** ✓, damage a hired soldier **1.064** ✓, damage a monster —. All three are at or above the goal.

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 11,000 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 17,749 | 874 | 0 | 0 | 17,749 | 0 | 28,558,757 |
| Tier ladder · Generate (average damage) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 36,832,597 |
| Tier ladder · Generate (best worst case) | 4 | 1 · 11,000 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 36,832,597 |
| Tier ladder · Generate (damage per silver) | 4 | 7 · 11,000 | 29,121,831 | 16,643,200 | 62,736 | 874 | 1.75 | 19,722 | 874 | 0 | 0 | 19,722 | 0 | 29,121,831 |
| Tier ladder · Generate (damage per gold) | 4 | 3 · 11,000 | 12,880,420 | 23,945,600 | 480 | 4 | 0.54 | 243,219 | 4 | 0 | 0 | 243,219 | 0 | 12,880,420 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 11,000 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 17,749 | 874 | 0 | 0 | 17,749 | 0 | 28,558,757 |
| Troops first · all types | 4 | 7 · 11,000 | 28,435,661 | 17,179,200 | 5,176 | 78 | 1.66 | 250,529 | 78 | 0 | 0 | 250,529 | 0 | 28,435,661 |
| Troops first · Generate (average damage) | 4 | **none** | 8,250,197 | 0 | 62,736 | 874 | — | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 8,250,197 |
| Troops first · Generate (best worst case) | 4 | 1 · 11,000 | 47,025,017 | 30,800,000 | 29,944 | 420 | 1.53 | 111,964 | 420 | 0 | 0 | 111,964 | 0 | 47,025,017 |
| Troops first · Generate (damage per silver) | 4 | 5 · 11,000 | 30,119,192 | 16,096,600 | 5,792 | 83 | 1.87 | 274,164 | 83 | 0 | 0 | 274,164 | 0 | 30,119,192 |
| Troops first · Generate (damage per gold) | 4 | 3 · 11,000 | 12,880,420 | 23,945,600 | 480 | 4 | 0.54 | 243,219 | 4 | 0 | 0 | 243,219 | 0 | 12,880,420 |
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
| Complete optimization · burn-saver | 4 | 7 · 9,486 | 20,575,534 | 15,338,400 | 2,296 | 32 | 1.34 | 332,927 | 32 | 0 | 0 | 332,927 | 0 | 20,575,534 |
| Complete optimization · silver-saver | 4 | 7 · 6,921 | 21,392,382 | 12,306,900 | 3,032 | 48 | 1.74 | 289,672 | 48 | 0 | 0 | 289,672 | 0 | 21,392,382 |
| Complete optimization · sweet-spot | 4 | 7 · 10,992 | 29,479,912 | 17,073,600 | 4,056 | 61 | 1.73 | 301,665 | 61 | 0 | 0 | 301,665 | 0 | 29,479,912 |
| Complete optimization · steady-max | 4 | 7 · 10,998 | 34,151,512 | 17,181,600 | 5,040 | 76 | 1.99 | 300,023 | 76 | 0 | 0 | 300,023 | 0 | 34,151,512 |
| Complete optimization · all-in | 4 | 5 · 10,905 | 34,784,291 | 19,233,100 | 6,272 | 89 | 1.81 | 271,725 | 89 | 0 | 0 | 271,725 | 0 | 34,784,291 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under Total Optimization (averageDamage)` at 36,832,597 for 30,800,000 silver, 30,616 gold, 0 coins, 428 burned, 18,480,000 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 34,784,291 — **-5.6 %**.

**Over all 9 of their comparable marches**, the bar dominates **6** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (averageDamage)` at -5.6 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 9 of their 9 marches are dominated, against the bar's 6. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.028** ✓, damage a hired soldier **1.202** ✓, damage a monster —. All three are at or above the goal.

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

The plan offers 4 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 4,975 | 16,014,855 | 7,351,600 | 62,736 | 874 | 2.18 | 11,050 | 874 | 0 | 0 | 11,050 | 0 | 16,014,855 |
| Tier ladder · Generate (average damage) | 4 | 4 · 4,975 | 19,767,678 | 10,575,600 | 62,736 | 874 | 1.87 | 14,538 | 874 | 0 | 0 | 14,538 | 0 | 19,767,678 |
| Tier ladder · Generate (best worst case) | 4 | 4 · 4,975 | 19,767,678 | 10,575,600 | 62,736 | 874 | 1.87 | 14,538 | 874 | 0 | 0 | 14,538 | 0 | 19,767,678 |
| Tier ladder · Generate (damage per silver) | 4 | 7 · 4,975 | 16,100,367 | 7,227,000 | 62,736 | 874 | 2.23 | 11,791 | 874 | 0 | 0 | 11,791 | 0 | 16,100,367 |
| Tier ladder · Generate (damage per gold) | 4 | 7 · 4,975 | 6,250,712 | 7,793,200 | 480 | 4 | 0.80 | 439,926 | 4 | 0 | 0 | 439,926 | 0 | 6,250,712 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 8 · 4,975 | 16,014,855 | 7,351,600 | 62,736 | 874 | 2.18 | 11,050 | 874 | 0 | 0 | 11,050 | 0 | 16,014,855 |
| Troops first · all types | 4 | 8 · 4,975 | 13,629,206 | 7,351,600 | 2,064 | 28 | 1.85 | 338,016 | 28 | 0 | 0 | 338,016 | 0 | 13,629,206 |
| Troops first · Generate (average damage) | 4 | **none** | 8,157,173 | 0 | 62,736 | 874 | — | 9,333 | 874 | 0 | 0 | 9,333 | 0 | 8,157,173 |
| Troops first · Generate (best worst case) | 4 | 1 · 4,974 | 23,501,117 | 13,927,200 | 15,992 | 224 | 1.69 | 104,916 | 224 | 0 | 0 | 104,916 | 0 | 23,501,117 |
| Troops first · Generate (damage per silver) | 4 | 1 · 4,974 | 16,183,954 | 7,391,400 | 6,408 | 91 | 2.19 | 157,392 | 91 | 0 | 0 | 157,392 | 0 | 16,183,954 |
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
| Complete optimization · burn-saver | 4 | 8 · 3,583 | 9,450,218 | 5,777,000 | 1,288 | 19 | 1.64 | 325,749 | 19 | 0 | 0 | 325,749 | 0 | 9,450,218 |
| Complete optimization · sweet-spot | 4 | 7 · 4,975 | 15,598,199 | 7,684,400 | 2,440 | 37 | 2.03 | 300,662 | 37 | 0 | 0 | 300,662 | 0 | 15,598,199 |
| Complete optimization · steady-max | 4 | 4 · 4,974 | 18,213,822 | 8,666,100 | 4,360 | 61 | 2.10 | 235,327 | 61 | 0 | 0 | 235,327 | 0 | 18,213,822 |
| Complete optimization · all-in | 4 | 3 · 4,975 | 18,750,522 | 11,241,200 | 7,848 | 111 | 1.67 | 133,301 | 111 | 0 | 0 | 133,301 | 0 | 18,750,522 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under Total Optimization (averageDamage)` at 23,501,117 for 13,927,200 silver, 15,992 gold, 0 coins, 224 burned, 8,356,320 s. Our best stop inside that budget (5 %) is `Complete optimization · all-in` at 18,750,522 — **-20.2 %**.

**Over all 9 of their comparable marches**, the bar dominates **0** at matched spend; the one it does worst on is `TotalStack · priority search under M’s (damagePerSilver)` at -26.9 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 1 of their 9 marches are dominated, against the bar's 0. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✗.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.000** ✓, damage a hired soldier **1.089** ✓, damage a monster —. All three are at or above the goal.

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 4,975 | 43,923,310 | 7,770,800 | 60,704 | 398 | 5.65 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 43,923,310 |
| Tier ladder · Generate (average damage) | 4 | 1 · 4,974 | 45,064,115 | 13,927,200 | 56,160 | 445 | 3.24 | 72,224 | 425 | 20 | 0 | 51,881 | 504,504 | 45,064,115 |
| Tier ladder · Generate (best worst case) | 4 | 1 · 4,974 | 50,184,710 | 13,927,200 | 60,704 | 398 | 3.60 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 50,184,710 |
| Tier ladder · Generate (damage per silver) | 4 | 1 · 4,974 | 40,493,370 | 5,968,800 | 60,704 | 398 | 6.78 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 40,493,370 |
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
| Complete optimization · burn-saver | 4 | 7 · 4,573 | 8,820,632 | 7,251,100 | 1,448 | 16 | 1.22 | 257,643 | 12 | 4 | 0 | 260,363 | 249,480 | 8,820,632 |
| Complete optimization · silver-saver | 4 | 2 · 2,820 | 8,393,455 | 6,773,900 | 5,480 | 34 | 1.24 | 159,825 | 30 | 4 | 0 | 125,695 | 415,800 | 8,393,455 |
| Complete optimization · sweet-spot | 4 | 4 · 4,975 | 15,862,148 | 9,850,300 | 6,344 | 52 | 1.61 | 208,337 | 48 | 4 | 0 | 170,258 | 665,280 | 15,862,148 |
| Complete optimization · more-mercs | 4 | 1 · 4,882 | 31,715,963 | 13,734,000 | 30,120 | 218 | 2.31 | 145,486 | 204 | 14 | 0 | 125,033 | 443,520 | 31,715,963 |
| Complete optimization · steady-max | 4 | 1 · 4,974 | 49,190,513 | 13,927,200 | 51,192 | 344 | 3.53 | 142,996 | 324 | 20 | 0 | 118,285 | 543,312 | 49,190,513 |

**Matched spend — SHORT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 49,229,801 for 7,794,000 silver, 59,176 gold, 0 coins, 374 burned, 1,896,300 s. Our best stop inside that budget (5 %) is `Complete optimization · burn-saver` at 8,820,632 — **-82.1 %**.

**Over all 3 of their comparable marches**, the bar dominates **0** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at -82.1 %.

**The six markers**, our best against theirs on each alone: damage ✗, silver ✓, burned ✓, gold ✓, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.559** ✗, damage a hired soldier **2.204** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 4,975 | 5,904,308 | 7,770,800 | 11,120 | 156 | 0.76 | 0 | 156 | 0 | 0 | 0 | 0 | 5,904,308 |
| Tier ladder · Generate (average damage) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (best worst case) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (damage per silver) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (damage per gold) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 4,975 | 5,904,308 | 7,770,800 | 11,120 | 156 | 0.76 | 0 | 156 | 0 | 0 | 0 | 0 | 5,904,308 |
| Troops first · all types | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · Generate (average damage) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Troops first · Generate (best worst case) | 4 | 1 · 4,974 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Troops first · Generate (damage per silver) | 4 | 1 · 4,974 | 22,893,427 | 11,938,600 | 10,184 | 142 | 1.92 | 161,221 | 142 | 0 | 0 | 161,221 | 0 | 22,893,427 |
| Troops first · Generate (damage per gold) | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · allow damage trades | 4 | 7 · 4,975 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| TotalStack · M’s Preservation | 4 | 7 · 4,975 | 5,002,716 | 7,797,200 | 0 | 0 | 0.64 | 0 | 0 | 0 | 0 | 0 | 0 | 5,002,716 |
| TotalStack · Total Optimization | 4 | 7 · 4,975 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 0 | 156 | 0 | 0 | 0 | 0 | 6,422,616 |
| TotalStack · Elite Preservation | 4 | 7 · 4,975 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 0 | 156 | 0 | 0 | 0 | 0 | 6,422,616 |
| Complete optimization · burn-saver | 4 | 7 · 4,975 | 6,943,378 | 7,733,000 | 392 | 6 | 0.90 | 296,617 | 6 | 0 | 0 | 296,617 | 0 | 6,943,378 |
| Complete optimization · silver-saver | 4 | 5 · 3,918 | 7,561,467 | 7,313,300 | 848 | 12 | 1.03 | 318,189 | 12 | 0 | 0 | 318,189 | 0 | 7,561,467 |
| Complete optimization · sweet-spot | 4 | 5 · 4,964 | 9,367,909 | 8,747,300 | 1,016 | 15 | 1.07 | 306,324 | 15 | 0 | 0 | 306,324 | 0 | 9,367,909 |
| Complete optimization · more-mercs | 4 | 2 · 4,892 | 14,142,349 | 10,354,100 | 3,944 | 57 | 1.37 | 164,062 | 57 | 0 | 0 | 164,062 | 0 | 14,142,349 |
| Complete optimization · steady-max | 4 | 1 · 4,780 | 23,589,127 | 13,043,800 | 10,480 | 148 | 1.81 | 159,386 | 148 | 0 | 0 | 159,386 | 0 | 23,589,127 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 6,422,616 for 7,794,000 silver, 11,120 gold, 0 coins, 156 burned, 1,896,300 s. Our best stop inside that budget (5 %) is `Complete optimization · silver-saver` at 7,561,467 — **+17.7 %**.

**Over all 3 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +17.7 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **2.195** ✓, damage a hired soldier —, damage a monster —. All three are at or above the goal.

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

The plan offers 5 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 5,100 | 6,045,332 | 7,964,000 | 2,960 | 42 | 0.76 | 0 | 42 | 0 | 0 | 0 | 0 | 6,045,332 |
| Tier ladder · Generate (average damage) | 4 | 2 · 5,100 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| Tier ladder · Generate (best worst case) | 4 | 2 · 5,100 | 12,017,757 | 11,249,600 | 2,960 | 42 | 1.07 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 12,017,757 |
| Tier ladder · Generate (damage per silver) | 4 | 2 · 5,100 | 9,877,414 | 8,097,600 | 2,960 | 42 | 1.22 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 9,877,414 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 5,100 | 12,017,757 | 11,249,600 | 2,960 | 42 | 1.07 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 12,017,757 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 7 · 5,100 | 6,045,332 | 7,964,000 | 2,960 | 42 | 0.76 | 0 | 42 | 0 | 0 | 0 | 0 | 6,045,332 |
| Troops first · all types | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · Generate (average damage) | 4 | 2 · 5,100 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| Troops first · Generate (best worst case) | 4 | 3 · 5,100 | 12,074,020 | 11,102,400 | 2,912 | 41 | 1.09 | 159,818 | 41 | 0 | 0 | 159,818 | 0 | 12,074,020 |
| Troops first · Generate (damage per silver) | 4 | 2 · 5,100 | 10,001,873 | 8,087,800 | 2,632 | 38 | 1.24 | 174,138 | 38 | 0 | 0 | 174,138 | 0 | 10,001,873 |
| Troops first · Generate (damage per gold) | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · allow damage trades | 4 | 7 · 5,100 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| TotalStack · M’s Preservation | 4 | 7 · 5,100 | 5,128,468 | 7,992,800 | 0 | 0 | 0.64 | 0 | 0 | 0 | 0 | 0 | 0 | 5,128,468 |
| TotalStack · Total Optimization | 4 | 7 · 5,100 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 0 | 42 | 0 | 0 | 0 | 0 | 6,585,128 |
| TotalStack · Elite Preservation | 4 | 7 · 5,100 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 0 | 42 | 0 | 0 | 0 | 0 | 6,585,128 |
| Complete optimization · burn-saver | 4 | 6 · 4,580 | 6,580,946 | 7,681,400 | 408 | 6 | 0.86 | 307,403 | 6 | 0 | 0 | 307,403 | 0 | 6,580,946 |
| Complete optimization · silver-saver | 4 | 7 · 4,640 | 7,388,536 | 7,201,600 | 576 | 8 | 1.03 | 323,582 | 8 | 0 | 0 | 323,582 | 0 | 7,388,536 |
| Complete optimization · sweet-spot | 4 | 5 · 5,095 | 10,462,502 | 8,940,500 | 1,272 | 18 | 1.17 | 318,189 | 18 | 0 | 0 | 318,189 | 0 | 10,462,502 |
| Complete optimization · steady-max | 4 | 3 · 4,645 | 11,058,844 | 9,897,900 | 2,504 | 35 | 1.12 | 183,055 | 35 | 0 | 0 | 183,055 | 0 | 11,058,844 |
| Complete optimization · all-in | 4 | 3 · 5,100 | 11,589,922 | 10,706,600 | 2,888 | 41 | 1.08 | 158,634 | 41 | 0 | 0 | 158,634 | 0 | 11,589,922 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 6,585,128 for 7,990,400 silver, 2,960 gold, 0 coins, 42 burned, 1,944,480 s. Our best stop inside that budget (5 %) is `Complete optimization · silver-saver` at 7,388,536 — **+12.2 %**.

**Over all 3 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +12.2 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins =, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.420** ✓, damage a hired soldier —, damage a monster —. All three are at or above the goal.

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 5,225 | 6,739,348 | 7,990,800 | 1,952 | 29 | 0.84 | 0 | 29 | 16 | 3,840 | 0 | 126,953 | 1,755 |
| Tier ladder · Generate (average damage) | 4 | 5 · 5,225 | 8,444,893 | 9,547,400 | 1,952 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Tier ladder · Generate (best worst case) | 4 | 5 · 5,225 | 8,444,893 | 9,547,400 | 1,952 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 682,004 | 145,600 | 1,952 | 29 | 4.68 | 0 | 29 | 12 | 2,080 | 0 | 56,834 | 328 |
| Tier ladder · Generate (damage per gold) | 4 | 5 · 5,225 | 8,444,893 | 9,547,400 | 1,952 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 5 · 5,225 | 8,145,045 | 9,413,000 | 1,952 | 29 | 0.87 | 105,962 | 29 | 12 | 1,920 | 105,962 | 104,563 | 4,242 |
| Troops first · all types | 4 | 8 · 5,225 | 7,673,968 | 7,990,800 | 1,056 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| Troops first · Generate (average damage) | 4 | 5 · 5,225 | 8,647,583 | 9,142,200 | 1,872 | 28 | 0.95 | 105,324 | 28 | 16 | 3,840 | 105,324 | 102,779 | 2,252 |
| Troops first · Generate (best worst case) | 4 | 5 · 5,225 | 8,647,583 | 9,142,200 | 1,872 | 28 | 0.95 | 105,324 | 28 | 16 | 3,840 | 105,324 | 102,779 | 2,252 |
| Troops first · Generate (damage per silver) | 4 | **none** | 682,004 | 145,600 | 1,952 | 29 | 4.68 | 0 | 29 | 12 | 2,080 | 0 | 56,834 | 328 |
| Troops first · Generate (damage per gold) | 4 | 8 · 5,225 | 7,809,640 | 7,890,000 | 1,056 | 16 | 0.99 | 104,118 | 16 | 8 | 2,400 | 104,118 | 270,864 | 3,254 |
| Troops first · Generate (damage per dragon coin) | 4 | 5 · 5,225 | 8,266,034 | 8,887,000 | 1,808 | 27 | 0.93 | 105,473 | 27 | 12 | 1,920 | 105,473 | 110,985 | 4,305 |
| Troops first · allow damage trades | 4 | 8 · 5,225 | 7,673,968 | 7,990,800 | 1,056 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| Tier ladder · monsters after troops | 4 | 8 · 5,225 | 6,739,348 | 7,990,800 | 1,952 | 29 | 0.84 | 0 | 29 | 16 | 3,840 | 0 | 126,953 | 1,755 |
| Troops first · monsters after mercenaries | 4 | 8 · 5,225 | 7,673,968 | 7,990,800 | 1,056 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| TotalStack · M’s Preservation | 4 | 8 · 5,225 | 5,187,364 | 7,862,000 | 0 | 0 | 0.66 | 0 | 0 | 12 | 1,920 | 0 | 130,251 | 2,702 |
| TotalStack · Total Optimization | 4 | 8 · 5,225 | 6,779,808 | 7,989,200 | 1,952 | 29 | 0.85 | 0 | 29 | 16 | 3,840 | 0 | 129,633 | 1,766 |
| TotalStack · Elite Preservation | 4 | 8 · 5,225 | 6,779,808 | 7,989,200 | 1,952 | 29 | 0.85 | 0 | 29 | 16 | 3,840 | 0 | 129,633 | 1,766 |
| Complete optimization · silver-saver | 4 | 8 · 2,031 | 4,919,095 | 4,431,600 | 480 | 7 | 1.11 | 131,856 | 7 | 16 | 3,840 | 131,856 | 116,603 | 1,281 |
| Complete optimization · sweet-spot | 4 | 7 · 5,225 | 8,250,940 | 8,344,200 | 1,320 | 19 | 0.99 | 109,005 | 19 | 16 | 3,840 | 109,005 | 118,153 | 2,149 |
| Complete optimization · steady-max | 4 | 6 · 5,221 | 8,443,234 | 8,706,000 | 1,584 | 25 | 0.97 | 100,404 | 25 | 16 | 3,840 | 100,404 | 110,928 | 2,199 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · Elite Preservation` at 6,779,808 for 7,989,200 silver, 1,952 gold, 3,840 coins, 29 burned, 1,745,160 s. Our best stop inside that budget (5 %) is `Complete optimization · sweet-spot` at 8,250,940 — **+21.7 %**.

**Over all 3 of their comparable marches**, the bar dominates **2** at matched spend; the one it does worst on is `TotalStack · Total Optimization` at +21.7 %.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins ✗, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.308** ✓, damage a hired soldier —, damage a monster **0.911** ✗. **Below the goal: damage a monster** — a discrepancy for the owner, not a pin. And the fourth currency, where one is spent: **damage a dragon coin 1.245** ✓ — the monsters’ own price (S-102).

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

The plan offers 3 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8 · 5,200 | 8,572,792 | 7,989,600 | 2,192 | 33 | 1.07 | 0 | 33 | 20 | 4,320 | 0 | 187,737 | 1,984 |
| Tier ladder · Generate (average damage) | 4 | 2 · 5,200 | 11,780,261 | 11,670,000 | 2,192 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Tier ladder · Generate (best worst case) | 4 | 2 · 5,200 | 11,780,261 | 11,670,000 | 2,192 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 1,436,400 | 235,200 | 2,192 | 33 | 6.11 | 0 | 33 | 12 | 3,360 | 0 | 119,700 | 428 |
| Tier ladder · Generate (damage per gold) | 4 | 2 · 5,200 | 11,780,261 | 11,670,000 | 2,192 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 2 · 5,200 | 11,159,327 | 11,628,000 | 2,192 | 33 | 0.96 | 150,515 | 33 | 12 | 3,360 | 150,515 | 149,625 | 3,321 |
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
| Complete optimization · burn-saver | 4 | 8 · 3,577 | 8,211,151 | 6,132,900 | 352 | 5 | 1.34 | 317,110 | 5 | 17 | 3,960 | 317,110 | 194,993 | 2,074 |
| Complete optimization · sweet-spot | 4 | 8 · 5,200 | 11,485,771 | 8,092,800 | 544 | 8 | 1.42 | 422,679 | 8 | 23 | 5,760 | 422,679 | 159,797 | 1,994 |
| Complete optimization · steady-max | 4 | 6 · 5,196 | 11,756,170 | 8,698,800 | 808 | 14 | 1.35 | 265,799 | 14 | 20 | 4,320 | 265,799 | 175,220 | 2,721 |

**Matched spend — BEAT** (owner, 2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest comparable march is `TotalStack · priority search under M’s (damagePerSilver)` at 11,235,848 for 8,929,600 silver, 896 gold, 4,320 coins, 16 burned, 2,584,080 s. Our best stop inside that budget (5 %) is `Complete optimization · steady-max` at 11,756,170 — **+4.6 %**.

**Over all 9 of their comparable marches**, the bar dominates **5** at matched spend; the one it does worst on is `TotalStack · priority search under Total Optimization (averageDamage)` at -22.0 %.

**But the damage is reachable**: counting every algorithm the app offers — the sizers, their switches and all five objectives — 7 of their 9 marches are dominated, against the bar's 5. The gap between those two numbers is the plan failing to reach what this engine can already do, not the engine losing.

**The six markers**, our best against theirs on each alone: damage ✓, silver ✓, burned ✗, gold ✗, dragonCoins ✓, seconds ✓.

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.307** ✓, damage a hired soldier **0.968** ✗, damage a monster **1.430** ✓. **Below the goal: damage a hired soldier** — a discrepancy for the owner, not a pin. And the fourth currency, where one is spent: **damage a dragon coin 1.282** ✓ — the monsters’ own price (S-102).

## his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

The plan offers 2 stops.

| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 7 · 5,600 | 12,275,806 | 9,589,600 | 19,573 | 6 | 1.28 | 367,227 | 6 | 56 | 11,680 | 367,227 | 19,054 | 1,051 |
| Tier ladder · Generate (average damage) | 4 | 6 · 5,600 | 16,431,370 | 10,107,200 | 19,573 | 6 | 1.63 | 367,227 | 6 | 56 | 11,680 | 367,227 | 164,725 | 1,407 |
| Tier ladder · Generate (best worst case) | 4 | 6 · 5,600 | 16,431,370 | 10,107,200 | 19,573 | 6 | 1.63 | 367,227 | 6 | 56 | 11,680 | 367,227 | 164,725 | 1,407 |
| Tier ladder · Generate (damage per silver) | 4 | **none** | 3,652,854 | 739,200 | 19,829 | 6 | 4.94 | 122,409 | 6 | 52 | 10,560 | 122,409 | 56,123 | 346 |
| Tier ladder · Generate (damage per gold) | 4 | 7 · 5,600 | 6,647,020 | 8,772,000 | 181 | 6 | 0.76 | 244,818 | 6 | 0 | 0 | 244,818 | 0 | 6,647,020 |
| Tier ladder · Generate (damage per dragon coin) | 4 | 6 · 5,600 | 16,431,370 | 10,107,200 | 19,573 | 6 | 1.63 | 367,227 | 6 | 56 | 11,680 | 367,227 | 164,725 | 1,407 |
| Troops first · all types | 4 | 7 · 5,600 | 17,013,922 | 9,477,600 | 18,397 | 6 | 1.80 | 367,227 | 6 | 48 | 10,080 | 367,227 | 200,676 | 1,688 |
| Troops first · Generate (average damage) | 4 | 7 · 5,600 | 17,013,922 | 9,477,600 | 18,397 | 6 | 1.80 | 367,227 | 6 | 48 | 10,080 | 367,227 | 200,676 | 1,688 |
| Troops first · Generate (best worst case) | 4 | 7 · 5,600 | 17,013,922 | 9,477,600 | 18,397 | 6 | 1.80 | 367,227 | 6 | 48 | 10,080 | 367,227 | 200,676 | 1,688 |
| Troops first · Generate (damage per silver) | 4 | **none** | 3,652,854 | 739,200 | 19,829 | 6 | 4.94 | 122,409 | 6 | 52 | 10,560 | 122,409 | 56,123 | 346 |
| Troops first · Generate (damage per gold) | 4 | 7 · 5,600 | 6,647,020 | 8,772,000 | 181 | 6 | 0.76 | 244,818 | 6 | 0 | 0 | 244,818 | 0 | 6,647,020 |
| Troops first · Generate (damage per dragon coin) | 4 | 7 · 5,600 | 8,699,020 | 8,928,800 | 4,817 | 6 | 0.97 | 244,818 | 6 | 8 | 2,240 | 244,818 | 256,500 | 3,883 |
| Troops first · allow damage trades | 4 | 7 · 5,600 | 17,013,922 | 9,477,600 | 18,397 | 6 | 1.80 | 367,227 | 6 | 48 | 10,080 | 367,227 | 200,676 | 1,688 |
| Tier ladder · monsters after troops | 4 | 7 · 5,600 | 17,013,922 | 9,477,600 | 18,397 | 6 | 1.80 | 367,227 | 6 | 48 | 10,080 | 367,227 | 200,676 | 1,688 |
| Troops first · monsters after mercenaries | 4 | 7 · 5,600 | 10,671,881 | 9,099,600 | 7,178 | 6 | 1.17 | 244,818 | 6 | 22 | 4,680 | 244,818 | 182,948 | 2,280 |
| Complete optimization · sweet-spot | 4 | 7 · 5,598 | 16,842,084 | 9,480,000 | 18,384 | 4 | 1.78 | 489,636 | 4 | 48 | 10,080 | 489,636 | 200,676 | 1,671 |
| Complete optimization · all-in | 4 | 7 · 5,598 | 17,086,508 | 9,479,200 | 18,397 | 6 | 1.80 | 367,227 | 6 | 48 | 10,080 | 367,227 | 200,676 | 1,695 |

**Matched spend — not measured**: no comparable march from a calculator outside this repo on this army, so there is nothing to be better or worse than.

No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal (*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not measured here.


## The standing at matched spend

The reading the owner’s definition of *beating* another calculator reduces to (2026-09-21: *"beat means using constrained resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*), asked of every army above: **their hardest comparable march, our best stop that spends no more of any of the four costs within 5 %, and the damage between them.** The ratio floors under each table are the derived reading — a stop that costs no more and hits harder is more efficient on all of them at once.

| army | verdict | their hardest march | our stop | Δ | of their marches | none fits | any algorithm |
|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | **beat** | TotalStack · Elite Preservation | Complete optimization · sweet-spot | +1.4 % | 3/3 | 0 | 3/3 |
| first-run army, Bear V ×2 (20 000 leadership) | **beat** | TotalStack · Elite Preservation | Complete optimization · sweet-spot | +1.4 % | 3/3 | 0 | 3/3 |
| first-run army, Bear V ×3 (20 000 leadership) | **short** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · all-in | -11.1 % | 8/9 | 0 | 8/9 |
| first-run army, Bear V ×10 (20 000 leadership) | **short** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · all-in | -5.3 % | 4/9 | 0 | 4/9 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | **short** | TotalStack · M’s Preservation | Complete optimization · all-in | -0.3 % | 7/9 | 0 | 7/9 |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | **no stop fits** | TotalStack · Elite Preservation | — (over gold) | — | 0/3 | 3 | 0/3 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | **beat** | TotalStack · M’s Preservation | Complete optimization · all-in | +2.5 % | 11/11 | 0 | 11/11 |
| 2026-09-17 export, its setup (7 000 leadership) | **beat** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · sweet-spot | +38.5 % | 6/9 | 3 | 6/9 |
| 2026-09-17 export, 12 000 leadership | **short** | TotalStack · priority search under M’s (averageDamage) | Complete optimization · burn-saver | -2.1 % | 3/9 | 2 | 3/9 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | **beat** | TotalStack · Elite Preservation | Complete optimization · all-in | +1.8 % | 9/9 | 0 | 9/9 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | **short** | TotalStack · priority search under Total Optimization (averageDamage) | Complete optimization · all-in | -5.6 % | 6/9 | 0 | 9/9 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | **short** | TotalStack · priority search under Total Optimization (averageDamage) | Complete optimization · all-in | -20.2 % | 0/9 | 0 | 1/9 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | **short** | TotalStack · Elite Preservation | Complete optimization · burn-saver | -82.1 % | 0/3 | 0 | 0/3 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | **beat** | TotalStack · Elite Preservation | Complete optimization · silver-saver | +17.7 % | 2/3 | 1 | 2/3 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | **beat** | TotalStack · Elite Preservation | Complete optimization · silver-saver | +12.2 % | 2/3 | 1 | 2/3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | **beat** | TotalStack · Elite Preservation | Complete optimization · sweet-spot | +21.7 % | 2/3 | 1 | 2/3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | **beat** | TotalStack · priority search under M’s (damagePerSilver) | Complete optimization · steady-max | +4.6 % | 5/9 | 2 | 7/9 |

The last column is the diagnostic, never a verdict: how many of their marches **any** algorithm the app offers would have dominated — the sizers, their switches and all five objectives. An army where it is ahead of the column beside it is an army where the damage is provably reachable and the bar is simply not reaching it.

### The six markers

Our best stop against their best comparable march **on each marker alone**, counted over the armies above. Read them as floors rather than as the goal: winning a marker by fielding a tiny march is not winning, which is what the table above is for.

| marker | direction | we win | tie | we lose |
|---|---|---|---|---|
| damage | max | 11 | 0 | 6 |
| silver | min | 15 | 0 | 2 |
| burned | min | 6 | 4 | 7 |
| gold | min | 7 | 3 | 7 |
| dragonCoins | min | 1 | 14 | 2 |
| seconds | min | 9 | 0 | 8 |

### Where the time goes, and where a clock binds

Not asserted, and deliberately — a timing floor would be red on a slow machine. It is here because it decides what a speed-up is **worth**. `planCampaign` on an army marked *bound* stopped because it ran out of clock rather than out of ideas, so making it faster buys a **better plan**; everywhere else a speed-up buys the same plan sooner and nothing more.

| army | planner | of its budget | bound? | search, all calls | a call | of its budget |
|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 481 ms | 1 % | no | 15,026 ms over 40 | 376 ms | 5 % |
| first-run army, Bear V ×2 (20 000 leadership) | 348 ms | 1 % | no | 14,215 ms over 40 | 355 ms | 4 % |
| first-run army, Bear V ×3 (20 000 leadership) | 436 ms | 1 % | no | 15,438 ms over 40 | 386 ms | 5 % |
| first-run army, Bear V ×10 (20 000 leadership) | 416 ms | 1 % | no | 13,546 ms over 40 | 339 ms | 4 % |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 882 ms | 2 % | no | 13,915 ms over 40 | 348 ms | 4 % |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 14,879 ms | 37 % | no | 123,281 ms over 40 | 3,082 ms | 39 % |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 1,114 ms | 3 % | no | 14,406 ms over 40 | 360 ms | 5 % |
| 2026-09-17 export, its setup (7 000 leadership) | 2,561 ms | 6 % | no | 5,998 ms over 40 | 150 ms | 2 % |
| 2026-09-17 export, 12 000 leadership | 2,445 ms | 6 % | no | 6,244 ms over 40 | 156 ms | 2 % |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 160 ms | 0 % | no | 638 ms over 40 | 16 ms | 0 % |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 1,819 ms | 5 % | no | 5,988 ms over 40 | 150 ms | 2 % |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 1,641 ms | 4 % | no | 12,256 ms over 40 | 306 ms | 4 % |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 1,062 ms | 3 % | no | 2,571 ms over 40 | 64 ms | 1 % |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 226 ms | 1 % | no | 560 ms over 40 | 14 ms | 0 % |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 132 ms | 0 % | no | 559 ms over 40 | 14 ms | 0 % |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 3,970 ms | 10 % | no | 9,480 ms over 40 | 237 ms | 3 % |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 4,817 ms | 12 % | no | 9,048 ms over 40 | 226 ms | 3 % |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 3,874 ms | 10 % | no | 12,421 ms over 40 | 311 ms | 4 % |

**0 of 18** armies leave the planner budget-bound, and the priority search is bound on none of them either.

**So on this table a speed-up buys latency and not answer quality**, and that is worth stating plainly because it is the opposite of what the engine felt like. The one army measured to fill its clock is the **20 000-dominance camp** (experiment 129: 40,843–40,934 ms against a 40,000 ms cap), and it is not a scenario here *precisely because* it does not converge — which is what W3 is for. Until W3 registers it, "faster means better answers" is a claim about **one army, and it is not on this table**.

The other reading: the priority search costs far more of a run than the planner does — 78 s over forty calls against 9.6 s on the monster camp — and within a call the **sizer** is 85–90 % of it (experiment 131). A run that wants to be shorter goes after `stacker.ts`.

**9 of 17** armies are beaten at matched spend on their hardest comparable march; 1 have no stop of ours inside their budget at all.

