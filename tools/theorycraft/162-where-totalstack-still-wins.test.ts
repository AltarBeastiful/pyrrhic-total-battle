/**
 * 162 — **where TotalStack still wins** (owner, 2026-09-23: *"review the lines where TotalStack still beats us
 * and no plan has better damage or rating (using our function)"*).
 *
 * Every benchmark army (the set of 157 / 160), the plan as shipped (`CAMPAIGN.planFixes`, retype on,
 * `CAMPAIGN.putBack`). Every TotalStack row is priced as the benchmark prices it (`asCaptured` over the
 * four-march campaign, worst opening). A row is **kept** when every stop on the bar
 *
 *  (a) deals less campaign damage than the row, **and**
 *  (b) rates `rate(row, stop, CAMPAIGN.markerRates) ≤ 0` — the stop is not better by the owner's rating.
 *
 * For each kept row: its march and bill, our closest stop (the best-rated against it), the gap, the markers
 * the row wins on — then the levers, each measured rather than argued:
 *
 *  - **L0 reading** — the row's marches priced through the engine's own `planMarch` (`marchResult`, which
 *    builds its own stacks) instead of the benchmark's `price`;
 *  - **L1 shelter** — the row with its hired stacks sheltered under its troop floor (`shelterCounts`), the
 *    rule every march we offer obeys;
 *  - **L2 re-type** — each distinct march of the row handed to `retypeMarch` (hired kept, damage held);
 *  - **L3 re-size** — `resizeMarchOver` over the row's own troop types with the row's hired counts as caps
 *    (and the row itself as the `stop`): our shapes on its type set;
 *  - **L4 frontier** — the plan's own frontier (`withFrontier`): the best-rated plan the search summarised
 *    against the row, and whether the band kept it / the bar offered it;
 *  - the rules a plan of ours obeys, read on the row: sheltered, fields every held hired type (S-58 B),
 *    sustained over the horizon at its first march's count, troop stacks ≥ the band's floor.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/162-where-totalstack-still-wins.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, resizeMarchOver, shelterCounts } from '../../src/engine';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import { retypeMarch } from '../../src/engine/retype';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
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
/** The markers `a` is strictly better on than `b`. */
const winsOn = (a: Campaign, b: Campaign): string[] =>
  MARKERS.filter(([, of, high]) => (high ? of(a) > of(b) * (1 + 1e-9) : of(a) < of(b) * (1 - 1e-9))).map(
    ([name]) => name,
  );
const bill = (c: Campaign): string =>
  `dmg ${n(Math.round(c.damage))} · silver ${n(Math.round(c.silver))} · hired ${n(c.burned)} · gold ${n(Math.round(c.gold))} · ` +
  `coins ${n(Math.round(c.dragonCoins))} · queue ${n(Math.round(c.seconds / 3600))} h · ` +
  `dmg/silver ${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} · dmg/hired ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} · ` +
  `dmg/gold ${c.gold > 0 ? n(Math.round(c.damage / c.gold)) : '—'} · dmg/coin ${c.dragonCoins > 0 ? n(Math.round(c.damage / c.dragonCoins)) : '—'}`;
const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${n(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};

/** The shape of one march, as the battle stacks it. */
interface Shape {
  troopTypes: string[];
  troopHp: number[];
  hiredHp: number[];
  hired: number;
  /** Lowest troop stack HP over highest hired stack HP; > 1 is sheltered. */
  margin: number;
  leadership: number;
}
function shapeOf(request: StackRequest, counts: Record<string, number>): Shape {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  const hired = result.stacks.filter((s) => s.pool !== 'leadership');
  const floor = troops.length > 0 ? Math.min(...troops.map((s) => s.totalHp)) : 0;
  const top = hired.length > 0 ? Math.max(...hired.map((s) => s.totalHp)) : 0;
  return {
    troopTypes: troops.map((s) => s.unitId),
    troopHp: troops.map((s) => Math.round(s.totalHp)),
    hiredHp: hired.map((s) => Math.round(s.totalHp)),
    hired: hired.reduce((sum, s) => sum + s.count, 0),
    margin: top > 0 ? floor / top : Infinity,
    leadership: result.pools.leadership.used,
  };
}

const plan = (request: StackRequest): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withFrontier: true,
    });
  } catch {
    return undefined;
  }
};

