/**
 * 300 — **top-down descent from the flat eleven-slot shape** (follows 259/290-297). A candidate generator that reads
 * only the account state and the stop (its hired stacks, hence its burn): seed with every leadership troop type on
 * near-flat slots (ranking order, the biggest H that fits the leadership), under two hired variants (the stop's own
 * hired stacks, and the same with every dominance stack at one chunk, 292's `Hf`). Re-type each with the production
 * climb (`retypeMarch`, tierCandidate, the owner's `markerRates`; a silver saver's climb under its own pre-Tight
 * silver). Then greedy descent: from the current march, every child drops one troop type, either re-laid flat
 * (move `a`) or dropping that type's slot and keeping the other slots' HP shape (move `b`); each child re-typed and
 * read by the 0-restart Tight proxy, rated against the shipped stop's proxy reading. Step to the best child while
 * it rates higher (admissible first); at most MAXV marches visited. The visited marches are then read like 295
 * (`read`: admissible on the proxy against the shipped full-Tight bill, top 6 by rating, full Tight, admissible
 * again), so the figures line up with 295's frontier and archetype columns.
 *
 * One JSON line per stop to `OUTF`, with the per-k best proxy rating and the features Part B tabulates.
 *
 * `THEORY=1 ACCT=<file> OUTF=<jsonl> [RUN=acct|bench] (not MODE: vitest sets it) [FRONTIER=1] [FROM=0] [TO=99] [MAXV=60] pnpm vitest run tools/theorycraft/300-descent-from-flat.test.ts`
 */
