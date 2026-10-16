/**
 * The pure parts of `thrifty-stop.ts` (no `planCampaign`, no `THEORY` guard): the gates, the pick and the order verdict.
 * `pnpm vitest run tools/theorycraft/thrifty-stop.unit.test.ts`
 */
import { describe, expect, it } from 'vitest';

import type { ArmyHorizon, HorizonRow } from './march-horizon';
import { CAMPAIGN } from '../../src/config';
import { THRIFTY, improverRule, noStopBeaten, orderOf, ratedRule, thriftyStop } from './thrifty-stop';

const row = (
  key: string,
  v: {
    worst: number;
    silver: number;
    hired: number;
    seconds: number;
    stop?: 'burn-saver' | 'sweet-spot' | 'all-in';
    fifth?: boolean;
  },
): HorizonRow =>
  ({
    key,
    counts: {},
    shape: 'ladder',
    label: key,
    worst: v.worst,
    silver: v.silver,
    hired: v.hired,
    gold: 100,
    coins: 0,
    seconds: v.seconds,
    hiredDamage: v.worst / 2,
    campaign: {
      totalDamage: v.worst * 4,
      silver: v.silver * 4,
      gold: 400,
      dragonCoins: 0,
      seconds: v.seconds * 4,
      mercLost: v.hired * 4,
      marches: 4,
    },
    marks: {
      undominated: true,
      inBand: true,
      onFrontier: true,
      ...(v.stop ? { stop: v.stop } : {}),
      fifthCandidate: v.fifth ?? false,
    },
    rating: { rate: 0, dDamage: 0, dSilver: 0, dGold: 0, dCoins: 0, dQueue: 0, dHired: 0 },
    vsCheapest: { rate: 0, dDamage: 0, dSilver: 0, dGold: 0, dCoins: 0, dQueue: 0, dHired: 0 },
    criteria: {},
  }) as unknown as HorizonRow;

const army = (rows: HorizonRow[]): ArmyHorizon => ({ label: 'fixture', rows }) as unknown as ArmyHorizon;

const SAVER = row('saver', { worst: 600, silver: 300, hired: 1, seconds: 1000, stop: 'burn-saver' });
const SWEET = row('sweet', { worst: 1000, silver: 500, hired: 3, seconds: 4000, stop: 'sweet-spot' });

