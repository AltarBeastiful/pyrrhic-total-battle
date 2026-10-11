# 210 — the planner garbage A/B: bill

W22 step 4. 2026-10-11, node v22.22.1: `planCampaign` alone on `pyrrhic-my-account-2026-10-11.json`, 60 rounds per arm, interleaved, release kernel; old = `plan.old.ts`.

| arm | median CPU ms | median wall ms | median GC ms | median GC pauses |
|---|---:|---:|---:|---:|
| new | 450.6 | 231.0 (q1 211.3) | 28.2 | 11.0 |
| old | 462.4 | 251.2 (q1 217.1) | 28.2 | 11.0 |

Median gain: CPU **2.6 %**, wall 8.1 % (first quartile 2.7 %), GC time -0.0 %, GC pauses 0.0 %.