/// <reference types="node" />
import { appendFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { buildKillOrder } from '../../src/engine/killOrder';
import { effectiveTable, rankTroops } from '../../src/engine/plan';
import type { CampaignInput } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import {
  CAMPAIGN, STOPS, accountInput, admissible, frontierCands, fullKernel, key, marchBill, planCampaign, planMarch,
  proxyKernel, rate, retypeMarch, tight, useFull,
} from './290-common';
import type { TB } from './290-common';

const MAXV = Number(process.env.MAXV ?? 60);
const TOPK = 6;
const SPREAD = 0.0019; // 292's near-flat step
const V2 = process.env.V2 === '1' || process.env.V3 === '1';
const V3 = process.env.V3 === '1';

/** 290-common's `admissible`, as a distance: 0 inside the gates, else the summed percent outside, and which gates. */
function gates(pick: string, shipped: Bill, next: Bill): { v: number; why: string } {
  let v = 0, why = '';
  if ((next.hired ?? 0) > (shipped.hired ?? 0)) { v += 100 * ((next.hired ?? 0) - (shipped.hired ?? 0)); why += 'H'; }
  if (next.damage < shipped.damage * 0.95) { v += ((shipped.damage * 0.95 - next.damage) / shipped.damage) * 100; why += 'D'; }
  if ((next.seconds ?? 0) > (shipped.seconds ?? 0) + 1e-6) { v += (((next.seconds ?? 0) - (shipped.seconds ?? 0)) / Math.max(1, shipped.seconds ?? 0)) * 100; why += 'Q'; }
  if (pick === 'silver-saver' && (next.silver ?? 0) > (shipped.silver ?? 0) + 1e-6) { v += (((next.silver ?? 0) - (shipped.silver ?? 0)) / Math.max(1, shipped.silver ?? 0)) * 100; why += 'S'; }
  return { v, why };
}

interface Troop { id: string; hp: number }
interface Node {
  counts: Record<string, number>;
  troops: Troop[]; // biggest slot first
  hired: Record<string, number>;
  p: TB; // proxy reading
  r: number; // rating vs the shipped proxy reading
  adm: boolean; // gates vs the shipped proxy reading
  v: number; // how far outside the gates (0 when admissible)
  why: string; // gates failed: H hired, D damage, Q queue, S silver
  how: string;
}

function troopsOf(request: StackRequest, counts: Record<string, number>): { troops: Troop[]; hired: Record<string, number> } {
  const { result } = planMarch(request, counts);
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  const troops = result.stacks.filter((s) => s.pool === 'leadership' && s.count > 0).map((s) => ({ id: s.unitId, hp: s.totalHp })).sort((a, b) => b.hp - a.hp);
  return { troops, hired };
}

/** The perm laid over a slot shape (weights, biggest first), H the largest that fits the leadership. */
function layAt(request: StackRequest, hired: Record<string, number>, perm: string[], shape: number[], caps?: { seconds?: number | undefined; silver?: number | undefined }): Record<string, number> | null {
  const byId = new Map(effectiveTable(request).filter((e) => e.pool === 'leadership').map((e) => [e.id, e]));
  const L = request.housing.leadership;
  const build = (H: number): { counts: Record<string, number>; lead: number } => {
    const counts: Record<string, number> = { ...hired };
    let lead = 0;
    perm.forEach((id, i) => { const t = byId.get(id)!; const c = Math.ceil((H * shape[i]!) / t.hp); counts[id] = c; lead += c * t.cost; });
    return { counts, lead };
  };
  let lo = 0, hi = 1e9;
  for (let i = 0; i < 70; i += 1) { const mid = (lo + hi) / 2; if (build(mid).lead <= L) lo = mid; else hi = mid; }
  if (caps !== undefined) {
    // V3 fit: the biggest H whose pre-Tight bill also holds the stop's queue (and a silver saver's silver).
    const over = (H: number): boolean => {
      const bill = marchBill(request, build(H).counts);
      return (caps.seconds !== undefined && (bill.seconds ?? 0) > caps.seconds + 1e-6) || (caps.silver !== undefined && (bill.silver ?? 0) > caps.silver + 1e-6);
    };
    if (over(lo)) {
      let a = 0, b = lo;
      for (let i = 0; i < 24; i += 1) { const mid = (a + b) / 2; if (over(mid)) b = mid; else a = mid; }
      lo = a;
    }
  }
  const b = build(lo);
  if (perm.some((id) => (b.counts[id] ?? 0) <= 0)) return null;
  return b.counts;
}

const legal = (request: StackRequest, counts: Record<string, number>): boolean => {
  const p = planMarch(request, counts).result.pools;
  return p.leadership.used <= p.leadership.capacity && p.authority.used <= p.authority.capacity && p.dominance.used <= p.dominance.capacity;
};

interface DescentOut {
  visited: Node[];
  path: string[];
  ms: number;
  perK: Record<number, number>; // best proxy rating seen at each k (admissible only)
}

function descend(request: StackRequest, pick: string, stopCounts: Record<string, number>, shippedProxy: Bill): DescentOut {
  const t0 = performance.now();
  const table = effectiveTable(request);
  const rankMap = new Map(rankTroops(table).map((e, i) => [e.id, i]));
  const allIds = table.filter((e) => e.pool === 'leadership').map((e) => e.id);
  const byRank = (ids: string[]): string[] => [...ids].sort((a, b) => (rankMap.get(a) ?? 99) - (rankMap.get(b) ?? 99));
  const flat = (k: number): number[] => Array.from({ length: k }, (_, j) => 1 - SPREAD * j);
  const { result } = planMarch(request, stopCounts);
  const H0: Record<string, number> = {};
  const Hf: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') { H0[s.unitId] = s.count; Hf[s.unitId] = s.pool === 'dominance' ? Math.min(s.count, 10) : s.count; }
  const stopBill = marchBill(request, stopCounts);
  const silverCeiling = pick === 'silver-saver' ? stopBill.silver : undefined;
  const secondsCeiling = V3 ? stopBill.seconds : undefined;
  const caps = V3 ? { seconds: stopBill.seconds, silver: silverCeiling } : undefined;
  const lay = (req: StackRequest, h: Record<string, number>, perm: string[], sh: number[]): Record<string, number> | null => layAt(req, h, perm, sh, caps);
  const seen = new Set<string>([key(stopCounts)]);
  const visited: Node[] = [];
  const evaluate = (counts: Record<string, number> | null, how: string): Node | null => {
    if (counts === null || visited.length >= MAXV) return null;
    if (!legal(request, counts)) return null;
    const found = retypeMarch(request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true, silverCeiling, secondsCeiling });
    const next = found?.counts ?? counts;
    const k = key(next);
    if (seen.has(k)) return null;
    seen.add(k);
    const p = tight(proxyKernel, request, next);
    const { troops, hired } = troopsOf(request, next);
    const g = gates(pick, shippedProxy, p.bill);
    const node: Node = { counts: next, troops, hired, p, r: rate(shippedProxy, p.bill, CAMPAIGN.markerRates), adm: admissible(pick, shippedProxy, p.bill), v: g.v, why: g.why, how };
    visited.push(node);
    return node;
  };
  const better = (a: Node, b: Node): boolean => (a.adm !== b.adm ? a.adm : a.adm ? a.r > b.r + 1e-6 : a.v < b.v - 1e-9 || (Math.abs(a.v - b.v) <= 1e-9 && a.r > b.r + 1e-6));
  const killRank = new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i]));
  const lead = table.filter((e) => e.pool === 'leadership');
  const orders: [string, (ids: string[]) => string[]][] = [['rank', byRank]];
  if (V2) {
    const by = (f: (e: (typeof lead)[number]) => number) => (ids: string[]): string[] => [...ids].sort((a, b) => f(lead.find((e) => e.id === a)!) - f(lead.find((e) => e.id === b)!));
    orders.push(['tier', (ids) => [...ids].sort((a, b) => (killRank.get(a) ?? 99) - (killRank.get(b) ?? 99))], ['dpl', by((e) => e.damagePerUnit / e.cost)], ['hpl', by((e) => e.hp / e.cost)]);
  }
  const seeds: Node[] = [];
  for (const [name, ord] of orders) for (const [hn, h] of [['Hf', Hf], ['H0', H0]] as const) {
    const n = evaluate(lay(request, h, ord(allIds), flat(allIds.length)), `flat-${name}/${hn}`);
    if (n) seeds.push(n);
  }
  if (seeds.length === 0) return { visited, path: [], ms: performance.now() - t0, perK: {} };
  let cur = seeds.reduce((m, n) => (better(n, m) ? n : m));
  const path = [`${cur.how} k${String(cur.troops.length)} ${cur.r.toFixed(2)}${cur.adm ? '' : '!' + cur.why}`];
  while (visited.length < MAXV && cur.troops.length > 1) {
    const kids: Node[] = [];
    const ids = cur.troops.map((t) => t.id);
    for (let i = 0; i < ids.length && visited.length < MAXV; i += 1) {
      const rest = ids.filter((_, j) => j !== i);
      const a = evaluate(lay(request, cur.hired, byRank(rest), flat(rest.length)), `-${ids[i]!}/a`);
      if (a) kids.push(a);
      const restHp = cur.troops.filter((_, j) => j !== i).map((t) => t.hp);
      const mean = restHp.reduce((s, x) => s + x, 0) / restHp.length;
      const b = evaluate(lay(request, cur.hired, rest, restHp.map((h) => h / mean)), `-${ids[i]!}/b`);
      if (b) kids.push(b);
    }
    if (kids.length === 0) break;
    const best = kids.reduce((m, n) => (better(n, m) ? n : m));
    if (!better(best, cur)) break;
    cur = best;
    path.push(`${cur.how} k${String(cur.troops.length)} ${cur.r.toFixed(2)}${cur.adm ? '' : '!' + cur.why}`);
  }
  const perK: Record<number, number> = {};
  for (const n of visited) if (n.adm) perK[n.troops.length] = Math.max(perK[n.troops.length] ?? -Infinity, n.r);
  return { visited, path, ms: performance.now() - t0, perK };
}

