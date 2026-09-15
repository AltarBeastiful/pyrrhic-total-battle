/**
 * 80 — **fix A, the token floor** (owner, 2026-09-15: *"implement both behind feature flags and lets compare
 * them after with an experiment for each"*).
 *
 * The defect, measured in 78: the plan's grid samples every hired type at `{max, 0.7·max, 0.45·max, 0.2·max,
 * 0}`, and that trailing `0` is a degenerate sample of the thrift end — the only point that spends nothing of
 * a type, so it survives non-domination however bad its damage is. The owner's own account offered a plan
 * fielding no legionaries at all, and putting **one** back paid +22,230 damage while lasting 72 marches.
 *
 * Fix A replaces the `0` with `min(CHUNK, max)`: the thrift end samples a token count of the type rather than
 * none of it. This file measures it against the baseline it would ship over — the same account, the same
 * horizon, the same code with `tokenFloor` off.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/80-token-floor.test.ts`
 */
import { describe, it } from 'vitest';

import { marchResult } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, planWithFixes, scenarioC, withHousing } from './harness';

const HORIZON = 10;
/** The rows the app asks for, and a wide one, because 78 §4b found the holes thin out on a full frontier. */
const WIDTHS = [4, 24];

describe.skipIf(!process.env.THEORY)('fix A — the token floor', () => {
  it('compares the baseline against the token floor', () => {
    const report = new Report('80-token-floor');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const RUNS = [
      { label: 'the baseline', flags: {} },
      { label: '**fix A — the token floor**', flags: { tokenFloor: true } },
      { label: 'both fixes', flags: { tokenFloor: true, refuseDroppedTypes: true } },
    ] as const;

    report.h('The account, and what is measured');
    report.add(
      `Owner's export, scenario C, housing 4 343 leadership / 2 000 authority, horizon ` +
        `${n(HORIZON)} marches (the app's own \`CAMPAIGN.marches\`). Held hired stock: ` +
        `${MERC_IDS.map((id) => `${id.replace('-6', '')} ${n(base.caps[id] ?? 0)}`).join(' · ')}.\n\n` +
        'A **hole** is a plan the frontier offers that fields none of a type the account holds. Every damage ' +
        'figure below is the **real** battle (`marchResult` → `simulateBattle`), never the analytic scorer.',
    );

    // One planning run per (width, flags): the search is ~10 s, so nothing here may call it twice.
    const atWidth = (width: number): ReturnType<typeof planWithFixes>[] =>
      RUNS.map((run) => planWithFixes(base, HORIZON, width, run.flags, run.label));
    const cells = (counts: Record<string, number>): string =>
      MERC_IDS.map((id) => {
        const count = counts[id] ?? 0;
        return count === 0 ? '**0**' : n(count);
      }).join(' · ');

    for (const width of WIDTHS) {
      const runs = atWidth(width);
      report.h(`The frontier at ${n(width)} rows`);
      report.add(
        `| run | plans offered | of them, holes | the recommended plan | its damage a march | its campaign total | the frontier's best a march | the frontier's best total | holes filled? |\n` +
          `|---|---|---|---|---|---|---|---|---|\n` +
          runs
            .map((fixed) => {
              const chosen = fixed.plan.recommend ?? fixed.plan;
              // The best the frontier holds, so a *different recommendation* can be told apart from a
              // *worse optimum* — the two look the same in the recommended row alone.
              const bestMarch = Math.max(...fixed.rows.map((row) => row.repeat.damage));
              const bestTotal = Math.max(...fixed.rows.map((row) => row.totalDamage));
              return (
                `| ${fixed.label} | ${n(fixed.rows.length)} | **${n(fixed.holes.length)}** | ` +
                `${cells(chosen.counts)} | ${n(chosen.repeat.damage)} | ${n(chosen.totalDamage)} | ` +
                `${n(bestMarch)} | **${n(bestTotal)}** | ` +
                `${MERC_IDS.every((id) => (chosen.counts[id] ?? 0) > 0) ? 'yes' : '**no**'} |`
              );
            })
            .join('\n'),
      );
      const longest = Math.max(...runs.map((fixed) => fixed.rows.length));
      report.add(
        `\nThe plans each run offers, cheapest first:\n\n` +
          `| # | ${runs.map((fixed) => fixed.label).join(' | ')} |\n|---|${'---|'.repeat(runs.length)}\n` +
          Array.from({ length: longest })
            .map((_unused, index) => {
              const rowCells = runs.map((fixed) => {
                const row = fixed.rows[index];
                return row === undefined ? '—' : cells(row.counts);
              });
              return `| ${n(index + 1)} | ${rowCells.join(' | ')} |`;
            })
            .join('\n'),
      );
    }

    report.h('Does filling a hole still pay, under each run?');
    report.add(
      'The test 78 used, applied to whatever each run offers: for every offered plan with exactly one hole, ' +
        'the missing type is given a token count with everything else untouched, and the real battle is ' +
        'replayed. A run whose frontier still contains a plan that a token improves is still offering the ' +
        'owner a hole he would not choose.',
    );
    report.add(
      '\n| run | offered plans with one hole | of those, improved by a token | worst case |\n|---|---|---|---|',
    );
    for (const fixed of atWidth(24)) {
      const stocked = MERC_IDS.filter((id) => (base.caps[id] ?? 0) > 0);
      const singles = fixed.rows.filter(
        (row) => stocked.filter((id) => (row.counts[id] ?? 0) === 0).length === 1,
      );
      let improved = 0;
      let worst = 0;
      for (const row of singles) {
        const id = stocked.find((entry) => (row.counts[entry] ?? 0) === 0);
        if (id === undefined) continue;
        const asPlanned = marchResult(base, row.counts).summary.avgDamage;
        const filled = marchResult(base, { ...row.counts, [id]: 10 }).summary.avgDamage;
        if (filled > asPlanned) improved += 1;
        worst = Math.min(worst, filled - asPlanned);
      }
      report.add(
        `| ${fixed.label} | ${n(singles.length)} | ${n(improved)} | ${singles.length === 0 ? '—' : n(worst)} |`,
      );
    }

    report.save();
  }, 900_000);
});
