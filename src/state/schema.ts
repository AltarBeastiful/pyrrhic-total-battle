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

import { BONUS_KEYS, CATEGORIES, GROUPS, MARCH_TYPES, QUALITIES, RACES, SPECIAL_KEYS } from '../data/types';
import type { BonusMap, Category, SpecialMap } from '../data/types';
import { UNIT_FAMILIES } from '../engine/types';
import type { Method, Objective, RecoveryMode } from '../engine/types';

/** Bumped whenever a stored shape changes; every bump needs a `migrations[n]` entry and a fixture test. */
export const SCHEMA_VERSION = 24;

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
 * What a *march* leaves out is not here and is not stored at all (schema v3, S-53): Generate solves
 * on everything the account can field, and the types the player then takes out of the march on screen
 * live with the result, not in the document.
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
  'monuments',
  'personalTechnologies',
] as const;
export type BuiltinPermanentSource = (typeof BUILTIN_PERMANENT_SOURCES)[number];

/**
 * The nine keys the hero talent tree can touch (B-25). The "Hero Talents" source carries strength and
 * health on these and nothing else; its form is limited to them and the 15 → 16 migration deletes the rest.
 */
export const HERO_TALENT_KEYS = [
  'army',
  'melee',
  'ranged',
  'mounted',
  'flying',
  'monster',
  'guardsmen',
  'specialist',
  'engineers',
] as const;

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
  /** Index into the captain table's `stars` ladder: in-game stars − 1 (3 stars in game = 2). */
  star: z.int().min(0).max(6),
});

/** `extra` carries the gem / enchant values typed on top of the quality table. */
export const equipmentEntrySchema = z.object({
  id: nonEmpty,
  equipmentId: nonEmpty,
  quality: qualitySchema,
  /** The player's own grouping (B-19): pieces that share a `setId` are one set. No set when absent. */
  setId: nonEmpty.optional(),
  extra: z
    .object({
      health: bonusMapSchema.optional(),
      strength: bonusMapSchema.optional(),
      special: specialMapSchema.optional(),
    })
    .optional(),
});

/**
 * What the player says of one artifact: its level and star. The bonuses are the game table's (B-39); only
 * the rolled random bonus is typed. `star` is the in-game star notation ("0.1".."5.0"), a string like the
 * data tables' keys.
 */
export const artifactEntrySchema = z.object({
  id: nonEmpty,
  artifactId: nonEmpty,
  level: z.int().min(1),
  star: z.string(),
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
  /** Names the player gave to sets, keyed by `setId`. A set without a name is suggested one (B-19). */
  equipmentSetNames: z.record(z.string(), z.string()).optional(),
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
  custom: z.array(customSourceSchema),
});
export type ProfileSources = z.infer<typeof sourcesSchema>;

// ---- Recovery / housing / enemy / method ----------------------------------------------------------
export const RECOVERY_MODES = ['retrain', 'revive', 'selective'] as const satisfies readonly RecoveryMode[];

/** The three sizings the engine itself knows (`engine/types.ts`, `Method`). */
export const ENGINE_METHODS = ['elite', 'ms', 'custom'] as const satisfies readonly Method[];

/**
 * What the Battle card offers. `plan` (S-55) is the app's own choice, not an engine method: it sizes the
 * whole campaign from the army alone — the marches, the counts and the split between silver and the
 * mercenary stock are all its to choose (`planCampaign`).
 *
 * `complete` (S-54) was the fourth method until 2026-09-15, when the owner reviewed the five and had it
 * removed as superseded by `plan`. It survives in `src/engine/campaign.ts` as a theorycraft instrument
 * only (experiments 22, 23 and 48 measure with it); a document that stored it migrates to `plan`
 * (`migrations.ts`, `3 → 4`).
 */
export const METHODS = [...ENGINE_METHODS, 'plan'] as const;
export type SetupMethod = (typeof METHODS)[number];
export const OBJECTIVES = [
  'avgDamage',
  'minDamage',
  'damagePerSilver',
  'damagePerGold',
  'damagePerDragonCoin',
] as const satisfies readonly Objective[];

/**
 * What the losses are paid with. `selective` revives **the top type of each family named**, and
 * retrains everything else; no list at all means all five, which is what the Battle card offers a
 * player who has never opened it (owner, 2026-09-21, replacing `selectiveTop` — a count of types off
 * one list sorted by tier, which he could not read as an answer to "revive top monster, revive top
 * guardsmen"; migration `5 → 6`).
 */
