import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../engine/bonuses';
import { newProfile } from './defaults';
import { resolveSources } from './derive';
import { heroRoster } from './heroRoster';
import type { BattleSetup, Profile } from './schema';

function withRoster(captainIds: string[], levels: number[]) {
  const profile: Profile = newProfile('Test', 'device-1');
  const setup: BattleSetup | undefined = profile.setups[0];
  if (!setup) throw new Error('newProfile() must create exactly one setup');
  profile.sources.captains = captainIds.map((captainId, index) => ({
    id: `c${String(index)}`,
    captainId,
    level: levels[index] ?? 1,
    star: 1,
  }));
  setup.active.captains = ['c0', 'c1', 'c2'].slice(0, captainIds.length);
  return { profile, setup };
}

describe('heroRoster', () => {
  it('lists owned heroes only, each alone and in every trio, over the march with no hero', () => {
    const { profile, setup } = withRoster(
      ['aydae', 'skadi', 'sofia', 'beowulf', 'brann'],
      [10, 10, 0, 10, 10],
    );
    const roster = heroRoster(profile, setup);
    // Sofia is at level 0: not owned.
    expect(roster.heroes.map((hero) => hero.captainId)).toEqual(['aydae', 'skadi', 'beowulf', 'brann']);
    expect(roster.solos.map((solo) => solo.key)).toEqual(['aydae', 'skadi', 'beowulf', 'brann']);
    expect(roster.trios).toHaveLength(4);
    const cleared = structuredClone(setup);
    cleared.active.captains = [];
    expect(roster.none.totals).toEqual(aggregateBonuses(resolveSources(profile, cleared)));
    const solo = structuredClone(setup);
    solo.active.captains = ['c1'];
    expect(roster.solos[1]?.totals).toEqual(aggregateBonuses(resolveSources(profile, solo)));
  });

  it('three heroes or fewer make one trio of them all', () => {
    const { profile, setup } = withRoster(['aydae', 'skadi'], [10, 10]);
    expect(heroRoster(profile, setup).trios.map((trio) => trio.captainIds)).toEqual([['aydae', 'skadi']]);
  });

  it('the catalog lists every captain with its difficulty and whether it is owned', () => {
    const { profile, setup } = withRoster(['skadi'], [10]);
    const { catalog } = heroRoster(profile, setup);
    expect(catalog?.find((hero) => hero.captainId === 'skadi')).toMatchObject({ owned: true, difficulty: 9 });
    expect(catalog?.find((hero) => hero.captainId === 'sofia')).toMatchObject({
      owned: false,
      difficulty: 2,
    });
    expect(catalog?.find((hero) => hero.captainId === 'aurora')?.difficulty).toBe(5);
  });
});
