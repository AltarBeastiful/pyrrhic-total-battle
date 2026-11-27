/**
 * Reshapes the hero level export of the game (`hero_levels.csv` in the `tb-analyze` hero and artifact export)
 * into `src/data/tables/capacities.json`: the leadership, authority and dominance of a captain and of the hero at
 * each level, 1 to 600 (B-43). The game calls authority "mastery". The export lists every captain; they all hold
 * the same figures, which is checked, so the table keeps one set for them. Anything unexpected throws.
 *
 * Run by `pnpm data:artifacts <export directory>` with the artifact table, which comes from the same export.
 */
import type { CapacityLadder, CapacityTable } from '../src/data/types.ts';

/** The one file of the export the capacity table is built from. */
export const LEVELS_FILE = 'hero_levels.csv';

const LEVELS = 600;

/** The export's column for each figure the table keeps. */
const FIGURES = [
  ['leadership', 'leadership'],
  ['authority', 'mastery'],
  ['dominance', 'dominance'],
] as const satisfies readonly (readonly [keyof CapacityLadder, string])[];

const KINDS = ['HERO', 'CAPTAIN'] as const;
type Kind = (typeof KINDS)[number];

interface Character {
  id: string;
  kind: Kind;
  ladder: CapacityLadder;
}

function fail(why: string): never {
  throw new Error(`capacities: ${why}`);
}

const nameOf = ({ kind, id }: Pick<Character, 'kind' | 'id'>): string => `${kind.toLowerCase()} ${id}`;

/** Every hero and captain of the export with their ladder, whose levels must run 1, 2, 3 up to 600. */
function characters(csv: string): Character[] {
  const [header = '', ...lines] = csv.split(/\r?\n/);
  const columns = header.split(',');
  const column = (name: string): number => {
    const at = columns.indexOf(name);
    return at < 0 ? fail(`no column named ${name}`) : at;
  };
  const at = { id: column('id'), kind: column('kind'), level: column('level') };
  const figures = FIGURES.map(([key, name]) => ({ key, name, at: column(name) }));
  const found = new Map<string, Character>();
  lines.forEach((line, index) => {
    if (line === '') return;
    const record = `line ${String(index + 2)}`;
    const cells = line.split(',');
    const id = cells[at.id] ?? '';
    const kind = KINDS.find((known) => known === cells[at.kind]);
    if (kind === undefined) return fail(`${record}: unknown kind ${cells[at.kind] ?? ''}`);
    let character = found.get(`${kind} ${id}`);
    if (character === undefined) {
      character = { id, kind, ladder: { leadership: [], authority: [], dominance: [] } };
      found.set(`${kind} ${id}`, character);
    }
    const next = character.ladder.leadership.length + 1;
    if (next <= LEVELS && Number(cells[at.level]) !== next) {
      fail(`${nameOf(character)}: level ${String(next)} is missing or out of order`);
    }
    for (const figure of figures) {
      const cell = cells[figure.at] ?? '';
      if (cell === '') fail(`${record}: ${figure.name} is empty`);
      const value = Number(cell);
      if (!Number.isSafeInteger(value) || value < 0) {
        fail(`${record}: ${figure.name} is ${cell}, not a whole number`);
      }
      character.ladder[figure.key].push(value);
    }
  });
  const all = [...found.values()];
  for (const character of all) {
    const count = character.ladder.leadership.length;
    if (count < LEVELS) fail(`${nameOf(character)}: level ${String(count + 1)} is missing or out of order`);
    if (count > LEVELS) {
      fail(`${nameOf(character)}: ${String(count)} levels where ${String(LEVELS)} are expected`);
    }
  }
  return all;
}

/** The one ladder every captain holds. */
function shared(captains: Character[]): CapacityLadder {
  const [first, ...others] = captains;
  if (first === undefined) return fail('no captain');
  for (const captain of others) {
    for (let index = 0; index < LEVELS; index += 1) {
      for (const [key] of FIGURES) {
        const value = captain.ladder[key][index];
        const expected = first.ladder[key][index];
        if (value !== expected) {
          fail(
            `${nameOf(captain)}, level ${String(index + 1)}: ${key} ${String(value)} where ` +
              `${nameOf(first)} has ${String(expected)}`,
          );
        }
      }
    }
  }
  return first.ladder;
}

export function convertCapacities(csv: string): CapacityTable {
  const all = characters(csv);
  const heroes = all.filter((character) => character.kind === 'HERO');
  const [hero] = heroes;
  if (hero === undefined || heroes.length > 1) {
    return fail(`${String(heroes.length)} heroes where one is expected`);
  }
  return { captain: shared(all.filter((character) => character.kind === 'CAPTAIN')), hero: hero.ladder };
}
