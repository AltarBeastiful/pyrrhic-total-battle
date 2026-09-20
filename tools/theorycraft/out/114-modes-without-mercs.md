
## A — the three sizer modes on an army that hires nothing

The first-run account exactly as the app creates it (Guardsmen I–III, Specialists I, no mercenary and no monster), at three leadership pools. Every row is `sizeStacks` + `simulateBattle`, the damage the worst opening, the silver and the queue `recoveryCosts` under the account's own recovery settings.

| leadership | mode | damage | silver | queue | stacks | counts |
|---|---|---|---|---|---|---|
| 4,100 | Tier ladder | 925,723 | 1,666,400 | 5d 9h | 10 | SW1 625 · ARC1 624 · SP1 623 · RD1 311 · ARC2 344 · SP2 344 · RD2 171 · ARC3 192 · SP3 192 · RD3 96 |
| 4,100 | Troops first | 925,723 | 1,666,400 | 5d 9h | 10 | SW1 625 · ARC1 624 · SP1 623 · RD1 311 · ARC2 344 · SP2 344 · RD2 171 · ARC3 192 · SP3 192 · RD3 96 |
| 4,100 | Troops first + damage trades | 925,723 | 1,666,400 | 5d 9h | 10 | SW1 625 · ARC1 624 · SP1 623 · RD1 311 · ARC2 344 · SP2 344 · RD2 171 · ARC3 192 · SP3 192 · RD3 96 |
| 4,100 | Tier ladder + monsters after troops | 925,723 | 1,666,400 | 5d 9h | 10 | SW1 625 · ARC1 624 · SP1 623 · RD1 311 · ARC2 344 · SP2 344 · RD2 171 · ARC3 192 · SP3 192 · RD3 96 |
| 4,100 | Your own order (reversed) | 885,965 | 1,669,600 | 5d 10h | 10 | SW1 627 · SP2 347 · SP3 195 · SP1 623 · RD3 97 · RD2 172 · RD1 309 · ARC3 193 · ARC2 343 · ARC1 616 |
| 12,000 | Tier ladder | 2,710,128 | 4,878,400 | 15d 18h | 10 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |
| 12,000 | Troops first | 2,710,128 | 4,878,400 | 15d 18h | 10 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |
| 12,000 | Troops first + damage trades | 2,710,128 | 4,878,400 | 15d 18h | 10 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |
| 12,000 | Tier ladder + monsters after troops | 2,710,128 | 4,878,400 | 15d 18h | 10 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |
| 12,000 | Your own order (reversed) | 2,593,752 | 4,887,000 | 15d 20h | 10 | SW1 1,833 · SP3 572 · SP2 1,014 · SP1 1,823 · RD3 284 · RD2 504 · RD1 906 · ARC3 565 · ARC2 1,003 · ARC1 1,802 |
| 20,000 | Tier ladder | 4,519,202 | 8,131,400 | 26d 6h | 10 | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 |
| 20,000 | Troops first | 4,519,202 | 8,131,400 | 26d 6h | 10 | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 |
| 20,000 | Troops first + damage trades | 4,519,202 | 8,131,400 | 26d 6h | 10 | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 |
| 20,000 | Tier ladder + monsters after troops | 4,519,202 | 8,131,400 | 26d 6h | 10 | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 |
| 20,000 | Your own order (reversed) | 4,322,618 | 8,144,800 | 26d 10h | 10 | SW1 3,056 · SP3 953 · SP2 1,691 · SP1 3,038 · RD3 473 · RD2 840 · RD1 1,510 · ARC3 942 · ARC2 1,671 · ARC1 3,003 |

At 4,100 leadership the five rows above are **2 distinct marches**.
At 12,000 leadership the five rows above are **2 distinct marches**.
At 20,000 leadership the five rows above are **2 distinct marches**.

## B — where the plan refuses, exactly

The same account at 12 000 leadership, with one thing changed at a time. "answers" means `planCampaign` returned a plan; the refusal is its own sentence.

| account | plan | stops | best campaign damage |
|---|---|---|---|
| first run: no mercenary, no monster | **refuses** — "planCampaign: no feasible plan for this army" | — | — |
| one mercenary type selected, stock 0 | **refuses** — "planCampaign: no feasible plan for this army" | — | — |
| one mercenary, stock 1 | answers | 1 (sweet-spot) | 10,883,691 |
| one mercenary, stock 20 | answers | 2 (sweet-spot · all-in) | 13,776,624 |
| no mercenary, but monsters unlocked at tier 3 and dominance housed | answers | 2 (sweet-spot · all-in) | 24,977,427 |
| no mercenary, monsters unlocked but no dominance housing | **refuses** — "planCampaign: no feasible plan for this army" | — | — |

