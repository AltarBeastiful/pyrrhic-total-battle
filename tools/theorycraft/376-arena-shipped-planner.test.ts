/**
 * 376 — the shipped Prime Arena planner (B-46), measured before shipping: with the generator that gives assumed
 * enemies the player's own bonuses, does the all-round plan still beat the default fill on enemies it never
 * searched against, for both roles, against the reported defender too, and within the time cap at every level?
 * Our bonuses and the reported defender's are those of 371.
 * Run: ARENA_376=1 pnpm vitest run tools/theorycraft/376
 */
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { unitById } from '../../src/data';
import { primeArenaMatch } from '../../src/engine/primeArena';
import type { PrimeArenaArmy, PrimeArenaStack } from '../../src/engine/primeArena';
import { assumedEnemies } from '../../src/engine/primeArenaEnemies';
import { primeArenaPool } from '../../src/engine/primeArenaInputs';
import { planPrimeArena, scorePrimeArenaSet } from '../../src/engine/primeArenaPlanner';
import type { PrimeArenaRole } from '../../src/engine/primeArenaPlanner';
import { troopsAt } from '../../tests/helpers/primeArenaPlanner';
import { totalsFrom } from '../../tests/helpers/request';

const OURS = totalsFrom({
  strength: {
    army: 299,
    guardsmen: 290,
    specialist: 1.5,
    monster: 255.5,
    melee: 241,
    ranged: 78,
    mounted: 341,
    flying: 49,
    beast: 4,
  },
  health: { melee: 297.5, guardsmen: 130.9, ranged: 181.6, mounted: 332.6, flying: 258.1, monster: 108.9 },
  special: { guardsmenDoubleDamageChance: 1.9 },
});
const FOE = totalsFrom({
  strength: {
    guardsmen: 179.2,
    monster: 5,
    melee: 433.5,
    ranged: 432.5,
    mounted: 543,
    flying: 430.5,
    beast: 1.5,
  },
  health: { melee: 315.5, guardsmen: 162.7, ranged: 315.5, mounted: 386, flying: 310.2, monster: -5.1 },
});
const HOUSING = { leadership: 52_748, authority: 0, dominance: 13_011 };

const IDS: Record<string, string> = {
  SP2: 'spearman-2',
  SP3: 'spearman-3',
  SP4: 'spearman-4',
  SW2: 'swordsman-2',
  SW3: 'swordsman-3',
  SW4: 'swordsman-4',
  ARC4: 'archer-4',
  RD4: 'rider-4',
  MD: 'magic-dragon',
  MAG: 'many-armed-guardian',
  IP: 'ice-phoenix',
  GM: 'gorgon-medusa',
};
const squad = (spec: string): PrimeArenaStack[] =>
  spec.split(', ').map((part) => {
    const [label, count] = part.split(' ');
    return { unit: unitById(IDS[label!]!)!, count: Number(count) };
  });
const REPORTED: PrimeArenaArmy = {
  stacks: squad('ARC4 12586, SP4 12586, SW4 12586, RD4 7995, MD 233, MAG 276, IP 202, GM 304'),
  totals: FOE,
};
const OLD_PLAN = squad('SP2 13187, SW2 17308, SP3 7419, SW3 8241, SW4 6593, MAG 888, IP 108, GM 162');

const pct = (value: number): string => (value * 100).toFixed(0);
const text = (stacks: readonly PrimeArenaStack[]): string =>
  stacks.map((s) => `${s.unit.label} ${String(s.count)}`).join(', ');

describe.skipIf(!process.env.ARENA_376)('376 the shipped planner', () => {
  it('measures', () => {
    const out: string[] = [
      '600 assumed enemies unseen by the search (seed 987654). lead = our surviving share minus theirs, per round, in points.',
    ];
    const held = assumedEnemies({ level: 4, housing: HOUSING, totals: OURS, seed: 987_654, count: 600 });
    out.push(
      '\n| role | squad | wins | mean lead | bad-case lead | vs the reported defender: wins (lead) | time | stacks |',
    );
    out.push('|---|---|---|---|---|---|---|---|');
    const row = (role: PrimeArenaRole, name: string, stacks: readonly PrimeArenaStack[], time = ''): void => {
      const s = scorePrimeArenaSet(stacks, OURS, role, held);
      const real = scorePrimeArenaSet(stacks, OURS, role, [REPORTED]);
      out.push(
        `| ${role} | ${name} | ${pct(s.wins)} % | ${pct(s.lead)} | ${pct(s.badLead)} | ${real.wins} (${pct(real.lead)}) | ${time} | ${text(stacks)} |`,
      );
    };
    const pool = primeArenaPool(troopsAt(4));
    for (const role of ['attacker', 'defender'] as const) {
      const started = Date.now();
      const plan = planPrimeArena({ pool, level: 4, housing: HOUSING, totals: OURS, role });
      const time = `${((Date.now() - started) / 1000).toFixed(1)} s, ${String(plan.evaluations)} squads`;
      row(role, 'default fill', plan.start.stacks);
      row(role, 'all-round plan', plan.stacks, time);
      row(role, "the old planner's squad of 11-27", OLD_PLAN);
      row(
        role,
        "375's best squad (48 enemies)",
        squad('RD4 10374, SP4 15936, SW3 7590, SW4 8471, GM 161, MAG 1036'),
      );
      const wide = Date.now();
      const longer = planPrimeArena({ pool, level: 4, housing: HOUSING, totals: OURS, role, restarts: 24 });
      row(
        role,
        'all-round plan, 24 restarts instead of 4',
        longer.stacks,
        `${((Date.now() - wide) / 1000).toFixed(1)} s`,
      );
      const counter = planPrimeArena({
        pool,
        level: 4,
        housing: HOUSING,
        totals: OURS,
        role,
        enemy: REPORTED.stacks,
      });
      row(role, 'counter-pick of the defender (our bonuses assumed)', counter.stacks);
    }
    out.push(
      '\nmatch of the all-round plan against the reported defender with its fitted bonuses, rounds as ours/theirs:',
    );
    const plan = planPrimeArena({ pool, level: 4, housing: HOUSING, totals: OURS });
    const m = primeArenaMatch({ stacks: plan.stacks, totals: OURS }, REPORTED);
    out.push(
      `${m.winner}; ${m.rounds.map((r) => `${pct(r.attacker.share)}/${pct(r.defender.share)}`).join(' | ')}`,
    );

    out.push('\n## time to plan at each Guardsmen level (all-round, default budget)');
    for (const level of [2, 3, 4, 5, 6, 7, 8, 9]) {
      const started = Date.now();
      const at = planPrimeArena({
        pool: primeArenaPool(troopsAt(level)),
        level,
        housing: HOUSING,
        totals: OURS,
      });
      out.push(
        `level ${String(level)}: ${((Date.now() - started) / 1000).toFixed(1)} s, ${String(at.evaluations)} squads, wins ${pct(at.setScore.wins)} % (default fill ${pct(at.start.setScore.wins)} %), lead ${pct(at.setScore.lead)} (${pct(at.start.setScore.lead)})`,
      );
    }
    writeFileSync('tools/theorycraft/out/376-arena-shipped-planner.md', `${out.join('\n')}\n`);
  }, 900_000);
});
