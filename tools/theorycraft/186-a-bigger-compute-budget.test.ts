/**
 * 186 — **a bigger compute budget: does it solve more, or improve anywhere?** (W16 E5; owner, 2026-10-01:
 * *"when all is done, as we've improved massively speed, we could try raising our compute budget to check if
 * that solves more cases or improve anywhere."*)
 *
 * The refactor phase made the planner ~×10 faster and the raise search ~×3 (`docs/plans/refactor-speed.md`
 * §3). Every budget the engine runs under was set when it was slower. This raises them, **in this experiment
 * only** — the shipped defaults do not move (a reading change is a trade the owner registers) — and measures
 * what the bar and the positions read under each level, against the shipped level, on the same machine.
 *
 *   A. **The plan** (`planCampaign`), every benchmark army (`criteriaScenarios`), at three levels:
 *      ×1 the app's own (`CAMPAIGN.budgets.plan`, `PLAN_LIMITS`), ×2 and ×4 — the wall clock and every
 *      count-based limit of `PLAN_LIMITS` multiplied (the crossed types 4 → 5 at ×4, since 4 → 8 would be
 *      `5⁸` shapes). Every stop priced as the benchmark prices it (`campaignOf`, four marches, worst opening)
 *      and rated against the ×1 stop of the same pick (`rate`, the owner's `markerRates`, **+** better).
 *   B. **The 20 000-dominance camp** (experiment 129's), the one army known to fill the plan's clock, at
 *      40 s, 80 s and 160 s with the same limits.
 *   D. **Each lever of ×4 alone**, to say which one moved what A shows.
 *   E. **The two levers D found, stepped** (`climbRounds`, the re-typing's exhaustive cap and climb).
 *   C. **The raise positions** (`Best v2`, `Safe`, `Tight`), every stop of every benchmark army at ×1, under
 *      the box search's `walkCap` raised from 300 000 to 1 048 576 and to the memo's own cap 4 194 304 (so
 *      more boxes are walked whole rather than searched), restarts 64 → 128 → 256.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/186-a-bigger-compute-budget.test.ts`
 * (`PARTS186=A,C` to run a subset; `D`, each lever of ×4 alone, and `E`, the
 * two that move stepped, run only when named.)
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanLimits, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planMarch } from '../../src/engine';
import { PLAN_LIMITS, planCampaign } from '../../src/engine/plan';
import { setRaiseKernel } from '../../src/engine/fast';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import type { ExactSearch } from '../../src/kernel/raise';
import { EXACT_DEFAULTS, createRaiseKernel } from '../../src/kernel/raise';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { newProfile } from '../../src/state/defaults';
import { buildStackRequest } from '../../src/state/derive';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
const PARTS = new Set((process.env.PARTS186 ?? 'A,B,C').split(','));

interface Level {
  name: string;
  budgetMs: number;
  limits: Partial<PlanLimits>;
}
const times = (k: number, crossed: number): Partial<PlanLimits> => ({
  crossedTypes: crossed,
  climbSeeds: PLAN_LIMITS.climbSeeds * k,
  climbRounds: PLAN_LIMITS.climbRounds * k,
  sweepRounds: PLAN_LIMITS.sweepRounds * k,
  retypeShare: PLAN_LIMITS.retypeShare * k,
  retypeExhaustive: 5_000 * k,
  retypeClimbSteps: 60 * k,
});
const LEVELS: Level[] = [
  { name: '×1', budgetMs: CAMPAIGN.budgets.plan, limits: {} },
  { name: '×2', budgetMs: CAMPAIGN.budgets.plan * 2, limits: times(2, PLAN_LIMITS.crossedTypes) },
  { name: '×4', budgetMs: CAMPAIGN.budgets.plan * 4, limits: times(4, PLAN_LIMITS.crossedTypes + 1) },
];

const SEARCHES: { name: string; search: ExactSearch }[] = [
  { name: 'shipped (300 000 / 64)', search: EXACT_DEFAULTS },
  { name: '1 048 576 / 128', search: { ...EXACT_DEFAULTS, walkCap: 1_048_576, restarts: 128 } },
  { name: '4 194 304 / 256', search: { ...EXACT_DEFAULTS, walkCap: 4_194_304, restarts: 256 } },
];

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
const pct = (to: number, from: number): string =>
  from === to
    ? '0'
    : from === 0
      ? 'new'
      : `${to > from ? '+' : '−'}${Math.abs(((to - from) / from) * 100).toFixed(2)} %`;

function plan(request: StackRequest, level: Level): { plan: CampaignPlan | null; ms: number } {
  const began = performance.now();
  try {
    const p = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: level.budgetMs,
      limits: level.limits,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
    return { plan: p, ms: performance.now() - began };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
    return { plan: null, ms: performance.now() - began };
  }
}

const priced = (request: StackRequest, rows: PlanRow[]): Campaign[] =>
  rows.map((row) => campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals)));

/** Experiment 110's camp, as 129 builds it. */
function monsterCamp(max: number, dominance: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'bear-5', cap: 6 },
  ];
  profile.troops.monsters = { min: 3, max };
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, {
    ...setup,
    housing: { leadership: 20_000, authority: 2_180, dominance },
  });
}

