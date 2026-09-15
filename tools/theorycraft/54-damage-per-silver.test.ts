/**
 * 54 — damage per silver, re-derived from verified inputs only (owner's request, 2026-09-14).
 *
 * Inputs, each from a game artefact and nothing else:
 *   - mercenaries held: ABT6 15 · CHR6 7 · EMH6 14 · LGN6 16 (owner's screenshot, 2026-09-14);
 *   - housing: leadership 4,400 · authority 2,180 (the same screenshot);
 *   - enemy: 4 squads, one per category (the 2026-09-14 report's formation);
 *   - bonuses: scenario C, the ones that report's own 30 lines fix (guardsmen +159 % health / +189 %
 *     strength with a +2 health / +1 strength category top-up, ranged +2.5 / +2, double damage +3 %);
 *   - unit stats and training/revival prices: src/data (the tables the app ships).
 * Nothing here is recalled from an earlier chapter: every number below is produced by this script.
 *
 * The search is a **frontier**, not a single answer: a ladder of T troop rungs placed above the mercenaries,
 * sized from the smallest floor that shelters them upward, plus the degenerate zero-troop march. Damage per
 * silver has no maximum while a march can cost no silver at all, so the file reports damage per silver and
 * damage per mercenary burned side by side — the stock is the resource that does not come back.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/54-damage-per-silver.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluate,
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

const HELD: Record<string, number> = {
  'arbalester-6': 15,
  'chariot-6': 7,
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
};
const MERCS = ['epic-monster-hunter-6', 'legionary-6', 'arbalester-6', 'chariot-6'];
/** Troop types, best damage-per-HP first (the ranking the engine's own numbers produce, printed below). */
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

