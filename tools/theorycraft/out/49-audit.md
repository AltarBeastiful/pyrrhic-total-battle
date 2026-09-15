
## 1. The fit: bonuses re-derived from the report alone

Step 1 — invert the report with arithmetic (health from the enemy line, strength from the friendly
line minus its "extra" part, both divided by count × base stat). This is the audit's own reading of
the transcription, not the harness's scenario C:
| unit | count | enemy line | health ×  | base damage | extra | strength × | extra / (count×str) = SA |
|---|---|---|---|---|---|---|---|
| SP1 | 855 | 334,732 | ×2.61000 | 42,750 | 16,672 | ×2.90000 | 39 % |
| RD1 | 423 | 331,209 | ×2.61000 | 42,300 | 27,495 | ×2.90000 | 65 % |
| ARC1 | 837 | 328,313 | ×2.61500 | 41,850 | 28,040 | ×2.90999 | 67 % |
| SP2 | 451 | 317,819 | ×2.60999 | 40,590 | 23,948 | ×2.90000 | 59 % |
| RD2 | 223 | 314,296 | ×2.61000 | 40,140 | 39,337 | ×2.90000 | 98 % |
| ARC2 | 440 | 310,662 | ×2.61500 | 39,600 | 39,996 | ×2.91000 | 101 % |
| RD3 | 116 | 290,649 | ×2.60999 | 37,120 | 54,195 | ×2.90000 | 146 % |
| ABT6 | 18 | 268,299 | ×2.61500 | 34,200 | 174,078 | ×2.91000 | 509 % |
| LGN6 | 18 | 267,786 | ×2.61000 | 34,200 | 100,890 | ×2.90000 | 295 % |
| EMH6 | 16 | 252,369 | ×2.58999 | 32,480 | 197,803 | ×2.88999 | 609 % |
| CHR6 | 8 | 238,032 | ×2.61000 | 30,400 | 149,872 | ×2.90000 | 493 % |

Three distinct health multipliers (×2.59 on the category-less EMH6, ×2.61 on melee/mounted/flying,
×2.615 on ranged) and three distinct strength multipliers (×2.89 / ×2.90 / ×2.91, same split) — so a
**uniform** bonus set cannot explain the report: at least one non-uniform (category) term is required.
The last column is the check that the "extra" part is the unit's strength-against on its **base**
strength: every value lands on the units table to the digit.

Step 2 — the engine on that fit (guardsmen **+159 % health / +189 % strength**, melee·mounted·flying
+2 / +1, ranged +2.5 / +2, double damage +3 %): **10/11** friendly lines exact, Σ|Δ| = 1 on the friendly lines, 11/11 stacks inside the HP slack, max |Δ| = 428 on the enemy lines (Σ|Δ| = 941).

The one friendly line short of exact is SP1: 855 × 50 × 3.29 = **140,647.5** exactly, and the engine
rounds a half up (140,648) where the game truncates (140,647) — the same truncation rule as rule 17,
so it is the engine's arithmetic and not a bonus misfit. The fit is the report's own three health and
three strength families to within 0.002 %.

