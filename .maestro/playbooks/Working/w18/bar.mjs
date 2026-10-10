/**
 * W18 P1.5 scratch: Generate's bar pricing (`priceBar`) timed in headless Chromium, on the run's one worker
 * client vs the advisor pool (6 warm workers), on one export. Prints min of RUNS and whether the tables match.
 * `node .maestro/playbooks/Working/w18/bar.mjs <export.json> [runs]`
 */
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const text = readFileSync(process.argv[2], 'utf8');
const RUNS = Number(process.argv[3] ?? 3);
const server = await createServer({ server: { port: 5197, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5197/');
await page.waitForTimeout(1500);
const out = await page.evaluate(
  async ({ text, runs }) => {
    const { parseImport } = await import('/src/share/exportImport.ts');
    const { buildPlanRequest, buildStackRequest } = await import('/src/state/derive.ts');
    const { withMethod } = await import('/src/engine/index.ts');
    const { priceBar } = await import('/src/ui/sections/march/generate.ts');
    const { createCalcClient } = await import('/src/worker/client.ts');
    const { createCalcPool } = await import('/src/worker/pool.ts');
    const profile = parseImport(text).payload;
    const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
    const client = createCalcClient();
    const plan = await client.plan(buildPlanRequest(profile, setup));
    const request = withMethod(buildStackRequest(profile, setup), 'elite');
    const pool = createCalcPool({ size: 6 });
    await pool.map([0, 1, 2, 3, 4, 5].map(() => (c) => c.positions({ request, counts: plan.alternatives[0].counts })));
    const signal = new AbortController().signal;
    const time = async (p) => {
      const walls = [];
      let tables;
      for (let i = 0; i < runs; i += 1) {
        const began = performance.now();
        tables = await priceBar(client, p, request, plan.alternatives, signal);
        walls.push(performance.now() - began);
      }
      return { walls, tables: JSON.stringify(tables) };
    };
    await time(null);
    const one = await time(null);
    const many = await time(pool);
    pool.dispose();
    client.dispose();
    return { stops: plan.alternatives.length, one: one.walls, many: many.walls, same: one.tables === many.tables };
  },
  { text, runs: RUNS },
);
await browser.close();
await server.close();
const r = (a) => a.map(Math.round).join(' · ');
console.log(`${out.stops} stops; run client min ${Math.round(Math.min(...out.one))} ms (${r(out.one)}); pool min ${Math.round(Math.min(...out.many))} ms (${r(out.many)}); tables identical: ${out.same}`);
