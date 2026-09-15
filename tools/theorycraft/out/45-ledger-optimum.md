# 45 — the ledger and the exact optimum

Scenario C self-check against the 2026-09-14 report (`02-kai-report`): EMH6 16, unit HP 15,773 (report 252,369 / 16 = 15,773), one hit 291,670 with 197,803 of features (report entry 14: 291,670 incl. 197,803).

## §1 The ledger — what one unit of each type is worth

Scenario C (the account as it fights):

| unit | pool | cost | HP/unit | HP per pool pt | dmg/hit/unit α | k = α/HP | α per pool pt | n* | total HP(n*) | dmg/hit(n*) |
|---|---|---|---|---|---|---|---|---|---|---|
| EMH6 | authority | 1 | 15,773 | 15,773 | 18,229 | 1.156 | 18,229 | 92 | 1,451,116 | 1,677,105 |
| ABT6 | authority | 1 | 14,906 | 14,906 | 15,200 | 1.020 | 15,200 | 76 | 1,132,856 | 1,155,200 |
| CHR6 | authority | 2 | 29,754 | 14,877 | 29,754 | 1.000 | 14,877 | 37 | 1,100,898 | 1,100,898 |
| LGN6 | authority | 1 | 14,877 | 14,877 | 11,115 | 0.747 | 11,115 | 72 | 1,071,144 | 800,280 |
| RD3 | leadership | 2 | 2,506 | 1,253 | 1,395 | 0.557 | 697.5 | 2,171 | 5,440,526 | 3,028,979 |
| ARC2 | leadership | 1 | 706 | 706 | 353 | 0.500 | 353 | 4,343 | 3,066,158 | 1,532,210 |
| RD2 | leadership | 2 | 1,409 | 704.5 | 698 | 0.495 | 349 | 2,171 | 3,058,939 | 1,516,226 |
| SP2 | leadership | 1 | 705 | 705 | 314 | 0.445 | 314 | 4,343 | 3,061,815 | 1,364,136 |
| ARC1 | leadership | 1 | 392 | 392 | 179 | 0.457 | 179 | 4,343 | 1,702,456 | 777,397 |
| RD1 | leadership | 2 | 783 | 391.5 | 355 | 0.453 | 177.5 | 2,171 | 1,699,893 | 770,705 |
| SP1 | leadership | 1 | 392 | 392 | 165 | 0.421 | 165 | 4,343 | 1,702,456 | 714,424 |
| SW1 | leadership | 1 | 153 | 153 | 61 | 0.399 | 61 | 4,343 | 664,479 | 262,752 |

Scenario B (2026-09-13 bonuses):

| unit | pool | cost | HP/unit | HP per pool pt | dmg/hit/unit α | k = α/HP | α per pool pt | n* | total HP(n*) | dmg/hit(n*) |
|---|---|---|---|---|---|---|---|---|---|---|
| EMH6 | authority | 1 | 14,799 | 14,799 | 18,189 | 1.229 | 18,189 | 92 | 1,361,508 | 1,673,370 |
| ABT6 | authority | 1 | 13,880 | 13,880 | 15,143 | 1.091 | 15,143 | 76 | 1,054,880 | 1,150,868 |
| CHR6 | authority | 2 | 27,702 | 13,851 | 29,640 | 1.070 | 14,820 | 37 | 1,024,974 | 1,096,680 |
| LGN6 | authority | 1 | 13,851 | 13,851 | 11,058 | 0.798 | 11,058 | 72 | 997,272 | 796,176 |
| RD3 | leadership | 2 | 2,333 | 1,166.5 | 1,386 | 0.594 | 693 | 2,171 | 5,064,943 | 3,008,138 |
| ARC2 | leadership | 1 | 657 | 657 | 350 | 0.533 | 350 | 4,343 | 2,853,351 | 1,520,484 |
| RD2 | leadership | 2 | 1,312 | 656 | 693 | 0.528 | 346.5 | 2,171 | 2,848,352 | 1,504,503 |
| SP2 | leadership | 1 | 656 | 656 | 311 | 0.474 | 311 | 4,343 | 2,849,008 | 1,352,410 |
| ARC1 | leadership | 1 | 365 | 365 | 178 | 0.488 | 178 | 4,343 | 1,585,195 | 770,883 |
| RD1 | leadership | 2 | 729 | 364.5 | 352 | 0.483 | 176 | 2,171 | 1,582,659 | 764,192 |
| SP1 | leadership | 1 | 365 | 365 | 163 | 0.447 | 163 | 4,343 | 1,585,195 | 707,909 |
| SW1 | leadership | 1 | 227 | 227 | 96 | 0.423 | 96 | 4,343 | 985,861 | 414,757 |

