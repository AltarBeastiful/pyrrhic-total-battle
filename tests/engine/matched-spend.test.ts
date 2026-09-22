/**
 * **The matched-spend reading, held to its own arithmetic** (S-121, 2026-09-22).
 *
 * `plan-benchmark.test.ts` takes three minutes and asserts seventeen armies; a tolerance comparison that
 * lives only inside it is a comparison nobody can debug. These are the cases the reading has to get right
 * for the benchmark's verdict column to mean the sentence the owner wrote — above all the two that would
 * silently flatter us: a stop that hits harder **because** it outspends, and a marker the rival paid nothing
 * of.
 */
import { describe, expect, it } from 'vitest';

import type { Contender } from './matched-spend';
import { fitsInside, markerFloors, matchedSpend, overspentOn, verdictWord } from './matched-spend';

/** A campaign, named and priced — every marker zero unless the case says otherwise. */
const at = (name: string, damage: number, spend: Partial<Omit<Contender, 'name' | 'damage'>>): Contender => ({
  name,
  damage,
  silver: 0,
  gold: 0,
  dragonCoins: 0,
  burned: 0,
  seconds: 0,
  ...spend,
});

describe('fitting inside another march’s budget', () => {
  const theirs = at('theirs', 1_000, { silver: 1_000, gold: 100, burned: 10, seconds: 600 });

  it('an exact tie on every marker fits', () => {
    expect(fitsInside(at('ours', 1, { silver: 1_000, gold: 100, burned: 10, seconds: 600 }), theirs)).toBe(
      true,
    );
  });

  it('five per cent over on one marker fits, six does not', () => {
    expect(fitsInside(at('ours', 1, { silver: 1_050, gold: 100, burned: 10, seconds: 600 }), theirs)).toBe(
      true,
    );
    expect(fitsInside(at('ours', 1, { silver: 1_060, gold: 100, burned: 10, seconds: 600 }), theirs)).toBe(
      false,
    );
  });

  it('cheaper on three markers does not buy room on the fourth', () => {
    const ours = at('ours', 1, { silver: 0, gold: 0, burned: 40, seconds: 0 });
    expect(fitsInside(ours, theirs)).toBe(false);
    expect(overspentOn(ours, theirs)).toEqual(['burned']);
  });

  it('the training queue is read but never gates — it is not one of the four costs', () => {
    // Measured, not assumed: gating it takes the standing from 5 beats to 3 (see `COSTS`).
    const ours = at('ours', 1, { silver: 1_000, gold: 100, burned: 10, seconds: 9_999_999 });
    expect(fitsInside(ours, theirs)).toBe(true);
    expect(overspentOn(ours, theirs)).toEqual([]);
  });

  it('a marker they spent nothing of is a hard gate, tolerance or not', () => {
    // §8's first open question, pinned as behaviour so the day he answers it the change is visible here.
    const free = at('theirs', 1_000, { silver: 1_000 });
    expect(fitsInside(at('ours', 1, { silver: 900, dragonCoins: 1 }), free)).toBe(false);
    expect(fitsInside(at('ours', 1, { silver: 900, dragonCoins: 0 }), free)).toBe(true);
    expect(fitsInside(at('ours', 1, { silver: 900, dragonCoins: 1 }), free, 10)).toBe(false);
  });
});

