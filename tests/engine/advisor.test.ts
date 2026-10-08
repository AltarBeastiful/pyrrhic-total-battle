/**
 * W17 C3 — **the advisor's reading** (`src/engine/advisor.ts`, `docs/plans/progression-advisor.md` §4), on
 * hand-built marches: the gain is the best of re-priced, re-planned and current on the owner's rating, so it is
 * never a loss; the clamp reads "no gain" and is said; `noise`, `reorder` and `worse` say what the three
 * readings did; a row is read stop by stop and headlined on the selected stop.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { mulberry32 } from '@/engine';
import {
  headlineOf,
  probeInfo,
  rankAdvice,
  readProbe,
  readStop,
  type AdvisorRow,
  type ShownBill,
  type ShownMarch,
  type ShownStop,
} from '@/engine/advisor';
import type { PlanPick } from '@/engine/plan';
import { bonusProbe } from '@/engine/probes';

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
});
