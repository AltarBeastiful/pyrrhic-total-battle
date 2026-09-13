/**
 * S-30 / S-32 / S-34 — battle model and Battle Summary (PLAN §3.5,
 * docs/research/battle-model-observations.md §1).
 *
 * Two different orders drive a fight, and confusing them was the model's last open item (S-30):
 *   - the **kill order** is total HP descending: the enemy always wipes our highest-HP living stack
 *     (29/29 kills over four in-game reports, including a mercenary stack sitting on top);
 *   - the **attack order** is *base damage* descending — `count × strength × (1 + Σ strength%)`, i.e. the
 *     journal's per-hit damage **without** the strength-against ("features") part. Verified on all four
 *     reports; it is what makes Rider I miss its turn in the two 2026-09-11 fights and Rider II strike
 *     before the bigger Swordsman I stack on 2026-09-13.
 * Round structure (reproduces the three TotalStack journals and the in-game reports):
 *   - each round the enemy makes N attacks (N = number of enemy squads); between two consecutive enemy
 *     attacks the next stack in attack order that is alive and has not attacked this round attacks once;
 *   - after the N-th enemy attack every living stack that has not yet attacked this round attacks once, in
 *     attack order (a stack killed before its turn simply loses that round's attack);
 *   - "your army first" only inserts one attack by the first stack in attack order at the very start.
 * With flat-HP armies and uniform bonuses the two orders coincide (health and strength both scale a
 * base ratio of 3), which is why every captured TotalStack journal still reproduces entry for entry.
 * Closed form for the hit counters the journal prints, valid when the two orders coincide: with kill
 * position p (1-based) a stack lives r = ceil(p / N) rounds and hits `r − 1` times when `p ≡ 1 (mod N)`,
 * else `r` times; +1 for p = 1 army-first.
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

/**
 * Attack order as indices into the kill-ordered `stacks`: **base damage descending**, the per-hit damage
 * without the strength-against part. Ties keep the kill order, which is what the game's report shows when
 * two stacks carry the same boosted strength.
 */
export function attackOrder(stacks: Pick<Stack, 'count' | 'strengthPerUnit'>[]): number[] {
  // `count × strengthPerUnit` is the unrounded base damage; using it instead of the rounded journal figure
  // keeps two stacks with identical boosted strength a genuine tie (the ±1 of `hitDamage` would not).
  return stacks
    .map((stack, index) => ({ index, base: stack.count * stack.strengthPerUnit }))
    .sort((a, b) => b.base - a.base || a.index - b.index)
    .map((entry) => entry.index);
}

/**
 * The move sequence of one battle, in journal order. `order` lists the stack indices in attack order
 * (default: the kill order itself, which is the case whenever health and strength bonuses move together).
 */
export function battleSequence(
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
    // End-of-round sweep: everyone still alive who has not struck this round, in attack order.
    for (const index of attackers) if (!dead[index] && !acted[index]) moves.push({ actor: 'army', index });
    acted.fill(false);
  }
  return moves;
}

/** One journal: the same numbered entry list TotalStack and the game's report print. */
export function buildJournal(stacks: Stack[], enemyStacks: number, armyFirst: boolean): BattleJournal {
  const moves = battleSequence(stacks.length, enemyStacks, armyFirst, attackOrder(stacks));
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
  for (const move of battleSequence(stacks.length, enemyStacks, armyFirst, attackOrder(stacks))) {
    if (move.actor === 'army') counts[move.index] = (counts[move.index] ?? 0) + 1;
  }
  return counts;
}

const MODEL_NOTES = [
  'Per-hit damage = count × strength × (1 + Σ strength + event) + count × base strength × strengthAgainst/100; verified on every line of three TotalStack journals and two in-game reports.',
  "Enemy damage line = the destroyed stack's total HP; the enemy always wipes our highest-HP living stack (10/10 kills in the in-game reports).",
  "Summary damage uses the journal per-hit value (features counted once). TotalStack's Battle Summary counts the strength-against part twice; that is unexplained, so we do not copy it — our MINIMUM will read lower than its.",
  'The game prints no total damage: a report\u2019s damage is the sum of its own hit lines (features counted once, a double-damage line at its printed doubled value). Our minimum and maximum are exactly those sums, so a user can add up a report and land on one of them.',
  'Minimum = the enemy strikes first and nothing lucky happens: the enemy-first journal total.',
  'Maximum = we strike first: the army-first journal total, again the plain sum of its lines.',
  'Average = (minimum + maximum) / 2. Procs are upside we do not price in: a double damage is a plain \u00d72 on one hit, features included (2026-09-13 entry 14 = 4,224 incl. 780 against 2,112 incl. 390).',
  'Strike-two-squads is not modelled: no in-game observation of it yet, so it never changes a damage number.',
  'armyStrengthAgainstEpicMonsters is treated as an extra strength-against that applies to every target (we only ever fight epic monsters).',
  "swarmUnits strength-against counts only while the Arachne's event id is in activeEvents.",
  'Our stacks attack in base-damage order (per-hit damage without the strength-against part), not in HP order: confirmed on four in-game reports, it is why a big low-bonus stack can strike after a small one. The enemy still kills by HP.',
  'Open, one line in four reports: on 2026-09-13 the last surviving stack (Archer II) struck a second time after the round\u2019s last enemy attack. The account\u2019s unit cards show no strike-two-squads chance, so a proc is unlikely and the rule behind that extra sweep is unsettled; our journal has 20 entries against the game\u2019s 21.',
] as const;

/**
 * Expected multiplier of one stack's damage once its double-damage chance is priced in: a proc is a plain ×2
 * on a single hit (features included — verified in game), so a 5 % chance is worth ×1.05 on average. The
 * summary no longer uses it: min and max are the plain sums a battle report prints, and procs are upside on
 * top. Kept for the UI and for a future strike-two-squads model, which multiplies the same hit.
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
  // The game prints no total: a report's damage is the sum of its own hit lines, features included once.
  // So both bounds are exactly that sum — minimum with the enemy striking first, maximum with us — and a
  // user can add up their report and land on one of our two numbers. Procs (double damage, strike two
  // squads) are upside on top and are deliberately not priced in; the average is the plain midpoint.
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
