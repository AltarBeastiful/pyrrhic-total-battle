/**
 * **The advisor's answers, pinned before W18 moves anything** (`docs/plans/profile-drilldown.md`, the gate of
 * every phase): the work the profiling run does (`src/ui/sections/march/profileRun.ts`), on the owner's
 * export, every row of it stored in `tests/golden/advisor.json`.
 *
 *  1. **generate**: the plan for the fixture's setup and the bar's Tight tables, as `runGenerate` asks them
 *     (`client.plan`, then `client.positions` per stop on the elite request);
 *  2. **upgrades-default**: `runAdvisor` over the 29 generic probes, headlined on the opening stop;
 *  3. **captains**: `runCaptainAdvice` over every allowed trio, then `runCaptainUpgrades` against its lead trio;
 *  4. **other**: `runAdvisor` over the sweeps, next tier, merc stock, horizon and silver (`otherProbes`).
 *
 * The UI functions run these under the 20 s clock (`CAMPAIGN.budgets.extra`, and `budgets.plan` for the plan),
 * so they are called here at the worker level with **no clock**: the plan has no `budgetMs`, each pass gets a
 * clock no run reaches, and every `cut` list is asserted empty, so the answer cannot depend on machine speed.
 * Three inline lanes on one thread, in-process, so the jobs interleave (one lane, as experiment 194 runs it,
 * gives the same pin). The fixture's `upgrades` list is empty, so the profiling run's `upgrades-mine` phase has
 * nothing to ask and is not here either.
 *
 * `CAPTURE=1 pnpm vitest run tests/kernel/advisor-golden.test.ts` writes the file; without it, the test compares.
 * Skipped when the owner's export is missing.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { planMarch, withMethod } from '@/engine';
import { leadTrio } from '@/engine/captainUpgrades';
import { genericProbes } from '@/engine/probes';
import { captainTrios } from '@/state/captainTrios';
import { captainUpgradeCandidates } from '@/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';
import { otherProbes } from '@/ui/sections/march/otherSearch';
import { troopFloor } from '@/ui/sections/march/raise';
import { openingPosition, pickOf } from '@/ui/sections/march/runStore';
import { runAdvisor } from '@/worker/advisor';
import { runCaptainAdvice } from '@/worker/captainAdvice';
import { runCaptainUpgrades, type CaptainUpgradeResult, type UpgradeAsk } from '@/worker/captainUpgrades';
import { createInlineClient, type CalcClient } from '@/worker/client';
import { createCalcPool, type CalcPool } from '@/worker/pool';

import { ownerProfile } from '../engine/plan-scenarios';

import { encoded, readEncoded, stripClock, writeGolden } from './golden-io';

const CAPTURE = process.env.CAPTURE === '1';
const GOLDEN = 'advisor.json';

/** A pass clock no run reaches (a `setTimeout` takes at most 2^31 − 1 ms; `Infinity` would fire at once). */
const NO_CLOCK = 1_000_000_000;

const profile = ownerProfile();

function lane(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

async function capture(): Promise<unknown> {
  if (profile === null) throw new Error('no owner export');
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('the owner export has no active setup');
  const input = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const client = lane();
  // Three lanes on one thread: the jobs interleave, so the pin also holds the merge by probe (any order, any split).
  const pool: CalcPool = createCalcPool({ size: 3, createClient: lane });
  try {
    // 1. generate: the plan, its opening stop, and the bar's Tight tables (`runGenerate`, worker mode).
    const plan = await client.plan(input);
    const at = openingPosition(plan, null);
    const chosen = pickOf(plan, at);
    const marchRequest = withMethod(request, 'elite');
    const tables =
      troopFloor(planMarch(request, chosen.counts).result) === null
        ? null
        : await Promise.all(
            plan.alternatives.map((row) => client.positions({ request: marchRequest, counts: row.counts })),
          );
    const headline = chosen.pick;

    // 2. upgrades-default: the generic probes.
    const upgradesDefault = await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });

    // 3. captains: the trio screen, then the lead trio's next stars and levels.
    const { currentKey, trios } = captainTrios(profile, setup);
    const advice = await runCaptainAdvice(
      input,
      trios.map(({ key, totals }) => ({ key, totals })),
      currentKey,
      pool,
      { budgetMs: NO_CLOCK },
    );
    const lead = leadTrio(advice.best, currentKey);
    const leadCandidate = trios.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    let upgrades: CaptainUpgradeResult | null = null;
    if (leadCandidate !== undefined && leadStops !== undefined) {
      const asks: UpgradeAsk[] = captainUpgradeCandidates(profile, setup, leadCandidate).map((candidate) => ({
        id: candidate.spec.id,
        label: `${candidate.name} ${candidate.change}`,
        trios: candidate.trios.map(({ key, totals }) => ({ key, totals })),
      }));
      upgrades = await runCaptainUpgrades(
        input,
        { key: lead, totals: leadCandidate.totals, stops: leadStops },
        asks,
        pool,
        { budgetMs: NO_CLOCK },
      );
    }

    // 4. other: the five questions.
    const { probes, facts } = otherProbes(input, plan.silver);
    const other = await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });

    return stripClock({
      generate: { plan, at, headline, tables },
      upgradesDefault,
      captains: { advice, lead, upgrades },
      other: { ...other, facts },
    });
  } finally {
    pool.dispose();
    client.dispose();
  }
}

interface Pinned {
  upgradesDefault: { cut: unknown[]; failed: unknown[]; baseline: unknown };
  captains: {
    advice: { cut: unknown[]; failed: unknown[]; screenCut: boolean; baseline: unknown };
    upgrades: { cut: unknown[]; failed: unknown[] } | null;
  };
  other: { cut: unknown[]; failed: unknown[]; baseline: unknown };
}

describe.skipIf(profile === null)('the advisor passes on the owner fixture', () => {
  it(
    CAPTURE ? 'captures tests/golden/advisor.json' : 'matches tests/golden/advisor.json',
    async () => {
      const began = performance.now();
      const answer = await capture();
      const pinned = answer as Pinned;
      // No clock anywhere: nothing may have been cut, or the answer would be the machine's speed.
      expect(pinned.upgradesDefault.baseline).not.toBeNull();
      expect(pinned.upgradesDefault.cut).toEqual([]);
      expect(pinned.captains.advice.baseline).not.toBeNull();
      expect(pinned.captains.advice.screenCut).toBe(false);
      expect(pinned.captains.advice.cut).toEqual([]);
      expect(pinned.captains.upgrades).not.toBeNull();
      expect(pinned.captains.upgrades?.cut).toEqual([]);
      expect(pinned.other.baseline).not.toBeNull();
      expect(pinned.other.cut).toEqual([]);
      if (CAPTURE) writeGolden(GOLDEN, answer);
      else expect(encoded(answer)).toEqual(readEncoded(GOLDEN));
      // eslint-disable-next-line no-console -- the gate's own time, read into the playbook's notes
      console.log(`advisor golden: ${(performance.now() - began).toFixed(0)} ms`);
    },
    30 * 60_000,
  );
});