Rows are sorted by damage per point of pool (α ÷ cost). Two ratios rank a type and nothing else does: **damage per point of pool** decides whether the type is worth its leadership or authority at all, and **k = damage per HP** decides where in the ladder it has to sit — the enemy kills by HP, so a type with a high k must be small (it is the damage) and a type with a low k must be big (it is the sponge).

## §2 The identity

| march | stacks | Σ hits × per-hit (enemy-first) vs min | Σ … (army-first) vs max | Δ | closed form (Σ hits̄ · HP · k) | Δ closed | orders agree | τ(position, k) | τ(position, α/cost) |
|---|---|---|---|---|---|---|---|---|---|
| owner’s real march (2026-09-14), C | 11 | 3,767,986 vs 3,767,986 | 3,908,634 vs 3,908,634 | 0, 0 | 3,838,310 | 0 | yes | 0.818 | 0.891 |
| the sizer, all 12 types, C | 12 | 4,976,278 vs 4,976,278 | 6,653,383 vs 6,653,383 | 0, 0 | 5,814,831 | 0 | no | -0.333 | -0.273 |
| 0015’s 7-type winner, C | 7 | 7,579,724 vs 7,579,724 | 8,178,426 vs 8,178,426 | 0, 0 | 7,879,075 | 0 | yes | 0.333 | 0.333 |
| 0015’s 7-type winner + hand-tuned mercs, C | 7 | 7,795,471 vs 7,795,471 | 8,394,173 vs 8,394,173 | 0, 0 | 8,094,822 | 0 | yes | 0.714 | 0.714 |
| flat ladder, all 12 types, C | 12 | 4,868,270 vs 4,868,270 | 6,545,375 vs 6,545,375 | 0, 0 | 5,801,246 | 94,423 | no | -0.485 | -0.485 |
| flat ladder, 3 sponges + mercs, C | 7 | 6,810,154 vs 6,810,154 | 8,487,259 vs 8,487,259 | 0, 0 | 7,648,707 | 0 | yes | 0.048 | 0.048 |
| 0015’s 7-type winner, B | 7 | 7,546,564 vs 7,546,564 | 8,140,684 vs 8,140,684 | 0, 0 | 7,843,624 | 0 | yes | 0.238 | 0.238 |

**Claim 1.** `min`/`max` are exactly Σ over stacks of (the engine’s own journal hits) × `damagePerHit` — Δ = 0 in all 7 marches, because that is how the engine builds them: the identity is a reading of the model, not a new rule. What it buys is the second form: with `k = damagePerHit / HP` per stack, `Σ hits(p)·perHit(p) = Σ hits(p)·HP(p)·k(p)`, and that is the closed form the ledger predicts.

**Claim 2.** The closed-form hit counter (`expectedHits`) gives the same total in every march whose `attackOrder` equals the kill order — the two orders coincide whenever the ladder is one shape, which is the case in 5 of the 7 marches above; where it does not (`the sizer`, `flat 12`, both marked *no*), the closed form misses by up to 94,423. That is where the identity breaks: attack order ≠ kill order (a stack wiped before its slot, `10-lost-hits`), a non-monotone ladder, and the round openers (positions 1, 5, 9, 13 each lose the hit they would otherwise take).

**Claim 3 — the ladder.** The kill order forces `HP(p)` non-increasing while `hits(p)` is non-decreasing in `p`, so the big-HP rungs are the *worst* place to put damage: HP spent on a stack that dies early buys the fewest hits. The score wants the types with the highest damage per HP at the small-HP tail — HP descending, k ascending. τ(position, k) is positive in every march the search built above and negative in the two sizer-shaped ones. It is a first-order rule, not the exact one: where two positions carry the same number of hits the HP belongs to the higher k (the winner’s ABT6, 1,132,856 HP, sits above ARC2, 1,071,708, both on one hit), and across the account the exact key is damage per *pool point at that position*, `hits(p) × α ÷ cost` — the two orderings agree on every type here except ARC1 / RD1 / SP2 / SW1.

