# TotalStack (totalstack.ca) — feature review

Reviewed 2026-09-12 by walking the live app (free tier, trial expired), reading its client bundle
(`assets/index-*.js`, `assets/Home-*.js`), and the user's own saved configuration in localStorage.
The stacking algorithm itself runs **server-side** (`POST /api/calculations`, `POST /api/calculations/optimize`);
only the UI, game data tables, and input validation are in the browser. Everything below about the
algorithm is therefore inferred from inputs, outputs and help texts, not read from code.

Game data tables extracted from the bundle are in `docs/research/totalstack-data/` (JSON, see its README for
provenance). Help texts quoted or paraphrased below are research notes only: none of this wording goes into our UI.

## 1. Product structure

Navigation: **Calculators** (Epic Monster Stacking, Olympus Talent Points, Clan Rewards Distribution),
**Data** (Dragon Stats, Crypt Rewards, Epic Monster Chests, Research Costs), **Community** (Feedback, Discord),
**Help** (About, Guided Tutorial). Also an AI chatbot ("Stacksmith"), accounts, Stripe/PayPal billing,
clan-manager plans, admin pages. Only *Epic Monster Stacking* is in scope for our replacement.

Pricing: Pro $4.99/month or $39.99/year. Free tier keeps: troop selection, Elite Preservation, Generate
without priority, result pills with details, Battle Simulation journal, 1 account profile.
Pro unlocks: Battle Summary, Priority search, Total Optimization, Manual HP Order, M's Preservation,
Custom Kill Order, 3 (or 5) account profiles.

## 2. Calculator page, section by section (top to bottom)

### 2.1 Troop selection
- **Guardsmen**: min tier / max tier selectors (G1..G9). "Include at G<max>" row with one toggle per
  category (melee / ranged / mounted / flying) so partially unlocked top tiers can be excluded.
  Flying guardsmen exist from G5 (Battle Griffin), leadership cost 20.
- **Specialists**: min/max (S1..S9). Melee only until S5; S5+ adds ranged, mounted, flying. Same
  per-category exclusion at the top tier.
- **Engineers**: min/max or disabled ("—"). Catapult 1-5, Siege Ballista 6-7, Josephine 1-2. Cost 10 leadership each.
- **Monsters**: min/max (M3..M9) or disabled. 28 monsters, 4 per tier, each with category
  (melee/ranged/mounted/flying) and race (beast/elemental/dragon/giant). Use Dominance.
- **Mercenaries**: multi-select from a searchable dropdown (69 built-ins, grouped by tier, filterable by
  role guardsmen/specialist/engineer/monster, by category, by race). Each selected mercenary pill has a
  **cap** (how many you own) and a category icon. "Custom Mercenary" form: name, health, authority cost,
  strength, revival cost, double damage chance, role, category, race, event association.
  Use Authority.
- Individual unit exclusion also happens implicitly from the result card ("Remove from formation",
  "Removed from formation / Tap to restore"). The user's config had `swordsman-1` and `rider-2` excluded this way.

### 2.2 Stacking method (one of four)
| Method | Help text (paraphrased) |
|---|---|
| Elite Preservation (free, default) | Engineers die first, then regular troops so lower tiers die before higher tiers. Dominance and Authority follow the same style inside their own pools. Uses the full housing capacity. |
| M's Preservation (Pro, "popular") | Requires EP. Mercenaries begin to die only after all Specialists/Guardsmen have fallen; Monsters only after all Mercenaries are gone. Authority/Dominance may be left partly unused when preserving the order requires it. |
| Total Optimization (Pro, "new") | "Starts from MP-style protection, then tests HP and housing trades that can break normal preservation when damage improves." Deeper/slower search, optional "deep optimization seeds". |
| Custom Kill Order (Pro) | Drag list of all units (troops, monsters, mercs); top dies first. Default order: Specialists → Guardsmen → Monsters, per tier ascending. |