/** 295's read on already-proxied candidates: admissible vs the shipped full bill, top TOPK by rating, full Tight. */
function readTop(request: StackRequest, pick: string, shipped: Bill, cands: { counts: Record<string, number>; p: TB }[]): { rf: number; bill: Bill; counts: Record<string, number> | null; ms: number } {
  const t0 = performance.now();
  const rows = cands.map((c) => ({ c, r0: rate(shipped, c.p.bill, CAMPAIGN.markerRates) })).filter((r) => admissible(pick, shipped, r.c.p.bill)).sort((a, b) => b.r0 - a.r0);
  let best: { rf: number; bill: Bill; counts: Record<string, number> | null } = { rf: 0, bill: shipped, counts: null };
  for (const r of rows.slice(0, TOPK)) {
    const f = tight(fullKernel, request, r.c.counts);
    if (!admissible(pick, shipped, f.bill)) continue;
    const rf = rate(shipped, f.bill, CAMPAIGN.markerRates);
    if (rf > best.rf) best = { rf, bill: f.bill, counts: r.c.counts };
  }
  return { ...best, ms: performance.now() - t0 };
}

function features(request: StackRequest): Record<string, number> {
  const t = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const tiers = new Set(t.map((e) => e.unit.tier));
  return {
    L: request.housing.leadership, A: request.housing.authority, D: request.housing.dominance, m: t.length, tiers: tiers.size,
    minCost: Math.min(...t.map((e) => e.cost)), maxCost: Math.max(...t.map((e) => e.cost)),
    // the HP a flat k = m lay gives each slot, in the cheapest-HP type's units of leadership
    minHpPerLead: Math.min(...t.map((e) => e.hp / e.cost)), maxHpPerLead: Math.max(...t.map((e) => e.hp / e.cost)),
  };
}

