---
type: reference
title: "B-11 Adding ARC3 to the profile lowers the rating of marches"
created: 2026-10-09
tags: [backlog, rating, investigation, engine]
related: ['[[00-inventory]]', 'T-34']
---

# B-11 Adding ARC3 to the profile lowers the rating of marches

## Context

Not reproduced offline. The owner's reference march is counts only; a rating needs the full profile. The only profile at hand is the untracked export of 2026-10-07.

## Problem

Adding ARC3 to the profile makes the rating of the reference march go down, though a higher troop tier should not hurt.

## Proposal

Load the export as a fixture, rate the reference march with and without ARC3 through `rate()`, and trace the cause (a bonus, the kill order or the tier cap).

## First step

Fixture description (verbatim from `todos.md`, entry dated 28/09 22:43, "Reference march"): SP1 1377, SW1 2655, RD1 605, RD2 336, ARC1 1372, RD3 188, ARC2 759, SP3 424, SP2 751, EMH6 30, BB 18, SG 17, ED 19, WE 40. Also the Tight (22.4) march: SW1 3024, ARC1 1827, SP1 1671, RD1 797, ARC2 1008, SP2 924, RD2 440, ARC3 564, SP3 516, RD3 246, BB 27, ED 27, SG 23, WE 59, SPX6 3, CHR6 10, LGN6 20, EMH6 20, ABT6 19, and the As is (12.8) march with the same troops and BB 8, ED 9, SG 7, WE 20, SPX6 1, CHR6 6, LGN6 13, EMH6 13, ABT6 14. Test in `tools/theorycraft/202-arc3-regression.test.ts`, report `tools/theorycraft/out/202-arc3-regression.md`.

## Acceptance criteria

- [ ] A test rates the reference march with and without ARC3 and records both numbers.
- [ ] If the rating drops, the cause is written down and fixed or explained.
- [ ] The reference march is stored verbatim as a fixture (below).
- [ ] Benchmark rating does not regress: `pnpm` benchmark run (`tools/theorycraft/out/benchmark-latest.json`) shows no scenario worse than its registered baseline; only the owner registers a new baseline.
- [ ] Tests pass on the kernel path as well as the TS path (one test, both paths, red on both first).

## Design rules touched

None.

## Size

M: reproduction, then an unknown root cause.

## Dependencies

Same fixture as B-10.

## Open questions for the owner

1. Is ARC3 available with the full profile at that time (28/09 22:43)?
