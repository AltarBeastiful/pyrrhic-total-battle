/**
 * 55 — the plan: maximum TOTAL damage from a fixed 3 M silver and the mercenaries held (2026-09-14).
 *
 * Both resources are finite, so this is an allocation problem, not a march problem. For a march repeated K
 * times, the mercenary stock decays by `chunks(n) = ceil(n/10)` a march, so a march fielding n of a type
 * lasts exactly `floor((stock − n) / chunks(n)) + 1` marches — field less, march more. K is the smallest of
 * those over the types fielded, the silver per march is 3 M / K, and the answer is the plan maximising
 * `K × damage(march)`.
 *
 * Inputs (all from artefacts): mercenaries held EMH6 14 · LGN6 16 · ABT6 15 · CHR6 7 and leadership 4,400 /
 * authority 2,180 (owner's screenshot); bonuses = the 2026-09-14 report's (scenario C); enemy 4 squads, one
 * per category; unit stats and prices from src/data. Every number is produced here.
 *
 * Ladder order is by damage per effective HP (printed at the top): the weakest unit takes the top rung (it
 * dies first and, with the enemy opening, strikes nothing) and the strongest takes the bottom rung (it
 * lives longest and strikes most). `THEORY=1 pnpm vitest run tools/theorycraft/55-total-damage-plan.test.ts`
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
/** Troop types, best damage-per-effective-HP first (the ranking is computed, not assumed). */
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
const T_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8];
const SCALES = [1.01, 1.1, 1.25, 1.5, 2.0, 3.0];

interface Candidate {
  mercs: Record<string, number>;
  k: number;
  t: number;
  scale: number;
  damage: number;
  silver: number;
  counts: Record<string, number>;
}

