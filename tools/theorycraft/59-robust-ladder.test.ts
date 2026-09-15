/**
 * 59 — what robustness costs (owner, 2026-09-14, after the 04:39 report).
 *
 * The plan of file 56 was marched and the journal diverged from the engine on 22 of 24 entries, because the
 * ladder packed its stacks 0.2–1 % apart in HP and the app's EMH VI runs 0.8 % above the game's — enough to
 * swap which of two stacks dies first and move every strike downstream (see docs/research/
 * battlereport-2026-09-14-0439.md).
 *
 * So: rebuild the same plan with a **minimum step S between consecutive stacks in the ladder** (and the same
 * margin between the biggest mercenary stack and the lowest rung), and score each variant twice — with the
 * app's stats, and with EMH VI's health 0.8 % lower, which is what the game actually used. The first column
 * is what robustness costs; the last is what it buys.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/59-robust-ladder.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluateCounts,
  label,
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
const T_CHOICES = [1, 2, 3, 4, 5, 6, 7];
const SCALES = [1.01, 1.05, 1.1, 1.2, 1.35, 1.5, 1.75, 2.0, 2.5, 3.0];
/** The two seeds worth carrying: file 56's winner (3 marches, Chariot 5) and file 55's (4 marches, Chariot 4). */
const SEEDS: Record<string, Record<string, number>> = {
  '3 marches (file 56)': {
    'epic-monster-hunter-6': 9,
    'legionary-6': 10,
    'arbalester-6': 10,
    'chariot-6': 5,
  },
  '4 marches (file 55)': {
    'epic-monster-hunter-6': 10,
    'legionary-6': 10,
    'arbalester-6': 10,
    'chariot-6': 4,
  },
};

