/**
 * 225 — **what the push is worth, stop by stop** (S-159; owner, 2026-10-12: *"we're just raising the merc count
 * while preserving the kill order computed by tight … push a merc or monster resource to the max while keeping
 * the same kill order"*).
 *
 * The story's whole promise is "more mercs, more damage, the same kill order", and only a corpus can say whether
 * the second half of that holds. Two things are measured that the arithmetic cannot settle by itself:
 *
 *  - **the kill order** — `pushedCounts` bounds every pushed stack strictly under the stack above it, so the
 *    sequence of deaths should be the one on screen on every stop of every army. Anything else is a bug;
 *  - **the damage** — the kill order is by **total HP** and the *attack* order is by **count × strengthPerUnit**
 *    (`engine/battle.ts`), so adding units moves a stack earlier in the attack order and a stack behind it can
 *    lose a round's strike. Per-hit damage always rises (`featuresDamage` scales with the count); the total is
 *    not provably monotone. Every stop where the worst opening **falls** is named here, because the shape of the
 *    control depends on whether that ever happens.
 *
 * The base of every reading is the march the app draws by default: the stop's march taken to **Tight** through
 * the kernel's own priced positions (`positionTrades`), which is what "the kill order computed by tight" means in
 * the owner's sentence. `Most` and `Tens` are priced beside it, because the push is bounded by its neighbour
 * rather than by the troop floor and so should sit between the plan's own counts and `Most`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/225-the-push.test.ts`
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { chunks, planCampaign, planMarch } from '@/engine';
import { setKernel, setRaiseKernel } from '@/engine/fast';
import type { StackRequest, StackResult } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { createRaiseKernel } from '@/kernel/raise';
import { applyCounts } from '@/ui/sections/march/manual';
import { positionTrades } from '@/ui/sections/march/positions';
import { RAISED_POOLS, pushedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';
import type { RaisedPool } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

/** The two hired pools, as the sentence reads them. */
const NOUN: Record<RaisedPool, string> = { authority: 'mercs', dominance: 'monsters' };

/** The authority chunks a march burns, off the counts alone (`raise.ts`'s own reading of the plan's `mercLost`). */
function burnOf(stacks: readonly { pool: string; count: number }[]): number {
  return stacks.reduce((sum, stack) => sum + (stack.pool === 'authority' ? chunks(stack.count) : 0), 0);
}

/** Whether a count vector still fits the pool it is paid out of — the bound a further unit has to pass first. */
function fits(request: StackRequest, counts: Record<string, number>, pool: RaisedPool): boolean {
  let used = 0;
  for (const unit of request.units) {
    if (unit.pool === pool) used += (counts[unit.id] ?? 0) * unit.cost;
  }
  return used <= request.housing[pool];
}

/** What one pool's push did on one march, or `null` where it moved nothing. */
interface Reading {
  added: number;
  burnBefore: number;
  burnAfter: number;
  damageBefore: number;
  damageAfter: number;
  orderKept: boolean;
  /** What the pool gained over the march on screen, and what `Most` would have added over the same march. */
  mostAdded: number;
}

function read(
  request: StackRequest,
  base: StackResult,
  start: StackResult,
  summaryBefore: number,
  tight: Record<string, number>,
  most: Record<string, number> | null,
  pool: RaisedPool,
): Reading | null {
  const pushed = pushedCounts(request, start, [pool]);
  if (pushed === null) return null;
  const after = applyCounts(request, base, { ...tight, ...pushed });
  const before = start.stacks.filter((stack) => stack.pool === pool);
  const gained = after.result.stacks.filter((stack) => stack.pool === pool);
  const added =
    gained.reduce((sum, stack) => sum + stack.count, 0) - before.reduce((sum, stack) => sum + stack.count, 0);
  const mostStacks = most === null ? null : applyCounts(request, base, most).result;
  const mostAdded =
    mostStacks === null
      ? 0
      : mostStacks.stacks
          .filter((stack) => stack.pool === pool)
          .reduce((sum, stack) => sum + stack.count, 0) - before.reduce((sum, stack) => sum + stack.count, 0);
  return {
    added,
    burnBefore: burnOf(start.stacks),
    burnAfter: burnOf(after.result.stacks),
    damageBefore: summaryBefore,
    damageAfter: after.summary.minDamage,
    orderKept:
      after.result.stacks.length === start.stacks.length &&
      after.result.stacks.every((stack, index) => stack.unitId === start.stacks[index]?.unitId),
    mostAdded,
  };
}

