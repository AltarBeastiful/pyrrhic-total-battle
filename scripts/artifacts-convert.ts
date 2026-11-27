/**
 * Reshapes the artifact export of the game (`artifacts.json` in the `tb-analyze` hero and artifact export)
 * into `src/data/tables/artifacts.json`: sixteen artifacts, each with what its 60 levels and its 25 star
 * steps give. Everything the decoder does not understand throws, naming the record, so a changed game cannot
 * slip through as a wrong table.
 *
 * Run it with `pnpm data:artifacts <export directory>`, or set `HEROES_ARTIFACTS_EXPORT` to the directory
 * (the test that rebuilds the whole table from the export reads the same variable, and is skipped without it).
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalText, TABLES_DIR } from './data-tables.ts';
import type { ArtifactRecord, ArtifactRow, BonusKey, SpecialKey } from '../src/data/types.ts';

/** The export directory named by the environment, or null. */
export const EXPORT_SOURCE: string | null = process.env['HEROES_ARTIFACTS_EXPORT'] ?? null;
/** The one file of the export the artifact table is built from. */
export const EXPORT_FILE = 'artifacts.json';

/** Our id (saved profiles use it: never change one) to the game's name for the artifact. */
const ARTIFACTS: Record<string, string> = {
  'fan-of-the-five-winds': 'Fan of the Five Winds',
  'forest-crown': 'Forest Crown',
  'ghostflame-lantern': 'Ghostflame Lantern',
  'griffinwing-mask': 'Griffinwing Mask',
  'heart-of-the-forest': 'Heart of the Forest',
  'ifrit-lords-belt': "Ifrit Lord's Belt",
  'knight-of-dalarna': 'Knight of Dalarna',
  'mars-twin-blades': "Mars' Twin Blades",
  'medallion-of-unity': 'Medallion of Unity',
  'philosophers-stone': "Philosopher's Stone",
  'ruby-brooch': 'Ruby Brooch',
  'source-flask': 'Source Flask',
  technobomb: 'Technobomb',
  'valkyrie-diadem': 'Valkyrie Diadem',
  'wardens-quiver': "Warden's Quiver",
  'zeus-lightning': "Zeus' Lightning",
};

const LEVELS = 60;
const STAR_STEPS = 25;

/** One effect as the export writes it. `B` and `C` are the game's coefficients. */
export interface DumpEffect {
  typeName: string;
  /** The export names a unit set only by its size; 0 for an effect that names no set. */
  affected: number;
  condition: string;
  A: number;
  B: number;
  C: number;
}
export interface DumpArtifact {
  name: string;
  levels: { level: number; effects: DumpEffect[] }[];
  stars: { star: number; effects: DumpEffect[] }[];
  randomEffects: { effectId: number; text: string; effects: DumpEffect[] }[];
}
export interface ArtifactDump {
  artifacts: DumpArtifact[];
}

/** What the app does with each effect kind of the sixteen artifacts. Any other kind stops the conversion. */
type Kind =
  /** A health or strength bonus for the unit set the effect names. */
  | { bucket: 'health' | 'strength'; againstPlayers?: true }
  /** A special figure: army-wide (the effect names the army's set) or naming no set at all. */
  | { special: SpecialKey; set: 'army' | 'none'; inScale?: true }
  /** A capacity bonus, or a kind the app does not use. Neither names a unit set. */
  | { capacity: 'leadership' | 'dominance' }
  | { unused: 'authority' | 'marchSpeed' };

const KINDS: Record<string, Kind> = {
  UNIT_HEALTH: { bucket: 'health' },
  UNIT_POWER: { bucket: 'strength' },
  UNIT_HEALTH_PVP: { bucket: 'health', againstPlayers: true },
  UNIT_POWER_PVP: { bucket: 'strength', againstPlayers: true },
  UNIT_POWER_EPIC_MONSTERS: { special: 'armyStrengthAgainstEpicMonsters', set: 'army' },
  UNIT_CRIT: { special: 'doubleDamageChance', set: 'none' },
  UNIT_DOUBLE_TURN_PROBABILITY: { special: 'strikeTwoSquadsChance', set: 'army', inScale: true },
  HERO_LEADERSHIP: { capacity: 'leadership' },
  HERO_DOMINANCE: { capacity: 'dominance' },
  HERO_MASTERY: { unused: 'authority' },
  MARCH_SPEED_PVE: { unused: 'marchSpeed' },
};

