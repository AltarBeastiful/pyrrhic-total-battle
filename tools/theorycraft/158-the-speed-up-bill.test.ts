/**
 * 158 — **the training-time hit, paid in the owner's own speed-ups** (2026-09-23; the owner: *"confirm to me that
 * you've correctly assessed train time hit with those changes, as troops that take 15 hours cannot use 24-hour
 * speedups. Just compute the global hit to the train time using this and all the test cases"*).
 *
 * The earlier reading divided his stock's total hours by a campaign's queue, which assumes a speed-up is spent to
 * the minute. It is not: **a speed-up acts on one training order**, and what it gives beyond that order's
 * remaining time is lost. So this spends his actual stock (his screenshots of 2026-09-23):
 *
 *   1 min × 487 · 15 min × 574 · 1 h × 510 · 3 h × 286 · 8 h × 102 · 15 h × 49 · 1 day × 439 = 13 606.6 h
 *
 * on the actual training orders of each march:
 *
 *  - **one order a troop stack**: after a march every troop stack is retrained (the app's recovery plan), and its
 *    order lasts that stack's retraining time (`recoveryCosts` of the stack alone — his speed bonuses in, no
 *    speed-up items). Hired stacks cost gold and no queue;
 *  - **each order is covered as cheaply as the items left allow**: whole items while they fit, then the smallest
 *    last cover — a single item at least the remainder, or a run of smaller ones, whichever wastes less;
 *  - marches are played in the campaign's order, campaign after campaign, until an order cannot be covered.
 *
 * Every stop of every test case, the bar as shipped against the same bar **re-typed by the owner's rating**
 * (`silver-aware.ts`, mode `rated` — 157's third reading): the queue a campaign, the speed-up hours it
 * actually consumes (waste included), the waste, and how many whole campaigns the stock pays for.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/158-the-speed-up-bill.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';
import { retype } from './silver-aware';

/** His stock, in hours an item, largest first. */
const STOCK: readonly { hours: number; count: number }[] = [
  { hours: 24, count: 439 },
  { hours: 15, count: 49 },
  { hours: 8, count: 102 },
  { hours: 3, count: 286 },
  { hours: 1, count: 510 },
  { hours: 0.25, count: 574 },
  { hours: 1 / 60, count: 487 },
];
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};

/** The training orders of one march, in hours: one a troop stack. */
const ordersOf = (request: StackRequest, counts: Record<string, number>): number[] => {
  const { result } = planMarch(request, counts);
  return result.stacks
    .map((stack) => recoveryCosts([stack], request.units, request.recovery).plan.seconds / 3600)
    .filter((hours) => hours > 0);
};

/**
 * Cover one order of `hours` from `left` (mutated): whole items while they fit, then the cheapest last cover.
 * Returns the hours consumed, or `null` when the stock cannot cover it (the stock is then left as it was).
 */
const cover = (hours: number, left: number[]): number | null => {
  const take = [...left];
  let remaining = hours;
  let consumed = 0;
  const EPS = 1e-9;
  for (let i = 0; i < STOCK.length; i += 1) {
    const size = STOCK[i]?.hours ?? 0;
    while ((take[i] ?? 0) > 0 && remaining >= size - EPS) {
      take[i] = (take[i] ?? 0) - 1;
      remaining -= size;
      consumed += size;
    }
  }
  if (remaining > EPS) {
    // The last cover: either the smallest single item at least the remainder, or smaller items greedily (which
    // the loop above has already exhausted for sizes ≤ the remainder) — so it is the smallest item left above.
    let best = -1;
    for (let i = STOCK.length - 1; i >= 0; i -= 1) {
      if ((take[i] ?? 0) > 0 && (STOCK[i]?.hours ?? 0) >= remaining - EPS) {
        best = i;
        break;
      }
    }
    if (best < 0) return null;
    take[best] = (take[best] ?? 0) - 1;
    consumed += STOCK[best]?.hours ?? 0;
  }
  take.forEach((c, i) => (left[i] = c));
  return consumed;
};

/** Play the campaign's marches again and again from the full stock; what one campaign costs, and how many fit. */
const bill = (
  campaign: number[][],
): { queue: number; consumed: number; waste: number; campaigns: number; firstConsumed: number } => {
  const left = STOCK.map((s) => s.count);
  const queue = campaign.flat().reduce((s, h) => s + h, 0);
  let campaigns = 0;
  let consumedAll = 0;
  let firstConsumed = 0;
  for (;;) {
    let spent = 0;
    for (const march of campaign) {
      for (const order of march) {
        const used = cover(order, left);
        if (used === null) {
          return {
            queue,
            consumed: consumedAll,
            waste: consumedAll - queue * campaigns,
            campaigns,
            firstConsumed: campaigns === 0 ? Number.NaN : firstConsumed,
          };
        }
        spent += used;
      }
    }
    campaigns += 1;
    consumedAll += spent;
    if (campaigns === 1) firstConsumed = spent;
    if (queue <= 0 || campaigns > 10_000) {
      return {
        queue,
        consumed: consumedAll,
        waste: consumedAll - queue * campaigns,
        campaigns,
        firstConsumed,
      };
    }
  }
};