describe.skipIf(!process.env.THEORY)(
  'damage per silver',
  () => {
    it('walks the ladder frontier with the mercenaries held today', () => {
      const report = new Report('54-damage-per-silver');
      const owner = loadOwner();
      const req0 = withHousing(scenarioC(owner.twelve), { leadership: 4_400, authority: 2_180 });
      const byId = new Map(req0.units.map((u) => [u.id, u]));

      const probe = (id: string): { hp: number; str: number; cost: number } => {
        const ev = evaluateCounts(req0, { [id]: 1 });
        const stack = ev.result.stacks[0];
        const unit = req0.units.find((u) => u.id === id);
        return { hp: stack?.hpPerUnit ?? 0, str: stack?.strengthPerUnit ?? 0, cost: unit?.cost ?? 0 };
      };
      const P: Record<string, { hp: number; str: number; cost: number }> = {};
      for (const id of [...BY_K, ...MERCS]) P[id] = probe(id);

      report.add(
        `inputs — mercenaries held ${MERCS.map((id) => `${label(id)} ${HELD[id]}`).join(' · ')} · leadership ${n(req0.housing.leadership)} · ` +
          `authority ${n(req0.housing.authority)} · enemy 4 squads · bonuses: the 2026-09-14 report's (scenario C).`,
      );
      report.add(
        `\neffective HP per unit (scenario C): ${[...BY_K, ...MERCS].map((id) => `${label(id)} ${n(P[id]?.hp ?? 0)}`).join(' · ')}`,
      );
      report.add(
        `\ndamage per effective HP (the ranking that fixes ladder order): ` +
          BY_K.map((id) => `${label(id)} ${(((P[id]?.str ?? 0) / (P[id]?.hp ?? 1)) * 1).toFixed(3)}`).join(
            ' · ',
          ),
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
      const burned = (result: StackResult): number =>
        result.stacks.filter((s) => s.pool === 'authority').reduce((sum, s) => sum + chunks(s.count), 0);

      /** All mercenaries held, as caps. */
      const mercCaps: Record<string, number> = { ...HELD };
      const withMercs = (ids: string[]): StackRequest =>
        withCaps(withUnits(req0, [...ids, ...MERCS]), mercCaps);

      interface Row {
        what: string;
        stacks: string;
        damage: number;
        silver: number;
        gold: number;
        burned: number;
        perSilver: number;
        perMerc: number;
        counts: Record<string, number>;
      }
      const rows: Row[] = [];
      const measure = (what: string, ids: string[], counts: Record<string, number>): void => {
        const req = ids.length > 0 ? withMercs(ids) : withMercs([]);
        const ev = evaluateCounts(req, counts);
        if (ev.result.stacks.length === 0) return;
        const plan = cost(ev.result, req);
        const b = burned(ev.result);
        rows.push({
          what,
          stacks: ev.result.stacks.map((s) => `${label(s.unitId)} ${n(s.count)}`).join(' · '),
          damage: ev.summary.avgDamage,
          silver: plan.silver,
          gold: plan.gold,
          burned: b,
          perSilver: plan.silver > 0 ? ev.summary.avgDamage / plan.silver : Infinity,
          perMerc: b > 0 ? ev.summary.avgDamage / b : Infinity,
          counts,
        });
      };

      const mercMaxHp = Math.max(...MERCS.map((id) => (HELD[id] ?? 0) * (P[id]?.hp ?? 0)));
      // ---- A. the degenerate march: the mercenaries alone -------------------------------------------------
      measure(
        'mercenaries alone (no troops, no silver)',
        [],
        Object.fromEntries(MERCS.map((id) => [id, HELD[id] ?? 0])),
      );

      // ---- B. minimal ladders: T rungs, lowest rung just above the biggest mercenary stack ---------------
      for (let T = 1; T <= 8; T += 1) {
        const chosen = BY_K.slice(0, T); // the best damage-per-HP types
        const ordered = [...chosen].reverse(); // worst at the top (it dies unstruck), best at the bottom
        for (const scale of [1.01, 1.25, 1.5, 2.0]) {
          const floor = mercMaxHp * scale;
          const counts: Record<string, number> = {};
          let leadUsed = 0;
          ordered.forEach((id, i) => {
            const p = P[id] as { hp: number; str: number; cost: number };
            const count = Math.max(1, Math.floor((floor * STEP ** i) / p.hp));
            counts[id] = count;
            leadUsed += count * p.cost;
          });
          for (const id of MERCS) counts[id] = HELD[id] ?? 0;
          if (leadUsed > req0.housing.leadership) {
            report.add(
              `\n(T = ${T} rungs at ${scale.toFixed(2)}× the mercenary floor would need ${n(leadUsed)} leadership — over the ${n(req0.housing.leadership)} held, skipped)`,
            );
            continue;
          }
          measure(`${T} rung${T > 1 ? 's' : ''} @ ${scale.toFixed(2)}× floor`, ordered, counts);
        }
      }

      // ---- C. references: the app's sizer, and the 12-stack winner of file 53 ----------------------------
      const sizer = evaluate(withCaps(withUnits(req0, [...BY_K, ...MERCS]), mercCaps));
      const sizerPlan = cost(sizer.result, withCaps(withUnits(req0, [...BY_K, ...MERCS]), mercCaps));
      rows.push({
        what: "the app's own sizer (reference)",
        stacks: sizer.result.stacks.map((s) => `${label(s.unitId)} ${n(s.count)}`).join(' · '),
        damage: sizer.summary.avgDamage,
        silver: sizerPlan.silver,
        gold: sizerPlan.gold,
        burned: burned(sizer.result),
        perSilver: sizerPlan.silver > 0 ? sizer.summary.avgDamage / sizerPlan.silver : Infinity,
        perMerc: sizer.summary.avgDamage / burned(sizer.result),
        counts: Object.fromEntries(sizer.result.stacks.map((st) => [st.unitId, st.count])),
      });

      report.h('Every march measured, sorted by damage per silver');
      report.add(
        '| march | stacks, in kill order | damage | silver | gold | mercenaries burned | damage / silver | damage / merc burned |\n|---|---|---|---|---|---|---|---|',
      );
      for (const row of [...rows].sort((a, b) => b.perSilver - a.perSilver)) {
        report.add(
          `| ${row.what} | ${row.stacks} | **${n(row.damage)}** | ${n(row.silver)} | ${n(row.gold)} | ${row.burned} | ` +
            `${Number.isFinite(row.perSilver) ? row.perSilver.toFixed(2) : '∞ (0 silver)'} | ${n(Math.round(row.perMerc))} |`,
        );
      }

      report.h('The same rows sorted by damage per mercenary burned (the stock is what does not come back)');
      report.add(
        '| march | damage | mercenaries burned | damage / merc burned | silver | damage / silver |\n|---|---|---|---|---|---|',
      );
      for (const row of [...rows].sort((a, b) => b.perMerc - a.perMerc).slice(0, 10)) {
        report.add(
          `| ${row.what} | **${n(row.damage)}** | ${row.burned} | ${n(Math.round(row.perMerc))} | ${n(row.silver)} | ${Number.isFinite(row.perSilver) ? row.perSilver.toFixed(2) : '∞'} |`,
        );
      }

      // ---- C. the weekly rate at 5 M silver, with the strikes printed for the best-per-silver non-degenerate
      report.h('The frontier, week by week at 5 M silver a week');
      report.add(
        '| march | marches / week on silver | damage / week | silver / week | mercenaries burned / week |\n|---|---|---|---|---|',
      );
      for (const row of [...rows]
        .filter((r) => r.silver > 0)
        .sort((a, b) => b.perSilver - a.perSilver)
        .slice(0, 8)) {
        const k = 5_000_000 / row.silver;
        report.add(
          `| ${row.what} | ${k.toFixed(2)} | **${n(Math.round(k * row.damage))}** | ${n(Math.round(k * row.silver))} | ${Math.round(k * row.burned)} |`,
        );
      }

      // ---- D. the strikes of the best-per-silver ladder, stack by stack ----------------------------------
      // ---- E. the sustained state: EMH6 only (it renews at ~95 a week), the other three do not -----------
      report.h('EMH6 only — the state after the irreplaceable mercenaries are spent');
      report.add(
        '| EMH6 fielded | ladder | damage | silver | damage / silver | damage / EMH6 burned |\n|---|---|---|---|---|---|',
      );
      for (const e of [14, 46, 92]) {
        const emhMaxHp = e * (P['epic-monster-hunter-6']?.hp ?? 0);
        for (const T of [1, 2, 3, 4, 6, 8]) {
          const chosen = BY_K.slice(0, T);
          const ordered = [...chosen].reverse();
          const counts: Record<string, number> = { 'epic-monster-hunter-6': e };
          let leadUsed = 0;
          ordered.forEach((id, i) => {
            const p = P[id] as { hp: number; str: number; cost: number };
            const count = Math.max(1, Math.floor((emhMaxHp * 1.01 * STEP ** i) / p.hp));
            counts[id] = count;
            leadUsed += count * p.cost;
          });
          if (leadUsed > req0.housing.leadership) continue;
          const req = withCaps(withUnits(req0, [...ordered, 'epic-monster-hunter-6']), counts);
          const ev = evaluateCounts(req, counts);
          if (ev.result.stacks.length === 0) continue;
          const plan = cost(ev.result, req);
          const emhBurned = chunks(e);
          report.add(
            `| ${e} | ${T} rung${T > 1 ? 's' : ''} minimal | **${n(ev.summary.avgDamage)}** | ${n(plan.silver)} | ` +
              `${plan.silver > 0 ? (ev.summary.avgDamage / plan.silver).toFixed(2) : '∞'} | ${n(Math.round(ev.summary.avgDamage / emhBurned))} |`,
          );
        }
      }

      const best = [...rows].filter((r) => r.silver > 0).sort((a, b) => b.perSilver - a.perSilver)[0];
      if (best) {
        report.h(`Stack by stack: ${best.what}`);
        const req = withMercs(Object.keys(best.counts).filter((id) => BY_K.includes(id)));
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
      }
      report.save();
    });
  },
  900_000,
);
