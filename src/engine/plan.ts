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
 * **Damage here means the worst opening** (S-94, 2026-09-19): the enemy-first journal's total, the figure the
 * recap prints under that name, and never the midpoint of the two openings. One line decides it — `marchOf`,
 * where the owner's reason is written out — and every figure this file reports follows from that one.
 *
 * Pure data in, pure data out (ADR-0006): no React, no store, no DOM.
 */
import type { UnitDef } from '../data/types';
import { buildJournal } from './battle';
import type { Pool } from '../data/types';
import { enemySquadCount } from './battle';
import { buildKillOrder } from './killOrder';
import { effectiveUnit, hitDamage } from './units';
import { CHUNK, chunks, recoveryCosts, retrainOne } from './recovery';
import { simulateBattle } from './battle';
import { sizeStacks } from './stacker';
import type { BattleSummary, Housing, RecoverySettings, Stack, StackRequest, StackResult } from './types';

/**
 * What the **search** prices a march's losses at: the bare game, no temple and no training discounts. The
 * figures a plan *prints* are re-priced under the account's own `request.recovery` by `toMarch` (S-91), so
 * this is the yardstick the candidates are ranked against and nothing a player reads. One object, hoisted out
 * of `marchOf`, which builds a stack's bill once per stack of every march of every shape the search scores.
 */
const SEARCH_RECOVERY: RecoverySettings = {
  templeLevel: 0,
  trainingCostReduction: {},
  trainingSpeed: {},
  plan: { mode: 'retrain' },
};

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
   * **The hired saver** (`docs/plans/the-stops-the-bar-offers.md`, W10; experiments 144–146). Set, the bar
   * also offers the band's plan that burns the **fewest** hired units over the campaign — a plan the frontier
   * already holds and the bar never offered, because every other stop is picked along silver or off the burn
   * ladder's rungs. Two plans at one burn resolve to the **cheaper** (the band's own order): breaking the tie
   * on damage instead, as the W10 plan first wrote it, opened 3 fewer of TotalStack's rows (146: 45 / 16
   * against 47 / 13).
   *
   * - `'guard'` — shipped in 54c7e3d, replaced by the fold (`foldTo`): the saver is withheld wherever it would
   *   break the bar's own order (S-61) — a stop at the same burn or less, or a stop to its right it out-hits.
   *   Measured over the seventeen benchmark armies (146): 47 rows dominated and 17 no stop fits, against
   *   45 and 22 without it; no army reads worse on any of the seven markers.
   * - `'silver'` — offered wherever `offer` accepts it: 47 / 13, but S-61 breaks on three armies — **what the
   *   app ships, with `foldTo`**, which restores the order (`CAMPAIGN.planFixes`, experiment 149).
   * - `'damage'` — the same with the damage tie-break, for the record.
   * - `'fold'` — offered, and the stops it out-hits dropped: 47 / 13, but the least silver and the damage a
   *   silver fall on three armies, a regression.
   *
   * Omitted, the bar is the five stops it was.
   */
  burnSaver?: 'damage' | 'silver' | 'guard' | 'fold' | undefined;
  /**
   * **The fold** (W10 §9.5; owner, 2026-09-23: *"fold uninteresting stops … filtered in the end to retain the
   * best ones"*, then *"ok allow 5 stops"*). Set, the bar is re-chosen at the end, over the stops the rules
   * above offered **and the band**, to at most this many stops — experiments 147, 148 and 149:
   *
   *  - the bar keeps its order (S-61), a real low-silver stop (within 5 % of the cheapest the stops offered)
   *    and the sweet spot;
   *  - among the bars that do, the one that gives up the fewest of the ten readings the plan is judged on
   *    (the most damage, the least silver, burn, gold, coins and queue, and damage a silver, a hired unit, a
   *    gold and a coin), then the least in sum, then the fuller bar;
   *  - a band plan enters **only by taking a role truthfully** — as the silver saver when it is the bar's
   *    cheapest, as the hired saver when it burns the fewest — so no stop wears a name its figures deny.
   *
   * Meant with `burnSaver: 'silver'`: the fold, not the guard, decides where the hired saver stands.
   */
  foldTo?: number | undefined;
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
   * **The band's token-field yardstick, switchable** — a diagnostic for
   * `tools/theorycraft/108-thrift-end.test.ts` and `112-band-yardstick.test.ts`, never set by the app, kept
   * so the measurements behind S-93 and S-95 can be re-run against the engine that shipped.
   *
   * The band refuses a plan that fields a **token** of the account's effort, and the yardstick it measures
   * that against is `damage` by default since S-95: half the damage the plan's own winning march does
   * (`inBand`). The readings, all measured over the fifteen armies `plan-criteria.test.ts` holds its criteria
   * on (`out/112-band-yardstick.md` §A, 2026-09-19):
   *
   *  - `damage` — the rule, and what ships: the worst plan the band keeps anywhere in the fifteen is 37.8 %
   *    of that army's steady max, it admits the owner's own hand-built family (41 band plans on his camp of
   *    2026-09-19 where the count admitted none), and it costs three recommendations a move — one up
   *    (+14.6 % on the evening account), two down (−8.8 % on the 7 000 export for 4.2 % more silver and three
   *    chunks less of the stock, −36.5 % on his live camp of 2026-09-18 for 22 % less silver, half the queue
   *    and a fourth stop);
   *  - `winner` — the rule until S-95: half the winner's **fielded hired**. On the three smallest first-run
   *    armies the winner itself fields a token of the stock, so the arm asks for almost nothing and the band
   *    keeps a march worth **14.4 %** of the steady max — the extreme the arm exists to refuse;
   *  - `hired` / `burn` with a floor of half the **sweet spot's** fielded hired or burn: measured in
   *    experiment 108 and again here as R4 — on the live account at 20 000 the silver saver falls 40.8 % in
   *    damage, and on his own camp the *recommendation* falls 14.3 % at the same silver;
   *  - `damageMin` at half the **sweet spot's** damage (112's R3): the same bars as `damage` on every one of
   *    the fifteen, with a floor 3 to 10 points lower — it buys nothing and refuses less;
   *  - `none` — no token criterion at all: experiment 108 measured the 7 000 export's thrift end falling to a
   *    **506 032**-damage march for 278 400 silver, 8.6 % of the steady max's, which is the extreme the
   *    owner's instruction names.
   */
  bandHired?: { mode: 'winner' | 'none' | 'damage' } | { mode: 'hired' | 'burn' | 'damageMin'; min: number };
  /**
   * **The sheltered-maximum vectors, behind a flag** — the same diagnostic, for §B of experiment 108.
   *
   * Set, the search also scores, for each prefix length `k` of the troop ranking, the hired counts the
   * **biggest** tight ladder over `k` types shelters at this leadership. Measured over the same thirteen
   * armies: it adds frontier rows (his camp of 2026-09-19: 54 → 67; the 4 000 case: 825 → 826) and costs 10
   * to 40 % of the search, and it moved **neither** criterion on any army — the family the plan was missing is
   * the sizer over a prefix (`tighterShape`), which is a *shape* and not a vector. Off, and off in the app.
   */
  shelteredMax?: boolean;
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
   * The rows are the frontier's own summaries **plus the marches the bar offers that the search never
   * summarised** — a stop the put-back pass re-sized after it was chosen, and the `all-in`, which is built
   * march by march outside the frontier altogether. `onFrontier` tells the two apart. Since S-88 that is the
   * whole of the reference table's own set as well (`curve` is bucketed over the plans the bar may offer), so
   * every row of the table under the bar has a row here behind it. Sorted by silver.
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
  /**
   * The march's **worst opening** — the enemy-first journal's total, which is `simulateBattle`'s `minDamage`
   * on these counts to the unit and what the recap prints under that name. Not the midpoint of the two
   * openings: see `marchOf` for the owner's reason (S-94, 2026-09-19).
   */
  damage: number;
  /**
   * **What the march's hired stacks themselves dealt**, in that same worst opening (S-105, 2026-09-19): the
   * enemy-first journal's army lines that belong to an `authority` stack, summed (`marchOf`). `damage` above
   * is the whole march's; this is the part of it the hired stock bought, and it is what
   * `PlanTotals.damagePerMercenary` divides by the chunks the march burns.
   */
  hiredDamage: number;
  silver: number;
  gold: number;
  /**
   * **Dragon coins the march's losses cost to bring back** (S-96, 2026-09-19). The fourth price the recap
   * prints (`BattleSummary.recovery.dragonCoins`) and the one only the **dominance** pool ever charges: a
   * monster is recruited again ten at a time at `training.dragonCoins` a chunk, where a troop has no such
   * line and a mercenary has no `training` block at all. Nought on every army that holds no monster, which
   * is every army this repo measured before S-96 — and the reason the figure could be left out until the
   * plan could field one.
   */
  dragonCoins: number;
  /**
   * How long the march's losses take to come back into the army, in seconds — the third price a march is
   * paid for, beside silver and gold, and the one the owner went looking for on 2026-09-18: *"generation
   * sometimes skips low-level stacks and misses some damage that seems cheap; it is mainly because one
   * thing is not taken into account: troops of higher tier are longer to train."* A Spearman I is back in
   * fifteen seconds and a Rider III takes fourteen minutes, so two marches of the same silver are not the
   * same march at all.
   *
   * Priced the way this file prices everything else (`toMarch`): every stack the march fields is
   * **retrained** — a troop per unit at `training.seconds` divided by the account's training speed, a
   * monster per chunk of ten — and a **mercenary** adds nothing at all, having no `training` block: the game
   * brings it back for gold and no time. So a march that leans on hired soldiers recovers faster than its
   * silver suggests, and one that leans on monsters does not. It is what `recoveryCosts` reports for the
   * same counts under the retrain plan (`src/engine/recovery.ts`).
   */
  seconds: number;
  /** Units fielded of each hired type — every pool but `leadership` (S-96). */
  mercFielded: Record<string, number>;
  /**
   * **Chunks of the `authority` pool this march loses for good** (S-102): the hired soldiers and the monster
   * mercenaries, one in every ten of each stack. A **dominance** monster is not counted — it is trained
   * again, and its whole price is the silver, the `seconds` and the `dragonCoins` beside this (`marchOf`).
   */
  mercLost: number;
  strikes: number;
  stacks: number;
}

/** What one of a plan's identical marches is, on its own — see `PlanTotals.repeat`. */
export interface PlanRepeat {
  /** The repeated march's **worst opening**, the recap's `minDamage` on its counts (S-94; `marchOf`). */
  damage: number;
  /**
   * **The hired stacks' own share of that opening** — `PlanMarch.hiredDamage` for the march the stop repeats
   * (S-105). Damage a hired unit for this one march is `hiredDamage / mercLost`, which is what the trade
   * table's "Per hired" column prints and what the bar's `bestFor.hired` is read on; the campaign's own is
   * `PlanTotals.damagePerMercenary`.
   */
  hiredDamage: number;
  silver: number;
  /** What the march's hired stacks cost to bring back: the engine prices mercenaries in gold, not silver. */
  gold: number;
  /**
   * The march's dragon coins — `PlanMarch.dragonCoins`, the dominance pool's own price (S-96). The engine
   * always writes it; it is optional only so that a row built by hand to draw the bar with (the UI's own
   * fixtures) need not carry a figure that is nought on every army but a monster camp. Read it as `?? 0`.
   */
  dragonCoins?: number;
  /** What one march of it takes to recover, in seconds — `PlanMarch.seconds`, for the march the stop repeats. */
  seconds: number;
  /**
   * The march's **authority** chunks — `PlanMarch.mercLost` (S-102). Damage a dragon coin for this one march
   * is `damage / (dragonCoins ?? 0)` where the coins are positive, read the way the trade table already
   * reads damage a silver and damage a hired off this struct; the campaign's own is
   * `PlanTotals.damagePerDragonCoin`.
   */
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
   * **The troops-only marches a repeated stop plays once its hired stock is spent** (S-89; owner, 2026-09-18,
   * choosing P1 of `tools/theorycraft/out/105-six-proposals.md`). S-76 made the horizon a *ceiling*: a stop
   * whose stock the horizon outruns plays fewer marches than the horizon has room for, and stopped there.
   * S-81 gave the `all-in` the marches left over — the Elite sizer over every troop type with no mercenary in
   * it — and this is the same offer to every **repeated** stop.
   *
   * It is the same march for every stop of a plan, because it is the same question: the army's own best march
   * with nothing hired in it. So it is carried once, with the number of times it is played, rather than as
   * `marches − played` copies of one counts map — and `counts` above stays the **repeated** march, which is
   * what the bar draws and what `repeat` prices. Absent on a stop that already fills the horizon, on the
   * `all-in` (whose `sequence` carries its own tail), and on any request with no horizon to fill (a budget or
   * a single-march question).
   *
   * The campaign totals above **include** it: `totalDamage`, `silver`, `gold` (nought — a march with no hired
   * stack costs no revive gold), `seconds` and `marches`, and both ratios are computed over them. `mercLost`
   * is not: the tail burns nothing (bear ×1: 4 722 842 → 18 554 768 damage for a burn of 1 either way), so it
   * eases damage a silver. **Nor is `hiredDamage`** (S-105): a troops-only march fields no hired stack, so it
   * adds nothing to what the hired stock dealt and damage a hired unit no longer moves with the tail at all —
   * where until S-105 the tail raised it by every point of damage no mercenary struck for. No stop rule reads
   * any of the three — the bar
   * is ordered on `repeat.mercLost`, the sweet spot's chord on `repeat.damage`, the band and `bestFor` on the
   * plan's own march — which is what lets the tail be added after every one of them has run.
   */
  tail?:
    | {
        /** The troops-only march itself, as counts — the same one for every stop of this plan. */
        counts: Record<string, number>;
        /** How many times it is played: the horizon less the marches the stop's own stock reaches. */
        marches: number;
        damage: number;
        silver: number;
        seconds: number;
      }
    | undefined;
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
  /**
   * The campaign's damage: the sum of its marches' **worst openings** — the repeats, the finale and the
   * troops-only tail, or every march of a `sequence` — each of them `simulateBattle`'s `minDamage` on its own
   * counts (S-94; `marchOf`). `tests/engine/plan-criteria.test.ts` holds it to the unit on every army.
   */
  totalDamage: number;
  /**
   * **What the campaign's hired stacks themselves dealt** (S-105, 2026-09-19): `PlanMarch.hiredDamage` summed
   * over exactly the marches `totalDamage` is summed over — the repeated march as many times as it is fought,
   * plus the finale, or every march of a `sequence`. The **troops-only tail adds nothing**, fielding no hired
   * stack at all, which is the same reason it adds nothing to `mercLost`.
   *
   * It is the numerator of `damagePerMercenary` below, and it is the whole of S-105: a figure that says what
   * the hired stock bought has to be read off the stacks the stock paid for.
   */
  hiredDamage: number;
  silver: number;
  /**
   * What the whole campaign's hired stacks cost to bring back, in gold: the repeated march's own gold taken
   * as many times as it is fought, **plus the finale's** — or, for a plan whose marches differ (`sequence`),
   * the sum over them. The troops-only tail (`tail`) adds nothing, fielding no hired stack at all. Summed
   * exactly the way `silver` and `seconds` are, which is what S-90 fixed on 2026-09-18: the finale was left
   * out here alone. The figure a single march is read by is `repeat.gold`, exactly as silver is.
   */
  gold: number;
  /**
   * The whole campaign's **dragon coins**, summed exactly the way `gold` is (S-96). Nought unless the plan
   * fields a dominance monster: the coins are that pool's own recruiting price, ten monsters at a time.
   */
  dragonCoins: number;
  /**
   * The whole campaign's recovery time, in seconds: the repeated march's own time taken as many times as it
   * is fought, plus the finale's — or, for a plan whose marches differ (`sequence`), the sum over them. The
   * figure a single march is read by is `repeat.seconds`, exactly as silver is.
   */
  seconds: number;
  /**
   * **The campaign's `authority` chunks** — the one rare stock the whole bar is ordered by (S-102). A
   * dominance monster is not in it: it is trained again rather than hired again, so what it costs the player
   * is `silver`, `seconds` and `dragonCoins` above, and `damagePerDragonCoin` below is what those coins
   * bought. The troops-only tail (`tail`) adds nothing here either — it fields no hired stack at all.
   */
  mercLost: number;
  marches: number;
  /** The two criteria, reported side by side: damage bought per silver, and per irreplaceable mercenary. */
  damagePerSilver: number;
  /**
   * **Damage a hired unit is the hired stacks' own damage per hired unit lost** (S-105, 2026-09-19; the
   * owner, on being shown the column twice: *"it says over a million but in total they do less than 1M"*,
   * and *"dmg per hired is still broken: it shows a damage per hired almost above total damage"*).
   *
   * `hiredDamage / mercLost` — the numerator is the part of the campaign's worst opening the **authority**
   * stacks struck for, the denominator the chunks of ten that pool loses for good. Until S-105 the numerator
   * was `totalDamage`, the **whole** campaign's damage, troops and monsters and tail included, so a march
   * whose troops did nearly all the hitting and whose one hunter stack lost a single chunk reported the whole
   * march as the worth of that chunk. Measured on his TotalStack profile the same day: the silver saver's
   * worst opening is **1 000 201**, of which its hired stacks dealt **168 840**, and it loses **1** hired unit
   * — so the column read **1 000 201** where the honest answer is **168 840**; the sweet spot's 2 087 912 /
   * 551 544 over 5 lost read 417 582 against **110 309**.
   *
   * It is one definition and every reader that says "a hired" reads it: `bestFor.hired` and the trade
   * table's "Per hired" (on `repeat.hiredDamage`, the same arithmetic over one march), the reference
   * table's "A mercenary" column and the search's own `mostThrifty`. The **undominated frontier is not**
   * among them, and deliberately: it is ordered on `silver`, `mercLost` and `totalDamage` — three figures,
   * not a ratio.
   *
   * **No rule that keeps or drops a stop reads it any more** (S-106, 2026-09-19). It did — the silver
   * saver's "beaten on both", the sweet spot's efficient rungs and its tie-break, the `more-mercs`
   * tie-break and the S-99 cut's four readings — and S-105 moved five of the sixteen benchmark bars by
   * re-attributing this one column, on armies where not a single march had changed. Those five rules judge
   * on the figures a stop prints instead (`beatsOnFigures`, `earns`): damage, silver, the burn, the coins.
   *
   * `Infinity` when the campaign burns nothing at all, exactly as before.
   */
  damagePerMercenary: number;
  /**
   * **Damage bought per dragon coin** (S-102; the owner, 2026-09-19: *"monsters have a 3-cost: training
   * time, silver and dragon coins. TotalStack computes the total of dragon coins needed for a stack if
   * present and the dmg/dragon coins."*). The third price a dominance monster is paid in, read as the two
   * beside it are: `totalDamage / dragonCoins` over the whole campaign.
   *
   * `Infinity` when the campaign spends no coin at all, exactly as `damagePerSilver` answers `Infinity` for
   * a campaign that spends no silver — a ratio nothing was divided by, which every reader of these three
   * already has to guard. It is what a plan with no monster in it reports, which is every army in this repo
   * but a monster camp, and it is why the UI draws the figure only while the coins are positive (design rule
   * 15: nothing on screen without a value).
   *
   * **Reported, never ranked.** No stop rule, band, ladder or ratio comparison reads it: the search is
   * ordered on damage, silver and `mercLost` (`marchOf`), and this is a price the payload prints so the
   * player can see what the third currency bought him.
   */
  damagePerDragonCoin: number;
}

/**
 * One point of the campaign's own curve: at a given silver spend, the most damage **the bar could offer** for
 * it and the most damage a mercenary it could offer. Bucketed by silver, because that is the axis a player
 * can actually choose — "this is what N silver buys" — and carried so the UI (and a reader) can see the shape
 * rather than three points picked off it.
 *
 * **Over the plans the bar may offer, not over everything the search prices** (S-88; see `curve`). The owner
 * read a 2.91-a-silver row of this table on 2026-09-18 and asked why it was not a stop: it was a
 * one-troop-stack march the band refuses, and no rule could ever have offered it.
 *
 * **And priced as it would be offered** (S-89): every row here is a campaign of the **whole horizon**, the
 * troops-only tail included, because that is what the bar would hand the player if he picked it. The set is
 * the one place the tail is applied to a plan that is not a stop — `trade`, the knee and the two peaks are
 * the search's own figures — and it has to be, or the table would print a one-march campaign and a four-march
 * one side by side and call them two levels of the same ladder.
 */
export interface PlanCurvePoint {
  silver: number;
  /** The most damage a plan the bar may offer spends this much silver for. */
  damage: number;
  /**
   * **That plan's own hired damage** — `PlanTotals.hiredDamage` of the row this bucket kept (S-105). The
   * table's "A mercenary" column is `hiredDamage / mercLost` off this row, the same arithmetic the bar's own
   * "Per hired" is, so the two agree on a plan that appears in both.
   */
  hiredDamage: number;
  /** Damage per silver at that plan. */
  damagePerSilver: number;
  mercLost: number;
  /** The most damage a mercenary a plan the bar may offer spends this much silver for. */
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
 *  - `burn-saver` — the fewest mercenaries burned the band holds (W10, `CampaignInput.burnSaver`), offered
 *    only where it keeps the bar's order: it is left of every other stop, and hits less than all of them;
 *  - `silver-saver` — the cheapest march left of the sweet spot that costs no more silver and is at least as
 *    efficient a silver: on every account measured it is the tight ladder, every troop rung just above the
 *    mercenaries, some of the stock riding with it;
 *  - `sweet-spot` — the knee of damage against burn over the rungs nothing beats on the figures (S-106:
 *    at least the damage, at most the silver, at most the burn);
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
export type PlanPick = 'burn-saver' | 'silver-saver' | 'sweet-spot' | 'more-mercs' | 'steady-max' | 'all-in';

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
   * the search pushed onto `frontier` (`consider`). False for a march the bar offers that the search never
   * summarised — a stop the put-back pass re-sized after it was chosen, or the `all-in`, built march by march
   * outside the frontier. It is identity and not counts: a plan the frontier holds and an offered march that
   * field the same counts are one row here, and it reads `true`.
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
   * The reference table under the bar, bucketed by silver: what that much silver buys, and what it buys per
   * mercenary. The two are the owner's two slopes, and the bucketing is what makes the shape visible.
   *
   * **Over the plans the bar may offer** (S-88, owner 2026-09-18): the band the stops are drawn from
   * (`candidates`), plus the stops themselves, so a march the put-back pass re-sized is in the table the
   * player reads under it. Until then it was bucketed over *every shape the search priced*, and he asked why
   * the 2.91-a-silver row of his own table was not one of his stops — it was a one-troop-stack march the
   * frontier threw away and the band refuses. See `offered` below for the figures the change moved.
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
  /**
   * The type's place in the account's **kill order** (`buildKillOrder`), which is what breaks a tie in total
   * HP: the enemy wipes the highest-HP living stack first and picks by rank when two stacks carry the same
   * HP, exactly as `sizeStacks` and the Battle card's recap order them (S-96).
   */
  rank: number;
  unit: UnitDef;
}

