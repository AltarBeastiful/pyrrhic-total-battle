# Pyrrhic — design system

One page, seven sections, a lot of numbers. The look has to survive that: warm enough not to feel like a
spreadsheet, quiet enough that the figures stay readable, and legible at 360 px in both themes.

Everything here is implemented in `src/index.css` (tokens), `src/ui/icons/**` (glyphs and badges),
`src/ui/Hero.tsx` (the header illustration) and `src/ui/primitives/**` (components). Sections never invent a
colour, a radius or a shadow: they use these tokens and these components.

Constraints that shaped it: **no third-party font and no CDN** (ADR-0002) — the display face is a system serif;
**no new dependency** (ADR-0003) — every glyph and the illustration are inline SVG we drew; **nothing leaves the
browser** — no icon fetch, no web font request, no analytics pixel.

---

## 1. Palette

Two layers, one set of names (`docs/plans/design-overhaul.md` §6.1). A **neutral base** carries almost
everything: a near-black blue-grey in dark, warm bone and paper in light. **Group colours** identify units and
nothing else. The bronze/amber **accent** survives only as the action colour — the same hue family in both
themes, used ten times less than before. A steel **blue** informs, and never acts.

Light is the base (`:root`); dark comes from `[data-theme="dark"]` and from `prefers-color-scheme` when the
player has not chosen (the theme select writes the attribute). Both dark blocks are identical by construction —
`pnpm contrast` fails if they drift.

### Neutral base, accent and states

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#f6f4ef` | `#101319` | The page. Carries a barely-there two-wash gradient (`--pyr-texture`). |
| `surface` | `#ffffff` | `#181c24` | Cards, sheets, dialogs, popovers: anything that holds content. |
| `raised` | `#eeebe4` | `#20252f` | A block *inside* a card: a metric tile, a header strip, a hover state. |
| `sunken` | `#e9e5db` | `#0a0d12` | A well: a read-only figure, the share-link textarea. |
| `fg` | `#1c1a17` | `#e9e6df` | Body text. 13.8:1 / 12.3:1 at worst. |
| `muted` | `#5f5b55` | `#a7a49c` | Labels, hints, secondary lines. 5.4:1 / 6.2:1 — still body-text legal. |
| `line` | `#ddd8ce` | `#2b303a` | **Decoration only**: card edges, dividers. Never the boundary of a control. |
| `field` | `#857f76` | `#6b7484` | The border and well of anything you can type in or press. ≥ 3:1 (WCAG 1.4.11). |
| `accent` | `#8e5017` | `#d9963c` | Actions: primary buttons, the on-state, focus rings, links. |
| `accent-fg` | `#fff8f0` | `#17120a` | Text on a filled accent. 6.0:1 / 7.4:1. |
| `accent-soft` | `#f6e3cc` | `#3a2a12` | The on-state background of a chip, an active tile. |
| `accent-line` | `#ab7238` | `#9c7440` | A bronze hairline: the ring on an open card, a hover border. ≥ 3:1. |
| `info` | `#14608f` | `#74bde4` | Information, never action: help marks, "this is what we computed". |
| `info-fg` / `info-soft` | `#ffffff` / `#dfeaf7` | `#0a1319` / `#132a38` | Ink on a filled info; an informational block. |
| `ok` | `#1c6b40` | `#6fcf97` | Saved, within budget, nothing to fix. |
| `ok-fg` / `ok-soft` | `#ffffff` / `#d9efe2` | `#071a0f` / `#14301f` | ″ |
| `warn` | `#a24409` | `#f0a468` | Worked, but look at it: ties, unused capacity, unsaved changes. |
| `warn-fg` / `warn-soft` | `#fff8f3` / `#fbe1d1` | `#1a1109` / `#3c2415` | ″ |
| `danger` | `#ae2a20` | `#f2857c` | Destructive, or over capacity. |
| `danger-fg` / `danger-soft` | `#fff7f6` / `#f9dedb` | `#1f0a08` / `#3a1a17` | ″ |

`warn` is a **red-shifted amber** (hue ≈ 22° light, 27° dark), deliberately away from the engineers amber
(≈ 38°/40°), and it always carries the triangle glyph: the two can never be confused at a glance.

### Group colours

One hue per group, three parts each: `soft` is the tile background, `strong` the tile ink and the summary-line
marker, `edge` the 2 px bar on a tile and the left edge of a result row.

