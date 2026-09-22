# 131 B — candidates the priority search reaches, at the app’s own budget

`CAMPAIGN.budgets.search` is **8,000 ms**, and the reason to read this table is that **it is not reached**. Every army here answers in a fraction of it — so unlike `planCampaign`, which fills whatever clock it is given (experiment 129: 40,843–40,934 ms against a 40,000 ms cap), the priority search is **not budget-bound on any army in this repo**. Its speed is therefore latency and not answer quality: a cheaper simulator makes Generate return sooner, it does not make it return better. `exhaustive` says whether the army was small enough to enumerate outright, not whether the clock stopped it.


| army | objective | types | evaluated | exhaustive | ms |
|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | avgDamage | 11 | **2,047** | yes | 133 |
| first-run army, Bear V ×1 (20 000 leadership | damagePerSilver | 11 | **2,047** | yes | 114 |
| first-run army, Bear V ×2 (20 000 leadership | avgDamage | 11 | **2,047** | yes | 109 |
| first-run army, Bear V ×2 (20 000 leadership | damagePerSilver | 11 | **2,047** | yes | 106 |
| first-run army, Bear V ×3 (20 000 leadership | avgDamage | 11 | **2,047** | yes | 102 |
| first-run army, Bear V ×3 (20 000 leadership | damagePerSilver | 11 | **2,047** | yes | 107 |
| first-run army, Bear V ×10 (20 000 leadershi | avgDamage | 11 | **2,047** | yes | 101 |
| first-run army, Bear V ×10 (20 000 leadershi | damagePerSilver | 11 | **2,047** | yes | 111 |
| first-run army, Epic Monster Hunter VI ×83 ( | avgDamage | 11 | **2,047** | yes | 107 |
| first-run army, Epic Monster Hunter VI ×83 ( | damagePerSilver | 11 | **2,047** | yes | 96 |
| first-run army, monster tiers 3–5 at 900 dom | avgDamage | 24 | **21,715** | no — restarts, not enumeration | 2,207 |
| first-run army, monster tiers 3–5 at 900 dom | damagePerSilver | 24 | **24,477** | no — restarts, not enumeration | 2,527 |
| the 4 000-leadership case of 2026-09-15 (Tot | avgDamage | 12 | **4,095** | yes | 232 |
| the 4 000-leadership case of 2026-09-15 (Tot | damagePerSilver | 12 | **4,095** | yes | 213 |
