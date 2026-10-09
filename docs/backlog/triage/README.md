---
type: analysis
title: Todos triage, summary and index
created: 2026-10-09
tags: [backlog, triage]
related: ['[[00-inventory]]', '[[01-relevant]]', '[[02-done-or-obsolete]]', '[[03-needs-owner]]', '[[Progression-Advisor-Plan]]']
---

# Triage of `todos.md`: summary

Phase 07 of the initiation playbook. Documents only; nothing was implemented. Phase 08 turns the lists below into backlog items.

## Files

- [[00-inventory]]: the 35 ideas `T-01` to `T-35`, original wording quoted.
- [[01-relevant]]: ideas still open (`relevant` and `partly-done`).
- [[02-done-or-obsolete]]: ideas already shipped (with story or commit) or obsolete.
- [[03-needs-owner]]: ideas that wait on an owner decision.

## Counts per classification

| Classification | Count | Ids |
| --- | --- | --- |
| relevant | 12 | T-01, T-11, T-12, T-13, T-15, T-16, T-18, T-19, T-20, T-27, T-30, T-34 |
| partly-done | 3 | T-03, T-04, T-08 |
| done | 14 | T-02, T-05, T-06, T-07, T-09, T-10, T-14, T-22, T-23, T-25, T-26, T-31, T-32, T-33 |
| obsolete | 1 | T-17 |
| needs-owner | 5 | T-21, T-24, T-28, T-29, T-35 |
| Total | 35 | |

T-15 (em dashes) is `relevant` but its scope also sits in [[03-needs-owner]], so that file lists six rows.

## Overlap with the advisor playbook (do not backlog twice)

Phases 01 to 06 of the advisor playbook shipped as S-150 to S-158 (see [[Progression-Advisor-Plan]]).

- Already delivered by it: T-09 (advice on what would improve the plan), T-10 (next moves in research or training), T-22 (sliding leadership and dominance), T-23 (real planning algorithm for sweeps).
- Open items that should be answered with its sweeps, not new features: T-11 (leadership non-linearity), T-12 (army modernization strength), T-13 (fewer monsters, a monster-count probe in `advisor-sweeps.ts`), T-29 (spike check on merc deaths before any control).
- Related, not duplicate: T-01 reads the sweet spot that the advisor card (S-151, S-152) uses as its headline fallback.

## Conflicts with a design rule

Rules from `docs/design-rules.md`.

- T-20 (bonus off the pill, on hover): hover alone is invisible on touch, rule 18; the configure path must carry it.
- T-19 (grade letter, maybe colour coded): colour must be a group or tier colour, rule 20, with contrast per rule 24.
- T-08 (hero level on hover): same touch limit, rule 18.
- T-21 (sets per hero or per item): rule 6 (the form is the summary) caps how complex the model may be.
- T-16 (Equipment revamp): needs a designed artifact first, rules 23 and 31.
- T-15 (em dashes): rule 26 (our own words) is the only related rule; scope is the owner's call.

## Next

The owner reviews the `needs-owner` list and the done/obsolete calls before Phase 08. T-34 (ARC3 regression) was not reproduced offline; it needs the owner's export loaded as a fixture.
