/**
 * 198 — **the kernel boundary** (W18 Drill 04b, P3.0, `docs/plans/profile-drilldown.md` §3): before Drill 05
 * aims at the planner's JavaScript, does the JavaScript ↔ wasm boundary cost anything of its own? This counts
 * the boundary of one `planCampaign` under the probes' settings (`runAdvisor`'s `settingsOf`: the setup's
 * `buildPlanRequest`, no clock, no stop), in-process on one inline lane, on the account the owner profiled
 * (the timing fixture, `BOUNDARY_ACCOUNT`, default `pyrrhic-my-account-2026-10-07.json` at the repo root,
 * never committed) and on the committed owner export (the exactness fixture, `ownerProfile()`).
 *
 * Nothing in `src/` is touched. The test builds its own plan kernel (`createPlanKernel`) over the release
 * module and wraps three things around it:
 *
 *  - **the constructor**: `WebAssembly.Instance` is replaced, for the run only, by one that counts and hands
 *    back an exports object whose every function is wrapped (each raw wasm call counted, by instance and by
 *    the kernel door it was made from);
 *  - **the doors**: the `PlanKernel` and every `LadderKernel` it hands out, and the raise kernel's `position`,
 *    behind a `Proxy` that counts each call and tells the raw wrappers which door is open;
 *  - **the copies**: `%TypedArray%.prototype.set` is wrapped for the run, and every `set` whose target views a
 *    wasm memory is added, in bytes, to the open door (the table, the scorer's vector and held stock, the
 *    rung orders, the hired rows). The element-by-element loops of `src/kernel/plan.ts` cannot be watched
 *    from outside: they are counted from the raw call's own arguments, by the loop the wrapper runs (`lay`:
 *    4 + 8 bytes a stack; `marchBill`: 8 a type; the sizer: 4 + 8 a slot, + 8 a rank, 4 + 8 a stack out;
 *    `sizePool`: 24 a slot in, 8 out; the out records `march` 6, `bill` 4, `battle` 6 doubles read).
 *    The ladders' answers are read through views (`rungs`, `sheltered`, `out`, `gridView`): no copy.
 *
 * Each fixture is planned twice on one fresh kernel: **cold** (the first plan, every request bound for the
 * first time) and **warm** (the same input again on the same kernel, as a worker's second probe would find
 * it). The answers of both are checked equal to the release kernel's.
 *
 * Writes `tools/theorycraft/out/198-the-boundary.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/198-the-boundary.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import {
  planKernel,
  raiseKernel,
  setKernel,
  setRaiseKernel,
  type LadderKernel,
  type PlanKernel,
  type RaiseKernel,
} from '../../src/engine/fast';
import { H, HEADER_SIZE, TYPE_STRIDE } from '../../src/kernel/layout';
import { createPlanKernel } from '../../src/kernel/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { ownerProfile } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';

const OUT = 'tools/theorycraft/out/198-the-boundary.md';
const ACCOUNT = process.env.BOUNDARY_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';

/** One wasm instance, as the counting constructor saw it. */
interface InstanceRecord {
  id: number;
  /** `bound` once `setTable` ran on it (a request's table), else `sizer` (`sizePool`'s own). */
  kind: 'bound' | 'sizer';
  /** The pass that created it (`cold` or `warm`). */
  pass: string;
  /** The door open when it was created. */
  door: string;
  /** Raw wasm calls on it, by export. */
  calls: Map<string, number>;
  /** The packed table it holds, as a key (bound only). */
  tableKey: string | null;
}

/** One pass's counters. */
interface Tally {
  doors: Map<string, number>;
  /** Raw wasm calls, keyed `door → export`. */
  raw: Map<string, number>;
  /** Bytes JS wrote into wasm memory, by door: measured `set` copies and the modelled element loops. */
  setIn: Map<string, number>;
  loopIn: Map<string, number>;
  /** Bytes JS read out of wasm memory into its own values, by door (modelled from the loops). */
  loopOut: Map<string, number>;
  /** JS-side copies the boundary makes outside the wasm memory (the packed table of every `bindTable`). */
  packedBytes: number;
  /** Result objects the doors allocate (`march`, `bill`, `marchBill`: one; `sizeStacks`: one array + k). */
  results: number;
  /** Doors answered `null` (the engine then runs its own TypeScript, or throws). */
  declines: Map<string, number>;
  instances: InstanceRecord[];
  /** Raw `march` + `bill` calls this pass made, by instance id. */
  marchBillByInstance: Map<number, number>;
  bindRequests: Set<object>;
  bindTables: Set<string>;
}