## C — is there anything to plan on a troops-only army?

The plan's own knob is how much of the pool a march spends: the ladder's floor is fixed by the mercenaries and every rung above it buys troop damage for silver. With nothing hired there is no floor, so the question is what is left of the knob. Swept by capping the leadership a march may fill, which is the same trade read from the other end — each row is the Tier ladder over the whole army at that pool, priced on the worst opening.

| leadership spent | share | damage | silver | queue | damage a silver | damage kept |
|---|---|---|---|---|---|---|
| 2,400 | 20 % | 541,615 | 975,400 | 3d 4h | 0.56 | 20 % |
| 3,600 | 30 % | 812,589 | 1,463,200 | 4d 17h | 0.56 | 30 % |
| 4,800 | 40 % | 1,083,486 | 1,951,000 | 6d 7h | 0.56 | 40 % |
| 6,000 | 50 % | 1,354,681 | 2,439,000 | 7d 21h | 0.56 | 50 % |
| 7,200 | 60 % | 1,625,307 | 2,926,600 | 9d 11h | 0.56 | 60 % |
| 8,400 | 70 % | 1,896,893 | 3,414,800 | 11d 1h | 0.56 | 70 % |
| 9,600 | 80 % | 2,167,453 | 3,902,400 | 12d 14h | 0.56 | 80 % |
| 10,800 | 90 % | 2,438,636 | 4,390,400 | 14d 4h | 0.56 | 90 % |
| 12,000 | 100 % | 2,710,128 | 4,878,400 | 15d 18h | 0.56 | 100 % |

The whole-pool march is the reference: 2,710,128 damage for 4,878,400 silver and 15d 18h of queue.

## D — the same army, one hired type, and what the plan then offers

Epic Monster Hunter VI ×60 in stock, 2 000 authority, 12 000 leadership, horizon 4 marches. The sizer rows are one march; the plan rows are its stops, campaign figures included.

| mode | first march damage | silver | hired lost | campaign damage | campaign silver | hired lost |
|---|---|---|---|---|---|---|
| Tier ladder | 3,171,565 | 4,878,400 | 6 | 14,081,481 | 19,513,600 | 22 |
| Troops first | 4,609,965 | 4,878,400 | 5 | 18,439,860 | 19,513,600 | 20 |
| Complete optimization · sweet-spot | 4,437,252 | 4,878,400 | 4 | 17,921,721 | 19,513,600 | 17 |
| Complete optimization · steady-max | 4,609,965 | 4,878,400 | 5 | 18,439,860 | 19,513,600 | 20 |

## E — what does move a troops-only march: the Objective, not the method

The same first-run army at 12 000 leadership. The first row is Generate with no priority — every type the account can field, which is what §A measured. The others are the priority search over subsets of the types, which is what the command bar's Objective control runs. Composition, not sizing: the question is which types to march with, and it is the only lever this army has.

| objective | damage | silver | queue | damage a silver | stacks | counts |
|---|---|---|---|---|---|---|
| no priority (every type) | 2,710,128 | 4,878,400 | 15d 18h | 0.56 | 10 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |
| avgDamage | 2,774,451 | 8,400,000 | 58d 8h | 0.33 | 3 | ARC3 4,008 · SP3 4,000 · RD3 1,996 |
| minDamage | 2,959,404 | 6,860,800 | 36d 23h | 0.43 | 6 | ARC2 2,570 · SP2 2,566 · RD2 1,280 · ARC3 1,437 · SP3 1,435 · RD3 716 |
| damagePerSilver | 2,710,128 | 4,878,400 | 15d 18h | 0.56 | 10 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |

## F — the bar a troops-only plan could draw, if it could draw one

A plan's two families are the tight ladder (rungs just above the hired floor) and the sizer over a **prefix** of the troop ranking. With nothing hired there is no floor, so the ladder family has no anchor and the sizer-over-a-prefix family is all that is left. That family is measured here directly: the same army, the sizer over the first k troop types of the plan's own ranking (`rankTroops`, worst damage a point of leadership first), so k = 10 is every type and k = 1 is the best type alone. It is the frontier a bar of stops would be drawn from.

