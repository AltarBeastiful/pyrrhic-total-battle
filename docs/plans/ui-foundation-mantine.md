# Pyrrhic — UI on Mantine 9: migration plan and kit contract

Status: **accepted 2026-09-13** (ADR-0008). Replaces the React Aria kit. Reference pieces: the spike
(`docs/investigations/0007-mantine-spike.md`, theme and page kept as `docs/reference/mantine-spike-*.txt`),
the TotalStack observation notes (`docs/investigations/0006-totalstack-captain-picker.md`), the design
direction (`docs/design.md`: hues, fonts, one-sheet setup with an elevated March, roman numerals).

## 1. Principles

1. **Stock components, used as documented.** A form is a composition of Mantine components; custom CSS is
   the exception and lives in a CSS module next to the composite that needs it (the spike needed 42 lines
   for three forms — that is the budget scale).
2. **Copy the reference.** Each form mimics its TotalStack counterpart in arrangement, relative size and
   behaviour; an observation note precedes any form that has not been observed yet.
3. **The theme is the design.** Colour, radius, spacing, fonts and component defaults live in
   `src/ui/theme.ts` (`createTheme` + `cssVariablesResolver`); no utility classes, no arbitrary values.
4. **Small styling problems are solved with emoji glyphs and text colour** (owner): game concepts are drawn
   with Unicode emoji exactly as TotalStack does (⚔️ 🏹 🐴 🦅 …) through one `Glyph` component, and meaning
   may be carried by coloured text through theme colours (`c="tier6.5"`, `c="guardsmen.6"`), with the
   contrast floor checked. Both are first-class tools, not workarounds; no icon assets to license.
5. **Accessibility floor unchanged**: axe zero violations on the kit page and the four frames; roles and
   names as before; tests select by role and label.

## 2. Theme (`src/ui/theme.ts`)

- `colors`: `brass` (accent, 10 steps from a restrained gold seed `#c9a24a`; primary), `guardsmen`,
  `specialists`, `engineers`, `monsters`, `mercenaries` (10-step ramps from the design hues), `tier` (one
  ramp is not enough — tiers are five distinct hues: register `tier5…tier9` ramps) and the neutral scale
  (`slate`: dark surfaces Slate/Forge/Anvil and light Limewash/Paper/Stone as the extremes). `primaryColor:
  'brass'`, `primaryShade: { light: 7, dark: 5 }`, `autoContrast: true`.
- `fontFamily` Inter Variable; `headings` Inter 600; a `numeral` style (Fraunces) exposed as a `Text`
  variant for roman tiers and the hero figure.
- `defaultRadius: 'sm'` (8 px); `radius.xs` 4 for tiles/badges; `md` 12 for the March card and overlays.
- Component defaults via `theme.components`: `Button` (size sm, `autoContrast`), `NumberInput` (`hideControls`,
  `thousandSeparator: ' '`, select-all on focus via a shared `onFocus`), `NativeSelect` (size xs), `Chip`
  (size sm, `variant: 'light'`), `Pill` (size md), `Popover` (`shadow: 'md'`, `withArrow: false`), `Modal`
  and `Drawer` (radius md), `Card` (`withBorder: false`, `padding: 'md'`, `radius: 'md'` only on the March).
- Colour scheme: `MantineProvider` with a manager that reads and writes the app's `data-theme` (System /
  Light / Dark stays in the account menu).
- `cssVariablesResolver`: the few app-level variables (page background, hairline, app-bar height).
- `docs/design.md` §1 becomes: seed hues per role plus the generated ramps table (a script prints them).

## 3. Kit contract (`src/ui/kit`, composites only)

Sections and the shell import layout and typography from `@mantine/core` directly; controls come from the
kit. Everything below is a thin wrapper with our defaults; props are Mantine's unless stated.

| Composite | Built from | Notes |
|---|---|---|
| `TierSelect` | `NativeSelect size="xs"` | `{ label, prefix: 'G'|'S'|'E'|'M', tiers, value, onChange, allowNone }`; "—" for none; `from` clamped by `to` |
| `NumberField` | `NumberInput hideControls` | thousands separator, select-all on focus, `allowEmpty`, optional left glyph |
| `ChoiceList` | `Radio.Group` + `Radio.Card` | full-row items with title + description + optional trailing node (method, objective) |
| `SwitchRow` | `Switch` with `labelPosition="left"` | full-width row, description under the label |
| `Sheet` | `Drawer` (bottom on < sm, right ≥ sm) | title, size, `onClose` returns focus |
| `Dialog` | `Modal` | + `role="alertdialog"` variant |
| `AppMenu` | `Menu` | sections, danger items, a segmented row (theme) |
| `CornerGear` | `Indicator` + `ActionIcon` | the gear badge on a chip's top-right (spike's best find) |
| `ChipRow` | `Chip.Group` + `Group` | wrapping row of chips, `max` selection with refusal |
| `PillRow` | `Pill.Group` + `Pill withRemoveButton` | selected mercenaries |
| `GroupedCombobox` | `Combobox` + `.Search` + `.Group` | tier-grouped list, keeps open after a pick |
| `GenerateFab` | `Affix` + `Button` | below `lg`; states ready/stale/running/blocked |
| `AppBar` | `AppShell.Header`-free sticky `Paper` | see design plan §5.1 |
| `Disclosure` | `Collapse` + `UnstyledButton` header | keeps summary visible |

