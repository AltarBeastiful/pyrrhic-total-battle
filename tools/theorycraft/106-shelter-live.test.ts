/**
 * 106 — **the shelter on the owner's live camp** (owner, 2026-09-18: *"a critical rule is to shield mercs. Right
 * now mercs are unshielded on all complete optimization marches"*). His profile read off localStorage that
 * evening: arbalesters 485, legionaries 1 002, bears unlimited; three captains; 4 975 leadership, 2 180 authority.
 *
 * For every stop the plan offers: each stack's total HP in the enemy's kill order, and which hired stacks stand
 * at or above the lowest troop stack (the enemy wipes the highest-HP living stack first).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/106-shelter-live.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluateCounts, n } from './harness';

describe.skipIf(!process.env.THEORY)('106 — shelter on the live camp', () => {
  it('lists every stop’s stacks in kill order', () => {
    const report = new Report('106-shelter-live');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = structuredClone(parsed.payload);
    profile.sources.captains = [
      { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
      { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
      { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
    ];
    profile.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
    profile.mercenaries.selected = [
      { id: 'arbalester-6', cap: 485 },
      { id: 'legionary-6', cap: 1002 },
      { id: 'bear-5', cap: null },
    ];
    const setup0 = profile.setups[0];
    if (!setup0) throw new Error('no setup');
    const setup = {
      ...setup0,
      active: { ...setup0.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
      housing: { ...setup0.housing, leadership: 4_975, authority: 2_180 },
    };
    const base = buildStackRequest(profile, setup);
    const mercIds = new Set(base.units.filter((u) => u.pool === 'authority').map((u) => u.id));
    const plan = planCampaign(buildPlanRequest(profile, setup));
    report.h(`live camp — ${plan.alternatives.length} stops`);
    for (const stop of plan.alternatives) {
      const e = evaluateCounts(base, stop.counts);
      const stacks = e.result.stacks
        .map((s) => ({ id: s.unitId, count: s.count, hp: s.totalHp, hired: mercIds.has(s.unitId) }))
        .sort((a, b) => b.hp - a.hp);
      const floor = Math.min(...stacks.filter((s) => !s.hired).map((s) => s.hp));
      const exposed = stacks.filter((s) => s.hired && s.hp >= floor);
      report.h(
        `${stop.pick} (${stop.shape}) — ${n(e.summary.avgDamage)} damage, ${n(e.summary.recovery.silver)} silver, ${stop.repeat.mercLost} burned — ${exposed.length} hired stack(s) at or above the lowest troop stack (${n(floor)} HP): ${exposed.map((s) => `${s.id} ${s.count} = ${n(s.hp)} HP`).join(', ') || 'none'}`,
      );
      report.add('| kill order | stack | count | total HP | hired |');
      report.add('|---|---|---|---|---|');
      stacks.forEach((s, i) =>
        report.add(`| ${i + 1} | ${s.id} | ${n(s.count)} | ${n(s.hp)} | ${s.hired ? '**yes**' : ''} |`),
      );
    }
    report.save();
  }, 120_000);
});
