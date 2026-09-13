# A5 — exhaustive mercenary split

Authority is 2,000, so the pool never binds: the caps do (EMH6 92, ABT6 76, LGN6 72, CHR6 37 = 314 authority at full stock) and so does the kill order — a mercenary stack heavier than the smallest troop stack climbs above the troops and is wiped early. Every vector below is an explicit count vector scored with `evaluateCounts` on the repo engine; the troop stacks are frozen at what `sizeStacks` gives them at full leadership under M's Preservation. Enumeration is exhaustive over `0 ≤ e ≤ 92, 0 ≤ a ≤ 76, 0 ≤ l ≤ 72, 0 ≤ c ≤ 37` — 19,868,214 vectors per scenario and base.

## 1. How many mercenaries fall after the troops — the troop floor

For a subset of troop types the sizer spends the whole 4,343 leadership on a flat ladder; the smallest stack of that ladder is the floor every mercenary stack must stay under to die last. Fewer types = a higher floor = bigger mercenary stacks, but also fewer stacks in front of them (their kill positions move up, which costs hits). The table takes every non-empty subset of the account's eight troop types, keeps the mercenaries at `min(cap, floor(floor−1 / hp))`, and sorts by average damage.

**Scenario A** — 255 troop subsets, best 15 and the reference rows:
| # | troop types | stacks | floor | merc authority | avg | march |
|---|---|---|---|---|---|---|
| 1 | ARC2 RD2 RD3 | 7 | 469,775 | 296 | 5,559,067 | ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 2 | SP2 RD2 RD3 | 7 | 469,775 | 296 | 5,526,956 | SP2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 3 | ARC2 SP2 RD3 | 7 | 469,775 | 296 | 5,499,662 | ARC2 1,698 · SP2 1,695 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 4 | ARC2 SP2 RD2 | 7 | 401,432 | 267 | 5,271,678 | ARC2 1,451 · SP2 1,448 · RD2 722 · ABT6 68 · LGN6 68 · CHR6 34 · EMH6 63 |
| 5 | ARC2 SP2 RD2 RD3 | 8 | 337,249 | 223 | 5,107,427 | ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 |
| 6 | ARC2 RD3 | 6 | 771,420 | 314 | 5,017,347 | ARC2 2,783 · RD3 780 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 7 | RD2 RD3 | 6 | 771,420 | 314 | 5,013,499 | RD2 1,391 · RD3 780 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 8 | SP2 RD3 | 6 | 771,420 | 314 | 4,964,748 | SP2 2,783 · RD3 780 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 9 | ARC2 RD2 | 6 | 602,704 | 314 | 4,732,219 | ARC2 2,175 · RD2 1,084 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 10 | SW1 RD2 RD3 | 7 | 359,007 | 239 | 4,700,141 | SW1 2,325 · RD2 646 · RD3 363 · ABT6 61 · LGN6 61 · EMH6 57 · CHR6 30 |
| 11 | ARC1 RD2 RD3 | 7 | 359,007 | 239 | 4,700,141 | ARC1 2,325 · RD2 646 · RD3 363 · ABT6 61 · LGN6 61 · EMH6 57 · CHR6 30 |
| 12 | SP1 RD2 RD3 | 7 | 359,007 | 239 | 4,700,141 | SP1 2,325 · RD2 646 · RD3 363 · ABT6 61 · LGN6 61 · EMH6 57 · CHR6 30 |
| 13 | SP2 RD2 | 6 | 602,704 | 314 | 4,691,112 | SP2 2,175 · RD2 1,084 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 14 | ARC2 SP2 | 6 | 602,982 | 314 | 4,656,176 | ARC2 2,174 · SP2 2,169 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 15 | ARC1 RD3 | 6 | 511,313 | 303 | 4,533,953 | ARC1 3,309 · RD3 517 · EMH6 81 · ABT6 76 · CHR6 37 · LGN6 72 |
| 59 | SW1 SP2 RD2 RD3 | 8 | 275,931 | 181 | 4,062,895 | SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 |
| 1 | ARC2 RD2 RD3 | 7 | 469,775 | 296 | 5,559,067 | ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 5 | ARC2 SP2 RD2 RD3 | 8 | 337,249 | 223 | 5,107,427 | ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 |
| 211 | SW1 ARC1 SP1 RD1 ARC2 SP2 RD2 RD3 | 12 | 110,768 | 71 | 2,851,540 | SW1 730 · ARC1 728 · SP1 727 · RD1 363 · ARC2 403 · SP2 403 · RD2 201 · RD3 112 · EMH6 17 · ABT6 18 · LGN6 18 · CHR6 9 |

**Scenario B** — 255 troop subsets, best 15 and the reference rows:
| # | troop types | stacks | floor | merc authority | avg | march |
|---|---|---|---|---|---|---|
| 1 | ARC2 RD2 RD3 | 7 | 1,108,175 | 296 | 7,825,435 | ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 2 | SP2 RD2 RD3 | 7 | 1,108,175 | 296 | 7,792,217 | SP2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 3 | ARC2 SP2 RD3 | 7 | 1,108,175 | 296 | 7,765,905 | ARC2 1,697 · SP2 1,696 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 4 | ARC2 SP2 RD2 RD3 | 8 | 797,886 | 223 | 7,201,171 | ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 |
| 5 | ARC2 RD3 | 6 | 1,822,073 | 314 | 7,082,238 | ARC2 2,781 · RD3 781 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 6 | RD2 RD3 | 6 | 1,819,740 | 314 | 7,076,020 | RD2 1,391 · RD3 780 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 7 | SP2 RD3 | 6 | 1,819,740 | 314 | 7,027,351 | SP2 2,783 · RD3 780 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 8 | ARC2 SP2 RD2 | 7 | 948,576 | 268 | 6,918,809 | ARC2 1,449 · SP2 1,448 · RD2 723 · EMH6 64 · ABT6 68 · LGN6 68 · CHR6 34 |
| 9 | ARC2 RD2 | 6 | 1,423,520 | 314 | 6,645,559 | ARC2 2,173 · RD2 1,085 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 10 | SP2 RD2 | 6 | 1,422,208 | 314 | 6,603,130 | SP2 2,175 · RD2 1,084 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 11 | ARC2 SP2 | 6 | 1,424,176 | 314 | 6,569,528 | ARC2 2,172 · SP2 2,171 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 12 | ARC1 RD3 | 6 | 1,203,828 | 303 | 6,322,015 | ARC1 3,311 · RD3 516 · EMH6 81 · ABT6 76 · CHR6 37 · LGN6 72 |
| 13 | RD1 RD3 | 6 | 1,203,828 | 303 | 6,319,443 | RD1 1,655 · RD3 516 · EMH6 81 · ABT6 76 · CHR6 37 · LGN6 72 |
| 14 | SP1 RD3 | 6 | 1,203,828 | 303 | 6,298,010 | SP1 3,311 · RD3 516 · EMH6 81 · ABT6 76 · CHR6 37 · LGN6 72 |
| 15 | RD3 | 5 | 5,064,943 | 314 | 6,221,163 | RD3 2,171 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 |
| 101 | SW1 SP2 RD2 RD3 | 8 | 520,259 | 145 | 4,474,506 | SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 |
| 1 | ARC2 RD2 RD3 | 7 | 1,108,175 | 296 | 7,825,435 | ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 |
| 4 | ARC2 SP2 RD2 RD3 | 8 | 797,886 | 223 | 7,201,171 | ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 |
| 176 | SW1 ARC1 SP1 RD1 ARC2 SP2 RD2 RD3 | 12 | 237,966 | 66 | 3,802,488 | SW1 1,066 · ARC1 661 · SP1 660 · RD1 329 · ARC2 365 · SP2 365 · RD2 182 · RD3 102 · EMH6 16 · ABT6 17 · LGN6 17 · CHR6 8 |

