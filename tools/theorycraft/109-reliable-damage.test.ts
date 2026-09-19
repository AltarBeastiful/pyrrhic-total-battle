/**
 * 109 — **the plan stands on reliable damage** (owner, 2026-09-19: *"average damage is not average for sure;
 * it's too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable damage
 * actually."*).
 *
 * The game decides who opens the fight, 50/50. Our two journals are the two outcomes — the enemy striking
 * first (`minDamage`, the recap's **Worst opening**) and the army striking first (`maxDamage`) — and until
 * 2026-09-19 the plan ranked, priced and printed the **midpoint** of the two (`marchOf`,
 * `(enemyFirst + armyFirst) / 2`). A midpoint is a number no single fight ever pays out: half the time the
 * player gets less than the figure the bar sold him. This experiment measures what that costs and what
 * changes when the plan is re-based on the bad flip.
 *
 *  - **§A** — every stop of every army as it is offered **today**: worst opening, expected, best, the gap
 *    (expected − worst) as a share of expected, and *which* stack the gap is (the one extra strike the
 *    opener takes when the army moves first), for the repeated march and for the campaign;
 *  - **§B** — the bar **re-ranked on worst opening**: which stops change, their two readings, both ratios,
 *    the knee's rung, and the put-back / tighter-shape verdicts that flip;
 *  - **§C** — the sizer sequences and the captured answers re-priced on worst opening: the benchmark's
 *    `damageFloor` and `externals.damageFloor` on the reliable reading against today's;
 *  - **§D** — the coin flip the owner fears: the widest gap on the bar, and the widest gap over the whole
 *    frontier the search scores — separating the marches whose hired stacks stand **unsheltered** on top,
 *    which is where the gap used to live before S-87 closed it.
 *
 * **How the two bars are measured.** No flag: the engine has exactly one definition of a plan's damage
 * (`marchOf`), so this file is run **twice**, once on each engine — before the switch and after it — and each
 * run writes its own figures to `out/109-reliable-damage-<reading>.json` beside this report. The run detects
 * which engine it is on by asking the plan and the battle the same march (`repeat.damage` against
 * `summary.minDamage` / `summary.avgDamage`), so neither run has to be told. With both sidecars on disk the
 * report below is the comparison; with one, it says so and prints that half.
 *
 * The rivals (§C) are re-measured by each run and are the same either way — `sizeStacks` and `searchPriority`
 * never read `marchOf` — and their Generate rows keep their **own** objective (average damage): they are what
 * the other calculators answer, not what we ask for. Only the reading they are *priced* on changes.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/109-reliable-damage.test.ts`
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { attackOrder, simulateBattle } from '../../src/engine/battle';
import { buildKillOrder } from '../../src/engine/killOrder';
import { planCampaign, planMarch } from '../../src/engine';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { Stack, StackRequest, StackResult } from '../../src/engine/types';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import { buildStackRequest } from '../../src/state/derive';
import type { Scenario } from '../../tests/engine/plan-scenarios';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { OUT_DIR, Report, n } from './harness';

type Reading = 'expected' | 'reliable';

const pct = (value: number): string => `${(value * 100).toFixed(2)} %`;
const sidecar = (reading: Reading): URL => new URL(`109-reliable-damage-${reading}.json`, OUT_DIR);

// ---- the armies --------------------------------------------------------------------------------------

interface Case {
  label: string;
  request: StackRequest;
  /** Marches answered by calculators outside this repo (the benchmark's own rows). */
  externals: Scenario['externals'];
  /** True for the ten armies `plan-benchmark.test.ts` pins, which are the only ones §C speaks about. */
  benchmark: boolean;
}

