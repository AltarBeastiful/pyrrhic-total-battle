/**
 * 113 — **the monster economy**: where the plan's extra monster chunks go, and what would close the gap
 * (owner, 2026-09-19, reading the S-98 benchmark: monsters and mercenaries are a rare resource, *"more damage
 * with a lot of merc spent should trigger a failing test"*, the bar is ordered on hired burn and the sweet
 * spot is the knee of damage against burn).
 *
 * **The finding this file explains** (`tools/theorycraft/out/benchmark-2026-09-19-16-rare-stock-readings.md`,
 * the monster camp — `monsterCamp()` in `tests/engine/plan-scenarios.ts`: a first-run army at 20 000
 * leadership with monster tiers 3–5 unlocked against a 900-dominance pool, Epic Monster Hunter VI 83 and
 * Bear V 6). The plan's steady max stands at **0.911** of the best sizer sequence on four-march damage and at
 * **0.593** on damage a monster: it burns **84** monster chunks a campaign (28 soldier) where the best sizer
 * sequence burns **47** (30 soldier). The plan buys its damage with monsters the sizer keeps.
 *
 * Everything here is priced exactly as that benchmark prices it — `simulateBattle` on the counts, damage =
 * the **worst opening** (`minDamage`, S-94), the sizer rows re-sized each march on the stock the last one
 * left, the plan under the app's own `CAMPAIGN.planFixes` and `CAMPAIGN.putBack` — and the rare stock is
 * split by the benchmark's own `rareStockOf`/`isMonsterUnit` (`tests/engine/plan-yardsticks.ts`), so a figure
 * here and a figure there are one figure.
 *
 * **No engine change**: every alternative in §D is measured by handing `planCampaign` a different *request*
 * or by re-pricing the marches it answered, never by editing `src/engine/plan.ts`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/113-monster-economy.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine';
import type { CampaignPlan, PlanFrontierRow, PlanTotals } from '../../src/engine/plan';
import { effectiveTable } from '../../src/engine/plan';
import { CHUNK, chunks, recoveryCosts } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';

// The benchmark's own armies and its own rare-stock split: a measurement of the bar's rule has to be taken
// against the yardstick the bar is held to, not against a copy of it (`plan-yardsticks.ts`, S-98).
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import type { Scenario } from '../../tests/engine/plan-scenarios';
import { isMonsterUnit, perMonsterOf, perSoldierOf, rareStockOf } from '../../tests/engine/plan-yardsticks';

import { Report, evaluateCounts, lines, n } from './harness';

const MONSTER_CAMP = 'first-run army, monster tiers 3–5 at 900 dominance';
const pct = (value: number): string => `${(value * 100).toFixed(1)} %`;
const ratio = (value: number): string => value.toFixed(3);

// ---- pricing, the benchmark's own -------------------------------------------------------------------------

interface Priced {
  damage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
}

/** One march as the benchmark prices it: the worst opening, and the recap's four prices. */
function price(request: StackRequest, counts: Record<string, number>): Priced {
  const { summary } = evaluateCounts(request, counts);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    dragonCoins: summary.recovery.dragonCoins,
    seconds: summary.recovery.seconds,
  };
}

interface Campaign {
  name: string;
  kind: 'plan' | 'sizer' | 'hand';
  marches: Record<string, number>[];
  damage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
  burned: number;
  soldiersLost: number;
  monstersLost: number;
  /** Stacks the campaign's **first** march fields, told apart. */
  monsterStacks: number;
  soldierStacks: number;
  troopStacks: number;
  /** Hired stacks of ten units or fewer, over the whole campaign — a whole chunk for a token stack. */
  smallStacks: number;
  /** Distinct monster types the campaign fields anywhere. */
  monsterTypes: number;
}

const hiredIds = (request: StackRequest): string[] =>
  request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id);

function campaignOf(
  request: StackRequest,
  name: string,
  kind: Campaign['kind'],
  marches: Record<string, number>[],
): Campaign {
  const byId = new Map(request.units.map((unit) => [unit.id, unit]));
  const hired = hiredIds(request);
  let damage = 0;
  let silver = 0;
  let gold = 0;
  let dragonCoins = 0;
  let seconds = 0;
  let burned = 0;
  let soldiersLost = 0;
  let monstersLost = 0;
  let smallStacks = 0;
  const types = new Set<string>();
  for (const counts of marches) {
    const priced = price(request, counts);
    damage += priced.damage;
    silver += priced.silver;
    gold += priced.gold;
    dragonCoins += priced.dragonCoins;
    seconds += priced.seconds;
    burned += hired.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
    const rare = rareStockOf(request.units, counts);
    soldiersLost += rare.soldiersLost;
    monstersLost += rare.monstersLost;
    for (const id of hired) {
      const count = Math.floor(counts[id] ?? 0);
      if (count <= 0) continue;
      if (count <= CHUNK) smallStacks += 1;
      const unit = byId.get(id);
      if (unit && isMonsterUnit(unit)) types.add(id);
    }
  }
  const first = marches[0] ?? {};
  let monsterStacks = 0;
  let soldierStacks = 0;
  let troopStacks = 0;
  for (const unit of request.units) {
    const count = Math.floor(first[unit.id] ?? 0);
    if (count <= 0) continue;
    if (unit.pool === 'leadership') troopStacks += 1;
    else if (isMonsterUnit(unit)) monsterStacks += 1;
    else soldierStacks += 1;
  }
  return {
    name,
    kind,
    marches,
    damage,
    silver,
    gold,
    dragonCoins,
    seconds,
    burned,
    soldiersLost,
    monstersLost,
    monsterStacks,
    soldierStacks,
    troopStacks,
    smallStacks,
    monsterTypes: types.size,
  };
}

/** A sizer method played the way a player plays it: Generate, march, lose a chunk, Generate again. */
function greedy(
  base: StackRequest,
  method: 'elite' | 'ms',
  name: string,
  pick: (request: StackRequest) => Record<string, number>,
): Campaign {
  const first: StackRequest = { ...base, options: { ...base.options, method } };
  const hired = hiredIds(first);
  const caps = { ...first.caps };
  const marches: Record<string, number>[] = [];
  for (let index = 0; index < HORIZON; index += 1) {
    const counts = pick({ ...first, caps: { ...caps } });
    if (Object.values(counts).every((count) => count <= 0)) break;
    marches.push(counts);
    for (const id of hired) {
      const cap = caps[id];
      if (cap !== undefined) caps[id] = Math.max(0, cap - chunks(counts[id] ?? 0));
    }
  }
  return campaignOf(first, name, 'sizer', marches);
}

