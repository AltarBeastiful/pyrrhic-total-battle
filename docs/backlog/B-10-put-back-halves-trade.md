---
type: reference
title: "B-10 Putting a left-out troop back cuts the trade in half"
created: 2026-10-09
tags: [backlog, trades, investigation, engine]
related: ['[[00-inventory]]', 'T-30', '[[the-rated-retyping]]']
---

# B-10 Putting a left-out troop back cuts the trade in half

## Context

Status 2026-10-10: Critical 03 reproduced the SW1 put-back on this export (experiment 201, `tools/theorycraft/201-put-back.test.ts`, reads the file from the repo root, skipped where absent) and made put-back follow Tight on the same set, idempotent with take-out. The export is still untracked and not a fixture (no consent recorded). Remaining: the owner retests his march; if the trade now appears, close this item; if not, narrow it to the explanation text.

Data: the untracked `pyrrhic-my-account-2026-10-07.json` at the repo root (kind/payload export, not a fixture). Overlaps S-80 (put-back pass), S-141 (shelter margin patch) and the Tight default.

## Problem

With SP3 and SW1 left out, adding SW1 back produced 27M damage for dominance, gold and mercs, but the plan table then offers no tight trade at that point; the only way back to good damage is to move up the ladder to more mercs. The owner asks to explain it or offer another list.

## Proposal

Turn the export into a fixture, reproduce both marches, then decide: explanation text, an alternative trade list, or an engine fix.

## First step

Copy the export to `tools/theorycraft/fixtures/my-account-2026-10-07.json` (after consent) and write `tools/theorycraft/201-put-back.test.ts` with report `tools/theorycraft/out/201-put-back.md`.

## Acceptance criteria

- [ ] The export is a fixture under `tools/theorycraft/` or the test fixtures folder, with the owner's consent to commit it.
- [ ] A test reproduces the two marches and records their ratings.
- [ ] A decision note names the fix (text, list or engine) before any build.
- [ ] Benchmark rating does not regress: `pnpm` benchmark run (`tools/theorycraft/out/benchmark-latest.json`) shows no scenario worse than its registered baseline; only the owner registers a new baseline.
- [ ] Tests pass on the kernel path as well as the TS path (one test, both paths, red on both first).

## Design rules touched

Rules 13, 29 if a text or list is added.

## Size

M: reproduction first; the fix is unknown.

## Dependencies

Depends on the export becoming a fixture.

## Open questions for the owner

1. May the account export be committed (it contains the profile)?
