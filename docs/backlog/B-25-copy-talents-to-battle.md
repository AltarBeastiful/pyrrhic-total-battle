---
type: reference
title: "B-25 Copy talents to battle: the Hero Talents bonus follows my talent tree"
created: 2026-11-20
tags: [backlog, spec, talents, bonuses, schema, ready-for-agent]
related: ['[[B-21-hero-talent-planner]]', '[[B-24-talent-analyze]]', '[[design-rules]]']
---

# B-25 Copy talents to battle: the Hero Talents bonus follows my talent tree

Status: `ready-for-agent`. Written from the 2026-11-20 grilling. Nothing is implemented. Rule numbers refer to [[design-rules]].

## Problem Statement

The player records the talent ranks he holds on the Talents page, but the battle and the March never read them. The "Hero Talents" bonus source is a free-form form the player types by hand, so he must work out the totals of his tree himself and keep them current every time he buys a rank. The form also offers many fields that no talent can ever change, which invites wrong entries. And the talent Analyze (B-24) prices a talent from rank 0 over a march that, once the tree is copied, already holds that talent, so the numbers would be understated.

## Solution

A button on the Talents page copies the totals of the ranks the player holds into the "Hero Talents" source, in one press. The button tells him whether the source still matches his tree: quiet when it does, emphasised with a hover explanation when it does not (a rank changed since, or the source was edited by hand). The "Hero Talents" form shows only the lines a talent can change (strength and health per unit kind). When the source matches the tree, Analyze prices only the ranks above the rank he holds, which is the question "what do my unspent points buy".

## User Stories

1. As a player, I want a "Copy to battle bonuses" button on the Talents page, so that my held talents count in the battle without typing totals.
2. As a player, I want the copy to use only the ranks I hold, so that a plan I have not bought yet never inflates my march.
3. As a player, I want the copy to write the strength and health lines per unit kind (army, melee, ranged, mounted, flying, monsters, guardsmen, specialists, engineers), so that the battle reads exactly what the talents give.
4. As a player, I want talents the battle does not read (crit, load capacity, economy, archeology) left out, so that nothing meaningless lands in my bonuses.
5. As a player, I want a one-line note "N held talents have no battle effect here", so that I know why some ranks did not appear.
6. As a player, I want zero lines not written, so that the source stays as short as the tree really makes it.
7. As a player, I want the copy to replace what is in "Hero Talents", so that the source and the tree cannot disagree after a copy.
8. As a player, I want one confirmation before an overwrite only when the source already holds non-zero values, so that I never lose typed numbers by accident and a first copy asks nothing.
9. As a player, I want the button quiet and reading "Copied, matches your tree" when the source equals my tree, so that I know I am up to date.
10. As a player, I want the button emphasised when the source differs from my tree, so that I notice I changed ranks or edited the source since the last copy.
11. As a player, I want a hover on the emphasised button that explains the difference and lists up to the three largest, so that I see what changed without opening the form.
12. As a player, I want the sync state computed from the tree and the source each time, so that no stored flag can go wrong after a hand edit, an import or a sign-in merge.
13. As a player, I want a missing line to count as zero when comparing, so that leaving zeros out never reads as a difference.
14. As a player, I want the copy to be a snapshot, so that my battle bonuses never change under my feet when I plan ranks.
15. As a player, I want the "Hero Talents" form to show only strength and health per unit kind, so that I can type only what a talent can really give.
16. As a player with a saved account, I want values typed in dropped fields of "Hero Talents" removed on load, so that the battle stops counting numbers I can no longer see or edit.
17. As a player, I want other bonus sources untouched by that clean-up, so that Hall of Fame, Academy and the rest keep their values.
18. As a player, I want Analyze to price only ranks above my held rank when the source matches my tree, so that it answers what my unspent points buy.
19. As a player, I want the held rank to be the baseline gain (0 %) of that table, so that every shown gain reads "what the next ranks add to my march as it stands".
20. As a player, I want Analyze to keep pricing from rank 0 when the source does not match my tree, so that a hand-typed source is not misread.
21. As a player, I want a talent already at its maximum rank to say "nothing left to buy" in Analyze, so that an empty table is explained.
22. As a player, I want the Analyze table to say which baseline it used ("from rank 0" or "from your rank N"), so that I never misread a gain.
23. As a player, I want a held result in Analyze marked stale when I copy again, so that I never read a number priced against the old source.
24. As a player, I want the Bonuses row for "Hero Talents" to show the copied values like any source, so that I can see the totals the battle uses.
25. As a player, I want the button reachable by keyboard and labelled for a screen reader, with the hover text also available on focus, so that the explanation is not mouse-only.
26. As a player, I want the button and its hover to work at 390 px width with no sideways scroll, so that I can copy on my phone.
27. As a player, I want the button disabled with a short reason when I hold no ranks, so that a disabled button explains itself.
28. As the owner, I want the copy to be undoable by the player through the normal source form, so that no special reset is needed.

## Implementation Decisions

