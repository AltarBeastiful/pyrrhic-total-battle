# Battle model as implemented by TotalStack — derived from captured journals and summaries

Source: fixtures in `docs/research/fixtures/` (2026-09-12, Pro trial, all bonuses 0). "Verified" means the formula
reproduces TotalStack's number exactly. **In-game validation (2026-09-12, one real epic-monster report, see
`fixtures/ingame-2026-09-11-epic-ancient-report.md`)**: HP per stack, per-hit damage incl. strength-against on base
strength, enemy targeting by highest HP, and the round structure all match the game exactly. A second report (enemy first,
N = 4) confirmed the structure and showed the same attack-order nuance (Rider I killed before its turn). Two candidate
rules are recorded in the fixture file; the engine keeps TotalStack's HP-order rule until confirmed. The enemy kill
order is pure HP descending in both reports. Double damage is a ×2 on a single hit with the unit's own chance plus the bonus.

## 1. Turn structure (verified on two journals, enemy-first and army-first)
> **Amended 2026-09-13 (S-30 closed).** A fight runs on **two** orders, not one. The **kill order** is total HP
> descending, as below. The **attack order** is *base damage* descending — `count × strength × (1 + Σ strength %)`,
> the per-hit damage without the strength-against part. TotalStack uses the HP order for both, which is right only
> while health and strength bonuses move together (every captured TotalStack run, where health = 3 × strength for
> every unit and the bonuses are uniform). See §1c and `fixtures/ingame-2026-09-13/README.md`.

- Our stacks are ordered by **total HP descending** (ties keep the display order). This is the enemy's kill order.
  Counts never change during the fight (an enemy hit wipes a stack).
