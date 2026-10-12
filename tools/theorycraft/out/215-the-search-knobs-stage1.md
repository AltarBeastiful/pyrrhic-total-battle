# 215 — the search-knob census (stage 1 — the plan CPU)

Run 2026-10-12: `planCampaign` in-process, release kernel, no `budgetMs`, the probes' own settings, 3 heavy armies × 15 plans an arm, interleaved with the unrestricted arm (a warm-up first). `ms` are the per-army medians summed over the armies, with the per-army **min** in brackets. The plan's own share of the pool CPU is **≈ 45 %** (`docs/plans/next-speed.md`), so `% of pool CPU` is `% of the plan` × 0.45.

The armies: `owner-live pyrrhic-my-account-2026-10-11.json` · `first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)` · `first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)`.

| knob | restriction | plan CPU, unrestricted (median / min) | restricted (median / min) | CPU saved (median) | CPU saved (min) | % of pool CPU (min) | plan wall saved (min) | verdict |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `DEPTHS` | no high — `[1,2,3,4,5]` | 3,526.6 / 2,853.4 | 3,330.8 / 2,677.1 | 5.6 % | 6.2 % | **2.8 %** | 5.0 % | to stage 2 |
| `DEPTHS` | no low — `[4,5,6,7,8]` | 3,105.2 / 2,774.9 | 2,734.8 / 2,343.5 | 11.9 % | 15.5 % | **7.0 %** | 16.0 % | to stage 2 |
| `DEPTHS` | middle — `[3,4,5,6]` | 2,954.1 / 2,641.7 | 2,667.1 / 2,509.0 | 9.7 % | 5.0 % | **2.3 %** | 5.7 % | to stage 2 |
| `LADDER_GROWTHS` | every other — `[1,1.5,2.2,4,6]` | 3,146.6 / 2,701.3 | 2,962.6 / 2,617.6 | 5.8 % | 3.1 % | **1.4 %** | 4.8 % | **not worth it** |
| `SIZER_DEPTHS` | drop `msRelaxed` | 3,102.2 / 2,739.9 | 2,358.5 / 1,751.2 | 24.0 % | 36.1 % | **16.2 %** | 47.9 % | to stage 2 |
| `SIZER_DEPTHS` | drop `ms` | 3,108.0 / 2,738.7 | 2,894.2 / 2,507.9 | 6.9 % | 8.4 % | **3.8 %** | 7.6 % | to stage 2 |
| `SIZER_DEPTHS` | drop `elite` | 3,332.9 / 2,670.8 | 2,850.5 / 2,520.4 | 14.5 % | 5.6 % | **2.5 %** | 8.9 % | to stage 2 |
| `WINNER_RUNGS_DEPTH` | winner-rungs shape off | 3,373.5 / 2,761.0 | 3,191.5 / 2,773.2 | 5.4 % | -0.4 % | **-0.2 %** | -1.4 % | **not worth it** |
| `PLAN_LIMITS.climbRounds` | 32 → 16 | 3,250.1 / 2,741.2 | 2,945.5 / 2,289.3 | 9.4 % | 16.5 % | **7.4 %** | 20.0 % | to stage 2 |
| `PLAN_LIMITS.climbRounds` | 32 → 8 | 3,244.0 / 2,837.4 | 2,826.5 / 2,266.8 | 12.9 % | 20.1 % | **9.0 %** | 26.7 % | to stage 2 |
| `PLAN_LIMITS.climbSeeds` | 8 → 4 | 3,539.0 / 2,788.6 | 3,240.4 / 2,896.1 | 8.4 % | -3.9 % | **-1.7 %** | -1.9 % | **not worth it** |
| `PLAN_LIMITS.sweepRounds` | 16 → 8 | 3,125.2 / 2,711.7 | 3,129.5 / 2,668.2 | -0.1 % | 1.6 % | **0.7 %** | 0.1 % | **not worth it** |

## Per army

