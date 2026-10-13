import { describe, expect, it } from 'vitest';

import { captains as captainTable } from '../data';
import { aggregateBonuses } from '../engine/bonuses';
import { lineupKey } from '../engine/captains';
import { captainLineups } from './captainLineups';
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

describe('captainLineups', () => {
  it('lists the current lineup first, then every other lineup once', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const { currentKey, lineups, size } = captainLineups(profile, setup);
    expect(currentKey).toBe(lineupKey(['aydae', 'skadi', 'sofia']));
    expect(size).toBe(3);
    expect(lineups).toHaveLength(10);
    expect(lineups[0]?.current).toBe(true);
    expect(lineups.slice(1).some((lineup) => lineup.current)).toBe(false);
    expect(new Set(lineups.map((lineup) => lineup.key)).size).toBe(10);
  });

  it('weighs single captains when one is switched on, pairs when two', () => {
    // One captain on the march: every other single captain is a swap of the same size, never a trio to add.
    const one = withRoster(OWNED, ['c0']);
    const solo = captainLineups(one.profile, one.setup);
    expect(solo.size).toBe(1);
    expect(solo.lineups).toHaveLength(OWNED.length);
    expect(solo.lineups.every((lineup) => lineup.captainIds.length === 1)).toBe(true);
    expect(solo.lineups[0]?.key).toBe('aydae');

    // Two on the march: every other pair.
    const two = withRoster(OWNED, ['c0', 'c1']);
    const pairs = captainLineups(two.profile, two.setup);
    expect(pairs.size).toBe(2);
    expect(pairs.lineups).toHaveLength(10);
    expect(pairs.lineups.every((lineup) => lineup.captainIds.length === 2)).toBe(true);
  });

  it('the current lineup carries the march’s own totals, untouched', () => {
    const { profile, setup } = withRoster(OWNED, ['c2', 'c0', 'c1']);
    const own = aggregateBonuses(resolveSources(profile, setup));
    expect(captainLineups(profile, setup).lineups[0]?.totals).toEqual(own);
  });

  it('another lineup’s totals are the march’s with only the captains swapped', () => {
    const { profile, setup } = withRoster(OWNED, ['c0', 'c1', 'c2']);
    const { lineups } = captainLineups(profile, setup);
    const other = lineups.find((lineup) => lineup.key === lineupKey(['beowulf', 'alexander', 'aydae']));
    expect(other).toBeDefined();
    const swapped = { ...setup, active: { ...setup.active, captains: other!.entryIds } };
    expect(other!.totals).toEqual(aggregateBonuses(resolveSources(profile, swapped)));
    // Beowulf (army) is in this lineup and not in the current one.
    expect(other!.totals.strength.army).toBeGreaterThan(lineups[0]!.totals.strength.army);
  });

  it('keeps every other source of the march as it is', () => {
    const { profile, setup } = withRoster(OWNED, ['c0']);
    profile.sources.permanent = [{ id: 'p1', name: 'Flat', health: { army: 7 }, strength: {} }];
    const { lineups } = captainLineups(profile, setup);
    for (const lineup of lineups) expect(lineup.totals.health.army).toBeGreaterThanOrEqual(7);
  });

  it('with no captain switched on the empty set is the current lineup, and trios follow', () => {
    const { profile, setup } = withRoster(OWNED, []);
    const { currentKey, lineups, size } = captainLineups(profile, setup);
    // Nothing to swap, so the size falls back to LINEUP_SIZE: the card still offers which captains to add.
    expect(size).toBe(3);
    expect(currentKey).toBe('');
    expect(lineups[0]?.entryIds).toEqual([]);
    expect(lineups).toHaveLength(11);
  });

  it('a captain entered twice is fielded once in a lineup', () => {
    const { profile, setup } = withRoster(['aydae', 'aydae', 'skadi', 'sofia'], ['c0']);
    const { lineups, size } = captainLineups(profile, setup);
    // One captain is switched on, so every lineup is a single captain — and the duplicated aydae is one of
    // them, once: three distinct captains in all.
    expect(size).toBe(1);
    expect(lineups.every((lineup) => new Set(lineup.captainIds).size === lineup.captainIds.length)).toBe(
      true,
    );
    expect(lineups.map((lineup) => lineup.key)).toEqual(['aydae', 'skadi', 'sofia']);
  });

  it('the march type leaves out the captains it does not admit', () => {
    const roster = ['aydae', 'skadi', 'sofia', 'amanitore', 'hercules'];
    const { profile, setup } = withRoster(roster, ['c0', 'c1', 'c2']);
    const solo = captainLineups(profile, { ...setup, marchType: 'solo' });
    expect(
      solo.lineups
        .slice(1)
        .every((lineup) => !lineup.captainIds.some((id) => id === 'amanitore' || id === 'hercules')),
    ).toBe(true);
    const group = captainLineups(profile, { ...setup, marchType: 'group' });
    expect(group.lineups.some((lineup) => lineup.captainIds.includes('amanitore'))).toBe(true);
    expect(group.lineups.slice(1).every((lineup) => !lineup.captainIds.includes('hercules'))).toBe(true);
    const unspecified = captainLineups(profile, setup);
    expect(unspecified.lineups.some((lineup) => lineup.captainIds.includes('hercules'))).toBe(true);
  });

  it('a current lineup holding a captain the type excludes stays, listed once, with its own totals', () => {
    const roster = ['aydae', 'skadi', 'amanitore', 'sofia'];
    const { profile, setup } = withRoster(roster, ['c0', 'c1', 'c2']);
    const solo = { ...setup, marchType: 'solo' as const };
    const { lineups } = captainLineups(profile, solo);
    expect(lineups[0]?.captainIds).toEqual(['aydae', 'skadi', 'amanitore']);
    expect(lineups[0]?.totals).toEqual(aggregateBonuses(resolveSources(profile, solo)));
  });

  it('twenty owned captains make the 1 140 lineups of the plan, the current one among them', () => {
    const roster = captainTable.slice(0, 20).map((record) => record.id);
    const { profile, setup } = withRoster(roster, ['c0', 'c1', 'c2']);
    const started = performance.now();
    const { lineups } = captainLineups(profile, setup);
    expect(lineups).toHaveLength(1_140);
    // Built on the main thread, so it has to stay cheap: well under a second on any machine.
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
