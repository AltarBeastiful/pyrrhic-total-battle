/**
 * 198b — **the glue of each kernel door** (W18 Drill 04b, P3.0, `docs/plans/profile-drilldown.md` §3): 198
 * counted the boundary; this times it. For every door of the plan kernel (and of each `LadderKernel` it hands
 * out) the test reads `performance.now()` around the whole wrapper and around each raw wasm call the wrapper
 * makes, over the same plan as 198 (`planCampaign` under the probes' settings, no clock, in-process, one
 * inline lane), on the timing fixture (`BOUNDARY_ACCOUNT`, default `pyrrhic-my-account-2026-10-07.json` at the
 * repo root, never committed) and on the exactness fixture (`ownerProfile()`).
 *
 * **Glue** is the wrapper's own time minus the wasm calls inside it (`lay`, `searchReduction`, `checkEnemy`,
 * the `out` reads, the result object, `packRequest`, the view reads of `gridView`), exclusive of any door it
 * opens in turn (`marchBill` → `bindTable`). Each figure is corrected for the timers' own cost, calibrated in
 * the same process from the doors' own records: an empty door, and a door making one timed raw no-op.
 *
 * The denominator is the planner's wall time **untimed**: the same input planned on the release kernel with no
 * wrapper, interleaved with the timed plans so that drift falls on both. Nothing in `src/` is touched: the
 * test wraps `WebAssembly.Instance` (its exports) and the kernel objects `createPlanKernel` returns.
 *
 * Writes `tools/theorycraft/out/198b-the-glue.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/198b-the-glue.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { planKernel, setKernel, type LadderKernel, type PlanKernel } from '../../src/engine/fast';
import { createPlanKernel } from '../../src/kernel/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { ownerProfile } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';

const OUT = 'tools/theorycraft/out/198b-the-glue.md';
const ACCOUNT = process.env.BOUNDARY_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';
/** Timed plans (and as many untimed ones, interleaved) per fixture. */
const REPEATS = Number(process.env.GLUE_REPEATS ?? 7);
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

/** One door's accumulated figures over the timed plans. */
interface DoorTime {
  calls: number;
  /** Raw wasm calls made from this door (exclusive of nested doors). */
  raw: number;
  /** Wrapper time, exclusive of nested doors, ms (timers included). */
  self: number;
  /** Time inside the raw wasm calls, ms (as their own timers saw it). */
  wasm: number;
}

/** The timers' own cost, ms, as an enclosing timer sees it. */
interface Overhead {
  /** An empty door: one `now()` pair inside the outer pair, the proxy's bookkeeping. */
  door: number;
  /** One timed raw call on a no-op, seen from its door. */
  raw: number;
  /** The part of a timed raw call its own timer sees (subtracted from `wasm`). */
  rawInner: number;
}