describe('thrifty stop, pure parts', () => {
  it('picks the most damage among rows that pass every gate', () => {
    const good = row('good', { worst: 800, silver: 380, hired: 2, seconds: 2500, fifth: true });
    const better = row('better', { worst: 900, silver: 430, hired: 2, seconds: 3000, fifth: true });
    const result = thriftyStop(army([SAVER, SWEET, good, better]));
    expect(result.pick?.key).toBe('better');
    expect(result.order).toBe('strict');
    expect(result.funnel).toMatchObject({ pool: 2, burn: 2, below: 2, queue: 2, silver: 2, merc: 2 });
  });

  it('refuses a row with more burn, a queue not cut, or a ratio that fell', () => {
    const burnier = row('burnier', { worst: 900, silver: 400, hired: 4, seconds: 2000, fifth: true });
    const slow = row('slow', { worst: 900, silver: 400, hired: 2, seconds: 3900, fifth: true });
    const dear = row('dear', { worst: 900, silver: 600, hired: 2, seconds: 2000, fifth: true });
    burnier.hiredDamage = 900;
    const result = thriftyStop(army([SAVER, SWEET, burnier, slow, dear]));
    expect(result.pick).toBeUndefined();
    expect(result.funnel).toMatchObject({ pool: 3, burn: 2, below: 2, queue: 1, silver: 0 });
    expect(thriftyStop(army([SAVER, SWEET, burnier]), { ...THRIFTY, burn: 1 }).pick?.key).toBe('burnier');
  });

  it('the rated stone reaches burn below the next stop up, and takes only a row rated above the sweet spot', () => {
    const UP = row('up', { worst: 1500, silver: 800, hired: 5, seconds: 6000, stop: 'all-in' });
    const loud = row('loud', { worst: 900, silver: 450, hired: 2, seconds: 3800, fifth: true });
    const quick = row('quick', { worst: 800, silver: 400, hired: 2, seconds: 2000, fifth: true });
    const burnt = row('burnt', { worst: 950, silver: 475, hired: 5, seconds: 3000, fifth: true });
    const four = row('four', { worst: 700, silver: 350, hired: 4, seconds: 1800, fifth: true });
    const bar = [SAVER, SWEET, UP, loud, quick, burnt, four];
    // Burn 4 passes (below 5), burn 5 does not.
    expect(thriftyStop(army(bar), ratedRule(40)).funnel.burn).toBe(3);
    // At the app's queue weight no row beats the sweet spot (so none is offered); a heavy queue weight lets the quick row
    // through, and then it is the pick over the louder one.
    expect(thriftyStop(army(bar), ratedRule(40)).pick).toBeUndefined();
    expect(thriftyStop(army(bar), ratedRule(1)).funnel.rated).toBeGreaterThan(0);
    expect(thriftyStop(army(bar), ratedRule(1)).pick?.key).toBe('quick');
  });

  it('the all-costs improver reads its numbers from config and refuses a row under the damage floor', () => {
    expect(CAMPAIGN.planFixes.fifthStop).toEqual({
      damageFloor: 0.8,
      goldTolerance: 0,
      silverFloor: 1,
      mercFloor: 1,
      dropTypes: 3,
      trims: 2,
    });
    expect(CAMPAIGN.planFixes.ratedStops).toEqual({
      rule: 'one-chunk',
      minRating: 5,
      typesOut: true,
      damageFloor: 0.95,
      thriftyReads: 'before',
    });
    expect(improverRule().damageFloor).toBe(0.8);
    const UP = row('up', { worst: 1500, silver: 800, hired: 5, seconds: 6000, stop: 'all-in' });
    // Same dmg/silver (2.0) and dmg/merc as the sweet spot, queue and silver lower: `fine` keeps 85 % of the damage,
    // `thin` only 70 %, so the floor refuses it and takes the louder one.
    const fine = row('fine', { worst: 850, silver: 425, hired: 2, seconds: 3000, fifth: true });
    const thin = row('thin', { worst: 700, silver: 350, hired: 2, seconds: 2500, fifth: true });
    expect(thriftyStop(army([SAVER, SWEET, UP, fine, thin]), improverRule()).pick?.key).toBe('fine');
    expect(thriftyStop(army([SAVER, SWEET, UP, thin]), improverRule()).pick).toBeUndefined();
    expect(
      thriftyStop(army([SAVER, SWEET, UP, thin]), improverRule(0, 'below-next-stop', 0.6)).pick?.key,
    ).toBe('thin');
    // Gold is not free: a row that costs more gold than the tolerance allows is out.
    const dear = row('dear', { worst: 900, silver: 450, hired: 2, seconds: 3000, fifth: true });
    dear.gold = 130;
    expect(thriftyStop(army([SAVER, SWEET, UP, dear]), improverRule()).pick).toBeUndefined();
    expect(thriftyStop(army([SAVER, SWEET, UP, dear]), improverRule(0.5)).pick?.key).toBe('dear');
  });

  it('skips a put-back generator and a stop, and says nothing without a sweet spot', () => {
    const gen = row('gen', { worst: 900, silver: 400, hired: 2, seconds: 2000, fifth: true });
    gen.marks.generatorOf = 'sweet-spot';
    expect(thriftyStop(army([SAVER, SWEET, gen])).pick).toBeUndefined();
    expect(thriftyStop(army([SAVER])).sweet).toBeUndefined();
  });

  it('reads the order verdict: strict, a shared burn level, or broken', () => {
    expect(orderOf([SAVER, SWEET], row('mid', { worst: 800, silver: 400, hired: 2, seconds: 2000 }))).toBe(
      'strict',
    );
    expect(orderOf([SAVER, SWEET], row('tie', { worst: 800, silver: 400, hired: 3, seconds: 2000 }))).toBe(
      'tie-burn',
    );
    expect(orderOf([SAVER, SWEET], row('weak', { worst: 500, silver: 400, hired: 2, seconds: 2000 }))).toBe(
      'breaks',
    );
  });

  it('flags a pick that beats a stop on damage, silver and burn', () => {
    expect(
      noStopBeaten([SAVER, SWEET], row('mid', { worst: 800, silver: 400, hired: 2, seconds: 2000 })),
    ).toBe(true);
    expect(
      noStopBeaten([SAVER, SWEET], row('great', { worst: 2000, silver: 100, hired: 1, seconds: 2000 })),
    ).toBe(false);
  });
});
