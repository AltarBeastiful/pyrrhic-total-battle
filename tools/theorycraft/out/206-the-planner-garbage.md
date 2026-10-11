# 206 — where the planner allocates

W22 step 4 (`docs/plans/next-speed.md` §1). Run 2026-10-11, node v22.22.1: `planCampaign` alone, in-process, probes' settings (no clock), release kernel, fixture `pyrrhic-my-account-2026-10-11.json` (not committed). Sampled heap profile every 4 KiB, collected objects kept, over 3 plans; GC pauses and CPU over 5 unprofiled plans (after one warm-up).

| Figure | Per plan |
|---|---:|
| Allocated (sampled) | 182.6 MiB |
| GC pauses | 12.2 pauses, 32.3 ms |
| CPU | 468 ms |
| Wall | 254 ms |

## Top 15 allocation sites (bottom-up)

| # | Allocating function | Caller | MiB/plan | Share |
|---:|---|---|---:|---:|
| 1 | `scorer engine/plan.ts` | `evaluateVector engine/plan.ts` | 38.76 | 21.2 % |
| 2 | `next` | `evaluateVector engine/plan.ts` | 15.09 | 8.3 % |
| 3 | `sizerShape kernel/plan.ts` | `sizerKeptOf engine/plan.ts` | 8.90 | 4.9 % |
| 4 | `evaluateVector engine/plan.ts` | `planCampaign engine/plan.ts` | 7.99 | 4.4 % |
| 5 | `marchRecovery engine/plan.ts` | `record engine/plan.ts` | 5.97 | 3.3 % |
| 6 | `replayed engine/plan.ts` | `evaluateVector engine/plan.ts` | 3.51 | 1.9 % |
| 7 | `sizerKeptOf engine/plan.ts` | `scorer engine/plan.ts` | 3.51 | 1.9 % |
| 8 | `finaleFor engine/plan.ts` | `finish engine/plan.ts` | 3.49 | 1.9 % |
| 9 | `countsKey engine/plan.ts` | `(anonymous) engine/plan.ts@6294` | 3.04 | 1.7 % |
| 10 | `scorer.rowShape engine/plan.ts` | `evaluateVector engine/plan.ts` | 2.91 | 1.6 % |
| 11 | `gridOnKernel engine/plan.ts` | `scorer engine/plan.ts` | 2.83 | 1.6 % |
| 12 | `priceMarch engine/plan.ts` | `billedMarch engine/plan.ts` | 2.82 | 1.5 % |
| 13 | `priceMarch engine/plan.ts` | `summarise engine/plan.ts` | 2.82 | 1.5 % |
| 14 | `climb engine/retype.ts` | `retypeMarch engine/retype.ts` | 2.73 | 1.5 % |
| 15 | `consider engine/plan.ts` | `planCampaign engine/plan.ts` | 2.55 | 1.4 % |
