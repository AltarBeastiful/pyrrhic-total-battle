# 136 — what the ratio objectives answer, and what the whole army would have answered

`objectiveScore` scores a march on **one resource**. A mercenary costs gold and stock, never silver, and troops are the only thing on the field that costs silver — so *"best damage per silver"* asked without a floor has an honest answer of **field no troops**, and the search finds it correctly.

**Troops are free in the rare resource.** `mercLost` counts the authority pool alone (S-102), so leadership spent is not burn. The last column asks whether the whole army — every type the account holds, sized — beats the search’s own answer on `trades.ts`’s **stock** reading: *at least the damage for at most the burn*. Where it does, the answer the player is given is one another march beats without costing them a single extra chunk.


| army | objective | troops | damage | silver | burn | whole army: troops | damage | burn | beaten on stock? |
|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000  | average damage | 3 | 4,661,848 | 14,000,000 | 1 | 10 | 4,631,402 | 1 | no |
|  | best worst case | 6 | 5,006,604 | 11,434,600 | 1 | 10 | 4,631,402 | 1 | no |
|  | damage per silver | 10 | 4,631,402 | 8,131,400 | 1 | 10 | 4,631,402 | 1 | no |
|  | damage per gold | 10 | 4,631,402 | 8,131,400 | 1 | 10 | 4,631,402 | 1 | no |
|  | damage per dragon coin | 10 | 4,631,402 | 8,131,400 | 1 | 10 | 4,631,402 | 1 | no |
| first-run army, Bear V ×2 (20 000  | average damage | 3 | 4,699,248 | 14,000,000 | 1 | 10 | 4,743,602 | 1 | **yes** |
|  | best worst case | 6 | 5,081,404 | 11,434,600 | 1 | 10 | 4,743,602 | 1 | no |
|  | damage per silver | 10 | 4,743,602 | 8,131,400 | 1 | 10 | 4,743,602 | 1 | no |
|  | damage per gold | 3 | 4,699,248 | 14,000,000 | 1 | 10 | 4,743,602 | 1 | **yes** |
|  | damage per dragon coin | 10 | 4,743,602 | 8,131,400 | 1 | 10 | 4,743,602 | 1 | no |
| first-run army, Bear V ×3 (20 000  | average damage | 3 | 4,736,648 | 14,000,000 | 1 | 10 | 4,855,802 | 1 | **yes** |
|  | best worst case | 6 | 5,156,204 | 11,434,600 | 1 | 10 | 4,855,802 | 1 | no |
|  | damage per silver | 10 | 4,855,802 | 8,131,400 | 1 | 10 | 4,855,802 | 1 | no |
|  | damage per gold | 3 | 4,736,648 | 14,000,000 | 1 | 10 | 4,855,802 | 1 | **yes** |
|  | damage per dragon coin | 10 | 4,855,802 | 8,131,400 | 1 | 10 | 4,855,802 | 1 | no |
| first-run army, Bear V ×10 (20 000 | average damage | 3 | 4,998,448 | 14,000,000 | 1 | 10 | 5,288,144 | 1 | **yes** |
|  | best worst case | 6 | 5,679,804 | 11,434,600 | 1 | 10 | 5,288,144 | 1 | no |
|  | damage per silver | 10 | 5,288,144 | 8,131,400 | 1 | 10 | 5,288,144 | 1 | no |
|  | damage per gold | 3 | 4,998,448 | 14,000,000 | 1 | 10 | 5,288,144 | 1 | **yes** |
|  | damage per dragon coin | 10 | 5,288,144 | 8,131,400 | 1 | 10 | 5,288,144 | 1 | no |
| first-run army, Epic Monster Hunte | average damage | 9 | 7,947,556 | 8,514,200 | 9 | 10 | 5,288,144 | 9 | no |
|  | best worst case | 9 | 7,947,556 | 8,514,200 | 9 | 10 | 5,288,144 | 9 | no |
|  | damage per silver | 9 | 7,947,556 | 8,514,200 | 9 | 10 | 5,288,144 | 9 | no |
|  | damage per gold | 9 | 7,947,556 | 8,514,200 | 9 | 10 | 5,288,144 | 9 | no |
|  | damage per dragon coin | 10 | 5,288,144 | 8,131,400 | 9 | 10 | 5,288,144 | 9 | no |
| first-run army, monster tiers 3–5  | average damage | 8 | 26,760,435 | 9,716,600 | 10 | 10 | 18,757,120 | 10 | no |
|  | best worst case | 8 | 26,764,875 | 9,716,600 | 10 | 10 | 18,757,120 | 10 | no |
|  | damage per silver | **none** | 7,616,394 | 466,400 | 10 | 10 | 18,757,120 | 10 | **yes** |
|  | damage per gold | 10 | 16,086,431 | 8,862,600 | 0 | 10 | 18,757,120 | 10 | no |
|  | damage per dragon coin | 5 | 22,684,818 | 12,292,000 | 10 | 10 | 18,757,120 | 10 | no |
| the 4 000-leadership case of 2026- | average damage | 8 | 2,447,995 | 1,520,800 | 7 | 8 | 2,447,995 | 7 | no |
|  | best worst case | 8 | 2,447,995 | 1,520,800 | 7 | 8 | 2,447,995 | 7 | no |
|  | damage per silver | 8 | 2,447,995 | 1,520,800 | 7 | 8 | 2,447,995 | 7 | no |
|  | damage per gold | 2 | 886,801 | 2,343,600 | 2 | 8 | 2,447,995 | 7 | no |
|  | damage per dragon coin | 8 | 2,447,995 | 1,520,800 | 7 | 8 | 2,447,995 | 7 | no |
| 2026-09-17 export, its setup (7 00 | average damage | 3 | 6,878,578 | 3,817,600 | 27 | 7 | 4,457,185 | 27 | no |
|  | best worst case | 3 | 6,878,578 | 3,817,600 | 27 | 7 | 4,457,185 | 27 | no |
|  | damage per silver | 6 | 5,582,657 | 2,899,400 | 27 | 7 | 4,457,185 | 27 | no |
|  | damage per gold | 2 | 2,113,141 | 4,033,200 | 2 | 7 | 4,457,185 | 27 | no |
|  | damage per dragon coin | 7 | 4,457,185 | 2,739,400 | 27 | 7 | 4,457,185 | 27 | no |
| 2026-09-17 export, 12 000 leadersh | average damage | 7 | 7,843,171 | 4,697,600 | 27 | 7 | 7,843,171 | 27 | no |
|  | best worst case | 4 | 8,492,728 | 6,374,000 | 27 | 7 | 7,843,171 | 27 | no |
|  | damage per silver | 7 | 7,843,171 | 4,697,600 | 27 | 7 | 7,843,171 | 27 | no |
|  | damage per gold | 2 | 3,235,394 | 6,914,400 | 2 | 7 | 7,843,171 | 27 | no |
|  | damage per dragon coin | 7 | 7,843,171 | 4,697,600 | 27 | 7 | 7,843,171 | 27 | no |
| live account of 2026-09-18 (one hi | average damage | 2 | 6,012,190 | 11,437,600 | 9 | 7 | 6,729,633 | 9 | **yes** |
|  | best worst case | 6 | 6,846,636 | 8,233,600 | 9 | 7 | 6,729,633 | 9 | no |
|  | damage per silver | 6 | 6,559,175 | 7,488,600 | 9 | 7 | 6,729,633 | 9 | **yes** |
|  | damage per gold | 2 | 6,012,190 | 11,437,600 | 9 | 7 | 6,729,633 | 9 | **yes** |
|  | damage per dragon coin | 7 | 6,729,633 | 7,809,000 | 9 | 7 | 6,729,633 | 9 | no |
| live account, evening (hunters 83, | average damage | 1 | 9,569,185 | 7,700,000 | 218 | 7 | 7,846,633 | 218 | no |
|  | best worst case | 1 | 9,569,185 | 7,700,000 | 218 | 7 | 7,846,633 | 218 | no |
|  | damage per silver | 4 | 6,286,196 | 3,624,400 | 218 | 7 | 7,846,633 | 218 | **yes** |
|  | damage per gold | 2 | 2,854,658 | 6,290,800 | 1 | 7 | 7,846,633 | 218 | no |
|  | damage per dragon coin | 7 | 7,846,633 | 4,294,800 | 218 | 7 | 7,846,633 | 218 | no |
| Aydae alone, 4 975 (one captain, f | average damage | 4 | 5,319,378 | 2,643,900 | 218 | 8 | 4,314,219 | 218 | no |
|  | best worst case | 4 | 5,319,378 | 2,643,900 | 218 | 8 | 4,314,219 | 218 | no |
|  | damage per silver | 3 | 3,473,669 | 1,492,500 | 218 | 8 | 4,314,219 | 218 | **yes** |
|  | damage per gold | 7 | 1,640,312 | 1,948,300 | 1 | 8 | 4,314,219 | 218 | no |
|  | damage per dragon coin | 8 | 4,314,219 | 1,837,900 | 218 | 8 | 4,314,219 | 218 | no |
| the owner’s live camp of 2026-09-1 | average damage | 1 | 9,653,965 | 3,481,800 | 150 | 7 | 13,209,210 | 103 | **yes** |
|  | best worst case | 1 | 14,774,560 | 3,481,800 | 103 | 7 | 13,209,210 | 103 | no |
|  | damage per silver | 1 | 7,231,130 | 1,492,200 | 150 | 7 | 13,209,210 | 103 | **yes** |
|  | damage per gold | 1 | 6,422,855 | 3,481,800 | 49 | 7 | 13,209,210 | 103 | no |
|  | damage per dragon coin | 7 | 13,209,210 | 1,942,700 | 103 | 7 | 13,209,210 | 103 | no |
| his camp of 2026-09-19, the localS | average damage | 1 | 7,280,595 | 3,481,800 | 45 | 7 | 1,476,077 | 45 | no |
|  | best worst case | 1 | 7,280,595 | 3,481,800 | 45 | 7 | 1,476,077 | 45 | no |
|  | damage per silver | 1 | 808,275 | 1,492,200 | 45 | 7 | 1,476,077 | 45 | **yes** |
|  | damage per gold | 1 | 7,280,595 | 3,481,800 | 45 | 7 | 1,476,077 | 45 | no |
|  | damage per dragon coin | 7 | 1,476,077 | 1,942,700 | 45 | 7 | 1,476,077 | 45 | no |
| his camp of 2026-09-19, as his mes | average damage | 2 | 3,131,559 | 2,916,400 | 12 | 7 | 1,511,333 | 12 | no |
|  | best worst case | 2 | 3,152,346 | 2,922,800 | 12 | 7 | 1,511,333 | 12 | no |
|  | damage per silver | 1 | 1,941,492 | 1,530,000 | 12 | 7 | 1,511,333 | 12 | no |
|  | damage per gold | 2 | 3,131,559 | 2,916,400 | 12 | 7 | 1,511,333 | 12 | no |
|  | damage per dragon coin | 7 | 1,511,333 | 1,991,000 | 12 | 7 | 1,511,333 | 12 | no |
| his TotalStack profile of 2026-09- | average damage | 5 | 2,202,668 | 2,437,500 | 8 | 8 | 1,684,837 | 8 | no |
|  | best worst case | 5 | 2,202,668 | 2,437,500 | 8 | 8 | 1,684,837 | 8 | no |
|  | damage per silver | **none** | 156,845 | 33,600 | 8 | 8 | 1,684,837 | 8 | **yes** |
|  | damage per gold | 5 | 2,202,668 | 2,437,500 | 8 | 8 | 1,684,837 | 8 | no |
|  | damage per dragon coin | 5 | 2,138,938 | 2,403,900 | 8 | 8 | 1,684,837 | 8 | no |
| his usual setup of 2026-09-19 (Ayd | average damage | 2 | 2,972,413 | 3,049,600 | 9 | 8 | 2,143,198 | 9 | no |
|  | best worst case | 2 | 2,972,413 | 3,049,600 | 9 | 8 | 2,143,198 | 9 | no |
|  | damage per silver | **none** | 359,100 | 58,800 | 9 | 8 | 2,143,198 | 9 | **yes** |
|  | damage per gold | 2 | 2,972,413 | 3,049,600 | 9 | 8 | 2,143,198 | 9 | no |
|  | damage per dragon coin | 2 | 2,814,547 | 3,032,800 | 9 | 8 | 2,143,198 | 9 | no |

## The standing

**17 of 85** answers the search gives are beaten by the whole army on stock alone — more damage, and not one extra chunk of the rare resource. **3** of them field no troops at all.

Where the answer is beaten, the rule the owner asked for costs nothing to state and needs no constant: refuse a selection another selection beats on *at least the damage for at most the burn*. Where it is **not** beaten, the search is trading real stock for real damage and the player should keep the choice.