/** The live camp and the two readings of his camp of 2026-09-19, exactly as `plan-criteria.test.ts` builds them. */
function extraCamps(): Case[] {
  const owner = ownerProfile();
  if (!owner) return [];
  const captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  const build = (
    label: string,
    selected: { id: string; cap: number | null }[],
    leadership: number,
    authority: number,
  ): Case[] => {
    const camp = structuredClone(owner);
    camp.sources.captains = captains;
    camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
    camp.mercenaries.selected = selected;
    const setup = camp.setups[0];
    if (!setup) return [];
    return [
      {
        label,
        externals: [],
        benchmark: false,
        request: buildStackRequest(camp, {
          ...setup,
          active: { ...setup.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
          housing: { ...setup.housing, leadership, authority },
        }),
      },
    ];
  };
  return [
    ...build(
      'the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)',
      [
        { id: 'arbalester-6', cap: 485 },
        { id: 'legionary-6', cap: 1002 },
        { id: 'bear-5', cap: null },
      ],
      4_975,
      2_180,
    ),
    ...build(
      'his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)',
      [{ id: 'epic-monster-hunter-6', cap: 450 }],
      4_975,
      2_180,
    ),
    ...build(
      'his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)',
      [{ id: 'epic-monster-hunter-6', cap: 120 }],
      5_100,
      2_200,
    ),
  ];
}

/**
 * The thirteen armies, in the order `plan-criteria.test.ts` holds them. `THEORY_ONLY=<substring>` keeps only
 * the armies whose label contains it — a full pass is a quarter of an hour, and a re-measurement of one army
 * should not cost that.
 */
function cases(): Case[] {
  const profile = ownerProfile();
  const bench = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
  const only = process.env.THEORY_ONLY;
  return [
    ...bench.map((s) => ({
      label: s.label,
      request: s.request,
      externals: s.externals,
      benchmark: true,
    })),
    ...extraCamps(),
  ].filter((item) => only === undefined || item.label.includes(only));
}

// ---- pricing -----------------------------------------------------------------------------------------

/**
 * A march priced exactly as `tests/engine/plan-benchmark.test.ts` prices one — the recap's own reading, on
 * the full stacks the battle builds — at **both** ends of the coin flip.
 */
function price(
  request: StackRequest,
  counts: Record<string, number>,
): { min: number; avg: number; max: number; silver: number } {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    });
  }
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));
  const result: StackResult = {
    stacks,
    pools: {
      leadership: { used: 0, capacity: request.housing.leadership },
      authority: { used: 0, capacity: request.housing.authority },
      dominance: { used: 0, capacity: request.housing.dominance },
    },
    dropped: [],
    warnings: [],
  };
  const summary = simulateBattle(result, request);
  return {
    min: summary.minDamage,
    avg: summary.avgDamage,
    max: summary.maxDamage,
    silver: summary.recovery.silver,
  };
}

/** The marches a stop plays, first to last, the way `PlanTotals` says to read them. */
function marchesOf(row: PlanTotals): Record<string, number>[] {
  if (row.sequence) return row.sequence;
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const marches = Array.from({ length: repeats }, () => row.counts);
  if (row.finaleCounts) marches.push(row.finaleCounts);
  for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
  return marches;
}

/**
 * **Where the gap is.** The army-first journal inserts exactly one extra attack at the very start, by the
 * first stack in *attack* order (base damage descending, `battle.ts`), so `max − min` is that one stack's
 * own per-hit damage. The kill order is HP descending, so this also says whether the opener is the top-HP
 * stack — the one the enemy wipes first — which is the shape the shelter (S-87) is about.
 */
function gapStack(
  request: StackRequest,
  counts: Record<string, number>,
): { what: string; hit: number; isTopHp: boolean } {
  const { result } = planMarch(request, counts);
  const order = attackOrder(result.stacks);
  const first = order[0];
  const stack = first === undefined ? undefined : result.stacks[first];
  if (!stack) return { what: '—', hit: 0, isTopHp: false };
  return {
    what: `${stack.unitId} ${n(stack.count)}`,
    hit: stack.damagePerHit,
    isTopHp: first === 0,
  };
}

