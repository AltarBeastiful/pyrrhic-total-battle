
## The four answers, as the app draws them

`leftOut` = 44 — the plans on the frontier the bar does not offer.

| pick | damage a march | silver a march | hired burned | damage a silver | damage a hired |
|---|---|---|---|---|---|
| `spare-the-stock` | **4,262,790** | 2,252,000 | 12 | 1.89 | 355233 |
| `sweet-spot` | **5,333,606** | 2,252,000 | 17 | 2.37 | 313742 |
| `best-for-silver` | **6,905,207** | 2,331,500 | 22 | 2.96 | 313873 |
| `most-damage` | **6,920,621** | 2,354,500 | 22 | 2.94 | 314574 |

## What the whole curve offers, level by level

`CampaignPlan.curve`: one row per silver level the search reached, each holding the best damage found
at that level (`damage`) and what it burned for it (`mercLost`), plus the most damage a mercenary
found there (`thrifty*`).

| silver | damage | damage a silver | hired burned | damage a hired | best mercenary: damage | burned |
|---|---|---|---|---|---|---|
| 3,044,500 | 11,188,689 | 3.68 | 57 | 196293 | 7,997,175 | 33 |
| 3,695,400 | 13,894,972 | 3.76 | 75 | 185266 | 8,547,459 | 33 |
| 4,266,800 | 17,248,557 | 4.04 | 89 | 193804 | 10,378,863 | 38 |
| 5,283,100 | 18,693,573 | 3.54 | 94 | 198868 | 10,444,158 | 33 |
| 6,455,100 | 19,640,476 | 3.04 | 83 | 236632 | 11,107,563 | 33 |
| 7,701,200 | 22,353,867 | 2.90 | 86 | 259929 | 12,242,490 | 33 |
| 9,217,400 | 26,294,937 | 2.85 | 89 | 295449 | 12,093,237 | 33 |
| 9,398,300 | 26,459,319 | 2.82 | 89 | 297296 | 13,172,751 | 38 |
The curve is bucketed by **silver**, and each level is the best the search reached *there*, so a level
whose burn is lower than the level below it is a plan that spends more silver and less stock — the two
resources do not move together, which is the whole reason the trade exists.
