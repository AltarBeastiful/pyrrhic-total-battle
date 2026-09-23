/**
 * 156 — **the cheapest sponge** (2026-09-23; the owner: *"try the cheapest HP per silver sponge as an experiment.
 * But first answer this question: are we not checking every troop allocation possible so that we properly use
 * lower tier troops as a first sponge? Do we have equal health troops in the SP1 / ARC2 example you mentioned?
 * And why do monsters take so much more time?"*).
 *
 * **§A — the evening pair, stack by stack.** The all-in's repeated march on the evening account (experiment
 * 155's worst pair): every stack in the battle's kill order, its HP, its silver, what it deals worst-opening —
 * and every troop type the account holds, with its HP, its silver and its leadership a unit, so "which troop is
 * the cheapest sponge" is read off the table rather than asserted.
 *
 * **§B — what the plan costs to compute, army by army.** Wall time of one `planCampaign`, the hired types and
 * pools the army holds, and how many plans the search summarised, kept undominated and let into the band.
 *
 * **§C — the sponge swap, on every stop of every army.** A troop stack the enemy kills before it strikes deals
 * nothing and costs its whole retraining. Each such stack is replaced, one for one, by a stack of the same HP
 * (one unit more, so the kill order holds) of the **cheapest silver a point of HP** troop type the account holds
 * that the march does not already field striking — each type once, as the game allows. The swap is kept only
 * where the leadership fits. Every stop is priced before and after on the ten criteria, over the whole
 * campaign, with the shelter re-checked (every hired stack under the lowest troop stack).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/156-the-cheapest-sponge.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { PlanTotals } from '../../src/engine/plan';
import { effectiveTable, planCampaign } from '../../src/engine/plan';
import { retrainOne } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const READINGS = [
  { head: 'damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'hired lost', of: (c: Campaign) => c.burned, high: false },
  { head: 'gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg a silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg a merc', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg a gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg a coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const show = (r: Reading, v: number): string => {
  if (r.head === 'queue') return `${n(Math.round(v / 3600))} h`;
  if (r.head === 'dmg a silver') return v.toFixed(3);
  if (r.head === 'dmg a coin' && v === 0) return '—';
  return n(Math.round(v));
};
const change = (r: Reading, a: number, b: number): string => {
  if (Math.abs(a - b) < 1e-9) return show(r, b);
  const x = a !== 0 ? ((r.high ? b - a : a - b) / Math.abs(a)) * 100 : 0;
  return `**${show(r, b)} (${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)} %)**`;
};

/** Silver a unit and HP a unit of every troop type the request holds, under the request's own recovery plan. */
const troopTable = (
  request: StackRequest,
): { id: string; hp: number; silver: number; leadership: number; perHp: number; damagePerHp: number }[] =>
  effectiveTable(request)
    .filter((e) => e.pool === 'leadership')
    .map((e) => {
      const silver = retrainOne(e.unit, 1000, request.recovery).silver / 1000;
      return {
        id: e.id,
        hp: e.hp,
        silver,
        leadership: e.cost,
        perHp: silver / e.hp,
        damagePerHp: e.damagePerUnit / e.hp,
      };
    });

/** One march, the battle's reading: every stack in kill order, its HP, and what it dealt worst-opening. */
const opened = (request: StackRequest, counts: Record<string, number>) => {
  const { result, summary } = planMarch(request, counts);
  const dealt = new Map<string, number>();
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor === 'army') dealt.set(entry.unitId, (dealt.get(entry.unitId) ?? 0) + entry.damage);
  }
  return result.stacks.map((s) => ({ ...s, dealt: dealt.get(s.unitId) ?? 0 }));
};

