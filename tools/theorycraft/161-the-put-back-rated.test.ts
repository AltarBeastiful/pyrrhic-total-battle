/**
 * 161 — **the put-back rated with `markerRates`** (W11 §2.3 / §5 step 3; the owner, 2026-09-23: *"use
 * markerRates for put-back too"*).
 *
 * The put-back pass (`putBackOn`, `engine/plan.ts`) scored a candidate on silver and the queue alone —
 * `silver saved % / 5 + queue saved % / 10 + damage change %` (`PutBackPolicy.retiredScore`). W11 moves it onto
 * the owner's own rating, `rate(before, after, CAMPAIGN.markerRates)` (`engine/rating.ts`): the queue weighs 40
 * instead of 10, and gold, the hired burn and dragon coins are counted. The two hard rules stay (the put-back
 * recovers faster; it loses at most `damageLossCap` of the damage). The March edit's resize dial (S-117
 * change 3) read the same two rates, so it moves with it; it is measured here separately (§B).
 *
 * Every benchmark army (the common scenarios and, where the export is on disk, the owner's), planned twice —
 * the retired score, then the rating — and read on:
 *
 *  - every stop whose put-back decision differs (taken / refused / another type), with its figures;
 *  - every stop rated with the owner's rating, the rated plan's stop against the retired plan's same stop,
 *    on the campaign bill (damage, silver, gold, hired burned, coins, queue): better / equal / worse;
 *  - the ten readings (the bar's best on each), TotalStack at matched spend, and the bar's own criteria
 *    (order, no stop beaten by another, every hired stack sheltered, at most five stops).
 *
 * Twice over: the rating alone (§A), and the rating with the bar's guard (§A2, `PutBackPolicy.guard`) — a
 * put-back that leaves its stop beaten by another stop is replaced by the best-rated one that does not, or
 * none.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/161-the-put-back-rated.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, planRepeats, resizeMarchOver } from '../../src/engine';
import type { CampaignPlan, PlanRow, PlanTotals, PutBackPolicy, ResizedMarch } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

/** The score the put-back shipped with until W11 (`CAMPAIGN.putBack` of 2026-09-18). */
const RETIRED: PutBackPolicy = {
  ...CAMPAIGN.putBack,
  retiredScore: { silverPerDamage: 5, timePerDamage: 10 },
};
const RATED: PutBackPolicy = { ...CAMPAIGN.putBack, guard: false };
/** The rating plus the bar's guard: a put-back that leaves its stop beaten is replaced or refused. */
const GUARDED: PutBackPolicy = { ...CAMPAIGN.putBack, guard: true };

