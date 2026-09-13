/**
 * A1 — lost hits and the opening attack (investigation 0015).
 *
 * The closed form `expectedHits(p, N, armyFirst)` assumes the kill order (total HP descending) and the
 * attack order (base damage descending) coincide. When they do not, a stack can be wiped before its turn
 * and simply lose that round's attack. This file measures, for every march the sizer produces on the
 * account's four bases, how many hits are lost that way, where the army-first opening attack really lands,
 * and how much a small integer change to the counts buys back.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/10-lost-hits.test.ts`
 */
import { describe, it } from 'vitest';

import { attackOrder, enemySquadCount, expectedHits } from '../../src/engine/battle';
import type { StackRequest } from '../../src/engine/types';
import {
  Report,
  countsOf,
  evaluate,
  evaluateCounts,
  feasible,
  label,
  lines,
  loadOwner,
  march,
  n,
  scenarioB,
  withMethod,
  withUnits,
  type Evaluation,
} from './harness';

const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'];
/** The four bases every experiment of this pass runs on. */
export const BASES: { key: string; label: string; ids: string[] }[] = [
  {
    key: 'E8',
    label: "owner's 8 types (SW1 SP2 RD2 RD3 + mercs)",
    ids: ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3', ...MERCS],
  },
  {
    key: 'K7',
    label: 'priority winner, 7 types (ARC2 RD2 RD3 + mercs)',
    ids: ['archer-2', 'rider-2', 'rider-3', ...MERCS],
  },
  {
    key: 'K8',
    label: 'winner + SP2, 8 types (ARC2 SP2 RD2 RD3 + mercs)',
    ids: ['archer-2', 'spearman-2', 'rider-2', 'rider-3', ...MERCS],
  },
  {
    key: 'T12',
    label: 'all 12 types',
    ids: [
      'swordsman-1',
      'archer-1',
      'spearman-1',
      'rider-1',
      'archer-2',
      'spearman-2',
      'rider-2',
      'rider-3',
      ...MERCS,
    ],
  },
];

const METHODS = ['elite', 'ms', 'msRelaxed'] as const;

/** Per-stack comparison of the simulated hits with the closed form. */
function hitAudit(
  evaluation: Evaluation,
  request: StackRequest,
): {
  rows: string[];
  lost: { position: number; label: string; expected: number; got: number; damage: number }[];
  lostDamage: number;
} {
  const N = enemySquadCount(request.enemy);
  const rows = [
    '| # | stack | base damage | attack rank | hits E (sim/form) | hits A (sim/form) | lost E | per hit |',
    '|---|---|---|---|---|---|---|---|',
  ];
  const order = attackOrder(evaluation.result.stacks);
  const rankOf = new Map(order.map((stackIndex, rank) => [stackIndex, rank + 1]));
  const lost: { position: number; label: string; expected: number; got: number; damage: number }[] = [];
  let lostDamage = 0;
  lines(evaluation).forEach((row, index) => {
    const formE = expectedHits(row.position, N, false);
    const formA = expectedHits(row.position, N, true);
    const missing = formE - row.hitsEnemyFirst;
    if (missing > 0) {
      lost.push({
        position: row.position,
        label: row.label,
        expected: formE,
        got: row.hitsEnemyFirst,
        damage: missing * row.damagePerHit,
      });
      lostDamage += missing * row.damagePerHit;
    }
    rows.push(
      `| ${row.position} | ${row.label} | ${n(row.baseDamage)} | ${rankOf.get(index) ?? '?'} | ${row.hitsEnemyFirst}/${formE} | ${row.hitsArmyFirst}/${formA} | ${missing > 0 ? `**${missing} × ${n(row.damagePerHit)}**` : '—'} | ${n(row.damagePerHit)} |`,
    );
  });
  return { rows, lost, lostDamage };
}

/** Where the "your army first" opening attack lands, and what it is worth. */
function openingNote(evaluation: Evaluation): string {
  const stacks = evaluation.result.stacks;
  const first = attackOrder(stacks)[0] ?? 0;
  const opener = stacks[first];
  const gain = evaluation.summary.maxDamage - evaluation.summary.minDamage;
  const victim = stacks[0];
  const who = lines(evaluation).find((row) => row.hitsArmyFirst > row.hitsEnemyFirst);
  return [
    `opening attack goes to **${label(opener?.unitId ?? '')}** (top base damage ${n(Math.round((opener?.count ?? 0) * (opener?.strengthPerUnit ?? 0)))}), kill position ${first + 1}`,
    first === 0
      ? 'it **is** the first victim'
      : `the first victim is ${label(victim?.unitId ?? '')} (position 1)`,
    `army-first gain max − min = ${n(gain)}${who ? ` — the extra hit lands on ${who.label} (position ${who.position})` : ' — no stack gains a hit'}`,
  ].join('; ');
}

