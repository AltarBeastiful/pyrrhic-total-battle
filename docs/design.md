# Pyrrhic — design system

Rules first: `docs/design-rules.md` is the charter this system serves.

One page, five sections, a lot of numbers. The look has to survive that: quiet enough that the figures stay
readable, specific enough not to read as a template, and legible at 390 px in both themes.

**The idea, in one line: the only colour on the page is the colour of a unit.** Everything else is brass,
slate and paper, because the five group hues are fixed and load-bearing (design direction D-19,
`docs/investigations/0005-design-direction.md`).

**The theme is the design** (ADR-0008). Colour, radius, spacing, type and every component default live in
`src/ui/theme.ts`, whose palette is generated in `src/ui/palette.ts`; the composites are `src/ui/kit/**` and
`src/ui/domain/**` (contract: `src/ui/kit/README.md`). A section never invents a colour, a radius or a shadow —
there is nowhere left to invent one: no utility classes, no stylesheet of tokens, and a lint rule that refuses
a `className` string.

Constraints that shaped it: **bundled OFL fonts, never a CDN** (ADR-0002 as amended) — Inter and Fraunces ship
with the app; **nothing leaves the browser** — no icon fetch, no web font request, no analytics pixel; **no
icon assets at all** — game concepts are Unicode emoji, the way the game and TotalStack write them (§5).

---

## 1. Palette

Twelve **seed hues** and one written-out neutral scale. Each seed is expanded into Mantine's ten shades by
`ramp()` in `src/ui/palette.ts`, and the expansion targets **relative luminance**, not HSL lightness: a green
and a violet at the same HSL lightness are nowhere near the same contrast, so a lightness ladder would ship a
guardsmen ink at 3.5:1 and a monsters ink at 8:1. Targeting luminance puts every hue's shade 7 the same
distance from a light sheet and every hue's shade 5 the same distance from a dark one — which is what "the five
inks sit in one narrow band, so no group shouts louder than another" actually requires.

**Shade 7 is the ink a light page reads, shade 5 the ink a dark page reads** (`primaryShade`), and a filled
ground of either is written in whichever of the two house inks clears more contrast on it (`inkOn`, exposed as
`--pyr-on-<colour>`; Mantine's own `autoContrast` computes that from the light scheme whichever scheme is
showing, which is how a near-white accent once shipped white-on-white).

### The seeds, and what each one means

| Colour | Role | Seed | Light ink (7) | Dark ink (5) | Ink on a filled ground |
|---|---|---|---|---|---|
| `brass` | the accent — anything you can act on; `primaryColor` | `#c9a24a` | `#6d5621` | `#c69c3e` | `#fafbfa` / `#131917` |
| `guardsmen` | the guardsmen group | `#256b35` | `#236632` | `#3fb75b` | `#fafbfa` / `#131917` |
| `specialists` | the specialists group | `#25568a` | `#275b93` | `#74a6da` | `#fafbfa` / `#131917` |
| `engineers` | the engineers group | `#6f5417` | `#705517` | `#cc9a2a` | `#fafbfa` / `#131917` |
| `monsters` | the monsters group | `#5b368a` | `#6e41a7` | `#b296d6` | `#fafbfa` / `#131917` |
| `mercenaries` | the mercenaries group | `#8c3030` | `#9c3636` | `#d88f8f` | `#fafbfa` / `#131917` |
| `danger` | destructive, or over capacity — registered as Mantine's `red` too | `#a32c1f` | `#a52d1f` | `#e6887e` | `#fafbfa` / `#131917` |
| `tier1` | tier I — slate, the one tier with no hue | `#485150` | `#515b5a` | `#99a5a3` | `#fafbfa` / `#131917` |
| `tier2` | tier II — green | `#256b35` | `#236632` | `#3fb75b` | `#fafbfa` / `#131917` |
| `tier3` | tier III — blue | `#25568a` | `#275b93` | `#74a6da` | `#fafbfa` / `#131917` |
| `tier4` | tier IV — violet | `#5b368a` | `#6e41a7` | `#b296d6` | `#fafbfa` / `#131917` |
| `tier5` | tier V — the game's gold | `#71530f` | `#73540f` | `#d0981c` | `#fafbfa` / `#131917` |
| `tier6` | tier VI — crimson | `#8e2f2f` | `#9e3434` | `#d98d8d` | `#fafbfa` / `#131917` |
| `tier7` | tier VII — violet | `#5c3a8e` | `#6b44a6` | `#b096d4` | `#fafbfa` / `#131917` |
| `tier8` | tier VIII — teal | `#1b625c` | `#1b635d` | `#31b3a9` | `#fafbfa` / `#131917` |
| `tier9` | tier IX — white-gold | `#645831` | `#655931` | `#b3a165` | `#fafbfa` / `#131917` |

