# 128 — no troops on his monster camp, and what actually answers Generate

His setup: housing **5,600 / 2,180 / 600**, method **`elite`**, objective **`damagePerSilver`**, events `arachnes`.


## A — the units the request carries

- **leadership** — 7 types: ARC1 · ARC2 · RD1 · RD2 · RD3 · SP1 · SP2
- **authority** — 1 types: EMH6
- **dominance** — 4 types: BB · ED · SG · WE

So the army is not the problem: seven troop types reach the engine on every one of the runs below.

## B — what each way of answering Generate returns


| what answered | troop types | leadership | dominance | worst opening | expected | silver | damage a silver |
|---|---|---|---|---|---|---|---|
| Tier ladder (`elite`), the sizer | **7** | 5,600/5,600 | 600/600 | 1,899,683 | 2,033,063 | 2,397,400 | **0.848** |
| Troops first (`ms`), the sizer | **7** | 5,600/5,600 | 558/600 | 2,855,908 | 2,929,989 | 2,369,400 | **1.237** |
| **the objective on his setup** — `searchPriority(damagePerSilver)` | **0** | 0/5,600 | 596/600 | 776,837 | 1,014,737 | 173,600 | **5.845** |

The types the search kept: `battle-boar`, `stone-gargoyle`, `epic-monster-hunter-6` — every leadership type is out.
