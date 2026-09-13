# Pyrrhic — design rules

The owner's UI and UX decisions across the project, gathered from every review (2026-09-12 and 13) and
turned into rules; the owner edits this file directly. This is the charter every plan, worker brief and
review checks against. When a rule and a plan disagree, the rule wins; change the rule here first.

## 1. What the page is for

1. **The answer comes first.** Once a march exists, the figures a player compares marches by (expected and
   worst-case damage, hits, recovery cost, damage per silver) are the first thing on screen, and they stay
   visible while the setup changes. The order stacks die in is detail, folded away. 
2. **Generate is reachable from everywhere.** One sticky app bar carries the answer and the account; below
   desktop width a floating Generate button, above it Generate sits in the bar. No other sticky toolbar. 
3. **Configure once, generate often.** Troops and bonuses change rarely; the monster, the housing and the
   owned mercenaries change every fight. The layout optimises the daily journey: open, adjust one or two
   numbers, generate, copy counts. 
4. **Progressive disclosure is our differentiator.** Show what the returning player needs (the army, the
   totals, the march); fold what is configured once (bonus sources, journals, charts). 
5. **Do not duplicate information; show it where the user expects it.** The page reads in one continuous go
   with as little scrolling as possible. What matters everywhere (the march summary with damage, cost and
   troops; the Generate action) stays visible as much as possible, on mobile too with the right compromise.

## 2. Forms

6. **The form is the summary.** A well-made form is readable at a glance and editable in place; it never
   collapses into a separate summary line. Troops, mercenaries and captains follow this: the summary of
   chosen versus unchosen *is* the full form. 
7. **Copy TotalStack's forms where they are good, improve where they lack, always in our own style.** Troop selection (lowest and highest
   tier, click out the top-tier units you do not own), the captain chips with the corner gear and the level
   popover, the mercenary pills and the tier-grouped picker, the full-card method choice: mimic their
   behaviour, arrangement and relative sizes; improve the workflow; keep our colours, words, structure and improvments on reader flow and accessibility.
   Look at the live reference and write an observation note before specifying any of them.
8. **Whole rows and whole cards are targets.** A choice between options is a list or a grid of cards where
   tapping anywhere on the item selects it; never a select box next to cards. 
9. **Typed numbers are plain inputs** that select their whole value on focus so typing replaces it (housing
   pools, owned counts, stack counts). Arrow keys may still step. 
10. **Steppers only for ordered lists of at most a hundred values** (tiers G1–G9, captain levels and
   stars, small counts); anything larger is a plain input. 
11. **Long lists are searched, not filtered.** Players know mercenaries by name and tier: a combobox grouped
    by tier, each tier in its colour; no role or race filter chips. 
12. **No add button where a grid of every option works.** Captains, artifacts, titles: all options visible,
    tap to enlist; level and stars on a badge that opens the editor; only options that affect the stack get
    a level editor. 
13. **Left-out units can be put back from the result**, keeping the balance and mercenaries dying last, and
    the choice persists across later generates. 

## 3. Layout and density

14. **Troops and mercenaries are readable together** on one phone screen, in about two lines each; empty
    groups do not add lines. 
15. **Nothing on screen without value.** No "Saved in this browser" line, no section jump bar, no permanent
    profile toolbar: profile actions (switch, new, duplicate, rename, delete, export, import, sync, share,
    theme, about) live behind an account menu named after the profile, as on any site with accounts. 
16. **Base the page structure on Material Design 3** (window size classes, canonical layouts, top app bar,
    extended FAB, shape and surface roles) and verify layout decisions against it and against well-designed
    comparable products with an independent review, rather than inventing structure. 
17. **One page scroll.** No panes that scroll independently of the page; a supporting pane may stick. 
18. **Phone first, desktop second monitor.** Everything works one-handed at 390 px; desktop shows the setup and
    the march side by side. 
19. **Right-sized.** Controls sized for a thumb but not padded like billboards; information text never below
    13 px; nothing "too big" (a 44 px chip for a three-letter code) or "too small" (12 px meta lines). 

## 4. Visual language

20. **Colour means group.** Guardsmen green, specialists blue, engineers amber, monsters violet, mercenaries
    red, from the game; tiers have their own readable palette from the game's tier colours; group and tier
    colours carry meaning on chips, badges and text, never decoration. 
21. **Glyphs are emoji, as TotalStack's** (⚔️ 🏹 🐴 🦅 🛡️ 🗡️ ⚙️ 💀 🏰 👹 …), through one component with
    accessible names. Hand-drawn icons were unreadable; icon sets are for interface chrome only. 
22. **Small styling problems are solved with glyphs and text colour**, not with custom components. 
23. **One designed component system, themed, never hand-styled from prose.** The UI is composed of stock
    Mantine components used as documented, with a theme that expresses our palette, density and radii; custom
    CSS is the exception and is counted. A "mismatch of CSS" is the failure mode this rule exists to prevent. 
24. **Accessible and readable in both schemes**: contrast floor verified by a script, keyboard for every
    control, colour never the only signal, reduced motion respected. 
25. **Not a copy of TotalStack's skin.** Their patterns are fair game; their palette, glow, marketing tags,
    logo and copy are not. 

## 5. Wording

26. **Our own words** for stacking methods, options, objectives and the unit details; nothing lifted from
    TotalStack's names, descriptions or tooltips. Sentence case, plain verbs, the same name for an action
    through the whole flow. 
27. **Unit details read as sentences**, not as a grid of labelled numbers. 

## 6. Results

28. **Recap, then the army as tiles, then counts to copy.** The recap figures with deltas against the last
    run; the march as the same tiles as the Troops form, where tapping a tile leaves a type out or keeps it
    in; the counts in a table with the count as the biggest number and tap-to-copy; trade-off against all
    types; story and chart folded. 
29. **Objectives are honest**: when the best average keeps only the top tier, say so and offer the worst-case
    and per-silver objectives beside it. 

## 7. Process

30. **Two plans before a rebuild**: a UX plan (personas, journeys, frame, cards) and a technical plan (how it
    is built without hand-written CSS), both validated by the owner and amended in writing as reviews land. 
31. **Observe, note, mimic, screenshot.** Before a form is specified: look at the reference live, write an
    observation note (investigations 0006, 0008), brief the worker with it, review the built screen against
    it at 1400 and 390 px in both schemes before committing. 
32. **Independent review of structure** (Material guidance, comparables) for any layout decision that shapes
    the whole page. 
33. **Delay what is not design**: engine stories such as best captains wait until the UI is right. 
