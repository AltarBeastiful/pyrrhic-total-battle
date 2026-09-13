import { describe, expect, it } from 'vitest';

import { BONUS_KEYS, QUALITIES } from '../data/types';
import type { BonusMap } from '../data/types';
import { CURRENT_DATA_VERSION, defaultSetup, newProfile, uuid } from '../state/defaults';
import { SCHEMA_VERSION } from '../state/schema';
import type { BattleSetup, Profile, SavedSummary, StackCount } from '../state/schema';
import {
  buildBattleLink,
  buildProfileLink,
  decodeShare,
  encodeShare,
  parseLocationHash,
  restoreDefaults,
  stripDefaults,
} from './codec';

const DEVICE = 'device-a';

function bonusMap(seed: number): BonusMap {
  return Object.fromEntries(
    BONUS_KEYS.map((key, index) => [key, Math.round((seed + index * 1.7) * 10) / 10]),
  ) as BonusMap;
}

/**
 * The fixture of ADR-0005's size budget: three captains, 15 equipment pieces, three artifacts, every
 * permanent editor filled with non-zero values on all 13 keys, ten mercenaries and two battle setups.
 */
function realisticProfile(): Profile {
  const profile = newProfile('Rémi — main account', DEVICE);
  profile.troops = {
    guardsmen: { min: 1, max: 6 },
    specialists: { min: 1, max: 6 },
    engineers: { min: 1, max: 2 },
    monsters: { min: 3, max: 5 },
    topTierExcluded: { guardsmen: ['mounted', 'flying'], specialists: ['flying'] },
    // Technology only: an M5 monster the account has not unlocked. What a march leaves out travels
    // on the setup instead (`excludedUnitIds` below).
    excludedUnitIds: ['ettin'],
  };
  profile.mercenaries = {
    selected: Array.from({ length: 10 }, (_, index) => ({
      id: `mercenary-${index + 1}`,
      cap: index % 3 === 0 ? null : 12 + index,
    })),
    custom: [],
  };
  profile.sources.permanent = profile.sources.permanent.map((source, index) => ({
    ...source,
    health: bonusMap(3 + index),
    strength: bonusMap(7 + index),
  }));
  profile.sources.captains = ['aydae', 'sofia', 'skadi'].map((captainId, index) => ({
    id: uuid(),
    captainId,
    level: 40 + index * 5,
    star: (index % 6) + 1,
  }));
  profile.sources.equipment = Array.from({ length: 15 }, (_, index) => ({
    id: uuid(),
    equipmentId: `equipment-${index + 1}`,
    quality: QUALITIES[index % QUALITIES.length]!,
    extra: { health: { army: 1.5 + index }, strength: { army: 2.5 + index } },
  }));
  profile.sources.artifacts = Array.from({ length: 3 }, (_, index) => ({
    id: uuid(),
    artifactId: `artifact-${index + 1}`,
    level: 30 + index,
    star: `${index + 1}.0`,
    random: { option: 'armyHealth', value: 4.5 + index },
  }));
  profile.sources.titles = ['baron', 'count', 'duke'];
  profile.sources.vipLevel = 12;
  profile.sources.dragon = { health: bonusMap(2), strength: bonusMap(4) };
  profile.sources.unknown = { health: { army: 11.5 }, strength: { army: 9.25 } };
  profile.recovery = {
    templeLevel: 20,
    trainingCostReduction: { guardsmen: 12.5, specialist: 12.5, engineers: 8 },
    trainingSpeed: { guardsmen: 30, specialist: 30 },
    plan: { mode: 'selective', selectiveTop: 3 },
  };

  const first = profile.setups[0]!;
  const second = defaultSetup(DEVICE, 'Arachne 8-stack');
  profile.setups = [
    {
      ...first,
      name: 'Epic bear',
      active: {
        ...first.active,
        captains: profile.sources.captains.map((entry) => entry.id),
        equipment: profile.sources.equipment.map((entry) => entry.id),
        artifacts: profile.sources.artifacts.map((entry) => entry.id),
        titles: ['baron', 'duke'],
        events: ['ragnarok-fenrir'],
        otherPills: ['personal', 'clan', 'kingdom'],
        hero: true,
      },
      housing: { leadership: 4100, authority: 312, dominance: 148 },
      priority: 'avgDamage',
      excludedUnitIds: ['rider-2'],
    },
    {
      ...second,
      active: { ...second.active, events: ['arachnes'], otherPills: ['clan'] },
      enemy: { melee: 2, ranged: 2, mounted: 2, flying: 2 },
      housing: { leadership: 3800, authority: 200, dominance: 100 },
      options: { ...second.options, method: 'ms', roundTo10: true },
    },
  ];
  profile.activeSetupId = profile.setups[0]!.id;
  return profile;
}

