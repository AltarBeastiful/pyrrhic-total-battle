/**
 * 205 — **the rating census** (W22 SPEED-01, `docs/plans/next-speed.md`): how much of a Tight rating repeats the
 * work just before it. It sizes SPEED-02's two steps (rating without a second kill order; the recovery bill
 * walked from the previous call's stacks).
 *
 * The run is 196's own: Generate's plan and its bar's Tight tables, then the advisor's three passes, in-process on
 * one inline lane with no clock, on the **profile kernel** (a temporary file; `kernel/build/kernel.wasm` stays
 * the release build), whose census now also counts, per `raise()`:
 *
 *  - `raiseScore` calls (`battles`) and `raiseRating` calls (`ratings`);
 *  - ratings that ask for the same counts, bit for bit, as the `raiseScore` just before them;
 *  - the types that changed between consecutive ratings (0, 1, 2, 3 or more);
 *  - the stacks `recoveryOf` bills, and those whose type had the same count in the previous call.
 *
 * Runs on the committed owner fixture and, when present, on the timing account (`PYRRHIC_TIMING_FIXTURE`, default
 * `pyrrhic-my-account-2026-10-11.json` at the repo root; never committed). Writes
 * `tools/theorycraft/out/205-the-rating-census.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/205-the-rating-census.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planMarch, withMethod } from '../../src/engine';
import { leadTrio } from '../../src/engine/captainUpgrades';
import {
  setKernel,
  setRaiseKernel,
  type RaiseAnswer,
  type RaiseCensus,
  type RaiseInput,
} from '../../src/engine/fast';
import { genericProbes } from '../../src/engine/probes';
import { createPlanKernel } from '../../src/kernel/plan';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainTrios } from '../../src/state/captainTrios';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import { raiseCode } from '../../src/ui/sections/march/positions';
import { troopFloor } from '../../src/ui/sections/march/raise';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { ownerProfile } from '../../tests/engine/plan-scenarios';
import { loadKernelModule, loadProfileKernelModule } from '../../tests/kernel/load';

const OUT = 'tools/theorycraft/out/205-the-rating-census.md';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
/** A pass clock no run reaches (`advisor-golden.test.ts`): nothing is cut, so the counts are the machine's own. */
const NO_CLOCK = 1_000_000_000;
const TIGHT = raiseCode('tight');

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (part: number, whole: number): string => (whole > 0 ? `${f((100 * part) / whole, 1)} %` : '—');

/** One run's Tight raise searches, each with the profile kernel's census. */
async function tightCensuses(profile: Profile): Promise<RaiseCensus[]> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const module = loadProfileKernelModule();
  const raise = createRaiseKernel(module);
  const calls: RaiseCensus[] = [];
  setKernel(createPlanKernel(module));
  setRaiseKernel({
    position(input: RaiseInput): RaiseAnswer | null {
      const answer = raise.position(input);
      if (answer?.census !== undefined && input.modes.authority === TIGHT) calls.push(answer.census);
      return answer;
    },
  });
  const client = { ...createInlineClient(), mode: 'worker' as const };
  const pool = createCalcPool({
    size: 1,
    createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
  });
  const input = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  try {
    const planned = await client.plan(input);
    const chosen = pickOf(planned, openingPosition(planned, null));
    const marchRequest = withMethod(request, 'elite');
    if (troopFloor(planMarch(request, chosen.counts).result) !== null) {
      for (const row of planned.alternatives)
        await client.positions({ request: marchRequest, counts: row.counts });
    }
    const headline = chosen.pick;
    const upgrades = await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });
    expect(upgrades.cut).toEqual([]);
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
    const { probes } = otherProbes(input, planned.silver);
    const other = await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
    expect(other.cut).toEqual([]);
    return calls;
  } finally {
    pool.dispose();
    client.dispose();
    const release = loadKernelModule();
    setKernel(createPlanKernel(release));
    setRaiseKernel(createRaiseKernel(release));
  }
}

function report(label: string, calls: readonly RaiseCensus[]): string {
  const total = (pick: (c: RaiseCensus) => number): number => sum(calls.map(pick));
  const battles = total((c) => c.battles);
  const ratings = total((c) => c.ratings);
  const onHit = total((c) => c.ratingsOnHit);
  const same = total((c) => c.ratingsSameAsScore);
  const moved = [0, 1, 2, 3].map((i) => total((c) => c.ratingsMoved[i] as number));
  const consecutive = sum(moved);
  const stacks = total((c) => c.recoveryStacks);
  const stacksSame = total((c) => c.recoveryStacksSame);
  const missRatings = ratings - onHit;
  const n = Math.max(1, calls.length);
  return [
    `## ${label}\n`,
    `${f(calls.length)} Tight raise searches.\n`,
    '| | total | per Tight raise |',
    '|---|---:|---:|',
    `| \`raiseScore\` calls (battles, the plan's own included) | ${f(battles)} | ${f(battles / n, 1)} |`,
    `| \`raiseRating\` calls | ${f(ratings)} | ${f(ratings / n, 1)} |`,
    `| of which on a memo hit (no battle just before) | ${f(onHit)} | ${f(onHit / n, 1)} |`,
    `| ratings asking for the same counts as the \`raiseScore\` just before | ${f(same)} | ${f(same / n, 1)} |`,
    `| — as a share of all ratings | ${pct(same, ratings)} | |`,
    `| — as a share of ratings that follow a battle (misses) | ${pct(same, missRatings)} | |`,
    '',
    '### Types changed between consecutive ratings\n',
    '| changed | ratings | share |',
    '|---|---:|---:|',
    ...['0', '1', '2', '3+'].map(
      (name, i) => `| ${name} | ${f(moved[i] as number)} | ${pct(moved[i] as number, consecutive)} |`,
    ),
    `| (first rating of a search, no predecessor) | ${f(ratings - consecutive)} | |`,
    '',
    '### `recoveryOf`\n',
    `${f(stacks)} stacks billed over all calls (the plan's own bill included); **${f(stacksSame)}** (${pct(stacksSame, stacks)}) had the same count of their type in the previous call of the same search.\n`,
  ].join('\n');
}

function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('205 — the rating census', () => {
  it(
    "counts the rating's kill orders and bills by what repeats",
    async () => {
      const sections: string[] = [];
      const owner = ownerProfile();
      expect(owner, 'the committed owner fixture').not.toBeNull();
      if (owner !== null)
        sections.push(report('Exactness fixture (owner export 2026-09-17)', await tightCensuses(owner)));
      const account = accountProfile();
      if (account !== null)
        sections.push(report(`Timing fixture (\`${ACCOUNT}\`, not committed)`, await tightCensuses(account)));
      const out = [
        '# 205 — the rating census\n',
        `W22 SPEED-01. Run ${new Date().toISOString().slice(0, 10)}: Generate + the advisor's passes, in-process on the profile kernel; sizes SPEED-02.\n`,
        account === null ? `The timing fixture \`${ACCOUNT}\` is absent: one fixture only.\n` : '',
        ...sections,
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      expect(sections.length).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
