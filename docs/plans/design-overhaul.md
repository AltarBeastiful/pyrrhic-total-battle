# Pyrrhic — design overhaul plan (UX first)

Status: **validated by the owner on 2026-09-12** with the starred options; §7.1 amended the same day (TotalStack-inspired troop flow). Implementation in progress. Nothing in this document is built. Read it, amend it, tick the
decisions in §11, and only then does implementation start. The technical side (component framework, how we stop
writing CSS by hand) is a separate plan: `docs/plans/ui-foundation.md`. The two plans ship together; the
technical foundation is the first phase of this one.

Companion: `docs/design.md` describes the design system as it exists today. When this plan is accepted,
`docs/design.md` is rewritten to describe the new one; until then it documents what is on screen.

---

## 1. Why we start over

The owner's review of the second pass, verbatim in spirit, with what we measured behind each point.

| # | Review point | What we measured | Severity |
|---|---|---|---|
| R1 | "Hurts the eyes" | Dark theme: bronze text on navy for every secondary action (8 underlined amber links in the profile bar), two competing surfaces per card, 14 different text sizes in use, body text 14 px. Light theme: bone background with low-contrast muted text at 13 px. | High |
| R2 | Lots of selects where arrows would help (tier pickers) | 19 native `<select>` for tiers and levels; numeric inputs are `type="text"` with no arrow-key stepping at all. Changing G1–G3 to G1–G4 is open menu, scroll, pick, for each end. | High |
| R3 | Icons are hard to understand compared to TotalStack's | Our 50 glyphs are abstract line drawings at 1 em; TotalStack shows the game's unit portraits. A category glyph plus a numeral in a 1 em ring does not read as "archer, tier 3" at a glance. | High |
| R4 | Mercenaries recap still too far from Troops | Troops card is four rows (engineers and monsters add two full rows even when empty) plus a chip grid; the Mercenaries header is off-screen on every phone and on a 900 px desktop. | High |
| R5 | "Saved in this browser" takes a line and brings nothing | It is a permanent second row of the sticky strip: 28 px on every screen, always the same text. | Medium |
| R6 | Mercenary list needs an Add button per row; the whole row should be tappable | Row = name + tier + role + count field + Add button; only the button acts. | Medium |
| R7 | Some items too big (the "G3 Melee" chip), some text too small | Unit chips are 44 px tall with tick + badge + label; secondary text is 12–13 px. Density is inverted: controls are big, information is small. | Medium |
| R8 | Global frame: sticky menu offers little; profile actions belong behind an account menu; Generate should be reachable from it | The sticky strip is two rows (profile bar + section jump bar), 95 px on desktop, more than a third of a 390×452 phone landscape viewport. Generate lives at the bottom of "Housing and march". | High |
| R9 | The unit popover still feels like TotalStack | Same shape: a grid of labelled numbers per unit, opened from the stack chip. Only the headings changed. | Medium |
| R10 | Pinned menu useless on mobile; a floating Generate button would do | Agreed; see §5. | High |

Two root causes explain most rows: (a) the layout was inherited from TotalStack's one long form, and every
section got its own card, header, help note and summary, so the page is tall and nothing important is ever on
screen together; (b) the palette puts the accent on text and links instead of on the few things that need it, so
the eye has nowhere to rest. Fixing chips or selects one by one keeps both causes; that is why this is an
overhaul and not a third round of fixes.

## 2. Who uses Pyrrhic

One primary persona, two secondary ones. No research beyond the owner exists; treat the persona as a hypothesis
to confirm with two or three other players before Phase D (§10).

**P1 — The daily raider (primary).** Plays Total Battle on a PC client or the mobile app. Fights epic
monsters several times a day. Their bonuses change every few weeks (a new captain level, a piece of gear),
their troops change every few months (a tier unlocked), but the *march* changes every fight: which monster,
how much leadership is free, which mercenaries they still own after the last losses. They open Pyrrhic with
the game open next to it, often on a phone held in one hand, copy six or seven stack counts into the game and
close it. They will not read a help note; they will notice a wrong number. What they need: open, adjust one or
two numbers, generate, read the counts, done, in under 30 seconds.

**P2 — The clan helper.** Receives a share link from a clanmate ("here is my setup, what should I send?") or
sends one. Reads someone else's configuration on a phone, changes the monster or the housing, sends back a
result. Needs to understand a march they did not build, and to tell a shared result from their own profile.

