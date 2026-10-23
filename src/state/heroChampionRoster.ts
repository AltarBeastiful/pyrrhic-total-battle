/**
 * **The heroes the champion pass rates** (`docs/plans/the-hero-champion.md`), built on the main thread like the
 * lineups: the worker takes totals already summed. A variant is the march with the leadership housing moved by a
 * small shift (experiment 262: a valley is read on the mean of three plans).
 */
import { distinctCaptains } from '../engine/captains';
import type { ChampionHero } from '../engine/heroChampion';
import type { BonusTotals } from '../engine/types';
import type { ChampionRoster, ChampionVariant } from '../worker/heroChampion';
import { buildPlanRequest, DEFAULT_TABLES } from './derive';
import type { DeriveTables } from './derive';
import { lineupTotals } from './captainLineups';
import type { BattleSetup, Profile } from './schema';

export function championRoster(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): ChampionRoster {
  const record = (captainId: string) => tables.captains.find((candidate) => candidate.id === captainId);
  // A hero with no fighting line (an economy hero) changes no battle: it is left out.
  const owned = distinctCaptains(profile.sources.captains).filter((entry) => {
    const found = record(entry.captainId);
    return found?.health !== undefined || found?.strength !== undefined || found?.special !== undefined;
  });
  const heroes: ChampionHero[] = owned.map((entry) => {
    const found = record(entry.captainId);
    return {
      captainId: entry.captainId,
      name: found?.name ?? entry.captainId,
      // The grid starts at level 1 (a hero at level 0 is rated there).
      level: Math.max(1, entry.level),
      star: entry.star,
      ...(found?.onlyOn === undefined ? {} : { onlyOn: found.onlyOn }),
    };
  });
  const entryOf = new Map(owned.map((entry) => [entry.captainId, entry]));

  const variant = (jitter: number): ChampionVariant => {
    const shifted: BattleSetup = {
      ...setup,
      housing: { ...setup.housing, leadership: Math.round(setup.housing.leadership * (1 + jitter)) },
    };
    const totalsOf = (
      ids: readonly string[],
      raise?: { captainId: string; star: number; level: number },
    ): BonusTotals => {
      const entries = ids.flatMap((captainId) => entryOf.get(captainId) ?? []);
      const raised: Profile =
        raise === undefined
          ? profile
          : {
              ...profile,
              sources: {
                ...profile.sources,
                captains: profile.sources.captains.map((entry) =>
                  entry.id === entryOf.get(raise.captainId)?.id
                    ? { ...entry, level: raise.level, star: raise.star }
                    : entry,
                ),
              },
            };
      return lineupTotals(
        raised,
        shifted,
        entries.map((entry) => entry.id),
        tables,
      );
    };
    return {
      input: buildPlanRequest(profile, shifted),
      none: lineupTotals(profile, shifted, [], tables),
      hero: (captainId, star, level) => totalsOf([captainId], { captainId, star, level }),
      trio: totalsOf,
    };
  };
  return { heroes, variant };
}
