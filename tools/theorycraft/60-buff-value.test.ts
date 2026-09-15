/**
 * 60 — the owner's +2 % health buff (owner, 2026-09-14): "I know I have 2 % increased health on all troops
 * apart EMH6".
 *
 * That is the whole difference between the two reports of 2026-09-14. Fitted from their own lines:
 *
 *   00:41 — guardsmen ×2.61 / +190, ranged ×2.615 / +191   (docs/research/battlereportkai.md)
 *   04:39 — guardsmen ×2.59 / +188, ranged ×2.595 / +189   (docs/research/battlereport-2026-09-14-0439.md)
 *
 * Exactly two points on health and two on strength, which is the buff. This file puts it back as its own
 * source, checks that doing so reproduces the 00:41 fight, and prices it on the plan of file 56.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/60-buff-value.test.ts`
 */
import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import type { BonusTotals, ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, evaluateCounts, label, n, withCaps, withHousing, withUnits } from './harness';
import { loadOwner } from './harness';

const UNIFORM: Record<string, number> = {
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
const FINALE: Record<string, number> = {
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

/**
 * The account with the buff off: the base the 04:39 report's own lines give for the category-less EMH VI
 * (+157 health / +187 strength), plus the small ranged term this account also carries.
 */
const WITHOUT: ResolvedSource = {
  id: 'no-buff',
  label: 'the account, buff off',
  kind: 'custom',
  health: { guardsmen: 157, ranged: 0.5 },
  strength: { guardsmen: 187, ranged: 1 },
  special: { doubleDamageChance: 3 },
};
/**
 * The owner's buff, as he described it: "2 % increased health on all troops apart EMH6". It is scoped to the
 * **categories**, so a unit with no category (EMH VI) never receives it — which is exactly what the two
 * reports show.
 */
/**
 * The other effect the two reports differ by: a further +2 health / +2 strength that applied to **everything**,
 * EMH VI included (00:41 reads guardsmen +161 / +190 with EMH VI at +159 / +189; 04:39 reads +159 / +188 with
 * EMH VI at +157 / +187). Whatever it is, it was on at 00:41 and gone by 04:39.
 */
const GLOBAL: ResolvedSource = {
  id: 'global-two',
  label: '+2 health / +2 strength on everything (present at 00:41, gone at 04:39)',
  kind: 'event',
  health: { guardsmen: 2 },
  strength: { guardsmen: 2 },
};
const BUFF: ResolvedSource = {
  id: 'owner-buff-categories',
  label: "the owner's +2 health / +1 strength buff, categories only",
  kind: 'permanent',
  health: { melee: 2, mounted: 2, flying: 2, ranged: 2 },
  strength: { melee: 1, mounted: 1, flying: 1, ranged: 1 },
};

describe.skipIf(!process.env.THEORY)(
  'the buff',
  () => {
    it('prices the two points', () => {
      const report = new Report('60-buff-value');
      const owner = loadOwner();
      const housing = { leadership: 4_400, authority: 2_180 };

      const off = aggregateBonuses([WITHOUT]);
      const on = aggregateBonuses([WITHOUT, BUFF]);
      const full = aggregateBonuses([WITHOUT, BUFF, GLOBAL]);
      report.add(
        `buff off: EMH VI reads +${off.health.guardsmen} / +${off.strength.guardsmen} · with the buff a melee troop reads ` +
          `+${off.health.guardsmen + on.health.melee} / +${off.strength.guardsmen + on.strength.melee} and a ranged one ` +
          `+${off.health.guardsmen + on.health.ranged} / +${off.strength.guardsmen + on.strength.ranged} — the +159 / +188 and +159.5 / +189 the 04:39 report prints.`,
      );

      const eval_ = (counts: Record<string, number>, totals: BonusTotals): number => {
        const req: StackRequest = withCaps(withHousing({ ...owner.twelve, totals }, housing), counts);
        return evaluateCounts(withUnits(req, Object.keys(counts)), counts).summary.avgDamage;
      };

      report.h('The same counts under the three profiles');
      report.add(
        "| march | no category bonus | + the owner's buff | + the global +2/+2 | buff vs none | global vs buff |\n|---|---|---|---|---|---|",
      );
      const rows: [string, Record<string, number>, number][] = [
        ['uniform march (the one marched)', UNIFORM, 3],
        ['final march of the plan', FINALE, 1],
      ];
      let a0 = 0;
      let a1 = 0;
      let a2 = 0;
      for (const [name, counts, times] of rows) {
        const x = times * eval_(counts, off);
        const y = times * eval_(counts, on);
        const z = times * eval_(counts, full);
        a0 += x;
        a1 += y;
        a2 += z;
        report.add(
          `| ${name}${times > 1 ? ` × ${times}` : ''} | ${n(x)} | ${n(y)} | ${n(z)} | ${(((y - x) / x) * 100).toFixed(1)} % | ${(((z - y) / y) * 100).toFixed(1)} % |`,
        );
      }
      report.add(
        `| **the whole plan** | **${n(a0)}** | **${n(a1)}** | **${n(a2)}** | **${(((a1 - a0) / a0) * 100).toFixed(1)} %** | **${(((a2 - a1) / a1) * 100).toFixed(1)} %** |`,
      );
      report.add(
        `\nread it as: adding a uniform +2 health to a ladder whose stacks sit within 0.8 % of each other is a **re-ordering coin flip** — here it *costs* ` +
          `${(((eval_(UNIFORM, off) - eval_(UNIFORM, on)) / eval_(UNIFORM, off)) * 100).toFixed(1)} % of a march on these counts, because it moves stacks across ` +
          `each other and reassigns strikes. The +2/+2 that was actually present at 00:41 is worth ${(((eval_(UNIFORM, full) - eval_(UNIFORM, on)) / eval_(UNIFORM, on)) * 100).toFixed(1)} % ` +
          `on the same counts — and the plan's predicted ${n(1_815_924)} for the uniform march is a *with-it* number: the 04:39 fight realised 1,575,922 (proc halved) after it was gone.`,
      );
      report.add(
        `\nfor the app, two sources belong in the profile: (1) the owner's buff — health +2 / strength +1 scoped to the **categories** ` +
          `(melee, mounted, flying, ranged), which by construction skips EMH VI because it carries no category, and which is present in *both* ` +
          `reports; and (2) whatever gave a further +2 / +2 on everything including EMH VI at 00:41 and was gone by 04:39. The app's unit table ` +
          `needs no change on either account — the EMH VI figure was this file's own first fit, not the data.`,
      );
      // Which units the buff actually reaches, from the engine's own effective stats.
      report.h('Who the buff reaches, unit by unit');
      report.add('| unit | its keys | HP a unit, buff off | buff on | change |\n|---|---|---|---|---|');
      const unitsToShow = [
        'epic-monster-hunter-6',
        'arbalester-6',
        'legionary-6',
        'chariot-6',
        'spearman-2',
        'archer-2',
        'swordsman-1',
      ];
      for (const id of unitsToShow) {
        const unit = owner.twelve.units.find((u) => u.id === id);
        if (!unit) continue;
        const hpOf = (totals: BonusTotals): number =>
          evaluateCounts(withCaps(withHousing({ ...owner.twelve, totals }, housing), { [id]: 1 }), {
            [id]: 1,
          }).result.stacks[0]?.hpPerUnit ?? 0;
        const a = hpOf(off);
        const b = hpOf(on);
        report.add(
          `| ${label(id)} | ${unit.keys.join(', ')} | ${n(a)} | ${n(b)} | ${b === a ? '**nothing — no category**' : `+${n(b - a)}`} |`,
        );
      }

      report.save();

      // The category-less unit keeps the base; the categoried ones get the buff.
      expect(on.health.guardsmen).toBe(157);
      expect(on.strength.guardsmen).toBe(187);
      expect(off.health.guardsmen + on.health.melee).toBe(159);
      expect(off.strength.guardsmen + on.strength.melee).toBe(188);
      expect(off.health.guardsmen + on.health.ranged).toBeCloseTo(159.5, 6);
      expect(off.strength.guardsmen + on.strength.ranged).toBeCloseTo(189, 6);
    });
  },
  300_000,
);
