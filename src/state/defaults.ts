/**
 * Factory functions for every stored shape (S-03). They are the only place that knows what a *new*
 * profile or setup looks like, and they double as the "defaults" templates the share codec strips
 * against (ADR-0005): `SHARE_PROFILE_TEMPLATE` / `SHARE_SETUP_TEMPLATE` are the same objects built
 * with fixed ids and timestamps so they are deterministic.
 */
import { BUILTIN_PERMANENT_SOURCES, SCHEMA_VERSION } from './schema';
import type { BattleSetup, BuiltinPermanentSource, Profile, RootDocument, SavedStack } from './schema';

/**
 * Game-table version the app currently ships. `src/data` is owned by another story; when it exports its
 * own `version.json` this constant becomes a re-export of it (see the report's open questions).
 */
export const CURRENT_DATA_VERSION = 1;

export function uuid(): string {
  return crypto.randomUUID();
}

const PERMANENT_SOURCE_LABELS: Record<BuiltinPermanentSource, string> = {
  heroTalents: 'Hero Talents',
  hallOfFame: 'Hall of Fame',
  customization: 'Customization',
  armyModernization: 'Army Modernization',
  monstersBoost: 'Monsters Boost',
  clanTechnologies: 'Clan Technologies',
  clanCapitalAppearance: 'Clan Capital Appearance',
  unionOfTriumph: 'Union of Triumph',
};

/** The eight always-present editors of PLAN §3.1. Their entry id is the builtin key, so the same editor
 * keeps its identity across profiles, exports and share links. */
function defaultPermanentSources(): Profile['sources']['permanent'] {
  return BUILTIN_PERMANENT_SOURCES.map((builtin) => ({
    id: builtin,
    name: PERMANENT_SOURCE_LABELS[builtin],
    builtin,
    health: {},
    strength: {},
  }));
}

/** Standard enemy: one squad of each category (PLAN §3.5). */
export function defaultEnemyFormation(): BattleSetup['enemy'] {
  return { melee: 1, ranged: 1, mounted: 1, flying: 1 };
}

export function defaultHousing(): BattleSetup['housing'] {
  return { leadership: 0, authority: 0, dominance: 0 };
}

function buildSetup(id: string, deviceId: string, name: string, now: number): BattleSetup {
  return {
    id,
    updatedAt: now,
    rev: 0,
    deviceId,
    name,
    active: {
      captains: [],
      equipment: [],
      artifacts: [],
      titles: [],
      hero: false,
      events: [],
      otherPills: [],
      vip: true,
      dragon: true,
      unknown: true,
      custom: [],
    },
    housing: defaultHousing(),
    enemy: defaultEnemyFormation(),
    options: {
      method: 'elite',
      // PLAN §3.3: the "mercs above monsters" chain is not what the captured run does, so it is off.
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      // Investigation 0003: opt-in, because it lets monsters die before the troops MP is meant to protect.
      relaxedPreservation: false,
    },
    priority: 'none',
    recoveryPlan: { mode: 'retrain' },
    pinnedUnitIds: [],
    excludedUnitIds: [],
  };
}

/** The implicit setup every profile starts with, so a casual user never has to name one (ADR-0004). */
export function defaultSetup(deviceId: string = uuid(), name = 'Default'): BattleSetup {
  return buildSetup(uuid(), deviceId, name, Date.now());
}

function buildProfile(id: string, deviceId: string, name: string, now: number, setup: BattleSetup): Profile {
  return {
    id,
    updatedAt: now,
    rev: 0,
    deviceId,
    name,
    createdAt: now,
    troops: {
      // First-run account: Guardsmen I–III and Specialists I unlocked, no engineers, no monsters.
      guardsmen: { min: 1, max: 3 },
      specialists: { min: 1, max: 1 },
      engineers: null,
      monsters: null,
      topTierExcluded: { guardsmen: [], specialists: [] },
      excludedUnitIds: [],
    },
    mercenaries: { selected: [], custom: [] },
    sources: {
      permanent: defaultPermanentSources(),
      captains: [],
      equipment: [],
      artifacts: [],
      titles: [],
      vipLevel: 0,
      dragon: { health: {}, strength: {} },
      unknown: { health: {}, strength: {} },
      custom: [],
    },
    recovery: {
      templeLevel: 0,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    },
    setups: [setup],
    activeSetupId: setup.id,
    savedStacks: [],
  };
}

