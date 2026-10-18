/**
 * **The sheltered raise**: the mercenary and monster counts, up to what the troops still shelter (S-142;
 * owner, 2026-09-29: *"let's add a button in the battle summary next to monsters and mercs to safely up the
 * number of monsters or merc while keeping them shielded against … a slider with three options: default
 * count, maximize number and spent (rounding to the nearest 10 number that's still shielded), maximize
 * global (going to nearest count that's still shielded not caring about rounding to 10)"*).
 *
 * The idea is the parked note's (`src/kernel/todos.md:7`): the plan sizes the hired stacks to a **trade** —
 * damage against the stock burnt over four marches — so on many armies it stops below the line the shelter
 * draws. The player could already retype every count by hand; what he could not do is ask for *"the most
 * mercs you can"* and be told where the troops stop sheltering them.
 *
 * **The line is the engine's own** (`shelterUnder`, `engine/plan.ts:1472`): the enemy wipes the highest-HP
 * living stack first, so a hired stack is safe while its `totalHp` is strictly below the lowest troop
 * stack's — the troop floor. The most units that sit under it is `ceil(floor / hpPerUnit) − 1`, the exact
 * expression the plan lowers a stack to; this module raises to it instead, and never past it.
 *
 * **It is not a sizer.** Nothing here runs the ladder, the pools or the battle: it is arithmetic over the
 * march on screen, the same species as `manual.ts`, and its answer is a `Record<unitId, count>` the caller
 * replays like a hand-typed count. Every bound it honours is one the march already lives under — the troops'
 * own health, the authority or dominance the housing pays, the mercenary stock the account owns — so it can
 * never produce a march the game would refuse.
 */
import { CHUNK, chunks } from '@/engine';
import type { Pool, Stack, StackRequest, StackResult } from '@/engine/types';

import { applyCounts } from './manual';

/**
 * How many counts one sweep samples across a stack's whole range before refining, and how many sweeps the
 * damage climb may make. Bounded on purpose: this is derived on the main thread every time the March
 * re-derives, and a walk that has stopped improving has finished (see `climbedCounts`).
 */
const COARSE_SAMPLES = 16;
const MAX_CLIMB_PASSES = 3;

/**
 * What the raise reads off the march's request, and the whole of what it reads: the types it can field (for
 * their housing cost), their stock, and the pools that pay for them. Narrowed on purpose — the caller hands
 * over the march's own request, and a test can write these three without standing up a whole march.
 */
export type RaiseRequest = Pick<StackRequest, 'units' | 'caps' | 'housing'>;

/**
 * What one pool is asked for. `off` is the generated counts, and the state every march opens in — which is
 * why `raisedCounts` answers `null` when both pools are off: a mode nobody moved changes nothing at all.
 *
 * `most` and `tens` promise **units** — the most the shelter allows. The other three promise **damage**,
 * which is a different thing on purpose (S-143; owner, 2026-09-29: *"give both positions but defer the best
 * damage option to after the most is implemented as a second step"*): a stack with more units has more total
 * HP, so it climbs the kill order and survives fewer rounds, and the units bought can be paid for with a
 * round of strikes. His own battle report of 2026-09-29 is the proof of the mechanic — 14 stacks, 28 hits,
 * each stack's hits being its kill position — and experiment 142 priced it: on his account `Most` never
 * *lost* damage over 16 readings, but the mechanism is real.
 *
 * **`v2` is that damage answered exhaustively** (S-143b; owner, 2026-09-29: *"implement best V2 and add it to
 * the interface"*). Its search is the kernel's (`src/kernel/raise.ts`), its own job is `raise` (`src/worker/protocol.ts`), and it
 * walks a box of up to a million vectors in the worker (measured: 0 ms on a small box, **46 s** on the
 * widest). **It is not answered by `raisedCounts`**: this function cannot run a search, so it reads `v2` as
 * **the climb** — `climbedCounts`, the sampled walk that is both the seed the search starts from and the
 * answer the March draws while it runs, which the search can only improve on (the worker's `runRaise`).
 *
 * **`safe` and `tight` are that same search under a cap on the rare stock** (S-144; owner, 2026-09-29:
 * *"we could have a safe best-v2 that is bestv2 but accounting for merc lost and dmg/merc"*). A mercenary is
 * the one thing a march does not get back, so the two ask the exhaustive question under a **burn budget**:
 * `safe` may not burn more authority chunks than the climb, `tight` may not burn more than the **plan's own
 * counts** — not one extra chunk. Measured (experiment 183, `out/183-safe-raise.md`): `safe` keeps 9 of
 * `v2`'s 10 gains and never spends a chunk for them, and `tight` beats the plan's own march by +3.85 %
 * median on 28 of 45 stops at the same stock. **Ranking on damage a mercenary outright is a trap** —
 * measured at −7.25 % median damage, and investigation 0019's own finding — so neither position optimises
 * that ratio; they bound the stock instead, which is the same promise without the trap.
 *
 * **`best` was a fourth damage position and is gone** (S-145; owner, 2026-09-29: *"remove the ones that never
 * improves of the other"*). It was this same climb, shipped as a segment of its own, and the benchmark that
 * prices every position on every stop of every army (`out/180-the-positions.md`) found it **never better
 * than `safe`**: on the 41 stops it moved, damage equal or above on 41, the stock burnt equal or below on 41.
 * The climb is not lost by the removal — it is what the three exhaustive positions draw from their first
 * frame and the vector their search starts from — so the segment's only unique offer was answering without
 * the worker's wait, which the control gets anyway: the climb is drawn the moment the segment is pressed.
 */