/** The swap on one march: the counts after it, or null when the leadership does not fit or nothing is dead. */
const swapped = (
  request: StackRequest,
  counts: Record<string, number>,
): { counts: Record<string, number>; swaps: string[] } | null => {
  const stacks = opened(request, counts);
  const dead = stacks.filter((s) => s.pool === 'leadership' && s.dealt <= 0);
  if (dead.length === 0) return null;
  const striking = new Set(stacks.filter((s) => s.pool === 'leadership' && s.dealt > 0).map((s) => s.unitId));
  const table = troopTable(request)
    .filter((t) => !striking.has(t.id))
    .sort((a, b) => a.perHp - b.perHp);
  // Biggest dead stack gets the cheapest type, and so on: each type once.
  const slots = [...dead].sort((a, b) => b.totalHp - a.totalHp);
  const next: Record<string, number> = { ...counts };
  for (const s of dead) delete next[s.unitId];
  const swaps: string[] = [];
  slots.forEach((slot, i) => {
    const t = table[i];
    if (!t) return;
    const count = Math.floor(slot.totalHp / t.hp) + 1;
    next[t.id] = count;
    swaps.push(`${slot.unitId} ${n(slot.count)} → ${t.id} ${n(count)}`);
  });
  const used = Object.entries(next).reduce((sum, [id, c]) => {
    const t = troopTable(request).find((x) => x.id === id);
    return sum + (t ? t.leadership * c : 0);
  }, 0);
  if (used > request.housing.leadership) return null;
  return { counts: next, swaps };
};

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const stacks = opened(request, counts);
  const troops = stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};

