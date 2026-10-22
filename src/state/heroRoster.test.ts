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

  it('leaves out a hero with no fighting line, which changes no battle', () => {
    const { profile, setup } = withRoster(['aydae', 'carter', 'skadi', 'doria'], [10, 10, 10, 10]);
    const roster = heroRoster(profile, setup);
    expect(roster.heroes.map((hero) => hero.captainId)).toEqual(['aydae', 'skadi']);
    expect(roster.trios.map((trio) => trio.captainIds)).toEqual([['aydae', 'skadi']]);
  });

  it('rates a hero limited to one kind of march alone, never in a trio', () => {
    const { profile, setup } = withRoster(['aydae', 'skadi', 'amanitore', 'beowulf'], [10, 10, 10, 10]);
    const roster = heroRoster(profile, setup);
    expect(roster.solos.map((solo) => solo.key)).toContain('amanitore');
    expect(roster.trios.map((trio) => trio.captainIds)).toEqual([['aydae', 'skadi', 'beowulf']]);
  });

  it('builds each upgrade against its own lineup: every hero alone, and the trio members in the trio', () => {
    const { profile, setup } = withRoster(['aydae', 'skadi', 'beowulf', 'brann'], [10, 10, 10, 10]);
    const { upgrades, solos } = heroRoster(profile, setup);
    const probes = upgrades?.(['aydae', 'skadi', 'beowulf']) ?? [];
    expect(probes.filter((probe) => probe.role === 'solo').map((probe) => probe.captainId)).toContain(
      'brann',
    );
    const inTrio = probes.filter((probe) => probe.role === 'trio');
    expect(inTrio.length).toBeGreaterThan(0);
    expect(inTrio.every((probe) => ['aydae', 'skadi', 'beowulf'].includes(probe.captainId))).toBe(true);
    const star = probes.find(
      (probe) => probe.role === 'solo' && probe.captainId === 'aydae' && probe.kind === 'star',
    );
    expect(star?.base.key).toBe(solos[0]?.key);
    expect(star?.upgraded.totals).not.toEqual(star?.base.totals);
    expect(star?.upgraded.key).not.toBe(star?.base.key);
    expect(upgrades?.(null).some((probe) => probe.role === 'trio')).toBe(false);
  });

  it('names what a hero pairs with: the troop types of its lines, and the fielded mercenaries that match', () => {
    const { profile, setup } = withRoster(['leonidas', 'sofia'], [10, 10]);
    const roster = heroRoster(profile, setup);
    const leonidas = roster.heroes.find((hero) => hero.captainId === 'leonidas');
    expect(leonidas?.pairs?.types).toEqual(['melee']);
    // Sofia has army-wide lines only: any merc.
    expect(roster.heroes.find((hero) => hero.captainId === 'sofia')?.pairs?.types).toEqual([]);
    expect(leonidas?.pairs?.mercs.length ?? 0).toBeLessThanOrEqual(3);
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
