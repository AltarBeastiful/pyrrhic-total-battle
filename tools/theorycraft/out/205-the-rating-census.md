# 205 — the rating census

W22 SPEED-01. Run 2026-10-11: Generate + the advisor's passes, in-process on the profile kernel; sizes SPEED-02.


## Exactness fixture (owner export 2026-09-17)

420 Tight raise searches.

| | total | per Tight raise |
|---|---:|---:|
| `raiseScore` calls (battles, the plan's own included) | 22,036 | 52.5 |
| `raiseRating` calls | 7,745 | 18.4 |
| of which on a memo hit (no battle just before) | 376 | 0.9 |
| ratings asking for the same counts as the `raiseScore` just before | 7,745 | 18.4 |
| — as a share of all ratings | 100.0 % | |
| — as a share of ratings that follow a battle (misses) | 105.1 % | |

### Types changed between consecutive ratings

| changed | ratings | share |
|---|---:|---:|
| 0 | 376 | 5.1 % |
| 1 | 5,833 | 78.9 % |
| 2 | 1,001 | 13.5 % |
| 3+ | 184 | 2.5 % |
| (first rating of a search, no predecessor) | 351 | |

### `recoveryOf`

78,585 stacks billed over all calls (the plan's own bill included); **65,820** (83.8 %) had the same count of their type in the previous call of the same search.

## Timing fixture (`pyrrhic-my-account-2026-10-11.json`, not committed)

921 Tight raise searches.

| | total | per Tight raise |
|---|---:|---:|
| `raiseScore` calls (battles, the plan's own included) | 22,451,334 | 24,377.1 |
| `raiseRating` calls | 35,061,122 | 38,068.5 |
| of which on a memo hit (no battle just before) | 12,643,721 | 13,728.3 |
| ratings asking for the same counts as the `raiseScore` just before | 22,419,203 | 24,342.2 |
| — as a share of all ratings | 63.9 % | |
| — as a share of ratings that follow a battle (misses) | 100.0 % | |

### Types changed between consecutive ratings

| changed | ratings | share |
|---|---:|---:|
| 0 | 17,322 | 0.0 % |
| 1 | 32,421,401 | 92.5 % |
| 2 | 2,483,416 | 7.1 % |
| 3+ | 138,214 | 0.4 % |
| (first rating of a search, no predecessor) | 769 | |

### `recoveryOf`

405,055,687 stacks billed over all calls (the plan's own bill included); **367,223,573** (90.7 %) had the same count of their type in the previous call of the same search.
