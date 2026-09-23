# 163 — an unsheltered stop

Every benchmark army, the plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march campaigns priced as the benchmark prices stops (`campaignOf`, worst opening). A **candidate** is one march repeated four times, each hired stack capped by the four-march sustain (`largestSustained(cap, 4)`), the shelter let go. Sources: the Elite / MS / MS-relaxed sizer at 10 %…100 % of the sustain, the TotalStack rows re-capped to the sustain, each stop’s troops under the full sustain, and `retypeMarch` on the best six. The **best** candidate is the unsheltered one (margin < 1) with the highest rating `rate(top, candidate, markerRates)` against the highest-damage stop (**top**). Verdict against top: **win** = rating > 0 and no marker worse; **trade** = rating > 0, some marker worse; **dominated** = rating ≤ 0. Hired stacks are starred.


## A. Per army: the best sustained unsheltered march against the top stop

| army | stops | top | top dmg | best unsheltered (source) | dmg | Δdmg vs top | hired vs top | rating vs top | stops rated > 0 | verdict | markers worse vs top |
|---|---:|---|---:|---|---:|---:|---:|---:|---:|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 1 | SW | 18.19M | none unsheltered | | | | | | | |
| first-run army, Bear V ×2 (20 000 leadership | 1 | SW | 18.41M | none unsheltered | | | | | | | |
| first-run army, Bear V ×3 (20 000 leadership | 2 | AI | 19.04M | none unsheltered | | | | | | | |
| first-run army, Bear V ×10 (20 000 leadershi | 2 | AI | 21.29M | TS re-capped (M’s Preservation) → retyped | 21.59M | 1.4 % | 4 vs 4 | 8.01 | 1/2 | **trade** | dmg/hired |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 | AI | 30.14M | none unsheltered | | | | | | | |
| first-run army, monster tiers 3–5 at 900 dom | 5 | AI | 103.20M | none unsheltered | | | | | | | |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 | AI | 8.99M | SS troops + sustain hired → retyped | 4.15M | -53.8 % | 16 vs 24 | -32.73 | 0/3 | dominated | dmg, dmg/silver, dmg/hired, dmg/gold |
| 2026-09-17 export, its setup (7 000 leadersh | 5 | MX | 24.29M | Elite 50 % → retyped | 14.88M | -38.7 % | 44 vs 55 | -29.14 | 0/5 | dominated | dmg, queue, dmg/silver, dmg/hired, dmg/gold |
| 2026-09-17 export, 12 000 leadership | 4 | MX | 34.62M | SW troops + sustain hired → retyped | 27.29M | -21.2 % | 80 vs 82 | -18.33 | 0/4 | dominated | dmg, gold, dmg/silver, dmg/hired, dmg/gold |
| live account of 2026-09-18 (one hired type,  | 4 | AI | 29.74M | SS troops + sustain hired → retyped | 11.97M | -59.7 % | 28 vs 30 | -43.82 | 0/4 | dominated | dmg, dmg/silver, dmg/hired, dmg/gold |
| live account, evening (hunters 83, legionari | 5 | MX | 34.10M | TS re-capped (Total Optimization) → retyped | 31.84M | -6.7 % | 72 vs 76 | -4.88 | 3/5 | dominated | dmg, silver, queue, dmg/silver, dmg/hired, dmg/gold |
| Aydae alone, 4 975 (one captain, four hired  | 4 | AI | 18.75M | Elite 10 % → retyped | 6.71M | -64.2 % | 96 vs 111 | -49.46 | 0/4 | dominated | dmg, dmg/silver, dmg/hired, dmg/gold |
| the owner’s live camp of 2026-09-18 (arbales | 5 | MX | 31.54M | TS re-capped (Total Optimization) → retyped | 47.13M | 49.4 % | 360 vs 208 | 23.44 | 3/5 | **trade** | hired, gold, dmg/hired, dmg/gold |
| his camp of 2026-09-19, the localStorage dum | 5 | MX | 23.59M | Elite 10 % | 5.90M | -75.0 % | 16 vs 148 | -28.98 | 0/5 | dominated | dmg, dmg/silver, dmg/hired |
| his camp of 2026-09-19, as his message reads | 5 | AI | 11.59M | Elite 40 % | 6.05M | -47.8 % | 16 vs 41 | -16.13 | 0/5 | dominated | dmg, dmg/silver, dmg/hired |
| his TotalStack profile of 2026-09-19 (5 225  | 3 | MX | 8.44M | Elite 70 % → retyped | 6.76M | -19.9 % | 20 vs 25 | -8.60 | 0/3 | dominated | dmg, dmg/silver, dmg/hired, dmg/coin |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 | MX | 11.76M | Elite 30 % → retyped | 8.89M | -24.4 % | 8 vs 14 | -7.78 | 0/3 | dominated | dmg, dmg/silver, dmg/hired, dmg/coin |

## B. The mechanism, first march, enemy-first journal

A stack **wiped before striking** is one the enemy kills (highest total HP first) before its first strike; "their lost strike" sums one strike of each. Hired / troops dealt split the worst opening.

| army | march | stacks (troops+hired) | enemy attacks | wiped before striking (troops / hired) | their lost strike | hired dealt | troops dealt | worst | best opening |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×10 (20 000 leadershi | AI (sheltered 1.25) | 7+1 | 8 | 1 / 0 | 0.44M | 0.75M | 4.83M | 5.58M | 6.02M |
| first-run army, Bear V ×10 (20 000 leadershi | candidate (margin 0.97) | 10+1 | 11 | 0 / 1 | 0.26M | 0.00M | 5.40M | 5.40M | 5.66M |
| the 4 000-leadership case of 2026-09-15 (Tot | AI (sheltered 1.04) | 8+4 | 12 | 1 / 0 | 0.06M | 1.92M | 0.65M | 2.58M | 2.58M |
| the 4 000-leadership case of 2026-09-15 (Tot | candidate (margin 0.70) | 8+4 | 12 | 0 / 2 | 0.23M | 0.46M | 0.58M | 1.04M | 1.13M |
| 2026-09-17 export, its setup (7 000 leadersh | MX (sheltered 1.00) | 7+4 | 11 | 2 / 0 | 0.38M | 4.80M | 1.35M | 6.15M | 6.34M |
| 2026-09-17 export, its setup (7 000 leadersh | candidate (margin 0.71) | 7+4 | 11 | 0 / 1 | 0.87M | 1.54M | 2.18M | 3.72M | 4.59M |
| 2026-09-17 export, 12 000 leadership | MX (sheltered 1.00) | 5+4 | 9 | 1 / 0 | 0.54M | 6.21M | 2.59M | 8.80M | 9.34M |
| 2026-09-17 export, 12 000 leadership | candidate (margin 0.61) | 7+4 | 11 | 0 / 1 | 1.75M | 3.08M | 3.74M | 6.82M | 8.58M |
| live account of 2026-09-18 (one hired type,  | AI (sheltered 1.29) | 7+1 | 8 | 1 / 0 | 0.62M | 2.69M | 5.15M | 7.84M | 7.84M |
| live account of 2026-09-18 (one hired type,  | candidate (margin 0.81) | 7+1 | 8 | 0 / 1 | 1.00M | 0.00M | 2.99M | 2.99M | 2.99M |
| live account, evening (hunters 83, legionari | MX (sheltered 1.02) | 7+4 | 11 | 1 / 0 | 0.33M | 5.76M | 2.93M | 8.69M | 8.69M |
| live account, evening (hunters 83, legionari | candidate (margin 0.81) | 7+4 | 11 | 1 / 0 | 0.34M | 4.75M | 3.21M | 7.96M | 8.30M |
| Aydae alone, 4 975 (one captain, four hired  | AI (sheltered 1.01) | 3+4 | 7 | 1 / 0 | 0.43M | 4.28M | 1.09M | 5.37M | 5.80M |
| Aydae alone, 4 975 (one captain, four hired  | candidate (margin 0.09) | 8+3 | 11 | 0 / 1 | 2.00M | 0.45M | 1.23M | 1.68M | 3.68M |
| the owner’s live camp of 2026-09-18 (arbales | MX (sheltered 1.25) | 1+3 | 4 | 1 / 0 | 3.17M | 9.59M | 0.00M | 9.59M | 12.76M |
| the owner’s live camp of 2026-09-18 (arbales | candidate (margin 0.04) | 7+3 | 10 | 0 / 1 | 3.38M | 9.69M | 2.09M | 11.78M | 15.17M |
| his camp of 2026-09-19, the localStorage dum | MX (sheltered 1.25) | 1+1 | 2 | 1 / 0 | 3.11M | 6.05M | 0.00M | 6.05M | 9.16M |
| his camp of 2026-09-19, the localStorage dum | candidate (margin 0.84) | 7+1 | 8 | 1 / 1 | 0.70M | 0.00M | 1.48M | 1.48M | 2.03M |
| his camp of 2026-09-19, as his message reads | AI (sheltered 1.00) | 3+1 | 4 | 1 / 0 | 0.58M | 1.78M | 1.38M | 3.16M | 3.74M |
| his camp of 2026-09-19, as his message reads | candidate (margin 0.81) | 7+1 | 8 | 1 / 1 | 0.73M | 0.00M | 1.51M | 1.51M | 2.09M |
| his TotalStack profile of 2026-09-19 (5 225  | MX (sheltered 1.00) | 10+1 | 11 | 1 / 0 | 0.15M | 1.12M | 1.05M | 2.17M | 2.32M |
| his TotalStack profile of 2026-09-19 (5 225  | candidate (margin 0.89) | 12+1 | 13 | 0 / 1 | 0.24M | 0.51M | 1.18M | 1.69M | 1.93M |
| his usual setup of 2026-09-19 (Aydae alone,  | MX (sheltered 1.01) | 10+1 | 11 | 1 / 0 | 0.16M | 1.89M | 1.14M | 3.03M | 3.19M |
| his usual setup of 2026-09-19 (Aydae alone,  | candidate (margin 0.98) | 12+1 | 13 | 0 / 1 | 0.32M | 0.94M | 1.28M | 2.22M | 2.55M |

## C. What the shelter costs the candidate, and the hired it burns per million

| army | shelter cost: sheltered candidate dmg | hired cut by shelter | dmg lost to shelter | hired per extra 1M dmg (unsheltered vs its sheltered self) | hired per extra 1M dmg (vs top) |
|---|---:|---:|---:|---:|---:|
| first-run army, Bear V ×10 (20 000 leadershi | 20.64M | 0 | 0.96M | 0.0 | 0.0 |
| the 4 000-leadership case of 2026-09-15 (Tot | 4.66M | 0 | -0.51M | — | — |
| 2026-09-17 export, its setup (7 000 leadersh | 17.22M | 8 | -2.34M | — | — |
| 2026-09-17 export, 12 000 leadership | 29.89M | 16 | -2.60M | — | — |
| live account of 2026-09-18 (one hired type,  | 14.65M | 8 | -2.68M | — | — |
| live account, evening (hunters 83, legionari | 30.28M | 4 | 1.56M | 2.6 | — |
| Aydae alone, 4 975 (one captain, four hired  | 7.00M | 80 | -0.29M | — | — |
| the owner’s live camp of 2026-09-18 (arbales | 10.30M | 336 | 36.84M | 9.1 | 9.7 |
| his camp of 2026-09-19, the localStorage dum | 7.65M | 4 | -1.75M | — | — |
| his camp of 2026-09-19, as his message reads | 7.87M | 4 | -1.83M | — | — |
| his TotalStack profile of 2026-09-19 (5 225  | 7.37M | 4 | -0.61M | — | — |
| his usual setup of 2026-09-19 (Aydae alone,  | 10.19M | 0 | -1.30M | — | — |

## D. The TotalStack rows against the best candidate

| army | TS row | TS dmg | kept in 162 (no stop beats it) | candidate dmg | rate(row, candidate) | beaten by the candidate |
|---|---|---:|---|---:|---:|---|
| first-run army, Bear V ×10 (20 000 leadershi | M’s Preservation | 21.54M | beaten | 21.59M | 3.70 (any candidate: 3.70) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | priority search under M’s (averageDamage) | 22.47M | beaten | 21.59M | 10.29 (any candidate: 10.29) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | priority search under M’s (damagePerSilver) | 21.54M | beaten | 21.59M | 3.70 (any candidate: 3.70) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | Total Optimization | 20.80M | beaten | 21.59M | -0.18 (any candidate: -0.18) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | priority search under Total Optimization (averageDamage) | 19.79M | beaten | 21.59M | 23.33 (any candidate: 23.33) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | priority search under Total Optimization (damagePerSilver) | 20.80M | beaten | 21.59M | -0.18 (any candidate: -0.18) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | Elite Preservation | 21.16M | beaten | 21.59M | 6.04 (any candidate: 6.04) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | priority search under Elite (averageDamage) | 19.79M | beaten | 21.59M | 23.33 (any candidate: 23.33) | yes |
| first-run army, Bear V ×10 (20 000 leadershi | priority search under Elite (damagePerSilver) | 21.16M | beaten | 21.59M | 6.04 (any candidate: 6.04) | yes |
| the 4 000-leadership case of 2026-09-15 (Tot | optimize (as captured, repeated) | 8.76M | beaten | 4.15M | -31.46 (any candidate: -31.46) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | M’s Preservation | 8.76M | beaten | 4.15M | -31.46 (any candidate: -31.46) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | priority search under M’s (averageDamage) | 8.75M | beaten | 4.15M | -31.29 (any candidate: -31.29) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | priority search under M’s (damagePerSilver) | 8.76M | beaten | 4.15M | -31.46 (any candidate: -31.46) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | Total Optimization | 8.38M | beaten | 4.15M | -29.40 (any candidate: -29.40) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | priority search under Total Optimization (averageDamage) | 8.38M | beaten | 4.15M | -29.40 (any candidate: -29.40) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | priority search under Total Optimization (damagePerSilver) | 8.38M | beaten | 4.15M | -29.40 (any candidate: -29.40) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | Elite Preservation | 8.26M | beaten | 4.15M | -28.49 (any candidate: -28.49) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | priority search under Elite (averageDamage) | 8.26M | beaten | 4.15M | -28.49 (any candidate: -28.49) | **no** |
| the 4 000-leadership case of 2026-09-15 (Tot | priority search under Elite (damagePerSilver) | 8.26M | beaten | 4.15M | -28.49 (any candidate: -28.49) | **no** |
| 2026-09-17 export, its setup (7 000 leadersh | M’s Preservation | 11.01M | beaten | 14.88M | -39.86 (any candidate: -34.03) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | priority search under M’s (averageDamage) | 13.74M | beaten | 14.88M | 22.35 (any candidate: 29.59) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | priority search under M’s (damagePerSilver) | 7.81M | beaten | 14.88M | 77.30 (any candidate: 113.81) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | Total Optimization | 11.01M | beaten | 14.88M | -39.80 (any candidate: -33.98) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | priority search under Total Optimization (averageDamage) | 7.81M | beaten | 14.88M | 107.49 (any candidate: 143.99) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | priority search under Total Optimization (damagePerSilver) | 13.25M | beaten | 14.88M | -16.04 (any candidate: -15.42) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | Elite Preservation | 8.49M | beaten | 14.88M | 81.50 (any candidate: 112.57) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | priority search under Elite (averageDamage) | 7.81M | beaten | 14.88M | 107.49 (any candidate: 143.99) | yes |
| 2026-09-17 export, its setup (7 000 leadersh | priority search under Elite (damagePerSilver) | 8.49M | beaten | 14.88M | 81.50 (any candidate: 112.57) | yes |
| 2026-09-17 export, 12 000 leadership | M’s Preservation | 18.97M | beaten | 27.29M | -51.87 (any candidate: -34.55) | yes |
| 2026-09-17 export, 12 000 leadership | priority search under M’s (averageDamage) | 22.89M | beaten | 27.29M | -18.28 (any candidate: -12.84) | yes |
| 2026-09-17 export, 12 000 leadership | priority search under M’s (damagePerSilver) | 22.89M | beaten | 27.29M | -18.28 (any candidate: -12.84) | yes |
| 2026-09-17 export, 12 000 leadership | Total Optimization | 18.83M | beaten | 27.29M | -52.15 (any candidate: -34.57) | yes |
| 2026-09-17 export, 12 000 leadership | priority search under Total Optimization (averageDamage) | 22.75M | beaten | 27.29M | -18.03 (any candidate: -12.56) | yes |
| 2026-09-17 export, 12 000 leadership | priority search under Total Optimization (damagePerSilver) | 22.75M | beaten | 27.29M | -18.03 (any candidate: -12.56) | yes |
| 2026-09-17 export, 12 000 leadership | Elite Preservation | 14.55M | beaten | 27.29M | 62.43 (any candidate: 62.43) | yes |
| 2026-09-17 export, 12 000 leadership | priority search under Elite (averageDamage) | 7.81M | beaten | 27.29M | 235.16 (any candidate: 235.16) | yes |
| 2026-09-17 export, 12 000 leadership | priority search under Elite (damagePerSilver) | 14.55M | beaten | 27.29M | 62.43 (any candidate: 62.43) | yes |
| live account of 2026-09-18 (one hired type,  | M’s Preservation | 25.98M | beaten | 11.97M | -37.82 (any candidate: -37.82) | **no** |
| live account of 2026-09-18 (one hired type,  | priority search under M’s (averageDamage) | 25.98M | beaten | 11.97M | -37.82 (any candidate: -37.82) | **no** |
| live account of 2026-09-18 (one hired type,  | priority search under M’s (damagePerSilver) | 25.98M | beaten | 11.97M | -37.82 (any candidate: -37.82) | **no** |
| live account of 2026-09-18 (one hired type,  | Total Optimization | 29.22M | beaten | 11.97M | -42.93 (any candidate: -42.93) | **no** |
| live account of 2026-09-18 (one hired type,  | priority search under Total Optimization (averageDamage) | 29.22M | beaten | 11.97M | -42.93 (any candidate: -42.93) | **no** |
| live account of 2026-09-18 (one hired type,  | priority search under Total Optimization (damagePerSilver) | 29.22M | beaten | 11.97M | -42.93 (any candidate: -42.93) | **no** |
| live account of 2026-09-18 (one hired type,  | Elite Preservation | 29.22M | beaten | 11.97M | -42.93 (any candidate: -42.93) | **no** |
| live account of 2026-09-18 (one hired type,  | priority search under Elite (averageDamage) | 29.22M | beaten | 11.97M | -42.93 (any candidate: -42.93) | **no** |
| live account of 2026-09-18 (one hired type,  | priority search under Elite (damagePerSilver) | 29.22M | beaten | 11.97M | -42.93 (any candidate: -42.93) | **no** |
| live account, evening (hunters 83, legionari | M’s Preservation | 32.98M | beaten | 31.84M | -2.06 (any candidate: -2.06) | **no** |
| live account, evening (hunters 83, legionari | priority search under M’s (averageDamage) | 36.83M | beaten | 31.84M | 33.95 (any candidate: 34.15) | yes |
| live account, evening (hunters 83, legionari | priority search under M’s (damagePerSilver) | 32.98M | beaten | 31.84M | -2.06 (any candidate: -2.06) | **no** |
| live account, evening (hunters 83, legionari | Total Optimization | 33.33M | beaten | 31.84M | -2.96 (any candidate: -2.96) | **no** |
| live account, evening (hunters 83, legionari | priority search under Total Optimization (averageDamage) | 36.83M | beaten | 31.84M | 30.65 (any candidate: 30.72) | yes |
| live account, evening (hunters 83, legionari | priority search under Total Optimization (damagePerSilver) | 33.33M | beaten | 31.84M | -2.96 (any candidate: -2.96) | **no** |
| live account, evening (hunters 83, legionari | Elite Preservation | 30.97M | beaten | 31.84M | 39.57 (any candidate: 39.89) | yes |
| live account, evening (hunters 83, legionari | priority search under Elite (averageDamage) | 36.83M | beaten | 31.84M | 33.95 (any candidate: 34.15) | yes |
| live account, evening (hunters 83, legionari | priority search under Elite (damagePerSilver) | 22.91M | beaten | 31.84M | 73.92 (any candidate: 74.38) | yes |
| Aydae alone, 4 975 (one captain, four hired  | M’s Preservation | 16.51M | beaten | 6.71M | -115.47 (any candidate: -115.47) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | priority search under M’s (averageDamage) | 18.79M | beaten | 6.71M | -17.12 (any candidate: 5.24) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | priority search under M’s (damagePerSilver) | 12.93M | beaten | 6.71M | -57.65 (any candidate: -57.65) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | Total Optimization | 16.38M | beaten | 6.71M | -115.14 (any candidate: -115.14) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | priority search under Total Optimization (averageDamage) | 23.50M | beaten | 6.71M | -36.69 (any candidate: -36.69) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | priority search under Total Optimization (damagePerSilver) | 16.38M | beaten | 6.71M | -115.14 (any candidate: -115.14) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | Elite Preservation | 17.11M | beaten | 6.71M | -23.46 (any candidate: -1.39) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | priority search under Elite (averageDamage) | 19.77M | beaten | 6.71M | -22.65 (any candidate: -5.67) | **no** |
| Aydae alone, 4 975 (one captain, four hired  | priority search under Elite (damagePerSilver) | 17.11M | beaten | 6.71M | -23.46 (any candidate: -1.39) | **no** |
| the owner’s live camp of 2026-09-18 (arbales | M’s Preservation | 35.41M | **kept** | 47.13M | 26.18 (any candidate: 26.18) | yes |
| the owner’s live camp of 2026-09-18 (arbales | Total Optimization | 49.23M | **kept** | 47.13M | -3.13 (any candidate: -3.13) | **no** |
| the owner’s live camp of 2026-09-18 (arbales | Elite Preservation | 49.23M | **kept** | 47.13M | -3.13 (any candidate: -3.13) | **no** |
| his camp of 2026-09-19, the localStorage dum | M’s Preservation | 5.00M | beaten | 5.90M | 18.13 (any candidate: 53.19) | yes |
| his camp of 2026-09-19, the localStorage dum | Total Optimization | 6.42M | beaten | 5.90M | 28.24 (any candidate: 28.24) | yes |
| his camp of 2026-09-19, the localStorage dum | Elite Preservation | 6.42M | beaten | 5.90M | 28.24 (any candidate: 28.24) | yes |
| his camp of 2026-09-19, as his message reads | M’s Preservation | 5.13M | beaten | 6.05M | 17.99 (any candidate: 33.45) | yes |
| his camp of 2026-09-19, as his message reads | Total Optimization | 6.59M | beaten | 6.05M | 17.37 (any candidate: 17.37) | yes |
| his camp of 2026-09-19, as his message reads | Elite Preservation | 6.59M | beaten | 6.05M | 17.37 (any candidate: 17.37) | yes |
| his TotalStack profile of 2026-09-19 (5 225  | M’s Preservation | 5.19M | beaten | 6.76M | 17.34 (any candidate: 22.45) | yes |
| his TotalStack profile of 2026-09-19 (5 225  | Total Optimization | 6.78M | beaten | 6.76M | 13.75 (any candidate: 13.75) | yes |
| his TotalStack profile of 2026-09-19 (5 225  | Elite Preservation | 6.78M | beaten | 6.76M | 13.75 (any candidate: 13.75) | yes |
| his usual setup of 2026-09-19 (Aydae alone,  | M’s Preservation | 9.14M | beaten | 8.89M | -41.15 (any candidate: -41.15) | **no** |
| his usual setup of 2026-09-19 (Aydae alone,  | priority search under M’s (averageDamage) | 11.04M | beaten | 8.89M | 18.28 (any candidate: 18.28) | yes |
| his usual setup of 2026-09-19 (Aydae alone,  | priority search under M’s (damagePerSilver) | 11.24M | beaten | 8.89M | -0.83 (any candidate: -0.83) | **no** |
| his usual setup of 2026-09-19 (Aydae alone,  | Total Optimization | 9.17M | beaten | 8.89M | -46.52 (any candidate: -46.52) | **no** |
| his usual setup of 2026-09-19 (Aydae alone,  | priority search under Total Optimization (averageDamage) | 10.53M | beaten | 8.89M | -13.83 (any candidate: -13.83) | **no** |
| his usual setup of 2026-09-19 (Aydae alone,  | priority search under Total Optimization (damagePerSilver) | 10.53M | beaten | 8.89M | -13.83 (any candidate: -13.83) | **no** |
| his usual setup of 2026-09-19 (Aydae alone,  | Elite Preservation | 9.17M | beaten | 8.89M | 28.43 (any candidate: 28.43) | yes |
| his usual setup of 2026-09-19 (Aydae alone,  | priority search under Elite (averageDamage) | 10.95M | beaten | 8.89M | 18.96 (any candidate: 18.96) | yes |
| his usual setup of 2026-09-19 (Aydae alone,  | priority search under Elite (damagePerSilver) | 9.17M | beaten | 8.89M | 28.43 (any candidate: 28.43) | yes |

## E. Per army, in full

### first-run army, Bear V ×10 (20 000 leadershi

- **sustain** (4 marches): bear-5 7 of 10 · authority 40,000 · leadership 20,000
- **best unsheltered** (TS re-capped (M’s Preservation) → retyped, margin 0.97): rider-1 1,525, spearman-2 1,687, spearman-1 3,034, swordsman-1 3,034, archer-2 1,678, rider-2 839, spearman-3 944, archer-1 3,005, archer-3 938, rider-3 469, bear-5 7*
- **its campaign**: dmg 21,594,072 · silver 32,529,600 · hired 4 · gold 3,840 · coins 0 · queue 2,527 h · dmg/silver 0.664 · dmg/hired 0 · dmg/gold 5,623 · dmg/coin —
- **candidates**: 15 (5 unsheltered); top five by rating vs top: TS re-capped (M’s Preservation) → retyped 21.59M / 4 hired / 8.01 · Elite 100 % → retyped 21.58M / 4 hired / 7.97 · TS re-capped (M’s Preservation) 21.54M / 4 hired / 7.76 · TS re-capped (Elite Preservation) 21.16M / 4 hired / 5.99 · Elite 100 % 21.15M / 4 hired / 5.95
- vs **SW** (dmg 20,769,608 · silver 32,525,600 · hired 4 · gold 3,200 · coins 0 · queue 2,522 h · dmg/silver 0.639 · dmg/hired 673,200 · dmg/gold 6,491 · dmg/coin —; first march swordsman-1 3,048, archer-1 3,042, spearman-1 3,036, rider-1 1,515, archer-2 1,680, spearman-2 1,677, rider-2 837, archer-3 939, spearman-3 938, rider-3 468, bear-5 6*): rating **-0.04** · candidate better on dmg, dmg/silver · worse on silver, gold, queue, dmg/hired, dmg/gold
- vs **AI** (dmg 21,290,233 · silver 36,008,300 · hired 4 · gold 4,800 · coins 0 · queue 3,423 h · dmg/silver 0.591 · dmg/hired 776,050 · dmg/gold 4,435 · dmg/coin —; first march spearman-2 3,097, spearman-3 1,739, archer-2 3,084, rider-2 1,539, archer-1 5,530, rider-3 863, archer-3 1,722, bear-5 10*): rating **8.01** · candidate better on dmg, silver, gold, queue, dmg/silver, dmg/gold · worse on dmg/hired

- journal (enemy first, kill order; HP→strikes×per-hit) **AI**: spearman-2 0.84MHP→0×0.44M · spearman-3 0.83MHP→1×0.52M · archer-2 0.83MHP→1×0.56M · rider-2 0.83MHP→1×0.55M · archer-1 0.83MHP→1×0.46M · rider-3 0.83MHP→2×0.68M · archer-3 0.83MHP→2×0.69M · bear-5* 0.66MHP→2×0.37M
- journal **candidate**: bear-5* 0.46MHP→0×0.26M · rider-1 0.46MHP→1×0.25M · spearman-2 0.46MHP→1×0.24M · swordsman-1 0.46MHP→1×0.18M · spearman-1 0.46MHP→1×0.21M · spearman-3 0.45MHP→2×0.28M · archer-2 0.45MHP→2×0.30M · rider-2 0.45MHP→2×0.30M · archer-1 0.45MHP→2×0.25M · archer-3 0.45MHP→3×0.38M · rider-3 0.45MHP→3×0.37M

### the 4 000-leadership case of 2026-09-15 (Tot

- **sustain** (4 marches): epic-monster-hunter-6 10 of 14, arbalester-6 10 of 15, legionary-6 10 of 16, chariot-6 5 of 8 · authority 2,000 · leadership 4,000
- **best unsheltered** (SS troops + sustain hired → retyped, margin 0.70): spearman-1 304, swordsman-1 298, rider-1 196, spearman-2 159, archer-1 375, archer-2 203, rider-3 57, rider-2 99, legionary-6 10*, epic-monster-hunter-6 10*, arbalester-6 10*, chariot-6 5*
- **its campaign**: dmg 4,154,472 · silver 3,082,000 · hired 16 · gold 1,120 · coins 0 · queue 188 h · dmg/silver 1.348 · dmg/hired 114,760 · dmg/gold 3,709 · dmg/coin —
- **candidates**: 17 (2 unsheltered); top five by rating vs top: SS troops + sustain hired → retyped 4.15M / 16 hired / -32.73 · SS troops + sustain hired 4.12M / 16 hired / -33.06
- vs **SS** (dmg 5,212,861 · silver 3,820,600 · hired 19 · gold 736 · coins 0 · queue 238 h · dmg/silver 1.364 · dmg/hired 189,918 · dmg/gold 7,083 · dmg/coin —; first march swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 7*, arbalester-6 5*, legionary-6 5*, chariot-6 3*): rating **-23.19** · candidate better on silver, hired, queue · worse on dmg, gold, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 8,530,502 · silver 6,087,200 · hired 21 · gold 1,176 · coins 0 · queue 381 h · dmg/silver 1.401 · dmg/hired 265,255 · dmg/gold 7,254 · dmg/coin —; first march swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413, legionary-6 11*, chariot-6 6*, epic-monster-hunter-6 10*, arbalester-6 10*): rating **-34.44** · candidate better on silver, hired, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold
- vs **AI** (dmg 8,985,057 · silver 6,085,400 · hired 24 · gold 1,336 · coins 0 · queue 381 h · dmg/silver 1.476 · dmg/hired 261,725 · dmg/gold 6,725 · dmg/coin —; first march rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, rider-2 208, archer-1 746, archer-2 414, rider-3 116, legionary-6 14*, chariot-6 8*, arbalester-6 15*, epic-monster-hunter-6 14*): rating **-32.73** · candidate better on silver, hired, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **AI**: rider-1 0.12MHP→0×0.06M · spearman-2 0.12MHP→1×0.07M · spearman-1 0.12MHP→1×0.06M · swordsman-1 0.12MHP→1×0.05M · rider-2 0.12MHP→1×0.08M · archer-1 0.12MHP→1×0.06M · archer-2 0.12MHP→2×0.08M · rider-3 0.11MHP→2×0.09M · legionary-6* 0.11MHP→2×0.12M · chariot-6* 0.09MHP→3×0.18M · arbalester-6* 0.09MHP→3×0.17M · epic-monster-hunter-6* 0.09MHP→3×0.20M
- journal **candidate**: legionary-6* 0.08MHP→0×0.09M · spearman-1 0.06MHP→1×0.03M · epic-monster-hunter-6* 0.06MHP→0×0.14M · swordsman-1 0.06MHP→1×0.03M · rider-1 0.06MHP→1×0.03M · spearman-2 0.06MHP→2×0.03M · arbalester-6* 0.06MHP→2×0.12M · chariot-6* 0.06MHP→2×0.11M · archer-1 0.06MHP→2×0.03M · archer-2 0.06MHP→3×0.04M · rider-3 0.06MHP→3×0.05M · rider-2 0.06MHP→3×0.04M

### 2026-09-17 export, its setup (7 000 leadersh

- **sustain** (4 marches): arbalester-6 38 of 50, chariot-6 14 of 20, epic-monster-hunter-6 109 of 142, legionary-6 30 of 42 · authority 2,180 · leadership 7,000
- **best unsheltered** (Elite 50 % → retyped, margin 0.71): spearman-1 1,275, spearman-2 708, rider-1 696, archer-1 1,559, rider-3 217, rider-2 384, archer-2 858, epic-monster-hunter-6 54*, arbalester-6 19*, legionary-6 15*, chariot-6 7*
- **its campaign**: dmg 14,879,236 · silver 10,954,400 · hired 44 · gold 2,880 · coins 0 · queue 740 h · dmg/silver 1.358 · dmg/hired 140,184 · dmg/gold 5,166 · dmg/coin —
- **most damage unsheltered** (Elite 100 % → retyped, margin 0.35): 20.17M, hired 80, rating vs top -35.34
- **candidates**: 35 (19 unsheltered); top five by rating vs top: Elite 50 % → retyped 14.88M / 44 hired / -29.14 · Elite 40 % → retyped 13.43M / 40 hired / -30.29 · Elite 60 % → retyped 15.43M / 52 hired / -32.52 · Elite 60 % 15.42M / 52 hired / -32.55 · Elite 50 % 14.00M / 44 hired / -32.78
- vs **HS** (dmg 15,315,363 · silver 10,187,600 · hired 26 · gold 2,112 · coins 0 · queue 683 h · dmg/silver 1.503 · dmg/hired 355,600 · dmg/gold 7,252 · dmg/coin —; first march spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740, arbalester-6 10*, chariot-6 10*, epic-monster-hunter-6 10*, legionary-6 10*): rating **-25.68** · candidate better on — · worse on dmg, silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **SS** (dmg 16,115,314 · silver 8,695,000 · hired 32 · gold 2,544 · coins 0 · queue 583 h · dmg/silver 1.853 · dmg/hired 350,864 · dmg/gold 6,335 · dmg/coin —; first march spearman-1 975, spearman-2 531, rider-2 285, rider-1 504, archer-1 1,108, rider-3 151, archer-2 592, arbalester-6 20*, chariot-6 10*, epic-monster-hunter-6 20*, legionary-6 10*): rating **-23.68** · candidate better on — · worse on dmg, silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 19,031,865 · silver 10,907,600 · hired 35 · gold 2,760 · coins 0 · queue 731 h · dmg/silver 1.745 · dmg/hired 357,360 · dmg/gold 6,896 · dmg/coin —; first march spearman-1 1,337, spearman-2 728, rider-2 391, rider-1 691, archer-1 1,520, rider-3 207, archer-2 812, arbalester-6 20*, chariot-6 10*, epic-monster-hunter-6 20*, legionary-6 20*): rating **-27.95** · candidate better on — · worse on dmg, silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **MM** (dmg 22,869,174 · silver 10,961,000 · hired 47 · gold 3,536 · coins 0 · queue 740 h · dmg/silver 2.086 · dmg/hired 345,567 · dmg/gold 6,468 · dmg/coin —; first march archer-1 1,569, spearman-2 708, spearman-1 1,269, rider-1 695, archer-2 865, rider-3 216, rider-2 383, epic-monster-hunter-6 38*, arbalester-6 40*, chariot-6 16*, legionary-6 10*): rating **-29.94** · candidate better on silver, hired, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 24,291,732 · silver 10,960,100 · hired 55 · gold 4,000 · coins 0 · queue 740 h · dmg/silver 2.216 · dmg/hired 340,059 · dmg/gold 6,073 · dmg/coin —; first march spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215, legionary-6 33*, epic-monster-hunter-6 38*, arbalester-6 40*, chariot-6 16*): rating **-29.14** · candidate better on silver, hired, gold · worse on dmg, queue, dmg/silver, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: spearman-1 0.37MHP→0×0.19M · spearman-2 0.37MHP→1×0.20M · archer-1 0.37MHP→0×0.20M · rider-1 0.36MHP→1×0.20M · rider-2 0.36MHP→1×0.22M · archer-2 0.36MHP→1×0.22M · rider-3 0.36MHP→2×0.25M · legionary-6* 0.36MHP→2×0.35M · epic-monster-hunter-6* 0.36MHP→2×0.61M · arbalester-6* 0.36MHP→3×0.53M · chariot-6* 0.32MHP→3×0.43M
- journal **candidate**: epic-monster-hunter-6* 0.51MHP→0×0.87M · spearman-1 0.37MHP→1×0.19M · spearman-2 0.37MHP→1×0.20M · rider-1 0.37MHP→1×0.20M · archer-1 0.36MHP→1×0.20M · rider-3 0.36MHP→2×0.26M · rider-2 0.36MHP→2×0.22M · archer-2 0.36MHP→2×0.22M · arbalester-6* 0.17MHP→2×0.25M · legionary-6* 0.16MHP→3×0.16M · chariot-6* 0.14MHP→3×0.19M

### 2026-09-17 export, 12 000 leadership

- **sustain** (4 marches): arbalester-6 38 of 50, chariot-6 14 of 20, epic-monster-hunter-6 109 of 142, legionary-6 30 of 42 · authority 2,180 · leadership 12,000
- **best unsheltered** (SW troops + sustain hired → retyped, margin 0.61): spearman-1 2,184, spearman-2 1,212, rider-1 1,194, archer-1 2,673, rider-3 372, rider-2 660, archer-2 1,477, epic-monster-hunter-6 109*, arbalester-6 38*, legionary-6 30*, chariot-6 14*
- **its campaign**: dmg 27,288,320 · silver 18,795,200 · hired 80 · gold 5,856 · coins 0 · queue 1,270 h · dmg/silver 1.452 · dmg/hired 154,202 · dmg/gold 4,660 · dmg/coin —
- **candidates**: 30 (14 unsheltered); top five by rating vs top: SW troops + sustain hired → retyped 27.29M / 80 hired / -18.33 · Elite 100 % → retyped 27.28M / 80 hired / -18.34 · Elite 80 % → retyped 24.71M / 68 hired / -18.53 · Elite 70 % → retyped 23.26M / 60 hired / -18.67 · Elite 90 % → retyped 25.83M / 76 hired / -19.23
- vs **HS** (dmg 22,404,202 · silver 17,808,900 · hired 30 · gold 2,408 · coins 0 · queue 1,195 h · dmg/silver 1.258 · dmg/hired 369,197 · dmg/gold 9,304 · dmg/coin —; first march spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303, arbalester-6 10*, chariot-6 10*, epic-monster-hunter-6 10*, legionary-6 10*): rating **-41.44** · candidate better on dmg, dmg/silver · worse on silver, hired, gold, queue, dmg/hired, dmg/gold
- vs **SS** (dmg 21,273,264 · silver 12,129,500 · hired 48 · gold 3,056 · coins 0 · queue 814 h · dmg/silver 1.754 · dmg/hired 297,347 · dmg/gold 6,961 · dmg/coin —; first march spearman-1 1,216, spearman-2 663, rider-2 356, rider-1 629, archer-1 1,383, rider-3 188, archer-2 739, arbalester-6 28*, chariot-6 11*, epic-monster-hunter-6 24*, legionary-6 15*): rating **-15.77** · candidate better on dmg · worse on silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 34,445,770 · silver 18,793,200 · hired 67 · gold 4,824 · coins 0 · queue 1,269 h · dmg/silver 1.833 · dmg/hired 333,911 · dmg/gold 7,140 · dmg/coin —; first march archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658, epic-monster-hunter-6 66*, legionary-6 34*, arbalester-6 40*, chariot-6 16*): rating **-28.94** · candidate better on — · worse on dmg, silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 34,617,571 · silver 20,720,700 · hired 82 · gold 5,784 · coins 0 · queue 1,811 h · dmg/silver 1.671 · dmg/hired 290,661 · dmg/gold 5,985 · dmg/coin —; first march spearman-1 3,659, spearman-2 2,032, rider-2 1,112, rider-3 624, archer-2 2,483, epic-monster-hunter-6 111*, legionary-6 34*, arbalester-6 40*, chariot-6 16*): rating **-18.33** · candidate better on silver, hired, queue · worse on dmg, gold, dmg/silver, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: spearman-1 1.05MHP→0×0.54M · spearman-2 1.05MHP→1×0.58M · rider-2 1.05MHP→1×0.64M · rider-3 1.05MHP→1×0.73M · archer-2 1.05MHP→1×0.64M · epic-monster-hunter-6* 1.04MHP→2×1.79M · legionary-6* 0.37MHP→2×0.36M · arbalester-6* 0.36MHP→2×0.53M · chariot-6* 0.32MHP→2×0.43M
- journal **candidate**: epic-monster-hunter-6* 1.02MHP→0×1.75M · spearman-1 0.63MHP→1×0.32M · spearman-2 0.63MHP→1×0.34M · rider-1 0.63MHP→1×0.34M · archer-1 0.63MHP→1×0.34M · rider-3 0.62MHP→2×0.44M · rider-2 0.62MHP→2×0.38M · archer-2 0.62MHP→2×0.38M · arbalester-6* 0.34MHP→2×0.50M · legionary-6* 0.33MHP→3×0.31M · chariot-6* 0.28MHP→3×0.38M

### live account of 2026-09-18 (one hired type, 

- **sustain** (4 marches): epic-monster-hunter-6 62 of 83 · authority 2,180 · leadership 20,000
- **best unsheltered** (SS troops + sustain hired → retyped, margin 0.81): rider-1 922, spearman-2 978, spearman-1 1,725, archer-1 2,127, rider-3 266, rider-2 463, archer-2 1,112, epic-monster-hunter-6 62*
- **its campaign**: dmg 11,973,168 · silver 14,356,800 · hired 28 · gold 1,760 · coins 0 · queue 946 h · dmg/silver 0.834 · dmg/hired 0 · dmg/gold 6,803 · dmg/coin —
- **candidates**: 15 (2 unsheltered); top five by rating vs top: SS troops + sustain hired → retyped 11.97M / 28 hired / -43.82 · SS troops + sustain hired 9.60M / 28 hired / -51.83
- vs **SS** (dmg 18,256,930 · silver 18,959,900 · hired 20 · gold 1,368 · coins 0 · queue 1,317 h · dmg/silver 0.963 · dmg/hired 309,021 · dmg/gold 13,346 · dmg/coin —; first march archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40*): rating **-42.59** · candidate better on silver, queue · worse on dmg, hired, gold, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 28,270,883 · silver 30,516,200 · hired 25 · gold 1,760 · coins 0 · queue 1,999 h · dmg/silver 0.926 · dmg/hired 317,110 · dmg/gold 16,063 · dmg/coin —; first march archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 60*): rating **-48.14** · candidate better on silver, queue · worse on dmg, hired, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 28,727,202 · silver 30,179,700 · hired 28 · gold 1,904 · coins 0 · queue 1,977 h · dmg/silver 0.952 · dmg/hired 307,403 · dmg/gold 15,088 · dmg/coin —; first march archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 68*): rating **-45.02** · candidate better on silver, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold
- vs **AI** (dmg 29,743,332 · silver 30,928,400 · hired 30 · gold 2,016 · coins 0 · queue 2,026 h · dmg/silver 0.962 · dmg/hired 304,167 · dmg/gold 14,754 · dmg/coin —; first march archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 83*): rating **-43.82** · candidate better on silver, hired, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **AI**: archer-1 1.16MHP→0×0.62M · rider-1 1.14MHP→1×0.63M · spearman-2 1.12MHP→1×0.61M · spearman-1 1.10MHP→1×0.56M · archer-2 1.07MHP→1×0.65M · rider-3 1.05MHP→2×0.73M · rider-2 1.03MHP→2×0.63M · epic-monster-hunter-6* 0.80MHP→2×1.34M
- journal **candidate**: epic-monster-hunter-6* 0.60MHP→0×1.00M · rider-1 0.54MHP→1×0.30M · spearman-2 0.53MHP→1×0.29M · spearman-1 0.52MHP→1×0.27M · archer-1 0.51MHP→1×0.27M · rider-3 0.50MHP→2×0.35M · rider-2 0.49MHP→2×0.30M · archer-2 0.48MHP→2×0.29M

### live account, evening (hunters 83, legionari

- **sustain** (4 marches): arbalester-6 45 of 60, chariot-6 7 of 10, epic-monster-hunter-6 62 of 83, legionary-6 2,180 (unlimited, housing) · authority 2,180 · leadership 11,000
- **best unsheltered** (TS re-capped (Total Optimization) → retyped, margin 0.81): spearman-1 2,215, rider-2 628, spearman-2 1,199, rider-1 1,102, rider-3 343, archer-2 1,231, archer-1 2,202, legionary-6 57*, epic-monster-hunter-6 54*, arbalester-6 45*, chariot-6 7*
- **its campaign**: dmg 31,835,684 · silver 17,238,000 · hired 72 · gold 4,832 · coins 0 · queue 1,168 h · dmg/silver 1.847 · dmg/hired 263,774 · dmg/gold 6,589 · dmg/coin —
- **most damage unsheltered** (TS re-capped (priority search under M’s (averageDamage)), margin 0.45): 35.78M, hired 860, rating vs top -449.98
- **candidates**: 37 (27 unsheltered); top five by rating vs top: TS re-capped (Total Optimization) → retyped 31.84M / 72 hired / -4.88 · TS re-capped (Total Optimization) 31.83M / 72 hired / -4.90 · TS re-capped (M’s Preservation) → retyped 31.72M / 72 hired / -5.11 · TS re-capped (M’s Preservation) 31.49M / 72 hired / -5.75 · MS-relaxed 100 % → retyped 31.94M / 76 hired / -6.02
- vs **HS** (dmg 20,528,010 · silver 15,336,600 · hired 32 · gold 2,296 · coins 0 · queue 1,013 h · dmg/silver 1.338 · dmg/hired 332,927 · dmg/gold 8,941 · dmg/coin —; first march archer-1 2,306, spearman-2 1,000, rider-1 905, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464, chariot-6 8*, legionary-6 10*, epic-monster-hunter-6 10*, arbalester-6 10*): rating **5.13** · candidate better on dmg, dmg/silver · worse on silver, hired, gold, queue, dmg/hired, dmg/gold
- vs **SS** (dmg 20,649,596 · silver 12,339,900 · hired 50 · gold 3,064 · coins 0 · queue 814 h · dmg/silver 1.673 · dmg/hired 261,252 · dmg/gold 6,739 · dmg/coin —; first march archer-1 1,680, rider-1 672, spearman-2 713, spearman-1 1,258, archer-2 862, rider-3 194, rider-2 338, arbalester-6 24*, chariot-6 4*, epic-monster-hunter-6 29*, legionary-6 25*): rating **24.81** · candidate better on dmg, dmg/silver, dmg/hired · worse on silver, hired, gold, queue, dmg/gold
- vs **SW** (dmg 29,432,388 · silver 17,071,800 · hired 61 · gold 4,056 · coins 0 · queue 1,125 h · dmg/silver 1.724 · dmg/hired 301,665 · dmg/gold 7,257 · dmg/coin —; first march archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37*, chariot-6 6*, epic-monster-hunter-6 45*, legionary-6 38*): rating **0.44** · candidate better on dmg, dmg/silver · worse on silver, hired, gold, queue, dmg/hired, dmg/gold
- vs **MM** (dmg 33,261,975 · silver 17,179,800 · hired 70 · gold 4,872 · coins 0 · queue 1,150 h · dmg/silver 1.936 · dmg/hired 313,711 · dmg/gold 6,827 · dmg/coin —; first march archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 49*, epic-monster-hunter-6 58*, arbalester-6 47*, chariot-6 8*): rating **-4.80** · candidate better on gold · worse on dmg, silver, hired, queue, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 34,103,988 · silver 17,179,800 · hired 76 · gold 5,040 · coins 0 · queue 1,150 h · dmg/silver 1.985 · dmg/hired 300,023 · dmg/gold 6,767 · dmg/coin —; first march archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322, legionary-6 52*, epic-monster-hunter-6 61*, arbalester-6 50*, chariot-6 8*): rating **-4.88** · candidate better on hired, gold · worse on dmg, silver, queue, dmg/silver, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: archer-1 0.61MHP→0×0.33M · spearman-2 0.61MHP→1×0.33M · spearman-1 0.61MHP→1×0.31M · rider-1 0.61MHP→1×0.34M · archer-2 0.61MHP→1×0.37M · rider-2 0.61MHP→2×0.37M · rider-3 0.61MHP→2×0.42M · legionary-6* 0.60MHP→2×0.56M · epic-monster-hunter-6* 0.59MHP→2×0.99M · arbalester-6* 0.46MHP→3×0.66M · chariot-6* 0.18MHP→3×0.23M
- journal **candidate**: spearman-1 0.67MHP→0×0.34M · rider-2 0.66MHP→1×0.40M · legionary-6* 0.65MHP→1×0.61M · spearman-2 0.65MHP→1×0.36M · rider-1 0.65MHP→1×0.36M · rider-3 0.65MHP→2×0.45M · archer-2 0.53MHP→2×0.32M · archer-1 0.53MHP→2×0.28M · epic-monster-hunter-6* 0.52MHP→2×0.87M · arbalester-6* 0.41MHP→3×0.60M · chariot-6* 0.16MHP→3×0.20M

### Aydae alone, 4 975 (one captain, four hired 

- **sustain** (4 marches): arbalester-6 45 of 60, chariot-6 7 of 10, epic-monster-hunter-6 62 of 83, legionary-6 2,180 (unlimited, housing) · authority 2,180 · leadership 4,975
- **best unsheltered** (Elite 10 % → retyped, margin 0.09): rider-1 383, spearman-2 424, spearman-1 761, swordsman-1 1,193, rider-2 211, archer-2 420, rider-3 118, archer-1 749, legionary-6 218*, epic-monster-hunter-6 6*, arbalester-6 4*
- **its campaign**: dmg 6,712,844 · silver 7,355,600 · hired 96 · gold 6,528 · coins 0 · queue 421 h · dmg/silver 0.913 · dmg/hired 18,756 · dmg/gold 1,028 · dmg/coin —
- **most damage unsheltered** (TS re-capped (priority search under Elite (averageDamage)), margin 0.03): 18.59M, hired 860, rating vs top -270.95
- **candidates**: 36 (23 unsheltered); top five by rating vs top: Elite 10 % → retyped 6.71M / 96 hired / -49.46 · Elite 10 % 6.40M / 96 hired / -51.10 · Elite 20 % → retyped 8.98M / 192 hired / -71.45 · Elite 20 % 8.67M / 192 hired / -73.09 · Elite 30 % → retyped 11.09M / 284 hired / -93.65
- vs **HS** (dmg 9,427,601 · silver 5,764,300 · hired 19 · gold 1,288 · coins 0 · queue 324 h · dmg/silver 1.636 · dmg/hired 325,749 · dmg/gold 7,320 · dmg/coin —; first march swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, rider-3 81, archer-2 283, rider-2 139, arbalester-6 10*, chariot-6 4*, epic-monster-hunter-6 10*, legionary-6 10*): rating **-197.48** · candidate better on — · worse on dmg, silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 15,598,199 · silver 7,684,400 · hired 37 · gold 2,440 · coins 0 · queue 500 h · dmg/silver 2.030 · dmg/hired 300,662 · dmg/gold 6,393 · dmg/coin —; first march spearman-1 1,004, archer-1 1,002, rider-2 278, rider-1 499, spearman-2 553, archer-2 552, rider-3 155, arbalester-6 26*, legionary-6 26*, epic-monster-hunter-6 24*, chariot-6 8*): rating **-121.11** · candidate better on silver, queue · worse on dmg, hired, gold, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 17,649,575 · silver 8,449,700 · hired 58 · gold 4,120 · coins 0 · queue 696 h · dmg/silver 2.089 · dmg/hired 237,879 · dmg/gold 4,284 · dmg/coin —; first march archer-1 2,058, rider-3 321, archer-2 1,138, rider-2 568, legionary-6 53*, epic-monster-hunter-6 50*, arbalester-6 50*, chariot-6 8*): rating **-83.18** · candidate better on silver, queue · worse on dmg, hired, gold, dmg/silver, dmg/hired, dmg/gold
- vs **AI** (dmg 18,750,522 · silver 11,241,200 · hired 111 · gold 7,848 · coins 0 · queue 1,425 h · dmg/silver 1.668 · dmg/hired 133,301 · dmg/gold 2,389 · dmg/coin —; first march spearman-2 1,945, rider-3 546, archer-2 1,938, legionary-6 91*, epic-monster-hunter-6 83*, arbalester-6 60*, chariot-6 10*): rating **-49.46** · candidate better on silver, hired, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **AI**: spearman-2 0.84MHP→0×0.43M · rider-3 0.84MHP→1×0.58M · archer-2 0.84MHP→1×0.50M · legionary-6* 0.83MHP→1×0.84M · epic-monster-hunter-6* 0.80MHP→1×1.34M · arbalester-6* 0.55MHP→2×0.79M · chariot-6* 0.18MHP→2×0.26M
- journal **candidate**: legionary-6* 1.99MHP→0×2.00M · rider-1 0.18MHP→1×0.10M · spearman-2 0.18MHP→1×0.09M · spearman-1 0.18MHP→1×0.09M · swordsman-1 0.18MHP→1×0.07M · rider-2 0.18MHP→2×0.11M · archer-2 0.18MHP→2×0.11M · rider-3 0.18MHP→2×0.13M · archer-1 0.18MHP→2×0.10M · epic-monster-hunter-6* 0.06MHP→3×0.10M · arbalester-6* 0.04MHP→3×0.05M

### the owner’s live camp of 2026-09-18 (arbales

- **sustain** (4 marches): arbalester-6 371 of 485, bear-5 103 (unlimited, housing), legionary-6 770 of 1,002 · authority 2,180 · leadership 4,975
- **best unsheltered** (TS re-capped (Total Optimization) → retyped, margin 0.04): spearman-1 1,001, spearman-2 553, rider-3 157, rider-2 277, rider-1 497, archer-1 1,002, archer-2 553, bear-5 61*, legionary-6 445*, arbalester-6 371*
- **its campaign**: dmg 47,134,548 · silver 7,795,600 · hired 360 · gold 58,016 · coins 0 · queue 528 h · dmg/silver 6.046 · dmg/hired 107,669 · dmg/gold 812 · dmg/coin —
- **candidates**: 23 (22 unsheltered); top five by rating vs top: TS re-capped (Total Optimization) → retyped 47.13M / 360 hired / 23.44 · TS re-capped (Total Optimization) 47.12M / 360 hired / 23.41 · Elite 60 % → retyped 40.03M / 308 hired / 8.61 · Elite 50 % → retyped 34.76M / 256 hired / 3.19 · Elite 60 % 38.26M / 308 hired / 3.01
- vs **HS** (dmg 8,260,768 · silver 7,241,900 · hired 16 · gold 1,448 · coins 0 · queue 477 h · dmg/silver 1.141 · dmg/hired 232,812 · dmg/gold 5,705 · dmg/coin —; first march archer-1 1,107, rider-1 443, spearman-2 470, spearman-1 829, archer-2 568, rider-3 127, rider-2 223, arbalester-6 10*, bear-5 2*, legionary-6 10*): rating **-742.54** · candidate better on dmg, dmg/silver · worse on silver, hired, gold, queue, dmg/hired, dmg/gold
- vs **SS** (dmg 8,393,455 · silver 6,773,900 · hired 34 · gold 5,480 · coins 0 · queue 753 h · dmg/silver 1.239 · dmg/hired 159,825 · dmg/gold 1,532 · dmg/coin —; first march rider-2 909, rider-3 501, arbalester-6 66*, bear-5 8*, legionary-6 8*): rating **75.79** · candidate better on dmg, queue, dmg/silver · worse on silver, hired, gold, dmg/hired, dmg/gold
- vs **SW** (dmg 15,862,148 · silver 9,850,300 · hired 52 · gold 6,344 · coins 0 · queue 1,025 h · dmg/silver 1.610 · dmg/hired 208,337 · dmg/gold 2,500 · dmg/coin —; first march archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370, arbalester-6 76*, legionary-6 60*, bear-5 7*): rating **-78.83** · candidate better on dmg, silver, queue, dmg/silver · worse on hired, gold, dmg/hired, dmg/gold
- vs **MM** (dmg 20,781,770 · silver 12,196,000 · hired 136 · gold 13,760 · coins 0 · queue 1,839 h · dmg/silver 1.704 · dmg/hired 144,243 · dmg/gold 1,510 · dmg/coin —; first march rider-3 2,441, arbalester-6 403*, bear-5 10*, legionary-6 10*): rating **38.54** · candidate better on dmg, silver, queue, dmg/silver · worse on hired, gold, dmg/hired, dmg/gold
- vs **MX** (dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —; first march rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*): rating **23.44** · candidate better on dmg, silver, queue, dmg/silver · worse on hired, gold, dmg/hired, dmg/gold

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: rider-3 4.59MHP→0×3.17M · arbalester-6* 3.68MHP→1×5.34M · bear-5* 3.30MHP→1×1.94M · legionary-6* 2.46MHP→1×2.31M
- journal **candidate**: bear-5* 5.76MHP→0×3.38M · legionary-6* 5.10MHP→1×4.78M · arbalester-6* 3.38MHP→1×4.91M · spearman-1 0.30MHP→1×0.15M · spearman-2 0.30MHP→1×0.16M · rider-3 0.30MHP→2×0.20M · rider-2 0.29MHP→2×0.18M · rider-1 0.29MHP→2×0.16M · archer-1 0.24MHP→2×0.13M · archer-2 0.24MHP→3×0.14M

### his camp of 2026-09-19, the localStorage dum

- **sustain** (4 marches): epic-monster-hunter-6 345 of 450 · authority 2,180 · leadership 4,975
- **best unsheltered** (Elite 10 %, margin 0.84): archer-1 1,158, spearman-1 918, rider-1 470, archer-2 639, spearman-2 508, rider-2 260, rider-3 146, epic-monster-hunter-6 34*
- **its campaign**: dmg 5,904,308 · silver 7,770,800 · hired 16 · gold 960 · coins 0 · queue 520 h · dmg/silver 0.760 · dmg/hired 0 · dmg/gold 6,150 · dmg/coin —
- **most damage unsheltered** (MM troops + sustain hired, margin 0.51): 8.32M, hired 140, rating vs top -58.94
- **candidates**: 17 (15 unsheltered); top five by rating vs top: Elite 10 % 5.90M / 16 hired / -28.98 · Elite 20 % 5.90M / 28 hired / -32.55 · Elite 30 % 5.90M / 44 hired / -36.55 · Elite 40 % 5.90M / 56 hired / -40.12 · Elite 50 % 5.90M / 72 hired / -44.12
- vs **HS** (dmg 6,638,052 · silver 7,723,100 · hired 6 · gold 392 · coins 0 · queue 510 h · dmg/silver 0.860 · dmg/hired 296,617 · dmg/gold 16,934 · dmg/coin —; first march archer-1 1,208, spearman-2 523, spearman-1 923, rider-1 464, archer-2 620, rider-3 139, rider-2 243, epic-monster-hunter-6 9*): rating **-73.54** · candidate better on — · worse on dmg, silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **SS** (dmg 7,561,467 · silver 7,313,300 · hired 12 · gold 848 · coins 0 · queue 627 h · dmg/silver 1.034 · dmg/hired 318,189 · dmg/gold 8,917 · dmg/coin —; first march spearman-2 719, rider-3 203, rider-2 354, rider-1 625, archer-2 835, epic-monster-hunter-6 30*): rating **-32.05** · candidate better on queue · worse on dmg, silver, hired, gold, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 9,367,909 · silver 8,747,300 · hired 15 · gold 1,016 · coins 0 · queue 760 h · dmg/silver 1.071 · dmg/hired 306,324 · dmg/gold 9,220 · dmg/coin —; first march spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057, epic-monster-hunter-6 38*): rating **-34.18** · candidate better on silver, gold, queue · worse on dmg, hired, dmg/silver, dmg/hired, dmg/gold
- vs **MM** (dmg 14,142,349 · silver 10,354,100 · hired 57 · gold 3,944 · coins 0 · queue 1,222 h · dmg/silver 1.366 · dmg/hired 164,062 · dmg/gold 3,586 · dmg/coin —; first march spearman-2 3,104, rider-3 894, epic-monster-hunter-6 174*): rating **-22.31** · candidate better on silver, hired, gold, queue, dmg/gold · worse on dmg, dmg/silver, dmg/hired
- vs **MX** (dmg 23,589,127 · silver 13,043,800 · hired 148 · gold 10,480 · coins 0 · queue 2,174 h · dmg/silver 1.808 · dmg/hired 159,386 · dmg/gold 2,251 · dmg/coin —; first march rider-3 2,390, epic-monster-hunter-6 374*): rating **-28.98** · candidate better on silver, hired, gold, queue, dmg/gold · worse on dmg, dmg/silver, dmg/hired

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: rider-3 4.50MHP→0×3.11M · epic-monster-hunter-6* 3.60MHP→1×6.05M
- journal **candidate**: epic-monster-hunter-6* 0.33MHP→0×0.55M · archer-1 0.28MHP→0×0.15M · spearman-1 0.28MHP→1×0.14M · rider-1 0.28MHP→1×0.15M · archer-2 0.28MHP→1×0.17M · spearman-2 0.28MHP→2×0.15M · rider-2 0.28MHP→2×0.17M · rider-3 0.27MHP→2×0.19M

### his camp of 2026-09-19, as his message reads

- **sustain** (4 marches): epic-monster-hunter-6 90 of 120 · authority 2,200 · leadership 5,100
- **best unsheltered** (Elite 40 %, margin 0.81): archer-1 1,187, spearman-1 942, rider-1 482, archer-2 656, spearman-2 521, rider-2 266, rider-3 149, epic-monster-hunter-6 36*
- **its campaign**: dmg 6,045,332 · silver 7,964,000 · hired 16 · gold 1,024 · coins 0 · queue 532 h · dmg/silver 0.759 · dmg/hired 0 · dmg/gold 5,904 · dmg/coin —
- **most damage unsheltered** (SW troops + sustain hired → retyped, margin 0.56): 7.08M, hired 36, rating vs top -30.83
- **candidates**: 18 (12 unsheltered); top five by rating vs top: Elite 40 % 6.05M / 16 hired / -16.13 · Elite 50 % 6.05M / 20 hired / -19.85 · Elite 60 % 6.05M / 24 hired / -23.58 · Elite 70 % 6.05M / 28 hired / -27.30 · SW troops + sustain hired → retyped 7.08M / 36 hired / -30.83
- vs **HS** (dmg 7,403,726 · silver 8,072,700 · hired 15 · gold 1,056 · coins 0 · queue 747 h · dmg/silver 0.917 · dmg/hired 190,913 · dmg/gold 7,011 · dmg/coin —; first march spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166, epic-monster-hunter-6 10*): rating **-18.09** · candidate better on silver, gold, queue · worse on dmg, hired, dmg/silver, dmg/hired, dmg/gold
- vs **SS** (dmg 8,331,637 · silver 7,741,400 · hired 18 · gold 1,248 · coins 0 · queue 657 h · dmg/silver 1.076 · dmg/hired 210,328 · dmg/gold 6,676 · dmg/coin —; first march archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 20*): rating **-21.73** · candidate better on hired, gold, queue · worse on dmg, silver, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 11,049,924 · silver 9,468,000 · hired 25 · gold 1,792 · coins 0 · queue 965 h · dmg/silver 1.167 · dmg/hired 258,218 · dmg/gold 6,166 · dmg/coin —; first march spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116, epic-monster-hunter-6 50*): rating **-25.22** · candidate better on silver, hired, gold, queue · worse on dmg, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 11,198,137 · silver 10,310,100 · hired 39 · gold 2,808 · coins 0 · queue 1,255 h · dmg/silver 1.086 · dmg/hired 161,791 · dmg/gold 3,988 · dmg/coin —; first march spearman-2 1,787, rider-3 514, rider-2 913, epic-monster-hunter-6 100*): rating **-15.52** · candidate better on silver, hired, gold, queue, dmg/gold · worse on dmg, dmg/silver, dmg/hired
- vs **AI** (dmg 11,587,344 · silver 10,702,600 · hired 41 · gold 2,888 · coins 0 · queue 1,304 h · dmg/silver 1.083 · dmg/hired 158,634 · dmg/gold 4,012 · dmg/coin —; first march spearman-2 1,962, rider-3 565, rider-2 1,004, epic-monster-hunter-6 110*): rating **-16.13** · candidate better on silver, hired, gold, queue, dmg/gold · worse on dmg, dmg/silver, dmg/hired

- journal (enemy first, kill order; HP→strikes×per-hit) **AI**: spearman-2 1.07MHP→0×0.58M · rider-3 1.06MHP→1×0.73M · rider-2 1.06MHP→1×0.65M · epic-monster-hunter-6* 1.06MHP→1×1.78M
- journal **candidate**: epic-monster-hunter-6* 0.35MHP→0×0.58M · archer-1 0.28MHP→0×0.15M · spearman-1 0.28MHP→1×0.15M · rider-1 0.28MHP→1×0.16M · archer-2 0.28MHP→1×0.17M · spearman-2 0.28MHP→2×0.15M · rider-2 0.28MHP→2×0.17M · rider-3 0.28MHP→2×0.19M

### his TotalStack profile of 2026-09-19 (5 225 

- **sustain** (4 marches): epic-monster-hunter-5 60 of 80 · authority 2,120 · leadership 5,225
- **best unsheltered** (Elite 70 % → retyped, margin 0.89): spearman-1 801, spearman-2 445, rider-1 400, swordsman-1 1,256, archer-2 442, rider-2 221, rider-3 124, archer-1 786, epic-monster-hunter-5 42*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*
- **its campaign**: dmg 6,759,032 · silver 7,992,800 · hired 20 · gold 1,184 · coins 3,840 · queue 487 h · dmg/silver 0.846 · dmg/hired 0 · dmg/gold 5,709 · dmg/coin 1,760
- **most damage unsheltered** (SW troops + sustain hired → retyped, margin 0.83): 7.12M, hired 24, rating vs top -15.93
- **candidates**: 21 (13 unsheltered); top five by rating vs top: Elite 70 % → retyped 6.76M / 20 hired / -8.60 · Elite 70 % 6.74M / 20 hired / -8.82 · Elite 80 % → retyped 6.76M / 20 hired / -11.03 · Elite 80 % 6.74M / 20 hired / -11.25 · SW troops + sustain hired → retyped 7.12M / 24 hired / -15.93
- vs **SS** (dmg 4,919,095 · silver 4,431,600 · hired 7 · gold 480 · coins 3,840 · queue 279 h · dmg/silver 1.110 · dmg/hired 131,856 · dmg/gold 10,248 · dmg/coin 1,281; first march swordsman-1 515, rider-1 160, archer-1 313, spearman-2 171, spearman-1 301, rider-3 46, archer-2 161, rider-2 79, battle-boar 4*, emerald-dragon 4*, stone-gargoyle 3*, water-elemental 7*, epic-monster-hunter-5 10*): rating **-47.01** · candidate better on dmg, dmg/coin · worse on silver, hired, gold, queue, dmg/silver, dmg/hired, dmg/gold
- vs **SW** (dmg 8,250,733 · silver 8,344,200 · hired 19 · gold 1,320 · coins 3,840 · queue 571 h · dmg/silver 0.989 · dmg/hired 109,005 · dmg/gold 6,251 · dmg/coin 2,149; first march spearman-1 1,053, spearman-2 586, archer-1 1,048, rider-2 292, rider-1 524, archer-2 580, rider-3 163, epic-monster-hunter-5 49*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*): rating **-15.86** · candidate better on silver, gold, queue · worse on dmg, hired, dmg/silver, dmg/hired, dmg/gold, dmg/coin
- vs **MX** (dmg 8,443,234 · silver 8,706,000 · hired 25 · gold 1,584 · coins 3,840 · queue 660 h · dmg/silver 0.970 · dmg/hired 100,404 · dmg/gold 5,330 · dmg/coin 2,199; first march spearman-2 733, archer-2 732, rider-2 365, archer-1 1,310, rider-1 654, rider-3 204, epic-monster-hunter-5 62*, water-elemental 10*, battle-boar 4*, stone-gargoyle 3*, emerald-dragon 3*): rating **-8.60** · candidate better on silver, hired, gold, queue, dmg/gold · worse on dmg, dmg/silver, dmg/hired, dmg/coin

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: spearman-2 0.32MHP→0×0.15M · archer-2 0.32MHP→1×0.17M · rider-2 0.32MHP→1×0.17M · archer-1 0.32MHP→1×0.15M · rider-1 0.32MHP→1×0.15M · rider-3 0.32MHP→2×0.20M · epic-monster-hunter-5* 0.32MHP→2×0.35M · water-elemental* 0.06MHP→2×0.05M · battle-boar* 0.05MHP→2×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M
- journal **candidate**: epic-monster-hunter-5* 0.22MHP→0×0.24M · spearman-1 0.20MHP→1×0.08M · spearman-2 0.20MHP→1×0.09M · rider-1 0.20MHP→1×0.09M · swordsman-1 0.19MHP→1×0.08M · archer-2 0.19MHP→2×0.11M · rider-2 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.12M · archer-1 0.19MHP→2×0.09M · water-elemental* 0.06MHP→3×0.05M · battle-boar* 0.05MHP→3×0.04M · stone-gargoyle* 0.05MHP→3×0.04M · emerald-dragon* 0.04MHP→3×0.04M

### his usual setup of 2026-09-19 (Aydae alone, 

- **sustain** (4 marches): epic-monster-hunter-6 69 of 90 · authority 2,000 · leadership 5,200
- **best unsheltered** (Elite 30 % → retyped, margin 0.98): rider-1 400, spearman-1 797, spearman-2 442, swordsman-1 1,243, archer-2 440, rider-2 220, archer-1 789, rider-3 123, epic-monster-hunter-6 20*, water-elemental 18*, battle-boar 8*, emerald-dragon 7*, stone-gargoyle 6*
- **its campaign**: dmg 8,890,808 · silver 7,990,000 · hired 8 · gold 576 · coins 4,320 · queue 490 h · dmg/silver 1.113 · dmg/hired 0 · dmg/gold 15,435 · dmg/coin 2,058
- **most damage unsheltered** (MX troops + sustain hired, margin 0.47): 9.30M, hired 28, rating vs top -70.78
- **candidates**: 27 (18 unsheltered); top five by rating vs top: Elite 30 % → retyped 8.89M / 8 hired / -7.78 · Elite 30 % 8.57M / 8 hired / -10.48 · Elite 40 % → retyped 8.89M / 12 hired / -18.25 · Elite 40 % 8.57M / 12 hired / -20.95 · Elite 50 % → retyped 8.89M / 16 hired / -28.71
- vs **HS** (dmg 8,183,996 · silver 6,127,800 · hired 5 · gold 352 · coins 3,960 · queue 375 h · dmg/silver 1.336 · dmg/hired 317,110 · dmg/gold 23,250 · dmg/coin 2,067; first march swordsman-1 902, spearman-2 313, archer-1 553, rider-1 271, spearman-1 531, archer-2 289, rider-2 141, rider-3 78, battle-boar 7*, emerald-dragon 6*, stone-gargoyle 5*, water-elemental 10*, epic-monster-hunter-6 10*): rating **-24.07** · candidate better on dmg · worse on silver, hired, gold, coins, queue, dmg/silver, dmg/hired, dmg/gold, dmg/coin
- vs **SW** (dmg 11,485,771 · silver 8,092,800 · hired 8 · gold 544 · coins 5,760 · queue 507 h · dmg/silver 1.419 · dmg/hired 422,679 · dmg/gold 21,114 · dmg/coin 1,994; first march swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123, stone-gargoyle 12*, epic-monster-hunter-6 19*, emerald-dragon 13*, battle-boar 1*, water-elemental 2*): rating **-20.31** · candidate better on silver, coins, queue, dmg/coin · worse on dmg, gold, dmg/silver, dmg/hired, dmg/gold
- vs **MX** (dmg 11,756,170 · silver 8,698,800 · hired 14 · gold 808 · coins 4,320 · queue 663 h · dmg/silver 1.351 · dmg/hired 265,799 · dmg/gold 14,550 · dmg/coin 2,721; first march spearman-2 730, rider-2 364, archer-2 726, rider-1 653, archer-1 1,300, rider-3 203, epic-monster-hunter-6 32*, water-elemental 18*, battle-boar 8*, emerald-dragon 7*, stone-gargoyle 6*): rating **-7.78** · candidate better on silver, hired, gold, queue, dmg/gold · worse on dmg, dmg/silver, dmg/hired, dmg/coin

- journal (enemy first, kill order; HP→strikes×per-hit) **MX**: spearman-2 0.32MHP→0×0.16M · rider-2 0.31MHP→1×0.19M · archer-2 0.31MHP→1×0.19M · rider-1 0.31MHP→1×0.17M · archer-1 0.31MHP→1×0.17M · rider-3 0.31MHP→2×0.22M · epic-monster-hunter-6* 0.31MHP→2×0.52M · water-elemental* 0.10MHP→2×0.08M · battle-boar* 0.10MHP→2×0.08M · emerald-dragon* 0.09MHP→3×0.09M · stone-gargoyle* 0.09MHP→3×0.09M
- journal **candidate**: epic-monster-hunter-6* 0.19MHP→0×0.32M · rider-1 0.19MHP→1×0.10M · spearman-1 0.19MHP→1×0.09M · spearman-2 0.19MHP→1×0.10M · swordsman-1 0.19MHP→1×0.07M · archer-2 0.19MHP→2×0.11M · rider-2 0.19MHP→2×0.11M · archer-1 0.19MHP→2×0.10M · rider-3 0.19MHP→2×0.13M · water-elemental* 0.10MHP→3×0.08M · battle-boar* 0.10MHP→2×0.08M · emerald-dragon* 0.09MHP→3×0.09M · stone-gargoyle* 0.09MHP→3×0.09M

