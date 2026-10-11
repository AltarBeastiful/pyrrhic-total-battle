# 204 — the sizer cache A/B

W20 C1. 2026-10-11, node v22.22.2: `planCampaign` on `pyrrhic-my-account-2026-10-07.json`, 30 plans per arm, interleaved, one release binary.

| troop-pool cache | median ms | min ms |
|---|---:|---:|
| on | 314.8 | 300.5 |
| off | 335.6 | 321.9 |

Median gain **6.2 %**; min gain 6.7 %.
