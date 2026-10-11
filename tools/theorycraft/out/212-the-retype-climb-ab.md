# 212 — the retype climb A/B

W22 step 5. 2026-10-11, node v22.22.1: `planCampaign` alone on `pyrrhic-my-account-2026-10-11.json`, 60 rounds per arm, interleaved, release kernel; old = the `retypeClimb` door declined.

| arm | median CPU ms | median wall ms |
|---|---:|---:|
| new | 309.2 | 212.1 (q1 207.5) |
| old | 322.3 | 225.0 (q1 215.0) |

Median gain: CPU **4.1 %**, wall **5.7 %** (first quartile 3.5 %).
