# Game data changelog

Every change to `src/data/tables/` is listed here, newest first, together with the `dataVersion` it ships
in. Saved profiles record the `dataVersion` they were built with, so this file is also the migration log:
a renamed or removed `id` must be called out explicitly.

How to read a line: **what changed** — how it was verified.

## v1, amended 2026-10-10 (no bump)

- **VIP** — `vip.json` now runs from level 0 to 25 with real values, the same for army health and army
  strength: 0.5 % a level up to level 8 (4 %), 1 % a level from 9 (5 %) to 24 (20 %), 25 % at level 25. Read
  from the VIP screen by the owner. Replaces the all-zero placeholders for levels 0 to 15.
- **Battle selection order** — new table `battleSelection.json`: the 61 troops and 20 monsters in the
  order the game's battle selection screen lists them, top to bottom, for the March's pills (Critical 04).
  Read by the owner from the screen on 2026-10-10; the counts shown beside each name were dropped. The
  screen did not list `corax-1/2`, `royal-lion-1/2`, `devastator-1/2`, `fire-phoenix-1/2`, `kraken-1/2`
  and `trickster-1/2`, so the table leaves them out rather than guessing a place. Display only: the
  engine never reads it and no value changed, so `dataVersion` stays 1, as for the 2026-10-09 amendment;
  the owner decides whether it should be bumped anyway. Verified by `data.test.ts`: every id is a known
  unit, listed once.

## v1, amended 2026-10-09 (no bump)

- **Captains** — Amanitore carries `"onlyOn": "group"` and Hercules `"onlyOn": "epic"`: the restriction
  their `note` already stated, in a form the derivation applies once a march names its type (W17 C5-0).
  No number and no id changed, so `dataVersion` stays 1, on purpose against the "any change bumps" rule of
  `docs/data/README.md`: a bump makes every older share link say its values may have changed, and none
  did. The owner decides whether it should be bumped anyway. Verified against the two notes; `data.test.ts` checks that
  every note is one of these restrictions.

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
- **VIP** — levels 0 to 15 as placeholders, all zero (filled 2026-10-10, see above).

Player-versus-player values present in the capture were dropped on purpose: PvP is out of scope (PLAN §1).
