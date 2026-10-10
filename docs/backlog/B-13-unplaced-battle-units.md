---
type: reference
title: "B-13 Units missing from the battle selection order"
created: 2026-10-10
tags: [backlog, troops, monsters, data]
related: ['[[README]]', '[[B-12-equipment-revamp]]', 'CRITICAL-04-Troop-Order']
---

# B-13 Units missing from the battle selection order

## Context

Status 2026-10-10: Critical 04 shipped (b650875) with the owner's 61 + 20 list; these 12 units remain unplaced.

Critical 04 (`.maestro/playbooks/2026-10-10-Critical-Items/CRITICAL-04-Troop-Order.md`) orders the Troops card the way the battle selection screen lists units. The owner's list gave 61 troops and 20 monsters. Twelve units in `src/data/tables/` were not in that list, so the order table leaves them out and the fallback sort places them.

## Problem

It is not known whether these units appear on the battle selection screen at all, and if they do, where. Placing them without that answer would invent an order.

Not in the owner's list:

- Troops (4): `corax-1`, `corax-2`, `royal-lion-1`, `royal-lion-2`.
- Monsters (8): `devastator-1`, `devastator-2`, `fire-phoenix-1`, `fire-phoenix-2`, `kraken-1`, `kraken-2`, `trickster-1`, `trickster-2`.

## Proposal

Check the game, then decide. For each unit: does it appear on the battle selection screen (yes, no, or only at some level or event)? If yes, record its position relative to its neighbours. Then either add it to the order table, or mark it as not in the battle selection and keep the fallback sort.

## First step

Owner screenshot of the battle selection screen (troops and monsters) so each of the 12 units can be checked against it. No code until that answer exists.

## Acceptance criteria

- [ ] Each of the 12 units has a recorded answer: on the battle selection screen (with its position) or not.
- [ ] The order table in `src/data/` gets the placed units, with a `src/data/CHANGELOG.md` entry, or the table stays as is with a note that these units are not on the screen.
- [ ] Units confirmed absent keep the `sortForDisplay` fallback, as Critical 04 requires for ids missing from the table.
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

## Design rules touched

None.

## Size

S: a screenshot check and a table edit.

## Dependencies

Owner screenshot. Depends on Critical 04 Task 3 (the order table exists) to add the entries.

## Open questions for the owner

1. Do Corax I/II and Royal Lion I/II appear on the battle selection screen?
2. Do Devastator I/II, Fire Phoenix I/II, Kraken I/II and Trickster I/II appear on it?
3. If they appear only at some level or during an event, which condition should the order note?