const newTally = (): Tally => ({
  doors: new Map(),
  raw: new Map(),
  setIn: new Map(),
  loopIn: new Map(),
  loopOut: new Map(),
  packedBytes: 0,
  results: 0,
  declines: new Map(),
  instances: [],
  marchBillByInstance: new Map(),
  bindRequests: new Set(),
  bindTables: new Set(),
});

const add = (map: Map<string, number>, key: string, n = 1): void => {
  map.set(key, (map.get(key) ?? 0) + n);
};
const sum = (map: Map<unknown, number>): number => [...map.values()].reduce((a, b) => a + b, 0);
const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (part: number, whole: number): string => (whole > 0 ? `${f((100 * part) / whole, 1)} %` : '—');
const kib = (bytes: number): string => `${f(bytes / 1024, 1)} KiB`;

/**
 * The counting harness: the constructor, the typed-array copies and the doors, all pointed at `tally` while
 * `install` is in force. `uninstall` puts the platform back.
 */
function harness(module: WebAssembly.Module) {
  const RealInstance = WebAssembly.Instance;
  const typedSet = Object.getPrototypeOf(Int8Array.prototype) as { set: (...a: unknown[]) => void };
  const realSet = typedSet.set;
  /** Every wasm memory buffer seen (a grown memory has a new one). */
  const wasmBuffers = new WeakSet<ArrayBufferLike>();
  let tally = newTally();
  let pass = 'cold';
  let door = '(none)';
  let nextId = 0;

  const countingInstance = function (this: unknown, mod: WebAssembly.Module, imports?: WebAssembly.Imports) {
    const real = new RealInstance(mod, imports);
    const exports = real.exports as Record<string, unknown>;
    const memory = exports.memory as WebAssembly.Memory;
    const record: InstanceRecord = {
      id: nextId++,
      kind: 'sizer',
      pass,
      door,
      calls: new Map(),
      tableKey: null,
    };
    tally.instances.push(record);
    let types = 0;
    const wrapped: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(exports)) {
      if (typeof value !== 'function') {
        wrapped[name] = value;
        continue;
      }
      const fn = value as (...a: number[]) => number;
      wrapped[name] = (...args: number[]): number => {
        wasmBuffers.add(memory.buffer);
        add(record.calls, name);
        add(tally.raw, `${door} → ${name}`);
        if (name === 'march' || name === 'bill')
          tally.marchBillByInstance.set(record.id, (tally.marchBillByInstance.get(record.id) ?? 0) + 1);
        if (name === 'setTable') {
          const ptr = args[0] as number;
          types = new Float64Array(memory.buffer, ptr + 8 * H.types, 1)[0] as number;
          const length = HEADER_SIZE + types * TYPE_STRIDE;
          record.kind = 'bound';
          record.tableKey = new Float64Array(memory.buffer, ptr, length).join(',');
          tally.bindTables.add(record.tableKey);
        }
        const answer = fn(...args);
        wasmBuffers.add(memory.buffer);
        // The element loops of `src/kernel/plan.ts` around this call, by its own arguments.
        const n = args[0] as number;
        switch (name) {
          case 'march':
            add(tally.loopIn, door, 12 * n);
            add(tally.loopOut, door, 6 * 8);
            break;
          case 'bill':
            add(tally.loopIn, door, 12 * n);
            add(tally.loopOut, door, 4 * 8);
            break;
          case 'battle':
            add(tally.loopIn, door, 8 * types);
            add(tally.loopOut, door, 6 * 8);
            break;
          case 'sizeStacks':
            add(tally.loopIn, door, 12 * n + ((args[10] as number) !== 0 ? 8 * n : 0));
            if (answer >= 0) add(tally.loopOut, door, 12 * answer);
            break;
          case 'sizePool':
            add(tally.loopIn, door, 24 * n);
            add(tally.loopOut, door, 8 * n);
            break;
          case 'setSearchReduction':
            if ((args[0] as number) !== 0) add(tally.loopIn, door, 8 * types);
            break;
          default:
            break;
        }
        return answer;
      };
    }
    return { exports: wrapped } as unknown as WebAssembly.Instance;
  } as unknown as typeof WebAssembly.Instance;

  function countingSet(this: ArrayBufferView, source: ArrayLike<number>, offset?: number): void {
    if (wasmBuffers.has(this.buffer)) {
      const width = (this as unknown as { BYTES_PER_ELEMENT: number }).BYTES_PER_ELEMENT;
      add(tally.setIn, door, source.length * width);
    }
    realSet.call(this, source, offset);
  }

  /** Count every call of `target`'s functions under `prefix`, with the door open for the raw wrappers. */
  const doors = <T extends object>(
    target: T,
    prefix: string,
    onAnswer?: (prop: string, a: unknown) => unknown,
  ): T =>
    new Proxy(target, {
      get(obj, prop, receiver) {
        const value: unknown = Reflect.get(obj, prop, receiver);
        if (typeof value !== 'function') return value;
        const name = `${prefix}${String(prop)}`;
        return (...args: unknown[]) => {
          add(tally.doors, name);
          const outer = door;
          door = name;
          try {
            const answer = (value as (...a: unknown[]) => unknown).apply(obj, args);
            if (answer === null) add(tally.declines, name);
            return onAnswer ? onAnswer(String(prop), answer) : answer;
          } finally {
            door = outer;
          }
        };
      },
    });

  /** A fresh plan kernel over the counting constructor, its doors counted. */
  const planKernelCounted = (): PlanKernel => {
    const inner = createPlanKernel(module);
    const counted = doors(inner, '', (prop, answer) => {
      if (prop === 'march' || prop === 'bill' || prop === 'marchBill') {
        if (answer !== null) tally.results += 1;
      } else if (prop === 'sizeStacks' && Array.isArray(answer)) {
        tally.results += 1 + answer.length;
      } else if (prop === 'ladders' && answer !== null) {
        return doors(answer as LadderKernel, 'ladder.');
      }
      return answer;
    });
    // The packed table every `bindTable` builds in JS before it knows whether the request is bound already.
    return new Proxy(counted, {
      get(obj, prop, receiver) {
        const value: unknown = Reflect.get(obj, prop, receiver);
        if (prop !== 'bindTable' || typeof value !== 'function') return value;
        return (request: object, table: readonly unknown[]) => {
          tally.bindRequests.add(request);
          tally.packedBytes += 8 * (HEADER_SIZE + table.length * TYPE_STRIDE);
          return (value as (...a: unknown[]) => unknown)(request, table);
        };
      },
    });
  };

  return {
    install(): void {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = countingInstance;
      typedSet.set = countingSet as (...a: unknown[]) => void;
    },
    uninstall(): void {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = RealInstance;
      typedSet.set = realSet;
    },
    begin(name: string): void {
      pass = name;
      tally = newTally();
    },
    tally: (): Tally => tally,
    planKernelCounted,
    raiseCounted: (inner: RaiseKernel): RaiseKernel => doors(inner, 'raise.'),
  };
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

