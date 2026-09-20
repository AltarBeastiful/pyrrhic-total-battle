/**
 * 117 — **can the bar answer the questions the Objective select answers?** (owner, 2026-09-20: *"the added
 * bonus of total opti vs the ladder objective select is insight… in the long term we might not even need the
 * other optimization techniques."*)
 *
 * The Objective select runs the priority search over subsets of the army and returns **one march** — the best
 * on the objective asked. The plan returns **a bar of stops**. If the bar's stops already contain the march
 * each objective would have returned, the select is a second way to ask a question the bar answers better,
 * because the bar shows the alternatives beside the answer. If they do not, the two are genuinely different
 * tools and the select has to stay.
 *
 * Measured on both sides of the hired line: an army that hires nothing (where S-111's planner answers) and
 * the owner's own export (where the campaign search does). Every figure is `simulateBattle` on the counts,
 * damage being the **worst opening**; the objective rows are the priority search exactly as Generate runs it.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/117-bar-versus-objectives.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import type { Objective } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { EXPORT_2026_09_17, Report, evaluateCounts, n } from './harness';

const OBJECTIVES: Objective[] = ['avgDamage', 'minDamage', 'damagePerSilver', 'damagePerGold'];

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  const setup = profile?.setups[0];
  if (!profile || !setup) throw new Error('no first-run profile');
  return { profile, setup };
}

describe.skipIf(!process.env.THEORY)('the bar against the objectives', () => {
  it('asks each objective of both, and reads the answers side by side', () => {
    const report = new Report('117-bar-versus-objectives');

    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const own = parsed.payload;
    const ownSetup = own.setups[0];
    if (!ownSetup) throw new Error('no setup');
    const { profile: fresh, setup: freshSetup } = firstRun();

    for (const [name, profile, setup] of [
      [
        'a first-run army, 12 000 leadership (hires nothing)',
        fresh,
        { ...freshSetup, housing: { ...freshSetup.housing, leadership: 12_000 } },
      ],
      ['the 2026-09-17 export, its own setup (four hired types)', own, ownSetup],
    ] as const) {
      report.h(name);
      const base = buildStackRequest(profile, setup);
      const priceOf = (counts: Record<string, number>) => {
        const { result, summary } = evaluateCounts(base, counts);
        const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
        return { damage: summary.minDamage, silver: bill.silver, seconds: bill.seconds, gold: bill.gold };
      };

      const stops = planCampaign(buildPlanRequest(profile, setup)).alternatives;
      const stopMarches = stops.map((stop) => ({ pick: stop.pick, ...priceOf(stop.counts) }));

      report.add('');
      report.add('| objective | the priority search answers | the best stop answers | the bar’s shortfall |');
      report.add('|---|---|---|---|');
      for (const objective of OBJECTIVES) {
        const found = searchPriority({ request: base, objective, budgetMs: 8_000 });
        const searched = priceOf(
          Object.fromEntries(found.result.stacks.map((stack) => [stack.unitId, stack.count])),
        );
        /** The reading each objective is scored on, all on the worst opening so the two sides agree. */
        const score = (one: { damage: number; silver: number; gold: number }): number => {
          if (objective === 'damagePerSilver') return one.silver > 0 ? one.damage / one.silver : 0;
          if (objective === 'damagePerGold') return one.gold > 0 ? one.damage / one.gold : Infinity;
          return one.damage;
        };
        const best = stopMarches.reduce((top, one) => (score(one) > score(top) ? one : top));
        const gap = score(searched) > 0 ? (score(best) / score(searched)) * 100 : 100;
        report.add(
          `| ${objective} | ${n(Math.round(score(searched) * 1000) / 1000)} (${n(searched.damage)} damage, ${n(
            searched.silver,
          )} silver) | ${best.pick}: ${n(Math.round(score(best) * 1000) / 1000)} (${n(best.damage)}, ${n(
            best.silver,
          )}) | **${n(Math.round((100 - gap) * 10) / 10)} %** |`,
        );
      }

      report.add('');
      report.add('The bar itself, for reference:');
      report.add('');
      report.add('| stop | damage | silver | queue (s) | gold |');
      report.add('|---|---|---|---|---|');
      for (const one of stopMarches) {
        report.add(
          `| ${one.pick} | ${n(one.damage)} | ${n(one.silver)} | ${n(one.seconds)} | ${n(one.gold)} |`,
        );
      }
    }
    report.save();
  }, 600_000);
});
