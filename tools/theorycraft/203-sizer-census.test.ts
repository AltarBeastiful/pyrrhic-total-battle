/**
 * 203 — **the sizer census** (W20 C0, `docs/plans/sizer-track-c.md`): before any cache or incremental walk is
 * built into `sizeStacks`, count on real data what the sizer does in one `planCampaign` and how often its inputs
 * and results repeat. Run on the **profile kernel** (compiled to a temporary file; `kernel/build/kernel.wasm`
 * stays the release build), which counts `sizerShape` calls by method, `sizePool` calls and bisection steps by
 * pool, the relaxed walk's attempts, and logs a 64-bit hash of every `sizePool` input and every `sizeStacks`
 * result (`sizerCensus`, `kernel/assembly/index.ts`). Hits = calls − distinct inputs.
 *
 * Time per phase: the wasm frames of a CPU profile (the profile kernel keeps its name section) under
 * `sizerShape`, grouped by function, over `REPEATS` plans (the same sampling as 197).
 *
 * Runs on the committed owner fixture and, when present, on the timing fixture (`PLANNER_ACCOUNT`, default
 * `pyrrhic-my-account-2026-10-07.json` at the repo root; never committed). Writes
 * `tools/theorycraft/out/203-sizer-census.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/203-sizer-census.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Session } from 'node:inspector/promises';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { setKernel, setRaiseKernel } from '../../src/engine/fast';
import { createPlanKernel } from '../../src/kernel/plan';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { ownerProfile } from '../../tests/engine/plan-scenarios';
import { loadKernelModule, loadProfileKernelModule } from '../../tests/kernel/load';

const OUT = 'tools/theorycraft/out/203-sizer-census.md';
const ACCOUNT = process.env.PLANNER_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';
const REPEATS = Number(process.env.PLANNER_REPEATS ?? 5);
const SAMPLE_US = 100;
const COUNTERS = 25;
const LOG = 1 << 17;
const LOGS = [
  'pool 0 (troops)',
  'pool 1 (authority)',
  'pool 2 (dominance)',
  'sizeStacks result',
  'relax start state',
  'sizeStacks whole input',
  'relax walk input',
];

interface Exports {
  memory: WebAssembly.Memory;
  alloc(bytes: number): number;
  sizerCensusReset(): number;
  sizerCensus(outPtr: number): number;
}

interface Census {
  c: number[];
  logs: BigUint64Array[];
}

const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (part: number, whole: number): string => (whole > 0 ? `${f((100 * part) / whole, 1)} %` : '—');

/** Capture the exports of every instance made while the census runs; the plan makes one per bound request. */
function captureInstances(): { all: Exports[]; restore: () => void } {
  const Original = WebAssembly.Instance;
  const all: Exports[] = [];
  class Captured extends Original {
    constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports) {
      super(module, imports);
      all.push(this.exports as unknown as Exports);
    }
  }
  (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Captured;
  return {
    all,
    restore: () => {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Original;
    },
  };
}

/** The sum of every instance's counters, and each log concatenated (hashes compared across instances). */
function read(instances: readonly Exports[]): Census {
  const c = new Array<number>(COUNTERS).fill(0);
  const logs: bigint[][] = LOGS.map(() => []);
  for (const raw of instances) {
    if (typeof raw.sizerCensus !== 'function') continue;
    const at = raw.alloc(COUNTERS * 8 + LOGS.length * 4 + 8);
    const base = raw.sizerCensus(at);
    if (base === 0) continue;
    const counters = new Float64Array(raw.memory.buffer, at, COUNTERS);
    for (let i = 0; i < COUNTERS; i += 1) c[i] = (c[i] as number) + (counters[i] as number);
    const lens = new Int32Array(raw.memory.buffer, at + COUNTERS * 8, LOGS.length);
    for (let log = 0; log < LOGS.length; log += 1) {
      const view = new BigUint64Array(raw.memory.buffer, base + log * LOG * 8, lens[log] as number);
      for (const h of view) (logs[log] as bigint[]).push(h);
    }
  }
  return { c, logs: logs.map((one) => BigUint64Array.from(one)) };
}

function distinct(log: BigUint64Array): { calls: number; distinct: number; perEntry: number; max: number } {
  const uses = new Map<bigint, number>();
  for (const h of log) uses.set(h, (uses.get(h) ?? 0) + 1);
  return {
    calls: log.length,
    distinct: uses.size,
    perEntry: uses.size > 0 ? (log.length - uses.size) / uses.size : 0,
    max: uses.size > 0 ? Math.max(...uses.values()) - 1 : 0,
  };
}

