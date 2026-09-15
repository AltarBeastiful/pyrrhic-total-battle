# 0011 — The built app against the design rules, rule by rule (2026-09-13)

The charter is `docs/design-rules.md` (34 rules). This is the built app measured against it, not the plan
against it: everything below was read off a **production build** (`pnpm build` + `pnpm preview`) driven with
Playwright at **1400×900** and **390×844**, in **dark** and **light**, on a first-run profile and on a
configured one (troops G1–G4, Bear V capped at 1 200 and Archdemon VI at 860, Beowulf enlisted at level 45,
leadership 84 300, authority 12 000, a march generated).

Screenshots are in `docs/investigations/0011-rules-compliance/`; sixteen JPEGs, named in the table.

**Numbering.** The rows below use `design-rules.md`'s own numbers. The brief that commissioned this review
used numbers one lower (its "rule 8" is the charter's 9, its "rule 25" is the charter's 26); every check it
asked for is in the table under the charter's number.

**Score: 29 met · 5 partly · 0 not met · 0 not applicable.** Three of the "met" rows (19, 21, 26) were made
met during this pass; the fixes are listed under the table, with what was measured before them.

---

## The table

| # | Rule | Status | Evidence | Fix |
|---|---|---|---|---|
| 1 | The answer comes first | met | Once a march exists the March pane opens with the expected damage at 32 px and five labelled figures (worst opening, hits, silver, gold, per silver), and it is sticky, so it stays while the setup changes — `06-march-desktop-dark.jpg`. The battle story and the HP chart are behind "Details". | — |
| 2 | Generate travels with the summary | met | Desktop: Generate sits in the pane under the figures (`06`). Phone: a 64 px bottom app bar carrying "75.5M 🪙 37.3M", three tiny tiles, "+12" and Generate (`08`); the recap sheet opens from it (`09`). Measured at 390×844: exactly two sticky boxes, header 0–64 and bar 780–844; both still on screen after scrolling to the end of the page. The top bar carries brand and account only. | — |
| 3 | Configure once, generate often | met | Troops, Mercenaries and Bonuses sit above Battle, which holds the per-fight fields. `e2e/journeys.spec.ts` measures J1 at 3 taps on phone and desktop. | — |
| 4 | Progressive disclosure | met | Bonuses folds to four figures plus a "Sources" line (`01`, `05`); the story and the chart fold; Troops and Mercenaries never fold, because they *are* the summary. | — |
| 5 | Do not duplicate information | **partly** | The bottom bar and Generate stay visible at every scroll position on a phone (`08`), which is the half the rule cares most about. But the recap sheet repeats the section under it almost exactly: measured at 390×844, **97 of the sheet's 98 lines also appear in the in-page March section** (`09` vs the page behind it) — the same hero figure, the same five figures, the same pool gauges, the same per-stack counts. `journeys.spec.ts` prints "J1 screens the page travels to the counts = 2.15 (budget 2) — OVER" on the same frame. | Proposed (M): either cut the sheet down to what the bar could not fit (the figures and the per-pool totals) and let "See the whole march" scroll to the section, or drop the in-page March on compact windows and keep the sheet as the only place. A frame decision, so it is the owner's. |
| 6 | The form is the summary | met | Troops is four always-on rows with both ends of every range and the top-tier chips (`04`); Mercenaries is a row of pills with the count on the pill; captains are chips carrying their own state. No card collapses into a summary line. | — |
| 7 | Copy TotalStack's forms, in our style | met | Troop from/to plus "at G4:" chips to click out (`04`); captain chips, 32 px, name only, corner gear, a dot after a levelled name, anchored level editor with the live bonus (`10`); mercenary pills and a tier-grouped combobox; the method as full-width cards with a corner radio, three where the reference has four (`16`). Observations 0006 and 0008 were written from the live reference first. | — |
| 8 | Whole rows and whole cards are targets | **partly** | Stacking method: three full cards, corner radio, whole card presses (`16`). Objective: six full rows. Options: full switch rows. Enemy stacks: a three-segment control. **Recovery plan is still a select box** ("Retrain everything") sitting beside those lists — three options, one dropdown (`16`, bottom right of the Battle card). | Proposed (S, ~1 h): render it with the kit's `ChoiceList layout="list"`, the same component the objective already uses. Left undone because it changes the Battle card's layout at three widths and wants an eye on it. |
| 9 | Typed numbers are plain inputs that select on focus | met | Every number in the app is a `NumberInput` with `hideControls`. Measured on the built app: clicking Leadership, Authority or Dominance selects the whole value (0–6 of "12 345") and the next keystroke replaces it ("84 300"); keyboard focus does the same. The enemy counts and the captain's base level behave the same. | Fixed here: the pool glyph inside the field was intercepting presses over the first 34 px of a 200 px field. |
| 10 | Steppers only for ordered lists of ≤ 100 values | met | Measured across the whole setup: **0 step buttons, 0 `spinbutton` roles**. Tiers are 8–10-option selects, the captain's stars a select, its base level a plain field, housing plain fields. | — (a deviation from the *plan*, not the rule: D-21 asked for an arrow stepper on tiers and the build ships a tiny select. It satisfies the rule either way.) |
| 11 | Long lists are searched, not filtered | met | "Hire mercenary…" opens a combobox with a search field and one group per tier, ascending, each headed by its roman numeral in that tier's colour. No role or race chips anywhere. | — |
| 12 | No add button where a grid of every option works | met | All 30 captains plus the hero are on screen as chips with no add button (`10`, `11`); Artifacts, Titles and Permanent use the same chips; Equipment keeps "Add" because its pieces are free-form. | — |
| 13 | Left-out units can be put back from the result | met | March tiles are named "… in the march — leave out" and "… left out — keep in march"; the trade-off strip says "Tap a dimmed tile above to keep one in" (`16`). The exclusion is stored on the battle setup, so it survives the next Generate (`e2e/troops.spec.ts`, `e2e/generate.spec.ts`). | — |
| 14 | Troops and mercenaries readable together on one phone screen | met | Measured at 390×844 with both configured: Troops 76→324 px, Mercenaries 373→550 px — both complete inside the 64/780 chrome, with the Bonuses total still above the fold (`05`). Engineers and Monsters set to "—" stay one line each. | — |
| 15 | Nothing on screen without value | met | No "Saved in this browser" line (it is one word inside the account menu), no jump bar, no profile toolbar. The menu carries rename, the saved state, switch, new, duplicate, delete, export, import, sync, share, theme and about (`14`). The battle-setup row lives *inside* the folded Sources, so it is not permanent chrome. | — |
| 16 | Material 3 base, verified independently | met | Window classes, the supporting pane from 1200 px, 16/24 dp margins, a 64 px small top app bar, a bottom app bar, filled cards and the shape scale are mapped in `docs/plans/design-overhaul.md` §5.0; an independent structure review (M3 canonical layouts, Apple HIG, five measured comparables) is logged in `docs/PLAN.md` §7, 2026-09-12, and spike 0009 chose the frame. | — |
| 17 | One page scroll | met **(fixed 2026-09-15)** | Before a march there is one scroll: no `overflow:auto/scroll` box anywhere holds more than it shows, and the only positioned boxes are the app bar and the March `aside`, both sticky. **After a Generate the pane became a second scroller** — measured 836 px of viewport against 1 787 px of content, and on the owner's own plan 919 px of March against 768 px of room at 1400×900 with every fold already shut — so the wheel over the pane moved the pane and not the page: the two-scroller behaviour the independent review of 2026-09-12 withdrew. **Fixed:** the pane is never given a scroll of its own. It sticks while the March fits the room the window leaves it and travels with the page once it does not (`shell/usePaneFits.ts`, re-measured on every change to the March or the window), and the `max-height` + `overflow-y: auto` that capped it are gone. Re-measured after the fix: **0 scrollable boxes anywhere in `main`**, before and after a Generate, at 1400×900, 1200×800 and 1200×560 — and the end of the March is reached by the page's own scroll (`e2e/generate.spec.ts`). At 390×844 there is still exactly one scroll. | Fixed here: the owner's call of the decision this row left open, 2026-09-15 — "I want to avoid double scrollbars; make this change so we always avoid scroll bars on the battle summary". Of the two options proposed, the pane's tail flows with the page; amending rule 17 to allow a second scroll was withdrawn. **Consequence, measured:** a March of this account's size (861–1 234 px) is taller than the room at any ordinary window height (603 px at 1280×720), so the pane does not stick for it — 0 of the states measured after the fix keep the stick, and it sticks only for a March that fits (an empty one, at 194 px). If the March must stay on screen, the lever is its own length, not a scrollbar: the two biggest blocks are the "Objectives compared" table (280 px) and the pools and pills (265 px). |
| 18 | Phone first, desktop second monitor | met | Everything reaches the thumb at 390 px, Generate included; `e2e/troops.spec.ts` asserts the page never scrolls sideways at 390. Desktop puts the setup and the march side by side (`06`). | — |
| 19 | Right-sized; information text never below 13 px | met **(fixed)** | Before: querying the computed size of every visible text node across 16 states found **six under the floor** — the "15 STACKS" badge at **9 px**, "3 on but empty" at **10 px**, the two switch sentences in the Battle card at **11 px**, the account avatar's initial at **12.8 px**. After the fixes, the same sweep over the same 16 states returns **nothing under 13 px**. Also fixed: inside the 360 px pane the trade-off strip broke figures across two lines ("75 870" / "000"). | Fixed here (see below). Remaining note: the hero figure is 32 px where `docs/design.md` §3 says 48 px — a design decision to confirm, not a floor breach. |
| 20 | Colour means group | met | Group bars open every Troops row and every March row; tiles carry the group ground and ink; tier badges carry the tier ink; `pnpm contrast` checks 176 pairs and all pass (lowest 4.94 light / 4.98 dark at 4.5:1). Colour is never alone — every tile also carries a glyph, a roman tier and a code. | — |
| 21 | Glyphs are emoji, through one component | met **(fixed)** | `Glyph` + `glyphs.ts` are the only place an emoji is written; a sweep of `src/` finds no other emoji (only "★" for captain star levels, which is a rating mark and not in the map). ⚠️ `warning` existed in the map and **was used nowhere** — it is now on the Bonuses "n on but empty" badge (`04`, `05`). | Fixed here. Note: 🎯 `averageDamage` is still used only on the kit page — the March's "Expected damage" carries no glyph while "Worst opening", "Silver" and "Gold" do (`06`). Either give it the target or take 🎯 out of the map (XS). |
| 22 | Small styling problems solved with glyphs and text colour | met | 332 lines of CSS in the whole app, in seven files (fonts, page margins, tabular figures, the numeral face, the chip label, the shell and three section modules). The warning badge above is exactly this rule applied. | — |
| 23 | One designed component system, themed | met | Stock Mantine 9 with our theme; the kit/domain boundary is documented in `src/ui/kit/README.md`; **zero `className="…"` strings** in `src/` and a lint rule that refuses one. Every fix in this pass went into `src/ui/theme.ts`, not into a component. | — |
| 24 | Accessible and readable in both schemes | **partly** | Both schemes were driven end to end (`03`, `07`, `11`, `13`, `14`, `16`); `pnpm contrast` passes 176 pairs; axe is clean on the app (`e2e/a11y.spec.ts`) and on the kit page. Keyboard, measured: the Troops row tabs `Guardsmen from → Guardsmen to → Archer IV → Spearman IV → Rider IV → Specialists from …`, every stop `:focus-visible`; the captain chips tab `gear → chip` per captain, every stop `:focus-visible`. Two problems. **(a)** On a text field or a tier select the focus indicator is Mantine's border-colour change only — `#6e7873` → `#c69c3e`, **1.8:1** between the two states, under WCAG 2.4.11's 3:1; buttons and chips get a proper 2 px brass ring. **(b)** The captain grid is **52 tab stops**, where the plan (§9) asks for a roving tab index so `Tab` crosses a grid in one stop. | Proposed (a) (S, ~1 h): one theme rule giving `.mantine-Input-input:focus-visible` the same ring the buttons have; it repaints every input, so it wants the owner's eye and a baseline refresh. Proposed (b) (M): roving tabindex in `ChipRow`, which also serves Artifacts, Titles and Permanent. |
| 25 | Not a copy of TotalStack's skin | met | Brass and slate, flat surfaces, no glow, no "NEW"/"POPULAR" tags, our own mark and copy. The palette is generated from twelve seeds in `src/ui/palette.ts` and documented in `docs/design.md` §1. | — |
| 26 | Our own words | met **(fixed)** | Grepped **371 distinct visible strings** from the 16 states for "Elite Preservation", "M's Preservation", "Total Optimization", "Custom Kill Order" and for the bare words *preservation*, *optimization*, *kill order*, *Pro*, *POPULAR*: **no match**. The glossary's own names are on screen (Tier ladder / Troops first / Your own order, with the glossary's sentences). One residue was found on the **dev-only kit page** — a disabled `ChoiceList` row titled "Total optimisation" — and renamed. Also fixed: the engine's own sentences wrote "12,345 dominance left unused" with a comma while every figure beside them uses a space. | Fixed here. |
| 27 | Unit details read as sentences | met | The unit sheet (`15`) reads: "5 936 Rider I land 2 hits and deal 3.8% of the damage." / "Falls number 6. All 5 936 are lost: 42 736 gold to revive them, or 3 561 600 silver and 2d 1h to retrain." / "Why this size — The stack has to reach 2 582 160 health: 435 each × 5 936 units." Then one "Unit" block: health and strength, base against with-bonuses, on four bars. That block is the plan's own §7.6 point 4, and it is four numbers, not twelve. | — |
| 28 | Recap, then tiles, then counts to copy | met | In order (`06`, `16`): the figures; the march as the same tiles as the Troops form, tap to leave out or keep in; "Counts to copy" with the count as the biggest number, "Copy counts / Edit counts" and "Copy all counts"; "Compared with all types"; "Details" folded; Save and Share at the end. Rows carry "falls 1st", "1 hit", "42 190 lost", "151 884 gold to revive", and the list is bracketed "Falls first"/"Falls last". | — |
| 29 | Objectives are honest | **partly** | With "Highest average damage" the search kept 3 of 15 types, and the app says so: "The priority kept 3 unit types and left 12 out. Tap a dimmed tile above to keep one in.", with every figure against the all-types march beside it — expected damage +59 %, hits −94 %, retrain silver +104 % (`16`). The half that is missing is the second one: the worst-case and per-silver objectives are **not offered beside the answer**; they are radio rows in the Battle card, above and to the left, and nothing at the result names them. | Proposed (M): two buttons under the strip ("Try best worst case", "Try damage per silver") that set the objective and re-generate. Small in code, but it puts a second control next to Generate, so it is a design call. |
| 30 | Two plans before a rebuild | met | `docs/plans/design-overhaul.md` (personas, journeys, frame, cards) and `docs/plans/ui-foundation-mantine.md` (how it is built without hand-written CSS), both amended in writing as reviews landed. | — |
| 31 | Observe, note, mimic, screenshot | met | Investigations 0006 (captain picker, mercenary pills, troop row) and 0008 (method, enemy stacks, sticky bar, results) were written from the live reference before D-31/D-34 were built; this review is the screenshot half, at 1400 and 390 in both schemes. | — |
| 32 | Independent review of structure | met | `docs/PLAN.md` §7, 2026-09-12: "Independent design review of the overhaul frame (Material 3 canonical layouts, Apple HIG, five measured comparables)" — it withdrew the two independently scrolling columns. Spike 0009 did the same for the summary/Generate frame. | — |
| 33 | Delay what is not design | met | S-48 "best captains for a march" is written up in `docs/PLAN.md` §3.7 and deliberately not built; the engine's other stories sit behind the UI phases. | — |
| 34 | Keep a continuous history | met | `~/pyrrhic-claude-history/` holds `current/project`, `current/tasks` and dated `snapshots/` (latest `2026-09-13_0452`); `pyrrhic-history.timer` is active and hourly (last run 40 min before this check, next in 19 min). | — |

