/**
 * 165 — **the hired the plan leaves under its own shelter** (W12 §2b, `docs/plans/the-remaining-gaps.md`).
 *
 * 164 found, on the owner's live camp of 2026-09-18, a march that keeps every rule — every hired stack under the
 * lowest troop stack, hired held to the four-march sustain — and rates **+20.98** against the bar's top stop MX:
 * MM's troops (rider-3 2,441) with arbalester-6 371, bear-5 48, legionary-6 400. The plan never offers it.
 * This experiment finds the step of `planCampaign` that loses it, by measurement, and asks whether other armies
 * have the same gap.
 *
 *  §A the live camp: the bar; the S-97 sheltered maximum the search builds for it; that vector scored on each
 *     shape the search tries (ladders, the sizer, the winner's rungs) and on the tight ladder that defined it;
 *     the finale each gets; the campaign priced four ways (all markers, rated against MX).
 *  §B every army: the bar's top stop against the best **filled** march — a stop's troops with every hired type
 *     filled to its four-march sustain, sheltered (`shelterCounts`), marched four times — and against the
 *     S-97 depth-1 shape (the biggest single-type ladder the leadership pays for, the sustain under it).
 *  §C the engine fix, as measured on a temporary patch of `plan.ts` (worktree, not shipped): recorded figures.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/165-the-hired-the-plan-leaves.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, shelterCounts } from '../../src/engine';
import { enemySquadCount } from '../../src/engine/battle';
import type { CampaignPlan, Effective, PlanTotals } from '../../src/engine/plan';
import {
  DEFAULT_GAP,
  WINNER_RUNGS_DEPTH,
  effectiveTable,
  makeScorer,
  planCampaign,
  rankTroops,
} from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, countsOf, hiredIds, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const MARKERS = [
  ['dmg', (c: Campaign) => c.damage, true],
  ['silver', (c: Campaign) => c.silver, false],
  ['hired', (c: Campaign) => c.burned, false],
  ['gold', (c: Campaign) => c.gold, false],
  ['coins', (c: Campaign) => c.dragonCoins, false],
  ['queue', (c: Campaign) => c.seconds, false],
  ['dmg/silver', (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), true],
  ['dmg/hired', (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), true],
  ['dmg/gold', (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), true],
  ['dmg/coin', (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), true],
] as const;
/** The markers `a` is strictly worse on than `b`. */
const worseOn = (a: Campaign, b: Campaign): string[] =>
  MARKERS.filter(([, of, high]) => (high ? of(a) < of(b) * (1 - 1e-9) : of(a) > of(b) * (1 + 1e-9))).map(
    ([name]) => name,
  );
const HEAD =
  '| dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin |';
const cells = (c: Campaign): string =>
  `${n(Math.round(c.damage))} | ${n(Math.round(c.silver))} | ${n(c.burned)} | ${n(Math.round(c.gold))} | ` +
  `${n(Math.round(c.dragonCoins))} | ${n(Math.round(c.seconds / 3600))} | ` +
  `${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} | ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} | ` +
  `${c.gold > 0 ? n(Math.round(c.damage / c.gold)) : '—'} | ${c.dragonCoins > 0 ? n(Math.round(c.damage / c.dragonCoins)) : '—'} |`;
const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${n(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};
const m2 = (v: number): string => `${(v / 1e6).toFixed(2)}M`;

const plan = (request: StackRequest): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

/** The plan's own view of the hired stock (`planCampaign`): caps, and an unlimited type's own pool. */
function stockOf(
  request: StackRequest,
  table: Effective[],
): {
  stock: Record<string, number>;
  sustain: Record<string, number>;
  unlimited: Set<string>;
} {
  const stock: Record<string, number> = { ...request.caps };
  const sustain: Record<string, number> = { ...request.caps };
  const unlimited = new Set<string>();
  for (const entry of table) {
    if (entry.pool === 'leadership' || request.caps[entry.id] !== undefined) continue;
    unlimited.add(entry.id);
    stock[entry.id] = Math.max(0, Math.floor(request.housing[entry.pool] / Math.max(1, entry.cost)));
    sustain[entry.id] = Infinity;
  }
  return { stock, sustain, unlimited };
}

/** `ladder` in `plan.ts`, as written: rungs 2 % apart over the last `depth` troops, the floor at hp × (1 + gap). */
function ladderOf(
  troops: Effective[],
  depth: number,
  hp: number,
  leadership: number,
): { entry: Effective; count: number }[] {
  const chosen = troops.slice(-depth);
  const floor = hp * (1 + DEFAULT_GAP);
  let used = 0;
  const out = chosen.map((entry, index) => {
    const count = Math.max(1, Math.floor((floor * 1.02 ** (chosen.length - 1 - index)) / entry.hp));
    used += count * entry.cost;
    return { entry, count };
  });
  return used <= leadership ? out : [];
}
/** `biggestFloor` in `plan.ts`: the biggest depth-`k` tight ladder the leadership pays for. */
function biggestLadder(
  troops: Effective[],
  depth: number,
  leadership: number,
): { entry: Effective; count: number }[] {
  const at = (hp: number) => ladderOf(troops, depth, hp, leadership);
  if (at(1).length === 0) return [];
  let high = 1;
  while (high < 1e12 && at(high * 2).length > 0) high *= 2;
  let low = high;
  high *= 2;
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    if (at(mid).length > 0) low = mid;
    else high = mid;
  }
  return at(low);
}

