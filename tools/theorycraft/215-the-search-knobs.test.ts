/**
 * 215 — **the search-knob census**: for each knob of the plan's search, how much plan CPU it owns, and is
 * restricting it costless in march rating?
 *
 * The owner (2026-10-12): *"I don't want to impose blind computations quotas, I prefer smart limits that are
 * backed to be costless in terms of march rating by theorycrafting."* Every knob is restricted here and the
 * restriction is measured, never argued: the plan CPU it saves (stage 1, in-process, the heavy armies) and
 * the stops it moves and rates (stage 2, the repo's own benchmark).
 *
 * **The knobs** (all read through a module `let`, or through the knob override this experiment's patch adds —
 * `docs/research/patches/215-search-knobs.patch`): `DEPTHS`, `LADDER_GROWTHS` and `SIZER_DEPTHS` (the ladder
 * grid and the sizer shapes), `WINNER_RUNGS_DEPTH` (the winner's-rungs shape), `PLAN_LIMITS.climbRounds` /
 * `climbSeeds` / `sweepRounds`, and `CAMPAIGN.advisorSweep.horizons` (the advisor pass alone). Every shipped
 * default is restored before the test leaves (`setKnobs215()`).
 *
 * **Stage 1** plans three heavy armies (`planCampaign`, no `budgetMs`, the probes' own settings): the owner's
 * live account of 2026-10-11 and the two monster camps of `plan-scenarios.ts`. For each restriction it plans
 * each army `KNOB_REPS` times interleaved with the unrestricted arm, and reports the per-army medians (with
 * mins) of the plan wall and process CPU. `% of the plan` is CPU saved over the unrestricted plan; `% of pool
 * CPU` is that over the plan's own share of the pool (**≈ 45 %** on his account, `docs/plans/next-speed.md`
 * §"Where W22 leaves the wall"). Anything under the 2 % bar is *not worth it* and is not carried to stage 2.
 *
 * **Stage 2** runs the repo's own benchmark once per survivor and copies its payload aside
 * (`tools/theorycraft/out/215-runs/{base,<slug>}.json`, from `benchmark-run.json`); this file diffs the two
 * payloads stop by stop and rates each against the unrestricted run with the owner's `markerRates` (`rate`,
 * `src/engine/rating.ts`) — the rule that a step is judged on every marker of a march's success, not on damage
 * alone.
 *
 *   THEORY=1 pnpm vitest run tools/theorycraft/215-the-search-knobs.test.ts
 *   THEORY=1 PARTS215=1 pnpm vitest run tools/theorycraft/215-the-search-knobs.test.ts   # stage 1 only
 *
 * Stage 2's benchmark runs are made by hand, one per survivor (they overwrite committed files between the copy
 * and the restore):
 *
 *   pnpm vitest run tests/engine/plan-benchmark.test.ts ; cp tools/theorycraft/out/benchmark-run.json tools/theorycraft/out/215-runs/base.json
 *   KNOBS215='{"depths":[1,2,3,4,5]}' pnpm vitest run tests/engine/plan-benchmark.test.ts ; cp ... <slug>.json
 *
 * Nothing here re-bases anything: `tests/engine/plan-baseline*.json` is untouched.
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { HORIZON, commonScenarios } from '../../tests/engine/plan-scenarios';

const OUT = 'tools/theorycraft/out/215-the-search-knobs.md';
const OUT1 = 'tools/theorycraft/out/215-the-search-knobs-stage1.md';
const RUNS = 'tools/theorycraft/out/215-runs';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
/** Plans per arm per army in stage 1 (the medians and mins are read off them). */
const REPS = Number(process.env.KNOB_REPS ?? 5);
/** The plan's own share of the pool CPU (`next-speed.md` §"Where W22 leaves the wall"). */
const PLAN_SHARE_OF_POOL = 0.45;
/** A step under this share of the pool CPU is not worth carrying (`next-speed.md` §"stop rule"). */
const BAR = 2;
const PARTS = new Set((process.env.PARTS215 ?? '1,2').split(','));
const RATES = CAMPAIGN.markerRates;

