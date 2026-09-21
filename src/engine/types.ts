/**
 * Engine contract (ADR-0006). Plain data in, plain data out: everything here must survive structured
 * cloning (worker boundary). No React, no store, no DOM in `src/engine`.
 * Percentages are "as entered" (39.5 means +39.5 %); the engine divides by 100 exactly once.
 */
import type {
  BonusKey,
  Category,
  Group,
  MatchupBonus,
  Pool,
  SpecialKey,
  StrengthAgainstKey,
  UnitDef,
} from '../data/types';

// ---- Bonus totals --------------------------------------------------------------------------------
/** A named bonus source after resolution (captain at level X, one equipment piece, a title…). */
export interface ResolvedSource {
  id: string; // stable id for the breakdown drawer
  label: string;
  kind:
    | 'permanent'
    | 'captain'
    | 'equipment'
    | 'artifact'
    | 'title'
    | 'hero'
    | 'vip'
    | 'dragon'
    | 'event'
    | 'other'
    | 'custom';
  health?: Partial<Record<BonusKey, number>>;
  strength?: Partial<Record<BonusKey, number>>;
  special?: Partial<Record<SpecialKey, number>>;
  matchup?: MatchupBonus[];
  /** Extra strength added inside the additive bracket for every unit (Ragnarok event +130). */
  eventStrength?: number;
}

export interface BonusTotals {
  health: Record<BonusKey, number>;
  strength: Record<BonusKey, number>;
  special: Record<SpecialKey, number>;
  matchup: MatchupBonus[];
  eventStrength: number;
  /** Per key, which sources contributed how much (for the breakdown UI). */
  breakdown: {
    health: Partial<Record<BonusKey, { sourceId: string; value: number }[]>>;
    strength: Partial<Record<BonusKey, { sourceId: string; value: number }[]>>;
    special: Partial<Record<SpecialKey, { sourceId: string; value: number }[]>>;
  };
}

// ---- Stacking request ----------------------------------------------------------------------------
export interface Housing {
  leadership: number;
  authority: number;
  dominance: number;
}
export type EnemyFormation = Record<Category, number>; // number of enemy squads per category

export type Method = 'elite' | 'ms' | 'custom';
export interface StackingOptions {
  method: Method;
  /** M's Preservation only: also force every mercenary stack above every monster stack (help-text rule). */
  strictMercsAboveMonsters: boolean;
  /** Elite Preservation only: monsters die after all leadership troops (legacy TotalStack flag). */
  monstersLast: boolean;
  /** Mercenary and monster counts constrained to multiples of 10. */
  roundTo10: boolean;
  /**
   * M's Preservation only: after sizing, let monster/mercenary stacks grow past the lowest troop stack while
   * both the average and the minimum damage improve (investigation 0003). Off by default — it deliberately
   * breaks the promise MP is chosen for, so the UI must flag the stacks that moved.
   */
  relaxedPreservation?: boolean;
  /** `method === 'custom'`: unit ids first-to-die first; ids missing from the list are appended in EP order. */
  customOrder?: string[];
}

export type RecoveryMode = 'retrain' | 'revive' | 'selective';

/**
 * The five families an army is read in — the game's four `group` values plus mercenaries, which are a
 * `kind` and not a group (`unitFamily` in `recovery.ts` is the one place that decides which a unit is).
 * They are what the interface colours units by (`ui/domain/unitGroup.ts` re-exports these) and what a
 * selective recovery is chosen in.
 */
export const UNIT_FAMILIES = ['guardsmen', 'specialists', 'engineers', 'monsters', 'mercenaries'] as const;
export type UnitFamily = (typeof UNIT_FAMILIES)[number];

export interface RecoverySettings {
  templeLevel: number; // 0..45
  trainingCostReduction: Partial<Record<Group, number>>; // percent
  trainingSpeed: Partial<Record<Group, number>>; // percent
  /**
   * `selective` revives the **top type of each family listed**, and retrains everything else; the list
   * absent means all five (`UNIT_FAMILIES`). Until 2026-09-21 it was `selectiveTop`, a count of types
   * taken off one list sorted by tier — TotalStack's own "TOP 1 / TOP 2 / TOP 3" — which the owner
   * could not read as an answer to the question he was asking ("revive top monster, revive top
   * guardsmen"): the top three types of an army with four monster tiers are three monsters, and his
   * guardsmen were retrained without his ever having said so.
   */
  plan: { mode: RecoveryMode; reviveFamilies?: readonly UnitFamily[] };
}

