/**
 * 115 — **is the march we would hand a mercenary-free account actually its optimum?** (owner, 2026-09-20:
 * *"if we KNOW for sure it's the best play with the given configuration and we've explored all possibilities,
 * then we've answered the complete optimization goal. If we know by theory-crafting, using calculations and
 * the game knowledge — no answering from memory or speculations — then we've upheld our contract. Check first
 * it's actually the case."*)
 *
 * Experiment 114 §F swept one family — the sizer over a **prefix** of the plan's troop ranking — and found
 * the all-types march on top of it. That is not "all possibilities": a prefix is 10 of the 1 023 non-empty
 * subsets, and every one of them is only ever asked for the *sizer's* shape. This asks the whole question.
 *
 * The model it is asked against, so the reader can check the arithmetic by hand (`battle.ts`): the enemy
 * destroys one stack an attack, **highest total HP first**, N attacks a round (N = enemy squads). A stack at
 * kill position p lives `r = ceil(p / N)` rounds and strikes `r − 1` times when `p ≡ 1 (mod N)`, else `r`.
 * So with N = 4 the hit schedule by position is 0 · 1 · 1 · 1 · 1 · 2 · 2 · 2 · 2 · 3 …, and **total damage is
 * `Σ hits(p) × damagePerHit(p)`**. Two consequences drive everything below: the biggest stack strikes
 * **zero** times, and HP buys *position*, never survival.
 *
 *  - **A** — every one of the 1 023 subsets, sized. The true maximum of that family, its Pareto frontier, and
 *    where the Tier ladder's own march sits in it.
 *  - **B** — beyond the sizer's shape: a hill-climb on the raw counts from the best subsets, so the flat HP
 *    profile is tested rather than assumed.
 *  - **C** — a small case solved by **brute force** over every feasible count vector, where "the optimum" is
 *    not an opinion, and the sizer's answer is read against it.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/115-troops-only-optimum.test.ts`
 */
import { describe, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildStackRequest } from '../../src/state/derive';
import { Report, evaluate, feasible, label, n, stacksFromCounts } from './harness';

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  if (!profile) throw new Error('no profile');
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return { profile, setup };
}

interface March {
  how: string;
  damage: number;
  silver: number;
  seconds: number;
  counts: Record<string, number>;
}

const days = (seconds: number): string => {
  const d = Math.floor(seconds / 86_400);
  const h = Math.round((seconds % 86_400) / 3_600);
  return d > 0 ? `${String(d)}d ${String(h)}h` : `${String(h)}h`;
};

const written = (request: StackRequest, counts: Record<string, number>): string =>
  request.units
    .filter((unit) => (counts[unit.id] ?? 0) > 0)
    .map((unit) => `${label(unit.id)} ${n(counts[unit.id] ?? 0)}`)
    .join(' · ');

/** The Pareto frontier on the two things a player trades: more damage, less silver. */
function frontierOf(marches: March[]): March[] {
  return marches
    .filter(
      (one) =>
        !marches.some(
          (other) =>
            other !== one &&
            other.damage >= one.damage &&
            other.silver <= one.silver &&
            (other.damage > one.damage || other.silver < one.silver),
        ),
    )
    .sort((a, b) => a.silver - b.silver);
}