| Group | Light `soft` / `strong` / `edge` | Dark `soft` / `strong` / `edge` |
|---|---|---|
| Guardsmen (green) | `#dff3df` / `#1f6b2e` / `#0b8024` | `#173321` / `#7fd48f` / `#63e585` |
| Specialists (blue) | `#dde9f7` / `#1f4f8a` / `#0d4d9c` | `#172436` / `#7fb2f0` / `#78b4ff` |
| Engineers (amber) | `#f8ecd0` / `#7a5410` / `#8a5a0a` | `#352a14` / `#e6b85c` / `#f1bc51` |
| Monsters (violet) | `#ebe0f5` / `#5b2f8a` / `#5a0eab` | `#2a1e38` / `#c39af0` / `#c394f6` |
| Mercenaries (red) | `#f8dede` / `#8a2424` / `#a10d0d` | `#38191b` / `#f08a8a` / `#f58585` |

The legacy single-value names `group-guardsmen`, `group-specialist`, `group-engineers`, `group-monster` are
aliases of the matching `strong` ink and live only until the last old section is replaced.

### Checked, not guessed

`pnpm contrast` (`scripts/contrast-check.ts`) parses `src/index.css`, resolves both themes and fails the build
on any pair below its floor. 170 pairs, all passing:

| Rule | What it covers | Lowest light | Lowest dark |
|---|---|---|---|
| **4.5:1** (1.4.3) | `fg`, `muted`, every tone and every group `strong` on `bg`, `surface`, `raised`, `sunken` and on its own `*-soft`; every `*-fg` on its filled tone | **4.96** (`warn` on `sunken`) | **5.51** (`accent` on `accent-soft`) |
| **3:1** (1.4.11) | `field` and `accent-line` on the four surfaces; every group `edge` on `surface` and on its own `soft` | **3.15** (`field` on `sunken`) | **3.26** (`field` on `raised`) |

`line` is the one token deliberately below 3:1 (1.13 light / 1.16 dark): it draws card edges and dividers, never
the boundary of a control, so the checker prints it for information and never fails on it. Controls use `field`.

Rules:

- **Colour is never the only signal.** A unit tile has a glyph, a tier numeral and a code beside its group
  colour; a warning has the triangle glyph *and* the tone; an on-state has a tick *and* an accent border.
- **One primary per view.** The bronze fill means "this is the thing to press" (Generate, Share, Confirm).
- **`info` never means "press me".** It marks something the app is telling you.
- Group hues identify a unit, never a state — the mercenaries red and `danger` share a hue family on purpose,
  and are told apart by where they appear (a tile) and what sits next to them (a glyph).

## 2. Surfaces — which one, when

```
bg          the page
└ surface   section card, dialog, popover, the profile bar      (border-line, shadow-card)
  └ raised  a block inside it: metric tile, header strip, hover (border-line)
  └ sunken  a well: read-only output, a pasted link             (border-line)
  └ accent  an on/selected block: the chosen method, an active chip (border-accent-line)
  └ warn / danger / info   a state block: a warning note, a blocked action
```

`Card` takes them as `tone`. Never nest two `surface` cards — go one step in (`raised`), or drop the border
and use spacing. Elevation has exactly three steps: `shadow-card` (a card on the page), `shadow-pop` (a
popover, a tooltip, a select menu), `shadow-modal` (a dialog or a drawer).

## 3. Type

| Role | Face | Size |
|---|---|---|
| H1 (the app name) | `--font-display` (`ui-serif` / Georgia) | `text-3xl` → `sm:text-4xl` |
| Section title (H2), dialog and drawer titles | display | `text-lg` |
| Block titles (H3, H4) | display (set on the element in `@layer base`) | `text-sm` semibold |
| Body, labels, controls | `--font-sans` (`ui-sans-serif`, system-ui) | `text-sm`; `text-xs` for hints |
| Figures | sans, **tabular** | `.nums`, or `tabular-nums` |
| Share links, ids | `--font-mono` | `text-xs` |

The serif is what stops the page reading like a form: it belongs to titles and to the app name, never to a
label, a value or a button. Every number a player compares down a column (counts, costs, percentages,
durations) is tabular — `.nums` on the element, and `output`/`td`/`th` get it for free.

## 4. Spacing, radius, motion

- Spacing is Tailwind's scale. A section card pads `p-3` on a phone, `sm:p-4` from 640 px. Stacked blocks sit
  `space-y-3` apart, related rows `gap-2`.
- Radius: `rounded-card` (0.875 rem) for anything card-shaped — sections, dialogs, popovers, select menus;
  `rounded-lg` for controls; `rounded-chip` for chips and badges.
- Touch: every control keeps a 44 px row on a phone (`.tap`), 36 px from `sm`. A small control inside a tall
  row uses `.tap-area` to grow its hit box without growing its box.
- Motion is colour and border only, and all of it is switched off under `prefers-reduced-motion`.
- Focus is one recipe, everywhere: a 2 px accent ring with a 2 px page-coloured offset. Never remove it.

