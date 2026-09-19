/**
 * **The benchmark, as a standing test** (owner, 2026-09-18: *"always benchmark our total optimization against
 * the two others to understand if we're finding something interesting or just changing numbers without really
 * improving on the current stack algorithm"*; later that day: *"update the benchmark with the needed test
 * scenarios to prove everything … so we have a definitive benchmark over the main use cases of the
 * calculators"*).
 *
 * Complete optimization against Tier ladder and Troops first — each as the plain sizer and as Generate runs
 * it, the priority search on average damage — and every plan stop, all played for the same four marches: the
 * sizer methods re-sized each march on the stock the last one left (a chunk of ten lost per hired stack
 * fielded), the plan as its own sequence of repeats and finale. Where a calculator outside this repo answered
 * the same case (TotalStack's optimize capture of 2026-09-15, Kai's calculator's extract of the same day), its
 * march is a row too, played as captured while the stock lasts. Every march is priced by `simulateBattle` on
 * its counts.
 *
 * **The three rare readings changed on 2026-09-19** (S-105): `a hired`, `a soldier` and `a monster` divide
 * **that group's own damage**, not the whole campaign's. The owner, on the hired column: *"it says over a
 * million but in total they do less than 1M"*, and *"dmg per hired is still broken: it shows a damage per
 * hired almost above total damage"*. Each numerator is the group's share of the same enemy-first journal the
 * damage column is summed from (`price`), so the three are shares of that column and never a second
 * arithmetic beside it. The `a silver` and `a dragon coin` columns are untouched: they price a whole march,
 * and the whole march's damage is what they bought.
 *
 * **The reading changed on 2026-09-19** (S-94): the damage column is every march's **worst opening**
 * (`minDamage`, the enemy-first journal) where it was the midpoint of the two openings, on every row of every
 * scenario. The owner will not spend on a coin flip, the plan is ranked on the bad flip, and a table that
 * ranked the plan against its rivals on a different figure would be comparing two arithmetics. The figures
 * below are therefore **lower in level** than every snapshot up to `benchmark-2026-09-19-11-thrift-end`; the
 * per-scenario worst/expected ratio that bridges the two is in `benchmark-2026-09-19-12-reliable-damage.md`
 * and in `tools/theorycraft/out/109-reliable-damage.md` §C. `price()` below is the one place it is decided.
 *
 * **The scenarios** are the main use cases of the calculators, each pinned to what the engine does today so
 * that a change either way is news:
 *
 *  - the owner's 2026-09-17 export at its setup (7 000 leadership — the case where a hired stack on top was
 *    the best sponge, experiment 101 §A) and at 12 000;
 *  - his live account of 2026-09-18 (one hired type, 20 000) and its evening form (four types, one of them
 *    hired as unlimited, 11 000);
 *  - a first-run army with Bear V at a stock of 1, 2, 3 and 10 (experiment 101 §B: the small stocks where
 *    the plan refuses or offers one stop), and with the hunter at 83 (the e2e seed);
 *  - a first-run army that has unlocked the **monster tiers** — 12 dominance types over tiers 3–5 against a
 *    900 dominance pool, experiment 110's camp (added 2026-09-19, S-96: the first scenario here with a pool
 *    other than leadership and authority in it, and the one that holds the plan to fielding and sheltering
 *    the monsters it can house). Its 20 000-dominance sibling is not here because its search does not
 *    finish inside `CAMPAIGN.budgets.plan` — see `monsterCamp` in `plan-scenarios.ts`;
 *  - the 4 000-leadership case of 2026-09-15, the one case two other calculators answered;
 *  - **his three camps** (added 2026-09-19, S-101): the live camp of 2026-09-18 (arbalesters 485,
 *    legionaries 1 002, bears unlimited) and his camp of 2026-09-19 at both readings of the Battle card
 *    (4 975 / 2 180 with 450 hunters, 5 100 / 2 200 with 120). They have held the plan's *criteria* since
 *    S-93 and S-97; what kept them off this table was that no calculator outside this repo had answered
 *    them, and the replay of 2026-09-19 answered all three.
 *  - **his own TotalStack profile** (added 2026-09-19, S-103): 5 225 leadership, 2 120 authority and 100
 *    dominance with the monster window on tier 3, Epic Monster Hunter V ×80 and the bonuses he typed into
 *    the page. It is the one army here whose request is the captured request rather than a reconstruction
 *    of it, so the quotients under its table are two searches over one army. The second replay of that
 *    morning also gave the **monster camp** its first captured answers, which is why scenario 11 carries
 *    external rows and floors now where it carried none.
 *
 * **The owner's goal is measured on every scenario that can carry it** (S-101): under each table, a `goal`
 * line reads the plan's best stop against the captured **Total Optimization** row on the three readings he
 * named — *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"* — and says
 * which are at or above 1.0 and which are below. The three are **pinned at what they measure today**
 * (`Pinned.totalOptimization`), never at the goal: a reading the bar has not reached is a discrepancy for
 * the owner to judge, and a benchmark red for a target rather than for a regression would stop being a
 * non-regression suite.
 *
 * **A fourth reading joins it where a dragon coin is actually spent** (S-103): the monster camp and his
 * TotalStack profile, the two armies on this table that house a dominance pool. On the other fourteen
 * neither side spends a coin, both read at `damage / 1`, and a "standing" that repeats the damage column is
 * left out of the goal line and out of the pins rather than printed as if it meant something.
 *
 * **Two things hold a run, and they answer different questions.**
 *
 *  1. **The hand pins** (`plan-scenarios.ts`): its hardest-hitting campaign reaches the pinned share of the
 *     best sizer sequence's four-march damage, its best stop a hired unit beats every sizer sequence unless
 *     pinned otherwise, its best stop a silver reaches 95 % of the best sizer sequence's, and the bar carries
 *     the pinned number of stops. They say *how far above the sizers* the plan must stand, and each was
 *     chosen by a person, dated and explained on its own scenario.
 *  2. **The registered baseline** (`plan-baseline.ts`, `checkBaseline` below), since 2026-09-19: the figures
 *     the **owner** has registered as acceptable, stop by stop, which no run may come in under — *"the
 *     benchmark is like non-regression tests. A given scenario should not be worse, or it's a discrepancy, or
 *     a new baseline needs to be registered by me if the trade is ok."* Nothing in this repo re-bases either
 *     of them. `pnpm bench:baseline` writes `tests/engine/plan-baseline.proposed.json`; the owner reads it,
 *     sets `registeredBy` and renames it. Until he does, the baseline half asserts nothing and the report
 *     says so.
 *
 * **Three pins are failing as of 2026-09-19 (S-95)**, left failing on purpose for him to judge with the
 * proposal in hand: `stops` on the 7 000 export (4 registered, 5 offered) and on the 12 000 export (5, 4),
 * and `externals.damageFloor` on his live account at 20 000 (1.02 registered, 1.018 measured). The reliable
 * reading moved the bar on those armies; whether the trade is worth a new baseline is his call, not this
 * file's.
 *
 * S-94 left **four**: the evening account's `stops` pin (5 registered, 4 offered) came back on its own when
 * the band's token-field arm moved from the count of hired units to the damage (S-95), because the bar
 * carries five stops there again. No pin was touched to make that happen.
 *
 * The table each case measured is written to `tools/theorycraft/out/benchmark-latest.md`, the figures to
 * `benchmark-latest.json` beside it (what a before/after comparison reads). The first-run and 4 000 cases run
 * everywhere; the owner's cases run where his export is.
 *
 * Read the rows knowing what they are not (validator, 2026-09-18): a plan **stop that repeats a march** used
 * to play fewer marches than the horizon when its stock ran out, while a sizer sequence went on with troops
 * alone, so a "four-march" share could compare three marches with four. Since S-89 (2026-09-18) every stop
 * plays the horizon — the `all-in` march by march, every other stop by appending the same troops-only march
 * once per march its stock does not reach (`PlanTotals.tail`) — so the shares below compare four marches with
 * four on every army the plan answers; a captured answer is one
 * march repeated on its own stock, never
 * re-sized as its stock drains (conservative for it); the 4 000 case's troop types are the ones TotalStack's
 * answer fielded, and TotalStack was asked for damage a silver where this table ranks damage. Both searches
 * run under the app's own budgets (`CAMPAIGN.budgets`).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign } from '@/engine';
import { simulateBattle } from '@/engine/battle';
import { buildKillOrder } from '@/engine/killOrder';
import type { CampaignPlan, PlanTotals } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import { searchPriority } from '@/engine/search';
import { sizeStacks } from '@/engine/stacker';
import type { Stack, StackRequest, StackResult } from '@/engine/types';
import { effectiveUnit, hitDamage } from '@/engine/units';

// The scenarios themselves, and their pins, live beside this file (`plan-scenarios.ts`) since S-87, so that
// `plan-criteria.test.ts` can hold the shelter criterion on every army this benchmark builds.
import type { Baseline, BaselineScenario, BaselineTotals } from './plan-baseline';
import { compareToBaseline, registeredBaseline } from './plan-baseline';
import type { Scenario } from './plan-scenarios';
import { HORIZON, OWNER_EXPORT, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';
// The rare-stock readings the owner asked for on 2026-09-19 — "at least the same as TotalStack full opt in
// silver/dmg, merc/dmg and monster/dmg" — defined once, beside the sheltered-march yardstick, so this table
// and `plan-criteria.test.ts` split the stock the same way (S-98).
import { isMonsterUnit, perDragonCoinOf, perMonsterOf, perSoldierOf, rareStockOf } from './plan-yardsticks';
import { totalstackRows, widenedFor } from './totalstack-rows';

const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;
const SILVER_FLOOR = 0.95;
const OUT = new URL('../../tools/theorycraft/out/', import.meta.url);
const REPORT = new URL('benchmark-latest.md', OUT);
const FIGURES = new URL('benchmark-latest.json', OUT);
const n = (value: number): string => Math.round(value).toLocaleString('en-US');

// ---- pricing ---------------------------------------------------------------------------------------------

/**
 * A march from explicit counts, priced as the recap prices it: damage, silver and revive gold.
 *
 * **Damage is the worst opening since 2026-09-19** (S-94; the owner: *"average damage is not average for
 * sure; it's too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable
 * damage actually."*). Every row of this table — the plan's stops, the sizer sequences and the captured
 * answers alike — is priced on `summary.minDamage`, the enemy-first journal, because the plan is now ranked
 * on it: a rival priced on the midpoint of the two openings against a plan priced on the bad flip would win
 * a comparison the arithmetic made rather than the march. The Generate rows keep their **own** objective
 * (average damage): that is what the other calculator answers, and only the reading it is scored on here has
 * changed.
 */
