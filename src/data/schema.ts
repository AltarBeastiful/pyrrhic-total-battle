/**
 * Runtime schemas for the JSON tables in `src/data/tables/`.
 *
 * They are the contract a data pull request is checked against: `pnpm data:check` and `data.test.ts`
 * parse every table with the schema below, so a typo in a key, a missing field or an unknown bonus key
 * fails CI with the file, the record and the field named. Every schema is bound to the TypeScript
 * shape in `types.ts` with `satisfies`, so the two can never drift apart.
 *
 * The objects are *strict*: an unrecognised key is an error rather than silently dropped, which is what
 * catches `revivalCost` where the field is called `revival`.
 */
import { z } from 'zod';

import {
  BONUS_KEYS,
  CATEGORIES,
  GROUPS,
  QUALITIES,
  RACES,
  SPECIAL_KEYS,
  STRENGTH_AGAINST_KEYS,
} from './types.ts';
import type {
  ArtifactRecord,
  BonusContribution,
  BonusMap,
  CaptainProgression,
  CaptainRecord,
  DataVersion,
  EquipmentRecord,
  EventRecord,
  HeroRecord,
  LevelTable,
  MatchupBonus,
  MercenaryRecord,
  MonsterRecord,
  OrderTables,
  OtherPillRecord,
  RevivalCost,
  SpecialMap,
  StrengthAgainstMap,
  TempleTable,
  TitleRecord,
  Training,
  TroopRecord,
  VipRecord,
} from './types.ts';

/**
 * The project compiles with `exactOptionalPropertyTypes`, while zod infers an optional property as
 * `T | undefined`. `Loose<T>` is the contract type with that same allowance (recursively), so
 * `satisfies z.ZodType<Loose<X>>` still proves the schema produces exactly the shape `X` describes:
 * a wrong field type, a missing field or a too-wide enum all fail to compile.
 */
type Loose<T> = T extends (infer U)[]
  ? Loose<U>[]
  : T extends object
    ? { [K in keyof T]: Loose<T[K]> | undefined }
    : T;

// ---- Shared leaves -------------------------------------------------------------------------------
const categoryKey = z.enum(CATEGORIES);
const bonusKey = z.enum(BONUS_KEYS);
/** Everything a mercenary can be tagged with: its role, its category and its race (never `army`). */
const tagKey = z.enum([...CATEGORIES, ...GROUPS, ...RACES]);
const specialKey = z.enum(SPECIAL_KEYS);
const strengthAgainstKey = z.enum(STRENGTH_AGAINST_KEYS);
const quality = z.enum(QUALITIES);

/** A percentage as read in game ("+39.5 %" is entered as 39.5). Negative for the penalty titles. */
const percent = z.number();
/** Silver, gold, housing cost, health, strength: whole numbers, never negative. */
const amount = z.int().nonnegative();
/**
 * Unit tier. Bounded loosely on purpose: the game adds tiers and a data pull request that brings a
 * new one must not be blocked by the schema (the per-table tier rules live in `data.test.ts`).
 */
const tier = z.int().min(1).max(20);

const bonusMapSchema = z.partialRecord(bonusKey, percent) satisfies z.ZodType<Loose<BonusMap>>;
const specialMapSchema = z.partialRecord(specialKey, percent) satisfies z.ZodType<Loose<SpecialMap>>;
const strengthAgainstSchema = z.partialRecord(strengthAgainstKey, percent) satisfies z.ZodType<
  Loose<StrengthAgainstMap>
>;

const matchupSchema = z.strictObject({
  attacker: categoryKey,
  target: strengthAgainstKey,
  value: percent,
}) satisfies z.ZodType<Loose<MatchupBonus>>;

const bonusContributionSchema = z.strictObject({
  health: bonusMapSchema.optional(),
  strength: bonusMapSchema.optional(),
  special: specialMapSchema.optional(),
  matchup: z.array(matchupSchema).optional(),
}) satisfies z.ZodType<Loose<BonusContribution>>;

const revivalSchema = z.strictObject({ gold: amount }) satisfies z.ZodType<Loose<RevivalCost>>;

const trainingSchema = z.strictObject({
  seconds: amount,
  silver: amount,
  dragonCoins: amount.optional(),
}) satisfies z.ZodType<Loose<Training>>;

