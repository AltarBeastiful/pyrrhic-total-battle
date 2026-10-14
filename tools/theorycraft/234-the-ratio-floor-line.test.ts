/**
 * 234 — **the ratio-floor line** (`tools/theorycraft/thrifty-stop.ts`; the owner, 2026-10-14: *"the same variation … for
 * dmg/silver & dmg/merc starting from 95 % (as a single moving line, per criterion) and show what we're coming up with"*).
 *
 * The `rated` rule of 233 at the app's queue weight (40) and gold at 10, with the floors on the sweet spot's damage a
 * silver and damage a merc moved down from 95 %: on both together, on dmg/silver alone (merc held at 95 %), and on
 * dmg/merc alone (silver held at 95 %). Reads the committed 232 horizon (seconds, byte-identical); an optional
 * `PYRRHIC_HORIZON_EXPORT` adds account exports as in 232/233. Writes `out/234-the-ratio-floor-line.{json,md}`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/234-the-ratio-floor-line.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import { OUT_DIR } from './harness';
import { horizonOf, loadHorizon } from './march-horizon';
import type { ArmyHorizon } from './march-horizon';
import { saveJson } from './plan-report';
import { ratedRule, renderSweep, thriftyStop } from './thrifty-stop';
import type { SweepLine } from './thrifty-stop';

const FLOORS = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6];
const HELD = 0.95;

describe.skipIf(!process.env.THEORY)('234 — the ratio-floor line', () => {
  it('moves the floors down and writes what each picks', () => {
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

    const seconds = CAMPAIGN.markerRates.seconds;
    const make = (
      name: string,
      about: string,
      rule: (floor: number) => ReturnType<typeof ratedRule>,
    ): SweepLine => ({
      name,
      about,
      values: FLOORS,
      label: (f) => `≥ ${String(Math.round(f * 100))} %`,
      results: FLOORS.map((floor) => armies.map((army) => thriftyStop(army, rule(floor)))),
    });
    const lines: SweepLine[] = [
      make('both', 'dmg/silver and dmg/merc floors move together.', (f) => ratedRule(seconds, f, f)),
      make('silver', `dmg/silver floor moves, dmg/merc held at ${String(HELD * 100)} %.`, (f) =>
        ratedRule(seconds, f, HELD),
      ),
      make('merc', `dmg/merc floor moves, dmg/silver held at ${String(HELD * 100)} %.`, (f) =>
        ratedRule(seconds, HELD, f),
      ),
    ];

    const meta = {
      experiment: '234',
      armies: armies.length,
      extraArmies: armies.length - 19,
      floors: FLOORS,
    };
    mkdirSync(OUT_DIR, { recursive: true });
    saveJson(
      new URL('234-the-ratio-floor-line.json', OUT_DIR),
      armies.map((army, a) => ({
        label: army.label,
        ...Object.fromEntries(
          lines.map((line) => [
            line.name,
            line.values.map((floor, f) => ({ floor, ...(line.results[f]?.[a] ?? {}) })),
          ]),
        ),
      })) as never,
      meta,
    );
    writeFileSync(
      new URL('234-the-ratio-floor-line.md', OUT_DIR),
      renderSweep(
        armies,
        lines,
        {
          title: 'The ratio-floor line — how far the dmg/silver and dmg/merc floors can drop',
          intro:
            "The rule is `rated` (`thrifty-stop.ts`): a stepping stone between the next stop down and the sweet spot, burn strictly below the next stop up's, no queue gate, and of what passes the best owner's rating against the sweet spot (queue weight 40, gold 10), taken only if that rating is above zero. Only the floors change: the share of the sweet spot's damage a silver and damage a merc a row must keep.",
        },
        meta,
      ),
    );

    // Loosening a floor only widens the pool: no army that has a pick at one floor loses it at a lower one.
    for (const line of lines)
      armies.forEach((army, a) => {
        let had = false;
        line.values.forEach((floor, f) => {
          const pick = line.results[f]?.[a]?.pick;
          if (had) expect(pick, `${line.name} ${army.label} at ${String(floor)}`).toBeDefined();
          if (pick) had = true;
        });
      });
  }, 600_000);
});