interface PassRun {
  name: string;
  tally: Tally;
  /** Instances alive before this pass (the cold pass's, for the warm one). */
  before: InstanceRecord[];
}

interface FixtureRun {
  label: string;
  passes: PassRun[];
}

function runFixture(label: string, profile: Profile, module: WebAssembly.Module): FixtureRun {
  const input = probeSettings(profile);
  const release = planKernel();
  const releaseRaise = raiseKernel();
  if (release === null || releaseRaise === null) throw new Error('the kernels are not set');
  const answer = answerOf(input);
  const h = harness(module);
  const passes: PassRun[] = [];
  h.install();
  try {
    h.begin('cold');
    const kernel = h.planKernelCounted();
    setKernel(kernel);
    setRaiseKernel(h.raiseCounted(releaseRaise));
    expect(answerOf(input), `${label}: cold plan`).toBe(answer);
    passes.push({ name: 'cold', tally: h.tally(), before: [] });
    const cold = h.tally().instances;
    h.begin('warm');
    expect(answerOf(input), `${label}: warm plan`).toBe(answer);
    passes.push({ name: 'warm', tally: h.tally(), before: cold });
  } finally {
    h.uninstall();
    setKernel(release);
    setRaiseKernel(releaseRaise);
  }
  return { label, passes };
}

