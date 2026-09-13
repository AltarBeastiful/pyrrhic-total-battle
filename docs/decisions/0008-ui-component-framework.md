# ADR-0008 — UI component framework: Mantine 9

Status: **Accepted** (owner, 2026-09-13). Supersedes the "route B" recommendation of `docs/plans/ui-foundation.md`
§3 (owned kit on React Aria Components + Tailwind), which was built and rejected on execution.

## Context

Two full design passes on a hand-styled kit (React Aria primitives styled from prose by parallel workers)
were rejected by the owner: "a mismatch of CSS badly designed and executed — exactly what we were trying to
avoid when choosing the UI stack". The reference the owner wants copied in behaviour, arrangement and
relative size is TotalStack's form UI (investigation 0006). A time-boxed spike (investigation 0007)
rebuilt its three forms on Mantine 9: every element mapped to a stock component, 42 lines of custom CSS,
screenshots that read as a finished product; frictions were theming (ramps vs role tokens, a filled-button
contrast bug with a near-white accent), +65–86 kB brotli on first load, and a few axe findings from misuse.

## Options considered

1. Keep React Aria + Tailwind, seed a designed copy-in kit (Intent UI) and restyle. No bundle growth; the
   look still depends on our own stitching, which is what failed twice.
2. **Mantine 9 as the component system**, Tailwind removed, our tokens expressed as a Mantine theme.
3. Fix only the captain picker on the current kit.

## Decision

Mantine 9 (`@mantine/core`, `@mantine/hooks`) is the component system. Consequences and rules:

- `src/ui/kit` stays the boundary for **controls** (thin composites over Mantine with our defaults);
  sections and the shell may use Mantine's layout and typography components directly (`Stack`, `Group`,
  `SimpleGrid`, `Grid`, `Container`, `Text`, `Title`, `Divider`, `ScrollArea`). `src/ui/layout` is retired.
- Tailwind, `tailwind-variants`, `tailwind-merge`, `react-aria-components` and their lint rules go once the
  last importer is migrated. Styling is Mantine props, the theme, and CSS modules for the few composites; no
  utility class strings.
- The theme (`src/ui/theme.ts`) is the source of truth for colour: 10-step ramps generated from the design
  hues (`docs/design.md` records the seed hues and the generated ramps); dark/light through Mantine's colour
  scheme, synced with the app's `data-theme`.
- The accent is a **hue**, not a metal: a restrained brass/gold from the game's trim, so Mantine's filled
  buttons and `autoContrast` work as designed. Group colours and tier colours keep their meaning.
- Budgets: first load ≤ 340 kB brotli (was 260), on-demand ≤ 90 kB, CSS ≤ 40 kB; per-component CSS imports if
  the full stylesheet proves too heavy.
- Accessibility floor unchanged (axe zero violations on the kit page); Mantine components are used as
  documented (a `Popover.Target` wraps a button, never a `Pill`).
- Every form copies its TotalStack counterpart's arrangement, sizes and behaviour (investigation 0006 is the
  model for observation notes) in our theme.
