/**
 * 176 — **where the death orders are lost** (W14 step 1, `docs/plans/every-death-order.md` §1 and §3.1). A
 * diagnosis: no engine change.
 *
 *  - **A. The trace.** Every benchmark army planned at HEAD, `budgetMs` off, with the test-only recorder
 *    `planTrace` (`src/engine/plan-trace.ts`, off by default) listening to the re-typing pipeline of
 *    `planCampaign`. For every distinct march of every stop, 175's exhaustive walk (kernel `enumerate`, same
 *    space, same rules) says what the march leaves; `retypeMarch` run on the shipped march says what the engine's
 *    own search would keep. Each march leaving more than 0.01 is classified against §1's suspects:
 *    a (the row-level silver-saver guard), b (made or handed back after the pass), c (`keepReadings`),
 *    d (`retypeOne`'s hired / shelter guard), e (the finale's own ladder, band rows), or the search's own gap.
 *  - **B. The HEAD baseline** of §2 (`tools/theorycraft/plan-report.ts`, written to `out/176-baseline.json`).
 *
 * The plan kernel is set for speed (`setKernel`, as `tests/kernel/with-kernel.setup.ts` does); `TS176=<label
 * fragments, comma-separated>` re-plans those armies on the TypeScript path and holds the trace and the bar equal.
 *
 * `THEORY=1 npx vitest run --project ts tools/theorycraft/176-where-death-orders-are-lost.test.ts`
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { setKernel } from '../../src/engine/fast';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { effectiveTable, marchResult, planCampaign } from '../../src/engine/plan';
import type { PlanTraceEvent } from '../../src/engine/plan-trace';
import { planTrace } from '../../src/engine/plan-trace';
import { EXHAUSTIVE, retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import { POOL_BITS, createKernel } from '../../src/kernel';
import { createPlanKernel } from '../../src/kernel/plan';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { OUT_DIR, Report, n } from './harness';
import type { ArmyReport } from './plan-report';
import { RATES, keyOf, playedOf, renderBaseline, reportArmy, saveJson, short } from './plan-report';

const TOL = 0.01;
const sgn = (v: number, digits = 3): string =>
  !Number.isFinite(v) ? '—' : Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}`;

const plan = (request: StackRequest): { plan: CampaignPlan | string; events: PlanTraceEvent[]; ms: number } => {
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
    return { plan: error instanceof Error ? error.message : String(error), events, ms: performance.now() - began };
  } finally {
    planTrace.sink = null;
  }
};

interface Row {
  army: string;
  stops: string;
  roles: string;
  gain: number;
  engine: number;
  guarded: number;
  path: string;
  cause: string;
  letter: string;
  detail: string;
}

/** The suspect a gaining march falls under, read off the trace. */
function classify(
  march: Record<string, number>,
  picks: string[],
  events: PlanTraceEvent[],
  reached: boolean,
): { letter: string; cause: string; detail: string } {
  const key = keyOf(march);
  const retypes = events.filter((e): e is Extract<PlanTraceEvent, { step: 'retypeOne' }> => e.step === 'retypeOne');
  const asked = retypes.find((e) => keyOf(e.counts) === key);
  const pipeline = ((): { letter: string; cause: string; detail: string } => {
    const own = events.find(
      (e) => e.step === 'ownLadderFinale' && keyOf(e.counts) === key && picks.includes(e.pick ?? ''),
    );
    if (own) return { letter: 'e', cause: 'own-ladder finale, made after the pass', detail: 'never handed to `retypeOne`' };
    if (!asked) {
      const madeBy = retypes.find((e) => keyOf(e.out) === key && keyOf(e.counts) !== key);
      if (madeBy)
        return {
          letter: 'other',
          cause: 're-typed march is not a fixed point',
          detail: `the pass's own output (from a march rated ${sgn(madeBy.rating)}); a second climb gains`,
        };
      return { letter: 'b', cause: 'made after the pass', detail: 'never handed to `retypeOne`' };
    }
    if (asked.deadline) return { letter: 'b', cause: 'deadline', detail: 'the pass clock ran out' };
    if (asked.refused)
      return { letter: 'd', cause: `retypeOne's ${asked.refused} guard`, detail: `found ${sgn(asked.rating)}` };
    if (!asked.found)
      return { letter: 'search', cause: 'handed over, `retypeMarch` finds nothing', detail: 'the climb’s own gap' };
    // retypeOne kept it: the row was handed back somewhere.
    const rows = events.filter(
      (e): e is Extract<PlanTraceEvent, { step: 'retypeRowNow' }> =>
        e.step === 'retypeRowNow' && picks.includes(e.pick ?? '') && e.marches.some((m) => keyOf(m) === key),
    );
    if (rows.some((e) => e.silverSaverGuard))
      return { letter: 'a', cause: 'row-level silver-saver guard', detail: `found ${sgn(asked.rating)}, row handed back` };
    const kept = events.find((e) => e.step === 'keepReadings' && e.handedBack && picks.includes(e.pick ?? ''));
    if (kept && kept.step === 'keepReadings')
      return { letter: 'c', cause: '`keepReadings` hand-back', detail: `reading ${String(kept.reading)}` };
    if (events.some((e) => e.step === 'collisionHandBack' && picks.includes(e.pick ?? '')))
      return { letter: 'b', cause: 'collision hand-back', detail: '' };
    const band = events.find((e) => e.step === 'foldBandRetype' && !e.taken && picks.includes(e.pick ?? ''));
    if (band && band.step === 'foldBandRetype')
      return {
        letter: 'e',
        cause: 'band row taken by the fold, its re-typing refused',
        detail: `named ${String(band.named)}, single ${String(band.single)}, ordered ${String(band.ordered)}`,
      };
    return { letter: 'other', cause: 'kept by `retypeOne`, not shipped', detail: `${String(rows.length)} row events` };
  })();
  if (reached || pipeline.letter === 'search') return pipeline;
  return { ...pipeline, detail: `${pipeline.detail}; the climb also stops short` };
}

