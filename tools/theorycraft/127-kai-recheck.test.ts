/**
 * 127 — **the two sizers re-checked against Kai's calculator** (owner, 2026-09-21: *"check if theres been a
 * regression with tier ladder and troop first and check them against kaiscalculator again"*).
 *
 * The benchmark's 4 000-leadership case is the one army in this repo that a **third** calculator answered:
 * Kai's extract of 2026-09-15 (`docs/research/fixtures/kai-extract-2026-09-15-4000.json`, 11 stacks). That
 * table plays every row four times, which is the campaign question; this one asks the sizer question, which
 * is the **single march**, so that a difference between our two sizers and Kai's answer is a difference of
 * sizing and not of how a stock drains over a horizon.
 *
 * Three things are measured, all on the same request — the captured query's units, caps, housing, bonuses,
 * enemy and temple, exactly as `plan-scenarios.fourThousand()` builds it:
 *
 *  - **A — is Kai's march legal here?** Its counts are read against `feasible`, pool by pool, because a rival
 *    that outspends the account is not a rival at all. (Experiment 75's *"over leadership"* line is about a
 *    **different** Kai march — the 2026-09-14 battle-report transcription, 4 107 of 4 000 leadership — not
 *    the 2026-09-15 extract the benchmark carries; this re-derives the spend rather than quoting it.)
 *  - **B — the head-to-head**, one march each: Tier ladder (`elite`), Troops first (`ms`), Troops first with
 *    damage trades (`msRelaxed`) and Kai's counts, on the worst opening (S-94), the expected opening, silver,
 *    queue and the stock each one burns.
 *  - **C — where the difference comes from**: the kill order each march is fought in, stack by stack, with
 *    the HP each one carries and the hits it lands. Two marches on the same army differ only in which stack
 *    dies when, so the ladder of total HP is the whole explanation.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/127-kai-recheck.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { commonScenarios } from '../../tests/engine/plan-scenarios';
import { Report, countsOf, duration, evaluate, evaluateCounts, feasible, label, n } from './harness';

const KAI_FIXTURE = new URL('../../docs/research/fixtures/kai-extract-2026-09-15-4000.json', import.meta.url);

/** Kai's extract, mapped to our ids the way `plan-scenarios.ts` maps it, so both read the same march. */
const KAI_NAMES: Record<string, string> = {
  'Spearman I': 'spearman-1',
  'Rider I': 'rider-1',
  'Archer I': 'archer-1',
  'Spearman II': 'spearman-2',
  'Rider II': 'rider-2',
  'Archer II': 'archer-2',
  'Rider III': 'rider-3',
  Legionary: 'legionary-6',
  Arbalester: 'arbalester-6',
  'Epic Monster Hunter VI': 'epic-monster-hunter-6',
  Chariot: 'chariot-6',
};

function kaiCounts(): Record<string, number> {
  const raw = JSON.parse(readFileSync(KAI_FIXTURE, 'utf8')) as {
    payload: { army: { name: string; count: number }[] };
  };
  const counts: Record<string, number> = {};
  for (const stack of raw.payload.army) {
    const id = KAI_NAMES[stack.name];
    if (!id) throw new Error(`unmapped Kai stack ${stack.name}`);
    counts[id] = stack.count;
  }
  return counts;
}

/** The 4 000-leadership scenario, the one the benchmark carries a Kai row on. */
function fourThousand(): { request: StackRequest; label: string } {
  const found = commonScenarios().find((scenario) => scenario.label.includes('4 000-leadership'));
  if (!found) throw new Error('the 4 000-leadership scenario is gone');
  return { request: found.request, label: found.label };
}

function withMethod(request: StackRequest, method: 'elite' | 'ms' | 'msRelaxed'): StackRequest {
  return {
    ...request,
    options: {
      ...request.options,
      method: method === 'msRelaxed' ? 'ms' : method,
      relaxedPreservation: method === 'msRelaxed',
    },
  };
}

