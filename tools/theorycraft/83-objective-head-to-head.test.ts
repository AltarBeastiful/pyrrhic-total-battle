/**
 * 83 — **what does "full optimization" mean?** (owner, 2026-09-15: *"How to optimize our given silver and mercs
 * when generating stacks with the tool. We're still trying to get the best bang for our buck here. Leverage
 * that data and anchor a clear full optimization definition, only using data to verify it."*)
 *
 * Five candidate definitions, all drawn from the same engine on the owner's own account with the same purse,
 * and all **played the same way**: the march is fielded, the game's decay takes `ceil(n/10)` of every hired
 * type **for good**, and the next march is fought with what is left. Every damage figure is `simulateBattle`
 * on the counts actually fielded that march — never the planner's own arithmetic.
 *
 *   - **O1 · the best single march** — the priority search, which is also the shape of what Kai's and
 *     TotalStack's tools answer (experiment 82 measured both as one-march answers).
 *   - **O2 · the best campaign** — the plan's own recommendation.
 *   - **O3 · the best damage a silver** — the plan's `mostEfficient` end.
 *   - **O4 · the best damage a mercenary** — the plan's `mostThrifty` end.
 *   - **O5 · field everything you hold** — the owner's own instinct.
 *
 * Each is played twice: over the horizon with unlimited silver, and against a **fixed silver purse** — because
 * "the best bang for our buck" is a question about two finite resources at once, and a candidate that wins only
 * by spending more has not answered it.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/83-objective-head-to-head.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, evaluateCounts, loadOwner, n, scenarioC, withHousing } from './harness';

const HORIZON = 10;

interface Played {
  marches: number;
  damage: number;
  silver: number;
  hiredLost: number;
  /** The hired stock still held after the last march fought. */
  left: number;
}

/** Fight `counts` as a campaign: field what the stock still has, lose the chunks, repeat. */
function play(base: StackRequest, counts: Record<string, number>, silverBudget?: number): Played {
  const stock: Record<string, number> = { ...base.caps };
  let damage = 0;
  let silver = 0;
  let hiredLost = 0;
  let marches = 0;

  for (let march = 1; march <= HORIZON; march += 1) {
    // What this march can actually field: the candidate's counts, capped by what is left of each type.
    const fielded: Record<string, number> = { ...counts };
    for (const id of MERC_IDS) fielded[id] = Math.min(counts[id] ?? 0, stock[id] ?? 0);
    if (MERC_IDS.every((id) => (fielded[id] ?? 0) === 0)) break;

    const { summary } = evaluateCounts(base, fielded);
    // A silver purse stops the campaign before a march it cannot pay for — the same rule `simulateCampaign`
    // used, so the two agree about what a budget means.
    if (silverBudget !== undefined && silver + summary.recovery.silver > silverBudget) break;

    marches += 1;
    damage += summary.avgDamage;
    silver += summary.recovery.silver;
    for (const id of MERC_IDS) {
      const lost = chunks(fielded[id] ?? 0);
      hiredLost += lost;
      stock[id] = Math.max(0, (stock[id] ?? 0) - lost);
    }
  }

  return {
    marches,
    damage,
    silver,
    hiredLost,
    left: MERC_IDS.reduce((sum, id) => sum + (stock[id] ?? 0), 0),
  };
}