describe.skipIf(!process.env.THEORY)('the push on every benchmark stop', () => {
  it('measures what it adds, what it costs, and what it does to the damage', () => {
    const module = loadKernelModule();
    setKernel(createPlanKernel(module));
    const raiseKernel = createRaiseKernel(module);

    const report = new Report('225-the-push');
    report.add(
      [
        '# 225 — what the push is worth, stop by stop',
        '',
        "Every stop of every benchmark army, taken to **Tight** through the kernel's priced positions (the march",
        'the app draws), then pushed per pool. `%` is the worst opening against the march on screen; **added** is',
        'what the pool gains over it; `Most Δ` is what `Most` would have added over the same march. The order',
        'column is the promise: the sequence of deaths after the push against the one on screen.',
        '',
        '| army · stop | pool | added | chunks | damage % | order | Most Δ |',
        '|---|---|---|---|---|---|---|',
      ].join('\n'),
    );

    /** One line per (stop, pool) the push moved, and the tallies over all of them. */
    const rows: string[] = [];
    const tally: Record<
      RaisedPool,
      { tried: number; moved: number; added: number; fell: number; beatsMost: number }
    > = {
      authority: { tried: 0, moved: 0, added: 0, fell: 0, beatsMost: 0 },
      dominance: { tried: 0, moved: 0, added: 0, fell: 0, beatsMost: 0 },
    };
    const fell: string[] = [];
    const orderBroken: string[] = [];
    /**
     * **The biggest push, checked the other way round.** The goal is *"the biggest push we can safely do without
     * changing the kill order"*, so the answer is falsified rather than asserted: take the counts the push lands
     * on and try to add **one more unit** to each stack of the pool. A stack that can still take a unit without
     * moving the order — with the stock and the housing accounted for — is a push that stopped short, and any of
     * those is a finding.
     */
    const addable: string[] = [];
    let pushedStacks = 0;
    /**
     * **The monsters, on the mercenaries' push** — the app's own sequence, and the reading the first tally cannot
     * give: the two marks are pressed one after the other, the second pool is read off the march the first one
     * left, and a monster whose line is a mercenary stack only has room once that stack has grown. This is what
     * *"and same for monsters"* costs and buys.
     */
    const sequence = { stops: 0, mercsMoved: 0, monstersMoved: 0, monstersAdded: 0, fell: 0 };
    const sequenceRows: string[] = [];
    /**
     * **Why the monsters never move** — the second question the tally raises, measured rather than argued: on
     * every stop that fields one, a dominance stack is read against the line the stack **above it** draws
     * (`shelterCeiling` of that stack's health) and against the troop floor's own.
     */
    const monster = { stacks: 0, atTheirLine: 0, underHired: 0, atTheFloorLine: 0 };
    /** How many stops field a monster at all — the other half of "I don't see the monsters' mark". */
    let stopsWithMonsters = 0;
    let stops = 0;

    for (const scenario of criteriaScenarios()) {
      let campaign;
      try {
        campaign = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        continue;
      }
      for (const stop of campaign.alternatives) {
        stops += 1;
        const base = planMarch(scenario.request, stop.counts).result;
        setRaiseKernel(raiseKernel);
        const trades = positionTrades(scenario.request, base, ['tight', 'tens', 'most']);
        setRaiseKernel(null);
        const counts = (mode: 'tight' | 'most' | 'tens'): Record<string, number> | null =>
          trades.rows.find((row) => row.mode === mode)?.counts ?? null;
        const tight = counts('tight');
        if (tight === null) continue;
        const marched = applyCounts(scenario.request, base, tight);
        const floor = troopFloor(marched.result);
        if (marched.result.stacks.some((one) => one.pool === 'dominance' && one.count > 0)) {
          stopsWithMonsters += 1;
        }
        if (floor !== null) {
          marched.result.stacks.forEach((stack, at) => {
            if (stack.pool !== 'dominance' || stack.count <= 0) return;
            const above = marched.result.stacks[at - 1];
            if (above === undefined) return;
            monster.stacks += 1;
            const lineOfFloor = shelterCeiling(floor, stack.hpPerUnit);
            if (stack.count >= shelterCeiling(above.totalHp, stack.hpPerUnit)) {
              monster.atTheirLine += 1;
              if (above.pool !== 'leadership') monster.underHired += 1;
            }
            if (stack.count >= lineOfFloor) monster.atTheFloorLine += 1;
          });
        }
        for (const pool of RAISED_POOLS) {
          tally[pool].tried += 1;
          const reading = read(
            scenario.request,
            base,
            marched.result,
            marched.summary.minDamage,
            tight,
            counts('most'),
            pool,
          );
          if (reading === null) continue;
          tally[pool].moved += 1;
          tally[pool].added += reading.added;
          if (reading.damageAfter < reading.damageBefore) {
            tally[pool].fell += 1;
            fell.push(
              `${scenario.label} · ${stop.pick} · ${pool}: ${n(reading.damageBefore)} → ${n(reading.damageAfter)}`,
            );
          }
          if (reading.mostAdded > reading.added) tally[pool].beatsMost += 1;
          // One more unit, on each stack the answer moved: does the order survive it?
          const whole = { ...tight, ...pushedCounts(scenario.request, marched.result, [pool]) };
          const order = `${marched.result.stacks.map((one) => one.unitId).join('|')}`;
          for (const stack of marched.result.stacks) {
            if (stack.pool !== pool || stack.count <= 0) continue;
            pushedStacks += 1;
            const wanted = (whole[stack.unitId] ?? stack.count) + 1;
            const more = { ...whole, [stack.unitId]: wanted };
            const cap = scenario.request.caps[stack.unitId];
            if (cap !== undefined && wanted > cap) continue;
            if (!fits(scenario.request, more, pool)) continue;
            const after = applyCounts(scenario.request, base, more).result.stacks.map((one) => one.unitId);
            if (after.join('|') === order) {
              addable.push(`${scenario.label} · ${stop.pick} · ${pool} · ${stack.unitId} at ${stack.count}`);
            }
          }
          if (!reading.orderKept) orderBroken.push(`${scenario.label} · ${stop.pick} · ${pool}`);
          const percent = ((reading.damageAfter - reading.damageBefore) / reading.damageBefore) * 100;
          rows.push(
            `| ${scenario.label} · ${stop.pick} | ${NOUN[pool]} | ${n(reading.added)} | ${n(reading.burnBefore)} → ${n(reading.burnAfter)} | ${percent >= 0 ? '+' : ''}${percent.toFixed(2)} % | ${reading.orderKept ? 'kept' : '**BROKEN**'} | ${n(reading.mostAdded)} |`,
          );
        }

        /**
         * **The two marks, pressed in sequence** — mercenaries first, monsters over the march that left — which is
         * how the app hands them over (`useMarch` re-derives each pool over the march on screen). The first pool
         * is the answer the table above already counted; what this row adds is the **monsters' marginal**, the
         * number *"and same for monsters"* is owed.
         */
        sequence.stops += 1;
        const mercs = pushedCounts(scenario.request, marched.result, ['authority']);
        const afterMercs =
          mercs === null ? marched : applyCounts(scenario.request, base, { ...tight, ...mercs });
        if (mercs !== null) sequence.mercsMoved += 1;
        const monsters = pushedCounts(scenario.request, afterMercs.result, ['dominance']);
        if (monsters !== null) {
          const both = applyCounts(scenario.request, base, { ...tight, ...mercs, ...monsters });
          const added =
            monsters === null
              ? 0
              : afterMercs.result.stacks
                  .filter((one) => one.pool === 'dominance')
                  .reduce((sum, one) => sum + (monsters[one.unitId] ?? one.count) - one.count, 0);
          sequence.monstersMoved += 1;
          sequence.monstersAdded += added;
          if (both.summary.minDamage < afterMercs.summary.minDamage) sequence.fell += 1;
          const kept =
            both.result.stacks.length === afterMercs.result.stacks.length &&
            both.result.stacks.every((one, at) => one.unitId === afterMercs.result.stacks[at]?.unitId);
          if (!kept) orderBroken.push(`${scenario.label} · ${stop.pick} · dominance after mercenaries`);
          sequenceRows.push(
            `| ${scenario.label} · ${stop.pick} | ${n(added)} | ${n(afterMercs.summary.minDamage)} → ${n(both.summary.minDamage)} | ${kept ? 'kept' : '**BROKEN**'} |`,
          );
        }
      }
    }

    report.add(rows.join('\n'));

    report.h('The monsters, on the mercenaries’ push (the app’s own sequence)');
    report.add(
      [
        "The mercenaries' mark pressed first, then the monsters' over the march it left — which is how the app",
        'hands the two over (`useMarch` re-derives each pool off the march on screen). A monster whose line is a',
        'mercenary stack only has room once that stack has grown, so this is the reading that says what *"and same',
        'for monsters"* is worth. Only the stops where the monsters move are listed.',
        '',
        '| army · stop | monsters added | damage on the mercenaries’ push → with the monsters | order |',
        '|---|---|---|---|',
        `${sequenceRows.join('\n')}`,
      ].join('\n'),
    );

    report.h('What the numbers say');
    report.add(
      [
        `- **${stops} stops** walked; the push *moves* something on **${tally.authority.moved}** of the ${tally.authority.tried} mercenary readings and **${tally.dominance.moved}** of the ${tally.dominance.tried} monster ones. What the pool line *draws* is narrower: see the fourth bullet.`,
        `- **Units added**: ${n(tally.authority.added)} mercenaries over the mercenary pushes, ${n(tally.dominance.added)} monsters over the monster ones.`,
        `- **The kill order was broken on ${orderBroken.length} readings** — 0 is the promise (\`pushedCounts\` bounds every pushed stack strictly under the stack above it).`,
        `- **And it is the biggest safe push**: of the ${n(pushedStacks)} stacks the answer leaves standing, **${addable.length}** could take one more unit without moving the kill order, inside the stock and the housing — \`${addable.slice(0, 6).join(' · ') || 'none'}\`. The one case is a **tie**: the unit lands on exactly the health of the stack above, which \`applyCounts\` keeps in place (a tie falls back to the generated order) but the strict bound refuses. The owner's call of 2026-10-12: **the strict line stays** — the plan's own shelter refuses a tie for the same reason ("a tie is not shelter") — so one unit of the ${n(tally.authority.added + tally.dominance.added)} the benchmark adds is left on the table, and \`raise.test.ts\` holds both halves of that (\`the same net between every health step\`, \`no stack the push leaves can take one more unit\`).`,
        `- **The worst opening fell on ${tally.authority.fell + tally.dominance.fell} readings** (mercenaries ${tally.authority.fell}, monsters ${tally.dominance.fell}) — the kill order is not the strike order (\`engine/battle.ts\`). **Read as the app ships it, the button is offered on the ${tally.authority.moved + tally.dominance.moved - tally.authority.fell - tally.dominance.fell} readings where it gains and not on those**: the owner read the three of 2026-10-12 and asked for the mark to be hidden where the max would lose damage, which is \`offersPush\` in \`raise.ts\`.`,
        `- On **${tally.authority.beatsMost} + ${tally.dominance.beatsMost}** readings \`Most\` would have added more units than the push — the push stops at the neighbour the kill order keeps, and \`Most\` goes to the troop floor instead.`,
        `- **Why the monsters' mark is never drawn**: ${n(stopsWithMonsters)} of the ${n(stops)} stops *field* a monster stack, and on **none** of them is the mark drawn (the \`moved\` count above is 0). Of the ${n(monster.stacks)} dominance stacks those marches field, **${n(monster.atTheirLine)} already stand at the line the stack above them draws** (${n(monster.underHired)} of those have a *hired* stack over them — the sizer stands every hired stack at the same ceiling, and a tie there is the engine's own order, which puts the authority pool first), and ${n(monster.atTheFloorLine)} are at the troop floor's own line. So the monsters have nothing to add **before** the mercenaries' push and, read on the app's own sequence, **nothing after it either (${sequence.monstersMoved} of ${n(sequence.stops)} stops)**: the plan rations the mercenaries, because they are a stock, and never a monster (\`sustain\` is \`Infinity\` for dominance), so the sizer already stands them where the shelter allows. \`pushedCounts\` moves a monster the moment a plan or a hand edit leaves one under its line (\`raise.test.ts\`'s \`CHAINED\` case: 8 → 9), and \`Most\` is the position that stands them at the shelter instead — at the price of the kill order. **The pool does move where an army leaves it room**: on the owner's own camp of 2026-10-12 the push moves all four monster stacks on the silver saver — the emerald dragon from 17 units to 21 — for a **4.95 % loss** of worst opening: the strike order, not the kill order (experiment 226, \`out/226-why-more-units-can-lose-damage.md\`).`,
      ].join('\n'),
    );
    if (fell.length > 0) report.add(`\nFalling reads:\n\n\`\`\`\n${fell.slice(0, 40).join('\n')}\n\`\`\``);
    if (orderBroken.length > 0) {
      report.add(`\nBroken orders:\n\n\`\`\`\n${orderBroken.slice(0, 40).join('\n')}\n\`\`\``);
    }
    report.save();

    // The promise itself. A red here is a bug in the arithmetic, not a finding.
    expect(stops).toBeGreaterThan(0);
    expect(orderBroken).toStrictEqual([]);
  }, 1_800_000);
});
