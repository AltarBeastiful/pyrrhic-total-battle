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

Two palettes, one set of names. Light is warm bone and parchment with ink-brown text; dark is deep slate-ink
with a warm bone text. The accent is **bronze** in light, **amber** in dark — the same hue family, so the app
reads the same in both. A second, **cool blue** accent exists for information only.

Light is the base (`:root`); dark comes from `[data-theme="dark"]` and from `prefers-color-scheme` when the
player has not chosen (the theme select writes the attribute).

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#f8f3e9` | `#0d1019` | The page. Carries a barely-there two-wash gradient (`--pyr-texture`). |
| `surface` | `#fffdf9` | `#161b25` | Cards, sections, dialogs, popovers: anything that holds content. |
| `raised` | `#f1eadd` | `#222732` | A block *inside* a card: a metric tile, a drawer header, a hover state. |
| `sunken` | `#eae2d2` | `#0b0e16` | A well: a read-only figure, the share-link textarea. |
| `fg` | `#281e16` | `#f0ece5` | Body text. 14.7:1 / 16.2:1 on `bg`. |
| `muted` | `#63574d` | `#a7acb8` | Labels, hints, secondary lines. 6.3:1 / 8.4:1 on `bg` — still body-text legal. |
| `line` | `#dcd4c7` | `#303541` | **Decoration only**: card edges, dividers. Never the boundary of a control. |
| `field` | `#8f8274` | `#6e7583` | The border of anything you can type in or press. 3.4:1 / 4.1:1 on `bg` (WCAG 1.4.11). |
| `accent` | `#8e5017` | `#eaad5e` | Actions: primary buttons, the on-state, focus rings, links. |
| `accent-fg` | `#fffdfa` | `#181008` | Text on a filled accent. 6.3:1 / 9.6:1. |
| `accent-soft` | `#f8e2ca` | `#432c12` | The on-state background of a chip, the section icon chip. |
| `accent-line` | — | — | A soft bronze hairline: the ring on an open section, a hover border. |
| `info` | `#136292` | `#72bbe5` | Information, never action: the dashed line in the hero, help marks. |
| `info-soft` | `#d4e9fa` | `#173142` | Background of an informational block. |
| `ok` | `#1d6e42` | `#76cc95` | Saved, within budget, nothing to fix. |
| `warn` | `#846400` | `#e4be5b` | Worked, but look at it: ties, unused capacity, unsaved changes. |
| `danger` | `#b32926` | `#f67972` | Destructive, or over capacity. |
| `*-soft` | see CSS | see CSS | The matching tinted surface for `ok` / `warn` / `danger` / `info`. |
| `group-guardsmen` | `#215d96` | `#76b0eb` | Unit-group identity. |
| `group-specialist` | `#714290` | `#c79de6` | ″ |
| `group-engineers` | `#006a61` | `#6dc3b8` | ″ |
| `group-monster` | `#9d343b` | `#f28788` | ″ |

**Checked, not guessed.** Every text token clears **4.5:1** on `bg`, `surface`, `raised` and on every soft
surface, in both themes; every UI token (`field` and the semantic colours used as a border or a mark) clears
**3:1** on the three base surfaces; `accent-fg` on `accent` and `danger-fg` on `danger` clear 4.5:1. The four
group hues clear 4.5:1 too, so a group colour may carry text as well as a ring. `line` is deliberately below
3:1 — it is never load-bearing.

Rules:

- **Colour is never the only signal.** An on-state chip has a tick *and* an accent border; a warning has a
  glyph *and* a tone; a unit badge has a glyph *and* a numeral beside its group colour.
- **One primary per view.** The bronze fill means "this is the thing to press" (Generate, Share, Confirm).
- **`info` never means "press me".** It marks something the app is telling you.
- Group hues identify a unit, never a state.

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
