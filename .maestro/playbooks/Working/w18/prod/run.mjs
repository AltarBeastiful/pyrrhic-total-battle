/**
 * W18 Drill 04b scratch: passes.mjs on a **production** Vite build (mode production, minified, release kernel,
 * no VITE_PROFILING) served by `vite preview` on a free port, in headless Chromium, no profiler attached.
 * SPLIT=1 builds the same harness with the worker's `positionTrades` (the Tight raise), `planCampaign` and each
 * job wrapped in performance.now() (resolveId swaps, no change to src/); the split is broadcast per job.
 *
 * `node .maestro/playbooks/Working/w18/prod/run.mjs <export.json> [size] [runs]`
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import { build, preview } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../../..');
const text = readFileSync(process.argv[2], 'utf8');
const SIZE = Number(process.argv[3] ?? 6);
const RUNS = Number(process.argv[4] ?? 3);
const SPLIT = process.env.SPLIT === '1';
const outDir = path.join(here, SPLIT ? 'dist-split' : 'dist-plain');

const swaps = {
  'src/worker/jobs.ts': { '@/engine': 'engine-wrap.ts', '@/ui/sections/march/positions': 'positions-wrap.ts' },
  'src/worker/calc.worker.ts': { './jobs': 'jobs-wrap.ts' },
};
const swap = () => ({
  name: 'w18-split',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!SPLIT || !importer) return null;
    for (const [file, map] of Object.entries(swaps)) {
      // Vite's alias runs before any plugin, so '@/x' arrives here as '<repo>/src/x'.
      const key = source.startsWith(path.join(repo, 'src')) ? `@${source.slice(path.join(repo, 'src').length)}` : source;
      if (importer.endsWith(file) && map[key]) return path.join(here, map[key]);
    }
    return null;
  },
});
const config = {
  configFile: false,
  root: here,
  base: './',
  mode: 'production',
  logLevel: 'warn',
  resolve: { alias: { '@': path.join(repo, 'src') } },
  plugins: [swap()],
  worker: { format: 'es', plugins: () => [swap()] },
  build: { outDir, emptyOutDir: true, target: 'es2023', minify: true },
};
await build(config);
const server = await preview({ ...config, preview: { port: 0, host: '127.0.0.1' } });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (error) => console.error('page:', error.message));
await page.goto(url);
await page.waitForFunction(() => 'runPasses' in window);
const measured = await page.evaluate(
  ({ text, size, runs }) => window.runPasses(text, size, runs),
  { text, size: SIZE, runs: RUNS },
);
await browser.close();
await new Promise((resolve) => server.httpServer.close(resolve));

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const keys = Object.keys(measured.out[0].t);
console.log(`${SPLIT ? 'SPLIT' : 'PLAIN'} build (mode ${measured.mode}, dev ${measured.dev}), ${url}`);
console.log(`pool size ${SIZE}, ${RUNS} runs after a warm-up, cores ${measured.cores}`);
for (const key of keys) {
  const walls = measured.out.map((run) => run.t[key]);
  console.log(`${key}: min ${Math.round(Math.min(...walls))} ms (${walls.map(Math.round).join(' · ')})`);
}
const total = measured.out.map((run) => keys.filter((k) => k !== 'captainAdvice').reduce((a, k) => a + run.t[k], 0));
console.log(`all passes: min ${Math.round(Math.min(...total))} ms (${total.map(Math.round).join(' · ')})`);
console.log(`cuts ${measured.out.map((r) => r.cuts).join(',')}, screenCut ${measured.out.map((r) => r.screenCut)}`);
console.log(`answer hash ${[...new Set(measured.out.map((r) => hash(r.answers)))].join(' ')}`);
if (SPLIT) {
  const pct = (a, b) => `${((100 * a) / b).toFixed(1)} %`;
  const rows = [];
  measured.out.forEach((run, i) => {
    const all = Object.values(run.phases).flat();
    for (const [name, jobs] of [...Object.entries(run.phases), ['all', all]]) {
      const job = jobs.reduce((a, j) => a + j.ms, 0);
      const tight = jobs.reduce((a, j) => a + j.tight, 0);
      const plan = jobs.reduce((a, j) => a + j.plan, 0);
      const calls = jobs.reduce((a, j) => a + j.tightCalls, 0);
      rows.push(`run ${i + 1} ${name}: ${jobs.length} jobs, pool CPU ${Math.round(job)} ms; Tight ${Math.round(tight)} ms (${pct(tight, job)}, ${calls} calls); planCampaign ${Math.round(plan)} ms (${pct(plan, job)}); rest ${pct(job - tight - plan, job)}`);
    }
  });
  console.log(rows.join('\n'));
}