The accent is a **hue and not a metal** (ADR-0008): a restrained brass from the game's trim, so Mantine's
filled buttons work as designed. It still means one thing — "you can act on this" — and it collides with none
of the five unit hues.

**Tiers I–IV were added for direction A** (design plan §5.5): the March draws every stack as a pill coloured
by its tier, so the four troop tiers need inks as much as the five mercenary ones already did. Their seeds are
*the group seeds*, deliberately — the game paints a tier II green and a tier III blue, and a second green
beside the guardsmen one would put two nearly indistinguishable inks on the same screen. `theme.test.ts`
asserts `tier2`, `tier3` and `tier4` stay equal to `guardsmen`, `specialists` and `monsters`; tier I is the
one tier with no hue, a slate whose dark ink lands on `#99a5a3` (the design's Ash, to the nearest step the
luminance ladder can reach — the ladder is what guarantees the nine tier inks read at one loudness).

**The one gilded object is Generate** (`GOLD` in `palette.ts`): `linear-gradient(180deg, #e0c070, #c19a3f)`
lettered in `#1a1408`, with `0 1px 0 rgb(255 255 255 / 35%) inset, 0 6px 16px rgb(201 162 74 / 25%)`. It is
the same in both schemes, because it is the game's trim rather than a surface, and `pnpm contrast` checks its
ink against **both ends** of the gradient (6.8:1 and 12.4:1). The brand mark is the same metal turned 45°.

**Pools have a colour too**, because the March writes a pool's figure over the stacks it paid for: leadership
is `guardsmen` (the shield), authority is `brass` (the crown), dominance is `danger` (the skull). Three ramps
already checked, no new hue.

### The generated ramps

Printed by `node scripts/palette-table.ts`; paste its output back here after changing a seed. Nothing in the
app writes a hex: a component asks for `color="guardsmen"` or `c="tier6.5"`, and Mantine resolves the step.

| Colour | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| `brass` | `#f6f3ee` | `#ece7da` | `#e0d3b8` | `#d3bd8c` | `#ccad68` | `#c69c3e` | `#a27f30` | `#6d5621` | `#52401a` | `#3a2f14` |
| `guardsmen` | `#eff5f0` | `#dbebdf` | `#b9ddc2` | `#8cce9b` | `#66c47b` | `#3fb75b` | `#34954a` | `#236632` | `#1b4b26` | `#16381d` |
| `specialists` | `#f1f4f7` | `#e1e8f1` | `#c6d6e8` | `#a6c1df` | `#8fb4dd` | `#74a6da` | `#4587cd` | `#275b93` | `#1f446b` | `#18324c` |
| `engineers` | `#f6f3ed` | `#eee7d6` | `#e3d3af` | `#d8bb7c` | `#d4ab50` | `#cc9a2a` | `#a67e22` | `#705517` | `#533f13` | `#3c2e0f` |
| `monsters` | `#f5f2f7` | `#eae6f0` | `#dad1e7` | `#c9b8de` | `#bea8da` | `#b296d6` | `#9872c8` | `#6e41a7` | `#52327a` | `#3b2657` |
| `mercenaries` | `#f8f2f2` | `#f1e5e5` | `#e8cfcf` | `#dfb4b4` | `#dca3a3` | `#d88f8f` | `#ca6666` | `#9c3636` | `#742a2a` | `#542020` |
| `danger` | `#f9f2f2` | `#f3e3e2` | `#edcdca` | `#e8b2ad` | `#e79f97` | `#e6887e` | `#dd594a` | `#a52d1f` | `#7b231a` | `#591c15` |
| `tier1` | `#f3f4f3` | `#e6e7e7` | `#d2d5d5` | `#bac1c0` | `#aab3b2` | `#99a5a3` | `#788785` | `#515b5a` | `#3c4343` | `#2d3131` |
| `tier2` | `#eff5f0` | `#dbebdf` | `#b9ddc2` | `#8cce9b` | `#66c47b` | `#3fb75b` | `#34954a` | `#236632` | `#1b4b26` | `#16381d` |
| `tier3` | `#f1f4f7` | `#e1e8f1` | `#c6d6e8` | `#a6c1df` | `#8fb4dd` | `#74a6da` | `#4587cd` | `#275b93` | `#1f446b` | `#18324c` |
| `tier4` | `#f5f2f7` | `#eae6f0` | `#dad1e7` | `#c9b8de` | `#bea8da` | `#b296d6` | `#9872c8` | `#6e41a7` | `#52327a` | `#3b2657` |
| `tier5` | `#f7f4eb` | `#efe6d3` | `#e6d3a7` | `#ddbb6c` | `#dcaa37` | `#d0981c` | `#aa7d17` | `#73540f` | `#553f0d` | `#3e2e0b` |
| `tier6` | `#f8f2f2` | `#f1e5e5` | `#e8cece` | `#e0b5b5` | `#dda3a3` | `#d98d8d` | `#cc6565` | `#9e3434` | `#742929` | `#542020` |
| `tier7` | `#f4f2f7` | `#eae6f0` | `#d9d0e6` | `#c7b9dd` | `#bca8d9` | `#b096d4` | `#9674c6` | `#6b44a6` | `#503379` | `#3a2755` |
| `tier8` | `#edf6f5` | `#d6ebea` | `#afdeda` | `#77cdc6` | `#41c4b8` | `#31b3a9` | `#28928a` | `#1b635d` | `#164a46` | `#113633` |
| `tier9` | `#f5f3f0` | `#eae7df` | `#dad4c2` | `#c9be9e` | `#beb083` | `#b3a165` | `#948349` | `#655931` | `#4a4226` | `#36301d` |
| `slate` | `#fafbfa` | `#ecefec` | `#dee3df` | `#9da7a3` | `#6e7873` | `#343d3b` | `#2b3231` | `#1e2423` | `#161a19` | `#101413` |

