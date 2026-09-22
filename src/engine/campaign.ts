/**
 * S-54 — complete optimization: one army fought several times (PLAN §3.4–3.6, investigations 0003, 0013
 * and 0014).
 *
 * The priority search of `search.ts` answers "what is the best march *once*". The owner does not fight
 * once: he fights until his mercenaries — or his retrain silver — run out, and mercenaries are the one
 * part of the army that does not come back. The Temple revives 90 % of the fallen (`n − chunks(n)`, see
 * `recovery.ts`), so every battle costs a tenth of every hired stack it fields, rounded up per chunk of
 * ten. Fielding fewer of them per march therefore buys more marches; fielding more of them wins more
 * damage per march. That trade cannot be read off a single battle, which is what this module adds.
 *
 * Two pieces:
 *
 *   - `simulateCampaign` plays the same request N times, shrinking each hired stock by `chunks(count
 *     fielded)` after every march, and returns the plain sums (damage, recovery cost) plus what was lost
 *     and what is left. It is bookkeeping, not a search: no decision is taken inside it.
 *   - `searchComplete` runs the decisions — the sizing **method** (Troops first, Hired last, Hired last
 *     with damage trades: investigation 0014 §5 measured +4.7 % on the owner's army just from the
 *     method), the **subset** of unit types, and how much of each hired stock to **spend** per march —
 *     and scores them on the campaign totals rather than on one battle.
 *
 * Everything here is plain data in, plain data out (ADR-0006): no React, no store, no DOM, deterministic
 * for the same inputs, and bounded by a wall-clock budget so it can run in the worker beside the priority
 * search.
 */
import { simulateBattle } from './battle';
import { chunks } from './recovery';
import { EXHAUSTIVE_LIMIT, objectiveScore, PROGRESS_EVERY, searchPriority } from './search';
import { sizeStacks } from './stacker';
import type {
  DamageReading,
  BattleSummary,
  Objective,
  SearchProgress,
  StackRequest,
  StackResult,
} from './types';

// ---- Campaign ------------------------------------------------------------------------------------
export interface CampaignSettings {
  /** Marches planned with this army; at least one. */
  marches: number;
  /** Retrain silver available for the whole campaign; `undefined` = unlimited. */
  silverBudget?: number;
  /**
   * Fraction of each *hired* stock (mercenaries and monsters — every unit that has an entry in
   * `request.caps`) fielded per march, `0 < spend ≤ 1`; default 1. A stock of 92 at 0.5 fields 46 a
   * march, loses 5 of them each time and still fields 46 on the tenth march.
   */
  spend?: number;
}

export interface CampaignMarch {
  /** Position in the campaign, 0 for the first march. */
  index: number;
  /** The caps this march was sized with (`request.caps` scaled by `spend` and clipped to the stock). */
  caps: Record<string, number>;
  result: StackResult;
  summary: BattleSummary;
}

export interface CampaignSummary {
  marches: CampaignMarch[];
  fought: number;
  /** Why the campaign ended: the planned number of marches, or the silver budget. */
  stoppedBy: 'marches' | 'silver';
  totalMin: number;
  totalAvg: number;
  totalMax: number;
  /** Sums of the per-march recovery plan (`BattleSummary.recovery`). */
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
  /** Hired units gone for good, per unit id: Σ `chunks(count fielded)` over the marches fought. */
  lost: Record<string, number>;
  /** Stock left after the last march, per unit id. */
  remaining: Record<string, number>;
  damagePerSilver: number;
  damagePerGold: number;
  damagePerDragonCoin: number;
}

/** `spend` as the contract defines it: a fraction in (0, 1], anything else clamped, `undefined` = 1. */
export function clampSpend(spend: number | undefined): number {
  if (spend === undefined || !Number.isFinite(spend)) return 1;
  return Math.min(1, Math.max(0, spend));
}

/**
 * How many of a hired stock one march fields at most. A stock the player owns is never left entirely at
 * home by a low `spend` (the floor of one unit), and a stock of nothing stays nothing.
 */
export function marchTarget(cap: number, spend: number): number {
  if (!(cap > 0)) return 0;
  return Math.max(1, Math.ceil(clampSpend(spend) * cap));
}

/**
 * Play the same request `settings.marches` times.
 *
 * Each march is `sizeStacks` + `simulateBattle` on the request with that march's caps; the counts the
 * sizer actually placed (housing usually binds long before the cap does) are what the chunk rule bills,
 * so the stock falls by `chunks(count fielded)`, not by a tenth of the cap. Uncapped types — troops —
 * are unaffected: they are retrained or revived and march again in full.
 *
 * With a silver budget the campaign stops *before* a march it could not pay for: the march is simulated,
 * and if its silver would push the running total past the budget it is discarded and `stoppedBy` reads
 * `'silver'`.
 */
