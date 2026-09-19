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
| S-88 The reference table drawn from the plans the bar may offer | done | owner, 2026-09-18, reading the reference table under his own bar: a row at **2.91 damage a silver** — better than any stop he was offered — and *why is that not one of my stops?* It could never have been one. The table (`CampaignPlan.curve`) was bucketed inside the search's own `record`, over **every shape the search prices**, while the stops are drawn from the band (`candidates`); his 2.91 row was a one-troop-stack march (Rider III 265 carrying 97 hired) the frontier threw away and the band's third criterion exists to refuse (experiment 104 §B, proposal P4 of experiment 105). The bucketing now runs at the end of the plan, over **the plans the bar may offer**: the band the stops are drawn from, **plus the stops themselves** — the set *as offered* and not as searched, because the put-back pass re-sizes some stops after they are chosen, and the row the player is standing on has to be findable in the table under it — deduplicated by counts (the sorted non-zero counts, the same identity the frontier diagnostic matches a stop by), the harder-hitting kept on a tie. The generated march a stop was re-sized from stays in: it is a plan of the band in its own right. Same 1.2× buckets, same `PlanCurvePoint` (`best` = most campaign damage at that level, `thrifty` = most damage a hired unit), and the bucket bookkeeping is **out of the scorer's hot loop** — `record` now books only the two peaks the payload carries (`mostEfficient`, `mostThrifty`, still measured over the whole search); `withFrontier` carries the offered marches the search never summarised (a re-sized stop, the all-in) in place of the old per-bucket bests, so every row of the table still has a diagnostic row behind it. **No stop moves**: nothing but the table reads this, and benchmark 07 (`out/benchmark-2026-09-18-07-curve-over-band`) is byte-identical to 06 on every row of every scenario, `planMs` aside — which fell on all ten (1 429 → 1 355 ms at 7 000, 1 026 → 944 at 12 000, 630 → 578 on the 4 000 case), the bucket map no longer being touched once per scored shape. Measured over the thirteen armies of experiment 105 (rows today → over the offered set, peak a silver, cheapest row): HIS BAR 11 → **3**, 2.759 → 1.987, 2 140 100 → 5 782 400 silver; 102's reconstruction 11 → 3, 2.865 → 2.133, 2 165 500 → 7 044 400; Bear V ×1 24 → 2, ×2 24 → 3, ×3 24 → 3 (0.599 → 0.581/0.588, 119 700 → 1 233 500); Bear V ×10 10 → 3 at 0.650 unmoved; the e2e seed 10 → 4, 1.024 → 0.924; the 4 000 case 10 → 3, 1.766 → 1.478; his export at 7 000 10 → 3, 2.897 → 2.123; at 12 000 10 → 3, 2.375 → 1.759; his live account 10 → 4, 1.227 → 1.052; its evening form 11 → 3, 2.283 → 1.753; his live camp 10 → 3, 2.861 → **1.385** (it had **0** of 10 rows backed by a band plan); the engine tests' synthetic army 20 → 14, its band being a wide one. Four of those tables carry a row the band alone would not have (Bear ×3, Bear ×10, the e2e seed, the export at 7 000): the `all-in`, built march by march outside the frontier — on his own bar it is the dearest row, 15 427 084 damage where the band alone would have printed the steady max's 15 169 558. The table's peak is the best damage a silver **of the offered set** and not of the bar: on three armies a band plan the stop rules passed over is still the most efficient thing offered (1.478 against the bar's 1.370 on the 4 000 case, 1.385 against 1.260 on the live camp, 1.052 against 1.005 on his live account) — which is the true answer to his question, the row being a plan the bar *could* have offered and the five stop rules what did not pick it. On screen (`PlanPanel.tsx`, design rules 4, 5 and 15): the table wears a **caption** that says whose plans they are — *“Every plan this bar may offer, at the silver it costs — the levels the stops are chosen from”* — which is its accessible name as well, in place of an `aria-label` only a screen reader heard; it is drawn from **two** rows up rather than three, two levels being a comparison and one being the bar's own figures said twice; and the line under it (*“Past about N silver, the next plan on this list buys less than one damage a silver”*) is said only where the table itself shows the slope falling — on eleven of the thirteen armies; on the other two every level still pays and the sentence would be claiming something about a level the table does not reach. Held by a criterion in `tests/engine/plan-criteria.test.ts` over every benchmark scenario plus the live camp: every row's damage/silver pair is some offered plan's campaign totals (`withTrade` plus the stops), the peak is that set's best a silver, and every stop has a row of the table at its own silver level. Pin re-based: `plan-shape.test.ts` curve length 20 → 14, dated. Built by an Opus worker, for validation by a second. |
| S-88b More mercs and the steady max kept as they are | done (decision, no code) | P6 of experiment 105, the last of the six proposals. 104 had read the steady max as exposing 69 of the 128 hired units on his bar — a **static proxy** off the opening order — and the question was whether that costs anything the bar prints. Asked of `simulateBattle` instead, on all 13 scenarios and both journals: over every steady-max and more-mercs stop the hired lost equals the chunk tithe **Σ ceil(n/10)** on **every one** of them (HIS BAR's steady max 89 fielded in 4 stacks, tithe 10, printed burn 10; the export at 12 000, 176 fielded, 19 and 19; the live camp's more mercs 80 fielded, 8 and 8). A hired stack the enemy destroys costs `ceil(n/10)` and one it never reaches costs the same — the burn is a property of the counts, not of the fight — and the one figure exposure does move, damage, is already in `repeat.damage` because `marchOf` runs both journals for it. And after S-87 the proxy reports **nothing**: no stop of any of the 13 scenarios fields a hired stack the troops do not stand over (it was 6 stops on 4 scenarios under S-77, 1 240 units on the live camp's steady max). So there is nothing left to correct on either stop and the owner keeps both. |
| S-89 The troops-only tail on the repeated stops | done | owner, 2026-09-18, choosing **P1** from the six-proposal table of experiment 105: the same offer S-81 gave the `all-in` (*"continue for the measured additions"*), made to every **repeated** stop. S-76 had made the horizon a ceiling, which was the right half of an answer and not the whole of it: a stop whose hired stock the horizon outruns played the marches its stock reached and stopped, while every sizer sequence beside it in the benchmark marched on with troops alone — so a "four-march" share was comparing one march with four and calling the difference a result. A stop that does not reach the horizon now appends the **same** march the `all-in` ends on: the Elite sizer over every troop type with no mercenary in it, sized **once** a plan (`troopsOnlyMarch`) and shared by both, priced by `toMarch` like every other march so its silver and its queue are the recap's. It is carried as `PlanTotals.tail` — the counts, how many times it is played, its damage, silver and queue — rather than as a `sequence`, because a repeated stop's hired marches *are* the march the bar draws and the row is still read "a march at a time"; a sequence would have made the fold say "4 marches, each on what the last one left", which is the one thing this plan is not. The campaign totals include it (`totalDamage`, `silver`, `gold` — nought, a march with no hired stack costs no revive gold — `seconds`, `marches`, both ratios); `mercLost` does not. **It is applied last, after every rule that chooses a stop has run**, and the rules are why it can be: the bar's order and its two ends read `repeat.mercLost`, the sweet spot's chord `repeat.damage`, the band and S-58 B the repeated march and the finale, `offer`'s dedupe and the put-back pass the counts, and `bestFor` the `repeat` ratios rather than the campaign's — so no stop choice, no burn, no knee and no band membership moves, measured stop by stop on all 13 armies of experiment 105 and re-measured here (`bestFor` is unchanged on every scenario). Measured, exactly three stops on three armies move: Bear V ×1's sweet spot **4 722 842 → 18 554 768** damage for 8 131 400 → 32 525 600 silver over 1 → 4 marches; ×2's **9 557 884 → 18 779 168** for 16 262 800 → 32 525 600 over 2 → 4; ×3's **14 168 526 → 18 779 168** for 24 394 200 → 32 525 600 over 3 → 4. The tail march is SW1 3 048 · ARC1 3 042 · SP1 3 036 · RD1 1 515 · ARC2 1 680 · SP2 1 677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 — 4 610 642 damage for 8 131 400 silver and 26d 6h — byte-identical to the bear ×3 `all-in`'s fourth sequence march. The cost the owner accepted: a stop's campaign damage **a hired unit** counts damage no mercenary bought (×1: 4 722 842 → 18 554 768 a hired, one burned either way), and damage a silver eases a little (0.581 → 0.570) because troops without mercenaries are the less efficient march on these armies. Against the calculators: ×1 and ×2 now play *literally* the Tier ladder sizer's campaign, to the unit — which is why `sweetNotAheadOnEither` goes false → **true** on both, an exact tie counting as "not ahead" — and ×3's tailed sweet spot reaches 96.9 % of TotalStack's M's Preservation at the same silver (19 388 676 for 32 535 200) where the `all-in` beside it reaches 98.6 %. On screen, one sentence in one place (design rules 4 and 5): `sequenceWords` already said where the `all-in`'s mercenaries run out, and it says it for a repeated stop in that stop's own words — "1 march, then 3 on troops alone", "1 march + a last one, then 2 on troops alone" — so the fold's summary, the bar's tip and the thumb's value text all change together and no column is added. Pins re-based with dated notes: Bear ×1 `damageFloor` 0.19 → **0.77** and `sweetLosesOnBoth` → true, Bear ×2 0.39 → **0.78** and → true — and that pin is **renamed `sweetNotAheadOnEither`**, its comparator untouched: it has always been `>=` on both ratios, so a tie has always counted, and "loses on both" reading true of a campaign that is the sizer's own to the unit is a name false on its own row; Bear ×3 and Bear ×10 unmoved (the `all-in` is still ×3's hardest campaign at 19 115 768, and ×10's **six** bears a march — S-87's shelter lowered the Elite sizer's eight to six, 21 135 368 — already last the horizon). Held by three tests: the horizon-ceiling test in `plan.test.ts`, re-based to *"fields hired units for as long as it lasts, then marches on troops alone"*; a new case there pinning the pre-tail campaign and repeat of all three armies and asserting the campaign is exactly that plus the tail, and that the tail equals the `all-in`'s last sequence march; and a criterion in `plan-criteria.test.ts` over every benchmark scenario — **every stop and the plan itself play the horizon** (the one army it could not hold on is one with no troop type to size the tail from, which none is, and which the band's own third criterion refuses anyway). Benchmark 08 `out/benchmark-2026-09-18-08-tail-on-repeated-stops`: exactly the three `Complete optimization · sweet-spot` rows differ from 07, every other row of every scenario byte-identical, stop lists unchanged. **The 08 run's `planMs` are not comparable with 07's**: the machine was under a foreign job at 800 % CPU all afternoon and would not go quiet, so 08 reads 3 071–4 079 ms on the export at 7 000 against 07's 1 526. The cost was measured instead by timing both **engines** on that same machine, back to back, best of three: the 07 engine 2 302 ms at 7 000 / 882 on the 4 000 case / 1 001 on the evening form against the 08 engine's **1 733 / 555 / 621** — S-89 is not slower on any scenario, which is what the shape predicts (the tail costs one `sizeStacks`, memoised, and `withTail` returns before reaching it on every plan whose stops already fill the horizon). **The reference table is priced as offered too**: `curve` is bucketed over `candidates ∪ stops`, and half-tailing that set printed a one-march campaign beside a four-march one and called them two levels of one ladder — on Bear V ×1 the tailed sweet spot at 32 525 600 / 18 554 768 next to an untailed candidate at 1 233 500 / 706 825 — while on ×3 the dedupe (same counts, higher damage wins) dropped a level outright. Every candidate feeding `offered` is tailed the same way now, so every row of the table is one campaign of the same length. The bear curves, before → after (rows; silver / damage): ×1 **2 → 2**, 1 233 500 / 706 825 → **25 627 700 / 14 538 751** and 8 131 400 / 4 722 842 → **32 525 600 / 18 554 768**; ×2 **3 → 3**, 2 467 000 / 1 413 650 → **18 729 800 / 10 634 934**, 10 600 000 / 6 137 087 → **26 862 800 / 15 358 371**, 16 262 800 / 9 557 884 → **32 525 600 / 18 779 168**; ×3 **3 → 2**, 3 700 500 / 2 120 475 → **11 831 900 / 6 731 117** and the old 24 394 200 row gone, its tailed self landing on 32 525 600 where the `all-in` already stood — two four-march campaigns at one silver level are one level, and the bucket prints the harder-hitting (19 115 768). No other army's curve moves. `trade`, the knee and the two peaks stay **pre-tail** and say so in their docstrings: they are points of the search's own frontier, and the tail is the same march added to all of them. The `withFrontier` diagnostic no longer double-reports a tailed stop (one `onFrontier: true` row at one march and one `onFrontier: false` row at four): a tailed copy is mapped back to the row the search summarised (`tailedFrom`), so its *“only off-frontier rows are put-back re-sizings and the all-in”* sentence is true again, and the docstring says the rows there are the search's figures, pre-tail. Stage table updated. Built by an Opus worker, for validation by a second. |
| S-90 The campaign's gold includes the finale's gold | done | The bug experiment 105's validator found on 2026-09-18, chosen for a fix by the owner the same day. `summarise` in `plan.ts` wrote `gold: candidate.marches * m.gold`, and `candidate.marches` is the **repeat** count: the finale was left out of the campaign's revive gold alone, while `silver` and `seconds` beside it have always been `repeats × the march + the finale`. So the last march of every repeated plan — the one that spends what the stock has left, and therefore the one that fields the **most** hired units of the whole campaign — was revived for free on the bar. Fixed to `candidate.marches * m.gold + (last?.gold ?? 0)`, summed exactly the way the two beside it are, with no new constant; `PlanTotals.gold`'s docstring now says so. Every other place a campaign gold is derived was checked and already agreed: the `all-in` sums `march.gold` over its own sequence march by march (it is built march by march and never had the bug), the put-back pass rewrites the **repeat** term alone (`row.gold + repeats × (march.gold − row.repeat.gold)`, `repeats` excluding the finale, so it is right on top of the corrected total), `withTail` adds `played × tail.gold` and the S-89 tail is troops alone — its `gold` is **0**, measured by the recap on all three bear armies, and summed rather than assumed so the line stays true if that ever changes — and the recommendation, the knee, the two peaks and the plan's own `total` are all `summarise`'s output. Measured, stop by stop, over the benchmark's ten scenarios and the owner's live camp (the criterion below, run on HEAD first): the evening account's silver saver **1 944 → 3 192** gold and its sweet spot **2 712 → 3 960** (Δ 1 248, the worst of them, and 61 % of the truth), more mercs 3 360 → 4 584 and the steady max 3 552 → 4 776 (Δ 1 224); the 12 000 export 2 280 → **3 464** · 3 672 → 4 824 · 4 104 → 5 256; the export at 7 000 2 568 → 3 536 · 2 664 → 3 632 · 2 928 → 3 896 (Δ 968 on all three); his live camp 4 440 → 4 976 · 5 616 → 6 152 · 5 832 → 6 368 · 6 264 → 6 800 (Δ 536); the live account at 20 000 840 → 1 344 · 1 296 → 1 760 · 1 488 → 1 928; the e2e seed 1 296 → 1 760 and 1 488 → 1 928; the 4 000 case 888 → 1 192 and 888 → 1 176; ten bears 2 400 → **3 200**. Unmoved: every `all-in` row on every army, and the three small-bear armies, whose finales field one bear and revive nothing (`revived = count − chunks(count)` is 0 for a stack of one). **Nothing else moves at all** — no damage, no silver, no queue, no burn, no stop choice: benchmark 09 (`out/benchmark-2026-09-18-09-finale-gold`) is field-by-field identical to 08 on `damage`, `silver`, `burned`, `perSilver` and `perHired` for every row of every scenario, with the stop lists unchanged; the only difference between the two files is the new `gold` column the benchmark now carries (`price` reports the recap's gold, `campaignOf` sums it, and the run asserts the engine's `stop.gold` equals it to the unit). Nothing on screen moves either: the bar and the trade table print `repeat.gold`, *"gold a march"*, which was never wrong — the campaign figure is the payload's, read by the benchmark, the experiments and anything summing the campaign. Held by three tests: `plan.test.ts` — the campaign's gold is its marches' gold as the **recap** prices them (`marchResult` → `recoveryCosts`), written out as `played × repeat.gold + the finale`, on the synthetic army at a four-march horizon (it printed 864 where its four marches cost 1 344 before the fix), and a second case pinning that a tailed stop's gold is its untailed gold on all three bear stocks; `plan-criteria.test.ts` — the standing criterion **"a stop's campaign is the sum of what its marches cost"**, over every stop, the plan itself and every march they play (repeats, finale, tail, sequence) on all eleven armies the file builds, for `gold`, `silver` **and** `seconds` at once, plus `repeat`'s own three prices. It fails on HEAD on 8 of the 11 — every army whose finale hires anything — and silver and the queue were already exact on all eleven, which is what said the arithmetic was right and one line of it was missing. Stage table extended with the 09 row. Built by an Opus worker, validated by a second. |
| S-91 The finale's silver is the recap's | done | owner, 2026-09-18: *"do the finale's silver"*, the follow-up S-90 named. `summarise` summed a repeated plan's silver as repeats × the recap's march plus the **search's raw** finale (`candidate.finale.silver`, `marchOf`'s pricing, which ignores the account's temple level and training cost reductions), while its gold and its queue read the finale priced by `toMarch` like the repeats. Every profile in the repo has temple 0 and no reduction, so the two agreed to the unit on all eleven armies — which is why the S-90 criterion did not catch it. The criterion now runs twice: as the accounts are, and **under a level-20 temple and a 25 % training discount on every group** (`WITH_DISCOUNTS` in `tests/engine/plan-criteria.test.ts`); on HEAD the discounted run fails on 9 of 11 armies, silver alone (the e2e seed's sweet spot 26 427 050 against the recap's 24 394 200 over four marches, Δ 2 032 850 — a quarter of one undiscounted finale), and passes with the finale priced by `last.silver`. The search's own ranking keeps reading the raw figure on the repeat and the finale alike, consistently; only the campaign the bar prints changed. Benchmark 10 (`out/benchmark-2026-09-18-10-finale-silver`) is identical to 09 to the unit, run and timing aside; stage table extended. Built and checked inline (a one-line engine change, the criterion run on both engines). |
| S-92 The troop steppers write their value in the tier's colour | done | owner, 2026-09-18: *"on G S and engineer and monster selection we should have colors for the G1-G2 S1,... in total battles. You can take inspiration from total stack for this … the colors are the same for all troops only the mnemonic Gx Sx should be colored"*. Observed on totalstack.ca first (investigation 0021): only the value text is coloured, one colour a tier whatever the group (G1, S1 and E1 the same slate; G3 and M3 the same blue; the mercenary pill "EMH 6" in G6's red), the well and the arrows unchanged. Ours does the same: `TierSelect` writes its value in `tierInk(tier)` — the ink the tier badge and the march pill already use, moved from `domain/unitGroup.ts` to `kit/tiers.ts` so the kit does not import the domain, and re-exported where it was — the "—" position in the muted ink; no new colour, no new CSS (the tier inks were already checked against the sunken well by `pnpm contrast`, 860 pairs). The kit story shows one stepper of each tier; its two baselines are re-based in the same commit. TotalStack's tiers I–VI agree with our palette in hue; its VII–IX (yellow, silver, green) do not, and were **not** copied: under our one-luminance ladder they would land on tier V's gold, tier I's slate and tier II's green (the note says why) — the owner's call, and moot on his account today. **Pre-existing, not touched:** twelve other kit-page baselines (glyph, delta text, stack pill, …) fail the visual compare on HEAD on this machine before this story, by emoji and font rendering; only the stepper's two were re-based. Held by a test in `TierSelect.test.tsx`: G3 and S3 carry the tier III ink, "—" the muted one. |
| S-93 The tighter shape: the march the owner reaches by hand | done | owner, 2026-09-19: *"again the same problem when adding back troops … using Troops first I can get 2 009 810 … by adding back troops, impossible with Complete optimization. With full opt I still get 70 mercs even with the sweet spot; also no eco silver spot to allow me to maximize silver/dmg with lower silver and training time whilst preserving merc spent low. I thought we had tests for this."* Experiment 107 found two suspects, and experiment 108 (`tools/theorycraft/out/108-thrift-end.md`) measured both over thirteen armies. The band's token-field yardstick is **not** the defect — all four alternatives were measured (§A): half the sweet spot's fielded hired and half its burn still refuse his march and cost two sweet spots; no criterion at all makes the 7 000 export's thrift stop a **506 032**-damage march for 278 400 silver, 8.6 % of its steady max, which is the extreme his own instruction names; half the winner's damage a march works but buys nothing the shape below has not already bought. Nor were the sheltered-maximum vectors (§B): they add frontier rows and move no criterion on any army. The defect is a missing **shape**. The search asks the sizer for the *whole* army and the ladders for a *prefix*, and nobody ever asked the **sizer** for a prefix — which is exactly what a player builds when he leaves the low tiers out and puts them back one tier at a time. `tighterShape` re-sizes every rung of the burn ladder, and every stop the ladder does not carry, with the sizer over each prefix of the troop ranking under each of the three methods, its own hired counts as the caps, and takes the result only when it is behind on **none** of damage, silver, the stock burned and the training queue, one strictly better: no rate, no cap, no constant. It runs tighter shape → put-back → tighter shape, because a put-back spends damage for silver and queue and can land on a march a prefix beats outright. The `all-in`'s own march builder gets the same prefix shapes. **Two new criteria in `tests/engine/plan-criteria.test.ts`**, over the benchmark's ten armies, the owner's four, his live camp and his camp of 2026-09-19 at both readings of the Battle card (added to the shared list): *no stop is beaten on every reading by a sheltered march the account can field* (failing on HEAD on the e2e seed and the 4 000 case, the `all-in` on both) and *the thrift end is offered* (failing on HEAD on his camp: the sizer over his seven troop types stands at 3 burned and 2 046 502 for 1 991 000 where the bar's thriftiest stop burns 6). On his camp the recommendation becomes the five-stack march at **50** hunters — 2 509 413 for 2 321 200 and 8d 21h, against 70 hunters for 2 775 600 and 13d 18h. **What it does not do**: his camp of 2026-09-19 still gets **no eco stop**. His own 25-hunter march — 2 169 458 for 1 997 400, 1.086 a silver, **3** burned — stays out of the band, refused by the token-field half rule (the winner fields 90, so the band asks for 45); §A measured the four alternatives to that rule and none is worth its cost. His thrift end moves **left in the stock and the queue and right in silver**: 60 hunters / 6 burned / 2 141 540 for 2 091 400 and 10d 5h → 50 hunters / 5 burned / 2 509 413 for **2 321 200** and 8d 21h — 17 % more damage, 11 % more silver, a chunk less of the stock, 13 % less queue. His localStorage dump (450 hunters) keeps its three rung stops to the unit (sweet 38h/4b 2 520 042 for 2 268 000; more-mercs 60h/6b 2 600 334 for 2 707 500; steady 75h/8b 2 843 021 for 2 707 500) and only its `all-in` moves, 168h/17b 4 342 242 for 2 771 800 → 174h/18b 4 489 913 for 2 844 600. Benchmark 11 (`out/benchmark-2026-09-19-11-thrift-end`): the `all-in` moves on **eight** of the ten scenarios (Bear V ×1 and ×2 carry no such stop) — the e2e seed 28 781 642 / 36 125 500 / 30 → 30 324 441 / 33 291 200 / 30 (more damage for less silver), the 7 000 export 22 518 504 / 14 337 600 / 93 → 23 447 087 / 14 728 200 / 93, the evening account 29 111 661 / 17 179 200 / 78 → **32 348 459 / 19 316 400 / 89**; the 12 000 export gains a fifth stop and its knee walks from the 17-burn rung to the 10. **Two all-in costs, disclosed**: on the live account at 20 000 the stop pays 31 092 400 → **42 085 900** silver (+35 %) for +1.3 % damage at the same 30 burned — the stop's own tie-break is "most of the stock fielded, then most damage", with no silver term, and this is that rule taking a harder-hitting, dearer shape; and the bear armies' all-ins buy their damage dearly too (×3: 19 115 768 / 32 525 600 → 22 661 258 / 50 131 400; ×10: 21 700 948 / 45 577 400 → 25 039 888 / 56 000 000). A third cost was a **defect** and is fixed: the prefix shapes used to be scored after the `share` walk and always at the whole remaining stock, so the "most hired first" tie-break could take a shape the walk had never sanctioned — the evening account's campaign came out at 28 647 490 for 24 858 800 and 175 burned, beaten on damage, silver **and** burn by the "more mercs" stop beside it. They are scored inside the walk now, and a candidate the shape already found beats on all three is refused; a new criterion (*no stop of the bar is beaten by another stop of the same bar*) holds it on all thirteen armies and fails on the working tree without the refusal. planMs (one machine, one sitting): 15 → 42, 24 → 40, 16 → 39, 24 → 62, 42 → 89, 629 → 763, **1 394 → 1 673** at 7 000, 971 → 1 237 at 12 000, 38 → 78, 576 → 711. |
| S-94 The plan stands on reliable damage | done | owner, 2026-09-19: *"average damage is not average for sure; it's too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable damage actually."* The game decides who opens a fight, 50/50, and our two journals are the two outcomes — the enemy first (`minDamage`, the recap's **Worst opening**) and the army first (`maxDamage`). The plan ranked, priced and printed their **midpoint**: a figure no single fight ever pays out. It now stands on the bad flip. **One line decides it** — `marchOf` in `src/engine/plan.ts` returns the enemy-first journal's total (and that journal's strike count), and every figure downstream follows without a second reading anywhere: `PlanMarch.damage`, `PlanRepeat.damage`, `PlanTotals.totalDamage`, both ratios, the burn ladder and its knee, the band, the curve, the put-back and tighter-shape percentages, the `all-in` and the troops-only tail. **Hard-switched, no `CampaignInput` option**: an `objective` flag would have to be threaded through `makeScorer`, the ladder, the sizer shapes, the put-back and the tail, and would double every pin and floor, to offer a reading the owner has just rejected; the player who wants the other two figures has them on the recap, which is untouched (`simulateBattle` still prints worst, expected and best). **Measured first** (`tools/theorycraft/out/109-reliable-damage.md`, experiment 109, run on both engines): the midpoint stood 1.2–4.0 % above the worst opening on most stops, 9.3 % on his live camp's sweet spot and **33 %** on a bear army's `all-in` — widest exactly where the bar spends most, because the top-HP stack is the enemy's first kill and strikes only if the army opens. §D: **no** march on any frontier is unsheltered (S-87 closed that family), so what is left of the gap is a *troop* stack's, and the frontier still carries 36–56 % coin flips on the one-troop-stack shapes the band refuses. **What the re-ranked bar does**: the 7 000 export gains a fifth stop (a silver saver at 7 burned) and its `all-in` gains **+20.4 %** of reliable damage a march (5 484 951 → 6 603 524); the 12 000 export loses its `all-in` (behind the steady max on damage, silver **and** the stock at once) and its rungs shift one place left; the evening account loses its silver saver and its steady max climbs 17 → 19 burned for +5.6 %; bear ×3 and ×10 `all-in`s gain +20.1 % and +25.0 %; the e2e seed and the 4 000 case do not move at all. A deep ladder is what the bad flip wants, so the search now **fields every troop type it holds** on the owner's camps — the put-back pass finds nothing left to put back on any of experiment 103's four setups, which is his own 2026-09-18 complaint answered by the objective rather than by a pass. **One engine rule follows it**: the `all-in` is not offered when a stop beside it burns strictly less of the stock and is behind on neither damage nor silver (equal burn is *tempo*, which the three figures cannot see, and that stop exists to show it). **Criterion** (`plan-criteria.test.ts`, failing on HEAD on all thirteen armies): every stop's `repeat.damage` is the recap's `minDamage` on its counts and its campaign is the sum of its marches', to the unit. **Benchmark 12** `out/benchmark-2026-09-19-12-reliable-damage`: every row — plan, sizer and captured answer — priced on `minDamage`, and the shares mostly **rise**, because the rivals are searched on average damage and give up more of themselves than we do (bear ×1 0.776 → 0.981, the evening account 0.401 → 0.861 and its `silverFloor` exception would no longer be needed at 1.075, the live account 1.004 → 1.176; only the 12 000 export falls, 0.963 → 0.948). **No pin and no floor is re-based here** (owner, 2026-09-19: *"the benchmark is like non-regression tests. A given scenario should not be worse, or it's a discrepancy, or a new baseline needs to be registered by me if the trade is ok."*). Instead the mechanism the rule needs is built: `pnpm bench:baseline` runs the benchmark and writes **`tests/engine/plan-baseline.proposed.json`** — every stop of every scenario with its campaign damage, silver, gold, queue, burn and both ratios, plus each scenario's standing ratios against the best sizer sequence and each comparable TotalStack row, all on the worst opening — with `registeredBy: null`. Nothing reads a proposal; the owner registers one by setting `registeredBy` and renaming it to `plan-baseline.json`, and from then on `checkBaseline` holds every run to it: damage not lower, silver not higher, burn not higher, both ratios not lower, the scenario's standing ratios not lower, a lost stop a failure and a new stop reported rather than failed, all to the unit with no tolerance (`tests/engine/plan-baseline.ts`). **Eight assertions are left failing** for him to judge with the proposal in hand — four benchmark pins (`stops` 4→5 at 7 000, 5→4 at 12 000 and 5→4 on the evening account; `externals.damageFloor` 1.02 against 1.018 on his live account at 20 000). A fifth is **masked**: 12 000's `damageFloor` 0.96 against a measured **0.948** is the one share of the ten that falls, and the test never reaches it because the `stops` assertion above it fails first — it will surface the moment he registers the stop count and four criteria floors (the synthetic army, 7 000 and 12 000 in `plan-criteria.test.ts`, plus the 7 000 sweet-spot campaign threshold), sixteen individual floors in all. **UI**: the plan's damage wears the recap's own name and mark — 🔒 "Worst opening" on the trade's head, "6.9M worst opening a march" on the bar's tip and the fold, "Fought to the end: … worst-opening damage" (design rules 5, 21 and 26 — one name a thing, through the whole flow). **Open, and it is a trade for the owner, not a rounding**: on the Aydae-alone camp at 4 975 this bar is **worse like for like**. Priced on the same reliable reading, HEAD offered **4** stops there with a 17-burn steady max at **4 773 281** a march and an `all-in` campaign of **19 265 325 for 10 961 600 silver and 101 burned**; the reliable bar offers **3**, a steady max of **3 387 893**, and an `all-in` of **18 744 735 for 11 240 800 and 111 burned** — less damage, more silver **and** more of the stock at once. The search stops reaching the 17-burn family (the ladder tops out at 7, the frontier carries 4–14), so it is the rung stops' vector coverage under the new objective rather than the reading, and it is the one army measured where the reliable bar loses on every figure; a follow-up owns it. The put-back's queue guard is also left without an army that exercises it. The two files whose own headers tell a reader to update them in place with the reason — `plan-shape.test.ts` (the frozen plan) and `plan.test.ts` (the contract's figures) — **were** updated, with the measurement beside each; the owner's rule is about the benchmark's pins and the criteria's floors, and neither of those was touched. |
| S-96 The plan fields and shelters dominance-pool monsters | done | owner, 2026-09-19: *"fix why the monsters are not shielded in the generated stack"*. **Experiment 110 answered the question with a correction**: the monsters were not unsheltered, they were **absent**. Two different units answer to "monster" — a *monster mercenary* (`kind === 'mercenary'` tagged `monster`: Bear V, Cyclops V …, paid from **authority**, which is what his camps hold and which S-87 has sheltered since 2026-09-18) and a *dominance monster* (`src/data/tables/monsters.json`, 28 types over tiers 3–9, the `monsterMinTier` / `monsterMaxTier` window the profile unlocks). On a synthetic camp holding 12 of them at 900 dominance and another holding 20 at 20 000, the Battle card's sizers field **17 to 21** monster stacks and the plan fielded **0 of 12** and **0 of 20** — on every stop, on every march of every stop — because every line of `src/engine/plan.ts` that names the hired set was typed to `pool === 'authority'`: `mercTypes`, `unlimited` and its stock (`request.housing.authority ÷ cost`), the three `shelterUnder` call sites, `putBackOn`'s `keep`, `shapeScorer`'s own `mercTypes`, and `marchOf`'s billing, which sent a dominance stack down the **troop** branch — a per-unit retrain, no chunk burned, no revive gold, no dragon coins, i.e. **free on the one axis the whole bar is ordered by**. The shelter criterion passed vacuously: a march with no monster in it has no monster over the troops. **The fix is one word said in eight places, and two rules that had to come with it.** The hired set is now `pool !== 'leadership'` — mercenaries and monsters alike — and with it `unlimited` (bounded by `request.housing[pool]`, so an uncapped monster reads the dominance pool exactly as an uncapped mercenary reads authority; every monster is uncapped, since `caps` is written only for selected mercenaries), the grid, `stocked` and S-58 B, the sizer's unit filter, `putBackOn`, `tighterShape`, the `all-in`'s builder, the tails, and the three shelter filters. `marchOf` bills by pool: `leadership` → per-unit retrain silver, **everything else** → a chunk of ten into `mercLost` plus `retrainOne`'s own bill, which for a monster is chunk silver, chunk queue, chunk **dragon coins** and the revive gold together and for a mercenary is the revive gold alone (`recovery.ts`, `byChunk = unit.pool !== 'leadership'`). **`mercLost` stays the one rare-stock axis**, monsters pooled into it: the owner's rule is the same sentence for both, and "burned" on the bar means the chunks a march does not get back whoever paid for them. `toMarch` prices every fielded stack with one `retrainOne`, which *is* `recoveryCosts`'s own sum, and `PlanMarch` / `PlanTotals` carry **`dragonCoins`** beside `gold` (optional on `PlanRepeat` alone, so the UI's hand-built fixture rows still compile). **The two rules that had to come with it**, both measured, both defects the monsters merely exposed: (1) **`marchOf` breaks a tie in total HP by the kill order** (`buildKillOrder`, carried on `Effective.rank`) as `sizeStacks` and the recap always have — on the 20 000 camp the sweet spot stands Black Dragon 4 and Crystal Dragon 10 at **3 600 000 HP each**, and the plan and the recap read 188 477 435 against **192 221 435** for the same counts, because a dragon that dies one slot later strikes once more; no army in this repo could tie before; (2) **`fitsHousing`** — `ladder` has always refused a ladder the *leadership* cannot pay for, and the other two pools now get the same sentence, because an uncapped type is bounded by its pool *as if it were the only one there*, which is true of the one unlimited mercenary an account hires and false of twelve uncapped monster types: measured before the check, the ladder shapes proposed marches needing **4 693 to 10 739** dominance against a 900-dominance camp. **Scenario 11** (`plan-scenarios.ts`, additive, no existing pin touched): experiment 110's **900-dominance camp** — the first-run army, the e2e seed's 83 hunters and six Bear V, monster tiers 3–5, 20 000 leadership. Three stops, fielding **9, 9 and 11** of its 12 monster types with **0 exposed** and 795 · 879 · 898 of the 900 dominance in use, burning 23 · 26 · 28 chunks a march (97 · 106 · 112 over the campaign) and the first dragon coins the bar has ever printed (6 840 · 7 200 · 7 720 a march), for 91 948 255 · 94 687 477 · 95 348 743 over four marches — **0.911** of the best sizer sequence and **0.958** of its damage a silver (so the file's ordinary 95 % floor holds with no exception), and ahead of *both* plain sizer rows on damage **and** silver **and** stock at once (Tier ladder · all types 79 635 913 for 35 450 400 at 114 burned, Troops first · all types 82 845 061 for the same at 113, against the sweet spot's 91 948 255 for 35 274 000 at 97). **This camp is registered because its search finishes**, and its pins depend on that: about **7 100 ms** run alone and **8 500 to 9 200 ms** inside the suite, a margin of roughly **2.7×** under the 25 000 ms `CAMPAIGN.budgets.plan`, so the bar is the engine's answer and the same one on every machine. Its 20 000-dominance sibling is **not** registered, and why is a finding: its search ran **25 846 to 28 009 ms** in every run measured — alone and in parallel alike — so it is always cut off by the budget and the bar it answers with is whatever the search had reached when the clock ran out rather than what the engine finds. A scenario whose pins are the clock's is not a non-regression test. **Criterion** *"the plan fields the pools the account holds"* (`plan-criteria.test.ts`, on all fourteen armies): every pool the army holds is fielded on every stop, the burn is exactly the chunks of every non-leadership stack the march loses, every hired stack of every hired pool is under the lowest troop stack, and every march fits the housing pool by pool. It **fails on HEAD (e2b8d3e)** on all three stops at once — `sweet-spot fields no dominance stack (the army holds 12 types, housing 900)`, and the same for `steady-max` and `all-in`. The S-87 shelter criterion is widened to `pool !== 'leadership'` (the same stacks on the ten armies that predate the camp), `hiredOf` and the benchmark's `hiredIds` with it, and the recap-sum criterion now adds **dragon coins** to silver, gold and the queue. **Benchmark 13** `out/benchmark-2026-09-19-13-dominance-monsters`: **not one figure of any of the ten older scenarios moves** — every damage, silver, gold, queue, burn and both ratios identical to the unit, checked field by field against snapshot 12 — because none of them owns a dominance unit. **What the widening costs those ten in search time is inside this benchmark's run-to-run variation, and two sittings disagree on its sign** — stated as measured rather than smoothed. Back to back on one machine, three alternating rounds (HEAD first, then S-96, so the second of each pair had the warmer cache): the ten total 4 938 → 4 244, 4 776 → 4 532 and 4 660 → 4 353 ms, a median of 4 776 → **4 353 ms, −8.9 %**, with the five small armies (27–84 ms) **3–12 % slower** and the five large ones **5–14 % faster**. A second sitting — the validator's, and snapshots 12 → 13 — measured the same ten at 4 864 → **5 174 ms, +6.4 %**, the 7 000 export 1 211 → 1 588 and the 12 000 1 133 → 1 465. One `retrainOne` a hired stack and one `fitsHousing` a shape are of the same order as the noise, so the size and the direction are both below what this measurement resolves; the new monster camp's own search is 7 052–7 460 ms alone against HEAD's 99–104 ms on the same army, where HEAD fields no monster at all. **No pin, floor or baseline is re-based**; the eight assertions S-94 left red are still the only red ones, and the new camp is in `plan-baseline.proposed.json` with `registeredBy: null` for the owner. **Open**: the 20 000-dominance search does not fit the budget (widening the hired set from two types to twenty-two is what costs it, and `CROSSED_TYPES` crossing four of twenty-two is where to look); the bar carries `dragonCoins` and **nothing holds it yet** — the benchmark's JSON rows and `plan-baseline.proposed.json` record marches, damage, silver, gold, queue and burn and **no dragon-coin column**, so a baseline the owner registers today cannot catch a dragon-coin regression (adding the column would have moved the serialised rows of all ten older scenarios, which is why it is a follow-up and not this change); no UI reads the figure either; and the Battle card's **Tier ladder** still stands the monsters on top — experiment 110 §3 shows *Monsters after troops* turns 21 exposed stacks into 1 and that the default is off on purpose, as TotalStack parity, which is a UI question and not this one. |
| S-97 The top of the burn ladder, and the all-in re-sized instead of dropped | done | The two regressions S-94 disclosed and left open on the *"Aydae alone, 4 975"* camp (experiment 103's setup: one captain, the two top guardsman tiers clicked out, hunters 83 · legionaries unlimited · chariots 10 · arbalesters 60, 4 975 leadership against 2 180 authority). **Measured first** (`tools/theorycraft/111-coverage-and-all-in.test.ts`, `out/111-coverage-and-all-in.md`, run on both engines over the fifteen armies `plan-criteria.test.ts` holds its criteria on). **(1) The coverage, and its cause.** The burn sweep walks **down** from the search's winner — *"every burn level between the ends gets a rung"*, and the ends are the winner's burn and one chunk — so the winner's burn is the **ceiling of the whole bar**. That was harmless while the winner was the dearest march the search could find, and stopped being so the moment the plan moved onto the worst opening: a march ranked on the bad flip wants **many** stacks carrying the damage, so the winner became a deep ladder over every troop type the account holds — the shape with the **lowest floor**, and the floor is what shelters the hired stacks (S-87), so it is also the shape that fields the **fewest** of them. The winner went thrifty and took the bar's top with it. On that camp the burn ladder topped out at **7** chunks and 3 387 893 a march while the sizer's own sheltered marches over 7, 6, 5, 4 and 3 of its troop types stand at 10, 12, 13, 17 and 23 chunks for 4 074 558 to **4 773 281** (anchored at the counts that last the three repeats a rung plays); on **ten of the fifteen** armies some sheltered march above the top rung out-hit it. **The mechanism, chosen on the figures.** Three were on the table. Scoring the sheltered-maximum *vector* per prefix (experiment 108 §B measured and declined it for the thrift end) **is** what the top end needed — but as a vector alone it is not enough: `evaluateVector` builds ladders and the sizer over the **whole** army, and on an account whose troops are cheap the whole-army sizer's floor lowers the vector straight back to the winner's burn (measured on the 12 000 export: all five swept vectors, 18 to 22 chunks, came back as the same 17-chunk march at 8 014 627). So the **shape** is scored too: `ShapeScorer` now takes a **prefix**, and the top pass asks the scorer for the sizer over the strongest *k* troop types at the vector its own shelter allows — which gives it the finale and the repeats every other candidate gets. Keeping a rung whose damage *a hired* beats the rung below was not needed: on every army measured the rungs the pass adds out-hit the ones below them outright. **It is scored, not chosen**, and that is measured rather than scrupulous: the winner is the **band's yardstick** (a plan is offered only if it fields at least half the hired units the winner's march fields), and letting these vectors win moved it on his camp of 2026-09-19 — the band went from 4 · 5 · 8 burned to 8 · 9 · 10 and the bar's thriftiest stop from **4** chunks to **8**, so S-93's *"the thrift end is offered"* began to fail on it. Frozen, that camp’s band keeps its thrift levels — 4 · 5 · 8 chunks are all still offered and the criterion passes. Its **bar** still moves, and that is the pass working rather than the yardstick slipping: the rungs it adds above the winner are read by every rule that picks a stop. The plan's own campaign (`CampaignPlan.totalDamage`, the *"Fought to the end"* line) stays the search's winner; the bar could already carry a campaign above it through the `all-in`, and now a rung can too. **(2) The all-in.** S-94 drops it when a thriftier stop is behind it on neither damage nor silver. The honest answer to a badly-shaped stop is to **re-size it**: the walk that builds it asks each shape *"how much of the remaining stock can you shelter?"* and keeps the one that shelters the most, and nobody then asked *"and what is the best shape for that much?"* So each march is re-scored at the vector it settled on, under S-93's own rule — behind on none of the hired it fields, the chunks it burns, its damage and its silver, one strictly better. On the owner's **live camp of 2026-09-18** that is the same 347 hired and the same 36 chunks for **2 509 790 damage at 1 559 600 silver** where the walk had settled on 2 844 600 — 45 % of the march's silver, for nothing — and the stop comes back on that bar (10 899 547 for **6 653 700** over four marches, which the steady max's 15 306 859 for 9 849 200 no longer beats on silver). On the **12 000 export** it changes nothing and the drop stands, honestly: the strongest shape at the vector it settles on *is* the shape it settled on, and the campaign is behind the steady max on damage, silver and the stock at once (31 308 140 for 23 696 200 and 90, against 31 963 845 for 21 035 600 and 82). **What the bars do.** Eleven of the fifteen armies do not move at all. *Aydae alone*: **3 stops → 3**, but the ladder’s top goes **7 → 17** chunks and 3 387 893 → **4 773 281** a march (the exact figure the engine before S-94 reached), and the sweet spot 6 → 10 chunks, 3 314 477 → 4 074 558 a march and **13 253 690 → 15 533 933** over four marches for 7 351 600 → 7 682 800 silver; the steady max’s campaign 13 473 938 → **17 630 102** for 7 351 600 → 8 448 400, and the `all-in` is untouched. *His live camp of 2026-09-18*: **3 stops → 3**, and the three are different ones — sweet · more-mercs · steady becomes sweet · steady · `all-in`. The sweet spot 8 → 12 chunks, 2 880 077 → **3 544 681** a march and 10 870 675 → 12 864 487 for 8 596 400 → 8 736 800; the steady max 10 → **15** chunks, 3 285 305 → 4 358 805 and 12 086 359 → **15 306 859** at the same 9 849 200 silver; the `all-in` back. **A trade, disclosed**: the bar *loses its more-mercs rung* — 9 chunks, 2 933 049 a march, 11 029 591 over four marches for 8 596 400 — because the ladder above it is new and the middle of the gap between the knee and the top lands elsewhere. *His camp of 2026-09-19’s localStorage dump*: 3 stops → 3 and every one of them moves. The sweet spot 4 → **5** chunks and 2 385 168 → 2 423 299 a march (9 068 238 → 9 182 631 over four, for 8 746 700 → 8 736 800); a *more mercs* rung gained at 10 (2 793 778 for 2 687 500); the top rung 5 → **18** chunks and 2 423 299 → **3 976 648**. **A trade, disclosed**: its `all-in` is **gone** — the 18-chunk march it alone used to offer is the steady max now and `offer`’s dedupe refuses a second row of it — so the bar’s dearest campaign falls from 15 906 592 for 11 378 400 and 72 chunks to 13 842 678 for **10 476 500** and **57**, less damage over the four marches for 8 % less silver and fifteen chunks of stock kept, and the recommendation burns a chunk more than it did. *The 12 000 export*: the sweet spot 9 → **17** chunks and 27 104 076 → **31 546 458** at the same silver, the steady max 17 → 22 and 31 546 458 for 18 790 400 → 31 963 845 for **21 035 600**, the silver saver 8 → 10 chunks for 13 096 400 → **12 539 600**, and the bar **loses its *more mercs* rung, 4 → 3 stops** — a trade, disclosed: 8 more chunks on the recommendation for 16 % more reliable damage at the same silver, 12 % more silver on the steady max for 1.3 % more damage, and one fewer split on a bar the owner wants three to five of. **Criteria** (`plan-criteria.test.ts`, the shared list, now fifteen armies): *"the bar's top rung is not beaten by a sheltered march the account can field at a higher burn"* — **failing on HEAD (7b5e02e) on four** of them (the 12 000 export, his live camp, his localStorage dump and Aydae alone, the last with six marches above its top rung) — and *"an all-in is offered whenever a sheltered march fields more hired than the steady max for less silver"*, failing on HEAD on his live camp (96 hired against 93 for 3 544 681 against 3 285 305 at 2 264 700 against 2 635 500, and no `all-in` on the bar). `shelteredRivals` gains an **anchored** reading for the first of them (a march the account can send once is no rival for a stop that marches four times) and is widened to every hired pool, S-96's own sentence. **Scenario 12** (`plan-scenarios.ts`, additive, no existing pin touched): *"Aydae alone, 4 975"*, pinned at the figures of the day — 3 stops, 0.94 of the best sizer sequence, `winsHired` false (the unlimited legionaries let Troops first field 486 757 a chunk against the plan's 419 836, while the plan out-damages that row by 38 %). **Benchmark 14** `out/benchmark-2026-09-19-14-coverage`: **not one figure of ten of the eleven older scenarios moves** — every damage, silver, gold, queue, burn and both ratios identical to the unit — and the 12 000 export moves as described, its share of the best sizer sequence rising **0.948 → 0.961**, which un-masks the `damageFloor` S-94 left failing behind a stop count. **Search time**, back to back on one machine over the fifteen armies, four sittings: **13 184 → 13 277**, **13 316 → 13 673**, **13 316 → 14 054** and **13 419 → 13 849 ms** — **+0.7 % to +5.5 %**, a median of about **+3 %**, which is the same order as this measurement's own run-to-run spread (the same engine came back 13 277, 13 673, 13 849 and 14 054 on the same fifteen armies). The pass is at most a dozen extra vectors and 24 sizer shapes an army. The only scenario anywhere near its budget is the monster camp, 7 292 → 7 645 ms against `CAMPAIGN.budgets.plan`'s 25 000. **No pin, floor or baseline is re-based**; the eight assertions S-94 left red are still the only red ones, and `tests/engine/plan-baseline.proposed.json` carries the twelve-scenario bar with `registeredBy: null`. Two files whose own headers tell a reader to update them in place **were** updated, with the measurement beside each: `plan-shape.test.ts` (`leftOut` 288 → 283 — the marches the pass adds dominate more frontier rows than they add; every other figure of that frozen plan is unmoved to the unit) and `plan.test.ts` (the Aydae steady max's floors, 3 387 893 / 1 840 000 → **4 773 281 / 2 203 500**). **Open**: the top pass is deliberately kept out of the winner, so `CampaignPlan.totalDamage` — the plan’s own campaign, unmoved on every army — can sit below a rung of its own bar (Aydae: 13 473 938 against the steady max's 17 630 102) — splitting the band's yardstick from the plan's own campaign is the clean fix and is a story of its own; the 12 000 export's lost *more mercs* rung; and the `all-in` on his live camp is now offered at 133 chunks for 10 899 547 against the steady max's 52 for 15 306 859 — cheaper in silver, far dearer in stock, which is a judgement the bar shows rather than makes. |
| S-95 The band's yardstick is the goal, not the count of mercenaries | done | owner, 2026-09-19, on his camp at 5 100 / 2 200 with 120 hunters: the seven-type march with 25 hunters he builds by hand — 2 169 458 for 1 997 400 silver, **3** chunks burned and 5d 14h — is *"more efficient a silver than the sweet spot and it burns less"*, and the bar will not carry it. Experiment 107 found the rule that refuses it: the band's **token-field arm**, `hiredOf(row.counts) * 2 >= goal.hired`, half the hired units the **winner's** march fields (the winner fields 100 there, so the band asks 50 and his 25 are out). Experiment 108 measured five readings of that arm before S-93 and declined them all; **S-94 put the whole bar on the worst opening, S-96 widened the hired set to every pool and S-97 added the top-of-the-bar pass**, so everything under that measurement had moved. **Measured again first** (`tools/theorycraft/112-band-yardstick.test.ts`, `out/112-band-yardstick.md`, four readings over the fifteen armies `plan-criteria.test.ts` holds its criteria on, on the engine that runs them). **The count loses on the arm's own terms, and that is the finding.** *It does not refuse the extremes it exists for*: on the first-run armies with one, two and three Bear V the winner's own march fields a token of the stock, so half of it asks for almost nothing and the band keeps a plan worth **14.7 %, 14.4 % and 14.7 %** of that army's steady max damage — the *"just don't show the extremes"* the arm was written for. Read on **damage** the worst the band keeps anywhere in the fifteen is **37.8 %**. *And it refuses the plans the owner reaches by hand*: on his camp of 2026-09-19 every plan of his own family — five or more troop stacks, twenty to thirty hunters — was outside the band, **0** of them under the count against **41** under the damage reading; on his live camp of 2026-09-18 the band's thriftiest plan burned **8** chunks while the sizer's own sheltered march at **7** does 2 230 444 for 1 942 700 in 5d 9h. **The rule is therefore the owner's sentence read on the axis the goal is measured on**: a plan is a token field when its march does **less than half the damage the plan's own winning march does** — *"we're too far off from our goal"* is a sentence about the goal, and the goal is damage, not a count of hired units. Every threshold in the band is still measured against `chosen` and never a free-standing number, so the plan is inside its own band by construction. The other two readings are declined **on the figures**: half the **sweet spot's** damage gives the *same bar on all fifteen armies* with a floor 3 to 10 points lower (it refuses less and buys nothing), and half the sweet spot's **burn** is the worst of the four — it keeps the count's own **14.4 %** floor on Bear V ×2 (half a one-chunk burn asks for nothing) *and* adds an **18.4 %** extreme on the 4 000 case and **19.6 %** on the monster camp, with the live account's silver saver down 40.8 % in damage and his own camp's *recommendation* down 14.3 % at the same silver. **What it buys, army by army.** His **450-hunter camp gains the eco stop outright**: a fourth stop, `silver-saver` at **3** chunks — 30 hunters over five troop stacks, 1 882 911 for 1 790 200 in **6d 21h** — beside a recommendation that moves 5 → 4 chunks (2 423 299 → 2 385 168 for the same silver). His **live camp of 2026-09-18** gains one too: three stops → four, the recommendation 3 544 681 / 2 264 700 / 12 chunks / 8d 16h → **2 249 888 / 1 766 400 / 4 chunks / 4d 19h** (22 % less silver, a third of the stock, half the queue). **A trade to weigh on that army: the 12-chunk march is not kept** — the bar's new *more mercs* is a different plan, 3 285 305 / 2 635 500 / 10, which is 7.3 % less damage for 16.4 % **more** silver than the march that left the bar. (On the 7 000 export the old recommendation *is* kept, as that bar's *more mercs*.) The **evening account** gains a `silver-saver` and rises: its recommendation 25 539 281 → **28 140 302** over the campaign (+10.2 %) at +0.2 % silver. **What it costs, disclosed rather than smoothed**: on the **7 000 export** the recommendation falls 20 079 262 → 18 796 348 over the campaign (−6.4 %) for **3.1 % more** silver at 44 → **35** chunks — the one fall that is worse on two readings at once, against nine chunks of the rare stock kept and its old march still on the bar as *more mercs* — and its silver saver 16 217 218 → 16 115 314 (−0.6 %) for 8 293 900 → 8 695 000 (+4.8 %) at 35 → 32 chunks. **Benchmark 15** `out/benchmark-2026-09-19-15-band-yardstick`: **ten of the twelve scenarios do not move by a single figure** — every damage, silver, gold, queue, burn and both ratios identical to the unit, including the 12 000 export, Aydae alone, the monster camp, the 4 000 case, his live account at 20 000 and all five first-run armies — and the two that move are the two above. **A pin S-94 left red came back green on its own and nothing was touched to make it**: the evening account's `stops` pin (5 registered, 4 offered) now reads five again, so `tests/engine` ends with **seven** failures where it ended with eight — the three remaining benchmark pins (`stops` on the 7 000 and 12 000 exports, `externals.damageFloor` on the live account) and the four criteria floors. **Criterion** *"the thrift half of the trade is not refused by the band"* (`plan-criteria.test.ts`, the shared list): when the account can field a sheltered march that burns **less** than the sweet spot, costs **no more silver** and still does at least the **half** of the steady max's damage the band's own rule names, the plans the bar draws from carry one no dearer in the stock. It **fails on HEAD (4c74cfb) on two of the fifteen** — his camp of 2026-09-19, where the cheapest such march is `EMH 29 · ARC1 1187 · SP1 942 · RD1 482 · ARC2 656 · SP2 521 · RD2 266 · RD3 149`, his own Troops-first shape, at **3** chunks for 1 968 177 / 1 991 000 / 5d 13h against a bar that starts at **5**; and his live camp of 2026-09-18, **7** against **8** — and holds on all fifteen after. It speaks about the **band** and not about which stop is picked, because §C measures that the stop rule cannot reach his march whatever the band does. **What this does not do, and why** (§D): his own 25-hunter march is still not a stop. Priced by `planMarch` it is **2 090 122** on the worst opening for 1 997 400 — **1.046** a silver — against the sweet spot's 2 509 413 for 2 321 200, **1.081** a silver on the worst opening *and* on the expected (that march's two openings coincide). His own 1.086 is the **expected** reading against the bar's **worst opening**, which is two arithmetics; on either one taken whole his march is behind. `silver-saver` is *"the cheapest march left of the sweet spot that costs no more silver and is **at least as efficient a silver**"*, so it refuses his march whatever the band holds — and, measured over the family the experiment scores (the sizer over each prefix of the troop ranking under each of its three methods, sheltered — `shelteredRivals`), of every march on **all fifteen armies** that burns less than the sweet spot, costs no more silver **and clears half the steady max's damage**, **not one, under any of the four readings, is also at least as efficient a silver** — 0 in every one of the forty-four §C rows that carry both a sweet spot and a steady max. Marches under that damage floor are not scored on the ratio and the sentence does not speak for them; his own march is not one of them, at **72.7 %** of his camp's steady max. What his march *is*: 20.5 % less silver, three chunks against five, 5d 14h against 8d 21h, for 16.7 % less damage. Offering that is a change to the silver saver's own definition and a story of its own. **Two standing assertions were corrected in place, each with the march it was measured on beside it** — neither is a pin, a floor or a baseline figure: `plan-fixes.test.ts`'s fix B read a *hole* as a type missing from the **repeated march**, where the engine's own rule (`fieldsInCampaign`) has always read it as a type missing from the **whole campaign**; the two never disagreed until that army's new silver saver started spending all thirty of its Arbalester VI in the **finale**. And `plan.test.ts`'s put-back probe army (42 legionaries, 20 chariots at 12 000) **loses its silver saver**: the plan the count had been hiding at 3 chunks is 4 016 910 a march where the count's own 3-chunk offer was 2 025 185, the burn ladder keeps one plan a level and the knee lands on the new one (4 → 3 chunks), and the saver's window — *strictly left of the sweet spot* — closes because the cheap march that filled it burns 3 as well. Five stops → four and the bar loses its cheapest offer: a trade, and a defect of the **silver saver's** rule (two plans at one burn level, one of them invisible) rather than of the yardstick. **Housekeeping the measurement needed**: the shared fifteen-army list moved from `plan-criteria.test.ts` into `plan-scenarios.ts` (`criteriaScenarios`) and the sheltered-march yardstick into `tests/engine/plan-yardsticks.ts`, so an experiment measuring a rule runs on exactly the armies and by exactly the yardstick the criteria will judge it by — a copy in an experiment drifts, which is what happened between experiment 108's thirteen armies and S-97's fifteen. The diagnostic flag `CampaignInput.bandHired` stays, re-pointed: `damage` is the default and the rule, `winner` is the reading it replaced, and `damageMin` is new (a damage floor read off a provisional bar, 112's R3). **Search time**, the old rule and the new measured back to back in one process over the fifteen armies, sitting after sitting: **13 144 → 13 048**, **13 133 → 12 988**, **12 944 → 12 910**, **13 102 → 13 112** and **12 989 → 12 803 ms** — every one of them between **−1.4 %** and **+0.1 %**, which is this measurement's own noise (the same engine came back 12 803, 12 910, 12 988, 13 048 and 13 112 on the same fifteen armies). The band is a filter over a frontier that is already built, so widening it costs nothing. **Open**: his 120-hunter camp still has no eco stop, and the rule that refuses it is the silver saver's *"at least as efficient a silver"* read on the worst opening; the burn ladder keeps one plan a burn level — the hardest-hitting — so a cheaper march at the same level is invisible to every stop rule, which is what cost the legionary probe army its saver; and the band's own arm is measured against the **winner**, whose damage S-97's top pass deliberately leaves behind the top of the bar. |
| S-98 The benchmark and the baseline carry the rare-stock readings | done | owner, 2026-09-19: the bar must come in *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*. Two of those three the benchmark already printed; the third did not exist, and neither did the coins. **Three readings, added and never substituted**: `soldiersLost` and `monstersLost` — the chunks of ten the bar's `mercLost` has always pooled, told apart — and `dragonCoins`, the price S-96 put on the payload and left off this table. Every existing column, field, pin and floor is untouched, and the proof is mechanical: `benchmark-2026-09-19-16-rare-stock-readings.json` compares **field for field identical** with snapshot 15 on every one of its twelve scenarios (every row's damage, silver, gold, queue, burn, both ratios; every baseline stop, the plan's own campaign, `ratios.bestSizer` and `ratios.externals`), and the Markdown is identical once the five new columns are dropped. **What a monster is** (`isMonsterUnit`, `tests/engine/plan-yardsticks.ts`, the one place the benchmark, the baseline and the criteria share): a unit whose own group is `monster` — the dominance pool's monsters *and* the authority pool's monster mercenaries (Bear V, Cyclops V, the Abomination), against the soldier hires that carry `guardsmen` or `specialist` (Epic Monster Hunter VI, Legionary VI, Arbalester VI, Chariot VI). **TotalStack's `monsterSaving` was asked and answered nothing**, which is the finding: pressed against the same scenario with the flag on and off across the two 2026-09-18 datasets, the answers differ in `mercenaryCounts` **only** — EMH6 142 → 34 at 7 000, Legionary VI 2 017 → 926 on the evening account, Bear V 10 → 6 on the ten-bear army — while `troopCounts` is identical to the unit and `monsterCounts` is empty in all 280 captured answers (no `monsterCaps` is ever sent). The flag shelters the **whole hired pool**; in TotalStack's vocabulary "monster" means "hired unit", Bear V sits in `mercenaryCaps` beside the hunters, and the page draws its line by **pool**, not by race. The split here is drawn by race all the same, for a reason off his own account rather than off the payload: he holds no dominance unit, so a `monstersLost` that counted only the dominance pool would be nought on every army he plays and *"monster/dmg"* would be a floor with nothing under it. **What it measures.** On the four bear armies the whole burn is monsters (0 soldiers, 1–4 monster chunks) and on the hunter armies the whole burn is soldiers, so the two readings are not one column twice. On the monster camp they part company hardest: the steady max burns **28 soldier chunks and 84 monster chunks for 31 080 dragon coins**, and against the best sizer sequence the bar stands at 0.976 a soldier and **0.593** a monster where it stands at 0.911 on damage — the first number in this repo that says the plan buys its damage with monsters the sizer keeps. Against TotalStack the bar's damage a soldier runs 0.78–3.51 at 7 000, 0.60–3.08 at 12 000, 1.16–1.31 on his live account and 1.17–1.33 on the 4 000 case; damage a monster is 1.72–3.03 and 1.40–4.09 on the two exports. **Held by criterion, not by hand**: `plan-criteria.test.ts`'s recap-sum criterion now also asserts `soldiersLost + monstersLost === mercLost` on every stop and on the plan itself, and that the split's own coins are the recap's `dragonCoins`, on all fifteen armies and twice over (as the accounts are, and under a level-20 temple with 25 % discounts); the benchmark pins each stop's coin column against `PlanTotals.dragonCoins` exactly as S-90 pinned the gold. **The baseline is additive**: the five totals and the two standings are optional in `BaselineTotals` and `BaselineScenario.ratios`, so a baseline registered before this story is judged on exactly what it always was, and where one carries them the two burns and the coins may not rise and the two ratios may not fall. Nothing in `src/` changed. **Open**: the floors themselves. The owner's "at least the same as TotalStack full opt" is a *pin*, and a pin needs his replay fixture — the readings are now there to pin it on, the numbers above are what it would be pinned at today, and `pnpm bench:baseline` writes them into `tests/engine/plan-baseline.proposed.json` for him. |
| S-100 The baseline, reviewed — a report generated from it | done | owner, 2026-09-19: *"the baseline is hard to review; we need a report generation to generate a report from the baseline to help the review."* `tests/engine/plan-baseline.proposed.json` is 40 kB of JSON with no story in it, and the rule it serves (*"a given scenario should not be worse … or a new baseline needs to be registered by me if the trade is ok"*) asks him to judge **every trade in it** before he renames the file. **`pnpm bench:review`** (`scripts/plan-baseline-review.ts`) renders the page that lets him. **The CLI**: `pnpm bench:review` compares the registered `tests/engine/plan-baseline.json` with the current proposal; `--from=<path>` names any other left-hand side — a previous proposal, or any `tools/theorycraft/out/benchmark-*.json` snapshot — `--to=<path>` the right-hand one, `--out=<path>` moves the output, and `--stages` renders the whole story history instead. It writes `tools/theorycraft/out/baseline-review.md` and `baseline-review-stages.md`, and **there is no default `--from` while no baseline is registered**: the honest comparison is then against a *named* proposal or snapshot, and the task refuses to guess which. **What the page says.** A summary line first — scenarios, campaigns read, readings judged, ▲ / ▼ / =, stops lost and gained, the reading — then each file's provenance (`registeredBy`, the date, the note it carries). Then one section a scenario: its **standings** from → to against the best sizer sequence and against every captured TotalStack answer, with Δ, Δ % and a verdict; the stops it **lost or gained**, named with their figures; and one table a stop over the twelve readings the baseline holds — damage, silver, revive gold, dragon coins, training queue, hired burned, soldiers burned, monsters burned, damage a silver, a hired unit, a soldier, a monster — each with from, to, Δ, Δ % and **a verdict read in the reading's own direction**: damage and the four ratios better higher, the five costs better lower, so *more silver is ▼ although the number rose*. The three standings S-98 and S-101 added (a soldier, a monster, a silver) are printed as the ones that **moved**, named one by one, with the rest called unmoved — they coincide with the damage standing on most armies and hiding a change was never an option. It ends with **Trades to judge** — every ▼ in the whole file, the lost stops first and then the falls sorted by the share of the figure each started from — and with **Rises** likewise, so the judgement is one pass down one table. **What it refuses to hide.** Two sides are only comparable on the same **reading**, and the reading moved on 2026-09-19 (S-94, the worst opening): a baseline names its own, a snapshot does not, so a snapshot's is inferred from its stage number (12, `reliable-damage`, is S-94's own) and a mismatch is a **bold warning at the top** rather than a footnote. The same for **campaign length** — a stop was priced over the plan's own marches until S-81 and S-89 gave it the horizon, so a table whose two sides are one march and four says so above itself — and for a reading one side does not carry, marked `·` and never judged rather than read as a fall from nothing. Snapshots from 12 on carry the baseline block whole; older ones are rebuilt from their table rows (the `Complete optimization · <pick>` rows, by the same quotients `asBaseline` takes in `plan-benchmark.test.ts`), which the header discloses because their `damage a silver` is rounded to three decimals as the table printed it and the plan's own campaign is not in them at all. **The first real run**, the committed one: the proposal against snapshot 6 (`benchmark-2026-09-18-06-shelter-all-types`, the first S-87 reading), the two sides on different readings and the page saying so — **15 scenarios, 28 campaigns, 268 readings judged, 143 ▲, 98 ▼, 27 =**, one stop lost (the 12 000 export's `all-in`, registered at 31 652 798 damage for 22 422 900 silver and 93 chunks) and one gained (the 7 000 export's `silver-saver`, 16 115 314 for 8 695 000 and 32). `--stages` renders the other page: **20 snapshots in story order plus the proposal**, one table a scenario, every figure marked against the row above it, which is where *"each story's effect"* is legible — the Bear V ×3 `all-in` appearing at stage 3 (`stops-on-fielded`) and going 14 505 126 → 19 115 768 at stage 5 (`all-in-tail`), or *Aydae alone* entering the bar whole at stage 14. **It reads and never writes either side**: registering a baseline stays exactly what it was, the owner renaming a proposal he has read. **Held by** `tests/engine/plan-baseline-review.test.ts` — two armies built by hand carrying one of each case (a rise, a fall, a lost stop, a gained stop, a standing change, a reading one side lacks, two campaign lengths), asserting the verdicts and both lists off the **rendered Markdown**, plus one render of the real proposal against snapshot 16 that asks only that the page comes back whole (pinning its figures would be pinning the benchmark twice). `tsconfig.app.json` lists that one script the way `tsconfig.node.json` lists `tests/engine/plan-baseline.ts` — the mirror of an arrangement the tree already had — so the test may render it. Nothing in `src/` changed and no pin, floor or baseline is re-based. **Open**: the page compares two files and says nothing about **why** a figure moved; the story behind each change is still the owner's to match against the rows above. The slug of each snapshot is already its story's name, so naming the story beside each stage — and linking a trade to the row that caused it — is the obvious next step. |
| S-101 The replayed TotalStack answers as benchmark rows, and the floors against Total Optimization | done | owner, 2026-09-19: the bar must come in *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*. S-98 built the three readings and left the floors open for want of a capture to pin them on; the **replay of that morning** is it. `docs/research/fixtures/totalstack-2026-09-19-replay-m3.json`: **28 answers at 2xx** on the Generate route — seven scenarios × the four flag sets `methodOf` names — and **70 `403`s on the priority-search route** (Pro required, the trial had lapsed), so this fixture contributes Generate rows only and not one `optimize` row. Two of its four flag sets are `monsterSaving=true` bodies differing by `trackAnalytics` alone and answer identically on all seven, so they collapse to one **Total Optimization** row; on every scenario but one, Elite Preservation answers the same march as Total Optimization to the unit, and M's Preservation is the odd one out. **What lands**: a third entry in `DATASETS` (read **last**, so no scenario the 2026-09-18 runs answered changes its rows by its arrival) and five new names in the kit→label map. **Bear V ×1 and ×2 gain their first captured answers ever** — three rows each, the best of them 18 217 808 and 18 442 208 over four marches against our 18 189 008 and 18 413 408 for 4 000 silver less at the same one and two chunks, which is **0.9984** of them and `externals.winsHired` false by exactly that margin (the burn is one chunk on every row of those armies, so damage a hired unit *is* the damage column). **And the three camps become benchmark scenarios 13, 14 and 15** — his live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) and his camp of 2026-09-19 at both readings of the Battle card (4 975 / 2 180 with 450 hunters, 5 100 / 2 200 with 120) — armies the plan's *criteria* have been held on since S-93 and S-97, which lacked only an outside answer to stand against. Their requests are untouched to the unit; `criteriaScenarios()` stops appending them by hand and is now simply the benchmark's own scenarios, **still the same fifteen armies in the same order under the same labels**, because appending them twice would hold every criterion on the same army twice. Their bars, measured that day: the live camp **4 stops** (19 · 37 · 52 · 133 chunks, the steady max hardest at 15 306 859 for 9 849 200), the 450-hunter camp **4** (12 · 15 · 33 · 57, steady max 13 842 678 for 10 476 500, no `all-in`), the 120-hunter camp **4** (25 · 34 · 39 · 41, `all-in` 11 585 381 for 11 202 400). **The two `monsters, …` scenarios of the replay are deliberately not fielded**, and the reason is a repeat of S-98's finding: asked with the monster window open to tiers 3–9, TotalStack returns an **empty `monsterCounts`** in all eight answers — as in all 280 answers of the 2026-09-18 datasets, no `monsterCaps` ever being sent — and their troop-and-mercenary counts are the camp rows beside them duplicated (the owner's-window pair is `camp of 2026-09-19, hunters 450` to the unit). A row that is another row's duplicate is a second vote for the same march in every `Math.max` the benchmark takes, so neither is mapped. **The floors** (`Pinned.totalOptimization`, asserted in `check`): for every scenario whose table holds a **comparable** `TotalStack · Total Optimization` row — thirteen of the fifteen; the monster camp and *Aydae alone* have no captured answer at all — the plan's **best stop** over that row on damage a silver, damage a hired soldier chunk and damage a monster chunk, both campaigns priced by our own engine on the same request, over the same four marches, on the same worst opening. The symmetry is asserted both ways: a table with the row must pin the three, and a pin without the row is an error, so a row that appears or vanishes is caught rather than silently dropping a floor. **Pinned at today's measured figure floored to two decimals, never at the goal** — where the bar is behind, the floor sits under the measurement and the shortfall is reported as a **discrepancy**, because a benchmark red for a target rather than for a regression would stop being a non-regression suite. **What the thirteen say**: **22 of the 39 readings are at or above the goal and 17 are below**; four armies clear all three (the 4 000 case 1.0166 · 1.2185 · 1.0166, his live account at 20 000 1.0718 · 1.1609 · 1.0178, and both 2026-09-19 camps, the 450-hunter one at 1.6034 · **15.3051** · 2.1553 because TotalStack answers it by burning 156 chunks to our 12); nine carry at least one shortfall. The two deepest are **damage a hired soldier on his two exports — 0.7806 at 7 000 and 0.6000 at 12 000** — where the plan is at the same time **2.07×** and **1.79×** Total Optimization a silver and **2.15×** and **1.70×** a monster chunk: it keeps the capped legionaries where the page answers with far fewer, larger soldier stacks. The widest single one is **0.2593 a silver on his live camp of 2026-09-18**, the bear-wall army, where TotalStack burns 374 chunks of unlimited bears for 49.2 M at 6.32 a silver and the plan's hardest stop is 15.3 M on 52 — and on that same army the plan is **4.2076×** it a hired soldier and **2.1765×** it a monster. The rest are within 1 % of parity (the three small bear stocks, 0.998–0.999 on all three; the hunter ×83 army 0.9934 a silver and 0.9983 a monster; the evening account 0.9237 a silver and 0.9514 a monster). **Read as a whole**: the plan is ahead of TotalStack's full optimisation on the rare stock and behind it on silver wherever a rival may spend an unlimited hired type, and behind it on the soldier chunk wherever his own account holds one — the table beside this row names each. **What the run now shows**: a `goal` line under every scenario's table in `tools/theorycraft/out/benchmark-latest.md`, with `✓` at or above 1.0 and `✗` under it, and the third standing the baseline was missing — **`ratios.perSilver`**, optional exactly as S-98's two are, which completes *"silver/dmg, merc/dmg and monster/dmg"* as a non-regression line (until now a run could give up ground a silver against a captured answer without the baseline noticing). **Proved additive rather than promised so**: snapshot `benchmark-2026-09-19-17-totalstack-floors.json` against snapshot 16, **3 245 fields compared field for field, zero differences** — every pre-existing row's damage, silver, gold, queue, burn, the two burns, the coins and all four ratios; every baseline stop, the plan's own campaign, `ratios.bestSizer`, `ratios.externals` and S-98's two standings — with the only differences three new scenarios, three new external rows on each of the two bear armies and the new `perSilver` block; and the regenerated proposal (15 scenarios, `registeredBy: null`) differs from the committed one by **821 leaf fields identical** and nothing but the additions and its own run timestamp. Nothing in `src/` changed, no pin, floor or baseline is re-based, and `pnpm vitest run tests/engine` ends on exactly the seven failures it ended on before — the four criteria floors and the three benchmark pins S-94 and S-95 left red for the owner. **Open**: the seventeen readings under the goal are his to judge, and two of them point at engine work rather than at a pin — the soldier chunk on his own two exports, and a damage-a-silver column that prices an unlimited hired type at nothing on the two wall armies. |
| S-102 Dominance monsters are trained troops, not rare stock | done | owner, 2026-09-19: *“monsters should be there if dominance has been set and damage is interesting; they have a cost in silver but in dragon coins also, which are both constrained; but at least, apart from mercs, they can be trained just like troops”*, and *“monsters have a 3-cost: training time, silver and dragon coins. TotalStack computes the total of dragon coins needed for a stack if present and the dmg/dragon coins.”* **S-96 put dominance chunks on the bar's burn axis and this takes them off it.** That axis is what the whole bar is ordered by — the ladder's rungs, the two ends, the band, the sweet spot's chord, the “burning more buys more” filter — and it means *stock a march does not get back*. A **mercenary** is that: hired once, revived for gold, gone when the player runs out. A **monster** is not: the Army tab recruits it again, ten at a time, for `training.silver`, `training.seconds` and `training.dragonCoins` (`src/engine/recovery.ts`, verified on the seven captured runs of 2026-09-13). So `marchOf` counts **authority** chunks only — hired soldiers and the monster mercenaries (Bear V, Cyclops V) that are revived like them — and a dominance monster keeps everything else S-96 gave it: fielded, sheltered under the lowest troop stack (`shelterUnder`), held to its own housing (`fitsHousing`), and billed in full. **The third currency becomes a shown, constrained cost**: `PlanTotals.dragonCoins` and `PlanRepeat.dragonCoins` already rode the payload and now carry a ratio beside them, `PlanTotals.damagePerDragonCoin` (`Infinity`-safe like `damagePerSilver`, summed through `summarise`, both put-back passes, the `all-in` and the troops-only tail). **A dominance stack has no sustain and that is stated, not left implied**: the dominance pool is *housing*, not a stock that drains, so a monster is `Infinity` in `sustain`, its anchor is the whole pool at every march count, and no monster can ever be the type that shortens a campaign — `lastsMarches`, `anchorFor` and `outrun` exist to ration a stock, and this is not one. **On screen** (`src/ui/sections/march/`): the trade table's silver cell already carried the training queue under the figure, so the coins join it on the same line — `‘11d 0h · 6 840 dragon coins’` — and ride the row's accessible name beside its silver and its gold (design rule 24); the recap gains **“Dragon coins to recover”** with the two prices it belongs to and **“Damage per dragon coin”** beside “Damage per silver”. Both only while the march spends a coin (design rule 15, *nothing on screen without value*): every army but a monster camp spends none, and the words are the ones the Battle card's objectives and the saved-march table already use (rule 5, one name a thing). No seventh column: a price tried as a head measured 505 px in a 462 px pane when gold was (rule 17). **Readings**: the benchmark's `hired burned` column is the authority pool, `monstersLost` stays the race split and is a **cost** reading rather than a share of the burn (`soldiers + monsters = burned` still holds wherever no dominance unit is housed, and the difference is exactly the dominance chunks where one is), `perDragonCoin` joins `perSoldier` and `perMonster` in the table, the registered baseline and its standings against the best sizer and each TotalStack row. **Criteria**: the burn criterion now reads `authority` on both sides — it failed on HEAD (83cd5a4) on the monster camp alone, `silver-saver burns 3 where its march loses 23 chunks of hired stock` through `steady-max burns 8 … 28`, and the recap-sum criterion says the same sentence the other way round (`32 authority chunks (28 soldier + 4 monster-mercenary) against the bar's 97 burned, with 65 dominance chunks counted apart`) with the dominance chunks reported beside it and the two splits — by race and by pool — held equal. **Proved additive**: the fourteen scenarios that house no dominance unit are **byte-identical to snapshot 17** — 4 100 leaf fields compared field for field, **zero** differences beyond each scenario's own `planMs` wall-clock — and the regenerated proposal is 1 102 leaf fields identical on the same fourteen. **The monster camp moved, and it is the whole trade**: 3 stops → **5**, the bar spreading over the 32 authority chunks its 83 hunters and 6 bears can lose (18 · 24 · 26 · 32 · 33) instead of over 97–112 pooled ones. The **hardest stop does not move at all** (steady-max, 95 348 743 for 35 458 800, 0.9113 of the best sizer sequence both days, so `damageFloor` is untouched at 0.91); a **silver saver** appears at 61 696 768 for **25 764 300** silver — ten million under every other answer on that table — and an **all-in** at 82 845 061; and the **sweet spot and “more mercs” each give up about 16 % of their damage** (91 948 255 → 77 280 595 and 94 687 477 → 78 871 786) and half a point a silver (2.61 → 2.18, 2.68 → 2.22) for roughly **four times** the damage a hired unit (947 920 → 3 220 025, 893 278 → 3 033 530) and a quarter of the burn. Two pins move with it and both are gains: `winsHired` **false → true** (the plan's 3 427 598 a hired against the best sizer's 3 077 263, where it was 947 920 against 1 361 029) and `sweetNotAheadOnEither` **true → false**. Every stop now trains the camp's monsters to the housing — 84 chunks and **31 680 dragon coins** a campaign on four of the five, against 28 440–31 080 before — which is the owner's *“monsters should be there if dominance has been set”*, and the coins are now on screen rather than implied. `pnpm vitest run tests/engine` ends on exactly the seven failures it began on. **Open**: whether 16 % of the sweet spot's damage is worth what it buys is the owner's call, and nothing on that camp is a registered baseline; and the **Temple gold line** `retrainOne` adds for a monster's un-returned tenth (`reviveOne(…).gold`) is the recap's own model and has never been confirmed against a screen — it is carried unchanged here and left for him. |
| S-103 The second replay's answers, the monster camp's floors, and his TotalStack profile as a scenario | done | The replay of 2026-09-19 that S-101 read was sent on the **old request schema** and three quarters of an hour later the kit asked the page again on the current one: `docs/research/fixtures/totalstack-2026-09-19-replay-v2.json`, **40 answers at 201** on the Generate route — ten scenarios × the four flag sets `methodOf` names — and **100 `403`s** on the priority-search route, Pro still being required, so this fixture too contributes Generate rows only. Two things are new on the wire: `dominanceValue`, `recoveryPlan`, `reviveAllTroops`, `trainingCostReductions` and `trainingSpeedBonuses` are sent, and the **monster tier window is open**, so `monsterCounts` comes back **filled** where all 318 earlier answers had it empty. **The reconciliation first, because it decides whether anything moves**: the five scenarios both replays asked — Bear V ×1 and ×2, the live camp of 2026-09-18 and his camp of 2026-09-19 at both readings — answer **identically to the unit on all three method rows**, so the schema's new fields move no answer on an army that houses no dominance unit. One plan is one row, so `DATASETS` reads the new fixture **last** and the five keep resolving from the first replay: no `totalOptimization` pin is re-measured, none is disclosed as changed, and nothing S-101 pinned on those five is touched. The second replay is read for the two labels nothing before it answered. **The monster camp gets its first captured answers ever** (benchmark scenario 11, experiment 110's 900-dominance camp), and they are the first rows in this repo to field a **dominance monster**. Total Optimization plays **131 monster units over all 12 of the camp's types** — Water Elemental 46, Battle Boar 22, Emerald Dragon 20, Stone Gargoyle 17, Gorgon Medusa 6, Many-Armed Guardian 6, Ice Phoenix 5, Magic Dragon 5 and one each of Desert Vanquisher, Ettin, Fearsome Manticore and Flaming Centaur — for **898 of the 900** dominance, beside **6 Bear V** and **65** of the 83 Epic Monster Hunter VI; priced by our engine over four marches that is **79 770 931** damage for **35 454 400** silver, 32 authority chunks and **31 680 dragon coins**. Its Elite Preservation answer is the same march to the unit; its M's Preservation answer drops the hunter and burns **4** chunks over the campaign. **The plan clears all four readings on it**: **1.1951** a silver, **1.5469** a hired soldier, **1.1953** a monster and **1.2184** a dragon coin, and its hardest campaign is **1.1953×** the best captured answer's. `externals` is pinned at 1.19 with `winsHired` **false**, which reads as an artefact rather than a loss — a damage-a-hired ratio whose denominator is M's Preservation's four chunks is not a march anyone sends. **The fourth standing is new and deliberately optional** (`Pinned.totalOptimization.perDragonCoin`, the owner's *“TotalStack computes … the dmg/dragon coins”*): on the fourteen armies that house no dominance pool neither side spends a coin, both read `damage / 1`, and a standing that repeats the damage column is left out of the goal line and out of the pins instead of being printed as if it meant something. The fourteen older goal lines come back **byte for byte**. **And scenario 16 is his own TotalStack profile** — the one army on the table whose request is *the captured request* rather than a reconstruction of it: 5 225 leadership, 2 120 authority, **100 dominance**, guardsmen I–III with the top melee and ranged tiers clicked out, specialists I, the monster window on **tier 3** (the four types `src/data` holds there), **Epic Monster Hunter V ×80**, and the bonuses he typed into the page (guardsmen +60 / +60, army +3 / +3, temple 0). Three readings of that profile are his and not ours to improve: **Swordsman I is on the field** (his page excludes no specialist category, where his Pyrrhic export clicks out the top melee specialist and so drops the type — an army without it would make all four captured answers rows the player cannot make, and the scenario would stand against nothing); **Bear V and Cyclops V are capped at six but not selected**, so the page fields neither and neither is hired here; and the bonuses are the page's rather than the export's captains, so the quotients are two searches over one army. Its bar, measured this day: **3 stops** — a silver saver at 7 chunks (4 919 095 for **4 431 600** silver), the sweet spot at 19 (8 182 228 for 8 340 000) and the steady max at 25 (8 408 431 for 8 702 400) — no `all-in`, and every stop fields **all four** tier-3 types — 18 units for 97 dominance at the thrift end, 20 for 99 at the other two, against Total Optimization's 19 for the whole 100 — which is **16 monster chunks** and **3 840 dragon coins** a campaign. Against the sizers `damageFloor` is **0.97** and `winsHired` true (702 728 a chunk against 479 623); against his page the plan is ahead on all four — **1.3080** a silver, **3.0058** a hired soldier, **1.2402** a monster and **1.2402** a dragon coin — the steady max hitting 24 % harder for 9 % more silver and the silver saver 73 % as hard for **55 %** of the silver at a quarter of the burn. `criteriaScenarios()` is the benchmark's scenarios, so the new army is held to **every** criterion by construction, and **it passes all of them**. **Four of the replay's ten scenarios are deliberately not rows**: the two tiers-3–9 ones at 20 000 dominance, whose troop-and-mercenary halves are to the unit the camps beside them (S-101's finding, repeated) and for which no army in this repo holds that window; and experiment 110's **20 000-dominance camp**, whose search does not finish inside `CAMPAIGN.budgets.plan` (S-96) — its answers are recorded in the `monsterCamp` docstring instead (2 730 monster units over the same 12 types for 19 999 of the 20 000, the same 6 bears and 65 hunters), asserted nowhere, because pinning a row against a bar the clock cut off would pin the clock. **Proved additive rather than promised so**: `benchmark-2026-09-19-19-replay-v2.json` against snapshot 18, **every pre-existing field of the fifteen existing scenarios compared field for field, zero differences** — every row's damage, silver, gold, queue, burn, both burns, the coins and all five ratios; every baseline stop, the plan's own campaign and all five standings — the only differences being each scenario's own `planMs` wall-clock, the monster camp's three **new** rows with the ratio keys they create, and the sixteenth scenario. The regenerated proposal (16 scenarios, `registeredBy: null`) differs from the committed one by exactly those additions and its own timestamp. Measured in a worktree at HEAD because a parallel session was editing `src/engine/plan.ts` while this ran; **nothing in `src/` changed here**, no pin, floor or baseline is re-based, and `pnpm vitest run tests/engine` ends on exactly the seven failures it began on (406 passing, 13 more than before). **Open**: his TotalStack profile is a *snapshot* of a page he can change, so the day he re-types a bonus the scenario is a reconstruction again unless the capture is repeated; and the priority-search route has now answered 403 on 170 calls across two replays, so no `optimize` row exists for any army added since S-100. |
| S-104 Putting a type back re-sizes the selected stop inside the plan's rules | done | owner, 2026-09-19, the **third** report of the same defect: *“Adding back troops doesn’t shield the mercs”*, and the semantics he wants — *“I’m able to put it back in and the plan then computes safely the best course of action with the new parameters in mind (the spot selected, monster or any other troop put back) without putting out another, because then we’re manually fixing the reco without clicking Generate.”* **The cause**: a press on a “Left out — tap to put back” pill ran the **plain sizer** — `MarchPills` → `formation.ts` → `generate.ts` → the worker's `stack` job → `sizeStacks` — on the snapshot's request filtered to the types that are in, with the request's *full* mercenary caps and no shelter, because the shelter lives inside `planCampaign` (`shelterUnder`, S-87). So a sheltered stop was replaced by an unsheltered sizer march with the mercenaries on top. Measured on his 450-hunter camp of 2026-09-19: the sweet spot is SP2 911 · RD3 257 · RD2 449 · RD1 792 · ARC2 1057 with **38 hunters** under a 456 624-HP floor (2 385 168 damage, 2 268 000 silver, 210 h); putting **Archer I** back through the old path fielded all **450 hunters** — **4 329 900 HP** over a 336 878-HP floor, the enemy's first kill — for **1 248 237** damage and 45 chunks burned. **The fix**: `resizeMarchOver` (`src/engine/plan.ts`), the best **sheltered** march over exactly the troop types asked for — the sizer under each of its three methods with the selected stop's hired counts as caps (S-93's own `sizedShape`), plus the tight ladder over those types at each growth, priced by `priceMarch` on the worst opening (S-94), best by damage and then by silver and queue. Three promises hold on every answer: every troop type asked for is fielded or named (`unfielded`), no hired count is above the stop's, and every hired and dominance stack stands strictly under the lowest troop stack. It runs off the main thread as its own worker message (`resize`), and the same put-back now answers **1 987 686** for 2 044 700 silver with **35 hunters** at 336 770 HP, under the troops. A March edit on a **sizer** run keeps its old shape but its answer is sheltered too (`shelterCounts`); `sizeStacks` itself is untouched, so TotalStack parity is untouched. The pane says what happened in one line under the pills (rule 15): *“Re-sized with Archer I put back — nothing else was pushed out, and your hired stacks stay under the troops.”* The plan bar is left alone: its rows are the plan's, the tweaked march is the pane's. Held by `tests/engine/plan-resize.test.ts` on every stop of every benchmark army, with the old path's failure kept as a regression test. |
| S-99 The hired prefix family — the plan may leave the cheapest hired types out when the damage says so | done | owner, 2026-09-19, shown where the plan's monster chunks go (experiment 113, `tools/theorycraft/out/113-monster-economy.md`): ***“you can drop when the damage says so”***. **The cause, measured**: the grid the search sweeps builds one count per hired type from that type's own maximum and **neither of the two lists it draws from contains a zero** — the `CROSSED_TYPES` crossed types read `[max, 0.7 max, 0.45 max, 0.2 max, min(10, max)]` under S-58 A's `tokenFloor` and every further type rides `shares = [1, 0.7, 0.45, 0.2]` — so **no vector the search prices ever leaves a hired type out**, and every march the bar can offer pays a chunk of ten for every type the account holds whatever that type is worth. On the benchmark's 900-dominance monster camp the four types worth least a point of dominance held **48 % of the march's monster chunks for 5 % of its damage**; the twelve uncapped monster stocks ask **10 739** dominance against 900, and the shelter then cuts each share down to the two or three units that stand under a 449 280-HP troop rung, which is where “many tiny stacks” comes from. **The rank, computed, and pool-aware in two readings** (`rankHired`, exported from `engine/plan.ts` so the criteria and the engine share one): a hired type is ranked first by whether **its pool is contested at all** — `Σ stock × cost > housing[pool]`, an uncapped type's stock being its own whole pool, which is **10 739 of 900** for the camp's dominance and **209 of 2 180** for its authority — and then by **`damagePerUnit / cost`, its damage a point of that pool, over the best rate the same pool offers**. The first reading is what makes it pool-aware rather than a single division: leaving a monster out gives the monsters above it room they can use, leaving a mercenary out gives back authority nobody is short of (the hunter is held at its cap of 83, not at what 2 180 authority would pay for), and without it the raw rate puts **Bear V last of fourteen** (1 781 damage an authority point against Epic Monster Hunter VI's 14 393) and the family would drop the bear before the water elemental. The second is comparable across pools only as a **standing inside its own pool**, an authority point and a dominance point being different things with no exchange rate anywhere in the game. Two readings were tried and rejected on the measurement: *damage per chunk of ten*, which is `damagePerUnit` in disguise and would drop the hunter first, and *damage per unit of HP*, which is `rankTroops`'s question. The order it produces is **experiment 113 §D's own**, army for army. **The family**: for each `k`, the shapes built from the first `k` hired types with the rest at **zero** — the prefix's anchors at each of the grid's shares, its **sheltered maxima** (the tight ladders' floors and the sizer's own fill, `sizeStacks` giving the kept types the pool the dropped ones were sharing), the **sizer shape** that shelters each of those maxima over each troop prefix, and the **burn ladder walked down under the best of them**, so the thrift end is offered over the types the damage kept as well as over all of them. **It is scored where S-97's family is scored and under the same freeze**, and that placement is itself a measurement: put in the grid instead, the extra candidates changed which shapes seeded the hill-climb on **every** army in the file — the 7 000 export lost a hired type off its *repeated* march, his live camp of 2026-09-18 lost its silver saver, the monster camp's own winner came out **3 M lower** — because the winner is the band's yardstick (`goal`, `notToken`) and moving it empties the thrift end, which is the whole argument S-97 already wrote. Frozen, the winner, the seeds, the hill-climb and the burn ladder are the search as it was, vector for vector. **S-58 B gains a cut, and the cut is measured, not set**: over *the plans the bar could offer if this rule let it* (the undominated frontier through the band's other three arms), a plan belongs to **prefix k** when the stocked types its **repeated march** fields are exactly the first k of the ranking, and **k is earned** when the strongest campaign of prefix k is behind the strongest campaign over **all** of them on none of the four readings the bar prints — total damage, damage a silver, damage a hired unit burned, damage a dragon coin — and ahead on one. The cut is the smallest earned k, and the whole hired set when none is earned: **fifteen of the sixteen armies earn none** and the monster camp earns **10 of 14** — Stone Gargoyle, Emerald Dragon, Battle Boar and Water Elemental, the four §D1 named — which is §D's finding reproduced by the engine rather than promised. The `all-in` is the one stop that *fills* with the cut (`fillable`, `filledOf`: *“all the mercs you can safely field”* is a sentence about the stock worth fielding, and its offer rule compares the same stock on both sides); every other stop is a plan off the frontier, where the cut is a **permission** and the search decides. **And S-58 B's own reading is tightened to the march the player sends**: a required type must be on the **repeated** march unless the horizon outruns it, the campaign-wide reading being kept for the one case S-89 wrote it for. Without that, the prefix family walked straight past the rule on an army that earns no cut — measured, the 7 000 export's *“more mercs”* rung became a march fielding no legionary at all with 33 of them in a finale three marches later. **The monster camp, before → after** (snapshot 19 → 20, campaign figures): the silver saver at 61 696 768 / 25 764 300 / 18 chunks is **not offered**; the sweet spot **77 280 595 → 89 196 808** (+15.4 %) for *less* silver, 35 450 400 → 35 230 800, at the same 24 chunks; *more mercs* **78 871 786 → 93 298 414** (+18.3 %) at 35 230 800 and 26; the steady max **95 348 743 → 97 458 367** (+2.2 %) for 36 436 800 at 32; and the `all-in` **82 845 061 → 102 971 902** (+24.3 %) for 37 316 000 at 34 — which is, to the unit, the march §D1 measured by narrowing the *request* to the top eight monster types, found here by the search itself. Dragon coins a campaign fall 31 680 → **27 040–28 200** on every stop; the four standings against Total Optimization rise **1.1951 → 1.226** a silver, **1.5469 → 1.565** a hired soldier, **1.1953 → 2.259** a monster and **1.2184 → 1.512** a dragon coin; the hardest campaign goes from 0.911 to **0.984** of the best sizer sequence. Each stop fields **10 or 11** of the camp's 14 hired types where every stop of snapshot 19 fielded 13 or 14. **The trade to disclose, and it is the only fall anywhere**: that camp's `stops` pin **stays at 5 and fails** (the bar offers 4): a lost stop is a trade only the owner registers — the stop that goes is the **silver saver**, and it goes because the sweet spot got better, `leastSilver` offering a thrift stop only while a march left of the sweet spot is at least as efficient a silver as it. The bar keeps its four other stops at the same four burn levels and every one of them hits harder; whether a thrift rung is worth 15 % of the sweet spot's damage is the owner's call, and nothing on that camp is a registered baseline. **Additive everywhere else, and proved so**: snapshot 20 against 19, **every pre-existing field of the fifteen other scenarios is byte-identical** — every stop, the plan's own campaign, every ratio and every standing — the monster camp being the only army that moved at all. `plan-shape.test.ts`'s `leftOut` moves 283 → **322** (39 more undominated plans on that army's frontier, every other frozen figure unmoved). **A criterion of its own** (`plan-criteria.test.ts`, the shared list of sixteen armies): *no stop is beaten by the same march with its cheapest hired type left out* — the stop's own troop types re-sized by the sizer with the last of `rankHired` among the types it fields left at home and the rest free to fill the pool, judged on damage, silver and the hired stock burned, the reading S-93 uses. It fails on HEAD (c4eeb3f) on the monster camp and there alone: *`all-in (21 140 179 damage, 8 862 600 silver, 9 burned) is beaten by the same march without water-elemental — the sizer over 10 troop types (elite) (23 017 203, 8 840 200, 9)`*; it passes on all sixteen after. The criterion beside it, *“the plan fields the pools the account holds”*, needed no loosening: it asserts a **pool**, not a type — every hired pool the army houses has at least one stack on every stop's repeated march — and a prefix march still fields monsters, so the shelter, the burn and the housing halves of it are untouched. **Cost**: the search is **+17 %** over the sixteen armies back to back (14 793 ms → 17 242 ms, best of two each side in one sitting); the monster camp 6 730 → **7 956 ms**, still 3.1× inside `CAMPAIGN.budgets.plan` where it was 3.7×; the ten older armies run at ×0.95 to ×1.31 but for his live camp of 2026-09-18, ×1.66 on 431 ms. `pnpm vitest run tests/engine` ends on exactly the seven failures it began on. |

**S-101 — the plan's best stop against TotalStack's Total Optimization, measured 2026-09-19.** The owner's
goal, army by army: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*. Each
cell is the plan's best stop on that reading over the captured `TotalStack · Total Optimization` row's, both
campaigns priced by our own engine on the same request, over the same four marches, on the same worst opening
(`tests/engine/plan-benchmark.test.ts`, `tools/theorycraft/out/benchmark-2026-09-19-17-totalstack-floors.md`).
**Bold** is a shortfall against the goal; the floor pinned beside it in `plan-scenarios.ts` is the measurement
floored to two decimals, never the goal itself.

| scenario | a silver | a hired soldier | a monster | floors pinned |
|---|---|---|---|---|
| first-run, Bear V ×1 | **0.9985** | **0.9984** | **0.9984** | 0.99 · 0.99 · 0.99 |
| first-run, Bear V ×2 | **0.9986** | **0.9984** | **0.9984** | 0.99 · 0.99 · 0.99 |
| first-run, Bear V ×3 | **0.9986** | **0.9985** | **0.9985** | 0.99 · 0.99 · 0.99 |
| first-run, Bear V ×10 | **0.9987** | 1.0046 | 1.0046 | 0.99 · 1.00 · 1.00 |
| first-run, Epic Monster Hunter VI ×83 | **0.9934** | 1.1120 | **0.9983** | 0.99 · 1.11 · 0.99 |
| first-run, monster tiers 3–5 at 900 dominance | — | — | — | no captured answer |
| the 4 000-leadership case of 2026-09-15 | 1.0166 | 1.2185 | 1.0166 | 1.01 · 1.21 · 1.01 |
| 2026-09-17 export, 7 000 | 2.0702 | **0.7806** | 2.1458 | 2.07 · 0.78 · 2.14 |
| 2026-09-17 export, 12 000 | 1.7936 | **0.6000** | 1.6972 | 1.79 · 0.60 · 1.69 |
| live account of 2026-09-18, 20 000 | 1.0718 | 1.1609 | 1.0178 | 1.07 · 1.16 · 1.01 |
| live account, evening, 11 000 | **0.9237** | 1.0241 | **0.9514** | 0.92 · 1.02 · 0.95 |
| Aydae alone, 4 975 | — | — | — | no captured answer |
| his live camp of 2026-09-18 | **0.2593** | 4.2076 | 2.1765 | 0.25 · 4.20 · 2.17 |
| his camp of 2026-09-19, 450 hunters | 1.6034 | 15.3051 | 2.1553 | 1.60 · 15.30 · 2.15 |
| his camp of 2026-09-19, 120 hunters | 1.2967 | 2.5911 | 1.7593 | 1.29 · 2.59 · 1.75 |

*Two of its cells moved on the same day, by S-103 and not by a re-measurement: the **monster camp** has captured answers now — **1.1951 · 1.5469 · 1.1953**, and **1.2184** a dragon coin, the fourth reading — and a **sixteenth** army joined the table, his own TotalStack profile at **1.3080 · 3.0058 · 1.2402** and 1.2402 a coin. The thirteen rows above are untouched to the digit; the S-103 row says how that was proved.*

**Twenty-two of the thirty-nine readings are at or above the goal, seventeen below it**, over the thirteen of
fifteen armies that have a comparable Total Optimization row. The seventeen, in full: all three readings on
each of the three small bear stocks (nine, every one of them between 0.9984 and 0.9986 — the same march as
ours plus one troop stack's worth of rounding, at four thousand silver more); damage a silver on Bear V ×10
(0.9987); damage a silver and damage a monster on the hunter ×83 army (0.9934, 0.9983 — a camp with no monster
on either side, where that column is the damage column read through `damage / 1`); **damage a hired soldier on
his two exports (0.7806 at 7 000, 0.6000 at 12 000)**; damage a silver and damage a monster on the evening
account (0.9237, 0.9514); and **damage a silver on his live camp of 2026-09-18 (0.2593)**.

Two of them are worth an engine story rather than a pin. The **soldier chunk on his own two exports** is the
plan keeping every hired type the account holds, capped legionaries included, where Total Optimization answers
that window with far fewer and larger soldier stacks — it buys 2.07× and 1.79× the damage a silver and 2.15×
and 1.70× the damage a monster chunk doing it, so the trade is legible, but 0.60 is the deepest single figure
in the table. The **0.2593 a silver on the live camp of 2026-09-18** is the bear-wall shape the evening
account already showed at 0.41: the bears there are *unlimited*, they cost authority and gold and no silver at
all, and a rival that spends 374 chunks of them for 49.2 M damage prices its silver at 6.32 a coin where the
plan's sheltered 52-chunk stop prices its own at 1.55. On that same army the plan is **4.21×** it a hired
soldier and **2.18×** it a monster — which is the reading the owner asked for, standing where the silver
column cannot.

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
- 2026-09-19 — **S-99 the hired prefix family: the plan may leave the cheapest hired types out when the damage says so.** *“You can drop when the damage says so.”* The search had no way to: the grid samples each hired type at its maximum and three fractions of it, S-58 A's thrift end samples one chunk, and the types the grid does not cross ride a share — **no list contains a zero**, so every march the bar could offer paid a chunk of ten for every type the account holds. On the 900-dominance monster camp the four types worth least a point of dominance carried **48 % of a march's monster chunks for 5 % of its damage**. The plan now scores, beside its own families, the shapes built over a **prefix** of the hired ranking with the rest at zero — the prefix's anchors at the grid's own shares, its sheltered maxima, the sizer shape that shelters each of them, and the burn ladder walked down under the best of them. The ranking is computed and **pool-aware in two readings**: whether the type's pool is contested at all (`Σ stock × cost > housing` — **10 739 of 900** dominance on that camp against **209 of 2 180** authority), then its damage a point of that pool over the best rate the pool offers. Without the first reading the raw rate puts Bear V last of fourteen and the family would drop the bear, freeing 21 points of a pool with 1 971 to spare; with it, the order it produces is experiment 113 §D's own, army for army. **The family is scored under S-97's freeze, and that was measured too**: in the grid instead, its candidates re-seeded the hill-climb on every army — the 7 000 export lost a hired type off its repeated march, his live camp lost its silver saver, the monster camp's winner came out 3 M lower — because the winner is the band's yardstick. Frozen, the winner, the seeds and the burn ladder are the search as it was. **S-58 B keeps its sentence and gains a cut**: k is earned when the strongest campaign over the first k hired types is behind the strongest campaign over all of them on **none** of damage, damage a silver, damage a hired unit and damage a dragon coin, and ahead on one — measured over the plans the bar could offer if the rule let it, read on the march a plan **repeats**. Fifteen of the sixteen armies earn no cut and the monster camp earns **10 of 14** (the four types §D1 named), which is §D's finding reproduced rather than promised, and the rule's own reading is tightened to that repeated march (a required type in a finale three marches later is a hole, not a plan). **The monster camp**: sweet spot **77 280 595 → 89 196 808** for *less* silver, *more mercs* **78 871 786 → 93 298 414**, steady max **95 348 743 → 97 458 367**, and the `all-in` **82 845 061 → 102 971 902** — the march experiment 113 measured by narrowing the request, found by the search itself. Coins a campaign 31 680 → 27 040–28 200; the four standings against Total Optimization **1.1951 → 1.226**, **1.5469 → 1.565**, **1.1953 → 2.259**, **1.2184 → 1.512**; the hardest campaign 0.911 → **0.984** of the best sizer sequence. **The one fall, disclosed and not adjusted away**: that camp's bar loses its **silver saver** — 5 stops → 4 — because the sweet spot got better and `leastSilver` only offers a thrift stop while a march left of the sweet spot is at least as efficient a silver as it. Its `stops` pin is left at 5 and red, a lost stop being the owner's to register on the same camp; nothing there is a registered baseline and the proposal carries the measured bar. **Everything else is additive and proved so**: every pre-existing field of the other fifteen scenarios is byte-identical between snapshots 19 and 20. A criterion of its own holds the rule — *no stop is beaten by the same march with its cheapest hired type left out* — failing on HEAD on the monster camp alone (`all-in`, beaten by dropping Water Elemental for 1 877 024 more damage at 22 400 silver less) and passing on all sixteen after; *“the plan fields the pools the account holds”* needed no loosening, asserting a pool rather than a type. The search costs **+17 %** over the sixteen armies (the monster camp 6 730 → 7 956 ms, 3.1× inside its budget), and `pnpm vitest run tests/engine` ends on exactly the seven failures it began on. **Open for the owner**: whether a thrift rung is worth 15 % of that camp's sweet spot.
- 2026-09-19 — **S-104 putting a type back re-sizes the selected stop inside the plan's rules.** Third report of one defect: *“adding back troops doesn't shield the mercs”*. The pill ran `sizeStacks` on the filtered request — the request's whole mercenary stock and no shelter, the shelter being inside `planCampaign` — so a put-back threw away every rule the stop was chosen under. His 450-hunter camp: the sweet spot stands 38 hunters at 365 636 HP under a 456 624-HP troop floor; the old path's put-back of Archer I stood **450** at **4 329 900 HP** over a 336 878-HP floor and *lost* damage for it (1 248 237 against the 1 987 686 the sheltered answer hits). The engine has an entry of its own now — `resizeMarchOver`, the best sheltered march over exactly the troop types asked for, the stop's hired counts as caps, the sizer's three methods and the tight ladder, priced on the worst opening — reached through a `resize` worker message so it stays off the main thread. It answers his sentence literally: every type asked for is fielded or named, nothing else is pushed out, no more of the stock is spent than the plan planned, and no Generate is run. The sizer methods keep their own re-size and gained the shelter (`shelterCounts`), because the rule is about every stack the app generates; `sizeStacks` is untouched. The pane writes one line under the pills saying what the edit did, and the bar keeps showing the plan's own stops.
- 2026-09-19 — **S-103 the second replay's answers, the monster camp's floors, and his TotalStack profile as a scenario.** The morning's second capture (`totalstack-2026-09-19-replay-v2.json`, 40 answers at 201, ten scenarios × four flag sets, 100 more 403s on the priority search) was sent on the **current request schema** and with the monster window open, so it is the first fixture in this repo whose `monsterCounts` is not empty. **Reconciliation before anything else**: the five scenarios both replays asked answer **identically to the unit on all three method rows**, so the new schema fields move no answer on an army with no dominance pool; `DATASETS` reads the new fixture **last**, the five keep resolving from the first replay, and not one figure S-101 pinned on them is re-measured. **The monster camp (scenario 11) gains its first captured answers ever.** Total Optimization fills the pool to the unit — **131 monster units over all 12 types for 898 of the 900 dominance**, with 6 Bear V and 65 of the 83 hunters — which our engine prices at **79 770 931 for 35 454 400 silver, 32 authority chunks and 31 680 dragon coins** over four marches. The plan clears every reading against it: **1.1951** a silver, **1.5469** a hired soldier, **1.1953** a monster, **1.2184** a dragon coin, and **1.1953×** on damage. The coin standing is the new one and it is **optional by design** — on the fourteen armies that spend no coin both sides read `damage / 1`, so the goal line and the pins leave it out rather than print the damage column twice, and those fourteen goal lines come back byte for byte. **Scenario 16 is his own TotalStack profile**, the one army whose request is the captured request: 5 225 / 2 120 / **100 dominance**, monsters on tier 3, Epic Monster Hunter V ×80, guardsmen +60 / +60 and army +3 / +3. Three of its readings are his and were kept as he set them — **Swordsman I stands** (his page excludes no specialist, where his export drops the type; without it all four captured answers would be rows the player cannot make and the scenario would stand against nothing), **Bear V and Cyclops V are capped but unselected** so neither side fields them, and the bonuses are the page's rather than his captains'. Its bar: **3 stops** — silver saver 4 919 095 for **4 431 600** at 7 chunks, sweet spot 8 182 228 for 8 340 000 at 19, steady max 8 408 431 for 8 702 400 at 25 — no `all-in`, and all three field all four tier-3 types (18 to 20 units for 97 to 99 of the 100 dominance), which is 16 monster chunks and **3 840 coins** a campaign. **0.97** of the best sizer sequence, `winsHired` true, and against his page **1.3080 · 3.0058 · 1.2402** and 1.2402 a coin: 24 % harder than Total Optimization for 9 % more silver at the top, and 73 % as hard for **55 %** of the silver at the thrift end. Being a benchmark scenario it is held to **every** criterion, and it passes all of them — no criterion had to be loosened and none failed. **What was not fielded and why**: the two tiers-3–9 answers at 20 000 dominance (their troop-and-mercenary halves duplicate the camps beside them, and no army here holds that window) and experiment 110's 20 000-dominance camp, whose search does not finish inside the app's own budget — its answers are in the `monsterCamp` docstring as a note, asserted nowhere, because pinning a row against a bar the clock cut off would pin the clock. **Additive, and proved so**: snapshot 19 against snapshot 18, **zero differences on every pre-existing field of the fifteen existing scenarios** — rows, baseline stops, the plan's own campaign and all five standings — the only changes being each scenario's `planMs`, the monster camp's three new rows and the sixteenth army; the regenerated proposal differs by exactly that. It was measured in a worktree at HEAD, a parallel session having started editing `src/engine/plan.ts` mid-run; nothing in `src/` changed and `pnpm vitest run tests/engine` ends on exactly the seven failures it began on, with 13 more tests passing. **Open for the owner**: the profile scenario is a snapshot of a page he can re-type, so it stays like-for-like only as long as the capture is repeated; and the priority search has now refused 170 calls over two replays, so no army added since S-100 has an `optimize` row to stand against.
- 2026-09-19 — **S-102 dominance monsters are trained troops, not rare stock.** *“Monsters should be there if dominance has been set and damage is interesting; they have a cost in silver but in dragon coins also, which are both constrained; but at least, apart from mercs, they can be trained just like troops.”* S-96 had pooled a monster's chunks into the bar's one burn axis, on the reading that “burned” means any rare stock a march does not get back. His sentence says it is not the same stock: a mercenary is hired and revived for gold, a monster is **recruited again** — ten at a time, for silver, queue time and dragon coins — so the first is stock and the second is a price. `mercLost` is the **authority** pool now, on the engine and in every reading the benchmark, the baseline and the criteria take; the monster keeps its shelter, its housing check and its whole bill; and the third currency comes out of hiding — `PlanTotals.damagePerDragonCoin` beside damage a silver, `‘… · 6 840 dragon coins’` in the trade table's silver cell, **Dragon coins to recover** and **Damage per dragon coin** on the recap, all of them drawn only while a march spends a coin (design rule 15). The sustain question is answered rather than left implied: dominance is **housing, not a stock that drains**, so no anchoring and no `lastsMarches` on a monster, and a monster camp can never be the type that shortens a campaign. **The fourteen armies that house no dominance unit are byte-identical to snapshot 17** — 4 100 leaf fields compared, zero differences but each scenario's own `planMs` — and the regenerated proposal is 1 102 leaf fields identical on the same fourteen. **The monster camp is the whole story, and its bar before → after**: 3 stops → **5**; a **silver saver** that never existed there, 61 696 768 for **25 764 300** silver at 18 chunks and 31 680 coins (1 947 damage a coin); sweet spot 91 948 255 / 35 274 000 / 97 / 28 440 / 2.61 a silver / 947 920 a hired → **77 280 595 / 35 450 400 / 24 / 31 680 / 2.18 / 3 220 025** (2 439 a coin); more mercs 94 687 477 / 35 349 600 / 106 / 29 520 / 2.68 / 893 278 → **78 871 786 / 35 450 400 / 26 / 31 680 / 2.22 / 3 033 530** (2 490); steady max **unchanged** at 95 348 743 / 35 458 800 / 31 080 with its burn read 112 → **32** and its damage a hired 851 328 → **2 979 648** (3 068 a coin); and an **all-in** at 82 845 061 / 35 450 400 / 33 / 31 680 (2 615). The trade is plain: **about 16 % of the sweet spot's and the “more mercs” stop's damage and half a point a silver, for roughly four times the damage a hired unit and a quarter of the burn** — and every stop now trains the camp's monsters to the housing, 84 chunks and 31 680 coins a campaign, which is what *“monsters should be there”* asks for. The camp carries no S-101 floor (it has no captured answer), its `damageFloor` is untouched at 0.91 — the hardest stop and the best sizer sequence are the same figures both days, 0.9113 — and the two pins that move are gains: `winsHired` false → true, `sweetNotAheadOnEither` true → false. The new criterion failed on HEAD on that camp alone and nowhere else. `pnpm vitest run tests/engine` ends on exactly the seven failures it began on. **Open for the owner**: whether 16 % of the sweet spot's damage is worth what it buys (nothing on that camp is a registered baseline), and the **Temple gold line** `retrainOne` adds for the tenth unit a monster's chunk does not return — the recap's own model since S-33, never confirmed against a screen, carried unchanged here.
- 2026-09-19 — **S-101 the replayed TotalStack answers, and the floors against Total Optimization.** S-98
  built the three readings his goal names — *"at least the same as TotalStack full opt in silver/dmg,
  merc/dmg and monster/dmg"* — and could not pin them, having no capture of the armies they matter on. The
  replay of this morning is that capture: **28 answers at 2xx** on the Generate route over seven scenarios
  and the four flag sets, and **70 `403`s** on the priority-search route, Pro having lapsed, so the fixture
  gives Generate rows and no `optimize` row at all. Its two `monsters, …` scenarios are **not** fielded, and
  the reason repeats S-98's finding rather than adding to it: with the monster window open to tiers 3–9 the
  page still answers with an empty `monsterCounts`, and the counts it does return duplicate the camp rows
  beside them — a duplicate row is a second vote in every `Math.max` this table takes. **What is new on the
  bar**: the two small bear stocks have captured answers for the first time (ours is 0.9984 of the best of
  them, for four thousand silver less at the same chunks), and the three camps the criteria have been held
  on since S-93 and S-97 are benchmark scenarios 13, 14 and 15 now that each has an outside answer to stand
  against — the same fifteen armies the criteria always had, in the same order, no longer listed twice.
  **The floors** are pinned on thirteen of the fifteen (the monster camp and *Aydae alone* have no captured
  answer): the plan's best stop over TotalStack's Total Optimization on the three readings, each pinned at
  today's measurement **floored to two decimals and never at the goal** — a benchmark red for a target
  rather than for a regression would stop being a non-regression suite. **Twenty-two of the thirty-nine
  readings meet the goal and seventeen do not**, and the table beside the S-101 row names every one. The
  shape of the answer is consistent: the plan is **ahead** of TotalStack's full optimisation on the rare
  stock (4.21× a hired soldier and 2.18× a monster on his live camp of 2026-09-18, 15.31× a soldier on his
  450-hunter camp, 1.11–1.22× on the hunter armies), **behind** it a silver wherever a rival may spend an
  unlimited hired type at no silver (0.2593 on the bear-wall camp, 0.9237 on the evening account — the same
  shape `silverFloor` 0.41 already stood for), and **behind** it a hired soldier on his own two exports
  (0.7806 at 7 000, 0.6000 at 12 000) while beating it 2.07× and 1.79× a silver on the same armies. Those
  last two are the ones worth an engine story; the rest are within a percent of parity. The run now prints a
  `goal` line under every scenario, and the baseline gained the third standing it was missing
  (`ratios.perSilver`, optional as S-98's two are). **Additivity proved, not promised**: snapshot 17 against
  16 is 3 245 fields compared field for field with zero differences, and the regenerated proposal is 821
  leaf fields identical plus the additions and its own timestamp. Nothing in `src/` changed, no pin or
  baseline is re-based, and the suite ends on eight failures: the seven it began on and that camp's `stops` pin. Its snapshot's `planMs` column is a noisier run (22 754 ms over the sixteen, the camp at 11 466 ms, 2.2× inside the budget) than the back-to-back A/B the figures above come from.
- 2026-09-19 — **S-100 the baseline, reviewed.** *"The baseline is hard to review; we need a report
  generation to generate a report from the baseline to help the review."* The proposal is 40 kB of JSON and
  the rule it serves asks him to judge every trade in it before he renames the file, which is a reading task
  no one can do in JSON. `pnpm bench:review` now renders the page: a summary line (scenarios, campaigns,
  readings judged, ▲ / ▼ / =, stops lost and gained, the reading), each file's provenance, then one section
  a scenario — its standings against the best sizer sequence and against every captured TotalStack answer,
  the stops it lost or gained named with their figures, and one table a stop over the twelve readings the
  baseline holds, each with from, to, Δ, Δ % and **a verdict in the reading's own direction**: more damage
  is ▲, more silver is ▼ although the number rose. It ends with **Trades to judge**, every ▼ in the whole
  file with the lost stops first and the falls sorted by size, and with **Rises** beside it, so the decision
  is one pass down one table. **What the page will not smooth over** is the part worth keeping: two sides
  are comparable only on the same reading, and the reading moved on 2026-09-19 (S-94), so a snapshot's is
  inferred from its stage number and a mismatch is a bold warning at the top; a stop priced over one march
  against a stop priced over four says so above its own table; and a reading one side never carried is `·`,
  never a fall from nothing. Committed with its first real run, the proposal against snapshot 6 — 15
  scenarios, 28 campaigns, 268 readings judged, 143 ▲, 98 ▼, 27 =, the 12 000 export's `all-in` lost and the
  7 000 export's `silver-saver` gained — and with `--stages`, the 20 snapshots in story order plus the
  proposal, one table a scenario, each figure marked against the row above, which is where a story's effect
  on a bar is finally legible. It reads and never writes either side; registering a baseline stays his own
  rename. **Open**: the page says what moved and not why — the snapshot slugs are the story names already,
  so naming the story beside each stage is the next step.
- 2026-09-19 — **S-98 the benchmark and the baseline carry the rare-stock readings.** He asks for the bar to
  come in *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*, and two of
  those three were on the table already. The third had no column and the dominance pool's **dragon coins**,
  which S-96 put on the payload, had never reached this table at all. Three readings added and nothing
  substituted: the chunks of ten `mercLost` has always pooled, told apart into **hired soldiers** and
  **monsters**, and the coins beside them — five new columns on the report, five new fields a row, five on
  every baseline totals and two new standings. **Proved additive rather than promised so**: snapshot 16
  compares field for field identical with snapshot 15 on all twelve scenarios and every baseline entry in
  them, and the regenerated proposal differs from the committed one by the new fields and by the run
  timestamp in its own `note`. **The question the story had to settle** was where a *monster mercenary*
  belongs — with the monsters or with the soldiers — and TotalStack was asked first. Its `monsterSaving`
  flag, pressed on and off against the same scenario across the two 2026-09-18 datasets, moves
  `mercenaryCounts` and nothing else: EMH6 142 → 34 at 7 000, Legionary VI 2 017 → 926 on the evening
  account, Bear V 10 → 6 on the ten-bear army, `troopCounts` identical to the unit, `monsterCounts` empty in
  all 280 captured answers and `monsterCaps` never sent. So the flag shelters the **whole hired pool**, in
  TotalStack's vocabulary "monster" simply means "hired unit", and the page splits by **pool** rather than by
  race — which is an answer to a different question and no evidence either way on his. The split is drawn by
  race all the same, on the state of his own account: he houses no dominance unit, so monsters-as-the-
  dominance-pool would read nought on every army he plays and *"monster/dmg"* would be a floor with nothing
  under it. **What the new columns actually show**, and it is not one column printed twice: on the four bear
  armies the entire burn is monsters and on the hunter armies the entire burn is soldiers, and on the monster
  camp they part hardest — the steady max burns 28 soldier chunks against 84 monster chunks for 31 080 dragon
  coins, and stands at 0.976 of the best sizer sequence a soldier but **0.593** a monster where it stands at
  0.911 on damage. That is the first figure in this repo saying the plan buys its damage with monsters the
  sizer keeps, and it is worth an experiment of its own. **Open**: the floors themselves. *"At least the same
  as TotalStack full opt"* is a pin, and a pin needs his replay fixture; the readings are now there to pin it
  on and `pnpm bench:baseline` writes the figures it would be pinned at today. The seven failures S-95 left
  red are still exactly seven, and nothing was re-based.
- 2026-09-19 — **S-95 the band's yardstick is the goal, not the count of mercenaries.** He builds a
  seven-stack march with 25 hunters by hand, it costs less silver than the bar's recommendation and burns
  three chunks against five, and the bar will not carry it. The rule that refuses it is the band's
  token-field arm — half the hired units the *winner's* march fields — and experiment 112 re-measured four
  readings of it over the fifteen armies the criteria are held on, because S-94, S-96 and S-97 had moved
  everything under experiment 108's answer. The count loses on its own terms twice over: on the three
  smallest first-run armies the winner itself fields a token of the stock, so the arm asks for almost
  nothing and the band keeps a march worth **14.4 %** of that army's steady max — the extreme it exists to
  refuse — and on his own camp it put **every** plan of his hand-built family outside the bar's reach, 0
  against 41. Read on damage — *"we're too far off from our goal"*, and the goal is damage — the worst the
  band keeps anywhere is 37.8 %. Ten of the twelve benchmark scenarios do not move by a figure. His
  450-hunter camp **gains the eco stop he asked for**: 30 hunters over five troop stacks, 3 chunks,
  1 882 911 for 1 790 200 in 6d 21h. His live camp of 2026-09-18 gains one too, at 4 chunks and 4d 19h for
  22 % less silver. The evening account's recommendation rises 10 %, and the `stops` pin S-94 left red on it
  comes back green on its own — seven failures where there were eight, nothing re-based. **Two falls to
  weigh**: the 7 000 export's recommendation buys 6.4 % less damage over the campaign for 3.1 % more silver,
  against nine chunks of the rare stock kept and its old march still on that bar one stop along; and on the
  live camp the old recommendation does **not** survive — the new *more mercs* there is a different plan,
  3 285 305 for 2 635 500 at 10 chunks, worse and dearer than the 12-chunk march that left the bar.
  **What it does not do** is put his own march on the bar, and that is measured rather than hoped: read on
  the worst opening the bar now stands on, his march is 1.046 a silver against the sweet spot's 1.081 — his
  1.086 is the *expected* figure compared with the bar's worst opening, which is two arithmetics — and of
  every sheltered march on all fifteen armies that burns less than the sweet spot, costs no more silver and
  clears half the steady max's damage, not one is also at least as efficient a silver. The silver saver's
  own definition is what refuses him, and that is the next story.
- 2026-09-19 — **S-97 the top of the burn ladder, and the all-in re-sized instead of dropped.** The two
  things S-94 wrote down as open on his *"Aydae alone"* camp, measured before anything was built
  (`tools/theorycraft/out/111-coverage-and-all-in.md`, run on both engines over fifteen armies). The
  coverage first, and its cause is one line of geometry: the bar's burn sweep walks **down** from the
  search's winner, so the winner's burn is the ceiling of the whole bar — and a march ranked on the bad
  flip wants many stacks carrying the damage, so the winner became the deepest ladder the leadership pays
  for, which is the shape with the **lowest floor**, which is the shape that shelters the **fewest** hired
  units. The winner went thrifty and took the top of the bar with it. On his camp the ladder stopped at 7
  chunks and 3 387 893 a march while the sizer over four of its troop types shelters 17 chunks for
  **4 773 281**; on ten of the fifteen armies something above the top rung out-hit it. The fix asks the
  question the search could not: for each prefix of the troop ranking, the biggest troops the leadership
  pays for and the most hired units their own floor shelters — scored as a **shape**, not only as a vector,
  because on a cheap-troop army the whole-army sizer lowers the vector straight back to where it started
  (his export at 12 000: five swept vectors, five identical 17-chunk marches). It is scored and not
  *chosen*: the winner is the band's own yardstick, and letting these marches win emptied the thrift end on
  his camp of 2026-09-19 and broke S-93's criterion — measured, so the winner is put back afterwards and that camp’s thrift levels stay on the list the bar draws
  from — its bar still moves, by a chunk at the thrift end and by the rungs the pass adds above it. Then the `all-in`: S-94 dropped it where the honest answer was to
  re-size it. The walk that builds it only ever asks *"how much of the stock can you shelter?"*, never
  *"and what is the best shape for that much?"* — asked properly, his live camp of 2026-09-18 gets the same
  347 hired and the same 36 chunks for **45 % less silver**, and the stop is back on that bar. On his
  export at 12 000 the re-size finds nothing and the drop stands, which is the rule working rather than
  failing. Eleven of the fifteen armies do not move; four gain their top. The one trade to weigh is the
  12 000 export: its recommendation buys 16 % more reliable damage at the same silver for eight more chunks
  of stock, its steady max 1.3 % more damage for 12 % more silver, and the bar comes to three stops where
  it had four. Two criteria hold the two rules on every army and both fail on HEAD; nothing is re-based,
  and the eight assertions S-94 left red are still the only red ones.
- 2026-09-19 — **S-96 the plan fields and shelters the monsters.** *"Fix why the monsters are not shielded
  in the generated stack."* Experiment 110 measured it before anything was built and came back with a
  correction: on a camp that has unlocked the monster tiers the plan was not sheltering them badly, it was
  not fielding them at all — 0 of 12 types on one synthetic camp and 0 of 20 on another, on every stop, on
  every march of every stop, while the Battle card's sizers beside it field seventeen to twenty-one monster
  stacks. Every line of the planner that names the hired set said `authority`, so a dominance monster was
  dropped before any rule could reach it; the shelter criterion we already had passed on that camp for the
  worst possible reason. The set is now every pool but leadership, and the shelter, the grid, the put-back,
  the tighter shape, the `all-in` and the tails follow it without a second rule. Two things had to come with
  it, and both were defects the monsters merely uncovered: the search billed a monster like a troop — no
  chunk burned, no gold, no dragon coins, free on the axis the whole bar is ordered by — and it read a tie
  in total HP in a different order from the recap beside it, which is worth 3.7 M damage on one march where
  two dragons stand at exactly 3 600 000 HP each. A monster camp is also the first army where an uncapped
  type is not alone in its pool: a dozen of them each read the whole dominance pool and proposed marches
  needing five to twelve times the room the camp has, so a shape is now held to the housing the way a ladder
  has always been held to the leadership. **Not one figure of the ten benchmark armies moved** — none of
  them owns a monster. What it costs them in *search time* is a figure this benchmark cannot resolve, and
  that is said rather than rounded to nothing: three alternating rounds back to back on one machine put the
  ten at a median 4 776 → 4 353 ms (−8.9 %, the small armies slower and the large ones faster), while a
  second sitting put the same ten at 4 864 → 5 174 ms (+6.4 %) — one extra recovery call a hired stack and
  one housing check a shape are of the same order as the noise. The camp itself is registered as an eleventh
  scenario with a criterion that fails on HEAD, and it is the 900-dominance one rather than the 20 000: the
  registered camp's search finishes in 8.5–9.2 s inside the suite, a 2.7× margin under the app's own
  25-second plan budget, where the larger camp's ran 25.8–28.0 s in every run measured and is always cut off,
  so its bar is the clock's answer rather than the engine's. That is a follow-up, not a pin. One more thing
  is left open and worth saying plainly: the bar now carries a dragon-coin price and nothing holds it — the
  benchmark rows and the baseline proposal have no column for it, so a baseline he registers today would not
  catch a dragon-coin regression. On the camp that is
  registered the plan is ahead of both plain sizer rows on damage, silver **and** the stock at once, and
  behind the two average-damage Generate rows, which is the shelter's price stated rather than smoothed
  over. Nothing was re-based: the eight assertions S-94 left red are still the only red ones, and the new
  camp sits in the proposal for him to register.
- 2026-09-19 — **S-94 the plan stands on reliable damage.** *"Average damage is not average for sure; it's
  too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable damage
  actually."* The game decides who opens the fight, 50/50, and the plan was ranking, pricing and printing the
  midpoint of the two outcomes — a number no single fight pays out. Experiment 109 measured the gap on every
  stop of thirteen armies before anything was built: 1.2–4.0 % on most of them, 9.3 % on his live camp's
  sweet spot, **33 %** on a bear army's `all-in`, and it is widest where the bar spends most, because the
  top-HP stack is the enemy's first kill and only strikes at all when the army opens. One line of the engine
  changed — `marchOf` returns the enemy-first journal's total — and everything the plan says about damage
  follows from it; the recap is untouched and still prints worst, expected and best. The re-ranked bar is a
  different bar and mostly a better one: his export at 7 000 gains a fifth stop and 20.4 % of reliable damage
  on its `all-in`, the evening account's steady max climbs a rung for 5.6 %, and the search now fields
  **every** troop type his camps hold — which is his 2026-09-18 *"generation skips low-level stacks"*
  answered by the objective instead of by a pass, and leaves the put-back with nothing to put back. It costs
  two things, both stated rather than smoothed over: his 12 000 bar loses its `all-in` (it was behind the
  steady max on damage, silver and the stock at once, so the engine now declines to offer such a stop), and
  on one camp not covered by any pin the burn ladder stops climbing at 7 chunks where the old search reached
  17 — a search-coverage follow-up, not a reading one. Benchmark 12 re-prices every row, ours and our
  rivals', on the worst opening; the shares mostly rise, because the calculators we measure against are
  searched on average damage and give up more of themselves than we do. **Nothing was re-based**: he ruled
  the same day that *"the benchmark is like non-regression tests. A given scenario should not be worse, or
  it's a discrepancy, or a new baseline needs to be registered by me if the trade is ok."* So the pins and
  the criteria floors are left exactly where they were and **eight assertions are left failing** for him,
  and what was built instead is the mechanism the rule needs: `pnpm bench:baseline` proposes a baseline —
  every stop of every scenario with its damage, silver, gold, queue, burn, both ratios and the scenario's
  standing ratios against the sizers and each TotalStack row — into `plan-baseline.proposed.json`, which is
  inert until he sets `registeredBy` and renames it. From then on a run that hits less hard, costs more
  silver, burns more of the stock or loses a stop fails against **his** figures rather than against ours.
- 2026-09-19 — **S-93 the tighter shape.** He built a seven-stack march by hand that the plan could not
  reach, and asked for an "eco" stop that spends less silver and less queue while keeping the mercenary
  spend low. Experiment 108 measured the two suspects the coordinator named — the band's token-field
  yardstick and the missing hired vectors — and cleared both: four alternative yardsticks either refuse his
  march anyway or open the bar to a march at 8.6 % of the steady max's damage, and the sheltered-maximum
  vectors move no criterion on any of thirteen armies. What was missing is one **shape**: the sizer over a
  *prefix* of the troop ranking, the family a player builds when he puts the low tiers back one at a time.
  The engine now re-sizes every rung of the burn ladder that way and takes the result only when it is behind
  on none of damage, silver, stock burned and training queue. Two criteria hold it, both failing on HEAD.
  His own bar's recommendation drops from 70 hunters and 13d 18h to 50 and 8d 21h — but it costs 11 % *more*
  silver than the stop it replaces, and his own 25-hunter march is still outside the band, so he has no eco
  stop yet; that is the band's token-field rule, and §A says what changing it would cost. The 12 000 export
  gains a fifth stop and moves its knee, which re-bases four floors (each with the measurement beside it).
- 2026-09-18 — **S-92 the troop steppers in the tier colours.** He asked for the G1/S1/E1/M3 mnemonics to be
  coloured "as in Total Battle", TotalStack for inspiration, one colour a tier across the four groups and the
  text alone. Read off TotalStack's stepper live first (investigation 0021): exactly that, and the same ink on
  its mercenary pills. Built as one prop on `TierSelect` reading `tierInk`, the function the badges and pills
  already share, moved into the kit. TotalStack's VII–IX inks differ from ours and were left alone: our
  ladder would fold them onto tiers V, I and II; his account stops at VI.
- 2026-09-18 — **S-91 the finale's silver is the recap's.** The one campaign total still read off the search's raw pricing: the finale's silver, blind to the temple and the training discounts. Invisible on every profile in the repo; the recap criterion now also runs under a discount, where the old line overstated a finale by a quarter (9 of 11 armies). Benchmark 10 identical to 09.
- 2026-09-18 — **S-90 the campaign's gold includes the finale's gold.** The bug experiment 105's validator
  found: a repeated plan's campaign gold was its repeats' gold and nothing else, while the silver and the
  training queue beside it had always counted the finale too — so the one march that spends what the stock
  has left, and fields the most hired units of the campaign, was revived for free on the bar. The worst of it
  was 1 248 gold on his evening account, where the silver saver printed 1 944 against a true 3 192, and every
  army whose finale hires anything was short (the 12 000 export 2 280 → 3 464, his live camp 5 616 → 6 152 at
  the sweet spot). Nothing else moved: the `all-in` was already summing its sequence march by march, the
  troops-only tail revives nothing, and benchmark 09 is identical to 08 on damage, silver, burn and both
  ratios for every row — the only new thing in the file is the gold column the benchmark now carries. The
  standing criterion behind it is the one worth keeping: **a stop's campaign is the sum of what its marches
  cost**, gold, silver and queue together, priced by the recap the player can read for himself.
- 2026-09-18 — **S-89 the troops-only tail on the repeated stops.** He picked P1 off the six-proposal table:
  the marches a stop leaves on the table when its hired stock runs out before the horizon does. Every stop now
  ends the way the `all-in` does — the Elite sizer's march over the troops, no mercenaries, sized once a plan
  and shared — and the three stops it touches are the small-stock bears: 4 722 842 → **18 554 768**,
  9 557 884 → **18 779 168**, 14 168 526 → **18 779 168**. Nothing else moves, by construction: every stop
  rule reads the repeated march, so the tail is added after all of them have run, and benchmark 08 differs
  from 07 on exactly those three rows. The price he accepted is that a stop's damage *a hired unit* now counts
  damage no mercenary bought; the gain is that the bar and the sizers are finally being asked the same
  question, four marches against four.
- 2026-09-18 — **S-88 the reference table over the plans the bar may offer.** He read a 2.91-a-silver row
  under his own bar and asked why it was not a stop: it was a one-troop-stack march the band refuses, because
  the table was bucketed over every shape the search priced. It is bucketed over the band plus the stops now —
  the set as *offered*, so a stop the put-back re-sized is in it — and his table goes 11 rows to 3, its peak
  2.759 → 1.987 a silver, its cheapest row 2 140 100 → 5 782 400 silver; his live camp had **0** of 10 rows
  backed by a band plan and now has 3 of 3. No stop moved (benchmark 07 is byte-identical to 06, and the
  search got a little faster for losing the per-shape bucket bookkeeping). The caption says whose plans the
  rows are. **S-88b**: P6 measured — the hired lost equals the chunk tithe on every steady-max and more-mercs
  stop of the 13 armies, and after S-87 no stop exposes a hired stack — so both stops are kept as they are.
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
