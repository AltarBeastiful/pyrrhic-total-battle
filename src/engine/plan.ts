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
import { sizeStacks } from './stacker';
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
   * **The sizer's own march as a shape** (owner, 2026-09-17: *"are we actually exploring what each additional
   * troop type in the march brings us? … adding them back just brings damage up and cost down"*; behind
   * `CAMPAIGN.planFixes.sizerShape`, compared in `tools/theorycraft/93`).
   *
   * The search sizes the troop side of every march as a **ladder**: the strongest `depth` types by damage per
   * HP, one rung each, 2 % apart, scaled — a shape with two knobs that is fast to walk and that only ever
   * fields a *prefix* of the ranking. The app itself sizes a march with the Elite sizer over the types on
   * screen, which is why a put-back can beat the plan's own march: the sizer is a different shape, and one the
   * search never scored. Set, every mercenary vector is also scored with the Elite sizer over **every** troop
   * type the account holds (the hired counts as caps), and the better shape wins on the same total. Off, the
   * search is the ladder alone, as it was.
   */
  sizerShape?: boolean;
  /**
   * **Which resource the bar runs along** (behind `CAMPAIGN.planBar.axis`, review of 2026-09-16).
   *
   * `'silver'` (the default, S-59): the four named answers — sweet spot, most damage, best damage a silver,
   * best damage a hired unit — sorted by the campaign's silver. Measured on the owner's export at the app's
   * horizon, silver a march runs only 1.97–2.35 M across the whole bar (it is set by the troop rungs) while
   * hired burn runs 12→22 and damage 4.1→6.9 M, so the axis the bar is labelled with is the resource that
   * does not move, and its two right-hand stops are one plan to 0.2 %.
   *
   * `'burn'`: the bar runs along **hired units burned a march**, the resource that does not come back. The
   * stops are the best march at each of up to `alternatives` burn levels — the thriftiest level the band
   * keeps (`spare-the-stock`), the sweet spot (the same plan as on the silver axis, so the two axes differ
   * only in what stands beside it), the most damage (`most-damage`), and `step` rows filling the widest gaps
   * between them. One plan a burn level, so two plans that burn the same cannot both be stops. Sorted by
   * burn, thriftiest first. Compared against the silver axis in `tools/theorycraft/91`.
   */
  barAxis?: 'silver' | 'burn';
  /**
   * **Merge stops that are one plan to the eye** (behind `CAMPAIGN.planBar.mergeNear`, the candidate fix to
   * the silver axis measured in `tools/theorycraft/91`). A fraction: two stops that burn the same and whose
   * damage and silver a march are within it of each other are one stop, and the one named first (sweet spot,
   * then most damage, then best for silver, then spare the stock) keeps the place. `0` or omitted: off.
   * Dedup is otherwise by exact counts, which is how `best-for-silver` and `most-damage` came to sit one
   * stop apart at 6 905 207 and 6 920 621 damage on the owner's own bar.
   */
  mergeNearStops?: number;
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
   * Ask for the **trade** itself — every plan the four answers are drawn from — as `CampaignPlan.trade`.
   *
   * Omitted, the payload carries what a screen draws and nothing else. Asked for, it carries the whole set
   * the picks were chosen from: the plans inside the band, plus the recommendation (which is offered whether
   * or not the band keeps it), cheapest first. That is what an experiment needs to ask "where else could the
   * sweet spot have been, and what would it have cost" — a question about the *shape* of the trade rather
   * than about the four answers on it, and one that cannot be answered from the picks alone.
   *
   * It is not a UI input: the bar draws four rows, and a caller that draws the trade itself would be
   * re-inventing the picks.
   */
  withTrade?: boolean;
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
  /** What the march's hired stacks cost to bring back: the engine prices mercenaries in gold, not silver. */
  gold: number;
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

/**
 * **Which of the four answers a row on the bar is** (S-59, owner 2026-09-16).
 *
 * The bar used to carry up to six *rules* — the winner, the best damage a silver, the sweet spot, the knee,
 * the most damage and the kindest to the stock — each wearing a sentence that described its shape
 * (`3 stacks · 205 hired · 2.3M silver a march`). Two of those sentences were one row apart and read as a
 * typo, the silver in them was a column of the table below, and "stacks" meant the march's troop rungs in the
 * label and every stack in the table. So a row now carries **which answer it is** and the UI writes the words
 * (`docs/investigations/0020-the-plan-screen.md` §D-1), and the four answers are defined over the plans the
 * band keeps rather than over whichever rules happened to fire.
 *
 * The engine states the identity; naming it is the UI's (`docs/design.md` §7). No word of English is in the
 * payload any more.
 */