function price(
  request: StackRequest,
  counts: Record<string, number>,
): {
  damage: number;
  hiredDamage: number;
  soldierDamage: number;
  monsterDamage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
} {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    });
  }
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));
  const pools = {
    leadership: { used: 0, capacity: request.housing.leadership },
    authority: { used: 0, capacity: request.housing.authority },
    dominance: { used: 0, capacity: request.housing.dominance },
  };
  const result: StackResult = { stacks, pools, dropped: [], warnings: [] };
  const summary = simulateBattle(result, request);
  /**
   * **What each group of stacks itself dealt, in that same worst opening** (S-105, 2026-09-19; the owner:
   * *"dmg per hired is still broken: it shows a damage per hired almost above total damage"*).
   *
   * `summary.damageByPool` is the **midpoint** of the two openings, so it cannot be the numerator of a
   * column this table reads on the worst one (S-94). The enemy-first journal is where `minDamage` above
   * comes from, and its army lines carry the stack that struck them — so the split is that journal summed
   * by unit, which makes the three figures below shares of the damage column to the unit and never a second
   * arithmetic beside it.
   *
   * The three groups are the three denominators the table already prints: the **authority** pool for
   * `hired burned`, and the split by race — monsters and hired soldiers, `isMonsterUnit` in
   * `plan-yardsticks.ts` — for `soldiers burned` and `monsters burned`. Troops are in none of them: they are
   * not rare stock, and no reading here counts them.
   */
  const dealt = new Map<string, number>();
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor !== 'army') continue;
    dealt.set(entry.unitId, (dealt.get(entry.unitId) ?? 0) + entry.damage);
  }
  let hiredDamage = 0;
  let soldierDamage = 0;
  let monsterDamage = 0;
  for (const unit of request.units) {
    const struck = dealt.get(unit.id) ?? 0;
    if (struck <= 0 || unit.pool === 'leadership') continue;
    if (unit.pool === 'authority') hiredDamage += struck;
    if (isMonsterUnit(unit)) monsterDamage += struck;
    else soldierDamage += struck;
  }
  // The gold is the hired stacks' own price (S-90): a sizer sequence and a plan stop both pay it, and a
  // campaign total that leaves one of its marches out of it is what this run's own assertion now catches.
  return {
    damage: summary.minDamage,
    hiredDamage,
    soldierDamage,
    monsterDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    // The fourth price, and the rarest (S-98): dragon coins, which only the dominance pool ever charges —
    // taken off the recap exactly as the silver and the gold above are, so the column and the bar's own
    // `PlanTotals.dragonCoins` are one figure (asserted on every plan row in `measure`).
    dragonCoins: summary.recovery.dragonCoins,
    // The training queue rides with the other two prices: the registered baseline records it so the owner
    // sees the whole trade when he judges one (`plan-baseline.ts`).
    seconds: summary.recovery.seconds,
  };
}

