# Battle model as implemented by TotalStack — derived from captured journals and summaries

Source: fixtures in `docs/research/fixtures/` (2026-09-12, Pro trial, all bonuses 0). "Verified" means the formula
reproduces TotalStack's number exactly; it does not yet mean the game behaves this way (S-30 still needs in-game
reports).

## 1. Turn structure (verified on two journals, enemy-first and army-first)
- Our stacks are ordered by **total HP descending** (ties keep the display order). This order is used both as the
  enemy's kill order and as our attack order. Counts never change during the fight (an enemy hit wipes a stack).
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
  of a strength-against already applied). **To settle with a real battle report** (S-30).

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

## 4. Recovery cost (verified for "Retrain all", temple 0, no reductions)
- Silver = Σ count × trainingCost.silver over troops **and** monsters (ep-8stacks: troops 1,183,600 + monsters
  251,600 = 1,435,200 ✓). Dragon coins = Σ monsters count × dragonCoins (1,080 ✓). Gold (retrain all) = Σ over
  monsters of count × revivalCost.gold? — 2,752 = SG 6×128 + ED 7×112 + BB 8×96 + WE 18×48 = 768+784+768+864 = 3,184 ✗;
  troops Σ count×gold = 655×4+361×4+361×4+327×8+202×4+203×4+181×8+101×8 = 12,168 ✗. **Gold composition not
  yet explained** (2,752 for retrain-all, 13,520 for revive-all = 12,168 + ? … check with temple table). Open.
- Time = Σ count × trainingTime (troops + monsters), displayed as days/hours (5d 23h ✓ order of magnitude; exact
  formula to confirm — parallel queues?).
- "Revive all": silver 216,000, gold 13,520, time 1d 2h for the same army — revival is priced in gold with the
  temple multiplier; silver 216,000 = ? (open).

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
- Enemy formation N (4 or 8) generalises the round structure exactly (Arachne's run: 26 entries, 14 hits with
  12 stacks and N = 8).
- Round to 10s: only mercenaries/monsters are rounded (to multiples of 10); troops are re-sized around them;
  monster types that cannot reach 10 within the ordering are dropped (only WE 10 survived with dominance 200).
