# 131 A — `simulateBattle` against `battleScore`, on the benchmark’s own armies

`battleScore` answers the seven figures an objective is scored on; `simulateBattle` answers those plus the battle report — two journals with an entry list each, the damage split by pool, the model notes. The priority search reads **one number** off a candidate, so every candidate but the winner and the baseline was paying for a report nobody read.


| army | stacks | `sizeStacks` | `recoveryCosts` | `simulateBattle` | `battleScore` | full ÷ light |
|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership | 11 | 0.0738 ms | 0.0060 ms | 0.0123 ms | 0.0053 ms | **2.33×** |
| first-run army, Bear V ×2 (20 000 leadership | 11 | 0.0696 ms | 0.0029 ms | 0.0070 ms | 0.0058 ms | **1.20×** |
| first-run army, Bear V ×3 (20 000 leadership | 11 | 0.0669 ms | 0.0029 ms | 0.0063 ms | 0.0047 ms | **1.33×** |
| first-run army, Bear V ×10 (20 000 leadershi | 11 | 0.0672 ms | 0.0028 ms | 0.0065 ms | 0.0051 ms | **1.29×** |
| first-run army, Epic Monster Hunter VI ×83 ( | 11 | 0.0719 ms | 0.0053 ms | 0.0066 ms | 0.0046 ms | **1.42×** |
| first-run army, monster tiers 3–5 at 900 dom | 24 | 0.1276 ms | 0.0121 ms | 0.0170 ms | 0.0117 ms | **1.45×** |
| the 4 000-leadership case of 2026-09-15 (Tot | 12 | 0.0820 ms | 0.0048 ms | 0.0086 ms | 0.0071 ms | **1.20×** |
