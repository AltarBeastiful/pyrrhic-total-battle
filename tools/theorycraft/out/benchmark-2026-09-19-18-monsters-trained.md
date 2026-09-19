# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired stacks cost to revive (the gold column since S-90, 2026-09-18).

The last six columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the chunks of ten told apart into **hired soldiers** and **monsters** — monster mercenaries and dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins the monsters cost to recruit again, and damage a soldier, damage a monster and damage a dragon coin beside damage a hired unit. A campaign that spent none of one kind reads its ratio at `damage / 1`, exactly as `a hired` has always done.

**`hired burned` is the `authority` pool alone since S-102** (2026-09-19; the owner: *"apart from mercs, they [monsters] can be trained just like troops"*). A mercenary is hired and revived for gold, so it is a stock a march does not get back; a dominance monster is trained again ten at a time for silver, queue time and dragon coins, so it is a **price** and it leaves the burn. `soldiers burned + monsters burned = hired burned` therefore holds on every army that houses no dominance unit — all but the monster camp below — and on that one the difference is exactly the dominance chunks, which the dragon-coin column prices.

Under each table, the **goal line** (S-101): the plan’s best stop against the captured `TotalStack · Total Optimization` row on the owner’s own three readings — damage a silver, damage a hired soldier and damage a monster — with `✓` at or above 1.0 and `✗` below it. The floors pinned on those three are today’s measured figures, so a `✗` is a discrepancy to judge and not a failing test.

Run: 2026-09-19T10:29:12.262Z, commit (working tree)

