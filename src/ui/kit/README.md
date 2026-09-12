# `src/ui/kit` — the component kit (contract)

Owned, styled components over **React Aria Components** (RAC) 1.21, styled with **Tailwind v4** tokens through
**tailwind-variants** (`tv()`). Plan: `docs/plans/ui-foundation.md` §4. This file is the contract every worker
and every section codes against; change it before changing a component's public API.

## Rules (lint enforces 1–4)

1. `react-aria-components` is imported **only** inside `src/ui/kit/**`.
2. Looks are declared with `tv()` slots and variants in the component file; no ternaries that build class
   strings. Compose class names with `cn()` from `./cn` (which is `twMerge`), never string concatenation.
3. Tokens only: no hex, no arbitrary values (`[#…]`, `[13px]`) outside `src/index.css`.
4. Sections (`src/ui/sections/**`, `src/ui/shell/**`) do not style: they compose kit, layout and domain
   components and may only use these utilities: `hidden sr-only w-full min-w-0 truncate` and their `sm:`/`lg:`
   variants.
5. Every kit component has a **story** (below) and a unit test that exercises keyboard behaviour by role.
6. Accessible names are the API: a component with no visible text **requires** a `label` prop (type-level).

## Files

```
src/ui/kit/<Name>.tsx          one component per file, named export, props interface `<Name>Props` exported
src/ui/kit/<Name>.test.tsx     // @vitest-environment jsdom
src/ui/kit/index.ts            re-exports everything public (each worker appends its own lines; keep sorted)
src/ui/kit/cn.ts               export const cn = twMerge (from tailwind-merge)
src/ui/kitpage/stories/<Name>.story.tsx   default export of type KitStory (see below)
```

Story contract (`src/ui/kitpage/story.ts`, owned by the kit-page worker, shape fixed here):

```ts
export interface KitStory {
  name: string; // "Button", "NumberStepper"…
  group: 'kit' | 'layout' | 'domain' | 'shell';
  render: () => ReactNode; // every variant, size and state, in a Cluster; no app state
}
```

The kit page globs `src/ui/kitpage/stories/*.story.tsx` with `import.meta.glob` and renders each story twice
(light and dark) at the current width.

## Tokens (names; values live in `src/index.css`)

Colours (use as `bg-surface`, `text-muted`, `border-line`…): `bg surface raised sunken fg muted line field
accent accent-fg accent-soft accent-line info info-fg info-soft danger danger-fg danger-soft warn warn-fg
warn-soft ok ok-fg ok-soft`. **Group colours**, one per unit group and mercenaries, each with three parts:
`group-<g>-soft` (tile ground, the hue mixed 18 % into the card surface), `group-<g>-strong` (tile ink and
marker) and `group-<g>-edge` (row edge and tile frame; it now carries the same value as `strong`) for `<g>` in
`guardsmen specialists engineers monsters mercenaries`. The legacy single-value
`group-guardsmen / group-specialist / group-engineers / group-monster` names stay until the old sections die.

