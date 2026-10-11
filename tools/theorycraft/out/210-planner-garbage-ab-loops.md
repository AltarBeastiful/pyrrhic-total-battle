# 210 — the planner garbage A/B: loops

W22 step 4. 2026-10-11, node v22.22.1: `planCampaign` alone on `pyrrhic-my-account-2026-10-11.json`, 60 rounds per arm, interleaved, release kernel; old = `plan.old.ts`.

| arm | median CPU ms | median wall ms | median GC ms | median GC pauses |
|---|---:|---:|---:|---:|
| new | 365.4 | 222.4 (q1 207.2) | 28.0 | 11.0 |
| old | 397.2 | 242.3 (q1 214.9) | 28.7 | 12.0 |

Median gain: CPU **8.0 %**, wall 8.2 % (first quartile 3.6 %), GC time 2.4 %, GC pauses 8.3 %.
