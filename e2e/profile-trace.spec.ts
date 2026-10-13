/**
 * **The page in production, traced** (W18 experiment 200, the "198" of Drill 06: that number went to Drill
 * 04b; `docs/plans/profile-drilldown.md` P0.2). Not a smoke test: skipped unless `PYRRHIC_TRACE=1`. It loads the
 * exactness fixture's profile, presses "Profile everything" and records a Chrome trace of the whole run through
 * CDP, with the categories the dev trace lacked (style, layout, paint), for `tools/perf-trace/analyse.py`.
 *
 * Build it as a profiling production build first, so the button is there and React is the production one:
 *
 *     VITE_PROFILING=1 pnpm build && pnpm preview --port 4173 --strictPort &
 *     PYRRHIC_TRACE=1 pnpm exec playwright test e2e/profile-trace.spec.ts
 *     python3 tools/perf-trace/analyse.py .maestro/playbooks/Working/w18/trace-prod.json.gz
 *
 * (`reuseExistingServer` keeps the running preview; without one Playwright builds without the flag and the
 * button is missing. If 4173 already serves something else, serve on another port and name it in
 * `PYRRHIC_TRACE_URL`.) `PYRRHIC_TRACE_OUT` names the `.json.gz` written, default
 * `.maestro/playbooks/Working/w18/trace-prod.json.gz`; the run's own report lands beside it as `….report.json`.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createGzip } from 'node:zlib';

import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

const FIXTURE = 'tests/fixtures/pyrrhic-my-account-2026-09-17 (2).json';
const OUT = process.env.PYRRHIC_TRACE_OUT ?? '.maestro/playbooks/Working/w18/trace-prod.json.gz';
const CATEGORIES = [
  'devtools.timeline',
  'blink.user_timing',
  'v8.execute',
  'disabled-by-default-v8.cpu_profiler',
].join(',');

test.skip(process.env.PYRRHIC_TRACE !== '1', 'experiment 200 only: set PYRRHIC_TRACE=1');
// A preview of the profiling build on another port, when 4173 already serves something else.
if (process.env.PYRRHIC_TRACE_URL !== undefined) test.use({ baseURL: process.env.PYRRHIC_TRACE_URL });

test('trace "Profile everything" on the exactness fixture', async ({ page }) => {
  test.setTimeout(300_000);
  await openApp(page);

  // The menu's "Import JSON" opens this input (as in profile.spec.ts); the fixture replaces the active profile.
  await page.setInputFiles('input[type=file]', FIXTURE);
  const preview = page.getByRole('dialog');
  await preview.getByRole('button', { name: 'Replace active' }).click();
  await expect(preview).toHaveCount(0);

  const button = page.getByRole('button', { name: 'Profile everything' });
  await expect(button).toBeVisible();
  // Let the import's own renders and saves settle before the trace starts.
  await page.waitForTimeout(2_000);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Tracing.start', {
    categories: CATEGORIES,
    transferMode: 'ReturnAsStream',
    streamFormat: 'json',
  });
  await button.click();
  await page.waitForFunction(() => 'pyrrhicProfile' in globalThis, undefined, {
    timeout: 240_000,
    polling: 250,
  });
  // The last frames after the report (the button's own re-render).
  await page.waitForTimeout(500);

  const complete = new Promise<{ stream?: string }>((resolve) => {
    cdp.once('Tracing.tracingComplete', resolve);
  });
  await cdp.send('Tracing.end');
  const { stream } = await complete;
  expect(stream).toBeDefined();

  await mkdir(path.dirname(OUT), { recursive: true });
  const gzip = createGzip();
  const written = new Promise<void>((resolve, reject) => {
    gzip.pipe(createWriteStream(OUT)).on('finish', resolve).on('error', reject);
  });
  for (;;) {
    const chunk = await cdp.send('IO.read', { handle: stream!, size: 1 << 20 });
    gzip.write(chunk.base64Encoded === true ? Buffer.from(chunk.data, 'base64') : chunk.data);
    if (chunk.eof) break;
  }
  gzip.end();
  await written;
  await cdp.send('IO.close', { handle: stream! });

  const report = await page.evaluate(
    () => (globalThis as unknown as { pyrrhicProfile: unknown }).pyrrhicProfile,
  );
  await writeFile(OUT.replace(/\.json\.gz$/, '.report.json'), JSON.stringify(report, null, 2));
});
