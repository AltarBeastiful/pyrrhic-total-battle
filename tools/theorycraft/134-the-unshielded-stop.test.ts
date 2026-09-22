/**
 * 134 — **what an unshielded stop would cost, on every army** (W4, S-126, 2026-09-22; the owner, on being
 * offered one: *"sure but I guess hired lost would go up ? lets test it anyway"*).
 *
 * Experiment 133 settled that the worst opening does not condemn an unshielded march — on the live camp it
 * is 5.9× the same vector sheltered, at identical silver. What it did not answer is the owner's own
 * question, which is about the **price**: an unshielded march fields the whole authority pool, so the chunks
 * of ten it loses go up with it. Whether that is worth paying is not a matter of opinion, because §0 already
 * fixes the test — a stop is only a beat if it spends **no more of any of the four costs** than the march it
 * is compared against.
 *
 * So this prices the unshielded march as a **campaign**, the way the bar's stops are priced, and puts it
 * beside two things: the bar's own best stop today, and TotalStack's hardest comparable answer. No engine
 * change — the stop does not exist yet, and the point of this file is to decide whether it should.
 *
 * **Played as a repeated march on a draining stock**, which is what a *stop* is: the same counts every march,
 * each hired type clamped to what it has left, a chunk of ten gone per stack fielded. That is deliberately
 * not what `Tier ladder · all types` is on the benchmark — that row **re-sizes** every march — and the two
 * differ by more than a rounding: the diagnosis of 2026-09-22 measured repeating the march at 49,195,015
 * against re-sizing it at 43,923,310 on the live camp, because re-sizing spends the shrinking stock on a
 * shape that keeps shrinking with it.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/134-the-unshielded-stop.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { simulateBattle } from '../../src/engine/battle';
import { buildKillOrder } from '../../src/engine/killOrder';
import { planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { Stack, StackRequest, StackResult } from '../../src/engine/types';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

interface Priced {
  damage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
  burned: number;
}

const ZERO: Priced = { damage: 0, silver: 0, gold: 0, dragonCoins: 0, seconds: 0, burned: 0 };

/** One march from explicit counts, in the game's kill order, priced on the worst opening. */
function priceMarch(request: StackRequest, counts: Record<string, number>): Priced {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    });
  }
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));
  const result: StackResult = {
    stacks,
    pools: {
      leadership: { used: 0, capacity: request.housing.leadership },
      authority: { used: 0, capacity: request.housing.authority },
      dominance: { used: 0, capacity: request.housing.dominance },
    },
    dropped: [],
    warnings: [],
  };
  const summary = simulateBattle(result, request);
  const burned = request.units
    .filter((unit) => unit.pool === 'authority')
    .reduce((sum, unit) => sum + chunks(counts[unit.id] ?? 0), 0);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    dragonCoins: summary.recovery.dragonCoins,
    seconds: summary.recovery.seconds,
    burned,
  };
}

const add = (a: Priced, b: Priced): Priced => ({
  damage: a.damage + b.damage,
  silver: a.silver + b.silver,
  gold: a.gold + b.gold,
  dragonCoins: a.dragonCoins + b.dragonCoins,
  seconds: a.seconds + b.seconds,
  burned: a.burned + b.burned,
});

/** The same march every turn, each hired type clamped to what its stock has left — a *stop*, not a sequence. */
function repeated(request: StackRequest, counts: Record<string, number>): Priced {
  const hiredIds = request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
  const caps = { ...request.caps };
  let total = ZERO;
  for (let march = 0; march < HORIZON; march += 1) {
    const played = { ...counts };
    for (const id of hiredIds) {
      const cap = caps[id];
      if (cap !== undefined) played[id] = Math.min(played[id] ?? 0, cap);
    }
    if (Object.values(played).every((count) => count <= 0)) break;
    total = add(total, priceMarch(request, played));
    for (const id of hiredIds) {
      if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(played[id] ?? 0));
    }
  }
  return total;
}

