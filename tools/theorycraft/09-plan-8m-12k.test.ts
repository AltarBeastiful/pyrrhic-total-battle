/**
 * E9 — the owner's actual question (2026-09-14): 8 M silver, ~12 k gold, stock 92/76/72/37, temple 15.
 * Which plan gives the most total damage? Every design is played march by march: the mercenaries'
 * revival gold is mandatory (unrevived mercenaries are gone), the remaining gold may revive troop types
 * in silver-saved-per-gold order (RD3 268, tier 2 191, tier 1 115), silver pays the rest. The campaign
 * stops before a march it cannot pay for in silver or in gold. Stock decays by ceil(n/10) per stack.
 * `THEORY=1 pnpm vitest run tools/theorycraft/09-plan-8m-12k.test.ts`
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

const SILVER = Number(process.env.SILVER ?? 8_000_000);
const GOLD = Number(process.env.GOLD ?? 12_000);
const MAX_MARCHES = 60;

const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];
const SETS: Record<string, string[]> = {
  'ARC2 RD2 RD3': ['archer-2', 'rider-2', 'rider-3'],
  'ARC2 SP2 RD2 RD3': ['archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'ARC1 ARC2 RD2 RD3': ['archer-1', 'archer-2', 'rider-2', 'rider-3'],
  'ARC1 ARC2 SP2 RD2 RD3': ['archer-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  "Kai's 7 (ARC1 SP1 RD1 ARC2 SP2 RD2 RD3)": [
    'archer-1',
    'spearman-1',
    'rider-1',
    'archer-2',
    'spearman-2',
    'rider-2',
    'rider-3',
  ],
  'ARC1 SP1 RD1': ['archer-1', 'spearman-1', 'rider-1'],
  ARC1: ['archer-1'],
  "owner's SW1 SP2 RD2 RD3": ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3'],
};
const SPENDS: Record<string, number[]> = {
  full: [92, 76, 72, 37],
  '70/60/60/30': [70, 60, 60, 30],
  '50/40/40/20': [50, 40, 40, 20],
  '30/20/20/10': [30, 20, 20, 10],
  '20/20/10/10': [20, 20, 10, 10],
};
/** Troop types revived with gold, in silver-saved-per-gold order. */
const REVIVES: Record<string, string[]> = {
  none: [],
  RD3: ['rider-3'],
  'RD3 + tier 2': ['rider-3', 'archer-2', 'spearman-2', 'rider-2'],
  'all troops': [
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

interface Plan {
  name: string;
  marches: number;
  damage: number;
  silver: number;
  gold: number;
  perMarch: number[];
  stoppedBy: string;
  left: string;
  firstMarch: string;
}

function minLeadership(request: StackRequest, full: StackResult): Record<string, number> {
  // Scale the troop counts of the full-leadership march down until the smallest troop stack is just
  // above the biggest mercenary stack (Kai's rule and the sizer's, at the least silver).
  const mercMax = Math.max(0, ...full.stacks.filter((s) => s.pool === 'authority').map((s) => s.totalHp));
  const troops = full.stacks.filter((s) => s.pool === 'leadership');
  const counts: Record<string, number> = {};
  for (const s of full.stacks) counts[s.unitId] = s.count;
  if (troops.length === 0 || mercMax === 0) return counts;
  const minTroopHp = Math.min(...troops.map((s) => s.totalHp));
  const factor = Math.min(1, (mercMax + 1) / minTroopHp);
  for (const s of troops) counts[s.unitId] = Math.max(1, Math.ceil(s.count * factor));
  // Guarantee the order after integer rounding.
  for (let guard = 0; guard < 50; guard += 1) {
    const ev = evaluateCounts(request, counts);
    const low = Math.min(...ev.result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp));
    if (low > mercMax) break;
    for (const s of troops) counts[s.unitId] = (counts[s.unitId] ?? 0) + 1;
  }
  return counts;
}

describe.skipIf(!process.env.THEORY)('E9 plan 8 M / 12 k', () => {
  it('plays every design under the budgets', () => {
    const report = new Report('09-plan-8m-12k');
    const owner = loadOwner();
    const b = scenarioB(owner.twelve);
    const unitById = new Map(b.units.map((u) => [u.id, u]));
    report.add(
      `Budgets: silver ${n(SILVER)}, gold ${n(GOLD)} (temple 15, ÷1.53). Stock 92/76/72/37. Scenario B. Up to ${MAX_MARCHES} marches.`,
    );
    const plans: Plan[] = [];

    for (const [setName, troops] of Object.entries(SETS)) {
      for (const [spendName, spend] of Object.entries(SPENDS)) {
        for (const method of ['ms', 'elite'] as const) {
          for (const lead of ['full L', 'min L'] as const) {
            if (lead === 'min L' && method === 'elite') continue;
            for (const [reviveName, revived] of Object.entries(REVIVES)) {
              const stock: Record<string, number> = {
                'epic-monster-hunter-6': 92,
                'arbalester-6': 76,
                'legionary-6': 72,
                'chariot-6': 37,
              };
              let silver = 0;
              let gold = 0;
              let damage = 0;
              const perMarch: number[] = [];
              let stoppedBy = 'marches';
              let firstMarch = '';
              for (let m = 0; m < MAX_MARCHES; m += 1) {
                const caps = Object.fromEntries(
                  MERCS.map((id, i) => [id, Math.min(spend[i] ?? 0, stock[id] ?? 0)]),
                );
                if (Object.values(caps).every((c) => c === 0)) {
                  stoppedBy = 'stock';
                  break;
                }
                const req = withMethod(withCaps(withUnits(b, [...troops, ...MERCS]), caps), method);
                let ev = evaluate(req);
                if (lead === 'min L') ev = evaluateCounts(req, minLeadership(req, ev.result));
                // Bill the march.
                let s = 0;
                let g = 0;
                for (const stack of ev.result.stacks) {
                  const unit = unitById.get(stack.unitId);
                  if (!unit) continue;
                  if (stack.pool === 'authority' || revived.includes(stack.unitId)) {
                    const cost = reviveOne(unit, stack.count, req.recovery);
                    s += cost.silver;
                    g += cost.gold;
                  } else {
                    s += retrainOne(unit, stack.count, req.recovery).silver;
                  }
                }
                if (silver + s > SILVER) {
                  stoppedBy = 'silver';
                  break;
                }
                if (gold + g > GOLD) {
                  stoppedBy = 'gold';
                  break;
                }
                silver += s;
                gold += g;
                damage += ev.summary.avgDamage;
                perMarch.push(ev.summary.avgDamage);
                if (m === 0)
                  firstMarch = ev.result.stacks.map((st) => `${label(st.unitId)} ${n(st.count)}`).join(' · ');
                for (const stack of ev.result.stacks) {
                  if (stack.pool === 'authority')
                    stock[stack.unitId] = Math.max(0, (stock[stack.unitId] ?? 0) - chunks(stack.count));
                }
              }
              plans.push({
                name: `${setName} · ${spendName} · ${method} · ${lead} · revive ${reviveName}`,
                marches: perMarch.length,
                damage,
                silver: Math.round(silver),
                gold: Math.round(gold),
                perMarch,
                stoppedBy,
                left: MERCS.map((id) => stock[id]).join('/'),
                firstMarch,
              });
            }
          }
        }
      }
    }

    plans.sort((a, b2) => b2.damage - a.damage);
    const line = (p: Plan): string =>
      `| ${p.name} | ${p.marches} | ${n(p.damage)} | ${n(Math.round(p.damage / Math.max(1, p.marches)))} | ${n(p.silver)} | ${n(p.gold)} | ${p.stoppedBy} | ${p.left} | ${p.firstMarch} |`;
    const head =
      '| plan | marches | total damage | avg per march | silver | gold | stopped by | stock left | first march |\n|---|---|---|---|---|---|---|---|---|';
    report.h('Top 25 plans by total damage');
    report.add(`${head}\n${plans.slice(0, 25).map(line).join('\n')}`);
    report.h('Best plan whose every march deals at least …');
    for (const floor of [2e6, 3e6, 4e6, 5e6, 6e6, 7e6]) {
      const best = plans.find((p) => p.marches > 0 && Math.min(...p.perMarch) >= floor);
      report.add(`\n**≥ ${n(floor)} per march** → ${best ? line(best) : 'nothing'}`);
      if (best) report.add(`per march: ${best.perMarch.map((d) => n(d)).join(', ')}`);
    }
    report.h('Per-march damage of the top 3');
    for (const p of plans.slice(0, 3)) report.add(`- ${p.name}: ${p.perMarch.map((d) => n(d)).join(', ')}`);
    report.save();
  });
});
