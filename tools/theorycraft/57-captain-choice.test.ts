/**
 * 57 — which captain to bring (owner, 2026-09-14): he holds Aydae (level 37, ★3) and Leonidas (level 35).
 *
 * The report that fixes this account's bonuses was fought with Aydae marching, so scenario C *contains* her
 * contribution and it has to be taken back out before any captain can be compared. The game's own captain
 * table gives each of them a key and a curve (src/data/tables/captains.json):
 *
 *   Aydae    — guardsmen: health +1 a level + stars [0,0,15,15,45,45,105],
 *                        strength +1 a level + stars [0,15,15,45,45,105,105]
 *   Leonidas — melee:     health +1 a level + stars [0,0,40,40,120,120,280],
 *                        strength +2 a level + stars [0,40,40,120,120,280,280]
 *
 * Aydae at 37 ★3 is therefore guardsmen +52 / +82 — which is exactly the "Aydae's +52 / +82" that 0015
 * derived from the report independently, and the script asserts it. So the account's own (captain-less)
 * bonuses are guardsmen +107 / +107, and every option below is that base plus one captain.
 *
 * Scored on the plan of file 56 (3 identical marches plus a final march of the leftovers), with the engine.
 * `THEORY=1 pnpm vitest run tools/theorycraft/57-captain-choice.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import type { BonusTotals, ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, evaluateCounts, label, loadOwner, n, withCaps, withHousing, withUnits } from './harness';

/** The account's bonuses with no captain: scenario C minus Aydae's guardsmen +52 / +82. */
const BASE: ResolvedSource = {
  id: 'account-no-captain',
  label: 'the account with no captain',
  kind: 'custom',
  health: { guardsmen: 107, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 107, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
const AYDAE: ResolvedSource = {
  id: 'aydae-37-3',
  label: 'Aydae 37 ★3',
  kind: 'captain',
  health: { guardsmen: 52 },
  strength: { guardsmen: 82 },
};
interface CaptainRow {
  id: string;
  name: string;
  health?: { key: string; perLevel: number; stars: number[] };
  strength?: { key: string; perLevel: number; stars: number[] };
}
const CAPTAINS = JSON.parse(readFileSync('src/data/tables/captains.json', 'utf8')) as CaptainRow[];

/** A captain at a given level and star rating, from the game's own curve. */
const captainAt = (id: string, level: number, stars: number): ResolvedSource => {
  const row = CAPTAINS.find((c) => c.id === id);
  if (!row) throw new Error(`no captain ${id}`);
  const source: ResolvedSource = {
    id: `${id}-${level}-${stars}`,
    label: `${row.name} ${level} ★${stars}`,
    kind: 'captain',
  };
  if (row.health)
    source.health = { [row.health.key]: level * row.health.perLevel + (row.health.stars[stars] ?? 0) };
  if (row.strength)
    source.strength = {
      [row.strength.key]: level * row.strength.perLevel + (row.strength.stars[stars] ?? 0),
    };
  return source;
};

/** The troops that carry each key, so the reader can see who a captain actually buffs. */

/** The plan of file 56: three identical marches, then the final march with everything left over. */
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
  'epic-monster-hunter-6': 9,
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

describe.skipIf(!process.env.THEORY)(
  'the captain',
  () => {
    it('prices Aydae against Leonidas on the plan', () => {
      const report = new Report('57-captain-choice');
      const owner = loadOwner();
      const housing = { leadership: 4_400, authority: 2_180 };

      const totals = (sources: ResolvedSource[]): BonusTotals => aggregateBonuses(sources);
      const withAydae = totals([BASE, AYDAE]);
      report.add(
        `base (no captain): guardsmen ${BASE.health?.guardsmen} health / ${BASE.strength?.guardsmen} strength · ` +
          `with Aydae 37 ★3: guardsmen ${withAydae.health.guardsmen} health / ${withAydae.strength.guardsmen} strength — ` +
          `the 159 / 189 the 2026-09-14 report fixes, so the base is right.`,
      );

      const eval_ = (counts: Record<string, number>, t: BonusTotals): number => {
        const req: StackRequest = withCaps(withHousing({ ...owner.twelve, totals: t }, housing), counts);
        const ids = Object.keys(counts);
        const ev = evaluateCounts(withUnits(req, ids), counts);
        return ev.summary.avgDamage;
      };

      const options: { name: string; totals: BonusTotals }[] = [
        { name: 'no captain at all', totals: totals([BASE]) },
        { name: 'Aydae 37 ★3 (the one in the report)', totals: totals([BASE, AYDAE]) },
        ...Array.from({ length: 7 }, (_x, stars) => ({
          name: `Leonidas 35 ★${stars}`,
          totals: totals([BASE, captainAt('leonidas', 35, stars)]),
        })),
        ...(['skadi', 'heimdall', 'beowulf', 'amanitore'] as const).flatMap((id) =>
          (
            [
              [35, 0],
              [37, 3],
            ] as const
          ).map(([level, stars]) => ({
            name: `${CAPTAINS.find((c) => c.id === id)?.name} ${level} ★${stars}`,
            totals: totals([BASE, captainAt(id, level, stars)]),
          })),
        ),
      ];

      report.h('The plan (3 uniform marches + the final march), scored under each captain');
      report.add(
        '| captain | uniform march | final march | **total over the plan** | against Aydae |\n|---|---|---|---|---|',
      );
      const rows = options.map((option) => {
        const uniform = eval_(UNIFORM, option.totals);
        const finale = eval_(FINALE, option.totals);
        return { name: option.name, uniform, finale, total: 3 * uniform + finale };
      });
      const aydae = rows[1]?.total ?? 0;
      for (const row of rows) {
        const delta = row.total - aydae;
        report.add(
          `| ${row.name} | ${n(row.uniform)} | ${n(row.finale)} | **${n(row.total)}** | ${row.name.startsWith('Aydae') ? '—' : `${delta >= 0 ? '+' : ''}${n(delta)}`} |`,
        );
      }

      // Which units actually take each captain's bonus, from the engine's own stack list.
      report.h('Who each captain actually buffs in this march');
      const baseReq = withCaps(withHousing({ ...owner.twelve, totals: totals([BASE]) }, housing), UNIFORM);
      const stacks = evaluateCounts(withUnits(baseReq, Object.keys(UNIFORM)), UNIFORM).result.stacks;
      const keysOf = (id: string): string[] => owner.twelve.units.find((u) => u.id === id)?.keys ?? [];
      report.add(
        stacks.map((s) => `${label(s.unitId)} ${n(s.count)} [${keysOf(s.unitId).join(',')}]`).join(' · '),
      );
      const guardsmen = stacks
        .filter((s) => keysOf(s.unitId).includes('guardsmen'))
        .reduce((sum, s) => sum + s.count, 0);
      const melee = stacks
        .filter((s) => keysOf(s.unitId).includes('melee'))
        .reduce((sum, s) => sum + s.count, 0);
      const total = stacks.reduce((sum, s) => sum + s.count, 0);
      report.add(
        `\nunits in the uniform march: ${n(total)} total · ${n(guardsmen)} carry the guardsmen key (${((100 * guardsmen) / total).toFixed(0)} %) · ` +
          `${n(melee)} carry melee (${((100 * melee) / total).toFixed(0)} %)`,
      );
      // Every captain the game ships, at a common ceiling (level 40 ★6) — what would beat her.
      report.h('Every captain in the game at level 40 ★6, on this same plan');
      const table = JSON.parse(readFileSync('src/data/tables/captains.json', 'utf8')) as {
        id: string;
        name: string;
        health?: { key: string; perLevel: number; stars: number[] };
        strength?: { key: string; perLevel: number; stars: number[] };
      }[];
      const ranked: { name: string; total: number }[] = [];
      for (const captain of table) {
        if (!captain.health && !captain.strength) continue;
        const src: ResolvedSource = { id: captain.id, label: `${captain.name} 40 ★6`, kind: 'captain' };
        if (captain.health)
          src.health = {
            [captain.health.key]: 40 * captain.health.perLevel + (captain.health.stars[6] ?? 0),
          };
        if (captain.strength)
          src.strength = {
            [captain.strength.key]: 40 * captain.strength.perLevel + (captain.strength.stars[6] ?? 0),
          };
        const t = totals([BASE, src]);
        ranked.push({
          name: `${captain.name} (${[captain.health?.key, captain.strength?.key].filter(Boolean).join('/')})`,
          total: 3 * eval_(UNIFORM, t) + eval_(FINALE, t),
        });
      }
      ranked.sort((a, b) => b.total - a.total);
      const best = ranked[0]?.total ?? 0;
      report.add('| captain | total over the plan | vs the best | vs Aydae 37 ★3 |\n|---|---|---|---|');
      for (const row of ranked.slice(0, 10)) {
        report.add(
          `| ${row.name} | ${n(row.total)} | ${n(row.total - best)} | ${row.total - aydae >= 0 ? '+' : ''}${n(row.total - aydae)} |`,
        );
      }
      report.add(
        `\n(rated at the ceiling the game allows, level 40 ★6, so the list shows what is worth chasing — not what the owner holds today.)`,
      );
      report.save();

      // Aydae 37 ★3 must reproduce the report's own guardsmen figures.
      expect(withAydae.health.guardsmen).toBe(159);
      expect(withAydae.strength.guardsmen).toBe(189);
    });
  },
  300_000,
);
