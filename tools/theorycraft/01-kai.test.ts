/**
 * E0 — Kai's calculator export (11 stacks, sent by the owner 2026-09-14) run through our engine, against
 * our own marches at the same housing. `THEORY=1 pnpm vitest run tools/theorycraft/01-kai.test.ts`
 */
import { describe, it } from 'vitest';

import { searchPriority } from '../../src/engine/search';
import {
  Report,
  evaluate,
  evaluateCounts,
  feasible,
  loadOwner,
  march,
  n,
  scenarioB,
  table,
  withMethod,
  withUnits,
} from './harness';

const KAI: Record<string, number> = {
  'spearman-1': 855,
  'rider-1': 423,
  'archer-1': 837,
  'spearman-2': 451,
  'rider-2': 223,
  'archer-2': 440,
  'rider-3': 116,
  'legionary-6': 18,
  'arbalester-6': 18,
  'epic-monster-hunter-6': 16,
  'chariot-6': 8,
};

describe.skipIf(!process.env.THEORY)('E0 Kai', () => {
  it('evaluates the export', () => {
    const report = new Report('01-kai');
    const owner = loadOwner();
    const ids = Object.keys(KAI);
    const leadership = 855 + 423 * 2 + 837 + 451 + 223 * 2 + 440 + 116 * 2;
    const authority = 18 + 18 + 16 + 8 * 2;
    report.add(
      `Kai's march uses leadership ${n(leadership)} of 4,343 and authority ${n(authority)}; 7 troop types (no SW1) + 4 mercenaries; HP ladder strictly descending 128,250 → 91,200 (no bonuses in his sheet).`,
    );

    for (const [name, base] of [
      ['A (export bonuses)', owner.twelve],
      ['B (report bonuses)', scenarioB(owner.twelve)],
    ] as const) {
      const req = withUnits(base, ids);
      report.h(`${name} · Kai's counts as given`);
      report.add(`feasible: ${String(feasible(req, KAI))}`);
      const kai = evaluateCounts(req, KAI);
      report.add(march(kai.result));
      report.add(table(kai));

      // Our sizer on the same 11 types, full housing.
      for (const method of ['ms', 'msRelaxed', 'elite'] as const) {
        const ours = evaluate(withMethod(req, method));
        report.h(`${name} · ours, same 11 types, ${method}`);
        report.add(march(ours.result));
        report.add(table(ours));
      }
      // Our sizer on Kai's leadership (4,107), same types, ms — like for like.
      const like = evaluate(withMethod({ ...req, housing: { ...req.housing, leadership } }, 'ms'));
      report.h(`${name} · ours at Kai's leadership ${n(leadership)}, ms`);
      report.add(march(like.result));
      report.add(table(like));

      // The 8-type march the owner uses, and the priority searches, for reference.
      const eight = evaluate(withMethod({ ...base, units: owner.eight.units }, 'msRelaxed'));
      report.h(`${name} · owner's 8 types, msRelaxed`);
      report.add(march(eight.result));
      report.add(table(eight));

      for (const objective of ['avgDamage', 'damagePerSilver'] as const) {
        for (const method of ['msRelaxed', 'elite'] as const) {
          const found = searchPriority({
            request: withMethod(base, method),
            objective,
            budgetMs: 60_000,
            seed: 1,
          });
          report.h(`${name} · searchPriority ${objective} over 12 types, ${method}`);
          report.add(
            `${found.includedUnitIds.join(', ')} · exhaustive ${String(found.exhaustive)} · score ${n(found.score)}`,
          );
          report.add(march(found.result));
          report.add(table({ result: found.result, summary: found.summary }));
        }
      }
    }
    report.save();
  });
});