export function simulateCampaign(request: StackRequest, settings: CampaignSettings): CampaignSummary {
  const spend = clampSpend(settings.spend);
  const planned = Number.isFinite(settings.marches) ? Math.max(1, Math.floor(settings.marches)) : 1;
  const budget = settings.silverBudget;

  const stock: Record<string, number> = {};
  const targets: Record<string, number> = {};
  const lost: Record<string, number> = {};
  for (const [id, cap] of Object.entries(request.caps)) {
    const owned = Math.max(0, Math.floor(cap));
    stock[id] = owned;
    targets[id] = marchTarget(owned, spend);
    lost[id] = 0;
  }

  const marches: CampaignMarch[] = [];
  let stoppedBy: 'marches' | 'silver' = 'marches';
  let totalMin = 0;
  let totalAvg = 0;
  let totalMax = 0;
  let silver = 0;
  let gold = 0;
  let dragonCoins = 0;
  let seconds = 0;

  for (let index = 0; index < planned; index += 1) {
    const caps: Record<string, number> = {};
    for (const id of Object.keys(stock)) caps[id] = Math.min(targets[id] ?? 0, stock[id] ?? 0);

    const scoped: StackRequest = { ...request, caps };
    const result = sizeStacks(scoped);
    const summary = simulateBattle(result, scoped);

    if (budget !== undefined && silver + summary.recovery.silver > budget) {
      stoppedBy = 'silver';
      break;
    }

    for (const stack of result.stacks) {
      if (!(stack.unitId in stock)) continue;
      const gone = chunks(stack.count);
      lost[stack.unitId] = (lost[stack.unitId] ?? 0) + gone;
      stock[stack.unitId] = Math.max(0, (stock[stack.unitId] ?? 0) - gone);
    }

    totalMin += summary.minDamage;
    totalAvg += summary.avgDamage;
    totalMax += summary.maxDamage;
    silver += summary.recovery.silver;
    gold += summary.recovery.gold;
    dragonCoins += summary.recovery.dragonCoins;
    seconds += summary.recovery.seconds;
    marches.push({ index, caps, result, summary });
  }

  const per = (cost: number): number => (cost > 0 ? totalAvg / cost : 0);
  return {
    marches,
    fought: marches.length,
    stoppedBy,
    totalMin,
    totalAvg,
    totalMax,
    silver,
    gold,
    dragonCoins,
    seconds,
    lost,
    remaining: { ...stock },
    damagePerSilver: per(silver),
    damagePerGold: per(gold),
    damagePerDragonCoin: per(dragonCoins),
  };
}

// ---- Complete optimization -----------------------------------------------------------------------
/**
 * The three sizings the owner's question is really about (investigation 0014 §1 and §5):
 * `elite` = Troops first (Elite Preservation, hired stacks on top of the troops and killed first),
 * `ms` = Hired last (M's Preservation, every hired stack sized just under the smallest troop stack),
 * `msRelaxed` = Hired last + damage trades (the 0003 post-pass, which is what TotalStack's own
 * "Total Optimization" lands on).
 */
export type CompleteMethod = 'elite' | 'ms' | 'msRelaxed';

export const COMPLETE_METHODS: readonly CompleteMethod[] = ['elite', 'ms', 'msRelaxed'];

/** Spend levels tried when the caller names none: everything, three quarters, half, a quarter. */
export const DEFAULT_SPEND_LEVELS: readonly number[] = [1, 0.75, 0.5, 0.25];

/** Subsets carried from the single-march stage into the campaign stage, per (method, spend) cell. */
export const SHORTLIST = 8;

export interface CompleteRequest {
  request: StackRequest;
  objective: Objective;
  campaign: CampaignSettings;
  /**
   * Wall-clock budget for the whole search, split evenly across the (method, spend) cells; 0 or less is
   * unbounded, the convention `searchPriority` already uses.
   */
  budgetMs: number;
  seed?: number;
  /** Defaults to `DEFAULT_SPEND_LEVELS`. */
  spendLevels?: number[];
}

export interface CompleteCandidate {
  method: CompleteMethod;
  spend: number;
  includedUnitIds: string[];
  /** The first march of the campaign on its own, scored with the single-battle objective. */
  single: { result: StackResult; summary: BattleSummary; score: number };
  campaign: CampaignSummary;
  /** The objective read off the campaign totals — what the winner is chosen on. */
  score: number;
}

export interface CompleteResult {
  winner: CompleteCandidate;
  /** Best candidate of every (method, spend) cell, score descending. */
  candidates: CompleteCandidate[];
  evaluated: number;
  exhaustive: boolean;
  unmeasurable: boolean;
}

