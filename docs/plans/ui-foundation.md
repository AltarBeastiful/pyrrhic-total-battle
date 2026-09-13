# Pyrrhic — UI technical foundation plan

Status: **route B built 2026-09-12/13 and rejected by the owner on execution; route C (Mantine 9) accepted 2026-09-13 after spike 0007 — see ADR-0008.** §3's recommendation is superseded; §4–§8 below describe the React Aria kit as built and are kept as history. The Mantine migration is specified in `docs/plans/ui-foundation-mantine.md`. Companion to `docs/plans/design-overhaul.md`; this plan decides *how*
the overhaul is built so that it is fast to build, cheap to change, and does not end as another 12 000 lines
of hand-tuned class strings. It ends with a proposed ADR-0008.

## 1. Where we are (measured 2026-09-12)

| Fact | Value |
|---|---|
| UI code | 80 `.tsx` files, 12 017 lines under `src/ui` |
| Primitives | 15 files, 1 435 lines, hand-rolled on 5 Radix packages (dialog, popover, select, tabs, tooltip) |
| Variant system | none: `cn()` is a six-line join; variants are `Record<string, string>` maps; no `cva`, `clsx` or `tailwind-merge` |
| Class strings | 588 `className=`; 108 quoted class strings with ≥ 8 utilities; 5 with ≥ 12 |
| Repeated idioms | `text-muted text-xs` ×47, `shrink-0` ×45, `flex items-center gap-*` ×24, `flex flex-wrap` ×26, `grid grid-cols` ×15 |
| Largest files | MercenariesSection 601, ResultsSection 477, SyncDialog 375, SavedStacks 362, TroopsSection 336, OtherBlock 334, ProfileBar 323, StackPills 297 |
| CSS | `src/index.css` 310 lines: 203 of tokens, 51 base, 42 utilities (5 classes). Built CSS 50 kB, **10 kB gzip** |
| JS bundle | **234 kB gzip** main chunk (785 kB raw), no code splitting; Vite warns above 500 kB |
| Form controls | 19 native `<select>`, 1 Radix Select, 20 `NumberField` (`type="text"`, no arrow keys, `step` inert) |
| Icons | 54 components, 732 lines |
| Tests | 17 UI unit test files + 3 e2e specs; 212 `getByRole`, 45 `getByLabelText`, zero test ids |

Reading: **the CSS is not the problem** (10 kB gzip is small). The problem is the layer above it: there is no
component vocabulary between "Tailwind utility" and "section", so every section lays out its own rows, chips,
grids and summaries with raw utilities, and any design change means touching 80 files. Behaviour is the second
gap: Radix gives us five overlays and nothing for numbers, menus, sliders, toggle groups, row selection or drag
and drop, so those were built by hand (or not at all — no arrow keys anywhere). The third gap is that there is
no place to *see* the components outside the app, so visual regressions are found by the owner.

The test suite is the asset to protect: role-and-label selection means a component swap underneath keeps most
tests valid.

## 2. What the design plan needs from the foundation

From `design-overhaul.md`, the interactions that decide the framework:

| Need | Where |
|---|---|
| Numeric stepper with arrow keys, wheel, `Shift`/`Ctrl` multipliers, formatted paste | pools, counts, levels, owned mercenaries (D-32) |
| Tier stepper / toggle group with roving focus | Troops rows (D-21) |
| Menu with sections, inline confirmation, segmented theme row | account menu (D-10) |
| Sheet (bottom on phone, side on desktop) with focus trap and return | unit sheet, editors (D-42, D-30) |
| Selectable rows with whole-row hit area, keyboard selection | mercenaries (D-23) |
| Segmented control | enemy formation, theme (D-31) |
| Drag-to-reorder list, keyboard accessible | Your own order (existing, restyled) |
| Tooltip, popover, dialog, tabs | as today |
| Toolbar with roving tabindex | result actions |
| Table with sticky header and numeric columns | March table (D-40) |
| Theming by CSS variables, light/dark, group colours | everywhere |
| A page that renders every component in every state | visual regression and owner review |

## 3. Options

Four realistic routes. "Cost" is the estimated effort to reach the Phase A frame with the new primitives in
place; "look" is how hard it is to make it ours rather than the library's.

### A. Keep Tailwind + Radix, add a variant layer and layout primitives

