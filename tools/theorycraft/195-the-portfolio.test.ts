/**
 * 195 — **the portfolio** (W17 step B1, `docs/plans/progression-advisor.md` §3): is it worth running K variants
 * of `planCampaign` and keeping, per stop, the best of them?
 *
 * Node only, no UI, no engine change, no default moved. Every benchmark army (`criteriaScenarios`: the 18 armies
 * and the 20 000-dominance camp) is planned through a one-lane `CalcPool` (so a job's wall time is one
 * thread's, as the plan-ms the portfolio would add to a lane) by the default and by each variant, at the shipped
 * work level ×1 and at ×2, ×4 and ×8 (`times`, experiment 186's levels extended: every count-based limit of
 * `PLAN_LIMITS` and the re-typing's multiplied, the crossed types 4 → 5 from ×4). No job carries a clock
 * (`budgetMs` left out), so the answers are deterministic and the work level is the only thing that varies.
 *
 * A stop of a variant is priced as the benchmark prices it (`campaignOf`, four marches, worst opening) and
 * rated against the default's stop of the same pick at the **same work level** (`rate`, the owner's
 * `markerRates`, **+** better). The portfolio line keeps, per pick, the best of the default and every variant:
 * by construction it never reads worse than the default.
 *
 * Writes `tools/theorycraft/out/195-the-portfolio.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/195-the-portfolio.test.ts`
 * (`LEVELS195=1,2` to run a subset of the work levels.)
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignInput, CampaignPlan, PlanLimits, PlanRow, PlanTotals } from '../../src/engine/plan';
import { PLAN_LIMITS } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool, type PoolJob } from '../../src/worker/pool';
import { campaignOf, marchesOf, type Campaign } from '../../tests/engine/plan-campaign';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
const EPS = 1e-9;

interface Variant {
  name: string;
  /** What it changes, for the report. */
  what: string;
  /** The fields it overrides on the shipped input. */
  set: Partial<CampaignInput>;
  /** Limits it overrides on top of the work level's. */
  limits?: Partial<PlanLimits>;
}

/** The candidate variants (plan §3): the default first, then one knob each. */
const VARIANTS: Variant[] = [
  { name: 'default', what: 'the app’s `CAMPAIGN.planFixes` and put-back, as shipped', set: {} },
  {
    name: 'retypeExhaustive 10 000',
    what: '`limits.retypeExhaustive` 10 000 — equal to `retype.ts` `EXHAUSTIVE` since W16 F1, so a control: it must read as the default',
    set: {},
    limits: { retypeExhaustive: 10_000 },
  },
  {
    name: 'EXHAUSTIVE 50 000',
    what: '`limits.retypeExhaustive` 50 000 — the re-typing walks the death orders whole up to 50 000 (179’s `i-50000`)',
    set: {},
    limits: { retypeExhaustive: 50_000 },
  },
  {
    name: 'tierSeed',
    what: '`tierSeed: true` — the rung order climbs a second time from S-22’s tier order',
    set: { tierSeed: true },
  },
  {
    name: 'burnSaver guard',
    what: "`burnSaver: 'guard'` — the saver withheld where it breaks the bar’s order",
    set: { burnSaver: 'guard' },
  },
  {
    name: 'burnSaver fold',
    what: "`burnSaver: 'fold'` — offered, the stops it out-hits dropped",
    set: { burnSaver: 'fold' },
  },
  {
    name: 'burnSaver damage',
    what: "`burnSaver: 'damage'` — offered with the damage tie-break",
    set: { burnSaver: 'damage' },
  },
  {
    name: 'putBack off',
    what: '`putBack` omitted — the stops are the marches the search generated',
    set: { putBack: undefined },
  },
  {
    name: 'bandHired winner',
    what: "`bandHired: { mode: 'winner' }` — S-95’s predecessor",
    set: { bandHired: { mode: 'winner' } },
  },
  {
    name: 'bandHired none',
    what: "`bandHired: { mode: 'none' }` — no token criterion",
    set: { bandHired: { mode: 'none' } },
  },
];

interface Level {
  name: string;
  k: number;
  limits: Partial<PlanLimits>;
}
const times = (k: number): Partial<PlanLimits> =>
  k === 1
    ? {}
    : {
        crossedTypes: PLAN_LIMITS.crossedTypes + (k >= 4 ? 1 : 0),
        climbSeeds: PLAN_LIMITS.climbSeeds * k,
        climbRounds: PLAN_LIMITS.climbRounds * k,
        sweepRounds: PLAN_LIMITS.sweepRounds * k,
        retypeShare: PLAN_LIMITS.retypeShare * k,
        retypeExhaustive: 10_000 * k,
        retypeClimbSteps: 60 * k,
      };