describe.skipIf(!process.env.THEORY)('the hired the plan leaves under its own shelter', () => {
  it('finds the step that loses the filled march, and asks it of every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('165-the-hired-the-plan-leaves');
    report.add('# 165 — the hired the plan leaves under its own shelter\n');
    report.add(
      'W12 §2b. The plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march campaigns priced as ' +
        'the benchmark prices stops (`campaignOf`, worst opening = enemy-first journal), ranked with ' +
        '`rate(top, x, markerRates)` (silver 5, gold 5, hired 5, coins 8, queue 40). Hired stacks are starred. ' +
        'Training bonuses are not applied (W11 §6.1).\n',
    );

    // ---------------------------------------------------------------- §A the live camp
    const live = scenarios.find((s) => s.label.includes('live camp of 2026-09-18'));
    if (live) {
      const request = live.request;
      const p = plan(request);
      if (!p) throw new Error('the live camp refused');
      const stops = p.alternatives.map((row) => {
        const marches = marchesOf(row as PlanTotals);
        return { pick: row.pick, marches, c: campaignOf(request, row.pick, 'plan', marches) };
      });
      const top = stops.reduce((a, b) => (b.c.damage > a.c.damage ? b : a));
      const table = effectiveTable(request);
      const troops = rankTroops(table);
      const mercTypes = table.filter((e) => e.pool !== 'leadership');
      const { stock, sustain, unlimited } = stockOf(request, table);
      const leadership = request.housing.leadership;
      const repeats = HORIZON - 1;
      const anchor = (id: string): number =>
        unlimited.has(id) ? (stock[id] ?? 0) : largestSustained(stock[id] ?? 0, repeats);

      report.h('A. The owner’s live camp of 2026-09-18');
      report.add(`**The bar.** Top = **${short(top.pick)}**. Every marker, four marches:\n`);
      const barLines = [
        `| stop | first march | ${HEAD.slice(2)} rating vs ${short(top.pick)} |`,
        `|---|---|${'---:|'.repeat(11)}`,
      ];
      for (const s of stops)
        barLines.push(
          `| ${short(s.pick)} | ${marchText(request, s.marches[0] ?? {})} | ${cells(s.c)} ${rate(billOf(top.c), billOf(s.c), RATES).toFixed(2)} |`,
        );
      report.add(barLines.join('\n'));

      // The S-97 sheltered maximum at depth 1, as `shelteredMaxima` builds it.
      const big = biggestLadder(troops, 1, leadership);
      const floorHp = Math.min(...big.map((r) => r.count * r.entry.hp));
      const vector: Record<string, number> = {};
      for (const e of mercTypes)
        vector[e.id] = Math.max(0, Math.min(anchor(e.id), Math.ceil(floorHp / Math.max(1, e.hp)) - 1));
      const winnerTroops = Object.fromEntries(
        Object.entries(p.march.counts).filter(
          ([id]) => table.find((e) => e.id === id)?.pool === 'leadership',
        ),
      );
      const winnerRungs = Object.entries(winnerTroops).map(([id, count]) => ({
        entry: table.find((e) => e.id === id) as Effective,
        count,
      }));
      const topHired = Math.max(...mercTypes.map((e) => (vector[e.id] ?? 0) * e.hp));
      report.add(
        `\n**Step 1 — the vector exists.** The S-97 pass (\`shelteredMaxima\`, depth 1) builds the biggest one-type tight ladder ` +
          `the leadership pays for — ${marchText(request, Object.fromEntries(big.map((r) => [r.entry.id, r.count])))}, floor ${m2(floorHp)} HP — ` +
          `and fills every hired type to \`min(anchor at ${String(repeats)} repeats, ceil(floor / hp) − 1)\`: ` +
          `**${marchText(request, vector)}**. It burns ${String(mercTypes.reduce((t, e) => t + chunks(vector[e.id] ?? 0), 0))} chunks a march, ` +
          `above the winner’s own burn, so the pass hands it to \`sweep\` (\`evaluateVector\` + the winner’s rungs). ` +
          `The ladder-family entries carry **no shape**, so the pass never scores the ladder that defined them (\`if (!shape) continue\`).\n`,
      );

      const score = (winner: { entry: Effective; count: number }[]) =>
        makeScorer({
          troops,
          mercTypes,
          stock,
          leadership,
          housing: request.housing,
          enemyStacks: enemySquadCount(request.enemy),
          gap: DEFAULT_GAP,
          finale: true,
          winnerRungs: () => winner,
          sustain,
        });
      const s0 = score(winnerRungs);
      const lines = [
        '| shape tried on the vector | what it fields (repeat) | repeat dmg | finale dmg | search total (3 + finale) | why |',
        '|---|---|---:|---:|---:|---|',
      ];
      let laddersScored = 0;
      for (let depth = 1; depth <= 8; depth += 1)
        for (const growth of [1, 1.25, 1.5, 1.8, 2.2, 2.6, 3.2, 4, 5, 6])
          if (s0(repeats, vector, depth, growth)) laddersScored += 1;
      lines.push(
        `| ladders, depth 1–8 × 10 growths (\`ladder\`) | — | — | — | — | ${String(laddersScored)} of 80 affordable: the floor is set at (1 + gap) × the biggest hired stack = ` +
          `${m2(topHired * (1 + DEFAULT_GAP))} HP, above the biggest floor the leadership pays for (${m2(floorHp)}) |`,
      );
      for (const [method, flags, tag] of [
        ['elite', {}, 'sizer Elite'],
        ['ms', {}, 'sizer MS'],
        ['ms', { relaxedPreservation: true }, 'sizer MS relaxed'],
      ] as const) {
        const caps = { ...request.caps, ...vector };
        const sized = countsOf(
          sizeStacks({ ...request, caps, options: { ...request.options, method, ...flags } }),
        );
        const sheltered = shelterCounts(request, sized);
        const c = campaignOf(request, tag, 'plan', [sheltered]);
        lines.push(
          `| ${tag} over every troop type, the vector as caps, sheltered | ${marchText(request, Object.fromEntries(Object.entries(sheltered).filter(([id]) => hiredIds(request).includes(id))))} | ${m2(c.damage)} | | | the sizer’s own floor is low (many stacks), so the vector is lowered back |`,
        );
      }
      const w = s0(repeats, vector, WINNER_RUNGS_DEPTH, 1);
      lines.push(
        `| the winner’s rungs (\`WINNER_RUNGS_DEPTH\`): ${marchText(request, winnerTroops)} | ${w ? marchText(request, Object.fromEntries(w.mercs.map((m) => [m.entry.id, m.count]))) : '—'} | ${w ? m2(w.march.damage) : '—'} | ${w?.finale ? m2(w.finale.march.damage) : '—'} | ${w ? m2(w.total) : '—'} | the winner is the multi-stack march \`consider\` prefers; its floor shelters under half of the vector |`,
      );
      const own = score(big)(repeats, vector, WINNER_RUNGS_DEPTH, 1);
      lines.push(
        `| **its own ladder**: ${marchText(request, Object.fromEntries(big.map((r) => [r.entry.id, r.count])))} (never tried) | ${own ? marchText(request, Object.fromEntries(own.mercs.map((m) => [m.entry.id, m.count]))) : '—'} | ${own ? m2(own.march.damage) : '—'} | ${own?.finale ? m2(own.finale.march.damage) : '—'} | ${own ? m2(own.total) : '—'} | fits: every hired stack under the one troop stack (this scorer carries no sizer, so no finale here; the plan’s is the whole-army sizer’s, Step 3) |`,
      );
      report.add('**Step 2 — every shape the search scores it on loses it.**\n');
      report.add(lines.join('\n'));

      // Step 3 — the finale, and the campaign priced four ways.
      const ownRepeat: Record<string, number> = {
        ...Object.fromEntries(big.map((r) => [r.entry.id, r.count])),
        ...Object.fromEntries((own?.mercs ?? []).map((m) => [m.entry.id, m.count])),
      };
      const planFinale: Record<string, number> = own?.finale
        ? Object.fromEntries([...own.finale.rungs, ...own.finale.mercs].map((m) => [m.entry.id, m.count]))
        : // No sizer in this scorer's context, so no finale of its own: the plan's finale for this vector is the
          // whole-army sizer's, the same march as the bar's own last (measured on the patched engine, §C).
          (top.marches[top.marches.length - 1] ?? {});
      const leftovers: Record<string, number> = {};
      for (const e of mercTypes)
        leftovers[e.id] = unlimited.has(e.id)
          ? (stock[e.id] ?? 0)
          : (stock[e.id] ?? 0) - repeats * chunks(ownRepeat[e.id] ?? 0);
      const ownFinale = shelterCounts(request, {
        ...Object.fromEntries(biggestLadder(troops, 1, leadership).map((r) => [r.entry.id, r.count])),
        ...leftovers,
      });
      const target = { 'rider-3': 2441, 'arbalester-6': 371, 'bear-5': 48, 'legionary-6': 400 };
      const sustained4: Record<string, number> = {
        ...Object.fromEntries(big.map((r) => [r.entry.id, r.count])),
      };
      for (const e of mercTypes)
        sustained4[e.id] = unlimited.has(e.id)
          ? (stock[e.id] ?? 0)
          : largestSustained(stock[e.id] ?? 0, HORIZON);
      const sustained4Sheltered = shelterCounts(request, sustained4);
      const rows: { name: string; marches: Record<string, number>[] }[] = [
        { name: `bar ${short(top.pick)} (3 repeats + its finale)`, marches: top.marches },
        {
          name: 'the vector on its own ladder, 3 repeats + the finale the plan builds (the fix)',
          marches: [ownRepeat, ownRepeat, ownRepeat, planFinale],
        },
        {
          name: 'the same, the finale on its own ladder too (leftovers sheltered)',
          marches: [ownRepeat, ownRepeat, ownRepeat, ownFinale],
        },
        { name: '164’s march, 4 equal marches', marches: [target, target, target, target] },
        {
          name: 'its own ladder, 4-march sustain, 4 equal marches',
          marches: [sustained4Sheltered, sustained4Sheltered, sustained4Sheltered, sustained4Sheltered],
        },
      ];
      report.add(
        `\n**Step 3 — the finale, and how the plan prices a campaign.** The plan plays ${String(repeats)} repeats at the ` +
          `three-repeat sustain (arbalester ${String(anchor('arbalester-6'))}) and a **finale** of what is left (\`finaleFor\`). ` +
          `The finale’s ladders are sized off the biggest **leftover** stack (here legionary ${n(leftovers['legionary-6'] ?? 0)}, ` +
          `${m2((leftovers['legionary-6'] ?? 0) * (table.find((e) => e.id === 'legionary-6')?.hp ?? 0))} HP) × (1 + gap): none is affordable, ` +
          'so the finale is the whole-army sizer’s, which fields a token of hired. The finale is the same ' +
          'for every candidate of one vector, bar MX included. Unlimited bears: the plan reads stock = pool / cost ' +
          `(${String(stock['bear-5'] ?? 0)}) and sustain ∞; 164 read ${String(stock['bear-5'] ?? 0)} — the same count. ` +
          'Four equal marches at the four-march sustain (164) and 3 + finale at the three-repeat sustain (the plan) burn ' +
          'the stock alike; the gap between them is the finale alone.\n',
      );
      const pr = [
        `| campaign | marches (first · last) | ${HEAD.slice(2)} rating vs ${short(top.pick)} | worse than ${short(top.pick)} on |`,
        `|---|---|${'---:|'.repeat(11)}---|`,
      ];
      for (const row of rows) {
        const c = campaignOf(request, row.name, 'plan', row.marches);
        pr.push(
          `| ${row.name} | ${marchText(request, row.marches[0] ?? {})} · ${marchText(request, row.marches[row.marches.length - 1] ?? {})} | ${cells(c)} ${rate(billOf(top.c), billOf(c), RATES).toFixed(2)} | ${worseOn(c, top.c).join(', ') || '—'} |`,
        );
      }
      report.add(pr.join('\n'));
      const journal = (counts: Record<string, number>): string => {
        const { result, summary } = planMarch(request, counts);
        const ef = summary.journals.enemyFirst.entries;
        return result.stacks
          .map(
            (s) =>
              `${s.unitId}${s.pool === 'leadership' ? '' : '*'} ${m2(s.totalHp)}HP→${String(ef.filter((e) => e.actor === 'army' && e.unitId === s.unitId).length)}`,
          )
          .join(' · ');
      };
      report.add(
        `\nJournal (enemy first), the fix’s repeat: ${journal(ownRepeat)}. No hired stack is wiped before it strikes.\n`,
      );
    }

    // ---------------------------------------------------------------- §B every army
    report.h('B. Every army: the top stop against the best filled march');
    report.add(
      '**filled** = a stop’s first-march troops, every hired type at its four-march sustain (`largestSustained(cap, 4)`; ' +
        'an unlimited type at pool / cost, as 164), sheltered (`shelterCounts`), marched four times; the best of the ' +
        'stops by `rate(top, x)`. **S-97 d1** = the biggest one-type tight ladder the leadership pays for, the sustain ' +
        'sheltered under it, four times — the shape the fix scores. TS kept = TotalStack rows every stop deals less ' +
        'than and rates ≤ 0 against (162’s test), for the bar and for the bar plus that march. Criteria on the filled ' +
        'march: sheltered (yes by construction), sustained 4 marches, fields every held hired type (S-58 B).\n',
    );
    const summary = [
      '| army | top | top dmg / hired | best filled (from) | dmg / hired | rating vs top | rating vs its own stop | worse than top on | S-97 d1 dmg / hired | S-97 d1 rating | TS kept bar → +filled → +d1 | filled fields every type |',
      '|---|---|---:|---|---:|---:|---:|---|---:|---:|---:|---|',
    ];
    const markerLines = [
      `| army | march | ${HEAD.slice(2)} rating vs top |`,
      `|---|---|${'---:|'.repeat(11)}`,
    ];
    for (const scenario of scenarios) {
      const label = scenario.label.slice(0, 44);
      const request = scenario.request;
      const p = plan(request);
      if (!p || p.alternatives.length === 0) {
        summary.push(`| ${label} | refused | | | | | | | | | | |`);
        continue;
      }
      const stops = p.alternatives.map((row) => {
        const marches = marchesOf(row as PlanTotals);
        return { pick: row.pick, marches, c: campaignOf(request, row.pick, 'plan', marches) };
      });
      const top = stops.reduce((a, b) => (b.c.damage > a.c.damage ? b : a));
      const mercs = hiredIds(request);
      const table = effectiveTable(request);
      const { stock, unlimited } = stockOf(request, table);
      const sus: Record<string, number> = {};
      for (const id of mercs)
        sus[id] = unlimited.has(id) ? (stock[id] ?? 0) : largestSustained(stock[id] ?? 0, HORIZON);
      const four = (counts: Record<string, number>) => [counts, counts, counts, counts];
      const fill = (troopsOf: Record<string, number>): Record<string, number> =>
        Object.fromEntries(
          Object.entries(shelterCounts(request, { ...troopsOf, ...sus })).filter(([, c]) => c > 0),
        );
      let best: { from: string; counts: Record<string, number>; c: Campaign; r: number; own: number } | null =
        null;
      for (const s of stops) {
        const troopsOnly = Object.fromEntries(
          Object.entries(s.marches[0] ?? {}).filter(([id]) => !mercs.includes(id)),
        );
        const counts = fill(troopsOnly);
        if (!mercs.some((id) => (counts[id] ?? 0) > 0)) continue;
        const c = campaignOf(request, `${short(s.pick)} filled`, 'plan', four(counts));
        const r = rate(billOf(top.c), billOf(c), RATES);
        if (!best || r > best.r)
          best = { from: short(s.pick), counts, c, r, own: rate(billOf(s.c), billOf(c), RATES) };
      }
      const troops = rankTroops(table);
      const d1Rungs = biggestLadder(troops, 1, request.housing.leadership);
      const d1Counts =
        d1Rungs.length > 0 ? fill(Object.fromEntries(d1Rungs.map((r) => [r.entry.id, r.count]))) : {};
      const d1 = mercs.some((id) => (d1Counts[id] ?? 0) > 0)
        ? campaignOf(request, 'S-97 d1', 'plan', four(d1Counts))
        : null;
      const d1r = d1 ? rate(billOf(top.c), billOf(d1), RATES) : NaN;
      // TotalStack rows kept, 162's test.
      const held = new Set(request.units.map((u) => u.id));
      const ts = [...scenario.externals, ...totalstackRows(scenario.label)]
        .filter(
          (e) =>
            e.name.startsWith('TotalStack') &&
            !Object.entries(e.counts).some(([id, c]) => c > 0 && !held.has(id)),
        )
        .map((e) => asCaptured(widenedFor(request, e.counts), e.name, e.counts))
        .filter((row) => row.damage > 0);
      const keptBy = (set: Campaign[]): number =>
        ts.filter((row) =>
          set.every((s) => s.damage < row.damage && rate(billOf(row), billOf(s), RATES) <= 0),
        ).length;
      const bar = stops.map((s) => s.c);
      const keptBar = keptBy(bar);
      const keptFilled = best && best.r > 0 ? keptBy([...bar, best.c]) : keptBar;
      const keptD1 = d1 && d1r > 0 ? keptBy([...bar, d1]) : keptBar;
      const stocked = mercs.filter((id) => (stock[id] ?? 0) > 0);
      summary.push(
        `| ${label} | ${short(top.pick)} | ${m2(top.c.damage)} / ${n(top.c.burned)} | ${best ? best.from : '—'} | ${best ? `${m2(best.c.damage)} / ${n(best.c.burned)}` : '—'} | ` +
          `**${best ? best.r.toFixed(2) : '—'}** | ${best ? best.own.toFixed(2) : '—'} | ${best ? worseOn(best.c, top.c).join(', ') || '—' : ''} | ${d1 ? `${m2(d1.damage)} / ${n(d1.burned)}` : '—'} | ` +
          `${Number.isFinite(d1r) ? d1r.toFixed(2) : '—'} | ${String(keptBar)} → ${String(keptFilled)} → ${String(keptD1)} of ${String(ts.length)} | ` +
          `${best ? (stocked.every((id) => (best.counts[id] ?? 0) > 0) ? 'yes' : `no (${stocked.filter((id) => !(best.counts[id] ?? 0)).join(', ')})`) : ''} |`,
      );
      markerLines.push(
        `| ${label} | top ${short(top.pick)}: ${marchText(request, top.marches[0] ?? {})} | ${cells(top.c)} 0 |`,
      );
      if (best)
        markerLines.push(
          `| ${label} | filled (${best.from}): ${marchText(request, best.counts)} | ${cells(best.c)} ${best.r.toFixed(2)} |`,
        );
      if (d1)
        markerLines.push(
          `| ${label} | S-97 d1: ${marchText(request, d1Counts)} | ${cells(d1)} ${d1r.toFixed(2)} |`,
        );
    }
    report.add(summary.join('\n'));
    report.add('\n**Every marker**, four marches:\n');
    report.add(markerLines.join('\n'));

    // ---------------------------------------------------------------- §C the engine fix, measured on a patch
    report.h('C. The engine fix, measured on a temporary patch (worktree of 164a67c, not shipped)');
    report.add(
      'Patch: in the S-97 pass (`planCampaign`, *the top of the bar*), each **ladder-family** sheltered maximum ' +
        '(`shelteredMaxima`, depth k) is also scored through the scorer on **the tight ladder that defined it** ' +
        '(the winner-rungs path with those rungs), and `consider`ed under the same freeze. Three variants, 17 armies, ' +
        'every stop rated against the same pick before the patch (`rate(before, after)`):\n\n' +
        '| variant | live camp top | live camp stops vs before | other armies | TS kept (all armies) |\n|---|---|---|---|---:|\n' +
        '| 1. own-ladder shape, ungated | MX 40.09M / 268, **+13.72** | MM +1.64, rest 0 | evening account: MX 43.13M / 331, −132.74, AI dropped; Aydae alone: MX 20.79M / 172, −75.01, AI dropped (unlimited legionaries filled to the floor: 903 and 418) | 7 → 6 |\n' +
        '| 2. = 1 + finale on the biggest ladder, leftovers sheltered (`finaleFor`) | MX 49.19M / 344, **+23.76** | HS −158.67, SW −11.83, SS +27.93, MM +13.64 | 7 000 export HS −4.12, SW −1.61; localStorage camp HS −219.94, SS −76.94, SW −65.75; message camp SS −6.51 | 7 → 6 |\n' +
        '| **3. = 1, admitted only when it rates > 0 against the search’s highest-damage candidate** (`rate`, `markerRates`) | MX **40.09M / 268, +13.72** (rider-3 2,486, arbalester-6 403*, bear-5 49*, legionary-6 408*) | MM +1.64 (21 bears where 10), rest 0.00 | **every stop of the 16 others: 0.00** | **7 → 6** (live camp 3 → 2) |\n',
    );
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 1_800_000);
});
