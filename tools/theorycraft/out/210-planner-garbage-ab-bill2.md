# 210 — the planner garbage A/B: bill2

W22 step 4. 2026-10-11, node v22.22.1: `planCampaign` alone on `pyrrhic-my-account-2026-10-11.json`, 60 rounds per arm, interleaved, release kernel; old = `plan.old.ts`.

| arm | median CPU ms | median wall ms | median GC ms | median GC pauses |
|---|---:|---:|---:|---:|
| new | 485.4 | 245.9 (q1 212.0) | 28.7 | 11.0 |
| old | 382.9 | 235.5 (q1 214.0) | 27.9 | 11.0 |

Median gain: CPU **-26.8 %**, wall -4.4 % (first quartile 0.9 %), GC time -3.0 %, GC pauses 0.0 %.
