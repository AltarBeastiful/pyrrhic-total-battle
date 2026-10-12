# 215 — the search-knob census

For each knob of the plan's search: how much plan CPU restricting it saves, and whether the restriction is costless in march rating. Stage 1 is in-process on three heavy armies; stage 2 is the repo's own benchmark (`tests/engine/plan-benchmark.test.ts`), the restricted run diffed stop by stop against the unrestricted run of this tree and rated with `CAMPAIGN.markerRates` (`rate`, `src/engine/rating.ts`). `plan CPU saved` is the **min**-based reading, the medians beside it in `215-the-search-knobs-stage1.md`; the stage-1 figures carry a few-point band (see the closing note), so the stage-2 verdict is the firm half. **Nothing is re-based.**

| knob | restriction | plan CPU saved | % of pool CPU | stops moved | worst rating delta | verdict |
|---|---|---:|---:|---:|---:|---|
| `DEPTHS` | no high — `[1,2,3,4,5]` | 6.2 % (min) | 2.8 % | 21 | −27.568 | **trade** |
| `DEPTHS` | no low — `[4,5,6,7,8]` | 15.5 % (min) | 7.0 % | 15 | −24.991 | **trade** |
| `DEPTHS` | middle — `[3,4,5,6]` | 5.0 % (min) | 2.3 % | 28 | −24.991 | **trade** |
| `LADDER_GROWTHS` | every other — `[1,1.5,2.2,4,6]` | 3.1 % (min) | 1.4 % | 6 | −3.878 | **not worth it** (< 2 %) |
| `SIZER_DEPTHS` | drop `msRelaxed` | 36.1 % (min) | 16.2 % | 0 | 0 | **costless** |
| `SIZER_DEPTHS` | drop `ms` | 8.4 % (min) | 3.8 % | 0 | 0 | **costless** |
| `SIZER_DEPTHS` | drop `elite` | 5.6 % (min) | 2.5 % | 0 | 0 | **costless** |
| `WINNER_RUNGS_DEPTH` | winner-rungs shape off | -0.4 % (min) | -0.2 % | 6 | −7.632 | **not worth it** (< 2 %) |
| `PLAN_LIMITS.climbRounds` | 32 → 16 | 16.5 % (min) | 7.4 % | 3 | −26.903 | **trade** |
| `PLAN_LIMITS.climbRounds` | 32 → 8 | 20.1 % (min) | 9.0 % | 3 | −24.155 | **trade** |
| `PLAN_LIMITS.climbSeeds` | 8 → 4 | -3.9 % (min) | -1.7 % | 0 | 0 | **not worth it** (< 2 %) |
| `PLAN_LIMITS.sweepRounds` | 16 → 8 | 1.6 % (min) | 0.7 % | 0 | 0 | **not worth it** (< 2 %) |
| `CAMPAIGN.advisorSweep.horizons` | `[3,4,5]` → `[4]` (advisor only) | — (2 probe plans, 972.9 ms) | n/a (advisor) | 0 (no plan stop) | 0 | **costless** |

## Stops moved

**`DEPTHS` no high — `[1,2,3,4,5]`**
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · burn-saver — rated −27.568
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · sweet-spot — rated +1.388
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · more-mercs — rated −1.193
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · all-in — STOP LOST
- the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) · silver-saver — rated −7.289
- 2026-09-17 export, its setup (7 000 leadership) · burn-saver — rated +2.051
- 2026-09-17 export, its setup (7 000 leadership) · silver-saver — STOP LOST
- 2026-09-17 export, its setup (7 000 leadership) · sweet-spot — rated +0.551
- 2026-09-17 export, 12 000 leadership · burn-saver — rated −13.887
- 2026-09-17 export, 12 000 leadership · silver-saver — rated −8.208
- live account of 2026-09-18 (one hired type, 20 000 leadership) · silver-saver — STOP LOST
- live account of 2026-09-18 (one hired type, 20 000 leadership) · sweet-spot — rated −11.415
- live account of 2026-09-18 (one hired type, 20 000 leadership) · steady-max — rated −9.324
- live account of 2026-09-18 (one hired type, 20 000 leadership) · all-in — rated −12.419
- live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · burn-saver — rated −18.058
- live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · silver-saver — rated −10.078
- live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · sweet-spot — rated +5.606
- Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) · burn-saver — rated +9.520
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · burn-saver — rated +2.633
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · silver-saver — STOP LOST
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · burn-saver — STOP LOST
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · silver-saver — rated −11.958
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · burn-saver — rated −12.978
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · silver-saver — rated −16.036
- his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) · silver-saver — rated +3.757
- his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) · burn-saver — rated −10.539