describe.skipIf(!process.env.THEORY)('the cheapest sponge', () => {
  it('answers the three questions and swaps the sponge on every stop', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('156-the-cheapest-sponge');
    report.add('# 156 — the cheapest sponge\n');
    report.add(
      'The bar as shipped (hired saver, fold to five, troop wall). Four-march campaigns, worst opening, default ' +
        'recovery; silver is what retraining a stack costs under that recovery plan.\n',
    );

    const plans = new Map<string, { plan: ReturnType<typeof planCampaign>; ms: number }>();
    const timing: string[] = [
      '| use case | plan time | hired types (authority / dominance) | plans summarised | undominated | in the band | stops |',
      '|---|---:|---|---:|---:|---:|---:|',
    ];
    for (const scenario of scenarios) {
      const started = performance.now();
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
          withFrontier: true,
        });
      } catch {
        continue;
      }
      const ms = performance.now() - started;
      plans.set(scenario.label, { plan, ms });
      const f = plan.frontier ?? [];
      const auth = scenario.request.units.filter((u) => u.pool === 'authority').length;
      const dom = scenario.request.units.filter((u) => u.pool === 'dominance').length;
      timing.push(
        `| ${scenario.label.slice(0, 52)} | ${n(Math.round(ms))} ms | ${String(auth)} / ${String(dom)} | ` +
          `${n(f.filter((r) => r.onFrontier).length)} | ${n(f.filter((r) => r.undominated).length)} | ` +
          `${n(f.filter((r) => r.undominated && r.inBand).length)} | ${String(plan.alternatives.length)} |`,
      );
    }

    // §A — the evening pair.
    const evening = scenarios.find((s) => s.label.startsWith('live account, evening'));
    const eveningPlan = evening ? plans.get(evening.label)?.plan : undefined;
    const allIn = eveningPlan?.alternatives.find((r) => r.pick === 'all-in');
    let partA = '';
    if (evening && allIn) {
      const stacks = opened(evening.request, allIn.counts);
      const table = troopTable(evening.request);
      partA =
        '| stack (kill order) | pool | count | HP | silver | dealt worst-opening |\n|---|---|---:|---:|---:|---:|\n' +
        stacks
          .map((s) => {
            const t = table.find((x) => x.id === s.unitId);
            return (
              `| ${s.unitId} | ${s.pool} | ${n(s.count)} | ${n(Math.round(s.totalHp))} | ` +
              `${t ? n(Math.round(t.silver * s.count)) : '0 (hired: gold)'} | ${n(Math.round(s.dealt))} |`
            );
          })
          .join('\n') +
        '\n\nEvery troop type the account holds, cheapest silver a point of HP first:\n\n' +
        '| troop | HP a unit | silver a unit | leadership a unit | silver a 1 000 HP | damage a 1 000 HP |\n|---|---:|---:|---:|---:|---:|\n' +
        [...table]
          .sort((a, b) => a.perHp - b.perHp)
          .map(
            (t) =>
              `| ${t.id} | ${n(t.hp)} | ${n(Math.round(t.silver))} | ${String(t.leadership)} | ${(t.perHp * 1000).toFixed(1)} | ${(t.damagePerHp * 1000).toFixed(1)} |`,
          )
          .join('\n');
    }

    // §C — the swap, on every stop.
    const swapRows: string[] = [];
    const tally = { stops: 0, withDead: 0, swapped: 0, noRoom: 0, better: 0, worseDamage: 0, unsheltered: 0 };
    let silverBefore = 0;
    let silverAfter = 0;
    for (const scenario of scenarios) {
      const entry = plans.get(scenario.label);
      if (!entry) continue;
      for (const stop of entry.plan.alternatives) {
        tally.stops += 1;
        const marches = marchesOf(stop as PlanTotals);
        const before = campaignOf(scenario.request, stop.pick, 'plan', marches);
        const results = marches.map((m) => swapped(scenario.request, m));
        const anyDead = marches.some((m) =>
          opened(scenario.request, m).some((s) => s.pool === 'leadership' && s.dealt <= 0),
        );
        if (!anyDead) continue;
        tally.withDead += 1;
        if (results.every((r) => r === null)) {
          tally.noRoom += 1;
          continue;
        }
        const after = marches.map((m, i) => results[i]?.counts ?? m);
        const priced = campaignOf(scenario.request, stop.pick, 'plan', after);
        const shelterHolds = after.every((m) => sheltered(scenario.request, m));
        tally.swapped += 1;
        if (!shelterHolds) tally.unsheltered += 1;
        if (priced.damage < before.damage - 1e-6) tally.worseDamage += 1;
        const perSilver = (c: Campaign): number => (c.silver > 0 ? c.damage / c.silver : 0);
        if (perSilver(priced) > perSilver(before)) tally.better += 1;
        silverBefore += before.silver;
        silverAfter += priced.silver;
        const swaps = results.find((r) => r !== null)?.swaps ?? [];
        swapRows.push(
          `| ${scenario.label.slice(0, 34)} | ${SHORT[stop.pick] ?? stop.pick} | ${swaps.join('; ')} | ` +
            READINGS.map((r) => change(r, r.of(before), r.of(priced))).join(' | ') +
            ` | ${shelterHolds ? '✓' : '**✗**'} |`,
        );
      }
    }

    report.add('## §A — the evening pair: the all-in’s repeated march, stack by stack\n');
    report.add(partA || 'No all-in on the evening bar.');
    report.add('\n\n## §B — what the plan costs to compute\n');
    report.add(timing.join('\n'));
    report.add('\n\n## §C — the cheapest sponge, swapped in on every stop\n');
    report.add(
      `${String(tally.stops)} stops in all; **${String(tally.withDead)}** field a troop stack that dies before it strikes; ` +
        `the swap fits the leadership on **${String(tally.swapped)}** (${String(tally.noRoom)} have no room). Of those, ` +
        `**${String(tally.better)}** read a better damage a silver, **${String(tally.worseDamage)}** lose damage, and ` +
        `**${String(tally.unsheltered)}** would leave a hired stack unsheltered. Silver over the swapped stops: ` +
        `${n(Math.round(silverBefore))} → ${n(Math.round(silverAfter))} (${((silverAfter / Math.max(1, silverBefore) - 1) * 100).toFixed(1)} %).\n\n` +
        '| use case | stop | swap (first march) | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | shelter |\n|---|---|---|' +
        '---|'.repeat(READINGS.length) +
        '---|\n' +
        swapRows.join('\n') +
        '\n',
    );
    report.save();
  }, 3_600_000);
});
