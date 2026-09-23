/**
 * 163 — **an unsheltered stop** (after 162: three TotalStack rows on the owner's live camp of 2026-09-18 beat
 * every stop on damage and on the owner's rating by fielding 640–960 hired over seven cheap troop stacks,
 * unsheltered). Is an unsheltered but **sustained** stop worth offering?
 *
 * Every benchmark army (the set of 157 / 160 / 162), the plan as shipped (`CAMPAIGN.planFixes`,
 * `CAMPAIGN.putBack`), four-march campaigns priced exactly as the benchmark prices stops (`campaignOf`,
 * worst opening = the enemy-first journal).
 *
 *  1. **Candidates** — one march repeated over the horizon, every hired stack capped by the four-march
 *     sustain (`largestSustained(cap, HORIZON)`), the shelter let go:
 *     - the Elite / MS / MS-relaxed sizer at hired levels 10 %…100 % of the sustain;
 *     - every TotalStack row of the army re-capped to the sustain;
 *     - every stop's troops under the sustain-capped hired of the Elite sizer at 100 %;
 *     - `retypeMarch` on the best few of the above.
 *     The best **unsheltered** candidate (margin < 1) is the one with the highest rating against the
 *     highest-damage stop.
 *  2. It is rated against every stop (`rate(stop, candidate, markerRates)`) and against the TotalStack rows.
 *  3. The mechanism, read off the enemy-first journal of the first march: which stacks die before striking.
 *  4. A verdict per army.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/163-an-unsheltered-stop.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, shelterCounts } from '../../src/engine';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import { retypeMarch } from '../../src/engine/retype';
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
const m1 = (v: number): string => `${(v / 1e6).toFixed(2)}M`;

/** Lowest troop stack HP over highest hired stack HP; > 1 is sheltered. */
function marginOf(request: StackRequest, counts: Record<string, number>): number {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  const hired = result.stacks.filter((s) => s.pool !== 'leadership');
  const floor = troops.length > 0 ? Math.min(...troops.map((s) => s.totalHp)) : 0;
  const top = hired.length > 0 ? Math.max(...hired.map((s) => s.totalHp)) : 0;
  return top > 0 ? floor / top : Infinity;
}

/** The enemy-first journal of one march, stack by stack. */
interface Reading {
  stacks: {
    id: string;
    hired: boolean;
    hp: number;
    perHit: number;
    killedAt: number;
    hitsEF: number;
    hitsAF: number;
  }[];
  min: number;
  max: number;
  /** Damage per hit of the stacks the enemy wipes before they strike once (enemy first). */
  preStrikeLoss: number;
  preStrikeHired: number;
  preStrikeTroops: number;
  hiredDamage: number;
  troopDamage: number;
  enemyAttacks: number;
}
function readJournal(request: StackRequest, counts: Record<string, number>): Reading {
  const { result, summary } = planMarch(request, counts);
  const ef = summary.journals.enemyFirst.entries;
  const af = summary.journals.armyFirst.entries;
  const pool = new Map(result.stacks.map((s) => [s.unitId, s.pool]));
  const stacks = result.stacks.map((s) => {
    const killedAt = ef.findIndex((e) => e.actor === 'enemy' && e.unitId === s.unitId);
    return {
      id: s.unitId,
      hired: s.pool !== 'leadership',
      hp: s.totalHp,
      perHit: s.damagePerHit,
      killedAt,
      hitsEF: ef.filter((e) => e.actor === 'army' && e.unitId === s.unitId).length,
      hitsAF: af.filter((e) => e.actor === 'army' && e.unitId === s.unitId).length,
    };
  });
  const pre = stacks.filter((s) => s.hitsEF === 0);
  let hiredDamage = 0;
  let troopDamage = 0;
  for (const e of ef) {
    if (e.actor !== 'army') continue;
    if (pool.get(e.unitId) === 'leadership') troopDamage += e.damage;
    else hiredDamage += e.damage;
  }
  return {
    stacks,
    min: summary.minDamage,
    max: summary.maxDamage,
    preStrikeLoss: pre.reduce((s, x) => s + x.perHit, 0),
    preStrikeHired: pre.filter((x) => x.hired).length,
    preStrikeTroops: pre.filter((x) => !x.hired).length,
    hiredDamage,
    troopDamage,
    enemyAttacks: ef.filter((e) => e.actor === 'enemy').length,
  };
}
const journalLine = (r: Reading): string =>
  r.stacks
    .slice()
    .sort((a, b) => a.killedAt - b.killedAt)
    .map((s) => `${s.id}${s.hired ? '*' : ''} ${m1(s.hp)}HP→${String(s.hitsEF)}×${m1(s.perHit)}`)
    .join(' · ');

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

