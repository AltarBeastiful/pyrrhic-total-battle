/**
 * 81 — **fix B, the band refuses a plan that drops a whole hired type** (owner, 2026-09-15: *"implement both
 * behind feature flags and lets compare them after with an experiment for each"*).
 *
 * Where fix A changes what the search can *express* (the grid's thrift end samples one chunk instead of
 * nothing), fix B leaves the search alone and changes what the UI is *offered*: the frontier band already
 * refuses plans that field a token share of the mercenaries, spend silver far past what they return, or stand
 * on a single troop stack; B adds a fourth refusal — a plan that fields none of a stocked hired type — and
 * counts them in `leftOut` like the other three.
 *
 * The difference matters: A cannot express "no legionaries at all", so if a zero were ever the true winner it
 * would be lost. B can still *choose* one; it just never offers it as a stop on the bar. This file measures B
 * against the same baseline as 80, on the same account and horizon, so the pair is a comparison.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/81-band-refusal.test.ts`
 */
import { describe, it } from 'vitest';

import { marchResult } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, planWithFixes, scenarioC, withHousing } from './harness';

const HORIZON = 10;
const WIDTHS = [4, 24];

describe.skipIf(!process.env.THEORY)('fix B — the band refuses a dropped type', () => {
  it('compares the baseline against the band refusal', () => {
    const report = new Report('81-band-refusal');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const RUNS = [
      { label: 'the baseline', flags: {} },
      { label: '**fix B — the band refusal**', flags: { refuseDroppedTypes: true } },
      { label: 'both fixes', flags: { tokenFloor: true, refuseDroppedTypes: true } },
    ] as const;

    const atWidth = (width: number): ReturnType<typeof planWithFixes>[] =>
      RUNS.map((run) => planWithFixes(base, HORIZON, width, run.flags, run.label));
    const cells = (counts: Record<string, number>): string =>
      MERC_IDS.map((id) => {
        const count = counts[id] ?? 0;
        return count === 0 ? '**0**' : n(count);
      }).join(' · ');

    report.h('The account, and what is measured');
    report.add(
      `Owner's export, scenario C, housing 4 343 leadership / 2 000 authority, horizon ${n(HORIZON)} ` +
        `marches. A **hole** is a plan the frontier offers that fields none of a type the account holds; ` +
        `\`leftOut\` is the engine's own count of the plans the band refused. Damages are the real battle ` +
        `(\`marchResult\` → \`simulateBattle\`).`,
    );

    for (const width of WIDTHS) {
      const runs = atWidth(width);
      report.h(`The frontier at ${n(width)} rows`);
      report.add(
        `**A band only applies when the caller asks for fewer rows than the frontier holds** — ask for the ` +
          `whole frontier and the band is bypassed, so its refusals cannot show. At ${n(width)} rows that ` +
          `is why \`leftOut\` reads as it does below.\n\n` +
          `| run | plans offered | **leftOut** | of them, holes | the recommended plan | its damage a march | its campaign total | the frontier's best total |\n` +
          `|---|---|---|---|---|---|---|---|\n` +
          runs
            .map((fixed) => {
              const chosen = fixed.plan.recommend ?? fixed.plan;
              const bestTotal = Math.max(...fixed.rows.map((row) => row.totalDamage));
              return (
                `| ${fixed.label} | ${n(fixed.rows.length)} | **${n(fixed.plan.leftOut)}** | ` +
                `**${n(fixed.holes.length)}** | ${cells(chosen.counts)} | ${n(chosen.repeat.damage)} | ` +
                `${n(chosen.totalDamage)} | **${n(bestTotal)}** |`
              );
            })
            .join('\n'),
      );
      report.add(
        `\nThe cheapest five stops each run offers:\n\n` +
          `| # | ${runs.map((fixed) => fixed.label).join(' | ')} |\n|---|${'---|'.repeat(runs.length)}\n` +
          Array.from({ length: 5 })
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

    report.h('What the band refused, and whether the plan that wins is one of them');
    report.add(
      'The point of B is that the **winner** is untouched: the engine still searches every shape, including the ' +
        'ones with a hole, and B only decides what the player is shown. A run where the recommended plan ' +
        'fields none of a type would mean the band was bypassed because it emptied.',
    );
    report.add(
      '\n| run | rows asked | plans the band refused | the winner drops a type? | the winner is in the band? |\n' +
        '|---|---|---|---|---|\n' +
        RUNS.flatMap((run) =>
          WIDTHS.map((width) => {
            const fixed = atWidth(width).find((entry) => entry.label === run.label);
            if (fixed === undefined) return '';
            const chosen = fixed.plan.recommend ?? fixed.plan;
            const drops = MERC_IDS.some((id) => (chosen.counts[id] ?? 0) === 0);
            const shown = fixed.rows.some((row) => row.totalDamage === chosen.totalDamage);
            return `| ${fixed.label} | ${n(width)} | ${n(fixed.plan.leftOut)} | ${drops ? '**yes**' : 'no'} | ${shown ? 'yes' : '**no**'} |`;
          }),
        ).join('\n'),
    );

    report.h('Does filling a hole still pay, under each run?');
    report.add('\n| run | offered plans with one hole | of those, improved by a token |\n|---|---|---|');
    for (const fixed of atWidth(24)) {
      const stocked = MERC_IDS.filter((id) => (base.caps[id] ?? 0) > 0);
      const singles = fixed.rows.filter(
        (row) => stocked.filter((id) => (row.counts[id] ?? 0) === 0).length === 1,
      );
      let improved = 0;
      for (const row of singles) {
        const id = stocked.find((entry) => (row.counts[entry] ?? 0) === 0);
        if (id === undefined) continue;
        const asPlanned = marchResult(base, row.counts).summary.avgDamage;
        if (marchResult(base, { ...row.counts, [id]: 10 }).summary.avgDamage > asPlanned) improved += 1;
      }
      report.add(`| ${fixed.label} | ${n(singles.length)} | ${n(improved)} |`);
    }

    report.save();
  }, 900_000);
});
