import { describe, expect, it } from 'vitest';

import type { TalentRecord } from '../data/types';
import { aggregateBonuses } from '../engine/bonuses';
import { newProfile } from './defaults';
import { resolveSources } from './derive';
import type { BattleSetup } from './schema';
import {
  allTalentsInputs,
  allTalentsKey,
  talentAnalysisInput,
  talentAnalysisKey,
  talentBaseline,
} from './talentAnalysis';

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
    expect(
      talentAnalysisInput(profile, setup, {
        ...melee,
        name: 'Army carrying capacity',
        stats: ['UNIT_LOAD_CAPACITY'],
      }),
    ).toBeNull();
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

/** The account holds `rank` of the melee talent and, when `copied`, its "Hero Talents" source carries the lines. */
function held(rank: number, copied: boolean) {
  const { profile, setup } = account();
  profile.talents.ranks[String(melee.id)] = rank;
  const hero = profile.sources.permanent.find((entry) => entry.builtin === 'heroTalents');
  if (!hero) throw new Error('every account has the Hero Talents source');
  hero.strength = copied ? { melee: rank * 2 } : { melee: rank * 2 + 1 };
  return { profile, setup };
}

describe('talentAnalysisInput baseline (B-25)', () => {
  it('starts at the held rank when the source matches the tree, and prices the ranks above it', () => {
    const { profile, setup } = held(8, true);
    expect(talentBaseline(profile, melee, [melee])).toBe(8);
    const input = talentAnalysisInput(profile, setup, melee, undefined, [melee]);
    expect(input!.baseline).toBe(8);
    expect(input!.ranks.map((r) => r.rank)).toEqual([8, 11, 14, 17, 20]);
  });

  it('reads the baseline as the march as it stands and a rank as only the ranks added to it', () => {
    const { profile, setup } = held(8, true);
    const input = talentAnalysisInput(profile, setup, melee, undefined, [melee])!;
    const base = aggregateBonuses(resolveSources(profile, setup));
    expect(input.ranks[0]!.totals).toEqual(base);
    expect(base.strength.melee).toBeGreaterThanOrEqual(16);
    // rank 14 gives 28 in all; 16 are already in the march, so the march gains 12, never 28.
    expect(input.ranks[2]!.totals.strength.melee).toBe(base.strength.melee + 12);
  });

  it('prices from rank 0 when the source does not match the tree', () => {
    const { profile, setup } = held(8, false);
    expect(talentBaseline(profile, melee, [melee])).toBe(0);
    const input = talentAnalysisInput(profile, setup, melee, undefined, [melee])!;
    expect(input.baseline).toBe(0);
    expect(input.ranks.map((r) => r.rank)).toEqual([0, 5, 10, 15, 20]);
  });

  it('a talent at its maximum leaves only the baseline row', () => {
    const { profile, setup } = held(20, true);
    const input = talentAnalysisInput(profile, setup, melee, undefined, [melee])!;
    expect(input.ranks.map((r) => r.rank)).toEqual([20]);
  });

  it('the question moves when the held rank moves', () => {
    const a = held(8, true);
    const b = held(9, true);
    expect(talentAnalysisKey(a.profile, a.setup, melee, undefined, [melee])).not.toBe(
      talentAnalysisKey(b.profile, b.setup, melee, undefined, [melee]),
    );
  });
});

describe('talentBaseline agrees with talentCopy on float noise (review)', () => {
  it('a source off by 1e-12 is still in sync, so the baseline is the held rank', () => {
    const { profile } = held(8, true);
    const hero = profile.sources.permanent.find((entry) => entry.builtin === 'heroTalents')!;
    hero.strength = { melee: 16 + 1e-12 };
    expect(talentBaseline(profile, melee, [melee])).toBe(8);
    hero.strength = { melee: 16.01 };
    expect(talentBaseline(profile, melee, [melee])).toBe(0);
  });
});

