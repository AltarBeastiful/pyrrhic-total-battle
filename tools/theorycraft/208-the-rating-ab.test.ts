/**
 * 208 — **the Tight raise A/B** (W22 SPEED-02, `docs/plans/next-speed.md` §1 steps 1–2): the Tight raise
 * searches of one advisor pass on the timing account, captured once (`RaiseInput` is plain data), then replayed
 * on the release kernel with the test-only switch `raiseAb(mask)` flipped between the two arms, interleaved
 * round by round, the arm that goes first alternating. `AB_OLD` is the mask that puts a step back as it was
 * before W22 (bit 0: the rating sorts its own kill order; bit 1: the recovery bill walks every stack). The answers
 * are held equal arm to arm; the report is the median and the min of the wall clock of a round.
 * **The switch is a temporary kernel patch** (W22 kept none: both steps were WON'T DO): apply
 * `docs/research/patches/w22-208-rating-kept-order.patch` (step 1) before running; it adds the export `raiseAb`.
 * `THEORY=1 AB_OLD=1 pnpm vitest run tools/theorycraft/208-the-rating-ab.test.ts`
 * (`AB_ROUNDS` rounds, default 30; `AB_EVERY` keeps one captured search in N, default 12; the account is
 * `PYRRHIC_TIMING_FIXTURE`, default `pyrrhic-my-account-2026-10-11.json`).
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { setKernel, setRaiseKernel, type RaiseAnswer, type RaiseInput } from '../../src/engine/fast';
import { genericProbes } from '../../src/engine/probes';
import { createPlanKernel } from '../../src/kernel/plan';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { raiseCode } from '../../src/ui/sections/march/positions';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { loadKernelModule } from '../../tests/kernel/load';

const OUT = 'tools/theorycraft/out/208-the-rating-ab.md';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const ROUNDS = Number(process.env.AB_ROUNDS ?? 30);
const EVERY = Number(process.env.AB_EVERY ?? 12);
const OLD = Number(process.env.AB_OLD ?? 1);
const NO_CLOCK = 1_000_000_000;
const TIGHT = raiseCode('tight');

interface Switch {
  raiseAb(mask: number): void;
}
const Original = WebAssembly.Instance;
const instances: WeakRef<Switch>[] = [];
class Captured extends Original {
  constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports) {
    super(module, imports);
    instances.push(new WeakRef(this.exports as unknown as Switch));
  }
}
const setMask = (mask: number): void => {
  for (const ref of instances) ref.deref()?.raiseAb(mask);
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('208 — the Tight raise A/B', () => {
  it(
    'replays captured Tight searches with the W22 step off and on, interleaved',
    async () => {
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('not a profile export');
      const profile = parsed.payload;
      const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
      if (setup === undefined) throw new Error('no active setup');
      const input = buildPlanRequest(profile, setup);

      // Capture, on the release kernel, one inline lane, no clock.
      const module = loadKernelModule();
      const capturing = createRaiseKernel(module);
      const seen: RaiseInput[] = [];
      setKernel(createPlanKernel(module));
      setRaiseKernel({
        position(one: RaiseInput): RaiseAnswer | null {
          if (one.modes.authority === TIGHT) seen.push(one);
          return capturing.position(one);
        },
      });
      const client = { ...createInlineClient(), mode: 'worker' as const };
      const pool = createCalcPool({
        size: 1,
        createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
      });
      try {
        const planned = await client.plan(input);
        const headline = pickOf(planned, openingPosition(planned, null)).pick;
        await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });
      } finally {
        pool.dispose();
        client.dispose();
      }
      const kept = seen.filter((_, i) => i % EVERY === 0);
      expect(kept.length).toBeGreaterThan(10);

      // Replay on a kernel whose instances (made lazily, one per march) we hold.
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Captured;
      const times: Record<'new' | 'old', number[]> = { new: [], old: [] };
      try {
        const kernel = createRaiseKernel(module);
        const run = (mask: number): { ms: number; answer: string } => {
          setMask(mask);
          const began = performance.now();
          const answers = kept.map((one) => kernel.position(one));
          const ms = performance.now() - began;
          return { ms, answer: JSON.stringify(answers) };
        };
        const reference = run(0).answer;
        expect(instances.length).toBeGreaterThan(0);
        run(OLD);
        for (let i = 0; i < ROUNDS; i += 1) {
          const order: ('new' | 'old')[] = i % 2 === 0 ? ['new', 'old'] : ['old', 'new'];
          for (const arm of order) {
            const { ms, answer } = run(arm === 'new' ? 0 : OLD);
            expect(answer, `${arm} arm moved an answer`).toBe(reference);
            times[arm].push(ms);
          }
        }
      } finally {
        (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Original;
      }
      const gain = 1 - median(times.new) / median(times.old);
      const out = [
        '# 208 — the Tight raise A/B\n',
        `W22 SPEED-02. ${new Date().toISOString().slice(0, 10)}, node ${process.version}: ${String(kept.length)} captured Tight searches of \`${ACCOUNT}\` (one in ${String(EVERY)} of ${String(seen.length)}), ${String(ROUNDS)} rounds per arm, interleaved, release kernel, old = mask ${String(OLD)}.\n`,
        '| arm | median ms | min ms |',
        '|---|---:|---:|',
        `| new | ${median(times.new).toFixed(1)} | ${Math.min(...times.new).toFixed(1)} |`,
        `| old | ${median(times.old).toFixed(1)} | ${Math.min(...times.old).toFixed(1)} |`,
        `\nMedian gain **${(100 * gain).toFixed(1)} %** of the raise; min gain ${(100 * (1 - Math.min(...times.new) / Math.min(...times.old))).toFixed(1)} %.\n`,
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
    },
    60 * 60_000,
  );
});