interface Campaign {
  name: string;
  /** Who produced the marches: one of ours, or a calculator outside this repo. */
  kind: 'sizer' | 'plan' | 'external';
  /**
   * False for a captured answer that fields a troop type the scenario's army does not hold (TotalStack's
   * profile fields Archer III, Spearman III and Swordsman I where the owner's export leaves them out): priced
   * and shown, since it is what the other calculator says, but no pin is judged against a march the player
   * cannot make.
   */
  comparable: boolean;
  marches: number;
  damage: number;
  /**
   * **What the campaign's own rare stacks dealt**, out of the damage above (S-105, 2026-09-19): the hired
   * stacks' share of every march's worst opening (`hiredDamage`, the `authority` pool — the one `burned`
   * counts), and the same split by race for the ratios beside it (`soldierDamage`, `monsterDamage`). They
   * are the numerators of `perHired`, `perSoldier` and `perMonster` below; the column they used to divide
   * was `damage` itself, which handed the stock credit for every point the troops struck for.
   */
  hiredDamage: number;
  soldierDamage: number;
  monsterDamage: number;
  silver: number;
  /** What the campaign's hired stacks cost to revive, in gold — the recap's figure, summed march by march. */
  gold: number;
  /** How long its losses sit in the training queue, in seconds, summed march by march. */
  seconds: number;
  burned: number;
  /**
   * **The rare stock split** (S-98, 2026-09-19; the owner: *"at least the same as TotalStack full opt in
   * silver/dmg, merc/dmg and monster/dmg"*). The hired **soldiers** and the **monsters** — monster
   * mercenaries and dominance monsters together, `isMonsterUnit` in `plan-yardsticks.ts`, which states the
   * definition and what TotalStack's `monsterSaving` does and does not say about it.
   *
   * **They no longer add up to `burned`** (S-102, 2026-09-19). They did while every non-leadership chunk was
   * burn; since the owner's *"apart from mercs, they can be trained just like troops"* the burn is the
   * **authority** pool alone, so `soldiersLost + monstersLost === burned + the dominance chunks` and the two
   * agree exactly on any army holding no dominance unit — which is every scenario here but the monster camp.
   * `monstersLost` is therefore a **cost** reading now, not a share of the burn: on a monster camp it is the
   * dominance chunks the march trained again plus whatever monster mercenaries rode with them, and the
   * coins those chunks cost are the column beside it.
   */
  soldiersLost: number;
  monstersLost: number;
  /** What the campaign's monsters cost to recruit again, in dragon coins — the recap's figure, summed. */
  dragonCoins: number;
}

/**
 * The ids whose chunks the `hired burned` column counts: **the `authority` pool** (S-102, 2026-09-19).
 *
 * S-96 widened this to every non-leadership pool, because `PlanTotals.mercLost` had just been widened the
 * same way and a column compared against it has to read the same set. The owner's word of 2026-09-19 —
 * *"apart from mercs, they [monsters] can be trained just like troops"* — narrowed both back: a mercenary is
 * hired and revived, a monster is **trained again** for silver, queue time and dragon coins, so only the
 * first is a stock a march does not get back. The column follows `mercLost`, as it always has.
 *
 * The same set on every army this file measured before the monster camp, none of the twelve older scenarios
 * holding a dominance unit — which is why their `burned` figures are byte-identical across this change.
 */
const hiredIds = (request: StackRequest): string[] =>
  request.units.filter((u) => u.pool === 'authority').map((u) => u.id);

function campaignOf(
  request: StackRequest,
  name: string,
  kind: Campaign['kind'],
  marches: Record<string, number>[],
): Campaign {
  const mercIds = hiredIds(request);
  let damage = 0;
  let hiredDamage = 0;
  let soldierDamage = 0;
  let monsterDamage = 0;
  let silver = 0;
  let gold = 0;
  let dragonCoins = 0;
  let seconds = 0;
  let burned = 0;
  let soldiersLost = 0;
  let monstersLost = 0;
  for (const counts of marches) {
    const priced = price(request, counts);
    damage += priced.damage;
    // The three rare readings' numerators, summed march by march exactly as the damage above is (S-105).
    hiredDamage += priced.hiredDamage;
    soldierDamage += priced.soldierDamage;
    monsterDamage += priced.monsterDamage;
    silver += priced.silver;
    gold += priced.gold;
    dragonCoins += priced.dragonCoins;
    seconds += priced.seconds;
    burned += mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
    const rare = rareStockOf(request.units, counts);
    soldiersLost += rare.soldiersLost;
    monstersLost += rare.monstersLost;
  }
  return {
    name,
    kind,
    comparable: true,
    marches: marches.length,
    damage,
    hiredDamage,
    soldierDamage,
    monsterDamage,
    silver,
    gold,
    seconds,
    burned,
    soldiersLost,
    monstersLost,
    dragonCoins,
  };
}

/** A sizer method played for the horizon the way a player plays it: Generate, march, lose a chunk, again. */
function greedy(
  base: StackRequest,
  method: 'elite' | 'ms',
  name: string,
  pick: (request: StackRequest) => Record<string, number>,
): Campaign {
  const first: StackRequest = { ...base, options: { ...base.options, method } };
  const mercIds = hiredIds(first);
  const caps = { ...first.caps };
  const marches: Record<string, number>[] = [];
  for (let i = 0; i < HORIZON; i += 1) {
    const request = { ...first, caps: { ...caps } };
    const counts = pick(request);
    if (Object.values(counts).every((c) => c <= 0)) break;
    marches.push(counts);
    for (const id of mercIds) {
      if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(counts[id] ?? 0));
    }
  }
  return campaignOf(first, name, 'sizer', marches);
}

/**
 * A march another calculator answered, played as captured while its stock lasts: the stock is the query's cap
 * or the captured count where that is larger (Kai's extract was made at 18/18, above the query's caps), and a
 * hired stack is clamped to what is left.
 */
