/**
 * S-55 — the plan method (the Battle card's "Complete optimization"): the campaign, planned from the army alone.
 *
 * Give it the army (the troops the account can field, the mercenaries it holds) and the enemy, and it works
 * out the marches, the counts, and how far the two scarce resources stretch — because those are exactly what
 * the user cannot know in advance. It does not ask for a silver budget either: as of S-56 that field has left
 * the Battle card along with the S-54 method this one replaced, so a caller that wants to bound the spend
 * passes `silverBudget` itself and the app passes nothing.
 *
 * What it returns is a **plan**: a small set of identical marches plus one final march that spends what is
 * left, chosen so that the damage is as high as the resources allow. Two facts of the game drive it, both
 * verified in game (investigation 0016):
 *
 *  1. A mercenary stack that is fielded loses one unit per chunk of ten — `ceil(n/10)` — for good. So a march
 *     fielding n of a type lasts `floor((stock − n) / chunks(n)) + 1` marches: field less, march more. The
 *     whole stock can be fielded at most ten times over before it is gone.
 *  2. The enemy kills one stack per attack, highest HP first, and every surviving stack strikes in between, so
 *     a stack's number of strikes is its kill position's, not its size's (battle.ts `expectedHits`). The
 *     cheapest sponge that out-HPs the mercenaries therefore buys them a strike each, and the ladder's depth
 *     buys them more.
 *
 * The search is **analytic** — the same `effectiveUnit` / `hitDamage` arithmetic the battle uses, summed over
 * the strike counts — so it can look at tens of thousands of campaigns in a fraction of a second. Every
 * candidate is scored that way; `simulateBattle` is called only by `marchResult`, the function that draws one
 * chosen march for the screen. The search maximises **total damage**, always — `objective` is declared below
 * and never read, which is a defect rather than a decision: the command bar's Objective control is live while
 * this method is chosen and changes nothing. See `PlanTotals` for how the two criteria are reported.
 *
 * Pure data in, pure data out (ADR-0006): no React, no store, no DOM.
 */
import type { UnitDef } from '../data/types';
import { buildJournal } from './battle';
import type { Pool } from '../data/types';
import { enemySquadCount } from './battle';
import { effectiveUnit, hitDamage } from './units';
import { CHUNK, chunks, retrainOne, reviveOne } from './recovery';
import { simulateBattle } from './battle';
import type { BattleSummary, Objective, Stack, StackRequest, StackResult } from './types';

/** How much room the lowest troop rung leaves above the biggest mercenary stack. */
export const DEFAULT_GAP = 0.25;
/**
 * How large the ladder is built, as a multiple of the smallest one that shelters the mercenaries. This is the
 * knob that spends silver: the floor is fixed by the mercenaries (plus the owner's gap) and every step above
 * it buys troop damage at the cost of silver. The plan's whole shape — how many marches, how big each is, how
 * much the final march can afford — falls out of which of these the campaign can pay for.
 */
const LADDER_GROWTHS = [1, 1.25, 1.5, 1.8, 2.2, 2.6, 3.2, 4, 5, 6] as const;
/** Between consecutive rungs, in HP — wide enough that rounding cannot re-order them. */
const RUNG_STEP = 1.02;
/** Fractions of the largest feasible count each mercenary type is offered, beside that count itself. */
const MERC_FRACTIONS = [0.7, 0.45, 0.2] as const;
/** Marches the planner will consider spreading the stock over. */
const MAX_MARCHES = 12;
/**
 * Mercenary types the grid crosses against each other per march count. Beyond this many, the types with the
 * smallest reach ride one shared fraction of their own largest count instead — see the grid in
 * `planCampaign`, which would otherwise be `5ⁿ` and never come back on an account that fields monsters.
 */
const CROSSED_TYPES = 4;
/** Ladder depths tried, in troop rungs. */
const DEPTHS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export interface CampaignInput {
  /** The app's usual one-march request: units, caps (the mercenary stock), housing, bonuses, enemy, recovery. */
  request: StackRequest;
  /** Silver the campaign may spend. Omitted: the plan spends what the stock and the leadership allow. */
  silverBudget?: number;
  /**
   * How many marches the campaign plays in total — the same meaning as S-54's `CampaignSettings.marches`
   * (`simulateCampaign` plays exactly that many). The last of them is the
   * finale, so the repeated march is fielded `marchTarget − 1` times; the plan's own `marches` reads back
   * the target.
   *
   * Omitted: the plan chooses the count, and it will be as long as the mercenary stock allows — 66
   * repeats on the owner's account, which is 313 days of training. The target is what bounds that.
   */
  marchTarget?: number;
  /** Room left above the mercenary floor, as a fraction of the biggest mercenary stack. */
  gap?: number;
  /**
   * **Fix A, behind a flag** (owner, 2026-09-15; `docs/PLAN.md` S-58). The grid samples each hired type at
   * `{max, 0.7·max, 0.45·max, 0.2·max, 0}`, and the trailing `0` is a *degenerate* sample of the thrift end:
   * it is the only point that spends nothing of a type, so it survives non-domination on the third axis
   * however bad its damage is. Set, the thrift end samples one chunk of the type (`min(CHUNK, max)`) instead
   * of none of it — a plan may still be thrifty, it just cannot be thrifty by fielding none of a type the
   * account holds.
   *
   * Measured before the fix (`tools/theorycraft/out/78-merc-use.md` §5): the frontier's thrifty plan fields
   * no legionaries and hits for 3,959,259; putting **one** back pays +22,230 damage and lasts 72 marches.
   */
  tokenFloor?: boolean;
  /**
   * **Fix B, behind a flag** (owner, 2026-09-15; `docs/PLAN.md` S-58). Set, the frontier band refuses any
   * plan that fields none of a hired type the account holds a stock of, and `leftOut` counts them like the
   * band's other three refusals. The grid keeps its `0` samples, so the search may still *find* that dropping
   * a type wins — the plan the player is offered simply never has a hole in it.
   *
   * Differs from A in what it can lose: A cannot express "no legionaries at all", while B can still choose
   * one if it is the winner, and only filters the list. Both are off by default.
   */
  refuseDroppedTypes?: boolean;
  /**
   * Not read. The search maximises `marches × damage(march) + finale` and always has; this field was declared
   * with the plan and never wired to anything, so a caller setting it changes nothing. Left in place rather
   * than deleted because the fix is to *honour* it, not to remove it — the command bar offers the five
   * objectives for every method, and this is the only one that ignores them.
   */
  objective?: Objective;
  /** How many alternative plans to carry back for the UI's trade-off view. */
  alternatives?: number;
  /**
   * Wall-clock budget, the way S-54's search has one: the plan answers with its best find when it runs out,
   * so a press on Generate is bounded and a longer budget buys a better plan rather than a different kind of
   * answer. Omitted: the search runs to completion (tens of seconds on a full account).
   */
  budgetMs?: number;
  /** Polled between candidates; when it turns true the search stops and returns the best plan so far. */
  shouldStop?: () => boolean;
}

export interface PlanMarch {
  /** Kill order: highest total HP first. */
  counts: Record<string, number>;
  damage: number;
  silver: number;
  gold: number;
  /** Units fielded of each mercenary type. */
  mercFielded: Record<string, number>;
  /** Mercenary units lost for good to this march. */
  mercLost: number;
  strikes: number;
  stacks: number;
}

