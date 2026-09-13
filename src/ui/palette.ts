/**
 * The palette, and nothing else: the seeds, the generated ramps, the surfaces and the contrast
 * pairs they owe. `theme.ts` builds the Mantine theme out of this module and re-exports what the
 * app reads; `scripts/contrast-check.ts` imports it directly.
 *
 * It is a module of its own for one practical reason: `pnpm contrast` runs under plain Node with
 * type stripping, and `theme.ts` imports `@mantine/core` and a CSS module, neither of which Node
 * can load. Everything here is pure arithmetic over hex strings, so the gate and the app compute
 * the palette from exactly the same source.
 */

// ---- colour maths (sRGB, WCAG 2.2) -------------------------------------------------------------

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
export function luminance(hex: string): number {
  const channels = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = luminance(a) > luminance(b) ? [a, b] : [b, a];
  return (luminance(light) + 0.05) / (luminance(dark) + 0.05);
}

/** `fg` laid over `bg` at `alpha`: the tonal ground Mantine's `light` variant paints. */
export function blend(fg: string, bg: string, alpha: number): string {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  return rgbToHex([0, 1, 2].map((i) => a[i]! * alpha + b[i]! * (1 - alpha)) as [number, number, number]);
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

// ---- colour, generated -------------------------------------------------------------------------

/**
 * Mantine wants ten steps per colour and we own one hue per role, so every ramp is *generated*: the
 * seed's hue and saturation are kept and the step is found by **relative luminance**, not by HSL
 * lightness. That distinction is the whole point. A green and a violet at the same HSL lightness are
 * nowhere near the same contrast, so a lightness ladder would ship a guardsmen ink at 3.5:1 and a
 * monsters ink at 8:1 — the opposite of `docs/design.md` §1 ("the five inks sit in one narrow
 * lightness band, so no group shouts louder than another"). Targeting luminance puts every hue's
 * shade 7 at the same distance from a light sheet and every hue's shade 5 at the same distance from
 * a dark one. Index 7 is the ink a light page reads (`primaryShade.light`), index 5 the ink a dark
 * page reads (`primaryShade.dark`).
 */
const LUMINANCE = [0.9, 0.8, 0.66, 0.52, 0.44, 0.36, 0.23, 0.1, 0.055, 0.03] as const;
/** Saturation eased off at the pale end, so shade 0 is a wash rather than a sweet. */
const SATURATION = [0.55, 0.62, 0.72, 0.82, 0.92, 1, 1, 1, 0.96, 0.9] as const;

/** Ten shades from one seed, lightest first — Mantine's own order. Pure; tested in `theme.test.ts`. */
export function ramp(seedHex: string): string[] {
  const { h, s } = rgbToHsl(hexToRgb(seedHex));
  return LUMINANCE.map((target, index) => {
    const saturation = Math.min(1, s * (SATURATION[index] ?? 1));
    return rgbToHex(hslToRgb(h, saturation, lightnessFor(h, saturation, target)));
  });
}

// ---- the seeds ---------------------------------------------------------------------------------

export const PITCH = '#131917'; // the design's darkest ink
export const PAPER = '#fafbfa'; // the design's lightest surface

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
  // The troop tiers (design plan §5.5, direction A). I–IV are the *same hues* as three of the unit
  // groups on purpose — the game paints a tier II green and a tier III blue, and inventing a second
  // green beside the guardsmen one would put two nearly identical inks on the same pill. The three
  // seeds are therefore written as the group seeds are, and `theme.test.ts` asserts they stay equal.
  tier1: '#485150', // I — slate, the one tier with no hue
  tier2: '#256b35', // II — green, the guardsmen seed
  tier3: '#25568a', // III — blue, the specialists seed
  tier4: '#5b368a', // IV — violet, the monsters seed
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
export const SLATE = [
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
];

export const COLORS: Record<PyrColorName, string[]> = {
  brass: ramp(SEEDS.brass),
  guardsmen: ramp(SEEDS.guardsmen),
  specialists: ramp(SEEDS.specialists),
  engineers: ramp(SEEDS.engineers),
  monsters: ramp(SEEDS.monsters),
  mercenaries: ramp(SEEDS.mercenaries),
  tier1: ramp(SEEDS.tier1),
  tier2: ramp(SEEDS.tier2),
  tier3: ramp(SEEDS.tier3),
  tier4: ramp(SEEDS.tier4),
  tier5: ramp(SEEDS.tier5),
  tier6: ramp(SEEDS.tier6),
  tier7: ramp(SEEDS.tier7),
  tier8: ramp(SEEDS.tier8),
  tier9: ramp(SEEDS.tier9),
  danger: ramp(SEEDS.danger),
  slate: SLATE,
};

/** The shade each scheme fills with; `primaryShade` says the same thing to Mantine. */
export const FILLED_SHADE = { light: 7, dark: 5 } as const;

export type Scheme = 'light' | 'dark';

/**
 * The app's surfaces, verbatim from `docs/design.md` §1.
 *
 * `panel` and `pane` are the two **lit** surfaces direction A added (design plan §5.5): a setup
 * section and the March pane are not flat fills any more but a faint top-to-bottom light. The value
 * written here is the end of that gradient text has the *least* contrast against — the light end in
 * the dark scheme, the dark end in the light one — so `pnpm contrast` checks the worst case rather
 * than the average. `DEPTH` below carries the gradients themselves.
 */
export const SURFACE = {
  light: {
    page: '#ecefec',
    sheet: PAPER,
    panel: '#f3f5f3',
    pane: '#eef1ee',
    raised: '#dee3df',
    sunken: '#e9ede9',
    ink: PITCH,
    muted: '#515a56',
    hairline: '#cfd5d1',
    field: '#6e7873',
  },
  dark: {
    page: '#161a19',
    sheet: '#1e2423',
    panel: '#212827',
    pane: '#232a29',
    raised: '#2b3231',
    sunken: '#101413',
    ink: '#e7ece9',
    muted: '#9da7a3',
    hairline: '#313938',
    field: '#78837f',
  },
} as const;

/**
 * Depth, as direction A draws it (design plan §5.5, artboards `docs/design-canvas/*.dc.html`): the
 * gradients, borders and shadows that make a panel a lit object rather than a fill — the command bar
 * included (`CommandBar.dc.html`, `.cmd`: its own gradient over its own 88 px, lit from above and
 * throwing its shadow up the page). Strings rather
 * than arithmetic, because that is what they are — but they live here, beside the surfaces they are
 * built from, so `theme.ts` is the only file that turns them into CSS variables and no section ever
 * writes one.
 */
export const DEPTH = {
  light: {
    panel: 'linear-gradient(180deg, #ffffff, #f3f5f3)',
    panelBorder: '#d7ddd8',
    panelShadow: '0 8px 24px rgba(19, 25, 23, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9) inset',
    pane: 'linear-gradient(180deg, #fdfefd 0, #eef1ee 600px)',
    paneBorder: '#ccd3ce',
    paneShadow: '0 12px 32px rgba(19, 25, 23, 0.1)',
    wellShadow: '0 1px 2px rgba(19, 25, 23, 0.1) inset',
    wellBorder: '#ccd3ce',
    barTop: 'linear-gradient(180deg, #ffffff, #ecefec)',
    sheetShadow: '0 -12px 32px rgba(19, 25, 23, 0.18)',
    barShadow: '0 -8px 24px rgba(19, 25, 23, 0.12)',
    command: 'linear-gradient(180deg, #ffffff, #eef1ee)',
    commandShadow: '0 -8px 28px rgba(19, 25, 23, 0.14)',
  },
  dark: {
    panel: 'linear-gradient(180deg, #212827, #1c2221)',
    panelBorder: '#2f3736',
    panelShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
    pane: 'linear-gradient(180deg, #232a29 0, #1a201f 600px)',
    paneBorder: '#3a4341',
    paneShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
    wellShadow: '0 1px 2px rgba(0, 0, 0, 0.4) inset',
    wellBorder: '#313938',
    barTop: 'linear-gradient(180deg, #1e2423, #161a19)',
    sheetShadow: '0 -12px 32px rgba(0, 0, 0, 0.5)',
    barShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
    command: 'linear-gradient(180deg, #242b2a, #1b2120)',
    commandShadow: '0 -8px 28px rgba(0, 0, 0, 0.45)',
  },
} as const;

/**
 * The one gilded object on the page: Generate (design plan §5.5). It is the same in both schemes on
 * purpose — it is the game's own trim, not a surface — so it is written once. `ink` is the dark it
 * is lettered in; `pnpm contrast` checks that ink against **both** ends of the gradient.
 */
export const GOLD = {
  gradient: 'linear-gradient(180deg, #e0c070, #c19a3f)',
  top: '#e0c070',
  bottom: '#c19a3f',
  ink: '#1a1408',
  shadow: '0 1px 0 rgba(255, 255, 255, 0.35) inset, 0 6px 16px rgba(201, 162, 74, 0.25)',
  /** One step brighter under the pointer; the ink is dark, so brighter is the readable direction. */
  hover: 'linear-gradient(180deg, #ecd08a, #cfa955)',
  /** The brand mark: the same metal, turned 45°. */
  mark: 'linear-gradient(135deg, #e0c070, #8f6d2a)',
} as const;

/**
 * Which of our two inks reads on a filled ground. Mantine's own `autoContrast` decides with a
 * luminance threshold *and* computes it from the light scheme's shade whichever scheme is showing
 * (friction 2 of investigation 0007: a filled button shipped at 1.34:1). Comparing the two ratios
 * per scheme is both correct and scheme-aware, and `variantColorResolver` feeds it back in.
 */
export function inkOn(background: string): string {
  return contrastRatio(background, PITCH) >= contrastRatio(background, PAPER) ? PITCH : PAPER;
}

// ---- the pairs the palette owes ----------------------------------------------------------------

/** The surfaces text is allowed to sit on. `sunken` is in the list: read-only figures live there. */
const SURFACES = ['page', 'sheet', 'panel', 'pane', 'raised', 'sunken'] as const;

/** How much of a colour's ink tints the ground under it — Mantine's own `light` variant alpha. */
const TONAL_ALPHA = 0.12;

export interface ContrastPair {
  readonly scheme: Scheme;
  /** What is being checked, in the palette's own words. */
  readonly foreground: string;
  readonly background: string;
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  /** Reported but never fatal — the token is decoration, not a boundary. */
  readonly advisory?: boolean;
}

/**
 * Every pair `docs/design.md` §1 promises, with the colours already resolved: text on the surfaces
 * it is allowed to sit on (4.5:1, WCAG 2.2 1.4.3) and the boundaries of controls (3:1, 1.4.11).
 * `pnpm contrast` prints these and fails on any non-advisory one below its floor.
 */
export function contrastPairs(): ContrastPair[] {
  const list: ContrastPair[] = [];

  for (const scheme of ['light', 'dark'] as const) {
    const s = SURFACE[scheme];
    const shade = FILLED_SHADE[scheme];

    const onSurfaces = (foreground: string, fg: string, min: number, advisory = false): void => {
      for (const name of SURFACES) {
        const pair = { scheme, foreground, background: name, fg, bg: s[name], min };
        list.push(advisory ? { ...pair, advisory } : pair);
      }
    };

    // The page's own ink, and the dimmed second line under it.
    onSurfaces('ink', s.ink, 4.5);
    onSurfaces('muted', s.muted, 4.5);

    // Every ramp, at the shade this scheme reads it at: on the four surfaces, on its own tonal
    // ground (a `light` badge, chip or alert), and the ink a filled ground of it is written in.
    for (const [name, shades] of Object.entries(COLORS)) {
      if (name === 'slate') continue;
      const ink = shades[shade]!;
      onSurfaces(`${name}.${String(shade)}`, ink, 4.5);
      list.push({
        scheme,
        foreground: `${name}.${String(shade)}`,
        background: `${name}/12 on sheet`,
        fg: ink,
        bg: blend(ink, s.sheet, TONAL_ALPHA),
        min: 4.5,
      });
      list.push({
        scheme,
        foreground: `on-${name}`,
        background: `${name}.${String(shade)} filled`,
        fg: inkOn(ink),
        bg: ink,
        min: 4.5,
      });
    }

    // Boundaries and markers: 3:1 (WCAG 1.4.11). `field` is the border of every control.
    onSurfaces('field', s.field, 3);

    // The focus ring (design rule 24, WCAG 2.2 §2.4.11). It is the accent at this scheme's filled
    // shade, drawn 2 px wide with 2 px of offset, so what it has to stand out from is whatever
    // surface the control sits on — both page grounds included.
    onSurfaces('focus ring', COLORS.brass[shade]!, 3);

    // Generate, the one gilded control (design plan §5.5). Its ink is checked against both ends of
    // the gradient, because a gradient has no single ground; the border of the panels and of the
    // pane is a boundary you can see but never press, so it rides with the hairline as advisory.
    for (const [end, background] of [
      ['gold top', GOLD.top],
      ['gold bottom', GOLD.bottom],
    ] as const) {
      list.push({
        scheme,
        foreground: 'gold ink',
        background: end,
        fg: GOLD.ink,
        bg: background,
        min: 4.5,
      });
    }

    // Each of the two only ever draws itself against the page it floats on, so it is one pair
    // apiece rather than one per surface.
    for (const [name, colour] of [
      ['panel border', DEPTH[scheme].panelBorder],
      ['pane border', DEPTH[scheme].paneBorder],
    ] as const) {
      list.push({
        scheme,
        foreground: name,
        background: 'page',
        fg: colour,
        bg: s.page,
        min: 3,
        advisory: true,
      });
    }

    // Decoration: printed so a drift is visible, never a failure. The hairline draws sheet edges
    // and dividers, never the boundary of a control, so it is deliberately quiet.
    onSurfaces('hairline', s.hairline, 3, true);
  }

  return list;
}
