/**
 * 97 — **is the troops' HP above the mercenaries useful?** (owner, 2026-09-18: *"when checking health stack, I
 * see that the troops' health stacks are way higher than the mercs, above the 2–3 % for safety. Is that really
 * useful in terms of damage?"*)
 *
 * The engine's own rule of the battle (`src/engine/battle.ts`): the enemy always wipes our highest-HP living
 * stack, whole, whatever its HP — so a stack's HP decides *when* it dies and nothing else, while its *count*
 * decides what its own strike hits for. The question is therefore whether the troops fielded above the
 * mercenaries earn their silver as damage. Measured on the owner's latest export, the plan as the app draws it:
 *
 *  A. the sweet spot's stacks, HP and count, troops against mercenaries;
 *  B. the same march with every troop stack scaled down together (the mercenaries unchanged), priced by
 *     `simulateBattle` on explicit counts — damage, silver, the two ratios, and whether the mercenaries still
 *     die after the troops;
 *  C. the tight ladder: every troop type sized to sit just above the biggest mercenary stack, the shape the
 *     search used to walk.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/97-shelter-margin.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { Report, evaluateCounts, n } from './harness';

const EXPORT_LATEST =
  process.env.PYRRHIC_EXPORT_LATEST ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (3).json';
const SCALES = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
const short = (id: string): string =>
  id
    .replace(/-6$/, '')
    .replace('epic-monster-hunter', 'EMH')
    .replace(/^(\w)\w*-(\d)$/, '$1$2');

describe.skipIf(!process.env.THEORY)('the shelter margin', () => {
  it('scales the troops down toward the mercenaries and prices every step', () => {
    const report = new Report('97-shelter-margin');
    const parsed = parseImport(readFileSync(EXPORT_LATEST, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');
    const input = buildPlanRequest(profile, setup);
    const req: StackRequest = input.request;
    const hp = new Map(
      req.units.map((unit) => [
        unit.id,
        effectiveUnit(unit, req.totals, req.enemy, req.activeEvents).hpPerUnit,
      ]),
    );
    const troopIds = req.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
    const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
    const plan = planCampaign(input);
    const sweet = plan.recommend;
    if (!sweet) throw new Error('no sweet spot');
    const stackHp = (id: string, counts: Record<string, number>): number =>
      (counts[id] ?? 0) * (hp.get(id) ?? 0);
    const price = (counts: Record<string, number>) => {
      const ev = evaluateCounts(req, counts);
      const burn = mercIds.reduce((sum, id) => sum + Math.ceil((counts[id] ?? 0) / 10), 0);
      const topMerc = Math.max(...mercIds.map((id) => stackHp(id, counts)));
      const troopsBelow = troopIds.filter(
        (id) => (counts[id] ?? 0) > 0 && stackHp(id, counts) < topMerc,
      ).length;
      const lead = req.units
        .filter((unit) => unit.pool === 'leadership')
        .reduce((sum, unit) => sum + (counts[unit.id] ?? 0) * unit.cost, 0);
      return {
        damage: ev.summary.avgDamage,
        silver: ev.summary.recovery.silver,
        gold: ev.summary.recovery.gold,
        burn,
        troopsBelow,
        lead,
        perSilver: ev.summary.avgDamage / Math.max(1, ev.summary.recovery.silver),
        perHired: ev.summary.avgDamage / Math.max(1, burn),
      };
    };

    report.h('A. The sweet spot’s stacks');
    report.add(
      `Owner's export (rev ${n(profile.rev)}), ${n(req.housing.leadership)} leadership, the app's plan: the sweet spot burns ` +
        `${n(sweet.repeat.mercLost)} a march for ${n(sweet.repeat.damage)} damage and ${n(sweet.repeat.silver)} silver. ` +
        'The enemy kills our highest-HP living stack whole, so HP is an order and a count is a strike.\n',
    );
    report.add(
      `The bar: ${plan.alternatives.map((row) => `${row.pick} ${n(row.repeat.mercLost)} burned / ${n(row.repeat.damage)} / ${n(row.repeat.silver)} (${row.shape})`).join(' · ')}.\n`,
    );
    report.add('| stack | count | HP a unit | stack HP | its strike |\n|---|---|---|---|---|');
    const stacks = [...troopIds, ...mercIds]
      .filter((id) => (sweet.counts[id] ?? 0) > 0)
      .sort((a, b) => stackHp(b, sweet.counts) - stackHp(a, sweet.counts));
    for (const id of stacks) {
      const unit = req.units.find((entry) => entry.id === id);
      if (!unit) continue;
      const eff = effectiveUnit(unit, req.totals, req.enemy, req.activeEvents);
      const count = sweet.counts[id] ?? 0;
      const strike = Math.round(
        (count * unit.strength * (100 + eff.strengthPercent + eff.strengthAgainst)) / 100,
      );
      report.add(
        `| ${short(id)}${unit.pool === 'authority' ? ' (hired)' : ''} | ${n(count)} | ${n(eff.hpPerUnit)} | ${n(count * eff.hpPerUnit)} | ${n(strike)} |`,
      );
    }
    const topMerc = Math.max(...mercIds.map((id) => stackHp(id, sweet.counts)));
    const lowestTroop = Math.min(
      ...troopIds.filter((id) => (sweet.counts[id] ?? 0) > 0).map((id) => stackHp(id, sweet.counts)),
    );
    report.add(
      `\nThe lowest troop stack holds ${n(lowestTroop)} HP against the biggest hired stack's ${n(topMerc)} — ` +
        `${((lowestTroop / topMerc - 1) * 100).toFixed(0)} % above it.`,
    );

    report.h('B. The troops scaled down together, the mercenaries unchanged');
    report.add(
      '| troops at | damage | silver | gold | burned | a silver | a hired | leadership used | troop stacks below the top hired stack | vs the sweet spot |\n' +
        '|---|---|---|---|---|---|---|---|---|---|',
    );
    const base = price(sweet.counts);
    for (const scale of SCALES) {
      const counts: Record<string, number> = { ...sweet.counts };
      for (const id of troopIds) counts[id] = Math.max(0, Math.floor((sweet.counts[id] ?? 0) * scale));
      const at = price(counts);
      report.add(
        `| ${n(Math.round(scale * 100))} % | **${n(at.damage)}** | ${n(at.silver)} | ${n(at.gold)} | ${n(at.burn)} | ` +
          `**${at.perSilver.toFixed(2)}** | **${n(Math.round(at.perHired))}** | ${n(at.lead)} | ${n(at.troopsBelow)} | ` +
          `${(((at.damage - base.damage) / base.damage) * 100).toFixed(1)} % damage, ${(((at.silver - base.silver) / base.silver) * 100).toFixed(1)} % silver |`,
      );
    }

    report.h('C. The tight ladder: every troop type just above the biggest hired stack');
    report.add(
      '| margin | damage | silver | gold | a silver | a hired | leadership used | vs the sweet spot |\n|---|---|---|---|---|---|---|---|',
    );
    for (const margin of [0.03, 0.25, 1, 3]) {
      const counts: Record<string, number> = {};
      for (const id of mercIds) counts[id] = sweet.counts[id] ?? 0;
      const floor = topMerc * (1 + margin);
      troopIds.forEach((id, index) => {
        counts[id] = Math.max(1, Math.floor((floor * 1.02 ** index) / (hp.get(id) ?? 1)));
      });
      const at = price(counts);
      report.add(
        `| ${n(Math.round(margin * 100))} % | **${n(at.damage)}** | ${n(at.silver)} | ${n(at.gold)} | **${at.perSilver.toFixed(2)}** | ` +
          `**${n(Math.round(at.perHired))}** | ${n(at.lead)}${at.lead > req.housing.leadership ? ' (over the cap)' : ''} | ` +
          `${(((at.damage - base.damage) / base.damage) * 100).toFixed(1)} % damage, ${(((at.silver - base.silver) / base.silver) * 100).toFixed(1)} % silver |`,
      );
    }
    report.save();
  }, 600_000);
});
