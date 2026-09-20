/**
 * 118 — **is a full leadership pool always the right march?** (owner, 2026-09-20: *"we were supposed to
 * also explore using a bit less leadership, if the damage is still good and the ratios are better."*)
 *
 * Every march the app has ever offered fills the leadership pool to the last point it can. That is one
 * assumption, never measured: the sizer's whole job is *"how big can each stack be"*, and the plan's stops
 * vary the army by **dropping whole types** (S-99, S-111), which under-fills leadership only as a side
 * effect of a type leaving. Nothing has ever asked what happens when the same march is fielded **smaller**.
 *
 * The dial here is the housing figure itself: size the army for 95 %, 90 %, 80 %… of the leadership the
 * account actually has, and read the fight. Three armies, on both sides of the hired line, because the
 * mechanism that could pay is a hired one: **mercenaries cost authority, not leadership** (0015, 0019), and
 * the enemy destroys the **highest-HP stack first**, so the troops are what shelters them. Shrinking the
 * troops shrinks the silver bill and leaves the hired damage where it is — until the troop stacks fall
 * under the hired ones' HP, at which point the shelter breaks and the hired damage goes with it.
 *
 * Every figure below is `simulateBattle` on the sized march and `recoveryCosts` on its stacks; damage is
 * the **worst opening** (`minDamage`, S-108), which is what the recap and the bar read.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/118-less-leadership.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { worstDamageByPool } from '../../src/ui/sections/march/worst';
import { EXPORT_2026_09_17, Report, evaluateCounts, loadLiveAccount, n, table } from './harness';

/** The dial, as a share of the leadership the account holds. */
const FILLS = [100, 97, 95, 92, 90, 85, 80, 75, 70, 65, 60, 50, 40, 30, 20] as const;

interface Reading {
  fill: number;
  leadership: number;
  used: number;
  damage: number;
  silver: number;
  seconds: number;
  gold: number;
  hiredDamage: number;
  troopDamage: number;
  hiredUnitsLost: number;
  /** The smallest troop stack's total HP — the floor a hired stack has to stay under to be sheltered. */
  troopFloor: number;
  /** The biggest hired stack's total HP. Above the floor, the enemy comes for it first. */
  hiredTop: number;
  /** Hired stacks that land at least one blow in the worst opening, over the hired stacks fielded. */
  hiredStriking: number;
  hiredStacks: number;
  /** Blows the hired stacks land between them, worst opening. */
  hiredHits: number;
  stacks: number;
}

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  const setup = profile?.setups[0];
  if (!profile || !setup) throw new Error('no first-run profile');
  return { profile, setup };
}

/** Size and fight the army the ladder would field for `leadership` points, and price the losses. */
function readAt(base: StackRequest, leadership: number): Reading {
  const request: StackRequest = {
    ...base,
    housing: { ...base.housing, leadership },
    // The tier ladder, so the dial is the only thing moving between rows.
    options: { ...base.options, method: 'elite' },
  };
  const result = sizeStacks(request);
  const { summary } = evaluateCounts(request, Object.fromEntries(
    result.stacks.map((stack) => [stack.unitId, stack.count]),
  ));
  const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
  const troops = result.stacks.filter((stack) => stack.pool !== 'authority');
  const hired = result.stacks.filter((stack) => stack.pool === 'authority');
  // Who actually swings, read off the journal rather than argued from the HP: the enemy destroys the
  // highest-HP stack standing, so a stack's place in the queue — not its size — decides its blows.
  const blows = new Map<string, number>();
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor === 'army') blows.set(entry.unitId, (blows.get(entry.unitId) ?? 0) + 1);
  }
  // The **worst opening**, not the midpoint: `summary.damageByPool` splits `avgDamage`, and a stack that
  // strikes nothing in the bad flip still carries a share of it (S-108). Every other figure in this row is
  // the worst opening, and two arithmetics on one row is exactly the bug S-108 was written for.
  const worst = worstDamageByPool(summary.journals.enemyFirst, result.stacks);
  return {
    fill: 0,
    leadership,
    used: result.pools.leadership.used,
    damage: summary.minDamage,
    silver: bill.silver,
    seconds: bill.seconds,
    gold: bill.gold,
    hiredDamage: worst.authority,
    troopDamage: worst.leadership + worst.dominance,
    hiredUnitsLost: hiredLost(result.stacks),
    troopFloor: troops.length === 0 ? 0 : Math.min(...troops.map((stack) => stack.totalHp)),
    hiredTop: hired.length === 0 ? 0 : Math.max(...hired.map((stack) => stack.totalHp)),
    hiredStriking: hired.filter((stack) => (blows.get(stack.unitId) ?? 0) > 0).length,
    hiredStacks: hired.length,
    hiredHits: hired.reduce((sum, stack) => sum + (blows.get(stack.unitId) ?? 0), 0),
    stacks: result.stacks.length,
  };
}

