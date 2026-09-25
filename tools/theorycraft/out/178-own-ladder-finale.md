# 178 — the own-ladder finale, re-typed (W14 step 3)

The finale sized on a stop’s own ladder (`plan.ts`, trace step `ownLadderFinale`) was built after the re-typing pass and never re-typed (176, cause e: 5 marches, +28.65). Every benchmark army planned with `budgetMs` off, the plan kernel set (the TS path planned too and compared bar for bar); compared with HEAD before W14 (`out/176-baseline.json`) and with step 2’s state (`out/177-silver-saver-per-march.json`) by `plan-report.ts`. Every figure measured. Kept: **i**.

## The variants

| variant | stops vs 177 (b/e/w) | stops vs 176 (b/e/w) | marches vs 177 (b/e/w) | Σ rating vs 177 | readings worse vs 177 | criteria broken | TotalStack | 162 | kernel Σ ms (+ vs none) | TS Σ ms (+ vs none) | TS = kernel |
|---|---|---|---|---:|---|---|---|---:|---:|---:|---|
| none | 0/63/0 | 5/58/0 | 0/145/0 | 0.000 | none | none | 70/13 of 112 | 2 | 2,422 (0) | 18,651 (0) | same |
| i | 14/49/0 | 17/46/0 | 11/131/3 | 43.659 | none | none | 70/13 of 112 | 2 | 2,546 (124) | 19,981 (1,330) | same |
| ii | 25/38/0 | 30/33/0 | 44/101/0 | 32.696 | none | none | 70/13 of 112 | 2 | 2,435 (13) | 19,705 (1,054) | same |
| i+ii | 32/31/0 | 35/28/0 | 49/93/3 | 44.445 | none | none | 70/13 of 112 | 2 | 2,612 (190) | 20,142 (1,491) | same |

## 176’s “other — not a fixed point” marches (32 marches), picked up against 177