/** What one of a plan's identical marches is, on its own — see `PlanTotals.repeat`. */
export interface PlanRepeat {
  damage: number;
  silver: number;
  mercLost: number;
}

export interface PlanTotals {
  /** Counts of the repeated march, so the UI can draw any point of the frontier, not just the winner. */
  counts: Record<string, number>;
  /** Counts of the final march, when the plan has one. */
  finaleCounts?: Record<string, number> | undefined;
  /**
   * What **one** of the plan's identical marches is, on its own, without the final march spread over it —
   * the same march the March section draws, priced by the plan's own arithmetic. `totalDamage` and `silver`
   * above include the finale, which is why a row showing `totalDamage / marches` disagrees with the March
   * it points at; `repeat` is the figure that agrees, to the unit, with the battle's own report for that
   * march (`marchResult` → `simulateBattle`). Measured: `tools/theorycraft/out/74-row-figures.md` §1.
   */
  repeat: PlanRepeat;
  totalDamage: number;
  silver: number;
  gold: number;
  mercLost: number;
  marches: number;
  /** The two criteria, reported side by side: damage bought per silver, and per irreplaceable mercenary. */
  damagePerSilver: number;
  damagePerMercenary: number;
}

/**
 * One point of the campaign's own curve: the best damage found at a given silver spend, and the best damage
 * per mercenary found there. Bucketed by silver, because that is the axis a player can actually choose —
 * "this is what N silver buys" — and carried so the UI (and a reader) can see the shape rather than three
 * points picked off it.
 */
export interface PlanCurvePoint {
  silver: number;
  /** The most damage any plan found spends this much silver for. */
  damage: number;
  /** Damage per silver at that plan. */
  damagePerSilver: number;
  mercLost: number;
  /** The most damage a mercenary any plan found spends this much silver for. */
  thriftyDamage: number;
  thriftyMercLost: number;
  thriftyPerMercenary: number;
}

export interface CampaignPlan extends PlanTotals {
  /** The repeated march (the plan is this, `marches` times), or the single march if `marches` is 1. */
  march: PlanMarch;
  /** The last march, built from what the stock and the silver have left. Absent when nothing is left. */
  finale?: PlanMarch | undefined;
  /** Which resource stops the plan being better. */
  binding: { silver: boolean; mercenaries: boolean; leadership: boolean; marches: boolean };
  /**
   * The non-dominated plans, cheapest first: the trade-off line the UI draws. Cut to the band — see
   * `leftOut` — unless the caller asked for at least as many rows as the frontier holds.
   */
  alternatives: (PlanTotals & { label: string })[];
  /**
   * How many of the frontier's plans the band refused to hand back: the marches that field a token share of
   * the mercenaries, spend silver far past what they return, or stand on a single troop stack. `0` when
   * nothing was cut — including when the band would have emptied the list and the unbanded frontier was
   * handed back instead.
   *
   * **`0` also for a caller who asked for the whole frontier** (as many rows as it holds): those calls are
   * how the frontier is measured, they are handed every row, and a count of what a band *would* have refused
   * would be describing an offer that was never made — the UI tells the player what it is not showing, and
   * this is the field it reads.
   */
  leftOut: number;
  /**
   * The campaign's whole curve, bucketed by silver: what that much silver buys, and what it buys per
   * mercenary. The two are the owner's two slopes, and the bucketing is what makes the shape visible —
   * the frontier list above is thinned for the eye.
   */
  curve: PlanCurvePoint[];
  /**
   * The balanced proposal, present only when no silver budget was given — the plan the army alone points to.
   * With a budget the plan *is* the answer, and the total dominates both ratios.
   */
  recommend?: (PlanTotals & { label: string }) | undefined;
  /** The knee of the damage-against-silver curve, for the UI's "balanced / efficient" trade-off line. */
  knee?: (PlanTotals & { label: string }) | undefined;
  /** The plan that buys the most damage per silver — one end of the trade, carried for the UI. */
  mostEfficient?: (PlanTotals & { label: string }) | undefined;
  /** The plan that buys the most damage per mercenary — the other end, carried for the UI. */
  mostThrifty?: (PlanTotals & { label: string }) | undefined;
}

/**
 * The battle of one explicit count vector, for the UI: the same stacks `marchOf` built and the real
 * `simulateBattle` on them, so a frontier point can be put on screen exactly as the plan scored it.
 */
export function marchResult(
  request: StackRequest,
  counts: Record<string, number>,
): { result: StackResult; summary: BattleSummary } {
  const table = effectiveTable(request);
  const picked = table
    .filter((entry) => (counts[entry.id] ?? 0) > 0)
    .map((entry) => ({ entry, count: counts[entry.id] ?? 0 }));
  const { stacks } = marchOf(picked, enemySquadCount(request.enemy));
  const used: Record<Pool, number> = { leadership: 0, authority: 0, dominance: 0 };
  for (const stack of stacks)
    used[stack.pool] += stack.count * (table.find((e) => e.id === stack.unitId)?.cost ?? 0);
  const result: StackResult = {
    stacks,
    pools: {
      leadership: { used: used.leadership, capacity: request.housing.leadership },
      authority: { used: used.authority, capacity: request.housing.authority },
      dominance: { used: used.dominance, capacity: request.housing.dominance },
    },
    dropped: [],
    warnings: [],
  };
  return { result, summary: simulateBattle(result, request) };
}

export interface Effective {
  id: string;
  hp: number;
  str: number;
  baseStr: number;
  sa: number;
  /** Σ strength bonuses "as entered" — `hitDamage` needs it, or the bracket goes missing. */
  strengthPercent: number;
  cost: number;
  pool: Pool;
  damagePerUnit: number;
  unit: UnitDef;
}

function effectiveTable(request: StackRequest): Effective[] {
  return request.units.map((unit) => {
    const eff = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage } = hitDamage(eff, 1);
    return {
      id: unit.id,
      hp: eff.hpPerUnit,
      str: eff.strengthPerUnit,
      baseStr: unit.strength,
      sa: eff.strengthAgainst,
      strengthPercent: eff.strengthPercent,
      cost: unit.cost,
      pool: unit.pool,
      damagePerUnit: damage,
      unit,
    };
  });
}

/**
 * A silver figure the way the March writes one — "1.7M", "890K" — for the plan's label, which is read out
 * as a slider's thumb value and has to stay short. The same `Intl` call the March's own `compact` makes
 * (`src/ui/sections/march/format.ts`), repeated here because the engine does not import `src/ui`: one idiom
 * for one figure, whatever draws it.
 */
const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const compact = (value: number): string => COMPACT.format(Math.round(value));

/** Troop types ordered weakest-per-HP first: the weakest takes the top rung and dies unstruck. */
function rankTroops(table: Effective[]): Effective[] {
  return table
    .filter((entry) => entry.pool === 'leadership')
    .sort((a, b) => a.damagePerUnit / a.hp - b.damagePerUnit / b.hp);
}

/**
 * One march, scored through the engine's own journal: the stacks are built from the counts exactly as
 * `simulateBattle` would build them, and the two journals (the enemy striking first, and us) give the damage
 * and the strikes. This is cheaper than a full simulation and just as exact — the round structure, the attack
 * order and the lost strikes all come from `battle.ts`, not from a closed form that assumes the two orders
 * agree (they do not, whenever a rung's count makes its base damage larger than the rung above it).
 */
