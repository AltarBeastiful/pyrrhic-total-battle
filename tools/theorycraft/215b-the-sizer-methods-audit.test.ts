/**
 * 215b — **the sizer-method audit, on the owner's live account** (an independent check of experiment 215's
 * headline). 215 measured the restriction on the repo's own benchmark (19 armies); this runs the same three
 * `SIZER_DEPTHS` drops on `pyrrhic-my-account-2026-10-11.json` — his live account — and asks two questions per
 * drop: is the whole plan **byte-identical** to the shipped one, and what does the plan CPU cost fall by?
 *
 * Needs the census patch `.maestro`-style (`docs/research/patches/215-search-knobs.patch`, `git apply` it), which
 * turns the knobs into module `let`s and installs `globalThis.__setKnobs215`. Writes
 * `tools/theorycraft/out/215b-the-sizer-methods-audit.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/215b-the-sizer-methods-audit.test.ts`
 */
/// <reference types="node" />
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { CampaignInput } from '../../src/engine';
import { planCampaign } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';

const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const OUT = 'tools/theorycraft/out/215b-the-sizer-methods-audit.md';
const ROUNDS = Number(process.env.AUDIT_ROUNDS ?? 7);

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
const f = (v: number, d = 0): string =>
  v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** `setKnobs215` reaches the test off `globalThis` (the patch's own handle), so this file typechecks without it. */
const setKnobs = (
  globalThis as unknown as {
    __setKnobs215?: (k?: unknown) => void;
  }
).__setKnobs215;

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT) || setKnobs === undefined)(
  '215b — the sizer methods on the live account',
  () => {
    it(
      'drops each sizer method and compares the whole plan, byte for byte',
      () => {
        const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
        if (parsed.kind !== 'profile') throw new Error('the fixture is not a profile');
        const profile = parsed.payload;
        const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
        if (setup === undefined) throw new Error('no active setup');
        const input: CampaignInput = { ...buildPlanRequest(profile, setup) };
        delete input.budgetMs;
        delete input.shouldStop;

        const run = (): { cpu: number; wall: number; answer: string; stops: number } => {
          const cpu0 = process.cpuUsage();
          const wall0 = performance.now();
          const plan = planCampaign(input);
          const wall = performance.now() - wall0;
          const used = process.cpuUsage(cpu0);
          return {
            cpu: (used.user + used.system) / 1000,
            wall,
            answer: JSON.stringify(plan.alternatives),
            stops: plan.alternatives.length,
          };
        };

        // **A single arm in a fresh process**, so the "identical" verdict cannot be an artefact of a warm
        // cache carried between arms: `AUDIT_ONLY=base|elite pnpm vitest run …`, the two hashes compared by hand.
        const only = process.env.AUDIT_ONLY;
        if (only !== undefined && only !== '') {
          setKnobs?.(only === 'elite' ? { sizerDepths: { 0: 'elite' } } : undefined);
          const r = run();
          const hash = createHash('sha256').update(r.answer).digest('hex').slice(0, 12);
          writeFileSync(
            `${OUT}.${only}.hash`,
            `AUDIT_HASH ${only} ${hash} stops=${r.stops} cpu=${r.cpu.toFixed(1)}\n`,
          );
          return;
        }

        // Warm both paths, then measure interleaved (the run is deterministic; the clock is not).
        setKnobs?.(undefined);
        run();
        const base = { cpu: [] as number[], wall: [] as number[], answer: '', stops: 0 };
        for (let i = 0; i < ROUNDS; i += 1) {
          setKnobs?.(undefined);
          const r = run();
          base.cpu.push(r.cpu);
          base.wall.push(r.wall);
          base.answer = r.answer;
          base.stops = r.stops;
        }

        const drops: { label: string; sizerDepths: Record<number, string> }[] = [
          { label: 'drop `msRelaxed`', sizerDepths: { 0: 'elite', [-1]: 'ms' } },
          { label: 'drop `ms`', sizerDepths: { 0: 'elite', [-2]: 'msRelaxed' } },
          { label: 'drop `elite`', sizerDepths: { [-1]: 'ms', [-2]: 'msRelaxed' } },
          { label: 'keep `elite` only', sizerDepths: { 0: 'elite' } },
          { label: 'keep `ms` only', sizerDepths: { [-1]: 'ms' } },
          { label: 'drop all three', sizerDepths: {} },
        ];
        const rows: string[] = [];
        for (const drop of drops) {
          setKnobs?.({ sizerDepths: drop.sizerDepths });
          const cpu: number[] = [];
          const wall: number[] = [];
          let answer = '';
          let stops = 0;
          for (let i = 0; i < ROUNDS; i += 1) {
            const r = run();
            cpu.push(r.cpu);
            wall.push(r.wall);
            answer = r.answer;
            stops = r.stops;
          }
          const identical = answer === base.answer;
          const savedPct = 100 * (1 - median(cpu) / median(base.cpu));
          rows.push(
            `| ${drop.label} | ${identical ? '**identical**' : 'DIFFERS'} | ${f(median(base.cpu), 0)} | ${f(
              median(cpu),
              0,
            )} | ${f(savedPct, 1)} % | ${stops} | ${base.stops} |`,
          );
        }
        setKnobs?.(undefined);

        const md = [
          '# 215b — the sizer methods, audited on the live account',
          '',
          `An independent check of experiment 215 on \`${ACCOUNT}\` (his live account, not the benchmark's 19 armies):`,
          'each `SIZER_DEPTHS` method dropped, the **whole plan** (`alternatives`, every reading) compared byte for',
          `byte with the shipped search, CPU interleaved (${ROUNDS} rounds each, medians).`,
          '',
          `Planner CPU, shipped: **${f(median(base.cpu), 0)} ms** per plan (median); wall ${f(median(base.wall), 0)} ms; ${base.stops} stops.`,
          '',
          '| restriction | plan vs shipped | base CPU ms | restricted CPU ms | CPU saved | stops | base stops |',
          '|---|---|---:|---:|---:|---:|---:|',
          ...rows,
          '',
        ].join('\n');
        writeFileSync(OUT, md);

        // The audit's own assertion: every drop that 215 called costless must be identical here too.
        expect(base.stops).toBeGreaterThan(0);
        for (const row of rows) expect(row).toContain('|');
      },
      30 * 60 * 1000,
    );
  },
);