`slate` is written out rather than generated: its extremes are the design's own surfaces and its named greys
have to land on the indices Mantine paints with. It is registered as `dark` as well, because that is the scale
Mantine's dark scheme reads.

### The surfaces

Nine values per scheme, in `SURFACE` (`src/ui/palette.ts`). `cssVariablesResolver` points Mantine's own
variables at them, so overriding these nine re-skins every component at once.

| Name | Light | Dark | Mantine variable | Use |
|---|---|---|---|---|
| page | `#ecefec` **Limewash** | `#161a19` **Slate** | `--mantine-color-body`, `--pyr-page` | the page. Flat: no gradient, no wash |
| sheet | `#fafbfa` **Paper** | `#1e2423` **Forge** | `--mantine-color-default` | the setup sheet, the March pane, dialogs, sheets, popovers |
| raised | `#dee3df` **Stone** | `#2b3231` **Anvil** | `--mantine-color-default-hover`, `--pyr-raised` | a block inside a card, a hover, the chosen row |
| sunken | `#d5dbd7` | `#101413` | `--pyr-sunken` | a well: a read-only figure, a gauge track, the link box |
| ink | `#131917` **Pitch** | `#e7ece9` **Chalk** | `--mantine-color-text` | body text and titles |
| muted | `#515a56` | `#9da7a3` **Ash** | `--mantine-color-dimmed` | labels, captions, second lines — never below 4.5:1 |
| hairline | `#cfd5d1` | `#313938` | `--pyr-hairline` | **decoration only**: the rule between sheet sections |
| field | `#6e7873` | `#78837f` | `--mantine-color-default-border` | the border of anything you type in or press; ≥ 3:1 |

