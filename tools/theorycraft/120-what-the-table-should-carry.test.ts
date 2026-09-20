/**
 * 120 — **what a "best" mark is worth, and which rate columns are worth width** (S-113, the insight table).
 *
 * The owner's ask is *"a clear table telling you the facts summed up and letting you choose easily and
 * switch between objective with added knowledge"*. Before a column is drawn, two things have to be true, and
 * neither is obvious:
 *
 * 1. **A best-in-column mark is only worth its ink if the bests land on different rows.** If one stop is best
 *    at everything, the table is a ranking with extra steps and the marks say nothing a player could not read
 *    off the top row.
 * 2. **A rate column is only worth width if it re-orders the bar.** "Damage a silver" already has a column;
 *    damage a gold, damage an hour of queue and damage a dragon coin do not, and the question is whether any
 *    of them names a *different* stop than the columns already there.
 *
 * Both are counted over **every army the benchmark holds** — `commonScenarios()` plus the owner's, the same
 * seventeen the baseline is registered on — so the answer is not one account's accident.
 *
 * Every figure is the stop's own repeated march (`PlanRow.repeat`), which is what the table prints today.
 * `damage a hired unit` is measured and reported but **never counted as a winner**: 0019 §2.3 measured it
 * rising while the march collapses, and §1 calls it *"never the right compass"* — it is a fact for the table,
 * not a race to win.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/120-what-the-table-should-carry.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { PlanRow } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

/** One reading of a stop, and which way is better. */
interface Fact {
  key: string;
  head: string;
  /** `true` when a bigger figure is the better one. */
  up: boolean;
  /** `null` when this army never spends the resource, so the column would be noughts (design rule 15). */
  of: (row: PlanRow) => number | null;
  /** 0019 §2.3: a fact the table carries but nothing may call best. */
  neverBest?: boolean;
}

const FACTS: Fact[] = [
  { key: 'damage', head: 'Worst opening', up: true, of: (row) => row.repeat.damage },
  { key: 'silver', head: 'Silver', up: false, of: (row) => row.repeat.silver },
  { key: 'queue', head: 'Queue', up: false, of: (row) => row.repeat.seconds },
  { key: 'hiredLost', head: 'Hired lost', up: false, of: (row) => (row.repeat.mercLost > 0 ? row.repeat.mercLost : null) },
  {
    key: 'perSilver',
    head: 'Per silver',
    up: true,
    of: (row) => (row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : null),
  },
  {
    key: 'perGold',
    head: 'Per gold',
    up: true,
    of: (row) => (row.repeat.gold > 0 ? row.repeat.damage / row.repeat.gold : null),
  },
  {
    key: 'perHour',
    head: 'Per hour of queue',
    up: true,
    of: (row) => (row.repeat.seconds > 0 ? row.repeat.damage / (row.repeat.seconds / 3_600) : null),
  },
  {
    key: 'perCoin',
    head: 'Per dragon coin',
    up: true,
    of: (row) => ((row.repeat.dragonCoins ?? 0) > 0 ? row.repeat.damage / (row.repeat.dragonCoins ?? 1) : null),
  },
  {
    key: 'perHired',
    head: 'Per hired',
    up: true,
    neverBest: true,
    of: (row) => (row.repeat.mercLost > 0 ? row.repeat.hiredDamage / row.repeat.mercLost : null),
  },
];

/** The stop a fact names, or `null` where the army never spends that resource. */
function winner(rows: PlanRow[], fact: Fact): PlanRow | null {
  const live = rows.filter((row) => fact.of(row) !== null);
  if (live.length === 0) return null;
  return live.reduce((best, row) => {
    const a = fact.of(row) ?? 0;
    const b = fact.of(best) ?? 0;
    return fact.up ? (a > b ? row : best) : a < b ? row : best;
  });
}

describe.skipIf(!process.env.THEORY)('what the insight table should carry', () => {
  it('counts the bests and the re-orderings over every benchmark army', () => {
    const report = new Report('120-what-the-table-should-carry');
    const profile = ownerProfile();
    const scenarios: { label: string; request: StackRequest }[] = [
      ...commonScenarios(),
      ...(profile === null ? [] : ownerScenarios(profile)),
    ];

    /** How often each fact names a stop no other fact does, and how many stops hold a best at all. */
    const distinctPerArmy: number[] = [];
    const namesSomething = new Map<string, number>();
    const soleNamer = new Map<string, number>();
    let armies = 0;

    report.h('One army a row: which stop each fact names');
    report.add('');
    report.add(`| army | stops | ${FACTS.map((fact) => fact.head).join(' | ')} | different rows |`);
    report.add(`|---|---|${FACTS.map(() => '---').join('|')}|---|`);

    for (const scenario of scenarios) {
      let rows: PlanRow[];
      try {
        rows = planCampaign({ request: scenario.request, marches: 4 }).alternatives;
      } catch {
        continue; // an army the plan refuses is not a table question
      }
      if (rows.length === 0) continue;
      armies += 1;

      const named = new Map<string, PlanRow | null>();
      for (const fact of FACTS) named.set(fact.key, winner(rows, fact));

      // How many *different* stops hold at least one best, ignoring the fact nothing may win (0019 §2.3).
      const markable = FACTS.filter((fact) => fact.neverBest !== true);
      const holders = new Set(
        markable.map((fact) => named.get(fact.key)?.pick).filter((pick): pick is string => pick !== undefined),
      );
      distinctPerArmy.push(holders.size);

      for (const fact of markable) {
        const pick = named.get(fact.key)?.pick;
        if (pick === undefined) continue;
        namesSomething.set(fact.key, (namesSomething.get(fact.key) ?? 0) + 1);
        // A fact is a *sole* namer when no other markable fact names the same stop.
        const alone = markable.every(
          (other) => other.key === fact.key || named.get(other.key)?.pick !== pick,
        );
        if (alone) soleNamer.set(fact.key, (soleNamer.get(fact.key) ?? 0) + 1);
      }

      report.add(
        `| ${scenario.label} | ${String(rows.length)} | ${FACTS.map((fact) => {
          const row = named.get(fact.key);
          return row === null || row === undefined ? '—' : `${row.pick}${fact.neverBest === true ? ' *' : ''}`;
        }).join(' | ')} | **${String(holders.size)}** |`,
      );
    }

    report.h('The two questions, answered');
    report.add('');
    const spread = distinctPerArmy.reduce((sum, one) => sum + one, 0) / Math.max(1, distinctPerArmy.length);
    const onlyOne = distinctPerArmy.filter((one) => one <= 1).length;
    report.add(
      `**Is a best mark worth its ink?** Over **${String(armies)} armies**, the marks land on **${n(
        Math.round(spread * 100) / 100,
      )} different stops on average**, and on **${String(onlyOne)}** of them a single stop wins everything. ${
        onlyOne === armies
          ? 'One stop always wins: the marks would say nothing.'
          : 'The marks disagree on the rest, which is the table doing its job.'
      }`,
    );
    report.add('');
    report.add('**Which rate columns name a stop nothing else does?**');
    report.add('');
    report.add('| fact | names a stop on | is the only fact naming it on |');
    report.add('|---|---|---|');
    for (const fact of FACTS.filter((one) => one.neverBest !== true)) {
      report.add(
        `| ${fact.head} | ${String(namesSomething.get(fact.key) ?? 0)} of ${String(armies)} | **${String(
          soleNamer.get(fact.key) ?? 0,
        )}** |`,
      );
    }
    report.add('');
    report.add('*`*` marks the fact nothing may call best: damage a hired unit (0019 §2.3).*');
    report.save();
  }, 900_000);
});
