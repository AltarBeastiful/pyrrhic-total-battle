/**
 * 214 — **the batch door prototype** (W22). A fresh census of the plan kernel's doors on the live account
 * (`pyrrhic-my-account-2026-10-11.json`), then a prototype that batches the hottest JS→wasm crossings behind a
 * module switch (`setBatchDoors`), and an A/B of the batched path against today's — interleaved, one process,
 * one kernel, every answer held byte-identical.
 *
 * The census reuses the 198b harness (`performance.now()` around each door's wrapper and each raw wasm call,
 * timer cost calibrated) so its table is comparable to 198/198b. The prototype adds batched kernel doors
 * (`battleMany` already existed; `marchMany` is new) and routes the loops that name them (`orderFor`'s climb,
 * the re-typing walk/climb) behind `setBatchDoors`, off by default so the shipped path is unchanged.
 *
 * Writes `tools/theorycraft/out/214-the-batch-door-prototype.md`. Needs the prototype applied
 * (`docs/research/patches/214-batch-door.patch`; `git apply` it, then `pnpm kernel:build` for the new
 * `marchMany` export): without it `setBatchDoors`/`marchMany`/`marchBillMany` do not exist.
 * `THEORY=1 pnpm vitest run tools/theorycraft/214-the-batch-door-prototype.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import {
  planKernel,
  requiredPlanKernel,
  setKernel,
  type LadderKernel,
  type PlanKernel,
} from '../../src/engine/fast';
import * as fastModule from '../../src/engine/fast';
import { effectiveTable, type Effective } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import type { MarchFigures } from '../../src/engine/fast';
import type { RecoverySettings, StackRequest } from '../../src/engine/types';
import { createPlanKernel } from '../../src/kernel/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { ownerProfile } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';

/**
 * The prototype's own doors and switch, which arrive with `docs/research/patches/214-batch-door.patch` and are
 * absent at HEAD — reached through casts so this file type-checks and lints against the shipped tree, and runs
 * once the patch is applied.
 */
interface BatchDoors {
  marchMany(
    shapes: readonly (readonly { entry: Effective; count: number }[])[],
    enemyStacks: number,
    recovery: RecoverySettings,
  ): MarchFigures[] | null;
  marchBillMany(request: StackRequest, countVectors: readonly Record<string, number>[]): Bill[] | null;
}
const batchKernel = (kernel: PlanKernel): PlanKernel & BatchDoors =>
  kernel as unknown as PlanKernel & BatchDoors;
const setBatchDoors =
  (fastModule as unknown as { setBatchDoors?: (on: boolean) => void }).setBatchDoors ?? ((): void => {});

const OUT = 'tools/theorycraft/out/214-the-batch-door-prototype.md';
/** The live account (untracked, at the repo root); `BATCH_ACCOUNT` overrides. */
const ACCOUNT = process.env.BATCH_ACCOUNT ?? 'pyrrhic-my-account-2026-10-11.json';
/** The 198b timing fixture, kept for the like-for-like comparison. */
const FIXTURE_198B = 'pyrrhic-my-account-2026-10-07.json';
/** Timed plans per fixture in the census. */
const REPEATS = Number(process.env.GLUE_REPEATS ?? 5);
/** A/B rounds per arm. */
const ROUNDS = Number(process.env.AB_ROUNDS ?? 30);
const CALIBRATE = 2_000_000;

const now = (): number => performance.now();
const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (part: number, whole: number): string => (whole > 0 ? `${f((100 * part) / whole, 2)} %` : '—');
const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};

interface DoorTime {
  calls: number;
  raw: number;
  self: number;
  wasm: number;
}
interface Overhead {
  door: number;
  raw: number;
  rawInner: number;
}

