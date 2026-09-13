# Pyrrhic — design rules

The owner's UI and UX decisions across the project, gathered from every review (2026-09-12 and 13) and
turned into rules. This is the charter every plan, worker brief and review checks against. When a rule and a
plan disagree, the rule wins; change the rule here first. Each rule cites the request it comes from (§8).

## 1. What the page is for

1. **The answer comes first.** Once a march exists, the figures a player compares marches by (expected and
   worst-case damage, hits, recovery cost, damage per silver) are the first thing on screen, and they stay
   visible while the setup changes. The order stacks die in is detail, folded away. [R9d, R3]
2. **Generate is reachable from everywhere.** One sticky app bar carries the answer and the account; below
   desktop width a floating Generate button, above it Generate sits in the bar. No other sticky toolbar. [R6h, R6k, R24]
3. **Configure once, generate often.** Troops and bonuses change rarely; the monster, the housing and the
   owned mercenaries change every fight. The layout optimises the daily journey: open, adjust one or two
   numbers, generate, copy counts. [R4, R9]
4. **Progressive disclosure is our differentiator.** Show what the returning player needs (the army, the
   totals, the march); fold what is configured once (bonus sources, journals, charts). [R24]

## 2. Forms

5. **The form is the summary.** A well-made form is readable at a glance and editable in place; it never
   collapses into a separate summary line. Troops, mercenaries and captains follow this: the summary of
   chosen versus unchosen *is* the full form. [R9b, R20]
6. **Copy TotalStack's forms where they are good, in our own look.** Troop selection (lowest and highest
   tier, click out the top-tier units you do not own), the captain chips with the corner gear and the level
   popover, the mercenary pills and the tier-grouped picker, the full-card method choice: mimic their
   behaviour, arrangement and relative sizes; improve the workflow; keep our colours, words and structure.
   Look at the live reference and write an observation note before specifying any of them. [R7, R9b, R18, R21, R22]
7. **Whole rows and whole cards are targets.** A choice between options is a list or a grid of cards where
   tapping anywhere on the item selects it; never a select box next to cards. [R6f, R12]
8. **Typed numbers are plain inputs** that select their whole value on focus so typing replaces it (housing
   pools, owned counts, stack counts). Arrow keys may still step. [R14, R16]
9. **Steppers only for short ordered lists** of at most twelve values (tiers G1–G9, captain levels and
   stars); nothing else gets − / + buttons. [R6b, R17]
10. **Long lists are searched, not filtered.** Players know mercenaries by name and tier: a combobox grouped
    by tier, each tier in its colour; no role or race filter chips. [R15]
11. **No add button where a grid of every option works.** Captains, artifacts, titles: all options visible,
    tap to enlist; level and stars on a badge that opens the editor; only options that affect the stack get
    a level editor. [R18, R19, R20]
12. **Left-out units can be put back from the result**, keeping the balance and mercenaries dying last, and
    the choice persists across later generates. [R3]

## 3. Layout and density

13. **Troops and mercenaries are readable together** on one phone screen, in about two lines each; empty
    groups do not add lines. [R4, R6d]
14. **Nothing on screen without value.** No "Saved in this browser" line, no section jump bar, no permanent
    profile toolbar: profile actions (switch, new, duplicate, rename, delete, export, import, sync, share,
    theme, about) live behind an account menu named after the profile, as on any site with accounts. [R6e, R6h]
15. **Base the page structure on Material Design 3** (window size classes, canonical layouts, top app bar,
    extended FAB, shape and surface roles) and verify layout decisions against it and against well-designed
    comparable products with an independent review, rather than inventing structure. [R8, R11, R12]
16. **One page scroll.** No panes that scroll independently of the page; a supporting pane may stick. [R8]
17. **Phone first, desktop second monitor.** Everything works one-handed at 390 px; desktop shows the setup and
    the march side by side. [R6, R6k]
18. **Right-sized.** Controls sized for a thumb but not padded like billboards; information text never below
    13 px; nothing "too big" (a 44 px chip for a three-letter code) or "too small" (12 px meta lines). [R6g]

## 4. Visual language

19. **Colour means group.** Guardsmen green, specialists blue, engineers amber, monsters violet, mercenaries
    red, from the game; tiers have their own readable palette from the game's tier colours; group and tier
    colours carry meaning on chips, badges and text, never decoration. [R6i, R15]
20. **Glyphs are emoji, as TotalStack's** (⚔️ 🏹 🐴 🦅 🛡️ 🗡️ ⚙️ 💀 🏰 👹 …), through one component with
    accessible names. Hand-drawn icons were unreadable; icon sets are for interface chrome only. [R6c, R23]
21. **Small styling problems are solved with glyphs and text colour**, not with custom components. [R23]
22. **One designed component system, themed, never hand-styled from prose.** The UI is composed of stock
    Mantine components used as documented, with a theme that expresses our palette, density and radii; custom
    CSS is the exception and is counted. A "mismatch of CSS" is the failure mode this rule exists to prevent. [R6j, R10, R22]
23. **Accessible and readable in both schemes**: contrast floor verified by a script, keyboard for every
    control, colour never the only signal, reduced motion respected. [R6a]
24. **Not a copy of TotalStack's skin.** Their patterns are fair game; their palette, glow, marketing tags,
    logo and copy are not. [R1, R2, R24]

## 5. Wording

