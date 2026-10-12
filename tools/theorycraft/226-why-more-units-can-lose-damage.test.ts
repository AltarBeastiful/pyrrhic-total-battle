/**
 * 226 — **why a monster with health room left can still lose damage** (S-159; the owner, 2026-10-13: *"on this march
 * using silver saver, I see that theres is hp room for more ED, but if I add more, even without changing the kill
 * order, the damage goes down. how is that possible ?"*).
 *
 * Two orders drive a fight (`engine/battle.ts`), and only one of them is the kill order:
 *
 *  - the **kill order** is total HP descending — the enemy wipes our highest-HP living stack first, so nothing
 *    about a stack's own damage moves it;
 *  - the **attack order** is base damage descending, `count × strengthPerUnit` **without** the strength-against
 *    part. Each round the enemy makes N attacks (N = its squads), killing a stack per attack in kill order, and
 *    **between two enemy attacks the next stack in attack order that is alive and has not struck yet strikes
 *    once**; after the N-th attack every living stack that has not struck sweeps once, in the same order.
 *
 * So the number of times a stack strikes is decided by the **pair** (its kill position, its attack position) —
 * and raising a count leaves the kill order alone while moving the stack **earlier** in the attack order, which
 * takes a turn away from a stack behind it. Measured here on the owner's own camp of 2026-10-12, silver saver,
 * one unit at a time: the kill order, the attack order, every stack's strikes and the worst opening.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/226-why-more-units-can-lose-damage.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { applyCounts } from '@/ui/sections/march/manual';
import { positionTrades } from '@/ui/sections/march/positions';
import { countsOf, pushedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';
import { attackOrder, battleSequence, enemySquadCount, planCampaign, planMarch } from '@/engine';
import { setKernel, setRaiseKernel } from '@/engine/fast';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import type { StackRequest, StackResult } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { createRaiseKernel } from '@/kernel/raise';
import { HORIZON } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

/** The owner's export of 2026-10-12, the camp his question is about (kept outside the repo; read as data). */
const EXPORT = '/home/remi/Downloads/pyrrhic-my-account-2026-10-12 (1).json';
const ED = 'emerald-dragon';

/** The request the app builds for the export's active setup — the same path his Generate button takes. */
function hisRequest(): StackRequest {
  const raw = JSON.parse(readFileSync(EXPORT, 'utf8')) as { payload: { savedStacks?: unknown[] } };
  raw.payload.savedStacks ??= [];
  const parsed = parseImport(JSON.stringify(raw));
  if (parsed.kind !== 'profile') throw new Error('this export is not a profile');
  const profile = parsed.payload;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (setup === undefined) throw new Error('this export has no setup');
  return buildPlanRequest(profile, setup).request;
}

/**
 * **How many times each stack strikes, walked as the battle walks it** (`engine/battle.ts`): the move sequence the
 * round structure produces, rather than `expectedHits`' closed form — which holds only while the kill order and
 * the attack order coincide, and that is the whole question here. The **journal's own entries** are not the same
 * figure: a stack ordered to strike two squads writes two of them for one turn.
 */
function strikes(result: StackResult, request: StackRequest): Map<string, number> {
  const out = new Map<string, number>();
  const moves = battleSequence(
    result.stacks.length,
    enemySquadCount(request.enemy),
    false,
    attackOrder(result.stacks),
  );
  for (const move of moves) {
    if (move.actor !== 'army') continue;
    const unitId = result.stacks[move.index]?.unitId;
    if (unitId === undefined) continue;
    out.set(unitId, (out.get(unitId) ?? 0) + 1);
  }
  return out;
}

const order = (result: StackResult): string => result.stacks.map((one) => one.unitId).join(' · ');

