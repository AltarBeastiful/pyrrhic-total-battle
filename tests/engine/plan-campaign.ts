/**
 * **How a march and a campaign are priced** — the arithmetic every comparison in this repo is taken on,
 * lifted out of `plan-benchmark.test.ts` by S-131 (2026-09-22) so that a *second* reading of the same
 * armies is the same arithmetic rather than a re-implementation of it.
 *
 * It moved for a measured reason. Experiment 138 asks §2's verdict again under each recovery setting, and a
 * verdict re-derived from a second pricer would answer about the pricer. Nothing here changed in the move:
 * the benchmark's payload is byte-identical across it, which is the only check this module needs and the
 * one `benchmark-run.json` gives for free.
 *
 * The **reporting** stayed behind. This file knows what a march costs; `plan-benchmark.test.ts` knows what
 * the table says about it, and the ratio readings (`perSilver`, `perSoldier`, `perMonster`,
 * `perDragonCoin`) are drawn off `Campaign` there, where the pins that read them live.
 */
import { simulateBattle } from '@/engine/battle';
import { buildKillOrder } from '@/engine/killOrder';
import type { PlanTotals } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import type { Stack, StackRequest, StackResult } from '@/engine/types';
import { effectiveUnit, hitDamage } from '@/engine/units';

import { HORIZON } from './plan-scenarios';
import { isMonsterUnit, rareStockOf } from './plan-yardsticks';

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
export function price(
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

export interface Campaign {
  name: string;
  /**
   * Who produced the marches: one of ours, or a calculator outside this repo.
   *
   * **`variant` is every other algorithm the app offers** (S-118, 2026-09-21; the owner: *"make it run
   * for all our algorithm in the future"*) — the sizer option flags and the four objectives beside
   * `avgDamage`. They are priced, tabled and written to the payload exactly as a `sizer` row is, and
   * they are **deliberately left out of `bestSizer`**, which every `damageFloor` and `winsHired` pin is
   * measured against. Folding fifteen rows into that maximum would re-base those pins as a side effect
   * of widening the coverage, and a benchmark that moves its own floors while adding rows is not a
   * non-regression suite. Whether a variant should count as a sizer is the owner's call, and the day he
   * takes it the change is one word here plus the pins he registers.
   */
  kind: 'sizer' | 'variant' | 'plan' | 'external';
  /**
   * False for a captured answer that fields a troop type the scenario's army does not hold (TotalStack's
   * profile fields Archer III, Spearman III and Swordsman I where the owner's export leaves them out): priced
   * and shown, since it is what the other calculator says, but no pin is judged against a march the player
   * cannot make.
   */
  comparable: boolean;
  /**
   * **The troop stacks the campaign's first march fields, and the leadership it spends** (S-118).
   * The reading that makes a march with no troops in it *visible*: an objective is free to leave every
   * leadership type at home — `damagePerSilver` does it on all three armies here that house a
   * dominance pool, and `avgDamage` under Troops first does it on two more — and until this column
   * existed the only sign was a damage figure that happened to be low. `Troops first · Generate
   * (average damage)` has read 8,250,197 against Tier ladder's 36,832,597 on the evening account
   * since S-101, and nothing in the table said why.
   */
  troopTypes: number;
  leadershipUsed: number;
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
export const hiredIds = (request: StackRequest): string[] =>
  request.units.filter((u) => u.pool === 'authority').map((u) => u.id);

export function campaignOf(
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
  // The first march's shape, which is what a reader needs to see that a march fields no troops at all.
  const first = marches[0] ?? {};
  const leadershipIds = new Set(
    request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id),
  );
  let troopTypes = 0;
  let leadershipUsed = 0;
  for (const unit of request.units) {
    if (!leadershipIds.has(unit.id)) continue;
    const count = Math.floor(first[unit.id] ?? 0);
    if (count <= 0) continue;
    troopTypes += 1;
    leadershipUsed += count * unit.cost;
  }
  return {
    name,
    kind,
    comparable: true,
    marches: marches.length,
    troopTypes,
    leadershipUsed,
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
export function greedy(
  base: StackRequest,
  method: 'elite' | 'ms',
  name: string,
  pick: (request: StackRequest) => Record<string, number>,
  kind: Campaign['kind'] = 'sizer',
  flags: Partial<StackRequest['options']> = {},
): Campaign {
  const first: StackRequest = { ...base, options: { ...base.options, method, ...flags } };
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
  return campaignOf(first, name, kind, marches);
}

/**
 * A march another calculator answered, played as captured while its stock lasts: the stock is the query's cap
 * or the captured count where that is larger (Kai's extract was made at 18/18, above the query's caps), and a
 * hired stack is clamped to what is left.
 */
export function asCaptured(base: StackRequest, name: string, counts: Record<string, number>): Campaign {
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

export const countsOf = (result: StackResult): Record<string, number> =>
  Object.fromEntries(result.stacks.map((s) => [s.unitId, s.count]));
/**
 * The marches a stop (or the plan itself) plays, first to last, the way `PlanTotals` says to read them: its
 * own sequence, or the repeated march, the finale and the troops-only tail the horizon leaves over
 * (`PlanTotals.tail`, S-89). Lifted out of `measure` by S-98 so `asBaseline` can split the **plan's own**
 * campaign over exactly the marches the bar prices it on.
 */
export const marchesOf = (row: PlanTotals): Record<string, number>[] => {
  if (row.sequence) return row.sequence;
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const marches = Array.from({ length: repeats }, () => row.counts);
  if (row.finaleCounts) marches.push(row.finaleCounts);
  for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
  return marches;
};
