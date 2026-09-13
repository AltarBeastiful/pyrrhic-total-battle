# Investigation 0015 — theory-crafting the march: most damage from a bounded stock of silver and mercenaries

2026-09-14. The owner's question: *I have a limited amount of silver and my mercenaries only come back at
90 %; I want the most damage I can get out of them, and I want the stacking to be better than what we have.*
Everything below is computed with the repo's engine (`src/engine`), which reproduces the game's own battle
reports line for line (S-30, investigations 0003/0013/0014), on the owner's export of 2026-09-13 with two
corrections he sent while this was being written: **authority is 2,000, not 200**, and Kai's calculator
produced a march he wanted compared. Every table can be regenerated with the scripts under
`tools/theorycraft/` (`THEORY=1 pnpm vitest run tools/theorycraft/<file>`; each writes `tools/theorycraft/out/<file>.md`).
Nothing here assumes a rule the game has not shown us; where a lever depends on something we could not verify
from the repo's evidence it is labelled **to check in game**.

## 0. Inputs, and two bonus scenarios

| input | value | source |
|---|---|---|
| housing | leadership 4,343 · authority **2,000** · dominance 800 (no monsters) | export + owner's correction |
| mercenary stock (caps) | EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37 (authority 1/1/1/2 each → 314 at full) | export |
| troop types owned | SW1 (specialist), ARC1 SP1 RD1, ARC2 SP2 RD2, RD3 | export (ARC1 SP1 RD1 ARC2 were left out of the march) |
| enemy | 4 squads, one of each category | export |
| temple | level 15, revival cost ÷ 1.53, 2.7 sacred potions / hour, 650 in stock | `fixtures/ingame-2026-09-13/temple-building.jpg` |
| recovery plan in the export | retrain (recruit again), temple 0 | export (temple corrected to 15 in scenario B) |

The export carries almost no bonuses (VIP +3 % / +3 %, no captain active), while the account's own battle
report of 2026-09-13 shows guardsmen at +143 % health / +187 % strength, ranged +0.5 / +1 on top, the
specialist Swordsman I at +51 / +71 and +3 % double damage (`fixtures/ingame-2026-09-13/README.md` §5).
So every experiment runs twice:

- **A** — the export as it stands. Same numbers TotalStack showed the owner (0014).
- **B** — the report's bonuses (`harness.scenarioB`). This is the account as it fights; **the
  recommendations rest on B**, A is kept to show what does not depend on bonuses.

Under both, uniform bonuses leave the counts almost unchanged; what moves is the weight of the mercenaries'
"features" damage (strength-against is computed on the *base* strength and is never boosted) against the
troops' boosted base damage: the mercenaries deal 1,891,777 of the 8-type Troops-first march's 3,097,078 in A, and a smaller share in B.

## 1. The five rules the numbers come from

All verified in game (four reports, 29/29 kills, every hit line reproduced):

1. **Kill order = total HP descending.** Each enemy squad attacks once per round and wipes our biggest
   living stack. With N enemy squads the stack at kill position p lives ceil(p/N) rounds.
2. **Attack order = base damage descending** (`count × strength × (1 + Σ strength %)`, features excluded).
   Between two enemy attacks the highest-base living stack that has not struck this round strikes once;
   after the N-th attack everyone else alive strikes once. A stack killed before its slot loses that
   round's strike. "Army first" adds one opening strike by the top-base stack — worth a hit **only if that
   stack is also the first victim**.
3. **Hits by position**, when the two orders agree: `hits(p) = ceil(p/N) − [p ≡ 1 (mod N)]`, +1 at p = 1
   when we strike first. For N = 4: positions 1–16 give 0 1 1 1 · 1 2 2 2 · 2 3 3 3 · 3 4 4 4 (enemy first).
   The **first victim of every round strikes nothing that round**: positions 1, 5, 9, 13 each lose one.
4. **Damage per hit** = `count × strength × (1 + Σ strength %) + count × base strength × SA / 100`; double
   damage is a plain ×2 on a hit at the unit's own chance plus the account's (+3 %), not priced in the
   averages below.
