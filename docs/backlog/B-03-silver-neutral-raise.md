---
type: reference
title: "B-03 More mercs while still shielded, without adding silver"
created: 2026-10-09
tags: [backlog, raise, engine, measure-first]
related: ['[[00-inventory]]', 'T-03', '[[tight-default]]']
---

# B-03 More mercs while still shielded, without adding silver

## Context

S-143 to S-149 added the `Most`, `Safe` and `Tight` raise positions (`docs/PLAN.md` lines 442 to 450); Tight is the default (`docs/plans/tight-default.md`). Tight is capped at the plan's own authority burn, not at the plan's silver. S-146 (`Best v2`) is marked "backlog, measure first".

## Problem

In scenarios with few or no monsters the plan could still add shielded mercs for the same silver; Tight stops at the authority burn and leaves that headroom.

## Proposal

Measure first how many scenarios have such headroom (extra mercs at equal silver, still shielded). Only if the count is material, fold a silver-neutral raise into planning or Tight.

## First step

Add `tools/theorycraft/197-silver-neutral-headroom.test.ts`; for each benchmark scenario compute the extra shielded mercs affordable at the plan's silver, output `tools/theorycraft/out/197-silver-neutral-headroom.md`.

## Acceptance criteria

- [ ] A report states the share of benchmark scenarios with silver-neutral headroom and the damage it would add.
- [ ] If implemented, no scenario's rating or silver gets worse.
- [ ] Benchmark rating does not regress: `pnpm` benchmark run (`tools/theorycraft/out/benchmark-latest.json`) shows no scenario worse than its registered baseline; only the owner registers a new baseline.
- [ ] Tests pass on the kernel path as well as the TS path (one test, both paths, red on both first).

## Design rules touched

None directly (engine). Rule 29 (honest objectives) if a new stop appears.

## Size

M: measurement is small; planning change touches the stop ladder and the benchmark.

## Dependencies

S-146, B-04 (a manual control may make this unnecessary).

## Open questions for the owner

1. Is a silver-neutral raise wanted in planning, or is the manual control (B-04) enough?