function asCaptured(base: StackRequest, name: string, counts: Record<string, number>): Campaign {
  const mercIds = hiredIds(base);
  const caps = { ...base.caps };
  for (const id of mercIds) {
    if (caps[id] !== undefined) caps[id] = Math.max(caps[id], counts[id] ?? 0);
  }
  const marches: Record<string, number>[] = [];
  for (let i = 0; i < HORIZON; i += 1) {
    const march = { ...counts };
    for (const id of mercIds) {
      const cap = caps[id];
      if (cap !== undefined) march[id] = Math.min(march[id] ?? 0, cap);
    }
    marches.push(march);
    for (const id of mercIds) {
      if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(march[id] ?? 0));
    }
  }
  return campaignOf(base, name, 'external', marches);
}

const countsOf = (result: StackResult): Record<string, number> =>
  Object.fromEntries(result.stacks.map((s) => [s.unitId, s.count]));
/** Damage a silver, or NaN for a sequence that spent none (a ratio it does not have, never a record). */
const perSilver = (c: Campaign): number => (c.silver > 0 ? c.damage / c.silver : NaN);
/**
 * **Damage a hired unit is the hired stacks' own damage per hired unit lost** (S-105, 2026-09-19; the owner:
 * *"it says over a million but in total they do less than 1M"*, then *"dmg per hired is still broken: it
 * shows a damage per hired almost above total damage"*). It read `c.damage / burned` — the **whole**
 * campaign's worst opening over the chunks of the authority pool — so on a table where the troops do most of
 * the hitting the column printed nearly the damage column again. The numerator is the part of that opening
 * the hired stacks struck for (`price`), which is the reading `PlanTotals.damagePerMercenary` is on.
 *
 * The zero rule is unchanged: `damage / 1` for a campaign that burned nothing, never `Infinity`.
 */
const perHired = (c: Campaign): number => c.hiredDamage / Math.max(1, c.burned);
/**
 * Damage a hired soldier and damage a monster (S-98), on `perHired`'s own zero rule: a campaign that spent
 * none of one kind reads at `damage / 1`, never at `Infinity`, so a row that fields no monster sits in the
 * same column as one that does instead of topping it by arithmetic.
 *
 * **And on its own numerator since S-105**, for the reason `perHired` above is: a soldier chunk is worth what
 * the hired soldiers struck for, a monster chunk what the monsters did. The three splits are drawn off the
 * same enemy-first journal the damage column is, so each is a share of it.
 */
const perSoldier = (c: Campaign): number => perSoldierOf(c.soldierDamage, c.soldiersLost);
const perMonster = (c: Campaign): number => perMonsterOf(c.monsterDamage, c.monstersLost);
/**
 * **Damage a dragon coin** (S-102, 2026-09-19; the owner: *"TotalStack computes the total of dragon coins
 * needed for a stack if present and the dmg/dragon coins."*). The third currency a monster is paid in, read
 * on the same zero rule: a campaign that spends no coin — every row of every scenario here but the monster
 * camp — reads at `damage / 1` rather than topping the column by arithmetic.
 *
 * **A captured answer's coins are priced by our engine, exactly as its silver and its gold are.** TotalStack
 * sends no `monsterCaps` and comes back with an empty `monsterCounts` in all 308 captured answers
 * (`plan-yardsticks.ts` on `monsterSaving`), so no row here carries a coin figure of its own; every row on
 * the table is the same `recoveryCosts` arithmetic over the counts it answered with.
 */
const perDragonCoin = (c: Campaign): number => perDragonCoinOf(c.damage, c.dragonCoins);

// ---- the owner's goal: Total Optimization on the three rare readings (S-101) --------------------------------

/**
 * The name `totalstack-rows.ts` gives the captured **Total Optimization** answer — TotalStack's `monsterSaving`
 * body, which is the row the owner names when he states his goal.
 */
const TOTAL_OPTIMIZATION = 'TotalStack · Total Optimization';

/** One scenario's standings against that row, or `null` where the table has no comparable one. */
interface Standings {
  perSilver: number;
  perSoldier: number;
  perMonster: number;
  /**
   * **Damage a dragon coin** (S-103), the fourth reading and the one only a monster camp has: where no coin
   * is spent both sides read at `damage / 1` and this repeats the damage column, so it is reported and
   * pinned only on a table where one was (`Pinned.totalOptimization.perDragonCoin`).
   */
  perDragonCoin: number;
}

/**
 * **The owner's goal, measured** (2026-09-19: *"at least the same as TotalStack full opt in silver/dmg,
 * merc/dmg and monster/dmg"*).
 *
 * The plan's **best stop** on each of the three readings, over the same reading of TotalStack's Total
 * Optimization row — both campaigns priced by our own engine, on the same request, over the same four
 * marches and on the same worst opening, so the quotient is the two answers and not two arithmetics. `≥ 1.0`
 * is the goal met; anything under it is a **discrepancy** the run reports and the story writes up, never a
 * pin (`Pinned.totalOptimization` says why).
 *
 * A reading neither side has — a campaign that spent no silver — comes back `NaN` and is shown as `—`
 * rather than counted either way.
 */
function standingsAgainstTotalOptimization(plans: Campaign[], externals: Campaign[]): Standings | null {
  const row = externals.find((c) => c.name === TOTAL_OPTIMIZATION);
  if (!row) return null;
  const over = (of: (c: Campaign) => number): number => {
    const theirs = of(row);
    const ours = Math.max(...plans.map(of).filter(Number.isFinite));
    return Number.isFinite(theirs) && theirs > 0 && Number.isFinite(ours) ? ours / theirs : NaN;
  };
  return {
    perSilver: over(perSilver),
    perSoldier: over(perSoldier),
    perMonster: over(perMonster),
    perDragonCoin: over(perDragonCoin),
  };
}

/** The three readings in the order the owner names them, for the report and for the assertions. */
const GOAL_READINGS = [
  ['damage a silver', 'perSilver'],
  ['damage a hired soldier', 'perSoldier'],
  ['damage a monster', 'perMonster'],
] as const;
/**
 * **The fourth reading, where a table has one** (S-103): damage a dragon coin. It is not in `GOAL_READINGS`
 * because the owner's goal names three and because on the fourteen armies that spend no coin it is the
 * damage column read twice; the goal line appends it and `check` pins it only on a scenario whose rows
 * actually pay in coins.
 */
const COIN_READING = ['damage a dragon coin', 'perDragonCoin'] as const;
const PINNED_READINGS = [...GOAL_READINGS, COIN_READING] as const;
/** True where a dragon coin was spent at all — by a stop or by a captured answer priced on this army. */
const spendsCoins = (rows: Campaign[]): boolean => rows.some((c) => c.dragonCoins > 0);