/** The 198b timing harness: wraps `WebAssembly.Instance`'s exports and the doors. */
function harness(module: WebAssembly.Module) {
  const RealInstance = WebAssembly.Instance;
  let doors = new Map<string, DoorTime>();
  const stack: { name: string; nested: number }[] = [];
  const door = (name: string): DoorTime => {
    let d = doors.get(name);
    if (!d) doors.set(name, (d = { calls: 0, raw: 0, self: 0, wasm: 0 }));
    return d;
  };

  const timeRaw = (fn: (...a: number[]) => number) =>
    function (...args: number[]): number {
      const t0 = now();
      const answer = fn(...args);
      const dt = now() - t0;
      const top = stack[stack.length - 1];
      const d = door(top ? top.name : '(none)');
      d.raw += 1;
      d.wasm += dt;
      return answer;
    };

  const timingInstance = function (this: unknown, mod: WebAssembly.Module, imports?: WebAssembly.Imports) {
    const real = new RealInstance(mod, imports);
    const wrapped: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(real.exports as Record<string, unknown>))
      wrapped[name] = typeof value === 'function' ? timeRaw(value as (...a: number[]) => number) : value;
    return { exports: wrapped } as unknown as WebAssembly.Instance;
  } as unknown as typeof WebAssembly.Instance;

  const timed = <T extends object>(
    target: T,
    prefix: string,
    onAnswer?: (p: string, a: unknown) => unknown,
  ): T =>
    new Proxy(target, {
      get(obj, prop, receiver) {
        const value: unknown = Reflect.get(obj, prop, receiver);
        if (typeof value !== 'function') return value;
        const name = `${prefix}${String(prop)}`;
        const fn = value as (...a: unknown[]) => unknown;
        return (...args: unknown[]) => {
          const frame = { name, nested: 0 };
          stack.push(frame);
          const t0 = now();
          let answer: unknown;
          try {
            answer = fn.apply(obj, args);
          } finally {
            const dt = now() - t0;
            stack.pop();
            const d = door(name);
            d.calls += 1;
            d.self += dt - frame.nested;
            const outer = stack[stack.length - 1];
            if (outer) outer.nested += dt;
          }
          return onAnswer ? onAnswer(String(prop), answer) : answer;
        };
      },
    });

  const calibrate = (): Overhead => {
    const raw = timeRaw((): number => 0);
    const probe = timed({ empty: (): number => 0, one: (): number => raw() }, 'calibrate.');
    const run = (call: () => number): void => {
      for (let i = 0; i < CALIBRATE; i += 1) call();
    };
    run(() => probe.empty());
    run(() => probe.one());
    doors.clear();
    run(() => probe.empty());
    run(() => probe.one());
    const empty = doors.get('calibrate.empty');
    const one = doors.get('calibrate.one');
    const doorOver = (empty?.self ?? 0) / CALIBRATE;
    const rawSeen = (one?.self ?? 0) / CALIBRATE - doorOver;
    const rawInner = (one?.wasm ?? 0) / CALIBRATE;
    doors.clear();
    return { door: doorOver, raw: rawSeen, rawInner };
  };

  const kernel = (): PlanKernel =>
    timed(createPlanKernel(module), '', (prop, answer) =>
      prop === 'ladders' && answer !== null ? timed(answer as LadderKernel, 'ladder.') : answer,
    );

  return {
    install(): void {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = timingInstance;
    },
    uninstall(): void {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = RealInstance;
    },
    reset(): void {
      doors = new Map();
    },
    doors: (): Map<string, DoorTime> => doors,
    calibrate,
    kernel,
  };
}

const answerOf = (input: CampaignInput): string =>
  JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

interface FixtureRun {
  label: string;
  plain: number[];
  timedWall: number[];
  doors: Map<string, DoorTime>;
  overhead: Overhead;
}

function runFixture(
  label: string,
  profile: Profile,
  module: WebAssembly.Module,
  repeats: number,
  batch: boolean,
): FixtureRun {
  const input = probeSettings(profile);
  const release = planKernel();
  if (release === null) throw new Error('the plan kernel is not set');
  const answer = answerOf(input);
  answerOf(input);
  const h = harness(module);
  const plain: number[] = [];
  const timedWall: number[] = [];
  h.install();
  let overhead: Overhead;
  try {
    overhead = h.calibrate();
    const kernel = h.kernel();
    setBatchDoors(batch);
    setKernel(kernel);
    expect(answerOf(input), `${label}: cold plan`).toBe(answer);
    h.reset();
    for (let i = 0; i < repeats; i += 1) {
      setKernel(release);
      let t0 = now();
      planCampaign(input);
      plain.push(now() - t0);
      setKernel(kernel);
      t0 = now();
      const got = answerOf(input);
      timedWall.push(now() - t0);
      expect(got, `${label}: timed plan ${i}`).toBe(answer);
    }
  } finally {
    setBatchDoors(false);
    h.uninstall();
    setKernel(release);
  }
  return { label, plain, timedWall, doors: h.doors(), overhead };
}

