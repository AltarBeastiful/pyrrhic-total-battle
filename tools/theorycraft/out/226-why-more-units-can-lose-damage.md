# 226 — why a monster with health room left can still lose damage

His camp of 2026-10-12 (leadership 13,000, authority 2,000, dominance 3,200; hiring BB, ED, SG, WE, EMH6).

Every reading below is the **worst opening** (`summary.minDamage`, the figure the plan is ranked on) of one
march of the silver saver stop, taken to Tight the way the app draws it, with `emerald-dragon` (ED) added to
by hand. `kill` is the sequence of deaths, `attack` the order the stacks strike in.

The plan offers 5 stops: silver-saver, sweet-spot, more-mercs, steady-max, all-in.

## The room the eye can see
- the march: **16 stacks**, tight.
- **ED** stands at **17** units, 515,236 HP (30,308 a unit), at kill position **12**.
- over it stands **RD3** at 650,136 HP, and the troop floor is 650,136.
- so ED may be pushed to **21** units — **4 more** — and the order is untouched.
- `pushedCounts` on the monsters' pool answers **{"emerald-dragon":21,"water-elemental":49,"stone-gargoyle":18,"battle-boar":23}**.
- the attack order of the 6 stacks that strike first: SW1 > SW2 > RD1 > ARC1 > ARC2 > ED.
- enemy squads: **4**.

## The strike order at 17 units

2. SW1 ×2,334 = 296,768 > 5. SW2 ×1,287 = 294,556 > 1. RD1 ×859 = 288,882 > 4. ARC1 ×1,711 = 287,705 > 6. ARC2 ×946 = 286,326 > 12. ED ×17 = 285,575 > 8. RD2 ×471 = 285,115 > 9. ARC3 ×529 = 284,644 > 11. RD3 ×263 = 283,030 > 13. WE ×38 = 278,187 > 3. SP1 ×1,617 = 271,899 > 14. SG ×14 = 271,762 > 7. SP2 ×891 = 269,679 > 10. SP3 ×499 = 268,502 > 15. BB ×17 = 257,443 > 16. EMH6 ×20 = 123,546

## Every unit, one at a time

| ED units | ED HP | kill order | ED attack place | ED strikes | worst opening | change |
|---|---|---|---|---|---|---|
| 17 | 515,236 | kept | 6 | 3 | 12,459,831 | — |
| 18 | 545,544 | kept | 1 | 3 | 11,842,775 | -4.95 % |
| 19 | 575,852 | kept | 1 | 3 | 11,918,144 | -4.35 % |
| 20 | 606,160 | kept | 1 | 3 | 11,993,516 | -3.74 % |
| 21 | 636,468 | kept | 1 | 3 | 12,068,885 | -3.14 % |

## Who pays for the turn
- The strike order at 18 units:

12. ED ×18 = 302,373
> 2. SW1 ×2,334 = 296,768
> 5. SW2 ×1,287 = 294,556
> 1. RD1 ×859 = 288,882
> 4. ARC1 ×1,711 = 287,705
> 6. ARC2 ×946 = 286,326
> 8. RD2 ×471 = 285,115
> 9. ARC3 ×529 = 284,644
> 11. RD3 ×263 = 283,030
> 13. WE ×38 = 278,187
> 3. SP1 ×1,617 = 271,899
> 14. SG ×14 = 271,762
> 7. SP2 ×891 = 269,679
> 10. SP3 ×499 = 268,502
> 15. BB ×17 = 257,443
> 16. EMH6 ×20 = 123,546
- ED's strikes: **3 → 3** at 18 units.
- ED's attack place: **6 → 1**.
- stacks whose strike count moved: SW1 1 → 0, ARC2 2 → 1.
- worst opening: **12,459,831 → 11,842,775** (-4.95 %).
- the whole battle at the march's own counts: **33 army strikes** over 4 rounds.

## What the numbers say

- The **kill order is kept on every count** to the ceiling: the enemy still wipes the same stack at the same kill position, so nothing about ED's health moves it in the death sequence. That is the owner's reading, and it is right.
- The turns are a **fixed pool**. The enemy makes one attack per squad a round — **4** here — and kills a stack on each of them, so 16 stacks fall in 4 rounds and the whole battle gives our army **33 strikes**. The attack order adds none: it decides **who spends them**.
- What moves is the **attack order**, and it is `count × strengthPerUnit` alone: ED at 17 units stands **sixth** on 285,575 of it, the stack that strikes first stands on 296,768 — a gap of **11,193** — and ED's own next unit is worth **16,798**. So **one** unit passes it, and ED spends the opening turn of every round where the two stacks it passed now spend none.
- ED's own strikes do not rise (they are set by its **kill** position, which is untouched: **3 → 3**), so nothing buys the turns back: SW1 and ARC2 spend what ED now spends, and their hits are worth more than ED's extra damage per hit. Hence the fall.
- The first count that loses damage is **18** units — **one** more than the march fields — and the whole room to the ceiling (21) stays below the march's own reading.
- **This is why the mark is not drawn on that march** (`offersPush`, owner's call of 2026-10-12): the room the eye can see is real, the order is safe, and the trade is still a loss. It is the same mechanism experiment 225 found on 3 of the 68 benchmark stops, and the reason the raise control's *damage* positions exist — a bigger stack is not a harder-hitting one.