5. **Every stack dies. Recovery**: troops are recruited again (silver, time, per unit); the Temple brings
   back `n − ceil(n/10)` = 90 % of any stack for gold ÷ 1.53 (or 3 potions each); the tenth is gone —
   for a mercenary, gone for good. So a mercenary stack of n fielded costs `ceil(n/10)` of the stock: 41
   costs as much as 50, 40 costs one less.

Two consequences shape everything else. **Damage is linear in the number of stacks**: with K flat stacks the
total hits are about K²/(2N) and each stack's damage per hit is about 1/K of the housing, so damage ≈ housing
× K / (2N). And **the mercenaries are the damage**: in B one EMH6 hits for 18,188 per unit (2,030 × 2.87 base
+ 2,030 × 6.09 features) against 350 for an ARC2 (90 × 2.88 + 90 × 1.01) — 52× more per unit and per housing point (EMH6 costs 1 authority, ARC2 1 leadership), on top of a stock
that comes back at 90 %.
What a march is for is therefore to give the mercenary stacks as many hits as possible; the troop stacks'
first job is to die *before* them, i.e. to out-HP them.

## 2. The arithmetic of a merc-carried march

Write M for the HP of the biggest mercenary stack and T for the number of troop stacks above it. The mercs sit
at positions T+1 … T+4 and get `hits(T+1) … hits(T+4)`:

| T troop stacks | merc positions | merc hits (enemy first) | sum |
|---|---|---|---|
| 1 | 2–5 | 1 1 1 1 | 4 |
| 2 | 3–6 | 1 1 1 2 | 5 |
| 3 | 4–7 | 1 1 2 2 | 6 |
| 4 | 5–8 | 1 2 2 2 | 7 |
| 7 | 8–11 | 2 2 3 3 | 10 |
| 8 | 9–12 | 2 3 3 3 | 11 |