describe.skipIf(!process.env.THEORY)('what full optimization means', () => {
  it('plays every candidate objective as a campaign, and measures what each buys', () => {
    const report = new Report('83-objective-head-to-head');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const plan = planCampaign({ request: base, marchTarget: HORIZON });
    const search = searchPriority({ request: base, objective: 'damagePerSilver', budgetMs: 30_000 });
    const searchCounts: Record<string, number> = {};
    for (const stack of search.result.stacks) searchCounts[stack.unitId] = stack.count;

    const everything: Record<string, number> = { ...searchCounts };
    for (const id of MERC_IDS) everything[id] = base.caps[id] ?? 0;

    const candidates: { name: string; counts: Record<string, number>; note: string }[] = [
      { name: '**O1 · the best single march**', counts: searchCounts, note: 'the priority search' },
      {
        name: '**O2 · the best campaign**',
        counts: (plan.recommend ?? plan).counts,
        note: "the plan's recommendation",
      },
      {
        name: '**O3 · the best damage a silver**',
        counts: plan.mostEfficient?.counts ?? {},
        note: "the plan's efficient end",
      },
      {
        name: '**O4 · the best damage a mercenary**',
        counts: plan.mostThrifty?.counts ?? {},
        note: "the plan's thrifty end",
      },
      { name: '**O5 · field everything**', counts: everything, note: 'the whole stock every march' },
    ];

    const cells = (counts: Record<string, number>): string =>
      MERC_IDS.map((id) => n(counts[id] ?? 0)).join(' · ');

    report.h('The account and the purse');
    report.add(
      `Owner's export, scenario C, housing 4 343 leadership / ${n(base.housing.authority)} authority, ` +
        `horizon ${n(HORIZON)} marches. Held: ` +
        `${MERC_IDS.map((id) => `${id.replace('-6', '')} ${n(base.caps[id] ?? 0)}`).join(' · ')} — ` +
        `${n(MERC_IDS.reduce((sum, id) => sum + (base.caps[id] ?? 0), 0))} hired units. A fielded stack loses ` +
        `\`ceil(n/10)\` **for good**, so every campaign below is played with that decay, march by march.`,
    );

    // ---- unlimited silver ---------------------------------------------------------------------------
    report.h('Unlimited silver, ten marches');
    report.add(
      '| objective | what a march fields | marches fought | **campaign damage** | silver spent | hired lost | damage a silver | damage a hired | stock left |\n' +
        '|---|---|---|---|---|---|---|---|---|\n' +
        candidates
          .map((candidate) => {
            const played = play(base, candidate.counts);
            return (
              `| ${candidate.name} | ${cells(candidate.counts)} | ${n(played.marches)} | ` +
              `**${n(played.damage)}** | ${n(played.silver)} | ${n(played.hiredLost)} | ` +
              `${(played.damage / Math.max(1, played.silver)).toFixed(2)} | ` +
              `${(played.damage / Math.max(1, played.hiredLost)).toFixed(0)} | ${n(played.left)} |`
            );
          })
          .join('\n'),
    );

    // ---- a fixed silver purse -----------------------------------------------------------------------
    // Set to what the *cheapest* of the five spends over the horizon, so every candidate is asked the same
    // question: what do you buy with exactly this much silver?
    const spends = candidates.map((candidate) => play(base, candidate.counts).silver);
    const purse = Math.min(...spends);
    report.h(`A fixed silver purse — ${n(Math.round(purse))}, ten marches`);
    report.add(
      `The purse is set to the **cheapest** candidate's own ten-march spend (${n(Math.round(purse))}), so no ` +
        `candidate is judged on a budget it never asked for. A campaign stops before a march it cannot pay for.`,
    );
    report.add(
      '\n| objective | marches fought | **campaign damage** | silver spent | hired lost | damage a silver | damage a hired |\n' +
        '|---|---|---|---|---|---|---|\n' +
        candidates
          .map((candidate) => {
            const played = play(base, candidate.counts, purse);
            return (
              `| ${candidate.name} | ${n(played.marches)} | **${n(played.damage)}** | ${n(played.silver)} | ` +
              `${n(played.hiredLost)} | ${(played.damage / Math.max(1, played.silver)).toFixed(2)} | ` +
              `${(played.damage / Math.max(1, played.hiredLost)).toFixed(0)} |`
            );
          })
          .join('\n'),
    );

    // ---- the verdict --------------------------------------------------------------------------------
    const scored = candidates.map((candidate) => ({
      candidate,
      unlimited: play(base, candidate.counts),
      budgeted: play(base, candidate.counts, purse),
    }));
    const bestOf = (key: 'unlimited' | 'budgeted'): (typeof scored)[number] =>
      scored.reduce((a, b) => (b[key].damage > a[key].damage ? b : a));

    report.h('What the data says the definition is');
    report.add(
      `- **Unlimited silver**: the most campaign damage is ` +
        `**${n(bestOf('unlimited').unlimited.damage)}** from ${bestOf('unlimited').candidate.name} ` +
        `(${bestOf('unlimited').candidate.note}). The one-march optimum, O1, gets ` +
        `${n(scored[0]?.unlimited.damage ?? 0)} — ${(((scored[0]?.unlimited.damage ?? 0) / Math.max(1, bestOf('unlimited').unlimited.damage)) * 100).toFixed(1)} % of it.`,
    );
    report.add(
      `- **Under the purse**: the most damage is **${n(bestOf('budgeted').budgeted.damage)}** from ` +
        `${bestOf('budgeted').candidate.name}. O1 gets ${n(scored[0]?.budgeted.damage ?? 0)}.`,
    );
    report.add(
      `- **The ratio ends are not the answer.** O4 (best damage a mercenary) spends ` +
        `${n(scored[3]?.unlimited.silver ?? 0)} silver for ${n(scored[3]?.unlimited.damage ?? 0)} damage, and ` +
        `O3 (best damage a silver) spends ${n(scored[2]?.unlimited.silver ?? 0)} for ` +
        `${n(scored[2]?.unlimited.damage ?? 0)}. A ratio names a *direction*, never a stopping point.`,
    );

    report.save();
  }, 1_800_000);
});
