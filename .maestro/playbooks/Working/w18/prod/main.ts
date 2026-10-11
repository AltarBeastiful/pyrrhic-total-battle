/** W18 Drill 04b scratch: passes.mjs's page body, built by Vite in production mode (see run.mjs). */
import { leadTrio } from '@/engine/captainUpgrades';
import { genericProbes } from '@/engine/probes';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import { captainTrios } from '@/state/captainTrios';
import { captainUpgradeCandidates } from '@/state/captainUpgrades';
import { otherProbes } from '@/ui/sections/march/otherSearch';
import { openingPosition, pickOf } from '@/ui/sections/march/runStore';
import { runAdvisor } from '@/worker/advisor';
import { runCaptainAdvice } from '@/worker/captainAdvice';
import { runCaptainUpgrades } from '@/worker/captainUpgrades';
import { createCalcClient } from '@/worker/client';
import { createCalcPool } from '@/worker/pool';

interface Split { kind: string; ms: number; tight: number; tightCalls: number; plan: number; planCalls: number }

let bucket: Split[] | null = null;
new BroadcastChannel('w18-split').addEventListener('message', (event: MessageEvent<Split>) => {
  bucket?.push(event.data);
});

async function runPasses(text: string, size: number, runs: number) {
  const NO_CLOCK = 1_000_000_000;
  const profile = parseImport(text).payload;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId)!;
  const input = buildPlanRequest(profile, setup);
  const client = createCalcClient();
  const plan = await client.plan(input);
  client.dispose();
  const headline = pickOf(plan, openingPosition(plan, null)).pick;
  const pool = createCalcPool({ size });
  const clock = NO_CLOCK;
  const once = async () => {
    const t: Record<string, number> = {};
    const answers: Record<string, unknown> = {};
    const phases: Record<string, Split[]> = {};
    bucket = phases.upgrades = [];
    let began = performance.now();
    answers.upgrades = await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: clock });
    t.upgrades = performance.now() - began;
    bucket = phases.captains = [];
    began = performance.now();
    const { currentKey, trios } = captainTrios(profile, setup);
    const advice = await runCaptainAdvice(input, trios.map(({ key, totals }) => ({ key, totals })), currentKey, pool, {
      budgetMs: clock,
    });
    t.captainAdvice = performance.now() - began;
    const lead = leadTrio(advice.best, currentKey);
    const leadCandidate = trios.find((trio) => trio.key === lead)!;
    const asks = captainUpgradeCandidates(profile, setup, leadCandidate).map((candidate) => ({
      id: candidate.spec.id,
      label: `${candidate.name} ${candidate.change}`,
      trios: candidate.trios.map(({ key, totals }) => ({ key, totals })),
    }));
    const upgrades = await runCaptainUpgrades(
      input,
      { key: lead, totals: leadCandidate.totals, stops: advice.plans[lead] },
      asks,
      pool,
      { budgetMs: clock },
    );
    t.captains = performance.now() - began;
    answers.captains = { advice, upgrades };
    bucket = phases.other = [];
    began = performance.now();
    const { probes } = otherProbes(input, plan.silver);
    answers.other = await runAdvisor(input, probes, pool, { headline, budgetMs: clock });
    t.other = performance.now() - began;
    // Late broadcasts of the last jobs land before the next macrotask turn.
    await new Promise((resolve) => setTimeout(resolve, 200));
    bucket = null;
    const a = answers as { upgrades: { cut: unknown[] }; other: { cut: unknown[] } };
    const cuts = [a.upgrades.cut, advice.cut, upgrades.cut, a.other.cut].flat().length;
    return { t, answers: JSON.stringify(answers), cuts, screenCut: advice.screenCut, phases };
  };
  await once();
  const out = [];
  for (let run = 0; run < runs; run += 1) out.push(await once());
  pool.dispose();
  return { out, cores: navigator.hardwareConcurrency, mode: import.meta.env.MODE, dev: import.meta.env.DEV };
}

(window as unknown as { runPasses: typeof runPasses }).runPasses = runPasses;
