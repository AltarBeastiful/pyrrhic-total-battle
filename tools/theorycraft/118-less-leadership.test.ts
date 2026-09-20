/**
 * 118 — **is a full leadership pool always the right march?** (owner, 2026-09-20: *"we were supposed to
 * also explore using a bit less leadership, if the damage is still good and the ratios are better."*)
 *
 * Every march the app has ever offered fills the leadership pool to its last point. That is one assumption,
 * never measured: the sizer's whole job is *"how big can each stack be"*, and the plan's stops vary the army
 * by **dropping whole types** (S-99, S-111), which under-fills leadership only as a side effect of a type
 * leaving. Nothing has ever asked what happens when the same march is fielded **smaller**.
 *
 * **The first run of this experiment got the answer wrong, and the owner caught it** (2026-09-20: *"your
 * cliff explanation is all wrong, merc should have been changed in numbers if the troops shrink. They should
 * always be shielded to do more damage, that's the main point of the calculator!"*). It swept the raw
 * `elite` ladder, which has **no shelter ceiling** — `stacker.ts` applies `troopFloor - 1` only under `ms`,
 * and `planCampaign` applies `shelterUnder` to every shape it answers with (S-87). So the hired count stayed
 * where the authority housing put it while the troops shrank underneath, the hired stack became the tallest
 * on the field, and the damage fell off a cliff that **no march this app offers would ever walk into**. Both
 * sizers are swept below, side by side, because the contrast is the point: the cliff is what the shelter is
 * *for*.
 *
 * The mechanic underneath: the enemy destroys **one stack per attack, always the one with the highest total
 * HP**, so a stack's damage is decided by its kill position. A hired stack sized under the lowest troop rung
 * is killed last and strikes most; one sized over it is killed first and strikes nothing. Turning the dial
 * down lowers the troop floor, so the sheltered hired count has to come down with it — that is the whole
 * interaction, and it is a **ceiling on the hired count**, never a floor under the dial.
 *
 * Every figure is `simulateBattle` on the sized march and `recoveryCosts` on its stacks; damage and the
 * hired/troop split are both the **worst opening** (S-108), because `damageByPool` splits the midpoint and
 * two arithmetics on one row is the bug S-108 was written for.
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

/** `elite` is the ladder with **no** ceiling on the hired stacks; `ms` lowers them under the troop floor. */
type Sizer = 'elite' | 'ms';

interface Reading {
  fill: number;
  leadership: number;
  used: number;
  damage: number;
  silver: number;
  seconds: number;
  gold: number;
  hiredDamage: number;
  hiredUnits: number;
  hiredUnitsLost: number;
  /** The smallest troop stack's total HP — what the shelter ceiling is computed from. */
  troopFloor: number;
  /** The biggest hired stack's total HP. Above the floor, the enemy comes for it first. */
  hiredTop: number;
  /** Hired stacks that land at least one blow in the worst opening, over the hired stacks fielded. */
  hiredStriking: number;
  hiredStacks: number;
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

function requestAt(base: StackRequest, leadership: number, method: Sizer): StackRequest {
  return { ...base, housing: { ...base.housing, leadership }, options: { ...base.options, method } };
}

/** Size and fight the army the sizer would field for `leadership` points, and price the losses. */
function readAt(base: StackRequest, leadership: number, method: Sizer): Reading {
  const request = requestAt(base, leadership, method);
  const result = sizeStacks(request);
  const { summary } = evaluateCounts(
    request,
    Object.fromEntries(result.stacks.map((stack) => [stack.unitId, stack.count])),
  );
  const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
  const troops = result.stacks.filter((stack) => stack.pool !== 'authority');
  const hired = result.stacks.filter((stack) => stack.pool === 'authority');
  // Who actually swings, read off the journal rather than argued from the HP.
  const blows = new Map<string, number>();
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor === 'army') blows.set(entry.unitId, (blows.get(entry.unitId) ?? 0) + 1);
  }
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
    hiredUnits: hired.reduce((sum, stack) => sum + stack.count, 0),
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
const rate = (row: Reading): number => (row.silver > 0 ? row.damage / row.silver : 0);
const per = (value: number, over: number): string => (over > 0 ? n(Math.round(value / over)) : '—');

