/**
 * 187 — **does the seed climb need more rounds as the dominance pool grows?** (W16 F1; owner, 2026-10-02:
 * *"For climbrounds, do we need to increase it with dominance?"*)
 *
 * `PLAN_LIMITS.climbRounds` went 16 → 32 with the 20 000-dominance camp's registration (experiment 186 E:
 * 32 moves only that camp; 256 and beyond hurt the 900 camp). This asks whether a flat 32 is enough, or
 * whether a rule — rounds as a function of the dominance, or of the box the climb walks — beats it.
 *
 * Two rosters, both a first-run army with hunters 83 · Bear V 6 at 20 000 leadership and 2 180 authority:
 * **tiers 3–7** (experiment 129's camp, twenty monster types) and **tiers 3–5** (experiment 110's, twelve).
 * Each at dominance 900, 2 000, 5 000, 10 000, 15 000, 20 000, planned as the app plans it
 * (`CAMPAIGN.planFixes`, the put-back, the 40 s clock) under `climbRounds` 16, 32, 64, 128, 256 (`limits`,
 * nothing else moved). Every stop priced over four marches, worst opening (`campaignOf`), and rated against
 * the stop of the same pick at **32** — the shipped flat value — with the owner's `markerRates` (**+** better).
 *
 * A cell is **worse than flat 32** when any stop rates below it, a stop of 32's bar is missing, or the bar's
 * best on any of the five readings (most damage, least silver, fewest hired, dmg/silver, dmg/hired) is
 * worse. A rule is admissible only if it is never worse than flat 32 on any cell (non-regression).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/187-climb-rounds-and-dominance.test.ts`
 *
 * **Answer (2026-10-02, `out/187-climb-rounds-and-dominance.md`).** The best round count does not grow with
 * the dominance: tiers 3–5 reads the same at every count but 256 @ 900 (worse); tiers 3–7 is the same from 16
 * up to 5 000, needs 32 from 10 000 (16 is worse at 10 000, 15 000, 20 000), and 128/256 are worse at 15 000
 * and 20 000 (a stop dropped or a bar-best reading lost even where the matched stops rate higher). The only
 * cell anything beats 32 on is tiers 3–7 @ 15 000, by 64 (+2.33 rated, a fifth stop). Flat 64 is never worse
 * here but re-folds the evening account's bar (experiment 186 E) and costs +29 % planner time; so no rule —
 * keep flat 32.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import { newProfile } from '../../src/state/defaults';
import { buildStackRequest } from '../../src/state/derive';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
const DOMINANCES = [900, 2_000, 5_000, 10_000, 15_000, 20_000] as const;
const ROUNDS = [16, 32, 64, 128, 256] as const;
const FLAT = 32;
const ROSTERS = [
  { name: 'tiers 3–7', max: 7 },
  { name: 'tiers 3–5', max: 5 },
] as const;

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;

function camp(max: number, dominance: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'bear-5', cap: 6 },
  ];
  profile.troops.monsters = { min: 3, max };
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, {
    ...setup,
    housing: { leadership: 20_000, authority: 2_180, dominance },
  });
}

function plan(request: StackRequest, climbRounds: number): { plan: CampaignPlan | null; ms: number } {
  const began = performance.now();
  try {
    const p = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      limits: { climbRounds },
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
    return { plan: p, ms: performance.now() - began };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
    return { plan: null, ms: performance.now() - began };
  }
}

const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired', of: (c: Campaign) => c.burned, high: false },
  { head: 'dmg/silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg/hired', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const barBest = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
const gain = (after: number, before: number, r: Reading): number =>
  before === after || before === 0
    ? 0
    : ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
const sgn = (v: number, digits = 2): string =>
  Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}`;

interface Cell {
  roster: string;
  dominance: number;
  rounds: number;
  ms: number;
  rows: PlanRow[];
  priced: Campaign[];
}
interface Verdict {
  /** Stops rated above / below the same pick at 32, stops 32 had that this bar lacks, stops added. */
  better: number;
  worse: number;
  dropped: number;
  added: number;
  /** Sum of the matched stops' ratings. */
  sum: number;
  /** The five bar-best readings against 32's, in percent (+ better). */
  reads: number[];
  /** Never worse than 32 on any stop or reading. */
  safe: boolean;
  /** Safe, and better somewhere. */
  improves: boolean;
}

