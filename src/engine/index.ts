/**
 * Public API of the calculation engine (ADR-0006). Plain data in, plain data out; no React, DOM or store
 * imports anywhere under `src/engine`, so the whole module tree can run inside a Web Worker or a CLI.
 */
export { aggregateBonuses, emptyTotals, matchupBonus } from './bonuses';
export {
  chooseTarget,
  effectiveUnit,
  healthMultiplier,
  healthPercent,
  hitDamage,
  strengthMultiplier,
  strengthPercent,
  swarmActive,
  SWARM_EVENT_IDS,
} from './units';
export type { EffectiveUnit } from './units';
export { buildKillOrder, eliteOrder } from './killOrder';
export { RANK_SPREAD, sizeStacks } from './stacker';
export {
  EXHAUSTIVE_LIMIT,
  MAX_RESTARTS,
  mulberry32,
  objectiveScore,
  PROGRESS_EVERY,
  searchPriority,
} from './search';
export {
  attackOrder,
  battleSequence,
  buildJournal,
  enemySquadCount,
  expectedHits,
  simulateBattle,
} from './battle';
export {
  CHUNK,
  chunks,
  recoveryCosts,
  retrainOne,
  reviveOne,
  templeDivisor,
  TEMPLE_MULTIPLIER,
} from './recovery';
export type { RecoveryBreakdown } from './recovery';
export type {
  BattleJournal,
  BattleSummary,
  BonusKey,
  BonusTotals,
  Category,
  EnemyFormation,
  Group,
  Housing,
  JournalEntry,
  Method,
  Objective,
  Pool,
  PoolUsage,
  RecoveryCost,
  RecoveryMode,
  RecoverySettings,
  ResolvedSource,
  SearchProgress,
  SearchRequest,
  SearchResult,
  SpecialKey,
  Stack,
  StackRequest,
  StackResult,
  StackingOptions,
  StrengthAgainstKey,
  UnitDef,
} from './types';

// S-54 — the campaign simulator (one army, several marches). No longer a method the app can choose: removed
// from the Battle card by S-56 (2026-09-15) and kept as the instrument the theorycraft experiments measure
// with (`tools/theorycraft/22`, `23`, `48`). Appended last so it never collides with the rest of the file.
export {
  campaignScore,
  clampSpend,
  COMPLETE_METHODS,
  DEFAULT_SPEND_LEVELS,
  marchTarget,
  searchComplete,
  SHORTLIST,
  simulateCampaign,
  withMethod,
} from './campaign';
export type {
  CampaignMarch,
  CampaignSettings,
  CampaignSummary,
  CompleteCandidate,
  CompleteMethod,
  CompleteRequest,
  CompleteResult,
} from './campaign';

// S-55 — the plan method (`plan.ts`): the campaign planned from the army alone, drawn on the Battle card as
// Complete optimization since S-56 dropped the "v2". Names are prefixed with Plan to stay clear of S-54's
// Campaign* exports.
export { DEFAULT_GAP, planCampaign, marchResult as planMarch } from './plan';
export type { CampaignInput, CampaignPlan, PlanMarch, PlanTotals } from './plan';
