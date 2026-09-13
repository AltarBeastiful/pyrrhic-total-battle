/**
 * B3 — the campaign: closed forms, and the best plan under a silver budget.
 *
 * Part 1 derives the four closed forms of the `ceil(n/10)` loss rule and checks each against
 * `simulateCampaign` (src/engine/campaign.ts), which is plain bookkeeping over `sizeStacks` +
 * `simulateBattle` and takes no decision of its own.
 *
 * Part 2 puts a silver budget on the table and asks what maximises total average damage: `searchComplete`
 * (method × spend × subset, scored on campaign totals) against a plain grid of `simulateCampaign` runs, so
 * the search can be checked rather than trusted.
 *
 * The leadership dimension — which `simulateCampaign` cannot express, since `sizeStacks` always fills the
 * leadership — is 23-campaign-leadership.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/22-campaign.test.ts`
 */
import { describe, it } from 'vitest';

import { marchTarget, searchComplete, simulateCampaign } from '../../src/engine/campaign';
import { chunks } from '../../src/engine/recovery';
import type { CampaignSummary } from '../../src/engine/campaign';
import type { StackRequest } from '../../src/engine/types';
import { EIGHT, MERC_IDS, Report, label, loadOwner, n, scenarioB, withMethod, withUnits } from './harness';

const TEMPLE = 15;
const SEVEN = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;
const CAPS: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const BUDGETS = [2e6, 5e6, 1e7, 2e7, 4e7];
const SPEND_LEVELS = [1, 0.75, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1];
const MAX_MARCHES = 30;

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}

/** How many marches a stock of `cap0` sustains when `n` is fielded every march. Plain simulation. */
function marchesSustained(cap0: number, size: number): number {
  if (size <= 0) return 0;
  let stock = cap0;
  let fought = 0;
  while (stock >= size) {
    stock -= chunks(size);
    fought += 1;
  }
  return fought;
}

/** Closed form of the same thing: the first march, then one more per whole `ceil(n/10)` of slack. */
function marchesClosedForm(cap0: number, size: number): number {
  if (size <= 0 || size > cap0) return 0;
  return Math.floor((cap0 - size) / chunks(size)) + 1;
}