Step 3 — uniqueness: sweep each parameter alone, engine-scored (step 0.001 — the report pins these to
a few thousandths of a percent). A value counts only when no friendly line is off by more than SP1's
half-unit **and** all 11 stacks land inside the per-unit-rounding slack; the two parameters marked ✝
are confounded with `army` (every one of the march's 11 units is a guardsman), so the report can only
pin their **sum**, not the split:

| parameter swept (others at the fit) | values that reproduce the whole report | best value | best Σ|Δ| |
|---|---|---|---|
| guardsmen health | 158.996 … 159.004 (9 of 21, span ±0.005) | 159 | 941 |
| guardsmen strength ✝ | 188.999 … 189.000 (2 of 21, span ±0.001) | 189 | 941 |
| category health (melee=mounted=flying) | 1.996 … 2.004 (9 of 21, span ±0.004) | 2 | 941 |
| category strength | 0.999 … 1.000 (2 of 21, span ±0.001) | 1 | 941 |
| ranged health offset | 2.483 … 2.517 (35 of 201, span ±0.017) | 2.48 | 942 |
| ranged strength offset | 1.999 … 2.001 (3 of 21, span ±0.002) | 2 | 942 |

**The fitted account bonuses, as percentages:** guardsmen/army **+159 % health / +189 % strength**;
melee · mounted **+2 / +1** on top; ranged **+2.5 / +2**; double damage **+3 %** (observed, not fitted:
entry 11 is the only proc in the fight). The harness's `kaiReportTotals` is one such set — the
independent fit lands on exactly its values, so scenario C is confirmed rather than assumed.

**What this report cannot see** (the fit is silent, not wrong, there):

- the split between the `army` and `guardsmen` keys — every one of the 11 units is a guardsman, so only
  their **sum** (+159 / +189) is identified;
- the **flying** category: the march has no flying unit, so the +2 / +1 written for flying in scenario C
  is an analogy with melee/mounted, not an observation;
- the **specialist** group: SW1 does not march (the 2026-09-13 report is what pins ×1.51 / ×1.71);
- whether the ranged top-up is a category term or a per-unit-type term — one report cannot tell the two
  apart, and the engine's category key is the parsimonious reading.

Step 4 — the best **uniform** (category-less) set over a 201 × 201 sweep is health +161 / strength +190 (6/11 friendly lines exact), residual 5,317 — vs 942 for the fit.
A uniform set cannot fit both the category-less EMH6 (×2.59 / ×2.89) and the melee/ranged units
(×2.61 / ×2.90–2.91): **the report requires a non-uniform term**, and the engine's category keys supply it.

## 2. The replay (army first, 4 enemy squads)

| # | report | engine | report dmg | engine dmg | Δ |
|---|---|---|---|---|---|
| 1 | SP1 | SP1 | 140,647 | 140,648 | 1 |
| 2 | E>SP1 | E>SP1 | 334,732 | 335,160 | 428 |
| 3 | RD1 | RD1 | 150,165 | 150,165 | 0 |
| 4 | E>RD1 | E>RD1 | 331,209 | 331,209 | 0 |
| 5 | ARC1 | ARC1 | 149,823 | 149,823 | 0 |
| 6 | E>ARC1 | E>ARC1 | 328,313 | 328,104 | -209 |
| 7 | SP2 | SP2 | 141,659 | 141,659 | 0 |
| 8 | E>SP2 | E>SP2 | 317,819 | 317,955 | 136 |
| 9 | RD2 | RD2 | 155,743 | 155,743 | 0 |
| 10 | ARC2 | ARC2 | 155,232 | 155,232 | 0 |
| 11 | RD3 | RD3 | 323,686 | 161,843 | 0 |
| 12 | ABT6 | ABT6 | 273,600 | 273,600 | 0 |
| 13 | LGN6 | LGN6 | 200,070 | 200,070 | 0 |
| 14 | EMH6 | EMH6 | 291,670 | 291,670 | 0 |
| 15 | CHR6 | CHR6 | 238,032 | 238,032 | 0 |
| 16 | E>RD2 | E>RD2 | 314,296 | 314,207 | -89 |
| 17 | ARC2 | ARC2 | 155,232 | 155,232 | 0 |
| 18 | E>ARC2 | E>ARC2 | 310,662 | 310,640 | -22 |
| 19 | RD3 | RD3 | 161,843 | 161,843 | 0 |
| 20 | E>RD3 | E>RD3 | 290,649 | 290,696 | 47 |
| 21 | ABT6 | ABT6 | 273,600 | 273,600 | 0 |
| 22 | E>ABT6 | E>ABT6 | 268,299 | 268,308 | 9 |
| 23 | LGN6 | LGN6 | 200,070 | 200,070 | 0 |
| 24 | EMH6 | EMH6 | 291,670 | 291,670 | 0 |
| 25 | CHR6 | CHR6 | 238,032 | 238,032 | 0 |
| 26 | E>LGN6 | E>LGN6 | 267,786 | 267,786 | 0 |
| 27 | EMH6 | EMH6 | 291,670 | 291,670 | 0 |
| 28 | E>EMH6 | E>EMH6 | 252,369 | 252,368 | -1 |
| 29 | CHR6 | CHR6 | 238,032 | 238,032 | 0 |
| 30 | E>CHR6 | E>CHR6 | 238,032 | 238,032 | 0 |

|l| report | engine |
|---|---|---|
| SP1 | 1 | 1 |
| RD1 | 1 | 1 |
| ARC1 | 1 | 1 |
| SP2 | 1 | 1 |
| RD2 | 1 | 1 |
| ARC2 | 2 | 2 |
| RD3 | 2 | 2 |
| ABT6 | 2 | 2 |
| LGN6 | 2 | 2 |
| EMH6 | 3 | 3 |
| CHR6 | 3 | 3 |

entries: report 30, engine 30 · actor mismatches 0, stack mismatches 0 · hits per stack identical: yes
friendly damage: report as printed 4,070,476 (entry 11 doubled), report without the proc 3,908,633, engine army-first total 3,908,634 (Δ 1).
enemy lines: engine = stack total HP, report = the printed line; worst SP1 335,160 vs 334,732 (Δ 428, 0.128 %); Σ|Δ| over the 11 lines 941, lines exact 3/11.
0015 §3b claims "0 mismatches, enemy lines within 428 (0.13 %)" — **confirmed**: 30/30 entries, the
actor and stack sequences identical, the hits per stack identical (1 1 1 1 1 2 2 2 2 3 3 = 19 friendly
hits), the friendly total off by one unit, and the worst enemy line off by 428 = 0.128 % (SP1). Three
of the 11 enemy lines are exact; the other eight carry the engine's per-unit rounding, Σ|Δ| = 941.
The proc on entry 11 is the only thing the report prints that the engine does not (the engine has no
proc in a journal: 161,843 vs the printed 323,686, +4.1 % of the friendly total).
The enemy-line gap is the engine rounding HP **per unit** (round(150 × 2.61) = 392) where the game
scales the stack and truncates once (855 × 391.5 = 334,732.5 → 334,732) — the documented ±0.2 %
tolerance of `tests/engine/ingame-report.test.ts`, not a bonus misfit. Fitting the per-unit HP is
what forces the health bonus down to +159: the truncating rule would read 2.61 exactly.

## 3. The evidence table (rule → evidence → verdict)

| # | rule the model uses | evidence in the repo | observations | verdict |
|---|---|---|---|---|
| 1 | kill order = total HP descending | 4 in-game reports: 2026-09-11 ×2 (`docs/research/fixtures/ingame-2026-09-11-epic-ancient-report.md`), 2026-09-13 (`fixtures/ingame-2026-09-13/README.md`), Kai 2026-09-14 (`docs/research/battlereportkai.md`); discriminating cases: the 2-unit ABT6 mercenary stack killed first and never striking (2026-09-13), RD1 killed 3rd although 4th by base damage (2026-09-11 ×2) | 40 kills | **proved** within these reports (the HP values are the enemy lines themselves; the 2026-09-13 popup makes them independent) |
| 2 | attack order = base damage descending | 2026-09-13: SW1 (4,077 HP) dies first but strikes after RD2 (3,936 HP, base 1,549 vs 1,539) — one discriminating pair; reproduces 2026-09-11 ×2 entry for entry (RD1, 3rd by HP/4th by damage, never strikes); Kai's report: order coincides, non-discriminating | 1 discriminating + 3 consistent | **proved** on a single discriminating observation |
| 3 | N enemy attacks/round, one strike between consecutive attacks, survivor sweep after the Nth | 2026-09-11 ×2 (N=3: 28 entries; N=4: 24), 2026-09-13 (N=4), Kai (N=4), 3 TotalStack journals | 4 in-game + 3 journals | **consistent** — the survivor sweep is one line short on 2026-09-13 entry 20 (20 of 21 entries), rule unsettled |
| 4 | damage per hit = count × str × (1 + Σstr%) + count × baseStr × SA/100 | every friendly line of 4 in-game reports (2026-09-11: 18 + 14; 2026-09-13: 12; Kai: 19 — 63 lines, each one reconciled in the fixtures or here) + 3 TotalStack journals + the 2026-09-13 troop-detail popup | 63 in-game lines | **proved** |
| 5 | the "extra" part is the SA term on the BASE strength and is included in the printed total | 4 reports, every friendly line; this audit re-checks all 11 units of Kai's report (extra ÷ count ÷ base str = the table SA to the digit) | 11 + ~50 | **proved** (for our units; the monster's own "extra" on entries 16/22 is unmodelled and touches nothing we compute) |
| 6 | **the enemy always destroys the stack it attacks** | 40/40 enemy attacks destroyed their target — but under rule 8 the printed line *is* the target's HP, so the equality is the model, not an observation. Largest stack ever attacked: 345,504 HP; largest number a monster ever printed: 334,732 | 40 attacks, all below ~345 k HP | **unverified** — untestable by any existing report (§4a) |
| 7 | the enemy line = the destroyed stack's total HP | 40 lines reconcile to count × base × healthMult to the digit at both the stack level (2026-09-11, truncation) and the per-unit level (engine); the 2026-09-13 popup independently supplies the health bonus | 40 lines | **proved as an identity of the printed number**; **unverified** as a causal statement (raw damage vs one-shot kill) |
| 8 | every stack we field dies | every stack of all four reports died (40/40); a corollary of rule 6 with the same caveat | 40 stacks, ≤ 345 k HP | **consistent** |
| 9 | one stack per unit type per march | every observed march has distinct types only (9, 10, 11 stacks); no report ever shows a type twice | 4 marches, never exercised | **unverified** — it is the sizer's contract, not an observation |
| 10 | the maximum number of stacks a march may field | nothing anywhere in the repo; the largest observed march is 11 stacks, TotalStack's journal runs 12 with N=8 | 0 | **unverified** |
| 11 | two stacks of one type cannot coexist | never observed, never attempted | 0 | **unverified** |
| 12 | the monster figure and the red kill badge | figure − badge reconciles for M1 (−7/7), M2 (−3/3), M3 (−1/1); M4 moves −78 over 77 badges (3 of 7 segments off by ±1). The figures (2.07 M – 29.56 M) cannot be unit counts at ~19.5 k damage per kill on M4 | 4 squads, 19 friendly hits | **badge = kills this exchange: consistent (±1 on M4)**; **what the figure counts: unverified** |
| 13 | whether damage or kills drive XP | no evidence in the repo (no mention of XP anywhere) | 0 | **unverified** — and it reprices the monster choice (§4b) |
| 14 | whether training runs several unit types in parallel | no evidence; flagged "to check in game" in 0015 §6.3 | 0 | **unverified** |
| 15 | march limits per monster/period (cooldown, re-attack, number of marches) | no evidence in the repo | 0 | **unverified** |
| 16 | a stack targets the enemy squad it has the largest strength-against for (else melee) | Kai 11/11 (M1 flying ← archers and ABT6 at 67/101/509 %, M2 mounted ← spearmen and LGN6 at 39/59/295 %, M3 melee ← EMH6 — the category-less fallback, M4 ranged ← riders and CHR6 at 65/98/146/493 %); 2026-09-11 report 2 (RD3 and CHR6 retarget onto the ranged swarm squad that appears there); 2026-09-11 report 1 | 4 reports | **proved** |
| 17 | HP is truncated at the stack, not rounded per unit | 2026-09-13: 20 SP1 = 7,289, not divisible by 20 (settled in game) | 1 direct | **proved**; the engine keeps per-unit rounding as a stated modelling choice (±0.2 %) |
| 18 | double damage = a plain ×2 on both parts of one hit | 2026-09-11 report 2 entry 8, 2026-09-13 entry 14, Kai entry 11 (323,686 = 2 × 161,843 incl. 2 × 54,195) | 3 | **proved** |
| 19 | authority 2,000 · mercenary caps 92/76/72/37 · temple 15 | the export's `housing.authority` reads **200** — 2,000 is the owner's correction of a typo; the caps are the export's own `cap` fields | export only | **input, not evidence** |

