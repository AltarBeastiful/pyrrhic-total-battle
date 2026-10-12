/**
 * 216 — **where the `Tight` box goes, and how much of it is provably dead** (owner, 2026-10-12: *"I want to
 * explore reducing tight costs. I believe we explore blindly a lot of possible troop placement and we should be
 * able to do that more quickly. First we need to analyze what exactly are we trying within the tight
 * calculations, what takes time, what are we exploring."*).
 *
 * `Tight` is the plan's own search over the box of hired counts (`raise`, `kernel/assembly/index.ts`), and it
 * is **51.6 % of the Generate + advisor pool CPU** (investigation 0025). This experiment is the census of that
 * box before anything is cut: for every stop of every benchmark army, how many hired stacks the search may
 * move, how many vectors that is, how many of them the march's own **bounds** can ever accept, and where the
 * answer sits inside them.
 *
 * Three bounds are on the table, and the point of the census is to see which of them the *box* ignores:
 *
 *   1. **the burn cap** (`rCap`, `raise`): `Tight` may not burn one extra authority chunk over the plan's own
 *      counts. The slots' floor is the plan's own count and `chunks` is non-decreasing, so *every* authority
 *      slot is refused above its own chunk top `10·ceil(from/10)` — an exact per-slot bound the box does not
 *      apply (the arms below apply it through the caller's own `caps`, which is where the raise reads its
 *      `to`);
 *   2. **the housing** — every pool's `Σ count × cost` under its capacity, a sum whose spare is the plan's own
 *      capacity minus its own usage;
 *   3. **the shelter** — already in the box (`to = min(ceiling, stock)`).
 *
 * Three arms, same kernel, same seed, same rank: **A** the shipped box; **B** A with each authority slot's
 * `to` clamped to its chunk top; **C** B with every pool's slot also clamped to its housing spare. Every arm
 * is measured on `{authority: tight, dominance: tight}` — what the March opens on (`DEFAULT_RAISE`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/216-where-the-tight-box-goes.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { RAISE_TIGHT } from '@/engine/fast';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel, EXACT_DEFAULTS } from '@/kernel/raise';
import { parseImport } from '@/share/exportImport';
import { buildStackRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';
import { shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

/** The account the plan seconds were profiled on (investigation 0025, never committed). */
const LIVE = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';

/** The one position these arms price. */
const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT } as const;

/** How many vectors of a box are enumerated to count the feasible ones; a wider one is only counted. */
const ENUM_LIMIT = 400_000;

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const chunkTop = (n: number): number => 10 * Math.ceil(n / 10);
const chunks = (n: number): number => Math.ceil(Math.max(0, n) / 10);

/** One count the search may move. */
interface Slot {
  id: string;
  pool: 'authority' | 'dominance';
  from: number;
  to: number;
  cost: number;
  hpPerUnit: number;
}

/** The slots the kernel builds for one march: the plan's own count up to `min(shelter ceiling, stock)`. */
function slotsOf(request: StackRequest, base: StackResult): Slot[] {
  const floor = troopFloor(base);
  if (floor === null) return [];
  const costOf = new Map(request.units.map((unit) => [unit.id, unit.cost]));
  return base.stacks
    .filter((stack) => stack.count > 0 && (stack.pool === 'authority' || stack.pool === 'dominance'))
    .map((stack) => ({
      id: stack.unitId,
      pool: stack.pool as 'authority' | 'dominance',
      from: stack.count,
      to: Math.min(shelterCeiling(floor, stack.hpPerUnit), request.caps[stack.unitId] ?? MAX_SAFE),
      cost: costOf.get(stack.unitId) ?? 0,
      hpPerUnit: stack.hpPerUnit,
    }))
    .filter((slot) => slot.to > slot.from);
}

const boxSize = (widths: readonly number[]): number => widths.reduce((product, w) => product * w, 1);

/** The authority chunks a march's counts burn — `raise.ts`'s `burnOf`, the figure `rCap` is measured in. */
function burnOf(base: StackResult, counts: Record<string, number>): number {
  let burned = 0;
  for (const stack of base.stacks) {
    if (stack.pool !== 'authority') continue;
    burned += chunks(counts[stack.unitId] ?? stack.count);
  }
  return burned;
}

