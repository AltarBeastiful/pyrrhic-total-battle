# 144 — the plan already holds answers it never offers

For every captured row **no stop of ours fits inside**, this tests every undominated row of the frontier the stops were chosen from — priced over the same horizon, on the same arithmetic. A row that fits means the plan **found** the answer and the bar did not **offer** it, which is a stop rule to fix rather than a search to widen.

| army | their row | no stop fits, refused on | a frontier plan fits? | its burn / gold / silver | its damage vs their row |
|---|---|---|---|---|---:|
| first-run army, monster tiers 3– | TotalStack · M’s Preservat | gold, dragonCoins, burned | no | — | — |
|  | TotalStack · Total Optimiz | gold | **yes** | 18 / 2,408 / 25,764,300 | -22.7 % |
|  | TotalStack · Elite Preserv | gold | **yes** | 18 / 2,408 / 25,764,300 | -22.7 % |
| 2026-09-17 export, its setup (7  | TotalStack · M’s Preservat | gold, burned | no | — | — |
|  | TotalStack · Total Optimiz | gold, burned | no | — | — |
|  | TotalStack · priority sear | gold, burned | **yes** | 20 / 1,680 / 10,186,900 | -3.5 % |
| 2026-09-17 export, 12 000 leader | TotalStack · M’s Preservat | gold, burned | **yes** | 22 / 1,632 / 18,702,500 | -1.2 % |
|  | TotalStack · priority sear | burned | **yes** | 36 / 2,816 / 18,734,000 | 5.4 % |
|  | TotalStack · priority sear | burned | **yes** | 36 / 2,816 / 18,734,000 | 5.4 % |
|  | TotalStack · Total Optimiz | gold, burned | **yes** | 22 / 1,632 / 18,702,500 | -0.5 % |
|  | TotalStack · priority sear | gold, burned | **yes** | 36 / 2,816 / 18,734,000 | 6.0 % |
|  | TotalStack · priority sear | gold, burned | **yes** | 36 / 2,816 / 18,734,000 | 6.0 % |
| Aydae alone, 4 975 (one captain, | TotalStack · priority sear | silver | **yes** | 22 / 1,456 / 6,205,000 | -21.8 % |
| his camp of 2026-09-19, the loca | TotalStack · M’s Preservat | gold, burned | no | — | — |
| his camp of 2026-09-19, as his m | TotalStack · M’s Preservat | silver, gold, burned | no | — | — |
|  | TotalStack · Total Optimiz | silver | **yes** | 18 / 1,248 / 8,270,600 | 31.9 % |
|  | TotalStack · Elite Preserv | silver | **yes** | 18 / 1,248 / 8,270,600 | 31.9 % |
| his TotalStack profile of 2026-0 | TotalStack · M’s Preservat | gold, dragonCoins, burned | no | — | — |
| his usual setup of 2026-09-19 (A | TotalStack · M’s Preservat | gold, burned | no | — | — |
|  | TotalStack · Total Optimiz | gold, burned | no | — | — |
|  | TotalStack · priority sear | dragonCoins | **yes** | 5 / 352 / 7,239,300 | -11.2 % |
|  | TotalStack · priority sear | dragonCoins | **yes** | 5 / 352 / 7,239,300 | -11.2 % |

## What this separates

- **22** captured rows have no stop of ours inside their budget.
- **14** of them have an **undominated frontier plan that does fit** — the plan found the answer and the bar never offered it. Those are a **stop rule**, not a search.
- **6** of those fit *and* out-damage the row, which turns a "no stop fits" into a **beat** with no new search at all.
- **8** have nothing on the frontier that fits, and those are the ones W4's reach work is actually for.

The frontier was capped at 300 rows on 5 armies, so the counts above are a **lower bound**:

- **first-run army, monster tiers 3–5 at 900** — 1999 undominated rows, 300 priced
- **2026-09-17 export, its setup (7 000 lead** — 327 undominated rows, 300 priced
- **Aydae alone, 4 975 (one captain, four hi** — 332 undominated rows, 300 priced
- **his TotalStack profile of 2026-09-19 (5 ** — 305 undominated rows, 300 priced
- **his usual setup of 2026-09-19 (Aydae alo** — 627 undominated rows, 300 priced