export type RaiseMode = 'off' | 'tens' | 'most' | 'v2' | 'safe' | 'tight' | 'tightOld';

/** The two pools a hired stack is paid out of — the ones this control speaks for. */
export interface RaiseModes {
  authority: RaiseMode;
  dominance: RaiseMode;
}

export const NO_RAISE: RaiseModes = { authority: 'off', dominance: 'off' };

/**
 * **Where a run starts, and where Reset puts it back** (owner, 2026-10-07: *"Tight almost always feels better
 * than as is [...] lets move it as default"*): `Tight` over both hired pools. `NO_RAISE` stays the "nothing
 * raised" value the arithmetic compares against.
 */
export const DEFAULT_RAISE: RaiseModes = { authority: 'tight', dominance: 'tight' };

/** The pools the control is drawn on, in the card's own order. Leadership is what shelters, never what is sheltered. */
export const RAISED_POOLS = ['authority', 'dominance'] as const;

/** One of the two pools a hired stack is paid out of. */
export type RaisedPool = (typeof RAISED_POOLS)[number];

/**
 * **Whether each hired pool is pushed to the most its kill order takes** (S-159; owner, 2026-10-12: *"we're just
 * raising the merc count while preserving the kill order computed by tight … push a merc or monster resource to
 * the max while keeping the same kill order"*), and the state every march opens in.
 *
 * A **standing rule of the same species as `RaiseModes`**, for the same reason: the counts it means are derived
 * from the march on screen every time (`useMarch`), so a press of the pool line's own button can put it back and
 * it outlives a Generate (`runStore.pushed`).
 */
export const NO_PUSH: Record<RaisedPool, boolean> = { authority: false, dominance: false };

/** The pools a push record has on, in the card's own order. One reading, so two callers cannot filter two ways. */
export function pushedOn(pushed: Record<RaisedPool, boolean>): RaisedPool[] {
  return RAISED_POOLS.filter((pool) => pushed[pool]);
}

/**
 * **The positions answered by the worker's search and not by arithmetic in a render** (S-143b, S-144):
 * `v2` and the two burn-capped readings of it. Named once so that everything which has to tell them apart
 * from the positions answered in the render — the control's spinner, the search's key, the store's *"one
 * standing rule over both blocks"*, the pane's own silence — asks one question rather than four.
 *
 * **They are also the positions that promise damage rather than units**, and that is one fact and not two
 * since S-145: `best` was the fourth, the only damage answer that needed no search, and removing it left the
 * two sets equal. `safe` and `tight` promise damage **under a cap on the stock**, which is still damage and
 * not units: what they will not do is buy it with more chunks than the climb (`safe`) or than the plan's own
 * counts (`tight`). So `MarchFoot.tsx` asks *this* when it decides the pane's sentence is not earned —
 * a damage position stands the stacks where the march hits hardest, which is often lower down and no near
 * tie at all, and a line about a near tie would be a paragraph about nothing.
 */
export const EXHAUSTIVE_MODES = ['v2', 'safe', 'tight', 'tightOld'] as const satisfies readonly RaiseMode[];

/** Whether this position's answer comes from the worker's exhaustive search rather than from the render. */
export function isExhaustive(mode: RaiseMode): boolean {
  return (EXHAUSTIVE_MODES as readonly RaiseMode[]).includes(mode);
}

/**
 * The troop floor: the lowest troop stack's total HP, which is the line every hired stack must stay under.
 * `null` when the march fields no living troop — there is then nothing to shelter a hired stack, and the
 * control must not be drawn (design rule 15: nothing on screen without value).
 *
 * Read the way `shelterUnder` reads it (`engine/plan.ts:1478`, a fold over the living troops) and the way
 * `readShelter` does (`shelter.ts:29`), so the three can never disagree about where the line is.
 */
export function troopFloor(base: StackResult): number | null {
  let floor = Number.POSITIVE_INFINITY;
  for (const stack of base.stacks) {
    if (stack.pool !== 'leadership' || stack.count <= 0) continue;
    floor = Math.min(floor, stack.totalHp);
  }
  return Number.isFinite(floor) && floor > 0 ? floor : null;
}

