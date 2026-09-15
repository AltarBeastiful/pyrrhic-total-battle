# Investigation 0016 — the march, optimised: the ledger, the ladder's bottom, and the few-marches plan

2026-09-14. The owner's question, in his words: *I have a constrained amount of silver and mercenaries (they
only revive at 90 %); what is the most efficient way to make the most damage across a few marches?* This is
the continuation of 0015 — same account, same engine, five new experiments, and two of 0015's rules corrected.

Everything below is computed with the repo's engine (`src/engine`), which reproduces in-game battle reports
line for line. Every number comes from a script under `tools/theorycraft/`, each of which writes its own
report to `tools/theorycraft/out/`. Reproduction commands are in §10. Nothing here assumes a game rule the
repo's evidence does not support; where a lever depends on something unverified it is labelled
**to check in game**, and §8 lists those explicitly, with the reading that would settle each one.

## 0. Inputs, and the one thing that changed since 0015

| input | value | source |
|---|---|---|
| housing | leadership 4,343 · authority **2,000** · dominance 800 | owner's export + his correction |
| temple | level 15 (÷1.53), 2.7 potions/hour | export |
| mercenary stock | EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37 (authority 1/1/1/2 → 314 at full) | export |
| troop types owned | SW1, ARC1, SP1, RD1, ARC2, SP2, RD2, RD3 | export |
| enemy | 4 squads, one per category | export |
| the march under study | SP1 855 · RD1 423 · ARC1 837 · SP2 451 · RD2 223 · ARC2 440 · RD3 116 · LGN6 18 · ABT6 18 · EMH6 16 · CHR6 8 | the owner's own setup, `docs/research/battlereportkai.md` |

**Authority never binds.** The full mercenary stock costs 314 of the 2,000, and every march in this
investigation spends 283–314. Leadership is the binding pool everywhere, and the *stock* is the other one.

**The bonuses moved.** 0015 ran under scenario **B** (guardsmen +143 % health / +187 % strength), derived
from the 2026-09-13 report. The report the owner sent on 2026-09-14 was fought with different ones —
scenario **C**:

| | health | strength | effective |
|---|---|---|---|
| melee / mounted | +161 % | +190 % | ×2.61 / ×2.90 |
| ranged | +161.5 % | +191 % | ×2.615 / ×2.91 |
| EMH6 (no category tag) | +159 % | +189 % | ×2.59 / ×2.89 |
| double damage | +3 % on every unit (5 % base on riders and CHR6) | | ×1.08 / ×1.03 |

That is ±2 points of health on the account's real fight, and §1 proves it rather than assuming it. **Every
headline number below is computed under C**; the B number is given beside it, and the winner is stable
across both.

## 1. The 2026-09-14 report, fitted and replayed (`49-audit`)

The report's own 30 lines invert to the bonuses without a search: health = enemy line ÷ count ÷ base HP,
strength = (line − extra) ÷ count ÷ base strength. The result is three health multipliers (×2.59 / ×2.61 /
×2.615) and three strength multipliers (×2.89 / ×2.90 / ×2.91) — so **no uniform bonus set can explain this
report**: the best uniform fit over a 201×201 sweep leaves a residual of 5,317, the per-category fit leaves
942. The `extra` field divided by count ÷ base strength reproduces the units table's strength-against to the
digit for all eleven units (39 / 65 / 67 / 59 / 98 / 101 / 146 / 509 / 295 / 609 / 493 %), which also
confirms each stack's target squad.

Replay, army-first, 4 enemy squads:

| check | result |
|---|---|
| entries, actor sequence, stack sequence | 30/30, **0 mismatches** |
| hits per stack | 1 1 1 1 1 2 2 2 2 3 3 = 19, identical |
| friendly lines | **10 of 11 exact**, Σ\|Δ\| = 1 (SP1: engine 140,648 vs report 140,647 — the game truncates a .5, the engine rounds up) |
| friendly total without the proc | report 3,908,633 · engine 3,908,634 |
| entry 11 (the proc) | report 323,686 incl. 108,390 = exactly 2 × the squad's ordinary 161,843 incl. 54,195 |
| enemy lines | 3 of 11 exact, max \|Δ\| **428 (0.128 %)**, Σ\|Δ\| = 941 — the per-unit rounding of HP |

0015's claim ("0 mismatches, enemy lines within 428") is confirmed as a claim about the *sequence*. The
digits are 10/11 and 3/11 exact; the rest carry that rounding tolerance, and the tolerance is a model
artifact worth fixing (§9, E5).

### 1b. The model's one load-bearing rule that is NOT verified — and the march that tests it

"The enemy destroys the stack it attacks" holds in 40/40 observed kills. But in every one of those lines the
enemy's damage **is** the destroyed stack's HP — so the report is structurally incapable of showing the
monster's raw damage. If a monster's attack is a fixed number, a big enough stack survives it and strikes in
every round, and every damage figure in the app is wrong.

The envelope, measured: the largest stack ever attacked is 345,504 HP; the largest number a monster has ever
printed is 334,732. So the rule is untested above 345 k, and the test threshold is ≥ 669,464 HP.

| test march | biggest stack | engine says today | if the stack survives |
|---|---|---|---|
| `EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37` (no troops) | 1,451,116 HP | 4,733,483 | — |
| `RD3 268` + those mercenaries | 671,608 HP | 5,107,397 | — |
| `RD3 2,171` alone (all leadership) | 5,440,526 HP | 3,028,979 | ~3.0 M per extra round |
| reference best march | — | 8,178,426 | — |

**Send** the mercenaries-only march (the first monster hit already meets a 1,451,116-HP stack, 4.3× anything
tested), then the RD3 268 variant (the fifth hit reaches RD3), then all-in RD3 2,171.
**Read** the enemy line against the big stack, and whether that stack's card returns.
**Means** line = the full stack HP and the stack gone → the one-shot rule holds 2–16× beyond anything
tested and the model stands. A line near 300 k with the stack reappearing on a partial figure → survival is
real, and one giant stack becomes the best march in the game. Note the model *punishes* this shape today
(−38 %): it is the one thing the engine refuses to let fight twice.

## 2. The ledger — why a march scores what it scores (`45-ledger-optimum`)

With `hits(p)` the number of strikes of the stack at kill position p, the engine's score is exactly

```
damage = Σ_p  hits(p) × damagePerHit(p)        damagePerHit(p) = k_u × HP_p
```

where `k_u = damage per hit per unit ÷ HP per unit` is a **constant of the unit type**. Verified with Δ = 0
against the engine's own journal on seven marches (the owner's, the sizer's, 0015's two, two flat ladders,
and the B run). The closed form `hits(p) = ceil(p/N) − [p ≡ 1 mod N]` agrees only while the attack order
(base damage) and the kill order (HP) coincide — 5 of the 7; where they separate it misses by 94,423.