// ---- one scenario ----------------------------------------------------------------------------------------

/**
 * The marches a stop (or the plan itself) plays, first to last, the way `PlanTotals` says to read them: its
 * own sequence, or the repeated march, the finale and the troops-only tail the horizon leaves over
 * (`PlanTotals.tail`, S-89). Lifted out of `measure` by S-98 so `asBaseline` can split the **plan's own**
 * campaign over exactly the marches the bar prices it on.
 */
const marchesOf = (row: PlanTotals): Record<string, number>[] => {
  if (row.sequence) return row.sequence;
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const marches = Array.from({ length: repeats }, () => row.counts);
  if (row.finaleCounts) marches.push(row.finaleCounts);
  for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
  return marches;
};

interface Measured {
  rows: Campaign[];
  plan: CampaignPlan | null;
  refusal: string | null;
  /**
   * Wall time `planCampaign` itself took on this scenario, in milliseconds — the search only, not the sizer
   * rows beside it. Carried into `benchmark-latest.json` beside the stops (owner, 2026-09-18: a proposal that
   * widens the search has to say what it costs), so a later run compares against a measured number rather
   * than against a memory of how long the suite felt.
   */
  planMs: number;
  /** Which stop each plan row is, by object identity — the baseline is keyed on the engine's own `pick`. */
  picks: Map<Campaign, string>;
  /** The army measured, so the plan's own campaign can be split over its units (S-98). */
  request: StackRequest;
}

function measure(scenario: Scenario): Measured {
  const { request } = scenario;
  const rows: Campaign[] = [];
  for (const [method, title] of [
    ['elite', 'Tier ladder'],
    ['ms', 'Troops first'],
  ] as const) {
    rows.push(greedy(request, method, `${title} · all types`, (r) => countsOf(sizeStacks(r))));
    rows.push(
      greedy(request, method, `${title} · Generate (average damage)`, (r) =>
        countsOf(searchPriority({ request: r, objective: 'avgDamage', budgetMs: SEARCH_BUDGET_MS }).result),
      ),
    );
  }
  // The captured answers: the case's own (the 2026-09-15 capture, Kai's extract) and TotalStack's dataset of
  // 2026-09-18 for every scenario it answered, each priced on the request widened to the troop types it
  // fielded (`totalstack-rows.ts`).
  const held = new Set(request.units.map((unit) => unit.id));
  for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
    const outside = Object.entries(external.counts)
      .filter(([id, count]) => count > 0 && !held.has(id))
      .map(([id]) => id);
    const row = asCaptured(widenedFor(request, external.counts), external.name, external.counts);
    if (outside.length > 0) {
      row.comparable = false;
      row.name = `${row.name} — outside the army's window (${outside.join(', ')})`;
    }
    rows.push(row);
  }
  let plan: CampaignPlan | null = null;
  let refusal: string | null = null;
  // Which stop each plan row is, by object identity: the row's `name` is prose and the baseline is keyed on
  // the engine's own `pick`.
  const picks = new Map<Campaign, string>();
  const startedAt = performance.now();
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      // The put-back pass, at the app's own rates (`CAMPAIGN.putBack`): this file measures the plan the app
      // ships, so a stop here is the march the player would be offered, low tiers put back and all.
      putBack: CAMPAIGN.putBack,
    });
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  const planMs = Math.round(performance.now() - startedAt);
  if (plan) {
    for (const stop of plan.alternatives) {
      // The campaign a stop actually plays: its own sequence, or its repeated march as many times as its
      // stock reaches, its last march, and the troops-only marches the horizon leaves over (`PlanTotals.tail`,
      // S-89 — the same march the `all-in` ends on, appended once per march the stock does not reach).
      const marches = marchesOf(stop as PlanTotals);
      const campaign = campaignOf(request, `Complete optimization · ${stop.pick}`, 'plan', marches);
      picks.set(campaign, stop.pick);
      // The engine's own campaign figure and the marches priced one by one must agree.
      expect(Math.abs(campaign.damage - stop.totalDamage)).toBeLessThanOrEqual(1);
      // **And so must the gold** (S-90). `PlanTotals.gold` left the finale out until 2026-09-18 — the one
      // campaign total of the four that did — so the row this table printed for a repeated stop was priced
      // over its repeats alone while the damage beside it was priced over every march. It is asserted to the
      // unit, not to one gold: the price is a whole number of coins per revived unit.
      expect(campaign.gold, `${stop.pick}'s gold over its marches`).toBe(stop.gold);
      // **And the dragon coins** (S-98), for the same reason and in the same way: the column this table now
      // prints is the recap's, and `PlanTotals.dragonCoins` is the bar's — one figure or a bug.
      expect(campaign.dragonCoins, `${stop.pick}'s dragon coins over its marches`).toBe(stop.dragonCoins);
      rows.push(campaign);
    }
  }
  return { rows, plan, refusal, planMs, picks, request };
}

/**
 * This run's figures in the shape the registered baseline holds (`plan-baseline.ts`): every stop the bar
 * offered, the plan's own campaign, and the standing ratios against the sizers and the captured answers. It
 * is what `pnpm bench:baseline` writes out for the owner and what `check` compares a run against.
 */