export interface StackRequest {
  /** Unit types to include (already filtered by tiers/exclusions). Custom mercenaries are plain UnitDefs. */
  units: UnitDef[];
  /** Max count per unit id (mercenaries owned). Absent = unlimited. */
  caps: Record<string, number>;
  housing: Housing;
  totals: BonusTotals;
  options: StackingOptions;
  enemy: EnemyFormation;
  /** Ids of events active for this march (turns on event-gated strength-against, e.g. swarmUnits). */
  activeEvents: string[];
  recovery: RecoverySettings;
}

// ---- Stacking result -----------------------------------------------------------------------------
export interface Stack {
  unitId: string;
  pool: Pool;
  count: number;
  hpPerUnit: number; // integer (rounded like the game)
  totalHp: number;
  strengthPerUnit: number; // base × (1 + Σ strength + event)
  /** Enemy squad this stack hits (best strength-against present in the formation, else melee). */
  target: Category;
  /** Damage of one hit: base part + features part (journal formula, PLAN §3.5). */
  damagePerHit: number;
  featuresDamage: number; // count × baseStrength × SA[target] / 100
  /** Effective double-damage chance, percent (unit + group + global). */
  doubleDamageChance: number;
  strikeTwoSquadsChance: number;
}

export interface PoolUsage {
  used: number;
  capacity: number;
}

export interface StackResult {
  /** In kill order: first to die first. */
  stacks: Stack[];
  pools: Record<Pool, PoolUsage>;
  /** Unit types that were requested but got no units, with a human-readable reason. */
  dropped: { unitId: string; reason: string }[];
  warnings: string[];
}

// ---- Battle simulation ---------------------------------------------------------------------------
export interface JournalEntry {
  n: number;
  actor: 'enemy' | 'army';
  /** Our stack involved: the attacker (army) or the victim (enemy). */
  unitId: string;
  /** Enemy squad targeted (army entries only). */
  target?: Category;
  damage: number;
  featuresDamage?: number;
  /** Cumulative hits of that squad after this entry (journal counter). */
  hits: number;
}

export interface BattleJournal {
  entries: JournalEntry[];
  rounds: number;
  friendlyHits: number;
  totalDamage: number;
}

export interface RecoveryCost {
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
}

export interface BattleSummary {
  stackCount: number;
  minDamage: number; // enemy strikes first, no probabilistic extras
  maxDamage: number; // army strikes first
  avgDamage: number; // (min + max) / 2 with double-damage / strike-two expectations applied
  damageByPool: Record<Pool, number>;
  recovery: RecoveryCost;
  damagePerSilver: number;
  damagePerGold: number;
  damagePerDragonCoin: number;
  journals: { enemyFirst: BattleJournal; armyFirst: BattleJournal };
  /** Explains which parts of the model are validated in game (ADR-0006). */
  modelNotes: string[];
}

// ---- Priority search -----------------------------------------------------------------------------
/**
 * `avgDamage` maximises the expected damage, `minDamage` the *worst* case (the enemy striking first). They
 * disagree sharply once bonuses are large: the average rewards a few enormous stacks that only pay off when
 * we strike first, while the minimum keeps the army wide. `SearchResult.baseline` carries the all-types
 * army so the UI can put the trade-off (hits, min, avg, recovery cost) in front of the user.
 */
export type Objective =
  'avgDamage' | 'minDamage' | 'damagePerSilver' | 'damagePerGold' | 'damagePerDragonCoin';

export interface SearchRequest {
  request: StackRequest;
  objective: Objective;
  /** Wall-clock budget; the search returns the best found so far when exceeded. */
  budgetMs: number;
  seed?: number;
}

export interface SearchProgress {
  evaluated: number;
  bestScore: number;
  elapsedMs: number;
}

export interface SearchResult {
  includedUnitIds: string[];
  result: StackResult;
  summary: BattleSummary;
  score: number;
  evaluated: number;
  exhaustive: boolean;
  /**
   * The objective has no meaning for this army: its ratio's denominator is zero for every candidate (a
   * march with no monsters costs no dragon coins), so nothing could be compared and the winner is simply
   * the all-types formation — the very march "No priority" produces. The UI must say that instead of
   * presenting the result as what the objective chose.
   */
  unmeasurable: boolean;
  /**
   * The army the user would get without the search — every requested unit type, sized from the same request.
   * Always present (it is the search's first evaluation) so the UI can show what the winner traded away:
   * friendly hits are `summary.journals.enemyFirst.friendlyHits` / `.armyFirst.friendlyHits`, the rest is
   * `minDamage` / `avgDamage` / `recovery`.
   */
  baseline: { includedUnitIds: string[]; result: StackResult; summary: BattleSummary };
}

export type { BonusKey, Category, Group, Pool, SpecialKey, StrengthAgainstKey, UnitDef };
