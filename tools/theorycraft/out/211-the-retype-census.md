# 211 — the retype climb, counted

W22 step 5. Run 2026-10-11: `planCampaign` in-process, probes' settings, release kernel, fixture `pyrrhic-my-account-2026-10-11.json`, 3 plans (after a warm-up). Planner wall 278 ms per plan. Times are summed per plan.

| Path | Calls/plan | Total ms/plan | % of planner | Climb steps/call | Candidates battled/call | JS climb ms/plan | Build ms/plan | Battle ms/plan | k × m (typical) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| js-climb | 6.0 | 17.9 | 6.4 % | 13.0 | 600 | 14.3 | 6.2 | 4.7 | 11 × 11 |
| door | 5.0 | 3.1 | 1.1 % | 0.0 | 1 | 0.0 | 0.0 | 0.0 | 3 × 11 |

All `retypeMarch`: 11.0 calls, 21.0 ms per plan (7.5 % of the planner).