function asBaseline(measured: Measured): BaselineScenario | null {
  const { plan } = measured;
  if (!plan) return null;
  const totals = (c: Campaign): BaselineTotals => ({
    marches: c.marches,
    damage: Math.round(c.damage),
    silver: c.silver,
    gold: c.gold,
    seconds: c.seconds,
    burned: c.burned,
    perSilver: Number.isFinite(perSilver(c)) ? perSilver(c) : null,
    perHired: perHired(c),
    // The rare stock told apart, and the coins (S-98) — added after the fields above and never among them,
    // so a proposal written before this story and one written after differ only by these five lines.
    soldiersLost: c.soldiersLost,
    monstersLost: c.monstersLost,
    dragonCoins: c.dragonCoins,
    perSoldier: perSoldier(c),
    perMonster: perMonster(c),
    // And the third currency's ratio (S-102), appended after the five S-98 added for the same reason: a
    // proposal written before this story and one written after differ by this one line.
    perDragonCoin: perDragonCoin(c),
  });
  const stops: Record<string, BaselineTotals> = {};
  for (const row of measured.rows) {
    const pick = measured.picks.get(row);
    if (pick !== undefined) stops[pick] = totals(row);
  }
  const sizers = measured.rows.filter((c) => c.kind === 'sizer');
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
  const plans = measured.rows.filter((c) => c.kind === 'plan');
  const best = Math.max(...plans.map((c) => c.damage));
  const bestSizer = Math.max(...sizers.map((c) => c.damage));
  // The plan's own campaign, split over exactly the marches the bar prices it on (S-98). `plan.mercLost`
  // is the pooled figure the search is ordered by; this is the same chunks told apart — and, since S-105,
  // the damage each of those two groups struck for, priced off the same marches by `price` so the two
  // ratios below divide a numerator of their own rather than the campaign's whole damage.
  const planRare = marchesOf(plan as PlanTotals).reduce<{
    soldiersLost: number;
    monstersLost: number;
    soldierDamage: number;
    monsterDamage: number;
  }>(
    (into, counts) => {
      const one = rareStockOf(measured.request.units, counts);
      const struck = price(measured.request, counts);
      return {
        soldiersLost: into.soldiersLost + one.soldiersLost,
        monstersLost: into.monstersLost + one.monstersLost,
        soldierDamage: into.soldierDamage + struck.soldierDamage,
        monsterDamage: into.monsterDamage + struck.monsterDamage,
      };
    },
    { soldiersLost: 0, monstersLost: 0, soldierDamage: 0, monsterDamage: 0 },
  );
  /** The best reading of one ratio over a set of campaigns, and the plan's standing against it (S-98). */
  const standing = (
    of: (c: Campaign) => number,
  ): { bestSizer: number; externals: Record<string, number> } => {
    const ours = Math.max(...plans.map(of));
    const theirs = Math.max(...sizers.map(of));
    return {
      bestSizer: theirs > 0 ? ours / theirs : 0,
      externals: Object.fromEntries(externals.filter((c) => of(c) > 0).map((c) => [c.name, ours / of(c)])),
    };
  };
  return {
    stops,
    // The plan's own campaign is the engine's figures, not a row of the table: the criterion in
    // `plan-criteria.test.ts` already holds them equal to its marches' sum.
    plan: {
      marches: plan.marches,
      damage: plan.totalDamage,
      silver: plan.silver,
      gold: plan.gold,
      seconds: plan.seconds,
      burned: plan.mercLost,
      perSilver: plan.silver > 0 ? plan.totalDamage / plan.silver : null,
      // The engine's own `hiredDamage` over its own burn (S-105) — the same ratio as
      // `PlanTotals.damagePerMercenary`, on the table's zero rule rather than on the payload's `Infinity`.
      perHired: plan.hiredDamage / Math.max(1, plan.mercLost),
      soldiersLost: planRare.soldiersLost,
      monstersLost: planRare.monstersLost,
      dragonCoins: plan.dragonCoins,
      perSoldier: perSoldierOf(planRare.soldierDamage, planRare.soldiersLost),
      perMonster: perMonsterOf(planRare.monsterDamage, planRare.monstersLost),
      // The engine's own `PlanTotals.damagePerDragonCoin` answers `Infinity` where no coin was spent; the
      // baseline's column is a figure a run is compared on, so it takes the table's zero rule (S-102).
      perDragonCoin: perDragonCoinOf(plan.totalDamage, plan.dragonCoins),
    },
    ratios: {
      bestSizer: bestSizer > 0 ? best / bestSizer : 0,
      externals: Object.fromEntries(
        externals.filter((c) => c.damage > 0).map((c) => [c.name, best / c.damage]),
      ),
      // The two standings the owner's floors will be pinned on, beside the damage one above (S-98): the
      // bar's best damage a hired soldier and a monster over the best sizer sequence's and over each
      // comparable captured answer's. Added after `externals` so an older proposal's lines are untouched.
      perSoldier: standing(perSoldier),
      perMonster: standing(perMonster),
      // The monsters' own third price, standing where the two above it do (S-102): the bar's best damage a
      // dragon coin over the best sizer sequence's and over each comparable captured answer's. Their coins
      // are our engine's pricing of the counts they answered with — no calculator outside this repo reports
      // one — so the quotient is two marches compared, not two arithmetics.
      perDragonCoin: standing(perDragonCoin),
      // The third of the owner's three readings (S-101), added last for the same reason: his goal names
      // *"silver/dmg, merc/dmg and monster/dmg"*, and only the last two of those were registered. Damage a
      // silver was on the table as a **pin** (`silverFloor`, against the sizers) and in every row of the
      // report, but never as a standing the baseline holds, so a run that gave up ground on it against a
      // captured answer was not a failure. It is one now.
      perSilver: standing((c) => (Number.isFinite(perSilver(c)) ? perSilver(c) : 0)),
    },
  };
}

/**
 * **The goal line** (S-101): one sentence a scenario, under its table, saying where the bar stands against
 * TotalStack's Total Optimization on the owner's own three readings and which of them are **below** it. A
 * scenario whose table holds no comparable Total Optimization row says so instead, and says nothing about a
 * goal it was never measured on.
 */
function goalLine(measured: Measured): string {
  const plans = measured.rows.filter((c) => c.kind === 'plan');
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
  if (plans.length === 0) return 'No stop to measure against TotalStack’s Total Optimization.';
  const standings = standingsAgainstTotalOptimization(plans, externals);
  if (!standings) {
    return (
      'No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal ' +
      '(*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not ' +
      'measured here.'
    );
  }
  const read = GOAL_READINGS.map(([what, key]) => {
    const value = standings[key];
    if (!Number.isFinite(value)) return { what, text: `${what} —`, below: false };
    return { what, text: `${what} **${value.toFixed(3)}**${value >= 1 ? ' ✓' : ' ✗'}`, below: value < 1 };
  });
  const below = read.filter((one) => one.below);
  // The fourth reading, only where a coin was actually spent (S-103): on an army that houses no dominance
  // unit both sides read `damage / 1` and the quotient repeats the damage column.
  const coin = standings[COIN_READING[1]];
  const coinLine =
    spendsCoins([...plans, ...externals]) && Number.isFinite(coin)
      ? ` And the fourth currency, where one is spent: **${COIN_READING[0]} ${coin.toFixed(3)}**` +
        `${coin >= 1 ? ' ✓' : ' ✗'} — the monsters’ own price (S-102).`
      : '';
  return (
    '**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as ' +
    'TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: ' +
    `${read.map((one) => one.text).join(', ')}. ` +
    (below.length === 0
      ? 'All three are at or above the goal.'
      : `**Below the goal: ${below.map((one) => one.what).join(', ')}** — a discrepancy for the owner, not a pin.`) +
    coinLine
  );
}

