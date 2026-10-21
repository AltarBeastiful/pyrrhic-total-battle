import { describe, expect, it } from 'vitest';

import { captains as captainTable } from '../data';
import { aggregateBonuses } from '../engine/bonuses';
import { lineupKey } from '../engine/captains';
import { captainLineups } from './captainLineups';
import { captainUpgradeCandidates, captainWorthCandidates } from './captainUpgrades';
import { newProfile } from './defaults';
import { resolveSources } from './derive';
import type { BattleSetup, Profile } from './schema';

function withRoster(captainIds: string[], active: string[], star = 1) {
  const profile: Profile = newProfile('Test', 'device-1');
  const setup: BattleSetup | undefined = profile.setups[0];
  if (!setup) throw new Error('newProfile() must create exactly one setup');
  profile.sources.captains = captainIds.map((captainId, index) => ({
    id: `c${String(index)}`,
    captainId,
    level: 10 + index,
    star,
  }));
  setup.active.captains = active;
  return { profile, setup };
}

const OWNED = ['aydae', 'skadi', 'sofia', 'beowulf', 'alexander'];

/** The upgrades of `setup`'s march at the march's own lineup size, as `computeCaptains` asks them. */
function upgradesOf(profile: Profile, setup: BattleSetup) {
  const { lineups, size } = captainLineups(profile, setup);
  return captainUpgradeCandidates(profile, setup, lineups[0]!, size);
}

describe('captainUpgradeCandidates', () => {
  it('asks a star, a level and ten levels of each captain that gains from them', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const candidates = upgradesOf(profile, setup);
    const beowulf = candidates.filter((candidate) => candidate.spec.captainId === 'beowulf');
    expect(beowulf.map((candidate) => candidate.spec.kind)).toEqual(['star', 'level', 'level10']);
    expect(beowulf.map((candidate) => candidate.change)).toEqual(['★1 → ★2', 'L13 → L14', 'L13 → L23']);
    expect(candidates.every((candidate) => candidate.name.length > 0)).toBe(true);
  });

  it('a captain in the lead lineup is tried in the lead lineup alone, with the upgrade added', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const lead = captainLineups(profile, setup).lineups[0]!;
    const star = upgradesOf(profile, setup).find(
      (candidate) => candidate.spec.captainId === 'skadi' && candidate.spec.kind === 'star',
    );
    expect(star?.where).toBe('lead');
    expect(star?.lineups).toHaveLength(1);
    expect(star?.lineups[0]?.key).toBe(lead.key);
    expect(star?.lineups[0]?.entryIds).toEqual(lead.entryIds);
    // The totals are the lead lineup's with only that captain's entry raised.
    const raised = structuredClone(profile);
    raised.sources.captains[1]!.star = 2;
    expect(star?.lineups[0]?.totals).toEqual(aggregateBonuses(resolveSources(raised, setup)));
  });

  it('a benched captain is tried in every lineup that fields it, each with the upgrade', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const lead = captainLineups(profile, setup).lineups[0]!;
    const level = upgradesOf(profile, setup).find(
      (candidate) => candidate.spec.captainId === 'beowulf' && candidate.spec.kind === 'level',
    );
    expect(level?.where).toBe('bench');
    expect(level?.lineups).toHaveLength(6);
    expect(level?.lineups.every((lineup) => lineup.captainIds.includes('beowulf'))).toBe(true);
    expect(new Set(level?.lineups.map((lineup) => lineup.key)).size).toBe(6);
    expect(level?.lineups.some((lineup) => lineup.key === lead.key)).toBe(false);
    const lineup = level?.lineups.find(
      (candidate) => candidate.key === lineupKey(['beowulf', 'aydae', 'skadi']),
    );
    const raised = structuredClone(profile);
    raised.sources.captains[3]!.level = 14;
    const swapped = { ...setup, active: { ...setup.active, captains: lineup!.entryIds } };
    expect(lineup!.totals).toEqual(aggregateBonuses(resolveSources(raised, swapped)));
  });

  it('a captain at the top star has no star upgrade', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2'], 6);
    const kinds = new Set(upgradesOf(profile, setup).map((candidate) => candidate.spec.kind));
    expect(kinds.has('star')).toBe(false);
  });

  it('a captain with no bonus lines is not asked about', () => {
    const { profile, setup } = withRoster(['aurora', 'skadi', 'sofia', 'beowulf'], ['c1', 'c2', 'c3']);
    const bare = captainTable.find((record) => record.id === 'aurora');
    expect(bare?.health).toBeUndefined();
    const asked = upgradesOf(profile, setup).map((candidate) => candidate.spec.captainId);
    expect(asked).not.toContain('aurora');
  });

  it('the march type leaves out a captain it does not count', () => {
    const { profile, setup } = withRoster(['amanitore', 'skadi', 'sofia', 'beowulf'], ['c1', 'c2', 'c3']);
    setup.marchType = 'solo';
    const asked = new Set(upgradesOf(profile, setup).map((candidate) => candidate.spec.captainId));
    expect(asked.has('amanitore')).toBe(false);
    expect(asked.has('skadi')).toBe(true);
  });

  it('does not touch the profile it reads', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const before = structuredClone(profile);
    upgradesOf(profile, setup);
    expect(profile).toEqual(before);
  });
});

