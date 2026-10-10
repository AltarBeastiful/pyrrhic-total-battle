/**
 * 197 — **the planner on the owner's account** (W18 Drill 05, `docs/plans/profile-drilldown.md` §0.2): in the
 * owner's trace `planCampaign` was 48 % of the pool's CPU and 60 % of that was JavaScript. This experiment
 * profiles `planCampaign` alone, in-process, under the probes' settings (`runAdvisor`'s `settingsOf`: the
 * setup's `buildPlanRequest`, no clock, no stop), on the account the owner profiled (the timing fixture,
 * `PLANNER_ACCOUNT`, default `pyrrhic-my-account-2026-10-07.json` at the repo root, never committed) and on the
 * committed owner export (the exactness fixture, `ownerProfile()`).
 *
 * Each fixture is planned in three passes, so that no measurement pays for another:
 *
 *  1. **counted** — the plan kernel wrapped in a counter (every door of `PlanKernel`, and every door of each
 *     `LadderKernel` it hands out): kernel crossings per plan, CPU per plan, and V8's GC pauses
 *     (`PerformanceObserver`, entry type `gc`);
 *  2. **CPU profile** — `node:inspector`'s sampling profiler at 100 µs over `REPEATS` plans: self and inclusive
 *     time per JS function (keyed by name, file and line), the wasm frames grouped as `(kernel wasm)`, the
 *     `js-to-wasm` / `wasm-to-js` adapters as `(wasm boundary)`, and the GC share (`(garbage collector)`);
 *  3. **allocation** — `HeapProfiler.startSampling` with the objects the minor and major GCs collected kept,
 *     over one plan: the bytes allocated (sampled, every 8 KiB) and the functions that allocate them.
 *
 * The answers of every pass are checked equal (the plan's alternatives' counts), so the wrapping moved nothing.
 * Writes `tools/theorycraft/out/197-the-planner-on-the-owner.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/197-the-planner-on-the-owner.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Session } from 'node:inspector/promises';
import { PerformanceObserver } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { planKernel, setKernel, type LadderKernel, type PlanKernel } from '../../src/engine/fast';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { ownerProfile } from '../../tests/engine/plan-scenarios';

const OUT = 'tools/theorycraft/out/197-the-planner-on-the-owner.md';
const ACCOUNT = process.env.PLANNER_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';
/** Plans under the CPU profiler, per fixture (the first, unprofiled pass warms the JIT). */
const REPEATS = Number(process.env.PLANNER_REPEATS ?? 5);
const SAMPLE_US = 100;
const HEAP_SAMPLE_BYTES = 8192;

/**
 * The frames Drill 05 names, by function name and the file that defines it (`src/...`), in the drill's order.
 * `planCampaign`'s closures are named by V8 after the `const` they are bound to.
 */
const CANDIDATES: { name: string; file: string }[] = [
  { name: 'evaluateVector', file: 'engine/plan.ts' },
  { name: 'scorer', file: 'engine/plan.ts' },
  { name: 'sizer', file: 'engine/plan.ts' },
  { name: 'sizedShape', file: 'engine/plan.ts' },
  { name: 'sizedCounts', file: 'engine/plan.ts' },
  { name: 'sizeStacks', file: 'kernel/plan.ts' },
  { name: 'sizeStacks', file: 'engine/stacker.ts' },
  { name: 'gridOnKernel', file: 'engine/plan.ts' },
  { name: 'finish', file: 'engine/plan.ts' },
  { name: 'finaleFor', file: 'engine/plan.ts' },
  { name: 'retypeRow', file: 'engine/plan.ts' },
  { name: 'build', file: 'engine/retype.ts' },
  { name: 'copyStacks', file: 'engine/plan.ts' },
  { name: 'countsKey', file: 'engine/plan.ts' },
  { name: 'prefixFielded', file: 'engine/plan.ts' },
];

const WASM = '(kernel wasm)';
const BOUNDARY = '(wasm boundary)';
const GC = '(garbage collector)';

