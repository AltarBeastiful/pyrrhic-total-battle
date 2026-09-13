/**
 * The theme **is** the design (ADR-0008, `docs/plans/ui-foundation-mantine.md` §2). Colour, radius,
 * spacing, fonts and every component default live here; a section never invents one.
 *
 * Two things share this file on purpose. The first half is the app's own light/dark switch, which
 * predates Mantine: the stored preference is `system | light | dark`, resolved to a concrete value
 * and written to `data-theme` on `<html>`. The second half is the Mantine theme, plus a colour
 * scheme manager that *mirrors* that attribute — one source of truth, two attributes that agree
 * (`data-theme` and `data-mantine-color-scheme`), which is friction 3 of investigation 0007 closed.
 */
import {
  createTheme,
  defaultVariantColorsResolver,
  type CSSVariablesResolver,
  type MantineColorScheme,
  type MantineColorSchemeManager,
  type MantineColorsTuple,
  type MantineThemeOverride,
  type VariantColorsResolver,
} from '@mantine/core';

import type { Theme } from '@/state/schema';

import { COLORS, FILLED_SHADE, inkOn, PAPER, PITCH, SEEDS, SLATE, SURFACE } from './palette';
import classes from './theme.module.css';

// The palette is a module of its own so `pnpm contrast` can import it under plain Node; everything
// the app reads by name still comes from here.
export { contrastPairs, inkOn, ramp, SEEDS } from './palette';
export type { ContrastPair, PyrColorName } from './palette';

// ---- the app's own attribute -------------------------------------------------------------------

export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function media(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(DARK_QUERY);
}

export function systemTheme(): ResolvedTheme {
  return media()?.matches === true ? 'dark' : 'light';
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? systemTheme() : theme;
}

export function applyTheme(
  theme: Theme,
  root: HTMLElement | null = globalThis.document?.documentElement,
): void {
  if (!root) return;
  root.dataset.theme = resolveTheme(theme);
}

/**
 * Keep the document in sync while the OS preference changes. `currentTheme` is read on every event
 * so the subscription survives a preference change in the store.
 */
export function watchSystemTheme(currentTheme: () => Theme): () => void {
  const query = media();
  if (!query) return () => undefined;
  const listener = (): void => {
    if (currentTheme() === 'system') applyTheme('system');
  };
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}

// ---- the ramps, as Mantine wants them ----------------------------------------------------------

/** `palette.ts` returns plain arrays; Mantine wants its ten-tuple. Same ten strings either way. */
const tuple = (shades: readonly string[]): MantineColorsTuple => shades as unknown as MantineColorsTuple;

const RAMPS: Record<string, MantineColorsTuple> = Object.fromEntries(
  Object.entries(COLORS).map(([name, shades]) => [name, tuple(shades)]),
);

const INTER =
  "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const FRAUNCES = "'Fraunces Variable', ui-serif, Georgia, 'Iowan Old Style', 'Times New Roman', serif";

// ---- the theme ---------------------------------------------------------------------------------

/**
 * `filled` is the one variant Mantine decides the ink for in JavaScript, from the *light* scheme's
 * shade, which is how a near-white accent shipped white-on-white in the spike. Every filled theme
 * colour is pointed at the per-scheme ink this file computes instead; everything else is Mantine's.
 */
const variantColorResolver: VariantColorsResolver = (input) => {
  const resolved = defaultVariantColorsResolver(input);
  if (input.variant !== 'filled') return resolved;
  const [name, shade] = (input.color ?? input.theme.primaryColor).split('.');
  if (shade !== undefined || name === undefined || !(name in RAMPS)) return resolved;
  return { ...resolved, color: `var(--pyr-on-${name})` };
};

