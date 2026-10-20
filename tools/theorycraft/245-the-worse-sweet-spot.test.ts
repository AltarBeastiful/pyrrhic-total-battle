/**
 * 245 — **why a re-planned sweet spot is worse** (follows 244): on the e2e seed, `strength:melee` moves the sweet
 * spot from 7.18M (burn 6) to 5.33M (burn 3). Prints the best repeated march at each burn level (the ladder the knee
 * is read off) for the request and for the upgraded one, with the sweet spot of each.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/245-the-worse-sweet-spot.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

describe.skipIf(!process.env.THEORY)('245 — the worse sweet spot', () => {
  it('prints the ladders', () => {
    const profile = ownerProfile();
    const scenario = [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()].find((one) =>
      one.label.includes('the e2e seed'),
    );
    if (!scenario) throw new Error('no scenario');
    const probe = genericProbes().find((one) => one.id === 'strength:melee');
    if (!probe) throw new Error('no probe');
    const out: string[] = [];
    for (const [name, request] of [
      ['baseline', scenario.request],
      ['upgraded', probe.apply(scenario.request)],
    ] as const) {
      const plan = planCampaign({
        request,
        marchTarget: HORIZON,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
        withTrade: true,
      });
      const byBurn = new Map<number, { damage: number; silver: number; seconds: number; hunters: number }>();
      for (const row of plan.trade ?? []) {
        const held = byBurn.get(row.repeat.mercLost);
        if (!held || row.repeat.damage > held.damage)
          byBurn.set(row.repeat.mercLost, {
            damage: row.repeat.damage,
            silver: row.repeat.silver,
            seconds: row.repeat.seconds,
            hunters: row.counts['epic-monster-hunter-6'] ?? 0,
          });
      }
      out.push(`== ${name}: ${String(plan.trade?.length ?? 0)} trade rows`);
      for (const [burn, v] of [...byBurn].sort((a, b) => a[0] - b[0]))
        out.push(`burn ${burn}: dmg ${v.damage} silver ${v.silver} sec ${v.seconds} hunters ${v.hunters}`);
      for (const stop of plan.alternatives)
        out.push(
          `stop ${stop.pick}: burn ${stop.repeat.mercLost} dmg ${stop.repeat.damage} silver ${stop.repeat.silver} hunters ${stop.counts['epic-monster-hunter-6'] ?? 0}`,
        );
    }
    console.log(out.join('\n'));
  }, 600_000);
});