interface CpuNode {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number };
  children?: number[];
}
interface CpuProfile {
  nodes: CpuNode[];
  samples: number[];
  timeDeltas: number[];
}
interface HeapNode {
  callFrame: { functionName: string; url: string; lineNumber: number };
  selfSize: number;
  children: HeapNode[];
}

interface Frame {
  key: string;
  name: string;
  file: string;
  selfUs: number;
  inclUs: number;
  /** Inclusive, less the samples whose leaf is the wasm, its adapters or the GC: the JavaScript under it. */
  jsUs: number;
}

interface FixtureRun {
  label: string;
  plans: number;
  answer: string;
  cpuMsPerPlan: number;
  wallMsPerPlan: number;
  gcPauses: number;
  gcMsPerPlan: number;
  crossings: Map<string, number>;
  ladders: number;
  profileUs: number;
  frames: Frame[];
  allocBytes: number;
  allocators: { key: string; bytes: number }[];
}

const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (part: number, whole: number): string => (whole > 0 ? `${f((100 * part) / whole, 2)} %` : '—');
const cpuMs = (usage: NodeJS.CpuUsage): number => (usage.user + usage.system) / 1000;

/** `src/engine/plan.ts` from a frame's url, or the url's last two segments outside `src/`. */
function shortFile(url: string): string {
  const at = url.lastIndexOf('/src/');
  if (at >= 0) return url.slice(at + 5);
  return url.split('/').slice(-2).join('/');
}

/** A frame's group: the wasm and its adapters are one each, the VM's pseudo-frames keep their name. */
function frameOf(callFrame: CpuNode['callFrame']): { key: string; name: string; file: string } {
  const name = callFrame.functionName || '(anonymous)';
  if (callFrame.url.startsWith('wasm://')) return { key: WASM, name: WASM, file: '' };
  if (/^(js-to-wasm|wasm-to-js)/.test(name)) return { key: BOUNDARY, name: BOUNDARY, file: '' };
  if (callFrame.url === '') return { key: name, name, file: '' };
  const file = shortFile(callFrame.url);
  // Lines are the vitest-transformed module's, not the source's: only an anonymous function needs one.
  if (callFrame.functionName === '')
    return { key: `${name} ${file}@${String(callFrame.lineNumber + 1)}`, name, file };
  return { key: `${name} ${file}`, name, file };
}

/**
 * Self and inclusive time by frame group; inclusive counts a group once a sample, however deep it recurses.
 * The inspector's own frames (`Profiler.start` / `stop` serialising the profile) and `(idle)` are left out:
 * what is left is the plans and the GC they cause.
 */
function tabulate(profile: CpuProfile): { totalUs: number; frames: Frame[] } {
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  const parent = new Map<number, number>();
  for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id);
  const frames = new Map<string, Frame>();
  const at = (callFrame: CpuNode['callFrame']): Frame => {
    const { key, name, file } = frameOf(callFrame);
    let frame = frames.get(key);
    if (frame === undefined) {
      frame = { key, name, file, selfUs: 0, inclUs: 0, jsUs: 0 };
      frames.set(key, frame);
    }
    return frame;
  };
  let totalUs = 0;
  profile.samples.forEach((id, index) => {
    const dt = profile.timeDeltas[index] ?? 0;
    const leaf = byId.get(id);
    if (leaf === undefined || leaf.callFrame.functionName === '(idle)') return;
    const stack: CpuNode[] = [];
    for (let node: CpuNode | undefined = leaf; node !== undefined; node = byId.get(parent.get(node.id) ?? -1))
      stack.push(node);
    if (stack.some((node) => node.callFrame.url === 'node:inspector')) return;
    totalUs += dt;
    const leafFrame = at(leaf.callFrame);
    leafFrame.selfUs += dt;
    const js = leafFrame.key !== WASM && leafFrame.key !== BOUNDARY && leafFrame.key !== GC;
    const seen = new Set<Frame>();
    for (const node of stack) {
      const frame = at(node.callFrame);
      if (seen.has(frame)) continue;
      seen.add(frame);
      frame.inclUs += dt;
      if (js) frame.jsUs += dt;
    }
  });
  return { totalUs, frames: [...frames.values()].sort((a, b) => b.selfUs - a.selfUs) };
}