/**
 * The most units of a type that still sit **strictly** under the floor — the same number `shelterUnder`
 * lowers a stack to, `ceil(floor / hp) − 1`, and zero when not even one unit fits.
 */
export function shelterCeiling(floor: number, hpPerUnit: number): number {
  if (!(floor > 0) || !(hpPerUnit > 0)) return 0;
  return Math.max(0, Math.ceil(floor / hpPerUnit) - 1);
}

/**
 * **The largest multiple of ten at or below a ceiling** (the `tens` position; owner: *"rounding to the
 * nearest 10 number that's still shielded"*). Down and never up: rounding up is the one thing that would
 * put the stack over the line, and reviving works in tens, so a count in tens is a count the game can hand
 * back without a remainder. `CHUNK` is the engine's own ten (`engine/recovery.ts:107`) — the sizer's
 * `roundDownToChunks` is module-private, so the number is imported rather than copied.
 */
export function inTens(count: number): number {
  return Math.floor(count / CHUNK) * CHUNK;
}

/** The unit's housing cost, off the request the march was computed with. */
function costOf(request: RaiseRequest, unitId: string): number {
  return request.units.find((unit) => unit.id === unitId)?.cost ?? 0;
}

/** The counts of a whole march, as `applyCounts` reads them. */
export function countsOf(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const stack of base.stacks) out[stack.unitId] = stack.count;
  return out;
}

/**
 * **Whether two counts are the same march** — every type, an absent one counting as zero. `countsOf`'s own
 * partner: one reads a march's counts, this one compares two of them.
 *
 * It exists for the one question the plan's own table has to be asked before the control may read it (S-149,
 * `pricedRaise` in `positions.ts`): every row under the plan is priced on the **plan's own stop**, so it
 * describes the
 * march on screen only while the march on screen **is** that stop. A March edit re-files a re-sized march
 * under the same stamp on purpose (`generate.ts`, *"the same run, re-sized"*), and the counts the table holds
 * are then a raise of a march that is not on screen — over a shelter the edit may have moved.
 */
export function sameCounts(base: StackResult, counts: Record<string, number>): boolean {
  const mine = countsOf(base);
  for (const id of new Set([...Object.keys(mine), ...Object.keys(counts)])) {
    if ((mine[id] ?? 0) !== (counts[id] ?? 0)) return false;
  }
  return true;
}

/**
 * **The authority chunks a march's counts burn** — the number the plan itself is ordered on
 * (`PlanRepeat.mercLost`, `marchOf` in `engine/plan.ts`), read here off the counts alone.
 *
 * It is `Σ chunks(n)` over the **authority** stacks and nothing else (S-102: a trained monster is a price paid
 * in silver, queue and dragon coins, not a stock that drains, so the dominance pool left this axis), and it is
 * **a property of the counts rather than of the fight**: a hired stack the enemy destroys costs its chunks and
 * one it never reaches costs exactly the same (S-88b). That is what makes it a reading the raise's own search
 * can rank on — it costs one multiplication a stack and no battle at all — and it is why the exhaustive
 * answer can be held to a burn budget without replaying anything.
 *
 * `chunks` is the engine's own `ceil(n / 10)` (`engine/recovery.ts`), so this cannot drift from the bill the
 * Temple charges or from the plan's `mercLost`; a test holds the two to each other on real stops.
 */
export function burnOf(base: StackResult, counts: Record<string, number>): number {
  let burned = 0;
  for (const stack of base.stacks) {
    if (stack.pool !== 'authority') continue;
    burned += chunks(Math.max(0, counts[stack.unitId] ?? stack.count));
  }
  return burned;
}

/**
 * **The best damage under the shelter, for one pool** — the counts the march hits hardest with. It is what
 * the March draws while an exhaustive position's search is out, and the seed that search starts from
 * (the kernel's, `runRaise`), which is why it is not a position of its own since S-145: as a segment it was `safe`'s
 * equal or worse on every stop of every benchmark army (`out/180-the-positions.md`).
 *
 * A coordinate climb, the shape `relaxPreservation` already uses (`stacker.ts:180`): one stack at a time,
 * every count from what the plan fields to that stack's ceiling — under the stock and the housing, exactly
 * as `most` — keeping the count that gives the march its best **worst opening**, the reading the plan itself
 * is ranked on (S-108, *"damage is the worst opening, never the average"*), and sweeping again while a sweep
 * still improves. **Only improvements are ever taken**, so it can never lose damage; it can field fewer
 * units than `Most` and never fewer than the plan's own count.
 *
 * **Two samples per range, and a cap on the sweeps.** This runs on the main thread every time the March
 * re-derives, so the walk is bounded rather than exhaustive: a coarse walk of the whole range finds the
 * region, a step-1 walk of one coarse step either side finds the count inside it, and three sweeps is where
 * the climb stops paying — a stack that has not moved in a sweep has finished, and a coordinate climb that
 * improved nothing in a whole sweep has converged. The damage is **not monotone in a count** (a bigger stack
 * dies a round earlier), which is why the whole range is sampled rather than climbed one unit at a time.
 *
 * A type that cannot be raised — at its ceiling already, or held at its stock — is left exactly where it is,
 * and a pool with nothing to move answers `null`: the state that changes nothing.
 */
