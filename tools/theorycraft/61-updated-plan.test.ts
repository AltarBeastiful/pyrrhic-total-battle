/**
 * 61 — the updated plan (owner, 2026-09-14, after the 04:39 report and the buff).
 *
 * Two corrections since file 56 computed the plan that was marched:
 *
 *  1. **The profile.** Fitted from the two reports of the day, the account's real shape is a guardsmen base of
 *     +157 health / +187 strength, the owner's own buff (+2 / +1) scoped to the **categories** — which is why
 *     EMH VI (guardsmen, no category) stays at the base — and a small ranged term. The 00:41 fight carried a
 *     further +2 / +2 on everything, EMH VI included, which was gone by 04:39. The plan is computed under
 *     both: "with" = +159 / +188 troops and +157 / +187 EMH VI, "plus" = +161 / +190 and +159 / +189.
 *  2. **The floor margin.** The 04:39 journal diverged because a hair's-breadth order flipped: the engine
 *     rounds `hpPerUnit` (0.03 % here) and the plan packed two stacks 0.04 % apart. A mercenary stack of 5–10
 *     units is worse — one unit is 10–20 % of it — so the mercenaries are now sized to sit at least `MARGIN`
 *     below the lowest rung, where a unit or two cannot lift them past it.
 *
 * Inputs unchanged: 3 M silver, mercenaries held EMH6 14 · LGN6 16 · ABT6 15 · CHR6 7, leadership 4,400, four
 * enemy squads. `THEORY=1 pnpm vitest run tools/theorycraft/61-updated-plan.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { BonusTotals, ResolvedSource, StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluateCounts,
  label,
  lines,
  loadOwner,
  n,
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
/** Minimum gap between the biggest mercenary stack and the lowest troop rung. */
/** The search runs at the robust gap; the sensitivity table below prices the others. */
const SEARCH_GAP = 0.25;
const GAPS = [0.02, 0.05, 0.1, 0.25, 0.6];