interface CpuNode {
  id: number;
  callFrame: { functionName: string; url: string };
  children?: number[];
}
interface CpuProfile {
  nodes: CpuNode[];
  samples: number[];
  timeDeltas: number[];
}

/** Wasm self time by function name under a `sizerShape` frame, and the run's total sampled time (µs). */
function wasmUnderSizer(profile: CpuProfile): {
  totalUs: number;
  sizerUs: number;
  self: Map<string, number>;
} {
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  const parent = new Map<number, number>();
  for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id);
  const self = new Map<string, number>();
  let totalUs = 0;
  let sizerUs = 0;
  profile.samples.forEach((id, index) => {
    const dt = profile.timeDeltas[index] ?? 0;
    const leaf = byId.get(id);
    if (leaf === undefined || leaf.callFrame.functionName === '(idle)') return;
    const stack: CpuNode[] = [];
    for (let node: CpuNode | undefined = leaf; node !== undefined; node = byId.get(parent.get(node.id) ?? -1))
      stack.push(node);
    if (stack.some((node) => node.callFrame.url === 'node:inspector')) return;
    totalUs += dt;
    const under = stack.some((node) => /(^|[^\w])sizerShape$/.test(node.callFrame.functionName));
    if (!under) return;
    sizerUs += dt;
    const name = leaf.callFrame.url.startsWith('wasm://')
      ? `wasm ${leaf.callFrame.functionName || '(anon)'}`
      : `js ${leaf.callFrame.functionName || '(anon)'}`;
    self.set(name, (self.get(name) ?? 0) + dt);
  });
  return { totalUs, sizerUs, self };
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

async function runFixture(label: string, profile: Profile): Promise<string> {
  const input = probeSettings(profile);
  const module = loadProfileKernelModule();
  const release = loadKernelModule();
  const captured = captureInstances();
  try {
    setKernel(createPlanKernel(module));
    setRaiseKernel(createRaiseKernel(module));
    const answer = answerOf(input); // warm-up, and the reference
    // 1. one counted plan: a fresh census, every instance the plan binds read afterwards.
    for (const raw of captured.all) if (typeof raw.sizerCensusReset === 'function') raw.sizerCensusReset();
    const counted = answerOf(input);
    expect(counted, `${label}: the counted plan moved`).toBe(answer);
    const census = read(captured.all);

    // 2. CPU profile over REPEATS plans.
    const session = new Session();
    session.connect();
    await session.post('Profiler.enable');
    await session.post('Profiler.setSamplingInterval', { interval: SAMPLE_US });
    await session.post('Profiler.start');
    for (let i = 0; i < REPEATS; i += 1) expect(answerOf(input), `${label}: profiled plan`).toBe(answer);
    const { profile: cpu } = (await session.post('Profiler.stop')) as { profile: CpuProfile };
    await session.post('Profiler.disable');
    session.disconnect();
    return report(label, census, wasmUnderSizer(cpu));
  } finally {
    captured.restore();
    setKernel(createPlanKernel(release));
    setRaiseKernel(createRaiseKernel(release));
  }
}

