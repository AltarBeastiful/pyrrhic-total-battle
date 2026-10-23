/**
 * 290-299 shared harness (archetype-shape research): the account at Leonidas stars, the kernels, the Tight readings
 * (cheap 0-restart proxy and the full one), the frontier candidates of a stop re-typed as 259/272 do, and a structural
 * description of a march (troop slots in kill order, hired stacks).
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { RAISE_TIGHT, setRaiseKernel } from '../../src/engine/fast';
import type { RaiseKernel } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { effectiveTable } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import type { Bill } from '../../src/engine/rating';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { EXACT_DEFAULTS, createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { countsOf } from '../../src/ui/sections/march/raise';
import { loadKernelModule } from '../../tests/kernel/load';

const module = loadKernelModule();
export const fullKernel: RaiseKernel = createRaiseKernel(module);
export const proxyKernel: RaiseKernel = createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts: 0 });
const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT };
export const useFull = (): void => setRaiseKernel(fullKernel);

export const key = (c: Record<string, number>): string => JSON.stringify(Object.entries(c).filter(([, v]) => v > 0).sort());

export interface TB { bill: Bill; ms: number; counts: Record<string, number> }
/** The Tight-raised bill of a count vector under one kernel. */
export function tight(kernel: RaiseKernel, request: StackRequest, counts: Record<string, number>): TB {
  const t = performance.now();
  const base: StackResult = planMarch(request, counts).result;
  const own = countsOf(base);
  const fast = kernel.position({ request, base, modes: MODES });
  const raised = fast !== null ? fast.counts : own;
  const ms = performance.now() - t;
  const { result, summary } = applyCounts(request, base, { ...own, ...raised });
  return {
    bill: { damage: summary.minDamage, silver: summary.recovery.silver, gold: summary.recovery.gold, hired: hiredLost(result.stacks), dragonCoins: summary.recovery.dragonCoins, seconds: summary.recovery.seconds },
    ms,
    counts: { ...own, ...raised },
  };
}

export function accountInput(star: number): CampaignInput {
  const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
  if (parsed.kind !== 'profile') throw new Error('profile');
  const profile = structuredClone(parsed.payload) as Profile;
  profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
  return buildPlanRequest(profile, profile.setups[0]!);
}

export const STOPS = ['burn-saver', 'silver-saver', 'sweet-spot'];

export interface Cand { counts: Record<string, number>; pre: number }
/** Frontier shapes at the stop's burn, re-typed (tierCandidate), distinct, with their pre-Tight rating vs the shipped stop. */
export function frontierCands(input: CampaignInput, frontier: { counts: Record<string, number>; repeat: { mercLost: number } }[], stopCounts: Record<string, number>, burn: number): { cands: Cand[]; shapes: number; ms: number } {
  const t = performance.now();
  const shippedPre = marchBill(input.request, stopCounts);
  const shapes = new Map<string, Record<string, number>>();
  for (const r of frontier) if (r.repeat.mercLost === burn) shapes.set(key(r.counts), r.counts);
  const seen = new Set<string>([key(stopCounts)]);
  const cands: Cand[] = [];
  for (const counts of shapes.values()) {
    const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
    const next = found?.counts ?? counts;
    if (seen.has(key(next))) continue;
    seen.add(key(next));
    cands.push({ counts: next, pre: rate(shippedPre, marchBill(input.request, next), CAMPAIGN.markerRates) });
  }
  return { cands, shapes: shapes.size, ms: performance.now() - t };
}

export interface Struct {
  troops: string[]; // unit ids, highest total HP first (dies first)
  hp: number[]; // their total HPs
  hired: Record<string, number>;
  burn: number;
}
export function structOf(request: StackRequest, counts: Record<string, number>): Struct {
  const { result } = planMarch(request, counts);
  const t = result.stacks.filter((s) => s.pool === 'leadership').sort((a, b) => b.totalHp - a.totalHp);
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  return { troops: t.map((s) => s.unitId), hp: t.map((s) => Math.round(s.totalHp)), hired, burn: hiredLost(result.stacks) };
}
export const typeTable = (request: StackRequest): Map<string, { tier: number; cat: string; group: string; hp: number; dpu: number }> =>
  new Map(effectiveTable(request).map((e) => [e.id, { tier: e.unit.tier, cat: String(e.unit.category), group: String(e.unit.group), hp: e.hp, dpu: e.damagePerUnit }]));
export { planCampaign, planMarch, rate, marchBill, retypeMarch, CAMPAIGN };

// ---------------------------------------------------------------------------------------------------------------
// The archetype generator (291+). A pure function of (request, shipped stop): no history.
// ---------------------------------------------------------------------------------------------------------------
import { buildKillOrder } from '../../src/engine/killOrder';
import { rankTroops } from '../../src/engine/plan';

export interface Archetype { counts: Record<string, number>; seed: string; perm: string[] }

