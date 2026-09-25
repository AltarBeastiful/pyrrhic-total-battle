/**
 * 168 — **do the low tiers die first?** (owner, 2026-09-23: *"did we fix the basic feature of correctly
 * ordering troops to have low level die first? it seems not fixed yet"*; then *"enforce … it is critical"*,
 * *"it should only cost a bit of silver and gold for a massive boost in damage depending on the number of
 * stacks above the lower troops"*, *"it should be checked anyway when sizing"*, and *"a good test for the
 * ratings: check that all marches we generated without this rule and don't respect it have their rating
 * improved when applied"*).
 *
 * The enemy wipes our highest-HP living stack first (`battle.ts`), so "low tier dies first" means **every troop
 * stack of a lower tier stands above (more total HP than) every troop stack of a higher tier**. A *violation*
 * is a pair of troop stacks where the higher tier holds more HP; a stack *above* is a higher-tier troop stack
 * that stands over at least one lower-tier troop stack. Hired stacks are read separately (they shelter under
 * the troops, S-87).
 *
 * Plans, on every benchmark army (the set of 160–167), four-march campaigns, worst opening (`campaignOf`):
 *
 *  - **shipped** — `CAMPAIGN.planFixes`, `CAMPAIGN.putBack`, the engine at HEAD;
 *  - **no-retype** — the same without the rated re-typing (attribution);
 *  - **search** — without the re-typing, the put-back and the §2b ladder maxima (all three read
 *    `input.putBack`'s rates; attribution);
 *  - **engine** — the shipped plan with `TIER168=on`: the prototype `tierOrdered` (`src/engine/plan.ts`,
 *    scratchpad `168-engine.patch`, **not shipped**) called in the two sizing functions every march is built
 *    by — `ladder` (the scorer's ladders, the learned rung order, the finale's ladders, the §2b ladder maxima,
 *    the re-size's ladders) and `sizedShape` (every sizer shape, the all-in's prefixes, the tail, the finale's
 *    sizer, the tighter shape) — and in the put-back's own `sizeStacks` call; `retypeMarch` refuses an
 *    assignment that breaks the order. **On an engine without the patch `engine` is `shipped`**; the recorded
 *    figures of the patched run are in §Z.
 *
 * And **post-hoc**: every violating march of the shipped bar re-assigned in tier order by the same rule as
 * `tierOrdered` (slots kept, lowest tier on the biggest slot, each type at least its slot's HP, raised where a
 * whole unit leaves it under a higher tier, scaled down until the leadership pays; hired re-sheltered by
 * `shelterCounts`), rated march by march and campaign by campaign against the march it replaces.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/168-do-the-low-tiers-die-first.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch, shelterCounts } from '../../src/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { effectiveTable, planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import type { UnitDef } from '../../src/data/types';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
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
const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired', of: (c: Campaign) => c.burned, high: false },
  { head: 'least gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'shortest queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg/silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg/hired', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg/gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg/coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
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
const pct = (after: number, before: number): number => (before === 0 ? 0 : ((after - before) / before) * 100);
const sgn = (v: number, d = 2): string =>
  Math.abs(v) < 10 ** -d / 2 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}`;

type Mode = 'shipped' | 'noRetype' | 'search' | 'engine';
const plan = (request: StackRequest, mode: Mode): CampaignPlan | undefined => {
  const held = process.env.TIER168;
  if (mode === 'engine') process.env.TIER168 = 'on';
  else delete process.env.TIER168;
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      ...(mode === 'shipped' || mode === 'engine' ? {} : { retype: undefined }),
      ...(mode === 'search' ? {} : { putBack: CAMPAIGN.putBack }),
    });
  } catch {
    return undefined;
  } finally {
    if (held === undefined) delete process.env.TIER168;
    else process.env.TIER168 = held;
  }
};

const tierOf = (u: UnitDef): number => (u.group === 'engineers' ? -1 : u.tier);
interface TroopStack {
  id: string;
  tier: number;
  hp: number;
}
interface Order {
  troops: TroopStack[];
  pairs: { hi: TroopStack; lo: TroopStack }[];
  above: number;
  hiredOver: number;
}
const orderOf = (request: StackRequest, counts: Record<string, number>): Order => {
  const units = new Map(request.units.map((u) => [u.id, u]));
  const { result } = planMarch(request, counts);
  const troops: TroopStack[] = result.stacks
    .filter((s) => s.pool === 'leadership' && s.count > 0)
    .map((s) => ({ id: s.unitId, tier: tierOf(units.get(s.unitId) as UnitDef), hp: s.totalHp }));
  const pairs: { hi: TroopStack; lo: TroopStack }[] = [];
  for (const a of troops)
    for (const b of troops) if (a.tier > b.tier && a.hp > b.hp) pairs.push({ hi: a, lo: b });
  const above = new Set(pairs.map((p) => p.hi.id)).size;
  const floor = Math.min(...troops.map((t) => t.hp));
  const hiredOver = result.stacks.filter((s) => s.pool !== 'leadership' && s.totalHp >= floor).length;
  return { troops, pairs, above, hiredOver };
};

/** The same rule as the prototype's `tierOrdered`, on a march's counts. `null` when no scale fits. */
const enforce = (
  request: StackRequest,
  counts: Record<string, number>,
): { counts: Record<string, number>; scale: number } | null => {
  const table = new Map(effectiveTable(request).map((e) => [e.id, e]));
  const units = new Map(request.units.map((u) => [u.id, u]));
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership' && s.count > 0);
  const slots = troops.map((s) => s.totalHp);
  const types = troops
    .map((s) => s.unitId)
    .sort((a, b) => tierOf(units.get(a) as UnitDef) - tierOf(units.get(b) as UnitDef));
  const hpOf = (id: string): number => table.get(id)?.hp ?? 1;
  const costOf = (id: string): number => table.get(id)?.cost ?? 1;
  const t = (id: string): number => tierOf(units.get(id) as UnitDef);
  const build = (scale: number): { c: number[]; used: number } => {
    const c = types.map((id, i) => Math.max(1, Math.ceil(((slots[i] ?? 0) * scale) / hpOf(id))));
    for (let i = types.length - 2; i >= 0; i -= 1) {
      const id = types[i] as string;
      let need = 0;
      for (let j = i + 1; j < types.length; j += 1) {
        const other = types[j] as string;
        if (t(other) > t(id)) need = Math.max(need, (c[j] ?? 0) * hpOf(other));
      }
      if ((c[i] ?? 0) * hpOf(id) <= need) c[i] = Math.floor(need / hpOf(id)) + 1;
    }
    return { c, used: types.reduce((sum, id, i) => sum + (c[i] ?? 0) * costOf(id), 0) };
  };
  let chosen = build(1);
  let scale = 1;
  if (chosen.used > request.housing.leadership) {
    let low = 0;
    let high = 1;
    let fit: ReturnType<typeof build> | null = null;
    for (let step = 0; step < 40; step += 1) {
      const mid = (low + high) / 2;
      const b = build(mid);
      if (b.used <= request.housing.leadership) {
        fit = b;
        low = mid;
      } else high = mid;
    }
    if (!fit) return null;
    chosen = fit;
    scale = low;
  }
  const next: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') next[s.unitId] = s.count;
  types.forEach((id, i) => (next[id] = chosen.c[i] ?? 1));
  return { counts: shelterCounts(request, next), scale };
};