function climbedCounts(
  request: StackRequest,
  base: StackResult,
  stacks: readonly Stack[],
  floor: number,
  pool: Pool,
): Record<string, number> | null {
  const bounds = new Map<string, number>();
  for (const stack of stacks) {
    const ceiling = shelterCeiling(floor, stack.hpPerUnit);
    const cap = request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER;
    bounds.set(stack.unitId, Math.min(ceiling, cap));
  }

  let counts = countsOf(base);
  let best = damageOf(request, base, counts);

  /** Whether the pool still pays for a candidate: the housing is a bound the climb shares with `most`. */
  const fits = (candidate: Record<string, number>): boolean => {
    let used = 0;
    for (const unit of request.units) {
      if (unit.pool === pool) used += (candidate[unit.id] ?? 0) * unit.cost;
    }
    return used <= request.housing[pool];
  };

  let moved = false;
  for (let pass = 0; pass < MAX_CLIMB_PASSES; pass += 1) {
    let improved = false;
    // From the bottom of the kill order up: the last to fall strikes most, and it is the stack this pool
    // would spend its spare on (`most`'s own order).
    for (const stack of [...stacks].reverse()) {
      const from = counts[stack.unitId] ?? stack.count;
      const to = bounds.get(stack.unitId) ?? from;
      if (to <= from) continue;

      let winner = { count: from, damage: best };
      const consider = (n: number): void => {
        const candidate = { ...counts, [stack.unitId]: n };
        if (!fits(candidate)) return;
        const damage = damageOf(request, base, candidate);
        if (damage > winner.damage) winner = { count: n, damage };
      };

      const step = Math.max(1, Math.ceil((to - from) / COARSE_SAMPLES));
      const coarse: number[] = [];
      for (let n = from + step; n <= to; n += step) coarse.push(n);
      if (coarse.at(-1) !== to) coarse.push(to);
      for (const n of coarse) consider(n);
      if (winner.count > from) {
        for (
          let n = Math.max(from + 1, winner.count - step);
          n <= Math.min(to, winner.count + step);
          n += 1
        ) {
          consider(n);
        }
      }

      if (winner.count > from) {
        counts = { ...counts, [stack.unitId]: winner.count };
        best = winner.damage;
        improved = true;
        moved = true;
      }
    }
    if (!improved) break;
  }

  if (!moved) return null;
  const out: Record<string, number> = {};
  for (const stack of stacks) {
    const now = counts[stack.unitId] ?? stack.count;
    if (now !== stack.count) out[stack.unitId] = now;
  }
  return Object.keys(out).length === 0 ? null : out;
}

/** What a march costs in damage: its worst opening, the figure the plan is ranked on (S-108). */
function damageOf(request: StackRequest, base: StackResult, counts: Record<string, number>): number {
  return applyCounts(request, base, counts).summary.minDamage;
}

/**
 * The counts the selected pools are raised to, or **`null`** when no mode moves anything — the state that
 * leaves the march, its figures and every existing behaviour exactly as they were.
 *
 * Per pool, in the order the spare housing is spent:
 *
 * 1. Every live stack of the pool takes `min(its ceiling, its owned stock)` — and, in the tens position,
 *    that whole number rounded down to a multiple of ten, because a stock of 83 is a count in units and not
 *    a count in tens.
 * 2. The **spare housing** (`capacity − used`) is what pays for the difference, and a stack the housing
 *    cannot fully buy is filled as far as it goes.
 * 3. What it buys first is the owner's rule — *"fill the stack that strikes most first"* (2026-09-29): the
 *    stacks are walked **from the bottom of the kill order up**, which is the model's own `expectedHits`
 *    order (`engine/battle.ts:37`: hits are non-decreasing in the kill position, so the last to fall
 *    strikes most).
 * 4. A stack is only ever **raised**: one already at or above its ceiling — a hand-typed count, a march the
 *    shelter does not reach — keeps what it has. The control promises more units, never fewer.
 *
 * The three exhaustive positions answer a different question and walk differently (S-143b, S-144): they are
 * seeded by `climbedCounts` here, and the search that improves on that seed is the kernel's (`runRaise`).
 * *
 * The stock bound is the account's own (`request.caps`, absent = unlimited) and not the per-march ration a
 * re-size applies (`largestSustained`): the owner asked for *"the maximum number available"*, and spending
 * one march's worth of a stock the plan spreads over four is a decision the player is making on purpose.
 */
