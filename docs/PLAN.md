# Pyrrhic — implementation plan

A fully client-side replacement for TotalStack's *Epic Monster Stacking* calculator for Total Battle.
No accounts, no server, no logging. Profiles, saved stacks and settings live in the browser
(localStorage/IndexedDB) and can be exported as JSON or shared as a URL that carries the whole config.

Companion documents: `docs/research/totalstack-review.md` (what TotalStack does, verified formulas) and
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

Stack: **Vite + React 19 + TypeScript (strict)**, Tailwind CSS v4, Zustand (state, persist middleware),
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
**Minimum** (enemy first), **Maximum** (we strike first) and **Average** damage. Our stacks attack in
HP-descending order, the same order the enemy kills them in — this is TotalStack's verified model and it reproduces
the round structure of two real reports exactly. (The two reports also show one stack, Rider I, being killed before
its turn while the next stack attacked; a possible refinement — foot troops before mounted, then monsters, then
mercenaries — is recorded as an observation in the fixture file, not implemented until confirmed.) Each stack targets
the enemy stack it has the best `strengthAgainst` for, else the melee squad. Within a round the enemy's N attacks
(each killing our highest-HP living stack) alternate with single friendly attacks; after the N-th enemy attack every
surviving stack attacks once. "Army first" only changes round 1. Double damage is a ×2 on a single hit (seen once in
game, labelled as such); strike-two-squads is not modelled until observed. Damage per hit from 3.2; expected damage adds double-damage and
strike-two-squads probabilities. Total damage = Σ over hits until all our stacks are dead or the round cap.
Journal output = the same numbered hit list as the in-game report so users can compare 1:1.

Recovery: units are trained and revived **in chunks of ten**, and one unit per chunk comes back free. With
`chunks(n) = ceil(n / 10)`: **Retrain** = Σ troops `n × training.silver × (1 − trainingCostReduction[group]/100)`
+ Σ monsters `chunks(n) × training.silver`, time the same split on `training.seconds` divided by
`1 + trainingSpeed[group]/100`, dragon coins = Σ monsters `chunks(n) × training.dragonCoins`, plus the monsters'
revive gold (monsters cannot be retrained back into the march); **Revive** = Σ all `(n − chunks(n)) ×
revival.gold / templeMultiplier[templeLevel]`; **Selective** = revive the top-N unit types by tier, retrain the
rest. These reproduce every silver, gold, dragon-coin and duration figure of the seven captured runs exactly
(battle-model-observations §4); revive *silver* and revive *time* are still open.
Summary metrics: stacks, min/avg/max damage, damage per silver, per gold, per dragon coin, retrain silver,
retrain gold, time to retrain. Shown with deltas when the user edits counts manually.

The exact turn structure (why TotalStack reports "25 rounds • 15 friendly hits" for 10 stacks vs 4 enemy stacks)
must be validated against real in-game battle reports before this section is called done — see S-30.

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

Status on 2026-09-12 (first implementation pass, branch `development`):

| Milestone | Done | Open |
|---|---|---|
| M0 Foundation | S-01, S-02, S-03, S-04, S-05 (manual form: `pnpm data:compare`), S-06 | S-07 (decision on automated fetching; ADR-0001 still proposed) |
| M1 Configuration UI | S-10 … S-19 (titles editor included after all: cheap once `titles.json` existed) | — |
| M2 Engine v1 | S-20 … S-25 | — |
| M3 Battle Summary | S-31, S-32, S-33, S-34 | S-30 remains an in-game validation story: friendly attack-order nuance, revive silver and revive time (see battle-model-observations §4) |
| M4 Optimisation | S-40, S-41, S-43, S-44, S-45; D-04 pulled back as the "relaxed preservation" toggle (investigation 0003) | S-46 (gated), S-47 |
| M5 Polish | S-50, S-52 | — |

Known gaps: VIP table values and 14 artifact level tables are unknown (hand-typed values in the UI until
contributed); round-to-10s troop counts differ from TotalStack by a few units; the beast-boost anomaly is not
modelled; custom mercenaries have no cap field.


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
