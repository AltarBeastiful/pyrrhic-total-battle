# Owner walkthrough (D-51)

Half an hour with the game open beside you. Do each numbered thing **twice** — phone, then desktop — in
dark, and look at light once. Use your real account values. Run a production build (`pnpm build && pnpm
preview`), not the dev server.

## The eight things to try

1. **Your daily march.** Open the app, set the monster and the leadership you have free, Generate, copy the
   counts into the game. It should cost three taps on the phone, two on the desktop, and the figures should
   never leave the screen.
2. **The army changed.** A tier unlocked, or you upgraded two types: change the range, click out what you do
   not own, Generate. Four taps.
3. **Bonuses changed.** Find a captain, change its level, watch the TOTAL move, Generate. Four taps.
4. **A different answer.** Notice a unit type left out of the march, put it back, compare against the
   previous run, undo. Try the worst-case and per-silver objectives against the average.
5. **Share it.** Send a march to yourself, open the link on the other device, save a copy.
6. **Start from nothing.** New profile, configure it as a new player would. Does every empty card tell you
   what to do next?
7. **The account menu.** Switch profile, duplicate, rename, export, import, change the theme.
8. **Offline.** Turn the network off, reload, generate. Then install it to the home screen and do it again.

## What to judge it against

`docs/design-rules.md` is the charter; naming the broken rule is the fastest way to be useful. Watch in
particular: the answer and Generate stay together and visible (1, 2, 5); the form is the summary and whole
rows are targets (6, 8); troops and mercenaries readable together (14); typed numbers select on touch (9);
nothing on screen without value (15); nothing too big or under 13 px (19); colour means group or tier only
(20); our own words (26). Investigation 0011 measured all 34 on screenshots — this is the same question
asked with your thumbs.

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
