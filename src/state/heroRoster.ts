/**
 * **The heroes the hero report weighs** (`docs/plans/hero-report.md`), built on the main thread like the lineups
 * (`captainLineups.ts`): the worker takes totals already summed. The march with no hero is the baseline; a *solo* is one
 * hero alone, a *trio* three, every other source left exactly as the march has it. Owned heroes only (level 1 and above,
 * `distinctCaptains`); the catalog for "worth getting" lists every captain of the game.
 */
import { CAMPAIGN } from '../config';
import { captains as captainTable } from '../data';
import type { CatalogHero, HeroInfo } from '../engine/heroReport';
import { distinctCaptains, lineupKey } from '../engine/captains';
import type { BattleSetup, Profile } from './schema';
import { captainValue, DEFAULT_TABLES } from './derive';
import type { DeriveTables } from './derive';
import { lineupTotals } from './captainLineups';
import type { HeroRoster } from '../worker/heroReport';

/** The bonus points a captain gives on all its lines at the top star, at level 1: how the catalog rates it. */
function topRating(record: DeriveTables['captains'][number]): number {
  let total = 0;
  for (const line of [record.health, record.strength, record.special])
    if (line !== undefined) total += captainValue(line, 1, line.stars.length - 1);
  return total;
}

export function heroRoster(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): HeroRoster {
  const owned = distinctCaptains(profile.sources.captains);
  const record = (captainId: string) => tables.captains.find((candidate) => candidate.id === captainId);
  const heroes: HeroInfo[] = owned.map((entry) => ({
    captainId: entry.captainId,
    name: record(entry.captainId)?.name ?? entry.captainId,
    level: entry.level,
    star: entry.star,
    ...(record(entry.captainId)?.onlyOn === undefined ? {} : { onlyOn: record(entry.captainId)?.onlyOn }),
  }));
  const lineup = (picked: typeof owned) => {
    const captainIds = picked.map((entry) => entry.captainId);
    return {
      key: lineupKey(captainIds),
      captainIds,
      totals: lineupTotals(
        profile,
        setup,
        picked.map((entry) => entry.id),
        tables,
      ),
    };
  };
  const trios: ReturnType<typeof lineup>[] = [];
  for (let i = 0; i < owned.length; i += 1)
    for (let j = i + 1; j < owned.length; j += 1)
      for (let k = j + 1; k < owned.length; k += 1) trios.push(lineup([owned[i]!, owned[j]!, owned[k]!]));
  const have = new Set(owned.map((entry) => entry.captainId));
  const catalog: CatalogHero[] = captainTable.map((captain) => ({
    captainId: captain.id,
    name: captain.name,
    difficulty: CAMPAIGN.heroReport.difficulty[captain.id] ?? CAMPAIGN.heroReport.defaultDifficulty,
    rating: topRating(captain),
    owned: have.has(captain.id),
  }));
  return {
    heroes,
    none: { key: '', totals: lineupTotals(profile, setup, [], tables) },
    solos: owned.map((entry) => lineup([entry])),
    // A roster of three or fewer still has its one trio (every hero together), as `allowedLineups` has it.
    trios: trios.length === 0 && owned.length > 0 ? [lineup(owned)] : trios,
    catalog,
  };
}
