import { describe, expect, it } from 'vitest';

import { captains as captainTable } from '../data';
import { aggregateBonuses } from '../engine/bonuses';
import { trioKey } from '../engine/captains';
import { captainTrios } from './captainTrios';
import { newProfile } from './defaults';
import { resolveSources } from './derive';
import type { BattleSetup, Profile } from './schema';

function fixture(): { profile: Profile; setup: BattleSetup } {
  const profile = newProfile('Test', 'device-1');
  const setup = profile.setups[0];
  if (!setup) throw new Error('newProfile() must create exactly one setup');
  return { profile, setup };
}

const OWNED = ['aydae', 'skadi', 'sofia', 'beowulf', 'alexander'];

function withRoster(captainIds: string[], active: string[]): ReturnType<typeof fixture> {
  const made = fixture();
  made.profile.sources.captains = captainIds.map((captainId, index) => ({
    id: `c${String(index)}`,
    captainId,
    level: 10 + index,
    star: index % 3,
  }));
  made.setup.active.captains = active;
  return made;
}

describe('captainTrios', () => {
  it('lists the current trio first, then every other trio once', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const { currentKey, trios } = captainTrios(profile, setup);
    expect(currentKey).toBe(trioKey(['aydae', 'skadi', 'sofia']));
    expect(trios).toHaveLength(10);
    expect(trios[0]?.current).toBe(true);
    expect(trios.slice(1).some((trio) => trio.current)).toBe(false);
    expect(new Set(trios.map((trio) => trio.key)).size).toBe(10);
  });

  it('the current trio carries the march’s own totals, untouched', () => {
    const { profile, setup } = withRoster(OWNED, ['c2', 'c0', 'c1']);
    const own = aggregateBonuses(resolveSources(profile, setup));
    expect(captainTrios(profile, setup).trios[0]?.totals).toEqual(own);
  });

  it('another trio’s totals are the march’s with only the captains swapped', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const { trios } = captainTrios(profile, setup);
    const other = trios.find((trio) => trio.key === trioKey(['beowulf', 'alexander', 'aydae']));
    expect(other).toBeDefined();
    const swapped = { ...setup, active: { ...setup.active, captains: other!.entryIds } };
    expect(other!.totals).toEqual(aggregateBonuses(resolveSources(profile, swapped)));
    // Beowulf (army) is in this trio and not in the current one.
    expect(other!.totals.strength.army).toBeGreaterThan(trios[0]!.totals.strength.army);
  });

  it('keeps every other source of the march as it is', () => {
    const { profile, setup } = withRoster(OWNED, ['c0']);
    profile.sources.permanent = [{ id: 'p1', name: 'Flat', health: { army: 7 }, strength: {} }];
    const { trios } = captainTrios(profile, setup);
    for (const trio of trios) expect(trio.totals.health.army).toBeGreaterThanOrEqual(7);
  });

  it('an empty or short march is still the current trio, and a bigger trio can follow', () => {
    const { profile, setup } = withRoster(OWNED, []);
    const { currentKey, trios } = captainTrios(profile, setup);
    expect(currentKey).toBe('');
    expect(trios[0]?.entryIds).toEqual([]);
    expect(trios).toHaveLength(11);
  });

  it('a captain entered twice is fielded once in a trio', () => {
    const { profile, setup } = withRoster(['aydae', 'aydae', 'skadi', 'sofia'], ['c0']);
    const { trios } = captainTrios(profile, setup);
    expect(trios.slice(1).every((trio) => new Set(trio.captainIds).size === trio.captainIds.length)).toBe(
      true,
    );
    // aydae (two entries), skadi, sofia: one distinct trio of the three captains.
    expect(trios.map((trio) => trio.key)).toContain(trioKey(['aydae', 'skadi', 'sofia']));
  });

  it('the march type leaves out the captains it does not admit', () => {
    const roster = ['aydae', 'skadi', 'sofia', 'amanitore', 'hercules'];
    const { profile, setup } = withRoster(roster, ['c0', 'c1', 'c2']);
    const solo = captainTrios(profile, { ...setup, marchType: 'solo' });
    expect(
      solo.trios
        .slice(1)
        .every((trio) => !trio.captainIds.some((id) => id === 'amanitore' || id === 'hercules')),
    ).toBe(true);
    const group = captainTrios(profile, { ...setup, marchType: 'group' });
    expect(group.trios.some((trio) => trio.captainIds.includes('amanitore'))).toBe(true);
    expect(group.trios.slice(1).every((trio) => !trio.captainIds.includes('hercules'))).toBe(true);
    const unspecified = captainTrios(profile, setup);
    expect(unspecified.trios.some((trio) => trio.captainIds.includes('hercules'))).toBe(true);
  });

  it('a current trio holding a captain the type excludes stays, listed once, with its own totals', () => {
    const roster = ['aydae', 'skadi', 'amanitore', 'sofia'];
    const { profile, setup } = withRoster(roster, ['c0', 'c1', 'c2']);
    const solo = { ...setup, marchType: 'solo' as const };
    const { trios } = captainTrios(profile, solo);
    expect(trios[0]?.captainIds).toEqual(['aydae', 'skadi', 'amanitore']);
    expect(trios[0]?.totals).toEqual(aggregateBonuses(resolveSources(profile, solo)));
  });

  it('twenty owned captains make the 1 140 trios of the plan, the current one among them', () => {
    const roster = captainTable.slice(0, 20).map((record) => record.id);
    const { profile, setup } = withRoster(roster, ['c0', 'c1', 'c2']);
    const started = performance.now();
    const { trios } = captainTrios(profile, setup);
    expect(trios).toHaveLength(1_140);
    // Built on the main thread, so it has to stay cheap: well under a second on any machine.
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
