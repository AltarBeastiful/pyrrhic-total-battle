---
type: experiment
title: "191 — what a percent is worth"
created: 2026-10-08
tags: [w17, advisor, probes]
related: ["[[Progression-Advisor-Plan]]", "[[190-the-pool]]"]
---

# 191 — what a percent is worth

The advisor's pass (`runAdvisor`, `src/worker/advisor.ts`): the baseline and the 29 generic probes of `genericProbes()` (+1 point on each of 13 health and 13 strength lines, +1 % of the pool on leadership, authority, dominance), each a whole plan read on every stop of the bar as the March shows it (Tight), ranked on the sweet spot. One lane in Node (wall and CPU are one thread's), no clock in any job. The armies are the benchmark's (19).

## Summary

Flags are counted over every probe × stop (headline stop only, after the dot), as noise/reorder/worse; clamped likewise.

| army | stops | probes read | wall ms | CPU ms | noise/reorder/worse | clamped (sweet spot) |
|---|---|---|---|---|---|---|
| 2026-09-17 export, its setup (7 000 leadership) | 5 | 29/29 | 12,403 | 17,046 | 19/5/21 · 3/0/1 | 4 (0) |
| 2026-09-17 export, 12 000 leadership | 4 | 29/29 | 12,348 | 17,225 | 10/5/8 · 0/3/1 | 3 (1) |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 4 | 29/29 | 6,359 | 6,810 | 8/0/8 · 2/0/2 | 0 (0) |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 5 | 29/29 | 11,444 | 14,491 | 12/7/13 · 3/0/3 | 5 (0) |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 4 | 29/29 | 3,167 | 4,997 | 9/8/17 · 2/3/6 | 12 (6) |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 5 | 29/29 | 7,455 | 11,500 | 13/4/16 · 4/3/6 | 5 (4) |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 5 | 29/29 | 3,388 | 3,810 | 15/1/15 · 1/0/1 | 0 (0) |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 5 | 29/29 | 3,297 | 3,925 | 6/6/11 · 0/4/3 | 5 (3) |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 3 | 29/29 | 6,395 | 11,352 | 4/13/8 · 0/7/2 | 4 (2) |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 3 | 29/29 | 7,671 | 11,782 | 8/18/18 · 3/9/11 | 20 (11) |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 2 | 29/29 | 9,542 | 13,827 | 3/14/9 · 0/7/5 | 11 (5) |
| first-run army, Bear V ×1 (20 000 leadership) | 1 | 29/29 | 224 | 415 | 0/4/7 · 0/4/7 | 7 (7) |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | 29/29 | 526 | 608 | 0/4/7 · 0/4/7 | 7 (7) |
| first-run army, Bear V ×3 (20 000 leadership) | 2 | 29/29 | 322 | 365 | 2/8/15 · 0/4/7 | 14 (7) |
| first-run army, Bear V ×10 (20 000 leadership) | 2 | 29/29 | 675 | 868 | 4/8/13 · 0/4/7 | 11 (7) |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 4 | 29/29 | 1,653 | 2,208 | 0/17/25 · 0/4/7 | 25 (7) |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 5 | 29/29 | 17,645 | 25,981 | 41/51/72 · 8/9/17 | 60 (12) |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 5 | 0/29 | 62,722 | 63,087 | 0/0/0 · 0/0/0 | 0 (0) |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3 | 29/29 | 3,155 | 4,790 | 7/15/16 · 5/4/8 | 11 (4) |

Probe × stop readings clamped to zero, all armies: **204** (**83** on a sweet spot).

## Reading (measured figures only)

