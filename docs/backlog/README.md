---
type: reference
title: Backlog index
created: 2026-10-09
tags: [backlog]
related: ['[[00-inventory]]', '[[01-relevant]]', '[[03-needs-owner]]', '[[progression-advisor]]', '[[advisor-step-d]]', '[[design-rules]]']
---

# Backlog

Thirteen items: twelve refined from the ideas in `todos.md` that triage (see `triage/README.md`) marked `relevant` or `partly-done`, and B-13, which came from the Critical 04 troop order. Nothing here is implemented. The owner picks which become stories and in what order. Rule numbers refer to [[design-rules]]. Every engine item carries two standing criteria: the benchmark rating does not regress, and tests pass on the kernel path.

## Status since the first review (2026-10-10 review)

| Item | Status | Evidence |
| --- | --- | --- |
| Sign-in imports the local profile each time (todos.md) | done | Critical 01: sign-in adopts the account, local profiles copy only on sign-up (55e32db) |
| Put-back follows Tight, idempotent with take-out (todos.md) | done | Critical 03 (71833bd), experiment 201 |
| Order troops as in the battle selection, Battle / Health switch | done | Critical 04 (b650875); 12 units still unplaced, see B-13 |
| B-10 put-back halves the trade | mostly done | Critical 03 reproduced it on the export and fixed the re-size; owner to retest, then close or narrow to "explain why a trade is missing" |
| B-11 ARC3 lowers ratings | dropped by the owner 2026-10-10 | experiment 202 found no regression on the 10-07 export; the owner can no longer find the case |
| B-07 VIP table | done | `vip.json` levels 0 to 25 filled from the owner's numbers (data CHANGELOG, `data.test.ts`) |
| B-02 hero level and stars | closed | owner is happy with the badge |
| Performance round, step 1: a profiling run | built | "Profile everything" button (dev, or `?profiling=1`, `localStorage pyrrhic.profiling=1`, `VITE_PROFILING=1`): Generate then every advisor pass under one `console.profile`, phase times in `window.pyrrhicProfile`. Next: read the profile, then optimise (owner picks the targets) |

## Items in proposed priority order

Rule of the order: a wrong number beats a missing nicety; then cheap items with no blocker; then items waiting on one owner answer; then designs; then long-term.

| Order | Id | Title | Size | Why here | Blocker |
| --- | --- | --- | --- | --- | --- |
| 1 | [[B-13-unplaced-battle-units]] | 12 units missing from the battle order | S | one screenshot closes it | owner screenshot |
| 2 | [[B-06-em-dash-pass]] | Em dashes out of the UI (UI strings only, decided) | S | cheap, rule 26 | none |
| 3 | [[B-01-sweet-spot-hue]] | Hue around the sweet spot, check best rated | S | cheap, plus a check of the headline stop | none |
| 4 | [[B-10-put-back-halves-trade]] | Close or narrow after Critical 03 | S | probably closes by itself | owner retest |
| 5 | [[B-09-leadership-dominance-sweep]] | Leadership non-linearity on the aydea cases | S | the advisor sweeps (S-158) already measure it | aydea fixtures |
| 6 | [[B-08-modernization-probe]] | Modernization strength without dominance | S | same machinery as B-09 | B-09 fixtures |
| 7 | [[B-03-silver-neutral-raise]] | More shielded mercs at equal silver | M | measure first (exp 197); may be unneeded | owner answer: planning or manual control |
| 8 | [[B-04-merc-fill-button]] | Per-stack merc fill button | M | the manual alternative to B-03 | B-03 decision, design artifact |
| 9 | [[B-05-fewer-monsters-option]] | Fewer monsters option | M | needs a rating decision (T-24) | owner |
| 10 | [[B-12-equipment-revamp]] | Equipment revamp | L | biggest, needs T-21 | owner T-21, design artifact |

T-18, T-19 and T-20 are sub-asks of the equipment revamp and live inside B-12.

## Covered by the advisor playbook

Delivered by S-150 to S-158 ([[progression-advisor]], [[advisor-step-d]]), so no new item:

| Todo | Covered by |
| --- | --- |
| T-09 advice on what would improve the plan | Phase 03 and 04: the advisor card (S-151, S-152) |
| T-10 next moves in research or training | Phase 04b and 05: upgrade costs and captain advice (S-153 to S-157) |
| T-22 sliding leadership and dominance | Phase 06 step D sweeps (S-158) |
| T-23 real planning algorithm for sweeps | Worker pool and portfolio (S-150, S-158) |

Open items that the advisor machinery should answer first: B-05, B-08, B-09 (and the spike check in T-29, see below).

## Not yet items (kept from todos.md, owner input needed)

| Todo | What it is |
| --- | --- |
| T-24 monsters cost less than mercs in the rating | A way to stop high-dominance plans from mixing "save silver, tiny merc stacks" with "fill dominance, uneven stacks". Weighting monsters at 0.5 merc in the rating would favour plans that spend fewer monsters. Owner unsure it improves marches; to decide by an experiment, not a question (see below) |
| T-28 hall of fame form | Match the game's bonuses; needs the game's list |
| T-29 merc-death control | Fine-tune how many mercs die; best options only, never below merc saver; spike check first |
| T-35 slider with stock | Slider spends too many mercs when stock allows; Tight on lowest position looked best |

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