**P3 — The newcomer from TotalStack.** Knows the concepts (stacking, preservation, kill order) under
TotalStack's names, arrives with an idea of what the answer should look like, and judges Pyrrhic on whether
it produces the same or better numbers with less effort. Needs the first configuration to be quick and
forgiving: enter troops and bonuses once, roughly, and refine later.

Devices, in order of importance: phone portrait (390×844), desktop (1280–1920 wide, often a second monitor with
the game), phone landscape and tablets last. Dark theme is the default expectation of a gaming audience; light
must exist and be correct, but dark is the one that has to be beautiful.

## 3. User journeys

Each journey lists the steps, the pain today, and the target. "Taps" counts touches or clicks; "screens"
counts how many viewport heights the user scrolls through on a 390×844 phone.

### J1 — Daily march (P1, ten times a week)

Steps: open the app → check troops and mercenaries are still right → set the monster → set free leadership →
Generate → read stack counts → copy them into the game.

Today: 11 screens from top to Results on a phone; troops and mercenaries cannot be seen together; Generate is at
the bottom of the sixth card; results push below it; the stack list is a wrap of chips where the count is
the smallest text on the chip.

Target: **≤ 3 taps and ≤ 2 screens.** On opening, the last result is on screen with the army summary (two lines)
above it. Monster and housing are one row. Generate is a floating button that is always visible. The
result list is a table: unit tile, name, **count** in the largest type on the page, hits taken, lost. Counts
can be copied one by one (tap the count) or all at once.

### J2 — Something changed in the army (P1, monthly)

Steps: a tier was unlocked or some types upgraded → change the range or untick two types → Generate.

Today: two native selects per row for the range, a chip grid to untick; the top-tier exclusions are separate
chips above the grid; the summary line says "8 types" without saying which.

Target: **a tier picker you can drive with arrows** (◀ G3 ▶ or tapping the tier on a strip) and a unit grid where
each tile is a unit you can turn off. The Army card summarises itself in two lines and stays two lines
no matter how many unit types exist (see §6.2).

### J3 — Bonuses changed (P1, every few weeks)

Steps: open Bonuses → find the captain → change the level → check the TOTAL moved → Generate.

Today: six blocks of chips, each with a gear; the TOTAL cards are at the bottom of the longest card on the page.

Target: Bonuses is **one collapsed row by default**: "Health +312 % · Strength +198 % · Special +40 % · 14
sources on". Expanding shows sources grouped by where you find them in the game, each with its value and a gear.
The TOTAL stays pinned at the top of the expanded card. Editing happens in a sheet, never inline in a chip.

### J4 — Trying a different objective or a pinned unit (P1, sometimes)

Steps: see the result → notice a type was left out → pin it → compare → keep or undo.

Today: pin buttons exist in a trade-off table, but the comparison needs reading two tables.

Target: pinned types show as a small marker on their tile in the Army card and in the result table. The
result header shows the previous run's damage as a delta ("avg 1.67 M, −4 % vs last run") so a pin or an
objective change is judged in one glance. Undo returns to the last run.

### J5 — Sharing and reading a shared march (P2)

Steps: tap Share → send the link. Or: open a link → see whose it is → adjust → generate → send back.

Today: Share is one of eight buttons in the profile bar; a shared link opens a dialog with a long explanation.

Target: Share is in the account menu and at the bottom of the result. A shared link opens on the result with
a banner "Shared march — not saved in your profiles. Save a copy · Dismiss". The banner is the only thing on
the page that says where the data comes from.

### J6 — First configuration (P3, once)

Steps: choose a name → enter troops → pick mercenaries → enter bonuses → enemy → housing → Generate.

Today: the page is the form. Empty sections show empty summaries.

