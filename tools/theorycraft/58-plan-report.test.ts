/**
 * 58 — the in-game report of the recommended plan (owner, 2026-09-14 04:39, five screenshots, English UI).
 *
 * The march is file 56's uniform march, played exactly: SP2 226 · RD1 202 · RD3 63 · ARC2 222 · ARC1 399 ·
 * RD2 111 · ABT6 10 · LGN6 10 · CHR6 5 · EMH6 10 — the one change from the computed plan is EMH6 at 10
 * instead of 9. Four enemy squads (ogre III, fire woman V, molten giant III, flyer V), 24 journal entries:
 * 14 of ours, 10 enemy kills, all ten stacks lost.
 *
 * The fight's own bonuses are fitted from its lines here (not taken from the earlier report): the enemy line
 * is the stack's effective HP, and our friendly line is base + features, so
 *   SP2 226 → 158,041 = 226 × 270 × 2.590   → guardsmen health ×2.590
 *   ARC2 222 → 155,544 = 222 × 270 × 2.595  → ranged ×2.595
 *   RD3 63 → 87,494 incl. 29,434 (SA 146)   → guardsmen strength +188
 *   ARC2 222 → 77,922 incl. 20,180 (SA 101) → ranged strength +189
 * i.e. the same structure as the 00:41 report, two points lower on both.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/58-plan-report.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
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

/** The march as it was actually marched. */
const MARCH: Record<string, number> = {
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

/** The journal, in order: actor, our squad, the damage as printed, and the features part when shown. */
const JOURNAL: { actor: 'army' | 'enemy'; unit: string; damage: number; extra?: number }[] = [
  { actor: 'enemy', unit: 'spearman-2', damage: 158_041 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 181_888, extra: 123_627 },
  { actor: 'enemy', unit: 'rider-1', damage: 156_954 },
  { actor: 'army', unit: 'rider-3', damage: 87_494, extra: 29_434 },
  { actor: 'enemy', unit: 'rider-3', damage: 156_643 },
  { actor: 'army', unit: 'archer-2', damage: 77_922, extra: 20_180 },
  { actor: 'enemy', unit: 'epic-monster-hunter-6', damage: 156_513 },
  { actor: 'army', unit: 'archer-1', damage: 71_022, extra: 13_367 },
  { actor: 'army', unit: 'rider-2', damage: 77_122, extra: 19_580 },
  { actor: 'army', unit: 'arbalester-6', damage: 151_620, extra: 96_710 },
  { actor: 'army', unit: 'legionary-6', damage: 110_770, extra: 56_050 },
  { actor: 'army', unit: 'chariot-6', damage: 148_390, extra: 93_670 },
  { actor: 'enemy', unit: 'archer-2', damage: 155_544 },
  { actor: 'army', unit: 'archer-1', damage: 71_022, extra: 13_367 },
  { actor: 'enemy', unit: 'archer-1', damage: 155_310 },
  { actor: 'army', unit: 'rider-2', damage: 77_122, extra: 19_580 },
  { actor: 'enemy', unit: 'rider-2', damage: 155_244 },
  { actor: 'army', unit: 'arbalester-6', damage: 151_620, extra: 96_710 },
  { actor: 'enemy', unit: 'legionary-6', damage: 147_914, extra: 52_485 },
  { actor: 'army', unit: 'chariot-6', damage: 296_780, extra: 187_340 }, // double damage
  { actor: 'army', unit: 'legionary-6', damage: 110_770, extra: 56_050 },
  { actor: 'enemy', unit: 'chariot-6', damage: 147_630, extra: 63_270 },
  { actor: 'army', unit: 'legionary-6', damage: 110_770, extra: 56_050 },
  { actor: 'enemy', unit: 'arbalester-6', damage: 147_630, extra: 60_788 },
];

describe.skipIf(!process.env.THEORY)(
  'the plan in the field',
  () => {
    it('replays the 04:39 report', () => {
      const report = new Report('58-plan-report');
      const owner = loadOwner();

      const source: ResolvedSource = {
        id: 'report-2026-09-14-0439',
        label: 'bonuses fitted from the 04:39 report',
        kind: 'custom',
        health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
        strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
        special: { doubleDamageChance: 3 },
      };
      const totals = aggregateBonuses([source]);
      report.add(
        `fitted from this report with the same structure as the 00:41 one: guardsmen +157 / +187 plus a category top-up of +2 health / +1 strength ` +
          `(ranged +2.5 / +2). The troops read +159 / +188 and the category-less EMH VI +157 / +187 — which is the buff the owner says he has.`,
      );

      const req: StackRequest = withCaps(
        withHousing({ ...owner.twelve, totals }, { leadership: 4_400, authority: 2_180 }),
        MARCH,
      );
      const ev = evaluateCounts(withUnits(req, Object.keys(MARCH)), MARCH);

      report.h('The engine against the game, entry by entry');
      report.add('| # | report | engine | printed | engine | Δ |\n|---|---|---|---|---|---|');
      const journal = ev.summary.journals.enemyFirst.entries;
      let mismatches = 0;
      let exact = 0;
      JOURNAL.forEach((line, index) => {
        const entry = journal[index];
        const who = entry ? `${entry.actor === 'army' ? '' : 'E>'}${label(entry.unitId)}` : '—';
        const expected = `${line.actor === 'army' ? '' : 'E>'}${label(line.unit)}`;
        if (!entry || entry.actor !== line.actor || entry.unitId !== line.unit) mismatches += 1;
        // entry 20 is the proc: the game printed twice the line
        const plain = index === 19 ? line.damage / 2 : line.damage;
        const engineDamage = entry?.damage ?? 0;
        if (plain === engineDamage) exact += 1;
        report.add(
          `| ${index + 1} | ${expected} | ${who} | ${n(line.damage)} | ${n(engineDamage)} | ${engineDamage - plain >= 0 ? '+' : ''}${n(engineDamage - plain)} |`,
        );
      });
      report.add(
        `\nentries: report ${JOURNAL.length}, engine ${journal.length}, sequence mismatches ${mismatches}, damage lines identical ${exact}/${JOURNAL.length}`,
      );

      // The damage each stack landed, report against engine.
      report.h('Strikes per stack, report against engine');
      const ls = lines(ev);
      const printed = new Map<string, { hits: number; damage: number }>();
      for (const line of JOURNAL.filter((l) => l.actor === 'army')) {
        const cur = printed.get(line.unit) ?? { hits: 0, damage: 0 };
        cur.hits += 1;
        cur.damage += line.damage;
        printed.set(line.unit, cur);
      }
      report.add(
        '| stack | report strikes | engine strikes (enemy first) | report damage | engine damage |\n|---|---|---|---|---|',
      );
      for (const row of ls) {
        const p = printed.get(row.unitId) ?? { hits: 0, damage: 0 };
        report.add(
          `| ${row.label} | ${p.hits} | ${row.hitsEnemyFirst} | ${n(p.damage)} | ${n(row.damageEnemyFirst)} |`,
        );
      }
      const printedTotal = JOURNAL.filter((l) => l.actor === 'army').reduce((sum, l) => sum + l.damage, 0);
      report.add(
        `\nreport total, proc at its printed value: ${n(printedTotal)} · report total with the proc halved: ${n(printedTotal - 148_390)} · ` +
          `engine min ${n(ev.summary.minDamage)} / avg ${n(ev.summary.avgDamage)} / max ${n(ev.summary.maxDamage)}`,
      );
      report.add(
        `the plan predicted avg ${n(1_815_924)} for this march — the game's realised damage is ${n(printedTotal - 148_390)} before the proc, ` +
          `${n(printedTotal)} with it.`,
      );
      report.save();
    });
  },
  300_000,
);