function marchOf(
  stacks: { entry: Effective; count: number }[],
  enemyStacks: number,
): { damage: number; silver: number; gold: number; mercLost: number; strikes: number; stacks: Stack[] } {
  const built: Stack[] = stacks
    .filter((stack) => stack.count > 0)
    .map((stack) => {
      const { damage } = hitDamage(
        {
          unit: stack.entry.unit,
          hpPerUnit: stack.entry.hp,
          strengthPerUnit: stack.entry.str,
          target: 'melee',
          strengthAgainst: stack.entry.sa,
          doubleDamageChance: 0,
          strikeTwoSquadsChance: 0,
          strengthPercent: stack.entry.strengthPercent,
        },
        stack.count,
      );
      return {
        unitId: stack.entry.id,
        pool: stack.entry.pool,
        count: stack.count,
        hpPerUnit: stack.entry.hp,
        totalHp: stack.count * stack.entry.hp,
        strengthPerUnit: stack.entry.str,
        target: 'melee' as const,
        damagePerHit: damage,
        featuresDamage: 0,
        doubleDamageChance: 0,
        strikeTwoSquadsChance: 0,
      };
    })
    .sort((a, b) => b.totalHp - a.totalHp);
  const enemyFirst = buildJournal(built, enemyStacks, false);
  const armyFirst = buildJournal(built, enemyStacks, true);
  const byId = new Map(stacks.map((stack) => [stack.entry.id, stack.entry]));
  let silver = 0;
  let gold = 0;
  let mercLost = 0;
  for (const stack of built) {
    const entry = byId.get(stack.unitId);
    if (!entry) continue;
    if (entry.pool === 'authority') {
      mercLost += chunks(stack.count);
      gold += reviveOne(entry.unit, stack.count, {
        templeLevel: 0,
        trainingCostReduction: {},
        trainingSpeed: {},
        plan: { mode: 'revive' },
      }).gold;
    } else {
      silver += retrainOne(entry.unit, stack.count, {
        templeLevel: 0,
        trainingCostReduction: {},
        trainingSpeed: {},
        plan: { mode: 'retrain' },
      }).silver;
    }
  }
  return {
    damage: Math.round((enemyFirst.totalDamage + armyFirst.totalDamage) / 2),
    silver,
    gold,
    mercLost,
    strikes: (enemyFirst.friendlyHits + armyFirst.friendlyHits) / 2,
    stacks: built,
  };
}

/** Rungs of `depth` types whose lowest sits `gap` above `mercenaryHp`, each 2 % above the one below. */
function ladder(
  troops: Effective[],
  depth: number,
  mercenaryHp: number,
  gap: number,
  leadership: number,
  scale = 1,
): { entry: Effective; count: number }[] {
  // The strongest `depth` types, weakest first: the weakest takes the top rung (biggest stack, dies
  // unstruck) and the strongest takes the lowest (smallest stack, most strikes) — `troops` is sorted
  // weakest-per-HP first, so the tail is the set we want and its own order is the rung order.
  const chosen = troops.slice(-depth);
  const floor = mercenaryHp * (1 + gap) * scale;
  const out: { entry: Effective; count: number }[] = [];
  let used = 0;
  chosen.forEach((entry, index) => {
    const hp = floor * RUNG_STEP ** (chosen.length - 1 - index);
    const count = Math.max(1, Math.floor(hp / entry.hp));
    used += count * entry.cost;
    out.push({ entry, count });
  });
  return used <= leadership ? out : [];
}

/**
 * How many marches a stock of `held` sustains while fielding `count` every time: one chunk of ten is lost
 * per march, and the count has to still be there to field on the last of them, so
 * `floor((held − count) / chunks(count)) + 1`. The whole stock therefore fields at most ten times over
 * before it is gone — field less, march more. `marchesFor` takes the minimum over the types fielded.
 */
export function lastsMarches(held: number, count: number): number {
  if (count <= 0) return Infinity;
  return Math.floor((held - count) / chunks(count)) + 1;
}

function marchesFor(
  stock: Record<string, number>,
  mercs: { entry: { id: string }; count: number }[],
): number {
  let marches = Infinity;
  for (const merc of mercs) {
    if (merc.count <= 0) continue;
    marches = Math.min(marches, lastsMarches(stock[merc.entry.id] ?? 0, merc.count));
  }
  return Number.isFinite(marches) ? Math.max(1, marches) : 1;
}

/**
 * The shape of a plan, and the one function that scores it.
 *
 * A plan *is* `marches` repeats of one march plus a final march, so its totals are
 *
 *   total damage = marches × damage(march) + damage(finale)
 *   total silver = marches × silver(march) + silver(finale)
 *
 * — which is why both of the ratios a plan is judged by (damage a silver, damage a mercenary) are
 * properties of the **shape** and not of the march count: changing `marches` only walks along the ray the
 * shape draws from the origin. The shape itself is what `makeScorer` takes: how many mercenaries of each
 * type are fielded, how deep the ladder is, and how high its floor sits above them. It lives here, exported,
 * so that a caller sweeping shapes measures the engine's own arithmetic instead of a second copy of it.
 */
export interface ShapeContext {
  /** Troop types, weakest per HP first — `rankTroops` of the account's table. */
  troops: Effective[];
  /** The mercenary types of the account's table. */
  mercTypes: Effective[];
  /** What the account holds, by unit id. */
  stock: Record<string, number>;
  leadership: number;
  enemyStacks: number;
  gap: number;
  /**
   * Whether the shape has a **final march** at all. A campaign leaves one over only when it repeats a march:
   * a plan of one march has nothing to spend on a second, and `planCampaign` turns this off for a target of 1
   * — see the note on `targetRepeats`. Defaults to true, so every sweep that calls `shapeScorer` gets the
   * shape it always got.
   */
  finale?: boolean;
}

export interface ScoredShape {
  marches: number;
  /** The counts of the repeated march, as the app carries them. */
  counts: Record<string, number>;
  rungs: { entry: Effective; count: number }[];
  march: ReturnType<typeof marchOf>;
  /** The final march: what the stock the repeats burned still allows. */
  finale: { rungs: { entry: Effective; count: number }[]; march: ReturnType<typeof marchOf> } | null;
  /** `marches` × the repeated march, plus the final march. */
  total: number;
  silver: number;
  mercLost: number;
}

/** Scores one shape: `marches` repeats of `counts` behind a ladder of `depth` rungs scaled by `scale`. */
export type ShapeScorer = (
  marches: number,
  counts: Record<string, number>,
  depth: number,
  scale: number,
  silverBudget?: number,
) => ScoredShape | null;

