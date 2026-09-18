# Pyrrhic — implementation plan

A fully client-side replacement for TotalStack's *Epic Monster Stacking* calculator for Total Battle.
No accounts, no server, no logging. Profiles, saved stacks and settings live in the browser
(localStorage/IndexedDB) and can be exported as JSON or shared as a URL that carries the whole config.

Companion documents: `docs/design-rules.md` (the owner's UI/UX rules, checked by every plan and worker brief), `docs/research/totalstack-review.md` (what TotalStack does, verified formulas) and
`docs/research/totalstack-data/*.json` (game data tables: troops, monsters, mercenaries, captains,
equipment, artifacts, titles, temple table).

## 1. Goals and non-goals

Goals
1. Same input coverage as TotalStack "By Source" mode, with a faster, simpler flow.
2. Deterministic, testable stacking engine that runs in the browser (Web Worker for long searches).
3. Everything persisted locally; export/import JSON; share via URL hash; no network calls at all.
4. Fully free and open source (repo LICENSE): no paywall, no tiers, no trial. Everything TotalStack puts behind
   Pro that we implement (Battle Summary with min/avg/max damage and damage per silver, M's Preservation, custom
   kill order, priority search, unlimited profiles) is available to everyone.

Non-goals (v1)
- Accounts, sync, billing, chatbot, clan tools, other calculators/data pages, PvP.
- "By Battle Report" mode (health-only fallback). Can be added later as a thin input mode.

## 2. Architecture

Stack: **Vite + React 19 + TypeScript (strict)**, Mantine 9 (themed from the design hues, ADR-0008), Zustand (state, persist middleware),
zod (schemas for stored/imported/URL config with versioned migrations), Vitest (engine tests),
Playwright (a few smoke e2e), GitHub Pages via GitHub Actions. PWA (offline) as a later story.

```
src/
  data/        game tables as typed JSON + loaders (troops, monsters, mercenaries, captains, equipment,
               artifacts, titles, temple, heroes, events). Versioned; a `dataVersion` is stored with configs.
  engine/      pure TS, no React: bonuses.ts (aggregate sources → totals), units.ts (effective HP / strength
               per unit), killOrder.ts, stacker.ts (sizing), battle.ts (simulation/summary), search.ts
               (priority search), rounding.ts, types.ts. Deterministic, fully unit-tested.
  state/       zustand stores: profile store (active profile + list), ui store; selectors for derived totals.
  share/       codec.ts (config ⇄ compact JSON ⇄ deflate ⇄ base64url), migrations.ts, export/import.
  ui/          sections in page order (Troops, Mercenaries, Method, Bonuses, Enemy, Housing, Results),
               shared primitives (Pill, RangeSelect, NumberField, Popover, Toggle, Drawer).
  worker/      calc.worker.ts — runs engine jobs off the main thread (priority search, Total Optimization).
tests/
  fixtures/    real TotalStack outputs and in-game battle reports used as regression tests.
```

### 2.1 Persistence model
- `Profile` = one game account: unlocked tiers + exclusions, mercenary inventory and caps, all bonus source
  values (permanent, captains with levels, equipment, artifacts, titles, other, events), temple/training
  values, default housing. Several profiles allowed; one active.
- `BattleSetup` (a "preset" inside a profile) = which sources are active for a march (captains chosen,
  titles on, event, hero, VIP/dragon on), housing values, enemy formation, method, priority, kill order.
- `SavedStack` = a frozen result (inputs snapshot + output counts + summary) with a name/date, for later
  comparison or sharing.
- Storage: localStorage key `pyrrhic.v1` holding `{ schemaVersion, dataVersion, profiles[], activeProfileId, ui }`.
  Writes debounced; zod-validated on read; migrations by `schemaVersion`. IndexedDB only if size becomes an issue.
- Export: `pyrrhic-<profile>-<date>.json` (full profile or single setup/stack). Import merges or replaces, with preview.
- Share URL: `https://<host>/#c=<base64url(deflate-raw(JSON))>`. Two kinds, chosen in the share dialog:
  **profile link** (whole account: tiers, mercenaries, all bonus source values, setups) and **battle link** (one
  battle setup + its result counts, small enough to paste in clan chat). Payload has defaults stripped and a `kind` field.
  Size budget: a battle link must stay under 2,000 characters (Discord message limit for most users); a profile
  link may be longer (browsers accept far more) and is also offered as a QR code / JSON file. See ADR-0005. Opening a share link shows a "Load shared config → as new profile / replace active" prompt; nothing
  is auto-overwritten. Target < 2 KB for a typical profile (browser limits are far above that).

### 2.2 Contributions and game-data updates
The game data must be editable by anyone through a normal pull request, without touching application code.
- Location `src/data/tables/`, one JSON file per table (`troops.json`, `monsters.json`, `mercenaries.json`,
  `captains.json`, `equipment.json`, `artifacts.json`, `titles.json`, `heroes.json`, `events.json`,
  `temple.json`), plus `version.json` (`dataVersion`, date, notes). Plain JSON, no build step, arrays sorted by
  id, 2-space indent, one field order, enforced by `npm run data:format` so diffs stay minimal.
- Each record carries the fields a player can read off an in-game screen (base health, strength, costs, strength
  against…). `docs/data/README.md` explains each table, each field, where to find the value in game, and how to add
  a new unit, captain or equipment piece (worked examples).
- Validation in CI on every PR: zod schemas (types, required fields, ranges), cross-table integrity (unique ids,
  tier/category consistency, kill-order lists reference existing ids), formatting check, and the engine test suite
  (a data change that breaks the regression fixture fails the PR with a clear message).
- The TotalStack drift check (S-05) runs on PRs that touch `src/data` too, so a contributor sees at once whether the
  new values agree or disagree with TotalStack's tables (disagreement is allowed but must be explained in the PR).
- `CONTRIBUTING.md` + a PR template for data changes (what changed, in-game evidence such as a screenshot,
  `dataVersion` bump). Data changes are listed in `src/data/CHANGELOG.md` and shown in the app's "about" panel.
- Licence: AGPL-3.0 for code; game data is factual and shared under the same repo terms.

### 2.3 What we take from TotalStack, and what we do not
1. Only the **factual game tables** (unit stats, costs, bonus values), reshaped into our own format
   (§2.2), each table carrying a provenance note: "values verified against the game on <date>". They are game
   facts, not TotalStack's creation, but we still verify them ourselves before shipping.
2. No TotalStack patch notes, tutorial or help copy in the repo (removed from `docs/research`). The review
   document paraphrases their help text for research only.
3. **All UI wording, help text and tooltips are written by us.** Story S-17 includes an original help-text pass;
   the reviewer checks that no sentence is lifted from TotalStack.
4. Automated fetching of their bundle (S-05) is **not decided yet**. Findings so far: totalstack.ca publishes no
   terms of service or privacy policy page; `robots.txt` allows `/` and disallows only `/admin`, `/clan`,
   `/reset-password`. Story S-07 records the decision. Fallback if we decide against it: a manual
   `npm run data:compare -- <path-to-downloaded-bundle>` that contributors run locally and paste into the PR.

## 3. Engine specification

### 3.1 Bonus aggregation
Keys (health and strength alike): `melee, ranged, mounted, flying, guardsmen, specialist, engineers, monster,
army, beast, elemental, dragon, giant`. Special strength keys: `doubleDamageChance, strikeTwoSquadsChance,
<race>StrikeTwoSquadsChance ×4, <group>DoubleDamageChance ×4`, plus `armyStrengthAgainstEpicMonsters` and
`eventStrength`.

Sources → contributions (all additive percentages, same as TotalStack):
- Permanent sources: free-form 13-key editors (Hero Talents, Hall of Fame, Customization, Army Modernization,
  Monsters Boost, Clan Technologies, Clan Capital Appearance, Union of Triumph, custom).
- Captains: bonus% = baseLevel × baseMultiplier + starBonuses[star] on `bonusKey`, separately for health and
  strength (data in `captains.json`; Sofia/Amanitore/Skadi multipliers included).
- Equipment: `bonusesByQuality[quality]` per piece (`equipment.json`), up to 15 pieces, plus gem/enchant fields.
- Artifacts: level tables (`artifact-*-by-level.json`) + random bonus with rarity, up to 3.
- Titles: fixed tables (`titles.json`), PvP-only keys ignored.
- Other: VIP level → army%, Dragon (13-key editor), hero (Svyatogor +50/+50 only when marching alone),
  Personal/Clan/Kingdom +25 pills, Unknown Sources, custom.
- Events: active event strength% and event-gated mercenary `strengthAgainstEvent`.
Totals are shown with a per-key breakdown by source (needed to reconcile with in-game battle reports).

### 3.2 Effective unit stats
```
hp(unit)       = round( baseHealth × (1 + Σ health[key] for key in keys(unit)) / 100 )   (integer per unit, as TotalStack/the game display it)
str(unit)      = baseStrength × (1 + Σ strength[key] for key in keys(unit)) / 100
keys(unit)     = category + group (+ race for monsters and race-tagged mercenaries) + army
dmg(stack, T)  = n × str × (1 + Σ strength + event) + n × str × strengthAgainst[T]/100   (T = targeted enemy stack type,
                 only if present in the enemy formation; `epicMonsters`, `swarmUnits` bonuses handled likewise)
expectedDmg    = dmg × (1 + doubleDamageChance(unit + group + global)) × (1 + strikeTwoSquads…)  (see 3.5)
```
Verified against the user's TotalStack output (see review §3).

### 3.3 Kill order
User-facing names (docs/design.md glossary): Elite Preservation is shown as **Tier ladder**, M's Preservation as
**Troops first**, the relaxed post-pass as **Allow damage trades**, the custom list as **Your own order**. The
engine ids stay `elite` / `ms` / `custom`. The TotalStack names below are kept in this document for traceability
to the research notes only.
A kill order is an ordered list of *stacks* (unit types), first to die first. Sources:
- **Elite Preservation**: engineers (any order) → leadership troops by tier ascending; within a tier
  specialists before guardsmen, and by category ranged → melee → mounted → flying (verified on the fixture:
  ARC1 > SP1 > RD1 > ARC2 > SP2 > RD3 by total HP); monsters and mercenaries ordered the same way inside their own
  pools (tier ascending) but pools are independent (no cross-pool constraint).
- **M's Preservation**: EP order, then every mercenary stack and every monster stack is sized below the lowest
  leadership stack (capacity left unused, or a unit type dropped when a single unit already exceeds the ceiling).
  The finer chain "mercs above monsters" is what the help text claims but the captured run does not enforce it
  (see battle-model-observations §5); we implement it as an optional strictness toggle, default off, so that the
  fixture reproduces. "Monsters Last" (monsters after troops, mercs unconstrained) kept as a flag.
- **Custom**: user-ordered list (drag & drop), mixing all pools.
The pool a stack belongs to (leadership / authority / dominance) and its unit cost are fixed by data.

### 3.4 Stack sizing ("flat HP profile with exact fill")
Given pool capacities, unit costs, per-unit HP, caps (mercenaries), and a kill order, find counts `n_i` such that:
1. Σ cost_i × n_i ≤ capacity of each pool, and for leadership the pool is filled exactly when possible;
2. total HP is **non-increasing** along the kill order, ties allowed and reported. Strict ordering was the
   original intent, but the captured TotalStack output does not have it (ep-8stacks ships ARC2 = SP2 = 97,470
   and SP3 = RD3 = 96,960) and forcing it costs 3–5 units per stack against the fixtures. The kill order is a
   *ranking* that assigns HP targets; the stack that actually dies first is whichever has the highest total HP,
   which is what the enemy picks (verified 10/10 kills in both in-game reports). Ties go to `result.warnings`;
3. subject to (2), the HP profile is as flat as possible (this is what maximises the number of high-tier units).
Algorithm: binary search on a target ceiling H for the pool; each stack gets `floor(H_i / hp_i)` with
`H_i = H − i·δ` and `δ = RANK_SPREAD × H` (`RANK_SPREAD = 0.0019`, fitted to the captured runs); then
round-robin passes from the first-to-die stack down add single units until the pool is exactly filled.
O(stacks × log(capacity)); instantaneous. Results are returned in true kill order (total HP descending, ties
broken by the ranking).
Mercenary stacks are bounded by caps; if a cap makes a merc stack too small to sit *above* the next one in
the kill order, the order simply continues (a capped stack may die earlier; the UI flags it).
M's Preservation: size the leadership pool first; then size mercs under `min(troop HP)`; then monsters under
`min(troop HP)` too — and under `min(merc HP)` only when the "mercs above monsters" toggle is on, since the
captured run does not enforce it; report unused authority/dominance.
Options: "Round to 10s" solves the profile normally and then truncates mercenary/monster counts down to a
multiple of 10, dropping the types that fall below 10 and leaving the freed capacity unused (revival and
training work in 10-unit chunks; reproduces ep-round-to-10s exactly: WE 18 → 10, dominance 30/200);
exclusions (per-unit and top-tier per-category); Troop Type Allocation percentages when no preservation order
is chosen (weights pool share per category).

**Left-out unit types** (S-53, schema v3). There are no pins and nothing about a march's left-out types is
stored: the setup carries neither list. The available types of a march are the troop selection alone (tier
ranges, top-tier category chips, and the top-tier monsters the account has not unlocked). **Generate is a
fresh solve** on all of them — the sizer, or the priority search when an objective is chosen — and it forgets
every earlier March edit. **The March then recomputes in place**: taking a type out or putting one back edits
the run's `includedUnitIds` and re-sizes the remaining types straight away (the sizer only, never the search),
without a Generate and without marking the answer out of date, because the form has not moved. A put-back type
is simply *in*, sized like any other; nothing forces one, so if the sizer still cannot pay for it, it returns
to the left-out row with the sizer's own reason. The left-out row lists every available type the march does
not field and says who left it out — the player, or the solver. All of it lives with the result (`runStore`)
and is never persisted, shared or synced.

### 3.5 Battle model and Battle Summary
Enemy: 4 stacks (flying/melee/ranged/mounted), 8 for Arachne's, or custom counts. Each enemy hit removes our
highest-total-HP living stack. Sides alternate; whoever strikes first is a coin flip in game, so we compute the
**Minimum** (enemy first), **Maximum** (we strike first) and **Average** damage. The game prints no total
damage figure — a report's damage is the sum of its own hit lines — so both bounds *are* that sum (features
counted once, a double-damage line at its printed doubled value) and a user can add up a real report and land
on one of our two numbers; the average is the plain midpoint and procs are upside we do not price in. A fight runs on **two orders**
(settled in game on 2026-09-13, S-30): the enemy kills by **total HP descending** (29/29 kills over four reports,
a mercenary stack on top included), while our stacks strike in **base-damage descending** order — `count ×
strength × (1 + Σ strength %)`, the per-hit damage *without* the strength-against part. The two coincide whenever
health and strength bonuses move together (every captured TotalStack run), which is why TotalStack's HP-order
model reproduced its own journals; they diverge as soon as one family is boosted unevenly, and that is what makes
Rider I miss its turn in the two 2026-09-11 fights and Rider II strike before the bigger Swordsman I stack on
2026-09-13. With the base-damage order the engine reproduces all three reports entry for entry (28, 24 and 20 of
21 lines). Each stack targets the enemy stack it has the best `strengthAgainst` for, else the melee squad. Within
a round the enemy's N attacks alternate with single friendly attacks — each taken by the next stack in attack
order that is alive and has not struck this round — and after the N-th enemy attack every living stack that has
not struck yet attacks once, in attack order; a stack wiped before its turn simply loses that round's attack.
"Army first" only inserts one opening attack by the first stack in attack order. Double damage is a plain ×2 on
the whole line, features included (seen twice in game, labelled as such); strike-two-squads is still not modelled.
One line of four reports is not reproduced — a second Archer II strike after the last enemy attack of a round on
2026-09-13 — and the account's unit cards show no strike-two-squads chance, so it is probably the end-of-round
sweep rule rather than a proc; a fourth report settles it. Damage per hit from 3.2; expected damage adds double-damage and
strike-two-squads probabilities. Total damage = Σ over hits until all our stacks are dead or the round cap.
Journal output = the same numbered hit list as the in-game report so users can compare 1:1. The game scales a
stack's HP and rounds once (20 Spearman I = 7,289, not divisible by 20); TotalStack rounds per unit and our sizer
follows it to keep reproducing its counts, which is the ±1 the in-game tests tolerate.

