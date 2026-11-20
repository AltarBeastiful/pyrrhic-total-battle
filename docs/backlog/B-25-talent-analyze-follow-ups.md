---
type: reference
title: "B-25 Talent analyze follow-ups: double-damage talents, one request, a bent shape named"
created: 2026-11-20
tags: [backlog, spec, talents, engine, ready-for-agent]
related: ['[[B-24-talent-analyze]]', '[[B-23-talent-usefulness]]', '[[design-rules]]']
---

# B-25 Talent analyze follow-ups: double-damage talents, one request, a bent shape named

Status: `ready-for-agent`. Written from the 2026-11-20 review of B-24 (items 3 and 4 of its follow-up list). Nothing is implemented. Rule numbers refer to [[design-rules]].

## Problem Statement

B-24 lets the player ask what a talent rank is worth to the army, but it answers for strength and health talents only. The four "Chance for X to deal double damage" talents show "nothing to analyze", although the battle reads a per-group double-damage chance, so the player cannot compare them with the strength talents they are choosing between. Two other things are rough. The analysis builds the march's request and its bonus sources twice on the main thread (once to price, once to decide if a held result is stale), which is wasted work on every render of an open talent. And the average of the two pool shapes blends a full army with an 80 % one, in which mercenaries start to drop out; the player cannot see from the result which line is the bent one.

## Solution

The double-damage talents become analyzable: each rank adds its chance to the matching troop group's double-damage line, and the same table and chart appear. The request and bonus sources are built once per analysis question and shared between pricing and the stale check. When a shape's army has lost mercenaries compared with the full one, the result says so: the shape's column and chart label carry a short mark, and a line under the table explains it.

## User Stories

1. As a player, I want Analyze on "Chance for guardsmen to deal double damage", so that I can compare it with Guardsmen's strength.
2. As a player, I want the same for specialists, monsters and engineer corps, so that every double-damage talent is covered.
3. As a player, I want a double-damage rank to add its chance only to its own troop group, so that the gain reflects the troops it touches.
4. As a player, I want a group I do not field to show a flat zero with a one-line reason, so that "no use to your army" reads as an answer.
5. As a player, I want the double-damage table and chart in the same layout as the strength ones, so that I read them the same way.
6. As a player, I want the helper text to say the gain is on top of my bonuses as entered, so that the double-damage numbers are not misread either.
7. As a player, I want fortification talents to keep saying nothing is read, so that a defence node is not priced as an attack.
8. As a player, I want the economy and archeology talents to keep their one-line note, so that nothing changed there.
9. As a player, I want opening a talent to stay instant, so that the panel does not recompute my whole request on every render.
10. As a player, I want pressing Analyze to cost no more than before, so that the speed I measured on my account holds.
11. As a player, I want a held result to go stale on exactly the same changes as before, so that the stale notice stays trustworthy.
12. As a player, I want a shape whose army fields fewer hired soldiers than the full one to be marked, so that I know its line is bent for that reason.
13. As a player, I want the mark in the table header and on the chart label, so that I find it in either.
14. As a player, I want a one-line explanation under the table naming the shape and what was lost, so that I do not have to guess.
15. As a player, I want no mark when the shapes field the same hired soldiers, so that a clean result stays quiet.
16. As a player, I want the mark to use words and a symbol, never colour alone (rule 24), so that it reads in any theme and to a screen reader.
17. As a player, I want the average to stay the plain mean of the shapes, so that the headline number is the one I was promised.
18. As a player, I want the mark to survive reopening the talent, so that a kept result reads the same as a fresh one.
19. As a player, I want an old kept result (before this change) to still draw, so that nothing breaks across a reload.
20. As a player, I want the chart and table to agree to the digit after this change, so that I can trust either.
21. As a player, I want the new talents to cancel and go stale like the others, so that nothing behaves differently by talent kind.
22. As a player, I want the panel to stay inside 390 px, so that the extra line does not overflow on a phone.

## Implementation Decisions

- **Double-damage talents.** The talent-to-bonus mapping gains a second kind of line: the double-damage nodes of the four troop groups add their running total at the rank to the matching group's double-damage chance in the special bonuses (the engine already reads a global chance, a per-group chance and the unit's own). The group is read from the node's name, as the existing group stems do. Fortification and building nodes stay unread.
- **Analyzable test.** The "can this talent be priced" check covers both kinds of line, so the button and the "nothing to analyze" note follow it with no UI change.
- **One request per question.** The main-thread builder returns the march's request, its bonus sources and its key together from one derivation; the analysis input and the stale key are both read from that. The panel's memo holds the derivation once per profile, setup and talent. The key keeps its present content (talent, shapes, rating rates, request) so staleness is unchanged.
- **Naming the bent shape.** The analysis already prices each shape on its own sized army. The job also returns, per shape, the count of hired soldiers its rank-0 army fields; a shape whose count is lower than the full shape's is flagged. The flag is data on the result, not a UI inference, and the average is untouched.
- **UI.** The flagged shape's table header and chart label carry a short mark, with a line under the table in plain words ("At 80 % the army fields N fewer mercenaries, so this line bends"). The mark is text plus a symbol, never colour alone.
- **Compatibility.** A kept result without the new field draws as before, with no mark.
- **No schema change.** Nothing is added to the saved account.

## Testing Decisions

- **What a good test is.** It states inputs and checks what a player sees or the function returns: priced gains, flags, table and chart text. It does not look at how many times a derivation ran.
- **Seam 1, the analyze engine function.** Extend the existing table-driven file for the analysis, run on the kernel. Add: a double-damage talent at its maximum rank rates above rank 0 for an army fielding that group and exactly 0 for one that does not; a guardsmen chance leaves specialist stacks untouched; a fortification node is not analyzable; a shape with fewer hired soldiers is flagged and an equal one is not; the mean is unchanged by the flag. Properties: one lane and three give the same flags.
- **Seam 2, the talents page.** Extend the existing analysis page test: Analyze is offered on a double-damage tile and shows the table and the chart; the mark and its line appear for a flagged shape and not otherwise; a result kept without the field draws with no mark.
- **Derivation count is not tested directly.** The saving is checked once by a measurement on the live account, recorded in the commit message, not by asserting call counts.
- **Prior art.** The B-24 test files for the engine, state and page; the captain screen tests for kernel pricing.

## Out of Scope

- Wiring held talent ranks into the March bonuses, or any change to what rank 0 means.
- Fortification, building, economy and archeology talents.
- Weighting the shapes in the average, or more than two shapes.
- Speeding up the first render of the talents page.
- Any change to the benchmark or the planner.

## Further Notes

- The slow first render that forced a 30 s timeout on the B-24 page tests is a separate matter and not part of this spec.
- Suggested seams to confirm with the owner: (1) the analyze engine function, (2) the talents page.