Add `tailwind-variants` (or `cva` + `tailwind-merge`), a `Stack/Cluster/Grid/Split` set, and rewrite the
primitives with variants. Add Radix Dropdown Menu, Toggle Group, Slider, Toolbar; write NumberField behaviour by
hand (keyboard, wheel, formatting, ~250 lines with tests). Keep dnd-kit.

- Cost: medium. Look: fully ours. Bundle: roughly unchanged (+ 3 Radix packages).
- Risk: Radix primitives have been in maintenance mode since 2024; the team's successor is Base UI. Number
  input, row selection and drag and drop remain ours to build and keep accessible.

### B. React Aria Components + Tailwind v4 + tailwind-variants, seeded from an open component kit ★

`react-aria-components` 1.21 (Adobe, MIT) ships unstyled, accessible components with the exact behaviours in
§2 built in: `NumberField` (steppers, arrows, wheel, locale-aware parsing of "84 300" and "84,300"),
`ToggleButtonGroup`, `Menu` with sections, `Modal`/`Dialog`/`Popover`/`Tooltip`, `GridList`/`ListBox` with
selection and **built-in drag and drop**, `Table`, `Tabs`, `Switch`, `Slider`, `Toolbar`, `Disclosure`. Styling
is render-prop and data-attribute based, which maps directly on Tailwind (`data-[selected]:bg-…` via the
`tailwindcss-react-aria-components` plugin). Two MIT kits offer copy-in, pre-styled Tailwind v4 components on
top of it (Intent UI, JollyUI); we copy what we need into `src/ui/kit`, own the code, and restyle to our tokens.

- Cost: low to medium for the frame (kit components exist), low for each later component. Look: ours, since the
  styling is our Tailwind classes in files we own.
- Bundle: to measure in the spike (T-00). Expectation: +70–110 kB gzip for the set we use, −35 kB Radix,
  −15 kB dnd-kit; net +20–60 kB against the 234 kB today. Acceptable only if code splitting (T-06) lands with it;
  budget in §6.
- Risk: one more mental model (render props, `className` as a function) for whoever contributes; a heavier
  library than Radix for pure overlays. Mitigated by the kit layer: sections never touch RAC directly.

### C. Mantine 9 as the component framework, Tailwind for layout only

`@mantine/core` 9.6 gives everything in §2 pre-built and styled (NumberInput, SegmentedControl, Menu, Drawer,
Affix for the floating button, RangeSlider, Combobox, Table, Accordion, ColorSwatch) with theming through a
theme object and CSS variables. Tailwind would stay for spacing and grid, with Mantine's own preflight
coexistence rules.

- Cost: lowest to a working screen. Look: recognisably Mantine unless we override most components; two
  styling systems (Mantine CSS modules and Tailwind) with documented but real conflicts (preflight, `@layer`
  order). Bundle: +80–120 kB gzip. The Tailwind v4 token work (`@theme`) would be largely redone as a Mantine
  theme.
- Risk: fighting the framework for the game-like look; contributors need Mantine's API; a large dependency for
  a small app.

### D. Base UI 1.0 (Radix's successor) + Tailwind + variant layer

`@base-ui-components/react` is at 1.0.0-rc: NumberField, Menu, Toggle Group, Slider, Dialog, Popover, Tooltip,
Tabs, Select, Combobox, headless like Radix, from the MUI/Radix authors; shadcn/ui offers a Base UI flavour.
No row-selection list, no table behaviour, no drag and drop (keep dnd-kit).

