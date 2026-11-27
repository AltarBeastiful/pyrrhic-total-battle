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

/** The export lists an option once per rarity, the best first. */
const RARITIES = ['LEGENDARY', 'EPIC', 'RARE'] as const;

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
      randomEffects: RARITIES.map((rarity, step) => ({
        effectId: 500 + 3 * index + step,
        rarity,
        text: 'Army strength',
        effects: [effect('UNIT_POWER', ARMY, 11000 + step * 1000)],
      })),
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

/**
 * One random option of an artifact, appended to the list as the export writes it: one entry per rarity. The
 * effects are the same for the three unless they are given as a function of the rarity.
 */
function roll(
  dump: ArtifactDump,
  name: string,
  text: string,
  effects: DumpEffect[] | ((rarity: (typeof RARITIES)[number]) => DumpEffect[]),
): void {
  const artifact = artifactOf(dump, name);
  for (const rarity of RARITIES) {
    artifact.randomEffects.push({
      effectId: 900 + artifact.randomEffects.length,
      rarity,
      text,
      effects: typeof effects === 'function' ? effects(rarity) : effects,
    });
  }
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

  it('carries the bonuses against other players on level and star rows, marked as such', () => {
    const dump = handMade();
    everyRow(
      dump,
      'Forest Crown',
      [effect('UNIT_POWER', ARMY, 10100), effect('UNIT_POWER_PVP', ARMY, 14200)],
      [effect('UNIT_HEALTH_PVP', ARMY, 10950)],
    );
    everyRow(
      dump,
      "Mars' Twin Blades",
      [effect('UNIT_POWER_PVP', ARMY, 14200), effect('UNIT_HEALTH_PVP', ARMY, 14300)],
      [effect('UNIT_DOUBLE_TURN_PROBABILITY', ARMY, 0, 11)],
    );

    const rows = rowsById(dump);
    expect(rows.get('forest-crown')?.levels['1']).toEqual({
      strength: { army: 1 },
      againstPlayers: { strength: { army: 42 } },
    });
    expect(rows.get('forest-crown')?.stars['0.1']).toEqual({ againstPlayers: { health: { army: 9.5 } } });
    expect(rows.get('mars-twin-blades')?.levels['1']).toEqual({
      againstPlayers: { health: { army: 43 }, strength: { army: 42 } },
    });
    // The strike-two chance is not one against other players: it counts everywhere.
    expect(rows.get('mars-twin-blades')?.stars['0.1']).toEqual({ special: { strikeTwoSquadsChance: 1.1 } });
  });

  it('carries the capacity bonus of a level or star row, and no authority or march speed', () => {
    const dump = handMade();
    everyRow(
      dump,
      "Zeus' Lightning",
      [effect('HERO_LEADERSHIP', 0, 10250), effect('HERO_DOMINANCE', 0, 10270)],
      [effect('UNIT_CRIT', 0, 10070), effect('HERO_MASTERY', 0, 10250), effect('MARCH_SPEED_PVE', 0, 12000)],
    );

    const rows = rowsById(dump);
    expect(rows.get('zeus-lightning')?.levels['1']).toEqual({
      capacity: { leadership: 2.5, dominance: 2.7 },
    });
    expect(rows.get('zeus-lightning')?.stars['0.1']).toEqual({ special: { doubleDamageChance: 0.7 } });
  });

  it('carries every random option with its three values, named as saved profiles name them', () => {
    const dump = handMade();
    const army = (typeName: string, B: number) => effect(typeName, ARMY, B);
    const three = (rare: number, epic: number, legendary: number) => ({
      RARE: rare,
      EPIC: epic,
      LEGENDARY: legendary,
    });
    artifactOf(dump, 'Ghostflame Lantern').randomEffects = [];
    roll(dump, 'Ghostflame Lantern', 'Army strength and health', (rarity) => {
      const B = three(10500, 11000, 12500)[rarity];
      return [army('UNIT_POWER', B), army('UNIT_HEALTH', B)];
    });
    roll(dump, 'Ghostflame Lantern', 'Strength of your entire army against epic monsters', (rarity) => [
      army('UNIT_POWER_EPIC_MONSTERS', three(12000, 14000, 20000)[rarity]),
    ]);
    roll(dump, 'Ghostflame Lantern', 'Chance to strike two squads', (rarity) => [
      effect('UNIT_DOUBLE_TURN_PROBABILITY', ARMY, 0, three(2, 4, 10)[rarity]),
    ]);

    expect(rowsById(dump).get('ghostflame-lantern')?.randomOptions).toEqual([
      {
        id: 'armyStrengthAgainstEpicMonsters',
        values: {
          rare: { special: { armyStrengthAgainstEpicMonsters: 20 } },
          epic: { special: { armyStrengthAgainstEpicMonsters: 40 } },
          legendary: { special: { armyStrengthAgainstEpicMonsters: 100 } },
        },
      },
      {
        id: 'armyStrengthAndHealth',
        values: {
          rare: { health: { army: 5 }, strength: { army: 5 } },
          epic: { health: { army: 10 }, strength: { army: 10 } },
          legendary: { health: { army: 25 }, strength: { army: 25 } },
        },
      },
      {
        id: 'strikeTwoSquadsChance',
        values: {
          rare: { special: { strikeTwoSquadsChance: 0.2 } },
          epic: { special: { strikeTwoSquadsChance: 0.4 } },
          legendary: { special: { strikeTwoSquadsChance: 1 } },
        },
      },
    ]);
  });

  it('carries the options against other players, capacity, authority and march speed, each kept apart', () => {
    const dump = handMade();
    artifactOf(dump, "Zeus' Lightning").randomEffects = [];
    roll(dump, "Zeus' Lightning", 'Army strength against other players', [
      effect('UNIT_POWER_PVP', ARMY, 12000),
    ]);
    roll(dump, "Zeus' Lightning", 'Army strength and health against other players', [
      effect('UNIT_POWER_PVP', ARMY, 11000),
      effect('UNIT_HEALTH_PVP', ARMY, 11000),
    ]);
    roll(dump, "Zeus' Lightning", 'Leadership', [effect('HERO_LEADERSHIP', 0, 10500)]);
    roll(dump, "Zeus' Lightning", 'Dominance', [effect('HERO_DOMINANCE', 0, 10200)]);
    roll(dump, "Zeus' Lightning", 'Authority', [effect('HERO_MASTERY', 0, 10100)]);
    roll(dump, "Zeus' Lightning", 'March speed against monsters', [effect('MARCH_SPEED_PVE', 0, 12000)]);

    const options = rowsById(dump).get('zeus-lightning')?.randomOptions ?? [];
    expect(options.map((option) => [option.id, option.values.rare])).toEqual([
      ['armyStrengthAgainstPlayers', { againstPlayers: { strength: { army: 20 } } }],
      [
        'armyStrengthAndHealthAgainstPlayers',
        { againstPlayers: { health: { army: 10 }, strength: { army: 10 } } },
      ],
      ['authority', { unused: { authority: 1 } }],
      ['dominance', { capacity: { dominance: 2 } }],
      ['leadership', { capacity: { leadership: 5 } }],
      ['marchSpeed', { unused: { marchSpeed: 20 } }],
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
    ).toThrow(/Ruby Brooch, random option 903: unknown effect kind UNIT_MAGIC/);
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
    ).toThrow(/Ruby Brooch, random option 903: unit set of size 9 is claimed by both army and melee/);
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
    ).toThrow(/Ruby Brooch, random option 903/);
    expect(
      refusal((dump) => {
        roll(dump, 'Ruby Brooch', 'Leadership and more', [
          effect('HERO_LEADERSHIP', 0, 10500),
          effect('UNIT_CRIT', 0, 10150),
        ]);
      }),
    ).toThrow(/Ruby Brooch, random option 903/);
  });

  it('a random option without exactly one value per rarity', () => {
    const ghostflame = (change: (options: DumpArtifact['randomEffects']) => void) =>
      refusal((dump) => {
        change(artifactOf(dump, 'Ghostflame Lantern').randomEffects);
      });
    expect(
      ghostflame((options) => {
        options.splice(1, 1);
      }),
    ).toThrow(/Ghostflame Lantern: random option armyStrength has no epic value/);
    expect(
      ghostflame((options) => {
        options.push({ ...options[0]!, effectId: 990 });
      }),
    ).toThrow(/Ghostflame Lantern, random option 990: a second legendary value for armyStrength/);
    expect(
      ghostflame((options) => {
        options[2]!.rarity = 'MYTHIC';
      }),
    ).toThrow(/Ghostflame Lantern, random option \d+: unknown rarity MYTHIC/);
    expect(
      ghostflame((options) => {
        options.length = 0;
      }),
    ).toThrow(/Ghostflame Lantern: no random options/);
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
