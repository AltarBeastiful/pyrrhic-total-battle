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

import classes from './theme.module.css';

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

// ---- colour, generated ---------------------------------------------------------------------

/**
 * Mantine wants ten steps per colour and we own one hue per role, so every ramp is *generated*: the
 * seed's hue and saturation are kept and the step is found by **relative luminance**, not by HSL
 * lightness. That distinction is the whole point. A green and a violet at the same HSL lightness are
 * nowhere near the same contrast, so a lightness ladder would ship a guardsmen ink at 3.5:1 and a
 * monsters ink at 8:1 — the opposite of `docs/design.md` §1 ("the five `strong` inks sit in one
 * narrow lightness band, so no group shouts louder than another"). Targeting luminance puts every
 * hue's shade 7 at the same distance from a light sheet and every hue's shade 5 at the same distance
 * from a dark one. Index 7 is the ink a light page reads (`primaryShade.light`), index 5 the ink a
 * dark page reads (`primaryShade.dark`); `docs/design.md` §1 records the seeds, `ramp` the rest.
 */
const LUMINANCE = [0.9, 0.8, 0.66, 0.52, 0.44, 0.36, 0.23, 0.1, 0.055, 0.03] as const;
/** Saturation eased off at the pale end, so shade 0 is a wash rather than a sweet. */
const SATURATION = [0.55, 0.62, 0.72, 0.82, 0.92, 1, 1, 1, 0.96, 0.9] as const;

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(rgb: readonly [number, number, number]): string {
  return `#${rgb
    .map((c) =>
      Math.round(Math.min(255, Math.max(0, c)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Hue in turns (0–1), saturation and lightness in 0–1. */
function rgbToHsl(rgb: readonly [number, number, number]): { h: number; s: number; l: number } {
  const [r, g, b] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h * 6) % 6;
  const table: readonly (readonly [number, number, number])[] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[sector] ?? table[0]!;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** WCAG 2.2 relative luminance of an `#rrggbb` colour. */
function luminance(hex: string): number {
  const channels = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * The lightness at which this hue and saturation reach `target` luminance. Luminance rises
 * monotonically with HSL lightness, so twenty bisections land within half a 0–255 step; a hue that
 * cannot reach the target (a saturated red asked for 0.9) converges on the closest it can.
 */
function lightnessFor(h: number, s: number, target: number): number {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 20; i += 1) {
    const mid = (low + high) / 2;
    if (luminance(rgbToHex(hslToRgb(h, s, mid))) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Ten shades from one seed, lightest first — Mantine's own order. Pure; tested in `theme.test.ts`. */
export function ramp(seedHex: string): MantineColorsTuple {
  const { h, s } = rgbToHsl(hexToRgb(seedHex));
  return LUMINANCE.map((target, index) => {
    const saturation = Math.min(1, s * (SATURATION[index] ?? 1));
    return rgbToHex(hslToRgb(h, saturation, lightnessFor(h, saturation, target)));
  }) as unknown as MantineColorsTuple;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = luminance(a) > luminance(b) ? [a, b] : [b, a];
  return (luminance(light) + 0.05) / (luminance(dark) + 0.05);
}

/**
 * Which of our two inks reads on a filled ground. Mantine's own `autoContrast` decides with a
 * luminance threshold *and* computes it from the light scheme's shade whichever scheme is showing
 * (friction 2 of investigation 0007: a filled button shipped at 1.34:1). Comparing the two ratios
 * per scheme is both correct and scheme-aware, and `variantColorResolver` below feeds it back in.
 */
export function inkOn(background: string): string {
  return contrastRatio(background, PITCH) >= contrastRatio(background, PAPER) ? PITCH : PAPER;
}

// ---- the seeds ---------------------------------------------------------------------------------

const PITCH = '#131917'; // the design's darkest ink
const PAPER = '#fafbfa'; // the design's lightest surface

/**
 * One seed per role (`docs/design.md` §1). The accent is a **hue** and not a metal (ADR-0008): a
 * restrained brass from the game's trim, so filled buttons and `autoContrast` work as designed.
 */
export const SEEDS = {
  brass: '#c9a24a',
  guardsmen: '#256b35',
  specialists: '#25568a',
  engineers: '#6f5417',
  monsters: '#5b368a',
  mercenaries: '#8c3030',
  // The one state that keeps a hue (docs/design.md §1). Registered as Mantine's `red` as well, so
  // a stock `color="red"` — a danger menu item, a pool over capacity — lands on our ramp and clears
  // 4.5:1 like everything else rather than on Mantine's own red, which does not.
  danger: '#a32c1f',
  tier5: '#71530f',
  tier6: '#8e2f2f',
  tier7: '#5c3a8e',
  tier8: '#1b625c',
  tier9: '#645831',
} as const;

export type PyrColorName = keyof typeof SEEDS | 'slate';

/**
 * The neutral scale, written out rather than generated: its extremes are the design's own surfaces
 * (Paper → the dark well) and the six named greys have to land on the indices Mantine paints with.
 * Registered as `dark` as well, because that is the scale Mantine's dark scheme reads.
 */
const SLATE = [
  PAPER, //     0  Paper      the light sheet, and dark-scheme text
  '#ecefec', // 1  Limewash   the light page
  '#dee3df', // 2  Stone      a light block
  '#9da7a3', // 3  Ash        the dark scheme's muted ink
  '#6e7873', // 4  the light scheme's field border
  '#343d3b', // 5  the dark scheme's raised control ground (an unchecked chip sits here): dark
  //                enough that a dimmed second line on it still clears 4.5:1
  '#2b3231', // 6  Anvil      a dark block
  '#1e2423', // 7  Forge      the dark sheet
  '#161a19', // 8  Slate      the dark page
  '#101413', // 9  the dark well
] as unknown as MantineColorsTuple;

const COLORS: Record<PyrColorName, MantineColorsTuple> = {
  brass: ramp(SEEDS.brass),
  guardsmen: ramp(SEEDS.guardsmen),
  specialists: ramp(SEEDS.specialists),
  engineers: ramp(SEEDS.engineers),
  monsters: ramp(SEEDS.monsters),
  mercenaries: ramp(SEEDS.mercenaries),
  tier5: ramp(SEEDS.tier5),
  tier6: ramp(SEEDS.tier6),
  tier7: ramp(SEEDS.tier7),
  tier8: ramp(SEEDS.tier8),
  tier9: ramp(SEEDS.tier9),
  danger: ramp(SEEDS.danger),
  slate: SLATE,
};

/** The shade each scheme fills with; `primaryShade` below says the same thing to Mantine. */
const FILLED_SHADE = { light: 7, dark: 5 } as const;

/** The app's surfaces, verbatim from `docs/design.md` §1. */
const SURFACE = {
  light: {
    page: '#ecefec',
    sheet: PAPER,
    raised: '#dee3df',
    sunken: '#d5dbd7',
    ink: PITCH,
    muted: '#515a56',
    hairline: '#cfd5d1',
    field: '#6e7873',
  },
  dark: {
    page: '#161a19',
    sheet: '#1e2423',
    raised: '#2b3231',
    sunken: '#101413',
    ink: '#e7ece9',
    muted: '#9da7a3',
    hairline: '#313938',
    field: '#78837f',
  },
} as const;

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
  if (shade !== undefined || name === undefined || !(name in COLORS)) return resolved;
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
  colors: { ...COLORS, dark: SLATE, red: COLORS.danger },

  fontFamily: INTER,
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  // Inter titles everything (D-19); Fraunces sets numerals only, through the `numeral` Text variant.
  headings: { fontFamily: INTER, fontWeight: '600' },
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
        onFocus: (event: { currentTarget: HTMLInputElement }) => {
          event.currentTarget.select();
        },
      },
    },
    NativeSelect: { defaultProps: { size: 'xs' } },
    ActionIcon: { defaultProps: { size: 'xs' } },
    Badge: { defaultProps: { size: 'xs' } },
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
    Pill: { defaultProps: { size: 'md' } },
    Popover: { defaultProps: { shadow: 'md', withArrow: false } },
    Modal: { defaultProps: { radius: 'md' } },
    Drawer: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { withBorder: false, padding: 'md', radius: 'md' } },
    Paper: { defaultProps: { radius: 'sm' } },
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
      Object.keys(COLORS).map((name) => [
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
