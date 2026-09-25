/**
 * 177 — **the silver-saver guard, per march** (W14 step 2, `docs/plans/every-death-order.md` §3.2; suspect a of
 * experiment 176).
 *
 * The change: a silver saver's marches are re-typed under **their own silver must not rise and their damage per
 * silver must not drop** (`retypeMarch`'s `silverCeiling` and `holdDamagePerSilver`, `holdSilver` in `plan.ts`'s
 * re-typing pass; the owner, 2026-09-25) instead of the whole row being handed back when any of its marches
 * raised silver; the row-level check stays as the backstop, extended to damage per silver. Where that loses
 * the bar's shortest queue, the marches are re-typed again with their queue held too (variant iii of the
 * coordinator's three; (i) held it whenever the stop held the reading, (ii) always). A silver saver's own-ladder
 * finale is re-typed under the same rules, and judged against the stop as it stood before the re-typing.
 *
 * §2's report: every benchmark army planned with `budgetMs` off (the plan kernel set, as 176 did; the whole-plan
 * equivalence holds the TS path to the same plan), reported by `plan-report.ts` and compared with HEAD's
 * `out/176-baseline.json`: every army, every stop, every march, every criterion; better / equal / worse; every
 * worse figure, per stop and per march; the ten readings; the bar criteria; TotalStack at matched spend. Plan
 * time is measured on both paths (best of `REPS`).
 *
 * `THEORY=1 npx vitest run --project ts tools/theorycraft/177-silver-saver-per-march.test.ts`
 * (`OUT177=<name>` writes the report under another name, e.g. to time HEAD in a worktree.)
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { setKernel } from '../../src/engine/fast';
import type { CampaignPlan } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { planTrace } from '../../src/engine/plan-trace';
import type { PlanTraceEvent } from '../../src/engine/plan-trace';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import { createPlanKernel } from '../../src/kernel/plan';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { OUT_DIR, Report } from './harness';
import type { ArmyReport, Figures } from './plan-report';
import {
  RATES,
  billOfFigures,
  compareReports,
  fmt,
  loadJson,
  renderBaseline,
  renderComparison,
  reportArmy,
  saveJson,
  short,
} from './plan-report';

const REPS = Number(process.env.REPS177 ?? 3);

const planOnce = (
  request: StackRequest,
): { plan: CampaignPlan | string; events: PlanTraceEvent[]; ms: number } => {
  const events: PlanTraceEvent[] = [];
  planTrace.sink = (e) => events.push(e);
  const began = performance.now();
  try {
    return {
      plan: planCampaign({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }),
      events,
      ms: performance.now() - began,
    };
  } catch (error) {
    return {
      plan: error instanceof Error ? error.message : String(error),
      events,
      ms: performance.now() - began,
    };
  } finally {
    planTrace.sink = null;
  }
};

const FIELDS: [keyof Figures, boolean][] = [
  ['worst', true],
  ['best', true],
  ['silver', false],
  ['gold', false],
  ['hired', false],
  ['coins', false],
  ['seconds', false],
  ['perSilver', true],
  ['perGold', true],
  ['perHired', true],
  ['perCoin', true],
];
const worseOf = (o: Figures, s: Figures): string[] =>
  FIELDS.filter(([k, high]) => (high ? s[k] < o[k] * (1 - 1e-12) : s[k] > o[k] * (1 + 1e-12))).map(
    ([k]) => `${k} ${fmt(o[k], 3)} → ${fmt(s[k], 3)}`,
  );

describe.skipIf(!process.env.THEORY)('177 — the silver-saver guard, per march', () => {
  it('reports every march use case against HEAD', () => {
    const module = loadKernelModule();
    const planKernel = createPlanKernel(module);
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const name = process.env.OUT177 ?? '177-silver-saver-per-march';
    const report = new Report(name);
    const after: ArmyReport[] = [];
    const times: { label: string; kernel: number; ts: number; same: boolean }[] = [];

    for (const scenario of scenarios) {
      const request = scenario.request;
      let kernelMs = Infinity;
      let tsMs = Infinity;
      let planned: CampaignPlan | string = '';
      let events: PlanTraceEvent[] = [];
      let tsPlan: CampaignPlan | string = '';
      for (let r = 0; r < REPS; r += 1) {
        setKernel(planKernel);
        const k = planOnce(request);
        setKernel(null);
        kernelMs = Math.min(kernelMs, k.ms);
        planned = k.plan;
        events = k.events;
        const t = planOnce(request);
        tsMs = Math.min(tsMs, t.ms);
        tsPlan = t.plan;
      }
      const bar = (p: CampaignPlan | string): string =>
        typeof p === 'string' ? p : JSON.stringify([p.alternatives, p.counts, p.finaleCounts, p.totalDamage]);
      times.push({ label: scenario.label, kernel: kernelMs, ts: tsMs, same: bar(planned) === bar(tsPlan) });
      const rechosen: string[] = [];
      for (const e of events) {
        if (e.step === 'fold' && e.band.length > 0)
          rechosen.push(`fold took band row(s) as ${e.band.map((p) => short(p ?? '?')).join(', ')}`);
        if (e.step === 'fold' && e.before.length !== e.after.length)
          rechosen.push(
            `fold ${e.before.map((p) => short(p ?? '?')).join('/')} → ${e.after.map((p) => short(p ?? '?')).join('/')}`,
          );
        if (e.step === 'allInS94') rechosen.push(`S-94 all-in ${e.outcome}`);
        if (e.step === 'allInDescending') rechosen.push(`all-in ${e.outcome} (174)`);
        if (e.step === 'ownLadderFinale') rechosen.push(`${short(e.pick ?? '?')} own-ladder finale`);
      }
      after.push(
        reportArmy(scenario.label, request, planned, scenario.externals, { rechosen, planMs: kernelMs }),
      );
      process.stderr.write(
        `177 ${scenario.label.slice(0, 44)}: kernel ${kernelMs.toFixed(0)} ms, TS ${tsMs.toFixed(0)} ms\n`,
      );
    }

    const before = loadJson(new URL('176-baseline.json', OUT_DIR)).armies;
    const c = compareReports(before, after);

    // Every march, every criterion: the per-march rating and every worse figure, march by march.
    const marchLines: string[] = [];
    const marchWorse: string[] = [];
    const gains: { where: string; rating: number }[] = [];
    let mb = 0;
    let me = 0;
    let mw = 0;
    for (const a of after) {
      const b = before.find((x) => x.label === a.label);
      if (!b) continue;
      for (const s of a.stops) {
        const o = b.stops.find((x) => x.pick === s.pick);
        for (const m of s.marches) {
          const om = o?.marches.find((x) => x.role === m.role);
          const where = `${a.label.slice(0, 44)} | ${short(s.pick)} | ${m.role}`;
          if (!om) {
            marchLines.push(`| ${where} | new | — | — |`);
            continue;
          }
          const r = rate(billOfFigures(om), billOfFigures(m), RATES);
          const worse = worseOf(om, m);
          if (m.shelterMargin < om.shelterMargin)
            worse.push(`shelter margin ${fmt(om.shelterMargin, 3)} → ${fmt(m.shelterMargin, 3)}`);
          const moved = om.key !== m.key || om.times !== m.times;
          const verdict =
            !moved && worse.length === 0
              ? 'unchanged'
              : r > 1e-9
                ? 'better'
                : r < -1e-9
                  ? 'worse'
                  : worse.length
                    ? 'worse'
                    : 'equal';
          if (verdict === 'better') mb += 1;
          else if (verdict === 'worse') mw += 1;
          else me += 1;
          if (r > 1e-9) gains.push({ where, rating: r * m.times });
          for (const w of worse) marchWorse.push(`| ${where} | ${fmt(r, 3)} | ${w} |`);
          marchLines.push(`| ${where} | ${verdict} | ${fmt(r, 3)} | ${worse.join('; ') || '—'} |`);
        }
        if (o)
          for (const om of o.marches)
            if (!s.marches.some((m) => m.role === om.role))
              marchLines.push(`| ${a.label.slice(0, 44)} | ${short(s.pick)} | ${om.role} | gone | — | — |`);
      }
    }
    gains.sort((x, y) => y.rating - x.rating);

    const criteria = after.flatMap((a) =>
      Object.entries(a.criteria)
        .filter(([, v]) => !v.holds)
        .map(([k, v]) => `${a.label.slice(0, 44)}: ${k} (${v.detail})`),
    );
    const kernelTotal = times.reduce((s, t) => s + t.kernel, 0);
    const tsTotal = times.reduce((s, t) => s + t.ts, 0);
    const headKernel = before.reduce((s, a) => s + (a.planMs ?? 0), 0);

    report.add('# 177 — the silver-saver guard, per march (W14 step 2)\n');
    report.add(
      'A silver saver’s marches are re-typed under **their own silver must not rise and their damage per silver must ' +
        'not drop** (`retypeMarch`’s `silverCeiling` and `holdDamagePerSilver`, `holdSilver` in `plan.ts`); its ' +
        'queue seconds are held too where the bar’s shortest queue would otherwise be lost; its own-ladder finale is ' +
        'not re-typed (step 3) and is judged against the stop before the re-typing; the row-level check (“a ' +
        'silver saver stays one”) stays as the backstop, extended to damage per silver. Every ' +
        'benchmark army planned with `budgetMs` off, the plan kernel set; compared with HEAD’s ' +
        '`out/176-baseline.json` by `plan-report.ts`. Every figure measured.\n',
    );
    report.add(
      `**Stops** better / equal / worse: **${String(c.total.better)} / ${String(c.total.equal)} / ${String(c.total.worse)}**` +
        ` (${String(c.stops.filter((s) => s.verdict === 'new').length)} new, ${String(c.stops.filter((s) => s.verdict === 'gone').length)} gone). ` +
        `**Marches** better / equal-or-unchanged / worse: **${String(mb)} / ${String(me)} / ${String(mw)}**. ` +
        `Σ rating gained over the marches (× times played): ${fmt(
          gains.reduce((s, g) => s + g.rating, 0),
          3,
        )}. ` +
        `TotalStack at matched spend (dominated / no stop fits): ${c.total.tsBefore} → ${c.total.tsAfter}; 162's rows: ` +
        `${String(c.total.kept162Before)} → ${String(c.total.kept162After)}. Bar criteria broken: ${criteria.length ? criteria.join('; ') : 'none'}. ` +
        `Readings worse: ${c.perArmy.flatMap((a) => a.readingsWorse.map((r) => `${a.label.slice(0, 44)}: ${r}`)).join('; ') || 'none'}.\n`,
    );
    report.add(
      '## The marches that gained (rating × times played)\n\n| army | stop | march | rating |\n|---|---|---|---:|',
    );
    for (const g of gains) report.add(`| ${g.where} | ${fmt(g.rating, 3)} |`);
    report.add(
      '\n## Every worse figure, per march\n\n| army | stop | march | march rating | figure |\n|---|---|---|---:|---|',
    );
    report.add(marchWorse.length ? marchWorse.join('\n') : '| — | — | — | — | none |');
    report.add('\n## Per stop (paired by pick) and per army\n');
    report.add(renderComparison(c));
    report.add(
      '\n## Every march use case\n\n| army | stop | march | verdict | rating | worse figures |\n|---|---|---|---|---:|---|',
    );
    report.add(marchLines.join('\n'));
    report.add(
      `\n## Plan time (best of ${String(REPS)})\n\nkernel Σ ${fmt(kernelTotal)} ms (HEAD’s baseline run: ${fmt(headKernel)} ms, one run); TS Σ ${fmt(tsTotal)} ms.\n\n| army | kernel ms | TS ms | same plan |\n|---|---:|---:|---|`,
    );
    for (const t of times)
      report.add(
        `| ${t.label.slice(0, 60)} | ${fmt(t.kernel)} | ${fmt(t.ts)} | ${t.same ? 'same' : '**differs**'} |`,
      );
    report.add('\n## After: every army, every stop, every march, every criterion\n');
    report.add(renderBaseline(after));

    // The owner, 2026-09-25: a full-criteria recap of every silver saver, before → after; any rise in silver or
    // drop in damage per silver is flagged, however small.
    report.add(
      '\n## Every silver saver, every criterion (HEAD → after)\n\n' +
        '| army | worst | best | silver | dmg/silver | gold | hired | coins | queue | rating | shelter margin | sustain | flag |\n' +
        '|---|---|---|---|---|---|---|---|---|---:|---|---|---|',
    );
    const arrow = (x: number, y: number, digits = 0): string =>
      x === y ? `${fmt(x, digits)} (=)` : `${fmt(x, digits)} → ${fmt(y, digits)}`;
    let flagged = 0;
    for (const a of after) {
      const b = before.find((x) => x.label === a.label);
      const s = a.stops.find((x) => x.pick === 'silver-saver');
      const o = b?.stops.find((x) => x.pick === 'silver-saver');
      if (!s && !o) continue;
      if (!s || !o) {
        report.add(`| ${a.label.slice(0, 60)} | ${o ? 'SS gone' : 'SS new'} |||||||||||**flag**|`);
        flagged += 1;
        continue;
      }
      const x = o.campaign;
      const y = s.campaign;
      const flags: string[] = [];
      if (y.silver > x.silver) flags.push(`silver +${fmt(y.silver - x.silver)}`);
      if (y.perSilver < x.perSilver) flags.push(`dmg/silver −${fmt(x.perSilver - y.perSilver, 6)}`);
      for (let i = 0; i < s.marches.length; i += 1) {
        const m = s.marches[i] as (typeof s.marches)[number];
        const om = o.marches.find((z) => z.role === m.role);
        if (!om) continue;
        if (m.silver > om.silver) flags.push(`${m.role} silver +${fmt(m.silver - om.silver)}`);
        if (m.perSilver < om.perSilver)
          flags.push(`${m.role} dmg/silver −${fmt(om.perSilver - m.perSilver, 6)}`);
      }
      if (flags.length > 0) flagged += 1;
      report.add(
        `| ${a.label.slice(0, 60)} | ${arrow(x.worst, y.worst)} | ${arrow(x.best, y.best)} | ${arrow(x.silver, y.silver)} | ` +
          `${arrow(x.perSilver, y.perSilver, 4)} | ${arrow(x.gold, y.gold)} | ${arrow(x.hired, y.hired)} | ${arrow(x.coins, y.coins)} | ` +
          `${arrow(x.seconds / 3600, y.seconds / 3600, 1)} h | ${fmt(rate(billOfFigures(x), billOfFigures(y), RATES), 3)} | ` +
          `${arrow(o.shelterMargin, s.shelterMargin, 3)} | ${arrow(o.sustain, s.sustain)} | ${flags.length ? `**${flags.join('; ')}**` : '—'} |`,
      );
    }
    report.add(
      `\nSilver savers flagged (silver rising or damage per silver dropping, stop or march): **${String(flagged)}**.`,
    );
    saveJson(new URL(`${name}.json`, OUT_DIR), after, { budgetMs: 'off', horizon: HORIZON });
    process.stderr.write(`177 written to ${report.save()}\n`);
  }, 7_200_000);
});