const COSTS = ['silver', 'gold', 'dragonCoins', 'burned'] as const;
const fits = (ours: Priced, theirs: Priced): boolean =>
  COSTS.every((cost) => ours[cost] <= theirs[cost] * 1.05);

describe.skipIf(!process.env.THEORY)('what an unshielded stop would cost', () => {
  it('prices it on every army, against the bar and against TotalStack', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('134-the-unshielded-stop');
    report.add('# 134 — what an unshielded stop would cost, army by army\n');
    report.add(
      'The owner, agreeing to one: *"sure but I guess hired lost would go up ? lets test it anyway"*. It ' +
        'does go up — the march fields the whole authority pool — and §0 already says what that is worth: a ' +
        'stop beats a rival march only when it spends **no more of any of the four costs**. So the column ' +
        'that decides is not the damage, it is **fits**.\n',
    );
    report.add(
      '`unshielded` is `sizeStacks` under the method named, **repeated** for the horizon on a draining ' +
        'stock. `bar` is the plan’s best stop today. `theirs` is the hardest comparable captured march. ' +
        'Damage is the worst opening throughout.\n',
    );
    const rows: string[] = [
      '| army | march | damage | silver | **burned** | gold | coins | vs bar | fits theirs? |',
      '|---|---|---|---|---|---|---|---|---|',
    ];
    let better = 0;
    let fitting = 0;
    let measured = 0;
    for (const scenario of scenarios) {
      const request = scenario.request;
      // The bar today.
      let bar: Priced | null = null;
      try {
        const plan = planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
        const best = plan.alternatives.reduce((a, b) => (b.totalDamage > a.totalDamage ? b : a));
        bar = {
          damage: best.totalDamage,
          silver: best.silver,
          gold: best.gold,
          dragonCoins: best.dragonCoins ?? 0,
          seconds: best.seconds,
          burned: best.mercLost,
        };
      } catch {
        bar = null;
      }
      // Their hardest comparable march, priced by our engine exactly as the benchmark prices it.
      const held = new Set(request.units.map((unit) => unit.id));
      let theirs: Priced | null = null;
      for (const external of totalstackRows(scenario.label)) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const priced = repeated(widenedFor(request, external.counts), external.counts);
        if (!theirs || priced.damage > theirs.damage) theirs = priced;
      }
      for (const method of ['elite', 'ms'] as const) {
        const counts = Object.fromEntries(
          sizeStacks({ ...request, options: { ...request.options, method } }).stacks.map((s) => [
            s.unitId,
            s.count,
          ]),
        );
        const ours = repeated(request, counts);
        const vsBar = bar && bar.damage > 0 ? `${((ours.damage / bar.damage - 1) * 100).toFixed(0)} %` : '—';
        const ok = theirs ? fits(ours, theirs) : null;
        if (method === 'elite') {
          measured += 1;
          if (bar && ours.damage > bar.damage) better += 1;
          if (ok) fitting += 1;
        }
        rows.push(
          `| ${method === 'elite' ? scenario.label.slice(0, 40) : ''} | ${method === 'elite' ? 'Tier ladder' : 'Troops first'} | ` +
            `${n(ours.damage)} | ${n(ours.silver)} | **${n(ours.burned)}**${bar ? ` (bar ${n(bar.burned)})` : ''} | ` +
            `${n(ours.gold)} | ${n(ours.dragonCoins)} | ${vsBar} | ` +
            `${ok === null ? '—' : ok ? `**yes** (${theirs && theirs.damage > 0 ? ((ours.damage / theirs.damage - 1) * 100).toFixed(1) : '?'} %)` : 'no'} |`,
        );
      }
    }
    report.add('\n' + rows.join('\n'));
    report.add(
      `\n**Tier ladder, repeated, over ${String(measured)} armies**: it out-damages the bar’s best stop on ` +
        `**${String(better)}**, and it fits their hardest march’s budget on **${String(fitting)}**.\n`,
    );
    report.save();
  }, 900_000);
});
