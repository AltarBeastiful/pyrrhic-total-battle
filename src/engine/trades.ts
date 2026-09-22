/**
 * **Which marches the bar may carry, as a strategy rather than a rule welded into the search** (S-128,
 * 2026-09-22; the owner: *"we should rule on criteria winning meaning all criteria — silver, gold, damage,
 * hired, dragon coins, training time if a trade is available — and use those criteria properly rated … as
 * we're trying to get the best solution out of constrained resources"*, and *"no magic numbers"*).
 *
 * **There are no numbers in this file**, and that is the point. Every judgement here is a *comparison*
 * between two marches the same army can field, on markers it already prints. Nothing is weighted against
 * anything, so no exchange rate has to exist and none can be tuned to flatter a result. What the strategies
 * differ on is **which markers are read**, never how much each is worth.
 *
 * ---
 *
 * **Why this is a module and not a constant.** S-127 added a stop and gated it on dominance over four costs.
 * That was wrong in a way worth recording, because it is the opposite of the intuition: **adding a cost to a
 * dominance test makes it harder for one march to beat another, so fewer marches are rejected and more
 * survive.** The gate let a stop through on eleven armies where it earned three, because the march it was
 * meant to lose to was dearer in *silver* even while being better on damage and stock. The bar's own
 * criterion (`tests/engine/plan-criteria.test.ts`, *"no stop of the bar is beaten by another stop of the same
 * bar"*) reads **three** figures, not four, and rejects more as a result.
 *
 * So the reading is a decision, it is not obvious, and it belongs somewhere it can be swapped and measured
 * rather than argued about. `CAMPAIGN.trades` names the one the app ships; every strategy here can be run
 * over the same armies and compared (`tools/theorycraft/135-trade-strategies.test.ts`).
 *
 * ---
 *
 * **What is deliberately *not* here: the comparison against another calculator.** `tests/engine/matched-spend.ts`
 * scores the bar against TotalStack, and it must stay a plain dominance test on the costs the owner names —
 * *"spends no more of any of them, and deals more damage"*. A reading that weighed one marker against
 * another there could be made to win by re-weighting rather than by marching better, which is the one thing a
 * benchmark must not allow. The owner, 2026-09-22: *"total stack is just a check that we're in the right
 * path but not an end goal in itself, it's merely another benchmark down the verification pass."* A check is
 * only a check while it cannot be argued with.
 */

/**
 * **A campaign priced on every marker the owner names**, over whatever span the caller is comparing — one
 * march, or a whole campaign. The strategies below never care which, only that both sides are the same.
 */
export interface Priced {
  /** The worst opening, since S-94: the enemy-first journal's total. */
  damage: number;
  /** Retraining silver. */
  silver: number;
  /** Gold the hired stacks cost to revive. */
  gold: number;
  /** Dragon coins the monsters cost to recruit again. */
  dragonCoins: number;
  /** Chunks of ten out of the **authority** pool — the stock a march does not get back (S-102). */
  hired: number;
  /** Seconds the losses sit in the training queue. */
  seconds: number;
}

/** The five costs, in the order the owner names them. `damage` is the objective and never one of these. */
export const COSTS = ['silver', 'hired', 'gold', 'dragonCoins', 'seconds'] as const;
export type Cost = (typeof COSTS)[number];

/**
 * **The readings the bar can be judged on.** Each is a set of costs; a march is beaten when another has at
 * least its damage, at most each of *those* costs, and is strictly better on one of them.
 *
 * They are ordered from **strictest to most permissive**, and the direction is the thing to hold on to: a
 * strategy reading **fewer** costs rejects **more** marches, because there are fewer ways for a march to
 * escape being beaten.
 */