export function raisedCounts(
  request: StackRequest,
  base: StackResult,
  modes: RaiseModes,
): Record<string, number> | null {
  if (modes.authority === 'off' && modes.dominance === 'off') return null;
  const floor = troopFloor(base);
  if (floor === null) return null;

  let out: Record<string, number> | null = null;
  for (const pool of RAISED_POOLS) {
    const mode = modes[pool];
    if (mode === 'off') continue;
    // The live stacks of this pool; `base.stacks` is in kill order, first to fall first.
    const stacks = base.stacks.filter((stack) => stack.pool === pool && stack.count > 0);
    if (stacks.length === 0) continue;

    /**
     * **The three exhaustive positions are answered by the climb here** (S-143b, S-144). This function
     * samples because it runs on the main thread between two keystrokes, and the exhaustive answers are
     * the kernel's, in the worker (`runRaise`). The climb is what gives the March a legal, never-worse march from the
     * first frame — the search is seeded with exactly this and takes strict improvements only, so it can
     * only raise the damage above what is drawn now. For `safe` and `tight` the drawn march is also the
     * **cap's own reading**: `safe` may not burn more than this answer, and this answer is what it is
     * measured against.
     */
    if (isExhaustive(mode)) {
      const climbed = climbedCounts(request, base, stacks, floor, pool);
      if (climbed !== null) {
        out ??= {};
        Object.assign(out, climbed);
      }
      continue;
    }

    // The housing the march is paid out of is the request's own (`StackResult.pools[].capacity` is the same
    // number, filled from it); what the march has already spent comes off the stacks it is raising.
    let spare = Math.max(0, request.housing[pool] - base.pools[pool].used);

    for (const stack of [...stacks].reverse()) {
      const cost = costOf(request, stack.unitId);
      const ceiling = shelterCeiling(floor, stack.hpPerUnit);
      const cap = request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER;
      // **The tens rule rounds the count and not only the ceiling**: a stock of 83 is a cap like any other,
      // and a march that fields 83 of a type in tens is not in tens at all (the sizer floors a cap-bound
      // count too — `roundDownToChunks` runs after `unitsForTarget` has taken the cap).
      const wanted = mode === 'tens' ? inTens(Math.min(ceiling, cap)) : Math.min(ceiling, cap);
      if (wanted <= stack.count) continue;
      // A type that costs nothing is bounded by its ceiling alone: the sizer never fields one (`unitsForTarget`
      // drops a non-positive cost), so this is a guard and not a case.
      const room = cost > 0 ? Math.floor(spare / cost) : Number.MAX_SAFE_INTEGER;
      const next = Math.min(wanted, stack.count + room);
      if (next <= stack.count) continue;
      spare -= (next - stack.count) * cost;
      out ??= {};
      out[stack.unitId] = next;
    }
  }
  return out;
}

/**
 * **The most units a pool can take without moving the kill order** (S-159; owner, 2026-10-12: *"we're just
 * raising the merc count while preserving the kill order computed by tight … push a merc or monster resource to
 * the max while keeping the same kill order and same optimization for stacking"*).
 *
 * The complaint it answers is the plan's own trade: the sizer stops the hired stacks below the line the shelter
 * draws (`raisedCounts`' own doc), and the only lever that bought the rest was moving up the bar, which pays for
 * them in silver. This is the other lever, and it changes nothing that is there: it reads the march on screen,
 * adds units to the stacks of the pools asked for, and leaves every other count, and the plan itself, alone.
 *
 * **The line it lifts a stack to is its neighbour's, not the troops'.** The enemy kills the highest-HP living
 * stack first (`engine/battle.ts`), so the order on screen survives exactly while every stack stands **strictly
 * under** the total HP of the one above it — that is the whole of the promise, and it is `shelterCeiling`, the
 * same expression the shelter applies to the troop floor (`raise.ts`, `engine/plan.ts`'s `shelterUnder`), with
 * the stack above in place of the floor. **Strictly**, because a tie is not preservation: `applyCounts` breaks a
 * tie by the base index and not by the order on screen (`manual.ts`), so a stack raised to exactly its
 * neighbour's health can swap places with it — and a tie is not shelter there either.
 *
 * **Two walks and a loop**, none of them a battle, because the two bounds pull in opposite directions: a stack's
 * ceiling is read **top-down** (the stack above is what it must stay under) while the pool's spare housing is
 * spent **bottom-up** (the owner's own rule for the sheltered raise: *"fill the stack that strikes most first"*,
 * `raisedCounts` step 3 — the last to fall strikes most). One pass therefore counts each stack against the
 * **achieved** health of the stack above it, which is the answer to "may it move at all"; the raising that pass
 * buys then *opens* the line under it, and the next pass takes that room in turn. The loop stops when a pass
 * moves nothing, and one pass per stack of the march is a bound rather than a budget: the room a stack opens can
 * only travel one link down the kill order a pass.
 *
 * Every intermediate vector is legal, so the answer is: a stack only ever rises to a ceiling read off health the
 * march really has, and the health it must stay under only ever rises with it.
 *
 * **It only ever adds**: a stack at or above its ceiling — an unsheltered march, a count typed by hand, a stock
 * below the ceiling — keeps what it has. Answers `null` when nothing moves, which is the state the pool line's
 * own button is hidden in.
 *
 * `start` is the march **on screen** (`applyCounts` over the raise and the typing, `useMarch`), never the
 * generated result: a standing `tight` raise on the other block has to be visible to this pool's chain, or a
 * mercenary stack is pushed straight through a raised monster stack, and the spare housing has to be read off
 * what is really fielded.
 */
