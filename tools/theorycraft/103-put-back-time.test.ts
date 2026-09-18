/**
 * 103 — **what a put-back costs and saves, with training time** (owner, 2026-09-18: *"troops of higher tier are
 * longer to train … add a pass to consider again lower level troops if the cost for them (silver, silver/damage,
 * total damage) is not too high and we get a nice reduction in training time"* — *"output a table to help me
 * decide with a few options"*).
 *
 * For each plan stop on four setups: the march as generated, then every troop type the march leaves out put
 * back one at a time (the MS sizer over the stop's types plus that one, same mercenaries), with the change in
 * damage, silver, damage a silver, damage a hired and recovery time (the recap's own `recovery.seconds`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/103-put-back-time.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { unitById } from '../../src/data';
import { planCampaign } from '../../src/engine';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, duration, evaluateCounts, n } from './harness';

const AYDAE = { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 };
const THREE = [
  AYDAE,
  { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
];
const LIVE_MERCS = [
  { id: 'epic-monster-hunter-6', cap: 83 },
  { id: 'legionary-6', cap: null },
  { id: 'chariot-6', cap: 10 },
  { id: 'arbalester-6', cap: 60 },
];
const pct = (a: number, b: number): string => `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(1)} %`;

describe.skipIf(!process.env.THEORY)('103 — put-back with training time', () => {
  it('tables every put-back on four setups', () => {
    const report = new Report('103-put-back-time');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    for (const [title, captains, leadership, live] of [
      ['LIVE profile, Aydae alone, 4 975', [AYDAE], 4_975, true],
      ['LIVE profile, three heroes, 4 975', THREE, 4_975, true],
      ['export, its setup, 7 000', [], 7_000, false],
      ['export, 12 000', [], 12_000, false],
    ] as const) {
      const profile = structuredClone(parsed.payload);
      if (captains.length > 0) profile.sources.captains = [...captains];
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
      const troopIds = base.units.filter((u) => u.pool === 'leadership').map((u) => u.id);
      const plan = planCampaign(buildPlanRequest(profile, setup));
      report.h(`${title} (${plan.alternatives.length} stops)`);
      report.add('| stop | march | damage | Δ | silver | Δ | a silver | a hired | recovery time | Δ time |');
      report.add('|---|---|---|---|---|---|---|---|---|---|');
      for (const stop of plan.alternatives) {
        if (stop.sequence) continue;
        const baseline = evaluateCounts(base, stop.counts);
        const b = baseline.summary;
        const burnedB = mercIds.reduce((s, id) => s + chunks(stop.counts[id] ?? 0), 0);
        const troopsOf = (counts: Record<string, number>): string =>
          Object.entries(counts)
            .filter(([id, c]) => c > 0 && !mercIds.includes(id))
            .map(([id, c]) => `${unitById(id)?.label ?? id} ${c}`)
            .join(' · ');
        report.add(
          `| **${stop.pick}** (${stop.shape}) | ${troopsOf(stop.counts)} | ${n(b.avgDamage)} | — | ${n(b.recovery.silver)} | — | ${(b.avgDamage / b.recovery.silver).toFixed(2)} | ${n(Math.round(b.avgDamage / Math.max(1, burnedB)))} | ${duration(b.recovery.seconds)} | — |`,
        );
        const inMarch = troopIds.filter((id) => (stop.counts[id] ?? 0) > 0);
        const mercCounts = Object.fromEntries(mercIds.map((id) => [id, stop.counts[id] ?? 0]));
        for (const extra of troopIds.filter((id) => !inMarch.includes(id))) {
          const request: StackRequest = {
            ...base,
            units: base.units.filter(
              (u) => inMarch.includes(u.id) || u.id === extra || mercIds.includes(u.id),
            ),
            caps: { ...base.caps, ...mercCounts },
            options: { ...base.options, method: 'ms', relaxedPreservation: false },
          };
          const sized = sizeStacks(request);
          const counts = Object.fromEntries(sized.stacks.map((s) => [s.unitId, s.count]));
          const e = evaluateCounts(base, counts).summary;
          const burned = mercIds.reduce((s, id) => s + chunks(counts[id] ?? 0), 0);
          report.add(
            `| + ${unitById(extra)?.label ?? extra} | ${troopsOf(counts)} | ${n(e.avgDamage)} | ${pct(e.avgDamage, b.avgDamage)} | ${n(e.recovery.silver)} | ${pct(e.recovery.silver, b.recovery.silver)} | ${(e.avgDamage / e.recovery.silver).toFixed(2)} | ${n(Math.round(e.avgDamage / Math.max(1, burned)))} | ${duration(e.recovery.seconds)} | ${pct(e.recovery.seconds, b.recovery.seconds)} |`,
          );
        }
      }
    }
    report.save();
  }, 300_000);
});