## A · E8 — troops SW1 1,794 · SP2 997 · RD2 497 · RD3 279, floor 275,931

mercenary stacks stay under the troops while EMH6 ≤ 43, ABT6 ≤ 46, LGN6 ≤ 46, CHR6 ≤ 23 (HP per unit 6,273 / 5,871 / 5,871 / 11,742); caps are 92 / 76 / 72 / 37.

19,864,614 vectors simulated in 363.6 s.

**Top 10 inside the caps, no ordering constraint**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 43 · ABT6 46 · LGN6 47 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43 | 182 | 4,257,493 | 4,257,493 | 4,257,493 |
| 2 | EMH6 43 · ABT6 45 · LGN6 47 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · CHR6 23 · EMH6 43 · ABT6 45 | 181 | 4,234,237 | 4,234,237 | 4,234,237 |
| 3 | EMH6 42 · ABT6 46 · LGN6 47 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 42 | 181 | 4,228,585 | 4,228,585 | 4,228,585 |
| 4 | EMH6 43 · ABT6 45 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 43 · ABT6 45 | 180 | 4,226,675 | 4,226,675 | 4,226,675 |
| 5 | EMH6 44 · ABT6 47 · LGN6 72 · CHR6 36 → LGN6 72 · CHR6 36 · SW1 1,794 · SP2 997 · RD2 497 · EMH6 44 · ABT6 47 · RD3 279 | 235 | 3,950,068 | 4,222,300 | 4,494,532 |
| 6 | EMH6 43 · ABT6 46 · LGN6 47 · CHR6 22 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · EMH6 43 · CHR6 22 | 180 | 4,212,197 | 4,212,197 | 4,212,197 |
| 7 | EMH6 43 · ABT6 44 · LGN6 47 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · CHR6 23 · EMH6 43 · ABT6 44 | 180 | 4,210,981 | 4,210,981 | 4,210,981 |
| 8 | EMH6 42 · ABT6 45 · LGN6 47 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · CHR6 23 · ABT6 45 · EMH6 42 | 180 | 4,205,329 | 4,205,329 | 4,205,329 |
| 9 | EMH6 43 · ABT6 44 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 43 · ABT6 44 | 179 | 4,203,419 | 4,203,419 | 4,203,419 |
| 10 | EMH6 41 · ABT6 46 · LGN6 47 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 41 | 180 | 4,199,679 | 4,199,679 | 4,199,679 |

**Top 10 with every mercenary stack strictly below the smallest troop stack**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 43 · ABT6 45 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 43 · ABT6 45 | 180 | 4,226,675 | 4,226,675 | 4,226,675 |
| 2 | EMH6 43 · ABT6 44 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 43 · ABT6 44 | 179 | 4,203,419 | 4,203,419 | 4,203,419 |
| 3 | EMH6 42 · ABT6 45 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · ABT6 45 · EMH6 42 | 179 | 4,197,767 | 4,197,767 | 4,197,767 |
| 4 | EMH6 43 · ABT6 45 · LGN6 46 · CHR6 22 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · EMH6 43 · ABT6 45 · CHR6 22 | 178 | 4,181,379 | 4,181,379 | 4,181,379 |
| 5 | EMH6 43 · ABT6 43 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 43 · ABT6 43 | 178 | 4,180,163 | 4,180,163 | 4,180,163 |
| 6 | EMH6 42 · ABT6 44 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 42 · ABT6 44 | 178 | 4,174,511 | 4,174,511 | 4,174,511 |
| 7 | EMH6 41 · ABT6 45 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · ABT6 45 · EMH6 41 | 178 | 4,168,861 | 4,168,861 | 4,168,861 |
| 8 | EMH6 43 · ABT6 44 · LGN6 46 · CHR6 22 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · EMH6 43 · ABT6 44 · CHR6 22 | 177 | 4,158,123 | 4,158,123 | 4,158,123 |
| 9 | EMH6 43 · ABT6 42 · LGN6 46 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · CHR6 23 · EMH6 43 · ABT6 42 | 177 | 4,156,907 | 4,156,907 | 4,156,907 |
| 10 | EMH6 42 · ABT6 45 · LGN6 46 · CHR6 22 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · LGN6 46 · ABT6 45 · EMH6 42 · CHR6 22 | 177 | 4,152,471 | 4,152,471 | 4,152,471 |

**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30 → EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 | 290 | 3,228,041 | 3,878,453 | 4,528,865 |
| 2 | EMH6 90 · ABT6 70 · LGN6 70 · CHR6 20 → EMH6 90 · ABT6 70 · LGN6 70 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · CHR6 20 | 270 | 3,198,827 | 3,849,239 | 4,499,651 |
| 3 | EMH6 80 · ABT6 70 · LGN6 70 · CHR6 30 → EMH6 80 · ABT6 70 · LGN6 70 · CHR6 30 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 | 280 | 3,228,041 | 3,806,185 | 4,384,329 |
| 4 | EMH6 40 · ABT6 40 · LGN6 70 · CHR6 20 → LGN6 70 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · EMH6 40 · ABT6 40 · CHR6 20 | 190 | 3,539,933 | 3,804,603 | 4,069,273 |
| 5 | EMH6 90 · ABT6 70 · LGN6 60 · CHR6 30 → EMH6 90 · ABT6 70 · LGN6 60 · CHR6 30 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 | 280 | 3,152,421 | 3,802,833 | 4,453,245 |

