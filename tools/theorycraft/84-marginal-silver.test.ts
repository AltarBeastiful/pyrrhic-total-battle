/**
 * 84 — **where is the common ground, and what if the horizon were 3?** (owner, 2026-09-15: *"I spend 4 times
 * the silver to reach less than 2x the damage … where is the common ground? 4x the silver seems excessive but
 * might not be"*, and then *"what if we change the default horizon to 3, which is around the number of marches
 * I usually do for each epic event (every 3 days)"*.)
 *
 * Two answers in one file, both from the engine's own **curve**: `planCampaign` bucks the frontier by silver
 * and keeps the most damage found at each bucket, which is the upper envelope of the trade — so the *marginal*
 * rate between consecutive buckets is exactly "what the next slice of silver buys". The average rate is not:
 * it is dragged down by every cheap step that came before.
 *
 * The two rows the owner compared field the **same hired counts** (35 · 40 · 40 · 20); what separates them is
 * **troops**, which is what this file opens first.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/84-marginal-silver.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { searchPriority } from '../../src/engine/search';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, evaluateCounts, loadOwner, n, scenarioC, withHousing } from './harness';

/** The app's own horizon, and the owner's epic-event cadence. */
const HORIZONS = [10, 3];

describe.skipIf(!process.env.THEORY)('the common ground, and a horizon of three', () => {
  it('opens the silver curve into marginal rates, at both horizons', () => {
    const report = new Report('84-marginal-silver');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const mercIds = new Set<string>(MERC_IDS);
    const split = (counts: Record<string, number>): { troops: number; hired: number } => {
      let troops = 0;
      let hired = 0;
      for (const [id, count] of Object.entries(counts)) {
        if (mercIds.has(id)) hired += count;
        else troops += count;
      }
      return { troops, hired };
    };
    /** Fight `counts` for `horizon` marches, capped by the stock and by an optional purse. */
    const play = (
      counts: Record<string, number>,
      horizon: number,
      purse?: number,
    ): {
      marches: number;
      damage: number;
      silver: number;
      lost: number;
    } => {
      const stock: Record<string, number> = { ...base.caps };
      let damage = 0;
      let silver = 0;
      let lost = 0;
      let marches = 0;
      for (let march = 1; march <= horizon; march += 1) {
        const fielded: Record<string, number> = { ...counts };
        for (const id of MERC_IDS) fielded[id] = Math.min(counts[id] ?? 0, stock[id] ?? 0);
        if (MERC_IDS.every((id) => (fielded[id] ?? 0) === 0)) break;
        const { summary } = evaluateCounts(base, fielded);
        if (purse !== undefined && silver + summary.recovery.silver > purse) break;
        marches += 1;
        damage += summary.avgDamage;
        silver += summary.recovery.silver;
        for (const id of MERC_IDS) {
          const chunk = chunks(fielded[id] ?? 0);
          lost += chunk;
          stock[id] = Math.max(0, (stock[id] ?? 0) - chunk);
        }
      }
      return { marches, damage, silver, lost };
    };

    const plans = HORIZONS.map((horizon) => ({
      horizon,
      plan: planCampaign({ request: base, marchTarget: horizon, alternatives: 4 }),
    }));

    // ---- 1. what the two compared rows actually field -------------------------------------------------
    report.h('1. The 4× silver is not buying mercenaries — it is buying troops');
    report.add(
      'Both of the owner’s rows field **35 · 40 · 40 · 20 hired**. A troop stack is a sponge: the enemy kills ' +
        'highest-HP-first, one stack per attack, and every stack that survives an attack strikes. So silver ' +
        'spent on troops buys **strikes for the mercenaries**, and that is the only thing silver buys here.',
    );
    report.add(
      '\n| horizon | point | troops a march | hired a march | stacks | damage a march | silver a march |\n' +
        '|---|---|---|---|---|---|---|\n' +
        plans
          .flatMap(({ horizon, plan }) =>
            (
              [
                ['mostEfficient', plan.mostEfficient],
                ['recommend', plan.recommend],
                ['knee', plan.knee],
              ] as const
            ).map(([name, point]) => {
              if (point === undefined) return '';
              const { troops, hired } = split(point.counts);
              const { result, summary } = evaluateCounts(base, point.counts);
              return (
                `| ${n(horizon)} | **${name}** | ${n(troops)} | ${n(hired)} | ${n(result.stacks.length)} | ` +
                `${n(summary.avgDamage)} | ${n(summary.recovery.silver)} |`
              );
            }),
          )
          .join('\n'),
    );

    // ---- 2. the curve, and the marginal rate between its buckets --------------------------------------
    for (const { horizon, plan } of plans) {
      const curve = plan.curve;
      report.h(`2. The silver curve at horizon ${n(horizon)} — what the next slice buys`);
      report.add(
        `${n(curve.length)} buckets, cheapest first. \`planCampaign\` keeps **the most damage found at each ` +
          `silver bucket**, so consecutive rows are neighbours on the real trade and the marginal column is ` +
          `honest: \`(damage₂ − damage₁) / (silver₂ − silver₁)\`. The average is what the whole spend returns; ` +
          `the **marginal** is what the *next* million returns, and it is the one that decides where to stop.`,
      );
      report.add(
        '\n| # | campaign silver | campaign damage | avg damage a silver | **marginal** | hired lost |\n' +
          '|---|---|---|---|---|---|\n' +
          curve
            .map((point, index) => {
              const previous = index === 0 ? undefined : curve[index - 1];
              const marginal =
                previous === undefined
                  ? '—'
                  : (() => {
                      const dSilver = point.silver - previous.silver;
                      if (dSilver <= 0) return '∞';
                      return ((point.damage - previous.damage) / dSilver).toFixed(2);
                    })();
              return (
                `| ${n(index + 1)} | ${n(point.silver)} | ${n(point.damage)} | ` +
                `${point.damagePerSilver.toFixed(2)} | **${marginal}** | ${n(point.mercLost)} |`
              );
            })
            .join('\n'),
      );
    }

    // ---- 3. the horizon question ----------------------------------------------------------------------
    const search = searchPriority({ request: base, objective: 'damagePerSilver', budgetMs: 30_000 });
    const searchCounts: Record<string, number> = {};
    for (const stack of search.result.stacks) searchCounts[stack.unitId] = stack.count;

    report.h('3. Horizon 3 against horizon 10, played for real');
    report.add(
      `The owner’s own cadence: an epic event every three days, about three marches each. Both plans are played ` +
        `with the game’s decay and \`simulateBattle\`, beside the best single march (the priority search) for ` +
        `reference.`,
    );
    report.add(
      '\n| strategy | what a march fields (hired) | marches fought | **campaign damage** | silver spent | hired lost | damage a silver |\n' +
        '|---|---|---|---|---|---|---|\n' +
        [
          ...plans.map(({ horizon, plan }) => ({
            name: `the plan at horizon ${n(horizon)}`,
            counts: (plan.recommend ?? plan).counts,
            horizon,
          })),
          { name: 'the best single march', counts: searchCounts, horizon: 3 },
          { name: 'the best single march', counts: searchCounts, horizon: 10 },
        ]
          .map((entry) => {
            const played = play(entry.counts, entry.horizon);
            const { hired } = split(entry.counts);
            return (
              `| ${entry.name} | ${n(hired)} | ${n(played.marches)} | **${n(played.damage)}** | ` +
              `${n(played.silver)} | ${n(played.lost)} | ${(played.damage / Math.max(1, played.silver)).toFixed(2)} |`
            );
          })
          .join('\n'),
    );
    report.add(
      `\n**Per march, which is what the cadence actually asks:** the plan at horizon 3 fields ` +
        `${n(evaluateCounts(base, (plans[1]?.plan.recommend ?? plans[1]?.plan ?? { counts: {} }).counts).summary.avgDamage)} ` +
        `damage a march against horizon 10's ` +
        `${n(evaluateCounts(base, (plans[0]?.plan.recommend ?? plans[0]?.plan ?? { counts: {} }).counts).summary.avgDamage)} — ` +
        `the same engine, the same army, three marches instead of ten.`,
    );

    report.save();
  }, 1_800_000);
});