Hidden/legacy flags in the API: `monstersLast`, `damageStacking`, `damageStackingAttackOrder`
("HP order is repaired toward the reverse of boosted stack damage"; "stacks with lower attack-order
strength receive a small preservation bump because they attack later"), `roundMonstersTo10`, `roundMercsTo10`.

**Troop Type Allocation**: only when no preservation method is active — percentages per category
(ranged/melee/mounted/flying, must sum to 100) to weight housing toward unit types (for non-epic
targets like normal monsters or citadels). Auto-managed otherwise.

### 2.3 Bonuses — "By Source" (recommended) vs "By Battle Report"
By Battle Report = type the total health % per type straight from a battle report; health only,
no strength, no simulation; meant for players below T5.

By Source pills, each with a gear icon opening a per-source editor with the 13 bonus keys
(`melee, ranged, mounted, flying, guardsmen, specialist, engineers, monster, army, beast, elemental, dragon, giant`)
for **health** and again for **strength**, plus "special strength" keys
(`doubleDamageChance, strikeTwoSquadsChance, {beasts|elementals|dragons|giants}StrikeTwoSquadsChance,
{guardsmen|specialists|engineers|monsters}DoubleDamageChance`) and "player-only" keys (PvP, ignored for monsters).

- **Permanent** (always on): Hero Talents, Hall of Fame, Customization Bonuses (frames/city looks),
  Army Modernization (research), Monsters Boost (research, per race), Clan Technologies, Clan Capital
  Appearance, Union of Triumph (number of Golden Passes → bonus), plus custom permanent sources.
  Each editor shows a note "where to find it in game".
- **Captains** (select up to 3 marching): 30 captains. Gear icon → Base Level (number) and Star Level (★0-7).
  Data: `bonusKey` (which of the 13 keys), `baseMultiplier` (bonus% = baseLevel × multiplier), `starBonuses[7]`
  for health, and a separate `strength` block. Special multipliers: Sofia Army ÷2, Amanitore Army ×1.5, Skadi
  Guardsmen ×2; Brann is engineers-only. Some captains have no data (pure display).
- **Equipment** (up to 15 pieces = 3 captains × 5 slots): "Add" → choose type (12 types, e.g. Guardsmen's
  Courage, Specialists' Authority, Skillful Engineer, Emerald Guardian…), quality (poor…legendary…), a free
  name, gem/enchantment. Bonuses come from `bonusesByQuality`.
- **Artifacts** (up to 3): 15 artifacts; gear → level (1-60 base table) and star level (0.1…5.0 table), plus
  "random bonus" options with rarity (army health, army strength, both, against players).
- **Titles**: toggle pills grouped Health / Strength / Other (e.g. Battlemaster HP/STR +150%, 2× DMG +5%,
  2nd strike +5%; Warlord HP/STR +100%; Punching Bag HP −10%). Custom titles can be added.
- **Other**: VIP (gear → level, gives army %), Dragon (gear → per-key stats), Hero (Svyatogor +50%
  HP/STR when marching alone; Haemon; Meriones — one hero max), Personal/Clan/Kingdom Health/Strength
  +25% pills, Unknown Sources (free-form to reconcile with battle reports), custom.
- **Events**: Arachne's (switches enemy formation to 2-of-each and activates "swarm units" mercenary
  bonuses), Ragnarok - Fenrir (+130% STR), custom events. Mercenaries can have `strengthAgainstEvent`.
- **TOTAL cards**: computed Health bonuses and Strength bonuses per key, expandable breakdown per source.
- **Other bonuses**: Temple level 1-45 → revival-cost multiplier table (1.04 … 5.91), Training cost reduction
  % per group, Training speed bonus % per group (feed the recovery-cost part of Battle Summary).
- **Battle presets** (Pro): save the currently active selection of sources + housing values under a name.
  Separate from "Source profiles" (full bonus setup) and "Account profiles" (everything).

### 2.4 Enemy stacks
Presets "4 Standard" (1 flying, 1 melee, 1 ranged, 1 mounted), "8 Double" (2 each, Arachne's), or Custom
(0-20 each). "For damage calculations this matters because troops only receive Strength-Against bonuses
when the enemy formation still includes the matching stack type."

### 2.5 Housing + priority + Generate
Leadership, Authority, Dominance numbers ("copy from the Start March screen"). Priority: None,
Maximum Damage (`averageDamage`), Damage / Silver (`damagePerSilver`); API also knows
`damagePerDragonCoin`, `damagePerGold`. With a priority, Generate runs the "priority search" which removes
tiers that don't help the goal.

### 2.6 Output
- **Battle Summary** (Pro): Stacks count, Recovery plan (Retrain all / Revive all / Selective top-N types),
  Minimum damage, Average damage, Damage / Silver, Retrain silver, Retrain gold, Time to retrain. Deltas shown
  when editing in Manual HP Order.
- **Result card**: one pill per stack (icon, label, count) in three pools (Leadership, Authority,
  Dominance) with used/available badges; "Sort by total HP", "Reset order" (drag to match in-game order),
  "Round to 10s" (re-runs the calc so stacks are multiples of 10, because revival works on 10-unit steps),
  "Remove type" dropdown, "Removed from formation" restore area.
- **Pill popup**: tier, features (category/group/race icons), leadership cost, training time, training cost,
  revival cost, health bonus %, boosted health per unit, strength bonus %, amount, Damage, Probabilistic
  damage (includes double-damage chance), Total health, "Remove from formation".
- **Battle Simulation** (free): a "Journal" that mimics the in-game battle report: "25 rounds • 15 friendly
  hits • 4 enemy stacks", toggle "Enemy first / Your army first", then a numbered list of hits:
  "Monster squad dealt 199,984 damage to your Rider I squad" / "Your Archer I squad dealt 114,390 damage to
  the flying monster squad including 31,155 additional damage granted by the squad's features".
- **Manual HP Order** (Pro): +/- per stack, drag to a new HP position, direct edit, undo/redo, may exceed housing.
- **Side panel** (desktop ≥1280px): compact list of counts per pool.
- Account profiles, patch notes, feedback link.

## 3. Verified formulas (from the user's real output)

Config: G1–G3 (G3 mounted only), S1 (SW1 excluded), no engineers, monsters M3–M5 but Dominance 0,
mercs EMH6 ×22, ABT6 ×24, LGN6 ×23, CHR6 ×12, Leadership 4100, Authority 2500, Elite Preservation.
Total health bonuses: guardsmen +39.5, melee/ranged/mounted +1, army +3. Strength: guardsmen +76, army +3.

Result (kill order, first to die → last): SP1 929, ARC1 930, RD1 464, SP2 513, ARC2 514, RD3 143; all
four merc stacks at their caps (93/2500 authority used); leadership used 4100/4100.

- Effective HP per unit = base × (1 + Σ applicable health bonuses).
  Rider 3: 960 × (1 + 0.395 + 0.01 + 0.03) = 1,378 ✓ (popup "Boosted Health per unit 1,378").
- Total stack HP is (almost) **equal across all stacks**, ≈ 200k here, strictly decreasing along the
  kill order by tiny margins (the +1 unit between SP1 929 and ARC1 930 is the margin):
  SP1 929×150×1.435 = 199,956 > RD1 464×300×1.435 = 199,752 > … > RD3 143×1,378 = 197,054.
  So Elite Preservation is "flat HP profile + strict ordering + exact fill", **not** a geometric ratio.
- Damage per hit = count × strength × (1 + Σ strength bonuses) + count × strength × strengthAgainst[target]/100.
  Archer I: 930×50×1.79 = 83,235 plus 930×50×0.67 = 31,155 → 114,390 ✓ (journal line).
- Probabilistic damage = damage × (1 + doubleDamageChance): Rider 3 226,953 / 215,530 = 1.053
  (unit 5% + guardsmen 0.3%) ✓. The pill's "Damage 215,530" = 143×320×(1.79 + 2×1.46) is *not* yet
  explained (two strength-against applications?) → investigation story.
- Enemy behaviour: the monster hits the stack with the **highest total HP** and wipes it in one hit.

## 4. API input (zod schema, for our own config model)
`inputValue` (leadership), `dominanceValue?`, `authorityValue?`, `{guardsmen,specialist,monster,engineer}{Min,Max}Tier`,
`rangedPct/meleePct/mountedPct/flyingPct`, `guardsmenExcludedCategories`, `specialistExcludedCategories`,
`excludedTroopIds`, `excludedMonsterIds`, `selectedMercenaryIds`, `customMercenaries[]`, `mercenaryCaps{}`,
`enforceOrdering` (=Elite Preservation), `monsterSaving` (=M's Preservation), `monstersLast`, `relaxedPreservation`
(=Total Optimization), `damageStacking`, `damageStackingAttackOrder`, `roundMonstersTo10`, `roundMercsTo10`,
`mercenaryPriority?`, `customPriority?` (custom kill order), `bonusMode: source|direct`, `directBonuses{}`,
`healthBonuses{13 keys}`, `strengthBonuses{13 keys}`, `matchupStrengthBonusesByCategoryAndTarget`,
`armyStrengthAgainstEpicMonstersBonus`, `eventStrengthBonus`, `activeEventStrengthName`, `arachnesEventActive`,
`specialStrengthBonuses{}`, `enemyFormation{flying,melee,ranged,mounted}`.
Optimize adds: `objective`, `optimizationSeed`, `deepOptimizationSeeds`, `reviveAllTroops`, `recoveryPlan{mode, selectiveTopTroopTypes}`,
`templeLevel`, `trainingCostReductions{}`, `trainingSpeedBonuses{}`.
Validation rules: monsters need min/max ≥ 3; M's Preservation and Monsters Last are exclusive and require EP;
Total Optimization excludes the other preservation flags; allocation percentages must sum to 100 when no preservation flag is set.

## 5. What we will not copy
Accounts, server storage, billing, chatbot, clan tools, admin, the other calculators and data pages,
analytics. Everything user-specific lives in the browser and in shareable URLs/JSON.
