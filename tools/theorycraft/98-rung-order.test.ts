/**
 * 98 — **which troop type on which rung.** `97` §C found the tight ladder at the search's own margin hitting for
 * 5 343 795 where the search's sweet spot hit for 5 143 988, same mercenaries, same silver — and the difference
 * was not the shape but the *assignment*: the search's `ladder()` hands the biggest rung to the type weakest
 * per HP ("dies unstruck") and the smallest to the strongest, where `97` handed them out in alphabetical order.
 *
 * This file tries **every** assignment of the troop types to the rungs (7! = 5 040) for the sweet spot's own
 * mercenaries at the search's margin, prices each with `simulateBattle`, and says where the search's rule, the
 * reverse rule, and the best sit. Then the same at 12 000 leadership and on the 2026-09-17 export.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/98-rung-order.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { DEFAULT_GAP, planCampaign } from '../../src/engine';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluateCounts, n } from './harness';

const EXPORT_LATEST =
  process.env.PYRRHIC_EXPORT_LATEST ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (3).json';
const RUNG_STEP = 1.02;
const short = (id: string): string =>
  id
    .replace(/-6$/, '')
    .replace('epic-monster-hunter', 'EMH')
    .replace(/^(\w)\w*-(\d)$/, '$1$2');

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const perm of permutations(rest)) out.push([item, ...perm]);
  });
  return out;
}

describe.skipIf(!process.env.THEORY)('which type on which rung', () => {
  it('tries every assignment', () => {
    const report = new Report('98-rung-order');
    for (const [label, file, leadership] of [
      ['latest export, its setup', EXPORT_LATEST, undefined],
      ['latest export, 12 000 leadership', EXPORT_LATEST, 12_000],
      ['export of 2026-09-17, its setup', EXPORT_2026_09_17, undefined],
    ] as const) {
      const parsed = parseImport(readFileSync(file, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('not a profile export');
      const profile = parsed.payload;
      const setup = profile.setups[0];
      if (!setup) throw new Error('no setup');
      const input = buildPlanRequest(
        profile,
        leadership === undefined ? setup : { ...setup, housing: { ...setup.housing, leadership } },
      );
      const req: StackRequest = input.request;
      const plan = planCampaign(input);
      const sweet = plan.recommend;
      if (!sweet) throw new Error('no sweet spot');
      const troops = req.units.filter((unit) => unit.pool === 'leadership');
      const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
      const eff = new Map(
        troops.map((unit) => [unit.id, effectiveUnit(unit, req.totals, req.enemy, req.activeEvents)]),
      );
      const perHp = (id: string): number => {
        const e = eff.get(id);
        if (!e) return 0;
        return hitDamage(e, 1).damage / e.hpPerUnit;
      };
      const topMerc = Math.max(
        ...mercIds.map(
          (id) =>
            (sweet.counts[id] ?? 0) *
            effectiveUnit(
              req.units.find((u) => u.id === id) as (typeof req.units)[number],
              req.totals,
              req.enemy,
              req.activeEvents,
            ).hpPerUnit,
        ),
      );
      const floor = topMerc * (1 + DEFAULT_GAP);
      /** Rung k (0 = biggest) holds `floor × 1.02^(rungs − 1 − k)` HP; `order[k]` is the type on it. */
      const build = (order: string[]): Record<string, number> | null => {
        const counts: Record<string, number> = {};
        for (const id of mercIds) counts[id] = sweet.counts[id] ?? 0;
        let used = 0;
        order.forEach((id, k) => {
          const hp = floor * RUNG_STEP ** (order.length - 1 - k);
          const count = Math.max(1, Math.floor(hp / (eff.get(id)?.hpPerUnit ?? 1)));
          counts[id] = count;
          used += count * (troops.find((u) => u.id === id)?.cost ?? 0);
        });
        return used <= req.housing.leadership ? counts : null;
      };
      const price = (counts: Record<string, number>) => {
        const ev = evaluateCounts(req, counts);
        return { damage: ev.summary.avgDamage, silver: ev.summary.recovery.silver };
      };
      const ids = troops.map((unit) => unit.id);
      const searchOrder = [...ids].sort((a, b) => perHp(a) - perHp(b)); // weakest per HP on the biggest rung
      const reverseOrder = [...searchOrder].reverse();
      const all = permutations(ids);
      let best: { order: string[]; damage: number; silver: number } | undefined;
      let worst: { order: string[]; damage: number; silver: number } | undefined;
      let feasible = 0;
      for (const order of all) {
        const counts = build(order);
        if (!counts) continue;
        feasible += 1;
        const p = price(counts);
        if (!best || p.damage > best.damage) best = { order, ...p };
        if (!worst || p.damage < worst.damage) worst = { order, ...p };
      }
      const line = (name: string, order: string[]): string => {
        const counts = build(order);
        if (!counts) return `| ${name} | ${order.map(short).join(' > ')} | over the cap | — | — |`;
        const p = price(counts);
        return `| ${name} | ${order.map(short).join(' > ')} | **${n(p.damage)}** | ${n(p.silver)} | ${(p.damage / p.silver).toFixed(2)} |`;
      };
      report.h(label);
      report.add(
        `${n(req.housing.leadership)} leadership; the sweet spot as the app draws it: ${n(sweet.repeat.damage)} damage for ` +
          `${n(sweet.repeat.silver)} silver, ${n(sweet.repeat.mercLost)} burned, shape ${sweet.shape}. Its mercenaries kept; ` +
          `${n(feasible)} of ${n(all.length)} assignments fit the leadership. Damage per HP, weakest first: ` +
          `${searchOrder.map((id) => `${short(id)} ${perHp(id).toFixed(3)}`).join(' · ')}.\n`,
      );
      report.add(
        '| assignment (biggest rung first) | order | damage | silver | a silver |\n|---|---|---|---|---|',
      );
      /** A swap climb from an order: try every pairwise swap, take the best improving one, repeat. */
      const climb = (start: string[]): { order: string[]; sims: number } => {
        let order = [...start];
        let sims = 0;
        const held = build(order);
        let currentDamage = held ? price(held).damage : -Infinity;
        for (;;) {
          let bestSwap: { order: string[]; damage: number } | undefined;
          for (let i = 0; i < order.length; i += 1) {
            for (let j = i + 1; j < order.length; j += 1) {
              const trial = [...order];
              [trial[i], trial[j]] = [trial[j] as string, trial[i] as string];
              const counts = build(trial);
              if (!counts) continue;
              sims += 1;
              const damage = price(counts).damage;
              if (damage > currentDamage && (!bestSwap || damage > bestSwap.damage)) {
                bestSwap = { order: trial, damage };
              }
            }
          }
          if (!bestSwap) break;
          order = bestSwap.order;
          currentDamage = bestSwap.damage;
        }
        return { order, sims };
      };
      const climbed = climb(searchOrder);
      report.add(
        line('the ranking’s rule (weakest per HP on top), the search’s until 2026-09-18', searchOrder),
      );
      report.add(line(`a swap climb from the rule (${n(climbed.sims)} battles)`, climbed.order));
      report.add(line('the reverse (strongest per HP on top)', reverseOrder));
      if (best) report.add(line('the best of all', best.order));
      if (worst) report.add(line('the worst of all', worst.order));
      // Does the best order depend on the mercenary vector? The same exhaustive search for each other stop's
      // mercenaries, and for a few grid-like vectors (every type at its cap, at half, one type alone).
      const caps = mercIds.map((id) => req.caps[id] ?? 0);
      const vectors: { name: string; counts: Record<string, number> }[] = [
        ...plan.alternatives.map((row) => ({
          name: `${row.pick} (${n(row.repeat.mercLost)} burned)`,
          counts: row.counts,
        })),
        {
          name: 'every type at its cap',
          counts: Object.fromEntries(mercIds.map((id, i) => [id, caps[i] ?? 0])),
        },
        {
          name: 'every type at half its cap',
          counts: Object.fromEntries(mercIds.map((id, i) => [id, Math.round((caps[i] ?? 0) / 2)])),
        },
        {
          name: 'EMH alone at its cap',
          counts: Object.fromEntries(
            mercIds.map((id) => [id, id.startsWith('epic') ? (req.caps[id] ?? 0) : 0]),
          ),
        },
      ];
      report.add(
        '\n| mercenaries | best order (biggest rung first) | its damage | the ranking’s order | its damage |\n|---|---|---|---|---|',
      );
      for (const vec of vectors) {
        const mercCounts: Record<string, number> = {};
        for (const id of mercIds) mercCounts[id] = vec.counts[id] ?? 0;
        const top = Math.max(
          ...mercIds.map(
            (id) =>
              (mercCounts[id] ?? 0) *
              effectiveUnit(
                req.units.find((u) => u.id === id) as (typeof req.units)[number],
                req.totals,
                req.enemy,
                req.activeEvents,
              ).hpPerUnit,
          ),
        );
        const floorAt = top * (1 + DEFAULT_GAP);
        const buildAt = (order: string[]): Record<string, number> | null => {
          const counts: Record<string, number> = { ...mercCounts };
          let used = 0;
          order.forEach((id, k) => {
            const count = Math.max(
              1,
              Math.floor((floorAt * RUNG_STEP ** (order.length - 1 - k)) / (eff.get(id)?.hpPerUnit ?? 1)),
            );
            counts[id] = count;
            used += count * (troops.find((u) => u.id === id)?.cost ?? 0);
          });
          return used <= req.housing.leadership ? counts : null;
        };
        let bestV: { order: string[]; damage: number } | undefined;
        for (const order of all) {
          const counts = buildAt(order);
          if (!counts) continue;
          const damage = price(counts).damage;
          if (!bestV || damage > bestV.damage) bestV = { order, damage };
        }
        const rankCounts = buildAt(searchOrder);
        report.add(
          `| ${vec.name} | ${bestV ? bestV.order.map(short).join(' > ') : 'over the cap'} | ${bestV ? n(bestV.damage) : '—'} | ` +
            `${searchOrder.map(short).join(' > ')} | ${rankCounts ? n(price(rankCounts).damage) : 'over the cap'} |`,
        );
      }
    }
    report.save();
  }, 1_800_000);
});
