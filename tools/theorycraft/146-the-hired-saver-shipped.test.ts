/**
 * 146 — **the hired saver, as the engine ships it** (W10, `docs/plans/the-stops-the-bar-offers.md`, 2026-09-23).
 *
 * 145 priced rule B by pricing a frontier row beside the bar's stops. The engine does more to a stop than
 * that: the put-back pass re-sizes it, the "burning more buys more" walk may hand it its generated march
 * back, the dedupe runs again, the tail is appended and the `all-in` may be dropped against it. So this
 * experiment runs `planCampaign` itself, three times an army — the bar as it stands, and the hired saver
 * with each of its two tie-breaks (`CampaignInput.burnSaver`) — and reads what the bar **offers**:
 *
 *  - the seven readings of the plan's §1, the bar's best on each, against the bar as it stands;
 *  - matched spend against every captured row (145's 47 dominated / 13 no-fit is the figure to reproduce);
 *  - the bar criteria on the new stop: in the band, more than one troop stack, burning more buys more
 *    (S-61) and no stop beaten by another on every figure it prints (S-93).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/146-the-hired-saver-shipped.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const MARKERS = [
  'damage',
  'damage a silver',
  'damage a merc',
  'damage a gold',
  'damage a coin',
  'least silver',
  'least burn',
] as const;

const readings = (set: Campaign[]): Record<string, number> => ({
  damage: Math.max(...set.map((c) => c.damage)),
  'damage a silver': Math.max(...set.map((c) => (c.silver > 0 ? c.damage / c.silver : 0))),
  'damage a merc': Math.max(...set.map((c) => c.hiredDamage / Math.max(1, c.burned))),
  'damage a gold': Math.max(...set.map((c) => (c.gold > 0 ? c.damage / c.gold : 0))),
  'damage a coin': Math.max(...set.map((c) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0))),
  'least silver': -Math.min(...set.map((c) => c.silver)),
  'least burn': -Math.min(...set.map((c) => c.burned)),
});

/** At least the damage, at most every cost the row prints, strictly better on one. */
const beatsOnFigures = (a: PlanRow, b: PlanRow): boolean => {
  const costs = (r: PlanRow): number[] => [r.silver, r.mercLost, r.gold, r.dragonCoins];
  if (a.totalDamage < b.totalDamage) return false;
  const ca = costs(a);
  const cb = costs(b);
  if (ca.some((c, i) => c > (cb[i] ?? 0))) return false;
  return a.totalDamage > b.totalDamage || ca.some((c, i) => c < (cb[i] ?? 0));
};

/**
 * `RECOVERY=retrain` or `RECOVERY=revive` re-runs the whole experiment under that recovery plan (the plan's §7
 * first risk, as 138 did for §2); unset, it is the app's own default and the report keeps its name.
 */
const SETTING = process.env.RECOVERY;
const withSetting = (request: StackRequest): StackRequest =>
  SETTING === 'retrain' || SETTING === 'revive'
    ? { ...request, recovery: { ...request.recovery, plan: { mode: SETTING } } }
    : request;