/** Does an effect of this kind name a unit set the converter has to know? */
const namesUnitSet = (kind: Kind): boolean => 'bucket' in kind || ('special' in kind && kind.set === 'army');

/**
 * The words a random option text opens with when it speaks of a unit set. The export names a set only by its
 * size, and sizes differ between game snapshots, so the size of each set is read from these texts.
 */
const SUBJECTS: [string, BonusKey][] = [
  ['Army ', 'army'],
  ['Strength of your entire army ', 'army'],
  ["Guardsmen's ", 'guardsmen'],
  ["Specialists' ", 'specialist'],
  ["Engineer corps' ", 'engineers'],
  ["Monsters' ", 'monster'],
  ["Melee units' ", 'melee'],
  ["Ranged units' ", 'ranged'],
  ["Mounted units' ", 'mounted'],
  ["Flying units' ", 'flying'],
];

type UnitSets = ReadonlyMap<number, BonusKey>;

function fail(record: string, why: string): never {
  throw new Error(`artifact ${record}: ${why}`);
}

/** Unit-set size to bonus key, from every random option text of the export. */
function learnUnitSets(dump: ArtifactDump): UnitSets {
  const sets = new Map<number, BonusKey>();
  for (const artifact of dump.artifacts) {
    for (const option of artifact.randomEffects) {
      const key = SUBJECTS.find(([words]) => option.text.startsWith(words))?.[1];
      if (key === undefined) continue;
      for (const effect of option.effects) {
        const kind = KINDS[effect.typeName];
        if (kind === undefined || !namesUnitSet(kind)) continue;
        const claimed = sets.get(effect.affected);
        if (claimed !== undefined && claimed !== key) {
          fail(
            `${artifact.name}, random option ${String(option.effectId)}`,
            `unit set of size ${String(effect.affected)} is claimed by both ${claimed} and ${key}`,
          );
        }
        sets.set(effect.affected, key);
      }
    }
  }
  return sets;
}

/** One decoded effect: what it feeds and by how much, or `null` when the app carries nothing of it yet. */
type Decoded =
  | { bucket: 'health' | 'strength'; key: BonusKey; value: number }
  | { bucket: 'special'; key: SpecialKey; value: number }
  | null;

function decode(effect: DumpEffect, sets: UnitSets, record: string): Decoded {
  const kind = KINDS[effect.typeName];
  if (kind === undefined) return fail(record, `unknown effect kind ${effect.typeName}`);
  if (effect.condition !== 'Enabled()') {
    fail(record, `${effect.typeName} has the condition ${effect.condition}`);
  }
  const inScale = 'inScale' in kind;
  if (effect.A !== 0 || (inScale ? effect.B !== 0 : effect.C !== 0)) {
    const coefficients = [effect.A, effect.B, effect.C].join('/');
    fail(record, `${effect.typeName} has coefficients ${coefficients}`);
  }
  let key: BonusKey | undefined;
  if (namesUnitSet(kind)) {
    key = sets.get(effect.affected);
    if (key === undefined) {
      fail(record, `no random option text names the unit set of size ${String(effect.affected)}`);
    }
  } else if ('special' in kind && effect.affected !== 0) {
    fail(record, `${effect.typeName} names a unit set`);
  }
  // A coefficient is 10 000 plus the percentage in hundredths (10 950 is +9.5 %); a scale one is tenths.
  const value = inScale ? effect.C / 10 : (effect.B - 10000) / 100;

  if ('bucket' in kind) {
    // Bonuses against other players are not carried yet (B-41).
    return kind.againstPlayers ? null : { bucket: kind.bucket, key: key!, value };
  }
  if ('special' in kind) {
    if (key !== undefined && key !== 'army') {
      fail(record, `${effect.typeName} is for the ${key} set, not the army`);
    }
    return { bucket: 'special', key: kind.special, value };
  }
  // Capacity (B-44), authority and march speed: understood, not carried.
  return null;
}

function row(effects: DumpEffect[], sets: UnitSets, record: string): ArtifactRow {
  const out: ArtifactRow = {};
  for (const effect of effects) {
    const bonus = decode(effect, sets, record);
    if (bonus === null) continue;
    const map: Partial<Record<string, number>> = (out[bonus.bucket] ??= {});
    map[bonus.key] = (map[bonus.key] ?? 0) + bonus.value;
  }
  return out;
}