25. **Our own words** for stacking methods, options, objectives and the unit details; nothing lifted from
    TotalStack's names, descriptions or tooltips. Sentence case, plain verbs, the same name for an action
    through the whole flow. [R2, R6j]
26. **Unit details read as sentences**, not as a grid of labelled numbers. [R6j]

## 6. Results

27. **Recap, then the army as tiles, then counts to copy.** The recap figures with deltas against the last
    run; the march as the same tiles as the Troops form, where tapping a tile leaves a type out or keeps it
    in; the counts in a table with the count as the biggest number and tap-to-copy; trade-off against all
    types; story and chart folded. [R9d, R3]
28. **Objectives are honest**: when the best average keeps only the top tier, say so and offer the worst-case
    and per-silver objectives beside it. [R5]

## 7. Process

29. **Two plans before a rebuild**: a UX plan (personas, journeys, frame, cards) and a technical plan (how it
    is built without hand-written CSS), both validated by the owner and amended in writing as reviews land. [R6]
30. **Observe, note, mimic, screenshot.** Before a form is specified: look at the reference live, write an
    observation note (investigations 0006, 0008), brief the worker with it, review the built screen against
    it at 1400 and 390 px in both schemes before committing. [R21, R22]
31. **Independent review of structure** (Material guidance, comparables) for any layout decision that shapes
    the whole page. [R8]
32. **Delay what is not design**: engine stories such as best captains wait until the UI is right. [R11]

## 8. Traceability — the requests these rules come from

| Ref | Request (owner's words, condensed) | Date |
|---|---|---|
| R1 | Icons or illustration; the design looks dry; full review for an accessible, nicely viewable design; some inspiration from TotalStack without copying everything | 09-12 |
| R2 | Less copying of TotalStack: method names and descriptions, the tooltips on march troops and mercenaries are too similar | 09-12 |
| R3 | Put back a unit the algorithm excluded, from the battle summary, keeping the balance and mercenaries dying last; remembered for later generates | 09-12 |
| R4 | Troops and mercenary forms too wide and far apart; tell in about two lines what is configured; less space; easier summary | 09-12 |
| R5 | Why does the algorithm go full top tier; are we generating the most efficient march | 09-12 |
| R6 | Design is bad: (a) hurts the eyes; (b) selects where arrows would help; (c) icons hard to understand versus TotalStack's; (d) mercenaries recap too far from troops; (e) "Saved in this browser" line brings no value; (f) mercenary rows should be clickable, not an add button; (g) some items too big, some text too small; (h) the sticky menu offers little, profile actions belong behind an account menu, Generate could live there; (i) colours from the game (troops greenish, mercenaries reddish, engineers yellowish); (j) the unit popup feels like TotalStack; a real overhaul, practical, dramatically better workflow; two plans (UX with journeys and mobile; technical: framework versus Tailwind); (k) no pinned menu on mobile, a hovering Generate | 09-12 |
| R7 | The troop form is the first thing seen; TotalStack's is very good (min and max level, click out the icons you lack at max); implement the same in our colours and design, inspired by what it does right, improving UX in our style | 09-12 |
| R8 | Two panes with separate scrollbars? Check Material Design layout, verify with a dedicated agent, find a similar well-designed flow | 09-12 |
| R9 | (a) best captain search; (b) the form serves as the summary, especially troops and mercenaries, copy TotalStack's, it is golden; (c) the frame proposal is good, the sticky bar could carry the troop recap; (d) the battle recap shows the wrong things first: we need recap figures and an easy way to see and change the selected troops the same way as the troop form; the dying order is not useful up front | 09-12 |
| R10 | Still miles from a pleasing design: why, what are we using that gives this strange unpolished finish | 09-12 |
| R11 | Actually use Material Design or more recent as the base for the whole page structure; delay best captains | 09-12 |
| R12 | Stacking method: the whole card should be clickable, not a mishmash of cards and a select; this shows we are not following Material | 09-12 |
| R13 | Check the frontend-design plugin; worth another pass | 09-12 |
| R14 | Authority, dominance and such: plain inputs, nobody steps to 11 000; select the whole input on click | 09-13 |
| R15 | Mercenaries ordered by tier from the start; filters take too much space, role and race are useless; players know names; a combobox split by tier with a distinct readable colour per tier from the game | 09-13 |
| R16 | Same for the owned number: no stepper when entering numbers | 09-13 |
| R17 | Steppers are for ordered lists only (G1–G9); no sense beyond twelve values | 09-13 |
| R18 | Redo the hero list like TotalStack: a list of possible heroes, clickable to enlist, a badge to change the level, showing level and star count | 09-13 |
| R19 | TotalStack only allows levels on captains that impact the stack; Carter cannot have a level | 09-13 |
| R20 | The captain grid removes the need for an add button; the summary of chosen versus unchosen is the full editable form | 09-13 |
| R21 | Go to TotalStack, look at the captain selection, note everything, mimic behaviour, arrangement and relative size in our CSS | 09-13 |
| R22 | What was built is a mismatch of CSS badly designed and executed, what the stack choice was meant to avoid; take TotalStack as the example; implement it in our stack or change the stack | 09-13 |
| R23 | Small styling problems with carefully chosen images and text colouring; then: Unicode characters like TotalStack's ⚔️ | 09-13 |
| R24 | Compare the Mantine plan with an external assessment; keep our decisions (Generate accessible from everywhere); take what they do well and improve | 09-13 |