Recovery: there is no retrain dialog and no hospital in the game — **retraining is recruiting the lost units
again in the Army tab** at the training price (per unit for troops, per batch of ten for monsters), and the
**Temple** is the only recovery screen: *"here you can revive up to 90 % of your fallen troops"*, 3 sacred
potions or gold per unit, the gold divided by the temple multiplier. Since `n − chunks(n) ≡ floor(0.9 n)` with
`chunks(n) = ceil(n / 10)`, the game's 90 % *is* our chunk-of-ten rule, and the tenth unit of every chunk is not
revived at all: it has to be recruited again, which is what a "revive all" still costs in silver and in time. So:
**Retrain** = Σ troops `n × training.silver × (1 − trainingCostReduction[group]/100)` + Σ monsters
`chunks(n) × training.silver`, time the same split on `training.seconds` divided by `1 + trainingSpeed[group]/100`,
dragon coins = Σ monsters `chunks(n) × training.dragonCoins`, plus the monsters' revive gold (monsters cannot be
retrained back into the march); **Revive** = gold Σ all `(n − chunks(n)) × revival.gold /
templeMultiplier[templeLevel]`, plus silver Σ all `chunks(n) × training.silver × (1 − reduction)` and time Σ all
`chunks(n) × training.seconds / (1 + speed)` for the tenth that cannot come back; **Selective** = revive the
top-N unit types by tier, retrain the rest. These reproduce every silver, gold, dragon-coin and duration figure
of the seven captured runs exactly — revive-all silver (216,000 → 173,880) and revive-all time (1 d 2 h →
21 h 40 m) included (battle-model-observations §4). The temple divisor applies to gold only.
Summary metrics: stacks, min/avg/max damage, damage per silver, per gold, per dragon coin, retrain silver,
retrain gold, time to retrain. Shown with deltas when the user edits counts manually.

Validated against four real in-game battle reports (2026-09-11 ×2, the 2026-09-13 deliberate march, plus the
Temple and unit-card screens); S-30 is done. Still unmodelled: the strike-two-squads proc and the report's own
headline damage figure.

### 3.6 Priority search
Objective ∈ {avgDamage, minDamage (best worst case), damagePerSilver, damagePerGold, damagePerDragonCoin}.
Every search result carries the all-types baseline (same request, nothing dropped) so the UI shows the trade-off:
friendly hits, minimum, maximum, expected damage and recovery costs with signed deltas. Why this matters: the
monster always kills the largest stack, so a low-tier type that must die first has to be as large (in HP) as the
high-tier stacks while giving 3× less HP per housing point; `avgDamage` therefore tends to keep only the top tier
(few, huge stacks, one free first hit), which raises the average but lowers the worst case and costs far more
silver. `damagePerSilver` and `minDamage` keep the full ladder in the cases measured (§7, 2026-09-12). Search space = which unit
types to include (tiers/categories within the unlocked range, mercenaries, monsters) for a fixed method.
Strategy: greedy backward elimination with restarts (drop the unit type whose removal improves the objective
most, repeat), then local swaps; time-boxed in a Web Worker with progress and cancel. Full enumeration only
when the pool is small (≤ 12 types). "Total Optimization" (relaxing preservation when it improves damage)
is a separate investigation story (S-31).

### 3.7 Best captains for a march (S-48, written up, delayed)

Captains carry bonuses keyed to one unit family or category (`captains.json`: a health key and a strength key,
per-level and per-star values), so the best march can change with the captains sent: a mounted-strength captain
may make a mounted-heavy tier-3 march beat the default. A march carries **0 to 3 captain slots** (hero only,
one captain, or several — the player sets the slot count per battle setup, `captainSlots: 0 | 1 | 2 | 3`).

Search: candidates are the profile's captain entries (each with its level and stars). For k slots, evaluate
captain sets of size ≤ k: build the bonus totals with that set active (everything else as configured), run
the stacking for the chosen method, score with the setup's objective. Exhaustive while the number of sets is
≤ 600 (e.g. 12 captains choose 3 = 220), otherwise greedy per slot with pairwise swap improvement — the same
shape as the unit-type search, and combinable with it (best captains × best types). Output: the best set,
its march, and the delta against the current captains; one action applies it to the setup ("Use these
captains", which toggles the captain sources). Runs in the worker with progress and cancel; reports when the
current captains are already best. Prerequisite: none in the engine (bonus aggregation and search are pure);
UI: a slot count on the Battle card and a "Best captains" action in the March card.

## 4. UI flow (one page, sections in this order)
1. **Profile bar**: active profile switcher, New / Duplicate / Rename / Delete, Export, Import, Share link,
   "unsaved changes" indicator. Theme toggle.
2. **Troops**: four rows (Guardsmen, Specialists, Engineers, Monsters) with min/max tier steppers and, for the
   top tier, category chips to exclude not-yet-upgraded types. The block describes **technology** only — what
   the account has unlocked — so it is the tier ranges, the top-tier category chips (`topTierExcluded`) and, for
   monsters, whose tier holds four unrelated types no category tells apart, the top-tier unit ids
   (`troops.excludedUnitIds`). What one march leaves out is not here: it is `BattleSetup.excludedUnitIds`,
   written from the March card, so switching setup changes the army without touching a single unlocked tier.
3. **Mercenaries**: searchable picker with filters (tier, role, category, race), selected list with owned
   cap per mercenary, custom mercenary form.
4. **Stacking method**: Elite Preservation / M's Preservation / Custom kill order (+ Monsters Last toggle,
   Round to 10s, allocation percentages when relevant). Custom order editor = drag list.
5. **Bonuses** (By Source): Permanent, Captains (pick ≤3, level/star editor), Equipment (≤15), Artifacts (≤3),
   Other (VIP, Dragon, Hero, +25 pills, custom), Events; then the TOTAL cards (health, strength,
   special) with a breakdown drawer; then Temple level and training reduction/speed fields.
   Pill behaviour, same as TotalStack: clicking a pill toggles it on/off for this march (captains, artifacts,
   heroes, events, other), the small gear opens its editor. Permanent sources are always on and only have the gear.
   Battle setups (named selections of active sources + housing) saved inside the profile.
6. **Enemy**: Standard 4 / Double 8 / Custom.
7. **Housing + priority + Generate**: Leadership, Authority, Dominance, priority select, Generate button
   (sticky at the bottom on mobile).
8. **Results**: Battle Summary cards; result pills per pool with counts, sort/reset order, remove/restore,
   round-to-10s; pill popover with effective stats; manual +/- editing with live summary deltas and undo;
   Battle journal drawer; "Save stack" and "Share result" buttons. Desktop side panel with the compact list.

Mobile first (≥360px), keyboard accessible, light/dark themes. English only.

## 5. Milestones and backlog

Status on 2026-09-13, branch `development` (nothing merged to `main`). Every story of every milestone is
listed below with one pointer to the commit subject, plan section or investigation that closed it. Statuses:
**done**, **in progress**, **backlog** (planned, not started), **deferred** (not scheduled), **gated**
(blocked on something outside the repository).

### 5.1 Engine and application stories (M0–M5, M7, M8)