Target: the same page, but an empty army shows a **guided empty state** in each card ("Add your troops: pick the
lowest and highest tier you own") instead of an empty summary, and the floating Generate button says what is
missing ("Add troops to generate") until a march is possible. No wizard: P3 knows the domain and wants to see
everything.

### J7 — Managing profiles (P1, rarely; P2 when saving a copy)

Steps: switch account → duplicate for a second castle → rename → export a backup → import on another device →
sync.

Target: all of it lives in the **account menu** (§5.2). None of it takes permanent space.

## 4. Principles that follow

1. **The result is the page.** Configuration is what you do to get a result; the result is what you came for.
   Results are never below the fold once they exist; on desktop they sit beside the setup.
2. **Two lines tell the army.** Troops and mercenaries are always readable together in ≤ 4 lines total, on a
   phone, before opening anything.
3. **Every number has arrows.** Tiers, levels, counts and housing move by keyboard arrows and by visible
   step buttons. Selects only for lists of unlike things (a captain, a monster, a profile).
4. **Colour means group, not decoration.** Green guardsmen, blue specialists, amber engineers, violet monsters,
   red mercenaries (§6.1). The accent colour is for the one primary action and for focus. Text is never accent
   coloured except the primary action.
5. **Nothing sticks except Generate.** No sticky bars. One floating action button.
6. **Density where the data is, air where the eye rests.** Information (unit codes, counts, totals) at 15–16
   px minimum; controls sized for a thumb but not padded like billboards; secondary text never below 13 px.
7. **Our own picture.** Unit tiles, the march table, the unit sheet and the HP profile are our layouts, not a
   restyle of TotalStack's chips and tooltip grid.

## 5. Information architecture and the frame

### 5.1 Page structure

Three regions instead of seven cards:

```
┌───────────────────────────────────────────────────────────────┐
│ Pyrrhic ◆                          [Aydael ▾]  (account menu) │  top bar, scrolls away
├───────────────────────────────────────────────────────────────┤
│ ARMY                                                          │
│  Troops       G1–G4 · S1–S2 · E–   · M3–M5      25 types ⓘ    │  two-line summaries,
│  Mercenaries  ABM6 ×22 · ABT6 ×24 · BER5 ×∞ · BGM6 ×12   +3   │  tap a line to expand
│ BONUSES  Health +312 % · Strength +198 % · Special +40 %  ⌄   │
│ BATTLE   Enemy [Standard ▾]  Leadership [ 84 300 ]  Objective │  the per-march inputs
│          Method: Tier ladder ▾   Allow damage trades ☐        │
├───────────────────────────────────────────────────────────────┤
│ MARCH  ─ last generated 2 min ago                             │  the result
│  avg 1.67 M  ·  min 1.29 M  ·  2 hits  ·  2.87 M silver       │
│  ┌────┬──────────────┬───────┬──────┬─────────┐               │
│  │ ▣  │ Archer 3     │ 2 310 │ 1 hit│ 412 lost│  …            │
│  │ ▣  │ Spearman 3   │ 2 296 │  —   │   —     │               │
│  …                                                            │
│  Left out: Guardsmen 1, Guardsmen 2 …   [Keep in march]        │
│  Battle story ▸   HP profile ▸   Save this march   Share       │
└───────────────────────────────────────────────────────────────┘
                                               (⚔ Generate)  ← floating
```

- **Phone (< 768 px):** one column in that order. The floating Generate button sits bottom-right above the
  safe area. Generating scrolls to MARCH. A small "Setup ▲" link at the top of MARCH scrolls back.
- **Desktop (≥ 1024 px):** two columns. Setup (Army, Bonuses, Battle) left, 5/12 wide; MARCH right, 7/12,
  each column scrolling on its own so the result never leaves the screen. The floating button stays; on
  desktop it docks at the top of the MARCH column as a normal primary button.
- **Tablet / phone landscape (768–1023 px):** one column, MARCH first when a result exists and the setup is
  unchanged since; setup first otherwise. To validate (§11 D5).

The section jump bar is removed. The hero illustration is removed from the frame and kept only on the empty
state and the About dialog (§11 D8).

### 5.2 Account menu

The top bar holds the brand on the left and one control on the right: an avatar (initial letter on a coloured
disc) with the profile name and a chevron. Opening it shows, in this order:

1. Profile name, editable inline (rename), and the saved state as a one-word status under it ("Saved" / "Saving…"
   / "Sync conflict"). This replaces the "Saved in this browser" line.
2. Switch profile: the list of profiles with a tick on the active one.
3. New profile · Duplicate this one · Delete this one (confirmation inside the menu, not a dialog).
4. Export JSON · Import JSON · Sync… (opens the existing sync dialog).
5. Share this march (copies the link, shows "Copied").
6. Theme: System / Light / Dark as a segmented row.
7. About Pyrrhic.

Generate is **not** in the menu (the review suggested it as an option): the floating button is one tap away
everywhere, and a menu item costs two. If the floating button turns out to be in the way on some phones, the
fallback is a Generate item at the top of this menu (§11 D6).

When online accounts arrive later, the same menu grows a "Sign in" row at the top; nothing else moves.

### 5.3 The floating Generate button

- Bottom-right, 56 px, accent fill, sword glyph + "Generate" label on ≥ 400 px wide, glyph only below.
- States: **ready** (accent), **stale** (accent with a small dot: setup changed since the last result),
  **running** (progress ring, tap to cancel), **blocked** (neutral, label says why: "Add troops first").
- Keyboard: `Ctrl/⌘ + Enter` anywhere generates. Screen readers get "Generate march" plus the state.
- It never covers a control: the page keeps 80 px of bottom padding, and the button hides while a sheet is open.

## 6. Visual language

### 6.1 Colour

Two layers: a **neutral base** that carries almost everything, and **group colours** that identify units. The
current bronze accent survives only as the action colour.

Group colours (hypothesis from the game's unit frames; to confirm against in-game screenshots before Phase B):

| Group | Hue | Light theme (bg / ink) | Dark theme (bg / ink) |
|---|---|---|---|
| Guardsmen | green | `#dff3df` / `#1f6b2e` | `#173321` / `#7fd48f` |
| Specialists | blue | `#dde9f7` / `#1f4f8a` | `#172436` / `#7fb2f0` |
| Engineers | amber | `#f8ecd0` / `#7a5410` | `#352a14` / `#e6b85c` |
| Monsters | violet | `#ebe0f5` / `#5b2f8a` | `#2a1e38` / `#c39af0` |
| Mercenaries | red | `#f8dede` / `#8a2424` | `#38191b` / `#f08a8a` |

Rules: group colour appears on unit tiles, on the group's summary line marker, and on the result table's left
edge per row. Never on text longer than a code. Every group also has a glyph, so colour is never the only
signal. All pairs above are ≥ 4.5:1; verified again after tuning.

Neutral base (dark first, since it is the default expectation): near-black blue-grey background `#101319`,
one card surface `#181c24`, one raised surface `#20252f`, text `#e9e6df`, muted text `#a7a49c` (≥ 6:1 on
surface), hairline `#2b303a`. Light: `#f6f4ef` / `#ffffff` / `#eeebe4` / `#1c1a17` / `#5f5b55` / `#ddd8ce`.
Accent (actions and focus): `#d9963c` on dark, `#8e5017` on light — unchanged, but used ten times less.

Semantic: success green, warning amber, danger red, info blue, each with soft and strong pairs. The warning
and engineers hues must be distinguishable: warnings use a red-shifted amber and always carry the triangle glyph.

### 6.2 The unit tile

The tile replaces the "G3 Melee" chip, the `UnitBadge`, and the stack chip. One object, three sizes.

```
 ┌──────┐   ┌───────────┐   ┌──────────────────────┐
 │ ⚔ 3  │   │ ⚔  ARC    │   │ ⚔  Archer            │
 │ ARC  │   │    3      │   │    Guardsmen · tier 3│
 └──────┘   └───────────┘   └──────────────────────┘
   sm 32       md 44            lg (row header)
```

- Background: the group's soft colour; ink: the group's strong colour; a 2 px left bar in the strong colour so
  the group reads in peripheral vision.
- Glyph: the **category silhouette** (sword, bow, horse, wing; catapult for engineers; the race glyph for
  monsters), drawn bolder than today (2.25 stroke, filled shapes where possible) so it reads at 16 px.
- Tier numeral in the display serif, the largest element of the tile.
- Short code (ARC, SPR, HVY…) from the data tables, always visible from `md` up; the full name on `lg` and in
  the sheet.
- States: off (desaturated, dashed border), pinned (small pin glyph top-right), left out by the search (grey with
  a strike on the numeral), selected (accent ring).

Icons versus TotalStack's portraits: the game's art is Scorewarrior's copyright and cannot ship with an
open-source app. The tile above is the honest alternative: colour + silhouette + numeral + code together carry
what a portrait carries. A later story may let a player load their own portrait pack from a folder into
browser storage (never shipped, never uploaded); it is deliberately out of this plan.

### 6.3 Type

Two faces stay (display serif for headings and tier numerals, system sans for everything else). The scale
shrinks to five steps and the floor rises:

| Step | Size | Use |
|---|---|---|
| xs | 13 px | badges, table captions, never a sentence |
| sm | 14 px | secondary text, helper lines |
| base | 16 px | body, labels, summary lines (15 px allowed on phones under 360 px only) |
| lg | 20 px | card titles, result totals |
| xl | 28 px | stack counts in the result table, the average damage |

Tabular figures on every number. Line length ≤ 70 characters.

### 6.4 Space, shape, motion

One radius for cards (12 px), one for controls (8 px), full round only on the avatar and the floating button.
Spacing on a 4 px grid; cards have 16 px padding on phone, 20 px on desktop. Motion: 120 ms for state changes,
200 ms for sheets, none for anything the user did not trigger; `prefers-reduced-motion` turns all of it off.

## 7. Cards in detail

### 7.1 Army — Troops

**Amended 2026-09-12 after the owner's review.** This is the first form any user sees, and TotalStack gets it
right: choose the lowest and highest tier you own, then click out the icons of the top-tier units you have not
unlocked yet. Simple, efficient, readable. We keep that exact flow and do it in our own design, with better
controls and a clearer summary. What we drop is our chip grid of every unit in the range: lower tiers are
always in, and leaving a lower-tier type out is done from the March, where you see what it costs.

Collapsed (default once configured):

```
 Troops    ▮ G1–G4   ▮ S1–S2   ▮ no engineers   ▮ M3–M5      ⌄
```

Expanded, one row per group:

```
 ▮ Guardsmen     from [◀ G1 ▶]   to [◀ G4 ▶]      at G4:  ⚔4  🏹4  🐎4  🦅4
 ▮ Specialists   from [◀ S1 ▶]   to [◀ S2 ▶]      at S2:  ⚔2
 ▮ Engineers     [ none ▶ ]
 ▮ Monsters      from [◀ M3 ▶]   to [◀ M5 ▶]      at M5:  🐾5  💧5  🐉5  ✊5
```

- **Tier steppers** ("from", "to"): value between two arrow buttons; arrow keys step when focused; tap the value
  to open a strip of every tier for a direct jump. "From" can never pass "to"; the other end follows. Engineers
  and monsters have a "none" position below their first tier.
- **"at G4" tiles**: one `md` unit tile per unit type of the top tier (three or four for guardsmen and
  specialists, four monsters per tier, one engineer). Tap a tile to leave that type out ("I have not upgraded
  riders yet"); it dims with a strike. This is TotalStack's per-category toggle, made per unit and drawn as a
  tile so the type is recognisable. Monsters get the same row (TotalStack has none), since the four monsters
  of a tier are rarely all owned.
- Lower tiers: always in. A type left out from the March (existing `excludedUnitIds`) shows as a muted note
  under the row: "Left out: Swordsman 1, Rider 2 · Put back", so nothing is hidden.
- Rows for engineers and monsters collapse to their stepper alone when set to none, so the card stays four
  short lines and Mercenaries sits right under it (R4).
- The row's group marker and the tiles carry the group colour; the tier numeral is the biggest thing on a tile.

### 7.2 Army — Mercenaries

Collapsed: `Mercenaries   ABM6 ×22 · ABT6 ×24 · BER5 ×∞ · BGM6 ×12   +3 more ⌄` — codes are `xs` tiles with
the count beside them; overflow is counted, never truncated.

Expanded:
- **Selected list first**, one row each: tile · name · tier · role · owned count as a stepper (`∞` toggle) ·
  pin. The row is a checkbox row: tapping anywhere on it except the stepper deselects it.
- **Picker below**: search field, filter chips (tier, role, race), then rows in the same shape; tapping a row
  adds it (checkbox semantics; the whole row is the target, R6). Recently used first.
- Custom mercenary: a "+ Custom…" row at the end of the picker opens the existing dialog restyled as a sheet.

### 7.3 Bonuses

Collapsed: the TOTAL line (health, strength, special, sources-on count) plus a warning marker when a source
is on but empty. Expanded: TOTAL stays as the header; below, groups in the order the game shows them (Captains,
Equipment, Artifacts, Permanent, Other, Events). Each source is a **row**, not a chip: switch · name · value ·
gear. Rows are 40 px, values right-aligned in tabular figures. Editors open in a **sheet** (bottom on phone,
right side on desktop) with the same fields as today; the sheet header repeats the TOTAL so you see it move.

### 7.4 Battle

One card, one or two rows on desktop, four on phone: enemy formation (segmented Standard / Double / Custom),
leadership · authority · dominance as steppers with the pool glyph inside, method (select: Tier ladder / Troops
first / Your own order) with its toggles as switches on one line, objective (select). "Your own order" opens the
existing drag list as a sheet. Every number here is a stepper with arrow-key and wheel support; `Shift` steps
by 10, `Ctrl/⌘` by 100 (R2).

### 7.5 March (results)

- **Header line**: average damage as the largest number on the page, min and hits beside it, silver and gold
  cost under; a delta against the previous run in muted text when there is one.
- **March table**: one row per stack in kill order (the order they fall). Columns: tile · name · **count** (xl,
  tap to copy) · hits · lost · revive cost. Row left edge in the group colour. Mercenary rows carry a small
  "falls last" marker when the method placed them last. Manual editing: tap a count to get a stepper inline;
  the header recomputes live; Undo appears in the header.
- **Left out**: a row of `sm` tiles with a "Keep in march" button that acts on the selected tile(s).
- **Trade-off**: "Compared with all types" as a two-column strip under the header, not a table.
- **Battle story**: a collapsible narrative ("Round 1: the monster hits Archer 3 for 412 …") replacing the
  journal drawer's raw list; the raw journal stays behind a "Details" toggle.
- **HP profile**: the chart, collapsed by default on phone, open on desktop.
- **Copy all counts** and **Save this march** and **Share** at the bottom of the card.

### 7.6 The unit sheet (replaces the popover, R9)

Opens from any tile. Bottom sheet on phone, right panel on desktop. Layout:

1. Header: `lg` tile, name, group and tier, pin toggle.
2. **In this march**: count, position in the kill order ("falls 3rd"), hits it takes, units lost, revive cost
   and time; one sentence: "2 310 archers absorb 1 hit and deal 12 % of the damage."
3. **Why this size**: the HP the stack must reach and how it was reached (per-unit HP × count), in one line.
4. **Unit**: a horizontal bar pair, HP and strength, base versus with bonuses, then the bonus lines that
   apply to it (only the ones that do).
5. Actions: Keep in march / Stop keeping · Leave out · Edit count.

No grid of twelve labelled numbers. Numbers appear once each, next to the sentence that gives them meaning.

## 8. Mobile specifics

- Everything reachable with one thumb: steppers and switches on the right, labels on the left; sheets slide
  from the bottom and are dismissible by swipe and by a visible Close.
- Horizontal scrollers (tile grids) always show a partial tile at the edge and a count.
- Tap targets 44 px; tiles are 32 px but sit in 44 px hit areas.
- The floating button respects `env(safe-area-inset-bottom)`.
- Landscape phones use the desktop split only from 1024 px; below that they get the single column.
- Install prompt and update toast move into the account menu ("Install app", "Update available") instead of a
  free-floating toast competing with the Generate button.

## 9. Accessibility

- Every control has a visible label or a name that matches its visible text; every tile is a `button` with the
  full name ("Archer, tier 3, on"); groups are `fieldset`s with a legend.
- Keyboard: arrows on steppers, `Space`/`Enter` on tiles, `Esc` closes sheets and returns focus to the opener,
  `Ctrl/⌘ + Enter` generates. Roving tab index in tile grids so `Tab` skips over a grid in one stop.
- Contrast: 4.5:1 text, 3:1 for tile borders and glyphs; verified for both themes in CI (§ ui-foundation plan).
- Colour never alone: group glyphs, state glyphs (pin, strike), text labels on every state.
- Live regions: generating status and the result header are announced; nothing else is.
- Motion off under `prefers-reduced-motion`; no auto-scrolling then either (a "Go to march" link appears instead).

## 10. Phases and stories

Phase A depends on the technical plan being accepted (it is the foundation). Each story has acceptance
criteria; the designs above are the spec, and the owner reviews each phase on the dev server before the next
starts.

**Phase A — Frame (after ui-foundation T-01…T-04)**
- D-10 Top bar with brand and account menu (§5.2); remove ProfileBar, the sticky strip and the jump bar.
  Accept: no `position: sticky` in the app; every former profile action reachable from the menu with its
  existing tests passing against role names.
- D-11 Floating Generate button with the four states and the keyboard shortcut. Accept: visible on every
  scroll position at 390×844 and 1280×900; blocked state names the missing input.
- D-12 Two-column desktop layout, single-column phone, setup/result order rule for tablets. Accept: on
  desktop, changing leadership and generating never scrolls the result out of view.
- D-13 New neutral palette and type scale applied to the shell and cards. Accept: no text under 13 px; contrast
  checks pass in both themes.

**Phase B — Army**
- D-20 Unit tile component in three sizes with all states (§6.2), group colours, bolder silhouettes.
- D-21 Tier stepper with arrows, keyboard, the jump strip and the "none" position. Accept: G1–G3 → G1–G4 in one
  click or one key; from never passes to.
- D-22 Troops card in the TotalStack-inspired flow (§7.1): from/to steppers per group and top-tier tiles to
  click out; collapsed one-line summary; none rows collapse to one line. Accept: the whole card at 390 px is
  four rows tall with all four groups set; a newcomer configures G1–G4 without riders in four taps.
- D-23 Mercenaries card: selected list first, whole-row selection, steppers, picker with search and filters.
  Accept: Troops and Mercenaries collapsed summaries visible together at 390×844 without scrolling.

**Phase C — Bonuses and Battle**
- D-30 Bonuses as rows with a pinned TOTAL header; editors in sheets. Accept: the collapsed card is one line.
- D-31 Battle card with segmented enemy, pool steppers, method and objective on one row on desktop.
- D-32 Numeric stepper primitive everywhere a number is typed (housing, counts, levels): arrows, wheel,
  `Shift`/`Ctrl` multipliers, paste of "84 300" and "84,300".

**Phase D — March**
- D-40 March header and table with copyable counts, group edge colour, inline editing with live header and Undo.
- D-41 Left-out row with Keep in march; trade-off strip; delta against previous run.
- D-42 Unit sheet replacing the popover (§7.6).
- D-43 Battle story narrative with the raw journal behind Details; HP profile placement rules.
- D-44 Shared-march banner and the save-a-copy flow (§ J5).

**Phase E — Validation**
- D-50 Journey checks: J1 in ≤ 3 taps and ≤ 2 screens on a 390×844 emulated phone, scripted in Playwright;
  J2 and J3 with their tap budgets.
- D-51 Owner walkthrough on phone and desktop with the game open; findings logged in `docs/PLAN.md` §7.
- D-52 Two external players (P1/P3) try J1 and J6 unaided; problems become stories or are closed with a reason.
- D-53 Rewrite `docs/design.md` for the new system; retire the glossary entries that no longer apply.

## 11. Decisions to validate before building

Tick, strike or amend. Recommendations are marked ★.

- **D1 Group colours.** ★ Green / blue / amber / violet / red as in §6.1, to be checked against in-game unit
  frames. Alternative: reuse the game's exact frame colours if we can identify them.
- **D2 Icons.** ★ Unit tiles (colour + silhouette + numeral + code) rather than portraits. Alternative: a
  user-loaded portrait pack later, never shipped.
- **D3 Frame.** ★ No sticky bars; top bar scrolls away; account menu holds every profile action.
- **D4 Generate.** ★ Floating button, not a menu item; `Ctrl/⌘ + Enter`. Fallback: menu item if the button is in
  the way.
- **D5 Desktop split.** ★ Setup left 5/12, March right 7/12 from 1024 px; single column below. Alternative:
  March under Setup with a sticky result header (rejected by principle 5).
- **D6 Tablet order.** March first when a result exists and nothing changed; setup first otherwise. Or always
  setup first?
- **D7 Bonuses collapsed by default.** ★ Yes, TOTAL line only; expanded state remembered per device.
- **D8 Hero illustration.** ★ Out of the frame; kept on the empty state and About.
- **D9 Unit sheet instead of popover.** ★ Yes, including on desktop (right panel), so one component serves both.
- **D10 Result table with counts as the biggest number.** ★ Yes; chips are gone from results.
- **D11 Personas and journeys.** Confirm P1 as the primary and J1's budget (3 taps, 2 screens) as the success
  criterion for the whole overhaul.

## 12. What does not change

The engine, the data tables, the stored schema (except a per-device UI preferences record for collapsed
states), the share-link format, the sync adapters, the wording glossary in `docs/design.md` §7 (method names,
toggle names, banned words), the accessibility floor, the test strategy (role and label based). Every existing
unit and e2e test keeps passing or is rewritten in the same story that changes what it tests.