**Three stacks: LGN6 dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 43 · ABT6 47 · LGN6 0 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · ABT6 47 · RD3 279 · CHR6 23 · EMH6 43 | 136 | 3,378,819 | 3,378,819 | 3,378,819 |
| 2 | EMH6 43 · ABT6 46 · LGN6 0 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43 | 135 | 3,367,191 | 3,367,191 | 3,367,191 |
| 3 | EMH6 92 · ABT6 47 · LGN6 0 · CHR6 37 → EMH6 92 · CHR6 37 · SW1 1,794 · SP2 997 · RD2 497 · ABT6 47 · RD3 279 | 213 | 2,700,800 | 3,365,666 | 4,030,531 |
| 4 | EMH6 92 · ABT6 76 · LGN6 0 · CHR6 23 → EMH6 92 · ABT6 76 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · CHR6 23 | 214 | 2,695,328 | 3,360,194 | 4,025,059 |
| 5 | EMH6 91 · ABT6 47 · LGN6 0 · CHR6 37 → EMH6 91 · CHR6 37 · SW1 1,794 · SP2 997 · RD2 497 · ABT6 47 · RD3 279 | 212 | 2,700,800 | 3,358,439 | 4,016,078 |

**Two stacks: two types dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 43 · ABT6 47 · LGN6 0 · CHR6 0 → SW1 1,794 · SP2 997 · RD2 497 · ABT6 47 · RD3 279 · EMH6 43 | 90 | 2,337,011 | 2,337,011 | 2,337,011 |
| 2 | EMH6 43 · ABT6 46 · LGN6 0 · CHR6 0 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · EMH6 43 | 89 | 2,325,383 | 2,325,383 | 2,325,383 |
| 3 | EMH6 92 · ABT6 76 · LGN6 0 · CHR6 0 → EMH6 92 · ABT6 76 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 | 168 | 1,653,520 | 2,318,386 | 2,983,251 |
| 4 | EMH6 43 · ABT6 0 · LGN6 0 · CHR6 23 → SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · CHR6 23 · EMH6 43 | 89 | 2,311,399 | 2,311,399 | 2,311,399 |
| 5 | EMH6 91 · ABT6 76 · LGN6 0 · CHR6 0 → EMH6 91 · ABT6 76 · SW1 1,794 · SP2 997 · RD2 497 · RD3 279 | 167 | 1,653,520 | 2,311,159 | 2,968,798 |

sizer for comparison — ms 4,062,895 (SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43); msRelaxed 4,257,493 (SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43)

## A · K7 — troops ARC2 1,699 · RD2 847 · RD3 475, floor 469,775

mercenary stacks stay under the troops while EMH6 ≤ 74, ABT6 ≤ 80, LGN6 ≤ 80, CHR6 ≤ 40 (HP per unit 6,273 / 5,871 / 5,871 / 11,742); caps are 92 / 76 / 72 / 37.

19,864,614 vectors simulated in 265.1 s.

**Top 10 inside the caps, no ordering constraint**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 287 | 5,680,555 | 5,836,523 | 5,992,491 |
| 2 | EMH6 67 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 67 | 286 | 5,668,927 | 5,824,895 | 5,980,863 |
| 3 | EMH6 67 · ABT6 74 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 67 | 285 | 5,657,299 | 5,813,267 | 5,969,235 |
| 4 | EMH6 67 · ABT6 71 · LGN6 72 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 | 284 | 5,655,323 | 5,811,291 | 5,967,259 |
| 5 | EMH6 66 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 66 | 286 | 5,651,649 | 5,807,617 | 5,963,585 |
| 6 | EMH6 67 · ABT6 73 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 | 284 | 5,645,671 | 5,801,639 | 5,957,607 |
| 7 | EMH6 66 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 66 | 285 | 5,640,021 | 5,795,989 | 5,951,957 |
| 8 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 35 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · LGN6 72 · EMH6 67 · CHR6 35 | 285 | 5,635,259 | 5,791,227 | 5,947,195 |
| 9 | EMH6 67 · ABT6 72 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 72 · LGN6 72 · CHR6 36 · EMH6 67 | 283 | 5,634,043 | 5,790,011 | 5,945,979 |
| 10 | EMH6 67 · ABT6 71 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · LGN6 72 · CHR6 36 · EMH6 67 · ABT6 71 | 282 | 5,632,675 | 5,788,643 | 5,944,611 |

**Top 10 with every mercenary stack strictly below the smallest troop stack**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 287 | 5,680,555 | 5,836,523 | 5,992,491 |
| 2 | EMH6 67 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 67 | 286 | 5,668,927 | 5,824,895 | 5,980,863 |
| 3 | EMH6 67 · ABT6 74 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 67 | 285 | 5,657,299 | 5,813,267 | 5,969,235 |
| 4 | EMH6 67 · ABT6 71 · LGN6 72 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 | 284 | 5,655,323 | 5,811,291 | 5,967,259 |
| 5 | EMH6 66 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 66 | 286 | 5,651,649 | 5,807,617 | 5,963,585 |
| 6 | EMH6 67 · ABT6 73 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 | 284 | 5,645,671 | 5,801,639 | 5,957,607 |
| 7 | EMH6 66 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 66 | 285 | 5,640,021 | 5,795,989 | 5,951,957 |
| 8 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 35 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · LGN6 72 · EMH6 67 · CHR6 35 | 285 | 5,635,259 | 5,791,227 | 5,947,195 |
| 9 | EMH6 67 · ABT6 72 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 72 · LGN6 72 · CHR6 36 · EMH6 67 | 283 | 5,634,043 | 5,790,011 | 5,945,979 |
| 10 | EMH6 67 · ABT6 71 · LGN6 72 · CHR6 36 → ARC2 1,699 · RD2 847 · RD3 475 · LGN6 72 · CHR6 36 · EMH6 67 · ABT6 71 | 282 | 5,632,675 | 5,788,643 | 5,944,611 |

**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 60 · ABT6 70 · LGN6 70 · CHR6 30 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 70 · LGN6 70 · EMH6 60 · CHR6 30 | 260 | 5,121,537 | 5,277,505 | 5,433,473 |
| 2 | EMH6 70 · ABT6 60 · LGN6 70 · CHR6 30 → ARC2 1,699 · RD2 847 · RD3 475 · EMH6 70 · LGN6 70 · ABT6 60 · CHR6 30 | 260 | 4,980,257 | 5,136,225 | 5,292,193 |
| 3 | EMH6 70 · ABT6 70 · LGN6 70 · CHR6 30 → ARC2 1,699 · RD2 847 · RD3 475 · EMH6 70 · ABT6 70 · LGN6 70 · CHR6 30 | 270 | 4,928,197 | 5,084,165 | 5,240,133 |
| 4 | EMH6 60 · ABT6 60 · LGN6 70 · CHR6 30 → ARC2 1,699 · RD2 847 · RD3 475 · LGN6 70 · EMH6 60 · ABT6 60 · CHR6 30 | 250 | 4,835,721 | 4,991,689 | 5,147,657 |
| 5 | EMH6 50 · ABT6 70 · LGN6 70 · CHR6 30 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 70 · LGN6 70 · CHR6 30 · EMH6 50 | 250 | 4,832,465 | 4,988,433 | 5,144,401 |

