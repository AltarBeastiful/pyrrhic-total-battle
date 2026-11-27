/**
 * The most Leadership and Dominance a Prime Arena squad can lead (B-43): the sum of its captains' figures at their
 * level, raised by the capacity bonus percentages, floored. The hero is not part of it.
 *
 * Everything the maximum comes from is gathered first, as the **basis**; the maximum is a function of the basis alone,
 * and the profile saves the basis, so a page can tell whether the pools it holds still answer today's inputs. A new
 * input of the maximum (B-44: Zeus' Lightning) is one more field of the basis, read by `arenaMaximum`.
 *
 * Pure.
 */
import { capacities } from '../data';
import type { ArenaCapacityBasis, Profile } from '../state/schema';
import type { Housing } from './types';

/** The two pools the arena has. */
export type ArenaPools = Pick<Housing, 'leadership' | 'dominance'>;

/**
 * The inputs of the maximum: each squad captain with his level (an entry the account no longer has is nobody; the
 * squad's order means nothing) and the other capacity bonus %.
 */
export function arenaCapacityBasis(
  owned: Profile['sources']['captains'],
  squad: readonly string[],
  otherCapacity: number,
): ArenaCapacityBasis {
  const captains = squad
    .flatMap((id) => {
      const entry = owned.find((candidate) => candidate.id === id);
      return entry === undefined ? [] : [{ captainId: entry.captainId, level: entry.level }];
    })
    .sort((a, b) => a.captainId.localeCompare(b.captainId) || a.level - b.level);
  return { captains, other: otherCapacity };
}

/** What a captain leads at this level: nothing at level 0, and no more than at the last level of the game's table. */
function captainCapacity(pool: keyof ArenaPools, level: number): number {
  const ladder = capacities.captain[pool];
  return ladder[Math.min(level, ladder.length) - 1] ?? 0;
}

/**
 * floor(sum × (1 + bonus % / 100)), in whole numbers so that no floating-point drift can lose a unit: percentages
 * carry two decimals at most, so the bonus is a whole number of hundredths of a percent.
 */
function raised(sum: number, percent: number): number {
  const scaled = sum * (10_000 + Math.round(percent * 100));
  return (scaled - (scaled % 10_000)) / 10_000;
}

export function arenaMaximum(basis: ArenaCapacityBasis): ArenaPools {
  const pool = (name: keyof ArenaPools): number =>
    raised(
      basis.captains.reduce((sum, captain) => sum + captainCapacity(name, captain.level), 0),
      basis.other,
    );
  return { leadership: pool('leadership'), dominance: pool('dominance') };
}
