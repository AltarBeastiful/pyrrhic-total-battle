/**
 * 280 — **the data behind `docs/how-generate-and-tight-work.html`** (2026-10-23). Reads the owner's export of
 * 2026-10-22, plans it, raises every stop with Tight, and dumps everything the explainer page draws as JSON:
 * the army, the stops before and after Tight, the frontier cloud, one battle journal, a one-type slider, a
 * 2-D slice of Tight's box, and the Merc saver's shapes at Leonidas ★0 / ★1 before and after Tight.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file.json> pnpm vitest run tools/theorycraft/280-explainer-data.test.ts`
 * `PART=a|b|c` limits the run (a: army, plan, stops, battle; b: slider + box; c: the ★0/★1 shapes).
 */
/// <reference types="node" />
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { rate } from '../../src/engine/rating';
import type { Bill } from '../../src/engine/rating';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { burnOf, countsOf, shelterCeiling, troopFloor } from '../../src/ui/sections/march/raise';

type Counts = Record<string, number>;
const RATES = CAMPAIGN.markerRates;

function billOf(request: StackRequest, base: StackResult, counts: Counts): Bill & { burn: number; seconds: number } {
  const { result, summary } = applyCounts(request, base, counts);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hired: hiredLost(result.stacks),
    burn: burnOf(base, counts),
    seconds: summary.recovery.seconds,
  };
}

function tightOf(request: StackRequest, counts: Counts) {
  const base = planMarch(request, counts).result;
  const own = countsOf(base);
  const t0 = performance.now();
  const row = positionTrades(request, base, ['tight']).rows[0];
  const ms = performance.now() - t0;
  const tight = { ...own, ...(row?.counts ?? {}) };
  return { base, own, tight, how: row?.how ?? null, space: row?.space ?? 0, scored: row?.scored ?? 0, ms };
}

const nz = (c: Counts): Counts => Object.fromEntries(Object.entries(c).filter(([, v]) => v > 0));

function load(star?: number) {
  const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
  if (parsed.kind !== 'profile') throw new Error('profile');
  const profile = structuredClone(parsed.payload) as Profile;
  if (star !== undefined) profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
  return { profile, input: buildPlanRequest(profile, profile.setups[0]!) };
}