/** The scorer of an account whose table is already built, so a sweep does not rebuild it per shape. */
export function makeScorer(context: ShapeContext): ShapeScorer {
  const { troops, mercTypes, stock, leadership, enemyStacks, gap } = context;
  const noFinale = context.finale === false;

  /**
   * The final march a shape and a march count leave, searched over the same ladder grid the repeated march
   * is. It depends on the stock the repeats burn and on the silver they leave — **never on the repeated
   * march's own ladder** — so without a silver budget it is the same final march for all eighty ladders the
   * planner tries, and this walks it once instead of eighty times. (With a budget it cannot: what is left
   * depends on what each ladder cost.) That is the whole reason it is a function here rather than inline.
   */
  const finaleFor = (
    marches: number,
    fielded: { entry: Effective; count: number }[],
    silverLeft: number | undefined,
  ): ScoredShape['finale'] => {
    if (silverLeft !== undefined && silverLeft <= 0) return null;
    const spentStock: Record<string, number> = { ...stock };
    for (const merc of fielded)
      spentStock[merc.entry.id] = (stock[merc.entry.id] ?? 0) - marches * chunks(merc.count);
    const leftovers = mercTypes
      .map((entry) => ({ entry, count: Math.max(0, spentStock[entry.id] ?? 0) }))
      .filter((merc) => merc.count > 0);
    if (leftovers.length === 0) return null;
    const leftoverHp = Math.max(...leftovers.map((merc) => merc.count * merc.entry.hp));
    const finaleBudget = silverLeft === undefined ? Infinity : silverLeft;
    let finale: ScoredShape['finale'] = null;
    for (const finaleDepth of DEPTHS) {
      for (const finaleGrowth of LADDER_GROWTHS) {
        const finaleLadder = ladder(troops, finaleDepth, leftoverHp, gap, leadership, finaleGrowth);
        if (finaleLadder.length === 0) continue;
        const attempt = marchOf([...finaleLadder, ...leftovers], enemyStacks);
        if (attempt.silver > finaleBudget) continue;
        if (!finale || attempt.damage > finale.march.damage) finale = { rungs: finaleLadder, march: attempt };
      }
    }
    return finale;
  };

  // One entry is enough: the planner scores all eighty ladders of one shape back to back, and the key can
  // only stay the same within that run.
  let cachedKey = '';
  let cachedFinale: ScoredShape['finale'] = null;

  return (marches, counts, depth, scale, silverBudget) => {
    const vector = mercTypes.map((entry) => ({
      entry,
      count: Math.max(0, Math.floor(counts[entry.id] ?? 0)),
    }));
    const fielded = vector.filter((merc) => merc.count > 0);
    if (fielded.length === 0 || marches < 1) return null;
    // A shape is only a plan if the stock can field it on every one of those marches. The planner derives
    // `marches` from the counts (`marchesFor`), so this never bites there — but a caller may pass both, and
    // the two must not disagree: fielding a count the stock cannot sustain burns mercenaries it does not have.
    for (const merc of fielded) {
      if (lastsMarches(stock[merc.entry.id] ?? 0, merc.count) < marches) return null;
    }
    // what the enemy can kill in one march, and the HP the mercenaries need shelter from
    const mercenaryHp = Math.max(...fielded.map((merc) => merc.count * merc.entry.hp));
    const budgetPerMarch = silverBudget === undefined ? undefined : silverBudget / marches;
    const rungs = ladder(troops, depth, mercenaryHp, gap, leadership, scale);
    if (rungs.length === 0) return null;
    const march = marchOf([...rungs, ...vector], enemyStacks);
    if (budgetPerMarch !== undefined && march.silver > budgetPerMarch) return null;
    // the final march: the stock the uniform marches burn, and the silver they leave
    let finale: ScoredShape['finale'];
    if (noFinale) {
      finale = null;
    } else if (silverBudget === undefined) {
      const key = `${marches}|${vector.map((merc) => merc.count).join(',')}`;
      if (key !== cachedKey) {
        cachedKey = key;
        cachedFinale = finaleFor(marches, fielded, undefined);
      }
      finale = cachedFinale;
    } else {
      finale = finaleFor(marches, fielded, silverBudget - marches * march.silver);
    }
    return {
      marches,
      counts,
      rungs,
      march,
      finale,
      total: marches * march.damage + (finale?.march.damage ?? 0),
      silver: marches * march.silver + (finale?.march.silver ?? 0),
      mercLost: marches * march.mercLost + (finale?.march.mercLost ?? 0),
    };
  };
}

/** The scorer of one request, with the account's table built from it — the shorthand for a standalone sweep. */
export function shapeScorer(request: StackRequest, gap: number = DEFAULT_GAP, finale = true): ShapeScorer {
  const table = effectiveTable(request);
  return makeScorer({
    troops: rankTroops(table),
    mercTypes: table.filter((entry) => entry.pool === 'authority'),
    stock: request.caps,
    leadership: request.housing.leadership,
    enemyStacks: enemySquadCount(request.enemy),
    gap,
    finale,
  });
}

/**
 * Plan the campaign. The only inputs are the army and the enemy: the marches, the counts, and the split
 * between the two resources all fall out of them.
 */