/** `Σ count × cost` over one pool, as the kernel's own `raiseUsed` reads it. */
function usedOf(request: StackRequest, candidate: Record<string, number>, pool: string): number {
  let used = 0;
  for (const unit of request.units) if (unit.pool === pool) used += (candidate[unit.id] ?? 0) * unit.cost;
  return used;
}

/** The plan's own counts, as a whole-march vector. */
function countsOf(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const stack of base.stacks) out[stack.unitId] = stack.count;
  return out;
}

interface Census {
  space: number;
  /** Vectors that pass the burn cap (authority only), over the whole box. */
  byCap: number;
  /** …and the housing. */
  feasible: number;
  /** Vectors whose authority counts all sit at or under their own chunk top — the cap's per-slot bound. */
  byChunkTop: number;
  /** The share of the box the burn cap alone refuses, as a percentage. */
  deadByCap: number;
}

/** Walk a box and count what the two bounds accept. `null` when the box is too wide to enumerate. */
function census(
  slots: readonly Slot[],
  base: StackResult,
  request: StackRequest,
  cap: number,
): Census | null {
  const space = boxSize(slots.map((slot) => slot.to - slot.from + 1));
  if (space > ENUM_LIMIT) return null;
  const candidate = countsOf(base);
  const heldBurn = burnOf(base, candidate);
  let byCap = 0;
  let feasible = 0;
  let byChunkTop = 0;
  const walk = (index: number): void => {
    if (index === slots.length) {
      const burn = burnOf(base, candidate);
      const overCap = burn > cap;
      if (!overCap) byCap += 1;
      let allTop = true;
      for (const slot of slots) {
        if (slot.pool === 'authority' && (candidate[slot.id] ?? 0) > chunkTop(slot.from)) allTop = false;
      }
      if (allTop) byChunkTop += 1;
      if (
        !overCap &&
        usedOf(request, candidate, 'authority') <= request.housing.authority &&
        usedOf(request, candidate, 'dominance') <= request.housing.dominance
      ) {
        feasible += 1;
      }
      return;
    }
    const slot = slots[index] as Slot;
    for (let count = slot.from; count <= slot.to; count += 1) {
      candidate[slot.id] = count;
      walk(index + 1);
    }
    candidate[slot.id] = slot.from;
    void heldBurn;
  };
  walk(0);
  return { space, byCap, feasible, byChunkTop, deadByCap: ((space - byCap) / space) * 100 };
}

/** The caps an arm hands the kernel: the shipped stock, or one clamped to a slot's own bound. */
function capsFor(request: StackRequest, slots: readonly Slot[], bound: (slot: Slot) => number): StackRequest {
  const caps: Record<string, number> = { ...request.caps };
  for (const slot of slots) caps[slot.id] = Math.max(0, Math.min(slot.to, bound(slot)));
  return { ...request, caps };
}

/** What one `raise` answered, on a kernel of its own so no memo outlives the clock. */
function priced(
  module: WebAssembly.Module,
  request: StackRequest,
  base: StackResult,
  runs: number,
): { counts: Record<string, number>; how: string | null; space: number; scored: number; ms: number } {
  let best: ReturnType<ReturnType<typeof createRaiseKernel>['position']> = null;
  let ms = Infinity;
  for (let run = 0; run < runs; run += 1) {
    const kernel = createRaiseKernel(module);
    const began = performance.now();
    const answer = kernel.position({ request, base, modes: MODES });
    ms = Math.min(ms, performance.now() - began);
    best = answer;
  }
  if (best === null) throw new Error('the kernel answered nothing');
  return { counts: best.counts, how: best.how, space: best.space, scored: best.scored, ms };
}

/** Every type the march may field, with an absent one read as zero — the two arms' answers compared whole. */
function sameCounts(
  request: StackRequest,
  base: StackResult,
  one: Record<string, number>,
  other: Record<string, number>,
): string[] {
  const own = countsOf(base);
  const moved: string[] = [];
  for (const unit of request.units) {
    const a = one[unit.id] ?? 0;
    const b = other[unit.id] ?? 0;
    if (a !== b && (a !== (own[unit.id] ?? 0) || b !== (own[unit.id] ?? 0))) {
      moved.push(`${unit.id} ${a}→${b}`);
    }
  }
  return moved;
}

