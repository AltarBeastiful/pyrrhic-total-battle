/**
 * Config schema v1 — S-03, ADR-0004 (including its 2026-09-12 sync amendment).
 *
 * One root document lives under a single storage key (`pyrrhic.v1`). It holds the three-level model of
 * PLAN §2.1: Profile (one game account) → BattleSetup (one march) → SavedStack (one frozen result).
 * Every one of those three carries `id` / `updatedAt` / `rev` / `deviceId` so a future sync adapter
 * (investigation 0001) can merge documents by id without a CRDT.
 *
 * The zod schemas below are the single source of truth for the *stored* shapes; the exported TypeScript
 * types are inferred from them, never written twice. Shapes that already exist in the data or engine
 * contracts (`BonusMap`, `Housing`, `RecoverySettings`, `StackingOptions`, `Objective`…) are mirrored
 * here and checked against those contracts with `satisfies` / assignment tests, because `src/data` and
 * `src/engine` are owned by other stories and must not be modified.
 *
 * Unknown object keys are stripped (zod's default), which is what ADR-0004 asks for: never crash on an
 * older or newer document, drop what we do not understand and warn (see `migrations.ts`).
 */
import { z } from 'zod';

import { BONUS_KEYS, CATEGORIES, GROUPS, QUALITIES, RACES, SPECIAL_KEYS } from '../data/types';
import type { BonusMap, Category, SpecialMap } from '../data/types';
import type { Method, Objective, RecoveryMode } from '../engine/types';

/** Bumped whenever a stored shape changes; every bump needs a `migrations[n]` entry and a fixture test. */
export const SCHEMA_VERSION = 2;

// ---- Small building blocks -----------------------------------------------------------------------
export const bonusKeySchema = z.enum(BONUS_KEYS);
export const specialKeySchema = z.enum(SPECIAL_KEYS);
export const categorySchema = z.enum(CATEGORIES);
export const groupSchema = z.enum(GROUPS);
export const raceSchema = z.enum(RACES);
export const qualitySchema = z.enum(QUALITIES);

/** Percentages "as entered" (39.5 means +39.5 %), exactly like the data contract. */
export const bonusMapSchema = z.partialRecord(bonusKeySchema, z.number());
export const specialMapSchema = z.partialRecord(specialKeySchema, z.number());

const timestamp = z.int().min(0);
const revision = z.int().min(0);
const nonEmpty = z.string().min(1);

/** Sync metadata carried by every profile, battle setup and saved stack (ADR-0004 amendment). */
export const syncMetaSchema = z.object({
  id: z.uuid(),
  updatedAt: timestamp,
  rev: revision,
  deviceId: nonEmpty,
});
export type SyncMeta = z.infer<typeof syncMetaSchema>;

export const tombstoneSchema = z.object({ id: z.uuid(), deletedAt: timestamp });
export type Tombstone = z.infer<typeof tombstoneSchema>;

// ---- Troops ---------------------------------------------------------------------------------------
export const tierRangeSchema = z.object({ min: z.int().min(1), max: z.int().min(1) });
export type TierRange = z.infer<typeof tierRangeSchema>;

/**
 * Unlocked tiers per row of the Troops section (PLAN §4.2). `null` = the row is not used at all.
 *
 * The whole block describes **technology**: what the account has unlocked, which changes rarely.
 * `topTierExcluded` drops categories of the *highest* tier that the account has not upgraded yet
 * (guardsmen and specialists have one type per category per tier); `excludedUnitIds` does the same
 * job for monsters, whose tier holds four unrelated types that no category tells apart.
 *
 * What a *march* leaves out is not here: it is `BattleSetup.excludedUnitIds` (schema v2), because
 * the same account fields different armies from one march to the next.
 */
export const troopsSchema = z.object({
  guardsmen: tierRangeSchema.nullable(),
  specialists: tierRangeSchema.nullable(),
  engineers: tierRangeSchema.nullable(),
  monsters: tierRangeSchema.nullable(),
  topTierExcluded: z.object({
    guardsmen: z.array(categorySchema),
    specialists: z.array(categorySchema),
  }),
  excludedUnitIds: z.array(z.string()),
});
export type ProfileTroops = z.infer<typeof troopsSchema>;