No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads `registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes a proposal for the owner to register.

## first-run army, Bear V ×1 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 18,189,008 | 0 | 1 | 0 | 18,189,008 | 18,189,008 | 18,189,008 |
| Tier ladder · Generate (average damage) | 4 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 18,535,192 | 0 | 1 | 0 | 18,535,192 | 18,535,192 | 18,535,192 |
| Troops first · all types | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 18,189,008 | 0 | 1 | 0 | 18,189,008 | 18,189,008 | 18,189,008 |
| Troops first · Generate (average damage) | 4 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 18,535,192 | 0 | 1 | 0 | 18,535,192 | 18,535,192 | 18,535,192 |
| TotalStack · M’s Preservation | 4 | 17,582,756 | 32,538,400 | 0 | 1 | 0.54 | 17,582,756 | 0 | 1 | 0 | 17,582,756 | 17,582,756 | 17,582,756 |
| TotalStack · Total Optimization | 4 | 18,217,808 | 32,529,600 | 0 | 1 | 0.56 | 18,217,808 | 0 | 1 | 0 | 18,217,808 | 18,217,808 | 18,217,808 |
| TotalStack · Elite Preservation | 4 | 18,217,808 | 32,529,600 | 0 | 1 | 0.56 | 18,217,808 | 0 | 1 | 0 | 18,217,808 | 18,217,808 | 18,217,808 |
| Complete optimization · sweet-spot | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 18,189,008 | 0 | 1 | 0 | 18,189,008 | 18,189,008 | 18,189,008 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier **0.998** ✗, damage a monster **0.998** ✗. **Below the goal: damage a silver, damage a hired soldier, damage a monster** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×2 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 9,206,704 | 0 | 2 | 0 | 18,413,408 | 9,206,704 | 18,413,408 |
| Tier ladder · Generate (average damage) | 4 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 9,304,996 | 0 | 2 | 0 | 18,609,992 | 9,304,996 | 18,609,992 |
| Troops first · all types | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 9,206,704 | 0 | 2 | 0 | 18,413,408 | 9,206,704 | 18,413,408 |
| Troops first · Generate (average damage) | 4 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 9,304,996 | 0 | 2 | 0 | 18,609,992 | 9,304,996 | 18,609,992 |
| TotalStack · M’s Preservation | 4 | 17,807,156 | 32,538,400 | 160 | 2 | 0.55 | 8,903,578 | 0 | 2 | 0 | 17,807,156 | 8,903,578 | 17,807,156 |
| TotalStack · Total Optimization | 4 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 9,221,104 | 0 | 2 | 0 | 18,442,208 | 9,221,104 | 18,442,208 |
| TotalStack · Elite Preservation | 4 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 9,221,104 | 0 | 2 | 0 | 18,442,208 | 9,221,104 | 18,442,208 |
| Complete optimization · sweet-spot | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 9,206,704 | 0 | 2 | 0 | 18,413,408 | 9,206,704 | 18,413,408 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier **0.998** ✗, damage a monster **0.998** ✗. **Below the goal: damage a silver, damage a hired soldier, damage a monster** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×3 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 6,250,003 | 0 | 3 | 0 | 18,750,008 | 6,250,003 | 18,750,008 |
| Tier ladder · Generate (average damage) | 4 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 6,240,731 | 0 | 3 | 0 | 18,722,192 | 6,240,731 | 18,722,192 |
| Troops first · all types | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 6,250,003 | 0 | 3 | 0 | 18,750,008 | 6,250,003 | 18,750,008 |
| Troops first · Generate (average damage) | 4 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 6,240,731 | 0 | 3 | 0 | 18,722,192 | 6,240,731 | 18,722,192 |
| TotalStack · M’s Preservation | 4 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 6,340,972 | 0 | 3 | 0 | 19,022,916 | 6,340,972 | 19,022,916 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 21,427,548 | 56,000,000 | 480 | 3 | 0.38 | 7,142,516 | 0 | 3 | 0 | 21,427,548 | 7,142,516 | 21,427,548 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 6,340,972 | 0 | 3 | 0 | 19,022,916 | 6,340,972 | 19,022,916 |
| TotalStack · Total Optimization | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 6,259,603 | 0 | 3 | 0 | 18,778,808 | 6,259,603 | 18,778,808 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 18,741,088 | 56,000,000 | 480 | 3 | 0.33 | 6,247,029 | 0 | 3 | 0 | 18,741,088 | 6,247,029 | 18,741,088 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 6,259,603 | 0 | 3 | 0 | 18,778,808 | 6,259,603 | 18,778,808 |
| TotalStack · Elite Preservation | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 6,259,603 | 0 | 3 | 0 | 18,778,808 | 6,259,603 | 18,778,808 |
| Complete optimization · sweet-spot | 4 | 18,413,408 | 32,525,600 | 0 | 3 | 0.57 | 6,137,803 | 0 | 3 | 0 | 18,413,408 | 6,137,803 | 18,413,408 |
| Complete optimization · all-in | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 6,250,003 | 0 | 3 | 0 | 18,750,008 | 6,250,003 | 18,750,008 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier **0.998** ✗, damage a monster **0.998** ✗. **Below the goal: damage a silver, damage a hired soldier, damage a monster** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×10 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 5,288,144 | 0 | 4 | 0 | 21,152,576 | 5,288,144 | 21,152,576 |
| Tier ladder · Generate (average damage) | 4 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 4,942,348 | 0 | 4 | 0 | 19,769,392 | 4,942,348 | 19,769,392 |
| Troops first · all types | 4 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 5,192,402 | 0 | 4 | 0 | 20,769,608 | 5,192,402 | 20,769,608 |
| Troops first · Generate (average damage) | 4 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 4,942,348 | 0 | 4 | 0 | 19,769,392 | 4,942,348 | 19,769,392 |
| TotalStack · M’s Preservation | 4 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 5,384,923 | 0 | 4 | 0 | 21,539,692 | 5,384,923 | 21,539,692 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 22,474,748 | 56,000,000 | 4,800 | 4 | 0.40 | 5,618,687 | 0 | 4 | 0 | 22,474,748 | 5,618,687 | 22,474,748 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 5,384,923 | 0 | 4 | 0 | 21,539,692 | 5,384,923 | 21,539,692 |
| TotalStack · Total Optimization | 4 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 5,199,602 | 0 | 4 | 0 | 20,798,408 | 5,199,602 | 20,798,408 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 19,788,288 | 56,000,000 | 4,800 | 4 | 0.35 | 4,947,072 | 0 | 4 | 0 | 19,788,288 | 4,947,072 | 19,788,288 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 5,199,602 | 0 | 4 | 0 | 20,798,408 | 5,199,602 | 20,798,408 |
| TotalStack · Elite Preservation | 4 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 5,290,572 | 0 | 4 | 0 | 21,162,288 | 5,290,572 | 21,162,288 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 5,290,572 | 0 | 4 | 0 | 21,162,288 | 5,290,572 | 21,162,288 |
| Complete optimization · sweet-spot | 4 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 5,192,402 | 0 | 4 | 0 | 20,769,608 | 5,192,402 | 20,769,608 |
| Complete optimization · all-in | 4 | 20,893,375 | 36,013,400 | 4,800 | 4 | 0.58 | 5,223,344 | 0 | 4 | 0 | 20,893,375 | 5,223,344 | 20,893,375 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier **1.005** ✓, damage a monster **1.005** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 26,655,281 | 32,525,600 | 2,016 | 30 | 0.82 | 888,509 | 30 | 0 | 0 | 888,509 | 26,655,281 | 26,655,281 |
| Tier ladder · Generate (average damage) | 4 | 29,942,175 | 33,291,200 | 2,016 | 30 | 0.90 | 998,073 | 30 | 0 | 0 | 998,073 | 29,942,175 | 29,942,175 |
| Troops first · all types | 4 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 1,029,808 | 29 | 0 | 0 | 1,029,808 | 29,864,429 | 29,864,429 |
| Troops first · Generate (average damage) | 4 | 30,054,424 | 32,908,400 | 2,008 | 30 | 0.91 | 1,001,814 | 30 | 0 | 0 | 1,001,814 | 30,054,424 | 30,054,424 |
| TotalStack · M’s Preservation | 4 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 1,042,113 | 29 | 0 | 0 | 1,042,113 | 30,221,279 | 30,221,279 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 29,758,471 | 34,075,200 | 2,016 | 30 | 0.87 | 991,949 | 30 | 0 | 0 | 991,949 | 29,758,471 | 29,758,471 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 1,042,113 | 29 | 0 | 0 | 1,042,113 | 30,221,279 | 30,221,279 |
| TotalStack · Total Optimization | 4 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 1,030,801 | 29 | 0 | 0 | 1,030,801 | 29,893,229 | 29,893,229 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 972,267 | 30 | 0 | 0 | 972,267 | 29,168,019 | 29,168,019 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 1,030,801 | 29 | 0 | 0 | 1,030,801 | 29,893,229 | 29,893,229 |
| TotalStack · Elite Preservation | 4 | 26,679,309 | 32,529,600 | 2,016 | 30 | 0.82 | 889,310 | 30 | 0 | 0 | 889,310 | 26,679,309 | 26,679,309 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 972,267 | 30 | 0 | 0 | 972,267 | 29,168,019 | 29,168,019 |
| Complete optimization · sweet-spot | 4 | 28,655,444 | 32,525,600 | 1,760 | 25 | 0.88 | 1,146,218 | 25 | 0 | 0 | 1,146,218 | 28,655,444 | 28,655,444 |
| Complete optimization · steady-max | 4 | 29,691,713 | 32,525,600 | 1,928 | 28 | 0.91 | 1,060,418 | 28 | 0 | 0 | 1,060,418 | 29,691,713 | 29,691,713 |
| Complete optimization · all-in | 4 | 29,841,879 | 33,291,200 | 2,016 | 30 | 0.90 | 994,729 | 30 | 0 | 0 | 994,729 | 29,841,879 | 29,841,879 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.993** ✗, damage a hired soldier **1.112** ✓, damage a monster **0.998** ✗. **Below the goal: damage a silver, damage a monster** — a discrepancy for the owner, not a pin.

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 79,635,913 | 35,450,400 | 49,056 | 34 | 2.25 | 2,342,233 | 30 | 84 | 31,680 | 2,654,530 | 948,047 | 2,514 |
| Tier ladder · Generate (average damage) | 4 | 103,438,192 | 37,939,200 | 51,184 | 34 | 2.73 | 3,042,300 | 30 | 46 | 26,200 | 3,447,940 | 2,248,656 | 3,948 |
| Troops first · all types | 4 | 82,845,061 | 35,450,400 | 48,992 | 33 | 2.34 | 2,510,456 | 29 | 84 | 31,680 | 2,856,726 | 986,251 | 2,615 |
| Troops first · Generate (average damage) | 4 | 104,626,942 | 37,290,800 | 49,888 | 34 | 2.81 | 3,077,263 | 30 | 47 | 26,760 | 3,487,565 | 2,226,105 | 3,910 |
| Complete optimization · silver-saver | 4 | 61,696,768 | 25,764,300 | 45,928 | 18 | 2.39 | 3,427,598 | 14 | 84 | 31,680 | 4,406,912 | 734,485 | 1,947 |
| Complete optimization · sweet-spot | 4 | 77,280,595 | 35,450,400 | 46,752 | 24 | 2.18 | 3,220,025 | 20 | 84 | 31,680 | 3,864,030 | 920,007 | 2,439 |
| Complete optimization · more-mercs | 4 | 78,871,786 | 35,450,400 | 47,600 | 26 | 2.22 | 3,033,530 | 22 | 84 | 31,680 | 3,585,081 | 938,950 | 2,490 |
| Complete optimization · steady-max | 4 | 95,348,743 | 35,458,800 | 48,728 | 32 | 2.69 | 2,979,648 | 28 | 84 | 31,080 | 3,405,312 | 1,135,104 | 3,068 |
| Complete optimization · all-in | 4 | 82,845,061 | 35,450,400 | 48,992 | 33 | 2.34 | 2,510,456 | 29 | 84 | 31,680 | 2,856,726 | 986,251 | 2,615 |

No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal (*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not measured here.

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 352,636 | 24 | 0 | 0 | 352,636 | 8,463,273 | 8,463,273 |
| Tier ladder · Generate (average damage) | 4 | 8,461,931 | 6,157,800 | 1,352 | 24 | 1.37 | 352,580 | 24 | 0 | 0 | 352,580 | 8,461,931 | 8,461,931 |
| Troops first · all types | 4 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 354,997 | 24 | 0 | 0 | 354,997 | 8,519,930 | 8,519,930 |
| Troops first · Generate (average damage) | 4 | 8,518,588 | 6,157,800 | 1,336 | 24 | 1.38 | 354,941 | 24 | 0 | 0 | 354,941 | 8,518,588 | 8,518,588 |
| TotalStack · optimize (as captured, repeated) | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 365,120 | 24 | 0 | 0 | 365,120 | 8,762,880 | 8,762,880 |
| Kai’s calculator · extract (as captured, repeated) | 4 | 8,616,241 | 6,203,200 | 1,544 | 27 | 1.39 | 319,120 | 27 | 0 | 0 | 319,120 | 8,616,241 | 8,616,241 |
| TotalStack · M’s Preservation | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 365,120 | 24 | 0 | 0 | 365,120 | 8,762,880 | 8,762,880 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 8,750,417 | 6,086,400 | 1,352 | 24 | 1.44 | 364,601 | 24 | 0 | 0 | 364,601 | 8,750,417 | 8,750,417 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 365,120 | 24 | 0 | 0 | 365,120 | 8,762,880 | 8,762,880 |
| TotalStack · Total Optimization | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 349,194 | 24 | 0 | 0 | 349,194 | 8,380,649 | 8,380,649 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 349,194 | 24 | 0 | 0 | 349,194 | 8,380,649 | 8,380,649 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 349,194 | 24 | 0 | 0 | 349,194 | 8,380,649 | 8,380,649 |
| TotalStack · Elite Preservation | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 344,266 | 24 | 0 | 0 | 344,266 | 8,262,390 | 8,262,390 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 344,266 | 24 | 0 | 0 | 344,266 | 8,262,390 | 8,262,390 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 344,266 | 24 | 0 | 0 | 344,266 | 8,262,390 | 8,262,390 |
| Complete optimization · sweet-spot | 4 | 8,084,653 | 6,083,200 | 1,192 | 19 | 1.33 | 425,508 | 19 | 0 | 0 | 425,508 | 8,084,653 | 8,084,653 |
| Complete optimization · steady-max | 4 | 8,222,546 | 6,083,200 | 1,176 | 21 | 1.35 | 391,550 | 21 | 0 | 0 | 391,550 | 8,222,546 | 8,222,546 |
| Complete optimization · all-in | 4 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 354,997 | 24 | 0 | 0 | 354,997 | 8,519,930 | 8,519,930 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.017** ✓, damage a hired soldier **1.219** ✓, damage a monster **1.017** ✓. All three are at or above the goal.

## 2026-09-17 export, its setup (7 000 leadership)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 199,888 | 93 | 0 | 0 | 199,888 | 18,589,604 | 18,589,604 |
| Tier ladder · Generate (average damage) | 4 | 24,032,714 | 14,192,200 | 6,656 | 93 | 1.69 | 258,416 | 93 | 0 | 0 | 258,416 | 24,032,714 | 24,032,714 |
| Troops first · all types | 4 | 23,341,980 | 10,957,600 | 4,064 | 55 | 2.13 | 424,400 | 55 | 0 | 0 | 424,400 | 23,341,980 | 23,341,980 |
| Troops first · Generate (average damage) | 4 | 24,634,972 | 14,192,200 | 6,200 | 86 | 1.74 | 286,453 | 86 | 0 | 0 | 286,453 | 24,634,972 | 24,634,972 |
| TotalStack · M’s Preservation | 4 | 11,013,524 | 10,972,800 | 960 | 16 | 1.00 | 688,345 | 16 | 0 | 0 | 688,345 | 11,013,524 | 11,013,524 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 13,742,586 | 16,016,000 | 3,472 | 51 | 0.86 | 269,462 | 51 | 0 | 0 | 269,462 | 13,742,586 | 13,742,586 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 7,807,482 | 8,400,000 | 3,472 | 51 | 0.93 | 153,088 | 51 | 0 | 0 | 153,088 | 7,807,482 | 7,807,482 |
| TotalStack · Total Optimization | 4 | 11,007,500 | 10,965,600 | 960 | 16 | 1.00 | 687,969 | 16 | 0 | 0 | 687,969 | 11,007,500 | 11,007,500 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7,807,482 | 19,600,000 | 3,472 | 51 | 0.40 | 153,088 | 51 | 0 | 0 | 153,088 | 7,807,482 | 7,807,482 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 13,253,664 | 12,696,000 | 1,632 | 24 | 1.04 | 552,236 | 24 | 0 | 0 | 552,236 | 13,253,664 | 13,253,664 |
| TotalStack · Elite Preservation | 4 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 166,413 | 51 | 0 | 0 | 166,413 | 8,487,048 | 8,487,048 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 166,413 | 51 | 0 | 0 | 166,413 | 8,487,048 | 8,487,048 |
| Complete optimization · silver-saver | 4 | 16,115,314 | 8,695,000 | 2,544 | 32 | 1.85 | 503,604 | 32 | 0 | 0 | 503,604 | 16,115,314 | 16,115,314 |
| Complete optimization · sweet-spot | 4 | 18,796,348 | 10,906,900 | 2,760 | 35 | 1.72 | 537,039 | 35 | 0 | 0 | 537,039 | 18,796,348 | 18,796,348 |
| Complete optimization · more-mercs | 4 | 20,079,262 | 10,581,400 | 3,072 | 44 | 1.90 | 456,347 | 44 | 0 | 0 | 456,347 | 20,079,262 | 20,079,262 |
| Complete optimization · steady-max | 4 | 22,770,620 | 10,957,600 | 4,000 | 55 | 2.08 | 414,011 | 55 | 0 | 0 | 414,011 | 22,770,620 | 22,770,620 |
| Complete optimization · all-in | 4 | 23,619,920 | 15,179,600 | 6,608 | 92 | 1.56 | 256,738 | 92 | 0 | 0 | 256,738 | 23,619,920 | 23,619,920 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **2.070** ✓, damage a hired soldier **0.781** ✗, damage a monster **2.146** ✓. **Below the goal: damage a hired soldier** — a discrepancy for the owner, not a pin.

## 2026-09-17 export, 12 000 leadership

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 306,595 | 93 | 0 | 0 | 306,595 | 28,513,298 | 28,513,298 |
| Tier ladder · Generate (average damage) | 4 | 30,640,313 | 20,399,600 | 6,656 | 93 | 1.50 | 329,466 | 93 | 0 | 0 | 329,466 | 30,640,313 | 30,640,313 |
| Troops first · all types | 4 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 467,905 | 70 | 0 | 0 | 467,905 | 32,753,338 | 32,753,338 |
| Troops first · Generate (average damage) | 4 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 391,503 | 85 | 0 | 0 | 391,503 | 33,277,720 | 33,277,720 |
| TotalStack · M’s Preservation | 4 | 18,971,864 | 18,808,800 | 1,696 | 24 | 1.01 | 790,494 | 24 | 0 | 0 | 790,494 | 18,971,864 | 18,971,864 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 572,370 | 40 | 0 | 0 | 572,370 | 22,894,812 | 22,894,812 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 572,370 | 40 | 0 | 0 | 572,370 | 22,894,812 | 22,894,812 |
| TotalStack · Total Optimization | 4 | 18,833,644 | 18,800,000 | 1,664 | 24 | 1.00 | 784,735 | 24 | 0 | 0 | 784,735 | 18,833,644 | 18,833,644 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 568,846 | 40 | 0 | 0 | 568,846 | 22,753,836 | 22,753,836 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 568,846 | 40 | 0 | 0 | 568,846 | 22,753,836 | 22,753,836 |
| TotalStack · Elite Preservation | 4 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 285,321 | 51 | 0 | 0 | 285,321 | 14,551,348 | 14,551,348 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7,807,482 | 33,600,000 | 3,472 | 51 | 0.23 | 153,088 | 51 | 0 | 0 | 153,088 | 7,807,482 | 7,807,482 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 285,321 | 51 | 0 | 0 | 285,321 | 14,551,348 | 14,551,348 |
| Complete optimization · silver-saver | 4 | 22,531,695 | 12,539,600 | 3,272 | 48 | 1.80 | 469,410 | 48 | 0 | 0 | 469,410 | 22,531,695 | 22,531,695 |
| Complete optimization · sweet-spot | 4 | 31,546,458 | 18,790,400 | 4,824 | 67 | 1.68 | 470,843 | 67 | 0 | 0 | 470,843 | 31,546,458 | 31,546,458 |
| Complete optimization · steady-max | 4 | 31,963,845 | 21,035,600 | 5,784 | 82 | 1.52 | 389,803 | 82 | 0 | 0 | 389,803 | 31,963,845 | 31,963,845 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.794** ✓, damage a hired soldier **0.600** ✗, damage a monster **1.697** ✓. **Below the goal: damage a hired soldier** — a discrepancy for the owner, not a pin.

## live account of 2026-09-18 (one hired type, 20 000 leadership)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 843,354 | 30 | 0 | 0 | 843,354 | 25,300,624 | 25,300,624 |
| Tier ladder · Generate (average damage) | 4 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 774,660 | 30 | 0 | 0 | 774,660 | 23,239,806 | 23,239,806 |
| Troops first · all types | 4 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 843,354 | 30 | 0 | 0 | 843,354 | 25,300,624 | 25,300,624 |
| Troops first · Generate (average damage) | 4 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 774,660 | 30 | 0 | 0 | 774,660 | 23,239,806 | 23,239,806 |
| TotalStack · M’s Preservation | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 866,020 | 30 | 0 | 0 | 866,020 | 25,980,608 | 25,980,608 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 866,020 | 30 | 0 | 0 | 866,020 | 25,980,608 | 25,980,608 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 866,020 | 30 | 0 | 0 | 866,020 | 25,980,608 | 25,980,608 |
| TotalStack · Total Optimization | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 | 30 | 0 | 0 | 974,081 | 29,222,440 | 29,222,440 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 | 30 | 0 | 0 | 974,081 | 29,222,440 | 29,222,440 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 | 30 | 0 | 0 | 974,081 | 29,222,440 | 29,222,440 |
| TotalStack · Elite Preservation | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 | 30 | 0 | 0 | 974,081 | 29,222,440 | 29,222,440 |
| Complete optimization · silver-saver | 4 | 20,891,829 | 20,901,800 | 1,544 | 22 | 1.00 | 949,629 | 22 | 0 | 0 | 949,629 | 20,891,829 | 20,891,829 |
| Complete optimization · sweet-spot | 4 | 28,270,883 | 30,516,200 | 1,760 | 25 | 0.93 | 1,130,835 | 25 | 0 | 0 | 1,130,835 | 28,270,883 | 28,270,883 |
| Complete optimization · steady-max | 4 | 28,727,202 | 30,179,700 | 1,904 | 28 | 0.95 | 1,025,972 | 28 | 0 | 0 | 1,025,972 | 28,727,202 | 28,727,202 |
| Complete optimization · all-in | 4 | 29,743,332 | 30,928,400 | 2,016 | 30 | 0.96 | 991,444 | 30 | 0 | 0 | 991,444 | 29,743,332 | 29,743,332 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.072** ✓, damage a hired soldier **1.161** ✓, damage a monster **1.018** ✓. All three are at or above the goal.

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 32,676 | 874 | 0 | 0 | 32,676 | 28,558,757 | 28,558,757 |
| Tier ladder · Generate (average damage) | 4 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 42,143 | 874 | 0 | 0 | 42,143 | 36,832,597 | 36,832,597 |
| Troops first · all types | 4 | 28,435,661 | 17,179,200 | 5,176 | 78 | 1.66 | 364,560 | 78 | 0 | 0 | 364,560 | 28,435,661 | 28,435,661 |
| Troops first · Generate (average damage) | 4 | 8,250,197 | 0 | 62,736 | 874 | — | 9,440 | 874 | 0 | 0 | 9,440 | 8,250,197 | 8,250,197 |
| TotalStack · M’s Preservation | 4 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 445,735 | 74 | 0 | 0 | 445,735 | 32,984,363 | 32,984,363 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 42,630 | 864 | 0 | 0 | 42,630 | 36,832,597 | 36,832,597 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 445,735 | 74 | 0 | 0 | 445,735 | 32,984,363 | 32,984,363 |
| TotalStack · Total Optimization | 4 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 450,458 | 74 | 0 | 0 | 450,458 | 33,333,894 | 33,333,894 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 36,832,597 | 30,800,000 | 30,616 | 428 | 1.20 | 86,057 | 428 | 0 | 0 | 86,057 | 36,832,597 | 36,832,597 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 450,458 | 74 | 0 | 0 | 450,458 | 33,333,894 | 33,333,894 |
| TotalStack · Elite Preservation | 4 | 30,966,094 | 17,233,600 | 62,040 | 864 | 1.80 | 35,840 | 864 | 0 | 0 | 35,840 | 30,966,094 | 30,966,094 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 42,630 | 864 | 0 | 0 | 42,630 | 36,832,597 | 36,832,597 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 22,905,506 | 16,332,000 | 62,136 | 868 | 1.40 | 26,389 | 868 | 0 | 0 | 26,389 | 22,905,506 | 22,905,506 |
| Complete optimization · silver-saver | 4 | 23,474,915 | 13,945,500 | 3,472 | 53 | 1.68 | 442,923 | 53 | 0 | 0 | 442,923 | 23,474,915 | 23,474,915 |
| Complete optimization · sweet-spot | 4 | 28,140,302 | 17,072,400 | 4,056 | 61 | 1.65 | 461,316 | 61 | 0 | 0 | 461,316 | 28,140,302 | 28,140,302 |
| Complete optimization · more-mercs | 4 | 29,851,070 | 17,179,200 | 4,872 | 70 | 1.74 | 426,444 | 70 | 0 | 0 | 426,444 | 29,851,070 | 29,851,070 |
| Complete optimization · steady-max | 4 | 30,693,083 | 17,179,200 | 5,040 | 76 | 1.79 | 403,856 | 76 | 0 | 0 | 403,856 | 30,693,083 | 30,693,083 |
| Complete optimization · all-in | 4 | 31,714,657 | 18,768,000 | 6,192 | 88 | 1.69 | 360,394 | 88 | 0 | 0 | 360,394 | 31,714,657 | 31,714,657 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.924** ✗, damage a hired soldier **1.024** ✓, damage a monster **0.951** ✗. **Below the goal: damage a silver, damage a monster** — a discrepancy for the owner, not a pin.

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 16,014,855 | 7,351,600 | 62,736 | 874 | 2.18 | 18,324 | 874 | 0 | 0 | 18,324 | 16,014,855 | 16,014,855 |
| Tier ladder · Generate (average damage) | 4 | 19,767,678 | 10,575,600 | 62,736 | 874 | 1.87 | 22,617 | 874 | 0 | 0 | 22,617 | 19,767,678 | 19,767,678 |
| Troops first · all types | 4 | 13,629,206 | 7,351,600 | 2,064 | 28 | 1.85 | 486,757 | 28 | 0 | 0 | 486,757 | 13,629,206 | 13,629,206 |
| Troops first · Generate (average damage) | 4 | 8,157,173 | 0 | 62,736 | 874 | — | 9,333 | 874 | 0 | 0 | 9,333 | 8,157,173 | 8,157,173 |
| Complete optimization · sweet-spot | 4 | 15,533,933 | 7,682,800 | 2,440 | 37 | 2.02 | 419,836 | 37 | 0 | 0 | 419,836 | 15,533,933 | 15,533,933 |
| Complete optimization · steady-max | 4 | 17,630,102 | 8,448,400 | 4,120 | 58 | 2.09 | 303,967 | 58 | 0 | 0 | 303,967 | 17,630,102 | 17,630,102 |
| Complete optimization · all-in | 4 | 18,744,735 | 11,240,800 | 7,848 | 111 | 1.67 | 168,871 | 111 | 0 | 0 | 168,871 | 18,744,735 | 18,744,735 |

No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal (*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not measured here.

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 43,923,310 | 7,770,800 | 60,704 | 398 | 5.65 | 110,360 | 372 | 26 | 0 | 118,073 | 1,689,358 | 43,923,310 |
| Tier ladder · Generate (average damage) | 4 | 45,064,115 | 13,927,200 | 56,160 | 445 | 3.24 | 101,268 | 425 | 20 | 0 | 106,033 | 2,253,206 | 45,064,115 |
| Troops first · all types | 4 | 8,921,776 | 7,770,800 | 2,144 | 28 | 1.15 | 318,635 | 24 | 4 | 0 | 371,741 | 2,230,444 | 8,921,776 |
| Troops first · Generate (average damage) | 4 | 50,435,355 | 13,927,200 | 51,872 | 353 | 3.62 | 142,876 | 333 | 20 | 0 | 151,458 | 2,521,768 | 50,435,355 |
| TotalStack · M’s Preservation | 4 | 35,412,012 | 7,797,200 | 60,352 | 260 | 4.54 | 136,200 | 228 | 32 | 0 | 155,316 | 1,106,625 | 35,412,012 |
| TotalStack · Total Optimization | 4 | 49,229,801 | 7,794,000 | 59,176 | 374 | 6.32 | 131,630 | 346 | 28 | 0 | 142,283 | 1,758,207 | 49,229,801 |
| TotalStack · Elite Preservation | 4 | 49,229,801 | 7,794,000 | 59,176 | 374 | 6.32 | 131,630 | 346 | 28 | 0 | 142,283 | 1,758,207 | 49,229,801 |
| Complete optimization · sweet-spot | 4 | 8,980,108 | 7,241,900 | 1,664 | 19 | 1.24 | 472,637 | 15 | 4 | 0 | 598,674 | 2,245,027 | 8,980,108 |
| Complete optimization · more-mercs | 4 | 12,086,359 | 9,849,200 | 5,264 | 37 | 1.23 | 326,658 | 33 | 4 | 0 | 366,253 | 3,021,590 | 12,086,359 |
| Complete optimization · steady-max | 4 | 15,306,859 | 9,849,200 | 6,344 | 52 | 1.55 | 294,363 | 48 | 4 | 0 | 318,893 | 3,826,715 | 15,306,859 |
| Complete optimization · all-in | 4 | 10,899,547 | 6,653,700 | 17,504 | 133 | 1.64 | 81,951 | 125 | 8 | 0 | 87,196 | 1,362,443 | 10,899,547 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.259** ✗, damage a hired soldier **4.208** ✓, damage a monster **2.176** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 5,904,308 | 7,770,800 | 11,120 | 156 | 0.76 | 37,848 | 156 | 0 | 0 | 37,848 | 5,904,308 | 5,904,308 |
| Tier ladder · Generate (average damage) | 4 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 25,012,889 | 25,012,889 |
| Troops first · all types | 4 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 637,578 | 12 | 0 | 0 | 637,578 | 7,650,936 | 7,650,936 |
| Troops first · Generate (average damage) | 4 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 25,012,889 | 25,012,889 |
| TotalStack · M’s Preservation | 4 | 5,002,716 | 7,797,200 | 0 | 0 | 0.64 | 5,002,716 | 0 | 0 | 0 | 5,002,716 | 5,002,716 | 5,002,716 |
| TotalStack · Total Optimization | 4 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 41,171 | 156 | 0 | 0 | 41,171 | 6,422,616 | 6,422,616 |
| TotalStack · Elite Preservation | 4 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 41,171 | 156 | 0 | 0 | 41,171 | 6,422,616 | 6,422,616 |
| Complete optimization · silver-saver | 4 | 7,561,467 | 7,313,300 | 848 | 12 | 1.03 | 630,122 | 12 | 0 | 0 | 630,122 | 7,561,467 | 7,561,467 |
| Complete optimization · sweet-spot | 4 | 9,068,238 | 8,746,700 | 1,016 | 15 | 1.04 | 604,549 | 15 | 0 | 0 | 604,549 | 9,068,238 | 9,068,238 |
| Complete optimization · more-mercs | 4 | 10,294,068 | 10,005,200 | 2,288 | 33 | 1.03 | 311,941 | 33 | 0 | 0 | 311,941 | 10,294,068 | 10,294,068 |
| Complete optimization · steady-max | 4 | 13,842,678 | 10,476,500 | 3,944 | 57 | 1.32 | 242,854 | 57 | 0 | 0 | 242,854 | 13,842,678 | 13,842,678 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.603** ✓, damage a hired soldier **15.305** ✓, damage a monster **2.155** ✓. All three are at or above the goal.

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 6,045,332 | 7,964,000 | 2,960 | 42 | 0.76 | 143,936 | 42 | 0 | 0 | 143,936 | 6,045,332 | 6,045,332 |
| Tier ladder · Generate (average damage) | 4 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 272,049 | 42 | 0 | 0 | 272,049 | 11,426,058 | 11,426,058 |
| Troops first · all types | 4 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 656,059 | 12 | 0 | 0 | 656,059 | 7,872,708 | 7,872,708 |
| Troops first · Generate (average damage) | 4 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 272,049 | 42 | 0 | 0 | 272,049 | 11,426,058 | 11,426,058 |
| TotalStack · M’s Preservation | 4 | 5,128,468 | 7,992,800 | 0 | 0 | 0.64 | 5,128,468 | 0 | 0 | 0 | 5,128,468 | 5,128,468 | 5,128,468 |
| TotalStack · Total Optimization | 4 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 156,789 | 42 | 0 | 0 | 156,789 | 6,585,128 | 6,585,128 |
| TotalStack · Elite Preservation | 4 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 156,789 | 42 | 0 | 0 | 156,789 | 6,585,128 | 6,585,128 |
| Complete optimization · sweet-spot | 4 | 10,156,338 | 9,503,600 | 1,792 | 25 | 1.07 | 406,254 | 25 | 0 | 0 | 406,254 | 10,156,338 | 10,156,338 |
| Complete optimization · more-mercs | 4 | 10,197,781 | 10,729,000 | 2,416 | 34 | 0.95 | 299,935 | 34 | 0 | 0 | 299,935 | 10,197,781 | 10,197,781 |
| Complete optimization · steady-max | 4 | 11,196,175 | 11,037,400 | 2,808 | 39 | 1.01 | 287,081 | 39 | 0 | 0 | 287,081 | 11,196,175 | 11,196,175 |
| Complete optimization · all-in | 4 | 11,585,381 | 11,202,400 | 2,888 | 41 | 1.03 | 282,570 | 41 | 0 | 0 | 282,570 | 11,585,381 | 11,585,381 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.297** ✓, damage a hired soldier **2.591** ✓, damage a monster **1.759** ✓. All three are at or above the goal.

