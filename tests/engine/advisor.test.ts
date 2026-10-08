/**
 * W17 C3 — **the advisor's reading** (`src/engine/advisor.ts`, `docs/plans/progression-advisor.md` §4), on
 * hand-built marches: the gain is the best of re-priced, re-planned and current on the owner's rating, so it is
 * never a loss; the clamp reads "no gain" and is said; `noise`, `reorder` and `worse` say what the three
 * readings did; a row is read stop by stop and headlined on the selected stop. Phase 04b: what the gain costs
 * the march is read off the same reading the gain is, and its training time is printed only past the bound.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { mulberry32 } from '@/engine';
import {
  costChange,
  gainPerCost,
  gainReading,
  headlineOf,
  outstandingSeconds,
  probeInfo,
  rankAdvice,
  rankingOrder,
  readProbe,
  readStop,
  type AdvisorRow,
  type ShownBill,
  type ShownMarch,
  type ShownStop,
  type StopAdvice,
} from '@/engine/advisor';
import type { PlanPick } from '@/engine/plan';
import { bonusProbe, userProbe } from '@/engine/probes';

const RATES = CAMPAIGN.markerRates;
const ORDER = ['rider', 'spearman', 'hunter'];

/** A march of 1 000 000 damage and round costs; `bill` overrides any of them. */
function march(bill: Partial<ShownBill> = {}, deaths: string[] = ORDER): ShownMarch {
  return {
    counts: { rider: 100, spearman: 200, hunter: 50 },
    bill: {
      damage: 1_000_000,
      silver: 100_000,
      gold: 1_000,
      hired: 5,
      dragonCoins: 0,
      seconds: 3_600,
      ...bill,
    },
    deaths,
  };
}

function stop(pick: PlanPick, shown: ShownMarch = march()): ShownStop {
  return { pick, counts: { rider: 100, spearman: 200, hunter: 50 }, march: shown };
}

const CURRENT = stop('sweet-spot');

