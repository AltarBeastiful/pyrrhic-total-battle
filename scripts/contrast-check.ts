/**
 * `pnpm contrast` — the gate the palette has to pass.
 *
 * Reads `src/index.css`, resolves every `--pyr-*` token for both themes and checks the pairs
 * `docs/design.md` §1 promises: text on the surfaces it is allowed to sit on (4.5:1, WCAG 2.2
 * 1.4.3) and the boundaries of controls and markers (3:1, 1.4.11). It also proves that the two
 * dark blocks in the stylesheet — the `prefers-color-scheme` one and the `[data-theme='dark']`
 * one — still say exactly the same thing.
 *
 * Failures print as `theme · foreground on background: ratio (needs x)` so the fix is one hex
 * edit away. `line` is listed for information only: it draws card edges and dividers, never the
 * boundary of a control, so it is deliberately quiet.
 */
import { readFile } from 'node:fs/promises';

const CSS = new URL('../src/index.css', import.meta.url);

/* ---------------------------------------------------------------- colour maths (sRGB, WCAG 2.2) */

type Rgb = readonly [number, number, number];

/** Only plain 6-digit hex is accepted: a palette token a machine cannot read is a palette bug. */
function parseHex(value: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (match?.[1] === undefined) return null;
  const int = Number.parseInt(match[1], 16);
  return [(int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** `fg` laid over `bg` at `alpha`, the way a `/12` opacity modifier paints a tinted chip. */
function blend(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) =>
    Math.round((fg[i] ?? 0) * alpha + (bg[i] ?? 0) * (1 - alpha)),
  ) as unknown as Rgb;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------------------ reading the CSS */

type Palette = Map<string, string>;

/** The body of the first rule with this exact selector, counting braces so nesting is safe. */
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const opener = new RegExp(`${escaped}\\s*\\{`).exec(css);
  if (opener === null) throw new Error(`src/index.css: no \`${selector}\` rule`);
  const open = opener.index + opener[0].length - 1;
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`src/index.css: \`${selector}\` is never closed`);
}