/** Ids are kebab-case so they can be typed in a URL and read in a diff. */
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case, e.g. "archer-1"');
const name = z.string().min(1);
/** Short pill label, uppercase, no spaces: "ARC1", "SG". */
const label = z.string().regex(/^[A-Z0-9-]+$/, 'must be uppercase without spaces, e.g. "ARC1"');

// ---- Unit tables ---------------------------------------------------------------------------------
export const troopSchema = z.strictObject({
  id,
  name,
  label,
  group: z.enum(['guardsmen', 'specialist', 'engineers']),
  tier,
  category: categoryKey.optional(),
  race: z.enum(RACES).optional(),
  cost: amount,
  health: amount,
  strength: amount,
  strengthAgainst: strengthAgainstSchema.optional(),
  doubleDamageChance: percent.optional(),
  revival: revivalSchema,
  training: trainingSchema,
}) satisfies z.ZodType<Loose<TroopRecord>>;

export const monsterSchema = z.strictObject({
  id,
  name,
  label,
  tier,
  category: categoryKey,
  race: z.enum(RACES),
  cost: amount,
  health: amount,
  strength: amount,
  strengthAgainst: strengthAgainstSchema.optional(),
  doubleDamageChance: percent.optional(),
  revival: revivalSchema,
  training: trainingSchema,
}) satisfies z.ZodType<Loose<MonsterRecord>>;

export const mercenarySchema = z.strictObject({
  id,
  name,
  label,
  tier,
  tags: z.array(tagKey).min(1),
  cost: amount,
  health: amount,
  strength: amount,
  strengthAgainst: strengthAgainstSchema.optional(),
  doubleDamageChance: percent.optional(),
  revival: revivalSchema,
  event: id.optional(),
}) satisfies z.ZodType<Loose<MercenaryRecord>>;

// ---- Bonus source tables -------------------------------------------------------------------------
const progressionSchema = z.strictObject({
  key: bonusKey,
  perLevel: percent,
  stars: z.array(percent).length(7),
}) satisfies z.ZodType<Loose<CaptainProgression>>;

const specialProgressionSchema = z.strictObject({
  key: specialKey,
  perLevel: percent,
  stars: z.array(percent).length(7),
});

export const captainSchema = z.strictObject({
  id,
  name,
  health: progressionSchema.optional(),
  strength: progressionSchema.optional(),
  special: specialProgressionSchema.optional(),
  note: z.string().min(1).optional(),
}) satisfies z.ZodType<Loose<CaptainRecord>>;

export const equipmentSchema = z.strictObject({
  id,
  name,
  byQuality: z.partialRecord(quality, bonusContributionSchema),
}) satisfies z.ZodType<Loose<EquipmentRecord>>;

/** Level keys are "1".."60"; star keys use the in-game notation "0.1".."5.0". */
const levelTableSchema = z.strictObject({
  base: z.record(z.string().regex(/^\d+$/, 'level keys are whole numbers, e.g. "37"'), percent).optional(),
  star: z
    .record(z.string().regex(/^\d\.\d$/, 'star keys use the in-game notation, e.g. "3.2"'), percent)
    .optional(),
}) satisfies z.ZodType<Loose<LevelTable>>;

export const artifactSchema = z.strictObject({
  id,
  name,
  health: z.strictObject({ key: bonusKey, levels: levelTableSchema.optional() }).optional(),
  strength: z.strictObject({ key: bonusKey, levels: levelTableSchema.optional() }).optional(),
  special: z.strictObject({ key: specialKey, levels: levelTableSchema.optional() }).optional(),
  randomBonusOptions: z.array(z.string().min(1)),
}) satisfies z.ZodType<Loose<ArtifactRecord>>;

export const titleSchema = z.strictObject({
  id,
  name,
  bonus: bonusContributionSchema,
}) satisfies z.ZodType<Loose<TitleRecord>>;

export const heroSchema = z.strictObject({
  id,
  name,
  bonus: bonusContributionSchema,
  aloneOnly: z.boolean().optional(),
}) satisfies z.ZodType<Loose<HeroRecord>>;

/**
 * The fixed "+25 %" pills that sit next to the heroes in game (Personal / Clan / Kingdom).
 * Same shape as a title; kept in its own table because it is its own screen.
 */