- **One pure function owns the arithmetic.** Given the talent table and the held ranks, it returns the lines to copy (strength and health per key, zeros omitted), the number of held talents with no battle effect, the sync verdict against a given source, and the largest differences. It reuses the engine's existing rule for which talents are read (the same one Analyze uses), so the copy, the Analyze and the battle agree on what counts.
- **Per-rank totals.** A held rank's contribution is the game's running total for that rank on the node's key, as in the Analyze source builder; several nodes on one key add up.
- **No stored flag, no schema field for sync.** "In sync" is derived: every line of the source equals the tree's total, a missing line being zero. Any hand edit, import or merge is covered by construction.
- **Copy overwrites the whole source.** It sets the "Hero Talents" source to exactly the copied lines. A confirmation appears only when the source holds any non-zero value before the copy.
- **Analyze baseline.** The analysis input gains a baseline rank per talent: the held rank when the source is in sync, else 0. Ranks priced are those above the baseline (the existing rank-picking rule applied to the remaining range); the baseline itself is the 0 % row. The march fed to the pool is built with the talent's own lines removed down to the baseline, so the held rank is never counted twice. B-24's text is amended accordingly (see below).
- **Form restricted.** The "Hero Talents" form lists strength and health on the nine keys the tree can touch, and nothing else. The form is driven by a per-source allow-list, so other sources keep their forms.
- **Schema migration.** One step bumps the schema version, deletes values in "Hero Talents" for fields outside the allow-list, and leaves every other source and every other part of the account unchanged. The migration is recorded in the changelog.
- **Button placement and states.** The button lives on the Talents page near the totals. States: nothing held (disabled with reason), out of sync (emphasised, hover lists differences), in sync (quiet, "Copied, matches your tree"). The confirm uses the app's existing confirm pattern.
- **Copy wording.** "Merc" wording and the one-sentence helper rule apply; hover text names stat, kind and size of the difference (for example "melee strength +3 % in your tree, 0 % in Hero Talents").
- **No engine change.** The battle already reads the source; nothing in planning, sizing or rating moves.

## Testing Decisions

- **What a good test is.** It states inputs and checks what the player sees or what the function returns: lines copied, the sync verdict, the baseline of an Analyze table, the form's fields. It does not check how the confirmation is rendered or how the hover is positioned.
- **Seam 1, the pure totals function** (plus the Analyze baseline in the existing talent analysis test file). Table-driven, written once and run on the TS and the kernel paths, red on both first, then green on both. Cases: no ranks give no lines and a disabled verdict; one rank of a melee-strength node gives that single line; two nodes on one key add; a non-read talent counts only in the "no battle effect" total; zeros are omitted; a source with the same lines in another order is in sync; a missing line equals zero; a one-point difference is out of sync and appears in the differences, largest first, at most three; an in-sync source gives baseline rank N and an out-of-sync one gives 0; a talent at its maximum rank yields an empty priced range; the analysis with baseline N never counts the talent's lines twice (its 0 % row equals the March's own rating).
- **Seam 2, the Talents page** (extends the existing talents page test). A copy writes the source and the button turns quiet; changing a rank turns it emphasised and the hover text names the difference; a first copy asks no confirmation and a copy over non-zero values asks one; cancelling the confirmation changes nothing; Analyze after a copy shows ranks above the held rank and says "from your rank N"; editing the source by hand puts Analyze back on "from rank 0". Sideways overflow at 390 px is left to the end-to-end journey.
- **Seam 3, the schema migration** (the existing migrations test). An account with values in dropped "Hero Talents" fields loses exactly those; other sources and all other data are byte-identical; a clean account is unchanged apart from the version.
- **Form check.** The Bonuses section test asserts the "Hero Talents" form shows only strength and health per kind.
- **Benchmark gate.** No planning code changes, so the benchmark is byte-identical; run it before the push.
- **Prior art.** `talentAnalysis.test.ts` (state and worker) for the Analyze input; `TalentsPage.test.tsx` for the page; `migrations.test.ts` for the schema step; `BonusesSection.test.tsx` and `BonusKeyGrid.test.tsx` for the form.

## Out of Scope

- A live "follow my talent tree" toggle that keeps the source in sync automatically (a later item).
- Copying planned (unbought) ranks.
- Copying stats the battle does not read (crit, load capacity, march speed, economy, archeology).
- Any change to other bonus sources or their forms.
- Changing the planner's ordering or the usefulness scoring (B-21, B-23).
- A reset or "undo copy" control; the normal source form is enough.

## Further Notes

- Amendment to B-24: its decision "Rank 0 is this talent removed, not this talent as currently spent" holds only while the source is not in sync with the tree. When it is, the baseline is the held rank and the table lists the ranks above it, because Analyze is about unspent points. The Analyze table names its baseline.
- The sync check uses exact equality on the lines the tree can produce; it is cheap (a handful of lines) and runs on every render of the button.
- Decided in the grilling of 2026-11-20: a derived sync check instead of a stored flag (the owner's idea), zeros not written, dropped fields deleted by migration.