describe('captainWorthCandidates', () => {
  const worthOf = (profile: Profile, setup: BattleSetup) => {
    const { lineups, size } = captainLineups(profile, setup);
    return captainWorthCandidates(profile, setup, lineups[0]!, size);
  };

  it('asks levels +5/+10/+15 then every remaining star, alone and cumulative, of each captain', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2'], 3);
    const beowulf = worthOf(profile, setup).filter((c) => c.spec.captainId === 'beowulf');
    expect(beowulf.map((c) => c.spec.id)).toEqual([
      'captain:beowulf:level+5',
      'captain:beowulf:level+10',
      'captain:beowulf:level+15',
      'captain:beowulf:star+1',
      'captain:beowulf:star+2',
      'captain:beowulf:star+3',
    ]);
    expect(beowulf.map((c) => c.change)).toEqual([
      'L13 → L18',
      'L13 → L23',
      'L13 → L28',
      '★3 → ★4',
      '★3 → ★5',
      '★3 → ★6',
    ]);
    const record = captainTable.find((r) => r.id === 'beowulf')!;
    const perLevel =
      (record.health?.perLevel ?? 0) + (record.strength?.perLevel ?? 0) + (record.special?.perLevel ?? 0);
    expect(beowulf[0]?.perLevel).toBe(perLevel);
  });

  it('a level step never goes past the top level', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2'], 6);
    profile.sources.captains[3]!.level = 97;
    const levels = worthOf(profile, setup).filter(
      (c) => c.spec.captainId === 'beowulf' && c.spec.kind === 'level',
    );
    expect(levels.map((c) => c.spec.to.level)).toEqual([100]);
    expect(levels[0]?.spec.size).toBe(3);
  });

  it('a captain in the lead lineup is tried in that lineup, a benched one in every lineup that fields it, upgraded', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const lead = captainLineups(profile, setup).lineups[0]!;
    const all = worthOf(profile, setup);
    const inLead = all.find((c) => c.spec.id === 'captain:skadi:star+2');
    expect(inLead?.where).toBe('lead');
    expect(inLead?.lineups.map((l) => l.key)).toEqual([lead.key]);
    const raised = structuredClone(profile);
    raised.sources.captains[1]!.star = 3;
    expect(inLead?.lineups[0]?.totals).toEqual(aggregateBonuses(resolveSources(raised, setup)));
    const bench = all.find((c) => c.spec.id === 'captain:beowulf:level+10');
    expect(bench?.where).toBe('bench');
    expect(bench?.lineups).toHaveLength(6);
    expect(bench?.lineups.every((l) => l.captainIds.includes('beowulf'))).toBe(true);
  });

  it('does not touch the profile it reads', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const before = structuredClone(profile);
    worthOf(profile, setup);
    expect(profile).toEqual(before);
  });
});
