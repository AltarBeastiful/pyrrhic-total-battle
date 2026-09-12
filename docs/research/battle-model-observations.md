# Battle model as implemented by TotalStack — derived from captured journals and summaries

Source: fixtures in `docs/research/fixtures/` (2026-09-12, Pro trial, all bonuses 0). "Verified" means the formula
reproduces TotalStack's number exactly. **In-game validation (2026-09-12, one real epic-monster report, see
`fixtures/ingame-2026-09-11-epic-ancient-report.md`)**: HP per stack, per-hit damage incl. strength-against on base
strength, enemy targeting by highest HP, and the round structure all match the game exactly. One difference found:
the game's friendly attack order is not always the next victim (Rider I was killed before its turn while Archer II
attacked) — open item for S-30.

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

## 4. Recovery cost (partly verified; fixtures `totalstack-2026-09-12-mechanics-runs.json`, run temple20-training-reductions)
- **Retrain-all silver** = Σ troops count × trainingCost.silver × (1 − trainingCostReduction[group]) + M, where for the
  8-stack army Σ troops = 1,359,600 exactly and M = 75,600 (temple 0 and temple 20 give the same M; a 30% guardsmen
  reduction removes exactly 0.3 × 1,359,600). M is *not* the monsters' training silver (557,200) and does not change
  between WE 18 and WE 17 → **unexplained constant, open**.
- **Retrain-all gold** = 2,752 at temple 0 → 1,520 at temple 20 = 2,752 / 1.81 ✓ (temple multiplier applies).
  2,752 is not Σ revivalCost.gold of troops (12,000) nor monsters (3,184) → composition open.
- **Revive-all gold** = 13,520 at temple 0 → 7,470 at temple 20 = 13,520 / 1.81 ✓. 13,520 ≠ 12,000 + 3,184 → open.
- **Revive-all silver** = 216,000 at temple 0 (= 1,080 dragon coins × 200?) → 173,880 at temple 20 (×0.805) → open.
- Dragon coins = Σ monsters count × trainingCost.dragonCoins = 1,080 ✓ in every run (retrain and revive alike).
- Time: 5d 23h (retrain all) → 4d 3h with +50% guardsmen training speed; 1d 2h (revive all) → 21h 40m at temple 20.
  Formula open (sum of training times ≈ 655×15 s + … is far below 5d 23h → probably per-unit time × count without
  parallel queues, to be fitted).
- "Selective" recovery offers TOP 1 / TOP 2 / TOP 3 / CUSTOM (revive the top-N troop tiers, retrain the rest).
These open points are cheap to settle in game (the retrain/revive screens show the exact cost) — folded into S-33.

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