// ---- Mercenaries ----------------------------------------------------------------------------------
/** `cap = null` means "no owned limit entered"; the engine then treats the mercenary as unlimited. */
export const selectedMercenarySchema = z.object({ id: nonEmpty, cap: z.int().min(0).nullable() });

/** A mercenary typed in by hand (not in `mercenaries.json`), stored per profile. */
export const customMercenarySchema = z.object({
  id: nonEmpty,
  name: z.string(),
  health: z.number().min(0),
  strength: z.number().min(0),
  cost: z.number().min(0),
  revivalGold: z.number().min(0),
  doubleDamageChance: z.number().min(0),
  role: groupSchema,
  category: categorySchema.optional(),
  race: raceSchema.optional(),
  event: z.string().optional(),
});
export type CustomMercenary = z.infer<typeof customMercenarySchema>;

export const mercenariesSchema = z.object({
  selected: z.array(selectedMercenarySchema),
  custom: z.array(customMercenarySchema),
});

// ---- Bonus sources --------------------------------------------------------------------------------
export const BUILTIN_PERMANENT_SOURCES = [
  'heroTalents',
  'hallOfFame',
  'customization',
  'armyModernization',
  'monstersBoost',
  'clanTechnologies',
  'clanCapitalAppearance',
  'unionOfTriumph',
] as const;
export type BuiltinPermanentSource = (typeof BUILTIN_PERMANENT_SOURCES)[number];

/** Free-form 13-key editors (PLAN §3.1). The eight builtin ones always exist; extra rows are custom. */
export const permanentSourceSchema = z.object({
  id: nonEmpty,
  name: z.string(),
  builtin: z.enum(BUILTIN_PERMANENT_SOURCES).optional(),
  health: bonusMapSchema,
  strength: bonusMapSchema,
  special: specialMapSchema.optional(),
});

export const captainEntrySchema = z.object({
  id: nonEmpty,
  captainId: nonEmpty,
  level: z.int().min(0),
  star: z.int().min(0).max(6),
});

/** `extra` carries the gem / enchant values typed on top of the quality table. */
export const equipmentEntrySchema = z.object({
  id: nonEmpty,
  equipmentId: nonEmpty,
  quality: qualitySchema,
  name: z.string().optional(),
  extra: z
    .object({
      health: bonusMapSchema.optional(),
      strength: bonusMapSchema.optional(),
      special: specialMapSchema.optional(),
    })
    .optional(),
});

/** `star` is the in-game star notation ("0.1".."5.0"), kept as a string like the data tables. */
export const artifactEntrySchema = z.object({
  id: nonEmpty,
  artifactId: nonEmpty,
  level: z.int().min(0),
  star: z.string(),
  manual: z
    .object({
      health: bonusMapSchema.optional(),
      strength: bonusMapSchema.optional(),
      special: specialMapSchema.optional(),
    })
    .optional(),
  random: z.object({ option: z.string(), value: z.number() }).optional(),
});

export const customSourceSchema = z.object({
  id: nonEmpty,
  name: z.string(),
  health: bonusMapSchema,
  strength: bonusMapSchema,
  special: specialMapSchema.optional(),
});

export const sourcesSchema = z.object({
  permanent: z.array(permanentSourceSchema),
  captains: z.array(captainEntrySchema),
  equipment: z.array(equipmentEntrySchema),
  artifacts: z.array(artifactEntrySchema),
  /** Title ids owned by the account (the editor itself is deferred, D-02). */
  titles: z.array(z.string()),
  hero: z.string().optional(),
  vipLevel: z.int().min(0),
  /** Typed by hand when the VIP table does not cover the account's level. */
  vipManual: z.object({ health: z.number(), strength: z.number() }).optional(),
  dragon: z.object({
    health: bonusMapSchema,
    strength: bonusMapSchema,
    special: specialMapSchema.optional(),
  }),
  unknown: z.object({ health: bonusMapSchema, strength: bonusMapSchema }),
  custom: z.array(customSourceSchema),
});
export type ProfileSources = z.infer<typeof sourcesSchema>;