**`DEPTHS` no low — `[4,5,6,7,8]`**
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · silver-saver — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot — rated +17.663
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · steady-max — STOP LOST
- 2026-09-17 export, its setup (7 000 leadership) · all-in — rated −0.035
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · burn-saver — STOP LOST
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · silver-saver — rated +9.358
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · sweet-spot — rated −6.986
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · more-mercs — rated −15.019
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · steady-max — rated −24.991
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · burn-saver — rated −4.303
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · silver-saver — rated −6.136
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · sweet-spot — rated +1.602
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · more-mercs — rated −5.752
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · steady-max — rated −9.341
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · burn-saver — rated +5.716
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · silver-saver — rated −18.920
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · sweet-spot — rated −0.364
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · all-in — rated −1.491

**`DEPTHS` middle — `[3,4,5,6]`**
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · burn-saver — STOP LOST
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · sweet-spot — rated −14.592
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · more-mercs — STOP LOST
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · steady-max — STOP LOST
- first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) · all-in — rated −5.761
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · silver-saver — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot — rated +17.663
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · steady-max — STOP LOST
- the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) · silver-saver — rated −1.782
- 2026-09-17 export, its setup (7 000 leadership) · burn-saver — rated −6.343
- 2026-09-17 export, its setup (7 000 leadership) · silver-saver — rated −7.944
- 2026-09-17 export, its setup (7 000 leadership) · sweet-spot — rated +0.551
- 2026-09-17 export, its setup (7 000 leadership) · all-in — rated −0.035
- 2026-09-17 export, 12 000 leadership · burn-saver — rated −13.887
- 2026-09-17 export, 12 000 leadership · silver-saver — rated −4.378
- live account of 2026-09-18 (one hired type, 20 000 leadership) · silver-saver — rated −6.630
- live account of 2026-09-18 (one hired type, 20 000 leadership) · sweet-spot — rated −4.849
- live account of 2026-09-18 (one hired type, 20 000 leadership) · steady-max — rated −3.467
- live account of 2026-09-18 (one hired type, 20 000 leadership) · all-in — rated −4.661
- live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · burn-saver — rated −4.501
- live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · silver-saver — STOP LOST
- live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · sweet-spot — rated +5.606
- Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) · burn-saver — rated −5.961
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · burn-saver — rated −11.384
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · silver-saver — STOP LOST
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · sweet-spot — rated −6.986
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · more-mercs — rated −15.019
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · steady-max — rated −24.991
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · burn-saver — rated −4.303
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · silver-saver — rated −3.602
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · more-mercs — rated −5.752
- his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) · steady-max — rated −9.341
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · burn-saver — rated +0.610
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · silver-saver — rated −11.122
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · sweet-spot — rated +0.943
- his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) · silver-saver — STOP LOST
- his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) · burn-saver — STOP LOST

**`LADDER_GROWTHS` every other — `[1,1.5,2.2,4,6]`**
- 2026-09-17 export, its setup (7 000 leadership) · burn-saver — rated +2.051
- 2026-09-17 export, its setup (7 000 leadership) · sweet-spot — rated +0.040
- live account of 2026-09-18 (one hired type, 20 000 leadership) · silver-saver — STOP LOST
- live account of 2026-09-18 (one hired type, 20 000 leadership) · sweet-spot — rated +4.149
- live account of 2026-09-18 (one hired type, 20 000 leadership) · steady-max — rated −3.467
- live account of 2026-09-18 (one hired type, 20 000 leadership) · all-in — rated −3.878
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · burn-saver — rated −3.207
- his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) · silver-saver — STOP LOST