export function pushedCounts(
  request: RaiseRequest,
  start: StackResult,
  pools: readonly RaisedPool[],
  /**
   * The player's burn ceiling in authority chunks (`docs/plans/burn-ceiling.md` §3.2): the push may not take
   * the mercenaries past it. Units inside a chunk already burnt are free, so a march over it may still fill
   * its last tens; it may never open a new one. Left out, the housing, the stock and the line are the bounds.
   */
  burnCap?: number,
): Record<string, number> | null {
  if (pools.length === 0) return null;
  /**
   * **No troops, no push** — the same rule the sheltered raise answers by (`raisedCounts`, *"there is then
   * nothing to shelter a hired stack"*). It is also the guard that keeps the open end of the chain finite: the
   * first stack of a march with no troop under it has nothing over it, and a pool with no line at all is not a
   * march a plan makes — the control is not drawn there either (`canRaise`, `useMarch`).
   */
  if (troopFloor(start) === null) return null;
  /**
   * The stacks the push may move, and the two reasons it may not: an empty stack is not on the field (it is not
   * in `start.stacks` at all), and a type the game gives no health cannot be ceiled — its total HP is nought
   * whatever its count, so it would carry nought down to everything below it and stop the pool dead.
   */
  const pushing = (stack: Stack): boolean =>
    stack.count > 0 && stack.hpPerUnit > 0 && (pools as readonly Pool[]).includes(stack.pool);
  const capOf = (unitId: string): number => request.caps[unitId] ?? Number.MAX_SAFE_INTEGER;

  const counts: Record<string, number> = {};
  for (const stack of start.stacks) counts[stack.unitId] = stack.count;

  for (let pass = 0; pass <= start.stacks.length; pass += 1) {
    // The line each pushed stack stands under, in kill order, first to fall first: the health of the stack
    // above as the march stands now. `Infinity` above the first, since nothing is over it.
    const ceilings = new Map<string, number>();
    let limit = Number.POSITIVE_INFINITY;
    for (const stack of start.stacks) {
      const now = counts[stack.unitId] ?? stack.count;
      if (pushing(stack)) {
        // `shelterCeiling` is the strict form (`ceil(L/h) - 1`), and the strictness is the promise itself: a
        // tie is not preservation, because `applyCounts` breaks one by the base index and not by the order on
        // screen. `max(now, …)` is the other half — a stack already over its line keeps what it has.
        const top = Math.min(capOf(stack.unitId), shelterCeiling(limit, stack.hpPerUnit));
        ceilings.set(stack.unitId, Math.max(now, top));
      }
      // What stands here is what everything below is ceiled against; a stack the game gives no health is
      // skipped rather than passing nought down.
      if (now * stack.hpPerUnit > 0) limit = now * stack.hpPerUnit;
    }

    // The pool's spare housing, from the bottom of the kill order up: the last to fall strikes most, so it is
    // the stack the spare is worth most on. The stock bound is the account's own (`request.caps`), which only a
    // mercenary has: a monster is trained, so it is bounded by the housing and the line, as the sizer bounds it.
    const next: Record<string, number> = {};
    for (const pool of pools) {
      // Read off the counts **as they stand this pass**, not off the march the push started from: a previous
      // pass has already spent part of the pool, and the housing is a bound on what is fielded, not on what this
      // pass adds.
      let used = 0;
      for (const stack of start.stacks) {
        if (stack.pool === pool)
          used += (counts[stack.unitId] ?? stack.count) * costOf(request, stack.unitId);
      }
      let spare = Math.max(0, request.housing[pool] - used);
      // The chunks the ceiling still allows, read off the counts as they stand this pass (`burnCap`).
      let burnRoom =
        burnCap === undefined || pool !== 'authority'
          ? Number.POSITIVE_INFINITY
          : Math.max(0, Math.floor(burnCap) - burnOf(start, counts));
      for (const stack of [...start.stacks].reverse()) {
        if (stack.pool !== pool || !pushing(stack)) continue;
        const now = counts[stack.unitId] ?? stack.count;
        const ceiling = Math.max(now, ceilings.get(stack.unitId) ?? now);
        // A type that costs nothing is bounded by its ceiling alone: the sizer never fields one, so this is a
        // guard and not a case (`raisedCounts` makes the same one).
        const cost = costOf(request, stack.unitId);
        const room = cost > 0 ? Math.floor(spare / cost) : Number.MAX_SAFE_INTEGER;
        // The burn: the last ten this stack may reach without spending more chunks than the ceiling leaves.
        const burnTop =
          burnRoom === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : CHUNK * (chunks(now) + burnRoom);
        const wanted = Math.min(ceiling, now + room, burnTop);
        if (wanted <= now) continue;
        spare -= (wanted - now) * cost;
        if (burnRoom !== Number.POSITIVE_INFINITY) burnRoom -= chunks(wanted) - chunks(now);
        next[stack.unitId] = wanted;
      }
    }

    let moved = false;
    for (const [unitId, wanted] of Object.entries(next)) {
      if (wanted === counts[unitId]) continue;
      counts[unitId] = wanted;
      moved = true;
    }
    if (!moved) break;
  }

  const answer: Record<string, number> = {};
  for (const stack of start.stacks) {
    const now = counts[stack.unitId];
    if (now !== undefined && now !== stack.count) answer[stack.unitId] = now;
  }
  return Object.keys(answer).length === 0 ? null : answer;
}