function battleFixture(): { setup: BattleSetup; counts: StackCount[]; summary: SavedSummary } {
  const profile = realisticProfile();
  const setup = profile.setups[0]!;
  const counts: StackCount[] = [
    { unitId: 'archer-1', count: 930 },
    { unitId: 'spearman-1', count: 929 },
    { unitId: 'rider-1', count: 464 },
    { unitId: 'archer-2', count: 514 },
    { unitId: 'spearman-2', count: 513 },
    { unitId: 'rider-3', count: 143 },
    { unitId: 'archer-3', count: 312 },
    { unitId: 'spearman-3', count: 287 },
    { unitId: 'engineer-1', count: 96 },
    { unitId: 'engineer-2', count: 84 },
    { unitId: 'mercenary-1', count: 22 },
    { unitId: 'mercenary-2', count: 24 },
    { unitId: 'mercenary-3', count: 23 },
    { unitId: 'mercenary-4', count: 12 },
    { unitId: 'stone-gargoyle', count: 40 },
    { unitId: 'cyclops-5', count: 18 },
  ];
  const summary: SavedSummary = {
    minDamage: 12_345_678,
    maxDamage: 15_987_654,
    avgDamage: 14_166_666,
    damagePerSilver: 3.42,
    damagePerGold: 118.7,
    damagePerDragonCoin: 2104.9,
    recovery: { silver: 4_500_000, gold: 120_000, dragonCoins: 640, seconds: 86_400 },
  };
  return { setup, counts, summary };
}

describe('stripDefaults / restoreDefaults', () => {
  it('removes values equal to the default and restores them', () => {
    const defaults = { a: 1, b: { c: 2, d: [1, 2] }, e: 'x' };
    const value = { a: 1, b: { c: 5, d: [1, 2] }, e: 'y' };
    expect(stripDefaults(value, defaults)).toEqual({ b: { c: 5 }, e: 'y' });
    expect(restoreDefaults(stripDefaults(value, defaults), defaults)).toEqual(value);
  });

  it('returns undefined when everything is the default', () => {
    const defaults = { a: 1, b: { c: 2 } };
    expect(stripDefaults({ a: 1, b: { c: 2 } }, defaults)).toBeUndefined();
    expect(restoreDefaults(undefined, defaults)).toEqual(defaults);
  });

  it('treats arrays as atomic', () => {
    expect(stripDefaults({ list: [1, 2, 3] }, { list: [1, 2] })).toEqual({ list: [1, 2, 3] });
  });

  it('does not alias the defaults object it restores from', () => {
    const defaults = { nested: { value: 1 } };
    const restored = restoreDefaults({}, defaults);
    restored.nested.value = 99;
    expect(defaults.nested.value).toBe(1);
  });
});

describe('parseLocationHash', () => {
  it('reads the share code from a fragment or a full URL', () => {
    expect(parseLocationHash('#c=ABC')).toBe('ABC');
    expect(parseLocationHash('c=ABC')).toBe('ABC');
    expect(parseLocationHash('https://example.com/app/#c=ABC')).toBe('ABC');
    expect(parseLocationHash('#')).toBeNull();
    expect(parseLocationHash('')).toBeNull();
    expect(parseLocationHash('#other=1')).toBeNull();
    expect(parseLocationHash('#ABC')).toBeNull();
  });
});

