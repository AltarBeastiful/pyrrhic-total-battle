/**
 * 190 step 2 (see `tools/theorycraft/190-the-pool.test.ts`): the inputs step 1 wrote, planned through the real
 * pool (`src/worker/pool.ts`, real module workers, the real kernel) in headless Chromium served by Vite's dev
 * server, at N = 1, 2, 4, 6. Every plan must be the one Node gave, whatever N. Writes `out/190-the-pool.md`.
 *
 * `node tools/theorycraft/pool/run.mjs <inputs.json>`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const rows = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const SIZES = [1, 2, 4, 6];
const RUNS = 3;

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5199/');

const measured = await page.evaluate(
  async ({ inputs, sizes, runs }) => {
    const { createCalcPool } = await import('/src/worker/pool.ts');
    const out = [];
    for (const size of sizes) {
      const pool = createCalcPool({ size });
      const jobs = inputs.map((input) => (client, signal) => client.plan(input, signal));
      // Warm-up: boot every worker's kernel and JIT on one pass, not timed.
      await pool.map(jobs);
      const walls = [];
      let plans = null;
      for (let run = 0; run < runs; run += 1) {
        const began = performance.now();
        const outcomes = await pool.map(jobs);
        walls.push(performance.now() - began);
        plans = outcomes.map((outcome) =>
          outcome.kind === 'done'
            ? JSON.stringify(outcome.value)
            : JSON.stringify({ [outcome.kind]: outcome.message ?? true }),
        );
      }
      // Each job alone, on a warm one-worker pool, for the critical path.
      const alone = [];
      if (size === 1) {
        for (const job of jobs) {
          const began = performance.now();
          await pool.map([job]);
          alone.push(performance.now() - began);
        }
      }
      pool.dispose();
      out.push({ size, walls, plans, alone });
    }
    // The advisor's shape: one army, many plans of about the same cost (its 29 probes + a baseline).
    const advisor = [];
    const same = Array.from({ length: 24 }, () => (client, signal) => client.plan(inputs[0], signal));
    for (const size of sizes) {
      const pool = createCalcPool({ size });
      await pool.map(same.slice(0, size));
      const walls = [];
      for (let run = 0; run < runs; run += 1) {
        const began = performance.now();
        await pool.map(same);
        walls.push(performance.now() - began);
      }
      pool.dispose();
      advisor.push({ size, walls });
    }
    return { out, advisor, cores: navigator.hardwareConcurrency };
  },
  { inputs: rows.map((row) => row.input), sizes: SIZES, runs: RUNS },
);

await browser.close();
await server.close();

/** A plan with its one wall-clock diagnostic (`retype.ms`, the re-typing's own timing) taken out. */
const stable = (json) => {
  const plan = JSON.parse(json);
  if (plan?.retype) delete plan.retype.ms;
  return JSON.stringify(plan);
};
const node = rows.map((row) => stable(JSON.stringify(row.plan)));
for (const m of measured.out) m.plans = m.plans.map(stable);
if (process.env.POOL_DUMP)
  writeFileSync(
    process.env.POOL_DUMP,
    JSON.stringify(measured.out.map((m) => ({ size: m.size, plans: m.plans }))),
  );
const fmt = (ms) => Math.round(ms).toLocaleString('en-US');
const one = measured.out.find((m) => m.size === 1);
const base = Math.min(...one.walls);
const longest = Math.max(...one.alone);
const sum = one.alone.reduce((a, b) => a + b, 0);
const lines = [
  '---',
  'type: experiment',
  'title: "190 — the pool\'s speed-up"',
  `created: ${new Date().toISOString().slice(0, 10)}`,
  'tags: [w17, pool, advisor]',
  'related: ["[[Progression-Advisor-Plan]]"]',
  '---',
  '',
  "# 190 — the pool's speed-up",
  '',
  `The ${rows.length} benchmark armies (as the app plans them, with no \`budgetMs\`, as pool jobs do) planned through`,
  '`src/worker/pool.ts` with real module workers and the real kernel, headless Chromium, Vite dev server.',
  `Machine: ${os.cpus().length} logical cores (\`navigator.hardwareConcurrency\` ${measured.cores}), ${os.cpus()[0]?.model ?? ''}.`,
  `Each N: one warm-up pass, then ${RUNS} timed passes. Jobs are taken in benchmark order (no cost hint).`,
  '',
  '| N | wall (min of runs) | runs | speed-up | plans identical to Node (`retype.ms` aside) |',
  '|---|---|---|---|---|',
];
for (const m of measured.out) {
  const same = m.plans.every((plan, i) => plan === node[i]);
  lines.push(
    `| ${m.size} | ${fmt(Math.min(...m.walls))} ms | ${m.walls.map(fmt).join(' · ')} | ×${(base / Math.min(...m.walls)).toFixed(2)} | ${same ? `yes, ${m.plans.length}/${m.plans.length}` : `**no**: ${m.plans.filter((p, i) => p !== node[i]).length} differ`} |`,
  );
}
lines.push(
  '',
  `Sum of each job alone (warm, one worker): ${fmt(sum)} ms; the longest job alone: ${fmt(longest)} ms` +
    ` (${rows[one.alone.indexOf(longest)].label}), so no N can finish under it: the ceiling here is ×${(sum / longest).toFixed(2)}.`,
  `Node, same inputs, single thread: ${fmt(rows.reduce((a, r) => a + r.nodeMs, 0))} ms.`,
  '',
  `## The advisor's shape: one army planned 24 times (${rows[0].label})`,
  '',
  '| N | wall (min of runs) | runs | speed-up |',
  '|---|---|---|---|',
  ...measured.advisor.map((m) => {
    const b = Math.min(...measured.advisor[0].walls);
    return `| ${m.size} | ${fmt(Math.min(...m.walls))} ms | ${m.walls.map(fmt).join(' · ')} | ×${(b / Math.min(...m.walls)).toFixed(2)} |`;
  }),
  '',
  '## Per army',
  '',
  '| army | alone in the browser | Node |',
  '|---|---|---|',
  ...rows.map((row, i) => `| ${row.label} | ${fmt(one.alone[i])} ms | ${fmt(row.nodeMs)} ms |`),
  '',
);
writeFileSync('tools/theorycraft/out/190-the-pool.md', `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
