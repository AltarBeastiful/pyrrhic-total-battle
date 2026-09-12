/**
 * The guard rail for every data pull request (ADR-0007).
 *
 * Three layers:
 *  1. schema — every table parses against its zod schema;
 *  2. integrity — ids are unique, kill orders and the captain picker reference units that exist, and the
 *     tier/category rules the game itself follows still hold;
 *  3. parity — the tables carry exactly the numbers of the research capture they were reshaped from
 *     (`docs/research/totalstack-data`), so the reshaping is provably lossless. When a value is corrected
 *     against the game, this is the test that has to be updated together with `CHANGELOG.md`.
 */
import { describe, expect, it } from 'vitest';

import researchArtifactBase from '../../docs/research/totalstack-data/artifact-base-strength-by-level.json';
import researchArtifactStar from '../../docs/research/totalstack-data/artifact-star-strength-by-level.json';
import researchCaptainOrder from '../../docs/research/totalstack-data/captain-order.json';
import researchCaptainsJson from '../../docs/research/totalstack-data/captains.json';
import researchMonsterOrder from '../../docs/research/totalstack-data/default-monster-order.json';
import researchTroopOrder from '../../docs/research/totalstack-data/default-troop-order.json';
import researchEquipmentJson from '../../docs/research/totalstack-data/equipment.json';
import researchHeroesJson from '../../docs/research/totalstack-data/heroes.json';
import researchMercenariesJson from '../../docs/research/totalstack-data/mercenaries.json';
import researchMonstersJson from '../../docs/research/totalstack-data/monsters.json';
import researchTempleJson from '../../docs/research/totalstack-data/temple-revival-cost-multiplier.json';
import researchTitlesJson from '../../docs/research/totalstack-data/titles.json';
import researchTroopsJson from '../../docs/research/totalstack-data/troops.json';
import {
  artifacts,
  captains,
  customMercenaryToUnit,
  equipment,
  events,
  getUnits,
  heroes,
  mercenaries,
  monsters,
  orders,
  otherPills,
  temple,
  titles,
  troops,
  unitById,
  unitsByPool,
  version,
  vip,
} from './index.ts';
import { TABLE_FILES, validateTable, type TableFile } from './schema.ts';
import { QUALITIES, type Quality } from './types.ts';

const TABLES: Record<TableFile, unknown> = {
  'artifacts.json': artifacts,
  'captains.json': captains,
  'equipment.json': equipment,
  'events.json': events,
  'heroes.json': heroes,
  'mercenaries.json': mercenaries,
  'monsters.json': monsters,
  'orders.json': orders,
  'otherPills.json': otherPills,
  'temple.json': temple,
  'titles.json': titles,
  'troops.json': troops,
  'version.json': version,
  'vip.json': vip,
};

/** The research capture the tables were reshaped from: test-only input, never imported by the app. */
const research = <T>(rows: unknown): T => rows as T;

interface ResearchUnit {
  id: string;
  name: string;
  pillLabel: string;
  tier: number;
  tags?: string[];
  health: number;
  strength: number;
  leadershipCost?: number;
  dominanceCost?: number;
  authorityCost?: number;
  strengthAgainst?: Record<string, number>;
  doubleDamageChance?: number;
  revivalCost: { gold: number };
  trainingTime?: { seconds: number };
  trainingCost?: { silver: number; dragonCoins?: number };
}

interface ResearchProgression {
  bonusKey: string;
  baseMultiplier: number;
  starBonuses: number[];
}
type ResearchCaptain = ResearchProgression & {
  strength?: ResearchProgression;
  specialStrength?: ResearchProgression;
  note?: string;
};

interface ResearchBonuses {
  healthBonuses?: Record<string, number>;
  strengthBonuses?: Record<string, number>;
  specialStrengthBonuses?: Record<string, number>;
  matchupStrengthBonuses?: { attackerCategory: string; defenderTarget: string; value: number }[];
}

const byId = <T extends { id: string }>(rows: T[]): Map<string, T> =>
  new Map(rows.map((row) => [row.id, row]));
const byName = <T extends { name: string }>(rows: T[]): Map<string, T> =>
  new Map(rows.map((row) => [row.name, row]));

