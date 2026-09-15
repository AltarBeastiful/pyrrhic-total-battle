/**
 * 62 — the in-game report of the *updated* plan (owner, 2026-09-14 05:17, five screenshots, English UI).
 *
 * The march is file 61's, played to the unit: SP1 486 · SP2 269 · RD3 75 · RD1 240 · RD2 133 · ARC2 264 ·
 * ARC1 475 · ABT6 10 · LGN6 10 · CHR6 5 · EMH6 9. 27 journal entries, 16 of ours and 11 enemy kills — every
 * stack lost. The fight's own lines give the same profile as 04:39 (guardsmen +159 / +188 on the categoried
 * units, EMH VI at the base +157 / +187), so the extra +2/+2 was absent again.
 *
 * (File 58 holds the earlier report of the previous plan.)
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
  'spearman-1': 486,
  'spearman-2': 269,
  'rider-3': 75,
  'rider-1': 240,
  'rider-2': 133,
  'archer-2': 264,
  'archer-1': 475,
  'arbalester-6': 10,
  'legionary-6': 10,
  'chariot-6': 5,
  'epic-monster-hunter-6': 9,
};

/** The journal, in order: actor, our squad, the damage as printed, and the features part when shown. */
const JOURNAL: { actor: 'army' | 'enemy'; unit: string; damage: number; extra?: number }[] = [
  { actor: 'enemy', unit: 'spearman-1', damage: 188_811 },
  { actor: 'army', unit: 'spearman-2', damage: 86_187, extra: 14_284 },
  { actor: 'enemy', unit: 'spearman-2', damage: 188_111, extra: 77_457 },
  { actor: 'army', unit: 'rider-3', damage: 105_360, extra: 35_040 },
  { actor: 'enemy', unit: 'rider-1', damage: 186_480 },
  { actor: 'army', unit: 'rider-2', damage: 93_605 },
  { actor: 'enemy', unit: 'rider-3', damage: 186_479 },
  { actor: 'army', unit: 'archer-2', damage: 93_376, extra: 23_997 },
  { actor: 'army', unit: 'archer-1', damage: 85_262, extra: 15_912 },
  { actor: 'army', unit: 'legionary-6', damage: 112_480, extra: 56_050 },
  { actor: 'army', unit: 'chariot-6', damage: 149_340, extra: 93_670 },
  { actor: 'army', unit: 'arbalester-6', damage: 152_190, extra: 96_710 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 327_398, extra: 222_530 }, // double damage
  { actor: 'enemy', unit: 'rider-2', damage: 186_013, extra: 79_719 },
  { actor: 'army', unit: 'archer-2', damage: 93_376, extra: 23_997 },
  { actor: 'enemy', unit: 'archer-2', damage: 184_971 },
  { actor: 'army', unit: 'archer-1', damage: 85_262, extra: 15_912 },
  { actor: 'enemy', unit: 'archer-1', damage: 184_893 },
  { actor: 'army', unit: 'legionary-6', damage: 112_480, extra: 56_050 },
  { actor: 'enemy', unit: 'legionary-6', damage: 147_914, extra: 52_485 },
  { actor: 'army', unit: 'chariot-6', damage: 149_340, extra: 93_670 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 163_699, extra: 111_265 },
  { actor: 'enemy', unit: 'arbalester-6', damage: 147_630 },
  { actor: 'army', unit: 'chariot-6', damage: 149_340, extra: 93_670 },
  { actor: 'enemy', unit: 'chariot-6', damage: 147_630 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 163_699, extra: 111_265 },
  { actor: 'enemy', unit: 'epic-monster-hunter-6', damage: 140_861 },
];

describe.skipIf(!process.env.THEORY)(
  'the plan in the field',
  () => {
    it('replays the 04:39 report', () => {
      const report = new Report('62-plan-report-0517');
      const owner = loadOwner();

      const source: ResolvedSource = {
        id: 'report-2026-09-14-0517',
        label: 'bonuses fitted from the 05:17 report',
        kind: 'custom',
        health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
        strength: { guardsmen: 193, melee: 4, mounted: 0, flying: 0, ranged: -1 },
        special: { doubleDamageChance: 3 },
      };
      const totals = aggregateBonuses([source]);
      report.add(
        `fitted from this fight's own lines, per unit type, because the strength had moved again: ` +
          `SP2 269 → 86,187 incl. 14,284 (SA 59) → melee strength +197; RD3 75 → 105,360 incl. 35,040 (SA 146) → mounted +193; ` +
          `ARC2 264 → 93,376 incl. 23,997 (SA 101) → ranged +192; EMH VI 9 → 163,699 incl. 111,265 (SA 609) → +187. ` +
          `Health is the 04:39 one (+157 base, +2 on the categories, +2.5 ranged).`,
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
        const plain = index === 12 ? line.damage / 2 : line.damage;
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
        `\nreport total, proc at its printed value: ${n(printedTotal)} · report total with the proc halved: ${n(printedTotal - 163_699)} · ` +
          `engine min ${n(ev.summary.minDamage)} / avg ${n(ev.summary.avgDamage)} / max ${n(ev.summary.maxDamage)}`,
      );
      report.add(
        `file 61 predicted avg ${n(2_228_327)} for this march (min 2,188,353 / max 2,268,300) with the extra +2/+2 and ${n(2_220_503)} without it — ` +
          `the game's realised damage is ${n(printedTotal - 163_699)} before the proc, ${n(printedTotal)} with it.`,
      );
      report.save();
    });
  },
  300_000,
);