/** Per-level tally of stops against ×1. */
interface Tally {
  better: number;
  equal: number;
  worse: number;
  added: number;
  dropped: number;
  ms: number;
  best: { r: number; at: string };
  worst: { r: number; at: string };
  /** Armies whose bar's best reading moved, per reading. */
  readBetter: Record<string, number>;
  readWorse: Record<string, number>;
}
/** The bar's best on each reading (experiment 171's, the five the benchmark's ratios are). */
const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired', of: (c: Campaign) => c.burned, high: false },
  { head: 'dmg/silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg/hired', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const barBest = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
/** A reading's change, + better, in percent. */
const gain = (after: number, before: number, r: Reading): number =>
  before === after
    ? 0
    : before === 0
      ? 0
      : ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
const emptyTally = (): Tally => ({
  better: 0,
  equal: 0,
  worse: 0,
  added: 0,
  dropped: 0,
  ms: 0,
  best: { r: 0, at: '—' },
  worst: { r: 0, at: '—' },
  readBetter: {},
  readWorse: {},
});

/** One army's bar at every level, rated stop by stop against ×1; the tallies updated. */
function compare(
  report: Report,
  label: string,
  request: StackRequest,
  runs: { level: Level; plan: CampaignPlan | null; ms: number }[],
  tallies: Map<string, Tally>,
): void {
  const base = runs[0];
  if (!base?.plan) {
    report.add(
      `The plan refuses this army at ×1 (${runs.map((r) => (r.plan ? 'answers' : 'refuses')).join(' · ')}).`,
    );
    return;
  }
  const basePriced = priced(request, base.plan.alternatives);
  const readLines: string[] = [];
  report.add(
    '| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |',
  );
  report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const run of runs) {
    const tally = tallies.get(run.level.name) ?? emptyTally();
    tallies.set(run.level.name, tally);
    tally.ms += run.ms;
    if (!run.plan) {
      report.add(`| ${run.level.name} | ${n(Math.round(run.ms))} | refuses | | | | | | | | | |`);
      continue;
    }
    const rows = run.plan.alternatives;
    const ours = priced(request, rows);
    const usedBase = new Set<number>();
    rows.forEach((row, i) => {
      const c = ours[i] as Campaign;
      const j = base.plan?.alternatives.findIndex((b, k) => b.pick === row.pick && !usedBase.has(k)) ?? -1;
      let rated = 'new';
      if (j >= 0) {
        usedBase.add(j);
        const r = rate(billOf(basePriced[j] as Campaign), billOf(c), RATES);
        rated = sgn(r);
        if (run !== base) {
          if (r > 1e-9) tally.better += 1;
          else if (r < -1e-9) tally.worse += 1;
          else tally.equal += 1;
          if (r > tally.best.r) tally.best = { r, at: `${label} · ${short(row.pick)}` };
          if (r < tally.worst.r) tally.worst = { r, at: `${label} · ${short(row.pick)}` };
        }
      } else if (run !== base) tally.added += 1;
      const b = j >= 0 ? (basePriced[j] as Campaign) : null;
      const moved = (to: number, from: number | undefined): string =>
        run === base || from === undefined || from === to
          ? n(Math.round(to))
          : `**${n(Math.round(to))}** (${pct(to, from)})`;
      report.add(
        `| ${run.level.name} | ${i === 0 ? n(Math.round(run.ms)) : ''} | ${short(row.pick)} | ${moved(c.damage, b?.damage)} | ` +
          `${moved(c.silver, b?.silver)} | ${moved(c.burned, b?.burned)} | ` +
          `${moved(c.gold, b?.gold)} | ${moved(c.dragonCoins, b?.dragonCoins)} | ${n(Math.round(c.seconds / 3600))} | ` +
          `${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} | ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} | ${run === base ? '—' : rated} |`,
      );
    });
    if (run !== base) {
      tally.dropped += base.plan.alternatives.length - usedBase.size;
      const changes = READINGS.map((r) => ({ r, c: gain(barBest(ours, r), barBest(basePriced, r), r) }));
      for (const { r, c } of changes) {
        if (c > 1e-9) tally.readBetter[r.head] = (tally.readBetter[r.head] ?? 0) + 1;
        if (c < -1e-9) tally.readWorse[r.head] = (tally.readWorse[r.head] ?? 0) + 1;
      }
      readLines.push(
        `- ${run.level.name}, the bar's best against ×1's: ` +
          changes
            .map(
              ({ r, c }) =>
                `${r.head} ${Math.abs(c) < 1e-9 ? '0' : `**${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(2)} %**`}`,
            )
            .join(' · '),
      );
    }
  }
  report.add('');
  for (const line of readLines) report.add(line);
}

