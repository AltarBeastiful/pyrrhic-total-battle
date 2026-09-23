/**
 * 155 — **where TotalStack buys the same damage for less silver** (2026-09-23; the owner: *"investigate the
 * silver weak spots"*).
 *
 * 153 paired every TotalStack row with our stop nearest in damage, and on some armies theirs reads the better
 * damage a silver. This takes each such **close pair** (within 10 % on damage, TotalStack ahead on damage a
 * silver), opens both repeated marches unit by unit — count, the silver its retraining costs under the app's
 * recovery plan, the damage it deals in the worst opening — and splits the gap into its two sources:
 *
 *   damage a silver = (troop damage + hired damage) / silver, and silver is (almost all) the troops' retraining
 *
 *  - **troop efficiency** — the troops' own damage per silver;
 *  - **hired share** — damage the hired stacks deal, which costs gold and not silver.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/155-the-silver-weak-spots.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const perSilver = (c: Campaign): number => (c.silver > 0 ? c.damage / c.silver : 0);

interface Unit {
  id: string;
  pool: string;
  count: number;
  silver: number;
  damage: number;
}
/** One march, unit by unit: its count, the silver its retraining costs, the damage it deals worst-opening. */
const openMarch = (request: StackRequest, counts: Record<string, number>): Unit[] => {
  const { result, summary } = planMarch(request, counts);
  const dealt = new Map<string, number>();
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor !== 'army') continue;
    dealt.set(entry.unitId, (dealt.get(entry.unitId) ?? 0) + entry.damage);
  }
  return result.stacks.map((stack) => ({
    id: stack.unitId,
    pool: stack.pool,
    count: stack.count,
    silver: recoveryCosts([stack], request.units, request.recovery).plan.silver,
    damage: dealt.get(stack.unitId) ?? 0,
  }));
};
const sum = (units: Unit[], f: (u: Unit) => number, pick: (u: Unit) => boolean = () => true): number =>
  units.filter(pick).reduce((s, u) => s + f(u), 0);
const troop = (u: Unit): boolean => u.pool === 'leadership';
const hired = (u: Unit): boolean => u.pool !== 'leadership';