**Follow-up, 2026-09-15 — the stick, re-measured.** Rule 17's row named the lever correctly: the March's own
length, not a scrollbar. That is what the pass of 2026-09-15 moved. The March's explaining half — the
"Objectives compared" strip, the battle story and the HP profile, the saved marches, and the row that copies,
edits, saves or shares the counts — is now one panel at the foot of the **setup** column
(`ui/sections/march/MarchFoot.tsx`, anchored `#march-foot`), drawn only from 1200 px; below that the March
sheet carries the same four blocks, never both. Re-measured with `paneFrame()` (`e2e/helpers.ts`) on a real
march (leadership 84 300): **before**, the pane was **771 px against 768 px** of room at 1400×900 and kept the
stick at no window size; **after**, it is **655 px with one warning alert and 553 px without**, against **740
/ 640 / 560 px** of room at 1400×900 / 1280×800 / 1280×720. So the pane now **sticks at 1400×900** (new test
in `e2e/generate.spec.ts`) and **still flows at 1280×720** and at 1280×800 with a warning; both states keep
0 scrollable boxes and reach the end of the March by the page's own scroll. The pane's height no longer
depends on the folds or on the objective comparison — those px belong to the setup column's foot now, and
opening Details or the saved list there does not move the pane at all (the plan's own fold stays in the pane,
because the plan's assessment is part of the answer). The room at 1400×900 lost 20 of those px to the other
half of this change: `--pyr-commandbar-height` went 5.75rem → 7.5rem, the bar's *tallest* state, because the
Objective's locked reason took the bar from 88 px to 119.7 px — so the reserve is fixed and the pane pays
about **28 px** at every method rather than a different room per Battle-card setting.

---

## Fixed in this pass

Everything below is in the working tree, unit and browser suites green (`pnpm vitest run` 542 passed,
`pnpm exec playwright test` 34 passed, `pnpm test:visual` 4 passed after the baselines were regenerated,
`pnpm lint`, `pnpm typecheck`, `pnpm contrast` clean).

| What | Where | Why |
|---|---|---|
| Badge type on the 13 px floor (`--badge-fz`, height 20 px, 6 px side padding) | `src/ui/theme.ts` | Mantine's badge sizes carry their own pixel ramp; `xs` is 9 px. "15 STACKS" and "3 on but empty" were 9 and 10 px (rule 19). |
| The sentence under a switch row on the floor | `src/ui/theme.ts` (`Switch.styles.description`, and `--input-description-size` for every other description) | Mantine derives it as `sm − 2 px` = 11 px and writes it on the element, so the root variable alone could not reach it. Those sentences explain the Battle card's options (rule 19). |
| The account avatar's initial on the floor | `src/ui/theme.ts` (`Avatar` vars) | 32 px ÷ 2.5 = 12.8 px (rule 19). |
| The pool glyph no longer eats the press | `src/ui/theme.ts` (`leftSectionPointerEvents`) | 🛡️ sat over the first 34 px of the 200 px Leadership field and swallowed clicks (rules 9 and 19). |
| The trade-off strip is a container query, not a viewport one | `src/ui/sections/march/TradeoffStrip.tsx` | Two columns inside the 360 px March pane broke figures across lines ("75 870" / "000"). It is now one column there and two when the strip is wider than 340 px (rule 19). |
| ⚠️ on the "n on but empty" badge | `src/ui/sections/bonuses/BonusesSection.tsx` | `docs/design.md` §1: a warning carries the triangle *and* the wording. The glyph was in the map and used nowhere (rules 21, 22). |
| The trailing middle dot dropped from "Left out: Archer I ·" | `src/ui/sections/troops/TroopsSection.tsx` | `docs/design.md` §8 rule 5 retired middle-dot meta strings; this was the last one in the app. |
| Engine sentences group thousands with a space | `src/engine/stacker.ts`, `tests/engine/stacker.test.ts` | "12,345 dominance left unused" sat next to "84 300 of 84 300". Three engine assertions updated with it (rule 26). |
| "Total optimisation" renamed to "Every combination" | `src/ui/kitpage/stories/ChoiceList.story.tsx` | TotalStack's method name, on the dev-only kit page (rule 26). |
| PWA icons repainted brass on slate; manifest colours from the theme | `src/pwa/generate-icons.mjs`, `public/icons/*` (regenerated by `pnpm icons`), `public/manifest.webmanifest` | The icons still carried the pre-Mantine blue `#3d64c7`, and the manifest the retired cream `#f8f3e9`. Now the tile is `brass` 7 `#6d5621` with the bars in `slate` 0 `#fafbfa` (6.8:1), `theme_color` `#6d5621`, `background_color` `#ecefec` — the theme's light page, which is what `index.html` already writes. |
| Visual baselines regenerated | `e2e/__screenshots__/**` | The type changes move pixels on the kit page; `pnpm test:visual` is green again. |

One thing that looked broken and is not: an early measurement said the housing fields did **not** select their
value on a mouse click. That was the measurement reading the selection before react-number-format had finished
placing the caret. Re-measured after the caret settles, on the build as committed, both the mouse and the
keyboard select the whole value and the next keystroke replaces it. No change was needed and none was kept.

## Proposed, not done

| # | Rule | What | Size |
|---|---|---|---|
| 1 | 5 | Decide whether the phone keeps both the recap sheet and the in-page March section, and cut the duplicate | M — a frame decision |
| 2 | 8 | Recovery plan from a `Select` to a `ChoiceList layout="list"` | S (~1 h) |
| 3 | 24a | A real focus ring on text fields and selects (currently a 1.8:1 border-colour change) | S (~1 h) + a baseline refresh |
| 4 | 24b | Roving tabindex in `ChipRow` so `Tab` crosses the 52-stop captain grid in one | M |
| 5 | 29 | "Try best worst case" / "Try damage per silver" beside the trade-off strip | M |
| 5b | 17 | Stop the March pane scrolling inside itself once a march makes it taller than the viewport — or amend rule 17 | M — a frame decision |
| 6 | 21 | Give the expected damage its 🎯, or drop `averageDamage` from the glyph map | XS |
| 7 | 19 | The hero figure is 32 px where `docs/design.md` §3 says 48 px — confirm or correct the doc | XS |

## How this was measured

- Production build served on port 5196; one browser context per sweep, viewport and colour scheme switched
  in place so the same profile is photographed at both sizes.
- **Type floor:** a `TreeWalker` over every text node, skipping anything with a zero box, `display:none`,
  `visibility:hidden`, `opacity:0` or a 1 px clip, reading `getComputedStyle(parent).fontSize` — run in 16
  states (first run, configured, generated, recap sheet, bonuses open, battle, account menu, unit sheet,
  trade-off, both schemes, both sizes).
- **Wording:** the same walker collecting visible strings, de-duplicated to 371, grepped for the reference
  tool's names.
- **Keyboard:** `Tab` pressed step by step from a named control, recording each stop's accessible name,
  `:focus-visible` and its outline or box-shadow.
- **Frame:** every `position: fixed|sticky` box and every `overflow: auto|scroll` box whose content exceeds
  it, plus the bounding boxes of `#troops`, `#mercenaries`, the summary and Generate — run both before and
  after a Generate, which is what caught rule 17 (the pane has one scroll of its own only once it is full).
  Re-run on 2026-09-15 after the fix: no `overflow` box anywhere holds more than it shows, before or after a
  Generate, at 1400×900, 1200×800 and 1200×560.
- **The pane's stick, 2026-09-15:** `paneFrame()` (`e2e/helpers.ts`) reads the pane's height, the room
  `shell/usePaneFits.ts` compares it against, its `position`, its `top` against the setup column's, and every
  scrollable box it holds — polled, because the stick is a `ResizeObserver`'s word and arrives a frame after
  the March resizes. Run at 1400×900, 1280×800 and 1280×720 (the numbers in the follow-up above).

## The screenshots

| File | What |
|---|---|
| `01-first-run-desktop-dark.jpg` | Empty profile, 1400×900 dark |
| `02-first-run-phone-dark.jpg` | Empty profile, 390×844 dark |
| `03-first-run-phone-light.jpg` | Empty profile, 390×844 light |
| `04-configured-desktop-dark.jpg` | Troops G1–G4, two capped mercenaries, Beowulf at 45, leadership 84 300 |
| `05-configured-phone-dark.jpg` | The same profile at 390×844 — rule 14's measurement |
| `06-march-desktop-dark.jpg` | After Generate: the March pane, tiles, pool gauges, counts |
| `07-march-desktop-light.jpg` | The same in the light scheme |
| `08-march-phone-dark.jpg` | The bottom app bar with the quick summary and Generate |
| `09-recap-sheet-phone-dark.jpg` | The recap sheet — rule 5's duplication |
| `10-bonuses-captains-desktop-dark.jpg` | Bonuses open: the 31 captain chips and the anchored level editor |
| `11-bonuses-captains-phone-light.jpg` | The same chips at 390×844 light |
| `12-battle-desktop-dark.jpg` | The Battle card: housing, enemy, method, options, objective |
| `13-battle-phone-light.jpg` | The Battle card at 390×844 light |
| `14-account-menu-desktop-light.jpg` | The account menu — rule 15 |
| `15-unit-sheet-desktop-dark.jpg` | The unit sheet — rule 27 |
| `16-march-tradeoff-desktop-light.jpg` | "Highest average damage": the trade-off strip — rules 8, 29 |
