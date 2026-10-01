/**
 * 183 — **the raise that pays for its damage in stock: what a burn cap costs, and what it saves** (S-144).
 * Owner, 2026-09-29: *"we could have a safe best-v2 that is bestv2 but accounting for merc lost and dmg/merc.
 * build it and benchmark it"*.
 *
 * `Best v2` maximises the worst opening over a box of up to a million vectors, and **a raise only ever adds
 * units** — so where the box lets a stack cross a multiple of ten, the answer can buy damage with a chunk of
 * the mercenary stock. A mercenary is the one thing a march does not get back: it is hired and revived for
 * gold, and `mercLost` is `Σ chunks(n)` over the authority stacks (S-102), a property of the counts and not of
 * the fight (S-88b). This experiment asks what the position would be if it were not allowed to spend it.
 *
 * **The two caps, and why they are the two.** `safe@Plan` may not burn more than **the plan's own counts** —
 * the march the raise is a raise *of*, so every vector it may answer with costs the account not one extra unit
 * of rare stock; since the box's floor is the plan's count on every stack and `chunks` is non-decreasing, this
 * is exactly the promise "you may move a count only as far as the chunk it is already in". `safe@Best` may not
 * burn more than the **shipped `Best`** — the position it would replace — which is the weaker promise and the
 * one a player who has already accepted `Best` is owed. `per-merc` maximises `hiredDamage / mercLost`, the
 * plan's own "damage a mercenary" reading, and is measured because investigation 0019 calls that ratio a trap.
 *
 * Every reading is the app's own: the box, the bounds, the housing check, the seed and the climb are the
 * shipped `exactRaise`, told to rank its vectors differently (`RaiseRank`), and every figure comes off one
 * `applyCounts` replay per vector. `burnOf` is held to the plan's own `mercLost` on every stop here.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/183-safe-raise.test.ts`
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { byDamage, exactRaise } from './exact-raise';
import type { RaiseRank } from './exact-raise';
import { applyCounts } from '@/ui/sections/march/manual';
import { burnOf, raisedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

/**
 * **The climb on both hired pools** (S-145): `raisedCounts` answers an exhaustive mode with it, so this is
 * the march the control draws while a search runs and the vector every search below is seeded with. It was
 * the `Best` segment until the benchmark showed `Safe` never lost to it.
 */
const CLIMB = { authority: 'v2', dominance: 'v2' } as const;
const V2 = { authority: 'v2', dominance: 'v2' } as const;

/** The most burn a rank may accept: anything over the cap is refused, exactly as the housing refuses a vector. */
const underBurn =
  (cap: number, rank: RaiseRank = byDamage): RaiseRank =>
  (facts) =>
    facts.mercLost <= cap ? rank(facts) : Number.NEGATIVE_INFINITY;

/** The plan's own "damage a mercenary" — `PlanRepeat.hiredDamage / PlanRepeat.mercLost`. */
const perMerc: RaiseRank = (facts) => facts.hiredDamage / Math.max(1, facts.mercLost);

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/** One reading of one stop: the march it would field, its damage and what that cost in rare stock. */
interface Reading {
  damage: number;
  burn: number;
}

