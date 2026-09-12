# Game data changelog

Every change to `src/data/tables/` is listed here, newest first, together with the `dataVersion` it ships
in. Saved profiles record the `dataVersion` they were built with, so this file is also the migration log:
a renamed or removed `id` must be called out explicitly.

How to read a line: **what changed** — how it was verified.

## v1 — 2026-09-12

First set of tables (S-02). Reshaped from the research capture in `docs/research/totalstack-data/`, which
was read on 2026-09-12; the parity test in `src/data/data.test.ts` proves the reshaping kept every number.
**These values still have to be verified one by one against the in-game screens** — see the provenance note
in `docs/data/README.md`.

- **Units** — 65 leadership troops, 28 dominance monsters, 69 authority mercenaries, with base health,
  strength, housing cost, strength-against, own double-damage chance, revival gold and training time/cost.
- **Captains** — 30 captains in picker order; 21 of them with their health, strength or special progression
  (`perLevel` + 7 star steps). The nine the capture had no numbers for (Proscope, Tengel, Doria, Stror,
  Carter, Dustan, Aurora, Farhad, Helen) are listed without a progression so the picker shows them.
- **Equipment** — 12 pieces, bonuses per quality, including the category-versus-target lines.
- **Artifacts** — 15 artifacts with the key each progression feeds and the random-bonus options. Only
  _Heart of the Forest_ has its level and star tables; for the others the app asks for the value.
- **Titles, heroes, pills** — 28 titles, 3 heroes (Svyatogor marked `aloneOnly`), 5 fixed +25 % pills.
- **Events** — Arachne's Invasion (enemy formation of two per category, switches on `swarmUnits` bonuses)
  and Ragnarok - Fenrir (+130 % strength).
- **Temple** — revival-cost divisor for levels 1 to 45.
- **Orders** — default troop and monster kill orders, captain picker order.
- **VIP** — levels 0 to 15 as placeholders, all zero: the capture had no VIP table. Contributions welcome,
  read from the VIP screen in game.

Player-versus-player values present in the capture were dropped on purpose: PvP is out of scope (PLAN §1).
