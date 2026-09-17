/**
 * 101 — **what the shelter costs, and why ten bears make one stop** (owner, 2026-09-18: *"that's a bit weird,
 * no? losing there if we shield the mercs properly? or is there a flaw in our calculations of the expected
 * battle? … I feel 10 should still be slidable 2 - 5 - 10 … rooted in calculations, no more magic static
 * numbers"*).
 *
 * §A prices the pre-S-75 steady max at 7 000 leadership (the MS-relaxed march the clamp removed) beside the
 * S-75 one, both through `simulateBattle`, and prints each stack's kill position and strikes.
 * §B plans a first-run army (Guardsmen I–III, Specialists I, 20 000 leadership) with Bear V hired at every
 * stock from 1 to 10 and prints what each stock's bar would offer.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/101-shelter-cost-and-ten-bears.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import type { PlanRow } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { newProfile } from '../../src/state/defaults';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluateCounts, lines, n } from './harness';

const OLD_STEADY_MAX: Record<string, number> = {
  'archer-1': 1569,
  'spearman-1': 1272,
  'rider-1': 696,
  'archer-2': 866,
  'spearman-2': 703,
  'rider-2': 384,
  'rider-3': 215,
  'arbalester-6': 40,
  'chariot-6': 16,
  'epic-monster-hunter-6': 38,
  'legionary-6': 34,
};

const stopLine = (row: PlanRow): string => {
  const hired = Object.entries(row.counts)
    .filter(([id]) => /-6$|bear/.test(id))
    .map(([id, count]) => `${id.replace('-6', '').replace('epic-monster-hunter', 'EMH')} ${count}`)
    .join(' · ');
  return `| ${row.pick} (${row.shape}) | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ${row.repeat.mercLost} | ${n(Math.round((row.repeat.damage / row.repeat.silver) * 100) / 100)} | ${n(Math.round(row.repeat.damage / row.repeat.mercLost))} | ${hired} |`;
};

describe.skipIf(!process.env.THEORY)('101 — shelter cost and ten bears', () => {
  it('measures both', () => {
    const report = new Report('101-shelter-cost-and-ten-bears');
    // ---- §A ------------------------------------------------------------------------------------------
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups[0]!;
    const request = buildStackRequest(profile, setup);
    const plan = planCampaign(buildPlanRequest(profile, setup));
    const steady = plan.alternatives.find((row) => row.pick === 'steady-max')!;
    report.h('§A — export of 2026-09-17 at 7 000: the steady max before and after the shelter');
    for (const [title, counts] of [
      ['before S-75 (MS relaxed, unsheltered)', OLD_STEADY_MAX],
      [`after S-75 (${steady.shape}, sheltered)`, steady.counts],
    ] as const) {
      const evaluation = evaluateCounts(request, counts);
      const s = evaluation.summary;
      report.add(`\n### ${title}\n`);
      report.add(
        `average damage ${n(s.avgDamage)} (min ${n(s.minDamage)}, max ${n(s.maxDamage)}), silver ${n(s.recovery.silver)}, gold ${n(s.recovery.gold)}, hired burned ${Object.entries(
          counts,
        )
          .filter(([id]) => id.endsWith('-6'))
          .reduce((sum, [, c]) => sum + Math.ceil(c / 10), 0)}\n`,
      );
      report.add(
        '| kill position | stack | pool | count | total HP | hits (enemy first / army first) | damage (avg) |',
      );
      report.add('|---|---|---|---|---|---|---|');
      for (const line of lines(evaluation)) {
        report.add(
          `| ${line.position} | ${line.label} | ${line.pool} | ${n(line.count)} | ${n(line.totalHp)} | ${line.hitsEnemyFirst} / ${line.hitsArmyFirst} | ${n(Math.round((line.damageEnemyFirst + line.damageArmyFirst) / 2))} |`,
        );
      }
    }
    // ---- §B ------------------------------------------------------------------------------------------
    report.h(
      '§B — a first-run army (Guardsmen I–III, Specialists I, 20 000 leadership) with Bear V at every stock',
    );
    report.add(
      'One row a stop, a march: damage, silver, gold, hired burned, damage a silver, damage a hired unit burned.\n',
    );
    for (const stock of [1, 2, 3, 5, 7, 10, 20, 30]) {
      const fresh = newProfile('first run');
      fresh.mercenaries.selected = [{ id: 'bear-5', cap: stock }];
      const first = fresh.setups[0]!;
      const freshSetup = { ...first, housing: { leadership: 20_000, authority: 40_000, dominance: 0 } };
      const t0 = performance.now();
      let bears;
      try {
        bears = planCampaign(buildPlanRequest(fresh, freshSetup));
      } catch (error) {
        report.add(`\n### ${stock} bears in stock: **${(error as Error).message}**`);
        continue;
      }
      report.add(
        `\n### ${stock} bears in stock (${Math.round(performance.now() - t0)} ms, ${bears.alternatives.length} stops, band left out ${bears.leftOut})\n`,
      );
      report.add('| stop | damage | silver | gold | burned | a silver | a hired | hired fielded |');
      report.add('|---|---|---|---|---|---|---|---|');
      for (const row of bears.alternatives) report.add(stopLine(row));
      const winner = bears.march;
      const troops = Object.entries(winner.counts)
        .filter(([id]) => !id.startsWith('bear'))
        .map(([id, c]) => `${id} ${c}`)
        .join(' · ');
      report.add(`\nwinner's troops: ${troops}`);
    }
    report.save();
  });
});

describe.skipIf(!process.env.THEORY)('101 §C — the band at ten bears', () => {
  it('lists every band row by bears fielded', () => {
    const report = new Report('101c-ten-bears-band');
    const fresh = newProfile('first run');
    fresh.mercenaries.selected = [{ id: 'bear-5', cap: 10 }];
    const first = fresh.setups[0]!;
    const freshSetup = { ...first, housing: { leadership: 20_000, authority: 40_000, dominance: 0 } };
    const plan = planCampaign({ ...buildPlanRequest(fresh, freshSetup), withTrade: true });
    report.h('ten bears, 20 000 leadership: the band (`withTrade`), a march each');
    report.add(
      '| bears fielded | shape | marches | damage | silver | gold | burned | a silver | campaign damage | campaign silver | finale bears |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|');
    const rows = [...(plan.trade ?? [])].sort(
      (a, b) => (a.counts['bear-5'] ?? 0) - (b.counts['bear-5'] ?? 0) || a.silver - b.silver,
    );
    for (const row of rows) {
      report.add(
        `| ${row.counts['bear-5'] ?? 0} | ${row.shape} | ${row.marches} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ${row.repeat.mercLost} | ${n(Math.round((row.repeat.damage / row.repeat.silver) * 100) / 100)} | ${n(row.totalDamage)} | ${n(row.silver)} | ${row.finaleCounts?.['bear-5'] ?? '-'} |`,
      );
    }
    report.save();
  });
});