describe.skipIf(!process.env.THEORY)('the raise that pays for its damage in stock', () => {
  it('prices a burn cap on every stop of every benchmark army', () => {
    const report = new Report('183-safe-raise');
    report.add(
      [
        '`Best v2` under a cap on the rare stock it may burn, on every stop of every benchmark army where a',
        "hired stack can move. `burn` is `Σ chunks(n)` over the authority stacks — the plan's own `mercLost`.",
        'Each cell is **damage · burn**. `safe@Plan` may not burn more than the plan’s own counts; `safe@Best`',
        'may not burn more than the shipped `Best`; `per-merc` maximises damage a mercenary.',
      ].join(' '),
    );
    report.add('');
    report.add(
      '| army · stop | box | plan: dmg · burn | Best: dmg · burn | v2: dmg · burn | safe@Plan: dmg · burn | safe@Best: dmg · burn | per-merc: dmg · burn |',
    );
    report.add('|---|---|---|---|---|---|---|---|');

    /** Stops where each reading left the `Best` it is measured against behind. */
    const gained: Record<string, number[]> = { v2: [], safePlan: [], safeBest: [] };
    const extraBurn: Record<string, number[]> = { v2: [], safePlan: [], safeBest: [] };
    /** `safe@Plan` against the plan's own counts — the march it is a raise of, unraised. */
    const overPlan: number[] = [];
    const trap: number[] = [];
    const burnDisagreements: string[] = [];
    let stops = 0;

    for (const scenario of criteriaScenarios()) {
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
        const base = planMarch(scenario.request, stop.counts).result;
        const floor = troopFloor(base);
        if (floor === null) continue;
        const movable = base.stacks.filter(
          (stack) =>
            stack.pool !== 'leadership' &&
            stack.count > 0 &&
            Math.min(
              shelterCeiling(floor, stack.hpPerUnit),
              scenario.request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER,
            ) > stack.count,
        );
        if (movable.length === 0) continue;
        stops += 1;

        /** The plan's own march, and the two readings of it the caps are built on. */
        const own = applyCounts(scenario.request, base, stop.counts);
        const planReading: Reading = {
          damage: own.summary.minDamage,
          burn: burnOf(base, stop.counts),
        };
        // **The tie**: `burnOf` must be the plan's own `mercLost`, on every stop of every army.
        if (planReading.burn !== stop.repeat.mercLost) {
          burnDisagreements.push(
            `${scenario.label} · ${stop.pick}: burnOf ${String(planReading.burn)} against the plan's ${String(stop.repeat.mercLost)}`,
          );
        }

        const read = (counts: Record<string, number>): Reading => {
          const played = applyCounts(scenario.request, base, { ...stop.counts, ...counts });
          return {
            damage: played.summary.minDamage,
            burn: burnOf(base, { ...stop.counts, ...counts }),
          };
        };

        const shipped = raisedCounts(scenario.request, base, CLIMB) ?? {};
        const bestReading = read(shipped);

        /** One search of the shipped box under one rank — `space` comes off the answer, not a second search. */
        const answer = (rank?: RaiseRank): { reading: Reading; space: number } | null => {
          const found =
            rank === undefined
              ? exactRaise(scenario.request, base, V2)
              : exactRaise(scenario.request, base, V2, rank);
          return found === null ? null : { reading: read(found.counts), space: found.space };
        };

        const v2 = answer();
        const safePlan = answer(underBurn(planReading.burn));
        const safeBest = answer(underBurn(bestReading.burn));
        const trapReading = answer(perMerc);
        const box = v2?.space ?? 0;

        const cell = (reading: Reading | null): string =>
          reading === null ? '—' : `${n(reading.damage)} · ${String(reading.burn)}`;

        report.add(
          `| ${scenario.label} · ${stop.pick} | ${n(box)} | ${cell(planReading)} | ${cell(bestReading)} | ${cell(v2?.reading ?? null)} | ${cell(safePlan?.reading ?? null)} | ${cell(safeBest?.reading ?? null)} | ${cell(trapReading?.reading ?? null)} |`,
        );

        const record = (key: string, reading: Reading | null): void => {
          if (reading === null) return;
          if (reading.damage > bestReading.damage) {
            gained[key]?.push(((reading.damage - bestReading.damage) / bestReading.damage) * 100);
            extraBurn[key]?.push(reading.burn - bestReading.burn);
          }
        };
        record('v2', v2?.reading ?? null);
        record('safePlan', safePlan?.reading ?? null);
        record('safeBest', safeBest?.reading ?? null);

        if (safePlan !== null && safePlan.reading.damage > planReading.damage) {
          overPlan.push(((safePlan.reading.damage - planReading.damage) / planReading.damage) * 100);
        }
        if (v2 !== null && trapReading !== null) {
          trap.push(((v2.reading.damage - trapReading.reading.damage) / v2.reading.damage) * 100);
        }
      }
    }

    const line = (key: string, name: string): string => {
      const gains = gained[key] ?? [];
      const burns = extraBurn[key] ?? [];
      if (gains.length === 0) return `- **${name}**: no stop gained damage over \`Best\`.`;
      const raised = burns.filter((one) => one > 0).length;
      const spent = burns.reduce((sum, one) => sum + one, 0);
      return (
        `- **${name}**: ${String(gains.length)} of ${String(stops)} stops beat \`Best\` — **+${Math.min(...gains).toFixed(2)} % at the smallest, ` +
        `+${median(gains).toFixed(2)} % median, +${Math.max(...gains).toFixed(2)} % at the best** — and ${String(raised)} of those ` +
        `${raised === 1 ? 'burns' : 'burn'} more stock, **${String(spent)} chunk${spent === 1 ? '' : 's'} in all**.`
      );
    };

    report.h('What the caps cost, and what they buy');
    report.add('');
    report.add(line('v2', '`Best v2`, unbounded'));
    report.add(line('safeBest', '`safe@Best` — never burns more than the shipped `Best`'));
    report.add(line('safePlan', '`safe@Plan` — never burns more than the plan’s own counts'));
    report.add('');
    report.add(
      `- **The stock the plain position spends to gain its damage**: over the ${String(stops)} stops it beats \`Best\` on, ` +
        `\`Best v2\` burns ${String((extraBurn.v2 ?? []).reduce((sum, one) => sum + one, 0))} more chunks in all. ` +
        'A chunk is ten units of a hired type the account does not get back.',
    );
    report.add(
      `- **Damage at no extra cost**: \`safe@Plan\` beats **the plan's own counts** on ${String(overPlan.length)} of ${String(stops)} stops — ` +
        (overPlan.length === 0
          ? 'none.'
          : `**+${Math.min(...overPlan).toFixed(2)} % at the smallest, +${median(overPlan).toFixed(2)} % median, +${Math.max(...overPlan).toFixed(2)} % at the best** — without one extra chunk.`),
    );
    report.add(
      `- **Damage a mercenary as the objective**: maximising \`hiredDamage / mercLost\` costs **${median(trap).toFixed(2)} % median damage** ` +
        `against \`Best v2\` (${Math.max(...trap).toFixed(2)} % at the worst, ${Math.min(...trap).toFixed(2)} % at the least) on the ${String(trap.length)} stops it answers. ` +
        'Investigation 0019 called the ratio a trap and this is what the trap costs when it is the whole objective.',
    );
    report.add(
      `- **\`burnOf\` against the plan's own \`mercLost\`**: ${burnDisagreements.length === 0 ? 'identical on every stop of every army.' : burnDisagreements.join('; ')}`,
    );
    report.add('');
    report.save();

    expect(burnDisagreements, burnDisagreements.join('\n')).toEqual([]);
  }, 3_600_000);
});
