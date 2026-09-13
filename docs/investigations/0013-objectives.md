# Investigation 0013 — "choosing an objective changes nothing"

2026-09-13, against the owner's army (`docs/research/totalstack-review.md` §3): G I–III (mounted only at
III), S I, SW1 and RD2 removed by hand, four tier-6 mercenaries at their caps, 4,100 / 2,500 / 0, Elite
Preservation, +39.5 % guardsmen health, +76 % strength. `sizeStacks` reproduces that run's counts to ±1.

## 1. Wiring — no defect

Bar → `updateActiveSetup({ priority })` → `setup.priority` → `generate.ts` (`'none'` → `client.stack`,
else `client.search` with `objective: setup.priority`) → `runSearch` → `searchPriority`. Nothing else writes
`priority`; the Battle card no longer offers it. `tests/engine/objectives.test.ts` proves it without a DOM:
six choices, one identical `StackRequest`, five search jobs differing in exactly one field.

## 2. The engine, on that army

Ten types, enumerated exhaustively (1,023 subsets), so each answer is the true optimum.

- **No priority, highest average, best worst case and damage per silver give byte-identical marches**:
  min 3,316,771, avg 3,374,028, 1,549,800 silver, 640 gold, 2.177 dmg/silver, 5,272 dmg/gold.
- **Damage per gold** drops ABT6/LGN6/CHR6: gold **152**, dmg/gold **9,949**, avg 1,512,294.
- **Damage per dragon coin**: dominance 0, no coin spent — unmeasurable (§4).

The owner has already hand-trimmed his army to the set the search would pick; it is not a near-tie (best
nine-type march: −9.1 % average, −9.8 % worst case, −11.2 % per silver). Put SW1 and RD2 back and the
objective moves the march again (avg 2,519,176 → 3,481,160, +38 %); clear the mercenary caps and all five
answer differently (per-silver 14.99 → 20.02, keeping ARC1 + ABT6 + CHR6).

## 3. Against the captured runs

`ep-priority-max-damage`: TotalStack's Maximum Damage kept all 14 types (avg 2,131,530) while its plain
8-type run scored 2,515,830 — its search misses its own better answer. Ours drops SW1 + SP1, exactly the
kept/dropped set of `ep-8stacks` / its Damage-Silver run. Our Damage/Silver goes further, to a monsters-only
march (4.310 vs 1.118): a pure ratio has a degenerate peak, monsters being retrained ten at a time.
**Open product question: should the per-cost objectives carry a damage floor?** Not invented here.

## 4. Fixed

- **The greedy path above 12 types was seed-dependent** — 1.118 / 3.923 / 4.310 on seeds 1 / 2 / 7 — because
  it only hill-climbed from the full formation and from coin-flip subsets, spending 1,047 of 8,000 ms. It
  now also starts from each pool and each pool's complement, alternates shrink and grow, and takes 64
  restarts: every objective reaches the brute-force optimum on every seed, in ~300 ms.
- **`SearchResult.unmeasurable`**: when every candidate scores −∞ (zero denominator) nothing was compared
  and the winner is the plain march. The engine now says so.

## 5. What the UI must change

1. Nothing dropped → no strip of seven zero deltas. Say *"Highest average damage keeps every type — none
   can be left at home without losing damage."*
2. `unmeasurable` → *"this march costs no dragon coins, so this objective cannot be compared"*, no strip.
3. Better: five searches here cost ~1.5 s. Show min/avg/silver/gold **per objective, side by side**.
