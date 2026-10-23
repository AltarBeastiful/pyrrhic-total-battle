import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../engine/bonuses';
import { newProfile } from './defaults';
import { resolveSources } from './derive';
import { championRoster } from './heroChampionRoster';
import type { BattleSetup, Profile } from './schema';

function account() {
  const profile: Profile = newProfile('Test', 'device-1');
  const setup: BattleSetup | undefined = profile.setups[0];
  if (!setup) throw new Error('newProfile() must create exactly one setup');
  profile.sources.captains = ['aydae', 'skadi', 'amanitore', 'carter'].map((captainId, index) => ({
    id: `c${String(index)}`,
    captainId,
    level: 10,
    star: 1,
  }));
  setup.active.captains = ['c0', 'c1'];
  setup.housing.leadership = 10_000;
  return { profile, setup };
}

describe('championRoster', () => {
  it('lists the heroes with a fighting line, a one-march hero marked, the economy hero left out', () => {
    const { profile, setup } = account();
    const roster = championRoster(profile, setup);
    expect(roster.heroes.map((hero) => [hero.captainId, hero.onlyOn])).toEqual([
      ['aydae', undefined],
      ['skadi', undefined],
      ['amanitore', 'group'],
    ]);
  });

  it('prices a hero alone at a star and level, every other source as it stands', () => {
    const { profile, setup } = account();
    const { hero } = championRoster(profile, setup).variant(0);
    const expected = structuredClone(profile);
    expected.sources.captains[0] = { ...expected.sources.captains[0]!, level: 40, star: 4 };
    const alone = structuredClone(setup);
    alone.active.captains = ['c0'];
    expect(hero('aydae', 4, 40)).toEqual(aggregateBonuses(resolveSources(expected, alone)));
  });

  it('moves the leadership housing by the jitter and nothing else', () => {
    const { profile, setup } = account();
    const roster = championRoster(profile, setup);
    expect(roster.variant(0).input.request.housing.leadership).toBe(10_000);
    expect(roster.variant(0.01).input.request.housing.leadership).toBe(10_100);
    expect(roster.variant(-0.01).input.request.housing.leadership).toBe(9_900);
    expect(roster.variant(0.01).none).toEqual(roster.variant(0).none);
  });

  it('prices a trio as it stands, or with one member raised', () => {
    const { profile, setup } = account();
    const { trio } = championRoster(profile, setup).variant(0);
    const standing = structuredClone(setup);
    standing.active.captains = ['c0', 'c1'];
    expect(trio(['aydae', 'skadi'])).toEqual(aggregateBonuses(resolveSources(profile, standing)));
    expect(trio(['aydae', 'skadi'], { captainId: 'skadi', star: 6, level: 100 })).not.toEqual(
      trio(['aydae', 'skadi']),
    );
  });
});