**Time.** The 18 armies the pass could finish took 107,669 ms wall and 152,000 ms CPU on one lane in Node (the CPU figure is `process.cpuUsage`, which also counts the engine's helper threads and GC), 29 probes plus the baseline each, **0.22 s to 17.6 s a pass** (median 4.9 s; the owner's accounts 3.2–12.4 s). Divided by 30 jobs that is 7–588 ms a plan. With the pool's measured ×1.76 / ×2.77 / ×3.93 at 2 / 4 / 6 workers on the advisor's shape ([[190-the-pool]]) the 12.4 s armies come to ≈ 7.0 / 4.5 / 3.2 s, inside the 20 s clock; the 17.6 s army (experiment 110's camp, monster tiers 3–5 at 900 dominance) comes to ≈ 10.0 / 6.4 / 4.5 s.

**The 20 000-dominance camp (experiment 129's)** reads **0 of 29**: its baseline alone took 62.7 s on one lane, three times the 20 s clock. Here the inline lane cannot be preempted, so the baseline finished late and every probe was then cut; in the browser the baseline job is cancelled at 20 s and the pass reports no baseline. The plan's own prediction (§4: cut and said) holds; nothing was read for this army.

**Clamped.** Yes, probes were clamped: **204** probe × stop readings over the 18 read armies rate below current on both readings and gain 0 by the clamp, **83** of them on a sweet spot (the Epic Monster Hunter VI ×83 army has 25 clamped readings over its 4 stops, the owner's usual setup of 2026-09-19 has 20 over 3, the experiment 110 camp 60 over 5). Each is shown as "no gain" and ranked, none was dropped, and no ranking row in this file shows a negative gain.

**Flags.** Over all probe × stop readings, `worse` (the re-planned stop rates below current after Tight) fires 8–25 times an army on the owner's armies and 72 times on the experiment 110 camp; `reorder` (the re-priced march dies in another order) 0–18 on the owner's armies, 51 on the experiment 110 camp; `noise` (re-planned below re-priced) 3–19 on them, 41 on that camp. On a sweet spot alone `worse` fires on 7 of 29 probes on every first-run army with a Bear or a hunter (`health:melee`, `health:ranged`, `health:mounted` and four more), always together with `reorder` and a clamp. The per-army counts are in the summary table.

**Sanity against 0015 / 0016.** Their conclusion is that the troop floor decides the mercenaries' damage (0015 §1: the sizer keeps every mercenary stack under the smallest troop stack). The measured ranks agree where the account's floor is set by one troop line, and not elsewhere:

- On the 2026-09-17 export at its own setup (7 000 leadership) **`health:melee` ranks first, gain 6.2259 and +27.562 % damage** against 0.2133 for the best strength line (`strength:guardsmen`); on the evening live account it is again first, **4.3514 and +15.080 %** against 0.2023. The same two armies' next health line is 0.0684 and 0.0740.
- On the owner's later camps (the 2026-09-18 live camp, both 2026-09-19 camps, the usual setup, the 2026-09-24 browser setup) the best health line ranks 6 / 6 / 6 / 6 / 12 and **no health line is first**: strength on the army or the guardsmen leads (0.20–0.33) with `housing:leadership` or `housing:dominance` beside it. A +1 point of health does not move his floor there; the engine reads +1 point of strength as +0.2–0.3 % of damage almost one for one.
- `strength:guardsmen` and `strength:army` have **identical sweet-spot gains** on 8 of the 18 armies, `health:guardsmen` and `health:army` on 10, `strength:monster` and `strength:beast` on 14: those armies read each pair through the same units, so the ranking cannot tell them apart. The UI should merge or label them.

So the troop-floor result of 0015 is visible exactly where expected (two armies out of the eleven owner and TotalStack armies), but it is **not** a rule that troop health ranks high on every owner army: on his current setups it does not.

## Left open (not changed)

1. **The rating's gain is not a damage gain.** On his TotalStack profile of 2026-09-19 the first three rows (`strength:flying` 6.5214, `strength:giant` 6.5022, `housing:leadership` 6.2975) are headlined at **−10.776 %, −10.795 %, −10.806 %** damage: the re-planned sweet spot is another trade (less damage, far fewer mercenaries or less silver) that `rate()` prefers, and the 4 000-leadership case's first row (`strength:ranged`, 0.4309) is −4.857 %. The sweet spot is a different stop after the upgrade. This is how the reading is specified (C3 / rate()), so it is **not** changed here; the card must show the damage and the cost change with the rating, not a "+x %" damage claim. Same on his usual setup (`housing:dominance`, 1.6062, −0.894 %).
2. **`health:*` probes read `worse` with a clamp** on the first-run armies (7 of 29 on every sweet spot): the re-planned bar after +1 point of health is rated below the baseline's. The re-priced reading is also negative (`reorder`), consistent with a stack crossing the troop floor and dying first, but this was not traced stack by stack. It is the flag working as designed (the loss is shown, the gain is clamped). Whether the search should have found the baseline's counts again is a main-plan question (search regression) and is **not** touched.
3. **Pairs the armies cannot tell apart** (above): a presentation choice for the card phase.
4. **The 20 000-dominance camp reads nothing** in 20 s on one lane; N workers (≈ 3–4 s a plan on this machine) do not change that, the baseline alone is 62.7 s.
5. All 19 armies are run, not 18: the benchmark has 19 scenarios since experiment 129's camp was added; the 18 that finish are the ones summarised above.

## 2026-09-17 export, its setup (7 000 leadership)

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 12,403 ms wall, 17,046 ms CPU. Over all 145 probe × stop readings: 19 noise, 5 reorder, 21 worse, 4 clamped, 110 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | health:melee | 6.2259 | +27.562 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.2133 | +0.213 | repriced | yes |  |  |  |
| 3 | strength:army | 0.2133 | +0.213 | repriced | yes |  |  |  |
| 4 | housing:leadership | 0.1606 | +0.392 | replanned |  |  |  |  |
| 5 | strength:mounted | 0.0784 | +0.078 | repriced | yes |  | yes |  |
| 6 | strength:ranged | 0.0757 | +0.076 | replanned |  |  |  |  |
| 7 | health:guardsmen | 0.0684 | +0.153 | replanned |  |  |  |  |
| 8 | health:army | 0.0684 | +0.153 | replanned |  |  |  |  |
| 9 | strength:melee | 0.0318 | +0.032 | replanned |  |  |  |  |
| 10 | health:ranged | 0.0306 | +0.084 | replanned |  |  |  |  |
| 11 | health:mounted | 0.0253 | +0.085 | replanned |  |  |  |  |
| 12 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## 2026-09-17 export, 12 000 leadership

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max. 29 of 29 probes read, 0 cut, 0 failed. Pass: 12,348 ms wall, 17,225 ms CPU. Over all 116 probe × stop readings: 10 noise, 5 reorder, 8 worse, 3 clamped, 81 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.2710 | +0.493 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.1981 | +0.198 | replanned |  |  |  |  |
| 3 | strength:army | 0.1981 | +0.198 | replanned |  |  |  |  |
| 4 | strength:mounted | 0.0894 | +0.089 | replanned |  |  |  |  |
| 5 | health:ranged | 0.0560 | +0.063 | replanned |  | yes |  |  |
| 6 | strength:melee | 0.0402 | +0.040 | replanned |  |  |  |  |
| 7 | strength:ranged | 0.0393 | +0.039 | replanned |  |  |  |  |
| 8 | health:melee | 0.0067 | +0.013 | replanned |  | yes |  |  |
| 9 | health:guardsmen | 0.0028 | +0.001 | replanned |  |  |  |  |
| 10 | health:army | 0.0028 | +0.001 | replanned |  |  |  |  |
| 11 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 12 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

Baseline bar: silver-saver · sweet-spot · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 6,359 ms wall, 6,810 ms CPU. Over all 116 probe × stop readings: 8 noise, 0 reorder, 8 worse, 0 clamped, 80 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.4854 | +0.706 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.2558 | +0.256 | replanned |  |  |  |  |
| 3 | strength:army | 0.2558 | +0.256 | replanned |  |  |  |  |
| 4 | health:ranged | 0.1293 | +0.189 | replanned |  |  |  |  |
| 5 | strength:mounted | 0.1043 | +0.104 | replanned |  |  |  |  |
| 6 | strength:ranged | 0.0918 | +0.092 | replanned |  |  |  |  |
| 7 | health:guardsmen | 0.0368 | +0.058 | replanned |  |  |  |  |
| 8 | health:army | 0.0368 | +0.058 | replanned |  |  |  |  |
| 9 | strength:melee | 0.0255 | +0.026 | replanned |  |  |  |  |
| 10 | health:melee | 0.0000 | — | no gain | yes |  | yes |  |
| 11 | health:mounted | 0.0000 | — | no gain | yes |  | yes |  |
| 12 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 11,444 ms wall, 14,491 ms CPU. Over all 145 probe × stop readings: 12 noise, 7 reorder, 13 worse, 5 clamped, 108 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | health:melee | 4.3514 | +15.080 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.2023 | +0.202 | replanned |  |  |  |  |
| 3 | strength:army | 0.2023 | +0.202 | replanned |  |  |  |  |
| 4 | housing:leadership | 0.0941 | +0.237 | replanned |  |  |  |  |
| 5 | strength:ranged | 0.0766 | +0.077 | replanned |  |  |  |  |
| 6 | health:mounted | 0.0740 | +0.228 | replanned |  |  |  |  |
| 7 | strength:mounted | 0.0681 | +0.068 | replanned |  |  |  |  |
| 8 | strength:melee | 0.0328 | +0.033 | replanned |  |  |  |  |
| 9 | health:ranged | 0.0000 | — | no gain | yes |  | yes |  |
| 10 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 11 | health:guardsmen | 0.0000 | — | no gain | yes |  | yes |  |
| 12 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:army | 0.0000 | — | no gain | yes |  | yes |  |
| 16 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

Baseline bar: burn-saver · sweet-spot · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 3,167 ms wall, 4,997 ms CPU. Over all 116 probe × stop readings: 9 noise, 8 reorder, 17 worse, 12 clamped, 90 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | strength:guardsmen | 0.2017 | +0.202 | replanned |  |  |  |  |
| 2 | strength:army | 0.2017 | +0.202 | replanned |  |  |  |  |
| 3 | housing:leadership | 0.0416 | +0.265 | replanned |  |  |  |  |
| 4 | health:guardsmen | 0.0016 | +0.007 | replanned |  |  |  |  |
| 5 | health:army | 0.0016 | +0.007 | replanned |  |  |  |  |
| 6 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 7 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 8 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 10 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 11 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 17 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 18 | strength:ranged | 0.0000 | — | no gain | yes |  | yes | yes |
| 19 | strength:mounted | 0.0000 | — | no gain | yes |  | yes | yes |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

Baseline bar: burn-saver · silver-saver · sweet-spot · more-mercs · steady-max. 29 of 29 probes read, 0 cut, 0 failed. Pass: 7,455 ms wall, 11,500 ms CPU. Over all 145 probe × stop readings: 13 noise, 4 reorder, 16 worse, 5 clamped, 98 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | strength:army | 0.2372 | +0.237 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.1665 | +0.166 | replanned |  |  |  |  |
| 3 | strength:monster | 0.0707 | +0.071 | replanned |  |  |  |  |
| 4 | strength:beast | 0.0707 | +0.071 | replanned |  |  |  |  |
| 5 | strength:mounted | 0.0544 | +0.054 | replanned |  |  |  |  |
| 6 | health:army | 0.0353 | +0.044 | replanned |  |  |  |  |
| 7 | strength:ranged | 0.0331 | +0.033 | replanned |  |  |  |  |
| 8 | health:melee | 0.0000 | — | no gain | yes | yes | yes | yes |
| 9 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:mounted | 0.0000 | — | no gain | yes | yes | yes | yes |
| 11 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:guardsmen | 0.0000 | — | no gain | yes |  | yes |  |
| 13 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 21 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 27 | housing:leadership | 0.0000 | — | no gain | yes |  | yes |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

Baseline bar: burn-saver · silver-saver · sweet-spot · more-mercs · steady-max. 29 of 29 probes read, 0 cut, 0 failed. Pass: 3,388 ms wall, 3,810 ms CPU. Over all 145 probe × stop readings: 15 noise, 1 reorder, 15 worse, 0 clamped, 116 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.2586 | +0.487 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.2040 | +0.204 | replanned |  |  |  |  |
| 3 | strength:army | 0.2040 | +0.204 | replanned |  |  |  |  |
| 4 | strength:mounted | 0.0989 | +0.099 | replanned |  |  |  |  |
| 5 | strength:ranged | 0.0388 | +0.039 | replanned |  |  |  |  |
| 6 | health:guardsmen | 0.0358 | +0.066 | replanned |  |  |  |  |
| 7 | health:army | 0.0358 | +0.066 | replanned |  |  |  |  |
| 8 | health:melee | 0.0200 | +0.000 | replanned |  |  |  |  |
| 9 | health:mounted | 0.0136 | +0.064 | replanned |  |  |  |  |
| 10 | health:ranged | 0.0000 | — | no gain | yes |  | yes |  |
| 11 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:melee | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 3,297 ms wall, 3,925 ms CPU. Over all 145 probe × stop readings: 6 noise, 6 reorder, 11 worse, 5 clamped, 107 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.2167 | +0.455 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.1963 | +0.196 | replanned |  |  |  |  |
| 3 | strength:army | 0.1963 | +0.196 | replanned |  |  |  |  |
| 4 | strength:mounted | 0.0882 | +0.088 | replanned |  |  |  |  |
| 5 | strength:ranged | 0.0358 | +0.036 | replanned |  |  |  |  |
| 6 | health:melee | 0.0331 | +0.035 | replanned |  |  |  |  |
| 7 | health:ranged | 0.0085 | +0.009 | replanned |  | yes |  |  |
| 8 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 10 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:army | 0.0000 | — | no gain |  | yes | yes | yes |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:melee | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

Baseline bar: silver-saver · sweet-spot · steady-max. 29 of 29 probes read, 0 cut, 0 failed. Pass: 6,395 ms wall, 11,352 ms CPU. Over all 87 probe × stop readings: 4 noise, 13 reorder, 8 worse, 4 clamped, 39 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | strength:flying | 6.5214 | -10.776 | replanned |  |  |  |  |
| 2 | strength:giant | 6.5022 | -10.795 | replanned |  |  |  |  |
| 3 | housing:leadership | 6.2975 | -10.806 | replanned |  |  |  |  |
| 4 | strength:mounted | 1.5956 | -7.795 | replanned |  |  |  |  |
| 5 | strength:ranged | 1.5705 | -7.804 | replanned |  |  |  |  |
| 6 | strength:melee | 1.5051 | -7.870 | replanned |  |  |  |  |
| 7 | health:melee | 1.4770 | -7.932 | replanned |  | yes |  |  |
| 8 | health:ranged | 1.4233 | -7.977 | replanned |  | yes |  |  |
| 9 | health:mounted | 1.3694 | -8.059 | replanned |  | yes |  |  |
| 10 | strength:army | 0.3298 | +0.330 | replanned |  |  |  |  |
| 11 | strength:guardsmen | 0.2480 | +0.248 | replanned |  |  |  |  |
| 12 | strength:monster | 0.0818 | +0.082 | replanned |  |  |  |  |
| 13 | strength:beast | 0.0222 | +0.022 | replanned |  |  |  |  |
| 14 | strength:dragon | 0.0192 | +0.019 | replanned |  |  |  |  |
| 15 | strength:elemental | 0.0181 | +0.018 | replanned |  |  |  |  |
| 16 | health:flying | 0.0000 | — | no gain |  | yes |  |  |
| 17 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 18 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 20 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 21 | health:army | 0.0000 | — | no gain |  | yes | yes | yes |
| 22 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 23 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 24 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 25 | health:giant | 0.0000 | — | no gain |  | yes |  |  |
| 26 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

Baseline bar: burn-saver · sweet-spot · steady-max. 29 of 29 probes read, 0 cut, 0 failed. Pass: 7,671 ms wall, 11,782 ms CPU. Over all 87 probe × stop readings: 8 noise, 18 reorder, 18 worse, 20 clamped, 52 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:dominance | 1.6062 | -0.894 | replanned |  | yes |  |  |
| 2 | strength:army | 0.2837 | +0.284 | replanned |  |  |  |  |
| 3 | housing:leadership | 0.1792 | +0.396 | replanned |  |  |  |  |
| 4 | strength:guardsmen | 0.1738 | +0.174 | replanned |  |  |  |  |
| 5 | strength:monster | 0.1099 | +0.110 | replanned |  |  |  |  |
| 6 | health:specialist | 0.1075 | +0.126 | replanned |  |  |  |  |
| 7 | strength:flying | 0.1021 | +0.102 | replanned |  |  |  |  |
| 8 | strength:dragon | 0.0597 | +0.060 | replanned |  |  |  |  |
| 9 | strength:giant | 0.0424 | +0.042 | replanned |  |  |  |  |
| 10 | strength:beast | 0.0040 | +0.004 | replanned |  |  |  |  |
| 11 | strength:elemental | 0.0039 | +0.004 | replanned |  |  |  |  |
| 12 | health:melee | 0.0000 | — | no gain | yes | yes | yes | yes |
| 13 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 14 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 15 | health:flying | 0.0000 | — | no gain |  | yes | yes | yes |
| 16 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 17 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:monster | 0.0000 | — | no gain |  | yes | yes | yes |
| 19 | health:army | 0.0000 | — | no gain | yes | yes | yes | yes |
| 20 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 21 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 22 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 23 | health:giant | 0.0000 | — | no gain |  | yes | yes | yes |
| 24 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 25 | strength:ranged | 0.0000 | — | no gain |  |  | yes | yes |
| 26 | strength:mounted | 0.0000 | — | no gain | yes |  | yes | yes |
| 27 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 28 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:authority | 0.0000 | — | no gain |  |  |  |  |

## his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

Baseline bar: sweet-spot · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 9,542 ms wall, 13,827 ms CPU. Over all 58 probe × stop readings: 3 noise, 14 reorder, 9 worse, 11 clamped, 32 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | strength:army | 0.3340 | +0.334 | replanned |  |  |  |  |
| 2 | strength:monster | 0.2130 | +0.213 | replanned |  |  |  |  |
| 3 | strength:flying | 0.1271 | +0.127 | replanned |  |  |  |  |
| 4 | housing:leadership | 0.1219 | +0.336 | replanned |  |  |  |  |
| 5 | strength:guardsmen | 0.1209 | +0.121 | replanned |  |  |  |  |
| 6 | strength:mounted | 0.0895 | +0.089 | replanned |  |  |  |  |
| 7 | strength:ranged | 0.0831 | +0.078 | replanned |  |  |  |  |
| 8 | strength:dragon | 0.0641 | +0.064 | replanned |  |  |  |  |
| 9 | strength:giant | 0.0630 | +0.063 | replanned |  |  |  |  |
| 10 | strength:elemental | 0.0433 | +0.043 | replanned |  |  |  |  |
| 11 | strength:beast | 0.0426 | +0.043 | replanned |  |  |  |  |
| 12 | health:guardsmen | 0.0138 | +0.024 | replanned |  | yes |  |  |
| 13 | strength:melee | 0.0117 | +0.012 | replanned |  |  |  |  |
| 14 | health:melee | 0.0028 | +0.008 | replanned |  | yes |  |  |
| 15 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 16 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 17 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:specialist | 0.0000 | — | no gain |  |  |  |  |
| 19 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 20 | health:monster | 0.0000 | — | no gain |  | yes | yes | yes |
| 21 | health:army | 0.0000 | — | no gain |  | yes | yes | yes |
| 22 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 23 | health:elemental | 0.0000 | — | no gain |  | yes | yes | yes |
| 24 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 25 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## first-run army, Bear V ×1 (20 000 leadership)

Baseline bar: sweet-spot. 29 of 29 probes read, 0 cut, 0 failed. Pass: 224 ms wall, 415 ms CPU. Over all 29 probe × stop readings: 0 noise, 4 reorder, 7 worse, 7 clamped, 22 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.7279 | +0.953 | replanned |  |  |  |  |
| 2 | strength:army | 0.4945 | +0.495 | replanned |  |  |  |  |
| 3 | strength:guardsmen | 0.4805 | +0.480 | replanned |  |  |  |  |
| 4 | health:specialist | 0.1864 | +0.204 | replanned |  |  |  |  |
| 5 | health:army | 0.0787 | +0.092 | replanned |  |  |  |  |
| 6 | strength:monster | 0.0140 | +0.014 | replanned |  |  |  |  |
| 7 | strength:beast | 0.0140 | +0.014 | replanned |  |  |  |  |
| 8 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 13 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 20 | strength:ranged | 0.0000 | — | no gain |  |  | yes | yes |
| 21 | strength:mounted | 0.0000 | — | no gain |  |  | yes | yes |
| 22 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## first-run army, Bear V ×2 (20 000 leadership)

Baseline bar: sweet-spot. 29 of 29 probes read, 0 cut, 0 failed. Pass: 526 ms wall, 608 ms CPU. Over all 29 probe × stop readings: 0 noise, 4 reorder, 7 worse, 7 clamped, 22 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.7057 | +0.930 | replanned |  |  |  |  |
| 2 | strength:army | 0.4967 | +0.497 | replanned |  |  |  |  |
| 3 | strength:guardsmen | 0.4693 | +0.469 | replanned |  |  |  |  |
| 4 | health:specialist | 0.1816 | +0.199 | replanned |  |  |  |  |
| 5 | health:army | 0.0766 | +0.090 | replanned |  |  |  |  |
| 6 | strength:monster | 0.0274 | +0.027 | replanned |  |  |  |  |
| 7 | strength:beast | 0.0274 | +0.027 | replanned |  |  |  |  |
| 8 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 13 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 20 | strength:ranged | 0.0000 | — | no gain |  |  | yes | yes |
| 21 | strength:mounted | 0.0000 | — | no gain |  |  | yes | yes |
| 22 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## first-run army, Bear V ×3 (20 000 leadership)

Baseline bar: sweet-spot · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 322 ms wall, 365 ms CPU. Over all 58 probe × stop readings: 2 noise, 8 reorder, 15 worse, 14 clamped, 45 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.6846 | +0.909 | replanned |  |  |  |  |
| 2 | strength:army | 0.4988 | +0.499 | replanned |  |  |  |  |
| 3 | strength:guardsmen | 0.4586 | +0.459 | replanned |  |  |  |  |
| 4 | health:specialist | 0.1771 | +0.195 | replanned |  |  |  |  |
| 5 | health:army | 0.0745 | +0.088 | replanned |  |  |  |  |
| 6 | strength:monster | 0.0402 | +0.040 | replanned |  |  |  |  |
| 7 | strength:beast | 0.0402 | +0.040 | replanned |  |  |  |  |
| 8 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 13 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 20 | strength:ranged | 0.0000 | — | no gain |  |  | yes | yes |
| 21 | strength:mounted | 0.0000 | — | no gain |  |  | yes | yes |
| 22 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## first-run army, Bear V ×10 (20 000 leadership)

Baseline bar: sweet-spot · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 675 ms wall, 868 ms CPU. Over all 58 probe × stop readings: 4 noise, 8 reorder, 13 worse, 11 clamped, 43 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.6264 | +0.851 | replanned |  |  |  |  |
| 2 | strength:army | 0.5045 | +0.504 | replanned |  |  |  |  |
| 3 | strength:guardsmen | 0.4293 | +0.429 | replanned |  |  |  |  |
| 4 | health:specialist | 0.1646 | +0.182 | replanned |  |  |  |  |
| 5 | strength:monster | 0.0752 | +0.075 | replanned |  |  |  |  |
| 6 | strength:beast | 0.0752 | +0.075 | replanned |  |  |  |  |
| 7 | health:army | 0.0689 | +0.082 | replanned |  |  |  |  |
| 8 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 13 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 20 | strength:ranged | 0.0000 | — | no gain |  |  | yes | yes |
| 21 | strength:mounted | 0.0000 | — | no gain |  |  | yes | yes |
| 22 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

Baseline bar: burn-saver · sweet-spot · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 1,653 ms wall, 2,208 ms CPU. Over all 116 probe × stop readings: 0 noise, 17 reorder, 25 worse, 25 clamped, 93 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | housing:leadership | 0.3992 | +0.624 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.3656 | +0.366 | replanned |  |  |  |  |
| 3 | strength:army | 0.3656 | +0.366 | replanned |  |  |  |  |
| 4 | health:specialist | 0.1160 | +0.134 | replanned |  |  |  |  |
| 5 | health:army | 0.0470 | +0.060 | replanned |  |  |  |  |
| 6 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 7 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 8 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 9 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 10 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 12 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 17 | strength:melee | 0.0000 | — | no gain |  |  | yes | yes |
| 18 | strength:ranged | 0.0000 | — | no gain |  |  | yes | yes |
| 19 | strength:mounted | 0.0000 | — | no gain |  |  | yes | yes |
| 20 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 27 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

Baseline bar: burn-saver · sweet-spot · more-mercs · steady-max · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 17,645 ms wall, 25,981 ms CPU. Over all 145 probe × stop readings: 41 noise, 51 reorder, 72 worse, 60 clamped, 100 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | strength:army | 0.3107 | +0.311 | repriced | yes |  | yes |  |
| 2 | strength:monster | 0.1979 | +0.198 | repriced | yes |  | yes |  |
| 3 | housing:dominance | 0.1882 | +0.188 | replanned |  | yes |  |  |
| 4 | strength:guardsmen | 0.1129 | +0.113 | replanned |  |  |  |  |
| 5 | strength:flying | 0.0520 | +0.052 | replanned |  |  |  |  |
| 6 | strength:beast | 0.0492 | +0.049 | repriced | yes |  | yes |  |
| 7 | health:specialist | 0.0250 | +0.040 | replanned |  |  |  |  |
| 8 | health:army | 0.0066 | +0.018 | replanned |  | yes |  |  |
| 9 | health:melee | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:ranged | 0.0000 | — | no gain |  | yes | yes | yes |
| 11 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 12 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 14 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 15 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:beast | 0.0000 | — | no gain | yes |  | yes |  |
| 17 | health:elemental | 0.0000 | — | no gain |  | yes |  |  |
| 18 | health:dragon | 0.0000 | — | no gain |  | yes | yes | yes |
| 19 | health:giant | 0.0000 | — | no gain |  | yes | yes | yes |
| 20 | strength:melee | 0.0000 | — | no gain | yes |  | yes | yes |
| 21 | strength:ranged | 0.0000 | — | no gain | yes |  | yes | yes |
| 22 | strength:mounted | 0.0000 | — | no gain |  |  | yes | yes |
| 23 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:elemental | 0.0000 | — | no gain | yes |  | yes | yes |
| 26 | strength:dragon | 0.0000 | — | no gain |  |  | yes | yes |
| 27 | strength:giant | 0.0000 | — | no gain |  |  | yes | yes |
| 28 | housing:leadership | 0.0000 | — | no gain | yes |  | yes |  |
| 29 | housing:authority | 0.0000 | — | no gain |  |  |  |  |

## first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

Baseline bar: silver-saver · sweet-spot · more-mercs · steady-max · all-in. 0 of 29 probes read, 29 cut (clock 20000 ms), 0 failed. Pass: 62,722 ms wall, 63,087 ms CPU. Over all 0 probe × stop readings: 0 noise, 0 reorder, 0 worse, 0 clamped, 0 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

Baseline bar: silver-saver · sweet-spot · all-in. 29 of 29 probes read, 0 cut, 0 failed. Pass: 3,155 ms wall, 4,790 ms CPU. Over all 87 probe × stop readings: 7 noise, 15 reorder, 16 worse, 11 clamped, 64 with no gain.

| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |
|---|---|---|---|---|---|---|---|---|
| 1 | strength:ranged | 0.4309 | -4.857 | replanned |  |  |  |  |
| 2 | strength:guardsmen | 0.2711 | +0.271 | repriced | yes |  | yes |  |
| 3 | strength:army | 0.2711 | +0.271 | repriced | yes |  | yes |  |
| 4 | strength:mounted | 0.1218 | +0.122 | repriced | yes |  | yes |  |
| 5 | strength:melee | 0.0447 | +0.045 | replanned |  |  |  |  |
| 6 | health:specialist | 0.0251 | +0.029 | replanned |  |  |  |  |
| 7 | health:melee | 0.0243 | +0.032 | replanned |  |  |  |  |
| 8 | health:ranged | 0.0000 | — | no gain | yes | yes | yes | yes |
| 9 | health:mounted | 0.0000 | — | no gain |  | yes | yes | yes |
| 10 | health:flying | 0.0000 | — | no gain |  |  |  |  |
| 11 | health:guardsmen | 0.0000 | — | no gain |  | yes | yes | yes |
| 12 | health:engineers | 0.0000 | — | no gain |  |  |  |  |
| 13 | health:monster | 0.0000 | — | no gain |  |  |  |  |
| 14 | health:army | 0.0000 | — | no gain |  | yes | yes | yes |
| 15 | health:beast | 0.0000 | — | no gain |  |  |  |  |
| 16 | health:elemental | 0.0000 | — | no gain |  |  |  |  |
| 17 | health:dragon | 0.0000 | — | no gain |  |  |  |  |
| 18 | health:giant | 0.0000 | — | no gain |  |  |  |  |
| 19 | strength:flying | 0.0000 | — | no gain |  |  |  |  |
| 20 | strength:specialist | 0.0000 | — | no gain |  |  |  |  |
| 21 | strength:engineers | 0.0000 | — | no gain |  |  |  |  |
| 22 | strength:monster | 0.0000 | — | no gain |  |  |  |  |
| 23 | strength:beast | 0.0000 | — | no gain |  |  |  |  |
| 24 | strength:elemental | 0.0000 | — | no gain |  |  |  |  |
| 25 | strength:dragon | 0.0000 | — | no gain |  |  |  |  |
| 26 | strength:giant | 0.0000 | — | no gain |  |  |  |  |
| 27 | housing:leadership | 0.0000 | — | no gain | yes |  | yes |  |
| 28 | housing:authority | 0.0000 | — | no gain |  |  |  |  |
| 29 | housing:dominance | 0.0000 | — | no gain |  |  |  |  |