describe('allTalentsInputs (B-28)', () => {
  const other: TalentRecord = { ...melee, id: 25101, name: "Guardsmen's health", stats: ['UNIT_HEALTH'] };
  const dead: TalentRecord = {
    ...melee,
    id: 25102,
    name: 'Army carrying capacity',
    stats: ['UNIT_LOAD_CAPACITY'],
  };

  it('prices every talent the engine can read, each as the single Analyze does, and counts the rest', () => {
    const { profile, setup } = account();
    const table = [melee, dead, other];
    const { jobs, notRated } = allTalentsInputs(profile, setup, undefined, table);
    expect(jobs.map((job) => job.node.id)).toEqual([25100, 25101]);
    expect(notRated).toBe(1);
    expect(jobs[0]!.input).toEqual(talentAnalysisInput(profile, setup, melee, undefined, table));
  });

  it('the grid methods read a talent in sixteen contexts, the others in one; sizes scale the housing and the enemy is swapped', () => {
    const { profile, setup } = account();
    const plain = allTalentsInputs(profile, setup, undefined, [melee], 'current').jobs[0]!;
    expect(plain.inputs).toHaveLength(1);
    expect(plain.inputs[0]!.reading).toBeUndefined();
    const march = allTalentsInputs(profile, setup, undefined, [melee], 'march').jobs[0]!;
    expect(march.inputs).toHaveLength(1);
    expect(march.inputs[0]!.reading).toBe('fixed');
    expect(march.inputs[0]!.request.housing).toEqual(setup.housing);
    const steady = allTalentsInputs(profile, setup, undefined, [melee], 'steady').jobs[0]!;
    expect(steady.inputs).toHaveLength(16);
    expect(steady.inputs.every((one) => one.reading === 'fixed')).toBe(true);
    const sizes = new Set(steady.inputs.map((one) => one.request.housing.leadership));
    expect(sizes).toEqual(
      new Set([0.5, 0.75, 1, 1.5].map((share) => Math.round(setup.housing.leadership * share))),
    );
    expect(new Set(steady.inputs.map((one) => JSON.stringify(one.request.enemy))).size).toBe(4);
    const balanced = allTalentsInputs(profile, setup, undefined, [melee], 'balanced').jobs[0]!;
    expect(balanced.inputs.every((one) => one.reading === 'sized')).toBe(true);
  });

  it('a talent the hero level does not open is left out and counted; a held ancestor opens it', () => {
    const { profile, setup } = account();
    const gated: TalentRecord = { ...other, levelGate: 40 };
    const child: TalentRecord = { ...melee, id: 25200, parents: [gated.id] };
    const table = [melee, gated, child];
    profile.talents.heroLevel = 20;
    const low = allTalentsInputs(profile, setup, undefined, table);
    expect(low.jobs.map((job) => job.node.id)).toEqual([25100]);
    expect(low.levelLocked).toBe(2);
    expect(low.skipped).toBe(0);
    profile.talents.heroLevel = 40;
    const high = allTalentsInputs(profile, setup, undefined, table);
    expect(high.jobs.map((job) => job.node.id)).toEqual([25100, 25101, 25200]);
    expect(high.levelLocked).toBe(0);
    // The child needs its parent's first rank (1 point) before it opens.
    expect(high.jobs.map((job) => job.toReach)).toEqual([0, 0, 1]);
    profile.talents.ranks = { [String(gated.id)]: 1 };
    expect(allTalentsInputs(profile, setup, undefined, table).jobs.map((job) => job.toReach)).toEqual([0, 0, 0]);
  });

  it('the key moves with the hero level and the held ranks', () => {
    const { profile, setup } = account();
    const same = allTalentsKey(profile, setup, undefined, [melee]);
    profile.talents.heroLevel += 5;
    expect(allTalentsKey(profile, setup, undefined, [melee])).not.toBe(same);
  });

  it('the key names the method', () => {
    const { profile, setup } = account();
    const keys = (['current', 'march', 'balanced', 'steady'] as const).map((method) =>
      allTalentsKey(profile, setup, undefined, [melee], method),
    );
    expect(new Set(keys).size).toBe(4);
  });

  it('the ranking key moves with the army and the held ranks, and not otherwise', () => {
    const { profile, setup } = account();
    const same = allTalentsKey(profile, setup, undefined, [melee]);
    expect(allTalentsKey(structuredClone(profile), structuredClone(setup), undefined, [melee])).toBe(same);
    const richer = structuredClone(setup);
    richer.housing.leadership += 100;
    expect(allTalentsKey(profile, richer, undefined, [melee])).not.toBe(same);
    const synced = held(8, true);
    expect(allTalentsKey(synced.profile, synced.setup, undefined, [melee])).not.toBe(
      allTalentsKey(held(8, false).profile, synced.setup, undefined, [melee]),
    );
  });
});