export function newProfile(name: string, deviceId: string = uuid()): Profile {
  return buildProfile(uuid(), deviceId, name, Date.now(), defaultSetup(deviceId));
}

/**
 * A profile name that is not already used. "Alpha" imported next to an existing "Alpha" becomes
 * "Alpha (imported)", then "Alpha (imported 2)", so the profile switcher never shows two identical rows.
 */
export function uniqueProfileName(name: string, taken: Iterable<string>, suffix = 'imported'): string {
  const used = new Set(taken);
  if (!used.has(name)) return name;
  const base = `${name} (${suffix}`;
  for (let index = 1; ; index += 1) {
    const candidate = index === 1 ? `${base})` : `${base} ${index})`;
    if (!used.has(candidate)) return candidate;
  }
}

export function newRoot(deviceName = ''): RootDocument {
  const deviceId = uuid();
  const profile = newProfile('My account', deviceId);
  return {
    schemaVersion: SCHEMA_VERSION,
    dataVersion: CURRENT_DATA_VERSION,
    deviceId,
    deviceName,
    activeProfileId: profile.id,
    profiles: [profile],
    tombstones: [],
    ui: { theme: 'system' },
  };
}

/** Empty result shell; the engine fills `totals` / `counts` / `summary` in M2–M3. */
export function newSavedStack(name: string, setup: BattleSetup, deviceId: string): SavedStack {
  const now = Date.now();
  return {
    id: uuid(),
    updatedAt: now,
    rev: 0,
    deviceId,
    name,
    createdAt: now,
    setup,
    totals: { health: {}, strength: {}, special: {} },
    counts: [],
    summary: {
      minDamage: 0,
      maxDamage: 0,
      avgDamage: 0,
      damagePerSilver: 0,
      damagePerGold: 0,
      damagePerDragonCoin: 0,
      recovery: { silver: 0, gold: 0, dragonCoins: 0, seconds: 0 },
    },
    dataVersion: CURRENT_DATA_VERSION,
  };
}

/**
 * A copy of `profile` where every document (the profile, its setups, its saved stacks) gets a fresh id and
 * `rev` 0. Used by "duplicate profile" and by "import as new": two copies must never share a sync identity.
 */
export function cloneProfileWithNewIds(profile: Profile, deviceId: string, name?: string): Profile {
  const now = Date.now();
  const setupIds = new Map(profile.setups.map((setup) => [setup.id, uuid()]));
  return {
    ...profile,
    id: uuid(),
    rev: 0,
    updatedAt: now,
    createdAt: now,
    deviceId,
    name: name ?? profile.name,
    setups: profile.setups.map((setup) => ({
      ...setup,
      id: setupIds.get(setup.id) ?? uuid(),
      rev: 0,
      updatedAt: now,
      deviceId,
    })),
    activeSetupId: setupIds.get(profile.activeSetupId) ?? profile.activeSetupId,
    savedStacks: profile.savedStacks.map((stack) => ({
      ...stack,
      id: uuid(),
      rev: 0,
      updatedAt: now,
      deviceId,
    })),
  };
}

// ---- Deterministic templates used by the share codec ------------------------------------------------
const TEMPLATE_ID = '00000000-0000-4000-8000-000000000000';
const TEMPLATE_DEVICE = '00000000-0000-4000-8000-000000000001';

/** A setup with every field at its default value, for `stripDefaults` (ADR-0005). */
export const SHARE_SETUP_TEMPLATE: BattleSetup = buildSetup(TEMPLATE_ID, TEMPLATE_DEVICE, 'Default', 0);

/** A profile with every field at its default value and no setups/stacks (those are stripped separately). */
export const SHARE_PROFILE_TEMPLATE: Profile = {
  ...buildProfile(TEMPLATE_ID, TEMPLATE_DEVICE, '', 0, SHARE_SETUP_TEMPLATE),
  setups: [],
  activeSetupId: TEMPLATE_ID,
};
