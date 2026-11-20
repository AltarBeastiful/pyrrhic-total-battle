import { describe, expect, it } from 'vitest';

import type { TalentRecord } from '../data/types';
import { aggregateBonuses } from '../engine/bonuses';
import { newProfile } from './defaults';
import { resolveSources } from './derive';
import type { BattleSetup } from './schema';
import { talentAnalysisInput, talentAnalysisKey } from './talentAnalysis';

const melee: TalentRecord = {
  id: 25100,
  name: "Melee units' strength",
  tree: 'battle',
  maxRank: 20,
  layout: { x: 0, y: 0, link: null, place: null, flipped: false },
  parents: [],
  stats: ['UNIT_POWER'],
  unitIds: [],
  values: Array.from({ length: 20 }, (_, i) => (i + 1) * 2),
  costs: Array.from({ length: 20 }, () => 1),
};

function account() {
  const profile = newProfile('Test', 'device-1');
  const setup: BattleSetup | undefined = profile.setups[0];
  if (!setup) throw new Error('newProfile() must create exactly one setup');
  return { profile, setup };
}

describe('talentAnalysisInput', () => {
  it('prices rank 0 as the march stands and each rank with the talent added to it', () => {
    const { profile, setup } = account();
    const input = talentAnalysisInput(profile, setup, melee);
    expect(input).not.toBeNull();
    expect(input!.ranks.map((r) => r.rank)).toEqual([0, 5, 10, 15, 20]);
    const base = aggregateBonuses(resolveSources(profile, setup));
    expect(input!.ranks[0]!.totals).toEqual(base);
    expect(input!.ranks[2]!.totals.strength.melee).toBe(base.strength.melee + 20);
    expect(input!.ranks[2]!.totals.health.melee).toBe(base.health.melee);
  });

  it('is null for a talent the battle does not read', () => {
    const { profile, setup } = account();
    expect(talentAnalysisInput(profile, setup, { ...melee, name: 'Army carrying capacity', stats: ['UNIT_LOAD_CAPACITY'] })).toBeNull();
  });
});

describe('talentAnalysisKey', () => {
  it('moves when the army or the bonuses move, and not otherwise', () => {
    const { profile, setup } = account();
    const same = talentAnalysisKey(profile, setup, melee);
    expect(talentAnalysisKey(structuredClone(profile), structuredClone(setup), melee)).toBe(same);
    const richer = structuredClone(setup);
    richer.housing.leadership += 100;
    expect(talentAnalysisKey(profile, richer, melee)).not.toBe(same);
    expect(talentAnalysisKey(profile, setup, { ...melee, id: 25101 })).not.toBe(same);
  });
});