type Kind = 'repeat' | 'finale' | 'tail' | 'sequence';
const kindedMarches = (row: PlanTotals): { kind: Kind; index: number; counts: Record<string, number> }[] => {
  if (row.sequence) return row.sequence.map((counts, index) => ({ kind: 'sequence' as Kind, index, counts }));
  const all = marchesOf(row);
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  return all.map((counts, index) => ({
    kind: (index < repeats ? 'repeat' : row.finaleCounts && index === repeats ? 'finale' : 'tail') as Kind,
    index,
    counts,
  }));
};
const same = (a: Record<string, number>, b: Record<string, number>): boolean => {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) if ((a[id] ?? 0) !== (b[id] ?? 0)) return false;
  return true;
};
const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${n(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};
const priced = (request: StackRequest, name: string, marches: Record<string, number>[]): Campaign =>
  campaignOf(request, name, 'plan', marches);

describe.skipIf(!process.env.THEORY)('do the low tiers die first', () => {
  it('counts the tier-order violations of the bar, attributes them, enforces the order and rates it', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('168-do-the-low-tiers-die-first');
    report.add('# 168 — do the low tiers die first?\n');
    report.add(PRIOR);

    const perStop: string[] = [];
    const worstLines: string[] = [];
    const ratingLines: string[] = [];
    const notBetter: string[] = [];
    const hypothesis: string[] = [];
    const engineLines: string[] = [];
    const bySource: Record<string, { stops: Set<string>; marches: number; played: number }> = {};
    const kinds: Record<string, number> = {};
    let stopsAll = 0;
    let stopsHit = 0;
    let marchesAll = 0;
    let marchesHit = 0;
    let hiredOverTroop = 0;
    let worstPair: { hp: number; text: string } = { hp: 0, text: '—' };
    const marchVerdict = { better: 0, equal: 0, worse: 0, refused: 0 };
    const campaignVerdict = { better: 0, equal: 0, worse: 0 };
    const postTot = { b: 0, e: 0, w: 0, worst: Infinity, worstAt: '', beat: 0, out: 0 };
    const engTot = {
      b: 0,
      e: 0,
      w: 0,
      worst: Infinity,
      worstAt: '',
      beat: 0,
      out: 0,
      only: [] as string[],
      left: 0,
    };
    const offTot = { beat: 0, out: 0 };
    const readPost: Record<string, [number, number]> = {};
    const readEng: Record<string, [number, number]> = {};
    let journal = '';
    let journalKey = -Infinity;

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      const A = plan(request, 'shipped');
      if (!A || A.alternatives.length === 0) {
        perStop.push(`| ${label} | refused |`);
        continue;
      }
      const B = plan(request, 'noRetype');
      const C = plan(request, 'search');
      const E = plan(request, 'engine');
      const shipped = A.alternatives.map((row) => priced(request, row.pick, marchesOf(row as PlanTotals)));

      const held = new Set(request.units.map((u) => u.id));
      const ts: Campaign[] = [];
      for (const e of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!e.name.startsWith('TotalStack')) continue;
        if (Object.entries(e.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(request, e.counts), e.name, e.counts);
        if (row.damage > 0) ts.push(row);
      }
      const ms = (set: Campaign[]): { rowsBeaten: number; unfitted: number } =>
        ts.length > 0 ? matchedSpend(set as Contender[], ts as Contender[]) : { rowsBeaten: 0, unfitted: 0 };
      const msOff = ms(shipped);
      offTot.beat += msOff.rowsBeaten;
      offTot.out += msOff.unfitted;

      const postBar: Campaign[] = [];
      let armyAbove = 0;
      let armyPairs = 0;
      A.alternatives.forEach((row, i) => {
        stopsAll += 1;
        const marches = kindedMarches(row as PlanTotals);
        const fixed = marches.map((m) => m.counts);
        const cache = new Map<string, ReturnType<typeof enforce>>();
        let stopPairs = 0;
        let stopAbove = 0;
        let stopWorst: { hp: number; text: string } | null = null;
        const stopSources = new Set<string>();
        let repeatAbove = 0;
        const seen = new Set<string>();
        for (const m of marches) {
          const key = JSON.stringify(Object.entries(m.counts).sort());
          const o = orderOf(request, m.counts);
          if (m.kind === 'repeat' && m.index === 0) repeatAbove = o.above;
          if (!seen.has(key)) {
            marchesAll += 1;
            hiredOverTroop += o.hiredOver;
          }
          if (o.pairs.length === 0) {
            seen.add(key);
            continue;
          }
          const first = !seen.has(key);
          seen.add(key);
          stopAbove += o.above;
          stopPairs += o.pairs.length;
          if (first) {
            marchesHit += 1;
            kinds[m.kind] = (kinds[m.kind] ?? 0) + 1;
          }
          for (const p of o.pairs) {
            const d = p.hi.hp - p.lo.hp;
            const text = `${label} ${short(row.pick)} ${m.kind}: ${p.hi.id} ${n(p.hi.hp)} over ${p.lo.id} ${n(p.lo.hp)} (+${n(d)}, ×${(p.hi.hp / p.lo.hp).toFixed(2)})`;
            if (!stopWorst || d > stopWorst.hp) stopWorst = { hp: d, text };
            if (d > worstPair.hp) worstPair = { hp: d, text };
          }
          // Attribution: the re-typing (B differs and is clean), the put-back / §2b (C differs), else the search.
          let source: string;
          const rowB = B?.alternatives.find((r) => r.pick === row.pick);
          const rowC = C?.alternatives.find((r) => r.pick === row.pick);
          const mB = rowB
            ? kindedMarches(rowB as PlanTotals).find((x) => x.kind === m.kind && x.index === m.index)
            : undefined;
          const mC = rowC
            ? kindedMarches(rowC as PlanTotals).find((x) => x.kind === m.kind && x.index === m.index)
            : undefined;
          if (
            row.retyped &&
            mB &&
            !same(mB.counts, m.counts) &&
            orderOf(request, mB.counts).pairs.length === 0
          )
            source = 're-typing';
          else if (mB && mC && !same(mB.counts, mC.counts) && orderOf(request, mC.counts).pairs.length === 0)
            source = row.putBack ? 'put-back' : '§2b ladder maxima';
          else if (m.kind === 'finale') source = 'finale';
          else if (m.kind === 'sequence') source = 'all-in rebuild';
          else if (m.kind === 'tail') source = 'tail (sizer)';
          else
            source =
              row.shape === 'ladder'
                ? 'ladder rung order'
                : row.shape === 'winner'
                  ? 'winner rungs'
                  : `sizer (${row.shape})`;
          if (!mB) source += ' (stop absent without re-typing)';
          stopSources.add(source);
          const s = (bySource[source] ??= { stops: new Set(), marches: 0, played: 0 });
          s.stops.add(`${label}|${row.pick}`);
          s.played += 1;
          if (first) s.marches += 1;

          // Post-hoc enforcement, rated at the march level (first sighting only) and replaced in the campaign.
          let e = cache.get(key);
          if (e === undefined) {
            e = enforce(request, m.counts);
            cache.set(key, e);
            if (first) {
              if (!e) marchVerdict.refused += 1;
              else {
                const before = priced(request, 'b', [m.counts]);
                const after = priced(request, 'a', [e.counts]);
                const r = rate(billOf(before), billOf(after), RATES);
                if (r > 1e-9) marchVerdict.better += 1;
                else if (r < -1e-9) marchVerdict.worse += 1;
                else marchVerdict.equal += 1;
                const line =
                  `| ${label} | ${short(row.pick)} ${m.kind} | ${source} | ${String(o.above)} | ${sgn(r)} | ` +
                  `${sgn(pct(after.damage, before.damage), 1)} % | ${sgn(pct(after.silver, before.silver), 1)} % | ` +
                  `${sgn(pct(after.gold, before.gold), 1)} % | ${sgn(pct(after.seconds, before.seconds), 1)} % | ${e.scale < 1 ? e.scale.toFixed(3) : '1'} |`;
                ratingLines.push(line);
                if (r <= 1e-9) {
                  const jb = planMarch(request, m.counts).summary.journals.enemyFirst;
                  const ja = planMarch(request, e.counts).summary.journals.enemyFirst;
                  notBetter.push(
                    `| ${label} | ${short(row.pick)} ${m.kind} | ${marchText(request, m.counts)} | ${marchText(request, e.counts)} | ` +
                      `${n(Math.round(before.damage))} → ${n(Math.round(after.damage))} | ${n(Math.round(before.silver))} → ${n(Math.round(after.silver))} | ` +
                      `${n(Math.round(before.gold))} → ${n(Math.round(after.gold))} | ${n(Math.round(before.seconds / 3600))} → ${n(Math.round(after.seconds / 3600))} h | ` +
                      `${String(jb.friendlyHits)} → ${String(ja.friendlyHits)} | ${sgn(r)} |`,
                  );
                }
                // The journal of the most-damage-losing violation, as the mechanism's worked example.
                const loss = before.damage - after.damage;
                const key2 = loss;
                if (key2 > journalKey) {
                  journalKey = key2;
                  const describeJ = (counts: Record<string, number>): string => {
                    const { result, summary } = planMarch(request, counts);
                    const units = new Map(request.units.map((u) => [u.id, u]));
                    const hits = new Map<string, { h: number; d: number }>();
                    for (const en of summary.journals.enemyFirst.entries)
                      if (en.actor === 'army') {
                        const x = hits.get(en.unitId) ?? { h: 0, d: 0 };
                        x.h += 1;
                        x.d += en.damage;
                        hits.set(en.unitId, x);
                      }
                    return result.stacks
                      .map((s, k) => {
                        const u = units.get(s.unitId) as UnitDef;
                        const x = hits.get(s.unitId) ?? { h: 0, d: 0 };
                        return `| ${String(k + 1)} | ${s.unitId}${s.pool === 'leadership' ? '' : '*'} | ${String(tierOf(u))} | ${n(s.count)} | ${n(s.totalHp)} | ${String(x.h)} | ${n(Math.round(x.d))} | ${(s.damagePerHit / s.totalHp).toFixed(3)} |`;
                      })
                      .join('\n');
                  };
                  const head =
                    '| kill place | stack | tier | count | HP | enemy-first strikes | damage | damage a point of HP a strike |\n|---:|---|---:|---:|---:|---:|---:|---:|\n';
                  journal =
                    `**${label} ${short(row.pick)} ${m.kind}** — shipped ${n(Math.round(before.damage))} damage, ${n(Math.round(before.silver))} silver; ` +
                    `tier-ordered ${n(Math.round(after.damage))}, ${n(Math.round(after.silver))} silver (rating ${sgn(r)}, scale ${e.scale.toFixed(3)}).\n\nShipped (enemy first):\n\n` +
                    head +
                    describeJ(m.counts) +
                    '\n\nTier-ordered:\n\n' +
                    head +
                    describeJ(e.counts) +
                    '\n';
                }
              }
            }
          }
          if (e) fixed[m.index] = e.counts;
        }
        armyAbove += repeatAbove;
        armyPairs += stopPairs;
        if (stopPairs > 0) stopsHit += 1;
        const post = priced(request, row.pick, fixed);
        postBar.push(post);
        const before = shipped[i] as Campaign;
        const r = rate(billOf(before), billOf(post), RATES);
        if (stopPairs > 0) {
          if (r > 1e-9) campaignVerdict.better += 1;
          else if (r < -1e-9) campaignVerdict.worse += 1;
          else campaignVerdict.equal += 1;
        }
        if (r > 1e-9) postTot.b += 1;
        else if (r < -1e-9) postTot.w += 1;
        else postTot.e += 1;
        if (r < postTot.worst) {
          postTot.worst = r;
          postTot.worstAt = `${label} ${short(row.pick)}`;
        }
        perStop.push(
          `| ${label} | ${short(row.pick)} | ${row.shape} | ${String(stopAbove)} / ${String(stopPairs)} | ${stopWorst?.text.replace(`${label} ${short(row.pick)} `, '') ?? '—'} | ${[...stopSources].join('; ') || '—'} | ${sgn(r)} | ${sgn(pct(post.damage, before.damage), 1)} % | ${sgn(pct(post.silver, before.silver), 1)} % | ${sgn(pct(post.gold, before.gold), 1)} % |`,
        );
      });
      READINGS.forEach((rd) => {
        const c = gain(barBest(postBar, rd), barBest(shipped, rd), rd);
        const x = (readPost[rd.head] ??= [0, 0]);
        if (c > 1e-9) x[0] += 1;
        if (c < -1e-9) x[1] += 1;
      });
      const msPost = ms(postBar);
      postTot.beat += msPost.rowsBeaten;
      postTot.out += msPost.unfitted;

      // The engine prototype, stop by stop against the shipped stop of the same name.
      if (E && E.alternatives.length > 0) {
        const eng = E.alternatives.map((row) => priced(request, row.pick, marchesOf(row as PlanTotals)));
        let left = 0;
        E.alternatives.forEach((row) => {
          for (const m of kindedMarches(row as PlanTotals)) left += orderOf(request, m.counts).pairs.length;
        });
        engTot.left += left;
        const per: string[] = [];
        let dmgGain = 0;
        let silverCost = 0;
        let goldCost = 0;
        let paired = 0;
        E.alternatives.forEach((row, i) => {
          const j = A.alternatives.findIndex((o) => o.pick === row.pick);
          const after = eng[i] as Campaign;
          const before = shipped[j];
          if (j < 0 || !before) {
            engTot.only.push(`${label} ${short(row.pick)} new`);
            per.push(`${short(row.pick)} new`);
            return;
          }
          const r = rate(billOf(before), billOf(after), RATES);
          if (r > 1e-9) engTot.b += 1;
          else if (r < -1e-9) engTot.w += 1;
          else engTot.e += 1;
          if (r < engTot.worst) {
            engTot.worst = r;
            engTot.worstAt = `${label} ${short(row.pick)}`;
          }
          const aboveHere = orderOf(request, (A.alternatives[j] as PlanRow).counts).above;
          per.push(`${short(row.pick)} ${sgn(r)}`);
          hypothesis.push(
            `| ${label} | ${short(row.pick)} | ${String(aboveHere)} | ${sgn(pct(after.damage, before.damage), 1)} % | ${sgn(pct(after.silver, before.silver), 1)} % | ${sgn(pct(after.gold, before.gold), 1)} % | ${sgn(pct(after.burned, before.burned), 1)} % | ${sgn(pct(after.seconds, before.seconds), 1)} % | ${sgn(r)} |`,
          );
          dmgGain += pct(after.damage, before.damage);
          silverCost += pct(after.silver, before.silver);
          goldCost += pct(after.gold, before.gold);
          paired += 1;
        });
        for (const o of A.alternatives)
          if (!E.alternatives.some((x) => x.pick === o.pick)) {
            engTot.only.push(`${label} ${short(o.pick)} dropped`);
            per.push(`${short(o.pick)} dropped`);
          }
        const changes = READINGS.map((rd) => gain(barBest(eng, rd), barBest(shipped, rd), rd));
        READINGS.forEach((rd, k) => {
          const x = (readEng[rd.head] ??= [0, 0]);
          if ((changes[k] ?? 0) > 1e-9) x[0] += 1;
          if ((changes[k] ?? 0) < -1e-9) x[1] += 1;
        });
        const msE = ms(eng);
        engTot.beat += msE.rowsBeaten;
        engTot.out += msE.unfitted;
        engineLines.push(
          `| ${label} | ${String(armyAbove)} | ${String(armyPairs)} | ${paired > 0 ? sgn(dmgGain / paired, 1) : '—'} % | ${paired > 0 ? sgn(silverCost / paired, 1) : '—'} % | ${paired > 0 ? sgn(goldCost / paired, 1) : '—'} % | ${per.join(', ')} | ${String(left)} | ` +
            READINGS.map((_, k) => ((changes[k] ?? 0) === 0 ? '·' : `${sgn(changes[k] ?? 0, 1)} %`)).join(
              ' | ',
            ) +
            ` | ${String(msOff.rowsBeaten)} → ${String(msE.rowsBeaten)} |`,
        );
      } else engineLines.push(`| ${label} | refused |`);
    }

    report.add('\n## A. The shipped bar: violations per stop\n');
    report.add(
      `${String(stopsHit)} of ${String(stopsAll)} stops field at least one higher-tier troop stack over a lower-tier one; ` +
        `${String(marchesHit)} of ${String(marchesAll)} distinct marches. Hired stacks at or above the lowest troop stack: **${String(hiredOverTroop)}**. ` +
        `The widest inversion: ${worstPair.text}.\n\nDistinct violating marches by kind: ${Object.entries(
          kinds,
        )
          .map(([k, v]) => `${k} ${String(v)}`)
          .join(', ')}.\n`,
    );
    report.add(
      '| army | stop | shape | stacks above / pairs (over every march played) | widest pair | source | post-hoc rating | dmg | silver | gold |\n|---|---|---|---|---|---|---:|---:|---:|---:|\n' +
        perStop.join('\n'),
    );
    report.add(
      '\n\n**By source** (stops · distinct marches · marches played):\n\n| source | stops | marches | played |\n|---|---:|---:|---:|\n' +
        Object.entries(bySource)
          .sort((a, b) => b[1].played - a[1].played)
          .map(([k, v]) => `| ${k} | ${String(v.stops.size)} | ${String(v.marches)} | ${String(v.played)} |`)
          .join('\n') +
        '\n',
    );
    void worstLines;

    report.add('\n## B. The rating test: every violating march, tier-ordered after the fact\n');
    report.add(
      `March level (distinct marches): **${String(marchVerdict.better)} > 0 · ${String(marchVerdict.equal)} = 0 · ${String(marchVerdict.worse)} < 0**, ` +
        `${String(marchVerdict.refused)} not fieldable in tier order. Campaign level (violating stops, every violating march replaced): ` +
        `**${String(campaignVerdict.better)} > 0 · ${String(campaignVerdict.equal)} = 0 · ${String(campaignVerdict.worse)} < 0**.\n`,
    );
    report.add(
      '| army | march | source | stacks above | rating | dmg | silver | gold | queue | scale |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|\n' +
        ratingLines.join('\n'),
    );
    report.add(
      '\n\n**Every march the rule does not rate above 0**:\n\n| army | march | shipped | tier-ordered | dmg | silver | gold | queue | our strikes | rating |\n|---|---|---|---|---|---|---|---|---|---:|\n' +
        (notBetter.join('\n') || '| — |') +
        '\n',
    );
    report.add(
      `\nThe post-hoc bar: stops ${String(postTot.b)} better / ${String(postTot.e)} equal / ${String(postTot.w)} worse, the worst ${Number.isFinite(postTot.worst) ? `${postTot.worst.toFixed(2)} (${postTot.worstAt})` : '—'}; ` +
        `TotalStack at matched spend ${String(offTot.beat)}/${String(offTot.out)} → ${String(postTot.beat)}/${String(postTot.out)}. Readings (armies better / worse): ` +
        READINGS.map(
          (rd) => `${rd.head} ${String(readPost[rd.head]?.[0] ?? 0)}/${String(readPost[rd.head]?.[1] ?? 0)}`,
        ).join(', ') +
        '.\n',
    );

    report.add('\n## C. The enemy-first journal of the largest loss\n');
    report.add(journal || '—');

    report.add('\n## D. The engine prototype (`TIER168=on`), every army\n');
    report.add(
      '| army | stacks above (repeat marches, summed over stops) | violating pairs (every march) | mean dmg | mean silver | mean gold | per stop (rating vs shipped) | pairs left | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | TS matched |\n|---|---:|---:|---:|---:|---:|---|---:|' +
        '---:|'.repeat(READINGS.length) +
        '---|\n' +
        engineLines.join('\n'),
    );
    report.add(
      `\n\n**Totals.** Stops ${String(engTot.b)} better / ${String(engTot.e)} equal / ${String(engTot.w)} worse; the worst ${Number.isFinite(engTot.worst) ? `${engTot.worst.toFixed(2)} (${engTot.worstAt})` : '—'}; ` +
        `violating pairs left ${String(engTot.left)}; TotalStack at matched spend ${String(offTot.beat)}/${String(offTot.out)} → ${String(engTot.beat)}/${String(engTot.out)}; ` +
        `stops on one bar only: ${engTot.only.join('; ') || '—'}. Readings (armies better / worse): ` +
        READINGS.map(
          (rd) => `${rd.head} ${String(readEng[rd.head]?.[0] ?? 0)}/${String(readEng[rd.head]?.[1] ?? 0)}`,
        ).join(', ') +
        '.\n',
    );
    report.add(
      '\n**The owner’s hypothesis, stop by stop** — stacks above on the shipped repeat march against what the engine prototype changed:\n\n| army | stop | stacks above | dmg | silver | gold | hired | queue | rating |\n|---|---|---:|---:|---:|---:|---:|---:|---:|\n' +
        hypothesis.join('\n') +
        '\n',
    );
    report.add(RECORDED);
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 7_200_000);
});

