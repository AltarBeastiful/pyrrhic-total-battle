/**
 * 147 — **the fold: which three stops to keep, and what each choice costs** (W10 §9.5, 2026-09-23).
 *
 * The owner: *"we should try to fold uninteresting stops … they can be filtered in the end to retain the three
 * best ones"*, and then, on the first cut of this report: *"show me what I'm losing … I cannot decide without
 * comparison, and always show all criteria, especially gold and silver/dmg and training time."*
 *
 * The pool is every stop the engine can offer — the bar with the hired saver offered everywhere
 * (`burnSaver: 'silver'`), before any fold. Every set of three is scored, army by army, on **ten readings**,
 * each the bar's best over the stops it keeps:
 *
 *   the most damage · the least silver · the fewest hired burned · the least gold · the fewest dragon coins ·
 *   the shortest training queue · the best damage a silver · a hired unit · a gold · a dragon coin
 *
 * and on matched spend against every captured TotalStack row (dominated / no stop fits), S-61 on the set as it
 * would be drawn, and whether it keeps the sweet spot. Every reading a set is worse on than the pool is printed
 * with its loss, so a fold is read as *what it gives up*, beside the pool it gives it up from.
 *
 * Four fold rules are compared, each taking the set of three that loses the fewest readings (then the smallest
 * summed loss, then the most TotalStack rows dominated, then the fewest unfitted):
 *
 *  - **free** — any three;
 *  - **S-61** — the three must keep the bar's order (burn more, hit harder, left to right);
 *  - **SW** — the three must keep the sweet spot, the bar's recommendation;
 *  - **S-61 + SW** — both.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/147-the-fold.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

/** The ten readings: a name, how a stop reads it, and whether the bar wants it high or low. */
const READINGS = [
  { key: 'damage', head: 'most damage', of: (c: Campaign) => c.damage, want: 'max' },
  { key: 'silver', head: 'least silver', of: (c: Campaign) => c.silver, want: 'min' },
  { key: 'burned', head: 'fewest hired burned', of: (c: Campaign) => c.burned, want: 'min' },
  { key: 'gold', head: 'least gold', of: (c: Campaign) => c.gold, want: 'min' },
  { key: 'coins', head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, want: 'min' },
  { key: 'queue', head: 'shortest queue', of: (c: Campaign) => c.seconds, want: 'min' },
  {
    key: 'perSilver',
    head: 'dmg a silver',
    of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0),
    want: 'max',
  },
  {
    key: 'perMerc',
    head: 'dmg a merc',
    of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned),
    want: 'max',
  },
  {
    key: 'perGold',
    head: 'dmg a gold',
    of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0),
    want: 'max',
  },
  {
    key: 'perCoin',
    head: 'dmg a coin',
    of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0),
    want: 'max',
  },
] as const;
type Reading = (typeof READINGS)[number];

const barBest = (set: Campaign[], r: Reading): number =>
  r.want === 'max' ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
/** How much worse the set is than the pool on this reading, as a positive percent; 0 when not worse. */
const lossOf = (set: number, pool: number, r: Reading): number => {
  if (r.want === 'max') return set < pool - 1e-9 && pool > 0 ? ((pool - set) / pool) * 100 : 0;
  if (set > pool + 1e-9) return pool > 0 ? ((set - pool) / pool) * 100 : 100;
  return 0;
};

