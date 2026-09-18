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
import type { BattleSummary, Stack, StackRequest, StackResult } from './types';

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

/**
 * **What a put-back is worth**, in the owner's own exchange rates — the policy the pass below is steered by
 * (`src/config.ts`, `CAMPAIGN.putBack`, where the three numbers and their calibration live).
 *
 * The engine holds no opinion about them: they are the player's trade between damage, silver and the training
 * queue, and a caller that does not pass them gets the marches the search generated, untouched.
 */
export interface PutBackPolicy {
  /** Percent of silver saved that is worth one percent of damage. */
  silverPerDamage: number;
  /** Percent of recovery time saved that is worth one percent of damage. */
  timePerDamage: number;
  /** The most damage, in percent, a put-back may cost — however much it saves. */
  damageLossCap: number;
}

export interface CampaignInput {
  /** The app's usual one-march request: units, caps (the mercenary stock), housing, bonuses, enemy, recovery. */
  request: StackRequest;
  /** Silver the campaign may spend. Omitted: the plan spends what the stock and the leadership allow. */
  silverBudget?: number;
  /**
   * How many marches the campaign plays **at most** — the horizon, a ceiling and not a requirement (see
   * `repeatsFor` in `planCampaign`). The last march is the finale, so the repeated march is fielded at most
   * `marchTarget − 1` times; a stock too small to carry the horizon is repeated as often as it lasts and the
   * campaign is simply shorter. The plan's own `marches` reads back what it played, never the target.
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
   * **Put a left-out troop type back** (owner, 2026-09-18: *"generation sometimes skips low-level stacks and
   * misses some damage that seems cheap … add a pass to consider again lower level troops if the cost for them
   * (silver, silver/damage, total damage) is not too high and we get a nice reduction in training time"*).
   *
   * Set, every stop the bar offers is re-sized once more over **its own troop types plus one the account holds
   * and the march leaves out**, one left-out type at a time, and the best of those replaces the march when the
   * player's own exchange rates say it is worth it (`putBackOn` in `planCampaign`; the rates are
   * `CAMPAIGN.putBack`). Omitted, the stops are the marches the search generated, as they were.
   */
  putBack?: PutBackPolicy | undefined;
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
   * Ask for the **frontier itself** — every plan the search summarised, whether the band kept it or not — as
   * `CampaignPlan.frontier`.
   *
   * A **diagnostic for experiments, never read by the UI** (the app's own request does not carry it, see
   * `buildPlanRequest`): `withTrade` hands back the plans the stops were chosen *from*, which is already the
   * band's filtered view, so a question about what the band and the stop rules *left behind* — the rows the
   * bar never offered and why — cannot be answered from outside the engine at all. Each row carries the two
   * verdicts (`undominated`, `inBand`), the stop it became if it became one, and the stop it was the
   * **generator** of — the march a put-back re-sized, which is the same stop one pass earlier and not a plan
   * the bar left behind — so an experiment can ask of any silver level which plan stands there and which rule
   * passed it over (`tools/theorycraft/104-union-slider.test.ts`).
   *
   * The rows are the frontier's own summaries **plus the best-damage shape recorded at each silver bucket** —
   * the plans the `curve` is written from, which the frontier itself does not carry: `record` books every
   * shape the search scores while `consider` keeps only the strongest of each mercenary vector, so a row of
   * the reference table under the bar usually has no plan on the frontier behind it. `onFrontier` tells the
   * two apart. Sorted by silver; the `all-in` stop is built march by march outside both and is not among them.
   */
  withFrontier?: boolean;
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
  /**
   * How long the march's losses take to come back into the army, in seconds — the third price a march is
   * paid for, beside silver and gold, and the one the owner went looking for on 2026-09-18: *"generation
   * sometimes skips low-level stacks and misses some damage that seems cheap; it is mainly because one
   * thing is not taken into account: troops of higher tier are longer to train."* A Spearman I is back in
   * fifteen seconds and a Rider III takes fourteen minutes, so two marches of the same silver are not the
   * same march at all.
   *
   * Priced the way this file prices everything else (`toMarch`): the **troops are retrained** — every unit
   * lost, at `training.seconds` divided by the account's training speed — and the **hired units are
   * revived**, which the game charges in gold and no time at all (a mercenary has no `training` block).
   * So this figure is the troop side's alone, and it is what `recoveryCosts` reports for the same counts
   * under the retrain plan (`src/engine/recovery.ts`).
   */
  seconds: number;
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
  /** What one march of it takes to recover, in seconds — `PlanMarch.seconds`, for the march the stop repeats. */
  seconds: number;
  mercLost: number;
}

export interface PlanTotals {
  /** Counts of the repeated march, so the UI can draw any point of the frontier, not just the winner. */
  counts: Record<string, number>;
  /** Counts of the final march, when the plan has one. */
  finaleCounts?: Record<string, number> | undefined;
  /**
   * Every march of the campaign, first to last, when they **differ** — the `all-in` stop, which fields every
   * mercenary the troops can shelter, marches on what is left, and plays the rest of the horizon on troops
   * alone once the stock is spent. Absent for a plan that repeats one march and plays a finale; then `counts`
   * × the repeats plus `finaleCounts` is the campaign. `repeat` is the first march's figures either way, and
   * the totals are the whole sequence's. It is always as long as the horizon.
   */
  sequence?: Record<string, number>[] | undefined;
  /**
   * What **one** of the plan's identical marches is, on its own, without the final march spread over it —
   * the same march the March section draws, priced by the plan's own arithmetic. `totalDamage` and `silver`
   * above include the finale, which is why a row showing `totalDamage / marches` disagrees with the March
   * it points at; `repeat` is the figure that agrees, to the unit, with the battle's own report for that
   * march (`marchResult` → `simulateBattle`). Measured: `tools/theorycraft/out/74-row-figures.md` §1.
   */
  repeat: PlanRepeat;
  /**
   * Which shape the search sized the repeated march with: a `ladder` (the strongest `depth` troop types,
   * one rung each, scaled) or the sizer's own march under one of its methods (`SizerMethod`). Presentation
   * and record only — the counts are the plan.
   */
  shape: 'ladder' | SizerMethod | 'winner';
  totalDamage: number;
  silver: number;
  gold: number;
  /**
   * The whole campaign's recovery time, in seconds: the repeated march's own time taken as many times as it
   * is fought, plus the finale's — or, for a plan whose marches differ (`sequence`), the sum over them. The
   * figure a single march is read by is `repeat.seconds`, exactly as silver is.
   */
  seconds: number;
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
/**
 * The five stops of the bar (owner, 2026-09-18: *"least silver, sweet spot, more mercs, most mercs"*, then
 * *"a last stop: all mercs possible … fill all the mercs you can safely"* and *"a cost-saving silver march using
 * some mercs but just enough troops to shield them"*), along the hired units **burned** a march — what the
 * stock actually pays, `ceil(n/10)` over the hired stacks fielded. Each is a definition over the plans the
 * band keeps (`tools/theorycraft/out/99`):
 *
 *  - `silver-saver` — the cheapest march left of the sweet spot that costs no more silver and is at least as
 *    efficient a silver: on every account measured it is the tight ladder, every troop rung just above the
 *    mercenaries, some of the stock riding with it;
 *  - `sweet-spot` — the knee of damage against burn over the rungs nothing beats on both ratios;
 *  - `more-mercs` — the rung nearest the middle of the gap between the sweet spot and the steady max;
 *  - `steady-max` — the top of the ladder: the most mercenaries the troops shelter **every march of the
 *    horizon**, and the most damage a repeated march does;
 *  - `all-in` — every mercenary the troops can shelter on the first march, then each next march on what the
 *    stock has left, then troops alone for the rest of the horizon (`PlanTotals.sequence`): the campaign that
 *    spends the stock fastest, played to the end. It is offered when its first march **fields** more hired
 *    units than the steady max's repeat, which is the one reading on this bar that is a count rather than a
 *    cost: a stock smaller than a chunk burns the same whatever it fields, so 10 · 9 · 8 · 7 tied the steady
 *    max and was dropped as a duplicate of it, on the very armies where TotalStack's priority search answers
 *    26 486 216 over four marches (ten bears) and 25 439 016 (three) against this plan's 21 732 276 and
 *    19 115 768.
 */
export type PlanPick = 'silver-saver' | 'sweet-spot' | 'more-mercs' | 'steady-max' | 'all-in';

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
  /**
   * **The troop type the put-back pass added to this march**, and what adding it changed — absent on a stop
   * the pass left alone, and on every stop when the caller set no policy (`CampaignInput.putBack`).
   *
   * The three figures are **percent changes against the march the search generated**, in the sign the player
   * reads them by: `damage` positive is more damage, `silver` and `seconds` positive are a *saving*. So the
   * owner's own example reads "+2.7 % damage, 18.2 % of the silver and 38.3 % of the queue saved" from
   * `{ damage: 2.7, silver: 18.2, seconds: 38.3 }`, and a put-back taken on a small loss carries a negative
   * `damage`. The UI writes the sentence (`src/ui/sections/march/PlanTrade.tsx`); this is the record of what
   * was done, so a row can say it and an experiment can check it.
   */
  putBack?: { unitId: string; damage: number; silver: number; seconds: number } | undefined;
}

/**
 * A plan as the **search** carries it, before it is a row of the bar: the figures, the shape sentence the
 * record reads a plan by (`PlanRow.label`), and the put-back the pass took on it if it took one. The picks are
 * chosen over these, so every rule that compares plans — the knee, the band's ratios, the ladder — compares
 * the marches the player will actually be offered.
 */
type TradeRow = PlanTotals & { label: string; putBack?: PlanRow['putBack'] };

/**
 * One row of the frontier as a **diagnostic** (`CampaignInput.withFrontier`): the plan the search summarised,
 * plus the verdicts passed on it — whether the frontier carried it at all, whether nothing else beat it on
 * all three resources, whether the band kept it, and which stop of the bar it became. Not a payload a screen
 * reads.
 */
export type PlanFrontierRow = PlanTotals & {
  label: string;
  /**
   * The frontier carries **this candidate**, by object identity: the row was summarised from a `Candidate`
   * the search pushed onto `frontier` (`consider`). False for a row that only the **curve** carries — the
   * best shape recorded at one silver bucket, which the search scored and then threw away because a stronger
   * shape of the same mercenary vector was the one it kept. It is identity and not counts: a plan the
   * frontier holds and a bucket's best that field the same march are one row here, and it reads `true`.
   */
  onFrontier: boolean;
  /**
   * It is in the engine's own undominated set — which a row the frontier never carried cannot be, so this is
   * always false when `onFrontier` is.
   */
  undominated: boolean;
  /** The band kept it: not a token field, not a silver sink, more than one troop stack (and S-58 B). */
  inBand: boolean;
  /**
   * The stop the bar offers this plan as, when it offers it. Matched on the row's **counts**, sorted, so the
   * key order two records were built in cannot tell one march from itself.
   */
  stop?: PlanPick | undefined;
  /**
   * The stop this plan was the **generator** of: the march the put-back pass re-sized into a stop
   * (`generatedOf`). Such a row is on the bar — it is that stop one pass earlier — and counting it as a plan
   * the bar left behind reads a pass over the same march as a missed offer.
   */
  generatorOf?: PlanPick | undefined;
};

