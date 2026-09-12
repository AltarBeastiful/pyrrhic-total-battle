# 0007 — Mantine 9 spike: the three TotalStack forms, rebuilt (2026-09-13)

Time-boxed spike. The troops row, the mercenary pills and picker, and the captain chips from
`0006-totalstack-captain-picker.md` were rebuilt on `@mantine/core` 9.6.1 alone, mounted dev-only at
`#spike` (`src/spike/**`, lazily imported from `src/main.tsx`; the app's own paths untouched).
Screenshots in `0007-mantine-spike/`. **Verdict: do not move. Stay on React Aria + Tailwind (a).**

## What mapped 1:1

| TotalStack element | Mantine | Fit |
|---|---|---|
| from/to tier selects | `NativeSelect size="xs"` | exact |
| "Include at G4:" glyph toggles | `Chip.Group multiple` + `Chip` | tick hidden by hand |
| selected mercenaries | `Pill.Group` / `Pill withRemoveButton` | exact |
| "Hire mercenary…" + search + tier groups | `Combobox` + `.Search` / `.Group` / `.Option` | exact; grouping free |
| role/category icon filters | `ActionIcon.Group` | exact |
| cap editor under the pill | `Popover` + `NumberInput hideControls` + `Switch` | exact |
| 30 captain chips, cap 3 | `Chip.Group multiple`, refuse when `> 3` | exact |
| gear on the chip corner | `Indicator label={<ActionIcon/>}` | exact — best find |
| level editor | `Popover` + `NumberInput` + `Select` | exact |
| sticky bar | `Affix` + `NumberInput thousandSeparator` | exact |
| theme switch | `useMantineColorScheme` | exact |

Nothing had to be hand-built. **42 lines of custom CSS** (9 rules, 24 declarations,
`src/spike/spike.css`): group marker, chip density to TotalStack's 32 px, transparent `Indicator`
ground, the "level set" dot, Fraunces numerals, dropdown scroll, sticky-bar inset, one contrast fix.

## Theming friction

Tokens went in through `createTheme` + `cssVariablesResolver` (9 Mantine variables → our `--pyr-*`),
which re-skins everything at once. Three frictions:

1. **Our palette is role-shaped, Mantine's is a ramp.** Each group owns `soft`/`strong`/`edge` per
   theme; Mantine wants 10 lightness steps and picks one. Every ramp in `theme.ts` is *derived* by
   interpolation, so `docs/design.md` stops being the source of truth.
2. **The accent is a metal, not a hue** — near-white in dark. Mantine's filled `Button` put a white
   label on it: **1.34:1**. `theme.autoContrast` computed `--mantine-primary-color-contrast: #000`
   correctly, but neither it, nor the per-component `autoContrast` prop, nor the `styles` API changed
   the label: Mantine writes `--button-color: var(--mantine-color-white)` as an **inline style**, so
   no stylesheet reaches it. Fixed only with an inline `style={{ color }}`.
3. Two sources of truth for the theme: `data-theme` (ours) and `data-mantine-color-scheme`.

## Accessibility (axe, both themes)

Out of the box **5 violations / 102 nodes**, including `aria-allowed-attr` **critical, 23 nodes** —
`Popover.Target` stamps `aria-expanded` onto whatever you give it, invalid on the `<span>` a `Pill`
renders. `withRoles={false}` clears it, but then nothing announces the expanded state; a correct
trigger must be a real `<button>`. After repairs (landmark, heading order, contrast, `withRoles`):
**1 violation / 4 nodes, moderate** — `Affix` portals the sticky bar outside `<main>`. 33 passes, no
console errors, no horizontal scroll at 390 px. The captain cap behaves (4th click refused, counter
stays `3/3`, live region speaks). `Chip` hides the real checkbox, so tests click the label.

## Bundle (brotli)

| | before | after |
|---|---|---|
| App first load JS | **256.9 kB** (index 119.9 + data 137.1) | **254.0 kB** (index 242.9 + troops 11.1) |
| App CSS | 8.6 kB | 8.6 kB (identical) |

Behind a lazy import Mantine costs the app **nothing** (−2.9 kB is rolldown re-chunking). The spike
page on demand: **86.4 kB** (JS 58.1 + CSS 28.2). **Mantine core + hooks + `styles.css` alone**
(provider, one `Button`, `useDisclosure`): **41.4 kB** — JS 13.4, CSS 28.0. `styles.css` is
all-or-nothing; the 204 per-component files cut the CSS for the set used to **9.9 kB**. A wholesale
move is roughly **+86 kB on a 257 kB first load (+34 %)**, or ~+65 kB with per-component CSS —
against a 260 kB budget that would have to be rewritten.

## Verdict

Mantine 9.6.1 supports **React 19.3 and Vite 8 cleanly**: peer range `^19.2.0`, zero install
warnings, zero runtime warnings, `tsc` strict clean (two casts for `exactOptionalPropertyTypes`).

Still the wrong move. The forms build fast, but the two things that decide it went against Mantine:
our accent is a metal and our colour is role-shaped, and Mantine fought both — the one primary action
shipped at 1.34:1 and could only be fixed inline. That is the library owning the look, which is what
D-19 exists to prevent. Migration cost is not the blocker (29 files import `@/ui/kit`, 11
`@/ui/domain`; 25 components, 3 013 lines — the barrel contains the blast radius), but we would trade
an owned kit for a themed library we must fight, +65–86 kB, and a rewrite of 17 UI test files.

Keep React Aria + Tailwind and seed a designed kit (Intent UI copy-in). Worth stealing: `Indicator`
for the corner gear, `Combobox.Group` for tier grouping, `Pill.Group`.

## Note found on the way

`development` HEAD does not build: 852e515 deleted `mercenaries/uiPrefs.ts` while
`MercenariesSection.tsx` still imports it, and `ui/domain/index.ts` exports a `TierBadge` never
committed. Both patched in this worktree only, to get a baseline.