**§2b — the price of the ladder upside down.** Same seven types (ARC2 RD2 RD3 + the four mercenaries), same pools, four climbs: unconstrained, mercenaries pinned *last*, mercenaries pinned *first*, and the flat start none of them may beat. The pinned climbs start from a **feasible** point of their own shape (the flat start violates both, and a hard constraint that the start violates is a hill-climb that cannot move at all), so each is a genuine optimum *under its own ordering*.
| march | avg damage | HP ladder | k ladder | τ(position, k) | τ(position, α/cost) | mercenaries lost |
|---|---|---|---|---|---|---|
| flat start (no climb) | 7,648,707 | 1,451,116 · 1,194,552 · 1,193,423 · 1,192,856 · 1,132,856 · 1,100,898 · 1,071,144 | 1.16 · 0.50 · 0.50 · 0.56 · 1.02 · 1.00 · 0.75 | 0.048 | 0.048 | 30 |
| unconstrained | 8,099,051 | 1,199,059 · 1,197,868 · 1,189,610 · 1,132,856 · 1,071,144 · 1,071,144 · 1,056,791 | 0.50 · 0.56 · 0.50 · 1.02 · 0.75 · 1.00 · 1.16 | 0.714 | 0.714 | 27 |
| mercenaries pinned last (k ascending) | 7,930,525 | 1,197,650 · 1,195,362 · 1,192,434 · 1,132,856 · 1,100,898 · 1,088,337 · 1,071,144 | 0.50 · 0.56 · 0.50 · 1.02 · 1.00 · 1.16 · 0.75 | 0.524 | 0.524 | 27 |
| mercenaries pinned first (k descending) | 6,684,787 | 1,451,116 · 1,132,856 · 1,100,898 · 1,071,144 · 1,070,840 · 1,070,062 · 1,068,178 | 1.16 · 1.02 · 1.00 · 0.75 · 0.50 · 0.56 · 0.50 | -0.810 | -0.810 | 30 |

Read the table by the k ladder. The unconstrained climb (8,099,051) is **not** "all four mercenaries under the troops": it runs RD2 (k 0.50) · RD3 (0.56) · ARC2 (0.50) at the top, then ABT6 (1.02) on one hit, then LGN6 (0.75) · CHR6 (1.00) · EMH6 (1.16) on two. τ(position, k) = 0.71. Pinning every mercenary below every sponge costs **168,526** (2.1 %) — the mid-rule 0015 §5 item 3 states ("every mercenary under the troop floor") is itself a small loss, because a mercenary stack whose stock is far bigger than the floor is better *above* one of the sponges than trimmed to fit under all of them. Turning the ladder fully upside down — the mercenaries first, k descending — costs **1,414,264** (17.5 %) and 3 extra mercenaries for the same seven types and the same pools. That is the whole of the ladder rule; 0015 §5 measured the same trade from the other side (`Troops first` gains on the owner’s 8 types and loses on 7) — the difference is whether the troop floor can shelter the stock at all.

## §3 The exact optimum (bounded hill-climb)

Search: 1,227 starts, 1,227 feasible, 60 climbed coarsely, 20 finely, then a free polish and 400 perturb-and-reclimb trials (0 accepted) — **204,276 `evaluateCounts` calls** in 3 s.

Top five marches after the coarse pass: flat 6 × 1 (8,335,636) · flat 2 × 1 (8,287,226) · flat 3 × 1 (8,286,134) · flat 4 × 1 (8,285,549) · flat 4 × 1 (8,284,991).

**Winner, scenario C** — 8,338,153 avg damage (min 7,932,150, max 8,744,156):

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | RD3 | 582 | 1,458,492 | 812,006 | 540,096 | 0/1 | 0 | 812,006 |
| 2 | EMH6 | 92 | 1,451,116 | 1,677,105 | 539,736 | 1/1 | 1,677,105 | 1,677,105 |
| 3 | ARC2 | 1,519 | 1,072,414 | 535,903 | 397,826 | 1/1 | 535,903 | 535,903 |
| 4 | RD2 | 761 | 1,072,249 | 531,482 | 397,242 | 1/1 | 531,482 | 531,482 |
| 5 | LGN6 | 72 | 1,071,144 | 800,280 | 396,720 | 1/1 | 800,280 | 800,280 |
| 6 | CHR6 | 36 | 1,071,144 | 1,071,144 | 396,720 | 2/2 | 2,142,288 | 2,142,288 |
| 7 | ABT6 | 71 | 1,058,326 | 1,079,200 | 392,559 | 2/2 | 2,158,400 | 2,158,400 |
| 8 | SP2 | 138 | 97,290 | 43,346 | 36,018 | 2/2 | 86,692 | 86,692 |