| Story | Status | Closed by / where it stands |
|---|---|---|
| S-01 Scaffold, lint/format, CI, Pages deploy | done | first implementation pass; the Tailwind half of the scaffold was retired again in M-09 |
| S-02 Game data package (`src/data/tables`, zod types, provenance) | done | first implementation pass |
| S-03 Config schema v1 + store + migrations | done | first implementation pass |
| S-04 Share codec + JSON export/import | done | ADR-0005 |
| S-05 TotalStack data-drift check | done in its manual form | `pnpm data:compare` over a downloaded bundle (`tools/totalstack-sync`); the automated, scheduled form is gated by S-07 |
| S-06 Contributor-friendly data layout | done | ADR-0007, `docs/data/README.md`, `CONTRIBUTING.md`, `pnpm data:check` in CI |
| S-07 Decision: may we fetch TotalStack's bundle automatically? | backlog | ADR-0001 still Proposed; no terms of service found, question not put to them yet |
| S-10 Profile bar (CRUD, export/import, share, load-from-URL) | done | actions now live in the account menu (D-10); `e5b81aa` |
| S-11 Troops section | done | rebuilt twice since (D-22, M-04) |
| S-12 Mercenaries section | done | rebuilt as pills + tier combobox (D-23, M-05) |
| S-13 Stacking method section | done | folded into the Battle card (D-31, M-07); the legacy section is deleted |
| S-14 Bonus sources, TOTAL cards, breakdown, custom source | done | rebuilt as chips and rows (D-30, M-06) |
| S-15 Captains, Equipment, Artifacts editors | done | captain chips with the level popover (D-34, M-06) |
| S-16 Other (VIP, Dragon, Hero, pills) and Events editors | done | `ebce3e4` |
| S-17 Temple/training, enemy, housing, priority, Generate, help text | done | housing and enemy now in the Battle card (M-07) |
| S-18 Battle setups inside a profile | done | setup bar in the Bonuses card |
| S-19 Cross-device hand-off (profile/battle links, QR, Web Share) | done | investigation 0001; the QR / Web Share hand-off is retired by S-49b, share links stay |
| S-20 Bonus aggregation + effective HP/strength | done | validated against review §3 and every fixture |
| S-21 Kill order builders | done | EP, MP, Monsters Last, custom |
| S-22 Stack sizing (flat profile, exact fill) | done | `tests/engine/stacker.test.ts` reproduces the fixture |
| S-23 Round-to-10s mode | done | monsters exact; the troop solve is still up to 6 units off TotalStack |
| S-24 Results UI | done | replaced by the March card (D-40…D-43, M-08) |
| S-25 Engine in a Web Worker | done | cancel/progress with a main-thread fallback |
| S-30 In-game validation of the battle model | done | four reports; attack order = base damage descending (the Rider I nuance closed), revive silver and revive time solved, HP rounded per stack not per unit (`docs/research/fixtures/ingame-2026-09-13/`) |
| S-31 Investigation: what Total Optimization trades | done | investigation 0003; shipped as the relaxed-preservation toggle |
| S-32 Damage model (min/avg/max, double damage, strength-against) | done | every captured journal reproduced entry for entry |
| S-33 Recovery model (retrain/revive/selective) | done | chunk-of-ten rule; all seven runs reproduced |
| S-34 Battle Summary cards + journal | done | now the folded battle story in the March card (D-43) |
| S-40 Priority search: average damage | done | worker, progress, cancel, time box |
| S-41 Priority search: damage per silver / gold / dragon coin | done | with the all-types baseline and the honest-objective note (rule 29) |
| S-43 Compare saved stacks | done | saved marches at the foot of the March card |
| S-44 Sync adapter interface + explicit Pull/Push | retired | investigation 0001; the per-profile RemoteStore contract went with S-45 (ADR-0009) |
| S-45 GitHub Gist sync adapter | retired | removed by S-49b: `src/sync/**` and `src/ui/sync/**` deleted, `docs/sync.md` rewritten (ADR-0009) |
| S-46 Google Drive appData adapter | retired | superseded by the S-49 account (2026-09-13, owner): the account covers cross-device sync and its Google sign-in uses only the Pages origin, so the verification gate never applies |
| S-47 Generic endpoint adapter + reference Worker | retired | superseded by the S-49 account (2026-09-13, owner); a no-server option can return as a new story if ever wanted |
| S-48 Best captains for a march | deferred | written up in §3.7; delayed by the owner (rule 33: engine stories wait until the UI is right) |
| S-50 PWA / offline / install prompt | done | hand-written service worker, no PWA dependency |
| S-52 Accessibility and mobile layout pass | done | axe zero on the kit page and the app in both schemes; `pnpm contrast` over 176 pairs |
| S-49a Account sync backend | in progress | groundwork done and verified: `ops/pocketbase/` (PocketBase 0.40.4 compose, Caddy site, save hook, `profiles` migration, smoke script), every spec `[verify]` answered in investigation 0012, hosting in investigation 0010. **Deployment is pending the owner** (Dynu hostname, the two-line philou change, the Google OAuth client, the backup target) |
| S-49b Account sync client | done | `src/account/**`, `src/ui/account/**`, ADR-0009, `/oauth-callback` + `404.html` copy, SW NetworkOnly for the backend, `storage.persist()`; e2e `e2e/account.spec.ts` against a local 0.40.4 container. Hidden until the owner sets `VITE_BACKEND_ORIGIN` |
| S-53 Left-out troops without pins | done | schema v3 drops `BattleSetup.pinnedUnitIds` and `excludedUnitIds`, the sizer and the search lose their pinned paths, and the March keeps `includedUnitIds` with the result (§3.4 rewritten); owner's story of 2026-09-13 below the table |
| S-54 Complete optimization | done, superseded | `src/engine/campaign.ts` (`simulateCampaign`, `searchComplete`, 22 tests); the fourth method on the Battle card with *Marches planned* / *Silver budget*, the `complete` worker job, and the March's sizing line + folded Campaign section (`ui/sections/march/campaign.ts`, `CampaignPanel.tsx`); investigation 0014 §5. **Removed by S-56 (2026-09-15)**: the method, its two fields and both panels are gone, and schema v4 reads a stored `complete` as `plan` |
| S-56 Remove Complete optimization v1 | done | owner's review 2026-09-15: two methods were answering one question at two resolutions, so `complete` leaves the Battle card and the plan method (S-55, `src/engine/plan.ts`) keeps the name **Complete optimization**; `METHODS` is four ids, schema v4 maps a stored `complete` to `plan` and drops `setup.campaign`, `ui/sections/march/campaign.ts` and `CampaignPanel.tsx` are deleted, `src/engine/campaign.ts` stays as the instrument experiments 22 / 23 / 48 are measured with, and the horizon moved into `src/config.ts` (§5.1) |
| S-60 Bonus recap: every key, always visible | backlog | hero assessment 2026-09-13: the engine applies the hero (Svyatogor +50/+50 army) and the TOTAL figures move, but our only per-key view is the breakdown fold, two folds deep, hiding keys at 0; TotalStack's recap lists all 9 + 9 keys and the three specials. Promote that block to the head of the Sources fold, every key listed including 0 % (rules 1, 4, 5, 7) |
| S-58 The plan's holes, and what full optimization means | done | owner, 2026-09-15. **Two flagged candidate fixes** for "the plan drops a whole hired type", both **off**: `tokenFloor` (the grid's thrift end samples one chunk of every hired type instead of none — `CAMPAIGN.planFixes`, `engine/plan.ts`) and `refuseDroppedTypes` (the frontier band refuses to offer a plan with a hole, counting them in `leftOut`). Measured against each other in experiments 80 and 81 on the owner's account: both remove every hole on the frontier, **B leaves the winner and the frontier's best identical** (`leftOut` 14 → 17) while **A shifts the recommendation by 0.87 %** because replacing the zero changes where the refinement lands. Three new unit tests pin the flags and their off-by-default. **And the horizon off-by-one is fixed**: a target of 1 played 2 marches (`max(1, planned − 1)` clamped a repeat up); a one-march campaign now scores no finale at all and plays exactly 1. **Investigation 0019** states the full-optimization definition and verifies each clause with data (77–83) |
| S-57 The March's second half, and a locked Objective | done | owner, 2026-09-15, two changes in one pass. **The March's explaining half left the pane** — the objectives comparison, the battle story and the HP profile, the saved marches and the whole-march actions are now one panel, **"This march in full"** (`#march-foot`, `ui/sections/march/MarchFoot.tsx`), at the foot of the setup column from 1200 px, and the March sheet below that (`MarchSection.tsx`; `editingCounts` moved into `runStore` because the switch and the pills are now on opposite sides of the page). It is a **partial win**, measured with `paneFrame()` on a real march (leadership 84 300): the pane is 655 px with a warning and 553 px without, so it **sticks at 1400×900** (768 px of room; new test in `e2e/generate.spec.ts`) and **still flows at 1280×720** (560) and at 1280×800 with a warning (640). **The Objective is locked** while **Complete optimization** is chosen (`OBJECTIVE_LOCKED_REASON`, `shell/command.ts`), a deliberate exception to §7.4's hidden-not-disabled and to rule 15, which costs the pane about **28 px** of room at every method (`--pyr-commandbar-height` 5.75rem → 7.5rem, the bar's tallest state) |
| S-59 The plan's screen: named rows, a tip that follows the pointer, a trade with a shape | done | owner's review 2026-09-16, investigation 0020, detail below. The bar carries up to four named picks — **Best for silver · Spare the stock · Sweet spot · Most damage** — each defined over the plans inside the band on the repeated march's own figures, cheapest first, and a name already taken is not handed to the runner-up (three rows on the owner's account, where the sweet spot is itself the best for silver) (`PlanPick`, `pick` on every carried row, `src/engine/plan.ts`; `tests/engine/plan.test.ts`); the tip follows the pointer and lights that plan's row (`PlanPanel.tsx`, `PlanPanel.test.tsx`); the trade gains a damage bar a row, glyph column heads and compact figures and `docs/design.md` §8's ornament rule is amended for it; the prose is cut to one analysis line with the general why behind a glyph (`docs/design.md` §7); the sweet spot is the **middle of the trade in hired stock** (D-6, added the same day after the owner looked at the built bar: the old ratio-balance rule walked to the silver end and burned as much stock as the dearest plan on the bar — 21 against 12 and 22, `tools/theorycraft/out/90-the-sweet-spot.md`), and the plan block arrives **open** and stays collapsible **under the army** — it is a control, so the army you change comes first (owner, same day: *"we should first see the army then the details to change them afterwards"*) — measured at 1400×900 with `paneFrame()`: **740 px of March against 740 px of room** folded, **998 px open**. Experiment `tools/theorycraft/86-slider-stops.test.ts` regenerated, 87 deleted; `e2e/journeys.spec.ts` J6 and `e2e/generate.spec.ts` updated |
| S-66 The shelter margin, the rung order, and the vectors a sizer settles on | done | owner, 2026-09-18: *"the troops' health stacks are way higher than the mercs, above the 2–3 % for safety. Is that really useful in terms of damage?"* Measured on his latest export (rev 223, 10 000 leadership; `tools/theorycraft/out/97-shelter-margin.md`): the enemy wipes our highest-HP living stack whole, so a stack's HP is only its place in the kill order and its **count is its strike** — every troop stack in the sweet spot strikes for 276–332 k a march; scaling the troops down together loses damage about as fast as it saves silver (90 %: −4.4 % damage, −10.1 % silver), and once a troop stack falls under the biggest hired stack the mercenaries die early and damage collapses (70 %: −36.5 %). The margin is not safety; it is the troops' own damage. Two search gaps found on the way and closed: **(1)** the ladders were never scored on the mercenary counts a sizer shape settles on (the grid never holds them) — every such vector is scored with the ladders too; **(2)** the ladder's rung assignment — the weakest type per HP on the biggest rung — measured wrong: of all 5 040 assignments (`out/98-rung-order.md`) the best hit for **5 426 465** against the rule's 5 143 988 for the same silver and mercenaries, the same order won for every feasible vector on the account, and a swap climb reaches it in 84 battles; `makeScorer` learns the order once a depth by that climb, from the first ladder the leadership can pay for. Measured, the app's bar on his latest export: 8 burned **5 426 465** (was 5 143 988) at the sweet spot, 13 burned 6 245 103 (was 12 / 5 986 678) at the top, all ladders. On the 2026-09-17 export at 7 000 the sweet spot went 4 948 511 → 5 330 563 (+7.7 %, 2 % less a hired unit) and the thrift end 7 → 8 burned (the 7-burn plan is dominated on the campaign: same silver, same 35 burned over four marches, 10 % less damage); the criteria floors were re-based with that note. The synthetic frozen plan moved by 2 250 damage in its finale. |
| S-75 Every hired type kept, every hired stack under the troops, and unlimited mercenaries bounded | done | owner, 2026-09-18: *"mercs still are being left out, which I find odd. I prefer to have multiple stacks of mercs, it seems to work best. And when a merc is unlimited and is put in, don't put more, and lower it so the health stack still makes sense (below the troops)."* Three changes. **S-58 B is on**: the band refuses any plan that fields none of a hired type the account holds — no stop drops a type on any export now. **Every sizer-shaped march is sheltered**: after the sizer runs, a hired stack whose HP stands at or above the lowest troop stack is lowered to just under it (or left out of that shape) — the enemy wipes the highest-HP living stack first, so a hired stack above a troop stack died before the troops did; the ladders shelter by construction, the all-in by its own test. **A mercenary hired as unlimited** (no cap) used to read as a stock of nothing and was never fielded; it is bounded by the authority pool, its stock never runs out (`sustain`), and the shelter keeps it under the troops — and the search's winner must stand on more than one troop stack, because with an unlimited type the single-stack march sheltering 820 hunters was the winner and emptied the band. Measured: live account with the hunters unlimited, 11 000 leadership — sweet spot 40 hunters, steady max 62 under five troop types, all sheltered; the 2026-09-17 export at 7 000 pays the shelter with 6 % of damage (steady max 6 242 452 → 5 864 482, the unsheltered MS-relaxed march gone) and loses its silver saver (the cheaper marches left of the sweet spot dropped a type); the benchmark floor there is 89.6 % of the sizer sequences, which shelter nothing — and the pinned gap flipped: the sweet spot is no longer beaten on both ratios by any sizer sequence on any case. |
| S-76 The horizon is a ceiling, not a requirement | done | owner, 2026-09-18: *"no more magic static numbers"*, after experiment 101 found that one or two units of a hired type made the plan refuse outright (a four-march horizon needed three) with the refusal worded "fill in your mercenaries". A vector is repeated `min(targetRepeats, what the stock sustains)` times, the finale plays on what is left (none left → no finale), `PlanTotals.marches` is what was played. A stock the horizon outruns shortens the campaign **only when every stocked type is outrun** (the first-run bear case: 1 bear → 1 march 4 722 842; 2 bears → 2 marches 9 557 884); otherwise the outrun type leaves the repeated march and is spent whole in the finale, and S-58 B judges the campaign (repeat + finale, or the all-in's marches). Measured on the export at 7 000 with the chariots cut to 2: the first cut halved every stop (9.7 M over 2 marches); with the finale rule every stop plays 4 (sweet 17 221 858, steady 18 286 849; 20 chariots 21 662 734 / 23 264 491). Benchmark 01 (`out/benchmark-2026-09-18-01-horizon-ceiling`): only the two bear scenarios moved. Built by an Opus worker, validated by a second. |
| S-77 The shelter clamp only for unlimited types, and a sweet-spot tie broken on the campaign's ratios | done | Proposal 1 of the 2026-09-18 assessment. S-75's clamp lowered any hired stack standing at or above the lowest troop stack; the owner had asked for it only for a mercenary hired as unlimited, and on a capped type it forbade the *sponge* — the top stack is the enemy's first kill and strikes at most once, and every stack dies with the same tenth lost wherever it stands, so the journal already prices a hired stack on top (experiment 101 §A: 34 legionaries on top, 6 242 452 against 5 864 482 a march for one more legionary and 48 gold). The clamp now fires for `unlimited` types alone; ladders shelter by construction, the all-in keeps its own test. With the sponge march back on top the 7 000 ladder had no knee and the middle-of-range fallback tied rungs 10 and 11 at 10.5, thrift took 10, which rung 11 dominated on the campaign's own ratios (20 684 777 / 1.9548 / 376 087 against 22 045 361 / 2.0119 / 393 667): the tie now goes to the rung the other does not dominate on the campaign's damage a silver and a hired. Measured at 7 000: steady max 23 264 491 → 24 814 601 over four marches, sweet spot rung 11 (22 045 361), four stops (no march left of the 11 is as efficient a silver); ten bears +2.8 %; every other scenario byte-identical. Benchmark 02 `out/benchmark-2026-09-18-02-shelter-unlimited-only`. Where capped mercenaries now stand on top: the 7 000 steady max (legionaries 34 = 372 096 HP over a 361 200 floor) and the ten-bear sweet spot (8 bears = 528 000 over 449 280); the HP profile shows it. Built by an Opus worker in two rounds, validated by a second agent. |
| S-78 The all-in offered on hired fielded, and a finer sweep | done | Proposal 2 of the 2026-09-18 assessment, narrowed after validation. The first build keyed the whole bar on hired units *fielded*; measured, that understated the game's cost at the low end (each type's first units cost a whole chunk), pulled the sweet spot toward fewer mercenaries on four accounts (12 000: 32 231 242 → 29 660 413 a campaign), made the shown burn non-monotone and, with a coarser sweep, lost the live account its silver saver — so the bar stays on **burn**, the game's number. What survives: the all-in is offered when its first march *fields* more hired units than the steady max's repeat (a ten-bear account burns one chunk whatever it fields, so the old burn gate hid its 10·9·8·7), and the post-climb sweep scores, beside each chunk-rounded vector it always scored, the per-unit vector at the same level (verified byte-identical levels and vectors to before on six armies, plus the new ones). Measured (benchmark 03 `out/benchmark-2026-09-18-03-stops-on-fielded`): three bears gain an all-in 3·2·1 (14 505 126 for 24 394 200 silver, 57 % of TotalStack's 25 439 016 — its answer spends 56 000 000 silver; like for like our all-in plus a troops-only fourth march would reach 98.6 %); ten bears gain the all-in 10·9·8·7 shown as the poor deal it is (45 577 400 silver for 21 700 948); the evening account's sweet spot 26 023 854 → 28 367 940 and more-mercs 27 096 537 → 29 265 102 from the finer vectors; at 7 000 the thrift rung improved (1.9175 → 1.9715 a silver), the silver saver is back (five stops) and the chord's knee moved from 11 to 10 burned (22 045 361 / 1.946 / 484 597 → 20 924 965 / 1.806 / 494 851 — neither dominates the other); search +5–8 %. Built by an Opus worker in three rounds, validated three times. |
| S-79 Time to recover on the recap and the plan's stops | done | owner, 2026-09-18: *"generation sometimes skips low-level stacks and misses some damage that seems cheap … troops of higher tier are longer to train; adding training time on the battle summary is the first step"*. The engine already priced a march's recovery time (`recoveryCosts`, Spearman I 15 s a unit, Archer II 180, Archer III 420, Rider III 840) but only the saved-marches table and the unit sheet showed it. Now: `PlanMarch`/`PlanRepeat`/`PlanTotals.seconds` (Σ retrain seconds of the troop rungs under the account's own training speed, mercenaries revive for gold and add nothing; campaign = repeats × march + finale, sequences summed), computed beside the priced silver so it equals the recap's `recovery.seconds` to the second (tested per stop and per sequence march); the recap's fifth figure **Time to recover** (⏳, lower is better) between gold and damage a silver; the stop table's silver cell carries the queue as a second line and every row's accessible name says it; the plan fold's sentences say the training each march and over the campaign. No seventh column (the table's own width note) and nothing in the bar's tip (rule 5). The saved-marches column labels now use the recap's words (one name a thing). Known, pre-existing: the plan always prices troops retrained and hired revived, so under the Battle card's *Revive* mode the recap's figures (silver and now time) diverge from the plan's. Built by an Opus worker, validated. |
| S-80 The put-back pass — lower tiers reconsidered inside the bar's proposals | done | owner, 2026-09-18: *"add a pass to consider again lower level troops if the cost for them (silver, silver/damage, total damage) is not too high and we get a nice reduction in training time … integrated in the plan slider proposals so it's transparent to the user"*; his rates (*"2 % damage is okay if there's a reduction in time and a bit of silver; 3 % for a lot of silver and training time"*), calibrated on experiment 103: **score = silver saved %/5 + time to recover saved %/10 + damage change %, taken at ≥ 0 with the damage loss capped at 3 %** (`CAMPAIGN.putBack`, a documented policy). The pass runs on the burn ladder's rows before the stops are chosen and once more on the silver saver and the all-in: a row's march re-sized by the MS sizer over its troop types plus one left-out type, same mercenaries, priced as the recap prices it; the best positive candidate replaces the row. Three guards, none a new number: a put-back must strictly save time to recover (a probe army bought +109 % damage with +182 % silver and a longer queue, refused); the silver saver must still satisfy its own rule after the pass, else its put-back is dropped; and the bar stays monotone — a row whose damage would fall under the stop to its left gets its generated march back (12 000: the steady max's Spearman I, score 1.15, would have left it 1.5 % under the sweet spot). `PlanRow.putBack` records the unit and the three percents; the Details fold says it in one sentence; nothing on the bar. Measured: live army, Aydae alone at 4 975 — the steady max takes Archer I, 4 777 523 / 2 694 300 / 13d 7h → 4 904 479 / 2 203 500 / 8d 4h (+2.7 % damage, −18 % silver, −38 % to recover, score 10.1); three heroes — the steady max takes Spearman II (+10.7 % damage), the sweet spot keeps its march (score −0.4); benchmark 04 (`out/benchmark-2026-09-19-04-put-back`): only two all-ins moved (hunters ×83 seed 28 219 651 → 28 781 642, the 4 000 case 8 154 596 → 8 394 732); search time unchanged within noise. Built by an Opus worker in three rounds, validated. |
| S-81 The all-in plays the horizon: troops alone once the stock is spent | done | owner, 2026-09-19: *"continue for the measured additions, keep benchmarking between each step"*. The all-in halted when its hired stock was gone (three bears: 3·2·1 over three marches, 14 505 126 for 24 394 200 silver) while a player marches the remaining days on troops. Now the marches left to the horizon are one Elite sizer march over every troop type with no mercenaries, priced as the recap prices it, appended to the sequence: three bears play 3·2·1 then troops alone — 19 115 768 for 32 525 600, 98.6 % of TotalStack's answer at equal silver (19 388 676), 75 % of its 56 000 000-silver best. The offer rule, the S-76 ceiling for repeated stops, the sustain check, S-58 B and the winner rule are untouched; the campaign's damage a hired rises with the tail (4 835 042 → 6 371 923) since the same three bears bought it. Nothing else on the benchmark moved (ten bears already fill four marches). The plan fold says "the last on troops alone". Measured but not built: the same tail on the *repeated* stops at one or two bears would take the sweet spot from 4 722 842 / 9 557 884 to 18 554 768 / 18 779 168 and close the whole gap to the sizers — at the price of crediting a stop with damage no mercenary bought; the owner's call. Built by an Opus worker, validated. |
| S-87 Every hired stack under the troops, on every shape the plan offers | done | owner, 2026-09-18: *"a critical rule is to shield mercs. Right now mercs are unshielded on all complete optimization marches … more damage with a lot of merc spent should trigger a failing test as we're using too much of a rare resource"*. S-75 sheltered every hired stack; S-77 narrowed that to the **unlimited** types on the sponge argument (the journal prices a stack on top, and the burn is `ceil(n/10)` wherever it stands) — and on his live camp that evening **every stop** fielded hired stacks above the troops: the sweet spot stood 375 legionaries (4 296 375 HP) and 403 arbalesters (3 675 360) over a 274 772-HP troop floor, the steady max 830 · 400 · 10 bears (experiment 106). A capped type is as rare as an unlimited one once it is gone, so the rule is restored for **every** hired type, at one helper (`shelterUnder`) read from every place a shape is built: the scorer's choke point — which covers the ladders, the sizer's shapes and the **winner's rungs**, the shape that carries one march's troops under another march's mercenaries and was never checked at all — the finale's own ladder, the sizer, and the put-back pass (MS matches HP, so its hired stacks land *at* the troop line); the all-in's own test stays as a read-back. S-77's other half is untouched (the sweet-spot tie broken on the campaign's ratios). A hired stack at or above the lowest troop stack is lowered to `ceil(floor/hp) − 1`, or left out of that shape. Instrumented over the ten benchmark armies, the clamp fires only where S-77 had dropped it — the sizer's shapes and the winner's rungs — and never on a ladder, a ladder finale or a put-back, so those three are guards rather than changes. Measured: the live camp is five stops with **zero** exposed stacks (silver saver 2 419 933 · sweet spot 3 060 838 · more mercs 3 193 268 · steady max 3 458 128 · all-in 4 569 485 a march, every hired stack under a 1 035 100-HP floor) against 9 158 459 / 11 972 385 unsheltered — and the sweet spot moves shape, Elite to MS, from 1 942 700 to 2 707 500 silver a march (+39 %, damage a silver 4.71 → 1.13), because clamping guts the thin-floor shapes and a tall-floor one wins the knee: the price of the shelter, and the owner's choice; his export at 7 000 goes back to S-75's own four stops to the unit (sweet spot 5 330 563 a march at 1.9459 a silver / 484 597 a hired, campaign 21 662 734; steady max 5 864 482 at 2.1408; plan 24 814 601 → **23 264 491**, 95.6 % → 89.6 % of the best sizer sequence, and the silver saver goes since nothing left of the 11-burn rung is as efficient a silver); ten bears lower the Elite sizer's 8 bears (528 000 HP over 449 280) to 6, sweet spot 21 732 276 → 21 135 368, the all-in untouched at 21 700 948 and now that army's hardest campaign. The other **eight** benchmark scenarios are byte-identical, including both live accounts and 12 000. The search got faster with it — 7 113 → 1 429 ms at 7 000, 3 327 → 630 ms on the 4 000 case — because sheltered vectors collapse onto the same counts from many directions. Held by a criterion in `tests/engine/plan-criteria.test.ts` over **every** scenario the benchmark builds (shared now as `tests/engine/plan-scenarios.ts`) plus the live camp, on every march of every stop — the repeat, the finale and each march of an all-in's sequence — which fails on HEAD on three armies — 30 exposed stacks: 18 on the live camp, 8 on the export at 7 000, 4 on ten bears; beside it the owner's *"too much of a rare resource"* in its measurable form: no stop burns more than the hired units its troops shelter, and the sweet spot never gets less out of a hired unit than the steady max (measured 7.4 % to 26.4 % more on the seven armies that offer both). Benchmark 06 `out/benchmark-2026-09-18-06-shelter-all-types`, stage table updated. Built by an Opus worker, for validation by a second. |

**S-53 — Left-out troops without pins (owner, 2026-09-13 evening; clarified the same night).** The current
model (§3.4) keeps two lists on the setup, `excludedUnitIds` and `pinnedUnitIds`, and the owner finds the pins
a bad experience: when Generate leaves a type out and he puts it back, it comes back *pinned*, and nothing on
screen lets him reset the pins short of removing the types one by one. A "reset pins" control would add one
more thing to the interface; the owner chose to drop pins altogether.

Target flow, in the owner's words: *"Select the army with the Troops and Mercenaries forms, pick the method
and the objective, Generate. Then tweak by adding and removing types in the March, without generating again."*

- **The left half of the page (Troops, Mercenaries, Bonuses, Battle) never generates by itself.** Changing
  anything there marks the march on screen as stale and the player is told to Generate — as today. Nothing
  recomputes behind their back.
- **Generate is a fresh solve.** It runs the sizer or the priority search on the whole army the forms
  describe, reports the types the solver leaves out, and **resets the March's own edits** (the left-out
  list). Nothing is remembered from the previous answer.
- **The right half (the March) recomputes in place.** Taking a type out or putting one back re-sizes the
  remaining types straight away, without a Generate. A put-back type is simply *in* — sized like any other —
  never kept for good. The answer on screen is then the player's tweak of the solver's march, and it stays
  until the next Generate or until a left-half change makes it stale.
- **The left-out list is run state, not setup state** (owner: "the left-out list only appears on the right
  part right now and it is the good call"). It lives with the result (`runStore`), is cleared by Generate,
  and is not persisted, shared or synced.
- **Pins go entirely.** Schema v3 drops `BattleSetup.pinnedUnitIds` and `BattleSetup.excludedUnitIds`
  (migration discards both; `troops.excludedUnitIds` — technology — stays); with them the sizer's pinned
  path (`sizePoolPinned`, `pinnedMinimum`), the search's pinned space, `StackRequest.pinned`, the pin
  actions of `formation.ts` (`keepInMarch`, `stopKeeping`), the pin badge and the "keep" wording in the
  March, the share codec fields, and their tests. §3.4's "Pinned and left-out unit types" paragraph is
  rewritten to this model when the story lands.

**S-54 — Complete optimization (owner, 2026-09-13 evening; investigation 0014 §5; removed by S-56).** A
fourth stacking method. It answers the owner's "optimise everything, mercenaries and order included, and
tell me whether spending fewer mercenaries per march buys more damage over several marches":

- **Engine** (`src/engine/campaign.ts`): `searchComplete` runs the priority search under every sizing
  (Troops first, Hired last, Hired last with damage trades) and every mercenary spend level (100 / 75 / 50 /
  25 % of the owned stock per march), then scores each candidate on a **campaign** of N marches simulated
  march by march with the game's 90 % revival (the stock loses one unit per chunk of ten fielded, every
  march is re-sized to the stock left, troops are retrained each time); an optional silver budget stops the
  campaign early. The objective applies to the campaign totals (total expected damage, total worst case,
  total damage over total silver / gold / dragon coins).
- **Battle card**: "Complete optimization" as a whole-card choice beside the three methods (rule 8), with two
  fields under it: *Marches planned* (default 10) and *Silver budget* (empty = unlimited; shown for every
  objective, since the owner reads "damage per silver" as "my silver is limited").
- **March pane**: the winning march as today, plus a line naming the sizing it chose ("Sized as Troops
  first, with damage trades. Every mercenary you own marches each time.") and, folded (rule 4), a
  *Campaign* section: the campaign's figures, one row per march (mercenaries fielded, damage, silver so
  far) and the plans compared — every sizing at full strength plus the best of each smaller share, the
  winner marked. Numbers through `Figures`, separations through `Sections`. It **replaces** the objectives
  comparison for this method: five more searches over one battle explain nothing that twelve plans over ten
  marches have not already said.
- Not in scope: a different march per campaign step, valuing leftover mercenaries, monsters' dragon coins
  beyond what `recovery.ts` already prices.

**S-56 — Remove Complete optimization v1 (owner, 2026-09-15).** The owner reviewed the five stacking methods
and had `complete` taken off the Battle card. The reason is resolution, not a defect: the plan method
(S-55, `src/engine/plan.ts`) answers the same question — how many marches, how big each one, and how much of
the hired stock each carries — at the resolution the March can show, a horizon, a frontier of plans and a
march-by-march trade, where `complete` answered it with a score per sizing × spend level and one Campaign
panel. Two methods answering one question at two resolutions is a choice the player should not have to make,
so the older one goes and the surviving method keeps the name **Complete optimization**: the "v2" went with
the removal (investigation 0018 §6 had already flagged the suffix as reading like a version number to a
player).

- **Method**: `METHODS` is `['elite', 'ms', 'custom', 'plan']` (`src/state/schema.ts`). The Battle card
  offers four methods, and `complete`'s two fields (*Marches planned*, *Silver budget*) leave with it —
  the plan method's card is the method and nothing else, which is also why its option rules were already
  empty.
- **Schema v4** (`3 → 4`, `dropCompleteMethod` in `src/state/migrations.ts`; `SCHEMA_VERSION = 4`): a stored
  `complete` becomes `plan`, and `setup.campaign` is dropped from a profile's setups and from a saved
  stack's setup. Nothing else moves — the field is read nowhere once the card stops asking for it.
- **UI**: `ui/sections/march/campaign.ts`, its test and `CampaignPanel.tsx` are deleted, `MarchSection` no
  longer draws `CampaignSizing` or `CampaignFold`, and `runStore` loses its `campaign` field. What stays is
  the plan pane (`PlanPanel.tsx`): the sizing line under the figures and the folded **Plan** section.
- **Engine**: `src/engine/campaign.ts` is kept deliberately (`simulateCampaign`, `searchComplete`, 22 tests
  of its own). It is no longer reachable from the app and is a theorycraft instrument now: experiments 22,
  23 and 48 measure campaigns with it, importing the module directly (`tools/theorycraft/`). The public
  engine surface (`src/engine/index.ts`) keeps its exports; nothing on the app's path uses them.
- **Policy**: the horizon and the silver left the card, so `src/config.ts` is the only place either is set:
  `CAMPAIGN.marches` (10, read by `derive.ts` as `marchTarget`), `CAMPAIGN.planAlternatives` (4) and
  `budgets.search` / `budgets.plan`. `maxMarches` and `budgets.complete` go with the method. The silver is
  no longer an input at all — the plan sweeps its own frontier and names the sweet spot — and the engine's
  optional `silverBudget` survives for the experiments.
- **Left open** (found on the way, not fixed): `plan.ts:79` declares `objective?: Objective` and never reads
  it, so the command bar's Objective select is live on the plan method and has no effect; and `plan.ts`'s
  header comment is still stale about `simulateBattle` (`plan.ts:22-23`).

**S-58 — What "full optimization" means, and the plan's holes (owner, 2026-09-15).** The day's second thread started with *"I still see some mercs not used when generating marches with complete opt"* and ended as a definition. Experiments 78–83, investigation 0019.

- **The defect, measured.** The frontier offered one plan in five that fielded **no legionaries at all**, and putting a single one back paid +22,230 damage while lasting 72 marches. The `0` sample in the mercenary grid is a degenerate point on the thrift axis, not a trade anyone would take. Both fixes are in behind `CAMPAIGN.planFixes`, **off**, with an experiment each (80, 81) and three unit tests; the comparison is above.
- **The horizon off-by-one.** A target of 1 played 2 marches. `makeScorer` gained a `finale` flag, the planner turns it off for a one-march target, and `tests/engine/plan.test.ts` asserts the target is the campaign's own length at 1, 2, 3 and 10.
- **The horizon's default is 4** (was 10). The owner's cadence is an epic event every three days, three or
  four marches each, and four is the best of both: measured on his account, horizon 3 burns 24 mercenaries a
  march for 5,983,998 damage, horizon **4 burns 21 for 6,826,445** — fewer mercenaries *and* 14 % more damage,
  the peak of all ten horizons — while 10 gave up a third of that damage for endurance the cadence never uses
  (`out/85-horizon-merc-cost.md`). Three still keeps the better *silver* rate (3.63 against 3.02), so the
  choice is which resource to favour. `CAMPAIGN.marches` in `src/config.ts`, with the table in its comment.
- **Open, and deliberately not rushed: where the recommendation sits.** Measured in `out/84-marginal-silver.md`
  — the first ~6 M of silver returns a marginal 7.75 damage a silver and everything past it under 2.5, while
  the engine's recommendation sits at 17.08 M. `balanced` balances damage *a silver* against damage *a
  mercenary*, and that second ratio is the trap investigation 0019 §2.3 documents: balancing against it drags
  the pick toward the end that spends the most for the least. The fix is a definition that follows the resource
  which binds — which the app cannot know while the silver box is off the card (S-56) — so it is written down
  rather than half-done here.
- **The slider carries the frontier's own picks, not a sample of it** (owner, 2026-09-15: *"find a few 4-5
  common, good picks to have a slider control how much silver vs merc we want to spend, which was the whole
  point… the algorithm should figure out where are the best 3-5 spots and place us in the sweet spot by
  default"*). `CampaignPlan.alternatives` is the named picks — cheapest · best damage a silver · sweet spot
  (default) · knee · most damage · kindest to the stock — deduplicated by counts and sorted cheapest first,
  replacing the even sample of the band that carried eight stops mostly saying the same thing. Measured at the
  app's horizon: **four stops**, 140 hired for 446 K silver a march through the stock-sparing bend at 45 hired
  to the sweet spot at 205 — and three at a horizon of ten, where two of the rules land on one plan
  (`out/86-slider-stops.md`). The band now only decides whether the stock-sparing extreme is offered at all.
- **The definition.** Full optimization is *the marches, and the counts of each, that maximise the campaign's total damage subject to leadership and authority per march, the permanent `ceil(n/10)` loss of every hired stack fielded, and the player's silver* — a campaign objective, and a frontier rather than a point. Verified: the best single march takes **82.3 %** of the best campaign; under a capped purse the same engine buys **1.75×** more damage by maximising damage a silver than by maximising the total; damage a mercenary rises to 435,961 exactly where the march collapses to two hired units; the horizon swings a march by **434.6 %**; and authority is not binding at all (155 of 2,000).

**S-57 — The March's second half, and a locked Objective (owner, 2026-09-15).** Two changes that shipped
together; the first was asked for in the owner's own words — *"the right side tab bar could be stripped of
some detail that could be moved at the end of the left side so that the right side would always follow
scroll"* — and the second is the one defect S-56 had just left open.

- **The March is two halves now.** `ui/sections/march/MarchFoot.tsx` holds four blocks — `MarchObjectives`
  (the "Objectives compared" strip), `MarchDetailsFold` (the battle story and the HP profile),
  `MarchSavedFold` (the saved marches) and `MarchActions` (copy, edit, save, share) — and `MarchFoot` draws
  them as **one panel** titled **"This march in full"**, anchored `#march-foot` (`MARCH_FOOT_ANCHOR`,
  `shell/march.ts`). The panel has **two mutually exclusive hosts**: `Shell.tsx` draws it as the setup
  column's last panel from 1200 px up, and `MarchSection.tsx` draws the same four blocks itself below that,
  where the March is the phone's sheet — nothing is on one screen twice. What the pane keeps is the answer:
  the recap and `PlanSizing`, the pools and the pills, the left-out row, the notices, and the **Plan** fold,
  because the plan's own assessment *is* the answer. `editingCounts` moved out of `MarchSection`'s local
  state into `useRunStore` (reset in `start()`), since the switch and the pills it turns into fields are now
  on opposite sides of the page.
- **The Objective is locked under Complete optimization.** `planCampaign` declares `objective?: Objective`
  and never reads it, `buildPlanRequest` never sends one, and `generate.ts` returns the plan before it
  reaches the priority search — so the command bar's Objective did nothing for that method. `shell/command.ts`
  gains `OBJECTIVE_LOCKED_REASON` ("The plan weighs damage against what it costs, so it decides this
  itself.") and `objectiveLocked` (`setup?.options.method === 'plan'`); the desktop Select is `disabled` and
  points at the sentence with `aria-describedby`, the phone's chip keeps its name, does not open, and is
  labelled **"Objective: decided by the plan"**. Locking rather than hiding is a **deliberate exception** to
  §7.4's "hidden, not disabled" and to rule 15 — the objective is the bar's control rather than a rule of one
  method, so it keeps its place in the tab order's story and says why it cannot be used. The reason is a
  muted `.barNote` line **above** the fields, beside the existing `.barMessage`, and not a `description` under
  the field: measured the same day, a line under a field took the bar from 88 px to **119.7 px** and pushed
  Generate off the row.
- **Measured, both halves.** The desktop bar is **88 px** with nothing to say and **119.7 px** with one note
  line, so `--pyr-commandbar-height` (`ui/theme.ts`) went 5.75rem → **7.5rem** and the jsdom fallback in
  `shell/usePaneFits.ts` (now `usePaneStick.ts`) went 92 → **112** with it (`MarchPane.test.tsx` asserts `paneRoom()` is
  `innerHeight − 152`): the pane loses about **28 px** of room at every method, which is the price of the note
  line. The pane itself, measured with `paneFrame()` (`e2e/helpers.ts`) on a real march at leadership
  84 300: **771 px against 768 px** of room at 1400×900 before, and **655 px with one warning alert / 553 px
  without** after, against **740 / 640 / 560 px** at 1400×900 / 1280×800 / 1280×720. So the pane **sticks at
  1400×900** (`e2e/generate.spec.ts`'s new test) and **still flows at 1280×720** and at 1280×800 with a
  warning (the flowing test's comment was updated to say so, and that it is what the old `max-height` used to
  answer with a scrollbar). Partial, not solved: below 1200 px nothing changed at all.

**S-59 — The plan's screen: named rows, a tip that follows the pointer, a trade with a shape (owner,
2026-09-16).** The owner reviewed the screen the plan method draws; four of his five asks became decisions
the same day and the fifth — the wall of prose — was **moved, not deleted**, because the same reviewer had
asked for it one day earlier (`docs/investigations/0018-plan-horizon-and-the-fold.md:8`). Nothing here
is copied from TotalStack: their only observed screen is the method card, which has no plan list, no bar and
no trade table, so rule 26 governs throughout (`docs/investigations/0020-the-plan-screen.md`).

- **The four names, and the rows are the names.** The bar carries exactly four picks, defined over the plans
  **inside the band** and stated on the repeated march's own figures, cheapest first: **Best for silver**
  (the best damage a silver), **Spare the stock** (the best damage a hired unit), **Sweet spot** (the plan the
  engine weighed both resources to choose, and where the bar opens) and **Most damage** (the most damage the
  army can do). A plan several definitions fit wears the first of them, in the order **Sweet spot → Most
  damage → Best for silver → Spare the stock**. The knee stops being a stop — it stays in the payload,
  because it decides the recommendation rather than answering anything — and `leftOut` counts the extremes the
  band refuses. On the
  owner's account that is what happens to the two old sentence labels: the single-troop-stack march and the
  knee leave the bar, and the rows that replace them are named rather than described. Measured there at the
  app's horizon, the bar carries **4 stops** with `leftOut` = 44 (`tools/theorycraft/out/86-slider-stops.md`):
  `spare-the-stock` at 107 hired a march, the `sweet-spot` at 205, `best-for-silver` at 207 and `most-damage`
  at 207 — against the old list's first stop, a single-troop-stack march, and its second, the knee at 45 hired
  (0020 §1).
- **The engine hands over an identity, the UI writes the words.** `PlanPick`
  (`'best-for-silver' | 'spare-the-stock' | 'sweet-spot' | 'most-damage'`) and `pick: PlanPick` on every
  carried row (`src/engine/plan.ts`); the shape sentence the engine has always written (`3 stacks · 45 hired ·
  1.6M silver a march`) stays on the row for the recorded experiments that read it as a row's identity
  (`tools/theorycraft/63`…`86`) and the app no longer draws it, because the silver in it is a column of the
  table under it and "stacks" meant the march's troop rungs in the label and every stack in the table.
  `alternatives` can still only truncate the list, never invent a row.
- **The tip is the plan under the cursor.** Mantine's floating label goes (`label={null}`); ours follows the
  pointer along the track, slides between stops, fades, is clamped inside the pane at both ends, and lights
  the plan's own row in the table below. Arrow keys and focus show it at the thumb, and
  `prefers-reduced-motion: reduce` keeps the tip and drops the motion (rule 24).
- **The trade is made visual.** A damage bar on every row, scaled to the loudest plan on the list, a glyph on
  each column head, compact figures for the two seven-digit columns, the row on screen raised (`--pyr-raised`)
  and the sweet spot said in words on its row. The bar is a **second ornament** on the page, and
  `docs/design.md` §8 is amended rather than broken quietly.
- **The prose is cut to the analysis, and the why moves behind a glyph.** One muted line saying what the plan
  did for *this* army, with the general explanation on demand beside it. The explanation is not lost: it is
  what the owner asked for in 0018, and it is still on the page.
- **The plan is open when it arrives, and still collapsible, and it stands under the army.** The chevron
  stays because the pane has no room to spare: measured with `paneFrame()` at 1400×900 with the method
  chosen, **740 px of March against 740 px of room** folded and **998 px open**, so the plan method's pane
  sticks by nothing at all folded and flows while the plan is showing. The row it collapses to keeps the
  plan's headline. **Where it stands was amended the same day** (owner, 2026-09-16: *"im not fond of moving
  the army down. We should first see the army then the details to change them afterwards"*): the pane reads
  **answer · army · left out · plan**, because the block is a *control* — reading another plan puts another
  march on screen — and a control belongs after the thing it acts on. `PlanSizing`, the hidden line under the
  figures, stays where it is: that one is the answer. Pinned by J6, which measures where the army and the plan
  are drawn rather than asserting a DOM order.

- **The sweet spot is the middle of the trade in hired stock** (D-6, owner, 2026-09-16, after looking at the
  built bar: *"no change in placement, just the sweet spot seems to be too similar with silver save,
  especially for merc spends."*). He was right: the old rule — the plan closest to the best on both ratios at
  once — burned **21** hired units a march where the two named ends burned **12** and **22**, so the plan the
  app opened on saved no stock at all and was one unit from the dearest thing on the bar. Two other re-aims
  were measured over the same trade and **neither moves**: the crossing of the two relative efficiencies lands
  at 20 burned, and re-anchoring the peaks on the offered plans changes nothing — because on this army each
  further hired unit burned buys *more* damage than the one before it (214 k a unit between 12 and 17 burned,
  318 k between 17 and 22), so the stock is worth spending and no efficiency rule will decline to spend it.
  The recommendation is therefore stated in the resource that does not come back: **the best march whose burn is
  closest to the middle of the range between the thriftiest and the dearest plan the bar can carry**. No free parameter — both
  ends of the range are plans the engine found. Measured after the change: **17 burned for 5 333 606 damage a
  march** instead of 21 for 6 826 445 (19 % less of the stack for 22 % less damage, same silver), the bar
  carries **four** stops where it carried three (12 · 17 · 22 · 22 burned), and `leftOut` fell 45 → 44.
  `CampaignInput.withTrade` was added so this was measurable at all: the set the picks are drawn from was
  computed and then thrown away, and no experiment could ask where else the sweet spot could have been.

`tools/theorycraft/86-slider-stops.test.ts` is regenerated — its subject is exactly this list, so it prints
each stop's `pick` beside the shape sentence it came from, at the app's horizon, the old default and a silver
budget — and its committed `.md` changes with it; `87-stop-rules.test.ts` (the probe that produced 0020 §1) is
deleted, since 86 asks its question now. `tests/engine/plan.test.ts` gains the picks (four at most, cheapest
first, all inside the band, the sweet spot present and marked), `PlanPanel.test.tsx` is rewritten against
names rather than sentences and holds the tip and the reduced-motion contract, `e2e/journeys.spec.ts` J6 is
updated for a plan that is open on arrival, and `e2e/generate.spec.ts` gains the pane measurement above.

D-02…D-09 are a different list — the TotalStack features we are not building; they keep their own section at
the end of §5. All are deferred except **D-04 Total Optimization**, done as the opt-in relaxed-preservation
post-pass (investigation 0003, which numbers it S-42), and **D-03 Manual HP Order**, partly done.

### 5.2 Design overhaul stories (M6, `docs/plans/design-overhaul.md` §10)

Where a story shipped in a different shape than it was written, the row says so: the reviews that produced
`docs/design-rules.md` and spike 0009 changed several of them after they were specified.

| Story | Status | Closed by / where it stands |
|---|---|---|
| D-10 Top bar with brand and account menu | done | `e5b81aa` (M-03); the profile bar, sticky strip and jump bar are gone |
| D-11 Floating Generate with four states | done, amended | frame V1 (spike 0009, rule 2): no floating button — Generate sits in the March pane header on desktop and in the bottom app bar on phones; `GenerateFab` stays in the kit, unused |
| D-12 Two-column desktop, single-column phone | done | sticky 360 px March pane from 1200 px (`e5b81aa`) |
| D-13 Neutral palette and type scale | done | the Mantine theme (M-01); the 13 px floor was enforced in `bab19ac` after investigation 0011 |
| D-15 Self-hosted variable fonts | done | Inter and Fraunces bundled, no CDN (ADR-0002 as amended) |
| D-16 Icon sets | done, amended | M-10 and rule 21: Unicode emoji through one `Glyph` for every game concept, Lucide for interface chrome only; Game Icons dropped, so there are no icon assets at all |
| D-17 Surfaces: border or fill, never both | done | `70f4dda`, then absorbed by the theme in M-01/M-09 |
| D-18 A named visual reference for finish | done | `docs/design.md` §8 |
| D-19 Design-direction pass with the `frontend-design` guide | done | investigation 0005 and `4ef92dd`; carried into the Mantine theme and `docs/design.md`, rewritten in M-09 |
| D-20 Unit tile in three sizes with all states | done | `domain/UnitTile` on Mantine (M-02) |
| D-21 Tier stepper | done, amended | rule 7: `TierSelect` from/to selects, one line per group as TotalStack does (`a723b98`, M-04) |
| D-22 Troops card in the TotalStack-inspired flow | done | `a723b98` (M-04) |
| D-23 Mercenaries card | done | `4519621` (M-05) |
| D-30 Bonuses as rows with a pinned TOTAL | done | `ebce3e4` (M-06) |
| D-31 Battle card (segmented enemy, full-card method, switch options) | done | `3adbd23` (M-07) |
| D-32 Numeric stepper primitive everywhere | done, amended | rules 9 and 10: plain inputs that select on focus for typed numbers (`a174b83`, `23bf1a2`); steps only for tiers, levels and stars |
| D-33 Captains and hero as a tile grid | deferred | superseded by D-34 before it was built |
| D-34 Captain picker mimicking TotalStack | done | investigation 0006, `ebce3e4` (M-06): dense chips, corner gear, level dot, anchored popover with the live bonus |
| D-35 Progressive disclosure in Bonuses | done | `ebce3e4`: groups with nothing configured collapse to their "Add …" line |
| D-36 Housing mirrored in the app bar | backlog | an option, never adopted: frame V1 keeps the top bar to brand and account, and housing stays in the Battle card |
| D-40 March card in the amended order | done | `ef2dc5f` (M-08) |
| D-41 Left-out row, trade-off strip, delta | done | `ef2dc5f` |
| D-42 Unit sheet replacing the popover | done | `ef2dc5f` |
| D-43 Battle story with the raw journal folded | done | `ef2dc5f` |
| D-44 Shared-march banner and save-a-copy | backlog | a share link still opens the `LoadSharedDialog` prompt (S-10 behaviour), not a banner on the result |
| D-50 Journey checks scripted | done | `0d16eca`, re-measured in `e4be398`: phone J1 3 taps · 0 screens, desktop J1 2 taps; J2 4, J3 4, J5 2 (`e2e/journeys.spec.ts`) |
| D-51 Owner walkthrough on phone and desktop | backlog | waiting on the owner; the script is `docs/walkthrough.md`, findings go in §7 |
| D-52 Two external players try J1 and J6 | backlog | not started; after D-51 |
| D-53 Rewrite `docs/design.md` for the new system | done | `00a8b73` (M-09) |
| D-54 Shorten the setup on phones | done | `e4be398`: the Battle card is 887 px at 390 px wide, from 983; the ≈ 600 target is out of reach while rule 8 holds, and the travel it existed to cut is gone anyway (D-50) |

### 5.3 Mantine migration (`docs/plans/ui-foundation-mantine.md` §4)

All ten are done on `development` (2026-09-13). Gates at the end of M-09: 542 unit tests, 26 e2e, 4 visual,
`pnpm contrast` over 176 pairs, `pnpm size` 211 / 35 / 30 kB against budgets of 340 / 90 / 40.

| Story | Status | Closed by |
|---|---|---|
| M-01 Provider, theme, colour-scheme sync, PostCSS | done | `af84308` |
| M-02 Kit composites and domain components on Mantine | done | `af84308` |
| M-03 Shell: app bar, account menu, sticky March pane (frame V1) | done | `e5b81aa` |
| M-04 Troops | done | `a723b98` |
| M-05 Mercenaries | done | `4519621` |
| M-06 Bonuses | done | `ebce3e4` |
| M-07 Battle | done | `3adbd23` |
| M-08 March | done | `ef2dc5f` |
| M-09 Retire React Aria, Tailwind, the old kit and the lint rules; budgets; `design.md` rewritten | done | `00a8b73`, `9ffb33a`, `6ce5b2f` |
| M-10 Glyphs: Unicode emoji through one `Glyph` component | done | landed with M-02 — with no icon assets at all, the `Glyph` component *is* the story |

The React Aria foundation stories **T-00…T-09** (`docs/plans/ui-foundation.md` §8) were built and then
retired: T-00…T-07 shipped, were rejected by the owner on execution, and T-08/T-09 were replaced by ADR-0008
and M-09. That plan is history now; nothing there is open.

### 5.4 Counts

69 done, 3 in progress, 6 backlog, 2 deferred, 1 gated, out of 81 stories.

Known gaps in the data and the engine: VIP table values and 14 artifact level tables are unknown (hand-typed
in the UI until contributed); round-to-10s troop counts differ from TotalStack by a few units; the
beast-boost anomaly is not modelled; custom mercenaries have no cap field.

The story descriptions follow, milestone by milestone; where one disagrees with a table above, the table
is the current truth.

### M0 — Foundation
- S-01 Scaffold Vite/React/TS/Tailwind/Vitest, lint/format, GitHub Actions (test + Pages deploy).
- S-02 Game data package: reshape `docs/research/totalstack-data` into our own `src/data/tables` format with
  zod-validated types, ids, display labels, icons; provenance note per table; spot-check values against the game.
- S-03 Config schema v1 (Profile / BattleSetup / SavedStack, each with `id`/`updatedAt`/`rev`/`deviceId`,
  root tombstones) with zod + migrations skeleton; store with persistence; default profile on first run.
- S-04 Share codec (deflate-raw + base64url) with round-trip tests and size budget; JSON export/import.
- S-06 Contributor-friendly data layout (section 2.2): table files, formatter, zod + integrity validation in CI,
      `docs/data/README.md`, `CONTRIBUTING.md`, PR template, data changelog, `dataVersion` shown in the app.
- S-07 Decision: may we fetch TotalStack's public bundle automatically? Re-check for terms, ask them on their
      Discord if in doubt, record the answer in `docs/decisions/0001-totalstack-drift-check.md`. Until then S-05
      ships only in its local, manual form.
- S-05 TotalStack data-drift check (automated form gated by S-07), runnable in CI without Claude: a script (`tools/totalstack-sync`, prototype
      already in the repo) fetches totalstack.ca, follows `assets/index-*.js` and its lazy chunks, extracts the
      game tables by content (array containing `id:"archer-1"`, `id:"stone-gargoyle"`, `id:"cyclops-5"`, the
      captain/equipment/artifact/title objects, temple table) with the no-eval tokenizer, normalises them, and diffs
      against `src/data`. Exit non-zero and print a readable diff (added/removed ids, changed fields) when they
      differ; a scheduled GitHub Actions job (weekly) opens/updates an issue with the diff. Applying the update stays
      a human step (review the diff, bump `dataVersion`); Claude can be used for that review but is not required.

### M1 — Configuration UI
- S-10 Profile bar (CRUD, active switch, unsaved indicator, export/import, share dialog with "profile link" and
      "battle link" tabs + copy/QR, load-from-URL prompt).
- S-11 Troops section (tier ranges, top-tier category chips, per-unit exclusion grid).
- S-12 Mercenaries section (picker with filters, caps, custom mercenary).
- S-13 Stacking method section (EP / MP / custom kill order editor, Monsters Last, Round to 10s).
- S-14 Bonus sources: permanent editors + TOTAL cards + breakdown drawer + "custom source" editor
      (the custom source is also how a user enters a title value by hand while the titles editor is deferred).
- S-15 Captains (levels/stars), Equipment and Artifacts (level/star tables, random bonus rarity) editors.
- S-16 Other (VIP, Dragon, Hero, +25 pills, Unknown Sources) and Events editors.
- S-17 Temple / training fields, Enemy formation, Housing, priority select, Generate; original help text for
      every section (our own wording, "where to find it in game" notes included).
- S-18 Battle setups (named active-source selections) inside a profile.
- S-19 Cross-device: investigation done (`docs/investigations/0001-cross-device-sync.md`). In M1: profile link +
      QR, battle link, JSON export/import, "Send to another device" via the Web Share API. Sync-ready schema fields
      (`id`, `updatedAt`, `rev`, tombstones) are part of S-03.

### M2 — Engine v1 (stacking)
- S-20 `bonuses.ts` aggregation + effective HP/strength per unit; tests against review §3 numbers.
- S-21 Kill order builders (EP, MP, Monsters Last, custom) with tests.
- S-22 Stack sizing algorithm (flat profile, exact fill, non-increasing HP with ties reported, caps, exclusions).
      Regression test (`tests/engine/stacker.test.ts`, review §3 run): leadership 4100, health bonuses
      guardsmen 39.5 / melee-ranged-mounted 1 / army 3, units ARC1 SP1 RD1 ARC2 SP2 RD3 must give
      930 / 929 / 464 / 514 / 513 / 143 (± 1 unit each, pool exactly filled, HP non-increasing along the kill
      order). Mercenaries at caps 22/24/23/12.
- S-23 Round-to-10s mode.
- S-24 Results UI: pools, pills, popovers, remove/restore, sort/reset order, save stack, share result.
- S-25 Engine in a Web Worker with cancel/progress; main-thread fallback.

### M3 — Battle Summary
- S-30 **Investigation**: turn structure, attack order and targeting of the in-game epic-monster battle.
      TotalStack's model derived and **validated against one real in-game epic report** (HP lines, per-hit damage,
      targeting, round structure all exact; `fixtures/ingame-2026-09-11-epic-ancient-report.md`). Second report captured (enemy first, 4 squads). Remaining:
      (a) the friendly attack order nuance (Rider I skipped) — keep TotalStack's rule unless more reports confirm
      the refinement,
      (b) TotalStack's "2 × strength-against" in its summary is NOT what the game shows — our summary uses the
      journal formula (1 ×), (c) the ≈42,500 troop-only extra in TotalStack's maximum (irrelevant if we use our own
      min/avg/max), (d) recovery-cost composition (S-33).
- S-31 **Investigation**: what TotalStack's "Total Optimization" actually trades (housing/HP trades that break
      preservation when damage improves) and whether it is worth reproducing; write findings + proposal.
- S-32 Damage model (min/avg/max, double damage, strike-two-squads, strength-against with enemy formation).
- S-33 Recovery model (retrain/revive/selective, temple table, training reduction/speed, dragon coins). Open
      equations from the captures (retrain silver constant, gold composition, revive silver, time) to be settled
      against the in-game retrain/revive screens, which show exact costs.
- S-34 Battle Summary cards + journal drawer (in-game-style hit list, enemy-first / army-first toggle).

### M4 — Optimisation
- S-40 Priority search: max average damage (worker, progress, cancel, time box).
- S-41 Priority search: damage per silver / gold / dragon coin.
- S-43 Compare saved stacks side by side (summary metrics).
- S-44 Sync adapter interface + explicit Pull/Push UI with per-profile conflict dialog (investigation 0001).
- S-45 GitHub Gist sync adapter (investigation 0001, option B1): the first real sync adapter, ahead of Google Drive
      because it needs no OAuth app, no domain and no verification. User pastes a fine-grained personal access token
      (gist scope only) in Settings; the app creates one *secret* gist holding one file per profile plus an index file,
      and implements `RemoteStore` on top of the Gist REST API (ETag/`rev` check on put, tombstones respected). Token
      stored locally only, never in share links or exports. Optional client-side encryption (WebCrypto AES-GCM, key from
      a passphrase) behind one checkbox. Explicit Pull/Push from S-44, "last synced" shown per profile.
- S-46 Google Drive appData sync adapter (GIS token model). **Gated** by investigation 0002: requires a custom domain
      for the official site with homepage + privacy policy, Search Console verification, brand verification, and a
      long-term owner for the Google Cloud project. Dropbox (app-folder, PKCE, no domain requirement) is the
      alternative if the domain is refused.
- S-47 Generic endpoint adapter + reference Cloudflare Worker in `tools/` for clan-hosted storage.

### M5 — Polish
- S-50 PWA/offline, install prompt.
- S-52 Accessibility pass, mobile layout pass.

### M6 — Design overhaul (done on `development`)

The owner rejected the second design pass on 2026-09-12 ("hurts the eyes, unpractical"): a sticky strip with
little value, profile actions in a permanent bar, selects where steppers belong, icons that did not read,
Troops and Mercenaries unreadable together, oversized chips and undersized text. Two plans were written
before any code — `docs/plans/design-overhaul.md` (personas, journeys J1–J7, frame, cards, stories D-10…D-54)
and `docs/plans/ui-foundation.md` (the technical half) — and the owner's decisions from every review since
were distilled into the charter `docs/design-rules.md`, which now outranks both plans.

The overhaul was then built twice. The first build, on a hand-styled React Aria kit, was rejected on
execution ("a mismatch of CSS badly designed and executed"); the second, on Mantine 9 after spike 0007 and
ADR-0008, is what is on `development` today. Every D-story is accounted for in §5.2: 25 done, 1 superseded,
4 in the backlog (D-36 housing in the app bar, D-44 the shared-march banner, and the two human validation
stories D-51 and D-52).

### M7 — March card, then Bonuses and Battle (done)

The order agreed on 2026-09-12 — Army cards → finish pass → March card → Bonuses and Battle → validation —
was carried out through the Mantine migration (§5.3): M-04/M-05 for the Army cards, M-06 and M-07 for
Bonuses and Battle, M-08 for the March card in the amended order, M-09 for the retirement and the polish
list. Phase E validation is done except the two human stories: **D-50** journey budgets are measured in
`e2e/journeys.spec.ts`, **D-54** shortened the phone setup, the charter was checked rule by rule in
investigation 0011 (29 met, 5 partly, 0 not met) and the five partly-met rules were fixed in `e4be398`;
**D-51** (the owner's walkthrough, script in `docs/walkthrough.md`) and **D-52** (two external players) are
waiting on people, not on code.

**S-48 best captains is written up (§3.7) but delayed by the owner; not scheduled** (rule 33: engine stories
wait until the UI is right).

### M8 — Signed-in account sync (S-49, two parts, in progress) — replaces Gist sync (S-45) and the QR/share-link
device hand-off once live

Owner's spec: `docs/research/pocketbase-profile-sync-spec.md` (a self-hosted PocketBase behind Caddy; Google
OAuth with a frontend-hosted redirect so only the GitHub Pages origin is ever registered with Google; one
`profiles` collection with one blob per user and an optimistic `version`; an explicit `POST /api/app/profile`
hook returning a deterministic 409; the client keeps `remoteVersion`, `deviceId`, `dirty`; conflict modal with
two lossy choices and a JSON export first; service worker `NetworkOnly` for the backend origin;
`navigator.storage.persist()`; deliberately no sync engine, no realtime, no merging). Email/password sign-in
is optional on top (PocketBase's `users` auth collection supports it natively).

This breaks ADR-0002's "no server" property for the sync feature only; it needs **ADR-0009** (proposed with
the client work): the app stays fully usable offline and anonymous, the account is opt-in, the server stores
an opaque blob, and nothing else leaves the browser. Hosting: the "main" server beside philou, sharing
philou's Caddy (investigation `docs/investigations/0010-hosting-pocketbase-beside-philou.md`: PocketBase joins
philou's Docker network, philou's Caddyfile imports a `sites-enabled/*.caddy` directory, backend name
`pyrrhic-backend` on a Dynu domain, e.g. `pyrrhic-backend.dynu.net`; Dynu's domains are on the Public Suffix
List). Every `[verify]` in the spec has been checked against the pinned PocketBase version
(investigation 0012).