/** The allocating functions of a sampling heap profile, by self bytes. */
function allocators(head: HeapNode): { total: number; rows: { key: string; bytes: number }[] } {
  const bytes = new Map<string, number>();
  let total = 0;
  const walk = (node: HeapNode): void => {
    const key = frameOf({ ...node.callFrame }).key;
    bytes.set(key, (bytes.get(key) ?? 0) + node.selfSize);
    total += node.selfSize;
    for (const child of node.children) walk(child);
  };
  walk(head);
  return { total, rows: [...bytes].map(([key, n]) => ({ key, bytes: n })).sort((a, b) => b.bytes - a.bytes) };
}

/** Every door of the plan kernel counted, and every door of each ladder kernel it hands out. */
function countingKernel(
  inner: PlanKernel,
  counts: Map<string, number>,
): { kernel: PlanKernel; ladders: () => number } {
  let ladders = 0;
  const bump = (name: string): void => {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  };
  const countLadder = (ladder: LadderKernel): LadderKernel =>
    new Proxy(ladder, {
      get(target, prop, receiver) {
        const value: unknown = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;
        return (...args: unknown[]) => {
          bump(`ladder.${String(prop)}`);
          return (value as (...a: unknown[]) => unknown).apply(target, args);
        };
      },
    });
  const kernel = new Proxy(inner, {
    get(target, prop, receiver) {
      const value: unknown = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        bump(String(prop));
        const answer = (value as (...a: unknown[]) => unknown).apply(target, args);
        if (prop === 'ladders' && answer !== null) {
          ladders += 1;
          return countLadder(answer as LadderKernel);
        }
        return answer;
      };
    },
  });
  return { kernel, ladders: () => ladders };
}

/** The plan's answer, as the advisor reads it: every alternative's counts. */
const answerOf = (input: CampaignInput): string =>
  JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));

/** The probes' settings (`runAdvisor`'s `settingsOf`): the setup's plan request, with no clock and no stop. */
function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

async function runFixture(label: string, profile: Profile): Promise<FixtureRun> {
  const input = probeSettings(profile);
  const release = planKernel();
  if (release === null) throw new Error('the plan kernel is not set');

  // 1. counted: crossings, CPU, GC pauses (after one warm-up plan, which is the reference answer).
  const answer = answerOf(input);
  const crossings = new Map<string, number>();
  const counting = countingKernel(release, crossings);
  let gcMs = 0;
  let gcPauses = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      gcMs += entry.duration;
      gcPauses += 1;
    }
  });
  observer.observe({ entryTypes: ['gc'] });
  setKernel(counting.kernel);
  const wall0 = performance.now();
  const cpu0 = process.cpuUsage();
  let counted: string;
  try {
    counted = answerOf(input);
  } finally {
    setKernel(release);
  }
  const cpu = cpuMs(process.cpuUsage(cpu0));
  const wall = performance.now() - wall0;
  // The observer delivers asynchronously: let the queue drain before reading it.
  await new Promise((resolve) => setTimeout(resolve, 50));
  observer.disconnect();
  expect(counted, `${label}: the counting kernel moved the plan`).toBe(answer);

  // 2. CPU profile over REPEATS plans.
  const session = new Session();
  session.connect();
  await session.post('Profiler.enable');
  await session.post('Profiler.setSamplingInterval', { interval: SAMPLE_US });
  await session.post('Profiler.start');
  for (let i = 0; i < REPEATS; i += 1)
    expect(answerOf(input), `${label}: profiled plan ${String(i)}`).toBe(answer);
  const { profile: cpuProfile } = (await session.post('Profiler.stop')) as { profile: CpuProfile };
  await session.post('Profiler.disable');
  const table = tabulate(cpuProfile);

  // 3. allocation over one plan, the collected objects kept.
  await session.post('HeapProfiler.enable');
  await session.post('HeapProfiler.startSampling', {
    samplingInterval: HEAP_SAMPLE_BYTES,
    includeObjectsCollectedByMajorGC: true,
    includeObjectsCollectedByMinorGC: true,
  });
  expect(answerOf(input), `${label}: allocation-sampled plan`).toBe(answer);
  const { profile: heap } = (await session.post('HeapProfiler.stopSampling')) as {
    profile: { head: HeapNode };
  };
  await session.post('HeapProfiler.disable');
  session.disconnect();
  const alloc = allocators(heap.head);

  return {
    label,
    plans: REPEATS,
    answer,
    cpuMsPerPlan: cpu,
    wallMsPerPlan: wall,
    gcPauses,
    gcMsPerPlan: gcMs,
    crossings,
    ladders: counting.ladders(),
    profileUs: table.totalUs,
    frames: table.frames,
    allocBytes: alloc.total,
    allocators: alloc.rows,
  };
}