**Three stacks: LGN6 dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 69 · ABT6 76 · LGN6 0 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · CHR6 37 · EMH6 69 | 219 | 4,401,225 | 4,557,193 | 4,713,161 |
| 2 | EMH6 69 · ABT6 75 · LGN6 0 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 75 · CHR6 37 · EMH6 69 | 218 | 4,389,597 | 4,545,565 | 4,701,533 |
| 3 | EMH6 69 · ABT6 74 · LGN6 0 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 74 · CHR6 37 · EMH6 69 | 217 | 4,377,969 | 4,533,937 | 4,689,905 |
| 4 | EMH6 68 · ABT6 76 · LGN6 0 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 76 · CHR6 37 · EMH6 68 | 218 | 4,372,319 | 4,528,287 | 4,684,255 |
| 5 | EMH6 68 · ABT6 75 · LGN6 0 · CHR6 37 → ARC2 1,699 · RD2 847 · RD3 475 · ABT6 75 · CHR6 37 · EMH6 68 | 217 | 4,360,691 | 4,516,659 | 4,672,627 |

**Two stacks: two types dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 75 · ABT6 76 · LGN6 0 · CHR6 0 → ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 | 151 | 2,652,673 | 2,808,641 | 2,964,609 |
| 2 | EMH6 75 · ABT6 75 · LGN6 0 · CHR6 0 → ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 75 | 150 | 2,641,045 | 2,797,013 | 2,952,981 |
| 3 | EMH6 74 · ABT6 76 · LGN6 0 · CHR6 0 → ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 | 150 | 2,638,219 | 2,794,187 | 2,950,155 |
| 4 | EMH6 75 · ABT6 74 · LGN6 0 · CHR6 0 → ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 74 | 149 | 2,629,417 | 2,785,385 | 2,941,353 |
| 5 | EMH6 74 · ABT6 75 · LGN6 0 · CHR6 0 → ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 75 | 149 | 2,626,591 | 2,782,559 | 2,938,527 |

sizer for comparison — ms 5,559,067 (ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72); msRelaxed 5,573,521 (ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72)

## A · K8 — troops ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341, floor 337,249

mercenary stacks stay under the troops while EMH6 ≤ 53, ABT6 ≤ 57, LGN6 ≤ 57, CHR6 ≤ 28 (HP per unit 6,273 / 5,871 / 5,871 / 11,742); caps are 92 / 76 / 72 / 37.

19,864,614 vectors simulated in 277.9 s.

**Top 10 inside the caps, no ordering constraint**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 28 | 222 | 5,203,661 | 5,315,933 | 5,428,204 |
| 2 | EMH6 53 · ABT6 55 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 55 | 221 | 5,180,405 | 5,292,677 | 5,404,948 |
| 3 | EMH6 53 · ABT6 57 · LGN6 72 · CHR6 28 → LGN6 72 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 238 | 5,020,426 | 5,292,658 | 5,564,890 |
| 4 | EMH6 53 · ABT6 57 · LGN6 71 · CHR6 28 → LGN6 71 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 237 | 5,020,426 | 5,288,877 | 5,557,328 |
| 5 | EMH6 52 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · ABT6 56 · CHR6 28 · EMH6 52 | 221 | 5,174,753 | 5,287,025 | 5,399,296 |
| 6 | EMH6 53 · ABT6 57 · LGN6 70 · CHR6 28 → LGN6 70 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 236 | 5,020,426 | 5,285,096 | 5,549,766 |
| 7 | EMH6 53 · ABT6 57 · LGN6 69 · CHR6 28 → LGN6 69 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 235 | 5,020,426 | 5,281,315 | 5,542,204 |
| 8 | EMH6 53 · ABT6 57 · LGN6 68 · CHR6 28 → LGN6 68 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 234 | 5,020,426 | 5,277,534 | 5,534,642 |
| 9 | EMH6 53 · ABT6 57 · LGN6 67 · CHR6 28 → LGN6 67 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 233 | 5,020,426 | 5,273,753 | 5,527,080 |
| 10 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 27 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 27 | 220 | 5,158,365 | 5,270,637 | 5,382,908 |

**Top 10 with every mercenary stack strictly below the smallest troop stack**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 28 | 222 | 5,203,661 | 5,315,933 | 5,428,204 |
| 2 | EMH6 53 · ABT6 55 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 55 | 221 | 5,180,405 | 5,292,677 | 5,404,948 |
| 3 | EMH6 52 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · ABT6 56 · CHR6 28 · EMH6 52 | 221 | 5,174,753 | 5,287,025 | 5,399,296 |
| 4 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 27 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 27 | 220 | 5,158,365 | 5,270,637 | 5,382,908 |
| 5 | EMH6 53 · ABT6 54 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 54 | 220 | 5,157,149 | 5,269,421 | 5,381,692 |
| 6 | EMH6 52 · ABT6 55 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · CHR6 28 · EMH6 52 · ABT6 55 | 220 | 5,151,497 | 5,263,769 | 5,376,040 |
| 7 | EMH6 51 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · ABT6 56 · CHR6 28 · EMH6 51 | 220 | 5,145,847 | 5,258,119 | 5,370,390 |
| 8 | EMH6 52 · ABT6 55 · LGN6 56 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 56 · CHR6 28 · EMH6 52 · ABT6 55 | 219 | 5,143,935 | 5,256,207 | 5,368,478 |
| 9 | EMH6 53 · ABT6 55 · LGN6 57 · CHR6 27 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · ABT6 55 · CHR6 27 | 219 | 5,135,109 | 5,247,381 | 5,359,652 |
| 10 | EMH6 53 · ABT6 53 · LGN6 57 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 53 | 219 | 5,133,893 | 5,246,165 | 5,358,436 |