/** The account as it really is: base, plus the owner's buff on the categories. */
const BASE: ResolvedSource = {
  id: 'account',
  label: 'the account (base + the owner buff on categories)',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
/** The extra +2 / +2 that was present at 00:41 and gone by 04:39. */
const EXTRA: ResolvedSource = {
  id: 'extra-two',
  label: '+2 health / +2 strength on everything',
  kind: 'event',
  health: { guardsmen: 2 },
  strength: { guardsmen: 2 },
};

describe.skipIf(!process.env.THEORY)(
  'updated plan',
  () => {
    it('rebuilds it for the real profile and a margin', () => {
      const report = new Report('61-updated-plan');
      const owner = loadOwner();
      const without: BonusTotals = aggregateBonuses([BASE]);
      const with_: BonusTotals = aggregateBonuses([BASE, EXTRA]);
      const reqOf = (totals: BonusTotals): StackRequest =>
        withHousing({ ...owner.twelve, totals }, { leadership: 4_400, authority: 2_180 });
      const req0 = reqOf(with_);
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
        `profile: EMH VI at +${without.health.guardsmen} / +${without.strength.guardsmen}, a categoried troop at ` +
          `+${without.health.guardsmen + without.health.melee} / +${without.strength.guardsmen + without.strength.melee}; ` +
          `with the extra +2/+2: EMH VI +${with_.health.guardsmen} / +${with_.strength.guardsmen}, troops +${with_.health.guardsmen + with_.health.melee} / +${with_.strength.guardsmen + with_.strength.melee}.`,
      );

      const cost = (req: StackRequest, result: StackResult) => {
        let silver = 0;
        let gold = 0;
        for (const stack of result.stacks) {
          const unit = byId.get(stack.unitId);
          if (!unit) continue;
          const c =
            stack.pool === 'authority'
              ? reviveOne(unit, stack.count, req.recovery)
              : retrainOne(unit, stack.count, req.recovery);
          silver += c.silver;
          gold += c.gold;
        }
        return { silver: Math.round(silver), gold: Math.round(gold) };
      };
      /** Rungs 0.4 % apart, the lowest sitting `gap` above the biggest mercenary stack. */
      const build = (t: number, gap: number, mercMaxHp: number) => {
        const topFirst = [...ranked.slice(0, t)].reverse();
        const floor = mercMaxHp * (1 + gap);
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
      const evaluate = (req: StackRequest, counts: Record<string, number>) => {
        const ev = evaluateCounts(withCaps(withUnits(req, Object.keys(counts)), counts), counts);
        if (ev.result.stacks.length === 0) return null;
        return { damage: ev.summary.avgDamage, silver: cost(req, ev.result).silver, summary: ev };
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
      /**
       * The whole sequence for a mercenary vector: K uniform marches of a chosen ladder **plus the best final
       * march the leftover silver and leftover mercenaries can buy**. The uniform ladder is chosen to maximise
       * the sequence, not the single march — a march that leaves silver for a bigger finale can win.
       */
      const plan = (mercs: Record<string, number>, totals: BonusTotals, gapOverride?: number) => {
        const req = reqOf(totals);
        const k = marches(mercs);
        const budget = SILVER / k;
        const mercMaxHp = Math.max(0, ...MERCS.map((id) => (mercs[id] ?? 0) * (P[id]?.hp ?? 0)));
        const mercIds = MERCS.filter((id) => (mercs[id] ?? 0) > 0);
        // what the leftovers can do, as a curve of damage against silver
        const spent = Object.fromEntries(MERCS.map((id) => [id, chunks(mercs[id] ?? 0) * k]));
        const left = Object.fromEntries(
          MERCS.map((id) => [id, Math.max(0, (STOCK[id] ?? 0) - (spent[id] ?? 0))]),
        );
        const leftMaxHp = Math.max(0, ...MERCS.map((id) => (left[id] ?? 0) * (P[id]?.hp ?? 0)));
        const leftIds = MERCS.filter((id) => (left[id] ?? 0) > 0);
        const curve: { silver: number; damage: number; counts: Record<string, number> }[] = [];
        if (leftMaxHp > 0) {
          for (let t = 1; t <= 7; t += 1) {
            for (const gap of gapOverride !== undefined ? [gapOverride] : GAPS) {
              const { counts: rungs, lead } = build(t, gap, leftMaxHp);
              if (lead > req.housing.leadership) continue;
              const full = { ...rungs, ...Object.fromEntries(leftIds.map((id) => [id, left[id] ?? 0])) };
              const res = evaluate(req, full);
              if (res) curve.push({ silver: res.silver, damage: res.damage, counts: full });
            }
          }
        }
        curve.sort((a, b) => a.silver - b.silver);
        let running = 0;
        const meilleur = curve.map((point) => {
          running = Math.max(running, point.damage);
          return { silver: point.silver, damage: running };
        });
        const finaleFor = (silverLeft: number): number => {
          let lo = 0;
          let hi = meilleur.length - 1;
          let found = 0;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if ((meilleur[mid]?.silver ?? 0) <= silverLeft) {
              found = meilleur[mid]?.damage ?? 0;
              lo = mid + 1;
            } else hi = mid - 1;
          }
          return found;
        };
        let best: {
          damage: number;
          silver: number;
          t: number;
          gap: number;
          counts: Record<string, number>;
          total: number;
        } | null = null;
        for (let t = 1; t <= 7; t += 1) {
          {
            const gap = gapOverride ?? SEARCH_GAP;
            const { counts, lead } = build(t, gap, mercMaxHp);
            if (lead > req.housing.leadership) continue;
            const full = { ...counts, ...Object.fromEntries(mercIds.map((id) => [id, mercs[id] ?? 0])) };
            const res = evaluate(req, full);
            if (!res || res.silver > budget) continue;
            const total = k * res.damage + finaleFor(SILVER - k * res.silver);
            if (!best || total > best.total)
              best = { damage: res.damage, silver: res.silver, t, gap, counts: full, total };
          }
        }
        if (!best) return null;
        const finaleSilver = SILVER - k * best.silver;
        const finalePick = curve
          .filter((point) => point.silver <= finaleSilver)
          .sort((a, b) => b.damage - a.damage)[0];
        return {
          k,
          best,
          finale: finalePick
            ? { damage: finalePick.damage, counts: finalePick.counts, silver: finalePick.silver }
            : null,
          total: best.total,
        };
      };

      /** The worst a single-unit change to any mercenary count does to one march. */
      const worstUnit = (
        counts: Record<string, number>,
        totals: BonusTotals,
      ): { damage: number; what: string } => {
        const req = reqOf(totals);
        const base = evaluate(req, counts);
        if (!base) return { damage: 0, what: 'none' };
        let worst = { damage: base.damage, what: 'nothing' };
        for (const id of MERCS) {
          if (!(counts[id] ?? 0)) continue;
          for (const delta of [1, -1]) {
            const value = (counts[id] ?? 0) + delta;
            if (value < 1 || value > (STOCK[id] ?? 0)) continue;
            const res = evaluate(req, { ...counts, [id]: value });
            if (res && res.damage < worst.damage)
              worst = { damage: res.damage, what: `${label(id)} ${value}` };
          }
        }
        return worst;
      };

      // The plan of file 56, for reference, under both profiles.
      const OLD: Record<string, number> = {
        'spearman-2': 226,
        'rider-1': 202,
        'rider-3': 63,
        'archer-2': 222,
        'archer-1': 399,
        'rider-2': 111,
        'arbalester-6': 10,
        'legionary-6': 10,
        'chariot-6': 5,
        'epic-monster-hunter-6': 10,
      };
      const oldWith = evaluate(reqOf(with_), OLD);

      // The search: the mercenary vector by coordinate ascent, then the ladders.
      let current: Record<string, number> = { ...OLD };
      let best = plan(current, with_)!;
      for (let round = 1; round <= 3; round += 1) {
        let improved = false;
        for (const id of MERCS) {
          for (let value = 0; value <= (STOCK[id] ?? 0); value += 1) {
            const trial = { ...current, [id]: value };
            const p = plan(trial, with_);
            if (p && p.total > best.total + 1) {
              best = p;
              current = trial;
              improved = true;
            }
          }
        }
        report.add(
          `round ${round}: ${n(best.total)} with ${MERCS.map((id) => `${label(id)} ${n(current[id] ?? 0)}`).join(' · ')}${improved ? '' : ' — no further improvement'}`,
        );
        if (!improved) break;
      }

      report.h('The updated plan, stack by stack');
      const uniform = evaluate(reqOf(with_), best.best.counts)!;
      const uniformWithout = evaluate(reqOf(without), best.best.counts)!;
      const ls = lines(uniform.summary);
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
        `\nthe uniform march: avg **${n(uniform.damage)}** (min ${n(uniform.summary.summary.minDamage)} / max ${n(uniform.summary.summary.maxDamage)}) · silver ${n(uniform.silver)} · ` +
          `leadership ${n(uniform.summary.result.pools.leadership.used)}/${n(uniform.summary.result.pools.leadership.capacity)} · ` +
          `without the extra +2/+2: ${n(uniformWithout?.damage ?? 0)}`,
      );
      if (best.finale) {
        const fev = evaluate(reqOf(with_), best.finale.counts)!;
        report.add(
          `\nthe final march (the leftovers): ${lines(fev.summary)
            .map((row) => `${row.label} ${n(row.count)}`)
            .join(' · ')} → **${n(fev.damage)}** (${n(fev.silver)} silver)`,
        );
      }
      report.add(
        `\n**plan total: ${n(best.total)} on ${n(SILVER)} silver** (${best.k} uniform marches of ${n(best.best.damage)} + a finale of ${n(best.finale?.damage ?? 0)}).`,
      );

      report.h('What the gap costs, on the winning vector');
      report.add(
        '| gap above the mercenaries | uniform march | finale | plan total | damage / silver |\n|---|---|---|---|---|',
      );
      for (const gap of GAPS) {
        const probeGap = plan({ ...current }, with_, gap);
        if (!probeGap) continue;
        report.add(
          `| ${(gap * 100).toFixed(0)} % | ${n(probeGap.best.damage)} | ${n(probeGap.finale?.damage ?? 0)} | **${n(probeGap.total)}** | ${(probeGap.total / SILVER).toFixed(2)} |`,
        );
      }

      report.h('The plan that was marched, against this one, on one march');
      report.add(
        '| plan | with the extra +2/+2 | without it | worst single-unit mercenary change |\n|---|---|---|---|',
      );
      const compare = (name: string, counts: Record<string, number>): void => {
        const a = evaluate(reqOf(with_), counts);
        const b = evaluate(reqOf(without), counts);
        const w = worstUnit(counts, with_);
        if (!a) return;
        report.add(
          `| ${name} | **${n(a.damage)}** | ${n(b?.damage ?? 0)} | ` +
            `${w.what === 'nothing' ? '**nothing moves**' : `${w.what} costs ${n(a.damage - w.damage)} (${(((a.damage - w.damage) / a.damage) * 100).toFixed(1)} %)`} |`,
        );
      };
      compare('file 56 as marched (EMH6 10, no margin)', OLD);
      compare(
        `file 61 (EMH6 ${n(best.best.counts['epic-monster-hunter-6'] ?? 0)}, 25 % margin)`,
        best.best.counts,
      );

      // The plan that was marched with its own finale, for the totals comparison.
      const FINALE_56: Record<string, number> = {
        'spearman-1': 523,
        'spearman-2': 289,
        'rider-3': 81,
        'rider-1': 258,
        'rider-2': 143,
        'archer-2': 284,
        'archer-1': 510,
        'legionary-6': 13,
        'arbalester-6': 12,
        'epic-monster-hunter-6': 11,
        'chariot-6': 4,
      };
      const f56 = evaluate(reqOf(with_), FINALE_56);
      report.add(
        `\ntotals — file 56's plan under this profile: ${n(3 * (oldWith?.damage ?? 0) + (f56?.damage ?? 0))} ` +
          `(3 × ${n(oldWith?.damage ?? 0)} + ${n(f56?.damage ?? 0)}); file 61's: **${n(best.total)}** (${best.k} × ${n(best.best.damage)} + ${n(best.finale?.damage ?? 0)}).`,
      );
      report.save();
    });
  },
  900_000,
);
