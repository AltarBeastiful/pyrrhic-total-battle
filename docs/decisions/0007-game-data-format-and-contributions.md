# ADR-0007 — Game data as plain JSON tables with CI validation and open contribution

Status: Accepted (2026-09-12)

## Context
Unit statistics and bonus tables change with game updates. The maintainers will not keep up alone; other players
must be able to fix or add data through a pull request without knowing the code base. Values must be verifiable
against in-game screens. Provenance matters (ADR-0001, PLAN §2.3).

## Options considered
- Format: **JSON** (universal, native import in Vite, diffable), YAML (comments, but another parser and easy
  indentation mistakes), TypeScript modules (type-checked, but "edit code" scares non-developers), CSV (bad for
  nested fields such as `strengthAgainst`).
- Granularity: one file per table vs one file per unit (hundreds of files; noisy) vs one big file (merge conflicts).
- Validation: at runtime in the browser, **in CI/tests**, or both.

## Decision
- `src/data/tables/<table>.json`, one file per table (troops, monsters, mercenaries, captains, equipment,
  artifacts, titles, heroes, events, temple, orders), plus `version.json` and `CHANGELOG.md`. Arrays sorted by
  id; a formatter (`pnpm data:format`) rewrites files with a fixed key order and 2-space indent so diffs show only
  the changed value.
- Records use game-facing names and only fields readable in game or in a battle report (base health, strength,
  strength-against, housing cost, training time/cost, revival cost, double-damage chance, category, group, race,
  tier). Derived values are never stored.
- Validation runs in CI on every PR and in `pnpm test`: zod schema per table, cross-table integrity (unique ids,
  order lists reference known ids, tier/category rules), formatting check, and the engine regression suite. At
  runtime the app trusts the bundled JSON (validated at build), keeping startup cheap.
- Contribution process: `CONTRIBUTING.md` + PR template asking for the in-game evidence (screenshot or report),
  a `CHANGELOG.md` line, and a `version.json` bump. Small, focused PRs are encouraged ("add Tier 10 archers").
  Maintainers verify against the game before merging; the optional TotalStack comparison (ADR-0001) is advisory.
- Provenance: `version.json` states the verification date; the app shows it in an About panel.

## Consequences
- Anyone comfortable editing a JSON file in the GitHub web editor can contribute; CI catches typos.
- Renaming an id is a data migration (ADR-0004) because saved profiles reference ids; the changelog must say so.
- Nested fields stay readable; no extra parser or build step.
