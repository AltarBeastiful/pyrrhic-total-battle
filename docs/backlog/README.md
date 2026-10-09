---
type: reference
title: Backlog index
created: 2026-10-09
tags: [backlog]
related: ['[[00-inventory]]', '[[01-relevant]]', '[[03-needs-owner]]', '[[progression-advisor]]', '[[advisor-step-d]]', '[[design-rules]]']
---

# Backlog

Twelve items refined from the ideas in `todos.md` that triage (see `triage/README.md`) marked `relevant` or `partly-done`. Nothing here is implemented. The owner picks which become stories and in what order. Rule numbers refer to [[design-rules]]. Every engine item carries two standing criteria: the benchmark rating does not regress, and tests pass on the kernel path.

T-18, T-19 and T-20 are sub-asks of the equipment revamp and live inside B-12.

## Items in proposed order

Order: cheap UI fixes first, then game-data items, then investigations, then long-term.

| Order | Id | Title | Size | Dependencies | Rules |
| --- | --- | --- | --- | --- | --- |
| 1 | [[B-06-em-dash-pass]] | Remove em dashes from the UI (phase one) | S | none | 26 |
| 2 | [[B-01-sweet-spot-hue]] | Hue around the sweet spot, check it is best rated | S | none | 18, 19, 20, 23, 24 |
| 3 | [[B-02-hero-level-indicator]] | Hero level and stars at a glance | M | design artifact | 7, 12, 18, 19, 20, 23, 24, 31 |
| 4 | [[B-07-vip-table]] | Fill the VIP table | S | owner data | none |
| 5 | [[B-08-modernization-probe]] | Army modernization strength without dominance | S | B-09 fixtures | none |
| 6 | [[B-09-leadership-dominance-sweep]] | Leadership non-linearity on the aydea cases | S | S-158 | 27 |
| 7 | [[B-11-arc3-rating-regression]] | ARC3 lowers march ratings | M | fixture (B-10) | none |
| 8 | [[B-10-put-back-halves-trade]] | Putting a troop back halves the trade | M | fixture, owner consent | 13, 29 |
| 9 | [[B-03-silver-neutral-raise]] | More shielded mercs at equal silver | M | S-146 | 29 |
| 10 | [[B-04-merc-fill-button]] | Per-stack merc fill button | M | B-03, design artifact | 6, 9, 14, 18, 19, 23, 24 |
| 11 | [[B-05-fewer-monsters-option]] | Fewer monsters option | M | S-158 | none yet |
| 12 | [[B-12-equipment-revamp]] | Equipment revamp | L | T-21 decision, design artifact | 6, 18, 20, 23, 24, 31 |

## Covered by the advisor playbook

Delivered by S-150 to S-158 ([[progression-advisor]], [[advisor-step-d]]), so no new item:

| Todo | Covered by |
| --- | --- |
| T-09 advice on what would improve the plan | Phase 03 and 04: the advisor card (S-151, S-152) |
| T-10 next moves in research or training | Phase 04b and 05: upgrade costs and captain advice (S-153 to S-157) |
| T-22 sliding leadership and dominance | Phase 06 step D sweeps (S-158) |
| T-23 real planning algorithm for sweeps | Worker pool and portfolio (S-150, S-158) |

Open items that the advisor machinery should answer first: B-05, B-08, B-09 (and the spike check in T-29, see below).

## Blocked on the owner

| Todo | Question | Detail |
| --- | --- | --- |
| T-21 | Whole sets per hero or one item at a time? | Gates B-12 |
| T-24 | Is a monster worth half a merc in the rating? | A rating change; only the owner registers a new baseline |
| T-28 | What does the hall of fame panel list? | Needs a screenshot or the list |
| T-29 | Control for merc deaths, after the spike check | A measurement precedes any control |
| T-35 | Which slider, and what rule on stock? | Report mixes the merc slider and the raise positions |
| T-15 scope | UI strings only, or comments and docs too? | Gates phase two of B-06 |

Details in [[03-needs-owner]]. B-07 also needs data only the owner can read from the game.
