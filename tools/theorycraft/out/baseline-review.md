# The baseline, reviewed

**15 scenarios · 28 campaigns read · 268 readings judged · 143 ▲ · 98 ▼ · 27 = · 1 stop lost · 1 stop gained · reading: worst-opening.** Every fall is listed once more, sorted by size, under [Trades to judge](#trades-to-judge); every rise under [Rises](#rises).

- **From** — tools/theorycraft/out/benchmark-2026-09-18-06-shelter-all-types.json — a benchmark snapshot, run 2026-09-18T13:15:30.605Z; reading: average damage (inferred from the stage number). Rebuilt from the snapshot's table rows.
- **To** — tests/engine/plan-baseline.proposed.json — `registeredBy: null` — a **proposal**, not a baseline; reading: worst-opening.

> **The two sides are on different readings — `average damage` against `worst-opening`.** Every damage figure below, and every ratio built on one, changed arithmetic as well as plan (S-94 put the bar on the march's worst opening); a fall against an average-damage side is not by itself a regression of the plan.

> One side was rebuilt from a snapshot's table rows: its `damage a silver` is rounded to three decimals as the table printed it, it carries no gold, queue or rare-stock column, and the plan's own campaign is not in it. Those readings are marked `·` rather than judged.

Read a row as: *from* is what the left-hand file holds, *to* what the right-hand one measured. ▲ is better on that reading, ▼ worse, `=` identical, `·` not comparable. Costs — silver, gold, coins, queue and the three burns — are better **lower**; damage and the four ratios better **higher**.

## first-run army, Bear V ×1 (20 000 leadership)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.1976 | 0.9813 | +0.7837 | +396.6 % | ▲ |
| vs TotalStack · M’s Preservation | — | 1.0345 | — | — | · |
| vs TotalStack · Total Optimization | — | 0.9984 | — | — | · |
| vs TotalStack · Elite Preservation | — | 0.9984 | — | — | · |

- damage a silver: ▼ **the best sizer sequence** 1.0193 → 1.0000 (-1.9 %) · **TotalStack · M’s Preservation**: — → 1.0349 · **TotalStack · Total Optimization**: — → 0.9985 · **TotalStack · Elite Preservation**: — → 0.9985.
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `sweet-spot`

> **Not the same campaign length** — *from* is priced over 1 march and *to* over 4. Every total below scales with that, and only the four ratios are read on the same footing.

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 4,722,842 | 18,189,008 | +13,466,166 | +285.1 % | ▲ |
| silver | 8,131,400 | 32,525,600 | +24,394,200 | +300.0 % | ▼ |
| revive gold | — | 0 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 1 | 1 | 0 | 0.0 % | = |
| soldiers burned | — | 0 | — | — | · |
| monsters burned | — | 1 | — | — | · |
| damage a silver | 0.5810 | 0.5592 | -0.0218 | -3.7 % | ▼ |
| damage a hired unit | 4,722,842 | 18,189,008 | +13,466,166 | +285.1 % | ▲ |
| damage a soldier | — | 18,189,008 | — | — | · |
| damage a monster | — | 18,189,008 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## first-run army, Bear V ×2 (20 000 leadership)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.3987 | 0.9894 | +0.5908 | +148.2 % | ▲ |
| vs TotalStack · M’s Preservation | — | 1.0340 | — | — | · |
| vs TotalStack · Total Optimization | — | 0.9984 | — | — | · |
| vs TotalStack · Elite Preservation | — | 0.9984 | — | — | · |

- damage a silver: ▼ **the best sizer sequence** 1.0191 → 1.0000 (-1.9 %) · **TotalStack · M’s Preservation**: — → 1.0345 · **TotalStack · Total Optimization**: — → 0.9986 · **TotalStack · Elite Preservation**: — → 0.9986.
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `sweet-spot`

> **Not the same campaign length** — *from* is priced over 2 marches and *to* over 4. Every total below scales with that, and only the four ratios are read on the same footing.

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 9,557,884 | 18,413,408 | +8,855,524 | +92.7 % | ▲ |
| silver | 16,262,800 | 32,525,600 | +16,262,800 | +100.0 % | ▼ |
| revive gold | — | 160 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 2 | 2 | 0 | 0.0 % | = |
| soldiers burned | — | 0 | — | — | · |
| monsters burned | — | 2 | — | — | · |
| damage a silver | 0.5880 | 0.5661 | -0.0219 | -3.7 % | ▼ |
| damage a hired unit | 4,778,942 | 9,206,704 | +4,427,762 | +92.7 % | ▲ |
| damage a soldier | — | 18,413,408 | — | — | · |
| damage a monster | — | 9,206,704 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## first-run army, Bear V ×3 (20 000 leadership)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.7936 | 1.0000 | +0.2064 | +26.0 % | ▲ |
| vs TotalStack · M’s Preservation | 0.9859 | 0.9857 | -0.0003 | -0.0 % | ▼ |
| vs TotalStack · priority search under M’s (averageDamage) | 0.7514 | 0.8750 | +0.1236 | +16.4 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 0.9859 | 0.9857 | -0.0003 | -0.0 % | ▼ |
| vs TotalStack · Total Optimization | 0.9985 | 0.9985 | -0.0000 | -0.0 % | ▼ |
| vs TotalStack · priority search under Elite (averageDamage) | 0.7933 | 1.0005 | +0.2072 | +26.1 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 0.9985 | 0.9985 | -0.0000 | -0.0 % | ▼ |
| vs TotalStack · Elite Preservation | 0.9985 | 0.9985 | -0.0000 | -0.0 % | ▼ |

- damage a silver: ▼ **TotalStack · M’s Preservation** 0.9866 → 0.9859 (-0.1 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 1.2952 → 1.5066 (+16.3 %) · ▼ **TotalStack · priority search under M’s (damagePerSilver)** 0.9866 → 0.9859 (-0.1 %) · ▲ **TotalStack · Total Optimization** 0.9983 → 0.9986 (+0.0 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 1.3674 → 1.7225 (+26.0 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 0.9983 → 0.9986 (+0.0 %) · ▲ **TotalStack · Elite Preservation** 0.9983 → 0.9986 (+0.0 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `sweet-spot`

> **Not the same campaign length** — *from* is priced over 3 marches and *to* over 4. Every total below scales with that, and only the four ratios are read on the same footing.

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 14,168,526 | 18,413,408 | +4,244,882 | +30.0 % | ▲ |
| silver | 24,394,200 | 32,525,600 | +8,131,400 | +33.3 % | ▼ |
| revive gold | — | 0 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 3 | 3 | 0 | 0.0 % | = |
| soldiers burned | — | 0 | — | — | · |
| monsters burned | — | 3 | — | — | · |
| damage a silver | 0.5810 | 0.5661 | -0.0149 | -2.6 % | ▼ |
| damage a hired unit | 4,722,842 | 6,137,802.67 | +1,414,960.67 | +30.0 % | ▲ |
| damage a soldier | — | 18,413,408 | — | — | · |
| damage a monster | — | 6,137,802.67 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 19,115,768 | 18,750,008 | -365,760 | -1.9 % | ▼ |
| silver | 32,525,600 | 32,525,600 | 0 | 0.0 % | = |
| revive gold | — | 480 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 3 | 3 | 0 | 0.0 % | = |
| soldiers burned | — | 0 | — | — | · |
| monsters burned | — | 3 | — | — | · |
| damage a silver | 0.5880 | 0.5765 | -0.0115 | -2.0 % | ▼ |
| damage a hired unit | 6,371,923 | 6,250,002.67 | -121,920.33 | -1.9 % | ▼ |
| damage a soldier | — | 18,750,008 | — | — | · |
| damage a monster | — | 6,250,002.67 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## first-run army, Bear V ×10 (20 000 leadership)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.8634 | 0.9877 | +0.1243 | +14.4 % | ▲ |
| vs TotalStack · M’s Preservation | 0.9794 | 0.9700 | -0.0094 | -1.0 % | ▼ |
| vs TotalStack · priority search under M’s (averageDamage) | 0.8193 | 0.9296 | +0.1103 | +13.5 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 0.9794 | 0.9700 | -0.0094 | -1.0 % | ▼ |
| vs TotalStack · Total Optimization | 1.0254 | 1.0046 | -0.0208 | -2.0 % | ▼ |
| vs TotalStack · priority search under Elite (averageDamage) | 0.8631 | 1.0558 | +0.1928 | +22.3 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 0.9955 | 0.9873 | -0.0083 | -0.8 % | ▼ |
| vs TotalStack · Elite Preservation | 0.9955 | 0.9873 | -0.0083 | -0.8 % | ▼ |

- damage a silver: ▲ **the best sizer sequence** 0.9701 → 0.9819 (+1.2 %) · ▲ **TotalStack · M’s Preservation** 0.9545 → 0.9644 (+1.0 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 1.3742 → 1.5911 (+15.8 %) · ▲ **TotalStack · priority search under M’s (damagePerSilver)** 0.9545 → 0.9644 (+1.0 %) · ▲ **TotalStack · Total Optimization** 0.9985 → 0.9987 (+0.0 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 1.4477 → 1.8071 (+24.8 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 0.9701 → 0.9816 (+1.2 %) · ▲ **TotalStack · Elite Preservation** 0.9701 → 0.9816 (+1.2 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 21,135,368 | 20,769,608 | -365,760 | -1.7 % | ▼ |
| silver | 32,525,600 | 32,525,600 | 0 | 0.0 % | = |
| revive gold | — | 3,200 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 4 | 4 | 0 | 0.0 % | = |
| soldiers burned | — | 0 | — | — | · |
| monsters burned | — | 4 | — | — | · |
| damage a silver | 0.6500 | 0.6386 | -0.0114 | -1.8 % | ▼ |
| damage a hired unit | 5,283,842 | 5,192,402 | -91,440 | -1.7 % | ▼ |
| damage a soldier | — | 20,769,608 | — | — | · |
| damage a monster | — | 5,192,402 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 21,700,948 | 20,893,375 | -807,573 | -3.7 % | ▼ |
| silver | 45,577,400 | 36,013,400 | -9,564,000 | -21.0 % | ▲ |
| revive gold | — | 4,800 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 12,300,255 (142d 8h) | — | — | · |
| hired burned | 4 | 4 | 0 | 0.0 % | = |
| soldiers burned | — | 0 | — | — | · |
| monsters burned | — | 4 | — | — | · |
| damage a silver | 0.4760 | 0.5802 | +0.1042 | +21.9 % | ▲ |
| damage a hired unit | 5,425,237 | 5,223,343.75 | -201,893.25 | -3.7 % | ▼ |
| damage a soldier | — | 20,893,375 | — | — | · |
| damage a monster | — | 5,223,343.75 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.9875 | 0.9929 | +0.0054 | +0.5 % | ▲ |
| vs TotalStack · M’s Preservation | 0.9827 | 0.9874 | +0.0048 | +0.5 % | ▲ |
| vs TotalStack · priority search under M’s (averageDamage) | 0.9934 | 1.0028 | +0.0094 | +0.9 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 0.9827 | 0.9874 | +0.0048 | +0.5 % | ▲ |
| vs TotalStack · Total Optimization | 0.9933 | 0.9983 | +0.0049 | +0.5 % | ▲ |
| vs TotalStack · priority search under Elite (averageDamage) | 1.0098 | 1.0231 | +0.0133 | +1.3 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 1.0098 | 1.0231 | +0.0133 | +1.3 % | ▲ |
| vs TotalStack · Elite Preservation | 1.0910 | 1.1185 | +0.0276 | +2.5 % | ▲ |

- damage a silver: ▼ **the best sizer sequence** 0.9946 → 0.9942 (-0.0 %) · ▼ **TotalStack · M’s Preservation** 0.9830 → 0.9827 (-0.0 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 1.0405 → 1.0453 (+0.5 %) · ▼ **TotalStack · priority search under M’s (damagePerSilver)** 0.9830 → 0.9827 (-0.0 %) · ▼ **TotalStack · Total Optimization** 0.9935 → 0.9934 (-0.0 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 1.0572 → 1.0661 (+0.8 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 1.0572 → 1.0661 (+0.8 %) · ▲ **TotalStack · Elite Preservation** 1.0909 → 1.1130 (+2.0 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 29,021,204 | 28,655,444 | -365,760 | -1.3 % | ▼ |
| silver | 32,525,600 | 32,525,600 | 0 | 0.0 % | = |
| revive gold | — | 1,760 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 25 | 25 | 0 | 0.0 % | = |
| soldiers burned | — | 25 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 0.8920 | 0.8810 | -0.0110 | -1.2 % | ▼ |
| damage a hired unit | 1,160,848 | 1,146,217.76 | -14,630.24 | -1.3 % | ▼ |
| damage a soldier | — | 1,146,217.76 | — | — | · |
| damage a monster | — | 28,655,444 | — | — | · |

### `steady-max`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 30,057,473 | 29,691,713 | -365,760 | -1.2 % | ▼ |
| silver | 32,525,600 | 32,525,600 | 0 | 0.0 % | = |
| revive gold | — | 1,928 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,077,520 (105d 1h) | — | — | · |
| hired burned | 28 | 28 | 0 | 0.0 % | = |
| soldiers burned | — | 28 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 0.9240 | 0.9129 | -0.0111 | -1.2 % | ▼ |
| damage a hired unit | 1,073,481 | 1,060,418.32 | -13,062.68 | -1.2 % | ▼ |
| damage a soldier | — | 1,060,418.32 | — | — | · |
| damage a monster | — | 29,691,713 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 28,781,642 | 29,841,879 | +1,060,237 | +3.7 % | ▲ |
| silver | 36,125,500 | 33,291,200 | -2,834,300 | -7.8 % | ▲ |
| revive gold | — | 2,016 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 9,784,890 (113d 6h) | — | — | · |
| hired burned | 30 | 30 | 0 | 0.0 % | = |
| soldiers burned | — | 30 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 0.7970 | 0.8964 | +0.0994 | +12.5 % | ▲ |
| damage a hired unit | 959,388 | 994,729.3 | +35,341.3 | +3.7 % | ▲ |
| damage a soldier | — | 994,729.3 | — | — | · |
| damage a monster | — | 29,841,879 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

**New — the *from* side does not hold this scenario.** It offers 3 stops: `sweet-spot`, `more-mercs`, `steady-max`. Nothing here is a regression; it is a bar to register for the first time.

- `sweet-spot` — 91,948,255 damage · 35,274,000 silver · 97 burned · 2.6067 a silver · 947,920.15 a hired · 121d 11h
- `more-mercs` — 94,687,477 damage · 35,349,600 silver · 106 burned · 2.6786 a silver · 893,278.08 a hired · 122d 0h
- `steady-max` — 95,348,743 damage · 35,458,800 silver · 112 burned · 2.6890 a silver · 851,328.06 a hired · 122d 18h

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.9723 | 1.0000 | +0.0277 | +2.8 % | ▲ |
| vs TotalStack · optimize (as captured, repeated) | 0.9420 | 0.9723 | +0.0302 | +3.2 % | ▲ |
| vs Kai’s calculator · extract (as captured, repeated) | 0.9547 | 0.9888 | +0.0341 | +3.6 % | ▲ |
| vs TotalStack · M’s Preservation | 0.9420 | 0.9723 | +0.0302 | +3.2 % | ▲ |
| vs TotalStack · priority search under M’s (averageDamage) | 0.9429 | 0.9737 | +0.0308 | +3.3 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 0.9420 | 0.9723 | +0.0302 | +3.2 % | ▲ |
| vs TotalStack · Total Optimization | 0.9888 | 1.0166 | +0.0278 | +2.8 % | ▲ |
| vs TotalStack · priority search under Elite (averageDamage) | 0.9976 | 1.0312 | +0.0336 | +3.4 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 0.9976 | 1.0312 | +0.0336 | +3.4 % | ▲ |
| vs TotalStack · Elite Preservation | 0.9976 | 1.0312 | +0.0336 | +3.4 % | ▲ |

- damage a silver: ▲ **the best sizer sequence** 0.9661 → 1.0000 (+3.5 %) · ▲ **TotalStack · optimize (as captured, repeated)** 0.9352 → 0.9725 (+4.0 %) · ▲ **Kai’s calculator · extract (as captured, repeated)** 0.9668 → 1.0083 (+4.3 %) · ▲ **TotalStack · M’s Preservation** 0.9352 → 0.9725 (+4.0 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 0.9364 → 0.9742 (+4.0 %) · ▲ **TotalStack · priority search under M’s (damagePerSilver)** 0.9352 → 0.9725 (+4.0 %) · ▲ **TotalStack · Total Optimization** 0.9814 → 1.0166 (+3.6 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 0.9906 → 1.0312 (+4.1 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 0.9906 → 1.0312 (+4.1 %) · ▲ **TotalStack · Elite Preservation** 0.9906 → 1.0312 (+4.1 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 8,193,505 | 8,084,653 | -108,852 | -1.3 % | ▼ |
| silver | 6,083,200 | 6,083,200 | 0 | 0.0 % | = |
| revive gold | — | 1,192 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 1,368,240 (15d 20h) | — | — | · |
| hired burned | 19 | 19 | 0 | 0.0 % | = |
| soldiers burned | — | 19 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.3470 | 1.3290 | -0.0180 | -1.3 % | ▼ |
| damage a hired unit | 431,237 | 425,508.05 | -5,728.95 | -1.3 % | ▼ |
| damage a soldier | — | 425,508.05 | — | — | · |
| damage a monster | — | 8,084,653 | — | — | · |

### `steady-max`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 8,331,398 | 8,222,546 | -108,852 | -1.3 % | ▼ |
| silver | 6,083,200 | 6,083,200 | 0 | 0.0 % | = |
| revive gold | — | 1,176 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 1,368,240 (15d 20h) | — | — | · |
| hired burned | 21 | 21 | 0 | 0.0 % | = |
| soldiers burned | — | 21 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.3700 | 1.3517 | -0.0183 | -1.3 % | ▼ |
| damage a hired unit | 396,733 | 391,549.81 | -5,183.19 | -1.3 % | ▼ |
| damage a soldier | — | 391,549.81 | — | — | · |
| damage a monster | — | 8,222,546 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 8,394,732 | 8,519,930 | +125,198 | +1.5 % | ▲ |
| silver | 6,241,000 | 6,083,200 | -157,800 | -2.5 % | ▲ |
| revive gold | — | 1,336 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 1,368,240 (15d 20h) | — | — | · |
| hired burned | 24 | 24 | 0 | 0.0 % | = |
| soldiers burned | — | 24 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.3450 | 1.4006 | +0.0556 | +4.1 % | ▲ |
| damage a hired unit | 349,781 | 354,997.08 | +5,216.08 | +1.5 % | ▲ |
| damage a soldier | — | 354,997.08 | — | — | · |
| damage a monster | — | 8,519,930 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## 2026-09-17 export, its setup (7 000 leadership)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.8964 | 0.9588 | +0.0624 | +7.0 % | ▲ |
| vs TotalStack · M’s Preservation | 2.0355 | 2.1446 | +0.1091 | +5.4 % | ▲ |
| vs TotalStack · priority search under M’s (averageDamage) | 1.4253 | 1.7187 | +0.2935 | +20.6 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 2.3699 | 3.0253 | +0.6554 | +27.7 % | ▲ |
| vs TotalStack · Total Optimization | 2.0366 | 2.1458 | +0.1092 | +5.4 % | ▲ |
| vs TotalStack · priority search under Elite (averageDamage) | 1.4494 | 3.0253 | +1.5759 | +108.7 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 1.8776 | 2.7831 | +0.9055 | +48.2 % | ▲ |
| vs TotalStack · Elite Preservation | 1.8776 | 2.7831 | +0.9055 | +48.2 % | ▲ |

- damage a silver: ▼ **the best sizer sequence** 0.9925 → 0.9755 (-1.7 %) · ▲ **TotalStack · M’s Preservation** 2.0374 → 2.0704 (+1.6 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 2.0834 → 2.4218 (+16.2 %) · ▲ **TotalStack · priority search under M’s (damagePerSilver)** 1.8161 → 2.2358 (+23.1 %) · ▲ **TotalStack · Total Optimization** 2.0374 → 2.0702 (+1.6 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 2.5922 → 5.2168 (+101.3 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 1.8788 → 2.6849 (+42.9 %) · ▲ **TotalStack · Elite Preservation** 1.8788 → 2.6849 (+42.9 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

Stops: **gained `silver-saver`** (16,115,314 damage · 8,695,000 silver · 32 burned · 1.8534 a silver · 503,603.56 a hired · 24d 6h).

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 21,662,734 | 18,796,348 | -2,866,386 | -13.2 % | ▼ |
| silver | 10,957,600 | 10,906,900 | -50,700 | -0.5 % | ▲ |
| revive gold | — | 2,760 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 2,631,030 (30d 10h) | — | — | · |
| hired burned | 47 | 35 | -12 | -25.5 % | ▲ |
| soldiers burned | — | 35 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.9770 | 1.7233 | -0.2537 | -12.8 % | ▼ |
| damage a hired unit | 460,909 | 537,038.51 | +76,129.51 | +16.5 % | ▲ |
| damage a soldier | — | 537,038.51 | — | — | · |
| damage a monster | — | 18,796,348 | — | — | · |

### `more-mercs`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 22,133,839 | 20,079,262 | -2,054,577 | -9.3 % | ▼ |
| silver | 10,957,600 | 10,581,400 | -376,200 | -3.4 % | ▲ |
| revive gold | — | 3,072 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 2,553,495 (29d 13h) | — | — | · |
| hired burned | 50 | 44 | -6 | -12.0 % | ▲ |
| soldiers burned | — | 44 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 2.0200 | 1.8976 | -0.1224 | -6.1 % | ▼ |
| damage a hired unit | 442,677 | 456,346.86 | +13,669.86 | +3.1 % | ▲ |
| damage a soldier | — | 456,346.86 | — | — | · |
| damage a monster | — | 20,079,262 | — | — | · |

### `steady-max`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 23,264,491 | 22,770,620 | -493,871 | -2.1 % | ▼ |
| silver | 10,957,600 | 10,957,600 | 0 | 0.0 % | = |
| revive gold | — | 4,000 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 2,659,020 (30d 18h) | — | — | · |
| hired burned | 53 | 55 | +2 | +3.8 % | ▼ |
| soldiers burned | — | 55 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 2.1230 | 2.0781 | -0.0449 | -2.1 % | ▼ |
| damage a hired unit | 438,953 | 414,011.27 | -24,941.73 | -5.7 % | ▼ |
| damage a soldier | — | 414,011.27 | — | — | · |
| damage a monster | — | 22,770,620 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 22,518,504 | 23,619,920 | +1,101,416 | +4.9 % | ▲ |
| silver | 14,337,600 | 15,179,600 | +842,000 | +5.9 % | ▼ |
| revive gold | — | 6,608 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 6,455,520 (74d 17h) | — | — | · |
| hired burned | 93 | 92 | -1 | -1.1 % | ▲ |
| soldiers burned | — | 92 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.5710 | 1.5560 | -0.0150 | -1.0 % | ▼ |
| damage a hired unit | 242,134 | 256,738.26 | +14,604.26 | +6.0 % | ▲ |
| damage a soldier | — | 256,738.26 | — | — | · |
| damage a monster | — | 23,619,920 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## 2026-09-17 export, 12 000 leadership

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.9485 | 0.9605 | +0.0120 | +1.3 % | ▲ |
| vs TotalStack · M’s Preservation | 1.6520 | 1.6848 | +0.0328 | +2.0 % | ▲ |
| vs TotalStack · priority search under M’s (averageDamage) | 1.3456 | 1.3961 | +0.0506 | +3.8 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 1.3456 | 1.3961 | +0.0506 | +3.8 % | ▲ |
| vs TotalStack · Total Optimization | 1.6636 | 1.6972 | +0.0335 | +2.0 % | ▲ |
| vs TotalStack · priority search under Elite (averageDamage) | 1.4822 | 4.0940 | +2.6118 | +176.2 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 1.7620 | 2.1966 | +0.4346 | +24.7 % | ▲ |
| vs TotalStack · Elite Preservation | 1.7620 | 2.1966 | +0.4346 | +24.7 % | ▲ |

- damage a silver: ▲ **the best sizer sequence** 0.9927 → 1.0308 (+3.8 %) · ▲ **TotalStack · M’s Preservation** 1.6877 → 1.7814 (+5.6 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 1.5933 → 1.7098 (+7.3 %) · ▲ **TotalStack · priority search under M’s (damagePerSilver)** 1.5933 → 1.7098 (+7.3 %) · ▲ **TotalStack · Total Optimization** 1.6990 → 1.7936 (+5.6 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 2.7060 → 7.7328 (+185.8 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 1.7994 → 2.3215 (+29.0 %) · ▲ **TotalStack · Elite Preservation** 1.7994 → 2.3215 (+29.0 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

Stops: **lost `all-in`** (was 31,652,798 damage · 22,422,900 silver · 93 burned · 1.4120 a silver · 340,353 a hired).

### `silver-saver`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 25,145,044 | 22,531,695 | -2,613,349 | -10.4 % | ▼ |
| silver | 14,231,900 | 12,539,600 | -1,692,300 | -11.9 % | ▲ |
| revive gold | — | 3,272 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 3,029,760 (35d 1h) | — | — | · |
| hired burned | 51 | 48 | -3 | -5.9 % | ▲ |
| soldiers burned | — | 48 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.7670 | 1.7968 | +0.0298 | +1.7 % | ▲ |
| damage a hired unit | 493,040 | 469,410.31 | -23,629.69 | -4.8 % | ▼ |
| damage a soldier | — | 469,410.31 | — | — | · |
| damage a monster | — | 22,531,695 | — | — | · |

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 32,231,242 | 31,546,458 | -684,784 | -2.1 % | ▼ |
| silver | 18,790,400 | 18,790,400 | 0 | 0.0 % | = |
| revive gold | — | 4,824 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 4,564,080 (52d 19h) | — | — | · |
| hired burned | 67 | 67 | 0 | 0.0 % | = |
| soldiers burned | — | 67 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.7150 | 1.6789 | -0.0361 | -2.1 % | ▼ |
| damage a hired unit | 481,063 | 470,842.66 | -10,220.34 | -2.1 % | ▼ |
| damage a soldier | — | 470,842.66 | — | — | · |
| damage a monster | — | 31,546,458 | — | — | · |

### `steady-max`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 32,518,195 | 31,963,845 | -554,350 | -1.7 % | ▼ |
| silver | 21,057,500 | 21,035,600 | -21,900 | -0.1 % | ▲ |
| revive gold | — | 5,784 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 6,529,770 (75d 13h) | — | — | · |
| hired burned | 73 | 82 | +9 | +12.3 % | ▼ |
| soldiers burned | — | 82 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.5440 | 1.5195 | -0.0245 | -1.6 % | ▼ |
| damage a hired unit | 445,455 | 389,802.99 | -55,652.01 | -12.5 % | ▼ |
| damage a soldier | — | 389,802.99 | — | — | · |
| damage a monster | — | 31,963,845 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## live account of 2026-09-18 (one hired type, 20 000 leadership)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.9912 | 1.1756 | +0.1844 | +18.6 % | ▲ |
| vs TotalStack · M’s Preservation | 1.1467 | 1.1448 | -0.0019 | -0.2 % | ▼ |
| vs TotalStack · priority search under M’s (averageDamage) | 1.1467 | 1.1448 | -0.0019 | -0.2 % | ▼ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 1.1467 | 1.1448 | -0.0019 | -0.2 % | ▼ |
| vs TotalStack · Total Optimization | 1.0247 | 1.0178 | -0.0069 | -0.7 % | ▼ |
| vs TotalStack · priority search under Elite (averageDamage) | 1.0247 | 1.0178 | -0.0069 | -0.7 % | ▼ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 1.0247 | 1.0178 | -0.0069 | -0.7 % | ▼ |
| vs TotalStack · Elite Preservation | 1.0247 | 1.0178 | -0.0069 | -0.7 % | ▼ |

- damage a silver: ▲ **the best sizer sequence** 1.1837 → 1.2340 (+4.2 %) · ▲ **TotalStack · M’s Preservation** 1.1565 → 1.2060 (+4.3 %) · ▲ **TotalStack · priority search under M’s (averageDamage)** 1.1565 → 1.2060 (+4.3 %) · ▲ **TotalStack · priority search under M’s (damagePerSilver)** 1.1565 → 1.2060 (+4.3 %) · ▲ **TotalStack · Total Optimization** 1.0340 → 1.0718 (+3.7 %) · ▲ **TotalStack · priority search under Elite (averageDamage)** 1.0340 → 1.0718 (+3.7 %) · ▲ **TotalStack · priority search under Elite (damagePerSilver)** 1.0340 → 1.0718 (+3.7 %) · ▲ **TotalStack · Elite Preservation** 1.0340 → 1.0718 (+3.7 %).
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `silver-saver`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 18,681,950 | 20,891,829 | +2,209,879 | +11.8 % | ▲ |
| silver | 18,583,900 | 20,901,800 | +2,317,900 | +12.5 % | ▼ |
| revive gold | — | 1,544 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 4,929,120 (57d 1h) | — | — | · |
| hired burned | 20 | 22 | +2 | +10.0 % | ▼ |
| soldiers burned | — | 22 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.0050 | 0.9995 | -0.0055 | -0.5 % | ▼ |
| damage a hired unit | 934,098 | 949,628.59 | +15,530.59 | +1.7 % | ▲ |
| damage a soldier | — | 949,628.59 | — | — | · |
| damage a monster | — | 20,891,829 | — | — | · |

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 29,677,128 | 28,270,883 | -1,406,245 | -4.7 % | ▼ |
| silver | 30,607,200 | 30,516,200 | -91,000 | -0.3 % | ▲ |
| revive gold | — | 1,760 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 7,195,995 (83d 6h) | — | — | · |
| hired burned | 25 | 25 | 0 | 0.0 % | = |
| soldiers burned | — | 25 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 0.9700 | 0.9264 | -0.0436 | -4.5 % | ▼ |
| damage a hired unit | 1,187,085 | 1,130,835.32 | -56,249.68 | -4.7 % | ▼ |
| damage a soldier | — | 1,130,835.32 | — | — | · |
| damage a monster | — | 28,270,883 | — | — | · |

### `steady-max`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 30,215,378 | 28,727,202 | -1,488,176 | -4.9 % | ▼ |
| silver | 30,270,800 | 30,179,700 | -91,100 | -0.3 % | ▲ |
| revive gold | — | 1,904 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 7,116,825 (82d 8h) | — | — | · |
| hired burned | 28 | 28 | 0 | 0.0 % | = |
| soldiers burned | — | 28 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 0.9980 | 0.9519 | -0.0461 | -4.6 % | ▼ |
| damage a hired unit | 1,079,121 | 1,025,971.5 | -53,149.5 | -4.9 % | ▼ |
| damage a soldier | — | 1,025,971.5 | — | — | · |
| damage a monster | — | 28,727,202 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 31,218,724 | 29,743,332 | -1,475,392 | -4.7 % | ▼ |
| silver | 31,092,400 | 30,928,400 | -164,000 | -0.5 % | ▲ |
| revive gold | — | 2,016 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 7,293,180 (84d 9h) | — | — | · |
| hired burned | 30 | 30 | 0 | 0.0 % | = |
| soldiers burned | — | 30 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.0040 | 0.9617 | -0.0423 | -4.2 % | ▼ |
| damage a hired unit | 1,040,624 | 991,444.4 | -49,179.6 | -4.7 % | ▼ |
| damage a soldier | — | 991,444.4 | — | — | · |
| damage a monster | — | 29,743,332 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| standing | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| vs the best sizer sequence | 0.3733 | 0.8610 | +0.4878 | +130.7 % | ▲ |
| vs TotalStack · M’s Preservation | 0.8942 | 0.9615 | +0.0673 | +7.5 % | ▲ |
| vs TotalStack · priority search under M’s (averageDamage) | 0.3757 | 0.8610 | +0.4854 | +129.2 % | ▲ |
| vs TotalStack · priority search under M’s (damagePerSilver) | 0.8942 | 0.9615 | +0.0673 | +7.5 % | ▲ |
| vs TotalStack · Total Optimization | 0.8850 | 0.9514 | +0.0664 | +7.5 % | ▲ |
| vs TotalStack · priority search under Elite (averageDamage) | 0.3757 | 0.8610 | +0.4854 | +129.2 % | ▲ |
| vs TotalStack · priority search under Elite (damagePerSilver) | 0.4518 | 1.3846 | +0.9328 | +206.5 % | ▲ |
| vs TotalStack · Elite Preservation | 0.4054 | 1.0242 | +0.6188 | +152.7 % | ▲ |

- damage a silver: not carried by both sides.
- damage a soldier: not carried by both sides.
- damage a monster: not carried by both sides.

### `silver-saver`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 22,179,294 | 23,474,915 | +1,295,621 | +5.8 % | ▲ |
| silver | 13,217,400 | 13,945,500 | +728,100 | +5.5 % | ▼ |
| revive gold | — | 3,472 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 3,308,895 (38d 7h) | — | — | · |
| hired burned | 49 | 53 | +4 | +8.2 % | ▼ |
| soldiers burned | — | 53 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.6780 | 1.6833 | +0.0053 | +0.3 % | ▲ |
| damage a hired unit | 452,639 | 442,922.92 | -9,716.08 | -2.1 % | ▼ |
| damage a soldier | — | 442,922.92 | — | — | · |
| damage a monster | — | 23,474,915 | — | — | · |

### `sweet-spot`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 28,367,940 | 28,140,302 | -227,638 | -0.8 % | ▼ |
| silver | 17,104,800 | 17,072,400 | -32,400 | -0.2 % | ▲ |
| revive gold | — | 4,056 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 4,047,210 (46d 20h) | — | — | · |
| hired burned | 58 | 61 | +3 | +5.2 % | ▼ |
| soldiers burned | — | 61 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.6580 | 1.6483 | -0.0097 | -0.6 % | ▼ |
| damage a hired unit | 489,102 | 461,316.43 | -27,785.57 | -5.7 % | ▼ |
| damage a soldier | — | 461,316.43 | — | — | · |
| damage a monster | — | 28,140,302 | — | — | · |

### `more-mercs`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 29,265,102 | 29,851,070 | +585,968 | +2.0 % | ▲ |
| silver | 17,179,200 | 17,179,200 | 0 | 0.0 % | = |
| revive gold | — | 4,872 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 4,136,040 (47d 20h) | — | — | · |
| hired burned | 67 | 70 | +3 | +4.5 % | ▼ |
| soldiers burned | — | 70 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.7040 | 1.7376 | +0.0336 | +2.0 % | ▲ |
| damage a hired unit | 436,793 | 426,443.86 | -10,349.14 | -2.4 % | ▼ |
| damage a soldier | — | 426,443.86 | — | — | · |
| damage a monster | — | 29,851,070 | — | — | · |

### `steady-max`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 30,107,115 | 30,693,083 | +585,968 | +1.9 % | ▲ |
| silver | 17,179,200 | 17,179,200 | 0 | 0.0 % | = |
| revive gold | — | 5,040 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 4,136,040 (47d 20h) | — | — | · |
| hired burned | 70 | 76 | +6 | +8.6 % | ▼ |
| soldiers burned | — | 76 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.7530 | 1.7866 | +0.0336 | +1.9 % | ▲ |
| damage a hired unit | 430,102 | 403,856.36 | -26,245.64 | -6.1 % | ▼ |
| damage a soldier | — | 403,856.36 | — | — | · |
| damage a monster | — | 30,693,083 | — | — | · |

### `all-in`

| reading | from | to | Δ | Δ % | verdict |
|---|---|---|---|---|---|
| damage | 29,111,661 | 31,714,657 | +2,602,996 | +8.9 % | ▲ |
| silver | 17,179,200 | 18,768,000 | +1,588,800 | +9.2 % | ▼ |
| revive gold | — | 6,192 | — | — | · |
| dragon coins | — | 0 | — | — | · |
| training queue | — | 5,540,550 (64d 3h) | — | — | · |
| hired burned | 78 | 88 | +10 | +12.8 % | ▼ |
| soldiers burned | — | 88 | — | — | · |
| monsters burned | — | 0 | — | — | · |
| damage a silver | 1.6950 | 1.6898 | -0.0052 | -0.3 % | ▼ |
| damage a hired unit | 373,226 | 360,393.83 | -12,832.17 | -3.4 % | ▼ |
| damage a soldier | — | 360,393.83 | — | — | · |
| damage a monster | — | 31,714,657 | — | — | · |

### the plan itself

Not carried by both sides — nothing to compare.

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

**New — the *from* side does not hold this scenario.** It offers 3 stops: `sweet-spot`, `steady-max`, `all-in`. Nothing here is a regression; it is a bar to register for the first time.

- `sweet-spot` — 15,533,933 damage · 7,682,800 silver · 37 burned · 2.0219 a silver · 419,836.03 a hired · 20d 19h
- `steady-max` — 17,630,102 damage · 8,448,400 silver · 58 burned · 2.0868 a silver · 303,967.28 a hired · 28d 23h
- `all-in` — 18,744,735 damage · 11,240,800 silver · 111 burned · 1.6676 a silver · 168,871.49 a hired · 59d 9h

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

**New — the *from* side does not hold this scenario.** It offers 4 stops: `sweet-spot`, `more-mercs`, `steady-max`, `all-in`. Nothing here is a regression; it is a bar to register for the first time.

- `sweet-spot` — 8,980,108 damage · 7,241,900 silver · 19 burned · 1.2400 a silver · 472,637.26 a hired · 19d 20h
- `more-mercs` — 12,086,359 damage · 9,849,200 silver · 37 burned · 1.2271 a silver · 326,658.35 a hired · 42d 16h
- `steady-max` — 15,306,859 damage · 9,849,200 silver · 52 burned · 1.5541 a silver · 294,362.67 a hired · 42d 16h
- `all-in` — 10,899,547 damage · 6,653,700 silver · 133 burned · 1.6381 a silver · 81,951.48 a hired · 39d 0h

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

**New — the *from* side does not hold this scenario.** It offers 4 stops: `silver-saver`, `sweet-spot`, `more-mercs`, `steady-max`. Nothing here is a regression; it is a bar to register for the first time.

- `silver-saver` — 7,561,467 damage · 7,313,300 silver · 12 burned · 1.0339 a silver · 630,122.25 a hired · 26d 3h
- `sweet-spot` — 9,068,238 damage · 8,746,700 silver · 15 burned · 1.0368 a silver · 604,549.2 a hired · 31d 15h
- `more-mercs` — 10,294,068 damage · 10,005,200 silver · 33 burned · 1.0289 a silver · 311,941.45 a hired · 44d 20h
- `steady-max` — 13,842,678 damage · 10,476,500 silver · 57 burned · 1.3213 a silver · 242,854 a hired · 51d 9h

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

**New — the *from* side does not hold this scenario.** It offers 4 stops: `sweet-spot`, `more-mercs`, `steady-max`, `all-in`. Nothing here is a regression; it is a bar to register for the first time.

- `sweet-spot` — 10,156,338 damage · 9,503,600 silver · 25 burned · 1.0687 a silver · 406,253.52 a hired · 40d 7h
- `more-mercs` — 10,197,781 damage · 10,729,000 silver · 34 burned · 0.9505 a silver · 299,934.74 a hired · 53d 16h
- `steady-max` — 11,196,175 damage · 11,037,400 silver · 39 burned · 1.0144 a silver · 287,081.41 a hired · 55d 7h
- `all-in` — 11,585,381 damage · 11,202,400 silver · 41 burned · 1.0342 a silver · 282,570.27 a hired · 56d 10h

## Trades to judge

**Stops the *to* side no longer offers** — the bar lost an answer, which the baseline reads as a failure:

- **2026-09-17 export, 12 000 leadership** — `all-in`: 31,652,798 damage · 22,422,900 silver · 93 burned · 1.4120 a silver · 340,353 a hired

98 readings fell, sorted by size. Each is a trade the owner accepts or refuses; registering the proposal accepts all of them.

| # | scenario | stop | reading | from | to | Δ | Δ % |
|---|---|---|---|---|---|---|---|
| 1 | first-run army, Bear V ×1 (20 000 leadership) | `sweet-spot` | silver | 8,131,400 | 32,525,600 | +24,394,200 | +300.0 % |
| 2 | first-run army, Bear V ×2 (20 000 leadership) | `sweet-spot` | silver | 16,262,800 | 32,525,600 | +16,262,800 | +100.0 % |
| 3 | first-run army, Bear V ×3 (20 000 leadership) | `sweet-spot` | silver | 24,394,200 | 32,525,600 | +8,131,400 | +33.3 % |
| 4 | 2026-09-17 export, its setup (7 000 leadership) | `sweet-spot` | damage | 21,662,734 | 18,796,348 | -2,866,386 | -13.2 % |
| 5 | 2026-09-17 export, its setup (7 000 leadership) | `sweet-spot` | damage a silver | 1.9770 | 1.7233 | -0.2537 | -12.8 % |
| 6 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `all-in` | hired burned | 78 | 88 | +10 | +12.8 % |
| 7 | 2026-09-17 export, 12 000 leadership | `steady-max` | damage a hired unit | 445,455 | 389,802.99 | -55,652.01 | -12.5 % |
| 8 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `silver-saver` | silver | 18,583,900 | 20,901,800 | +2,317,900 | +12.5 % |
| 9 | 2026-09-17 export, 12 000 leadership | `steady-max` | hired burned | 73 | 82 | +9 | +12.3 % |
| 10 | 2026-09-17 export, 12 000 leadership | `silver-saver` | damage | 25,145,044 | 22,531,695 | -2,613,349 | -10.4 % |
| 11 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `silver-saver` | hired burned | 20 | 22 | +2 | +10.0 % |
| 12 | 2026-09-17 export, its setup (7 000 leadership) | `more-mercs` | damage | 22,133,839 | 20,079,262 | -2,054,577 | -9.3 % |
| 13 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `all-in` | silver | 17,179,200 | 18,768,000 | +1,588,800 | +9.2 % |
| 14 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `steady-max` | hired burned | 70 | 76 | +6 | +8.6 % |
| 15 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `silver-saver` | hired burned | 49 | 53 | +4 | +8.2 % |
| 16 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `steady-max` | damage a hired unit | 430,102 | 403,856.36 | -26,245.64 | -6.1 % |
| 17 | 2026-09-17 export, its setup (7 000 leadership) | `more-mercs` | damage a silver | 2.0200 | 1.8976 | -0.1224 | -6.1 % |
| 18 | 2026-09-17 export, its setup (7 000 leadership) | `all-in` | silver | 14,337,600 | 15,179,600 | +842,000 | +5.9 % |
| 19 | 2026-09-17 export, its setup (7 000 leadership) | `steady-max` | damage a hired unit | 438,953 | 414,011.27 | -24,941.73 | -5.7 % |
| 20 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `sweet-spot` | damage a hired unit | 489,102 | 461,316.43 | -27,785.57 | -5.7 % |
| 21 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `silver-saver` | silver | 13,217,400 | 13,945,500 | +728,100 | +5.5 % |
| 22 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `sweet-spot` | hired burned | 58 | 61 | +3 | +5.2 % |
| 23 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `steady-max` | damage a hired unit | 1,079,121 | 1,025,971.5 | -53,149.5 | -4.9 % |
| 24 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `steady-max` | damage | 30,215,378 | 28,727,202 | -1,488,176 | -4.9 % |
| 25 | 2026-09-17 export, 12 000 leadership | `silver-saver` | damage a hired unit | 493,040 | 469,410.31 | -23,629.69 | -4.8 % |
| 26 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `sweet-spot` | damage | 29,677,128 | 28,270,883 | -1,406,245 | -4.7 % |
| 27 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `sweet-spot` | damage a hired unit | 1,187,085 | 1,130,835.32 | -56,249.68 | -4.7 % |
| 28 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `all-in` | damage | 31,218,724 | 29,743,332 | -1,475,392 | -4.7 % |
| 29 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `all-in` | damage a hired unit | 1,040,624 | 991,444.4 | -49,179.6 | -4.7 % |
| 30 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `steady-max` | damage a silver | 0.9980 | 0.9519 | -0.0461 | -4.6 % |
| 31 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `sweet-spot` | damage a silver | 0.9700 | 0.9264 | -0.0436 | -4.5 % |
| 32 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `more-mercs` | hired burned | 67 | 70 | +3 | +4.5 % |
| 33 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `all-in` | damage a silver | 1.0040 | 0.9617 | -0.0423 | -4.2 % |
| 34 | 2026-09-17 export, its setup (7 000 leadership) | `steady-max` | hired burned | 53 | 55 | +2 | +3.8 % |
| 35 | first-run army, Bear V ×1 (20 000 leadership) | `sweet-spot` | damage a silver | 0.5810 | 0.5592 | -0.0218 | -3.7 % |
| 36 | first-run army, Bear V ×10 (20 000 leadership) | `all-in` | damage | 21,700,948 | 20,893,375 | -807,573 | -3.7 % |
| 37 | first-run army, Bear V ×10 (20 000 leadership) | `all-in` | damage a hired unit | 5,425,237 | 5,223,343.75 | -201,893.25 | -3.7 % |
| 38 | first-run army, Bear V ×2 (20 000 leadership) | `sweet-spot` | damage a silver | 0.5880 | 0.5661 | -0.0219 | -3.7 % |
| 39 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `all-in` | damage a hired unit | 373,226 | 360,393.83 | -12,832.17 | -3.4 % |
| 40 | first-run army, Bear V ×3 (20 000 leadership) | `sweet-spot` | damage a silver | 0.5810 | 0.5661 | -0.0149 | -2.6 % |
| 41 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `more-mercs` | damage a hired unit | 436,793 | 426,443.86 | -10,349.14 | -2.4 % |
| 42 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `silver-saver` | damage a hired unit | 452,639 | 442,922.92 | -9,716.08 | -2.1 % |
| 43 | 2026-09-17 export, 12 000 leadership | `sweet-spot` | damage | 32,231,242 | 31,546,458 | -684,784 | -2.1 % |
| 44 | 2026-09-17 export, 12 000 leadership | `sweet-spot` | damage a hired unit | 481,063 | 470,842.66 | -10,220.34 | -2.1 % |
| 45 | 2026-09-17 export, its setup (7 000 leadership) | `steady-max` | damage | 23,264,491 | 22,770,620 | -493,871 | -2.1 % |
| 46 | 2026-09-17 export, its setup (7 000 leadership) | `steady-max` | damage a silver | 2.1230 | 2.0781 | -0.0449 | -2.1 % |
| 47 | 2026-09-17 export, 12 000 leadership | `sweet-spot` | damage a silver | 1.7150 | 1.6789 | -0.0361 | -2.1 % |
| 48 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · Total Optimization | damage | 1.0254 | 1.0046 | -0.0208 | -2.0 % |
| 49 | first-run army, Bear V ×3 (20 000 leadership) | `all-in` | damage a silver | 0.5880 | 0.5765 | -0.0115 | -2.0 % |
| 50 | first-run army, Bear V ×3 (20 000 leadership) | `all-in` | damage a hired unit | 6,371,923 | 6,250,002.67 | -121,920.33 | -1.9 % |
| 51 | first-run army, Bear V ×3 (20 000 leadership) | `all-in` | damage | 19,115,768 | 18,750,008 | -365,760 | -1.9 % |
| 52 | first-run army, Bear V ×1 (20 000 leadership) | standing vs the best sizer sequence | damage a silver | 1.0193 | 1.0000 | -0.0193 | -1.9 % |
| 53 | first-run army, Bear V ×2 (20 000 leadership) | standing vs the best sizer sequence | damage a silver | 1.0191 | 1.0000 | -0.0191 | -1.9 % |
| 54 | first-run army, Bear V ×10 (20 000 leadership) | `sweet-spot` | damage a silver | 0.6500 | 0.6386 | -0.0114 | -1.8 % |
| 55 | first-run army, Bear V ×10 (20 000 leadership) | `sweet-spot` | damage | 21,135,368 | 20,769,608 | -365,760 | -1.7 % |
| 56 | first-run army, Bear V ×10 (20 000 leadership) | `sweet-spot` | damage a hired unit | 5,283,842 | 5,192,402 | -91,440 | -1.7 % |
| 57 | 2026-09-17 export, its setup (7 000 leadership) | standing vs the best sizer sequence | damage a silver | 0.9925 | 0.9755 | -0.0170 | -1.7 % |
| 58 | 2026-09-17 export, 12 000 leadership | `steady-max` | damage | 32,518,195 | 31,963,845 | -554,350 | -1.7 % |
| 59 | 2026-09-17 export, 12 000 leadership | `steady-max` | damage a silver | 1.5440 | 1.5195 | -0.0245 | -1.6 % |
| 60 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `steady-max` | damage a silver | 1.3700 | 1.3517 | -0.0183 | -1.3 % |
| 61 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `sweet-spot` | damage a silver | 1.3470 | 1.3290 | -0.0180 | -1.3 % |
| 62 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `sweet-spot` | damage | 8,193,505 | 8,084,653 | -108,852 | -1.3 % |
| 63 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `sweet-spot` | damage a hired unit | 431,237 | 425,508.05 | -5,728.95 | -1.3 % |
| 64 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `steady-max` | damage | 8,331,398 | 8,222,546 | -108,852 | -1.3 % |
| 65 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `steady-max` | damage a hired unit | 396,733 | 391,549.81 | -5,183.19 | -1.3 % |
| 66 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `sweet-spot` | damage | 29,021,204 | 28,655,444 | -365,760 | -1.3 % |
| 67 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `sweet-spot` | damage a hired unit | 1,160,848 | 1,146,217.76 | -14,630.24 | -1.3 % |
| 68 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `sweet-spot` | damage a silver | 0.8920 | 0.8810 | -0.0110 | -1.2 % |
| 69 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `steady-max` | damage | 30,057,473 | 29,691,713 | -365,760 | -1.2 % |
| 70 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `steady-max` | damage a hired unit | 1,073,481 | 1,060,418.32 | -13,062.68 | -1.2 % |
| 71 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `steady-max` | damage a silver | 0.9240 | 0.9129 | -0.0111 | -1.2 % |
| 72 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · M’s Preservation | damage | 0.9794 | 0.9700 | -0.0094 | -1.0 % |
| 73 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 0.9794 | 0.9700 | -0.0094 | -1.0 % |
| 74 | 2026-09-17 export, its setup (7 000 leadership) | `all-in` | damage a silver | 1.5710 | 1.5560 | -0.0150 | -1.0 % |
| 75 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 0.9955 | 0.9873 | -0.0083 | -0.8 % |
| 76 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · Elite Preservation | damage | 0.9955 | 0.9873 | -0.0083 | -0.8 % |
| 77 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `sweet-spot` | damage | 28,367,940 | 28,140,302 | -227,638 | -0.8 % |
| 78 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · Total Optimization | damage | 1.0247 | 1.0178 | -0.0069 | -0.7 % |
| 79 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 1.0247 | 1.0178 | -0.0069 | -0.7 % |
| 80 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 1.0247 | 1.0178 | -0.0069 | -0.7 % |
| 81 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · Elite Preservation | damage | 1.0247 | 1.0178 | -0.0069 | -0.7 % |
| 82 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `sweet-spot` | damage a silver | 1.6580 | 1.6483 | -0.0097 | -0.6 % |
| 83 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `silver-saver` | damage a silver | 1.0050 | 0.9995 | -0.0055 | -0.5 % |
| 84 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `all-in` | damage a silver | 1.6950 | 1.6898 | -0.0052 | -0.3 % |
| 85 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · M’s Preservation | damage | 1.1467 | 1.1448 | -0.0019 | -0.2 % |
| 86 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 1.1467 | 1.1448 | -0.0019 | -0.2 % |
| 87 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 1.1467 | 1.1448 | -0.0019 | -0.2 % |
| 88 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · M’s Preservation | damage a silver | 0.9866 | 0.9859 | -0.0006 | -0.1 % |
| 89 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 0.9866 | 0.9859 | -0.0006 | -0.1 % |
| 90 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs the best sizer sequence | damage a silver | 0.9946 | 0.9942 | -0.0004 | -0.0 % |
| 91 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · M’s Preservation | damage | 0.9859 | 0.9857 | -0.0003 | -0.0 % |
| 92 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 0.9859 | 0.9857 | -0.0003 | -0.0 % |
| 93 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · M’s Preservation | damage a silver | 0.9830 | 0.9827 | -0.0003 | -0.0 % |
| 94 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 0.9830 | 0.9827 | -0.0003 | -0.0 % |
| 95 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · Total Optimization | damage a silver | 0.9935 | 0.9934 | -0.0002 | -0.0 % |
| 96 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · Total Optimization | damage | 0.9985 | 0.9985 | -0.0000 | -0.0 % |
| 97 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 0.9985 | 0.9985 | -0.0000 | -0.0 % |
| 98 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · Elite Preservation | damage | 0.9985 | 0.9985 | -0.0000 | -0.0 % |

## Rises

**Stops the *to* side offers and the *from* side does not** — news to register, not a regression:

- **2026-09-17 export, its setup (7 000 leadership)** — `silver-saver`: 16,115,314 damage · 8,695,000 silver · 32 burned · 1.8534 a silver · 503,603.56 a hired · 24d 6h

143 readings rose, sorted by size.

| # | scenario | stop | reading | from | to | Δ | Δ % |
|---|---|---|---|---|---|---|---|
| 1 | first-run army, Bear V ×1 (20 000 leadership) | standing vs the best sizer sequence | damage | 0.1976 | 0.9813 | +0.7837 | +396.6 % |
| 2 | first-run army, Bear V ×1 (20 000 leadership) | `sweet-spot` | damage | 4,722,842 | 18,189,008 | +13,466,166 | +285.1 % |
| 3 | first-run army, Bear V ×1 (20 000 leadership) | `sweet-spot` | damage a hired unit | 4,722,842 | 18,189,008 | +13,466,166 | +285.1 % |
| 4 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 0.4518 | 1.3846 | +0.9328 | +206.5 % |
| 5 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 2.7060 | 7.7328 | +5.0269 | +185.8 % |
| 6 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 1.4822 | 4.0940 | +2.6118 | +176.2 % |
| 7 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · Elite Preservation | damage | 0.4054 | 1.0242 | +0.6188 | +152.7 % |
| 8 | first-run army, Bear V ×2 (20 000 leadership) | standing vs the best sizer sequence | damage | 0.3987 | 0.9894 | +0.5908 | +148.2 % |
| 9 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs the best sizer sequence | damage | 0.3733 | 0.8610 | +0.4878 | +130.7 % |
| 10 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 0.3757 | 0.8610 | +0.4854 | +129.2 % |
| 11 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 0.3757 | 0.8610 | +0.4854 | +129.2 % |
| 12 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 1.4494 | 3.0253 | +1.5759 | +108.7 % |
| 13 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 2.5922 | 5.2168 | +2.6246 | +101.3 % |
| 14 | first-run army, Bear V ×2 (20 000 leadership) | `sweet-spot` | damage | 9,557,884 | 18,413,408 | +8,855,524 | +92.7 % |
| 15 | first-run army, Bear V ×2 (20 000 leadership) | `sweet-spot` | damage a hired unit | 4,778,942 | 9,206,704 | +4,427,762 | +92.7 % |
| 16 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 1.8776 | 2.7831 | +0.9055 | +48.2 % |
| 17 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · Elite Preservation | damage | 1.8776 | 2.7831 | +0.9055 | +48.2 % |
| 18 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 1.8788 | 2.6849 | +0.8062 | +42.9 % |
| 19 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · Elite Preservation | damage a silver | 1.8788 | 2.6849 | +0.8062 | +42.9 % |
| 20 | first-run army, Bear V ×3 (20 000 leadership) | `sweet-spot` | damage a hired unit | 4,722,842 | 6,137,802.67 | +1,414,960.67 | +30.0 % |
| 21 | first-run army, Bear V ×3 (20 000 leadership) | `sweet-spot` | damage | 14,168,526 | 18,413,408 | +4,244,882 | +30.0 % |
| 22 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 1.7994 | 2.3215 | +0.5221 | +29.0 % |
| 23 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · Elite Preservation | damage a silver | 1.7994 | 2.3215 | +0.5221 | +29.0 % |
| 24 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 2.3699 | 3.0253 | +0.6554 | +27.7 % |
| 25 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 0.7933 | 1.0005 | +0.2072 | +26.1 % |
| 26 | first-run army, Bear V ×3 (20 000 leadership) | standing vs the best sizer sequence | damage | 0.7936 | 1.0000 | +0.2064 | +26.0 % |
| 27 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 1.3674 | 1.7225 | +0.3551 | +26.0 % |
| 28 | 2026-09-17 export, its setup (7 000 leadership) | `sweet-spot` | hired burned | 47 | 35 | -12 | -25.5 % |
| 29 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 1.4477 | 1.8071 | +0.3594 | +24.8 % |
| 30 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 1.7620 | 2.1966 | +0.4346 | +24.7 % |
| 31 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · Elite Preservation | damage | 1.7620 | 2.1966 | +0.4346 | +24.7 % |
| 32 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 1.8161 | 2.2358 | +0.4197 | +23.1 % |
| 33 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 0.8631 | 1.0558 | +0.1928 | +22.3 % |
| 34 | first-run army, Bear V ×10 (20 000 leadership) | `all-in` | damage a silver | 0.4760 | 0.5802 | +0.1042 | +21.9 % |
| 35 | first-run army, Bear V ×10 (20 000 leadership) | `all-in` | silver | 45,577,400 | 36,013,400 | -9,564,000 | -21.0 % |
| 36 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 1.4253 | 1.7187 | +0.2935 | +20.6 % |
| 37 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs the best sizer sequence | damage | 0.9912 | 1.1756 | +0.1844 | +18.6 % |
| 38 | 2026-09-17 export, its setup (7 000 leadership) | `sweet-spot` | damage a hired unit | 460,909 | 537,038.51 | +76,129.51 | +16.5 % |
| 39 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 0.7514 | 0.8750 | +0.1236 | +16.4 % |
| 40 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 1.2952 | 1.5066 | +0.2114 | +16.3 % |
| 41 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 2.0834 | 2.4218 | +0.3384 | +16.2 % |
| 42 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 1.3742 | 1.5911 | +0.2169 | +15.8 % |
| 43 | first-run army, Bear V ×10 (20 000 leadership) | standing vs the best sizer sequence | damage | 0.8634 | 0.9877 | +0.1243 | +14.4 % |
| 44 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 0.8193 | 0.9296 | +0.1103 | +13.5 % |
| 45 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `all-in` | damage a silver | 0.7970 | 0.8964 | +0.0994 | +12.5 % |
| 46 | 2026-09-17 export, its setup (7 000 leadership) | `more-mercs` | hired burned | 50 | 44 | -6 | -12.0 % |
| 47 | 2026-09-17 export, 12 000 leadership | `silver-saver` | silver | 14,231,900 | 12,539,600 | -1,692,300 | -11.9 % |
| 48 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `silver-saver` | damage | 18,681,950 | 20,891,829 | +2,209,879 | +11.8 % |
| 49 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `all-in` | damage | 29,111,661 | 31,714,657 | +2,602,996 | +8.9 % |
| 50 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `all-in` | silver | 36,125,500 | 33,291,200 | -2,834,300 | -7.8 % |
| 51 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · M’s Preservation | damage | 0.8942 | 0.9615 | +0.0673 | +7.5 % |
| 52 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 0.8942 | 0.9615 | +0.0673 | +7.5 % |
| 53 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | standing vs TotalStack · Total Optimization | damage | 0.8850 | 0.9514 | +0.0664 | +7.5 % |
| 54 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 1.5933 | 1.7098 | +0.1165 | +7.3 % |
| 55 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 1.5933 | 1.7098 | +0.1165 | +7.3 % |
| 56 | 2026-09-17 export, its setup (7 000 leadership) | standing vs the best sizer sequence | damage | 0.8964 | 0.9588 | +0.0624 | +7.0 % |
| 57 | 2026-09-17 export, its setup (7 000 leadership) | `all-in` | damage a hired unit | 242,134 | 256,738.26 | +14,604.26 | +6.0 % |
| 58 | 2026-09-17 export, 12 000 leadership | `silver-saver` | hired burned | 51 | 48 | -3 | -5.9 % |
| 59 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `silver-saver` | damage | 22,179,294 | 23,474,915 | +1,295,621 | +5.8 % |
| 60 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · Total Optimization | damage a silver | 1.6990 | 1.7936 | +0.0946 | +5.6 % |
| 61 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · M’s Preservation | damage a silver | 1.6877 | 1.7814 | +0.0937 | +5.6 % |
| 62 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · Total Optimization | damage | 2.0366 | 2.1458 | +0.1092 | +5.4 % |
| 63 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · M’s Preservation | damage | 2.0355 | 2.1446 | +0.1091 | +5.4 % |
| 64 | 2026-09-17 export, its setup (7 000 leadership) | `all-in` | damage | 22,518,504 | 23,619,920 | +1,101,416 | +4.9 % |
| 65 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs Kai’s calculator · extract (as captured, repeated) | damage a silver | 0.9668 | 1.0083 | +0.0415 | +4.3 % |
| 66 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · M’s Preservation | damage a silver | 1.1565 | 1.2060 | +0.0495 | +4.3 % |
| 67 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 1.1565 | 1.2060 | +0.0495 | +4.3 % |
| 68 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 1.1565 | 1.2060 | +0.0495 | +4.3 % |
| 69 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs the best sizer sequence | damage a silver | 1.1837 | 1.2340 | +0.0503 | +4.2 % |
| 70 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `all-in` | damage a silver | 1.3450 | 1.4006 | +0.0556 | +4.1 % |
| 71 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 0.9906 | 1.0312 | +0.0406 | +4.1 % |
| 72 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 0.9906 | 1.0312 | +0.0406 | +4.1 % |
| 73 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · Elite Preservation | damage a silver | 0.9906 | 1.0312 | +0.0406 | +4.1 % |
| 74 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 0.9364 | 0.9742 | +0.0377 | +4.0 % |
| 75 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · optimize (as captured, repeated) | damage a silver | 0.9352 | 0.9725 | +0.0373 | +4.0 % |
| 76 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · M’s Preservation | damage a silver | 0.9352 | 0.9725 | +0.0373 | +4.0 % |
| 77 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 0.9352 | 0.9725 | +0.0373 | +4.0 % |
| 78 | 2026-09-17 export, 12 000 leadership | standing vs the best sizer sequence | damage a silver | 0.9927 | 1.0308 | +0.0381 | +3.8 % |
| 79 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 1.3456 | 1.3961 | +0.0506 | +3.8 % |
| 80 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 1.3456 | 1.3961 | +0.0506 | +3.8 % |
| 81 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `all-in` | damage a hired unit | 959,388 | 994,729.3 | +35,341.3 | +3.7 % |
| 82 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | `all-in` | damage | 28,781,642 | 29,841,879 | +1,060,237 | +3.7 % |
| 83 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · Total Optimization | damage a silver | 1.0340 | 1.0718 | +0.0378 | +3.7 % |
| 84 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 1.0340 | 1.0718 | +0.0378 | +3.7 % |
| 85 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 1.0340 | 1.0718 | +0.0378 | +3.7 % |
| 86 | live account of 2026-09-18 (one hired type, 20 000 leadership) | standing vs TotalStack · Elite Preservation | damage a silver | 1.0340 | 1.0718 | +0.0378 | +3.7 % |
| 87 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · Total Optimization | damage a silver | 0.9814 | 1.0166 | +0.0352 | +3.6 % |
| 88 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs Kai’s calculator · extract (as captured, repeated) | damage | 0.9547 | 0.9888 | +0.0341 | +3.6 % |
| 89 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs the best sizer sequence | damage a silver | 0.9661 | 1.0000 | +0.0339 | +3.5 % |
| 90 | 2026-09-17 export, its setup (7 000 leadership) | `more-mercs` | silver | 10,957,600 | 10,581,400 | -376,200 | -3.4 % |
| 91 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 0.9976 | 1.0312 | +0.0336 | +3.4 % |
| 92 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 0.9976 | 1.0312 | +0.0336 | +3.4 % |
| 93 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · Elite Preservation | damage | 0.9976 | 1.0312 | +0.0336 | +3.4 % |
| 94 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 0.9429 | 0.9737 | +0.0308 | +3.3 % |
| 95 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · optimize (as captured, repeated) | damage | 0.9420 | 0.9723 | +0.0302 | +3.2 % |
| 96 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · M’s Preservation | damage | 0.9420 | 0.9723 | +0.0302 | +3.2 % |
| 97 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 0.9420 | 0.9723 | +0.0302 | +3.2 % |
| 98 | 2026-09-17 export, its setup (7 000 leadership) | `more-mercs` | damage a hired unit | 442,677 | 456,346.86 | +13,669.86 | +3.1 % |
| 99 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs the best sizer sequence | damage | 0.9723 | 1.0000 | +0.0277 | +2.8 % |
| 100 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | standing vs TotalStack · Total Optimization | damage | 0.9888 | 1.0166 | +0.0278 | +2.8 % |
| 101 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `all-in` | silver | 6,241,000 | 6,083,200 | -157,800 | -2.5 % |
| 102 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · Elite Preservation | damage | 1.0910 | 1.1185 | +0.0276 | +2.5 % |
| 103 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · Elite Preservation | damage a silver | 1.0909 | 1.1130 | +0.0221 | +2.0 % |
| 104 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · Total Optimization | damage | 1.6636 | 1.6972 | +0.0335 | +2.0 % |
| 105 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `more-mercs` | damage | 29,265,102 | 29,851,070 | +585,968 | +2.0 % |
| 106 | 2026-09-17 export, 12 000 leadership | standing vs TotalStack · M’s Preservation | damage | 1.6520 | 1.6848 | +0.0328 | +2.0 % |
| 107 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `more-mercs` | damage a silver | 1.7040 | 1.7376 | +0.0336 | +2.0 % |
| 108 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `steady-max` | damage | 30,107,115 | 30,693,083 | +585,968 | +1.9 % |
| 109 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `steady-max` | damage a silver | 1.7530 | 1.7866 | +0.0336 | +1.9 % |
| 110 | 2026-09-17 export, 12 000 leadership | `silver-saver` | damage a silver | 1.7670 | 1.7968 | +0.0298 | +1.7 % |
| 111 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `silver-saver` | damage a hired unit | 934,098 | 949,628.59 | +15,530.59 | +1.7 % |
| 112 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · M’s Preservation | damage a silver | 2.0374 | 2.0704 | +0.0330 | +1.6 % |
| 113 | 2026-09-17 export, its setup (7 000 leadership) | standing vs TotalStack · Total Optimization | damage a silver | 2.0374 | 2.0702 | +0.0327 | +1.6 % |
| 114 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `all-in` | damage | 8,394,732 | 8,519,930 | +125,198 | +1.5 % |
| 115 | the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | `all-in` | damage a hired unit | 349,781 | 354,997.08 | +5,216.08 | +1.5 % |
| 116 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under Elite (averageDamage) | damage | 1.0098 | 1.0231 | +0.0133 | +1.3 % |
| 117 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage | 1.0098 | 1.0231 | +0.0133 | +1.3 % |
| 118 | 2026-09-17 export, 12 000 leadership | standing vs the best sizer sequence | damage | 0.9485 | 0.9605 | +0.0120 | +1.3 % |
| 119 | first-run army, Bear V ×10 (20 000 leadership) | standing vs the best sizer sequence | damage a silver | 0.9701 | 0.9819 | +0.0117 | +1.2 % |
| 120 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 0.9701 | 0.9816 | +0.0114 | +1.2 % |
| 121 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · Elite Preservation | damage a silver | 0.9701 | 0.9816 | +0.0114 | +1.2 % |
| 122 | 2026-09-17 export, its setup (7 000 leadership) | `all-in` | hired burned | 93 | 92 | -1 | -1.1 % |
| 123 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · M’s Preservation | damage a silver | 0.9545 | 0.9644 | +0.0099 | +1.0 % |
| 124 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage a silver | 0.9545 | 0.9644 | +0.0099 | +1.0 % |
| 125 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under M’s (averageDamage) | damage | 0.9934 | 1.0028 | +0.0094 | +0.9 % |
| 126 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under Elite (averageDamage) | damage a silver | 1.0572 | 1.0661 | +0.0089 | +0.8 % |
| 127 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 1.0572 | 1.0661 | +0.0089 | +0.8 % |
| 128 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs the best sizer sequence | damage | 0.9875 | 0.9929 | +0.0054 | +0.5 % |
| 129 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `all-in` | silver | 31,092,400 | 30,928,400 | -164,000 | -0.5 % |
| 130 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · Total Optimization | damage | 0.9933 | 0.9983 | +0.0049 | +0.5 % |
| 131 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · M’s Preservation | damage | 0.9827 | 0.9874 | +0.0048 | +0.5 % |
| 132 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under M’s (damagePerSilver) | damage | 0.9827 | 0.9874 | +0.0048 | +0.5 % |
| 133 | 2026-09-17 export, its setup (7 000 leadership) | `sweet-spot` | silver | 10,957,600 | 10,906,900 | -50,700 | -0.5 % |
| 134 | first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | standing vs TotalStack · priority search under M’s (averageDamage) | damage a silver | 1.0405 | 1.0453 | +0.0048 | +0.5 % |
| 135 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `silver-saver` | damage a silver | 1.6780 | 1.6833 | +0.0053 | +0.3 % |
| 136 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `steady-max` | silver | 30,270,800 | 30,179,700 | -91,100 | -0.3 % |
| 137 | live account of 2026-09-18 (one hired type, 20 000 leadership) | `sweet-spot` | silver | 30,607,200 | 30,516,200 | -91,000 | -0.3 % |
| 138 | live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | `sweet-spot` | silver | 17,104,800 | 17,072,400 | -32,400 | -0.2 % |
| 139 | 2026-09-17 export, 12 000 leadership | `steady-max` | silver | 21,057,500 | 21,035,600 | -21,900 | -0.1 % |
| 140 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · Total Optimization | damage a silver | 0.9983 | 0.9986 | +0.0003 | +0.0 % |
| 141 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · priority search under Elite (damagePerSilver) | damage a silver | 0.9983 | 0.9986 | +0.0003 | +0.0 % |
| 142 | first-run army, Bear V ×3 (20 000 leadership) | standing vs TotalStack · Elite Preservation | damage a silver | 0.9983 | 0.9986 | +0.0003 | +0.0 % |
| 143 | first-run army, Bear V ×10 (20 000 leadership) | standing vs TotalStack · Total Optimization | damage a silver | 0.9985 | 0.9987 | +0.0003 | +0.0 % |