export interface CampaignPlan extends PlanTotals {
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
   * **Every plan the search summarised**, and the plan behind each bucket of the `curve`, sorted by silver —
   * each carrying whether the frontier held it (`onFrontier`), whether it is undominated, whether the band
   * kept it and which stop it became. Present only when the caller asked for it
   * (`CampaignInput.withFrontier`) — a diagnostic for experiments, not something the UI draws.
   */
  frontier?: PlanFrontierRow[] | undefined;
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

/**
 * Rungs of `depth` types whose lowest sits `gap` above `mercenaryHp`, each 2 % above the one below.
 *
 * `order` is which type takes which rung, biggest rung first. Left out, it is the ranking's own: the
 * strongest `depth` types, the weakest per HP on the top rung (the biggest stack, the first the enemy wipes)
 * and the strongest on the lowest. That rule was measured wrong on the owner's export of 2026-09-18
 * (`tools/theorycraft/out/98-rung-order.md`): with the sweet spot's own mercenaries and rung sizes, the best
 * of all 5 040 assignments hit for 5 426 465 against the rule's 5 143 988 — 5.5 % for the same silver — and a
 * swap climb reaches that best in 84 battles. `makeScorer` learns the order once a depth by that climb.
 */
function ladder(
  troops: Effective[],
  depth: number,
  mercenaryHp: number,
  gap: number,
  leadership: number,
  scale = 1,
  order?: Effective[],
): { entry: Effective; count: number }[] {
  const chosen = order ?? troops.slice(-depth);
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
    | ((
        mercs: { entry: Effective; count: number }[],
        method: SizerMethod,
      ) => { rungs: { entry: Effective; count: number }[]; mercs: { entry: Effective; count: number }[] })
    | undefined;
  /** The troop stacks scored at `WINNER_RUNGS_DEPTH`: the search's winner, once there is one. */
  winnerRungs?: (() => { entry: Effective; count: number }[]) | undefined;
  /**
   * How many marches each type's stock sustains: the stock itself, or `Infinity` for a mercenary hired as
   * **unlimited** (no cap entered), whose count `stock` bounds by the authority pool and whose stock never
   * runs out. Defaults to `stock`.
   */
  sustain?: Record<string, number> | undefined;
}

/**
 * The stacking methods the sizer shape is scored with (`CampaignInput.sizerShape`), keyed by the depth that
 * names them in the shape scorer: `0` Elite, `-1` Military Science, `-2` Military Science relaxed. Measured
 * on the owner's export of 2026-09-17 (`tools/theorycraft/out/94-under-the-cap.md` §C): with the sweet spot's
 * own mercenary caps, Military Science over the same eight types hit for 5 770 261 against Elite's 5 736 190
 * while burning fewer hired units — a march the Elite-only sizer shape could not reach.
 */
export type SizerMethod = 'elite' | 'ms' | 'msRelaxed';
export const SIZER_DEPTHS: Record<number, SizerMethod> = { 0: 'elite', [-1]: 'ms', [-2]: 'msRelaxed' };
/**
 * The depth that names one more shape: **the winner's own troop stacks, with the mercenaries of the vector
 * being scored**. The ladder sizes its rungs off the biggest hired stack, so fewer mercenaries shrink the
 * troops with them and the march loses twice; the winner's rungs kept whole and only the hired count lowered
 * is the march a player would actually field. Measured on the owner's live account (one hired type, 83 in
 * stock, 20 000 leadership): the search's best 60-hunter march hit for 7 170 113 at 8 229 200 silver and fell
 * off the frontier, the winner's rungs with 60 hunters hit for 7 453 778 at the winner's own 7 756 500.
 */
export const WINNER_RUNGS_DEPTH = -3;

export interface ScoredShape {
  marches: number;
  /** The mercenaries the shape actually fields — the sizer's own when the shape is the sizer's. */
  mercs: { entry: Effective; count: number }[];
  /** The counts of the repeated march, as the app carries them. */
  counts: Record<string, number>;
  rungs: { entry: Effective; count: number }[];
  march: ReturnType<typeof marchOf>;
  /** The final march: what the stock the repeats burned still allows. */
  finale: {
    rungs: { entry: Effective; count: number }[];
    /** The mercenaries the final march fields: the leftovers under a ladder, the sizer's own under the sizer. */
    mercs: { entry: Effective; count: number }[];
    march: ReturnType<typeof marchOf>;
  } | null;
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
  const sustain = context.sustain ?? stock;
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
      spentStock[merc.entry.id] =
        (sustain[merc.entry.id] ?? 0) === Infinity
          ? (stock[merc.entry.id] ?? 0)
          : (stock[merc.entry.id] ?? 0) - marches * chunks(merc.count);
    const leftovers = mercTypes
      .map((entry) => ({ entry, count: Math.max(0, spentStock[entry.id] ?? 0) }))
      .filter((merc) => merc.count > 0);
    if (leftovers.length === 0) return null;
    const leftoverHp = Math.max(...leftovers.map((merc) => merc.count * merc.entry.hp));
    const finaleBudget = silverLeft === undefined ? Infinity : silverLeft;
    let finale: ScoredShape['finale'] = null;
    for (const finaleDepth of DEPTHS) {
      for (const finaleGrowth of LADDER_GROWTHS) {
        const finaleLadder = ladder(
          troops,
          finaleDepth,
          leftoverHp,
          gap,
          leadership,
          finaleGrowth,
          orderFor(finaleDepth, leftoverHp, finaleGrowth, leftovers),
        );
        if (finaleLadder.length === 0) continue;
        const attempt = marchOf([...finaleLadder, ...leftovers], enemyStacks);
        if (attempt.silver > finaleBudget) continue;
        if (!finale || attempt.damage > finale.march.damage) {
          finale = { rungs: finaleLadder, mercs: leftovers, march: attempt };
        }
      }
    }
    // The sizer's own final march under each method, the leftovers as its caps (owner's export of
    // 2026-09-17, `tools/theorycraft/out/96-branches.md` §C: the ladder finale hit for 5 135 846 at
    // 3 893 700 silver burning 24, the sizer under MS relaxed for 6 079 432 at 2 739 400 burning 14).
    if (context.sizer) {
      for (const method of Object.values(SIZER_DEPTHS)) {
        const sized = context.sizer(leftovers, method);
        if (sized.rungs.length === 0 || sized.mercs.length === 0) continue;
        const attempt = marchOf([...sized.rungs, ...sized.mercs], enemyStacks);
        if (attempt.silver > finaleBudget) continue;
        if (!finale || attempt.damage > finale.march.damage) {
          finale = { rungs: sized.rungs, mercs: sized.mercs, march: attempt };
        }
      }
    }
    return finale;
  };

  // One entry is enough: the planner scores all eighty ladders of one shape back to back, and the key can
  // only stay the same within that run.
  let cachedKey = '';
  let cachedFinale: ScoredShape['finale'] = null;

  /**
   * Which type takes which rung, learned once a depth: from the ranking's order, every pairwise swap is
   * tried on the first ladder of that depth the search asks for (its mercenaries, its rung sizes), the best
   * improving swap taken, until none improves. Measured to reach the best of all assignments in 84 battles
   * (`out/98`), and the best order held across leadership caps and mercenary vectors on the same account.
   */
  const rungOrders = new Map<number, Effective[]>();
  const orderFor = (
    depth: number,
    mercenaryHp: number,
    scale: number,
    vector: { entry: Effective; count: number }[],
  ): Effective[] => {
    const held = rungOrders.get(depth);
    if (held) return held;
    let order = troops.slice(-depth);
    const damageOf = (candidate: Effective[]): number => {
      const rungs = ladder(troops, depth, mercenaryHp, gap, leadership, scale, candidate);
      return rungs.length === 0 ? -Infinity : marchOf([...rungs, ...vector], enemyStacks).damage;
    };
    let current = damageOf(order);
    // A ladder the leadership cannot pay for teaches nothing: answer with the ranking's order and learn
    // from the first request that fits. (The first ladders the grid asks for field every mercenary at its
    // cap, and on a real account those are the ones over the cap — measured: learning on them kept the
    // ranking's order for good, `out/98`.)
    if (!Number.isFinite(current)) return order;
    for (;;) {
      let best: { order: Effective[]; damage: number } | undefined;
      for (let i = 0; i < order.length; i += 1) {
        for (let j = i + 1; j < order.length; j += 1) {
          const trial = [...order];
          [trial[i], trial[j]] = [trial[j] as Effective, trial[i] as Effective];
          const damage = damageOf(trial);
          if (damage > current && (!best || damage > best.damage)) best = { order: trial, damage };
        }
      }
      if (!best) break;
      order = best.order;
      current = best.damage;
    }
    rungOrders.set(depth, order);
    return order;
  };