- **S-49a Backend** — *groundwork done, deployment pending the owner.* `ops/pocketbase/` holds the pinned
  compose file (PocketBase 0.40.4), the Caddy site block, `pb_hooks/main.pb.js`, the `profiles` migration with
  its rules and index, and `smoke.sh` covering the spec's §7 checklist; all of it exercised against a
  throwaway container (12/12). No secrets are committed. Still needed **from the owner**: the Dynu hostname,
  approval of the two-line philou change, a Google Cloud project with the OAuth client and
  `<user>.github.io` verified in Search Console, and a backup target (PocketBase's S3 backups or a nightly
  pull). See `ops/pocketbase/README.md` for the deployment steps in order.
- **S-49b Client** — *in progress.* Sign-in with Google (PKCE flow per spec §5.2; the callback must be a real
  path with a `404.html` copy of `index.html` — Google forbids fragments in redirect URIs, investigation
  0012), optional email/password, account menu rows (Sign in / Signed in as … / Save to account / Load from
  account / Sign out), `remoteVersion`/`deviceId`/`dirty` in local state, conflict modal, SW `NetworkOnly`
  rule, storage persistence prompt; then retire the Gist adapter (S-45), the sync dialog's token handling and
  the QR code hand-off (share links stay: they carry a march, not an account). Lands with ADR-0009 and a
  rewritten `docs/sync.md`.