export type PlanPick = 'best-for-silver' | 'spare-the-stock' | 'sweet-spot' | 'most-damage' | 'step';

/**
 * A plan the bar offers: one of the four answers above, priced.
 *
 * It carries **both** names. `pick` is what the player is shown — the UI writes the words for it
 * (`docs/design.md` §7). `label` is the shape sentence the engine has always written (`3 stacks · 45 hired ·
 * 1.6M silver a march`); **the app stopped drawing it in S-59**, because the silver in it is a column of the
 * table under it and "stacks" meant the march's troop rungs there and every stack here, and it stays because
 * a dozen recorded experiments (`tools/theorycraft/63`…`86`) read it as the row's identity in their reports.
 * One of the two is for the screen and one is for the record; neither is a second opinion on a number.
 */
export interface PlanRow extends PlanTotals {
  pick: PlanPick;
  label: string;
  /**
   * **Which efficiency this stop is the bar's best at** (owner, 2026-09-17: the slider is *"about balancing
   * between burning silver efficiently, which is constrained, and burning mercs efficiently, which is
   * constrained as well"*). Of the stops the bar carries, exactly one is the best damage a silver and exactly
   * one the best damage a hired unit — and on any account whose mercenaries are priced in gold they are the
   * dear end and the thrift end, because a hired stack adds damage and no silver. So the two efficiencies are
   * **said on the stops that have them** rather than offered as stops of their own: measured on the owner's
   * bar, a "Best for silver" stop was the "Most damage" stop to 0.2 % (`tools/theorycraft/out/91`), one more
   * row to read that did nothing its name promised.
   */
  bestFor: { silver: boolean; hired: boolean };
}

export interface CampaignPlan extends PlanTotals {
  /** Which resource `alternatives` runs along — what the caller asked for (`CampaignInput.barAxis`). */
  barAxis: 'silver' | 'burn';
  /** The repeated march (the plan is this, `marches` times), or the single march if `marches` is 1. */
  march: PlanMarch;
  /** The last march, built from what the stock and the silver have left. Absent when nothing is left. */
  finale?: PlanMarch | undefined;
  /** Which resource stops the plan being better. */
  binding: { silver: boolean; mercenaries: boolean; leadership: boolean; marches: boolean };
  /**
   * The four answers the bar carries, cheapest first: the best damage a silver, the best damage a hired unit,
   * the sweet spot and the most damage — each drawn from the plans inside the **band** (see `leftOut`),
   * deduplicated by their counts. Four at most, and a plan that several answers fit wears the first of them.
   */
  alternatives: PlanRow[];
  /**
   * **The trade**: every plan the four answers above were drawn from — the band, plus the recommendation —
   * cheapest first. Present only when the caller asked for it (`CampaignInput.withTrade`), because a screen
   * draws the four answers and this is the set behind them.
   */
  trade?: PlanTotals[] | undefined;
  /**
   * How many of the frontier's non-dominated plans the bar does **not** offer. The four answers above are
   * drawn from the plans inside the band — the marches that field a token share of the hired stock, spend
   * silver far past what they return, or stand on a single troop stack are not among them — and this counts
   * everything the bar left behind, refused by the band or simply not one of the four answers.
   *
   * `0` when the band would keep nothing at all: the four answers are drawn from the unbanded frontier
   * instead, and nothing was refused by a band that never applied.
   */
  leftOut: number;
  /**
   * The campaign's whole curve, bucketed by silver: what that much silver buys, and what it buys per
   * mercenary. The two are the owner's two slopes, and the bucketing is what makes the shape visible —
   * the frontier list above is thinned for the eye.
   */
  curve: PlanCurvePoint[];
  /**
   * The **sweet spot**: the middle of the trade in hired stock, present only when no silver budget was given.
   * With a budget the plan *is* the answer and there is nothing left to balance. It is the bar's
   * `sweet-spot` row, and where the bar opens — see the rule's own note beside `sweetSpotBase`.
   */
  recommend?: PlanRow | undefined;
  /**
   * The knee of the damage-against-silver curve: where one more piece of silver stops buying damage as fast
   * as it did before. **No longer a row of its own** (S-59), and since the owner's correction of 2026-09-16 it
   * decides nothing either — the recommendation is the middle of the trade in hired stock (`recommend`). It is
   * carried for the curve's own shape.
   */
  knee?: (PlanTotals & { label: string }) | undefined;
  /** The plan that buys the most damage per silver over the whole search, band or no band. */
  mostEfficient?: (PlanTotals & { label: string }) | undefined;
  /** The plan that buys the most damage per mercenary over the whole search, band or no band. */
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
  /**
   * The Elite sizer's troop stacks for a mercenary vector, over every troop type the account holds — the
   * shape scored when `depth` is `0` (`CampaignInput.sizerShape`). Absent, a depth of `0` scores nothing.
   */
  sizer?:
    ((mercs: { entry: Effective; count: number }[]) => { entry: Effective; count: number }[]) | undefined;
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
    // Depth 0 is the sizer's own march (see `ShapeContext.sizer`), every other depth a ladder.
    const rungs =
      depth === 0
        ? (context.sizer?.(fielded) ?? [])
        : ladder(troops, depth, mercenaryHp, gap, leadership, scale);
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
  /** The plan that buys the most damage per mercenary over the whole search. */
  let heavy: Candidate | null = null;
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