function report(run: FixtureRun): string {
  const total = run.profileUs;
  const per = (us: number): string => f(us / 1000 / run.plans, 1);
  const lines: string[] = [];
  const crossings = [...run.crossings].sort((a, b) => b[1] - a[1]);
  const crossingTotal = crossings.reduce((sum, [, n]) => sum + n, 0);
  const wasm = run.frames.find((frame) => frame.key === WASM);
  const boundary = run.frames.find((frame) => frame.key === BOUNDARY);
  const gc = run.frames.find((frame) => frame.key === GC);
  const plan = run.frames.find((frame) => frame.name === 'planCampaign');
  lines.push(`## ${run.label}\n`);
  lines.push('| Figure | Value |', '|---|---|');
  lines.push(`| CPU per plan (counted pass, process) | ${f(run.cpuMsPerPlan)} ms |`);
  lines.push(`| Wall per plan (counted pass) | ${f(run.wallMsPerPlan)} ms |`);
  lines.push(
    `| Profiled planner time per plan (${String(run.plans)} plans at ${String(SAMPLE_US)} µs, inspector frames out) | ${per(total)} ms |`,
  );
  lines.push(`| \`planCampaign\` inclusive | ${pct(plan?.inclUs ?? 0, total)} |`);
  lines.push(
    `| JavaScript self (not wasm, boundary or GC) | ${pct(total - (wasm?.selfUs ?? 0) - (boundary?.selfUs ?? 0) - (gc?.selfUs ?? 0), total)} |`,
  );
  lines.push(`| ${WASM} self | ${pct(wasm?.selfUs ?? 0, total)} |`);
  lines.push(
    `| ${BOUNDARY} self (js-to-wasm / wasm-to-js adapters) | ${pct(boundary?.selfUs ?? 0, total)} |`,
  );
  lines.push(`| GC share (\`${GC}\` self) | ${pct(gc?.selfUs ?? 0, total)} |`);
  lines.push(
    `| GC pauses (counted pass, \`PerformanceObserver\`) | ${f(run.gcPauses)} pauses, ${f(run.gcMsPerPlan, 1)} ms, ${pct(run.gcMsPerPlan, run.cpuMsPerPlan)} of CPU |`,
  );
  lines.push(`| Kernel crossings per plan | ${f(crossingTotal)} (${f(run.ladders)} ladder kernels) |`);
  lines.push(
    `| Allocated per plan (sampled every ${String(HEAP_SAMPLE_BYTES / 1024)} KiB, collected kept) | ${f(run.allocBytes / 2 ** 20, 1)} MiB |`,
  );
  lines.push(
    `| Allocation rate (per profiled planner second) | ${f(run.allocBytes / 2 ** 20 / (total / 1e6 / run.plans), 0)} MiB/s |`,
  );
  lines.push('');

  lines.push('### Kernel crossings per plan, by door\n');
  lines.push(
    '`ladder.gridView` is a JavaScript read of views over the wasm memory (`ladderViews` rebuilds them only after the memory grew): it enters no wasm. Every other door is one JS → wasm call.\n',
  );
  lines.push('| Door | Calls | Share |', '|---|---:|---:|');
  for (const [name, n] of crossings) lines.push(`| \`${name}\` | ${f(n)} | ${pct(n, crossingTotal)} |`);
  lines.push('');

  lines.push("### Drill 05's candidates, ranked by measured self time\n");
  lines.push(
    '| Rank | Function | Self ms/plan | Self | Inclusive ms/plan | Inclusive | JS under it (inclusive less wasm and GC leaves) |',
    '|---:|---|---:|---:|---:|---:|---:|',
  );
  const candidates = CANDIDATES.map((one) => {
    const frames = run.frames.filter((frame) => frame.name === one.name && frame.file === one.file);
    return {
      label: `\`${one.name}\` (${one.file})`,
      selfUs: frames.reduce((sum, frame) => sum + frame.selfUs, 0),
      inclUs: frames.reduce((sum, frame) => Math.max(sum, frame.inclUs), 0),
      jsUs: frames.reduce((sum, frame) => Math.max(sum, frame.jsUs), 0),
      found: frames.length > 0,
    };
  }).sort((a, b) => Number(b.found) - Number(a.found) || b.selfUs - a.selfUs);
  candidates.forEach((one, index) =>
    lines.push(
      one.found
        ? `| ${String(index + 1)} | ${one.label} | ${per(one.selfUs)} | ${pct(one.selfUs, total)} | ${per(one.inclUs)} | ${pct(one.inclUs, total)} | ${pct(one.jsUs, total)} |`
        : `| — | ${one.label} | not sampled (inlined or never called) | — | — | — | — |`,
    ),
  );
  lines.push('');

  lines.push('### Top 40 frames by self time\n');
  lines.push('| Frame | Self ms/plan | Self | Inclusive |', '|---|---:|---:|---:|');
  for (const frame of run.frames.slice(0, 40))
    lines.push(
      `| \`${frame.key}\` | ${per(frame.selfUs)} | ${pct(frame.selfUs, total)} | ${pct(frame.inclUs, total)} |`,
    );
  lines.push('');

  lines.push('### Top 30 frames by inclusive time\n');
  lines.push('| Frame | Inclusive ms/plan | Inclusive | Self |', '|---|---:|---:|---:|');
  for (const frame of [...run.frames].sort((a, b) => b.inclUs - a.inclUs).slice(0, 30))
    lines.push(
      `| \`${frame.key}\` | ${per(frame.inclUs)} | ${pct(frame.inclUs, total)} | ${pct(frame.selfUs, total)} |`,
    );
  lines.push('');

  lines.push('### Top 25 allocating frames (sampled bytes, one plan)\n');
  lines.push('| Frame | MiB | Share |', '|---|---:|---:|');
  for (const row of run.allocators.slice(0, 25))
    lines.push(`| \`${row.key}\` | ${f(row.bytes / 2 ** 20, 2)} | ${pct(row.bytes, run.allocBytes)} |`);
  lines.push('');
  return lines.join('\n');
}

