/**
 * 52 — what a mercenary hit actually costs (owner's question, 2026-09-14): "how can doubling the hits for
 * the mercenaries give only 4 % when they are the most effective damage here?"
 *
 * The hit staircase is `hits(p) = ceil(p/N) − [p ≡ 1 mod N]` with N enemy squads, so hits come in tiers:
 * one strike for the first rungs, two from a fixed position on. To put the mercenaries on a two-strike rung
 * every troop rung above them must out-HP the *biggest* mercenary stack (the enemy kills by HP descending),
 * and the mercenary stacks must fit under the lowest rung — so rung HP and mercenary HP compete for the same
 * leadership. This file walks that frontier: for a ladder of T rungs, find the largest floor the leadership
 * allows, size every mercenary stack just under it, and report what each side of the trade actually deals.
 *
 * Scenario C, 4,343 leadership, the account's stock caps. `THEORY=1 pnpm vitest run
 * tools/theorycraft/52-merc-hit-frontier.test.ts`.
 */
import { describe, it } from 'vitest';

import type { Category, StackRequest } from '../../src/engine/types';
import {
  Report,
  evaluateCounts,
  feasible,
  label,
  lines,
  loadOwner,
  n,
  scenarioC,
  withEnemy,
} from './harness';

const RUNGS = ['rider-3', 'archer-2', 'rider-2', 'spearman-2', 'archer-1', 'spearman-1', 'rider-1'];
const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'chariot-6', 'legionary-6'];
const CAPS: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
/** Rungs must be ordered in both HP (kill order) and base damage (attack order): 0.4 % a step. */
const STEP = 1.004;
const FORMATIONS: Record<string, Record<Category, number>> = {
  'N=3': { melee: 1, ranged: 1, mounted: 1, flying: 0 },
  'N=4': { melee: 1, ranged: 1, mounted: 1, flying: 1 },
  'N=8': { melee: 2, ranged: 2, mounted: 2, flying: 2 },
};

interface Probe {
  hp: number;
  str: number;
  cost: number;
}

