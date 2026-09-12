/**
 * S-21 — effective unit stats. Every number below is a line of a captured TotalStack journal or of an
 * in-game report (fixtures `totalstack-2026-09-12-bonus-runs.json`, `ingame-2026-09-11-...md`).
 */
import { describe, expect, it } from 'vitest';

import { emptyTotals } from '../../src/engine/bonuses';
import { chooseTarget, effectiveUnit, hitDamage } from '../../src/engine/units';
import { STANDARD_ENEMY, totalsFrom } from '../helpers/request';
import { mercenary, monster, troop } from '../helpers/units';

const ZERO = emptyTotals();
const ARMY25_GUARD20 = totalsFrom({
  health: { army: 25, guardsmen: 20 },
  strength: { army: 25, guardsmen: 20 },
});

describe('health', () => {
  it('rounds the boosted HP per unit before multiplying by the count (ARC1 150 × 1.45 → 218)', () => {
    const archer = effectiveUnit(troop('ARC1'), ARMY25_GUARD20, STANDARD_ENEMY, []);
    expect(archer.hpPerUnit).toBe(218);
    expect(653 * archer.hpPerUnit).toBe(142_354); // journal line E>ARC1
  });

  it('gives specialists only the army bonus (SW1 150 × 1.25 → 188)', () => {
    expect(effectiveUnit(troop('SW1'), ARMY25_GUARD20, STANDARD_ENEMY, []).hpPerUnit).toBe(188);
    expect(473 * 188).toBe(88_924); // SW1 dies before SP1/ARC1 404 × 218 = 88,072
  });

  it('reproduces the Rider 3 unit sheet of the review §3 account (960 × 1.435 → 1,378)', () => {
    const totals = totalsFrom({ health: { guardsmen: 39.5, mounted: 1, army: 3 } });
    expect(effectiveUnit(troop('RD3'), totals, STANDARD_ENEMY, []).hpPerUnit).toBe(1378);
  });
});

describe('damage per hit', () => {
  it('puts the strength-against part on the BASE strength (ARC1 653 → 69,218 of which 21,876)', () => {
    const archer = effectiveUnit(troop('ARC1'), ARMY25_GUARD20, STANDARD_ENEMY, []);
    expect(archer.target).toBe('flying');
    expect(hitDamage(archer, 653)).toEqual({ damage: 69_218, features: 21_876 });
  });

  it('reproduces the zero-bonus journal lines of run ep-8stacks', () => {
    const line = (label: string, count: number) =>
      hitDamage(effectiveUnit(troop(label), ZERO, STANDARD_ENEMY, []), count);
    expect(line('ARC1', 655)).toEqual({ damage: 54_693, features: 21_943 });
    expect(line('RD1', 327)).toEqual({ damage: 53_955, features: 21_255 });
    expect(line('RD2', 181)).toEqual({ damage: 64_508, features: 31_928 });
    expect(line('ARC2', 361)).toEqual({ damage: 65_305, features: 32_815 });
    expect(line('SP2', 361)).toEqual({ damage: 51_659, features: 19_169 });
    expect(line('ARC3', 203)).toEqual({ damage: 81_525, features: 49_045 });
    expect(line('SP3', 202)).toEqual({ damage: 60_762, features: 28_442 });
    expect(line('RD3', 101)).toEqual({ damage: 79_507, features: 47_187 });
  });

  it('reproduces the monster and mercenary lines of run mp-bear', () => {
    const line = (unit: ReturnType<typeof monster>, count: number) =>
      hitDamage(effectiveUnit(unit, ZERO, STANDARD_ENEMY, []), count);
    expect(line(monster('ED'), 7)).toEqual({ damage: 89_775, features: 58_275 });
    expect(line(monster('BB'), 8)).toEqual({ damage: 76_128, features: 44_928 });
    expect(line(monster('SG'), 6)).toEqual({ damage: 88_920, features: 57_720 });
    expect(line(monster('WE'), 17)).toEqual({ damage: 78_812, features: 46_512 });
    expect(line(mercenary('BER5'), 1)).toEqual({ damage: 37_400, features: 15_400 });
  });
});

