/**
 * 190 — **the pool's speed-up** (W17 step A, `docs/plans/progression-advisor.md` §2): the benchmark armies
 * planned through `src/worker/pool.ts` with 1, 2, 4 and 6 real module workers, in headless Chromium.
 *
 * This file is step 1, under Node: it writes each army's plan input (as the app plans it, but with **no
 * `budgetMs`**, the way the pool's jobs plan, W17 A0) and the plan Node gives for it, to `POOL_OUT`. Step 2,
 * `tools/theorycraft/pool/run.mjs`, serves the app with Vite, runs the same inputs through the pool in the
 * browser, checks every plan is the one Node gave (whatever N), and writes `out/190-the-pool.md`.
 *
 * `THEORY=1 POOL_OUT=<file> pnpm vitest run tools/theorycraft/190-the-pool.test.ts`
 * `node tools/theorycraft/pool/run.mjs <file>`
 *
 * **Answer (2026-10-08, `out/190-the-pool.md`, Ryzen 7 PRO 6850U, 16 threads).** Every plan through the pool
 * is the one Node gives, 19/19 at N = 1, 2, 4 and 6, once `retype.ms` (the re-typing's own wall-clock
 * diagnostic, the only field that differs) is set aside; none is budget-bound (no `budgetMs`). On the
 * benchmark set the pool gains ×1.57 / ×1.90 / ×2.03 at N = 2 / 4 / 6: the 20 000-dominance camp alone takes
 * 1.5 s of a 4.1 s pass, so ×2.7 is the ceiling there. On the advisor's own shape (one army planned 24
 * times, the owner's 7 000 setup) it gains ×1.76 / ×2.77 / ×3.93: 7.3 s → 1.86 s, so 29 probes and a
 * baseline fit in about 2.3 s on this machine. A cost hint (longest job first) would help the mixed set
 * only; the advisor's jobs cost about the same, so it is not built.
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, type CampaignInput } from '../../src/engine/plan';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

describe.skipIf(!process.env.THEORY)('190 — the pool, step 1: inputs and Node plans', () => {
  it('writes every benchmark army', () => {
    const out = process.env.POOL_OUT;
    expect(out).toBeTruthy();
    const profile = ownerProfile();
    const scenarios = [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()];
    const rows = scenarios.map((scenario) => {
      const input: CampaignInput = {
        request: scenario.request,
        marchTarget: HORIZON,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      const began = performance.now();
      let plan: unknown;
      try {
        plan = planCampaign(input);
      } catch (error) {
        plan = { refused: error instanceof Error ? error.message : String(error) };
      }
      return { label: scenario.label, input, plan, nodeMs: performance.now() - began };
    });
    writeFileSync(out as string, JSON.stringify(rows));
    expect(rows.length).toBeGreaterThan(0);
  }, 600_000);
});