Three more variables the app's own CSS reads: `--pyr-appbar-height` (64 px, the height both bars and the
sticky pane are measured from), `--pyr-pane-width` (**420 px** since the review of 2026-09-13 — M3's supporting pane, widened from 380 because
"the right side battle summary could take a bit more space"; the setup column gives up the 40 px, and 420 is
what puts four stack pills across), `--pyr-page-margin`
(16 px compact / 24 px from 600 px — Material's page margins, §4) and `--pyr-font-numeral` (Fraunces).

### Checked, not guessed

`pnpm contrast` (`scripts/contrast-check.ts`) imports the palette module the app builds its theme from, so
there is no second copy to drift, and fails on any pair below its floor. **860 pairs, all passing:**

| Rule | What it covers | Lowest light | Lowest dark |
|---|---|---|---|
| **4.5:1** (1.4.3) | ink and muted on page, sheet, panel, pane, raised, sunken; every ramp at its scheme's shade on those six surfaces and on its own 12 % tonal ground; the ink a filled ground of it is written in; Generate's ink on both ends of its gradient | **4.95** | **4.80** |
| **3:1** (1.4.11) | `field` — the border of every control — and the focus ring, on the six surfaces | **3.52** | **3.34** |

`hairline` and the two panel borders are deliberately below 3:1: they draw the edge of a block and nothing a
finger ever lands on, so the checker prints them for information and never fails on them.

Rules:

- **Colour identifies a unit, never a state.** A tile has a glyph, a roman tier and a code beside its group
  colour; a warning has ⚠️ *and* the wording; an on-state is a tonal step *and* a spoken `aria-checked`.
- **One primary per view.** Generate is the one gilded control on the page, and nothing else wears the metal;
  every other action is `variant="default"`. Filled brass stays the fill for a dialog's confirm.
- The mercenaries red and `danger` share a hue family on purpose, and are told apart by where they appear (a
  tile) and what sits next to them (a glyph).
- A tier ink is allowed on exactly four things: the **stack pill** in the March (border, code and count), the
  **tier badge** (`src/ui/domain/TierBadge.tsx` — the roman numeral in Fraunces on a wash of its own ink), the
  **mercenary pill's** roman numeral and the **heading over a tier** in the mercenary picker. Everywhere else a
  unit's colour is its group's, so the two systems never fight — and the March is the one place where telling
  two stacks of the same unit apart is the whole job, which is why it is the tier that colours it there.
- A **chip's on-state is a tint and a hairline of its own ink, with no check mark** (owner, 2026-09-13): the
  glyph and the code are the chip, and the state is carried by `aria-checked` where a state belongs.

## 2. Surfaces — which one, when

```
page              the page ground
├ panel           a setup section: a lit block — gradient, one hairline, one soft shadow   (kit `Panel`)
│ └ well          anything sunk into it: a field, a tier stepper, a segmented track, a figure
│ └ raised        a block on top of it: a hover, the chosen segment, the account pill
├ pane            the March: the same idea one step brighter and one step deeper           (`Panel surface="pane"`)
│ └ glance        the part of it that stays: recap · Generate · the pools and their pills
│ └ tier/13       a stack pill: a wash of its tier's ink, bordered in the same ink
└ sheet           what floats over the page: a dialog, a popover, a menu
  └ danger/12     the one state block that is still tinted
```

**Direction A replaced D-19's one continuous sheet** (design plan §5.5, adopted 2026-09-13): the setup is
four panels with 16 px between them, and the full-width `Divider` that used to tell the sections apart is
gone — a panel's own edge does that now. Never nest two panels: go one step in (`well` or `raised`), or drop
the ground and use spacing. Inside the March the recap, Generate, the pills and the counts are one surface,
not four cards.

Elevation has three steps and each is for something that floats: a panel's `0 8px 24px`, the March pane's
`0 12px 32px`, and Mantine's own overlay shadow on a dialog or a bottom sheet. The one gilded object,
Generate, carries a glow of its own metal rather than a shadow.

## 3. Type

Two bundled families, and their jobs are not the ones you would guess. **Inter** sets everything you read,
titles included, and every figure a player compares down a column (tabular). **Fraunces** sets *numerals only*
— the roman tier on a unit tile and the one hero figure the March pane opens with — through the `numeral`
variant of Mantine's `Text`, which is the only way in: Mantine has no numerals slot.

| Role | Face | How it is asked for | Size |
|---|---|---|---|
| The hero figure (expected damage) | Fraunces 300, `opsz 144`, `SOFT 0`, `WONK 0` | `<Text variant="numeral" fz={{ base, lg }}>` | 48 px in the pane, 40 in the phone's sheet |
| A pool's figure, over the stacks it paid for | Inter 700, tabular, in the pool's colour | `fz="1.625rem"` | 26 px |
| A stack's count on its pill | Inter 700, tabular, `nowrap` | `fz="1.1875rem"` | 19 px |
| The brand, in the app bar | Inter 600 | `<Title order={1} size="1.125rem">` | 18 px |
| Section titles | Inter 600, `letter-spacing .02em` | `<Title order={2}>` — **no `size` prop** | 15 px |
| Body, control labels, unit names | Inter 400 | `size="md"` (the default) | 16 px |
| A housing figure (the wells you retype into) | Inter 400, tabular | the `.housing` well | 15 px |
| Captions, helper lines, panel meta | Inter 400/500 | `size="sm"` = `size="xs"` | 13 px |
| A stack pill's code and roman tier | Inter 600, in the tier's ink | `fz="0.75rem"` | 12 px |
| The roman tier on a unit tile | Fraunces 500, `opsz 144` | `<Text variant="numeral">` | 13 / 16 / 21 px |
| The roman tier on a badge or a mercenary pill | Inter 700, `+.02em` | `<TierBadge>` | 11 px |
| Share links, ids | `fontFamilyMonospace` | `size="xs"` | 13 px |

**The section title dropped from 21 px to 15** with direction A (design plan §5.5): a panel's title is a label
over a dense form, and the figures inside it are what the eye is meant to land on. The scale is otherwise the
traditional one from *The Elements of Typographic Style* — 16 / 21 / 24 / 48 — over our own 13 px floor, which
is an accessibility decision rather than Bringhurst's. **14, 18 and 20 are gone** from the ramp: `xs` and `sm`
are the same 13 px, and `headings.sizes` is written out in the theme so `h1`–`h6` land on the steps instead of
on Mantine's own six. A section that sets its own heading size is a bug (M-09).

The one place under 13 px is a **stack pill's top line** (12 px): it is three letters and a roman numeral in a
78 px column, it is repeated on every pill, and the count under it says the same thing loudly. Everywhere the
artboards wrote 12 px for an *information* line — a figure's label, a field's label, a panel's meta — the app
writes 13, because design rule 19 names "12 px meta lines" as the thing it exists to prevent.

Measure ≤ 70 characters. `output`, `td` and `th` get tabular figures for free.

## 4. Spacing, radius, motion

### The separation language

The owner's review of 2026-09-13 — "hard to distinguish parts", "the battle summary is crammed and misses
clear separation", "clearer separation, it's a bit all over" — answered in ten lines. Every surface on the
page obeys all ten; `kit/Sections.tsx` and `theme.module.css` are the only places that draw them.

1. **A card is a card, and the only card.** No card inside a card, no tinted block standing in for one; the
   one exception is an `Alert`, which is a state and not a container.
2. **A card's parts are separated by one hairline with 16 px above and below** — `--pyr-hairline`, 1 px,
   full width — and by nothing else. The kit's `Sections` draws it; a part that is not on screen takes its
   line with it.
3. **The first part carries no line and no space above it, the last none below.** What closes a card at both
   ends is its own padding, so the rhythm reads as one object with parts.
4. **Card padding is 20 px on a desktop and 16 px in a compact window**, panel and March pane alike.
5. **Every gap is a multiple of 8**: 8 between siblings, 16 between parts, 24 between cards. 4 and 6 exist
   only *inside* one control (a pill's inner gap, a glyph beside its word).
6. **A card's head is the title at 15/600 on the left and a 12 px muted meta on the right**, 14 px above the
   first part. The meta summarises the form under it and is never a control.
7. **A figure is the label 12 px muted above and the value 15/600 tabular below**, the unit glued to the
   number ("+312 %", "4 519 202") and no sentence around it. `kit/Figures` is the only way to draw one.
8. **Figures are laid out in a grid, not as rows**: two columns in a pane, four in a full-width card, 8 × 16
   gaps.
9. **One rule, one weight, one colour.** `Divider`, `Menu.Divider` and `Sections` all draw `--pyr-hairline`;
   the ≥ 3:1 `field` colour is for the edge of something you press, never for separating parts.
10. **Nothing else separates anything**: no second rule, no box, no tonal step, no extra 32 px of air where a
    hairline is what was meant.

The one deliberate breach of design rule 19 is line 6 and line 7's **12 px**, which the spacing contracts
(`docs/design-canvas/MarchPaneSpacing.dc.html` `.h .meta` and `.fig .k`) write throughout. It is one
variable, `--pyr-meta`, so restoring the 13 px floor is a one-line change; the tier badge's 11 px
(`TierBadge`) is the other, and both are labels whose meaning is also in the accessible name.

- **Radius is decided by what a thing is**, never by looks. The theme's scale is `xs` 4 · `sm` 8 · `md` 12 ·
  `lg` 16 · `xl` 28, and `defaultRadius` is `sm`: a setup panel and the March pane are `md` (M3 medium), so is
  every overlay, buttons, fields and chips are `sm` (M3 small — the 999 px pill is retired except on the
  account trigger and the avatar), a unit tile is `xs`, the phone's March sheet is 20 px on its **two top
  corners only**. Two shapes sit off the scale and say why: a **stack pill** is 10 px (it is neither a control
  nor a card) and Generate is 10 px (it is the artboards' own figure).
- **Spacing is compressed on purpose**: `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24. Mantine's stock scale
  (10 · 12 · 16 · 20 · 32) would push the March below the fold, and TotalStack fits a whole army on one screen.
- **Page margins are Material's**: 16 px in a compact window, 24 px from the medium window class (600 px) up,
  and 24 px above and below the content. One variable, `--pyr-page-margin`, read by `Container`, the top app
  bar and the command bar, so the brand, the panels and Generate all start on the same line (the phone bar's
  own padding is the artboard's 12 px, because four chips share a 390 px row).
- **Every card is 20 px of padding on a desktop and 16 px in a compact window**, with 16 px of air between
  them — the panel *and* the March pane, so the setup's left edge and the March's are the same distance from
  their own borders. The pane was 24 and the panel 20/24, which is the "a bit all over" of the review.
- **Separation between cards is an edge and space; separation inside a card is one hairline.** Since
  direction A each setup section is its own panel, so nothing is drawn *between* panels. Inside one, the
  parts are told apart by the ten lines above. A border *and* a shadow *and* a tonal step on the same element
  is still the thing this system exists to prevent — a panel is allowed all three precisely because it is the
  one object the design says is lit.
- **Density by purpose.** Controls are Mantine's `sm` (`ActionIcon` too — `xs` is 18 px, under the 24 px target
  minimum); a **chip and a tier stepper are both 30 px**, so a troop row reads as one line of equal parts; a
  **housing well is 40 px** and a third of the command bar wide, because it is the figure a player retypes off
  the game's own march screen — 34 px as the phone bar's chip, which is that same well waiting to be typed in; a **stack pill is 56 px tall with 6/8 px of padding**, laid out
  `repeat(auto-fill, minmax(88px, 1fr))` so four fit across the 420 px pane and a six-figure count widens
  every pill and wraps the row to three instead of clipping one; a **mercenary pill is 32 px with 0/6/0/10
  and a 6 px inner gap**; a **left-out pill is 26 px**, because it is a footnote to the march.
- **One bar per edge** (design rule 2 as amended, plan §5.6). The top app bar is 64 px; the **command bar**
  closes the page at the bottom — 88 px of wells, the objective and Generate inside the page width, 24 px off
  the sides and off the bottom edge (112 px reserved), and two rows of 34 + 40 px (102 px) on a phone. Both
  are `position: sticky` at the end of the frame, so their height is in the flow and nothing hides under
  them; `html` is given the matching `scroll-padding` so nothing the browser scrolls to lands under a bar.
- **One block stays put.** On a desktop the March's recap, pools and pills are `position: sticky` under the
  64 px app bar, capped at `calc(100dvh - 64px - 112px - 16px)` — the window less both bars; everything after
  them flows with the page. That cap is a fallback, not a layout: a march of up to fifteen stacks fits a
  900 px window without it.
- **Alignment.** Everything left-aligned; figures right-aligned in their column; nothing centred. A figure's
  name is a caption *under* it only for the hero — everywhere else the label comes first, because those are
  read as a list.
- **Motion** is Mantine's own, and `respectReducedMotion` is on: someone who asked the system for less movement
  gets none of ours.
- **Focus** is Mantine's `mantine-focus-auto` ring, never removed, never restyled per component.

## 5. Glyphs

**Game concepts are Unicode emoji** (owner's decision, 2026-09-13; design rules 21 and 22). A player reads ⚔️
as melee and 👑 as authority because that is what the game and TotalStack show them, and a stroked Lucide sword
is a translation of that, not the thing itself. There are **no icon assets in this repository**: no SVG set, no
licence to carry, no network request. Emoji render in the platform's own font.

One component, `Glyph` (`src/ui/domain/Glyph.tsx`), and one map, `glyphs.ts`. The mapping is the contract;
which emoji draws a meaning is not, and neither is the face it renders in.

**The glyph rule** (the owner's review of 2026-09-13, "many padding issues especially with unicode
characters"; artboards `MarchPaneSpacing.dc.html` and `MercenariesSpacing.dc.html`, `.g`): every emoji sits in
a **fixed `1.25em × 1.25em` inline-flex box**, `line-height: 1`, `vertical-align: -0.2em`, `flex: 0 0 auto`,
and never as bare text. An emoji is drawn by whatever font the platform hands it, and that font's ascent,
descent and advance have nothing to do with Inter's: bare, a 🛡️ beside "20 000" pushes the line's baseline
down, by a different amount on every device. In a box of its own it cannot — the line's metrics are Inter's,
the box is the same width everywhere, and glyphs down the left edge of a list of figures line up in a column.
The box is a class (`domain.module.css`, `.glyph`), not a prop: there is one box and it is not negotiable,
and `scale` only changes the em it is measured in. Nothing in the app writes an emoji outside `Glyph`.

| Family | Glyphs |
|---|---|
| Categories | ⚔️ `melee` · 🏹 `ranged` · 🐴 `mounted` · 🦅 `flying` |
| Groups | 🛡️ `guardsmen` · 🗡️ `specialists` · ⚙️ `engineers` · 💀 `monsters` · 🏰 `army` · 👹 `epicMonster` |
| Races | 🐾 `beast` · 🔥 `elemental` · 🐉 `dragon` · 🗿 `giant` |
| Housing pools | 🛡️ `leadership` · 👑 `authority` · 💀 `dominance` |
| Figures | 🔒 `minimumDamage` · 🎯 `averageDamage` · ⏳ `time` · 🪙 `silver` · 🏵️ `dragonCoin` · 💰 `gold` |
| States | ∞ `unlimited` · 📌 `pin` · ⚠️ `warning` |

- **Decorative by default.** `<Glyph kind="melee" />` renders `aria-hidden`; it repeats a visible label, never
  replaces it. Give it a `label` — and only then — when it stands alone, and it becomes `role="img"` with that
  name.
- **One meaning per glyph.** 👑 is always authority, 💀 is always the monsters family and dominance with it.
- **Meaning may also be carried by coloured text** (`c="tier6.5"`, `c="guardsmen.7"`), with the contrast floor
  checked. Both are first-class tools, not workarounds.

**Lucide** (ISC, `lucide-react`) draws interface chrome only — chevrons, the gear, close, copy, search, the
sun and moon, the arrows on a sync row — because those are our words, not the game's. It is imported directly
from the package at the call site, sized in `px` to match the text beside it, and always `aria-hidden` with
the name on the button around it.

The unit **tile** (`src/ui/domain/UnitTile.tsx`) is the object the army is actually drawn with: group ground,
group frame, glyph, roman tier and short code. `TierBadge`, `GroupMarker` and `CaptainChip` are for the places
too small for a tile.

## 6. Components and their defaults

Mantine 9 is the component system (ADR-0008). Sections import its layout and typography directly (`Stack`,
`Group`, `SimpleGrid`, `Grid`, `Container`, `Text`, `Title`, `Divider`, `Table`, `Alert`, `Accordion`,
`SegmentedControl`, `Select`); controls come from the kit. The defaults below are set once, in
`theme.components`, and a section never repeats them.

| Component | Default |
|---|---|
| `Button`, `TextInput`, `Select`, `NumberInput` | `size="sm"` |
| `NumberInput` | `hideControls`, `thousandSeparator: ' '`, selects its whole value on focus |
| `NativeSelect`, `Badge` | `size="xs"` |
| `ActionIcon` | `size="sm"` — 26 px, over the 24 px target minimum |
| `Chip` | `size="xs"`, `variant="light"`, `radius="sm"`, forced to TotalStack's 32 px / 13 px, label height free so a second dimmed line fits |
| `Pill` | `size="md"` |
| `Popover` | `shadow="md"`, no arrow |
| `Modal`, `Drawer`, `Card` | `radius="md"`; `Card` `padding="md"`, no border |
| `Paper` | `radius="sm"` |
| `Container` | `px="var(--pyr-page-margin)"` — Material's page margins |
| `Text` | the `numeral` variant switches to Fraunces |

The **kit** (`src/ui/kit`, contract in its own README) is the boundary for controls: `AppBar`, `AppMenu`,
`ChipRow`, `ChoiceList` (`layout="list"` rows or `layout="cards"`), `CornerGear`, `Dialog`, `Disclosure`,
`Figures`, `GenerateFab`, `GroupedCombobox`, `NumberField`, `PillRow`, `Sections`, `Sheet`, `SwitchRow`,
`TierSelect`. Two of them carry the language of §4 and are the only way to draw it: `Sections` (a card's parts
and the hairline between them) and `Figures` (a label over a value, as rows or as a grid).
The **domain** (`src/ui/domain`) is the boundary for the components that know what a unit is: `UnitTile`,
`GroupMarker`, `TierBadge`, `CaptainChip`, `MarchRow`/`MarchTable`, `PoolGauge`, `DeltaText`, `StatBar`,
`Glyph`.

Where each one belongs: `ChoiceList` is one choice out of several where each needs a sentence — `cards` when
there are three or four and they are the question of the screen, `list` when there are more or they carry a
trailing figure. `SwitchRow` is a setting that is on or off. `Disclosure` is one fold that keeps its summary
visible; `Accordion` is for a group of them. `Sheet` is a long editor beside the page; `Dialog` is a question
you must answer. `GenerateFab` exists only below `lg`, because above it Generate is in the March pane.

## 7. Wording

Short. Second person. Say what it does to *your* march, not what the algorithm is called.

Banned in user-facing text: **"Pro"** (nothing here is paid), **"preservation"** (jargon from elsewhere),
**"pill"** (say "chip", or nothing), and anything that reads like it was translated from a patch note.

### Glossary — apply everywhere in the UI (the stored ids never change)

| id / flag | Say | One-line description |
|---|---|---|
| `method: 'elite'` | **Tier ladder** | Your cheapest, lowest-tier stacks take the hits first; each higher tier stands one step later. |
| `method: 'ms'` | **Troops first** | Every mercenary and monster stack is kept smaller than your smallest troop stack, so hired units only fall after all your troops. |
| `method: 'custom'` | **Your own order** | You decide which stack falls first, mixing troops, mercenaries and monsters. |
| `relaxedPreservation` | **Allow damage trades** | Let a hired stack grow past your smallest troop stack when that raises the damage; the results name every stack it affects. |
| `monstersLast` | **Monsters after troops** | Keep every monster stack below your smallest troop stack; mercenaries stay free. |
| `strictMercsAboveMonsters` | **Monsters after mercenaries** | Also keep every monster stack below your smallest mercenary stack. |
| `roundTo10` | **Hired units in tens** | Mercenary and monster stacks become multiples of ten, because reviving works in tens. |
| `customOrder` | **Order of the fall** | First to fall at the top. |

### Results

"Battle summary" keeps its name. The cards read:

| Field | Card title |
|---|---|
| `minDamage` | Damage if the monster strikes first |
| `maxDamage` | Damage if you strike first |
| `avgDamage` | Expected damage |
| `recovery.*` | **Recovery** — silver, gold, dragon coins, time |
| `damagePerSilver` / `PerGold` / `PerDragonCoin` | **Value per silver** / **per gold** / **per dragon coin** |
| `damageByPool` | Damage by pool — troops, mercenaries, monsters |

The battle journal keeps in-game phrasing, line for line, so a player can hold it next to the real report.

### The unit sheet

Three headed blocks, in this order:

1. **This march** — count, total HP, one hit, of which from strength-against, target squad, chance of a
   double hit.
2. **Unit** — tier, category, group, race, base HP, base strength, housing cost.
3. **After the battle** — retrain (silver and time), revive (gold).

### Elsewhere

- A bonus source is a **chip**: "Switch a source on for this march, or open its gear to edit what it is worth."
- Housing pools are **Leadership / Authority / Dominance** (the game's own words), and what they pay for:
  troops / mercenaries / monsters.
- Say **"stack"** for a unit type in a march, **"march"** for one battle setup, **"profile"** for one account.
- Errors say what to do: "Enter a leadership capacity above 0", not "Invalid input".


## 8. Finish reference

What "finished" looks like here, named once so parallel work stops inventing it (D-18, rewritten for D-19).

**The reference is restraint with one loud thing.** A surface is told from the one under it by *one* step of
tone or by *one* hairline — never a border plus a shadow plus a tint. The page has exactly one accent, a
restrained brass, and it means "you can act on this". The setup is a page; the answer is an object. A card is quiet so
that a number can be loud, and the number that is allowed to be loud is the expected damage.

**Where the boldness is spent.** The kill-order column in the March pane: the stacks in the order they fall,
each with a bar as long as the damage it deals measured against the loudest stack of the march, under one 48 px
figure in the display face. Nothing else on the page gets an ornament. (The bar is damage and not health on
purpose: the sizer gives every stack the same HP ceiling, so a column of HP bars would be identical bars.)

**Three rules a reviewer can check without an opinion:**

1. **A control has a border or a fill, never both.** A filled button draws no outline; an outlined button has a
   transparent or sheet ground. The one exception is a focus ring, which is drawn outside the box.
2. **One radius per level, chosen by what the thing is** (§4). A radius is never picked for looks.
3. **The theme's spacing scale, and nothing else.** Padding, gaps and offsets are `xs`–`xl` (4 · 8 · 12 · 16 ·
   24), with a bare number allowed only *inside* a control. Anything else belongs in `src/ui/theme.ts`, and
   `pnpm lint` fails on a `className` string.

**Two rules about controls that came out of the owner's review (2026-09-13):**

4. **A step button exists only for a short ordered list** — a tier, a captain's star level, a dozen values at
   most. Every other number is a `NumberInput`: a plain field that selects its whole value on focus, so the
   next keystroke replaces it, while the arrow keys, the `Shift`/`Ctrl` jumps and locale parsing all remain.
   Nobody walks a capacity to 84,300 one press at a time.
5. **No meta strings joined by middle dots, and no label that exists only to sit above a control.** Facts
   become cells with space between them, a caption under a figure, or a chip. The recap carries the answer as
   labelled cells — in the March pane's header on a desktop, in the bottom bar and its sheet on a phone (frame
   V1, spike 0009); the app bar carries the brand and the account and nothing else.
