# Pyrrhic — design system

One page, five sections, a lot of numbers. The look has to survive that: quiet enough that the figures stay
readable, specific enough not to read as a template, and legible at 360 px in both themes.

**The idea, in one line: the only colour on the page is the colour of a unit.** Everything else is iron, slate
and silver, because the five group hues are fixed and load-bearing and a sixth accent hue would compete with
data (design direction D-19, `docs/investigations/0005-design-direction.md`).

Everything here is implemented in `src/index.css` (tokens), `src/ui/icons/**` (glyphs and badges) and
`src/ui/kit/**` + `src/ui/domain/**` (components). Sections never invent a colour, a radius or a shadow: they
use these tokens and these components.

Constraints that shaped it: **bundled OFL fonts, never a CDN** (ADR-0002 as amended) — Inter and Fraunces ship
with the app; **nothing leaves the browser** — no icon fetch, no web font request, no analytics pixel; **no
arbitrary Tailwind values** — a number that is not in this file is a lint error.

---

## 1. Palette

Two layers, one set of names. A **neutral base** carries almost everything: a green-shifted slate in dark,
limewashed stone in light. The neutrals take their faint green cast (hue ≈ 155) from the guardsmen family, so
the chrome is made of the same material as the army and the page belongs to this product and no other.

**Group colours** identify units and nothing else. The **accent is not a hue**: it is a metal — struck silver
on dark, dark iron on light — which is also what a march costs. It means one thing, "you can act on this", and
it collides with none of the five unit hues.

Light is the base (`:root`); dark comes from `[data-theme="dark"]` and from `prefers-color-scheme` when the
player has not chosen. Both dark blocks are identical by construction — `pnpm contrast` fails if they drift.

### Neutral base, accent and states

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#ecefec` **Limewash** | `#161a19` **Slate** | The page. Flat: no gradient, no wash. |
| `surface` | `#fafbfa` **Paper** | `#1e2423` **Forge** | The setup sheet, the March card, dialogs, sheets, popovers. |
| `raised` | `#dee3df` **Stone** | `#2b3231` **Anvil** | A block inside a card, a hover, the chosen row of a list. |
| `sunken` | `#d5dbd7` | `#101413` | A well: a read-only figure, a gauge track, the share-link box. |
| `fg` | `#131917` **Pitch** | `#e7ece9` **Chalk** | Body text and titles. 15.4:1 / 14.6:1 at best. |
| `muted` | `#515a56` | `#9da7a3` **Ash** | Labels, captions, secondary lines. Never below 4.5:1. |
| `line` | `#cfd5d1` | `#313938` | **Decoration only**: the hairline between sheet sections, dividers. |
| `field` | `#6e7873` | `#78837f` | The border of anything you can type in or press. ≥ 3:1 (WCAG 1.4.11). |
| `accent` | `#262e2b` **Iron** | `#d8e0dc` **Silver** | Actions: the primary button, the on-state mark, focus rings. |
| `accent-fg` | `#fafbfa` | `#161a19` | Text on a filled accent. A filled Generate is the loudest thing on the page. |
| `accent-soft` | `#dee3df` | `#2b3231` | The ground of a chosen row or segment — a tonal step, not a coloured block. |
| `accent-line` | `#5b6560` | `#8e9a95` | A hairline that has to clear 3:1: the ring on an open card. |
| `info` | `#515a56` | `#9da7a3` | Information, never action. Carries the (i) glyph; no hue of its own. |
| `ok` | `#131917` | `#e7ece9` | Saved, copied, within budget. Carries the tick; no hue of its own. |
| `warn` | `#8c3a2a` | `#e8a08f` | Worked, but look at it. The ember as *ink*, on `raised`, with the triangle. |
| `danger` | `#a32c1f` | `#ee8878` | Destructive, or over capacity. **The one state that keeps a tinted ground.** |
| `*-fg` / `*-soft` | `#fafbfa` / `#dee3df` | `#161a19` / `#2b3231` | Ink on a filled tone; the tone's own block. `danger-soft` alone is tinted (`#f3dcd7` / `#3a2320`). |

**Why the states lost their hues.** Green `ok` collided with guardsmen and steel-blue `info` with specialists,
and an amber `warn` could never be told from the engineers gold. A page with five fixed unit hues cannot afford
a hue per message type, so only destruction keeps one; the rest are carried by a glyph, a tonal step and the
wording. Colour is still never the only signal — it is now rarely a signal at all outside the army.

### Group colours

One hue per group, three parts each: `soft` is the tile ground (the group's hue mixed 18 % into the card
surface — tinted iron, not a coloured block), `strong` the tile ink and the summary-line marker, `edge` the
tile frame and the left edge of a result row. The five `strong` inks sit in one narrow lightness band, so no
group shouts louder than another; `edge` now carries the same value as `strong`, since an ink that clears
4.5:1 clears the 3:1 a boundary owes.

