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
import type {
  BattleJournal,
  BattleScore,
  BattleSummary,
  JournalEntry,
  Stack,
  StackRequest,
  StackResult,
} from './types';

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
 * **The battle itself, walked once and reported move by move** (S-123, 2026-09-22) — the single place the
 * round structure is written, so the four readings drawn off it cannot drift apart.
 *
 * `visit(isArmy, index)` is called for every move in journal order. It replaced three copies of this loop:
 * `battleSequence` materialised a `Move[]`, `buildJournal` walked one to count hits and then walked the
 * moves again to write entries, and `hitsPerStack` walked a **second, identical** sequence to count the same
 * hits over again — so `simulateBattle` ran the whole battle **four** times (twice an orientation) and
 * sorted the attack order four times, to answer two questions.
 *
 * The one behavioural subtlety is the cursor. `nextAttacker` used `attackers.find(...)`, a scan from the
 * top on every single attack. A cursor is exact here rather than an approximation, and the reason is that
 * within one round eligibility is **monotone**: a stack that has acted stays acted until the round ends, and
 * a stack that is dead stays dead for good. Nothing a round does can make an attacker the cursor has already
 * passed eligible again, so advancing past it can never skip a move `find` would have made.
 */
function walkBattle(
  stackCount: number,
  enemyStacks: number,
  armyFirst: boolean,
  attackers: readonly number[],
  visit: (isArmy: boolean, index: number) => void,
): void {
  if (stackCount <= 0 || enemyStacks <= 0) return;
  const dead = new Array<boolean>(stackCount).fill(false);
  const acted = new Array<boolean>(stackCount).fill(false);
  let cursor = 0;
  const attack = (): void => {
    while (cursor < attackers.length) {
      const index = attackers[cursor] ?? -1;
      if (index >= 0 && !dead[index] && !acted[index]) {
        acted[index] = true;
        visit(true, index);
        return;
      }
      cursor += 1;
    }
  };

  if (armyFirst) attack();
  let killed = 0;
  while (killed < stackCount) {
    for (let k = 0; k < enemyStacks && killed < stackCount; k += 1) {
      visit(false, killed);
      dead[killed] = true;
      killed += 1;
      if (k < enemyStacks - 1 && killed < stackCount) attack();
    }
    // End-of-round sweep: everyone still alive who has not struck this round, in attack order.
    for (const index of attackers) if (!dead[index] && !acted[index]) visit(true, index);
    acted.fill(false);
    cursor = 0;
  }
}

/**
 * The move sequence of one battle, in journal order. `order` lists the stack indices in attack order
 * (default: the kill order itself, which is the case whenever health and strength bonuses move together).
 */
export function battleSequence(
  stackCount: number,
  enemyStacks: number,
  armyFirst: boolean,
  order?: readonly number[],
): Move[] {
  const moves: Move[] = [];
  const attackers = order ?? Array.from({ length: stackCount }, (_unused, index) => index);
  walkBattle(stackCount, enemyStacks, armyFirst, attackers, (isArmy, index) => {
    moves.push({ actor: isArmy ? 'army' : 'enemy', index });
  });
  return moves;
}

/**
 * One journal **and the per-stack hit counts it was built from** (S-123). The counts fall out of the same
 * walk that writes the entries; `simulateBattle` needs both and used to ask for them separately, which ran
 * the battle a second time to recompute a number it was already holding.
 */
function journalWithHits(
  stacks: Stack[],
  enemyStacks: number,
  armyFirst: boolean,
  order?: readonly number[],
): { journal: BattleJournal; hits: number[] } {
  const attackers = order ?? attackOrder(stacks);
  const moves = battleSequence(stacks.length, enemyStacks, armyFirst, attackers);
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
  return { journal: { entries, rounds: entries.length, friendlyHits, totalDamage }, hits: totalHits };
}

/** One journal: the same numbered entry list TotalStack and the game's report print. */
export function buildJournal(
  stacks: Stack[],
  enemyStacks: number,
  armyFirst: boolean,
  order?: readonly number[],
): BattleJournal {
  return journalWithHits(stacks, enemyStacks, armyFirst, order).journal;
}