function summary(report: Report, tallies: Map<string, Tally>): void {
  report.h('Summary against ×1');
  report.add(
    '| level | stops better | equal | worse | new | dropped | best gain (rated) | worst (rated) | armies whose bar best moved, better / worse | planner total |',
  );
  report.add('|---|---|---|---|---|---|---|---|---|---|');
  for (const [name, t] of tallies) {
    const reads = READINGS.map(
      (r) => `${r.head} ${String(t.readBetter[r.head] ?? 0)}/${String(t.readWorse[r.head] ?? 0)}`,
    ).join(' · ');
    report.add(
      `| ${name} | ${String(t.better)} | ${String(t.equal)} | ${String(t.worse)} | ${String(t.added)} | ${String(t.dropped)} | ` +
        `${t.best.r > 0 ? `${sgn(t.best.r)} ${t.best.at}` : '—'} | ${t.worst.r < 0 ? `${sgn(t.worst.r)} ${t.worst.at}` : '—'} | ` +
        `${reads} | ${n(Math.round(t.ms))} ms |`,
    );
  }
}

/** A's ×4, one lever at a time (everything else shipped), beside ×1. */
function leverLevels(): Level[] {
  const four = LEVELS[2] as Level;
  return [
    LEVELS[0] as Level,
    { name: 'budgetMs ×4', budgetMs: four.budgetMs, limits: {} },
    ...Object.entries(four.limits)
      .filter(([key]) => !key.startsWith('retype'))
      .map(([key, value]) => ({
        name: `${key} ${n(value as number)}`,
        budgetMs: CAMPAIGN.budgets.plan,
        limits: { [key]: value } as Partial<PlanLimits>,
      })),
    {
      name: 'retype ×4',
      budgetMs: CAMPAIGN.budgets.plan,
      limits: {
        retypeShare: PLAN_LIMITS.retypeShare * 4,
        retypeExhaustive: 5_000 * 4,
        retypeClimbSteps: 60 * 4,
      },
    },
  ];
}

/** Every benchmark army at every level, compared to the first; the report saved. */
function everyArmy(report: Report, levels: Level[]): number {
  for (const level of levels) report.add(`- ${levelText(level)}`);
  const tallies = new Map<string, Tally>();
  for (const scenario of criteriaScenarios()) {
    const runs = levels.map((level) => ({ level, ...plan(scenario.request, level) }));
    report.h(scenario.label);
    compare(report, scenario.label, scenario.request, runs, tallies);
  }
  summary(report, tallies);
  report.save();
  return tallies.size;
}

const levelText = (level: Level): string =>
  `**${level.name}**: \`budgetMs\` ${n(level.budgetMs)}` +
  (Object.keys(level.limits).length === 0
    ? ', `PLAN_LIMITS` as shipped'
    : `, ${Object.entries(level.limits)
        .map(([k, v]) => `${k} ${n(v as number)}`)
        .join(', ')}`);