const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired lost', of: (c: Campaign) => c.burned, high: false },
  { head: 'least gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'shortest queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg a silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg a merc', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg a gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg a coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const barBest = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
const gain = (after: number, before: number, r: Reading): number =>
  before === after
    ? 0
    : before === 0
      ? r.high
        ? 100
        : -100
      : ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const pct = (v: number): string => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} %`;
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return result.stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};

interface Read {
  plan: CampaignPlan;
  stops: { row: PlanRow; c: Campaign; marches: Record<string, number>[] }[];
}

function readPlan(request: StackRequest, putBack: PutBackPolicy): Read | null {
  let plan: CampaignPlan;
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack,
    });
  } catch {
    return null;
  }
  const stops = plan.alternatives.map((row) => {
    const marches = marchesOf(row as PlanTotals);
    return { row, c: campaignOf(request, row.pick, 'plan', marches), marches };
  });
  return { plan, stops };
}

/** The bar's own criteria, as 157 reads them, plus the five-stop ceiling. */
function criteria(request: StackRequest, read: Read): string[] {
  const broken: string[] = [];
  const rows = read.stops;
  const rungs = rows.filter((r) => r.row.pick !== 'all-in');
  for (let i = 1; i < rungs.length; i += 1) {
    const p = rungs[i - 1];
    const q = rungs[i];
    if (
      p &&
      q &&
      (q.row.repeat.mercLost <= p.row.repeat.mercLost || q.row.repeat.damage <= p.row.repeat.damage)
    )
      broken.push(`order at ${short(q.row.pick)}`);
  }
  for (const x of rows) {
    for (const y of rows) {
      if (x === y || x.row.pick === 'all-in' || y.row.pick === 'all-in') continue;
      const dom =
        x.c.damage >= y.c.damage &&
        x.c.silver <= y.c.silver &&
        x.c.burned <= y.c.burned &&
        x.c.gold <= y.c.gold &&
        (x.c.damage > y.c.damage ||
          x.c.silver < y.c.silver ||
          x.c.burned < y.c.burned ||
          x.c.gold < y.c.gold);
      if (dom) broken.push(`${short(x.row.pick)} beats ${short(y.row.pick)}`);
    }
    if (!x.marches.every((m) => sheltered(request, m))) broken.push(`${short(x.row.pick)} unsheltered`);
  }
  if (rows.length > 5) broken.push(`${String(rows.length)} stops`);
  return broken;
}

/** The March pane's caps for a re-size (`plan-resize.test.ts`, `generate.ts`). */
const capsFor = (
  request: StackRequest,
  counts: Record<string, number>,
  repeats: number,
): Record<string, number> => {
  const caps: Record<string, number> = {};
  for (const unit of request.units) {
    if (unit.pool === 'leadership') continue;
    if (unit.pool === 'dominance') {
      const inStop = counts[unit.id] ?? 0;
      caps[unit.id] = Math.max(inStop, Math.floor(request.housing.dominance / Math.max(1, unit.cost)));
      continue;
    }
    const held = request.caps[unit.id];
    caps[unit.id] =
      held === undefined
        ? Math.floor(request.housing.authority / Math.max(1, unit.cost))
        : largestSustained(held, repeats);
  }
  return caps;
};

const tradeOf = (m: ResizedMarch): string =>
  m.traded === undefined
    ? `fill ${String(m.fill)} (no trade)`
    : `fill ${String(m.fill)}: dmg ${pct(m.traded.damage)}, silver saved ${pct(m.traded.silver)}, queue saved ${pct(m.traded.seconds)}`;

describe.skipIf(!process.env.THEORY)('the put-back rated', () => {
  it('plans every benchmark army under both scores and rates every stop', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('161-the-put-back-rated');
    report.add('# 161 — the put-back rated with `markerRates`\n');
    report.add(
      'Every benchmark army planned twice: the put-back scored the retired way (silver 5, queue 10, nothing else) ' +
        'and rated with `CAMPAIGN.markerRates` (silver 5, gold 5, hired 5, coins 8, queue 40). Both keep the hard ' +
        'rules (recovers faster; loses at most 3 % damage). Four-march campaigns, worst opening, default recovery. ' +
        "In the readings **+** is better, **−** worse. A stop's rating is `rate(retired stop, rated stop, markerRates)` " +
        'on the campaign bill, stops matched by pick.\n',
    );
    const bench: { label: string; request: StackRequest; read: Read }[] = [];
    const retiredOf = new Map<string, Read | null>();
    const VARIANTS = [
      { section: 'A', name: 'the put-back rated', policy: RATED },
      { section: 'A2', name: 'the put-back rated, with the bar guard', policy: GUARDED },
    ] as const;
    for (const [index, { section, name, policy }] of VARIANTS.entries()) {
      const first = index === 0;
      const summary: string[] = [
        '| army | put-back decisions changed | stops rated better / equal / worse (worst) | ' +
          READINGS.map((r) => r.head).join(' | ') +
          ' | TS dominated | TS no fit | criteria before | criteria after |\n|---|---|---|' +
          '---|'.repeat(READINGS.length) +
          '---|---|---|---|',
      ];
      const decisions: string[] = [];
      const stopRatings: string[] = [];
      const better: Record<string, number> = {};
      const worse: Record<string, number> = {};
      const totals = {
        cases: 0,
        changed: 0,
        stopsBetter: 0,
        stopsEqual: 0,
        stopsWorse: 0,
        unmatched: 0,
        tsBeatA: 0,
        tsOutA: 0,
        tsBeatB: 0,
        tsOutB: 0,
        brokenA: 0,
        brokenB: 0,
      };
      let worst: { rating: number; where: string } | null = null;

      for (const scenario of scenarios) {
        let a = retiredOf.get(scenario.label);
        if (a === undefined) {
          a = readPlan(scenario.request, RETIRED);
          retiredOf.set(scenario.label, a);
        }
        const b = readPlan(scenario.request, policy);
        if (a === null || b === null || a.stops.length === 0 || b.stops.length === 0) {
          summary.push(`| ${scenario.label.slice(0, 40)} | refused (${a === null ? 'retired' : 'rated'}) |`);
          continue;
        }
        totals.cases += 1;
        if (first) bench.push({ label: scenario.label, request: scenario.request, read: a });
        const label = scenario.label.slice(0, 40);

        // Put-back decisions, stop by stop.
        let changed = 0;
        const picks = [...new Set([...a.stops, ...b.stops].map((s) => s.row.pick))];
        let up = 0;
        let same = 0;
        let down = 0;
        let low: number | null = null;
        for (const pick of picks) {
          const sa = a.stops.find((s) => s.row.pick === pick);
          const sb = b.stops.find((s) => s.row.pick === pick);
          if (!sa || !sb) {
            totals.unmatched += 1;
            stopRatings.push(`| ${label} | ${short(pick)} | only ${sa ? 'retired' : 'rated'} | — |`);
            continue;
          }
          const pa = sa.row.putBack;
          const pb = sb.row.putBack;
          const moved = JSON.stringify(sa.marches) !== JSON.stringify(sb.marches);
          const r = rate(billOf(sa.c), billOf(sb.c), CAMPAIGN.markerRates);
          if (Math.abs(r) < 1e-9) same += 1;
          else if (r > 0) up += 1;
          else down += 1;
          low = low === null ? r : Math.min(low, r);
          if (worst === null || r < worst.rating) worst = { rating: r, where: `${label} · ${short(pick)}` };
          if ((pa?.unitId ?? null) !== (pb?.unitId ?? null) || moved) {
            if ((pa?.unitId ?? null) !== (pb?.unitId ?? null)) changed += 1;
            const note = (p: typeof pa): string =>
              p
                ? `${p.unitId} (dmg ${pct(p.damage)}, silver saved ${pct(p.silver)}, queue saved ${pct(p.seconds)})`
                : 'none';
            decisions.push(
              `| ${label} | ${short(pick)} | ${note(pa)} | ${note(pb)} | ` +
                `${n(Math.round(sa.c.damage))} → ${n(Math.round(sb.c.damage))} | ` +
                `${n(Math.round(sa.c.silver))} → ${n(Math.round(sb.c.silver))} | ` +
                `${n(Math.round(sa.c.gold))} → ${n(Math.round(sb.c.gold))} | ` +
                `${n(sa.c.burned)} → ${n(sb.c.burned)} | ` +
                `${n(Math.round(sa.c.dragonCoins))} → ${n(Math.round(sb.c.dragonCoins))} | ` +
                `${n(Math.round(sa.c.seconds / 3600))} h → ${n(Math.round(sb.c.seconds / 3600))} h | ${r.toFixed(3)} |`,
            );
          }
          if (Math.abs(r) >= 1e-9)
            stopRatings.push(`| ${label} | ${short(pick)} | ${r.toFixed(3)} | ${moved ? 'moved' : '—'} |`);
        }
        totals.changed += changed;
        totals.stopsBetter += up;
        totals.stopsEqual += same;
        totals.stopsWorse += down;

        // The ten readings.
        const ca = a.stops.map((s) => s.c);
        const cb = b.stops.map((s) => s.c);
        const changes = READINGS.map((r) => gain(barBest(cb, r), barBest(ca, r), r));
        READINGS.forEach((r, i) => {
          const c = changes[i] ?? 0;
          if (c > 1e-9) better[r.head] = (better[r.head] ?? 0) + 1;
          if (c < -1e-9) worse[r.head] = (worse[r.head] ?? 0) + 1;
        });

        // TotalStack at matched spend.
        const held = new Set(scenario.request.units.map((unit) => unit.id));
        const theirs: Campaign[] = [];
        for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
          if (!external.name.startsWith('TotalStack')) continue;
          if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
          const row = asCaptured(
            widenedFor(scenario.request, external.counts),
            external.name,
            external.counts,
          );
          if (row.damage > 0) theirs.push(row);
        }
        const va = theirs.length > 0 ? matchedSpend(ca as Contender[], theirs as Contender[]) : null;
        const vb = theirs.length > 0 ? matchedSpend(cb as Contender[], theirs as Contender[]) : null;
        totals.tsBeatA += va?.rowsBeaten ?? 0;
        totals.tsOutA += va?.unfitted ?? 0;
        totals.tsBeatB += vb?.rowsBeaten ?? 0;
        totals.tsOutB += vb?.unfitted ?? 0;

        const ka = criteria(scenario.request, a);
        const kb = criteria(scenario.request, b);
        if (ka.length > 0) totals.brokenA += 1;
        if (kb.length > 0) totals.brokenB += 1;

        summary.push(
          `| ${label} | ${String(changed)} | ${String(up)} / ${String(same)} / ${String(down)} (${low === null ? '—' : low.toFixed(3)}) | ` +
            READINGS.map((_, i) => {
              const c = changes[i] ?? 0;
              return Math.abs(c) > 1e-9 ? `**${pct(c)}**` : '=';
            }).join(' | ') +
            ` | ${va ? `${String(va.rowsBeaten)} → ${String(vb?.rowsBeaten ?? 0)}` : '—'} | ` +
            `${va ? `${String(va.unfitted)} → ${String(vb?.unfitted ?? 0)}` : '—'} | ${ka.join('; ') || '✓'} | ${kb.join('; ') || '✓'} |`,
        );
      }

      report.add(`## ${section}. Every army — ${name} against the retired score\n`);
      report.add(summary.join('\n'));
      report.add(
        `\n\n**${String(totals.changed)}** put-back decisions changed over ${String(totals.cases)} armies. Stops rated ` +
          `(markerRates, rated stop against retired stop): **${String(totals.stopsBetter)} better / ${String(totals.stopsEqual)} ` +
          `equal / ${String(totals.stopsWorse)} worse**` +
          (worst && worst.rating < -1e-9
            ? `; the worst rating ${worst.rating.toFixed(3)} at ${worst.where}`
            : '; no matched stop rated worse') +
          `; ${String(totals.unmatched)} stops on one bar only (listed below — a stop the rating cannot read, ` +
          `because the other bar does not carry it). TotalStack at matched spend (dominated / no stop fits): ` +
          `${String(totals.tsBeatA)} / ${String(totals.tsOutA)} → ${String(totals.tsBeatB)} / ${String(totals.tsOutB)}. ` +
          `Armies with a bar criterion broken: ${String(totals.brokenA)} → ${String(totals.brokenB)}.\n\n` +
          '| reading | armies better | armies worse |\n|---|---:|---:|\n' +
          READINGS.map(
            (r) => `| ${r.head} | ${String(better[r.head] ?? 0)} | ${String(worse[r.head] ?? 0)} |`,
          ).join('\n') +
          '\n',
      );
      report.add(
        '\n### Every stop whose put-back or march moved\n\n' +
          '| army | stop | put-back, retired | put-back, rated | damage | silver | gold | hired lost | coins | queue | rating |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|\n' +
          (decisions.join('\n') || '| — | | | | | | | | | | |') +
          '\n',
      );
      report.add(
        '\n### Every stop the rating does not read equal\n\n| army | stop | rating | march |\n|---|---|---|---|\n' +
          (stopRatings.join('\n') || '| — | | | |') +
          '\n',
      );
    }

    // B. The resize dial (S-117 change 3), on the retired plan's stops: two take-outs a stop, as
    // `plan-resize.test.ts` does, re-sized with the retired score and with the rating.
    let edits = 0;
    let tradesA = 0;
    let tradesB = 0;
    const dial: string[] = [];
    for (const { label, request, read } of bench) {
      const troops = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
      for (const stop of read.plan.alternatives) {
        const fielded = troops.filter((id) => (stop.counts[id] ?? 0) > 0);
        if (fielded.length <= 2) continue;
        const caps = capsFor(request, stop.counts, planRepeats(stop));
        for (const gone of [fielded[0], fielded[fielded.length - 1]]) {
          if (gone === undefined) continue;
          const within = {
            troopIds: fielded.filter((id) => id !== gone),
            hired: caps,
            stop: stop.counts,
            fills: CAMPAIGN.editFills,
          };
          const ra = resizeMarchOver(request, { ...within, putBack: RETIRED });
          const rb = resizeMarchOver(request, { ...within, putBack: RATED });
          if (ra === null || rb === null) continue;
          edits += 1;
          if (ra.traded) tradesA += 1;
          if (rb.traded) tradesB += 1;
          if (ra.fill !== rb.fill || JSON.stringify(ra.counts) !== JSON.stringify(rb.counts))
            dial.push(
              `| ${label.slice(0, 40)} | ${short(stop.pick)} | ${gone} | ${tradeOf(ra)} | ${tradeOf(rb)} | ` +
                `${n(Math.round(ra.damage))} → ${n(Math.round(rb.damage))} | ${n(Math.round(ra.silver))} → ${n(Math.round(rb.silver))} | ` +
                `${n(ra.mercLost)} → ${n(rb.mercLost)} | ${n(Math.round(ra.seconds / 3600))} h → ${n(Math.round(rb.seconds / 3600))} h |`,
            );
        }
      }
    }
    report.add('\n## B. The resize dial (S-117 change 3), moved with it\n');
    report.add(
      `${String(edits)} edits (the first and last fielded troop type taken out of every stop of the retired bar that ` +
        `fields three or more). Trades taken: **${String(tradesA)} → ${String(tradesB)}**; answers that differ: ` +
        `**${String(dial.length)}**.\n\n` +
        '| army | stop | taken out | retired | rated | damage | silver | hired lost | queue |\n|---|---|---|---|---|---|---|---|---|\n' +
        (dial.join('\n') || '| — | | | | | | | | |') +
        '\n',
    );
    report.save();
  }, 7_200_000);
});
