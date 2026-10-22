/**
 * **The heroes the hero report weighs** (`docs/plans/hero-report.md`), built on the main thread like the lineups
 * (`captainLineups.ts`): the worker takes totals already summed. The march with no hero is the baseline; a *solo* is one
 * hero alone, a *trio* three, every other source left exactly as the march has it. Owned heroes with a fighting line only (level 1 and above,
 * `distinctCaptains`); the catalog for "worth getting" lists every captain of the game.
 */
import { CAMPAIGN } from '../config';
import { captains as captainTable } from '../data';
import { worthUpgrades } from '../engine/captainUpgrades';
import type { CatalogHero, HeroInfo } from '../engine/heroReport';
import { distinctCaptains, lineupKey } from '../engine/captains';
import type { BattleSetup, Profile } from './schema';
import { captainCounts, captainValue, DEFAULT_TABLES } from './derive';
import type { DeriveTables } from './derive';
import { lineupTotals } from './captainLineups';
import { changeOf, raised, worthOf } from './captainUpgrades';
import type { HeroProbe, HeroRoster } from '../worker/heroReport';

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
  const record = (captainId: string) => tables.captains.find((candidate) => candidate.id === captainId);
  // A hero with no fighting line (an economy hero) changes no battle: it is left out of every role and trio.
  const owned = distinctCaptains(profile.sources.captains).filter((entry) => {
    const found = record(entry.captainId);
    return found?.health !== undefined || found?.strength !== undefined || found?.special !== undefined;
  });
  const heroes: HeroInfo[] = owned.map((entry) => {
    const found = record(entry.captainId);
    return {
      captainId: entry.captainId,
      name: found?.name ?? entry.captainId,
      level: entry.level,
      star: entry.star,
      ...(found?.onlyOn === undefined ? {} : { onlyOn: found.onlyOn }),
    };
  });
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
  // A hero limited to one kind of march is rated on its own (the report's situational block), never in a trio.
  const general = owned.filter((entry) => record(entry.captainId)?.onlyOn === undefined);
  const trios: ReturnType<typeof lineup>[] = [];
  for (let i = 0; i < general.length; i += 1)
    for (let j = i + 1; j < general.length; j += 1)
      for (let k = j + 1; k < general.length; k += 1)
        trios.push(lineup([general[i]!, general[j]!, general[k]!]));
  const have = new Set(owned.map((entry) => entry.captainId));
  const catalog: CatalogHero[] = captainTable.map((captain) => ({
    captainId: captain.id,
    name: captain.name,
    difficulty: CAMPAIGN.heroReport.difficulty[captain.id] ?? CAMPAIGN.heroReport.defaultDifficulty,
    rating: topRating(captain),
    owned: have.has(captain.id),
  }));
  const entryOf = new Map(owned.map((entry) => [entry.captainId, entry]));
  const counts = (captainId: string): boolean => captainCounts(record(captainId), setup.marchType);
  const specs = worthUpgrades(owned, counts, (captainId, level, star) =>
    worthOf(record(captainId), level, star),
  );
  const upgrades = (trio: readonly string[] | null): HeroProbe[] => {
    const trioEntries = trio === null ? [] : trio.flatMap((id) => entryOf.get(id) ?? []);
    const trioBase = trioEntries.length === 0 ? null : lineup(trioEntries);
    const out: HeroProbe[] = [];
    const bases = new Map<string, ReturnType<typeof lineup>>();
    const baseOf = (picked: typeof owned) => {
      const key = lineupKey(picked.map((entry) => entry.captainId));
      const found = bases.get(key) ?? lineup(picked);
      bases.set(key, found);
      return found;
    };
    const probe = (spec: (typeof specs)[number], role: 'solo' | 'trio', picked: typeof owned) => {
      const after = raised(profile, spec);
      const base = baseOf(picked);
      const name = record(spec.captainId)?.name ?? spec.captainId;
      out.push({
        id: `${role}:${spec.id}`,
        label: `${name} ${changeOf(spec)}`,
        captainId: spec.captainId,
        role,
        kind: spec.kind,
        size: spec.size,
        base: { key: base.key, totals: base.totals },
        upgraded: {
          key: `${base.key}+${spec.id}`,
          totals: lineupTotals(
            after,
            setup,
            picked.map((entry) => entry.id),
            tables,
          ),
        },
      });
    };
    for (const spec of specs) {
      const entry = entryOf.get(spec.captainId);
      if (entry === undefined) continue;
      probe(spec, 'solo', [entry]);
      if (trioBase !== null && trioEntries.includes(entry)) probe(spec, 'trio', trioEntries);
    }
    return out;
  };
  return {
    heroes,
    none: { key: '', totals: lineupTotals(profile, setup, [], tables) },
    solos: owned.map((entry) => lineup([entry])),
    // A roster of three or fewer still has its one trio (every hero together), as `allowedLineups` has it.
    trios: trios.length === 0 && general.length > 0 ? [lineup(general)] : trios,
    catalog,
    upgrades,
  };
}