describe('profile links', () => {
  it('round-trips a realistic profile', async () => {
    const profile = realisticProfile();
    const decoded = await decodeShare(await buildProfileLink(profile));
    expect(decoded.kind).toBe('profile');
    if (decoded.kind !== 'profile') throw new Error('wrong kind');
    // Saved stacks are deliberately not part of a profile link (PLAN §2.1).
    expect(decoded.profile).toEqual({ ...profile, savedStacks: [] });
    expect(decoded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(decoded.dataVersion).toBe(CURRENT_DATA_VERSION);
  });

  it('round-trips a brand-new profile (everything at its default)', async () => {
    const profile = newProfile('My account', DEVICE);
    const decoded = await decodeShare(
      await encodeShare({
        kind: 'profile',
        schemaVersion: SCHEMA_VERSION,
        dataVersion: CURRENT_DATA_VERSION,
        profile,
      }),
    );
    if (decoded.kind !== 'profile') throw new Error('wrong kind');
    expect(decoded.profile).toEqual(profile);
  });

  it('accepts a full URL and prefixes a base URL', async () => {
    const profile = newProfile('Link', DEVICE);
    const link = await buildProfileLink(profile, { baseUrl: 'https://example.com/pyrrhic/#stale' });
    expect(link.startsWith('https://example.com/pyrrhic/#c=')).toBe(true);
    const decoded = await decodeShare(link);
    expect(decoded.kind).toBe('profile');
  });

  it('moves a v1 link’s march exclusions onto its setups', async () => {
    // A link written by the build before the split: the profile carried every exclusion, march
    // decisions included. Decoding runs `profileMigrations[1]`, so the setups inherit them.
    const profile = realisticProfile();
    profile.troops.excludedUnitIds = ['ettin', 'rider-2'];
    profile.setups = profile.setups.map((setup) => ({ ...setup, excludedUnitIds: [] }));

    const decoded = await decodeShare(
      await encodeShare({
        kind: 'profile',
        schemaVersion: 1,
        dataVersion: CURRENT_DATA_VERSION,
        profile,
      }),
    );
    if (decoded.kind !== 'profile') throw new Error('wrong kind');
    // `ettin` is an M5 monster and the account's top monster tier is M5: technology, it stays put.
    expect(decoded.profile.troops.excludedUnitIds).toEqual(['ettin']);
    for (const setup of decoded.profile.setups) expect(setup.excludedUnitIds).toEqual(['rider-2']);
  });

  it('stays inside the 8,000-character budget', async () => {
    const link = await buildProfileLink(realisticProfile());
    console.warn(`[pyrrhic] share size — profile link: ${link.length} chars (budget 8,000)`);
    expect(link.length).toBeLessThanOrEqual(8_000);
  });
});

describe('battle links', () => {
  it('round-trips a setup, its counts and its summary', async () => {
    const { setup, counts, summary } = battleFixture();
    const decoded = await decodeShare(await buildBattleLink(setup, counts, summary));
    if (decoded.kind !== 'battle') throw new Error('wrong kind');
    expect(decoded.setup).toEqual(setup);
    expect(decoded.counts).toEqual(counts);
    expect(decoded.summary).toEqual(summary);
  });

  it('carries what the march leaves out', async () => {
    const { setup, counts } = battleFixture();
    const decoded = await decodeShare(await buildBattleLink(setup, counts));
    if (decoded.kind !== 'battle') throw new Error('wrong kind');
    expect(decoded.setup.excludedUnitIds).toEqual(['rider-2']);
  });

  it('works without a summary', async () => {
    const { setup, counts } = battleFixture();
    const decoded = await decodeShare(await buildBattleLink(setup, counts));
    if (decoded.kind !== 'battle') throw new Error('wrong kind');
    expect(decoded.summary).toBeNull();
    expect(decoded.counts).toHaveLength(counts.length);
  });

  it('stays inside the 1,500-character budget', async () => {
    const { setup, counts, summary } = battleFixture();
    const link = await buildBattleLink(setup, counts, summary);
    console.warn(`[pyrrhic] share size — battle link: ${link.length} chars (budget 1,500)`);
    expect(link.length).toBeLessThanOrEqual(1_500);
  });
});

describe('malformed links', () => {
  it('rejects an empty payload', async () => {
    await expect(decodeShare('')).rejects.toThrow(/empty/);
  });

  it('rejects an unknown codec version', async () => {
    const { setup, counts } = battleFixture();
    const code = (await buildBattleLink(setup, counts)).slice('#c='.length);
    const bytes = atob(
      code
        .replaceAll('-', '+')
        .replaceAll('_', '/')
        .padEnd(Math.ceil(code.length / 4) * 4, '='),
    );
    const tampered = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) tampered[i] = bytes.charCodeAt(i);
    tampered[0] = 0x02;
    const rebuilt = btoa(String.fromCharCode(...tampered))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    await expect(decodeShare(rebuilt)).rejects.toThrow(/codec version 2/);
  });

  it('rejects a payload that is not deflate-raw', async () => {
    await expect(decodeShare('AQIDBAUGBwgJ')).rejects.toThrow();
  });

  it('refuses a schemaVersion from a newer app', async () => {
    const profile = newProfile('Future', DEVICE);
    const code = await encodeShare({
      kind: 'profile',
      schemaVersion: SCHEMA_VERSION + 1,
      dataVersion: CURRENT_DATA_VERSION,
      profile,
    });
    await expect(decodeShare(code)).rejects.toThrow(/newer than this build/);
  });
});