describe.skipIf(!process.env.THEORY)('less leadership', () => {
  it('turns the dial down with the shelter on and off, and reads every fight', () => {
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
      const sweep = (method: Sizer): Reading[] =>
        FILLS.map((fill) => ({ ...readAt(base, Math.floor((full * fill) / 100), method), fill }));
      const sheltered = sweep('ms');
      const bare = sweep('elite');
      const top = sheltered[0];
      const bareTop = bare[0];
      if (!top || !bareTop) throw new Error('no reading');
      const hires = top.hiredStacks > 0;

      report.add('');
      report.add(
        hires
          ? '**The dial with the shelter on** (`ms` — every hired stack lowered under the lowest troop rung, which is what `planCampaign` does to every shape it answers with, S-87):'
          : '**The dial** (this army hires nothing, so the shelter has nothing to hold and both sizers field the same march):',
      );
      report.add('');
      report.add(
        '| leadership | damage | of full | silver | of full | damage a silver | hired units | hired damage | hired lost | damage a hired unit | queue (s) |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|---|');
      for (const row of sheltered) {
        report.add(
          `| ${n(row.fill)} % (${n(row.leadership)}) | ${n(row.damage)} | ${pct(row.damage, top.damage)} | ${n(
            row.silver,
          )} | ${pct(row.silver, top.silver)} | ${n(Math.round(rate(row) * 100) / 100)} | ${n(
            row.hiredUnits,
          )} | ${n(row.hiredDamage)} | ${n(row.hiredUnitsLost)} | ${per(
            row.hiredDamage,
            row.hiredUnitsLost,
          )} | ${n(row.seconds)} |`,
        );
      }

      if (hires) {
        // The contrast that explains why the shelter exists at all.
        report.add('');
        report.add(
          '**The same dial with the shelter off** (`elite`, which keeps the hired count the authority housing allows however small the troops become) — this is the march the first run of this experiment measured, and the one no plan offers:',
        );
        report.add('');
        report.add(
          '| leadership | hired units | tallest hired stack | lowest troop rung | hired stacks striking | hired damage | total damage | against the sheltered march |',
        );
        report.add('|---|---|---|---|---|---|---|---|');
        for (const [index, row] of bare.entries()) {
          const mirror = sheltered[index];
          report.add(
            `| ${n(row.fill)} % | ${n(row.hiredUnits)} | ${n(row.hiredTop)} | ${n(row.troopFloor)} | ${String(
              row.hiredStriking,
            )} of ${String(row.hiredStacks)} | ${n(row.hiredDamage)} | ${n(row.damage)} | ${
              mirror ? pct(row.damage, mirror.damage) : '—'
            } |`,
          );
        }

        // Where the unsheltered march falls off its cliff, both marches are printed in full: the mechanism
        // is the kill order, and a kill order is a table, not an argument.
        const cliff = bare.findIndex(
          (row, index) => index > 0 && row.hiredDamage < (bare[index - 1]?.hiredDamage ?? 0) * 0.5,
        );
        const at = cliff > 0 ? bare[cliff] : undefined;
        if (at) {
          for (const method of ['elite', 'ms'] as const) {
            const request = requestAt(base, at.leadership, method);
            const sized = sizeStacks(request);
            report.add('');
            report.add(
              `**${n(at.fill)} % of the pool, ${
                method === 'elite' ? 'shelter off' : 'shelter on'
              }** — the march in kill order:`,
            );
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

        // **The ceiling, in closed form.** `stacker.ts` sizes the hired pool under `troopFloor - 1`, and the
        // ladder's rungs all scale with the fill, so the sheltered hired count scales with it too. Predicted
        // against measured at every fill, rather than asserted.
        const unit = top.hiredUnits > 0 ? top.hiredTop / top.hiredUnits : 0;
        if (unit > 0) {
          report.add('');
          report.add(
            `**The ceiling, predicted against measured.** The stacker lowers the hired pool under \`troopFloor - 1\`, so the tallest hired stack may hold \`floor((troopFloor - 1) / ${n(
              Math.round(unit),
            )} HP a unit)\` units — unless its own stock or its authority housing binds first:`,
          );
          report.add('');
          report.add('| leadership | lowest troop rung | ceiling it allows | hired units fielded | what bound |');
          report.add('|---|---|---|---|---|');
          for (const row of sheltered) {
            const allowed = Math.floor((row.troopFloor - 1) / unit);
            report.add(
              `| ${n(row.fill)} % | ${n(row.troopFloor)} | ${n(allowed)} | ${n(row.hiredUnits)} | ${
                row.hiredUnits < allowed ? 'the stock' : 'the shelter'
              } |`,
            );
          }
        }
      }

      // **The crossover.** The hired count is the smaller of two bounds: the stock the account owns and the
      // shelter ceiling `floor((troopFloor - 1) / hp)`. Above the fill where the ceiling still clears the
      // stock, turning the dial down costs troop damage and troop silver only — the hired damage is free,
      // which is why the rate climbs. Below it the shelter binds, and every point of leadership given up
      // takes mercenaries with it. The crossover is `stock × hp / troopFloor` at the full pool, which is the
      // tallest hired stack the account could ever field over the lowest rung it can build.
      if (hires && top.hiredUnits > 0) {
        const crossover = (top.hiredTop / top.troopFloor) * 100;
        const measured = sheltered.find(
          (row) => row.hiredUnits < (top.hiredUnits ?? 0) || row.hiredUnits * 1 < top.hiredUnits,
        );
        const lastFree = [...sheltered].reverse().find((row) => row.hiredUnits >= top.hiredUnits);
        report.add('');
        report.add(
          crossover < 100
            ? `**The crossover**: the stock (${n(top.hiredUnits)} units, ${n(
                top.hiredTop,
              )} HP) still fits under the lowest rung (${n(
                top.troopFloor,
              )}) down to **${n(Math.round(crossover * 10) / 10)} %** of the pool. Measured: the last fill that fields the whole stock is **${n(
                lastFree?.fill ?? 0,
              )} %**, and the first that fields less is ${n(measured?.fill ?? 0)} % (${n(
                measured?.hiredUnits ?? 0,
              )} units). Above the crossover the dial is free of hired cost; below it every point of leadership takes mercenaries with it.`
            : `**No free region**: the stock (${n(top.hiredUnits)} units) already asks ${n(
                Math.round(crossover),
              )} % of this army's lowest rung, so the **shelter is what binds the hired count at the full pool** and the dial takes mercenaries away from the first point it is turned. This army's march is as large as its troops can shelter, and nothing smaller is cheaper *per damage*.`,
        );
      }

      // What the dial is worth, on the march the app would actually field.
      const bestRate = sheltered.reduce((best, row) => (rate(row) > rate(best) ? row : best));
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
        const allowed = sheltered.filter((row) => row.damage >= (top.damage * floor) / 100);
        const pick = allowed.reduce((best, row) => (rate(row) > rate(best) ? row : best), allowed[0] ?? top);
        report.add('');
        report.add(
          `**Best rate that still deals ${String(floor)} % of the damage**: ${n(pick.fill)} % of the pool — ${n(
            Math.round(rate(pick) * 100) / 100,
          )} damage a silver (${pct(rate(pick) - rate(top), rate(top))} better than the full pool), ${n(
            pick.damage,
          )} damage, ${n(pick.silver)} silver saving ${n(top.silver - pick.silver)}, ${n(
            pick.hiredUnitsLost,
          )} hired lost against ${n(top.hiredUnitsLost)}.`,
        );
      }

      // The dial against the plan's own stops: one frontier, two families.
      const stops = planCampaign(buildPlanRequest(army.profile, army.setup)).alternatives;
      const priced = stops.map((stop) => {
        const { result, summary } = evaluateCounts(base, stop.counts);
        const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
        return {
          name: stop.pick,
          damage: summary.minDamage,
          silver: bill.silver,
          burn: hiredLost(result.stacks),
          family: 'plan' as const,
        };
      });
      const dialled = sheltered.map((row) => ({
        name: `${String(row.fill)} % of the pool`,
        damage: row.damage,
        silver: row.silver,
        burn: row.hiredUnitsLost,
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
                other.burn <= one.burn &&
                (other.damage > one.damage || other.silver < one.silver || other.burn < one.burn),
            ),
        )
        .sort((a, b) => a.silver - b.silver);
      report.add('');
      report.add(
        `**The joint frontier** — the plan's ${String(priced.length)} stops and the dial's ${String(
          dialled.length,
        )} sheltered marches, undominated on (damage, silver, **hired lost**) together. ${String(
          frontier.filter((one) => one.family === 'dial').length,
        )} of the ${String(frontier.length)} come from the dial:`,
      );
      report.add('');
      report.add('| silver | damage | hired lost | march | from |');
      report.add('|---|---|---|---|---|');
      for (const one of frontier) {
        report.add(
          `| ${n(one.silver)} | ${n(one.damage)} | ${n(one.burn)} | ${one.name} | ${one.family} |`,
        );
      }
    }

    report.save();
  }, 600_000);
});
