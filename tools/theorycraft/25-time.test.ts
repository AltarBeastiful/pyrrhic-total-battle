/**
 * B5 — the clock.
 *
 * Training time is the constraint nobody budgets for. The owner's 8-type march retrains in **7 d 4 h** at
 * 0 % training speed; the in-game army card shows **+47.9 %**, which divides that by 1.479. Either way it is
 * measured in days, and a campaign of thirty marches is measured in months.
 *
 * Every figure here is `recoveryCosts(...).retrain.seconds` / `.revive.seconds` from src/engine/recovery.ts:
 *
 * ```
 * retrain time = Σ troops n × training.seconds / (1 + trainingSpeed[group]/100)
 * revive  time = Σ all   ceil(n/10) × training.seconds / (1 + trainingSpeed[group]/100)
 * ```
 *
 * The "+47.9 %" column is produced by `request.recovery.trainingSpeed = { guardsmen: 47.9, specialist: 47.9 }`,
 * as the in-game card reads it; the export itself carries no training bonuses at all.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/25-time.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import {
  EIGHT,
  MERC_IDS,
  Report,
  duration,
  evaluate,
  loadOwner,
  march,
  n,
  scenarioB,
  unitById,
  withMethod,
  withUnits,
} from './harness';

const TEMPLE = 15;
const SPEED = 47.9;
const SEVEN = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}
function speedSettings(request: StackRequest, percent: number): StackRequest['recovery'] {
  return {
    ...request.recovery,
    templeLevel: TEMPLE,
    trainingSpeed: percent === 0 ? {} : { guardsmen: percent, specialist: percent },
  };
}

describe.skipIf(!process.env.THEORY)('B5 time', () => {
  it('prices the clock', () => {
    const report = new Report('25-time');
    const owner = loadOwner();
    const TWELVE = owner.twelve.units.map((unit) => unit.id);

    report.add('# B5 — the clock');
    report.add('');
    report.add(
      `Two columns everywhere: **0 %** (what the export carries) and **+${SPEED} %** (what the in-game army card ` +
        'shows on this account, passed as `request.recovery.trainingSpeed = { guardsmen: 47.9, specialist: 47.9 }`). ' +
        'The bonus is a plain divisor `1 + 47.9/100 = 1.479`, applied per group, and it never touches silver.',
    );

    // ---- Per-unit seconds -------------------------------------------------------------------------
    report.h('1. Seconds per unit, and what a full leadership costs');
    report.add('');
    report.add(
      'The 4,343 leadership can be filled with any of these; the last column is what filling it *entirely* with ' +
        'that one type would cost in training time. That is the real reason a tier-1 army retrains in hours and a ' +
        'tier-3 army in weeks.',
    );
    report.add('');
    report.add(
      `| unit | group | leadership | training seconds | seconds ÷ 1.479 | units in 4,343 L | full-L time 0 % | full-L time +${SPEED} % | silver for full L |`,
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const id of TWELVE) {
      const unit = unitById(id);
      if (!unit || !unit.training) continue;
      const units = Math.floor(4343 / unit.cost);
      const total = units * unit.training.seconds;
      report.add(
        `| ${unit.label} | ${unit.group ?? '—'} | ${n(unit.cost)} | ${n(unit.training.seconds)} | ${n(unit.training.seconds / 1.479)} | ${n(units)} | ${duration(total)} | ${duration(total / 1.479)} | ${n(units * unit.training.silver)} |`,
      );
    }
    report.add('');
    report.add(
      'Mercenaries appear nowhere in this table: they have no training row, so they add **zero** seconds to a ' +
        "march's recovery. The hired half of a march is free in time as well as in silver — the tenth of it that " +
        'the Temple refuses is simply gone, not queued.',
    );

    // ---- Per design -------------------------------------------------------------------------------
    report.h('2. Training time per march, per design');
    const designs = [
      { key: '7-type msRelaxed (single-march winner)', ids: SEVEN, method: 'msRelaxed' as const },
      { key: "8-type msRelaxed (owner's)", ids: EIGHT, method: 'msRelaxed' as const },
      { key: '8-type elite', ids: EIGHT, method: 'elite' as const },
      { key: '12-type elite', ids: TWELVE, method: 'elite' as const },
      { key: '12-type msRelaxed', ids: TWELVE, method: 'msRelaxed' as const },
    ];

    for (const [scenarioName, base] of [
      ['A (export bonuses)', withTemple(owner.twelve)],
      ['B (bonuses proven in game)', scenarioB(owner.twelve)],
    ] as const) {
      report.add(`### Scenario ${scenarioName}`);
      report.add('');
      report.add(
        `| design | avg damage | retrain 0 % | retrain +${SPEED} % | revive 0 % | revive +${SPEED} % | damage per day (retrain, +${SPEED} %) | marches per 30 days |`,
      );
      report.add('|---|---|---|---|---|---|---|---|');
      for (const design of designs) {
        const request = withMethod(withUnits(base, design.ids), design.method);
        const ev = evaluate(request);
        const slow = recoveryCosts(ev.result.stacks, request.units, speedSettings(request, 0));
        const fast = recoveryCosts(ev.result.stacks, request.units, speedSettings(request, SPEED));
        const days = fast.retrain.seconds / 86400;
        report.add(
          `| ${design.key} | ${n(ev.summary.avgDamage)} | ${duration(slow.retrain.seconds)} | ${duration(fast.retrain.seconds)} | ${duration(slow.revive.seconds)} | ${duration(fast.revive.seconds)} | ${n(Math.round(ev.summary.avgDamage / Math.max(0.001, days)))} | ${(30 / Math.max(0.001, days)).toFixed(1)} |`,
        );
      }
      report.add('');

      // Share per unit type for the two marches that matter.
      for (const design of [designs[0], designs[1]]) {
        if (!design) continue;
        const request = withMethod(withUnits(base, design.ids), design.method);
        const ev = evaluate(request);
        const fast = recoveryCosts(ev.result.stacks, request.units, speedSettings(request, SPEED));
        report.add(`**Share per unit type — ${design.key}**: ${march(ev.result)}`);
        report.add('');
        report.add(
          `| unit | count | seconds each | retrain seconds (+${SPEED} %) | share of the march | revive seconds (the tenth) | silver | share of silver |`,
        );
        report.add('|---|---|---|---|---|---|---|---|');
        for (const stack of ev.result.stacks) {
          const unit = request.units.find((u) => u.id === stack.unitId);
          if (!unit) continue;
          const seconds = unit.training ? (stack.count * unit.training.seconds) / 1.479 : 0;
          const reviveSeconds = unit.training ? (chunks(stack.count) * unit.training.seconds) / 1.479 : 0;
          const silver = unit.training && unit.pool === 'leadership' ? stack.count * unit.training.silver : 0;
          report.add(
            `| ${unit.label} | ${n(stack.count)} | ${unit.training ? n(unit.training.seconds) : '— (hired)'} | ${duration(seconds)} | ${((seconds / Math.max(1, fast.retrain.seconds)) * 100).toFixed(1)} % | ${duration(reviveSeconds)} | ${n(silver)} | ${((silver / Math.max(1, fast.retrain.silver)) * 100).toFixed(1)} % |`,
          );
        }
        report.add('');
      }
    }

    // ---- Revive -----------------------------------------------------------------------------------
    report.h('3. What reviving does to the clock');
    report.add('');
    report.add(
      'The Temple is instant for the 90 % it returns; only `ceil(n/10)` of each stack goes back into the training ' +
        'queue. So the revive column above is the retrain column divided by roughly ten — the same factor as the ' +
        'silver, for the same reason, and it is the single biggest lever on how often this account can march.',
    );
    report.add('');
    report.add(
      '| scenario | design | retrain +47.9 % | revive +47.9 % | ÷ | 30 marches, retrain | 30 marches, revive |',
    );
    report.add('|---|---|---|---|---|---|---|');
    for (const [scenarioName, base] of [
      ['A', withTemple(owner.twelve)],
      ['B', scenarioB(owner.twelve)],
    ] as const) {
      for (const design of [designs[0], designs[1]]) {
        if (!design) continue;
        const request = withMethod(withUnits(base, design.ids), design.method);
        const ev = evaluate(request);
        const fast = recoveryCosts(ev.result.stacks, request.units, speedSettings(request, SPEED));
        report.add(
          `| ${scenarioName} | ${design.key} | ${duration(fast.retrain.seconds)} | ${duration(fast.revive.seconds)} | ${(fast.retrain.seconds / Math.max(1, fast.revive.seconds)).toFixed(1)} | ${duration(fast.retrain.seconds * 30)} | ${duration(fast.revive.seconds * 30)} |`,
        );
      }
    }

    report.h('4. Unsettled: parallel queues or one queue');
    report.add('');
    report.add(
      [
        '**The repo cannot tell you whether the game trains several unit types at the same time or one after the',
        'other, and this must be checked in game before any of the durations above is used as a calendar.**',
        '',
        'What we do know: `recoveryCosts` **sums** the per-type seconds, and that sum reproduces every captured',
        'TotalStack duration exactly — 5 d 23 h, 4 d 11 h, 4 d 1 h and the revive-all 1 d 2 h → 21 h 40 m',
        '(battle-model-observations §4). So the *number TotalStack shows* is the sum, and our engine matches it.',
        '',
        'What that does **not** establish is what the game does with that number. Three possibilities, all',
        'consistent with everything in the repo:',
        '',
        '1. **One queue, one barracks** — the sum is the wall-clock wait, and the tables above are calendars.',
        '2. **One queue per building** — several barracks train in parallel and the wall-clock wait is the largest',
        "   per-building term, not the sum. In the owner's 8-type march RD3 alone is 84 % of the seconds, so under",
        '   this reading a march would be ready in about 4 d rather than 4 d 20 h — a small difference here, a large',
        '   one for a wide 12-type march whose time is spread across many types.',
        '3. **Fully parallel per unit type** — the wait is `max` over types, which for the 12-type march would cut',
        '   3 d 19 h down to the RD3 term alone.',
        '',
        "The distinction matters most for B6: replacing SW1 (15 s a unit) with SP3 (420 s) multiplies the march's",
        'training time by about six *if the times add up*, and barely moves it if the barracks run in parallel.',
        'Until someone starts two different trainings in game and watches the timers, treat every duration in this',
        "file as **TotalStack's number**, which it certainly is, and not as a proven wall-clock wait.",
      ].join('\n'),
    );

    report.h('What B5 says');
    report.add('');
    report.add(
      [
        `- The owner's 8-type march retrains in **7 d 4 h** at 0 % and **4 d 20 h** at +${SPEED} %; the single-march`,
        '  winner (ARC2 + RD2 + RD3) is far worse at **11 d 16 h / 7 d 21 h**, because ARC2 at 180 s and RD3 at 840 s',
        '  replace SW1 at 15 s. Buying more damage per march buys it in days.',
        '- **Time and silver are nearly the same constraint here**, but not exactly: tier-1 types are cheap in both,',
        '  ARC2 is cheap in silver and dear in time, RD3 is dear in both. The 12-type marches are the fastest',
        '  (3 d 19 h) because they spread the leadership over many cheap tier-1 stacks.',
        '- **Reviving divides the clock by ten**, the same way it divides the silver. On this account that is the',
        '  difference between one march every five days and one march every twelve hours.',
        '- **Whether the queues are parallel is unsettled and must be checked in game** (section 4).',
      ].join('\n'),
    );

    report.save();
  }, 600_000);
});
