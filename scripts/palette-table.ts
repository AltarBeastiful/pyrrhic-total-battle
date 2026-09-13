/**
 * `node scripts/palette-table.ts` — prints `docs/design.md` §1's ramp table.
 *
 * The ramps are *generated* from eleven seed hues (`src/ui/palette.ts`), so writing them out by hand
 * in the documentation would guarantee they drift. Run this after changing a seed and paste the
 * output back into §1; `pnpm contrast` is the gate that says the new ramp still reads.
 */
import { COLORS, FILLED_SHADE, inkOn, SEEDS, SLATE } from '../src/ui/palette.ts';

const ROLE: Record<string, string> = {
  brass: 'accent — anything you can act on',
  guardsmen: 'guardsmen',
  specialists: 'specialists',
  engineers: 'engineers',
  monsters: 'monsters',
  mercenaries: 'mercenaries',
  danger: 'destructive, over capacity (also Mantine’s `red`)',
  tier1: 'tier I — slate, the one tier with no hue',
  tier2: 'tier II — green (the guardsmen seed)',
  tier3: 'tier III — blue (the specialists seed)',
  tier4: 'tier IV — violet (the monsters seed)',
  tier5: 'tier V — gold',
  tier6: 'tier VI — crimson',
  tier7: 'tier VII — crimson-violet',
  tier8: 'tier VIII — teal',
  tier9: 'tier IX — white-gold',
};

const head = ['Colour', 'Seed', ...Array.from({ length: 10 }, (_, i) => String(i))];
const rows: string[][] = [];

for (const [name, seed] of Object.entries(SEEDS)) {
  const shades = COLORS[name as keyof typeof COLORS] ?? [];
  rows.push([`\`${name}\``, `\`${seed}\``, ...shades.map((shade) => `\`${shade}\``)]);
}
rows.push(['`slate`', '—', ...SLATE.map((shade) => `\`${shade}\``)]);

process.stdout.write(`| ${head.join(' | ')} |\n`);
process.stdout.write(`|${head.map(() => '---').join('|')}|\n`);
for (const row of rows) process.stdout.write(`| ${row.join(' | ')} |\n`);

process.stdout.write(
  '\n| Colour | Role | Light ink (shade 7) | Dark ink (shade 5) | Ink on a filled ground |\n',
);
process.stdout.write('|---|---|---|---|---|\n');
for (const name of Object.keys(SEEDS)) {
  const shades = COLORS[name as keyof typeof COLORS] ?? [];
  const light = shades[FILLED_SHADE.light] ?? '';
  const dark = shades[FILLED_SHADE.dark] ?? '';
  process.stdout.write(
    `| \`${name}\` | ${ROLE[name] ?? ''} | \`${light}\` | \`${dark}\` | \`${inkOn(light)}\` / \`${inkOn(dark)}\` |\n`,
  );
}
