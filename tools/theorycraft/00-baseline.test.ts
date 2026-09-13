/**
 * E1 — baseline anatomy of the owner's march in both bonus scenarios and all three sizing methods.
 * `THEORY=1 pnpm vitest run tools/theorycraft/00-baseline.test.ts`
 */
import { describe, it } from 'vitest';

import { expectedHits } from '../../src/engine/battle';
import { Report, evaluate, loadOwner, march, n, scenarioB, table, withMethod } from './harness';

describe.skipIf(!process.env.THEORY)('E1 baseline', () => {
  it('prints the anatomy', () => {
    const report = new Report('00-baseline');
    const owner = loadOwner();
    report.add(
      `export: ${owner.excluded.join(', ')} left out; housing ${JSON.stringify(owner.eight.housing)}; caps ${JSON.stringify(owner.eight.caps)}`,
    );
    report.add(
      `totals A: health ${JSON.stringify(owner.eight.totals.health)} strength ${JSON.stringify(owner.eight.totals.strength)}`,
    );
    const b = scenarioB(owner.eight);
    report.add(
      `totals B: health ${JSON.stringify(b.totals.health)} strength ${JSON.stringify(b.totals.strength)}`,
    );

    report.h('Hits by kill position (closed form, orders coinciding)');
    for (const N of [3, 4, 8]) {
      const row = Array.from(
        { length: 16 },
        (_x, i) => `${expectedHits(i + 1, N, false)}/${expectedHits(i + 1, N, true)}`,
      );
      report.add(`N=${N}: ${row.join(' ')}`);
    }

    for (const [name, base] of [
      ['A (export)', owner.eight],
      ['B (report bonuses)', b],
    ] as const) {
      for (const pool of ['eight', 'twelve'] as const) {
        const req = pool === 'eight' ? base : { ...base, units: owner.twelve.units };
        for (const method of ['elite', 'ms', 'msRelaxed'] as const) {
          const ev = evaluate(withMethod(req, method));
          report.h(`${name} · ${pool} types · ${method}`);
          report.add(march(ev.result));
          report.add(table(ev));
          report.add(
            `by pool: ${JSON.stringify(ev.summary.damageByPool)}; warnings: ${ev.result.warnings.join(' | ')}; dropped: ${ev.result.dropped.map((d) => d.unitId).join(',')}`,
          );
        }
      }
    }
    report.add(`\n(n = ${n(1234567.5)})`);
    report.save();
  });
});