**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 50 · ABT6 50 · LGN6 70 · CHR6 30 → LGN6 70 · CHR6 30 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · EMH6 50 · ABT6 50 | 230 | 4,453,773 | 4,718,443 | 4,983,113 |
| 2 | EMH6 50 · ABT6 50 · LGN6 60 · CHR6 30 → LGN6 60 · CHR6 30 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · EMH6 50 · ABT6 50 | 220 | 4,453,773 | 4,680,633 | 4,907,493 |
| 3 | EMH6 50 · ABT6 50 · LGN6 70 · CHR6 20 → LGN6 70 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · EMH6 50 · ABT6 50 · CHR6 20 | 210 | 4,408,544 | 4,673,214 | 4,937,884 |
| 4 | EMH6 50 · ABT6 50 · LGN6 60 · CHR6 20 → LGN6 60 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · EMH6 50 · ABT6 50 · CHR6 20 | 200 | 4,408,544 | 4,635,404 | 4,862,264 |
| 5 | EMH6 50 · ABT6 50 · LGN6 50 · CHR6 30 → CHR6 30 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · EMH6 50 · ABT6 50 · LGN6 50 | 210 | 4,258,824 | 4,598,544 | 4,938,264 |

**Three stacks: LGN6 dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 57 · LGN6 0 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28 | 166 | 4,133,087 | 4,245,359 | 4,357,630 |
| 2 | EMH6 52 · ABT6 57 · LGN6 0 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · CHR6 28 · EMH6 52 | 165 | 4,104,179 | 4,216,451 | 4,328,722 |
| 3 | EMH6 52 · ABT6 56 · LGN6 0 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 56 · CHR6 28 · EMH6 52 | 164 | 4,092,551 | 4,204,823 | 4,317,094 |
| 4 | EMH6 53 · ABT6 57 · LGN6 0 · CHR6 27 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 27 | 164 | 4,087,791 | 4,200,063 | 4,312,334 |
| 5 | EMH6 52 · ABT6 55 · LGN6 0 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · CHR6 28 · EMH6 52 · ABT6 55 | 163 | 4,086,319 | 4,198,591 | 4,310,862 |

**Two stacks: two types dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 57 · LGN6 0 · CHR6 0 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 | 110 | 2,864,799 | 2,977,071 | 3,089,342 |
| 2 | EMH6 52 · ABT6 57 · LGN6 0 · CHR6 0 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 52 | 109 | 2,835,891 | 2,948,163 | 3,060,434 |
| 3 | EMH6 52 · ABT6 56 · LGN6 0 · CHR6 0 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 56 · EMH6 52 | 108 | 2,824,263 | 2,936,535 | 3,048,806 |
| 4 | EMH6 52 · ABT6 0 · LGN6 0 · CHR6 28 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · CHR6 28 · EMH6 52 | 108 | 2,807,239 | 2,919,511 | 3,031,782 |
| 5 | EMH6 51 · ABT6 57 · LGN6 0 · CHR6 0 → ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 51 | 108 | 2,806,985 | 2,919,257 | 3,031,528 |

sizer for comparison — ms 5,107,427 (ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28); msRelaxed 5,239,724 (LGN6 58 · ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · EMH6 53 · CHR6 28)

## B · E8 — troops SW1 2,307 · SP2 796 · RD2 397 · RD3 223, floor 520,259

mercenary stacks stay under the troops while EMH6 ≤ 35, ABT6 ≤ 37, LGN6 ≤ 37, CHR6 ≤ 18 (HP per unit 14,799 / 13,880 / 13,851 / 27,702); caps are 92 / 76 / 72 / 37.

19,864,614 vectors simulated in 258.1 s.

**Top 10 inside the caps, no ordering constraint**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37 → EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 314 | 4,928,011 | 5,764,696 | 6,601,381 |
| 2 | EMH6 91 · ABT6 76 · LGN6 72 · CHR6 37 → EMH6 91 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 313 | 4,928,011 | 5,755,602 | 6,583,192 |
| 3 | EMH6 92 · ABT6 76 · LGN6 71 · CHR6 37 → EMH6 92 · ABT6 76 · CHR6 37 · LGN6 71 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 313 | 4,916,953 | 5,753,638 | 6,590,323 |
| 4 | EMH6 92 · ABT6 75 · LGN6 72 · CHR6 37 → EMH6 92 · ABT6 75 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 313 | 4,912,868 | 5,749,553 | 6,586,238 |
| 5 | EMH6 90 · ABT6 76 · LGN6 72 · CHR6 37 → EMH6 90 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 312 | 4,928,011 | 5,746,507 | 6,565,003 |
| 6 | EMH6 91 · ABT6 76 · LGN6 71 · CHR6 37 → EMH6 91 · ABT6 76 · CHR6 37 · LGN6 71 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 312 | 4,916,953 | 5,744,544 | 6,572,134 |
| 7 | EMH6 92 · ABT6 76 · LGN6 70 · CHR6 37 → EMH6 92 · ABT6 76 · CHR6 37 · LGN6 70 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 312 | 4,905,895 | 5,742,580 | 6,579,265 |
| 8 | EMH6 91 · ABT6 75 · LGN6 72 · CHR6 37 → EMH6 91 · ABT6 75 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 312 | 4,912,868 | 5,740,459 | 6,568,049 |
| 9 | EMH6 92 · ABT6 75 · LGN6 71 · CHR6 37 → EMH6 92 · ABT6 75 · CHR6 37 · LGN6 71 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 312 | 4,901,810 | 5,738,495 | 6,575,180 |
| 10 | EMH6 89 · ABT6 76 · LGN6 72 · CHR6 37 → EMH6 89 · ABT6 76 · CHR6 37 · LGN6 72 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 311 | 4,928,011 | 5,737,413 | 6,546,814 |

**Top 10 with every mercenary stack strictly below the smallest troop stack**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 34 · ABT6 36 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · EMH6 34 · ABT6 36 · CHR6 18 | 143 | 4,635,304 | 4,635,304 | 4,635,304 |
| 2 | EMH6 34 · ABT6 35 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · EMH6 34 · CHR6 18 · ABT6 35 | 142 | 4,605,018 | 4,605,018 | 4,605,018 |
| 3 | EMH6 33 · ABT6 36 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · ABT6 36 · CHR6 18 · EMH6 33 | 142 | 4,598,926 | 4,598,926 | 4,598,926 |
| 4 | EMH6 34 · ABT6 36 · LGN6 37 · CHR6 17 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · EMH6 34 · ABT6 36 · CHR6 17 | 141 | 4,576,024 | 4,576,024 | 4,576,024 |
| 5 | EMH6 34 · ABT6 34 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · EMH6 34 · CHR6 18 · ABT6 34 | 141 | 4,574,732 | 4,574,732 | 4,574,732 |
| 6 | EMH6 33 · ABT6 35 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · CHR6 18 · EMH6 33 · ABT6 35 | 141 | 4,568,640 | 4,568,640 | 4,568,640 |
| 7 | EMH6 32 · ABT6 36 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · ABT6 36 · CHR6 18 · EMH6 32 | 141 | 4,562,550 | 4,562,550 | 4,562,550 |
| 8 | EMH6 33 · ABT6 35 · LGN6 36 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 36 · CHR6 18 · EMH6 33 · ABT6 35 | 140 | 4,557,582 | 4,557,582 | 4,557,582 |
| 9 | EMH6 34 · ABT6 35 · LGN6 37 · CHR6 17 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · EMH6 34 · ABT6 35 · CHR6 17 | 140 | 4,545,738 | 4,545,738 | 4,545,738 |
| 10 | EMH6 34 · ABT6 33 · LGN6 37 · CHR6 18 → SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · LGN6 37 · EMH6 34 · CHR6 18 · ABT6 33 | 140 | 4,544,446 | 4,544,446 | 4,544,446 |

