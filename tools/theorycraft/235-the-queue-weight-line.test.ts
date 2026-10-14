/**
 * 235 — **the queue-weight line** (`tools/theorycraft/thrifty-stop.ts`; the owner, 2026-10-14: *"maybe 90 % of dmg/silver
 * is okay, but lets try your proposal of before, 10 % training time or something else; and try another experiment
 * weighing training time even more keeping the 90 % dmg/silver"*).
 *
 * The `rated` rule with the dmg/silver floor at 90 % (dmg/merc held at 95 %), and the weight of the training queue in
 * the owner's rating stepped from the app's 40 down to 1 (percent of queue worth one percent of damage: the lower, the
 * heavier). Three lines: no queue gate, a gate of 10 % (a pick must save that much of the sweet spot's queue), and 20 %.
 * Gold stays at 10. Reads the committed 232 horizon; `PYRRHIC_HORIZON_EXPORT` adds account exports. Writes
 * `out/235-the-queue-weight-line.{json,md}`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/235-the-queue-weight-line.test.ts`
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
import { ratedRule, renderSweep, thriftyStop } from './thrifty-stop';
import type { SweepLine } from './thrifty-stop';

const WEIGHTS = [40, 20, 10, 5, 2, 1];
const SILVER_FLOOR = 0.9;
const MERC_FLOOR = 0.95;

describe.skipIf(!process.env.THEORY)('235 — the queue-weight line', () => {
  it('weighs the training queue more and more and writes what each picks', () => {
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

    const make = (cut: number): SweepLine => ({
      name: cut === 0 ? 'no queue gate' : `queue ≥ ${String(Math.round(cut * 100))} % shorter`,
      about:
        cut === 0
          ? 'only the rating weighs the queue.'
          : `a pick must also save ${String(Math.round(cut * 100))} % of the sweet spot's queue.`,
      values: WEIGHTS,
      label: (w) => `q${String(w)}`,
      results: WEIGHTS.map((w) =>
        armies.map((army) => thriftyStop(army, ratedRule(w, SILVER_FLOOR, MERC_FLOOR, cut))),
      ),
    });
    const lines = [make(0), make(0.1), make(0.2)];

    const meta = {
      experiment: '235',
      armies: armies.length,
      extraArmies: armies.length - 19,
      weights: WEIGHTS,
      silverFloor: SILVER_FLOOR,
      mercFloor: MERC_FLOOR,
    };
    mkdirSync(OUT_DIR, { recursive: true });
    saveJson(
      new URL('235-the-queue-weight-line.json', OUT_DIR),
      armies.map((army, a) => ({
        label: army.label,
        ...Object.fromEntries(
          lines.map((line) => [
            line.name,
            line.values.map((w, v) => ({ queueWeight: w, ...(line.results[v]?.[a] ?? {}) })),
          ]),
        ),
      })) as never,
      meta,
    );
    writeFileSync(
      new URL('235-the-queue-weight-line.md', OUT_DIR),
      renderSweep(
        armies,
        lines,
        {
          title: 'The queue-weight line — weighing the training queue more',
          intro:
            "The rule is `rated` (`thrifty-stop.ts`): a stepping stone between the next stop down and the sweet spot, burn strictly below the next stop up's, dmg/silver at least 90 % and dmg/merc at least 95 % of the sweet spot's, and of what passes the best owner's rating against the sweet spot, taken only if that rating is above zero (gold at 10). The queue's weight in the rating steps from the app's 40 to 1 — percent of queue worth one percent of damage, so 1 makes a 30 % shorter queue worth thirty points of damage. A line adds a gate on the queue itself.",
        },
        meta,
      ),
    );

    // Weighing the queue more only widens what the rating prefers: no army loses its pick along a line.
    for (const line of lines)
      armies.forEach((army, a) => {
        let had = false;
        line.values.forEach((w, v) => {
          const pick = line.results[v]?.[a]?.pick;
          if (had) expect(pick, `${line.name} ${army.label} at q${String(w)}`).toBeDefined();
          if (pick) had = true;
        });
      });
  }, 600_000);
});
