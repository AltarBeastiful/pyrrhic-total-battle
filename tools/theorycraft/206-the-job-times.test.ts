/**
 * 206 — **the time of every job, and what it was given** (W22 SPEED-01, `docs/plans/next-speed.md` §1 step 6): the
 * data SPEED-06 fits its cost estimate (`src/worker/jobCost.ts`) on.
 *
 * The run is 196's own — Generate's plan and its bar's Tight tables, then the advisor's three passes — in-process
 * on one inline lane, no clock, on the **release kernel** (timings are judged on it), every job timed with
 * `performance.now()`. The split is the production harness's (`Working/w18/prod/split.ts`): `planCampaign` and
 * `positionTrades` (the Tight raise) are wrapped by `vi.mock`, and the two sums are reset at each job. One row per
 * job: pass, kind, probe id, total ms, plan ms, Tight ms and calls, and every input feature that could predict it
 * (`inputs`, known before the job runs) beside what the job turned out to field (`observed`, not a predictor).
 *
 * `THEORY=1 JOB_TIMES_OUT=<file.json> [PYRRHIC_TIMING_FIXTURE=<export.json>] \
 *    pnpm vitest run tools/theorycraft/206-the-job-times.test.ts`
 * The account is `PYRRHIC_TIMING_FIXTURE` (default `pyrrhic-my-account-2026-10-11.json` at the repo root; never
 * committed); the file `JOB_TIMES_OUT` (default `.maestro/playbooks/Working/w22/job-times.json`) gets the rows.
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import type * as engine from '../../src/engine';
import { planMarch, withMethod } from '../../src/engine';
import { leadTrio } from '../../src/engine/captainUpgrades';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { captainTrios } from '../../src/state/captainTrios';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import { troopFloor } from '../../src/ui/sections/march/raise';
import type * as positions from '../../src/ui/sections/march/positions';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';

/** The two sums the wrapped functions feed, reset by the lane at the start of every job. */
const split = vi.hoisted(() => ({ plan: 0, planCalls: 0, tight: 0, tightCalls: 0 }));
vi.mock('../../src/engine', async (importOriginal) => {
  const real = await importOriginal<typeof engine>();
  return {
    ...real,
    planCampaign: (...args: Parameters<typeof real.planCampaign>) => {
      const began = performance.now();
      try {
        return real.planCampaign(...args);
      } finally {
        split.plan += performance.now() - began;
        split.planCalls += 1;
      }
    },
  };
});
vi.mock('../../src/ui/sections/march/positions', async (importOriginal) => {
  const real = await importOriginal<typeof positions>();
  return {
    ...real,
    positionTrades: (...args: Parameters<typeof real.positionTrades>) => {
      const began = performance.now();
      try {
        return real.positionTrades(...args);
      } finally {
        split.tight += performance.now() - began;
        split.tightCalls += 1;
      }
    },
  };
});

const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const OUT = process.env.JOB_TIMES_OUT ?? '.maestro/playbooks/Working/w22/job-times.json';
/** A pass clock no run reaches (`advisor-golden.test.ts`): nothing is cut, so the counts are the machine's own. */
const NO_CLOCK = 1_000_000_000;

type Pass = 'generate' | 'upgrades' | 'captains' | 'other';

/** What a plan job was handed, before it runs. */
interface PlanFeatures {
  /** Troop and hired unit types on offer, hired = a unit with a stock (`caps`). */
  unitTypes: number;
  hiredTypes: number;
  hiredStock: number;
  leadership: number;
  authority: number;
  dominance: number;
  /** `marchTarget`: the horizon, in marches. */
  horizon: number | null;
  silverBudget: number | null;
  flags: string[];
}

