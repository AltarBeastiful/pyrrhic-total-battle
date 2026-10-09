---
type: experiment
title: "194 — the other questions"
created: 2026-10-09
tags: [w17, advisor, sweeps]
related: ["[[Progression-Advisor-Plan]]", "[[advisor-step-d]]", "[[191-what-a-percent-is-worth]]"]
---

# 194 — the other questions

Design: `docs/plans/advisor-step-d.md`; plan: `docs/plans/progression-advisor.md` §5. The five questions of step D (`src/engine/advisor-sweeps.ts`) run through `runAdvisor` over 19 benchmark armies on one lane in Node, no clock in any job (the 20 000-dominance camp runs under the 20 s clock). A question's cost is its pass's wall ms net of the baseline plan the pass also runs; "(read/asked)" is the probes read of those asked. "Together" is the generic 29 probes plus the five questions, against `CAMPAIGN.budgets.extra` = 20000 ms. Next-tier unlocks are built here from the data tables (the units one tier above what each kind and group fields); the app has no such derivation yet.

## Cost

Mean net wall ms per army, over the armies where the question applies: dominance and leadership sweep 1,976 (19 armies), next tier 374 (19), merc stock 619 (19), horizon 368 (19), silver 254 (19); the generic 29 probes 9,194. Armies where generic + all five exceed the budget on one lane: **2 of 19**.

| army | generic 29 ms | sweep ms | next tier ms | merc stock ms | horizon ms | silver ms | together |
|---|---|---|---|---|---|---|---|
| 2026-09-17 export, its setup (7 000 leadership) | 12,058 | 3,786 (10/10) | 0 (1/1) | 686 (3/3) | 502 (2/2) | 187 (1/1) | 17.2 s |
| 2026-09-17 export, 12 000 leadership | 12,349 | 4,109 (10/10) | 326 (1/1) | 1,452 (3/3) | 889 (2/2) | 754 (1/1) | 19.9 s |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 6,817 | 2,312 (10/10) | 55 (1/1) | 777 (3/3) | 485 (2/2) | 258 (1/1) | 10.7 s |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 12,149 | 3,938 (10/10) | 116 (1/1) | 1,199 (3/3) | 704 (2/2) | 230 (1/1) | 18.3 s |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 3,475 | 1,113 (10/10) | 261 (2/2) | 449 (3/3) | 194 (2/2) | 97 (1/1) | 5.6 s |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 8,267 | 2,615 (10/10) | 335 (1/1) | 871 (3/3) | 492 (2/2) | 296 (1/1) | 12.9 s |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 3,862 | 1,239 (10/10) | 82 (1/1) | 409 (3/3) | 237 (2/2) | 134 (1/1) | 6.0 s |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 3,455 | 1,088 (10/10) | 98 (1/1) | 324 (3/3) | 217 (2/2) | 54 (1/1) | 5.2 s |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 6,584 | 2,577 (10/10) | 1,222 (3/3) | 624 (3/3) | 444 (2/2) | 351 (1/1) | 11.8 s |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 7,778 | 2,765 (10/10) | 942 (3/3) | 1,139 (3/3) | 582 (2/2) | 488 (1/1) | 13.7 s |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 9,888 | 3,442 (10/10) | 718 (2/2) | 1,026 (3/3) | 644 (2/2) | 472 (1/1) | 16.2 s |
| first-run army, Bear V ×1 (20 000 leadership) | 227 | 58 (10/10) | 34 (2/2) | 83 (3/3) | 9 (2/2) | 3 (1/1) | 0.4 s |
| first-run army, Bear V ×2 (20 000 leadership) | 537 | 179 (10/10) | 46 (2/2) | 71 (3/3) | 18 (2/2) | 9 (1/1) | 0.9 s |
| first-run army, Bear V ×3 (20 000 leadership) | 381 | 115 (10/10) | 50 (2/2) | 81 (3/3) | 38 (2/2) | 9 (1/1) | 0.7 s |
| first-run army, Bear V ×10 (20 000 leadership) | 762 | 230 (10/10) | 53 (2/2) | 105 (3/3) | 45 (2/2) | 25 (1/1) | 1.2 s |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 1,870 | 621 (10/10) | 143 (2/2) | 199 (3/3) | 102 (2/2) | 69 (1/1) | 3.0 s |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 18,519 | 6,238 (10/10) | 2,351 (3/3) | 1,667 (3/3) | 1,266 (2/2) | 963 (1/1) | 31.0 s over |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 62,590 | 0 (0/10, 10 cut) | 0 (0/3, 3 cut) | 0 (0/3, 3 cut) | 0 (0/2, 2 cut) | 0 (0/1, 1 cut) | 62.6 s over |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3,107 | 1,116 (10/10) | 266 (2/2) | 591 (3/3) | 118 (2/2) | 426 (1/1) | 5.6 s |