| Group | Light `soft` / `strong` = `edge` | Dark `soft` / `strong` = `edge` |
|---|---|---|
| Guardsmen (green) | `#d4e1d7` / `#256b35` | `#304337` / `#84ce93` |
| Specialists (blue) | `#d4dde6` / `#25568a` | `#313f48` / `#8fbcee` |
| Engineers (amber) | `#e1ddd1` / `#6f5417` | `#413e31` / `#ddb86e` |
| Monsters (violet) | `#ddd8e6` / `#5b368a` | `#3b3a47` / `#c0a0ec` |
| Mercenaries (red) | `#e6d6d6` / `#8c3030` | `#433837` / `#ec9391` |

### Tier colours

The game paints a mercenary's tier, and players read a camp by tier before they read it by name
(design plan §7.2, amended 2026-09-13). So tiers get a **second, smaller colour system**: one ink
each, from the game's own tier palette, darkened until it clears 4.5:1 as ink on the surfaces it
appears on **and** on its own 12 % wash, which is the ground of a tier badge.

| Tier | Light | Dark | The game's word for it |
|---|---|---|---|
| V (`--color-tier-5`) | `#71530f` | `#d7b25a` | gold |
| VI (`--color-tier-6`) | `#8e2f2f` | `#ea9490` | crimson |
| VII (`--color-tier-7`) | `#5c3a8e` | `#c7a3ee` | violet |
| VIII (`--color-tier-8`) | `#1b625c` | `#7fd3cb` | teal |
| IX (`--color-tier-9`) | `#645831` | `#eedca4` | white-gold |

The tables carry tiers 5, 6, 7 and 9 today; VIII is defined so a tier-VIII mercenary arrives with a
colour rather than with a hole. A tier ink is allowed on exactly two things: the **tier badge**
(`src/ui/domain/TierBadge.tsx` — the roman numeral in Fraunces on a 12 % wash of its own ink) and
the **heading over a tier** in the mercenary picker. Everywhere else the unit's colour is its
group's, so the two systems never fight: the tile stays mercenary red, the badge beside it says
which tier.

### Checked, not guessed

`pnpm contrast` (`scripts/contrast-check.ts`) parses `src/index.css`, resolves both themes and fails the build
on any pair below its floor. 230 pairs, all passing:

| Rule | What it covers | Lowest light | Lowest dark |
|---|---|---|---|
| **4.5:1** (1.4.3) | `fg`, `muted`, every tone, every group `strong` and every tier ink on `bg`, `surface`, `raised`, `sunken` and on its own `*-soft`; every `*-fg` on its filled tone; every tier ink on its own 12 % badge wash over `surface` and `raised` | **4.60** | **4.60** |
| **3:1** (1.4.11) | `field` and `accent-line` on the four surfaces; every group `edge` on `surface` and on its own `soft` | **3.25** | **3.34** |

`line` is the one token deliberately below 3:1: it draws the hairline between the sheet's sections and nothing
a finger ever lands on, so the checker prints it for information and never fails on it.

Rules:

- **Colour identifies a unit, never a state.** A tile has a glyph, a roman tier and a code beside its group
  colour; a warning has the triangle *and* the ember ink; an on-state has a rule *and* a tonal step.
- **One primary per view.** The filled metal means "this is the thing to press" (Generate, Share, Confirm).
- The mercenaries red and `danger` share a hue family on purpose, and are told apart by where they appear (a
  tile) and what sits next to them (a glyph).

## 2. Surfaces — which one, when

```
bg            the page
├ surface     the setup sheet: one continuous ground, its sections split by a hairline (no radius)
└ surface     the March card: the one radiused, elevated object on the page  (rounded-card, shadow-card)
  └ raised    a block inside it: a metric tile, a hover, the chosen row of a list
  └ sunken    a well: a read-only figure, a gauge track, a pasted link
  └ danger    the one state block that is still tinted
```

`Card` takes `tone`, `shape` and `elevation`. `shape="flat"` + `tone="none"` is a block of the setup sheet;
the default `card` shape plus `elevation="card"` is the answer. Never nest two `surface` cards — go one step in
(`raised`), or drop the ground and use spacing. Elevation has three steps and all of them are for things that
float or that the page is about: `shadow-card` (the March card), `shadow-pop` (a popover, a menu),
`shadow-modal` (a dialog or a sheet).

## 3. Type

Two bundled families, and their jobs are not the ones you would guess. **Inter** sets everything you read,
titles included, and every figure a player compares down a column (tabular). **Fraunces** sets *numerals only*
— the roman tier on a unit tile and the one hero figure the March pane opens with. Titling every card in a
display serif is what made the page read as an article rather than as an instrument, so it stopped.

