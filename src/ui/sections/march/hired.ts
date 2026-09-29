/**
 * The hired stock, as the March counts it: what a march burns of it for good, and how much of it the
 * account owns — so the recap can say "83 hired lost · 4 % of the stock" (owner, 2026-09-17: "add a
 * merc lost count with a percent of all mercs available, to see how big the drop is").
 *
 * **Ten hired units cost one** (`chunks()`, the engine's own recovery rule), which is the same count
 * the plan's trade prints as "Merc" and the Details fold divides the damage by, so the three
 * agree on a march. The stock is the caps the request carries for its authority units — the owned
 * counts the Mercenaries card records — and it is unknown while any hired type on the march has no
 * cap at all, because "unlimited" is not a stock a share can be taken of.
 */
import { chunks, lastsMarches } from '@/engine';
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

/** What a stock of `held` buys one stack: the chunks a march burns, the marches left, and the two totals. */
export interface StockRun {
  burn: number; // chunks(count): the one-in-ten a march loses for good
  marches: number; // lastsMarches(held, count): identical marches the stock carries
  stackDamage: number; // marches × this stack's own damage
  marchDamage: number; // marches × the whole march's damage
}

/**
 * **What a stock of hired units buys**: what one march burns of it for good, how many identical marches the
 * stock still carries, and the damage those marches come to — this stack's own and the whole march's. It is
 * the answer to the question a player asks while looking at one hired stack, and it is drawn on the unit
 * sheet where the stack is (S-148).
 *
 * `held` is **the account's own stock** for that unit: the cap the request carries, `request.caps[unitId]`
 * (`buildUnits`, `state/derive.ts:505`), which is the owned count the Mercenaries card records — the same
 * figure `hiredStock` above sums. Only a hired type has one: a troop is retrained and a monster is recruited
 * again, so their count is a price in silver and queue time and no stock drains for them (S-102, *"apart
 * from mercs, they can be trained just like troops"*). Calling this for a troop would be reading a cap that
 * was never written.
 *
 * **The two engine readings are imported and never re-derived** — `chunks` from `engine/recovery.ts` and
 * `lastsMarches` from the engine's index — for the reason `burnOf`'s own doc gives (`raise.ts`): the bill the
 * Temple charges, the plan's `mercLost` and this sheet have to be one number, and a second implementation is
 * how three figures that should agree stop agreeing. It also makes the sheet's figure **the engine's own
 * ceiling rather than a second opinion**: the plan rations the very same way, copying the caps into `sustain`
 * (`engine/plan.ts:3178`) and minoring over `lastsMarches(sustain[id] ?? 0, merc.count)` when it decides how
 * many repeats a stop plays (`engine/plan.ts:3316`), so the sheet says what the plan already charged.
 *
 * **`marches` comes back unclamped, and that is the point of it.** `lastsMarches` is
 * `floor((held − count) / chunks(count)) + 1`, so a stock that cannot field this count even once is a
 * **negative** number rather than nought — 2 000 held against a count of 2 310 is −1, since the first march
 * already owes 310 units the account does not have. The caller draws on `marches >= 1`, and that guard is
 * the one place the case is refused: clamping here to 0 would hand the caller a figure that reads like a
 * stock of nothing rather than like a count nothing can field, which is the difference between "you have run
 * out" and "you never had it". The totals follow the same number, so a negative run is a negative total and
 * not a silent nought either.
 *
 * A **count of zero** is the engine's other end: `chunks(0)` is nought chunks burned and `lastsMarches`
 * answers `Infinity` before it divides (`plan.ts:1537`), so an empty stack costs nothing and runs forever.
 * That is a stack the sheet does not draw at all, and passing one here is a caller error rather than a case
 * to paper over with a second guard.
 */
export function stockRun(held: number, count: number, damage: number, marchDamage: number): StockRun {
  const burn = chunks(count);
  const marches = lastsMarches(held, count);
  return { burn, marches, stackDamage: marches * damage, marchDamage: marches * marchDamage };
}
