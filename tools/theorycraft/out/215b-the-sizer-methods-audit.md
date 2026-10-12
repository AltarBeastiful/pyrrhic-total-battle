# 215b — the sizer methods, audited on the live account

An independent check of experiment 215 on `pyrrhic-my-account-2026-10-11.json` (his live account, not the benchmark's 19 armies):
each `SIZER_DEPTHS` method dropped, the **whole plan** (`alternatives`, every reading) compared byte for
byte with the shipped search, CPU interleaved (7 rounds each, medians).

Planner CPU, shipped: **329 ms** per plan (median); wall 201 ms; 5 stops.

| restriction | plan vs shipped | base CPU ms | restricted CPU ms | CPU saved | stops | base stops |
|---|---|---:|---:|---:|---:|---:|
| drop `msRelaxed` | **identical** | 329 | 245 | 25.4 % | 5 | 5 |
| drop `ms` | **identical** | 329 | 240 | 27.1 % | 5 | 5 |
| drop `elite` | DIFFERS | 329 | 268 | 18.6 % | 5 | 5 |
| keep `elite` only | **identical** | 329 | 174 | 47.2 % | 5 | 5 |
| keep `ms` only | DIFFERS | 329 | 184 | 43.9 % | 5 | 5 |
| drop all three | DIFFERS | 329 | 61 | 81.5 % | 5 | 5 |

## The identity is not a warm-cache artefact

The arms above share one process, so a cache carried between them could mask a difference. Each arm was run
again **in a fresh process, restricted arm first** (`AUDIT_ONLY=base|elite`), and the whole plan hashed:

| arm | plan hash (sha256, 12) | stops | first-plan CPU ms (cold) |
|---|---|---:|---:|
| shipped | `c1b958704d52` | 5 | 832.1 |
| `SIZER_DEPTHS = { 0: 'elite' }` | `c1b958704d52` | 5 | 766.3 |

Same hash. (The CPU column is the cold first plan, JIT included, and is not comparable to the medians above —
the −47 % is the interleaved reading.)