function declarations(body: string): Palette {
  const palette: Palette = new Map();
  for (const [, name, value] of body.matchAll(/(--pyr-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (name !== undefined && value !== undefined) palette.set(name, value.trim());
  }
  return palette;
}

function colour(palette: Palette, theme: string, token: string): Rgb {
  const raw = palette.get(`--pyr-${token}`);
  if (raw === undefined) throw new Error(`${theme}: \`--pyr-${token}\` is not defined`);
  const rgb = parseHex(raw);
  if (rgb === null) {
    throw new Error(`${theme}: \`--pyr-${token}\` is \`${raw}\`; palette tokens must be #rrggbb`);
  }
  return rgb;
}

/* ------------------------------------------------------------------------------- the pairs we owe */

const GROUPS = ['guardsmen', 'specialists', 'engineers', 'monsters', 'mercenaries'] as const;

/** The tiers the mercenary tables can carry a colour for (design plan §7.2). */
const TIERS = [5, 6, 7, 8, 9] as const;

/** The surfaces a tier badge is ever drawn on: the setup sheet, and the picker's own popover. */
const BADGE_SURFACES = ['surface', 'raised'] as const;

/** How much of a tier's ink tints the ground under its own numeral (`bg-tier-6/12`). */
const TIER_GROUND = 0.12;

/** The surfaces text is allowed to sit on. `sunken` is in the list: read-only figures live there. */
const SURFACES = ['bg', 'surface', 'raised', 'sunken'] as const;

interface Pair {
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  /** Reported but never fatal — the token is decoration, not a boundary. */
  readonly advisory?: boolean;
  /** The ground is `fg` laid over `bg` at this alpha: a badge tinted with its own ink. */
  readonly over?: number;
}

function pairs(): Pair[] {
  const list: Pair[] = [];
  const onSurfaces = (fg: string, min: number, advisory = false): void => {
    for (const bg of SURFACES) list.push(advisory ? { fg, bg, min, advisory } : { fg, bg, min });
  };

  // Body text and the ink of every tone: 4.5:1 on every base surface and on its own soft surface.
  onSurfaces('fg', 4.5);
  onSurfaces('muted', 4.5);
  for (const tone of ['accent', 'info', 'danger', 'warn', 'ok'] as const) {
    onSurfaces(tone, 4.5);
    list.push({ fg: tone, bg: `${tone}-soft`, min: 4.5 });
    list.push({ fg: `${tone}-fg`, bg: tone, min: 4.5 });
  }
  for (const group of GROUPS) {
    onSurfaces(`group-${group}-strong`, 4.5);
    list.push({ fg: `group-${group}-strong`, bg: `group-${group}-soft`, min: 4.5 });
  }

  // Tier inks: the roman numeral on a badge and the heading over a tier in the picker. The badge
  // grounds itself in a 12 % wash of its own ink, so the ink is checked against that wash too.
  for (const tier of TIERS) {
    onSurfaces(`tier-${tier}`, 4.5);
    for (const bg of BADGE_SURFACES) list.push({ fg: `tier-${tier}`, bg, min: 4.5, over: TIER_GROUND });
  }

  // Boundaries and markers: 3:1 (WCAG 1.4.11). `field` is the border of every control.
  onSurfaces('field', 3);
  onSurfaces('accent-line', 3);
  for (const group of GROUPS) {
    list.push({ fg: `group-${group}-edge`, bg: 'surface', min: 3 });
    list.push({ fg: `group-${group}-edge`, bg: `group-${group}-soft`, min: 3 });
  }

  // Decoration: printed so a drift is visible, never a failure.
  onSurfaces('line', 3, true);

  return list;
}

/* -------------------------------------------------------------------------------------- the run */

const css = await readFile(CSS, 'utf8');
const themes: ReadonlyArray<readonly [string, Palette]> = [
  ['light', declarations(ruleBody(css, ':root'))],
  ['dark', declarations(ruleBody(css, ":root[data-theme='dark']"))],
];
const mediaDark = declarations(ruleBody(css, ":root:not([data-theme='light'])"));

const problems: string[] = [];
const rows: string[] = [];
const minima = new Map<string, number>();

// The OS-preference dark block and the attribute dark block must stay the same palette.
const darkPalette = themes[1]?.[1] ?? new Map<string, string>();
const flat = (value: string | undefined): string => value?.replaceAll(/\s+/g, ' ') ?? 'missing';
for (const [name, value] of darkPalette) {
  const other = mediaDark.get(name);
  if (flat(other) !== flat(value)) {
    problems.push(
      `dark blocks disagree · ${name}: \`${flat(value)}\` under [data-theme] but \`${flat(other)}\` under prefers-color-scheme`,
    );
  }
}
for (const name of mediaDark.keys()) {
  if (!darkPalette.has(name))
    problems.push(`dark blocks disagree · ${name}: missing from [data-theme='dark']`);
}

for (const [theme, palette] of themes) {
  for (const pair of pairs()) {
    const fg = colour(palette, theme, pair.fg);
    const under = colour(palette, theme, pair.bg);
    const bg = pair.over === undefined ? under : blend(fg, under, pair.over);
    const ratio = contrast(fg, bg);
    const ok = ratio >= pair.min;
    const mark = pair.advisory ? '·' : ok ? '✓' : '✗';
    const ground =
      pair.over === undefined ? pair.bg : `${pair.fg}/${Math.round(pair.over * 100)} on ${pair.bg}`;
    rows.push(
      `  ${mark} ${theme.padEnd(5)} ${pair.fg.padEnd(26)} on ${ground.padEnd(26)} ${ratio.toFixed(2).padStart(6)}  (needs ${pair.min})`,
    );
    if (!pair.advisory) {
      const key = `${theme} ${pair.min}`;
      minima.set(key, Math.min(minima.get(key) ?? Infinity, ratio));
      if (!ok) {
        problems.push(`${theme} · ${pair.fg} on ${ground}: ${ratio.toFixed(2)} (needs ${pair.min})`);
      }
    }
  }
}

process.stdout.write(`contrast — src/index.css, WCAG 2.2\n${rows.join('\n')}\n\n`);
for (const [key, value] of [...minima].sort()) {
  const [theme, min] = key.split(' ');
  process.stdout.write(`  lowest ${theme} pair at ${min}:1 → ${value.toFixed(2)}\n`);
}

if (problems.length > 0) {
  process.stderr.write(
    `\ncontrast failed — ${problems.length} problem(s):\n${problems.map((line) => `  ${line}`).join('\n')}\n`,
  );
  process.exit(1);
}

process.stdout.write(`\ncontrast — ${pairs().length * 2} pairs pass in both themes\n`);