/**
 * Archetypes of a stop: the stop's own structure (its hired stacks of every pool but leadership, its troop slots and
 * the types they hold) with the troop types laid over the slots in a ball of orders around three structural seeds
 * (the ranking order = weakest damage per HP on the biggest slot, S-22's tier/kill order, and the stop's own order):
 * each seed, every single swap of two slots, plus the adjacent double swaps of the ranking seed.
 * Each type is sized to at least its slot's HP (retype's `build`), the leadership must fit.
 */
export function archetypes(request: StackRequest, stopCounts: Record<string, number>, opts: { cap?: number } = {}): Archetype[] {
  const table = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const { result } = planMarch(request, stopCounts);
  const troop = result.stacks.filter((s) => s.pool === 'leadership');
  const slots = troop.map((s) => s.totalHp);
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  const asIs = troop.map((s) => s.unitId);
  const k = slots.length;
  const bySlot = slots.map((_, i) => i).sort((a, b) => slots[b]! - slots[a]!);
  const lay = (rank: Map<string, number>): string[] => {
    const types = [...asIs].sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity));
    const out = [...asIs];
    bySlot.forEach((slot, i) => (out[slot] = types[i]!));
    return out;
  };
  const rankMap = new Map(rankTroops(effectiveTable(request)).map((e, i) => [e.id, i]));
  const tierMap = new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i]));
  const seeds: [string, string[]][] = [['rank', lay(rankMap)], ['tier', lay(tierMap)], ['asis', asIs]];
  const byId = new Map(table.map((e) => [e.id, e]));
  const seen = new Set<string>();
  const out: Archetype[] = [];
  const add = (seed: string, perm: string[]): void => {
    const sig = perm.join(',');
    if (seen.has(sig)) return;
    seen.add(sig);
    const next: Record<string, number> = { ...hired };
    let lead = 0;
    perm.forEach((id, slot) => {
      const t = byId.get(id)!;
      const count = Math.ceil(slots[slot]! / t.hp);
      next[id] = count;
      lead += count * t.cost;
    });
    if (lead <= request.housing.leadership) out.push({ counts: next, seed, perm });
  };
  const swapped = (p: string[], a: number, b: number): string[] => { const q = [...p]; [q[a], q[b]] = [q[b]!, q[a]!]; return q; };
  for (const [name, p] of seeds) {
    add(name, p);
    // Swaps are by position in HP order (biggest slot first), so a swap moves a type one rank up or down.
    const ord = bySlot;
    for (let a = 0; a < k; a += 1) for (let b = a + 1; b < k; b += 1) add(`${name}~swap`, swapped(p, ord[a]!, ord[b]!));
  }
  const rp = seeds[0]![1];
  for (let a = 0; a + 1 < k; a += 1) for (let b = a + 2; b + 1 < k; b += 1)
    add('rank~adj2', swapped(swapped(rp, bySlot[a]!, bySlot[a + 1]!), bySlot[b]!, bySlot[b + 1]!));
  return opts.cap ? out.slice(0, opts.cap) : out;
}