export const recoveryPlanSchema = z.object({
  mode: z.enum(RECOVERY_MODES),
  reviveFamilies: z.array(z.enum(UNIT_FAMILIES)).optional(),
  /** Families revived at every tier, not the top one alone (2026-10-25). */
  reviveAllTiers: z.array(z.enum(UNIT_FAMILIES)).optional(),
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
  custom: z.array(z.string()),
});
export type ActiveSources = z.infer<typeof activeSourcesSchema>;

/**
 * What kind of march this is (schema v8, W17 C5-0), for the captains the game limits to one kind
 * (`onlyOn` in `captains.json`: Amanitore on group marches, Hercules against epic monsters).
 * `'unspecified'` is the default and changes nothing: every captain switched on counts and each
 * restriction is only a caveat, exactly as before the field existed. Naming a type applies them. `'arena'`
 * (schema v20) is the Prime Arena's own: no `onlyOn` kind is met there, so only the unconditional captains count.
 * The calculator's march-type control never offers it; the arena's inputs set it.
 */
export const SETUP_MARCH_TYPES = ['unspecified', ...MARCH_TYPES, 'arena'] as const;
export type SetupMarchType = (typeof SETUP_MARCH_TYPES)[number];

export const battleSetupSchema = syncMetaSchema.extend({
  name: z.string(),
  active: activeSourcesSchema,
  marchType: z.enum(SETUP_MARCH_TYPES),
  housing: housingSchema,
  enemy: enemyFormationSchema,
  options: stackingOptionsSchema,
  /** `'none'` = plain Generate, no priority search (PLAN §3.6). */
  priority: z.union([z.enum(OBJECTIVES), z.literal('none')]),
  recoveryPlan: recoveryPlanSchema,
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

// ---- User-entered upgrades (W17 C2) -----------------------------------------------------------------
/**
 * What one typed upgrade changes: points on bonus lines, as entered (`+1.5` = +1.5 %), and housing slots.
 * No talent-tree or modernization table exists in `src/data`; the player types the numbers.
 */
export const upgradeDeltasSchema = z
  .object({
    health: bonusMapSchema.optional(),
    strength: bonusMapSchema.optional(),
    housing: housingSchema.partial().optional(),
  })
  .refine(
    (deltas) =>
      [deltas.health, deltas.strength, deltas.housing].some(
        (map) => map !== undefined && Object.keys(map).length > 0,
      ),
    { message: 'An upgrade changes at least one bonus line or housing pool.' },
  );
export type UpgradeDeltas = z.infer<typeof upgradeDeltasSchema>;

/**
 * The next step of a real source (a talent tier, a modernization step) typed by the player, so the
 * advisor answers "what does my next point give" — per cost when a cost is typed (`docs/plans/
 * progression-advisor.md` §4 C2). `unit` is free text ("talent points", "gold", "days").
 */
export const userUpgradeSchema = z.object({
  id: nonEmpty,
  label: z.string(),
  deltas: upgradeDeltasSchema,
  cost: z.object({ amount: z.number().positive(), unit: z.string() }).optional(),
});
export type UserUpgrade = z.infer<typeof userUpgradeSchema>;

// ---- Settings (schema v9) ------------------------------------------------------------------------------
/**
 * **Which hired pools a Generate opens with their pool-line rule on** (`docs/plans/burn-ceiling.md` §3.1; owner,
 * 2026-10-18: *"That could be a setting (default: modify monster and merc, or monster or merc only, or
 * neither)"*). `'neither'` is the default: a first run shows the plan's own marches.
 */
export const POOL_LINE_DEFAULTS = ['both', 'mercs', 'monsters', 'neither'] as const;
export type PoolLineDefault = (typeof POOL_LINE_DEFAULTS)[number];

/** The pool line's two standing rules: the push (S-159) and the round to tens. */
export const POOL_LINE_RULES = ['push', 'round'] as const;
export type PoolLineRule = (typeof POOL_LINE_RULES)[number];

/**
 * The account's preferences (schema v9): few knobs, sane defaults. `poolLineRule` is not chosen in a menu —
 * it is the rule the player last switched on from a pool line, so the setting opens the one he uses.
 */
export const profileSettingsSchema = z.object({
  poolLine: z.enum(POOL_LINE_DEFAULTS),
  poolLineRule: z.enum(POOL_LINE_RULES),
});
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;

// ---- Hero talents (schema v11, B-21) ----------------------------------------------------------------
/** What the talent plan serves: Battle draws from both battle trees, Economy and Archeology from their own. */
export const TALENT_GOALS = ['battle', 'economy', 'archeology'] as const;
export type TalentGoal = (typeof TALENT_GOALS)[number];

/** The unit kinds the player can force on, whatever his army says: the four categories and monsters. */
export const TALENT_UNIT_KINDS = ['melee', 'ranged', 'mounted', 'flying', 'monsters'] as const;
export type TalentUnitKind = (typeof TALENT_UNIT_KINDS)[number];

// ---- Talent priorities (schema v12, B-22) -------------------------------------------------------------
/** The order a new account ranks the goals in, rank 1 first. */
export const DEFAULT_TALENT_GOAL_ORDER = [
  'battle',
  'archeology',
  'economy',
] as const satisfies readonly TalentGoal[];

/** How strongly rank 1 wins: Focus 1 / 0.5 / 0.25, Lean 1 / 0.8 / 0.6, Even 1 / 1 / 1 (the table is the engine's). */
export const TALENT_STRENGTHS = ['focus', 'lean', 'even'] as const;
export type TalentStrength = (typeof TALENT_STRENGTHS)[number];

/** How points are spread: one weighted plan across the goals, or rank 1 filled before rank 2 before rank 3. */
export const TALENT_MODES = ['blended', 'strict'] as const;
export type TalentMode = (typeof TALENT_MODES)[number];

// ---- Talent usefulness (schema v13, B-23) ------------------------------------------------------------
/** The crypt types the player explores: a bonus for a type he does not explore counts for nothing. */
export const TALENT_CRYPT_TYPES = ['common', 'rare', 'epic'] as const;
export type TalentCryptType = (typeof TALENT_CRYPT_TYPES)[number];

/** The troop groups a bonus can be for; the player may not use some of them (schema v14). */
export const TALENT_TROOP_GROUPS = ['guardsmen', 'specialist', 'monster', 'engineers'] as const;
export type TalentTroopGroup = (typeof TALENT_TROOP_GROUPS)[number];

/** Every goal exactly once, rank 1 first; anything else loads as the default order. */
const talentGoalOrderSchema = z
  .array(z.enum(TALENT_GOALS))
  .refine((goals) => goals.length === TALENT_GOALS.length && new Set(goals).size === goals.length)
  .catch(() => [...DEFAULT_TALENT_GOAL_ORDER]);

/** The goals the plan leaves out, each once; at least one goal stays active, or nothing is ignored. */
const talentIgnoredSchema = z
  .array(z.enum(TALENT_GOALS))
  .refine((ignored) => new Set(ignored).size === ignored.length && ignored.length < TALENT_GOALS.length)
  .catch(() => []);

/**
 * **The hero talent planner's inputs** (B-21, priorities B-22). `ranks` maps a node id (the game's tech id, as
 * a string) to the ranks bought; a node absent holds none. `goals` ranks the three goals, rank 1 first;
 * `ignored` lists the goals left out (never all three); `strength` says how strongly rank 1 wins and `mode`
 * how the points are spread. A bad saved order, ignore list, strength or mode loads as its default.
 * `weights` are per goal, then per stat kind (the game's name, such as `UNIT_HEALTH`); a stat absent weighs
 * 1. `pointsOverride` replaces the points the level table gives, `null` when the player lets the table decide.
 */
export const talentsSchema = z.object({
  heroLevel: z.int().min(1).max(1000),
  ranks: z.record(z.string(), z.int().min(0).max(1000)),
  goals: talentGoalOrderSchema,
  ignored: talentIgnoredSchema,
  strength: z.enum(TALENT_STRENGTHS).catch('focus'),
  mode: z.enum(TALENT_MODES).catch('blended'),
  weights: z.partialRecord(z.enum(TALENT_GOALS), z.record(z.string(), z.number().min(0))),
  forcedUnitKinds: z.array(z.enum(TALENT_UNIT_KINDS)),
  /** The crypt types that count (B-23), each once; a bad saved list loads as all three. */
  crypts: z
    .array(z.enum(TALENT_CRYPT_TYPES))
    .refine((c) => new Set(c).size === c.length)
    .catch([...TALENT_CRYPT_TYPES]),
  /** A troop group forced off (`false`) or on (`true`) whatever the account fields; absent follows the account (B-23). */
  groupOverrides: z.partialRecord(z.enum(TALENT_TROOP_GROUPS), z.boolean()).catch({}),
  /** The player's whole stock of talent points (schema v15: held ranks spend it; before, points left to spend). */
  pointsOverride: z.int().min(0).nullable(),
});
export type Talents = z.infer<typeof talentsSchema>;

// ---- Prime Arena ----------------------------------------------------------------------------------
/**
 * The Prime Arena page's inputs (schema v18). The arena's gear and pools are a whole `BattleSetup` (captains,
 * equipment, artifacts and dragon in `active`; Leadership and Dominance in `housing`), so the page reuses the
 * calculator's cards over it. Entry ids refer to `sources`. The arena keeps no troops of its own (schema v22): the
 * Guardsmen "to" level that fixes its pool is the account's `profile.troops`, the calculator's own, so a step
 * on either page moves both. `toggles` holds only the permanent-source and talent switches that differ from
 * the rules' defaults; `seeded` records that the setup was first cloned from the active march, so a reload keeps
 * what was typed. The plan is a view result and is not stored.
 */
export const DEFAULT_ARENA_STACKS = 8;
export const MAX_ARENA_STACKS = 16;

/** The arena squad takes five captains and five artifacts, where a calculator march takes three of each. */
export const ARENA_MAX_CAPTAINS = 5;
export const ARENA_MAX_ARTIFACTS = 5;
export const arenaSetupSchema = battleSetupSchema.extend({
  active: activeSourcesSchema.extend({
    captains: z.array(z.string()).max(ARENA_MAX_CAPTAINS),
    artifacts: z.array(z.string()).max(ARENA_MAX_ARTIFACTS),
  }),
});

/** The most the other capacity bonus % may be typed as. */
export const MAX_OTHER_CAPACITY = 1000;

/**
 * What the arena's pools were last filled from (schema v24, B-43): the squad captains with their level, and the other
 * capacity bonus %. While today's inputs read the same, what the player typed over the pools stays.
 */
export const arenaCapacityBasisSchema = z.object({
  captains: z.array(z.object({ captainId: nonEmpty, level: z.int().min(0) })),
  other: z.number().min(0),
});
export type ArenaCapacityBasis = z.infer<typeof arenaCapacityBasisSchema>;

export const primeArenaSchema = z.object({
  toggles: z.record(z.string(), z.boolean()).catch({}),
  setup: arenaSetupSchema,
  seeded: z.boolean(),
  /** Which side the plan plays (schema v21); fixes the opponent panel and how it is scored. */
  role: z.enum(['attacker', 'defender']).catch('attacker'),
  /** Most stacks in the squad (schema v21); the real limit is unknown, 8 is the planner's default. */
  maxStacks: z.number().int().min(1).max(MAX_ARENA_STACKS).catch(DEFAULT_ARENA_STACKS),
  /** Capacity bonus % the app has no source for (schema v24), added to the captains' Leadership and Dominance. */
  otherCapacity: z.number().min(0).max(MAX_OTHER_CAPACITY).catch(0),
  /** `null` until the page first reads this arena: the saved pools stay as typed, unless both are zero. */
  capacityBasis: arenaCapacityBasisSchema.nullable().catch(null),
});
export type PrimeArenaSaved = z.infer<typeof primeArenaSchema>;

// ---- Profile --------------------------------------------------------------------------------------
/**
 * The parts of a profile two devices can change independently (S-49e). Each gets its own edit time in
 * `sectionUpdatedAt`, so the account merge keeps troops changed on one device *and* bonuses changed on
 * the other. Marches and saved marches carry their own sync metadata and are merged record by record.
 */
export const PROFILE_SECTIONS = [
  'name',
  'troops',
  'mercenaries',
  'sources',
  'recovery',
  'activeSetupId',
  'upgrades',
  'settings',
  'talents',
  'primeArena',
] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

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
  /** Upgrades the player typed for the advisor to weigh (schema v7, W17 C2). */
  upgrades: z.array(userUpgradeSchema),
  /** The account's preferences (schema v9): the pool line a Generate opens with. */
  settings: profileSettingsSchema,
  /** The hero talent planner's inputs (schema v11, B-21; priorities v12, B-22). */
  talents: talentsSchema,
  /** The Prime Arena page's inputs (schema v17, B-36). */
  primeArena: primeArenaSchema,
  /** When each section was last edited; absent on a profile no edit has stamped yet (S-49e). */
  sectionUpdatedAt: z.partialRecord(z.enum(PROFILE_SECTIONS), timestamp).optional(),
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