Two ratios and nothing else rank a type:

| unit | pool | cost | HP/unit | HP per pool pt | α per hit per unit | **k = α/HP** | **α per pool pt** |
|---|---|---|---|---|---|---|---|
| EMH6 | auth | 1 | 15,773 | 15,773 | 18,229 | **1.156** | **18,229** |
| ABT6 | auth | 1 | 14,906 | 14,906 | 15,200 | 1.020 | 15,200 |
| CHR6 | auth | 2 | 29,754 | 14,877 | 29,754 | 1.000 | 14,877 |
| LGN6 | auth | 1 | 14,877 | 14,877 | 11,115 | 0.747 | 11,115 |
| RD3 | lead | 2 | 2,506 | 1,253 | 1,395 | 0.557 | 697.5 |
| ARC2 | lead | 1 | 706 | 706 | 353 | 0.500 | 353 |
| RD2 | lead | 2 | 1,409 | 704.5 | 698 | 0.495 | 349 |
| SP2 | lead | 1 | 705 | 705 | 314 | 0.445 | 314 |
| ARC1 | lead | 1 | 392 | 392 | 179 | 0.46 | 179 |
| RD1 | lead | 2 | 783 | 391.5 | 355 | 0.45 | 177.5 |
| SP1 | lead | 1 | 392 | 392 | 165 | 0.42 | 165 |
| SW1 | lead | 1 | 153 | 153 | 61 | 0.40 | 61 |

- **α per pool point decides whether a type belongs in the march at all.** Mercenaries win by 20×
  (18,229 a point for EMH6 against 697.5 for RD3), and among troops RD3 wins by 2×, which is why it is the
  only sponge that ever appears in an optimum.
- **k decides where a stack can afford to sit**, because the enemy kills by HP and everyone strikes by
  position: a high-k stack wants to be *small* so it dies late and strikes often.
- **But the two rules together are not a construction.** The real problem is an *assignment* — which stack
  gets which hit-slot — and it is a knapsack: shrinking a stack to move it down the ladder trades HP for
  hits, and it only pays when the extra hit beats what the displaced stack loses. §3's winner is the proof:
  it violates every hand rule in 0015, including the one about mercenary order.

## 3. The optimum: 8,338,153 a march (`45`, converged with `47`)