describe('one army’s standing at matched spend', () => {
  it('names their hardest row, and beats it only by fitting inside it', () => {
    const theirs = [
      at('their cheap march', 500, { silver: 400, burned: 2 }),
      at('their hardest march', 1_000, { silver: 1_000, burned: 10 }),
    ];
    // The stop that would flatter us: it hits hardest and spends far more than they did.
    const ours = [
      at('all-in', 1_400, { silver: 3_000, burned: 40 }),
      at('steady-max', 1_100, { silver: 1_020, burned: 10 }),
      at('silver saver', 480, { silver: 300, burned: 2 }),
    ];
    const standing = matchedSpend(ours, theirs);
    expect(standing.hardest?.theirs.name).toBe('their hardest march');
    expect(standing.hardest?.ours?.name).toBe('steady-max');
    expect(standing.hardest?.delta).toBeCloseTo(0.1, 6);
    expect(verdictWord(standing.hardest)).toBe('beat');
    // And their cheap march is not beaten, which is the whole reason `rowsBeaten` exists beside `hardest`:
    // `silver saver` fits inside it and comes up 4 % short.
    expect(standing.rowsBeaten).toBe(1);
    expect(standing.rows).toHaveLength(2);
    expect(standing.worst?.theirs.name).toBe('their cheap march');
    expect(standing.worst?.delta).toBeCloseTo(-0.04, 6);
  });

  it('reports the markers that kept every stop outside their budget', () => {
    const theirs = [at('their thrifty march', 900, { silver: 100, gold: 0, burned: 1 })];
    const ours = [at('all-in', 5_000, { silver: 9_000, gold: 40, burned: 30 })];
    const standing = matchedSpend(ours, theirs);
    expect(verdictWord(standing.hardest)).toBe('no stop fits');
    expect(standing.hardest?.over).toEqual(['silver', 'gold', 'burned']);
    expect(standing.rowsBeaten).toBe(0);
    expect(standing.unfitted).toBe(1);
    expect(standing.worst).toBeNull();
  });

  it('an army with no comparable row is not measured rather than won', () => {
    const standing = matchedSpend([at('all-in', 5_000, { silver: 10 })], []);
    expect(verdictWord(standing.hardest)).toBe('not measured');
    expect(standing.rows).toHaveLength(0);
    expect(standing.rowsBeaten).toBe(0);
  });

  it('matching a march to the unit is not beating it, but matching it for less is', () => {
    const theirs = [at('theirs', 1_000, { silver: 1_000 })];
    // Their march, to the unit — which happens here: on Bear V ×1 and ×2 the tailed sweet spot *is* the
    // Tier ladder sizer's own campaign. The owner asked for *better* damage, so a tie is not a win.
    const same = matchedSpend([at('ours', 1_000, { silver: 1_000 })], theirs);
    expect(same.hardest?.delta).toBe(0);
    expect(same.rowsBeaten).toBe(0);
    // The same damage for strictly less of one of the four costs is a win, and on the derived ratios it is
    // plainly one: every one of them goes up.
    const cheaper = matchedSpend([at('ours', 1_000, { silver: 900 })], theirs);
    expect(cheaper.hardest?.delta).toBe(0);
    expect(cheaper.rowsBeaten).toBe(1);
  });

  it('counts the rows nothing of ours fits inside apart from the ones we merely lose', () => {
    const theirs = [
      at('their thrifty march', 100, { silver: 1 }),
      at('their big march', 1_000, { silver: 5_000 }),
    ];
    const standing = matchedSpend([at('steady-max', 900, { silver: 4_000 })], theirs);
    expect(standing.unfitted).toBe(1);
    expect(standing.worst?.theirs.name).toBe('their big march');
    expect(standing.worst?.delta).toBeCloseTo(-0.1, 6);
  });
});

describe('the six marker floors', () => {
  it('reads our best against their best on each marker alone', () => {
    const ours = [
      at('all-in', 2_000, { silver: 5_000, gold: 50, burned: 40, seconds: 900 }),
      at('silver saver', 800, { silver: 600, gold: 4, burned: 2, seconds: 100 }),
    ];
    const theirs = [at('theirs', 1_500, { silver: 700, gold: 4, burned: 6, seconds: 300 })];
    const floors = Object.fromEntries(markerFloors(ours, theirs).map((one) => [one.marker, one]));
    expect(floors.damage?.standing).toBe('win'); // 2 000 over 1 500
    expect(floors.silver?.standing).toBe('win'); // 600 under 700
    expect(floors.gold?.standing).toBe('tie'); // 4 against 4
    expect(floors.burned?.standing).toBe('win'); // 2 under 6
    expect(floors.seconds?.standing).toBe('win'); // 100 under 300
    // Neither side spends a coin: a currency nobody paid is a tie, never a win.
    expect(floors.dragonCoins?.standing).toBe('tie');
    expect(floors.dragonCoins?.ours).toBe(0);
  });

  it('says nothing at all where one side has no row', () => {
    expect(markerFloors([], [at('theirs', 1, { silver: 1 })])).toEqual([]);
    expect(markerFloors([at('ours', 1, { silver: 1 })], [])).toEqual([]);
  });
});