/** Raw `march`/`bill` calls per instance, from the doors that run them, split by how many share the instance. */
function shareTable(instances: readonly InstanceRecord[], passCalls: Map<number, number>): string[] {
  const bound = instances.filter((one) => one.kind === 'bound');
  const used = bound.filter((one) => (passCalls.get(one.id) ?? 0) > 0);
  const single = used.filter((one) => passCalls.get(one.id) === 1);
  const calls = used.reduce((n, one) => n + (passCalls.get(one.id) ?? 0), 0);
  const singleCalls = single.length;
  const top = [...used].sort((a, b) => (passCalls.get(b.id) ?? 0) - (passCalls.get(a.id) ?? 0));
  const lines = [
    '| Figure | Value |',
    '|---|---:|',
    `| Bound instances that served a \`march\` or \`bill\` | ${f(used.length)} of ${f(bound.length)} |`,
    `| \`march\` + \`bill\` raw calls | ${f(calls)} |`,
    `| … on an instance that served two or more (a shared bound request) | ${f(calls - singleCalls)} (${pct(calls - singleCalls, calls)}) |`,
    `| … on an instance that served that one call alone (a fresh bound request) | ${f(singleCalls)} (${pct(singleCalls, calls)}) |`,
    `| Calls on the busiest instance | ${f(passCalls.get(top[0]?.id ?? -1) ?? 0)} |`,
    `| Median calls per serving instance | ${f(passCalls.get(top[Math.floor(top.length / 2)]?.id ?? -1) ?? 0)} |`,
  ];
  return lines;
}

