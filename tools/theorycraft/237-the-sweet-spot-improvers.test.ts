/**
 * 237 — **the sweet-spot improvers** (`tools/theorycraft/thrifty-stop.ts`; the owner, 2026-10-14: *"did you check all the
 * benchmark use cases? do we have rows that improve dmg/silver on some? would another way improve more dmg/silver while
 * improving training time as well compared to the sweet spot?"*).
 *
 * For every army: the rows the bar did not offer that beat the sweet spot on **both** damage a silver and training time,
 * with no limit on burn, damage or order, and in three damage bands (≥ 100 %, ≥ 90 %, ≥ 75 % of the sweet spot's) the one
 * whose damage a silver and damage a merc gain most together. (The first run of this experiment ranked on dmg/silver alone and
 * bought damage with mercenaries: the owner, 2026-10-14, *"you're not optimizing dmg/merc anymore"*.) Reads the committed 232 horizon; `PYRRHIC_HORIZON_EXPORT` adds account exports. Writes
 * `out/237-the-sweet-spot-improvers.{json,md}`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/237-the-sweet-spot-improvers.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import { OUT_DIR } from './harness';
import { horizonOf, loadHorizon } from './march-horizon';
import type { ArmyHorizon } from './march-horizon';
import { saveJson } from './plan-report';
import { improversOf, ratiosOf, renderImprovers } from './thrifty-stop';

describe.skipIf(!process.env.THEORY)('237 — the sweet-spot improvers', () => {
  it('lists the rows that beat the sweet spot on dmg/silver and queue', () => {
    const base = loadHorizon(new URL('232-the-march-horizon.json', OUT_DIR));
    const armies: ArmyHorizon[] = [...base.armies];
    expect(armies.length, 'the 232 horizon holds the 19 benchmark armies').toBe(19);
    for (const file of (process.env.PYRRHIC_HORIZON_EXPORT ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f !== '')) {
      if (!existsSync(file)) continue;
      const parsed = parseImport(readFileSync(file, 'utf8'));
      const setup = parsed.kind === 'profile' ? parsed.payload.setups[0] : undefined;
      if (parsed.kind !== 'profile' || !setup) continue;
      armies.push(horizonOf(`export · ${basename(file)}`, buildStackRequest(parsed.payload, setup)));
    }

    const results = armies.map((army) => improversOf(army));
    const meta = { experiment: '237', armies: armies.length, extraArmies: armies.length - 19 };
    mkdirSync(OUT_DIR, { recursive: true });
    saveJson(
      new URL('237-the-sweet-spot-improvers.json', OUT_DIR),
      results.map((r) => ({ ...r, both: r.both.length, rows: r.both })) as never,
      meta,
    );
    writeFileSync(
      new URL('237-the-sweet-spot-improvers.md', OUT_DIR),
      renderImprovers(armies, results, meta),
    );

    // Every improver beats the sweet spot on dmg/silver and queue and keeps its dmg/merc; a wider band never has fewer rows.
    for (const r of results) {
      if (!r.sweet) continue;
      const base = ratiosOf(r.sweet);
      for (const row of r.both) {
        expect(ratiosOf(row).silver, `${r.label}: dmg/silver`).toBeGreaterThan(base.silver);
        expect(row.seconds, `${r.label}: queue`).toBeLessThan(r.sweet.seconds);
        expect(ratiosOf(row).merc, `${r.label}: dmg/merc`).toBeGreaterThanOrEqual(base.merc * r.mercFloor);
      }
      r.bands.forEach((band, i) => {
        const next = r.bands[i + 1];
        if (!next) return;
        expect(next.count, `${r.label}: ${next.name} holds ${band.name}'s rows`).toBeGreaterThanOrEqual(
          band.count,
        );
      });
    }
  }, 600_000);
});
