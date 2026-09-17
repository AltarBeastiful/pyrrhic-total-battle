/**
 * 90 — **where the sweet spot lands, and where else it could.**
 *
 * The owner, 2026-09-16, on the plan the bar opens on:
 *
 * > *"no change in placement, just the sweet spot seems to be too similar with silver save, especially for
 * > merc spends."*
 *
 * Measured before this file: on his account the sweet spot burned **21** hired units a march where the two
 * named extremes burn **12** (spare-the-stock) and **22** (most-damage) — so the plan the app opened on was one
 * unit from the dearest plan on the bar and saved no stock at all, while spending the same silver as the
 * cheapest. This file asks what the definition was doing, and what other rules answer instead, over the
 * **trade** the engine now hands over (`CampaignInput.withTrade`).
 *
 * Three rules, each stated on the repeated march's own figures:
 *
 *  - **the middle of the trade in stock** — the shipped rule since the owner's correction, and the one this
 *    file exists to justify: the best march whose burn is closest to the middle of the range between the
 *    thriftiest and the dearest plan the bar can carry. It has no free parameter (both ends of the range are plans the engine
 *    found), and it is the answer he chose from the table below.
 *  - **the ratio balance**, the rule it replaced: `argmax min(S/peakS, M/peakM)`, recomputed here over the
 *    offered plans so the comparison is apples to apples.
 *  - **the crossing**: `argmin |S/peakS − M/peakM|` — the plan where the two ratios stand at the same
 *    fraction of their best, which is what "balanced" sounds like it should mean.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/90-the-sweet-spot.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { Report, loadOwner, n, scenarioC, withHousing } from './harness';

/** Damage a silver, on the march — the same figures the trade's own columns print. */
const perSilver = (row: PlanTotals): number =>
  row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
/** Damage a hired unit, on the march. */
const perHired = (row: PlanTotals): number =>
  row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : 0;

describe.skipIf(!process.env.THEORY)('where the sweet spot lands', () => {
  it('puts the shipped rule and the two it replaced over the same trade', () => {
    const report = new Report('90-the-sweet-spot');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    const plan = planCampaign({ request: base, marchTarget: 4, withTrade: true });
    const trade = plan.trade ?? [];
    const shipped = plan.recommend;
    const peakS = Math.max(...trade.map(perSilver));
    const peakM = Math.max(...trade.map(perHired));
    const cheapest = trade[0];
    const burnLo = Math.min(...trade.map((row) => row.repeat.mercLost));
    const burnHi = Math.max(...trade.map((row) => row.repeat.mercLost));

    report.h('The trade on this account');
    report.add(
      `The owner, 2026-09-16, on the bar S-59 drew:\n\n` +
        `> *"no change in placement, just the sweet spot seems to be too similar with silver save, especially\n` +
        `> for merc spends."*\n`,
    );
    report.add(
      `Owner's export, scenario C, the app's horizon (4), no budget. **${n(trade.length)} plans** are offered ` +
        `by the band (the bar draws ${n(plan.alternatives.length)} of them, and \`leftOut\` counts ` +
        `${n(plan.leftOut)} more on the frontier that the band refuses).\n\n` +
        `The burns run from **${n(burnLo)}** to **${n(burnHi)}** hired units a march; peak damage a silver is ` +
        `**${peakS.toFixed(2)}** and peak damage a hired unit **${n(peakM)}**.\n\n` +
        `Cheapest offered: ${n(cheapest?.repeat.damage ?? 0)} damage for ${n(cheapest?.repeat.silver ?? 0)} ` +
        `silver, burning ${n(cheapest?.repeat.mercLost ?? 0)}.`,
    );

    /** Every rule, scored on the trade. */
    const rules: { key: string; why: string; of: PlanTotals | undefined }[] = [
      {
        key: 'the middle of the stock',
        why: 'the shipped rule: the best march whose burn is closest to the middle of the range',
        of: shipped,
      },
      {
        key: 'the ratio balance',
        why: 'the rule it replaced — closest to the best on both ratios, peaks over the offered plans',
        of: trade.reduce<PlanTotals | undefined>((best, row) => {
          const measure = (r: PlanTotals): number => Math.min(perSilver(r) / peakS, perHired(r) / peakM);
          return best === undefined || measure(row) > measure(best) ? row : best;
        }, undefined),
      },
      {
        key: 'the crossing',
        why: 'the two ratios at the same fraction of their best — what "balanced" sounds like',
        of: trade.reduce<PlanTotals | undefined>(
          (best, row) =>
            best === undefined ||
            Math.abs(perSilver(row) / peakS - perHired(row) / peakM) <
              Math.abs(perSilver(best) / peakS - perHired(best) / peakM)
              ? row
              : best,
          undefined,
        ),
      },
    ];

    report.h('What each rule answers');
    report.add(
      `| rule | what it means | damage a march | silver a march | hired burned | damage a silver | damage a hired | vs shipped |\n` +
        `|---|---|---|---|---|---|---|---|\n` +
        rules
          .map((rule) => {
            const row = rule.of;
            if (row === undefined) return `| **${rule.key}** | ${rule.why} | — | — | — | — | — | — |`;
            const delta =
              shipped === undefined
                ? '—'
                : `${(((row.repeat.damage - shipped.repeat.damage) / shipped.repeat.damage) * 100).toFixed(1)} % damage, ` +
                  `${n(row.repeat.mercLost - shipped.repeat.mercLost)} hired`;
            return (
              `| **${rule.key}** | ${rule.why} | **${n(row.repeat.damage)}** | ${n(row.repeat.silver)} | ` +
              `${n(row.repeat.mercLost)} | ${perSilver(row).toFixed(2)} | ${n(perHired(row))} | ${delta} |`
            );
          })
          .join('\n'),
    );

    report.add(
      `The first row is the engine's own \`recommend\` — quoted, never recomputed, so the report cannot drift ` +
        `from the code — and the other two are read off the trade the engine hands over. "vs shipped" is what ` +
        `the choice costs: the damage a march the recommendation gives up, and the hired stock it saves. The ` +
        `owner took the first row on 2026-09-16 — *"spare the stock"*, over the ratio balance.`,
    );

    // The shape of the whole trade, which is what decides whether a middle ground is worth taking: sorted by
    // the stock it burns, because that is the resource the owner is asking about.
    report.h('The trade, by hired stock burned');
    report.add(
      `| hired burned | damage a march | silver a march | damage a silver | damage a hired |\n` +
        `|---|---|---|---|---|\n` +
        [...trade]
          .sort((a, b) => a.repeat.mercLost - b.repeat.mercLost || a.repeat.damage - b.repeat.damage)
          .map(
            (row) =>
              `| ${n(row.repeat.mercLost)} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ` +
              `${perSilver(row).toFixed(2)} | ${n(perHired(row))} |`,
          )
          .join('\n'),
    );

    report.save();
  }, 900_000);
});