Radii, by what a thing _is_ (D-19): `rounded-card` (12 px, the March card and every overlay),
`rounded-control` (8 px, buttons and fields), `rounded-chip` (8 px, badges and filter chips — not a pill),
`rounded-tile` (4 px, a unit tile's frame), `rounded-sheet` (28 px, a bottom sheet). Shadows: `shadow-card
shadow-pop shadow-modal`, and only for what floats or for the answer. Type: Tailwind's `text-xs/sm/base/lg/xl`
= 13/13/16/21/24 px (overridden in `@theme`; `sm` is an alias of `xs`, 14 and 20 no longer exist), plus
`text-stat` (24 px) for counts and `text-hero` (48 px) for the one display figure. Fonts: `font-sans` for
everything you read, `font-display` for numerals only (`.numeral-face`, `.hero-face`), `font-mono` for ids.
Motion: `duration-fast` (120 ms) and `duration-sheet` (200 ms); anything animated is wrapped in
`motion-safe:`.

## Conventions for RAC styling

- Pass `className` as a string produced by `tv()`; when a state must be styled, use the plugin variants
  (`hover: focus-visible: pressed: selected: disabled: invalid: open: placement-*:`) provided by
  `tailwindcss-react-aria-components`, not render-prop functions.
- Focus ring everywhere: `focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`
  (the `ring` slot exported from `./styles.ts`, owned by the actions worker; other workers import it).
- Touch targets ≥ 44 px on phones: controls use `min-h-11 sm:min-h-9`.
- Overlays render in a portal; `Sheet` is bottom-anchored under `sm`, right-anchored from `sm`.
- Every component forwards `className` (merged with `cn`) and `ref` where RAC supports it.

## Public APIs (v1)

Actions and surfaces (worker A):

```ts
Button       { variant?: 'primary'|'secondary'|'quiet'|'danger'; size?: 'sm'|'md'|'lg'; icon?: ReactNode;
               iconRight?: ReactNode; fullWidth?: boolean; isPending?: boolean; children } + RAC ButtonProps
IconButton   { label: string; size?: 'sm'|'md'; variant?: 'quiet'|'secondary'; children: ReactNode(glyph) }
FloatingAction { label: string; state: 'ready'|'stale'|'running'|'blocked'; hint?: string; icon: ReactNode;
               onPress; showLabel?: boolean }   // fixed bottom-right, respects safe-area
Menu         { trigger: ReactNode; label: string; children: MenuSection|MenuItem…; placement? }
MenuSection  { title?: string; children }   MenuItem { id; icon?; description?; isDanger?; onAction?; children }
MenuSegment  { label; value; onChange; options: {value,label,icon?}[] }  // a segmented row inside a menu
Sheet        { trigger?: ReactNode; isOpen?; onOpenChange?; title: string; description?; children;
               footer?: ReactNode; size?: 'md'|'lg' }
Dialog       { trigger?; isOpen?; onOpenChange?; title; description?; children; footer?; size?: 'sm'|'md'|'lg';
               role?: 'dialog'|'alertdialog' }
Popover      { trigger: ReactNode; label?: string; children; placement? }
Tabs         { label: string; value; onChange; items: {value,label,content}[] }  // only the chosen panel mounts
Tooltip      { content: ReactNode; children: trigger element }  // repeats visible text only
Card         { tone?: 'surface'|'raised'|'sunken'|'accent'|'info'|'warn'|'danger'; padding?: 'none'|'sm'|'md';
               as?: 'div'|'section'|'article'; children }
Badge        { tone?: 'neutral'|'accent'|'info'|'ok'|'warn'|'danger'|Group; size?: 'sm'|'md'; children }
Banner       { tone: 'info'|'warn'|'danger'|'ok'; title?: string; children; actions?: ReactNode; onDismiss? }
Disclosure   { title: ReactNode; summary?: ReactNode; defaultExpanded?; isExpanded?; onExpandedChange?;
               children }   // the collapsed line keeps `summary` visible
```

Form controls (worker B):

```ts
Switch       { label: string; description?; isSelected; onChange; isDisabled? }
Checkbox     { label: string; isSelected; onChange; isIndeterminate?; isDisabled? }
Segmented    { label: string; value; onChange; options: {value,label,icon?}[]; size?: 'sm'|'md' }
ToggleGroup  { label: string; selectionMode: 'single'|'multiple'; value; onChange; children: ToggleItem…;
               orientation? }   ToggleItem { id; label: string(a11y name); children }
NumberStepper{ label: string; value: number|null; onChange(n|null); min?; max?; step?; bigStep?(Shift, default 10);
               hugeStep?(Ctrl/⌘, default 100); prefix?: ReactNode; suffix?: string; allowEmpty?; size?: 'sm'|'md';
               description?; errorMessage?; formatOptions? }   // RAC NumberField: arrows, wheel, locale parsing
TierStepper  { label: string; prefix: string ('G'|'S'|'E'|'M'); tiers: number[]; value: number|null;
               onChange(n|null); allowNone?; min?; max?; size? }   // value shown as "G3"; tap value → strip of tiers
Select       { label: string; value; onChange; options: {value,label,description?,icon?}[]; placeholder?;
               size?; description? }  // RAC Select; native <select> is gone
SearchField  { label: string; value; onChange; placeholder?; onClear? }
TextField    { label: string; value; onChange; description?; errorMessage?; type?; inputMode? }
```

Layout (worker C, `src/ui/layout/`): `Stack {gap?: 1|2|3|4|6; align?}`, `Cluster {gap?; align?; justify?;
wrap?}`, `Grid {cols: 1|2|3|4|{sm,lg}; gap?}`, `Split {start; end; ratio?: '5/7'|'1/1'; breakpoint?: 'lg'}` (two
independent scroll columns on desktop, stacked under the breakpoint), `Page {children}` (side gutters, bottom
padding for the floating button, max width). All accept `as?` and `className`.

Domain (`src/ui/domain/`): the components that know what a unit is. They follow every rule above, but
build on the kit rather than on React Aria — nothing here needs more than a button.

```ts
UnitGroup    'guardsmen'|'specialists'|'engineers'|'monsters'|'mercenaries'   // unitGroupOf(unit) decides
UnitTile     { unit: UnitDef; size: 'sm'|'md'|'lg'; state?: 'on'|'off'|'pinned'|'leftOut'; isSelected?;
               onPress?(); onLongPress?(); label?: string }
             // button with aria-pressed when onPress is given, else a span; name "Archer, tier 3, on".
             // Long press = 500 ms of pointer, cancelled on move, never from the keyboard.
GroupMarker  { group: UnitGroup; label?: string }        // 10×16 bar in the group's edge colour
SummaryLine  { parts: { group?: UnitGroup; text: string; muted? }[]; trailing?: ReactNode }
PoolField    { pool: 'leadership'|'authority'|'dominance'; used: number; total: number }  // + role="meter"
DeltaText    { value; previous?; format(n): string; betterWhen: 'higher'|'lower' }  // "12 480 (+4 %)"
StatBar      { label: string; base: number; boosted: number; format(n): string }    // two meters, one scale
MarchRow     { unit: UnitDef; count: number; hits?; lost?; reviveSilver?; position?; fallsLast?;
               onCopy?(count); children? }   // a <tr>; the count is a button that copies it
MarchTable   { caption?: string; children }  // the <table>, its header row and the horizontal scroller
```

`unitGroup.ts` also exports `GROUP_LABEL` and the colour maps `GROUP_TONE` (the three utilities),
`GROUP_INK`, `GROUP_EDGE_BG` and `GROUP_EDGE_LEFT`, each written out literally and shaped to drop
straight into a `tv()` variant.

## Testing

Unit tests: Testing Library, `userEvent`, queries by role and label only. Each control proves: name, keyboard
(arrows for steppers and groups, `Esc` for overlays, focus return to the trigger), disabled, and the visible
value after a change. Overlays: assert on `role="dialog"` / `role="menu"`, never on portals or classes.