/**
 * One march of the frontier, in the engine's own reading: the two ends of the coin flip, and whether a hired
 * stack stands at or above the lowest troop stack (the shape S-87 forbids the bar to offer).
 */
function frontierMarch(
  request: StackRequest,
  counts: Record<string, number>,
): { min: number; avg: number; unsheltered: boolean } {
  const { result, summary } = planMarch(request, counts);
  const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
  const hired = result.stacks.filter((stack) => stack.pool === 'authority');
  const floor = troops.length === 0 ? 0 : Math.min(...troops.map((stack) => stack.totalHp));
  return {
    min: summary.minDamage,
    avg: summary.avgDamage,
    unsheltered: hired.length > 0 && (troops.length === 0 || hired.some((s) => s.totalHp >= floor)),
  };
}

// ---- what one run records ----------------------------------------------------------------------------

interface StopFigures {
  pick: string;
  shape: string;
  burn: number;
  marches: number;
  repeat: { min: number; avg: number; max: number; silver: number; mercLost: number };
  campaign: { min: number; avg: number; silver: number };
  gap: { what: string; hit: number; isTopHp: boolean };
  putBack: string | null;
}

interface RivalFigures {
  name: string;
  kind: 'sizer' | 'external';
  comparable: boolean;
  marches: number;
  min: number;
  avg: number;
  silver: number;
  burned: number;
}

interface ScenarioFigures {
  label: string;
  benchmark: boolean;
  refusal: string | null;
  /** Which reading the engine that planned this army scores a plan on — asked of it, never assumed. */
  reading: Reading | null;
  knee: number | null;
  stops: StopFigures[];
  rivals: RivalFigures[];
  frontier: {
    rows: number;
    widest: { what: string; gap: number } | null;
    widestUnsheltered: { what: string; gap: number } | null;
    unshelteredRows: number;
  };
}

interface RunFigures {
  reading: Reading;
  run: string;
  scenarios: ScenarioFigures[];
}

/**
 * Which reading the engine this run loaded scores a plan on — asked of the engine, never assumed. `null` when
 * this army cannot tell: a march whose opening stack takes the same number of hits either way has one damage
 * figure and no coin flip, so its `minDamage` and its `avgDamage` are the same number and it is evidence of
 * nothing (it happens: see §A, the 5 100 / 120 camp's sweet spot).
 */
function readingOf(request: StackRequest, plan: CampaignPlan): Reading | null {
  const row = plan.recommend ?? plan.alternatives[0];
  if (!row) return null;
  const { summary } = planMarch(request, row.counts);
  if (summary.minDamage === summary.avgDamage) return null;
  return row.repeat.damage === summary.minDamage ? 'reliable' : 'expected';
}

