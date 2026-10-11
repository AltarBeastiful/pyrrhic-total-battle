/**
 * 204 — **the sizer cache A/B** (W20, `docs/plans/sizer-track-c.md` §3): `planCampaign` on the timing fixture
 * (`PLANNER_ACCOUNT`, default `pyrrhic-my-account-2026-10-07.json`, never committed), in one process, the two
 * arms interleaved plan by plan — troop-pool cache on (`sizerPoolCache(0)`) and off (`sizerPoolCache(1)`), one
 * release binary — `PLANS` per arm after a warm-up. Median and min of the wall clock; the answers are held equal.
 * `THEORY=1 pnpm vitest run tools/theorycraft/204-sizer-cache-ab.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

const OUT = 'tools/theorycraft/out/204-sizer-cache-ab.md';
const ACCOUNT = process.env.PLANNER_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';
const PLANS = Number(process.env.AB_PLANS ?? 30);

interface CacheExports {
  sizerPoolCache(mode: number): void;
}

const Original = WebAssembly.Instance;
const instances: WeakRef<CacheExports>[] = [];
let mode = 0;
class Captured extends Original {
  constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports) {
    super(module, imports);
    const raw = this.exports as unknown as CacheExports;
    raw.sizerPoolCache(mode);
    instances.push(new WeakRef(raw));
  }
}
const setCache = (next: number): void => {
  mode = next;
  for (const ref of instances) ref.deref()?.sizerPoolCache(next);
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

function settings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const input = { ...buildPlanRequest(profile, setup) };
  delete input.budgetMs;
  delete input.shouldStop;
  return input;
}

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('204 — the sizer cache A/B', () => {
  it(
    'times planCampaign with the troop-pool cache on and off, interleaved',
    () => {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Captured;
      try {
        const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
        if (parsed.kind !== 'profile') throw new Error('not a profile export');
        const input = settings(parsed.payload);
        const answerOf = (): string =>
          JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));
        const reference = answerOf();
        const times: Record<'on' | 'off', number[]> = { on: [], off: [] };
        for (let i = 0; i < PLANS + 2; i += 1) {
          // Alternate which arm goes first, so neither always follows the other's garbage.
          const order: ('on' | 'off')[] = i % 2 === 0 ? ['on', 'off'] : ['off', 'on'];
          for (const arm of order) {
            setCache(arm === 'on' ? 0 : 1);
            const began = performance.now();
            const answer = answerOf();
            const ms = performance.now() - began;
            expect(answer, `${arm} arm moved the plan`).toBe(reference);
            if (i >= 2) times[arm].push(ms);
          }
        }
        const row = (arm: 'on' | 'off'): string =>
          `| ${arm} | ${median(times[arm]).toFixed(1)} | ${Math.min(...times[arm]).toFixed(1)} |`;
        const gain = 1 - median(times.on) / median(times.off);
        const out = [
          '# 204 — the sizer cache A/B\n',
          `W20 C1. ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` on \`${ACCOUNT}\`, ${String(PLANS)} plans per arm, interleaved, one release binary.\n`,
          '| troop-pool cache | median ms | min ms |',
          '|---|---:|---:|',
          row('on'),
          row('off'),
          `\nMedian gain **${(100 * gain).toFixed(1)} %**; min gain ${(100 * (1 - Math.min(...times.on) / Math.min(...times.off))).toFixed(1)} %.\n`,
        ].join('\n');
        writeFileSync(OUT, out);
        // eslint-disable-next-line no-console -- the experiment's own report
        console.log(out);
      } finally {
        (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Original;
      }
    },
    30 * 60_000,
  );
});