/**
 * Small integer changes to a count vector: take `m` units off one type and put the freed housing on another
 * (converted by cost — the two types may sit in different pools, in which case it is simply a drop plus an
 * addition), spend leftover housing on one type, or leave units out. Best-improvement hill climb on
 * avgDamage; every candidate is checked with `feasible` and scored with `evaluateCounts`.
 */
function improve(
  request: StackRequest,
  start: Record<string, number>,
  span = 60,
): {
  counts: Record<string, number>;
  steps: string[];
  gain: number;
} {
  const ids = request.units.map((unit) => unit.id);
  const cost = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  let counts = { ...start };
  let best = evaluateCounts(request, counts).summary.avgDamage;
  const base = best;
  const steps: string[] = [];
  for (let round = 0; round < 10; round += 1) {
    let bestCounts: Record<string, number> | undefined;
    let bestStep = '';
    for (const from of ids) {
      for (const to of ids) {
        if (from === to) continue;
        const costFrom = cost.get(from) ?? 1;
        const costTo = cost.get(to) ?? 1;
        for (let m = 1; m <= span; m += 1) {
          if ((counts[from] ?? 0) - m < 0) break;
          const moved = Math.floor((m * costFrom) / costTo);
          if (moved <= 0) continue;
          const candidate = { ...counts, [from]: (counts[from] ?? 0) - m, [to]: (counts[to] ?? 0) + moved };
          if (!feasible(request, candidate)) continue;
          const avg = evaluateCounts(request, candidate).summary.avgDamage;
          if (avg > best + 0.5) {
            best = avg;
            bestCounts = candidate;
            bestStep = `${label(from)} −${m} → ${label(to)} +${moved}`;
          }
        }
      }
    }
    for (const to of ids) {
      for (let k = 1; k <= span; k += 1) {
        const candidate = { ...counts, [to]: (counts[to] ?? 0) + k };
        if (!feasible(request, candidate)) break;
        const avg = evaluateCounts(request, candidate).summary.avgDamage;
        if (avg > best + 0.5) {
          best = avg;
          bestCounts = candidate;
          bestStep = `${label(to)} +${k} (spare housing)`;
        }
      }
      for (let k = 1; k <= span; k += 1) {
        if ((counts[to] ?? 0) - k < 0) break;
        const candidate = { ...counts, [to]: (counts[to] ?? 0) - k };
        const avg = evaluateCounts(request, candidate).summary.avgDamage;
        if (avg > best + 0.5) {
          best = avg;
          bestCounts = candidate;
          bestStep = `${label(to)} −${k} (left out)`;
        }
      }
    }
    if (!bestCounts) break;
    counts = bestCounts;
    steps.push(`${bestStep} → avg ${n(best)}`);
  }
  return { counts, steps, gain: best - base };
}