/** The four sizer sequences and the captured answers, played for the horizon the way the benchmark plays them. */
function rivalsOf(item: Case): RivalFigures[] {
  const { request } = item;
  const hiredIds = request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
  const rows: RivalFigures[] = [];
  const sum = (
    base: StackRequest,
    name: string,
    kind: RivalFigures['kind'],
    marches: Record<string, number>[],
  ): RivalFigures => {
    const ids = base.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
    let min = 0;
    let avg = 0;
    let silver = 0;
    let burned = 0;
    for (const counts of marches) {
      const priced = price(base, counts);
      min += priced.min;
      avg += priced.avg;
      silver += priced.silver;
      burned += ids.reduce((total, id) => total + chunks(counts[id] ?? 0), 0);
    }
    return { name, kind, comparable: true, marches: marches.length, min, avg, silver, burned };
  };
  for (const [method, title] of [
    ['elite', 'Tier ladder'],
    ['ms', 'Troops first'],
  ] as const) {
    for (const [suffix, pick] of [
      ['all types', (r: StackRequest): Record<string, number> => countsOf(sizeStacks(r))],
      [
        'Generate (average damage)',
        (r: StackRequest): Record<string, number> =>
          countsOf(
            searchPriority({ request: r, objective: 'avgDamage', budgetMs: CAMPAIGN.budgets.search }).result,
          ),
      ],
    ] as const) {
      const first: StackRequest = { ...request, options: { ...request.options, method } };
      const caps = { ...first.caps };
      const marches: Record<string, number>[] = [];
      for (let i = 0; i < HORIZON; i += 1) {
        const counts = pick({ ...first, caps: { ...caps } });
        if (Object.values(counts).every((c) => c <= 0)) break;
        marches.push(counts);
        for (const id of hiredIds) {
          if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(counts[id] ?? 0));
        }
      }
      rows.push(sum(first, `${title} · ${suffix}`, 'sizer', marches));
    }
  }
  const held = new Set(request.units.map((unit) => unit.id));
  for (const external of [...item.externals, ...totalstackRows(item.label)]) {
    const base = widenedFor(request, external.counts);
    const ids = base.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
    const caps = { ...base.caps };
    for (const id of ids) if (caps[id] !== undefined) caps[id] = Math.max(caps[id], external.counts[id] ?? 0);
    const marches: Record<string, number>[] = [];
    for (let i = 0; i < HORIZON; i += 1) {
      const march = { ...external.counts };
      for (const id of ids) {
        const cap = caps[id];
        if (cap !== undefined) march[id] = Math.min(march[id] ?? 0, cap);
      }
      marches.push(march);
      for (const id of ids) {
        if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(march[id] ?? 0));
      }
    }
    const outside = Object.entries(external.counts)
      .filter(([id, count]) => count > 0 && !held.has(id))
      .map(([id]) => id);
    const row = sum(base, external.name, 'external', marches);
    if (outside.length > 0) {
      row.comparable = false;
      row.name = `${row.name} — outside the army's window (${outside.join(', ')})`;
    }
    rows.push(row);
  }
  return rows;
}

const countsOf = (result: StackResult): Record<string, number> =>
  Object.fromEntries(result.stacks.map((s) => [s.unitId, s.count]));

function measure(item: Case): ScenarioFigures {
  const { request } = item;
  let plan: CampaignPlan | null = null;
  let refusal: string | null = null;
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withFrontier: true,
    });
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  const figures: ScenarioFigures = {
    label: item.label,
    benchmark: item.benchmark,
    refusal,
    reading: plan ? readingOf(request, plan) : null,
    knee: null,
    stops: [],
    rivals: item.benchmark ? rivalsOf(item) : [],
    frontier: { rows: 0, widest: null, widestUnsheltered: null, unshelteredRows: 0 },
  };
  if (!plan) return figures;
  figures.knee = plan.recommend?.repeat.mercLost ?? null;
  for (const stop of plan.alternatives) {
    const repeat = price(request, stop.counts);
    let min = 0;
    let avg = 0;
    let silver = 0;
    for (const counts of marchesOf(stop)) {
      const priced = price(request, counts);
      min += priced.min;
      avg += priced.avg;
      silver += priced.silver;
    }
    figures.stops.push({
      pick: stop.pick,
      shape: stop.shape,
      burn: stop.repeat.mercLost,
      marches: stop.marches,
      repeat: { ...repeat, mercLost: stop.repeat.mercLost },
      campaign: { min, avg, silver },
      gap: gapStack(request, stop.counts),
      putBack: stop.putBack
        ? `${stop.putBack.unitId} (${stop.putBack.damage.toFixed(1)} % damage, ` +
          `${stop.putBack.silver.toFixed(1)} % silver, ${stop.putBack.seconds.toFixed(1)} % queue)`
        : null,
    });
  }
  // §D — the whole frontier, before the band: where the coin flip is widest among the marches the search
  // actually scores, and whether it is an unsheltered one.
  const frontier = plan.frontier ?? [];
  figures.frontier.rows = frontier.length;
  for (const row of frontier) {
    const priced = frontierMarch(request, row.counts);
    if (priced.avg <= 0) continue;
    const gap = (priced.avg - priced.min) / priced.avg;
    const what = `${row.label} (${n(priced.avg)} expected, ${n(priced.min)} worst)`;
    if (!figures.frontier.widest || gap > figures.frontier.widest.gap) {
      figures.frontier.widest = { what, gap };
    }
    if (!priced.unsheltered) continue;
    figures.frontier.unshelteredRows += 1;
    if (!figures.frontier.widestUnsheltered || gap > figures.frontier.widestUnsheltered.gap) {
      figures.frontier.widestUnsheltered = { what, gap };
    }
  }
  return figures;
}

