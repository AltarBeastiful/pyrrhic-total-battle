/**
 * E11 — the weekly steady state (owner, 2026-09-14): silver ≈ 4–6 M a week, gold ≈ 10 k a week, Epic
 * Monster Hunter VI ≈ 95 a week; Arbalester / Legionary / Chariot VI are bought with real money and do
 * not come back. So: maximise damage per week under the renewable incomes, for a chosen weekly burn of
 * the advanced mercenaries (0 … 30 units a week). A "design" is a march (troop set × mercenary counts ×
 * method × leadership) and a recovery choice; it is repeated k times a week with
 *   k = min(silver/week ÷ silver/march, gold/week ÷ gold/march, 95 ÷ EMH6 lost/march, burn ÷ advanced lost/march).
 * Recovery choices: retrain all troops (mercenaries always revived — unrevived ones are gone); revive
 * G3 (RD3) + mercenaries, retrain the rest; revive RD3 + tier 2 + mercenaries; revive everything.
 * `THEORY=1 pnpm vitest run tools/theorycraft/11-weekly.test.ts` (SILVER_WEEK, GOLD_WEEK, EMH_WEEK env)
 */
import { describe, it } from 'vitest';

import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluate,
  evaluateCounts,
  label,
  loadOwner,
  n,
  scenarioB,
  withCaps,
  withMethod,
  withUnits,
} from './harness';

const SILVER_WEEK = Number(process.env.SILVER_WEEK ?? 5_000_000);
const GOLD_WEEK = Number(process.env.GOLD_WEEK ?? 10_000);
const EMH_WEEK = Number(process.env.EMH_WEEK ?? 95);
const BURNS = [0, 3, 6, 10, 15, 20, 30];