Each troop stack must reach M HP. HP per leadership point on this account (B): RD3 1,166 · ARC2 / SP2 / RD2
656 · ARC1 / SP1 / RD1 365 · SW1 227 (the specialist's smaller health bonus makes it the dearest sponge).
Leadership needed for a stack of M HP is M / (HP per point); with 4,343 leadership the biggest mercenary
stack you can put **three** troop stacks above is M = 4,343 / (1/1,166 + 2/656) ≈ 1.11 M HP, which is why the
exhaustive single-march search lands on ARC2 + RD2 + RD3 (≈ 1.11 M each) with EMH6 trimmed to 75 (1.11 M) and
the other three at their caps (§4). Four sponges (add SP2) bring M down to ≈ 0.83 M: one more merc hit (7 vs
6) but every merc stack 25 % smaller — 7 × 0.75 = 5.25 < 6, so three sponges win, and the simulator confirms it
(0014's finding that "the method matters more than the subset" was this trade at authority 200).

Silver enters through the sponges: the troops are recruited again every march, and per HP of sponge RD3
costs 0.60 silver, ARC2 / SP2 0.76, RD2 0.76, ARC1 / SP1 / RD1 0.82, SW1 1.32 (silver per unit ÷ HP per unit in
B). The mercenaries cost no silver, only stock (`ceil(n/10)` per march) and revival gold (8 or 16 per unit
÷ 1.53). So a campaign is a two-resource problem — silver buys sponges, stock buys hits — and the exchange
rate between them is what §6 measures.

## 3. Kai's march, through our engine (`tools/theorycraft/01-kai.test.ts`)

Kai's export: 11 stacks, SP1 855 · RD1 423 · ARC1 837 · SP2 451 · RD2 223 · ARC2 440 · RD3 116 · LGN 18 ·
ABT 18 · EMH 16 · CHR 8 — a strictly descending HP ladder (128,250 → 91,200 at zero bonuses), 4,107 of the
4,343 leadership used, 68 authority, SW1 absent, mercenaries sized under the smallest troop stack. Our engine
plays those exact counts and our own sizings of the same eleven types:

| march (B bonuses) | avg damage | silver | hits E/A | mercs lost / march |
|---|---|---|---|---|
| Kai's counts as given | 3,819,334 | 1,592,300 | 18 / 19 | 7 |
| ours, same 11 types, Hired last | 4,397,731 | 1,700,700 | 17 / 18 | 11 |
| ours, same 11 types, at Kai's 4,107 leadership | 4,276,102 | 1,608,500 | 18 / 19 | 9 |
| ours, same 11 types, Troops first (mercs at full caps, die first) | 6,187,924 | 1,700,700 | 17 / 18 | 30 |
| owner's 8 types, Hired last + trades | 4,474,506 | 1,799,300 | 10 / 10 | 14 |
| **exhaustive best single march: ARC2 RD2 RD3 + 4 mercs** | **7,843,624** | 2,361,500 | 8 / 9 | 28 |

(Scenario A: 2,593,591 · 3,024,901 · 2,905,369 · 4,117,736 · 4,257,493 · 5,573,521 in the same order.)

Kai's ladder loses on two counts our flat profile does not: 236 leadership left unused, and a steep ladder
(each stack 1–4 % below the previous) that forces the bottom mercenary stacks down to 91 k HP where a flat
profile keeps them at 129 k — 16 EMH6 against our 21. On his own eleven types, at his own leadership, our
sizing gives +12 % (A) / +12 % (B); at full leadership +17 % / +15 %. His per-hit model is not in the export,
so this compares marches under *our* validated model, not calculators.

## 4. Why "damage per silver" hands you one giant tier-1 stack — and what the right objective is

The owner is right to distrust it, but the engine is not wrong about the ratio. With the four mercenary stacks
at their caps (EMH6 92 = 1,361,508 HP in B), the search's only way to make them die last is a troop stack of
more than 1.36 M HP; the cheapest such stack in silver per HP among *whole-leadership* stacks is ARC1 4,343
(1,585,195 HP for 1,302,900 silver), and the march scores 5,102,536 for that silver — 3.92 per silver against
3.32 for the 7-type maximum. As a ratio it is the true optimum of the 12-type space (exhaustive).

It is the wrong objective for three reasons, all visible in the table above:

1. **It ignores the other scarce resource.** That march burns the same 28 mercenaries per march as the
   7-type maximum for 35 % less damage: 182 k per mercenary lost against 280 k. Once the stock is finite the
   ratio to silver alone is meaningless; the number to maximise is the total damage of the whole campaign
   under both constraints — which is what S-54's *Complete optimization* scores, and why it, not
   "damage per silver", is the setting to use when silver is short. §6 gives the actual optimum per budget.
2. **The sizer fills leadership.** The sponge only needs to beat 1.36 M HP; RD3 584 does it for 818 k
   silver (1,168 leadership), 37 % cheaper than ARC1 4,343, and leaves 3,175 leadership for two more sponges
   (i.e. positions, i.e. hits). Filling leadership is a TotalStack habit that is right when every unit is
   damage and wrong when troops are sponges and silver is the constraint. This is engine work (§8).
3. A tier-1 stack is not "cheap": per HP it costs more silver (0.82) than ARC2 (0.76) or RD3 (0.60), and 1.8×
   more leadership than tier 2. It wins the ratio only because it is the *smallest whole-leadership* sponge.


### 3b. The game's own report of that march, replayed (`tools/theorycraft/02-kai-report.test.ts`)

The owner then sent the in-game report of Kai's march: 30 entries, army first, four enemy squads (flying V,
mounted V, melee III, ranged III). Its enemy lines give the bonuses it was fought with — SP1 855 → 334,732 =
855 × 150 × 2.61, EMH6 16 → 252,369 = 16 × 6,090 × 2.59, SP1 base 123,975 = 855 × 50 × 2.90 — i.e. guardsmen
+159 % health / +189 % strength plus a category bonus of +2 / +1 (ranged +2.5 / +2), slightly above the
2026-09-13 report. With those bonuses the engine reproduces the report **entry for entry**:

| check | report | engine |
|---|---|---|
| entries, order of actors and stacks | 30 | 30, 0 mismatches |
| kill order | SP1 RD1 ARC1 SP2 RD2 ARC2 RD3 ABT6 LGN6 EMH6 CHR6 (HP descending, 11/11) | same |
| hits per stack | 1 1 1 1 1 2 2 2 2 3 3 (19) | same |
| every friendly line (19) | e.g. ABT6 273,600 incl. 174,078; EMH6 291,670 incl. 197,803 | identical to the unit (SP1 140,648 vs 140,647) |
| enemy lines (11) | stack HP | within 428 (0.13 %), the per-unit rounding of §1 rule 4 |
| friendly total without the proc | 3,908,633 | maximum 3,908,634 |
| entry 11 | RD3 double damage 323,686 incl. 108,390 | 161,843 incl. 54,195 (×2, features included) |

Two things this settles beyond what the three earlier reports had shown: the model holds on an 11-stack
march where the attack order and the kill order coincide across seven troop types and four mercenaries
(the sweep after the fourth enemy attack, entries 9–15 and 23–25, is exactly the engine's), and the
enemy's "extra" figures on its own lines (entries 16 and 22) do not touch anything we compute. The proc on
entry 11 is worth +161,843 — 4.1 % of the march — and is the double-damage upside §7 prices by hand.


## 5. One march: every lever, priced (scenario B unless stated; scripts `tools/theorycraft/1x-*`, `3x-*`)

All figures are average damage per march at leadership 4,343, authority 2,000, four enemy squads, every
count feasible in game. "Sizer" = what the app produces today.

| lever | from → to | Δ per march | file |
|---|---|---|---|
| **Troop types** (the floor) | owner's SW1 SP2 RD2 RD3 + mercs, Hired last + trades: 4,474,506 → ARC2 RD2 RD3 + mercs: **7,843,624** | **+3,369,118 (+75 %)** | `14-merc-split` (255 subsets ranked; owner's set is 101st) |
| same, one type only | SW1 → SP1 (owned): 6,028,008 · SW1 → ARC2 (owned): 7,201,171 · SW1 → SP3 / ARC3 (if unlocked): 8,118,886 / 8,198,149 | +35 % · +61 % · +81 % / +83 % | `26-tiers`, `33-extra-stacks` |
| **Method when the floor is low** | owner's 8 types, Hired last 4,474,506 → Troops first (all 277 mercs on top, they die first): **5,764,696** | +1,290,190 | `14-merc-split` (top-10 without ordering constraint) |
| same on the 7-type set | Hired last + trades 7,843,624 vs Troops first 7,613,209 | −230,415 (Hired last wins) | `00-baseline`, `01-kai` |
| **Mercenary counts, exhaustive** (19.9 M vectors under the caps, troops as sized) | sizer 7,843,624 → EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36: **8,061,308** | +217,684 (+2.8 %) | `14-merc-split` |
| Mercenary order alone (24 orders) | weakest per hit (LGN6) highest in HP, EMH6 / ABT6 lowest | +160,798 … +202,559 | `12-merc-order` |
| Multiples of ten (stock rule) | 8,061,308 (27 lost) → EMH6 60 · ABT6 70 · LGN6 70 · CHR6 30: 7,338,010 (23 lost) | −723,298 per march, **+7 % per mercenary lost** (319 k vs 299 k) | `14-merc-split` |
| Troop order at the round openers (p = 1, 5) | all 24 permutations of the ladder | +1,456 … +55,350; worst −638,497 | `11-round-openers` |
| Lost hits (attack order ≠ kill order) | one case in 24 marches: 12-type Troops first, RD1 wiped before its turn | −115,808 | `10-lost-hits` |
| Sacrificial front stack | any troop type on top | −85 k … −4.5 M | `15-sacrificial-front` |
| | LGN6 72 on top of the owner's 8 types | +216,404 (a step toward "Troops first", above) | `15-sacrificial-front` |
| Extra owned type back in (ARC1 / SP1 / RD1) | on the 7-type set | −1.76 M … −2.10 M | `33-extra-stacks` |
| Tail stack behind the mercenaries | up to 100 SP2 at the very end | +5 k … +62 k | `13-squads-and-stacks` |
| Catapult I (if unlocked) | 274 units, no features | −4.3 M | `33-extra-stacks` |
| **Deep ladder with small mercenary stacks** (Kai's shape; `07-deep-ladder`) | at 20/20/10/10 mercs, full leadership: 3 sponges 3,023,480 → Kai's 7 troop types 3,813,773 (mercs at positions 8–11, 2 2 3 3 hits) | +790,293 (+26 %), and +26 % per mercenary lost | `07-deep-ladder` |
| **Enemy squads** | N = 3 (no flying): 8,644,808 · N = 4: 7,843,624 · N = 8: 5,950,768 | +10 % · — · −24 % | `13-squads-and-stacks`, `34-enemy-composition` |
| Enemy categories at N = 4 | all four present 7,843,624 · no flying 7,660,000 (ABT6 → melee +394, ARC2 → melee) · no ranged 6,085,801 (CHR6, RD2, RD3 lose their features) · flying only 5,278,681 | — | `34-enemy-composition` |
| Double damage (not in the figures) | riders and CHR6 8 %, everyone else 3 % | +407,268 expected (+5.2 %) | `30-bonus-sensitivity` |

What the table says, in order of size:

1. **The troop floor decides everything.** The sizer keeps every mercenary stack under the smallest troop
   stack, so the smallest troop stack's HP is the ceiling on how much of the stock can march *and* die
   last. Swordsman I is a specialist (×1.51 health against the guardsmen's ×2.43): it needs 2,307 units to
   reach 524 k HP, the floor of the owner's march, and the mercenaries are then capped at 35 / 37 / 37 / 18.
   ARC2 + RD2 + RD3 alone lift the floor to 1,108 k and 75 / 76 / 72 / 37 march. Two thirds of the gain
   is that; the rest is the shorter ladder (3 sponges, mercs at positions 4–7 → 1 1 2 2 hits).
2. **When the floor is low, do not hide the stock under it.** With the owner's own eight types the
   mercenaries at their caps on top (1.36 M … 1.0 M HP, wiped first, 0.5 / 1 / 1 / 1 hits) still out-damage
   the 35 / 37 / 37 / 18 that fit under the troops by 1.29 M. `searchComplete` tries both methods, so it
   finds this; the plain "Hired last" card does not.
3. **The order among the mercenaries is worth 2–3 %**, and it is a rule, not a search: the enemy kills by
   HP, hits come by position, so the *weakest per hit* (LGN6, 11,058 per unit) should have the *most* HP
   and the strongest (EMH6 18,189, ABT6 15,143) the least, so that they sit at the 2-hit positions. The
   sizer's relaxed pass does the opposite on the 7-type set: it grows EMH6 to 75, which lifts it to
   position 3 (one hit). The exhaustive optimum is EMH6 67 (991 k HP) under CHR6 36 (997 k) under LGN6 72
   and ABT6 76 — five fewer EMH6 buy one more hit of the best stack.
4. **The rest of the fight structure is already right.** Troop permutations, lost hits and the army-first
   opener are worth under 1 % and the sizer's ladder is within 0.7 % of the best permutation; a sacrificial
   troop stack never pays because it pulls the floor down (an ARC1 sponge on top of the 7-type set:
   −1.38 M). One point on rule 2 stands corrected by `10-lost-hits`: striking first is not "worth a hit only
   if the opener is the first victim" — the opening strike adds one action to round 1's queue, and that
   action rescues whichever round-1 victim would otherwise have been wiped before its turn; it is worth
   nothing only when the first victim ranks below every survivor in base damage (Swordsman I in the
   owner's march: max = min there, 0 gained).
5. **Kai's deep ladder is the right shape once the mercenary stacks are small** (`07-deep-ladder`). The
   3-sponge set wins while the stock fielded is large, because the floor is what limits the stock: at
   92/76/72/37 it gives 7.83 M against 4.40 M for seven troop types (mercs 21/22/22/11 under a 320 k
   floor). Field 30/20/20/10 or less — the sustained-campaign regime of §6 — and the floor stops binding
   (EMH6 30 = 444 k, under a 320 k floor only just; EMH6 20 = 296 k fits under seven sponges), so every
   extra troop type in front is worth a later position: at 20/20/10/10, seven sponges give 3,813,773
   against 3,023,480 for three (+26 %) for less silver (1,700,700 against 2,361,500) and the same six
   mercenaries lost; at 10/10/10/10, 3,002,167 against 2,545,192. Eight sponges (SW1 back in) lose again,
   because the specialist drags the floor to 238 k. The crossover is where the biggest mercenary stack
   falls below what seven sponges can hold (≈ 320 k HP, i.e. EMH6 ≤ 21): above it, few big sponges; below
   it, Kai's ladder.
6. **Which monster you hit is a 10–25 % lever you already own.** The hits table is `ceil(p/N)`: three
   squads give the seven-stack march 8,644,808, eight squads 5,950,768, and a formation without a ranged
   squad costs CHR6, RD2 and RD3 their features (−1.76 M). The owner's own reports show the same monster
   with 3 squads at 23:02 and 4 at 23:00 (2026-09-11), so the count is readable before attacking —
   **to check in game** how the squads shown on the monster's card map to the report.

## 6. The campaign: silver buys sponges, stock buys hits (`tools/theorycraft/2x-*`)

### 6.1 Closed forms (all checked against `simulateCampaign`, `22-campaign`)

- A stack of n fielded loses `ceil(n/10)` for good. **Field multiples of ten**: 41 loses 5 like 50; the
  cap-derived counts of `marchTarget` (92 × 0.3 = 28) waste up to 39 % of the stock they burn
  (6.14 units fielded per unit lost against 10.00 for rounded counts).
- A constant n per march lasts `floor((cap0 − n) / ceil(n/10)) + 1` marches; sustaining M marches means
  fielding about `10 / (M + 9)` of the stock (52 % for 10 marches, 26 % for 30); the total units fielded
  over M marches is `10 · cap0 · M / (M + 9)`, at most **10 × the stock** (920 EMH6-marches).
- At full spend the stock decays 10 % a march, so a campaign of "the best single march" is 7.84 M, then
  7.2 M, 6.6 M … (5.97 M average over eight marches).

### 6.2 What a march costs, per design (B; `20-resource-sheet`, `06-cheap-march`)

| march | avg damage | retrain silver | revive: silver + gold | mercs lost | damage / silver | damage / merc lost | training time (+47.9 %) |
|---|---|---|---|---|---|---|---|
| owner's 8 types, Hired last + trades | 4,474,506 | 1,799,300 | 181,500 + 10,886 | 14 | 2.49 | 320 k | 3 d 23 h |
| 7 types, sizer | 7,843,624 | 2,361,500 | 237,200 + 11,600 | 28 | 3.32 | 280 k | 7 d 21 h |
| 7 types, best merc vector | 8,061,308 | 2,361,500 | 237,200 + ≈11,550 | 27 | 3.41 | 299 k | 7 d 21 h |
| 7 types, half stock (50/40/40/20), troops just above | 4,176,086 | 1,574,200 | — | 15 | 2.65 | 278 k | — |
| 7 types, **cheap**: 20/20/10/10, troops just above (L 1,162: ARC2 454 · RD2 227 · RD3 127) | 1,893,351 | 631,800 | 63,180 + ≈3,050 | 6 | 3.00 | **316 k** | ≈ 2 d |

With the mercenaries at 20/20/10/10 and *full* leadership on seven troop types (Kai's shape, §5 item 5)
a march deals 3,813,773 for 1,700,700 silver: 2.24 per silver and 635,629 per mercenary lost — the
best per-mercenary figure of any march measured, at the cost of 2.7× the cheap march's silver. So: silver
binding → the cheap march; stock binding (reviving) → seven sponges at full leadership.

The cheap march is not better per silver than the full one (3.00 against 3.32): the mercenaries' hits do
not scale with the sponges, and the sponge just above 296 k HP costs proportionally what the sponge above
1.1 M costs. It is better **per mercenary lost** (316 k against 280 k) and, above all, it is *sustainable*:
20 / 20 / 10 / 10 marches thirty times at the same strength, while the full march is 8 % weaker on its
second outing. Extra leadership beyond the floor is the worst buy in the game: the last troops return
0.22–0.65 damage per silver (`21-leadership-curve`) against 3 for the march.

### 6.3 The best plan per silver budget (B, ≤ 30 marches; `23-campaign-leadership`)

Hand-played campaigns over subset × spend (multiples of ten) × leadership (just above the mercs, or full),
retrain and revive at temple 15; `searchComplete`'s answer on the same budget beside it.

| silver | retrain: best plan | marches | total damage | `searchComplete` | revive (gold): best plan | marches | total damage | gold |
|---|---|---|---|---|---|---|---|---|
| 2 M | 7 types · 20 % · L 1,162 | 3 | 5,680,053 | 6,079,306 (1 march, 8 types at 75 %) | same plan | 30 | 56,592,404 | 91,727 |
| 5 M | 7 types · 100 % · full L | 2 | 14,600,282 | 15,152,056 | 8 types (ARC2 SP2 RD2 RD3) · 50 % | 23 | 96,817,924 | 230,575 |
| 10 M | 7 types · 20 % · L 1,162 | 15 | 28,400,265 | 30,396,530 | 8 types · 50 % · full L | 30 | 111,261,571 | 318,871 |
| 20 M | 7 types · 20 % · L 1,162 | 30 | 56,592,404 | 56,246,733 | same | 30 | 111,261,571 | 318,871 |
| uncapped, revive | | | | | 8 types · 20 % · full L | **72** (stock gone) | **176,041,232** | 748,636 |

Read it as three regimes:

- **Silver-bound, one or two marches (≤ 5 M):** field the full 7-type march; the cheap march only wins
  when it buys enough extra marches to beat the stock decay (from about 8 M upward, +2.5 % at 10 M, +18 % at
  20 M against the best full-strength plan).
- **Silver-bound, many marches (≥ 10 M):** cheap marches, 20 % of the stock in tens, troops just above
  them. Note that `searchComplete` cannot produce this plan — it always fills leadership and its first
  stage shortlists on single-battle score — and that its answer is within 3–7 % only because it drifts to a
  75 % spend instead.
- **Gold available:** reviving divides the troops' silver by 10 (the mercenaries' gold, 1.3–1.4 k a march
  at full stock, is charged either way), so silver stops binding and the *stock* does; then fill
  leadership again and stretch the stock: 20 % of it in tens, 72 marches, 176 M with four troop types —
  and about 275 M with Kai's seven (3.81 M a march instead of 2.44 M, `07-deep-ladder`; the campaign grid
  of `23-campaign-leadership` only had the 3- and 4-sponge sets, so its revive figures are a floor). Silver saved per gold is a property of the unit type
  (`training.silver × 1.53 / revival.gold`): RD3 268, tier 2 191, tier 1 115, mercenaries 0 — so when gold
  is short revive RD3 first, then ARC2 / RD2, and note that the game's TOP 1–4 selective revive would
  spend it on the four tier-6 mercenaries, which saves no silver at all (`24-recovery-choice`). Potions
  are the same 90 % at 3 a unit (RD3: 467 silver per potion) but the Temple makes 2.7 an hour — 22 units a
  day, noise.
- **Time** (`25-time`): the full 7-type march retrains in 11 d 16 h at 0 % training speed, 7 d 21 h at the
  account's +47.9 %; the cheap march in about two days; reviving leaves only the tenth to train (19 h).
  Whether the game trains several unit types in parallel is **to check in game** — the repo has no
  evidence either way, and it decides whether retraining or reviving is even a choice.

## 7. Bonuses, captains, gear (B; `30-bonus-sensitivity`, `31-captains`, `05-captain-swap`, `32-gear`)

- **Strength is linear and small per point**: +1 on `army` or `guardsmen` strength, or on
  `armyStrengthAgainstEpicMonsters`, is +12,325 a march on the 7-type set (0.16 %). **Health is worth
  nothing when it is uniform** (the ladder rescales, the counts rescale, damage per hit does not move) and
  matters only when it is uneven — that is the whole Swordsman I story of §5. **Double damage** is the
  expensive percentage: one point is avg / 100 = 78,436 a march, six strength points; the chances already
  carried (riders and Chariot 8 %, the rest 3 %) are +5.2 % the app does not show.
- **Captains, netted against Aydae** (scenario B already contains Aydae's +52 / +82 because the captain
  marched in the reference fight; `05-captain-swap`): at level 37 ★3 on the 7-type march, Skadi (guardsmen
  +494 / +494) +5,078,984, Heimdall (army strength +385.5) +3,742,235, Hercules (+254 vs epic monsters)
  +2,121,254, Beowulf +2,034,475, Cleopatra +185,939; Ramses II (health only) −1,009,766, i.e. exactly "no
  captain". On the owner's *old* 8-type march the same Skadi is −561,080: a guardsmen bonus widens the
  gap to the specialist and drops the floor. Which captains he owns, and at what level, is a game question.
- **Gear and titles** priced as if switched on: Heart of the Forest at level 60 ★5 (+720 army strength)
  +8,873,676; Warrior of Ragnarök godlike (+210 vs epic monsters) +2,588,156; Battlemaster +1,849,586;
  Warlord / Immortal Warrior +1,233,288. Obtainability unknown; eight titles carry only
  strike-two-squads, which the engine does not model.
- **Monsters** (dominance 800 unused, `monsters: null` in the export; `33-extra-stacks`): one Devastator II
  would be +12.5 M on the owner's march for 2,120 dragon coins a chunk, but almost all of it sits in the
  maximum — a 3.5 M-HP stack dies first and strikes only when we go first. **Only if he owns or can train
  them**, and the relaxed pass lets exactly one such stack above the troops (an engine quirk, §8).

## 8. What to do, and what to build

**For the player, this week (B, per march unless stated):**

1. **March ARC2 + RD2 + RD3 + the four mercenaries, Hired last.** Take Swordsman I out, keep ARC1 / SP1 /
   RD1 out. 7,843,624 against today's 4,474,506. If ARC2 is short, SP2 in its place loses 0.4 %.
2. **Then edit the mercenaries by hand**: EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36 → 8,061,308. The rule
   behind it: the biggest hitter must be the *smallest* mercenary stack.
3. **Choose the monster**: three squads over four, never eight; ranged and flying squads present.
4. **If silver is the wall** (the 2026-09-13 screenshot shows about 1.1 M — to confirm): the cheap march,
   ARC2 454 · RD2 227 · RD3 127 · EMH6 20 · ABT6 20 · LGN6 10 · CHR6 10, 631,800 silver, 1,893,351 damage,
   6 mercenaries; it sustains 30 marches. Below ~8 M of total silver, two full marches beat it.
5. **If gold is available, revive** instead of recruiting: the troops' silver ÷ 10, RD3 first. With gold the
   right plan flips to full leadership, 20 % of the stock in tens, and **Kai's seven troop types in front**
   (ARC1 SP1 RD1 ARC2 SP2 RD2 RD3, never SW1): 3.81 M a march, up to 72 marches, ≈ 275 M.
6. **Count mercenaries in tens** whenever the stock, not this march, is the constraint.
7. Captain: Skadi > Heimdall > Hercules if owned; any health-only captain is worth nothing here.

**For the engine (in order of measured value):**

- **E1 — the complete search must own leadership, and re-choose the subset per spend level** (it does; the deep ladder only wins below ≈ 30 % spend, which is why a single-battle shortlist at full stock never proposes it). Add "troops sized just above the mercenaries" as a
  sizing choice beside "full leadership", size the mercenaries in tens when a spend level is below 1, and
  shortlist on the *campaign* score (stage 1 on single-battle score is why a hand grid beats it by up to
  10 % and why it never finds the 20 % · L 1,162 plan). Playing the stock decay per march is already there.
- **E2 — mercenary post-pass by simulation.** After sizing, hill-climb the mercenary counts (±12 per type,
  every order of the four) on `simulateBattle`; +2.8 % on the winner, +5 % on the owner's march, and it
  would also undo the relaxed pass's habit of lifting EMH6 above a troop stack.
- **E3 — "Troops first" as a candidate whenever the floor is low**, with the message "your troop stacks are
  too small to shelter the stock; it fights better on top" (+1.29 M on the owner's march).
- **E4 — price double damage in the average as an explicit line** (chance × hits × damage per stack); the
  report's entry 11 shows it is real and it is +5 % here.
- **E5 — selective revive by silver saved per gold, not by tier**; the tier rule spends the first four steps
  on mercenaries, which saves nothing.
- **E6 — the profile.** Authority 2,000, temple 15, the captain active, and the report-derived bonuses
  (+159 / +189 on 2026-09-14) instead of the export's +3 / +3; and `relaxPreservation` should respect the
  ceiling it was given (it lets one monster stack past the troops today).

## 9. Reproducing

```
THEORY=1 pnpm vitest run tools/theorycraft            # everything, ~25 min (14-merc-split is 20 of them)
THEORY=1 pnpm vitest run tools/theorycraft/02-kai-report.test.ts   # the in-game report replay
```

Each script writes `tools/theorycraft/out/<name>.md` with its inputs, method and full tables; the outputs of
this run are committed beside the scripts. `harness.ts` documents the two bonus scenarios and the
authority correction; `PYRRHIC_EXPORT` overrides the export path (the owner's file stays out of the repo).

