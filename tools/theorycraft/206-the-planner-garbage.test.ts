/**
 * 206 — **where the planner allocates** (W22 step 4, `docs/plans/next-speed.md` §1): experiment 197 measures 368 MiB
 * allocated per plan and the GC at ~12 % of the planner. This census lists the sampled heap profile's top 15
 * allocation sites bottom-up (the JavaScript function that allocated, and its caller), in MiB per plan, and the GC
 * pause time per plan (`PerformanceObserver`, entry type `gc`) — the figure to judge a change by, the sampled bytes
 * being too noisy for that.
 *
 * `planCampaign` alone, in-process, under the probes' settings (as 197), release kernel, on the timing fixture
 * (`PYRRHIC_TIMING_FIXTURE`, default `pyrrhic-my-account-2026-10-11.json` at the repo root, never committed).
 * The heap profile keeps the objects the minor and major GCs collected, over `HEAP_PLANS` plans; the GC pauses are
 * measured apart, unprofiled, over `GC_PLANS` plans.
 * Writes `tools/theorycraft/out/206-the-planner-garbage.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/206-the-planner-garbage.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Session } from 'node:inspector/promises';
import { PerformanceObserver } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

const OUT = 'tools/theorycraft/out/206-the-planner-garbage.md';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const HEAP_PLANS = Number(process.env.PLANNER_HEAP_PLANS ?? 3);
const GC_PLANS = Number(process.env.PLANNER_GC_PLANS ?? 5);
const HEAP_SAMPLE_BYTES = 4096;
const TOP = 15;

interface HeapNode {
  callFrame: { functionName: string; url: string; lineNumber: number };
  selfSize: number;
  children: HeapNode[];
}

const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function shortFile(url: string): string {
  const at = url.lastIndexOf('/src/');
  return at >= 0 ? url.slice(at + 5) : url.split('/').slice(-2).join('/');
}

/** `name file`, with the line only for an anonymous function (lines are the transformed module's). */
function label(callFrame: HeapNode['callFrame']): string {
  const name = callFrame.functionName || '(anonymous)';
  if (callFrame.url === '') return name;
  const file = shortFile(callFrame.url);
  return callFrame.functionName === '' ? `${name} ${file}@${String(callFrame.lineNumber + 1)}` : `${name} ${file}`;
}

/** The sites that allocate: each node's self bytes by (function, caller), the caller being the node's parent. */
function sites(head: HeapNode): { total: number; rows: { site: string; caller: string; bytes: number }[] } {
  const bytes = new Map<string, { site: string; caller: string; bytes: number }>();
  let total = 0;
  const walk = (node: HeapNode, parent: HeapNode | null): void => {
    if (node.selfSize > 0) {
      const site = label(node.callFrame);
      const caller = parent === null ? '(root)' : label(parent.callFrame);
      const key = `${site}\u0000${caller}`;
      const row = bytes.get(key) ?? { site, caller, bytes: 0 };
      row.bytes += node.selfSize;
      bytes.set(key, row);
      total += node.selfSize;
    }
    for (const child of node.children) walk(child, node);
  };
  walk(head, null);
  return { total, rows: [...bytes.values()].sort((a, b) => b.bytes - a.bytes) };
}

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

const answerOf = (input: CampaignInput): string =>
  JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('206 — the planner garbage', () => {
  it(
    'counts the planner allocation sites and its GC pauses per plan',
    async () => {
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('the timing fixture is not a profile');
      const input = probeSettings(parsed.payload);
      const answer = answerOf(input); // warm-up, and the reference answer

      // GC pauses and CPU, unprofiled.
      let gcMs = 0;
      let gcPauses = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          gcMs += entry.duration;
          gcPauses += 1;
        }
      });
      observer.observe({ entryTypes: ['gc'] });
      const cpu0 = process.cpuUsage();
      const wall0 = performance.now();
      for (let i = 0; i < GC_PLANS; i += 1) expect(answerOf(input)).toBe(answer);
      const wall = performance.now() - wall0;
      const cpuUsage = process.cpuUsage(cpu0);
      const cpu = (cpuUsage.user + cpuUsage.system) / 1000;
      await new Promise((resolve) => setTimeout(resolve, 50));
      observer.disconnect();

      // Allocation sites.
      const session = new Session();
      session.connect();
      await session.post('HeapProfiler.enable');
      await session.post('HeapProfiler.startSampling', {
        samplingInterval: HEAP_SAMPLE_BYTES,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true,
      });
      for (let i = 0; i < HEAP_PLANS; i += 1) expect(answerOf(input)).toBe(answer);
      const { profile } = (await session.post('HeapProfiler.stopSampling')) as { profile: { head: HeapNode } };
      await session.post('HeapProfiler.disable');
      session.disconnect();
      const alloc = sites(profile.head);

      const mib = (bytes: number): number => bytes / 2 ** 20 / HEAP_PLANS;
      const lines = [
        '# 206 — where the planner allocates\n',
        `W22 step 4 (\`docs/plans/next-speed.md\` §1). Run ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` alone, in-process, probes' settings (no clock), release kernel, fixture \`${ACCOUNT}\` (not committed). Sampled heap profile every ${f(HEAP_SAMPLE_BYTES / 1024)} KiB, collected objects kept, over ${String(HEAP_PLANS)} plans; GC pauses and CPU over ${String(GC_PLANS)} unprofiled plans (after one warm-up).\n`,
        '| Figure | Per plan |',
        '|---|---:|',
        `| Allocated (sampled) | ${f(mib(alloc.total), 1)} MiB |`,
        `| GC pauses | ${f(gcPauses / GC_PLANS, 1)} pauses, ${f(gcMs / GC_PLANS, 1)} ms |`,
        `| CPU | ${f(cpu / GC_PLANS)} ms |`,
        `| Wall | ${f(wall / GC_PLANS)} ms |`,
        '',
        `## Top ${String(TOP)} allocation sites (bottom-up)\n`,
        '| # | Allocating function | Caller | MiB/plan | Share |',
        '|---:|---|---|---:|---:|',
        ...alloc.rows
          .slice(0, TOP)
          .map(
            (row, index) =>
              `| ${String(index + 1)} | \`${row.site}\` | \`${row.caller}\` | ${f(mib(row.bytes), 2)} | ${f((100 * row.bytes) / alloc.total, 1)} % |`,
          ),
        '',
      ];
      const out = lines.join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      expect(alloc.total).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