describe.skipIf(!process.env.THEORY)('the troops-only optimum', () => {
  it('searches the whole space and reads the sizer against it', () => {
    const report = new Report('115-troops-only-optimum');
    const { profile, setup } = firstRun();
    const LEADERSHIP = 12_000;
    const base = buildStackRequest(profile, {
      ...setup,
      housing: { ...setup.housing, leadership: LEADERSHIP },
    });
    const troopIds = base.units.map((unit) => unit.id);
    const priceOf = (counts: Record<string, number>): { damage: number; silver: number; seconds: number } => {
      const result = stacksFromCounts(base, counts);
      const summary = simulateBattle(result, base);
      const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
      return { damage: summary.minDamage, silver: bill.silver, seconds: bill.seconds };
    };

    // ---- A -----------------------------------------------------------------------------------------
    report.h('A — all 1 023 subsets, sized');
    report.add(
      `The first-run army at ${n(LEADERSHIP)} leadership: Guardsmen I–III and Specialists I, ` +
        `${String(troopIds.length)} types, no mercenary and no monster. Every non-empty subset is handed to ` +
        '`sizeStacks` under the Tier ladder and fought with `simulateBattle`; the damage is the worst opening.',
    );
    const all: March[] = [];
    for (let mask = 1; mask < 1 << troopIds.length; mask += 1) {
      const kept = troopIds.filter((_id, index) => (mask & (1 << index)) !== 0);
      const request: StackRequest = { ...base, units: base.units.filter((unit) => kept.includes(unit.id)) };
      const { result, summary } = evaluate(request);
      if (result.stacks.length === 0) continue;
      const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
      const counts = Object.fromEntries(result.stacks.map((stack) => [stack.unitId, stack.count]));
      all.push({
        how: `${String(result.stacks.length)} types`,
        damage: summary.minDamage,
        silver: bill.silver,
        seconds: bill.seconds,
        counts,
      });
    }
    const ladder = all.find((one) => Object.keys(one.counts).length === troopIds.length);
    const byDamage = [...all].sort((a, b) => b.damage - a.damage);
    const byRate = [...all].sort((a, b) => b.damage / b.silver - a.damage / a.silver);
    report.add('');
    report.add(`${String(all.length)} subsets fielded a march. The ten best on damage:`);
    report.add('');
    report.add('| # | damage | vs the Tier ladder | silver | queue | a silver | counts |');
    report.add('|---|---|---|---|---|---|---|');
    for (const [index, one] of byDamage.slice(0, 10).entries()) {
      report.add(
        `| ${String(index + 1)} | ${n(one.damage)} | ${n(
          Math.round(((one.damage / (ladder?.damage ?? 1)) * 100 - 100) * 10) / 10,
        )} % | ${n(one.silver)} | ${days(one.seconds)} | ${n(one.damage / one.silver)} | ${written(
          base,
          one.counts,
        )} |`,
      );
    }
    report.add('');
    const ladderRank = byDamage.findIndex((one) => one === ladder) + 1;
    const rateRank = byRate.findIndex((one) => one === ladder) + 1;
    report.add(
      `**The Tier ladder's own march** — every type, which is what Generate answers with today — is ` +
        `${n(ladder?.damage ?? 0)} for ${n(ladder?.silver ?? 0)} silver: **rank ${String(
          ladderRank,
        )} of ${String(all.length)} on damage**, and **rank ${String(rateRank)} on damage a silver**.`,
    );
    report.add('');
    const front = frontierOf(all);
    report.add(`The damage/silver frontier of the whole family is **${String(front.length)} marches**:`);
    report.add('');
    report.add('| damage | silver | queue | a silver | counts |');
    report.add('|---|---|---|---|---|');
    for (const one of front) {
      report.add(
        `| ${n(one.damage)} | ${n(one.silver)} | ${days(one.seconds)} | ${n(one.damage / one.silver)} | ${written(
          base,
          one.counts,
        )} |`,
      );
    }

    // ---- B -----------------------------------------------------------------------------------------
    report.h('B — past the sizer: hill-climbing the raw counts');
    report.add(
      "Every march above is the sizer's *flat HP profile* over its subset. This tests the profile itself:" +
        ' from the best few subsets, leadership is moved between two types at a time — a geometric ladder of' +
        ' step sizes, every ordered pair tried — and a move is kept only while the worst opening improves.' +
        ' If the flat profile were already optimal, nothing would move.',
    );
    const climb = (start: Record<string, number>): { counts: Record<string, number>; damage: number } => {
      const costOf = new Map(base.units.map((unit) => [unit.id, unit.cost]));
      let counts = { ...start };
      let best = priceOf(counts).damage;
      for (let round = 0; round < 40; round += 1) {
        let moved = false;
        for (const step of [512, 256, 128, 64, 32, 16, 8, 4, 2, 1]) {
          for (const from of troopIds) {
            for (const to of troopIds) {
              if (from === to) continue;
              const take = Math.min(step, counts[from] ?? 0);
              if (take <= 0) continue;
              const freed = take * (costOf.get(from) ?? 1);
              const add = Math.floor(freed / (costOf.get(to) ?? 1));
              if (add <= 0) continue;
              const next = { ...counts, [from]: (counts[from] ?? 0) - take, [to]: (counts[to] ?? 0) + add };
              const damage = priceOf(next).damage;
              if (damage > best) {
                counts = next;
                best = damage;
                moved = true;
              }
            }
          }
        }
        if (!moved) break;
      }
      return { counts, damage: best };
    };
    report.add('');
    report.add('| start | sized | hill-climbed | gained | silver after | counts after |');
    report.add('|---|---|---|---|---|---|');
    const climbed: March[] = [];
    for (const seed of [ladder, ...byDamage.slice(0, 3)].filter((one): one is March => one !== undefined)) {
      const after = climb(seed.counts);
      // Nothing quoted here may be a march the game would refuse: the climb moves freed leadership, and a
      // rounding that crept over the pool would make every figure in this section meaningless.
      if (!feasible(base, after.counts)) throw new Error('the hill-climb left the leadership pool');
      const priced = priceOf(after.counts);
      climbed.push({ how: 'climbed', ...priced, counts: after.counts });
      report.add(
        `| ${written(base, seed.counts).slice(0, 40)}… | ${n(seed.damage)} | ${n(after.damage)} | ${n(
          Math.round(((after.damage / seed.damage) * 100 - 100) * 10) / 10,
        )} % | ${n(priced.silver)} | ${written(base, after.counts)} |`,
      );
    }

    // ---- C -----------------------------------------------------------------------------------------
    report.h('C — a case small enough to solve by brute force');
    report.add(
      'Four types and a small pool, so **every feasible count vector** can be enumerated and "the optimum" is' +
        ' a fact rather than the best thing a search happened to find. Counts are stepped in tens (a march is' +
        ' typed in tens anyway) and every vector inside the pool is fought.',
    );
    const smallIds = ['swordsman-1', 'archer-1', 'archer-2', 'archer-3'];
    const smallPool = 600;
    const small: StackRequest = {
      ...base,
      units: base.units.filter((unit) => smallIds.includes(unit.id)),
      housing: { ...base.housing, leadership: smallPool },
    };
    const smallUnits = small.units;
    const step = 10;
    let bestVector: { counts: Record<string, number>; damage: number; silver: number } | null = null;
    /** The best vector that costs **no more than the sizer's own march** — the fair, like-for-like test. */
    let bestUnderBudget: { counts: Record<string, number>; damage: number; silver: number } | null = null;
    let budget = Infinity;
    let tried = 0;
    const walk = (index: number, spent: number, counts: Record<string, number>): void => {
      if (index === smallUnits.length) {
        tried += 1;
        const result = stacksFromCounts(small, counts);
        if (result.stacks.length === 0) return;
        const damage = simulateBattle(result, small).minDamage;
        const silver = recoveryCosts(result.stacks, small.units, small.recovery).plan.silver;
        if (!bestVector || damage > bestVector.damage) bestVector = { counts: { ...counts }, damage, silver };
        if (silver <= budget && (!bestUnderBudget || damage > bestUnderBudget.damage)) {
          bestUnderBudget = { counts: { ...counts }, damage, silver };
        }
        return;
      }
      const unit = smallUnits[index];
      if (!unit) return;
      for (let count = 0; count * unit.cost + spent <= smallPool; count += step) {
        walk(index + 1, spent + count * unit.cost, { ...counts, [unit.id]: count });
      }
    };
    const sized = evaluate(small);
    const sizedCounts = Object.fromEntries(sized.result.stacks.map((stack) => [stack.unitId, stack.count]));
    const sizedSilver = recoveryCosts(sized.result.stacks, small.units, small.recovery).plan.silver;
    // The sizer's own bill is the budget the like-for-like row is held to, so it is known before the walk.
    budget = sizedSilver;
    walk(0, 0, {});
    const winner = bestVector as { counts: Record<string, number>; damage: number; silver: number } | null;
    const thrifty = bestUnderBudget as {
      counts: Record<string, number>;
      damage: number;
      silver: number;
    } | null;
    report.add('');
    report.add(
      `${n(tried)} vectors enumerated over ${smallIds.map((id) => label(id)).join(', ')} at ${n(
        smallPool,
      )} leadership, in steps of ${String(step)}.`,
    );
    report.add('');
    report.add('| | damage | silver | counts |');
    report.add('|---|---|---|---|');
    report.add(
      `| the sizer (Tier ladder) | ${n(sized.summary.minDamage)} | ${n(sizedSilver)} | ${written(
        small,
        sizedCounts,
      )} |`,
    );
    report.add(
      `| **the brute-force optimum, at most the sizer's silver** | ${n(thrifty?.damage ?? 0)} | ${n(
        thrifty?.silver ?? 0,
      )} | ${written(small, thrifty?.counts ?? {})} |`,
    );
    report.add(
      `| **the brute-force optimum, silver unbounded** | ${n(winner?.damage ?? 0)} | ${n(
        winner?.silver ?? 0,
      )} | ${written(small, winner?.counts ?? {})} |`,
    );
    report.add('');
    report.add(
      `The sizer reaches **${n(
        Math.round((sized.summary.minDamage / (thrifty?.damage ?? 1)) * 1000) / 10,
      )} %** of the best march that costs no more than it does, and **${n(
        Math.round((sized.summary.minDamage / (winner?.damage ?? 1)) * 1000) / 10,
      )} %** of the best there is at any price. The grid steps in tens, so it does not contain the sizer's own` +
        ' vector; the sizer is measured as it really answers and the grid is what it is read against.',
    );

    // ---- the answer --------------------------------------------------------------------------------
    report.h('What this settles');
    const bestOverall = [...all, ...climbed].sort((a, b) => b.damage - a.damage)[0];
    report.add(
      `The best troops-only march this search found is **${n(bestOverall?.damage ?? 0)}** for ${n(
        bestOverall?.silver ?? 0,
      )} silver. The Tier ladder's own march is ${n(ladder?.damage ?? 0)} for ${n(
        ladder?.silver ?? 0,
      )} — **${n(
        Math.round(((ladder?.damage ?? 0) / (bestOverall?.damage ?? 1)) * 1000) / 10,
      )} %** of it, at ${n(
        Math.round(((ladder?.silver ?? 0) / (bestOverall?.silver ?? 1)) * 1000) / 10,
      )} % of the silver.`,
    );
    report.save();
  }, 600_000);
});