## Reading (measured figures only)

Written by hand from this run's figures; a re-run of the script rewrites the rest of this file, not this section. The run has 19 armies (the 18 benchmark armies plus the 4 000-leadership case of 2026-09-15 that the common scenarios carry).

**Cost, one lane in Node.** Mean net wall per army: dominance + leadership sweep 1 976 ms (10 plans), next tier 374 ms, merc stock 619 ms, horizon 368 ms, silver 254 ms, against 9 194 ms for the 29 generic probes. All five together are about 3.6 s on average; generic + all five exceed the 20 s budget on **2 of 19** armies: experiment 110's camp (31.0 s) and the 20 000-dominance camp (62.6 s, where every probe was cut, as already so for the generic pass). The 7 000-leadership export is 17.2 s and the 12 000 one 19.9 s: under the budget on one lane, with no margin, so on a phone or one lane the five do not ride the generic button. The 16-core pool (experiment 190) takes about x2 to x4 off. **Verdict: the five questions get their own button** (as C5 did), the sweep being the dear one (about 0.2 x the generic pass).

**Sweep.** Dominance gives a gain on only 2 to 3 armies per step (max +8.5 % at +32 %); on 17 of 19 armies its peak is "+0 %" (no gain at any step). Leadership gives a gain on 11 to 14 armies per step (max +54.2 % at +16 %); 6 armies are still climbing at +32 %, and 9 of the curves are flagged not monotone (search noise), which the running-maximum peak absorbs.

**Next tier.** Gains on 18 of 19 guardsmen tier 4 probes (max +142.4 %), 8 of 10 specialist tier 2, and the monster tiers (max +48.1 %). The unlocks are derived in this script from the data tables; the app has no such derivation yet (open for the UI task).

**Merc stock.** A gain on only 4 to 5 of 19 armies (max +44.8 %, the same on the three steps, so the first step already clears the binding cap there).

**Horizon.** 3 marches gains on 3 armies (max +44.8 %), 5 marches on 2 (max +0.146 %). The campaign length is still not carried by `ProbeAnswer` (the open item of the sweeps task).

**Silver.** Every army has no silver budget set, so each probe is the minus side only (as the design note states): a gain-side reading exists on 1 army (+5.4 %), the others read no gain, i.e. silver is not binding for them.

## 2026-09-17 export, its setup (7 000 leadership)

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max · all-in; baseline pass 718 ms wall. The 29 generic probes: 12,058 ms wall, 16,441 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +0.795 % | replanned |  |  |
| Leadership +4 % | +1.539 % | replanned |  |  |
| Leadership +8 % | +9.256 % | replanned |  |  |
| Leadership +16 % | +54.243 % | replanned |  |  |
| Leadership +32 % | +18.687 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +16 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +142.437 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (44 merc) | +44.824 % | replanned |  |  |
| Merc stock +25 % (70 merc) | +44.824 % | replanned |  |  |
| Merc stock +50 % (127 merc) | +44.824 % | replanned |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | +44.824 % | replanned |  |  |
| 5 marches | +0.044 % | replanned |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −1089000 | no gain | — | yes | yes |

