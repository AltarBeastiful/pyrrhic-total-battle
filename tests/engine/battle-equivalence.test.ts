/**
 * **The refactored simulator against the one it replaced, move for move** (S-123, 2026-09-22).
 *
 * `simulateBattle` ran the whole battle **four** times — `buildJournal` twice and `hitsPerStack` twice, the
 * second pair recomputing hit counters the first pair had already counted — and sorted the attack order four
 * times with it. It now walks each orientation once, and `battleScore` beside it answers the priority
 * search's question without writing a journal down at all.
 *
 * That is a performance change, and a performance change to the one function every figure in this repo is
 * priced by has to be **provably** a performance change and nothing else. So the version it replaced is kept
 * here, copied line for line out of `git show bf19b01:src/engine/battle.ts`, and the two are run against the
 * same armies: the whole `BattleSummary`, deep-equal, on every subset of every benchmark army this file can
 * build, plus the shapes a real army never produces (no stacks, one stack, an enemy formation of three and
 * of eight).
 *
 * If this test passes, the refactor is invisible to every caller. If it ever fails, the refactor is the
 * suspect and not the engine.
 */
import { describe, expect, it } from 'vitest';

import { attackOrder, battleScore, enemySquadCount, simulateBattle } from '@/engine/battle';
import { recoveryCosts } from '@/engine/recovery';
import { sizeStacks } from '@/engine/stacker';
import type { Pool } from '@/data/types';
import type {
  BattleJournal,
  BattleSummary,
  JournalEntry,
  Stack,
  StackRequest,
  StackResult,
} from '@/engine/types';

import { commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

// ---- the implementation this refactor replaced, verbatim -------------------------------------------------

interface Move {
  actor: 'enemy' | 'army';
  index: number;
}

/** `battleSequence` as it stood: `attackers.find(...)` on every attack, a fresh scan from the top. */
function legacySequence(
  stackCount: number,
  enemyStacks: number,
  armyFirst: boolean,
  order?: number[],
): Move[] {
  const moves: Move[] = [];
  if (stackCount <= 0 || enemyStacks <= 0) return moves;
  const attackers = order ?? Array.from({ length: stackCount }, (_unused, index) => index);
  const dead = new Array<boolean>(stackCount).fill(false);
  const acted = new Array<boolean>(stackCount).fill(false);
  const nextAttacker = (): number | undefined => attackers.find((index) => !dead[index] && !acted[index]);
  const attack = (): void => {
    const index = nextAttacker();
    if (index === undefined) return;
    acted[index] = true;
    moves.push({ actor: 'army', index });
  };

  if (armyFirst) attack();
  let killed = 0;
  while (killed < stackCount) {
    for (let k = 0; k < enemyStacks && killed < stackCount; k += 1) {
      moves.push({ actor: 'enemy', index: killed });
      dead[killed] = true;
      killed += 1;
      if (k < enemyStacks - 1 && killed < stackCount) attack();
    }
    for (const index of attackers) if (!dead[index] && !acted[index]) moves.push({ actor: 'army', index });
    acted.fill(false);
  }
  return moves;
}

function legacyJournal(stacks: Stack[], enemyStacks: number, armyFirst: boolean): BattleJournal {
  const moves = legacySequence(stacks.length, enemyStacks, armyFirst, attackOrder(stacks));
  const totalHits = stacks.map(() => 0);
  for (const move of moves) {
    if (move.actor === 'army') totalHits[move.index] = (totalHits[move.index] ?? 0) + 1;
  }
  const entries: JournalEntry[] = [];
  let totalDamage = 0;
  let friendlyHits = 0;
  moves.forEach((move, index) => {
    const stack = stacks[move.index];
    if (!stack) return;
    const hits = totalHits[move.index] ?? 0;
    if (move.actor === 'army') {
      friendlyHits += 1;
      totalDamage += stack.damagePerHit;
      entries.push({
        n: index + 1,
        actor: 'army',
        unitId: stack.unitId,
        target: stack.target,
        damage: stack.damagePerHit,
        featuresDamage: stack.featuresDamage,
        hits,
      });
    } else {
      entries.push({ n: index + 1, actor: 'enemy', unitId: stack.unitId, damage: stack.totalHp, hits });
    }
  });
  return { entries, rounds: entries.length, friendlyHits, totalDamage };
}

function legacyHitsPerStack(stacks: Stack[], enemyStacks: number, armyFirst: boolean): number[] {
  const counts = stacks.map(() => 0);
  for (const move of legacySequence(stacks.length, enemyStacks, armyFirst, attackOrder(stacks))) {
    if (move.actor === 'army') counts[move.index] = (counts[move.index] ?? 0) + 1;
  }
  return counts;
}

/** `simulateBattle` as it stood, minus `modelNotes` (a constant this refactor never touched). */
function legacySimulate(result: StackResult, request: StackRequest): Omit<BattleSummary, 'modelNotes'> {
  const stacks = result.stacks;
  const enemyStacks = enemySquadCount(request.enemy);
  const enemyFirst = legacyJournal(stacks, enemyStacks, false);
  const armyFirst = legacyJournal(stacks, enemyStacks, true);
  const enemyFirstHits = legacyHitsPerStack(stacks, enemyStacks, false);
  const armyFirstHits = legacyHitsPerStack(stacks, enemyStacks, true);
  const damageByPool: Record<Pool, number> = { leadership: 0, authority: 0, dominance: 0 };
  stacks.forEach((stack, index) => {
    const worst = (enemyFirstHits[index] ?? 0) * stack.damagePerHit;
    const best = (armyFirstHits[index] ?? 0) * stack.damagePerHit;
    damageByPool[stack.pool] += (worst + best) / 2;
  });
  const maximum = armyFirst.totalDamage;
  for (const pool of Object.keys(damageByPool) as Pool[]) {
    damageByPool[pool] = Math.round(damageByPool[pool]);
  }
  const minimum = enemyFirst.totalDamage;
  const average = Math.round((minimum + maximum) / 2);
  const recovery = recoveryCosts(stacks, request.units, request.recovery).plan;
  const per = (cost: number): number => (cost > 0 ? average / cost : 0);
  return {
    stackCount: stacks.length,
    minDamage: minimum,
    maxDamage: Math.round(maximum),
    avgDamage: average,
    damageByPool,
    recovery,
    damagePerSilver: per(recovery.silver),
    damagePerGold: per(recovery.gold),
    damagePerDragonCoin: per(recovery.dragonCoins),
    journals: { enemyFirst, armyFirst },
  };
}

// ---- the armies ------------------------------------------------------------------------------------------

/**
 * A deterministic walk over subsets of a scenario's units — the same shapes the priority search asks for,
 * which is where every one of the four battle walks was being paid for.
 */
function subsetsOf(request: StackRequest, seed: number): StackRequest[] {
  const ids = request.units.map((unit) => unit.id);
  const out: StackRequest[] = [request];
  let state = seed;
  const next = (): number => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
  for (let round = 0; round < 12; round += 1) {
    const kept = new Set(ids.filter(() => next() < 0.55));
    if (kept.size === 0) continue;
    out.push({ ...request, units: request.units.filter((unit) => kept.has(unit.id)) });
  }
  // And every single-type army, the degenerate shape a search reaches by dropping everything else.
  for (const id of ids.slice(0, 6)) {
    out.push({ ...request, units: request.units.filter((unit) => unit.id === id) });
  }
  return out;
}

describe('the refactored battle simulator answers exactly what the old one did', () => {
  /**
   * **The owner's own armies too, where his export is** (S-126, 2026-09-22). S-123 compared only
   * `commonScenarios()`, and that is six first-run armies plus the 4 000 case — none of which has an
   * uncapped hired type, a camp's worth of authority, or the ten-stack shapes the live camp produces. The
   * first time an owner army was priced by hand after the refactor it printed `min === avg === max`, which
   * is a startling enough reading to want the old implementation's opinion on. It agrees; but the gap was
   * real and this closes it.
   */
  const profile = ownerProfile();
  const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

  it('has armies to compare', () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  for (const scenario of scenarios) {
    it(`agrees on every subset of ${scenario.label}`, () => {
      let compared = 0;
      for (const request of subsetsOf(scenario.request, 12_345)) {
        const sized = sizeStacks(request);
        const now = simulateBattle(sized, request);
        const { modelNotes: _notes, ...rest } = now;
        expect(rest, `${scenario.label}: ${request.units.length} types`).toStrictEqual(
          legacySimulate(sized, request),
        );
        // And the light path the search now uses reads the same seven figures off the same battle.
        const score = battleScore(sized, request);
        expect(score, `${scenario.label}: battleScore against the whole summary`).toStrictEqual({
          minDamage: now.minDamage,
          maxDamage: now.maxDamage,
          avgDamage: now.avgDamage,
          recovery: now.recovery,
          damagePerSilver: now.damagePerSilver,
          damagePerGold: now.damagePerGold,
          damagePerDragonCoin: now.damagePerDragonCoin,
        });
        compared += 1;
      }
      expect(compared).toBeGreaterThan(10);
    });
  }

  /**
   * The shapes a sized army never produces, where an off-by-one in the cursor would hide: no stacks at all,
   * one stack, and enemy formations of three (the 2026-09-11 report) and eight (Arachne's).
   */
  it('agrees on the degenerate shapes too', () => {
    const base = scenarios[0]?.request;
    if (!base) throw new Error('no scenario');
    const sized = sizeStacks(base);
    const formation = (squads: number): StackRequest['enemy'] => ({
      melee: squads,
      ranged: 0,
      mounted: 0,
      flying: 0,
    });
    for (const enemy of [1, 2, 3, 4, 8, 13].map(formation)) {
      for (const take of [0, 1, 2, 3, sized.stacks.length]) {
        const request = { ...base, enemy };
        const result: StackResult = { ...sized, stacks: sized.stacks.slice(0, take) };
        const { modelNotes: _notes, ...rest } = simulateBattle(result, request);
        expect(rest, `${String(take)} stacks against ${String(enemySquadCount(enemy))} squads`).toStrictEqual(
          legacySimulate(result, request),
        );
      }
    }
  });
});