min 7,932,150 · avg 8,338,153 · max 8,744,156 · hits 10/11 · silver 2,404,300 · gold 1,427 · time 12d 6h · pools L 4,343/4,343 A 307/2,000

leadership 4,343/4,343 · mercenaries lost (chunks of ten) 30 · retrain silver 2,404,300 + gold 1,427 · revive silver 242,600 + gold 11,637 · training time 12d 6h

**Winner re-sized under scenario B** — 8,300,884 avg damage:

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | RD3 | 584 | 1,362,472 | 809,190 | 536,346 | 0/1 | 0 | 809,190 |
| 2 | EMH6 | 92 | 1,361,508 | 1,673,370 | 536,001 | 1/1 | 1,673,370 | 1,673,370 |
| 3 | ARC2 | 1,520 | 998,640 | 532,152 | 393,984 | 1/1 | 532,152 | 532,152 |
| 4 | RD2 | 761 | 998,432 | 527,373 | 393,133 | 1/1 | 527,373 | 527,373 |
| 5 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 1/1 | 796,176 | 796,176 |
| 6 | CHR6 | 36 | 997,272 | 1,067,040 | 392,616 | 2/2 | 2,134,080 | 2,134,080 |
| 7 | ABT6 | 71 | 985,480 | 1,075,153 | 388,512 | 2/2 | 2,150,306 | 2,150,306 |
| 8 | SP2 | 133 | 87,248 | 41,416 | 34,354 | 2/2 | 82,832 | 82,832 |

min 7,896,289 · avg 8,300,884 · max 8,705,479 · hits 10/11 · silver 2,405,100 · gold 1,427 · time 12d 7h · pools L 4,343/4,343 A 307/2,000

## §4 What the sizer leaves on the table

| march | avg damage | silver (retrain) | gold | mercenaries lost | damage/silver | damage/merc |
|---|---|---|---|---|---|---|
| app sizer, 12 types (C) | 5,814,831 | 1,564,900 | 1,464 | 30 | 3.72 | 193,828 |
| app sizer + count hill-climb, 12 types (C) | 7,835,412 | 2,404,300 | 1,438 | 30 | 3.26 | 261,180 |
| app sizer, 12 types (B) | 5,946,764 | 1,603,300 | 1,464 | 30 | 3.71 | 198,225 |
| 0015 winner, 7 types (C) | 7,879,075 | 2,361,500 | 1,386 | 28 | 3.34 | 281,396 |
| 0015 winner, 7 types (B) | 7,843,624 | 2,361,500 | 1,386 | 28 | 3.32 | 280,129 |
| 0015 winner + mercs (C) | 8,094,822 | 2,361,500 | 1,339 | 27 | 3.43 | 299,808 |
| 0015 winner + mercs (B) | 8,061,308 | 2,361,500 | 1,339 | 27 | 3.41 | 298,567 |
| hill-climb winner (C) | 8,338,153 | 2,404,300 | 1,427 | 30 | 3.47 | 277,938 |
| hill-climb winner (B) | 8,300,884 | 2,405,100 | 1,427 | 30 | 3.45 | 276,696 |
| hill-climb winner, mercenaries in tens (C) | 7,636,617 | 2,399,100 | 1,365 | 26 | 3.18 | 293,716 |

**The gap, in all three currencies.** Against the app's own sizing the winner is +2,523,322 damage (+43.4 %) under C and +2,354,120 under B, for +839,400 retrain silver a march and the *same* 30 mercenaries. Against 0015's hand-tuned winner it is +243,331 damage (+239,576 under B) for +42,800 silver and +3 mercenaries a march — 81,110 damage per extra mercenary spent, so it is the right march *only* while the stock is not the wall (0015 §6). Pinning the mercenary counts to multiples of ten — the sustainable shape — gives 7,636,617 (-701,536 against the unconstrained winner) for 2,399,100 silver and 26 mercenaries.

**The margin in the two scenarios the brief names.** Against 0015's 7,843,624 (B) the winner is +457,260 (+5.8 %) under B and +459,078 under C; against its hand-tuned 8,061,308 (B) it is +239,576 (+3.0 %) under B and +243,331 under C.