- The enemy has N stacks (4 standard, 8 for Arachne's, custom). Each **round**:
  1. the enemy makes N attacks, one per enemy stack; each attack kills our highest-HP living stack;
  2. between two consecutive enemy attacks, our current highest-HP living stack (the next victim) attacks once;
  3. after the N-th enemy attack, every remaining living stack attacks once, in HP order.
- "Your army first" only changes round 1: our top stack attacks before being killed. Rounds 2+ always start with
  the enemy.
- Closed form: with kill position p (1-based, HP descending) and N enemy stacks, a stack lives r = ceil(p / N)
  rounds and gets `hits = r − 1` if `p ≡ 1 (mod N)` else `r`; plus 1 for p = 1 when the army strikes first.
  Journal counters ("2 HITS") are exactly these totals. Rounds displayed = number of journal entries.
- Each of our stacks always targets the enemy stack it has the largest strength-against for, when that enemy
  type is in the formation (ARC→flying, SP→mounted, RD→ranged, ED→mounted, SG→melee, BB→mounted, WE→flying,
  Bear→mounted).

## 1c. Attack order (settled in game, 2026-09-13, `fixtures/ingame-2026-09-13/`)
A deliberate 9-stack march at an epic monster separated the candidates. Our stacks strike in **base-damage
descending** order — `count × strength × (1 + Σ strength %)`, features excluded — fixed for the whole fight;
each round every living stack strikes once in that order, and a stack wiped before its turn simply loses that
round's attack. Evidence:
- 2026-09-13: Swordsman I (specialist, 18 units, 4,077 HP) dies *before* Rider II (3 units, 3,936 HP) yet
  strikes *after* it, because its base damage is 1,539 against Rider II's 1,549. Neither "unit count
  descending" nor "foot units then mounted" survives that pair; both are refuted.
- 2026-09-11 (both fights): Rider I is third by HP but fourth by base damage, so the enemy's third attack wipes
  it before its turn — which is exactly why it never appears in either hit list. With this rule the engine
  reproduces both reports entry for entry (28 and 24 entries); with the HP-order rule it produced one extra hit.
- The divergence needs bonuses that differ between families: this profile boosts guardsmen ×2.43 health /
  ×2.87 strength but the specialist only ×1.51 / ×1.71.
- One line is still unexplained: entry 20 of the 2026-09-13 report, a second Archer II strike right after the
  round's last enemy attack, same target and same damage as its normal line (20 of 21 entries reproduced). The
  account's unit cards show no strike-two-squads chance, so it is more likely the end-of-round sweep rule than
  a proc; the engine sweeps only stacks that have not struck this round, which reproduces both 2026-09-11
  fights.

## 1d. HP rounding (settled in game, 2026-09-13)
The game scales the **stack** and rounds once: 20 Spearman I total 7,289, which is not divisible by 20, so no
integer per-unit HP can produce it. TotalStack rounds the per-unit value first (and our sizer follows it, to
keep reproducing its counts); the difference is the ±1 tolerance the in-game tests carry.

## 1b. Bonus application (verified with army +25/+25 and guardsmen +20/+20, fixtures in `totalstack-2026-09-12-bonus-runs.json`)
- HP per unit = **round**(base × (1 + Σ health bonuses)) to an integer, then × count (ARC1 150 × 1.45 = 217.5 → 218;
  653 × 218 = 142,354 ✓ journal). Engine must round per unit the same way or counts drift by ±1.
- Base damage part = count × str × (1 + Σ strength bonuses); the strength-against part = count × str × SA/100 on
  the *base* strength only (ARC1: 653×50×1.45 = 47,343 + 653×50×0.67 = 21,876 → 69,218 ✓).
- Event strength (Ragnarok +130%) is additive inside the same bracket: ED 7×4500×(1+0.25+1.30) = 80,325 + 58,275 ✓.
  Arachne's changes only the enemy formation (8 attacks per round); per-hit numbers are unchanged.
- Engineers: highest HP per leadership, so under EP they end up with the highest troop-stack HP and die first
  (CAT2 77,625 > CAT1 76,875 > SW1 76,704 …); they hit the generic "monster" with no strength-against.
- Specialists in the same tier die before guardsmen because their bonus is lower (SW1 473×188 = 88,924 > SP1
  404×218 = 88,072); i.e. the order is still "highest HP first" — the algorithm assigns HP targets, not names.

## 2. Damage per hit
- **Journal line**: `count × str × (1 + Σ strength bonus) + count × str × SA[target]/100`, displayed as total
  "including X additional damage granted by the squad's features" where X is the second term. Verified on every
  line of three journals (e.g. ARC1 655×50 = 32,750 + 21,943 = 54,693).
- **Enemy line**: the number shown equals the destroyed stack's total HP (655 × 150 = 98,250).
- **Battle Summary / pill "Damage"** uses a *different* per-hit value: `base + 2 × features`
  (pill: RD3 99 units → 31,680 + 2×46,253 = 124,186 ✓; ARC1 660 → 33,000 + 2×22,110 = 77,220 ✓).
  "Probabilistic Damage" = Damage × (1 + double-damage chance) (RD3: 124,186 × 1.05 = 130,395 ✓).
  Why the summary doubles the strength-against term is unknown (maybe the in-game "features" line is itself on top
  of a strength-against already applied). Three in-game reports show the journal formula (features counted once),
  so this stays a TotalStack artefact we do not copy. Double damage is a plain ×2 on the whole line, features
  included (2026-09-13 entry 14: 4,224 incl. 780 against 2,112 incl. 390).

## 3. Summary totals (verified)
- `DAMAGE BY <pool>` = Σ over the pool's stacks of `(base + 2×features) × averageHits`, where averageHits is the
  mean of the enemy-first and army-first hit counts.
  Check, run ep-8stacks monsters: SG 146,640×3 + ED 148,050×3 + BB 121,056×3 + WE 132,696×0.5 = 1,313,586 ✓ exact.
  Check, run mp-bear: monsters 1,497,886 ✓ exact, mercenaries 52,800×3 = 158,400 ✓ exact.
- `MINIMUM DAMAGE` = enemy-first total with the same per-hit value (ep-8stacks: 2,428,232 vs shown 2,428,230;
  mp-bear: 2,689,817 vs 2,689,815 — rounding).
- `AVERAGE DAMAGE` = (minimum + maximum)/2, but the implied maximum for **troops** exceeds the army-first journal
  by a constant ≈ 42,500 in both runs (same troop stacks in both). 42,500 ≈ 5% × 2 × (total rider damage), i.e.
  it looks like the riders' double-damage chance being counted in the maximum only. Not resolved; see S-30.
- `DAMAGE / SILVER|GOLD|DRAGON COIN` = average damage ÷ the recovery-plan cost of the same resource
  (2,515,830 / 1,435,200 = 1.753 ✓; / 2,752 = 914 ✓; / 1,080 = 2,329 ✓).

## 4. Recovery cost (solved 2026-09-12 by the engine work; fixtures `totalstack-2026-09-12-mechanics-runs.json`)
Units are trained and revived **in chunks of ten**, and one unit per chunk comes back free ("only 90% revived
per chunk"). Writing `chunks(n) = ceil(n / 10)`, every captured figure follows from four formulas:
- **Retrain silver** = Σ troops `n × training.silver × (1 − trainingCostReduction[group]/100)`
  + Σ monsters/mercs `chunks(n) × training.silver` (monsters are trained ten at a time).
- **Retrain time** = the same split on `training.seconds`, each term divided by `1 + trainingSpeed[group]/100`.
- **Dragon coins** = Σ monsters `chunks(n) × training.dragonCoins` (identical under retrain and revive).
- **Revive gold** = Σ all units `(n − chunks(n)) × revival.gold / templeMultiplier[level]`.
  "Retrain all" also charges gold: it is exactly the *monsters'* revive gold, i.e. monsters cannot be retrained
  back into the march.

Per-run proof (all exact, no fitted constant left):

| run | monsters | retrain silver | dragon coins | retrain gold | revive gold | retrain time |
|---|---|---|---|---|---|---|
| ep-8stacks | WE 18 / BB 8 / ED 7 / SG 6 | 1,435,200 ✓ | 1,080 ✓ | 2,752 ✓ | 13,520 ✓ | 5d 23h ✓ |
| temple20-training-reductions (−30 % / +50 % guardsmen, temple 20) | same | 1,027,320 ✓ | 1,080 ✓ | 1,520 ✓ | 7,470 ✓ | 4d 3h ✓ |
| mp-10stacks | WE 11 / BB 5 / ED 4 / SG 4 | 1,294,800 ✓ | 1,080 ✓ | 1,536 ✓ | — | 4d 11h ✓ |
| to-10stacks | WE 11 / BB 6 / ED 5 / SG 4 | 1,294,800 ✓ | 1,080 ✓ | 1,744 ✓ | — | 4d 11h ✓ |
| mp-bear | WE 17 / BB 8 / ED 7 / SG 6 + BER5 1 | 1,435,200 ✓ | 1,080 ✓ | 2,704 ✓ | — | 5d 23h ✓ |
| ep-round-to-10s | WE 10 | 1,364,600 ✓ | 120 ✓ | 432 ✓ | — | 5d 10h ✓ |
| bonus-eng-nodom | none | 1,237,800 ✓ | 0 ✓ | 0 ✓ | — | 4d 1h ✓ |

This retires the three "unexplained constants" of the earlier write-up: M = 75,600 is the monsters' **chunk**
silver (`2×8,400 + 16,800 + 19,600 + 22,400`), which is why it does not move between WE 18 and WE 17
(`chunks(18) = chunks(17) = 2`); 2,752 is the monsters' chunk-discounted revive gold; 13,520 is the whole
army's. The 1,080 dragon coins are `2×120 + 240 + 280 + 320`, not `Σ n × dragonCoins` (= 7,960).

**Solved 2026-09-13 (S-30), from the game's own Temple screen and the owner's clarification.** There is no
retrain dialog and no hospital: retraining is recruiting the lost units again in the Army tab at the training
price (per unit for troops, per batch of ten for monsters — which is where `chunks(n)` comes from on that
side). The Temple is the only recovery screen and its header reads *"here you can revive up to **90 %** of
your fallen troops"*, charging 3 sacred potions or gold per unit. Since `n − chunks(n) ≡ floor(0.9 n)` for
every n, "ten at a time, one comes back free" **is** the game's 90 %: the tenth unit of each chunk is not
revived at all and must be recruited again — which is exactly what a "revive all" still costs in silver and
in time. Hence:
- **Revive-all silver** = Σ `chunks(n) × training.silver × (1 − trainingCostReduction[group]/100)`
  = 216,000 at temple 0 and 173,880 with the guardsmen −30 % ✓ exact (the temple divisor never touches silver;
  the 0.805 ratio was the training discount, not the temple).
- **Revive-all time** = Σ `chunks(n) × training.seconds / (1 + trainingSpeed[group]/100)` = 94,380 s
  (shown "1d 2h") and 78,040 s (shown "21h 40m") ✓ exact.
- Per-row gold in the Temple matches `round(n × revival.gold / templeDivisor)` on most rows and reads one gold
  higher on a few (7 units → 19 instead of 18); the per-row rounding rule is not pinned, the aggregate is.
- "Selective" recovery offers TOP 1 / TOP 2 / TOP 3 / CUSTOM (revive the top-N troop tiers, retrain the rest);
  the engine implements it as "revive the top-N unit types by tier, retrain the rest".

## 5. Stacking observations (all bonuses 0)
- Elite Preservation: flat HP profile, exact leadership fill, kill order tier-ascending; within a tier
  specialist first, then ranged, melee, mounted (custom-kill-order default list confirms:
  SW1, ARC1, SP1, RD1, ARC2, SP2, RD2, ARC3, SP3, RD3, then monsters WE, BB, SG, ED).
  Same-HP peers may tie (ARC1 = SP1 = 455) or differ by one unit (930/929) depending on remainder distribution.
- Monsters under EP fill dominance fully with their own flat profile (WE 18 / BB 8 / ED 7 / SG 6 → 199/200).
- M's Preservation: mercenary stacks and monster stacks are sized **below the lowest troop stack**; capacity is
  left unused (dominance 123/200) or a mercenary is dropped entirely when one unit already exceeds the ceiling
  (Cyclops V). Mercs above monsters was **not** enforced in the captured run (Bear 66,000 < monsters ≈ 94,000).
- Total Optimization: starts from MP and lets some monster stacks exceed the lowest troop stacks when the summary
  damage improves (ED 5, BB 6 vs MP's 4 and 5).
- Priority "Maximum Damage" kept all ten troop types (average 2,131,530) although the eight-type army scores
  2,515,830; "Damage / Silver" removed SW1 and SP1. Their search is not exhaustive — our S-40 can do better
  simply by evaluating "drop tier-1 types" candidates.
- Special strength keys (double damage 5%, strike two squads 5% from title Battlemaster): journal lines and the
  MINIMUM are unaffected; only AVERAGE (and the implied maximum) grow (AVG/MIN 1.121 vs 1.036 without them).
- Category bonus (captain Bernard, ranged +10/+10) changes the flat-HP solution as expected (ARC1 706 × 165 vs RD1
  388 × 300, both ≈116k). **Anomaly**: setting "Monsters Boost → Beast health 10" raised Battle Boar (beast) *and*
  Water Elemental (elemental) by 10% (E>BB 102,960 = 8×12,870; E>WE 100,320 = 16×6,270) while Emerald Dragon and
  Stone Gargoyle were unchanged. Either the first two race fields are coupled in TotalStack or the input I set was
  not the one I think; re-check by hand before copying the race-key mapping (open item for S-20).
- A uniform army-wide bonus (title +150/+150) leaves the stack counts identical to the zero-bonus run.
- Enemy formation N (4 or 8) generalises the round structure exactly (Arachne's run: 26 entries, 14 hits with
  12 stacks and N = 8).
- Round to 10s: only mercenaries/monsters are rounded (to multiples of 10); troops are re-sized around them;
  monster types that cannot reach 10 within the ordering are dropped (only WE 10 survived with dominance 200).