/**
 * **What a push costs and buys on one march**, so the pool line can say it before it is pressed: the worst
 * opening after (`positions.ts`' own reading, S-108), the same figure before, and the units the pool adds —
 * which is every unit it loses as well, because the model plays the battle to the end of the army
 * (`rows.ts`'s `lost`).
 */
export interface PushTrade {
  /** The march's worst opening under the pushed counts, or the one on screen when nothing moves. */
  damage: number;
  /** The worst opening of the march the push starts from: what its percentage is read against. */
  before: number;
  /**
   * **What the push costs this pool for good** (owner, 2026-10-12: *"the tooltip reads numbers of merc died, it
   * should be additional merc lost (that cannot be revived)"*). The mercenaries' own reading is the **stock** the
   * march spends (`hiredLost`, one in every ten, `./hired`), which is the figure the plan's trade prints as
   * "Merc" and the recap as "Merc lost" — not the units fielded, which the model loses whole whether they are
   * pushed or not. A monster has no such stock: it is trained and revived with gold (S-102), so its loss is the
   * units themselves.
   */
  lost: number;
}

/**
 * **Whether a pool's line draws its push at all** — the owner's own rule (2026-10-12), and two rules in one
 * answer:
 *
 *  - *"hidden if all mercs that could be entered without changing kill order has already been done"*: a push
 *    that moves no unit is a mark with nothing behind it (design rule 15);
 *  - **and hidden where the push loses damage.** Preserving the kill order is not preserving the *strike* order
 *    — that one is by `count × strengthPerUnit` (`engine/battle.ts`), so on 3 stops of the benchmark's 68
 *    raising the mercenaries moves a stack up it and a stack behind loses a round: the worst opening falls by
 *    4.4 % to 8.4 % (`tools/theorycraft/out/225-the-push.md`). The owner read those three and asked for the mark
 *    to be hidden there rather than to offer the loss, so the button has one meaning — more mercs, more damage,
 *    the same order.
 *
 * **A pool standing pushed keeps its mark whatever the trade says**: the press is the only way back, so the
 * honest figure is drawn and the name says which way it goes.
 */
export function offersPush(trade: PushTrade | null, pressed: boolean): boolean {
  if (trade === null) return false;
  return pressed || trade.damage > trade.before;
}

/**
 * **Every stack of one hired pool rounded to a ten, up or down, whichever trade is best** (owner, 2026-10-16:
 * *"round to ten going upwards or downwards depending on the best trade. same properties as the other
 * button"*). The push's own sibling at the end of the pool line, and a standing rule of the same species
 * (`runStore.rounded`): re-derived from the march on screen every time, so a second press puts it back exactly.
 *
 * Each stack not yet in tens has two candidates, its ten below and its ten above, and every combination of
 * them is **fought** — a round-up can be refused by three bounds the push already keeps (the pool's housing, the
 * account's stock, the kill order) and a round-down by one (the kill order: a stack lowered under its neighbour
 * swaps places with it), and only a replay answers the last one honestly; a tie with a neighbour is refused, as
 * the push refuses one. A round-down never empties a stack, so that is not a candidate.
 *
 * **The best trade is the most damage, then the fewest lost** — the worst opening, as every other figure of the
 * pool line reads it, and on a tie the loss the tooltip prints. Past `ROUND_COMBINATIONS` the stacks are rounded
 * one at a time, the last to fall first, each against the others as they stand.
 *
 * **It never burns a chunk more, so no burn ceiling can bind it** (`docs/plans/burn-ceiling.md` §3.2): a count
 * not in tens burns `⌊n/10⌋ + 1` chunks, which is exactly what its ten above burns, and its ten below burns one
 * less. A rounding can keep the mercenaries' burn or lower it, never raise it.
 *
 * `base` is what `applyCounts` replays over (the generated result), `counts` the march on screen as counts, and
 * `start` that march replayed — the kill order to keep. Stacks in `fixed` (typed by hand) are left alone.
 * Answers `null` when nothing is left to round or no legal rounding exists, the state the button is hidden in.
 */