export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'brass',
  primaryShade: FILLED_SHADE,
  autoContrast: true,
  luminanceThreshold: 0.4,
  variantColorResolver,
  white: PAPER,
  black: PITCH,
  // Mantine's own `red` and `yellow` are what a stock `color=` reaches for, and neither clears
  // 4.5:1 on our sheets — its yellow alert label ships at 2.68:1. Both are pointed at a ramp of
  // ours, so a stray stock colour still lands somewhere `pnpm contrast` has checked.
  colors: { ...RAMPS, dark: tuple(SLATE), red: tuple(COLORS.danger), yellow: tuple(COLORS.brass) },

  fontFamily: INTER,
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  // Inter titles everything (D-19); Fraunces sets numerals only, through the `numeral` Text variant.
  // The sizes are the design's four text steps and nothing else — Mantine's own ramp walks through
  // 14, 18 and 20 px, which `docs/design.md` §3 does not have. `h2` is *the* section title: every
  // section renders `Title order={2}` with no size of its own (M-09 polish list).
  headings: {
    fontFamily: INTER,
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.5rem', lineHeight: '2rem' },
      h2: { fontSize: '1.3125rem', lineHeight: '1.75rem' },
      h3: { fontSize: '1rem', lineHeight: '1.5rem' },
      h4: { fontSize: '1rem', lineHeight: '1.5rem' },
      h5: { fontSize: '0.8125rem', lineHeight: '1.125rem' },
      h6: { fontSize: '0.8125rem', lineHeight: '1.125rem' },
    },
  },
  // The scale of `docs/design.md` §3: 13 label · 16 body · 21 title · 24 count.
  fontSizes: { xs: '0.8125rem', sm: '0.8125rem', md: '1rem', lg: '1.3125rem', xl: '1.5rem' },

  defaultRadius: 'sm',
  radius: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.75rem' },
  // Compressed on purpose (4 · 8 · 12 · 16 · 24): TotalStack fits a whole army on one screen and
  // Mantine's stock scale (10 · 12 · 16 · 20 · 32) would push the March below the fold.
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },

  cursorType: 'pointer',
  respectReducedMotion: true,

  components: {
    Text: {
      // Mantine has no "numerals" slot, so the one place Fraunces is allowed is a Text variant.
      classNames: (_theme: unknown, props: { variant?: string }) => ({
        root: props.variant === 'numeral' ? classes.numeral : undefined,
      }),
    },
    // --- density (plan §2; TotalStack's own sizes) -----------------------------------------
    Button: { defaultProps: { size: 'sm' } },
    TextInput: { defaultProps: { size: 'sm' } },
    Select: { defaultProps: { size: 'sm' } },
    NumberInput: {
      defaultProps: {
        size: 'sm',
        hideControls: true,
        thousandSeparator: ' ',
        // Every figure on this page is retyped from the game: landing in one selects the old value.
        // Measured in investigation 0011: it holds for a mouse press anywhere in the field and for
        // a keyboard focus, so the next keystroke replaces the figure (design rule 9).
        onFocus: (event: { currentTarget: HTMLInputElement }) => {
          event.currentTarget.select();
        },
        // …and the pool's glyph is decoration, not a control: without this it sits over the first
        // 34 px of a 200 px field and swallows the press that should land in the field
        // (investigation 0011).
        leftSectionPointerEvents: 'none' as const,
      },
    },
    NativeSelect: { defaultProps: { size: 'xs' } },
    // The avatar in the app bar is 32 px, and Mantine writes its initial at size ÷ 2.5 = 12.8 px.
    // Which profile you are in is information, so it sits on the 13 px floor like everything else.
    Avatar: { vars: () => ({ root: { '--avatar-placeholder-fz': 'var(--mantine-font-size-xs)' } }) },
    // `xs` is 18 px, below the 24 px target minimum Material asks for; `sm` is 26 px. The corner
    // gear asks for its own 18 px explicitly, because it is a badge on a chip, not a row control.
    ActionIcon: { defaultProps: { size: 'sm' } },
    Badge: {
      defaultProps: { size: 'xs' },
      // Mantine's badge sizes carry their own type ramp in hard pixels — `xs` is 9 px and `lg` is
      // the first step that clears 13. The badge stays `xs`-small (20 px tall, 6 px of side
      // padding) and its label is written at the design's floor instead (design rule 19;
      // investigation 0011 measured "15 STACKS" at 9 px and "3 on but empty" at 10 px).
      vars: () => ({
        root: {
          '--badge-fz': 'var(--mantine-font-size-xs)',
          '--badge-height': '1.25rem',
          '--badge-padding-x': '0.375rem',
        },
      }),
    },
    Chip: {
      defaultProps: { size: 'xs', variant: 'light', radius: 'sm' },
      // TotalStack's chip is 32 px tall with a 13 px label, which is neither Mantine's `xs` (22 px)
      // nor its `sm` (30 px, wider padding). The three variables are the documented way to say so.
      vars: () => ({
        root: {
          '--chip-size': '2rem',
          '--chip-fz': '0.8125rem',
          '--chip-padding': '0.625rem',
          '--chip-checked-padding': '0.375rem',
        },
      }),
      // …and the label grows past that height when a chip carries a second, dimmed line
      // ("HP +25 %" under a title, investigation 0006).
      classNames: { label: classes.chipLabel },
    },
    // The sentence under a switch row is the one that explains the option. Mantine derives its
    // size from the control's (`sm` − 2 px = 11 px here), which is under the design's floor, and it
    // writes that on the element itself, so the variable above cannot reach it (design rule 19;
    // investigation 0011 measured the Battle card's option sentences at 11 px).
    Switch: { styles: { description: { fontSize: 'var(--mantine-font-size-xs)' } } },
    Pill: { defaultProps: { size: 'md' } },
    Popover: { defaultProps: { shadow: 'md', withArrow: false } },
    Modal: { defaultProps: { radius: 'md' } },
    Drawer: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { withBorder: false, padding: 'md', radius: 'md' } },
    Paper: { defaultProps: { radius: 'sm' } },
    // Material's page margins: 16 px in a compact window, 24 px from medium (600 px) up. Mantine's
    // own `md` padding is 12 px in our compressed scale, which is a phone margin on a desktop. The
    // variable is switched by one media query in `global.css`, and a style prop rather than a class
    // so it wins over Mantine's own padding without a specificity fight; the app bar and the bottom
    // bar read the same variable, so the brand, the sections and Generate all start on one line.
    Container: { defaultProps: { px: 'var(--pyr-page-margin)' } },
  },
});