const countsOf = (stacks: { unitId: string; count: number }[]): Record<string, number> =>
  Object.fromEntries(stacks.map((stack) => [stack.unitId, stack.count]));

/** The marches a stop plays, first to last, exactly as `PlanTotals` says to read them. */
const marchesOf = (row: PlanTotals): Record<string, number>[] => {
  if (row.sequence) return row.sequence;
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const marches = Array.from({ length: repeats }, () => row.counts);
  if (row.finaleCounts) marches.push(row.finaleCounts);
  for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
  return marches;
};

const planOf = (request: StackRequest, extra: Record<string, unknown> = {}): CampaignPlan =>
  planCampaign({
    request,
    marchTarget: HORIZON,
    budgetMs: CAMPAIGN.budgets.plan,
    ...CAMPAIGN.planFixes,
    putBack: CAMPAIGN.putBack,
    ...extra,
  });

const perMonster = (row: Campaign): number => perMonsterOf(row.damage, row.monstersLost);
const perSoldier = (row: Campaign): number => perSoldierOf(row.damage, row.soldiersLost);
const perSilver = (row: Campaign): number => (row.silver > 0 ? row.damage / row.silver : NaN);

const ROW_HEAD =
  '| row | damage | silver | a silver | soldier chunks | monster chunks | a soldier | a monster | dragon coins | monster stacks | soldier stacks | troop stacks | hired stacks ≤ 10 | monster types |';
const ROW_RULE = '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
const rowLine = (row: Campaign): string =>
  `| ${row.name} | ${n(row.damage)} | ${n(row.silver)} | ${ratio(perSilver(row))} | ${row.soldiersLost} | ` +
  `${row.monstersLost} | ${n(perSoldier(row))} | ${n(perMonster(row))} | ${n(row.dragonCoins)} | ` +
  `${row.monsterStacks} | ${row.soldierStacks} | ${row.troopStacks} | ${row.smallStacks} | ${row.monsterTypes} |`;

/** One march's stacks in kill order, with the chunk each one costs and the strikes it lands. */
function stackTable(request: StackRequest, counts: Record<string, number>): string[] {
  const byId = new Map(request.units.map((unit) => [unit.id, unit]));
  const evaluated = evaluateCounts(request, counts);
  const out = ['| # | stack | what | count | chunk | total HP | strikes | damage (worst opening) |', '|---|---|---|---|---|---|---|---|'];
  for (const line of lines(evaluated)) {
    const unit = byId.get(line.unitId);
    const what =
      unit === undefined
        ? '?'
        : unit.pool === 'leadership'
          ? 'troop'
          : isMonsterUnit(unit)
            ? `monster (${unit.pool})`
            : `soldier (${unit.pool})`;
    out.push(
      `| ${line.position} | ${line.unitId} | ${what} | ${n(line.count)} | ` +
        `${unit && unit.pool !== 'leadership' ? String(chunks(line.count)) : '—'} | ${n(line.totalHp)} | ` +
        `${line.hitsEnemyFirst} | ${n(line.damageEnemyFirst)} |`,
    );
  }
  return out;
}

// ---- the experiment ---------------------------------------------------------------------------------------

