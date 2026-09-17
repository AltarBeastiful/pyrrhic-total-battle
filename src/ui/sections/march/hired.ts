/**
 * The hired stock, as the March counts it: what a march burns of it for good, and how much of it the
 * account owns — so the recap can say "83 hired lost · 4 % of the stock" (owner, 2026-09-17: "add a
 * merc lost count with a percent of all mercs available, to see how big the drop is").
 *
 * **Ten hired units cost one** (`chunks()`, the engine's own recovery rule), which is the same count
 * the plan's trade prints as "Hired lost" and the Details fold divides the damage by, so the three
 * agree on a march. The stock is the caps the request carries for its authority units — the owned
 * counts the Mercenaries card records — and it is unknown while any hired type on the march has no
 * cap at all, because "unlimited" is not a stock a share can be taken of.
 */
import { chunks } from '@/engine/recovery';
import type { Stack, StackRequest, UnitDef } from '@/engine/types';

/** A stack, as far as the hired count is concerned. */
export type HiredStack = Pick<Stack, 'pool' | 'count'>;

/** The hired units a march costs for good: one in every ten of each authority stack. */
export function hiredLost(stacks: readonly HiredStack[]): number {
  return stacks.reduce((sum, stack) => sum + (stack.pool === 'authority' ? chunks(stack.count) : 0), 0);
}

/**
 * Every hired unit the account owns, over the types the march could draw on, or `null` while one of
 * them is uncapped.
 */
export function hiredStock(request: Pick<StackRequest, 'units' | 'caps'>): number | null {
  let stock = 0;
  for (const unit of request.units as readonly Pick<UnitDef, 'id' | 'pool'>[]) {
    if (unit.pool !== 'authority') continue;
    const cap = request.caps[unit.id];
    if (cap === undefined) return null;
    stock += cap;
  }
  return stock;
}
