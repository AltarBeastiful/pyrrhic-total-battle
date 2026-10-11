/**
 * **A shape nothing keeps builds no objects** (W19 P3; `ShapeScorer.row`, `keeps` and `scorerRows` in
 * `src/engine/plan.ts`).
 *
 * On every benchmark army (`commonScenarios` + `ownerScenarios`) and both fixtures (the owner's committed export
 * and, when present at the repo root, the account the owner profiled — read only), `planCampaign`'s answer
 * (every row's counts, figures and stops; the clock's `ms` aside) is the same JSON with the planner reading the
 * scorer's numbers first (`scorerRows.on`) and with it building every shape, as it did before W19.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { CampaignInput } from '@/engine/plan';
import { planCampaign, scorerRows } from '@/engine/plan';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

afterEach(() => {
  scorerRows.on = true;
});

const answerOf = (input: CampaignInput): string => {
  try {
    return JSON.stringify(planCampaign(input), (key, value: unknown) => (key === 'ms' ? undefined : value));
  } catch (error) {
    return `throws ${(error as Error).message}`;
  }
};

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

const ACCOUNT = 'pyrrhic-my-account-2026-10-07.json';
function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

const owner = ownerProfile();
const account = accountProfile();
const cases: { label: string; input: CampaignInput }[] = [
  ...[...commonScenarios(), ...(owner ? ownerScenarios(owner) : [])].map((scenario) => ({
    label: scenario.label,
    input: {
      request: scenario.request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    },
  })),
  ...(owner ? [{ label: 'exactness fixture (2026-09-17)', input: probeSettings(owner) }] : []),
  ...(account ? [{ label: 'timing fixture (2026-10-07)', input: probeSettings(account) }] : []),
];

describe('the scorer reads numbers before it builds shapes (W19 P3)', () => {
  it.each(cases)(
    '$label: the plan is the same with rows and without',
    ({ input }) => {
      scorerRows.on = false;
      const reference = answerOf(input);
      scorerRows.on = true;
      const rows = answerOf(input);
      expect(rows).toBe(reference);
    },
    300_000,
  );
});
