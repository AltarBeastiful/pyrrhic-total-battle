/**
 * The most Leadership and Dominance a Prime Arena squad can lead (B-43): the sum of its captains' figures at their
 * level, raised by the capacity bonus percentages, floored. The hero is not part of it.
 *
 * The percentages of a pool are the typed "other" one and what the squad's artifacts add to that pool (B-44: Zeus'
 * Lightning, by its level and by the random lines its star has opened).
 *
 * Everything the maximum comes from is gathered first, as the **basis**; the maximum is a function of the basis alone,
 * and the profile saves the basis, so a page can tell whether the pools it holds still answer today's inputs. A new
 * input of the maximum is one more field of the basis, read by `arenaMaximum`.
 *
 * Pure.
 */
import { artifacts as artifactTable, capacities } from '../data';
import type { ArtifactRecord } from '../data/types';
import { activeEntries, artifactCapacity, artifactLineCount } from '../state/derive';
import type { ArenaCapacityBasis, ArtifactRoll, BattleSetup, Profile } from '../state/schema';
import type { Housing } from './types';

/** The two pools the arena has. */
export type ArenaPools = Pick<Housing, 'leadership' | 'dominance'>;

type ArtifactEntry = Profile['sources']['artifacts'][number];
type BasisArtifact = NonNullable<ArenaCapacityBasis['artifacts']>[number];

const artifactRecord = (id: string): ArtifactRecord | undefined =>
  artifactTable.find((record) => record.id === id);

/** The open random lines of an artifact that raise capacity, in an order of their own: their places mean nothing. */
function capacityLines(record: ArtifactRecord, entry: ArtifactEntry): ArtifactRoll[] {
  return (entry.lines ?? [])
    .slice(0, artifactLineCount(entry.star))
    .flatMap((line) => {
      if (line === null) return [];
      const option = record.randomOptions.find((candidate) => candidate.id === line.option);
      return option?.values[line.rarity].capacity === undefined ? [] : [line];
    })
    .sort((a, b) => a.option.localeCompare(b.option) || a.rarity.localeCompare(b.rarity));
}

/**
 * The inputs of the maximum: each squad captain with his level, each squad artifact that raises capacity with what
 * its bonus comes from (an entry the account no longer has is nobody; the squad's order means nothing) and the other
 * capacity bonus %.
 */
export function arenaCapacityBasis(
  sources: Pick<Profile['sources'], 'captains' | 'artifacts'>,
  squad: Pick<BattleSetup['active'], 'captains' | 'artifacts'>,
  otherCapacity: number,
): ArenaCapacityBasis {
  const captains = activeEntries(sources.captains, squad.captains)
    .map(({ captainId, level }) => ({ captainId, level }))
    .sort((a, b) => a.captainId.localeCompare(b.captainId) || a.level - b.level);
  const artifacts = activeEntries(sources.artifacts, squad.artifacts)
    .flatMap((entry): BasisArtifact[] => {
      const record = artifactRecord(entry.artifactId);
      if (record === undefined || Object.keys(artifactCapacity(record, entry)).length === 0) return [];
      const { artifactId, level, star } = entry;
      return [{ artifactId, level, star, lines: capacityLines(record, entry) }];
    })
    .sort((a, b) => a.artifactId.localeCompare(b.artifactId) || a.level - b.level);
  return { captains, ...(artifacts.length === 0 ? {} : { artifacts }), other: otherCapacity };
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
  const fromArtifacts = (basis.artifacts ?? []).flatMap((held) => {
    const record = artifactRecord(held.artifactId);
    return record === undefined ? [] : [artifactCapacity(record, held)];
  });
  const pool = (name: keyof ArenaPools): number =>
    raised(
      basis.captains.reduce((sum, captain) => sum + captainCapacity(name, captain.level), 0),
      fromArtifacts.reduce((percent, capacity) => percent + (capacity[name] ?? 0), basis.other),
    );
  return { leadership: pool('leadership'), dominance: pool('dominance') };
}