function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('197 — the planner on the owner', () => {
  it(
    'profiles planCampaign alone on the profiled account and the owner fixture',
    async () => {
      const runs: FixtureRun[] = [];
      const account = accountProfile();
      if (account !== null)
        runs.push(await runFixture(`Timing fixture (\`${ACCOUNT}\`, not committed)`, account));
      const owner = ownerProfile();
      expect(owner, 'the committed owner fixture').not.toBeNull();
      if (owner !== null) runs.push(await runFixture('Exactness fixture (owner export 2026-09-17)', owner));

      const out = [
        '# 197 — the planner on the owner\n',
        `W18 Drill 05 (\`docs/plans/profile-drilldown.md\` §0.2). Run ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` alone, in-process, under the probes' settings (no clock), release kernel. One warm-up plan, one counted plan (kernel doors wrapped, GC observed), ${String(REPEATS)} plans under the CPU profiler (${String(SAMPLE_US)} µs), one plan under the sampling heap profiler. Shares are of the profiled planner samples (idle and the inspector's own frames excluded; the GC the plans cause included). Inclusive time counts a frame once per sample.\n`,
        account === null ? `The timing fixture \`${ACCOUNT}\` is absent: one fixture only.\n` : '',
        ...runs.map(report),
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      for (const run of runs) expect(run.profileUs, run.label).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