## 4. The decisive in-game tests

### 4a. Can a stack survive an enemy attack?
The tested envelope: the biggest stack any monster has ever hit is 345,504 HP (2026-09-11,
SP1 944); the biggest number a monster has ever printed is 334,732 (Kai entry 2). Every one
of the 40 monster attacks in the repo destroyed its target, but the enemy line *is* the target's HP,
so no report can tell raw damage from a one-shot kill.

**Threshold to test: any single stack above 345,504 HP; decisive at ≥ 669,464 HP**
(twice the largest number a monster has ever printed). Nothing in the repo has ever put a stack that big
in front of a monster.

Under today's model a stack is the **first victim** whatever its size (kill order = total HP), so a
giant stack strikes at most once. Engine, the fitted bonuses, RD3 = 2,506 HP/unit:

| march | stacks | biggest stack | model total (army-first) |
|---|---|---|---|
| **the 4 mercenaries at their caps, no troops** (cheapest decisive probe) | 4 | EMH6 92 — 1,451,116 HP, 4.3 × the largest line ever printed | 4,733,483 |
| RD3 268 + the 4 mercenaries at their caps | 5 | RD3 268 — 671,608 HP (2.0 ×) | 5,107,397 |
| RD3 2,171 alone — all 4,343 leadership | 1 | RD3 2,171 — 5,440,526 HP (16.3 ×) | 3,028,979 |
| reference: the best normal march (ARC2 RD2 RD3 + the 4 mercs, M's Preservation) | 7 | — | 8,178,426 |

**The cheapest decisive probe is the mercenaries alone** (RD3 needs 268 riders and 375 k silver to
retrain; the four mercenary stacks cost no leadership and come back at 90 %). Fielding them with no
troops puts EMH6 92 (1,451,116 HP) in front of the very first monster hit —
4.3 × the largest number a monster has ever printed, at a cost of 314 authority and 10 EMH6
of stock. Everything below then adds one more reading of the same question at a bigger stack.

Today's model **punishes** the shape the survival question is about: the probe march scores 5,107,397 against 8,178,426 for the ordinary march (-3,071,029, -38 %), because the huge stack
is the one thing the model refuses to let fight twice.

**Do this (cheapest first):**

1. **EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37**, no troops (authority 314, leadership 0), at any monster
   with 4 squads. The very first monster hit meets EMH6 92 — 1,451,116 HP,
   4.3 × the largest number a monster has ever printed.
2. The same plus **RD3 268** (leadership 813 of 4,343): the kill order is
   EMH6 · ABT6 · CHR6 · LGN6 · RD3, so the fifth monster hit meets RD3 at 671,608 HP.
3. The all-in version, **RD3 2,171 alone** (all 4,343 leadership, 5,440,526 HP), at a
   monster the account can afford to lose riders to.

**Read this:** the enemy line against the big stack, whether the stack's card comes back, and the red
badge on it. Today's model says the stack dies on that hit: the line reads the stack's full HP
(1,451,116, then 671,608, then 5,440,526) and the card shows every unit killed.

**It would mean:** a full-HP line with the whole stack wiped → the one-shot rule holds at 2–16 × beyond
anything ever tested and the model stands (for the price of one march). A smaller line instead — near
300,000, with the stack reappearing later at a partial figure — → **survival is real**: the monster deals
raw damage, the one-shot rule is an artefact of every stack so far being small, and a march built around
one huge stack becomes the strongest march in the game (RD3 2,171 strikes once in the model, for
3,028,979; every extra round of survival is another 3,028,979 —
37 % of the best whole march above).
### 4b. Is XP driven by damage or by kills?
| monster squad | category (the units that hit it) | our damage | badge kills | damage per kill |
|---|---|---|---|---|
| M3 | melee | 875,010 | 2 | 437,505 |
| M2 | mounted | 682,446 | 4 | 170,612 |
| M1 | flying | 1,007,487 | 7 | 143,927 |
| M4 | ranged | 1,505,533 | 77 | 19,552 |

spread best/worst = 22.4 ×

M3 (the melee squad, the one EMH6 hits) absorbs ~22 × more damage per monster killed than M4 (ranged).
**Do this:** hit the same monster twice, once with a stack that carries strength-against on the squad it
targets and once with one that does not (e.g. an EMH6-only march vs a CHR6-only march at the same
monster), and note the account's XP (or the hero level) before and after each.
**Read this:** XP gained ÷ damage dealt, and XP gained ÷ badge kills, for both marches.
**It would mean:** the same XP per damage → damage is the score and the app's objective is right; the
same XP per kill → kills are the score, and the *choice of monster* becomes a 22 × lever the app
does not model at all (M3 would be the target, whatever the damage).

**Caveat.** The badge is ±1 on M4 (the transcription counts −78 over 77 kills), entries 1 and 14 show
no figure, and the badges are read off screenshots: the damage-per-kill figures carry that error, and
on M3 (2 kills) a single misread moves the number by 50 %.
### 4c. The other open questions (no repo evidence at all)
| question | do this in game | read this | it would mean |
|---|---|---|---|
| can two stacks of one unit type coexist? | add the same troop type twice to a march (the app cannot express it — try the game's own march screen) | does the march screen refuse it, or does the report show two cards of that type? | refused → the engine's one-stack-per-type contract is the game's rule; accepted → the app is missing marches (two half-stacks would re-shape the whole hit schedule) |
| how many stacks may a march hold? | send the widest march the game allows (every owned type + 4 mercenaries + monsters) | the number of cards in the report | ≥ 12 → the engine's cap must rise; the optimum grows with K (damage ≈ housing × K / 2N) |
| does training run in parallel? | start two different troop types training at once | do both countdown, or does the second queue? | parallel → retrain time is the longest single type, not the sum (0015 §6.3 assumes the sum) |
| march limits per monster/period | attack the same monster twice in a row, then a second monster | is the second march refused (cooldown), and is the monster's figure restored between marches? | a cooldown makes "damage per march" the wrong objective; the figure resetting decides whether kills accumulate |
| what does the monster figure count? | one hit by a stack of known damage-per-hit on a fresh monster, at pixel zoom | the figure drop against the badge | drop = badge → a unit count (then ~19.5 k damage kills one monster of M4); drop ≈ damage → the figure is HP, and the badge is a derived read-out |

## 5. The obtainable-tier lever: tier-7 mercenaries

Tier-7 mercenaries exist in the data tables (EMH7 11,220 HP / 3,740 str / 609→934 % vs epic monsters;
ABT7 10,200 / 3,400 / 509→729 %; LGN7 10,200 / 3,400 / 295→387 %; CHR7 20,400 / 6,800 / 493→752 %) at the
**same authority cost** (1 / 1 / 1 / 2). Whether the owner can obtain them is a game question the repo
cannot answer; the caps below are assumed to be the tier-6 stock (92 / 76 / 72 / 37).

| scenario | mercenaries | march damage | authority (mercs) | Δ vs tier-6 |
|---|---|---|---|---|
| Kai's march, tier 6, as fought | 16 / 18 / 18 / 8 | 3,908,634 | 68 | — |
| Kai's march, tier 7, **same counts** | 16 / 18 / 18 / 8 | 4,623,908 | 68 | 715,274 (10,518.74 / authority pt) |
| best 7-type march, tier 6 (sizer) | 75 / 76 / 72 / 37 | 8,178,426 | 297 | — |
| same march, tier 7, **same counts** | 75 / 76 / 72 / 37 | 13,453,791 | 297 | 5,275,365 (17,762.17 / authority pt) |
| best 7-type march, tier 7, **re-sized by the sizer** (caps kept) | 40 / 44 / 44 / 22 | 11,169,257 | 172 | 2,990,831 (17,388.55 / authority pt) |

What the fight does, from the engine (kill order, army-first hits):

- tier 6: ARC2 1,697 (1,198,082 HP, 598,702/hit, 1 hit) · RD2 848 (1,194,832 HP, 592,243/hit, 1 hit) · RD3 475 (1,190,350 HP, 662,720/hit, 1 hit) · EMH6 75 (1,182,975 HP, 1,367,205/hit, 1 hit) · ABT6 76 (1,132,856 HP, 1,155,200/hit, 1 hit) · CHR6 37 (1,100,898 HP, 1,100,898/hit, 2 hits) · LGN6 72 (1,071,144 HP, 800,280/hit, 2 hits)
- tier 7, same counts: EMH7 75 (2,179,500 HP, 3,430,515/hit, 1 hit) · ABT7 76 (2,027,148 HP, 2,635,680/hit, 1 hit) · CHR7 37 (1,970,028 HP, 2,621,672/hit, 1 hit) · LGN7 72 (1,916,784 HP, 1,657,296/hit, 1 hit) · ARC2 1,697 (1,198,082 HP, 598,702/hit, 1 hit) · RD2 848 (1,194,832 HP, 592,243/hit, 2 hits) · RD3 475 (1,190,350 HP, 662,720/hit, 2 hits)
- tier 7, re-sized: ARC2 1,697 (1,198,082 HP, 598,702/hit, 1 hit) · RD2 848 (1,194,832 HP, 592,243/hit, 1 hit) · RD3 475 (1,190,350 HP, 662,720/hit, 1 hit) · ABT7 44 (1,173,612 HP, 1,525,920/hit, 1 hit) · LGN7 44 (1,171,368 HP, 1,012,792/hit, 1 hit) · CHR7 22 (1,171,368 HP, 1,558,832/hit, 2 hits) · EMH7 40 (1,162,400 HP, 1,829,608/hit, 2 hits)

Two structural facts fall out. **The tier-7 mercenary stacks are so much bigger that at the same counts
they jump above the troop stacks**, so the kill order flips: the four mercenaries become positions 1–4
(one hit each) and the three troop stacks fall to positions 5–7, where positions 6 and 7 collect the
second hit of the round. The swap is worth far more than the tier-6 march anyway, because the mercenary
damage per hit nearly doubles (EMH6 1,367,205 → EMH7 3,430,515) and the troops keep their two-hit slots.
And **the sizer's "every mercenary stack under the smallest troop stack" rule costs 2,284,534 a march here** (17 %): it trims the tier-7 stacks back under the troop floor and throws
the extra damage away. The re-sized row is what the app produces today, not an optimum — it is the
clearest case yet for the mercenary post-pass of 0015 §8/E2.

Per authority point the mercenaries carry the whole delta (the sizer never spends the 2,000, so the
denominator is small); per march the swap is +18 % on Kai's ladder and +64 % on the best 7-type march.
**Obtainability is a game question**: nothing in the repo says tier-7 mercenaries can be hired, at what
authority cost, in what numbers, or at what price in revival gold.

## 6. Corrected and failed assumptions

- **0015 §3b, "reproduces the report entry for entry", is a claim about the *sequence*, not the
  digits.** The sequence is exact (30/30, 0 mismatches), but only 10 of the 11 friendly damage values
  (18 of the 19 printed lines) and 3 of the 11 enemy lines are character-for-character the report's;
  SP1 is off by 1 and the enemy lines by up to 428. The cause is one rule the engine knowingly does not
  follow — the game truncates where the engine (and TotalStack) round — and it is the whole ±0.2 %
  tolerance.
- **Scenario C is a fit, not a measurement — and this audit is the first place it was fitted from the
  report rather than copied from the test.** It lands on the same numbers, so the values stand; what
  the fit *cannot* see is listed above (the army/guardsmen split, the flying category, the specialist
  group). The `flying` entry in scenario C (+2 / +1) has no observation behind it in this report.
- **The doubled line doubles both parts (entry 11).** Inverting the report by hand (damage − extra)
  on that line alone yields ×1.44 strength for RD3 and a 292 % strength-against — the trap is that
  the print doubles the "extra" too (108,390 = 2 × 54,195). Halving both gives ×2.90 / 146 %, the
  table value. Any reader reconciling a report must halve the whole line, not just the total.
- **A failed guess of this audit's own:** the first reading of the tier-7 swap was that it would lose,
  because bigger mercenary stacks climb to the top of the kill order and die first. Wrong — the engine
  shows it is worth +64 % on the best march, because the *troop* stacks then fall into the two-hit
  positions (6 and 7) while the mercenaries' damage per hit nearly doubles. Position, not survival, is
  what pays in this model — which is exactly why the survival question in §4a would break it.
- **The "one stack per unit type" rule and the stack ceiling are engine contracts, not game rules.**
  Every observed march happens to have distinct types and ≤ 11 stacks, so nothing in the repo would
  notice if the game allowed more; the sizer would have to be re-shaped, not just re-tuned.
