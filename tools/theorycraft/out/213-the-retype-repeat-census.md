# 213 — the re-typing repeat census

W22, `docs/plans/next-speed.md` §"Next candidates". Run 2026-10-12: `planCampaign` in-process, probes' settings, release kernel, fixture `pyrrhic-my-account-2026-10-11.json`, 3 plans (after a warm-up). Planner wall **215 ms per plan** (median; runs 235, 215, 204). "Repeat" = an input signature already seen **within the same plan**; **ms in repeats** is the summed ms of those repeated calls — the ceiling a memo of that level would recover. Times summed per plan.

| Level | Calls/plan | Distinct/plan | Repeats/plan | Repeat rate | Total ms/plan | Ms in repeats/plan | Share of planner |
|---|---:|---:|---:|---:|---:|---:|---:|
| `retypeOne` | 24.0 | 11.0 | 13.0 | 54.2 % | 10.1 | 0.22 | 4.7 % |
| `retypeRow` | 6.0 | 5.0 | 1.0 | 16.7 % | 8.1 | 0.69 | 3.8 % |
| `retypeRowNow` | 6.0 | 6.0 | 0.0 | 0.0 % | 8.0 | 0.00 | 3.7 % |
| `retypeMarch` | 11.0 | 11.0 | 0.0 | 0.0 % | 7.6 | 0.00 | 3.6 % |
| `retypeWalk` door | 5.0 | 5.0 | 0.0 | 0.0 % | 0.3 | 0.00 | 0.2 % |
| `retypeClimb` door | 6.0 | 6.0 | 0.0 | 0.0 % | 3.2 | 0.00 | 1.5 % |

**`retypeOne`'s own cache.** Of its 24.0 calls a plan, 13.0 returned from `retypeCache` (a hit on the engine's own `JSON.stringify(Object.entries(counts).sort())` key); the rest reached `retypeMarch`. Its repeats above (13.0 a plan) cost 0.22 ms in total — the memo already exists.

**`retypeRowNow`'s intra-call cache.** It re-types 16.0 marches a plan across 6.0 row calls (6.0 of the rows moved a march). `moved.find((march) => march.counts === counts)` hit 18.0 times and missed 0.0 a plan.

**`retypeMarch`.** 11.0 calls a plan (one per `retypeOne` cache miss), 0.0 of them repeats — the signature is canonical counts + `silverCeiling` + `holdDamagePerSilver` + `secondsCeiling` + `tierCandidate` + `deadline === Infinity`. Its repeats cost 0.00 ms a plan.

**The doors.** `retypeWalk` is called 5.0 times a plan (5.0 distinct on `slots + hired + base + guard`; 5.0 distinct on `slots + hired + guard` alone), and 5.0 of those calls returned a result (the door accepted the whole walk); one walk costs 0.1 ms and the door's 0.34 ms/plan is 0.2 % of the planner. `retypeClimb` is called 6.0 times (6.0 distinct), 6.0 accepted — the rest fell back to the JS reference climb — at 0.53 ms a call, 3.18 ms/plan.

## Verdict

The re-typing walk repeats an input 0.0 % of the time on the finer key (`slots + hired + base + guard`) and 0.0 % on `slots + hired + guard` alone. A memo of the walk would recover **0.00 ms per plan (0.00 % of the 215 ms planner wall)**; a memo of the whole `retypeMarch` would recover 0.00 ms per plan (0.00 %). That is not enough to pay for another kernel door.
