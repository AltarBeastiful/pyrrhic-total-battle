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

**Pinned unit types.** A unit type the user pins from the results ("Keep in march", stored per battle setup as
`pinnedUnitIds`) is never dropped: when the solver would leave it empty (Troops-first ceiling, tens rounding, no
room) it reserves its minimum count (1, or 10 in tens mode) before the rest of the pool is re-solved, so the
other stacks stay balanced; if it then sits above the ceiling it keeps its true place in the HP order and a
warning says it will fall before the last troops. Pins are also kept by the priority search. Pinning an
excluded type un-excludes it.

### 3.5 Battle model and Battle Summary
Enemy: 4 stacks (flying/melee/ranged/mounted), 8 for Arachne's, or custom counts. Each enemy hit removes our
highest-total-HP living stack. Sides alternate; whoever strikes first is a coin flip in game, so we compute the
**Minimum** (enemy first), **Maximum** (we strike first) and **Average** damage. A fight runs on **two orders**
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
   top tier, category chips to exclude not-yet-upgraded types. A compact grid preview of every included unit
   with per-unit exclude toggles ("I upgraded archers only" = untick the other G-max units).
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

68 done, 3 in progress, 6 backlog, 2 deferred, 1 gated, out of 80 stories.

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
