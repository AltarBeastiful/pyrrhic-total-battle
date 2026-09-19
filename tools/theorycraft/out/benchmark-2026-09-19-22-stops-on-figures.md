# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired stacks cost to revive (the gold column since S-90, 2026-09-18).

**`a hired`, `a soldier` and `a monster` are each that group’s own damage over its own chunks since S-105** (2026-09-19; the owner: *"dmg per hired is still broken: it shows a damage per hired almost above total damage"*). The numerator is the group’s share of the same enemy-first journal the damage column is summed from, so the three are shares of that column. They divided the campaign’s whole damage until this run, which credited a chunk of rare stock with every point the troops struck for.

The last six columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the chunks of ten told apart into **hired soldiers** and **monsters** — monster mercenaries and dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins the monsters cost to recruit again, and damage a soldier, damage a monster and damage a dragon coin beside damage a hired unit. A campaign that spent none of one kind reads its ratio at `damage / 1`, exactly as `a hired` has always done.

**`hired burned` is the `authority` pool alone since S-102** (2026-09-19; the owner: *"apart from mercs, they [monsters] can be trained just like troops"*). A mercenary is hired and revived for gold, so it is a stock a march does not get back; a dominance monster is trained again ten at a time for silver, queue time and dragon coins, so it is a **price** and it leaves the burn. `soldiers burned + monsters burned = hired burned` therefore holds on every army that houses no dominance unit — all but the monster camp below — and on that one the difference is exactly the dominance chunks, which the dragon-coin column prices.

Under each table, the **goal line** (S-101): the plan’s best stop against the captured `TotalStack · Total Optimization` row on the owner’s own three readings — damage a silver, damage a hired soldier and damage a monster — with `✓` at or above 1.0 and `✗` below it. The floors pinned on those three are today’s measured figures, so a `✗` is a discrepancy to judge and not a failing test.

Run: 2026-09-19T17:25:42.310Z, commit (working tree)