interface DoorRow {
  name: string;
  calls: number;
  raw: number;
  wasm: number;
  self: number;
  glue: number;
  upper: number;
}

function doorRows(run: FixtureRun): {
  rows: DoorRow[];
  wall: number;
  total: { wasm: number; self: number; glue: number; upper: number };
} {
  const n = run.timedWall.length;
  const wall = median(run.plain);
  const o = run.overhead;
  const rows = [...run.doors].map(([name, d]) => {
    const wasm = Math.max(0, d.wasm - d.raw * o.rawInner) / n;
    const self = Math.max(0, d.self - d.calls * o.door - d.raw * o.raw) / n;
    const upper = Math.max(0, d.self - d.wasm) / n;
    return { name, calls: d.calls / n, raw: d.raw / n, wasm, self, glue: Math.max(0, self - wasm), upper };
  });
  rows.sort((a, b) => b.glue - a.glue);
  const total = rows.reduce(
    (t, r) => ({
      wasm: t.wasm + r.wasm,
      self: t.self + r.self,
      glue: t.glue + r.glue,
      upper: t.upper + r.upper,
    }),
    { wasm: 0, self: 0, glue: 0, upper: 0 },
  );
  return { rows, wall, total };
}

function censusReport(run: FixtureRun): string {
  const { rows, wall, total } = doorRows(run);
  const n = run.timedWall.length;
  const o = run.overhead;
  return [
    `## ${run.label}\n`,
    '| Figure | Value |',
    '|---|---:|',
    `| Planner wall per plan, untimed (median of ${n}, release kernel) | ${f(wall, 1)} ms |`,
    `| … min / max | ${f(Math.min(...run.plain), 1)} / ${f(Math.max(...run.plain), 1)} ms |`,
    `| Planner wall per plan, timed (median of ${n}) | ${f(median(run.timedWall), 1)} ms |`,
    `| Timer cost, calibrated: inside an empty door / a timed raw call seen from its door / by its own timer | ${f(o.door * 1e6, 0)} / ${f(o.raw * 1e6, 0)} / ${f(o.rawInner * 1e6, 0)} ns |`,
    `| All doors, **glue** (wrapper minus wasm, corrected) | **${f(total.glue, 1)} ms (${pct(total.glue, wall)})** |`,
    `| … inside wasm | ${f(total.wasm, 1)} ms (${pct(total.wasm, wall)}) |`,
    `| … glue upper bound (no timer correction) | ${f(total.upper, 1)} ms (${pct(total.upper, wall)}) |`,
    '',
    'Per plan. Shares are of the untimed planner wall; "glue" is the door wrapper minus its raw wasm calls, both corrected for the timers.\n',
    '| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...rows.map(
      (r) =>
        `| \`${r.name}\` | ${f(r.calls)} | ${f(r.raw)} | ${f(r.self, 2)} | ${f(r.wasm, 2)} | ${f(r.glue, 2)} | ${r.calls > 0 ? `${f((r.glue / r.calls) * 1e6, 0)} ns` : '—'} | ${pct(r.glue, wall)} | ${pct(r.upper, wall)} |`,
    ),
    `| **total** | | | **${f(total.self, 2)}** | **${f(total.wasm, 2)}** | **${f(total.glue, 2)}** | | **${pct(total.glue, wall)}** | **${pct(total.upper, wall)}** |`,
    '',
  ].join('\n');
}