interface Kept {
  army: string;
  name: string;
  ts: Campaign;
  tsMarches: Record<string, number>[];
  closest: { pick: string; c: Campaign; rating: number; first: Record<string, number> };
  levers: Record<string, unknown>;
  cause: string;
}

describe.skipIf(!process.env.THEORY)('where TotalStack still wins', () => {
  it('keeps the rows no stop beats on damage or rating, and measures why', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('162-where-totalstack-still-wins');
    report.add('# 162 — where TotalStack still wins\n');
    report.add(
      'Every benchmark army, the plan as shipped (`CAMPAIGN.planFixes` with `retype: rated`, `CAMPAIGN.putBack`), ' +
        'four-march campaigns, worst opening. A TotalStack row (priced as the benchmark prices it: `asCaptured`, ' +
        'the captured march replayed while its stock lasts) is **kept** when every stop deals less damage than it ' +
        '**and** rates `rate(row, stop, markerRates) ≤ 0` (silver 5, gold 5, hired 5, coins 8, queue 40). ' +
        'Hired stacks are starred in the marches.\n',
    );
    const summary: string[] = [
      '| army | stops | TS rows | dominated at matched spend | no stop fits | beaten on damage or rating | **kept** |\n|---|---:|---:|---:|---:|---:|---:|',
    ];
    const kept: Kept[] = [];
    const totals = { rows: 0, dominated: 0, unfitted: 0, kept: 0 };

    for (const scenario of scenarios) {
      const label = scenario.label.slice(0, 44);
      const request = scenario.request;
      const p = plan(request);
      if (!p || p.alternatives.length === 0) {
        summary.push(`| ${label} | refused | | | | | |`);
        continue;
      }
      const stops = p.alternatives.map((row) => {
        const marches = marchesOf(row as PlanTotals);
        return { pick: row.pick, marches, c: campaignOf(request, row.pick, 'plan', marches) };
      });
      const held = new Set(request.units.map((unit) => unit.id));
      const theirs: {
        name: string;
        counts: Record<string, number>;
        c: Campaign;
        marches: Record<string, number>[];
      }[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const wide = widenedFor(request, external.counts);
        const row = asCaptured(wide, external.name, external.counts);
        if (row.damage <= 0) continue;
        // asCaptured's marches, rebuilt the same way (the stock clamps each hired stack march by march).
        const mercIds = hiredIds(wide);
        const caps = { ...wide.caps };
        for (const id of mercIds)
          if (caps[id] !== undefined) caps[id] = Math.max(caps[id], external.counts[id] ?? 0);
        const marches: Record<string, number>[] = [];
        for (let i = 0; i < HORIZON; i += 1) {
          const march = { ...external.counts };
          for (const id of mercIds) {
            const cap = caps[id];
            if (cap !== undefined) march[id] = Math.min(march[id] ?? 0, cap);
          }
          marches.push(march);
          for (const id of mercIds)
            if (caps[id] !== undefined) caps[id] = Math.max(0, caps[id] - chunks(march[id] ?? 0));
        }
        theirs.push({ name: external.name, counts: external.counts, c: row, marches });
      }
      const ms =
        theirs.length > 0
          ? matchedSpend(stops.map((s) => s.c) as Contender[], theirs.map((t) => t.c) as Contender[])
          : null;
      totals.rows += theirs.length;
      totals.dominated += ms?.rowsBeaten ?? 0;
      totals.unfitted += ms?.unfitted ?? 0;
      let keptHere = 0;
      let beatenHere = 0;
      const frontier = (p.frontier ?? []).map((row) => ({
        row,
        c: campaignOf(request, row.label, 'plan', marchesOf(row)),
      }));
      for (const t of theirs) {
        const rated = stops.map((s) => ({ s, r: rate(billOf(t.c), billOf(s.c), RATES) }));
        const beaten = rated.some(({ s, r }) => s.c.damage >= t.c.damage || r > 0);
        if (beaten) {
          beatenHere += 1;
          continue;
        }
        keptHere += 1;
        const best = rated.reduce((a, b) => (b.r > a.r ? b : a));
        const levers: Record<string, unknown> = {};
        const tsBill = billOf(t.c);
        const ratedCampaign = (
          name: string,
          marches: Record<string, number>[],
        ): { c: Campaign; r: number } => {
          const c = campaignOf(request, name, 'plan', marches);
          return { c, r: rate(tsBill, billOf(c), RATES) };
        };
        // L0: the engine's own pricing of the same marches.
        let l0Damage = 0;
        let l0Silver = 0;
        let l0Seconds = 0;
        let l0Gold = 0;
        for (const m of t.marches) {
          const { summary: s } = planMarch(request, m);
          l0Damage += s.minDamage;
          l0Silver += s.recovery.silver;
          l0Gold += s.recovery.gold;
          l0Seconds += s.recovery.seconds;
        }
        levers.L0 = {
          damage: l0Damage / t.c.damage - 1,
          silver: t.c.silver > 0 ? l0Silver / t.c.silver - 1 : 0,
          gold: t.c.gold > 0 ? l0Gold / t.c.gold - 1 : 0,
          seconds: t.c.seconds > 0 ? l0Seconds / t.c.seconds - 1 : 0,
        };
        // Shape and the rules.
        const shape = shapeOf(request, t.counts);
        const ourShape = shapeOf(request, best.s.marches[0] ?? {});
        const stocked = request.units.filter((u) => u.pool === 'authority' && (request.caps[u.id] ?? 0) > 0);
        const missingTypes = stocked.filter((u) => (t.counts[u.id] ?? 0) <= 0).map((u) => u.id);
        const unsustained = request.units
          .filter((u) => u.pool === 'authority' && request.caps[u.id] !== undefined)
          .filter((u) => (t.counts[u.id] ?? 0) > largestSustained(request.caps[u.id] ?? 0, HORIZON))
          .map(
            (u) =>
              `${u.id} ${String(t.counts[u.id])}>${String(largestSustained(request.caps[u.id] ?? 0, HORIZON))}`,
          );
        levers.rules = {
          sheltered: shape.margin > 1,
          margin: shape.margin,
          missingTypes,
          unsustained,
          troopStacks: shape.troopTypes.length,
          campaignClamped: JSON.stringify(t.marches[0]) !== JSON.stringify(t.marches[t.marches.length - 1]),
        };
        levers.shape = { ts: shape, ours: ourShape };
        // L1 shelter.
        const shelteredMarches = t.marches.map((m) => shelterCounts(request, m));
        const l1 = ratedCampaign('sheltered', shelteredMarches);
        levers.L1 = {
          damage: l1.c.damage / t.c.damage - 1,
          rating: l1.r,
          beatsBest: l1.c.damage > best.s.c.damage,
          hiredCut: t.c.burned - l1.c.burned,
          stillKept: l1.c.damage > Math.max(...stops.map((s) => s.c.damage)),
        };
        // L2 retype.
        const retyped = t.marches.map((m) => retypeMarch(request, m, RATES)?.counts ?? m);
        const l2 = ratedCampaign('retyped', retyped);
        levers.L2 = {
          rating: l2.r,
          damage: l2.c.damage / t.c.damage - 1,
          march: marchText(request, retyped[0] ?? {}),
        };
        // L3 resize over the row's own troop types with its hired as caps.
        const troopIds = request.units
          .filter((u) => u.pool === 'leadership' && (t.counts[u.id] ?? 0) > 0)
          .map((u) => u.id);
        const hiredCaps: Record<string, number> = {};
        for (const u of request.units) if (u.pool !== 'leadership') hiredCaps[u.id] = t.counts[u.id] ?? 0;
        const resized = resizeMarchOver(request, { troopIds, hired: hiredCaps, stop: t.counts });
        if (resized) {
          const l3 = ratedCampaign(
            'resized',
            t.marches.map((m) => {
              const out = { ...resized.counts };
              for (const id of hiredIds(request)) out[id] = Math.min(out[id] ?? 0, m[id] ?? 0);
              return out;
            }),
          );
          levers.L3 = {
            shape: resized.shape,
            rating: l3.r,
            damage: l3.c.damage / t.c.damage - 1,
            march: marchText(request, resized.counts),
          };
        }
        // L5: our closest stop with every march re-typed by `retypeMarch`, the pass without `keepReadings`.
        const ourRetyped = best.s.marches.map((m) => retypeMarch(request, m, RATES)?.counts ?? m);
        const l5 = ratedCampaign('ours re-typed', ourRetyped);
        const l5self = rate(billOf(best.s.c), billOf(l5.c), RATES);
        levers.L5 = {
          rating: l5.r,
          damage: l5.c.damage / t.c.damage - 1,
          againstOwnStop: l5self,
          queue: l5.c.seconds / best.s.c.seconds - 1,
          silver: l5.c.silver / best.s.c.silver - 1,
          beats: l5.c.damage >= t.c.damage || l5.r > 0,
        };
        // L6: unsheltered probes — the row's hired on our closest stop's troops, the closest stop's hired on the
        // row's troops, and our own Elite sizer (no shelter) over every troop type with the row's hired as caps.
        const troopsOf = (c: Record<string, number>): Record<string, number> =>
          Object.fromEntries(Object.entries(c).filter(([id]) => !hiredIds(request).includes(id)));
        const hiredOf = (c: Record<string, number>): Record<string, number> =>
          Object.fromEntries(Object.entries(c).filter(([id]) => hiredIds(request).includes(id)));
        const repeatWith = (make: (m: Record<string, number>, i: number) => Record<string, number>) =>
          ratedCampaign('probe', t.marches.map(make));
        const ourFirst = best.s.marches[0] ?? {};
        const l6a = repeatWith((m) => ({ ...troopsOf(ourFirst), ...hiredOf(m) }));
        const l6b = ratedCampaign(
          'probe',
          best.s.marches.map((m) => ({ ...troopsOf(t.counts), ...hiredOf(m) })),
        );
        const sizerCaps: Record<string, number> = { ...request.caps };
        for (const id of hiredIds(request)) sizerCaps[id] = t.counts[id] ?? 0;
        const sized = countsOf(
          sizeStacks({ ...request, caps: sizerCaps, options: { ...request.options, method: 'elite' } }),
        );
        const l6c = repeatWith((m) => {
          const out = { ...sized };
          for (const id of hiredIds(request)) out[id] = Math.min(out[id] ?? 0, m[id] ?? 0);
          return out;
        });
        levers.L6 = {
          rowHiredOnOurTroops: {
            rating: l6a.r,
            damage: l6a.c.damage / t.c.damage - 1,
            margin: shapeOf(request, { ...troopsOf(ourFirst), ...hiredOf(t.counts) }).margin,
          },
          ourHiredOnRowTroops: { rating: l6b.r, damage: l6b.c.damage / t.c.damage - 1 },
          eliteSizerUnsheltered: {
            rating: l6c.r,
            damage: l6c.c.damage / t.c.damage - 1,
            margin: shapeOf(request, sized).margin,
            march: marchText(request, sized),
          },
        };
        // L4 frontier.
        const fr = frontier
          .map((f) => ({ f, r: rate(tsBill, billOf(f.c), RATES) }))
          .reduce<{ f: (typeof frontier)[number]; r: number } | null>(
            (a, b) => (!a || b.r > a.r ? b : a),
            null,
          );
        const frMore = frontier.filter((f) => f.c.damage >= t.c.damage);
        const frBetter = frontier.filter(
          (f) => rate(tsBill, billOf(f.c), RATES) > 0 || f.c.damage >= t.c.damage,
        );
        levers.L4 = {
          size: frontier.length,
          best: fr
            ? {
                rating: fr.r,
                inBand: fr.f.row.inBand,
                undominated: fr.f.row.undominated,
                stop: fr.f.row.stop ?? null,
                troops: Object.keys(fr.f.row.counts).filter((id) => !hiredIds(request).includes(id)).length,
                march: marchText(request, fr.f.row.counts),
                bill: bill(fr.f.c),
              }
            : null,
          moreDamage: frMore.length,
          betterAny: frBetter.length,
          betterInBand: frBetter.filter((f) => f.row.inBand).length,
          betterUndominated: frBetter.filter((f) => f.row.undominated).length,
          betterUndomInBand: frBetter.filter((f) => f.row.undominated && f.row.inBand).length,
        };
        kept.push({
          army: label,
          name: t.name,
          ts: t.c,
          tsMarches: t.marches,
          closest: { pick: best.s.pick, c: best.s.c, rating: best.r, first: best.s.marches[0] ?? {} },
          levers,
          cause: '',
        });
        (kept[kept.length - 1] as Kept & { request?: StackRequest }).request = request;
      }
      totals.kept += keptHere;
      summary.push(
        `| ${label} | ${String(stops.length)} | ${String(theirs.length)} | ${String(ms?.rowsBeaten ?? 0)} | ${String(ms?.unfitted ?? 0)} | ${String(beatenHere)} | **${String(keptHere)}** |`,
      );
    }
    summary.push(
      `| **total** | | **${String(totals.rows)}** | **${String(totals.dominated)}** | **${String(totals.unfitted)}** | | **${String(totals.kept)}** |`,
    );
    report.add('## A. The rows, army by army\n');
    report.add(summary.join('\n'));

    report.add('\n## B. Every kept row\n');
    for (const [i, k] of kept.entries()) {
      const request = (k as Kept & { request: StackRequest }).request;
      const L = k.levers as Record<string, Record<string, unknown>>;
      const rules = L.rules as {
        sheltered: boolean;
        margin: number;
        missingTypes: string[];
        unsustained: string[];
        troopStacks: number;
        campaignClamped: boolean;
      };
      const sh = L.shape as { ts: Shape; ours: Shape };
      report.add(
        `### B${String(i + 1)}. ${k.army} — ${k.name}\n\n` +
          `- **TS march** (first): ${marchText(request, k.tsMarches[0] ?? {})}${rules.campaignClamped ? ` · last march: ${marchText(request, k.tsMarches[k.tsMarches.length - 1] ?? {})}` : ''}\n` +
          `- **TS campaign**: ${bill(k.ts)}\n` +
          `- **closest stop ${short(k.closest.pick)}** (first march): ${marchText(request, k.closest.first)}\n` +
          `- **its campaign**: ${bill(k.closest.c)}\n` +
          `- **rating of our stop against the row**: ${k.closest.rating.toFixed(2)} (damage ${((k.closest.c.damage / k.ts.damage - 1) * 100).toFixed(1)} %)\n` +
          `- **TS wins on**: ${winsOn(k.ts, k.closest.c).join(', ') || '—'} · **we win on**: ${winsOn(k.closest.c, k.ts).join(', ') || '—'}\n` +
          `- **shape** TS: troops ${sh.ts.troopTypes.join('/')} HP ${sh.ts.troopHp.map((v) => n(v)).join('/')} · hired ${n(sh.ts.hired)} HP ${sh.ts.hiredHp.map((v) => n(v)).join('/')} · leadership ${n(sh.ts.leadership)} · shelter margin ${Number.isFinite(sh.ts.margin) ? sh.ts.margin.toFixed(2) : '—'}\n` +
          `- **shape** ours: troops ${sh.ours.troopTypes.join('/')} HP ${sh.ours.troopHp.map((v) => n(v)).join('/')} · hired ${n(sh.ours.hired)} HP ${sh.ours.hiredHp.map((v) => n(v)).join('/')} · leadership ${n(sh.ours.leadership)} · shelter margin ${Number.isFinite(sh.ours.margin) ? sh.ours.margin.toFixed(2) : '—'}\n` +
          `- **rules on TS's march**: sheltered ${rules.sheltered ? 'yes' : '**no**'} · held hired types left out (S-58 B) ${rules.missingTypes.join(', ') || 'none'} · over the 4-march sustain ${rules.unsustained.join(', ') || 'none'} · campaign clamped by stock ${rules.campaignClamped ? '**yes**' : 'no'}\n` +
          `- **L0 reading** (engine \`planMarch\` / benchmark \`price\` − 1): ${JSON.stringify(L.L0, (_, v: unknown) => (typeof v === 'number' ? Number((v * 100).toFixed(2)) : v))} %\n` +
          `- **L1 shelter**: ${JSON.stringify(L.L1, (_, v: unknown) => (typeof v === 'number' ? Number(v.toFixed(3)) : v))}\n` +
          `- **L2 re-type**: ${JSON.stringify(L.L2, (_, v: unknown) => (typeof v === 'number' ? Number(v.toFixed(3)) : v))}\n` +
          `- **L3 re-size on its types**: ${JSON.stringify(L.L3 ?? null, (_, v: unknown) => (typeof v === 'number' ? Number(v.toFixed(3)) : v))}\n` +
          `- **L5 our stop re-typed, no keepReadings**: ${JSON.stringify(L.L5, (_, v: unknown) => (typeof v === 'number' ? Number(v.toFixed(4)) : v))}\n` +
          `- **L6 unsheltered probes**: ${JSON.stringify(L.L6, (_, v: unknown) => (typeof v === 'number' ? Number(v.toFixed(3)) : v))}\n` +
          `- **L4 frontier**: ${JSON.stringify(L.L4, (_, v: unknown) => (typeof v === 'number' ? Number(v.toFixed(3)) : v))}\n`,
      );
    }
    // C. The causes, named from the levers and ranked.
    const causes = new Map<string, { rows: number; rating: number; where: Set<string> }>();
    for (const k of kept) {
      const L = k.levers as Record<string, Record<string, unknown>>;
      const rules = L.rules as { sheltered: boolean };
      const l5 = L.L5 as { beats: boolean };
      const l1 = L.L1 as { stillKept: boolean };
      k.cause = l5.beats
        ? 'the re-type reaches it, and `keepReadings` hands the stop back (a reading lost)'
        : !rules.sheltered && !l1.stillKept
          ? 'the shelter rule refuses it (its hired stand over its troops; sheltered, it falls below our stop)'
          : 'unexplained by L0–L6';
      const c = causes.get(k.cause) ?? { rows: 0, rating: 0, where: new Set<string>() };
      c.rows += 1;
      c.rating += -k.closest.rating;
      c.where.add(k.army);
      causes.set(k.cause, c);
    }
    report.add('\n## C. The causes, ranked\n');
    report.add(
      '| cause | rows | rating gap summed | armies |\n|---|---:|---:|---|\n' +
        [...causes.entries()]
          .sort((a, b) => b[1].rating - a[1].rating)
          .map(
            ([cause, c]) =>
              `| ${cause} | ${String(c.rows)} | ${c.rating.toFixed(2)} | ${[...c.where].join('; ')} |`,
          )
          .join('\n') +
        '\n',
    );
    if (process.env.DUMP)
      writeFileSync(
        process.env.DUMP,
        JSON.stringify(
          kept.map((k) => ({ ...k, request: undefined })),
          null,
          1,
        ),
      );
    report.save();
  }, 7_200_000);
});