describe.skipIf(!process.env.THEORY)(
  'robust ladder',
  () => {
    it('prices the minimum step', () => {
      const report = new Report('59-robust-ladder');
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
      /** A ladder of t rungs whose consecutive stacks are at least `step` apart, mercenaries under the floor. */
      const build = (t: number, scale: number, mercMaxHp: number, step: number) => {
        const topFirst = [...ranked.slice(0, t)].reverse();
        const floor = mercMaxHp * (1 + step) * scale;
        const counts: Record<string, number> = {};
        let lead = 0;
        topFirst.forEach((id, j) => {
          const p = P[id]!;
          const count = Math.max(1, Math.floor((floor * (1 + step) ** (t - 1 - j)) / p.hp));
          counts[id] = count;
          lead += count * p.cost;
        });
        return { counts, lead, floor };
      };
      const evaluate = (
        req: StackRequest,
        counts: Record<string, number>,
      ): { damage: number; silver: number } | null => {
        const ev = evaluateCounts(withCaps(withUnits(req, Object.keys(counts)), counts), counts);
        if (ev.result.stacks.length === 0) return null;
        return { damage: ev.summary.avgDamage, silver: cost(ev.result, req).silver };
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
      /** The whole plan for a mercenary vector at a given minimum step: K marches plus the leftovers in one. */
      const plan = (mercs: Record<string, number>, step: number) => {
        const k = marches(mercs);
        const budget = SILVER / k;
        const mercMaxHp = Math.max(0, ...MERCS.map((id) => (mercs[id] ?? 0) * (P[id]?.hp ?? 0)));
        const mercIds = MERCS.filter((id) => (mercs[id] ?? 0) > 0);
        let best: { damage: number; silver: number; t: number; scale: number } | null = null;
        for (const t of T_CHOICES) {
          for (const scale of SCALES) {
            const { counts, lead } = build(t, scale, mercMaxHp, step);
            if (lead > req0.housing.leadership) continue;
            const res = evaluate(req0, {
              ...counts,
              ...Object.fromEntries(mercIds.map((id) => [id, mercs[id] ?? 0])),
            });
            if (!res || res.silver > budget) continue;
            if (!best || res.damage > best.damage)
              best = { damage: res.damage, silver: res.silver, t, scale };
          }
        }
        if (!best) return null;
        const spent = Object.fromEntries(MERCS.map((id) => [id, chunks(mercs[id] ?? 0) * k]));
        const left = Object.fromEntries(
          MERCS.map((id) => [id, Math.max(0, (STOCK[id] ?? 0) - (spent[id] ?? 0))]),
        );
        const leftSilver = SILVER - k * best.silver;
        const leftMaxHp = Math.max(0, ...MERCS.map((id) => (left[id] ?? 0) * (P[id]?.hp ?? 0)));
        let finale = 0;
        for (const t of T_CHOICES) {
          for (const scale of SCALES) {
            const { counts, lead } = build(t, scale, leftMaxHp, step);
            if (lead > req0.housing.leadership) continue;
            const ids = MERCS.filter((id) => (left[id] ?? 0) > 0);
            const res = evaluate(req0, {
              ...counts,
              ...Object.fromEntries(ids.map((id) => [id, left[id] ?? 0])),
            });
            if (!res || res.silver > leftSilver) continue;
            finale = Math.max(finale, res.damage);
          }
        }
        return { k, ...best, finale, total: k * best.damage + finale };
      };
      /**
       * The plan re-scored with every mercenary count moved by one unit — the change that broke the 04:39
       * march (EMH VI at 10 instead of 9 slid it from the bottom of the ladder into the middle). Returns the
       * worst damage any single-unit change causes and the gap that produced it.
       */
      const worstUnitChange = (
        mercs: Record<string, number>,
        step: number,
        shape: { t: number; scale: number; k: number },
      ): { damage: number; what: string } => {
        const mercMaxHp = Math.max(0, ...MERCS.map((id) => (mercs[id] ?? 0) * (P[id]?.hp ?? 0)));
        const mercIds = MERCS.filter((id) => (mercs[id] ?? 0) > 0);
        const { counts } = build(shape.t, shape.scale, mercMaxHp, step);
        const room = (m: Record<string, number>) =>
          evaluate(req0, { ...counts, ...Object.fromEntries(mercIds.map((id) => [id, m[id] ?? 0])) });
        const base = room(mercs);
        if (!base) return { damage: 0, what: 'none' };
        let worst = { damage: base.damage, what: 'unchanged' };
        for (const id of mercIds) {
          for (const delta of [1, -1]) {
            const value = (mercs[id] ?? 0) + delta;
            if (value < 0 || value > (STOCK[id] ?? 0)) continue;
            const res = room({ ...mercs, [id]: value });
            if (!res) continue;
            if (res.damage < worst.damage) worst = { damage: res.damage, what: `${label(id)} ${value}` };
          }
        }
        return worst;
      };

      report.h('What a minimum step between stacks costs, and what it protects');
      report.add(
        '| minimum step | seed | marches | best ladder | total damage | worst single-unit mercenary change | total after it |\n|---|---|---|---|---|---|---|',
      );
      for (const step of [0.004, 0.01, 0.02, 0.03, 0.05]) {
        for (const [name, mercs] of Object.entries(SEEDS)) {
          const p = plan(mercs, step);
          if (!p) continue;
          const perturbed = worstUnitChange(mercs, step, { t: p.t, scale: p.scale, k: p.k });
          const loss = p.k * (p.damage - perturbed.damage);
          report.add(
            `| ${(step * 100).toFixed(1)} % | ${name} | ${p.k} | ${p.t} rungs @ ${p.scale.toFixed(2)}× | **${n(p.total)}** | ` +
              `${perturbed.what === 'unchanged' ? 'nothing moves' : `${perturbed.what} costs ${n(loss)} (${((100 * loss) / p.total).toFixed(1)} %)`} | ` +
              `${n(p.k * perturbed.damage + p.finale)} |`,
          );
        }
      }
      report.add(
        `\n(the perturbation moves one mercenary count by one unit — the change that broke the 04:39 march, where fielding 10 EMH VI instead of 9 ` +
          `slid that stack from the bottom of the ladder into its middle. A plan that does not move is one a single unit cannot re-order.)`,
      );
      report.save();
    });
  },
  900_000,
);