  return (marches, counts, depth, scale, silverBudget) => {
    let vector = mercTypes.map((entry) => ({
      entry,
      count: Math.max(0, Math.floor(counts[entry.id] ?? 0)),
    }));
    let fielded = vector.filter((merc) => merc.count > 0);
    if (fielded.length === 0 || marches < 1) return null;
    // A depth of 0 or less is the sizer's own march under one of its methods (`SIZER_DEPTHS`): the counts
    // are its caps, and what it fields — troops and mercenaries both — is the shape.
    const sizerMethod = SIZER_DEPTHS[depth];
    let sizedRungs: { entry: Effective; count: number }[] = [];
    if (depth === WINNER_RUNGS_DEPTH) {
      sizedRungs = context.winnerRungs?.() ?? [];
      if (sizedRungs.length === 0) return null;
    } else if (sizerMethod !== undefined) {
      if (!context.sizer) return null;
      const sized = context.sizer(fielded, sizerMethod);
      sizedRungs = sized.rungs;
      const byId = new Map(sized.mercs.map((merc) => [merc.entry.id, merc.count]));
      vector = mercTypes.map((entry) => ({ entry, count: Math.max(0, byId.get(entry.id) ?? 0) }));
      fielded = vector.filter((merc) => merc.count > 0);
      if (fielded.length === 0) return null;
    }
    // A shape is only a plan if the stock can field it on every one of those marches. The planner derives
    // `marches` from the counts (`marchesFor`), so this never bites there — but a caller may pass both, and
    // the two must not disagree: fielding a count the stock cannot sustain burns mercenaries it does not have.
    for (const merc of fielded) {
      if (lastsMarches(sustain[merc.entry.id] ?? 0, merc.count) < marches) return null;
    }
    // what the enemy can kill in one march, and the HP the mercenaries need shelter from
    const mercenaryHp = Math.max(...fielded.map((merc) => merc.count * merc.entry.hp));
    const budgetPerMarch = silverBudget === undefined ? undefined : silverBudget / marches;
    const rungs =
      sizerMethod !== undefined || depth === WINNER_RUNGS_DEPTH
        ? sizedRungs
        : ladder(
            troops,
            depth,
            mercenaryHp,
            gap,
            leadership,
            scale,
            orderFor(depth, mercenaryHp, scale, vector),
          );
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
      mercs: vector,
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
  /**
   * **Unlimited mercenaries** (owner, 2026-09-18: *"when a merc is unlimited and is put in, don't put more,
   * and lower it so the health stack still makes sense — below the troops"*). A type hired with no cap has no
   * entry in `caps`; it used to read as a stock of nothing and was never fielded. It is bounded by the
   * authority pool instead — the only limit the game puts on it — its stock never runs out (`sustain`), and
   * every shape keeps its stack under the lowest troop stack: the ladders by construction, the sizer's
   * shapes by the clamp in `sizer` below, the all-in by its own shelter test.
   */
  const unlimited = new Set(
    request.units
      .filter((unit) => unit.pool === 'authority' && request.caps[unit.id] === undefined)
      .map((unit) => unit.id),
  );
  const stock: Record<string, number> = { ...request.caps };
  const sustain: Record<string, number> = { ...request.caps };
  for (const entry of table) {
    if (!unlimited.has(entry.id)) continue;
    stock[entry.id] = Math.max(0, Math.floor(request.housing.authority / Math.max(1, entry.cost)));
    sustain[entry.id] = Infinity;
  }
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
   * The marches the campaign may play. A target caps both the grid's march count and every candidate's, so
   * the grid is built for that one count instead of for all twelve: the maxima are `anchorFor(held, K)`,
   * which is a different number at every K, and a grid built for the wrong K is a grid of counts that are
   * either infeasible (too big to last the run — `score` rejects them) or too small to be the maximum the
   * fractions are meant to sample around. It is a **cap**: a vector the stock cannot repeat that often is
   * repeated as often as it can be (`repeatsFor`), not thrown away.
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
   * **The horizon is a ceiling, not a requirement** (owner, 2026-09-18: *"no more magic static numbers"*).
   *
   * The repeats a vector plays are `min(targetRepeats, marchesFor(sustain, fielded))`: as many identical
   * marches as the hired stock sustains — `lastsMarches`, one chunk of ten lost a march — and never more than
   * the target leaves room for. A plan therefore plays *at most* `marchTarget` marches, and a stock the
   * horizon outruns gives a **shorter campaign rather than nothing**. `PlanTotals.marches` is what was played,
   * repeats and finale, so a plan can answer with fewer marches than it was asked for and never with more.
   *
   * It used to be read the other way round: every candidate was fielded `targetRepeats` times whatever the
   * stock held, so a first-run army holding one or two of a hired type — which holds **no** count that lasts
   * three repeats — had an empty grid, and `planCampaign` threw "no feasible plan for this army" at an account
   * that holds mercenaries and can plainly march with them (`tools/theorycraft/out/101-shelter-cost-and-ten-
   * bears.md` §B, the "1 bears" and "2 bears" rows). A shorter campaign is not a refusal; the refusal is what
   * it says — no hired type in stock at all, or a silver budget nothing fits.
   *
   * The finale still plays on what the repeats leave. When they leave nothing there is no finale and the plan
   * is the repeats alone (`finaleFor` answers `null`): this method is about spreading the hired stock, and a
   * march with none of it left in it is the sizer's job rather than this one's.
   *
   * **A type the horizon outruns shortens the campaign only when every type the account holds is outrun.**
   * When one of them carries the horizon, the short type is not fielded in the **repeated** march at all — no
   * count of it lasts the run, and `score` refuses it as it always did — and it is spent in the **finale**,
   * which fields whatever the repeats left of every type, sheltered like any hired stack. A plan whose finale
   * carries it is therefore not a hole, which is why S-58 B is judged over the campaign (`inBand` below) and
   * not over the repeated march alone.
   *
   * Measured with the alternative (the first reading of this rule, 2026-09-18, since replaced) — the shorter
   * run taken whenever *any* fielded type was outrun — on the
   * owner's export at 7 000 with the chariot cap cut to **2** and his other 234 hired units untouched: the
   * sweet spot and the steady max became two-march campaigns of 9 705 867 and 9 838 204 while the all-in went
   * on playing four for 20 877 865; at a cap of 1 the same, at a cap of 5 (which sustains three a march) the
   * full four. Two chariots halved the campaign of the whole account, because S-58 B asks every stop to field
   * every stocked type and an outrun type then caps the repeats for all of them.
   */
  /**
   * A type the horizon outruns: no count of its whole stock lasts the repeats a target leaves room for. An
   * unlimited type is never outrun — its stock is the authority pool and never drains (`sustain` Infinity),
   * so its anchor is that whole stock at any march count (`anchorOf`).
   */
  const outrun = (id: string): boolean =>
    targetRepeats !== undefined &&
    !unlimited.has(id) &&
    (stock[id] ?? 0) > 0 &&
    largestFor(stock[id] ?? 0, targetRepeats) === 0;
  /** Whether any type the account holds carries the horizon — the one that decides between the two readings. */
  const carriesHorizon =
    targetRepeats !== undefined && mercTypes.some((entry) => (stock[entry.id] ?? 0) > 0 && !outrun(entry.id));
  const repeatsFor = (mercs: { entry: Effective; count: number }[]): number => {
    if (targetRepeats === undefined) return marchesFor(sustain, mercs);
    if (carriesHorizon) return targetRepeats;
    let repeats = targetRepeats;
    for (const merc of mercs) {
      if (merc.count <= 0) continue;
      repeats = Math.min(repeats, lastsMarches(sustain[merc.entry.id] ?? 0, merc.count));
    }
    return Math.max(1, repeats);
  };

  /**
   * The count a type's grid is anchored on, and the fractions below it are taken from: the largest that
   * sustains the run, or — for a type whose stock the **horizon outruns** on an account where nothing else
   * carries it — the whole stock, which is the largest there is to field. A stock of one holds no count that
   * lasts three repeats and a stock of two holds none either, so their `largestFor` is nothing and their
   * column of the grid was empty: that is the whole of "no feasible plan for this army" on a first-run
   * account. Anchored on the stock, a stock of two samples two and one, each repeated as often as it lasts.
   * Where another type does carry the horizon the anchor stays at nothing, and the short type rides the
   * finale instead (`repeatsFor`).
   */
  const anchorFor = (held: number, marches: number): number =>
    largestFor(held, marches) || (carriesHorizon ? 0 : largestFor(held, 1));
  const anchorOf = (id: string, marches: number): number =>
    unlimited.has(id) ? (stock[id] ?? 0) : anchorFor(stock[id] ?? 0, marches);

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
    const maxima = mercTypes.map((entry) => anchorOf(entry.id, marches));
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
    finaleMercs: { entry: Effective; count: number }[];
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
    // The winner stands on more than one troop stack: a single stack sheltering a mountain of hired units is
    // the extreme the band refuses (owner, 2026-09-15: "not a strategy"), and with a mercenary hired as
    // unlimited it is also the march that does the most damage — measured: 820 hunters under one stack of
    // troops — so it would set the band's yardstick and empty the band. A one-stack march may still win
    // when nothing else scores at all.
    const stands = candidate.rungs.length > 1;
    if (
      !best ||
      (stands && best.rungs.length <= 1) ||
      (stands === best.rungs.length > 1 && candidate.total > best.total)
    ) {
      best = candidate;
    }
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
  /** The candidate behind each bucket's `best`, kept only for `CampaignInput.withFrontier`. */
  const bucketBest = new Map<number, Candidate>();
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
    // One `retrainOne` per rung, read twice: the silver it costs and the time it takes. The hired stacks add
    // nothing to the second — the game revives them for gold and a mercenary has no training block at all —
    // which is precisely why a march that leans on them recovers faster than its silver suggests.
    const troopRecovery = rungs.map((rung) => retrainOne(rung.entry.unit, rung.count, request.recovery));
    const silver = troopRecovery.reduce((sum, one) => sum + one.silver, 0);
    const seconds = troopRecovery.reduce((sum, one) => sum + one.seconds, 0);
    return {
      counts,
      damage: Math.round(totals.damage),
      silver: Math.round(silver),
      gold: Math.round(gold),
      // Rounded once, on the sum, the way `recoveryCosts` rounds its own — rounding each rung first would
      // drift by a second a stack against the recap the March draws.
      seconds: Math.round(seconds),
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
  const sizer = (
    mercs: { entry: Effective; count: number }[],
    method: SizerMethod,
  ): { rungs: { entry: Effective; count: number }[]; mercs: { entry: Effective; count: number }[] } => {
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
      options: {
        ...request.options,
        method: method === 'elite' ? 'elite' : 'ms',
        relaxedPreservation: method === 'msRelaxed',
      },
    });
    const stacks = sized.stacks
      .filter((stack) => stack.count > 0)
      .map((stack) => ({ entry: byId.get(stack.unitId), count: stack.count }))
      .filter((rung): rung is { entry: Effective; count: number } => rung.entry !== undefined);
    const rungs = stacks.filter((stack) => stack.entry.pool === 'leadership');
    // The shelter: an **unlimited** hired stack under the lowest troop stack, or the enemy — which wipes the
    // highest-HP living stack first — takes it before the troops have died (owner, 2026-09-18: *"when a merc
    // is unlimited and is put in, don't put more, and lower it so the health stack still makes sense — below
    // the troops"*). A stack the sizer sized over that line is lowered to just under it; one that cannot be is
    // left out of this shape.
    //
    // **Only the unlimited types** (S-77). Clamping every hired type read that sentence — which is about the
    // one case where nothing else bounds a stack — as a rule for all of them, and it costs damage: on the
    // owner's export at 7 000 the unsheltered MS-relaxed march stood **34 legionaries on top** as the enemy's
    // first kill — a sponge, every other stack one kill slot later, the arbalesters striking three times
    // instead of two — for **6 242 452** damage a march against **5 864 482** sheltered, at one more legionary
    // burned and 48 gold (`tools/theorycraft/out/101-shelter-cost-and-ten-bears.md` §A). The battle model
    // prices that already — `marchOf` runs the journal, and the burn is `ceil(n / 10)` wherever the stack
    // stands — so the two ratios judge a hired sponge like any other march, and a capped type keeps the count
    // the sizer gave it wherever it stands. The other shapes are unchanged: the ladders shelter by
    // construction (every rung is built above `mercenaryHp`), and the all-in shelters every type by its own
    // test, because that stop is the one the owner asked for as *"all the mercs you can safely field"*.
    const floor = Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
    const sheltered = stacks
      .filter((stack) => stack.entry.pool === 'authority')
      .map((stack) => {
        if (!unlimited.has(stack.entry.id)) return stack;
        if (!Number.isFinite(floor) || stack.count * stack.entry.hp < floor) return stack;
        return { entry: stack.entry, count: Math.max(0, Math.ceil(floor / stack.entry.hp) - 1) };
      })
      .filter((stack) => stack.count > 0);
    return { rungs, mercs: sheltered };
  };
  let winnerRungs: { entry: Effective; count: number }[] = [];
  const score = makeScorer({
    troops,
    mercTypes,
    stock,
    leadership,
    enemyStacks,
    gap,
    finale: planned !== 1,
    ...(sizerShape ? { sizer } : {}),
    winnerRungs: () => winnerRungs,
    sustain,
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
      if (total > entry.best.damage) {
        entry.best = { damage: total, silver: pointSilver, mercs: pointMercs };
        // The plan behind that bucket, for the diagnostic alone (`CampaignInput.withFrontier`): the curve
        // carries three figures, and "which march is this row" cannot be asked of three figures.
        if (input.withFrontier === true) bucketBest.set(key, candidate);
      }
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
    laddersOnly = false,
  ): Candidate | null => {
    let pick: Candidate | null = null;
    /**
     * The vector's **tight** shape, kept beside its strongest: the ladder at scale 1 — every rung just above
     * the mercenaries, the smallest stacks that still shelter them — over as many troop types as the
     * leadership pays for. Only the strongest shape a vector reached the frontier, so a cheaper march with the
     * same mercenaries was scored and thrown away, and no stop could ever cost less than the winner's troops
     * (owner, 2026-09-18: *"now the plan almost doesn't change in terms of silver"*). Measured on his live
     * account: the sweet spot's troops at 70 % hit for 5 798 781 against 7 453 778, for 5 427 600 silver
     * against 7 756 500 — 1.07 a silver against 0.96 — and the search had never carried it. Not the most
     * silver-efficient shape outright: that is a single small stack, the extreme the band refuses.
     */
    let tight: Candidate | null = null;
    const fielded = vector.filter((merc) => merc.count > 0);
    if (fielded.length === 0) return null;
    const marches = repeatsFor(fielded);
    if (marches < 1) return null;
    const counts: Record<string, number> = {};
    for (const merc of vector) counts[merc.entry.id] = merc.count;
    // A depth of 0 or less is the sizer's own shape under one method (`SIZER_DEPTHS`), scored once a vector
    // (its scale means nothing) when the flag is on.
    const depths: readonly number[] = only
      ? [only.depth]
      : sizerShape && !laddersOnly
        ? [...Object.keys(SIZER_DEPTHS).map(Number), ...DEPTHS]
        : DEPTHS;
    /**
     * A sizer shape may field fewer mercenaries than the vector it was given (Military Science does), and
     * that smaller vector is one the grid never holds — so the ladders were never scored on it. Measured on
     * the owner's export of 2026-09-18 (`tools/theorycraft/out/97-shelter-margin.md` §C): with the sweet
     * spot's own mercenaries the tight ladder hit for 5 343 795 against the sizer's 5 143 988 for the same
     * silver, and the search had never seen it. Every vector a sizer shape settles on is scored with the
     * ladders too.
     */
    const derived: { entry: Effective; count: number }[][] = [];
    for (const depth of depths) {
      for (const scale of only ? [only.scale] : depth <= 0 ? [1] : LADDER_GROWTHS) {
        const scored = score(marches, counts, depth, scale, input.silverBudget);
        if (!scored) continue;
        const candidate: Candidate = {
          marches,
          // What the shape fields: the sizer's own mercenaries when the shape is the sizer's.
          mercs: scored.mercs,
          rungs: scored.rungs,
          march: scored.march,
          finale: scored.finale?.march ?? null,
          finaleRungs: scored.finale?.rungs ?? [],
          finaleMercs: scored.finale?.mercs ?? [],
          total: scored.total,
          depth,
          scale,
        };
        if (!pick || candidate.total > pick.total) pick = candidate;
        if (depth > 0 && scale === 1 && (!tight || depth > tight.depth)) tight = candidate;
        record(candidate);
        if (depth <= 0 && scored.mercs.some((merc, index) => merc.count !== vector[index]?.count)) {
          derived.push(scored.mercs);
        }
      }
    }
    if (tight && tight !== pick) consider(tight);
    if (!laddersOnly) {
      const seen = new Set<string>([vector.map((merc) => merc.count).join(',')]);
      for (const mercs of derived) {
        const key = mercs.map((merc) => merc.count).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        const candidate = evaluateVector(mercs, undefined, true);
        if (candidate && (!pick || candidate.total > pick.total)) pick = candidate;
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
      for (const step of depth <= 0 ? [] : SCALE_STEPS) {
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
      // Under a target the run is the shorter of the two (`repeatsFor`): the target is a ceiling, so a vector
      // whose stock does not carry it is repeated as often as the stock allows, and `largestFor` at *that*
      // count is the maximum these moves mean to sample around — at the target's own count it would be a
      // maximum the vector cannot field.
      const currentMarches = repeatsFor(vector);
      for (let index = 0; index < vector.length; index += 1) {
        const id = vector[index]?.entry.id ?? '';
        const max = anchorOf(id, currentMarches);
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

  /**
   * **Every burn level between the ends gets a rung** (owner, 2026-09-18, on a bar with two stops one unit
   * apart on his account: *"the stops still are not to my design"*). The grid samples each hired type at five
   * counts — its cap, 70 %, 45 %, 20 % and one chunk — and the climb only walks around the winner, so on an
   * account with one hired type the bar had nothing between 46 and 65 hired (5 and 7 burned). So the winner's
   * vector is scaled to every burn level under its own and every shape is scored on it.
   *
   * **Two vectors a level, not one** (2026-09-18). The level is the same as it has always been — the burn, and
   * `CHUNK * ceil(count · burn / topBurn / CHUNK)` per type, which is the vector the sweep has always scored —
   * and beside it the same level taken **per unit**, `max(1, round(count · burn / topBurn))`. The rounding up
   * to a whole chunk can only ever offer a one-type account its stock in tens, and the stock is spent a unit
   * at a time; what a unit *costs* is the chunk, and the chunk is what the bar is drawn on (`ladder` below),
   * so the level stays the burn and only the vector at it is finer. **Nothing is dropped**: every level and
   * every vector the sweep walked before is still walked, in the same order, under the same `seen`, and the
   * per-unit vector is scored only where it differs. Verified vector by vector against the previous engine on
   * six armies, 2026-09-18 — the owner's export at 7 000, his evening account, his live account at 20 000, a
   * first-run army with ten bears, the engine tests' army and the plan-shape army: each one's offered sequence
   * is identical and not one previously-scored vector is missing. What the per-unit vectors add is extra
   * shapes on top (7 000: 8 vectors scored → 21; the evening account: 8 → 24).
   *
   * What they buy, measured 2026-09-18: on the evening account the sweet spot rises to 28 367 940 over four
   * marches and the more-mercs rung to 29 265 102; on the owner's export at 7 000 the ladder's thriftiest rung
   * improves from 1.9175 a silver to **1.9715** (3 650 146 a march for 1 851 500), which puts a silver saver
   * back on that bar and — because the knee is measured from a chord drawn over the whole ladder — moves the
   * sweet spot from the 11-burn rung to the 10. They also move the frozen figures of
   * `tests/engine/plan-shape.test.ts`: 15 → 17 marches for 18 333 467 → **18 617 972** damage, five of each
   * hired type a march instead of seven. Damage is the objective, and it went up on every army measured.
   * Walked from the winner down, so a budget that cuts the walk short cuts the thrift end, not the middle.
   */
  if (best) {
    const winner: Candidate = best;
    winnerRungs = winner.rungs;
    const burnOf = (vector: { entry: Effective; count: number }[]): number =>
      vector.reduce((sum, merc) => sum + chunks(merc.count), 0);
    const topBurn = burnOf(winner.mercs);
    const seen = new Set<string>([winner.mercs.map((merc) => merc.count).join(',')]);
    /** One swept vector: scored on the whole ladder grid, then refined on depth and scale like the winner. */
    const sweep = (vector: { entry: Effective; count: number }[]): void => {
      const key = vector.map((merc) => merc.count).join(',');
      if (seen.has(key)) return;
      seen.add(key);
      let candidate = evaluateVector(vector);
      // The winner's own rungs with this vector's mercenaries (`WINNER_RUNGS_DEPTH`), the shape the search
      // could not reach from a merc-sized ladder.
      const kept = evaluateVector(vector, { depth: WINNER_RUNGS_DEPTH, scale: 1 });
      if (kept && (!candidate || kept.total > candidate.total)) candidate = kept;
      if (!candidate) return;
      // The winner's shape was refined by the climb above (its depth and its scale); a swept vector scored on
      // the grid's coarse scales alone loses to it — measured on the owner's live account, the 60-hunter march
      // came out at 7 170 113 for 8 229 200 silver, a dearer and barely stronger march than the 48-hunter one,
      // and was dominated off the frontier. So each swept vector gets the same walk over depth and scale.
      for (let round = 0; round < 16; round += 1) {
        let improved: Candidate | null = null;
        const { depth, scale } = candidate;
        const trials: { depth: number; scale: number }[] = [];
        for (const rung of [depth - 1, depth + 1]) {
          if ((DEPTHS as readonly number[]).includes(rung)) trials.push({ depth: rung, scale });
        }
        if (depth > 0) {
          for (const step of SCALE_STEPS) {
            const trial = Math.round(scale * (1 + step) * 1000) / 1000;
            if (trial >= 1 && trial <= MAX_SCALE) trials.push({ depth, scale: trial });
          }
        }
        for (const trial of trials) {
          const scored = evaluateVector(vector, trial);
          if (scored && scored.total > (improved?.total ?? candidate.total)) improved = scored;
        }
        if (!improved) break;
        candidate = improved;
      }
      consider(candidate);
    };
    for (let burn = topBurn - 1; burn >= 1; burn -= 1) {
      if (stop()) break;
      // the level as it has always been read: each type rounded up to a whole chunk
      sweep(
        winner.mercs.map((merc) => ({
          entry: merc.entry,
          count: Math.min(
            stock[merc.entry.id] ?? 0,
            merc.count <= 0 ? 0 : CHUNK * Math.ceil((merc.count * burn) / topBurn / CHUNK),
          ),
        })),
      );
      // and the same level per unit — a type the winner fields keeps at least one of itself, because a
      // thriftier level is not a reason to drop a type the account holds (S-58 A's thrift end, here)
      sweep(
        winner.mercs.map((merc) => ({
          entry: merc.entry,
          count:
            merc.count <= 0
              ? 0
              : Math.max(1, Math.min(stock[merc.entry.id] ?? 0, Math.round((merc.count * burn) / topBurn))),
        })),
      );
    }
  }

  const chosen = best as Candidate;
  const march = toMarch(chosen.rungs, chosen.mercs, chosen.march);
  const finale = chosen.finale ? toMarch(chosen.finaleRungs, chosen.finaleMercs, chosen.finale) : undefined;
  // The frontier the UI shows: only the plans nothing else beats on every resource at once, thinned to a
  // readable number. This is also where the recommendation comes from when no silver budget was given.
  const summarise = (candidate: Candidate): TradeRow => {
    const m = toMarch(candidate.rungs, candidate.mercs, candidate.march);
    // The finale, priced the same way — built once here rather than twice, because its counts and its
    // recovery time are both read below.
    const last =
      candidate.finale === null
        ? null
        : toMarch(candidate.finaleRungs, candidate.finaleMercs, candidate.finale);
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
      ...(last !== null && candidate.finaleRungs.length > 0 ? { finaleCounts: last.counts } : {}),
      totalDamage: Math.round(candidate.total),
      silver,
      gold: candidate.marches * m.gold,
      // The campaign's training queue: every repeat of the march, plus the finale's own.
      seconds: candidate.marches * m.seconds + (last?.seconds ?? 0),
      mercLost,
      // The repeated march's own figures, which `toMarch` already priced and the totals above spread the
      // finale over: these are what the March section reports for the plan's own march.
      repeat: {
        damage: m.damage,
        silver: m.silver,
        gold: m.gold,
        seconds: m.seconds,
        mercLost: m.mercLost,
      },
      shape: candidate.depth === WINNER_RUNGS_DEPTH ? 'winner' : (SIZER_DEPTHS[candidate.depth] ?? 'ladder'),
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
  const stocked = mercTypes.filter((entry) => (stock[entry.id] ?? 0) > 0 || unlimited.has(entry.id));
  /**
   * Whether a **campaign** fields a type at all: its repeated march, its final march, or — for the `all-in`
   * stop, whose marches all differ — any march of its sequence. S-58 B is a question about the plan and not
   * about one of its marches: a type the horizon outruns is spent in the finale rather than in the repeat
   * (`repeatsFor`), and a plan that spends it there has no hole in it.
   */
  const fieldsInCampaign = (row: PlanTotals, id: string): boolean =>
    (row.counts[id] ?? 0) > 0 ||
    (row.finaleCounts?.[id] ?? 0) > 0 ||
    (row.sequence?.some((march) => (march[id] ?? 0) > 0) ?? false);
  const inBand = (row: PlanTotals): boolean =>
    hiredOf(row.counts) * 2 >= goal.hired &&
    row.damagePerSilver * 2 >= goal.perSilver &&
    Object.keys(row.counts).filter((id) => !mercIds.has(id)).length > 1 &&
    // S-58 B (`refuseDroppedTypes`): a plan the player is offered fields a little of everything they hold.
    // The band can empty out if the *winner* drops a type; the fallback below draws the four answers from the
    // unbanded frontier rather than handing back an empty bar, which is the graceful degradation the other
    // three refusals have.
    (!refuseDroppedTypes || stocked.every((entry) => fieldsInCampaign(row, entry.id)));

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
  // The band alone (the unbanded frontier only when the band keeps nothing). The winner used to be added
  // when the band refused it, for a sweet spot that was read elsewhere; the sweet spot is read off these
  // candidates now, so it is inside by construction — and measured on the owner's export of 2026-09-17 the
  // refused winner was a single-troop-stack march (3 495 riders and the mercenaries) standing on the bar as
  // "Most damage", the very plan the band's third criterion exists to refuse.
  const candidates = band.length === 0 ? undominated : band;

  /**
   * **The put-back pass** (owner, 2026-09-18: *"generation sometimes skips low-level stacks and misses some
   * damage that seems cheap; it is mainly because one thing is not taken into account: troops of higher tier
   * are longer to train … add a pass to consider again lower level troops if the cost for them (silver,
   * silver/damage, total damage) is not too high and we get a nice reduction in training time"*).
   *
   * **Why the search cannot find these marches itself.** Its two shapes both miss the same family. A ladder is
   * built over a **prefix** of the damage-per-HP ranking (`ladder`, `rankTroops`), so a low tier never enters
   * one at all; the sizer's shapes are sized over **every** type the account holds at once (`sizer`). Nobody
   * ever scored "the march's own types, plus exactly one more" — and that is where the owner's cheap damage
   * is, because a Spearman I is back in the army in fifteen seconds and a Rider III takes fourteen minutes.
   * Measured on his live army (`tools/theorycraft/out/103-put-back-time.md`): the steady max is the three-type
   * ladder RD2 984 · ARC2 1931 · RD3 532 — 4 777 523 damage, 2 694 300 silver, 13d 7h of queue — and the same
   * march with Archer I put back is 4 904 479 for 2 203 500 and 8d 4h. More damage, less silver, five days
   * less queue, and no shape the search walks can express it.
   *
   * **What is scored.** A march re-sized by the MS sizer over its own troop types plus **one** type the account
   * holds and it leaves out — every left-out type, one at a time — with the march's own hired counts as the
   * sizer's caps. Priced by `toMarch`, exactly as the row's own repeat is priced, so the figure a row moves to
   * is the one the recap will draw for it. Then the player's own rates decide (`CAMPAIGN.putBack`):
   *
   * ```
   * score = (silver saved %) / silverPerDamage + (queue saved %) / timePerDamage + (damage change %)
   * ```
   *
   * taken when the score is not negative **and** the damage loss is inside the cap — the owner's own anchors,
   * *"2 % damage is okay if there's a reduction in time and a bit of silver; 3 % for a lot of silver and
   * training time"*. Ties go to the higher score, then to the higher damage.
   *
   * **Where it runs, and why there** (owner, 2026-09-19: *"it's supposed to be integrated in the plan slider
   * proposals so it's transparent to the user"*). On the **burn ladder** — one plan a level of hired units
   * burned, the set the knee, the sweet spot, "more mercs" and the steady max are all read off — before any of
   * them is chosen, so no stop is picked on a march a put-back would have improved. A row is replaced in place
   * and **keeps its burn level**: the levels themselves are settled on the marches the search generated, or a
   * rung that traded damage for queue would drop out of the ladder and take its stop with it. The two stops
   * that are not read off the ladder — the silver saver, chosen over the whole band, and the `all-in`, built
   * march by march outside the frontier — get the same offer once they are known (round two, below). The band
   * itself is never walked: that is hundreds of rows against a dozen, for a choice the ladder already makes.
   *
   * **What the hired counts do.** They are the sizer's *caps*, not its orders: MS sizes every stack to a
   * matched HP, hired stacks included, so a put-back typically fields **fewer** mercenaries than the ladder it
   * replaces — the steady max above burns 17 where the ladder burned 20 — and that is part of why it wins, a
   * smaller hired stack being one the enemy does not wipe first. A count that can only fall is what makes the
   * rest of the plan safe to leave alone: the burn falls, so the stock lasts at least as many marches
   * (`lastsMarches` is monotone in the count), so the repeats the row already plays are still sustained and the
   * finale the search already planned is still affordable. The campaign is therefore `repeats × the new march +
   * the finale it already had`, and `marches`, `finaleCounts` and the finale's own figures do not move. The two
   * rules a smaller hired stack could still break are checked rather than assumed: S-58 B (a plan the player is
   * offered fields a little of everything they hold) and the sustain.
   *
   * **What it does not touch.** The winner (`chosen`, and every figure `CampaignPlan` spreads off it), the
   * frontier, the band, and which answer a row is. It changes what a march *fields* — the burn it sits at may
   * fall with it, which is why the ladder is re-keyed and the bar re-sorted — and the player is told nothing
   * about it on the bar: the stops simply are the better marches, and the one sentence the app writes is in
   * the Details fold (`PlanRow.putBack`). Two stops that arrive at one march after the pass collapse to one,
   * as they would have at `offer`, and `leftOut` is counted off the list that is left.
   */
  /**
   * The march a put-back row was sized from, kept beside it so a stop whose own rule the put-back breaks can
   * be handed back the plan the search generated rather than dropped off the bar (the silver saver, below).
   * Keyed by the row object, and carried across the copy `offer` makes of it.
   */
  const generatedOf = new Map<PlanTotals, TradeRow>();
  const putBackOn = (row: TradeRow): TradeRow | undefined => {
    const policy = input.putBack;
    if (policy === undefined) return undefined;
    // The marches the change is paid for: a sequence row moves its first march only, every other row moves
    // the one it repeats. A finale always carries troop rungs, so `finaleCounts` is present exactly when the
    // campaign plays one and `marches` less that one is the repeat count.
    const repeats = row.sequence ? 1 : row.marches - (row.finaleCounts ? 1 : 0);
    if (repeats < 1) return undefined;
    const fielded = troops.filter((entry) => (row.counts[entry.id] ?? 0) > 0);
    const absent = troops.filter((entry) => (row.counts[entry.id] ?? 0) === 0);
    if (fielded.length === 0 || absent.length === 0) return undefined;
    const caps: Record<string, number> = { ...request.caps };
    for (const entry of mercTypes) caps[entry.id] = row.counts[entry.id] ?? 0;
    /** A percent change read as a saving: a figure that falls is positive. */
    const saved = (before: number, after: number): number =>
      before > 0 ? ((before - after) / before) * 100 : 0;
    let best: { row: TradeRow; score: number } | undefined;
    for (const extra of absent) {
      const keep = new Set([extra.id, ...fielded.map((entry) => entry.id), ...mercIds]);
      const sized = sizeStacks({
        ...request,
        units: request.units.filter((unit) => keep.has(unit.id)),
        caps,
        options: { ...request.options, method: 'ms', relaxedPreservation: false },
      });
      const picked = sized.stacks
        .filter((stack) => stack.count > 0)
        .map((stack) => ({ entry: byId.get(stack.unitId), count: stack.count }))
        .filter((stack): stack is { entry: Effective; count: number } => stack.entry !== undefined);
      const rungs = picked.filter((stack) => stack.entry.pool === 'leadership');
      const mercs = picked.filter((stack) => stack.entry.pool === 'authority');
      // A march on one troop stack is the extreme the band refuses ("not a strategy", owner 2026-09-15); a
      // put-back that collapsed onto one would walk it back onto the bar through this pass.
      if (rungs.length < 2) continue;
      // The sustain, the same test the search applies to every vector it scores: a count the stock cannot
      // field every march of the run burns mercenaries the account does not have.
      if (mercs.some((merc) => lastsMarches(sustain[merc.entry.id] ?? 0, merc.count) < repeats)) continue;
      const counts: Record<string, number> = {};
      for (const stack of picked) counts[stack.entry.id] = stack.count;
      const campaign: PlanTotals = {
        ...row,
        counts,
        ...(row.sequence ? { sequence: [counts, ...row.sequence.slice(1)] } : {}),
      };
      // S-58 B: the bar never offers a plan with a hole in it, and MS may size a hired stack down to nothing.
      if (refuseDroppedTypes && !stocked.every((entry) => fieldsInCampaign(campaign, entry.id))) continue;
      // The `all-in` is *"all the mercs you can safely field"*: every hired stack under the lowest troop stack,
      // or the enemy — which wipes the highest-HP stack first — takes it before the troops have died.
      if (row.sequence) {
        const floor = Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
        const hiredTop = Math.max(0, ...mercs.map((merc) => merc.count * merc.entry.hp));
        if (floor <= hiredTop) continue;
      }
      const march = toMarch(rungs, mercs, marchOf(picked, enemyStacks));
      /**
       * **A put-back has to shorten the training queue** (owner, 2026-09-18: *"consider again lower level
       * troops if the cost for them … is not too high and we **get a nice reduction in training time**"*).
       * That clause is the pass's whole purpose, not one term of its score: a march that takes longer to come
       * back is not a put-back however hard it hits, and the score alone cannot say so, because a big enough
       * damage gain outvotes any rise.
       *
       * Measured on a first-run army holding 42 legionaries and 20 chariots at 12 000 leadership: the silver
       * saver's cheapest left-out type, Swordsman I, came back at **+109.2 % damage** for **182.4 % more
       * silver** and **151.8 % more queue** — a score of 57 under the owner's rates, and a march that costs
       * 2.8× the silver of the stop it replaced and sits three days longer in the barracks. The rule says yes;
       * the sentence the rule came from says no.
       */
      if (march.seconds >= row.repeat.seconds) continue;
      const damage =
        row.repeat.damage > 0 ? ((march.damage - row.repeat.damage) / row.repeat.damage) * 100 : 0;
      const silver = saved(row.repeat.silver, march.silver);
      const seconds = saved(row.repeat.seconds, march.seconds);
      const score = silver / policy.silverPerDamage + seconds / policy.timePerDamage + damage;
      if (score < 0 || damage < -policy.damageLossCap) continue;
      if (best && (best.score > score || (best.score === score && best.row.repeat.damage >= march.damage)))
        continue;
      const totalDamage = row.totalDamage + repeats * (march.damage - row.repeat.damage);
      const campaignSilver = row.silver + repeats * (march.silver - row.repeat.silver);
      const mercLost = row.mercLost + repeats * (march.mercLost - row.repeat.mercLost);
      const hired = Object.values(march.mercFielded).reduce((sum, count) => sum + count, 0);
      best = {
        score,
        row: {
          ...campaign,
          // The shape sentence the experiments read a row by, rebuilt: its stack count and its silver both
          // moved, and a sentence that outlives the march it describes is the one thing this field is not.
          label:
            `${rungs.length} ${rungs.length === 1 ? 'stack' : 'stacks'} · ${hired} hired · ` +
            `${compact(march.silver)} silver a march`,
          // The march is the MS sizer's now, whatever shape the search had reached for.
          shape: 'ms',
          totalDamage,
          silver: campaignSilver,
          gold: row.gold + repeats * (march.gold - row.repeat.gold),
          seconds: row.seconds + repeats * (march.seconds - row.repeat.seconds),
          mercLost,
          repeat: {
            damage: march.damage,
            silver: march.silver,
            gold: march.gold,
            seconds: march.seconds,
            mercLost: march.mercLost,
          },
          damagePerSilver: campaignSilver > 0 ? totalDamage / campaignSilver : Infinity,
          damagePerMercenary: mercLost > 0 ? totalDamage / mercLost : Infinity,
          putBack: { unitId: extra.id, damage, silver, seconds },
        },
      };
    }
    return best?.row;
  };

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
  /**
   * **The burn ladder** (the burn axis): one plan a level of hired units burned a march — the best march at
   * that burn, the cheaper on a tie — kept only where **burning more buys more**. Measured
   * (`tools/theorycraft/out/92-the-bar-as-drawn.md`, horizon 3): the band's best march at 20 burned hits for
   * 4 938 868 and its best at 17 for 5 314 021, so a bar that offered the 20 would be offering three more units
   * of the stock for less damage; the level is dropped, and so is every level above the most damage. The
   * ladder is what the sweet spot is read off on this axis, so the recommendation can never be a plan a
   * thriftier stop beats.
   *
   * **The axis is the burn because the burn is what the player pays** (validator, 2026-09-18, on a proposal to
   * key this on the hired units a march *fields* instead). The chunk of ten is not a yardstick this file chose:
   * a march fielding one to ten of a type loses one unit of it for good either way, so a thrifty march that
   * fields a few of four types costs four chunks and a dearer one that fields forty of one costs four as well.
   * The burn therefore **compresses the thrift end** on purpose, and an axis of raw counts understates what the
   * first units of each type cost and drags the recommendation toward fielding fewer mercenaries. Measured on
   * the owner's export at 12 000 (`sweetSpotBase` below draws a chord over this ladder and takes the rung
   * farthest above it): on hired fielded the chord picks **114 fielded** at a distance of .2224; on the burn it
   * picks **156 fielded / 17 burned** at .148 against the 114's .083 — 37 % more of the field for one more
   * chunk, which is the trade the player is actually offered. The one thing read off the counts is the
   * `all-in` offer, and only because an all-in on a stock under a chunk burns no more than the steady max
   * while fielding the whole stock (see below).
   */
  const ladder = new Map<number, TradeRow>();
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
  const ladderRows = levels.map((burn) => ladder.get(burn) as TradeRow);
  /**
   * **Round one of the put-back pass, on the ladder itself** (see `putBackOn` above; owner, 2026-09-19: the
   * pass is *"integrated in the plan slider proposals so it's transparent to the user"*). Every rule below
   * reads these rows — the efficient rungs, the knee, the sweet spot, "more mercs" and the top of the ladder —
   * so improving them here is what makes a stop chosen on the march the player is actually offered rather than
   * on the one the search happened to size.
   *
   * **A rung keeps its place, and its burn may fall with it.** The levels above are settled on the generated
   * marches and are not re-derived: a rung that trades damage for queue would fail the "burning more buys
   * more" filter, drop out of the ladder and take its stop with it, which is the opposite of what the owner
   * asked for. What does move is the rung's own burn — a put-back fields at most the hired counts it was
   * capped by, and MS usually fields fewer — so the ladder is put back in order afterwards, one plan a burn
   * and the best damage at each, exactly as `ladder` was built. Everything below reads the burn off the rows
   * (the chord's ends, the middle of the range, the gap "more mercs" sits in), so an out-of-order ladder would
   * be read as a trade that runs backwards.
   */
  if (input.putBack !== undefined) {
    const put = new Map<number, TradeRow>();
    for (const row of ladderRows) {
      const improved = putBackOn(row) ?? row;
      if (improved !== row) generatedOf.set(improved, row);
      const held = put.get(improved.repeat.mercLost);
      if (
        !held ||
        improved.repeat.damage > held.repeat.damage ||
        (improved.repeat.damage === held.repeat.damage && improved.repeat.silver < held.repeat.silver)
      ) {
        put.set(improved.repeat.mercLost, improved);
      }
    }
    ladderRows.length = 0;
    ladderRows.push(...[...put.values()].sort((a, b) => a.repeat.mercLost - b.repeat.mercLost));
  }
  /**
   * **A rung nothing beats on both efficiencies** (owner, 2026-09-17, reading his own bar: *"12 hired lost got
   * better silver/dmg, better dmg/merc and almost the same damage"* than the sweet spot at 15). His stops, as
   * the app drew them: 10 burned at 1.280 a silver / 568 182 a hired, **12 at 1.320 / 511 100**, the sweet spot
   * at 15 at 1.263 / 442 961, 19 at 1.409 / 399 460 — the recommendation lost to the stop beside it on both of
   * the two things the slider balances. A plan another rung beats on damage a silver *and* damage a hired unit
   * is not a compromise between them, so it is neither the sweet spot nor a filler; the two ends keep their
   * places by definition. On his numbers this leaves 10, 12 and 19, and the middle of that range is 12.
   */
  const perSilver = (row: PlanTotals): number =>
    row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
  const perHired = (row: PlanTotals): number =>
    row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : 0;
  const efficientRows = ladderRows.filter(
    (row) =>
      !ladderRows.some(
        (other) =>
          other !== row &&
          perSilver(other) >= perSilver(row) &&
          perHired(other) >= perHired(row) &&
          (perSilver(other) > perSilver(row) || perHired(other) > perHired(row)),
      ),
  );
  /** The plans the sweet spot is read off: the efficient rungs (the whole band if none stands). */
  const sweetPool = efficientRows.length > 0 ? efficientRows : candidates;

  /**
   * **The middle of the range, and the tie the campaign breaks** (validator, 2026-09-18; S-77). The fallback
   * when there is no knee: the rung whose burn is closest to the middle of the efficient rungs' own range.
   * The middle is a half-unit whenever the range is odd, and then **two rungs are exactly as near it** — the
   * choice between them used to go to thrift, which is a coin toss dressed as a rule (owner: *"no more magic
   * static numbers"*).
   *
   * Measured on his export at 7 000 with the capped sponge march on the bar: the burn ladder is 7 · 9 · 10 · 11 · 12 · 13 · 14, no rung stands above the chord, and the middle is
   * **10.5** — the 10 and the 11 are both half a unit away. Over the whole campaign the 11 beats the 10 on
   * **both** of the criteria the bar balances: 22 045 361 damage at 2.0119 a silver and 393 667 a hired unit,
   * against 20 684 777 at 1.9548 and 376 087. Thrift was handing the recommendation a plan another stop
   * dominates, which is the one thing the sweet spot must never be.
   *
   * So a tie is broken by the campaign's own two ratios (`damagePerSilver`, `damagePerMercenary` — the whole
   * run, repeats and finale, not the repeated march alone): the rung the other does not beat on both wins, and
   * only when neither dominates does thrift decide, as it always did. Two plans at the *same* burn are still
   * told apart by damage.
   */
  const dominates = (row: PlanTotals, other: PlanTotals): boolean =>
    row.damagePerSilver >= other.damagePerSilver &&
    row.damagePerMercenary >= other.damagePerMercenary &&
    (row.damagePerSilver > other.damagePerSilver || row.damagePerMercenary > other.damagePerMercenary);
  const middleOfRange = (rows: TradeRow[]): TradeRow => {
    const burns = rows.map((row) => row.repeat.mercLost);
    const middleBurn = (Math.min(...burns) + Math.max(...burns)) / 2;
    return rows.reduce<TradeRow>((held, row) => {
      const away = Math.abs(row.repeat.mercLost - middleBurn);
      const heldAway = Math.abs(held.repeat.mercLost - middleBurn);
      if (away < heldAway) return row;
      if (away > heldAway) return held;
      if (row.repeat.mercLost !== held.repeat.mercLost) {
        if (dominates(row, held)) return row;
        if (dominates(held, row)) return held;
        return row.repeat.mercLost < held.repeat.mercLost ? row : held;
      }
      return row.repeat.damage > held.repeat.damage ? row : held;
    }, rows[0] ?? chosenPoint);
  };

  /**
   * **The sweet spot is the knee of damage against burn** over the rungs nothing beats on both ratios (owner,
   * 2026-09-18, on the middle of the range landing one unit from the thrift end: *"best optimization still
   * doesn't offer enough splits"*). Measured on his latest export (`tools/theorycraft/out/99-three-stops.md`):
   * silver is flat from 7 to 10 burned because the troop ladder is sized off the biggest hired stack and the
   * other types ride for free, so the last rung before silver starts rising — 10 burned, 5 862 857 for the
   * same 3 619 200 silver as the 8 the middle rule chose — is both the best damage a silver and the knee. The
   * knee is the efficient rung farthest above the chord drawn over the **whole** ladder, from its thriftiest
   * rung to its top, in burn and damage — the chord has to span the ladder, or the knee of the efficient rungs
   * alone lands one unit from their end (measured: 8 against 10). With fewer than three rungs there is no
   * chord, and the middle rule stands (`middleOfRange` above: the campaign's ratios break a tie, thrift last).
   */
  const sweetSpotBase: TradeRow = ((): TradeRow => {
    const rows = sweetPool;
    const first = ladderRows[0];
    const last = ladderRows[ladderRows.length - 1];
    // Fewer than three rungs: no chord to draw, so the middle rule stands (`middleOfRange`).
    if (rows.length < 3 || !first || !last) return middleOfRange(rows);
    const dx = last.repeat.mercLost - first.repeat.mercLost || 1;
    const dy = last.repeat.damage - first.repeat.damage || 1;
    let best: TradeRow | undefined;
    let bestDistance = 0;
    for (const row of rows) {
      const t = (row.repeat.mercLost - first.repeat.mercLost) / dx;
      const distance = (row.repeat.damage - (first.repeat.damage + t * dy)) / dy;
      if (distance > bestDistance) {
        bestDistance = distance;
        best = row;
      }
    }
    // No rung stands above the chord: the ladder is convex (each unit burned buys more than the last —
    // measured on the 2026-09-17 export at 7 000), so there is no knee and the middle of the efficient
    // rungs is the compromise, a tie between two of them settled by the campaign's ratios (`middleOfRange`).
    if (best) return best;
    return middleOfRange(rows);
  })();

  const knee = ((): TradeRow | undefined => {
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
  /**
   * **All in**: every mercenary the troops can shelter on the first march, then each next march on what the
   * stock has left, for the horizon. Each march is the strongest shape — ladders, the sizer's methods, the
   * winner's rungs — that fields the most of the remaining stock with every hired stack under the lowest troop
   * stack (the enemy wipes the highest-HP stack first, so a hired stack above a troop stack dies before it);
   * the stock is tried whole, then at 95 %, 90 %… until a shape shelters it. The campaign that spends the stock
   * fastest — the descending sequence the benchmark (`tests/engine/plan-benchmark.test.ts`) found the sizers
   * playing and the plan unable to express.
   *
   * **And when the stock runs out before the horizon does, it marches on troops alone** (owner, 2026-09-19:
   * *"continue for the measured additions"*). This stop is the one plan on the bar that is a *sequence*, so
   * unlike every other row it has a march count of its own to fill: spending the stock fastest is the point of
   * it, and stopping the campaign the moment the stock is gone threw away every march the horizon still had
   * room for. Measured on a first-run army holding three Bear V at 20 000 leadership (2026-09-18): the all-in
   * played 3 · 2 · 1 for **14 505 126** damage over three marches of a four-march horizon, where TotalStack
   * answers **19 388 676** at equal silver — and the whole of the gap was the fourth march. Playing it, the
   * stop is **19 115 768** for 32 525 600 silver: 98.6 % of TotalStack's answer at the same silver, where it
   * was 74.8 % (2026-09-19).
   *
   * The tail is the sizer's own march over **every troop type the account holds, with no mercenaries**: there
   * is no hired stock left to plan, and a march of troops alone is the sizer's job rather than this method's
   * (the same sentence `repeatsFor` makes about a finale with nothing left in it). It is repeated for each
   * march the horizon has left, it is priced by `toMarch` like every other march here — so its silver and its
   * seconds are the recap's — and it passes this stop's shelter test trivially, having no hired stack to
   * shelter. The campaign's two ratios do move — the tail's damage is spread over the same hired burned, so
   * damage a hired rises (bears ×3: 4 835 042 → 6 371 923) and damage a silver eases (0.595 → 0.588) — but no
   * rule reads them here: the offer rule still reads the **first** march's hired count, the S-76
   * ceiling still gives a *repeated* stop no finale when its hired is spent, and `repeat` is still the first
   * march's figures alone.
   */
  const allIn = ((): TradeRow | undefined => {
    if (planned === undefined || planned < 1) return undefined;
    const remaining: Record<string, number> = { ...stock };
    const played: Candidate[] = [];
    const hiredOfVector = (mercs: { entry: Effective; count: number }[]): number =>
      mercs.reduce((sum, merc) => sum + merc.count, 0);
    for (let i = 0; i < planned; i += 1) {
      const single = makeScorer({
        troops,
        mercTypes,
        stock: remaining,
        leadership,
        enemyStacks,
        gap,
        finale: false,
        ...(sizerShape ? { sizer } : {}),
        winnerRungs: () => winnerRungs,
        sustain,
      });
      let found: Candidate | null = null;
      for (let share = 1; share > 0.04 && !found; share -= 0.05) {
        const counts: Record<string, number> = {};
        let any = false;
        for (const entry of mercTypes) {
          const count = Math.floor((remaining[entry.id] ?? 0) * share);
          counts[entry.id] = count;
          if (count > 0) any = true;
        }
        if (!any) break;
        const depths = [
          ...(sizerShape ? Object.keys(SIZER_DEPTHS).map(Number) : []),
          ...(winnerRungs.length > 0 ? [WINNER_RUNGS_DEPTH] : []),
          ...DEPTHS,
        ];
        for (const depth of depths) {
          for (const scale of depth <= 0 ? [1] : LADDER_GROWTHS) {
            const scored = single(1, counts, depth, scale);
            if (!scored || scored.rungs.length === 0) continue;
            const fielded = scored.mercs.filter((merc) => merc.count > 0);
            if (fielded.length === 0) continue;
            const troopFloor = Math.min(...scored.rungs.map((rung) => rung.count * rung.entry.hp));
            const hiredTop = Math.max(...fielded.map((merc) => merc.count * merc.entry.hp));
            if (troopFloor <= hiredTop) continue;
            const candidate: Candidate = {
              marches: 1,
              mercs: scored.mercs,
              rungs: scored.rungs,
              march: scored.march,
              finale: null,
              finaleRungs: [],
              finaleMercs: [],
              total: scored.total,
              depth,
              scale,
            };
            // The most of the stock first, the most damage with it second.
            if (
              !found ||
              hiredOfVector(candidate.mercs) > hiredOfVector(found.mercs) ||
              (hiredOfVector(candidate.mercs) === hiredOfVector(found.mercs) && candidate.total > found.total)
            ) {
              found = candidate;
            }
          }
        }
      }
      if (!found) break;
      played.push(found);
      for (const merc of found.mercs) {
        if (unlimited.has(merc.entry.id)) continue;
        remaining[merc.entry.id] = Math.max(0, (remaining[merc.entry.id] ?? 0) - chunks(merc.count));
      }
    }
    const first = played[0];
    if (!first) return undefined;
    const marches = played.map((candidate) => toMarch(candidate.rungs, candidate.mercs, candidate.march));
    /**
     * **The marches the spent stock leaves over**: the sizer over the troop types alone, once, repeated for
     * each of them. `elite` names the method because the app's own default does — with no mercenary in the
     * request there is nothing for the two preservation methods to preserve, and all three sized the same
     * march to the unit on every army measured (2026-09-19: the first-run army at three bears and at 83 Epic
     * Monster Hunter VI, the 4 000-leadership case, the owner's export at 7 000). An army with no troop type
     * to field has no tail, and the campaign is as short as it was.
     */
    if (marches.length < planned) {
      const sized = sizer([], 'elite');
      if (sized.rungs.length > 0) {
        const tail = toMarch(sized.rungs, [], marchOf(sized.rungs, enemyStacks));
        while (marches.length < planned) marches.push(tail);
      }
    }
    const head = marches[0] as PlanMarch;
    const totalDamage = marches.reduce((sum, march) => sum + march.damage, 0);
    const silver = marches.reduce((sum, march) => sum + march.silver, 0);
    const gold = marches.reduce((sum, march) => sum + march.gold, 0);
    // No march of this stop is the one above it repeated, so its recovery time is summed over the sequence
    // like its damage and its silver, and `repeat.seconds` below is the **first** march's alone.
    const seconds = marches.reduce((sum, march) => sum + march.seconds, 0);
    const mercLost = marches.reduce((sum, march) => sum + march.mercLost, 0);
    const hired = Object.values(head.mercFielded).reduce((sum, count) => sum + count, 0);
    return {
      label: `${first.rungs.length} ${first.rungs.length === 1 ? 'stack' : 'stacks'} · ${hired} hired · ${compact(head.silver)} silver a march`,
      counts: head.counts,
      sequence: marches.map((march) => march.counts),
      totalDamage,
      silver,
      gold,
      seconds,
      mercLost,
      repeat: {
        damage: head.damage,
        silver: head.silver,
        gold: head.gold,
        seconds: head.seconds,
        mercLost: head.mercLost,
      },
      shape: first.depth === WINNER_RUNGS_DEPTH ? 'winner' : (SIZER_DEPTHS[first.depth] ?? 'ladder'),
      marches: marches.length,
      damagePerSilver: silver > 0 ? totalDamage / silver : Infinity,
      damagePerMercenary: mercLost > 0 ? totalDamage / mercLost : Infinity,
    };
  })();

  const sameCounts = (a: PlanTotals, b: PlanTotals): boolean =>
    JSON.stringify(a.counts) === JSON.stringify(b.counts);
  const stops: PlanRow[] = [];
  const offer = (row: TradeRow | undefined, pick: PlanPick): void => {
    if (row === undefined) return;
    if (stops.some((other) => sameCounts(other, row))) return;
    const stop: PlanRow = { ...row, pick, bestFor: { silver: false, hired: false } };
    // The march this row was sized from, carried onto the copy: a stop whose own rule its put-back breaks is
    // handed the generated plan back rather than dropped (the silver saver, after round two).
    const generated = generatedOf.get(row);
    if (generated) generatedOf.set(stop, generated);
    stops.push(stop);
  };
  /**
   * **Five stops** (owner, 2026-09-18, replacing the three of 2026-09-17), thriftiest first — see `PlanPick`.
   * Two stops that are one plan collapse to one, so a bar may carry fewer. The `all-in` is the one stop that
   * may share a burn with the one before it (it is offered on what it fields), and it is always last: it is
   * sorted on the burn like the rest, and it is the dearest march at whatever burn it lands on.
   */
  const top = ladderRows[ladderRows.length - 1];
  /**
   * **Least silver**: the cheapest march of the band that stands left of the sweet spot (fewer units burned),
   * costs no more silver than it, and is **at least as efficient a silver** — so the stop is a real saving and
   * not a smaller march for its own sake — and that no other such march beats on both ratios. Over the band
   * and not the ladder, because the ladder keeps one plan a level, the best damage there, and the cheapest
   * plan at that level is a different one: the vector's tight ladder (`tight` in `evaluateVector`). The
   * "beaten on both" test is taken among the marches left of the sweet spot only: the tight ladders of one
   * account share one shape and so one pair of ratios to the third decimal, and against the whole band the
   * dearest of them beat every cheaper one by a hair (measured on the owner's live account: 1.0706 a silver
   * and 962 801 a hired at 60 hunters against 1.0708 and 962 605 at 40), which left no least-silver stop at
   * all. Equal silver is allowed and the fewest burned breaks the tie; absent when nothing qualifies.
   */
  const leftOfSweet = candidates.filter(
    (row) =>
      row.repeat.mercLost < sweetSpotBase.repeat.mercLost &&
      row.repeat.silver <= sweetSpotBase.repeat.silver &&
      perSilver(row) >= perSilver(sweetSpotBase),
  );
  const beatenOnBoth = (row: PlanTotals): boolean =>
    leftOfSweet.some(
      (other) =>
        other !== row &&
        perSilver(other) >= perSilver(row) &&
        perHired(other) >= perHired(row) &&
        (perSilver(other) > perSilver(row) || perHired(other) > perHired(row)),
    );
  const leastSilver = leftOfSweet
    .filter((row) => !beatenOnBoth(row))
    .reduce<TradeRow | undefined>((best, row) => {
      if (!best) return row;
      if (row.repeat.silver !== best.repeat.silver)
        return row.repeat.silver < best.repeat.silver ? row : best;
      if (row.repeat.mercLost !== best.repeat.mercLost) {
        return row.repeat.mercLost < best.repeat.mercLost ? row : best;
      }
      return row.repeat.damage > best.repeat.damage ? row : best;
    }, undefined);
  /**
   * More mercenaries: the rung of the ladder nearest the middle of the gap between the sweet spot and the
   * top, strictly inside it — the step a player takes when the stock allows more than the knee and less than
   * everything. Two rungs equally near are told apart by damage a unit burned.
   */
  const moreMercs = ((): TradeRow | undefined => {
    if (!top) return undefined;
    const low = sweetSpotBase.repeat.mercLost;
    const high = top.repeat.mercLost;
    if (high - low < 2) return undefined;
    const middle = (low + high) / 2;
    let pick: TradeRow | undefined;
    for (const row of ladderRows) {
      if (row.repeat.mercLost <= low || row.repeat.mercLost >= high) continue;
      const away = Math.abs(row.repeat.mercLost - middle);
      const held = pick ? Math.abs(pick.repeat.mercLost - middle) : Infinity;
      if (away < held || (away === held && pick && perHired(row) > perHired(pick))) pick = row;
    }
    return pick;
  })();
  offer(sweetSpotBase, 'sweet-spot');
  offer(top, 'steady-max');
  offer(leastSilver, 'silver-saver');
  offer(moreMercs, 'more-mercs');
  /**
   * **Offered when its first march fields more hired units than the steady max's repeat** (owner, 2026-09-18:
   * *"a last stop: all mercs possible … fill all the mercs you can safely"*). On an account whose whole stock
   * the troops already shelter every march, "all in" *is* the steady max and would be a second row of it.
   *
   * The test used to be the burn, and the burn cannot see this stop on a stock smaller than a chunk: with ten
   * bears in stock, 10 · 9 · 8 · 7 and eight a march both burn one chunk a march, so the campaign that spends
   * the stock fastest tied the steady max and was dropped as a duplicate of it
   * (`tools/theorycraft/out/101-shelter-cost-and-ten-bears.md` §B). This is the **one** place the hired count
   * is read instead of what it costs, and only because two campaigns that cost the same are told apart by
   * nothing else. Measured on that army, 2026-09-18: the all-in plays 10 · 9 · 8 · 7 for **21 700 948** over
   * four marches at **45 577 400** silver, against the steady max's 21 732 276 for 32 525 600 — 40 % more
   * silver to spend the stock four times faster, for slightly *less* damage. It is a poor deal on this army,
   * and the point of the stop is that the bar can now show it as one; on the owner's own account it is the
   * campaign that fields 254 hired units where the steady max fields 128.
   */
  if (allIn && top && hiredOf(allIn.counts) > hiredOf(top.counts)) offer(allIn, 'all-in');

  /**
   * **Round two: the stops the ladder did not carry.** The pass above improved the burn ladder, which is where
   * the sweet spot, "more mercs" and the steady max are read off — but the silver saver is chosen over the
   * whole band (`leftOfSweet`, which is `candidates` and not `ladderRows`) and the `all-in` is built march by
   * march outside the frontier altogether. Both are priced marches a put-back can improve, so they get the
   * same offer here, once the bar knows which ones they are. A row that already carries a put-back is left
   * alone: one type goes back per stop, and a second round over the same march is a different question
   * (a march with two cheap types left out) that nobody has measured yet.
   *
   * The `all-in` keeps the rule it was **offered** by as well: it is on the bar because its first march fields
   * more hired units than the steady max's repeat, and a put-back fields at most what it was capped by, so a
   * put-back that took it under that line would leave the bar carrying a stop whose own reason for being there
   * had gone.
   */
  if (input.putBack !== undefined) {
    const topHired = top ? hiredOf(top.counts) : 0;
    for (let index = 0; index < stops.length; index += 1) {
      const stop = stops[index] as PlanRow;
      if (stop.putBack !== undefined) continue;
      const replaced = putBackOn(stop);
      if (!replaced) continue;
      if (stop.pick === 'all-in' && hiredOf(replaced.counts) <= topHired) continue;
      const put: PlanRow = { ...stop, ...replaced };
      generatedOf.set(put, stop);
      stops[index] = put;
    }
    /**
     * **The silver saver has to stay a saving.** It is on the bar because it is cheaper than the sweet spot
     * *and* at least as efficient a silver (`leastSilver` above) — that pair is the stop's whole definition,
     * and a put-back can break it, because MS sizes a deeper march than the tight ladder it replaces. Measured
     * on a first-run army holding 42 legionaries and 20 chariots at 12 000 leadership: the saver's put-back
     * came out **dearer than the sweet spot** (5 108 400 against 4 878 400 a march) at 0.706 a silver against
     * 0.858 — a "Silver saver" spending more silver than the stop beside it, which is a name false on its own
     * row. When that happens the **put-back** is dropped and not the stop: the generated march is still a real
     * saving, and a bar with a hole where its thrifty end was is worse than a bar without a put-back on it.
     */
    const saver = stops.findIndex((row) => row.pick === 'silver-saver');
    const sweet = stops.find((row) => row.pick === 'sweet-spot');
    const saving = saver < 0 ? undefined : (stops[saver] as PlanRow);
    if (saving?.putBack && sweet) {
      const dearer = saving.repeat.silver > sweet.repeat.silver;
      const worse = perSilver(saving) < perSilver(sweet);
      const generated = generatedOf.get(saving);
      if ((dearer || worse) && generated) {
        stops[saver] = { ...generated, pick: saving.pick, bestFor: saving.bestFor };
      }
    }
  }

  const byBurn = (a: PlanRow, b: PlanRow): number =>
    a.repeat.mercLost - b.repeat.mercLost ||
    a.repeat.silver - b.repeat.silver ||
    a.repeat.damage - b.repeat.damage;
  stops.sort(byBurn);
  /**
   * **Burning more has to buy more** (S-61, and the test `tests/engine/plan-criteria.test.ts` holds on every
   * army): the bar runs along the hired units a march burns for good, and its whole meaning is that moving
   * right spends more of the stock and hits harder for it. A put-back may spend up to `damageLossCap` of a
   * march's damage on silver and on the queue, and on one measured bar that was enough to break the ladder —
   * the owner's export at 12 000, where the steady max took Spearman I and came out at **8 063 238** against
   * the sweet spot's **8 185 823** one stop to its left. "Steady max" 1.5 % under "Sweet spot" is a row whose
   * name is false on its face, which no saving buys back.
   *
   * So the ladder is walked from the thrift end and any row that does not out-hit the one before it is handed
   * its **generated** march back (`generatedOf`) — the put-back goes, never the stop. A row whose generated
   * march was already not above its neighbour is left exactly as the search made it: that is a plan the bar
   * carried before this pass existed, and not something to correct here. The `all-in` is exempt, as it is in
   * the test: it fields every mercenary the troops can shelter, which can cost troops, so it burns the most
   * and need not hit the hardest.
   */
  if (input.putBack !== undefined) {
    for (let index = 1; index < stops.length; index += 1) {
      const current = stops[index] as PlanRow;
      const previous = stops[index - 1] as PlanRow;
      if (current.pick === 'all-in' || !current.putBack) continue;
      if (current.repeat.damage > previous.repeat.damage) continue;
      const generated = generatedOf.get(current);
      if (!generated) continue;
      stops[index] = { ...generated, pick: current.pick, bestFor: current.bestFor };
    }
    // A reverted row is a different march at a different burn, so the bar is put back in order before the two
    // efficiencies below are read off it.
    stops.sort(byBurn);
    /**
     * **The dedupe, run again on what the pass left.** `offer` refuses a stop whose counts another already
     * has, on the marches the search generated; the pass then re-sizes some of them, so two stops can arrive
     * at one march after that test has been made — and a bar that offers the same march twice is the thing
     * `offer` exists to prevent, whichever step produced it. The thriftiest of a pair keeps the place, which
     * is the order `offer` itself kept, and `leftOut` below counts off the list that is left.
     */
    for (let index = stops.length - 1; index > 0; index -= 1) {
      const row = stops[index] as PlanRow;
      if (stops.slice(0, index).some((other) => sameCounts(other, row))) stops.splice(index, 1);
    }
  }
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
  const alternatives: PlanRow[] = stops;
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
  /**
   * The frontier as the caller asked to see it (`CampaignInput.withFrontier`). A stop is matched back to the
   * row it came from by the put-back's own bookkeeping (`generatedOf`, which holds the generated march a
   * re-sized stop was made from) and otherwise by its counts, which is the same test `offer` deduplicates by.
   */
  const frontierRows: PlanFrontierRow[] | undefined =
    input.withFrontier === true
      ? (() => {
          /**
           * A march's identity for the diagnostic: its non-zero counts, sorted, so two records of the same
           * march match whatever order their keys were written in. `sameCounts` above compares the objects'
           * JSON and is key-order dependent; it is left exactly as it is, because changing what `offer`
           * deduplicates by would be a change to the bar.
           */
          const keyOf = (counts: Record<string, number>): string =>
            Object.entries(counts)
              .filter(([, count]) => count > 0)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([id, count]) => `${id}:${count}`)
              .join(',');
          const stopByKey = new Map<string, PlanPick>();
          const generatorByKey = new Map<string, PlanPick>();
          for (const stop of stops) {
            stopByKey.set(keyOf(stop.counts), stop.pick);
            const generated = generatedOf.get(stop);
            if (generated) generatorByKey.set(keyOf(generated.counts), stop.pick);
          }
          const decorate = (row: TradeRow, held: boolean): PlanFrontierRow => {
            const key = keyOf(row.counts);
            const stop = stopByKey.get(key);
            const generatorOf = generatorByKey.get(key);
            return {
              ...row,
              onFrontier: held,
              undominated: held && undominated.includes(row),
              inBand: inBand(row),
              ...(stop !== undefined ? { stop } : {}),
              ...(generatorOf !== undefined ? { generatorOf } : {}),
            };
          };
          const seen = new Set<Candidate>(frontier);
          const onFrontier: PlanFrontierRow[] = all.map((row) => decorate(row, true));
          const fromCurve: PlanFrontierRow[] = [];
          for (const candidate of bucketBest.values()) {
            if (seen.has(candidate)) continue;
            seen.add(candidate);
            fromCurve.push(decorate(summarise(candidate), false));
          }
          return [...onFrontier, ...fromCurve].sort(
            (a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage,
          );
        })()
      : undefined;
  return {
    curve,
    ...(frontierRows !== undefined ? { frontier: frontierRows } : {}),
    ...total,
    march,
    finale,
    binding: {
      // A ladder is priced in whole units, so a plan rarely lands exactly on a budget: silver counts as
      // binding when the plan spends nearly all of it.
      silver: input.silverBudget !== undefined && total.silver >= input.silverBudget * 0.9,
      mercenaries: chosen.mercs.some(
        (merc) => !unlimited.has(merc.entry.id) && merc.count >= (stock[merc.entry.id] ?? 0),
      ),
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