export const otherPillSchema = z.strictObject({
  id,
  name,
  bonus: bonusContributionSchema,
}) satisfies z.ZodType<Loose<OtherPillRecord>>;

export const eventSchema = z.strictObject({
  id,
  name,
  strength: percent.optional(),
  enemyFormation: z.record(categoryKey, z.int().nonnegative()).optional(),
  activatesStrengthAgainst: strengthAgainstKey.optional(),
}) satisfies z.ZodType<Loose<EventRecord>>;

export const vipSchema = z.strictObject({
  level: z.int().min(0).max(30),
  bonus: bonusContributionSchema,
}) satisfies z.ZodType<Loose<VipRecord>>;

export const templeSchema = z.strictObject({
  multiplier: z.record(z.string().regex(/^\d+$/, 'temple levels are whole numbers'), z.number().positive()),
}) satisfies z.ZodType<Loose<TempleTable>>;

export const ordersSchema = z.strictObject({
  troops: z.array(id),
  monsters: z.array(id),
  captains: z.array(id),
}) satisfies z.ZodType<Loose<OrderTables>>;

export const versionSchema = z.strictObject({
  dataVersion: z.int().positive(),
  verifiedOn: z.iso.date(),
  notes: z.string().min(1),
}) satisfies z.ZodType<Loose<DataVersion>>;

// ---- Whole-table schemas -------------------------------------------------------------------------
export const troopsTableSchema = z.array(troopSchema);
export const monstersTableSchema = z.array(monsterSchema);
export const mercenariesTableSchema = z.array(mercenarySchema);
export const captainsTableSchema = z.array(captainSchema);
export const equipmentTableSchema = z.array(equipmentSchema);
export const artifactsTableSchema = z.array(artifactSchema);
export const titlesTableSchema = z.array(titleSchema);
export const heroesTableSchema = z.array(heroSchema);
export const otherPillsTableSchema = z.array(otherPillSchema);
export const eventsTableSchema = z.array(eventSchema);
export const vipTableSchema = z.array(vipSchema);

/**
 * Every file under `src/data/tables/`, with the schema it must satisfy. `pnpm data:check`, the
 * formatter and the data tests all walk this map, so adding a table here is enough to have it
 * validated and formatted everywhere.
 */
export const TABLE_SCHEMAS = {
  'artifacts.json': artifactsTableSchema,
  'captains.json': captainsTableSchema,
  'equipment.json': equipmentTableSchema,
  'events.json': eventsTableSchema,
  'heroes.json': heroesTableSchema,
  'mercenaries.json': mercenariesTableSchema,
  'monsters.json': monstersTableSchema,
  'orders.json': ordersSchema,
  'otherPills.json': otherPillsTableSchema,
  'temple.json': templeSchema,
  'titles.json': titlesTableSchema,
  'troops.json': troopsTableSchema,
  'version.json': versionSchema,
  'vip.json': vipTableSchema,
} as const;

export type TableFile = keyof typeof TABLE_SCHEMAS;
export const TABLE_FILES = Object.keys(TABLE_SCHEMAS) as TableFile[];

/**
 * Validates one table file against its schema and returns one readable line per problem
 * (empty when the table is valid). Used by `pnpm data:check` and by `data.test.ts`.
 */
export function validateTable(file: TableFile, value: unknown): string[] {
  const schema: z.ZodType = TABLE_SCHEMAS[file];
  const parsed = schema.safeParse(value);
  return parsed.success ? [] : describeIssues(file, parsed.error, value);
}

/** A zod error turned into one line per problem: `troops.json archer-1 · strength: expected number`. */
export function describeIssues(file: string, error: z.ZodError, rows?: unknown): string[] {
  const list = Array.isArray(rows) ? rows : undefined;
  return error.issues.map((issue) => {
    const [first, ...rest] = issue.path;
    const row = list && typeof first === 'number' ? list[first] : undefined;
    const recordId =
      row && typeof row === 'object' && 'id' in row ? String((row as { id: unknown }).id) : undefined;
    const where = recordId
      ? `${recordId} · ${rest.join('.') || '(record)'}`
      : issue.path.join('.') || '(root)';
    return `${file}: ${where}: ${issue.message}`;
  });
}
