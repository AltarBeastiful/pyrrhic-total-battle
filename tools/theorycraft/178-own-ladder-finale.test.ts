/**
 * 178 — **the own-ladder finale, re-typed** (W14 step 3, `docs/plans/every-death-order.md` §3.3; experiment 176,
 * cause e: the finale sized on the march's own ladder is built after the re-typing pass and was never re-typed).
 *
 * Variants, each measured on every benchmark army with `budgetMs` off, on both paths:
 *  - none: HEAD's logic (the control, timed in the same process);
 *  - (i) each finale the own ladders size is re-typed before it is rated, inside the own-ladder block (`retypeOne`,
 *    its guards and cache; a silver saver under step 2's holds); a re-typed finale is taken over the sized one only
 *    when it passes the block's guards, keeps the saver names true and loses no reading the sized one keeps;
 *  - (ii) a second re-typing pass over the marches the first never saw (the own-ladder finales and the first
 *    pass's own outputs), then `keepReadings` against the bar before it and the fold's hand-back;
 *  - (i)+(ii).
 *
 * §2's report, for the variant kept (`VARIANT178`, default `i`): every army, every stop, every march, every
 * criterion, compared with both HEAD before W14 (`out/176-baseline.json`) and step 2's state (`out/177-silver-saver-
 * per-march.json`); better / equal / worse; every worse figure; the ten readings; the bar criteria; TotalStack at
 * matched spend; which of 176's "not a fixed point" marches each variant picks up; plan time on both paths (best
 * of `REPS178`); the full-criteria recap of every silver saver.
 *
 * `THEORY=1 npx vitest run --project ts tools/theorycraft/178-own-ladder-finale.test.ts`
 *
 * The variants are chosen through a temporary switch (`globalThis.__w14`) that is **not** in the shipped engine,
 * which keeps (i) alone: apply `docs/research/patches/178-variants.patch` to `src/engine/plan.ts` at 19d1efc to
 * reproduce the variant table. Without it every variant plans the shipped (i).
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { setKernel } from '../../src/engine/fast';
import type { CampaignPlan } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { planTrace } from '../../src/engine/plan-trace';
import type { PlanTraceEvent } from '../../src/engine/plan-trace';
import { rate } from '../../src/engine/rating';
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

const REPS = Number(process.env.REPS178 ?? 3);
type Variant = { name: string; inBlock: boolean; second: boolean };
const VARIANTS: Variant[] = [
  { name: 'none', inBlock: false, second: false },
  { name: 'i', inBlock: true, second: false },
  { name: 'ii', inBlock: false, second: true },
  { name: 'i+ii', inBlock: true, second: true },
];
const KEPT = process.env.VARIANT178 ?? 'i';
const setVariant = (v: Variant): void => {
  (globalThis as { __w14?: { inBlock: boolean; second: boolean } }).__w14 = {
    inBlock: v.inBlock,
    second: v.second,
  };
};

const planOnce = (
  request: Parameters<typeof planCampaign>[0]['request'],
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

interface MarchCompare {
  lines: string[];
  worse: string[];
  gains: { where: string; rating: number }[];
  better: number;
  equal: number;
  worseCount: number;
  /** Rating × times of every march, by `army | stop | role`. */
  byMarch: Map<string, number>;
}
const compareMarches = (before: ArmyReport[], after: ArmyReport[]): MarchCompare => {
  const out: MarchCompare = {
    lines: [],
    worse: [],
    gains: [],
    better: 0,
    equal: 0,
    worseCount: 0,
    byMarch: new Map(),
  };
  for (const a of after) {
    const b = before.find((x) => x.label === a.label);
    if (!b) continue;
    for (const s of a.stops) {
      const o = b.stops.find((x) => x.pick === s.pick);
      for (const m of s.marches) {
        const om = o?.marches.find((x) => x.role === m.role);
        const where = `${a.label.slice(0, 44)} | ${short(s.pick)} | ${m.role}`;
        if (!om) {
          out.lines.push(`| ${where} | new | — | — |`);
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
        if (verdict === 'better') out.better += 1;
        else if (verdict === 'worse') out.worseCount += 1;
        else out.equal += 1;
        out.byMarch.set(`${a.label.slice(0, 44)}|${short(s.pick)}|${m.role}`, r * m.times);
        if (r > 1e-9) out.gains.push({ where, rating: r * m.times });
        for (const w of worse) out.worse.push(`| ${where} | ${fmt(r, 3)} | ${w} |`);
        out.lines.push(`| ${where} | ${verdict} | ${fmt(r, 3)} | ${worse.join('; ') || '—'} |`);
      }
      if (o)
        for (const om of o.marches)
          if (!s.marches.some((m) => m.role === om.role))
            out.lines.push(`| ${a.label.slice(0, 44)} | ${short(s.pick)} | ${om.role} | gone | — | — |`);
    }
  }
  out.gains.sort((x, y) => y.rating - x.rating);
  return out;
};

/** 176's "other — re-typed march is not a fixed point" marches, read off its table: army prefix, stop, role. */
const notFixedPoints = (): { army: string; stop: string; role: string; gain: number }[] => {
  const md = readFileSync(new URL('176-where-death-orders-are-lost.md', OUT_DIR), 'utf8');
  const out: { army: string; stop: string; role: string; gain: number }[] = [];
  for (const line of md.split('\n')) {
    if (!line.includes('| other: ')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const army = cells[1] ?? '';
    const gain = Number((cells[5] ?? '').replace(/[*+]/g, ''));
    for (const which of (cells[3] ?? '').split(',').map((w) => w.trim())) {
      const [stop, ...role] = which.split(' ');
      out.push({ army, stop: stop ?? '', role: role.join(' '), gain });
    }
  }
  return out;
};

describe.skipIf(!process.env.THEORY)('178 — the own-ladder finale, re-typed', () => {
  it('reports every march use case against 176 and 177, for each variant', () => {
    const module = loadKernelModule();
    const planKernel = createPlanKernel(module);
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const name = process.env.OUT178 ?? '178-own-ladder-finale';
    const report = new Report(name);
    const base176 = loadJson(new URL('176-baseline.json', OUT_DIR)).armies;
    const base177 = loadJson(new URL('177-silver-saver-per-march.json', OUT_DIR)).armies;
    const fixed = notFixedPoints();

    const runs = new Map<
      string,
      { after: ArmyReport[]; times: { label: string; kernel: number; ts: number; same: boolean }[] }
    >();
    for (const variant of VARIANTS) {
      setVariant(variant);
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
          typeof p === 'string'
            ? p
            : JSON.stringify([p.alternatives, p.counts, p.finaleCounts, p.totalDamage]);
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
      }
      runs.set(variant.name, { after, times });
      process.stderr.write(
        `178 ${variant.name}: kernel Σ ${times.reduce((s, t) => s + t.kernel, 0).toFixed(0)} ms, TS Σ ${times.reduce((s, t) => s + t.ts, 0).toFixed(0)} ms\n`,
      );
    }
    setVariant(VARIANTS.find((v) => v.name === KEPT) ?? (VARIANTS[1] as Variant));

    const criteriaOf = (after: ArmyReport[]): string[] =>
      after.flatMap((a) =>
        Object.entries(a.criteria)
          .filter(([, v]) => !v.holds)
          .map(([k, v]) => `${a.label.slice(0, 44)}: ${k} (${v.detail})`),
      );
    const readingsWorse = (c: ReturnType<typeof compareReports>): string =>
      c.perArmy.flatMap((a) => a.readingsWorse.map((r) => `${a.label.slice(0, 44)}: ${r}`)).join('; ') ||
      'none';
    const none = runs.get('none') as { times: { kernel: number; ts: number }[] };
    const sum = (t: { kernel: number; ts: number }[], k: 'kernel' | 'ts'): number =>
      t.reduce((s, x) => s + x[k], 0);

    report.add('# 178 — the own-ladder finale, re-typed (W14 step 3)\n');
    report.add(
      'The finale sized on a stop’s own ladder (`plan.ts`, trace step `ownLadderFinale`) was built after the re-typing ' +
        'pass and never re-typed (176, cause e: 5 marches, +28.65). Every benchmark army planned with `budgetMs` off, the ' +
        'plan kernel set (the TS path planned too and compared bar for bar); compared with HEAD before W14 ' +
        '(`out/176-baseline.json`) and with step 2’s state (`out/177-silver-saver-per-march.json`) by `plan-report.ts`. ' +
        `Every figure measured. Kept: **${KEPT}**.\n`,
    );

    // The variants side by side.
    report.add(
      `## The variants\n\n| variant | stops vs 177 (b/e/w) | stops vs 176 (b/e/w) | marches vs 177 (b/e/w) | Σ rating vs 177 | readings worse vs 177 | criteria broken | TotalStack | 162 | kernel Σ ms (+ vs none) | TS Σ ms (+ vs none) | TS = kernel |\n|---|---|---|---|---:|---|---|---|---:|---:|---:|---|`,
    );
    for (const variant of VARIANTS) {
      const run = runs.get(variant.name);
      if (!run) continue;
      const c7 = compareReports(base177, run.after);
      const c6 = compareReports(base176, run.after);
      const m7 = compareMarches(base177, run.after);
      const k = sum(run.times, 'kernel');
      const t = sum(run.times, 'ts');
      report.add(
        `| ${variant.name} | ${String(c7.total.better)}/${String(c7.total.equal)}/${String(c7.total.worse)} | ` +
          `${String(c6.total.better)}/${String(c6.total.equal)}/${String(c6.total.worse)} | ` +
          `${String(m7.better)}/${String(m7.equal)}/${String(m7.worseCount)} | ${fmt(
            m7.gains.reduce((s, g) => s + g.rating, 0),
            3,
          )} | ` +
          `${readingsWorse(c7)} | ${criteriaOf(run.after).join('; ') || 'none'} | ${c7.total.tsAfter} | ${String(c7.total.kept162After)} | ` +
          `${fmt(k)} (${fmt(k - sum(none.times, 'kernel'))}) | ${fmt(t)} (${fmt(t - sum(none.times, 'ts'))}) | ${run.times.every((x) => x.same) ? 'same' : '**differs**'} |`,
      );
    }

    // Which of 176's "not a fixed point" marches each variant picks up (rating × times against 177, > 0.01).
    report.add(
      `\n## 176’s “other — not a fixed point” marches (${String(fixed.length)} marches), picked up against 177\n\n| army | stop | march | 176 gain | ${VARIANTS.map((v) => v.name).join(' | ')} |\n|---|---|---|---:|${VARIANTS.map(() => '---:').join('|')}|`,
    );
    const pickedUp = new Map<string, { n: number; sum: number }>();
    const marchMaps = new Map(
      VARIANTS.map((v) => [v.name, compareMarches(base177, runs.get(v.name)?.after ?? []).byMarch]),
    );
    for (const f of fixed) {
      const cells = VARIANTS.map((v) => {
        const m = marchMaps.get(v.name);
        let r: number | undefined;
        for (const [key, value] of m ?? []) {
          const [army, stop, role] = key.split('|');
          if (army === f.army && stop === f.stop && role === f.role) r = value;
        }
        if (r !== undefined && r > 0.01) {
          const p = pickedUp.get(v.name) ?? { n: 0, sum: 0 };
          pickedUp.set(v.name, { n: p.n + 1, sum: p.sum + r });
        }
        return r === undefined ? '—' : fmt(r, 3);
      });
      report.add(`| ${f.army} | ${f.stop} | ${f.role} | ${fmt(f.gain, 3)} | ${cells.join(' | ')} |`);
    }
    report.add(
      `\nPicked up (> 0.01): ${VARIANTS.map((v) => `${v.name} ${String(pickedUp.get(v.name)?.n ?? 0)} (+${fmt(pickedUp.get(v.name)?.sum ?? 0, 3)})`).join(', ')}.`,
    );

    const kept = runs.get(KEPT) as {
      after: ArmyReport[];
      times: { label: string; kernel: number; ts: number; same: boolean }[];
    };
    const after = kept.after;
    for (const [tag, before] of [
      ['177 (step 2, the new “before”)', base177],
      ['176 (HEAD before W14)', base176],
    ] as const) {
      const c = compareReports(before, after);
      const m = compareMarches(before, after);
      report.add(`\n## Against ${tag}\n`);
      report.add(
        `**Stops** better / equal / worse: **${String(c.total.better)} / ${String(c.total.equal)} / ${String(c.total.worse)}**` +
          ` (${String(c.stops.filter((s) => s.verdict === 'new').length)} new, ${String(c.stops.filter((s) => s.verdict === 'gone').length)} gone). ` +
          `**Marches** better / equal-or-unchanged / worse: **${String(m.better)} / ${String(m.equal)} / ${String(m.worseCount)}**. ` +
          `Σ rating gained over the marches (× times played): ${fmt(
            m.gains.reduce((s, g) => s + g.rating, 0),
            3,
          )}. ` +
          `TotalStack at matched spend (dominated / no stop fits): ${c.total.tsBefore} → ${c.total.tsAfter}; 162's rows: ` +
          `${String(c.total.kept162Before)} → ${String(c.total.kept162After)}. Bar criteria broken: ${criteriaOf(after).join('; ') || 'none'}. ` +
          `Readings worse: ${readingsWorse(c)}.\n`,
      );
      report.add(
        '### The marches that gained (rating × times played)\n\n| army | stop | march | rating |\n|---|---|---|---:|',
      );
      for (const g of m.gains) report.add(`| ${g.where} | ${fmt(g.rating, 3)} |`);
      report.add(
        '\n### Every worse figure, per march\n\n| army | stop | march | march rating | figure |\n|---|---|---|---:|---|',
      );
      report.add(m.worse.length ? m.worse.join('\n') : '| — | — | — | — | none |');
      report.add('\n### Per stop (paired by pick) and per army\n');
      report.add(renderComparison(c));
      report.add(
        '\n### Every march use case\n\n| army | stop | march | verdict | rating | worse figures |\n|---|---|---|---|---:|---|',
      );
      report.add(m.lines.join('\n'));
    }

    // The ten readings, 177 → after, per army.
    report.add('\n## The ten readings (177 → after)\n');
    const heads = after[0]?.readings.map((r) => r.head) ?? [];
    report.add(`| army | ${heads.join(' | ')} |\n|---|${heads.map(() => '---').join('|')}|`);
    for (const a of after) {
      const b = base177.find((x) => x.label === a.label);
      const cells = a.readings.map((r, i) => {
        const o = b?.readings[i];
        const digits = r.head.startsWith('dmg') ? 4 : 0;
        return !o || o.value === r.value
          ? fmt(r.value, digits)
          : `${fmt(o.value, digits)} → ${fmt(r.value, digits)}`;
      });
      report.add(`| ${a.label.slice(0, 44)} | ${cells.join(' | ')} |`);
    }
    report.add(
      '\n## The bar criteria (after)\n\n| army | order | no stop beaten | shelter | sustain | ≤ 5 | sweet spot | S-58 B |\n|---|---|---|---|---|---|---|---|',
    );
    for (const a of after)
      report.add(
        `| ${a.label.slice(0, 44)} | ${(
          ['order', 'noStopBeaten', 'shelter', 'sustain', 'atMostFive', 'sweetSpot', 's58b'] as const
        )
          .map((k) => (a.criteria[k].holds ? 'holds' : `**broken** (${a.criteria[k].detail})`))
          .join(' | ')} |`,
      );

    report.add(
      `\n## Plan time (best of ${String(REPS)}), variant ${KEPT} against none (HEAD’s logic, same process)\n\n` +
        `kernel Σ ${fmt(sum(kept.times, 'kernel'))} ms against ${fmt(sum(none.times, 'kernel'))}; TS Σ ${fmt(sum(kept.times, 'ts'))} ms against ${fmt(sum(none.times, 'ts'))}.\n\n` +
        '| army | kernel ms (none) | TS ms (none) | same plan |\n|---|---:|---:|---|',
    );
    kept.times.forEach((t, i) => {
      const n = (none.times[i] ?? { kernel: 0, ts: 0 }) as { kernel: number; ts: number };
      report.add(
        `| ${t.label.slice(0, 60)} | ${fmt(t.kernel)} (${fmt(n.kernel)}) | ${fmt(t.ts)} (${fmt(n.ts)}) | ${t.same ? 'same' : '**differs**'} |`,
      );
    });
    report.add('\n## After: every army, every stop, every march, every criterion\n');
    report.add(renderBaseline(after));

    // The owner, 2026-09-25: a full-criteria recap of every silver saver; any rise in silver or drop in damage per
    // silver is flagged, however small — against 177 and against 176.
    const arrow = (x: number, y: number, digits = 0): string =>
      x === y ? `${fmt(x, digits)} (=)` : `${fmt(x, digits)} → ${fmt(y, digits)}`;
    for (const [tag, before] of [
      ['177 → after', base177],
      ['176 → after', base176],
    ] as const) {
      report.add(
        `\n## Every silver saver, every criterion (${tag})\n\n` +
          '| army | worst | best | silver | dmg/silver | gold | hired | coins | queue | rating | shelter margin | sustain | flag |\n' +
          '|---|---|---|---|---|---|---|---|---|---:|---|---|---|',
      );
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
        for (const m of s.marches) {
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
        `\nSilver savers flagged (${tag}; silver rising or damage per silver dropping, stop or march): **${String(flagged)}**.`,
      );
    }
    saveJson(new URL(`${name}.json`, OUT_DIR), after, { budgetMs: 'off', horizon: HORIZON, variant: KEPT });
    // The other variants' reports, for inspection, where the caller asks for them (not committed).
    const scratch = process.env.SCRATCH178;
    if (scratch)
      for (const variant of VARIANTS)
        saveJson(`${scratch}/178-${variant.name}.json`, runs.get(variant.name)?.after ?? []);
    process.stderr.write(`178 written to ${report.save()}\n`);
  }, 7_200_000);
});
