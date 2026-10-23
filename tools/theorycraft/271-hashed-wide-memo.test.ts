/**
 * 271 — **a hashed score memo for the boxes too wide for the dense one** (follows 270: Tight is 99.8 % of a
 * shape's Tight-raised reading, and the merc saver's boxes are up to 1.76e12 vectors, searched with no memo since
 * `MEMO_CAP` is 4.19M). The patched kernel (`KWASM`, built from a scratch copy of `kernel/assembly` with a
 * 2^21-entry open-addressing memo keyed on the vector's mixed-radix index, used only where the dense memo is off)
 * must answer **byte-identically**: a vector's score is a pure function of the vector, so caching cannot move an
 * answer or a `scored` count. Held here to both raise goldens (`tests/golden/raise.json`,
 * `tests/golden/raise-kernel.json`, replicated exactly as their tests build them, never re-captured), then timed
 * A/B against the repo kernel on every distinct shape at each stop's burn on the 2026-10-22 account.
 *
 * `THEORY=1 KWASM=<wasm> ACCT=<file> OUTF=<file> [PART=golden|account|both] pnpm vitest run tools/theorycraft/271-hashed-wide-memo.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { RAISE_TIGHT, setKernel, setRaiseKernel } from '../../src/engine/fast';
import { retypeMarch } from '../../src/engine/retype';
import type { Stack, StackRequest, StackResult } from '../../src/engine/types';
import { compileKernel } from '../../src/kernel';
import { createPlanKernel } from '../../src/kernel/plan';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { POSITIONS, liftedCounts, positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';
import type { RaiseMode } from '../../src/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { marchesOf, roomyBase } from '../../tests/kernel/seeded-marches';

const repo = loadKernelModule();
const patched = process.env.KWASM ? compileKernel(readFileSync(process.env.KWASM)) : repo;
const key = (c: Record<string, number>): string => JSON.stringify(Object.entries(c).filter(([, v]) => v > 0).sort());

// raise-kernel.json, as tests/kernel/raise-kernel.test.ts builds it.
function moved(request: StackRequest, here: Record<string, number>, counts: Record<string, number>) {
  const merged = { ...here, ...counts };
  const out: Record<string, number> = {};
  for (const unit of [...request.units].sort((a, b) => a.id.localeCompare(b.id))) {
    const count = merged[unit.id] ?? 0;
    if (count !== (here[unit.id] ?? 0)) out[unit.id] = count;
  }
  return out;
}
function answer(army: string, march: string, request: StackRequest, base: StackResult, position: RaiseMode) {
  const lifted = liftedCounts(request, base, { authority: position, dominance: position });
  return { army, march, position, moved: moved(request, countsOf(base), lifted?.counts ?? {}), how: lifted?.how ?? null, space: lifted?.space ?? 0, scored: lifted?.scored ?? 0 };
}
function raiseKernelCorpus() {
  const out: ReturnType<typeof answer>[] = [];
  for (const scenario of criteriaScenarios())
    for (const { name, request, base } of marchesOf(scenario.request))
      for (const position of POSITIONS) out.push(answer(scenario.label, name, request, base, position));
  const first = criteriaScenarios()[0];
  if (first !== undefined) {
    const sized = roomyBase(first.request);
    const reversed: StackResult = { ...sized, stacks: [...sized.stacks].reverse() as Stack[] };
    for (const position of POSITIONS) out.push(answer(first.label, 'the sizer’s march, stack order reversed', first.request, reversed, position));
  }
  return out;
}
// raise.json, as tests/kernel/golden-capture.test.ts builds it.
function raiseCorpus() {
  const entries: { army: string; stop: string; rows: unknown[] }[] = [];
  for (const scenario of criteriaScenarios()) {
    let campaign;
    try {
      campaign = planCampaign({ request: scenario.request, marchTarget: HORIZON, budgetMs: CAMPAIGN.budgets.plan, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
      continue;
    }
    for (const stop of campaign.alternatives) {
      const base = planMarch(scenario.request, stop.counts).result;
      const own = countsOf(base);
      const trades = positionTrades(scenario.request, base);
      entries.push({
        army: scenario.label,
        stop: stop.pick,
        rows: trades.rows.map((row) => ({
          mode: row.mode,
          counts: Object.fromEntries(scenario.request.units.map((u) => [u.id, { ...own, ...row.counts }[u.id] ?? 0])),
          how: row.how,
          space: row.space,
          scored: row.scored,
        })),
      });
    }
  }
  return entries;
}

describe.skipIf(!process.env.THEORY)('271 — hashed wide memo', () => {
  it('is byte-identical and faster', () => {
    const out: string[] = [];
    const part = process.env.PART ?? 'both';
    const flush = () => writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
    setKernel(createPlanKernel(repo));
    if (part !== 'account') {
      for (const [label, mod] of [['repo', repo], ['patched', patched]] as const) {
        setRaiseKernel(createRaiseKernel(mod));
        let t = performance.now();
        const a = raiseKernelCorpus();
        const ta = performance.now() - t;
        const ga = JSON.parse(readFileSync('tests/golden/raise-kernel.json', 'utf8')) as unknown[];
        const okA = isDeepStrictEqual(JSON.parse(JSON.stringify(a)), ga);
        t = performance.now();
        const b = raiseCorpus();
        const tb = performance.now() - t;
        const gb = JSON.parse(readFileSync('tests/golden/raise.json', 'utf8')) as unknown[];
        const okB = isDeepStrictEqual(JSON.parse(JSON.stringify(b)), gb);
        const wide = (a as { space: number }[]).filter((x) => x.space > 4194304).length;
        out.push(`${label}: raise-kernel.json ${okA ? 'IDENTICAL' : 'DIFFERS'} (${String(a.length)} answers, ${String(wide)} boxes > MEMO_CAP, ${ta.toFixed(0)} ms); raise.json ${okB ? 'IDENTICAL' : 'DIFFERS'} (${String(b.length)} stops, ${tb.toFixed(0)} ms)`);
        flush();
      }
    }
    if (part !== 'golden') {
      const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('profile');
      const kA = createRaiseKernel(repo);
      const kB = createRaiseKernel(patched);
      const modes = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT };
      setRaiseKernel(kA);
      for (const star of (process.env.STARS ?? '0,1,2').split(',').map(Number)) {
        const profile = structuredClone(parsed.payload) as Profile;
        profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
        const input = buildPlanRequest(profile, profile.setups[0]!);
        const plan = planCampaign({ ...input, withFrontier: true });
        for (const stop of plan.alternatives) {
          if (stop.sequence !== undefined || !['burn-saver', 'silver-saver', 'sweet-spot'].includes(stop.pick)) continue;
          const shapes = new Map<string, Record<string, number>>();
          for (const r of plan.frontier ?? []) if (r.repeat.mercLost === stop.repeat.mercLost) shapes.set(key(r.counts), r.counts);
          let msA = 0, msB = 0, same = 0, diff = 0, hits = 0, miss = 0;
          for (const counts of shapes.values()) {
            const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
            const base = planMarch(input.request, found?.counts ?? counts).result;
            // Alternate the order so neither arm always runs warm.
            const first = (same + diff) % 2 === 0;
            let a, b;
            if (first) {
              let t = performance.now(); a = kA.position({ request: input.request, base, modes }); msA += performance.now() - t;
              t = performance.now(); b = kB.position({ request: input.request, base, modes }); msB += performance.now() - t;
            } else {
              let t = performance.now(); b = kB.position({ request: input.request, base, modes }); msB += performance.now() - t;
              t = performance.now(); a = kA.position({ request: input.request, base, modes }); msA += performance.now() - t;
            }
            if (process.env.DIAG) { hits += b?.scored ?? 0; miss += b?.space ?? 0; }
            if (JSON.stringify(a) === JSON.stringify(b)) same += 1;
            else diff += 1;
          }
          out.push(`acct ★${String(star)} ${stop.pick}: ${String(shapes.size)} shapes, identical ${String(same)}, differ ${String(diff)} | repo ${msA.toFixed(0)} ms, patched ${msB.toFixed(0)} ms (×${(msA / Math.max(1, msB)).toFixed(2)})${process.env.DIAG ? ` | wide-box hits ${String(hits)} misses ${String(miss)}` : ''}`);
          flush();
        }
      }
    }
    flush();
  }, 7_200_000);
});