describe.skipIf(!process.env.THEORY)('113 — the monster economy', () => {
  it('measures where the plan’s monster chunks go and what would bring them back', () => {
    const report = new Report('113-monster-economy');
    const all: Scenario[] = [...commonScenarios(), ...(ownerProfile() ? ownerScenarios(ownerProfile()!) : [])];
    const camp = all.find((scenario) => scenario.label.startsWith(MONSTER_CAMP));
    if (!camp) throw new Error('the monster camp is not among the benchmark scenarios');
    const request = camp.request;
    const monsters = request.units.filter((unit) => unit.pool === 'dominance');
    const soldiers = request.units.filter((unit) => unit.pool === 'authority');
    const table = effectiveTable(request);
    const hpOf = new Map(table.map((entry) => [entry.id, entry.hp] as const));

    report.add(
      '# 113 — the monster economy: where the plan’s extra monster chunks go\n\n' +
        'The camp is the benchmark’s own (`monsterCamp()`, `tests/engine/plan-scenarios.ts`): a first-run ' +
        'army at 20 000 leadership with the monster tiers 3–5 unlocked against a **900**-dominance pool, ' +
        'Epic Monster Hunter VI 83 and Bear V 6 on 2 180 authority. Every figure is priced the way ' +
        '`tests/engine/plan-benchmark.test.ts` prices it — `simulateBattle` on the counts, damage = the ' +
        '**worst opening**, four marches, the sizer rows re-sized each march on the stock the last one left ' +
        '— and the rare stock is split by the benchmark’s own `rareStockOf` (`plan-yardsticks.ts`).',
    );
    report.add(
      `\nThe army: **${monsters.length}** dominance monster types, **${soldiers.length}** authority types ` +
        `(${soldiers.map((unit) => unit.id).join(', ')}), ` +
        `${request.units.filter((unit) => unit.pool === 'leadership').length} troop types. Housing L ` +
        `${n(request.housing.leadership)} · A ${n(request.housing.authority)} · D ${n(request.housing.dominance)}.`,
    );

    // ---- §A ------------------------------------------------------------------------------------------------
    report.h('§A — the three stops and the sizer rows, as the benchmark prices them');

    const startedAt = Date.now();
    const plan = planOf(request, { withFrontier: true });
    const planMs = Date.now() - startedAt;
    const rows: Campaign[] = [];
    const stopRows = new Map<string, Campaign>();
    for (const stop of plan.alternatives) {
      const row = campaignOf(request, `Complete optimization · ${stop.pick}`, 'plan', marchesOf(stop));
      rows.push(row);
      stopRows.set(stop.pick, row);
    }
    const sizerRows: Campaign[] = [];
    for (const [method, title] of [
      ['elite', 'Tier ladder'],
      ['ms', 'Troops first'],
    ] as const) {
      sizerRows.push(
        greedy(request, method, `${title} · all types`, (r) => countsOf(sizeStacks(r).stacks)),
      );
      sizerRows.push(
        greedy(request, method, `${title} · Generate (average damage)`, (r) =>
          countsOf(
            searchPriority({ request: r, objective: 'avgDamage', budgetMs: CAMPAIGN.budgets.search }).result
              .stacks,
          ),
        ),
      );
    }
    rows.push(...sizerRows);

    report.add(`The plan answered in ${n(planMs)} ms with ${plan.alternatives.length} stops.\n`);
    report.add(ROW_HEAD);
    report.add(ROW_RULE);
    for (const row of rows) report.add(rowLine(row));

    const best = sizerRows.reduce((held, row) => (row.damage > held.damage ? row : held), sizerRows[0]!);
    const steady = stopRows.get('steady-max') ?? rows[0]!;
    const planRows = rows.filter((row) => row.kind === 'plan');
    const bestPlanMonster = Math.max(...planRows.map(perMonster));
    const bestSizerMonster = Math.max(...sizerRows.map(perMonster));
    report.add(
      `\nThe best sizer sequence is **${best.name}** (${n(best.damage)} over four marches). The steady max ` +
        `stands at **${ratio(steady.damage / best.damage)}** of it on damage and **${ratio(perMonster(steady) / perMonster(best))}** ` +
        `on damage a monster; it burns **${steady.monstersLost}** monster chunks against **${best.monstersLost}**, ` +
        `and **${steady.soldiersLost}** soldier chunks against **${best.soldiersLost}**.`,
    );
    report.add(
      `\n**Two readings of “a monster”, and the benchmark registers the kinder one.** ` +
        '`plan-baseline.ts` records `standing(perMonster) = max over the plan’s stops / max over the sizer ' +
        `rows\`, which is the **sweet spot’s** ${n(bestPlanMonster)} over **${sizerRows.find((row) => perMonster(row) === bestSizerMonster)?.name}**’s ` +
        `${n(bestSizerMonster)} = **${ratio(bestPlanMonster / bestSizerMonster)}** — the 0.593 in the ` +
        'proposal. Stop against best-sizer-sequence, which is the comparison the damage share 0.911 is, the ' +
        `steady max reads **${ratio(perMonster(steady) / perMonster(best))}**. Both are below one, and the ` +
        'gap is the same gap. **And the chunk figures are campaign figures**: the steady max burns ' +
        `${steady.monstersLost} monster chunks over **four** marches, ${rareStockOf(request.units, steady.marches[0] ?? {}).monstersLost} ` +
        `in march 1; the best sizer sequence ${best.monstersLost} over four, ${rareStockOf(request.units, best.marches[0] ?? {}).monstersLost} in its first.`,
    );

    report.h('§A — the marches themselves, in kill order');
    for (const row of rows) {
      report.add(`\n### ${row.name} — march 1 of ${row.marches.length}`);
      for (const line of stackTable(request, row.marches[0] ?? {})) report.add(line);
      const later = row.marches.slice(1);
      const same = later.every((counts) => JSON.stringify(counts) === JSON.stringify(row.marches[0]));
      report.add(
        `\nMarches 2–${row.marches.length}: ${same ? 'identical to march 1' : 'they differ — ' + later.map((counts, index) => `march ${index + 2}: ${Object.entries(counts).filter(([, c]) => c > 0).map(([id, c]) => `${id} ${n(c)}`).join(' · ')}`).join('; ')}`,
      );
    }

    // ---- §B ------------------------------------------------------------------------------------------------
    report.h('§B — the chunk rule, and how the 900-dominance pool is bounded');

    report.add(
      'Each uncapped hired type is bounded by **its own whole pool, as if it were the only one there** ' +
        '(`planCampaign`: `stock[id] = floor(housing[pool] / cost)`), and every dominance monster is uncapped ' +
        'by construction — `caps` is written only for the mercenaries the player selected. So the plan’s grid ' +
        'reads each of the twelve monster types as a stock big enough to fill the pool on its own:',
    );
    report.add('');
    report.add('| type | dominance cost | HP each | stock the plan reads | that stock’s share of the pool |');
    report.add('|---|---|---|---|---|');
    let asIfAlone = 0;
    for (const unit of monsters) {
      const stock = Math.max(0, Math.floor(request.housing.dominance / Math.max(1, unit.cost)));
      asIfAlone += stock * unit.cost;
      report.add(
        `| ${unit.id} | ${n(unit.cost)} | ${n(hpOf.get(unit.id) ?? 0)} | ${n(stock)} | ${pct((stock * unit.cost) / request.housing.dominance)} |`,
      );
    }
    report.add(
      `\nThe twelve stocks together ask for **${n(asIfAlone)}** dominance against a pool of ` +
        `**${n(request.housing.dominance)}** — ${ratio(asIfAlone / request.housing.dominance)}× the housing. ` +
        'Nothing in the grid reconciles them: `fitsHousing` refuses a shape that overruns the pool, and ' +
        '`sizeStacks` fills it and stops, so what survives is whatever the shelter and the pool leave — ' +
        'a little of a lot of types.',
    );

    // the chunk rule as the plan prices it vs. the recap
    report.add('\n**`chunks(n)` as the plan bills it against `recoveryCosts`** — the same stops, march by march:');
    report.add('');
    report.add('| stop | plan `mercLost` (campaign) | Σ `chunks(n)` over hired stacks | recap dragon coins | plan `dragonCoins` | recap silver | plan silver |');
    report.add('|---|---|---|---|---|---|---|');
    for (const stop of plan.alternatives) {
      const marches = marchesOf(stop);
      let byChunks = 0;
      let recapCoins = 0;
      let recapSilver = 0;
      for (const counts of marches) {
        byChunks += hiredIds(request).reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
        const evaluated = evaluateCounts(request, counts);
        const costs = recoveryCosts(evaluated.result.stacks, request.units, request.recovery);
        recapCoins += costs.retrain.dragonCoins;
        recapSilver += costs.retrain.silver;
      }
      const row = stopRows.get(stop.pick)!;
      report.add(
        `| ${stop.pick} | ${stop.mercLost} | ${byChunks} | ${n(recapCoins)} | ${n(stop.dragonCoins)} | ` +
          `${n(recapSilver)} | ${n(row.silver)} |`,
      );
    }

    // **What a chunk buys, type by type** — the whole of "where the extra chunks go".
    report.add(
      '\n**What one chunk buys, type by type.** A chunk of ten is the same price whatever it is spent on, ' +
        'so the figure that decides whether a hired type is worth fielding at all is its **damage a chunk** ' +
        'on the march it stands in. The steady max’s own march 1 against the best sizer sequence’s:',
    );
    const chunkValue = (counts: Record<string, number>, title: string): void => {
      const byId = new Map(request.units.map((unit) => [unit.id, unit]));
      const evaluated = evaluateCounts(request, counts);
      report.add(`\n*${title}*`);
      report.add('');
      report.add('| type | what | count | chunks | pool spent | damage (worst opening) | **a chunk** |');
      report.add('|---|---|---|---|---|---|---|');
      const hired = lines(evaluated)
        .filter((line) => (byId.get(line.unitId)?.pool ?? 'leadership') !== 'leadership')
        .sort((a, b) => b.damageEnemyFirst / chunks(b.count) - a.damageEnemyFirst / chunks(a.count));
      for (const line of hired) {
        const unit = byId.get(line.unitId)!;
        report.add(
          `| ${line.unitId} | ${isMonsterUnit(unit) ? `monster (${unit.pool})` : `soldier (${unit.pool})`} | ` +
            `${n(line.count)} | ${chunks(line.count)} | ${n(line.count * unit.cost)} ${unit.pool} | ` +
            `${n(line.damageEnemyFirst)} | ${n(line.damageEnemyFirst / chunks(line.count))} |`,
        );
      }
    };
    chunkValue(steady.marches[0] ?? {}, 'Complete optimization · steady-max, march 1');
    chunkValue(best.marches[0] ?? {}, `${best.name}, march 1`);

    // What the cheap tail of the ranking costs on the steady max's own march.
    const valueRank = table
      .filter((entry) => entry.pool === 'dominance')
      .sort((a, b) => b.damagePerUnit / b.cost - a.damagePerUnit / a.cost);
    const cheap = new Set(valueRank.slice(8).map((entry) => entry.id));
    const steadyFirst = steady.marches[0] ?? {};
    const steadyLines = lines(evaluateCounts(request, steadyFirst));
    const cheapDamage = steadyLines
      .filter((line) => cheap.has(line.unitId))
      .reduce((sum, line) => sum + line.damageEnemyFirst, 0);
    const cheapChunks = steadyLines
      .filter((line) => cheap.has(line.unitId))
      .reduce((sum, line) => sum + chunks(line.count), 0);
    const marchDamage = steadyLines.reduce((sum, line) => sum + line.damageEnemyFirst, 0);
    const marchMonsterChunks = rareStockOf(request.units, steadyFirst).monstersLost;
    const smallOnMarch = request.units.filter(
      (unit) =>
        unit.pool === 'dominance' && (steadyFirst[unit.id] ?? 0) > 0 && (steadyFirst[unit.id] ?? 0) <= CHUNK,
    ).length;
    const fieldedOnMarch = request.units.filter(
      (unit) => unit.pool === 'dominance' && (steadyFirst[unit.id] ?? 0) > 0,
    ).length;
    report.add(
      `\n**The four cheapest types a point of dominance — ${[...cheap].join(', ')} — hold ` +
        `${cheapChunks} of the steady max march’s ${marchMonsterChunks} monster chunks ` +
        `(${pct(cheapChunks / marchMonsterChunks)}) and buy ${n(cheapDamage)} of its ${n(marchDamage)} damage ` +
        `(${pct(cheapDamage / marchDamage)}).** On the same march ${smallOnMarch} of the ${fieldedOnMarch} ` +
        'monster stacks fielded are ten units or fewer — each paying the same chunk of ten as a stack of ten.',
    );

    // S-58 B off, on this camp alone
    const without = planOf(request, { refuseDroppedTypes: false });
    const noFloor = planOf(request, { tokenFloor: false });
    const neither = planOf(request, { tokenFloor: false, refuseDroppedTypes: false });
    const withoutRows = new Map<string, Campaign>();
    for (const stop of without.alternatives) {
      withoutRows.set(
        stop.pick,
        campaignOf(request, `S-58 B off · ${stop.pick}`, 'plan', marchesOf(stop)),
      );
    }
    report.add(
      `\n**S-58 B off** (\`refuseDroppedTypes: false\`) — the same camp, the same budgets, ` +
        `${without.alternatives.length} stops:`,
    );
    report.add('');
    report.add(ROW_HEAD);
    report.add(ROW_RULE);
    for (const pick of ['silver-saver', 'sweet-spot', 'more-mercs', 'steady-max', 'all-in'] as const) {
      const on = stopRows.get(pick);
      const off = withoutRows.get(pick);
      if (on) report.add(rowLine({ ...on, name: `S-58 B **on** · ${pick}` }));
      if (off) report.add(rowLine({ ...off, name: `S-58 B **off** · ${pick}` }));
    }

    report.add(
      '\n**Why neither flag moves it: no vector the grid builds ever drops a hired type.** The crossed ' +
        'types’ lists are `[max, 0.7 max, 0.45 max, 0.2 max, floor]` with `floor = tokenFloor ? min(10, max) ' +
        ': 0`, and the **riding** types — every hired type past the four the grid crosses, which on this camp ' +
        'is ten of the fourteen — ride `shares = [1, 0.7, 0.45, 0.2]`, a list with **no zero in it** ' +
        '(`planCampaign`, the grid). So with `tokenFloor` on, every candidate vector fields **all fourteen** ' +
        'hired types, and with it off, at best the four crossed ones can go to nothing. Measured, the same ' +
        'camp under all four settings:',
    );
    report.add('');
    report.add(ROW_HEAD);
    report.add(ROW_RULE);
    for (const [label, answer] of [
      ['A on · B on (the app)', plan],
      ['A on · B off', without],
      ['A **off** · B on', noFloor],
      ['A **off** · B **off**', neither],
    ] as const) {
      for (const stop of answer.alternatives) {
        report.add(rowLine(campaignOf(request, `${label} · ${stop.pick}`, 'plan', marchesOf(stop))));
      }
    }

    // ---- §C ------------------------------------------------------------------------------------------------
    report.h('§C — the burn ladder, and where the sizer’s march would sit on it');

    const frontier: PlanFrontierRow[] = plan.frontier ?? [];
    const bandRows = frontier.filter((row) => row.undominated && row.inBand);
    const rungs = new Map<number, PlanFrontierRow>();
    for (const row of bandRows) {
      const held = rungs.get(row.repeat.mercLost);
      if (
        !held ||
        row.repeat.damage > held.repeat.damage ||
        (row.repeat.damage === held.repeat.damage && row.repeat.silver < held.repeat.silver)
      ) {
        rungs.set(row.repeat.mercLost, row);
      }
    }
    const burns = [...rungs.keys()].sort((a, b) => a - b);
    let climbed = -Infinity;
    const kept = new Set<number>();
    for (const burn of burns) {
      const damage = rungs.get(burn)?.repeat.damage ?? 0;
      if (damage > climbed) {
        kept.add(burn);
        climbed = damage;
      }
    }
    const stopBurns = new Map<number, string[]>();
    for (const stop of plan.alternatives) {
      stopBurns.set(stop.repeat.mercLost, [...(stopBurns.get(stop.repeat.mercLost) ?? []), stop.pick]);
    }
    report.add(
      '**The two arithmetics agree on this army**, so a rival priced by `simulateBattle` may be put on the ' +
        'plan’s own ladder: ' +
        plan.alternatives
          .map(
            (stop) =>
              `${stop.pick} ${n(stop.repeat.damage)} (plan) against ${n(price(request, stop.counts).damage)} (recap)`,
          )
          .join(' · ') +
        '.',
    );
    report.add(
      `\nThe frontier carries ${frontier.length} rows, ${frontier.filter((row) => row.undominated).length} of ` +
        `them undominated and ${bandRows.length} of those kept by the band. The ladder below is those rows ` +
        'one plan a burn level, best damage at each, exactly as `planCampaign` builds it — **before** the ' +
        'put-back round, which re-sizes a rung and can move its burn (the stops’ own burns are in the last ' +
        'column, read off `plan.alternatives`).',
    );
    report.add('');
    report.add('| burn (chunks a march) | soldier | monster | damage a march | silver a march | a burn chunk | a silver | burning more buys more | stop |');
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const burn of burns) {
      const row = rungs.get(burn)!;
      const rare = rareStockOf(request.units, row.counts);
      report.add(
        `| ${burn} | ${rare.soldiersLost} | ${rare.monstersLost} | ${n(row.repeat.damage)} | ` +
          `${n(row.repeat.silver)} | ${n(row.repeat.damage / Math.max(1, burn))} | ` +
          `${ratio(row.repeat.damage / Math.max(1, row.repeat.silver))} | ${kept.has(burn) ? 'kept' : '**dropped**'} | ` +
          `${(stopBurns.get(burn) ?? []).join(', ') || '—'} |`,
      );
    }
    report.add(
      `\nThe bar’s own stops sit at ${plan.alternatives.map((stop) => `${stop.pick} ${stop.repeat.mercLost}`).join(' · ')} chunks a march.`,
    );

    // where the best sizer march sits
    const rivalCounts = best.marches[0] ?? {};
    const rivalPriced = price(request, rivalCounts);
    const rivalRare = rareStockOf(request.units, rivalCounts);
    const rivalBurn = rivalRare.soldiersLost + rivalRare.monstersLost;
    const rivalTroopStacks = request.units.filter(
      (unit) => unit.pool === 'leadership' && (rivalCounts[unit.id] ?? 0) > 0,
    ).length;
    const stocked = request.units.filter(
      (unit) => unit.pool !== 'leadership' && (request.caps[unit.id] === undefined || (request.caps[unit.id] ?? 0) > 0),
    );
    const droppedByRival = stocked.filter((unit) =>
      best.marches.every((counts) => (counts[unit.id] ?? 0) <= 0),
    );
    const rungAt = rungs.get(rivalBurn);
    report.add(
      `\n**The sizer’s own march** (${best.name}, march 1) burns **${rivalBurn}** chunks a march ` +
        `(${rivalRare.soldiersLost} soldier · ${rivalRare.monstersLost} monster) for ${n(rivalPriced.damage)} ` +
        `damage and ${n(rivalPriced.silver)} silver — ${ratio(rivalPriced.damage / rivalPriced.silver)} a silver, ` +
        `${n(rivalPriced.damage / Math.max(1, rivalBurn))} a burn chunk.`,
    );
    report.add('');
    report.add('| the four questions the bar asks of a plan | the sizer’s march |');
    report.add('|---|---|');
    report.add(
      `| is there a ladder rung at its burn? | ${rungAt ? `yes — ${n(rungAt.repeat.damage)} damage for ${n(rungAt.repeat.silver)} silver, ${rungAt.repeat.damage >= rivalPriced.damage ? '**at least as hard-hitting**' : `and the sizer’s march hits **${pct(rivalPriced.damage / rungAt.repeat.damage - 1)} harder** than it for ${pct(rivalPriced.silver / rungAt.repeat.silver - 1)} more silver`}` : '**no rung at that burn at all**'} |`,
    );
    const topRung = burns.filter((burn) => kept.has(burn)).reduce((held, burn) => Math.max(held, burn), 0);
    const topDamage = rungs.get(topRung)?.repeat.damage ?? 0;
    report.add(
      `\n**The sizer’s march is off the plan’s frontier in the direction that matters.** It hits harder than ` +
        `**every** rung of the ladder — the top of it is ${n(topDamage)} at ${topRung} chunks — while burning ` +
        `${topRung - rivalBurn} chunks fewer, and it costs ${pct(rivalPriced.silver / (rungs.get(topRung)?.repeat.silver ?? 1) - 1)} ` +
        'more silver than that top rung, which is the one axis it does not win on (so it is undominated, not ' +
        'dominant). Put on the ladder it would be the rung at ' +
        `${rivalBurn} and, because “burning more buys more” drops every level above the most damage, the ` +
        `${burns.filter((burn) => burn > rivalBurn && kept.has(burn)).length} rungs above it would go with it ` +
        '— the bar would be the thrift end and this march. The search never prices it because no vector it ' +
        'builds can leave a hired type out (§B).',
    );
    report.add(
      `| band, the token-field arm (damage ≥ half the winner’s march) | ${rivalPriced.damage * 2 >= plan.repeat.damage ? 'passes' : 'refused'} (${n(rivalPriced.damage)} against half of ${n(plan.repeat.damage)}) |`,
    );
    report.add(
      `| band, the silver arm (≥ half the plan’s damage a silver) | ${(rivalPriced.damage / rivalPriced.silver) * 2 >= plan.damagePerSilver ? 'passes' : 'refused'} (${ratio(rivalPriced.damage / rivalPriced.silver)} against half of ${ratio(plan.damagePerSilver)}) |`,
    );
    report.add(`| band, more than one troop stack | ${rivalTroopStacks > 1 ? 'passes' : 'refused'} (${rivalTroopStacks}) |`);
    report.add(
      `| S-58 B, fields every stocked hired type | ${droppedByRival.length === 0 ? 'passes' : `**refused** — it never fields ${droppedByRival.map((unit) => unit.id).join(', ')}`} |`,
    );

    // ---- §D ------------------------------------------------------------------------------------------------
    report.h('§D — what would close the gap, measured');

    // (1) fewer monster types, bigger stacks
    report.add(
      '### D1 — the plan over **fewer monster types**\n\n' +
        'The request is narrowed to the k monster types with the most damage a point of dominance; nothing ' +
        'in the engine changes. This is the “tighter shape over fewer types with bigger stacks” family, ' +
        'asked of the search rather than imposed on its answer.',
    );
    const byValue = table
      .filter((entry) => entry.pool === 'dominance')
      .sort((a, b) => b.damagePerUnit / b.cost - a.damagePerUnit / a.cost);
    report.add('');
    report.add('| monster type | damage a unit | dominance cost | damage a dominance point | HP each |');
    report.add('|---|---|---|---|---|');
    for (const entry of byValue) {
      report.add(
        `| ${entry.id} | ${n(entry.damagePerUnit)} | ${n(entry.cost)} | ${n(entry.damagePerUnit / entry.cost)} | ${n(entry.hp)} |`,
      );
    }
    const narrowed: Campaign[] = [];
    for (const k of [1, 2, 3, 4, 6, 8]) {
      const keep = new Set(byValue.slice(0, k).map((entry) => entry.id));
      const narrowRequest: StackRequest = {
        ...request,
        units: request.units.filter((unit) => unit.pool !== 'dominance' || keep.has(unit.id)),
      };
      let narrowPlan: CampaignPlan | null;
      try {
        narrowPlan = planOf(narrowRequest);
      } catch {
        narrowPlan = null;
      }
      if (!narrowPlan) continue;
      for (const stop of narrowPlan.alternatives) {
        narrowed.push(
          campaignOf(narrowRequest, `top ${k} monster types · ${stop.pick}`, 'plan', marchesOf(stop)),
        );
      }
    }
    report.add('');
    report.add(ROW_HEAD);
    report.add(ROW_RULE);
    for (const row of [...rows.filter((row) => row.kind === 'plan'), ...narrowed]) report.add(rowLine(row));
    const bestNarrow = narrowed.reduce(
      (held, row) => (row.damage > held.damage ? row : held),
      narrowed[0] ?? steady,
    );
    report.add(
      `\nThe hardest campaign of the narrowed family is **${bestNarrow.name}** — ${n(bestNarrow.damage)} ` +
        `damage for ${n(bestNarrow.silver)} silver on ${bestNarrow.monstersLost} monster chunks and ` +
        `${bestNarrow.soldiersLost} soldier chunks. Against the plan’s own steady max that is ` +
        `${pct(bestNarrow.damage / steady.damage - 1)} more damage for ${pct(bestNarrow.silver / steady.silver - 1)} ` +
        `more silver and ${steady.monstersLost - bestNarrow.monstersLost} **fewer** monster chunks, and its ` +
        `damage a monster is ${n(perMonster(bestNarrow))} against ${n(perMonster(steady))} ` +
        `(×${ratio(perMonster(bestNarrow) / perMonster(steady))}). Against the best sizer sequence it stands ` +
        `at ${ratio(bestNarrow.damage / best.damage)} on damage (the bar today: ${ratio(steady.damage / best.damage)}) ` +
        `and ${ratio(perMonster(bestNarrow) / perMonster(best))} on damage a monster (today: ` +
        `${ratio(perMonster(steady) / perMonster(best))}).`,
    );
    const dropped = byValue.slice(8).map((entry) => entry.id);
    report.add(
      `\nThe four types the narrowing leaves out at k = 8 are **${dropped.join(', ')}** — and they are ` +
        `exactly the four the best sizer sequence never fields (§C). Nothing was tuned to make that happen: ` +
        'the ranking is damage a point of dominance, and the sizer reaches the same four by filling the pool ' +
        'from the top of its own order.',
    );

    // (2) a per-type minimum of a chunk's worth
    report.add(
      `\n### D2 — a per-type minimum: a stack that costs a chunk fields a chunk’s worth\n\n` +
        `The chunk is the **game’s own** (\`CHUNK = ${CHUNK}\`, \`src/engine/recovery.ts\`: the game trains ` +
        'and revives ten at a time, and one in every chunk comes back free), not a tuning constant — which ' +
        'is why a minimum stated at it needs no calibration. Two readings are measured below: **drop**, ' +
        'where a hired stack under ten units is left out of the march, and **raise**, where it is grown to ' +
        'ten if the shelter and the pool allow and dropped otherwise.',
    );
    const floorOf = (counts: Record<string, number>): number => {
      const troopHp = request.units
        .filter((unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0)
        .map((unit) => (counts[unit.id] ?? 0) * (hpOf.get(unit.id) ?? 0));
      return troopHp.length > 0 ? Math.min(...troopHp) : 0;
    };
    const roomFor = (counts: Record<string, number>): { id: string; ceiling: number }[] =>
      request.units
        .filter((unit) => unit.pool !== 'leadership' && (counts[unit.id] ?? 0) > 0)
        .map((unit) => ({
          id: unit.id,
          ceiling: Math.max(0, Math.ceil(floorOf(counts) / Math.max(1, hpOf.get(unit.id) ?? 1)) - 1),
        }));
    const minimum = (counts: Record<string, number>, mode: 'drop' | 'raise'): Record<string, number> => {
      const out = { ...counts };
      const floor = floorOf(counts);
      let dominance = request.units
        .filter((unit) => unit.pool === 'dominance')
        .reduce((sum, unit) => sum + (out[unit.id] ?? 0) * unit.cost, 0);
      let authority = request.units
        .filter((unit) => unit.pool === 'authority')
        .reduce((sum, unit) => sum + (out[unit.id] ?? 0) * unit.cost, 0);
      for (const unit of request.units) {
        if (unit.pool === 'leadership') continue;
        const count = Math.floor(out[unit.id] ?? 0);
        if (count <= 0 || count >= CHUNK) continue;
        const hp = hpOf.get(unit.id) ?? 0;
        const cap = request.caps[unit.id];
        const pool = unit.pool === 'dominance' ? request.housing.dominance - dominance : request.housing.authority - authority;
        const room = Math.floor(pool / Math.max(1, unit.cost)) + count;
        const fits =
          mode === 'raise' &&
          CHUNK * hp < floor &&
          room >= CHUNK &&
          (cap === undefined || cap >= CHUNK);
        if (fits) {
          if (unit.pool === 'dominance') dominance += (CHUNK - count) * unit.cost;
          else authority += (CHUNK - count) * unit.cost;
          out[unit.id] = CHUNK;
        } else {
          if (unit.pool === 'dominance') dominance -= count * unit.cost;
          else authority -= count * unit.cost;
          delete out[unit.id];
        }
      }
      return out;
    };
    report.add('\nThe **room** the shelter leaves a monster type on the steady max’s own march:');
    report.add('');
    report.add('| type | fielded | HP each | most the shelter allows | ten units’ HP | a chunk’s worth fits? |');
    report.add('|---|---|---|---|---|---|');
    const steadyCounts = steady.marches[0] ?? {};
    const steadyFloor = floorOf(steadyCounts);
    for (const entry of roomFor(steadyCounts)) {
      const hp = hpOf.get(entry.id) ?? 0;
      report.add(
        `| ${entry.id} | ${n(steadyCounts[entry.id] ?? 0)} | ${n(hp)} | ${n(entry.ceiling)} | ${n(CHUNK * hp)} | ` +
          `${CHUNK * hp < steadyFloor ? 'yes' : '**no — ten units stand over the troop floor**'} |`,
      );
    }
    report.add(`\n(The lowest troop stack on that march is ${n(steadyFloor)} HP.)`);
    const minimumRows: Campaign[] = [];
    for (const mode of ['drop', 'raise'] as const) {
      for (const stop of plan.alternatives) {
        minimumRows.push(
          campaignOf(
            request,
            `a ${CHUNK}-unit minimum (${mode}) · ${stop.pick}`,
            'hand',
            marchesOf(stop).map((counts) => minimum(counts, mode)),
          ),
        );
      }
    }
    report.add('');
    report.add(ROW_HEAD);
    report.add(ROW_RULE);
    for (const row of [...rows.filter((row) => row.kind === 'plan'), ...minimumRows]) report.add(rowLine(row));

    // (3) S-58 B relaxed
    report.add(
      '\n### D3 — S-58 B relaxed for the dominance pool\n\n' +
        'The flag is one switch in the engine, so the measurement above (§B) is the whole hired set at once. ' +
        'It reads as “relaxed for the dominance pool alone” exactly when the stops it produces still field ' +
        'both mercenary types — which the table below answers.',
    );
    report.add('');
    report.add('| stop | S-58 B on: types fielded | S-58 B off: types fielded | still fields both mercenaries? |');
    report.add('|---|---|---|---|');
    for (const stop of without.alternatives) {
      const on = plan.alternatives.find((other) => other.pick === stop.pick);
      const fieldsMerc = soldiers.every((unit) =>
        marchesOf(stop).some((counts) => (counts[unit.id] ?? 0) > 0),
      );
      const typesOf = (row: PlanTotals | undefined): string =>
        row === undefined
          ? '—'
          : String(
              new Set(
                marchesOf(row).flatMap((counts) =>
                  request.units
                    .filter((unit) => unit.pool !== 'leadership' && (counts[unit.id] ?? 0) > 0)
                    .map((unit) => unit.id),
                ),
              ).size,
            );
      report.add(
        `| ${stop.pick} | ${typesOf(on)} | ${typesOf(stop)} | ${fieldsMerc ? 'yes' : '**no**'} |`,
      );
    }

    // ---- the ten older scenarios ---------------------------------------------------------------------------
    report.h('§D — the ten older scenarios: what each candidate would do to them');
    report.add(
      '| scenario | dominance types held | stops | hired stacks under ten units, over every stop’s marches | S-58 B off: stops | S-58 B off: damage of the hardest stop | identical? |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const older: { scenario: Scenario; base: CampaignPlan | null }[] = [];
    for (const scenario of all) {
      if (scenario.label.startsWith(MONSTER_CAMP)) continue;
      const other = scenario.request;
      let base: CampaignPlan | null;
      let off: CampaignPlan | null;
      try {
        base = planOf(other);
      } catch {
        base = null;
      }
      try {
        off = planOf(other, { refuseDroppedTypes: false });
      } catch {
        off = null;
      }
      const dominance = other.units.filter((unit) => unit.pool === 'dominance').length;
      const small = base
        ? base.alternatives.reduce(
            (sum, stop) =>
              sum +
              marchesOf(stop).reduce(
                (inner, counts) =>
                  inner +
                  other.units.filter(
                    (unit) =>
                      unit.pool !== 'leadership' &&
                      (counts[unit.id] ?? 0) > 0 &&
                      (counts[unit.id] ?? 0) <= CHUNK,
                  ).length,
                0,
              ),
            0,
          )
        : 0;
      const hardest = (one: CampaignPlan | null): number =>
        one === null ? 0 : Math.max(...one.alternatives.map((stop) => stop.totalDamage));
      const same =
        base !== null &&
        off !== null &&
        base.alternatives.length === off.alternatives.length &&
        base.alternatives.every(
          (stop, index) =>
            JSON.stringify(stop.counts) === JSON.stringify(off.alternatives[index]?.counts) &&
            stop.pick === off.alternatives[index]?.pick &&
            stop.totalDamage === off.alternatives[index]?.totalDamage,
        );
      report.add(
        `| ${scenario.label} | ${dominance} | ${base ? base.alternatives.length : 'refused'} | ${small} | ` +
          `${off ? off.alternatives.length : 'refused'} | ${n(hardest(off))} | ${same ? 'byte-identical' : '**no**'} |`,
      );
      older.push({ scenario, base });
    }

    report.add(
      '\n**D1 on the ten older scenarios.** The fix D1 measures is a *shape family* — the plan over a prefix ' +
        'of the hired types ranked by damage a point of their own pool — so on an army it would add shapes ' +
        'rather than remove types. A shape family can only change a bar by **winning**, so the question is ' +
        'whether any prefix beats what the search already offers. Measured: every prefix of every older ' +
        'army’s hired ranking, planned under the same budgets, against that army’s own hardest stop.',
    );
    report.add('');
    report.add('| scenario | hired types | prefix | hardest stop | burn | silver | beats the bar? |');
    report.add('|---|---|---|---|---|---|---|');
    for (const { scenario, base } of older) {
      if (!base) continue;
      const other = scenario.request;
      const hiredRank = effectiveTable(other)
        .filter((entry) => entry.pool !== 'leadership')
        .sort((a, b) => b.damagePerUnit / b.cost - a.damagePerUnit / a.cost);
      if (hiredRank.length < 2) continue;
      const baseBest = base.alternatives.reduce((held, stop) =>
        stop.totalDamage > held.totalDamage ? stop : held,
      );
      const baseRow = campaignOf(other, 'bar', 'plan', marchesOf(baseBest));
      report.add(
        `| ${scenario.label} | ${hiredRank.length} | the bar as it stands | ${n(baseRow.damage)} | ` +
          `${baseRow.burned} | ${n(baseRow.silver)} | — |`,
      );
      for (let k = 1; k < hiredRank.length; k += 1) {
        const keep = new Set(hiredRank.slice(0, k).map((entry) => entry.id));
        const narrowRequest: StackRequest = {
          ...other,
          units: other.units.filter((unit) => unit.pool === 'leadership' || keep.has(unit.id)),
        };
        let narrowPlan: CampaignPlan | null;
        try {
          narrowPlan = planOf(narrowRequest);
        } catch {
          narrowPlan = null;
        }
        if (!narrowPlan) {
          report.add(`| ${scenario.label} | ${hiredRank.length} | top ${k} | refused | — | — | no |`);
          continue;
        }
        const top = narrowPlan.alternatives.reduce((held, stop) =>
          stop.totalDamage > held.totalDamage ? stop : held,
        );
        const row = campaignOf(narrowRequest, `top ${k}`, 'plan', marchesOf(top));
        const beats =
          row.damage > baseRow.damage && row.burned <= baseRow.burned && row.silver <= baseRow.silver;
        report.add(
          `| ${scenario.label} | ${hiredRank.length} | top ${k} (${[...keep].join(', ')}) | ${n(row.damage)} | ` +
            `${row.burned} | ${n(row.silver)} | ${beats ? '**yes**' : 'no'} |`,
        );
      }
    }

    // ---- §E ------------------------------------------------------------------------------------------------
    report.h('§E — assessment');
    const eight = narrowed.find((row) => row.name === 'top 8 monster types · steady-max') ?? bestNarrow;
    report.add(
      [
        `**The figures §E stands on.** The bar’s steady max: ${n(steady.damage)} damage, ${n(steady.silver)} ` +
          `silver, ${steady.soldiersLost} soldier and ${steady.monstersLost} monster chunks, ` +
          `${n(perMonster(steady))} a monster. The same stop over the top **8** monster types: ` +
          `${n(eight.damage)}, ${n(eight.silver)}, ${eight.soldiersLost} and ${eight.monstersLost}, ` +
          `${n(perMonster(eight))} a monster — ${pct(eight.damage / steady.damage - 1)} more damage for ` +
          `${pct(eight.silver / steady.silver - 1)} more silver on ${steady.monstersLost - eight.monstersLost} ` +
          `fewer monster chunks. The best sizer sequence: ${n(best.damage)}, ${n(best.silver)}, ` +
          `${best.soldiersLost} and ${best.monstersLost}, ${n(perMonster(best))} a monster.`,
        '',
        '**Root cause.** The plan’s extra monster chunks are not bought, they are **compulsory**. The grid the',
        'search sweeps builds one count per hired type from that type’s own maximum, and neither of the two',
        'lists it draws from contains a zero: the four *crossed* types read `[max, 0.7 max, 0.45 max, 0.2 max,',
        'min(10, max)]` under S-58 A’s `tokenFloor`, and every further type — ten of the fourteen on this camp —',
        'rides `shares = [1, 0.7, 0.45, 0.2]`. **No vector the search prices ever leaves a hired type out**, so',
        'every march it can offer pays a chunk of ten for every type the account holds, whatever that type is',
        'worth. The 900-dominance pool then has to be split twelve ways, and the shelter (`ceil(floor / hp) − 1`)',
        'cuts each share down to the few units that stand under a 449 280-HP troop rung, which is where the',
        '“many tiny stacks” come from: on the steady max’s own march, eight of the eleven dominance stacks are',
        'ten units or fewer, and the four types that are worth least a point of dominance hold **48 % of the',
        'march’s monster chunks for 5 % of its damage** (§B) — a single emerald dragon is a whole chunk for',
        '76 950. The sizer is under no such obligation — `sizeStacks` fills the pool from the top of its own',
        'order and stops — so it fields nine hired types instead of fourteen, bigger, and spends 47 monster',
        'chunks over the campaign where the plan spends 84. Neither S-58 A nor S-58 B is the lever: with either',
        'or both off the bar is byte-identical here (§B), because the constraint is the **grid’s shape**, not',
        'the band’s refusals.',
        '',
        '**The candidate fix, as a computation.** Add one shape family to the search, the hired mirror of S-93’s',
        'troop prefix: rank the hired types by **damage a point of their own pool** (`damagePerUnit / cost`,',
        'which `effectiveTable` already computes), and for each k in 1…|hired| score the shapes built from the',
        'first k types alone — the same vectors, the same ladder and sizer shapes, the same shelter, with the',
        'other types held at zero. Nothing else changes: `marchOf` already bills every non-leadership stack by',
        '`chunks(n)`, so a march that drops a type is scored as the thrift it is, and the band, the burn ladder',
        'and the stop rules read it like any other candidate. Measured here by narrowing the *request* instead',
        'of the search (§D1), which offers the search the same marches: the top-8 prefix is the one that pays,',
        'and the four types it leaves out are exactly the four the best sizer sequence never fields.',
        '',
        '**The trade, per scenario.** On the monster camp it is a gain on three readings and a loss on one:',
        'the steady max goes from 0.911 to 0.972 of the best sizer sequence on damage, from 0.510 to 0.972 on',
        'damage a monster, and from 84 monster chunks to 47 — the sizer’s own figure — for 2.5 % more silver',
        '(damage a silver 2.689 → 2.798, which is **better**, so the extra silver buys more than it costs).',
        'On the ten older scenarios the table above is the whole of it — no prefix of any of them beats that',
        'army’s own hardest stop on damage while spending no more burn and no more silver, so the family adds',
        'shapes that never win and those bars stand. That is a measured claim about the *marches*, not a proof',
        'about the engine: a new shape family also adds rungs to the burn ladder, and a rung that is not a',
        'winner can still move the knee, so an implementation has to be re-benchmarked rather than argued from',
        'this table.',
        '',
        '**The refuted candidate.** A per-type minimum of a chunk’s worth (D2) is the wrong shape of rule and',
        'the measurement says so plainly: the monsters worth fielding are exactly the ones whose ten units will',
        'not fit under the troop floor (a flaming centaur is 132 000 HP against a 449 280-HP rung — ten of them',
        'is three times the floor), so a ten-unit minimum deletes the high-damage monsters and keeps the cheap',
        'ones, and the bar loses more than half its damage. The chunk itself is the game’s own (`CHUNK = 10`),',
        'not a constant this repo chose, which is why it is worth stating and worth refusing on evidence rather',
        'than on taste.',
        '',
        '**Does it need the owner’s decision?** Two things do. First, whether a bar that fields **8 of the 12**',
        'dominance types is acceptable at all: S-58 B is his own rule — *“a plan the player is offered fields a',
        'little of everything they hold”* — and although the flag is not what causes this (§B), a prefix family',
        'that wins by dropping four monster types is a march that fields less than everything, which is the',
        'shape of plan he asked the bar not to show. The four dropped types are the four cheapest a point of',
        'dominance, and his own best sizer row drops the same four, which is the argument for it. Second, the',
        'silver: the top-8 steady max spends 2.5 % more silver than today’s. The benchmark’s silver pin is on',
        'the **ratio**, not the spend — the plan’s best damage a silver must reach 95 % of the best sizer',
        'sequence’s — and that reading *improves*, 2.689 / 2.806 = 0.958 today against 2.798 / 2.806 = 0.997',
        'narrowed, so the pin is not the question. Whether a march that costs 877 000 more silver a campaign',
        'for 6.6 % more damage and half the monsters is the trade he wants is.',
      ].join('\n'),
    );

    report.save();
  }, 3_600_000);
});