### Deferred — not planned, kept for reference
Features TotalStack has that we are not interested in for now. They stay out of every milestone; pull one back
into a milestone only on explicit request. The engine and config schema keep room for them (bonus keys, kill
order, manual counts) so adding them later is UI work, not a redesign.
- D-02 Titles editor (toggle pills from `titles.json`). Workaround: custom source.
- D-03 Manual HP Order — partly done: per-stack +/- and direct count edits with live deltas and undo; drag-to-reposition not built.
- D-04 Total Optimization — **done** as an opt-in "relaxed preservation" post-pass on M's Preservation (investigation 0003).
- D-05 "By Battle Report" bonus input mode (health-only fallback for low-tier accounts).
- D-06 Troop Type Allocation percentages (weighting categories when no preservation order is used; meant for
      normal monsters / citadels, not epic monsters).
- D-07 Legacy "damage-based stacking" and "attack order refinement" flags from TotalStack's API.
- D-08 Print / share-as-image of a result.
- D-09 Everything outside the calculator: accounts, chatbot, clan tools, other calculators, data pages.

## 6. Risks and open questions for review
1. **Battle model fidelity** — the only real risk. Stacking (M2) does not depend on it; damage metrics do.
   Mitigation: S-30 first in M3, driven by your own battle reports.