describe('readStop: one probe on one stop', () => {
  test('the gain is the best reading on the rating, the re-planned stop where it rates highest', () => {
    const read = readStop(CURRENT, march({ damage: 1_010_000 }), march({ damage: 1_020_000 }), RATES);
    expect(read.repricedRating).toBeCloseTo(1, 9);
    expect(read.replannedRating).toBeCloseTo(2, 9);
    expect(read.gain).toBeCloseTo(2, 9);
    expect(read.from).toBe('replanned');
    expect(read.damagePercent).toBeCloseTo(2, 9);
    expect(read).toMatchObject({ clamped: false, noise: false, reorder: false, worse: false });
  });

  test('a cost saved at the same damage is a gain too: 5 % of the silver is one percent of damage', () => {
    const read = readStop(CURRENT, march({ silver: 95_000 }), null, RATES);
    expect(read.gain).toBeCloseTo(1, 9);
    expect(read.from).toBe('repriced');
    expect(read.damagePercent).toBe(0);
  });

  test('a re-planned stop below the re-priced one is noise, and the re-priced reading is the gain', () => {
    const read = readStop(CURRENT, march({ damage: 1_010_000 }), march({ damage: 1_005_000 }), RATES);
    expect(read.gain).toBeCloseTo(1, 9);
    expect(read.from).toBe('repriced');
    expect(read.noise).toBe(true);
    expect(read.worse).toBe(false);
  });

  test('both readings below current: no gain by the clamp, said, with the worse re-plan and its figure', () => {
    const replanned = march({ damage: 500_000 });
    const read = readStop(CURRENT, march({ damage: 990_000 }), replanned, RATES);
    expect(read.gain).toBe(0);
    expect(read.from).toBeNull();
    expect(read.damagePercent).toBe(0);
    expect(read.clamped).toBe(true);
    expect(read.worse).toBe(true);
    expect(read.noise).toBe(true);
    expect(read.replanned).toBe(replanned);
    expect(read.replannedRating).toBeCloseTo(-50, 9);
  });

  test('a probe that changes nothing gains nothing, and that is not the clamp', () => {
    const read = readStop(CURRENT, march(), march(), RATES);
    expect(read.gain).toBe(0);
    expect(read.from).toBeNull();
    expect(read).toMatchObject({ clamped: false, noise: false, reorder: false, worse: false });
  });

  test('a re-plan that loses is worse even where the re-priced reading gains', () => {
    const read = readStop(CURRENT, march({ damage: 1_010_000 }), march({ damage: 900_000 }), RATES);
    expect(read.gain).toBeCloseTo(1, 9);
    expect(read.from).toBe('repriced');
    expect(read.worse).toBe(true);
    expect(read.clamped).toBe(false);
  });

  test('reorder: the re-priced march dies in another order than the current one', () => {
    const swapped = march({ damage: 1_002_000 }, ['spearman', 'rider', 'hunter']);
    expect(readStop(CURRENT, swapped, null, RATES).reorder).toBe(true);
    // The re-planned march is another march altogether: its order is not what the flag reads.
    expect(readStop(CURRENT, march(), swapped, RATES).reorder).toBe(false);
  });

  test('with no re-planned stop the gain is the re-priced reading, and neither noise nor worse is said', () => {
    const read = readStop(CURRENT, march({ damage: 980_000 }), null, RATES);
    expect(read.replanned).toBeNull();
    expect(read.replannedRating).toBeNull();
    expect(read.gain).toBe(0);
    expect(read.clamped).toBe(true);
    expect(read).toMatchObject({ noise: false, worse: false });
  });

  test('the gain is never below 0 and is always the best of the two ratings', () => {
    const random = mulberry32(20_261_008);
    const vary = (): ShownMarch =>
      march({
        damage: 1_000_000 * (0.5 + random()),
        silver: 100_000 * (0.5 + random()),
        gold: 1_000 * (0.5 + random()),
        hired: Math.floor(10 * random()),
        dragonCoins: Math.floor(100 * random()),
        seconds: 3_600 * (0.5 + random()),
      });
    for (let trial = 0; trial < 500; trial += 1) {
      const current = stop('sweet-spot', vary());
      const replanned = random() < 0.2 ? null : vary();
      const read = readStop(current, vary(), replanned, RATES);
      const best = Math.max(read.repricedRating, read.replannedRating ?? Number.NEGATIVE_INFINITY);
      expect(read.gain).toBeGreaterThanOrEqual(0);
      expect(read.gain).toBe(Math.max(0, best));
      expect(read.clamped).toBe(best < 0);
    }
  });
});

describe('readProbe: one probe on every stop of the bar', () => {
  const probe = bonusProbe('health', 'mounted');

  test('reads the baseline bar in its own order, each stop against the stop of the same kind', () => {
    const baseline = [stop('silver-saver'), stop('sweet-spot'), stop('steady-max')];
    const upgraded = [
      stop('steady-max', march({ damage: 1_030_000 })),
      stop('silver-saver', march({ damage: 1_010_000 })),
    ];
    const row = readProbe(probe, baseline, upgraded, () => march(), RATES);
    expect(row.stops.map((advice) => advice.pick)).toEqual(['silver-saver', 'sweet-spot', 'steady-max']);
    expect(row.stops.map((advice) => advice.gain.toFixed(6))).toEqual(['1.000000', '0.000000', '3.000000']);
    // The upgraded bar has no sweet spot: nothing re-planned to read there.
    expect(row.stops[1]?.replanned).toBeNull();
  });

  test('carries the probe without its function, so the row crosses postMessage', () => {
    const row = readProbe(probe, [CURRENT], [CURRENT], () => march(), RATES);
    expect(row).toMatchObject({ id: 'health:mounted', family: 'health' });
    expect('apply' in row).toBe(false);
    expect(probeInfo(probe)).toEqual({ id: probe.id, family: probe.family, label: probe.label });
    expect(structuredClone(row)).toEqual(row);
  });
});