/** Where a random option id spells a unit set differently from its bonus key (`guardsmanStrength`). */
const OPTION_PREFIXES: Partial<Record<BonusKey, string>> = {
  guardsmen: 'guardsman',
  engineers: 'engineer',
};

/** The id of a random option as saved profiles name it, or `null` when the app counts nothing of it. */
function optionId(effects: DumpEffect[], sets: UnitSets, record: string): string | null {
  const decoded = effects.map((effect) => decode(effect, sets, record));
  const counted = decoded.filter((bonus) => bonus !== null);
  const [first, ...rest] = counted;
  if (first === undefined) return null;
  if (counted.length === decoded.length) {
    if (first.bucket === 'special') {
      if (rest.length === 0) return first.key;
    } else if (rest.every((bonus) => bonus.bucket !== 'special' && bonus.key === first.key)) {
      const buckets = new Set(counted.map((bonus) => bonus.bucket));
      const suffix =
        buckets.size === 2 ? 'StrengthAndHealth' : first.bucket === 'health' ? 'Health' : 'Strength';
      return `${OPTION_PREFIXES[first.key] ?? first.key}${suffix}`;
    }
  }
  return fail(record, 'its effects cannot be named as one random option');
}

/** The steps of one ladder (levels or star steps), which must run 1, 2, 3 up to `count`. */
function ladder<T>(
  artifact: string,
  steps: T[],
  count: number,
  stepOf: (step: T) => number,
  what: 'level' | 'star step',
): [number, T][] {
  const out = Array.from({ length: count }, (_, index): [number, T] => {
    const step = steps[index];
    if (step === undefined || stepOf(step) !== index + 1) {
      return fail(artifact, `${what} ${String(index + 1)} is missing or out of order`);
    }
    return [index + 1, step];
  });
  if (steps.length !== count) {
    fail(artifact, `${String(steps.length)} ${what}s where ${String(count)} are expected`);
  }
  return out;
}

/** Step 1 to 25 in the game's notation: 0.1 ... 0.4, 1.0, 1.1 ... 5.0 (step 5k is k.0; there is no 0.0). */
const starKey = (step: number): string => `${String(Math.floor(step / 5))}.${String(step % 5)}`;

function convertArtifact(id: string, artifact: DumpArtifact, sets: UnitSets): ArtifactRecord {
  const { name } = artifact;
  const levels = ladder(name, artifact.levels, LEVELS, (step) => step.level, 'level').map(
    ([level, { effects }]) => [String(level), row(effects, sets, `${name}, level ${String(level)}`)] as const,
  );
  const stars = ladder(name, artifact.stars, STAR_STEPS, (step) => step.star, 'star step').map(
    ([step, { effects }]) =>
      [starKey(step), row(effects, sets, `${name}, star step ${String(step)}`)] as const,
  );
  const options = artifact.randomEffects.flatMap((option) => {
    const found = optionId(option.effects, sets, `${name}, random option ${String(option.effectId)}`);
    return found === null ? [] : [found];
  });
  return {
    id,
    name,
    levels: Object.fromEntries(levels),
    stars: Object.fromEntries(stars),
    randomBonusOptions: [...new Set(options)].sort(),
  };
}

/** The sixteen artifacts of the app, in id order. */
export function convertArtifacts(dump: ArtifactDump): ArtifactRecord[] {
  const sets = learnUnitSets(dump);
  return Object.entries(ARTIFACTS).map(([id, name]) => {
    const [artifact, ...twins] = dump.artifacts.filter((candidate) => candidate.name === name);
    if (artifact === undefined) return fail(name, 'not in the export');
    if (twins.length > 0) fail(name, 'listed twice');
    return convertArtifact(id, artifact, sets);
  });
}

async function main() {
  const source = process.argv[2] ?? EXPORT_SOURCE;
  if (source === null) {
    throw new Error(
      'Give the export directory: pnpm data:artifacts <directory>, or set HEROES_ARTIFACTS_EXPORT.',
    );
  }
  const dump = JSON.parse(await readFile(path.join(source, EXPORT_FILE), 'utf8')) as ArtifactDump;
  const rows = convertArtifacts(dump);
  const text = await canonicalText('artifacts.json', rows as never);
  await writeFile(path.join(TABLES_DIR, 'artifacts.json'), text);
  console.warn(`artifacts.json: ${rows.length} artifacts from ${source}`);
}

if (process.argv[1]?.endsWith('artifacts-convert.ts')) await main();