| Role | Face | Token | Size |
|---|---|---|---|
| The hero figure (expected damage) | Fraunces 300, `opsz 144`, `SOFT 0`, `WONK 0` | `text-hero` + `.hero-face` | 48 px |
| Stack count, pool totals | Inter 600, tabular | `text-stat` / `text-xl` | 24 px |
| Card and dialog titles (`h1`–`h4`, `.title-face`) | Inter 600, −0.015 em | `text-lg` | 21 px |
| Body, control labels, unit names | Inter 400 | `text-base` | 16 px |
| Captions, helper lines, table heads | Inter 400/500 | `text-sm` = `text-xs` | 13 px |
| The roman tier on a tile | Fraunces 500, `opsz 144` | `.numeral-face` | 13 px (`sm`) / 16 px (`md`) / 21 px (`lg`) |
| Share links, ids | `--font-mono` | `text-xs` | 13 px |

The scale is the traditional one from *The Elements of Typographic Style* — 16 / 21 / 24 / 48 — over our own
13 px floor, which is an accessibility decision rather than Bringhurst's. **14 and 20 are gone**: `--text-sm`
is an alias of `--text-xs` so the class names in the components keep working while the step itself does not
exist. Measure ≤ 70 characters. `output`, `td` and `th` get tabular figures for free.

## 4. Spacing, radius, motion

