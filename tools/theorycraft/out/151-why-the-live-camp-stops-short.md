# 151 — why the bar stops short on the owner’s live camp

Figures are four-march campaigns, worst opening, default recovery. The shelter floor is the HP of the lowest troop stack; a hired stack at or above it is killed before any troop (S-87).

## §A — TotalStack’s marches, stack by stack


### TotalStack · M’s Preservation

Shelter floor (lowest troop stack): **239,760 HP**.

| stack (kill order) | pool | count | HP | against the floor |
|---|---|---:|---:|---|
| bear-5 | authority | 77 | 7,267,260 | **exposed — 30.3× the floor** |
| legionary-6 | authority | 277 | 3,173,589 | **exposed — 13.2× the floor** |
| arbalester-6 | authority | 286 | 2,608,320 | **exposed — 10.9× the floor** |
| spearman-1 | leadership | 1,000 | 302,000 |  |
| spearman-2 | leadership | 555 | 301,365 |  |
| rider-1 | leadership | 500 | 294,000 |  |
| rider-2 | leadership | 277 | 293,066 |  |
| rider-3 | leadership | 155 | 291,710 |  |
| archer-1 | leadership | 1,001 | 240,240 |  |
| archer-2 | leadership | 555 | 239,760 |  |

### TotalStack · Total Optimization

Shelter floor (lowest troop stack): **238,896 HP**.

| stack (kill order) | pool | count | HP | against the floor |
|---|---|---:|---:|---|
| bear-5 | authority | 61 | 5,757,180 | **exposed — 24.1× the floor** |
| legionary-6 | authority | 445 | 5,098,365 | **exposed — 21.3× the floor** |
| arbalester-6 | authority | 454 | 4,140,480 | **exposed — 17.3× the floor** |
| spearman-1 | leadership | 1,001 | 302,302 |  |
| spearman-2 | leadership | 553 | 300,279 |  |
| rider-1 | leadership | 501 | 294,588 |  |
| rider-2 | leadership | 277 | 293,066 |  |
| rider-3 | leadership | 155 | 291,710 |  |
| archer-1 | leadership | 1,002 | 240,480 |  |
| archer-2 | leadership | 553 | 238,896 |  |

### TotalStack · Elite Preservation

Shelter floor (lowest troop stack): **238,896 HP**.

| stack (kill order) | pool | count | HP | against the floor |
|---|---|---:|---:|---|
| bear-5 | authority | 61 | 5,757,180 | **exposed — 24.1× the floor** |
| legionary-6 | authority | 445 | 5,098,365 | **exposed — 21.3× the floor** |
| arbalester-6 | authority | 454 | 4,140,480 | **exposed — 17.3× the floor** |
| spearman-1 | leadership | 1,001 | 302,302 |  |
| spearman-2 | leadership | 553 | 300,279 |  |
| rider-1 | leadership | 501 | 294,588 |  |
| rider-2 | leadership | 277 | 293,066 |  |
| rider-3 | leadership | 155 | 291,710 |  |
| archer-1 | leadership | 1,002 | 240,480 |  |
| archer-2 | leadership | 553 | 238,896 |  |


## §B — the same marches, sheltered

| march | damage | silver | hired burned | gold | queue | dmg a silver | dmg a merc | dmg a gold |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| TotalStack · M’s Preservation — as TotalStack fields it | 35,412,012 | 7,797,200 | 260 | 60,352 | 527 h | 4.542 | 104,017 | 587 |
| TotalStack · M’s Preservation — every hired stack lowered under the floor | 10,294,908 | 7,797,200 | 24 | 1,952 | 527 h | 1.320 | 241,779 | 5,274 |
| TotalStack · Total Optimization — as TotalStack fields it | 51,520,840 | 7,794,000 | 392 | 60,416 | 527 h | 6.610 | 110,096 | 853 |
| TotalStack · Total Optimization — every hired stack lowered under the floor | 10,290,176 | 7,794,000 | 24 | 1,952 | 527 h | 1.320 | 241,779 | 5,272 |
| TotalStack · Elite Preservation — as TotalStack fields it | 51,520,840 | 7,794,000 | 392 | 60,416 | 527 h | 6.610 | 110,096 | 853 |
| TotalStack · Elite Preservation — every hired stack lowered under the floor | 10,290,176 | 7,794,000 | 24 | 1,952 | 527 h | 1.320 | 241,779 | 5,272 |