## 5. Icons

`src/ui/icons/` — 50 glyphs, hand-drawn on a 24 grid, 1.75 stroke, round caps and joins, `currentColor`, sized
in `em` so a glyph matches the text beside it.

- **Decorative by default.** A glyph renders `aria-hidden="true"`; it repeats the visible label, never replaces
  it. Pass `title` — and only then — when the glyph stands alone; it becomes `role="img"` with that name.
- **One meaning per glyph.** The gear always opens an editor, the chevron always folds a body, the claw always
  means monsters. Do not reuse a glyph for a second idea.
- **Never a glyph alone as a button** unless it goes through `IconButton`, which forces a `label`.

| Family | Names |
|---|---|
| Categories | `MeleeIcon` (sword) · `RangedIcon` (bow) · `MountedIcon` (horse head) · `FlyingIcon` (wing) |
| Groups | `GuardsmenIcon` (shield) · `SpecialistsIcon` (star) · `EngineersIcon` (catapult) · `MonstersIcon` (claw) |
| Races | `BeastIcon` (paw) · `ElementalIcon` (droplet) · `DragonIcon` (head) · `GiantIcon` (fist) |
| Pools | `LeadershipIcon` (banner) · `AuthorityIcon` (coin) · `DominanceIcon` (crown) |
| Sections | `TroopsIcon` · `MercenariesIcon` · `MethodIcon` (ladder) · `BonusesIcon` (sparkle) · `EnemyIcon` · `HousingIcon` (tent) · `ResultsIcon` (chart) |
| Verbs | `GenerateIcon` · `GearIcon` · `PencilIcon` · `PlusIcon` · `MinusIcon` · `TrashIcon` · `CopyIcon` · `DuplicateIcon` · `ShareIcon` · `DownloadIcon` · `UploadIcon` · `SyncIcon` · `PinIcon` · `UnpinIcon` · `UndoIcon` · `ResetIcon` · `SortIcon` · `SearchIcon` |
| Marks | `CheckIcon` · `CloseIcon` · `InfoIcon` · `WarningIcon` · `ChevronUp/Down/Left/RightIcon` · `SunIcon` · `MoonIcon` |

**`UnitBadge`** — the category glyph, the tier numeral and the group's colour on the ring:

```tsx
<UnitBadge group="guardsmen" category="ranged" tier={3} size="sm" />   // decorative
<UnitBadge group="monster" category="flying" tier={5} title="Flying monster, tier 5" />
```

Engineers have no category, so the group glyph stands in. **`PoolBadge`** does the same for a housing pool
(`leadership` / `authority` / `dominance`), with an optional written label.

The hero illustration (`src/ui/Hero.tsx`) is the one drawing in the app: eight stacks whose tops form a level
line — the flat HP profile — facing the epic monster they were sized against. Decorative, themed by the
tokens, 84 px tall on a phone.

## 6. Components and their props

Public names and existing props never change (tests and sections depend on them); these were **added**:

| Component | Added |
|---|---|
| `Button` | `size` gains `'lg'`; `iconRight?: ReactNode`; `fullWidth?: boolean` |
| `Card` | `tone?: 'surface' \| 'raised' \| 'sunken' \| 'accent' \| 'info' \| 'warn' \| 'danger'`; `elevated?: boolean` |
| `Section` | `icon?: ReactNode` — the section glyph, in a chip left of the title |
| `Pill` | `badge?: ReactNode` — a `UnitBadge`/`PoolBadge` before the label (decorative) |
| `NumberField` | `prefix?: ReactNode` — a glyph inside the field |
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
| `recovery.*` | **Recovery** — Silver · Gold · Dragon coins · Time |
| `damagePerSilver` / `PerGold` / `PerDragonCoin` | **Value per silver** / **per gold** / **per dragon coin** |
| `damageByPool` | Damage by pool — Troops · Mercenaries · Monsters |

The battle journal keeps in-game phrasing, line for line, so a player can hold it next to the real report.

### The unit popover

Three headed blocks, in this order:

1. **This march** — count · total HP · one hit · of which from strength-against · target squad · chance of a
   double hit.
2. **Unit** — tier · category · group · race · base HP · base strength · housing cost.
3. **After the battle** — retrain (silver and time) · revive (gold).

### Elsewhere

- A bonus source is a **chip**: "Switch a source on for this march, or open its gear to edit what it is worth."
- Housing pools are **Leadership / Authority / Dominance** (the game's own words), and what they pay for:
  troops / mercenaries / monsters.
- Say **"stack"** for a unit type in a march, **"march"** for one battle setup, **"profile"** for one account.
- Errors say what to do: "Enter a leadership capacity above 0", not "Invalid input".
