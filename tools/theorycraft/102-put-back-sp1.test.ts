/**
 * 102 — **the put-back of Spearman I** (owner, 2026-09-18: *"march with Aydae lvl 43 3 stars and 4 975 leadership
 * generates RD2 988 · RD3 544 · ARC2 1897 · EMH6 68 · ABT6 50 · LGN6 20 · CHR6 8; if you add back SP1 all
 * improves. Try it also with three heroes (Aydae, Leonidas, Alexander)"*).
 *
 * For each setup: the plan's stops as generated, then for each stop the same mercenaries re-sized by the Elite
 * and MS sizers over the stop's troop types plus Spearman I, and over every type the account holds — each march
 * priced by `simulateBattle`. Damage, silver, a silver, a hired, and the troop counts, side by side.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/102-put-back-sp1.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluateCounts, n } from './harness';

const CAPTAINS = {
  aydae: { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
  alexander: { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
  leonidas: { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
} as const;

describe.skipIf(!process.env.THEORY)('102 — put back Spearman I', () => {
  it('measures the plan against the put-back on two hero setups', () => {
    const report = new Report('102-put-back-sp1');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    // The owner's live profile of 2026-09-18, read off localStorage: the export's army with Swordsman I kept
    // (no specialist exclusion), hunters 83 · legionaries unlimited · chariots 10 · arbalesters 60, authority
    // 2 180, the three captains enlisted.
    const LIVE_MERCS = [
      { id: 'epic-monster-hunter-6', cap: 83 },
      { id: 'legionary-6', cap: null },
      { id: 'chariot-6', cap: 10 },
      { id: 'arbalester-6', cap: 60 },
    ];
    const THREE = [CAPTAINS.aydae, CAPTAINS.leonidas, CAPTAINS.alexander];
    for (const [title, captains, leadership, live] of [
      ['Aydae 43 ★3 alone, 4 975 leadership (export army)', [CAPTAINS.aydae], 4_975, false],
      ['Aydae 43 ★3 · Leonidas 41 · Alexander 36, 4 975 (export army)', THREE, 4_975, false],
      ['LIVE profile, Aydae alone, 4 975', [CAPTAINS.aydae], 4_975, true],
      ['LIVE profile, three heroes, 4 975', THREE, 4_975, true],
      ['Aydae alone, 7 000', [CAPTAINS.aydae], 7_000, false],
      ['three heroes, 12 000', THREE, 12_000, false],
    ] as const) {
      const profile = structuredClone(parsed.payload);
      profile.sources.captains = [...captains];
      if (live) {
        profile.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: [] };
        profile.mercenaries.selected = structuredClone(LIVE_MERCS);
      }
      const setup0 = profile.setups[0];
      if (!setup0) throw new Error('no setup');
      const setup = {
        ...setup0,
        housing: { ...setup0.housing, leadership, ...(live ? { authority: 2_180 } : {}) },
      };
      const base = buildStackRequest(profile, setup);
      const mercIds = base.units.filter((u) => u.pool === 'authority').map((u) => u.id);
      const t0 = performance.now();
      const plan = planCampaign(buildPlanRequest(profile, setup));
      report.h(`${title} (${Math.round(performance.now() - t0)} ms, ${plan.alternatives.length} stops)`);
      report.add('| stop / put-back | troops | damage | silver | a silver | a hired |');
      report.add('|---|---|---|---|---|---|');
      const line = (name: string, counts: Record<string, number>): void => {
        const e = evaluateCounts(base, counts);
        const burned = mercIds.reduce((s, id) => s + chunks(counts[id] ?? 0), 0);
        const troops = Object.entries(counts)
          .filter(([id, c]) => c > 0 && !mercIds.includes(id))
          .map(([id, c]) => `${id} ${c}`)
          .join(' · ');
        report.add(
          `| ${name} | ${troops} | ${n(e.summary.avgDamage)} | ${n(e.summary.recovery.silver)} | ${(e.summary.avgDamage / e.summary.recovery.silver).toFixed(3)} | ${n(Math.round(e.summary.avgDamage / Math.max(1, burned)))} |`,
        );
      };
      for (const stop of plan.alternatives) {
        line(`**${stop.pick}** (${stop.shape}), as generated`, stop.counts);
        const mercCounts = Object.fromEntries(mercIds.map((id) => [id, stop.counts[id] ?? 0]));
        const troopIds = Object.keys(stop.counts).filter(
          (id) => !mercIds.includes(id) && (stop.counts[id] ?? 0) > 0,
        );
        for (const [label, ids] of [
          ['+ SP1', [...troopIds, 'spearman-1']],
          ['all types', base.units.filter((u) => u.pool === 'leadership').map((u) => u.id)],
        ] as const) {
          for (const method of ['elite', 'ms'] as const) {
            const request: StackRequest = {
              ...base,
              units: base.units.filter((u) => ids.includes(u.id) || mercIds.includes(u.id)),
              caps: { ...base.caps, ...mercCounts },
              options: { ...base.options, method, relaxedPreservation: false },
            };
            const sized = sizeStacks(request);
            const counts = Object.fromEntries(sized.stacks.map((s) => [s.unitId, s.count]));
            line(`${stop.pick} ${label}, ${method} sizer, same mercenaries`, counts);
          }
        }
      }
    }
    report.save();
  }, 300_000);
});