// ---- Recovery / housing / enemy / method ----------------------------------------------------------
export const RECOVERY_MODES = ['retrain', 'revive', 'selective'] as const satisfies readonly RecoveryMode[];
export const METHODS = ['elite', 'ms', 'custom'] as const satisfies readonly Method[];
export const OBJECTIVES = [
  'avgDamage',
  'minDamage',
  'damagePerSilver',
  'damagePerGold',
  'damagePerDragonCoin',
] as const satisfies readonly Objective[];

export const recoveryPlanSchema = z.object({
  mode: z.enum(RECOVERY_MODES),
  selectiveTop: z.int().min(0).optional(),
});
export type RecoveryPlan = z.infer<typeof recoveryPlanSchema>;

export const recoverySettingsSchema = z.object({
  templeLevel: z.int().min(0).max(45),
  trainingCostReduction: z.partialRecord(groupSchema, z.number()),
  trainingSpeed: z.partialRecord(groupSchema, z.number()),
  plan: recoveryPlanSchema,
});

export const housingSchema = z.object({
  leadership: z.number().min(0),
  authority: z.number().min(0),
  dominance: z.number().min(0),
});

/** Number of enemy squads per category: 4 standard, 8 for Arachne's, or custom (PLAN §3.5). */
export const enemyFormationSchema = z.record(categorySchema, z.number().min(0));

export const stackingOptionsSchema = z.object({
  method: z.enum(METHODS),
  strictMercsAboveMonsters: z.boolean(),
  monstersLast: z.boolean(),
  roundTo10: z.boolean(),
  // Added after v1 shipped: defaulted so stored setups keep parsing without a schema bump (ADR-0004).
  relaxedPreservation: z.boolean().default(false),
  customOrder: z.array(z.string()).optional(),
});

// ---- Battle setup ---------------------------------------------------------------------------------
/**
 * Which sources are switched on for this march. Captains / equipment / artifacts / custom hold the
 * *entry* ids of `profile.sources`, not table ids, so two copies of the same captain stay distinct.
 */
export const activeSourcesSchema = z.object({
  captains: z.array(z.string()).max(3),
  equipment: z.array(z.string()),
  artifacts: z.array(z.string()).max(3),
  titles: z.array(z.string()),
  hero: z.boolean(),
  events: z.array(z.string()),
  /** Personal / Clan / Kingdom "+25" pills and anything else toggled in the Other section. */
  otherPills: z.array(z.string()),
  vip: z.boolean(),
  dragon: z.boolean(),
  unknown: z.boolean(),
  custom: z.array(z.string()),
});
export type ActiveSources = z.infer<typeof activeSourcesSchema>;

export const battleSetupSchema = syncMetaSchema.extend({
  name: z.string(),
  active: activeSourcesSchema,
  housing: housingSchema,
  enemy: enemyFormationSchema,
  options: stackingOptionsSchema,
  /** `'none'` = plain Generate, no priority search (PLAN §3.6). */
  priority: z.union([z.enum(OBJECTIVES), z.literal('none')]),
  recoveryPlan: recoveryPlanSchema,
  /**
   * Unit types forced into the march: the sizer keeps them even when the flat profile or a preservation
   * ceiling would leave them out, and the priority search never eliminates them.
   * Added after v1 shipped: defaulted so stored setups keep parsing without a schema bump (ADR-0004).
   */
  pinnedUnitIds: z.array(z.string()).default([]),
  /**
   * Unit types the player took out of *this* march by hand (a press on its pill). The account still
   * owns them — `profile.troops` says so — they are simply not marching here, so switching setup
   * changes the army without touching the technology. Added in schema v2; `migrations[1]` moves the
   * march decisions that used to live in `profile.troops.excludedUnitIds` here.
   */
  excludedUnitIds: z.array(z.string()).default([]),
});
export type BattleSetup = z.infer<typeof battleSetupSchema>;