describe.skipIf(!process.env.THEORY)('the speed-up bill', () => {
  it('spends the owner’s stock on every stop, shipped and re-typed', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('158-the-speed-up-bill');
    report.add('# 158 — the training-time hit, paid in the owner’s own speed-ups\n');
    report.add(
      'Stock 13 606.6 h: 1 min × 487 · 15 min × 574 · 1 h × 510 · 3 h × 286 · 8 h × 102 · 15 h × 49 · 1 day × 439. ' +
        'One training order a troop stack, each covered as cheaply as the items left allow; campaign after campaign ' +
        'until an order cannot be covered. **Queue** is the orders’ total a campaign (four marches); **consumed** ' +
        'what the first campaign actually burns from the stock, waste included; **campaigns** how many whole ones ' +
        'the stock pays for. Shipped = the bar as it stands; re-typed = 157’s rated reading.\n',
    );
    const rows: string[] = [
      '| use case | stop | orders a campaign | queue (shipped → re-typed) | consumed, 1st campaign (shipped → re-typed) | campaigns the stock pays (shipped → re-typed) |',
      '|---|---|---:|---|---|---|',
    ];
    const total = {
      queueA: 0,
      queueB: 0,
      consumedA: 0,
      consumedB: 0,
      campaignsA: 0,
      campaignsB: 0,
      stops: 0,
      moreQueue: 0,
      fewerCampaigns: 0,
    };
    const worst: string[] = [];
    for (const scenario of scenarios) {
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
      for (const stop of plan.alternatives) {
        const marches = marchesOf(stop as PlanTotals);
        const cache = new Map<string, Record<string, number>>();
        const retyped = marches.map((m) => {
          const key = JSON.stringify(Object.entries(m).sort());
          const hit = cache.get(key);
          if (hit) return hit;
          const r = retype(scenario.request, m, 'rated');
          const out = r ? r.counts : m;
          cache.set(key, out);
          return out;
        });
        const a = bill(marches.map((m) => ordersOf(scenario.request, m)));
        const b = bill(retyped.map((m) => ordersOf(scenario.request, m)));
        const orders = marches.map((m) => ordersOf(scenario.request, m).length).reduce((s, x) => s + x, 0);
        total.stops += 1;
        total.queueA += a.queue;
        total.queueB += b.queue;
        total.consumedA += a.firstConsumed;
        total.consumedB += b.firstConsumed;
        total.campaignsA += a.campaigns;
        total.campaignsB += b.campaigns;
        if (b.queue > a.queue + 1e-9) total.moreQueue += 1;
        if (b.campaigns < a.campaigns) {
          total.fewerCampaigns += 1;
          worst.push(
            `**${scenario.label.slice(0, 46)}** ${SHORT[stop.pick] ?? stop.pick}: ${String(a.campaigns)} → ${String(b.campaigns)} campaigns`,
          );
        }
        const pct = (x: number, y: number): string =>
          x === y ? '' : ` (${y >= x ? '+' : '−'}${Math.abs((y / x - 1) * 100).toFixed(1)} %)`;
        rows.push(
          `| ${scenario.label.slice(0, 40)} | ${SHORT[stop.pick] ?? stop.pick} | ${String(orders)} | ` +
            `${n(Math.round(a.queue))} → ${n(Math.round(b.queue))} h${pct(a.queue, b.queue)} | ` +
            `${n(Math.round(a.firstConsumed))} → ${n(Math.round(b.firstConsumed))} h (waste ${((a.firstConsumed / a.queue - 1) * 100).toFixed(1)} % → ${((b.firstConsumed / b.queue - 1) * 100).toFixed(1)} %) | ` +
            `${String(a.campaigns)} → ${String(b.campaigns)} |`,
        );
      }
    }
    report.add('## Every stop of every test case\n');
    report.add(rows.join('\n'));
    report.add(
      `\n\n## The global hit\n\nOver all **${String(total.stops)}** stops of the 17 test cases, one campaign each:\n\n` +
        '| | shipped | re-typed | change |\n|---|---:|---:|---:|\n' +
        `| queue, summed | ${n(Math.round(total.queueA))} h | ${n(Math.round(total.queueB))} h | ${((total.queueB / total.queueA - 1) * 100).toFixed(2)} % |\n` +
        `| speed-ups consumed, first campaign, summed | ${n(Math.round(total.consumedA))} h | ${n(Math.round(total.consumedB))} h | ${((total.consumedB / total.consumedA - 1) * 100).toFixed(2)} % |\n` +
        `| waste in that | ${((total.consumedA / total.queueA - 1) * 100).toFixed(2)} % | ${((total.consumedB / total.queueB - 1) * 100).toFixed(2)} % | |\n` +
        `| campaigns the stock pays, summed over stops | ${n(total.campaignsA)} | ${n(total.campaignsB)} | ${((total.campaignsB / total.campaignsA - 1) * 100).toFixed(2)} % |\n\n` +
        `Stops whose queue grows: **${String(total.moreQueue)} of ${String(total.stops)}**. Stops the stock pays for fewer whole ` +
        `campaigns of: **${String(total.fewerCampaigns)}**${worst.length > 0 ? `:\n\n- ${worst.join('\n- ')}` : '.'}\n`,
    );
    report.save();
  }, 3_600_000);
});
