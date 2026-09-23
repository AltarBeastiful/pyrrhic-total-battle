/**
 * 164 — **the shelter, as deep as the enemy reaches** (W12 §2, `docs/plans/the-remaining-gaps.md`). 163 found
 * one army of 17 where an unsheltered, sustained march beats the bar (the owner's live camp, +23.44 against
 * MX, 47.13M), and read why off the enemy-first journal: the stacks wiped before they strike are the
 * highest-HP ones, so a hired stack is at risk only while it is among them. Today's shelter (S-87,
 * `shelterUnder`) puts every hired stack under the **lowest** troop stack, so cheap small troop stacks cap the
 * hired count.
 *
 * Every benchmark army (the set of 157 / 160 / 162 / 163), the plan as shipped, four-march campaigns priced as
 * the benchmark prices stops (`campaignOf`, worst opening = the enemy-first journal). Three shelter rules,
 * each applied to the same raw candidates, every hired stack capped by the four-march sustain:
 *   (a) **today's rule** — `shelterCounts`: every hired stack under the lowest troop stack;
 *   (b) **the journal rule** — no hired stack is wiped before it strikes in the enemy-first journal. Read off
 *       the journal (`planMarch`), the highest-HP hired stack that dies before striking is lowered to just
 *       under the next stack in the kill order, and again until none is left; the smallest cut each step, so
 *       the hired count is kept as high as that greedy walk allows;
 *   (c) **none** — the candidate as it is.
 * Raw candidates: the Elite / MS / MS-relaxed sizer at 10 %…100 % of the sustain; TotalStack's rows re-capped
 * to the sustain; each stop's troops under its own first-march hired and under the full sustain; then
 * `retypeMarch` on the best six of each rule, the rule applied again to the re-typed march.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/164-shelter-as-deep-as-the-enemy-reaches.test.ts`
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

/** Hired stacks the enemy wipes before they strike once, in the enemy-first journal of one march. */
function preStrikeHired(request: StackRequest, counts: Record<string, number>): string[] {
  return readJournal(request, counts)
    .stacks.filter((s) => s.hired && s.hitsEF === 0)
    .map((s) => s.id);
}

/**
 * **Rule (b), the journal rule.** While a hired stack dies before it strikes (enemy first), the highest-HP one
 * is lowered to just under the next stack in the kill order (the last one, to nothing).
 */
function journalShelter(request: StackRequest, counts: Record<string, number>): Record<string, number> {
  const out = { ...counts };
  for (let step = 0; step < 2000; step += 1) {
    const { result, summary } = planMarch(request, out);
    const ef = summary.journals.enemyFirst.entries;
    const struck = new Set(ef.filter((e) => e.actor === 'army').map((e) => e.unitId));
    const i = result.stacks.findIndex((s) => s.pool !== 'leadership' && !struck.has(s.unitId));
    if (i < 0) break;
    const stack = result.stacks[i];
    if (!stack) break;
    // The next stack down that is not itself a hired stack wiped before striking (hired stacks of nearly equal
    // HP would otherwise leapfrog one another a unit at a time).
    const next = result.stacks.slice(i + 1).find((s) => s.pool === 'leadership' || struck.has(s.unitId));
    const lowered =
      next && stack.hpPerUnit > 0
        ? Math.min(stack.count - 1, Math.ceil(next.totalHp / stack.hpPerUnit) - 1)
        : 0;
    out[stack.unitId] = Math.max(0, lowered);
  }
  // The raise pass: the greedy walk can leave a stack lower than the end state needs (it was lowered under a
  // hired stack that was itself lowered later). Each hired stack is raised back to the highest of its raw count
  // and the just-under-each-other-stack boundaries that keeps every hired stack striking; until nothing moves.
  const safe = (counts: Record<string, number>): boolean => preStrikeHired(request, counts).length === 0;
  const hp = new Map(planMarch(request, counts).result.stacks.map((s) => [s.unitId, s.hpPerUnit]));
  for (let pass = 0; pass < 8; pass += 1) {
    let moved = false;
    for (const [id, rawCount] of Object.entries(counts)) {
      const per = hp.get(id) ?? 0;
      const current = out[id] ?? 0;
      if (per <= 0 || current >= rawCount) continue;
      const { result } = planMarch(request, out);
      if (!result.stacks.some((s) => s.unitId === id && s.pool !== 'leadership') && current > 0) continue;
      if (request.units.find((u) => u.id === id)?.pool === 'leadership') continue;
      const targets = [
        rawCount,
        ...result.stacks.filter((s) => s.unitId !== id).map((s) => Math.ceil(s.totalHp / per) - 1),
      ]
        .filter((t) => t > current && t <= rawCount)
        .sort((x, y) => y - x);
      for (const t of targets) {
        const trial = { ...out, [id]: t };
        if (safe(trial)) {
          out[id] = t;
          moved = true;
          break;
        }
      }
    }
    if (!moved) break;
  }
  if (!safe(out)) throw new Error(`journal rule did not converge: ${JSON.stringify(out)}`);
  return Object.fromEntries(Object.entries(out).filter(([, c]) => c > 0));
}