**Which single change captures most of it.** Two changes are worth almost the same and both amount to "stop trusting the sizer's shape". 0015's — choose the subset instead of all twelve — is worth +2,064,244 = 82 % of the 2,523,322 gap, but it needs the 255-subset search. Handing the sizer's *own* twelve-type answer to the count-level hill-climb — 0015's E2 post-pass, extended from the mercenary counts to all twelve — is worth +2,020,581 = 80 % of it, for the same 30 mercenaries and +839,400 silver, and it needs neither a new closed form nor a subset enumeration. That is the single change: **size as today, then hill-climb the counts — leadership transfers between troop types, mercenary counts inside the caps — accepting on `simulateBattle`**. The remaining 502,741 needs the multi-start search of §3, not a better ladder formula.

## §5 What the repo cannot settle, bounded

**(a) more than one stack of the same unit type.** The engine builds one stack per type, so the question is outside the model. It can be bounded by giving the request clone `UnitDef`s of RD3 (the best sponge: 1,253 HP per leadership against 706 for ARC2/RD2/SP2), so the search may field m of them:
| m allowed | RD3 stacks live | stacks in all | best avg damage (C) | Δ over m = 1 | mercenaries lost | silver |
|---|---|---|---|---|---|---|
| 1 | 1 | 8 | 8,338,153 | +0 | 30 | 2,404,300 |
| | RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138 | | | | | |
| 2 | 2 | 9 | 8,878,911 | +540,758 | 30 | 2,575,900 |
| | RD3 582 · EMH6 92 · rider-3#1 429 · ARC2 1,518 · LGN6 72 · CHR6 36 · ABT6 71 · RD2 401 · SP2 1 | | | | | |
| 3 | 3 | 10 | 9,538,476 | +1,200,323 | 30 | 2,746,700 |
| | RD3 582 · EMH6 92 · rider-3#1 428 · rider-3#2 428 · LGN6 72 · CHR6 36 · ABT6 71 · RD2 265 · SP2 469 · ARC2 468 | | | | | |
| 4 | 4 | 11 | 10,350,449 | +2,012,296 | 30 | 2,919,100 |
| | RD3 582 · EMH6 92 · rider-3#1 429 · rider-3#2 429 · rider-3#3 429 · ABT6 72 · LGN6 72 · CHR6 36 · RD2 117 · ARC2 233 · SP2 138 | | | | | |
| 6 | 6 | 11 | 10,765,220 | +2,427,067 | 30 | 3,039,900 |
| | RD3 582 · EMH6 92 · rider-3#1 428 · rider-3#2 428 · LGN6 72 · CHR6 36 · ABT6 71 · rider-3#3 245 · rider-3#4 244 · rider-3#5 244 · ARC2 1 | | | | | |
| 8 | 8 | 13 | 11,037,279 | +2,699,126 | 30 | 3,039,900 |
| | RD3 582 · EMH6 92 · rider-3#1 428 · rider-3#2 428 · LGN6 72 · CHR6 36 · ABT6 71 · rider-3#3 147 · rider-3#6 147 · rider-3#7 147 · rider-3#4 146 · rider-3#5 146 · ARC2 1 | | | | | |

The gain is not small and it is not marginal: with eight RD3 stacks allowed, the best march is 11,037,279 against 8,338,153, +2,699,126 (+32 %). Structurally, what a duplicate buys is **another rung at the wall**: the winner already stacks ARC2, RD2 and LGN6 just above CHR6, and a second RD3 can be given the same HP for 1,253 HP per leadership instead of 706, which is what lets four rungs sit above the two-hit mercenaries instead of three. Every extra rung is another stack on two hits. **To check in game (a):** whether a march may hold two stacks of the same unit type at different sizes. *Reading that settles it*: in a battle report of a march that fields two stacks of one type, the report shows the same unit card twice with different counts (the engine can only ever print one). If it does, the ladder above replaces the flat ladder and the m = 8 row is the shape to use; the engine cannot price it either way.

**(b) the kill order.** The engine wipes the highest-total-HP living stack (10/10 kills in the in-game reports, 29/29 over four reports per 0015 §1). The alternative is that the enemy picks by some other key — lowest HP, a fixed slot, or the attack order. Every number in §3 is conditional on this rule. *Reading that settles it*: a fight in which a smaller stack is wiped while a larger one lives. If the kill order were the attack order instead, the optimum would move toward the mercenaries-first ladder of §2b.