const PRIOR = `
**The prior decision.** No owner decision ever chose damage order over tier order for the plan; the tier order was
replaced by measurement, twice.

- **S-22 (2026-09-12, \`killOrder.ts\`)**: *"Elite Preservation: engineers first … then leadership troops by tier
  ascending"* — the kill order the **sizer** (Tier ladder, Troops first) ranks by. Still the sizer's order.
- **S-66 (2026-09-18, commit 02ad272, \`out/98-rung-order.md\`)**: the plan's **ladder** never used the tier order; it
  put *"the weakest type per HP on the biggest rung"*, and S-66 replaced that with a learned order: *"of all 5 040
  assignments the best hit for 5 426 465 against the rule's 5 143 988 … \`makeScorer\` learns the order once a depth
  by that climb"*. The order it learned on his export, biggest rung first, was s1 > r2 > s2 > r1 > a1 > r3 > a2 —
  Rider II over Spearman II/Rider I, Archer I under Rider III. Asked by the owner about the **shelter margin**, not
  about tiers.
- **S-116 (2026-09-20, \`docs/plans/the-order-of-death.md\`, status *next*)**: *"the ideal order of death is
  damage-per-HP rising as total HP falls"* — about the hired stacks under the troops.
- **W11 (2026-09-23, \`docs/plans/the-rated-retyping.md\`)**: *"Complete optimization sizes the troops of a march on
  damage alone: \`rankTroops\`, the rung-order climb and the Elite sizer never look at silver"* — the re-typing then
  assigns types to slots by rating, with no tier constraint either.
- **The owner, 2026-09-23**: *"did we fix the basic feature of correctly ordering troops to have low level die
  first?"*, then *"enforce … it is critical"* and *"it should be checked anyway when sizing"*. This is the first
  decision on the question.
`;