describe('headline and ranking', () => {
  const row = (id: string, gains: Partial<Record<PlanPick, number>>): AdvisorRow => ({
    id,
    family: 'health',
    label: id,
    stops: (Object.entries(gains) as [PlanPick, number][]).map(([pick, gain]) =>
      readStop(stop(pick), march({ damage: 1_000_000 * (1 + gain / 100) }), null, RATES),
    ),
  });

  test('the headline is the selected stop, else the sweet spot, else the first stop', () => {
    const full = row('a', { 'silver-saver': 1, 'sweet-spot': 2, 'all-in': 3 });
    expect(headlineOf(full)?.pick).toBe('sweet-spot');
    expect(headlineOf(full, 'all-in')?.pick).toBe('all-in');
    expect(headlineOf(full, 'more-mercs')?.pick).toBe('sweet-spot');
    expect(headlineOf(row('b', { 'steady-max': 1, 'all-in': 2 }), 'more-mercs')?.pick).toBe('steady-max');
    expect(headlineOf({ id: 'c', family: 'health', label: 'c', stops: [] })).toBeUndefined();
  });

  test('rows rank by the headline gain, ties in the order the probes were given', () => {
    const rows = [
      row('none', { 'sweet-spot': 0, 'all-in': 5 }),
      row('small', { 'sweet-spot': 1, 'all-in': 0 }),
      row('tie', { 'sweet-spot': 0, 'all-in': 5 }),
      row('big', { 'sweet-spot': 3, 'all-in': 1 }),
    ];
    expect(rankAdvice(rows).map((advice) => advice.id)).toEqual(['big', 'small', 'none', 'tie']);
    expect(rankAdvice(rows, 'all-in').map((advice) => advice.id)).toEqual(['none', 'tie', 'big', 'small']);
    expect(rows.map((advice) => advice.id)).toEqual(['none', 'small', 'tie', 'big']);
  });

  const costed = (id: string, gain: number, amount: number, unit: string): AdvisorRow => ({
    ...row(id, { 'sweet-spot': gain }),
    family: 'user',
    cost: { amount, unit },
  });

  test('a typed cost ranks by gain per cost, the rows with no cost after by gain, never mixed', () => {
    const rows = [
      row('generic-big', { 'sweet-spot': 5 }),
      costed('cheap', 1, 1, 'points'),
      row('generic-small', { 'sweet-spot': 1 }),
      costed('dear', 4, 10, 'points'),
      costed('slow', 3, 2, 'days'),
      costed('mid', 3, 2, 'points'),
      costed('quick', 2, 0.5, 'days'),
    ];
    // points first (its first row was given first), then days, then the generic probes by gain.
    expect(rankAdvice(rows).map((advice) => advice.id)).toEqual([
      'mid',
      'cheap',
      'dear',
      'quick',
      'slow',
      'generic-big',
      'generic-small',
    ]);
    expect(rankingOrder(rows)).toEqual(['points', 'days']);
    expect(gainPerCost(rows[3]!)).toBeCloseTo(0.4, 6);
    expect(gainPerCost(rows[0]!)).toBeNull();
  });

  test('with no cost typed, the ranking is by gain alone and states no unit', () => {
    const rows = [row('a', { 'sweet-spot': 1 }), row('b', { 'sweet-spot': 2 })];
    expect(rankingOrder(rows)).toEqual([]);
    expect(rankAdvice(rows).map((advice) => advice.id)).toEqual(['b', 'a']);
  });

  test('costed rows tie in the order they were given, and a no-gain costed row stays in its group', () => {
    const rows = [costed('x', 2, 2, 'gold'), costed('none', 0, 1, 'gold'), costed('y', 1, 1, 'gold')];
    expect(rankAdvice(rows).map((advice) => advice.id)).toEqual(['x', 'y', 'none']);
  });

  test('a typed cost travels from the entry through probeInfo onto the row', () => {
    const probe = userProbe({
      id: 'talent',
      label: 'Talent tier 3',
      deltas: { health: { mounted: 2 } },
      cost: { amount: 5, unit: 'talent points' },
    });
    expect(probeInfo(probe)).toEqual({
      id: 'user:talent',
      family: 'user',
      label: 'Talent tier 3',
      cost: { amount: 5, unit: 'talent points' },
    });
    const free = userProbe({ id: 'free', label: 'Free', deltas: { health: { mounted: 1 } } });
    expect('cost' in probeInfo(free)).toBe(false);
    const read = readProbe(probe, [CURRENT], [CURRENT], () => march(), RATES);
    expect(structuredClone(read).cost).toEqual({ amount: 5, unit: 'talent points' });
  });
});