export function planCampaign(input: CampaignInput): CampaignPlan {
  const { request } = input;
  const deadline = input.budgetMs === undefined ? Infinity : Date.now() + input.budgetMs;
  const outOfTime = (): boolean => Date.now() > deadline;
  const stop = (): boolean => outOfTime() || (input.shouldStop?.() ?? false);
  const gap = input.gap ?? DEFAULT_GAP;
  // S-58, the two candidate fixes for "the plan drops a whole hired type". Both off unless a caller — the
  // app through `src/config.ts`, or an experiment — asks for them.
  const tokenFloor = input.tokenFloor === true;
  const refuseDroppedTypes = input.refuseDroppedTypes === true;
  const enemyStacks = enemySquadCount(request.enemy);
  const table = effectiveTable(request);
  const troops = rankTroops(table);
  const mercTypes = table.filter((entry) => entry.pool === 'authority');
  const stock = request.caps;
  const leadership = request.housing.leadership;

  /**
   * The largest count of a type that still allows `marches` marches: fielding n loses `chunks(n)` for good, so
   * a constant n lasts `floor((stock − n) / chunks(n)) + 1`. Smaller counts last longer, and the whole grid of
   * interest is the set of these maxima and a few fractions below them.
   */
  const largestFor = (held: number, marches: number): number => {
    for (let count = held; count >= 1; count -= 1) {
      if (Math.floor((held - count) / chunks(count)) + 1 >= marches) return count;
    }
    return 0;
  };

  /**
   * The marches the campaign plays. A target fixes both the grid's march count and every candidate's, so
   * the grid is built for that one count instead of for all twelve: the maxima are `largestFor(held, K)`,
   * which is a different number at every K, and a grid built for the wrong K is a grid of counts that are
   * either infeasible (too big to last the run — `score` rejects them) or too small to be the maximum the
   * fractions are meant to sample around.
   */
  const planned = input.marchTarget === undefined ? undefined : Math.max(1, Math.floor(input.marchTarget));
  /**
   * The repeats a target leaves room for. The campaign plays `marchTarget` marches **in total**, and the last
   * of them is the finale — so a target of ten is nine repeats and a final march, which is what
   * `PlanTotals.marches` reports.
   *
   * A target of **one** is the exception that used to be an off-by-one (owner, 2026-09-15: *"a horizon of 1
   * plays 2 marches"*): `max(1, 1 − 1)` clamped the repeats up to a whole one, so the plan played a repeat
   * *and* a finale and a one-march target answered with two marches. There is nothing to leave over when
   * nothing is repeated, so a one-march target scores **no finale at all** (`makeScorer`'s `finale: false`)
   * and the single march is the repeated one, chosen against the stock it does not have to repeat.
   */
  const targetRepeats = planned === undefined ? undefined : Math.max(1, planned - 1);

  /**
   * The shapes the grid starts from, per march count.
   *
   * It was the cartesian product of five counts per mercenary type — `5ⁿ` shapes for `n` types. With the four
   * hired soldiers that is 624 shapes a march count and a search of about a second; but the authority pool is
   * **every monster the account owns** (69 units on this one), the picker lets a player field any of them, and
   * at eight types the product is 390,625 shapes for the first march count alone: minutes of nothing, which is
   * what "Generate never returns" was.
   *
   * So the product is taken over the `CROSSED_TYPES` types with the most to put on the field at that march
   * count — those set the HP the ladder has to clear and carry most of the damage — and every further type
   * rides one share of its own largest count. Up to five types that is exactly the old grid's size, so the
   * common case is unchanged; beyond it the cost stops growing with the pool. The breadth is kept rather than
   * traded away, because it feeds the two *ratio* picks as well as the maximum: a sparse grid loses the shape
   * that has one type at its largest and the rest small, which is the shape the mercenary-efficiency end is.
   */
  const vectors: { entry: Effective; count: number }[][] = [];
  const gridMarches =
    targetRepeats === undefined
      ? Array.from({ length: MAX_MARCHES }, (_unused, index) => index + 1)
      : [targetRepeats];
  for (const marches of gridMarches) {
    const maxima = mercTypes.map((entry) => largestFor(stock[entry.id] ?? 0, marches));
    const crossed = mercTypes
      .map((_entry, index) => index)
      .sort((a, b) => (maxima[b] ?? 0) * (mercTypes[b]?.hp ?? 0) - (maxima[a] ?? 0) * (mercTypes[a]?.hp ?? 0))
      .slice(0, CROSSED_TYPES);
    const isCrossed = new Set(crossed);
    const riding = mercTypes.map((_entry, index) => index).filter((index) => !isCrossed.has(index));
    const lists = crossed.map((index) => {
      const max = maxima[index] ?? 0;
      // S-58 A (`tokenFloor`): the thrift end samples one chunk of the type rather than none of it. A type
      // whose largest sustainable count is 0 keeps its 0 — there is nothing to field a token of.
      const floor = tokenFloor ? Math.min(CHUNK, max) : 0;
      return [...new Set([max, ...MERC_FRACTIONS.map((fraction) => Math.round(max * fraction)), floor])];
    });
    const products = lists.reduce<number[][]>(
      (acc, list) => acc.flatMap((partial) => list.map((count) => [...partial, count])),
      [[]],
    );
    const shares = riding.length === 0 ? [0] : [1, ...MERC_FRACTIONS];
    const seen = new Set<string>();
    for (const share of shares) {
      for (const product of products) {
        const counts = maxima.map((max, index) => {
          const at = crossed.indexOf(index);
          return at < 0 ? Math.round(max * share) : (product[at] ?? 0);
        });
        if (counts.every((count) => count === 0)) continue;
        const signature = counts.join(',');
        if (seen.has(signature)) continue;
        seen.add(signature);
        vectors.push(mercTypes.map((entry, index) => ({ entry, count: counts[index] ?? 0 })));
      }
    }
  }

  interface Candidate {
    marches: number;
    mercs: { entry: Effective; count: number }[];
    rungs: { entry: Effective; count: number }[];
    march: ReturnType<typeof marchOf>;
    finale: ReturnType<typeof marchOf> | null;
    finaleRungs: { entry: Effective; count: number }[];
    total: number;
    /** Total silver the plan spends — filled in where the efficiency is judged. */
    spent?: number;
    /** The ladder the march was built on, carried so the climb can refine it as well as the counts. */
    depth: number;
    scale: number;
    /** Its silver and its losses, counted once (`ratioOf`) — every candidate is judged on them. */
    ratios?: { silver: number; mercs: number };
  }
  let best: Candidate | null = null;
  const frontier: Candidate[] = [];
  const consider = (candidate: Candidate): void => {
    frontier.push(candidate);
    if (!best || candidate.total > best.total) best = candidate;
  };
  /** One bucket per silver level, holding the best damage and the best damage-per-mercenary found there. */
  // 1.2× a bucket: fine enough to read the curve's shape, coarse enough to be one line per level. Sixty
  // of them span 10 k to 560 M silver, which is every plan a single account can afford.
  const BUCKETS = 60;
  const bucketLog = Math.log(1.2);
  const bucketOf = (silver: number): number =>
    Math.min(BUCKETS - 1, Math.max(0, Math.round(Math.log(silver / 10_000) / bucketLog)));
  const buckets = new Map<
    number,
    {
      best: { damage: number; silver: number; mercs: number };
      thrifty: { damage: number; silver: number; mercs: number };
    }
  >();
  /** The plan that buys the most damage per silver — only meaningful before a budget is applied. */
  let light: Candidate | null = null;
  /** The plan that buys the most damage per mercenary, and the one where the two ratios meet. */
  let heavy: Candidate | null = null;
  let balanced: Candidate | null = null;
  let peakSilver = 0;
  let peakMercenary = 0;
  const toMarch = (
    rungs: { entry: Effective; count: number }[],
    mercs: { entry: Effective; count: number }[],
    totals: ReturnType<typeof marchOf>,
  ): PlanMarch => {
    const counts: Record<string, number> = {};
    for (const rung of rungs) counts[rung.entry.id] = rung.count;
    const mercFielded: Record<string, number> = {};
    for (const merc of mercs) {
      if (merc.count > 0) {
        counts[merc.entry.id] = merc.count;
        mercFielded[merc.entry.id] = merc.count;
      }
    }
    const gold = mercs
      .filter((merc) => merc.count > 0)
      .reduce((sum, merc) => {
        const one = reviveOne(merc.entry.unit, merc.count, request.recovery);
        return sum + one.gold;
      }, 0);
    const silver = rungs.reduce(
      (sum, rung) => sum + retrainOne(rung.entry.unit, rung.count, request.recovery).silver,
      0,
    );
    return {
      counts,
      damage: Math.round(totals.damage),
      silver: Math.round(silver),
      gold: Math.round(gold),
      mercFielded,
      mercLost: totals.mercLost,
      strikes: Math.round(totals.strikes),
      stacks: rungs.length + mercs.filter((merc) => merc.count > 0).length,
    };
  };

  const ratioOf = (candidate: Candidate): { silver: number; mercs: number } => {
    // Counted once per candidate and kept: `record` reads the *current* best's ratios again on every
    // candidate it sees, and re-adding a plan's whole arithmetic for each of those is pure repetition.
    if (candidate.ratios !== undefined) return candidate.ratios;
    const m = toMarch(candidate.rungs, candidate.mercs, candidate.march);
    const ratios = {
      silver: candidate.marches * m.silver + (candidate.finale?.silver ?? 0),
      mercs: candidate.marches * m.mercLost + (candidate.finale?.mercLost ?? 0),
    };
    candidate.ratios = ratios;
    return ratios;
  };

  const score = makeScorer({ troops, mercTypes, stock, leadership, enemyStacks, gap, finale: planned !== 1 });
  /** Silver one candidate spends: its repeats, plus its final march. */
  const marchedSilver = (candidate: Candidate): number =>
    candidate.marches * candidate.march.silver + (candidate.finale?.silver ?? 0);

  /** Books one scored shape into everything the search carries: the three picks, the buckets, the peaks. */
  const record = (candidate: Candidate): void => {
    const { total } = candidate;
    const spent = marchedSilver(candidate);
    const lightSpent = light?.spent ?? 0;
    if (spent > 0 && (!light || total / spent > light.total / lightSpent)) {
      light = { ...candidate, spent };
    }
    // The three picks the UI toggles between, measured over every candidate rather than over the thinned
    // frontier: the most damage a silver, the most damage a mercenary, and where the two ratios meet.
    const { silver: pointSilver, mercs: pointMercs } = ratioOf(candidate);
    if (pointSilver > 10_000 && pointMercs > 0 && pointSilver < 10_000 * 1.2 ** BUCKETS) {
      const key = bucketOf(pointSilver);
      const entry = buckets.get(key) ?? {
        best: { damage: 0, silver: 0, mercs: 0 },
        thrifty: { damage: 0, silver: 0, mercs: 0 },
      };
      if (total > entry.best.damage) entry.best = { damage: total, silver: pointSilver, mercs: pointMercs };
      if (total / pointMercs > entry.thrifty.damage / Math.max(1, entry.thrifty.mercs)) {
        entry.thrifty = { damage: total, silver: pointSilver, mercs: pointMercs };
      }
      buckets.set(key, entry);
    }
    if (pointSilver <= 0 || pointMercs <= 0) return;
    const perSilver = total / pointSilver;
    const perMerc = total / pointMercs;
    if (perSilver > peakSilver) {
      peakSilver = perSilver;
      light = { ...candidate, spent: pointSilver };
    }
    if (perMerc > peakMercenary) {
      peakMercenary = perMerc;
      heavy = candidate;
    }
    if (peakSilver <= 0 || peakMercenary <= 0) return;
    const measure = Math.min(perSilver / peakSilver, perMerc / peakMercenary);
    const bestMeasure =
      balanced === null
        ? -1
        : Math.min(
            ratioOf(balanced).silver > 0 ? balanced.total / ratioOf(balanced).silver / peakSilver : 0,
            ratioOf(balanced).mercs > 0 ? balanced.total / ratioOf(balanced).mercs / peakMercenary : 0,
          );
    if (measure > bestMeasure) balanced = candidate;
  };

  /**
   * Score one mercenary vector. The ladder grid is the full `DEPTHS × LADDER_GROWTHS`; `only` pins it to a
   * single rung count and scale instead, which is what the refinement pass below uses — re-scoring one
   * shape costs one shape, where the whole grid costs eighty.
   */
  const evaluateVector = (
    vector: { entry: Effective; count: number }[],
    only?: { depth: number; scale: number },
  ): Candidate | null => {
    let pick: Candidate | null = null;
    const fielded = vector.filter((merc) => merc.count > 0);
    if (fielded.length === 0) return null;
    const marches = targetRepeats ?? marchesFor(stock, fielded);
    if (marches < 1) return null;
    const counts: Record<string, number> = {};
    for (const merc of vector) counts[merc.entry.id] = merc.count;
    for (const depth of only ? [only.depth] : DEPTHS) {
      for (const scale of only ? [only.scale] : LADDER_GROWTHS) {
        const scored = score(marches, counts, depth, scale, input.silverBudget);
        if (!scored) continue;
        const candidate: Candidate = {
          marches,
          mercs: vector,
          rungs: scored.rungs,
          march: scored.march,
          finale: scored.finale?.march ?? null,
          finaleRungs: scored.finale?.rungs ?? [],
          total: scored.total,
          depth,
          scale,
        };
        if (!pick || candidate.total > pick.total) pick = candidate;
        record(candidate);
      }
    }
    return pick;
  };

  // the grid: every march count, then fractions of the largest count each type can carry at that count
  for (const vector of vectors) {
    if (stop()) break;
    const candidate = evaluateVector(vector);
    if (candidate) consider(candidate);
  }

  if (!best) throw new Error('planCampaign: no feasible plan for this army');

  /**
   * The grid above is coarse on purpose — it walks the march count, then fractions of the largest count each
   * type can carry, then ten ladder scales — and the true optimum sits between all three. With a silver
   * budget a slightly *smaller* mercenary stack lowers the floor the ladder has to clear and buys back silver
   * for the troops; and a slightly *taller* ladder buys troop damage the ten scales never sample (measured,
   * `tools/theorycraft/69-scale-grid.test.ts`: one shape at scale 3.45 against 3.2 is +5.6 % damage, and 3.45
   * is not on the list). So the best few grid plans are hill-climbed on the counts **and** on the ladder.
   */
  // one seed per march count, not just the global best: the hill-climb has to run in every K's own
  // neighbourhood, because the counts that fit 3 marches are not near the counts that fit 6
  const byMarches = new Map<number, Candidate>();
  for (const candidate of frontier) {
    const current = byMarches.get(candidate.marches);
    if (!current || candidate.total > current.total) byMarches.set(candidate.marches, candidate);
  }
  const seeds = [...byMarches.values()].sort((a, b) => b.total - a.total).slice(0, 8);
  /** Relative steps the ladder's scale is walked by, geometrically so they read the same at 1.5 and at 9. */
  const SCALE_STEPS = [
    0.005, -0.005, 0.01, -0.01, 0.025, -0.025, 0.05, -0.05, 0.1, -0.1, 0.2, -0.2, 0.35, -0.35,
  ];
  /** A floor scale is a multiple of the mercenary HP, so it is at least 1; the ladder is capped by
   *  leadership long before 12 can be spent, and the cut keeps the walk finite. */
  const MAX_SCALE = 12;
  for (const seed of seeds) {
    let vector = seed.mercs.map((merc) => ({ ...merc }));
    let depth = seed.depth;
    let scale = seed.scale;
    // Each seed climbs in its own neighbourhood, and the climb walks **plateaus** as well as slopes: the
    // counts that fit a small march count sit next to each other with identical totals (the mercenary floor
    // moves in steps), and a strictly-improving ascent stops on the first of them instead of crossing to the
    // better shape on the far side. A visited set keeps the walk finite.
    let localBest = seed.total;
    const where = (v: typeof vector, d: number, s: number): string =>
      `${v.map((merc) => merc.count).join('/')}|${d}|${s.toFixed(3)}`;
    const visited = new Set<string>([where(vector, depth, scale)]);
    for (let round = 0; round < 16; round += 1) {
      if (stop()) break;
      let moved = false;
      // the mercenary counts, re-scored over the whole ladder grid so a smaller stack still gets the ladder
      // its new floor deserves
      for (let index = 0; index < vector.length; index += 1) {
        for (const delta of [1, -1, 2, -2]) {
          const held = stock[vector[index]?.entry.id ?? ''] ?? 0;
          const count = Math.max(0, Math.min(held, (vector[index]?.count ?? 0) + delta));
          if (count === vector[index]?.count) continue;
          const trial = vector.map((merc, i) => (i === index ? { ...merc, count } : merc));
          const key = where(trial, depth, scale);
          if (visited.has(key)) continue;
          visited.add(key);
          const candidate = evaluateVector(trial);
          if (candidate && candidate.total >= localBest - 1) {
            localBest = Math.max(localBest, candidate.total);
            consider(candidate);
            vector = trial;
            depth = candidate.depth;
            scale = candidate.scale;
            moved = true;
          }
        }
      }
      // the ladder itself: one more or one fewer rung, then the scale between the ten the grid offers
      for (const rung of [depth - 1, depth + 1]) {
        // Widened on purpose: a step off either end of the ladder is a computed number, not one of
        // the rungs, and that is exactly what this asks.
        if (!(DEPTHS as readonly number[]).includes(rung)) continue;
        const key = where(vector, rung, scale);
        if (visited.has(key)) continue;
        visited.add(key);
        const candidate = evaluateVector(vector, { depth: rung, scale });
        if (candidate && candidate.total >= localBest - 1) {
          localBest = Math.max(localBest, candidate.total);
          consider(candidate);
          depth = rung;
          moved = true;
        }
      }
      for (const step of SCALE_STEPS) {
        const trial = Math.round(scale * (1 + step) * 1000) / 1000;
        if (trial < 1 || trial > MAX_SCALE) continue;
        const key = where(vector, depth, trial);
        if (visited.has(key)) continue;
        visited.add(key);
        const candidate = evaluateVector(vector, { depth, scale: trial });
        if (candidate && candidate.total >= localBest - 1) {
          localBest = Math.max(localBest, candidate.total);
          consider(candidate);
          scale = trial;
          moved = true;
        }
      }
      // Each type taken to one of the shares the grid no longer crosses against the others — its largest
      // count at this march count, and down. The moves above shift a count by one or two at a time, so a
      // shape that wants one type at its largest while the rest stay small (which is what lifts the floor
      // the ladder has to clear, and with it what the whole march costs) is reached from here instead.
      // Under a target the run is the target's, not the vector's: `marchesFor` reads the tightest type the
      // vector happens to field, which is a different count of marches than the plan is planning for, and
      // `largestFor` at that count is a different maximum than the one the moves below mean to sample.
      const currentMarches =
        targetRepeats ??
        marchesFor(
          stock,
          vector.filter((merc) => merc.count > 0),
        );
      for (let index = 0; index < vector.length; index += 1) {
        const id = vector[index]?.entry.id ?? '';
        const max = largestFor(stock[id] ?? 0, currentMarches);
        for (const fraction of [1, ...MERC_FRACTIONS, 0]) {
          const count = Math.round(max * fraction);
          if (count === (vector[index]?.count ?? 0)) continue;
          const trial = vector.map((merc, i) => (i === index ? { ...merc, count } : merc));
          const key = where(trial, depth, scale);
          if (visited.has(key)) continue;
          visited.add(key);
          const candidate = evaluateVector(trial, { depth, scale });
          if (candidate && candidate.total >= localBest - 1) {
            localBest = Math.max(localBest, candidate.total);
            consider(candidate);
            vector = trial;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }

  const chosen = best as Candidate;
  const march = toMarch(chosen.rungs, chosen.mercs, chosen.march);
  const finale = chosen.finale
    ? toMarch(chosen.finaleRungs, leftoverVector(stock, chosen), chosen.finale)
    : undefined;
  // The frontier the UI shows: only the plans nothing else beats on every resource at once, thinned to a
  // readable number. This is also where the recommendation comes from when no silver budget was given.
  const summarise = (candidate: Candidate): PlanTotals & { label: string } => {
    const m = toMarch(candidate.rungs, candidate.mercs, candidate.march);
    const silver = candidate.marches * m.silver + (candidate.finale?.silver ?? 0);
    const mercLost = candidate.marches * m.mercLost + (candidate.finale?.mercLost ?? 0);
    /**
     * The plan's identity in the player's own terms: how deep the march is (its troop stacks), how many hired
     * units ride it, and what one march of it costs. The old label was `N× 7 rungs + finale`, which named the
     * *engine's* repeat count and the rung count — at a fixed march target every row began with the same `9×`,
     * so ten of sixteen rows wore one name and a slider could not tell its own stops apart. Measured against
     * the carried lists at `marchTarget` 10 and 20 (`tools/theorycraft/out/73-plan-horizon.md` §7): stacks +
     * hired leaves one collision (five rows at a target of 10), and **the mercenary split does not fix it** —
     * the colliding rows are one march shape at different ladder spends, so the disambiguator has to be a
     * number, not a shape. The march's own silver does fix it, and it is written in the March's own compact
     * idiom (`1.7M`, `890K`), not in a third one. Presentation only: no number in the payload moves — the
     * march count is `PlanTotals.marches` and the finale is `finaleCounts`.
     */
    const stacks = candidate.rungs.length;
    const hired = Object.values(m.mercFielded).reduce((sum, count) => sum + count, 0);
    return {
      label:
        `${stacks} ${stacks === 1 ? 'stack' : 'stacks'} · ${hired} hired · ` +
        `${compact(m.silver)} silver a march`,
      counts: m.counts,
      ...(candidate.finale && candidate.finaleRungs.length > 0
        ? {
            finaleCounts: toMarch(candidate.finaleRungs, leftoversOf(candidate, stock), candidate.finale)
              .counts,
          }
        : {}),
      totalDamage: Math.round(candidate.total),
      silver,
      gold: candidate.marches * m.gold,
      mercLost,
      // The repeated march's own figures, which `toMarch` already priced and the totals above spread the
      // finale over: these are what the March section reports for the plan's own march.
      repeat: { damage: m.damage, silver: m.silver, mercLost: m.mercLost },
      marches: candidate.marches + (candidate.finale ? 1 : 0),
      damagePerSilver: silver > 0 ? candidate.total / silver : Infinity,
      damagePerMercenary: mercLost > 0 ? candidate.total / mercLost : Infinity,
    };
  };
  const all = frontier.map(summarise);
  const undominated = all.filter(
    (a) =>
      !all.some(
        (b) =>
          b !== a &&
          b.silver <= a.silver &&
          b.mercLost <= a.mercLost &&
          b.totalDamage >= a.totalDamage &&
          (b.silver < a.silver || b.mercLost < a.mercLost || b.totalDamage > a.totalDamage),
      ),
  );
  undominated.sort((a, b) => a.silver - b.silver || a.mercLost - b.mercLost || a.totalDamage - b.totalDamage);
  const keep = Math.max(2, input.alternatives ?? 12);
  const chosenPoint = summarise(chosen);

  /**
   * The band the list is cut to. The owner, on the bar: *"well just don't show the extremes, if we use a
   * certain % of mercs or waay too much silver we're too far off from our goal of everything optimized."*
   * A plan is near the goal when its march is not a token field and not a silver sink:
   *
   *   **mercenaries** — it fields at least **half the hired troops the plan's own march fields** (the goal's
   *   mercenary share is the yardstick, so a horizon that legitimately fields few mercenaries is not punished
   *   for it); **silver** — it returns at least **half the plan's own damage a silver**; and **the march**
   *   itself must be more than a single troop stack (experiment 72's criterion, and the owner's own "the
   *   least silver plan would never be chosen … is not a strategy" — the plan a one-stack march describes is
   *   exactly the cheapest row the frontier used to carry).
   *
   * Every threshold is measured against `chosen`, never a free-standing number, so the plan itself is always
   * inside the band — and `balanced` is anchored on the same two ratios. Measured on the account
   * (`tools/theorycraft/out/74-row-figures.md` §2b): at a target of 10 the band keeps 31 of 46 frontier rows,
   * at 20 it keeps 15 of 31, the plan and the sweet spot pass at both, and the two ratio picks — the cheapest
   * one-stack march and the 9-mercenary silver sink — are the first rows it refuses.
   */
  const mercIds = new Set(mercTypes.map((entry) => entry.id));
  const hiredOf = (counts: Record<string, number>): number =>
    Object.entries(counts).reduce((sum, [id, count]) => sum + (mercIds.has(id) ? count : 0), 0);
  const goal = { hired: hiredOf(chosenPoint.counts), perSilver: chosenPoint.damagePerSilver };
  /**
   * The types the account holds a stock of, for S-58 B. Only the *stocked* ones: the authority pool is every
   * monster the account owns as well as the hired soldiers, and a monster with no cap is not something the
   * plan rations.
   */
  const stocked = mercTypes.filter((entry) => (stock[entry.id] ?? 0) > 0);
  const inBand = (row: PlanTotals & { label: string }): boolean =>
    hiredOf(row.counts) * 2 >= goal.hired &&
    row.damagePerSilver * 2 >= goal.perSilver &&
    Object.keys(row.counts).filter((id) => !mercIds.has(id)).length > 1 &&
    // S-58 B (`refuseDroppedTypes`): a plan the player is offered fields a little of everything they hold.
    // The band can empty out if the *winner* drops a type; the fallback below hands the whole frontier back
    // rather than an empty list, which is the same graceful degradation the other three refusals have.
    (!refuseDroppedTypes || stocked.every((entry) => (row.counts[entry.id] ?? 0) > 0));

  const banded = undominated.filter(inBand);
  // A caller who asks for at least as many rows as the frontier holds is asking for the frontier, and gets
  // it whole; a caller asking for fewer rows than exist gets the band, because that is the list the UI draws
  // the bar from. An empty band is never handed back: the unbanded frontier is.
  const source = undominated.length <= keep ? undominated : banded.length > 0 ? banded : undominated;
  /**
   * How many of the frontier's plans the band refused **to hand back** — 0 whenever the frontier was handed
   * back whole, because then nothing was refused. The count and the list have to agree: the UI prints this
   * number next to a table, and a number describing rows the player can see in that table is a lie.
   */
  const leftOut = source === banded ? undominated.length - banded.length : 0;
  const sampled: (PlanTotals & { label: string })[] =
    source.length <= keep
      ? [...source]
      : Array.from(
          { length: keep },
          (_unused, index) =>
            source[Math.round((index * (source.length - 1)) / (keep - 1))] as PlanTotals & {
              label: string;
            },
        );
  // The plan on screen must be *on* the list the UI marks, so the two the module settles on — the one it
  // sized, and the balanced one when no budget was given — are added when the thinning skipped them. The two
  // ratio picks are added only if the band keeps them: they are the extremes by definition, and when they
  // are the plans the owner says he would never choose, the bar must not carry them.
  for (const point of [
    chosenPoint,
    balanced ? summarise(balanced) : chosenPoint,
    ...(light && inBand(summarise(light)) ? [summarise(light)] : []),
    ...(heavy && inBand(summarise(heavy)) ? [summarise(heavy)] : []),
  ]) {
    if (!sampled.some((row) => row.silver === point.silver && row.totalDamage === point.totalDamage)) {
      sampled.push(point);
    }
  }

  /**
   * The compromise when no silver budget is given: the plan that stands as close as it can to **both**
   * ratios at once — damage per silver and damage per mercenary — each measured against the best the
   * frontier offers. Picking either extreme is a plan that spends one resource to waste the other: the
   * efficiency peak burns silver well and mercenaries badly, and the mercenary peak does the reverse. The
   * owner asked for the sweet spot between them, and this is its definition, with no parameter to set.
   */
  // The three picks were measured over every candidate while the search ran (see `light`, `balanced` and
  // `heavy` in the loop); what is left here is making sure the ones the UI marks are on the list it draws.
  sampled.sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
  const alternatives: (PlanTotals & { label: string })[] = sampled;

  /**
   * The recommendation when no silver budget is given: the **knee** of the damage-against-silver curve — the
   * plan where one more piece of silver stops buying damage as fast as it did before. It is the balanced
   * proposal the owner asked for: it neither under-spends on troops nor burns the stock for a marginal gain,
   * and it needs no input beyond the army.
   */
  const knee = ((): (PlanTotals & { label: string }) | undefined => {
    const points = undominated.filter((point) => Number.isFinite(point.damagePerSilver) && point.silver > 0);
    if (points.length < 3) return points[points.length - 1];
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return undefined;
    // distance to the line joining the two ends of the frontier, in normalised units
    const dx = last.silver - first.silver || 1;
    const dy = last.totalDamage - first.totalDamage || 1;
    let best = first;
    let bestDistance = -Infinity;
    for (const point of points) {
      const t = (point.silver - first.silver) / dx;
      const expected = first.totalDamage + t * dy;
      const distance = (point.totalDamage - expected) / dy;
      if (distance > bestDistance) {
        bestDistance = distance;
        best = point;
      }
    }
    return best;
  })();

  const leadershipUsed = chosen.rungs.reduce((sum, rung) => sum + rung.count * rung.entry.cost, 0);
  const total: PlanTotals = summarise(chosen);
  const curve: PlanCurvePoint[] = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, entry]) => ({
      silver: entry.best.silver,
      damage: Math.round(entry.best.damage),
      damagePerSilver: entry.best.damage / entry.best.silver,
      mercLost: entry.best.mercs,
      thriftyDamage: Math.round(entry.thrifty.damage),
      thriftyMercLost: entry.thrifty.mercs,
      thriftyPerMercenary: entry.thrifty.damage / Math.max(1, entry.thrifty.mercs),
    }));
  return {
    curve,
    ...total,
    march,
    finale,
    binding: {
      // A ladder is priced in whole units, so a plan rarely lands exactly on a budget: silver counts as
      // binding when the plan spends nearly all of it.
      silver: input.silverBudget !== undefined && total.silver >= input.silverBudget * 0.9,
      mercenaries: chosen.mercs.some((merc) => merc.count >= (stock[merc.entry.id] ?? 0)),
      leadership: leadershipUsed >= leadership * 0.999,
      marches: input.marchTarget !== undefined,
    },
    alternatives,
    leftOut,
    // With no budget the recommendation is the plan that buys the most damage per silver: the owner asked for
    // the sweet spot between the two resources, and that is the plan where silver is stretched furthest before
    // the frontier turns into diminishing returns. The knee is carried beside it for the UI to show the trade.
    ...(input.silverBudget === undefined
      ? {
          recommend: balanced ? summarise(balanced) : chosenPoint,
          knee: knee ?? chosenPoint,
          mostEfficient: light ? summarise(light) : chosenPoint,
          mostThrifty: heavy ? summarise(heavy) : chosenPoint,
        }
      : {}),
  };
}

function leftoversOf(
  candidate: { marches: number; mercs: { entry: Effective; count: number }[] },
  stock: Record<string, number>,
): { entry: Effective; count: number }[] {
  return candidate.mercs
    .map((merc) => ({
      entry: merc.entry,
      count: Math.max(0, (stock[merc.entry.id] ?? 0) - candidate.marches * chunks(merc.count)),
    }))
    .filter((merc) => merc.count > 0);
}

/** The mercenaries a plan leaves for its final march. */
function leftoverVector(
  stock: Record<string, number>,
  candidate: { marches: number; mercs: { entry: Effective; count: number }[] },
): { entry: Effective; count: number }[] {
  return candidate.mercs
    .map((merc) => ({
      entry: merc.entry,
      count: Math.max(0, (stock[merc.entry.id] ?? 0) - candidate.marches * chunks(merc.count)),
    }))
    .filter((merc) => merc.count > 0);
}
