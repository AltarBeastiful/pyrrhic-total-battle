/**
 * The artifact table is built from the owner's game export by `scripts/artifacts-convert.ts` (B-39).
 * One small hand-made export checks the decoding rules; when the real export is on this machine the whole
 * table is rebuilt from it and must equal what is committed.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  convertArtifacts,
  EXPORT_FILE,
  EXPORT_SOURCE,
  type ArtifactDump,
  type DumpArtifact,
  type DumpEffect,
} from '../../scripts/artifacts-convert.ts';
import { artifacts } from '../../src/data/index.ts';

/** The sixteen names the converter must find in an export. */
const NAMES = [
  'Fan of the Five Winds',
  'Forest Crown',
  'Ghostflame Lantern',
  'Griffinwing Mask',
  'Heart of the Forest',
  "Ifrit Lord's Belt",
  'Knight of Dalarna',
  "Mars' Twin Blades",
  'Medallion of Unity',
  "Philosopher's Stone",
  'Ruby Brooch',
  'Source Flask',
  'Technobomb',
  'Valkyrie Diadem',
  "Warden's Quiver",
  "Zeus' Lightning",
];

/** Unit-set sizes of this hand-made export, on purpose unlike any real snapshot's. */
const ARMY = 9;

const effect = (typeName: string, affected: number, B: number, C = 0): DumpEffect => ({
  typeName,
  affected,
  condition: 'Enabled()',
  A: 0,
  B,
  C,
});

/** Every artifact starts as "army strength": +level % per level, +step/10 % per star step. */
function handMade(): ArtifactDump {
  return {
    artifacts: NAMES.map((name, index) => ({
      name,
      levels: Array.from({ length: 60 }, (_, i) => ({
        level: i + 1,
        effects: [effect('UNIT_POWER', ARMY, 10000 + (i + 1) * 100)],
      })),
      stars: Array.from({ length: 25 }, (_, i) => ({
        star: i + 1,
        effects: [effect('UNIT_POWER', ARMY, 10000 + (i + 1) * 10)],
      })),
      randomEffects: [
        { effectId: 500 + index, text: 'Army strength', effects: [effect('UNIT_POWER', ARMY, 11000)] },
      ],
    })),
  };
}

const rowsById = (dump: ArtifactDump) => new Map(convertArtifacts(dump).map((row) => [row.id, row]));

