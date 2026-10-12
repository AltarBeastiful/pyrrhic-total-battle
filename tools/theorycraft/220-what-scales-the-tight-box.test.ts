/**
 * 220 — **what scales the `Tight` box** (follows 216/217/219; owner, 2026-10-12: *"We also need to think about
 * scaling tight. right now big accounts (high leadership/dominance, more troops type) don't scale well."*)
 *
 * The box is the product of the hired stacks' widths, `Π (to − from + 1)`, over `min(shelter ceiling, stock)` —
 * so it is exponential in the number of hired stacks and linear in each one's stock. This experiment walks one
 * axis at a time on the benchmark's own monster camp (monster tiers 3–7 at 20 000 dominance, experiment 129's
 * army — the camp 216 found widest) and reports the box, the two exact clamps of 216, and the wall the shipped
 * kernel takes on it, so the growth is a table rather than a sentence.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/220-what-scales-the-tight-box.test.ts`
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { RAISE_TIGHT } from '@/engine/fast';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT } as const;

interface Slot {
  pool: string;
  from: number;
  to: number;
  cost: number;
}

function slotsOf(request: StackRequest, base: StackResult): Slot[] {
  const floor = troopFloor(base);
  if (floor === null) return [];
  const costOf = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  return base.stacks
    .filter((stack) => stack.count > 0 && (stack.pool === 'authority' || stack.pool === 'dominance'))
    .map((stack) => ({
      pool: stack.pool,
      from: stack.count,
      to: Math.min(shelterCeiling(floor, stack.hpPerUnit), request.caps[stack.unitId] ?? MAX_SAFE),
      cost: costOf.get(stack.unitId) ?? 0,
    }))
    .filter((slot) => slot.to > slot.from);
}

const chunkTop = (count: number): number => 10 * Math.ceil(count / 10);

/** The box under either clamp: `null` for no clamp, `'top'` for the chunk top, `'top+spare'` for both. */
function boxOf(request: StackRequest, slots: readonly Slot[], clamp: 'none' | 'top' | 'top+spare'): number {
  const spare = (pool: string): number =>
    request.housing[pool as 'authority' | 'dominance'] -
    slots.filter((slot) => slot.pool === pool).reduce((sum, slot) => sum + slot.from * slot.cost, 0);
  let product = 1;
  for (const slot of slots) {
    let to = slot.to;
    if (clamp !== 'none') to = Math.min(to, chunkTop(slot.from));
    if (clamp === 'top+spare' && slot.cost > 0)
      to = Math.min(to, slot.from + Math.floor(spare(slot.pool) / slot.cost));
    product *= Math.max(0, to - slot.from + 1);
  }
  return product;
}

describe.skipIf(!process.env.THEORY)('what scales the tight box', () => {
  it('walks leadership, dominance and the type count one at a time', () => {
    const module = loadKernelModule();
    const report = new Report('220-what-scales-the-tight-box');
    report.add(
      [
        'The **sweet spot** of the benchmark monster camp, one axis moved at a time. *slots* is the hired',
        'stacks the box is the product over (mercenaries/monsters); *box* the shipped space; *top* and',
        "*top+spare* the two exact clamps; *ms* the shipped kernel's wall on that stop.",
        '',
        '| axis | value | slots | box | top | top+spare | walked? | ms |',
        '|---|---:|---:|---:|---:|---:|---|---:|',
      ].join('\n'),
    );

    /** The camp 216 found widest, and the 900-dominance one beside it as the small control. */
    const camp = criteriaScenarios().find((one) =>
      one.label.includes('monster tiers 3–7 at 20 000 dominance'),
    );
    if (camp === undefined) throw new Error('the monster camp is not in the benchmark');

    const rows: { axis: string; value: string; request: StackRequest }[] = [];
    const base = camp.request;
    for (const dominance of [900, 2_000, 5_000, 20_000, 50_000]) {
      rows.push({
        axis: 'dominance',
        value: n(dominance),
        request: { ...base, housing: { ...base.housing, dominance } },
      });
    }
    for (const leadership of [5_000, 10_000, 20_000, 40_000]) {
      rows.push({
        axis: 'leadership',
        value: n(leadership),
        request: { ...base, housing: { ...base.housing, leadership } },
      });
    }
    // The third axis is the *type count*, and it is a property of the account's window, not of a number: the
    // benchmark's own camps are the two readings of it (tiers 3–5 at 900, tiers 3–7 at 20 000), so they are
    // the two rows the axis gets.
    for (const scenario of criteriaScenarios()) {
      if (scenario.label.includes('monster tiers 3–5 at 900 dominance')) {
        rows.push({ axis: 'types (benchmark camp)', value: 'tiers 3–5', request: scenario.request });
      }
    }

    for (const row of rows) {
      let plan;
      try {
        plan = planCampaign({
          request: row.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        report.add(`| ${row.axis} | ${row.value} | plan refused | — | — | — | — | — |`);
        continue;
      }
      const stop = plan.alternatives.find((one) => one.pick === 'sweet-spot') ?? plan.alternatives[0];
      if (stop === undefined) continue;
      const march = planMarch(row.request, stop.counts).result;
      const slots = slotsOf(row.request, march);
      if (slots.length === 0) {
        report.add(`| ${row.axis} | ${row.value} | 0 | 1 | 1 | 1 | — | 0 |`);
        continue;
      }
      const box = boxOf(row.request, slots, 'none');
      const top = boxOf(row.request, slots, 'top');
      const both = boxOf(row.request, slots, 'top+spare');
      const mercs = slots.filter((slot) => slot.pool === 'authority').length;
      const monsters = slots.length - mercs;
      // Only the stops a person can wait on are timed: a 10²⁵ box is 40 s and this is a growth table.
      const worth = box <= 2_000_000;
      let ms = NaN;
      if (worth) {
        const kernel = createRaiseKernel(module);
        const began = performance.now();
        kernel.position({ request: row.request, base: march, modes: MODES });
        ms = performance.now() - began;
      }
      report.add(
        `| ${row.axis} | ${row.value} | ${mercs}m/${monsters}M | ${n(box)} | ${n(top)} | ${n(both)} | ${box <= 300_000 ? 'walked' : 'searched'} | ${worth ? ms.toFixed(0) : '—'} |`,
      );
    }
    report.save();
    expect(rows.length).toBeGreaterThan(0);
  }, 900_000);
});