function verdict(cell: Cell, flat: Cell): Verdict {
  const used = new Set<number>();
  let better = 0;
  let worse = 0;
  let added = 0;
  let sum = 0;
  cell.rows.forEach((row, i) => {
    const j = flat.rows.findIndex((b, k) => b.pick === row.pick && !used.has(k));
    if (j < 0) {
      added += 1;
      return;
    }
    used.add(j);
    const r = rate(billOf(flat.priced[j] as Campaign), billOf(cell.priced[i] as Campaign), RATES);
    sum += r;
    if (r > 1e-9) better += 1;
    else if (r < -1e-9) worse += 1;
  });
  const dropped = flat.rows.length - used.size;
  const reads =
    cell.priced.length === 0 || flat.priced.length === 0
      ? READINGS.map(() => 0)
      : READINGS.map((r) => gain(barBest(cell.priced, r), barBest(flat.priced, r), r));
  const safe = worse === 0 && dropped === 0 && reads.every((v) => v > -1e-9);
  const improves = safe && (better > 0 || added > 0 || reads.some((v) => v > 1e-9));
  return { better, worse, dropped, added, sum, reads, safe, improves };
}

describe.skipIf(!process.env.THEORY)('climbRounds against the dominance pool', () => {
  it('both rosters × six dominances × five round counts', { timeout: 7_200_000 }, () => {
    const cells: Cell[] = [];
    for (const roster of ROSTERS)
      for (const dominance of DOMINANCES) {
        const request = camp(roster.max, dominance);
        for (const rounds of ROUNDS) {
          const { plan: p, ms } = plan(request, rounds);
          const rows = p?.alternatives ?? [];
          const priced = rows.map((row) =>
            campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals)),
          );
          cells.push({ roster: roster.name, dominance, rounds, ms, rows, priced });
        }
      }
    const at = (roster: string, dominance: number, rounds: number): Cell =>
      cells.find((c) => c.roster === roster && c.dominance === dominance && c.rounds === rounds) as Cell;

    const report = new Report('187-climb-rounds-and-dominance');
    report.add('# 187 — does the seed climb need more rounds as the dominance pool grows?\n');
    report.add(
      'Two rosters (hunters 83 · Bear V 6, 20 000 leadership, 2 180 authority; monster tiers 3–7 = experiment ' +
        '129’s twenty types, tiers 3–5 = experiment 110’s twelve) at six dominance pools, planned as the app ' +
        'plans it under `climbRounds` 16 · 32 · 64 · 128 · 256 (nothing else moved). Every stop priced over four ' +
        'marches, worst opening, and rated against the same pick at **32**, the shipped flat value, with the ' +
        'owner’s `markerRates` (**+** better). `ms` is one wall-clock `planCampaign` call, single-file run.\n',
    );
    report.add(
      'A cell is **worse than 32** when a stop rates below 32’s, a stop of 32’s bar is gone, or the bar’s best ' +
        'on any of most damage · least silver · fewest hired · dmg/silver · dmg/hired is worse.\n',
    );

    // ---- the verdict grid ----
    report.h('Against flat 32, every cell');
    report.add(
      '| roster | dominance | rounds | ms | stops | better / worse / dropped / new | Σ rated | ' +
        'most dmg | least silver | fewest hired | dmg/silver | dmg/hired | verdict |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    const verdicts = new Map<Cell, Verdict>();
    for (const cell of cells) {
      const flat = at(cell.roster, cell.dominance, FLAT);
      const v = verdict(cell, flat);
      verdicts.set(cell, v);
      const word = cell.rounds === FLAT ? '—' : v.improves ? '**better**' : v.safe ? 'same' : '**worse**';
      report.add(
        `| ${cell.roster} | ${n(cell.dominance)} | ${String(cell.rounds)} | ${n(Math.round(cell.ms))} | ` +
          `${cell.rows.map((r) => short(r.pick)).join(' ') || 'refuses'} | ` +
          `${cell.rounds === FLAT ? '—' : `${String(v.better)} / ${String(v.worse)} / ${String(v.dropped)} / ${String(v.added)}`} | ` +
          `${cell.rounds === FLAT ? '—' : sgn(v.sum, 3)} | ${v.reads.map((x) => (cell.rounds === FLAT ? '—' : `${sgn(x)} %`)).join(' | ')} | ${word} |`,
      );
    }

    // ---- the bars themselves ----
    report.h('The bars');
    report.add(
      '| roster | dominance | rounds | stop | damage | silver | hired burned | dragon coins | rated vs 32 |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const cell of cells) {
      const flat = at(cell.roster, cell.dominance, FLAT);
      const used = new Set<number>();
      cell.rows.forEach((row, i) => {
        const c = cell.priced[i] as Campaign;
        const j = flat.rows.findIndex((b, k) => b.pick === row.pick && !used.has(k));
        if (j >= 0) used.add(j);
        const rated =
          cell.rounds === FLAT
            ? '—'
            : j < 0
              ? 'new'
              : sgn(rate(billOf(flat.priced[j] as Campaign), billOf(c), RATES), 3);
        report.add(
          `| ${cell.roster} | ${n(cell.dominance)} | ${String(cell.rounds)} | ${short(row.pick)} | ${n(Math.round(c.damage))} | ` +
            `${n(Math.round(c.silver))} | ${n(c.burned)} | ${n(Math.round(c.dragonCoins))} | ${rated} |`,
        );
      });
    }

    // ---- the answer ----
    report.h('Does the best rounds grow with dominance?');
    report.add(
      'Per roster and dominance: the round counts never worse than 32 (**safe**), those that are also better ' +
        'somewhere, and the best by Σ rated among the safe ones (32 itself when none improves).\n',
    );
    report.add('| roster | dominance | safe | better than 32 | best safe | worse than 32 |');
    report.add('|---|---|---|---|---|---|');
    const bestSafe = new Map<string, number>();
    for (const roster of ROSTERS)
      for (const dominance of DOMINANCES) {
        const row = ROUNDS.map((rounds) => ({
          rounds,
          v: verdicts.get(at(roster.name, dominance, rounds)) as Verdict,
        }));
        const safe = row.filter(({ v }) => v.safe).map(({ rounds }) => rounds);
        const improving = row.filter(({ rounds, v }) => rounds !== FLAT && v.improves);
        const best = improving.reduce<{ rounds: number; v: Verdict } | null>(
          (b, x) => (!b || x.v.sum > b.v.sum ? x : b),
          null,
        );
        bestSafe.set(`${roster.name}|${String(dominance)}`, best?.rounds ?? FLAT);
        report.add(
          `| ${roster.name} | ${n(dominance)} | ${safe.join(' · ')} | ${improving.map(({ rounds }) => String(rounds)).join(' · ') || '—'} | ` +
            `${String(best?.rounds ?? FLAT)} | ${
              row
                .filter(({ v }) => !v.safe)
                .map(({ rounds }) => String(rounds))
                .join(' · ') || '—'
            } |`,
        );
      }

    // A rule f(dominance): one round count per dominance, the same for both rosters; admissible where it is
    // safe on both rosters. And f(box): per roster as well (the box the climb walks depends on the roster).
    report.h('Rules against flat 32');
    const ruleByDominance = DOMINANCES.map((dominance) => {
      const both = ROUNDS.filter((rounds) =>
        ROSTERS.every((roster) => (verdicts.get(at(roster.name, dominance, rounds)) as Verdict).safe),
      );
      const improving = both.filter((rounds) =>
        ROSTERS.some((roster) => (verdicts.get(at(roster.name, dominance, rounds)) as Verdict).improves),
      );
      const score = (rounds: number): number =>
        ROSTERS.reduce(
          (s, roster) => s + (verdicts.get(at(roster.name, dominance, rounds)) as Verdict).sum,
          0,
        );
      const pick = improving.reduce<number | null>(
        (b, x) => (b === null || score(x) > score(b) ? x : b),
        null,
      );
      return { dominance, both, pick: pick ?? FLAT };
    });
    report.add('| dominance | safe on both rosters | f(dominance) |');
    report.add('|---|---|---|');
    for (const r of ruleByDominance)
      report.add(`| ${n(r.dominance)} | ${r.both.join(' · ')} | ${String(r.pick)} |`);
    const monotone = ruleByDominance.every(
      (r, i) => i === 0 || r.pick >= (ruleByDominance[i - 1]?.pick ?? 0),
    );
    const improvedCells = ruleByDominance.reduce(
      (s, r) =>
        s +
        ROSTERS.filter((roster) => (verdicts.get(at(roster.name, r.dominance, r.pick)) as Verdict).improves)
          .length,
      0,
    );
    report.add('');
    report.add(
      `- **f(dominance)**, the best round count safe on both rosters at each dominance: ` +
        `${ruleByDominance.map((r) => `${n(r.dominance)} → ${String(r.pick)}`).join(', ')}. ` +
        `${monotone ? 'Monotone in the dominance' : '**Not** monotone in the dominance'}; better than flat 32 on ` +
        `${String(improvedCells)} of ${String(ROSTERS.length * DOMINANCES.length)} cells, never worse by construction.`,
    );
    for (const rounds of ROUNDS.filter((r) => r !== FLAT)) {
      const flatOther = cells.filter((c) => c.rounds === rounds);
      const worse = flatOther.filter((c) => !(verdicts.get(c) as Verdict).safe);
      const better = flatOther.filter((c) => (verdicts.get(c) as Verdict).improves);
      report.add(
        `- **flat ${String(rounds)}**: better than 32 on ${String(better.length)} cells, worse on ${String(worse.length)}` +
          (worse.length > 0 ? ` (${worse.map((c) => `${c.roster} @ ${n(c.dominance)}`).join('; ')})` : '') +
          `; planner total ${n(Math.round(flatOther.reduce((s, c) => s + c.ms, 0)))} ms.`,
      );
    }
    report.add(
      `- flat 32: planner total ${n(Math.round(cells.filter((c) => c.rounds === FLAT).reduce((s, c) => s + c.ms, 0)))} ms.`,
    );
    report.save();
    expect(cells.length).toBe(ROSTERS.length * DOMINANCES.length * ROUNDS.length);
  });
});