describe.skipIf(!process.env.THEORY)('A1 lost hits', () => {
  it('audits every march against the closed form', () => {
    const report = new Report('10-lost-hits');
    const owner = loadOwner();
    report.add('# A1 — lost hits and the opening attack');
    report.add('');
    report.add(
      "Method: for every base × method × bonus scenario the sizer produces a march (`evaluate`); each stack's " +
        'simulated hits (from the engine journals, `lines`) are compared with `expectedHits(position, 4, armyFirst)`. ' +
        'A **lost hit** is a stack the enemy wipes before its turn because its base-damage rank is worse than its HP rank. ' +
        'Then a best-improvement hill climb over small integer count changes (take m units off one type and put the ' +
        'freed housing on another — the two may sit in different pools —, spend spare housing, or leave units out; ' +
        'every step checked with `feasible`, scored with `evaluateCounts`) measures ' +
        "what buying the hits back is worth. Enemy: 4 squads (melee/ranged/mounted/flying, the export's own). " +
        'Housing: leadership 4,343, authority 2,000; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37.',
    );

    const summary: string[] = [
      '| scenario | base | method | stacks | avg damage | lost hits | damage lost | army-first gain | best small change | gain |',
      '|---|---|---|---|---|---|---|---|---|---|',
    ];

    for (const [scenario, make] of [
      ['A', (request: StackRequest) => request],
      ['B', scenarioB],
    ] as const) {
      for (const base of BASES) {
        for (const method of METHODS) {
          const request = make(withMethod(withUnits(owner.twelve, base.ids), method));
          const evaluation = evaluate(request);
          const audit = hitAudit(evaluation, request);
          report.h(`${scenario} · ${base.key} ${base.label} · ${method}`);
          report.add(march(evaluation.result));
          report.add('');
          report.add(audit.rows.join('\n'));
          report.add('');
          report.add(
            `min ${n(evaluation.summary.minDamage)} · avg ${n(evaluation.summary.avgDamage)} · max ${n(evaluation.summary.maxDamage)} · ` +
              `pools L ${n(evaluation.result.pools.leadership.used)}/${n(evaluation.result.pools.leadership.capacity)} ` +
              `A ${n(evaluation.result.pools.authority.used)}/${n(evaluation.result.pools.authority.capacity)}`,
          );
          report.add('');
          report.add(openingNote(evaluation));
          report.add('');
          if (audit.lost.length === 0)
            report.add('No lost hit: every stack strikes as often as the closed form says.');
          else
            report.add(
              `Lost: ${audit.lost.map((entry) => `${entry.label} (position ${entry.position}, ${entry.got} of ${entry.expected}, −${n(entry.damage)})`).join('; ')} — **${n(audit.lostDamage)}** off the enemy-first total.`,
            );

          const climbed = improve(request, countsOf(evaluation.result));
          const after = evaluateCounts(request, climbed.counts);
          const afterAudit = hitAudit(after, request);
          report.add('');
          if (climbed.steps.length === 0)
            report.add(
              "Small count changes: none improves the average (the sizer's vector is a local optimum for this move set).",
            );
          else {
            report.add(`Small count changes: ${climbed.steps.join(' · ')}`);
            report.add('');
            report.add(`→ ${march(after.result)}`);
            report.add(
              `→ avg ${n(after.summary.avgDamage)} (**+${n(climbed.gain)}**, +${((climbed.gain / evaluation.summary.avgDamage) * 100).toFixed(2)} %); lost hits now ${afterAudit.lost.length === 0 ? 'none' : afterAudit.lost.map((entry) => `${entry.label} −${n(entry.damage)}`).join(', ')}`,
            );
          }
          const lastTroop = after.result.stacks.filter((stack) => stack.pool === 'leadership').at(-1);
          const above = after.result.stacks.filter(
            (stack) => stack.pool === 'authority' && stack.totalHp >= (lastTroop?.totalHp ?? 0),
          );
          if (climbed.steps.length > 0)
            report.add(
              `→ hired units still fall after every troop stack: ${above.length === 0 ? 'yes' : `no — ${above.map((stack) => label(stack.unitId)).join(', ')} now fall(s) before ${label(lastTroop?.unitId ?? '')}`}`,
            );
          summary.push(
            `| ${scenario} | ${base.key} | ${method} | ${evaluation.result.stacks.length} | ${n(evaluation.summary.avgDamage)} | ${audit.lost.length} | ${n(audit.lostDamage)} | ${n(evaluation.summary.maxDamage - evaluation.summary.minDamage)} | ${climbed.steps.length === 0 ? '—' : climbed.steps.map((step) => step.split(' → avg ')[0]).join(', ')} | ${climbed.gain > 0 ? `+${n(climbed.gain)}` : '—'} |`,
          );
        }
      }
    }

    report.h('Summary');
    report.add(summary.join('\n'));
    report.h('One correction to the "army first" rule');
    report.add(
      'The short rule "striking first is worth a hit only if the top base-damage stack is also the first ' +
        'victim" is **not quite right**, and this pass has a counter-example. What "your army first" really ' +
        'does is insert **one extra army action** before the first enemy attack; that action is taken by the ' +
        'top base-damage stack, and it shifts every later in-between attack of round 1 one slot down the ' +
        'attack order. The extra action turns into an extra hit whenever the shift lets one more stack strike ' +
        'before it is wiped — which is normally the first victim, but not always.\n\n' +
        'Counter-example, scenario B over all 12 types (`ms` and `msRelaxed`): the opening attack goes to ' +
        'ARC1 at kill position 2, **not** to the first victim SW1 — and yet max − min = 115,808, the extra hit ' +
        'landing on **RD1 at position 4**. Enemy-first, round 1 runs ARC1, SP1, ARC2 in the three in-between ' +
        'slots and RD1 is wiped by the fourth enemy attack before its turn; army-first, ARC1 takes the opening ' +
        'slot, the three in-between slots become SP1, ARC2, RD1, and RD1 gets its strike in. SW1 stays at 0 ' +
        'hits in both. In the other 22 marches of this pass the opener is the first victim (and gains a full ' +
        'hit) or the gain is 0.',
    );
    report.save();
  }, 1_800_000);
});