describe.skipIf(!process.env.THEORY)('where the death orders are lost', () => {
  it('traces every gaining march and writes the HEAD baseline', () => {
    const began = performance.now();
    const module = loadKernelModule();
    const planKernel = createPlanKernel(module);
    const tsCheck = (process.env.TS176 ?? '').split(',').filter(Boolean);
    const profile = ownerProfile();
    const only = process.env.SCEN176;
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])].filter(
      (s) => !only || s.label.includes(only),
    );
    const report = new Report('176-where-death-orders-are-lost');
    const rows: Row[] = [];
    const baseline: ArmyReport[] = [];
    const tsLines: string[] = [];
    let marches = 0;
    let walked = 0;

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      setKernel(planKernel);
      const { plan: planned, events, ms } = plan(request);
      setKernel(null);
      if (tsCheck.some((f) => scenario.label.includes(f))) {
        const ts = plan(request);
        const bar = (p: CampaignPlan | string): string =>
          typeof p === 'string' ? p : JSON.stringify([p.alternatives, p.counts, p.finaleCounts, p.totalDamage]);
        const samePlan = bar(ts.plan) === bar(planned);
        const sameTrace = JSON.stringify(ts.events) === JSON.stringify(events);
        tsLines.push(
          `| ${label} | ${String(events.length)} | ${samePlan ? 'same' : '**differs**'} | ${sameTrace ? 'same' : '**differs**'} | ${n(Math.round(ms))} | ${n(Math.round(ts.ms))} |`,
        );
        expect(samePlan && sameTrace, `TS path differs on ${label}`).toBe(true);
      }
      const rechosen: string[] = [];
      for (const e of events) {
        if (e.step === 'fold' && e.band.length > 0) rechosen.push(`fold took band row(s) as ${e.band.map((p) => short(p ?? '?')).join(', ')}`);
        if (e.step === 'fold' && e.before.length !== e.after.length)
          rechosen.push(`fold ${e.before.map((p) => short(p ?? '?')).join('/')} → ${e.after.map((p) => short(p ?? '?')).join('/')}`);
        if (e.step === 'allInS94') rechosen.push(`S-94 all-in ${e.outcome}`);
        if (e.step === 'allInDescending') rechosen.push(`all-in ${e.outcome} (174)`);
        if (e.step === 'ownLadderFinale') rechosen.push(`${short(e.pick ?? '?')} own-ladder finale`);
      }
      baseline.push(reportArmy(scenario.label, request, planned, scenario.externals, { rechosen, planMs: ms }));
      if (typeof planned === 'string') continue;

      const kernel = createKernel(module, request, RATES);
      const table = effectiveTable(request);
      const candidates = table.map((e, t) => ({ e, t })).filter(({ e }) => e.pool === 'leadership').map(({ t }) => t);
      const seen = new Map<string, { counts: Record<string, number>; stops: Set<string>; roles: Set<string> }>();
      for (const row of planned.alternatives)
        for (const m of playedOf(row as PlanTotals)) {
          const key = keyOf(m.counts);
          const at = seen.get(key) ?? { counts: m.counts, stops: new Set<string>(), roles: new Set<string>() };
          at.stops.add(row.pick);
          at.roles.add(`${short(row.pick)} ${m.role}`);
          seen.set(key, at);
        }
      for (const { counts, stops, roles } of seen.values()) {
        marches += 1;
        const stacks = marchResult(request, counts).result.stacks;
        const troops = stacks.filter((s) => s.pool === 'leadership');
        const fixed = new Float64Array(kernel.types);
        for (const s of stacks) if (s.pool !== 'leadership') fixed[kernel.ids.indexOf(s.unitId)] = s.count;
        const slots = troops.map((s) => s.totalHp);
        const a = kernel.enumerate({ slots, candidates, fixed, pools: POOL_BITS.leadership, base: kernel.battle(counts) });
        walked += a.battles;
        if (!(a.best.rating > TOL)) continue;
        let space = 1;
        for (let i = 0; i < slots.length; i += 1) space *= candidates.length - i;
        setKernel(planKernel);
        const found = retypeMarch(request, counts, RATES, { tierCandidate: CAMPAIGN.planFixes.tierCandidate });
        setKernel(null);
        const engine = found?.rating ?? 0;
        const reached = engine >= a.best.rating - 5e-4;
        const c = classify(counts, [...stops], events, reached);
        rows.push({
          army: label,
          stops: [...stops].map(short).join('/'),
          roles: [...roles].join(', '),
          gain: a.best.rating,
          engine,
          guarded: a.guarded.rating,
          path: space <= EXHAUSTIVE ? 'exhaustive' : 'climb',
          cause: c.cause,
          letter: c.letter,
          detail: c.detail,
        });
      }
      process.stderr.write(`176 ${label}: ${String(seen.size)} marches, ${((performance.now() - began) / 1000).toFixed(0)} s\n`);
    }

    rows.sort((x, y) => y.gain - x.gain);
    const byCause = new Map<string, { count: number; sum: number; kept: number; gap: number; guarded: number }>();
    for (const r of rows) {
      const k = `${r.letter} — ${r.cause}`;
      const t = byCause.get(k) ?? { count: 0, sum: 0, kept: 0, gap: 0, guarded: 0 };
      t.count += 1;
      t.sum += r.gain;
      t.kept += Math.max(0, r.engine);
      t.gap += Math.max(0, r.gain - Math.max(0, r.engine));
      t.guarded += Math.max(0, r.guarded);
      byCause.set(k, t);
    }
    const reachedRows = rows.filter((r) => r.engine >= r.gain - 5e-4);
    report.add('# 176 — where the death orders are lost\n');
    report.add(
      'Every benchmark army planned at HEAD, `budgetMs` off, the plan kernel set, with the test-only recorder ' +
        '`planTrace` (`src/engine/plan-trace.ts`, off by default) on the re-typing pipeline. Gain = 175’s exhaustive ' +
        'best in the re-typing space against the shipped march (`rate(·, ·, markerRates)`); engine = `retypeMarch` ' +
        'run on the shipped march (tier candidate on, no deadline), i.e. **the rating that would be kept** if the ' +
        'pipeline handed it that march and kept the answer. A march the engine reaches (within 5e-4) is classified by ' +
        'the trace; one it does not is the search’s gap. Every figure measured.\n',
    );
    report.add(
      `**${String(rows.length)}** of ${String(marches)} distinct marches leave more than ${String(TOL)} ` +
        `(Σ ${sgn(rows.reduce((s, r) => s + r.gain, 0))}); the engine reaches **${String(reachedRows.length)}** of them ` +
        `(Σ ${sgn(reachedRows.reduce((s, r) => s + r.gain, 0))}).\n`,
    );
    report.add(
      'Each march is classified by what, in the pipeline, loses the rating `retypeMarch` finds on it; the ' +
        'search’s own shortfall (175 gain − what `retypeMarch` finds) is its own column, so the two add up to the ' +
        'gain. “Silver-guarded” is the exhaustive best with the march’s silver not rising (step 2’s rule, per march).\n',
    );
    report.add(
      '## A. By cause\n\n| cause | marches | Σ 175 gain | Σ kept by `retypeMarch` | Σ search gap | Σ silver-guarded best |\n|---|---:|---:|---:|---:|---:|',
    );
    for (const [k, t] of [...byCause.entries()].sort((x, y) => y[1].sum - x[1].sum))
      report.add(
        `| ${k} | ${String(t.count)} | ${sgn(t.sum)} | ${sgn(t.kept)} | ${sgn(t.gap)} | ${sgn(t.guarded)} |`,
      );
    report.add(
      '\n## A. Every march leaving more than 0.01\n\n| army | stop | which march | engine path | 175 gain | cause | detail | rating kept (`retypeMarch`) | silver-guarded best |\n|---|---|---|---|---:|---|---|---:|---:|',
    );
    for (const r of rows)
      report.add(
        `| ${r.army} | ${r.stops} | ${r.roles} | ${r.path} | **${sgn(r.gain)}** | ${r.letter}: ${r.cause} | ${r.detail || '—'} | ${sgn(r.engine)} | ${sgn(r.guarded)} |`,
      );
    if (tsLines.length > 0)
      report.add(
        `\n## The TypeScript path\n\n| army | trace events | plan | trace | kernel ms | TS ms |\n|---|---:|---|---|---:|---:|\n${tsLines.join('\n')}`,
      );
    const ts = baseline.reduce(
      (t, a) => ({
        rows: t.rows + a.totalstack.rows,
        dom: t.dom + a.totalstack.dominated,
        unfit: t.unfit + a.totalstack.unfitted,
        kept: t.kept + a.totalstack.kept162,
      }),
      { rows: 0, dom: 0, unfit: 0, kept: 0 },
    );
    const stops = baseline.reduce((s, a) => s + a.stops.length, 0);
    const played = baseline.reduce((s, a) => s + a.stops.reduce((x, st) => x + st.marches.length, 0), 0);
    const broken = baseline.flatMap((a) =>
      Object.entries(a.criteria)
        .filter(([, c]) => !c.holds)
        .map(([k, c]) => `${a.label.slice(0, 44)}: ${k} (${c.detail})`),
    );
    report.add(
      `\n## B. The HEAD baseline (§2)\n\n${String(baseline.length)} armies (${String(baseline.filter((a) => a.refused).length)} refused), ` +
        `${String(stops)} stops, ${String(played)} stop-march use cases. Machine-readable: \`tools/theorycraft/out/176-baseline.json\` ` +
        '(read it with `loadJson` and diff with `compareReports` in `tools/theorycraft/plan-report.ts`). ' +
        `TotalStack at matched spend (172's reading): **${String(ts.dom)} dominated / ${String(ts.unfit)} no stop fits** of ${String(ts.rows)} rows; ` +
        `162's rows no stop beats on damage or rating: **${String(ts.kept)}**. Bar criteria broken: ${broken.length === 0 ? 'none' : broken.join('; ')}.\n`,
    );
    report.add(renderBaseline(baseline));
    report.add(
      `\n## Runtime\n\n${n(walked)} battles walked; ${((performance.now() - began) / 1000).toFixed(1)} s in all (planning, walks, reports).\n`,
    );
    saveJson(new URL('176-baseline.json', OUT_DIR), baseline, { commit: 'HEAD (9a8cd54)', budgetMs: 'off', horizon: HORIZON });
    process.stderr.write(`176 written to ${report.save()}\n`);
  }, 7_200_000);
});
