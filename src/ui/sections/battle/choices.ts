/**
 * What the Battle card offers, in the words of the glossary (`docs/design.md` §7): the three
 * stacking methods, the extra rules that go with them, the objective of a Generate, and the pools.
 *
 * The stored ids never change; only the words do. Every description is the one line the glossary
 * fixes, trimmed to fit a list row.
 */
import type { Pool, RecoveryMode } from '@/engine/types';
import { METHODS, OBJECTIVES } from '@/state/schema';
import type { SetupMethod } from '@/state/schema';

// ---- The rule the stacks are sized by ------------------------------------------------------------
export interface MethodChoice {
  value: SetupMethod;
  title: string;
  description: string;
}

export const isMethod = (value: string): value is SetupMethod =>
  (METHODS as readonly string[]).includes(value);

export const METHOD_CHOICES: readonly MethodChoice[] = [
  {
    value: 'elite',
    title: 'Tier ladder',
    description: 'Your cheapest, lowest-tier stacks take the hits first.',
  },
  {
    value: 'ms',
    title: 'Troops first',
    description: 'Hired units only fall once all of your troops have.',
  },
  {
    value: 'custom',
    title: 'Your own order',
    description: 'You decide which stack falls first.',
  },
  {
    value: 'plan',
    title: 'Complete optimization',
    description: 'Plans the marches your army can fight: how big each one is, and what it carries.',
  },
];

// ---- The extra rules -----------------------------------------------------------------------------
export type OptionKey = 'relaxedPreservation' | 'monstersLast' | 'strictMercsAboveMonsters' | 'roundTo10';

export interface OptionChoice {
  key: OptionKey;
  label: string;
  description: string;
  /**
   * The methods the rule means anything for; on the others it is hidden, not disabled (§7.4).
   * **Complete optimization is on none of them**: it tries every sizing itself, so a rule that fixes
   * one of them would be the player answering the question they asked the search.
   */
  methods: readonly SetupMethod[];
}

/** In the order §7.4 lists them. */
export const OPTION_CHOICES: readonly OptionChoice[] = [
  {
    key: 'relaxedPreservation',
    label: 'Allow damage trades',
    description: 'Let a hired stack grow past your smallest troop stack when that raises the damage.',
    methods: ['ms'],
  },
  {
    key: 'monstersLast',
    label: 'Monsters after troops',
    description: 'Keep every monster stack below your smallest troop stack; mercenaries stay free.',
    methods: ['elite'],
  },
  {
    key: 'strictMercsAboveMonsters',
    label: 'Monsters after mercenaries',
    description: 'Also keep every monster stack below your smallest mercenary stack.',
    methods: ['ms'],
  },
  {
    key: 'roundTo10',
    label: 'Hired units in tens',
    description: 'Mercenary and monster stacks become multiples of ten, because reviving works in tens.',
    methods: ['elite', 'ms', 'custom'],
  },
];

export const optionsFor = (method: SetupMethod): OptionChoice[] =>
  OPTION_CHOICES.filter((option) => option.methods.includes(method));

/** A rule belongs to the method it was written for; changing the method switches the rest off. */
export const appliesTo = (key: OptionKey, method: SetupMethod): boolean =>
  OPTION_CHOICES.find((option) => option.key === key)?.methods.includes(method) ?? false;

// ---- What a Generate aims at ---------------------------------------------------------------------
export type Priority = (typeof OBJECTIVES)[number] | 'none';

export interface ObjectiveChoice {
  value: Priority;
  title: string;
  description: string;
}

export const OBJECTIVE_CHOICES: readonly ObjectiveChoice[] = [
  {
    value: 'none',
    title: 'No priority',
    description: 'March with every unit type you own.',
  },
  {
    value: 'avgDamage',
    title: 'Highest average damage',
    description: 'The best expected damage over both openings.',
  },
  {
    value: 'minDamage',
    title: 'Best worst case',
    description: 'The most damage when the monster strikes first.',
  },
  {
    value: 'damagePerSilver',
    title: 'Damage per silver',
    description: 'The most damage for what the losses cost in silver.',
  },
  {
    value: 'damagePerGold',
    title: 'Damage per gold',
    description: 'The most damage for what reviving costs in gold.',
  },
  {
    value: 'damagePerDragonCoin',
    title: 'Damage per dragon coin',
    description: 'The most damage for what the losses cost in dragon coins.',
  },
];

export const isPriority = (value: string): value is Priority =>
  value === 'none' || (OBJECTIVES as readonly string[]).includes(value);

// ---- What the losses are paid with ---------------------------------------------------------------
export const RECOVERY_LABELS: Record<RecoveryMode, string> = {
  retrain: 'Retrain everything',
  revive: 'Revive everything',
  selective: 'Revive the top types, retrain the rest',
};

export interface RecoveryChoice {
  value: RecoveryMode;
  title: string;
  description: string;
}

/**
 * The three plans as whole rows rather than as a dropdown (design rule 8; investigation 0011 found
 * the last select box in the app here). One line each, in our own words: what it is paid with, and
 * what that costs you besides the coin.
 */
export const RECOVERY_CHOICES: readonly RecoveryChoice[] = [
  {
    value: 'retrain',
    title: RECOVERY_LABELS.retrain,
    description: 'Silver and training time bring every lost unit back.',
  },
  {
    value: 'revive',
    title: RECOVERY_LABELS.revive,
    description: 'Gold brings every lost unit back at once, with no wait.',
  },
  {
    value: 'selective',
    title: RECOVERY_LABELS.selective,
    description: 'Gold for your highest tiers, silver and time for the rest.',
  },
];

export const isRecoveryMode = (value: string): value is RecoveryMode =>
  RECOVERY_CHOICES.some((choice) => choice.value === value);

// ---- What the march can carry --------------------------------------------------------------------
export const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

export const POOL_HINTS: Record<Pool, string> = {
  leadership: 'Pays for troops.',
  authority: 'Pays for mercenaries.',
  dominance: 'Pays for monsters.',
};

export const POOLS = Object.keys(POOL_LABELS) as Pool[];