function report(label: string, census: Census, time: ReturnType<typeof wasmUnderSizer>): string {
  const c = census.c;
  const at = (i: number): number => c[i] as number;
  const lines: string[] = [`## ${label}\n`];
  const shapes = at(0) + at(1) + at(2);
  lines.push(
    '### 1. `sizerShape` misses (calls that reach the kernel)\n',
    '| method | calls |',
    '|---|---:|',
    `| elite | ${f(at(0))} |`,
    `| ms | ${f(at(1))} |`,
    `| msRelaxed | ${f(at(2))} |`,
    `| **all** | **${f(shapes)}** (${f(at(3))} with every troop fielded) |`,
    '',
  );
  lines.push(
    '### 2. `sizePool`\n',
    '| pool | calls | on 0 slots / no capacity | bisection steps | steps per call | fixed-point breaks | ceiling shortcuts | distinct inputs | hits | hits per entry | max reuse |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  for (let pool = 0; pool < 3; pool += 1) {
    const d = distinct(census.logs[pool] as BigUint64Array);
    const calls = at(4 + pool);
    lines.push(
      `| ${LOGS[pool]} | ${f(calls)} | — | ${f(at(7 + pool))} | ${f(at(7 + pool) / Math.max(1, d.calls), 1)} | ${f(at(10 + pool))} | ${f(at(13 + pool))} | ${f(d.distinct)} | ${f(d.calls - d.distinct)} (${pct(d.calls - d.distinct, d.calls)}) | ${f(d.perEntry, 2)} | ${f(d.max)} |`,
    );
  }
  lines.push(`\n(${f(at(24))} pool calls were on an empty pool or no capacity and ran no bisection.)\n`);
  const relaxCalls = at(16);
  lines.push(
    '### 3. `relaxPreservation` (msRelaxed only)\n',
    '| figure | value |',
    '|---|---:|',
    `| walks | ${f(relaxCalls)} |`,
    `| attempts (each tries every hired slot) | ${f(at(17))} (${f(at(17) / Math.max(1, relaxCalls), 1)} per walk) |`,
    `| \`sizerScore\` calls, opening included | ${f(at(18))} (${f(at(18) / Math.max(1, relaxCalls), 1)} per walk) |`,
    `| attempts accepted | ${f(at(21))} |`,
    `| walks that accept none | ${f(at(22))} (${pct(at(22), relaxCalls)}) |`,
    `| of those, first attempt picks no candidate | ${f(at(19))} |`,
    `| of those, first attempt does not improve | ${f(at(20))} |`,
    '',
  );
  const result = distinct(census.logs[3] as BigUint64Array);
  const relax = distinct(census.logs[4] as BigUint64Array);
  const whole = distinct(census.logs[5] as BigUint64Array);
  const walk = distinct(census.logs[6] as BigUint64Array);
  lines.push(
    '### 4. Results and start states\n',
    '| log | entries | distinct | repeats | hits per entry |',
    '|---|---:|---:|---:|---:|',
    `| \`sizeStacks\` result (rows + counts) | ${f(result.calls)} | ${f(result.distinct)} | ${f(result.calls - result.distinct)} (${pct(result.calls - result.distinct, result.calls)}) | ${f(result.perEntry, 2)} |`,
    `| relax start state (the \`ms\` answer) | ${f(relax.calls)} | ${f(relax.distinct)} | ${f(relax.calls - relax.distinct)} (${pct(relax.calls - relax.distinct, relax.calls)}) | ${f(relax.perEntry, 2)} |`,
    `| **\`sizeStacks\` whole input** (rows, caps, housing, flags) | ${f(whole.calls)} | ${f(whole.distinct)} | ${f(whole.calls - whole.distinct)} (${pct(whole.calls - whole.distinct, whole.calls)}) | ${f(whole.perEntry, 2)} |`,
    `| **relax walk input** (start state, caps, housing, step) | ${f(walk.calls)} | ${f(walk.distinct)} | ${f(walk.calls - walk.distinct)} (${pct(walk.calls - walk.distinct, walk.calls)}) | ${f(walk.perEntry, 2)} |`,
    '',
  );
  lines.push(
    `### 5. Where the time goes under \`sizerShape\` (${f(REPEATS)} plans, ${f(SAMPLE_US)} µs sampling)\n`,
    `Under \`sizerShape\`: ${f(time.sizerUs / 1000, 1)} ms of ${f(time.totalUs / 1000, 1)} ms sampled (${pct(time.sizerUs, time.totalUs)}).\n`,
    '| self frame | ms | share of sizerShape | share of planner |',
    '|---|---:|---:|---:|',
  );
  for (const [name, us] of [...time.self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14))
    lines.push(`| ${name} | ${f(us / 1000, 1)} | ${pct(us, time.sizerUs)} | ${pct(us, time.totalUs)} |`);
  lines.push('');
  return lines.join('\n');
}

function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('203 — the sizer census', () => {
  it(
    'counts the sizer on the owner fixture and the timing fixture',
    async () => {
      const owner = ownerProfile();
      expect(owner, 'the committed owner fixture').not.toBeNull();
      const sections: string[] = [];
      if (owner !== null)
        sections.push(await runFixture('Exactness fixture (owner export 2026-09-17)', owner));
      const account = accountProfile();
      if (account !== null)
        sections.push(await runFixture(`Timing fixture (\`${ACCOUNT}\`, not committed)`, account));
      const out = [
        '# 203 — the sizer census\n',
        `W20 C0 (\`docs/plans/sizer-track-c.md\`). Run ${new Date().toISOString().slice(0, 10)}, node ${process.version}: one counted \`planCampaign\` per fixture (probes' settings, no clock) on the profile kernel, then ${String(REPEATS)} plans under the CPU profiler. Hits = calls − distinct inputs (a 64-bit FNV-style hash of the slots' HP, cost, cap, the capacity and the ceiling, bit for bit). The log holds ${f(LOG)} hashes per instance.\n`,
        account === null ? `The timing fixture \`${ACCOUNT}\` is absent: one fixture only.\n` : '',
        ...sections,
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
    },
    30 * 60_000,
  );
});