describe.skipIf(!process.env.THEORY)('merc hit frontier', () => {
  it('prices the second strike of each mercenary stack', () => {
    const report = new Report('52-merc-hit-frontier');
    const owner = loadOwner();
    const req0 = scenarioC(owner.twelve);
    const lead = req0.housing.leadership;
    const probe = (id: string): Probe => {
      const ev = evaluateCounts(req0, { [id]: 1 });
      const stack = ev.result.stacks[0];
      const unit = req0.units.find((u) => u.id === id);
      return { hp: stack?.hpPerUnit ?? 0, str: stack?.strengthPerUnit ?? 0, cost: unit?.cost ?? 0 };
    };
    const P: Record<string, Probe> = {};
    for (const id of [...RUNGS, ...MERCS]) P[id] = probe(id);
    report.add(
      `Scenario C · leadership ${n(lead)} · rung HP per unit: ${RUNGS.map((id) => `${label(id)} ${n(P[id]?.hp ?? 0)}`).join(' · ')} · ` +
        `merc HP per unit: ${MERCS.map((id) => `${label(id)} ${n(P[id]?.hp ?? 0)}`).join(' · ')}`,
    );

    /** The counts of a T-rung ladder whose lowest rung is `floor` HP, with the mercenaries just under it. */
    const build = (T: number, floor: number): Record<string, number> => {
      const counts: Record<string, number> = {};
      for (let i = 0; i < T; i += 1) {
        const id = RUNGS[i] as string;
        const p = P[id] as Probe;
        const hp = floor * STEP ** (T - 1 - i);
        counts[id] = Math.max(1, Math.floor(hp / p.hp));
      }
      for (const id of MERCS) {
        const p = P[id] as Probe;
        const cap = CAPS[id] ?? 0;
        const fit = Math.floor((floor * 0.995) / p.hp);
        if (cap > 0 && fit > 0) counts[id] = Math.min(cap, fit);
      }
      return counts;
    };
    const leadershipUsed = (counts: Record<string, number>): number =>
      Object.entries(counts).reduce((sum, [id, count]) => sum + count * (P[id]?.cost ?? 0), 0);
    /** Largest floor the leadership allows for this many rungs. */
    const maxFloor = (T: number): number => {
      let lo = 1;
      let hi = 40_000_000;
      for (let i = 0; i < 60; i += 1) {
        const mid = (lo + hi) / 2;
        if (leadershipUsed(build(T, mid)) <= lead) lo = mid;
        else hi = mid;
      }
      return lo;
    };

    const rows: string[] = [
      '| enemy | rungs | floor HP | mercenary counts (EMH6 · ABT6 · CHR6 · LGN6) | strikes each | merc damage | rung damage | total | silver | damage / silver |',
      '|---|---|---|---|---|---|---|---|---|---|',
    ];
    const detail: string[] = [];
    /** The lowest floor that still shelters the mercenaries at their full stock. */
    const capsFloor = Math.max(...MERCS.map((id) => (CAPS[id] ?? 0) * (P[id]?.hp ?? 0))) * 1.01;
    for (const [enemyName, enemy] of Object.entries(FORMATIONS)) {
      const req: StackRequest = withEnemy(req0, enemy);
      for (const T of [1, 2, 3, 4, 5, 6]) {
        const floor = maxFloor(T);
        const counts = build(T, floor);
        if (leadershipUsed(build(T, capsFloor)) <= lead && T > 0) {
          // Also measure the same depth with the mercenaries kept at their full stock.
          const cheap = build(T, capsFloor);
          const evCheap = evaluateCounts(req, cheap);
          const lsCheap = lines(evCheap);
          const hitAvgCheap = (row: (typeof lsCheap)[number]): number =>
            (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
          const mercCheap = lsCheap
            .filter((row) => MERCS.includes(row.unitId))
            .reduce((sum, row) => sum + hitAvgCheap(row) * row.damagePerHit, 0);
          const rungCheap = lsCheap
            .filter((row) => !MERCS.includes(row.unitId))
            .reduce((sum, row) => sum + hitAvgCheap(row) * row.damagePerHit, 0);
          rows.push(
            `| ${enemyName} | ${T} | ${n(capsFloor)} (stock caps) | ${MERCS.map((id) => n(cheap[id] ?? 0)).join(' · ')} | ` +
              `${lsCheap
                .filter((row) => MERCS.includes(row.unitId))
                .map((row) => `${label(row.unitId)} ${hitAvgCheap(row)}`)
                .join(', ')} | ` +
              `${n(Math.round(mercCheap))} | ${n(Math.round(rungCheap))} | **${n(Math.round(mercCheap + rungCheap))}** | ` +
              `${n(evCheap.summary.recovery.silver)} | ${((mercCheap + rungCheap) / Math.max(1, evCheap.summary.recovery.silver)).toFixed(2)} |`,
          );
        } else {
          rows.push(
            `| ${enemyName} | ${T} | ${n(capsFloor)} (stock caps) | — | — | — | — | — | — | **infeasible: needs more than ${n(lead)} leadership** |`,
          );
        }
        if (!feasible(req, counts)) {
          rows.push(`| ${enemyName} | ${T} | ${n(floor)} | — | — | — | — | — | — | infeasible |`);
          continue;
        }
        const ev = evaluateCounts(req, counts);
        const ls = lines(ev);
        const mercLines = ls.filter((row) => MERCS.includes(row.unitId));
        const rungLines = ls.filter((row) => !MERCS.includes(row.unitId));
        const hitAvg = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
        const mercDamage = mercLines.reduce((sum, row) => sum + hitAvg(row) * row.damagePerHit, 0);
        const rungDamage = rungLines.reduce((sum, row) => sum + hitAvg(row) * row.damagePerHit, 0);
        const silver = ev.summary.recovery.silver;
        const total = mercDamage + rungDamage;
        rows.push(
          `| ${enemyName} | ${T} | ${n(floor)} | ${MERCS.map((id) => n(counts[id] ?? 0)).join(' · ')} | ` +
            `${mercLines.map((row) => `${label(row.unitId)} ${hitAvg(row)}`).join(', ')} | ${n(Math.round(mercDamage))} | ` +
            `${n(Math.round(rungDamage))} | **${n(Math.round(total))}** | ${n(silver)} | ${(total / Math.max(1, silver)).toFixed(2)} |`,
        );
        detail.push(
          `\n**${enemyName} · ${T} rungs · floor ${n(floor)}**\n` +
            ls
              .map(
                (row) =>
                  `${row.position}. ${label(row.unitId)} ${n(row.count)} — ${n(row.totalHp)} HP, ${n(row.damagePerHit)} a hit, ` +
                  `${row.hitsEnemyFirst}/${row.hitsArmyFirst} strikes (avg ${hitAvg(row)})`,
              )
              .join(' · '),
        );
      }
    }
    report.h('The frontier: what each extra rung buys, and what the mercenaries have to give up');
    report.add(rows.join('\n'));

    // The three shapes the report compares, split into mercenary damage and rung damage by the engine.
    report.h('The three headline shapes, split');
    const EXPLICIT: Record<string, Record<string, number>> = {
      'RD3 582 · EMH6 92 (no layering)': { 'rider-3': 582, 'epic-monster-hunter-6': 92 },
      'RD3 582 · EMH6 92 · the full stock': {
        'rider-3': 582,
        'epic-monster-hunter-6': 92,
        'arbalester-6': 76,
        'legionary-6': 72,
        'chariot-6': 37,
      },
      "§3's optimum (4 rungs, interleaved)": {
        'rider-3': 582,
        'epic-monster-hunter-6': 92,
        'archer-2': 1519,
        'rider-2': 761,
        'legionary-6': 72,
        'chariot-6': 36,
        'arbalester-6': 71,
        'spearman-2': 138,
      },
    };
    report.add(
      '| shape | mercenary damage | rung damage | total | silver | damage / silver |\n|---|---|---|---|---|---|',
    );
    const req4 = withEnemy(req0, FORMATIONS['N=4'] as Record<Category, number>);
    for (const [name, counts] of Object.entries(EXPLICIT)) {
      const ev = evaluateCounts(req4, counts);
      const ls = lines(ev);
      const hit = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
      const merc = ls
        .filter((row) => MERCS.includes(row.unitId))
        .reduce((sum, row) => sum + hit(row) * row.damagePerHit, 0);
      const rung = ls
        .filter((row) => !MERCS.includes(row.unitId))
        .reduce((sum, row) => sum + hit(row) * row.damagePerHit, 0);
      const silver = ev.summary.recovery.silver;
      report.add(
        `| ${name} | ${n(Math.round(merc))} | ${n(Math.round(rung))} | **${n(Math.round(merc + rung))}** | ${n(silver)} | ${((merc + rung) / Math.max(1, silver)).toFixed(2)} |`,
      );
    }
    report.add(detail.join('\n'));
    report.save();
  });
});
