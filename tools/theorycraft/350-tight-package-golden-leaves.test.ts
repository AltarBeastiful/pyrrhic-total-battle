/**
 * 350 — **which golden leaves the exact Tight package moves** (follows 337/338). Run in a worktree whose
 * `kernel/` carries the package (algo 22 default + rating memo + 271 hashed memo): both raise goldens rebuilt
 * exactly as their tests build them (`raise.json` as `golden-capture.test.ts`, `raise-kernel.json` as
 * `raise-kernel.test.ts`, via 271's builders) and diffed **leaf by leaf** against the committed files: for every
 * leaf name, how many entries differ. A package that only skips evaluations may move `scored` and nothing else.
 *
 * `THEORY=1 OUTF=<file> pnpm vitest run tools/theorycraft/350-tight-package-golden-leaves.test.ts` (in the worktree)
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { setKernel, setRaiseKernel } from '../../src/engine/fast';
import type { Stack, StackRequest, StackResult } from '../../src/engine/types';
import { createPlanKernel } from '../../src/kernel/plan';
import { createRaiseKernel } from '../../src/kernel/raise';
import { POSITIONS, liftedCounts, positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';
import type { RaiseMode } from '../../src/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { marchesOf, roomyBase } from '../../tests/kernel/seeded-marches';

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
function raiseCorpus() {
  const entries: { army: string; stop: string; rows: Record<string, unknown>[] }[] = [];
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

function diffLeaves(got: Record<string, unknown>[], want: Record<string, unknown>[], tally: Record<string, number>, scoredPairs: [number, number][]) {
  if (got.length !== want.length) tally['LENGTH'] = (tally['LENGTH'] ?? 0) + 1;
  for (let i = 0; i < Math.min(got.length, want.length); i += 1) {
    const g = got[i]!, w = want[i]!;
    for (const k of new Set([...Object.keys(g), ...Object.keys(w)])) {
      const norm = (v: unknown) => (v !== null && typeof v === 'object' ? JSON.stringify(Object.entries(v as Record<string, number>).filter(([, n]) => n !== 0).sort()) : JSON.stringify(v));
      if (norm(g[k]) === norm(w[k])) continue;
      tally[k] = (tally[k] ?? 0) + 1;
      if (k === 'scored') scoredPairs.push([w[k] as number, g[k] as number]);
    }
  }
}

describe.skipIf(!process.env.THEORY)('350 — package golden leaves', () => {
  it('diffs', () => {
    const mod = loadKernelModule();
    setKernel(createPlanKernel(mod));
    setRaiseKernel(createRaiseKernel(mod));
    const out: string[] = [];
    const pairs: [number, number][] = [];
    const t1: Record<string, number> = {};
    const a = JSON.parse(JSON.stringify(raiseKernelCorpus())) as Record<string, unknown>[];
    const ga = JSON.parse(readFileSync('tests/golden/raise-kernel.json', 'utf8')) as Record<string, unknown>[];
    diffLeaves(a, ga, t1, pairs);
    out.push(`raise-kernel.json: ${a.length} answers (golden ${ga.length}); leaves differing ${JSON.stringify(t1)}`);
    const sumA = pairs.reduce((s, p) => s + p[0], 0), sumB = pairs.reduce((s, p) => s + p[1], 0);
    out.push(`  scored on the differing answers: golden Σ ${sumA} → package Σ ${sumB} (${pairs.length} answers, every one lower: ${pairs.every((p) => p[1] < p[0])})`);
    pairs.length = 0;
    const t2: Record<string, number> = {};
    const b = JSON.parse(JSON.stringify(raiseCorpus())) as { rows: Record<string, unknown>[] }[];
    const gb = JSON.parse(readFileSync('tests/golden/raise.json', 'utf8')) as { rows: Record<string, unknown>[] }[];
    if (b.length !== gb.length) t2['STOPS'] = 1;
    for (let i = 0; i < Math.min(b.length, gb.length); i += 1) diffLeaves(b[i]!.rows, gb[i]!.rows, t2, pairs);
    const rows = b.reduce((s, e) => s + e.rows.length, 0);
    out.push(`raise.json: ${b.length} stops, ${rows} rows; leaves differing ${JSON.stringify(t2)}`);
    out.push(`  scored on the differing rows: golden Σ ${pairs.reduce((s, p) => s + p[0], 0)} → package Σ ${pairs.reduce((s, p) => s + p[1], 0)} (${pairs.length} rows, every one lower: ${pairs.every((p) => p[1] < p[0])})`);
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 3_600_000);
});