/**
 * The objective read off a whole campaign. Damage objectives are plain sums; a per-cost objective is the
 * campaign's damage over the campaign's cost, and a zero denominator is unmeasurable (−Infinity), never a
 * score of zero — the same rule `objectiveScore` applies to one battle.
 */
export function campaignScore(
  summary: CampaignSummary,
  objective: Objective,
  reading: DamageReading = 'worst',
): number {
  // **The ratios divide the worst opening** (S-134; the owner: *"1. yes"*), for the reason `objectiveScore`
  // gives and on the same default. This function is stage **two** of `searchComplete` — the stage the
  // docstring above calls the one that *decides*, where stage one only proposes — so a reading that stopped
  // at `objectiveScore` would have left the deciding half of this search ranking the coin flip while every
  // other comparison in the repo had moved to the bad one. It was a second copy of the same arithmetic and
  // drifted exactly the way a second copy does; the owner caught it by asking whether any of this reached
  // Total Optimization (2026-09-22).
  const damage = reading === 'worst' ? summary.totalMin : summary.totalAvg;
  const per = (cost: number): number => (cost > 0 ? damage / cost : -Infinity);
  switch (objective) {
    case 'avgDamage':
      return summary.totalAvg;
    case 'minDamage':
      return summary.totalMin;
    case 'damagePerSilver':
      return per(summary.silver);
    case 'damagePerGold':
      return per(summary.gold);
    case 'damagePerDragonCoin':
      return per(summary.dragonCoins);
  }
}

