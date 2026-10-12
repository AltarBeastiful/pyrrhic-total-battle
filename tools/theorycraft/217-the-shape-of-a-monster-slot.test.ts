/**
 * 217 — **the shape of one slot** (follows 216: the `Tight` box is multiplied out by the monster stacks, which
 * the authority burn cap never touches, and the widest stop is 1.9 × 10²⁵ vectors over 19 monster slots).
 *
 * Before a rule can cut a box, the census has to say what the box is *for*. A slot is a count on one stack,
 * and the march's damage is linear in that count **while the total-HP order of the stacks does not move**
 * (`battle.ts`: a stack's hits are its kill position's, and the kill order is total HP descending, so for a
 * fixed order the damage is `Σ nᵢ × hits(rankᵢ) × strengthᵢ`). So the question this experiment answers, slot by
 * slot, on the widest stops the benchmark holds: where does the best count sit — at an end of the range, or
 * inside it — and how much of the range is even worth looking at?
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/217-the-shape-of-a-monster-slot.test.ts`
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { RAISE_TIGHT } from '@/engine/fast';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { applyCounts } from '@/ui/sections/march/manual';
import { shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

/** The camps whose boxes 216 found widest, by a fragment of their label. */
const CAMPS = [
  'monster tiers 3–7 at 20 000 dominance',
  'monster tiers 3–5 at 900 dominance',
  'the owner’s live camp of 2026-09-18',
];
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

interface Slot {
  id: string;
  pool: string;
  from: number;
  to: number;
  cost: number;
  width: number;
}

function slotsOf(request: StackRequest, base: StackResult): Slot[] {
  const floor = troopFloor(base);
  if (floor === null) return [];
  const costOf = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  return base.stacks
    .filter((stack) => stack.count > 0 && (stack.pool === 'authority' || stack.pool === 'dominance'))
    .map((stack) => {
      const to = Math.min(shelterCeiling(floor, stack.hpPerUnit), request.caps[stack.unitId] ?? MAX_SAFE);
      return {
        id: stack.unitId,
        pool: stack.pool,
        from: stack.count,
        to,
        cost: costOf.get(stack.unitId) ?? 0,
        width: to - stack.count + 1,
      };
    })
    .filter((slot) => slot.to > slot.from);
}

function countsOf(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const stack of base.stacks) out[stack.unitId] = stack.count;
  return out;
}

describe.skipIf(!process.env.THEORY)('the shape of a slot', () => {
  it('sweeps each slot of the widest stops around the search’s own answer', () => {
    const module = loadKernelModule();
    const report = new Report('217-the-shape-of-a-monster-slot');
    report.add(
      [
        "For each wide stop: the slots, the damage at **all-from** and **all-to**, the `Tight` search's own",
        "answer, and then a one-slot sweep around it — where the best count sits (`end` = at the range's own",
        "end, `in` = interior), and the width of the band within 0.1 % of the sweep's best.",
        '',
        '| stop | slots | all-from | all-to | search | search at |',
        '|---|---:|---:|---:|---:|---|',
      ].join('\n'),
    );
    for (const scenario of criteriaScenarios()) {
      if (!CAMPS.some((fragment) => scenario.label.includes(fragment))) continue;
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      for (const stop of plan.alternatives) {
        const request = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const slots = slotsOf(request, base);
        if (slots.length === 0) continue;
        const damage = (counts: Record<string, number>): number =>
          applyCounts(request, base, counts).summary.minDamage;

        const own = countsOf(base);
        const atFrom = { ...own };
        for (const slot of slots) atFrom[slot.id] = slot.from;
        const atTo = { ...own };
        for (const slot of slots) atTo[slot.id] = slot.to;

        const kernel = createRaiseKernel(module);
        const answer = kernel.position({
          request,
          base,
          modes: { authority: RAISE_TIGHT, dominance: RAISE_TIGHT },
        });
        const winner = { ...own, ...(answer?.counts ?? {}) };
        const winnerDamage = damage(winner);
        // Where the search's counts sit: at the slot's floor, its ceiling, or between them.
        const where = slots
          .map((slot) => {
            const count = winner[slot.id] ?? slot.from;
            const at = count <= slot.from ? 'from' : count >= slot.to ? 'to' : 'in';
            return at;
          })
          .join('');

        report.add(
          [
            `| ${scenario.label} · ${stop.pick} | ${slots.length} | ${n(damage(atFrom))} | ${n(damage(atTo))} |`,
            `${n(winnerDamage)} | ${where} |`,
          ].join(' '),
        );

        report.add(`\n**${scenario.label} · ${stop.pick}** — ${slots.length} slots, ${answer?.how}`);
        report.add('| slot | pool | from | to | width | cost | own | raised | sweep best | at | band |');
        report.add('|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|');
        for (const slot of slots) {
          if (slot.width > 4000) {
            report.add(
              `| ${slot.id} | ${slot.pool} | ${slot.from} | ${slot.to} | ${n(slot.width)} | ${slot.cost} | ${slot.from} | ${winner[slot.id] ?? slot.from} | — | — | — |`,
            );
            continue;
          }
          let bestCount = slot.from;
          let bestDamage = -Infinity;
          const values: { count: number; damage: number }[] = [];
          for (let count = slot.from; count <= slot.to; count += 1) {
            const value = damage({ ...winner, [slot.id]: count });
            values.push({ count, damage: value });
            if (value > bestDamage) {
              bestDamage = value;
              bestCount = count;
            }
          }
          const band = values.filter((one) => one.damage >= bestDamage * 0.999).length;
          const held = winner[slot.id] ?? slot.from;
          const at = bestCount <= slot.from ? 'end-from' : bestCount >= slot.to ? 'end-to' : 'in';
          report.add(
            `| ${slot.id} | ${slot.pool} | ${slot.from} | ${slot.to} | ${slot.width} | ${slot.cost} | ${slot.from} | ${held} | ${bestCount} | ${at}${bestCount === held ? ' (held)' : ' **MOVE**'} | ${band}/${slot.width} |`,
          );
        }
      }
    }
    report.save();
    expect(true).toBe(true);
  }, 900_000);
});