const f = (value: number, digits = 1): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
const min = (xs: number[]): number => Math.min(...xs);

/**
 * The override the knob patch installs on `globalThis` (`src/engine/plan.ts`,
 * `docs/research/patches/215-search-knobs.patch`), reached through the handle rather than imported — the
 * census pattern of experiment 213. Called with nothing, it restores the shipped knobs.
 */
interface Knobs215 {
  depths?: readonly number[];
  growths?: readonly number[];
  sizerDepths?: Record<number, string>;
  limits?: Record<string, number | undefined>;
  dropWinnerRungs?: boolean;
}
const setKnobs215 = (knobs?: Knobs215): void => {
  const fn = (globalThis as unknown as { __setKnobs215?: (k?: Knobs215) => void }).__setKnobs215;
  if (fn === undefined)
    throw new Error(
      'the 215 knob override is not installed: `git apply docs/research/patches/215-search-knobs.patch` first',
    );
  fn(knobs);
};

/** One restriction: its stable id (naming the copied benchmark payload), the knob, the words, the override. */
interface Restriction {
  /** Stable file id: `tools/theorycraft/out/215-runs/<id>.json` holds this restriction's benchmark payload. */
  id: string;
  knob: string;
  restriction: string;
  knobs: Knobs215;
}
/**
 * The restrictions. `CAMPAIGN.advisorSweep.horizons` is not here — it is the advisor pass, never the plan, and
 * is measured on its own (`horizonProbes`). Each row's words state exactly what was run, and its `id` names the
 * `KNOBS215` payload the benchmark half was given.
 */
const RESTRICTIONS: Restriction[] = [
  {
    id: 'depths-no-high',
    knob: '`DEPTHS`',
    restriction: 'no high — `[1,2,3,4,5]`',
    knobs: { depths: [1, 2, 3, 4, 5] },
  },
  {
    id: 'depths-no-low',
    knob: '`DEPTHS`',
    restriction: 'no low — `[4,5,6,7,8]`',
    knobs: { depths: [4, 5, 6, 7, 8] },
  },
  {
    id: 'depths-middle',
    knob: '`DEPTHS`',
    restriction: 'middle — `[3,4,5,6]`',
    knobs: { depths: [3, 4, 5, 6] },
  },
  {
    id: 'growths-half',
    knob: '`LADDER_GROWTHS`',
    restriction: 'every other — `[1,1.5,2.2,4,6]`',
    knobs: { growths: [1, 1.5, 2.2, 4, 6] },
  },
  {
    id: 'sizer-drop-msRelaxed',
    knob: '`SIZER_DEPTHS`',
    restriction: 'drop `msRelaxed`',
    knobs: { sizerDepths: { 0: 'elite', [-1]: 'ms' } },
  },
  {
    id: 'sizer-drop-ms',
    knob: '`SIZER_DEPTHS`',
    restriction: 'drop `ms`',
    knobs: { sizerDepths: { 0: 'elite', [-2]: 'msRelaxed' } },
  },
  {
    id: 'sizer-drop-elite',
    knob: '`SIZER_DEPTHS`',
    restriction: 'drop `elite`',
    knobs: { sizerDepths: { [-1]: 'ms', [-2]: 'msRelaxed' } },
  },
  {
    id: 'winner-rungs-off',
    knob: '`WINNER_RUNGS_DEPTH`',
    restriction: 'winner-rungs shape off',
    knobs: { dropWinnerRungs: true },
  },
  {
    id: 'climbRounds-16',
    knob: '`PLAN_LIMITS.climbRounds`',
    restriction: '32 → 16',
    knobs: { limits: { climbRounds: 16 } },
  },
  {
    id: 'climbRounds-8',
    knob: '`PLAN_LIMITS.climbRounds`',
    restriction: '32 → 8',
    knobs: { limits: { climbRounds: 8 } },
  },
  {
    id: 'climbSeeds-4',
    knob: '`PLAN_LIMITS.climbSeeds`',
    restriction: '8 → 4',
    knobs: { limits: { climbSeeds: 4 } },
  },
  {
    id: 'sweepRounds-8',
    knob: '`PLAN_LIMITS.sweepRounds`',
    restriction: '16 → 8',
    knobs: { limits: { sweepRounds: 8 } },
  },
];