describe.skipIf(!process.env.THEORY)('the hired saver, shipped', () => {
  it('runs the engine with and without the new stop on every benchmark army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report(`146-the-hired-saver-shipped${SETTING ? `-${SETTING}` : ''}`);
    report.add('# 146 — the hired saver, as the engine ships it\n');
    report.add(
      'The engine run three times an army: **today** (no hired saver), **silver** (the saver, ties to the ' +
        'cheapest — 145’s reading) and **damage** (ties to the hardest-hitting — the plan’s §4.2). Every ' +
        'figure is what `planCampaign` offers after the put-back pass, the tail and the dedupe, priced at ' +
        'the app’s default recovery.\n',
    );
    const VARIANTS = ['today', 'silver', 'damage', 'guard', 'fold'] as const;
    type Variant = (typeof VARIANTS)[number];
    const tally: Record<Variant, { beaten: number; unfitted: number; stops: number; offered: number }> = {
      today: { beaten: 0, unfitted: 0, stops: 0, offered: 0 },
      silver: { beaten: 0, unfitted: 0, stops: 0, offered: 0 },
      damage: { beaten: 0, unfitted: 0, stops: 0, offered: 0 },
      guard: { beaten: 0, unfitted: 0, stops: 0, offered: 0 },
      fold: { beaten: 0, unfitted: 0, stops: 0, offered: 0 },
    };
    const floorsDown: Record<Variant, Record<string, number>> = { today: {}, silver: {}, damage: {}, guard: {}, fold: {} };
    const moved: string[] = [];
    const criteria: string[] = [];
    const table: string[] = [
      '| army | today | silver | damage | guard | fold | the saver (silver tie) · burn · damage · silver | other stops moved |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const base0 of scenarios) {
      const scenario = { ...base0, request: withSetting(base0.request) };
      const plans: Partial<Record<Variant, CampaignPlan>> = {};
      for (const variant of VARIANTS) {
        try {
          plans[variant] = planCampaign({
            request: scenario.request,
            marchTarget: HORIZON,
            budgetMs: CAMPAIGN.budgets.plan,
            ...CAMPAIGN.planFixes,
            putBack: CAMPAIGN.putBack,
            // Explicit both ways: the app's own plan fixes carry the shipped setting, and today is the bar without it.
            burnSaver: variant === 'today' ? undefined : variant,
          });
        } catch {
          /* no plan for this army */
        }
      }
      const base = plans.today;
      if (!base || base.alternatives.length === 0) continue;
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts));
      }
      const priced = (plan: CampaignPlan): Campaign[] =>
        plan.alternatives.map((stop) =>
          campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
        );
      const baseReadings = readings(priced(base));
      const said: string[] = [];
      let saverCell = '—';
      let movedCell = '';
      for (const variant of VARIANTS) {
        const plan = plans[variant];
        if (!plan) {
          said.push('no plan');
          continue;
        }
        const set = priced(plan);
        const entry = tally[variant];
        entry.stops += plan.alternatives.length;
        if (plan.alternatives.some((row) => row.pick === 'burn-saver')) entry.offered += 1;
        if (theirs.length > 0) {
          const verdict = matchedSpend(set as Contender[], theirs as Contender[]);
          entry.beaten += verdict.rowsBeaten;
          entry.unfitted += verdict.unfitted;
          said.push(
            `${String(verdict.rowsBeaten)} beat · ${String(verdict.unfitted)} out · ${String(plan.alternatives.length)} stops`,
          );
        } else {
          said.push(`— · ${String(plan.alternatives.length)} stops`);
        }
        const mine = readings(set);
        for (const marker of MARKERS) {
          if ((mine[marker] ?? 0) < (baseReadings[marker] ?? 0) - 1e-9) {
            floorsDown[variant][marker] = (floorsDown[variant][marker] ?? 0) + 1;
            moved.push(
              `**${scenario.label.slice(0, 50)}** (${variant}) — ${marker}: ` +
                `${n(baseReadings[marker] ?? 0)} → ${n(mine[marker] ?? 0)}`,
            );
          }
        }
        // Did any stop the bar already offered change? Adding a stop must leave the others alone.
        const key = (r: PlanRow): string => `${r.pick}|${JSON.stringify(r.counts)}|${String(r.totalDamage)}`;
        const before = new Set(base.alternatives.map(key));
        const after = new Set(plan.alternatives.filter((r) => r.pick !== 'burn-saver').map(key));
        const lost = [...before].filter((k) => !after.has(k)).map((k) => k.split('|')[0]);
        const gained = [...after].filter((k) => !before.has(k)).map((k) => k.split('|')[0]);
        if (variant !== 'today' && lost.length + gained.length > 0) {
          movedCell += `${variant}: lost ${lost.join(', ')}; new ${gained.join(', ')}. `;
        }
        const saver = plan.alternatives.find((row) => row.pick === 'burn-saver');
        if (variant === 'silver' && saver) {
          saverCell = `${String(saver.mercLost)} · ${n(saver.totalDamage)} · ${n(saver.silver)}`;
        }
        // The criteria, on the whole bar as offered.
        const ordered = plan.alternatives.filter((row) => row.pick !== 'all-in');
        for (let i = 1; i < ordered.length; i += 1) {
          const prev = ordered[i - 1] as PlanRow;
          const cur = ordered[i] as PlanRow;
          if (cur.repeat.damage <= prev.repeat.damage || cur.repeat.mercLost <= prev.repeat.mercLost) {
            criteria.push(
              `**${scenario.label.slice(0, 50)}** (${variant}) — S-61: ${cur.pick} ${n(cur.repeat.damage)} at ` +
                `${String(cur.repeat.mercLost)} burned, ${n(cur.repeat.silver)} silver, is not above ${prev.pick} ` +
                `${n(prev.repeat.damage)} at ${String(prev.repeat.mercLost)}, ${n(prev.repeat.silver)} silver`,
            );
          }
        }
        for (const a of plan.alternatives) {
          for (const b of plan.alternatives) {
            if (a !== b && beatsOnFigures(a, b)) {
              criteria.push(
                `**${scenario.label.slice(0, 50)}** (${variant}) — S-93: ${a.pick} beats ${b.pick} on every figure`,
              );
            }
          }
        }
        if (saver) {
          const troopStacks = Object.keys(saver.counts).filter(
            (id) => scenario.request.units.find((u) => u.id === id)?.pool === 'leadership',
          ).length;
          if (troopStacks < 2) {
            criteria.push(`**${scenario.label.slice(0, 50)}** (${variant}) — the saver fields ${String(troopStacks)} troop stack`);
          }
        }
      }
      table.push(`| ${scenario.label.slice(0, 40)} | ${said.join(' | ')} | ${saverCell} | ${movedCell} |`);
    }
    report.add(table.join('\n'));
    report.add(
      '\n## Totals\n\n| variant | rows dominated | rows no stop fits | stops over all armies | armies offered the saver |\n' +
        '|---|---:|---:|---:|---:|\n' +
        VARIANTS.map(
          (v) =>
            `| ${v} | ${String(tally[v].beaten)} | ${String(tally[v].unfitted)} | ${String(tally[v].stops)} | ${String(tally[v].offered)} |`,
        ).join('\n'),
    );
    report.add(
      '\n\n## Armies where the bar’s best reads worse than today\n\n| variant | ' +
        MARKERS.join(' | ') +
        ' |\n|---|' +
        '---:|'.repeat(MARKERS.length) +
        '\n' +
        (['silver', 'damage', 'guard', 'fold'] as const)
          .map((v) => `| ${v} | ${MARKERS.map((m) => String(floorsDown[v][m] ?? 0)).join(' | ')} |`)
          .join('\n') +
        (moved.length > 0 ? `\n\n- ${moved.join('\n- ')}` : '\n\nNone, on any marker.'),
    );
    report.add(
      '\n\n## Bar criteria on the new bar\n\n' +
        (criteria.length > 0 ? `- ${criteria.join('\n- ')}` : 'Every bar holds S-61, S-93 and the two-stack rule.'),
    );
    report.save();
  }, 7_200_000);
});
