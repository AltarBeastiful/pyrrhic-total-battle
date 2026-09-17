# The kit — the contract

`src/ui/kit` is the boundary for **controls**: thin composites over Mantine carrying our defaults.
It is not a component library. Mantine 9 is the component library (ADR-0008); this folder exists
only for the handful of shapes the library has no single component for, and for the props we always
want set the same way.

## The five rules

1. **Stock components, used as documented.** A form is a composition of `@mantine/core`. A composite
   here wraps Mantine and nothing else; there is no second implementation of a radio, a popover or a
   focus trap in this repository. When Mantine's own component already is the answer — `Button`,
   `Select`, `SegmentedControl`, `Accordion`, `Alert`, `Table` — a section imports it directly and
   the kit stays out of the way.

2. **The theme is the design.** Colour, radius, spacing, type and every component default live in
   `src/ui/theme.ts` (`createTheme` + `cssVariablesResolver`), whose palette is `src/ui/palette.ts`.
   A composite never hard-codes a colour, a radius or a spacing: it passes a theme token
   (`radius="md"`, `gap="sm"`, `c="dimmed"`, `color="guardsmen"`) or reads one of the app's own CSS
   variables (`--pyr-page`, `--pyr-sunken`, `--pyr-hairline`, `--pyr-appbar-height`,
   `--pyr-page-margin`, `--pyr-font-numeral`). `pnpm contrast` re-checks every pair the palette
   promises.

3. **Custom CSS is the exception, and it is a CSS module.** The few shapes Mantine has no prop for
   live in `kit.module.css` next to the composites that need them (and `domain.module.css`,
   `shell.module.css`, one per section folder). Utility class strings are gone with Tailwind and a
   lint rule refuses them: `className` may only ever carry a CSS-module value. The budget is the
   spike's — tens of lines, not hundreds.

4. **Sections compose, they do not style.** A section arranges Mantine's layout and typography
   (`Stack`, `Group`, `SimpleGrid`, `Grid`, `Container`, `Text`, `Title`, `Divider`) around kit and
   domain composites. It does not set its own heading size — every section is `Title order={2}` and
   the size comes from `headings.sizes.h2`.

5. **Accessibility is part of the component, not of the caller.** A composite ships the role, the
   name and the keyboard contract: a `Popover.Target` wraps a button and never a `Pill` or a `Chip`,
   a sheet returns focus to whatever opened it, a live region that has nothing to say collapses. The
   floor is axe zero violations on the kit page and on the app, in both schemes, at 390 and 1400.

## What is in here

| Composite         | Built from                                | What it is for                                                             |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `AppBar`          | sticky `Paper`                            | the top bar; brand, an optional middle, actions                            |
| `AppMenu`         | `Menu`                                    | sections, danger items, a segmented row (theme)                            |
| `ChipRow`         | `Chip.Group` + `Group`                    | a wrapping row of chips, `max` selection with a spoken refusal             |
| `ChoiceList`      | `Radio.Group` + `Radio.Card`              | one choice out of several, `layout="list"` rows or `layout="cards"`        |
| `CornerGear`      | `Indicator` + `ActionIcon` (+ `Popover`)  | the gear on a chip's top-right corner, and the editor it opens             |
| `ChipDot`         | one `span`                                | the dot a chip wears once something is recorded on it, in the gear's strip |
| `Dialog`          | `Modal`                                   | a modal question; `role="alertdialog"` for the ones you cannot dismiss     |
| `Disclosure`      | `Collapse` + `UnstyledButton`             | one fold that keeps its summary visible; `DisclosureGroup` for several     |
| `Figures`         | `DataList`                                | one figure style: a 12 px label over a 15/600 value, as rows or a grid     |
| `GenerateFab`     | `Affix` + `Button`                        | ready / stale / running / blocked, below `lg`                              |
| `GroupedCombobox` | `Combobox` + `.Search` + `.Group`         | a tier-grouped searchable list that stays open after a pick                |
| `NumberField`     | `NumberInput`                             | thousands separator, select-all on focus, optional leading glyph           |
| `PillRow`         | `Pill.Group` + `Pill withRemoveButton`    | what is already chosen (mercenaries)                                       |
| `Sections`        | one class on a `div`                      | a card's parts: one hairline, 16 px above and below (design.md §4)         |
| `Sheet`           | `Drawer` (bottom under `sm`, right above) | a side sheet; returns focus on close                                       |
| `SwitchRow`       | `Switch labelPosition="left"`             | a setting as a full row, sentence under the name                           |
| `TierSelect`      | `NativeSelect size="xs"`                  | one end of a tier range, "—" for none, clamped by its partner              |

`src/ui/domain` is the same contract for the components that know what a _unit_ is: `UnitTile`,
`GroupMarker`, `TierBadge`, `CaptainChip`, `MarchRow`/`MarchTable`, `PoolGauge`, `DeltaText`,
`StatBar`, and `Glyph` — the one way a game concept is drawn (Unicode emoji, `glyphs.ts` is the map).
Lucide is for interface chrome only: chevrons, close, copy, search, the gear.

## Working on it

Every composite has a test (`renderWithTheme` from `testRender.tsx`, which also stubs the three
browser APIs jsdom lacks) and a story in `src/ui/kitpage/stories/`, which is what `/#kit` renders,
`pnpm test:visual` screenshots and axe runs against. A new composite is not finished until both
exist.

```sh
pnpm vitest run src/ui/kit/ChoiceList.test.tsx   # one test file
pnpm dev                                         # then open /#kit
pnpm test:visual                                 # compare against the baselines
pnpm test:visual:update                          # re-baseline a deliberate change
```
