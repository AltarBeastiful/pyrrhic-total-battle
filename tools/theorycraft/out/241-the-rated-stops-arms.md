# The rated stops — step 2, the arms

experiment: 241 step 2 · armies: 21 · markerRates: {"silver":5,"gold":5,"hired":5,"dragonCoins":8,"seconds":40} · fifthStop: {"damageFloor":0.8,"goldTolerance":0,"silverFloor":1,"mercFloor":1,"dropTypes":3,"trims":2}

`CampaignInput.ratedStops` against HEAD (the option off). **R2** looks at the stop's burn and one chunk under, **R3** one chunk over as well; **P0** the band, **P1** the band plus the types-out family; **f95** keeps 95 % of the stop's damage; `>n` is `minRating`; **tb**: the thrifty stop reads the sweet spot as it was before the rated stops. A stop is matched by its name; `rating` is `rate(HEAD, arm, markerRates)` on the repeated march. **Worse**: a stop rated < 0 against HEAD, or gone (unless its march is now another stop's). **Readings lost**: any of the bar's ten readings below HEAD's. Pass bar (§5): 0 worse and 0 readings lost.

## Summary

| arm | stops moved | better | worse | readings lost | bars whose count changed | burn moved | plan ms HEAD → arm |
|---|---:|---:|---:|---:|---:|---:|---:|
| R2·P0·>0 | 8 | 5 | 2 | 1 | 3 | 1 | 2071 → 2064 |
| R2·P0·>1 | 6 | 3 | 2 | 1 | 3 | 1 | 2071 → 2165 |
| R2·P0·>2 | 6 | 3 | 2 | 1 | 3 | 1 | 2071 → 2005 |
| R2·P0·>5 | 2 | 1 | 1 | 1 | 1 | 0 | 2071 → 2142 |
| R2·P0·f95·>0 | 4 | 3 | 0 | 0 | 1 | 0 | 2071 → 2062 |
| R2·P0·f95·>1 | 2 | 1 | 0 | 0 | 1 | 0 | 2071 → 2038 |
| R2·P0·f95·>2 | 2 | 1 | 0 | 0 | 1 | 0 | 2071 → 2047 |
| R2·P0·f95·>5 | 0 | 0 | 0 | 0 | 0 | 0 | 2071 → 2004 |
| R2·P1·>0 | 13 | 10 | 2 | 1 | 3 | 6 | 2071 → 2009 |
| R2·P1·>1 | 11 | 8 | 2 | 1 | 3 | 6 | 2071 → 2059 |
| R2·P1·>2 | 10 | 7 | 2 | 1 | 3 | 5 | 2071 → 2017 |
| R2·P1·>5 | 5 | 4 | 1 | 1 | 1 | 3 | 2071 → 2052 |
| R2·P1·f95·>0 | 9 | 7 | 1 | 1 | 2 | 3 | 2071 → 2035 |
| R2·P1·f95·>1 | 7 | 5 | 1 | 1 | 2 | 3 | 2071 → 2051 |
| R2·P1·f95·>2 | 6 | 4 | 1 | 1 | 2 | 2 | 2071 → 2082 |
| R2·P1·f95·>5 | 3 | 2 | 1 | 1 | 1 | 1 | 2071 → 1997 |
| R3·P0·>0 | 8 | 5 | 2 | 1 | 3 | 1 | 2071 → 2021 |
| R3·P0·>1 | 6 | 3 | 2 | 1 | 3 | 1 | 2071 → 2016 |
| R3·P0·>2 | 6 | 3 | 2 | 1 | 3 | 1 | 2071 → 2098 |
| R3·P0·>5 | 4 | 2 | 2 | 1 | 2 | 1 | 2071 → 2012 |
| R3·P0·f95·>0 | 4 | 3 | 0 | 0 | 1 | 0 | 2071 → 2022 |
| R3·P0·f95·>1 | 2 | 1 | 0 | 0 | 1 | 0 | 2071 → 2055 |
| R3·P0·f95·>2 | 2 | 1 | 0 | 0 | 1 | 0 | 2071 → 2033 |
| R3·P0·f95·>5 | 0 | 0 | 0 | 0 | 0 | 0 | 2071 → 2052 |
| R3·P1·>0 | 13 | 10 | 2 | 1 | 3 | 6 | 2071 → 2066 |
| R3·P1·>1 | 11 | 8 | 2 | 1 | 3 | 6 | 2071 → 2034 |
| R3·P1·>2 | 10 | 7 | 2 | 1 | 3 | 5 | 2071 → 2064 |
| R3·P1·>5 | 5 | 4 | 1 | 1 | 1 | 3 | 2071 → 2044 |
| R3·P1·f95·>0 | 9 | 7 | 1 | 1 | 2 | 3 | 2071 → 1953 |
| R3·P1·f95·>1 | 7 | 5 | 1 | 1 | 2 | 3 | 2071 → 2016 |
| R3·P1·f95·>2 | 6 | 4 | 1 | 1 | 2 | 2 | 2071 → 1994 |
| R3·P1·f95·>5 | 3 | 2 | 1 | 1 | 1 | 1 | 2071 → 1967 |
| R2·P0·>0·tb | 6 | 5 | 1 | 0 | 0 | 1 | 2071 → 2001 |
| R2·P0·>1·tb | 4 | 3 | 1 | 0 | 0 | 1 | 2071 → 1969 |
| R2·P0·>2·tb | 4 | 3 | 1 | 0 | 0 | 1 | 2071 → 2016 |
| R2·P0·>5·tb | 1 | 1 | 0 | 0 | 0 | 0 | 2071 → 2010 |
| R2·P0·f95·>0·tb | 4 | 3 | 1 | 0 | 0 | 0 | 2071 → 1955 |
| R2·P0·f95·>1·tb | 2 | 1 | 1 | 0 | 0 | 0 | 2071 → 2021 |
| R2·P0·f95·>2·tb | 2 | 1 | 1 | 0 | 0 | 0 | 2071 → 2037 |
| R2·P0·f95·>5·tb | 0 | 0 | 0 | 0 | 0 | 0 | 2071 → 2008 |
| R2·P1·>0·tb | 10 | 9 | 1 | 0 | 0 | 5 | 2071 → 2009 |
| R2·P1·>1·tb | 8 | 7 | 1 | 0 | 0 | 5 | 2071 → 2028 |
| R2·P1·>2·tb | 7 | 6 | 1 | 0 | 0 | 4 | 2071 → 2003 |
| R2·P1·>5·tb | 3 | 3 | 0 | 0 | 0 | 2 | 2071 → 1981 |
| R2·P1·f95·>0·tb | 8 | 7 | 1 | 0 | 0 | 3 | 2071 → 2126 |
| R2·P1·f95·>1·tb | 6 | 5 | 1 | 0 | 0 | 3 | 2071 → 2096 |
| R2·P1·f95·>2·tb | 5 | 4 | 1 | 0 | 0 | 2 | 2071 → 2073 |
| R2·P1·f95·>5·tb | 2 | 2 | 0 | 0 | 0 | 1 | 2071 → 2044 |
| R3·P0·>0·tb | 6 | 5 | 1 | 0 | 0 | 1 | 2071 → 2033 |
| R3·P0·>1·tb | 4 | 3 | 1 | 0 | 0 | 1 | 2071 → 1970 |
| R3·P0·>2·tb | 4 | 3 | 1 | 0 | 0 | 1 | 2071 → 2009 |
| R3·P0·>5·tb | 2 | 2 | 0 | 0 | 0 | 1 | 2071 → 2014 |
| R3·P0·f95·>0·tb | 4 | 3 | 1 | 0 | 0 | 0 | 2071 → 1991 |
| R3·P0·f95·>1·tb | 2 | 1 | 1 | 0 | 0 | 0 | 2071 → 1985 |
| R3·P0·f95·>2·tb | 2 | 1 | 1 | 0 | 0 | 0 | 2071 → 2024 |
| R3·P0·f95·>5·tb | 0 | 0 | 0 | 0 | 0 | 0 | 2071 → 1941 |
| R3·P1·>0·tb | 10 | 9 | 1 | 0 | 0 | 5 | 2071 → 2038 |
| R3·P1·>1·tb | 8 | 7 | 1 | 0 | 0 | 5 | 2071 → 2033 |
| R3·P1·>2·tb | 7 | 6 | 1 | 0 | 0 | 4 | 2071 → 2021 |
| R3·P1·>5·tb | 3 | 3 | 0 | 0 | 0 | 2 | 2071 → 2047 |
| R3·P1·f95·>0·tb | 8 | 7 | 1 | 0 | 0 | 3 | 2071 → 1977 |
| R3·P1·f95·>1·tb | 6 | 5 | 1 | 0 | 0 | 3 | 2071 → 2023 |
| R3·P1·f95·>2·tb | 5 | 4 | 1 | 0 | 0 | 2 | 2071 → 2046 |
| R3·P1·f95·>5·tb | 2 | 2 | 0 | 0 | 0 | 1 | 2071 → 2042 |

## Every arm, every move

### R2·P0·>0

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 6,839,713 (-31.6 %) | -25.5 % | 3 → 2 | -73.7 % | -76.9 % | -61.0 % | 6.0 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P0·>1

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 6,839,713 (-31.6 %) | -25.5 % | 3 → 2 | -73.7 % | -76.9 % | -61.0 % | 6.0 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P0·>2

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 6,839,713 (-31.6 %) | -25.5 % | 3 → 2 | -73.7 % | -76.9 % | -61.0 % | 6.0 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P0·>5

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P0·f95·>0

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |

### R2·P0·f95·>1

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R2·P0·f95·>2

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R2·P0·f95·>5

No stop moved.

### R2·P1·>0

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | thrifty | **new** | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·>1

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | thrifty | **new** | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·>2

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | thrifty | **new** | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·>5

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·f95·>0

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·f95·>1

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·f95·>2

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P1·f95·>5

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P0·>0

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P0·>1

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P0·>2

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P0·>5

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | **gone** | | | | | | |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P0·f95·>0

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |

### R3·P0·f95·>1

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R3·P0·f95·>2

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R3·P0·f95·>5

No stop moved.

### R3·P1·>0

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | thrifty | **new** | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·>1

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | thrifty | **new** | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·>2

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | thrifty | **new** | | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·>5

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-13.json | thrifty | 9,471,089 → 7,015,298 (-25.9 %) | -17.9 % | 4 → 2 | -40.8 % | -31.7 % | -44.8 % | 0.9 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·f95·>0

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·f95·>1

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·f95·>2

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | gone, its march now another stop | | | | | | |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R3·P1·f95·>5

Readings lost: export · pyrrhic-my-account-2026-10-14.json · dmg/merc

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |
| export · pyrrhic-my-account-2026-10-14.json | thrifty | **gone** | | | | | | |

### R2·P0·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 6,839,713 (-31.6 %) | -25.5 % | 3 → 2 | -73.7 % | -76.9 % | -61.0 % | 6.0 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R2·P0·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 6,839,713 (-31.6 %) | -25.5 % | 3 → 2 | -73.7 % | -76.9 % | -61.0 % | 6.0 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R2·P0·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 6,839,713 (-31.6 %) | -25.5 % | 3 → 2 | -73.7 % | -76.9 % | -61.0 % | 6.0 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R2·P0·>5·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R2·P0·f95·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |

### R2·P0·f95·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R2·P0·f95·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R2·P0·f95·>5·tb

No stop moved.

### R2·P1·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·>5·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·f95·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·f95·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·f95·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R2·P1·f95·>5·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,124,389 (+3.4 %) | +5.1 % | 9 → 8 | -40.3 % | 0.0 % | -65.8 % | 14.3 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P0·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R3·P0·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R3·P0·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R3·P0·>5·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 9,524,713 (-4.8 %) | -11.4 % | 3 → 4 | -45.1 % | -46.2 % | -31.6 % | 6.4 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 8,333,649 (-14.8 %) | -15.3 % | 3 → 3 | -56.1 % | -49.0 % | -41.7 % | 6.7 |

### R3·P0·f95·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |

### R3·P0·f95·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R3·P0·f95·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |

### R3·P0·f95·>5·tb

No stop moved.

### R3·P1·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | sweet-spot | 2,104,714 → 2,003,410 (-4.8 %) | +0.0 % | 5 → 4 | -18.2 % | +0.0 % | +0.0 % | 2.8 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·>5·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| export · pyrrhic-my-account-2026-10-13.json | sweet-spot | 10,002,509 → 7,592,429 (-24.1 %) | -20.2 % | 3 → 2 | -65.5 % | -53.8 % | -51.3 % | 7.7 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·f95·>0·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | steady-max | 25,860,303 → 24,798,350 (-4.1 %) | -4.7 % | 8 → 8 | -15.7 % | -7.7 % | -12.8 % | 1.2 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | more-mercs | 397,782,216 → 396,240,512 (-0.4 %) | -1.2 % | 7 → 7 | -0.1 % | -3.8 % | -1.1 % | 0.4 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·f95·>1·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | steady-max | 2,168,812 → 2,146,300 (-1.0 %) | +0.0 % | 7 → 6 | -1.8 % | +0.0 % | +0.0 % | 2.2 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·f95·>2·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | thrifty | 282,129,906 → 268,217,154 (-4.9 %) | -2.4 % | 5 → 5 | +0.0 % | -0.8 % | -2.5 % | -4.3 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | sweet-spot | 283,093,746 → 282,129,906 (-0.3 %) | -17.7 % | 5 → 5 | +0.0 % | +0.0 % | -18.5 % | 3.7 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | steady-max | 3,031,810 → 2,967,094 (-2.1 %) | +0.0 % | 4 → 3 | -3.6 % | +0.0 % | +0.0 % | 3.6 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

### R3·P1·f95·>5·tb

| army | stop | damage | silver | burn | gold | coins | queue | rating |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | silver-saver | 2,054,337 → 2,537,449 (+23.5 %) | +5.1 % | 9 → 10 | -35.9 % | 0.0 % | -65.8 % | 29.1 |
| export · pyrrhic-my-account-2026-10-14.json | sweet-spot | 9,778,542 → 9,346,061 (-4.4 %) | -15.0 % | 3 → 3 | -35.7 % | -37.0 % | -33.2 % | 11.2 |

