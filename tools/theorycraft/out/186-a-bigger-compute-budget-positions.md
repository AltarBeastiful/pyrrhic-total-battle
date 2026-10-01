# 186 C — the raise positions under a wider walk

Every stop of every benchmark army at ×1, `Best v2`, `Safe` and `Tight` priced by the kernel box search (`src/kernel/raise.ts`) at three settings of `walkCap` / `restarts` (`maxSweeps` 24 throughout). Damage is the march’s worst opening; a row is listed only where a setting moved a position’s counts. `ms` is the five positions of one stop, summed over every stop.

| setting | positions | walked | searched | better | equal | worse | worst change | ms, every stop |
|---|---|---|---|---|---|---|---|---|
| shipped (300 000 / 64) | 189 | 126 | 9 | — | — | — | — | 382 |
| 1 048 576 / 128 | 189 | 135 | 0 | 0 | 189 | 0 | 0.00 % | 473 |
| 4 194 304 / 256 | 189 | 135 | 0 | 0 | 189 | 0 | 0.00 % | 474 |

## Positions whose counts moved

None: every position reads the same counts at every setting.