function artifactOf(dump: ArtifactDump, name: string): DumpArtifact {
  const found = dump.artifacts.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no ${name} in the hand-made export`);
  return found;
}

/** Gives every level row and every star row of one artifact the same effects. */
function everyRow(
  dump: ArtifactDump,
  name: string,
  levels: DumpEffect[],
  stars: DumpEffect[] = levels,
): void {
  const artifact = artifactOf(dump, name);
  for (const row of artifact.levels) row.effects = levels;
  for (const row of artifact.stars) row.effects = stars;
}

/** One random option of an artifact, appended to the list. */
function roll(dump: ArtifactDump, name: string, text: string, effects: DumpEffect[]): void {
  const artifact = artifactOf(dump, name);
  artifact.randomEffects.push({ effectId: 900 + artifact.randomEffects.length, text, effects });
}

describe('convertArtifacts', () => {
  it('builds the sixteen artifacts under the ids saved profiles use', () => {
    expect(
      convertArtifacts(handMade())
        .map((row) => row.id)
        .sort(),
    ).toEqual([
      'fan-of-the-five-winds',
      'forest-crown',
      'ghostflame-lantern',
      'griffinwing-mask',
      'heart-of-the-forest',
      'ifrit-lords-belt',
      'knight-of-dalarna',
      'mars-twin-blades',
      'medallion-of-unity',
      'philosophers-stone',
      'ruby-brooch',
      'source-flask',
      'technobomb',
      'valkyrie-diadem',
      'wardens-quiver',
      'zeus-lightning',
    ]);
  });

  it('reads a percentage as the coefficient minus 10 000, over 100, and writes star step n as 0.1 to 5.0', () => {
    const heart = rowsById(handMade()).get('heart-of-the-forest');
    expect(heart?.name).toBe('Heart of the Forest');
    expect(Object.keys(heart?.levels ?? {})).toHaveLength(60);
    expect(heart?.levels['1']).toEqual({ strength: { army: 1 } });
    expect(heart?.levels['60']).toEqual({ strength: { army: 60 } });
    const steps = Object.keys(heart?.stars ?? {});
    expect(steps).toHaveLength(25);
    expect(steps.slice(0, 6)).toEqual(['0.1', '0.2', '0.3', '0.4', '1.0', '1.1']);
    expect(steps.at(-1)).toBe('5.0');
    expect(heart?.stars['1.0']).toEqual({ strength: { army: 0.5 } });
    expect(heart?.stars['5.0']).toEqual({ strength: { army: 2.5 } });
  });

  it('learns which unit-set size is which bonus key from the random option texts', () => {
    const dump = handMade();
    everyRow(dump, 'Medallion of Unity', [effect('UNIT_HEALTH', 31, 12750)]);
    roll(dump, 'Medallion of Unity', "Guardsmen's health", [effect('UNIT_HEALTH', 31, 11300)]);
    everyRow(dump, "Warden's Quiver", [effect('UNIT_POWER', 4, 10950), effect('UNIT_HEALTH', 4, 10950)]);
    roll(dump, "Warden's Quiver", "Ranged units' strength and health", [
      effect('UNIT_POWER', 4, 10500),
      effect('UNIT_HEALTH', 4, 10500),
    ]);

    const rows = rowsById(dump);
    expect(rows.get('medallion-of-unity')?.levels['1']).toEqual({ health: { guardsmen: 27.5 } });
    expect(rows.get('wardens-quiver')?.stars['0.1']).toEqual({
      health: { ranged: 9.5 },
      strength: { ranged: 9.5 },
    });
  });

  it('names every unit set the app has a bonus key for', () => {
    const subjects = [
      ["Specialists'", 'specialist'],
      ["Monsters'", 'monster'],
      ["Melee units'", 'melee'],
      ["Mounted units'", 'mounted'],
      ["Flying units'", 'flying'],
      ["Engineer corps'", 'engineers'],
    ] as const;
    const dump = handMade();
    subjects.forEach(([subject], index) => {
      // The name may come from another artifact than the one whose rows use the set.
      roll(dump, 'Forest Crown', `${subject} health against other players`, [
        effect('UNIT_HEALTH_PVP', 100 + index, 11000),
      ]);
    });
    const artifact = artifactOf(dump, 'Source Flask');
    subjects.forEach((_subject, index) => {
      artifact.levels[index]!.effects = [effect('UNIT_POWER', 100 + index, 10100)];
    });

    const flask = rowsById(dump).get('source-flask');
    subjects.forEach(([, key], index) => {
      expect(flask?.levels[String(index + 1)]).toEqual({ strength: { [key]: 1 } });
    });
  });

  it('feeds strength against epic monsters, double damage and strike two squads (tenths of a percent)', () => {
    const dump = handMade();
    everyRow(dump, 'Ghostflame Lantern', [effect('UNIT_POWER_EPIC_MONSTERS', ARMY, 14200)]);
    everyRow(
      dump,
      "Mars' Twin Blades",
      [effect('UNIT_POWER', ARMY, 10100)],
      [effect('UNIT_DOUBLE_TURN_PROBABILITY', ARMY, 0, 11)],
    );
    everyRow(dump, "Zeus' Lightning", [effect('UNIT_POWER', ARMY, 10100)], [effect('UNIT_CRIT', 0, 10070)]);

    const rows = rowsById(dump);
    expect(rows.get('ghostflame-lantern')?.levels['1']).toEqual({
      special: { armyStrengthAgainstEpicMonsters: 42 },
    });
    expect(rows.get('mars-twin-blades')?.stars['0.1']).toEqual({ special: { strikeTwoSquadsChance: 1.1 } });
    expect(rows.get('zeus-lightning')?.stars['0.1']).toEqual({ special: { doubleDamageChance: 0.7 } });
  });

  it('carries no bonus yet for capacity, authority, march speed and effects against other players', () => {
    const dump = handMade();
    everyRow(
      dump,
      "Zeus' Lightning",
      [effect('HERO_LEADERSHIP', 0, 10250), effect('HERO_DOMINANCE', 0, 10250)],
      [effect('UNIT_CRIT', 0, 10070), effect('HERO_MASTERY', 0, 10250)],
    );
    everyRow(
      dump,
      "Mars' Twin Blades",
      [effect('UNIT_POWER_PVP', ARMY, 14200), effect('UNIT_HEALTH_PVP', ARMY, 14200)],
      [effect('MARCH_SPEED_PVE', 0, 12000)],
    );

    const rows = rowsById(dump);
    expect(rows.get('zeus-lightning')?.levels['1']).toEqual({});
    expect(rows.get('zeus-lightning')?.stars['0.1']).toEqual({ special: { doubleDamageChance: 0.7 } });
    expect(rows.get('mars-twin-blades')?.levels['1']).toEqual({});
    expect(rows.get('mars-twin-blades')?.stars['0.1']).toEqual({});
  });

  it('lists the random options the app counts, named as saved profiles name them', () => {
    const dump = handMade();
    const army = (typeName: string, B = 11000) => effect(typeName, ARMY, B);
    artifactOf(dump, 'Ghostflame Lantern').randomEffects = [];
    for (const rarity of [12000, 11000]) {
      // The three rarities of one option are one option.
      roll(dump, 'Ghostflame Lantern', 'Army strength and health', [
        army('UNIT_POWER', rarity),
        army('UNIT_HEALTH', rarity),
      ]);
    }
    roll(dump, 'Ghostflame Lantern', 'Strength of your entire army against epic monsters', [
      army('UNIT_POWER_EPIC_MONSTERS'),
    ]);
    roll(dump, 'Ghostflame Lantern', 'Army strength', [army('UNIT_POWER')]);
    roll(dump, 'Ghostflame Lantern', 'Army health', [army('UNIT_HEALTH')]);
    roll(dump, 'Ghostflame Lantern', 'Army strength against other players', [army('UNIT_POWER_PVP')]);
    roll(dump, 'Ghostflame Lantern', 'March speed against monsters', [effect('MARCH_SPEED_PVE', 0, 12000)]);
    roll(dump, 'Ghostflame Lantern', 'Leadership', [effect('HERO_LEADERSHIP', 0, 10500)]);
    roll(dump, 'Ghostflame Lantern', 'Authority', [effect('HERO_MASTERY', 0, 10500)]);
    roll(dump, 'Ghostflame Lantern', 'Chance to deal double damage', [effect('UNIT_CRIT', 0, 10150)]);
    roll(dump, 'Ghostflame Lantern', 'Chance to strike two squads', [
      effect('UNIT_DOUBLE_TURN_PROBABILITY', ARMY, 0, 10),
    ]);

    expect(rowsById(dump).get('ghostflame-lantern')?.randomBonusOptions).toEqual([
      'armyHealth',
      'armyStrength',
      'armyStrengthAgainstEpicMonsters',
      'armyStrengthAndHealth',
      'doubleDamageChance',
      'strikeTwoSquadsChance',
    ]);
  });
});

describe('convertArtifacts refuses, naming the record', () => {
  /** The message thrown after one thing is broken in the hand-made export. */
  function refusal(breakIt: (dump: ArtifactDump) => void): () => unknown {
    const dump = handMade();
    breakIt(dump);
    return () => convertArtifacts(dump);
  }
  const firstLevel = (dump: ArtifactDump, name = 'Ruby Brooch') => artifactOf(dump, name).levels[0]!;

  it('an unknown effect kind, in a level row or a random option', () => {
    expect(
      refusal((dump) => {
        firstLevel(dump).effects = [effect('UNIT_MAGIC', ARMY, 11000)];
      }),
    ).toThrow(/Ruby Brooch, level 1: unknown effect kind UNIT_MAGIC/);
    expect(
      refusal((dump) => {
        roll(dump, 'Ruby Brooch', 'Army magic', [effect('UNIT_MAGIC', ARMY, 11000)]);
      }),
    ).toThrow(/Ruby Brooch, random option 901: unknown effect kind UNIT_MAGIC/);
  });

  it('a coefficient or a condition it does not understand', () => {
    expect(
      refusal((dump) => {
        firstLevel(dump).effects = [{ ...effect('UNIT_POWER', ARMY, 11000), A: 5 }];
      }),
    ).toThrow(/Ruby Brooch, level 1: UNIT_POWER has coefficients/);
    expect(
      refusal((dump) => {
        firstLevel(dump).effects = [effect('UNIT_DOUBLE_TURN_PROBABILITY', ARMY, 11000, 10)];
      }),
    ).toThrow(/Ruby Brooch, level 1: UNIT_DOUBLE_TURN_PROBABILITY has coefficients/);
    expect(
      refusal((dump) => {
        firstLevel(dump).effects = [{ ...effect('UNIT_POWER', ARMY, 11000), condition: 'AtNight()' }];
      }),
    ).toThrow(/Ruby Brooch, level 1: UNIT_POWER has the condition AtNight\(\)/);
  });

  it('a unit set no text names', () => {
    expect(
      refusal((dump) => {
        firstLevel(dump).effects = [effect('UNIT_POWER', 44, 11000)];
      }),
    ).toThrow(/Ruby Brooch, level 1: no random option text names the unit set of size 44/);
  });

  it('a unit set two keys claim', () => {
    expect(
      refusal((dump) => {
        roll(dump, 'Ruby Brooch', "Melee units' strength", [effect('UNIT_POWER', ARMY, 11000)]);
      }),
    ).toThrow(/Ruby Brooch, random option 901: unit set of size 9 is claimed by both army and melee/);
  });

  it('a set on an effect that names none, or the wrong set on an army-wide one', () => {
    expect(
      refusal((dump) => {
        firstLevel(dump).effects = [effect('UNIT_CRIT', ARMY, 10070)];
      }),
    ).toThrow(/Ruby Brooch, level 1: UNIT_CRIT names a unit set/);
    expect(
      refusal((dump) => {
        roll(dump, 'Ruby Brooch', "Melee units' strength", [effect('UNIT_POWER', 30, 11000)]);
        firstLevel(dump).effects = [effect('UNIT_POWER_EPIC_MONSTERS', 30, 11000)];
      }),
    ).toThrow(/Ruby Brooch, level 1: UNIT_POWER_EPIC_MONSTERS is for the melee set, not the army/);
  });

  it('a random option that mixes things the app cannot name as one option', () => {
    expect(
      refusal((dump) => {
        roll(dump, 'Ruby Brooch', 'Army strength, here and abroad', [
          effect('UNIT_POWER', ARMY, 11000),
          effect('UNIT_POWER_PVP', ARMY, 11000),
        ]);
      }),
    ).toThrow(/Ruby Brooch, random option 901/);
  });

  it('a missing artifact, or one listed twice', () => {
    expect(
      refusal((dump) => {
        dump.artifacts = dump.artifacts.filter((artifact) => artifact.name !== "Mars' Twin Blades");
      }),
    ).toThrow(/Mars' Twin Blades: not in the export/);
    expect(
      refusal((dump) => {
        dump.artifacts.push(structuredClone(artifactOf(dump, 'Technobomb')));
      }),
    ).toThrow(/Technobomb: listed twice/);
  });

  it('a level that is missing or out of order', () => {
    expect(
      refusal((dump) => {
        artifactOf(dump, 'Ruby Brooch').levels.splice(4, 1);
      }),
    ).toThrow(/Ruby Brooch: level 5 is missing or out of order/);
    expect(
      refusal((dump) => {
        artifactOf(dump, 'Ruby Brooch').levels.pop();
      }),
    ).toThrow(/Ruby Brooch: level 60 is missing or out of order/);
    expect(
      refusal((dump) => {
        const { levels } = artifactOf(dump, 'Ruby Brooch');
        levels.push({ ...levels.at(-1)!, level: 61 });
      }),
    ).toThrow(/Ruby Brooch: 61 levels where 60 are expected/);
  });

  it('a star step that is missing or out of order', () => {
    expect(
      refusal((dump) => {
        const { stars } = artifactOf(dump, 'Ruby Brooch');
        [stars[0], stars[1]] = [stars[1]!, stars[0]!];
      }),
    ).toThrow(/Ruby Brooch: star step 1 is missing or out of order/);
    expect(
      refusal((dump) => {
        artifactOf(dump, 'Ruby Brooch').stars.pop();
      }),
    ).toThrow(/Ruby Brooch: star step 25 is missing or out of order/);
  });
});

const REAL = EXPORT_SOURCE === null ? null : path.join(EXPORT_SOURCE, EXPORT_FILE);

describe.skipIf(!(REAL !== null && existsSync(REAL)))('against the game export', () => {
  it('rebuilds exactly the committed table', async () => {
    const rebuilt = convertArtifacts(JSON.parse(await readFile(REAL!, 'utf8')) as ArtifactDump);
    expect(rebuilt).toEqual(artifacts);
  });
});