const LEVEL_SET = new Set((process.env.LEVELS195 ?? '1,2,4,8').split(',').map(Number));
const LEVELS: Level[] = [1, 2, 4, 8]
  .filter((k) => LEVEL_SET.has(k))
  .map((k) => ({ name: `×${String(k)}`, k, limits: times(k) }));

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const sgn = (v: number): string =>
  Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`;

interface Run {
  plan: CampaignPlan | null;
  ms: number;
}

/** Every variant × level × army as one pass over a one-lane pool; each job times its own plan. */
async function planAll(
  armies: { label: string; request: CampaignInput['request'] }[],
): Promise<Map<string, Run>> {
  const pool = createCalcPool({ size: 1, createClient: () => ({ ...createInlineClient(), mode: 'worker' }) });
  const keys: string[] = [];
  const jobs: PoolJob<Run>[] = [];
  for (const army of armies) {
    for (const level of LEVELS) {
      for (const variant of VARIANTS) {
        keys.push(`${army.label}|${level.name}|${variant.name}`);
        jobs.push(async (client) => {
          const began = performance.now();
          try {
            const plan = await client.plan({
              request: army.request,
              marchTarget: HORIZON,
              ...CAMPAIGN.planFixes,
              putBack: CAMPAIGN.putBack,
              ...variant.set,
              limits: { ...level.limits, ...variant.limits },
            });
            return { plan, ms: performance.now() - began };
          } catch (error) {
            if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
            return { plan: null, ms: performance.now() - began };
          }
        });
      }
    }
  }
  try {
    const outcomes = await pool.map(jobs);
    const runs = new Map<string, Run>();
    outcomes.forEach((outcome, i) => {
      if (outcome.kind !== 'done') throw new Error(`job ${keys[i] ?? '?'} ${outcome.kind}`);
      runs.set(keys[i] as string, outcome.value);
    });
    return runs;
  } finally {
    pool.dispose();
  }
}

interface Tally {
  better: number;
  equal: number;
  worse: number;
  sum: number;
  ms: number;
  /** Armies on which the variant improved at least one stop. */
  armiesWon: number;
  best: { r: number; at: string };
  worst: { r: number; at: string };
}
const emptyTally = (): Tally => ({
  better: 0,
  equal: 0,
  worse: 0,
  sum: 0,
  ms: 0,
  armiesWon: 0,
  best: { r: 0, at: '—' },
  worst: { r: 0, at: '—' },
});

const priced = (request: CampaignInput['request'], rows: PlanRow[]): Campaign[] =>
  rows.map((row) => campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals)));

describe.skipIf(!process.env.THEORY)('195 — the portfolio', () => {
  it('measures every variant against the default at every work level', { timeout: 14_400_000 }, async () => {
    const armies = criteriaScenarios();
    const runs = await planAll(armies);
    const report = new Report('195-the-portfolio');
    const stamp = new Date().toLocaleDateString('sv-SE');
    report.add(
      [
        '---',
        'type: experiment',
        'title: "195 — the portfolio"',
        `created: ${stamp}`,
        'tags: [w17, advisor, portfolio]',
        'related: ["[[Progression-Advisor-Plan]]", "[[186-a-bigger-compute-budget]]", "[[179-search-gap]]"]',
        '---',
        '',
        '# 195 — the portfolio (B1)',
        '',
      ].join('\n'),
    );
    report.add(
      `Plan: \`docs/plans/progression-advisor.md\` §3 (B1). ${String(armies.length)} benchmark armies (\`criteriaScenarios\`: the benchmark armies and the 20 000-dominance camp), ` +
        `${String(VARIANTS.length)} variants (the default included) at work levels ${LEVELS.map((l) => l.name).join(', ')} ` +
        '(every count limit of `PLAN_LIMITS` and the re-typing multiplied; crossed types 4 → 5 from ×4; no clock in any job). ' +
        'One lane of a `CalcPool` in Node, so `ms` is one thread’s plan time. Every stop is priced over four marches, worst opening (`campaignOf`) ' +
        'and rated (`rate`, `markerRates`, **+** better) against the **default’s** stop of the same pick at the **same work level**. ' +
        'Gain per ms = Σ rating gained over the variant’s own plan ms (what the portfolio adds to a lane). Nothing here moves a default, a pin or a golden.\n',
    );
    report.add('Variants:\n');
    for (const v of VARIANTS) report.add(`- **${v.name}** — ${v.what}`);
    report.add('');

    // tally[level][variant]; portfolio[level]
    const tallies = new Map<string, Map<string, Tally>>();
    const portfolio = new Map<string, Tally>();
    const defaultMs = new Map<string, number>();
    /** Per level and variant: picks it was the (strict) best on, i.e. what keeping it would buy. */
    const wins = new Map<string, Map<string, number>>();
    const cut = (label: string): string => label.replace(/\s+\(.*$/, '');

    for (const level of LEVELS) {
      const t = new Map<string, Tally>(VARIANTS.map((v) => [v.name, emptyTally()]));
      tallies.set(level.name, t);
      portfolio.set(level.name, emptyTally());
      wins.set(level.name, new Map());
      defaultMs.set(level.name, 0);
    }

    const perArmy: string[] = [];
    for (const army of armies) {
      perArmy.push(`\n## ${army.label}\n`);
      perArmy.push('| level | variant | ms | stops better / equal / worse | Σ rated | best stop |');
      perArmy.push('|---|---|---:|---|---:|---|');
      for (const level of LEVELS) {
        const base = runs.get(`${army.label}|${level.name}|default`);
        if (!base?.plan) {
          perArmy.push(`| ${level.name} | the default refuses this army | | | | |`);
          continue;
        }
        defaultMs.set(level.name, (defaultMs.get(level.name) ?? 0) + base.ms);
        const baseCampaigns = priced(army.request, base.plan.alternatives);
        // The best rating per base stop across variants, with the variant that earned it.
        const bestPerStop: { r: number; by: string }[] = base.plan.alternatives.map(() => ({ r: 0, by: '' }));
        const pTally = portfolio.get(level.name) as Tally;
        pTally.ms += base.ms;
        for (const variant of VARIANTS) {
          if (variant.name === 'default') continue;
          const run = runs.get(`${army.label}|${level.name}|${variant.name}`);
          const tally = tallies.get(level.name)?.get(variant.name) as Tally;
          tally.ms += run?.ms ?? 0;
          pTally.ms += run?.ms ?? 0;
          if (!run?.plan) {
            perArmy.push(
              `| ${level.name} | ${variant.name} | ${n(Math.round(run?.ms ?? 0))} | refuses | | |`,
            );
            continue;
          }
          const ours = priced(army.request, run.plan.alternatives);
          const used = new Set<number>();
          let better = 0;
          let equal = 0;
          let worse = 0;
          let sum = 0;
          let top = { r: 0, at: '' };
          run.plan.alternatives.forEach((row, i) => {
            const j = base.plan?.alternatives.findIndex((b, k) => b.pick === row.pick && !used.has(k)) ?? -1;
            if (j < 0) return;
            used.add(j);
            const r = rate(billOf(baseCampaigns[j] as Campaign), billOf(ours[i] as Campaign), RATES);
            sum += r;
            if (r > EPS) better += 1;
            else if (r < -EPS) worse += 1;
            else equal += 1;
            if (r > top.r) top = { r, at: short(row.pick) };
            if (r > tally.best.r) tally.best = { r, at: `${cut(army.label)} · ${short(row.pick)}` };
            if (r < tally.worst.r) tally.worst = { r, at: `${cut(army.label)} · ${short(row.pick)}` };
            const slot = bestPerStop[j] as { r: number; by: string };
            if (r > slot.r + EPS) bestPerStop[j] = { r, by: variant.name };
          });
          tally.better += better;
          tally.equal += equal;
          tally.worse += worse;
          tally.sum += sum;
          if (better > 0) tally.armiesWon += 1;
          perArmy.push(
            `| ${level.name} | ${variant.name} | ${n(Math.round(run.ms))} | ${String(better)} / ${String(equal)} / ${String(worse)} | ${sgn(sum)} | ${top.r > 0 ? `${sgn(top.r)} ${top.at}` : '—'} |`,
          );
        }
        // The portfolio: the best rating per stop, never negative.
        let any = false;
        const winMap = wins.get(level.name) as Map<string, number>;
        for (const slot of bestPerStop) {
          if (slot.r > EPS) {
            any = true;
            pTally.better += 1;
            pTally.sum += slot.r;
            winMap.set(slot.by, (winMap.get(slot.by) ?? 0) + 1);
            if (slot.r > pTally.best.r) pTally.best = { r: slot.r, at: slot.by };
          } else pTally.equal += 1;
        }
        if (any) pTally.armiesWon += 1;
      }
    }

    report.h('Variants against the default, per work level');
    for (const level of LEVELS) {
      const t = tallies.get(level.name) as Map<string, Tally>;
      const dMs = defaultMs.get(level.name) ?? 0;
      report.add(
        `\n### ${level.name} — the default's own plans take ${n(Math.round(dMs))} ms over the armies\n`,
      );
      report.add(
        '| variant | stops better | equal | worse | armies improved | Σ rating gained | plan ms | gain per 1 000 ms | best stop | worst stop |',
      );
      report.add('|---|---:|---:|---:|---:|---:|---:|---:|---|---|');
      for (const variant of VARIANTS) {
        if (variant.name === 'default') continue;
        const x = t.get(variant.name) as Tally;
        report.add(
          `| ${variant.name} | ${String(x.better)} | ${String(x.equal)} | ${String(x.worse)} | ${String(x.armiesWon)} | ${sgn(x.sum)} | ${n(Math.round(x.ms))} | ${x.ms > 0 ? ((x.sum / x.ms) * 1000).toFixed(4) : '—'} | ${x.best.r > 0 ? `${sgn(x.best.r)} ${x.best.at}` : '—'} | ${x.worst.r < 0 ? `${sgn(x.worst.r)} ${x.worst.at}` : '—'} |`,
        );
      }
      const p = portfolio.get(level.name) as Tally;
      report.add(
        `\nThe portfolio of all ${String(VARIANTS.length)} (best per stop, default always in): ${String(p.better)} stops better, ${String(p.equal)} equal, 0 worse by construction; Σ rating gained ${sgn(p.sum)} on ${String(p.armiesWon)} armies, for ${n(Math.round(p.ms))} plan ms against the default's ${n(Math.round(dMs))} (×${dMs > 0 ? (p.ms / dMs).toFixed(1) : '—'}).`,
      );
      const winMap = wins.get(level.name) as Map<string, number>;
      report.add(
        winMap.size === 0
          ? 'No variant is the best on any stop.'
          : `Stops each variant is the strict best on: ${[...winMap].map(([name, c]) => `${name} ${String(c)}`).join(' · ')}.`,
      );
    }

    // The ranking by marginal gain per ms, across levels, and the bigger-single-search alternative.
    report.h('Ranking by marginal gain per ms');
    const rows: { level: string; name: string; sum: number; ms: number; ratio: number; worse: number }[] = [];
    for (const level of LEVELS) {
      const t = tallies.get(level.name) as Map<string, Tally>;
      for (const variant of VARIANTS) {
        if (variant.name === 'default') continue;
        const x = t.get(variant.name) as Tally;
        rows.push({
          level: level.name,
          name: variant.name,
          sum: x.sum,
          ms: x.ms,
          ratio: x.ms > 0 ? x.sum / x.ms : 0,
          worse: x.worse,
        });
      }
    }
    rows.sort((a, b) => b.ratio - a.ratio);
    report.add('| rank | variant | level | Σ rating gained | plan ms | gain per 1 000 ms | stops worse |');
    report.add('|---:|---|---|---:|---:|---:|---:|');
    rows.forEach((r, i) => {
      report.add(
        `| ${String(i + 1)} | ${r.name} | ${r.level} | ${sgn(r.sum)} | ${n(Math.round(r.ms))} | ${(r.ratio * 1000).toFixed(4)} | ${String(r.worse)} |`,
      );
    });

    // What a bigger single search buys, to set beside the portfolio.
    if (LEVELS.length > 1 && LEVELS[0]?.k === 1) {
      report.h('The other route: the default alone at a bigger work level, against the default ×1');
      report.add(
        '| level | stops better | equal | worse | Σ rating gained | default plan ms | extra ms over ×1 | gain per 1 000 extra ms |',
      );
      report.add('|---|---:|---:|---:|---:|---:|---:|---:|');
      const baseMs = defaultMs.get('×1') ?? 0;
      for (const level of LEVELS.slice(1)) {
        let better = 0;
        let equal = 0;
        let worse = 0;
        let sum = 0;
        for (const army of armies) {
          const one = runs.get(`${army.label}|×1|default`);
          const big = runs.get(`${army.label}|${level.name}|default`);
          if (!one?.plan || !big?.plan) continue;
          const a = priced(army.request, one.plan.alternatives);
          const b = priced(army.request, big.plan.alternatives);
          const used = new Set<number>();
          big.plan.alternatives.forEach((row, i) => {
            const j = one.plan?.alternatives.findIndex((o, k) => o.pick === row.pick && !used.has(k)) ?? -1;
            if (j < 0) return;
            used.add(j);
            const r = rate(billOf(a[j] as Campaign), billOf(b[i] as Campaign), RATES);
            sum += r;
            if (r > EPS) better += 1;
            else if (r < -EPS) worse += 1;
            else equal += 1;
          });
        }
        const ms = defaultMs.get(level.name) ?? 0;
        report.add(
          `| ${level.name} | ${String(better)} | ${String(equal)} | ${String(worse)} | ${sgn(sum)} | ${n(Math.round(ms))} | ${n(Math.round(ms - baseMs))} | ${ms > baseMs ? ((sum / (ms - baseMs)) * 1000).toFixed(4) : '—'} |`,
        );
      }
    }

    report.h('Per army');
    for (const block of perArmy) report.add(block);
    report.save();
    expect(runs.size).toBe(armies.length * LEVELS.length * VARIANTS.length);
  });
});
