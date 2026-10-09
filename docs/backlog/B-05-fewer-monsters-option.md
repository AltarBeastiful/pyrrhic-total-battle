---
type: reference
title: "B-05 "Use fewer monsters" option"
created: 2026-10-09
tags: [backlog, monsters, advisor, investigation]
related: ['[[00-inventory]]', 'T-13', '[[advisor-step-d]]']
---

# B-05 "Use fewer monsters" option

## Context

Fewer mercs exists as the hired saver stop (S-87, W10). The raise control (S-142) only raises monsters. `src/engine/advisor-sweeps.ts` already sweeps dominance and leadership; the monster count is a probe there.

## Problem

No equivalent of the merc saver exists for monsters, and no story covers it.

## Proposal

Answer first with an advisor sweep of the monster count: how damage and silver move as monsters drop. Only if the curve has a useful knee, consider a UI.

## First step

Extend `src/engine/advisor-sweeps.ts` with a monster-count sweep and an experiment `tools/theorycraft/198-monster-count.test.ts`; report in `tools/theorycraft/out/198-monster-count.md`.

## Acceptance criteria

- [ ] The sweep output shows damage and silver per monster count for the fixture accounts.
- [ ] If a UI follows, it carries rule numbers and its own story.
- [ ] Benchmark rating does not regress: `pnpm` benchmark run (`tools/theorycraft/out/benchmark-latest.json`) shows no scenario worse than its registered baseline; only the owner registers a new baseline.
- [ ] Tests pass on the kernel path as well as the TS path (one test, both paths, red on both first).

## Design rules touched

None until a UI is proposed.

## Size

M: a sweep in existing machinery; the UI decision follows the result.

## Dependencies

S-158 sweeps.

## Open questions for the owner

1. Is this for saving gold, silver or time?