interface JobRow {
  pass: Pass;
  index: number;
  kind: 'plan' | 'positions' | 'baseline' | 'probe' | 'probe-read' | 'captains';
  probe: string;
  family: string | null;
  ms: number;
  planMs: number;
  planCalls: number;
  tightMs: number;
  tightCalls: number;
  inputs: {
    plan: PlanFeatures | null;
    /** Stops of the baseline bar the probe is read against, or the bar `shown` hands a second call. */
    barStops: number | null;
    reading: string | null;
    reread: boolean;
    /** The probe's unit list differs from the account's own (a probe that changes the troop set). */
    changesTroopSet: boolean | null;
    trios: number | null;
    captainStops: number | null;
  };
  observed: { stops: number | null; typesFielded: number | null };
}

const unitsKey = (request: StackRequest): string => request.units.map((unit) => unit.id).join(',');

function planFeatures(input: CampaignInput): PlanFeatures {
  const { request } = input;
  const stocks = Object.entries(request.caps).filter(([, cap]) => cap > 0);
  const knownFlags = ['tokenFloor', 'refuseDroppedTypes', 'sizerShape', 'hiredSaver', 'putBack'] as const;
  const flags = knownFlags.filter((flag) => (input as unknown as Record<string, unknown>)[flag] === true);
  return {
    unitTypes: request.units.length,
    hiredTypes: stocks.length,
    hiredStock: stocks.reduce((total, [, cap]) => total + cap, 0),
    leadership: request.housing.leadership,
    authority: request.housing.authority,
    dominance: request.housing.dominance,
    horizon: input.marchTarget ?? null,
    silverBudget: input.silverBudget ?? null,
    flags,
  };
}