function record(label: string, measured: Measured): void {
  const lines = [
    `## ${label}`,
    '',
    measured.refusal
      ? `The plan refused: \`${measured.refusal}\`.`
      : `The plan offers ${measured.plan?.alternatives.length ?? 0} stops.`,
    '',
    '| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |' +
      ' soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...measured.rows.map(
      (c) =>
        `| ${c.name} | ${c.marches} | ${n(c.damage)} | ${n(c.silver)} | ${n(c.gold)} | ${n(c.burned)} | ${Number.isFinite(perSilver(c)) ? perSilver(c).toFixed(2) : '—'} | ${n(perHired(c))} |` +
        ` ${n(c.soldiersLost)} | ${n(c.monstersLost)} | ${n(c.dragonCoins)} | ${n(perSoldier(c))} | ${n(perMonster(c))} |` +
        ` ${n(perDragonCoin(c))} |`,
    ),
    '',
    goalLine(measured),
    '',
  ];
  appendFileSync(REPORT, `${lines.join('\n')}\n`);
  const figures = JSON.parse(readFileSync(FIGURES, 'utf8')) as { scenarios: unknown[] };
  figures.scenarios.push({
    label,
    refusal: measured.refusal,
    stops: measured.plan?.alternatives.map((stop) => stop.pick) ?? [],
    planMs: measured.planMs,
    // The shape a registered baseline holds, carried in the run's own figures so `pnpm bench:baseline` can
    // write a proposal out of this file without running the suite twice (`plan-baseline.ts`).
    baseline: asBaseline(measured),
    rows: measured.rows.map((c) => ({
      name: c.name,
      kind: c.kind,
      comparable: c.comparable,
      marches: c.marches,
      damage: Math.round(c.damage),
      silver: c.silver,
      gold: c.gold,
      seconds: c.seconds,
      burned: c.burned,
      perSilver: Number.isFinite(perSilver(c)) ? Math.round(perSilver(c) * 1000) / 1000 : null,
      perHired: Math.round(perHired(c)),
      // S-98, appended: every field above is written exactly as it was, so a snapshot taken before this
      // story and one taken after differ by these five lines and by nothing else.
      soldiersLost: c.soldiersLost,
      monstersLost: c.monstersLost,
      dragonCoins: c.dragonCoins,
      perSoldier: Math.round(perSoldier(c)),
      perMonster: Math.round(perMonster(c)),
      // S-102, appended last for the reason S-98's five were: every field above is written exactly as it
      // was, so a snapshot taken before this story and one taken after differ by this line and by the
      // figures the monster camp itself moved.
      perDragonCoin: Math.round(perDragonCoin(c)),
      // S-105, appended last for the same reason: the numerators of the three rare readings above, so a
      // reader of the snapshot can see what the hired stacks, the hired soldiers and the monsters of this
      // campaign actually struck for beside the ratios they are divided into.
      hiredDamage: Math.round(c.hiredDamage),
      soldierDamage: Math.round(c.soldierDamage),
      monsterDamage: Math.round(c.monsterDamage),
    })),
  });
  writeFileSync(FIGURES, `${JSON.stringify(figures, null, 1)}\n`);
}

/**
 * **The registered baseline, if the owner has registered one** (2026-09-19: *"the benchmark is like
 * non-regression tests. A given scenario should not be worse, or it's a discrepancy, or a new baseline needs
 * to be registered by me if the trade is ok."*).
 *
 * Read once for the whole file. `null` — no `plan-baseline.json`, or one that still reads
 * `registeredBy: null` — means nothing below is asserted and the run says so in its report, so a tree with
 * no baseline is an honest "not measured yet" rather than a silent pass. `pnpm bench:baseline` writes the
 * proposal the owner registers.
 */
const BASELINE: Baseline | null = registeredBaseline();

function checkBaseline(scenario: Scenario, measured: Measured): void {
  if (!BASELINE) return;
  const was = BASELINE.scenarios[scenario.label];
  if (!was) {
    // A scenario the baseline does not hold is news, not a failure: the owner registers armies, and one he
    // has not registered has nothing to be worse than.
    process.stdout.write(`  baseline — ${scenario.label}: not registered\n`);
    return;
  }
  const now = asBaseline(measured);
  expect(now, `${scenario.label}: the plan refused an army the baseline holds`).not.toBeNull();
  if (!now) return;
  const { failures, added } = compareToBaseline(was, now);
  for (const line of added) process.stdout.write(`  baseline — ${scenario.label}: ${line}\n`);
  expect(
    failures.join('\n'),
    `this run is behind the baseline the owner registered\n${failures.join('\n')}`,
  ).toBe('');
}