**`WINNER_RUNGS_DEPTH` winner-rungs shape off**
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs — rated −2.590
- live account of 2026-09-18 (one hired type, 20 000 leadership) · silver-saver — STOP LOST
- live account of 2026-09-18 (one hired type, 20 000 leadership) · sweet-spot — rated +8.397
- live account of 2026-09-18 (one hired type, 20 000 leadership) · steady-max — rated −1.195
- live account of 2026-09-18 (one hired type, 20 000 leadership) · all-in — rated −3.662
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · more-mercs — rated −2.349
- the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) · steady-max — rated −7.632

**`PLAN_LIMITS.climbRounds` 32 → 16**
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · silver-saver — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot — rated −26.903
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · steady-max — rated −26.578
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · all-in — rated +0.305

**`PLAN_LIMITS.climbRounds` 32 → 8**
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · silver-saver — STOP LOST
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · sweet-spot — rated −24.155
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · more-mercs — rated −16.134
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · steady-max — rated −2.761
- first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) · all-in — STOP LOST


## Verdict

**Proven costless** — no march stop worse anywhere in the benchmark (the owner's own bar):

- `SIZER_DEPTHS` `drop `msRelaxed``
- `SIZER_DEPTHS` `drop `ms``
- `SIZER_DEPTHS` `drop `elite``
- `CAMPAIGN.advisorSweep.horizons` `[3,4,5]` → `[4]` — removes two advisor probe plans (972.9 ms CPU, marchTarget 3 and 5) and not one plan stop; it does drop the two rows the advisor shows

**Trade** (CPU saved, stops moved — listed above): `DEPTHS` `no high — `[1,2,3,4,5]`` · `DEPTHS` `no low — `[4,5,6,7,8]`` · `DEPTHS` `middle — `[3,4,5,6]`` · `PLAN_LIMITS.climbRounds` `32 → 16` · `PLAN_LIMITS.climbRounds` `32 → 8`.

**Not worth it** (saved under the 2 % of pool CPU bar): `LADDER_GROWTHS` `every other — `[1,1.5,2.2,4,6]`` · `WINNER_RUNGS_DEPTH` `winner-rungs shape off` · `PLAN_LIMITS.climbSeeds` `8 → 4` · `PLAN_LIMITS.sweepRounds` `16 → 8`.

Of those under the bar, these are **also costless** (CPU moves nothing, but too little to matter): `PLAN_LIMITS.climbSeeds` `8 → 4` · `PLAN_LIMITS.sweepRounds` `16 → 8`.

A **knob** here is a constant of the search, not a promise: `SIZER_DEPTHS` dropping one method leaves the
sizer shape off for every candidate, and the benchmark answers every stop identically without it — the
sizer shapes that W11's re-typing and the put-back follow simply never win a stop on these 19 armies.
The same claim on an army outside this benchmark is not made here.

**Closing line.** These restrictions are proven costless in march rating: `SIZER_DEPTHS` `drop `msRelaxed``; `SIZER_DEPTHS` `drop `ms``; `SIZER_DEPTHS` `drop `elite``; `CAMPAIGN.advisorSweep.horizons` `[3,4,5]` → `[4]` — removes two advisor probe plans (972.9 ms CPU, marchTarget 3 and 5) and not one plan stop; it does drop the two rows the advisor shows.

The stage-2 runs are deterministic (the same tree, the same 19 benchmark armies); the stage-1 CPU figures
swing with the machine (the arms are interleaved and `--expose-gc` collects before every plan, but a
3–10 % band on the small ones is the floor of this method), so a knob within a few points of the 2 % bar
reads as borderline rather than as a verdict.