const pct = (part: number, whole: number): string =>
  whole === 0 ? '—' : `${n(Math.round((part / whole) * 1000) / 10)} %`;

describe.skipIf(!process.env.THEORY)('less leadership', () => {
  it('turns the dial down on three armies and reads every fight', () => {
    const report = new Report('118-less-leadership');

    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const own = parsed.payload;
    const ownSetup = own.setups[0];
    if (!ownSetup) throw new Error('no setup');
    const live = loadLiveAccount();
    const { profile: fresh, setup: freshSetup } = firstRun();

    const armies = [
      {
        name: 'a first-run army, 12 000 leadership (hires nothing)',
        profile: fresh,
        setup: { ...freshSetup, housing: { ...freshSetup.housing, leadership: 12_000 } },
      },
      {
        name: 'the live account, 20 000 leadership · 83 epic monster hunters',
        profile: live.profile,
        setup: live.setup,
      },
      {
        name: 'the 2026-09-17 export, its own setup (7 000 leadership, four hired types)',
        profile: own,
        setup: ownSetup,
      },
    ] as const;

    for (const army of armies) {
      report.h(army.name);
      const base = buildStackRequest(army.profile, army.setup);
      const full = base.housing.leadership;
      const rows = FILLS.map((fill) => ({
        ...readAt(base, Math.floor((full * fill) / 100)),
        fill,
      }));
      const top = rows[0];
      if (!top) throw new Error('no reading');

      report.add('');
      report.add(
        '| leadership | used | stacks | damage | of full | silver | of full | damage a silver | hired damage | hired lost | queue (s) |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|---|');
      for (const row of rows) {
        report.add(
          `| ${n(row.fill)} % (${n(row.leadership)}) | ${n(row.used)} | ${row.stacks} | ${n(row.damage)} | ${pct(
            row.damage,
            top.damage,
          )} | ${n(row.silver)} | ${pct(row.silver, top.silver)} | ${n(
            Math.round((row.silver > 0 ? row.damage / row.silver : 0) * 100) / 100,
          )} | ${n(row.hiredDamage)} | ${n(row.hiredUnitsLost)} | ${n(row.seconds)} |`,
        );
      }

      // Where the dial actually pays, if anywhere: the best rate, and the cheapest march that still
      // deals 95 % of what the full pool deals.
      const rate = (row: Reading): number => (row.silver > 0 ? row.damage / row.silver : 0);
      const bestRate = rows.reduce((best, row) => (rate(row) > rate(best) ? row : best));
      const good = rows.filter((row) => row.damage >= top.damage * 0.95);
      const cheapestGood = good.reduce((best, row) => (row.silver < best.silver ? row : best));
      report.add('');
      report.add(
        `**Best damage a silver**: ${n(bestRate.fill)} % of the pool — ${n(
          Math.round(rate(bestRate) * 100) / 100,
        )} against ${n(Math.round(rate(top) * 100) / 100)} at the full pool (**${pct(
          rate(bestRate) - rate(top),
          rate(top),
        )}** better), for ${pct(bestRate.damage, top.damage)} of the damage.`,
      );
      for (const floor of [95, 90, 85] as const) {
        const allowed = rows.filter((row) => row.damage >= (top.damage * floor) / 100);
        const pick = allowed.reduce((best, row) => (rate(row) > rate(best) ? row : best), allowed[0] ?? top);
        report.add('');
        report.add(
          `**Best rate that still deals ${String(floor)} % of the damage**: ${n(pick.fill)} % of the pool — ${n(
            Math.round(rate(pick) * 100) / 100,
          )} damage a silver (${pct(rate(pick) - rate(top), rate(top))} better than the full pool), ${n(
            pick.damage,
          )} damage, ${n(pick.silver)} silver, saving ${n(top.silver - pick.silver)}.`,
        );
      }

      report.add('');
      report.add(
        `**Cheapest march still worth 95 % of the damage**: ${n(cheapestGood.fill)} % of the pool — ${n(
          cheapestGood.damage,
        )} damage (${pct(cheapestGood.damage, top.damage)}) for ${n(cheapestGood.silver)} silver (${pct(
          cheapestGood.silver,
          top.silver,
        )}), saving ${n(top.silver - cheapestGood.silver)}.`,
      );

      // The shelter, where there is one to break: the troops' smallest stack against the hired top.
      if (top.hiredStacks > 0) {
        report.add('');
        report.add(
          'The shelter, read off the journal — a hired stack strikes only while troop stacks stand above it in the queue:',
        );
        report.add('');
        report.add(
          '| leadership | smallest troop stack HP | biggest hired stack HP | hired stacks striking | hired blows | hired damage | of full |',
        );
        report.add('|---|---|---|---|---|---|---|');
        for (const row of rows) {
          report.add(
            `| ${n(row.fill)} % | ${n(row.troopFloor)} | ${n(row.hiredTop)} | ${String(
              row.hiredStriking,
            )} of ${String(row.hiredStacks)} | ${String(row.hiredHits)} | ${n(row.hiredDamage)} | ${pct(
              row.hiredDamage,
              top.hiredDamage,
            )} |`,
          );
        }

        // Where the hired damage falls off a cliff, the two marches either side of it are printed in
        // full: the mechanism is the kill order, and a kill order is a table, not an argument.
        const cliff = rows.findIndex(
          (row, index) => index > 0 && row.hiredDamage < (rows[index - 1]?.hiredDamage ?? 0) * 0.5,
        );
        const before = cliff > 0 ? rows[cliff - 1] : undefined;
        const after = cliff > 0 ? rows[cliff] : undefined;
        if (before && after) {
          for (const row of [before, after]) {
            const request: StackRequest = {
              ...base,
              housing: { ...base.housing, leadership: row.leadership },
              options: { ...base.options, method: 'elite' },
            };
            const sized = sizeStacks(request);
            report.add('');
            report.add(`**${n(row.fill)} % of the pool** — the march in kill order:`);
            report.add('');
            report.add(
              table(
                evaluateCounts(
                  request,
                  Object.fromEntries(sized.stacks.map((stack) => [stack.unitId, stack.count])),
                ),
              ),
            );
          }
        }
      }

      // **The floor, in closed form.** The tier ladder sizes every rung to nearly the same total HP —
      // 837,840 … 826,198 on the live account at 75 % — so the whole troop wall crosses the tallest hired
      // stack at one fill rather than one rung at a time, which is why the hired damage falls off a cliff
      // instead of sloping. That predicts the cliff exactly: the lowest rung is `troopFloor × fill`, and it
      // has to stay above `hiredTop`, so the dial is safe down to `hiredTop / troopFloor` and no further.
      // The prediction is *tested* here by bisection to the nearest 0.1 % rather than asserted.
      if (top.hiredStacks > 0 && top.hiredDamage > 0) {
        const predicted = (top.hiredTop / top.troopFloor) * 100;
        let safe = 100;
        let broken = 0;
        for (let step = 0; step < 14; step += 1) {
          const mid = (safe + broken) / 2;
          const reading = readAt(base, Math.floor((full * mid) / 100));
          if (reading.hiredDamage >= top.hiredDamage) safe = mid;
          else broken = mid;
        }
        report.add('');
        report.add(
          top.hiredTop < top.troopFloor
            ? `**The floor**: the lowest rung is \`${n(top.troopFloor)} × fill\` and the tallest hired stack is ${n(
                top.hiredTop,
              )}, so the ladder predicts the shelter breaking at **${n(
                Math.round(predicted * 10) / 10,
              )} %** of the pool. Bisection finds the last fill that keeps every hired blow at **${n(
                Math.round(safe * 10) / 10,
              )} %** — ${Math.abs(safe - predicted) <= 1 ? 'the prediction holds' : '**the prediction misses**'}.`
            : `**No floor to fall through**: the tallest hired stack (${n(
                top.hiredTop,
              )}) already stands above the lowest rung (${n(
                top.troopFloor,
              )}) at the full pool, so the hired stacks are at the head of the queue before the dial is touched and shrinking the troops cannot move them. Bisection confirms it: every hired blow survives to ${n(
                Math.round(safe * 10) / 10,
              )} % of the pool. This army's dial costs troop damage and nothing else.`,
        );
      }

      // The dial against the plan's own stops: one frontier, two families.
      const stops = planCampaign(buildPlanRequest(army.profile, army.setup)).alternatives;
      const priced = stops.map((stop) => {
        const { result, summary } = evaluateCounts(base, stop.counts);
        const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
        return { name: stop.pick, damage: summary.minDamage, silver: bill.silver, family: 'plan' as const };
      });
      const dialled = rows.map((row) => ({
        name: `${String(row.fill)} % of the pool`,
        damage: row.damage,
        silver: row.silver,
        family: 'dial' as const,
      }));
      const both = [...priced, ...dialled];
      const frontier = both
        .filter(
          (one) =>
            !both.some(
              (other) =>
                other !== one &&
                other.damage >= one.damage &&
                other.silver <= one.silver &&
                (other.damage > one.damage || other.silver < one.silver),
            ),
        )
        .sort((a, b) => a.silver - b.silver);
      report.add('');
      report.add(
        `**The joint frontier** — the plan's ${String(priced.length)} stops and the dial's ${String(
          dialled.length,
        )} marches, on (damage, silver) together. ${String(
          frontier.filter((one) => one.family === 'dial').length,
        )} of the ${String(frontier.length)} undominated marches come from the dial:`,
      );
      report.add('');
      report.add('| silver | damage | march | from |');
      report.add('|---|---|---|---|');
      for (const one of frontier) {
        report.add(`| ${n(one.silver)} | ${n(one.damage)} | ${one.name} | ${one.family} |`);
      }
    }

    report.save();
  }, 600_000);
});