describe.skipIf(!process.env.THEORY)('280 — explainer data', () => {
  it('dumps the page data', () => {
    const outf = process.env.OUTF ?? '/dev/stdout';
    const part = process.env.PART ?? 'abc';
    const out: Record<string, unknown> = existsSync(outf) && outf !== '/dev/stdout' ? JSON.parse(readFileSync(outf, 'utf8') || '{}') : {};
    const save = () => writeFileSync(outf, JSON.stringify(out, null, 1));
    const { profile, input } = load();
    const { request } = input;

    if (part.includes('a')) {
      // ---- the army
      out.housing = request.housing;
      out.enemy = request.enemy;
      out.marches = CAMPAIGN.marches;
      out.rates = RATES;
      out.captains = profile.sources.captains
        .filter((c) => (c.level ?? 0) > 0)
        .map((c) => ({ id: c.captainId, level: c.level, star: c.star }));
      out.units = request.units.map((u) => {
        const e = effectiveUnit(u, request.totals, request.enemy, request.activeEvents);
        return {
          id: u.id, label: u.label, name: u.name, kind: u.kind, pool: u.pool, tier: u.tier, group: u.group ?? null,
          category: u.category ?? null, cost: u.cost, health: u.health, strength: u.strength,
          hp: e.hpPerUnit, str: Math.round(e.strengthPerUnit * 100) / 100, cap: request.caps[u.id] ?? null,
        };
      });
      // ---- how many count vectors fit the housing (and the stock, for capped mercenaries), exactly
      const countFits = (pool: 'leadership' | 'authority' | 'dominance'): string => {
        const room = request.housing[pool];
        let dp: bigint[] = new Array<bigint>(room + 1).fill(0n);
        dp[0] = 1n;
        for (const u of request.units.filter((x) => x.pool === pool)) {
          const cap = request.caps[u.id];
          const next: bigint[] = new Array<bigint>(room + 1).fill(0n);
          for (let s = 0; s <= room; s += 1) {
            if (cap === undefined) next[s] = dp[s]! + (s >= u.cost ? next[s - u.cost]! : 0n);
            else for (let k = 0; k <= cap && s - k * u.cost >= 0; k += 1) next[s] = next[s]! + dp[s - k * u.cost]!;
          }
          dp = next;
        }
        return dp.reduce((a, b) => a + b, 0n).toString();
      };
      const lead = countFits('leadership');
      const merc = countFits('authority');
      const mon = countFits('dominance');
      out.recipes = { lead, merc, mon, total: (BigInt(lead) * BigInt(merc) * BigInt(mon)).toString() };
      // ---- the plan
      let t0 = performance.now();
      const plan = planCampaign({ ...input, withFrontier: true });
      out.planMs = Math.round(performance.now() - t0);
      out.frontierCount = plan.frontier?.length ?? 0;
      // A thinned cloud: every frontier row's repeat figures.
      out.frontier = (plan.frontier ?? []).map((r) => [r.repeat.damage, Math.round(r.repeat.silver), r.repeat.mercLost, r.onFrontier ? 1 : 0, r.undominated ? 1 : 0]);
      out.stops = plan.alternatives.map((s) => {
        const t = tightOf(request, s.counts);
        const asIs = billOf(request, t.base, t.own);
        const tight = billOf(request, t.base, t.tight);
        return {
          pick: s.pick, counts: nz(s.counts), marches: s.marches, sequence: s.sequence !== undefined,
          repeat: { damage: s.repeat.damage, silver: Math.round(s.repeat.silver), gold: s.repeat.gold, burn: s.repeat.mercLost, seconds: s.repeat.seconds },
          totalDamage: s.totalDamage,
          asIs, tight, tightCounts: nz(t.tight), tightHow: t.how, tightSpace: t.space, tightScored: t.scored, tightMs: Math.round(t.ms),
          rating: rate(asIs, tight, RATES),
        };
      });
      // ---- one battle: the sweet spot after Tight, worst opening (enemy first)
      const sweet = plan.alternatives.find((s) => s.pick === 'sweet-spot') ?? plan.alternatives[0]!;
      const t = tightOf(request, sweet.counts);
      const played = applyCounts(request, t.base, t.tight);
      out.battle = {
        pick: sweet.pick,
        stacks: played.result.stacks.map((s) => ({ id: s.unitId, pool: s.pool, count: s.count, hp: s.totalHp, hit: Math.round(s.damagePerHit) })),
        journal: played.summary.journals.enemyFirst.entries.map((e) => [e.actor === 'enemy' ? 0 : 1, e.unitId, Math.round(e.damage)]),
        rounds: played.summary.journals.enemyFirst.rounds,
        total: played.summary.minDamage,
      };
      save();
    }

    if (part.includes('b')) {
      // ---- the slider and the box, on the Merc saver (or the first stop)
      const plan = planCampaign(input);
      const stop = plan.alternatives.find((s) => s.pick === 'burn-saver') ?? plan.alternatives[0]!;
      const t = tightOf(request, stop.counts);
      const floor = troopFloor(t.base)!;
      const slots = t.base.stacks
        .filter((s) => s.pool !== 'leadership' && s.count > 0)
        .map((s) => ({ id: s.unitId, pool: s.pool, from: s.count, to: Math.min(shelterCeiling(floor, s.hpPerUnit), request.caps[s.unitId] ?? Number.MAX_SAFE_INTEGER), tight: t.tight[s.unitId] }));
      const cap = burnOf(t.base, t.own);
      const asIs = billOf(request, t.base, t.own);
      const fits = (c: Counts): boolean => {
        const used = { authority: 0, dominance: 0 } as Record<string, number>;
        for (const u of request.units) if (u.pool !== 'leadership') used[u.pool] = (used[u.pool] ?? 0) + (c[u.id] ?? 0) * u.cost;
        return used.authority! <= request.housing.authority && used.dominance! <= request.housing.dominance;
      };
      const read = (c: Counts) => {
        if (!fits(c)) return { refused: 'housing' };
        const b = billOf(request, t.base, c);
        return { ...b, overBurn: b.burn > cap, rating: Math.round(rate(asIs, b, RATES) * 100) / 100 };
      };
      out.box = { pick: stop.pick, floor, burnCap: cap, slots, space: t.space, scored: t.scored, how: t.how, ms: Math.round(t.ms), asIs, tight: billOf(request, t.base, t.tight), tightCounts: nz(t.tight), own: nz(t.own) };
      // slider: the movable slot with the widest range, others at the plan's own counts
      const wide = [...slots].sort((a, b) => (b.to - b.from) - (a.to - a.from));
      const s1 = wide[0]!;
      const sliderRows: unknown[] = [];
      for (let n = s1.from; n <= s1.to; n += 1) sliderRows.push({ n, ...read({ ...t.own, [s1.id]: n }) });
      out.slider = { id: s1.id, from: s1.from, to: s1.to, rows: sliderRows };
      // 2-D slices, every count of two slots, the rest at Tight's answer: the two widest mercenary slots (the burn cap
      // draws a staircase) and the two widest monster slots (the dominance housing draws the edge).
      const sliceOf = (a: (typeof slots)[number], b: (typeof slots)[number]) => {
        const xs: number[] = []; const ys: number[] = [];
        for (let x = a.from; x <= a.to; x += 1) xs.push(x);
        for (let y = b.from; y <= b.to; y += 1) ys.push(y);
        const cells: unknown[] = [];
        for (const y of ys) for (const x of xs) {
          const r = read({ ...t.tight, [a.id]: x, [b.id]: y }) as Record<string, unknown>;
          cells.push(r.refused ? null : [r.damage, Math.round(r.silver as number), r.gold, r.burn, r.overBurn ? 1 : 0, r.rating]);
        }
        return { x: a.id, y: b.id, xs, ys, cells };
      };
      const mercs = wide.filter((s) => s.pool === 'authority');
      const mons = wide.filter((s) => s.pool === 'dominance' && s.to > s.from);
      out.slices = [sliceOf(mercs[0]!, mercs[1]!), ...(mons.length >= 2 ? [sliceOf(mons[0]!, mons[1]!)] : [])];
      out.held = nz(t.tight);
      save();
    }

    if (part.includes('c')) {
      // ---- why two steps disagree: the Merc saver's shapes, ★0 and ★1
      const stars: unknown[] = [];
      for (const star of [0, 1]) {
        const { input: inp } = load(star);
        const req = inp.request;
        const plan = planCampaign({ ...inp, withFrontier: true });
        const shipped = plan.alternatives.find((a) => a.pick === 'burn-saver');
        if (!shipped) { stars.push({ star, missing: true }); continue; }
        const burn = shipped.repeat.mercLost;
        const shapes = new Map<string, Counts>();
        for (const r of plan.frontier ?? [])
          if (r.repeat.mercLost === burn) shapes.set(JSON.stringify(Object.entries(nz(r.counts)).sort()), r.counts);
        const shippedBase = marchBill(req, shipped.counts);
        const st = tightOf(req, shipped.counts);
        const shippedTight = billOf(req, st.base, st.tight);
        const rows: unknown[] = [];
        for (const counts of shapes.values()) {
          const raw = marchBill(req, counts);
          const found = retypeMarch(req, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
          const next = found?.counts ?? counts;
          const pre = marchBill(req, next);
          const tt = tightOf(req, next);
          const post = billOf(req, tt.base, tt.tight);
          rows.push({
            raw: [raw.damage, Math.round(raw.silver ?? 0)],
            pre: [pre.damage, Math.round(pre.silver ?? 0), pre.gold],
            post: [post.damage, Math.round(post.silver ?? 0), post.gold],
            preRating: Math.round(rate(shippedBase, pre, RATES) * 100) / 100,
            postRating: Math.round(rate(shippedTight, post, RATES) * 100) / 100,
          });
        }
        stars.push({
          star, burn, shapes: shapes.size,
          shipped: { counts: nz(shipped.counts), pre: [shippedBase.damage, Math.round(shippedBase.silver ?? 0), shippedBase.gold], post: [shippedTight.damage, Math.round(shippedTight.silver ?? 0), shippedTight.gold], tightCounts: nz(st.tight) },
          rows,
        });
        out.stars = stars;
        save();
      }
    }
  }, 3_600_000);
});