describe.skipIf(!process.env.THEORY)('the silver weak spots', () => {
  it('opens every close pair TotalStack wins on damage a silver, unit by unit', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('155-the-silver-weak-spots');
    report.add('# 155 — where TotalStack buys the same damage for less silver\n');
    report.add(
      'Every close pair (our stop nearest in damage, within 10 %) where TotalStack reads the better damage a ' +
        'silver, on the bar as shipped (hired saver, fold to five, troop wall). One **repeated march** each, ' +
        'unit by unit: silver is what retraining that stack costs under the app’s recovery plan; damage is what ' +
        'it deals in the worst opening. **Troop eff.** is the troops’ own damage per silver; **hired share** the ' +
        'part of the march’s damage the hired stacks deal (gold, not silver).\n',
    );
    const summary: string[] = [
      '| use case | their row | our stop | dmg a silver (ours / theirs) | troop eff. (ours / theirs) | hired share (ours / theirs) | troop types (ours / theirs) | troops fielded (ours / theirs) | silver on troops that never strike (ours / theirs) | their hired stacks above a troop stack |',
      '|---|---|---|---|---|---|---|---|---|---|',
    ];
    const details: string[] = [];
    let pairs = 0;
    let troopSide = 0;
    let hiredSide = 0;
    let deadMore = 0;
    let exposedPairs = 0;
    let deadOurs = 0;
    let deadTheirs = 0;
    let silverOurs = 0;
    let silverTheirs = 0;

    for (const scenario of scenarios) {
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: { name: string; counts: Record<string, number>; c: Campaign }[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const c = asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts);
        if (c.damage > 0) theirs.push({ name: external.name, counts: external.counts, c });
      }
      if (theirs.length === 0) continue;
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      const ours = plan.alternatives.map((stop) => ({
        pick: SHORT[stop.pick] ?? stop.pick,
        counts: stop.counts,
        c: campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
      }));
      for (const them of theirs) {
        const near = ours.reduce((b, o) =>
          Math.abs(Math.log(o.c.damage / them.c.damage)) < Math.abs(Math.log(b.c.damage / them.c.damage))
            ? o
            : b,
        );
        if (Math.abs(near.c.damage / them.c.damage - 1) > 0.1) continue;
        if (perSilver(near.c) >= perSilver(them.c)) continue;
        pairs += 1;
        const request = widenedFor(scenario.request, them.counts);
        const a = openMarch(scenario.request, near.counts);
        const b = openMarch(request, them.counts);
        const eff = (u: Unit[]): number => {
          const s = sum(u, (x) => x.silver, troop);
          return s > 0 ? sum(u, (x) => x.damage, troop) / s : 0;
        };
        const share = (u: Unit[]): number => {
          const d = sum(u, (x) => x.damage);
          return d > 0 ? sum(u, (x) => x.damage, hired) / d : 0;
        };
        const types = (u: Unit[]): number => u.filter(troop).length;
        const fielded = (u: Unit[]): number => sum(u, (x) => x.count, troop);
        // Silver spent on troop stacks the enemy kills before they strike: the shelter's price, in the worst opening.
        const dead = (u: Unit[]): number =>
          sum(
            u,
            (x) => x.silver,
            (x) => troop(x) && x.damage <= 0,
          );
        const silverOf = (u: Unit[]): number => sum(u, (x) => x.silver);
        // Their hired stacks standing above at least one troop stack in the kill order (unsheltered, S-87).
        const exposed = (u: Unit[]): number => {
          const lastTroop = u.map((x) => troop(x)).lastIndexOf(true);
          return u.filter((x, i) => hired(x) && i < lastTroop).length;
        };
        if (dead(a) > dead(b)) deadMore += 1;
        if (exposed(b) > 0) exposedPairs += 1;
        deadOurs += dead(a);
        deadTheirs += dead(b);
        silverOurs += silverOf(a);
        silverTheirs += silverOf(b);
        // Which side of the ratio explains the gap: the troops' own efficiency, or the hired share.
        if (eff(b) > eff(a)) troopSide += 1;
        if (share(b) > share(a)) hiredSide += 1;
        summary.push(
          `| ${scenario.label.slice(0, 36)} | ${them.name.replace('TotalStack · ', '')} | ${near.pick} | ` +
            `${perSilver(near.c).toFixed(3)} / ${perSilver(them.c).toFixed(3)} | ${eff(a).toFixed(3)} / ${eff(b).toFixed(3)} | ` +
            `${(share(a) * 100).toFixed(0)} % / ${(share(b) * 100).toFixed(0)} % | ${String(types(a))} / ${String(types(b))} | ` +
            `${n(fielded(a))} / ${n(fielded(b))} | ${((dead(a) / Math.max(1, silverOf(a))) * 100).toFixed(0)} % / ${((dead(b) / Math.max(1, silverOf(b))) * 100).toFixed(0)} % | ${String(exposed(b))} |`,
        );
        const table = (units: Unit[]): string =>
          '| unit | pool | count | silver | damage (worst opening) | damage a silver |\n|---|---|---:|---:|---:|---:|\n' +
          units
            .map(
              (u) =>
                `| ${u.id} | ${u.pool} | ${n(u.count)} | ${n(Math.round(u.silver))} | ${n(Math.round(u.damage))} | ${
                  u.silver > 0 ? (u.damage / u.silver).toFixed(3) : '—'
                } |`,
            )
            .join('\n') +
          `\n| **total** | | | **${n(Math.round(sum(units, (x) => x.silver)))}** | **${n(Math.round(sum(units, (x) => x.damage)))}** | ` +
          `**${(
            sum(units, (x) => x.damage) /
            Math.max(
              1,
              sum(units, (x) => x.silver),
            )
          ).toFixed(3)}** |`;
        details.push(
          `\n## ${scenario.label} — ${them.name} against our ${near.pick}\n\nCampaign: ours ${n(near.c.damage)} for ${n(near.c.silver)} ` +
            `silver (${perSilver(near.c).toFixed(3)}); theirs ${n(them.c.damage)} for ${n(them.c.silver)} (${perSilver(them.c).toFixed(3)}).\n\n` +
            `**Ours — ${near.pick}, repeated march**\n\n${table(a)}\n\n**Theirs — ${them.name}**\n\n${table(b)}`,
        );
      }
    }
    report.add(`## Summary — ${String(pairs)} close pairs where TotalStack wins on damage a silver\n`);
    report.add(summary.join('\n'));
    report.add(
      `\n\nTheir troops are the more efficient a silver in **${String(troopSide)} of ${String(pairs)}** pairs; ` +
        `their hired stacks deal the larger share in **${String(hiredSide)} of ${String(pairs)}**. ` +
        `We spend more silver on troops that never strike in **${String(deadMore)} of ${String(pairs)}** — ` +
        `${((deadOurs / Math.max(1, silverOurs)) * 100).toFixed(1)} % of our silver across the pairs against ` +
        `${((deadTheirs / Math.max(1, silverTheirs)) * 100).toFixed(1)} % of theirs — and TotalStack’s march leaves a ` +
        `hired stack above a troop stack in **${String(exposedPairs)} of ${String(pairs)}**.\n`,
    );
    report.add(details.join('\n'));
    report.save();
  }, 3_600_000);
});