const shape = (request: StackRequest, counts: Record<string, number> | null): { k: number; types: string[]; hp: number[] } | null => {
  if (!counts) return null;
  const { troops } = troopsOf(request, counts);
  return { k: troops.length, types: troops.map((t) => t.id), hp: troops.map((t) => Math.round(t.hp)) };
};

function study(label: string, extra: Record<string, unknown>, input: CampaignInput, withFrontier: boolean): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const tp = performance.now();
  const plan = planCampaign({ ...input, withFrontier });
  const planMs = performance.now() - tp;
  for (const stop of plan.alternatives) {
    if (!STOPS.includes(stop.pick) || stop.sequence !== undefined) continue;
    const req = input.request;
    const shipped = tight(fullKernel, req, stop.counts);
    const shippedProxy = tight(proxyKernel, req, stop.counts);
    const d = descend(req, stop.pick, stop.counts, shippedProxy.bill);
    const D = readTop(req, stop.pick, shipped.bill, d.visited);
    let F: { rf: number; bill: Bill; counts: Record<string, number> | null; ms: number; n: number } | null = null;
    if (withFrontier) {
      const tf = performance.now();
      const fr = frontierCands(input, plan.frontier ?? [], stop.counts, stop.repeat.mercLost);
      const proxied = fr.cands.map((c) => ({ counts: c.counts, p: tight(proxyKernel, req, c.counts) }));
      const r = readTop(req, stop.pick, shipped.bill, proxied);
      F = { ...r, ms: performance.now() - tf, n: fr.cands.length };
    }
    const bestVisited = d.visited.filter((n) => n.adm).sort((a, b) => b.r - a.r)[0];
    out.push({
      label, ...extra, pick: stop.pick, burn: stop.repeat.mercLost, planMs: Math.round(planMs),
      feat: features(req), silverCap: marchBill(req, stop.counts).silver,
      shipped: shipped.bill, shippedShape: shape(req, stop.counts),
      descent: { rf: D.rf, bill: D.bill, counts: D.counts, shape: shape(req, D.counts), visited: d.visited.length, ms: Math.round(d.ms + D.ms), msSearch: Math.round(d.ms), msRead: Math.round(D.ms), path: d.path, perK: d.perK, bestProxyK: bestVisited?.troops.length ?? null },
      frontier: F ? { rf: F.rf, bill: F.bill, counts: F.counts, shape: shape(req, F.counts), n: F.n, ms: Math.round(F.ms) } : null,
    });
  }
  return out;
}

describe.skipIf(!process.env.THEORY)('300 — descent from the flat shape', () => {
  it('descends', () => {
    useFull();
    const outf = process.env.OUTF!;
    writeFileSync(outf, '');
    const emit = (rows: Record<string, unknown>[]): void => { for (const r of rows) appendFileSync(outf, JSON.stringify(r) + '\n'); };
    if ((process.env.RUN ?? 'acct') === 'acct') {
      const best = new Map<string, { counts: Record<string, number>; bill: Bill }>();
      const inputs = [0, 1, 2].map((s) => accountInput(s));
      for (const star of [0, 1, 2]) {
        const rows = study(`acct ★${String(star)}`, { star }, inputs[star]!, process.env.FRONTIER === '1');
        emit(rows);
        for (const r of rows) {
          const dsc = r.descent as { counts: Record<string, number> | null; bill: Bill };
          best.set(`${String(star)}/${String(r.pick)}`, dsc.counts ? { counts: dsc.counts, bill: dsc.bill } : { counts: {}, bill: r.shipped as Bill });
        }
      }
      // Monotone: the ★a descent best played under ★b against the ★b descent best.
      for (const pick of STOPS) for (const [a, b] of [[0, 1], [1, 2], [0, 2]] as const) {
        const A = best.get(`${String(a)}/${pick}`), B = best.get(`${String(b)}/${pick}`);
        if (!A || !B || Object.keys(A.counts).length === 0) continue;
        const played = tight(fullKernel, inputs[b]!.request, A.counts);
        emit([{ monotone: `${pick} ★${String(a)}→★${String(b)}`, played: played.bill, best: B.bill, rate: rate(played.bill, B.bill, CAMPAIGN.markerRates) }]);
      }
    } else {
      const from = Number(process.env.FROM ?? 0), to = Number(process.env.TO ?? 999);
      for (const [i, sc] of criteriaScenarios().entries()) {
        if (i < from || i > to) continue;
        try {
          emit(study(sc.label, { idx: i }, { request: sc.request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }, process.env.FRONTIER === '1'));
        } catch (e) {
          emit([{ label: sc.label, idx: i, skipped: String(e) }]);
        }
      }
    }
  }, 86_400_000);
});
