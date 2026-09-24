/**
 * 175 — **every death order, exhaustively** (W13, `docs/plans/every-ordering.md` §1; the owner, 2026-09-24:
 * *"are we really testing every death order, with heroes and all bonuses, to maximize the march?"*).
 *
 * The enemy kills our highest-total-HP stack first, so a death order is which troop type stands at which HP
 * level. `retypeMarch` (`src/engine/retype.ts`) walks every type→slot assignment only when there are at most
 * `EXHAUSTIVE` (5 000) of them, else climbs swaps and replacements from three seeds. Here, on every march of
 * every stop of every benchmark army (the set of 169/172, planned at HEAD with `budgetMs` off, so no deadline
 * shapes a march), the same space is walked **whole**, inside the AssemblyScript kernel (`Kernel.enumerate`,
 * `kernel/assembly/index.ts`, held `Object.is` to a TypeScript walk by `tests/kernel/parity.test.ts`; its
 * battle and bill are the engine's to the bit). Heroes, captains, equipment and events reach it through the
 * packed table (`src/kernel/pack.ts`), as they reach `marchResult`.
 *
 *  - **A. The re-typing space.** The hired stacks kept to the unit; the troop stacks read as slots (total HP,
 *    kill order); every injective assignment of the account's troop types (`retypeMarch`'s candidate set:
 *    every `leadership` row of `effectiveTable`) to the slots, each sized `ceil(slotHp / hp)`, admissible when
 *    the leadership fits and the worst-opening damage holds (retype's rules). Rated against the shipped march
 *    with `rate(·, ·, CAMPAIGN.markerRates)`; the shipped march is itself in the space at rating 0, so the
 *    best rating **is** the gap. Also the best with the silver not rising (the silver saver's guard).
 *  - **A2. Damage only** — the most worst-opening damage in the same space, at any cost: the criterion
 *    `orderFor` climbs on.
 *  - **A3. Diagnostic, not a proposal** (the shelter is the owner's rule): the slots are every stack's HP
 *    level, hired ones too, and the candidates the troop types plus the march's own hired types, each of
 *    those placed somewhere (at most its stock, every pool within housing). What an unsheltered order adds.
 *  - **Guards** per stop, on A's winners laid into every march of the stop: the silver saver's silver, the
 *    shelter, the rung order (repeat damage rising along the burn), and a stop coming to dominate another
 *    (march bills summed).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/175-every-death-order.test.ts`
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { effectiveTable, marchResult, planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { EXHAUSTIVE, marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import type { Enumeration, Kernel } from '../../src/kernel';
import { POOL_BITS, R, createKernel } from '../../src/kernel';
import { marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
/** A march "gains" above this rating (the tolerance of 169's permanent test). */
const TOL = 0.01;
/** A3 is walked whole up to this many assignments a march (5e8 took 381 s on one march); above it, "one lifted". */
const A3_CAP = Number(process.env.A3_CAP ?? 5e7);
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const sgn = (v: number, digits = 2): string =>
  !Number.isFinite(v) ? '—' : Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}`;
const pctOf = (after: number, before: number): number => (before > 0 ? ((after - before) / before) * 100 : 0);
const keyOf = (counts: Record<string, number>): string =>
  JSON.stringify(
    Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(),
  );
/** m × (m−1) × … × (m−k+1). */
const falling = (m: number, k: number): number => {
  let p = 1;
  for (let i = 0; i < k; i += 1) p *= m - i;
  return p;
};
const billOfRecord = (rec: ArrayLike<number>): Bill => ({
  damage: rec[R.minDamage] as number,
  silver: rec[R.silver] as number,
  gold: rec[R.gold] as number,
  hired: rec[R.hired] as number,
  dragonCoins: rec[R.dragonCoins] as number,
  seconds: rec[R.seconds] as number,
});
const sumBills = (bills: Bill[]): Bill =>
  bills.reduce<Bill>(
    (a, b) => ({
      damage: a.damage + b.damage,
      silver: (a.silver ?? 0) + (b.silver ?? 0),
      gold: (a.gold ?? 0) + (b.gold ?? 0),
      hired: (a.hired ?? 0) + (b.hired ?? 0),
      dragonCoins: (a.dragonCoins ?? 0) + (b.dragonCoins ?? 0),
      seconds: (a.seconds ?? 0) + (b.seconds ?? 0),
    }),
    { damage: 0, silver: 0, gold: 0, hired: 0, dragonCoins: 0, seconds: 0 },
  );

/** The troop types of a march, biggest slot first (kill order), with the hired stacks starred in place. */
const orderText = (request: StackRequest, counts: Record<string, number>): string =>
  marchResult(request, counts)
    .result.stacks.map((s) => `${s.unitId}${s.pool === 'leadership' ? '' : '*'} ${n(s.count)}`)
    .join(' › ');

interface MarchStudy {
  counts: Record<string, number>;
  base: Bill;
  k: number;
  m: number;
  space: number;
  engineExhaustive: boolean;
  a: Enumeration;
  aCounts: Record<string, number> | null;
  aBill: Bill | null;
  guardedCounts: Record<string, number> | null;
  a2Counts: Record<string, number>;
  a2Bill: Bill;
  a3: Enumeration;
  a3Space: number;
  /** `whole`: the A3 space walked whole; `one lifted`: past `A3_CAP`, one hired stack out of place at most. */
  a3Mode: 'whole' | 'one lifted';
  a3Counts: Record<string, number> | null;
  a3Sheltered: boolean;
  /** `retypeMarch` itself (the engine's search, `CAMPAIGN.planFixes.tierCandidate`) run on the shipped march. */
  engineFinds: number;
  parity: boolean;
  ms: number;
}

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const stacks = marchResult(request, counts).result.stacks;
  const troops = stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};

function study(request: StackRequest, kernel: Kernel, counts: Record<string, number>): MarchStudy {
  const began = performance.now();
  const table = effectiveTable(request);
  const leadership = table.map((e, t) => ({ e, t })).filter(({ e }) => e.pool === 'leadership');
  const candidates = leadership.map(({ t }) => t);
  const stacks = marchResult(request, counts).result.stacks;
  const troops = stacks.filter((s) => s.pool === 'leadership');
  const hired = stacks.filter((s) => s.pool !== 'leadership');
  const row = (id: string): number => kernel.ids.indexOf(id);
  const base = kernel.battle(counts);
  const baseBill = billOfRecord(base);
  const fixed = new Float64Array(kernel.types);
  for (const s of hired) fixed[row(s.unitId)] = s.count;
  const slots = troops.map((s) => s.totalHp);
  const k = slots.length;
  const m = candidates.length;
  const space = falling(m, k);

  const a = kernel.enumerate({ slots, candidates, fixed, pools: POOL_BITS.leadership, base });
  const build = (
    assignment: number[],
    over: readonly number[],
    cands: readonly number[],
    from: Float64Array,
  ) => {
    if (assignment.some((c) => c < 0)) return null;
    const out: Record<string, number> = {};
    kernel.ids.forEach((id, t) => {
      if ((from[t] ?? 0) > 0) out[id] = from[t] as number;
    });
    assignment.forEach((c, slot) => {
      const t = cands[c] as number;
      const entry = table[t] as (typeof table)[number];
      out[entry.id] = Math.ceil((over[slot] as number) / entry.hp);
    });
    return out;
  };
  const aCounts = build(a.best.assignment, slots, candidates, fixed);
  const guardedCounts = build(a.guarded.assignment, slots, candidates, fixed);
  const a2Counts = build(a.damage.assignment, slots, candidates, fixed) as Record<string, number>;

  // Spot parity: the kernel's winners through the TypeScript engine.
  const tsBill = (c: Record<string, number>): Bill => marchBill(request, c);
  let parity = Object.is(tsBill(counts).damage, baseBill.damage);
  const aBill = aCounts ? tsBill(aCounts) : null;
  if (aCounts && aBill) parity &&= Object.is(rate(baseBill, aBill, RATES), a.best.rating);
  if (guardedCounts) parity &&= Object.is(rate(baseBill, tsBill(guardedCounts), RATES), a.guarded.rating);
  const a2Bill = tsBill(a2Counts);
  parity &&= Object.is(a2Bill.damage, a.damage.damage);

  // A3: every stack a slot; troop types plus the march's own hired types (each placed), stock-capped.
  // Biggest first (kill order): the kernel then prunes a branch where the hired types still to place cannot
  // all find a slot they fit within their stock (Hall's condition on nested ranges).
  const allSlots = stacks.map((s) => s.totalHp);
  const hiredRows = hired.map((s) => row(s.unitId));
  const cands3 = [...hiredRows, ...candidates];
  const caps = Float64Array.from(kernel.ids, (id, t) =>
    (table[t] as (typeof table)[number]).pool === 'leadership' ? Infinity : (request.caps[id] ?? Infinity),
  );
  const a3Space = falling(allSlots.length, hired.length) * falling(m, k);
  const pools3 = POOL_BITS.leadership | POOL_BITS.authority | POOL_BITS.dominance;
  let a3: Enumeration;
  let a3Counts: Record<string, number> | null;
  let a3Mode: 'whole' | 'one lifted';
  if (a3Space <= A3_CAP) {
    a3Mode = 'whole';
    a3 = kernel.enumerate({
      slots: allSlots,
      candidates: cands3,
      required: [...hiredRows.map(() => true), ...candidates.map(() => false)],
      fixed: new Float64Array(kernel.types),
      caps,
      pools: pools3,
      base,
    });
    a3Counts = build(a3.best.assignment, allSlots, cands3, new Float64Array(kernel.types));
  } else {
    // Too large whole: one hired stack at a time joins the troop slots (its own slot with them, kill order),
    // the other hired stacks kept — every order with at most one hired stack out of place. A lower bound.
    a3Mode = 'one lifted';
    a3 = { ...a, battles: 0, admissible: 0, positive: 0 };
    a3Counts = null;
    for (const h of hired) {
      const own = stacks.filter((s) => s.pool === 'leadership' || s === h);
      const slotsH = own.map((s) => s.totalHp);
      const fixedH = new Float64Array(fixed);
      fixedH[row(h.unitId)] = 0;
      const candsH = [row(h.unitId), ...candidates];
      const e = kernel.enumerate({
        slots: slotsH,
        candidates: candsH,
        required: [true, ...candidates.map(() => false)],
        fixed: fixedH,
        caps,
        pools: pools3,
        base,
      });
      a3 = {
        ...a3,
        battles: a3.battles + e.battles,
        complete: a3.complete && e.complete,
        admissible: a3.admissible + e.admissible,
        positive: a3.positive + e.positive,
      };
      if (e.best.rating > a3.best.rating) {
        a3 = { ...a3, best: e.best };
        a3Counts = build(e.best.assignment, slotsH, candsH, fixedH);
      }
    }
    if (!a3Counts) a3Counts = aCounts;
  }
  if (a3Counts) parity &&= Object.is(rate(baseBill, tsBill(a3Counts), RATES), a3.best.rating);
  const found = retypeMarch(request, counts, RATES, { tierCandidate: CAMPAIGN.planFixes.tierCandidate });
  return {
    engineFinds: found?.rating ?? 0,
    counts,
    base: baseBill,
    k,
    m,
    space,
    engineExhaustive: space <= EXHAUSTIVE,
    a,
    aCounts,
    aBill,
    guardedCounts,
    a2Counts,
    a2Bill,
    a3,
    a3Space,
    a3Mode,
    a3Counts,
    a3Sheltered: a3Counts ? sheltered(request, a3Counts) : true,
    parity,
    ms: performance.now() - began,
  };
}

describe.skipIf(!process.env.THEORY)('every death order', () => {
  it('walks every re-typing of every march on every bar', () => {
    const module = loadKernelModule();
    const profile = ownerProfile();
    const only = process.env.SCEN175;
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])].filter(
      (s) => !only || s.label.includes(only),
    );
    const report = new Report('175-every-death-order');
    report.add('# 175 — every death order, exhaustively\n');
    report.add(
      'Every benchmark army (the set of 169/172) planned at HEAD, `budgetMs` off. For every distinct march of every ' +
        'stop: **A** every injective assignment of the account’s troop types to the march’s troop slots (hired kept, ' +
        'each type sized `ceil(slotHp / hp)`, leadership within housing, worst-opening damage held — `retypeMarch`’s ' +
        'rules and candidate set), walked whole in the kernel and rated against the shipped march with ' +
        '`rate(·, ·, markerRates)` (silver 5, gold 5, hired 5, coins 8, queue 40); **A2** the most damage in that ' +
        'space; **A3** (diagnostic) every stack a slot, hired types placed too. “Engine path” is what `retypeMarch` ' +
        `would walk on a march with that many slots: exhaustive when the space is ≤ ${n(EXHAUSTIVE)}, else the climb. ` +
        'The shipped march is in its own space at rating 0, so A’s best rating is what the engine leaves. Every ' +
        'figure below is measured; nothing is recomputed by hand.\n',
    );

    const armyRows: string[] = [
      '| army | stops | marches | A space (k of m) | engine exhaustive / climb | beat shipped > 0.01 (exh. / climb) | best gain | Σ gain | A2 best dmg % (its rating) | A3 best (unsheltered winner) | battles | s |',
      '|---|---:|---:|---|---|---|---:|---:|---|---|---:|---:|',
    ];
    const gainRows: string[] = [
      '| army | stops | engine path | space | rating | dmg Δ % | silver Δ % | gold Δ % | queue Δ % | silver-guarded best | `retypeMarch` on it | shipped (kill order) | exhaustive best (kill order) |',
      '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|',
    ];
    const guardRows: string[] = [
      '| army | stop | marches gaining | stop rating (Σ bills) | flags |',
      '|---|---|---:|---:|---|',
    ];
    const a3Rows: string[] = [
      '| army | stops | A best | A3 best | added | A3 winner sheltered | battles | walk | A3 winner (kill order) |',
      '|---|---|---:|---:|---:|---|---:|---|---|',
    ];
    const tot = {
      marches: 0,
      exh: 0,
      climb: 0,
      gainExh: 0,
      gainClimb: 0,
      max: 0,
      maxAt: '',
      sum: 0,
      sumExh: 0,
      sumClimb: 0,
      battles: 0,
      ms: 0,
      parity: 0,
      a2Max: 0,
      a2MaxAt: '',
      a2Sum: 0,
      a2Gainers: 0,
      a3Add: 0,
      a3AddAt: '',
      a3Gainers: 0,
      a3Incomplete: 0,
      flags: 0,
      ssRise: 0,
      positive: 0,
      reach: 0,
      reachSum: 0,
      miss: 0,
      missGap: 0,
    };

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      let plan: CampaignPlan;
      try {
        plan = planCampaign({
          request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        armyRows.push(`| ${label} | refused |`);
        continue;
      }
      const rows = plan.alternatives;
      const kernel = createKernel(module, request, RATES);
      const studies = new Map<string, MarchStudy>();
      const stopsOf = new Map<string, Set<string>>();
      for (const row of rows)
        for (const march of marchesOf(row as PlanTotals)) {
          const key = keyOf(march);
          if (!studies.has(key)) {
            const s = study(request, kernel, march);
            studies.set(key, s);
            if (process.env.TRACE175)
              process.stderr.write(
                `  march k=${String(s.k)} A ${n(s.a.battles)} A3 ${n(s.a3.battles)} ${(s.ms / 1000).toFixed(1)} s\n`,
              );
          }
          const set = stopsOf.get(key) ?? new Set<string>();
          set.add(short(row.pick));
          stopsOf.set(key, set);
        }
      const all = [...studies.values()];
      process.stderr.write(
        `175 ${label}: ${String(all.length)} marches, ${n(all.reduce((x, s) => x + s.a.battles + s.a3.battles, 0))} battles, ` +
          `${(all.reduce((x, s) => x + s.ms, 0) / 1000).toFixed(1)} s\n`,
      );
      const ks = [...new Set(all.map((s) => `${String(s.k)} of ${String(s.m)}`))].join(', ');
      const exh = all.filter((s) => s.engineExhaustive).length;
      const gainers = all.filter((s) => s.a.best.rating > TOL);
      const battles = all.reduce((sum, s) => sum + s.a.battles + s.a3.battles, 0);
      const ms = all.reduce((sum, s) => sum + s.ms, 0);
      const best = Math.max(0, ...all.map((s) => s.a.best.rating));
      const sum = gainers.reduce((acc, s) => acc + s.a.best.rating, 0);
      tot.marches += all.length;
      tot.exh += exh;
      tot.climb += all.length - exh;
      tot.battles += battles;
      tot.ms += ms;
      tot.sum += sum;
      tot.parity += all.filter((s) => !s.parity).length;
      tot.positive += all.reduce((acc, s) => acc + s.a.positive, 0);
      for (const s of gainers) {
        if (s.engineFinds >= s.a.best.rating - 5e-4) {
          tot.reach += 1;
          tot.reachSum += s.a.best.rating;
        } else {
          tot.miss += 1;
          tot.missGap += s.a.best.rating - Math.max(0, s.engineFinds);
        }
        if (s.engineExhaustive) {
          tot.gainExh += 1;
          tot.sumExh += s.a.best.rating;
        } else {
          tot.gainClimb += 1;
          tot.sumClimb += s.a.best.rating;
        }
        if (s.a.best.rating > tot.max) {
          tot.max = s.a.best.rating;
          tot.maxAt = `${label} ${[...(stopsOf.get(keyOf(s.counts)) ?? [])].join('/')}`;
        }
        const b = s.aBill as Bill;
        const g = s.guardedCounts ? s.a.guarded.rating : -Infinity;
        gainRows.push(
          `| ${label} | ${[...(stopsOf.get(keyOf(s.counts)) ?? [])].join('/')} | ${s.engineExhaustive ? 'exhaustive' : 'climb'} | ` +
            `${n(s.space)} | **${sgn(s.a.best.rating, 3)}** | ${sgn(pctOf(b.damage, s.base.damage), 3)} | ` +
            `${sgn(pctOf(b.silver ?? 0, s.base.silver ?? 0), 2)} | ${sgn(pctOf(b.gold ?? 0, s.base.gold ?? 0), 2)} | ` +
            `${sgn(pctOf(b.seconds ?? 0, s.base.seconds ?? 0), 2)} | ${sgn(g, 3)} | ${sgn(s.engineFinds, 3)} | ${orderText(request, s.counts)} | ` +
            `${orderText(request, s.aCounts as Record<string, number>)} |`,
        );
      }
      // A2
      let a2Best = 0;
      let a2Rating = 0;
      for (const s of all) {
        const d = pctOf(s.a2Bill.damage, s.base.damage);
        if (d > 1e-9) tot.a2Gainers += 1;
        tot.a2Sum += d;
        if (d > a2Best) {
          a2Best = d;
          a2Rating = rate(s.base, s.a2Bill, RATES);
        }
        if (d > tot.a2Max) {
          tot.a2Max = d;
          tot.a2MaxAt = `${label} ${[...(stopsOf.get(keyOf(s.counts)) ?? [])].join('/')} (rating ${sgn(rate(s.base, s.a2Bill, RATES), 3)})`;
        }
      }
      // A3
      let a3Best = 0;
      let a3Unsheltered = false;
      for (const s of all) {
        const aBest = Math.max(0, s.a.best.rating);
        const a3b = Math.max(0, s.a3.best.rating);
        if (s.a3Mode !== 'whole') tot.a3Incomplete += 1;
        if (a3b > a3Best) {
          a3Best = a3b;
          a3Unsheltered = !s.a3Sheltered;
        }
        const added = a3b - aBest;
        if (added > TOL) {
          tot.a3Gainers += 1;
          if (added > tot.a3Add) {
            tot.a3Add = added;
            tot.a3AddAt = `${label} ${[...(stopsOf.get(keyOf(s.counts)) ?? [])].join('/')}`;
          }
        }
        if (added > TOL)
          a3Rows.push(
            `| ${label} | ${[...(stopsOf.get(keyOf(s.counts)) ?? [])].join('/')} | ${sgn(aBest, 3)} | ${sgn(a3b, 3)} | ` +
              `**${sgn(added, 3)}** | ${s.a3Sheltered ? 'yes' : 'no'} | ${n(s.a3.battles)} | ${s.a3Mode === 'whole' ? 'whole' : `one lifted (space ${n(s.a3Space)} > ${n(A3_CAP)})`} | ` +
              `${s.a3Counts ? orderText(request, s.a3Counts) : '—'} |`,
          );
      }
      armyRows.push(
        `| ${label} | ${String(rows.length)} | ${String(all.length)} | ${ks} | ${String(exh)} / ${String(all.length - exh)} | ` +
          `${String(gainers.length)} (${String(gainers.filter((s) => s.engineExhaustive).length)} / ${String(gainers.filter((s) => !s.engineExhaustive).length)}) | ` +
          `${sgn(best, 3)} | ${sgn(sum, 3)} | ${sgn(a2Best, 2)} % (${sgn(a2Rating, 2)}) | ${sgn(a3Best, 3)}${a3Unsheltered ? ' (yes)' : ''} | ` +
          `${n(battles)} | ${(ms / 1000).toFixed(1)} |`,
      );

      // Guards: A's winners laid into every march of every stop.
      const winnerOf = (march: Record<string, number>): Record<string, number> => {
        const s = studies.get(keyOf(march)) as MarchStudy;
        return s.a.best.rating > TOL && s.aCounts ? s.aCounts : march;
      };
      const billsOf = (row: PlanRow, swap: boolean): Bill =>
        sumBills(
          marchesOf(row as PlanTotals).map((march) =>
            billOfRecord(kernel.battle(swap ? winnerOf(march) : march)),
          ),
        );
      const before = rows.map((row) => billsOf(row, false));
      const after = rows.map((row) => billsOf(row, true));
      const repeatDamage = (row: PlanRow, swap: boolean): number =>
        billOfRecord(kernel.battle(swap ? winnerOf(row.counts) : row.counts)).damage;
      const dominates = (x: Bill, y: Bill): boolean =>
        x.damage >= y.damage &&
        (x.silver ?? 0) <= (y.silver ?? 0) &&
        (x.hired ?? 0) <= (y.hired ?? 0) &&
        (x.gold ?? 0) <= (y.gold ?? 0) &&
        (x.damage > y.damage ||
          (x.silver ?? 0) < (y.silver ?? 0) ||
          (x.hired ?? 0) < (y.hired ?? 0) ||
          (x.gold ?? 0) < (y.gold ?? 0));
      const rungs = rows.map((row, i) => ({ row, i })).filter(({ row }) => row.pick !== 'all-in');
      rows.forEach((row, i) => {
        const marches = marchesOf(row as PlanTotals);
        const moved = [...new Set(marches.map(keyOf))].filter(
          (key) => ((studies.get(key) as MarchStudy).a.best.rating ?? 0) > TOL,
        );
        if (moved.length === 0) return;
        const flags: string[] = [];
        const b = before[i] as Bill;
        const a = after[i] as Bill;
        if (row.pick === 'silver-saver' && (a.silver ?? 0) > (b.silver ?? 0)) {
          flags.push(`silver saver’s silver rises ${sgn(pctOf(a.silver ?? 0, b.silver ?? 0))} %`);
          tot.ssRise += 1;
        }
        if (!marches.every((march) => sheltered(request, winnerOf(march)))) flags.push('unsheltered');
        const r = rungs.findIndex((x) => x.i === i);
        if (r >= 0) {
          const d = repeatDamage(row, true);
          const prev = rungs[r - 1];
          const next = rungs[r + 1];
          if (
            prev &&
            repeatDamage(prev.row, true) >= d &&
            repeatDamage(prev.row, false) < repeatDamage(row, false)
          )
            flags.push(`order: ${short(prev.row.pick)} now hits as hard`);
          if (
            next &&
            repeatDamage(next.row, true) <= d &&
            repeatDamage(next.row, false) > repeatDamage(row, false)
          )
            flags.push(`order: out-hits ${short(next.row.pick)}`);
        }
        rows.forEach((other, j) => {
          if (j === i || other.pick === 'all-in' || row.pick === 'all-in') return;
          const oa = after[j] as Bill;
          const ob = before[j] as Bill;
          if (dominates(a, oa) && !dominates(b, ob)) flags.push(`now dominates ${short(other.pick)}`);
          if (dominates(oa, a) && !dominates(ob, b)) flags.push(`now dominated by ${short(other.pick)}`);
        });
        if (flags.length > 0) tot.flags += 1;
        guardRows.push(
          `| ${label} | ${short(row.pick)} | ${String(moved.length)} | ${sgn(rate(b, a, RATES), 3)} | ${flags.join('; ') || '—'} |`,
        );
      });
    }

    report.add('\n## Per army\n\n');
    report.add(armyRows.join('\n'));
    report.add(
      `\n\n**Totals.** ${String(tot.marches)} distinct marches; the engine’s path would be exhaustive on ` +
        `${String(tot.exh)} and the climb on ${String(tot.climb)}. The exhaustive walk beats the shipped march by more ` +
        `than ${String(TOL)} on **${String(tot.gainExh + tot.gainClimb)}** (${String(tot.gainExh)} exhaustive-path, ` +
        `${String(tot.gainClimb)} climb-path); best **${sgn(tot.max, 3)}** (${tot.maxAt || '—'}); Σ ${sgn(tot.sum, 3)} ` +
        `(exhaustive-path ${sgn(tot.sumExh, 3)}, climb-path ${sgn(tot.sumClimb, 3)}). Admissible assignments rating ` +
        `above 1e-9, all marches: ${n(tot.positive)}. Spot parity (kernel winners through \`marchBill\` + \`rate\`, ` +
        `\`Object.is\`): ${tot.parity === 0 ? 'every march ✓' : `${String(tot.parity)} marches differ`}.\n\n` +
        '**Search or pipeline?** `retypeMarch` itself (tier candidate on, no deadline), run on each gaining shipped ' +
        `march, reaches the exhaustive best on **${String(tot.reach)}** of them (Σ ${sgn(tot.reachSum, 3)}): there the ` +
        'search is not what leaves the rating, the plan does not hand that march to it or does not keep what it finds. ' +
        `It falls short on **${String(tot.miss)}** (the climb’s own gap, Σ ${sgn(tot.missGap, 3)}).\n`,
    );
    report.add('\n## A. Every march the exhaustive walk beats by more than 0.01\n\n');
    report.add(
      'Rating and deltas are the exhaustive best against the shipped march (hired lost cannot move: the hired stacks ' +
        'are kept). “Silver-guarded best” is the best in the same space with the silver not rising. Stacks in kill ' +
        'order, biggest first; `*` = hired.\n\n',
    );
    report.add(gainRows.length > 2 ? gainRows.join('\n') : '- none');
    report.add('\n\n## A2. Damage only (the criterion `orderFor` climbs on)\n\n');
    report.add(
      `Marches where some assignment hits harder than the shipped one: ${String(tot.a2Gainers)} of ${String(tot.marches)}; ` +
        `the most **${sgn(tot.a2Max, 3)} %** worst-opening damage (${tot.a2MaxAt || '—'}); mean ` +
        `${sgn(tot.marches > 0 ? tot.a2Sum / tot.marches : 0, 3)} %. The per-army column above gives each army’s ` +
        'most damage and what that damage-only winner rates at the owner’s rates.\n',
    );
    report.add('\n## A3. Diagnostic: the shelter lifted (hired stacks’ HP levels in the slot set)\n\n');
    report.add(
      'Not a proposal — the shelter is the owner’s rule. Slots = every stack’s HP level; candidates = the troop ' +
        'types plus the march’s own hired types, each hired type placed on some slot, at most its stock, every pool ' +
        `within housing. Walked whole when the space (positions of the hired stacks × troop assignments) is at most ` +
        `${n(A3_CAP)}; above it, **one lifted**: each hired stack in turn joins the troop slots with its own slot, the ` +
        'other hired stacks kept — every order with at most one hired stack out of place, a lower bound that contains ' +
        `A. “Added” = A3 best − A best. Marches where it adds more than ${String(TOL)}: **${String(tot.a3Gainers)}**; ` +
        `the most **${sgn(tot.a3Add, 3)}** (${tot.a3AddAt || '—'}); marches read by “one lifted”: ` +
        `${String(tot.a3Incomplete)}.\n\n`,
    );
    report.add(a3Rows.length > 2 ? a3Rows.join('\n') : '- none');
    report.add('\n\n## Guards: A’s winners laid into every march of each stop\n\n');
    report.add(
      'Every march of the stop replaced by its exhaustive best where that rates above 0.01; the stop’s bills summed ' +
        'over its marches (kernel records), before → after. Flags: the silver saver’s silver rising (the engine ' +
        'refuses that re-typing, `retypeRowNow`), an unsheltered march, the rung order (repeat damage rising along ' +
        'the burn, 169’s criterion) broken, a stop newly dominating or dominated by another (damage, silver, hired, ' +
        `gold). Stops flagged: ${String(tot.flags)}; silver savers whose silver would rise: ${String(tot.ssRise)}.\n\n`,
    );
    report.add(guardRows.length > 2 ? guardRows.join('\n') : '- none');
    report.add(
      `\n\n## Runtime\n\n${n(tot.battles)} battles (A + A3) in ${(tot.ms / 1000).toFixed(1)} s of walking, ` +
        `${n(Math.round(tot.battles / Math.max(1e-9, tot.ms / 1000)))} battles/s (kernel, one thread; planning excluded).\n`,
    );
    const file = report.save();
    process.stderr.write(`175 written to ${file}\n`);
    expect(tot.parity).toBe(0);
  }, 7_200_000);
});