function check(scenario: Scenario, measured: Measured): void {
  const { pinned } = scenario;
  const tell = measured.rows
    .map((c) => `${c.name}: ${n(c.damage)} / ${n(c.silver)} / ${n(c.burned)}`)
    .join('; ');
  expect(measured.refusal !== null, `the plan refuses (${measured.refusal ?? 'no'})`).toBe(pinned.refuses);
  expect(measured.plan?.alternatives.length ?? 0, `stops on the bar (${tell})`).toBe(pinned.stops);
  const sizers = measured.rows.filter((c) => c.kind === 'sizer');
  // Four sizer sequences, each of at least one march: a floor against nothing would hold of anything.
  expect(sizers.length).toBe(4);
  for (const c of sizers) expect(c.marches, `${c.name} played no march`).toBeGreaterThan(0);
  if (!measured.plan) return;
  const plan = measured.rows.filter((c) => c.kind === 'plan');
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
  const sweet = plan.find((c) => c.name.endsWith('sweet-spot'));
  const most = plan.reduce<Campaign | undefined>((b, c) => (!b || c.damage > b.damage ? c : b), undefined);
  if (!sweet || !most) throw new Error('no sweet spot or top');
  const bestSizerDamage = Math.max(...sizers.map((c) => c.damage));
  const finite = (values: number[]): number => Math.max(...values.filter(Number.isFinite));
  const bestSizerPerSilver = finite(sizers.map(perSilver));
  const bestSizerPerHired = Math.max(...sizers.map(perHired));
  const planPerSilver = finite(plan.map(perSilver));
  const planPerHired = Math.max(...plan.map(perHired));
  expect(
    most.damage,
    `the plan's hardest campaign against the best sizer sequence (${tell})`,
  ).toBeGreaterThanOrEqual(pinned.damageFloor * bestSizerDamage);
  expect(planPerHired > bestSizerPerHired, `the plan's best a hired beats the sizers (${tell})`).toBe(
    pinned.winsHired,
  );
  expect(planPerSilver, `the plan's best a silver against the sizers (${tell})`).toBeGreaterThanOrEqual(
    (pinned.silverFloor ?? SILVER_FLOOR) * bestSizerPerSilver,
  );
  // `>=` on both, so an **exact tie** counts: a sizer sequence that matches the sweet spot on silver and on
  // the stock is not behind it on either, and since S-89 that is a case which actually happens (Bear V ×1
  // and ×2 tail into the Tier ladder sizer's own campaign, to the unit). The pin is named for what this
  // measures rather than for a loss it does not always mean — see `Pinned.sweetNotAheadOnEither`.
  const notAhead = sizers.some((c) => perSilver(c) >= perSilver(sweet) && perHired(c) >= perHired(sweet));
  expect(notAhead, `no sizer sequence is behind the sweet spot on either ratio (${tell})`).toBe(
    pinned.sweetNotAheadOnEither,
  );
  if (externals.length > 0) {
    if (!pinned.externals) throw new Error('a case with external rows must pin them');
    const bestExternalDamage = Math.max(...externals.map((c) => c.damage));
    const bestExternalPerHired = Math.max(...externals.map(perHired));
    expect(
      most.damage,
      `the plan's hardest campaign against the other calculators (${tell})`,
    ).toBeGreaterThanOrEqual(pinned.externals.damageFloor * bestExternalDamage);
    expect(
      planPerHired > bestExternalPerHired,
      `the plan's best a hired beats the other calculators (${tell})`,
    ).toBe(pinned.externals.winsHired);
  }
  // **The floors against Total Optimization** (S-101). Every scenario whose table holds a comparable
  // `TotalStack · Total Optimization` row pins all three of the owner's readings and nothing else does, so
  // a row that appears or disappears is caught here rather than silently dropping a floor.
  const standings = standingsAgainstTotalOptimization(plan, externals);
  if (standings && !pinned.totalOptimization) {
    throw new Error('a case with a comparable Total Optimization row must pin the three readings against it');
  }
  if (!standings && pinned.totalOptimization) {
    throw new Error('a case pinned against Total Optimization no longer has a comparable row for it');
  }
  if (standings && pinned.totalOptimization) {
    // The owner's three, and the coins where the scenario pins them (S-103): a reading a scenario does not
    // carry is left out of the pin rather than floored at a figure that repeats the damage column.
    for (const [what, key] of PINNED_READINGS) {
      const floor = pinned.totalOptimization[key];
      if (floor === undefined) continue;
      // A reading neither side has (no silver spent) is not a floor: it is compared only where it exists.
      if (!Number.isFinite(standings[key])) continue;
      expect(
        standings[key],
        `the plan's best stop against TotalStack's Total Optimization on ${what} (${tell})`,
      ).toBeGreaterThanOrEqual(floor);
    }
  }
}

// ---- the suite -------------------------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });
writeFileSync(
  REPORT,
  '# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`\n\n' +
    'Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate ' +
    'four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. ' +
    'Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired ' +
    'stacks cost to revive (the gold column since S-90, 2026-09-18).\n\n' +
    '**`a hired`, `a soldier` and `a monster` are each that group\u2019s own damage over its own chunks ' +
    'since S-105** (2026-09-19; the owner: *"dmg per hired is still broken: it shows a damage per hired ' +
    'almost above total damage"*). The numerator is the group\u2019s share of the same enemy-first journal ' +
    'the damage column is summed from, so the three are shares of that column. They divided the campaign\u2019s ' +
    'whole damage until this run, which credited a chunk of rare stock with every point the troops struck ' +
    'for.\n\n' +
    'The last six columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the ' +
    'chunks of ten told apart into **hired soldiers** and **monsters** — monster mercenaries and ' +
    'dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins ' +
    'the monsters cost to recruit again, and damage a soldier, damage a monster and damage a dragon coin ' +
    'beside damage a hired unit. A campaign that spent none of one kind reads its ratio at `damage / 1`, ' +
    'exactly as `a hired` has always done.\n\n' +
    '**`hired burned` is the `authority` pool alone since S-102** (2026-09-19; the owner: *"apart from ' +
    'mercs, they [monsters] can be trained just like troops"*). A mercenary is hired and revived for gold, ' +
    'so it is a stock a march does not get back; a dominance monster is trained again ten at a time for ' +
    'silver, queue time and dragon coins, so it is a **price** and it leaves the burn. `soldiers burned + ' +
    'monsters burned = hired burned` therefore holds on every army that houses no dominance unit — all but ' +
    'the monster camp below — and on that one the difference is exactly the dominance chunks, which the ' +
    'dragon-coin column prices.\n\n' +
    'Under each table, the **goal line** (S-101): the plan’s best stop against the captured `TotalStack · ' +
    'Total Optimization` row on the owner’s own three readings — damage a silver, damage a hired soldier ' +
    'and damage a monster — with `✓` at or above 1.0 and `✗` below it. The floors pinned on those three ' +
    'are today’s measured figures, so a `✗` is a discrepancy to judge and not a failing test.\n\n' +
    `Run: ${new Date().toISOString()}, commit ${process.env.GIT_COMMIT ?? '(working tree)'}\n\n`,
);
writeFileSync(FIGURES, `${JSON.stringify({ run: new Date().toISOString(), scenarios: [] }, null, 1)}\n`);
appendFileSync(
  REPORT,
  BASELINE === null
    ? 'No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads ' +
        '`registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes ' +
        'a proposal for the owner to register.\n\n'
    : `Held against the baseline ${BASELINE.registeredBy ?? ''} registered on ${BASELINE.registeredAt ?? '—'}` +
        ` (${BASELINE.reading}): no stop may hit less hard, cost more silver or burn more of the stock than` +
        ' the figures in `tests/engine/plan-baseline.json`.\n\n',
);

const runAll = (cases: Scenario[]): void => {
  for (const scenario of cases) {
    test(
      scenario.label,
      () => {
        const measured = measure(scenario);
        record(scenario.label, measured);
        checkBaseline(scenario, measured);
        check(scenario, measured);
      },
      300_000,
    );
  }
};

describe('the plan against Tier ladder, Troops first and the other calculators, over four marches', () => {
  runAll(commonScenarios());
});

describe.skipIf(!existsSync(OWNER_EXPORT))('the same, on the owner’s account', () => {
  const profile = ownerProfile();
  runAll(profile ? ownerScenarios(profile) : []);
});
