import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '../config';
import {
  allowedLineups,
  distinctCaptains,
  rankLineups,
  screenScore,
  screenLineups,
  shortlistLineups,
  lineupKey,
} from './captains';
import type { Pricer, ScreenLineup } from './captains';
import { emptyTotals } from './bonuses';
import type { BonusTotals } from './types';

const entry = (captainId: string, level = 10, star = 0) => ({
  id: `e-${captainId}-${level}`,
  captainId,
  level,
  star,
});
const everyone = (): boolean => true;
const ids = (lineups: { captainId: string }[][]): string[] =>
  lineups.map((lineup) => lineup.map((c) => c.captainId).join('+'));

describe('lineupKey', () => {
  test('is the same for the same captains in any order', () => {
    expect(lineupKey(['b', 'a', 'c'])).toBe(lineupKey(['c', 'b', 'a']));
    expect(lineupKey(['a', 'b'])).not.toBe(lineupKey(['a', 'c']));
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

  test('a captain at level 0 is not owned yet, unless the config asks for it', () => {
    const roster = [entry('a', 0), entry('b', 1)];
    expect(distinctCaptains(roster).map((c) => c.captainId)).toEqual(['b']);
    const was = CAMPAIGN.captainsIncludeUnowned;
    try {
      (CAMPAIGN as { captainsIncludeUnowned: boolean }).captainsIncludeUnowned = true;
      expect(distinctCaptains(roster).map((c) => c.captainId)).toEqual(['a', 'b']);
    } finally {
      (CAMPAIGN as { captainsIncludeUnowned: boolean }).captainsIncludeUnowned = was;
    }
  });

  test('a tie on level and star keeps the first entry', () => {
    const first = { ...entry('a', 4), id: 'first' };
    const second = { ...entry('a', 4), id: 'second' };
    expect(distinctCaptains([first, second])[0]?.id).toBe('first');
  });
});

describe('allowedLineups', () => {
  test('lists every combination of three, once, in index order', () => {
    const owned = ['a', 'b', 'c', 'd', 'e'].map((id) => entry(id));
    const lineups = allowedLineups(owned, everyone);
    expect(lineups).toHaveLength(10);
    expect(ids(lineups).slice(0, 3)).toEqual(['a+b+c', 'a+b+d', 'a+b+e']);
    expect(new Set(lineups.map((lineup) => lineupKey(lineup.map((c) => c.captainId)))).size).toBe(10);
  });

  test('twenty owned captains make the 1 140 the plan counts', () => {
    const owned = Array.from({ length: 20 }, (_, index) => entry(`c${String(index)}`));
    expect(allowedLineups(owned, everyone)).toHaveLength(1_140);
  });

  test('a captain entered twice is in a lineup once, as its strongest entry', () => {
    const owned = [entry('a', 5), entry('a', 8), entry('b'), entry('c'), entry('d')];
    const lineups = allowedLineups(owned, everyone);
    expect(lineups).toHaveLength(4);
    for (const lineup of lineups) expect(new Set(lineup.map((c) => c.captainId)).size).toBe(3);
    expect(lineups[0]?.[0]?.level).toBe(8);
  });

  test('the march type keeps out the captains it does not admit', () => {
    const owned = ['a', 'amanitore', 'b', 'c'].map((id) => entry(id));
    const lineups = allowedLineups(owned, (id) => id !== 'amanitore');
    expect(ids(lineups)).toEqual(['a+b+c']);
  });

  test('fewer than three allowed captains make the one set of them all; none, no lineup', () => {
    expect(ids(allowedLineups([entry('a'), entry('b')], everyone))).toEqual(['a+b']);
    expect(ids(allowedLineups([entry('a'), entry('b'), entry('c')], everyone))).toEqual(['a+b+c']);
    expect(allowedLineups([entry('a')], () => false)).toEqual([]);
    expect(allowedLineups([], everyone)).toEqual([]);
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

const lineups: ScreenLineup[] = [
  { key: 'now', totals: marked(10) },
  { key: 'weaker', totals: marked(0) },
  { key: 'better', totals: marked(30) },
  { key: 'best', totals: marked(60) },
];
const stops = [
  { pick: 'sweet-spot', counts: { a: 100 } },
  { pick: 'all-in', counts: { a: 300 } },
];

describe('screenLineups', () => {
  test('rates every lineup against the current one, which rates 0 on every reading', () => {
    const screens = screenLineups(lineups, 'now', stops, pricer, CAMPAIGN.markerRates);
    expect(screens.map((screen) => screen.key)).toEqual(['now', 'weaker', 'better', 'best']);
    expect(screens[0]).toEqual({ key: 'now', sized: 0, repriced: [0, 0] });
    const [, weaker, better, best] = screens;
    expect(weaker!.sized).toBeLessThan(0);
    expect(better!.sized).toBeGreaterThan(0);
    expect(best!.sized).toBeGreaterThan(better!.sized);
    expect(best!.repriced).toHaveLength(stops.length);
    expect(best!.repriced.every((rating) => rating > 0)).toBe(true);
  });

  test('a cost the lineup changes is weighed by the owner’s rates, not only the damage', () => {
    const dearer: Pricer = (totals, counts) => ({
      ...pricer(totals, counts),
      silver: totals.health.army === 30 ? 5_000 : 500,
    });
    const cheap = screenLineups(lineups, 'now', stops, pricer, CAMPAIGN.markerRates);
    const dear = screenLineups(lineups, 'now', stops, dearer, CAMPAIGN.markerRates);
    expect(dear[2]!.sized).toBeLessThan(cheap[2]!.sized);
  });

  test('refuses a set that does not hold the current lineup', () => {
    expect(() => screenLineups(lineups, 'gone', stops, pricer, CAMPAIGN.markerRates)).toThrow(
      /current lineup/,
    );
  });

  test('stops between lineups when asked, keeping the ones it has priced', () => {
    let polled = 0;
    const screens = screenLineups(lineups, 'now', stops, pricer, CAMPAIGN.markerRates, {
      shouldStop: () => (polled += 1) > 2,
    });
    expect(screens.map((screen) => screen.key)).toEqual(['now', 'weaker']);
  });

  test('with no stops there is only the sized reading', () => {
    const screens = screenLineups(lineups, 'now', [], pricer, CAMPAIGN.markerRates);
    expect(screens.every((screen) => screen.repriced.length === 0)).toBe(true);
    expect(screenScore(screens[3]!, 'repriced')).toBe(0);
  });
});

describe('rankLineups', () => {
  const screens = screenLineups(lineups, 'now', stops, pricer, CAMPAIGN.markerRates);

  test('orders by the chosen reading, best first, the current lineup among the rest at 0', () => {
    for (const kind of ['sized', 'repriced'] as const)
      expect(rankLineups(screens, kind).map((screen) => screen.key)).toEqual([
        'best',
        'better',
        'now',
        'weaker',
      ]);
  });

  test('the repriced reading scores a lineup by its best stop', () => {
    expect(screenScore({ key: 'x', sized: 1, repriced: [-2, 5, 3] }, 'repriced')).toBe(5);
    expect(screenScore({ key: 'x', sized: 1, repriced: [-2, 5, 3] }, 'sized')).toBe(1);
  });

  test('ties keep the screened order', () => {
    const tied = [
      { key: 'p', sized: 2, repriced: [] },
      { key: 'q', sized: 2, repriced: [] },
      { key: 'r', sized: 9, repriced: [] },
    ];
    expect(rankLineups(tied, 'sized').map((screen) => screen.key)).toEqual(['r', 'p', 'q']);
  });
});

describe('shortlistLineups', () => {
  const screens = [
    { key: 'now', sized: 0, repriced: [0] },
    { key: 'a', sized: 5, repriced: [1] },
    { key: 'b', sized: 4, repriced: [9] },
    { key: 'c', sized: 3, repriced: [8] },
    { key: 'd', sized: 2, repriced: [2] },
  ];

  test('never lists the current lineup, whatever it ranks', () => {
    const all = shortlistLineups([{ key: 'now', sized: 50, repriced: [50] }, ...screens.slice(1)], 'now', 9);
    expect(all).not.toContain('now');
    expect(all).toHaveLength(4);
  });

  test('takes one ranking, or both in turn with a lineup counted once', () => {
    expect(shortlistLineups(screens, 'now', 2, 'sized')).toEqual(['a', 'b']);
    expect(shortlistLineups(screens, 'now', 2, 'repriced')).toEqual(['b', 'c']);
    expect(shortlistLineups(screens, 'now', 3)).toEqual(['a', 'b', 'c']);
    expect(shortlistLineups(screens, 'now', 4)).toEqual(['a', 'b', 'c', 'd']);
  });

  test('is a count: zero asks for none, a large one for every other lineup', () => {
    expect(shortlistLineups(screens, 'now', 0)).toEqual([]);
    expect(shortlistLineups(screens, 'now', 99)).toHaveLength(4);
  });
});
