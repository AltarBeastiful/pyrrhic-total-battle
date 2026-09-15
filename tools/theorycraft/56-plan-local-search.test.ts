/**
 * 56 — the sweet spot, refined (owner, 2026-09-14): a coordinate search on the plan of file 55, whose grid
 * skipped the mercenary counts that make 3, 5 or 7 marches possible.
 *
 * The number of marches K is set by the mercenary that runs out first: a type fielded n a march with `chunks`
 * of ten lost a march lasts `floor((stock − n) / chunks(n)) + 1` marches. So K is a *choice* — field 4 Chariot
 * and the plan is 4 marches; field 3 and it is 5 — and each K has its own silver per march (3 M / K) and so
 * its own ladder size. For every candidate the file also builds the final march from what is left over, which
 * is what the plan is actually worth.
 *
 * Inputs: 3,000,000 silver; mercenaries held EMH6 14 · LGN6 16 · ABT6 15 · CHR6 7; leadership 4,400 ·
 * authority 2,180; the 2026-09-14 report's bonuses; 4 enemy squads. `THEORY=1 pnpm vitest run
 * tools/theorycraft/56-plan-local-search.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluateCounts,
  label,
  lines,
  loadOwner,
  n,
  scenarioC,
  withCaps,
  withHousing,
  withUnits,
} from './harness';

const STOCK: Record<string, number> = {
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
  'arbalester-6': 15,
  'chariot-6': 7,
};
const MERCS = ['epic-monster-hunter-6', 'legionary-6', 'arbalester-6', 'chariot-6'];
const SILVER = 3_000_000;
const BY_K = [
  'rider-3',
  'archer-2',
  'rider-2',
  'archer-1',
  'rider-1',
  'spearman-2',
  'spearman-1',
  'swordsman-1',
];
const STEP = 1.004;
const T_CHOICES = [1, 2, 3, 4, 5, 6, 7];
const SCALES = [1.01, 1.05, 1.1, 1.2, 1.35, 1.5, 1.75, 2.0, 2.5, 3.0];

describe.skipIf(!process.env.THEORY)(
  'plan local search',
  () => {
    it('refines the mercenary vector and the ladders', () => {
      const report = new Report('56-plan-local-search');
      const owner = loadOwner();
      const req0 = withHousing(scenarioC(owner.twelve), { leadership: 4_400, authority: 2_180 });
      const byId = new Map(req0.units.map((u) => [u.id, u]));

      const probe = (id: string): { hp: number; k: number; cost: number } => {
        const ev = evaluateCounts(req0, { [id]: 1 });
        const stack = ev.result.stacks[0];
        const unit = req0.units.find((u) => u.id === id);
        return {
          hp: stack?.hpPerUnit ?? 0,
          k: (stack?.strengthPerUnit ?? 0) / (stack?.hpPerUnit || 1),
          cost: unit?.cost ?? 0,
        };
      };
      const P: Record<string, { hp: number; k: number; cost: number }> = {};
      for (const id of [...BY_K, ...MERCS]) P[id] = probe(id);
      const ranked = [...BY_K].sort((a, b) => (P[b]?.k ?? 0) - (P[a]?.k ?? 0));

      const cost = (result: StackResult, request: StackRequest) => {
        let silver = 0;
        let gold = 0;
        for (const stack of result.stacks) {
          const unit = byId.get(stack.unitId);
          if (!unit) continue;
          const c =
            stack.pool === 'authority'
              ? reviveOne(unit, stack.count, request.recovery)
              : retrainOne(unit, stack.count, request.recovery);
          silver += c.silver;
          gold += c.gold;
        }
        return { silver: Math.round(silver), gold: Math.round(gold) };
      };
      const marches = (mercs: Record<string, number>): number => {
        let k = Infinity;
        for (const id of MERCS) {
          const fielded = mercs[id] ?? 0;
          if (fielded <= 0) continue;
          k = Math.min(k, Math.floor((STOCK[id]! - fielded) / chunks(fielded)) + 1);
        }
        return k === Infinity ? 1 : k;
      };
      const build = (t: number, scale: number, mercMaxHp: number) => {
        const topFirst = [...ranked.slice(0, t)].reverse();
        const floor = mercMaxHp * scale;
        const counts: Record<string, number> = {};
        let lead = 0;
        topFirst.forEach((id, j) => {
          const p = P[id]!;
          const count = Math.max(1, Math.floor((floor * STEP ** (t - 1 - j)) / p.hp));
          counts[id] = count;
          lead += count * p.cost;
        });
        return { counts, lead };
      };
      const evaluate = (
        counts: Record<string, number>,
      ): { damage: number; silver: number; counts: Record<string, number> } | null => {
        const req = withCaps(withUnits(req0, Object.keys(counts)), counts);
        const ev = evaluateCounts(req, counts);
        if (ev.result.stacks.length === 0) return null;
        const plan = cost(ev.result, req);
        return { damage: ev.summary.avgDamage, silver: plan.silver, counts };
      };

      /**
       * The best ladder for a silver budget: bisect the scale up to the largest one the budget affords.
       * Silver grows with the scale, so the largest affordable scale is also the most damaging ladder.
       */
      const bestLadder = (
        mercMaxHp: number,
        mercs: Record<string, number>,
        budget: number,
      ): { damage: number; silver: number; t: number; scale: number } | null => {
        const mercIds = MERCS.filter((id) => (mercs[id] ?? 0) > 0);
        const ladder = (t: number, scale: number) => {
          const { counts, lead } = build(t, scale, mercMaxHp);
          if (lead > req0.housing.leadership) return null;
          const full = { ...counts, ...Object.fromEntries(mercIds.map((id) => [id, mercs[id] ?? 0])) };
          return evaluate(full);
        };
        let best: { damage: number; silver: number; t: number; scale: number } | null = null;
        for (const t of T_CHOICES) {
          let lo = 1.0;
          let hi = 6.0;
          let found: { damage: number; silver: number; t: number; scale: number } | null = null;
          for (let i = 0; i < 22; i += 1) {
            const mid = (lo + hi) / 2;
            const res = ladder(t, mid);
            const affordable =
              res !== null &&
              res.silver <= budget &&
              build(t, mid, mercMaxHp).lead <= req0.housing.leadership;
            if (affordable && res) {
              if (!found || res.damage > found.damage)
                found = { damage: res.damage, silver: res.silver, t, scale: mid };
              lo = mid;
            } else {
              hi = mid;
            }
          }
          if (found && (!best || found.damage > best.damage)) best = found;
        }
        return best;
      };

      /** The whole plan for a mercenary vector: K uniform marches plus the best final march from the leftovers. */
      interface PlanResult {
        total: number;
        k: number;
        per: number;
        finale: number;
        silver: number;
        t: number;
        scale: number;
        finaleT: number;
        finaleScale: number;
      }
      const plan = (mercs: Record<string, number>, log?: boolean): PlanResult => {
        const k = marches(mercs);
        const mercMaxHp = Math.max(0, ...MERCS.map((id) => (mercs[id] ?? 0) * (P[id]?.hp ?? 0)));
        const spent = Object.fromEntries(MERCS.map((id) => [id, chunks(mercs[id] ?? 0) * k]));
        const left = Object.fromEntries(
          MERCS.map((id) => [id, Math.max(0, (STOCK[id] ?? 0) - (spent[id] ?? 0))]),
        );
        const leftMaxHp = Math.max(0, ...MERCS.map((id) => (left[id] ?? 0) * (P[id]?.hp ?? 0)));
        let best: {
          total: number;
          per: number;
          silver: number;
          finale: number;
          t: number;
          scale: number;
          finaleT: number;
          finaleScale: number;
        } | null = null;
        for (const t of T_CHOICES) {
          for (const scale of SCALES) {
            const { counts, lead } = build(t, scale, mercMaxHp);
            if (lead > req0.housing.leadership) continue;
            const main = evaluate({
              ...counts,
              ...Object.fromEntries(
                MERCS.filter((id) => (mercs[id] ?? 0) > 0).map((id) => [id, mercs[id] ?? 0]),
              ),
            });
            if (!main || main.silver > SILVER / k) continue;
            const leftSilver = SILVER - k * main.silver;
            const finaleLadder =
              leftSilver > 0 && leftMaxHp > 0 ? bestLadder(leftMaxHp * 1.01, left, leftSilver) : null;
            const finale = finaleLadder?.damage ?? 0;
            const total = k * main.damage + finale;
            if (!best || total > best.total)
              best = {
                total,
                per: main.damage,
                silver: main.silver,
                finale,
                t,
                scale,
                finaleT: finaleLadder?.t ?? 0,
                finaleScale: finaleLadder?.scale ?? 0,
              };
          }
        }
        if (!best)
          return { total: 0, k, per: 0, finale: 0, silver: 0, t: 0, scale: 0, finaleT: 0, finaleScale: 0 };
        if (log) {
          report.add(
            `vector ${MERCS.map((id) => `${label(id)} ${n(mercs[id] ?? 0)}`).join(' · ')} → K ${k}, ladder ${best.t} rungs @ ${best.scale.toFixed(2)}× ` +
              `(${n(best.per)} damage, ${n(best.silver)} silver), finale ${n(best.finale)} → **${n(best.total)}**`,
          );
        }
        return {
          total: best.total,
          k,
          per: best.per,
          finale: best.finale,
          silver: best.silver,
          t: best.t,
          scale: best.scale,
          finaleT: best.finaleT,
          finaleScale: best.finaleScale,
        };
      };

      let current: Record<string, number> = {
        'epic-monster-hunter-6': 10,
        'legionary-6': 10,
        'arbalester-6': 10,
        'chariot-6': 4,
      };
      report.add(
        `seed (file 55's winner): ${MERCS.map((id) => `${label(id)} ${n(current[id] ?? 0)}`).join(' · ')} → ${n(plan(current).total)}`,
      );
      let bestValue = plan(current).total;

      // Coordinate search: vary one mercenary type at a time over every legal count, keep what improves.
      for (let round = 1; round <= 3; round += 1) {
        let improved = false;
        for (const id of MERCS) {
          for (let value = 0; value <= (STOCK[id] ?? 0); value += 1) {
            const trial = { ...current, [id]: value };
            const value2 = plan(trial).total;
            if (value2 > bestValue + 1) {
              bestValue = value2;
              current = trial;
              improved = true;
            }
          }
        }
        report.add(
          `round ${round}: best ${n(bestValue)} with ${MERCS.map((id) => `${label(id)} ${n(current[id] ?? 0)}`).join(' · ')}${improved ? '' : ' (no further improvement)'}`,
        );
        if (!improved) break;
      }

      report.h('The refined plan');
      const final = plan(current, true);
      report.add(
        `**${final.k} marches** at ${n(final.per)} damage each, plus a final march of ${n(final.finale)} → **${n(final.total)} total damage** ` +
          `on ${n(SILVER)} silver (${(final.total / SILVER).toFixed(2)} per silver).`,
      );

      const mercMaxHp = Math.max(0, ...MERCS.map((id) => (current[id] ?? 0) * (P[id]?.hp ?? 0)));
      const { counts } = build(final.t, final.scale, mercMaxHp);
      const full = {
        ...counts,
        ...Object.fromEntries(
          MERCS.filter((id) => (current[id] ?? 0) > 0).map((id) => [id, current[id] ?? 0]),
        ),
      };
      const reqFinal = withCaps(withUnits(req0, Object.keys(full)), full);
      const evFinal = evaluateCounts(reqFinal, full);
      const ls = lines(evFinal);
      const hit = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
      report.add(
        '| # | stack | units | total HP | a hit | strikes E/A | damage |\n|---|---|---|---|---|---|---|',
      );
      for (const row of ls) {
        report.add(
          `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(hit(row) * row.damagePerHit))} |`,
        );
      }
      report.add(
        `\nper march: min ${n(evFinal.summary.minDamage)} · avg ${n(evFinal.summary.avgDamage)} · max ${n(evFinal.summary.maxDamage)} · ` +
          `silver ${n(cost(evFinal.result, reqFinal).silver)} · gold ${n(cost(evFinal.result, reqFinal).gold)} · ` +
          `leadership ${n(evFinal.result.pools.leadership.used)}/${n(evFinal.result.pools.leadership.capacity)}`,
      );

      // the final march of the plan, in full
      const spentFinale = Object.fromEntries(MERCS.map((id) => [id, chunks(current[id] ?? 0) * final.k]));
      const leftFinale = Object.fromEntries(
        MERCS.map((id) => [id, Math.max(0, (STOCK[id] ?? 0) - (spentFinale[id] ?? 0))]),
      );
      const leftMaxHpFinale = Math.max(0, ...MERCS.map((id) => (leftFinale[id] ?? 0) * (P[id]?.hp ?? 0)));
      if (final.finaleT > 0) {
        const { counts: fc } = build(final.finaleT, final.finaleScale, leftMaxHpFinale * 1.01);
        const ffull = {
          ...fc,
          ...Object.fromEntries(
            MERCS.filter((id) => (leftFinale[id] ?? 0) > 0).map((id) => [id, leftFinale[id] ?? 0]),
          ),
        };
        const freq = withCaps(withUnits(req0, Object.keys(ffull)), ffull);
        const fev = evaluateCounts(freq, ffull);
        const fls = lines(fev);
        const fhit = (row: (typeof fls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
        report.h('The final march of the plan, in full (everything left over, in one march)');
        report.add(
          '| # | stack | units | total HP | a hit | strikes E/A | damage |\n|---|---|---|---|---|---|---|',
        );
        for (const row of fls) {
          report.add(
            `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(fhit(row) * row.damagePerHit))} |`,
          );
        }
        report.add(
          `\nfinal march: avg **${n(fev.summary.avgDamage)}** · silver ${n(cost(fev.result, freq).silver)} · gold ${n(cost(fev.result, freq).gold)} · ` +
            `mercenaries used ${MERCS.map((id) => `${label(id)} ${n(leftFinale[id] ?? 0)}`).join(' · ')} (all of them, spent to the last unit)`,
        );
      }
      report.save();
    });
  },
  900_000,
);
