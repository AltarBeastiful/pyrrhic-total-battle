# Owner walkthrough (D-51)

Half an hour with the game open beside you. Do each numbered thing **twice** — phone, then desktop — in
dark, and look at light once. Use your real account values. Run a production build (`pnpm build && pnpm
preview`), not the dev server.

## The nine things to try

1. **Your daily march.** Open the app, set the monster and the leadership you have free, Generate, copy the
   counts into the game. It should cost three taps on the phone, two on the desktop, and the figures should
   never leave the screen.
2. **The army changed.** A tier unlocked, or you upgraded two types: change the range, click out what you do
   not own, Generate. Four taps.
3. **Bonuses changed.** Find a captain, change its level, watch the TOTAL move, Generate. Four taps.
4. **A different answer.** Notice a unit type left out of the march, put it back — the march re-sizes on
   the spot, with no Generate — take another one out, then Generate and watch it start again from the
   solver's own answer. Compare against the previous run, undo. Try the worst-case and per-silver
   objectives against the average — the Objective is in the command bar at the bottom of the page, not in
   the Battle card. Under **Complete optimization** it is the one exception: the plan weighs damage against
   what it costs itself, so the Objective is greyed out and the line above the fields says why.
5. **Plan a campaign.** In Battle, choose **Complete optimization** and Generate — there is nothing else to
   fill in: how many marches a plan is fought over and what it may spend are numbers the app holds
   (`src/config.ts`), not fields on the card, and the Objective is locked, as in 4. The March says in words
   what it planned — how many identical marches and the stacks each one fields, then where the plan sits on
   the trade — and the **Plan** block arrives **open**, rather than a fold to hunt for (it still collapses, and
   the row it collapses to keeps the plan's headline). It stands **under the army**, not above it: the block
   is a control — reading another plan puts another march on screen — so the army you came to change is first.
   The bar runs along the **hired stock** — *Fewest hired lost … Most hired lost*, one plan a burn level,
   thriftiest first. That is the balance the slider is for: burning silver well at one end against burning
   mercenaries well at the other, with the sweet spot in the middle. There are **four stops at most**, and
   each is named by which answer it is — **Least silver · Sweet spot · More mercs · Most mercs** — and
   nothing else. *Least silver* is the cheapest march still worth fielding; *Sweet spot* is the knee, where
   one more hired unit burned stops buying damage as fast as it did; *More mercs* is the step between the
   knee and the top, for when the stock allows more; *Most mercs* is the top of the ladder — the most hired
   units your troops can shelter, and the most damage. The two efficiencies are **notes rather than stops**:
   the plan that does
   most with a silver says *best a silver* under its name, the one that does most with a hired unit says
   *best a hired*. Judge whether those two lines say enough — they replaced a "Best for silver" stop of its
   own, which on the owner's account was the top stop to within 0.2 %. The tip follows the
   pointer instead of the thumb: it names the plan under it and lights that plan's row in the table below.
   One muted line says what the plan did for *your* army, with the general why behind the ⓘ beside it, and the
   trade is one row per plan — a bar as long as the damage it deals, what a march of it hits for, costs in
   silver and burns of the hired stock, with damage per silver and per hired unit beside them.
   The rest of the March's second half is **not in the pane on a desktop**: the comparison with all types,
   the **Details** fold, your saved marches and the row that copies, edits, saves or shares the
   counts are together at the end of the **left** column, under **"This march in full"**. On a phone there is
   no left column, so the March sheet carries all of it. Watch the right-hand pane while you scroll: it is
   meant to come with you when the march fits the window it has, and to travel with the page when it does not.
   Open **Details**: it opens on a **damage split** — what your troops hit for and what the hired units hit
   for, each with its share, and what one hired unit lost was worth in damage — and the **HP chart comes
   before the battle story**, so the health stack is there at a glance instead of below the round-by-round
   read (owner, 2026-09-18). Judge whether the split is what you would steer the next march by.
6. **Share it.** Send a march to yourself, open the link on the other device, save a copy. **Share** and
   **Save this march** are in "This march in full" on a desktop (the March sheet on a phone), beside the
   counts row.
7. **Start from nothing.** New profile, configure it as a new player would. Does every empty card tell you
   what to do next?
8. **The account menu.** Switch profile, duplicate, rename, export, import, change the theme.
9. **Offline.** Turn the network off, reload, generate. Then install it to the home screen and do it again.

## What to judge it against

`docs/design-rules.md` is the charter; naming the broken rule is the fastest way to be useful. Watch in
particular: the answer and Generate stay together and visible (1, 2, 5); the form is the summary and whole
rows are targets (6, 8); troops and mercenaries readable together (14); typed numbers select on touch (9);
nothing on screen without value (15); nothing too big or under 13 px (19); colour means group or tier only
(20); our own words (26). One deliberate exception to rule 15 is on the page to judge too: under **Complete
optimization** the Objective stays in the command bar greyed out, with one muted line above the fields saying
the plan decides it itself (4, 5) — judge whether that line earns the ~28 px of pane room it costs.
Investigation 0011 measured all 34 on screenshots — this is the same question asked with your thumbs.

## Where to write what you find

In `docs/PLAN.md` §7, dated, at the top. One line per finding: what you did, what you expected, what
happened, and the rule number if you have it. Anything that needs building becomes a D-story in
`docs/plans/design-overhaul.md` §10; anything that is fine as it is gets closed with the reason.

## Two decisions only you can make

- **Publish or not.** Everything since the overhaul is on `development`; nothing is on `main`. Merging to
  `main` deploys to GitHub Pages — that is the publish button.
- **Account sync deployment.** The backend is written and verified but not deployed. It needs four things
  from you: the Dynu hostname (`pyrrhic-backend.dynu.net` unless you prefer another), your go-ahead on the
  two-line philou change, a Google Cloud project with an OAuth client, and a backup target. Steps in order:
  `ops/pocketbase/README.md`.