| restriction | army | CPU unc. | retr. | wall unc. | restr. |
|---|---|---:|---:|---:|---:|
| no high — `[1,2,3,4,5]` | owner-live pyrrhic-my-account-2026-10-11.json | 433.7 | 524.3 | 219.4 | 210.0 |
| no high — `[1,2,3,4,5]` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 963.1 | 929.5 | 469.8 | 453.1 |
| no high — `[1,2,3,4,5]` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 2,129.8 | 1,877.0 | 1,526.7 | 1,473.8 |
| no low — `[4,5,6,7,8]` | owner-live pyrrhic-my-account-2026-10-11.json | 386.5 | 340.4 | 205.5 | 166.0 |
| no low — `[4,5,6,7,8]` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 941.8 | 874.7 | 449.4 | 410.3 |
| no low — `[4,5,6,7,8]` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,776.9 | 1,519.7 | 1,464.5 | 1,222.8 |
| middle — `[3,4,5,6]` | owner-live pyrrhic-my-account-2026-10-11.json | 460.8 | 324.5 | 212.8 | 165.0 |
| middle — `[3,4,5,6]` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 746.2 | 585.0 | 424.8 | 359.2 |
| middle — `[3,4,5,6]` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,747.1 | 1,757.7 | 1,430.2 | 1,409.0 |
| every other — `[1,1.5,2.2,4,6]` | owner-live pyrrhic-my-account-2026-10-11.json | 424.1 | 361.6 | 205.6 | 180.4 |
| every other — `[1,1.5,2.2,4,6]` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 912.1 | 869.8 | 439.6 | 410.0 |
| every other — `[1,1.5,2.2,4,6]` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,810.3 | 1,731.3 | 1,428.7 | 1,372.5 |
| drop `msRelaxed` | owner-live pyrrhic-my-account-2026-10-11.json | 388.6 | 347.4 | 203.4 | 173.9 |
| drop `msRelaxed` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 932.6 | 843.7 | 445.4 | 388.6 |
| drop `msRelaxed` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,781.0 | 1,167.3 | 1,422.5 | 570.0 |
| drop `ms` | owner-live pyrrhic-my-account-2026-10-11.json | 400.7 | 358.0 | 201.0 | 182.3 |
| drop `ms` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 924.7 | 863.8 | 441.5 | 394.5 |
| drop `ms` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,782.7 | 1,672.3 | 1,425.0 | 1,332.3 |
| drop `elite` | owner-live pyrrhic-my-account-2026-10-11.json | 650.3 | 371.9 | 237.2 | 180.2 |
| drop `elite` | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 899.3 | 841.9 | 437.1 | 383.9 |
| drop `elite` | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,783.3 | 1,636.8 | 1,419.7 | 1,308.7 |
| winner-rungs shape off | owner-live pyrrhic-my-account-2026-10-11.json | 615.5 | 412.3 | 239.1 | 205.3 |
| winner-rungs shape off | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 926.1 | 906.7 | 441.6 | 439.4 |
| winner-rungs shape off | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,832.0 | 1,872.5 | 1,464.8 | 1,482.6 |
| 32 → 16 | owner-live pyrrhic-my-account-2026-10-11.json | 423.6 | 633.5 | 207.1 | 238.7 |
| 32 → 16 | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 939.4 | 859.9 | 453.3 | 384.5 |
| 32 → 16 | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,887.1 | 1,452.2 | 1,491.4 | 1,124.8 |
| 32 → 8 | owner-live pyrrhic-my-account-2026-10-11.json | 397.6 | 463.8 | 213.4 | 220.4 |
| 32 → 8 | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 964.2 | 829.9 | 459.5 | 355.7 |
| 32 → 8 | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,882.2 | 1,532.9 | 1,486.1 | 1,009.9 |
| 8 → 4 | owner-live pyrrhic-my-account-2026-10-11.json | 410.6 | 426.9 | 215.4 | 212.7 |
| 8 → 4 | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 950.7 | 963.3 | 455.5 | 459.9 |
| 8 → 4 | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 2,177.8 | 1,850.2 | 1,520.4 | 1,470.1 |
| 16 → 8 | owner-live pyrrhic-my-account-2026-10-11.json | 400.8 | 422.2 | 202.8 | 208.4 |
| 16 → 8 | first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 914.6 | 929.2 | 447.5 | 445.4 |
| 16 → 8 | first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,809.8 | 1,778.1 | 1,442.9 | 1,431.8 |

No arm refused an army.

## The advisor horizons (`CAMPAIGN.advisorSweep.horizons`)

`horizonProbes` emits one probe per horizon but the baseline (`CAMPAIGN.marches` = 4), so `[3,4,5]` is **2** full plans (3 and 5) and `[4]` is **0**. On `pyrrhic-my-account-2026-10-11.json` a marchTarget-4 plan is 381.2 ms CPU, marchTarget-3 588.6 ms, marchTarget-5 384.3 ms; restricting `[3,4,5]`→`[4]` removes **972.9 ms** of advisor CPU — 2 probes of the 15-median. It is inside the advisor's own share of the pool, not the plan's, and changes no plan stop.