// ---- the heavy armies ------------------------------------------------------------------------------------

interface Army {
  name: string;
  request: StackRequest;
}

/** The app's own plan settings on this army, without a clock (the probes' own settings). */
const settings = (request: StackRequest): Parameters<typeof planCampaign>[0] => ({
  request,
  marchTarget: HORIZON,
  ...CAMPAIGN.planFixes,
  putBack: CAMPAIGN.putBack,
});

/** The owner's live account of 2026-10-11, as the app builds its request. */
function ownerLive(): StackRequest {
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  if (parsed.kind !== 'profile') throw new Error('the timing fixture is not a profile');
  const profile = parsed.payload;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (!setup) throw new Error('the fixture has no setup');
  return buildPlanRequest(profile, setup).request;
}

/** The three heavy armies: the owner's live account and the two monster camps. */
function heavyArmies(): Army[] {
  const monsters = commonScenarios()
    .filter((s) => /monster tiers/.test(s.label))
    .map((s) => ({ name: s.label, request: s.request }));
  return [{ name: `owner-live ${ACCOUNT}`, request: ownerLive() }, ...monsters];
}

// ---- stage 1: the plan CPU -------------------------------------------------------------------------------

interface Sample {
  wall: number;
  cpu: number;
  refusal: string | null;
}
/** One `planCampaign` call under a restriction (or `undefined` for the shipped knobs), timed both ways. */
function timePlan(request: StackRequest, knobs: Knobs215 | undefined): Sample {
  setKnobs215(knobs);
  // A collect before every timed plan (`NODE_OPTIONS=--expose-gc`): the planner allocates hard (W22), and a
  // GC that lands mid-plan is most of what made the raw medians swing 2×. Not timed.
  (globalThis as { gc?: () => void }).gc?.();
  const c0 = process.cpuUsage();
  const w0 = performance.now();
  let refusal: string | null = null;
  try {
    planCampaign(settings(request));
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  const wall = performance.now() - w0;
  const c = process.cpuUsage(c0);
  return { wall, cpu: (c.user + c.system) / 1000, refusal };
}

interface ArmStat {
  cpuMed: number;
  cpuMin: number;
  wallMed: number;
  wallMin: number;
}
const stat = (xs: number[], ys: number[]): ArmStat => ({
  cpuMed: median(xs),
  cpuMin: min(xs),
  wallMed: median(ys),
  wallMin: min(ys),
});

interface Stage1 {
  knob: string;
  restriction: string;
  perArmy: { name: string; base: ArmStat; restr: ArmStat }[];
  /** Medians summed over the armies — the noisy reading (GC spikes on the monster camps). */
  baseCpu: number;
  restrCpu: number;
  savedPct: number;
  /** Mins summed over the armies — the clean reading, and the one the verdict rests on. */
  baseCpuMin: number;
  restrCpuMin: number;
  savedMinPct: number;
  poolPct: number;
  baseWallMin: number;
  restrWallMin: number;
  wallSavedPct: number;
  refusals: string[];
}

/** One restriction over every army, interleaved with the unrestricted arm, plan by plan. */
function stage1(r: Restriction, armies: Army[]): Stage1 {
  // A warm-up of both arms first, thrown away, so a cold JIT is never a number reported.
  timePlan(armies[0]?.request as StackRequest, undefined);
  timePlan(armies[0]?.request as StackRequest, r.knobs);
  const perArmy: Stage1['perArmy'] = [];
  const refusals: string[] = [];
  for (const army of armies) {
    const base = { cpu: [] as number[], wall: [] as number[] };
    const restr = { cpu: [] as number[], wall: [] as number[] };
    for (let i = 0; i < REPS; i += 1) {
      const order: [Knobs215 | undefined, 'base' | 'restr'][] =
        i % 2 === 0
          ? [
              [undefined, 'base'],
              [r.knobs, 'restr'],
            ]
          : [
              [r.knobs, 'restr'],
              [undefined, 'base'],
            ];
      for (const [k, arm] of order) {
        const s = timePlan(army.request, k);
        const into = arm === 'base' ? base : restr;
        into.cpu.push(s.cpu);
        into.wall.push(s.wall);
        if (s.refusal !== null) {
          const note = `${army.name} (${arm}): ${s.refusal}`;
          if (!refusals.includes(note)) refusals.push(note);
        }
      }
    }
    perArmy.push({ name: army.name, base: stat(base.cpu, base.wall), restr: stat(restr.cpu, restr.wall) });
  }
  setKnobs215(undefined);
  const baseCpu = perArmy.reduce((a, p) => a + p.base.cpuMed, 0);
  const restrCpu = perArmy.reduce((a, p) => a + p.restr.cpuMed, 0);
  const baseCpuMin = perArmy.reduce((a, p) => a + p.base.cpuMin, 0);
  const restrCpuMin = perArmy.reduce((a, p) => a + p.restr.cpuMin, 0);
  const baseWallMin = perArmy.reduce((a, p) => a + p.base.wallMin, 0);
  const restrWallMin = perArmy.reduce((a, p) => a + p.restr.wallMin, 0);
  const savedPct = baseCpu > 0 ? ((baseCpu - restrCpu) / baseCpu) * 100 : 0;
  const savedMinPct = baseCpuMin > 0 ? ((baseCpuMin - restrCpuMin) / baseCpuMin) * 100 : 0;
  return {
    knob: r.knob,
    restriction: r.restriction,
    perArmy,
    baseCpu,
    restrCpu,
    savedPct,
    baseCpuMin,
    restrCpuMin,
    savedMinPct,
    poolPct: savedMinPct * PLAN_SHARE_OF_POOL,
    baseWallMin,
    restrWallMin,
    wallSavedPct: baseWallMin > 0 ? ((baseWallMin - restrWallMin) / baseWallMin) * 100 : 0,
    refusals,
  };
}

// ---- stage 2: the benchmark payloads ---------------------------------------------------------------------

interface Row {
  name: string;
  kind: string;
  damage: number;
  silver: number;
  gold: number;
  seconds: number;
  burned: number;
  dragonCoins: number;
  perSilver: number | null;
  perHired: number;
}
interface Figures {
  scenarios: { label: string; stops: string[]; rows: Row[] }[];
}
const bill = (r: Row): Bill => ({
  damage: r.damage,
  silver: r.silver,
  gold: r.gold,
  hired: r.burned,
  dragonCoins: r.dragonCoins,
  seconds: r.seconds,
});
const planRow = (fig: Figures, label: string, pick: string): Row | undefined =>
  fig.scenarios
    .find((s) => s.label === label)
    ?.rows.find((r) => r.kind === 'plan' && r.name.endsWith(`· ${pick}`));

interface Stage2 {
  moved: number;
  worse: number;
  lost: number;
  worst: { r: number; at: string };
  movedList: string[];
}
/** One restriction's benchmark payload against the base's: every stop moved, rated on the owner's markers. */
function stage2(base: Figures, after: Figures): Stage2 {
  const out: Stage2 = { moved: 0, worse: 0, lost: 0, worst: { r: 0, at: '—' }, movedList: [] };
  for (const scenario of base.scenarios) {
    const to = after.scenarios.find((s) => s.label === scenario.label);
    if (!to) continue;
    for (const pick of scenario.stops) {
      const b = planRow(base, scenario.label, pick);
      if (!b) continue;
      const a = planRow(after, scenario.label, pick);
      const at = `${scenario.label} · ${pick}`;
      if (!a) {
        out.lost += 1;
        out.movedList.push(`${at} — STOP LOST`);
        continue;
      }
      const r = rate(bill(b), bill(a), RATES);
      const readings: [number | null, number | null][] = [
        [b.damage, a.damage],
        [b.silver, a.silver],
        [b.burned, a.burned],
        [b.gold, a.gold],
        [b.seconds, a.seconds],
        [b.dragonCoins, a.dragonCoins],
        [b.perSilver, a.perSilver],
        [b.perHired, a.perHired],
      ];
      if (readings.some(([x, y]) => x !== null && y !== null && x !== y)) {
        out.moved += 1;
        out.movedList.push(`${at} — rated ${r > 0 ? '+' : '−'}${f(Math.abs(r), 3)}`);
      }
      if (
        r < -1e-9 ||
        a.damage < b.damage ||
        a.silver > b.silver ||
        a.burned > b.burned ||
        a.seconds > b.seconds
      )
        out.worse += 1;
      if (r < out.worst.r) out.worst = { r, at };
    }
  }
  return out;
}

const readFigures = (path: string): Figures | null =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Figures) : null;

