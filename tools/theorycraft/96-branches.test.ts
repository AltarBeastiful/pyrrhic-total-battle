/**
 * 96 — **the branches the search does not walk**, each measured on the owner's export of 2026-09-17 (owner,
 * 2026-09-18: *"do the task not walked yet. Never answer from memory, always use theorycrafting using the game
 * knowledge and verify the results we produce with the actual engine. See if you can improve more what we
 * generate."*).
 *
 *  A. **Troop subsets under the sizer.** For each stop's own mercenary counts, every subset of the troop types the
 *     account fields (seven on this profile), sized by Elite, MS and MS relaxed: does any subset beat all of them on damage, on
 *     damage a silver, on damage a hired unit?
 *  B. **The ladder's `gap`.** The whole plan at five gaps: does the ladder ever out-shape the sizer at another
 *     gap?
 *  C. **The finale's shape.** The final march is a ladder over what the stock has left; the sizer's three
 *     methods over the same leftovers, against it.
 *  D. **Leadership held back on purpose.** The plan at 60–100 % of the setup's leadership, with the three
 *     method shapes on: campaign damage, silver and burn, and the ratios.
 *  E. **The other objectives.** What the search's own best-a-silver and best-a-hired plans are, against the
 *     bar's ends, and whether the band refuses them.
 *
 * Every figure is `simulateBattle` on explicit counts (`evaluateCounts`), the same arithmetic the app's recap
 * prints, so a winner here is a march the app would show at that figure.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/96-branches.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluate, evaluateCounts, n, withMethod } from './harness';

const METHODS = ['elite', 'ms', 'msRelaxed'] as const;
const short = (id: string): string =>
  id
    .replace(/-6$/, '')
    .replace('epic-monster-hunter', 'EMH')
    .replace(/^(\w)\w*-(\d)$/, '$1$2');

interface Priced {
  damage: number;
  silver: number;
  gold: number;
  burn: number;
  counts: Record<string, number>;
}

describe.skipIf(!process.env.THEORY)('the branches not walked', () => {
  it('walks each of them on the owner’s export', () => {
    const report = new Report('96-branches');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');
    const input = buildPlanRequest(profile, setup);
    const req: StackRequest = input.request;
    const troopIds = req.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
    const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
    const burnOf = (counts: Record<string, number>): number =>
      mercIds.reduce((sum, id) => sum + Math.ceil((counts[id] ?? 0) / 10), 0);
    const price = (counts: Record<string, number>): Priced => {
      const ev = evaluateCounts(req, counts);
      return {
        damage: ev.summary.avgDamage,
        silver: ev.summary.recovery.silver,
        gold: ev.summary.recovery.gold,
        burn: burnOf(counts),
        counts,
      };
    };
    const ratio = (p: Priced): string =>
      `${(p.damage / Math.max(1, p.silver)).toFixed(2)} · ${n(Math.round(p.damage / Math.max(1, p.burn)))}`;
    const troopsOf = (counts: Record<string, number>): string =>
      troopIds
        .filter((id) => (counts[id] ?? 0) > 0)
        .map(short)
        .join(' ');
    const hiredOf = (counts: Record<string, number>): string =>
      mercIds.map((id) => `${short(id)} ${n(counts[id] ?? 0)}`).join(' · ');

    const plan: CampaignPlan = planCampaign({ ...input, withTrade: true });
    report.h('The frame');
    report.add(
      `Owner's export of 2026-09-17, ${n(req.housing.leadership)} leadership / ${n(req.housing.authority)} authority, the ` +
        `app's flags (A on, sizer shape on under three methods, burn axis, three stops, horizon 4). The bar as the app ` +
        `draws it: ${plan.alternatives.map((row) => `${row.pick} ${n(row.repeat.mercLost)} burned / ${n(row.repeat.damage)} / ${n(row.repeat.silver)} (${row.shape})`).join(' · ')}. ` +
        'Every figure below is `simulateBattle` on explicit counts.',
    );

    // ---- A. troop subsets -------------------------------------------------------------------------------
    report.h('A. Every troop subset, under each method, with each stop’s own mercenaries');
    report.add(
      '| stop | method | best subset by damage | damage | silver | burned | a silver · a hired | all types | vs all types |\n' +
        '|---|---|---|---|---|---|---|---|---|',
    );
    const subsets: string[][] = [];
    for (let mask = 1; mask < 1 << troopIds.length; mask += 1) {
      subsets.push(troopIds.filter((_id, index) => (mask & (1 << index)) !== 0));
    }
    const bestSubsetByRatio: string[] = [];
    for (const row of plan.alternatives) {
      const hiredCaps: Record<string, number> = {};
      for (const id of mercIds) hiredCaps[id] = row.counts[id] ?? 0;
      for (const method of METHODS) {
        let best: { ids: string[]; priced: Priced } | undefined;
        let bestSilver: { ids: string[]; priced: Priced } | undefined;
        let bestHired: { ids: string[]; priced: Priced } | undefined;
        let all: Priced | undefined;
        for (const ids of subsets) {
          const sub = withMethod(
            {
              ...req,
              caps: { ...req.caps, ...hiredCaps },
              units: req.units.filter(
                (unit) =>
                  ids.includes(unit.id) || (mercIds.includes(unit.id) && (hiredCaps[unit.id] ?? 0) > 0),
              ),
            },
            method,
          );
          const ev = evaluate(sub);
          const counts: Record<string, number> = {};
          for (const stack of ev.result.stacks) counts[stack.unitId] = stack.count;
          const priced = price(counts);
          if (ids.length === troopIds.length) all = priced;
          if (!best || priced.damage > best.priced.damage) best = { ids, priced };
          const perSilver = priced.damage / Math.max(1, priced.silver);
          const perHired = priced.damage / Math.max(1, priced.burn);
          if (!bestSilver || perSilver > bestSilver.priced.damage / Math.max(1, bestSilver.priced.silver)) {
            bestSilver = { ids, priced };
          }
          if (!bestHired || perHired > bestHired.priced.damage / Math.max(1, bestHired.priced.burn)) {
            bestHired = { ids, priced };
          }
        }
        if (!best || !all || !bestSilver || !bestHired) continue;
        report.add(
          `| \`${row.pick}\` | ${method} | ${best.ids.map(short).join(' ')} | **${n(best.priced.damage)}** | ${n(best.priced.silver)} | ` +
            `${n(best.priced.burn)} | ${ratio(best.priced)} | ${n(all.damage)} | ` +
            `${(((best.priced.damage - all.damage) / all.damage) * 100).toFixed(1)} % |`,
        );
        bestSubsetByRatio.push(
          `- \`${row.pick}\` · ${method}: best a silver **${bestSilver.ids.map(short).join(' ')}** at ${ratio(bestSilver.priced)} ` +
            `(${n(bestSilver.priced.damage)} for ${n(bestSilver.priced.silver)}); best a hired **${bestHired.ids.map(short).join(' ')}** ` +
            `at ${ratio(bestHired.priced)} (${n(bestHired.priced.damage)}, ${n(bestHired.priced.burn)} burned); all types ${ratio(all)}.`,
        );
      }
    }
    report.add(
      '\nThe subsets that win a *ratio*, since a smaller march can be cheaper without being better:\n',
    );
    for (const line of bestSubsetByRatio) report.add(line);

    // ---- B. the ladder's gap ----------------------------------------------------------------------------
    report.h('B. The ladder’s gap');
    report.add(
      '| gap | stops (burned) | sweet: damage | sweet: silver | sweet: shape | most: damage | most: shape | campaign damage | ladder rows in the band |\n' +
        '|---|---|---|---|---|---|---|---|---|',
    );
    for (const gap of [0.05, 0.1, 0.25, 0.5, 1]) {
      const at = planCampaign({ ...input, gap, withTrade: true });
      const sweet = at.recommend;
      const most = at.alternatives[at.alternatives.length - 1];
      const ladders = (at.trade ?? []).filter((row) => row.shape === 'ladder').length;
      report.add(
        `| ${gap} | ${at.alternatives.map((row) => n(row.repeat.mercLost)).join(' · ')} | ${n(sweet?.repeat.damage ?? 0)} | ` +
          `${n(sweet?.repeat.silver ?? 0)} | ${sweet?.shape ?? '—'} | ${n(most?.repeat.damage ?? 0)} | ${most?.shape ?? '—'} | ` +
          `${n(at.totalDamage)} | ${n(ladders)} of ${n(at.trade?.length ?? 0)} |`,
      );
    }

    // ---- C. the finale's shape --------------------------------------------------------------------------
    report.h('C. The finale’s shape');
    const sweet = plan.recommend;
    if (sweet?.finaleCounts) {
      const leftovers: Record<string, number> = {};
      for (const id of mercIds) leftovers[id] = sweet.finaleCounts[id] ?? 0;
      const ladderFinale = price(sweet.finaleCounts);
      report.add(
        `The sweet spot's final march, as the plan builds it now (the best shape over the leftovers ${hiredOf(leftovers)}): ` +
          `**${n(ladderFinale.damage)}** damage for ${n(ladderFinale.silver)} silver, troops ${troopsOf(sweet.finaleCounts)}.\n`,
      );
      report.add(
        '| shape | damage | silver | burned | a silver · a hired | troops |\n|---|---|---|---|---|---|',
      );
      report.add(
        `| the plan's own finale | **${n(ladderFinale.damage)}** | ${n(ladderFinale.silver)} | ${n(ladderFinale.burn)} | ${ratio(ladderFinale)} | ${troopsOf(sweet.finaleCounts)} |`,
      );
      for (const method of METHODS) {
        const sub = withMethod(
          {
            ...req,
            caps: { ...req.caps, ...leftovers },
            units: req.units.filter((unit) => unit.pool === 'leadership' || (leftovers[unit.id] ?? 0) > 0),
          },
          method,
        );
        const ev = evaluate(sub);
        const counts: Record<string, number> = {};
        for (const stack of ev.result.stacks) counts[stack.unitId] = stack.count;
        const priced = price(counts);
        report.add(
          `| sizer · ${method} | **${n(priced.damage)}** | ${n(priced.silver)} | ${n(priced.burn)} | ${ratio(priced)} | ${troopsOf(counts)} |`,
        );
      }
    } else {
      report.add('The sweet spot has no final march (nothing left over).');
    }

    // ---- D. leadership held back ------------------------------------------------------------------------
    report.h('D. Leadership held back on purpose');
    report.add(
      '| leadership | stops (burned) | sweet: damage | sweet: silver | sweet: a silver · a hired | most: damage | most: a silver · a hired | campaign damage | campaign silver | campaign burned |\n' +
        '|---|---|---|---|---|---|---|---|---|---|',
    );
    for (const share of [0.6, 0.7, 0.8, 0.9, 1]) {
      const leadership = Math.round(setup.housing.leadership * share);
      const at = planCampaign(
        buildPlanRequest(profile, { ...setup, housing: { ...setup.housing, leadership } }),
      );
      const s = at.recommend;
      const m = at.alternatives[at.alternatives.length - 1];
      const r = (row: PlanTotals | undefined): string =>
        row
          ? `${(row.repeat.damage / row.repeat.silver).toFixed(2)} · ${n(Math.round(row.repeat.damage / Math.max(1, row.repeat.mercLost)))}`
          : '—';
      report.add(
        `| ${n(leadership)} | ${at.alternatives.map((row) => n(row.repeat.mercLost)).join(' · ')} | ${n(s?.repeat.damage ?? 0)} | ` +
          `${n(s?.repeat.silver ?? 0)} | ${r(s)} | ${n(m?.repeat.damage ?? 0)} | ${r(m)} | ${n(s?.totalDamage ?? 0)} | ${n(s?.silver ?? 0)} | ${n(s?.mercLost ?? 0)} |`,
      );
    }

    // ---- E. the other objectives ------------------------------------------------------------------------
    report.h('E. The other objectives');
    const trade = plan.trade ?? [];
    const perS = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.silver);
    const perH = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.mercLost);
    const bestS = trade.reduce<PlanTotals | undefined>(
      (b, r) => (!b || perS(r) > perS(b) ? r : b),
      undefined,
    );
    const bestH = trade.reduce<PlanTotals | undefined>(
      (b, r) => (!b || perH(r) > perH(b) ? r : b),
      undefined,
    );
    const rowLine = (name: string, row: PlanTotals | PlanRow | undefined): string =>
      row
        ? `| ${name} | ${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ${n(row.repeat.silver)} | ${perS(row).toFixed(2)} · ${n(Math.round(perH(row)))} | ${row.shape} | ${hiredOf(row.counts)} |`
        : `| ${name} | — | — | — | — | — | — |`;
    report.add(
      '| plan | burned | damage a march | silver a march | a silver · a hired | shape | hired fielded |\n|---|---|---|---|---|---|---|',
    );
    report.add(rowLine('bar: thrift end', plan.alternatives[0]));
    report.add(rowLine('bar: sweet spot', plan.recommend));
    report.add(rowLine('bar: most damage', plan.alternatives[plan.alternatives.length - 1]));
    report.add(rowLine('band: best a silver', bestS));
    report.add(rowLine('band: best a hired', bestH));
    report.add(rowLine('search: best a silver, band or not (`mostEfficient`)', plan.mostEfficient));
    report.add(rowLine('search: best a hired, band or not (`mostThrifty`)', plan.mostThrifty));
    report.save();
  }, 1_800_000);
});