/** The timing harness: the constructor's exports and the doors, accumulating into `doors` while installed. */
function harness(module: WebAssembly.Module) {
  const RealInstance = WebAssembly.Instance;
  let doors = new Map<string, DoorTime>();
  /** The open doors, innermost last. `nested` is time spent in doors opened from inside the frame. */
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

  /**
   * The timers' own cost, read the way the plan's figures are: from the doors' own records, on no-op targets.
   * An empty door's recorded self is the cost inside its timer pair (the proxy's trap runs outside it); a
   * door making one timed raw no-op records that much more; the raw no-op's own timer records `rawInner`.
   */
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
    const door = (empty?.self ?? 0) / CALIBRATE;
    const rawSeen = (one?.self ?? 0) / CALIBRATE - door;
    const rawInner = (one?.wasm ?? 0) / CALIBRATE;
    doors.clear();
    return { door, raw: rawSeen, rawInner };
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

interface FixtureRun {
  label: string;
  /** Untimed wall per plan (release kernel), ms. */
  plain: number[];
  /** Timed wall per plan, ms. */
  timedWall: number[];
  /** Door figures summed over the timed plans. */
  doors: Map<string, DoorTime>;
  overhead: Overhead;
}

function runFixture(label: string, profile: Profile, module: WebAssembly.Module): FixtureRun {
  const input = probeSettings(profile);
  const release = planKernel();
  if (release === null) throw new Error('the plan kernel is not set');
  const answer = answerOf(input);
  answerOf(input); // a second warm-up on the release kernel
  const h = harness(module);
  const plain: number[] = [];
  const timedWall: number[] = [];
  h.install();
  let overhead: Overhead;
  try {
    overhead = h.calibrate();
    const kernel = h.kernel();
    setKernel(kernel);
    // The cold plan binds everything on the fresh kernel (198: one instance); it is not timed.
    expect(answerOf(input), `${label}: cold plan`).toBe(answer);
    h.reset();
    for (let i = 0; i < REPEATS; i += 1) {
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
    h.uninstall();
    setKernel(release);
  }
  return { label, plain, timedWall, doors: h.doors(), overhead };
}

function report(run: FixtureRun): string {
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
    (t, r) => ({ wasm: t.wasm + r.wasm, self: t.self + r.self, glue: t.glue + r.glue }),
    { wasm: 0, self: 0, glue: 0 },
  );
  const rawTimed = [...run.doors.values()].reduce((t, d) => t + d.self, 0) / n;
  const upper = rawTimed - total.wasm;
  const lines = [
    `## ${run.label}\n`,
    '| Figure | Value |',
    '|---|---:|',
    `| Planner wall per plan, untimed (median of ${n}, release kernel) | ${f(wall, 1)} ms |`,
    `| … min / max | ${f(Math.min(...run.plain), 1)} / ${f(Math.max(...run.plain), 1)} ms |`,
    `| Planner wall per plan, timed (median of ${n}) | ${f(median(run.timedWall), 1)} ms |`,
    `| Timer cost, calibrated: inside an empty door's timer / a timed raw call seen from its door / seen by its own timer | ${f(o.door * 1e6, 0)} / ${f(o.raw * 1e6, 0)} / ${f(o.rawInner * 1e6, 0)} ns |`,
    `| All doors, wrapper time per plan, uncorrected | ${f(rawTimed, 1)} ms (${pct(rawTimed, wall)}) |`,
    `| All doors, wrapper time per plan, corrected | ${f(total.self, 1)} ms (${pct(total.self, wall)}) |`,
    `| … inside wasm | ${f(total.wasm, 1)} ms (${pct(total.wasm, wall)}) |`,
    `| … **glue** (wrapper minus wasm) | **${f(total.glue, 1)} ms (${pct(total.glue, wall)})** |`,
    `| … glue upper bound (no timer correction on the doors' side) | ${f(upper, 1)} ms (${pct(upper, wall)}) |`,
    '',
    'Per plan. "Wrapper" is the door\'s own time exclusive of doors it opens, corrected for the timers; "wasm" is the raw calls inside it; "glue" is the difference. Shares are of the untimed planner wall. The upper bound takes no timer cost off: wrapper minus wasm as the timers read them.\n',
    '| Door | Calls | Raw wasm calls | Wrapper ms | Wasm ms | Glue ms | Glue per call | Glue share of planner wall | Upper bound | Glue share of the door |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...rows.map(
      (r) =>
        `| \`${r.name}\` | ${f(r.calls)} | ${f(r.raw)} | ${f(r.self, 2)} | ${f(r.wasm, 2)} | ${f(r.glue, 2)} | ${r.calls > 0 ? `${f((r.glue / r.calls) * 1e6, 0)} ns` : '—'} | ${pct(r.glue, wall)} | ${pct(r.upper, wall)} | ${pct(r.glue, r.self)} |`,
    ),
    `| **total** | | | **${f(total.self, 2)}** | **${f(total.wasm, 2)}** | **${f(total.glue, 2)}** | | **${pct(total.glue, wall)}** | **${pct(upper, wall)}** | **${pct(total.glue, total.self)}** |`,
    '',
  ];
  return lines.join('\n');
}

function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

describe.skipIf(!process.env.THEORY)('198b — the glue of each kernel door', () => {
  it(
    'times each door around the wasm call and around the whole wrapper, on the profiled account and the owner fixture',
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
        '# 198b — the glue of each kernel door\n',
        `W18 Drill 04b, P3.0 (\`docs/plans/profile-drilldown.md\` §3), the timing half of [[198-the-boundary]]. Run ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` alone, in-process, under the probes' settings (no clock). A fresh plan kernel over the release module, its exports and doors timed with \`performance.now()\` by the test (\`src/\` untouched), planned once cold (untimed) then ${REPEATS} times warm, each timed plan interleaved with an untimed plan on the release kernel. Every timed answer equals the release kernel's.\n`,
        account === null ? `The timing fixture \`${ACCOUNT}\` is absent: one fixture only.\n` : '',
        ...runs.map(report),
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      for (const run of runs) expect(run.doors.size, run.label).toBeGreaterThan(0);
    },
    60 * 60_000,
  );
});