interface Candidate {
  source: string;
  counts: Record<string, number>;
  c: Campaign;
  margin: number;
}

describe.skipIf(!process.env.THEORY)('an unsheltered stop', () => {
  it('builds the best sustained unsheltered march per army and rates it against the bar', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('163-an-unsheltered-stop');
    report.add('# 163 — an unsheltered stop\n');
    report.add(
      'Every benchmark army, the plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march ' +
        'campaigns priced as the benchmark prices stops (`campaignOf`, worst opening). A **candidate** is one ' +
        'march repeated four times, each hired stack capped by the four-march sustain ' +
        '(`largestSustained(cap, 4)`), the shelter let go. Sources: the Elite / MS / MS-relaxed sizer at 10 %…100 % ' +
        'of the sustain, the TotalStack rows re-capped to the sustain, each stop’s troops under the full sustain, ' +
        'and `retypeMarch` on the best six. The **best** candidate is the unsheltered one (margin < 1) with the ' +
        'highest rating `rate(top, candidate, markerRates)` against the highest-damage stop (**top**). ' +
        'Verdict against top: **win** = rating > 0 and no marker worse; **trade** = rating > 0, some marker worse; ' +
        '**dominated** = rating ≤ 0. Hired stacks are starred.\n',
    );
    const summary: string[] = [
      '| army | stops | top | top dmg | best unsheltered (source) | dmg | Δdmg vs top | hired vs top | rating vs top | stops rated > 0 | verdict | markers worse vs top |\n|---|---:|---|---:|---|---:|---:|---:|---:|---:|---|---|',
    ];
    const details: string[] = [];
    const mech: string[] = [
      '| army | march | stacks (troops+hired) | enemy attacks | wiped before striking (troops / hired) | their lost strike | hired dealt | troops dealt | worst | best opening |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ];
    const tsLines: string[] = [
      '| army | TS row | TS dmg | kept in 162 (no stop beats it) | candidate dmg | rate(row, candidate) | beaten by the candidate |\n|---|---|---:|---|---:|---:|---|',
    ];
    const burnLines: string[] = [
      '| army | shelter cost: sheltered candidate dmg | hired cut by shelter | dmg lost to shelter | hired per extra 1M dmg (unsheltered vs its sheltered self) | hired per extra 1M dmg (vs top) |\n|---|---:|---:|---:|---:|---:|',
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
      const authority = request.units.filter((u) => u.pool === 'authority');
      if (authority.length === 0) {
        summary.push(`| ${label} | ${String(stops.length)} | no hired type | | | | | | | | | |`);
        continue;
      }
      // The four-march sustain, per hired type.
      const sustain: Record<string, number> = {};
      for (const u of authority) {
        const cap = request.caps[u.id];
        sustain[u.id] =
          cap === undefined
            ? Math.floor(request.housing.authority / Math.max(1, u.cost))
            : largestSustained(cap, HORIZON);
      }
      const capHired = (counts: Record<string, number>): Record<string, number> => {
        const out = { ...counts };
        for (const id of mercs) if (out[id] !== undefined) out[id] = Math.min(out[id] ?? 0, sustain[id] ?? 0);
        return out;
      };
      // One march repeated, clamped by the stock as `asCaptured` clamps (a no-op once sustained).
      const repeat = (name: string, counts: Record<string, number>): Campaign => {
        const caps = { ...request.caps };
        const marches: Record<string, number>[] = [];
        for (let i = 0; i < HORIZON; i += 1) {
          const march = { ...counts };
          for (const id of mercs) {
            const cap = caps[id];
            if (cap !== undefined) march[id] = Math.min(march[id] ?? 0, cap);
          }
          marches.push(march);
          for (const id of mercs)
            if (caps[id] !== undefined) caps[id] = Math.max(0, (caps[id] ?? 0) - chunks(march[id] ?? 0));
        }
        return campaignOf(request, name, 'plan', marches);
      };
      const candidates: Candidate[] = [];
      const seen = new Set<string>();
      const add = (source: string, counts: Record<string, number>): void => {
        const clean = Object.fromEntries(Object.entries(capHired(counts)).filter(([, c]) => c > 0));
        const key = JSON.stringify(Object.entries(clean).sort());
        if (seen.has(key)) return;
        if (!mercs.some((id) => (clean[id] ?? 0) > 0)) return;
        seen.add(key);
        const c = repeat(source, clean);
        if (c.damage <= 0) return;
        candidates.push({ source, counts: clean, c, margin: marginOf(request, clean) });
      };
      // (a) the sizers at hired levels of the sustain.
      for (const [method, flags, tag] of [
        ['elite', {}, 'Elite'],
        ['ms', {}, 'MS'],
        ['ms', { relaxedPreservation: true }, 'MS-relaxed'],
      ] as const) {
        for (let level = 1; level <= 10; level += 1) {
          const caps = { ...request.caps };
          for (const id of mercs) caps[id] = Math.floor(((sustain[id] ?? 0) * level) / 10);
          try {
            const sized = countsOf(
              sizeStacks({ ...request, caps, options: { ...request.options, method, ...flags } }),
            );
            add(`${tag} ${String(level * 10)} %`, sized);
          } catch {
            /* a sizer that refuses the army adds nothing */
          }
        }
      }
      // (b) TotalStack's own shapes re-capped to the sustain.
      const held = new Set(request.units.map((u) => u.id));
      const tsRows: { name: string; c: Campaign }[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const wide = widenedFor(request, external.counts);
        const row = asCaptured(wide, external.name, external.counts);
        if (row.damage <= 0) continue;
        tsRows.push({ name: external.name, c: row });
        add(`TS re-capped (${external.name.replace('TotalStack · ', '')})`, external.counts);
      }
      // (c) each stop's troops under the full sustain (Elite at 100 %).
      const full = candidates.find((k) => k.source === 'Elite 100 %');
      if (full) {
        for (const s of stops) {
          const troops = Object.fromEntries(
            Object.entries(s.marches[0] ?? {}).filter(([id]) => !mercs.includes(id)),
          );
          const hired = Object.fromEntries(Object.entries(full.counts).filter(([id]) => mercs.includes(id)));
          add(`${short(s.pick)} troops + sustain hired`, { ...troops, ...hired });
        }
      }
      // (d) the re-typing of the best six (by rating against top).
      const byTop = (k: Candidate): number => rate(billOf(top.c), billOf(k.c), RATES);
      const seeds = candidates
        .filter((k) => k.margin < 1)
        .sort((a, b) => byTop(b) - byTop(a))
        .slice(0, 6);
      for (const k of seeds) {
        const r = retypeMarch(request, k.counts, RATES);
        if (r) add(`${k.source} → retyped`, r.counts);
      }
      const unsheltered = candidates.filter((k) => k.margin < 1);
      if (unsheltered.length === 0) {
        summary.push(
          `| ${label} | ${String(stops.length)} | ${short(top.pick)} | ${m1(top.c.damage)} | none unsheltered | | | | | | | |`,
        );
        continue;
      }
      const best = unsheltered.reduce((a, b) => (byTop(b) > byTop(a) ? b : a));
      const bestDmg = unsheltered.reduce((a, b) => (b.c.damage > a.c.damage ? b : a));
      const rTop = byTop(best);
      const worse = winsOn(top.c, best.c);
      const ratedStops = stops.map((s) => ({ s, r: rate(billOf(s.c), billOf(best.c), RATES) }));
      const positive = ratedStops.filter((x) => x.r > 0).length;
      const verdict = rTop <= 0 ? 'dominated' : worse.length === 0 ? '**win**' : '**trade**';
      summary.push(
        `| ${label} | ${String(stops.length)} | ${short(top.pick)} | ${m1(top.c.damage)} | ${best.source} | ${m1(best.c.damage)} | ${((best.c.damage / top.c.damage - 1) * 100).toFixed(1)} % | ${n(best.c.burned)} vs ${n(top.c.burned)} | ${rTop.toFixed(2)} | ${String(positive)}/${String(stops.length)} | ${verdict} | ${worse.join(', ') || '—'} |`,
      );
      // Details.
      const lines: string[] = [];
      lines.push(`### ${label}\n`);
      lines.push(
        `- **sustain** (4 marches): ${authority.map((u) => `${u.id} ${n(sustain[u.id] ?? 0)}${request.caps[u.id] === undefined ? ' (unlimited, housing)' : ` of ${n(request.caps[u.id] ?? 0)}`}`).join(', ')} · authority ${n(request.housing.authority)} · leadership ${n(request.housing.leadership)}`,
      );
      lines.push(
        `- **best unsheltered** (${best.source}, margin ${best.margin.toFixed(2)}): ${marchText(request, best.counts)}`,
      );
      lines.push(`- **its campaign**: ${bill(best.c)}`);
      if (bestDmg !== best)
        lines.push(
          `- **most damage unsheltered** (${bestDmg.source}, margin ${bestDmg.margin.toFixed(2)}): ${m1(bestDmg.c.damage)}, hired ${n(bestDmg.c.burned)}, rating vs top ${byTop(bestDmg).toFixed(2)}`,
        );
      lines.push(
        `- **candidates**: ${String(candidates.length)} (${String(unsheltered.length)} unsheltered); top five by rating vs top: ` +
          unsheltered
            .slice()
            .sort((a, b) => byTop(b) - byTop(a))
            .slice(0, 5)
            .map((k) => `${k.source} ${m1(k.c.damage)} / ${n(k.c.burned)} hired / ${byTop(k).toFixed(2)}`)
            .join(' · '),
      );
      for (const { s, r } of ratedStops) {
        lines.push(
          `- vs **${short(s.pick)}** (${bill(s.c)}; first march ${marchText(request, s.marches[0] ?? {})}): rating **${r.toFixed(2)}** · candidate better on ${winsOn(best.c, s.c).join(', ') || '—'} · worse on ${winsOn(s.c, best.c).join(', ') || '—'}`,
        );
      }
      details.push(lines.join('\n') + '\n');
      // Mechanism: the top stop's first march against the candidate's.
      const rStop = readJournal(request, top.marches[0] ?? {});
      const rCand = readJournal(request, best.counts);
      const troopsOf = (c: Record<string, number>): number =>
        Object.entries(c).filter(([id, v]) => v > 0 && !mercs.includes(id)).length;
      const hiredStacks = (c: Record<string, number>): number =>
        Object.entries(c).filter(([id, v]) => v > 0 && mercs.includes(id)).length;
      for (const [name, counts, r] of [
        [
          `${short(top.pick)} (sheltered ${marginOf(request, top.marches[0] ?? {}).toFixed(2)})`,
          top.marches[0] ?? {},
          rStop,
        ],
        [`candidate (margin ${best.margin.toFixed(2)})`, best.counts, rCand],
      ] as const) {
        mech.push(
          `| ${label} | ${name} | ${String(troopsOf(counts))}+${String(hiredStacks(counts))} | ${String(r.enemyAttacks)} | ${String(r.preStrikeTroops)} / ${String(r.preStrikeHired)} | ${m1(r.preStrikeLoss)} | ${m1(r.hiredDamage)} | ${m1(r.troopDamage)} | ${m1(r.min)} | ${m1(r.max)} |`,
        );
      }
      details.push(
        `- journal (enemy first, kill order; HP→strikes×per-hit) **${short(top.pick)}**: ${journalLine(rStop)}\n` +
          `- journal **candidate**: ${journalLine(rCand)}\n`,
      );
      // The shelter's cost on the candidate itself.
      const shelteredCounts = shelterCounts(request, best.counts);
      const shelteredC = repeat('sheltered', shelteredCounts);
      const dHired = best.c.burned - shelteredC.burned;
      const dDmg = best.c.damage - shelteredC.damage;
      const dTopDmg = best.c.damage - top.c.damage;
      burnLines.push(
        `| ${label} | ${m1(shelteredC.damage)} | ${n(dHired)} | ${m1(dDmg)} | ${dDmg > 0 ? (dHired / (dDmg / 1e6)).toFixed(1) : '—'} | ${dTopDmg > 0 ? ((best.c.burned - top.c.burned) / (dTopDmg / 1e6)).toFixed(1) : '—'} |`,
      );
      // TotalStack rows.
      for (const t of tsRows) {
        const keptBefore = stops.every(
          (s) => s.c.damage < t.c.damage && rate(billOf(t.c), billOf(s.c), RATES) <= 0,
        );
        const r = rate(billOf(t.c), billOf(best.c), RATES);
        const rMax = Math.max(...unsheltered.map((k) => rate(billOf(t.c), billOf(k.c), RATES)));
        const beaten = best.c.damage >= t.c.damage || r > 0;
        tsLines.push(
          `| ${label} | ${t.name.replace('TotalStack · ', '')} | ${m1(t.c.damage)} | ${keptBefore ? '**kept**' : 'beaten'} | ${m1(best.c.damage)} | ${r.toFixed(2)} (any candidate: ${rMax.toFixed(2)}) | ${beaten ? 'yes' : '**no**'} |`,
        );
      }
    }
    report.h('A. Per army: the best sustained unsheltered march against the top stop');
    report.add(summary.join('\n'));
    report.h('B. The mechanism, first march, enemy-first journal');
    report.add(
      'A stack **wiped before striking** is one the enemy kills (highest total HP first) before its first strike; ' +
        '"their lost strike" sums one strike of each. Hired / troops dealt split the worst opening.\n',
    );
    report.add(mech.join('\n'));
    report.h('C. What the shelter costs the candidate, and the hired it burns per million');
    report.add(burnLines.join('\n'));
    report.h('D. The TotalStack rows against the best candidate');
    report.add(tsLines.join('\n'));
    report.h('E. Per army, in full');
    report.add(details.join('\n'));
    report.save();
  }, 7_200_000);
});
