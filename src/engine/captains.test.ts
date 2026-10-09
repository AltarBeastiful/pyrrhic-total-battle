import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '../config';
import { allowedTrios, distinctCaptains, rankTrios, screenScore, screenTrios, trioKey } from './captains';
import type { Pricer, ScreenTrio } from './captains';
import { emptyTotals } from './bonuses';
import type { BonusTotals } from './types';

const entry = (captainId: string, level = 10, star = 0) => ({
  id: `e-${captainId}-${level}`,
  captainId,
  level,
  star,
});
const everyone = (): boolean => true;
const ids = (trios: { captainId: string }[][]): string[] =>
  trios.map((trio) => trio.map((c) => c.captainId).join('+'));

describe('trioKey', () => {
  test('is the same for the same captains in any order', () => {
    expect(trioKey(['b', 'a', 'c'])).toBe(trioKey(['c', 'b', 'a']));
    expect(trioKey(['a', 'b'])).not.toBe(trioKey(['a', 'c']));
  });
});

describe('distinctCaptains', () => {
  test('keeps one entry per captain, the strongest, in first-seen order', () => {
    const owned = [entry('a', 5), entry('b', 9), entry('a', 7), entry('b', 9, 2), entry('c', 3)];
    expect(distinctCaptains(owned).map((c) => [c.captainId, c.level, c.star])).toEqual([
      ['a', 7, 0],
      ['b', 9, 2],
      ['c', 3, 0],
    ]);
  });

  test('a tie on level and star keeps the first entry', () => {
    const first = { ...entry('a', 4), id: 'first' };
    const second = { ...entry('a', 4), id: 'second' };
    expect(distinctCaptains([first, second])[0]?.id).toBe('first');
  });
});

describe('allowedTrios', () => {
  test('lists every combination of three, once, in index order', () => {
    const owned = ['a', 'b', 'c', 'd', 'e'].map((id) => entry(id));
    const trios = allowedTrios(owned, everyone);
    expect(trios).toHaveLength(10);
    expect(ids(trios).slice(0, 3)).toEqual(['a+b+c', 'a+b+d', 'a+b+e']);
    expect(new Set(trios.map((trio) => trioKey(trio.map((c) => c.captainId)))).size).toBe(10);
  });

  test('twenty owned captains make the 1 140 the plan counts', () => {
    const owned = Array.from({ length: 20 }, (_, index) => entry(`c${String(index)}`));
    expect(allowedTrios(owned, everyone)).toHaveLength(1_140);
  });

  test('a captain entered twice is in a trio once, as its strongest entry', () => {
    const owned = [entry('a', 5), entry('a', 8), entry('b'), entry('c'), entry('d')];
    const trios = allowedTrios(owned, everyone);
    expect(trios).toHaveLength(4);
    for (const trio of trios) expect(new Set(trio.map((c) => c.captainId)).size).toBe(3);
    expect(trios[0]?.[0]?.level).toBe(8);
  });

  test('the march type keeps out the captains it does not admit', () => {
    const owned = ['a', 'amanitore', 'b', 'c'].map((id) => entry(id));
    const trios = allowedTrios(owned, (id) => id !== 'amanitore');
    expect(ids(trios)).toEqual(['a+b+c']);
  });

  test('fewer than three allowed captains make the one set of them all; none, no trio', () => {
    expect(ids(allowedTrios([entry('a'), entry('b')], everyone))).toEqual(['a+b']);
    expect(ids(allowedTrios([entry('a'), entry('b'), entry('c')], everyone))).toEqual(['a+b+c']);
    expect(allowedTrios([entry('a')], () => false)).toEqual([]);
    expect(allowedTrios([], everyone)).toEqual([]);
  });
});

/** Totals whose `health.army` carries a marker value, so a fake pricer can read it back. */
function marked(value: number): BonusTotals {
  const totals = emptyTotals();
  totals.health.army = value;
  return totals;
}

