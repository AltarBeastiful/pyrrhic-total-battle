**`Tight` on its own against `Tight` + `Tight (old)`**, on every stop of the bar that has a box to
search. **alone** is the stop priced with `OFFERED_POSITIONS` = `[`tight`]`; **both** is the
shipped `[`tight`, `tightOld`]`; **Δ** is the second search the bar pays for the
comparison segment. Three fresh-kernel runs each, min taken, so a cold JIT does not read as a cost.

| army · stop | box (how) | alone ms | both ms | Δ ms | Δ % | answers |
|---|---|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) · sweet-spot | 0 (—) | 0.5 | 0.6 | 0.1 | 21.7 % | same |
| first-run army, Bear V ×2 (20 000 leadership) · sweet-spot | 0 (—) | 0.6 | 0.5 | -0.0 | -5.8 % | same |
| first-run army, Bear V ×3 (20 000 leadership) · sweet-spot | 3 (walked) | 0.3 | 0.4 | 0.1 | 24.6 % | same |
| first-run army, Bear V ×3 (20 000 leadership) · all-in | 0 (—) | 0.2 | 0.3 | 0.1 | 24.9 % | same |
| first-run army, Bear V ×10 (20 000 leadership) · sweet-spot | 0 (—) | 0.5 | 0.3 | -0.1 | -28.5 % | same |
| first-run army, Bear V ×10 (20 000 leadership) · all-in | 0 (—) | 0.2 | 0.2 | 0.0 | 12.4 % | same |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) · burn-saver | 0 (—) | 0.2 | 0.3 | 0.0 | 11.6 % | same |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) · sweet-spot | 0 (—) | 0.2 | 0.3 | 0.0 | 16.2 % | same |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) · steady-max | 2 (walked) | 0.2 | 0.3 | 0.1 | 31.2 % | same |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) · all-in | 0 (—) | 0.2 | 0.3 | 0.0 | 11.1 % | same |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · burn-saver | 18 (walked) | 0.5 | 0.6 | 0.1 | 19.2 % | **differ** |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · sweet-spot | 50 (walked) | 0.5 | 0.6 | 0.1 | 23.6 % | **differ** |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · more-mercs | 12 (walked) | 0.4 | 0.6 | 0.1 | 34.1 % | **differ** |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · steady-max | 6 (walked) | 0.5 | 0.5 | 0.0 | 0.9 % | **differ** |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · all-in | 0 (—) | 0.5 | 0.5 | -0.0 | -8.6 % | same |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · silver-saver | 202,001,817,600,000 (searched) | 3273.3 | 4801.3 | 1528.0 | 46.7 % | **differ** |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot | 447,678,666,661,071,600,000,000 (searched) | 37171.9 | 53342.5 | 16170.6 | 43.5 % | **differ** |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs | 50,070,511,895,040,000 (searched) | 6189.6 | 8314.8 | 2125.2 | 34.3 % | **differ** |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · steady-max | 6 (walked) | 0.3 | 0.4 | 0.1 | 34.4 % | **differ** |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · all-in | 0 (—) | 0.3 | 0.4 | 0.1 | 22.5 % | same |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) · silver-saver | 40 (walked) | 0.3 | 0.3 | 0.0 | 12.0 % | same |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) · sweet-spot | 12 (walked) | 0.3 | 0.3 | 0.1 | 28.5 % | same |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) · all-in | 0 (—) | 0.2 | 0.3 | 0.1 | 37.2 % | same |
| 2026-09-17 export, its setup (7 000 leadership) · burn-saver | 0 (—) | 0.3 | 0.3 | 0.1 | 20.7 % | same |
| 2026-09-17 export, its setup (7 000 leadership) · silver-saver | 0 (—) | 0.2 | 0.3 | 0.1 | 24.9 % | same |
| 2026-09-17 export, its setup (7 000 leadership) · sweet-spot | 0 (—) | 0.2 | 0.3 | 0.1 | 47.0 % | same |
| 2026-09-17 export, its setup (7 000 leadership) · steady-max | 3 (walked) | 0.2 | 0.3 | 0.0 | 16.2 % | same |
| 2026-09-17 export, its setup (7 000 leadership) · all-in | 0 (—) | 0.2 | 0.2 | 0.1 | 31.2 % | same |
| 2026-09-17 export, 12 000 leadership · burn-saver | 0 (—) | 0.2 | 0.3 | 0.0 | 16.4 % | same |
| 2026-09-17 export, 12 000 leadership · silver-saver | 630 (walked) | 0.5 | 0.6 | 0.1 | 24.4 % | same |
| 2026-09-17 export, 12 000 leadership · sweet-spot | 35 (walked) | 0.2 | 0.3 | 0.1 | 24.4 % | same |
| 2026-09-17 export, 12 000 leadership · steady-max | 35 (walked) | 0.2 | 0.3 | 0.1 | 24.8 % | same |
| live account of 2026-09-18 (one hired type, 20 000 leadership) · silver-saver | 0 (—) | 0.2 | 0.2 | 0.0 | 22.8 % | same |
| live account of 2026-09-18 (one hired type, 20 000 leadership) · sweet-spot | 0 (—) | 0.2 | 0.2 | -0.0 | -8.7 % | same |
| live account of 2026-09-18 (one hired type, 20 000 leadership) · steady-max | 3 (walked) | 0.2 | 0.2 | 0.0 | 14.8 % | same |
| live account of 2026-09-18 (one hired type, 20 000 leadership) · all-in | 0 (—) | 0.2 | 0.2 | 0.0 | 12.0 % | same |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · burn-saver | 3 (walked) | 0.2 | 0.2 | 0.0 | 19.1 % | same |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · silver-saver | 588 (walked) | 0.5 | 0.5 | 0.0 | 9.9 % | same |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · sweet-spot | 360 (walked) | 0.4 | 0.4 | -0.0 | -1.8 % | same |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · steady-max | 6 (walked) | 0.2 | 0.2 | 0.1 | 32.0 % | same |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · all-in | 0 (—) | 0.2 | 0.2 | 0.0 | 12.4 % | same |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) · burn-saver | 3 (walked) | 0.2 | 0.2 | 0.0 | 20.4 % | same |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) · sweet-spot | 3 (walked) | 0.2 | 0.3 | 0.1 | 25.9 % | same |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) · steady-max | 3 (walked) | 0.2 | 0.2 | 0.0 | 1.0 % | same |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) · all-in | 0 (—) | 0.2 | 0.2 | 0.0 | 10.8 % | same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · burn-saver | 0 (—) | 0.2 | 0.2 | 0.0 | 4.3 % | same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · silver-saver | 30 (walked) | 0.2 | 0.2 | 0.0 | 20.3 % | same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · sweet-spot | 0 (—) | 0.2 | 0.2 | 0.0 | 10.2 % | same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · more-mercs | 80 (walked) | 0.2 | 0.2 | 0.0 | 14.2 % | same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · steady-max | 8 (walked) | 0.1 | 0.2 | 0.0 | 9.2 % | same |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · burn-saver | 2 (walked) | 0.2 | 0.2 | 0.0 | 6.5 % | **differ** |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · silver-saver | 0 (—) | 0.1 | 0.2 | 0.0 | 7.7 % | same |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · sweet-spot | 3 (walked) | 0.1 | 0.2 | 0.0 | 13.2 % | same |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · more-mercs | 0 (—) | 0.1 | 0.1 | 0.0 | 6.5 % | same |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · steady-max | 7 (walked) | 0.1 | 0.2 | 0.0 | 24.0 % | same |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · burn-saver | 0 (—) | 0.2 | 0.2 | -0.0 | -2.4 % | same |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · silver-saver | 0 (—) | 0.1 | 0.2 | 0.0 | 13.3 % | same |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · sweet-spot | 0 (—) | 0.1 | 0.2 | 0.0 | 2.9 % | same |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · steady-max | 0 (—) | 0.1 | 0.2 | 0.0 | 34.6 % | same |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · all-in | 0 (—) | 0.1 | 0.1 | -0.0 | -4.5 % | same |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) · silver-saver | 2 (walked) | 0.2 | 0.2 | 0.0 | 15.5 % | same |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) · sweet-spot | 0 (—) | 0.2 | 0.2 | 0.0 | 1.1 % | same |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) · steady-max | 0 (—) | 0.2 | 0.2 | 0.0 | 11.9 % | same |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) · burn-saver | 396 (walked) | 0.5 | 0.4 | -0.0 | -6.7 % | same |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) · sweet-spot | 0 (—) | 0.2 | 0.3 | 0.0 | 10.5 % | same |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) · steady-max | 0 (—) | 0.2 | 0.2 | 0.0 | 8.7 % | same |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) · sweet-spot | 0 (—) | 0.2 | 0.2 | 0.0 | 8.0 % | same |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) · all-in | 0 (—) | 0.2 | 0.3 | 0.0 | 11.8 % | same |
| the live account of 2026-10-11 (My account) · burn-saver | 19,602 (walked) | 14.2 | 14.1 | -0.0 | -0.2 % | same |
| the live account of 2026-10-11 (My account) · sweet-spot | 0 (—) | 0.3 | 0.4 | 0.0 | 3.4 % | same |
| the live account of 2026-10-11 (My account) · more-mercs | 3,024 (walked) | 2.0 | 2.1 | 0.1 | 3.5 % | same |
| the live account of 2026-10-11 (My account) · steady-max | 0 (—) | 0.3 | 0.3 | 0.0 | 14.9 % | same |
| the live account of 2026-10-11 (My account) · all-in | 0 (—) | 0.3 | 0.3 | -0.0 | -2.7 % | same |

## What the numbers say

- **73** stops priced (31 walked, 3 searched) over every
  benchmark army and the live account.
- **The whole corpus**: `Tight` alone 46,668 ms, `Tight (old)` beside it
  66,494 ms — the second search adds 19,826 ms
  (42.5 %). **That total is two stops of one camp**: the
  monster tiers 3–7 at 20 000 dominance, whose searched boxes are 10¹⁴–10²³ vectors and cost 3.6–37 s a
  stop. No real account reaches them — 0025’s own live workload meets none.
- **Every ordinary stop** (`Tight` under a second — 70 of 73):
  33.6 ms alone, 35.9 ms with it, a margin of
  **2.3 ms** (6.9 %).
- **The live account of 2026-10-11’s own bar** (its 5 stops): 17.1 ms
  alone, 17.2 ms with it — `Tight (old)` costs **0.1 ms** a
  Generate. A player cannot feel a millisecond.
- The two positions answered **differently on 9 of 73** stops — and on the
  live account’s own bar, never. Where they agree, the second search re-ranks the same box and buys
  nothing a player can see.
- The single widest margin is **16170.6 ms** (`first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot`).