describe('events', () => {
  const RAGNAROK = totalsFrom(
    { health: { army: 25, guardsmen: 20 }, strength: { army: 25, guardsmen: 20 } },
    { eventStrength: 130 },
  );

  it('adds the event strength inside the same additive bracket (run bonus-event-ragnarok)', () => {
    const line = (unit: ReturnType<typeof troop>, count: number) =>
      hitDamage(effectiveUnit(unit, RAGNAROK, STANDARD_ENEMY, ['ragnarok-fenrir']), count).damage;
    expect(line(monster('ED'), 7)).toBe(138_600); // 7 × 4500 × (1 + 0.25 + 1.30) + 58,275
    expect(line(monster('BB'), 8)).toBe(124_488);
    expect(line(monster('SG'), 6)).toBe(137_280);
    expect(line(troop('SW1'), 473)).toBe(65_038);
    expect(line(troop('ARC1'), 404)).toBe(69_084);
    expect(line(troop('RD3'), 62)).toBe(83_526);
    // Engineers get no guardsmen bonus and no strength-against: 27 × 450 × 2.55.
    expect(line(troop('CAT2'), 27)).toBe(30_983);
  });

  it("switches swarmUnits strength-against on only while Arachne's is active", () => {
    const swarm = mercenary('combat-anteater-leader-2'); // strengthAgainst.swarmUnits = 4000
    const off = effectiveUnit(swarm, ZERO, STANDARD_ENEMY, []);
    const on = effectiveUnit(swarm, ZERO, STANDARD_ENEMY, ['arachnes']);
    expect(off.strengthAgainst).toBe(0);
    expect(on.strengthAgainst).toBe(4000);
  });
});

describe('targeting', () => {
  it('picks the best strength-against present in the formation', () => {
    expect(chooseTarget(troop('ARC1'), ZERO, STANDARD_ENEMY).target).toBe('flying');
    expect(chooseTarget(troop('SP1'), ZERO, STANDARD_ENEMY).target).toBe('mounted');
    expect(chooseTarget(troop('RD1'), ZERO, STANDARD_ENEMY).target).toBe('ranged');
    expect(chooseTarget(monster('SG'), ZERO, STANDARD_ENEMY).target).toBe('melee');
  });

  it('falls back to the melee squad when no bonus applies (engineers, absent squads)', () => {
    const catapult = effectiveUnit(troop('CAT2'), ZERO, STANDARD_ENEMY, []);
    expect(catapult.target).toBe('melee');
    expect(catapult.strengthAgainst).toBe(0);
    expect(hitDamage(catapult, 23).features).toBe(0);

    const noRanged = { flying: 1, melee: 1, mounted: 1, ranged: 0 };
    expect(chooseTarget(troop('RD1'), ZERO, noRanged).target).toBe('melee');
  });

  it('adds an equipment matchup bonus to the strength-against of that pairing', () => {
    const totals = totalsFrom({ matchup: [{ attacker: 'melee', target: 'mounted', value: 39 }] });
    const spearman = effectiveUnit(troop('SP1'), totals, STANDARD_ENEMY, []);
    expect(spearman.target).toBe('mounted');
    expect(spearman.strengthAgainst).toBe(39 + 39); // own 39 % + matchup 39 %
  });
});

describe('special keys', () => {
  it('applies armyStrengthAgainstEpicMonsters to every target', () => {
    const totals = totalsFrom({ special: { armyStrengthAgainstEpicMonsters: 50 } });
    expect(effectiveUnit(troop('ARC1'), totals, STANDARD_ENEMY, []).strengthAgainst).toBe(67 + 50);
    expect(effectiveUnit(troop('CAT2'), totals, STANDARD_ENEMY, []).strengthAgainst).toBe(50);
  });

  it("keeps a mercenary's own epicMonsters line (EMH 6 → +609 % whatever it hits)", () => {
    const hunter = effectiveUnit(mercenary('EMH6'), ZERO, STANDARD_ENEMY, []);
    expect(hunter.target).toBe('melee');
    expect(hunter.strengthAgainst).toBe(609);
  });

  it('adds the unit, group and army double-damage chances', () => {
    const totals = totalsFrom({
      special: { doubleDamageChance: 3, guardsmenDoubleDamageChance: 2 },
    });
    expect(effectiveUnit(troop('RD3'), totals, STANDARD_ENEMY, []).doubleDamageChance).toBe(10);
    expect(effectiveUnit(troop('SW1'), totals, STANDARD_ENEMY, []).doubleDamageChance).toBe(3);
  });

  it('adds the army and race strike-two-squads chances', () => {
    const totals = totalsFrom({
      special: { strikeTwoSquadsChance: 5, elementalsStrikeTwoSquadsChance: 4 },
    });
    expect(effectiveUnit(monster('WE'), totals, STANDARD_ENEMY, []).strikeTwoSquadsChance).toBe(9);
    expect(effectiveUnit(monster('SG'), totals, STANDARD_ENEMY, []).strikeTwoSquadsChance).toBe(5);
  });
});