| army | stop | march | 176 gain | none | i | ii | i+ii |
|---|---|---|---:|---:|---:|---:|---:|
| his camp of 2026-09-19, the localStorage dum | HS | repeat | 0.549 | 0.000 | 0.000 | 0.000 | 0.000 |
| the owner’s live camp of 2026-09-18 (arbales | HS | repeat | 0.435 | 0.000 | 0.000 | 0.000 | 0.000 |
| live account, evening (hunters 83, legionari | HS | repeat | 0.323 | 0.000 | 0.000 | 0.022 | 0.022 |
| live account, evening (hunters 83, legionari | MX | finale | 0.204 | 0.000 | 0.000 | 0.000 | 0.000 |
| live account, evening (hunters 83, legionari | SW | finale | 0.201 | 0.000 | 0.370 | 0.000 | 0.370 |
| live account, evening (hunters 83, legionari | HS | finale | 0.192 | 0.000 | 0.345 | 0.000 | 0.345 |
| Aydae alone, 4 975 (one captain, four hired | HS | repeat | 0.054 | — | — | — | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 4 | 0.036 | 0.000 | 0.000 | 0.067 | 0.067 |
| his camp of 2026-09-19, as his message reads | AI | sequence 3 | 0.033 | 0.000 | 0.000 | 0.061 | 0.061 |
| his camp of 2026-09-19, as his message reads | MX | repeat | 0.032 | 0.000 | 0.000 | 0.179 | 0.179 |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 2 | 0.026 | 0.000 | 0.000 | 0.026 | 0.026 |
| his camp of 2026-09-19, as his message reads | HS | repeat | 0.023 | 0.000 | 0.000 | 0.068 | 0.068 |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 4 | 0.019 | 0.000 | 0.000 | 0.019 | 0.019 |
| first-run army, Bear V ×1 (20 000 leadership | SW | tail | 0.019 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×2 (20 000 leadership | SW | tail | 0.019 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×3 (20 000 leadership | SW | tail | 0.019 | 0.000 | 0.000 | 0.019 | 0.019 |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 4 | 0.019 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 3 | 0.018 | 0.000 | 0.000 | 0.018 | 0.018 |
| first-run army, Bear V ×1 (20 000 leadership | SW | repeat | 0.018 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×2 (20 000 leadership | SW | finale | 0.018 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×3 (20 000 leadership | SW | repeat | 0.018 | 0.000 | 0.000 | 0.055 | 0.055 |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 3 | 0.018 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×2 (20 000 leadership | SW | repeat | 0.018 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 2 | 0.018 | 0.000 | 0.000 | 0.000 | 0.000 |
| his usual setup of 2026-09-19 (Aydae alone, | HS | repeat | 0.017 | — | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 1 | 0.017 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | repeat | 0.017 | 0.000 | 0.000 | 0.050 | 0.050 |
| first-run army, Bear V ×10 (20 000 leadershi | SW | repeat | 0.016 | 0.000 | 0.000 | 0.000 | 0.000 |
| first-run army, Bear V ×10 (20 000 leadershi | SW | finale | 0.016 | 0.000 | 0.000 | 0.000 | 0.000 |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 2 | 0.013 | 0.000 | 0.000 | 0.013 | 0.013 |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 2 | 0.012 | 0.000 | 0.000 | 0.012 | 0.012 |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 1 | 0.011 | 0.000 | 0.000 | 0.011 | 0.011 |

Picked up (> 0.01): none 0 (+0.000), i 2 (+0.714), ii 14 (+0.619), i+ii 16 (+1.333).

## Against 177 (step 2, the new “before”)

**Stops** better / equal / worse: **14 / 49 / 0** (0 new, 0 gone). **Marches** better / equal-or-unchanged / worse: **11 / 131 / 3**. Σ rating gained over the marches (× times played): 43.659. TotalStack at matched spend (dominated / no stop fits): 70/13 of 112 → 70/13 of 112; 162's rows: 2 → 2. Bar criteria broken: none. Readings worse: none.

### The marches that gained (rating × times played)

| army | stop | march | rating |
|---|---|---|---:|
| his camp of 2026-09-19, as his message reads | MX | finale | 12.185 |
| his camp of 2026-09-19, as his message reads | HS | finale | 7.716 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 |
| live account of 2026-09-18 (one hired type,  | SS | finale | 4.927 |
| live account, evening (hunters 83, legionari | SS | finale | 4.264 |
| 2026-09-17 export, its setup (7 000 leadersh | HS | finale | 3.171 |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | finale | 3.091 |
| 2026-09-17 export, 12 000 leadership | SS | finale | 1.973 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 |
| Aydae alone, 4 975 (one captain, four hired  | MX | finale | 0.031 |

### Every worse figure, per march

| army | stop | march | march rating | figure |
|---|---|---|---:|---|
| the 4 000-leadership case of 2026-09-15 (Tot | SS | finale | 3.091 | shelter margin 1.122 → 1.047 |
| 2026-09-17 export, its setup (7 000 leadersh | HS | finale | 3.171 | perHired 310,958.857 → 308,008.714 |
| 2026-09-17 export, 12 000 leadership | SS | finale | 1.973 | perHired 313,298.389 → 304,355.167 |
| live account of 2026-09-18 (one hired type,  | SS | finale | 4.927 | shelter margin 1.873 → 1.513 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 | silver 6,983,400.000 → 7,719,500.000 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 | seconds 1,646,940.000 → 1,836,915.000 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 | perSilver 0.954 → 0.932 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 | worst 8,548,204.000 → 8,341,739.000 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 | perSilver 1.990 → 1.965 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 | shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | SS | finale | 4.264 | best 8,040,855.000 → 8,039,330.000 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 | worst 8,190,643.000 → 7,984,178.000 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 | perSilver 1.907 → 1.881 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 | shelter margin 1.016 → 1.002 |
| Aydae alone, 4 975 (one captain, four hired  | MX | finale | 0.031 | seconds 566,040.000 → 574,830.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | silver 1,943,800.000 → 2,051,000.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | gold 536.000 → 1,416.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | hired 7.000 → 12.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | seconds 469,080.000 → 660,570.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | perGold 5,197.263 → 2,613.032 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | perHired 231,575.714 → 221,570.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | shelter margin 1.004 → 1.003 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | silver 1,943,300.000 → 2,247,000.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | gold 200.000 → 328.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | hired 3.000 → 5.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | seconds 468,900.000 → 748,590.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | perGold 11,062.025 → 8,029.640 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | perHired 302,010.000 → 297,695.600 |
| his camp of 2026-09-19, as his message reads | HS | finale | 7.716 | seconds 465,450.000 → 468,675.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | silver 1,976,000.000 → 2,303,800.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | gold 192.000 → 344.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | hired 3.000 → 5.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | seconds 465,450.000 → 767,670.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | perGold 10,628.526 → 7,929.890 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | shelter margin 1.014 → 1.003 |
| his camp of 2026-09-19, as his message reads | MX | finale | 12.185 | seconds 759,870.000 → 767,670.000 |

### Per stop (paired by pick) and per army

**Stops better / equal / worse**: 14 / 49 / 0. **TotalStack at matched spend** (dominated / no stop fits): 70/13 of 112 → 70/13 of 112. **162's rows**: 2 → 2.

| army | stop | verdict | rating | marches (role: rating, moved) | worse figures |
|---|---|---|---:|---|---|
| first-run army, Bear V ×1 (20 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); tail: 0.000 (unchanged) | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged); tail: 0.000 (unchanged) | — |
| first-run army, Bear V ×3 (20 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); tail: 0.000 (unchanged) | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| first-run army, Bear V ×10 (20 000 leadershi | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | SW | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | MM | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | better | 1.186 | repeat: 0.000 (unchanged); finale: 3.091 | shelter margin 1.122 → 1.047 |
| the 4 000-leadership case of 2026-09-15 (Tot | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | HS | better | 1.260 | repeat: 0.000 (unchanged); finale: 3.171 | perHired 355,600.192 → 354,011.654 |
| 2026-09-17 export, its setup (7 000 leadersh | SS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| 2026-09-17 export, 12 000 leadership | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, 12 000 leadership | SS | better | 0.767 | repeat: 0.000 (unchanged); finale: 1.973 | perHired 297,347.333 → 293,993.625 |
| 2026-09-17 export, 12 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, 12 000 leadership | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| live account of 2026-09-18 (one hired type,  | SS | better | 1.966 | repeat: 0.000 (unchanged); finale: 4.927 | — |
| live account of 2026-09-18 (one hired type,  | SW | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| live account of 2026-09-18 (one hired type,  | MX | better | 1.297 | repeat: 0.000 (unchanged); finale: 5.587 | silver 30,179,700.000 → 30,915,800.000; seconds 7,116,825.000 → 7,306,800.000; perSilver 0.952 → 0.946 |
| live account of 2026-09-18 (one hired type,  | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| live account, evening (hunters 83, legionari | HS | better | 0.602 | repeat: 0.000 (unchanged); finale: 0.345 | worst 20,575,534.000 → 20,369,069.000; perSilver 1.341 → 1.332; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | SS | better | 1.537 | repeat: 0.000 (unchanged); finale: 4.264 | best 21,720,231.000 → 21,718,706.000 |
| live account, evening (hunters 83, legionari | SW | better | 0.182 | repeat: 0.000 (unchanged); finale: 0.370 | worst 29,479,912.000 → 29,273,447.000; perSilver 1.727 → 1.720; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| live account, evening (hunters 83, legionari | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| Aydae alone, 4 975 (one captain, four hired  | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| Aydae alone, 4 975 (one captain, four hired  | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| Aydae alone, 4 975 (one captain, four hired  | MX | better | 0.007 | repeat: 0.000 (unchanged); finale: 0.031 | seconds 2,695,530.000 → 2,704,320.000 |
| Aydae alone, 4 975 (one captain, four hired  | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | SS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | SW | better | 0.719 | repeat: 0.000 (unchanged); finale: -16.424 | silver 9,850,300.000 → 9,957,500.000; gold 6,344.000 → 7,224.000; hired 52.000 → 57.000; seconds 3,688,380.000 → 3,879,870.000; perGold 2,500.339 → 2,322.324; perHired 208,336.808 → 208,268.842; shelter margin 1.004 → 1.003 |
| the owner’s live camp of 2026-09-18 (arbales | MM | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | SS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | MM | better | 0.883 | repeat: 0.000 (unchanged); finale: -11.707 | silver 10,354,100.000 → 10,657,800.000; gold 3,944.000 → 4,072.000; hired 57.000 → 59.000; seconds 4,397,940.000 → 4,677,630.000; perGold 3,585.788 → 3,576.539 |
| his camp of 2026-09-19, the localStorage dum | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, as his message reads | HS | better | 2.391 | repeat: 0.000 (unchanged); finale: 7.716 | seconds 2,052,555.000 → 2,055,780.000 |
| his camp of 2026-09-19, as his message reads | SS | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| his camp of 2026-09-19, as his message reads | SW | better | 0.950 | repeat: 0.000 (unchanged); finale: -0.432 | silver 8,940,500.000 → 9,268,300.000; gold 1,272.000 → 1,424.000; hired 18.000 → 20.000; seconds 2,773,500.000 → 3,075,720.000; perGold 8,225.237 → 7,829.850 |
| his camp of 2026-09-19, as his message reads | MX | better | 2.683 | repeat: 0.000 (unchanged); finale: 12.185 | seconds 4,008,330.000 → 4,016,130.000 |
| his camp of 2026-09-19, as his message reads | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| his TotalStack profile of 2026-09-19 (5 225  | SS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his TotalStack profile of 2026-09-19 (5 225  | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his TotalStack profile of 2026-09-19 (5 225  | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | SW | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |

| army | better / equal / worse | readings worse | criteria broken | TotalStack |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 0 / 1 / 0 | — | — | 3/0 → 3/0 |
| first-run army, Bear V ×2 (20 000 leadership | 0 / 1 / 0 | — | — | 3/0 → 3/0 |
| first-run army, Bear V ×3 (20 000 leadership | 0 / 2 / 0 | — | — | 8/0 → 8/0 |
| first-run army, Bear V ×10 (20 000 leadershi | 0 / 2 / 0 | — | — | 4/0 → 4/0 |
| first-run army, Epic Monster Hunter VI ×83 ( | 0 / 4 / 0 | — | — | 7/0 → 7/0 |
| first-run army, monster tiers 3–5 at 900 dom | 0 / 5 / 0 | — | — | 0/3 → 0/3 |
| the 4 000-leadership case of 2026-09-15 (Tot | 1 / 2 / 0 | — | — | 10/0 → 10/0 |
| 2026-09-17 export, its setup (7 000 leadersh | 1 / 4 / 0 | — | — | 6/3 → 6/3 |
| 2026-09-17 export, 12 000 leadership | 1 / 3 / 0 | — | — | 3/2 → 3/2 |
| live account of 2026-09-18 (one hired type,  | 2 / 2 / 0 | — | — | 9/0 → 9/0 |
| live account, evening (hunters 83, legionari | 3 / 2 / 0 | — | — | 6/0 → 6/0 |
| Aydae alone, 4 975 (one captain, four hired  | 1 / 3 / 0 | — | — | 0/0 → 0/0 |
| the owner’s live camp of 2026-09-18 (arbales | 1 / 4 / 0 | — | — | 0/0 → 0/0 |
| his camp of 2026-09-19, the localStorage dum | 1 / 4 / 0 | — | — | 2/1 → 2/1 |
| his camp of 2026-09-19, as his message reads | 3 / 2 / 0 | — | — | 2/1 → 2/1 |
| his TotalStack profile of 2026-09-19 (5 225  | 0 / 3 / 0 | — | — | 2/1 → 2/1 |
| his usual setup of 2026-09-19 (Aydae alone,  | 0 / 3 / 0 | — | — | 5/2 → 5/2 |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | 0 / 2 / 0 | — | — | 0/0 → 0/0 |

### Every march use case

| army | stop | march | verdict | rating | worse figures |
|---|---|---|---|---:|---|
| first-run army, Bear V ×1 (20 000 leadership | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×1 (20 000 leadership | SW | tail | unchanged | 0.000 | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | finale | unchanged | 0.000 | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | tail | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | SW | tail | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 4 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | SW | finale | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 4 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | repeat | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | finale | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | SW | repeat | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | MX | repeat | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | MX | finale | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 4 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | HS | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | HS | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | SW | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | SW | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MM | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MM | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MX | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MX | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 4 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | repeat | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | finale | better | 3.091 | shelter margin 1.122 → 1.047 |
| the 4 000-leadership case of 2026-09-15 (Tot | SW | repeat | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SW | finale | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 1 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 2 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 3 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 4 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | HS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | HS | finale | better | 3.171 | perHired 310,958.857 → 308,008.714 |
| 2026-09-17 export, its setup (7 000 leadersh | SS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | SS | finale | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | SW | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | SW | finale | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | MX | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | MX | finale | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 1 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 2 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 3 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 4 | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | HS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | HS | finale | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | SS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | SS | finale | better | 1.973 | perHired 313,298.389 → 304,355.167 |
| 2026-09-17 export, 12 000 leadership | SW | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | SW | finale | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | MX | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | MX | finale | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | SS | repeat | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | SS | finale | better | 4.927 | shelter margin 1.873 → 1.513 |
| live account of 2026-09-18 (one hired type,  | SW | repeat | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | MX | repeat | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | MX | finale | better | 5.587 | silver 6,983,400.000 → 7,719,500.000; seconds 1,646,940.000 → 1,836,915.000; perSilver 0.954 → 0.932 |
| live account of 2026-09-18 (one hired type,  | AI | sequence 1 | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | AI | sequence 2 | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | AI | sequence 3 | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | AI | sequence 4 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | HS | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | HS | finale | better | 0.345 | worst 8,548,204.000 → 8,341,739.000; perSilver 1.990 → 1.965; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | SS | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | SS | finale | better | 4.264 | best 8,040,855.000 → 8,039,330.000 |
| live account, evening (hunters 83, legionari | SW | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | SW | finale | better | 0.370 | worst 8,190,643.000 → 7,984,178.000; perSilver 1.907 → 1.881; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | MX | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | MX | finale | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 1 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 2 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 3 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 4 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | HS | repeat | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | HS | finale | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | SW | repeat | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | SW | finale | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | MX | repeat | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | MX | finale | better | 0.031 | seconds 566,040.000 → 574,830.000 |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 1 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 2 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 3 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 4 | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | HS | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | HS | finale | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | SS | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | SS | finale | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | SW | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | worse | -16.424 | silver 1,943,800.000 → 2,051,000.000; gold 536.000 → 1,416.000; hired 7.000 → 12.000; seconds 469,080.000 → 660,570.000; perGold 5,197.263 → 2,613.032; perHired 231,575.714 → 221,570.000; shelter margin 1.004 → 1.003 |
| the owner’s live camp of 2026-09-18 (arbales | MM | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | MM | finale | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | MX | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | MX | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | HS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | HS | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SS | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SW | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SW | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | MM | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | MM | finale | worse | -11.707 | silver 1,943,300.000 → 2,247,000.000; gold 200.000 → 328.000; hired 3.000 → 5.000; seconds 468,900.000 → 748,590.000; perGold 11,062.025 → 8,029.640; perHired 302,010.000 → 297,695.600 |
| his camp of 2026-09-19, the localStorage dum | MX | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | MX | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | HS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | HS | finale | better | 7.716 | seconds 465,450.000 → 468,675.000 |
| his camp of 2026-09-19, as his message reads | SS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | SW | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | SW | finale | worse | -0.432 | silver 1,976,000.000 → 2,303,800.000; gold 192.000 → 344.000; hired 3.000 → 5.000; seconds 465,450.000 → 767,670.000; perGold 10,628.526 → 7,929.890; shelter margin 1.014 → 1.003 |
| his camp of 2026-09-19, as his message reads | MX | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | MX | finale | better | 12.185 | seconds 759,870.000 → 767,670.000 |
| his camp of 2026-09-19, as his message reads | AI | sequence 1 | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 2 | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 3 | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 4 | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SS | repeat | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SS | finale | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SW | repeat | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SW | finale | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | MX | repeat | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | MX | finale | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | repeat | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | finale | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | repeat | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | finale | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | repeat | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | finale | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | SW | repeat | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 1 | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 2 | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 3 | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 4 | unchanged | 0.000 | — |

## Against 176 (HEAD before W14)

**Stops** better / equal / worse: **17 / 46 / 0** (0 new, 0 gone). **Marches** better / equal-or-unchanged / worse: **15 / 127 / 3**. Σ rating gained over the marches (× times played): 91.064. TotalStack at matched spend (dominated / no stop fits): 70/13 of 112 → 70/13 of 112; 162's rows: 2 → 2. Bar criteria broken: none. Readings worse: none.

### The marches that gained (rating × times played)

| army | stop | march | rating |
|---|---|---|---:|
| the owner’s live camp of 2026-09-18 (arbales | SS | finale | 24.858 |
| his camp of 2026-09-19, the localStorage dum | SS | finale | 14.717 |
| his camp of 2026-09-19, as his message reads | MX | finale | 12.185 |
| his camp of 2026-09-19, as his message reads | HS | finale | 7.716 |
| 2026-09-17 export, 12 000 leadership | SS | finale | 7.091 |
| live account of 2026-09-18 (one hired type,  | SS | finale | 5.832 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 |
| live account, evening (hunters 83, legionari | SS | finale | 4.264 |
| 2026-09-17 export, its setup (7 000 leadersh | HS | finale | 3.171 |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | finale | 3.091 |
| the owner’s live camp of 2026-09-18 (arbales | SS | repeat | 0.940 |
| his TotalStack profile of 2026-09-19 (5 225  | SS | finale | 0.867 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 |
| Aydae alone, 4 975 (one captain, four hired  | MX | finale | 0.031 |

### Every worse figure, per march

| army | stop | march | march rating | figure |
|---|---|---|---:|---|
| the 4 000-leadership case of 2026-09-15 (Tot | SS | finale | 3.091 | shelter margin 1.122 → 1.047 |
| 2026-09-17 export, its setup (7 000 leadersh | HS | finale | 3.171 | perHired 310,958.857 → 308,008.714 |
| 2026-09-17 export, 12 000 leadership | SS | finale | 7.091 | perHired 313,298.389 → 304,355.167 |
| live account of 2026-09-18 (one hired type,  | SS | finale | 5.832 | shelter margin 1.873 → 1.513 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 | silver 6,983,400.000 → 7,719,500.000 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 | seconds 1,646,940.000 → 1,836,915.000 |
| live account of 2026-09-18 (one hired type,  | MX | finale | 5.587 | perSilver 0.954 → 0.932 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 | worst 8,548,204.000 → 8,341,739.000 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 | perSilver 1.990 → 1.965 |
| live account, evening (hunters 83, legionari | HS | finale | 0.345 | shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | SS | finale | 4.264 | best 8,040,855.000 → 8,039,330.000 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 | worst 8,190,643.000 → 7,984,178.000 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 | perSilver 1.907 → 1.881 |
| live account, evening (hunters 83, legionari | SW | finale | 0.370 | shelter margin 1.016 → 1.002 |
| Aydae alone, 4 975 (one captain, four hired  | MX | finale | 0.031 | seconds 566,040.000 → 574,830.000 |
| the owner’s live camp of 2026-09-18 (arbales | SS | repeat | 0.313 | best 2,640,097.000 → 2,579,026.000 |
| the owner’s live camp of 2026-09-18 (arbales | SS | finale | 24.858 | seconds 467,940.000 → 468,405.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | silver 1,943,800.000 → 2,051,000.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | gold 536.000 → 1,416.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | hired 7.000 → 12.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | seconds 469,080.000 → 660,570.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | perGold 5,197.263 → 2,613.032 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | perHired 231,575.714 → 221,570.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | -16.424 | shelter margin 1.004 → 1.003 |
| his camp of 2026-09-19, the localStorage dum | SS | finale | 14.717 | seconds 467,940.000 → 469,170.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | silver 1,943,300.000 → 2,247,000.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | gold 200.000 → 328.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | hired 3.000 → 5.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | seconds 468,900.000 → 748,590.000 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | perGold 11,062.025 → 8,029.640 |
| his camp of 2026-09-19, the localStorage dum | MM | finale | -11.707 | perHired 302,010.000 → 297,695.600 |
| his camp of 2026-09-19, as his message reads | HS | finale | 7.716 | seconds 465,450.000 → 468,675.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | silver 1,976,000.000 → 2,303,800.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | gold 192.000 → 344.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | hired 3.000 → 5.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | seconds 465,450.000 → 767,670.000 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | perGold 10,628.526 → 7,929.890 |
| his camp of 2026-09-19, as his message reads | SW | finale | -0.432 | shelter margin 1.014 → 1.003 |
| his camp of 2026-09-19, as his message reads | MX | finale | 12.185 | seconds 759,870.000 → 767,670.000 |

### Per stop (paired by pick) and per army

**Stops better / equal / worse**: 17 / 46 / 0. **TotalStack at matched spend** (dominated / no stop fits): 70/13 of 112 → 70/13 of 112. **162's rows**: 2 → 2.

| army | stop | verdict | rating | marches (role: rating, moved) | worse figures |
|---|---|---|---:|---|---|
| first-run army, Bear V ×1 (20 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); tail: 0.000 (unchanged) | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged); tail: 0.000 (unchanged) | — |
| first-run army, Bear V ×3 (20 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); tail: 0.000 (unchanged) | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| first-run army, Bear V ×10 (20 000 leadershi | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | SW | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | MM | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | better | 1.186 | repeat: 0.000 (unchanged); finale: 3.091 | shelter margin 1.122 → 1.047 |
| the 4 000-leadership case of 2026-09-15 (Tot | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | HS | better | 1.260 | repeat: 0.000 (unchanged); finale: 3.171 | perHired 355,600.192 → 354,011.654 |
| 2026-09-17 export, its setup (7 000 leadersh | SS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| 2026-09-17 export, 12 000 leadership | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, 12 000 leadership | SS | better | 2.663 | repeat: 0.000 (unchanged); finale: 7.091 | perHired 297,347.333 → 293,993.625 |
| 2026-09-17 export, 12 000 leadership | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| 2026-09-17 export, 12 000 leadership | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| live account of 2026-09-18 (one hired type,  | SS | better | 2.359 | repeat: 0.000 (unchanged); finale: 5.832 | — |
| live account of 2026-09-18 (one hired type,  | SW | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| live account of 2026-09-18 (one hired type,  | MX | better | 1.297 | repeat: 0.000 (unchanged); finale: 5.587 | silver 30,179,700.000 → 30,915,800.000; seconds 7,116,825.000 → 7,306,800.000; perSilver 0.952 → 0.946 |
| live account of 2026-09-18 (one hired type,  | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| live account, evening (hunters 83, legionari | HS | better | 0.602 | repeat: 0.000 (unchanged); finale: 0.345 | worst 20,575,534.000 → 20,369,069.000; perSilver 1.341 → 1.332; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | SS | better | 1.537 | repeat: 0.000 (unchanged); finale: 4.264 | best 21,720,231.000 → 21,718,706.000 |
| live account, evening (hunters 83, legionari | SW | better | 0.182 | repeat: 0.000 (unchanged); finale: 0.370 | worst 29,479,912.000 → 29,273,447.000; perSilver 1.727 → 1.720; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| live account, evening (hunters 83, legionari | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| Aydae alone, 4 975 (one captain, four hired  | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| Aydae alone, 4 975 (one captain, four hired  | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| Aydae alone, 4 975 (one captain, four hired  | MX | better | 0.007 | repeat: 0.000 (unchanged); finale: 0.031 | seconds 2,695,530.000 → 2,704,320.000 |
| Aydae alone, 4 975 (one captain, four hired  | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | SS | better | 6.833 | repeat: 0.313; finale: 24.858 | — |
| the owner’s live camp of 2026-09-18 (arbales | SW | better | 0.719 | repeat: 0.000 (unchanged); finale: -16.424 | silver 9,850,300.000 → 9,957,500.000; gold 6,344.000 → 7,224.000; hired 52.000 → 57.000; seconds 3,688,380.000 → 3,879,870.000; perGold 2,500.339 → 2,322.324; perHired 208,336.808 → 208,268.842; shelter margin 1.004 → 1.003 |
| the owner’s live camp of 2026-09-18 (arbales | MM | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| the owner’s live camp of 2026-09-18 (arbales | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | SS | better | 3.723 | repeat: 0.000 (unchanged); finale: 14.717 | seconds 2,257,230.000 → 2,258,460.000 |
| his camp of 2026-09-19, the localStorage dum | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, the localStorage dum | MM | better | 0.883 | repeat: 0.000 (unchanged); finale: -11.707 | silver 10,354,100.000 → 10,657,800.000; gold 3,944.000 → 4,072.000; hired 57.000 → 59.000; seconds 4,397,940.000 → 4,677,630.000; perGold 3,585.788 → 3,576.539 |
| his camp of 2026-09-19, the localStorage dum | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his camp of 2026-09-19, as his message reads | HS | better | 2.391 | repeat: 0.000 (unchanged); finale: 7.716 | seconds 2,052,555.000 → 2,055,780.000 |
| his camp of 2026-09-19, as his message reads | SS | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| his camp of 2026-09-19, as his message reads | SW | better | 0.950 | repeat: 0.000 (unchanged); finale: -0.432 | silver 8,940,500.000 → 9,268,300.000; gold 1,272.000 → 1,424.000; hired 18.000 → 20.000; seconds 2,773,500.000 → 3,075,720.000; perGold 8,225.237 → 7,829.850 |
| his camp of 2026-09-19, as his message reads | MX | better | 2.683 | repeat: 0.000 (unchanged); finale: 12.185 | seconds 4,008,330.000 → 4,016,130.000 |
| his camp of 2026-09-19, as his message reads | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |
| his TotalStack profile of 2026-09-19 (5 225  | SS | better | 0.338 | repeat: 0.000 (unchanged); finale: 0.867 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his TotalStack profile of 2026-09-19 (5 225  | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | equal | 0.000 | repeat: 0.000 (unchanged); finale: 0.000 (unchanged) | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | SW | equal | 0.000 | repeat: 0.000 (unchanged) | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | equal | 0.000 | sequence 1: 0.000 (unchanged); sequence 2: 0.000 (unchanged); sequence 3: 0.000 (unchanged); sequence 4: 0.000 (unchanged) | — |

| army | better / equal / worse | readings worse | criteria broken | TotalStack |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 0 / 1 / 0 | — | — | 3/0 → 3/0 |
| first-run army, Bear V ×2 (20 000 leadership | 0 / 1 / 0 | — | — | 3/0 → 3/0 |
| first-run army, Bear V ×3 (20 000 leadership | 0 / 2 / 0 | — | — | 8/0 → 8/0 |
| first-run army, Bear V ×10 (20 000 leadershi | 0 / 2 / 0 | — | — | 4/0 → 4/0 |
| first-run army, Epic Monster Hunter VI ×83 ( | 0 / 4 / 0 | — | — | 7/0 → 7/0 |
| first-run army, monster tiers 3–5 at 900 dom | 0 / 5 / 0 | — | — | 0/3 → 0/3 |
| the 4 000-leadership case of 2026-09-15 (Tot | 1 / 2 / 0 | — | — | 10/0 → 10/0 |
| 2026-09-17 export, its setup (7 000 leadersh | 1 / 4 / 0 | — | — | 6/3 → 6/3 |
| 2026-09-17 export, 12 000 leadership | 1 / 3 / 0 | — | — | 3/2 → 3/2 |
| live account of 2026-09-18 (one hired type,  | 2 / 2 / 0 | — | — | 9/0 → 9/0 |
| live account, evening (hunters 83, legionari | 3 / 2 / 0 | — | — | 6/0 → 6/0 |
| Aydae alone, 4 975 (one captain, four hired  | 1 / 3 / 0 | — | — | 0/0 → 0/0 |
| the owner’s live camp of 2026-09-18 (arbales | 2 / 3 / 0 | — | — | 0/0 → 0/0 |
| his camp of 2026-09-19, the localStorage dum | 2 / 3 / 0 | — | — | 2/1 → 2/1 |
| his camp of 2026-09-19, as his message reads | 3 / 2 / 0 | — | — | 2/1 → 2/1 |
| his TotalStack profile of 2026-09-19 (5 225  | 1 / 2 / 0 | — | — | 2/1 → 2/1 |
| his usual setup of 2026-09-19 (Aydae alone,  | 0 / 3 / 0 | — | — | 5/2 → 5/2 |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | 0 / 2 / 0 | — | — | 0/0 → 0/0 |

### Every march use case

| army | stop | march | verdict | rating | worse figures |
|---|---|---|---|---:|---|
| first-run army, Bear V ×1 (20 000 leadership | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×1 (20 000 leadership | SW | tail | unchanged | 0.000 | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | finale | unchanged | 0.000 | — |
| first-run army, Bear V ×2 (20 000 leadership | SW | tail | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | SW | tail | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, Bear V ×3 (20 000 leadership | AI | sequence 4 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | SW | repeat | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | SW | finale | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, Bear V ×10 (20 000 leadershi | AI | sequence 4 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | repeat | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | HS | finale | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | SW | repeat | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | MX | repeat | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | MX | finale | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, Epic Monster Hunter VI ×83 ( | AI | sequence 4 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | HS | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | HS | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | SW | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | SW | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MM | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MM | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MX | repeat | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | MX | finale | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 1 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 2 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 3 | unchanged | 0.000 | — |
| first-run army, monster tiers 3–5 at 900 dom | AI | sequence 4 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | repeat | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SS | finale | better | 3.091 | shelter margin 1.122 → 1.047 |
| the 4 000-leadership case of 2026-09-15 (Tot | SW | repeat | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | SW | finale | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 1 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 2 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 3 | unchanged | 0.000 | — |
| the 4 000-leadership case of 2026-09-15 (Tot | AI | sequence 4 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | HS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | HS | finale | better | 3.171 | perHired 310,958.857 → 308,008.714 |
| 2026-09-17 export, its setup (7 000 leadersh | SS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | SS | finale | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | SW | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | SW | finale | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | MX | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | MX | finale | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 1 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 2 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 3 | unchanged | 0.000 | — |
| 2026-09-17 export, its setup (7 000 leadersh | AI | sequence 4 | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | HS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | HS | finale | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | SS | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | SS | finale | better | 7.091 | perHired 313,298.389 → 304,355.167 |
| 2026-09-17 export, 12 000 leadership | SW | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | SW | finale | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | MX | repeat | unchanged | 0.000 | — |
| 2026-09-17 export, 12 000 leadership | MX | finale | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | SS | repeat | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | SS | finale | better | 5.832 | shelter margin 1.873 → 1.513 |
| live account of 2026-09-18 (one hired type,  | SW | repeat | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | MX | repeat | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | MX | finale | better | 5.587 | silver 6,983,400.000 → 7,719,500.000; seconds 1,646,940.000 → 1,836,915.000; perSilver 0.954 → 0.932 |
| live account of 2026-09-18 (one hired type,  | AI | sequence 1 | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | AI | sequence 2 | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | AI | sequence 3 | unchanged | 0.000 | — |
| live account of 2026-09-18 (one hired type,  | AI | sequence 4 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | HS | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | HS | finale | better | 0.345 | worst 8,548,204.000 → 8,341,739.000; perSilver 1.990 → 1.965; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | SS | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | SS | finale | better | 4.264 | best 8,040,855.000 → 8,039,330.000 |
| live account, evening (hunters 83, legionari | SW | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | SW | finale | better | 0.370 | worst 8,190,643.000 → 7,984,178.000; perSilver 1.907 → 1.881; shelter margin 1.016 → 1.002 |
| live account, evening (hunters 83, legionari | MX | repeat | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | MX | finale | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 1 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 2 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 3 | unchanged | 0.000 | — |
| live account, evening (hunters 83, legionari | AI | sequence 4 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | HS | repeat | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | HS | finale | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | SW | repeat | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | SW | finale | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | MX | repeat | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | MX | finale | better | 0.031 | seconds 566,040.000 → 574,830.000 |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 1 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 2 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 3 | unchanged | 0.000 | — |
| Aydae alone, 4 975 (one captain, four hired  | AI | sequence 4 | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | HS | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | HS | finale | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | SS | repeat | better | 0.313 | best 2,640,097.000 → 2,579,026.000 |
| the owner’s live camp of 2026-09-18 (arbales | SS | finale | better | 24.858 | seconds 467,940.000 → 468,405.000 |
| the owner’s live camp of 2026-09-18 (arbales | SW | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | SW | finale | worse | -16.424 | silver 1,943,800.000 → 2,051,000.000; gold 536.000 → 1,416.000; hired 7.000 → 12.000; seconds 469,080.000 → 660,570.000; perGold 5,197.263 → 2,613.032; perHired 231,575.714 → 221,570.000; shelter margin 1.004 → 1.003 |
| the owner’s live camp of 2026-09-18 (arbales | MM | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | MM | finale | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | MX | repeat | unchanged | 0.000 | — |
| the owner’s live camp of 2026-09-18 (arbales | MX | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | HS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | HS | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SS | finale | better | 14.717 | seconds 467,940.000 → 469,170.000 |
| his camp of 2026-09-19, the localStorage dum | SW | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | SW | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | MM | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | MM | finale | worse | -11.707 | silver 1,943,300.000 → 2,247,000.000; gold 200.000 → 328.000; hired 3.000 → 5.000; seconds 468,900.000 → 748,590.000; perGold 11,062.025 → 8,029.640; perHired 302,010.000 → 297,695.600 |
| his camp of 2026-09-19, the localStorage dum | MX | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, the localStorage dum | MX | finale | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | HS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | HS | finale | better | 7.716 | seconds 465,450.000 → 468,675.000 |
| his camp of 2026-09-19, as his message reads | SS | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | SW | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | SW | finale | worse | -0.432 | silver 1,976,000.000 → 2,303,800.000; gold 192.000 → 344.000; hired 3.000 → 5.000; seconds 465,450.000 → 767,670.000; perGold 10,628.526 → 7,929.890; shelter margin 1.014 → 1.003 |
| his camp of 2026-09-19, as his message reads | MX | repeat | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | MX | finale | better | 12.185 | seconds 759,870.000 → 767,670.000 |
| his camp of 2026-09-19, as his message reads | AI | sequence 1 | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 2 | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 3 | unchanged | 0.000 | — |
| his camp of 2026-09-19, as his message reads | AI | sequence 4 | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SS | repeat | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SS | finale | better | 0.867 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SW | repeat | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | SW | finale | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | MX | repeat | unchanged | 0.000 | — |
| his TotalStack profile of 2026-09-19 (5 225  | MX | finale | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | repeat | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | HS | finale | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | repeat | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | SW | finale | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | repeat | unchanged | 0.000 | — |
| his usual setup of 2026-09-19 (Aydae alone,  | MX | finale | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | SW | repeat | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 1 | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 2 | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 3 | unchanged | 0.000 | — |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | AI | sequence 4 | unchanged | 0.000 | — |

## The ten readings (177 → after)

| army | most damage | least silver | fewest hired lost | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 9,085,800 | 0.5682 | 112,200.0000 | 0.0000 | 0.0000 |
| first-run army, Bear V ×2 (20 000 leadership | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 9,085,800 | 0.5751 | 168,300.0000 | 116,899.3750 | 0.0000 |
| first-run army, Bear V ×3 (20 000 leadership | 19,040,500 | 32,525,600 | 3 | 0 | 0 | 9,085,800 | 0.5854 | 224,400.0000 | 39,667.7083 | 0.0000 |
| first-run army, Bear V ×10 (20 000 leadershi | 21,290,233 | 32,525,600 | 4 | 3,200 | 0 | 9,085,800 | 0.6475 | 776,050.0000 | 6,581.2813 | 0.0000 |
| first-run army, Epic Monster Hunter VI ×83 ( | 30,140,049 | 32,525,600 | 11 | 736 | 0 | 9,085,800 | 0.9218 | 431,781.0000 | 30,998.1576 | 0.0000 |
| first-run army, monster tiers 3–5 at 900 dom | 103,197,710 | 34,920,400 | 15 | 9,424 | 24,120 | 10,306,560 | 2.7660 | 597,802.3846 | 9,495.6154 | 3,816.4834 |
| the 4 000-leadership case of 2026-09-15 (Tot | 8,985,057 | 3,820,600 → 3,803,700 | 19 | 736 | 0 | 856,095 → 847,680 | 1.4765 | 265,254.5714 | 7,253.8282 | 0.0000 |
| 2026-09-17 export, its setup (7 000 leadersh | 24,945,884 | 8,670,400 | 26 | 2,112 → 2,064 | 0 | 2,076,345 | 2.2174 | 357,359.6000 | 7,251.5923 → 7,474.4898 | 0.0000 |
| 2026-09-17 export, 12 000 leadership | 34,617,571 | 12,129,500 → 12,071,500 | 30 | 2,408 | 0 | 2,929,905 → 2,906,625 | 1.8329 | 369,196.7333 | 9,304.0706 | 0.0000 |
| live account of 2026-09-18 (one hired type,  | 29,743,332 | 18,600,300 → 18,526,700 | 20 | 1,368 | 0 | 4,716,030 → 4,384,500 | 0.9816 → 1.0023 | 323,582.0000 | 16,426.0926 | 0.0000 |
| live account, evening (hunters 83, legionari | 34,784,291 | 12,306,900 → 12,300,400 | 32 → 30 | 2,296 → 2,264 | 0 | 2,900,895 → 2,900,010 | 1.9877 | 332,926.7500 → 349,739.0667 | 8,961.4695 → 8,996.9386 | 0.0000 |
| Aydae alone, 4 975 (one captain, four hired  | 18,750,522 | 5,777,000 | 19 | 1,288 | 0 | 1,163,445 | 2.1017 → 2.1022 | 325,748.6316 | 7,337.1258 | 0.0000 |
| the owner’s live camp of 2026-09-18 (arbales | 49,190,513 | 6,704,900 | 16 | 1,448 | 0 | 1,714,635 | 3.5320 | 257,642.5000 | 6,091.5967 | 0.0000 |
| his camp of 2026-09-19, the localStorage dum | 23,589,127 | 7,313,200 | 6 | 392 | 0 | 1,836,990 | 1.8085 | 318,189.0000 | 17,712.6990 | 0.0000 |
| his camp of 2026-09-19, as his message reads | 11,589,922 | 7,201,600 | 6 | 408 | 0 | 1,704,120 | 1.1702 → 1.2030 | 323,582.0000 | 16,129.7696 → 16,513.2721 | 0.0000 |
| his TotalStack profile of 2026-09-19 (5 225  | 8,443,234 | 4,431,600 | 7 | 480 | 3,840 | 1,003,305 | 1.1138 | 131,856.0000 | 10,282.7667 | 2,198.7589 |
| his usual setup of 2026-09-19 (Aydae alone,  | 11,756,170 | 6,132,900 | 5 | 352 | 3,960 | 1,348,665 | 1.4193 | 422,679.1250 | 23,327.1335 | 2,721.3356 |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | 17,086,508 | 9,479,200 | 4 | 18,384 | 10,080 | 2,560,440 | 1.8025 | 489,636.0000 | 928.7660 | 1,695.0901 |

## The bar criteria (after)

| army | order | no stop beaten | shelter | sustain | ≤ 5 | sweet spot | S-58 B |
|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | holds | holds | holds | holds | holds | holds | holds |
| first-run army, Bear V ×2 (20 000 leadership | holds | holds | holds | holds | holds | holds | holds |
| first-run army, Bear V ×3 (20 000 leadership | holds | holds | holds | holds | holds | holds | holds |
| first-run army, Bear V ×10 (20 000 leadershi | holds | holds | holds | holds | holds | holds | holds |
| first-run army, Epic Monster Hunter VI ×83 ( | holds | holds | holds | holds | holds | holds | holds |
| first-run army, monster tiers 3–5 at 900 dom | holds | holds | holds | holds | holds | holds | holds |
| the 4 000-leadership case of 2026-09-15 (Tot | holds | holds | holds | holds | holds | holds | holds |
| 2026-09-17 export, its setup (7 000 leadersh | holds | holds | holds | holds | holds | holds | holds |
| 2026-09-17 export, 12 000 leadership | holds | holds | holds | holds | holds | holds | holds |
| live account of 2026-09-18 (one hired type,  | holds | holds | holds | holds | holds | holds | holds |
| live account, evening (hunters 83, legionari | holds | holds | holds | holds | holds | holds | holds |
| Aydae alone, 4 975 (one captain, four hired  | holds | holds | holds | holds | holds | holds | holds |
| the owner’s live camp of 2026-09-18 (arbales | holds | holds | holds | holds | holds | holds | holds |
| his camp of 2026-09-19, the localStorage dum | holds | holds | holds | holds | holds | holds | holds |
| his camp of 2026-09-19, as his message reads | holds | holds | holds | holds | holds | holds | holds |
| his TotalStack profile of 2026-09-19 (5 225  | holds | holds | holds | holds | holds | holds | holds |
| his usual setup of 2026-09-19 (Aydae alone,  | holds | holds | holds | holds | holds | holds | holds |
| his browser setup of 2026-09-24 (Aydae 50 ★3 | holds | holds | holds | holds | holds | holds | holds |

## Plan time (best of 3), variant i against none (HEAD’s logic, same process)

kernel Σ 2,546 ms against 2,422; TS Σ 19,981 ms against 18,651.

| army | kernel ms (none) | TS ms (none) | same plan |
|---|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) | 4 (8) | 26 (32) | same |
| first-run army, Bear V ×2 (20 000 leadership) | 9 (8) | 53 (50) | same |
| first-run army, Bear V ×3 (20 000 leadership) | 7 (10) | 51 (53) | same |
| first-run army, Bear V ×10 (20 000 leadership) | 14 (13) | 83 (73) | same |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadershi | 27 (24) | 173 (149) | same |
| first-run army, monster tiers 3–5 at 900 dominance (hunters  | 847 (862) | 7,327 (6,726) | same |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; | 71 (60) | 547 (488) | same |
| 2026-09-17 export, its setup (7 000 leadership) | 157 (150) | 1,066 (1,050) | same |
| 2026-09-17 export, 12 000 leadership | 160 (144) | 1,132 (1,119) | same |
| live account of 2026-09-18 (one hired type, 20 000 leadershi | 25 (11) | 117 (57) | same |
| live account, evening (hunters 83, legionaries unlimited, ch | 133 (102) | 836 (691) | same |
| Aydae alone, 4 975 (one captain, four hired types — experime | 108 (93) | 785 (705) | same |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legion | 88 (75) | 469 (407) | same |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180 | 32 (23) | 131 (91) | same |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 2 | 34 (20) | 105 (59) | same |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 do | 250 (254) | 2,254 (2,198) | same |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 /  | 311 (301) | 2,728 (2,652) | same |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180  | 269 (264) | 2,098 (2,053) | same |

## After: every army, every stop, every march, every criterion


### first-run army, Bear V ×1 (20 000 leadership)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SW** | campaign | 4 | 6.807 | 1 | 18,479,500 | 19,211,020 | 32,525,600 | 0 | 1 | 0 | 2,523.8 h | 0.568 | ∞ | 112,200 | ∞ |  |
| SW | repeat | 1 | 6.807 | 1 | 4,704,025 | 4,886,905 | 8,131,400 | 0 | 1 | 0 | 631.0 h | 0.579 | ∞ | 112,200 | ∞ | bear-5 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| SW | tail | 3 | ∞ | 1 | 4,591,825 | 4,774,705 | 8,131,400 | 0 | 0 | 0 | 631.0 h | 0.565 | ∞ | ∞ | ∞ | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |

**Ten readings**: most damage 18,479,500 · least silver 32,525,600 · fewest hired lost 1.000 · least gold 0.000 · fewest coins 0.000 · shortest queue 2,523.8 h · dmg a silver 0.568 · dmg a merc 112,200 · dmg a gold 0.000 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 3 dominated / 0 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 0.

### first-run army, Bear V ×2 (20 000 leadership)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SW** | campaign | 4 | 3.404 | 1 | 18,703,900 | 19,435,420 | 32,525,600 | 160 | 2 | 0 | 2,523.8 h | 0.575 | 116,899.4 | 168,300 | ∞ |  |
| SW | repeat | 1 | 3.404 | 1 | 4,816,225 | 4,999,105 | 8,131,400 | 160 | 1 | 0 | 631.0 h | 0.592 | 30,101.4 | 224,400 | ∞ | bear-5 2, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| SW | finale | 1 | 6.807 | 1 | 4,704,025 | 4,886,905 | 8,131,400 | 0 | 1 | 0 | 631.0 h | 0.579 | ∞ | 112,200 | ∞ | bear-5 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| SW | tail | 2 | ∞ | 1 | 4,591,825 | 4,774,705 | 8,131,400 | 0 | 0 | 0 | 631.0 h | 0.565 | ∞ | ∞ | ∞ | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |

**Ten readings**: most damage 18,703,900 · least silver 32,525,600 · fewest hired lost 2.000 · least gold 160 · fewest coins 0.000 · shortest queue 2,523.8 h · dmg a silver 0.575 · dmg a merc 168,300 · dmg a gold 116,899 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 3 dominated / 0 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 0.

### first-run army, Bear V ×3 (20 000 leadership)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SW** | campaign | 4 | 6.807 | 3 | 18,703,900 | 19,435,420 | 32,525,600 | 0 | 3 | 0 | 2,523.8 h | 0.575 | ∞ | 112,200 | ∞ |  |
| SW | repeat | 3 | 6.807 | 3 | 4,704,025 | 4,886,905 | 8,131,400 | 0 | 1 | 0 | 631.0 h | 0.579 | ∞ | 112,200 | ∞ | bear-5 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| SW | tail | 1 | ∞ | 3 | 4,591,825 | 4,774,705 | 8,131,400 | 0 | 0 | 0 | 631.0 h | 0.565 | ∞ | ∞ | ∞ | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **AI** | campaign | 4 | 2.269 | 4 | 19,040,500 | 19,772,020 | 32,525,600 | 480 | 3 | 0 | 2,523.8 h | 0.585 | 39,667.7 | 224,400 | ∞ |  |
| AI | sequence 1 | 1 | 2.269 | 4 | 4,928,425 | 5,111,305 | 8,131,400 | 320 | 1 | 0 | 631.0 h | 0.606 | 15,401.3 | 336,600 | ∞ | bear-5 3, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| AI | sequence 2 | 1 | 3.404 | 4 | 4,816,225 | 4,999,105 | 8,131,400 | 160 | 1 | 0 | 631.0 h | 0.592 | 30,101.4 | 224,400 | ∞ | bear-5 2, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| AI | sequence 3 | 1 | 6.807 | 4 | 4,704,025 | 4,886,905 | 8,131,400 | 0 | 1 | 0 | 631.0 h | 0.579 | ∞ | 112,200 | ∞ | bear-5 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| AI | sequence 4 | 1 | ∞ | 4 | 4,591,825 | 4,774,705 | 8,131,400 | 0 | 0 | 0 | 631.0 h | 0.565 | ∞ | ∞ | ∞ | swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |

**Ten readings**: most damage 19,040,500 · least silver 32,525,600 · fewest hired lost 3.000 · least gold 0.000 · fewest coins 0.000 · shortest queue 2,523.8 h · dmg a silver 0.585 · dmg a merc 224,400 · dmg a gold 39,668 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 8 dominated / 0 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0.

### first-run army, Bear V ×10 (20 000 leadership)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SW** | campaign | 4 | 1.135 | 5 | 21,060,100 | 21,791,620 | 32,525,600 | 3,200 | 4 | 0 | 2,523.8 h | 0.647 | 6,581.3 | 673,200 | ∞ |  |
| SW | repeat | 3 | 1.135 | 5 | 5,265,025 | 5,447,905 | 8,131,400 | 800 | 1 | 0 | 631.0 h | 0.647 | 6,581.3 | 673,200 | ∞ | bear-5 6, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| SW | finale | 1 | 1.135 | 5 | 5,265,025 | 5,447,905 | 8,131,400 | 800 | 1 | 0 | 631.0 h | 0.647 | 6,581.3 | 673,200 | ∞ | bear-5 6, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **AI** | campaign | 4 | 1.004 | 4 | 21,290,233 | 22,579,447 | 36,008,300 | 4,800 | 4 | 0 | 3,423.0 h | 0.591 | 4,435.5 | 776,050 | ∞ |  |
| AI | sequence 1 | 1 | 1.252 | 4 | 5,581,060 | 6,024,241 | 9,919,400 | 1,440 | 1 | 0 | 1,091.1 h | 0.563 | 3,875.7 | 748,000 | ∞ | bear-5 10, spearman-2 3,097, spearman-3 1,739, archer-2 3,084, rider-2 1,539, archer-1 5,530, rider-3 863, archer-3 1,722 |
| AI | sequence 2 | 1 | 1.088 | 4 | 5,245,997 | 5,593,158 | 9,062,500 | 1,280 | 1 | 0 | 871.8 h | 0.579 | 4,098.4 | 673,200 | ∞ | bear-5 9, spearman-2 2,426, spearman-3 1,362, rider-2 1,208, archer-1 4,340, rider-1 2,166, rider-3 676, archer-3 1,348, archer-2 2,393 |
| AI | sequence 3 | 1 | 1.004 | 4 | 5,287,688 | 5,537,124 | 8,513,200 | 1,120 | 1 | 0 | 730.0 h | 0.621 | 4,721.2 | 897,600 | ∞ | bear-5 8, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |
| AI | sequence 4 | 1 | 1.148 | 4 | 5,175,488 | 5,424,924 | 8,513,200 | 960 | 1 | 0 | 730.0 h | 0.608 | 5,391.1 | 785,400 | ∞ | bear-5 7, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |

**Ten readings**: most damage 21,290,233 · least silver 32,525,600 · fewest hired lost 4.000 · least gold 3,200 · fewest coins 0.000 · shortest queue 2,523.8 h · dmg a silver 0.647 · dmg a merc 776,050 · dmg a gold 6,581 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 4 dominated / 0 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: fold HS/SW/AI → SW/AI.

### first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.011 | 74 | 22,814,644 | 23,546,164 | 32,525,600 | 736 | 11 | 0 | 2,523.8 h | 0.701 | 30,998.2 | 404,304 | ∞ |  |
| HS | repeat | 3 | 7.377 | 74 | 5,023,606 | 5,206,486 | 8,131,400 | 72 | 1 | 0 | 631.0 h | 0.618 | 69,772.3 | 431,781 | ∞ | epic-monster-hunter-6 10, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| HS | finale | 1 | 1.011 | 74 | 7,743,826 | 7,926,706 | 8,131,400 | 520 | 8 | 0 | 631.0 h | 0.952 | 14,892.0 | 394,000 | ∞ | epic-monster-hunter-6 73, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **SW** | campaign | 4 | 1.230 | 4 | 28,730,044 | 29,461,564 | 32,525,600 | 1,728 | 24 | 0 | 2,523.8 h | 0.883 | 16,626.2 | 431,781 | ∞ |  |
| SW | repeat | 4 | 1.230 | 4 | 7,182,511 | 7,365,391 | 8,131,400 | 432 | 6 | 0 | 631.0 h | 0.883 | 16,626.2 | 431,781 | ∞ | epic-monster-hunter-6 60, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **MX** | campaign | 4 | 1.069 | 3 | 29,982,205 | 30,713,725 | 32,525,600 | 1,928 | 28 | 0 | 2,523.8 h | 0.922 | 15,550.9 | 414,818 | ∞ |  |
| MX | repeat | 3 | 1.069 | 3 | 7,571,113 | 7,753,993 | 8,131,400 | 496 | 7 | 0 | 631.0 h | 0.931 | 15,264.3 | 425,613 | ∞ | epic-monster-hunter-6 69, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| MX | finale | 1 | 1.190 | 3 | 7,268,866 | 7,451,746 | 8,131,400 | 440 | 7 | 0 | 631.0 h | 0.894 | 16,520.2 | 382,434 | ∞ | epic-monster-hunter-6 62, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **AI** | campaign | 4 | 1.049 | 4 | 30,140,049 | 31,004,681 | 33,289,200 | 2,016 | 30 | 0 | 2,722.0 h | 0.905 | 14,950.4 | 405,874 | ∞ |  |
| AI | sequence 1 | 1 | 1.049 | 4 | 7,973,870 | 8,223,306 | 8,513,200 | 592 | 9 | 0 | 730.0 h | 0.937 | 13,469.4 | 398,198 | ∞ | epic-monster-hunter-6 83, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |
| AI | sequence 2 | 1 | 1.177 | 4 | 7,585,268 | 7,834,704 | 8,513,200 | 528 | 8 | 0 | 730.0 h | 0.891 | 14,366.0 | 399,398 | ∞ | epic-monster-hunter-6 74, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, spearman-2 1,982, rider-1 1,782, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |
| AI | sequence 3 | 1 | 1.118 | 4 | 7,441,579 | 7,624,459 | 8,131,400 | 472 | 7 | 0 | 631.0 h | 0.915 | 15,766.1 | 407,108 | ∞ | epic-monster-hunter-6 66, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| AI | sequence 4 | 1 | 1.250 | 4 | 7,139,332 | 7,322,212 | 8,131,400 | 424 | 6 | 0 | 631.0 h | 0.878 | 16,838.0 | 424,585 | ∞ | epic-monster-hunter-6 59, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-2 1,684, spearman-1 3,024, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |

**Ten readings**: most damage 30,140,049 · least silver 32,525,600 · fewest hired lost 11.000 · least gold 736 · fewest coins 0.000 · shortest queue 2,523.8 h · dmg a silver 0.922 · dmg a merc 431,781 · dmg a gold 30,998 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 7 dominated / 0 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0.

### first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.011 | 3 | 81,548,470 | 82,279,990 | 34,920,400 | 11,072 | 15 | 24,120 | 2,862.9 h | 2.335 | 7,365.3 | 541,060 | 3,380.9 |  |
| HS | repeat | 3 | 1.040 | 3 | 20,298,165 | 20,481,045 | 8,686,000 | 3,304 | 2 | 5,400 | 708.4 h | 2.337 | 6,143.5 | 733,818 | 3,758.9 | ettin 3, fearsome-manticore 3, ice-phoenix 8, magic-dragon 9, flaming-centaur 3, many-armed-guardian 10, desert-vanquisher 3, gorgon-medusa 10, bear-5 4, epic-monster-hunter-6 10, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| HS | finale | 1 | 1.011 | 3 | 20,653,975 | 20,836,855 | 8,862,400 | 1,160 | 9 | 7,920 | 737.8 h | 2.331 | 17,805.2 | 412,556 | 2,607.8 | epic-monster-hunter-6 73, water-elemental 46, battle-boar 22, emerald-dragon 19, gorgon-medusa 7, desert-vanquisher 2, stone-gargoyle 16, many-armed-guardian 6, magic-dragon 5, ice-phoenix 4, bear-5 3, ettin 1, fearsome-manticore 1, flaming-centaur 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **SW** | campaign | 4 | 1.039 | 5 | 89,486,680 | 90,218,200 | 35,230,000 | 9,424 | 24 | 28,200 | 2,912.5 h | 2.540 | 9,495.6 | 476,719 | 3,173.3 |  |
| SW | repeat | 3 | 1.085 | 5 | 22,973,020 | 23,155,900 | 8,789,200 | 2,760 | 5 | 6,760 | 724.9 h | 2.614 | 8,323.6 | 520,974 | 3,398.4 | fearsome-manticore 3, ice-phoenix 8, stone-gargoyle 26, magic-dragon 9, gorgon-medusa 11, flaming-centaur 3, many-armed-guardian 10, desert-vanquisher 3, ettin 2, epic-monster-hunter-6 31, bear-5 2, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| SW | finale | 1 | 1.039 | 5 | 20,567,620 | 20,750,500 | 8,862,400 | 1,144 | 9 | 7,920 | 737.8 h | 2.321 | 17,978.7 | 402,961 | 2,596.9 | epic-monster-hunter-6 71, water-elemental 46, battle-boar 22, emerald-dragon 19, gorgon-medusa 7, desert-vanquisher 2, stone-gargoyle 16, many-armed-guardian 6, magic-dragon 5, ice-phoenix 4, bear-5 3, ettin 1, fearsome-manticore 1, flaming-centaur 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **MM** | campaign | 4 | 1.085 | 4 | 93,588,286 | 94,319,806 | 35,230,000 | 10,272 | 26 | 28,200 | 2,912.5 h | 2.656 | 9,111.0 | 597,802 | 3,318.7 |  |
| MM | repeat | 3 | 1.085 | 4 | 24,383,400 | 24,566,280 | 8,789,200 | 3,048 | 6 | 6,760 | 724.9 h | 2.774 | 7,999.8 | 669,208 | 3,607.0 | fearsome-manticore 3, ice-phoenix 8, stone-gargoyle 26, magic-dragon 9, gorgon-medusa 11, flaming-centaur 3, many-armed-guardian 10, desert-vanquisher 3, epic-monster-hunter-6 48, ettin 2, bear-5 3, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| MM | finale | 1 | 1.085 | 4 | 20,438,086 | 20,620,966 | 8,862,400 | 1,128 | 8 | 7,920 | 737.8 h | 2.306 | 18,118.9 | 437,139 | 2,580.6 | epic-monster-hunter-6 68, water-elemental 46, battle-boar 22, emerald-dragon 19, gorgon-medusa 7, desert-vanquisher 2, stone-gargoyle 16, many-armed-guardian 6, magic-dragon 5, ice-phoenix 4, bear-5 3, ettin 1, fearsome-manticore 1, flaming-centaur 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **MX** | campaign | 4 | 1.004 | 3 | 97,759,924 | 98,691,112 | 36,432,700 | 14,232 | 32 | 28,200 | 3,214.6 h | 2.683 | 6,869.0 | 543,725 | 3,466.7 |  |
| MX | repeat | 3 | 1.004 | 3 | 25,860,303 | 26,109,739 | 9,190,100 | 4,384 | 8 | 6,760 | 825.6 h | 2.814 | 5,898.8 | 590,048 | 3,825.5 | flaming-centaur 4, ice-phoenix 10, many-armed-guardian 13, gorgon-medusa 14, desert-vanquisher 4, magic-dragon 11, ettin 3, epic-monster-hunter-6 69, fearsome-manticore 3, bear-5 4, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |
| MX | finale | 1 | 1.190 | 3 | 20,179,015 | 20,361,895 | 8,862,400 | 1,080 | 8 | 7,920 | 737.8 h | 2.277 | 18,684.3 | 404,755 | 2,547.9 | epic-monster-hunter-6 62, water-elemental 46, battle-boar 22, emerald-dragon 19, gorgon-medusa 7, desert-vanquisher 2, stone-gargoyle 16, many-armed-guardian 6, magic-dragon 5, ice-phoenix 4, bear-5 3, ettin 1, fearsome-manticore 1, flaming-centaur 1, swordsman-1 3,048, archer-1 3,042, rider-1 1,518, spearman-1 3,030, spearman-2 1,680, rider-3 472, spearman-3 942, archer-2 1,670, rider-2 834, archer-3 936 |
| **AI** | campaign | 4 | 1.004 | 4 | 103,197,710 | 104,259,083 | 37,309,700 | 17,888 | 34 | 27,040 | 3,444.4 h | 2.766 | 5,769.1 | 594,278 | 3,816.5 |  |
| AI | sequence 1 | 1 | 1.004 | 4 | 26,479,061 | 26,694,401 | 9,190,100 | 4,800 | 10 | 6,760 | 825.6 h | 2.881 | 5,516.5 | 470,578 | 3,917.0 | flaming-centaur 4, ice-phoenix 10, many-armed-guardian 13, epic-monster-hunter-6 83, gorgon-medusa 14, desert-vanquisher 4, magic-dragon 11, ettin 3, fearsome-manticore 3, bear-5 6, swordsman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |
| AI | sequence 2 | 1 | 1.197 | 4 | 25,108,656 | 25,455,817 | 9,739,400 | 4,576 | 9 | 6,760 | 967.5 h | 2.578 | 5,487.0 | 577,249 | 3,714.3 | gorgon-medusa 15, magic-dragon 12, flaming-centaur 4, ice-phoenix 10, many-armed-guardian 13, desert-vanquisher 4, epic-monster-hunter-6 74, ettin 3, fearsome-manticore 3, bear-5 5, spearman-2 2,426, spearman-3 1,362, rider-2 1,208, rider-1 2,170, archer-1 4,331, rider-3 676, archer-3 1,348, archer-2 2,393 |
| AI | sequence 3 | 1 | 1.004 | 4 | 26,150,369 | 26,399,805 | 9,190,100 | 4,360 | 8 | 6,760 | 825.6 h | 2.845 | 5,997.8 | 687,199 | 3,868.4 | flaming-centaur 4, ice-phoenix 10, many-armed-guardian 13, gorgon-medusa 14, desert-vanquisher 4, magic-dragon 11, ettin 3, fearsome-manticore 3, epic-monster-hunter-6 66, bear-5 4, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |
| AI | sequence 4 | 1 | 1.004 | 4 | 25,459,624 | 25,709,060 | 9,190,100 | 4,152 | 7 | 6,760 | 825.6 h | 2.770 | 6,131.9 | 686,692 | 3,766.2 | flaming-centaur 4, ice-phoenix 10, many-armed-guardian 13, gorgon-medusa 14, desert-vanquisher 4, magic-dragon 11, ettin 3, fearsome-manticore 3, epic-monster-hunter-6 59, bear-5 3, spearman-1 3,589, spearman-3 1,120, archer-1 3,576, rider-1 1,784, spearman-2 1,979, rider-3 556, archer-3 1,108, archer-2 1,967, rider-2 982 |

**Ten readings**: most damage 103,197,710 · least silver 34,920,400 · fewest hired lost 15.000 · least gold 9,424 · fewest coins 24,120 · shortest queue 2,862.9 h · dmg a silver 2.766 · dmg a merc 597,802 · dmg a gold 9,496 · dmg a coin 3,816.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 0 dominated / 3 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 0.

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SS** | campaign | 4 | 1.047 | 6 | 5,268,771 | 5,414,100 | 3,803,700 | 736 | 19 | 0 | 235.5 h | 1.385 | 7,158.7 | 189,918 | ∞ |  |
| SS | repeat | 3 | 1.246 | 6 | 1,073,738 | 1,103,074 | 766,600 | 144 | 4 | 0 | 47.6 h | 1.401 | 7,456.5 | 178,496 | ∞ | swordsman-1 304, spearman-1 298, spearman-2 162, rider-2 106, archer-1 375, rider-3 57, archer-2 201, rider-1 177, epic-monster-hunter-6 7, arbalester-6 5, legionary-6 5, chariot-6 3 |
| SS | finale | 1 | 1.047 | 6 | 2,047,557 | 2,104,878 | 1,503,900 | 304 | 7 | 0 | 92.7 h | 1.361 | 6,735.4 | 209,499 | ∞ | legionary-6 13, arbalester-6 12, epic-monster-hunter-6 11, chariot-6 5, swordsman-1 594, spearman-2 323, spearman-1 571, rider-1 376, rider-2 204, archer-1 718, rider-3 111, archer-2 385 |
| **SW** | campaign | 4 | 1.327 | 3 | 8,530,502 | 8,748,206 | 6,087,200 | 1,176 | 21 | 0 | 381.2 h | 1.401 | 7,253.8 | 265,255 | ∞ |  |
| SW | repeat | 3 | 1.327 | 3 | 2,125,775 | 2,180,201 | 1,521,800 | 296 | 5 | 0 | 95.3 h | 1.397 | 7,181.7 | 277,147 | ∞ | legionary-6 11, chariot-6 6, epic-monster-hunter-6 10, arbalester-6 10, swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413 |
| SW | finale | 1 | 1.460 | 3 | 2,153,177 | 2,207,603 | 1,521,800 | 288 | 6 | 0 | 95.3 h | 1.415 | 7,476.3 | 235,523 | ∞ | legionary-6 10, arbalester-6 12, epic-monster-hunter-6 11, chariot-6 5, swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413 |
| **AI** | campaign | 4 | 1.042 | 4 | 8,985,057 | 9,039,483 | 6,085,400 | 1,336 | 24 | 0 | 380.7 h | 1.476 | 6,725.3 | 261,725 | ∞ |  |
| AI | sequence 1 | 1 | 1.042 | 4 | 2,577,346 | 2,577,346 | 1,521,100 | 408 | 7 | 0 | 95.2 h | 1.694 | 6,317.0 | 274,691 | ∞ | legionary-6 14, chariot-6 8, arbalester-6 15, epic-monster-hunter-6 14, rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, rider-2 208, archer-1 746, archer-2 414, rider-3 116 |
| AI | sequence 2 | 1 | 1.042 | 4 | 2,352,913 | 2,352,913 | 1,521,100 | 360 | 7 | 0 | 95.2 h | 1.547 | 6,535.9 | 242,629 | ∞ | legionary-6 14, chariot-6 7, arbalester-6 13, epic-monster-hunter-6 12, rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, rider-2 208, archer-1 746, archer-2 414, rider-3 116 |
| AI | sequence 3 | 1 | 1.215 | 4 | 2,092,997 | 2,092,997 | 1,521,400 | 304 | 6 | 0 | 95.2 h | 1.376 | 6,884.9 | 239,734 | ∞ | legionary-6 12, chariot-6 6, arbalester-6 11, epic-monster-hunter-6 10, rider-1 378, spearman-2 313, spearman-1 562, swordsman-1 560, archer-1 747, rider-2 208, archer-2 414, rider-3 116 |
| AI | sequence 4 | 1 | 1.460 | 4 | 1,961,801 | 2,016,227 | 1,521,800 | 264 | 4 | 0 | 95.3 h | 1.289 | 7,431.1 | 305,441 | ∞ | legionary-6 10, chariot-6 5, epic-monster-hunter-6 9, arbalester-6 9, swordsman-1 564, spearman-1 564, spearman-2 312, rider-1 375, archer-1 747, rider-2 208, rider-3 117, archer-2 413 |

**Ten readings**: most damage 8,985,057 · least silver 3,803,700 · fewest hired lost 19.000 · least gold 736 · fewest coins 0.000 · shortest queue 235.5 h · dmg a silver 1.476 · dmg a merc 265,255 · dmg a gold 7,254 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 10 dominated / 0 no stop fits, of 10 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: SS own-ladder finale.

### 2026-09-17 export, its setup (7 000 leadership)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.000 | 11 | 15,427,347 | 16,162,192 | 10,155,600 | 2,064 | 26 | 0 | 679.9 h | 1.519 | 7,474.5 | 354,012 | ∞ |  |
| HS | repeat | 3 | 1.562 | 11 | 3,203,983 | 3,383,638 | 2,482,500 | 360 | 4 | 0 | 166.1 h | 1.291 | 8,900.0 | 407,682 | ∞ | spearman-1 1,218, spearman-2 664, rider-2 357, rider-1 630, archer-1 1,385, rider-3 189, archer-2 740, arbalester-6 10, chariot-6 10, epic-monster-hunter-6 10, legionary-6 10 |
| HS | finale | 1 | 1.000 | 11 | 5,815,398 | 6,011,278 | 2,708,100 | 984 | 14 | 0 | 181.7 h | 2.147 | 5,910.0 | 308,009 | ∞ | legionary-6 31, chariot-6 17, arbalester-6 38, epic-monster-hunter-6 36, spearman-1 1,328, spearman-2 724, rider-2 389, rider-1 686, archer-2 840, archer-1 1,481, rider-3 202 |
| **SS** | campaign | 4 | 1.000 | 11 | 16,259,746 | 16,887,065 | 8,670,400 | 2,496 | 32 | 0 | 576.8 h | 1.875 | 6,514.3 | 349,573 | ∞ |  |
| SS | repeat | 3 | 1.249 | 11 | 3,549,139 | 3,692,952 | 1,985,200 | 504 | 6 | 0 | 132.8 h | 1.788 | 7,041.9 | 381,901 | ∞ | spearman-1 975, spearman-2 531, rider-2 285, rider-1 504, archer-1 1,108, rider-3 151, archer-2 592, arbalester-6 20, chariot-6 10, epic-monster-hunter-6 20, legionary-6 10 |
| SS | finale | 1 | 1.000 | 11 | 5,612,329 | 5,808,209 | 2,714,800 | 984 | 14 | 0 | 178.5 h | 2.067 | 5,703.6 | 308,009 | ∞ | spearman-1 1,328, archer-1 1,602, rider-1 700, spearman-2 695, rider-2 374, archer-2 823, rider-3 202, arbalester-6 38, chariot-6 17, epic-monster-hunter-6 36, legionary-6 31 |
| **SW** | campaign | 4 | 1.000 | 11 | 19,031,865 | 19,811,552 | 10,907,600 | 2,760 | 35 | 0 | 731.1 h | 1.745 | 6,895.6 | 357,360 | ∞ |  |
| SW | repeat | 3 | 1.562 | 11 | 4,442,817 | 4,640,025 | 2,722,500 | 576 | 7 | 0 | 182.1 h | 1.632 | 7,713.2 | 388,293 | ∞ | spearman-1 1,337, spearman-2 728, rider-2 391, rider-1 691, archer-1 1,520, rider-3 207, archer-2 812, arbalester-6 20, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20 |
| SW | finale | 1 | 1.000 | 11 | 5,703,414 | 5,891,477 | 2,740,100 | 1,032 | 14 | 0 | 184.9 h | 2.081 | 5,526.6 | 310,959 | ∞ | legionary-6 33, epic-monster-hunter-6 38, arbalester-6 40, chariot-6 17, spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215 |
| **MX** | campaign | 4 | 1.000 | 3 | 24,300,665 | 25,052,917 | 10,959,000 | 4,000 | 55 | 0 | 739.9 h | 2.217 | 6,075.2 | 340,059 | ∞ |  |
| MX | repeat | 3 | 1.000 | 3 | 6,148,584 | 6,336,647 | 2,740,100 | 1,016 | 14 | 0 | 184.9 h | 2.244 | 6,051.8 | 342,757 | ∞ | legionary-6 33, epic-monster-hunter-6 38, arbalester-6 40, chariot-6 16, spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215 |
| MX | finale | 1 | 1.014 | 3 | 5,854,913 | 6,042,976 | 2,738,700 | 952 | 13 | 0 | 185.2 h | 2.138 | 6,150.1 | 331,345 | ∞ | epic-monster-hunter-6 38, arbalester-6 38, legionary-6 30, chariot-6 14, spearman-1 1,275, spearman-2 708, rider-1 696, archer-2 866, rider-2 386, rider-3 216, archer-1 1,544 |
| **AI** | campaign | 4 | 1.000 | 4 | 24,945,884 | 25,997,591 | 12,717,200 | 5,360 | 73 | 0 | 1,213.1 h | 1.962 | 4,654.1 | 253,556 | ∞ |  |
| AI | sequence 1 | 1 | 1.007 | 4 | 6,550,179 | 6,550,179 | 3,717,800 | 1,640 | 22 | 0 | 422.8 h | 1.762 | 3,994.0 | 220,200 | ∞ | epic-monster-hunter-6 97, legionary-6 42, arbalester-6 50, chariot-6 20, archer-2 2,190, spearman-2 1,776, rider-3 547, rider-2 969 |
| AI | sequence 2 | 1 | 1.009 | 4 | 6,256,337 | 6,931,918 | 3,520,300 | 1,776 | 24 | 0 | 420.4 h | 1.777 | 3,522.7 | 193,468 | ∞ | epic-monster-hunter-6 130, legionary-6 37, arbalester-6 45, chariot-6 18, spearman-2 2,383, rider-2 1,304, rider-3 732 |
| AI | sequence 3 | 1 | 1.000 | 4 | 6,148,584 | 6,336,647 | 2,740,100 | 1,016 | 14 | 0 | 184.9 h | 2.244 | 6,051.8 | 342,757 | ∞ | legionary-6 33, epic-monster-hunter-6 38, arbalester-6 40, chariot-6 16, spearman-1 1,275, spearman-2 708, archer-1 1,562, rider-1 695, rider-2 386, archer-2 862, rider-3 215 |
| AI | sequence 4 | 1 | 1.014 | 4 | 5,990,784 | 6,178,847 | 2,739,000 | 928 | 13 | 0 | 185.0 h | 2.187 | 6,455.6 | 324,877 | ∞ | epic-monster-hunter-6 38, arbalester-6 36, legionary-6 29, chariot-6 14, spearman-1 1,275, spearman-2 708, rider-2 387, rider-1 695, archer-1 1,557, rider-3 216, archer-2 858 |

**Ten readings**: most damage 24,945,884 · least silver 8,670,400 · fewest hired lost 26.000 · least gold 2,064 · fewest coins 0.000 · shortest queue 576.8 h · dmg a silver 2.217 · dmg a merc 357,360 · dmg a gold 7,474 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 6 dominated / 3 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: S-94 all-in rebuilt; fold HS/SS/SW/MM/MX/AI → HS/SS/SW/MX/AI; HS own-ladder finale; SS own-ladder finale.

### 2026-09-17 export, 12 000 leadership

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.005 | 11 | 22,404,202 | 23,353,366 | 17,808,900 | 2,408 | 30 | 0 | 1,194.5 h | 1.258 | 9,304.1 | 369,197 | ∞ |  |
| HS | repeat | 3 | 2.750 | 11 | 4,400,680 | 4,717,068 | 4,370,200 | 360 | 4 | 0 | 292.4 h | 1.007 | 12,224.1 | 407,682 | ∞ | spearman-1 2,145, spearman-2 1,169, rider-2 628, rider-1 1,108, archer-1 2,439, rider-3 333, archer-2 1,303, arbalester-6 10, chariot-6 10, epic-monster-hunter-6 10, legionary-6 10 |
| HS | finale | 1 | 1.005 | 11 | 9,202,162 | 9,202,162 | 4,698,300 | 1,328 | 18 | 0 | 317.2 h | 1.959 | 6,929.3 | 343,540 | ∞ | epic-monster-hunter-6 66, legionary-6 39, arbalester-6 47, chariot-6 17, archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658 |
| **SS** | campaign | 4 | 1.016 | 5 | 21,759,602 | 22,633,540 | 12,071,500 | 3,016 | 48 | 0 | 807.4 h | 1.803 | 7,214.7 | 293,994 | ∞ |  |
| SS | repeat | 3 | 1.250 | 5 | 4,446,760 | 4,626,120 | 2,477,300 | 616 | 10 | 0 | 165.6 h | 1.795 | 7,218.8 | 287,777 | ∞ | spearman-1 1,216, spearman-2 663, rider-2 356, rider-1 629, archer-1 1,383, rider-3 188, archer-2 739, arbalester-6 28, chariot-6 11, epic-monster-hunter-6 24, legionary-6 15 |
| SS | finale | 1 | 1.016 | 5 | 8,419,322 | 8,755,180 | 4,639,600 | 1,168 | 18 | 0 | 310.5 h | 1.815 | 7,208.3 | 304,355 | ∞ | epic-monster-hunter-6 61, legionary-6 36, arbalester-6 41, chariot-6 14, spearman-1 2,277, spearman-2 1,241, rider-2 667, rider-1 1,177, archer-1 2,589, rider-3 354, archer-2 1,381 |
| **SW** | campaign | 4 | 1.005 | 3 | 34,445,770 | 34,445,770 | 18,793,200 | 4,824 | 67 | 0 | 1,268.9 h | 1.833 | 7,140.5 | 333,911 | ∞ |  |
| SW | repeat | 3 | 1.005 | 3 | 8,739,455 | 8,739,455 | 4,698,300 | 1,224 | 17 | 0 | 317.2 h | 1.860 | 7,140.1 | 336,530 | ∞ | epic-monster-hunter-6 66, legionary-6 34, arbalester-6 40, chariot-6 16, archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658 |
| SW | finale | 1 | 1.005 | 3 | 8,227,405 | 8,227,405 | 4,698,300 | 1,152 | 16 | 0 | 317.2 h | 1.751 | 7,141.8 | 325,560 | ∞ | epic-monster-hunter-6 66, arbalester-6 38, legionary-6 30, chariot-6 14, archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658 |
| **MX** | campaign | 4 | 1.004 | 3 | 34,617,571 | 36,236,680 | 20,720,700 | 5,784 | 82 | 0 | 1,810.6 h | 1.671 | 5,985.1 | 290,661 | ∞ |  |
| MX | repeat | 3 | 1.004 | 3 | 8,796,722 | 9,336,425 | 5,340,800 | 1,544 | 22 | 0 | 497.8 h | 1.647 | 5,697.4 | 282,201 | ∞ | epic-monster-hunter-6 111, legionary-6 34, arbalester-6 40, chariot-6 16, spearman-1 3,659, spearman-2 2,032, rider-2 1,112, rider-3 624, archer-2 2,483 |
| MX | finale | 1 | 1.005 | 3 | 8,227,405 | 8,227,405 | 4,698,300 | 1,152 | 16 | 0 | 317.2 h | 1.751 | 7,141.8 | 325,560 | ∞ | epic-monster-hunter-6 66, arbalester-6 38, legionary-6 30, chariot-6 14, archer-1 2,687, spearman-1 2,179, spearman-2 1,210, rider-1 1,191, archer-2 1,483, rider-3 371, rider-2 658 |

**Ten readings**: most damage 34,617,571 · least silver 12,071,500 · fewest hired lost 30.000 · least gold 2,408 · fewest coins 0.000 · shortest queue 807.4 h · dmg a silver 1.833 · dmg a merc 369,197 · dmg a gold 9,304 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 3 dominated / 2 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: S-94 all-in dropped; fold took band row(s) as SS; SS own-ladder finale.

### live account of 2026-09-18 (one hired type, 20 000 leadership)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SS** | campaign | 4 | 1.248 | 11 | 18,569,825 | 19,166,041 | 18,526,700 | 1,368 | 20 | 0 | 1,217.9 h | 1.002 | 13,574.4 | 309,021 | ∞ |  |
| SS | repeat | 3 | 1.248 | 11 | 3,694,764 | 3,694,764 | 3,602,400 | 288 | 4 | 0 | 235.9 h | 1.026 | 12,829.0 | 323,582 | ∞ | archer-1 2,257, rider-1 903, spearman-2 959, spearman-1 1,690, archer-2 1,158, rider-3 260, rider-2 454, epic-monster-hunter-6 40 |
| SS | finale | 1 | 1.513 | 11 | 7,485,533 | 8,081,749 | 7,719,500 | 504 | 8 | 0 | 510.3 h | 0.970 | 14,852.2 | 287,179 | ∞ | epic-monster-hunter-6 71, spearman-1 3,859, rider-2 1,080, rider-1 1,906, spearman-2 2,022, archer-1 4,486, rider-3 561, archer-2 2,392 |
| **SW** | campaign | 4 | 1.787 | 4 | 28,384,288 | 28,384,288 | 30,928,400 | 1,728 | 24 | 0 | 2,025.9 h | 0.918 | 16,426.1 | 323,582 | ∞ |  |
| SW | repeat | 4 | 1.787 | 4 | 7,096,072 | 7,096,072 | 7,732,100 | 432 | 6 | 0 | 506.5 h | 0.918 | 16,426.1 | 323,582 | ∞ | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 60 |
| **MX** | campaign | 4 | 1.577 | 3 | 29,259,123 | 29,855,339 | 30,915,800 | 1,904 | 28 | 0 | 2,029.7 h | 0.946 | 15,367.2 | 307,403 | ∞ |  |
| MX | repeat | 3 | 1.577 | 3 | 7,354,938 | 7,354,938 | 7,732,100 | 488 | 7 | 0 | 506.5 h | 0.951 | 15,071.6 | 314,337 | ∞ | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 68 |
| MX | finale | 1 | 1.732 | 3 | 7,194,309 | 7,790,525 | 7,719,500 | 440 | 7 | 0 | 510.3 h | 0.932 | 16,350.7 | 286,601 | ∞ | epic-monster-hunter-6 62, spearman-1 3,859, rider-2 1,080, rider-1 1,906, spearman-2 2,022, archer-1 4,486, rider-3 561, archer-2 2,392 |
| **AI** | campaign | 4 | 1.292 | 4 | 29,743,332 | 29,743,332 | 30,928,400 | 2,016 | 30 | 0 | 2,025.9 h | 0.962 | 14,753.6 | 304,167 | ∞ |  |
| AI | sequence 1 | 1 | 1.292 | 4 | 7,840,310 | 7,840,310 | 7,732,100 | 592 | 9 | 0 | 506.5 h | 1.014 | 13,243.8 | 298,414 | ∞ | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 83 |
| AI | sequence 2 | 1 | 1.449 | 4 | 7,549,086 | 7,549,086 | 7,732,100 | 528 | 8 | 0 | 506.5 h | 0.976 | 14,297.5 | 299,313 | ∞ | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 74 |
| AI | sequence 3 | 1 | 1.624 | 4 | 7,290,222 | 7,290,222 | 7,732,100 | 472 | 7 | 0 | 506.5 h | 0.943 | 15,445.4 | 305,092 | ∞ | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 66 |
| AI | sequence 4 | 1 | 1.817 | 4 | 7,063,714 | 7,063,714 | 7,732,100 | 424 | 6 | 0 | 506.5 h | 0.914 | 16,659.7 | 318,189 | ∞ | archer-1 4,843, rider-1 1,938, spearman-2 2,057, spearman-1 3,626, archer-2 2,485, rider-3 559, rider-2 975, epic-monster-hunter-6 59 |

**Ten readings**: most damage 29,743,332 · least silver 18,526,700 · fewest hired lost 20.000 · least gold 1,368 · fewest coins 0.000 · shortest queue 1,217.9 h · dmg a silver 1.002 · dmg a merc 323,582 · dmg a gold 16,426 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 9 dominated / 0 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: fold HS/SS/SW/MX/AI → SS/SW/MX/AI; SS own-ladder finale; MX own-ladder finale.

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.002 | 3 | 20,369,069 | 20,696,918 | 15,288,100 | 2,264 | 30 | 0 | 1,009.1 h | 1.332 | 8,996.9 | 349,739 | ∞ |  |
| HS | repeat | 3 | 2.746 | 3 | 4,009,110 | 4,009,110 | 3,680,800 | 328 | 4 | 0 | 242.0 h | 1.089 | 12,222.9 | 388,797 | ∞ | chariot-6 8, legionary-6 10, epic-monster-hunter-6 10, arbalester-6 10, archer-1 2,306, spearman-2 1,000, rider-1 905, spearman-1 1,727, archer-2 1,183, rider-3 266, rider-2 464 |
| HS | finale | 1 | 1.002 | 3 | 8,341,739 | 8,669,588 | 4,245,700 | 1,280 | 18 | 0 | 283.2 h | 1.965 | 6,517.0 | 323,701 | ∞ | epic-monster-hunter-6 59, legionary-6 49, arbalester-6 57, chariot-6 7, spearman-1 2,122, rider-2 595, rider-1 1,048, spearman-2 1,113, archer-2 1,371, rider-3 309, archer-1 2,369 |
| **SS** | campaign | 4 | 1.001 | 7 | 21,718,706 | 21,718,706 | 12,300,400 | 3,032 | 48 | 0 | 805.6 h | 1.766 | 7,163.2 | 289,672 | ∞ |  |
| SS | repeat | 3 | 1.249 | 7 | 4,559,792 | 4,559,792 | 2,681,700 | 600 | 10 | 0 | 175.7 h | 1.700 | 7,599.7 | 277,200 | ∞ | archer-1 1,680, rider-1 672, spearman-2 713, spearman-1 1,258, archer-2 862, rider-3 194, rider-2 338, arbalester-6 24, chariot-6 4, epic-monster-hunter-6 29, legionary-6 25 |
| SS | finale | 1 | 1.001 | 7 | 8,039,330 | 8,039,330 | 4,255,300 | 1,232 | 18 | 0 | 278.6 h | 1.889 | 6,525.4 | 310,458 | ∞ | epic-monster-hunter-6 59, legionary-6 49, arbalester-6 51, chariot-6 7, archer-1 2,671, rider-1 1,069, spearman-1 2,039, rider-3 321, spearman-2 1,091, rider-2 548, archer-2 1,316 |
| **SW** | campaign | 4 | 1.002 | 5 | 29,273,447 | 29,601,296 | 17,023,300 | 4,024 | 59 | 0 | 1,120.2 h | 1.720 | 7,274.7 | 309,154 | ∞ |  |
| SW | repeat | 3 | 1.305 | 5 | 7,096,423 | 7,096,423 | 4,259,200 | 936 | 14 | 0 | 279.0 h | 1.666 | 7,581.6 | 304,072 | ∞ | archer-1 2,668, rider-1 1,067, spearman-2 1,133, spearman-1 1,998, archer-2 1,369, rider-3 308, rider-2 537, arbalester-6 37, chariot-6 6, epic-monster-hunter-6 45, legionary-6 38 |
| SW | finale | 1 | 1.002 | 5 | 7,984,178 | 8,312,027 | 4,245,700 | 1,216 | 17 | 0 | 283.2 h | 1.881 | 6,565.9 | 321,709 | ∞ | epic-monster-hunter-6 59, legionary-6 49, arbalester-6 48, chariot-6 7, spearman-1 2,122, rider-2 595, rider-1 1,048, spearman-2 1,113, archer-2 1,371, rider-3 309, archer-1 2,369 |
| **MX** | campaign | 4 | 1.016 | 3 | 34,151,512 | 34,151,512 | 17,181,600 | 5,040 | 76 | 0 | 1,150.0 h | 1.988 | 6,776.1 | 300,023 | ∞ |  |
| MX | repeat | 3 | 1.017 | 3 | 8,693,352 | 8,693,352 | 4,295,200 | 1,272 | 19 | 0 | 287.4 h | 2.024 | 6,834.4 | 303,341 | ∞ | legionary-6 52, epic-monster-hunter-6 61, arbalester-6 50, chariot-6 8, archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322 |
| MX | finale | 1 | 1.016 | 3 | 8,071,456 | 8,071,456 | 4,296,000 | 1,224 | 19 | 0 | 287.6 h | 1.879 | 6,594.3 | 290,071 | ∞ | epic-monster-hunter-6 62, legionary-6 52, arbalester-6 45, chariot-6 7, archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-2 578, rider-1 1,037, archer-2 1,409, rider-3 322 |
| **AI** | campaign | 4 | 1.010 | 4 | 34,784,291 | 36,395,417 | 19,233,100 | 6,272 | 89 | 0 | 1,667.2 h | 1.809 | 5,546.0 | 271,725 | ∞ |  |
| AI | sequence 1 | 1 | 1.010 | 4 | 9,336,448 | 9,873,490 | 4,979,300 | 1,816 | 25 | 0 | 459.9 h | 1.875 | 5,141.2 | 271,179 | ∞ | legionary-6 90, epic-monster-hunter-6 83, arbalester-6 60, chariot-6 10, spearman-1 3,476, spearman-2 1,931, rider-2 989, rider-3 555, archer-2 2,410 |
| AI | sequence 2 | 1 | 1.010 | 4 | 8,829,080 | 9,366,122 | 4,979,300 | 1,688 | 24 | 0 | 459.9 h | 1.773 | 5,230.5 | 261,338 | ∞ | legionary-6 90, epic-monster-hunter-6 74, arbalester-6 54, chariot-6 9, spearman-1 3,476, spearman-2 1,931, rider-2 989, rider-3 555, archer-2 2,410 |
| AI | sequence 3 | 1 | 1.010 | 4 | 8,354,072 | 8,891,114 | 4,979,300 | 1,576 | 22 | 0 | 459.9 h | 1.678 | 5,300.8 | 263,504 | ∞ | legionary-6 90, epic-monster-hunter-6 66, arbalester-6 48, chariot-6 8, spearman-1 3,476, spearman-2 1,931, rider-2 989, rider-3 555, archer-2 2,410 |
| AI | sequence 4 | 1 | 1.017 | 4 | 8,264,691 | 8,264,691 | 4,295,200 | 1,192 | 18 | 0 | 287.4 h | 1.924 | 6,933.5 | 296,379 | ∞ | legionary-6 52, epic-monster-hunter-6 59, arbalester-6 43, chariot-6 7, archer-1 2,560, spearman-2 1,130, spearman-1 2,025, rider-1 1,039, archer-2 1,411, rider-2 575, rider-3 322 |

**Ten readings**: most damage 34,784,291 · least silver 12,300,400 · fewest hired lost 30.000 · least gold 2,264 · fewest coins 0.000 · shortest queue 805.6 h · dmg a silver 1.988 · dmg a merc 349,739 · dmg a gold 8,997 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 6 dominated / 0 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: S-94 all-in rebuilt; fold HS/SS/SW/MM/MX/AI → HS/SS/SW/MX/AI; HS own-ladder finale; SS own-ladder finale; SW own-ladder finale.

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.037 | 7 | 9,450,218 | 9,450,218 | 5,777,000 | 1,288 | 19 | 0 | 323.2 h | 1.636 | 7,337.1 | 325,749 | ∞ |  |
| HS | repeat | 3 | 1.261 | 7 | 2,041,005 | 2,041,005 | 1,312,900 | 264 | 4 | 0 | 72.8 h | 1.555 | 7,731.1 | 326,680 | ∞ | epic-monster-hunter-6 10, arbalester-6 10, legionary-6 10, chariot-6 4, swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, archer-2 288, rider-2 142, rider-3 79 |
| HS | finale | 1 | 1.037 | 7 | 3,327,203 | 3,327,203 | 1,838,300 | 496 | 7 | 0 | 104.9 h | 1.810 | 6,708.1 | 324,153 | ∞ | arbalester-6 19, legionary-6 19, epic-monster-hunter-6 18, chariot-6 7, swordsman-1 1,199, archer-1 762, spearman-1 761, rider-1 380, spearman-2 421, archer-2 420, rider-3 118, rider-2 208 |
| **SW** | campaign | 4 | 1.004 | 3 | 15,598,199 | 15,940,061 | 7,684,400 | 2,440 | 37 | 0 | 500.1 h | 2.030 | 6,392.7 | 300,662 | ∞ |  |
| SW | repeat | 3 | 1.004 | 3 | 4,090,332 | 4,204,286 | 1,948,700 | 648 | 10 | 0 | 131.7 h | 2.099 | 6,312.2 | 295,181 | ∞ | arbalester-6 26, legionary-6 26, epic-monster-hunter-6 24, chariot-6 8, spearman-1 1,004, archer-1 1,002, rider-2 278, rider-1 499, spearman-2 553, archer-2 552, rider-3 155 |
| SW | finale | 1 | 1.037 | 3 | 3,327,203 | 3,327,203 | 1,838,300 | 496 | 7 | 0 | 104.9 h | 1.810 | 6,708.1 | 324,153 | ∞ | arbalester-6 19, legionary-6 19, epic-monster-hunter-6 18, chariot-6 7, swordsman-1 1,199, archer-1 762, spearman-1 761, rider-1 380, spearman-2 421, archer-2 420, rider-3 118, rider-2 208 |
| **MX** | campaign | 4 | 1.013 | 3 | 18,216,181 | 19,164,311 | 8,665,200 | 4,360 | 61 | 0 | 751.2 h | 2.102 | 4,178.0 | 235,327 | ∞ |  |
| MX | repeat | 3 | 1.015 | 3 | 4,774,124 | 5,036,519 | 2,203,800 | 1,208 | 17 | 0 | 197.2 h | 2.166 | 3,952.1 | 226,038 | ∞ | legionary-6 53, epic-monster-hunter-6 50, arbalester-6 50, chariot-6 8, archer-1 2,058, rider-3 321, archer-2 1,138, rider-2 568 |
| MX | finale | 1 | 1.013 | 3 | 3,893,809 | 4,054,754 | 2,053,800 | 736 | 10 | 0 | 159.7 h | 1.896 | 5,290.5 | 282,703 | ∞ | epic-monster-hunter-6 29, arbalester-6 30, legionary-6 30, chariot-6 7, spearman-2 724, archer-2 710, rider-2 349, archer-1 1,228, rider-1 603, rider-3 184 |
| **AI** | campaign | 4 | 1.004 | 4 | 18,750,522 | 21,669,713 | 11,241,200 | 7,848 | 111 | 0 | 1,425.4 h | 1.668 | 2,389.2 | 133,301 | ∞ |  |
| AI | sequence 1 | 1 | 1.009 | 4 | 5,372,331 | 5,804,705 | 2,705,900 | 1,816 | 26 | 0 | 321.6 h | 1.985 | 2,958.3 | 164,796 | ∞ | legionary-6 91, epic-monster-hunter-6 83, arbalester-6 60, chariot-6 10, spearman-2 1,945, rider-3 546, archer-2 1,938 |
| AI | sequence 2 | 1 | 1.004 | 4 | 4,710,236 | 5,539,175 | 2,845,100 | 2,120 | 30 | 0 | 368.0 h | 1.656 | 2,221.8 | 125,158 | ∞ | archer-2 3,187, rider-3 894, legionary-6 150, epic-monster-hunter-6 74, arbalester-6 54, chariot-6 9 |
| AI | sequence 3 | 1 | 1.004 | 4 | 4,449,590 | 5,278,529 | 2,845,100 | 2,008 | 28 | 0 | 368.0 h | 1.564 | 2,215.9 | 124,789 | ∞ | archer-2 3,187, rider-3 894, legionary-6 150, epic-monster-hunter-6 66, arbalester-6 48, chariot-6 8 |
| AI | sequence 4 | 1 | 1.004 | 4 | 4,218,365 | 5,047,304 | 2,845,100 | 1,904 | 27 | 0 | 368.0 h | 1.483 | 2,215.5 | 120,847 | ∞ | archer-2 3,187, rider-3 894, legionary-6 150, epic-monster-hunter-6 59, arbalester-6 43, chariot-6 7 |

**Ten readings**: most damage 18,750,522 · least silver 5,777,000 · fewest hired lost 19.000 · least gold 1,288 · fewest coins 0.000 · shortest queue 323.2 h · dmg a silver 2.102 · dmg a merc 325,749 · dmg a gold 7,337 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 0 dominated / 0 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: MX own-ladder finale.

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.004 | 476 | 8,820,632 | 8,962,927 | 7,251,100 | 1,448 | 16 | 0 | 476.3 h | 1.216 | 6,091.6 | 257,643 | ∞ |  |
| HS | repeat | 3 | 1.256 | 476 | 2,011,633 | 2,011,633 | 1,769,100 | 304 | 3 | 0 | 115.3 h | 1.137 | 6,617.2 | 277,917 | ∞ | bear-5 2, legionary-6 10, arbalester-6 10, archer-1 1,107, rider-1 443, spearman-1 846, spearman-2 462, archer-2 568, rider-2 226, rider-3 126 |
| HS | finale | 1 | 1.004 | 476 | 2,785,733 | 2,928,028 | 1,943,800 | 536 | 7 | 0 | 130.3 h | 1.433 | 5,197.3 | 231,576 | ∞ | arbalester-6 30, legionary-6 23, bear-5 2, spearman-1 921, spearman-2 511, rider-2 262, rider-1 470, archer-2 639, archer-1 1,147, rider-3 146 |
| **SS** | campaign | 4 | 1.004 | 60 | 8,947,961 | 10,664,323 | 6,704,900 | 5,480 | 34 | 0 | 746.6 h | 1.335 | 1,632.8 | 171,510 | ∞ |  |
| SS | repeat | 3 | 1.249 | 60 | 2,054,337 | 2,579,026 | 1,587,400 | 1,648 | 9 | 0 | 205.5 h | 1.294 | 1,246.6 | 155,938 | ∞ | bear-5 8, arbalester-6 66, legionary-6 8, spearman-2 1,772, rider-3 501 |
| SS | finale | 1 | 1.004 | 60 | 2,784,950 | 2,927,245 | 1,942,700 | 536 | 7 | 0 | 130.1 h | 1.434 | 5,195.8 | 231,576 | ∞ | arbalester-6 30, legionary-6 23, bear-5 2, spearman-1 921, spearman-2 511, rider-1 470, rider-2 261, archer-1 1,150, archer-2 637, rider-3 146 |
| **SW** | campaign | 4 | 1.003 | 52 | 16,776,469 | 17,076,508 | 9,957,500 | 7,224 | 57 | 0 | 1,077.7 h | 1.685 | 2,322.3 | 208,269 | ∞ |  |
| SW | repeat | 3 | 1.005 | 52 | 4,358,805 | 4,358,805 | 2,635,500 | 1,936 | 15 | 0 | 298.1 h | 1.654 | 2,251.4 | 204,722 | ∞ | archer-2 1,625, spearman-2 1,290, rider-2 660, rider-3 370, arbalester-6 76, legionary-6 60, bear-5 7 |
| SW | finale | 1 | 1.003 | 52 | 3,700,054 | 4,000,093 | 2,051,000 | 1,416 | 12 | 0 | 183.5 h | 1.804 | 2,613.0 | 221,570 | ∞ | legionary-6 48, arbalester-6 60, bear-5 5, spearman-1 1,942, rider-3 306, rider-2 532, spearman-2 1,016 |
| **MM** | campaign | 4 | 1.001 | 3 | 31,715,963 | 41,230,004 | 13,734,000 | 30,120 | 218 | 0 | 2,289.0 h | 2.309 | 1,053.0 | 145,486 | ∞ |  |
| MM | repeat | 3 | 1.250 | 3 | 6,608,519 | 9,779,866 | 3,417,400 | 5,848 | 45 | 0 | 569.6 h | 1.934 | 1,130.0 | 146,856 | ∞ | rider-3 2,441, arbalester-6 403, bear-5 21, legionary-6 10 |
| MM | finale | 1 | 1.001 | 3 | 11,890,406 | 11,890,406 | 3,481,800 | 12,576 | 83 | 0 | 580.3 h | 3.415 | 945.5 | 143,258 | ∞ | rider-3 2,487, arbalester-6 362, bear-5 49, legionary-6 408 |
| **MX** | campaign | 4 | 1.001 | 3 | 49,190,513 | 49,190,513 | 13,927,200 | 51,192 | 344 | 0 | 2,321.2 h | 3.532 | 960.9 | 142,996 | ∞ |  |
| MX | repeat | 3 | 1.001 | 3 | 12,433,369 | 12,433,369 | 3,481,800 | 12,872 | 87 | 0 | 580.3 h | 3.571 | 965.9 | 142,912 | ∞ | rider-3 2,487, arbalester-6 403, bear-5 49, legionary-6 408 |
| MX | finale | 1 | 1.001 | 3 | 11,890,406 | 11,890,406 | 3,481,800 | 12,576 | 83 | 0 | 580.3 h | 3.415 | 945.5 | 143,258 | ∞ | rider-3 2,487, arbalester-6 362, bear-5 49, legionary-6 408 |

**Ten readings**: most damage 49,190,513 · least silver 6,704,900 · fewest hired lost 16.000 · least gold 1,448 · fewest coins 0.000 · shortest queue 476.3 h · dmg a silver 3.532 · dmg a merc 257,643 · dmg a gold 6,092 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 0 dominated / 0 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 2. **Re-chosen**: fold took band row(s) as SS; fold HS/SW/MM/MX → HS/SS/SW/MM/MX; SW own-ladder finale; MM own-ladder finale; MX own-ladder finale.

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.020 | 442 | 6,943,378 | 6,943,378 | 7,733,000 | 392 | 6 | 0 | 510.3 h | 0.898 | 17,712.7 | 296,617 | ∞ |  |
| HS | repeat | 3 | 2.977 | 442 | 1,576,991 | 1,576,991 | 1,929,900 | 64 | 1 | 0 | 126.7 h | 0.817 | 24,640.5 | 291,224 | ∞ | epic-monster-hunter-6 9, archer-1 1,208, spearman-2 523, rider-1 475, spearman-1 904, archer-2 620, rider-2 248, rider-3 137 |
| HS | finale | 1 | 1.020 | 442 | 2,212,405 | 2,212,405 | 1,943,300 | 200 | 3 | 0 | 130.3 h | 1.138 | 11,062.0 | 302,010 | ∞ | epic-monster-hunter-6 28, archer-2 644, spearman-1 918, rider-1 470, spearman-2 509, archer-1 1,150, rider-2 260, rider-3 146 |
| **SS** | campaign | 4 | 1.020 | 141 | 7,843,070 | 8,624,053 | 7,313,200 | 848 | 12 | 0 | 627.4 h | 1.072 | 9,248.9 | 318,189 | ∞ |  |
| SS | repeat | 3 | 1.250 | 141 | 1,882,911 | 2,095,807 | 1,790,200 | 216 | 3 | 0 | 165.7 h | 1.052 | 8,717.2 | 323,582 | ∞ | spearman-2 719, rider-3 203, rider-2 354, rider-1 625, archer-2 835, epic-monster-hunter-6 30 |
| SS | finale | 1 | 1.020 | 141 | 2,194,337 | 2,336,632 | 1,942,600 | 200 | 3 | 0 | 130.3 h | 1.130 | 10,971.7 | 302,010 | ∞ | epic-monster-hunter-6 28, spearman-1 921, spearman-2 511, rider-1 470, archer-2 639, rider-3 147, rider-2 260, archer-1 1,145 |
| **SW** | campaign | 4 | 1.020 | 104 | 9,367,909 | 10,177,150 | 8,747,300 | 1,016 | 15 | 0 | 759.9 h | 1.071 | 9,220.4 | 306,324 | ∞ |  |
| SW | repeat | 3 | 1.249 | 104 | 2,385,168 | 2,654,915 | 2,268,000 | 272 | 4 | 0 | 209.9 h | 1.052 | 8,769.0 | 307,403 | ∞ | spearman-2 911, rider-3 257, rider-2 449, rider-1 792, archer-2 1,057, epic-monster-hunter-6 38 |
| SW | finale | 1 | 1.020 | 104 | 2,212,405 | 2,212,405 | 1,943,300 | 200 | 3 | 0 | 130.3 h | 1.138 | 11,062.0 | 302,010 | ∞ | epic-monster-hunter-6 28, archer-2 644, spearman-1 918, rider-1 470, spearman-2 509, archer-1 1,150, rider-2 260, rider-3 146 |
| **MM** | campaign | 4 | 1.005 | 16 | 14,563,666 | 17,588,030 | 10,657,800 | 4,072 | 59 | 0 | 1,299.3 h | 1.366 | 3,576.5 | 168,372 | ∞ |  |
| MM | repeat | 3 | 1.005 | 16 | 3,976,648 | 4,895,742 | 2,803,600 | 1,248 | 18 | 0 | 363.8 h | 1.418 | 3,186.4 | 156,398 | ∞ | epic-monster-hunter-6 174, spearman-2 3,104, rider-3 894 |
| MM | finale | 1 | 1.021 | 16 | 2,633,722 | 2,900,804 | 2,247,000 | 328 | 5 | 0 | 207.9 h | 1.172 | 8,029.6 | 297,696 | ∞ | epic-monster-hunter-6 46, spearman-2 902, rider-3 255, rider-2 445, rider-1 785, archer-2 1,046 |
| **MX** | campaign | 4 | 1.250 | 3 | 23,589,127 | 35,693,773 | 13,043,800 | 10,480 | 148 | 0 | 2,174.0 h | 1.808 | 2,250.9 | 159,386 | ∞ |  |
| MX | repeat | 3 | 1.250 | 3 | 6,050,983 | 9,156,071 | 3,346,000 | 2,688 | 38 | 0 | 557.7 h | 1.808 | 2,251.1 | 159,236 | ∞ | rider-3 2,390, epic-monster-hunter-6 374 |
| MX | finale | 1 | 1.250 | 3 | 5,436,178 | 8,225,560 | 3,005,800 | 2,416 | 34 | 0 | 501.0 h | 1.809 | 2,250.1 | 159,888 | ∞ | rider-3 2,147, epic-monster-hunter-6 336 |

**Ten readings**: most damage 23,589,127 · least silver 7,313,200 · fewest hired lost 6.000 · least gold 392 · fewest coins 0.000 · shortest queue 510.3 h · dmg a silver 1.808 · dmg a merc 318,189 · dmg a gold 17,713 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 2 dominated / 1 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: MM own-ladder finale.

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.014 | 111 | 6,737,415 | 7,419,225 | 7,674,900 | 408 | 6 | 0 | 571.1 h | 0.878 | 16,513.3 | 307,403 | ∞ |  |
| HS | repeat | 3 | 3.247 | 111 | 1,513,423 | 1,690,017 | 1,901,800 | 72 | 1 | 0 | 147.0 h | 0.796 | 21,019.8 | 323,582 | ∞ | epic-monster-hunter-6 10, spearman-1 1,143, rider-2 319, rider-1 565, spearman-2 599, archer-2 738, rider-3 166 |
| HS | finale | 1 | 1.014 | 111 | 2,197,146 | 2,349,174 | 1,969,500 | 192 | 3 | 0 | 130.2 h | 1.116 | 11,443.5 | 291,224 | ∞ | epic-monster-hunter-6 27, spearman-1 984, rider-2 276, rider-1 486, spearman-2 516, archer-1 1,145, rider-3 143, archer-2 610 |
| **SS** | campaign | 4 | 1.248 | 51 | 7,388,536 | 7,388,536 | 7,201,600 | 576 | 8 | 0 | 473.4 h | 1.026 | 12,827.3 | 323,582 | ∞ |  |
| SS | repeat | 4 | 1.248 | 51 | 1,847,134 | 1,847,134 | 1,800,400 | 144 | 2 | 0 | 118.3 h | 1.026 | 12,827.3 | 323,582 | ∞ | archer-1 1,128, spearman-2 489, spearman-1 862, rider-1 434, archer-2 579, rider-3 130, rider-2 227, epic-monster-hunter-6 20 |
| **SW** | campaign | 4 | 1.002 | 15 | 11,149,707 | 12,220,109 | 9,268,300 | 1,424 | 20 | 0 | 854.4 h | 1.203 | 7,829.9 | 320,346 | ∞ |  |
| SW | repeat | 3 | 1.002 | 15 | 2,807,275 | 3,072,877 | 2,321,500 | 360 | 5 | 0 | 213.7 h | 1.209 | 7,798.0 | 323,582 | ∞ | epic-monster-hunter-6 50, spearman-2 897, rider-2 460, rider-3 258, rider-1 823, archer-2 1,116 |
| SW | finale | 1 | 1.003 | 15 | 2,727,882 | 3,001,478 | 2,303,800 | 344 | 5 | 0 | 213.2 h | 1.184 | 7,929.9 | 310,639 | ∞ | epic-monster-hunter-6 48, spearman-2 924, rider-3 262, rider-2 456, rider-1 805, archer-2 1,072 |
| **MX** | campaign | 4 | 1.003 | 3 | 11,353,857 | 13,214,846 | 9,888,100 | 2,504 | 35 | 0 | 1,115.6 h | 1.148 | 4,534.3 | 183,055 | ∞ |  |
| MX | repeat | 3 | 1.005 | 3 | 2,875,325 | 3,404,456 | 2,528,100 | 720 | 10 | 0 | 300.8 h | 1.137 | 3,993.5 | 161,791 | ∞ | epic-monster-hunter-6 100, spearman-2 1,787, rider-2 915, rider-3 514 |
| MX | finale | 1 | 1.003 | 3 | 2,727,882 | 3,001,478 | 2,303,800 | 344 | 5 | 0 | 213.2 h | 1.184 | 7,929.9 | 310,639 | ∞ | epic-monster-hunter-6 48, spearman-2 924, rider-3 262, rider-2 456, rider-1 805, archer-2 1,072 |
| **AI** | campaign | 4 | 1.004 | 4 | 11,589,922 | 14,171,914 | 10,706,600 | 2,888 | 41 | 0 | 1,304.8 h | 1.083 | 4,013.1 | 158,634 | ∞ |  |
| AI | sequence 1 | 1 | 1.004 | 4 | 3,160,727 | 3,741,675 | 2,776,000 | 792 | 11 | 0 | 330.3 h | 1.139 | 3,990.8 | 161,791 | ∞ | epic-monster-hunter-6 110, spearman-2 1,962, rider-3 565, rider-2 1,004 |
| AI | sequence 2 | 1 | 1.659 | 4 | 2,937,410 | 3,880,192 | 2,874,400 | 776 | 11 | 0 | 372.9 h | 1.022 | 3,785.3 | 158,849 | ∞ | epic-monster-hunter-6 108, spearman-2 3,184, rider-3 916 |
| AI | sequence 3 | 1 | 1.036 | 4 | 2,826,788 | 3,355,919 | 2,528,100 | 696 | 10 | 0 | 300.8 h | 1.118 | 4,061.5 | 156,937 | ∞ | epic-monster-hunter-6 97, spearman-2 1,787, rider-2 915, rider-3 514 |
| AI | sequence 4 | 1 | 1.156 | 4 | 2,664,997 | 3,194,128 | 2,528,100 | 624 | 9 | 0 | 300.8 h | 1.054 | 4,270.8 | 156,398 | ∞ | epic-monster-hunter-6 87, spearman-2 1,787, rider-2 915, rider-3 514 |

**Ten readings**: most damage 11,589,922 · least silver 7,201,600 · fewest hired lost 6.000 · least gold 408 · fewest coins 0.000 · shortest queue 473.4 h · dmg a silver 1.203 · dmg a merc 323,582 · dmg a gold 16,513 · dmg a coin 0.000.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 2 dominated / 1 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: fold took band row(s) as SS; HS own-ladder finale; SW own-ladder finale; MX own-ladder finale.

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SS** | campaign | 4 | 1.013 | 71 | 4,935,728 | 5,108,545 | 4,431,600 | 480 | 7 | 3,840 | 278.7 h | 1.114 | 10,282.8 | 131,856 | 1,285.3 |  |
| SS | repeat | 3 | 1.250 | 71 | 1,000,201 | 1,031,874 | 811,300 | 72 | 1 | 960 | 52.5 h | 1.233 | 13,891.7 | 168,840 | 1,041.9 | swordsman-1 515, rider-1 160, archer-1 313, spearman-2 171, spearman-1 301, rider-3 46, archer-2 161, rider-2 79, battle-boar 4, emerald-dragon 4, stone-gargoyle 3, water-elemental 7, epic-monster-hunter-5 10 |
| SS | finale | 1 | 1.013 | 71 | 1,935,125 | 2,012,923 | 1,997,700 | 264 | 4 | 960 | 121.3 h | 0.969 | 7,330.0 | 104,118 | 2,015.8 | epic-monster-hunter-5 37, water-elemental 10, battle-boar 4, stone-gargoyle 3, emerald-dragon 3, swordsman-1 1,265, archer-1 798, spearman-1 797, rider-1 398, spearman-2 442, archer-2 441, rider-2 220, rider-3 123 |
| **SW** | campaign | 4 | 1.014 | 7 | 8,250,940 | 8,250,940 | 8,344,200 | 1,320 | 19 | 3,840 | 571.2 h | 0.989 | 6,250.7 | 109,005 | 2,148.7 |  |
| SW | repeat | 3 | 1.014 | 7 | 2,104,714 | 2,104,714 | 2,115,100 | 352 | 5 | 960 | 149.9 h | 0.995 | 5,979.3 | 110,309 | 2,192.4 | epic-monster-hunter-5 49, water-elemental 10, battle-boar 4, stone-gargoyle 3, emerald-dragon 3, spearman-1 1,053, rider-2 293, spearman-2 584, archer-1 1,048, rider-1 524, archer-2 580, rider-3 163 |
| SW | finale | 1 | 1.014 | 7 | 1,936,798 | 1,936,798 | 1,998,900 | 264 | 4 | 960 | 121.6 h | 0.969 | 7,336.4 | 104,118 | 2,017.5 | epic-monster-hunter-5 37, water-elemental 10, battle-boar 4, stone-gargoyle 3, emerald-dragon 3, swordsman-1 1,265, spearman-2 445, archer-1 797, rider-1 398, spearman-1 794, rider-2 221, rider-3 124, archer-2 438 |
| **MX** | campaign | 4 | 1.003 | 3 | 8,443,234 | 8,882,593 | 8,706,000 | 1,584 | 25 | 3,840 | 660.0 h | 0.970 | 5,330.3 | 100,404 | 2,198.8 |  |
| MX | repeat | 3 | 1.003 | 3 | 2,168,812 | 2,315,265 | 2,235,700 | 440 | 7 | 960 | 179.5 h | 0.970 | 4,929.1 | 99,696 | 2,259.2 | epic-monster-hunter-5 62, water-elemental 10, battle-boar 4, stone-gargoyle 3, emerald-dragon 3, spearman-2 733, archer-2 732, rider-2 365, archer-1 1,310, rider-1 654, rider-3 204 |
| MX | finale | 1 | 1.014 | 3 | 1,936,798 | 1,936,798 | 1,998,900 | 264 | 4 | 960 | 121.6 h | 0.969 | 7,336.4 | 104,118 | 2,017.5 | epic-monster-hunter-5 37, water-elemental 10, battle-boar 4, stone-gargoyle 3, emerald-dragon 3, swordsman-1 1,265, spearman-2 445, archer-1 797, rider-1 398, spearman-1 794, rider-2 221, rider-3 124, archer-2 438 |

**Ten readings**: most damage 8,443,234 · least silver 4,431,600 · fewest hired lost 7.000 · least gold 480 · fewest coins 3,840 · shortest queue 278.7 h · dmg a silver 1.114 · dmg a merc 131,856 · dmg a gold 10,283 · dmg a coin 2,199.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 2 dominated / 1 no stop fits, of 3 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: S-94 all-in dropped.

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **HS** | campaign | 4 | 1.033 | 81 | 8,211,151 | 8,211,151 | 6,132,900 | 352 | 5 | 3,960 | 374.6 h | 1.339 | 23,327.1 | 317,110 | 2,073.5 |  |
| HS | repeat | 3 | 1.248 | 81 | 1,850,137 | 1,850,137 | 1,378,300 | 72 | 1 | 960 | 84.1 h | 1.342 | 25,696.3 | 323,582 | 1,927.2 | epic-monster-hunter-6 10, battle-boar 7, emerald-dragon 6, stone-gargoyle 5, water-elemental 10, swordsman-1 902, archer-1 564, rider-1 277, spearman-2 302, spearman-1 531, rider-3 82, archer-2 282, rider-2 139 |
| HS | finale | 1 | 1.033 | 81 | 2,660,740 | 2,660,740 | 1,998,000 | 136 | 2 | 1,080 | 122.4 h | 1.332 | 19,564.3 | 307,403 | 2,463.6 | epic-monster-hunter-6 19, water-elemental 18, battle-boar 8, emerald-dragon 7, stone-gargoyle 6, swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123 |
| **SW** | campaign | 4 | 1.009 | 36 | 11,485,771 | 11,485,771 | 8,092,800 | 544 | 8 | 5,760 | 506.6 h | 1.419 | 21,113.5 | 422,679 | 1,994.1 |  |
| SW | repeat | 3 | 1.009 | 36 | 2,941,677 | 2,941,677 | 2,031,600 | 136 | 2 | 1,560 | 128.0 h | 1.448 | 21,630.0 | 461,105 | 1,885.7 | stone-gargoyle 12, epic-monster-hunter-6 19, emerald-dragon 13, battle-boar 1, water-elemental 2, swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123 |
| SW | finale | 1 | 1.033 | 36 | 2,660,740 | 2,660,740 | 1,998,000 | 136 | 2 | 1,080 | 122.4 h | 1.332 | 19,564.3 | 307,403 | 2,463.6 | epic-monster-hunter-6 19, water-elemental 18, battle-boar 8, emerald-dragon 7, stone-gargoyle 6, swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123 |
| **MX** | campaign | 4 | 1.013 | 15 | 11,756,170 | 12,243,007 | 8,698,800 | 808 | 14 | 4,320 | 662.5 h | 1.351 | 14,549.7 | 265,799 | 2,721.3 |  |
| MX | repeat | 3 | 1.013 | 15 | 3,031,810 | 3,194,089 | 2,233,600 | 224 | 4 | 1,080 | 180.0 h | 1.357 | 13,534.9 | 258,866 | 2,807.2 | epic-monster-hunter-6 32, water-elemental 18, battle-boar 8, emerald-dragon 7, stone-gargoyle 6, spearman-2 730, rider-2 364, archer-2 726, rider-1 653, archer-1 1,300, rider-3 203 |
| MX | finale | 1 | 1.033 | 15 | 2,660,740 | 2,660,740 | 1,998,000 | 136 | 2 | 1,080 | 122.4 h | 1.332 | 19,564.3 | 307,403 | 2,463.6 | epic-monster-hunter-6 19, water-elemental 18, battle-boar 8, emerald-dragon 7, stone-gargoyle 6, swordsman-1 1,253, archer-1 797, spearman-2 442, archer-2 440, spearman-1 792, rider-1 396, rider-2 219, rider-3 123 |

**Ten readings**: most damage 11,756,170 · least silver 6,132,900 · fewest hired lost 5.000 · least gold 352 · fewest coins 3,960 · shortest queue 374.6 h · dmg a silver 1.419 · dmg a merc 422,679 · dmg a gold 23,327 · dmg a coin 2,721.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 5 dominated / 2 no stop fits, of 9 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: S-94 all-in dropped.

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

| stop | march | × | margin | sustain | worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin | counts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **SW** | campaign | 4 | 1.001 | 5 | 16,842,084 | 17,371,392 | 9,480,000 | 18,384 | 4 | 10,080 | 711.4 h | 1.777 | 916.1 | 489,636 | 1,670.8 |  |
| SW | repeat | 4 | 1.001 | 5 | 4,210,521 | 4,342,848 | 2,370,000 | 4,596 | 1 | 2,520 | 177.9 h | 1.777 | 916.1 | 489,636 | 1,670.8 | water-elemental 48, battle-boar 23, emerald-dragon 20, stone-gargoyle 17, epic-monster-hunter-6 10, spearman-1 1,131, rider-2 314, spearman-2 625, archer-1 1,124, rider-1 561, rider-3 175, archer-2 618 |
| **AI** | campaign | 4 | 1.001 | 4 | 17,086,508 | 17,615,816 | 9,479,200 | 18,397 | 6 | 10,080 | 711.2 h | 1.803 | 928.8 | 367,227 | 1,695.1 |  |
| AI | sequence 1 | 1 | 1.001 | 4 | 4,406,179 | 4,538,506 | 2,369,600 | 4,610 | 2 | 2,520 | 177.8 h | 1.859 | 955.8 | 342,746 | 1,748.5 | water-elemental 48, battle-boar 23, emerald-dragon 20, stone-gargoyle 17, epic-monster-hunter-6 14, spearman-1 1,131, rider-2 314, rider-1 562, archer-1 1,124, spearman-2 623, rider-3 175, archer-2 618 |
| AI | sequence 2 | 1 | 1.001 | 4 | 4,308,250 | 4,440,577 | 2,369,600 | 4,600 | 2 | 2,520 | 177.8 h | 1.818 | 936.6 | 293,781 | 1,709.6 | water-elemental 48, battle-boar 23, emerald-dragon 20, stone-gargoyle 17, epic-monster-hunter-6 12, spearman-1 1,131, rider-2 314, rider-1 562, archer-1 1,124, spearman-2 623, rider-3 175, archer-2 618 |
| AI | sequence 3 | 1 | 1.001 | 4 | 4,210,521 | 4,342,848 | 2,370,000 | 4,596 | 1 | 2,520 | 177.9 h | 1.777 | 916.1 | 489,636 | 1,670.8 | water-elemental 48, battle-boar 23, emerald-dragon 20, stone-gargoyle 17, epic-monster-hunter-6 10, spearman-1 1,131, rider-2 314, spearman-2 625, archer-1 1,124, rider-1 561, rider-3 175, archer-2 618 |
| AI | sequence 4 | 1 | 1.001 | 4 | 4,161,558 | 4,293,885 | 2,370,000 | 4,591 | 1 | 2,520 | 177.9 h | 1.756 | 906.5 | 440,673 | 1,651.4 | water-elemental 48, battle-boar 23, emerald-dragon 20, stone-gargoyle 17, epic-monster-hunter-6 9, spearman-1 1,131, rider-2 314, spearman-2 625, archer-1 1,124, rider-1 561, rider-3 175, archer-2 618 |

**Ten readings**: most damage 17,086,508 · least silver 9,479,200 · fewest hired lost 4.000 · least gold 18,384 · fewest coins 10,080 · shortest queue 711.2 h · dmg a silver 1.803 · dmg a merc 489,636 · dmg a gold 929 · dmg a coin 1,695.
**Bar criteria**: order ✓ · noStopBeaten ✓ · shelter ✓ · sustain ✓ · atMostFive ✓ · sweetSpot ✓ · s58b ✓.
**TotalStack** (172's reading, matched spend): 0 dominated / 0 no stop fits, of 0 rows; 162's rows no stop beats on damage or rating: 0. **Re-chosen**: fold HS/SW/AI → SW/AI.

## Every silver saver, every criterion (177 → after)

| army | worst | best | silver | dmg/silver | gold | hired | coins | queue | rating | shelter margin | sustain | flag |
|---|---|---|---|---|---|---|---|---|---:|---|---|---|
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; | 5,212,861 → 5,268,771 | 5,355,295 → 5,414,100 | 3,820,600 → 3,803,700 | 1.3644 → 1.3852 | 736 (=) | 19 (=) | 0 (=) | 237.8 → 235.5 h | 1.186 | 1.122 → 1.047 | 6 (=) | — |
| 2026-09-17 export, its setup (7 000 leadership) | 16,259,746 (=) | 16,887,065 (=) | 8,670,400 (=) | 1.8753 (=) | 2,496 (=) | 32 (=) | 0 (=) | 576.8 (=) h | 0.000 | 1.000 (=) | 11 (=) | — |
| 2026-09-17 export, 12 000 leadership | 21,675,209 → 21,759,602 | 22,535,429 → 22,633,540 | 12,129,500 → 12,071,500 | 1.7870 → 1.8026 | 3,056 → 3,016 | 48 (=) | 0 (=) | 813.9 → 807.4 h | 0.767 | 1.004 → 1.016 | 5 (=) | — |
| live account of 2026-09-18 (one hired type, 20 000 leadershi | 18,257,371 → 18,569,825 | 18,980,895 → 19,166,041 | 18,600,300 → 18,526,700 | 0.9816 → 1.0023 | 1,368 (=) | 20 (=) | 0 (=) | 1,310.0 → 1,217.9 h | 1.966 | 1.248 (=) | 11 (=) | — |
| live account, evening (hunters 83, legionaries unlimited, ch | 21,392,382 → 21,718,706 | 21,720,231 → 21,718,706 | 12,306,900 → 12,300,400 | 1.7382 → 1.7657 | 3,032 (=) | 48 (=) | 0 (=) | 805.8 → 805.6 h | 1.537 | 1.001 → 1.001 | 7 (=) | — |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legion | 8,947,961 (=) | 10,664,323 (=) | 6,704,900 (=) | 1.3345 (=) | 5,480 (=) | 34 (=) | 0 (=) | 746.6 (=) h | 0.000 | 1.004 (=) | 60 (=) | — |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180 | 7,843,070 (=) | 8,624,053 (=) | 7,313,200 (=) | 1.0725 (=) | 848 (=) | 12 (=) | 0 (=) | 627.4 (=) h | 0.000 | 1.020 (=) | 141 (=) | — |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 2 | 7,388,536 (=) | 7,388,536 (=) | 7,201,600 (=) | 1.0260 (=) | 576 (=) | 8 (=) | 0 (=) | 473.4 (=) h | 0.000 | 1.248 (=) | 51 (=) | — |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 do | 4,935,728 (=) | 5,108,545 (=) | 4,431,600 (=) | 1.1138 (=) | 480 (=) | 7 (=) | 3,840 (=) | 278.7 (=) h | 0.000 | 1.013 (=) | 71 (=) | — |

Silver savers flagged (177 → after; silver rising or damage per silver dropping, stop or march): **0**.

## Every silver saver, every criterion (176 → after)

| army | worst | best | silver | dmg/silver | gold | hired | coins | queue | rating | shelter margin | sustain | flag |
|---|---|---|---|---|---|---|---|---|---:|---|---|---|
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; | 5,212,861 → 5,268,771 | 5,355,295 → 5,414,100 | 3,820,600 → 3,803,700 | 1.3644 → 1.3852 | 736 (=) | 19 (=) | 0 (=) | 237.8 → 235.5 h | 1.186 | 1.122 → 1.047 | 6 (=) | — |
| 2026-09-17 export, its setup (7 000 leadership) | 16,259,746 (=) | 16,887,065 (=) | 8,670,400 (=) | 1.8753 (=) | 2,496 (=) | 32 (=) | 0 (=) | 576.8 (=) h | 0.000 | 1.000 (=) | 11 (=) | — |
| 2026-09-17 export, 12 000 leadership | 21,273,264 → 21,759,602 | 22,153,735 → 22,633,540 | 12,129,500 → 12,071,500 | 1.7538 → 1.8026 | 3,056 → 3,016 | 48 (=) | 0 (=) | 813.9 → 807.4 h | 2.663 | 1.004 → 1.016 | 5 (=) | — |
| live account of 2026-09-18 (one hired type, 20 000 leadershi | 18,256,930 → 18,569,825 | 18,256,930 → 19,166,041 | 18,959,900 → 18,526,700 | 0.9629 → 1.0023 | 1,368 (=) | 20 (=) | 0 (=) | 1,317.1 → 1,217.9 h | 2.359 | 1.248 (=) | 11 (=) | — |
| live account, evening (hunters 83, legionaries unlimited, ch | 21,392,382 → 21,718,706 | 21,720,231 → 21,718,706 | 12,306,900 → 12,300,400 | 1.7382 → 1.7657 | 3,032 (=) | 48 (=) | 0 (=) | 805.8 → 805.6 h | 1.537 | 1.001 → 1.001 | 7 (=) | — |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legion | 8,393,455 → 8,947,961 | 10,303,485 → 10,664,323 | 6,773,900 → 6,704,900 | 1.2391 → 1.3345 | 5,480 (=) | 34 (=) | 0 (=) | 753.4 → 746.6 h | 6.833 | 1.004 (=) | 60 (=) | — |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180 | 7,561,467 → 7,843,070 | 8,352,905 → 8,624,053 | 7,313,300 → 7,313,200 | 1.0339 → 1.0725 | 848 (=) | 12 (=) | 0 (=) | 627.0 → 627.4 h | 3.723 | 1.020 → 1.020 | 141 (=) | — |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 2 | 7,388,536 (=) | 7,388,536 (=) | 7,201,600 (=) | 1.0260 (=) | 576 (=) | 8 (=) | 0 (=) | 473.4 (=) h | 0.000 | 1.248 (=) | 51 (=) | — |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 do | 4,919,095 → 4,935,728 | 5,091,912 → 5,108,545 | 4,431,600 (=) | 1.1100 → 1.1138 | 480 (=) | 7 (=) | 3,840 (=) | 278.7 (=) h | 0.338 | 1.013 (=) | 71 (=) | — |

Silver savers flagged (176 → after; silver rising or damage per silver dropping, stop or march): **0**.
