Stops whose box is wider than a walk, priced at the identical cap, rank, seed and sweep limit, with
only the number of seeded starts moved (`EXACT_DEFAULTS.restarts` is 64).
**rating** is the owner's `rate(as is, ·, markerRates)`; **ms** is one call on a fresh kernel.

| army · stop | space | 1 start | 4 starts | 8 starts | 16 starts | 32 starts | 64 starts |
|---|---:---:|---:|---:|---:|---:|---:|
| | | rating · ms | rating · ms | rating · ms | rating · ms | rating · ms | rating · ms |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · silver-saver | 3770700595200000 | 16.503 · 48 same | 16.503 · 246 same | 16.503 · 464 same | 16.503 · 952 same | 16.503 · 1984 same | 16.503 · 4097 same |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot | 1.969786133308715e+25 | 47.649 · 611 same | 47.649 · 2613 same | 47.649 · 5230 same | 47.649 · 10974 same | 47.649 · 23153 same | 47.649 · 47023 same |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs | 625881398688000000 | 13.786 · 107 same | 13.786 · 390 same | 13.786 · 804 same | 13.786 · 1630 same | 13.786 · 3212 same | 13.786 · 6634 same |
| 2026-09-17 export, 12 000 leadership · burn-saver | 729267 | 0.000 · 5 same | 0.000 · 5 same | 0.000 · 5 same | 0.000 · 5 same | 0.000 · 8 same | 0.000 · 8 same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · more-mercs | 908684 | 3.837 · 5 same | 3.837 · 8 same | 3.837 · 16 same | 3.837 · 17 same | 3.837 · 27 same | 3.837 · 52 same |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) · steady-max | 351900 | 0.000 · 2 same | 0.000 · 2 same | 0.000 · 3 same | 0.000 · 3 same | 0.000 · 4 same | 0.000 · 7 same |
| the live account of 2026-10-11 (My account) · all-in | 135097600 | 0.000 · 1 same | 0.000 · 5 same | 0.000 · 10 same | 0.000 · 21 same | 0.000 · 40 same | 0.000 · 80 same |

## What the numbers say
- **7 searched stops.** Each row reads across the starts; the first column is the caller's own
  vector alone — the climb the search is seeded with, which the default then improves on.
- Rating given up against the default (Σ over stops): 1 starts → 0.00 · 4 starts → 0.00 · 8 starts → 0.00 · 16 starts → 0.00 · 32 starts → 0.00 · 64 starts → 0.00.
- Stops where a cheaper arm answered **different counts** than the default: **0**.