  const byId = new Map(table.map((entry) => [entry.id, entry]));
  const sizerShape = input.sizerShape === true;
  /**
   * The Elite sizer over every troop type, the hired counts as caps — what the March pane draws after a
   * put-back, scored inside the search so the plan can find it itself (`CampaignInput.sizerShape`).
   */
  const sizer = (mercs: { entry: Effective; count: number }[]): { entry: Effective; count: number }[] => {
    const caps: Record<string, number> = { ...request.caps };
    const fieldedIds = new Set<string>();
    for (const merc of mercs) {
      caps[merc.entry.id] = merc.count;
      if (merc.count > 0) fieldedIds.add(merc.entry.id);
    }
    const sized = sizeStacks({
      ...request,
      caps,
      units: request.units.filter((unit) => unit.pool === 'leadership' || fieldedIds.has(unit.id)),
      options: { ...request.options, method: 'elite', relaxedPreservation: false },
    });
    return sized.stacks
      .filter((stack) => stack.pool === 'leadership' && stack.count > 0)
      .map((stack) => ({ entry: byId.get(stack.unitId) as Effective, count: stack.count }))
      .filter((rung) => rung.entry !== undefined);
  };
  const score = makeScorer({
    troops,
    mercTypes,
    stock,
    leadership,
    enemyStacks,
    gap,
    finale: planned !== 1,
    ...(sizerShape ? { sizer } : {}),
  });
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
    // frontier: the most damage a silver and the most damage a mercenary. The third pick the UI toggles
    // between — the sweet spot — is no longer read here: since 2026-09-16 it is the middle of the *trade* in
    // hired stock, which is a question about the plans the bar can carry and not about the search's peaks.
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
    // Depth 0 is the sizer's own shape, scored once a vector (its scale means nothing) when the flag is on.
    const depths: readonly number[] = only ? [only.depth] : sizerShape ? [0, ...DEPTHS] : DEPTHS;
    for (const depth of depths) {
      for (const scale of only ? [only.scale] : depth === 0 ? [1] : LADDER_GROWTHS) {
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
    ? toMarch(chosen.finaleRungs, leftoversOf(chosen, stock), chosen.finale)
    : undefined;
  // The frontier the UI shows: only the plans nothing else beats on every resource at once, thinned to a
  // readable number. This is also where the recommendation comes from when no silver budget was given.
  const summarise = (candidate: Candidate): PlanTotals & { label: string } => {
    const m = toMarch(candidate.rungs, candidate.mercs, candidate.march);
    const silver = candidate.marches * m.silver + (candidate.finale?.silver ?? 0);
    const mercLost = candidate.marches * m.mercLost + (candidate.finale?.mercLost ?? 0);
    /**
     * The plan's shape in the engine's own terms: how deep the march is (its troop stacks), how many hired
     * units ride it, and what one march of it costs. It replaced `N× 7 rungs + finale`, which named the
     * *engine's* repeat count and the rung count — at a fixed march target every row began with the same
     * `9×`, so ten of sixteen rows wore one name and a slider could not tell its own stops apart.
     *
     * **Not what the bar shows since S-59.** The four rows are named by what they answer (`PlanPick`) and this
     * sentence is read by the experiments; it is kept, and kept identical, because a dozen recorded reports
     * (`tools/theorycraft/63`…`86`) quote it as a row's identity. Presentation only: no number in the payload
     * moves — the march count is `PlanTotals.marches` and the finale is `finaleCounts`.
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
      repeat: { damage: m.damage, silver: m.silver, gold: m.gold, mercLost: m.mercLost },
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
   * What the bar is allowed to **offer**. The owner, on the first bar: *"well just don't show the extremes, if
   * we use a certain % of mercs or waay too much silver we're too far off from our goal of everything
   * optimized."* It no longer cuts a list — the stops below are the picks (`stops`) — it decides which of the
   * two ratio **extremes** is offered at all: the kindest-to-the-stock end is refused when it is the silver
   * sink the owner says he would never choose. A plan is near the goal when its march is not a token field and
   * not a silver sink:
   *
   *   **mercenaries** — it fields at least **half the hired troops the plan's own march fields** (the goal's
   *   mercenary share is the yardstick, so a horizon that legitimately fields few mercenaries is not punished
   *   for it); **silver** — it returns at least **half the plan's own damage a silver**; and **the march**
   *   itself must be more than a single troop stack (experiment 72's criterion, and the owner's own "the
   *   least silver plan would never be chosen … is not a strategy" — the plan a one-stack march describes is
   *   exactly the cheapest row the frontier used to carry).
   *
   * Every threshold is measured against `chosen`, never a free-standing number, so the plan itself is always
   * inside the band. Measured on the account
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
  const inBand = (row: PlanTotals): boolean =>
    hiredOf(row.counts) * 2 >= goal.hired &&
    row.damagePerSilver * 2 >= goal.perSilver &&
    Object.keys(row.counts).filter((id) => !mercIds.has(id)).length > 1 &&
    // S-58 B (`refuseDroppedTypes`): a plan the player is offered fields a little of everything they hold.
    // The band can empty out if the *winner* drops a type; the fallback below draws the four answers from the
    // unbanded frontier rather than handing back an empty bar, which is the graceful degradation the other
    // three refusals have.
    (!refuseDroppedTypes || stocked.every((entry) => (row.counts[entry.id] ?? 0) > 0));

  /**
   * **The plans the four answers are drawn from.** The band is the owner's instruction of 2026-09-15 —
   * *"well just don't show the extremes, if we use a certain % of mercs or waay too much silver we're too far
   * off from our goal of everything optimized"* — and every threshold is measured against the plan itself,
   * never a free-standing number, so the plan is always inside it. A plan is near the goal when its march is
   * not a token field and not a silver sink:
   *
   *   **mercenaries** — it fields at least **half the hired troops the plan's own march fields** (the goal's
   *   mercenary share is the yardstick, so a horizon that legitimately fields few mercenaries is not punished
   *   for it); **silver** — it returns at least **half the plan's own damage a silver**; and **the march**
   *   itself must be more than a single troop stack (experiment 72's criterion, and the owner's own "the
   *   least silver plan would never be chosen … is not a strategy").
   *
   * Measured on the account (`tools/theorycraft/out/74-row-figures.md` §2b): at a target of 10 the band keeps
   * 31 of 46 frontier rows, at 20 it keeps 15 of 31, and the plan and the sweet spot pass at both.
   *
   * **Until S-59 the band was only ever applied to one of the six rules** the bar drew from, so two of the
   * four stops on the owner's own account were plans this refuses — the leftmost being the single-troop-stack
   * march the criterion above exists to exclude (`docs/investigations/0020-the-plan-screen.md` §1). It is
   * applied to the set the answers are drawn from now, which is what the instruction always meant.
   */
  const band = undominated.filter(inBand);
  /**
   * The plans a name may be given to, and the set the recommendation is read off: the band, plus the plan the
   * search settled on when the band refuses it (a winner that drops a hired type is still an answer the player
   * is shown).
   *
   * The set has to be one set, or a name could be false on its own row: measured before S-59, the sweet spot
   * stood outside the band (it fields no monster the plan does) *and* had the best damage a silver of
   * everything on the bar, so the runner-up took the `best-for-silver` slot and the table showed a row named
   * "Best for silver" whose ratio was lower than the row above it (`tools/theorycraft/out/86`). Every named row
   * now competes against every plan the bar can carry — and the sweet spot is *chosen from* this set rather
   * than added to it, so it is inside by construction.
   */
  const candidates =
    band.length === 0
      ? undominated
      : band.some((row) => JSON.stringify(row.counts) === JSON.stringify(chosenPoint.counts))
        ? band
        : [...band, chosenPoint];

  /**
   * **The sweet spot: the middle of the trade in hired stock** (owner, 2026-09-16).
   *
   * The rule was *the plan closest to the best on both ratios at once* (max of `min(perSilver/peakSilver,
   * perMerc/peakMercenary)`), and the owner found it wrong by looking at the bar: *"the sweet spot seems to be
   * too similar with silver save, especially for merc spends."* Measured, he was right, and not marginally:
   * on his account it burned **21** hired units a march where the two named ends burned **12** and **22** — a
   * plan one unit from the dearest thing on the bar, saving no stock at all, that *was* the best damage a
   * silver as well.
   *
   * The definition was doing exactly what it says. A max-of-minimums rewards a plan that is **excellent on one
   * axis and strong on the other**, and the axis it can afford to be excellent on is the one whose peak is
   * hardest to reach — so the metric walks to the silver end. Two other principled re-aims were measured
   * against it over the same trade (`tools/theorycraft/out/90-the-sweet-spot.md`) and neither moves: the
   * *crossing* of the two relative efficiencies lands at 20 burned, and re-anchoring the peaks on the offered
   * plans changes nothing at all. On this army the ratios genuinely cross up there, because each further hired
   * unit burned buys **more** damage than the one before it (214 k a unit between 12 and 17 burned, 318 k
   * between 17 and 22) — the stock is worth spending, and no efficiency rule will decline to spend it.
   *
   * So the recommendation is stated in the resource that does not come back, where the owner asked for it: the
   * **middle of the trade's own stock range** — the best march whose burn is closest to the middle of the
   * range between the thriftiest and the dearest plan the bar can offer, the thriftier side winning a tie.
   * Measured on his account: **17 burned for 5 333 606 damage a march**, against the old rule's 21 for
   * 6 826 445 — 19 % less of the stock for 22 % less damage. No free parameter: both ends of the range are
   * plans the engine found, and the middle is a consequence.
   */
  const barAxis = input.barAxis ?? 'silver';
  /**
   * **The burn ladder** (the burn axis, `barAxis: 'burn'`): one plan a level of hired units burned a march —
   * the best march at that burn, the cheaper on a tie — kept only where **burning more buys more**. Measured
   * (`tools/theorycraft/out/92-the-bar-as-drawn.md`, horizon 3): the band's best march at 20 burned hits for
   * 4 938 868 and its best at 17 for 5 314 021, so a bar that offered the 20 would be offering three more units
   * of the stock for less damage; the level is dropped, and so is every level above the most damage. The
   * ladder is what the sweet spot is read off on this axis, so the recommendation can never be a plan a
   * thriftier stop beats.
   */
  const ladder = new Map<number, PlanTotals & { label: string }>();
  for (const row of candidates) {
    const held = ladder.get(row.repeat.mercLost);
    if (
      !held ||
      row.repeat.damage > held.repeat.damage ||
      (row.repeat.damage === held.repeat.damage && row.repeat.silver < held.repeat.silver)
    ) {
      ladder.set(row.repeat.mercLost, row);
    }
  }
  const levels: number[] = [];
  let climbed = -Infinity;
  for (const burn of [...ladder.keys()].sort((a, b) => a - b)) {
    const damage = ladder.get(burn)?.repeat.damage ?? 0;
    if (damage > climbed) {
      levels.push(burn);
      climbed = damage;
    }
  }
  const ladderRows = levels.map((burn) => ladder.get(burn) as PlanTotals & { label: string });
  /**
   * **A rung nothing beats on both efficiencies** (owner, 2026-09-17, reading his own bar: *"12 hired lost got
   * better silver/dmg, better dmg/merc and almost the same damage"* than the sweet spot at 15). His stops, as
   * the app drew them: 10 burned at 1.280 a silver / 568 182 a hired, **12 at 1.320 / 511 100**, the sweet spot
   * at 15 at 1.263 / 442 961, 19 at 1.409 / 399 460 — the recommendation lost to the stop beside it on both of
   * the two things the slider balances. A plan another rung beats on damage a silver *and* damage a hired unit
   * is not a compromise between them, so it is neither the sweet spot nor a filler; the two ends keep their
   * places by definition. On his numbers this leaves 10, 12 and 19, and the middle of that range is 12.
   */
  const rungPerSilver = (row: PlanTotals): number =>
    row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
  const rungPerHired = (row: PlanTotals): number =>
    row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : 0;
  const efficientRows = ladderRows.filter(
    (row) =>
      !ladderRows.some(
        (other) =>
          other !== row &&
          rungPerSilver(other) >= rungPerSilver(row) &&
          rungPerHired(other) >= rungPerHired(row) &&
          (rungPerSilver(other) > rungPerSilver(row) || rungPerHired(other) > rungPerHired(row)),
      ),
  );
  /** The plans the sweet spot is read off: the efficient rungs on the burn axis, the whole band on the silver one. */
  const sweetPool = barAxis === 'burn' && efficientRows.length > 0 ? efficientRows : candidates;

  const burns = sweetPool.map((row) => row.repeat.mercLost);
  const middleBurn = (Math.min(...burns) + Math.max(...burns)) / 2;
  const sweetSpotBase: PlanTotals & { label: string } = sweetPool.reduce<PlanTotals & { label: string }>(
    (best, row) => {
      // Closest to the middle of the range; **the thriftier side wins a tie**, because the whole point of the
      // rule is the stock — a band narrow enough to sit either side of its own middle (measured on a small
      // account: burns 19, 19, 20) is exactly the case where the choice would otherwise fall to the dearest
      // plan on the bar, which is the defect this rule replaced. Among plans that burn the same, the one that
      // does the most with it.
      const away = Math.abs(row.repeat.mercLost - middleBurn);
      const bestAway = Math.abs(best.repeat.mercLost - middleBurn);
      if (away < bestAway) return row;
      if (away > bestAway) return best;
      if (row.repeat.mercLost !== best.repeat.mercLost) {
        return row.repeat.mercLost < best.repeat.mercLost ? row : best;
      }
      return row.repeat.damage > best.repeat.damage ? row : best;
    },
    sweetPool[0] ?? chosenPoint,
  );

  /**
   * The recommendation when no silver budget is given: the **knee** of the damage-against-silver curve — the
   * plan where one more piece of silver stops buying damage as fast as it did before. It is carried for the
   * curve's own shape; the recommendation the bar opens on is the middle of the trade in hired stock.
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

  /** The row of `offered` that maximises one figure — the band's answer to each of the three open questions. */
  const bestOf = (pick: (row: PlanTotals) => number): (PlanTotals & { label: string }) | undefined =>
    candidates.reduce<(PlanTotals & { label: string }) | undefined>(
      (best, row) => (best === undefined || pick(row) > pick(best) ? row : best),
      undefined,
    );

  /**
   * **The four answers the bar carries** (owner, 2026-09-15: *"find a few 4-5 common, good picks to have a
   * slider control how much silver vs merc we want to spend, which was the whole point… the algorithm should
   * still try to figure out where are the best 3-5 best spots and place us in the sweet spot by default"*, and
   * 2026-09-16 on naming them: *"find better names for it"*).
   *
   * Each is a **definition over the plans inside the band**, stated on the figures the row itself carries —
   * the repeated march's own `repeat`, which is what the table prints and what the recap above it is drawing —
   * rather than the name of a rule that happened to fire. That is what makes a name true of the row under it,
   * whatever the account and whatever the horizon:
   *
   *  - the **sweet spot** — the plan the engine weighed both resources to choose, and where the bar opens. It
   *    is offered whether or not the band would keep it, because it is the recommendation;
   *  - the **most damage** a march of it does;
   *  - the **best damage a silver** a march of it does;
   *  - the **best damage a hired unit** a march of it does.
   *
   * **A name that is already taken is not handed down.** Measured before this rule (`tools/theorycraft/out/86`
   * §"the app's horizon"): the sweet spot was *also* the best damage a silver, the runner-up took the slot, and
   * the bar showed a row named "Best for silver" whose ratio was lower than the row above it — a name that was
   * false on its face. A row that several definitions fit wears the first of them, and the others are simply
   * not offered rather than passed to the next-best plan.
   *
   * Counts decide whether two picks are one plan: two plans can cost the same and field differently, and a bar
   * must not offer the same march twice. Sorted cheapest first, because the bar is read left to right as
   * "spend less … spend more".
   */
  const perSilver = (row: PlanTotals): number =>
    row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : -1;
  const perHired = (row: PlanTotals): number =>
    row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : -1;
  const sameCounts = (a: PlanTotals, b: PlanTotals): boolean =>
    JSON.stringify(a.counts) === JSON.stringify(b.counts);
  const stops: PlanRow[] = [];
  const offer = (row: (PlanTotals & { label: string }) | undefined, pick: PlanPick): void => {
    if (row === undefined) return;
    if (stops.some((other) => sameCounts(other, row))) return;
    stops.push({ ...row, pick, bestFor: { silver: false, hired: false } });
  };
  if (barAxis === 'burn') {
    /**
     * **The burn axis.** The stops are rungs of the ladder above: the thriftiest level the band keeps, the
     * sweet spot (the middle of the ladder's range), the top (the most damage, by the ladder's own
     * construction), and the remaining places to the widest gaps between the stops already there, the upper
     * gap on a tie. Two plans that burn the same can never be two stops.
     */
    const top = ladderRows[ladderRows.length - 1];
    const perUnit = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.mercLost);
    // Fillers are drawn from the efficient rungs only (see `efficientRows`): a stop another stop beats on both
    // ratios is the frustration the owner described, whatever its place on the bar.
    const fillerLevels = efficientRows.map((row) => row.repeat.mercLost);
    const nearest = (target: number): (PlanTotals & { label: string }) | undefined => {
      let pickLevel: number | undefined;
      for (const level of fillerLevels) {
        if (pickLevel === undefined) {
          pickLevel = level;
          continue;
        }
        const away = Math.abs(level - target);
        const held = Math.abs(pickLevel - target);
        const better =
          away < held ||
          (away === held &&
            perUnit(ladder.get(level) as PlanTotals) > perUnit(ladder.get(pickLevel) as PlanTotals));
        if (better) pickLevel = level;
      }
      return pickLevel === undefined ? undefined : ladder.get(pickLevel);
    };
    offer(sweetSpotBase, 'sweet-spot');
    offer(top, 'most-damage');
    offer(levels[0] === undefined ? undefined : ladder.get(levels[0]), 'spare-the-stock');
    /**
     * The fillers: the widest gap between the stops already there gets a `step` at the rung nearest its
     * middle — **if that rung stands nearer the gap's middle than either of its ends**, so a filler is never a
     * neighbour's twin. Measured (`out/92`, horizon 3): the gap 19→25 had its nearest rung at 24, one unit and
     * 1.1 % of damage from the most damage — a stop that says nothing its neighbour does not. Not a tolerance
     * to set: a rung in the inner half of a gap is a stop, a rung in the outer quarters is not. A gap that
     * cannot be filled is left, and the next-widest is tried.
     */
    while (stops.length < keep) {
      const burnsHeld = [...new Set(stops.map((row) => row.repeat.mercLost))].sort((a, b) => a - b);
      const gaps: { low: number; high: number }[] = [];
      for (let i = 1; i < burnsHeld.length; i += 1) {
        gaps.push({ low: burnsHeld[i - 1] ?? 0, high: burnsHeld[i] ?? 0 });
      }
      // Widest first; two gaps as wide as each other, the upper one first (where the damage is).
      gaps.sort((a, b) => b.high - b.low - (a.high - a.low) || b.low - a.low);
      let placed = false;
      for (const gap of gaps) {
        const middle = (gap.low + gap.high) / 2;
        const filler = nearest(middle);
        if (
          !filler ||
          Math.abs(filler.repeat.mercLost - middle) * 4 >= gap.high - gap.low ||
          stops.some((row) => sameCounts(row, filler))
        ) {
          continue;
        }
        offer(filler, 'step');
        placed = true;
        break;
      }
      if (!placed) break;
    }
    stops.sort(
      (a, b) =>
        a.repeat.mercLost - b.repeat.mercLost ||
        a.repeat.silver - b.repeat.silver ||
        a.repeat.damage - b.repeat.damage,
    );
  } else {
    for (const { row, pick } of [
      { row: sweetSpotBase, pick: 'sweet-spot' as const },
      { row: bestOf((row) => row.repeat.damage), pick: 'most-damage' as const },
      { row: bestOf(perSilver), pick: 'best-for-silver' as const },
      { row: bestOf(perHired), pick: 'spare-the-stock' as const },
    ] satisfies { row: (PlanTotals & { label: string }) | undefined; pick: PlanPick }[]) {
      offer(row, pick);
    }
    stops.sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
  }
  /**
   * The candidate fix to the silver axis: two stops that burn the same and are within `mergeNearStops` of
   * each other on both damage and silver a march are one stop, and the one named first keeps the place. It is
   * applied on either axis, though the burn axis has nothing for it to do (one plan a burn level).
   */
  const mergeNear = input.mergeNearStops ?? 0;
  if (mergeNear > 0) {
    const within = (a: number, b: number): boolean =>
      Math.abs(a - b) <= mergeNear * Math.max(Math.abs(a), Math.abs(b));
    const order: PlanPick[] = ['sweet-spot', 'most-damage', 'best-for-silver', 'spare-the-stock', 'step'];
    const ranked = [...stops].sort((a, b) => order.indexOf(a.pick) - order.indexOf(b.pick));
    const kept: PlanRow[] = [];
    for (const row of ranked) {
      const near = kept.some(
        (other) =>
          other.repeat.mercLost === row.repeat.mercLost &&
          within(other.repeat.damage, row.repeat.damage) &&
          within(other.repeat.silver, row.repeat.silver),
      );
      if (!near) kept.push(row);
    }
    stops.splice(0, stops.length, ...stops.filter((row) => kept.includes(row)));
  }
  /**
   * How many of the frontier's plans the bar does **not** carry. The number and the list have to agree — the
   * UI prints this beside the table it describes — so it is counted off the list that is actually handed
   * back, and reads `0` when the band kept nothing (nothing was refused by a band that never applied).
   */
  // The two efficiencies, said on the stops that have them (`PlanRow.bestFor`): the best damage a silver
  // and the best damage a hired unit **of the stops the bar carries** — one stop each, the first on a tie.
  const bestStop = (of: (row: PlanTotals) => number): PlanRow | undefined =>
    stops.reduce<PlanRow | undefined>(
      (best, row) => (best === undefined || of(row) > of(best) ? row : best),
      undefined,
    );
  const silverBest = bestStop(perSilver);
  const hiredBest = bestStop(perHired);
  for (const row of stops) {
    row.bestFor = { silver: row === silverBest, hired: row === hiredBest };
  }
  const leftOut = band.length > 0 ? Math.max(0, undominated.length - stops.length) : 0;
  const alternatives: PlanRow[] = stops.slice(0, keep);
  /**
   * The plan the engine recommends, as the bar's own row: the same figures the list carries when the cap
   * above did not cut it off, and a copy of them when it did.
   */
  const sweetSpot: PlanRow = stops.find((row) => row.pick === 'sweet-spot') ?? {
    ...sweetSpotBase,
    pick: 'sweet-spot',
    bestFor: { silver: false, hired: false },
  };

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
    barAxis,
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
    // The set the four answers came from, when a caller is asking about the trade's *shape* rather than about
    // the answers on it (S-59 follow-up: "the sweet spot seems to be too similar with silver save"). Sorted
    // cheapest first like everything else the UI reads, and built here so the order is the engine's rather
    // than a caller's re-derivation of it.
    ...(input.withTrade === true
      ? { trade: [...candidates].sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage) }
      : {}),
    // With no budget the recommendation is the sweet spot — the middle of the trade in hired stock, see
    // `sweetSpotBase` above. With a budget the plan *is* the answer and nothing is recommended beside it. The
    // knee and the two peaks are carried for the curve's shape, not for the bar.
    ...(input.silverBudget === undefined
      ? {
          recommend: sweetSpot,
          knee: knee ?? chosenPoint,
          mostEfficient: light ? summarise(light) : chosenPoint,
          mostThrifty: heavy ? summarise(heavy) : chosenPoint,
        }
      : {}),
  };
}

/** The mercenaries a plan leaves for its final march: the stock less one chunk a repeat. */
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