async function jobTimes(profile: Profile): Promise<{ rows: JobRow[]; cpuMs: number }> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const rows: JobRow[] = [];
  let pass: Pass = 'generate';
  let accountUnits: string | null = null;

  const record = (
    began: number,
    kind: JobRow['kind'],
    fields: Partial<Pick<JobRow, 'probe' | 'family' | 'inputs' | 'observed'>>,
  ): void => {
    rows.push({
      pass,
      index: rows.length,
      kind,
      probe: fields.probe ?? kind,
      family: fields.family ?? null,
      ms: performance.now() - began,
      planMs: split.plan,
      planCalls: split.planCalls,
      tightMs: split.tight,
      tightCalls: split.tightCalls,
      inputs: fields.inputs ?? {
        plan: null,
        barStops: null,
        reading: null,
        reread: false,
        changesTroopSet: null,
        trios: null,
        captainStops: null,
      },
      observed: fields.observed ?? { stops: null, typesFielded: null },
    });
  };
  const start = (): number => {
    split.plan = 0;
    split.planCalls = 0;
    split.tight = 0;
    split.tightCalls = 0;
    return performance.now();
  };

  const lane = (): CalcClient => {
    const inner = { ...createInlineClient(), mode: 'worker' as const };
    return {
      ...inner,
      async plan(request, signal) {
        const began = start();
        accountUnits ??= unitsKey(request.request);
        try {
          return await inner.plan(request, signal);
        } finally {
          record(began, 'plan', {
            inputs: {
              plan: planFeatures(request),
              barStops: null,
              reading: null,
              reread: false,
              changesTroopSet: unitsKey(request.request) !== accountUnits,
              trios: null,
              captainStops: null,
            },
          });
        }
      },
      async positions(request, signal) {
        const began = start();
        try {
          return await inner.positions(request, signal);
        } finally {
          record(began, 'positions', {});
        }
      },
      async probe(request, signal) {
        const began = start();
        const against = request.against;
        const kind =
          against === undefined ? 'baseline' : request.shown === undefined ? 'probe' : 'probe-read';
        const answer = await inner.probe(request, signal);
        const fielded = new Set<string>();
        for (const stop of answer.stops)
          for (const [id, count] of Object.entries(stop.counts)) if (count > 0) fielded.add(id);
        record(began, kind, {
          probe: against?.probe.id ?? 'baseline',
          family: against?.probe.family ?? null,
          inputs: {
            plan: planFeatures(request.plan),
            barStops: against?.baseline.length ?? request.shown?.length ?? null,
            reading: request.reading ?? 'tight',
            reread: request.reread === true,
            changesTroopSet: accountUnits === null ? null : unitsKey(request.plan.request) !== accountUnits,
            trios: null,
            captainStops: null,
          },
          observed: { stops: answer.stops.length, typesFielded: fielded.size },
        });
        return answer;
      },
      async captains(request, signal) {
        const began = start();
        try {
          return await inner.captains(request, signal);
        } finally {
          record(began, 'captains', {
            inputs: {
              plan: null,
              barStops: null,
              reading: null,
              reread: false,
              changesTroopSet: null,
              trios: request.trios.length,
              captainStops: request.stops.length,
            },
          });
        }
      },
    };
  };

  const input = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const client = lane();
  const pool = createCalcPool({ size: 1, createClient: lane });
  const cpu0 = process.cpuUsage();
  try {
    // 1. generate: the plan, then the bar's Tight tables one after the other.
    const planned = await client.plan(input);
    const chosen = pickOf(planned, openingPosition(planned, null));
    const marchRequest = withMethod(request, 'elite');
    if (troopFloor(planMarch(request, chosen.counts).result) !== null)
      for (const row of planned.alternatives)
        await client.positions({ request: marchRequest, counts: row.counts });
    const headline = chosen.pick;

    pass = 'upgrades';
    const upgrades = await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });
    expect(upgrades.cut).toEqual([]);

    pass = 'captains';
    const { currentKey, trios } = captainTrios(profile, setup);
    const advice = await runCaptainAdvice(
      input,
      trios.map(({ key, totals }) => ({ key, totals })),
      currentKey,
      pool,
      { budgetMs: NO_CLOCK },
    );
    expect(advice.cut).toEqual([]);
    const lead = leadTrio(advice.best, currentKey);
    const leadCandidate = trios.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    if (leadCandidate !== undefined && leadStops !== undefined) {
      const asks: UpgradeAsk[] = captainUpgradeCandidates(profile, setup, leadCandidate).map((candidate) => ({
        id: candidate.spec.id,
        label: `${candidate.name} ${candidate.change}`,
        trios: candidate.trios.map(({ key, totals }) => ({ key, totals })),
      }));
      const upgraded = await runCaptainUpgrades(
        input,
        { key: lead, totals: leadCandidate.totals, stops: leadStops },
        asks,
        pool,
        { budgetMs: NO_CLOCK },
      );
      expect(upgraded.cut).toEqual([]);
    }

    pass = 'other';
    const { probes } = otherProbes(input, planned.silver);
    const other = await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
    expect(other.cut).toEqual([]);
    return { rows, cpuMs: (process.cpuUsage(cpu0).user + process.cpuUsage(cpu0).system) / 1000 };
  } finally {
    pool.dispose();
    client.dispose();
  }
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

describe.skipIf(!process.env.THEORY)('206 — the time of every job', () => {
  it(
    'times every job of every pass with its inputs',
    async () => {
      expect(existsSync(ACCOUNT), `the timing fixture ${ACCOUNT}`).toBe(true);
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      expect(parsed.kind).toBe('profile');
      if (parsed.kind !== 'profile') return;
      const { rows, cpuMs } = await jobTimes(parsed.payload);
      mkdirSync(path.dirname(OUT), { recursive: true });
      writeFileSync(OUT, JSON.stringify({ account: path.basename(ACCOUNT), cpuMs, rows }, null, 1));
      const ms = rows.map((row) => row.ms);
      const slowest = [...rows].sort((a, b) => b.ms - a.ms).slice(0, 10);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(
        `${rows.length} jobs, ${Math.round(cpuMs)} ms CPU, median ${median(ms).toFixed(0)} ms, longest ${Math.max(...ms).toFixed(0)} ms\n` +
          slowest
            .map(
              (row) =>
                `${row.pass} ${row.kind} ${row.probe}: ${row.ms.toFixed(0)} ms (plan ${row.planMs.toFixed(0)}, tight ${row.tightMs.toFixed(0)} in ${row.tightCalls})`,
            )
            .join('\n'),
      );
      expect(rows.length).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
