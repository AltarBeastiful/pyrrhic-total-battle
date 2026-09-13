/**
 * E0b — the in-game battle report of Kai's march (sent by the owner 2026-09-14, 30 entries, army first,
 * 4 enemy squads) replayed by the engine. `THEORY=1 pnpm vitest run tools/theorycraft/02-kai-report.test.ts`
 *
 * What the report's own lines give us (enemy line = stack HP; friendly line = base + extra):
 *   SP1 855 → 334,732 = 855 × 150 × 2.61      → guardsmen melee health ×2.61
 *   ARC1 837 → 328,313 = 837 × 150 × 2.615    → ranged ×2.615
 *   EMH6 16 → 252,369 = 16 × 6,090 × 2.59     → no category: guardsmen ×2.59
 *   SP1 base 123,975 = 855 × 50 × 2.90; ARC1 121,783 = 837 × 50 × 2.91; EMH6 93,867 = 32,480 × 2.89
 * i.e. guardsmen +159 health / +189 strength, plus a category bonus of +2 / +1 (ranged +2.5 / +2), and
 * the extras are exactly the units' strength-against on the base strength (SP1 39 %, RD1 65 %, ARC1 67 %,
 * RD3 146 %, ABT6 flying 509 %, LGN6 mounted 295 %, EMH6 609 %, CHR6 ranged 493 %).
 */
import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import type { ResolvedSource } from '../../src/engine/types';
import { Report, evaluateCounts, label, loadOwner, n, table, withUnits } from './harness';

const KAI: Record<string, number> = {
  'spearman-1': 855,
  'rider-1': 423,
  'archer-1': 837,
  'spearman-2': 451,
  'rider-2': 223,
  'archer-2': 440,
  'rider-3': 116,
  'arbalester-6': 18,
  'legionary-6': 18,
  'epic-monster-hunter-6': 16,
  'chariot-6': 8,
};

/** The report, transcribed: actor, our stack, damage as printed (entry 11 is a double-damage line). */
const REPORT: { actor: 'army' | 'enemy'; unit: string; damage: number; extra?: number }[] = [
  { actor: 'army', unit: 'spearman-1', damage: 140_647, extra: 16_672 },
  { actor: 'enemy', unit: 'spearman-1', damage: 334_732 },
  { actor: 'army', unit: 'rider-1', damage: 150_165, extra: 27_495 },
  { actor: 'enemy', unit: 'rider-1', damage: 331_209 },
  { actor: 'army', unit: 'archer-1', damage: 149_823, extra: 28_040 },
  { actor: 'enemy', unit: 'archer-1', damage: 328_313 },
  { actor: 'army', unit: 'spearman-2', damage: 141_659, extra: 23_948 },
  { actor: 'enemy', unit: 'spearman-2', damage: 317_819 },
  { actor: 'army', unit: 'rider-2', damage: 155_743, extra: 39_337 },
  { actor: 'army', unit: 'archer-2', damage: 155_232, extra: 39_996 },
  { actor: 'army', unit: 'rider-3', damage: 323_686, extra: 108_390 }, // double damage
  { actor: 'army', unit: 'arbalester-6', damage: 273_600, extra: 174_078 },
  { actor: 'army', unit: 'legionary-6', damage: 200_070, extra: 100_890 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 291_670, extra: 197_803 },
  { actor: 'army', unit: 'chariot-6', damage: 238_032, extra: 149_872 },
  { actor: 'enemy', unit: 'rider-2', damage: 314_296 },
  { actor: 'army', unit: 'archer-2', damage: 155_232, extra: 39_996 },
  { actor: 'enemy', unit: 'archer-2', damage: 310_662 },
  { actor: 'army', unit: 'rider-3', damage: 161_843, extra: 54_195 },
  { actor: 'enemy', unit: 'rider-3', damage: 290_649 },
  { actor: 'army', unit: 'arbalester-6', damage: 273_600, extra: 174_078 },
  { actor: 'enemy', unit: 'arbalester-6', damage: 268_299 },
  { actor: 'army', unit: 'legionary-6', damage: 200_070, extra: 100_890 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 291_670, extra: 197_803 },
  { actor: 'army', unit: 'chariot-6', damage: 238_032, extra: 149_872 },
  { actor: 'enemy', unit: 'legionary-6', damage: 267_786 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 291_670, extra: 197_803 },
  { actor: 'enemy', unit: 'epic-monster-hunter-6', damage: 252_369 },
  { actor: 'army', unit: 'chariot-6', damage: 238_032, extra: 149_872 },
  { actor: 'enemy', unit: 'chariot-6', damage: 238_032 },
];

/** Scenario C: the bonuses this report was fought with. */
export function kaiReportTotals() {
  const source: ResolvedSource = {
    id: 'kai-report-2026-09-14',
    label: "bonuses as in Kai's march report",
    kind: 'custom',
    health: { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
    strength: { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
    special: { doubleDamageChance: 3 },
  };
  return aggregateBonuses([source]);
}

describe.skipIf(!process.env.THEORY)("E0b Kai's report", () => {
  it('is reproduced entry for entry', () => {
    const report = new Report('02-kai-report');
    const owner = loadOwner();
    const req = withUnits({ ...owner.twelve, totals: kaiReportTotals() }, Object.keys(KAI));
    const ev = evaluateCounts(req, KAI);
    report.add(
      "Kai's march as fought (army first, 4 squads), engine with the bonuses the report implies (guardsmen +159 / +189, category +2 / +1, ranged +2.5 / +2):",
    );
    report.add(table(ev));

    const journal = ev.summary.journals.armyFirst.entries;
    const rows = ['| # | report | engine | report dmg | engine dmg | Δ |', '|---|---|---|---|---|---|'];
    let printed = 0;
    let modelled = 0;
    let mismatches = 0;
    REPORT.forEach((line, index) => {
      const entry = journal[index];
      const who = entry ? `${entry.actor === 'army' ? '' : 'E>'}${label(entry.unitId)}` : '—';
      const expected = `${line.actor === 'army' ? '' : 'E>'}${label(line.unit)}`;
      if (!entry || entry.actor !== line.actor || entry.unitId !== line.unit) mismatches += 1;
      const engineDamage = entry?.damage ?? 0;
      // Entry 11 is a proc: the game printed twice the line; the engine prints the plain line.
      const reportPlain = index === 10 ? line.damage / 2 : line.damage;
      if (line.actor === 'army') {
        printed += line.damage;
        modelled += engineDamage;
      }
      rows.push(
        `| ${index + 1} | ${expected} | ${who} | ${n(line.damage)} | ${n(engineDamage)} | ${n(engineDamage - reportPlain)} |`,
      );
    });
    report.add(rows.join('\n'));
    report.add(
      `\nentries: report ${REPORT.length}, engine ${journal.length}, actor/stack mismatches ${mismatches}`,
    );
    report.add(
      `friendly damage: report as printed ${n(printed)} (one double-damage line, +161,843); report without the proc ${n(printed - 161_843)}; engine army-first maximum ${n(ev.summary.maxDamage)} (${n(modelled)} summed over the same 19 lines)`,
    );
    report.add(`hits per stack, report vs engine: ${ev.result.stacks.map((s) => label(s.unitId)).join(' ')}`);
    report.save();

    expect(journal).toHaveLength(REPORT.length);
    expect(mismatches).toBe(0);
  });
});
