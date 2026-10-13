/**
 * **The lineups the captain advice weighs** (W17 C5a, `docs/plans/progression-advisor.md` §4), built on the main
 * thread: the worker only takes totals already summed (`derive.ts` imports the tables, the store schema and the
 * config), so each lineup's totals are `aggregateBonuses(resolveSources(…))` with `active.captains` swapped for
 * the lineup and every other source left exactly as the march has it.
 *
 * **A lineup is the size of the march's own set** (owner, 2026-10-13): one captain switched on weighs single
 * captains, two weighs pairs, three weighs trios. Asking a one-captain march to add two more answers a different
 * question, because the owner's other captains march elsewhere — the useful suggestion is a swap of the same
 * size. `lineupSize` reads that count from the march; a march with no captain switched on falls back to
 * `LINEUP_SIZE`, so it still gets "which captains to add".
 *
 * The enumeration and the screen are engine (`src/engine/captains.ts`). What lives here is the part that needs
 * the profile: which captains are owned, which the march type admits (`captainCounts`), and what a lineup adds.
 */
import { aggregateBonuses } from '../engine/bonuses';
import { allowedLineups, LINEUP_SIZE, lineupKey } from '../engine/captains';
import type { BonusTotals } from '../engine/types';
import type { BattleSetup, Profile } from './schema';
import { activeEntries, captainCounts, DEFAULT_TABLES, resolveSources } from './derive';
import type { DeriveTables } from './derive';

/** One lineup the advice weighs, with the totals the march would carry if it marched them. */
export interface LineupCandidate {
  key: string;
  /** Profile entry ids of the captains, to put in `active.captains`. */
  entryIds: string[];
  captainIds: string[];
  /** The captains the march has switched on now — its totals are the march's own, untouched. */
  current: boolean;
  totals: BonusTotals;
}

/** The totals the march would carry if it fielded exactly these captains, every other source as it has it. */
export function lineupTotals(
  profile: Profile,
  setup: BattleSetup,
  entryIds: readonly string[],
  tables: DeriveTables = DEFAULT_TABLES,
): BonusTotals {
  const swapped: BattleSetup = { ...setup, active: { ...setup.active, captains: [...entryIds] } };
  return aggregateBonuses(resolveSources(profile, swapped, tables));
}

export interface CaptainLineups {
  /** Key of the current lineup: always one of `lineups`, always the first. */
  currentKey: string;
  lineups: LineupCandidate[];
  /** The size every lineup has: the distinct captains the march switches on, or `LINEUP_SIZE` when none is. */
  size: number;
}

/**
 * **How many captains this march fields** — the distinct captains switched on, capped at `LINEUP_SIZE` (the
 * schema caps the stored count too, so the cap is defensive). Distinct, not the count of stored entries: the
 * same captain can be entered twice and `resolveSources` counts both, but a lineup never fields one twice, so
 * the honest size is the count of distinct captains. With none switched on, `LINEUP_SIZE`, because
 * `allowedLineups(…, 0)` would enumerate only the empty set — the current one — and offer nothing to add.
 */
export function lineupSize(profile: Profile, setup: BattleSetup): number {
  const active = activeEntries(profile.sources.captains, setup.active.captains);
  const distinct = new Set(active.map((entry) => entry.captainId)).size;
  return distinct === 0 ? LINEUP_SIZE : Math.min(distinct, LINEUP_SIZE);
}

/**
 * The current lineup first, as the march has it (its totals are today's, to the last bit, so the current lineup
 * rates 0 against itself and the baseline plan is the main one's), then every other allowed lineup of the owned
 * captains of the march's own size (`lineupSize`), in enumeration order. An enumerated lineup of the same
 * captains as the current one is the current one: it is not listed twice.
 */
export function captainLineups(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): CaptainLineups {
  const { captains } = profile.sources;
  const size = lineupSize(profile, setup);
  const nowEntries = activeEntries(captains, setup.active.captains);
  const now: LineupCandidate = {
    key: lineupKey(nowEntries.map((entry) => entry.captainId)),
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
  const lineups: LineupCandidate[] = [now];
  for (const lineup of allowedLineups(captains, counts, size)) {
    const captainIds = lineup.map((entry) => entry.captainId);
    const key = lineupKey(captainIds);
    if (key === now.key) continue;
    const entryIds = lineup.map((entry) => entry.id);
    lineups.push({
      key,
      entryIds,
      captainIds,
      current: false,
      totals: lineupTotals(profile, setup, entryIds, tables),
    });
  }
  return { currentKey: now.key, lineups, size };
}
