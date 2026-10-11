/**
 * 211 — **the retype climb, counted** (W22 step 5, `docs/plans/next-speed.md` §1): per plan, how many
 * `retypeMarch` calls take the `retypeWalk` door, how many walk in JS and why, how many climb in JS, the climb
 * steps per call, and the time under each path. Needs the census patch on `src/engine/retype.ts`
 * (`.maestro/playbooks/Working/w22/211-retype-census.patch`, `git apply` it; it fills `globalThis.__retypeCensus`).
 * Timing fixture as 206. Writes `tools/theorycraft/out/211-the-retype-census.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/211-the-retype-census.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

const OUT = 'tools/theorycraft/out/211-the-retype-census.md';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const PLANS = Number(process.env.RETYPE_PLANS ?? 3);

interface Call {
  path: string;
  steps: number;
  considered: number;
  k: number;
  m: number;
  perms: number;
  tier: boolean;
  climbMs: number;
  walkMs: number;
  buildMs: number;
  battleMs: number;
  total: number;
}

const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('211 — the retype census', () => {
  it(
    'counts retypeMarch calls by path',
    () => {
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('the timing fixture is not a profile');
      const input = probeSettings(parsed.payload);
      planCampaign(input); // warm-up
      const calls: Call[] = [];
      (globalThis as unknown as { __retypeCensus: Call[] }).__retypeCensus = calls;
      const t0 = performance.now();
      for (let i = 0; i < PLANS; i += 1) planCampaign(input);
      const wall = (performance.now() - t0) / PLANS;
      const byPath = new Map<string, Call[]>();
      for (const c of calls) byPath.set(c.path, [...(byPath.get(c.path) ?? []), c]);
      const sum = (xs: Call[], g: (c: Call) => number): number => xs.reduce((a, c) => a + g(c), 0);
      const lines = [
        '# 211 — the retype climb, counted\n',
        `W22 step 5. Run ${new Date().toISOString().slice(0, 10)}: \`planCampaign\` in-process, probes' settings, release kernel, fixture \`${ACCOUNT}\`, ${String(PLANS)} plans (after a warm-up). Planner wall ${f(wall)} ms per plan. Times are summed per plan.\n`,
        '| Path | Calls/plan | Total ms/plan | % of planner | Climb steps/call | Candidates battled/call | JS climb ms/plan | Build ms/plan | Battle ms/plan | k × m (typical) |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',
      ];
      for (const [path, xs] of byPath) {
        const tot = sum(xs, (c) => c.total) / PLANS;
        lines.push(
          `| ${path} | ${f(xs.length / PLANS, 1)} | ${f(tot, 1)} | ${f((100 * tot) / wall, 1)} % | ${f(sum(xs, (c) => c.steps) / xs.length, 1)} | ${f(sum(xs, (c) => c.considered) / xs.length, 0)} | ${f(sum(xs, (c) => c.climbMs) / PLANS, 1)} | ${f(sum(xs, (c) => c.buildMs) / PLANS, 1)} | ${f(sum(xs, (c) => c.battleMs) / PLANS, 1)} | ${String(xs[0]?.k)} × ${String(xs[0]?.m)} |`,
        );
      }
      const all = sum(calls, (c) => c.total) / PLANS;
      lines.push('', `All \`retypeMarch\`: ${f(calls.length / PLANS, 1)} calls, ${f(all, 1)} ms per plan (${f((100 * all) / wall, 1)} % of the planner).`, '');
      const out = lines.join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      expect(calls.length).toBeGreaterThan(0);
    },
    30 * 60_000,
  );
});