Two independent searches found the same march — one hill-climbing counts from 1,227 seeds (255 troop subsets
× 4 scales, sizer, the owner's march, 0015's two, 200 random; 204,276 `evaluateCounts` calls in 4 s), the
other climbing 510 seeds on a different objective (§5). A third, structured search (ladders built by hand,
`46`) stopped at 8,159,844 — 2.1 % short, and it is the search that reported the trap: **the average-damage
objective is a staircase** (every stack's contribution is an integer number of hits), so a count change that
has not yet bought a strike moves the score by nothing, and a naive climb stalls at 7,999,939 against a
reachable 8,338,153. Climbing first on the proc objective — continuous in counts — escapes it.

| candidate | scenario | avg | min | max | silver | gold | mercs lost |
|---|---|---|---|---|---|---|---|
| **the optimum** `RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138` | C | **8,338,153** | 7,932,150 | 8,744,156 | 2,404,300 | 1,427 | 30 |
| the same shape re-climbed | B | 8,300,884 | — | — | 2,405,100 | 1,427 | 30 |
| 0015's exhaustive winner (ARC2 1,697 · RD2 848 · RD3 475 · EMH6 67 · ABT6 76 · LGN6 72 · CHR6 36) | B | 8,061,308 | 7,795,471 | 8,394,173 | 2,361,500 | 1,339 | 27 |
| the same, scored under C | C | 8,094,822 | — | — | 2,361,500 | 1,339 | 27 |
| 0015's §5 reference march (sizer-shaped, K = 7) | B | 7,843,624 | — | — | 2,361,500 | 1,339 | 28 |
| the app's own sizer, all twelve types | C | 5,814,831 | — | — | — | — | — |

**The optimum is +5.8 % on 0015's reference and +3.0 % on its best hand-tuned march**, for 30 mercenaries
a march against 27–28 and 43 k more silver.

The winner's own ledger, which is the whole explanation:

| # | stack | units | total HP | per hit | k | hits E/A | damage E |
|---|---|---|---|---|---|---|---|
| 1 | RD3 | 582 | 1,458,492 | 812,006 | 0.557 | 0/1 | 0 |
| 2 | EMH6 | 92 | 1,451,116 | 1,677,105 | 1.156 | 1/1 | 1,677,105 |
| 3 | ARC2 | 1,519 | 1,072,414 | 535,903 | 0.500 | 1/1 | 535,903 |
| 4 | RD2 | 761 | 1,072,249 | 531,482 | 0.495 | 1/1 | 531,482 |
| 5 | LGN6 | 72 | 1,071,144 | 800,280 | 0.747 | 1/1 | 800,280 |
| 6 | CHR6 | 36 | 1,071,144 | 1,071,144 | 1.000 | 2/2 | 2,142,288 |
| 7 | ABT6 | 71 | 1,058,326 | 1,079,200 | 1.020 | 2/2 | 2,158,400 |
| 8 | SP2 | 138 | 97,290 | 43,332 | 0.445 | 2/2 | 86,664 |

Read it as a stack of resources: RD3 takes the round-opener slot and strikes **zero** times when the enemy
goes first (it exists to be the biggest HP, nothing more — its 812 k only appears in the max column);
the five middle stacks sit on one-hit rungs; the last three get two strikes each. EMH6, the strongest unit
in the game by k, sits at position 2 on **one** hit — it is at its stock cap of 92, which forces a
1.45 M-HP stack.

Moving it is a trap, and the referee has the numbers. Trimming EMH6 to 67 units — the count that drops it
into a two-strike rung — **costs 1,384,709** (6,953,444): the ladder reshuffles, so the stack that swaps
*down* takes the two-strike rung the swapping stack left while a third loses a strike to a lost attack-order
coincidence. Spending the freed authority on ABT6 and CHR6 up to their caps recovers most but not all of it
(**7,859,478, still −478,675**). That is why the hand rules of 0015 §5 and `46` are local rules, not the
rule: the problem is a slot assignment, and intuition about one stack at a time gets it wrong.

**What the app leaves on the table.** Its own sizer produces 5,814,831 under C; keeping the sizer's *subset*
and hill-climbing only the counts reaches 7,835,412 — **80 % of the whole gap**, same 30 mercenaries. A
subset search is worth 82 %. So the cheapest engine change is the count climb, not a new search (§9, E1).

## 4. The bottom of the ladder: the tail, and 0015 corrected (`46-ladder-bottom`)

The last rungs of the ladder are the ones that strike most, and 0015 never put anything but mercenaries
there. A **tail** — one cheap troop stack below every mercenary stack — is worth:

| move | number |
|---|---|
| tail `SP2 246` at the end of the 7-type optimum | **+66,409 (+0.82 %)** and **−10,800 silver** |
| the same 4,343 leadership spent as a fourth flat sponge instead | the tail is **+646,852 (+8.61 %)** better |
| the tail's own rate, mercenary vector frozen | 198 SP2 bought +54,087 for −8,400 silver = **273 damage per tail unit** |
| the last 1,000 leadership, as a tail | **2.71 damage per silver** (B: 2.48), curve 2.09–2.79 |
| more tail (SP2 564) | 7,914,968 — **218 k below** the optimum; past ~246 the sponges shrink faster than the tail pays |

**This corrects 0015 §6.2.** Its conclusion — "extra leadership beyond the floor is the worst buy in the
game, 0.22–0.65 damage per silver" — measured leadership spent as a *sponge above* the mercenaries. Spent
as a *tail below* them it returns **2.71**, and the tail is the only lever in this whole study that raises
damage **and lowers silver**: the leadership it takes off the sponges is tier-2/tier-3 (500–1,400 silver the
thousand), the leadership it puts back is tier 1.

Two negative results, both engine-scored:

- **Putting mercenaries above the troops never pays**, at any count: k = 1/2/3/4 mercenary stacks on top
  costs −369,693 / −675,745 / −1,032,733 / −1,122,811 (C). "Hired last" survives as a family.
- **0015's flat ladder is knife-edge.** Its ARC2/RD2/RD3 rungs sit within 0.4 % of each other in HP, so the
  attack order and the kill order separate over a single unit: adding a 20-unit ARC1 tail to a flat ladder
  costs **660,674** (one lost strike), and a 25-unit tail makes it worse. Any hand-built ladder must keep
  its rungs strictly ordered and its k's ascending.

## 5. Procs: real, free, and impossible to steer (`47-procs-enemy`)

The app deliberately excludes double damage from its score. Priced as the game pays it (a plain ×2 on one
hit, features included — verified on entry 11 of this very report), the expected damage of the winner is
**8,742,286 against its 8,338,153 average, +4.85 %**. The objective was validated exactly: forcing every
chance to 0 returns the engine's own average, forcing 100 % returns 2×.

But **re-arranging the march to farm procs captures 0.00 % of it** (−0.003 %: 8,742,031 against 8,742,286).
The riders and CHR6 already sit on the two-hit rungs, and three of the four mercenaries carry 3 %, so there
is nothing to move onto them. Across seven enemy formations the proc objective is worth 0.00 % to +0.73 %
and never changes the army.

For scale: the app's *other* free lever — striking first, its min → max spread — is **+10.2 %**
(7,932,150 → 8,744,156), twice the procs, and it is free upside the app already prints.

## 6. The enemy is a lever you own before you march — but re-arranging is not (`47`)

0015 scored one fixed march against many formations. Re-optimising the *march* for each formation is worth
much more, and it is the same seven or eight types every time:

| enemy formation | best march | K | avg | gain over the fixed march |
|---|---|---|---|---|
| 3 squads (ranged + mounted + melee) | ARC2 1,605 · ABT6 76 · RD3 449 · RD2 795 · EMH6 71 · CHR6 37 · LGN6 72 · SP2 250 | 8 | **9,063,829** | +4.4 % |
| 4 squads, one of each (or **no melee** — identical) | `§3`'s winner | 8 | 8,338,153 | +5.8 % |
| 4 squads, no flying | the same, re-sized | 8 | 7,996,440 | — |
| 4 squads, no mounted | RD2 804 · RD3 452 · CHR6 37 · LGN6 72 · ARC2 1,497 · EMH6 67 · ABT6 70 · SP2 107 · RD1 57 · ARC1 113 | 10 | 7,678,213 | +8.6 % |
| 4 squads, no ranged | CHR6 37 · LGN6 72 · RD3 424 · ARC2 1,501 · SP2 1,499 · EMH6 67 · ABT6 70 · RD2 247 · ARC1 1 | 9 | 7,226,977 | +18.1 % |
| 8 squads (Arachne's) | ARC2 2,773 · RD3 781 · EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · RD2 4 | 7 | 6,315,085 | +5.6 % |

- **The optimal stack count is set by the hit staircase, not by N**: 8 at N = 3, 8 at N = 4, 7 at N = 8. The
  hypothesis that more squads demand more stacks is **refuted**.
- **A denied category never changes membership, only the proportions** — when ranged is absent, RD3 drops
  582 → 424, RD2 761 → 247 and SP2 rises 138 → 1,499 (the tail takes over).
- **A melee enemy squad is worth exactly nothing** to this account: removing it produces a byte-identical
  winner (8,338,153 either way).
- Practical rule: **attack a monster showing three squads, and check that one of them is ranged and one is
  flying.** Three squads are +9 % on four, a missing ranged squad costs 13 % however you re-arrange, and
  Arachne's eight cost 24 %. Do not re-arrange per monster — the same types win everywhere; only the tail
  and the proportions move.

## 7. A few marches, under both constraints (`48-few-marches`)

The owner's position as 0015 estimated it from a 2026-09-13 screenshot — about 1.1 M silver, marked
*to confirm* there — plus a bounded stock that decays 10 % a march and whatever gold he has. **Treat the
silver figure as unconfirmed; the plans below are parameterised by it, not derived from it.** Three
regimes, all engine-scored; the campaign loop was validated against `simulateCampaign` to the unit on four
plans, and the searches are exact for M = 1 and M = 2 (all 475 designs, all 261² pairs).

**The regime 0015 missed: a march with no troops costs no silver at all.** Mercenaries are hired, not
trained — the Army tab prices nothing for them — so a mercenaries-only march pays in gold (Temple revival)
and stock only. `EMH6 90 · ABT6 70 · LGN6 70 · CHR6 30` scores **3,554,993 for 0 silver**, 1,365 gold and
26 mercenaries. Nine of the ten marches in plan A below are exactly that, and it is the entire reason a
1.1 M purse reaches ten marches: **24.0 damage per silver against 2.71** for a campaign that protects every
mercenary stack.

Mechanics that decide the plan:

| lever | number |
|---|---|
| schedule order (100 % → 80 % → 60 % vs 60 % → 80 % → 100 %) | **irrelevant** — 10,945,677 both ways, 34 mercenaries both ways. The multiset of marches is what matters, not their order. |
| +1 mercenary of each type | CHR6 **29,754** · ABT6 15,200 · LGN6 11,115 · EMH6 **9,114** |
| +10 mercenaries | exactly 10× the above, to the digit |
| +100,000 silver | 260,965 (3 marches, 1.1 M) · 144,381 (3 marches, 2 M) · 103,042 (10 marches, 5 M) · **0 under revival** |
| reviving instead of retraining | divides a march's silver by **10.0** (2,361,500 → 237,200) and adds gold |
| revive-first order, silver saved per gold | **RD3 268** · ARC2/SP2/RD2 191 · tier 1 115 · **any mercenary 0** |

Two things fall out of that table. **EMH6 is the least valuable mercenary per unit added** (9,114 against
CHR6's 29,754) even though it is the best per hit — it is the first stack the enemy kills, so half its
strikes never happen; when the stock binds, add CHR6 first. And **the game's own selective revive (TOP 1–4)
is worthless here**: it spends its steps on the four tier-6 mercenaries, which save no silver at all —
revive RD3 first, then tier 2.

### The three plans

Counts are the sizer's output; mercenary vectors are EMH6/ABT6/LGN6/CHR6.

**A — his purse, no gold** (≈1.1 M silver, < 10 k gold): 10 marches, **25,554,477 damage**, 1,062,800 silver,
8,920 gold, ~5 d training, burns 180 of 277 mercenaries.

| march | mercenaries | troops |
|---|---|---|
| 1 | 90/70/70/30 | none — 3,554,993 damage, **0 silver** |
| 2 | 83/69/65/30 | none |
| 3 | 24/26/20/10 | ARC2 562 · SP2 562 · RD2 281 · RD3 157 — the one paid-for sponge (3,000,849 for 1,062,800 silver) |
| 4–10 | 71/59/56/30 · 63/53/50/27 · 56/47/45/24 · 50/40/40/20 · 45/38/36/19 · 40/34/32/17 · 36/30/28/15 | none |

**B — his purse plus gold** (same silver, ≈57 k gold): 10 marches, **43,553,746 damage** (+70 % on A for
47,960 gold = 375 damage per gold), 1,099,600 silver, burns 179 of 277.

| march | mercenaries | troops |
|---|---|---|
| 1–4 | 54/57/57/28 (constant) | ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 |
| 5 | 53/52/48/25 | ARC2 1,212 · RD2 605 · RD3 339 |
| 6–10 | 62/46/43/20 · 50/40/38/20 · 50/37/34/18 · 45/33/30/16 · 40/29/27/14 | none |

**C — protect the stock for next week** (same silver, ≈35 k gold): 3 marches, **22,372,271 damage**, 706,900
silver, 34,343 gold, burns only **75** mercenaries (leaves 70/55/51/26) — the best damage per mercenary of
the three, 298 k against A's 142 k and B's 243 k.

| march | mercenaries | troops |
|---|---|---|
| 1 | 75/76/72/37 | ARC2 1,697 · RD2 848 · RD3 475 (0015's winner, 8,094,822) |
| 2 | 75/68/64/33 | ARC2 1,697 · RD2 848 · RD3 475 |
| 3 | 54/57/57/28 | ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 |

**Which one to run is a question about which resource is scarce, not about marching.** Silver scarce and
gold absent → A. Gold available → B, and revive (it cuts a march's silver tenfold). Stock scarce → C.
Front-loading and rationing were both tested and both failed; the only thing order changes is *how many
marches the purse reaches* (at 1.5 M silver: descending fights 0 marches, ascending 1, constant-small 2).

## 8. What is proved, what is consistent, and what is not verified (`49-audit`)

| rule the model uses | evidence | verdict |
|---|---|---|
| kill order = total HP descending | 4 reports, 40/40 kills; discriminating cases: a mercenary killed first and unstruck, RD1 killed 3rd by HP though 4th by damage | **proved** |
| attack order = base damage descending | one discriminating pair (SW1/RD2 inversion) + two 09-11 reports | **proved, on one pair** |
| round structure: N attacks, a strike between each, end-of-round sweep | 4 reports + 3 journals | **consistent** — the sweep is one line short in one 09-13 fight (20/21) |
| damage per hit = base + features | 63 in-game friendly lines + 3 journals | **proved** |
| the `extra` is strength-against on the *base* strength, already inside the total | 63 lines, re-checked for all 11 units | **proved** |
| the enemy always destroys the stack it attacks | 40/40, but the line *is* the stack's HP and nothing above 345 k has ever been attacked | **unverified** — §1b |
| the enemy line = the destroyed stack's HP | 40/40 as an identity | **proved as an identity, unverified as causation** |
| one stack per unit type per march | never exercised (every captured march has distinct types) | **unverified — an engine contract** |
| a maximum number of stacks per march | nothing in the repo (largest seen: 11) | **unverified — an engine contract** |
| the monster's displayed figure and the red kill badge | the badge reconciles M1 −7/7, M2 −3/3, M3 −1/1, M4 −78 over 77 kills (±1 on 3 of 7 segments); the figures 2.07 M–29.56 M are incompatible with ~19.5 k damage per kill | badge = kills **consistent**; the figure's meaning **unverified** |
| damage or kills drive XP | nothing in the repo mentions XP | **unverified** |
| training runs in parallel across types | nothing | **unverified** |
| march limits, cooldowns, monster re-attack | nothing | **unverified** |

The three that change arithmetic, with the test that settles each:

1. **Survival** (§1b) — the whole model, and the biggest single upside in this document.
2. **Two stacks of one unit type.** If the game allows it, the same battle is worth **+32 %** (eight RD3
   stacks: 11,037,279 against 8,338,153 — engine-scored, `45` §5a), and the app is missing marches outright.
   *Read:* add the same type twice and see whether the report prints two cards.
3. **XP: damage or kills?** From this report, damage per badge-kill spreads **22.4×** across the monster's
   squads (M3 437,505 · M2 170,612 · M1 143,927 · M4 19,552). *Read:* send an EMH6-only and a CHR6-only
   march at the same monster and compare XP ÷ damage against XP ÷ kills.

Two further one-line tests: **chunk vs per-unit billing** in the recruit screen (lose ~45 troops of a type;
`45 × silver` = per unit, `5 × silver` = per chunk — if per chunk, every retrain plan in §7 is 5–10 %
cheaper), and **a T7 mercenary swap** (`49` §4: same counts, +64 % on the best march, +18 % on the owner's —
attainability is a game question, not a modelled fact).

## 9. What to do

**For the player, this week (scenario C, per march unless stated).**

1. **March `RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138`.**
   8,338,153, +5.8 % on the reference march for 30 mercenaries. If hand-editing that is too fiddly, take
   the cheaper edit first: 0015's seven types are within 3 %, and `46`'s tail variant (8,159,844, 27
   mercenaries) is the gentlest change that beats 0015.
2. **Always put a tail stack last**, even a small one: it raises damage and lowers silver at the same time.
3. **Choose the monster before the march**: three squads, never eight, with a ranged and a flying squad
   present. Worth 9–24 % for no cost at all.
4. **When silver is the wall, march mercenaries with no troops at all** — 0 silver a march, paid in gold and
   stock. It is what makes ten marches reachable from a 1.1 M purse.
5. **When the stock is the wall, add CHR6 first**, and revive rather than retrain: RD3 first, then tier 2,
   and never spend the selective-revive steps on mercenaries (they save no silver).
6. **Do not re-arrange for procs** — worth 4.85 % automatically, 0.00 % steerable.

**For the engine, in order of measured value.**

- **E1 — hill-climb the counts after sizing.** +2,020,581 (80 % of the sizer's gap to the optimum) for
  ~200 k engine calls in 4 s, same mercenary count. Climb on the proc objective (continuous in counts) and
  score on `simulateBattle`; climbing on the average alone stalls on its staircase.
- **E2 — offer "tails" as a sizing choice.** Leadership spent below the mercenaries instead of above them:
  +8.6 % over the same leadership as a sponge, and it lowers silver. This changes 0015 §6.2's advice.
- **E3 — stop forcing every mercenary under every troop stack.** The optimum mixes; the rule costs 2.1 %
  (`168,526`) and 2.28 M (17 %) once mercenaries out-stat the troops (the T7 case).
- **E4 — print the proc band.** It is +4.85 % and free, and this pass shows it can be stated exactly as a
  per-stack multiplier; it also proves the band is not steerable, which is worth saying in the UI.
- **E5 — enemy lines in the report should not be rounded.** The engine rounds `hpPerUnit`, the game
  truncates; that is the whole of the 428 (0.128 %) residual and the only reason the replay is not exact.
- **E6 — the survival question belongs in the model's notes**, not just in this document: the app's "every
  stack dies" is an inference from reports that cannot show otherwise, and the app *punishes* the one shape
  that would exploit it (−38 %).

## 9b. The weekly economy answers a different question (`51-weekly-answer`)

The owner's real economy (2026-09-14): **8 M silver and 12 k gold on hand, ~4–6 M silver a week, ~10 k gold a
week, ~95 EMH6 a week** (daily missions), and the advanced mercenaries (ABT6 / LGN6 / CHR6) bought with real
money — irreplaceable. That is a *flow*, not a purse, and it changes the answer of §3, because three
constraints the single-march objective ignores start to bind:

1. **Damage per silver becomes the objective** — silver is the renewable resource, so a march that deals
   less but costs less silver wins the week. §7's plans assumed a purse; this section assumes the flow.
2. **Training time binds.** Tier-1 troops retrain in 15 s a unit, tier-3 in 840 s: the §3 optimum needs
   **12.3 days** of training a march (7.2 d if RD3 is revived), so it can run at most about once a week —
   while a tier-1 march needs 0.6 d and can run every day.
3. **The advanced mercenaries are a stock, not a rate**: 20 units a march exhausts 76 / 72 / 37 in nine
   marches. Spreading them (10 of each a march, ~37 marches) is a different and better use than dumping them.

Measured, scenario C, one march, all four recovery options (silver / gold / training):

| stack | damage | retrain all | revive RD3 + mercs | revive everything | damage per silver |
|---|---|---|---|---|---|
| **`ARC1 3,710 · EMH6 92`** (tier-1 sponge just above the mercenaries) | 2,009,150 | 1,113,000 · 429 · 0.6 d | same | 111,300 · 9,158 · 0.1 d | **1.81** |
| the same `+ ABT6 10 · LGN6 10 · CHR6 10` | 2,569,840 | 1,113,000 · 617 · 0.6 d | same | 111,300 · 9,346 · 0.1 d | **2.31** |
| the same `+ ABT6 76 · LGN6 72 · CHR6 37` (**the full stock**) | **5,065,528** | 1,113,000 · 1,464 · 0.6 d | same | 111,300 · 10,193 · 0.1 d | **4.55** |
| §3's optimum | 8,338,153 | 2,404,300 · 1,427 · 12.3 d | 1,672,100 · 4,162 · 7.2 d | 242,600 · 11,637 · 1.2 d | 3.47 |
| 0015's tier-1 giant `ARC1 4,343 · EMH6 92 · caps` | 5,122,182 | 1,302,900 · 1,464 · 0.8 d | same | 130,500 · 11,681 · 0.1 d | 3.93 |
| `ARC1 4,343 · EMH6 92` (no advanced) | 2,065,804 | 1,302,900 · 429 · 0.8 d | same | 130,500 · 10,646 · 0.1 d | 1.59 |

### The sponge is Rider III, and the cheapest one that works

The owner's correction (2026-09-14): **training time is not a constraint — he holds 200+ days of speedups.**
That removes the only reason the tier-1 sponge looked better, and it changes the answer. The sponge only has
to beat the mercenary stacks on **both** HP (the kill order) and base damage (the attack order) — size it just
above on one of the two and the sponge's strike is silently lost. `RD3 582` is the smallest such stack for
`EMH6 92`, and Rider III is the cheapest HP in the game (0.559 silver per HP):

| stack | damage | silver | gold | training | damage per silver |
|---|---|---|---|---|---|
| **`RD3 582 · EMH6 92`** | 2,083,108 | **814,800** | 429 | 5.7 d | **2.56** |
| **`RD3 582 · EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37`** | **5,139,486** | **814,800** | 1,464 | 5.7 d | **6.31** |
| `RD3 582 · EMH6 92 · 10 / 10 / 10` | 2,643,798 | 814,800 | 617 | 5.7 d | 3.24 |
| `ARC1 3,710 · EMH6 92 · the full caps` (the tier-1 sponge, for contrast) | 5,065,528 | 1,113,000 | 1,464 | 0.6 d | 4.55 |
| §3's optimum | 8,338,153 | 2,404,300 | 1,427 | 12.3 d | 3.47 |

**6.31 damage per silver is the best ratio measured anywhere in this study** — the mercenaries cost no silver
at all, so every silver in the march is the sponge, and the whole game is to buy the smallest sponge that
lets them strike. Training is 5.7 days a march, which the speedups cover: at six marches a week that is
35 days of speedups a week, so **the 200-day stock funds about six weeks at full tilt** — after which the
march rate falls to the clock (1.2 marches a week) and the tier-1 sponge becomes the right answer again
(0.6 d a march, 9.02 M a week, no speedups needed).

### Layering: how much the mercenaries' second strike is worth, and where it peaks (`52`)

The owner pushed back on an earlier draft of this section that quoted "layering buys +4.7 %" — and he was
right to: that number compared one rung with five, two points on either side of the peak, and it measured
nothing. Layering the mercenaries into a second strike is the **largest single lever on the irreplaceable
stock**, worth up to **+43 % of the mercenaries' own damage** (4,733,483 → 6,778,073). What follows is the
frontier, engine-measured, 4 enemy squads, one march:

| rungs above the mercenaries | floor HP | mercenary counts (EMH6 · ABT6 · CHR6 · LGN6) | strikes | **mercenary damage** | rung damage | total | silver | damage/silver |
|---|---|---|---|---|---|---|---|---|
| 1 | 1,465,627 *(stock caps)* | 92 · 76 · 37 · 72 | 1 each | 4,733,483 | 407,399 | 5,140,882 | 817,600 | **6.29** |
| 2 | 1,465,627 *(stock caps)* | 92 · 76 · 37 · 72 | LGN6 2 | 5,533,763 | 1,141,551 | 6,675,314 | 1,859,300 | 3.59 |
| 3 | 1,465,627 *(stock caps)* | **infeasible — needs more than 4,343 leadership** | | | | | | |
| 3 | 1,112,442 | 70 · 74 · 37 · 72 | CHR6 2, LGN6 2 | 6,203,214 | 1,420,642 | 7,623,856 | 2,205,300 | 3.46 |
| 4 | 813,964 | 51 · 54 · 27 · 54 | EMH6 2, CHR6 2, LGN6 2 | 5,487,334 | 1,405,612 | 6,892,946 | 2,196,200 | 3.14 |
| 5 | 549,705 | 34 · 36 · 18 · 36 | every stack 2 | **3,658,224** | 1,048,709 | 4,706,933 | 1,908,900 | 2.47 |
| **§3's optimum** (interleaved, not stacked) | tail 97,290 | 92 · 71 · 36 · 72 | EMH6 1, ABT6 2, CHR6 2, LGN6 1 | **6,778,073** | 1,560,080 | **8,338,153** | 2,404,300 | 3.47 |

Three things fall out of it:

1. **The mercenaries' damage is not monotone in their strikes.** It peaks at two strikes for the stacks that
   can afford them and *collapses* at five rungs — 3,658,224, which is **23 % below the un-layered design**.
   The reason is geometric: with four enemy squads the ladder is `0,1,1,1 | 1,2,2,2 | 2,3,3,3`, so the second
   strike starts at position 6, and every rung above a mercenary stack must out-HP the *biggest* mercenary
   stack (the enemy kills by HP). Pushing EMH6 from a one-strike to a two-strike rung therefore costs five
   rungs — 5 × 1.45 M = 7.26 M HP of troops, about 5,800–8,300 leadership against the account's 4,343. The
   engine refuses the combination outright at stock caps ("needs more than 4,343 leadership"); every feasible
   deeper ladder pays for the strikes by shrinking EMH6 (92 → 70 → 51 → 34 units), and past three rungs the
   shrink outweighs the strike.
2. **The shape that works is interleaving, not stacking** — §3's optimum keeps EMH6 at its full 92 on *one*
   strike and buys the second strike only for the stacks small enough to sit below (Arbalester and Chariot at
   2 each, +43 % mercenary damage). Stacking every mercenary under every rung is the shape that fails.
3. **A three-squad monster makes layering cheap**: two rungs at stock caps already give CHR6 and LGN6 their
   second strike with EMH6 untouched — 6,468,601 mercenary damage, 7,567,200 total for 1,859,300 silver,
   **4.07 damage per silver** against 3.46 for the best four-squad layering. One more reason §6's "attack a
   three-squad monster" is the cheapest lever in the game.

So the layering verdict is a resource question, not a yes/no: **layering is a damage-per-mercenary play**
(6.78 M extracted from a stock that yields 4.73 M un-layered) **and an anti-silver play** (3.47 against 6.31
damage per silver). Layer when the stock is what you are short of; do not layer when silver is.

**The plan.** Full tilt (speedups + the advanced stock): `RD3 582 · EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37` —
5,139,486 a march, 814,800 silver, 1,464 gold → **~6 marches a week = ~31 M a week**, and the whole stock is
worth ~46 M in one to two weeks. Sustained while the speedups last: `RD3 582 · EMH6 92` → 12.8 M a week.
Sustained beyond them: `ARC1 3,710 · EMH6 92` → 9.02 M a week with no training time to pay. And **do not
revive troops**: reviving RD3 turns 814,800 silver into 82,600 silver + 3,163 gold, and at 10 k gold a week
that is 3.2 marches a week against 6.1 — silver is the renewable resource, spend it and bank the gold.

## 9c. Two inputs that were wrong, and the re-run they force (`53-current-mercs`)

Both came from the owner on 2026-09-14, after §9b was written, and both invalidate numbers rather than refine
them. Everything in §9b that assumed the export's stock stands only as a record of the method.

**1. He holds 52 mercenaries, not 277.** The 2026-09-13 export's caps (EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37)
are a *ceiling*; the screenshot he sent the next day shows **ABT6 15 · CHR6 7 · EMH6 14 · LGN6 16**, and his
housing is leadership **4,400** / authority 2,180 (not 4,343 / 2,000). Re-optimised over every mercenary
vector × 7 troop sets (228,480 engine-scored marches), the best single march becomes a **flat 8-rung ladder
with all the mercenaries under it**, and the mercenary contribution is back to being the majority of the
march — because with a small stock the ladder can be deep enough to give every mercenary stack two or three
strikes:

`SW1 1,502 · ARC1 585 · SP1 584 · ARC2 323 · RD1 291 · SP2 322 · RD2 161 · RD3 90 · LGN6 15 · EMH6 14 ·
ABT6 14 · CHR6 7`

| | damage | worst opening | silver | gold | damage / silver |
|---|---|---|---|---|---|
| **that march** | **3,458,662** | 3,392,346 | 1,585,400 | 256 | 2.18 |
| the owner's own 12-stack tier ladder, same housing | 3,397,185 | 3,331,134 | 1,655,400 | 267 | 2.05 |
| the same ladder with EMH6 alone (no ABT6/CHR6/LGN6) | 1,606,766 | — | 1,585,400 | 63 | 1.01 |
| … and with the 92 EMH6 he earns back in a week | 2,038,200 | — | 1,585,400 | 429 | 1.29 |

His own ladder is **1.8 % behind** the engine's best and costs 70,000 more silver — a good design, not a
mistake. Its one flaw is a **lost strike**: `RD1 368` sits third by HP but fourth in the attack order, so it
dies in both journals without ever striking (0/0 — 288,144 HP and 130,640 damage per hit thrown away). The
mercenaries in it get 2, 2, 3 and 3 strikes, which is why it competes at all.

**2. His calculator is scoring his marches with the export's almost-empty bonuses.** The same counts, same
engine, three bonus sets:

| bonuses | avg damage | worst opening | gold |
|---|---|---|---|
| A — the export as it stands (VIP +3 / +3) | **2,569,689** | 2,546,934 | 408 |
| B — the 2026-09-13 report (+143 / +187) | 3,459,009 | 3,393,511 | 267 |
| C — the 2026-09-14 report (+161 / +190) | 3,397,185 | 3,331,134 | 267 |
| *his tool, on the same march* | *2,548,799* | *2,526,599* | *408* |

Scenario **A** reproduces his tool to 0.8 %, and its gold is exactly the engine's multiplied by the temple-15
divisor (267 × 1.53 = 409 ≈ 408) — so his profile carries neither the account's bonuses nor its temple level.
**His march deals 3.40 M, not 2.55 M**, and every march he has ever scored in that tool is understated by
about a third. Two settings fix it: the bonus screen (guardsmen +161 % health / +190 % strength, plus the
+2 / +1 category line) and the temple (15). That is also why the toll of §9b's advice has to be re-read: the
optimisation it did was right, its *input* was a profile a third weaker than the account's.

## 9d. The plan in the field: the 04:39 report (`58-plan-report`)

The owner marched file 56's uniform march and sent the journal (five screenshots, English UI, 24 entries,
14 of ours and 10 enemy kills — every stack lost). The march in the game is the computed one to the unit:
`SP2 226 · RD1 202 · RD3 63 · ARC2 222 · ARC1 399 · RD2 111 · ABT6 10 · LGN6 10 · CHR6 5 · EMH6 10` —
the only change is EMH6 at 10 where the plan said 9. Four enemy squads (ogre III 2,014,177 · fire woman V
4,336,924 · molten giant III 28,688,095 · flyer V 3,054,544).

**What the report confirms.** The fight's bonuses fit the same structure as the 00:41 report, two points
lower: guardsmen **+159 health / +188 strength**, ranged +159.5 / +189 — its own lines give them
(`SP2 226 → 158,041 = 226 × 270 × 2.590`; `RD3 63 → 87,494 incl. 29,434` at strength-against 146). And the
per-strike damage model holds **exactly** for seven of the eight stacks that struck, with the eighth one
rounding away: RD3 87,494 ✓ · ARC2 77,922 ✓ · ARC1 71,022 ✓ · ABT6 151,620 ✓ · LGN6 110,770 ✓ · CHR6 148,390 ✓
· RD2 77,122 against 77,123 (+1). Every enemy line lands within 1 % of the stack's effective HP
(158,041 against 157,974; 156,954 against 156,954). One proc fired: entry 20 is CHR6 at **296,780 double**,
exactly 2 × 148,390 with the features doubled — the 8 % double-damage chance of a rider-class unit, worth
148,390 here, or **9 % of the march**, and priced nowhere in the app (0016 §5's E4).

**What it does not confirm is the sequence — and the cause was this report's own bonus fit, not the model.**
The first draft of this section blamed the app's EMH VI table entry for running 0.8 % high. It does not: the
figure was produced by *my* fit, which put the troops' +159 / +188 on the **guardsmen** key and so handed the
category-less EMH VI the same two points the owner's buff gives only to units that carry a category. The
owner then said it outright — *"2 % increased health on all troops apart EMH6"* — and with the buff as its own
source the fight fits the same way the 00:41 one does:

| | guardsmen | + the buff (categorised units only) | troops read | EMH VI reads |
|---|---|---|---|---|
| 04:39 fit | +157 health / +187 strength | +2 health / +1 strength | **+159 / +188** ✓ | **+157 / +187** ✓ |
| 00:41 fit | +157 / +187 | +2 / +1 **plus a further +2 / +2 on everything** | +161 / +190 | +159 / +189 |

Rebuilt that way (`58-plan-report.test.ts`), the replay goes from **22 mismatches to 9**, the **first
fourteen entries pair exactly**, ten of the 24 damage lines are identical to the unit, and the game's
realised total lands **inside** the engine's band instead of 2 % below its floor:

| | damage |
|---|---|
| the game realised, proc halved | 1,575,922 |
| the engine, same march and fit — min / avg / max | 1,536,421 / 1,571,711 / 1,607,001 |

The nine that remain are one knife-edge: the engine rounds `hpPerUnit` to an integer where the game carries
the unrounded figure (audit E5), and that 0.03 % is enough to swap **Archer I (155,310) and Rider II
(155,244) — two stacks 0.04 % apart**, which the plan's flat ladder put next to each other. Everything
downstream follows from that one pair. So the model is intact; the plan's packing is what is fragile.

| | damage |
|---|---|
| the game realised, proc halved | **1,575,922** |
| the game realised, proc at its printed value | 1,724,312 |
| the engine, same march and bonuses: min / avg / max | 1,607,930 / 1,643,220 / 1,678,510 |
| the plan's prediction (EMH6 9, 00:41 bonuses) | 1,815,924 |

So the march landed **2 % below the engine's own worst case** — the strike reassignment, not the damage
formula — and **11 % below the plan's headline number**, almost all of it the two points of bonus the
account was missing that morning (0.8 % on strength and health costs ~9 % of damage once it moves a
knife-edge ladder).

**The lesson for the plan, not just the model.** The ladders this pass builds pack their rungs 0.2–1 % apart
in HP (that is what maximises stacks, and §4 already called 0015's flat ladder knife-edge). File 59 rebuilds
the plan with a **minimum step between consecutive stacks** and prices it, and the answer is two-sided:

| minimum step | plan total | worst single-unit change to a mercenary count |
|---|---|---|
| 0.4 % (what was marched) | 7,506,491 | −267,786 (−3.6 %) |
| 1 % | 7,354,008 (−2.0 %) | −267,786 (−3.6 %) |
| 3 % | 7,309,737 (−2.6 %) | −267,786 (−3.7 %) |
| 5 % | 6,744,621 (−10.2 %) | −267,786 (−4.0 %) |

So a **wider step between rungs is cheap** — 1–3 % of the ladder's spread costs about 2 % of the plan's
damage, and 5 % costs ten times that. But it does **not** protect the plan from the failure that actually
happened, and the reason is arithmetic: the mercenary stacks are 5–10 units, so **one unit is 10–20 % of such
a stack's HP** — an order of magnitude more than the whole spread of the ladder. No step size between rungs
can absorb that. Fielding `EMH6 10` where the plan said 9 was a 11 % change to that stack's HP, which walked
it straight through three rungs.

Two rules follow, and they are cheaper than any step:

1. **March the computed counts, exactly.** The plan is a specific count vector, not a shape; the +1 unit the
   owner added is what moved EMH6 from the bottom of the ladder into its middle and cost RD I its strike.
2. **If the counts must be free to move, give the mercenary floor a real margin** (~25 %, not the 1 % the
   builder uses) so that two units either way cannot lift a mercenary stack above the lowest rung — at the
   price of lower rungs or smaller mercenary stacks.

The stat-side robustness the step *does* buy is real: with any margin at the floor, EMH VI sitting 0.8 % low
changes nothing at all (file 59 measures 0 damage lost at every step size).

## 9e. Complete optimization v2, first cut (`src/engine/plan.ts`, `63-plan-v2`)

The owner's ask: stop asking for a silver budget and a march count — take the **army** (the troops it can
field, the mercenaries it holds), the bonuses and the enemy, and work the rest out, including the split
between the two scarce resources. That is what `planCampaign` does.

**The design.** The search walks the march count directly: for each `K` it takes, per mercenary type, the
largest count that still lasts `K` marches (`floor((stock − n)/chunks(n)) + 1 ≥ K`), a few fractions below it,
and zero; then for each ladder depth and each floor gap it sizes the rungs, scores the march, and pairs it with
a final march built from the stock and silver the uniform marches leave. Scoring runs through the engine's own
journal (`buildJournal`), not a closed form, so the attack order, the lost strikes and the round structure are
the ones the battle uses — verified: the planner's figure for its march equals `simulateBattle`'s average to
the unit (2,521,915 against 2,521,915; 1,730,484 against 1,730,484).

**What it returns,** on this account (EMH6 14 · LGN6 16 · ABT6 15 · CHR6 7, leadership 4,400, four squads,
the 2026-09-14 profile), in 44 s of plain in-process work — the app's existing worker is the right home for it:

| | no silver limit | the 3 M he had |
|---|---|---|
| marches | 11 | 6 |
| damage a march | 1,730,484 | 1,046,522 |
| **total damage** | **19,313,194** | **6,279,132** |
| silver | 16,517,200 | 2,999,400 |
| mercenaries lost | 37 | 24 |
| damage a silver | 1.17 | 2.09 |
| damage a mercenary | 521,978 | 261,631 |
| binding | mercenaries | silver **and** mercenaries |

The two criteria come back side by side, which is the answer to "which resource am I short of": at 3 M both
bind, and a silver buys 2.09 damage against 261,631 a mercenary; with no limit the stock is what binds, and
the same numbers read 1.17 a silver against 521,978 a mercenary — silver is worth roughly twice as much per
point as a mercenary once the stock is the wall.

**What it does now (after five search bugs were found and fixed — a leftover stock read from the wrong field,
the ladder taking the weakest types instead of the strongest, the rung order inverted so the best units got the
fewest strikes, a budget fit that shrank the floor *below* the mercenaries, and a hill-climb judged against the
global best so it could never improve inside a smaller march count):**

| | damage | silver | mercenaries | damage / silver |
|---|---|---|---|---|
| the plan the owner marched (file 61, hand-built against 3 M) | 7,386,547 | 2,998,800 | 24 | 2.46 |
| the v2 from the **army alone** — its most efficient plan | 5,085,994 | 1,914,500 | 22 | **2.66** |
| the v2 told "3 M silver" | 7,161,499 | ~2,960,000 | 25 | 2.42 |

So from the army alone the planner now finds a plan **more efficient than the hand-built one** (2.66 against
2.46 damage a silver) — proving the acceptance criterion on the ratio — while its total is lower only because it
spends less. With a budget it is 3 % from the hand plan, and the residue is one more search item: the accepted
mercenary vector (EMH VI 9 · LGN VI 10 · ABT VI 10 · CHR VI 5) is not reachable from the grid's maxima by the
current climb.

**One parameter genuinely cannot be dropped, and this is the finding to report:**

- The plan's **scale** is not a function of the army. `planCampaign` returns a non-dominated frontier of twelve
  plans, cheapest first, and two of them are both "optimal" for different purses: the efficiency peak spends
  1,914,500 silver for 5,085,994 damage, the accepted plan spends 2,998,800 for 7,386,547. Nothing about the
  troops, the bonuses or the mercenaries distinguishes them — only how much silver the owner is willing to burn
  does.
- So the UI's default is a choice: propose the most efficient plan and let the frontier carry the rest (what the
  module does today), or ask for the silver and jump straight to the best plan for it. The module supports both
  (`silverBudget` optional, `recommend` and `knee` for the budgetless case).

**One further thing stops it replacing the hand-driven search:**

1. **It is ~15 % below a hand-built plan in the silver-limited case** — 6,279,132 against file 61's 7,386,547
   on the same army and silver. The cause is visible in the numbers: the v2 prefers 6 weak marches (1.0 M
   each) to 3 strong ones (2.2 M) plus a rich finale, because it treats the final march as "whatever is left"
   rather than as a resource to *reserve* for. Making the finale part of the objective — reserve stock and
   silver for it — is the single change with the biggest effect.
2. **The final march's printed figures disagree with the ones it scored** (2,008,354 scored against 1,089,284
   when re-evaluated), so its count assembly has a bug. The repeated march is exact; only the finale is not.
3. **`objective` is currently a no-op** when both resources are finite, and the file says so rather than
   pretending: the total damage already prices both. It earns its place only when one resource is unlimited —
   `damagePerSilver` should then return the minimum-sponge plan, `damagePerMercenary` the plan that squeezes
   the stock — which is not implemented. Either implement that or drop the parameter.

**The numbers against the battles.** The two plans that were marched realised **1,575,922** (04:39) and
**1,958,695** (05:17, 0.17 % off the engine's figure for the same counts). The v2's 3 M plan fields
1,046,522 a march — *weaker per march* than either, because it spreads the stock over six of them. Its value
is in the total and in needing no inputs, not yet in beating a hand plan.

## 10. Reproducing

```
THEORY=1 pnpm vitest run tools/theorycraft/45-ledger-optimum.test.ts   # the ledger + the exact optimum (~5 s)
THEORY=1 pnpm vitest run tools/theorycraft/46-ladder-bottom.test.ts    # tails, interleaving, round openers (~25 s)
THEORY=1 pnpm vitest run tools/theorycraft/47-procs-enemy.test.ts      # procs + per-formation optima (~55 s)
THEORY=1 pnpm vitest run tools/theorycraft/48-few-marches.test.ts      # the campaign plans (~2 min)
THEORY=1 pnpm vitest run tools/theorycraft/49-audit.test.ts            # the fit, the replay, the evidence table (~1 s)
THEORY=1 pnpm vitest run tools/theorycraft/50-referee.test.ts          # every recommended march, scored in one run
THEORY=1 pnpm vitest run tools/theorycraft/51-weekly-answer.test.ts    # §9b: the weekly economy (~1 min)
```

Each writes `tools/theorycraft/out/<name>.md` with its inputs, method and full tables; those outputs are
committed beside the scripts. `50-referee.test.ts` is the file the numbers in this document were read from:
it scores every march the five experiments recommend in a single engine run with a feasibility check on
each, so a reader can confirm the comparisons without trusting any summary — including this one. Scenario C
lives in `harness.ts` next to A and B, and the 2026-09-14 report it comes from is transcribed in
`docs/research/battlereportkai.md` and replayed in `02-kai-report.test.ts`.