describe.skipIf(!process.env.THEORY)('a bigger compute budget', () => {
  it.skipIf(!PARTS.has('A'))(
    'A — the plan of every benchmark army at ×1, ×2, ×4',
    { timeout: 3_600_000 },
    () => {
      const report = new Report('186-a-bigger-compute-budget');
      report.add('# 186 A — the plan under a bigger compute budget\n');
      report.add(
        'Every benchmark army (`criteriaScenarios`), planned as the app plans it (`CAMPAIGN.planFixes`, the put-back) ' +
          'at three levels; every stop priced over four marches, worst opening (`campaignOf`), and rated against the ' +
          '×1 stop of the same pick with the owner’s `markerRates` (**+** better). A figure that moved is bold with ' +
          'its change. Single-file run; `ms` is one wall-clock call.\n',
      );
      expect(everyArmy(report, LEVELS)).toBe(LEVELS.length);
    },
  );

  it.skipIf(!PARTS.has('D'))('D — each lever of ×4 alone', { timeout: 3_600_000 }, () => {
    const report = new Report('186-a-bigger-compute-budget-levers');
    report.add('# 186 D — which lever of ×4 moves the bar\n');
    report.add(
      'A’s ×4, one lever at a time against ×1 (everything else shipped), on every benchmark army, priced and ' +
        'rated as in A. `ms` is one wall-clock call, single-file run.\n',
    );
    const levers = leverLevels();
    expect(everyArmy(report, levers)).toBe(levers.length);
  });

  it.skipIf(!PARTS.has('B'))(
    'B — the 20 000-dominance camp at every level and lever',
    { timeout: 3_600_000 },
    () => {
      const report = new Report('186-a-bigger-compute-budget-camp');
      report.add('# 186 B — the 20 000-dominance camp under a bigger compute budget\n');
      report.add(
        'Experiment 129’s larger camp (monster tiers 3–7, 20 000 dominance, twenty uncapped types): the one army ' +
          'known to fill the plan’s clock. A’s three levels, then D’s levers one at a time; `ms` is one wall-clock call, single-file run.\n',
      );
      const levels = [
        ...LEVELS,
        ...leverLevels().slice(1),
        // `climbRounds` is the lever D finds here; stepped, to say where the camp's bar first moves.
        ...[24, 32, 48].map((k) => ({
          name: `climbRounds ${String(k)}`,
          budgetMs: CAMPAIGN.budgets.plan,
          limits: { climbRounds: k },
        })),
      ];
      for (const level of levels) report.add(`- ${levelText(level)}`);
      report.add('');
      const request = monsterCamp(7, 20_000);
      const runs = levels.map((level) => ({ level, ...plan(request, level) }));
      const tallies = new Map<string, Tally>();
      compare(report, '20 000 camp', request, runs, tallies);
      report.add('');
      report.add('| level | ms | of its budget | stops | most damage | its silver |');
      report.add('|---|---|---|---|---|---|');
      for (const run of runs) {
        const best = run.plan?.alternatives.reduce((a, b) => (b.totalDamage > a.totalDamage ? b : a));
        report.add(
          `| ${run.level.name} | ${n(Math.round(run.ms))} | ${((run.ms / run.level.budgetMs) * 100).toFixed(0)} % | ` +
            `${String(run.plan?.alternatives.length ?? 0)} | ${best ? n(Math.round(best.totalDamage)) : '—'} | ${best ? n(Math.round(best.silver)) : '—'} |`,
        );
      }
      summary(report, tallies);
      report.save();
      expect(runs.length).toBe(levels.length);
    },
  );

  it.skipIf(!PARTS.has('E'))('E — the two levers D found, stepped', { timeout: 3_600_000 }, () => {
    const report = new Report('186-a-bigger-compute-budget-steps');
    report.add('# 186 E — the two levers that move the bar, stepped\n');
    report.add(
      'D found two levers that move any stop: the seed climb’s `climbRounds` and the re-typing. Each is stepped ' +
        'alone here against ×1 on every benchmark army, to find where the first stop moves and what each step ' +
        'costs. `ms` is one wall-clock call, single-file run.\n',
    );
    const at = (name: string, limits: Partial<PlanLimits>): Level => ({
      name,
      budgetMs: CAMPAIGN.budgets.plan,
      limits,
    });
    const levels: Level[] = [
      LEVELS[0] as Level,
      ...[24, 32, 40, 48, 64, 128, 256, 1_024].map((k) => at(`climbRounds ${n(k)}`, { climbRounds: k })),
      ...[10_000, 20_000, 40_000].map((k) => at(`retypeExhaustive ${n(k)}`, { retypeExhaustive: k })),
      at('retypeClimbSteps 240', { retypeClimbSteps: 240 }),
    ];
    expect(everyArmy(report, levels)).toBe(levels.length);
  });

  it.skipIf(!PARTS.has('C'))('C — the raise positions under a wider walk', { timeout: 3_600_000 }, () => {
    const module = loadKernelModule();
    const kernels = SEARCHES.map((one) => ({ ...one, kernel: createRaiseKernel(module, one.search) }));
    const report = new Report('186-a-bigger-compute-budget-positions');
    report.add('# 186 C — the raise positions under a wider walk\n');
    report.add(
      'Every stop of every benchmark army at ×1, `Best v2`, `Safe` and `Tight` priced by the kernel box search ' +
        '(`src/kernel/raise.ts`) at three settings of `walkCap` / `restarts` (`maxSweeps` 24 throughout). Damage is ' +
        'the march’s worst opening; a row is listed only where a setting moved a position’s counts. `ms` is the five ' +
        'positions of one stop, summed over every stop.\n',
    );
    const moved: string[] = [];
    const tally = SEARCHES.map(() => ({
      ms: 0,
      walked: 0,
      searched: 0,
      better: 0,
      equal: 0,
      worse: 0,
      worst: 0,
    }));
    let positions = 0;
    for (const scenario of criteriaScenarios()) {
      const shipped = plan(scenario.request, LEVELS[0] as Level).plan;
      if (!shipped) continue;
      for (const stop of shipped.alternatives) {
        const base = planMarch(scenario.request, stop.counts).result;
        const readings = kernels.map((k, i) => {
          setRaiseKernel(k.kernel);
          const began = performance.now();
          const trades = positionTrades(scenario.request, base);
          (tally[i] as (typeof tally)[number]).ms += performance.now() - began;
          return trades.rows.filter(
            (row) => row.mode === 'v2' || row.mode === 'safe' || row.mode === 'tight',
          );
        });
        const ref = readings[0] ?? [];
        ref.forEach((row, p) => {
          positions += 1;
          readings.forEach((rows, i) => {
            const one = rows[p];
            if (!one) return;
            const t = tally[i] as (typeof tally)[number];
            if (one.how === 'walked') t.walked += 1;
            if (one.how === 'searched') t.searched += 1;
            if (i === 0) return;
            const d = one.damage - row.damage;
            if (d > 0.5) t.better += 1;
            else if (d < -0.5) t.worse += 1;
            else t.equal += 1;
            if (row.damage > 0) t.worst = Math.min(t.worst, d / row.damage);
            if (JSON.stringify(one.counts) !== JSON.stringify(row.counts))
              moved.push(
                `| ${scenario.label} | ${short(stop.pick)} | ${row.mode} | ${SEARCHES[i]?.name ?? ''} | ${n(row.space)} | ` +
                  `${row.how ?? '—'} → ${one.how ?? '—'} | ${n(Math.round(row.damage))} → ${n(Math.round(one.damage))} (${pct(one.damage, row.damage)}) | ` +
                  `${n(Math.round(row.silver))} → ${n(Math.round(one.silver))} | ${n(row.mercLost)} → ${n(one.mercLost)} |`,
              );
          });
        });
      }
    }
    setRaiseKernel(createRaiseKernel(module));
    report.add(
      '| setting | positions | walked | searched | better | equal | worse | worst change | ms, every stop |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    SEARCHES.forEach((s, i) => {
      const t = tally[i] as (typeof tally)[number];
      report.add(
        `| ${s.name} | ${String(positions)} | ${String(t.walked)} | ${String(t.searched)} | ${i === 0 ? '—' : String(t.better)} | ` +
          `${i === 0 ? '—' : String(t.equal)} | ${i === 0 ? '—' : String(t.worse)} | ${i === 0 ? '—' : `${(t.worst * 100).toFixed(2)} %`} | ${n(Math.round(t.ms))} |`,
      );
    });
    report.h('Positions whose counts moved');
    if (moved.length === 0) report.add('None: every position reads the same counts at every setting.');
    else {
      report.add('| army | stop | position | setting | box | how | damage | silver | merc burned |');
      report.add('|---|---|---|---|---|---|---|---|---|');
      for (const line of moved) report.add(line);
    }
    report.save();
    expect(positions).toBeGreaterThan(0);
  });
});