const RECORDED = `
## Z. Recorded on the patched engine (worktree of 884f4c3, 2026-09-23), and what it means

Patch: \`168-engine.patch\` (scratchpad; \`tierOrdered\` in \`src/engine/plan.ts\`, called at the exit of \`ladder\` and
of \`sizedShape\` and on the put-back's \`sizeStacks\` rungs; \`retypeMarch\` refuses an assignment that breaks the
order). Suite not run; not shipped.

- **Violations are everywhere and small.** 59 of 61 stops, 119 of 142 distinct marches; every one a near-tie —
  the widest is ×1.04–×1.10 in HP (Spearman II 60 426 over Rider I 54 693 on the 4 000 case). No hired stack
  stands at or above a troop. Sources: the re-typing (92 marches, 47 stops), the ladder's learned rung order
  (19 marches, 19 stops), the all-in rebuild (4), the finale (3), the winner rungs (1). The Elite/MS sizers only
  violate through their flat profile's rounding, and the re-typing inherits those slots.
- **The rating test fails the rule, not the rating.** Tier-ordered after the fact, 12 marches rate > 0 (all
  below +0.005), 0 = 0, **107 < 0** (43 below −1, the worst −22.59); campaigns 6 / 0 / 53. On 43 of the 107 our
  enemy-first strikes fall; on the others the loss is rounding (≤ 0.1 %). Silver moves ≤ 0.6 %, gold and hired
  never, queue ≤ 1 %: the bill has nothing left to reward, because the model wipes every stack of a march either
  way — a high tier killed first costs the same retrain as one killed last. What the rule protects (high tiers
  **surviving** a fight that ends before the wipe) is not in the battle model, so no rating can see it.
- **The mechanism (§C).** Attack order is base damage descending, so within a round the low tiers strike last.
  Stacked first in the kill order they die before their turn: on the 12 000 export's HS three tier-1 stacks in
  places 1–3 strike 0 times, Archer II drops from 2 strikes to 1 — 4 400 680 → 3 408 041 (−22.6 %) for +0.3 %
  silver. Damage order interleaves the kills with the attack order so every stack gets its turn.
- **The engine prototype**: 9 better / 1 equal / 47 worse (the worst −105.70, localStorage camp SS, re-shaped
  to +351 % hired); 0 pairs left; TotalStack at matched spend 70/13 → 59/14; the bar's most damage worse on 16 armies, better on none; damage a silver worse on 14.
- **The hypothesis** (*"a bit of silver and gold for a massive boost"*) does not hold: the damage change does
  not rise with the stacks above (1–4 per stop; mean −3.4 % on the 4 000 case and the 12 000 export); the two
  gains (+17.1 % 7 000 export SW, +33.1 % localStorage SS) are stops the bar re-chose, paid with +28 % / +351 %
  gold and +34 % / +350 % hired.
`;