// ---- Saved stack ----------------------------------------------------------------------------------
export const stackCountSchema = z.object({ unitId: nonEmpty, count: z.int().min(0) });
export type StackCount = z.infer<typeof stackCountSchema>;

/** Only the aggregated maps are frozen, not the per-source breakdown: it is rebuilt from `setup`. */
export const savedTotalsSchema = z.object({
  health: bonusMapSchema,
  strength: bonusMapSchema,
  special: specialMapSchema,
});

export const recoveryCostSchema = z.object({
  silver: z.number(),
  gold: z.number(),
  dragonCoins: z.number(),
  seconds: z.number(),
});

export const savedSummarySchema = z.object({
  minDamage: z.number(),
  maxDamage: z.number(),
  avgDamage: z.number(),
  damagePerSilver: z.number(),
  damagePerGold: z.number(),
  damagePerDragonCoin: z.number(),
  recovery: recoveryCostSchema,
});
export type SavedSummary = z.infer<typeof savedSummarySchema>;

export const savedStackSchema = syncMetaSchema.extend({
  name: z.string(),
  createdAt: timestamp,
  /** Full snapshot of the setup the result came from, so it stays reproducible after the setup changes. */
  setup: battleSetupSchema,
  totals: savedTotalsSchema,
  counts: z.array(stackCountSchema),
  summary: savedSummarySchema,
  /** Which game tables the numbers were produced against (unit ids can be renamed by a data migration). */
  dataVersion: z.int().min(0),
});
export type SavedStack = z.infer<typeof savedStackSchema>;

// ---- Profile --------------------------------------------------------------------------------------
export const profileSchema = syncMetaSchema.extend({
  name: z.string(),
  createdAt: timestamp,
  troops: troopsSchema,
  mercenaries: mercenariesSchema,
  sources: sourcesSchema,
  recovery: recoverySettingsSchema,
  // Housing belongs to the march, not to the account: it lives on `BattleSetup` only.
  setups: z.array(battleSetupSchema),
  activeSetupId: z.uuid(),
  savedStacks: z.array(savedStackSchema),
});
export type Profile = z.infer<typeof profileSchema>;

// ---- Root document --------------------------------------------------------------------------------
export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const uiSchema = z.object({ theme: z.enum(THEMES) });

export const rootDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  /** Game-table version the stored values were entered against (ADR-0004). */
  dataVersion: z.int().min(0),
  deviceId: nonEmpty,
  /** User-editable, shown in conflict dialogs ("Rémi's phone"). */
  deviceName: z.string(),
  activeProfileId: z.uuid(),
  profiles: z.array(profileSchema),
  /** Deletions, so a sync pull does not resurrect a profile deleted on this device. */
  tombstones: z.array(tombstoneSchema),
  ui: uiSchema,
});
export type RootDocument = z.infer<typeof rootDocumentSchema>;

// ---- Contract checks (compile-time only) ------------------------------------------------------------
// These fail `pnpm typecheck` if the stored shapes drift from the data/engine contracts we do not own.
export type StoredBonusMap = z.infer<typeof bonusMapSchema>;
export type StoredSpecialMap = z.infer<typeof specialMapSchema>;
export type StoredCategory = z.infer<typeof categorySchema>;
type _AssertBonusMap = StoredBonusMap extends BonusMap
  ? BonusMap extends StoredBonusMap
    ? true
    : never
  : never;
type _AssertSpecialMap = StoredSpecialMap extends SpecialMap
  ? SpecialMap extends StoredSpecialMap
    ? true
    : never
  : never;
type _AssertCategory = StoredCategory extends Category
  ? Category extends StoredCategory
    ? true
    : never
  : never;
export type SchemaContractChecks = [_AssertBonusMap, _AssertSpecialMap, _AssertCategory];