describe('the march cost: what the gain costs the march, read off the reading the gain is', () => {
  test('the re-planned stop where it is the gain, the re-priced one where the re-plan is noise', () => {
    const repriced = march({ damage: 1_010_000, silver: 101_000 });
    const replanned = march({ damage: 1_300_000, silver: 120_000, gold: 1_500, seconds: 7_200 });
    const planned = readStop(CURRENT, repriced, replanned, RATES);
    expect(planned.from).toBe('replanned');
    expect(gainReading(planned)).toBe(replanned);
    expect(costChange(planned)).toEqual({ silver: 20_000, gold: 500, seconds: 3_600 });
    // A re-plan below the re-priced reading is noise: the gain, and so its cost, is the re-priced march, whatever
    // the re-plan would have spent.
    const noisy = readStop(
      CURRENT,
      repriced,
      march({ damage: 1_005_000, silver: 150_000, gold: 9_000 }),
      RATES,
    );
    expect(noisy.from).toBe('repriced');
    expect(gainReading(noisy)).toBe(repriced);
    expect(costChange(noisy)).toEqual({ silver: 1_000, gold: 0, seconds: 0 });
  });

  test('with no re-planned stop the cost is the re-priced reading', () => {
    const read = readStop(CURRENT, march({ damage: 1_030_000, gold: 1_100 }), null, RATES);
    expect(read.from).toBe('repriced');
    expect(costChange(read)).toEqual({ silver: 0, gold: 100, seconds: 0 });
  });

  test('a cost that falls is a negative change, said as much as a rise', () => {
    const read = readStop(
      CURRENT,
      march({ damage: 1_020_000, silver: 80_000, gold: 700, seconds: 1_800 }),
      null,
      RATES,
    );
    expect(costChange(read)).toEqual({ silver: -20_000, gold: -300, seconds: -1_800 });
  });

  test('a row with no gain has no march cost: neither the clamp nor a probe that moves nothing', () => {
    // Both readings below current, the re-priced one dearer: no gain, so no cost either, whatever the bills say.
    const clamped = readStop(
      CURRENT,
      march({ damage: 990_000, silver: 101_000 }),
      march({ damage: 500_000 }),
      RATES,
    );
    expect(clamped.clamped).toBe(true);
    expect(gainReading(clamped)).toBeNull();
    expect(costChange(clamped)).toBeNull();
    const still = readStop(CURRENT, march(), march(), RATES);
    expect(still.from).toBeNull();
    expect(costChange(still)).toBeNull();
  });

  test('the cost and the damage the row prints are one reading, on every draw', () => {
    const random = mulberry32(20_261_009);
    const vary = (): ShownMarch =>
      march({
        damage: 1_000_000 * (0.8 + 0.4 * random()),
        silver: Math.round(100_000 * (0.5 + random())),
        gold: Math.round(1_000 * (0.5 + random())),
        seconds: Math.round(3_600 * (0.5 + random())),
      });
    for (let trial = 0; trial < 500; trial += 1) {
      const current = stop('sweet-spot', vary());
      const read = readStop(current, vary(), random() < 0.2 ? null : vary(), RATES);
      const reading = gainReading(read);
      const change = costChange(read);
      if (reading === null) {
        expect(read.gain).toBe(0);
        expect(change).toBeNull();
        continue;
      }
      const before = current.march.bill;
      expect(read.damagePercent).toBe(((reading.bill.damage - before.damage) / before.damage) * 100);
      expect(change).toEqual({
        silver: reading.bill.silver - before.silver,
        gold: reading.bill.gold - before.gold,
        seconds: reading.bill.seconds - before.seconds,
      });
    }
  });

  test('reads and never writes the advice it is handed', () => {
    // A ten-day queue, so a re-plan that adds a day to it still rates above the re-priced reading.
    const read = readStop(
      stop('sweet-spot', march({ seconds: 864_000 })),
      march({ damage: 1_010_000, seconds: 864_000 }),
      march({ damage: 1_300_000, silver: 130_000, seconds: 964_000 }),
      RATES,
    );
    const frozen = structuredClone(read);
    const deepFreeze = (value: unknown): void => {
      if (value && typeof value === 'object') {
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
      }
    };
    deepFreeze(read);
    expect(read.from).toBe('replanned');
    const change = costChange(read);
    expect(change).toEqual({ silver: 30_000, gold: 0, seconds: 100_000 });
    expect(outstandingSeconds(read.current.bill, change!)).toBe(100_000);
    expect(gainReading(read)).toBe(read.replanned);
    expect(read).toEqual(frozen);
  });
});

