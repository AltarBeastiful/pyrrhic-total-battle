/**
 * `pnpm contrast` — the gate the palette has to pass.
 *
 * The palette *is* the theme since M-09: there is no stylesheet of tokens to parse any more, so this
 * script imports `src/ui/palette.ts` — the module `src/ui/theme.ts` builds its ramps from — and
 * checks the pairs it declares. Text on the surfaces it is allowed to sit on (4.5:1, WCAG 2.2
 * 1.4.3), every generated ramp on those surfaces, on its own tonal ground and under the ink a filled
 * button writes on it, and the boundaries of controls (3:1, 1.4.11).
 *
 * Failures print as `scheme · foreground on background: ratio (needs x)` so the fix is one seed edit
 * away. The hairline is listed for information only: it draws sheet edges and dividers, never the
 * boundary of a control, so it is deliberately quiet.
 */
import { contrastPairs, contrastRatio } from '../src/ui/palette.ts';

const pairs = contrastPairs();
const problems: string[] = [];
const rows: string[] = [];
const minima = new Map<string, number>();

for (const pair of pairs) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const ok = ratio >= pair.min;
  const mark = pair.advisory === true ? '·' : ok ? '✓' : '✗';
  rows.push(
    `  ${mark} ${pair.scheme.padEnd(5)} ${pair.foreground.padEnd(20)} on ${pair.background.padEnd(24)} ${ratio
      .toFixed(2)
      .padStart(6)}  (needs ${String(pair.min)})`,
  );
  if (pair.advisory === true) continue;

  const key = `${pair.scheme} ${String(pair.min)}`;
  minima.set(key, Math.min(minima.get(key) ?? Infinity, ratio));
  if (!ok) {
    problems.push(
      `${pair.scheme} · ${pair.foreground} on ${pair.background}: ${ratio.toFixed(2)} (needs ${String(pair.min)})`,
    );
  }
}

process.stdout.write(`contrast — src/ui/palette.ts, WCAG 2.2\n${rows.join('\n')}\n\n`);
for (const [key, value] of [...minima].sort()) {
  const [scheme, min] = key.split(' ');
  process.stdout.write(`  lowest ${String(scheme)} pair at ${String(min)}:1 → ${value.toFixed(2)}\n`);
}

if (problems.length > 0) {
  process.stderr.write(
    `\ncontrast failed — ${problems.length} problem(s):\n${problems.map((line) => `  ${line}`).join('\n')}\n`,
  );
  process.exit(1);
}

process.stdout.write(`\ncontrast — ${pairs.length} pairs pass\n`);
