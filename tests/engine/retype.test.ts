import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { marchResult } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import { commonScenarios } from './plan-scenarios';

const RATES = CAMPAIGN.markerRates;
const request = (): StackRequest => {
  const scenario = commonScenarios().find((s) => s.label.startsWith('the 4 000-leadership case'));
  if (!scenario) throw new Error('the 4 000-leadership case is gone from the benchmark');
  return scenario.request;
};
/** The sweet spot's march on the 4 000-leadership case (the bar at dbe8d8f), and its hired stacks. */
const HIRED = { 'epic-monster-hunter-6': 10, 'arbalester-6': 10, 'legionary-6': 11, 'chariot-6': 6 };
const MARCH: Record<string, number> = {
  'swordsman-1': 564,
  'archer-1': 752,
  'spearman-1': 562,
  'rider-1': 375,
  'archer-2': 416,
  'spearman-2': 310,
  'rider-2': 207,
  'rider-3': 116,
  ...HIRED,
};
const leadershipOf = (req: StackRequest, counts: Record<string, number>): number =>
  req.units.filter((u) => u.pool === 'leadership').reduce((sum, u) => sum + (counts[u.id] ?? 0) * u.cost, 0);
const troopHp = (req: StackRequest, counts: Record<string, number>): number[] =>
  marchResult(req, counts)
    .result.stacks.filter((s) => s.pool === 'leadership')
    .map((s) => s.totalHp)
    .sort((a, b) => b - a);

describe('retypeMarch — the rated re-typing (W11 §3.1)', () => {
  it('rates positive, holds the damage and keeps every hired stack', () => {
    const req = request();
    const r = retypeMarch(req, MARCH, RATES);
    expect(r).not.toBeNull();
    if (!r) return;
    const before = marchBill(req, MARCH);
    const after = marchBill(req, r.counts);
    expect(r.rating).toBeGreaterThan(0);
    expect(r.rating).toBeCloseTo(rate(before, after, RATES), 9);
    expect(after.damage).toBeGreaterThanOrEqual(before.damage);
    for (const [id, count] of Object.entries(HIRED)) expect(r.counts[id]).toBe(count);
    expect(after.hired).toBe(before.hired);
    expect(after.gold).toBe(before.gold);
    expect(r.cut).toBe(false);
  });

  it('sizes each troop stack to at least its slot’s HP', () => {
    const req = request();
    const r = retypeMarch(req, MARCH, RATES);
    if (!r) throw new Error('expected a re-typing');
    const was = troopHp(req, MARCH);
    const now = troopHp(req, r.counts);
    expect(now).toHaveLength(was.length);
    now.forEach((hp, i) => expect(hp).toBeGreaterThanOrEqual(was[i] ?? Infinity));
  });

  it('respects the leadership', () => {
    const req = request();
    const tight = { ...req, housing: { ...req.housing, leadership: leadershipOf(req, MARCH) } };
    const r = retypeMarch(tight, MARCH, RATES);
    if (r) expect(leadershipOf(tight, r.counts)).toBeLessThanOrEqual(tight.housing.leadership);
    const none = { ...req, housing: { ...req.housing, leadership: 0 } };
    expect(retypeMarch(none, MARCH, RATES)).toBeNull();
  });

  it('is null when nothing beats the march', () => {
    const req = request();
    // No troop stack to re-type.
    expect(retypeMarch(req, HIRED, RATES)).toBeNull();
    // One troop type in the account: the only assignment is the march itself, which rates 0.
    const lone = {
      ...req,
      units: req.units.filter((u) => u.pool !== 'leadership' || u.id === 'archer-1'),
    };
    expect(retypeMarch(lone, { 'archer-1': 752, ...HIRED }, RATES)).toBeNull();
  });

  it('honours the deadline', () => {
    const req = request();
    expect(retypeMarch(req, MARCH, RATES, { deadline: Date.now() - 1 })).toBeNull();
    const open = retypeMarch(req, MARCH, RATES, { deadline: Date.now() + 60_000 });
    expect(open?.counts).toEqual(retypeMarch(req, MARCH, RATES)?.counts);
  });
});