const EMH = 'epic-monster-hunter-6';
const ADV = ['arbalester-6', 'legionary-6', 'chariot-6'];
const SETS: Record<string, string[]> = {
  RD3: ['rider-3'],
  'ARC2 RD3': ['archer-2', 'rider-3'],
  'ARC2 RD2 RD3': ['archer-2', 'rider-2', 'rider-3'],
  'ARC2 SP2 RD2 RD3': ['archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'ARC1 ARC2 RD2 RD3': ['archer-1', 'archer-2', 'rider-2', 'rider-3'],
  'ARC1 ARC2 SP2 RD2 RD3': ['archer-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'ARC1 RD1 ARC2 SP2 RD2 RD3': ['archer-1', 'rider-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  "Kai's 7": ['archer-1', 'spearman-1', 'rider-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'ARC1 SP1 RD1': ['archer-1', 'spearman-1', 'rider-1'],
  ARC1: ['archer-1'],
  "owner's SW1 SP2 RD2 RD3": ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3'],
};
const EMH_COUNTS = [10, 20, 30, 40, 50, 60, 70, 80, 92];
const ADV_COUNTS: Record<string, number[]> = {
  'arbalester-6': [0, 10, 20, 40, 60, 76],
  'legionary-6': [0, 10, 20, 40, 60, 72],
  'chariot-6': [0, 10, 20, 30, 37],
};
const RECOVERY: Record<string, string[]> = {
  'retrain all troops, revive mercs': [],
  'revive G3 + mercs, retrain the rest': ['rider-3'],
  'revive G3 + tier 2 + mercs': ['rider-3', 'archer-2', 'spearman-2', 'rider-2'],
  'revive everything': [
    'rider-3',
    'archer-2',
    'spearman-2',
    'rider-2',
    'archer-1',
    'spearman-1',
    'rider-1',
    'swordsman-1',
  ],
};

interface Design {
  name: string;
  recovery: string;
  damage: number;
  silver: number;
  gold: number;
  emhLost: number;
  advLost: number;
  march: string;
}

function minLeadership(request: StackRequest, full: StackResult): Record<string, number> {
  const mercMax = Math.max(0, ...full.stacks.filter((s) => s.pool === 'authority').map((s) => s.totalHp));
  const troops = full.stacks.filter((s) => s.pool === 'leadership');
  const counts: Record<string, number> = {};
  for (const s of full.stacks) counts[s.unitId] = s.count;
  if (troops.length === 0 || mercMax === 0) return counts;
  const minTroopHp = Math.min(...troops.map((s) => s.totalHp));
  const factor = Math.min(1, (mercMax + 1) / minTroopHp);
  for (const s of troops) counts[s.unitId] = Math.max(1, Math.ceil(s.count * factor));
  for (let guard = 0; guard < 50; guard += 1) {
    const ev = evaluateCounts(request, counts);
    const low = Math.min(...ev.result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp));
    if (low > mercMax) break;
    for (const s of troops) counts[s.unitId] = (counts[s.unitId] ?? 0) + 1;
  }
  return counts;
}

describe.skipIf(!process.env.THEORY)('E11 weekly', () => {
  it('finds the best weekly routine per advanced-mercenary burn', () => {
    const report = new Report('11-weekly');
    const owner = loadOwner();
    const b = scenarioB(owner.twelve);
    const byId = new Map(b.units.map((u) => [u.id, u]));
    report.add(
      `Weekly incomes: silver ${n(SILVER_WEEK)}, gold ${n(GOLD_WEEK)}, EMH6 ${EMH_WEEK}. Advanced mercenaries (ABT6/LGN6/CHR6) do not come back; their weekly burn is the row parameter. Scenario B, temple 15, 4 squads. Marches per week may be fractional (a steady-state average).`,
    );

    const designs: Design[] = [];
    let evaluated = 0;
    for (const [setName, troops] of Object.entries(SETS)) {
      for (const e of EMH_COUNTS) {
        for (const a of ADV_COUNTS['arbalester-6'] ?? []) {
          for (const l of ADV_COUNTS['legionary-6'] ?? []) {
            for (const c of ADV_COUNTS['chariot-6'] ?? []) {
              const caps = { [EMH]: e, 'arbalester-6': a, 'legionary-6': l, 'chariot-6': c };
              const mercIds = [EMH, ...ADV].filter((id) => ((caps as Record<string, number>)[id] ?? 0) > 0);
              for (const method of ['ms', 'elite'] as const) {
                for (const lead of ['full L', 'min L'] as const) {
                  if (lead === 'min L' && method === 'elite') continue;
                  const req = withMethod(withCaps(withUnits(b, [...troops, ...mercIds]), caps), method);
                  let ev = evaluate(req);
                  if (lead === 'min L') ev = evaluateCounts(req, minLeadership(req, ev.result));
                  evaluated += 1;
                  const emhLost = ev.result.stacks
                    .filter((s) => s.unitId === EMH)
                    .reduce((sum, s) => sum + chunks(s.count), 0);
                  const advLost = ev.result.stacks
                    .filter((s) => ADV.includes(s.unitId))
                    .reduce((sum, s) => sum + chunks(s.count), 0);
                  const march = ev.result.stacks
                    .map((st) => `${label(st.unitId)} ${n(st.count)}`)
                    .join(' · ');
                  for (const [recName, revived] of Object.entries(RECOVERY)) {
                    let silver = 0;
                    let gold = 0;
                    for (const stack of ev.result.stacks) {
                      const unit = byId.get(stack.unitId);
                      if (!unit) continue;
                      if (stack.pool === 'authority' || revived.includes(stack.unitId)) {
                        const cost = reviveOne(unit, stack.count, req.recovery);
                        silver += cost.silver;
                        gold += cost.gold;
                      } else silver += retrainOne(unit, stack.count, req.recovery).silver;
                    }
                    designs.push({
                      name: `${setName} · EMH6 ${e} ABT6 ${a} LGN6 ${l} CHR6 ${c} · ${method} · ${lead}`,
                      recovery: recName,
                      damage: ev.summary.avgDamage,
                      silver,
                      gold,
                      emhLost,
                      advLost,
                      march,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    report.add(`${n(evaluated)} marches simulated, ${n(designs.length)} (march, recovery) designs.`);

    const perWeek = (d: Design, burn: number): number => {
      const bySilver = SILVER_WEEK / d.silver;
      const byGold = d.gold > 0 ? GOLD_WEEK / d.gold : Infinity;
      const byEmh = d.emhLost > 0 ? EMH_WEEK / d.emhLost : Infinity;
      const byAdv = d.advLost > 0 ? burn / d.advLost : Infinity;
      return Math.min(bySilver, byGold, byEmh, byAdv);
    };
    const head =
      '| advanced burn / week | marches / week | damage / week | damage / march | silver / week | gold / week | EMH6 lost / week | binding | recovery | march |\n|---|---|---|---|---|---|---|---|---|---|';
    const line = (d: Design, burn: number): string => {
      const k = perWeek(d, burn);
      const binding = [
        [SILVER_WEEK / d.silver, 'silver'],
        [d.gold > 0 ? GOLD_WEEK / d.gold : Infinity, 'gold'],
        [d.emhLost > 0 ? EMH_WEEK / d.emhLost : Infinity, 'EMH6'],
        [d.advLost > 0 ? burn / d.advLost : Infinity, 'advanced'],
      ].sort((x, y) => (x[0] as number) - (y[0] as number))[0]?.[1];
      return `| ${burn} | ${k.toFixed(2)} | ${n(Math.round(k * d.damage))} | ${n(d.damage)} | ${n(Math.round(k * d.silver))} | ${n(Math.round(k * d.gold))} | ${(k * d.emhLost).toFixed(1)} | ${String(binding)} | ${d.recovery} | ${d.march} |`;
    };

    report.h('Best weekly routine per advanced-mercenary burn');
    const summary: string[] = [head];
    for (const burn of BURNS) {
      const ranked = [...designs].sort((x, y) => perWeek(y, burn) * y.damage - perWeek(x, burn) * x.damage);
      const best = ranked[0];
      if (best) summary.push(line(best, burn));
      report.add(
        `\n**burn ${burn} advanced mercenaries a week — top 8**\n${head}\n${ranked
          .slice(0, 8)
          .map((d) => line(d, burn))
          .join('\n')}`,
      );
    }
    report.h('Summary');
    report.add(summary.join('\n'));

    report.h('Reference designs under the same weekly incomes (burn as they need)');
    const refs = designs.filter(
      (d) =>
        (d.name.startsWith("owner's") &&
          d.name.includes('EMH6 40 ABT6 40 LGN6 40 CHR6 20') &&
          d.name.includes('ms · full L')) ||
        (d.name.startsWith("Kai's 7") &&
          d.name.includes('EMH6 20 ABT6 20 LGN6 20 CHR6 10') &&
          d.name.includes('ms · full L')) ||
        (d.name.startsWith('ARC2 SP2 RD2 RD3') &&
          d.name.includes('EMH6 60 ABT6 60 LGN6 60 CHR6 30') &&
          d.name.includes('ms · full L')) ||
        (d.name.startsWith('ARC2 RD2 RD3') &&
          d.name.includes('EMH6 80 ABT6 76 LGN6 72 CHR6 37') &&
          d.name.includes('ms · full L')),
    );
    report.add(`${head}\n${refs.map((d) => line(d, 30)).join('\n')}`);
    report.save();
  });
});