/**
 * Our surfaces reaching Mantine's own variables. Everything Mantine paints reads these nine, so
 * overriding them re-skins every component at once; the `--pyr-*` ones are what the app's own CSS
 * (the page ground, the hairline between sheet sections, the app bar's height) reads.
 */
export const cssVariablesResolver: CSSVariablesResolver = (mantineTheme) => {
  const ink = (scheme: 'light' | 'dark'): Record<string, string> =>
    Object.fromEntries(
      Object.keys(RAMPS).map((name) => [
        `--pyr-on-${name}`,
        inkOn(mantineTheme.colors[name]?.[FILLED_SHADE[scheme]] ?? SEEDS.brass),
      ]),
    );

  const surfaces = (scheme: 'light' | 'dark'): Record<string, string> => {
    const s = SURFACE[scheme];
    return {
      '--pyr-page': s.page,
      '--pyr-hairline': s.hairline,
      '--pyr-sunken': s.sunken,
      '--pyr-raised': s.raised,
      '--mantine-color-body': s.page,
      '--mantine-color-text': s.ink,
      '--mantine-color-dimmed': s.muted,
      '--mantine-color-default': s.sheet,
      '--mantine-color-default-hover': s.raised,
      '--mantine-color-default-border': s.field,
      '--mantine-color-default-color': s.ink,
      '--mantine-color-placeholder': s.muted,
      '--mantine-color-anchor': `var(--mantine-color-brass-${FILLED_SHADE[scheme]})`,
      // Mantine points its error ink at shade 6, which is a step too light to read on our sheets.
      '--mantine-color-error': `var(--mantine-color-danger-${FILLED_SHADE[scheme]})`,
      ...ink(scheme),
    };
  };

  return {
    variables: {
      '--pyr-appbar-height': '4rem',
      '--pyr-pane-width': '22.5rem',
      '--mantine-font-family-headings': INTER,
      '--pyr-font-numeral': FRAUNCES,
      // Mantine writes the sentence under a control two pixels below `sm`, which is 11 px in our
      // ramp — under the floor, and it is the sentence that explains the option (the Battle card's
      // switch rows). The design has one caption size and this is it (design rule 19).
      '--input-description-size': 'var(--mantine-font-size-xs)',
    },
    light: surfaces('light'),
    dark: surfaces('dark'),
  };
};

// ---- the two attributes, kept in step ------------------------------------------------------

const THEME_ATTRIBUTE = 'data-theme';

/**
 * Mantine's colour scheme, stored in the app's own `data-theme` attribute rather than in a second
 * place. Reading it is reading `<html>`; writing it writes `<html>`, which the app's CSS tokens and
 * `color-scheme` already follow; and a `MutationObserver` carries a change made by the account menu
 * (through `applyTheme`) back into Mantine. System / Light / Dark stays one setting in the store.
 */
export function documentColorSchemeManager(): MantineColorSchemeManager {
  let observer: MutationObserver | undefined;
  /** The value this manager and the document last agreed on: the guard against a feedback loop. */
  let settled: ResolvedTheme | undefined;

  const root = (): HTMLElement | null => globalThis.document?.documentElement ?? null;

  const current = (): ResolvedTheme | undefined => {
    const value = root()?.dataset.theme;
    return value === 'light' || value === 'dark' ? value : undefined;
  };

  return {
    get(defaultValue) {
      return current() ?? defaultValue;
    },
    set(value) {
      // Mantine subscribes with its own `setColorScheme`, and that function calls back into `set`.
      // Without this guard the observer below and that callback write the attribute to each other
      // for ever — one microtask apiece — and the page never comes back.
      const next = resolveTheme(value === 'auto' ? 'system' : value);
      if (current() === next) {
        settled = next;
        return;
      }
      settled = next;
      applyTheme(next);
    },
    subscribe(onUpdate) {
      const element = root();
      if (!element || typeof MutationObserver !== 'function') return;
      settled = current();
      observer = new MutationObserver(() => {
        const next = current();
        if (next === undefined || next === settled) return;
        settled = next;
        onUpdate(next satisfies MantineColorScheme);
      });
      observer.observe(element, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    },
    unsubscribe() {
      observer?.disconnect();
      observer = undefined;
    },
    clear() {
      settled = undefined;
      root()?.removeAttribute(THEME_ATTRIBUTE);
    },
  };
}