export const STRATEGIES = {
  /**
   * **Does it hold once the stock is counted?** (the owner, 2026-09-22: *"I would prefer keeping off
   * unsheltered but if it is actually better even taking into account merc lost then why not"*.)
   *
   * The strictest reading there is, and the narrowest question: a march is beaten when another hits **at
   * least as hard for at most the stock**. Nothing else is looked at, so a march cannot escape by being
   * cheaper in silver — which is the one loophole every wider reading leaves open, and the reason a stop
   * that burns 864 chunks against 111 for 9 % *less* damage was being kept on *"Aydae alone"*.
   *
   * It is the reading to use when the question is whether spending the stock **paid for itself**, and it
   * weighs nothing: more damage for more stock is a trade the player may want, and less damage for more
   * stock is not a trade at all.
   */
  stock: { name: 'stock', costs: ['hired'] },
  /**
   * **What the bar's own criteria read** (`plan-criteria.test.ts`, S-58/S-93): damage, silver and the burn.
   * The strictest of the three, and the only one whose verdicts a passing criteria suite already agrees
   * with — a bar chosen on a more permissive reading can carry a stop the criteria then reject, which is
   * exactly what S-127 shipped and what this file exists to stop.
   */
  criteria: { name: 'criteria', costs: ['silver', 'hired'] },
  /**
   * **The four costs the owner's definition of beating names** (S-125): *"a fixed silver/merc/gold/dragon
   * coins set"*. What `beatsOnFigures` reads, and what S-127's gate used — more permissive than the
   * criteria above, which is why that gate kept eleven armies where three earned it.
   */
  figures: { name: 'figures', costs: ['silver', 'hired', 'gold', 'dragonCoins'] },
  /**
   * **Every marker, the training queue included** (the owner, 2026-09-22: *"training time if a trade is
   * available"*). The most permissive of the three: a march that is dearer in queue than another escapes
   * being beaten by it, however much worse it is elsewhere.
   *
   * Worth measuring before shipping: gating the queue in the *rival* comparison was measured on 2026-09-22
   * to cost two of the five armies the bar beats, which is a different question but the same marker, and a
   * reason to expect it to matter here too.
   */
  everything: { name: 'everything', costs: COSTS },
} as const satisfies Record<string, { name: string; costs: readonly Cost[] }>;

export type StrategyName = keyof typeof STRATEGIES;
export type Strategy = (typeof STRATEGIES)[StrategyName];

/**
 * **One march beats another when it is behind on none of the markers the strategy reads** — at least its
 * damage, at most each of those costs, and strictly better on one of the set.
 *
 * The strictness matters and is not decoration: two stops that are the same march to the unit happen on this
 * table (Bear V ×1 and ×2 tail into the Tier ladder sizer's own campaign), and neither beats the other.
 */
export function beats(other: Priced, row: Priced, strategy: Strategy): boolean {
  if (other.damage < row.damage) return false;
  if (strategy.costs.some((cost) => other[cost] > row[cost])) return false;
  return other.damage > row.damage || strategy.costs.some((cost) => other[cost] < row[cost]);
}

/** The first march of a field that beats this one on the strategy's reading, or `null` where none does. */
export function beatenBy<T extends Priced>(row: Priced, field: readonly T[], strategy: Strategy): T | null {
  return field.find((other) => (other as Priced) !== row && beats(other, row, strategy)) ?? null;
}

/**
 * **What one march buys over another, marker by marker** — the *rate*, reported and never weighted.
 *
 * The owner asked for trades to be *rated*: *"more damage for way too much silver or hired lost is not a
 * good trade"*. A rate needs no constant as long as nobody adds the markers together: this returns the
 * damage each extra unit of a cost bought, and a reader — or a criterion — decides whether that is a price
 * worth paying on this army. `null` where the cost did not rise, because a rate for a resource nothing more
 * was spent of is a division nobody asked for.
 *
 * It is what makes a refusal explainable. "Beaten by the steady max" says a stop is gone; "it paid 753 more
 * chunks for 1.6 M less damage" says why.
 */
export function ratesOver(row: Priced, base: Priced): Partial<Record<Cost, number>> {
  const out: Partial<Record<Cost, number>> = {};
  for (const cost of COSTS) {
    const spent = row[cost] - base[cost];
    if (spent <= 0) continue;
    out[cost] = (row.damage - base.damage) / spent;
  }
  return out;
}