function report(run: FixtureRun): string {
  const lines: string[] = [`## ${run.label}\n`];
  const [cold, warm] = run.passes as [PassRun, PassRun];

  lines.push('### Instances and requests per plan\n');
  lines.push(
    '| Figure | Cold plan (fresh kernel) | Warm plan (same kernel, same input) |',
    '|---|---:|---:|',
  );
  const row = (label: string, get: (p: PassRun) => string): void => {
    lines.push(`| ${label} | ${get(cold)} | ${get(warm)} |`);
  };
  row('`new WebAssembly.Instance`', (p) => f(p.tally.instances.length));
  row('… bound (one per packed request)', (p) =>
    f(p.tally.instances.filter((i) => i.kind === 'bound').length),
  );
  row("… the sizer's own (`sizePool`)", (p) => f(p.tally.instances.filter((i) => i.kind === 'sizer').length));
  row('… created inside `bindTable`', (p) =>
    f(p.tally.instances.filter((i) => i.door === 'bindTable').length),
  );
  row('… created inside `sizeStacks` (an unbound request)', (p) =>
    f(p.tally.instances.filter((i) => i.door === 'sizeStacks').length),
  );
  row('… created inside `marchBill`', (p) =>
    f(p.tally.instances.filter((i) => i.door === 'marchBill').length),
  );
  row('`bindTable` calls', (p) => f(p.tally.doors.get('bindTable') ?? 0));
  row('Distinct request objects bound', (p) => f(p.tally.bindRequests.size));
  row('Distinct packed tables (by content) in new instances', (p) => f(p.tally.bindTables.size));
  row('Instances per distinct packed table', (p) =>
    p.tally.bindTables.size > 0
      ? f(p.tally.instances.filter((i) => i.kind === 'bound').length / p.tally.bindTables.size, 2)
      : '—',
  );
  lines.push('');

  for (const pass of run.passes) {
    const t = pass.tally;
    lines.push(`### Crossings and copies by door, ${pass.name} plan\n`);
    lines.push(
      '"Raw wasm" counts the JS → wasm calls a door makes (a door may make none: `ladder.gridView` only reads views; `bindTable` makes `alloc` × 10 + `setTable` on a new instance). "In" is bytes JS wrote into wasm memory (`set` measured + element loops counted from the raw call\'s arguments); "out" is bytes JS read back into its own values.\n',
    );
    lines.push(
      '| Door | Calls | Raw wasm calls | In: `set` | In: loops | Out | Bytes per call | Declined (`null`) |',
      '|---|---:|---:|---:|---:|---:|---:|---:|',
    );
    const rawBy = new Map<string, number>();
    for (const [key, n] of t.raw) add(rawBy, key.split(' → ')[0] as string, n);
    const names = new Set([...t.doors.keys(), ...rawBy.keys(), ...t.setIn.keys()]);
    const rows = [...names].sort((a, b) => (t.doors.get(b) ?? 0) - (t.doors.get(a) ?? 0));
    for (const name of rows) {
      const calls = t.doors.get(name) ?? 0;
      const bytes = (t.setIn.get(name) ?? 0) + (t.loopIn.get(name) ?? 0) + (t.loopOut.get(name) ?? 0);
      lines.push(
        `| \`${name}\` | ${f(calls)} | ${f(rawBy.get(name) ?? 0)} | ${kib(t.setIn.get(name) ?? 0)} | ${kib(t.loopIn.get(name) ?? 0)} | ${kib(t.loopOut.get(name) ?? 0)} | ${calls > 0 ? f(bytes / calls, 1) : '—'} | ${f(t.declines.get(name) ?? 0)} |`,
      );
    }
    const totalIn = sum(t.setIn) + sum(t.loopIn);
    const totalOut = sum(t.loopOut);
    lines.push(
      `| **total** | **${f(sum(t.doors))}** | **${f(sum(t.raw))}** | **${kib(sum(t.setIn))}** | **${kib(sum(t.loopIn))}** | **${kib(totalOut)}** | | **${f(sum(t.declines))}** |`,
    );
    lines.push('');
    lines.push('| Figure | Value |', '|---|---:|');
    lines.push(`| Bytes into wasm memory per plan | ${kib(totalIn)} |`);
    lines.push(`| Bytes out of wasm memory per plan | ${kib(totalOut)} |`);
    lines.push(
      `| Packed tables built in JS by \`bindTable\` (\`packRequest\`, kept or dropped) | ${kib(t.packedBytes)} in ${f(t.doors.get('bindTable') ?? 0)} tables |`,
    );
    lines.push(
      `| Result objects the doors allocate (\`march\`/\`bill\`/\`marchBill\` records, \`sizeStacks\` arrays and stacks) | ${f(t.results)} |`,
    );
    lines.push(
      `| Raise kernel \`position\` calls (the planner never asks the raise) | ${f(t.doors.get('raise.position') ?? 0)} |`,
    );
    lines.push('');

    lines.push(`### Raw wasm calls by door and export, ${pass.name} plan\n`);
    lines.push('| Door → export | Calls |', '|---|---:|');
    for (const [key, n] of [...t.raw].sort((a, b) => b[1] - a[1])) lines.push(`| \`${key}\` | ${f(n)} |`);
    lines.push('');
  }

  lines.push('### `march` and `bill`: shared or fresh bound request\n');
  for (const pass of run.passes) {
    // Every instance this pass could reach: the cold pass's are still alive on the warm kernel.
    const reach = pass.name === 'warm' ? [...pass.before, ...pass.tally.instances] : pass.tally.instances;
    const passCalls = pass.tally.marchBillByInstance;
    lines.push(`**${pass.name} plan**\n`);
    lines.push(...shareTable(reach, passCalls));
    if (pass.name === 'warm') {
      const old = new Set(pass.before.map((one) => one.id));
      const onOld = [...passCalls].filter(([id]) => old.has(id)).reduce((n, [, c]) => n + c, 0);
      lines.push(
        `| … on an instance the cold plan bound (alive across plans) | ${f(onOld)} (${pct(onOld, sum(passCalls))}) |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('198 — the kernel boundary', () => {
  it(
    'counts the crossings, instances and copies of one plan on the profiled account and the owner fixture',
    () => {
      const module = loadKernelModule();
      const runs: FixtureRun[] = [];
      const account = accountProfile();
      if (account !== null)
        runs.push(runFixture(`Timing fixture (\`${ACCOUNT}\`, not committed)`, account, module));
      const owner = ownerProfile();
      expect(owner, 'the committed owner fixture').not.toBeNull();
      if (owner !== null) runs.push(runFixture('Exactness fixture (owner export 2026-09-17)', owner, module));

      const out = [
        '# 198 — the kernel boundary\n',
        `W18 Drill 04b, P3.0 (\`docs/plans/profile-drilldown.md\` §3). Run ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` alone, in-process, under the probes' settings (no clock), on a fresh plan kernel over the release module; the cold plan binds everything for the first time, the warm one repeats the same input on the same kernel. \`WebAssembly.Instance\`, \`%TypedArray%.prototype.set\` and the kernel doors are wrapped by the test; \`src/\` is untouched. Both plans' answers equal the release kernel's.\n`,
        account === null ? `The timing fixture \`${ACCOUNT}\` is absent: one fixture only.\n` : '',
        ...runs.map(report),
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      for (const run of runs) expect(run.passes[0]?.tally.instances.length, run.label).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