**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30 → EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 290 | 4,607,557 | 5,426,053 | 6,244,549 |
| 2 | EMH6 80 · ABT6 70 · LGN6 70 · CHR6 30 → EMH6 80 · ABT6 70 · LGN6 70 · CHR6 30 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 280 | 4,607,557 | 5,335,109 | 6,062,661 |
| 3 | EMH6 90 · ABT6 70 · LGN6 60 · CHR6 30 → EMH6 90 · ABT6 70 · LGN6 60 · CHR6 30 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 280 | 4,496,977 | 5,315,473 | 6,133,969 |
| 4 | EMH6 90 · ABT6 60 · LGN6 70 · CHR6 30 → EMH6 90 · LGN6 70 · ABT6 60 · CHR6 30 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 280 | 4,456,127 | 5,274,623 | 6,093,119 |
| 5 | EMH6 70 · ABT6 70 · LGN6 70 · CHR6 30 → EMH6 70 · ABT6 70 · LGN6 70 · CHR6 30 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 270 | 4,607,557 | 5,244,165 | 5,880,773 |

**Three stacks: LGN6 dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 92 · ABT6 76 · LGN6 0 · CHR6 37 → EMH6 92 · ABT6 76 · CHR6 37 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 242 | 3,663,642 | 4,500,327 | 5,337,012 |
| 2 | EMH6 91 · ABT6 76 · LGN6 0 · CHR6 37 → EMH6 91 · ABT6 76 · CHR6 37 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 241 | 3,663,642 | 4,491,233 | 5,318,823 |
| 3 | EMH6 92 · ABT6 75 · LGN6 0 · CHR6 37 → EMH6 92 · ABT6 75 · CHR6 37 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 241 | 3,648,499 | 4,485,184 | 5,321,869 |
| 4 | EMH6 90 · ABT6 76 · LGN6 0 · CHR6 37 → EMH6 90 · ABT6 76 · CHR6 37 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 240 | 3,663,642 | 4,482,138 | 5,300,634 |
| 5 | EMH6 91 · ABT6 75 · LGN6 0 · CHR6 37 → EMH6 91 · ABT6 75 · CHR6 37 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 240 | 3,648,499 | 4,476,090 | 5,303,680 |

**Two stacks: two types dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 92 · ABT6 76 · LGN6 0 · CHR6 0 → EMH6 92 · ABT6 76 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 168 | 2,291,841 | 3,128,526 | 3,965,211 |
| 2 | EMH6 91 · ABT6 76 · LGN6 0 · CHR6 0 → EMH6 91 · ABT6 76 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 167 | 2,291,841 | 3,119,432 | 3,947,022 |
| 3 | EMH6 92 · ABT6 75 · LGN6 0 · CHR6 0 → EMH6 92 · ABT6 75 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 167 | 2,276,698 | 3,113,383 | 3,950,068 |
| 4 | EMH6 90 · ABT6 76 · LGN6 0 · CHR6 0 → EMH6 90 · ABT6 76 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 166 | 2,291,841 | 3,110,337 | 3,928,833 |
| 5 | EMH6 91 · ABT6 75 · LGN6 0 · CHR6 0 → EMH6 91 · ABT6 75 · SW1 2,307 · SP2 796 · RD2 397 · RD3 223 | 166 | 2,276,698 | 3,104,289 | 3,931,879 |

sizer for comparison — ms 4,474,506 (SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18); msRelaxed 4,474,506 (SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18)

## B · K7 — troops ARC2 1,697 · RD2 848 · RD3 475, floor 1,108,175

mercenary stacks stay under the troops while EMH6 ≤ 74, ABT6 ≤ 79, LGN6 ≤ 80, CHR6 ≤ 40 (HP per unit 14,799 / 13,880 / 13,851 / 27,702); caps are 92 / 76 / 72 / 37.

19,864,614 vectors simulated in 213.7 s.

**Top 10 inside the caps, no ordering constraint**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 287 | 7,764,248 | 8,061,308 | 8,358,368 |
| 2 | EMH6 67 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 67 | 286 | 7,749,105 | 8,046,165 | 8,343,225 |
| 3 | EMH6 67 · ABT6 74 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 67 | 285 | 7,733,962 | 8,031,022 | 8,328,082 |
| 4 | EMH6 66 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 66 | 286 | 7,727,870 | 8,024,930 | 8,321,990 |
| 5 | EMH6 67 · ABT6 71 · LGN6 72 · CHR6 37 → ARC2 1,697 · RD2 848 · RD3 475 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 | 284 | 7,726,286 | 8,023,346 | 8,320,406 |
| 6 | EMH6 67 · ABT6 73 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 | 284 | 7,718,819 | 8,015,879 | 8,312,939 |
| 7 | EMH6 66 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 66 | 285 | 7,712,727 | 8,009,787 | 8,306,847 |
| 8 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 35 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · EMH6 67 · CHR6 35 | 285 | 7,704,968 | 8,002,028 | 8,299,088 |
| 9 | EMH6 67 · ABT6 72 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 72 · LGN6 72 · CHR6 36 · EMH6 67 | 283 | 7,703,676 | 8,000,736 | 8,297,796 |
| 10 | EMH6 66 · ABT6 74 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 66 | 284 | 7,697,584 | 7,994,644 | 8,291,704 |