// ---- the report ------------------------------------------------------------------------------------------

const store = globalThis as unknown as { __k215?: Stage1[] | undefined };

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('215 — the search-knob census', () => {
  it(
    'stage 1 — plans the heavy armies under each restriction, interleaved with the unrestricted arm',
    () => {
      if (!PARTS.has('1')) return;
      const armies = heavyArmies();
      const rows = RESTRICTIONS.map((r) => stage1(r, armies));
      store.__k215 = rows;
      // Persisted so stage 2 can run on its own (`PARTS215=2`) and read the same figures.
      mkdirSync(RUNS, { recursive: true });
      writeFileSync(`${RUNS}/stage1.json`, JSON.stringify(rows, null, 1));

      const lines = [
        '# 215 — the search-knob census (stage 1 — the plan CPU)',
        '',
        `Run ${new Date().toISOString().slice(0, 10)}: \`planCampaign\` in-process, release kernel, no \`budgetMs\`, the probes' own settings, ${String(armies.length)} heavy armies × ${String(REPS)} plans an arm, interleaved with the unrestricted arm (a warm-up first). \`ms\` are the per-army medians summed over the armies, with the per-army **min** in brackets. The plan's own share of the pool CPU is **≈ 45 %** (\`docs/plans/next-speed.md\`), so \`% of pool CPU\` is \`% of the plan\` × 0.45.`,
        '',
        `The armies: ${armies.map((a) => `\`${a.name}\``).join(' · ')}.`,
        '',
        '| knob | restriction | plan CPU, unrestricted (median / min) | restricted (median / min) | CPU saved (median) | CPU saved (min) | % of pool CPU (min) | plan wall saved (min) | verdict |',
        '|---|---|---:|---:|---:|---:|---:|---:|---|',
      ];
      for (const row of rows) {
        const verdict = row.poolPct < BAR ? '**not worth it**' : 'to stage 2';
        lines.push(
          `| ${row.knob} | ${row.restriction} | ${f(row.baseCpu)} / ${f(row.baseCpuMin)} | ${f(row.restrCpu)} / ${f(row.restrCpuMin)} | ` +
            `${f(row.savedPct)} % | ${f(row.savedMinPct)} % | **${f(row.poolPct)} %** | ${f(row.wallSavedPct)} % | ${verdict} |`,
        );
      }
      // Per-army detail, so the medians above can be checked.
      lines.push(
        '',
        '## Per army',
        '',
        '| restriction | army | CPU unc. | retr. | wall unc. | restr. |',
        '|---|---|---:|---:|---:|---:|',
      );
      for (const row of rows)
        for (const p of row.perArmy)
          lines.push(
            `| ${row.restriction} | ${p.name} | ${f(p.base.cpuMed)} | ${f(p.restr.cpuMed)} | ${f(p.base.wallMed)} | ${f(p.restr.wallMed)} |`,
          );
      const refusals = rows.flatMap((row) => row.refusals.map((x) => `- ${row.restriction}: ${x}`));
      lines.push('', refusals.length > 0 ? refusals.join('\n') : 'No arm refused an army.');
      const out = `${lines.join('\n')}\n`;
      writeFileSync(OUT1, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      expect(rows.length).toBe(RESTRICTIONS.length);
    },
    60 * 60_000,
  );

  it(
    'the advisor horizons — measured on their own (the advisor pass, not the plan)',
    () => {
      if (!PARTS.has('1')) return;
      const request = heavyArmies()[0]?.request as StackRequest;
      const at = (marches: number): number => {
        timePlan(request, undefined);
        const xs: number[] = [];
        for (let i = 0; i < Math.max(1, REPS); i += 1) {
          (globalThis as { gc?: () => void }).gc?.();
          const c0 = process.cpuUsage();
          planCampaign({ ...settings(request), marchTarget: marches });
          const c = process.cpuUsage(c0);
          xs.push((c.user + c.system) / 1000);
        }
        return median(xs);
      };
      const t4 = at(4);
      const t3 = at(3);
      const t5 = at(5);
      const lines = [
        '',
        '## The advisor horizons (`CAMPAIGN.advisorSweep.horizons`)',
        '',
        `\`horizonProbes\` emits one probe per horizon but the baseline (\`CAMPAIGN.marches\` = 4), so \`[3,4,5]\` is **2** full plans (3 and 5) and \`[4]\` is **0**. On \`${ACCOUNT}\` a marchTarget-4 plan is ${f(t4)} ms CPU, marchTarget-3 ${f(t3)} ms, marchTarget-5 ${f(t5)} ms; restricting \`[3,4,5]\`→\`[4]\` removes **${f(t3 + t5)} ms** of advisor CPU — 2 probes of the ${String(REPS)}-median. It is inside the advisor's own share of the pool, not the plan's, and changes no plan stop.`,
        '',
      ];
      const prior = existsSync(OUT1) ? readFileSync(OUT1, 'utf8') : '';
      writeFileSync(OUT1, `${prior}${lines.join('\n')}\n`);
      // Persisted so the combined report can carry the row.
      mkdirSync(RUNS, { recursive: true });
      writeFileSync(`${RUNS}/horizons.json`, JSON.stringify({ t3, t4, t5 }));
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(lines.join('\n'));
      expect(t5).toBeGreaterThan(0);
    },
    60 * 60_000,
  );

  it(
    'stage 2 — the rating gate, and the combined ranked report',
    () => {
      const base = readFigures(`${RUNS}/base.json`);
      const rows =
        store.__k215 ??
        (existsSync(`${RUNS}/stage1.json`)
          ? (JSON.parse(readFileSync(`${RUNS}/stage1.json`, 'utf8')) as Stage1[])
          : []);
      const byId = new Map(rows.map((r) => [r.knob + '|' + r.restriction, r]));
      const lines = [
        '# 215 — the search-knob census',
        '',
        "For each knob of the plan's search: how much plan CPU restricting it saves, and whether the restriction is costless in march rating. Stage 1 is in-process on three heavy armies; stage 2 is the repo's own benchmark (`tests/engine/plan-benchmark.test.ts`), the restricted run diffed stop by stop against the unrestricted run of this tree and rated with `CAMPAIGN.markerRates` (`rate`, `src/engine/rating.ts`). `plan CPU saved` is the **min**-based reading, the medians beside it in `215-the-search-knobs-stage1.md`; the stage-1 figures carry a few-point band (see the closing note), so the stage-2 verdict is the firm half. **Nothing is re-based.**",
        '',
        '| knob | restriction | plan CPU saved | % of pool CPU | stops moved | worst rating delta | verdict |',
        '|---|---|---:|---:|---:|---:|---|',
      ];
      const details: string[] = [];
      const costless: string[] = [];
      const trades: string[] = [];
      const thin: string[] = [];
      const costlessThin: string[] = [];
      for (const r of RESTRICTIONS) {
        const s1 = byId.get(r.knob + '|' + r.restriction);
        if (!s1) continue;
        const after = readFigures(`${RUNS}/${r.id}.json`);
        const d = after === null || base === null ? null : stage2(base, after);
        const clean = d !== null && d.worse === 0 && d.lost === 0;
        const verdict =
          s1.poolPct < BAR
            ? '**not worth it** (< 2 %)'
            : d === null
              ? 'cpu only'
              : clean
                ? '**costless**'
                : '**trade**';
        lines.push(
          `| ${r.knob} | ${r.restriction} | ${f(s1.savedMinPct)} % (min) | ${f(s1.poolPct)} % | ` +
            `${d === null ? 'n/a' : String(d.moved)} | ${d === null ? 'n/a' : d.worst.r < -1e-9 ? `−${f(Math.abs(d.worst.r), 3)}` : '0'} | ${verdict} |`,
        );
        const name = `${r.knob} \`${r.restriction}\``;
        if (s1.poolPct < BAR) {
          thin.push(name);
          if (clean) costlessThin.push(name);
        } else if (clean) costless.push(name);
        else trades.push(name);
        if (d !== null && d.movedList.length > 0)
          details.push(`**${r.knob} ${r.restriction}**`, ...d.movedList.map((m) => `- ${m}`), '');
      }
      // The advisor horizons: measured in stage 1's sibling test (`215-…-stage1.md`), never a plan stop. The
      // restriction removes **two whole advisor jobs** (the marchTarget-3 and -5 plans), not a slice of one
      // plan, so there is no honest "% of the plan" for it; its CPU is the two probes' own ms, and its pool
      // share would need a pass total this experiment does not measure.
      const hz = existsSync(`${RUNS}/horizons.json`)
        ? (JSON.parse(readFileSync(`${RUNS}/horizons.json`, 'utf8')) as {
            t3: number;
            t4: number;
            t5: number;
          })
        : null;
      if (hz !== null) {
        const removed = hz.t3 + hz.t5;
        lines.push(
          `| \`CAMPAIGN.advisorSweep.horizons\` | \`[3,4,5]\` → \`[4]\` (advisor only) | — (2 probe plans, ${f(removed)} ms) | n/a (advisor) | 0 (no plan stop) | 0 | **costless** |`,
        );
        costless.push(
          `\`CAMPAIGN.advisorSweep.horizons\` \`[3,4,5]\` → \`[4]\` — removes two advisor probe plans (${f(removed)} ms CPU, marchTarget 3 and 5) and not one plan stop; it does drop the two rows the advisor shows`,
        );
      }
      lines.push(
        '',
        '## Stops moved',
        '',
        details.length > 0 ? details.join('\n') : 'None.',
        '',
        '## Verdict',
        '',
        `**Proven costless** — no march stop worse anywhere in the benchmark (the owner's own bar):`,
        '',
        ...(costless.length > 0 ? costless.map((c) => `- ${c}`) : ['- none']),
        '',
        `**Trade** (CPU saved, stops moved — listed above): ${trades.length > 0 ? trades.join(' · ') : 'none'}.`,
        '',
        `**Not worth it** (saved under the 2 % of pool CPU bar): ${thin.length > 0 ? thin.join(' · ') : 'none'}.`,
        '',
        `Of those under the bar, these are **also costless** (CPU moves nothing, but too little to matter): ${costlessThin.length > 0 ? costlessThin.join(' · ') : 'none'}.`,
        '',
        'A **knob** here is a constant of the search, not a promise: `SIZER_DEPTHS` dropping one method leaves the',
        'sizer shape off for every candidate, and the benchmark answers every stop identically without it — the',
        "sizer shapes that W11's re-typing and the put-back follow simply never win a stop on these 19 armies.",
        'The same claim on an army outside this benchmark is not made here.',
        '',
        `**Closing line.** These restrictions are proven costless in march rating: ${
          costless.length > 0 ? costless.join('; ') : 'none'
        }.`,
        '',
        `The stage-2 runs are deterministic (the same tree, the same 19 benchmark armies); the stage-1 CPU figures`,
        `swing with the machine (the arms are interleaved and \`--expose-gc\` collects before every plan, but a`,
        `3–10 % band on the small ones is the floor of this method), so a knob within a few points of the 2 % bar`,
        `reads as borderline rather than as a verdict.`,
        '',
      );
      const out = `${lines.join('\n')}\n`;
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
    },
    20 * 60_000,
  );
});