No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads `registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes a proposal for the owner to register.

## first-run army, Bear V ×1 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Tier ladder · Generate (average damage) | 4 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 37,400 | 0 | 1 | 0 | 0 | 37,400 | 18,535,192 |
| Troops first · all types | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |
| Troops first · Generate (average damage) | 4 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 37,400 | 0 | 1 | 0 | 0 | 37,400 | 18,535,192 |
| TotalStack · M’s Preservation | 4 | 17,582,756 | 32,538,400 | 0 | 1 | 0.54 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 17,582,756 |
| TotalStack · Total Optimization | 4 | 18,217,808 | 32,529,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,217,808 |
| TotalStack · Elite Preservation | 4 | 18,217,808 | 32,529,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,217,808 |
| Complete optimization · sweet-spot | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 112,200 | 0 | 1 | 0 | 0 | 112,200 | 18,189,008 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.000** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×2 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Tier ladder · Generate (average damage) | 4 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 56,100 | 0 | 2 | 0 | 0 | 56,100 | 18,609,992 |
| Troops first · all types | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |
| Troops first · Generate (average damage) | 4 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 56,100 | 0 | 2 | 0 | 0 | 56,100 | 18,609,992 |
| TotalStack · M’s Preservation | 4 | 17,807,156 | 32,538,400 | 160 | 2 | 0.55 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 17,807,156 |
| TotalStack · Total Optimization | 4 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,442,208 |
| TotalStack · Elite Preservation | 4 | 18,442,208 | 32,529,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,442,208 |
| Complete optimization · sweet-spot | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 168,300 | 0 | 2 | 0 | 0 | 168,300 | 18,413,408 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.000** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×3 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Tier ladder · Generate (average damage) | 4 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,722,192 |
| Troops first · all types | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |
| Troops first · Generate (average damage) | 4 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,722,192 |
| TotalStack · M’s Preservation | 4 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 19,022,916 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 21,427,548 | 56,000,000 | 480 | 3 | 0.38 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 21,427,548 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 19,022,916 |
| TotalStack · Total Optimization | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 18,741,088 | 56,000,000 | 480 | 3 | 0.33 | 74,800 | 0 | 3 | 0 | 0 | 74,800 | 18,741,088 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| TotalStack · Elite Preservation | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,778,808 |
| Complete optimization · sweet-spot | 4 | 18,413,408 | 32,525,600 | 0 | 3 | 0.57 | 112,200 | 0 | 3 | 0 | 0 | 112,200 | 18,413,408 |
| Complete optimization · all-in | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 224,400 | 0 | 3 | 0 | 0 | 224,400 | 18,750,008 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.000** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Bear V ×10 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,152,576 |
| Tier ladder · Generate (average damage) | 4 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,769,392 |
| Troops first · all types | 4 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Troops first · Generate (average damage) | 4 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,769,392 |
| TotalStack · M’s Preservation | 4 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 0 | 0 | 4 | 0 | 0 | 0 | 21,539,692 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 22,474,748 | 56,000,000 | 4,800 | 4 | 0.40 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 22,474,748 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 0 | 0 | 4 | 0 | 0 | 0 | 21,539,692 |
| TotalStack · Total Optimization | 4 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,798,408 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 19,788,288 | 56,000,000 | 4,800 | 4 | 0.35 | 317,900 | 0 | 4 | 0 | 0 | 317,900 | 19,788,288 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,798,408 |
| TotalStack · Elite Preservation | 4 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,162,288 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 0 | 0 | 4 | 0 | 0 | 0 | 21,162,288 |
| Complete optimization · sweet-spot | 4 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 673,200 | 0 | 4 | 0 | 0 | 673,200 | 20,769,608 |
| Complete optimization · all-in | 4 | 20,893,375 | 36,013,400 | 4,800 | 4 | 0.58 | 776,050 | 0 | 4 | 0 | 0 | 776,050 | 20,893,375 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.999** ✗, damage a hired soldier —, damage a monster **1.153** ✓. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 26,655,281 | 32,525,600 | 2,016 | 30 | 0.82 | 250,913 | 30 | 0 | 0 | 250,913 | 0 | 26,655,281 |
| Tier ladder · Generate (average damage) | 4 | 29,942,175 | 33,291,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,942,175 |
| Troops first · all types | 4 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,864,429 |
| Troops first · Generate (average damage) | 4 | 30,054,424 | 32,908,400 | 2,008 | 30 | 0.91 | 404,435 | 30 | 0 | 0 | 404,435 | 0 | 30,054,424 |
| TotalStack · M’s Preservation | 4 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 409,448 | 29 | 0 | 0 | 409,448 | 0 | 30,221,279 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 29,758,471 | 34,075,200 | 2,016 | 30 | 0.87 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,758,471 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 409,448 | 29 | 0 | 0 | 409,448 | 0 | 30,221,279 |
| TotalStack · Total Optimization | 4 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,893,229 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,168,019 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 406,470 | 29 | 0 | 0 | 406,470 | 0 | 29,893,229 |
| TotalStack · Elite Preservation | 4 | 26,679,309 | 32,529,600 | 2,016 | 30 | 0.82 | 250,913 | 30 | 0 | 0 | 250,913 | 0 | 26,679,309 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,168,019 |
| Complete optimization · sweet-spot | 4 | 28,655,444 | 32,525,600 | 1,760 | 25 | 0.88 | 423,145 | 25 | 0 | 0 | 423,145 | 0 | 28,655,444 |
| Complete optimization · steady-max | 4 | 29,691,713 | 32,525,600 | 1,928 | 28 | 0.91 | 414,818 | 28 | 0 | 0 | 414,818 | 0 | 29,691,713 |
| Complete optimization · all-in | 4 | 29,841,879 | 33,291,200 | 2,016 | 30 | 0.90 | 405,874 | 30 | 0 | 0 | 405,874 | 0 | 29,841,879 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.993** ✗, damage a hired soldier **1.041** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 79,635,913 | 35,450,400 | 49,056 | 34 | 2.25 | 287,394 | 30 | 84 | 31,680 | 250,913 | 630,722 | 2,514 |
| Tier ladder · Generate (average damage) | 4 | 103,438,192 | 37,939,200 | 51,184 | 34 | 2.73 | 584,975 | 30 | 46 | 26,200 | 569,471 | 1,483,855 | 3,948 |
| Troops first · all types | 4 | 82,845,061 | 35,450,400 | 48,992 | 33 | 2.34 | 425,201 | 29 | 84 | 31,680 | 406,470 | 630,722 | 2,615 |
| Troops first · Generate (average damage) | 4 | 104,626,942 | 37,290,800 | 49,888 | 34 | 2.81 | 622,813 | 30 | 47 | 26,760 | 601,135 | 1,467,569 | 3,910 |
| TotalStack · M’s Preservation | 4 | 64,727,476 | 34,658,400 | 46,208 | 4 | 1.87 | 645,150 | 0 | 72 | 22,880 | 0 | 656,346 | 2,829 |
| TotalStack · Total Optimization | 4 | 79,770,931 | 35,454,400 | 48,872 | 32 | 2.25 | 421,574 | 28 | 84 | 31,680 | 396,313 | 602,007 | 2,518 |
| TotalStack · Elite Preservation | 4 | 79,770,931 | 35,454,400 | 48,872 | 32 | 2.25 | 421,574 | 28 | 84 | 31,680 | 396,313 | 602,007 | 2,518 |
| Complete optimization · sweet-spot | 4 | 89,196,808 | 35,230,800 | 48,240 | 24 | 2.53 | 476,719 | 20 | 60 | 28,200 | 487,913 | 1,022,696 | 3,163 |
| Complete optimization · more-mercs | 4 | 93,298,414 | 35,230,800 | 49,088 | 26 | 2.65 | 597,802 | 22 | 60 | 28,200 | 604,494 | 1,032,046 | 3,308 |
| Complete optimization · steady-max | 4 | 97,458,367 | 36,436,800 | 48,776 | 32 | 2.67 | 543,725 | 28 | 57 | 28,200 | 521,221 | 1,147,440 | 3,456 |
| Complete optimization · all-in | 4 | 102,971,902 | 37,316,000 | 49,808 | 34 | 2.76 | 594,278 | 30 | 48 | 27,040 | 561,315 | 1,429,491 | 3,808 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.226** ✓, damage a hired soldier **1.525** ✓, damage a monster **2.375** ✓. All three are at or above the goal. And the fourth currency, where one is spent: **damage a dragon coin 1.512** ✓ — the monsters’ own price (S-102).

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,463,273 |
| Tier ladder · Generate (average damage) | 4 | 8,461,931 | 6,157,800 | 1,352 | 24 | 1.37 | 245,689 | 24 | 0 | 0 | 245,689 | 0 | 8,461,931 |
| Troops first · all types | 4 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |
| Troops first · Generate (average damage) | 4 | 8,518,588 | 6,157,800 | 1,336 | 24 | 1.38 | 256,063 | 24 | 0 | 0 | 256,063 | 0 | 8,518,588 |
| TotalStack · optimize (as captured, repeated) | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,762,880 |
| Kai’s calculator · extract (as captured, repeated) | 4 | 8,616,241 | 6,203,200 | 1,544 | 27 | 1.39 | 228,940 | 27 | 0 | 0 | 228,940 | 0 | 8,616,241 |
| TotalStack · M’s Preservation | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,762,880 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 8,750,417 | 6,086,400 | 1,352 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,750,417 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,762,880 |
| TotalStack · Total Optimization | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,380,649 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,380,649 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,380,649 |
| TotalStack · Elite Preservation | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,262,390 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,262,390 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 251,351 | 24 | 0 | 0 | 251,351 | 0 | 8,262,390 |
| Complete optimization · silver-saver | 4 | 5,212,861 | 3,820,600 | 736 | 19 | 1.36 | 189,918 | 19 | 0 | 0 | 189,918 | 0 | 5,212,861 |
| Complete optimization · sweet-spot | 4 | 8,222,546 | 6,083,200 | 1,176 | 21 | 1.35 | 265,255 | 21 | 0 | 0 | 265,255 | 0 | 8,222,546 |
| Complete optimization · all-in | 4 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 261,725 | 24 | 0 | 0 | 261,725 | 0 | 8,519,930 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.017** ✓, damage a hired soldier **1.013** ✓, damage a monster —. All three are at or above the goal.

## 2026-09-17 export, its setup (7 000 leadership)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 108,291 | 93 | 0 | 0 | 108,291 | 0 | 18,589,604 |
| Tier ladder · Generate (average damage) | 4 | 24,032,714 | 14,192,200 | 6,656 | 93 | 1.69 | 180,940 | 93 | 0 | 0 | 180,940 | 0 | 24,032,714 |
| Troops first · all types | 4 | 23,341,980 | 10,957,600 | 4,064 | 55 | 2.13 | 339,326 | 55 | 0 | 0 | 339,326 | 0 | 23,341,980 |
| Troops first · Generate (average damage) | 4 | 24,634,972 | 14,192,200 | 6,200 | 86 | 1.74 | 209,894 | 86 | 0 | 0 | 209,894 | 0 | 24,634,972 |
| TotalStack · M’s Preservation | 4 | 11,013,524 | 10,972,800 | 960 | 16 | 1.00 | 273,665 | 16 | 0 | 0 | 273,665 | 0 | 11,013,524 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 13,742,586 | 16,016,000 | 3,472 | 51 | 0.86 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 13,742,586 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 7,807,482 | 8,400,000 | 3,472 | 51 | 0.93 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · Total Optimization | 4 | 11,007,500 | 10,965,600 | 960 | 16 | 1.00 | 273,665 | 16 | 0 | 0 | 273,665 | 0 | 11,007,500 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7,807,482 | 19,600,000 | 3,472 | 51 | 0.40 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 13,253,664 | 12,696,000 | 1,632 | 24 | 1.04 | 305,860 | 24 | 0 | 0 | 305,860 | 0 | 13,253,664 |
| TotalStack · Elite Preservation | 4 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 8,487,048 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 8,487,048 |
| Complete optimization · silver-saver | 4 | 16,115,314 | 8,695,000 | 2,544 | 32 | 1.85 | 350,864 | 32 | 0 | 0 | 350,864 | 0 | 16,115,314 |
| Complete optimization · sweet-spot | 4 | 18,796,348 | 10,906,900 | 2,760 | 35 | 1.72 | 357,360 | 35 | 0 | 0 | 357,360 | 0 | 18,796,348 |
| Complete optimization · more-mercs | 4 | 21,363,106 | 10,957,600 | 3,536 | 47 | 1.95 | 345,567 | 47 | 0 | 0 | 345,567 | 0 | 21,363,106 |
| Complete optimization · steady-max | 4 | 22,770,620 | 10,957,600 | 4,000 | 55 | 2.08 | 328,937 | 55 | 0 | 0 | 328,937 | 0 | 22,770,620 |
| Complete optimization · all-in | 4 | 23,619,920 | 15,179,600 | 6,608 | 92 | 1.56 | 186,943 | 92 | 0 | 0 | 186,943 | 0 | 23,619,920 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **2.070** ✓, damage a hired soldier **1.306** ✓, damage a monster —. All three are at or above the goal.

## 2026-09-17 export, 12 000 leadership

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 162,142 | 93 | 0 | 0 | 162,142 | 0 | 28,513,298 |
| Tier ladder · Generate (average damage) | 4 | 30,640,313 | 20,399,600 | 6,656 | 93 | 1.50 | 214,130 | 93 | 0 | 0 | 214,130 | 0 | 30,640,313 |
| Troops first · all types | 4 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 336,841 | 70 | 0 | 0 | 336,841 | 0 | 32,753,338 |
| Troops first · Generate (average damage) | 4 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 293,769 | 85 | 0 | 0 | 293,769 | 0 | 33,277,720 |
| TotalStack · M’s Preservation | 4 | 18,971,864 | 18,808,800 | 1,696 | 24 | 1.01 | 316,592 | 24 | 0 | 0 | 316,592 | 0 | 18,971,864 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 318,738 | 40 | 0 | 0 | 318,738 | 0 | 22,894,812 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 318,738 | 40 | 0 | 0 | 318,738 | 0 | 22,894,812 |
| TotalStack · Total Optimization | 4 | 18,833,644 | 18,800,000 | 1,664 | 24 | 1.00 | 311,226 | 24 | 0 | 0 | 311,226 | 0 | 18,833,644 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 315,519 | 40 | 0 | 0 | 315,519 | 0 | 22,753,836 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 315,519 | 40 | 0 | 0 | 315,519 | 0 | 22,753,836 |
| TotalStack · Elite Preservation | 4 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 14,551,348 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7,807,482 | 33,600,000 | 3,472 | 51 | 0.23 | 153,088 | 51 | 0 | 0 | 153,088 | 0 | 7,807,482 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 0 | 51 | 0 | 0 | 0 | 0 | 14,551,348 |
| Complete optimization · silver-saver | 4 | 20,864,973 | 12,129,500 | 2,984 | 45 | 1.72 | 308,097 | 45 | 0 | 0 | 308,097 | 0 | 20,864,973 |
| Complete optimization · sweet-spot | 4 | 31,546,458 | 18,790,400 | 4,824 | 67 | 1.68 | 333,911 | 67 | 0 | 0 | 333,911 | 0 | 31,546,458 |
| Complete optimization · steady-max | 4 | 31,963,845 | 21,035,600 | 5,784 | 82 | 1.52 | 290,661 | 82 | 0 | 0 | 290,661 | 0 | 31,963,845 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.717** ✓, damage a hired soldier **1.073** ✓, damage a monster —. All three are at or above the goal.

## live account of 2026-09-18 (one hired type, 20 000 leadership)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Tier ladder · Generate (average damage) | 4 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| Troops first · all types | 4 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,300,624 |
| Troops first · Generate (average damage) | 4 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 152,084 | 30 | 0 | 0 | 152,084 | 0 | 23,239,806 |
| TotalStack · M’s Preservation | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,980,608 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,980,608 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 25,980,608 |
| TotalStack · Total Optimization | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| TotalStack · Elite Preservation | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,222,440 |
| Complete optimization · silver-saver | 4 | 18,256,930 | 18,959,900 | 1,368 | 20 | 0.96 | 309,021 | 20 | 0 | 0 | 309,021 | 0 | 18,256,930 |
| Complete optimization · sweet-spot | 4 | 28,270,883 | 30,516,200 | 1,760 | 25 | 0.93 | 317,110 | 25 | 0 | 0 | 317,110 | 0 | 28,270,883 |
| Complete optimization · steady-max | 4 | 28,727,202 | 30,179,700 | 1,904 | 28 | 0.95 | 307,403 | 28 | 0 | 0 | 307,403 | 0 | 28,727,202 |
| Complete optimization · all-in | 4 | 29,743,332 | 30,928,400 | 2,016 | 30 | 0.96 | 304,167 | 30 | 0 | 0 | 304,167 | 0 | 29,743,332 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.033** ✓, damage a hired soldier **1.043** ✓, damage a monster —. All three are at or above the goal.

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 17,749 | 874 | 0 | 0 | 17,749 | 0 | 28,558,757 |
| Tier ladder · Generate (average damage) | 4 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 36,832,597 |
| Troops first · all types | 4 | 28,435,661 | 17,179,200 | 5,176 | 78 | 1.66 | 250,529 | 78 | 0 | 0 | 250,529 | 0 | 28,435,661 |
| Troops first · Generate (average damage) | 4 | 8,250,197 | 0 | 62,736 | 874 | — | 9,440 | 874 | 0 | 0 | 9,440 | 0 | 8,250,197 |
| TotalStack · M’s Preservation | 4 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 275,055 | 74 | 0 | 0 | 275,055 | 0 | 32,984,363 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 9,549 | 864 | 0 | 0 | 9,549 | 0 | 36,832,597 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 275,055 | 74 | 0 | 0 | 275,055 | 0 | 32,984,363 |
| TotalStack · Total Optimization | 4 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 277,022 | 74 | 0 | 0 | 277,022 | 0 | 33,333,894 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 36,832,597 | 30,800,000 | 30,616 | 428 | 1.20 | 19,276 | 428 | 0 | 0 | 19,276 | 0 | 36,832,597 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 277,022 | 74 | 0 | 0 | 277,022 | 0 | 33,333,894 |
| TotalStack · Elite Preservation | 4 | 30,966,094 | 17,233,600 | 62,040 | 864 | 1.80 | 18,121 | 864 | 0 | 0 | 18,121 | 0 | 30,966,094 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 9,549 | 864 | 0 | 0 | 9,549 | 0 | 36,832,597 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 22,905,506 | 16,332,000 | 62,136 | 868 | 1.40 | 16,768 | 868 | 0 | 0 | 16,768 | 0 | 22,905,506 |
| Complete optimization · silver-saver | 4 | 20,649,596 | 12,339,900 | 3,064 | 50 | 1.67 | 261,252 | 50 | 0 | 0 | 261,252 | 0 | 20,649,596 |
| Complete optimization · sweet-spot | 4 | 28,140,302 | 17,072,400 | 4,056 | 61 | 1.65 | 285,220 | 61 | 0 | 0 | 285,220 | 0 | 28,140,302 |
| Complete optimization · more-mercs | 4 | 29,851,070 | 17,179,200 | 4,872 | 70 | 1.74 | 299,381 | 70 | 0 | 0 | 299,381 | 0 | 29,851,070 |
| Complete optimization · steady-max | 4 | 30,693,083 | 17,179,200 | 5,040 | 76 | 1.79 | 286,825 | 76 | 0 | 0 | 286,825 | 0 | 30,693,083 |
| Complete optimization · all-in | 4 | 31,714,657 | 18,768,000 | 6,192 | 88 | 1.69 | 272,129 | 88 | 0 | 0 | 272,129 | 0 | 31,714,657 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.924** ✗, damage a hired soldier **1.081** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 16,014,855 | 7,351,600 | 62,736 | 874 | 2.18 | 11,050 | 874 | 0 | 0 | 11,050 | 0 | 16,014,855 |
| Tier ladder · Generate (average damage) | 4 | 19,767,678 | 10,575,600 | 62,736 | 874 | 1.87 | 14,538 | 874 | 0 | 0 | 14,538 | 0 | 19,767,678 |
| Troops first · all types | 4 | 13,629,206 | 7,351,600 | 2,064 | 28 | 1.85 | 338,016 | 28 | 0 | 0 | 338,016 | 0 | 13,629,206 |
| Troops first · Generate (average damage) | 4 | 8,157,173 | 0 | 62,736 | 874 | — | 9,333 | 874 | 0 | 0 | 9,333 | 0 | 8,157,173 |
| Complete optimization · sweet-spot | 4 | 15,533,933 | 7,682,800 | 2,440 | 37 | 2.02 | 300,662 | 37 | 0 | 0 | 300,662 | 0 | 15,533,933 |
| Complete optimization · steady-max | 4 | 17,630,102 | 8,448,400 | 4,120 | 58 | 2.09 | 237,879 | 58 | 0 | 0 | 237,879 | 0 | 17,630,102 |
| Complete optimization · all-in | 4 | 18,744,735 | 11,240,800 | 7,848 | 111 | 1.67 | 133,301 | 111 | 0 | 0 | 133,301 | 0 | 18,744,735 |

No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal (*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not measured here.

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 43,923,310 | 7,770,800 | 60,704 | 398 | 5.65 | 93,619 | 372 | 26 | 0 | 73,038 | 388,080 | 43,923,310 |
| Tier ladder · Generate (average damage) | 4 | 45,064,115 | 13,927,200 | 56,160 | 445 | 3.24 | 72,224 | 425 | 20 | 0 | 51,881 | 504,504 | 45,064,115 |
| Troops first · all types | 4 | 8,921,776 | 7,770,800 | 2,144 | 28 | 1.15 | 174,820 | 24 | 4 | 0 | 148,517 | 332,640 | 8,921,776 |
| Troops first · Generate (average damage) | 4 | 50,435,355 | 13,927,200 | 51,872 | 353 | 3.62 | 142,876 | 333 | 20 | 0 | 118,826 | 543,312 | 50,435,355 |
| TotalStack · M’s Preservation | 4 | 35,412,012 | 7,797,200 | 60,352 | 260 | 4.54 | 104,017 | 228 | 32 | 0 | 118,616 | 0 | 35,412,012 |
| TotalStack · Total Optimization | 4 | 49,229,801 | 7,794,000 | 59,176 | 374 | 6.32 | 109,269 | 346 | 28 | 0 | 118,111 | 0 | 49,229,801 |
| TotalStack · Elite Preservation | 4 | 49,229,801 | 7,794,000 | 59,176 | 374 | 6.32 | 109,269 | 346 | 28 | 0 | 118,111 | 0 | 49,229,801 |
| Complete optimization · sweet-spot | 4 | 8,980,108 | 7,241,900 | 1,664 | 19 | 1.24 | 233,912 | 15 | 4 | 0 | 229,761 | 249,480 | 8,980,108 |
| Complete optimization · more-mercs | 4 | 12,086,359 | 9,849,200 | 5,264 | 37 | 1.23 | 195,020 | 33 | 4 | 0 | 138,018 | 665,280 | 12,086,359 |
| Complete optimization · steady-max | 4 | 15,306,859 | 9,849,200 | 6,344 | 52 | 1.55 | 200,697 | 48 | 4 | 0 | 161,981 | 665,280 | 15,306,859 |
| Complete optimization · all-in | 4 | 10,899,547 | 6,653,700 | 17,504 | 133 | 1.64 | 81,951 | 125 | 8 | 0 | 59,255 | 436,590 | 10,899,547 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **0.259** ✗, damage a hired soldier **1.945** ✓, damage a monster —. **Below the goal: damage a silver** — a discrepancy for the owner, not a pin.

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 5,904,308 | 7,770,800 | 11,120 | 156 | 0.76 | 0 | 156 | 0 | 0 | 0 | 0 | 5,904,308 |
| Tier ladder · Generate (average damage) | 4 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| Troops first · all types | 4 | 7,650,936 | 7,770,800 | 800 | 12 | 0.98 | 302,010 | 12 | 0 | 0 | 302,010 | 0 | 7,650,936 |
| Troops first · Generate (average damage) | 4 | 25,012,889 | 13,927,200 | 11,120 | 156 | 1.80 | 160,339 | 156 | 0 | 0 | 160,339 | 0 | 25,012,889 |
| TotalStack · M’s Preservation | 4 | 5,002,716 | 7,797,200 | 0 | 0 | 0.64 | 0 | 0 | 0 | 0 | 0 | 0 | 5,002,716 |
| TotalStack · Total Optimization | 4 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 0 | 156 | 0 | 0 | 0 | 0 | 6,422,616 |
| TotalStack · Elite Preservation | 4 | 6,422,616 | 7,794,000 | 11,120 | 156 | 0.82 | 0 | 156 | 0 | 0 | 0 | 0 | 6,422,616 |
| Complete optimization · silver-saver | 4 | 7,561,467 | 7,313,300 | 848 | 12 | 1.03 | 318,189 | 12 | 0 | 0 | 318,189 | 0 | 7,561,467 |
| Complete optimization · sweet-spot | 4 | 9,068,238 | 8,746,700 | 1,016 | 15 | 1.04 | 306,324 | 15 | 0 | 0 | 306,324 | 0 | 9,068,238 |
| Complete optimization · more-mercs | 4 | 10,294,068 | 10,005,200 | 2,288 | 33 | 1.03 | 170,126 | 33 | 0 | 0 | 170,126 | 0 | 10,294,068 |
| Complete optimization · steady-max | 4 | 13,842,678 | 10,476,500 | 3,944 | 57 | 1.32 | 164,062 | 57 | 0 | 0 | 164,062 | 0 | 13,842,678 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.603** ✓, damage a hired soldier —, damage a monster —. All three are at or above the goal.

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 6,045,332 | 7,964,000 | 2,960 | 42 | 0.76 | 0 | 42 | 0 | 0 | 0 | 0 | 6,045,332 |
| Tier ladder · Generate (average damage) | 4 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| Troops first · all types | 4 | 7,872,708 | 7,964,000 | 832 | 12 | 0.99 | 312,796 | 12 | 0 | 0 | 312,796 | 0 | 7,872,708 |
| Troops first · Generate (average damage) | 4 | 11,426,058 | 11,665,600 | 2,960 | 42 | 0.98 | 158,709 | 42 | 0 | 0 | 158,709 | 0 | 11,426,058 |
| TotalStack · M’s Preservation | 4 | 5,128,468 | 7,992,800 | 0 | 0 | 0.64 | 0 | 0 | 0 | 0 | 0 | 0 | 5,128,468 |
| TotalStack · Total Optimization | 4 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 0 | 42 | 0 | 0 | 0 | 0 | 6,585,128 |
| TotalStack · Elite Preservation | 4 | 6,585,128 | 7,990,400 | 2,960 | 42 | 0.82 | 0 | 42 | 0 | 0 | 0 | 0 | 6,585,128 |
| Complete optimization · sweet-spot | 4 | 10,156,338 | 9,503,600 | 1,792 | 25 | 1.07 | 258,218 | 25 | 0 | 0 | 258,218 | 0 | 10,156,338 |
| Complete optimization · more-mercs | 4 | 10,197,781 | 10,729,000 | 2,416 | 34 | 0.95 | 159,888 | 34 | 0 | 0 | 159,888 | 0 | 10,197,781 |
| Complete optimization · steady-max | 4 | 11,196,175 | 11,037,400 | 2,808 | 39 | 1.01 | 161,791 | 39 | 0 | 0 | 161,791 | 0 | 11,196,175 |
| Complete optimization · all-in | 4 | 11,585,381 | 11,202,400 | 2,888 | 41 | 1.03 | 158,634 | 41 | 0 | 0 | 158,634 | 0 | 11,585,381 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.297** ✓, damage a hired soldier —, damage a monster —. All three are at or above the goal.

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 6,739,348 | 7,990,800 | 6,752 | 29 | 0.84 | 0 | 29 | 16 | 3,840 | 0 | 126,953 | 1,755 |
| Tier ladder · Generate (average damage) | 4 | 8,444,893 | 9,547,400 | 6,752 | 29 | 0.88 | 105,962 | 29 | 16 | 3,840 | 105,962 | 97,163 | 2,199 |
| Troops first · all types | 4 | 7,673,968 | 7,990,800 | 5,856 | 16 | 0.96 | 104,118 | 16 | 16 | 3,840 | 104,118 | 126,953 | 1,998 |
| Troops first · Generate (average damage) | 4 | 8,647,583 | 9,142,200 | 6,672 | 28 | 0.95 | 105,324 | 28 | 16 | 3,840 | 105,324 | 102,779 | 2,252 |
| TotalStack · M’s Preservation | 4 | 5,187,364 | 7,862,000 | 5,568 | 0 | 0.66 | 0 | 0 | 12 | 1,920 | 0 | 130,251 | 2,702 |
| TotalStack · Total Optimization | 4 | 6,779,808 | 7,989,200 | 6,816 | 29 | 0.85 | 0 | 29 | 16 | 3,840 | 0 | 129,633 | 1,766 |
| TotalStack · Elite Preservation | 4 | 6,779,808 | 7,989,200 | 6,816 | 29 | 0.85 | 0 | 29 | 16 | 3,840 | 0 | 129,633 | 1,766 |
| Complete optimization · silver-saver | 4 | 4,919,095 | 4,431,600 | 5,184 | 7 | 1.11 | 131,856 | 7 | 16 | 3,840 | 131,856 | 116,603 | 1,281 |
| Complete optimization · sweet-spot | 4 | 8,182,228 | 8,340,000 | 6,120 | 19 | 0.98 | 109,005 | 19 | 16 | 3,840 | 109,005 | 118,153 | 2,131 |
| Complete optimization · steady-max | 4 | 8,408,431 | 8,702,400 | 6,384 | 25 | 0.97 | 100,404 | 25 | 16 | 3,840 | 100,404 | 110,928 | 2,190 |

**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: damage a silver **1.308** ✓, damage a hired soldier —, damage a monster **0.911** ✗. **Below the goal: damage a monster** — a discrepancy for the owner, not a pin. And the fourth currency, where one is spent: **damage a dragon coin 1.240** ✓ — the monsters’ own price (S-102).

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired | soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8,572,792 | 7,989,600 | 13,200 | 33 | 1.07 | 0 | 33 | 20 | 4,320 | 0 | 187,737 | 1,984 |
| Tier ladder · Generate (average damage) | 4 | 11,780,261 | 11,670,000 | 13,360 | 33 | 1.01 | 150,515 | 33 | 18 | 3,960 | 150,515 | 134,246 | 2,975 |
| Troops first · all types | 4 | 10,574,240 | 7,989,600 | 11,552 | 8 | 1.32 | 307,403 | 8 | 20 | 4,320 | 307,403 | 187,737 | 2,448 |
| Troops first · Generate (average damage) | 4 | 11,892,528 | 11,071,800 | 13,064 | 30 | 1.07 | 165,566 | 30 | 20 | 4,080 | 165,566 | 126,534 | 2,915 |
| Complete optimization · sweet-spot | 4 | 11,417,051 | 8,090,400 | 10,976 | 8 | 1.41 | 422,679 | 8 | 23 | 5,760 | 422,679 | 159,797 | 1,982 |
| Complete optimization · steady-max | 4 | 11,721,371 | 8,695,200 | 11,816 | 14 | 1.35 | 265,799 | 14 | 20 | 4,320 | 265,799 | 175,220 | 2,713 |

No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal (*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not measured here.

