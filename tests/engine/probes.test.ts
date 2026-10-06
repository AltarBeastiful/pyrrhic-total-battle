import { describe, expect, it } from 'vitest';

import { BONUS_KEYS } from '../../src/data/types';
import { bonusProbe, genericProbes, housingProbe } from '../../src/engine/probes';
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
});