**Top 10 with every mercenary stack strictly below the smallest troop stack**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 287 | 7,764,248 | 8,061,308 | 8,358,368 |
| 2 | EMH6 67 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 67 | 286 | 7,749,105 | 8,046,165 | 8,343,225 |
| 3 | EMH6 67 · ABT6 74 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 67 | 285 | 7,733,962 | 8,031,022 | 8,328,082 |
| 4 | EMH6 66 · ABT6 76 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 66 | 286 | 7,727,870 | 8,024,930 | 8,321,990 |
| 5 | EMH6 67 · ABT6 71 · LGN6 72 · CHR6 37 → ARC2 1,697 · RD2 848 · RD3 475 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 | 284 | 7,726,286 | 8,023,346 | 8,320,406 |
| 6 | EMH6 67 · ABT6 73 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 | 284 | 7,718,819 | 8,015,879 | 8,312,939 |
| 7 | EMH6 66 · ABT6 75 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 66 | 285 | 7,712,727 | 8,009,787 | 8,306,847 |
| 8 | EMH6 67 · ABT6 76 · LGN6 72 · CHR6 35 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · EMH6 67 · CHR6 35 | 285 | 7,704,968 | 8,002,028 | 8,299,088 |
| 9 | EMH6 67 · ABT6 72 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 72 · LGN6 72 · CHR6 36 · EMH6 67 | 283 | 7,703,676 | 8,000,736 | 8,297,796 |
| 10 | EMH6 66 · ABT6 74 · LGN6 72 · CHR6 36 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 66 | 284 | 7,697,584 | 7,994,644 | 8,291,704 |

**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 60 · ABT6 70 · LGN6 70 · CHR6 30 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 70 · LGN6 70 · EMH6 60 · CHR6 30 | 260 | 7,040,950 | 7,338,010 | 7,635,070 |
| 2 | EMH6 70 · ABT6 70 · LGN6 70 · CHR6 30 → ARC2 1,697 · RD2 848 · RD3 475 · EMH6 70 · ABT6 70 · LGN6 70 · CHR6 30 | 270 | 6,905,570 | 7,202,630 | 7,499,690 |
| 3 | EMH6 70 · ABT6 60 · LGN6 70 · CHR6 30 → ARC2 1,697 · RD2 848 · RD3 475 · EMH6 70 · LGN6 70 · ABT6 60 · CHR6 30 | 260 | 6,888,660 | 7,185,720 | 7,482,780 |
| 4 | EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30 → EMH6 90 · ARC2 1,697 · RD2 848 · RD3 475 · ABT6 70 · LGN6 70 · CHR6 30 | 290 | 6,226,474 | 7,044,970 | 7,863,466 |
| 5 | EMH6 90 · ABT6 60 · LGN6 70 · CHR6 30 → EMH6 90 · ARC2 1,697 · RD2 848 · RD3 475 · LGN6 70 · ABT6 60 · CHR6 30 | 280 | 6,209,564 | 7,028,060 | 7,846,556 |

**Three stacks: LGN6 dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 69 · ABT6 76 · LGN6 0 · CHR6 37 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · CHR6 37 · EMH6 69 | 219 | 6,003,426 | 6,300,486 | 6,597,546 |
| 2 | EMH6 69 · ABT6 75 · LGN6 0 · CHR6 37 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 75 · CHR6 37 · EMH6 69 | 218 | 5,988,283 | 6,285,343 | 6,582,403 |
| 3 | EMH6 69 · ABT6 74 · LGN6 0 · CHR6 37 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 74 · CHR6 37 · EMH6 69 | 217 | 5,973,140 | 6,270,200 | 6,567,260 |
| 4 | EMH6 68 · ABT6 76 · LGN6 0 · CHR6 37 → ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · CHR6 37 · EMH6 68 | 218 | 5,967,048 | 6,264,108 | 6,561,168 |
| 5 | EMH6 75 · ABT6 76 · LGN6 0 · CHR6 37 → ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 | 225 | 5,954,212 | 6,251,272 | 6,548,332 |

**Two stacks: two types dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 75 · ABT6 76 · LGN6 0 · CHR6 0 → ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 | 151 | 3,760,852 | 4,057,912 | 4,354,972 |
| 2 | EMH6 75 · ABT6 75 · LGN6 0 · CHR6 0 → ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 75 | 150 | 3,745,709 | 4,042,769 | 4,339,829 |
| 3 | EMH6 74 · ABT6 76 · LGN6 0 · CHR6 0 → ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 | 150 | 3,742,663 | 4,039,723 | 4,336,783 |
| 4 | EMH6 75 · ABT6 74 · LGN6 0 · CHR6 0 → ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 74 | 149 | 3,730,566 | 4,027,626 | 4,324,686 |
| 5 | EMH6 74 · ABT6 75 · LGN6 0 · CHR6 0 → ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 75 | 149 | 3,727,520 | 4,024,580 | 4,321,640 |

sizer for comparison — ms 7,825,435 (ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72); msRelaxed 7,843,624 (ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72)

## B · K8 — troops ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342, floor 797,886

mercenary stacks stay under the troops while EMH6 ≤ 53, ABT6 ≤ 57, LGN6 ≤ 57, CHR6 ≤ 28 (HP per unit 14,799 / 13,880 / 13,851 / 27,702); caps are 92 / 76 / 72 / 37.

19,864,614 vectors simulated in 232.6 s.

**Top 10 inside the caps, no ordering constraint**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 57 · LGN6 72 · CHR6 28 → LGN6 72 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 238 | 7,017,446 | 7,415,534 | 7,813,622 |
| 2 | EMH6 53 · ABT6 57 · LGN6 71 · CHR6 28 → LGN6 71 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 237 | 7,017,446 | 7,410,005 | 7,802,564 |
| 3 | EMH6 53 · ABT6 57 · LGN6 70 · CHR6 28 → LGN6 70 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 236 | 7,017,446 | 7,404,476 | 7,791,506 |
| 4 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 28 | 222 | 7,189,994 | 7,403,730 | 7,617,466 |
| 5 | EMH6 53 · ABT6 57 · LGN6 69 · CHR6 28 → LGN6 69 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 235 | 7,017,446 | 7,398,947 | 7,780,448 |
| 6 | EMH6 53 · ABT6 57 · LGN6 68 · CHR6 28 → LGN6 68 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 234 | 7,017,446 | 7,393,418 | 7,769,390 |
| 7 | EMH6 53 · ABT6 57 · LGN6 67 · CHR6 28 → LGN6 67 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 233 | 7,017,446 | 7,387,889 | 7,758,332 |
| 8 | EMH6 53 · ABT6 56 · LGN6 72 · CHR6 28 → LGN6 72 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 53 · ABT6 56 · CHR6 28 | 237 | 6,987,160 | 7,385,248 | 7,783,336 |
| 9 | EMH6 53 · ABT6 57 · LGN6 66 · CHR6 28 → LGN6 66 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 232 | 7,017,446 | 7,382,360 | 7,747,274 |
| 10 | EMH6 53 · ABT6 56 · LGN6 71 · CHR6 28 → LGN6 71 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 53 · ABT6 56 · CHR6 28 | 236 | 6,987,160 | 7,379,719 | 7,772,278 |

