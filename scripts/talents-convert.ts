/**
 * Reshapes the recon dump of the game's talents (`talents.json`, 45 MB) into `src/data/tables/talents.json`.
 *
 * Only the four hero-ability trees are kept (branches 18 to 21). Research trees, clan talents and any node
 * with no place on a hero tree's grid are left out. The game's learn conditions are decoded here, once:
 * "holds a rank in node P" becomes `parents`, "hero level at least L" becomes `levelGate`; the rule that
 * rank n needs rank n - 1 is the game's and is checked, not stored. Anything the decoder does not
 * understand throws, so a changed game cannot slip through as a wrong table.
 *
 * Run it with `pnpm data:talents <path to talents.json>`, or set `TALENTS_DUMP` to the path (the test that rebuilds the
 * whole table from the dump reads the same variable, and is skipped without it).
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalText, TABLES_DIR } from './data-tables.ts';
import type { TalentRecord, TalentTree } from '../src/data/types.ts';

/** The dump named by the environment, or null. */
export const DUMP_SOURCE: string | null = process.env['TALENTS_DUMP'] ?? null;

/** Branch id in the dump to the tree it is. */
const TREE_OF_BRANCH: Record<number, TalentTree> = {
  18: 'battle',
  19: 'expert',
  20: 'economy',
  21: 'archeology',
};

interface Call {
  fn: string;
  args: number[];
}
interface Coeff {
  typeName: string;
  affectedIds: number[];
  A: number;
  B: number;
  C: number;
}
interface Level {
  level: number;
  learnGuard: { calls: Call[] };
  effect: { coeffs: Coeff[] };
  instantPrice: { resource: number; amount: number }[];
}
interface Tech {
  id: number;
  name: string;
  branchId: number;
  maxLevel: number;
  layout: { x: number; y: number; linkType: string; linkPlace: string; linkFlipped: string } | null;
  levels: Level[];
}
export interface TalentDump {
  branches: { id: number; type: string | null; techs: Tech[] }[];
}

const TALENT_POINT_RESOURCE = 17;

function fail(tech: Tech, why: string): never {
  throw new Error(`talent ${tech.id} (${tech.name}): ${why}`);
}

function convertTech(tech: Tech, tree: TalentTree): TalentRecord {
  const { layout } = tech;
  if (layout === null) return fail(tech, 'has no layout');
  if (tech.levels.length !== tech.maxLevel) fail(tech, 'level list and maxLevel disagree');

  const first = tech.levels[0];
  if (first === undefined) return fail(tech, 'has no level');
  const parents = new Set<number>();
  let levelGate: number | undefined;
  for (const call of first.learnGuard.calls) {
    const [a = 0, b = 0, c = 0] = call.args;
    if (call.fn === 'HasTech' && a === tech.id && b === 1 && c === 1) continue; // "not already at rank 1"
    if (call.fn === 'HasTech' && a !== tech.id && (c === 0 || c >= b)) {
      if (b !== 1) fail(tech, `needs ${b} ranks of parent ${a}`);
      parents.add(a);
    } else if (call.fn === 'HasLevel' && b === 0) {
      levelGate = Math.max(levelGate ?? 0, a); // several level conditions: the highest binds
    } else fail(tech, `unknown first-rank condition ${call.fn}(${call.args.join(',')})`);
  }

  const values: number[] = [];
  const costs: number[] = [];
  const stats: string[] = [];
  let unitIds: number[] | undefined;
  tech.levels.forEach((level, index) => {
    const rank = index + 1;
    if (level.level !== rank) fail(tech, `level ${level.level} out of place`);
    if (rank > 1) {
      const { calls } = level.learnGuard;
      const [call] = calls;
      if (
        calls.length !== 1 ||
        call?.fn !== 'HasTech' ||
        call.args.join() !== [tech.id, rank - 1, rank - 1].join()
      ) {
        fail(tech, `rank ${rank} has a condition other than the previous rank`);
      }
    }
    const [coeff, ...rest] = level.effect.coeffs;
    if (coeff === undefined) return fail(tech, `rank ${rank} has no effect`);
    if (coeff.A !== 0 || coeff.C !== 0) fail(tech, `rank ${rank} has an offset or a scale`);
    for (const other of rest) {
      if (other.B !== coeff.B || other.A !== 0 || other.C !== 0) fail(tech, `rank ${rank}: coeffs disagree`);
    }
    // B is 10000 plus basis points: 10050 is +0.5 %, 9800 is a 2 % price cut.
    values.push((coeff.B - 10000) / 100);
    const names = [...new Set(level.effect.coeffs.map((c) => c.typeName))];
    if (rank === 1) stats.push(...names);
    else if (stats.join() !== names.join()) fail(tech, `rank ${rank} changes the stat`);
    const ids = coeff.affectedIds;
    for (const c of level.effect.coeffs) {
      if (c.affectedIds.length > 0 && c.affectedIds.join() !== ids.join())
        fail(tech, `rank ${rank}: unit ids differ`);
    }
    if (unitIds === undefined) unitIds = ids;
    else if (unitIds.join() !== ids.join()) fail(tech, `rank ${rank} changes the affected ids`);

    const [price, ...morePrices] = level.instantPrice;
    if (price === undefined || morePrices.length > 0 || price.resource !== TALENT_POINT_RESOURCE) {
      fail(tech, `rank ${rank} is not priced in talent points`);
    }
    costs.push(price.amount);
  });

  return {
    id: tech.id,
    name: tech.name,
    tree,
    maxRank: tech.maxLevel,
    layout: {
      x: layout.x,
      y: layout.y,
      link: layout.linkType,
      place: layout.linkPlace,
      flipped: layout.linkFlipped === '1',
    },
    parents: [...parents].sort((a, b) => a - b),
    ...(levelGate === undefined ? {} : { levelGate }),
    stats,
    unitIds: unitIds ?? [],
    values,
    costs,
  };
}

/** Every placed node of the four hero trees, in the dump's order. */
export function convertTalents(dump: TalentDump): TalentRecord[] {
  const rows: TalentRecord[] = [];
  for (const branch of dump.branches) {
    const tree = TREE_OF_BRANCH[branch.id];
    if (branch.type !== 'heroAbility' || tree === undefined) continue;
    for (const tech of branch.techs) if (tech.layout !== null) rows.push(convertTech(tech, tree));
  }
  const ids = new Set(rows.map((row) => row.id));
  for (const row of rows) {
    for (const parent of row.parents) {
      if (!ids.has(parent))
        throw new Error(`talent ${row.id} (${row.name}): parent ${parent} is not in the output`);
    }
  }
  return rows;
}

async function main() {
  const source = process.argv[2] ?? DUMP_SOURCE;
  if (source === null)
    throw new Error(
      'Give the path of the recon talents.json: pnpm data:talents <path>, or set TALENTS_DUMP.',
    );
  const rows = convertTalents(JSON.parse(await readFile(source, 'utf8')) as TalentDump);
  const text = await canonicalText('talents.json', rows as never);
  await writeFile(path.join(TABLES_DIR, 'talents.json'), text);
  console.warn(`talents.json: ${rows.length} nodes from ${source}`);
}

if (process.argv[1]?.endsWith('talents-convert.ts')) await main();