// ---------------------------------------------------------------------------------------------------------------
// Generator 2 (292): type sets x slot shapes, each laid in ranking order then re-typed by the production climb.
// ---------------------------------------------------------------------------------------------------------------
export interface Arch2 { counts: Record<string, number>; label: string }
export function archetypes2(request: StackRequest, stopCounts: Record<string, number>, opts: { retype?: boolean; maxDrop?: number; ball?: boolean } = {}): Arch2[] {
  const table = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const { result } = planMarch(request, stopCounts);
  const troop = result.stacks.filter((s) => s.pool === 'leadership').sort((a, b) => b.totalHp - a.totalHp);
  const v = troop.map((s) => s.totalHp);
  if (v.length === 0) return [];
  const hired0: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired0[s.unitId] = s.count;
  // Hired variants (structure only): the stop's own hired stacks; and the same authority stacks (they define the burn)
  // with every dominance stack at its floor of one chunk (10), which the raise then re-spends under the queue.
  const hiredFloor: Record<string, number> = { ...hired0 };
  for (const s of result.stacks) if (s.pool === 'dominance') hiredFloor[s.unitId] = Math.min(s.count, 10);
  const L = request.housing.leadership;
  const maxDrop = opts.maxDrop ?? 4;
  // weakest-first orderings of the types (structure only): damage per leadership, HP per leadership, tier then kill rank
  const orders: [string, typeof table][] = [
    ['dpl', [...table].sort((a, b) => a.damagePerUnit / a.cost - b.damagePerUnit / b.cost)],
    ['hpl', [...table].sort((a, b) => a.hp / a.cost - b.hp / b.cost)],
    ['tier', [...table].sort((a, b) => a.unit.tier - b.unit.tier || a.rank - b.rank)],
  ];
  const sets = new Map<string, { ids: string[]; tag: string }>();
  for (const [tag, ord] of orders) for (let t = 0; t <= maxDrop; t += 1) {
    const drop = new Set(ord.slice(0, t).map((e) => e.id));
    const ids = table.filter((e) => !drop.has(e.id)).map((e) => e.id).sort();
    if (!sets.has(ids.join(','))) sets.set(ids.join(','), { ids, tag: `${tag}-${String(t)}` });
  }
  // the stop's own type set too
  const own = troop.map((s) => s.unitId).sort();
  if (!sets.has(own.join(','))) sets.set(own.join(','), { ids: own, tag: 'own' });
  const resample = (k2: number): number[] => {
    if (v.length === 1) return Array<number>(k2).fill(1);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    return Array.from({ length: k2 }, (_, j) => {
      const x = k2 === 1 ? 0 : (j * (v.length - 1)) / (k2 - 1);
      const lo = Math.floor(x), hi = Math.min(v.length - 1, lo + 1);
      return ((v[lo]! * (1 - (x - lo)) + v[hi]! * (x - lo)) / mean);
    });
  };
  const flat = (k2: number): number[] => Array.from({ length: k2 }, (_, j) => 1 - RANK_SPREAD_ * j);
  const rankMap = new Map(rankTroops(effectiveTable(request)).map((e, i) => [e.id, i]));
  const out: Arch2[] = [];
  const seen = new Set<string>();
  const byId = new Map(table.map((e) => [e.id, e]));
  const legalPools = (counts: Record<string, number>): boolean => {
    const p = planMarch(request, counts).result.pools;
    return p.leadership.used <= p.leadership.capacity && p.authority.used <= p.authority.capacity && p.dominance.used <= p.dominance.capacity;
  };
  for (const { ids, tag, hired, hTag } of [...sets.values()].flatMap((x) => [{ ...x, hired: hired0, hTag: 'H0' }, { ...x, hired: hiredFloor, hTag: 'Hf' }])) {
    const perm = [...ids].sort((a, b) => (rankMap.get(a) ?? 99) - (rankMap.get(b) ?? 99));
    for (const [shapeTag, shape] of [['own', resample(ids.length)], ['flat', flat(ids.length)]] as const) {
      // largest H such that the ranking-order lay fits the leadership
      const build = (H: number): { counts: Record<string, number>; lead: number } => {
        const counts: Record<string, number> = { ...hired };
        let lead = 0;
        perm.forEach((id, slot) => { const t = byId.get(id)!; const c = Math.ceil((H * shape[slot]!) / t.hp); counts[id] = c; lead += c * t.cost; });
        return { counts, lead };
      };
      let lo = 0, hi = 1e7;
      for (let i = 0; i < 60; i += 1) { const mid = (lo + hi) / 2; if (build(mid).lead <= L) lo = mid; else hi = mid; }
      const b = build(lo);
      const sig = key(b.counts);
      if (seen.has(sig)) continue;
      seen.add(sig);
      if (legalPools(b.counts)) out.push({ counts: b.counts, label: `${tag}/${shapeTag}/${hTag}` });
      if (opts.retype !== false) {
        const found = retypeMarch(request, b.counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
        if (found && !seen.has(key(found.counts)) && legalPools(found.counts)) { seen.add(key(found.counts)); out.push({ counts: found.counts, label: `${tag}/${shapeTag}/${hTag}+retype` }); }
      }
      if (opts.ball === true && hTag === 'Hf' && (tag === 'dpl-0' || tag === 'own')) {
        // The ball: the same slots with the types laid in S-22's kill order and in the ranking's order, and every single swap of two slots.
        const slotOrder = Array.from({ length: ids.length }, (_, i) => i); // slots are already in HP order, biggest first
        const hp = (id: string): number => byId.get(id)!.hp;
        void hp;
        const killRank = new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i]));
        const lays: [string, string[]][] = [['tier', [...ids].sort((a, c) => (killRank.get(a) ?? 99) - (killRank.get(c) ?? 99))], ['rank', perm]];
        for (const [lt, base] of lays) {
          const candidates: string[][] = [base];
          for (let a = 0; a < base.length; a += 1) for (let c = a + 1; c < base.length; c += 1) { const q = [...base]; [q[a], q[c]] = [q[c]!, q[a]!]; candidates.push(q); }
          for (const q of candidates) {
            const counts: Record<string, number> = { ...hired };
            let lead = 0;
            q.forEach((id, slot) => { const t = byId.get(id)!; const c = Math.ceil((lo * shape[slot]!) / t.hp); counts[id] = c; lead += c * t.cost; });
            void slotOrder;
            const sg = key(counts);
            if (lead > L || seen.has(sg) || !legalPools(counts)) continue;
            seen.add(sg);
            out.push({ counts, label: `${tag}/${shapeTag}/${hTag}/ball-${lt}` });
          }
        }
      }
    }
  }
  return out;
}
const RANK_SPREAD_ = 0.0019;

/** The bar's gates on a replacement (rated stops, `admits` in plan.ts): burn not above, damage >= 95 %, queue may not rise; a silver saver no more silver. */
export function admissible(pick: string, shipped: Bill, next: Bill): boolean {
  if ((next.hired ?? 0) > (shipped.hired ?? 0)) return false;
  if (next.damage < shipped.damage * 0.95) return false;
  if ((next.seconds ?? 0) > (shipped.seconds ?? 0) + 1e-6) return false;
  if (pick === 'silver-saver' && (next.silver ?? 0) > (shipped.silver ?? 0) + 1e-6) return false;
  return true;
}
