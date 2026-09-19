/**
 * **The march's figures read on the worst opening** (S-108, 2026-09-19; the owner: *"damage/silver differs
 * in the plan table and in the battle summary"*).
 *
 * He was reading two arithmetics on one screen. The plan's bar divides the **worst opening** — the
 * enemy-first journal, the bad flip, which is what S-94 made the plan's damage on 2026-09-19 because *"it's
 * too risky for me to spend 3M silver on a coin flip"* — while `simulateBattle` computes
 * `damagePerSilver`, `damagePerGold` and `damagePerDragonCoin` from `avgDamage`, the **midpoint** of the two
 * openings. On his usual setup that is 1.40 a silver on the recap against 1.36 on the bar, for one march.
 *
 * **The midpoint fields stay exactly as they are**, and they have to: `simulateBattle`'s three ratios are
 * TotalStack's own reading of its Battle Summary (`tests/engine/summary.test.ts` pins each of them at
 * `avgDamage / cost`), and they are what the priority search optimises when the player picks
 * `damagePerSilver` as an objective (`src/engine/search.ts`). So the **recap** reads the worst opening here
 * instead, off the two things it already has on screen — `minDamage` and the recovery bill — and the two
 * screens print one figure.
 *
 * The same question for the **hired** line: *"Damage a hired unit"* is the hired stacks' own damage over the
 * chunks of ten they cost (S-105), and the plan's bar reads that on the worst opening too
 * (`PlanRepeat.hiredDamage`, summed from the enemy-first journal). `summary.damageByPool` is the midpoint,
 * so the Details fold's split is summed here from the same journal the bar's is.
 */
import type { BattleJournal, BattleSummary, Pool, Stack } from '@/engine/types';

/** What the recap holds of a march when it asks for a price: the bad flip, and what it cost. */
export type WorstPriced = Pick<BattleSummary, 'minDamage' | 'recovery'>;

/**
 * Damage bought per unit of a price, on the worst opening. `0` for a price nothing was paid in, exactly as
 * `simulateBattle`'s own `per` answers for the midpoint fields — the recap draws a price's ratio only while
 * that price is positive (design rule 15), and the zero is what the *previous* run's figure reads as when a
 * march before this one spent none of it.
 */
export function worstPer(summary: WorstPriced, cost: number): number {
  return cost > 0 ? summary.minDamage / cost : 0;
}

/** A stack, as far as the split is concerned: which pool it fights out of and which type it is. */
export type SplitStack = Pick<Stack, 'unitId' | 'pool'>;

/**
 * **What each pool struck for in the worst opening**, summed from the enemy-first journal's own army lines.
 * The three add up to `minDamage` exactly, because they are its terms.
 */
export function worstDamageByPool(
  journal: Pick<BattleJournal, 'entries'>,
  stacks: readonly SplitStack[],
): Record<Pool, number> {
  const poolOf = new Map(stacks.map((stack) => [stack.unitId, stack.pool] as const));
  const byPool: Record<Pool, number> = { leadership: 0, authority: 0, dominance: 0 };
  for (const entry of journal.entries) {
    if (entry.actor !== 'army') continue;
    const pool = poolOf.get(entry.unitId);
    if (pool === undefined) continue;
    byPool[pool] += entry.damage;
  }
  return byPool;
}
