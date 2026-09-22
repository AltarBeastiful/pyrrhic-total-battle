# 133 — does the worst opening condemn an unshielded march?

The owner, 2026-09-22, agreeing to an unshielded stop *"but check first that damage reading will keep us from proposing this"*. The plan is ranked on the **worst opening** since S-94 — the enemy-first journal, where the enemy destroys the highest-HP living stack each attack. An unshielded march stands its hired stacks on **top**, so they are the ones destroyed first, and a stack killed at position 1 strikes **zero** times. This asks whether the stock it fields survives long enough to pay for itself on that reading.


| march | troop types | hired chunks | **worst opening** | expected | best | silver | gold |
|---|---|---|---|---|---|---|---|
| **unshielded** — the sizer’s own march (`elite`) | 7 | 103 | **13,209,210** | 13,209,210 | 13,209,210 | 1,942,700 | 15,240 |
| the same vector **sheltered**, as the plan would lower it | 7 | 7 | **2,230,444** | 2,306,819 | 2,383,194 | 1,942,700 | 536 |

## The kill order of the unshielded march, and who actually swings

Kill position 1 is destroyed by the enemy’s first attack. The **worst opening** column above is the sum of the `dealt` column here.

| kill position | stack | count | total HP | strikes (enemy first) | dealt |
|---|---|---|---|---|---|
| 1 | bear-5 **(hired)** | 58 | 5,474,040 | 0 | 0 |
| 2 | legionary-6 **(hired)** | 477 | 5,464,989 | 1 | 5,120,595 |
| 3 | arbalester-6 **(hired)** | 485 | 4,423,200 | 1 | 6,422,855 |
| 4 | archer-1 | 1,158 | 277,920 | 0 | 0 |
| 5 | spearman-1 | 918 | 277,236 | 1 | 141,831 |
| 6 | rider-1 | 470 | 276,360 | 1 | 152,750 |
| 7 | archer-2 | 639 | 276,048 | 1 | 166,204 |
| 8 | spearman-2 | 508 | 275,844 | 2 | 300,838 |
| 9 | rider-2 | 260 | 275,080 | 2 | 335,088 |
| 10 | rider-3 | 146 | 274,772 | 3 | 569,049 |

## B — which unshielded vector the stop should actually field

Every row keeps the sizer’s own seven troop stacks and changes only the hired side. `authority` is of **2,180**. The kill order puts the tallest stack first, so a row that spends the pool on one enormous stack is spending it on the stack that dies before it swings.

| hired vector | authority | chunks | **worst opening** | silver | gold | dies first, for nothing |
|---|---|---|---|---|---|---|
| the sizer’s own (bear 58 · legionary 477 · arbalester 485) | 2,180 | 103 | **13,209,210** | 1,942,700 | 15,240 | bear-5 (1,218 authority) |
| **no bear** — legionary 1 002 · arbalester 485 | 1,487 | 150 | **7,898,932** | 1,942,700 | 10,696 | legionary-6 (1,002 authority) |
| no bear, legionary 693 · arbalester 485 | 1,178 | 119 | **7,898,932** | 1,942,700 | 8,472 | legionary-6 (693 authority) |
| legionary alone, 1 002 | 1,002 | 101 | **1,476,077** | 1,942,700 | 7,208 | legionary-6 (1,002 authority) |
| arbalester alone, 485 | 485 | 49 | **1,476,077** | 1,942,700 | 3,488 | arbalester-6 (485 authority) |
| one bear as the sponge — bear 1 · legionary 1 002 · arbalester 485 | 1,508 | 151 | **8,065,252** | 1,942,700 | 10,696 | legionary-6 (1,002 authority) |

*(For scale: `TotalStack · Total Optimization` on this army is **49,229,801** over four marches for 7,794,000 silver and 374 chunks, and the bar's best stop today is **15,306,859** for 9,849,200 and 52. The rows above are **one** march.)*