Domain (`src/ui/domain`, on Mantine): `UnitTile` (`Paper` + `Image`/glyph + numeral `Text`), `GroupMarker`,
`TierBadge` (`Badge` in the tier colour), `CaptainChip` (`Chip` + `CornerGear` + level dot), `MarchRow`
(`Table.Tr`), `PoolGauge` (`Progress`), `DeltaText`, `StatBar`.

## 4. Migration (strangler, one section per story, all on `development`)

| # | Story | Accept when |
|---|---|---|
| M-01 | Provider, theme, colour-scheme sync, PostCSS, `@mantine/core/styles.css` (full; per-component later if needed), global CSS for page background and fonts; Tailwind and the RAC lint rules removed from the build (kept only where legacy files still import them, behind a lint allow-list) | app boots on Mantine with the old sections still rendering; kit page rebuilt on Mantine listing the composites; axe clean |
| M-02 | Kit composites (§3) + domain on Mantine, with tests and kit-page stories | all composites on the kit page in both schemes at 1280 and 390 |
| M-03 | Shell: AppBar, account menu, GenerateFab, one-page layout with the March as a sticky supporting pane (`Grid` + `position: sticky`) | frame acceptance from the design plan |
| M-04 | Troops (one line per group like TotalStack, TierSelects + include-at chips with glyph/PNG) | D-22 |
| M-05 | Mercenaries (PillRow + GroupedCombobox + cap popover, tier colours) | D-23 |
| M-06 | Bonuses (TotalStack-style chips for captains, artifacts, permanent, titles; rows for equipment/other; level popover with live bonus) | D-30, D-34 |
| M-07 | Battle (SegmentedControl, NumberFields, ChoiceLists, SwitchRows, order sheet) | D-31 |
| M-08 | March (recap, tiles, counts table with copy and edit mode, trade-off, folded details, unit sheet) | D-40…D-43 |
| M-09 | Retire React Aria, Tailwind, tailwind-variants/merge, the old kit/layout/domain and their lint rules; budgets 340/90/40 kB; `docs/design.md` rewritten for the theme | `pnpm size` green; no `react-aria-components`/`tailwind` in the tree |
| M-10 | Glyphs: Unicode emoji as TotalStack uses them (⚔️ 🏹 🐴 🦅 🛡️ 🗡️ ⚙️ 💀 🏰 👹 🐾 🔥 🐉 🗿 🔒 🎯 ⏳ 🪙 🏵️ 💰 👑 ∞ 📌 ⚠️) through one `Glyph` component with accessible names; Lucide only for interface chrome; no icon assets, no licence to carry; platform emoji font (an OFL emoji subset can be bundled later if rendering differs too much across devices) | every game concept has one glyph; `react-icons` removed |

Order: M-01 → M-02 → (M-03, M-04, M-05, M-06, M-07, M-08 in parallel, disjoint folders) → M-09 → M-10 as
soon as assets are chosen (can run alongside M-04…M-08).

## 5. Comparison with an external Mantine assessment of TotalStack's UI (2026-09-13)

The owner shared an independent write-up of how TotalStack's page maps onto Mantine. Component by component
against this plan, with our decision where we deliberately differ:

| TotalStack element (external mapping) | This plan | Decision |
|---|---|---|
| Top pill nav with dropdowns → `Menubar` | no navigation: one destination, an account `Menu` in the app bar | keep ours (nothing to navigate) |
| Trial banner → `Alert` | `Banner` = `Alert` | same |
| Method cards → `Radio.Card` + `Badge` tags | `ChoiceList` = `Radio.Group` + `Radio.Card`, full-card target, corner radio | same; no NEW/POPULAR marketing tags |
| By Source / By Report → `SegmentedControl` | `SegmentedControl` for enemy, recovery plan, theme | same |
| Captain/artifact/title toggles → `Chip.Group multiple` + `Indicator` | `ChipRow` + `CornerGear` (= `Indicator` + `ActionIcon`) | same; chips 32 px like TotalStack, sub-label node for titles |
| Collapses → `Accordion` | `Disclosure` (`Collapse`) for a single fold with a visible summary; `Accordion` for groups | both allowed |
| Totals readouts → `DataList` (9.4+) | `Figures` composite on `DataList` for TOTAL and the March recap | adopted |
| Bottom bar → fixed `Paper` + `NumberInput size="lg"` + `Select` + gradient `Button` | **our own decision stands**: a sticky *top* app bar carrying the answer (figures + troop recap) and the account menu; Generate reachable everywhere (app bar from `lg`, extended FAB below); housing inputs live in the Battle card | keep ours; open option D-36: mirror the current housing values in the app bar with a tap-to-edit popover, since housing changes every fight (J1) |
| Floating chat → `Affix` | `GenerateFab` = `Affix` + `Button` | same mechanism, different purpose |
| Per-type colours → theme colours + type augmentation | `guardsmen`… ramps, `mantine.d.ts` augmentation | same |

Costs the assessment names, and our answers: **palette** — custom `slate` scale + `cssVariablesResolver`
(done in M-01, our hues, not TotalStack's navy); **density** — a deliberate global pass in the theme
(`defaultProps` sizes, compressed spacing, 32 px chips), not per component; **glow** — deliberately not
ported (our direction is hairlines and tonal steps; no gradients, no ambient light).

Risks it raises, and what we do: **`Chip.Group` re-render cost** with ~80 chips on a phone — `ChipRow`
memoizes each chip and keeps selection outside the group, with a render-count test; **progressive
disclosure as the differentiator** — Bonuses opens on the TOTAL line only, captains are the visible grid,
and groups with nothing configured collapse to one "Add …" line (story D-35); **open source hygiene** —
we mirror generic patterns only; palette, wording, logo and copy are ours (design direction, glossary).