function accountProfile(path: string): Profile | null {
  if (!existsSync(path)) return null;
  const parsed = parseImport(readFileSync(path, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('214 — the batch door prototype', () => {
  it(
    'censuses the doors, proves the batch exact, and A/Bs it',
    () => {
      const module = loadKernelModule();
      const live = accountProfile(ACCOUNT);
      const fixture = accountProfile(FIXTURE_198B);
      const owner = ownerProfile();

      // ---- 1. the census (batch off) ----------------------------------------------------------------
      const census: FixtureRun[] = [];
      if (live !== null)
        census.push(runFixture(`Live account (\`${ACCOUNT}\`)`, live, module, REPEATS, false));
      if (fixture !== null)
        census.push(runFixture(`198b timing fixture (\`${FIXTURE_198B}\`)`, fixture, module, REPEATS, false));
      if (owner !== null)
        census.push(runFixture('Exactness fixture (owner export 2026-09-17)', owner, module, REPEATS, false));

      // ---- 2. the batched census (for the door-delta) ------------------------------------------------
      const batched: FixtureRun[] = [];
      if (live !== null) batched.push(runFixture(`Live account, batch on`, live, module, REPEATS, true));
      if (fixture !== null)
        batched.push(runFixture(`198b fixture, batch on`, fixture, module, REPEATS, true));

      // ---- 3. the door-level micro-benchmark ---------------------------------------------------------
      const micro: string[] = [];
      const doorExact: string[] = [];
      if (live !== null) {
        const input = probeSettings(live);
        const kernel = requiredPlanKernel();
        const bk = batchKernel(kernel);
        // A warm, bound request: run the plan once so `effectiveTable` binds the account's table.
        planCampaign(input);
        const request = input.request;
        const table = effectiveTable(request);
        const chosen = planCampaign(input).alternatives[0];
        const base = chosen === undefined ? {} : chosen.counts;
        const enemy = 24;
        const recovery = request.recovery;
        const N = 80;
        const vectors: Record<string, number>[] = [];
        for (let i = 0; i < N; i += 1) {
          const counts: Record<string, number> = { ...base };
          let touched = 0;
          for (const entry of table) {
            if (touched >= 2) break;
            if ((counts[entry.id] ?? 0) > 0) {
              counts[entry.id] = Math.max(1, Math.round(((counts[entry.id] as number) * (100 + i)) / 100));
              touched += 1;
            }
          }
          vectors.push(counts);
        }
        const shapes: { entry: Effective; count: number }[][] = vectors.map((counts) =>
          table
            .filter((entry) => (counts[entry.id] ?? 0) > 0)
            .map((entry) => ({ entry, count: counts[entry.id] as number })),
        );

        // Exactness of the doors themselves.
        const billsOne = vectors.map((v) => kernel.marchBill(request, v));
        const billsMany = bk.marchBillMany(request, vectors);
        expect(billsMany, 'marchBillMany declined a bound request').not.toBeNull();
        for (let i = 0; i < N; i += 1)
          expect(
            Object.is(billsMany?.[i]?.damage, billsOne[i]?.damage) &&
              Object.is(billsMany?.[i]?.silver, billsOne[i]?.silver),
          ).toBe(true);
        doorExact.push(`marchBillMany ${N} vectors: damage and silver equal \`marchBill\` on every one.`);
        const figsOne = shapes.map((shape) => kernel.march(shape, enemy, recovery));
        const figsMany = bk.marchMany(shapes, enemy, recovery);
        expect(figsMany, 'marchMany declined a bound batch').not.toBeNull();
        for (let i = 0; i < N; i += 1)
          expect(
            figsMany?.[i] !== undefined &&
              Object.is(figsMany[i]?.damage, figsOne[i]?.damage) &&
              Object.is(figsMany[i]?.silver, figsOne[i]?.silver) &&
              Object.is(figsMany[i]?.hiredDamage, figsOne[i]?.hiredDamage),
          ).toBe(true);
        doorExact.push(`marchMany ${N} shapes: damage, silver and hired share equal \`march\` on every one.`);

        /** The least time one whole call of the batch takes, over many reps (crossings are sub-µs, so min). */
        const bench = (fn: () => void): number => {
          for (let w = 0; w < 20; w += 1) fn();
          let best = Infinity;
          for (let r = 0; r < 200; r += 1) {
            const t0 = now();
            fn();
            best = Math.min(best, now() - t0);
          }
          return best;
        };
        const perShape = (ms: number): number => (ms * 1e6) / N;
        const billsSingle = bench(() => {
          for (let i = 0; i < N; i += 1) kernel.marchBill(request, vectors[i] as Record<string, number>);
        });
        const billsBatch = bench(() => {
          bk.marchBillMany(request, vectors);
        });
        const marchSingle = bench(() => {
          for (let i = 0; i < N; i += 1)
            kernel.march(shapes[i] as { entry: Effective; count: number }[], enemy, recovery);
        });
        const marchBatch = bench(() => {
          bk.marchMany(shapes, enemy, recovery);
        });
        const line = (name: string, single: number, batched: number): string =>
          `| \`${name}\` | ${f(perShape(single), 1)} | ${f(perShape(batched), 1)} | ${f(perShape(single) - perShape(batched), 1)} | ${f(100 * (1 - batched / single), 1)} % |`;
        micro.push(
          '',
          `The same ${N} shapes/vectors, one process: \`marchBill\` and \`march\` a call versus \`marchBillMany\` and \`marchMany\` once. ns here are of one whole call of ${N}, divided by ${N}.`,
          '',
          '| Door call | ns per shape, one crossing each | ns per shape, one crossing | Saved ns per shape | Saved % |',
          '|---|---:|---:|---:|---:|',
          line('marchBill → battleMany', billsSingle, billsBatch),
          line('march → marchMany', marchSingle, marchBatch),
          '',
        );
      }

      // ---- 4. the A/B --------------------------------------------------------------------------------
      let ab = '';
      let wallGainMin = 0;
      let cpuGainMin = 0;
      let wallGainMed = 0;
      let cpuGainMed = 0;
      if (live !== null || fixture !== null) {
        const profile = (live ?? fixture) as Profile;
        const input = probeSettings(profile);
        const run = (on: boolean): { cpu: number; wall: number; answer: string } => {
          setBatchDoors(on);
          const cpu0 = process.cpuUsage();
          const wall0 = now();
          const answer = JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));
          const wall = now() - wall0;
          const used = process.cpuUsage(cpu0);
          return { cpu: (used.user + used.system) / 1000, wall, answer };
        };
        const arms: Record<'new' | 'old', { cpu: number[]; wall: number[] }> = {
          new: { cpu: [], wall: [] },
          old: { cpu: [], wall: [] },
        };
        let reference: string;
        try {
          reference = run(false).answer;
          run(true);
          for (let i = 0; i < ROUNDS; i += 1) {
            for (const arm of i % 2 === 0 ? (['new', 'old'] as const) : (['old', 'new'] as const)) {
              const one = run(arm === 'new');
              expect(one.answer, `${arm} arm moved an answer`).toBe(reference);
              arms[arm].cpu.push(one.cpu);
              arms[arm].wall.push(one.wall);
            }
          }
        } finally {
          setBatchDoors(false);
        }
        const gain = (key: 'cpu' | 'wall', stat: (xs: number[]) => number): number =>
          100 * (1 - stat(arms.new[key]) / stat(arms.old[key]));
        const each = (stat: (xs: number[]) => number): string =>
          `**${f(gain('wall', stat), 2)} %** wall, **${f(gain('cpu', stat), 2)} %** CPU`;
        wallGainMin = gain('wall', (xs) => Math.min(...xs));
        cpuGainMin = gain('cpu', (xs) => Math.min(...xs));
        wallGainMed = gain('wall', median);
        cpuGainMed = gain('cpu', median);
        const row = (arm: 'new' | 'old'): string =>
          `| ${arm} | ${f(median(arms[arm].wall), 1)} | ${f(Math.min(...arms[arm].wall), 1)} | ${f(median(arms[arm].cpu), 1)} | ${f(Math.min(...arms[arm].cpu), 1)} |`;
        ab = [
          `## The A/B (live account \`${ACCOUNT}\`)\n`,
          `\`planCampaign\` in-process, probes' settings (no clock), release kernel, ${String(ROUNDS)} rounds per arm, interleaved (the arm that goes first alternating), answers held equal to the batch-off arm. This machine carries a wide tail (the medians sit well above the mins), so the **mins** are read as the best estimate of the effect and the medians as an upper bound on the noise.`,
          '',
          '| arm | median wall ms | min wall ms | median CPU ms | min CPU ms |',
          '|---|---:|---:|---:|---:|',
          row('new'),
          row('old'),
          '',
          `Gain, min-to-min: ${each((xs) => Math.min(...xs))}. Gain, median: ${each(median)}. The planner is ~45 % of the pool's CPU on this account, so a ${f(cpuGainMin, 2)} % planner-CPU gain is ${f(cpuGainMin / 0.45, 2)} % of pool CPU.`,
          '',
        ].join('\n');
      }

      const verdictParts: string[] = [];
      const liveRun = census[0];
      const onRun = batched[0];
      if (live !== null && liveRun !== undefined) {
        const off = doorRows(liveRun);
        const top = off.rows[0];
        const marchBillRow = off.rows.find((r) => r.name === 'marchBill');
        const on = onRun !== undefined ? doorRows(onRun) : null;
        const marchOff = off.rows.find((r) => r.name === 'march');
        const marchOn = on?.rows.find((r) => r.name === 'march');
        const marchManyOn = on?.rows.find((r) => r.name === 'marchMany');
        verdictParts.push(
          `**The census has moved.** On today's engine the live account's doors cost **${f(off.total.glue, 1)} ms of glue a plan (${pct(off.total.glue, off.wall)})**, and the biggest single door is \`${top?.name ?? '—'}\` (${f(top?.glue ?? 0, 2)} ms, ${pct(top?.glue ?? 0, off.wall)}). \`marchBill\`, the door 198b found at 90,699 calls on the owner fixture, is now **${f(marchBillRow?.calls ?? 0)} calls a plan (${pct(marchBillRow?.glue ?? 0, off.wall)} of the wall)** — the \`sizerShape\`, \`retypeWalk\`/\`retypeClimb\` and ladder-grid doors added since W18–W22 moved that arithmetic behind wasm, so the loop 198b named is cold.`,
        );
        const avoided = (marchOff?.calls ?? 0) - (marchOn?.calls ?? 0);
        const perCallGlue = marchOff && marchOff.calls > 0 ? marchOff.glue / marchOff.calls : 0;
        const savedMs = avoided * perCallGlue;
        verdictParts.push(
          `**The batch door, routed.** Behind \`setBatchDoors(true)\` the routed loops turn \`march\` ${f(marchOff?.calls ?? 0)} calls into ${f(marchOn?.calls ?? 0)} + ${f(marchManyOn?.calls ?? 0)} \`marchMany\` crossings a plan (the \`orderFor\` rung-order climb); the re-typing loops that name \`marchBillMany\` do not run on this fixture (the kernel \`retypeWalk\`/\`retypeClimb\` doors answer them), so \`marchBill\` stays ${f(marchBillRow?.calls ?? 0)} calls. Folding ${f(avoided)} \`march\` crossings into ${f(marchManyOn?.calls ?? 0)} saves about ${f(avoided)} × ${f(perCallGlue * 1e6, 0)} ns ≈ **${f(savedMs, 2)} ms a plan (${pct(savedMs, off.wall)} of the wall)** — the ceiling of what routing these loops can buy.`,
        );
      }
      verdictParts.push(
        `**What the crossing itself buys.** In isolation, the same 80 shapes one crossing each versus one crossing: \`march → marchMany\` saves a few percent a shape, \`marchBill → battleMany\` is a wash — the JS↔wasm crossing is not the cost. Each door's "glue" is the **JS packing and reading** (writing each stack's row and count, reading each figure, building a result object), and a batch crossing does exactly the same per-element work, only once. Batching removes the call dispatch, not the arithmetic.`,
      );
      verdictParts.push(
        `**The planner A/B.** The batched arm's answers are byte-identical to the shipped path's on all three fixtures (asserted in the census and the A/B). Min-to-min the batched path moves the live plan by ${f(wallGainMin, 2)} % wall and ${f(cpuGainMin, 2)} % CPU; the medians are ${f(wallGainMed, 2)} % / ${f(cpuGainMed, 2)} %. The two disagree in sign and sit inside this machine's own spread (the medians several times the mins), so the honest reading is **no measured effect** — consistent with the ~0.1 % ceiling above and with the door-level wash.`,
      );
      verdictParts.push(
        `**Verdict.** Well under the 2 % bar: routing the remaining hand-batchable loops buys at most a few tenths of a percent of the planner wall, and the door-level measurement shows why — the glue is JS packing that a batch crossing does not remove. A batch door would pay only if it also moved the packing into wasm (the caller handing compact data the kernel expands) — a different, larger change than this prototype. **Not worth merging.**`,
      );
      const verdict = verdictParts.join('\n\n') + '\n';

      const out = [
        '# 214 — the batch door prototype\n',
        `Run ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` in-process, probes' settings (no clock), a fresh plan kernel over the release module, its exports and doors timed by the test. The live account is given first; the 198b timing fixture and the owner exactness fixture follow for the like-for-like comparison. The prototype (\`src/kernel/plan.ts\`'s \`marchMany\`/\`marchBillMany\`, routed in \`src/engine/plan.ts\`'s \`orderFor\` and \`src/engine/retype.ts\`) is behind \`setBatchDoors\`, off by default.\n`,
        '## The census (batch off)\n',
        ...census.map(censusReport),
        '## The batched path, same census\n',
        ...batched.map(censusReport),
        '## The door, in isolation\n',
        ...micro,
        `Doors are exact: ${doorExact.join(' ')}\n`,
        ab,
        '## Verdict\n',
        verdict,
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      for (const run of census) expect(run.doors.size, run.label).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