const hours = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${String(h)}h ${String(m).padStart(2, '0')}m`;
};
const show = (r: Reading, value: number): string => {
  if (r.key === 'queue') return hours(value);
  if (r.key === 'perSilver') return value.toFixed(3);
  return n(Math.round(value));
};

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};

function subsets<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [head, ...rest] = items as [T, ...T[]];
  return [...subsets(rest, k - 1).map((s) => [head, ...s]), ...subsets(rest, k)];
}

const byBurn = (a: PlanRow, b: PlanRow): number =>
  a.repeat.mercLost - b.repeat.mercLost || a.repeat.silver - b.repeat.silver;
const orderHolds = (rows: PlanRow[]): boolean => {
  const sorted = [...rows].sort(byBurn);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1] as PlanRow;
    const cur = sorted[i] as PlanRow;
    if (cur.pick === 'all-in') continue;
    if (cur.repeat.mercLost <= prev.repeat.mercLost || cur.repeat.damage <= prev.repeat.damage) return false;
  }
  return true;
};

const RULES = ['free', 'S-61', 'SW', 'S-61 + SW'] as const;
type Rule = (typeof RULES)[number];

describe.skipIf(!process.env.THEORY)('the fold', () => {
  it('compares every set of three stops with the pool, on every reading', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('147-the-fold');
    report.add('# 147 — the fold: which three stops to keep, and what each choice costs\n');
    report.add(
      'Pool: every stop the engine offers with the hired saver on everywhere. Codes: **HS** hired saver · ' +
        '**SS** silver saver · **SW** sweet spot · **MM** more mercs · **MX** steady max · **AI** all in. Every ' +
        'figure is the **campaign’s** — four marches, worst opening, the app’s default recovery. In the ' +
        'comparison tables a reading a fold is worse on than the pool carries its loss in **bold**; a reading ' +
        'with no loss is the pool’s own figure.\n',
    );

    /** Per rule: armies it loses nothing on, rows dominated / unfitted, and how often it loses each reading. */
    const tally = Object.fromEntries(
      RULES.map((rule) => [
        rule,
        { lossless: 0, beat: 0, out: 0, lost: {} as Record<string, number>, none: 0 },
      ]),
    ) as Record<
      Rule,
      { lossless: number; beat: number; out: number; lost: Record<string, number>; none: number }
    >;
    let poolBeat = 0;
    let poolOut = 0;
    const armies: string[] = [];

    for (const scenario of scenarios) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          burnSaver: 'silver',
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      const stops = [...plan.alternatives].sort(byBurn);
      if (stops.length === 0) continue;
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(
          asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts),
        );
      }
      const priced = new Map<PlanRow, Campaign>(
        stops.map((stop) => [
          stop,
          campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
        ]),
      );
      const campaigns = (rows: PlanRow[]): Campaign[] => rows.map((row) => priced.get(row) as Campaign);
      const verdict = (
        rows: PlanRow[],
      ): { beat: number; out: number; beaten: Set<string>; fitted: Set<string> } => {
        if (theirs.length === 0) return { beat: 0, out: 0, beaten: new Set(), fitted: new Set() };
        const v = matchedSpend(campaigns(rows) as Contender[], theirs as Contender[]);
        return {
          beat: v.rowsBeaten,
          out: v.unfitted,
          beaten: new Set(v.rows.filter((r) => r.beaten).map((r) => r.theirs.name)),
          fitted: new Set(v.rows.filter((r) => r.ours !== null).map((r) => r.theirs.name)),
        };
      };
      const pool = verdict(stops);
      poolBeat += pool.beat;
      poolOut += pool.out;
      const poolBest = READINGS.map((r) => barBest(campaigns(stops), r));
      const code = (rows: PlanRow[]): string =>
        [...rows]
          .sort(byBurn)
          .map((r) => SHORT[r.pick] ?? r.pick)
          .join(' · ');

      const out: string[] = [`\n## ${scenario.label}\n`];
      // 1. Every stop, every reading.
      out.push(
        '**Every stop the engine found**\n\n| stop | ' +
          READINGS.map((r) => r.head.replace(/^(most|least|fewest|shortest) /, '')).join(' | ') +
          ' | what the bar loses without it |\n|---|' +
          '---:|'.repeat(READINGS.length) +
          '---|',
      );
      for (const stop of stops) {
        const c = priced.get(stop) as Campaign;
        const rest = stops.filter((other) => other !== stop);
        const lost =
          rest.length === 0
            ? []
            : READINGS.map((r, i) => ({
                r,
                loss: lossOf(barBest(campaigns(rest), r), poolBest[i] ?? 0, r),
              })).filter((x) => x.loss > 0);
        const v = verdict(rest);
        const onlyBeats = [...pool.beaten].filter((name) => !v.beaten.has(name)).length;
        const onlyFits = [...pool.fitted].filter((name) => !v.fitted.has(name)).length;
        const words = [
          ...lost.map((x) => `${x.r.head} ${x.loss.toFixed(1)} % worse`),
          ...(onlyBeats > 0 ? [`${String(onlyBeats)} TotalStack row(s) no longer beaten`] : []),
          ...(onlyFits > 0 ? [`${String(onlyFits)} TotalStack row(s) no stop fits any more`] : []),
        ];
        out.push(
          `| ${SHORT[stop.pick] ?? stop.pick} | ${READINGS.map((r) => show(r, r.of(c))).join(' | ')} | ${
            words.length > 0 ? words.join('; ') : '**nothing — foldable**'
          } |`,
        );
      }

      // 2. The folds, beside the pool.
      const scored = (stops.length > 3 ? subsets(stops, 3) : [stops]).map((set) => {
        const values = READINGS.map((r) => barBest(campaigns(set), r));
        const losses = READINGS.map((r, i) => lossOf(values[i] ?? 0, poolBest[i] ?? 0, r));
        const v = verdict(set);
        return {
          set,
          values,
          losses,
          lostCount: losses.filter((x) => x > 0).length,
          lostSum: losses.reduce((s, x) => s + x, 0),
          beat: v.beat,
          out: v.out,
          order: orderHolds(set),
          sweet: set.some((s) => s.pick === 'sweet-spot'),
        };
      });
      scored.sort(
        (a, b) => a.lostCount - b.lostCount || a.lostSum - b.lostSum || b.beat - a.beat || a.out - b.out,
      );
      const allowed = (rule: Rule, s: (typeof scored)[number]): boolean => {
        const needOrder = rule === 'S-61' || rule === 'S-61 + SW';
        const needSweet = rule === 'SW' || rule === 'S-61 + SW';
        return (!needOrder || s.order) && (!needSweet || s.sweet);
      };
      const winners = new Map<(typeof scored)[number], Rule[]>();
      for (const rule of RULES) {
        const win = scored.find((s) => allowed(rule, s));
        const entry = tally[rule];
        if (!win) {
          entry.none += 1;
          continue;
        }
        winners.set(win, [...(winners.get(win) ?? []), rule]);
        entry.beat += win.beat;
        entry.out += win.out;
        if (win.lostCount === 0 && win.beat === pool.beat && win.out === pool.out) entry.lossless += 1;
        win.losses.forEach((loss, i) => {
          const key = READINGS[i]?.head ?? '';
          if (loss > 0) entry.lost[key] = (entry.lost[key] ?? 0) + 1;
        });
      }
      const cell = (value: number, loss: number, r: Reading): string =>
        loss > 0
          ? `**${show(r, value)} (${r.want === 'max' ? '−' : '+'}${loss.toFixed(1)} %)**`
          : show(r, value);
      out.push(
        `\n**${stops.length > 3 ? 'The folds beside the pool' : 'The bar already holds three stops or fewer — nothing to fold'}**\n\n` +
          '| set | rule | ' +
          READINGS.map((r) => r.head).join(' | ') +
          ' | TS dominated | TS no fit | S-61 | SW |\n|---|---|' +
          '---:|'.repeat(READINGS.length) +
          '---:|---:|---|---|',
      );
      out.push(
        `| **pool: ${code(stops)}** | — | ${READINGS.map((r, i) => show(r, poolBest[i] ?? 0)).join(' | ')} | ` +
          `${String(pool.beat)} | ${String(pool.out)} | ${orderHolds(stops) ? '✓' : '✗'} | ${stops.some((s) => s.pick === 'sweet-spot') ? '✓' : '✗'} |`,
      );
      if (stops.length > 3) {
        for (const [s, rules] of winners) {
          out.push(
            `| ${code(s.set)} | ${rules.join(', ')} | ${READINGS.map((r, i) => cell(s.values[i] ?? 0, s.losses[i] ?? 0, r)).join(' | ')} | ` +
              `${s.beat < pool.beat ? `**${String(s.beat)}**` : String(s.beat)} | ${s.out > pool.out ? `**${String(s.out)}**` : String(s.out)} | ` +
              `${s.order ? '✓' : '✗'} | ${s.sweet ? '✓' : '✗'} |`,
          );
        }
        const rest = scored.filter((s) => !winners.has(s));
        if (rest.length > 0) {
          out.push(
            `\n<details><summary>The other ${String(rest.length)} sets of three</summary>\n\n| set | ` +
              READINGS.map((r) => r.head).join(' | ') +
              ' | TS dominated | TS no fit | S-61 | SW |\n|---|' +
              '---:|'.repeat(READINGS.length) +
              '---:|---:|---|---|\n' +
              rest
                .map(
                  (s) =>
                    `| ${code(s.set)} | ${READINGS.map((r, i) => cell(s.values[i] ?? 0, s.losses[i] ?? 0, r)).join(' | ')} | ` +
                    `${String(s.beat)} | ${String(s.out)} | ${s.order ? '✓' : '✗'} | ${s.sweet ? '✓' : '✗'} |`,
                )
                .join('\n') +
              '\n\n</details>',
          );
        }
      }
      armies.push(out.join('\n'));
    }

    report.add('## Across all armies\n');
    report.add(
      `The pool: **${String(poolBeat)}** TotalStack rows dominated, **${String(poolOut)}** no stop fits.\n\n` +
        '| fold rule | armies it loses nothing on | TS dominated | TS no fit | armies with no set allowed | ' +
        READINGS.map((r) => `lost ${r.head}`).join(' | ') +
        ' |\n|---|---:|---:|---:|---:|' +
        '---:|'.repeat(READINGS.length) +
        '\n' +
        RULES.map((rule) => {
          const t = tally[rule];
          return (
            `| ${rule} | ${String(t.lossless)} of ${String(armies.length)} | ${String(t.beat)} | ${String(t.out)} | ${String(t.none)} | ` +
            READINGS.map((r) => String(t.lost[r.head] ?? 0)).join(' | ') +
            ' |'
          );
        }).join('\n') +
        '\n\n“Lost X” counts the armies on which that rule’s three stops read worse than the pool on X.\n',
    );
    report.add(armies.join('\n'));
    report.save();
  }, 3_600_000);
});