/** What a player compares two marches by, all on one march (never a horizon). */
function figures(
  request: StackRequest,
  counts: Record<string, number>,
): {
  min: number;
  expected: number;
  silver: number;
  gold: number;
  seconds: number;
  stacks: number;
  troops: number;
  hired: number;
  leadership: number;
  authority: number;
} {
  const { result, summary } = evaluateCounts(request, counts);
  const costs = recoveryCosts(result.stacks, request.units, request.recovery).plan;
  let troops = 0;
  let hired = 0;
  for (const stack of result.stacks) {
    if (stack.pool === 'leadership') troops += stack.count;
    else hired += stack.count;
  }
  return {
    min: summary.minDamage,
    expected: (summary.minDamage + summary.maxDamage) / 2,
    silver: costs.silver,
    gold: costs.gold,
    seconds: costs.seconds,
    stacks: result.stacks.length,
    troops,
    hired,
    leadership: result.pools.leadership.used,
    authority: result.pools.authority.used,
  };
}

describe.skipIf(!process.env.THEORY)('the sizers against Kai’s calculator, re-checked', () => {
  it('A — is Kai’s march legal on this army?', () => {
    const report = new Report('127-kai-recheck');
    const { request, label: name } = fourThousand();
    const kai = kaiCounts();
    report.add(`# 127 — Tier ladder and Troops first against Kai’s calculator, re-checked\n`);
    report.add(`The army: **${name}**.\n`);
    report.h('A — Kai’s march against the housing it was asked for');
    const used = { leadership: 0, authority: 0, dominance: 0 };
    const rows: string[] = [];
    for (const unit of request.units) {
      const count = kai[unit.id] ?? 0;
      if (count <= 0) continue;
      used[unit.pool] += count * unit.cost;
      const cap = request.caps[unit.id];
      rows.push(
        `| ${label(unit.id)} | ${unit.pool} | ${n(count)} | ${String(unit.cost)} | ${n(count * unit.cost)} | ${
          cap === undefined ? '—' : `${n(cap)}${count > cap ? ' **over**' : ''}`
        } |`,
      );
    }
    report.add(
      `\n| stack | pool | count | cost each | pool spend | its cap |\n|---|---|---|---|---|---|\n${rows.join('\n')}`,
    );
    report.add(
      `\nLeadership **${n(used.leadership)} / ${n(request.housing.leadership)}**, authority **${n(
        used.authority,
      )} / ${n(request.housing.authority)}**, dominance **${n(used.dominance)} / ${n(
        request.housing.dominance,
      )}**. \`feasible\`: **${String(feasible(request, kai))}**.`,
    );
    report.save();
  });

  it('B — the head-to-head, one march each', () => {
    const report = new Report('127-kai-recheck-b');
    const { request } = fourThousand();
    const kai = kaiCounts();
    const marches: { name: string; counts: Record<string, number> }[] = [
      { name: 'Tier ladder (`elite`)', counts: countsOf(evaluate(withMethod(request, 'elite')).result) },
      { name: 'Troops first (`ms`)', counts: countsOf(evaluate(withMethod(request, 'ms')).result) },
      {
        name: 'Troops first + damage trades (`msRelaxed`)',
        counts: countsOf(evaluate(withMethod(request, 'msRelaxed')).result),
      },
      { name: '**Kai’s calculator** (as captured)', counts: kai },
    ];
    report.add(`# 127 B — one march each, on the 4 000-leadership query\n`);
    const measured = marches.map((march) => ({ ...march, f: figures(request, march.counts) }));
    const best = Math.max(...measured.map((m) => m.f.min));
    report.add(
      '\n| march | stacks | troops | hired | worst opening | expected | vs best | silver | dmg / silver | gold | queue | leadership | authority |\n' +
        '|---|---|---|---|---|---|---|---|---|---|---|---|---|\n' +
        measured
          .map(
            (m) =>
              `| ${m.name} | ${String(m.f.stacks)} | ${n(m.f.troops)} | ${n(m.f.hired)} | **${n(m.f.min)}** | ${n(
                m.f.expected,
              )} | ${((m.f.min / best - 1) * 100).toFixed(2)} % | ${n(m.f.silver)} | ${(
                m.f.min / Math.max(1, m.f.silver)
              ).toFixed(2)} | ${n(m.f.gold)} | ${duration(m.f.seconds)} | ${n(m.f.leadership)}/${n(
                request.housing.leadership,
              )} | ${n(m.f.authority)}/${n(request.housing.authority)} |`,
          )
          .join('\n'),
    );
    report.save();
  });

  it('C — the kill order each march is fought in', () => {
    const report = new Report('127-kai-recheck-c');
    const { request } = fourThousand();
    const kai = kaiCounts();
    const marches: { name: string; counts: Record<string, number> }[] = [
      { name: 'Tier ladder (`elite`)', counts: countsOf(evaluate(withMethod(request, 'elite')).result) },
      { name: 'Troops first (`ms`)', counts: countsOf(evaluate(withMethod(request, 'ms')).result) },
      { name: 'Kai’s calculator', counts: kai },
    ];
    report.add(`# 127 C — the ladder of total HP, which is the whole difference\n`);
    for (const march of marches) {
      const { result } = evaluateCounts(request, march.counts);
      report.h(march.name);
      report.add(
        '\n| dies | stack | pool | count | total HP | damage a hit |\n|---|---|---|---|---|---|\n' +
          result.stacks
            .map(
              (stack, index) =>
                `| ${String(index + 1)} | ${label(stack.unitId)} | ${stack.pool} | ${n(stack.count)} | ${n(
                  stack.totalHp,
                )} | ${n(stack.damagePerHit)} |`,
            )
            .join('\n'),
      );
      const troopHp = result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp);
      const hiredHp = result.stacks.filter((s) => s.pool !== 'leadership').map((s) => s.totalHp);
      if (troopHp.length > 0 && hiredHp.length > 0) {
        const lowestTroop = Math.min(...troopHp);
        const above = hiredHp.filter((hp) => hp >= lowestTroop).length;
        report.add(
          `\nLowest troop stack **${n(lowestTroop)}** HP; hired stacks at or above it: **${String(
            above,
          )} of ${String(hiredHp.length)}** — those are the ones the enemy kills before the troops are gone.`,
        );
      }
    }
    report.save();
  });

  /**
   * **D — the same march, on the stock the query actually holds.** A is the reason this part exists: Kai's
   * answer fields 60 hired units against the query's stock of 53, so the row the benchmark carries is not a
   * march this account could send. Clamped type by type to its cap — nothing else touched, the troops as
   * Kai sized them — it is the only reading of Kai's answer that is a rival to ours.
   */
  it('D — Kai’s march clamped to the caps it was asked under', () => {
    const report = new Report('127-kai-recheck-d');
    const { request } = fourThousand();
    const kai = kaiCounts();
    const clamped: Record<string, number> = {};
    for (const unit of request.units) {
      const count = kai[unit.id] ?? 0;
      if (count <= 0) continue;
      const cap = request.caps[unit.id];
      clamped[unit.id] = cap === undefined ? count : Math.min(count, cap);
    }
    const marches: { name: string; counts: Record<string, number> }[] = [
      { name: 'Tier ladder (`elite`)', counts: countsOf(evaluate(withMethod(request, 'elite')).result) },
      { name: 'Troops first (`ms`)', counts: countsOf(evaluate(withMethod(request, 'ms')).result) },
      { name: 'Kai’s calculator, **as captured** (over its caps)', counts: kai },
      { name: 'Kai’s calculator, **clamped to the caps**', counts: clamped },
    ];
    report.add(`# 127 D — Kai’s answer on the stock the query holds\n`);
    const measured = marches.map((march) => ({ ...march, f: figures(request, march.counts) }));
    const troopsFirst = measured[1];
    if (!troopsFirst) throw new Error('no Troops first row');
    report.add(
      '\n| march | hired fielded | legal | worst opening | vs Troops first | silver | dmg / silver |\n' +
        '|---|---|---|---|---|---|---|\n' +
        measured
          .map(
            (m) =>
              `| ${m.name} | ${n(m.f.hired)} | ${feasible(request, m.counts) ? 'yes' : '**no**'} | **${n(
                m.f.min,
              )}** | ${((m.f.min / troopsFirst.f.min - 1) * 100).toFixed(2)} % | ${n(m.f.silver)} | ${(
                m.f.min / Math.max(1, m.f.silver)
              ).toFixed(2)} |`,
          )
          .join('\n'),
    );
    report.save();
  });
});