// ---- 1. Schemas ------------------------------------------------------------------------------------
describe('schemas', () => {
  it.each(TABLE_FILES)('%s matches its schema', (file) => {
    expect(validateTable(file, TABLES[file])).toEqual([]);
  });

  it('exports one loader per table file', () => {
    expect(Object.keys(TABLES).sort()).toEqual([...TABLE_FILES].sort());
  });

  it('declares a data version and a verification date', () => {
    expect(version.dataVersion).toBeGreaterThan(0);
    expect(version.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---- 2. Cross-table integrity ------------------------------------------------------------------------
describe('integrity', () => {
  it('has unique ids inside each table', () => {
    for (const [label, rows] of [
      ['troops', troops],
      ['monsters', monsters],
      ['mercenaries', mercenaries],
      ['captains', captains],
      ['equipment', equipment],
      ['artifacts', artifacts],
      ['titles', titles],
      ['heroes', heroes],
      ['otherPills', otherPills],
      ['events', events],
    ] as const) {
      const ids = rows.map((row) => row.id);
      expect(`${label}: ${[...new Set(ids)].length}`).toBe(`${label}: ${ids.length}`);
    }
  });

  it('has unique ids across every unit table (units share one id space)', () => {
    const ids = getUnits().map((unit) => unit.id);
    expect([...new Set(ids)]).toHaveLength(ids.length);
  });

  it('has one vip record per level, from 0 upwards', () => {
    expect(vip.map((row) => row.level)).toEqual(vip.map((_row, index) => index));
  });

  it('lists every troop exactly once in the default kill order', () => {
    expect([...orders.troops].sort()).toEqual(troops.map((troop) => troop.id).sort());
  });

  it('lists every monster exactly once in the default kill order', () => {
    expect([...orders.monsters].sort()).toEqual(monsters.map((monster) => monster.id).sort());
  });

  it('lists every captain exactly once in the picker order', () => {
    expect([...orders.captains].sort()).toEqual(captains.map((captain) => captain.id).sort());
  });

  it('only references known mercenary events', () => {
    const known = new Set(events.map((event) => event.id));
    for (const mercenary of mercenaries) {
      if (mercenary.event)
        expect(known.has(mercenary.event), `${mercenary.id}: ${mercenary.event}`).toBe(true);
    }
  });

  it('gives every guardsman and specialist a category, and no engineer one', () => {
    for (const troop of troops) {
      if (troop.group === 'engineers') expect(troop.category, troop.id).toBeUndefined();
      else expect(troop.category, troop.id).toBeDefined();
    }
  });

  it('keeps specialists melee-only below tier 5', () => {
    for (const troop of troops) {
      if (troop.group !== 'specialist') continue;
      if (troop.tier < 5) expect(troop.category, troop.id).toBe('melee');
    }
  });

  it('has four monsters on every tier from 3 up', () => {
    const tiers = [...new Set(monsters.map((monster) => monster.tier))].sort((a, b) => a - b);
    expect(tiers[0]).toBe(3);
    expect(tiers).toEqual(tiers.map((_tier, index) => 3 + index));
    for (const tier of tiers) {
      expect(
        monsters.filter((monster) => monster.tier === tier),
        `tier ${tier}`,
      ).toHaveLength(4);
    }
  });

  it('gives every captain progression seven star steps', () => {
    for (const captain of captains) {
      for (const progression of [captain.health, captain.strength, captain.special]) {
        if (progression) expect(progression.stars, captain.id).toHaveLength(7);
      }
    }
  });

  it('uses contiguous level keys from 1 in every artifact level table', () => {
    for (const artifact of artifacts) {
      for (const progression of [artifact.health, artifact.strength, artifact.special]) {
        const base = progression?.levels?.base;
        if (!base) continue;
        const levels = Object.keys(base).map(Number);
        expect(Math.min(...levels), artifact.id).toBe(1);
        expect(levels, artifact.id).toEqual(levels.map((_level, index) => index + 1));
        expect(Math.max(...levels), artifact.id).toBe(60);
      }
    }
  });

  it('covers temple levels 1 to 45 with a growing multiplier', () => {
    const levels = Object.keys(temple.multiplier).map(Number);
    expect([Math.min(...levels), Math.max(...levels)]).toEqual([1, 45]);
    const values = levels.map((level) => temple.multiplier[String(level)] ?? 0);
    expect(values.every((value, index) => index === 0 || value > (values[index - 1] ?? 0))).toBe(true);
  });

  it('describes the two events the engine knows about', () => {
    const arachnes = events.find((event) => event.id === 'arachnes');
    expect(arachnes?.enemyFormation).toEqual({ melee: 2, ranged: 2, mounted: 2, flying: 2 });
    expect(arachnes?.activatesStrengthAgainst).toBe('swarmUnits');
    expect(events.find((event) => event.id === 'ragnarok-fenrir')?.strength).toBe(130);
    // Every swarm mercenary is gated behind Arachne's, and nothing else is.
    const swarm = mercenaries.filter((mercenary) => mercenary.strengthAgainst?.swarmUnits !== undefined);
    expect(swarm.length).toBeGreaterThan(0);
    expect(swarm.every((mercenary) => mercenary.event === 'arachnes')).toBe(true);
    expect(mercenaries.filter((mercenary) => mercenary.event).length).toBe(swarm.length);
  });

  it('marks Svyatogor as the hero that only counts when marching alone', () => {
    expect(byId(heroes).get('svyatogor')?.aloneOnly).toBe(true);
    expect(heroes.filter((hero) => hero.aloneOnly)).toHaveLength(1);
  });
});

// ---- 3. Units as the engine sees them ------------------------------------------------------------
describe('units', () => {
  it('flattens every table row into one unit', () => {
    expect(getUnits()).toHaveLength(troops.length + monsters.length + mercenaries.length);
  });

  it('gives a troop its group, category, race and army keys', () => {
    const griffin = unitById('battle-griffin-5');
    expect(griffin?.keys).toEqual(['guardsmen', 'flying', 'beast', 'army']);
    expect(griffin?.pool).toBe('leadership');
    expect(unitById('catapult-1')?.keys).toEqual(['engineers', 'army']);
  });

  it('gives a monster the monster group and its race', () => {
    const gargoyle = unitById('stone-gargoyle');
    expect(gargoyle?.group).toBe('monster');
    expect(gargoyle?.keys).toEqual(['monster', 'flying', 'giant', 'army']);
    expect(gargoyle?.pool).toBe('dominance');
  });

  it('gives a mercenary its tags plus army, and its group when it has one', () => {
    const sphynx = unitById('sphynx-7');
    expect(sphynx?.keys).toEqual(['guardsmen', 'flying', 'beast', 'army']);
    expect(sphynx?.group).toBe('guardsmen');
    expect(sphynx?.pool).toBe('authority');
    expect(unitById('wyvern-2')?.keys).toEqual(['monster', 'flying', 'army']);
  });

  it('defaults the missing double-damage chance and strength-against to nothing', () => {
    const spearman = unitById('spearman-1');
    expect(spearman?.doubleDamageChance).toBe(0);
    expect(unitById('ettin')?.strengthAgainst).toEqual({ mounted: 334 });
  });

  it('gives mercenaries no training cost (they cannot be retrained)', () => {
    for (const unit of getUnits()) {
      if (unit.kind === 'mercenary') expect(unit.training, unit.id).toBeUndefined();
      else expect(unit.training, unit.id).toBeDefined();
    }
  });

  it('groups units by housing pool', () => {
    const pools = unitsByPool();
    expect(pools.leadership).toHaveLength(troops.length);
    expect(pools.authority).toHaveLength(mercenaries.length);
    expect(pools.dominance).toHaveLength(monsters.length);
  });

  it('turns the custom-mercenary form into a unit', () => {
    const unit = customMercenaryToUnit({
      name: 'Swamp Hydra',
      health: 1_000_000,
      strength: 300_000,
      cost: 40,
      revivalGold: 250,
      doubleDamageChance: 5,
      role: 'monster',
      category: 'melee',
      race: 'beast',
      event: 'arachnes',
      strengthAgainst: { mounted: 70 },
    });
    expect(unit).toMatchObject({
      id: 'custom-swamp-hydra',
      label: 'SH',
      kind: 'mercenary',
      pool: 'authority',
      group: 'monster',
      keys: ['monster', 'melee', 'beast', 'army'],
      revival: { gold: 250 },
      event: 'arachnes',
    });
    expect(unit.training).toBeUndefined();
  });

  it('accepts a bare custom mercenary', () => {
    const unit = customMercenaryToUnit({
      name: 'Test Unit',
      health: 10,
      strength: 5,
      cost: 1,
      revivalGold: 2,
    });
    expect(unit.keys).toEqual(['army']);
    expect(unit.doubleDamageChance).toBe(0);
    expect(unit.strengthAgainst).toEqual({});
    expect(unit.tier).toBe(0);
  });
});

// ---- 4. Parity with the research capture -----------------------------------------------------------
describe('parity with docs/research/totalstack-data', () => {
  const researchTroops = byId(research<ResearchUnit[]>(researchTroopsJson));
  const researchMonsters = byId(research<ResearchUnit[]>(researchMonstersJson));
  const researchMercenaries = byId(research<ResearchUnit[]>(researchMercenariesJson));

  const training = (source: ResearchUnit) => ({
    seconds: source.trainingTime?.seconds,
    silver: source.trainingCost?.silver,
    ...(source.trainingCost?.dragonCoins === undefined
      ? {}
      : { dragonCoins: source.trainingCost.dragonCoins }),
  });

  it('keeps every troop number', () => {
    expect(troops).toHaveLength(researchTroops.size);
    for (const troop of troops) {
      const source = researchTroops.get(troop.id);
      expect(source, troop.id).toBeDefined();
      if (!source) continue;
      expect(
        {
          cost: troop.cost,
          health: troop.health,
          strength: troop.strength,
          revival: troop.revival,
          training: troop.training,
        },
        troop.id,
      ).toEqual({
        cost: source.leadershipCost,
        health: source.health,
        strength: source.strength,
        revival: { gold: source.revivalCost.gold },
        training: training(source),
      });
      expect(troop.strengthAgainst ?? {}, troop.id).toEqual(source.strengthAgainst ?? {});
      expect(troop.doubleDamageChance ?? 0, troop.id).toBe(source.doubleDamageChance ?? 0);
      expect([troop.tier, troop.label], troop.id).toEqual([source.tier, source.pillLabel.replace(/ /g, '')]);
    }
  });

  it('keeps every monster number', () => {
    expect(monsters).toHaveLength(researchMonsters.size);
    for (const monster of monsters) {
      const source = researchMonsters.get(monster.id);
      expect(source, monster.id).toBeDefined();
      if (!source) continue;
      expect(
        {
          cost: monster.cost,
          health: monster.health,
          strength: monster.strength,
          revival: monster.revival,
          training: monster.training,
        },
        monster.id,
      ).toEqual({
        cost: source.dominanceCost,
        health: source.health,
        strength: source.strength,
        revival: { gold: source.revivalCost.gold },
        training: training(source),
      });
      expect(monster.strengthAgainst ?? {}, monster.id).toEqual(source.strengthAgainst ?? {});
      expect([monster.tier, monster.label], monster.id).toEqual([
        source.tier,
        source.pillLabel.replace(/ /g, ''),
      ]);
    }
  });

  it('keeps every mercenary number', () => {
    expect(mercenaries).toHaveLength(researchMercenaries.size);
    for (const mercenary of mercenaries) {
      const source = researchMercenaries.get(mercenary.id);
      expect(source, mercenary.id).toBeDefined();
      if (!source) continue;
      expect(
        { cost: mercenary.cost, health: mercenary.health, strength: mercenary.strength },
        mercenary.id,
      ).toEqual({ cost: source.authorityCost, health: source.health, strength: source.strength });
      expect(mercenary.revival.gold, mercenary.id).toBe(source.revivalCost.gold);
      expect(mercenary.strengthAgainst ?? {}, mercenary.id).toEqual(source.strengthAgainst ?? {});
      expect(mercenary.doubleDamageChance ?? 0, mercenary.id).toBe(source.doubleDamageChance ?? 0);
      expect([mercenary.tier, mercenary.label], mercenary.id).toEqual([
        source.tier,
        source.pillLabel.replace(/ /g, ''),
      ]);
      expect([...mercenary.tags].sort(), mercenary.id).toEqual([...(source.tags ?? [])].sort());
    }
  });

  it('keeps every captain progression', () => {
    const source = research<Record<string, ResearchCaptain>>(researchCaptainsJson);
    const captainById = byId(captains);
    const same = (
      progression: { key: string; perLevel: number; stars: number[] } | undefined,
      raw: ResearchProgression | undefined,
    ) => {
      // A progression that is zero everywhere is left out of our tables: it is not a bonus.
      if (!raw || (raw.baseMultiplier === 0 && raw.starBonuses.every((value) => value === 0))) {
        return progression === undefined;
      }
      return (
        progression?.key === raw.bonusKey &&
        progression.perLevel === raw.baseMultiplier &&
        JSON.stringify(progression.stars) === JSON.stringify(raw.starBonuses)
      );
    };
    for (const [name, raw] of Object.entries(source)) {
      const captain = [...captainById.values()].find((row) => row.name === name);
      expect(captain, name).toBeDefined();
      if (!captain) continue;
      expect(same(captain.health, raw), `${name} health`).toBe(true);
      expect(same(captain.strength, raw.strength), `${name} strength`).toBe(true);
      expect(same(captain.special, raw.specialStrength), `${name} special`).toBe(true);
      expect(captain.note, `${name} note`).toBe(raw.note);
    }
  });

  it('lists the captains that have no progression yet', () => {
    const known = new Set(Object.keys(research<Record<string, ResearchCaptain>>(researchCaptainsJson)));
    const empty = captains.filter((captain) => !captain.health && !captain.strength && !captain.special);
    expect(empty.map((captain) => captain.name).sort()).toEqual(
      orders.captains
        .map((id) => byId(captains).get(id)?.name ?? id)
        .filter((name) => !known.has(name))
        .sort(),
    );
  });

  it('keeps every equipment bonus, quality by quality', () => {
    const source =
      research<({ name: string } & { bonusesByQuality: Record<string, ResearchBonuses> })[]>(
        researchEquipmentJson,
      );
    expect(equipment).toHaveLength(source.length);
    const pieces = byName(equipment);
    for (const raw of source) {
      const piece = pieces.get(raw.name);
      expect(piece, raw.name).toBeDefined();
      if (!piece) continue;
      expect(Object.keys(piece.byQuality), raw.name).toEqual(
        QUALITIES.filter((quality) => quality in raw.bonusesByQuality),
      );
      for (const [quality, bonuses] of Object.entries(raw.bonusesByQuality)) {
        const ours = piece.byQuality[quality as Quality];
        const where = `${raw.name} ${quality}`;
        expect(ours?.health ?? {}, where).toEqual(bonuses.healthBonuses ?? {});
        expect(ours?.strength ?? {}, where).toEqual(bonuses.strengthBonuses ?? {});
        expect(ours?.special ?? {}, where).toEqual(bonuses.specialStrengthBonuses ?? {});
        expect(ours?.matchup ?? [], where).toEqual(
          (bonuses.matchupStrengthBonuses ?? []).map((matchup) => ({
            attacker: matchup.attackerCategory,
            target: matchup.defenderTarget,
            value: matchup.value,
          })),
        );
      }
    }
  });

  it('keeps every title bonus, without the player-versus-player ones', () => {
    const source = research<({ name: string } & ResearchBonuses)[]>(researchTitlesJson);
    expect(titles).toHaveLength(source.length);
    const ours = byName(titles);
    for (const raw of source) {
      const title = ours.get(raw.name);
      expect(title, raw.name).toBeDefined();
      if (!title) continue;
      expect(title.bonus.health ?? {}, raw.name).toEqual(raw.healthBonuses ?? {});
      expect(title.bonus.strength ?? {}, raw.name).toEqual(raw.strengthBonuses ?? {});
      expect(title.bonus.special ?? {}, raw.name).toEqual(raw.specialStrengthBonuses ?? {});
    }
  });

  it('keeps the temple multipliers', () => {
    expect(temple.multiplier).toEqual(research<Record<string, number>>(researchTempleJson));
  });

  it('keeps the default kill orders and the captain order', () => {
    expect(orders.troops).toEqual(research<string[]>(researchTroopOrder));
    expect(orders.monsters).toEqual(research<string[]>(researchMonsterOrder));
    expect(orders.captains).toHaveLength(research<string[]>(researchCaptainOrder).length);
  });

  it('keeps the artifact level tables that were captured', () => {
    const heart = byId(artifacts).get('heart-of-the-forest');
    expect(heart?.strength?.levels?.base).toEqual(research<Record<string, number>>(researchArtifactBase));
    expect(heart?.strength?.levels?.star).toEqual(research<Record<string, number>>(researchArtifactStar));
  });

  it('keeps the hero and pill bonuses', () => {
    const source =
      research<{ name: string; healthArmyBonus: number; strengthArmyBonus: number }[]>(researchHeroesJson);
    expect(heroes.length + otherPills.length).toBe(source.length);
    for (const raw of source) {
      const name = raw.name.replace(/^Hero - /, '');
      const row = byName([...heroes, ...otherPills]).get(name);
      expect(row, name).toBeDefined();
      expect(row?.bonus.health?.army ?? 0, name).toBe(raw.healthArmyBonus);
      expect(row?.bonus.strength?.army ?? 0, name).toBe(raw.strengthArmyBonus);
    }
  });
});