// ---- the report --------------------------------------------------------------------------------------

const gapOf = (of: { min: number; avg: number }): number => (of.avg > 0 ? (of.avg - of.min) / of.avg : 0);
const bestOf = (
  rows: RivalFigures[],
  kind: RivalFigures['kind'],
  read: (r: RivalFigures) => number,
): number => Math.max(0, ...rows.filter((row) => row.kind === kind && row.comparable).map(read));

function writeReport(mine: RunFigures, other: RunFigures | null): void {
  const today = mine.reading === 'expected' ? mine : other;
  const reliable = mine.reading === 'reliable' ? mine : other;
  const report = new Report('109-reliable-damage');
  report.add(
    '# 109 — the plan stands on reliable damage\n\n' +
      `Run: ${new Date().toISOString()}. This run's engine scores a plan on **${mine.reading}** damage` +
      `${other ? `; the other sidecar on disk is **${other.reading}** (${other.run}).` : '; the other engine has not been run yet — re-run this file on it and the comparison below fills in.'}\n\n` +
      'The two readings: **worst opening** is the enemy-first journal (`minDamage`, what the recap calls ' +
      '"Worst opening"), **expected** the midpoint of the two journals (`avgDamage`), **best** the ' +
      'army-first journal (`maxDamage`). The game decides who opens, 50/50, so the midpoint is a number no ' +
      'single fight pays out.\n',
  );

  // ---- §A
  report.h('§A — every stop as it is offered today, at the three readings');
  if (!today) {
    report.add('_No `expected` sidecar on disk: run this file on the engine before the switch._');
  } else {
    report.add(
      'Per stop: the **repeated** march and the whole **campaign**. The gap is `expected − worst` over ' +
        'expected; it is exactly **half** the opener’s one extra strike, because the army-first journal ' +
        'inserts a single attack by the first stack in attack order and nothing else.\n',
    );
    for (const scenario of today.scenarios) {
      report.add(`\n**${scenario.label}**${scenario.refusal ? ` — refused: \`${scenario.refusal}\`` : ''}\n`);
      if (scenario.refusal) continue;
      report.add(
        '| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |\n' +
          '|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const stop of scenario.stops) {
        report.add(
          `| ${stop.pick} | ${n(stop.burn)} | ${n(stop.repeat.min)} | ${n(stop.repeat.avg)} | ` +
            `${n(stop.repeat.max)} | ${pct(gapOf(stop.repeat))} | ${stop.gap.what} × 1 = ${n(stop.gap.hit)}` +
            `${stop.gap.isTopHp ? ' (top-HP stack)' : ''} | ${n(stop.campaign.min)} | ` +
            `${n(stop.campaign.avg)} | ${pct(gapOf(stop.campaign))} |`,
        );
      }
    }
  }

  // ---- §B
  report.h('§B — the bar re-ranked on worst opening');
  if (!today || !reliable) {
    report.add('_Both sidecars are needed for this section; run this file on both engines._');
  } else {
    report.add(
      'The two bars side by side, stop by stop. `today` is the engine that ranks on the midpoint, ' +
        '`reliable` the engine that ranks on the enemy-first journal. Both columns print the **worst ' +
        'opening** of the march each bar chose, so the comparison is on the reading the owner asked for.\n',
    );
    for (const scenario of reliable.scenarios) {
      const before = today.scenarios.find((s) => s.label === scenario.label);
      report.add(`\n**${scenario.label}**\n`);
      if (!before) continue;
      report.add(
        `Knee (the sweet spot’s rung, hired burned a march): ${before.knee ?? '—'} → **${scenario.knee ?? '—'}**. ` +
          `Stops: ${before.stops.length} → **${scenario.stops.length}**.\n`,
      );
      report.add(
        '| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      const picks = [...new Set([...before.stops.map((s) => s.pick), ...scenario.stops.map((s) => s.pick)])];
      for (const pick of picks) {
        const a = before.stops.find((s) => s.pick === pick);
        const b = scenario.stops.find((s) => s.pick === pick);
        const perS = (s: StopFigures | undefined, read: 'min' | 'avg'): string =>
          s && s.repeat.silver > 0 ? (s.repeat[read] / s.repeat.silver).toFixed(4) : '—';
        const perH = (s: StopFigures | undefined, read: 'min' | 'avg'): string =>
          s ? n(Math.round(s.repeat[read] / Math.max(1, s.repeat.mercLost))) : '—';
        const delta =
          a && b && a.repeat.min > 0
            ? `${b.repeat.min >= a.repeat.min ? '+' : ''}${(((b.repeat.min - a.repeat.min) / a.repeat.min) * 100).toFixed(2)} %`
            : '—';
        report.add(
          `| ${pick} | ${a ? n(a.burn) : '—'} | ${b ? n(b.burn) : '—'} | ${a ? n(a.repeat.min) : '—'} | ` +
            `${b ? n(b.repeat.min) : '—'} | ${delta} | ${a ? n(a.repeat.avg) : '—'} | ` +
            `${b ? n(b.repeat.avg) : '—'} | ${perS(a, 'avg')} | ${perS(b, 'min')} | ${perH(a, 'avg')} | ` +
            `${perH(b, 'min')} | ${a?.shape ?? '—'} → ${b?.shape ?? '—'} | ` +
            `${a?.putBack ?? '—'} → ${b?.putBack ?? '—'} |`,
        );
      }
    }
  }

  // ---- §C
  report.h('§C — the sizer sequences and the captured answers, re-priced on worst opening');
  if (!today || !reliable) {
    report.add('_Both sidecars are needed for this section; run this file on both engines._');
  } else {
    report.add(
      'The benchmark’s two pins, on the ten armies it measures. `damageFloor` is the plan’s hardest ' +
        'campaign over the best sizer sequence’s; `externals` the same over the best captured answer. ' +
        '**today** is the expected-damage engine priced on expected damage (what the pins hold now); ' +
        '**reliable** is the worst-opening engine priced on worst opening (what they become). The middle ' +
        'column isolates the two halves of the move: today’s bar, priced on worst opening.\n',
    );
    report.add(
      '| army | today (expected) | today’s bar on worst | reliable | externals today | externals on worst | externals reliable |\n' +
        '|---|---|---|---|---|---|---|',
    );
    for (const scenario of reliable.scenarios.filter((s) => s.benchmark)) {
      const before = today.scenarios.find((s) => s.label === scenario.label);
      if (!before || before.refusal || scenario.refusal) continue;
      const share = (stops: StopFigures[], rivals: RivalFigures[], read: 'min' | 'avg'): string => {
        const best = Math.max(0, ...stops.map((s) => s.campaign[read]));
        const rival = bestOf(rivals, 'sizer', (r) => r[read]);
        return rival > 0 ? (best / rival).toFixed(3) : '—';
      };
      const ext = (stops: StopFigures[], rivals: RivalFigures[], read: 'min' | 'avg'): string => {
        const best = Math.max(0, ...stops.map((s) => s.campaign[read]));
        const rival = bestOf(rivals, 'external', (r) => r[read]);
        return rival > 0 ? (best / rival).toFixed(3) : '—';
      };
      report.add(
        `| ${scenario.label} | ${share(before.stops, before.rivals, 'avg')} | ` +
          `${share(before.stops, before.rivals, 'min')} | ${share(scenario.stops, scenario.rivals, 'min')} | ` +
          `${ext(before.stops, before.rivals, 'avg')} | ${ext(before.stops, before.rivals, 'min')} | ` +
          `${ext(scenario.stops, scenario.rivals, 'min')} |`,
      );
    }
    report.add(
      '\nThe **worst / expected ratio** of each army, which is what bridges a figure of this file to a ' +
        'figure of benchmark 00–11 (the plan’s hardest campaign, both readings, on the engine of each run):\n',
    );
    report.add('| army | today’s bar | reliable bar |\n|---|---|---|');
    for (const scenario of reliable.scenarios) {
      const before = today.scenarios.find((s) => s.label === scenario.label);
      if (!before || before.refusal || scenario.refusal) continue;
      const ratio = (stops: StopFigures[]): string => {
        const top = stops.reduce<StopFigures | undefined>(
          (held, s) => (!held || s.campaign.avg > held.campaign.avg ? s : held),
          undefined,
        );
        return top && top.campaign.avg > 0 ? (top.campaign.min / top.campaign.avg).toFixed(4) : '—';
      };
      report.add(`| ${scenario.label} | ${ratio(before.stops)} | ${ratio(scenario.stops)} |`);
    }
  }

  // ---- §D
  report.h('§D — the coin flip, on the bar and over the whole frontier');
  for (const run of [today, reliable]) {
    if (!run) continue;
    report.add(`\n**The ${run.reading} engine.**\n`);
    report.add(
      '| army | widest gap on the bar | widest gap on the frontier | widest among unsheltered marches | unsheltered rows |\n' +
        '|---|---|---|---|---|',
    );
    for (const scenario of run.scenarios) {
      if (scenario.refusal) continue;
      const widest = scenario.stops.reduce<StopFigures | undefined>(
        (held, s) => (!held || gapOf(s.repeat) > gapOf(held.repeat) ? s : held),
        undefined,
      );
      report.add(
        `| ${scenario.label} | ${widest ? `${widest.pick} ${pct(gapOf(widest.repeat))}` : '—'} | ` +
          `${scenario.frontier.widest ? `${pct(scenario.frontier.widest.gap)} — ${scenario.frontier.widest.what}` : '—'} | ` +
          `${scenario.frontier.widestUnsheltered ? `${pct(scenario.frontier.widestUnsheltered.gap)} — ${scenario.frontier.widestUnsheltered.what}` : 'none'} | ` +
          `${n(scenario.frontier.unshelteredRows)} of ${n(scenario.frontier.rows)} |`,
      );
    }
  }
  report.save();
}

describe.skipIf(!process.env.THEORY)('the plan stands on reliable damage', () => {
  it('measures the gap, the re-ranked bar, the re-priced rivals and the coin flip', () => {
    const scenarios = cases().map((item) => measure(item));
    // The engine says which reading it is on; every army that answered must say the same thing.
    const said = new Set(scenarios.map((s) => s.reading).filter((r): r is Reading => r !== null));
    if (said.size > 1) throw new Error(`the engine reads a plan two ways at once: ${[...said].join(', ')}`);
    const reading: Reading = said.has('reliable') ? 'reliable' : 'expected';
    const mine: RunFigures = { reading, run: new Date().toISOString(), scenarios };
    writeFileSync(sidecar(reading), `${JSON.stringify(mine, null, 1)}\n`);
    const otherFile = sidecar(reading === 'expected' ? 'reliable' : 'expected');
    const other = existsSync(otherFile) ? (JSON.parse(readFileSync(otherFile, 'utf8')) as RunFigures) : null;
    writeReport(mine, other);
  }, 3_600_000);
});
