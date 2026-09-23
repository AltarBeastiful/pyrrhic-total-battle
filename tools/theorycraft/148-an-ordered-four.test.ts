/**
 * 148 — **an ordered bar of four** (W10 §9.5, 2026-09-23). The owner, on 147:
 *
 * > *"then lets keep four spots, letting a least silver high damage pass through which should keep the sweet
 * > spot while ensuring we beat everything … what if the sweet spot doesn't offer anything. Can't we compute
 * > that before answering and filtering to our needs. I still think we need a low silver one that's actually
 * > one. Is there really no way to keep the bar ordered?"*
 *
 * 147 chose three stops **from the stops the engine had already picked**, and there the two savers collide:
 * the hired saver burns less and hits harder than the silver saver to its right. But the band holds far more
 * plans than the stops, and an ordered bar may be made of a **different** hired saver or silver saver. So the
 * candidates here are the stops the engine offers **and every plan of the band** (`CampaignPlan.trade`, priced
 * over the whole horizon, tail included), and a bar is chosen by the owner's rules, computed rather than asked:
 *
 *  1. **at most four stops**;
 *  2. **ordered** (S-61): along the burn, every stop burns more and hits harder — `all-in` exempt;
 *  3. **a real low-silver stop**: its least silver within 5 % of the least silver the engine's stops offer;
 *  4. **the sweet spot**, *unless it holds nothing alone* — computed on the pool: when no reading and no
 *     TotalStack row is lost without it, it is not required;
 *  5. **beat everything the pool beats**: every TotalStack row the full pool dominates, still dominated, and
 *     every row it fits inside, still fitted.
 *
 * Among the bars that pass, the one that gives up the fewest of the ten readings (then the least in sum) is
 * taken. Where none passes, the closest is shown with the rules it breaks. Every bar is printed on all ten
 * readings beside the pool — the engine's own stops, unfolded.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/148-an-ordered-four.test.ts`
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

const READINGS = [
  { key: 'damage', head: 'most damage', of: (c: Campaign) => c.damage, want: 'max' },
  { key: 'silver', head: 'least silver', of: (c: Campaign) => c.silver, want: 'min' },
  { key: 'burned', head: 'fewest hired burned', of: (c: Campaign) => c.burned, want: 'min' },
  { key: 'gold', head: 'least gold', of: (c: Campaign) => c.gold, want: 'min' },
  { key: 'coins', head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, want: 'min' },
  { key: 'queue', head: 'shortest queue', of: (c: Campaign) => c.seconds, want: 'min' },
  { key: 'perSilver', head: 'dmg a silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), want: 'max' },
  { key: 'perMerc', head: 'dmg a merc', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), want: 'max' },
  { key: 'perGold', head: 'dmg a gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), want: 'max' },
  {
    key: 'perCoin',
    head: 'dmg a coin',
    of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0),
    want: 'max',
  },
] as const;
type Reading = (typeof READINGS)[number];

const lossOf = (set: number, pool: number, r: Reading): number => {
  if (r.want === 'max') return set < pool - 1e-9 && pool > 0 ? ((pool - set) / pool) * 100 : 0;
  if (set > pool + 1e-9) return pool > 0 ? ((set - pool) / pool) * 100 : 100;
  return 0;
};
const hours = (seconds: number): string => `${n(Math.round(seconds / 3600))} h`;
const show = (r: Reading, value: number): string => {
  if (r.key === 'queue') return hours(value);
  if (r.key === 'perSilver') return value.toFixed(3);
  if (r.key === 'perCoin' && value === 0) return '—';
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
const SILVER_SLACK = 0.05;

interface Candidate {
  name: string;
  row: PlanTotals & { pick?: PlanRow['pick'] };
  campaign: Campaign;
  values: number[];
  beats: Set<string>;
  fits: Set<string>;
}

describe.skipIf(!process.env.THEORY)('an ordered four', () => {
  it('searches the stops and the band for an ordered bar of four by the owner’s rules', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('148-an-ordered-four');
    report.add('# 148 — an ordered bar of four\n');
    report.add(
      'Candidates: the engine’s stops (**HS** hired saver · **SS** silver saver · **SW** sweet spot · **MM** more ' +
        'mercs · **MX** steady max · **AI** all in) and every plan of the band (**b·N**, N its hired burned over ' +
        'the campaign). Rules: ≤ 4 stops · ordered (S-61) · least silver within 5 % of the stops’ own · the sweet ' +
        'spot unless it holds nothing alone · every TotalStack row the pool beats still beaten and every row it ' +
        'fits still fitted. Figures are the campaign’s — four marches, worst opening, default recovery; the ' +
        'queue is one training queue’s total over the four marches, speed bonuses on, no speed-up items. A **bold** ' +
        'figure is worse than the pool.\n',
    );
    const summary: string[] = [
      '| army | pool | the bar chosen | rules broken | readings lost | TS beaten (pool → bar) | TS no fit (pool → bar) | SW needed? |',
      '|---|---|---|---|---|---|---|---|',
    ];
    const details: string[] = [];
    let passed = 0;
    let lossless = 0;
    let armies = 0;

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
          withTrade: true,
        });
      } catch {
        continue;
      }
      const stops = plan.alternatives;
      if (stops.length === 0) continue;
      armies += 1;
      const held = new Set(scenario.request.units.map((unit) => unit.id));
      const theirs: Campaign[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        theirs.push(asCaptured(widenedFor(scenario.request, external.counts), external.name, external.counts));
      }
      const make = (name: string, row: Candidate['row']): Candidate => {
        const campaign = campaignOf(scenario.request, name, 'plan', marchesOf(row));
        const v =
          theirs.length > 0 ? matchedSpend([campaign] as Contender[], theirs as Contender[]) : { rows: [] };
        return {
          name,
          row,
          campaign,
          values: READINGS.map((r) => r.of(campaign)),
          beats: new Set(v.rows.filter((x) => x.beaten).map((x) => x.theirs.name)),
          fits: new Set(v.rows.filter((x) => x.ours !== null).map((x) => x.theirs.name)),
        };
      };
      const stopCands = stops.map((stop) => make(SHORT[stop.pick] ?? stop.pick, stop));
      const seen = new Set(stops.map((stop) => JSON.stringify(stop.counts)));
      const bandCands: Candidate[] = [];
      for (const row of plan.trade ?? []) {
        const key = JSON.stringify(row.counts);
        if (seen.has(key)) continue;
        seen.add(key);
        bandCands.push(make(`b·${String(row.mercLost)}`, row));
      }
      const pool = stopCands;
      const best = (set: Candidate[], i: number): number => {
        const r = READINGS[i] as Reading;
        const xs = set.map((c) => c.values[i] ?? 0);
        return r.want === 'max' ? Math.max(...xs) : Math.min(...xs);
      };
      const poolBest = READINGS.map((_, i) => best(pool, i));
      const union = (set: Candidate[], of: 'beats' | 'fits'): Set<string> => {
        const out = new Set<string>();
        for (const c of set) for (const x of c[of]) out.add(x);
        return out;
      };
      const poolBeats = union(pool, 'beats');
      const poolFits = union(pool, 'fits');
      // Rule 4, computed: does the sweet spot hold anything alone in the pool?
      const sweet = stopCands.find((c) => c.row.pick === 'sweet-spot');
      const sweetNeeded = ((): boolean => {
        if (!sweet) return false;
        const rest = pool.filter((c) => c !== sweet);
        if (rest.length === 0) return true;
        if (READINGS.some((r, i) => lossOf(best(rest, i), poolBest[i] ?? 0, r) > 0)) return true;
        const b = union(rest, 'beats');
        const f = union(rest, 'fits');
        return [...poolBeats].some((x) => !b.has(x)) || [...poolFits].some((x) => !f.has(x));
      })();

      // Prune the band: a band plan no better than some candidate on every reading and every TotalStack row
      // cannot add to a set's readings or rows; it is kept only for the order, which a dominated plan can serve,
      // so the prune is reported rather than hidden.
      const all = [...stopCands, ...bandCands];
      const covers = (a: Candidate, b: Candidate): boolean =>
        READINGS.every((r, i) =>
          r.want === 'max' ? (a.values[i] ?? 0) >= (b.values[i] ?? 0) : (a.values[i] ?? 0) <= (b.values[i] ?? 0),
        ) &&
        [...b.beats].every((x) => a.beats.has(x)) &&
        [...b.fits].every((x) => a.fits.has(x));
      const kept = [
        ...stopCands,
        ...bandCands.filter((b) => !all.some((a) => a !== b && covers(a, b) && !covers(b, a))),
      ];
      const cap = 80;
      const candidates = kept.slice(0, cap);

      const burnOf = (c: Candidate): number => c.row.repeat.mercLost;
      const damageOf = (c: Candidate): number => c.row.repeat.damage;
      const ordered = (set: Candidate[]): boolean => {
        const sorted = [...set].sort((a, b) => burnOf(a) - burnOf(b) || a.row.repeat.silver - b.row.repeat.silver);
        for (let i = 1; i < sorted.length; i += 1) {
          const prev = sorted[i - 1] as Candidate;
          const cur = sorted[i] as Candidate;
          if (cur.row.pick === 'all-in') continue;
          if (burnOf(cur) <= burnOf(prev) || damageOf(cur) <= damageOf(prev)) return false;
        }
        return true;
      };
      const poolLeast = poolBest[1] ?? 0;
      const judge = (set: Candidate[]) => {
        const values = READINGS.map((_, i) => best(set, i));
        const losses = READINGS.map((r, i) => lossOf(values[i] ?? 0, poolBest[i] ?? 0, r));
        const b = union(set, 'beats');
        const f = union(set, 'fits');
        const broken: string[] = [];
        if (!ordered(set)) broken.push('order');
        if ((values[1] ?? 0) > poolLeast * (1 + SILVER_SLACK)) broken.push('low silver');
        if (sweetNeeded && sweet && !set.includes(sweet)) broken.push('sweet spot');
        const lostBeats = [...poolBeats].filter((x) => !b.has(x)).length;
        const lostFits = [...poolFits].filter((x) => !f.has(x)).length;
        if (lostBeats > 0 || lostFits > 0) broken.push('beat everything');
        return {
          set,
          values,
          losses,
          lostCount: losses.filter((x) => x > 0).length,
          lostSum: losses.reduce((s, x) => s + x, 0),
          broken,
          beat: b.size,
          fit: f.size,
        };
      };
      // Every set of one to four candidates.
      const sets: Candidate[][] = [];
      const walk = (start: number, acc: Candidate[]): void => {
        if (acc.length > 0) sets.push([...acc]);
        if (acc.length === 4) return;
        for (let i = start; i < candidates.length; i += 1) {
          acc.push(candidates[i] as Candidate);
          walk(i + 1, acc);
          acc.pop();
        }
      };
      walk(0, []);
      const judged = sets.map(judge);
      judged.sort(
        (a, b) =>
          a.broken.length - b.broken.length ||
          a.lostCount - b.lostCount ||
          a.lostSum - b.lostSum ||
          b.beat - a.beat ||
          b.fit - a.fit ||
          // The owner keeps four stops: at a tie, the fuller bar.
          b.set.length - a.set.length,
      );
      const top = judged[0];
      if (!top) continue;
      // The chosen bar, re-checked with the real matched-spend verdict rather than the per-stop union.
      const real =
        theirs.length > 0
          ? matchedSpend(top.set.map((c) => c.campaign) as Contender[], theirs as Contender[])
          : { rowsBeaten: 0, unfitted: 0 };
      const realPool =
        theirs.length > 0
          ? matchedSpend(pool.map((c) => c.campaign) as Contender[], theirs as Contender[])
          : { rowsBeaten: 0, unfitted: 0 };
      if (top.broken.length === 0) passed += 1;
      if (top.broken.length === 0 && top.lostCount === 0) lossless += 1;
      const code = (set: Candidate[]): string =>
        [...set].sort((a, b) => burnOf(a) - burnOf(b) || a.row.repeat.silver - b.row.repeat.silver).map((c) => c.name).join(' · ');
      summary.push(
        `| ${scenario.label.slice(0, 40)} | ${code(pool)} | ${code(top.set)} | ${top.broken.length > 0 ? top.broken.join(', ') : 'none'} | ` +
          `${top.lostCount > 0 ? READINGS.filter((_, i) => (top.losses[i] ?? 0) > 0).map((r) => r.head).join(', ') : 'none'} | ` +
          `${String(realPool.rowsBeaten)} → ${String(real.rowsBeaten)} | ${String(realPool.unfitted)} → ${String(real.unfitted)} | ${sweetNeeded ? 'yes' : 'no — holds nothing alone'} |`,
      );
      // Detail: every candidate on the chosen bar and in the pool, all ten readings; then the bar beside the pool.
      // And every plan left of the silver saver on the burn: the plans that could stand where the hired saver
      // does without breaking the order, so a conflict can be read plan by plan rather than taken on trust.
      const saverStop = stopCands.find((c) => c.row.pick === 'silver-saver');
      const leftOfSaver = saverStop ? bandCands.filter((c) => burnOf(c) < burnOf(saverStop)) : [];
      const shown = [...new Set([...pool, ...top.set, ...leftOfSaver])].sort(
        (a, b) => burnOf(a) - burnOf(b) || a.row.repeat.silver - b.row.repeat.silver,
      );
      details.push(
        `\n## ${scenario.label}\n\n${String(bandCands.length)} band plans beyond the stops; ${String(kept.length - stopCands.length)} not covered by another, ` +
          `${String(Math.min(cap, kept.length))} candidates searched${kept.length > cap ? ` (**capped** from ${String(kept.length)})` : ''}. ` +
          `Sweet spot needed: **${sweetNeeded ? 'yes' : 'no — it holds nothing alone'}**. ` +
          (saverStop
            ? `Band plans burning less a march than the silver saver (marked ←): ${String(leftOfSaver.length)}.\n\n`
            : '\n\n') +
          '| plan | on the bar | burned a march | damage a march | ' +
          READINGS.map((r) => r.head.replace(/^(most|least|fewest|shortest) /, '')).join(' | ') +
          ' |\n|---|---|---:|---:|' +
          '---:|'.repeat(READINGS.length) +
          '\n' +
          shown
            .map(
              (c) =>
                `| ${c.name}${leftOfSaver.includes(c) ? ' ←' : ''} | ${top.set.includes(c) ? '✓' : ''} | ${String(burnOf(c))} | ${n(Math.round(damageOf(c)))} | ` +
                READINGS.map((r, i) => show(r, c.values[i] ?? 0)).join(' | ') +
                ' |',
            )
            .join('\n') +
          '\n\n| bar | ' +
          READINGS.map((r) => r.head).join(' | ') +
          ' | TS beaten | TS no fit | order |\n|---|' +
          '---:|'.repeat(READINGS.length) +
          '---:|---:|---|\n' +
          `| pool: ${code(pool)} | ${READINGS.map((r, i) => show(r, poolBest[i] ?? 0)).join(' | ')} | ${String(realPool.rowsBeaten)} | ${String(realPool.unfitted)} | ${ordered(pool) ? '✓' : '✗'} |\n` +
          `| **chosen: ${code(top.set)}** | ${READINGS.map((r, i) =>
            (top.losses[i] ?? 0) > 0
              ? `**${show(r, top.values[i] ?? 0)} (${r.want === 'max' ? '−' : '+'}${(top.losses[i] ?? 0).toFixed(1)} %)**`
              : show(r, top.values[i] ?? 0),
          ).join(' | ')} | ${String(real.rowsBeaten)} | ${String(real.unfitted)} | ${ordered(top.set) ? '✓' : '✗'} |` +
          (top.broken.length > 0 ? `\n\n**No bar passes every rule here.** The closest breaks: ${top.broken.join(', ')}.` : ''),
      );
    }
    report.add('## Summary\n');
    report.add(summary.join('\n'));
    report.add(
      `\n\n**Armies where a bar passes every rule:** ${String(passed)} of ${String(armies)}; ` +
        `of those, losing none of the ten readings: ${String(lossless)}.\n`,
    );
    report.add(details.join('\n'));
    report.save();
  }, 3_600_000);
});