**Top 10 with every mercenary stack strictly below the smallest troop stack**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 28 | 222 | 7,189,994 | 7,403,730 | 7,617,466 |
| 2 | EMH6 53 · ABT6 55 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 55 | 221 | 7,159,708 | 7,373,444 | 7,587,180 |
| 3 | EMH6 52 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · ABT6 56 · CHR6 28 · EMH6 52 | 221 | 7,153,618 | 7,367,354 | 7,581,090 |
| 4 | EMH6 53 · ABT6 56 · LGN6 57 · CHR6 27 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · ABT6 56 · CHR6 27 | 220 | 7,130,714 | 7,344,450 | 7,558,186 |
| 5 | EMH6 53 · ABT6 54 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 54 | 220 | 7,129,422 | 7,343,158 | 7,556,894 |
| 6 | EMH6 52 · ABT6 55 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · CHR6 28 · EMH6 52 · ABT6 55 | 220 | 7,123,332 | 7,337,068 | 7,550,804 |
| 7 | EMH6 51 · ABT6 56 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · ABT6 56 · CHR6 28 · EMH6 51 | 220 | 7,117,240 | 7,330,976 | 7,544,712 |
| 8 | EMH6 52 · ABT6 55 · LGN6 56 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 56 · CHR6 28 · EMH6 52 · ABT6 55 | 219 | 7,112,274 | 7,326,010 | 7,539,746 |
| 9 | EMH6 53 · ABT6 55 · LGN6 57 · CHR6 27 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · ABT6 55 · CHR6 27 | 219 | 7,100,428 | 7,314,164 | 7,527,900 |
| 10 | EMH6 53 · ABT6 53 · LGN6 57 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · LGN6 57 · EMH6 53 · CHR6 28 · ABT6 53 | 219 | 7,099,136 | 7,312,872 | 7,526,608 |

**Best vectors with every count a multiple of ten** (the Temple loses ceil(n/10) units for good, so 41 costs what 50 costs)
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 50 · ABT6 50 · LGN6 70 · CHR6 30 → LGN6 70 · CHR6 30 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 50 · ABT6 50 | 230 | 6,399,547 | 6,786,577 | 7,173,607 |
| 2 | EMH6 50 · ABT6 50 · LGN6 60 · CHR6 30 → LGN6 60 · CHR6 30 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 50 · ABT6 50 | 220 | 6,399,547 | 6,731,287 | 7,063,027 |
| 3 | EMH6 50 · ABT6 70 · LGN6 70 · CHR6 30 → ABT6 70 · LGN6 70 · CHR6 30 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 50 | 250 | 6,081,344 | 6,611,349 | 7,141,354 |
| 4 | EMH6 50 · ABT6 50 · LGN6 70 · CHR6 20 → LGN6 70 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 50 · ABT6 50 · CHR6 20 | 210 | 6,222,072 | 6,609,102 | 6,996,132 |
| 5 | EMH6 50 · ABT6 60 · LGN6 70 · CHR6 30 → LGN6 70 · ABT6 60 · CHR6 30 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · EMH6 50 | 240 | 6,215,864 | 6,602,894 | 6,989,924 |

**Three stacks: LGN6 dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 57 · LGN6 0 · CHR6 28 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 · CHR6 28 | 166 | 5,726,823 | 5,940,559 | 6,154,295 |
| 2 | EMH6 92 · ABT6 57 · LGN6 0 · CHR6 28 → EMH6 92 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · CHR6 28 | 205 | 5,089,434 | 5,926,119 | 6,762,804 |
| 3 | EMH6 91 · ABT6 57 · LGN6 0 · CHR6 28 → EMH6 91 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · CHR6 28 | 204 | 5,089,434 | 5,917,025 | 6,744,615 |
| 4 | EMH6 90 · ABT6 57 · LGN6 0 · CHR6 28 → EMH6 90 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · CHR6 28 | 203 | 5,089,434 | 5,907,930 | 6,726,426 |
| 5 | EMH6 53 · ABT6 57 · LGN6 0 · CHR6 37 → CHR6 37 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 | 184 | 5,357,606 | 5,905,946 | 6,454,286 |

**Two stacks: two types dropped**
| # | vector → march in kill order | authority | min | avg | max |
|---|---|---|---|---|---|
| 1 | EMH6 53 · ABT6 57 · LGN6 0 · CHR6 0 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 53 | 110 | 4,066,983 | 4,280,719 | 4,494,455 |
| 2 | EMH6 92 · ABT6 57 · LGN6 0 · CHR6 0 → EMH6 92 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 | 149 | 3,429,594 | 4,266,279 | 5,102,964 |
| 3 | EMH6 91 · ABT6 57 · LGN6 0 · CHR6 0 → EMH6 91 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 | 148 | 3,429,594 | 4,257,185 | 5,084,775 |
| 4 | EMH6 90 · ABT6 57 · LGN6 0 · CHR6 0 → EMH6 90 · ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 | 147 | 3,429,594 | 4,248,090 | 5,066,586 |
| 5 | EMH6 52 · ABT6 57 · LGN6 0 · CHR6 0 → ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · EMH6 52 | 109 | 4,030,607 | 4,244,343 | 4,458,079 |

sizer for comparison — ms 7,201,171 (ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28); msRelaxed 7,201,171 (ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28)

## Summary

| scenario | base | sizer ms | sizer msRelaxed | best under caps | best with mercs last | best × 10 | 3 stacks (no LGN6) | 2 stacks |
|---|---|---|---|---|---|---|---|---|
| A | E8 | 4,062,895 | 4,257,493 | 4,257,493 | 4,226,675 | 3,878,453 | 3,378,819 | 2,337,011 |
| A | K7 | 5,559,067 | 5,573,521 | 5,836,523 | 5,836,523 | 5,277,505 | 4,557,193 | 2,808,641 |
| A | K8 | 5,107,427 | 5,239,724 | 5,315,933 | 5,315,933 | 4,718,443 | 4,245,359 | 2,977,071 |
| B | E8 | 4,474,506 | 4,474,506 | 5,764,696 | 4,635,304 | 5,426,053 | 4,500,327 | 3,128,526 |
| B | K7 | 7,825,435 | 7,843,624 | 8,061,308 | 8,061,308 | 7,338,010 | 6,300,486 | 4,057,912 |
| B | K8 | 7,201,171 | 7,201,171 | 7,415,534 | 7,403,730 | 6,786,577 | 5,940,559 | 4,280,719 |
