/**
 * **The trios the captain advice weighs** (W17 C5a, `docs/plans/progression-advisor.md` §4), built on the main
 * thread: the worker only takes totals already summed (`derive.ts` imports the tables, the store schema and the
 * config), so each trio's totals are `aggregateBonuses(resolveSources(…))` with `active.captains` swapped for
 * the trio and every other source left exactly as the march has it.
 *
 * The enumeration and the screen are engine (`src/engine/captains.ts`). What lives here is the part that needs
 * the profile: which captains are owned, which the march type admits (`captainCounts`), and what a trio adds.
 */
import { aggregateBonuses } from '../engine/bonuses';
import { allowedTrios, trioKey } from '../engine/captains';
import type { BonusTotals } from '../engine/types';
import type { BattleSetup, Profile } from './schema';
import { activeEntries, captainCounts, DEFAULT_TABLES, resolveSources } from './derive';
import type { DeriveTables } from './derive';

/** One trio the advice weighs, with the totals the march would carry if it marched them. */
export interface TrioCandidate {
  key: string;
  /** Profile entry ids of the captains, to put in `active.captains`. */
  entryIds: string[];
  captainIds: string[];
  /** The captains the march has switched on now — its totals are the march's own, untouched. */
  current: boolean;
  totals: BonusTotals;
}

/** The totals the march would carry if it fielded exactly these captains, every other source as it has it. */
export function trioTotals(
  profile: Profile,
  setup: BattleSetup,
  entryIds: readonly string[],
  tables: DeriveTables = DEFAULT_TABLES,
): BonusTotals {
  const swapped: BattleSetup = { ...setup, active: { ...setup.active, captains: [...entryIds] } };
  return aggregateBonuses(resolveSources(profile, swapped, tables));
}

export interface CaptainTrios {
  /** Key of the current trio: always one of `trios`, always the first. */
  currentKey: string;
  trios: TrioCandidate[];
}

/**
 * The current trio first, as the march has it (its totals are today's, to the last bit, so the current trio
 * rates 0 against itself and the baseline plan is the main one's), then every other allowed trio of the owned
 * captains in enumeration order. An enumerated trio of the same captains as the current one is the current one:
 * it is not listed twice.
 */
export function captainTrios(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): CaptainTrios {
  const { captains } = profile.sources;
  const nowEntries = activeEntries(captains, setup.active.captains);
  const now: TrioCandidate = {
    key: trioKey(nowEntries.map((entry) => entry.captainId)),
    entryIds: nowEntries.map((entry) => entry.id),
    captainIds: nowEntries.map((entry) => entry.captainId),
    current: true,
    totals: aggregateBonuses(resolveSources(profile, setup, tables)),
  };

  const counts = (captainId: string): boolean =>
    captainCounts(
      tables.captains.find((record) => record.id === captainId),
      setup.marchType,
    );
  const trios: TrioCandidate[] = [now];
  for (const trio of allowedTrios(captains, counts)) {
    const captainIds = trio.map((entry) => entry.captainId);
    const key = trioKey(captainIds);
    if (key === now.key) continue;
    const entryIds = trio.map((entry) => entry.id);
    trios.push({
      key,
      entryIds,
      captainIds,
      current: false,
      totals: trioTotals(profile, setup, entryIds, tables),
    });
  }
  return { currentKey: now.key, trios };
}
