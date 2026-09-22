/**
 * 131 — **what the simulator costs, and what the search gets for it** (W0, S-123, 2026-09-22; the owner:
 * *"would there be any refactor that could speed up some calculations?"*).
 *
 * The priority search is **budget-bound**: it walks candidates until `budgetMs` runs out and answers with
 * the best it reached. So its speed is not a comfort, it is the **answer** — `SearchResult.evaluated` at a
 * fixed budget is exactly how many armies it got to consider before the clock stopped it, and a cheaper
 * simulator spends the same second on more of them.
 *
 * Two readings, both on the benchmark's own armies:
 *
 *  - **A**, the simulator itself: `simulateBattle` against `battleScore`, the same battle answered with and
 *    without the report a reader would want. The search needs only the second.
 *  - **B**, the search: candidates evaluated in a fixed budget, and wall time where the army is small enough
 *    to enumerate exhaustively (there the clock never binds, so the time is the whole reading).
 *
 * Run it on this tree and on the tree before the refactor; the pair of numbers is the win.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/131-battle-cost.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { battleScore, simulateBattle } from '../../src/engine/battle';
import { recoveryCosts } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { Objective } from '../../src/engine/types';
import { commonScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

/** Median of a set of timings — steadier than a mean when a GC pause lands in one run. */
const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[half - 1] ?? 0) + (sorted[half] ?? 0)) / 2 : (sorted[half] ?? 0);
};

describe.skipIf(!process.env.THEORY)('what the simulator costs the search', () => {
  it('A — one battle, answered two ways', () => {
    const report = new Report('131-battle-cost-a');
    report.add('# 131 A — `simulateBattle` against `battleScore`, on the benchmark’s own armies\n');
    report.add(
      '`battleScore` answers the seven figures an objective is scored on; `simulateBattle` answers those ' +
        'plus the battle report — two journals with an entry list each, the damage split by pool, the model ' +
        'notes. The priority search reads **one number** off a candidate, so every candidate but the winner ' +
        'and the baseline was paying for a report nobody read.\n',
    );
    const rows = [
      '| army | stacks | `sizeStacks` | `recoveryCosts` | `simulateBattle` | `battleScore` | full ÷ light |',
      '|---|---|---|---|---|---|---|',
    ];
    for (const scenario of commonScenarios()) {
      const sized = sizeStacks(scenario.request);
      const runs = 400;
      // Warm the JIT on both paths before either is timed.
      for (let i = 0; i < 50; i += 1) {
        simulateBattle(sized, scenario.request);
        battleScore(sized, scenario.request);
      }
      const timed = (work: () => void): number => {
        const taken: number[] = [];
        for (let round = 0; round < 5; round += 1) {
          const started = performance.now();
          for (let i = 0; i < runs; i += 1) work();
          taken.push((performance.now() - started) / runs);
        }
        return median(taken);
      };
      // The two the search pays for **beside** the battle, so the table says what a cheaper simulator can
      // and cannot buy: a candidate is `sizeStacks` then a battle, and the battle itself pays
      // `recoveryCosts` in both of its forms.
      const size = timed(() => void sizeStacks(scenario.request));
      const recover = timed(
        () => void recoveryCosts(sized.stacks, scenario.request.units, scenario.request.recovery),
      );
      const a = timed(() => void simulateBattle(sized, scenario.request));
      const b = timed(() => void battleScore(sized, scenario.request));
      rows.push(
        `| ${scenario.label.slice(0, 44)} | ${String(sized.stacks.length)} | ${size.toFixed(4)} ms | ` +
          `${recover.toFixed(4)} ms | ${a.toFixed(4)} ms | ${b.toFixed(4)} ms | **${(a / b).toFixed(2)}×** |`,
      );
    }
    report.add('\n' + rows.join('\n'));
    report.save();
  }, 600_000);

  it('B — what the search reaches inside its own budget', () => {
    const report = new Report('131-battle-cost-b');
    report.add('# 131 B — candidates the priority search reaches, at the app’s own budget\n');
    report.add(
      `\`CAMPAIGN.budgets.search\` is **${n(CAMPAIGN.budgets.search)} ms**, and the reason to read this ` +
        'table is that **it is not reached**. Every army here answers in a fraction of it — so unlike ' +
        '`planCampaign`, which fills whatever clock it is given (experiment 129: 40,843–40,934 ms against a ' +
        '40,000 ms cap), the priority search is **not budget-bound on any army in this repo**. Its speed is ' +
        'therefore latency and not answer quality: a cheaper simulator makes Generate return sooner, it ' +
        'does not make it return better. `exhaustive` says whether the army was small enough to enumerate ' +
        'outright, not whether the clock stopped it.\n',
    );
    const rows = ['| army | objective | types | evaluated | exhaustive | ms |', '|---|---|---|---|---|---|'];
    for (const scenario of commonScenarios()) {
      for (const objective of ['avgDamage', 'damagePerSilver'] as Objective[]) {
        const started = performance.now();
        const found = searchPriority({
          request: scenario.request,
          objective,
          budgetMs: CAMPAIGN.budgets.search,
        });
        const ms = performance.now() - started;
        rows.push(
          `| ${scenario.label.slice(0, 44)} | ${objective} | ${String(scenario.request.units.length)} | ` +
            `**${n(found.evaluated)}** | ${found.exhaustive ? 'yes' : 'no — restarts, not enumeration'} | ` +
            `${ms >= CAMPAIGN.budgets.search ? '**budget-bound** ' : ''}` +
            `${n(Math.round(ms))} |`,
        );
      }
    }
    report.add('\n' + rows.join('\n'));
    report.save();
  }, 600_000);
});