- **Radius is decided by what a thing is**, never by looks: the setup sheet `0` (it is the page), the March
  card and every overlay `rounded-card` (12 px, M3 medium), buttons and fields `rounded-control` (8 px, M3
  small), badges and filter chips `rounded-chip` (8 px, M3's chip corner — the 999 px pill is retired), a unit
  tile `rounded-tile` (4 px: a frame, nearly square, like the game's own unit frames), a bottom sheet
  `rounded-sheet` (28 px), full round only on the avatar and the floating button.
- **Separation is a hairline and space, not a box.** Inside the setup sheet the sections are told apart by one
  full-bleed `line` and by their own padding (`p-4 sm:p-5`, so 32–40 px between two blocks of content). A
  border *and* a shadow *and* a tonal step on the same element is the thing this pass removed.
- **Density by purpose.** Data rows are compact with a pointer and 44 px on touch; anything you aim at keeps
  44 px everywhere (`.tap`, `controlHeight`). Spacing is Tailwind's scale on an 8 px rhythm, 4 px only inside a
  control.
- **Alignment.** Everything left-aligned; figures right-aligned in their column; nothing centred but the
  floating button's glyph. A figure's name is a caption *under* it only for the hero — everywhere else the
  label comes first, because those are read as a list.
- **Motion** is colour, border and one gauge width, 120 ms for a state and 200 ms for a sheet, and all of it is
  off under `prefers-reduced-motion`.
- **Focus** is one recipe everywhere: a 2 px accent ring with a 2 px page-coloured offset. Never removed.

## 5. Icons

`src/ui/icons/` — two bundled sets behind one export name each, `currentColor` only and sized in `em` so a
glyph matches the text beside it (D-16). **Lucide** (ISC) draws the interface: verbs, marks, section heads and
the housing pools, on a 24 grid with a 2 stroke and round caps. **Game Icons** (CC BY 3.0, through
`react-icons/gi`) draws the units: solid silhouettes, one per category, group and race, picked at 16 px on the
kit page because that is the size a badge and a tile give them. Both are credited in the About dialog, both
ship with the app — no icon font, no network request (ADR-0002).

`Icon.tsx` holds the whole contract: `LucideGlyph` and `GameGlyph` wrap a package drawing, `Glyph` is there for
anything we ever draw by hand. A section imports `ResetIcon`, never a package name, so swapping a drawing — or
a package — touches one line in `src/ui/icons/`.

- **Decorative by default.** A glyph renders `aria-hidden="true"`; it repeats the visible label, never replaces
  it. Pass `title` — and only then — when the glyph stands alone; it becomes `role="img"` with that name.
- **One meaning per glyph.** The gear always opens an editor, the chevron always folds a body, the claw always
  means monsters. Do not reuse a glyph for a second idea.
- **Never a glyph alone as a button** unless it goes through `IconButton`, which forces a `label`.

| Family | Names |
|---|---|
| Categories | `MeleeIcon` (sword) · `RangedIcon` (bow) · `MountedIcon` (horse head) · `FlyingIcon` (wing) |
| Groups | `GuardsmenIcon` (shield) · `SpecialistsIcon` (star) · `EngineersIcon` (catapult) · `MonstersIcon` (talons) |
| Races | `BeastIcon` (paw) · `ElementalIcon` (flame) · `DragonIcon` (head) · `GiantIcon` (fist) |
| Pools | `LeadershipIcon` (banner) · `AuthorityIcon` (coin) · `DominanceIcon` (crown) |
| Sections | `TroopsIcon` (people) · `MercenariesIcon` (purse) · `MethodIcon` (numbered list) · `BonusesIcon` (sparkle) · `EnemyIcon` · `HousingIcon` (tent) · `ResultsIcon` (chart) |
| Verbs | `GenerateIcon` · `GearIcon` · `PencilIcon` · `PlusIcon` · `MinusIcon` · `TrashIcon` · `CopyIcon` · `DuplicateIcon` · `ShareIcon` · `DownloadIcon` · `UploadIcon` · `SyncIcon` · `PinIcon` · `UnpinIcon` · `UndoIcon` · `ResetIcon` · `SortIcon` · `SearchIcon` |
| Marks | `CheckIcon` · `CloseIcon` · `InfoIcon` · `WarningIcon` · `ChevronUp/Down/Left/RightIcon` · `SunIcon` · `MoonIcon` |

**`UnitBadge`** (`src/ui/icons/badges.tsx`) — the category glyph and the tier numeral in the group's colour.
Engineers have no category, so the group glyph stands in. **`PoolBadge`** does the same for a housing pool
(`leadership` / `authority` / `dominance`), and is what sits inside each of the three capacity fields.

The unit *tile* (`src/ui/domain/UnitTile.tsx`) is the object the army is actually drawn with — group ground,
group frame, silhouette, roman tier and short code — and the badges are for the places too small for it.

## 6. Components and their props

Public names and existing props never change (tests and sections depend on them); these were **added**:

| Component | Added |
|---|---|
| `Button` | `size` gains `'lg'`; `iconRight?: ReactNode`; `fullWidth?: boolean` |
| `Card` | `tone` gains `'none'`; `shape?: 'card' \| 'flat'`; `elevation?: 'none' \| 'card'` |
| `Section` | `icon?: ReactNode` — the section glyph, in a chip left of the title |
| `Pill` | `badge?: ReactNode` — a `UnitBadge`/`PoolBadge` before the label (decorative) |
| `NumberInput` | the plain field (no step buttons, selects on focus); `NumberStepper` is the same control with `buttons` on |
| `IconButton` | `size?: 'sm' \| 'md'` |
| `HelpNote` | `icon?: ReactNode \| null` — override the tone's glyph, or `null` for none |
| `Hero` (new) | `actions?: ReactNode`, `className?: string` |

Where each one belongs: `Section` is the seven page cards and nothing else. `Card` is a block inside a
section. `Pill` is a thing you switch on and off. `Button` is a verb — `primary` for the one action of the
view, `secondary` by default, `ghost` in a dense toolbar, `danger` when something is destroyed. `HelpNote` is
one or two sentences; anything longer goes in the section's `help` popover. `Tooltip` may only repeat what is
written somewhere else — touch devices never see it.

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
tone or by *one* hairline — never a border plus a shadow plus a tint. The page has exactly one accent, it is a
metal, and it means "you can act on this". The setup is a page; the answer is an object. A card is quiet so
that a number can be loud, and the number that is allowed to be loud is the expected damage.

**Where the boldness is spent.** The kill-order column in the March pane: the stacks in the order they fall,
each with a bar as long as the damage it deals measured against the loudest stack of the march, under one 48 px
figure in the display face. Nothing else on the page gets an ornament. (The bar is damage and not health on
purpose: the sizer gives every stack the same HP ceiling, so a column of HP bars would be identical bars.)

**Three rules a reviewer can check without an opinion:**

1. **A control has a border or a fill, never both.** A filled button draws no outline; an outlined button has a
   transparent or `surface` ground. The one exception is a focus ring, which is drawn outside the box.
2. **One radius per level, chosen by what the thing is** (§4). A radius is never picked for looks.
3. **8 px rhythm, and no arbitrary values.** Padding, gaps and offsets are multiples of 8 px (Tailwind's `2`,
   `3`, `4`, `6`, `8`), with 4 px (`1`) allowed only *inside* a control. Anything else belongs in
   `src/index.css` as a token, and `pnpm lint` fails on arbitrary class values.

**Two rules about controls that came out of the owner's review (2026-09-13):**

4. **A step button exists only for a short ordered list** — a tier, a captain's star level, a dozen values at
   most. Every other number is a `NumberInput`: a plain field that selects its whole value on focus, so the
   next keystroke replaces it, while the arrow keys, the `Shift`/`Ctrl` jumps and locale parsing all remain.
   Nobody walks a capacity to 84,300 one press at a time.
5. **No meta strings joined by middle dots, and no label that exists only to sit above a control.** Facts
   become cells with space between them, a caption under a figure, or a chip. The app bar carries the answer as
   labelled cells; a phone gets the expected damage and the hits landed, and only the tiles are dropped.
