/**
 * 209 — **what the paired journal walks cost** (W22 SPEED-03 task 1): `planCampaign` on the timing account, one
 * release binary, the arms interleaved plan by plan. Arm `base` runs the kernel as it is; arm `sizer` / `march`
 * adds one more pair `journalDamage(k,false)` + `journalDamage(k,true)` at `sizerScore` / the sizer's march
 * (test-only export `journalAb`, a temporary kernel patch: `docs/research/patches/w22-209-journal-probe.patch`).
 * The extra pair costs what a pair costs, so the median delta over the base is the pair's share of the planner,
 * and fusing the pair into one pass can save at most that.
 * `THEORY=1 pnpm vitest run tools/theorycraft/209-the-journal-pairs.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';

const OUT = 'tools/theorycraft/out/209-the-journal-pairs.md';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const PLANS = Number(process.env.AB_PLANS ?? 30);

interface Probe {
  journalAb(mask: number): void;
  journalCount(which: number): number;
}
const Original = WebAssembly.Instance;
const instances: WeakRef<Probe>[] = [];
let mask = 0;
class Captured extends Original {
  constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports) {
    super(module, imports);
    const raw = this.exports as unknown as Probe;
    raw.journalAb(mask);
    instances.push(new WeakRef(raw));
  }
}
const setMask = (next: number): void => {
  mask = next;
  for (const ref of instances) ref.deref()?.journalAb(next);
};
const counts = (): [number, number] => {
  let march = 0;
  let sizer = 0;
  for (const ref of instances) {
    const one = ref.deref();
    if (one !== undefined) {
      march += one.journalCount(0);
      sizer += one.journalCount(1);
    }
  }
  return [march, sizer];
};
const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('209 — the paired journal walks', () => {
  it(
    'times planCampaign with one extra journal pair at each caller',
    () => {
      (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Captured;
      try {
        const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
        if (parsed.kind !== 'profile') throw new Error('not a profile export');
        const profile = parsed.payload;
        const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
        if (setup === undefined) throw new Error('no active setup');
        const input: CampaignInput = { ...buildPlanRequest(profile, setup) };
        delete input.budgetMs;
        delete input.shouldStop;
        const answerOf = (): string =>
          JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));
        const reference = answerOf();
        setMask(0);
        answerOf();
        const [march, sizer] = counts();
        const arms: Record<string, number> = { base: 0, fused: 4 };
        const times: Record<string, number[]> = { base: [], fused: [] };
        for (let i = 0; i < PLANS + 2; i += 1) {
          const names = Object.keys(arms);
          if (i % 2 === 1) names.reverse();
          for (const arm of names) {
            setMask(arms[arm] as number);
            const began = performance.now();
            const answer = answerOf();
            const ms = performance.now() - began;
            expect(answer, `${arm} arm moved the plan`).toBe(reference);
            if (i >= 2) (times[arm] as number[]).push(ms);
          }
        }
        const base = median(times.base as number[]);
        const rows = Object.keys(arms).map((arm) => {
          const m = median(times[arm] as number[]);
          return `| ${arm} | ${m.toFixed(1)} | ${Math.min(...(times[arm] as number[])).toFixed(1)} | ${(100 * (m / base - 1)).toFixed(1)} % |`;
        });
        const out = [
          '# 209 — what the paired journal walks cost\n',
          `W22 SPEED-03. ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` on \`${ACCOUNT}\`, ${String(PLANS)} plans per arm, interleaved, release kernel. Pairs per plan: sizer \`sizerScore\` ${String(sizer)}, sizer march ${String(march)}.\n`,
          '| arm (one extra pair at) | median ms | min ms | vs base |',
          '|---|---:|---:|---:|',
          ...rows,
          '',
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
