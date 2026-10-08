import { describe, expect, it } from 'vitest';

import { BONUS_KEYS } from '../../src/data/types';
import { bonusProbe, genericProbes, housingProbe, userProbe } from '../../src/engine/probes';
import { type UserUpgrade, userUpgradeSchema } from '../../src/state/schema';
import { makeRequest, totalsFrom } from '../helpers/request';

const request = () =>
  makeRequest({
    units: [],
    housing: { leadership: 3000, authority: 1200, dominance: 200 },
    totals: totalsFrom({ health: { army: 25, mounted: 10 }, strength: { guardsmen: 5 } }),
  });

describe('probes (W17 C1)', () => {
  it('offers 13 + 13 + 3 probes with unique, stable ids', () => {
    const probes = genericProbes();
    expect(probes).toHaveLength(BONUS_KEYS.length * 2 + 3);
    const ids = probes.map((probe) => probe.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(genericProbes().map((probe) => probe.id)).toEqual(ids);
    expect(ids).toContain('health:army');
    expect(ids).toContain('strength:mounted');
    expect(ids.slice(-3)).toEqual(['housing:leadership', 'housing:authority', 'housing:dominance']);
  });

  it('never mutates its input, and builds new objects where it changes something', () => {
    const req = request();
    const frozen = structuredClone(req);
    const deepFreeze = (value: unknown): void => {
      if (value && typeof value === 'object') {
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
      }
    };
    deepFreeze(req);
    for (const probe of genericProbes()) {
      const out = probe.apply(req);
      expect(out).not.toBe(req);
      expect(req).toEqual(frozen);
    }
  });

  it('adds one point to the named line and touches nothing else', () => {
    const req = request();
    const out = bonusProbe('health', 'mounted').apply(req);
    expect(out.totals).not.toBe(req.totals);
    expect(out.totals.health.mounted).toBe(11);
    expect(out.totals.health.army).toBe(25);
    expect(out.totals.strength).toBe(req.totals.strength);
    expect(out.units).toBe(req.units);
    const strength = bonusProbe('strength', 'guardsmen').apply(req);
    expect(strength.totals.strength.guardsmen).toBe(6);
    expect(strength.totals.health).toBe(req.totals.health);
  });

  it('raises a housing pool by one percent of it, at least one slot', () => {
    const req = request();
    expect(housingProbe('leadership').apply(req).housing).toEqual({
      leadership: 3030,
      authority: 1200,
      dominance: 200,
    });
    expect(
      housingProbe('dominance').apply({ ...req, housing: { ...req.housing, dominance: 10 } }).housing
        .dominance,
    ).toBe(11);
  });

  describe('typed upgrades (W17 C2)', () => {
    const talent: UserUpgrade = {
      id: 'u1',
      label: 'Hero talent tier 4',
      deltas: { health: { mounted: 2 }, strength: { mounted: 1, guardsmen: 0.5 } },
      cost: { amount: 3, unit: 'talent points' },
    };

    it('adds every bonus delta of the entry to its own line, sharing what it does not touch', () => {
      const req = request();
      const out = userProbe(talent).apply(req);
      expect(out.totals.health.mounted).toBe(12);
      expect(out.totals.health.army).toBe(25);
      expect(out.totals.strength.mounted).toBe(1);
      expect(out.totals.strength.guardsmen).toBe(5.5);
      expect(out.housing).toBe(req.housing);
      expect(out.units).toBe(req.units);
      const strengthOnly = userProbe({ id: 'u2', label: 'AM', deltas: { strength: { guardsmen: 3 } } }).apply(
        req,
      );
      expect(strengthOnly.totals.strength.guardsmen).toBe(8);
      expect(strengthOnly.totals.health).toBe(req.totals.health);
    });

    it('adds housing as slots, never below zero, and leaves the totals shared', () => {
      const req = request();
      const out = userProbe({
        id: 'u3',
        label: 'Barracks',
        deltas: { housing: { authority: 150, dominance: -500 } },
      }).apply(req);
      expect(out.housing).toEqual({ leadership: 3000, authority: 1350, dominance: 0 });
      expect(out.totals).toBe(req.totals);
    });

    it('never mutates its input', () => {
      const req = request();
      const frozen = structuredClone(req);
      Object.freeze(req.totals.health);
      Object.freeze(req.totals.strength);
      Object.freeze(req.housing);
      const mixed = { ...talent, deltas: { ...talent.deltas, housing: { leadership: 10 } } };
      userProbe(mixed).apply(req);
      expect(req).toEqual(frozen);
    });

    it('gives one probe per entry with a stable id in the user family and the typed label', () => {
      const entries: UserUpgrade[] = [
        talent,
        { id: 'u2', label: 'AM step', deltas: { strength: { army: 1 } } },
      ];
      const probes = entries.map(userProbe);
      expect(probes.map((probe) => probe.id)).toEqual(['user:u1', 'user:u2']);
      expect(entries.map(userProbe).map((probe) => probe.id)).toEqual(['user:u1', 'user:u2']);
      expect(probes.every((probe) => probe.family === 'user')).toBe(true);
      expect(probes[0]!.label).toBe('Hero talent tier 4');
      const generic = new Set(genericProbes().map((probe) => probe.id));
      expect(probes.some((probe) => generic.has(probe.id))).toBe(false);
    });

    it('cannot be built from an entry with no deltas: the schema refuses it', () => {
      expect(userUpgradeSchema.safeParse({ id: 'u4', label: 'Nothing', deltas: {} }).success).toBe(false);
      expect(
        userUpgradeSchema.safeParse({ id: 'u4', label: 'Nothing', deltas: { health: {}, housing: {} } })
          .success,
      ).toBe(false);
      expect(userUpgradeSchema.safeParse(talent).success).toBe(true);
    });
  });
});