describe.skipIf(!process.env.THEORY)('B3 campaign', () => {
  it('derives the closed forms and searches the budgets', () => {
    const report = new Report('22-campaign');
    const owner = loadOwner();
    const TWELVE = owner.twelve.units.map((unit) => unit.id);

    report.add('# B3 — the campaign: closed forms and the best plan under a silver budget');
    report.add('');
    report.add(
      'Authority 2,000, so the hired caps bind: EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37. Every stack of a march ' +
        'dies; the Temple returns `n − ceil(n/10)` of each stack, so **each hired stack loses exactly ' +
        '`ceil(n/10)` units a march, for ever**. Troops cost silver and time and come back in full. That one ' +
        'asymmetry is the whole campaign problem.',
    );

    // ---- Part 1: the four closed forms ----------------------------------------------------------
    report.h('1. Closed forms of the `ceil(n/10)` rule');

    report.add('### (iv) first, the loss table — why counts want to be multiples of ten');
    report.add('');
    report.add(
      'A stack of `n` loses `ceil(n/10)` units whatever `n` is inside the chunk. Fielding 41 costs the same ' +
        'five units as fielding 50: nine free units are left at home for nothing.',
    );
    report.add('');
    report.add('| n fielded | ceil(n/10) lost | units wasted vs the next multiple of 10 | loss rate |');
    report.add('|---|---|---|---|');
    for (const size of [10, 11, 19, 20, 21, 29, 30, 31, 40, 41, 49, 50, 51, 76, 80, 92]) {
      const wasted = chunks(size) * 10 - size;
      report.add(
        `| ${n(size)} | ${n(chunks(size))} | ${n(wasted)} | ${((chunks(size) / size) * 100).toFixed(1)} % |`,
      );
    }
    report.add('');
    report.add(
      '**Rule:** always field a multiple of ten of every hired type. At 41 the loss rate is 12.2 %; at 50 it is ' +
        '10.0 % for 22 % more damage-carrying units.',
    );

    report.add('### (i) how many marches a given `n` sustains');
    report.add('');
    report.add(
      'The first march is free of the slack, and every whole `ceil(n/10)` of slack above `n` buys one more:\n\n' +
        '```\nmarches(cap0, n) = floor((cap0 − n) / ceil(n/10)) + 1        (n ≤ cap0)\n```',
    );
    report.add('');
    report.add('| stock cap0 | n fielded | ceil(n/10) | closed form | simulated | agree |');
    report.add('|---|---|---|---|---|---|');
    let allAgree = true;
    for (const cap0 of [92, 76, 72, 37]) {
      for (const size of [cap0, Math.round(cap0 * 0.5), Math.round(cap0 * 0.3), 20, 10]) {
        if (size <= 0 || size > cap0) continue;
        const closed = marchesClosedForm(cap0, size);
        const simulated = marchesSustained(cap0, size);
        if (closed !== simulated) allAgree = false;
        report.add(
          `| ${n(cap0)} | ${n(size)} | ${n(chunks(size))} | ${n(closed)} | ${n(simulated)} | ${closed === simulated ? '✓' : '✗'} |`,
        );
      }
    }
    report.add('');
    report.add(`Closed form and simulation agree on every row: **${allAgree ? 'yes' : 'NO'}**.`);

    report.add('### (ii) the sustaining fraction for M marches is about 10/(M+9)');
    report.add('');
    report.add(
      'M marches at a constant `n` need `n + (M−1)·ceil(n/10) ≤ cap0`. Dropping the ceiling, ' +
        '`n(1 + (M−1)/10) ≤ cap0`, i.e.\n\n' +
        '```\nf = n / cap0 ≤ 10 / (M + 9)\n```\n\n' +
        'The exact integer answer is the largest `n` with `marches(cap0, n) ≥ M`; it sits just above the ' +
        'continuous bound because the ceiling rounds the *loss* up, not the count.',
    );
    report.add('');
    report.add(
      '| M marches | 10/(M+9) | exact max f (cap0 = 92) | exact n | n as a multiple of 10 | marches that n really gives |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const M of [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30]) {
      const cap0 = 92;
      let exact = 0;
      for (let size = cap0; size >= 1; size -= 1) {
        if (marchesSustained(cap0, size) >= M) {
          exact = size;
          break;
        }
      }
      const rounded = Math.max(10, Math.floor(exact / 10) * 10);
      report.add(
        `| ${n(M)} | ${(10 / (M + 9)).toFixed(4)} | ${(exact / cap0).toFixed(4)} | ${n(exact)} | ${n(rounded)} | ${n(marchesSustained(cap0, rounded))} |`,
      );
    }

    report.add('### (iii) total hired units fielded over M marches, and the limit 10 × cap0');
    report.add('');
    report.add(
      'Fielding the sustaining `n = 10·cap0/(M+9)` M times puts `M·n = 10·cap0·M/(M+9)` hired units on the ' +
        'field in total. As M grows that tends to **10 × cap0**: because only a tenth of what you field is ' +
        'actually consumed, a stock of 92 can deliver about 920 unit-marches of damage — but only if you are ' +
        'willing to fight ~forever with tiny stacks.',
    );
    report.add('');
    report.add('| M | sustaining n (cap0 = 92) | total fielded M·n | % of the 920 limit |');
    report.add('|---|---|---|---|');
    for (const M of [1, 2, 3, 5, 10, 20, 30, 50, 100, 200]) {
      const cap0 = 92;
      let exact = 0;
      for (let size = cap0; size >= 1; size -= 1) {
        if (marchesSustained(cap0, size) >= M) {
          exact = size;
          break;
        }
      }
      const total = M * exact;
      report.add(`| ${n(M)} | ${n(exact)} | ${n(total)} | ${((total / (10 * cap0)) * 100).toFixed(1)} % |`);
    }
    report.add('');
    report.add(
      'This is the shape of the whole answer: **total damage rises with the number of marches and falls with ' +
        'the size of each**, and the product is what a budget has to be spent on.',
    );

    // ---- Part 1b: check against simulateCampaign ------------------------------------------------
    report.h('1b. The same numbers out of `simulateCampaign`');
    report.add('');
    report.add(
      'Checked with the `elite` sizing, where the hired stacks go on top at their full caps (authority 2,000 ' +
        'does not bind), so "fielded" is exactly `marchTarget(cap, spend)` and the bookkeeping is visible.',
    );
    report.add('');
    const eliteRequest = withMethod(withUnits(scenarioB(owner.twelve), EIGHT), 'elite');
    report.add(
      '| spend | EMH6 per march | closed-form marches | `simulateCampaign` marches at full size | EMH6 lost | EMH6 left |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const spend of [1, 0.5, 0.3, 0.2, 0.1]) {
      const target = marchTarget(92, spend);
      const closed = marchesClosedForm(92, target);
      const summary = simulateCampaign(eliteRequest, { marches: 200, spend });
      // Marches that still fielded the full target (afterwards the stock, not the target, is the limit).
      const atFull = summary.marches.filter(
        (m) => (m.result.stacks.find((s) => s.unitId === 'epic-monster-hunter-6')?.count ?? 0) >= target,
      ).length;
      report.add(
        `| ${(spend * 100).toFixed(0)} % | ${n(target)} | ${n(closed)} | ${n(atFull)} | ${n(summary.lost['epic-monster-hunter-6'] ?? 0)} | ${n(summary.remaining['epic-monster-hunter-6'] ?? 0)} |`,
      );
    }

    // ---- Part 2: silver budgets -----------------------------------------------------------------
    report.h('2. Best plan per silver budget (`searchComplete` vs a plain grid)');
    report.add('');
    report.add(
      `Campaign settings: at most ${MAX_MARCHES} marches, silver budget S; a march whose retrain silver would ` +
        'push the running total past S is discarded and the campaign stops (`stoppedBy: "silver"`). Objective ' +
        "`avgDamage` = the sum of the marches' average damage. Spend levels " +
        `${SPEND_LEVELS.map((s) => `${(s * 100).toFixed(0)} %`).join(', ')}.`,
    );

    const gridSubsets = [
      { key: '12 types', ids: TWELVE },
      { key: "8 types (owner's)", ids: EIGHT },
      { key: '7 types (single-march winner)', ids: SEVEN },
    ] as const;

    for (const [scenarioName, base] of [
      ['A (export bonuses)', withTemple(owner.twelve)],
      ['B (bonuses proven in game)', scenarioB(owner.twelve)],
    ] as const) {
      report.h(`Scenario ${scenarioName}`);

      report.add('### `searchComplete` (method × spend × every subset of the 12 types)');
      report.add('');
      report.add(
        '| budget S | marches | stopped by | method | spend | subset | total avg damage | silver used | gold | mercenaries left | evaluated | exhaustive | ms |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
      const searchBest: Record<number, number> = {};
      for (const budget of BUDGETS) {
        const started = Date.now();
        const found = searchComplete({
          request: base,
          objective: 'avgDamage',
          campaign: { marches: MAX_MARCHES, silverBudget: budget },
          budgetMs: 30_000,
          spendLevels: [...SPEND_LEVELS],
        });
        const elapsed = Date.now() - started;
        const w = found.winner;
        const left = MERC_IDS.map((id) => `${label(id)} ${n(w.campaign.remaining[id] ?? 0)}`).join(' ');
        searchBest[budget] = w.score;
        report.add(
          `| ${n(budget)} | ${n(w.campaign.fought)} | ${w.campaign.stoppedBy} | ${w.method} | ${(w.spend * 100).toFixed(0)} % | ${w.includedUnitIds.map((id) => label(id)).join(' ')} | ${n(Math.round(w.score))} | ${n(Math.round(w.campaign.silver))} | ${n(Math.round(w.campaign.gold))} | ${left} | ${n(found.evaluated)} | ${found.exhaustive ? 'yes' : 'no'} | ${n(elapsed)} |`,
        );
      }
      report.add('');

      report.add('### Plain grid: `simulateCampaign` over method × spend × three fixed subsets');
      report.add('');
      report.add(
        '| budget S | best method | spend | subset | marches | total avg damage | silver used | gold | EMH6/ABT6/LGN6/CHR6 left | grid as % of `searchComplete` |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|');
      for (const budget of BUDGETS) {
        let best: { method: string; spend: number; subset: string; summary: CampaignSummary } | undefined;
        for (const method of ['elite', 'ms', 'msRelaxed'] as const) {
          for (const spend of SPEND_LEVELS) {
            for (const subset of gridSubsets) {
              const request = withMethod(withUnits(base, subset.ids), method);
              const summary = simulateCampaign(request, {
                marches: MAX_MARCHES,
                silverBudget: budget,
                spend,
              });
              if (!best || summary.totalAvg > best.summary.totalAvg) {
                best = { method, spend, subset: subset.key, summary };
              }
            }
          }
        }
        if (!best) continue;
        const left = MERC_IDS.map((id) => n(best.summary.remaining[id] ?? 0)).join('/');
        const delta = (best.summary.totalAvg / (searchBest[budget] ?? best.summary.totalAvg)) * 100;
        report.add(
          `| ${n(budget)} | ${best.method} | ${(best.spend * 100).toFixed(0)} % | ${best.subset} | ${n(best.summary.fought)} | ${n(Math.round(best.summary.totalAvg))} | ${n(Math.round(best.summary.silver))} | ${n(Math.round(best.summary.gold))} | ${left} | ${delta.toFixed(1)} % |`,
        );
      }
      report.add('');

      // ---- The spend curve at one budget, so the shape is visible -------------------------------
      report.add('### The spend curve (7-type `msRelaxed`, every spend level, per budget)');
      report.add('');
      report.add(
        'The lever the correction of 2026-09-14 exposed: with authority no longer binding, **how much of the ' +
          'stock to field per march** is the decision, not how much authority to buy.',
      );
      report.add('');
      const sevenRequest = withMethod(withUnits(base, SEVEN), 'msRelaxed');
      report.add('| spend | EMH6 target | ' + BUDGETS.map((b) => `S=${n(b / 1e6)} M`).join(' | ') + ' |');
      report.add('|---|---|' + BUDGETS.map(() => '---').join('|') + '|');
      for (const spend of SPEND_LEVELS) {
        const cells = BUDGETS.map((budget) => {
          const summary = simulateCampaign(sevenRequest, {
            marches: MAX_MARCHES,
            silverBudget: budget,
            spend,
          });
          return `${n(Math.round(summary.totalAvg / 1e6))} M / ${n(summary.fought)}m`;
        });
        report.add(`| ${(spend * 100).toFixed(0)} % | ${n(marchTarget(92, spend))} | ${cells.join(' | ')} |`);
      }
      report.add('');
      report.add('*(cell = total average damage in millions / marches fought)*');

      // ---- Multiples of ten ---------------------------------------------------------------------
      report.add('### The rounding effect: a cap-derived spend versus the nearest multiple of ten');
      report.add('');
      report.add(
        '`marchTarget(cap, spend) = max(1, ceil(spend × cap))` gives ragged counts (92 × 0.3 = 28), and 28 loses ' +
          'the same three units as 30 — nine units left at home for nothing. The last column is the one to read: ' +
          '**units fielded per unit of stock consumed**, which is the real exchange rate of a campaign.',
      );
      report.add('');
      report.add(
        '| spend | ragged counts | ragged loss/march | ragged units/loss | rounded counts | rounded loss/march | rounded units/loss |',
      );
      report.add('|---|---|---|---|---|---|---|');
      for (const spend of SPEND_LEVELS) {
        const ragged = MERC_IDS.map((id) => marchTarget(CAPS[id] ?? 0, spend));
        const rounded = MERC_IDS.map((id) => {
          const cap = CAPS[id] ?? 0;
          return spend >= 1 ? cap : Math.min(cap, Math.max(10, Math.round((spend * cap) / 10) * 10));
        });
        const raggedLoss = ragged.reduce((sum, size) => sum + chunks(size), 0);
        const roundedLoss = rounded.reduce((sum, size) => sum + chunks(size), 0);
        const extra = rounded.reduce((sum, size, i) => sum + size - (ragged[i] ?? 0), 0);
        const raggedUnits = ragged.reduce((sum, size) => sum + size, 0);
        const roundedUnits = rounded.reduce((sum, size) => sum + size, 0);
        void extra;
        report.add(
          `| ${(spend * 100).toFixed(0)} % | ${ragged.join('/')} | ${n(raggedLoss)} | ${(raggedUnits / raggedLoss).toFixed(2)} | ${rounded.join('/')} | ${n(roundedLoss)} | ${(roundedUnits / roundedLoss).toFixed(2)} |`,
        );
      }
    }

    report.h('What B3 says');
    report.add('');
    report.add(
      [
        '- **The stock is worth ten times itself, spread thin.** Only `ceil(n/10)` of every hired stack is really',
        '  consumed, so 92 EMH6 can deliver ~920 unit-marches — but the sustaining size falls as `10·cap0/(M+9)`,',
        '  so buying more marches means smaller stacks, and damage per march falls with them.',
        '- **Inside `simulateCampaign`, spend cannot buy marches.** This is the single most important finding here,',
        '  and it is easy to miss. `sizeStacks` always fills the leadership, so the retrain silver of a march depends',
        '  only on its *troop* types, not on the hired spend at all: the number of marches a budget pays for is',
        '  `S ÷ (silver per march)` whatever the spend. Spending the stock slowly therefore buys **no extra marches**',
        '  — it only makes each march weaker. That is why the spend-curve table falls monotonically from 100 % to',
        '  10 % in every column, and why the search keeps choosing high spend.',
        '- **The only reason a low spend ever wins is HP, not thrift.** Under `ms`/`msRelaxed` the sizer caps each',
        '  hired stack just under the smallest troop stack anyway (EMH6 43 of 92 in scenario A), so every spend level',
        '  above ~47 % is the same march; below that the spend starts to bite and damage falls. A low spend "wins"',
        '  in the search only when it keeps the stock alive long enough for the *later* marches of a long campaign.',
        '- **To make spend a real lever you must also cut the leadership.** Fewer troops = less silver per march =',
        '  more marches for the same S, and smaller troop stacks let the hired stacks be small without losing their',
        '  place in the kill order. `simulateCampaign` cannot express that, so 23-campaign-leadership plays those',
        '  campaigns by hand with explicit counts.',
        '- **`searchComplete` is not a guaranteed optimum.** Its stage 1 shortlists the best `SHORTLIST` = 8 subsets',
        '  by *single-battle* score and only then plays campaigns, so a subset that loses one battle and wins ten is',
        '  invisible to it. The plain grid beats it by 6.8 % (A, S = 5 M) and 9.7 % (B, S = 5 M) with plain `elite`',
        '  at 100 % spend on the 12 types, and loses to it elsewhere. Both numbers are in the tables above; the',
        '  practical answer at any budget is the better of the two, and the gap is worth an engine issue.',
        '- **Always field multiples of ten.** A multiple-of-ten plan always fields exactly **10.00 units per unit of',
        "  stock consumed** — the theoretical maximum of the `ceil(n/10)` rule — while `marchTarget`'s ragged",
        '  cap-derived counts drop to 9.23 at 100 % spend, 8.75 at 25 % and **6.14 at 15 %**. At 25 % spend the',
        '  ragged 23/19/18/10 field 70 units for 8 lost; a rounded 20/20/20/10 fields the same 70 for 7. That is up',
        '  to **63 % more damage-carrying units per unit of stock burnt, for free**, and neither `marchTarget` nor',
        '  the UI does the rounding today.',
      ].join('\n'),
    );

    report.save();
  }, 900_000);
});