/** A bill whose damage is the marker (plus the counts' total, when re-pricing); every cost is flat. */
const pricer: Pricer = (totals, counts) => ({
  damage:
    1_000 +
    totals.health.army * 10 +
    (counts === null ? 0 : Object.values(counts).reduce((a, b) => a + b, 0)),
  silver: 500,
  gold: 0,
  hired: 0,
  dragonCoins: 0,
  seconds: 100,
});

const trios: ScreenTrio[] = [
  { key: 'now', totals: marked(10) },
  { key: 'weaker', totals: marked(0) },
  { key: 'better', totals: marked(30) },
  { key: 'best', totals: marked(60) },
];
const stops = [
  { pick: 'sweet-spot', counts: { a: 100 } },
  { pick: 'all-in', counts: { a: 300 } },
];

describe('screenTrios', () => {
  test('rates every trio against the current one, which rates 0 on every reading', () => {
    const screens = screenTrios(trios, 'now', stops, pricer, CAMPAIGN.markerRates);
    expect(screens.map((screen) => screen.key)).toEqual(['now', 'weaker', 'better', 'best']);
    expect(screens[0]).toEqual({ key: 'now', sized: 0, repriced: [0, 0] });
    const [, weaker, better, best] = screens;
    expect(weaker!.sized).toBeLessThan(0);
    expect(better!.sized).toBeGreaterThan(0);
    expect(best!.sized).toBeGreaterThan(better!.sized);
    expect(best!.repriced).toHaveLength(stops.length);
    expect(best!.repriced.every((rating) => rating > 0)).toBe(true);
  });

  test('a cost the trio changes is weighed by the owner’s rates, not only the damage', () => {
    const dearer: Pricer = (totals, counts) => ({
      ...pricer(totals, counts),
      silver: totals.health.army === 30 ? 5_000 : 500,
    });
    const cheap = screenTrios(trios, 'now', stops, pricer, CAMPAIGN.markerRates);
    const dear = screenTrios(trios, 'now', stops, dearer, CAMPAIGN.markerRates);
    expect(dear[2]!.sized).toBeLessThan(cheap[2]!.sized);
  });

  test('refuses a set that does not hold the current trio', () => {
    expect(() => screenTrios(trios, 'gone', stops, pricer, CAMPAIGN.markerRates)).toThrow(/current trio/);
  });

  test('stops between trios when asked, keeping the ones it has priced', () => {
    let polled = 0;
    const screens = screenTrios(trios, 'now', stops, pricer, CAMPAIGN.markerRates, {
      shouldStop: () => (polled += 1) > 2,
    });
    expect(screens.map((screen) => screen.key)).toEqual(['now', 'weaker']);
  });

  test('with no stops there is only the sized reading', () => {
    const screens = screenTrios(trios, 'now', [], pricer, CAMPAIGN.markerRates);
    expect(screens.every((screen) => screen.repriced.length === 0)).toBe(true);
    expect(screenScore(screens[3]!, 'repriced')).toBe(0);
  });
});

describe('rankTrios', () => {
  const screens = screenTrios(trios, 'now', stops, pricer, CAMPAIGN.markerRates);

  test('orders by the chosen reading, best first, the current trio among the rest at 0', () => {
    for (const kind of ['sized', 'repriced'] as const)
      expect(rankTrios(screens, kind).map((screen) => screen.key)).toEqual([
        'best',
        'better',
        'now',
        'weaker',
      ]);
  });

  test('the repriced reading scores a trio by its best stop', () => {
    expect(screenScore({ key: 'x', sized: 1, repriced: [-2, 5, 3] }, 'repriced')).toBe(5);
    expect(screenScore({ key: 'x', sized: 1, repriced: [-2, 5, 3] }, 'sized')).toBe(1);
  });

  test('ties keep the screened order', () => {
    const tied = [
      { key: 'p', sized: 2, repriced: [] },
      { key: 'q', sized: 2, repriced: [] },
      { key: 'r', sized: 9, repriced: [] },
    ];
    expect(rankTrios(tied, 'sized').map((screen) => screen.key)).toEqual(['r', 'p', 'q']);
  });
});
