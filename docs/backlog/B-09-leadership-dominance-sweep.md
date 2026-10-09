---
type: reference
title: "B-09 Non-linear results when raising leadership, and the dominance/leadership sweep overlap"
created: 2026-10-09
tags: [backlog, investigation, advisor]
related: ['[[00-inventory]]', 'T-11', 'T-22', 'T-23', '[[advisor-step-d]]']
---

# B-09 Non-linear results when raising leadership, and the dominance/leadership sweep overlap

## Context

Existing evidence: `tools/theorycraft/out/21-leadership-curve.md`, `23-campaign-leadership.md`, `118-less-leadership.md`. None runs the "aydea" cases through the current Tight bar. S-158 (`docs/plans/advisor-step-d.md`) already ships dominance and leadership sweeps.

## Problem

Raising leadership does not seem to give linear results. The advisor sweep may already answer it, so this item must not become a second feature.

## Proposal

Run the S-158 sweep on the aydea cases under Tight and read the flattening points. Report whether the advisor card already says it; if not, extend the card text only.

## First step

Reuse `src/engine/advisor-sweeps.ts` in `tools/theorycraft/200-leadership-aydea.test.ts`, output `tools/theorycraft/out/200-leadership-aydea.md`.

## Acceptance criteria

- [ ] A report on the aydea fixture shows damage against leadership with the flattening points marked.
- [ ] It states whether the advisor card's reading agrees.
- [ ] No new sweep code if S-158 covers it.
- [ ] Benchmark rating does not regress: `pnpm` benchmark run (`tools/theorycraft/out/benchmark-latest.json`) shows no scenario worse than its registered baseline; only the owner registers a new baseline.
- [ ] Tests pass on the kernel path as well as the TS path (one test, both paths, red on both first).

## Design rules touched

None unless the card text changes (rule 27: sentences, not a grid of numbers).

## Size

S: measurement on shipped machinery.

## Dependencies

S-158; shares fixtures with B-08.

## Open questions for the owner

1. Where are the aydea cases stored today?