/**
 * **What one orientation of the battle deals, with nothing written down** (S-123): the journal's
 * `totalDamage` and no entry list, no hit counters, no allocation at all beyond the walk itself.
 *
 * This is what the priority search actually needs from a candidate it is about to compare and throw away —
 * two of these and a recovery bill answer every objective. `buildJournal` allocates roughly two entry
 * objects a stack, twice an orientation, and on a large army the search asks for thousands of candidates
 * against a wall-clock budget: the garbage was the cost, not the arithmetic.
 */
function journalDamage(
  stacks: Stack[],
  enemyStacks: number,
  armyFirst: boolean,
  attackers: readonly number[],
): number {
  let total = 0;
  walkBattle(stacks.length, enemyStacks, armyFirst, attackers, (isArmy, index) => {
    if (isArmy) total += stacks[index]?.damagePerHit ?? 0;
  });
  return total;
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

/**
 * **The seven figures an objective is scored on, and nothing a reader would want** (S-123, 2026-09-22).
 *
 * The same arithmetic `simulateBattle` does below — deliberately the same lines, in the same order, on the
 * same two journal totals — with the entry lists, the hit counters, the pool split and the model notes left
 * unbuilt. `objectiveScore` reads exactly this shape, so the priority search can score a candidate without
 * writing down a battle report it is about to discard, and the two functions cannot answer differently
 * because `scoreOf` is the only place either of them computes a number.
 *
 * The attack order is sorted **once** here and handed to both orientations; it does not depend on which
 * side opens.
 */
export function battleScore(result: StackResult, request: StackRequest): BattleScore {
  const stacks = result.stacks;
  const enemyStacks = enemySquadCount(request.enemy);
  const order = attackOrder(stacks);
  return scoreOf(
    journalDamage(stacks, enemyStacks, false, order),
    journalDamage(stacks, enemyStacks, true, order),
    stacks,
    request,
  );
}

/**
 * The scored half of a battle, from the two journal totals. One definition, two callers (S-123).
 *
 * The rounding is load-bearing and is left exactly as it was: `maxDamage` is the rounded army-first total,
 * while the **average** is taken over the *unrounded* one, and the three ratios divide the **displayed**
 * (rounded) average the way TotalStack's own summary does.
 */
function scoreOf(minimum: number, maximum: number, stacks: Stack[], request: StackRequest): BattleScore {
  const average = Math.round((minimum + maximum) / 2);
  const recovery = recoveryCosts(stacks, request.units, request.recovery).plan;
  const per = (cost: number): number => (cost > 0 ? average / cost : 0);
  return {
    minDamage: minimum,
    maxDamage: Math.round(maximum),
    avgDamage: average,
    recovery,
    damagePerSilver: per(recovery.silver),
    damagePerGold: per(recovery.gold),
    damagePerDragonCoin: per(recovery.dragonCoins),
  };
}

export function simulateBattle(result: StackResult, request: StackRequest): BattleSummary {
  const stacks = result.stacks;
  const enemyStacks = enemySquadCount(request.enemy);
  // One sort of the attack order, and one walk of the battle an orientation: both journals carry the hit
  // counters the pool split is read from, which is what `hitsPerStack` used to run the battle again for.
  const order = attackOrder(stacks);
  const first = journalWithHits(stacks, enemyStacks, false, order);
  const second = journalWithHits(stacks, enemyStacks, true, order);
  const enemyFirst = first.journal;
  const armyFirst = second.journal;

  const enemyFirstHits = first.hits;
  const armyFirstHits = second.hits;
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
  for (const pool of Object.keys(damageByPool) as Pool[]) {
    damageByPool[pool] = Math.round(damageByPool[pool]);
  }

  return {
    ...scoreOf(enemyFirst.totalDamage, armyFirst.totalDamage, stacks, request),
    stackCount: stacks.length,
    damageByPool,
    journals: { enemyFirst, armyFirst },
    modelNotes: [...MODEL_NOTES],
  };
}