## 2026-09-17 export, 12 000 leadership

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max; baseline pass 408 ms wall. The 29 generic probes: 12,349 ms wall, 17,193 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +0.996 % | replanned |  |  |
| Leadership +4 % | +2.005 % | replanned |  |  |
| Leadership +8 % | no gain | — | yes | yes |
| Leadership +16 % | no gain | — | yes | yes |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +4 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +24.827 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (44 merc) | no gain | — | yes | yes |
| Merc stock +25 % (70 merc) | no gain | — | yes | yes |
| Merc stock +50 % (127 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — | yes | yes |
| 5 marches | no gain | — | yes | yes |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −1879320 | no gain | — | yes | yes |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

Baseline bar: silver-saver · sweet-spot · steady-max · all-in; baseline pass 238 ms wall. The 29 generic probes: 6,817 ms wall, 7,311 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +1.464 % | replanned |  |  |
| Leadership +4 % | +2.965 % | replanned |  |  |
| Leadership +8 % | +5.685 % | replanned |  |  |
| Leadership +16 % | +11.569 % | replanned |  |  |
| Leadership +32 % | +23.040 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): still climbing at +32 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +100.096 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — | yes | yes |
| Merc stock +25 % (21 merc) | no gain | — | yes | yes |
| Merc stock +50 % (42 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — | yes | yes |
| 5 marches | +0.146 % | replanned |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3079880 | +-12.754 % | replanned |  |  |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max · all-in; baseline pass 481 ms wall. The 29 generic probes: 12,149 ms wall, 15,146 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | no gain | — | yes | yes |
| Leadership +4 % | +4.029 % | replanned |  |  |
| Leadership +8 % | +5.855 % | replanned |  |  |
| Leadership +16 % | +13.725 % | replanned |  |  |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +58.113 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (30 merc) | no gain | — | yes | yes |
| Merc stock +25 % (46 merc) | +31.381 % | replanned |  |  |
| Merc stock +50 % (82 merc) | +35.400 % | replanned |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | +6.328 % | replanned |  |  |
| 5 marches | no gain | — | yes | yes |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −1697280 | +5.406 % | replanned |  |  |

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

Baseline bar: burn-saver · sweet-spot · steady-max · all-in; baseline pass 151 ms wall. The 29 generic probes: 3,475 ms wall, 5,931 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | no gain | — | yes | yes |
| Leadership +4 % | +3.268 % | replanned |  |  |
| Leadership +8 % | +6.558 % | replanned |  |  |
| Leadership +16 % | +13.070 % | replanned |  |  |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +85.582 % | replanned |  |  |
| Train troop specialist tier 2 | no gain | — |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (30 merc) | +5.486 % | replanned |  |  |
| Merc stock +25 % (46 merc) | no gain | — | yes | yes |
| Merc stock +50 % (82 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −779480 | no gain | — |  |  |

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

Baseline bar: burn-saver · silver-saver · sweet-spot · more-mercs · steady-max; baseline pass 284 ms wall. The 29 generic probes: 8,267 ms wall, 13,147 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | no gain | — | yes | yes |
| Leadership +4 % | +2.940 % | replanned |  |  |
| Leadership +8 % | no gain | — | yes | yes |
| Leadership +16 % | +2.491 % | replanned |  |  |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +94.206 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (149 merc) | no gain | — |  |  |
| Merc stock +25 % (372 merc) | no gain | — |  |  |
| Merc stock +50 % (744 merc) | no gain | — |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −1054200 | no gain | — |  |  |

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

Baseline bar: burn-saver · silver-saver · sweet-spot · more-mercs · steady-max; baseline pass 132 ms wall. The 29 generic probes: 3,862 ms wall, 4,444 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +0.948 % | replanned |  |  |
| Leadership +4 % | +1.686 % | replanned |  |  |
| Leadership +8 % | +3.762 % | replanned |  |  |
| Leadership +16 % | no gain | — | yes | yes |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +8 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +130.039 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (45 merc) | +0.000 % | replanned |  |  |
| Merc stock +25 % (113 merc) | no gain | — |  |  |
| Merc stock +50 % (225 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | +0.000 % | replanned |  |  |
| 5 marches | no gain | — | yes | yes |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −907200 | no gain | — |  |  |

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

Baseline bar: burn-saver · silver-saver · sweet-spot · steady-max · all-in; baseline pass 113 ms wall. The 29 generic probes: 3,455 ms wall, 4,262 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | no gain | — | yes | yes |
| Leadership +4 % | no gain | — | yes | yes |
| Leadership +8 % | no gain | — | yes | yes |
| Leadership +16 % | +-22.222 % | replanned |  |  |
| Leadership +32 % | +13.475 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +73.686 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (12 merc) | no gain | — |  |  |
| Merc stock +25 % (30 merc) | no gain | — | yes | yes |
| Merc stock +50 % (60 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −928600 | no gain | — | yes | yes |

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

Baseline bar: silver-saver · sweet-spot · steady-max; baseline pass 199 ms wall. The 29 generic probes: 6,584 ms wall, 11,598 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  | yes |
| Dominance +4 % | +-8.687 % | replanned |  |  |
| Dominance +8 % | +-9.459 % | replanned |  |  |
| Dominance +16 % | +-7.230 % | replanned |  |  |
| Dominance +32 % | +7.550 % | repriced | yes |  |
| Leadership +2 % | +1.559 % | replanned |  |  |
| Leadership +4 % | +-8.908 % | replanned |  |  |
| Leadership +8 % | +2.147 % | replanned |  |  |
| Leadership +16 % | +-3.099 % | replanned |  |  |
| Leadership +32 % | +15.242 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +2 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +84.458 % | replanned |  |  |
| Train troop specialist tier 2 | +-0.076 % | replanned |  |  |
| Train monster monster tier 4 | +5.068 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — |  |  |
| Merc stock +25 % (20 merc) | no gain | — |  |  |
| Merc stock +50 % (40 merc) | no gain | — |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | +-15.651 % | replanned |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −846040 | no gain | — |  |  |

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

Baseline bar: burn-saver · sweet-spot · steady-max; baseline pass 219 ms wall. The 29 generic probes: 7,778 ms wall, 11,895 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | +0.473 % | repriced | yes | yes |
| Dominance +4 % | +1.468 % | replanned |  |  |
| Dominance +8 % | +1.420 % | replanned |  |  |
| Dominance +16 % | +4.171 % | replanned |  |  |
| Dominance +32 % | +8.516 % | replanned |  |  |
| Leadership +2 % | +0.745 % | replanned |  |  |
| Leadership +4 % | no gain | — | yes | yes |
| Leadership +8 % | +-11.482 % | replanned |  |  |
| Leadership +16 % | no gain | — | yes | yes |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +4 %; not monotone (flagged).

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +2 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +44.237 % | replanned |  |  |
| Train troop specialist tier 2 | +4.051 % | replanned |  |  |
| Train monster monster tier 4 | +29.542 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — | yes | yes |
| Merc stock +25 % (23 merc) | no gain | — | yes | yes |
| Merc stock +50 % (45 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — | yes | yes |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −812640 | no gain | — | yes | yes |

## his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

Baseline bar: sweet-spot · all-in; baseline pass 334 ms wall. The 29 generic probes: 9,888 ms wall, 13,985 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | no gain | — | yes | yes |
| Leadership +4 % | +4.122 % | replanned |  |  |
| Leadership +8 % | +6.035 % | replanned |  |  |
| Leadership +16 % | +8.976 % | replanned |  |  |
| Leadership +32 % | +13.976 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +48.562 % | replanned |  |  |
| Train monster monster tier 4 | +48.096 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — | yes | yes |
| Merc stock +25 % (10 merc) | no gain | — | yes | yes |
| Merc stock +50 % (10 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — | yes | yes |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −948000 | no gain | — |  |  |

## first-run army, Bear V ×1 (20 000 leadership)

Baseline bar: sweet-spot; baseline pass 10 ms wall. The 29 generic probes: 227 ms wall, 397 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +1.954 % | replanned |  |  |
| Leadership +4 % | +3.873 % | replanned |  |  |
| Leadership +8 % | +7.808 % | replanned |  |  |
| Leadership +16 % | +15.662 % | replanned |  |  |
| Leadership +32 % | +31.191 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): still climbing at +32 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +71.735 % | replanned |  |  |
| Train troop specialist tier 2 | +8.338 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | +11.926 % | replanned |  |  |
| Merc stock +25 % (10 merc) | +11.926 % | replanned |  |  |
| Merc stock +50 % (10 merc) | +11.926 % | replanned |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3252560 | no gain | — |  |  |

## first-run army, Bear V ×2 (20 000 leadership)

Baseline bar: sweet-spot; baseline pass 27 ms wall. The 29 generic probes: 537 ms wall, 598 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +1.908 % | replanned |  |  |
| Leadership +4 % | +3.783 % | replanned |  |  |
| Leadership +8 % | +7.626 % | replanned |  |  |
| Leadership +16 % | +15.297 % | replanned |  |  |
| Leadership +32 % | +30.464 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): still climbing at +32 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +111.958 % | replanned |  |  |
| Train troop specialist tier 2 | +8.144 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — | yes | yes |
| Merc stock +25 % (10 merc) | no gain | — | yes | yes |
| Merc stock +50 % (10 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3252560 | no gain | — |  |  |

## first-run army, Bear V ×3 (20 000 leadership)

Baseline bar: sweet-spot · all-in; baseline pass 13 ms wall. The 29 generic probes: 381 ms wall, 577 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +1.865 % | replanned |  |  |
| Leadership +4 % | +3.696 % | replanned |  |  |
| Leadership +8 % | +7.452 % | replanned |  |  |
| Leadership +16 % | +14.949 % | replanned |  |  |
| Leadership +32 % | +29.771 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): still climbing at +32 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +69.987 % | replanned |  |  |
| Train troop specialist tier 2 | +7.958 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — |  | yes |
| Merc stock +25 % (10 merc) | no gain | — |  | yes |
| Merc stock +50 % (10 merc) | no gain | — |  | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | +-2.277 % | replanned |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3252560 | no gain | — |  |  |

## first-run army, Bear V ×10 (20 000 leadership)

Baseline bar: sweet-spot · all-in; baseline pass 26 ms wall. The 29 generic probes: 762 ms wall, 851 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +1.746 % | replanned |  |  |
| Leadership +4 % | +5.591 % | replanned |  |  |
| Leadership +8 % | +9.107 % | replanned |  |  |
| Leadership +16 % | +16.124 % | replanned |  |  |
| Leadership +32 % | +32.129 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): still climbing at +32 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +98.489 % | replanned |  |  |
| Train troop specialist tier 2 | +7.449 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — | yes | yes |
| Merc stock +25 % (10 merc) | no gain | — | yes | yes |
| Merc stock +50 % (10 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3252560 | no gain | — |  |  |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

Baseline bar: burn-saver · sweet-spot · steady-max · all-in; baseline pass 57 ms wall. The 29 generic probes: 1,870 ms wall, 2,643 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +1.280 % | replanned |  |  |
| Leadership +4 % | +2.536 % | replanned |  |  |
| Leadership +8 % | +5.114 % | replanned |  |  |
| Leadership +16 % | +10.257 % | replanned |  |  |
| Leadership +32 % | +20.428 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): still climbing at +32 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +48.771 % | replanned |  |  |
| Train troop specialist tier 2 | +5.460 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (10 merc) | no gain | — | yes | yes |
| Merc stock +25 % (21 merc) | no gain | — | yes | yes |
| Merc stock +50 % (42 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — | yes | yes |
| 5 marches | no gain | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3252560 | +-24.046 % | replanned |  |  |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

Baseline bar: burn-saver · sweet-spot · more-mercs · steady-max · all-in; baseline pass 576 ms wall. The 29 generic probes: 18,519 ms wall, 26,509 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | +0.376 % | replanned |  |  |
| Dominance +4 % | +4.659 % | repriced | yes |  |
| Dominance +8 % | +5.466 % | repriced | yes | yes |
| Dominance +16 % | +5.466 % | repriced | yes | yes |
| Dominance +32 % | +5.466 % | repriced | yes | yes |
| Leadership +2 % | no gain | — | yes | yes |
| Leadership +4 % | no gain | — | yes | yes |
| Leadership +8 % | no gain | — | yes | yes |
| Leadership +16 % | no gain | — | yes | yes |
| Leadership +32 % | no gain | — | yes | yes |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +8 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +34.972 % | replanned |  |  |
| Train troop specialist tier 2 | +14.685 % | replanned |  |  |
| Train monster monster tier 6 | +47.999 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (20 merc) | no gain | — | yes | yes |
| Merc stock +25 % (31 merc) | no gain | — | yes | yes |
| Merc stock +50 % (52 merc) | no gain | — | yes | yes |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — |  |  |
| 5 marches | no gain | — | yes | yes |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −3515680 | no gain | — | yes | yes |

## first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

Baseline bar: silver-saver · sweet-spot · more-mercs · steady-max · all-in; baseline pass 81,415 ms wall. The 29 generic probes: 62,590 ms wall, 63,062 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | cut | — |  |  |
| Dominance +4 % | cut | — |  |  |
| Dominance +8 % | cut | — |  |  |
| Dominance +16 % | cut | — |  |  |
| Dominance +32 % | cut | — |  |  |
| Leadership +2 % | cut | — |  |  |
| Leadership +4 % | cut | — |  |  |
| Leadership +8 % | cut | — |  |  |
| Leadership +16 % | cut | — |  |  |
| Leadership +32 % | cut | — |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | cut | — |  |  |
| Train troop specialist tier 2 | cut | — |  |  |
| Train monster monster tier 8 | cut | — |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (20 merc) | cut | — |  |  |
| Merc stock +25 % (31 merc) | cut | — |  |  |
| Merc stock +50 % (52 merc) | cut | — |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | cut | — |  |  |
| 5 marches | cut | — |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −8813200 | cut | — |  |  |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

Baseline bar: silver-saver · sweet-spot · all-in; baseline pass 133 ms wall. The 29 generic probes: 3,107 ms wall, 3,830 ms CPU.

### sweep

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Dominance +2 % | no gain | — |  |  |
| Dominance +4 % | no gain | — |  |  |
| Dominance +8 % | no gain | — |  |  |
| Dominance +16 % | no gain | — |  |  |
| Dominance +32 % | no gain | — |  |  |
| Leadership +2 % | +0.629 % | replanned |  |  |
| Leadership +4 % | +5.249 % | replanned |  |  |
| Leadership +8 % | +6.005 % | replanned |  |  |
| Leadership +16 % | +4.815 % | replanned |  |  |
| Leadership +32 % | +16.381 % | replanned |  |  |

Peak of the dominance sweep (flatten below 0.05 per pool-percent): +0 %; monotone.

Peak of the leadership sweep (flatten below 0.05 per pool-percent): +8 %; not monotone (flagged).

### tier

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Train troop guardsmen tier 4 | +51.407 % | replanned |  |  |
| Train troop specialist tier 2 | +9.887 % | replanned |  |  |

### merc

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Merc stock +10 % (40 merc) | +27.702 % | replanned |  |  |
| Merc stock +25 % (40 merc) | +27.702 % | replanned |  |  |
| Merc stock +50 % (40 merc) | +27.702 % | replanned |  |  |

### horizon

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| 3 marches | no gain | — | yes | yes |
| 5 marches | +-3.908 % | replanned |  |  |

### silver

| probe | headline gain on the sweet spot | read from | noise | worse |
|---|---|---|---|---|
| Silver −608720 | no gain | — | yes | yes |

