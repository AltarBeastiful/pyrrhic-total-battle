/**
 * S-32 / S-34 — battle model and Battle Summary (PLAN §3.5,
 * docs/research/battle-model-observations.md §1).
 *
 * Round structure (reproduces both TotalStack journals and both in-game reports):
 *   - our stacks are ordered by total HP descending; the enemy always wipes the highest-HP living stack;
 *   - each round the enemy makes N attacks (N = number of enemy squads); between two consecutive enemy
 *     attacks the new top stack (the next victim) attacks once; after the N-th enemy attack every survivor
 *     attacks once in HP order;
 *   - "your army first" only inserts one attack by the top stack at the very start.
 * Closed form for the hit counters the journal prints: with kill position p (1-based) a stack lives
 * r = ceil(p / N) rounds and hits `r − 1` times when `p ≡ 1 (mod N)`, else `r` times; +1 for p = 1 army-first.
 */
import type { Pool } from '../data/types';
import { recoveryCosts } from './recovery';
import type { BattleJournal, BattleSummary, JournalEntry, Stack, StackRequest, StackResult } from './types';

/** Journal hit counter of the stack at kill position `position` (1-based). */
export function expectedHits(position: number, enemyStacks: number, armyFirst: boolean): number {
  if (enemyStacks <= 0 || position <= 0) return 0;
  const rounds = Math.ceil(position / enemyStacks);
  // Rank of this stack among the enemy attacks of its own (final) round.
  const slot = position - (rounds - 1) * enemyStacks;
  // It attacks in the survivor sweep of every earlier round, plus once as "the next victim" unless the
  // round opens by killing it.
  const hits = rounds - (slot === 1 ? 1 : 0);
  return hits + (armyFirst && position === 1 ? 1 : 0);
}

/** Number of enemy squads in a formation (4 standard, 8 for Arachne's, 3 in the 2026-09-11 report). */
export function enemySquadCount(enemy: Record<string, number>): number {
  return Object.values(enemy).reduce((sum, count) => sum + Math.max(0, count), 0);
}

interface Move {
  actor: 'enemy' | 'army';
  index: number;
}

/** The move sequence of one battle, in journal order. */
export function battleSequence(stackCount: number, enemyStacks: number, armyFirst: boolean): Move[] {
  const moves: Move[] = [];
  if (stackCount <= 0 || enemyStacks <= 0) return moves;
  let alive = 0;
  let opening = armyFirst;
  while (alive < stackCount) {
    if (opening) {
      moves.push({ actor: 'army', index: alive });
      opening = false;
    }
    for (let k = 0; k < enemyStacks && alive < stackCount; k += 1) {
      moves.push({ actor: 'enemy', index: alive });
      alive += 1;
      if (k < enemyStacks - 1 && alive < stackCount) moves.push({ actor: 'army', index: alive });
    }
    for (let i = alive; i < stackCount; i += 1) moves.push({ actor: 'army', index: i });
  }
  return moves;
}

/** One journal: the same numbered entry list TotalStack and the game's report print. */
export function buildJournal(stacks: Stack[], enemyStacks: number, armyFirst: boolean): BattleJournal {
  const moves = battleSequence(stacks.length, enemyStacks, armyFirst);
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
      entries.push({
        n: index + 1,
        actor: 'enemy',
        unitId: stack.unitId,
        // The enemy's damage line is exactly the destroyed stack's total HP (verified in game).
        damage: stack.totalHp,
        hits,
      });
    }
  });

  // TotalStack labels the journal "<n> rounds" where n is the number of entries; we keep that meaning so a
  // user can compare 1:1 with its screen.
  return { entries, rounds: entries.length, friendlyHits, totalDamage };
}

function hitsPerStack(stacks: Stack[], enemyStacks: number, armyFirst: boolean): number[] {
  const counts = stacks.map(() => 0);
  for (const move of battleSequence(stacks.length, enemyStacks, armyFirst)) {
    if (move.actor === 'army') counts[move.index] = (counts[move.index] ?? 0) + 1;
  }
  return counts;
}

const MODEL_NOTES = [
  'Per-hit damage = count × strength × (1 + Σ strength + event) + count × base strength × strengthAgainst/100; verified on every line of three TotalStack journals and two in-game reports.',
  "Enemy damage line = the destroyed stack's total HP; the enemy always wipes our highest-HP living stack (10/10 kills in the in-game reports).",
  "Summary damage uses the journal per-hit value (features counted once). TotalStack's Battle Summary counts the strength-against part twice; that is unexplained, so we do not copy it — our MINIMUM will read lower than its.",
  'Minimum = the enemy strikes first and nothing lucky happens: the enemy-first journal total, exactly the sum of its per-hit lines, with no probabilistic extra.',
  "Maximum = we strike first and every stack's double-damage chance pays off on average: the army-first journal total with each stack multiplied by (1 + chance/100). A double damage is a plain ×2 on one hit (observed once in game).",
  'Average = (minimum + maximum) / 2, so minimum ≤ average ≤ maximum always. Only the maximum and the average count expected double damage; the journals list the plain per-hit damage.',
  'Strike-two-squads is not modelled: no in-game observation of it yet, so it never changes a damage number.',
  'armyStrengthAgainstEpicMonsters is treated as an extra strength-against that applies to every target (we only ever fight epic monsters).',
  "swarmUnits strength-against counts only while the Arachne's event id is in activeEvents.",
  "Open: in both in-game reports one mounted stack (Rider I) was killed before its turn while the next stack took the friendly slot; we keep TotalStack's HP-order rule, so our journal has one extra friendly hit per such fight.",
] as const;

/**
 * Expected multiplier of one stack's damage once its double-damage chance is priced in: a proc is a plain ×2
 * on a single hit, so a 5 % chance is worth ×1.05 on average. Only the maximum and the average use it — the
 * minimum and the journal lines carry the plain damage.
 */
export function expectedDoubleDamageFactor(stack: Pick<Stack, 'doubleDamageChance'>): number {
  return 1 + stack.doubleDamageChance / 100;
}

export function simulateBattle(result: StackResult, request: StackRequest): BattleSummary {
  const stacks = result.stacks;
  const enemyStacks = enemySquadCount(request.enemy);
  const enemyFirst = buildJournal(stacks, enemyStacks, false);
  const armyFirst = buildJournal(stacks, enemyStacks, true);

  const enemyFirstHits = hitsPerStack(stacks, enemyStacks, false);
  const armyFirstHits = hitsPerStack(stacks, enemyStacks, true);
  const damageByPool: Record<Pool, number> = { leadership: 0, authority: 0, dominance: 0 };
  // Minimum: the enemy strikes first and nothing procs. Maximum: we strike first and every stack's
  // double-damage chance pays off on average. The average is the midpoint, so min ≤ avg ≤ max by construction.
  let maximum = 0;
  stacks.forEach((stack, index) => {
    const worst = (enemyFirstHits[index] ?? 0) * stack.damagePerHit;
    const best = (armyFirstHits[index] ?? 0) * stack.damagePerHit * expectedDoubleDamageFactor(stack);
    maximum += best;
    damageByPool[stack.pool] += (worst + best) / 2;
  });
  for (const pool of Object.keys(damageByPool) as Pool[]) {
    damageByPool[pool] = Math.round(damageByPool[pool]);
  }

  const minimum = enemyFirst.totalDamage;
  const average = Math.round((minimum + maximum) / 2);
  const recovery = recoveryCosts(stacks, request.units, request.recovery).plan;
  // The ratios are computed from the *displayed* (rounded) average, the way TotalStack's summary does it.
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
    modelNotes: [...MODEL_NOTES],
  };
}