| types fielded | damage | silver | queue | damage a silver | counts |
|---|---|---|---|---|---|
| 10 | 2,710,128 | 4,878,400 | 15d 18h | 0.56 | SW1 1,829 · ARC1 1,826 · SP1 1,822 · RD1 909 · ARC2 1,008 · SP2 1,006 · RD2 502 · ARC3 564 · SP3 563 · RD3 280 |
| 9 | 2,587,949 | 5,108,400 | 18d 5h | 0.51 | ARC1 2,155 · SP1 2,150 · RD1 1,072 · ARC2 1,189 · SP2 1,187 · RD2 592 · ARC3 665 · SP3 664 · RD3 331 |
| 8 | 2,714,117 | 5,438,200 | 21d 18h | 0.5 | ARC1 2,620 · RD1 1,307 · ARC2 1,450 · SP2 1,447 · RD2 722 · ARC3 810 · SP3 809 · RD3 403 |
| 7 | 2,483,329 | 5,363,000 | 21d 8h | 0.46 | ARC1 2,977 · RD1 1,485 · ARC2 1,647 · RD2 822 · ARC3 923 · SP3 921 · RD3 459 |
| 6 | 2,608,917 | 5,944,800 | 27d 16h | 0.44 | ARC1 3,950 · ARC2 2,190 · RD2 1,093 · ARC3 1,227 · SP3 1,225 · RD3 611 |
| 5 | 2,581,502 | 7,095,400 | 40d 5h | 0.36 | ARC2 3,265 · RD2 1,629 · ARC3 1,829 · SP3 1,826 · RD3 911 |
| 4 | 2,397,922 | 6,861,800 | 36d 23h | 0.35 | ARC2 3,849 · RD2 1,921 · ARC3 2,157 · RD3 1,076 |
| 3 | 2,522,407 | 7,268,800 | 42d 15h | 0.35 | ARC2 5,656 · ARC3 3,176 · RD3 1,584 |
| 2 | 2,359,238 | 8,400,000 | 58d 8h | 0.28 | ARC3 6,006 · RD3 2,997 |
| 1 | 0 | 8,400,000 | 58d 8h | 0 | ARC3 12,000 |

## G — a real account with four hired types, where the plan has something to spread

The owner's export of 2026-09-17 on its own setup: 7 000 leadership, 2 180 authority, stock EMH 142 · arbalester 50 · legionary 42 · chariot 20. Same arithmetic as §D — the sizers played greedily for the 4-march horizon, the plan as its own campaign.

| mode | first march damage | silver | hired lost | campaign damage | campaign silver | hired lost |
|---|---|---|---|---|---|---|
| Tier ladder | 4,457,185 | 2,739,400 | 27 | 18,589,604 | 10,957,600 | 93 |
| Troops first | 6,198,747 | 2,739,400 | 14 | 23,341,980 | 10,957,600 | 55 |
| Complete optimization · silver-saver | 3,549,139 | 1,985,200 | 6 | 16,115,314 | 8,695,000 | 32 |
| Complete optimization · sweet-spot | 4,442,817 | 2,722,500 | 7 | 18,796,348 | 10,906,900 | 35 |
| Complete optimization · more-mercs | 5,230,687 | 2,739,400 | 11 | 21,363,106 | 10,957,600 | 47 |
| Complete optimization · steady-max | 5,913,067 | 2,739,400 | 14 | 22,770,620 | 10,957,600 | 55 |
| Complete optimization · all-in | 6,603,524 | 3,802,400 | 26 | 23,619,920 | 15,179,600 | 92 |

## H — the army that has monsters but hires no mercenary

The first-run troops at 12 000 leadership with the monster window open at tier 3 and 900 dominance housed — the case §B found the plan *does* answer for. It is also the only case in which "Monsters after troops" is a different mode from the Tier ladder, so all of it is measured together.

| mode | first march damage | silver | hired lost | campaign damage | campaign silver | hired lost |
|---|---|---|---|---|---|---|
| Tier ladder | 5,533,072 | 5,158,400 | 0 | 22,132,288 | 20,633,600 | 0 |
| Tier ladder + monsters after troops | 5,722,380 | 5,054,800 | 0 | 22,889,520 | 20,219,200 | 0 |
| Troops first | 5,722,380 | 5,054,800 | 0 | 22,889,520 | 20,219,200 | 0 |
| Complete optimization · sweet-spot | 6,418,349 | 5,690,200 | 0 | 24,977,427 | 22,125,400 | 0 |
| Complete optimization · all-in | 6,649,021 | 6,231,800 | 0 | 24,849,448 | 24,906,200 | 0 |