## §C — how long their hired counts last on the camp’s stock

| march | hired type | count a march | stock | marches it lasts |
|---|---|---:|---:|---:|
| TotalStack · M’s Preservation | bear-5 | 77 | unlimited | ∞ |
| TotalStack · M’s Preservation | legionary-6 | 277 | 1,002 | 26 |
| TotalStack · M’s Preservation | arbalester-6 | 286 | 485 | 7 |
| TotalStack · Total Optimization | bear-5 | 61 | unlimited | ∞ |
| TotalStack · Total Optimization | legionary-6 | 445 | 1,002 | 13 |
| TotalStack · Total Optimization | arbalester-6 | 454 | 485 | 1 |
| TotalStack · Elite Preservation | bear-5 | 61 | unlimited | ∞ |
| TotalStack · Elite Preservation | legionary-6 | 445 | 1,002 | 13 |
| TotalStack · Elite Preservation | arbalester-6 | 454 | 485 | 1 |


## §D — the plan’s own search

| set | plans | its most damage |
|---|---:|---|
| every plan the search summarised | 1028 | 30,986,506 for 12,194,900 silver, 208 burned, 28,736 gold |
| undominated | 292 | 30,986,506 for 12,194,900 silver, 208 burned, 28,736 gold |
| in the band | 97 | 13,905,901 for 10,005,200 silver, 70 burned, 8,336 gold |
| on the bar | 5 | 15,306,859 for 9,849,200 silver, 52 burned, 6,344 gold |

The search's plans burn **10–208** chunks over the campaign.


## §E — the hardest plans the band refuses, and which arm refuses them

The winning march: 2,868,384 a march, 1.036 damage a silver.

| plan | damage | silver | burned | gold | damage a march (≥ half the winner?) | dmg a silver (≥ half?) | troop stacks | hired types fielded |
|---|---:|---:|---:|---:|---|---|---:|---|
| — | 30,986,506 | 12,194,900 | 208 | 28,736 | 9,585,354 ✓ | 2.541 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 30,825,481 | 12,194,900 | 205 | 28,640 | 9,531,679 ✓ | 2.528 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 30,503,431 | 12,194,900 | 202 | 28,424 | 9,424,329 ✓ | 2.501 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 30,149,176 | 12,194,900 | 199 | 28,184 | 9,306,244 ✓ | 2.472 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 29,092,141 | 12,194,900 | 196 | 26,096 | 8,953,899 ✓ | 2.386 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 28,861,411 | 12,194,900 | 193 | 25,592 | 8,876,989 ✓ | 2.367 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 26,473,816 | 12,194,900 | 190 | 19,664 | 8,081,124 ✓ | 2.171 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 26,377,201 | 12,194,900 | 187 | 19,616 | 8,048,919 ✓ | 2.163 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 25,282,666 | 12,194,900 | 184 | 17,144 | 7,684,074 ✓ | 2.073 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 22,056,001 | 12,194,900 | 142 | 18,080 | 6,608,519 ✓ | 1.809 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 20,475,457 | 9,116,300 | 148 | 14,528 | 6,081,671 ✓ | 2.246 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |
| — | 20,226,481 | 12,194,900 | 136 | 13,760 | 5,998,679 ✓ | 1.659 ✓ | 1 **✗** | arbalester-6, bear-5, legionary-6 |

The hardest of them, as the battle fields its repeated march (floor 4,593,962 HP):

| stack (kill order) | pool | count | HP |
|---|---|---:|---:|
| rider-3 | leadership | 2,441 | 4,593,962 |
| arbalester-6 | authority | 403 | 3,675,360 |
| bear-5 | authority | 35 | 3,303,300 |
| legionary-6 | authority | 215 | 2,463,255 |

