---
type: reference
title: "B-08 Army modernization strength with no dominance selected"
created: 2026-10-09
tags: [backlog, investigation, advisor]
related: ['[[00-inventory]]', 'T-12', 'T-11', '[[advisor-step-d]]']
---

# B-08 Army modernization strength with no dominance selected

## Context

No experiment in `tools/theorycraft/out/` varies army modernization alone; grep hits only monster-camp notes 110, 113, 128, 129.

## Problem

The owner saw non-linear results when raising army modernization (with monsters added) and wants it checked with dominance off.

## Proposal

One probe sweep of modernization strength with and without dominance, using the advisor machinery.

## First step

Add `tools/theorycraft/199-modernization-probe.test.ts` writing `tools/theorycraft/out/199-modernization-probe.md`.

## Acceptance criteria

- [ ] A report plots damage against modernization strength for both settings on the "aydea" fixture.
- [ ] Findings state whether the curve is linear and where it flattens.
- [ ] Benchmark rating does not regress: `pnpm` benchmark run (`tools/theorycraft/out/benchmark-latest.json`) shows no scenario worse than its registered baseline; only the owner registers a new baseline.
- [ ] Tests pass on the kernel path as well as the TS path (one test, both paths, red on both first).

## Design rules touched

None.

## Size

S: one probe over existing sweep code.

## Dependencies

B-09 shares the fixture work.

## Open questions for the owner

1. Is the "aydea" fixture (`e1ded8e`) the right case?