type Rule = 'a' | 'b' | 'c';
const RULES: Rule[] = ['a', 'b', 'c'];
const RULE_NAME: Record<Rule, string> = {
  a: '(a) under the lowest troop stack',
  b: '(b) journal: never wiped before striking',
  c: '(c) none',
};

interface Candidate {
  source: string;
  counts: Record<string, number>;
  c: Campaign;
  pre: string[];
}

describe.skipIf(!process.env.THEORY)('the shelter, as deep as the enemy reaches', () => {
  it('compares three shelter rules on every benchmark army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('164-shelter-as-deep-as-the-enemy-reaches');
    report.add('# 164 — the shelter, as deep as the enemy reaches\n');
    report.add(
      'W12 §2. Every benchmark army, the plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`), four-march ' +
        'campaigns priced as the benchmark prices stops (`campaignOf`, worst opening = enemy-first journal). A ' +
        '**candidate** is one march repeated four times, every hired stack capped by the four-march sustain ' +
        '(`largestSustained(cap, 4)`). Raw candidates: Elite / MS / MS-relaxed sizer at 10 %…100 % of the sustain, ' +
        'TotalStack rows re-capped, each stop’s troops under its own first-march hired and under the full sustain. ' +
        'Each rule is applied to every raw candidate, then `retypeMarch` on that rule’s best six and the rule ' +
        'applied again. **(a)** `shelterCounts` (every hired stack under the lowest troop stack); **(b)** the ' +
        'journal rule: the highest-HP hired stack that dies before striking in the enemy-first journal is lowered ' +
        'to just under the next stack in the kill order that is not itself a hired stack wiped before striking, repeated until no hired stack dies before striking ' +
        '(greedy, smallest cut per step), then each hired stack raised back to the highest of its raw count and ' +
        'the just-under-another-stack boundaries that keeps every hired stack striking; **(c)** no shelter. The **best** of a rule is its candidate with the ' +
        'highest `rate(top, candidate, markerRates)` against the highest-damage stop (**top**). **pre-strike ' +
        'hired** = hired stacks the enemy wipes before they strike (first march).\n',
    );
    const summary: string[] = [
      '| army | top | top dmg / hired | (a) dmg · hired · rating | (b) dmg · hired · rating | (c) dmg · hired · rating · pre-strike hired | stops rated > 0 (a / b / c) | stops with a pre-strike hired stack |\n|---|---|---:|---:|---:|---:|---:|---:|',
    ];
    const markerLines: string[] = [
      '| army | rule | source | dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin | hired per 1M | rating vs top | worse than top on |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    ];
    const abLines: string[] = [
      '| army | raw candidates | (a) passes the journal | of those, (b) rated below (a) | (b) rated below (a), all | (b) above (a), all | best (b) − best (a) |\n|---|---:|---:|---:|---:|---:|---:|',
    ];
    const tsLines: string[] = [
      '| army | TS row | TS dmg | kept in 162 | (a) beats it | (b) beats it | (c) beats it | rate(row, best) a / b / c |\n|---|---|---:|---|---|---|---|---:|',
    ];
    const details: string[] = [];
    const abExamples: string[] = [];

    for (const scenario of scenarios) {
      const label = scenario.label.slice(0, 44);
      const request = scenario.request;
      const p = plan(request);
      if (!p || p.alternatives.length === 0) {
        summary.push(`| ${label} | refused | | | | | | |`);
        continue;
      }
      const stops = p.alternatives.map((row) => {
        const marches = marchesOf(row as PlanTotals);
        return { pick: row.pick, marches, c: campaignOf(request, row.pick, 'plan', marches) };
      });
      const top = stops.reduce((a, b) => (b.c.damage > a.c.damage ? b : a));
      const mercs = hiredIds(request);
      const authority = request.units.filter((u) => u.pool === 'authority');
      const stopsPre = stops.filter((s) => s.marches.some((m) => preStrikeHired(request, m).length > 0));
      if (authority.length === 0) {
        summary.push(`| ${label} | ${short(top.pick)} | no hired type | | | | | |`);
        continue;
      }
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
        return Object.fromEntries(Object.entries(out).filter(([, c]) => c > 0));
      };
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
      const byTop = (k: Candidate): number => rate(billOf(top.c), billOf(k.c), RATES);
      const apply = (rule: Rule, counts: Record<string, number>): Record<string, number> =>
        rule === 'a'
          ? shelterCounts(request, counts)
          : rule === 'b'
            ? journalShelter(request, counts)
            : counts;

      // Raw candidates.
      const raw: { source: string; counts: Record<string, number> }[] = [];
      const rawSeen = new Set<string>();
      const addRaw = (source: string, counts: Record<string, number>): void => {
        const clean = capHired(counts);
        const key = JSON.stringify(Object.entries(clean).sort());
        if (rawSeen.has(key) || !mercs.some((id) => (clean[id] ?? 0) > 0)) return;
        rawSeen.add(key);
        raw.push({ source, counts: clean });
      };
      for (const [method, flags, tag] of [
        ['elite', {}, 'Elite'],
        ['ms', {}, 'MS'],
        ['ms', { relaxedPreservation: true }, 'MS-relaxed'],
      ] as const) {
        for (let level = 1; level <= 10; level += 1) {
          const caps = { ...request.caps };
          for (const id of mercs) caps[id] = Math.floor(((sustain[id] ?? 0) * level) / 10);
          try {
            addRaw(
              `${tag} ${String(level * 10)} %`,
              countsOf(sizeStacks({ ...request, caps, options: { ...request.options, method, ...flags } })),
            );
          } catch {
            /* a sizer that refuses the army adds nothing */
          }
        }
      }
      const held = new Set(request.units.map((u) => u.id));
      const tsRows: { name: string; c: Campaign }[] = [];
      for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!external.name.startsWith('TotalStack')) continue;
        if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(request, external.counts), external.name, external.counts);
        if (row.damage <= 0) continue;
        tsRows.push({ name: external.name, c: row });
        addRaw(`TS re-capped (${external.name.replace('TotalStack · ', '')})`, external.counts);
      }
      const fullHired = Object.fromEntries(mercs.map((id) => [id, sustain[id] ?? 0]));
      for (const s of stops) {
        const first = s.marches[0] ?? {};
        const troops = Object.fromEntries(Object.entries(first).filter(([id]) => !mercs.includes(id)));
        addRaw(`${short(s.pick)} re-sheltered`, first);
        // The full sustain of every hired type the army holds, as the Elite sizer at 100 % would ask.
        addRaw(`${short(s.pick)} troops + sustain hired`, { ...troops, ...fullHired });
      }

      // Each rule on every raw candidate, then the re-typing of its best six.
      const pools: Record<Rule, Candidate[]> = { a: [], b: [], c: [] };
      const perRaw: {
        a: number;
        b: number;
        aPasses: boolean;
        source: string;
        raw: Record<string, number>;
        ka: Candidate;
        kb: Candidate;
      }[] = [];
      for (const rule of RULES) {
        const seen = new Set<string>();
        const add = (source: string, counts: Record<string, number>): Candidate | undefined => {
          const ruled = Object.fromEntries(Object.entries(apply(rule, counts)).filter(([, c]) => c > 0));
          const key = JSON.stringify(Object.entries(ruled).sort());
          if (seen.has(key))
            return pools[rule].find((k) => JSON.stringify(Object.entries(k.counts).sort()) === key);
          seen.add(key);
          const c = repeat(source, ruled);
          if (c.damage <= 0) return undefined;
          const k = { source, counts: ruled, c, pre: preStrikeHired(request, ruled) };
          pools[rule].push(k);
          return k;
        };
        const firsts = raw.map((r) => add(r.source, r.counts));
        if (rule === 'b') {
          raw.forEach((r, i) => {
            const ka = pools.a.find(
              (k) =>
                JSON.stringify(Object.entries(k.counts).sort()) ===
                JSON.stringify(
                  Object.entries(
                    Object.fromEntries(Object.entries(apply('a', r.counts)).filter(([, c]) => c > 0)),
                  ).sort(),
                ),
            );
            const kb = firsts[i];
            if (ka && kb)
              perRaw.push({
                a: byTop(ka),
                b: byTop(kb),
                aPasses: ka.pre.length === 0,
                source: r.source,
                raw: r.counts,
                ka,
                kb,
              });
          });
        }
        const seeds = pools[rule]
          .slice()
          .sort((x, y) => byTop(y) - byTop(x))
          .slice(0, 6);
        for (const k of seeds) {
          const r = retypeMarch(request, k.counts, RATES);
          if (r) add(`${k.source} → retyped`, r.counts);
        }
      }
      const best: Partial<Record<Rule, Candidate>> = {};
      for (const rule of RULES) {
        const pool = pools[rule];
        if (pool.length > 0) best[rule] = pool.reduce((x, y) => (byTop(y) > byTop(x) ? y : x));
      }
      const cell = (rule: Rule): string => {
        const k = best[rule];
        return k ? `${m1(k.c.damage)} · ${n(k.c.burned)} · **${byTop(k).toFixed(2)}**` : '—';
      };
      const positive = (rule: Rule): string => {
        const k = best[rule];
        return k ? String(stops.filter((s) => rate(billOf(s.c), billOf(k.c), RATES) > 0).length) : '—';
      };
      summary.push(
        `| ${label} | ${short(top.pick)} | ${m1(top.c.damage)} / ${n(top.c.burned)} | ${cell('a')} | ${cell('b')} | ${cell('c')} · ${String(best.c?.pre.length ?? 0)} | ${positive('a')} / ${positive('b')} / ${positive('c')} | ${String(stopsPre.length)}/${String(stops.length)}${stopsPre.length > 0 ? ` (${stopsPre.map((s) => short(s.pick)).join(', ')})` : ''} |`,
      );
      const markerRow = (tag: string, source: string, c: Campaign, r: string, worse: string): string =>
        `| ${label} | ${tag} | ${source} | ${n(Math.round(c.damage))} | ${n(Math.round(c.silver))} | ${n(c.burned)} | ${n(Math.round(c.gold))} | ${n(Math.round(c.dragonCoins))} | ${n(Math.round(c.seconds / 3600))} | ${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} | ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} | ${c.gold > 0 ? n(Math.round(c.damage / c.gold)) : '—'} | ${c.dragonCoins > 0 ? n(Math.round(c.damage / c.dragonCoins)) : '—'} | ${(c.burned / (c.damage / 1e6)).toFixed(2)} | ${r} | ${worse} |`;
      markerLines.push(markerRow(`top ${short(top.pick)}`, 'the bar', top.c, '0', '—'));
      for (const rule of RULES) {
        const k = best[rule];
        if (k)
          markerLines.push(
            markerRow(rule, k.source, k.c, byTop(k).toFixed(2), winsOn(top.c, k.c).join(', ') || '—'),
          );
      }
      // (a) against (b), candidate by candidate.
      const held_ = perRaw.filter((x) => x.aPasses);
      const eps = 1e-6;
      abLines.push(
        `| ${label} | ${String(perRaw.length)} | ${String(held_.length)} | ${String(held_.filter((x) => x.b < x.a - eps).length)} | ${String(perRaw.filter((x) => x.b < x.a - eps).length)} | ${String(perRaw.filter((x) => x.b > x.a + eps).length)} | ${best.a && best.b ? (byTop(best.b) - byTop(best.a)).toFixed(2) : '—'} |`,
      );
      for (const x of perRaw
        .filter((y) => y.b < y.a - eps)
        .sort((y, z) => y.b - y.a - (z.b - z.a))
        .slice(0, 2)) {
        abExamples.push(
          `- **${label}** — ${x.source}: (a) ${x.a.toFixed(2)}, ${m1(x.ka.c.damage)}, ${n(x.ka.c.burned)} hired · (b) ${x.b.toFixed(2)}, ${m1(x.kb.c.damage)}, ${n(x.kb.c.burned)} hired\n  - raw: ${marchText(request, x.raw)}\n  - (a): ${marchText(request, x.ka.counts)}; journal ${journalLine(readJournal(request, x.ka.counts))}\n  - (b): ${marchText(request, x.kb.counts)}; journal ${journalLine(readJournal(request, x.kb.counts))}`,
        );
      }
      // TotalStack rows.
      for (const t of tsRows) {
        const kept = stops.every(
          (s) => s.c.damage < t.c.damage && rate(billOf(t.c), billOf(s.c), RATES) <= 0,
        );
        if (!kept) continue;
        const beats = (rule: Rule): string => {
          const k = best[rule];
          return k
            ? k.c.damage >= t.c.damage || rate(billOf(t.c), billOf(k.c), RATES) > 0
              ? 'yes'
              : '**no**'
            : '—';
        };
        const rr = (rule: Rule): string => {
          const k = best[rule];
          return k ? rate(billOf(t.c), billOf(k.c), RATES).toFixed(2) : '—';
        };
        tsLines.push(
          `| ${label} | ${t.name.replace('TotalStack · ', '')} | ${m1(t.c.damage)} | **kept** | ${beats('a')} | ${beats('b')} | ${beats('c')} | ${rr('a')} / ${rr('b')} / ${rr('c')} |`,
        );
      }
      // Details.
      const lines: string[] = [`### ${label}\n`];
      lines.push(
        `- **sustain**: ${authority.map((u) => `${u.id} ${n(sustain[u.id] ?? 0)}`).join(', ')} · raw candidates ${String(raw.length)} · stops: ${stops.map((s) => `${short(s.pick)} ${m1(s.c.damage)}/${n(s.c.burned)} hired${preStrikeHired(request, s.marches[0] ?? {}).length > 0 ? ` (pre-strike: ${preStrikeHired(request, s.marches[0] ?? {}).join(', ')})` : ''}`).join(' · ')}`,
      );
      lines.push(
        `- **top ${short(top.pick)}** first march: ${marchText(request, top.marches[0] ?? {})}; journal ${journalLine(readJournal(request, top.marches[0] ?? {}))}`,
      );
      for (const rule of RULES) {
        const k = best[rule];
        if (!k) continue;
        const ratings = stops
          .map((s) => `${short(s.pick)} ${rate(billOf(s.c), billOf(k.c), RATES).toFixed(2)}`)
          .join(' · ');
        lines.push(
          `- **${RULE_NAME[rule]}** — ${k.source}: ${marchText(request, k.counts)}\n  - ${bill(k.c)}\n  - rating vs every stop: ${ratings}\n  - journal: ${journalLine(readJournal(request, k.counts))}${k.pre.length > 0 ? ` — **pre-strike hired: ${k.pre.join(', ')}**` : ''}`,
        );
      }
      details.push(lines.join('\n') + '\n');
    }
    report.h('A. Per army: the best candidate of each rule, rated against the top stop');
    report.add(
      'Cells: four-march damage · hired lost · **rating vs top**. "stops with a pre-strike hired stack": stops of the ' +
        'shipped bar with a hired stack the enemy wipes before it strikes, in any march.\n',
    );
    report.add(summary.join('\n'));
    report.h('B. Every marker of each best, and of the top stop');
    report.add(markerLines.join('\n'));
    report.h('C. (a) against (b), raw candidate by raw candidate (rating vs top)');
    report.add(
      '"(a) passes the journal": the (a)-sheltered march already has no hired stack wiped before striking — where (a) held.\n',
    );
    report.add(abLines.join('\n'));
    report.add('\nThe two widest gaps where (b) rates below (a), per army:\n');
    report.add(abExamples.join('\n'));
    report.h('D. The TotalStack rows 162 kept');
    report.add(tsLines.join('\n'));
    report.h('E. Per army, in full');
    report.add(details.join('\n'));
    report.save();
  }, 7_200_000);
});
