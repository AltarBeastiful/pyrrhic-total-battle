/**
 * 76 — what a March edit does to a **planned** march (owner, 2026-09-15: *"Before when I left out a troop, it
 * would equilibrate again the troops and mercs if needed. Now it doesn't change anymore."*).
 *
 * The edit is `resizeMarch` (`src/ui/sections/march/generate.ts`), and it makes **two** filters, not one:
 *
 *   1. `generate.ts` stores, for a plan run, `caps: { ...request.caps, ...chosen.counts }` — the plan's own
 *      counts become the caps of the march;
 *   2. `resizeMarch` calls the **sizer** with `units` filtered down to `includedUnitIds`, which after a plan
 *      Generate is `Object.keys(chosen.counts)` — i.e. the types the plan actually fields, not the account's
 *      whole army.
 *
 * Both have to be reproduced or the measurement is of a different call. This file runs the real one for
 * every leave-out (a troop of the plan's own set) and every put-back (a type the plan left out), and prints
 * the whole march before and after.
 *
 * **What it found, and what the March does now** (2026-09-15): with the plan's troop counts *also* used as
 * caps, every surviving type was already at its ceiling, so a leave-out dropped a stack and left its
 * leadership unused — nothing equilibrated. `generate.ts` now caps **only the hired spend** at the plan's
 * counts (§"The fix"), which is the last table here. `THEORY=1 pnpm vitest run tools/theorycraft/76-plan-resize.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { Report, loadOwner, n, scenarioC, withCaps, withHousing, withMethod } from './harness';

const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};

const show = (result: StackResult): string =>
  result.stacks.map((stack) => `${stack.unitId} ${n(stack.count)}`).join(' · ');

/** The march as the March pane copies it out: in request order, so the two runs line up by eye. */
const asMarch = (request: StackRequest, included: Set<string>): string =>
  show(sizeStacks({ ...request, units: request.units.filter((unit) => included.has(unit.id)) }));

describe.skipIf(!process.env.THEORY)('leaving a troop out of a planned march', () => {
  it('measures the two filters the March edit really applies', () => {
    const report = new Report('76-plan-resize');
    const owner = loadOwner();
    const base = scenarioC(
      withCaps(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }), HELD),
    );

    const plan = planCampaign({ request: base, marchTarget: 10, alternatives: 4 });
    const chosen = plan.recommend ?? plan;
    const counts = chosen.counts;
    const planned = new Set(Object.keys(counts));

    // What `generate.ts` stores, and what `resizeMarch` therefore re-sizes.
    const stored: StackRequest = { ...withMethod(base, 'elite'), caps: { ...base.caps, ...counts } };
    const troops = base.units.filter((unit) => unit.pool === 'leadership');
    const inMarch = troops.filter((unit) => planned.has(unit.id));
    const leftOut = troops.filter((unit) => !planned.has(unit.id));

    report.h('The plan, and the march Generate puts on screen');
    report.add(`plan: **${plan.marches} marches**`);
    report.add(
      `its march: ${Object.entries(counts)
        .map(([id, count]) => `${id} ${n(count)}`)
        .join(' · ')}`,
    );
    report.add(
      `the types the edit re-sizes (\`includedUnitIds\`): ${[...planned].join(' · ')}\n\n` +
        `the caps it re-sizes them under: ${Object.entries(stored.caps)
          .map(([id, count]) => `${id} ${n(count)}`)
          .join(' · ')}`,
    );

    report.h('Leaving each troop type **of the march** out, the way the pill does');
    report.add('| left out | the march after the re-size | same as before? |');
    report.add('|---|---|---|');
    for (const unit of inMarch) {
      const included = new Set([...planned].filter((id) => id !== unit.id));
      const after = asMarch(stored, included);
      report.add(
        `| ${unit.id} | ${after} | ${after === asMarch(stored, planned) ? '**no change**' : 'changed'} |`,
      );
    }

    report.h('Putting back each type the plan left out');
    report.add('| put back | the march after the re-size | same as before? |');
    report.add('|---|---|---|');
    for (const unit of leftOut) {
      const included = new Set([...planned, unit.id]);
      const after = asMarch(stored, included);
      report.add(
        `| ${unit.id} | ${after} | ${after === asMarch(stored, planned) ? '**no change**' : 'changed'} |`,
      );
    }

    report.h("The same leave-outs, with the plan's counts **not** used as caps");
    report.add(
      "The one filter removed: the caps are the stock and the account's own ceilings, so a surviving troop " +
        'may take up the leadership a left-out one frees.',
    );
    report.add('| left out | the march after the re-size |');
    report.add('|---|---|');
    const stockCaps: StackRequest = { ...withMethod(base, 'elite'), caps: { ...base.caps } };
    for (const unit of inMarch) {
      const included = new Set([...planned].filter((id) => id !== unit.id));
      report.add(`| ${unit.id} | ${asMarch(stockCaps, included)} |`);
    }

    report.h("The fix: only the **hired** spend capped at the plan's — what the March does now");
    report.add(
      'The plan rations the hired stock; the troops are rationed by leadership, which the sizer already ' +
        "respects. Capping the troop types at the plan's own counts is what leaves a left-out stack's " +
        'leadership unused — so only the hired counts are capped, and the survivors take the leadership up. ' +
        "**This is what `generate.ts` stores now**: 2026-09-15, on the owner's report that a leave-out had " +
        'stopped changing anything.',
    );
    report.add('| left out | the march after the re-size |');
    report.add('|---|---|');
    const hired = new Set(base.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id));
    const hiredCaps: Record<string, number> = {};
    for (const [id, count] of Object.entries(counts)) {
      if (hired.has(id)) hiredCaps[id] = count;
    }
    const proposed: StackRequest = { ...withMethod(base, 'elite'), caps: { ...base.caps, ...hiredCaps } };
    report.add(
      `its caps: ${Object.entries({ ...base.caps, ...hiredCaps })
        .map(([id, count]) => `${id} ${n(count)}`)
        .join(' · ')}`,
    );
    for (const unit of inMarch) {
      const included = new Set([...planned].filter((id) => id !== unit.id));
      report.add(`| ${unit.id} | ${asMarch(proposed, included)} |`);
    }
    report.add('\nPutting back, under the same caps:');
    report.add('| put back | the march after the re-size |');
    report.add('|---|---|');
    for (const unit of leftOut) {
      const included = new Set([...planned, unit.id]);
      report.add(`| ${unit.id} | ${asMarch(proposed, included)} |`);
    }

    report.add(
      `\nFor reference, the account's own ceilings: ${Object.entries(base.caps)
        .map(([id, count]) => `${id} ${n(count)}`)
        .join(' · ')}`,
    );

    report.save();
  });
});