/** The request as one of the three methods sizes it; nothing else about the march is touched. */
export function withMethod(request: StackRequest, method: CompleteMethod): StackRequest {
  return {
    ...request,
    options: {
      ...request.options,
      method: method === 'elite' ? 'elite' : 'ms',
      relaxedPreservation: method === 'msRelaxed',
    },
  };
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

interface SingleEvaluation {
  subset: string[];
  result: StackResult;
  summary: BattleSummary;
  score: number;
}

/**
 * Complete optimization: the best (method, spend, subset) for a campaign.
 *
 * Per cell — one sizing method × one spend level — the search runs in two stages:
 *
 *   1. **one march.** Which unit types to field, scored by `objectiveScore` on a single battle, with the
 *      caps this spend level would give the *first* march (so the shortlist is drawn under the conditions
 *      the campaign actually fights in, and `candidate.single` is that first march). Up to
 *      `EXHAUSTIVE_LIMIT` types every non-empty subset is enumerated and the best `SHORTLIST` kept; above
 *      it, the shortlist is `searchPriority`'s winner plus the all-types formation, since enumerating
 *      8,000+ subsets of a campaign is not affordable.
 *   2. **the campaign.** Each shortlisted subset is played `campaign.marches` times by `simulateCampaign`
 *      and scored on the totals. A subset that wins one battle is not always the one that wins ten: the
 *      first stage only proposes, the second decides.
 *
 * The budget is split evenly across the cells, so a cut-short run still has an answer for every method
 * and every spend level; `exhaustive` reports whether every cell enumerated and played everything it
 * meant to. Deterministic: the enumeration order, the shortlist tie-break and the seed handed to
 * `searchPriority` are all fixed.
 */
export function searchComplete(
  request: CompleteRequest,
  onProgress?: (progress: SearchProgress) => void,
  shouldCancel?: () => boolean,
): CompleteResult {
  const started = now();
  const budget = request.budgetMs > 0 ? request.budgetMs : Infinity;
  const levels = (request.spendLevels ?? DEFAULT_SPEND_LEVELS).map(clampSpend);
  const spendLevels = levels.length > 0 ? [...new Set(levels)] : [1];
  const cells = COMPLETE_METHODS.length * spendLevels.length;
  const slice = budget === Infinity ? Infinity : budget / cells;

  const ids = request.request.units.map((unit) => unit.id);
  const singles = new Map<string, SingleEvaluation>();
  const candidates: CompleteCandidate[] = [];
  let evaluated = 0;
  let best = -Infinity;
  let exhaustive = true;

  const cancelled = (): boolean => shouldCancel?.() === true;
  const tick = (): void => {
    evaluated += 1;
    if (evaluated % PROGRESS_EVERY === 0) {
      onProgress?.({ evaluated, bestScore: best, elapsedMs: now() - started });
    }
  };

  for (let cell = 0; cell < cells; cell += 1) {
    const method = COMPLETE_METHODS[Math.floor(cell / spendLevels.length)] ?? 'elite';
    const spend = spendLevels[cell % spendLevels.length] ?? 1;
    // Each cell owns its slice of the clock, measured from the start so a cheap cell hands the rest on.
    const deadline = slice === Infinity ? Infinity : started + slice * (cell + 1);
    const out = (): boolean => cancelled() || now() >= deadline;

    const caps: Record<string, number> = {};
    for (const [id, cap] of Object.entries(request.request.caps)) {
      caps[id] = marchTarget(Math.max(0, Math.floor(cap)), spend);
    }
    const scoped: StackRequest = { ...withMethod(request.request, method), caps };
    const capsKey = Object.entries(caps)
      .map(([id, cap]) => `${id}:${String(cap)}`)
      .sort()
      .join(',');

    const evaluateSingle = (subset: string[]): SingleEvaluation => {
      const key = `${method}|${capsKey}|${subset.join(',')}`;
      const cached = singles.get(key);
      if (cached) return cached;
      const included = new Set(subset);
      const marchRequest: StackRequest = {
        ...scoped,
        units: scoped.units.filter((unit) => included.has(unit.id)),
      };
      const result = sizeStacks(marchRequest);
      const summary = simulateBattle(result, marchRequest);
      const evaluation: SingleEvaluation = {
        subset,
        result,
        summary,
        // Stage one, on the same reading stage two decides with (S-134) — passed rather than
        // defaulted, so the two stages cannot drift apart again.
        score: objectiveScore(summary, request.objective, 'worst'),
      };
      singles.set(key, evaluation);
      tick();
      return evaluation;
    };

    // ---- Stage 1: one march ----------------------------------------------------------------------
    let shortlist: SingleEvaluation[];
    if (ids.length === 0) {
      shortlist = [evaluateSingle([])];
    } else if (ids.length <= EXHAUSTIVE_LIMIT) {
      const scored: SingleEvaluation[] = [];
      for (let bits = 1; bits < 1 << ids.length; bits += 1) {
        if (out()) {
          exhaustive = false;
          break;
        }
        scored.push(evaluateSingle(ids.filter((_id, index) => (bits & (1 << index)) !== 0)));
      }
      // Ties are broken by the subset itself, so the shortlist does not depend on the enumeration's
      // internal ordering being stable in some future engine.
      shortlist = scored
        .sort((a, b) => b.score - a.score || a.subset.join(',').localeCompare(b.subset.join(',')))
        .slice(0, SHORTLIST);
    } else {
      exhaustive = false;
      const priority = searchPriority(
        {
          request: scoped,
          objective: request.objective,
          // Half the cell for proposing, half for playing the campaigns.
          budgetMs: deadline === Infinity ? 0 : Math.max(0, (deadline - now()) / 2),
          seed: request.seed ?? 1,
        },
        undefined,
        shouldCancel,
      );
      evaluated += priority.evaluated;
      const proposals = [priority.includedUnitIds, ids];
      shortlist = proposals
        .filter(
          (subset, index) => proposals.findIndex((other) => other.join(',') === subset.join(',')) === index,
        )
        .map(evaluateSingle);
    }
    if (shortlist.length === 0) shortlist = [evaluateSingle(ids)];

    // ---- Stage 2: the campaign -------------------------------------------------------------------
    let bestOfCell: CompleteCandidate | undefined;
    for (const single of shortlist) {
      // The first subset is always played, so every cell answers even when its slice is already spent.
      if (bestOfCell && out()) {
        exhaustive = false;
        break;
      }
      const included = new Set(single.subset);
      const campaignRequest: StackRequest = {
        ...withMethod(request.request, method),
        units: request.request.units.filter((unit) => included.has(unit.id)),
      };
      const campaign = simulateCampaign(campaignRequest, { ...request.campaign, spend });
      tick();
      const score = campaignScore(campaign, request.objective);
      if (!bestOfCell || score > bestOfCell.score) {
        bestOfCell = {
          method,
          spend,
          includedUnitIds: single.subset,
          single: { result: single.result, summary: single.summary, score: single.score },
          campaign,
          score,
        };
      }
    }
    if (bestOfCell) {
      candidates.push(bestOfCell);
      if (bestOfCell.score > best) best = bestOfCell.score;
    }
  }

  // Cells are pushed in a fixed order (method, then spend), so an exact tie keeps that order.
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  const winner = ordered[0];
  if (!winner) throw new Error('searchComplete: nothing could be evaluated');
  onProgress?.({ evaluated, bestScore: winner.score, elapsedMs: now() - started });
  return {
    winner,
    candidates: ordered,
    evaluated,
    exhaustive: exhaustive && !cancelled(),
    // Every candidate scored −Infinity: the objective's denominator is zero everywhere, so nothing was
    // ever compared and the winner is simply the first cell (PLAN §3.6, `SearchResult.unmeasurable`).
    unmeasurable: ordered.every((candidate) => candidate.score === -Infinity),
  };
}
