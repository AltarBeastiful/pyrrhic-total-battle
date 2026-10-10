/**
 * W18 Drill 03 scratch: the advisor golden's passes, timed on a real pool (module workers, real kernel) in
 * headless Chromium served by Vite's dev server. No clock (every cut asserted empty); prints each pass's wall
 * time (min of RUNS after one warm-up) and a hash of each pass's answer, so before/after can be compared.
 *
 * `node .maestro/playbooks/Working/w18/passes.mjs <export.json> [size] [runs]`
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const text = readFileSync(process.argv[2], 'utf8');
const SIZE = Number(process.argv[3] ?? 6);
const RUNS = Number(process.argv[4] ?? 2);

const server = await createServer({ server: { port: 5198, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (error) => console.error('page:', error.message));
await page.goto('http://localhost:5198/');
await page.waitForTimeout(1500);

const measured = await page.evaluate(
  async ({ text, size, runs }) => {
    const { parseImport } = await import('/src/share/exportImport.ts');
    const { buildPlanRequest } = await import('/src/state/derive.ts');
    const { genericProbes } = await import('/src/engine/probes.ts');
    const { captainTrios } = await import('/src/state/captainTrios.ts');
    const { captainUpgradeCandidates } = await import('/src/state/captainUpgrades.ts');
    const { leadTrio } = await import('/src/engine/captainUpgrades.ts');
    const { otherProbes } = await import('/src/ui/sections/march/otherSearch.ts');
    const { openingPosition, pickOf } = await import('/src/ui/sections/march/runStore.ts');
    const { runAdvisor } = await import('/src/worker/advisor.ts');
    const { runCaptainAdvice } = await import('/src/worker/captainAdvice.ts');
    const { runCaptainUpgrades } = await import('/src/worker/captainUpgrades.ts');
    const { createCalcClient } = await import('/src/worker/client.ts');
    const { createCalcPool } = await import('/src/worker/pool.ts');

    const NO_CLOCK = 1_000_000_000;
    const parsed = parseImport(text);
    const profile = parsed.payload;
    const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
    const input = buildPlanRequest(profile, setup);
    const client = createCalcClient();
    const plan = await client.plan(input);
    client.dispose();
    const headline = pickOf(plan, openingPosition(plan, null)).pick;
    const pool = createCalcPool({ size });

    const once = async () => {
      const t = {};
      const answers = {};
      let began = performance.now();
      answers.upgrades = await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });
      t.upgrades = performance.now() - began;
      began = performance.now();
      const { currentKey, trios } = captainTrios(profile, setup);
      const advice = await runCaptainAdvice(
        input,
        trios.map(({ key, totals }) => ({ key, totals })),
        currentKey,
        pool,
        { budgetMs: NO_CLOCK },
      );
      t.captainAdvice = performance.now() - began;
      const lead = leadTrio(advice.best, currentKey);
      const leadCandidate = trios.find((trio) => trio.key === lead);
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
        { budgetMs: NO_CLOCK },
      );
      t.captains = performance.now() - began;
      answers.captains = { advice, upgrades };
      began = performance.now();
      const { probes } = otherProbes(input, plan.silver);
      answers.other = await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
      t.other = performance.now() - began;
      const cuts = [answers.upgrades.cut, advice.cut, upgrades.cut, answers.other.cut].flat().length;
      return { t, answers: JSON.stringify(answers), cuts, screenCut: advice.screenCut };
    };
    await once();
    const out = [];
    for (let run = 0; run < runs; run += 1) out.push(await once());
    pool.dispose();
    return { out, cores: navigator.hardwareConcurrency };
  },
  { text, size: SIZE, runs: RUNS },
);

await browser.close();
await server.close();

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const keys = Object.keys(measured.out[0].t);
console.log(`pool size ${SIZE}, ${RUNS} runs after a warm-up, cores ${measured.cores}`);
for (const key of keys) {
  const walls = measured.out.map((run) => run.t[key]);
  console.log(`${key}: min ${Math.round(Math.min(...walls))} ms (${walls.map(Math.round).join(' · ')})`);
}
const total = measured.out.map((run) => keys.reduce((a, k) => a + run.t[k], 0));
console.log(`all passes: min ${Math.round(Math.min(...total))} ms`);
console.log(`cuts ${measured.out.map((r) => r.cuts).join(',')}, screenCut ${measured.out.map((r) => r.screenCut)}`);
console.log(`answer hash ${[...new Set(measured.out.map((r) => hash(r.answers)))].join(' ')}`);