2. **Game data drift** — TotalStack tables are a snapshot (Sept 2026). S-05 detects drift in CI; the UI shows
   `dataVersion`. Risk: TotalStack could obfuscate or move the data server-side; then the fallback is manual entry
   from in-game screens.
3. Profile vs battle setup vs saved stack: does the 3-level model above match how you want to work, or do
   you prefer a single flat "profile" that includes the march selection?
4. (answered) English only.
5. (answered) Share links exist for both a profile and a battle setup.
6. (answered) Unwanted features are listed under "Deferred" in the backlog, not dropped.

## 7. Review log
- 2026-09-18 — **S-87 the shelter, restored for every hired type.** Experiment 106 showed every stop of the
  owner's live camp fielding hired stacks above the troops (4.3 M HP of legionaries over a 274 772-HP floor),
  which is what S-77's *unlimited-only* clamp allowed; S-75's rule is back at one helper read from every shape
  — including the winner's rungs, which had never been checked against the mercenaries they carry. The camp is
  five stops with zero exposed stacks; the export at 7 000 returns to S-75's figures (plan 24 814 601 →
  23 264 491, the silver saver gone); ten bears −2.7 % on the sweet spot; the other eight benchmark scenarios
  did not move, and the search is 5× faster at 7 000. Benchmark 06. The shelter costs damage on purpose — it is
  the trade the owner asked for — and the standing criterion now fails the moment a hired stack stands on top.
- 2026-09-19 — **S-81 the all-in's troops-only tail.** Benchmark 05: the three-bear all-in 14.5 M → 19.1 M over
  four marches, 98.6 % of TotalStack at equal silver; nothing else moved. A tail for the repeated stops on
  one- or two-unit stocks is measured (would close the gap entirely) and left to the owner.
- 2026-09-19 — **S-80 the put-back pass**, inside the bar's proposals, with the owner's rates as a policy and three
  guards from existing rules (a put-back saves time; the silver saver keeps its rule; the bar stays monotone).
  Benchmark 04: only two all-ins moved. Owner-visible on his live army: all three stops share one troop march
  now (the improved rung beats the cheap eight-type march on both ratios) — the trade got flatter; his call.
- 2026-09-19 — **S-79 Time to recover**, first step of the owner's training-time work. Next: the put-back pass
  with his rates (silver saved %/5 + time saved %/10 + damage change % ≥ 0, damage loss ≤ 3 %), calibrated on
  experiment 103.
- 2026-09-18 (past midnight) — **TotalStack on the owner's own window.** Fourth kit run in fixtures; on his
  seven troop types the plan's hardest stop beats TotalStack's best by 52 % at 7 000 and 34 % at 12 000 for
  less silver, matches it on the live account; TotalStack keeps the better damage a hired at 7 000/12 000.
  Benchmark 03b; stage table updated.
- 2026-09-18 (late night) — **S-78, and the stage table.** Proposal 2 narrowed: the bar keeps burn as its axis
  (the fielded axis understated the low-end cost and moved four sweet spots), the all-in gate reads fielded,
  the sweep is finer. Benchmark 03; the four stages side by side in `out/benchmark-2026-09-18-stages.md`.
  Open, measured: the all-in halts when the stock is gone — a troops-only tail would close the like-for-like
  gap to TotalStack on a three-bear account (19 115 768 for 32 525 600 against its 19 388 676). Queued by the
  owner: training time on the summary, a lower-tier reconsideration pass, and the Spearman I put-back flaw
  (experiment 102: the MS sizer over all types with the same merc caps beats the generated sweet spot on
  every count at 4 975 leadership with Aydae alone).
- 2026-09-18 (late night) — **S-77.** Shelter clamp only for unlimited types (the sponge is the journal's to
  judge); the sweet spot's middle-of-range tie broken on the campaign's ratios after a parity accident at
  7 000 (validator finding). Benchmark 02: 7 000 steady max +6.7 %, sweet spot back to rung 11, silver saver
  gone there; ten bears +2.8 %; nothing else moved. TotalStack's full dataset (six bases, eighty answers) is
  in fixtures; Total Optimization is the body with `monsterSaving` on.
- 2026-09-18 (night) — **The benchmark, then S-76.** The benchmark test grew to ten scenarios (owner's export at
  7 000/12 000, live and evening accounts, first-run Bear V ×1/×2/×3/×10 and hunters ×83, the 4 000 case with
  TotalStack's and Kai's captured answers as rows), each pinned to measured figures; a validator's twelve
  findings were fixed (always-on cases, app budgets, no-silver rows, external pins). Snapshots kept per stage:
  `out/benchmark-2026-09-18-00-before`, `-01-horizon-ceiling`. TotalStack (Pro trial to 2026-09-20): a console
  kit the owner runs (`docs/research/totalstack-capture-2026-09-18.md`); first dataset in fixtures (M's and
  Elite over the ten scenarios), Total Optimization at 7 000 read off the page (13.35 M for 3.2 M silver on a
  profile that fields Archer III / Spearman III). S-76 built and benchmarked: only the bear refusals changed.