export function effectiveTable(request: StackRequest): Effective[] {
  // The kill order once for the table, not once a stack: it is a property of the army, not of a march.
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
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
      rank: rank.get(unit.id) ?? 0,
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
export function rankTroops(table: Effective[]): Effective[] {
  return table
    .filter((entry) => entry.pool === 'leadership')
    .sort((a, b) => a.damagePerUnit / a.hp - b.damagePerUnit / b.hp);
}

/**
 * **The hired ranking: what a point of a type's own pool buys, and whether that pool is contested at all**
 * (S-99, 2026-09-19; the owner, on being shown that the plan pays a chunk of ten for every type the account
 * holds: *"you can drop when the damage says so"*).
 *
 * The ranking exists to answer one question — *which type would the march give up first?* — so it is built
 * out of what giving a type up actually **frees**: the room it stood in. Two readings, in that order.
 *
 * **1. Is the type's pool contested?** A pool is contested when the stocks its hired types carry ask for more
 * of it than the camp houses — `Σ stock × cost > housing[pool]`, with an uncapped type's stock being the
 * whole pool as the search reads it (`planCampaign`). On the benchmark's monster camp the twelve uncapped
 * monster types ask **10 739** dominance against **900**, 11.9× the housing, while the two capped authority
 * types ask **209** against **2 180**. Leaving a monster out gives the monsters above it room they can use;
 * leaving a mercenary out gives back authority nobody is short of — the hunter is held at its cap of 83, not
 * at what the pool would pay for. So every type of an uncontested pool ranks **above** every type of a
 * contested one, whatever the quotient below says: a type that is costing nobody room is not the type a
 * march gives up first. Without this reading the rate alone puts **Bear V last of fourteen** on that camp
 * (1 781 damage an authority point against Epic Monster Hunter VI's 14 393) and the family would drop the
 * bear before the water elemental, which frees 21 points of a pool with 1 971 to spare.
 *
 * **2. Inside a pool, damage per point of it.** `damagePerUnit / cost` is the exchange rate the pool itself
 * sets — a pool is one shared constraint, so the type that buys the most damage a point is the type to fill
 * it with — and `effectiveTable` computes both halves already.
 *
 * **The rate is per *pool*, so the raw quotient cannot be sorted across pools.** An authority point and a
 * dominance point are not the same thing and no exchange rate between them exists anywhere in the game or in
 * this file. What *is* comparable is each type's **standing inside its own pool**: its rate over the best
 * rate that pool offers, so the first type of every pool stands at 1. That keeps each pool's own order
 * exactly as the rate gives it (dividing a pool by one number does not re-order it) and never asks which of
 * two pools is worth more.
 *
 * **Two rejected readings, and why** (measured on the monster camp, `tools/theorycraft/out/113-monster-
 * economy.md` §D1). *Damage per chunk of ten* — what the stack costs to put back — is the same number for
 * every type (a chunk is ten units whatever the pool), so it ranks on `damagePerUnit` alone and ignores the
 * housing: it puts Ettin (208 320 a unit) above Epic Monster Hunter VI (57 570) and would drop the hunter
 * first, the one stack carrying 3 972 384 of that march's damage. *Damage per unit of HP* is the troop
 * ranking's rule (`rankTroops`) and answers a different question — which type makes the best sponge — not
 * which is worth housing. The two readings above are the ones that reproduce the measurement: the four types
 * they rank last are exactly the four the best sizer sequence never fields.
 */
export function rankHired(request: StackRequest, table: Effective[] = effectiveTable(request)): Effective[] {
  const hired = table.filter((entry) => entry.pool !== 'leadership');
  // The stock the search reads for each type, which is the cap the player entered or — for a type hired with
  // no cap, every dominance monster among them — that type's own whole pool (`planCampaign`, `unlimited`).
  const stockOf = (entry: Effective): number =>
    request.caps[entry.id] ?? Math.floor(request.housing[entry.pool] / Math.max(1, entry.cost));
  const asked = new Map<Pool, number>();
  for (const entry of hired) {
    asked.set(entry.pool, (asked.get(entry.pool) ?? 0) + stockOf(entry) * entry.cost);
  }
  const contested = (entry: Effective): boolean => (asked.get(entry.pool) ?? 0) > request.housing[entry.pool];
  const perPoolPoint = (entry: Effective): number => entry.damagePerUnit / Math.max(1, entry.cost);
  const bestInPool = new Map<Pool, number>();
  for (const entry of hired) {
    const rate = perPoolPoint(entry);
    if (rate > (bestInPool.get(entry.pool) ?? 0)) bestInPool.set(entry.pool, rate);
  }
  // Its standing inside its own pool. A pool whose every type is worth nothing has no best to stand
  // against; its types keep the kill order's own tie-break rather than dividing by zero.
  const standing = (entry: Effective): number => {
    const best = bestInPool.get(entry.pool) ?? 0;
    return best > 0 ? perPoolPoint(entry) / best : 0;
  };
  return [...hired].sort(
    (a, b) =>
      Number(contested(a)) - Number(contested(b)) ||
      standing(b) - standing(a) ||
      perPoolPoint(b) - perPoolPoint(a) ||
      a.rank - b.rank,
  );
}

/**
 * One march, scored through the engine's own journal: the stacks are built from the counts exactly as
 * `simulateBattle` would build them, and the journal gives the damage and the strikes. This is cheaper than a
 * full simulation and just as exact — the round structure, the attack order and the lost strikes all come from
 * `battle.ts`, not from a closed form that assumes the kill order and the attack order agree (they do not,
 * whenever a rung's count makes its base damage larger than the rung above it).
 *
 * ---
 *
 * **The damage of a plan is the enemy-first journal's total — the bad flip, not the midpoint** (S-94; the
 * owner, 2026-09-19: *"average damage is not average for sure; it's too risky for me to spend 3M silver on a
 * coin flip to get 1M damage or 3M. We want reliable damage actually."*).
 *
 * The game decides who opens the fight, 50/50, and the two outcomes are two different battles: a stack at kill
 * position 1 strikes **0** times when the enemy opens and **1** when we do (`battle.ts`, `expectedHits`), so
 * `max − min` is exactly the opening stack's own per-hit damage. Until 2026-09-19 this line scored the
 * **midpoint** of the two journals, which is a figure no single fight ever pays out: half the time the player
 * spends the silver and the stock the bar quoted and is handed less damage than it printed. Measured over the
 * thirteen armies of `tests/engine/plan-criteria.test.ts` (`tools/theorycraft/out/109-reliable-damage.md`
 * §A): the midpoint stood 1.2–4.0 % above the worst opening on most stops, 9.3 % on the owner's live camp's
 * sweet spot and **33 %** on a bear army's `all-in`, whose whole top stack strikes only if we open. That is
 * the coin flip he is refusing, and it is widest exactly where the bar spends the most.
 *
 * So this is **the** definition, and everything the plan says about damage follows from it without a second
 * reading anywhere: `PlanMarch.damage` (`toMarch`), `PlanRepeat.damage` and `PlanTotals.totalDamage`
 * (`summarise`), the two ratios, the burn ladder and its knee, the band, the curve, the put-back and
 * tighter-shape percentages, the `all-in`'s sequence and the troops-only tail are each computed from the
 * figure returned here.
 *
 * **Hard-switched, with no `CampaignInput` option beside it**, on purpose. An `objective: 'reliable' |
 * 'expected'` would have to be threaded through `makeScorer`, the ladder, the sizer shapes, the put-back and
 * the tail to reach this line — every one of which would then have two behaviours to pin, two sets of floors
 * in the criteria and two benchmark columns — to offer a reading the owner has just rejected for himself. The
 * player who wants the other two figures already has them, on the march the bar hands him: the Battle card's
 * recap prints **Worst opening**, the expected damage and the best, and `simulateBattle` is untouched. One
 * definition here, three figures there.
 *
 * The strikes follow the damage for the same reason — they are that journal's own hit count, and a figure
 * printed beside a damage taken from a different battle would describe neither. Building one journal instead
 * of two also halves the work in the hottest loop of the search.
 *
 * **And the hired stacks' own share of that same journal** (`hiredDamage`, S-105, 2026-09-19): the sum of the
 * enemy-first journal's army lines that belong to an **authority** stack, which is the pool `mercLost` beside
 * it counts. It is taken off the journal this function already built — one pass over its entries, no second
 * battle — so the two figures describe one fight, entry for entry, and `hiredDamage ≤ damage` by
 * construction. `PlanTotals.damagePerMercenary` is what divides it by the burn.
 */
function marchOf(
  stacks: { entry: Effective; count: number }[],
  enemyStacks: number,
): {
  damage: number;
  hiredDamage: number;
  silver: number;
  gold: number;
  mercLost: number;
  strikes: number;
  stacks: Stack[];
} {
  const byId = new Map(stacks.map((stack) => [stack.entry.id, stack.entry]));
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
    /**
     * **Highest total HP first, the kill order breaking a tie** (S-96). The enemy picks the biggest living
     * stack, and when two carry the same HP it picks by rank — which is how `sizeStacks` and the Battle
     * card's recap have always ordered them (`buildKillOrder`). This line sorted on the HP alone until
     * S-96, so a tie fell to the order the *shape* happened to assemble its stacks in and the plan read a
     * different battle from the one the recap draws for the same counts. No army in this repo could tie
     * before the plan could field monsters: measured on experiment 110's 20 000-dominance camp
     * (2026-09-19), the sweet spot stands Black Dragon 4 and Crystal Dragon 10 at **3 600 000 HP each**,
     * and the two readings of that one march differ by **3 744 000** damage (188 477 435 against
     * 192 221 435) because a dragon that dies one slot later strikes once more.
     */
    .sort(
      (a, b) => b.totalHp - a.totalHp || (byId.get(a.unitId)?.rank ?? 0) - (byId.get(b.unitId)?.rank ?? 0),
    );
  const enemyFirst = buildJournal(built, enemyStacks, false);
  /**
   * **What the hired stacks themselves dealt, in that same journal** (S-105). The ids of the `authority`
   * stacks — the pool `mercLost` below counts, the one the Temple never brings the tenth unit back to — and
   * the sum of their own army lines. A march fields at most one stack a type (`byId` above is keyed on the
   * id), so the set is the test.
   */
  const hiredIds = new Set(built.filter((stack) => stack.pool === 'authority').map((stack) => stack.unitId));
  let hiredDamage = 0;
  if (hiredIds.size > 0) {
    for (const entry of enemyFirst.entries) {
      if (entry.actor === 'army' && hiredIds.has(entry.unitId)) hiredDamage += entry.damage;
    }
  }
  let silver = 0;
  let gold = 0;
  let mercLost = 0;
  for (const stack of built) {
    const entry = byId.get(stack.unitId);
    if (!entry) continue;
    /**
     * **The bill is read off the pool, and every pool but `leadership` is hired stock** (S-96, 2026-09-19;
     * the owner: *"fix why the monsters are not shielded in the generated stack"*).
     *
     * `retrainOne` already bills a non-leadership stack **by chunks of ten** and folds the units a chunk does
     * not return into `reviveOne`'s gold (`src/engine/recovery.ts`, `byChunk = unit.pool !== 'leadership'`),
     * so one call a stack is the whole price whatever pool it is drawn from: a mercenary has no `training`
     * block at all, so its silver, its queue and its dragon coins are nought and its gold is the revive line
     * this branch has always added; a **dominance monster** has one, so it costs chunk silver, chunk queue,
     * chunk dragon coins *and* the same revive gold.
     *
     * Until S-96 the branch read `pool === 'authority'` and a dominance stack fell into the troop side: it was
     * billed as a per-unit troop retrain, burned **no** stock and cost no gold and no dragon coins — free on
     * the one axis the whole bar is ordered by. The plan never fielded one (experiment 110: on a camp with 20
     * monster types and 20 000 dominance the Battle card's sizers field 17–21 monster stacks and the plan
     * fielded **0 of 20**), so nothing exercised it; widening the hired set without this line first would have
     * let the search field monsters for nothing and ranked the bar on a lie.
     *
     * **`mercLost` counts the `authority` pool alone** (S-102, 2026-09-19; the owner: *"monsters should be
     * there if dominance has been set and damage is interesting; they have a cost in silver but in dragon
     * coins also, which are both constrained; but at least, apart from mercs, they can be trained just like
     * troops."*).
     *
     * S-96 pooled the dominance chunks into this axis, on the reading that "burned" means any rare stock a
     * march does not get back. The owner's sentence says it is not the same stock. A **mercenary** is hired:
     * spend it and it is gone until the player hires another, which is why the bar is ordered by it at all.
     * A **monster** is *trained* — the Army tab recruits it again, ten at a time, for silver, for queue time
     * and for dragon coins (`retrainOne`, `training.dragonCoins`) — so it is a **price**, paid in three
     * currencies, and not a stock that drains. A trained unit on the burn axis made the bar rank a monster
     * camp as though every march took something irreplaceable off the board.
     *
     * So the burn is the authority pool's chunks — the hired soldiers and the **monster mercenaries** (Bear
     * V, Cyclops V), which are revived for gold and never trained — and the dominance pool leaves the axis.
     * It keeps everything else S-96 gave it: it is fielded, it is sheltered under the lowest troop stack
     * (`shelterUnder`), it has to fit its own housing (`fitsHousing`), and its whole recovery bill is billed
     * here and on the payload. The gold stays on the wider condition because `retrainOne` bills it for every
     * non-leadership pool: a monster's chunk does not return its tenth unit either, and the Temple's line for
     * it is the recap's own rule (`src/engine/recovery.ts`).
     *
     * **Dragon coins are not read here, and so never enter the ranking.** Like the revive gold they are a
     * price the payload *prints* — `toMarch` computes them under the account's own recovery settings for
     * `PlanMarch.dragonCoins`, and `PlanTotals.damagePerDragonCoin` reports what they bought — and not a
     * figure any stop rule, ratio, band or burn ladder is ordered by. The search ranks on damage, silver and
     * `mercLost`, exactly as it did before the monsters; what changed in S-102 is only which pool the last of
     * those three counts, and a monster's own three costs now ride entirely in the silver, the queue and the
     * coins.
     */
    const one = retrainOne(entry.unit, stack.count, SEARCH_RECOVERY);
    silver += one.silver;
    if (entry.pool !== 'leadership') {
      gold += one.gold;
      if (entry.pool === 'authority') mercLost += chunks(stack.count);
    }
  }
  return {
    damage: Math.round(enemyFirst.totalDamage),
    hiredDamage: Math.round(hiredDamage),
    silver,
    gold,
    mercLost,
    strikes: enemyFirst.friendlyHits,
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

/** `planCampaign` shadows `ladder` with its own burn ladder, so it reaches the builder by this name. */
const buildLadder = ladder;

/**
 * **The shelter** (S-87, restoring S-75's rule for every hired type; owner, 2026-09-18: *"a critical rule is to
 * shield mercs. Right now mercs are unshielded on all complete optimization marches … more damage with a lot of
 * merc spent should trigger a failing test as we're using too much of a rare resource"*, and earlier the same
 * day: *"when a merc is unlimited and is put in, don't put more, and lower it so the health stack still makes
 * sense — below the troops"*).
 *
 * The enemy wipes the **highest-HP living stack** first (`buildKillOrder`, and the journal `marchOf` runs), so a
 * hired stack whose total HP reaches the lowest troop stack's is the enemy's first kill: the rarest resource on
 * the field, spent before a single troop has died. Every shape the plan offers therefore lowers a hired stack
 * that stands at or above that line to **just under it** — `ceil(floor / hp) − 1`, the most units that still sit
 * strictly below — and a type whose very first unit is not under is left out of that shape (its count becomes
 * nothing, and the callers drop it).
 *
 * Applied to **every** hired type of **every** hired pool, capped or unlimited (S-96 for the pool; the owner,
 * 2026-09-19: *"fix why the monsters are not shielded in the generated stack"*). This function never knew
 * about pools — it takes the rungs and the stacks to lower — and the three callers that hand it their stacks
 * filtered on `pool === 'authority'` until S-96, which is not a narrowing of the rule so much as the whole
 * reason it was never reached with a monster: `mercTypes` held no dominance type either, so the plan fielded
 * none (experiment 110). The filters read `pool !== 'leadership'` now, and the rule reads as it always did:
 * the enemy wipes the highest-HP living stack first, whatever pool paid for it.
 *
 * S-77 had narrowed it to the unlimited ones on the
 * argument that the battle model already prices a sponge on top (the burn is `ceil(n / 10)` wherever the stack
 * stands, so the two ratios judge it like any other march); measured on the owner's live camp of 2026-09-18
 * (`tools/theorycraft/out/106-shelter-live.md`) that reading put 375 legionaries and 403 arbalesters — 4 296 375
 * and 3 675 360 HP — on top of a 274 772-HP troop floor at the sweet spot, and 830 legionaries, 400 arbalesters
 * and 10 bears at the steady max. The owner's rule is about the stock, not about the model's arithmetic, and it
 * costs damage on purpose: it is the trade he asked for.
 */
function shelterUnder(
  rungs: { entry: Effective; count: number }[],
  mercs: { entry: Effective; count: number }[],
): { entry: Effective; count: number }[] {
  if (rungs.length === 0 || mercs.length === 0) return mercs;
  const floor = Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
  if (!Number.isFinite(floor) || floor <= 0) return mercs;
  return mercs.map((merc) =>
    merc.count * merc.entry.hp < floor || merc.entry.hp <= 0
      ? merc
      : { entry: merc.entry, count: Math.max(0, Math.ceil(floor / merc.entry.hp) - 1) },
  );
}

/**
 * **A march the account can actually house** (S-96, 2026-09-19).
 *
 * Every unit standing on the field occupies its pool: a troop the leadership, a mercenary the authority, a
 * monster the dominance. `ladder` has always refused a ladder the **leadership** cannot pay for (`used <=
 * leadership`); this is that same sentence said about the other two pools, which nothing had to say while the
 * plan fielded one or two hired types whose cost is a unit or two apiece.
 *
 * It is the dominance pool that makes it matter. A hired type with no cap is bounded by its own pool
 * (`unlimited`, `stock`), *as if it were the only one there* — which is true of the single unlimited
 * mercenary an account hires and false of a monster camp, where **twelve to twenty** uncapped monster types
 * each read the whole pool. Measured on experiment 110's camps before this check (2026-09-19): on the
 * 900-dominance camp the ladder shapes proposed marches needing **4 693 to 10 739** dominance, five to twelve
 * times the housing the player has, and even at 20 000 the `all-in` asked for 20 632. The sizer's shapes never
 * did — `sizeStacks` fills a pool and stops — so this is the one family that needed telling.
 *
 * Measured on the ten benchmark scenarios the same day: not one stop of not one of them comes within an order
 * of magnitude of its authority pool (the widest is the 2026-09-17 export's `all-in`, 267 of 2 180), so no
 * army that predates the monsters is touched by it.
 */
function fitsHousing(
  housing: Housing,
  rungs: { entry: Effective; count: number }[],
  hired: { entry: Effective; count: number }[],
): boolean {
  let leadership = 0;
  let authority = 0;
  let dominance = 0;
  // Two lists rather than one concatenation: this runs once per shape the search prices, and the array the
  // spread would build is the only allocation in the whole check.
  for (const list of [rungs, hired]) {
    for (const stack of list) {
      if (stack.count <= 0) continue;
      const used = stack.count * stack.entry.cost;
      if (stack.entry.pool === 'leadership') leadership += used;
      else if (stack.entry.pool === 'authority') authority += used;
      else dominance += used;
    }
  }
  return leadership <= housing.leadership && authority <= housing.authority && dominance <= housing.dominance;
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

/**
 * **The largest count a stock of `held` can field on each of `marches` marches** — `lastsMarches` read the
 * other way round, and the bound the search anchors every hired type on (`largestFor` in `planCampaign`,
 * which is this function). `0` when no count lasts that long at all: a stock of two holds nothing that
 * survives three marches, which is the whole of *"no feasible plan for this army"* on a first-run account.
 *
 * Exported for the **re-size** (S-107, 2026-09-19; the owner: *"taking out one group, like SP1, doesn't
 * compute again the mercs and I'm left with a merc stack that's below what could be added with proper
 * shielding"*). A March edit that takes a troop type out makes the stacks that are left grow, which raises
 * the floor, which shelters more hired units than the stop was standing under it — so the cap the re-size
 * is given cannot be the stop's own count. It is this instead: what the stock sustains over the marches the
 * stop plays, so the campaign the plan planned is still affordable and the sizer is free to field the rest.
 */
export function largestSustained(held: number, marches: number): number {
  for (let count = Math.floor(held); count >= 1; count -= 1) {
    if (lastsMarches(held, count) >= marches) return count;
  }
  return 0;
}

/**
 * **How many times a stop's own march is played** — its repeats, the finale and the troops-only tail set
 * aside. `1` for a stop whose marches all differ (the `all-in`, `PlanTotals.sequence`): the march on screen
 * is its first, and the stock it may spend is whatever the account holds.
 */
export function planRepeats(row: Pick<PlanTotals, 'marches' | 'sequence' | 'finaleCounts' | 'tail'>): number {
  if (row.sequence) return 1;
  return Math.max(1, row.marches - (row.finaleCounts ? 1 : 0) - (row.tail?.marches ?? 0));
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
  /** The **hired** types of the account's table: every pool but `leadership` (S-96). */
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
        /** Over a prefix of the troop ranking (S-93, S-97) — the strongest `prefix` types. All of them when left out. */
        prefix?: number,
      ) => { rungs: { entry: Effective; count: number }[]; mercs: { entry: Effective; count: number }[] })
    | undefined;
  /** The troop stacks scored at `WINNER_RUNGS_DEPTH`: the search's winner, once there is one. */
  winnerRungs?: (() => { entry: Effective; count: number }[]) | undefined;
  /**
   * The housing every shape has to fit inside (`fitsHousing`, S-96). Left out, only the leadership is checked
   * — which is what `ladder` does on its own and all that was ever needed before the plan could field a pool
   * carrying a dozen uncapped types. `shapeScorer` and `planCampaign` both pass the request's own.
   */
  housing?: Housing | undefined;
  /**
   * How many marches each type's stock sustains: the stock itself, or `Infinity` for a hired type held as
   * **unlimited** (no cap entered), whose count `stock` bounds by that type's **own pool** — authority for a
   * mercenary, dominance for a monster (S-96) — and whose stock never runs out. Defaults to `stock`.
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
  /**
   * For a sizer shape (`SIZER_DEPTHS`), the **prefix of the troop ranking** it is sized over — the strongest
   * `prefix` types the leadership pays for, which is the family the owner builds by hand ("Troops first",
   * then the low tiers put back). Left out, the sizer is asked for every troop type, as it always was.
   */
  prefix?: number,
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
        // The finale shelters like every other march (S-87): the ladder is built above the leftovers, but a
        // rung is a whole number of units — `floor(target / hp)` — so a heavy troop type can land a hair under
        // the stack it was meant to clear, and the leftovers are lowered under whatever the ladder came out at.
        const under = shelterUnder(finaleLadder, leftovers).filter((merc) => merc.count > 0);
        if (under.length === 0) continue;
        if (context.housing && !fitsHousing(context.housing, finaleLadder, under)) continue;
        const attempt = marchOf([...finaleLadder, ...under], enemyStacks);
        if (attempt.silver > finaleBudget) continue;
        if (!finale || attempt.damage > finale.march.damage) {
          finale = { rungs: finaleLadder, mercs: under, march: attempt };
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

  return (marches, counts, depth, scale, silverBudget, prefix) => {
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
      const sized = context.sizer(fielded, sizerMethod, prefix);
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
    /**
     * **The shelter, on every shape this scorer answers with** (S-87, `shelterUnder`): the ladders, whose rungs
     * are whole units and can round under the stack they were sized to clear; the **winner's rungs**
     * (`WINNER_RUNGS_DEPTH`), which are one march's troops carrying another march's mercenaries and were never
     * checked against them at all — measured on the owner's live camp, the steady max stood 830 legionaries,
     * 400 arbalesters and 10 bears over a 274 772-HP floor; and the sizer's shapes, which `sizer` has already
     * lowered, so this is a second reading of the same rule rather than a second rule.
     *
     * A hired stack is lowered here rather than the ladder raised: the ladder is what the march *costs*, and
     * buying troops to stand over a hired stack is the opposite of the trade the owner asked for. The counts the
     * caller passed are its request; `mercs` below is what the shape fields.
     */
    vector = shelterUnder(rungs, vector);
    fielded = vector.filter((merc) => merc.count > 0);
    if (fielded.length === 0) return null;
    // And it has to fit in the army's own housing (S-96, `fitsHousing`): a shape asking for more dominance
    // than the camp holds is not a march the player can send, whatever it hits for.
    if (context.housing && !fitsHousing(context.housing, rungs, fielded)) return null;
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
// ---- One march, re-sized in place (S-104) ---------------------------------------------------------------

/**
 * **What one march costs the account, under its own recovery settings** — `recoveryCosts` on the counts the
 * march fields, read at the plan the player picked, so the four prices below *are* the recap's (S-90, S-91,
 * S-96 for the pool, and 2026-09-21 for the plan).
 *
 * It says something different about each pool because `retrainOne` and `reviveOne` under it do: a **troop**
 * retrained costs per-unit silver and per-unit queue and no gold; a **monster** is recruited ten at a time,
 * so it costs chunk silver, chunk queue and chunk **dragon coins**; a **mercenary** cannot be recruited at
 * all, so it costs the Temple's gold whatever the plan says (owner, 2026-09-21). Revived instead of
 * retrained, a stack's silver becomes gold, which is the whole point of the plan and what the bar could not
 * say until this line read it.
 *
 * It called `retrainOne` per stack until then — the **retrain** bill, on every account, whatever plan was
 * chosen — so a player who revives his monsters read a silver figure he was not going to spend and a gold
 * figure of nought beside a recap that said otherwise. The arithmetic is unchanged to the coin for a retrain
 * plan (`recoveryCosts` sums exactly those calls for it), which is every account this repo measures.
 *
 * Module-level since S-104, so the re-size below prices a march exactly as `planCampaign` prices one: it
 * was that search's own closure over `request.recovery`, and two copies of a price list is how a bar and a
 * recap come to disagree.
 */
function priceMarch(
  recovery: RecoverySettings,
  rungs: { entry: Effective; count: number }[],
  mercs: { entry: Effective; count: number }[],
  totals: ReturnType<typeof marchOf>,
): PlanMarch {
  const counts: Record<string, number> = {};
  for (const rung of rungs) counts[rung.entry.id] = rung.count;
  const mercFielded: Record<string, number> = {};
  for (const merc of mercs) {
    if (merc.count > 0) {
      counts[merc.entry.id] = merc.count;
      mercFielded[merc.entry.id] = merc.count;
    }
  }
  const fielded = [...rungs, ...mercs].filter((stack) => stack.count > 0);
  // `recoveryCosts` reads a stack's id and its count and nothing else of it; the rest of `Stack` is the
  // battle's business and no part of a bill (`engine/recovery.ts`).
  const bill = recoveryCosts(
    fielded.map((stack) => ({ unitId: stack.entry.unit.id, count: stack.count }) as Stack),
    fielded.map((stack) => stack.entry.unit),
    recovery,
  ).plan;
  const { silver, seconds, gold, dragonCoins } = bill;
  return {
    counts,
    damage: Math.round(totals.damage),
    // The hired stacks' own share of that same opening, straight off the journal `marchOf` ran (S-105): it
    // is a damage and not a price, so it is carried through rather than re-derived from this bill.
    hiredDamage: Math.round(totals.hiredDamage),
    silver: Math.round(silver),
    gold: Math.round(gold),
    dragonCoins: Math.round(dragonCoins),
    // Rounded once, on the sum, the way `recoveryCosts` rounds its own — rounding each rung first would
    // drift by a second a stack against the recap the March draws.
    seconds: Math.round(seconds),
    mercFielded,
    mercLost: totals.mercLost,
    strikes: Math.round(totals.strikes),
    stacks: rungs.length + mercs.filter((merc) => merc.count > 0).length,
  };
}

/**
 * **The sizer's own shape for one set of hired counts**: the stacks `sizeStacks` fields under `method` with
 * those counts as its caps, and every hired stack lowered under the lowest troop stack.
 *
 * `troopIds` is the set of troop types it may field. Left out, every type the account holds — which is all
 * the search ever asked for until S-93 gave it a **prefix** of the troop ranking, and all the March pane
 * ever asked for until S-104 gave it the stop's own types plus the one being put back.
 *
 * The shelter: a hired stack under the lowest troop stack, or the enemy — which wipes the highest-HP living
 * stack first — takes it before the troops have died. A stack the sizer sized over that line is lowered to
 * just under it (`shelterUnder`); one whose first unit is already over is left out of this shape.
 *
 * **Every hired type, capped or not** (S-87, restoring S-75's rule; owner, 2026-09-18: *"a critical rule is
 * to shield mercs. Right now mercs are unshielded on all complete optimization marches … more damage with a
 * lot of merc spent should trigger a failing test as we're using too much of a rare resource"*). S-77 had
 * narrowed this to the **unlimited** types, reading his earlier sentence — *"when a merc is unlimited and is
 * put in, don't put more, and lower it so the health stack still makes sense — below the troops"* — as being
 * only about the one case where nothing else bounds a stack, and on the argument that the battle model
 * prices a sponge already (`marchOf` runs the journal, and the burn is `ceil(n / 10)` wherever the stack
 * stands). It buys damage: on his export at 7 000 the unsheltered MS-relaxed march stands **34 legionaries
 * on top** as the enemy's first kill — every other stack one kill slot later, the arbalesters striking three
 * times instead of two — for **6 242 452** a march against **5 864 482** sheltered
 * (`tools/theorycraft/out/101-shelter-cost-and-ten-bears.md` §A). And it is not the rule he asked for: on
 * his live camp of 2026-09-18 every stop fielded hired stacks above the troops — 375 legionaries and 403
 * arbalesters over a 274 772-HP floor at the sweet spot, 830 · 400 · 10 bears at the steady max
 * (`tools/theorycraft/out/106-shelter-live.md`) — because a capped type is just as rare as an unlimited one
 * once it is gone. The damage is the price of the shelter, and the shelter is the instruction.
 *
 * **Every pool but `leadership`** (S-96): the rule is about what the enemy kills first, which knows nothing
 * about pools, and a dominance monster is the rarest stock on the field of all.
 */
function sizedShape(
  request: StackRequest,
  byId: Map<string, Effective>,
  mercs: { entry: Effective; count: number }[],
  method: SizerMethod,
  troopIds?: ReadonlySet<string>,
): { rungs: { entry: Effective; count: number }[]; mercs: { entry: Effective; count: number }[] } {
  const caps: Record<string, number> = { ...request.caps };
  const fieldedIds = new Set<string>();
  for (const merc of mercs) {
    caps[merc.entry.id] = merc.count;
    if (merc.count > 0) fieldedIds.add(merc.entry.id);
  }
  const sized = sizeStacks({
    ...request,
    caps,
    units: request.units.filter((unit) =>
      unit.pool === 'leadership' ? (troopIds?.has(unit.id) ?? true) : fieldedIds.has(unit.id),
    ),
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
  const sheltered = shelterUnder(
    rungs,
    stacks.filter((stack) => stack.entry.pool !== 'leadership'),
  ).filter((stack) => stack.count > 0);
  return { rungs, mercs: sheltered };
}

/** The troop types a re-sized march must field, and the hired counts it may spend. */
export interface MarchWithin {
  /**
   * The troop types to field: the selected stop's own, **plus** the one being put back, or **less** the one
   * being taken out. Every one of them has to be in the answer — that is the owner's *"without putting out
   * another"* — and one that cannot be fielded at all is named in `ResizedMarch.unfielded` rather than
   * quietly dropped.
   */
  troopIds: readonly string[];
  /**
   * **A cap per hired type**, by unit id: what the re-size may field of each, and never what it must. The
   * engine holds no opinion about where they come from — it fields at most what it is given — and the caller
   * reads them off the two kinds of hired stock (`src/ui/sections/march/generate.ts`):
   *
   *  - an **authority** type is capped at what the account can spend on **every march the stop plays**
   *    (S-107, 2026-09-19) — `largestSustained(stock, repeats)`, or the whole authority pool for a type
   *    hired with no cap — and **not** at the stop's own count. It was the stop's count until then (S-80's
   *    reason: a count that can only fall keeps the rest of the plan affordable), and that made the owner's
   *    own edit a no-op: *"taking out one group, like SP1, doesn't compute again the mercs and I'm left with
   *    a merc stack that's below what could be added with proper shielding"*. Taking a troop type out hands
   *    its leadership to the stacks that are left, which raises the troop floor, which shelters **more**
   *    hired units than the stop was standing under it — and a ceiling at the stop's count threw all of them
   *    away. The sustain bound keeps what S-80 was protecting (the campaign is still affordable at the count
   *    the re-size fields, `lastsMarches` being monotone) while the **floor** decides the rest: the sizer
   *    fields what it can and `shelterUnder` lowers it under the lowest rung, so a put-back that lowers the
   *    floor still re-derives downward exactly as it did.
   *  - a **dominance** type is capped at **its own pool** — `housing.dominance / cost`, exactly as
   *    `planCampaign`'s `unlimited`/`stock` bounds it — because a monster is *trained*, not spent (S-102;
   *    the owner, 2026-09-19: *"apart from mercs, they can be trained just like troops"*, and *"monster or
   *    any other troop put back"*). There is no stock of monsters to ration over the horizon
   *    (`sustain` is `Infinity` for them), so a stop that fields none of a monster the player owns is not a
   *    decision about scarcity, and putting one back has to be able to field it. Its three prices — silver,
   *    queue and dragon coins — are billed on the answer like any other stack's.
   */
  hired: Record<string, number>;
  /**
   * **The counts of the march the player is looking at** — the selected stop's own (S-117). Left out, the
   * re-size answers from the shapes it builds alone, which is what it did until then and is the defect:
   * nothing in the family it searches is *"this march, with that one type taken out or put in, and nothing
   * else touched"*, and the family is a strict subset of the one `planCampaign` walked to build the stop
   * (mercenary vectors × depths × growths × a learned rung order). So a press could only move the player to
   * a **different** march, and on three of the fourteen stops measured it moved them to a worse one: a press
   * that changes no type at all — a put-back whose type cannot be fielded — answered at **85.3 %** of the
   * damage for 101 % of the silver on the owner's live account, and at 5 143 823 for 2 498 200 against
   * 5 763 382 for 2 449 200 on the dominance account of investigation 0024
   * (`tools/theorycraft/out/124-what-the-edit-answers-with.md` §A).
   *
   * Given here, the stop's own march joins the candidates: its troop counts with the edit applied — the
   * taken-out type dropped, the put-back type sized into the leadership the stop left unused — and its hired
   * counts re-sheltered under whatever floor that leaves. It is then ranked by `beats` like every other
   * shape and **nothing about the ranking changes**: in all four cases where the answer was worse than the
   * march it replaced, the untouched march has more damage, so damage-first picks it the moment it is on the
   * table. Where the freed leadership genuinely buys damage — 196.8 % of it on the export's silver saver —
   * the re-sized march still wins, exactly as it should.
   */
  stop?: Record<string, number>;
  /**
   * **Shares of the leadership pool to size the same shapes at**, as percentages, biggest first (S-117). Left
   * out, the re-size fills the pool, which is what every march the app has ever offered does.
   *
   * A lower fill is taken **only when it dominates** the full-pool answer — at least its damage, no more
   * silver, no more hired burnt — so this can add damage or take away cost and can never trade one for the
   * other. Experiment 119 measured the same dial on a stop **as generated** and found 0 dominations in 120
   * marches, which is why S-115 was retired and why there is no control for this on screen. After an **edit**
   * the answer differs: the type set is not the stop's, the troop floor has moved and the kill order with it,
   * and 363 marches gave **14** dominations — +2.2 % damage for −4 % silver at identical burn on the
   * 2026-09-17 export at 96 % of the pool, and the same damage at 90 % as at 100 % on 0024's steady max,
   * where the last tenth of the leadership buys nothing and costs 207 600 silver and 41 070 seconds of queue.
   */
  fills?: readonly number[];
  /**
   * **The player's own exchange rates between damage, silver and the training queue** (S-117 change 3,
   * `CAMPAIGN.putBack`). Left out, a smaller pool is taken only where it **dominates** — and that is the
   * whole of the dial.
   *
   * Given, the dial may also take a fill that merely **trades**: the same rule `putBackOn` applies to a
   * stop at Generate time, said about a leadership fill instead of about a troop type put back.
   *
   * ```
   * score = (silver saved %) / silverPerDamage + (queue saved %) / timePerDamage + (damage change %)
   * taken when it recovers faster, scores ≥ 0, and loses at most damageLossCap of the damage
   * ```
   *
   * A trade is only ever looked at when **nothing dominates** — a march that is better on every count is
   * never given up for one that is worse on damage, whatever it saves. And because a trade spends damage
   * the player did not ask to spend on that press, the answer carries what it cost (`ResizedMarch.traded`)
   * and the pane says it in the one line a March edit writes. Measured on the four armies of experiment
   * 124: 25 of 363 fills pass, worth up to **−2.8 % of the damage for −23.4 % of the silver**.
   */
  putBack?: PutBackPolicy;
  /** How much room the lowest rung leaves above the biggest hired stack; the plan's own by default. */
  gap?: number;
}

/** A march the March pane can draw, with how it was built and what it could not field. */
export interface ResizedMarch extends PlanMarch {
  /**
   * The sizer under one of its three methods, the tight ladder over the same types, or `stop` — the march
   * the player was looking at, with the edit applied and nothing else touched (S-117, `MarchWithin.stop`).
   */
  shape: SizerMethod | 'ladder' | 'stop';
  /**
   * **The share of the leadership pool this march was sized against**, as a percentage; `100` unless the
   * dial found a smaller pool that dominates (S-117, `MarchWithin.fills`). The pane says it in the one line
   * a March edit writes, because a march that leaves leadership unspent is a thing the player can see on the
   * pool bar and would otherwise have to explain to themselves.
   */
  fill: number;
  /**
   * **What a fill below 100 cost, where it was a trade rather than a win** (S-117 change 3): the change in
   * damage, silver and queue against the full-pool answer, in percent, damage signed as a change and the
   * other two as **savings** — the reading `putBackOn` already uses. Absent on every other answer, which is
   * the ordinary case: a dominating fill gives up nothing, so there is nothing to say about it beyond the
   * fill itself.
   *
   * It exists so the pane can state the trade rather than perform it silently. A win needs no disclosure; a
   * trade made on the player's behalf does.
   */
  traded?: { damage: number; silver: number; seconds: number };
  /** Troop types `MarchWithin.troopIds` asked for that no shape could field; empty when every one is in. */
  unfielded: string[];
}

/**
 * **Putting a type back re-sizes the selected stop inside the plan's rules** (S-104, 2026-09-19).
 *
 * The owner, for the third time that day: *"Adding back troops doesn't shield the mercs"* — and what he
 * means by it, in his own words: *"I'm able to put it back in and the plan then computes safely the best
 * course of action with the new parameters in mind (the spot selected, monster or any other troop put back)
 * without putting out another, because then we're manually fixing the reco without clicking Generate."*
 *
 * **What was wrong.** A put-back pill ran the plain sizer on the snapshot's request filtered to the types
 * that are in (`MarchPills` → `formation.ts` → `generate.ts`), through the worker's `stack` job. That is
 * `sizeStacks` and nothing else: it knows the request's full mercenary caps and it does not know the
 * shelter, which lives here, inside `planCampaign` (`shelterUnder`, S-87). So a stop the plan had sheltered
 * came back as an unsheltered sizer march with the mercenaries standing on top — the enemy's first kill,
 * the rarest stock on the field spent before a troop has died — and the plan's own rules left the screen
 * the moment the player touched a pill.
 *
 * **The rule this answers with.** Given the types to field and the stop's hired counts, the best march over
 * **exactly** those troop types:
 *
 *  - the sizer under each of its three methods (`SIZER_DEPTHS`) with those hired counts as caps, sheltered
 *    (`sizedShape`) — S-93's own machinery, the family a player builds by hand;
 *  - the tight ladder over the same types, at each of the `LADDER_GROWTHS`, with the hired stacks sheltered
 *    under it — the shape the search reaches for when the sizer spends too much silver;
 *  - priced by `priceMarch` on the **worst opening** (S-94, `marchOf`), which is the figure the bar prints
 *    and the recap draws;
 *  - and the best of them by damage, a tie going to the cheaper march and then to the shorter queue.
 *
 * Three promises hold over every shape it answers with, and the tests read them back off the answer
 * (`tests/engine/plan-resize.test.ts`): every hired and dominance stack stands **strictly under** the lowest
 * troop stack; no hired count is above the stop's; and every troop type asked for is fielded, or named.
 * What it does **not** do is plan again — the campaign, its horizon, its finale and the rest of the bar are
 * the plan's, untouched: this is one stop's march, re-sized in place, *"without clicking Generate"*.
 */
export function resizeMarchOver(request: StackRequest, within: MarchWithin): ResizedMarch | null {
  const table = effectiveTable(request);
  const troops = rankTroops(table);
  const byId = new Map(table.map((entry) => [entry.id, entry]));
  const enemyStacks = enemySquadCount(request.enemy);
  const gap = within.gap ?? DEFAULT_GAP;
  const wantedIds = new Set(within.troopIds);
  // In the ranking's own order, which is the order `ladder` hands out its rungs in.
  const wanted = troops.filter((entry) => wantedIds.has(entry.id));
  if (wanted.length === 0) return null;
  /**
   * **The hired stock is capped at the stop's; the troops are not capped at all** (the note in
   * `src/ui/sections/march/generate.ts`, 2026-09-15: capping the troop types at the plan's own counts left
   * a left-out stack's leadership *unused*, so leaving a type out changed nothing — the owner's *"before,
   * when I left out a troop, it would equilibrate again the troops and mercs"*). The troops are rationed by
   * leadership, which the sizer already respects; the caller's request may carry a stop's counts as caps
   * (the plan bar writes them there so the recap can draw that stop), so they are dropped here and the
   * hired caps below are the only ones the sizer sees.
   */
  const caps: Record<string, number> = {};
  const asked: { entry: Effective; count: number }[] = [];
  for (const entry of table) {
    if (entry.pool === 'leadership') continue;
    const count = Math.max(0, Math.floor(within.hired[entry.id] ?? 0));
    caps[entry.id] = count;
    if (count > 0) asked.push({ entry, count });
  }
  const sizing: StackRequest = { ...request, caps };

  type Shape = {
    rungs: { entry: Effective; count: number }[];
    mercs: { entry: Effective; count: number }[];
    shape: SizerMethod | 'ladder' | 'stop';
  };

  /**
   * **The shapes this family builds at one fill of the leadership pool** — the sizer under each of its three
   * methods, and the tight ladder at each of the `LADDER_GROWTHS`. The fill is passed rather than read off
   * `request` so the dial (S-117) can ask for the same shapes at a smaller pool without rebuilding anything
   * else: `sizeStacks` rations the troops by the leadership it is given, and `ladder` refuses a ladder that
   * pool cannot pay for.
   */
  const shapesAt = (leadership: number): Shape[] => {
    const housed: StackRequest = { ...sizing, housing: { ...sizing.housing, leadership } };
    const out: Shape[] = [];
    for (const method of Object.values(SIZER_DEPTHS)) {
      out.push({ ...sizedShape(housed, byId, asked, method, wantedIds), shape: method });
    }
    if (asked.length > 0) {
      // The ladder is built above the biggest hired stack as it is asked for, then the hired stacks are
      // lowered under whatever the rungs came out at: a rung is a whole number of units, so a heavy troop
      // type can land a hair under the stack it was meant to clear (the same second reading `finaleFor`
      // makes of its own ladders).
      const hiredHp = Math.max(...asked.map((merc) => merc.count * merc.entry.hp));
      for (const scale of LADDER_GROWTHS) {
        const rungs = ladder(troops, wanted.length, hiredHp, gap, leadership, scale, wanted);
        if (rungs.length === 0) continue;
        out.push({
          rungs,
          mercs: shelterUnder(rungs, asked).filter((merc) => merc.count > 0),
          shape: 'ladder',
        });
      }
    }
    return out;
  };

  /**
   * **The march the player is looking at, with the edit applied and nothing else touched** (S-117,
   * `MarchWithin.stop`). Its troop counts are the stop's own — the taken-out type is simply absent from
   * `wanted`, and a put-back type the stop fields none of is sized into the leadership the stop left unused,
   * which is the most it can hold without moving another stack. Its hired counts are the stop's, lowered
   * under whatever floor that leaves (`shelterUnder` lowers and never raises), because the stop's own
   * shelter was computed against a floor the edit has moved.
   */
  const stopShape = (): Shape | null => {
    const counts = within.stop;
    if (counts === undefined) return null;
    const rungs: { entry: Effective; count: number }[] = [];
    let used = 0;
    for (const entry of wanted) {
      const held = Math.max(0, Math.floor(counts[entry.id] ?? 0));
      if (held > 0) rungs.push({ entry, count: held });
      used += held * entry.cost;
    }
    if (rungs.length === 0) return null;
    // The put-back: whatever the leadership the stop did not spend can pay for, at most.
    const room = Math.max(0, request.housing.leadership - used);
    for (const entry of wanted) {
      if ((counts[entry.id] ?? 0) > 0) continue;
      const fits = Math.floor(room / Math.max(1, entry.cost));
      if (fits > 0) rungs.push({ entry, count: fits });
      break;
    }
    const hired = asked
      .map((merc) => ({
        entry: merc.entry,
        count: Math.min(merc.count, Math.max(0, Math.floor(counts[merc.entry.id] ?? 0))),
      }))
      .filter((merc) => merc.count > 0);
    return { rungs, mercs: shelterUnder(rungs, hired).filter((merc) => merc.count > 0), shape: 'stop' };
  };

  /** Best by damage; a tie goes to the cheaper march, and then to the one back in the barracks sooner. */
  const beats = (candidate: ResizedMarch, held: ResizedMarch): boolean => {
    if (candidate.unfielded.length !== held.unfielded.length)
      return candidate.unfielded.length < held.unfielded.length;
    if (candidate.damage !== held.damage) return candidate.damage > held.damage;
    if (candidate.silver !== held.silver) return candidate.silver < held.silver;
    return candidate.seconds < held.seconds;
  };

  /** One shape priced, or `null` where it is not a march this camp can field. */
  const priceShape = (shape: Shape, leadership: number, fill: number): ResizedMarch | null => {
    const rungs = shape.rungs.filter((rung) => rung.count > 0);
    const mercs = shape.mercs.filter((merc) => merc.count > 0);
    if (rungs.length === 0) return null;
    // A march the camp can house (S-96, `fitsHousing`): an uncapped hired type reads the whole of its own
    // pool, and a dozen of them read it a dozen times over. The leadership checked is the fill's, so a
    // dialled-down march has to fit the pool it was sized against and not the one the account holds.
    if (!fitsHousing({ ...request.housing, leadership }, rungs, mercs)) return null;
    // The shelter, read back off the march that will be drawn (S-87). `shelterUnder` has already lowered
    // every hired stack under the lowest rung, so this refuses only one it could not: a type whose very
    // first unit already stands over the troop line.
    const floor = Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
    const hiredTop = Math.max(0, ...mercs.map((merc) => merc.count * merc.entry.hp));
    if (mercs.length > 0 && floor <= hiredTop) return null;
    const march = priceMarch(request.recovery, rungs, mercs, marchOf([...rungs, ...mercs], enemyStacks));
    return {
      ...march,
      shape: shape.shape,
      fill,
      unfielded: wanted.filter((entry) => (march.counts[entry.id] ?? 0) <= 0).map((entry) => entry.id),
    };
  };

  /** The best march of one fill, the stop's own shape thrown in at the full pool. */
  const bestAt = (fill: number): ResizedMarch | null => {
    const leadership =
      fill === 100 ? request.housing.leadership : Math.floor((request.housing.leadership * fill) / 100);
    const shapes: Shape[] = shapesAt(leadership);
    if (fill === 100) {
      const own = stopShape();
      if (own !== null) shapes.push(own);
    }
    let best: ResizedMarch | null = null;
    for (const shape of shapes) {
      const candidate = priceShape(shape, leadership, fill);
      if (candidate === null) continue;
      if (best === null || beats(candidate, best)) best = candidate;
    }
    return best;
  };

  const full = bestAt(100);
  if (full === null || within.fills === undefined) return full;

  /**
   * **The dial** (S-117): the same shapes at a smaller pool, in two rounds that never mix.
   *
   * **A win first.** A fill dominates when it deals at least the full pool's damage for no more silver, no
   * more hired burnt and no more types left unfielded, and is strictly better on one of them. Among several,
   * the ordinary `beats` picks, so the biggest pool that dominates wins a tie and the answer stays as close
   * to the march the player knows as the wins allow.
   *
   * **A trade only if no win** (change 3, `MarchWithin.putBack`). A fill that gives up damage is looked at
   * only when nothing dominates, and only against the player's own rates: a march better on every count is
   * never given up for one that is worse on damage, whatever it saves.
   */
  const dominates = (candidate: ResizedMarch): boolean =>
    candidate.unfielded.length <= full.unfielded.length &&
    candidate.damage >= full.damage &&
    candidate.silver <= full.silver &&
    candidate.mercLost <= full.mercLost &&
    (candidate.damage > full.damage || candidate.silver < full.silver || candidate.mercLost < full.mercLost);

  let best = full;
  /** The fills that gave up damage, kept aside in case no fill wins outright. */
  const traded: ResizedMarch[] = [];
  for (const fill of within.fills) {
    if (fill >= 100 || fill <= 0) continue;
    const candidate = bestAt(fill);
    if (candidate === null) continue;
    if (dominates(candidate)) {
      if (best === full || beats(candidate, best)) best = candidate;
      continue;
    }
    traded.push(candidate);
  }
  if (best !== full || within.putBack === undefined) return best;

  /**
   * **The trade, at the player's own rates** (S-117 change 3; the owner, 2026-09-21, having read what the
   * dial leaves on the table: *"do change 3 too"*).
   *
   * The same arithmetic `putBackOn` applies to a stop at Generate time — `CAMPAIGN.putBack`, calibrated on
   * his own two anchors (*"2 % damage is okay if there's a reduction in time and a bit of silver; 3 % for a
   * lot of silver and training time"*) — said here about a leadership fill instead of a troop type put back.
   * A trade has to **recover faster** as well as score, because the queue is what the rates were written
   * for and a march that sits longer in the barracks is not one of these however much silver it saves; and
   * it may never burn more of the hired stock or leave a type unfielded that the full pool fielded, which
   * are not damage and are not on the scale.
   *
   * Ties go to the higher score and then to the higher damage, so the cheapest reading of a trade never
   * wins over an equally-scored kinder one.
   */
  const policy = within.putBack;
  const saved = (before: number, after: number): number =>
    before > 0 ? ((before - after) / before) * 100 : 0;
  let taken: { march: ResizedMarch; score: number } | null = null;
  for (const candidate of traded) {
    if (candidate.unfielded.length > full.unfielded.length) continue;
    if (candidate.mercLost > full.mercLost) continue;
    if (candidate.seconds >= full.seconds) continue;
    const damage = -saved(full.damage, candidate.damage);
    if (-damage > policy.damageLossCap) continue;
    const silver = saved(full.silver, candidate.silver);
    const seconds = saved(full.seconds, candidate.seconds);
    const score = silver / policy.silverPerDamage + seconds / policy.timePerDamage + damage;
    if (score < 0) continue;
    if (
      taken !== null &&
      (score < taken.score || (score === taken.score && candidate.damage <= taken.march.damage))
    )
      continue;
    taken = { march: { ...candidate, traded: { damage, silver, seconds } }, score };
  }
  return taken?.march ?? best;
}

/**
 * **The shelter, applied to a march's counts** (S-87, and S-104 for the caller).
 *
 * Every hired stack — every pool but `leadership` — lowered to just under the lowest troop stack, and one
 * whose first unit is already over is lowered to nothing. It is the same rule `shelterUnder` states for a
 * shape, said about the counts a march is drawn from, so that the one path that does not go through the
 * plan can obey it too: a March edit on a **sizer** run (Elite, Military Science) re-sizes through
 * `sizeStacks`, which has never known about the shelter, and the owner's rule is about every stack the app
 * generates rather than about the plan alone. `sizeStacks` itself is untouched — it answers TotalStack's
 * own question, and its parity with TotalStack is a separate promise.
 */
export function shelterCounts(request: StackRequest, counts: Record<string, number>): Record<string, number> {
  const fielded = effectiveTable(request)
    .filter((entry) => (counts[entry.id] ?? 0) > 0)
    .map((entry) => ({ entry, count: counts[entry.id] ?? 0 }));
  const rungs = fielded.filter((stack) => stack.entry.pool === 'leadership');
  const hired = fielded.filter((stack) => stack.entry.pool !== 'leadership');
  if (rungs.length === 0 || hired.length === 0) return { ...counts };
  const out: Record<string, number> = { ...counts };
  for (const stack of shelterUnder(rungs, hired)) out[stack.entry.id] = stack.count;
  return out;
}

export function shapeScorer(request: StackRequest, gap: number = DEFAULT_GAP, finale = true): ShapeScorer {
  const table = effectiveTable(request);
  return makeScorer({
    troops: rankTroops(table),
    // Every non-leadership pool is hired stock (S-96): the authority pool's mercenaries and the dominance
    // pool's monsters alike. See `planCampaign`'s own `mercTypes` for the owner's sentence.
    mercTypes: table.filter((entry) => entry.pool !== 'leadership'),
    stock: request.caps,
    leadership: request.housing.leadership,
    housing: request.housing,
    enemyStacks: enemySquadCount(request.enemy),
    gap,
    finale,
  });
}

/**
 * **The plan for an army that hires nothing** (S-111; owner, 2026-09-20: *"build the troops only
 * frontier"*, after experiment 115 measured that the Tier ladder march is not this army's best play).
 *
 * `planCampaign` below refuses an army with no hired stock, and for a reason as far as it goes: its whole
 * search spreads a stock over marches, and there is no stock here. But refusing answers the wrong question.
 * With nothing draining, every march is **identical and repeatable** — the campaign is one march times the
 * horizon — and the question that is left, *which march*, still has two dozen answers on a frontier.
 *
 * **What is traded.** Damage against the two things a troop march really costs: the **silver** that retrains
 * what died, and the **training queue** it sits in (the recap's *time to recover*, the owner's speedups).
 * There is no third axis here — `mercLost` is 0 on every row and a march that spends no dominance spends no
 * dragon coin — which is why these stops are ordered on silver where the hired bar is ordered on burn.
 *
 * **The family searched, and why it is this one** (experiment 116, `out/116-troops-only-frontier.md`, five
 * armies from the first-run ten types to a 24-type G1–G6 account):
 *
 * - **tier windows** — every type whose tier is in `[lo, hi]`, O(T²) of them. On all three armies small
 *   enough to enumerate every one of the 1 023 subsets against, this family contains the **true optimum**,
 *   at 6 shapes priced instead of 1 023.
 * - **greedy backward elimination** — from the whole army, drop the type whose removal costs the least
 *   damage, and again, keeping every march on the way. Also 100 % of the optimum on those three, and on the
 *   24-type army it finds a march the windows do not: **178 175 929** against 172 630 993, 3.2 % more.
 * - **the whole army**, always — the Tier ladder's own march, so the bar can show the player where the march
 *   Generate answers with today actually sits.
 *
 * The family the search already had — the sizer over a **prefix** of `rankTroops` — was measured and
 * rejected: **91.6 %** of the optimum on the first-run army at 12 000 and 20 000 leadership (2 710 128
 * against 2 959 404 at 12 000), 91.7 % at 4 100, and **38.9 %** of the best found on the 24-type one, because the winning subset is a
 * *tier window* and not a prefix of a damage-per-HP ranking.
 *
 * Every march is built by the app's own sizer over its subset (`sizedShape`, which is `sizeStacks`), so a
 * stop the bar offers is a march the March pane can re-size and the player can type into the game.
 *
 * **One sizing, where the hired search crosses three.** `sizedShape` is asked for `elite` only, because with
 * nothing hired the other two are the same march: `ms` and `msRelaxed` differ from it by a ceiling written on
 * the authority and dominance pools, and experiment 114 §A measured the three producing **identical counts to
 * the unit** on a hired-free army at 4 100, 12 000 and 20 000 leadership. So the family this searches is the
 * Elite sizer's subsets, and on this army that is every subset there is.
 */
function planTroopsOnly(input: CampaignInput): CampaignPlan {
  const { request } = input;
  const enemyStacks = enemySquadCount(request.enemy);
  const table = effectiveTable(request);
  const byId = new Map(table.map((entry) => [entry.id, entry]));
  const troopIds = table.filter((entry) => entry.pool === 'leadership').map((entry) => entry.id);
  /** The campaign is the march repeated, so the horizon only multiplies; one march when none was asked for. */
  const marches = input.marchTarget === undefined ? 1 : Math.max(1, Math.floor(input.marchTarget));

  interface Shape {
    ids: string[];
    rungs: { entry: Effective; count: number }[];
    march: PlanMarch;
  }
  const priced = new Map<string, Shape>();
  /** Size one subset and price it, or `null` when the leadership pays for nothing in it. */
  const shapeOf = (ids: readonly string[]): Shape | null => {
    if (ids.length === 0) return null;
    const key = [...ids].sort((a, b) => (a < b ? -1 : 1)).join(',');
    const already = priced.get(key);
    if (already) return already;
    const sized = sizedShape(request, byId, [], 'elite', new Set(ids));
    if (sized.rungs.length === 0) return null;
    const shape: Shape = {
      ids: sized.rungs.map((rung) => rung.entry.id),
      rungs: sized.rungs,
      march: priceMarch(request.recovery, sized.rungs, [], marchOf(sized.rungs, enemyStacks)),
    };
    priced.set(key, shape);
    return shape;
  };

  const shapes: Shape[] = [];
  const take = (shape: Shape | null): void => {
    if (shape && !shapes.includes(shape)) shapes.push(shape);
  };

  // The whole army first, so it is in the set whatever the two families find.
  take(shapeOf(troopIds));
  // Tier windows.
  const tiers = [...new Set(troopIds.map((id) => byId.get(id)?.unit.tier ?? 0))].sort((a, b) => a - b);
  for (const lo of tiers) {
    for (const hi of tiers) {
      if (hi < lo) continue;
      take(
        shapeOf(
          troopIds.filter((id) => {
            const tier = byId.get(id)?.unit.tier ?? 0;
            return tier >= lo && tier <= hi;
          }),
        ),
      );
    }
  }
  // Greedy backward elimination, keeping every march it passes through.
  {
    let live = [...troopIds];
    while (live.length > 1) {
      let best: { ids: string[]; shape: Shape } | null = null;
      for (const id of live) {
        const without = live.filter((other) => other !== id);
        const shape = shapeOf(without);
        if (!shape) continue;
        if (!best || shape.march.damage > best.shape.march.damage) best = { ids: without, shape };
      }
      if (!best) break;
      take(best.shape);
      live = best.ids;
    }
  }

  const totalsOf = (shape: Shape): PlanTotals => {
    const { march } = shape;
    const totalDamage = marches * march.damage;
    const silver = marches * march.silver;
    return {
      counts: march.counts,
      shape: 'elite',
      totalDamage,
      // No hired stack is fielded, so none of that damage is hired damage and none of the stock is lost.
      hiredDamage: 0,
      silver,
      gold: marches * march.gold,
      dragonCoins: marches * march.dragonCoins,
      seconds: marches * march.seconds,
      mercLost: 0,
      marches,
      damagePerSilver: silver > 0 ? totalDamage / silver : 0,
      // `Infinity`-safe as everywhere else: nothing hired is lost, so the ratio has no denominator.
      damagePerMercenary: Infinity,
      damagePerDragonCoin: Infinity,
      repeat: {
        damage: march.damage,
        hiredDamage: 0,
        silver: march.silver,
        gold: march.gold,
        dragonCoins: march.dragonCoins,
        seconds: march.seconds,
        mercLost: 0,
      },
    };
  };

  const all = shapes.map(totalsOf);
  /**
   * **The frontier: undominated on more damage for less silver.** The queue is not a third axis to be
   * undominated on — experiment 116 measured the silver frontier and the queue frontier as the same list on
   * the two biggest armies and within two marches of each other on the three smallest — so it is carried as
   * a *figure on every row* rather than as a dimension of the search, which is what lets a player who is
   * short of speedups read the bar for himself.
   */
  const undominated = all.filter(
    (one) =>
      !all.some(
        (other) =>
          other !== one &&
          other.totalDamage >= one.totalDamage &&
          other.silver <= one.silver &&
          (other.totalDamage > one.totalDamage || other.silver < one.silver),
      ),
  );
  /**
   * Two subsets can price to the **same** damage for the same silver — a tier window and the greedy walk
   * meeting on one march, or two types the sizer fields identically — and a strict-improvement test keeps
   * both of them. They are one plan; the reference table under the bar draws a row a plan
   * (`PlanPanel.tsx`, keyed on the silver) and would draw two rows with one key. Deduplicated here, where
   * the frontier is defined, rather than in the table that reads it.
   */
  const seenPoint = new Set<string>();
  const frontier = undominated
    .sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage)
    .filter((one) => {
      const key = `${String(one.silver)}|${String(one.totalDamage)}`;
      if (seenPoint.has(key)) return false;
      seenPoint.add(key);
      return true;
    });

  /**
   * **The stops**, in the bar's own left-to-right order — spend less … spend more — and under the bar's own
   * rule that a name is worn by one plan only (`offer` in `planCampaign`):
   *
   * - **silver saver** — the cheapest march on the frontier that still earns its place: the thrift end of a
   *   troops-only frontier is four tier-1 stacks at **0.2 damage a silver** against the whole army's 0.56
   *   (experiment 116), and that is not an answer anybody would stand on. The rule is *at least half the best
   *   rate on the frontier*.
   * - **sweet spot** — the knee: the plan furthest above the straight line between the two ends, which is
   *   where one more silver stops buying its share of damage. It is the bar's default stand.
   * - **steady max** — the most damage the army can do, which is the frontier's dear end.
   *
   * **It is one criterion where the hired band has three** (`inBand`, and the S-111 review is right to say
   * so): that band also asks for at least half the winner's *damage* and refuses a march standing on a
   * single troop stack. Neither is dropped by oversight. The damage floor would refuse this bar's own
   * thrift end — the silver saver at 12 000 leadership is 49.4 % of the steady max — and refusing it is
   * exactly what the owner did *not* ask for here: with no stock to ration, a cheap march is the whole point
   * of the left end. The single-stack rule is unreachable rather than dropped: a one-stack march is the
   * enemy's first kill and strikes **zero** times (`expectedHits(1, N)` = 0, measured at 115 §F, where one
   * type alone deals 0 damage), so it is dominated by every other shape and never reaches the frontier.
   */
  const cheapestRate = frontier.length > 0 ? Math.max(...frontier.map((row) => row.damagePerSilver)) : 0;
  const worth = frontier.filter((row) => row.damagePerSilver >= cheapestRate / 2);
  const band = worth.length > 0 ? worth : frontier;
  const stops: PlanRow[] = [];
  const offer = (row: PlanTotals | undefined, pick: PlanPick): void => {
    if (!row) return;
    if (stops.some((already) => already.counts === row.counts)) return;
    stops.push({
      ...row,
      pick,
      label: `${String(Object.keys(row.counts).length)} stacks · ${String(
        Math.round(row.repeat.silver),
      )} silver a march`,
      bestFor: { silver: false, hired: false },
    });
  };
  const first = band[0];
  const last = band.at(-1);
  offer(first, 'silver-saver');
  /** The knee, on the chord between the two ends of the band; the ends themselves are never the knee. */
  const knee = ((): PlanTotals | undefined => {
    if (!first || !last || band.length < 3 || last.silver === first.silver) return undefined;
    const slope = (last.totalDamage - first.totalDamage) / (last.silver - first.silver);
    let best: { row: PlanTotals; gap: number } | undefined;
    for (const row of band.slice(1, -1)) {
      const gap = row.totalDamage - (first.totalDamage + slope * (row.silver - first.silver));
      if (!best || gap > best.gap) best = { row, gap };
    }
    return best?.row;
  })();
  offer(knee, 'sweet-spot');
  offer(last, 'steady-max');
  // Left to right, cheapest first, like every bar this app draws.
  stops.sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
  /**
   * **A bar too short for a knee still has to name the row it opens on** (found by the S-111 review, which
   * swept 270 troop-window × leadership armies and found **60** with one or two stops — every G1-only army,
   * every G1–G2 one).
   *
   * There is no knee inside a band of two, so nothing wore `sweet-spot`, and the two readers of "where does
   * this bar stand?" then disagreed: the plan's own totals took the **dearest** stop and `recommend` took the
   * **cheapest**. On screen that is `PlanBar` painting the brass *Sweet spot* mark on the row `PlanTrade`
   * names *Silver saver*, `PlanPanel` writing *"the sweet spot it found for this army is …"* about one row
   * and *"Fought to the end …"* about another — design rule 5 broken three ways over.
   *
   * So the stand is chosen **once**, and the row it lands on wears the word the copy uses for it. Where
   * there is a knee it is the knee, as on the hired bar; where there is not it is the **dearest** stop —
   * with two answers on the bar, *spend less* and *hit hardest*, the one to recommend is the one that hits.
   */
  const stand: PlanRow | undefined = stops.find((row) => row.pick === 'sweet-spot') ?? stops.at(-1);
  if (stand && stand.pick !== 'sweet-spot') stand.pick = 'sweet-spot';
  const bestRate = stops.reduce<PlanRow | undefined>(
    (best, row) => (best === undefined || row.damagePerSilver > best.damagePerSilver ? row : best),
    undefined,
  );
  for (const row of stops) row.bestFor = { silver: row === bestRate, hired: false };

  if (!stand) {
    // No shape the leadership pays for: an army with no troop type it can field, or a pool too small for a
    // single unit of anything. It is a refusal, and it says which resource is missing rather than talking
    // about mercenaries this army does not have (`refusalOf`, `src/ui/sections/march/generate.ts`).
    throw new Error('planCampaign: no march fits this army’s housing');
  }
  const chosen = stand;
  const chosenShape = shapes.find((shape) => shape.march.counts === chosen.counts);
  if (!chosenShape) throw new Error('planCampaign: the chosen stop has no shape');
  const leadershipUsed = chosenShape.rungs.reduce((sum, rung) => sum + rung.count * rung.entry.cost, 0);

  return {
    /** The reference table under the bar: one row a plan the bar may offer, which here is the frontier. */
    curve: frontier.map((row) => ({
      silver: row.silver,
      damage: row.totalDamage,
      hiredDamage: 0,
      damagePerSilver: row.damagePerSilver,
      mercLost: 0,
      thriftyDamage: row.totalDamage,
      thriftyMercLost: 0,
      thriftyPerMercenary: Infinity,
    })),
    ...chosen,
    march: chosenShape.march,
    binding: {
      silver: input.silverBudget !== undefined && chosen.silver >= input.silverBudget * 0.9,
      // Nothing is hired, so nothing hired binds; the leadership is what the march is sized against.
      mercenaries: false,
      leadership: leadershipUsed >= request.housing.leadership * 0.999,
      marches: input.marchTarget !== undefined,
    },
    alternatives: stops,
    leftOut: Math.max(0, frontier.length - stops.length),
    ...(input.withTrade === true ? { trade: [...frontier] } : {}),
    ...(input.silverBudget === undefined
      ? {
          // The same row the plan's own totals are, and the same row the bar opens on: one stand, not two.
          recommend: chosen,
          knee: { ...(knee ?? chosen), label: 'the knee' },
          mostEfficient: bestRate ?? chosen,
          // Nothing hired is spent, so "the plan that buys the most damage a mercenary" has no meaning here:
          // every row's ratio is `Infinity`. The field is the bar's own stand rather than a second opinion.
          mostThrifty: chosen,
        }
      : {}),
  };
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
  /**
   * **The hired set: every pool but `leadership`** (S-96, 2026-09-19; the owner: *"fix why the monsters are
   * not shielded in the generated stack"*).
   *
   * A march is built from two kinds of unit — the troops the **leadership** pool pays for, which are retrained
   * per unit and come back, and everything else, which is a rare stock spent ten at a time. The game has two
   * of the second kind: the **authority** pool's mercenaries (`kind === 'mercenary'`, the Legionaries and the
   * Bear V he hires) and the **dominance** pool's monsters (`src/data/tables/monsters.json`, 28 types over
   * tiers 3–9, unlocked by the profile's `troops.monsters` tier window). This line read `=== 'authority'`
   * until S-96 and the second kind was simply not in the search: measured on a camp holding 20 monster types
   * and 20 000 dominance (experiment 110, `tools/theorycraft/out/110-monster-shelter.md`), the Battle card's
   * sizers field **17 to 21** monster stacks and the plan fielded **0 of 20 types held** — on all three
   * stops, on every march of every stop, finale and tail included. The monsters were not *unsheltered*; they
   * were absent, which is why `shelterUnder` was never reached with one and why the criterion that guards the
   * shelter passed vacuously.
   *
   * Widening it here widens every rule that reads it — the grid the search crosses, `stocked` and S-58 B, the
   * put-back's caps, `tighterShape`, the `all-in`'s march builder and the band's hired count — because each of
   * them was always a statement about *hired stock* and only ever spelled `authority` because that was the
   * only pool the plan could reach.
   */
  const mercTypes = table.filter((entry) => entry.pool !== 'leadership');
  /**
   * **Unlimited hired types** (owner, 2026-09-18: *"when a merc is unlimited and is put in, don't put more,
   * and lower it so the health stack still makes sense — below the troops"*). A type hired with no cap has no
   * entry in `caps`; it used to read as a stock of nothing and was never fielded. It is bounded by **its own
   * pool** instead — the only limit the game puts on it — and its stock never runs out (`sustain`). Since
   * S-96 that is the dominance pool for a monster as well as the authority pool for a mercenary, and it is
   * how a monster enters the search at all: no monster carries a cap, because `caps` is written only for the
   * mercenaries the player selected.
   *
   * What it no longer decides is the **shelter**: since S-87 every hired stack of every shape stands under the
   * lowest troop stack, capped or unlimited (`shelterUnder`, and the note beside it). This set is what bounds an
   * uncapped stock and what keeps it out of the rationing rules — `outrun`, `anchorOf`, `binding.mercenaries` —
   * not which stacks the enemy is allowed to kill first.
   */
  const unlimited = new Set(
    request.units
      .filter((unit) => unit.pool !== 'leadership' && request.caps[unit.id] === undefined)
      .map((unit) => unit.id),
  );
  const stock: Record<string, number> = { ...request.caps };
  const sustain: Record<string, number> = { ...request.caps };
  for (const entry of table) {
    if (!unlimited.has(entry.id)) continue;
    // **Bounded by the type's own pool** (S-96): authority for a mercenary, dominance for a monster. Every
    // dominance monster is uncapped by construction — `caps` is written only for the mercenaries the player
    // selected (`buildUnits`) — so this is the line that gives a monster a stock at all.
    stock[entry.id] = Math.max(0, Math.floor(request.housing[entry.pool] / Math.max(1, entry.cost)));
    /**
     * **What a dominance stack's sustain is, said outright** (S-102; the owner, 2026-09-19: *"apart from
     * mercs, they can be trained just like troops"*).
     *
     * The dominance pool is **housing, not a stock that runs out**. A monster lost in a march is recruited
     * again in the Army tab, ten at a time, for silver, for queue time and for dragon coins — the price
     * `marchOf` and `toMarch` already bill — and the housing it stood in is free again the moment it is
     * back. There is no count of monsters the account "has left" to be rationed over four marches, which is
     * what `sustain`, `lastsMarches`, `anchorFor` and `outrun` exist to ration. So a dominance type is
     * `Infinity` here and its anchor is the whole pool at every march count (`anchorOf`): **no anchoring and
     * no `lastsMarches` on a monster**, and a monster camp can never be the type that shortens a campaign
     * (`carriesHorizon`, `repeatsFor`).
     *
     * It lands on the same line as an **unlimited mercenary** and for a different reason, which is worth
     * knowing apart: the uncapped mercenary is Infinity because the player told the app he holds no
     * particular number of them, and the monster is Infinity because the question does not apply to it. A
     * mercenary the player *does* cap is rationed, and after S-102 it is the only thing the bar's burn axis
     * counts.
     */
    sustain[entry.id] = Infinity;
  }
  const leadership = request.housing.leadership;

  /**
   * **The army that hires nothing goes to its own planner** (S-111), and this is the earliest point at which
   * that is knowable: `stock` is what a type holds, and an uncapped monster's stock is the pool it stands in,
   * which the loop above has just written.
   *
   * The test is *"can this army put one unit that is spent for good on the field?"*, and it is **two**
   * questions rather than one — a stock, **and** a pool with room for a unit of it. The first draft of this
   * gate asked only for the stock and left two crashes standing (found by the S-111 review): a bear in the
   * stock with **no authority housing**, and a mercenary selected on an account whose pool is still typed at
   * zero. Both hold stock, neither can field it, and both went down the search's path to the throw. Every
   * shape the search prices is checked by `fitsHousing`, so a hired type with no room is a type no candidate
   * can ever carry.
   *
   * **Nothing that answers today can reach this branch**, which is the load-bearing claim of the story: a
   * plan the search returns has at least one hired unit on the field, and that is exactly what this refuses.
   * Held by measurement rather than by argument — the gate replayed over all 34 scenarios of
   * `tests/engine/plan-scenarios.ts` marks none of them, and the regenerated benchmark payload is
   * byte-identical on every field of all 17 armies but `run` and `planMs`.
   */
  const hiresNothing = mercTypes.every(
    (entry) => (stock[entry.id] ?? 0) <= 0 || request.housing[entry.pool] < entry.cost,
  );
  if (hiresNothing) return planTroopsOnly(input);

  /**
   * The largest count of a type that still allows `marches` marches: fielding n loses `chunks(n)` for good, so
   * a constant n lasts `floor((stock − n) / chunks(n)) + 1`. Smaller counts last longer, and the whole grid of
   * interest is the set of these maxima and a few fractions below them. It is `largestSustained` above,
   * exported since S-107 so the March pane's re-size bounds a hired type by the very arithmetic the search
   * anchors it on.
   */
  const largestFor = largestSustained;

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
    /**
     * Its silver, its losses and what its hired stacks dealt, counted once (`ratioOf`) — every candidate is
     * judged on them. The third is S-105's: damage a hired unit is the hired stacks' own damage over the
     * chunks they cost, so the peak this file keeps under that name needs the numerator beside the burn.
     */
    ratios?: { silver: number; mercs: number; hired: number };
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
  /** The plan that buys the most damage per silver — only meaningful before a budget is applied. */
  let light: Candidate | null = null;
  /** The plan that buys the most damage per mercenary over the whole search. */
  let heavy: Candidate | null = null;
  let peakSilver = 0;
  let peakMercenary = 0;
  /** This search's four prices for one march, under the account's own recovery settings (`priceMarch`). */
  const toMarch = (
    rungs: { entry: Effective; count: number }[],
    mercs: { entry: Effective; count: number }[],
    totals: ReturnType<typeof marchOf>,
  ): PlanMarch => priceMarch(request.recovery, rungs, mercs, totals);

  const ratioOf = (candidate: Candidate): { silver: number; mercs: number; hired: number } => {
    // Counted once per candidate and kept: `record` reads the *current* best's ratios again on every
    // candidate it sees, and re-adding a plan's whole arithmetic for each of those is pure repetition.
    if (candidate.ratios !== undefined) return candidate.ratios;
    const m = toMarch(candidate.rungs, candidate.mercs, candidate.march);
    const ratios = {
      silver: candidate.marches * m.silver + (candidate.finale?.silver ?? 0),
      mercs: candidate.marches * m.mercLost + (candidate.finale?.mercLost ?? 0),
      // What the campaign's hired stacks themselves dealt (S-105) — the numerator of damage a hired unit.
      hired: candidate.marches * m.hiredDamage + (candidate.finale?.hiredDamage ?? 0),
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
    /**
     * **Over a prefix of the troop ranking** (S-93), instead of over every type the account holds. The sizer's
     * shape is the app's own, and the search only ever asked it for the whole army — so the family "the sizer
     * over the strongest k types", which is what a player builds when he leaves the low tiers out and then
     * puts some of them back, was never scored. Measured on the e2e seed (`out/108-thrift-end.md`): the
     * `all-in`'s first march hit for 7 708 571 at 11 434 600 silver and 1 478 h of queue where the sizer over
     * every one of its nine troop types hits for 8 047 249 at 8 514 200 and 729 h — the same nine chunks
     * burned, more damage, a quarter less silver and half the queue. Omitted: every troop type, as before.
     */
    depth?: number,
  ): { rungs: { entry: Effective; count: number }[]; mercs: { entry: Effective; count: number }[] } =>
    sizedShape(
      request,
      byId,
      mercs,
      method,
      // The prefix as a set of ids, which is what `sizedShape` filters on: `troops` is the ranking, weakest
      // per HP first, so its last `depth` entries are the strongest `depth` types.
      depth === undefined ? undefined : new Set(troops.slice(-depth).map((entry) => entry.id)),
    );
  let winnerRungs: { entry: Effective; count: number }[] = [];
  const score = makeScorer({
    troops,
    mercTypes,
    stock,
    leadership,
    housing: request.housing,
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

  /** Books one scored shape into the two peaks the payload carries (`mostEfficient`, `mostThrifty`). */
  const record = (candidate: Candidate): void => {
    const { total } = candidate;
    const spent = marchedSilver(candidate);
    const lightSpent = light?.spent ?? 0;
    if (spent > 0 && (!light || total / spent > light.total / lightSpent)) {
      light = { ...candidate, spent };
    }
    // The two peaks, measured over every candidate rather than over the thinned frontier: the most damage a
    // silver and the most damage a mercenary. The sweet spot is not read here: since 2026-09-16 it is the
    // middle of the *trade* in hired stock, which is a question about the plans the bar can carry and not
    // about the search's peaks. Neither is the reference table any more (S-88): the `curve` is bucketed over
    // the plans the bar may offer, at the end of this function, and not over every shape the search prices.
    const { silver: pointSilver, mercs: pointMercs, hired: pointHired } = ratioOf(candidate);
    if (pointSilver <= 0 || pointMercs <= 0) return;
    const perSilver = total / pointSilver;
    // **The hired stacks' own damage over the chunks they cost** (S-105): `mostThrifty` is *"the plan that
    // buys the most damage per mercenary"*, and since this story that sentence means one thing everywhere.
    const perMerc = pointHired / pointMercs;
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

  /**
   * **The sheltered maximum at each prefix length of the troop ranking**: the **biggest** tight ladder over
   * `k` types the leadership pays for, and the most hired units its own floor shelters — `ceil(floor / hp) − 1`
   * per hired type, capped by that type's sustainable anchor. No constant: the ladder's cost and the shelter
   * decide, and the two ends of the family are "one huge troop stack sheltering everything" and "every troop
   * type the account holds, sheltering a handful".
   *
   * It is the family the *player* builds by hand — *"using Troops first"*, then the low tiers put back one at
   * a time — read here as a **hired vector** rather than as a shape, because that is what the search is short
   * of: a ladder is sized off the biggest hired stack and the sizer shapes are sized over every troop type at
   * once, so the counts that only a shallow, tall ladder can shelter are counts no vector in the grid carries.
   * Once the vector is scored, `tighterShape` finds the prefix that fields it best.
   *
   * Two callers: `CampaignInput.shelteredMax`, which puts them in the **grid** (experiment 108 §B), and the
   * top of the burn ladder below (S-97), which sweeps the ones above the winner's own burn.
   */
  const maxShelterDepth = Math.min(troops.length, Math.max(...DEPTHS));
  /** The floor of the biggest depth-`k` tight ladder the leadership pays for, or 0 if none fits. */
  const biggestFloor = (depth: number): number => {
    const rungsAt = (hp: number): { entry: Effective; count: number }[] =>
      buildLadder(troops, depth, hp, gap, leadership, 1);
    if (rungsAt(1).length === 0) return 0;
    let high = 1;
    while (high < 1e12 && rungsAt(high * 2).length > 0) high *= 2;
    let low = high;
    high *= 2;
    while (low + 1 < high) {
      const mid = Math.floor((low + high) / 2);
      if (rungsAt(mid).length > 0) low = mid;
      else high = mid;
    }
    const rungs = rungsAt(low);
    return rungs.length === 0 ? 0 : Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
  };
  interface ShelteredMax {
    marches: number;
    vector: { entry: Effective; count: number }[];
    /** The sizer shape this vector is the shelter of, where one is — its method's depth and its prefix. */
    shape?: { depth: number; prefix: number };
  }
  const shelteredMaxima = (hiredPrefix?: ReadonlySet<string>): ShelteredMax[] => {
    const out: ShelteredMax[] = [];
    const seenShelter = new Set<string>();
    const take = (one: ShelteredMax): void => {
      if (one.vector.every((merc) => merc.count <= 0)) return;
      const key = `${one.vector.map((merc) => merc.count).join(',')}|${one.shape?.depth ?? ''}|${one.shape?.prefix ?? ''}`;
      if (seenShelter.has(key)) return;
      seenShelter.add(key);
      out.push(one);
    };
    for (const marches of gridMarches) {
      // **Over a prefix of the hired ranking** (S-99): a type outside it is anchored at nothing, so the
      // tight ladder's shelter and the sizer's own fill both go to the types that are left — which is the
      // whole of the family, the pool being what they were sharing.
      const anchors = mercTypes.map((entry) =>
        hiredPrefix && !hiredPrefix.has(entry.id) ? 0 : anchorOf(entry.id, marches),
      );
      const whole = mercTypes.map((entry, index) => ({ entry, count: anchors[index] ?? 0 }));
      if (whole.every((merc) => merc.count <= 0)) continue;
      for (let depth = 1; depth <= maxShelterDepth; depth += 1) {
        const floorHp = biggestFloor(depth);
        if (floorHp <= 0) continue;
        take({
          marches,
          vector: mercTypes.map((entry, index) => ({
            entry,
            count: Math.max(0, Math.min(anchors[index] ?? 0, Math.ceil(floorHp / Math.max(1, entry.hp)) - 1)),
          })),
        });
      }
      /**
       * **And the sizer's own sheltered maximum over each prefix**, which is the same question asked of the
       * other shape the plan can build. A tight ladder spends the leadership on rungs 2 % apart; the sizer
       * spends it its own way, and on an army whose troops are cheap the two floors — and so the two
       * shelters — are far apart. Measured on the owner's export at 12 000 (experiment 111 §B): the tight
       * ladder's maxima all sit at or under the winner's own burn and the pass reaches nothing, while the
       * sizer over seven of its troop types shelters **19** chunks for 8 903 181 a march against the bar's
       * top rung of 8 014 627 at 17. It is also the family the criterion is stated against
       * (`shelteredRivals`, `tests/engine/plan-criteria.test.ts`) and the one the owner builds by hand.
       */
      if (sizerShape) {
        for (let prefix = 1; prefix <= troops.length; prefix += 1) {
          for (const [key, method] of Object.entries(SIZER_DEPTHS)) {
            const sized = sizer(whole, method, prefix);
            if (sized.rungs.length < 2) continue;
            const fielded = new Map(sized.mercs.map((merc) => [merc.entry.id, merc.count]));
            take({
              marches,
              vector: mercTypes.map((entry) => ({ entry, count: fielded.get(entry.id) ?? 0 })),
              shape: { depth: Number(key), prefix },
            });
          }
        }
      }
    }
    return out;
  };
  /**
   * The types the account holds a stock of, for S-58 B. Only the *stocked* ones — every hired type of every
   * hired pool since S-96, which on a camp that has unlocked the monster tiers is the dominance table too:
   * a monster carries no cap, so it enters here through `unlimited` and the pool is what bounds it.
   *
   * Read here rather than beside the band since S-99: the passes below ask which of their own marches field
   * a *prefix* of them, and that question is asked while the search is still running.
   */
  const stocked = mercTypes.filter((entry) => (stock[entry.id] ?? 0) > 0 || unlimited.has(entry.id));
  /** The hired types by what a point of their own pool buys, best first (S-99, `rankHired`). */
  const hiredRanking = rankHired(request, table);
  /**
   * **The hired prefix family** (S-99): for each k, the shapes built from the first k hired types with the
   * rest at **zero**.
   *
   * The grid crosses `CROSSED_TYPES` types against each other and rides every further one on a share of its
   * own largest count — and neither list carries a zero once S-58 A's `tokenFloor` is on, so **no vector the
   * search prices ever leaves a hired type out**. Every march it can offer therefore pays a chunk of ten for
   * every type the account holds, whatever that type is worth: measured on the monster camp
   * (`tools/theorycraft/out/113-monster-economy.md` §B), the four types worth least a point of dominance held
   * **48 %** of the march's monster chunks for **5 %** of its damage, and the pool they were sharing is what
   * the types above them could not fill.
   *
   * Two families are added per prefix, and they are the two the search already knows how to build:
   *
   *  - **the prefix's own anchors at each of the grid's shares** — the riding rule (`shares`), which is what
   *    the grid does to every type it does not cross, asked of the prefix alone;
   *  - **the sheltered maxima over the prefix** (`shelteredMaxima` above) — the tight ladders' floors and the
   *    sizer's own shapes, which is where the gain is: `sizeStacks` fills a pool from the top of its own order
   *    and stops, so with the tail at zero the types that are left get the whole pool and the bigger stacks.
   *
   * **The crossed product is not repeated per prefix**, on purpose: it is `5^CROSSED_TYPES` shapes a prefix
   * and a fourteen-type camp would spend its whole budget on the thirteen of them. The family's job is to put
   * the subspace in front of the hill-climb — which walks each type's count over `[1, …MERC_FRACTIONS, 0]` and
   * so crosses it itself — and not to re-walk the grid thirteen times.
   */
  /** The stocked types in that order — the ranking S-58 B's cut is read along (`hiredCut`). */
  const stockedRanked = hiredRanking.filter((entry) => stocked.includes(entry));
  /**
   * How many types of the stocked ranking a march fields, when what it fields is a **prefix** of it —
   * `−1` when it leaves a hole, and the ranking's whole length when it fields every type the account holds.
   * The one reading of "this march is a member of the prefix family" the search makes (S-99).
   */
  const prefixFielded = (fields: (id: string) => boolean): number => {
    let length = 0;
    while (length < stockedRanked.length && fields(stockedRanked[length]?.id ?? '')) length += 1;
    for (let index = length; index < stockedRanked.length; index += 1) {
      if (fields(stockedRanked[index]?.id ?? '')) return -1;
    }
    return length;
  };
  const hiredPrefixSets: ReadonlySet<string>[] = [];
  for (let k = 1; k < hiredRanking.length; k += 1)
    hiredPrefixSets.push(new Set(hiredRanking.slice(0, k).map((entry) => entry.id)));
  /**
   * Every sheltered maximum the search scores — the whole hired set's (S-97) and each prefix's (S-99) —
   * computed once and kept, because both the grid below and the top-of-the-bar pass read them and the sizer
   * calls behind them are the expensive half.
   */
  let shelteredWhole: ShelteredMax[] | null = null;
  let shelteredPrefixes: ShelteredMax[] | null = null;
  const shelteredOverWhole = (): ShelteredMax[] => (shelteredWhole ??= shelteredMaxima());
  const shelteredOverPrefixes = (): ShelteredMax[] =>
    (shelteredPrefixes ??= hiredPrefixSets.flatMap((prefix) => shelteredMaxima(prefix)));
  if (input.shelteredMax === true) vectors.push(...shelteredOverWhole().map((one) => one.vector));
  /** The prefix family's own vectors, scored after the search settles (see the pass below). */
  const prefixVectors: { entry: Effective; count: number }[][] = [];
  {
    const seenPrefix = new Set<string>();
    const takePrefix = (vector: { entry: Effective; count: number }[]): void => {
      if (vector.every((merc) => merc.count <= 0)) return;
      const key = vector.map((merc) => merc.count).join(',');
      if (seenPrefix.has(key)) return;
      seenPrefix.add(key);
      prefixVectors.push(vector);
    };
    for (const prefix of hiredPrefixSets) {
      for (const marches of gridMarches) {
        for (const share of [1, ...MERC_FRACTIONS]) {
          takePrefix(
            mercTypes.map((entry) => ({
              entry,
              count: prefix.has(entry.id) ? Math.round(anchorOf(entry.id, marches) * share) : 0,
            })),
          );
        }
        // S-58 A's thrift end, read over the prefix: one chunk of each type that is in it.
        if (tokenFloor) {
          takePrefix(
            mercTypes.map((entry) => ({
              entry,
              count: prefix.has(entry.id) ? Math.min(CHUNK, anchorOf(entry.id, marches)) : 0,
            })),
          );
        }
      }
    }
    for (const one of shelteredOverPrefixes()) takePrefix(one.vector);
  }

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
    /** The burn ladder under one march: every level below its own, at both readings of a level. */
    const walkDown = (from: { entry: Effective; count: number }[], fromBurn: number): void => {
      for (let burn = fromBurn - 1; burn >= 1; burn -= 1) {
        if (stop()) break;
        // the level as it has always been read: each type rounded up to a whole chunk
        sweep(
          from.map((merc) => ({
            entry: merc.entry,
            count: Math.min(
              stock[merc.entry.id] ?? 0,
              merc.count <= 0 ? 0 : CHUNK * Math.ceil((merc.count * burn) / fromBurn / CHUNK),
            ),
          })),
        );
        // and the same level per unit — a type the march fields keeps at least one of itself, because a
        // thriftier level is not a reason to drop a type the account holds (S-58 A's thrift end, here)
        sweep(
          from.map((merc) => ({
            entry: merc.entry,
            count:
              merc.count <= 0
                ? 0
                : Math.max(
                    1,
                    Math.min(stock[merc.entry.id] ?? 0, Math.round((merc.count * burn) / fromBurn)),
                  ),
          })),
        );
      }
    };
    walkDown(winner.mercs, topBurn);

    /**
     * **The top of the bar** (S-97, 2026-09-19; the owner's own camp, *"Aydae alone"* at 4 975, is where it
     * was missing).
     *
     * The sweep above walks **down** from the winner's own burn, so the winner's burn is the ceiling of what
     * the bar is *offered*: the sweep proposes no level above it, and the rung stops are whatever the levels
     * under it hold. (A level above it can still turn up by accident — a sizer shape re-derives the hired
     * counts it is given, so a swept vector can come back dearer than the level it was built for, which is
     * where the 8, 9 and 10-chunk rows on the *"Aydae alone"* camp come from. What no rule asks for is the
     * march that *fields the most the troops shelter*, and that is the one the bar is short of.) That was harmless while the winner was the dearest march the search could find. It stopped being
     * so when the plan moved onto the worst opening (S-94): a march ranked on the bad flip wants **many**
     * stacks carrying the damage, so the winner became a deep ladder over every troop type the account
     * holds — and a deep ladder has a **low floor**, which is exactly what shelters the fewest hired units.
     * The winner went thrifty and took the bar's whole top with it. Measured on that camp (experiment 111
     * §A): the burn ladder topped out at **7** chunks and 3 387 893 a march, while the sizer's own sheltered
     * marches over 7, 6, 5, 4 and 3 of its troop types — each hired type at the largest count that lasts the
     * three repeats a rung plays — stand at **10, 12, 13, 17 and 23** chunks for 4 074 558, 3 688 939,
     * 3 438 030, **4 773 281** and 4 771 665, up to **41 %** more reliable damage at prices the bar simply
     * did not offer. On ten of the fifteen armies measured there was a sheltered march above the top rung
     * that out-hit it.
     *
     * **Why the search cannot reach them by itself**, and why a *vector* is what it is short of. Its two
     * shapes size their troops from the hired stack: a ladder's floor is the biggest hired stack times the
     * gap (`ladder`), and the sizer's shapes are sized over **every** troop type at once (`sizer`). Neither
     * can be asked "stand as few, as tall troop stacks as the leadership pays for, and field everything they
     * shelter" — and `tighterShape`, which does score the sizer over a prefix, only ever **caps** a row at
     * its own hired counts, so it tightens a march and can never raise one. `shelteredMaxima` above is that
     * question asked directly, once per prefix length, and this pass scores both halves of its answer: the
     * hired **vector** through the whole sweep, and the **shape** that shelters it through the scorer's own
     * prefix (see the note inside the loop — the vector alone comes back as the winner's own march on an
     * account whose troops are cheap).
     *
     * **It is scored, not chosen** — the winner is restored afterwards, and that is a measured decision
     * rather than a scruple. The winner is the **band's yardstick**: a plan is offered only if it fields at
     * least half the hired units the winner's own march fields (`goal.hired`, `notToken`). Letting these
     * vectors win moved that yardstick on the owner's camp of 2026-09-19 (the localStorage dump, 450
     * hunters) and emptied the thrift end with it — the bar's band went from 4 · 5 · 8 burned to 8 · 9 · 10,
     * its thriftiest stop from **4** chunks to **8**, and `tests/engine/plan-criteria.test.ts`'s *"the thrift
     * end is offered"* — S-93's criterion, the owner's *"no eco silver spot"* in one line — began to fail on
     * it. Frozen, the band keeps its thrift levels on that camp — 4 · 5 · 8 chunks are all still offered and
     * S-93's criterion passes — and every army's top is offered. Its **bar** still moves, because the levels
     * above the winner are new rungs and the rules that pick stops read the whole ladder: that camp's sweet
     * spot goes 4 → 5 chunks (2 385 168 → 2 423 299 a march) and its steady max 5 → 18. What the freeze
     * buys is that the thrift end is still *there* to be picked.
     *
     * What the freeze leaves as it was: the plan's **own** campaign — `CampaignPlan.totalDamage` and the
     * march and finale beside it, the *"Fought to the end"* line the app prints under the bar — is still
     * the winner of the search over the shapes every rung is drawn from. The bar has always been able to
     * carry a campaign above it (the `all-in` does on most armies, and on the *"Aydae alone"* camp it did
     * before this pass existed), so nothing new is said there; what is new is that a **rung** can too.
     */
    const frozen = best;
    // **And the same maxima over each hired prefix** (S-99): the top of the bar is the march that fields the
    // most the troops shelter, and on a camp whose pool is shared a dozen ways that march is the one over the
    // types worth housing — the rest at zero. Same pass, same freeze, one more family in it.
    for (const one of [...shelteredOverWhole(), ...shelteredOverPrefixes()]) {
      if (stop()) break;
      if (burnOf(one.vector) <= topBurn) continue;
      sweep(one.vector);
      /**
       * **And the shape itself, not only the counts.** A vector alone is not enough here: `evaluateVector`
       * builds ladders and the sizer over the **whole** army, and on an account whose troops are cheap the
       * whole-army sizer's own floor lowers the vector straight back to the winner's own burn — measured on
       * the owner's export at 12 000, where all five swept vectors (18 to 22 chunks) came back as the same
       * 17-chunk march at 8 014 627. The shape that shelters that much stock is the sizer over a **prefix**,
       * so it is scored as such, through the scorer, which gives it the finale and the repeats every other
       * candidate gets.
       */
      const shape = one.shape;
      if (!shape) continue;
      const counts: Record<string, number> = {};
      for (const merc of one.vector) counts[merc.entry.id] = merc.count;
      const scored = score(one.marches, counts, shape.depth, 1, input.silverBudget, shape.prefix);
      if (!scored || scored.rungs.length < 2) continue;
      consider({
        marches: one.marches,
        mercs: scored.mercs,
        rungs: scored.rungs,
        march: scored.march,
        finale: scored.finale?.march ?? null,
        finaleRungs: scored.finale?.rungs ?? [],
        finaleMercs: scored.finale?.mercs ?? [],
        total: scored.total,
        depth: shape.depth,
        scale: 1,
      });
    }
    /**
     * **The hired prefix family** (S-99, 2026-09-19), scored where S-97's family is scored and under the
     * same freeze, for the same measured reason.
     *
     * *Where.* The grid, the hill-climb and the burn ladder above are the search as it was, vector for
     * vector: this pass runs after them and adds candidates to the **frontier**, so a prefix march is
     * offered wherever it beats what the bar already has and nothing else about the search moves. Put in the
     * grid instead — measured 2026-09-19, which is how this pass came to sit here — the extra candidates
     * changed which shapes seeded the hill-climb on every army in the file, and the search is a walk over
     * plateaus: the owner's export at 7 000 lost a hired type off its *repeated* march, his live camp of
     * 2026-09-18 lost its silver saver, and the monster camp's own winner came out **3 M lower** than it does
     * from here. The family is a set of shapes the search was short of, not a different search.
     *
     * *Frozen.* `best` is restored afterwards exactly as S-97 restores it, and the note there is the whole
     * argument: the winner is the **band's yardstick** (`goal`, `notToken`), so letting these marches win
     * moves the floor every offered plan is measured against and empties the thrift end with it. Measured on
     * this camp with the freeze lifted: the sweet spot rose to 2.563 damage a silver and the bar's own
     * silver saver — 13 705 087 for 5 633 900 at three chunks — stopped clearing it, so a five-stop bar
     * became three. Frozen, the yardstick is the one the search settled on and the thrift end keeps its
     * levels.
     *
     * Three things are scored, and they are the three the family is made of: the prefix's own **vectors**
     * (its anchors at each of the grid's shares, and its sheltered maxima), the sizer **shape** that
     * shelters each of those maxima — the top-of-the-bar pass above scores that shape only for a vector
     * burning *more* than the winner, and a prefix usually burns less, which is exactly where its marches
     * are — and the **burn ladder under the best of them**, so the thrift end is offered over the types the
     * damage kept as well as over all of them.
     */
    for (const vector of prefixVectors) {
      if (stop()) break;
      const candidate = evaluateVector(vector);
      if (candidate) consider(candidate);
    }
    for (const one of shelteredOverPrefixes()) {
      if (stop()) break;
      const candidate = evaluateVector(one.vector);
      if (candidate) consider(candidate);
      const shape = one.shape;
      if (!shape) continue;
      const counts: Record<string, number> = {};
      for (const merc of one.vector) counts[merc.entry.id] = merc.count;
      const scored = score(one.marches, counts, shape.depth, 1, input.silverBudget, shape.prefix);
      if (!scored || scored.rungs.length < 2) continue;
      consider({
        marches: one.marches,
        mercs: scored.mercs,
        rungs: scored.rungs,
        march: scored.march,
        finale: scored.finale?.march ?? null,
        finaleRungs: scored.finale?.rungs ?? [],
        finaleMercs: scored.finale?.mercs ?? [],
        total: scored.total,
        depth: shape.depth,
        scale: 1,
      });
    }
    const prefixBest = frontier.reduce<Candidate | null>((held, candidate) => {
      const fielded = new Set(candidate.mercs.filter((merc) => merc.count > 0).map((merc) => merc.entry.id));
      const length = prefixFielded((id) => fielded.has(id));
      if (length <= 0 || length >= stockedRanked.length) return held;
      return !held || candidate.total > held.total ? candidate : held;
    }, null);
    if (prefixBest) walkDown(prefixBest.mercs, burnOf(prefixBest.mercs));
    best = frozen;
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
    // The finale's silver is the recap's own (`last`, priced under the account's temple level and training
    // discounts like every repeat), not the search's raw `marchOf` figure (S-91, 2026-09-18): every profile
    // in the repo has no discount, so the two agreed to the unit until the criterion was run under one —
    // where the raw figure overstated a discounted finale by a quarter (the e2e seed: 26 427 050 against the
    // recap's 24 394 200 over four marches). The search's own ranking keeps reading the raw figure on both
    // the repeat and the finale, consistently; this is the campaign the bar prints.
    const silver = candidate.marches * m.silver + (last?.silver ?? 0);
    const mercLost = candidate.marches * m.mercLost + (candidate.finale?.mercLost ?? 0);
    // **What the campaign's hired stacks dealt** (S-105), summed exactly the way the damage is: the repeated
    // march's own hired damage as many times as it is fought, plus the finale's. The troops-only tail, added
    // later by `withTail`, fields no hired stack and adds nothing to it.
    const hiredDamage = candidate.marches * m.hiredDamage + (last?.hiredDamage ?? 0);
    // The third currency, summed exactly as the silver above is, and named here because the ratio at the
    // foot of this row divides by it (S-102).
    const dragonCoins = candidate.marches * m.dragonCoins + (last?.dragonCoins ?? 0);
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
      hiredDamage,
      silver,
      // The campaign's revive gold: every repeat of the march, **plus the finale's own** (S-90). This line
      // read `candidate.marches * m.gold` until 2026-09-18 and the finale's hired stacks were revived for
      // free — the one campaign total of the three that left the last march out, while `silver` and
      // `seconds` beside it have always summed it. Measured by experiment 105's validator on the evening
      // account: the silver saver printed 1 944 gold where its four marches cost 3 192.
      gold: candidate.marches * m.gold + (last?.gold ?? 0),
      // The dominance pool's own price, summed exactly the same way (S-96).
      dragonCoins,
      // The campaign's training queue: every repeat of the march, plus the finale's own.
      seconds: candidate.marches * m.seconds + (last?.seconds ?? 0),
      mercLost,
      // The repeated march's own figures, which `toMarch` already priced and the totals above spread the
      // finale over: these are what the March section reports for the plan's own march.
      repeat: {
        damage: m.damage,
        hiredDamage: m.hiredDamage,
        silver: m.silver,
        gold: m.gold,
        dragonCoins: m.dragonCoins,
        seconds: m.seconds,
        mercLost: m.mercLost,
      },
      shape: candidate.depth === WINNER_RUNGS_DEPTH ? 'winner' : (SIZER_DEPTHS[candidate.depth] ?? 'ladder'),
      marches: candidate.marches + (candidate.finale ? 1 : 0),
      damagePerSilver: silver > 0 ? candidate.total / silver : Infinity,
      // Damage a hired unit is the **hired stacks' own** damage over the chunks they cost (S-105).
      damagePerMercenary: mercLost > 0 ? hiredDamage / mercLost : Infinity,
      // The monsters' own third price, read as the two above it (S-102): `Infinity` on a campaign that
      // spends no coin, which is every army but a monster camp.
      damagePerDragonCoin: dragonCoins > 0 ? candidate.total / dragonCoins : Infinity,
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
   *   **the goal** — its march does at least **half the damage the plan's own winning march does** (S-95:
   *   *"we're too far off from our goal"* is a sentence about the goal, and the goal is damage; a count of
   *   hired units is not); **silver** — it returns at least **half the plan's own damage a silver**; and
   *   **the march** itself must be more than a single troop stack (experiment 72's criterion, and the
   *   owner's own "the least silver plan would never be chosen … is not a strategy" — the plan a one-stack
   *   march describes is exactly the cheapest row the frontier used to carry).
   *
   * Every threshold is measured against `chosen`, never a free-standing number, so the plan itself is always
   * inside the band (its own march does exactly its own damage). Measured on the account
   * (`tools/theorycraft/out/74-row-figures.md` §2b): at a target of 10 the band keeps 31 of 46 frontier rows,
   * at 20 it keeps 15 of 31, the plan and the sweet spot pass at both, and the two ratio picks — the cheapest
   * one-stack march and the 9-mercenary silver sink — are the first rows it refuses.
   *
   * **The first arm read the count until S-95** (2026-09-19): *"it fields at least half the hired troops the
   * plan's own march fields"*. Experiment 112 re-measured the four readings of it over the fifteen armies the
   * criteria are held on (`tools/theorycraft/out/112-band-yardstick.md`), and the count loses on the rule's
   * own terms. **The extremes it lets in**: on the first-run armies with one, two and three Bear V the
   * winner's march fields a token of the stock itself, so half of it asks for almost nothing and the band
   * keeps a march worth **14.4 to 14.7 %** of the steady max's damage — the *"don't show the extremes"* the
   * arm exists to refuse. On damage the worst the band keeps anywhere in the fifteen is **37.8 %**. **The
   * plans it refuses**: on the owner's camp of 2026-09-19 (5 100 / 2 200, 120 hunters) the winner fields 100
   * hired, so the count asks 50 and every one of the **41** band plans of his own hand-built family — five
   * troop stacks and twenty to thirty hunters — was outside it; on his live camp of 2026-09-18 the band's
   * thriftiest plan burned **8** chunks while the sizer's own sheltered march at **7** does 2 230 444 for
   * 1 942 700 in 5d 9h. The damage reading admits both families and refuses both extremes.
   *
   * **What it costs, disclosed rather than smoothed** (`112-band-yardstick.md` §A): the band's thriftiest
   * rungs are new rungs of the burn ladder, so the knee can move onto one of them. **Four** recommendations
   * move and two bars gain a thrift stop. His live camp of 2026-09-18 gains the thrift stop outright — a **three**-stop bar becomes four, the
   * recommendation 3 544 681 at 12 chunks and 8d 16h becomes 2 249 888 at **4** chunks and **4d 19h** for
   * 22 % less silver. **The march it leaves is not kept**: the bar's new *more mercs* is a different plan
   * (3 285 305 for 2 635 500 at 10 chunks), 7.3 % less damage for 16.4 % **more** silver than the 12-chunk
   * march that is gone, so that army trades its old recommendation for a thrift stop and a dearer middle. The 7 000 export's
   * recommendation falls 4 870 455 → 4 442 817 a march (−8.8 %, campaign −6.4 %) for **4.2 % more** silver at
   * 10 → **7** chunks, which is the one fall that is worse on two readings at once and is a trade the owner
   * is shown, not one this file adjusts. The evening account's **rises** 6 189 687 → 7 096 423 (+14.6 %,
   * campaign +10.2 %) at the same silver, and it gains a silver saver — the fifth stop that brings back the
   * `stops` pin S-94 left red on that army. His own localStorage dump gains the thrift stop he asked for,
   * `silver-saver` at **3** chunks: thirty hunters over five troop stacks, 1 882 911 for 1 790 200 in
   * **6d 21h**, beside a recommendation that moves 5 → 4 chunks for 1.6 % of its damage.
   */
  const mercIds = new Set(mercTypes.map((entry) => entry.id));
  const hiredOf = (counts: Record<string, number>): number =>
    Object.entries(counts).reduce((sum, [id, count]) => sum + (mercIds.has(id) ? count : 0), 0);
  const goal = { hired: hiredOf(chosenPoint.counts), perSilver: chosenPoint.damagePerSilver };
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
  /**
   * **What S-58 B asks of a plan, said exactly** (S-99, 2026-09-19).
   *
   * *"A plan the player is offered fields a little of everything they hold"* is a sentence about the march he
   * **sends**, so a required type has to be on the march the plan repeats — or, for the `all-in`, on the
   * first march of its sequence, the one the bar prices and draws. The campaign-wide reading
   * (`fieldsInCampaign`) is kept for the one case it was written for and no other: a type the **horizon
   * outruns** (`outrun`, S-89), which no count of can last the repeats and which the plan therefore spends in
   * the finale. A plan that spends it there has no hole in it; a plan that leaves a type it *could* repeat to
   * the finale has one.
   *
   * It read the campaign for every type until S-99, and nothing in the search had ever offered the
   * difference: measured on the owner's export at 7 000 the day the prefix family went in, the *"more
   * mercs"* rung became a march fielding no legionary at all with 33 of them in the finale three marches
   * later — a hole the band was letting through, on the army whose bar the rule was written for.
   */
  const fieldsRequired = (row: PlanTotals, id: string): boolean =>
    outrun(id) ? fieldsInCampaign(row, id) : ((row.sequence?.[0] ?? row.counts)[id] ?? 0) > 0;
  /**
   * **The token-field arm**, and the one place its yardstick is decided (`CampaignInput.bandHired`, so
   * experiments 108 and 112 run every reading of it on one engine). `damage` is the rule since S-95 and the
   * only one the app ever asks for: a plan is a token field when its march does **less than half the damage
   * the plan's own winning march does**. `winner` is the reading it replaced — half the winner's *fielded
   * hired* — kept named so the measurement behind S-95 can be re-run against the engine that shipped.
   */
  const notToken = (row: PlanTotals): boolean => {
    const rule = input.bandHired ?? { mode: 'damage' as const };
    if (rule.mode === 'none') return true;
    if (rule.mode === 'hired') return hiredOf(row.counts) >= rule.min;
    if (rule.mode === 'burn') return row.repeat.mercLost >= rule.min;
    if (rule.mode === 'damageMin') return row.repeat.damage >= rule.min;
    if (rule.mode === 'winner') return hiredOf(row.counts) * 2 >= goal.hired;
    return row.repeat.damage * 2 >= chosenPoint.repeat.damage;
  };
  /**
   * **The cut: where S-58 B stops asking** (S-99, 2026-09-19; the owner, on the monster camp's chunk bill:
   * *"you can drop when the damage says so"*).
   *
   * S-58 B is *"a plan the player is offered fields a little of everything they hold"* (2026-09-18:
   * *"mercs still are being left out, which I find odd — I prefer to have multiple stacks of mercs, it seems
   * to work best"*), and on every army he plays it is right: a type left out of the bar was a type the grid's
   * zero sample had thrown away for nothing. It stopped being right the day the plan could field a
   * **dominance pool**, where a dozen uncapped types share 900 points and asking for a little of each is an
   * order to split the pool a dozen ways and pay a chunk of ten for every split — on the monster camp, 48 %
   * of a march's monster chunks for 5 % of its damage (`tools/theorycraft/out/113-monster-economy.md` §B).
   *
   * So the rule is kept and given a **cut**, and the cut is measured rather than set:
   *
   *  - the set it is measured over is **the plans the bar could offer if this rule let it** — the undominated
   *    frontier through the band's other three arms (`notToken`, the silver arm, more than one troop stack).
   *    Not every candidate the search priced: a one-troop-stack march is not an answer this rule has any
   *    business weighing, and on most armies it out-hits the winner;
   *  - a plan belongs to **prefix k** when the stocked types its repeated march fields are exactly the first
   *    k of `hiredRanking`. A hole in the middle is no prefix and is weighed with neither family;
   *  - **k is earned** when the strongest campaign of prefix k stands at least as high as the strongest
   *    campaign over **all** of them on the four readings the bar prints — total damage, damage a silver,
   *    damage a hired unit burned and damage a dragon coin — and higher on one. That is the damage saying
   *    so, in the shape S-93 says it in and in the currencies the owner's own goal line is read in. These
   *    four are the one comparison in this file that S-106 left on ratios, and the note on `readings`
   *    below measures what happened when they were tried as figures;
   *  - the cut is the **smallest** earned k — the deepest drop the damage pays for — and the whole hired set
   *    when none is earned, which is every army in this repo that houses no dominance pool (measured, §D of
   *    the same experiment: no prefix of any of them beats the bar on damage at all).
   *
   * **Read on the march a plan repeats**, not on the campaign: a finale is sized from whatever the repeats
   * left and fields it, so campaign-wide every plan on every army fields every type and no prefix could ever
   * be earned. What S-58 B then *asks* of a plan is still the campaign-wide reading it has always asked
   * (`fieldsInCampaign` above); this is only how the two families are told apart when they are weighed.
   *
   * A type **above** the cut is still asked for on every plan the bar offers. A type below it may be left
   * out — or fielded, the search decides — and a plan with a hole *above* the cut is refused as it was.
   */
  const hiredCut = ((): number => {
    if (!refuseDroppedTypes || stockedRanked.length < 2) return stockedRanked.length;
    const offerable = undominated.filter(
      (row) =>
        notToken(row) &&
        row.damagePerSilver * 2 >= goal.perSilver &&
        Object.keys(row.counts).filter((id) => !mercIds.has(id)).length > 1,
    );
    /** The prefix of the stocked ranking a plan's repeated march fields, or −1 when it leaves a hole. */
    const prefixOf = (row: PlanTotals): number => {
      const march = row.sequence?.[0] ?? row.counts;
      return prefixFielded((id) => (march[id] ?? 0) > 0);
    };
    const strongest = (k: number): PlanTotals | undefined =>
      offerable.reduce<PlanTotals | undefined>(
        (held, row) => (prefixOf(row) === k && (!held || row.totalDamage > held.totalDamage) ? row : held),
        undefined,
      );
    const whole = strongest(stockedRanked.length);
    // Nothing the bar could offer fields every type the account holds: there is no full-set answer for a
    // prefix to beat, and the band's own fallback (an empty band draws from the unbanded frontier) handles
    // it, as before.
    if (!whole) return stockedRanked.length;
    /**
     * **These four stay ratios, and S-106 measured why** (2026-09-19). Every other rule that drops a plan
     * moved to the figures that day — `beatsOnFigures`, the two tie-breaks — because a ratio changed when
     * S-105 changed what *damage a hired unit* means, and five bars moved with it on armies where no march
     * had moved. This one did not move: the monster camp earned the same cut of 10 before and after S-105,
     * and its bar is the same bar.
     *
     * It is also the one comparison here that a figures test cannot make, and the reason is what the cut is
     * **for**. A prefix spends the room it frees on more of the types it keeps, so the two families are not
     * two answers to one question — they sit at different places on the frontier. Measured on the monster
     * camp the day this was written, over the plans the bar could offer: the strongest **full-set** campaign
     * is 66 409 153 for 25 764 300 silver, 24 chunks and 31 680 coins, while the prefix-10 family reaches
     * **97 458 367 for 36 436 800, 32 and 28 200** — half again the damage, for 41 % more silver. On the
     * four *figures* no prefix campaign of that camp is behind on none of them (the cheapest that out-damages
     * the full set costs 27 396 900), so the cut is never earned, S-58 B asks for all fourteen types again,
     * and the camp's sweet spot falls **93 298 414 → 66 409 153** with its coins rising 28 200 → 31 680.
     * That is a 28 % regression bought by a consistency the measurement does not support.
     *
     * So the four readings the bar prints are kept — total damage, damage a silver, damage a hired unit
     * burned and damage a dragon coin — and the strongest campaign of prefix k has to stand at least as high
     * as the strongest campaign over all of them on every one of them, and higher on one. The ratios are
     * what makes two campaigns at different spends comparable at all, which is the question this rule asks
     * and **not** the question `beatsOnFigures` asks of two rungs of one ladder.
     */
    const readings = (row: PlanTotals): number[] => [
      row.totalDamage,
      row.damagePerSilver,
      row.damagePerMercenary,
      row.damagePerDragonCoin,
    ];
    const mark = readings(whole);
    for (let k = 1; k < stockedRanked.length; k += 1) {
      const best = strongest(k);
      if (!best) continue;
      const theirs = readings(best);
      if (
        theirs.every((value, index) => value >= (mark[index] ?? 0)) &&
        theirs.some((value, index) => value > (mark[index] ?? 0))
      ) {
        return k;
      }
    }
    return stockedRanked.length;
  })();
  /** The stocked types every plan the bar offers still has to field: the ranking down to the cut (S-99). */
  const required = stockedRanked.slice(0, hiredCut);
  /**
   * **What a stop may fill with** (S-99): every hired type the account holds, less the ones under the cut.
   * Identical to the whole hired set on every army that earns no cut, which is every army in this repo that
   * houses no dominance pool.
   *
   * It is read by the `all-in` alone, and that stop is where it has to be read. *"All the mercs you can
   * safely field"* is a sentence about the stock worth fielding: with nothing to stop it the stop fills the
   * pool with the types the cut has just said cost more than they bring, and on the monster camp that is the
   * difference between a stop the bar carries and one the steady max beats on damage, silver and burn at
   * once. Every other stop is a plan off the frontier, where the cut is a **permission** and the search
   * decides — a type under it may be fielded or left out, whichever the damage prefers.
   */
  const fillable = new Set(
    mercTypes
      .filter((entry) => !stocked.includes(entry) || required.includes(entry))
      .map((entry) => entry.id),
  );
  /**
   * The hired units a march fields **of the stock a stop fills with** (S-99) — `hiredOf` read over
   * `fillable` instead of over every hired type. It is what the `all-in`'s offer rule compares, on both
   * sides: the stop fills the pool with the types the cut keeps, so counting the types under the cut on the
   * steady max's side of that comparison and not on the all-in's would be weighing two different stocks. The
   * same figure as `hiredOf` on every army that earns no cut.
   */
  const filledOf = (counts: Record<string, number>): number =>
    Object.entries(counts).reduce((sum, [id, count]) => sum + (fillable.has(id) ? count : 0), 0);
  const inBand = (row: PlanTotals): boolean =>
    notToken(row) &&
    row.damagePerSilver * 2 >= goal.perSilver &&
    Object.keys(row.counts).filter((id) => !mercIds.has(id)).length > 1 &&
    // S-58 B (`refuseDroppedTypes`), down to the cut S-99 measures: a plan the player is offered fields a
    // little of everything they hold, bar the types the damage says to drop (`required`).
    (!refuseDroppedTypes || required.every((entry) => fieldsRequired(row, entry.id)));

  /**
   * **The plans the four answers are drawn from.** The band is the owner's instruction of 2026-09-15 —
   * *"well just don't show the extremes, if we use a certain % of mercs or waay too much silver we're too far
   * off from our goal of everything optimized"* — and every threshold is measured against the plan itself,
   * never a free-standing number, so the plan is always inside it. A plan is near the goal when its march is
   * not a token field and not a silver sink:
   *
   *   **the goal** — its march does at least **half the damage the plan's own winning march does** (S-95:
   *   *"we're too far off from our goal"* is a sentence about the goal, and the goal is damage; a count of
   *   hired units is not); **silver** — it returns at least **half the plan's own damage a silver**; and
   *   **the march** itself must be more than a single troop stack (experiment 72's criterion, and the
   *   owner's own "the least silver plan would never be chosen … is not a strategy").
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
      /**
       * **A put-back is sheltered like every other march** (S-87). MS sizes every stack to a matched HP, hired
       * stacks included, so its hired stacks land *at* the troop line rather than under it — the very place the
       * enemy strikes first. They are lowered to just under the lowest rung (`shelterUnder`), which is the same
       * direction this pass already moves them: a put-back fields at most the counts it was capped by, so the
       * burn can only fall and the sustain, the repeats and the finale the row already had all still hold.
       */
      const mercs = shelterUnder(
        rungs,
        // Every pool but `leadership`, as everywhere else the shelter is applied (S-96).
        picked.filter((stack) => stack.entry.pool !== 'leadership'),
      ).filter((stack) => stack.count > 0);
      // A march on one troop stack is the extreme the band refuses ("not a strategy", owner 2026-09-15); a
      // put-back that collapsed onto one would walk it back onto the bar through this pass.
      if (rungs.length < 2) continue;
      // The sustain, the same test the search applies to every vector it scores: a count the stock cannot
      // field every march of the run burns mercenaries the account does not have.
      if (mercs.some((merc) => lastsMarches(sustain[merc.entry.id] ?? 0, merc.count) < repeats)) continue;
      // What the march fields, once the hired stacks are sheltered — `picked` was what the sizer proposed.
      const fields = [...rungs, ...mercs];
      const counts: Record<string, number> = {};
      for (const stack of fields) counts[stack.entry.id] = stack.count;
      const campaign: PlanTotals = {
        ...row,
        counts,
        ...(row.sequence ? { sequence: [counts, ...row.sequence.slice(1)] } : {}),
      };
      // S-58 B, down to S-99's cut: the bar never offers a plan with a hole in it above the cut, and MS may
      // size a hired stack down to nothing.
      if (refuseDroppedTypes && !required.every((entry) => fieldsRequired(campaign, entry.id))) continue;
      // The shelter, read back off the march this pass will price (S-87; it was the `all-in`'s own test alone,
      // because that stop is *"all the mercs you can safely field"*). `shelterUnder` has just lowered every
      // hired stack under the lowest rung, so this refuses only a march it could not: one whose first hired
      // unit is already over the troop line.
      const floor = Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
      const hiredTop = Math.max(0, ...mercs.map((merc) => merc.count * merc.entry.hp));
      if (floor <= hiredTop) continue;
      const march = toMarch(rungs, mercs, marchOf(fields, enemyStacks));
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
      // The hired stacks' own damage moves with the march exactly as the campaign's damage does (S-105):
      // the repeats are the marches that changed, and neither the finale nor the tail is one of them.
      const hiredDamage = row.hiredDamage + repeats * (march.hiredDamage - row.repeat.hiredDamage);
      const campaignSilver = row.silver + repeats * (march.silver - row.repeat.silver);
      const mercLost = row.mercLost + repeats * (march.mercLost - row.repeat.mercLost);
      const campaignCoins = row.dragonCoins + repeats * (march.dragonCoins - (row.repeat.dragonCoins ?? 0));
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
          hiredDamage,
          silver: campaignSilver,
          gold: row.gold + repeats * (march.gold - row.repeat.gold),
          dragonCoins: campaignCoins,
          seconds: row.seconds + repeats * (march.seconds - row.repeat.seconds),
          mercLost,
          repeat: {
            damage: march.damage,
            hiredDamage: march.hiredDamage,
            silver: march.silver,
            gold: march.gold,
            dragonCoins: march.dragonCoins,
            seconds: march.seconds,
            mercLost: march.mercLost,
          },
          damagePerSilver: campaignSilver > 0 ? totalDamage / campaignSilver : Infinity,
          damagePerMercenary: mercLost > 0 ? hiredDamage / mercLost : Infinity,
          damagePerDragonCoin: campaignCoins > 0 ? totalDamage / campaignCoins : Infinity,
          putBack: { unitId: extra.id, damage, silver, seconds },
        },
      };
    }
    return best?.row;
  };

  /**
   * **The tighter shape** (S-93; owner, 2026-09-19: *"using Troops first I can get 2 009 810 … by adding back
   * troops, impossible with Complete optimization … also no eco silver spot to allow me to maximize
   * silver/dmg with lower silver and training time whilst preserving merc spent low. I thought we had tests
   * for this."*).
   *
   * The same march, re-sized by the **sizer over a prefix of the troop ranking** — its own hired counts as the
   * caps, one prefix at a time, under each of the three methods — and taken only when the result is at least
   * as good on **every one of the four readings the bar and the recap print**: damage, silver, the stock
   * burned and the training queue, with one of them strictly better. No exchange rate and no cap: this pass
   * has nothing to trade, because a march that is behind on none of the four is simply the same answer done
   * better.
   *
   * **Why the search cannot find these itself.** Its two shapes are a ladder over a prefix and the sizer over
   * *every* troop type (`sizer`, `evaluateVector`). Nobody ever asked the sizer for a **prefix**, and that is
   * the family a player builds by hand: "Troops first" leaves the low tiers out, and he puts them back one
   * tier at a time. Measured on his own camp of 2026-09-19 (`tools/theorycraft/out/108-thrift-end.md`): the
   * bar's "more mercs" rung was 2 479 800 a march for 2 775 600 silver, 5 burned and 13d 18h of queue, and
   * the sizer over five of his seven troop types with the same five chunks is **2 509 413 for 2 321 200 and
   * 8d 21h** — more damage, 16 % less silver, 35 % less queue, the same stock. The criterion
   * `tests/engine/plan-criteria.test.ts` holds it on every army, and it is the owner's own sentence turned
   * into a test.
   *
   * It runs where the put-back runs and just before it, on the burn ladder and then on the two stops the
   * ladder does not carry, so a stop is chosen on the march the player is offered. A row it replaces keeps its
   * place on the ladder and is **not** registered in `generatedOf`: the put-back can be handed its old march
   * back because it spends damage, and this one never does.
   *
   * **The finale is not re-sized, and that is safe rather than free** (the same reading the put-back makes of
   * itself, above). A finale is sized from the stock the repeats leave — `stock − repeats × chunks(count)`,
   * worked out when the candidate was scored — and a tightened march is behind on **none** of the four
   * readings, the stock burned included, so its repeats leave **at least** as much as the finale was sized
   * for. The finale therefore stays feasible and affordable, and `marches`, `finaleCounts` and the finale's
   * own figures do not move; what it does not do is spend the stock the tightening freed. Measured over the
   * thirteen armies of `tests/engine/plan-criteria.test.ts`, 2026-09-19: the burn moves on **one** of them,
   * the owner's export at 12 000 — its silver saver 11 → 9 burned and its steady max 19 → 17, three repeats
   * each — so at most **6 hired units** of that account's 254 are left in the barracks that the finale could
   * have fielded. On the other twelve the tightened rows burn exactly what they burned and there is nothing
   * to spend. Re-sizing it would mean re-running `finaleFor`, which lives inside the scorer and is keyed on a
   * ladder depth and scale a prefix-sizer shape has no name for; the under-use is recorded here instead.
   */
  const tighterShape = (row: TradeRow): TradeRow | undefined => {
    // Repeated rows only. The one row of a plan whose marches all differ is the `all-in`, and it is built
    // march by march by its own builder — which scores these same prefix shapes itself; a pass that moved its
    // first march alone would leave the marches behind it sized against a stock the first no longer spends.
    if (!sizerShape || row.sequence) return undefined;
    const repeats = row.marches - (row.finaleCounts ? 1 : 0);
    if (repeats < 1) return undefined;
    const asked = mercTypes
      .map((entry) => ({ entry, count: row.counts[entry.id] ?? 0 }))
      .filter((merc) => merc.count > 0);
    if (asked.length === 0) return undefined;
    let best: TradeRow | undefined;
    for (let prefix = 1; prefix <= troops.length; prefix += 1) {
      for (const [key, method] of Object.entries(SIZER_DEPTHS)) {
        const sized = sizer(asked, method, prefix);
        const rungs = sized.rungs;
        const mercs = sized.mercs.filter((merc) => merc.count > 0);
        // A march on one troop stack is the extreme the band refuses (owner, 2026-09-15: "not a strategy").
        if (rungs.length < 2 || mercs.length === 0) continue;
        if (mercs.some((merc) => lastsMarches(sustain[merc.entry.id] ?? 0, merc.count) < repeats)) continue;
        const floor = Math.min(...rungs.map((rung) => rung.count * rung.entry.hp));
        const hiredTop = Math.max(0, ...mercs.map((merc) => merc.count * merc.entry.hp));
        if (floor <= hiredTop) continue;
        const fields = [...rungs, ...mercs];
        const counts: Record<string, number> = {};
        for (const stack of fields) counts[stack.entry.id] = stack.count;
        const campaign: PlanTotals = { ...row, counts };
        // S-58 B, down to S-99's cut: the bar never offers a plan with a hole in it above the cut.
        if (refuseDroppedTypes && !required.every((entry) => fieldsRequired(campaign, entry.id))) continue;
        const march = toMarch(rungs, mercs, marchOf(fields, enemyStacks));
        if (
          march.damage < row.repeat.damage ||
          march.silver > row.repeat.silver ||
          march.seconds > row.repeat.seconds ||
          march.mercLost > row.repeat.mercLost
        ) {
          continue;
        }
        if (
          march.damage === row.repeat.damage &&
          march.silver === row.repeat.silver &&
          march.seconds === row.repeat.seconds &&
          march.mercLost === row.repeat.mercLost
        ) {
          continue;
        }
        if (best && best.repeat.damage >= march.damage) continue;
        const totalDamage = row.totalDamage + repeats * (march.damage - row.repeat.damage);
        // The hired stacks' own damage, moved with the march the same way (S-105).
        const hiredDamage = row.hiredDamage + repeats * (march.hiredDamage - row.repeat.hiredDamage);
        const campaignSilver = row.silver + repeats * (march.silver - row.repeat.silver);
        const mercLost = row.mercLost + repeats * (march.mercLost - row.repeat.mercLost);
        const campaignCoins = row.dragonCoins + repeats * (march.dragonCoins - (row.repeat.dragonCoins ?? 0));
        const hired = Object.values(march.mercFielded).reduce((sum, count) => sum + count, 0);
        best = {
          ...campaign,
          label:
            `${rungs.length} ${rungs.length === 1 ? 'stack' : 'stacks'} · ${hired} hired · ` +
            `${compact(march.silver)} silver a march`,
          shape: SIZER_DEPTHS[Number(key)] ?? 'ladder',
          totalDamage,
          hiredDamage,
          silver: campaignSilver,
          gold: row.gold + repeats * (march.gold - row.repeat.gold),
          dragonCoins: campaignCoins,
          seconds: row.seconds + repeats * (march.seconds - row.repeat.seconds),
          mercLost,
          repeat: {
            damage: march.damage,
            hiredDamage: march.hiredDamage,
            silver: march.silver,
            gold: march.gold,
            dragonCoins: march.dragonCoins,
            seconds: march.seconds,
            mercLost: march.mercLost,
          },
          damagePerSilver: campaignSilver > 0 ? totalDamage / campaignSilver : Infinity,
          damagePerMercenary: mercLost > 0 ? hiredDamage / mercLost : Infinity,
          damagePerDragonCoin: campaignCoins > 0 ? totalDamage / campaignCoins : Infinity,
        };
      }
    }
    return best;
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
    for (const rung of ladderRows) {
      // S-93, three steps in one: the tighter shape, so the put-back is offered the better march; the
      // put-back; and the tighter shape **again** on what it left, because a put-back spends damage for
      // silver and queue and can land on a march a prefix of the sizer beats on all four readings at once
      // (measured on his camp of 2026-09-19: the "more mercs" rung's Spearman II put-back, 2 479 800 for
      // 2 775 600 and 13d 18h, against the sizer over five of his seven types at 2 509 413 for 2 321 200
      // and 8d 21h with the same fifty hunters). A row the second pass moves is no longer the put-back's
      // march, so it drops the note; the march it was **generated** from is still kept, because the bar's
      // own "burning more buys more" guard may still have to hand it back.
      const row = tighterShape(rung) ?? rung;
      const replaced = putBackOn(row);
      const taken = replaced ?? row;
      const tightened = tighterShape(taken);
      const improved = tightened ?? taken;
      if (replaced) generatedOf.set(improved, row);
      if (tightened && replaced) improved.putBack = undefined;
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
   * **Damage a silver, on the march a stop repeats.** Still a ratio, and still read by the rules that ask
   * *"is this stop a saving?"* — the silver saver's own definition below and `bestFor.silver`.
   */
  const perSilver = (row: PlanTotals): number =>
    row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
  /**
   * **Damage a hired unit, on the march a stop repeats** — the hired stacks' own share of that march's worst
   * opening over the chunks of ten it loses for good (S-105, 2026-09-19; the owner: *"dmg per hired is still
   * broken: it shows a damage per hired almost above total damage"*). It read `repeat.damage`, the whole
   * march's, until then.
   *
   * **It is a printed column and `bestFor.hired`, and no longer a rule that drops a stop** (S-106,
   * 2026-09-19): see `beatsOnFigures` under it.
   */
  const perHired = (row: PlanTotals): number =>
    row.repeat.mercLost > 0 ? row.repeat.hiredDamage / row.repeat.mercLost : 0;
  /**
   * **One march beats another when it is behind on none of the figures it prints** (S-106, 2026-09-19; the
   * owner, the morning after S-105 redefined damage a hired unit: *"it seems the last change made us lose
   * some of the stops on the slider. I only get sweet spot and steady max in my usual setup"*).
   *
   * The rule under it was *"a rung nothing beats on both efficiencies"* (owner, 2026-09-17, reading his own
   * bar: *"12 hired lost got better silver/dmg, better dmg/merc and almost the same damage"* than the sweet
   * spot at 15). What he was pointing at is a **dominated** plan: another rung of the same ladder that is
   * not worse on anything he pays and better on something he gets. A pair of **ratios** is not that test —
   * both of them carry the same numerator, so a change in how the damage is attributed moves both
   * denominators' quotients at once and re-orders rungs nobody's march moved. S-105 changed exactly that
   * numerator for `perHired` (the whole march's damage → the hired stacks' own), and five bars moved with
   * it: the evening account and his 450-hunter camp lost their silver saver, the monster camp lost its
   * *more mercs*, and two more-mercs rungs slid along the burn axis. No plan on any of those armies became
   * a worse march that day.
   *
   * So the rules that **drop** a plan judge on the figures a stop prints, which is the reading S-93's
   * `tighterShape` and S-94's all-in offer already make and the one the criteria are written in: a march is
   * beaten when another has **at least its damage and at most each of its four costs** — silver, the burn,
   * the gold and the dragon coins (S-122; it read the first two alone until then) — with one of the five
   * strictly better. Nothing is traded against anything, so no exchange rate has to exist; and a figure that
   * is a measurement rather than an attribution cannot be moved by re-reading a column.
   *
   * Read on the **repeated march** here (`repeat`), which is what the bar's order, its chord and its two
   * ends are read on. The campaign's own figures break ties, below.
   */
  /**
   * **The costs a march charges, all four of them** (S-122, 2026-09-22; the owner, 2026-09-21: *"beat means
   * using constrained resources to produce better damage with a fixed **silver/merc/gold/dragon coins**
   * set"*).
   *
   * This read **silver and the burn** and nothing else, which made it a dominance test on two of the four
   * currencies a march actually spends. A rung that cost the same silver and the same hired chunks for the
   * same damage but **twice the gold**, or twice the dragon coins, was declared its neighbour's equal and
   * removed from the pool — the two prices the monsters are paid in were invisible to the one rule that
   * decides which rungs the sweet spot is read off.
   *
   * `dragonCoins` is optional on `PlanRepeat` and reads 0 where it is absent, which is every army that
   * houses no dominance unit; on those the test is exactly what it was, because gold moves with the burn
   * there and a pair that ties on both ties on it.
   */
  const costsOf = (row: PlanTotals): number[] => [
    row.repeat.silver,
    row.repeat.mercLost,
    row.repeat.gold,
    row.repeat.dragonCoins ?? 0,
  ];
  /**
   * **One march beats another when it is behind on none of the figures it prints** — at least its damage, at
   * most each of its four costs, and strictly better on one of the five.
   */
  const beatsOnFigures = (other: PlanTotals, row: PlanTotals): boolean => {
    const mine = costsOf(other);
    const theirs = costsOf(row);
    if (other.repeat.damage < row.repeat.damage) return false;
    if (mine.some((cost, index) => cost > (theirs[index] ?? 0))) return false;
    return other.repeat.damage > row.repeat.damage || mine.some((cost, index) => cost < (theirs[index] ?? 0));
  };
  /**
   * **The rungs no other rung beats on the figures** (S-106). The two ends keep their places by definition;
   * what this removes from the sweet spot's pool is a rung the ladder itself answers better — same burn or
   * less, same silver or less, and as much damage.
   */
  const efficientRows = ladderRows.filter(
    (row) => !ladderRows.some((other) => other !== row && beatsOnFigures(other, row)),
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
   * So a tie is broken by the campaign's own figures (S-106, 2026-09-19, replacing the campaign's two
   * *ratios*): **the harder campaign wins, and the cheaper one where the damage ties** — `totalDamage` then
   * `silver` over the whole run, repeats and finale and tail, not the repeated march alone. The two things a
   * player compares two whole plans by, in his own order, and neither of them moves when a column is
   * re-attributed. Only when the two campaigns are the same damage for the same silver does thrift decide,
   * as it always did. Two plans at the *same* burn are still told apart by the repeated march's damage.
   *
   * On the tie this note was written for (his export at 7 000 with the capped sponge march), the 11 is still
   * the answer: 22 045 361 damage against the 10's 20 684 777, which is the same choice the two ratios made.
   */
  const middleOfRange = (rows: TradeRow[]): TradeRow => {
    const burns = rows.map((row) => row.repeat.mercLost);
    const middleBurn = (Math.min(...burns) + Math.max(...burns)) / 2;
    return rows.reduce<TradeRow>((held, row) => {
      const away = Math.abs(row.repeat.mercLost - middleBurn);
      const heldAway = Math.abs(held.repeat.mercLost - middleBurn);
      if (away < heldAway) return row;
      if (away > heldAway) return held;
      if (row.repeat.mercLost !== held.repeat.mercLost) {
        if (row.totalDamage !== held.totalDamage) return row.totalDamage > held.totalDamage ? row : held;
        if (row.silver !== held.silver) return row.silver < held.silver ? row : held;
        return row.repeat.mercLost < held.repeat.mercLost ? row : held;
      }
      return row.repeat.damage > held.repeat.damage ? row : held;
    }, rows[0] ?? chosenPoint);
  };

  /**
   * **The sweet spot is the knee of damage against burn** over the rungs nothing beats on the figures (owner,
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
   * **The march a campaign plays once its hired stock is spent**: the Elite sizer over every troop type, with
   * no mercenary in the request, priced by `toMarch` exactly as every other march here is — so its silver and
   * its seconds are the recap's.
   *
   * `elite` names the method because the app's own default does; with nothing hired to preserve, all three
   * methods sized the same march to the unit on every army measured (2026-09-19). It is the **same** march
   * whatever stop is asking for it — the army's best march with nothing hired in it is one question, not five
   * — so it is sized **once** a plan and handed to the `all-in`'s sequence (S-81) and to every repeated stop
   * the horizon outruns (S-89) alike. Lazily, because a plan whose stops all fill the horizon never needs it
   * and `sizeStacks` is not free. `null` for an army with no troop type to field: then a campaign is as short
   * as its stock, exactly as it was.
   */
  let sizedTail: PlanMarch | null | undefined;
  const troopsOnlyMarch = (): PlanMarch | null => {
    if (sizedTail === undefined) {
      const sized = sizer([], 'elite');
      sizedTail = sized.rungs.length > 0 ? toMarch(sized.rungs, [], marchOf(sized.rungs, enemyStacks)) : null;
    }
    return sizedTail;
  };
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
        housing: request.housing,
        enemyStacks,
        gap,
        finale: false,
        ...(sizerShape ? { sizer } : {}),
        winnerRungs: () => winnerRungs,
        sustain,
      });
      /**
       * Every shape this stop may play at one hired vector — the ladders, the winner's own rungs, the sizer
       * under each method over the whole army and (S-93) over each prefix of the troop ranking — each of
       * them sheltered, judged the way this stop judges: **the most of the stock fielded first, the most
       * damage with it second**, and on a tie in both, the cheaper march. `seed` is what it has to beat.
       */
      /**
       * How this stop tells two shapes of one march apart: **the most of the stock fielded first, the most
       * damage with it second** (owner, 2026-09-18: *"a last stop: all mercs possible … fill all the mercs
       * you can safely"*).
       */
      const fieldsMost = (candidate: Candidate, held: Candidate | null): boolean =>
        !held ||
        hiredOfVector(candidate.mercs) > hiredOfVector(held.mercs) ||
        (hiredOfVector(candidate.mercs) === hiredOfVector(held.mercs) && candidate.total > held.total);
      const strongest = (
        counts: Record<string, number>,
        seed: Candidate | null,
        keep: (candidate: Candidate, held: Candidate | null) => boolean = fieldsMost,
      ): Candidate | null => {
        let found = seed;
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
            // Every shape the scorer answers with is sheltered since S-87 (`shelterUnder`), so this is the
            // rule read back off the shape rather than the one place it is applied — which is what it was
            // when this stop alone was *"all the mercs you can safely field"*.
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
            if (keep(candidate, found)) found = candidate;
          }
        }
        /**
         * **And the sizer over each prefix of the troop ranking** (S-93), at this share and no other. The
         * loop above asks the sizer for the whole army and the ladders for a prefix; nobody asked the
         * **sizer** for a prefix, and that is the family the owner builds by hand — *"using Troops first I
         * can get 2 009 810 … by adding back troops, impossible with Complete optimization"*. Measured
         * before it was added (`out/108-thrift-end.md`): this stop's first march was beaten on all four
         * readings at once — damage, silver, the stock burned and the training queue — on four of the
         * thirteen armies, by nothing more exotic than the sizer over five, six, seven or nine of their
         * troop types.
         *
         * **Inside the share walk, and dominated candidates refused** (2026-09-19, the validator's D1). It
         * ran after the walk and always asked at the **whole** remaining stock, so on an army whose ladders
         * only shelter a fraction of it a prefix shape came back with more hired units than the walk had
         * settled on and took the row on the "most of the stock first" tie-break whatever it cost: measured
         * on the owner's evening account, the campaign went 29 111 661 for 17 179 200 silver and 78 burned
         * to **28 647 490 for 24 858 800 and 175** — less damage for 45 % more silver and 2.2× the stock,
         * a row the "more mercs" stop beside it beat on all three at once. Asking at the walk's own share
         * puts the two families on the same question; and a candidate the one already found beats on damage,
         * silver **and** the stock burned is refused outright, which is the bar's own rule
         * (`tests/engine/plan-criteria.test.ts`, "no stop of the bar is beaten by another stop of the same
         * bar") stated where the choice is made.
         */
        for (let prefix = 1; prefix <= troops.length && sizerShape; prefix += 1) {
          for (const [key, method] of Object.entries(SIZER_DEPTHS)) {
            const asked = mercTypes
              .map((entry) => ({ entry, count: counts[entry.id] ?? 0 }))
              .filter((merc) => merc.count > 0);
            if (asked.length === 0) break;
            const sized = sizer(asked, method, prefix);
            const fielded = sized.mercs.filter((merc) => merc.count > 0);
            // More than one troop stack, the band's own third criterion: a mountain of hired units under a
            // single stack is the extreme the owner refuses ("not a strategy"), and on his camp of
            // 2026-09-19 the sizer over one type would have put 450 hunters behind 2 487 Rider III.
            if (sized.rungs.length < 2 || fielded.length === 0) continue;
            const troopFloor = Math.min(...sized.rungs.map((rung) => rung.count * rung.entry.hp));
            const hiredTop = Math.max(...fielded.map((merc) => merc.count * merc.entry.hp));
            if (troopFloor <= hiredTop) continue;
            const march = marchOf([...sized.rungs, ...fielded], enemyStacks);
            // Beaten by the shape already found on all three of the campaign's own figures: not an offer.
            if (
              found &&
              found.march.damage >= march.damage &&
              found.march.silver <= march.silver &&
              found.march.mercLost <= march.mercLost
            ) {
              continue;
            }
            const candidate: Candidate = {
              marches: 1,
              mercs: fielded,
              rungs: sized.rungs,
              march,
              finale: null,
              finaleRungs: [],
              finaleMercs: [],
              total: march.damage,
              depth: Number(key),
              scale: 1,
            };
            if (keep(candidate, found)) found = candidate;
          }
        }
        return found;
      };
      let found: Candidate | null = null;
      for (let share = 1; share > 0.04 && !found; share -= 0.05) {
        const counts: Record<string, number> = {};
        let any = false;
        for (const entry of mercTypes) {
          // S-99: the types under the cut are not filled with — see `fillable`.
          const count = fillable.has(entry.id) ? Math.floor((remaining[entry.id] ?? 0) * share) : 0;
          counts[entry.id] = count;
          if (count > 0) any = true;
        }
        if (!any) break;
        found = strongest(counts, found);
      }
      if (!found) break;
      /**
       * **Re-sized at the vector it settled on** (S-97, 2026-09-19; the validator: the honest answer to a
       * stop that is behind on every figure is *"re-size it at its burn"*, because what it exists to do is
       * field the most hired the troops shelter).
       *
       * The walk above asks each shape *"how much of the remaining stock can you shelter?"* at a share of
       * the stock, and answers with the shape that shelters the most — a question about the **hired**
       * count, in which a ladder sized off a whole 95 % of the stock is scored, and its silver is whatever
       * it is. Nobody then asked the other half: *"now that this is what the march fields, what is the best
       * shape for it?"* The ladders and the winner's rungs re-sized off the **fielded** stack are smaller
       * and cheaper than the ones sized off the share, and the sizer's prefixes are sized against the real
       * caps rather than against a share of them — so this is the same march asked for properly, and it
       * can only field at least as much hired stock as the walk settled on (the rule below is the walk's
       * own). Measured on the owner's *"Aydae alone"* camp (experiment 111 §C) and on the two armies where
       * the stop was being dropped outright, the 12 000 export and his live camp of 2026-09-18.
       */
      const settled: Candidate = found;
      const pinned: Record<string, number> = {};
      for (const merc of settled.mercs) pinned[merc.entry.id] = merc.count;
      /**
       * Judged the way S-93's `tighterShape` judges a rung, and for the same reason: a march that is behind
       * on **none** of the readings it prints is the same answer done better, so there is nothing to trade
       * and no rate to set. The readings here are the **four** this stop is made of — the hired units it
       * fields, the chunks of stock it burns, its damage and its silver — with one of them strictly better.
       * (Not the training queue, which is S-93's fourth: `marchOf` does not price it, and a stop built march
       * by march has no repeat for it to be read off.)
       *
       * **The chunks are one of the four and not a side condition** (2026-09-19, the validator): a shape
       * that fields the same hired for the same damage and the same silver while burning **fewer** chunks is
       * strictly better in the one resource that does not come back, and reading the strictness off the
       * other three alone would refuse it. The cap below it — no more chunks than the march it replaces —
       * is the half that protects the marches behind this one, which are sized on what it leaves: measured
       * on the owner's live camp of 2026-09-18 without it, the sequence's first march gained and the
       * campaign lost, 11 815 339 → 10 899 547 for 130 → 133 chunks burned.
       */
      const tighter = (candidate: Candidate, held: Candidate | null): boolean => {
        if (hiredOfVector(candidate.mercs) < hiredOfVector(settled.mercs)) return false;
        if (candidate.march.mercLost > settled.march.mercLost) return false;
        if (candidate.march.damage < settled.march.damage) return false;
        if (candidate.march.silver > settled.march.silver) return false;
        if (
          candidate.march.damage === settled.march.damage &&
          candidate.march.silver === settled.march.silver &&
          candidate.march.mercLost === settled.march.mercLost &&
          hiredOfVector(candidate.mercs) === hiredOfVector(settled.mercs)
        ) {
          return false;
        }
        return (
          !held ||
          candidate.march.damage > held.march.damage ||
          (candidate.march.damage === held.march.damage &&
            (candidate.march.silver < held.march.silver ||
              (candidate.march.silver === held.march.silver &&
                candidate.march.mercLost < held.march.mercLost)))
        );
      };
      found = strongest(pinned, null, tighter) ?? settled;
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
     * **The marches the spent stock leaves over**: `troopsOnlyMarch` above, once, repeated for each of them.
     * Since S-89 it is the same march the repeated stops play when the horizon outruns *their* stock, sized
     * once a plan and shared — the army's best march with nothing hired in it is one question. An army with
     * no troop type to field has no tail, and the campaign is as short as it was.
     */
    if (marches.length < planned) {
      const tail = troopsOnlyMarch();
      if (tail) {
        while (marches.length < planned) marches.push(tail);
      }
    }
    const head = marches[0] as PlanMarch;
    const totalDamage = marches.reduce((sum, march) => sum + march.damage, 0);
    // The hired stacks' own damage over the whole sequence (S-105), summed march by march like the damage
    // above it: the troops-only marches this sequence ends on field no hired stack and add nothing.
    const hiredDamage = marches.reduce((sum, march) => sum + march.hiredDamage, 0);
    const silver = marches.reduce((sum, march) => sum + march.silver, 0);
    const gold = marches.reduce((sum, march) => sum + march.gold, 0);
    const dragonCoins = marches.reduce((sum, march) => sum + march.dragonCoins, 0);
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
      hiredDamage,
      silver,
      gold,
      dragonCoins,
      seconds,
      mercLost,
      repeat: {
        damage: head.damage,
        hiredDamage: head.hiredDamage,
        silver: head.silver,
        gold: head.gold,
        dragonCoins: head.dragonCoins,
        seconds: head.seconds,
        mercLost: head.mercLost,
      },
      shape: first.depth === WINNER_RUNGS_DEPTH ? 'winner' : (SIZER_DEPTHS[first.depth] ?? 'ladder'),
      marches: marches.length,
      damagePerSilver: silver > 0 ? totalDamage / silver : Infinity,
      // Damage a hired unit: the hired stacks' own damage over the chunks they cost (S-105).
      damagePerMercenary: mercLost > 0 ? hiredDamage / mercLost : Infinity,
      damagePerDragonCoin: dragonCoins > 0 ? totalDamage / dragonCoins : Infinity,
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
   * "beaten" test is taken among the marches left of the sweet spot only: the tight ladders of one account
   * share one shape and so one pair of ratios to the third decimal, and against the whole band the dearest
   * of them beat every cheaper one by a hair (measured on the owner's live account: 1.0706 a silver and
   * 962 801 a hired at 60 hunters against 1.0708 and 962 605 at 40), which left no least-silver stop at all.
   * Equal silver is allowed and the fewest burned breaks the tie; absent when nothing qualifies.
   *
   * **And "beaten" is read on the figures** (S-106, 2026-09-19; the owner: *"it seems the last change made
   * us lose some of the stops on the slider"*): another march left of the sweet spot with at least this
   * one's damage, at most its silver and at most its burn (`beatsOnFigures`). It was the same pair of
   * ratios the efficient rungs used, and when S-105 re-read one of them the **evening account and his
   * 450-hunter camp lost their silver saver** without a single march changing — the thrift end was dropped
   * because a dearer march now printed a larger quotient, not because it was a better march. A stop the bar
   * exists to offer is not removed by an attribution.
   */
  const leftOfSweet = candidates.filter(
    (row) =>
      row.repeat.mercLost < sweetSpotBase.repeat.mercLost &&
      row.repeat.silver <= sweetSpotBase.repeat.silver &&
      perSilver(row) >= perSilver(sweetSpotBase),
  );
  const beaten = (row: PlanTotals): boolean =>
    leftOfSweet.some((other) => other !== row && beatsOnFigures(other, row));
  const leastSilver = leftOfSweet
    .filter((row) => !beaten(row))
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
   * everything. Two rungs equally near are told apart by the **campaign's own figures**, damage then silver
   * (S-106), exactly as the middle rule above breaks its tie: it read damage a hired unit until 2026-09-19,
   * and when S-105 re-attributed that column the monster camp's *more mercs* vanished and the 7 000 export's
   * and live camp's landed on a different rung, on ladders where no march had moved.
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
      if (away < held) {
        pick = row;
        continue;
      }
      if (away > held || !pick) continue;
      if (row.totalDamage !== pick.totalDamage) {
        if (row.totalDamage > pick.totalDamage) pick = row;
        continue;
      }
      if (row.silver < pick.silver) pick = row;
    }
    return pick;
  })();
  offer(sweetSpotBase, 'sweet-spot');
  offer(top, 'steady-max');
  offer(leastSilver, 'silver-saver');
  offer(moreMercs, 'more-mercs');
  /**
   * **The fewest hired units burned the band holds** (W10, `CampaignInput.burnSaver`). Offered after the
   * ladder's stops so that none of them loses its row to it: when the fewest-burn plan already stands on the
   * bar under another name, `offer` refuses the duplicate and the bar is what it was.
   */
  const burnSaver = ((): TradeRow | undefined => {
    const rule = input.burnSaver;
    if (rule === undefined) return undefined;
    // `candidates` is sorted cheapest first, so on a tie the first row met is the cheaper one.
    let pick: TradeRow | undefined;
    for (const row of candidates) {
      if (!pick || row.mercLost < pick.mercLost) {
        pick = row;
        continue;
      }
      if (row.mercLost > pick.mercLost) continue;
      if (rule === 'damage') {
        if (row.totalDamage !== pick.totalDamage) {
          if (row.totalDamage > pick.totalDamage) pick = row;
          continue;
        }
        if (row.silver < pick.silver) pick = row;
      } else if (row.silver < pick.silver || (row.silver === pick.silver && row.totalDamage > pick.totalDamage)) {
        pick = row;
      }
    }
    return pick;
  })();
  offer(burnSaver, 'burn-saver');
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
  if (allIn && top && filledOf(allIn.counts) > filledOf(top.counts)) offer(allIn, 'all-in');

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
    const topHired = top ? filledOf(top.counts) : 0;
    for (let index = 0; index < stops.length; index += 1) {
      const stop = stops[index] as PlanRow;
      if (stop.putBack !== undefined) continue;
      // S-93, the same three steps as on the ladder. `tighterShape` answers nothing for the `all-in` (its
      // marches all differ and its own builder scores these prefix shapes); `keeps` holds that stop's own
      // rule through the put-back, as it always did.
      const keeps = (row: PlanTotals): boolean => stop.pick !== 'all-in' || filledOf(row.counts) > topHired;
      const first = tighterShape(stop);
      if (first && keeps(first)) stops[index] = { ...stop, ...first };
      const before = stops[index] as PlanRow;
      const replaced = putBackOn(before);
      const taken = replaced && keeps(replaced) ? { ...before, ...replaced } : before;
      const tightened = tighterShape(taken);
      const put: PlanRow =
        tightened && keeps(tightened) ? { ...taken, ...tightened, putBack: undefined } : taken;
      if (replaced && keeps(replaced)) generatedOf.set(put, before);
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
      // The rows this may hand back are the ones a pass re-sized (`generatedOf`) — the put-back's, and since
      // S-93 a put-back the tighter shape moved on afterwards, which carries no note of its own.
      if (current.pick === 'all-in' || !generatedOf.has(current)) continue;
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
  /**
   * **The hired saver keeps the bar's order or it is not offered** (W10, experiment 146). It is chosen on the
   * campaign's burn over the whole band, not off the ladder, so it can land where S-61 forbids a stop: at the
   * burn of another stop, or left of a stop it out-hits. Measured on the owner's live account: the saver at
   * **1** burned a march hits 5 478 162, the silver saver to its right at **4** only 3 694 764 — for half the
   * silver, which is why neither beats the other and why the bar cannot hold both in its burn order. Under
   * `'guard'` the saver gives way; under `'fold'` the stops it out-hits do, which 146 measured as a loss.
   */
  {
    const saverAt = stops.findIndex((row) => row.pick === 'burn-saver');
    const saver = saverAt < 0 ? undefined : (stops[saverAt] as PlanRow);
    if (saver && (input.burnSaver === 'guard' || input.burnSaver === 'fold')) {
      const outHit = stops.filter(
        (row) =>
          row !== saver &&
          row.pick !== 'all-in' &&
          (row.repeat.mercLost <= saver.repeat.mercLost || row.repeat.damage <= saver.repeat.damage),
      );
      if (outHit.length > 0) {
        if (input.burnSaver === 'guard') stops.splice(saverAt, 1);
        else for (const row of outHit) stops.splice(stops.indexOf(row), 1);
      }
    }
  }
  /**
   * **The troops-only tail, on the repeated stops** (S-89; owner, 2026-09-18, choosing P1 from the
   * six-proposal table of `tools/theorycraft/out/105-six-proposals.md`).
   *
   * S-76 made the horizon a ceiling rather than a promise: a stop whose hired stock the horizon outruns plays
   * the marches its stock reaches and stops. On a first-run army holding one Bear V that is **one** march of a
   * four-march horizon — 4 722 842 damage for 8 131 400 silver — while every sizer sequence beside it in the
   * benchmark marches four times, going on with troops alone once the bears are gone. S-81 gave the `all-in`
   * those marches; this gives them to every other stop, on the owner's word. Measured (105 §P1, on the S-87
   * engine): exactly 3 stops on 3 of the 13 scenarios move — bear ×1's sweet spot 4 722 842 → **18 554 768**,
   * bear ×2's 9 557 884 → **18 779 168**, bear ×3's 14 168 526 → **18 779 168** — and every other stop on
   * every other army already fills the horizon, so nothing else changes at all.
   *
   * **It is applied last, after every rule that chooses a stop has run**, and the rules are the reason it can
   * be: the bar's order and its two ends read `repeat.mercLost`, the sweet spot's chord reads `repeat.damage`
   * against it, the band and the S-58 B test read the repeated march and the finale, `offer`'s dedupe and the
   * put-back pass read `counts`, and `bestFor` below reads `perSilver`/`perHired`, which are `repeat`'s own
   * figures and not the campaign's. Not one of them can see a march appended after the stock is spent, which
   * is what 105 §P1 measured stop by stop: no stop choice moves, no burn moves, no knee moves, and band
   * membership is unchanged on all 13 armies. What *does* move is the campaign's **damage a silver**, which
   * the tail eases by buying damage for silver alone.
   *
   * **Damage a hired unit no longer moves with it at all** (S-105, 2026-09-19). It used to, and that was the
   * complaint: the tail fields no hired stack, so under the old reading it handed the stock credit for damage
   * no mercenary struck for — on bear ×1 the stop reported 18 554 768 damage a hired unit burned, of which no
   * mercenary bought 13 831 926. Since S-105 the ratio is `hiredDamage / mercLost` and the tail adds to
   * neither, so the figure the row prints is the same before and after this pass.
   */
  const withTail = <T extends PlanTotals>(row: T): T => {
    // No horizon to fill (a silver budget, or a single march asked for), a stop that already fills it, or the
    // `all-in`, whose `sequence` carries its own tail march by march.
    if (planned === undefined || row.sequence !== undefined || row.marches >= planned) return row;
    const tail = troopsOnlyMarch();
    if (!tail) return row;
    const played = planned - row.marches;
    const totalDamage = row.totalDamage + played * tail.damage;
    const silver = row.silver + played * tail.silver;
    // A troops-only march trains no monster, so it spends no coin either; summed rather than assumed, for
    // the same reason the gold below is (S-102).
    const dragonCoins = row.dragonCoins + played * tail.dragonCoins;
    return {
      ...row,
      tail: {
        counts: tail.counts,
        marches: played,
        damage: tail.damage,
        silver: tail.silver,
        seconds: tail.seconds,
      },
      totalDamage,
      silver,
      // `toMarch` prices gold off the hired stacks alone, so a troops-only march adds none. Summed rather
      // than assumed, so the line stays true if that ever stops being so.
      gold: row.gold + played * tail.gold,
      dragonCoins,
      seconds: row.seconds + played * tail.seconds,
      // The stock burns nothing more: that is the whole shape of the trade the owner accepted here.
      mercLost: row.mercLost,
      // **And no hired stack strikes in it** (S-105), so what the hired stock dealt is untouched — which is
      // why damage a hired unit below is the same figure before and after this pass.
      hiredDamage: row.hiredDamage,
      marches: planned,
      damagePerSilver: silver > 0 ? totalDamage / silver : Infinity,
      damagePerMercenary: row.mercLost > 0 ? row.hiredDamage / row.mercLost : Infinity,
      damagePerDragonCoin: dragonCoins > 0 ? totalDamage / dragonCoins : Infinity,
    };
  };
  for (let index = 0; index < stops.length; index += 1) {
    const row = stops[index] as PlanRow;
    const tailed = withTail(row);
    if (tailed !== row) {
      stops[index] = tailed;
      // `generatedOf` is keyed by object identity and read by the frontier diagnostic below, so the re-keyed
      // row keeps the march it was sized from.
      const generated = generatedOf.get(row);
      if (generated) generatedOf.set(tailed, generated);
    }
  }
  /**
   * **The `all-in` is not offered when a stop beside it beats it outright** (S-94, 2026-09-19; the owner,
   * 2026-09-18: *"more damage with a lot of merc spent should trigger a failing test as we're using too much
   * of a rare resource"* — and worse than that, a stop that spends **more** silver *and* more of the stock
   * than the one beside it and hits **less** hard).
   *
   * That stop is on the bar for one reason: its first march **fields** more hired units than the steady max's
   * repeat, and the player may want the stock spent fastest (*"a last stop: all mercs possible"*). It is
   * allowed to cost whatever it costs for that. What it may not be is behind on **all three** of the figures
   * a stop prints — the campaign's damage, its silver and the hired units burned for good — because then it
   * has bought nothing at all with what it spent, and its reason for being on the bar has gone. The same
   * sentence the put-back pass already makes about it ("a put-back that took it under that line would leave
   * the bar carrying a stop whose own reason for being there had gone"), on the campaign rather than on the
   * hired count.
   *
   * The criterion that says so is S-93's — *"no stop of the bar is beaten by another stop of the same bar"*
   * in `tests/engine/plan-criteria.test.ts`, written when the tighter shape's own prefix shapes produced one.
   * It held by construction until the plan moved onto the worst opening, and then stopped holding on two
   * armies: the owner's export at 12 000, where the `all-in` came out at **31 308 140 for 23 696 200 silver
   * and 90 burned** against the steady max's **31 546 458 for 18 790 400 and 67**, and his live camp, at
   * **11 815 339 for 11 241 300 and 130** against **12 086 359 for 9 849 200 and 37**. Both bars are one stop
   * shorter now, and honest.
   *
   * **Only the `all-in` is dropped, only as the beaten row, and only when it burns strictly more of the
   * stock.** The owner's own sentence is "more silver *and* more of the stock for less damage", and the
   * stock is the half that matters: when the two burn the **same** chunks, the difference between them is
   * *tempo*, which the campaign's three figures cannot see. Measured on a first-run army holding ten Bear V,
   * 2026-09-19 **on this reading**: the `all-in` plays 10 · 9 · 8 · 7 for **20 893 375 over four marches at
   * 36 013 400 silver**, the sweet spot six bears a march for **20 769 608 at 32 525 600**, and both burn the
   * same **4** chunks — **10.7 % more silver for 0.6 % more damage**, with the stock spent four times faster.
   * That is a trade a player may take or refuse, and the point of the stop is that the bar can show it.
   * (Experiment 101 §B measured the same shape under the midpoint reading, where it was a *poor* deal: 40 %
   * more silver for slightly **less** damage. The figures above are this engine's.) Dropping it there would
   * take away the offer the stop exists to make.
   *
   * The other four stops are rungs of the burn ladder and are never dropped here: the `all-in` beating one of
   * them is the bar *working*, and it does on a stock smaller than a chunk, where "three bears once, then two,
   * then one" and "one bear a march" burn the same chunk for the same silver.
   * `tests/engine/plan-criteria.test.ts` states both halves.
   *
   * Last of all, after the tail, so the comparison is on the campaigns the rows actually carry.
   */
  const lastIn = stops.findIndex((row) => row.pick === 'all-in');
  if (lastIn >= 0) {
    const row = stops[lastIn] as PlanRow;
    const beaten = stops.some(
      (other) =>
        other !== row &&
        other.totalDamage >= row.totalDamage &&
        other.silver <= row.silver &&
        other.mercLost < row.mercLost,
    );
    if (beaten) stops.splice(lastIn, 1);
  }

  /**
   * **The fold** (`CampaignInput.foldTo`; experiments 147–149). Every stop above was chosen by its own rule;
   * this is the one place the bar is chosen **as a whole**. The readings are the campaign's, as the stops
   * print them, and a set is judged against the stops the rules offered (the pool): what it keeps of the
   * pool's best on each reading, whether it is ordered, whether its cheapest stop is still a real saving.
   *
   * Measured before it was written (148, the exhaustive search with TotalStack's rows as a sixth rule): at five
   * stops 16 of 17 benchmark armies have an ordered bar that loses nothing TotalStack is beaten on, 15 of
   * them losing none of the ten readings, and keeping the sweet spot never cost a reading. The one that
   * cannot is the owner's live account of 2026-09-18, where every plan burning less than the silver saver
   * hits harder than it (5.48M–6.13M a march against 3.69M): there the order wins, as it always has, and the
   * bar is the one the guard offered.
   */
  if (input.foldTo !== undefined && stops.length > 0) {
    const limit = Math.max(1, input.foldTo);
    const readings: { of: (row: PlanTotals) => number; high: boolean }[] = [
      { of: (row) => row.totalDamage, high: true },
      { of: (row) => row.silver, high: false },
      { of: (row) => row.mercLost, high: false },
      { of: (row) => row.gold, high: false },
      { of: (row) => row.dragonCoins, high: false },
      { of: (row) => row.seconds, high: false },
      { of: (row) => (row.silver > 0 ? row.totalDamage / row.silver : 0), high: true },
      { of: (row) => row.hiredDamage / Math.max(1, row.mercLost), high: true },
      { of: (row) => (row.gold > 0 ? row.totalDamage / row.gold : 0), high: true },
      { of: (row) => (row.dragonCoins > 0 ? row.totalDamage / row.dragonCoins : 0), high: true },
    ];
    const bestOf = (set: readonly PlanTotals[], index: number): number => {
      const reading = readings[index] as (typeof readings)[number];
      const values = set.map(reading.of);
      return reading.high ? Math.max(...values) : Math.min(...values);
    };
    const pool = [...stops];
    const poolBest = readings.map((_, index) => bestOf(pool, index));
    const lossOn = (value: number, index: number): number => {
      const reading = readings[index] as (typeof readings)[number];
      const target = poolBest[index] ?? 0;
      if (reading.high) return value < target - 1e-9 && target > 0 ? (target - value) / target : 0;
      if (value > target + 1e-9) return target > 0 ? (value - target) / target : 1;
      return 0;
    };
    const poolLeast = poolBest[1] ?? 0;
    const sweet = pool.find((row) => row.pick === 'sweet-spot');
    // The band, priced over the horizon like the stops, less the marches already on the bar.
    const band = candidates
      .map((row) => withTail(row))
      .filter((row) => !pool.some((stop) => sameCounts(stop, row)));
    const ordered = (set: readonly PlanRow[]): boolean => {
      const sorted = [...set].sort(byBurn);
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1] as PlanRow;
        const current = sorted[index] as PlanRow;
        if (current.pick === 'all-in') continue;
        if (current.repeat.mercLost <= previous.repeat.mercLost) return false;
        if (current.repeat.damage <= previous.repeat.damage) return false;
      }
      return true;
    };
    interface Judged {
      set: PlanRow[];
      /** The order is the bar's own axis (S-61) and is never traded for anything: it is ranked first. */
      disordered: boolean;
      /** The sweet spot is the bar's recommendation (`recommend`, `PlanPanel`): ranked second, as hard. */
      noSweet: boolean;
      broken: number;
      lost: number;
      lostSum: number;
      named: number;
    }
    const judge = (set: PlanRow[]): Judged => {
      let lost = 0;
      let lostSum = 0;
      for (let index = 0; index < readings.length; index += 1) {
        const loss = lossOn(bestOf(set, index), index);
        if (loss > 0) {
          lost += 1;
          lostSum += loss;
        }
      }
      const broken = bestOf(set, 1) > poolLeast * 1.05 ? 1 : 0;
      return {
        set,
        disordered: !ordered(set),
        noSweet: sweet !== undefined && !set.includes(sweet),
        broken,
        lost,
        lostSum,
        named: set.filter((row) => pool.includes(row)).length,
      };
    };
    const better = (a: Judged, b: Judged): boolean => {
      if (a.disordered !== b.disordered) return !a.disordered;
      if (a.noSweet !== b.noSweet) return !a.noSweet;
      if (a.broken !== b.broken) return a.broken < b.broken;
      if (a.lost !== b.lost) return a.lost < b.lost;
      if (Math.abs(a.lostSum - b.lostSum) > 1e-12) return a.lostSum < b.lostSum;
      if (a.set.length !== b.set.length) return a.set.length > b.set.length;
      return a.named > b.named;
    };
    let chosen = judge(pool.length <= limit ? pool : pool.slice(0, limit));
    const consider = (set: PlanRow[]): void => {
      if (set.length === 0 || set.length > limit) return;
      const judged = judge(set);
      if (better(judged, chosen)) chosen = judged;
    };
    /**
     * **The band plans that could take a saver's role truthfully**, and no others: the band runs to thousands
     * of plans on a monster camp, and a plan that cannot be the bar's cheapest (within the 5 % the low-silver
     * rule allows) or its fewest burned can never wear either name. The thirty closest of each are tried.
     */
    const asRole = (row: PlanTotals, pick: PlanPick): PlanRow => ({
      ...(row as TradeRow),
      pick,
      bestFor: { silver: false, hired: false },
    });
    const SUBSTITUTES = 30;
    const fewestOther = Math.min(
      ...pool.filter((row) => row.pick !== 'burn-saver').map((row) => row.mercLost),
    );
    const silverBand = band
      .filter((row) => row.silver <= poolLeast * 1.05)
      .sort((a, b) => a.silver - b.silver || b.totalDamage - a.totalDamage)
      .slice(0, SUBSTITUTES)
      .map((row) => asRole(row, 'silver-saver'));
    const burnBand = band
      .filter((row) => row.mercLost < fewestOther)
      .sort((a, b) => a.mercLost - b.mercLost || b.totalDamage - a.totalDamage)
      .slice(0, SUBSTITUTES)
      .map((row) => asRole(row, 'burn-saver'));
    const cheapest = (set: PlanRow[], row: PlanRow): boolean =>
      set.every((other) => other === row || other.silver > row.silver);
    const fewest = (set: PlanRow[], row: PlanRow): boolean =>
      set.every((other) => other === row || other.mercLost > row.mercLost);
    for (let mask = 1; mask < 1 << pool.length; mask += 1) {
      const subset = pool.filter((_, index) => (mask >> index) & 1);
      if (subset.length > limit) continue;
      consider(subset);
      const silverFree = !subset.some((row) => row.pick === 'silver-saver');
      const burnFree = !subset.some((row) => row.pick === 'burn-saver');
      const silverTries = silverFree && subset.length < limit ? silverBand : [];
      const burnTries = burnFree && subset.length < limit ? burnBand : [];
      for (const silver of silverTries) {
        const withSilver = [...subset, silver];
        if (!cheapest(withSilver, silver)) continue;
        consider(withSilver);
        if (withSilver.length >= limit) continue;
        for (const burn of burnTries) {
          const both = [...withSilver, burn];
          if (cheapest(both, silver) && fewest(both, burn)) consider(both);
        }
      }
      for (const burn of burnTries) {
        const withBurn = [...subset, burn];
        if (fewest(withBurn, burn)) consider(withBurn);
      }
    }
    stops.splice(0, stops.length, ...chosen.set.sort(byBurn));
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
  const sweetSpot: PlanRow =
    stops.find((row) => row.pick === 'sweet-spot') ??
    withTail<PlanRow>({
      ...sweetSpotBase,
      pick: 'sweet-spot',
      bestFor: { silver: false, hired: false },
    });

  const leadershipUsed = chosen.rungs.reduce((sum, rung) => sum + rung.count * rung.entry.cost, 0);
  // The plan's own campaign, tailed like the stops: it is a repeated march with a horizon to fill like any of
  // them, and the recap that reads it ("… over 4 marches") is describing the same campaign the bar is.
  const total: PlanTotals = withTail(summarise(chosen));
  /**
   * A march's identity: its non-zero counts, sorted, so two records of the same march match whatever order
   * their keys were written in. `sameCounts` above compares the objects' JSON and is key-order dependent; it
   * is left exactly as it is, because changing what `offer` deduplicates by would be a change to the bar.
   */
  const countsKey = (counts: Record<string, number>): string =>
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([id, count]) => `${id}:${count}`)
      .join(',');
  /**
   * **The plans the bar may offer** — the set the reference table under it is drawn over (S-88).
   *
   * The owner, 2026-09-18, reading that table on his own screen: a row at **2.91 damage a silver**, better
   * than anything the bar offered him, and he asked why it was not a stop. It could never have been one. The
   * table used to be bucketed inside `record`, over **every shape the search prices**, while the stops are
   * drawn from `candidates` — the band, or the undominated frontier when the band keeps nothing — so his
   * 2.91 row was a one-troop-stack march (Rider III 265 carrying 97 hired) that the frontier threw away and
   * the band's own criterion exists to refuse (`tools/theorycraft/out/104-union-slider.md`). A reference
   * table that names a plan no rule could offer is not a reference: it reads as a bar that missed something.
   *
   * **As offered, not as searched.** The set is `candidates` *plus the stops themselves*, deduplicated by
   * counts: the put-back pass re-sizes some stops after they are chosen (`generatedOf`), so the march the
   * player reads on the bar is not always one the search summarised, and the row he is standing on has to be
   * findable in the table under it. The generated march a stop was re-sized from stays in as well — it is a
   * plan of the band in its own right, and the bar could have offered it. Two rows with the same counts are
   * one plan; the harder-hitting is kept, which is the `all-in` where its sequence shares a repeat's counts.
   *
   * Measured on his own bar, 2026-09-18 (`out/105-six-proposals.md` §P4): the table goes from 11 rows to 3,
   * its peak from 2.759 a silver to 1.987 — which is the best damage a silver on the bar itself — and its
   * cheapest row from 2 140 100 silver to 5 782 400. **No stop moves**: nothing but the table reads this.
   *
   * **As offered means tailed** (S-89): a plan the bar may offer plays the horizon out on troops alone when
   * its hired stock runs short, so a candidate is priced here with that tail on it. This is the one set the
   * tail reaches beyond the stops — `trade`, the knee and the two peaks stay the search's own figures — and
   * it has to, because a table of levels cannot hold a one-march campaign and a four-march one at once.
   */
  /**
   * A tailed copy of a candidate, back to the row the **search** summarised. The frontier diagnostic is a
   * record of the search, and a copy the pricing made afterwards is the same plan — without this it would
   * report every tailed candidate as a march the frontier never carried.
   */
  const tailedFrom = new Map<PlanTotals, PlanTotals>();
  const offered: PlanTotals[] = (() => {
    const held = new Map<string, PlanTotals>();
    // **Tailed, like the stops** (S-89). The set is the plans the bar *may offer*, and a plan the bar offers
    // plays the horizon out on troops alone — so a candidate is priced here the way it would be priced if it
    // were picked, `withTail` and all. Half-tailing the set printed two readings of one army side by side:
    // on a first-run army holding one bear the table carried the tailed sweet spot at 32 525 600 silver for
    // 18 554 768 damage next to an untailed one-march candidate at 1 233 500 for 706 825, one of them a
    // four-march campaign and the other a one-march one, in a table whose whole premise is that every row is
    // the same horizon at a different silver. The dedupe below then kept the harder-hitting of a pair, which
    // on three bears silently dropped a whole level (the untailed 24 394 200 row losing to its own tailed
    // self at 32 525 600). Tailing the candidates first makes every row one campaign of the same length.
    const tailed = candidates.map((row) => {
      const withIt = withTail(row);
      if (withIt !== row) tailedFrom.set(withIt, row);
      return withIt;
    });
    for (const row of [...tailed, ...stops]) {
      const key = countsKey(row.counts);
      const there = held.get(key);
      if (!there || row.totalDamage > there.totalDamage) held.set(key, row);
    }
    return [...held.values()];
  })();
  // 1.2× a bucket: fine enough to read the curve's shape, coarse enough to be one line per level. Sixty of
  // them span 10 k to 560 M silver, which is every plan a single account can afford. The band is narrow, so
  // the table is a handful of rows — which is the point: they are the levels the player can actually buy.
  const BUCKETS = 60;
  const bucketLog = Math.log(1.2);
  const bucketOf = (silver: number): number =>
    Math.min(BUCKETS - 1, Math.max(0, Math.round(Math.log(silver / 10_000) / bucketLog)));
  /** One bucket per silver level, holding the best damage and the best damage-per-mercenary offered there. */
  const buckets = new Map<number, { best: PlanTotals; thrifty: PlanTotals }>();
  // Damage a mercenary, on the one reading this file has of it since S-105: the hired stacks' own damage
  // over the chunks they cost. `Math.max(1, …)` is the column's own zero rule, unchanged — a row that burns
  // nothing is read at its hired damage rather than topping the bucket with an `Infinity`.
  const perMercOf = (row: PlanTotals): number => row.hiredDamage / Math.max(1, row.mercLost);
  for (const row of offered) {
    if (row.silver <= 10_000 || row.mercLost <= 0 || row.silver >= 10_000 * 1.2 ** BUCKETS) continue;
    const key = bucketOf(row.silver);
    const entry = buckets.get(key);
    if (!entry) {
      buckets.set(key, { best: row, thrifty: row });
      continue;
    }
    if (row.totalDamage > entry.best.totalDamage) entry.best = row;
    if (perMercOf(row) > perMercOf(entry.thrifty)) entry.thrifty = row;
  }
  const curve: PlanCurvePoint[] = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, entry]) => ({
      silver: entry.best.silver,
      damage: entry.best.totalDamage,
      hiredDamage: entry.best.hiredDamage,
      damagePerSilver: entry.best.totalDamage / entry.best.silver,
      mercLost: entry.best.mercLost,
      thriftyDamage: entry.thrifty.totalDamage,
      thriftyMercLost: entry.thrifty.mercLost,
      thriftyPerMercenary: perMercOf(entry.thrifty),
    }));
  /**
   * The frontier as the caller asked to see it (`CampaignInput.withFrontier`). A stop is matched back to the
   * row it came from by the put-back's own bookkeeping (`generatedOf`, which holds the generated march a
   * re-sized stop was made from) and otherwise by its counts, which is the same test `offer` deduplicates by.
   */
  const frontierRows: PlanFrontierRow[] | undefined =
    input.withFrontier === true
      ? (() => {
          /** The march identity above (`countsKey`), which is what a stop and its re-sizing are matched by. */
          const keyOf = countsKey;
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
          const held = new Set<PlanTotals>(all);
          /**
           * **The marches the bar offers that the search never summarised**: a stop the put-back pass
           * re-sized after it was chosen, and the `all-in`, built march by march outside the frontier. They
           * are the only rows of the reference table (`offered` above) the frontier does not already carry,
           * and the diagnostic is what an experiment traces a table row back through.
           *
           * **A tailed copy is not one of them** (S-89). The table prices a candidate the way it would be
           * priced if it were offered — the troops-only tail included — and that copy is a new object, so by
           * identity alone every tailed candidate would arrive here as a march the frontier never carried,
           * and a tailed *stop* would be reported twice over: once as its untailed frontier row and once as
           * an off-frontier row four marches long. `tailedFrom` maps a copy back to the row the search
           * summarised, which is what `onFrontier` is a claim about.
           *
           * So the rows here are the **search's** own figures, pre-tail, and deliberately: this is a record of
           * what the search found, and a stop's tailed campaign is on `alternatives` where the bar reads it.
           */
          const searched = (row: PlanTotals): PlanTotals => tailedFrom.get(row) ?? row;
          const onFrontier: PlanFrontierRow[] = all.map((row) => decorate(row, true));
          const offFrontier: PlanFrontierRow[] = offered
            .filter((row) => !held.has(searched(row)))
            .map((row) => decorate(searched(row) as TradeRow, false));
          return [...onFrontier, ...offFrontier].sort(
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
    //
    // **Pre-tail, on purpose** (S-89): these are the plans as the **search** priced them, and the shape the
    // question is about — how the band's marches trade silver against the stock — is a property of the
    // repeated march, which the tail does not touch. The reference table (`curve`) is the one set priced *as
    // offered*, tail included, because it is the table drawn under the bar.
    ...(input.withTrade === true
      ? { trade: [...candidates].sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage) }
      : {}),
    // With no budget the recommendation is the sweet spot — the middle of the trade in hired stock, see
    // `sweetSpotBase` above. With a budget the plan *is* the answer and nothing is recommended beside it. The
    // knee and the two peaks are carried for the curve's shape, not for the bar.
    //
    // `recommend` is a **stop**, so it carries its tail like every other stop. The three beside it are
    // **pre-tail** (S-89), for the same reason `trade` is: each is a point of the search's own frontier,
    // named for where it sits on it, and the tail is the same march added to all of them — it moves every
    // campaign figure and none of the shape that picked them.
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