- Cost: medium (kit components exist in shadcn's Base UI flavour). Look: ours. Bundle: similar to today.
- Risk: release candidate today; fewer behaviours than B (no GridList/DnD); we would still hand-build row
  selection and keep dnd-kit.

### Recommendation

**B.** It is the only option that covers every behaviour in §2 without hand-building any of it, keeps the
Tailwind v4 tokens and the test suite, keeps the look ours, and replaces two libraries (Radix, dnd-kit) with
one. Its costs, bundle weight and a second API style, are bounded by a spike and by the rule that sections only
ever import from `src/ui/kit`. **A** is the fallback if the spike shows an unacceptable bundle or a poor fit; it
reuses the same kit structure with Radix underneath. **C** is the choice if the owner prefers batteries included
over a custom look; it is not recommended because the design plan's whole point is a look and density that no
generic framework ships. **D** waits for 1.0 stable.

## 4. Target architecture

```
src/ui/
  tokens.css            @theme: neutral base, group colours, semantic, type scale, radii, motion
  kit/                  owned, styled components over RAC — the only place RAC is imported
    Button, IconButton, FloatingAction, Menu, Sheet, Dialog, Popover, Tooltip, Tabs,
    Switch, Checkbox, Segmented, ToggleGroup, NumberStepper, TierStepper, Select, SearchField,
    Table, SelectableList, ReorderList, Toolbar, Disclosure, Card, Badge, Banner, EmptyState
  layout/               Stack, Cluster, Grid, Split (two-column), Page — the only layout utilities
  domain/               UnitTile, GroupMarker, PoolField, SummaryLine, StatBar, DeltaText, MarchRow
  shell/                TopBar, AccountMenu, GenerateFab, AppLayout
  sections/             Army (Troops, Mercenaries), Bonuses, Battle, March — compose kit + domain only
  icons/                as today; silhouettes redrawn bolder (design plan §6.2)
```

Rules, enforced by lint where possible:

1. **Sections do not style.** A section file may use only layout components and a short allow-list of
   utilities (`hidden`, `sr-only`, `w-full`, `min-w-0`, `truncate`, responsive `sm:`/`lg:` variants of those).
   Anything else is a kit or domain component. Lint: a custom ESLint rule flags `className` strings with more
   than four utilities outside `kit/`, `layout/`, `domain/`.
2. **Variants, not conditionals.** Every kit component declares its looks with `tailwind-variants` (`tv()`):
   `variant`, `size`, `tone`, and state slots; no inline ternaries building class strings.
3. **Tokens only.** No hex, no arbitrary values (`[#…]`, `[13px]`) outside `tokens.css`. Lint: Tailwind's
   arbitrary-value syntax is banned in `src/ui` except `tokens.css`.
4. **One import path.** `react-aria-components` may be imported only under `src/ui/kit`. Lint:
   `no-restricted-imports` elsewhere.
5. **Every kit component has a story** on the kit page (§5) with all variants and states, light and dark.
6. **Accessible names are the API.** Tests select by role and label; kit components require a label prop where
   the element has no visible text (as `IconButton` does today).

Theming: `tokens.css` keeps the `@theme` approach (it works and it is already tested); adds group colours as
`--color-group-{guardsmen,specialists,engineers,monsters,mercenaries}-{soft,strong,edge}` and semantic
`--color-{success,warning,danger,info}-{soft,strong}`. Dark values under `:root:not([data-theme="light"])`
media query and `[data-theme="dark"]`, as today.

## 5. The kit page and visual regression

A dev-only route (`/#kit`, excluded from the production bundle by a dynamic import guarded on `import.meta.env.DEV`
or built as a second Vite entry) renders every kit and domain component in every variant, size and state, in
light and dark side by side, plus the three page frames at 390, 768 and 1280 px. This is where the owner reviews
a phase before it reaches the app, and it is what Playwright screenshots:

- `pnpm test:visual` runs Playwright against the kit page at 390 and 1280 in both themes and compares with
  committed baselines (`toHaveScreenshot`, 0.2 % threshold). Baselines are updated deliberately in the same
  commit as a visual change.
- `axe-core` (via `@axe-core/playwright`) runs on the kit page and on the four app frames; zero violations is a
  CI gate.
- Contrast: a small script reads `tokens.css`, computes the contrast of every declared text/background pair
  and fails under 4.5:1 (3:1 for non-text pairs). Replaces the manual table in `docs/design.md`.

## 6. Performance budget and splitting

| Budget | Value | Gate |
|---|---|---|
| Main JS chunk | ≤ 200 kB gzip | `size-limit` in CI (fails the build) |
| Total JS on first load | ≤ 260 kB gzip | same |
| CSS | ≤ 20 kB gzip | same |
| Lighthouse (mobile, Pages build) | Performance ≥ 90, Accessibility 100 | weekly workflow, not a gate |

Code splitting to get there regardless of the library: Sync dialog and its crypto, Saved marches, Battle story
and HP chart, the custom-mercenary and kill-order sheets, About, all as `React.lazy` routes loaded on first open.
The worker stays separate as today.

## 7. Migration strategy

Strangler pattern, one section per story, the old and new coexisting behind the section registry:

1. Land tokens, kit, layout, shell (Phase A of the design plan) with the old sections still mounted inside the
   new frame. Old primitives keep working; nothing new imports them.
2. Rebuild sections in the design plan's order (Army, Bonuses, Battle, March). Each story deletes the old
   section files and their now-dead primitives.
3. When the last Radix import goes, remove the five Radix packages; when the kill-order list moves to the kit's
   `ReorderList`, remove dnd-kit.
4. `src/ui/primitives` disappears at the end of Phase D; `docs/design.md` is rewritten (D-53).

Tests: unit tests move with their section and keep their role/label queries; e2e helpers gain kit-aware helpers
(`stepper(name).set(n)`, `tile(code).toggle()`); no test ids.

## 8. Stories

| # | Story | Accept when |
|---|---|---|
| T-00 | **Spike (time-boxed, 1 day):** build the Troops row (tier stepper + tile grid), the account menu and the floating Generate on RAC in a branch; measure gzip delta with and without splitting; note DX friction. | Numbers and a one-page verdict in `docs/investigations/0004-ui-framework-spike.md`; owner picks B or A. |
| T-01 | `tokens.css` with the new neutral base, group and semantic colours, type scale, radii, motion; contrast script. | Contrast script passes; old app still renders. |
| T-02 | Dependencies: `react-aria-components`, `tailwind-variants`, `tailwindcss-react-aria-components`; lint rules 1–4; `size-limit`. | CI green with the rules on (allow-listed legacy paths until Phase D). |
| T-03 | Kit v1: Button, IconButton, FloatingAction, Menu, Sheet, Dialog, Popover, Tooltip, Switch, Segmented, ToggleGroup, NumberStepper, TierStepper, Select, Card, Badge, Banner, Disclosure; each with a story and a unit test. | Kit page shows all; axe zero violations; each has keyboard tests. |
| T-04 | Layout: Stack, Cluster, Grid, Split, Page; shell: TopBar, AccountMenu, GenerateFab, AppLayout. Old sections mounted inside. | Design D-10…D-12 acceptance; old tests pass. |
| T-05 | Kit page route, `test:visual`, axe in CI, baselines committed. | Two themes × two widths compared in CI. |
| T-06 | Code splitting of the lazy surfaces; `size-limit` budgets enforced. | Budgets in §6 met on the current app. |
| T-07 | Kit v2 for Phase B–D: SearchField, SelectableList (row selection), Table, Toolbar, ReorderList (RAC DnD), EmptyState, StatBar; domain UnitTile, GroupMarker, PoolField, SummaryLine, DeltaText, MarchRow. | Stories and tests as T-03; dnd-kit removable. |
| T-08 | Retire `src/ui/primitives` and Radix; remove allow-listed legacy paths from the lint rules. | No Radix in the lockfile; lint rules global. |
| T-09 | ADR-0008 accepted and `docs/design.md` rewritten. | README table updated. |

Order: T-00 → (T-01, T-02) → T-03 → T-04 → T-05 → T-06, then T-07 alongside the design plan's Phases B–D, T-08
and T-09 at the end.

## 9. Proposed ADR-0008 (to be written after T-00)

**Title:** UI foundation: owned component kit on React Aria Components, Tailwind v4 tokens, tailwind-variants.
**Context:** §1 of this plan. **Options:** §3. **Decision:** B, with the six rules in §4 and the budgets in §6.
**Consequences:** one behaviour library instead of Radix + dnd-kit + hand-rolled number input; sections become
composition only; a kit page and visual tests become the review surface; contributors learn `tv()` and RAC's
render props; bundle grows by the measured delta and is capped by `size-limit`.

## 10. Decisions to validate

- **T-a** Route B (React Aria Components) as the target, A as fallback, decided after the one-day spike. ★
- **T-b** Copy-in kit from Intent UI / JollyUI as the seed rather than writing every component from scratch. ★
- **T-c** Lint rules 1–4 as hard CI failures (with a legacy allow-list until Phase D). ★
- **T-d** Visual regression on the kit page only, not on the whole app (app screenshots churn with data). ★
- **T-e** Budgets: 200 kB main / 260 kB total gzip. Tighter or looser?
- **T-f** Keep `@theme` in CSS as the single token source (no JSON tokens, no Style Dictionary). ★