- 2026-09-18 (evening) — **Assessment after S-75, experiment 101** (owner: *"losing there if we shield the mercs
  properly? or is there a flaw in our calculations of the expected battle? … I feel 10 should still be slidable
  2 - 5 - 10 … rooted in calculations, no more magic static numbers"*). No flaw: every stack dies in a march
  and a hired stack loses `ceil(n/10)` wherever it stands, so the shelter buys strikes, not survival — and the
  journal already prices strikes. The 6 % at 7 000 is the **sponge**: the unsheltered march put 34 legionaries
  on top, the first stack the enemy wipes (0–1 strikes), which moved every other stack one kill slot later
  (arbalesters 3 strikes instead of 2) for one more legionary burned and 48 gold a march. The clamp forbids
  that trade on capped types too, which nobody asked for. Ten bears on a first-run army: one stop because
  every stop rule compares **burn chunks** and 1–10 units of a type all burn one; the band says 2 or 5 bears
  are worse on both ratios than 6 (same burn, 30–45 % less damage), the hidden all-in 10·9·8·7 is +5 % damage
  for +49 % silver; and **one or two units of a type make the plan refuse outright** (a 4-march horizon needs
  three), with the refusal worded as "fill in your mercenaries". Proposed, not built: shelter only unlimited
  types; compare stops on hired fielded rather than chunks; make the horizon a ceiling.
- 2026-09-18 (past midnight, last) — **S-75: every hired type kept, every hired stack sheltered, unlimited
  mercenaries bounded.** S-58 B on; sizer-shaped marches lower any hired stack that stands above the lowest
  troop stack; an unlimited type is fielded as far as the authority pool and the shelter allow, and the winner
  must stand on more than one troop stack. The 7 000 case pays 6 % of damage for the shelter; the benchmark's
  pinned gap flipped.
- 2026-09-18 (past midnight) — **S-74: five stops.** Silver saver · Sweet spot · More mercs · Steady max · All in;
  the all-in is the descending sequence (`PlanTotals.sequence`) — every mercenary the troops can shelter, then
  each march on what is left — and on his live account it reaches 99 % of the sizers' best four-march damage for
  32 % less silver.
- 2026-09-18 (night, last) — **S-70: a silver lever, and the benchmark pinned as a test.** The tight ladder of
  every vector reaches the frontier and "Least silver" is a real saving at least as efficient a silver; the
  three-method benchmark is `tests/engine/plan-benchmark.test.ts` with today's floors and one known gap pinned:
  on the 2026-09-17 export at 7 000, pressing Generate four times with Troops first beats the plan's sweet spot
  on both ratios, because it shrinks each march as the stock drains and the plan repeats one march.
- 2026-09-18 (later that night) — **S-69 amended from the owner's own browser.** His live account still drew two
  stops one apart; the ladder is filled at every burn level now, each swept vector refined, and the winner's own
  rungs with fewer mercenaries scored as a shape: 4 · 6 · 7 on his account, the exports unchanged or better.
- 2026-09-18 (night) — **S-69: four stops, the knee, and the benchmark.** The bar is least silver · sweet spot ·
  more mercs · most mercs, the sweet spot at the knee of damage against burn (`out/99`); the three methods
  were benchmarked over the same four marches (`out/100`): the plan wins both ratios everywhere and four-march
  damage in one case of three, losing 1–5 % where a re-sized sequence burns 24–45 % more of the stock.
- 2026-09-18 (later) — **S-66: the shelter margin measured, and two search gaps closed.** The troops' HP above
  the mercenaries is their own strike, not a safety margin (`out/97`); the ladders now score the vectors a
  sizer settles on, and learn which type takes which rung by a swap climb that reaches the best of all 5 040
  assignments (`out/98`): the sweet spot on his latest export +5.5 % for the same silver.
- 2026-09-18 — **S-65: the criteria frozen as floors, and the refactor.** The bar's ratios and campaign figures
  are regression floors on two armies (the owner's where his export is), and the silver axis, the merge, the
  fillers, the `alternatives` cap and the dead UI exports are gone — 431 lines fewer, every check green.
- 2026-09-18 — **S-64: the five branches, walked on the engine.** Subsets, the gap, held-back leadership and
  the ratio objectives measured as no win; the finale's shape as a clear one, fixed (`out/96`): the sweet
  spot's campaign +5.7 % for 9.5 % less silver, the stops unchanged.
- 2026-09-18 — **S-63: under the cap, and the method as a shape.** The owner asked whether a better deal hides
  under the pool caps and what the search never tries. Measured on his export (`out/94`): authority never
  binds, less leadership is a trade and not a win, and no troop subset beats all eight — but Military Science
  beat Elite with fewer mercenaries burned. The sizer shape is scored under all three methods now (`out/95`):
  the most-damage stop at his setup is 6 242 452 at 14 burned where Elite alone gave 6 146 761 at 22.
- 2026-09-17 (later that night) — **S-62 measured on the fresh export and turned on.** The owner sent his
  export; his morning bar reproduces to the unit and so does his put-back march, which is the Elite sizer
  over all eight types. `sizerShape` is on: on his account the sweet spot goes from 4 701 707 to 5 736 190 a
  march for 13 % less silver, every stop fields every troop type, and the search takes 120–190 ms more.
  Experiments from 93 on read `EXPORT_2026_09_17` in the harness; 91 and 92 keep the 2026-09-13 file as
  their record (92 regenerated with the flag on: its stops do not move there).
- 2026-09-17 (night) — **Three stops, and the shape the plan could not find.** The owner's verdict: *"keep 3
  spot on the slider each time"* (`planAlternatives: 3`, no fillers; `out/92` regenerated). And his finding
  that a put-back of two troop types beat the plan's own march on damage *and* silver: the search sizes troops
  as a ladder over a prefix of the damage-per-HP ranking, never as the Elite sizer the pane re-sizes with.
  `sizerShape` (S-62, flagged) scores the sizer's march as a shape; on the 2026-09-13 export it never wins and
  the case does not reproduce (`out/93`), so it waits for a fresh export.
- 2026-09-17 (later) — **The sweet spot must not lose on both ratios.** The owner read his own bar and found the
  sweet spot (15 burned) beaten by the 12 stop on damage a silver and damage a hired unit at once. The engine
  reads the sweet spot and the fillers only among efficiency-undominated rungs now (S-61 row, amended); the
  rule is verified by hand on his four figures and on the fixture, and waits for a fresh export to be verified
  on his account, which the 2026-09-13 file cannot reproduce.
- 2026-09-17 — **S-61 decided and built.** The owner answered the four questions of the cross review (see the
  S-61 row): the slider balances the two constrained efficiencies, the sweet spot keeps the middle and takes no
  parameter, S-58 A alone, and a stop that is not meaningfully different from its neighbour is a frustration.
  Re-assessed on the engine (`tools/theorycraft/92-the-bar-as-drawn.test.ts`, both axes at horizons 3, 4, 10,
  each stop's distance from its neighbour): the burn axis is the app's default, its ladder is monotone, its
  fillers stand in the inner half of a gap, and the efficiencies are notes on the stops. A UI worker drew the
  notes, flipped the default and re-based the e2e journeys; the silver axis stays behind the flag.
- 2026-09-16 (night) — **The bar's axis, behind a flag, and the cross review.** The owner, on the review
  above: *"build the recommendation with a feature flag and let's compare the two ways with theorycraft using
  the engine … then we'll do a full cross review of each S58 feature flag, the recommendation and current way
  with your fixes."* Two flags in `src/config.ts` `CAMPAIGN.planBar`, both off: `axis: 'burn'` runs the bar
  along hired units burned a march — one plan a burn level, thriftiest first, `step` rows filling the widest
  gaps, **the same sweet spot** as the silver axis — and `mergeNear` is the candidate fix to the current axis
  (two stops that burn the same and sit within the fraction of each other on damage and silver a march are
  one stop). `PlanRepeat.gold` is new: the march's hired stacks priced in gold, which the engine always
  computed and no screen showed. `tools/theorycraft/91-cross-review.test.ts` crosses the four S-58 settings
  with the three ways of drawing the bar on the owner's export at horizon 4; its reading is in the S-61 row.
- 2026-09-16 (evening) — **Review of S-59 on retaking the branch.** The four commits made without the
  orchestrator were checked figure by figure: experiments 86 and 90 regenerate byte-identical, tsc, eslint,
  709 unit tests and 49 e2e pass; 88 and 89 had been committed with the previous rule's recommendation on them
  and were regenerated (ab587cc). A probe over `withTrade` on the owner's export at the app's horizon found
  three things the screen cannot show and only he can decide, recorded here rather than half-fixed:
  **silver is nearly flat across the bar** (1.97–2.35 M a march, set by the troop rungs) while hired burn runs
  12→22 and **gold** — the price `marchOf` puts on every hired stack, 467–827 a march — is shown nowhere, so
  the "silver vs merc" slider's axis (*Least silver … Most silver*) is the resource that does not move; the two
  right-hand stops are **one plan to within 0.2 %** (`best-for-silver` 6 905 207 / 2 331 500 / 22 burned
  against `most-damage` 6 920 621 / 2 354 500 / 22; dedup is by exact counts); stops sort by campaign silver,
  so at horizon 10 the bar reads burns 15 · 10 · 12 · 15 left to right; and `spare-the-stock` fields no
  legionary at all — the S-58 case, both flags still off. The sweet-spot rule holds, but "no free parameter"
  overstates it: the band's ends are the 50 % thresholds against the winner, so the middle is about three
  quarters of the winner's burn. A UI review of the built screen (seeded account, both widths) found and the
  same pass fixed: the ⓘ was dead on touch (a `Popover` now), the trade's names scrolled away on a phone
  (first column pinned), only the name button selected a row (the row is the control), the 58 px band under
  the bar did not press it (it does), "Sweet spot / the sweet spot" twice on one row and again in the tip
  (once), 🎯 and 👑 each meaning two things (🪖 `mercenaries` glyph added, the raised row marked by weight),
  heads wrapping to four lines (glyph + two words, nowrap), four tail paragraphs and the curve table still
  under the trade (one "Fought to the end" line stays, the rest behind a closed *Reference* fold), four dead
  CSS rules, and "Per silver" rounding three different plans to one figure (three decimals).
- 2026-09-16 — **S-59: the plan's own screen, named.** The owner reviewed what the plan method draws, in his
  words:

  > *"two things ui related for the plan of optimize all: slider tooltip is hard to grasp. it represent the
  > current selected one, and the name is unclear. Woudl be best to have tooltip be the one below the cursor,
  > with animation on hover so we understand and find better names for it. Then the table below, same plan name
  > is hard to catch and some info in it is already in the table. better names. then the table itself needs more
  > styling to be more visual. We could use icons but better styling is needed. Or redrawn in another way. The
  > text above is wayyy too big and might even be unecessary if the form itself is clear. Then we can move to
  > actually showing this all the time or even not in a arrow down plan details. It becomes a new part of the
  > recap when total optimization is choosen."*

  Four of the five asks became decisions the same day (`docs/investigations/0020-the-plan-screen.md` D-1…D-3,
  D-5): the bar carries four named picks and nothing else (D-1), the tip is the plan under the cursor and
  slides between stops (D-2), the trade is made visual — a damage bar a row, glyph column heads, compact
  figures (D-3) — and the plan block **arrives open and stays collapsible** (D-5), because the pane has no room
  to spare: `paneFrame()` at 1400×900 with the method chosen reads **740
  px of March against 740 px of room** folded and **998 px open**, so the plan method's pane sticks by nothing
  at all folded and flows while the plan is showing. **Where the block stands was corrected the same day**,
  with the owner's own words:

  > *"im not fond of moving the army down. We should first see the army then the details to change them
  > afterwards"*

  and then, on the same screen, the sweet spot:

  > *"no change in placement, just the sweet spot seems to be too similar with silver save, especially for
  > merc spends."*

  D-5 had read "a new part of the recap" literally and put the block straight under the figures, pushing the
  pills and their counts down the pane. The order is now **answer · army · left out · plan**: the block is a
  *control* — reading another plan puts another march on screen — and a control belongs after the thing it acts
  on. `PlanSizing` stays under the figures, because that line is the answer and the block is the control. J6
  pins it by measuring where the army and the plan are *drawn*, not by asserting a DOM order. The fifth — the wall of explanation — is **moved, not
  deleted** (D-4), because the same reviewer had asked for it one day earlier (0018:8: *"What's missing is the
  explanation on top … silver buys good damage, mercs also buys good damage but they are used sparsely"*), so
  the general why stays on the page behind the glyph that explains the line. Nothing on this screen is copied from TotalStack: the only
  screen of theirs ever observed is the method card (0008), which has no plan list, no names, no bar and no
  trade table, so rule 26 governs and every word is ours. Same pass: `docs/design.md` §4 (the pane's parts),
  §7 (four new `PlanPick` rows, the trade's real heads) and §8 (the ornament rule amended, dated, for the
  trade's bar), `docs/walkthrough.md` try 5, `docs/plans/design-overhaul.md` §7.5, and the experiment
  `tools/theorycraft/86-slider-stops.test.ts` regenerated to print each stop's `pick`.
- 2026-09-15 — **S-56: Complete optimization v1 removed.** The owner reviewed the five stacking methods and
  had `complete` taken off the Battle card: the plan method (S-55) answers the same question one resolution
  finer — a horizon, a frontier of plans and a march-by-march trade, against a score per sizing × spend level
  and one Campaign panel — and two methods answering one question at two resolutions is a choice the player
  should not have to make. The plan method keeps the name **Complete optimization**; the "v2" went with the
  removal. `METHODS` is `['elite', 'ms', 'custom', 'plan']` and `SCHEMA_VERSION` is 4: the `3 → 4` migration
  (`dropCompleteMethod`) reads a stored `complete` as `plan` and drops `setup.campaign` from a profile's
  setups and from a saved stack's setup, so documents and shared stacks written since S-54 keep parsing.
  `ui/sections/march/campaign.ts`, its test and `CampaignPanel.tsx` are deleted, `MarchSection` no longer
  draws `CampaignSizing` or `CampaignFold`, and `runStore` loses its `campaign` field; the plan pane
  (`PlanPanel.tsx`) stays as it is. `src/engine/campaign.ts` is kept deliberately and is no longer reachable
  from the app — it is the instrument experiments 22, 23 and 48 measure with. The two card fields left with
  the method, so the horizon and the silver policy live in `src/config.ts` alone (`CAMPAIGN.marches` 10, read
  by `derive.ts` as `marchTarget`, `CAMPAIGN.planAlternatives` 4, `budgets.search` / `budgets.plan`;
  `maxMarches` and `budgets.complete` deleted) — the file the owner asked for on 2026-09-15, now the only
  place either number is set. Same pass: §7 of `docs/design.md` (four method rows, the campaign-field rows
  gone), the walkthrough's fifth try, and investigation 0018's note on where the horizon is asked for. Two
  quiet defects found and left open: `plan.ts:79` declares `objective?: Objective` and never reads it, so the
  command bar's Objective select does nothing when the plan method is chosen, and `plan.ts`'s header comment
  is stale about `simulateBattle`.
- 2026-09-14 — **Investigation 0016, the march optimised** (`docs/investigations/0016-march-optimization.md`,
  scripts `45`–`50` and their outputs under `tools/theorycraft/`). Five experiments, all engine-scored, all
  under scenario **C** — the bonuses the owner's 2026-09-14 report was fought with (+159 %/+189 % guardsmen
  with a +2/+1 category top-up), which that report fixes exactly and which 0015's scenario B had superseded.
  Findings: the ledger (damage = Σ hits(p) · k_u · HP_p, k a per-type constant) makes a march predictable,
  and the exact optimum is `RD3 582 · EMH6 92 · ARC2 1,519 · RD2 761 · LGN6 72 · CHR6 36 · ABT6 71 · SP2 138`
  = **8,338,153**, +5.8 % on 0015's reference, found independently by two searches (a third stalled 2.1 %
  short because the average-damage objective is a staircase and a count climb sees no gradient); a **tail**
  stack below the mercenaries pays (+0.82 %, −10,800 silver) and corrects 0015 §6.2's "extra leadership is
  the worst buy"; procs are +4.85 % and **not steerable** (0.00 %) while the app's min→max is +10.2 % and
  free; re-optimising per monster beats the fixed march (+4.4 % three squads, +18.1 % no ranged) and a melee
  squad is worth exactly nothing; and a **mercenaries-only march costs no silver at all**, which is what
  makes ten marches reachable from a 1.1 M purse. Corrected here: 0015's mercenary-order rule and "round
  counts to tens" are local rules (the optimum mixes, EMH6 at its cap on a one-hit rung). Engine follow-ups
  E1–E6 in §9 (count hill-climb after sizing, tails as a sizing choice, mercenaries above troops, the proc
  band, unrounded enemy lines, the survival note). Evidence table and the decisive in-game tests in §8.
- 2026-09-14 — **Investigation 0015, theory-crafting the march** (`docs/investigations/0015-theorycraft.md`,
  scripts and outputs under `tools/theorycraft/`). Two owner corrections folded in: authority is 2,000 (the
  export's 200 was a typo) and Kai's calculator export plus its in-game report — which the engine replays
  30/30 entries, every friendly line to the unit (third in-game validation). Findings: the troop floor
  decides how much of the mercenary stock marches and dies last (ARC2 + RD2 + RD3 + mercs 7.84 M against the
  owner's 4.47 M); when the floor is low, Troops first with the stock on top beats Hired last (+1.29 M);
  the exhaustive mercenary vector beats the sizer by 2.8 % (the biggest hitter must be the smallest
  mercenary stack); leadership beyond the floor returns 0.2–0.7 damage per silver against 3 for the march,
  so a silver-bound campaign fields 20 % of the stock in tens above minimal sponges (30 sustained
  marches); reviving with gold divides the troops' silver by 10 and the stock then lasts 72 marches
  (176 M). below ≈ 30 % spend Kai's seven-sponge ladder beats the 3-sponge set by 26 % per march and per mercenary (`07-deep-ladder`). Engine follow-ups E1–E6 listed in §8 (leadership as a search dimension, mercenary post-pass,
  Troops-first candidate, double damage in the average, revive by silver-per-gold, profile fixes).
- 2026-09-14 — **S-54 landed, UI included.** A fourth whole-card stacking method, *Complete optimization*
  (design rule 8), with two fields of its own — *Marches planned* (10) and *Silver budget* (empty =
  unlimited) — and no extra rules at all, since it tries every sizing itself (§7.4). `METHODS` gains
  `'complete'` while the engine's `Method` is untouched: `derive.engineMethod` maps it to the tier ladder
  and `searchComplete` sets the method per candidate. `BattleSetup.campaign` is defaulted *inside* schema
  v3 (ADR-0004, the rule `relaxedPreservation` was added under), so documents written yesterday keep
  parsing. A `complete` worker job sits beside `stack` and `search` — cancellable, progress forwarded, same
  inline fallback. The March gains one line under the figures ("Sized as Troops first, with damage trades.
  Every mercenary you own marches each time.") and a folded **Campaign** section: the campaign's figures
  through `Figures`, the ten marches one per row, and the plans compared — every sizing at full strength
  plus the best of each smaller share, the winner marked — which *replaces* the objectives strip for this
  method rather than joining it. Wording is the glossary's throughout (`docs/design.md` §7): a spend level
  is "All / Three quarters / Half / A quarter mercenaries", never a fraction. Gates: 676 unit tests (662
  before), 46 e2e (44 before, J6 "plan a campaign" at 5 taps on a phone and 3 on a desktop), lint and
  typecheck clean. The visual suite's one failure (`domain-unittile`, 908/915 px) is unrelated and was
  already failing before this change — baselines untouched.
- 2026-09-13 (late) — **S-53 landed.** Schema v3: `BattleSetup` loses `pinnedUnitIds` and `excludedUnitIds`
  (root and profile migrations discard both; `troops.excludedUnitIds` — technology — stays). The engine loses
  `StackRequest.pinned`, `sizePoolPinned`, `pinnedMinimum` and the search's pinned space; `buildUnits` and
  `buildStackRequest` return everything the account can field. The March keeps `includedUnitIds` in `runStore`:
  Generate sets it from the solver's own answer and clears the player's edits, leave out / put back re-size
  with `sizeStacks` alone, in place, without touching the staleness fingerprint. §3.4 rewritten. Gates: 640
  unit tests (10 pin tests deleted, 1 rewritten), 44 e2e.
- 2026-09-13 (late) — Owner: new story **S-53 left-out troops without pins** (§5.1): Generate becomes a fresh
  solve that also resets the manual left-out list; put-back types are sized like any other, never pinned;
  `pinnedUnitIds` is to be removed. Same day, investigation 0014 (TotalStack parity on the owner's export):
  marches identical to ±1 unit in every mode, Total Optimization reproduced by "Allow damage trades", the
  damage gap is TotalStack's summary formula; §3.5's "+42,500" is explained.
- 2026-09-13 — **Spacing pass + exclusion model** merged and redeployed. Spacing from the canvas contract
  (page 3): `Glyph` a fixed 1.25 em box everywhere, March pane 420 px with pills four across, pool lines
  number-first, figures in a two-column grid, per-objective comparison table (investigation 0013 §5,
  `objectiveCompare.ts`), mercenary pills with an Inter 11/700 tier badge, percentages as numbers through one
  `Figures` component, one `Sections` separation language (hairline, 16 px) across March, Battle, Bonuses,
  sheets and popovers (`docs/design.md` §4). Two known breaches of rule 19's 13 px floor: the 12 px meta
  (`--pyr-meta`) and the 11 px tier badge — both from the contract, one variable each to revert. Model:
  march exclusions are `BattleSetup.excludedUnitIds` (schema v2; migration moves non-top-tier ids out of
  `troops.excludedUnitIds`), request building subtracts the setup's list, the Troops card no longer shows a
  "Left out" line. Gates: 649 unit, 44 e2e, 4 visual, contrast 860 pairs, size 217/42/32 kB.
- 2026-09-13 — **Published.** `development` merged into `main`; GitHub Pages (Actions build) serves
  https://altarbeastiful.github.io/pyrrhic-total-battle/ with `VITE_BACKEND_ORIGIN` set. Backend S-49a deployed
  on the "main" server beside philou: `https://pyrrhic-backend.92.5.91.253.sslip.io` (Let's Encrypt), PocketBase
  0.40.4 in `/home/ubuntu/pyrrhic/`, site block in `/home/ubuntu/caddy-sites/` imported by philou's Caddy
  (philou commits 840a6e9, 934dd24 — mount at `/etc/caddy-sites`, since a subdirectory of the read-only
  `/etc/caddy` cannot be a mountpoint); smoke test 9 passed / 3 skipped. Owner's admin-UI steps pending: Google
  OAuth client, SMTP, backup target; Dynu name later.
- 2026-09-13 — **S-30 closed** with a third in-game report (a deliberate 9-stack march) plus the Temple and
  unit-card screens (`docs/research/fixtures/ingame-2026-09-13/`, 18 screenshots). Found: our stacks strike in
  **base-damage** order, not HP order — the engine now reproduces all three reports entry for entry (28, 24 and
  20 of 21 lines) and "Rider I never attacks" is explained instead of tolerated; the enemy still kills by HP with
  a mercenary on top; the game rounds a stack's HP once, not per unit; double damage is a plain ×2 on the whole
  line. Recovery: the owner confirmed there is no retrain dialog (retraining = recruiting again in the Army tab)
  and the Temple states "revive up to 90 % of your fallen troops" — exactly `n − chunks(n)` — so revive-all
  **silver** (216,000 → 173,880) and **time** (1 d 2 h → 21 h 40 m) are the training cost of the tenth unit of
  each chunk; both `it.todo`s replaced by tests. Left open: one extra Archer II line after a round's last enemy
  attack (the account shows no strike-two-squads chance, so probably the sweep rule, not a proc) and the
  report's headline damage figure.
- 2026-09-13 — Direction A implemented from the canvas (D-55) with the owner's nine corrections (readable
  tier-coloured pills that extend, no per-stack dead list, steppers back, chips at well height, left-out row
  below, whole at-a-glance panel sticky, switches beside labels, badge retired, one Edit toggle).
- 2026-09-13 — Password account completed (reset, verification enforced, change password, delete account,
  server hardening by migration); S-46/S-47 retired. Design canvas with three page directions published for the
  owner's pick (working files in `docs/design-canvas/`); S-30 questionnaire relayed to the owner.
- 2026-09-13 — Owner retired S-46 (Google Drive) and S-47 (generic endpoint): the S-49 account supersedes both.
- 2026-09-13 — S-49b built (ADR-0009 proposed): opt-in account sync on PocketBase, Google (PKCE, real
  `/oauth-callback` path + `404.html` copy) and email/password, conflict dialog per the spec, service worker
  bypass for the backend, `storage.persist()`; Gist sync and the QR hand-off retired. Hidden until
  `VITE_BACKEND_ORIGIN` is set; Google sign-in awaits the owner's OAuth client. Pages workflow needs the
  variable on the build step when deploying.
- 2026-09-13 — Phase E: journey budgets measured in `e2e/journeys.spec.ts` (J1 3 taps, J2 4, J3 4, J5 2); rules
  compliance review (investigation 0011: 29 met, 5 partly, 0 not met) with fixes (13 px floor, PWA icons in
  the theme's palette, …); S-49a groundwork in `ops/pocketbase/` verified against PocketBase 0.40.4
  (investigation 0012). In flight: the five partly-met rules (phone sheet as the March, no inner pane scroll on
  desktop, recovery plan as a list, focus ring and roving chips, alternative objectives beside the note) and
  D-54.
- 2026-09-13 — M-09 done: React Aria kit, Tailwind, eight dependencies and the custom lint rules removed; kit,
  domain and stories renamed into place; remaining dialogs on Mantine; polish list applied; design.md rewritten
  for the theme; visual baselines regenerated; axe zero on kit page and app in both schemes; stable vendor
  chunk. Gates: 542 unit tests, 26 e2e, 4 visual, contrast 176 pairs, size 211/35/30 kB. The UI migration to
  Mantine is complete on `development`; nothing merged to `main`.
- 2026-09-13 — Mantine migration M-01…M-08 done on `development`: theme with luminance-targeted ramps, kit and
  domain on stock components, frame V1 (top bar brand + account; sticky March pane with recap and Generate
  from 1200 px; bottom bar with the quick summary and Generate plus a recap sheet on phones), Troops as
  TotalStack's one-line rows, Mercenaries pills + tier combobox, Bonuses captain chips with corner gear and
  level popover, Battle full-card choices and plain housing, March in the amended order. Gates: 842 unit
  tests, 24 e2e, build, size 238/63/36 kB. M-09 (retire Tailwind/React Aria/old kit, polish list) in flight.
- 2026-09-13 — Backlog: S-49 signed-in account sync on PocketBase with Google OAuth (owner's spec in
  docs/research), two parts, replacing Gist sync and the QR hand-off; needs ADR-0009 and a host from the owner.
- 2026-09-13 — Decision: move the UI to **Mantine 9** (ADR-0008) after spike 0007 showed every TotalStack form
  mapping to stock components with 42 lines of CSS. The React Aria kit is retired in the migration plan
  `docs/plans/ui-foundation-mantine.md`. Tailwind goes with it.
- 2026-09-13 — Owner's verdict on the rebuilt Bonuses card: "a mismatch of CSS badly designed and executed",
  the very thing the UI foundation plan was meant to avoid. Two causes accepted: (1) the coordinator specified
  the captain picker from imagination instead of copying the reference (fixed: TotalStack observed live,
  investigation 0006, story D-34); (2) the kit was hand-styled from scratch on unstyled React Aria primitives
  by parallel workers instead of being seeded from a designed component set (ui-foundation T-b, skipped).
  Decision in progress: a time-boxed spike rebuilds the three TotalStack forms on Mantine 9 in a worktree
  (investigation 0007) to choose between (a) React Aria + Tailwind seeded from a designed kit and (b) Mantine.
- 2026-09-13 — Overhaul build: foundation (tokens, kit on React Aria Components, layout, domain, kit page, lint
  gates, visual/axe config), Material 3 frame (app bar, account menu, extended FAB, supporting pane), and all five
  cards rebuilt (Troops in the TotalStack-inspired flow, Mercenaries with whole-row selection, Bonuses as switch
  rows, Battle with single-select lists, March in the amended order). Fonts bundled, Lucide + Game Icons, surface
  pass. Gates: 793 unit tests, 20 e2e, typecheck, lint, format, build green; size-limit over (263 kB vs 200 kB main)
  pending T-06/T-08. In flight: retirement of primitives/Radix/dnd-kit with lazy loading; D-19 design-direction
  plan (plan-only, awaiting review).
- 2026-09-12 — Owner: the Stacking method section must be a Material single-select list with full-row targets,
  not cards plus a select; design plan §7.4 rewritten (D-31). Owner also installed the `frontend-design` guide;
  a design-direction pass (D-19) is scheduled after the March card and the surface pass.
- 2026-09-12 — Owner's third review: (1) new story S-48 best captains for a march (§3.7); (2) Troops and
  Mercenaries do not collapse — the form is the summary, TotalStack-style; (3) revised frame accepted, app bar
  also carries a troop recap; (4) March card reordered: recap figures and the army-as-form first, dying order
  demoted to details. Asked why the UI still looks unpolished: system fonts, hand-drawn icons and border-heavy
  surfaces named as causes; Phase A2 (fonts, Lucide + Game Icons, surface pass) added to the design plan.
- 2026-09-12 — Independent design review of the overhaul frame (Material 3 canonical layouts, Apple HIG, five
  measured comparables): two independently scrolling columns withdrawn; one page scroll, sticky 56 px app bar
  carrying the answer, March as a sticky supporting pane from 1280 px, floating Generate below that. Plan §5.1,
  principle 5 and §7.5 amended. Foundation (tokens, kit on React Aria Components, layout, domain, kit page,
  lint gates) built the same day; shell, Troops and Mercenaries in progress.
- 2026-09-12 — Owner rejected the second-pass design ("hurts the eyes, unpractical"). Written up as two plans for
  review: `docs/plans/design-overhaul.md` and `docs/plans/ui-foundation.md` (M6). Nothing built yet.
- 2026-09-12 — Second pass after the owner's review: design overhaul (docs/design.md: palette, icons, hero, wording
  glossary with our own method names and unit-card structure), compact Troops/Mercenaries with always-visible
  summaries, pinned unit types persisted per setup, worst-case objective and all-types baseline in the priority
  search, HP profile chart. Measured why "maximum damage" collapses to the top tier (see §3.6).
- 2026-09-12 — First implementation pass completed (M0–M5 except S-07, S-46, S-47): see the status table in §5.
  Engine reproduces every captured TotalStack journal and recovery figure; recovery is billed in chunks of ten.
- 2026-09-12 — Engine (S-20…S-23, S-32…S-34) implemented and validated against every fixture. Reproduced
  **exactly**: all three TotalStack journals entry for entry (actors, targets, per-hit damage, hit counters),
  Arachne's 26 entries / 14 friendly hits, the Elite-Preservation monster pool (18/8/7/6 = 199), M's
  Preservation (11/5/4/4 = 123; mp-bear 17/8/7/6 = 196 with Bear V capped at 1 and Cyclops V dropped),
  Round-to-10s monsters (WE 10, dominance 30), captain Bernard's ARC1 706 × 165, every per-hit damage of both
  in-game reports (±1: the game truncates where TotalStack rounds), and all seven runs' recovery costs once the
  chunk-of-ten rule was found (§3.5). Stack counts match TotalStack to ±1 unit (±2 where several unit types
  share hpPerUnit and cost). Known gaps: the Round-to-10s **troop** solve is up to 6 units off (TotalStack
  re-solves leadership with a wider spread when rounding — unexplained); the beast-health-boost anomaly of the
  captain-bernard run (a beast bonus also raising the Water Elemental, an elemental) is treated as a TotalStack
  bug and not modelled; strict HP ordering dropped in favour of the observed non-increasing rule (§3.4);
  strike-two-squads still unmodelled; the Rider I attack-order nuance still costs us one friendly hit per fight.
- 2026-09-12 — Implementation started. Backlog: S-45 (Gist sync) written out as the first sync adapter since S-46
  (Google Drive) stays gated on a custom domain; S-46 unchanged.
- 2026-09-12 — Second in-game report read (enemy first, 4 squads, one double-damage proc): round structure and
  all per-hit numbers match; attack-order nuance recorded as an observation only. Rule adopted for the plan:
  rely on TotalStack's verified model as the reference; treat report-derived deviations as hypotheses until
  confirmed by several reports.
- 2026-09-12 — First real in-game report read from the Journal: engine formulas confirmed exactly; TotalStack's
  doubled strength-against in Battle Summary identified as their artefact, not the game's; one attack-order
  discrepancy left open.
- 2026-09-12 — Pro-trial capture session: seven runs and three journals saved as fixtures; TotalStack's battle
  model reverse-engineered and written up (`docs/research/battle-model-observations.md`); MP rule corrected in
  §3.3; S-30 narrowed to in-game validation and three open discrepancies.
- 2026-09-12 — Google Drive adapter requirements checked (investigation 0002): scope is non-sensitive, but
  brand verification needs a domain we own (GitHub Pages not accepted), a privacy policy page, and one-hour tokens
  without refresh, so only explicit Pull/Push fits. S-46 gated accordingly; Gist and generic endpoint go first.
- 2026-09-12 — Plan reviewed against the extracted data and the TotalStack fixture. Corrections: within-tier kill
  order is ranged → melee → mounted (was written melee first); fixture numbers written out with total HP per stack;
  share-link size budget added (Discord 2,000-char limit). Technical choices recorded as ADRs in `docs/decisions/`
  (0001 TotalStack fetching — pending; 0002 client-only architecture; 0003 application stack; 0004 local
  persistence and schema; 0005 share-link encoding; 0006 engine design; 0007 game-data format and contributions).
  Fixtures now cover EP with monsters, MP with monsters and a capped mercenary, Total Optimization, both priority
  searches and Round-to-10s (`docs/research/fixtures/`, captured on a Pro trial with all bonuses at 0); the
  second capture added engineers (E1–E2), non-zero bonuses (army +25/+25, guardsmen +20/+20 through captain Aydae)
  and both events (Ragnarok strength, Arachne's 8-stack formation). Per-unit HP rounding to an integer and the
  "strength-against on base strength" rule were found this way. Still uncovered: mercenaries with bonuses, temple
  level ≠ 0, training reductions, titles/artifacts/equipment values (data tables exist, application rule is the
  same additive one). Third capture added title special keys (double damage / strike two), a category bonus, a
  monster-race bonus (with an anomaly to re-check), temple 20 + training reductions with all recovery plans, and MP
  with mercenaries under a bonus. Not captured: Custom Kill Order with a reordered list, Manual HP Order edits,
  equipment/artifact popups (additive tables, low risk). The battle turn model is derived from TotalStack's
  journals but unvalidated in game; recovery-cost composition had four open equations — all but revive silver and
  revive time were solved by the chunk-of-ten rule (battle-model-observations §4).