describe.skipIf(!process.env.THEORY)('where the tight box goes', () => {
  it('censuses every stop, and holds the two clamped arms to the shipped one', () => {
    const module = loadKernelModule();
    const report = new Report('216-where-the-tight-box-goes');
    report.add(
      [
        '`Tight` over both pools on every stop of every benchmark army. **space** is the box the kernel walks',
        'or searches; **slots** are the hired stacks it may move (merc(m)/monster(M)); **dead** is the share',
        'of the box the authority burn cap alone refuses; **byTop** is the share inside every authority',
        "slot's own chunk top. **A/B/C**: ms over 3 fresh kernels, and whether B (chunk-top caps) and C",
        '(chunk-top + housing caps) answered **the same counts** as A.',
        '',
        '| army · stop | slots | space | clamped | how | A ms | C ms | dead | byTop | B | C |',
        '|---|---:|---:|---:|---|---:|---:|---:|---:|---|---|',
      ].join('\n'),
    );
    const tally = {
      stops: 0,
      noSlots: 0,
      walked: 0,
      searched: 0,
      spaceSum: 0,
      cappedSpaceSum: 0,
      housingSpaceSum: 0,
      msA: 0,
      msC: 0,
      msAall: 0,
      msCall: 0,
      bDiffers: 0,
      cDiffers: 0,
      deadWeighted: 0,
      topWeighted: 0,
      enumStops: 0,
      enumSpaceSum: 0,
      flipsToWalked: 0,
      worst: [] as { label: string; space: number; slots: number }[],
    };
    const differing: string[] = [];

    const scenarios = [...criteriaScenarios()];
    try {
      const parsed = parseImport(readFileSync(LIVE, 'utf8'));
      if (parsed.kind === 'profile') {
        const profile = parsed.payload as Profile;
        const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
        if (setup !== undefined) {
          scenarios.push({
            label: `the live account of 2026-10-11 (${profile.name})`,
            request: buildStackRequest(profile, setup),
          });
        }
      }
    } catch {
      report.add(`\n(\`${LIVE}\` was not readable; the live account is not in this census.)`);
    }

    for (const scenario of scenarios) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        continue;
      }
      for (const stop of plan.alternatives) {
        const request = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const slots = slotsOf(request, base);
        if (slots.length === 0) {
          tally.noSlots += 1;
          continue;
        }
        tally.stops += 1;
        const mercs = slots.filter((slot) => slot.pool === 'authority').length;
        const monsters = slots.length - mercs;

        // The plan's own burn is the cap; the plan's own usage sets each pool's spare housing.
        const cap = burnOf(base, countsOf(base));
        const spare = (pool: 'authority' | 'dominance'): number => {
          const used = slots
            .filter((slot) => slot.pool === pool)
            .reduce((sum, slot) => sum + slot.from * slot.cost, 0);
          return request.housing[pool] - used;
        };
        const toTop = (slot: Slot): number => (slot.pool === 'authority' ? chunkTop(slot.from) : slot.to);
        const toSpare = (slot: Slot): number =>
          slot.cost > 0 ? slot.from + Math.floor(spare(slot.pool) / slot.cost) : slot.to;
        const capWidths = slots.map((slot) => Math.max(0, Math.min(slot.to, toTop(slot)) - slot.from + 1));
        const housingWidths = slots.map((slot) =>
          Math.max(0, Math.min(slot.to, toTop(slot), toSpare(slot)) - slot.from + 1),
        );

        const a = priced(module, request, base, 3);
        const b = priced(module, capsFor(request, slots, toTop), base, 1);
        const c = priced(
          module,
          capsFor(request, slots, (slot) => Math.min(toTop(slot), toSpare(slot))),
          base,
          1,
        );
        const bMoved = sameCounts(request, base, a.counts, b.counts);
        const cMoved = sameCounts(request, base, a.counts, c.counts);
        if (bMoved.length > 0) {
          tally.bDiffers += 1;
          differing.push(`B · ${scenario.label} · ${stop.pick}: ${bMoved.join(', ')}`);
        }
        if (cMoved.length > 0) {
          tally.cDiffers += 1;
          differing.push(`C · ${scenario.label} · ${stop.pick}: ${cMoved.join(', ')}`);
        }

        const counted = census(slots, base, request, cap);
        const cappedSpace = boxSize(capWidths.filter((w) => w > 0));
        const housingSpace = boxSize(housingWidths.filter((w) => w > 0));
        tally.spaceSum += a.space;
        tally.cappedSpaceSum += cappedSpace;
        tally.housingSpaceSum += housingSpace;
        tally.msA += a.ms;
        tally.msC += c.ms;
        tally.msAall += a.ms;
        tally.msCall += c.ms;
        if (a.how === 'walked') tally.walked += 1;
        else if (a.how === 'searched') tally.searched += 1;
        if (counted !== null) {
          tally.enumStops += 1;
          tally.enumSpaceSum += a.space;
          tally.deadWeighted += counted.deadByCap * a.space;
          tally.topWeighted += (counted.byChunkTop / counted.space) * 100 * a.space;
        }
        // A box the clamp pulls from "searched" to "walked" is one the search now answers **exactly** — the
        // optimum of what the bounds accept rather than the best a heuristic found.
        const flipped = a.how === 'searched' && housingSpace <= EXACT_DEFAULTS.walkCap;
        if (flipped) tally.flipsToWalked += 1;
        tally.worst.push({ label: `${scenario.label} · ${stop.pick}`, space: a.space, slots: slots.length });

        report.add(
          [
            `| ${scenario.label} · ${stop.pick} | ${mercs}m/${monsters}M | ${n(a.space)} | ${n(housingSpace)} |`,
            `${a.how ?? '—'}${flipped ? ' →walked' : ''} |`,
            `${a.ms.toFixed(0)} | ${c.ms.toFixed(0)} |`,
            `${counted === null ? '—' : `${counted.deadByCap.toFixed(1)} %`} |`,
            `${counted === null ? '—' : `${((counted.byChunkTop / counted.space) * 100).toFixed(1)} %`} |`,
            `${bMoved.length === 0 ? 'same' : 'DIFF'} | ${cMoved.length === 0 ? 'same' : 'DIFF'} |`,
          ].join(' '),
        );
      }
    }

    const share = (value: number, total: number): string =>
      total === 0 ? '—' : `${((value / total) * 100).toFixed(1)} %`;
    report.add(
      [
        '',
        '## What the census says',
        `- **${tally.stops} stops with a box** (${tally.noSlots} without one): **${tally.walked} walked**, **${tally.searched} searched**.`,
        `- Σ space **${n(tally.spaceSum)}**; with the authority slots clamped to their chunk top **${n(tally.cappedSpaceSum)}** (${share(tally.cappedSpaceSum, tally.spaceSum)}); with the housing spare as well **${n(tally.housingSpaceSum)}** (${share(tally.housingSpaceSum, tally.spaceSum)}).`,
        `- Wall of the whole census: **${tally.msAall.toFixed(0)} ms** for the shipped arm, **${tally.msCall.toFixed(0)} ms** clamped (${share(tally.msCall, tally.msAall)}).`,
        `- A clamped box of at most the walk cap — the search now **exact** rather than a heuristic's best — on **${tally.flipsToWalked} stops** that were searched as shipped.`,
        `- Where a box was enumerable (${tally.enumStops} stops): **${(tally.deadWeighted / tally.enumSpaceSum).toFixed(1)} %** of the vectors on average are refused by the burn cap alone; **${(tally.topWeighted / tally.enumSpaceSum).toFixed(1)} %** sit at or under their own chunk top.`,
        `- **Arm B answered different counts on ${tally.bDiffers} stops; arm C on ${tally.cDiffers}.**`,
      ].join('\n'),
    );
    if (differing.length > 0) report.add(`\n\`\`\`\n${differing.slice(0, 40).join('\n')}\n\`\`\``);
    const worst = [...tally.worst].sort((one, two) => two.space - one.space).slice(0, 8);
    report.add(
      `\n### The widest boxes\n\n| army · stop | space | slots |\n|---|---:|---:|\n${worst
        .map((row) => `| ${row.label} | ${n(row.space)} | ${row.slots} |`)
        .join('\n')}`,
    );
    report.save();
    expect(tally.stops).toBeGreaterThan(0);
  }, 1_800_000);
});
