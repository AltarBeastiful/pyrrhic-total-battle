/**
 * The pure parts of `march-horizon.ts` (no `planCampaign`, no `THEORY` guard): the `keyOf` dedupe, the fifth-candidate
 * mark, the raw deltas of a row against itself, and a summary that marks a stop.
 * `pnpm vitest run tools/theorycraft/march-horizon.unit.test.ts`
 */
import { describe, expect, it } from 'vitest';

import type { ArmyHorizon, HorizonRow, Priced } from './march-horizon';
import { dedupeRows, figuresOf, marksOf, ratingOf, renderSummary, rowOf } from './march-horizon';
import { CRITERIA } from './plan-report';

const priced = (counts: Record<string, number>, damage: number, silver: number): Priced => ({
  counts,
  shape: 'ladder',
  repeat: { damage, hiredDamage: damage / 4, silver, gold: 10, dragonCoins: 0, seconds: 3600, mercLost: 2 },
  totalDamage: damage * 4,
  silver: silver * 4,
  gold: 40,
  dragonCoins: 0,
  seconds: 14400,
  mercLost: 8,
  marches: 4,
});

const IN_BAND = { undominated: true, inBand: true, onFrontier: true };

const sweet = figuresOf(priced({ a: 1 }, 1000, 500).repeat);
const against = { sweet, cheapest: sweet };

describe('march horizon, pure parts', () => {
  it('keeps one row per keyOf, or-ing the verdicts and keeping the first stop', () => {
    const a = rowOf(priced({ a: 1, b: 0 }, 1000, 500), 'one', { ...IN_BAND, inBand: false }, against);
    const copy = rowOf(priced({ a: 1 }, 1000, 500), 'copy', { ...IN_BAND, stop: 'sweet-spot' }, against);
    const other = rowOf(priced({ c: 2 }, 900, 400), 'other', IN_BAND, against);
    const rows = dedupeRows([a, copy, other]);
    expect(rows.map((r) => r.key)).toEqual([a.key, other.key]);
    expect(rows[0]?.label).toBe('one');
    expect(rows[0]?.marks.inBand).toBe(true);
    expect(rows[0]?.marks.stop).toBe('sweet-spot');
  });

  it('marks a fifth candidate exactly when undominated, in the band and not a stop', () => {
    for (const undominated of [true, false])
      for (const inBand of [true, false])
        for (const stop of [undefined, 'all-in' as const]) {
          const marks = marksOf({ undominated, inBand, onFrontier: true, ...(stop ? { stop } : {}) });
          expect(marks.fifthCandidate).toBe(undominated && inBand && stop === undefined);
        }
  });

  it('reads every raw delta as zero for a row against itself', () => {
    const rating = ratingOf(sweet, sweet);
    expect(rating).toMatchObject({ dDamage: 0, dSilver: 0, dGold: 0, dCoins: 0, dQueue: 0, dHired: 0 });
    expect(rowOf(priced({ a: 1 }, 1000, 500), 'sweet', IN_BAND, against).rating.dDamage).toBe(0);
  });

  it('marks a row that has a stop in the summary', () => {
    const stop: HorizonRow = rowOf(
      priced({ a: 1 }, 1000, 500),
      'sweet',
      { ...IN_BAND, stop: 'sweet-spot' },
      against,
    );
    const fifth: HorizonRow = rowOf(priced({ c: 2 }, 1200, 700), 'other', IN_BAND, against);
    const criteria = Object.fromEntries(CRITERIA.map((c) => [c, { holds: true, detail: '' }]));
    const army = {
      label: 'fixture',
      rows: [stop, fifth],
      census: {
        summarised: 2,
        undominated: 2,
        band: 2,
        listed: 2,
        fifthCandidates: 1,
        raw: { summarised: 2, undominated: 2, band: 2 },
        troopsOnly: false,
      },
      stops: [{ pick: 'sweet-spot', key: stop.key, campaign: stop.campaign }],
      criteria,
      readings: [],
      meta: { planMs: 0, marchTarget: 4, budgetBound: false },
    } as unknown as ArmyHorizon;
    const text = renderSummary([army]);
    const [, offered = '', fifths = ''] = text.split(/\*\*Offered stops\*\*|\*\*Fifth candidates\*\*/);
    expect(offered).toMatch(/\*\*SW\*\*/);
    expect(fifths).toContain('5th');
    expect(fifths).not.toMatch(/\*\*SW\*\*/);
  });
});
