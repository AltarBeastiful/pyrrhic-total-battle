/**
 * S-20 — bonus aggregation (PLAN §3.1).
 *
 * Every bonus editor in the UI resolves to a `ResolvedSource`; this module adds them up into the single
 * `BonusTotals` the rest of the engine reads. Percentages stay "as entered" here (39.5 means +39.5 %);
 * `units.ts` is the only place that divides by 100.
 */
import { BONUS_KEYS, SPECIAL_KEYS } from '../data/types';
import type { BonusKey, MatchupBonus, SpecialKey } from '../data/types';
import type { BonusTotals, ResolvedSource } from './types';

/** All-zero totals: the identity of `aggregateBonuses`. */
export function emptyTotals(): BonusTotals {
  const health = {} as Record<BonusKey, number>;
  const strength = {} as Record<BonusKey, number>;
  for (const key of BONUS_KEYS) {
    health[key] = 0;
    strength[key] = 0;
  }
  const special = {} as Record<SpecialKey, number>;
  for (const key of SPECIAL_KEYS) special[key] = 0;
  return {
    health,
    strength,
    special,
    matchup: [],
    eventStrength: 0,
    breakdown: { health: {}, strength: {}, special: {} },
  };
}

function note<K extends string>(
  bucket: Partial<Record<K, { sourceId: string; value: number }[]>>,
  key: K,
  sourceId: string,
  value: number,
): void {
  const list = bucket[key] ?? [];
  list.push({ sourceId, value });
  bucket[key] = list;
}

/**
 * Sum every source. Contributions are plain additive percentages (the game and TotalStack both add them
 * inside one bracket); the per-key breakdown keeps the provenance the UI needs to reconcile a battle report.
 */
export function aggregateBonuses(sources: ResolvedSource[]): BonusTotals {
  const totals = emptyTotals();
  for (const source of sources) {
    for (const [key, value] of Object.entries(source.health ?? {})) {
      if (value === undefined || value === 0) continue;
      totals.health[key as BonusKey] += value;
      note(totals.breakdown.health, key as BonusKey, source.id, value);
    }
    for (const [key, value] of Object.entries(source.strength ?? {})) {
      if (value === undefined || value === 0) continue;
      totals.strength[key as BonusKey] += value;
      note(totals.breakdown.strength, key as BonusKey, source.id, value);
    }
    for (const [key, value] of Object.entries(source.special ?? {})) {
      if (value === undefined || value === 0) continue;
      totals.special[key as SpecialKey] += value;
      note(totals.breakdown.special, key as SpecialKey, source.id, value);
    }
    for (const matchup of source.matchup ?? []) totals.matchup.push({ ...matchup });
    totals.eventStrength += source.eventStrength ?? 0;
  }
  return totals;
}

/** Total matchup percentage an attacker category gets against one target key. */
export function matchupBonus(matchups: MatchupBonus[], attacker: string | undefined, target: string): number {
  if (attacker === undefined) return 0;
  let sum = 0;
  for (const entry of matchups) {
    if (entry.attacker === attacker && entry.target === target) sum += entry.value;
  }
  return sum;
}
