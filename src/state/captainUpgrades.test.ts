import { describe, expect, it } from 'vitest';

import { captains as captainTable } from '../data';
import { aggregateBonuses } from '../engine/bonuses';
import { trioKey } from '../engine/captains';
import { captainTrios } from './captainTrios';
import { captainUpgradeCandidates } from './captainUpgrades';
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

describe('captainUpgradeCandidates', () => {
  it('asks a star, a level and ten levels of each captain that gains from them', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const trios = captainTrios(profile, setup);
    const candidates = captainUpgradeCandidates(profile, setup, trios.trios[0]!);
    const beowulf = candidates.filter((candidate) => candidate.spec.captainId === 'beowulf');
    expect(beowulf.map((candidate) => candidate.spec.kind)).toEqual(['star', 'level', 'level10']);
    expect(beowulf.map((candidate) => candidate.change)).toEqual(['★1 → ★2', 'L13 → L14', 'L13 → L23']);
    expect(candidates.every((candidate) => candidate.name.length > 0)).toBe(true);
  });

  it('a captain in the lead trio is tried in the lead trio alone, with the upgrade added', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const lead = captainTrios(profile, setup).trios[0]!;
    const star = captainUpgradeCandidates(profile, setup, lead).find(
      (candidate) => candidate.spec.captainId === 'skadi' && candidate.spec.kind === 'star',
    );
    expect(star?.where).toBe('lead');
    expect(star?.trios).toHaveLength(1);
    expect(star?.trios[0]?.key).toBe(lead.key);
    expect(star?.trios[0]?.entryIds).toEqual(lead.entryIds);
    // The totals are the lead trio's with only that captain's entry raised.
    const raised = structuredClone(profile);
    raised.sources.captains[1]!.star = 2;
    expect(star?.trios[0]?.totals).toEqual(aggregateBonuses(resolveSources(raised, setup)));
  });

  it('a benched captain is tried in every trio that fields it, each with the upgrade', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const lead = captainTrios(profile, setup).trios[0]!;
    const level = captainUpgradeCandidates(profile, setup, lead).find(
      (candidate) => candidate.spec.captainId === 'beowulf' && candidate.spec.kind === 'level',
    );
    expect(level?.where).toBe('bench');
    expect(level?.trios).toHaveLength(6);
    expect(level?.trios.every((trio) => trio.captainIds.includes('beowulf'))).toBe(true);
    expect(new Set(level?.trios.map((trio) => trio.key)).size).toBe(6);
    expect(level?.trios.some((trio) => trio.key === lead.key)).toBe(false);
    const trio = level?.trios.find((candidate) => candidate.key === trioKey(['beowulf', 'aydae', 'skadi']));
    const raised = structuredClone(profile);
    raised.sources.captains[3]!.level = 14;
    const swapped = { ...setup, active: { ...setup.active, captains: trio!.entryIds } };
    expect(trio!.totals).toEqual(aggregateBonuses(resolveSources(raised, swapped)));
  });

  it('a captain at the top star has no star upgrade', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2'], 6);
    const lead = captainTrios(profile, setup).trios[0]!;
    const kinds = new Set(
      captainUpgradeCandidates(profile, setup, lead).map((candidate) => candidate.spec.kind),
    );
    expect(kinds.has('star')).toBe(false);
  });

  it('a captain with no bonus lines is not asked about', () => {
    const { profile, setup } = withRoster(['aurora', 'skadi', 'sofia', 'beowulf'], ['c1', 'c2', 'c3']);
    const bare = captainTable.find((record) => record.id === 'aurora');
    expect(bare?.health).toBeUndefined();
    const lead = captainTrios(profile, setup).trios[0]!;
    const asked = captainUpgradeCandidates(profile, setup, lead).map((candidate) => candidate.spec.captainId);
    expect(asked).not.toContain('aurora');
  });

  it('the march type leaves out a captain it does not count', () => {
    const { profile, setup } = withRoster(['amanitore', 'skadi', 'sofia', 'beowulf'], ['c1', 'c2', 'c3']);
    setup.marchType = 'solo';
    const lead = captainTrios(profile, setup).trios[0]!;
    const asked = new Set(
      captainUpgradeCandidates(profile, setup, lead).map((candidate) => candidate.spec.captainId),
    );
    expect(asked.has('amanitore')).toBe(false);
    expect(asked.has('skadi')).toBe(true);
  });

  it('does not touch the profile it reads', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const before = structuredClone(profile);
    captainUpgradeCandidates(profile, setup, captainTrios(profile, setup).trios[0]!);
    expect(profile).toEqual(before);
  });
});