describe.skipIf(!process.env.THEORY)(
  'total-damage plan',
  () => {
    it('allocates 3 M silver and the held mercenaries', () => {
      const report = new Report('55-total-damage-plan');
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
      report.add(
        `damage per effective HP (computed here): ${[...BY_K]
          .sort((a, b) => (P[b]?.k ?? 0) - (P[a]?.k ?? 0))
          .map((id) => `${label(id)} ${(P[id]?.k ?? 0).toFixed(3)}`)
          .join(' · ')}` +
          `\nladder order: weakest first (top), strongest last (bottom) → ${ranked.map((id) => label(id)).join(' > ')}`,
      );

      const cost = (result: StackResult, request: StackRequest) => {
        let silver = 0;
        let gold = 0;
        let seconds = 0;
        for (const stack of result.stacks) {
          const unit = byId.get(stack.unitId);
          if (!unit) continue;
          const atTemple = stack.pool === 'authority';
          const c = atTemple
            ? reviveOne(unit, stack.count, request.recovery)
            : retrainOne(unit, stack.count, request.recovery);
          silver += c.silver;
          gold += c.gold;
          seconds += c.seconds;
        }
        return { silver: Math.round(silver), gold: Math.round(gold), seconds };
      };

      /** How many marches a constant vector lasts: the smallest run over the types it fields. */
      const marches = (mercs: Record<string, number>): number => {
        let k = Infinity;
        for (const id of MERCS) {
          const fielded = mercs[id] ?? 0;
          if (fielded <= 0) continue;
          const ch = chunks(fielded);
          k = Math.min(k, Math.floor((STOCK[id]! - fielded) / ch) + 1);
        }
        return k === Infinity ? 1 : k;
      };

      const build = (
        t: number,
        scale: number,
        mercMaxHp: number,
      ): { counts: Record<string, number>; lead: number } => {
        const chosen = ranked.slice(0, t); // strongest damage-per-HP first
        const topFirst = [...chosen].reverse(); // weakest at the top, strongest at the bottom
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

      // ---- the allocation search ---------------------------------------------------------------------
      const grid: number[] = [0, 2, 4, 7, 10, 14, 16];
      const candidates: Candidate[] = [];
      let evaluated = 0;
      for (const e of grid.filter((x) => x <= 14)) {
        for (const l of grid.filter((x) => x <= 16)) {
          for (const a of grid.filter((x) => x <= 15)) {
            for (const c of grid.filter((x) => x <= 7)) {
              const mercs: Record<string, number> = {
                'epic-monster-hunter-6': e,
                'legionary-6': l,
                'arbalester-6': a,
                'chariot-6': c,
              };
              const k = marches(mercs);
              if (k < 1) continue;
              const budget = SILVER / k;
              const mercIds = MERCS.filter((id) => (mercs[id] ?? 0) > 0);
              const mercMaxHp = Math.max(0, ...MERCS.map((id) => (mercs[id] ?? 0) * (P[id]?.hp ?? 0)));
              for (const t of T_CHOICES) {
                for (const scale of SCALES) {
                  const { counts, lead } = build(t, scale, mercMaxHp);
                  if (lead > req0.housing.leadership) continue;
                  const full = {
                    ...counts,
                    ...Object.fromEntries(mercIds.map((id) => [id, mercs[id] ?? 0])),
                  };
                  const req = withCaps(withUnits(req0, Object.keys(full)), full);
                  const ev = evaluateCounts(req, full);
                  evaluated += 1;
                  if (ev.result.stacks.length === 0) continue;
                  const plan = cost(ev.result, req);
                  if (plan.silver > budget) continue;
                  candidates.push({
                    mercs,
                    k,
                    t,
                    scale,
                    damage: ev.summary.avgDamage,
                    silver: plan.silver,
                    counts: full,
                  });
                }
              }
            }
          }
        }
      }
      report.add(`${n(evaluated)} marches evaluated (mercenary vectors × ladder depth × ladder scale).`);

      const byTotal = [...candidates].sort((x, y) => y.k * y.damage - x.k * x.damage);
      report.h('The plans, by total damage over the whole sequence');
      report.add(
        '| plan | marches | damage / march | **total damage** | silver / march | total silver | mercenaries burned |\n|---|---|---|---|---|---|---|',
      );
      const seen = new Set<string>();
      let shown = 0;
      for (const cand of byTotal) {
        const key = Object.values(cand.mercs).join('/') + `·T${cand.t}·${cand.scale}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const burned = MERCS.reduce(
          (sum, id) => sum + (cand.mercs[id] ? chunks(cand.mercs[id]!) * cand.k : 0),
          0,
        );
        report.add(
          `| ${MERCS.map((id) => `${label(id)} ${n(cand.mercs[id] ?? 0)}`).join(' · ')} · ${cand.t} rung${cand.t > 1 ? 's' : ''} @ ${cand.scale}× | ${cand.k} | ${n(cand.damage)} | ` +
            `**${n(cand.k * cand.damage)}** | ${n(cand.silver)} | ${n(cand.k * cand.silver)} | ${burned} |`,
        );
        shown += 1;
        if (shown >= 12) break;
      }

      // ---- B. spend the leftovers: a final march with whatever stock and silver remain ---------------
      report.h('Refinement: a final march built from the leftovers');
      report.add(
        '| base plan | marches | base total | + final march | refined total | leftover silver used |\n|---|---|---|---|---|---|',
      );
      let refined: { plan: Candidate; total: number; finale: Candidate | null } | null = null;
      for (const cand of byTotal.slice(0, 8)) {
        const vector = cand.mercs;
        const spent = Object.fromEntries(MERCS.map((id) => [id, chunks(vector[id] ?? 0) * cand.k]));
        const left = Object.fromEntries(
          MERCS.map((id) => [id, Math.max(0, (STOCK[id] ?? 0) - (spent[id] ?? 0))]),
        );
        const leftSilver = SILVER - cand.k * cand.silver;
        const maxHp = Math.max(0, ...MERCS.map((id) => (left[id] ?? 0) * (P[id]?.hp ?? 0)));
        let bestFinale: Candidate | null = null;
        for (const t of T_CHOICES) {
          for (const scale of SCALES) {
            const { counts, lead } = build(t, scale, maxHp * 1.01);
            if (lead > req0.housing.leadership) continue;
            const ids = MERCS.filter((id) => (left[id] ?? 0) > 0);
            const full = { ...counts, ...Object.fromEntries(ids.map((id) => [id, left[id] ?? 0])) };
            if (Object.keys(full).length === 0) continue;
            const req = withCaps(withUnits(req0, Object.keys(full)), full);
            const ev = evaluateCounts(req, full);
            if (ev.result.stacks.length === 0) continue;
            const plan = cost(ev.result, req);
            if (plan.silver > leftSilver) continue;
            const candFinale: Candidate = {
              mercs: left,
              k: 1,
              t,
              scale,
              damage: ev.summary.avgDamage,
              silver: plan.silver,
              counts: full,
            };
            if (!bestFinale || candFinale.damage > bestFinale.damage) bestFinale = candFinale;
          }
        }
        const total = cand.k * cand.damage + (bestFinale?.damage ?? 0);
        report.add(
          `| ${MERCS.map((id) => `${label(id)} ${n(vector[id] ?? 0)}`).join(' · ')} · ${cand.t} rungs @ ${cand.scale}× | ${cand.k} | ${n(cand.k * cand.damage)} | ` +
            `${bestFinale ? `${n(bestFinale.damage)} (${bestFinale.t} rungs, ${n(bestFinale.silver)} silver, leaving ${MERCS.map((id) => n(Math.max(0, (left[id] ?? 0) - (bestFinale!.counts[id] ?? 0)))).join('/')})` : 'none fits'} | ` +
            `**${n(total)}** | ${n(bestFinale?.silver ?? 0)} |`,
        );
        if (!refined || total > refined.total) refined = { plan: cand, total, finale: bestFinale };
      }

      // ---- the winner in full ------------------------------------------------------------------------
      const best = refined?.plan ?? byTotal[0];
      const bestTotal = refined?.total ?? (best ? best.k * best.damage : 0);
      if (best) {
        report.h('The winning plan, march by march');
        report.add(
          `**${best.k} marches** of this composition, silver ${n(best.k * best.silver)} of the ${n(SILVER)} held, ` +
            `then a final march with what remains — total damage **${n(bestTotal)}**.`,
        );
        const req = withCaps(withUnits(req0, Object.keys(best.counts)), best.counts);
        const ev = evaluateCounts(req, best.counts);
        const ls = lines(ev);
        const hit = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
        report.add(
          '| # | stack | units | total HP | a hit | strikes E/A | damage |\n|---|---|---|---|---|---|---|',
        );
        for (const row of ls) {
          report.add(
            `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(hit(row) * row.damagePerHit))} |`,
          );
        }
        const plan = cost(ev.result, req);
        report.add(
          `\nper march: damage min ${n(ev.summary.minDamage)} / avg ${n(ev.summary.avgDamage)} / max ${n(ev.summary.maxDamage)} · ` +
            `silver ${n(plan.silver)} · gold ${n(plan.gold)} · training ${(plan.seconds / 86400).toFixed(1)} d · ` +
            `leadership ${n(ev.result.pools.leadership.used)}/${n(ev.result.pools.leadership.capacity)} · authority ${n(ev.result.pools.authority.used)}/${n(ev.result.pools.authority.capacity)}`,
        );
        report.add(
          `\nmercenary stock per march: ${MERCS.map((id) => `${label(id)} ${n(best.mercs[id] ?? 0)} fielded, ${chunks(best.mercs[id] ?? 0)} lost`).join(' · ')} — ` +
            `the same vector lasts ${best.k} marches, after which the irreplaceable three are spent.`,
        );
        report.add(
          `\nleftover silver after the plan: ${n(SILVER - best.k * best.silver)}; leftover gold after reviving the mercenaries ${best.k} times: ` +
            `${n(12_000 - best.k * plan.gold)} of the 12,000 held.`,
        );
        if (refined?.finale) {
          const f = refined.finale;
          const fev = evaluateCounts(withCaps(withUnits(req0, Object.keys(f.counts)), f.counts), f.counts);
          report.add(
            `\n**final march** (the leftovers): ${lines(fev)
              .map((row) => `${row.label} ${n(row.count)}`)
              .join(' · ')} — ` +
              `damage **${n(f.damage)}**, silver ${n(f.silver)}, gold ${n(cost(fev.result, withCaps(withUnits(req0, Object.keys(f.counts)), f.counts)).gold)}`,
          );
        }
      }
      report.save();
    });
  },
  900_000,
);
