/**
 * **The other questions' pure parts** (W17 step D): which question a probe answers, the probes the pass asks for
 * and what it fixes beside them, and the silver slope that reads the loss the advisor's clamped gain hides.
 */
import { describe, expect, test } from 'vitest';

import type { ShownBill, ShownMarch } from '@/engine/advisor';
import { emptyTotals } from '@/engine';
import type { CampaignInput } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import { otherProbes, questionOf, silverSlope } from './otherSearch';

const march = (damage: number): ShownMarch => ({
  counts: {},
  bill: { damage, silver: 0, gold: 0, hired: 0, dragonCoins: 0, seconds: 0 } satisfies ShownBill,
  deaths: [],
});

describe('questionOf', () => {
  test('tells the six lists apart by id, and a generic probe is none of them', () => {
    expect(questionOf('sweep:dominance:8')).toBe('dominance');
    expect(questionOf('sweep:leadership:8')).toBe('leadership');
    expect(questionOf('campaign:tier:troop guardsmen tier 6')).toBe('tier');
    expect(questionOf('campaign:merc:25')).toBe('merc');
    expect(questionOf('campaign:horizon:5')).toBe('horizon');
    expect(questionOf('campaign:silver:plus')).toBe('silver');
    expect(questionOf('health:ranged')).toBeNull();
  });
});

describe('silverSlope', () => {
  const stop = (current: number, repriced: number, replanned: number | null) => ({
    current: march(current),
    repriced: march(repriced),
    replanned: replanned === null ? null : march(replanned),
  });

  test('a loss is negative per million silver, off the re-planned stop where there is one', () => {
    expect(silverSlope(stop(100, 100, 90), 2_000_000)).toBeCloseTo(-5);
  });

  test('falls back to the re-priced stop; a flat side is 0', () => {
    expect(silverSlope(stop(100, 104, null), 1_000_000)).toBeCloseTo(4);
    expect(silverSlope(stop(100, 100, null), 1_000_000)).toBe(0);
  });

  test('no silver moved, or no damage, has no reading', () => {
    expect(silverSlope(stop(100, 100, null), 0)).toBeNull();
    expect(silverSlope(stop(0, 0, null), 1_000_000)).toBeNull();
  });
});

describe('otherProbes', () => {
  const request = { units: [], caps: {}, totals: emptyTotals() } as unknown as StackRequest;
  const base: CampaignInput = { request, marchTarget: 4 };

  test('the horizon of the baseline is not asked, and no caps means no merc probes', () => {
    const { probes, facts } = otherProbes(base, 10_000_000);
    const ids = probes.map((probe) => probe.id);
    expect(ids.filter((id) => id.startsWith('campaign:horizon:'))).toEqual([
      'campaign:horizon:3',
      'campaign:horizon:5',
    ]);
    expect(ids.some((id) => id.startsWith('campaign:merc:'))).toBe(false);
    expect(facts.horizon).toBe(4);
    expect(facts.silverBudgeted).toBe(false);
    expect(facts.silverDelta).toBe(1_000_000);
  });

  test('a silver budget asks both sides; caps ask the merc steps and keep what each adds', () => {
    const { probes, facts } = otherProbes(
      { ...base, silverBudget: 5_000_000, request: { ...request, caps: { m1: 1000 } } },
      10_000_000,
    );
    const ids = probes.map((probe) => probe.id);
    expect(ids).toContain('campaign:silver:plus');
    expect(ids).toContain('campaign:silver:minus');
    expect(facts.silverBudgeted).toBe(true);
    expect(facts.mercAdded['campaign:merc:10']).toBe(100);
  });
});