describe('outstandingSeconds: the training time is printed only past both bounds', () => {
  /** The phase's numbers, handed over so the rule is read on its own: 10 % of the current queue, and an hour. */
  const BOUND = { share: 0.1, seconds: 3_600 };
  /** 100 h of queue: its 10 % is 10 h, so the share is the bound that binds. */
  const LONG = { seconds: 360_000 };
  /** 5 h of queue: its 10 % is 30 min, so the hour is the bound that binds. */
  const SHORT = { seconds: 18_000 };
  const shown = (current: Pick<ShownBill, 'seconds'>, seconds: number): number | null =>
    outstandingSeconds(current, { seconds }, BOUND);

  test('the share of the queue: just under 10 % is not printed, just over is, a saving as much as a rise', () => {
    expect(shown(LONG, 35_999)).toBeNull();
    expect(shown(LONG, 36_000)).toBeNull();
    expect(shown(LONG, 36_001)).toBe(36_001);
    expect(shown(LONG, -35_999)).toBeNull();
    expect(shown(LONG, -36_001)).toBe(-36_001);
  });

  test('the hour: more than 10 % of a short queue is still not printed under an hour', () => {
    expect(shown(SHORT, 1_801)).toBeNull();
    expect(shown(SHORT, 3_599)).toBeNull();
    expect(shown(SHORT, 3_600)).toBeNull();
    expect(shown(SHORT, 3_601)).toBe(3_601);
    expect(shown(SHORT, -3_599)).toBeNull();
    expect(shown(SHORT, -3_601)).toBe(-3_601);
  });

  test('a march with no queue yet: the hour alone decides', () => {
    expect(shown({ seconds: 0 }, 3_600)).toBeNull();
    expect(shown({ seconds: 0 }, 3_601)).toBe(3_601);
    expect(shown({ seconds: 0 }, 0)).toBeNull();
  });

  test("with no bound handed over it reads the owner's, CAMPAIGN.outstandingTraining", () => {
    const { share, seconds } = CAMPAIGN.outstandingTraining;
    // A queue whose share is ten times the floor, so the share binds, and no queue at all, so the floor does.
    const queue = { seconds: (10 * seconds) / share };
    const edge = share * queue.seconds;
    expect(outstandingSeconds(queue, { seconds: edge })).toBeNull();
    expect(outstandingSeconds(queue, { seconds: edge + 1 })).toBe(edge + 1);
    expect(outstandingSeconds({ seconds: 0 }, { seconds })).toBeNull();
    expect(outstandingSeconds({ seconds: 0 }, { seconds: seconds + 1 })).toBe(seconds + 1);
  });

  test("a row's change reads through: a day more on a ten-day queue is printed, ten minutes on an hour is not", () => {
    const advice: StopAdvice = readStop(
      stop('sweet-spot', march({ seconds: 864_000 })),
      march({ damage: 1_100_000, seconds: 964_000 }),
      null,
      RATES,
    );
    const change = costChange(advice);
    expect(change).toEqual({ silver: 0, gold: 0, seconds: 100_000 });
    expect(outstandingSeconds(advice.current.bill, change!, BOUND)).toBe(100_000);
    // Ten minutes more on a one-hour march is over its 10 % but under the hour: nothing to print.
    const small = costChange(readStop(CURRENT, march({ damage: 1_100_000, seconds: 4_200 }), null, RATES));
    expect(small?.seconds).toBe(600);
    expect(outstandingSeconds(CURRENT.march.bill, small!, BOUND)).toBeNull();
  });
});