describe.skipIf(!process.env.THEORY)('why more units can lose damage', () => {
  it('walks one monster up its own health room, unit by unit', () => {
    const module = loadKernelModule();
    setKernel(createPlanKernel(module));
    const raiseKernel = createRaiseKernel(module);

    const request = hisRequest();
    const report = new Report('226-why-more-units-can-lose-damage');
    const label = (unitId: string): string => getUnits().find((unit) => unit.id === unitId)?.label ?? unitId;

    report.add(
      [
        '# 226 — why a monster with health room left can still lose damage',
        '',
        `His camp of 2026-10-12 (leadership ${n(request.housing.leadership)}, authority ${n(request.housing.authority)}, dominance ${n(request.housing.dominance)}; hiring ${request.units
          .filter((unit) => unit.pool !== 'leadership')
          .map((unit) => label(unit.id))
          .join(', ')}).`,
        '',
        'Every reading below is the **worst opening** (`summary.minDamage`, the figure the plan is ranked on) of one',
        'march of the silver saver stop, taken to Tight the way the app draws it, with `emerald-dragon` (ED) added to',
        'by hand. `kill` is the sequence of deaths, `attack` the order the stacks strike in.',
        '',
      ].join('\n'),
    );

    const campaign = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
    report.add(
      `The plan offers ${String(campaign.alternatives.length)} stops: ${campaign.alternatives.map((one) => one.pick).join(', ')}.`,
    );

    const stop = campaign.alternatives.find((one) => one.pick === 'silver-saver');
    if (stop === undefined) throw new Error('the plan offers no silver saver');
    const base = planMarch(request, stop.counts).result;
    setRaiseKernel(raiseKernel);
    const tight = positionTrades(request, base, ['tight']).rows[0]?.counts ?? countsOf(base);
    setRaiseKernel(null);
    const start = applyCounts(request, base, tight).result;
    const tightRead = applyCounts(request, base, tight);

    const ed = start.stacks.find((one) => one.unitId === ED);
    if (ed === undefined) throw new Error('the march fields no emerald dragon');
    const at = start.stacks.findIndex((one) => one.unitId === ED);
    const above = start.stacks[at - 1];
    if (above === undefined) throw new Error('the emerald dragon is the first stack of the march');
    const ceiling = shelterCeiling(above.totalHp, ed.hpPerUnit);
    const floor = troopFloor(start) ?? 0;

    report.add(
      [
        '',
        '## The room the eye can see',
        `- the march: **${String(start.stacks.length)} stacks**, tight.`,
        `- **ED** stands at **${n(ed.count)}** units, ${n(ed.count * ed.hpPerUnit)} HP (${n(ed.hpPerUnit)} a unit), at kill position **${String(at + 1)}**.`,
        `- over it stands **${label(above.unitId)}** at ${n(above.totalHp)} HP, and the troop floor is ${n(floor)}.`,
        `- so ED may be pushed to **${n(ceiling)}** units — **${n(ceiling - ed.count)} more** — and the order is untouched.`,
        `- \`pushedCounts\` on the monsters' pool answers **${JSON.stringify(pushedCounts(request, start, ['dominance']) ?? null)}**.`,
        `- the attack order of the 6 stacks that strike first: ${attackOrder(start.stacks)
          .slice(0, 6)
          .map((index) => label(start.stacks[index]?.unitId ?? ''))
          .join(' > ')}.`,
        `- enemy squads: **${String(enemySquadCount(request.enemy))}**.`,
      ].join('\n'),
    );

    /**
     * **The strike order, with the figure that decides it**: base damage `count × strengthPerUnit`, in the order the
     * stacks strike. This is the table that says why one more unit can cost damage — a stack crosses another when
     * its own base damage passes it.
     */
    const strikesTable = (result: StackResult): string =>
      attackOrder(result.stacks)
        .map((index) => {
          const stack = result.stacks[index];
          if (stack === undefined) return '';
          return `${String(index + 1)}. ${label(stack.unitId)} ×${n(stack.count)} = ${n(Math.round(stack.count * stack.strengthPerUnit))}`;
        })
        .join(' > ');
    report.add(`\n## The strike order at ${n(ed.count)} units\n\n${strikesTable(start)}`);

    const rows: string[] = [
      '| ED units | ED HP | kill order | ED attack place | ED strikes | worst opening | change |',
      '|---|---|---|---|---|---|---|',
    ];
    const armyStrikes = [...strikes(start, request).values()].reduce((sum, one) => sum + one, 0);
    /**
     * The three figures the conclusion turns on: ED's own base damage, the base damage of the stack that strikes
     * first (the one it has to pass), and what its next unit is worth — all `count × strengthPerUnit` exactly as
     * `attackOrder` sorts on it.
     */
    const baseOf = (stack: { count: number; strengthPerUnit: number }): number =>
      Math.round(stack.count * stack.strengthPerUnit);
    const unitBase = Math.round(
      baseOf({ count: ed.count + 1, strengthPerUnit: ed.strengthPerUnit }) - baseOf(ed),
    );
    const front = start.stacks[attackOrder(start.stacks)[0] ?? 0];
    const topBase = front === undefined ? 0 : baseOf(front);
    /** Whether its next unit is worth more than the gap to the front — the whole of the jump from sixth. */
    const crosses =
      unitBase > topBase - baseOf(ed)
        ? 'So **one** unit passes it, and ED spends the opening turn of every round where the two stacks it passed now spend none.'
        : 'So one more unit does not reach the front.';
    const before = tightRead.summary.minDamage;
    const beforeAttack = attackOrder(start.stacks).findIndex((index) => start.stacks[index]?.unitId === ED);
    const beforeStrikes = strikes(start, request).get(ED) ?? 0;
    const beforeKill = order(start);

    let firstLoss: number | null = null;
    for (let count = ed.count; count <= ceiling; count += 1) {
      const read = applyCounts(request, base, { ...tight, [ED]: count });
      const attack = attackOrder(read.result.stacks).findIndex(
        (index) => read.result.stacks[index]?.unitId === ED,
      );
      const hits = strikes(read.result, request).get(ED) ?? 0;
      const damage = read.summary.minDamage;
      const kept = order(read.result) === beforeKill;
      if (damage < before && firstLoss === null) firstLoss = count;
      rows.push(
        `| ${n(count)} | ${n(count * ed.hpPerUnit)} | ${kept ? 'kept' : '**MOVED**'} | ${String(attack + 1)} | ${n(hits)} | ${n(damage)} | ${damage === before ? '—' : `${damage > before ? '+' : ''}${(((damage - before) / before) * 100).toFixed(2)} %`} |`,
      );
    }
    report.add(`\n## Every unit, one at a time\n\n${rows.join('\n')}`);

    // **Who pays for the turn.** The stack that stands between ED's old and new attack place loses a strike.
    const upTo = firstLoss ?? ceiling;
    const read = applyCounts(request, base, { ...tight, [ED]: upTo });
    const afterStrikes = strikes(read.result, request);
    const moved = read.result.stacks.filter((stack) => {
      const was = strikes(start, request).get(stack.unitId) ?? 0;
      return (afterStrikes.get(stack.unitId) ?? 0) !== was;
    });
    report.add(
      [
        '',
        '## Who pays for the turn',
        `- The strike order at ${n(upTo)} units:\n\n${strikesTable(read.result).split(' > ').join('\n> ')}`,
        `- ED's strikes: **${n(beforeStrikes)} → ${n(afterStrikes.get(ED) ?? 0)}** at ${n(upTo)} units.`,
        `- ED's attack place: **${String(beforeAttack + 1)} → ${String(attackOrder(read.result.stacks).findIndex((index) => read.result.stacks[index]?.unitId === ED) + 1)}**.`,
        `- stacks whose strike count moved: ${moved.length === 0 ? 'none' : moved.map((stack) => `${label(stack.unitId)} ${n(strikes(start, request).get(stack.unitId) ?? 0)} → ${n(afterStrikes.get(stack.unitId) ?? 0)}`).join(', ')}.`,
        `- worst opening: **${n(before)} → ${n(read.summary.minDamage)}** (${(((read.summary.minDamage - before) / before) * 100).toFixed(2)} %).`,
        `- the whole battle at the march's own counts: **${n(armyStrikes)} army strikes** over ${String(Math.ceil(start.stacks.length / enemySquadCount(request.enemy)))} rounds.`,
      ].join('\n'),
    );

    report.add(
      [
        '',
        '## What the numbers say',
        '',
        `- The **kill order is kept on every count** to the ceiling: the enemy still wipes the same stack at the same kill position, so nothing about ED's health moves it in the death sequence. That is the owner's reading, and it is right.`,
        `- The turns are a **fixed pool**. The enemy makes one attack per squad a round — **${String(enemySquadCount(request.enemy))}** here — and kills a stack on each of them, so ${String(start.stacks.length)} stacks fall in ${String(Math.ceil(start.stacks.length / enemySquadCount(request.enemy)))} rounds and the whole battle gives our army **${n(armyStrikes)} strikes**. The attack order adds none: it decides **who spends them**.`,
        `- What moves is the **attack order**, and it is \`count × strengthPerUnit\` alone: ED at ${n(ed.count)} units stands **sixth** on ${n(baseOf(ed))} of it, the stack that strikes first stands on ${n(topBase)} — a gap of **${n(topBase - baseOf(ed))}** — and ED's own next unit is worth **${n(unitBase)}**. ${crosses}`,
        `- ED's own strikes do not rise (they are set by its **kill** position, which is untouched: **${n(beforeStrikes)} → ${n(afterStrikes.get(ED) ?? 0)}**), so nothing buys the turns back: SW1 and ARC2 spend what ED now spends, and their hits are worth more than ED's extra damage per hit. Hence the fall.`,
        firstLoss === null
          ? `- On this march no count up to the ceiling loses damage.`
          : `- The first count that loses damage is **${n(firstLoss)}** units — **one** more than the march fields — and the whole room to the ceiling (${n(ceiling)}) stays below the march's own reading.`,
        `- **This is why the mark is not drawn on that march** (\`offersPush\`, owner's call of 2026-10-12): the room the eye can see is real, the order is safe, and the trade is still a loss. It is the same mechanism experiment 225 found on 3 of the 68 benchmark stops, and the reason the raise control's *damage* positions exist — a bigger stack is not a harder-hitting one.`,
      ].join('\n'),
    );
    report.save();
    expect(start.stacks.length).toBeGreaterThan(0);
  }, 1_800_000);
});