export function roundedCounts(
  request: StackRequest,
  base: StackResult,
  start: StackResult,
  counts: Record<string, number>,
  pool: RaisedPool,
  fixed: ReadonlySet<string> = new Set(),
): Record<string, number> | null {
  const order = start.stacks.map((stack) => stack.unitId).join('|');
  const candidates: { unitId: string; options: number[] }[] = [];
  // From the bottom of the kill order up, the order the greedy fallback walks.
  for (const stack of [...start.stacks].reverse()) {
    if (stack.pool !== pool || stack.count <= 0 || stack.count % CHUNK === 0 || fixed.has(stack.unitId))
      continue;
    const down = inTens(stack.count);
    const up = down + CHUNK;
    const cap = request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER;
    const options = [...(up <= cap ? [up] : []), ...(down > 0 ? [down] : [])];
    if (options.length > 0) candidates.push({ unitId: stack.unitId, options });
  }
  if (candidates.length === 0) return null;

  const whole: Record<string, number> = { ...countsOf(start), ...counts };
  // The housing bound: a march already over it (typed by hand) may not get worse, and may get better.
  const usedOf = (moves: Record<string, number>): number => {
    let used = 0;
    for (const stack of start.stacks) {
      if (stack.pool === pool) used += (moves[stack.unitId] ?? stack.count) * costOf(request, stack.unitId);
    }
    return used;
  };
  const housing = Math.max(request.housing[pool], usedOf({}));

  /** The worst opening and the loss of one rounding, or `null` where it leaves a bound. */
  const fight = (moves: Record<string, number>): { damage: number; lost: number } | null => {
    if (usedOf(moves) > housing) return null;
    const after = applyCounts(request, base, { ...whole, ...moves });
    if (after.result.stacks.map((stack) => stack.unitId).join('|') !== order) return null;
    // The push's safety net between every health step it touches: a moved stack stands strictly between its
    // neighbours, because a tie is broken by the base index and not by the order on screen.
    const strict = after.result.stacks.every((stack, at) => {
      const above = after.result.stacks[at - 1];
      if (above === undefined) return true;
      const touched = moves[stack.unitId] !== undefined || moves[above.unitId] !== undefined;
      return !touched || stack.totalHp < above.totalHp;
    });
    if (!strict) return null;
    let lost = 0;
    for (const stack of after.result.stacks) {
      if (stack.pool === pool) lost += pool === 'authority' ? chunks(stack.count) : stack.count;
    }
    return { damage: after.summary.minDamage, lost };
  };
  const better = (
    one: { damage: number; lost: number },
    other: { damage: number; lost: number } | null,
  ): boolean =>
    other === null || one.damage > other.damage || (one.damage === other.damage && one.lost < other.lost);

  type Reading = { damage: number; lost: number };
  const combinations = candidates.reduce((product, one) => product * one.options.length, 1);
  if (combinations <= ROUND_COMBINATIONS) {
    let best: { moves: Record<string, number>; reading: Reading } | null = null;
    const walk = (at: number, moves: Record<string, number>): void => {
      const here = candidates[at];
      if (here === undefined) {
        const reading = fight(moves);
        if (reading !== null && better(reading, best?.reading ?? null)) best = { moves, reading };
        return;
      }
      for (const option of here.options) walk(at + 1, { ...moves, [here.unitId]: option });
    };
    walk(0, {});
    return (best as { moves: Record<string, number> } | null)?.moves ?? null;
  }
  const moves: Record<string, number> = {};
  for (const { unitId, options } of candidates) {
    let pick: { option: number; reading: Reading } | null = null;
    for (const option of options) {
      const reading = fight({ ...moves, [unitId]: option });
      if (reading !== null && better(reading, pick?.reading ?? null)) pick = { option, reading };
    }
    if (pick !== null) moves[unitId] = pick.option;
  }
  return Object.keys(moves).length === 0 ? null : moves;
}

/** Past this many combinations `roundedCounts` rounds one stack at a time: six stacks of a pool, both ways. */
const ROUND_COMBINATIONS = 64;

/** Whether this pool is one the control is drawn on at all: a hired pool with a living stack. */
export function raisesPool(pool: Pool): pool is RaisedPool {
  return (RAISED_POOLS as readonly string[]).includes(pool);
}
