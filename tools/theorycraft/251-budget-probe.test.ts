/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { buildPlanRequest } from '../../src/state/derive';
import { heroRoster } from '../../src/state/heroRoster';
import type { Profile } from '../../src/state/schema';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { createInlineClient } from '../../src/worker/client';
import { runHeroReport } from '../../src/worker/heroReport';
import { createCalcPool } from '../../src/worker/pool';

describe.skipIf(!process.env.THEORY)('251 budget probe', () => {
  it('real budget', async () => {
    const parsed = parseImport(readFileSync('pyrrhic-my-account-2026-10-11.json', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups[0]!;
    const pool = createCalcPool({ size: 1, createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }) });
    const input = buildPlanRequest(profile, setup);
    const { currentKey, lineups } = captainLineups(profile, setup);
    const advice = await runCaptainAdvice(input, lineups.map(({ key, totals }) => ({ key, totals })), currentKey, pool, {});
    const lead = leadLineup(advice.best, currentKey);
    const cand = lineups.find((l) => l.key === lead)!;
    const began = performance.now();
    const report = await runHeroReport(input, { key: lead, totals: cand.totals, stops: advice.plans[lead]! }, heroRoster(profile, setup), pool, {});
    console.log('SECONDS', (performance.now() - began) / 1000, 'rows', report.worth.solo.length, report.worth.trio.length, 'plan', report.plan.solo.length, report.plan.trio.length, 'skipped', JSON.stringify(report.skipped));
  }, 300_000);
});
