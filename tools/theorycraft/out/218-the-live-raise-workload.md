`Tight` (`positionTrades`) on the owner’s live account, one Generate + advisor run in-process on the
release kernel (206’s workload). **slots** are the hired stacks a call may move (merc(m) = authority,
monster(M) = dominance); **raw** is the box the kernel walks or searches; **clamped** is the same box
with each authority slot at its own chunk top `10·ceil(from/10)` and every pool’s slots at their
housing spare (216’s `capsFor`, the caller’s own `request.caps`); **scored** is how many vectors the
search’s scorer was asked about.

- **Calls**: 921 — **769 with a box**, 152 without one.
- **With a box**: **351 walked**, **418 searched** (walkCap 300 000).
- **Boxes wider than `MEMO_CAP` (4,194,304)**: **287 calls**, 21112 ms of 28377 ms (**74.4 %** of all call time; the memo is OFF on these).

### The 15 slowest calls (of 769 with a box)

| call | slots | raw space | clamped space | how | scored | ms |
|---|---:|---:|---:|---|---:|---:|
| captains/probe captain:alexander:level10 | 1m/4M | 52,228,800 | 1,450,800 | searched | 2,392,692 | 750 |
| other/probe campaign:merc:50 | 0m/4M | 3,948,291,072 | 1 | searched | 26,990,666 | 450 |
| captains/probe captain:beowulf:star | 1m/4M | 7,456,455 | 276,165 | searched | 1,245,881 | 442 |
| captains/probe captain:brunhild:level10 | 1m/4M | 9,792,900 | 362,700 | searched | 1,274,676 | 388 |
| other/probe sweep:dominance:32 | 0m/4M | 135,097,600 | 22,597,575 | searched | 11,340,054 | 377 |
| captains/probe captain:bernard:level | 1m/4M | 4,640,000 | 1,299,200 | searched | 989,886 | 354 |
| upgrades/probe health:ranged | 1m/4M | 5,372,136 | 1,139,544 | searched | 1,146,970 | 277 |
| captains/probe captain:logos:level10 | 1m/4M | 7,722,000 | 1,386,000 | searched | 1,743,467 | 257 |
| captains/probe captain:brann:star | 1m/4M | 7,722,000 | 1,386,000 | searched | 1,743,467 | 250 |
| captains/probe captain:logos:level | 1m/4M | 7,722,000 | 1,386,000 | searched | 1,743,467 | 249 |
| captains/probe captain:alexander:star | 0m/4M | 1,284,363,600 | 1 | searched | 15,743,521 | 247 |
| captains/probe captain:brann:level10 | 1m/4M | 7,722,000 | 1,386,000 | searched | 1,743,467 | 239 |
| captains/probe captain:beowulf:level | 1m/4M | 7,722,000 | 1,386,000 | searched | 1,743,467 | 238 |
| captains/probe captain:logos:star | 1m/4M | 7,722,000 | 1,386,000 | searched | 1,743,467 | 236 |
| other/probe campaign:tier:monster monster tier 4 | 1m/8M | 7,020,000 | 540,000 | searched | 395,916 | 235 |

### Totals and the clamped arm

| arm | Σ ms | note |
|---|---:|---|
| the whole workload (`positionTrades`, as the app runs it) | 28377 | 921 calls |
| the shipped `Tight` box alone (re-priced, 769 calls) | 29704 | one box a call |
| the clamped box alone (re-priced, 769 calls) | 13053 | 216’s `capsFor` caps |

- Per with-a-box call: mean **36.83 ms**, median **15.68 ms**.
- **Ratio, clamp ÷ shipped box** (box to box, fresh kernels): **43.9 %**.
- **Ratio, clamp ÷ whole workload**: **46.0 %**.
- **⚠ STOP — the clamps moved a count on 10 calls (31 counts total): 10 searched, 0 walked.** A walked box must never move (it is exhaustive over a superset), so any walked move is a defect; a searched move is expected — the clamp caps the **seed** (the kernel’s climb reads the same caps) as well as the box, and the climb then starts elsewhere.
- A fresh re-price of the shipped box reproduced the run’s own `Tight` row on every call (sanity).

```
CLAMP MOVED · captains/probe captain:brunhild:star: battle-boar 43→42, emerald-dragon 47→45, stone-gargoyle 38→39, water-elemental 103→107
CLAMP MOVED · captains/probe captain:brunhild:level: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:brann:star: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:brann:level: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:brann:level10: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:logos:star: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:logos:level: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:logos:level10: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · captains/probe captain:beowulf:level: battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125
CLAMP MOVED · other/probe sweep:dominance:4: emerald-dragon 44→43, stone-gargoyle 38→39, water-elemental 108→107
```

### What the numbers say

The workload is **921 `positionTrades` calls**; **769** carry a box and **152** do not, and of the boxes **351 are walked** whole and **418 searched** (`walkCap` 300 000). Per-call time is tiny (median **15.7 ms**), but it is not spread evenly: the **287** boxes wider than `MEMO_CAP` (4,194,304) carry **74.4 %** of all call time. On those the score memo is off, so every restart's sweeps fight their battles again — that is the whole of the cost, and the lever is to shrink the box.

Re-pricing every box with the caller's own caps (216's `capsFor`: each authority slot at its chunk top, every pool at its housing spare) gives **43.9 %** of the shipped boxes' own wall (13053 ms vs 29704 ms, box to box) — the cost lever is real. **But the clamp is not answer-free on the live workload**: it moved a count on 10 calls (10 searched, 0 walked), because it caps the seed `raisePool` climbs from as well as the box, so a searched box lands elsewhere. 216's benchmark saw none only because none of its searched stops moved (its live `all-in` box, 135 097 600, is in this workload unchanged). A caller shipping the clamp must accept a few-unit drift on searched dominance boxes, or seed the search from the unclamped climb.
