/**
 * E10 — the recommended plan of §6.5 against Kai's exact march, same budget (8 M silver, 12 k gold), same
 * bonuses, played march by march with the same billing as `09-plan-8m-12k`. Two bonus sets: B (the
 * 2026-09-13 report) and C (the bonuses Kai's own 2026-09-14 report was fought with, +159 / +189).
 * `THEORY=1 pnpm vitest run tools/theorycraft/10-vs-kai.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { BonusTotals, ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, evaluateCounts, loadOwner, n, scenarioB, table, withUnits } from './harness';

const SILVER = Number(process.env.SILVER ?? 8_000_000);
const GOLD = Number(process.env.GOLD ?? 12_000);
const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];

const KAI: Record<string, number> = {
  'spearman-1': 855,
  'rider-1': 423,
  'archer-1': 837,
  'spearman-2': 451,
  'rider-2': 223,
  'archer-2': 440,
  'rider-3': 116,
  'arbalester-6': 18,
  'legionary-6': 18,
  'epic-monster-hunter-6': 16,
  'chariot-6': 8,
};
const OURS: Record<string, number> = {
  'archer-2': 1221,
  'spearman-2': 1220,
  'rider-2': 609,
  'rider-3': 342,
  'epic-monster-hunter-6': 53,
  'arbalester-6': 57,
  'legionary-6': 57,
  'chariot-6': 28,
};
const OURS_5: Record<string, number> = {
  'archer-1': 1796,
  'archer-2': 995,
  'rider-2': 497,
  'rider-3': 279,
  'epic-monster-hunter-6': 43,
  'arbalester-6': 46,
  'legionary-6': 46,
  'chariot-6': 23,
};

function totalsC(): BonusTotals {
  const source: ResolvedSource = {
    id: 'kai-report-2026-09-14',
    label: 'C',
    kind: 'custom',
    health: { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
    strength: { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
    special: { doubleDamageChance: 3 },
  };
  return aggregateBonuses([source]);
}

interface Outcome {
  marches: number;
  damage: number;
  silver: number;
  gold: number;
  lost: number;
  perMarch: number[];
}

/** Fixed counts every march (Kai's sheet is fixed counts); mercenaries capped by the remaining stock. */
function campaign(base: StackRequest, counts: Record<string, number>, revived: string[]): Outcome {
  const byId = new Map(base.units.map((u) => [u.id, u]));
  const stock: Record<string, number> = {
    'epic-monster-hunter-6': 92,
    'arbalester-6': 76,
    'legionary-6': 72,
    'chariot-6': 37,
  };
  const out: Outcome = { marches: 0, damage: 0, silver: 0, gold: 0, lost: 0, perMarch: [] };
  for (let m = 0; m < 60; m += 1) {
    const now: Record<string, number> = { ...counts };
    for (const id of MERCS) now[id] = Math.min(counts[id] ?? 0, stock[id] ?? 0);
    const req = withUnits(base, Object.keys(now));
    const ev = evaluateCounts(req, now);
    let s = 0;
    let g = 0;
    for (const stack of ev.result.stacks) {
      const unit = byId.get(stack.unitId);
      if (!unit) continue;
      if (stack.pool === 'authority' || revived.includes(stack.unitId)) {
        const c = reviveOne(unit, stack.count, req.recovery);
        s += c.silver;
        g += c.gold;
      } else s += retrainOne(unit, stack.count, req.recovery).silver;
    }
    if (out.silver + s > SILVER || out.gold + g > GOLD) break;
    out.silver += s;
    out.gold += g;
    out.damage += ev.summary.avgDamage;
    out.perMarch.push(ev.summary.avgDamage);
    out.marches += 1;
    for (const stack of ev.result.stacks) {
      if (stack.pool !== 'authority') continue;
      out.lost += chunks(stack.count);
      stock[stack.unitId] = Math.max(0, (stock[stack.unitId] ?? 0) - chunks(stack.count));
    }
  }
  return out;
}

describe.skipIf(!process.env.THEORY)('E10 vs Kai', () => {
  it('plays both under the same budget', () => {
    const report = new Report('10-vs-kai');
    const owner = loadOwner();
    report.add(
      `Budgets: silver ${n(SILVER)}, gold ${n(GOLD)}, temple 15, stock 92/76/72/37, 4 enemy squads.`,
    );
    for (const [scenario, base] of [
      ['B (2026-09-13 report bonuses)', scenarioB(owner.twelve)],
      ["C (bonuses of Kai's own 2026-09-14 report)", { ...scenarioB(owner.twelve), totals: totalsC() }],
    ] as const) {
      report.h(scenario);
      const rows = [
        '| march | recovery | marches | total damage | per march | silver | gold | mercs burnt | dmg / merc |',
        '|---|---|---|---|---|---|---|---|---|',
      ];
      const plans: [string, Record<string, number>, string[]][] = [
        ["Kai's counts as given", KAI, []],
        ["Kai's counts, RD3 revived", KAI, ['rider-3']],
        ["Kai's counts, RD3 + tier 2 revived", KAI, ['rider-3', 'archer-2', 'spearman-2', 'rider-2']],
        ['ours: ARC2 SP2 RD2 RD3 + 53/57/57/28, RD3 revived', OURS, ['rider-3']],
        ['ours (5-march variant): ARC1 ARC2 RD2 RD3 + 43/46/46/23, RD3 revived', OURS_5, ['rider-3']],
      ];
      for (const [name, counts, revived] of plans) {
        const o = campaign(base, counts, revived);
        rows.push(
          `| ${name} | ${revived.length ? 'revive mercs + ' + revived.join(', ') : 'revive mercs, recruit troops'} | ${o.marches} | ${n(o.damage)} | ${o.perMarch.map((d) => n(d)).join(' / ')} | ${n(Math.round(o.silver))} | ${n(Math.round(o.gold))} | ${o.lost} | ${n(Math.round(o.damage / Math.max(1, o.lost)))} |`,
        );
      }
      report.add(rows.join('\n'));
      report.add("\n**Kai's first march, every stack and its hits (enemy first / army first):**");
      report.add(table(evaluateCounts(withUnits(base, Object.keys(KAI)), KAI)));
      report.add('\n**Ours, the same:**');
      report.add(table(evaluateCounts(withUnits(base, Object.keys(OURS)), OURS)));
    }
    report.save();
  });
});
