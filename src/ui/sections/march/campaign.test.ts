/**
 * What the March says about a campaign (S-54).
 *
 * Two things are pinned here, and both are wording rules rather than arithmetic ones. A sizing is
 * named the way the Battle card names it (design rule 26, `docs/design.md` §7) — the engine's `ms`
 * is the player's "Troops first" and its `elite` is the "Tier ladder", which is exactly the pair a
 * translation is easiest to get backwards on. And a `spend` fraction is said as a quantity of
 * mercenaries, because "0.75" is not something anybody owns.
 *
 * The rest is the reading of the engine's answer: what each march put in the field, what the silver
 * had come to by then, and which of the twelve plans are worth a row in the comparison.
 */
import { describe, expect, it } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, searchComplete, simulateCampaign } from '@/engine';
import type { CompleteResult } from '@/engine/campaign';
import type { StackRequest } from '@/engine/types';

import {
  compareRows,
  hasHiredStock,
  hiredTotals,
  marchCount,
  marchRows,
  SIZING_LABEL,
  sizingSentence,
  spendWords,
} from './campaign';

const EMH6 = 'epic-monster-hunter-6';

/**
 * Two cheap troop types and a stock of 92 mercenaries, with authority to spare: the stock — not the
 * housing — is what decides how many of them march, so the chunk arithmetic is countable by hand.
 */
function army(): StackRequest {
  const troops = getUnits()
    .filter((unit) => unit.pool === 'leadership' && unit.kind === 'troop' && unit.tier <= 2)
    .slice(0, 2);
  const hunter = getUnits().find((unit) => unit.id === EMH6);
  expect(troops).toHaveLength(2);
  expect(hunter).toBeDefined();

  return {
    units: [...troops, ...(hunter === undefined ? [] : [hunter])],
    caps: { [EMH6]: 92 },
    housing: { leadership: 4_100, authority: 10_000, dominance: 0 },
    totals: emptyTotals(),
    options: {
      method: 'elite',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
    },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

/** Three unit types, so every cell enumerates every subset and the budget is never reached. */
function complete(): CompleteResult {
  return searchComplete({ request: army(), objective: 'avgDamage', campaign: { marches: 4 }, budgetMs: 0 });
}

describe('the words', () => {
  it('names the sizings as the Battle card names them, never as the engine does', () => {
    // The engine's `elite` is "Elite Preservation" and its `ms` is "M's Preservation"; neither word
    // is ours, and the two are easy to swap. `ms` is the one that keeps hired units for last.
    expect(SIZING_LABEL.elite).toBe('Tier ladder');
    expect(SIZING_LABEL.ms).toBe('Troops first');
    expect(SIZING_LABEL.msRelaxed).toBe('Troops first, with damage trades');
  });

  it('says a spend level as a quantity of mercenaries', () => {
    expect(spendWords(1)).toBe('All');
    expect(spendWords(0.75)).toBe('Three quarters');
    expect(spendWords(0.5)).toBe('Half');
    expect(spendWords(0.25)).toBe('A quarter');
    // Anything else the engine is asked for is still a share, never a fraction.
    expect(spendWords(0.4)).toBe('40%');
  });

  it('writes the sizing line the way the winner marched', () => {
    const { winner } = complete();
    expect(hasHiredStock(winner.campaign)).toBe(true);
    expect(sizingSentence({ ...winner, method: 'msRelaxed', spend: 1 })).toBe(
      'Sized as Troops first, with damage trades. Every mercenary you own marches each time.',
    );
    expect(sizingSentence({ ...winner, method: 'elite', spend: 0.5 })).toBe(
      'Sized as Tier ladder. Half of your mercenaries march each time.',
    );
  });

  it('says nothing about mercenaries to an account that hires none', () => {
    const troopsOnly = simulateCampaign({ ...army(), caps: {} }, { marches: 2 });
    const { winner } = complete();
    expect(hasHiredStock(troopsOnly)).toBe(false);
    expect(sizingSentence({ ...winner, method: 'ms', spend: 1, campaign: troopsOnly })).toBe(
      'Sized as Troops first.',
    );
  });

  it('counts one march as a march', () => {
    // A tight silver budget really does end a campaign after one (`stoppedBy: 'silver'`).
    expect(marchCount(1)).toBe('1 march');
    expect(marchCount(10)).toBe('10 marches');
  });
});

describe('the marches', () => {
  it('counts the hired units each march fields and adds the silver up as it goes', () => {
    const campaign = simulateCampaign(army(), { marches: 4 });
    const rows = marchRows(campaign);

    expect(rows.map((row) => row.number)).toEqual([1, 2, 3, 4]);
    // The stock falls by a tenth of what was fielded, rounded up per chunk of ten (`recovery.ts`).
    expect(rows.map((row) => row.hired)).toEqual([92, 82, 73, 65]);

    let running = 0;
    for (const [index, row] of rows.entries()) {
      running += campaign.marches[index]?.summary.recovery.silver ?? 0;
      expect(row.silverSoFar).toBe(running);
      expect(row.damage).toBe(campaign.marches[index]?.summary.avgDamage);
    }
    // "Silver so far" is the campaign's own total by the last march, never a per-march figure.
    expect(rows.at(-1)?.silverSoFar).toBe(campaign.silver);
  });

  it('adds up what the campaign burns and what it leaves', () => {
    const campaign = simulateCampaign(army(), { marches: 4 });
    expect(hiredTotals(campaign)).toEqual({ lost: 10 + 9 + 8 + 7, remaining: 58 });
  });
});

describe('the comparison', () => {
  it('is every sizing at full strength plus the best of each smaller share, the winner marked', () => {
    const result = complete();
    const rows = compareRows(result);

    const full = rows.filter((row) => row.mercenaries === 'All');
    expect(full).toHaveLength(3);
    expect(new Set(full.map((row) => row.sizing))).toEqual(
      new Set(['Tier ladder', 'Troops first', 'Troops first, with damage trades']),
    );

    // One row per smaller share, largest first, and no engine vocabulary anywhere on them.
    expect(rows.slice(3).map((row) => row.mercenaries)).toEqual(['Three quarters', 'Half', 'A quarter']);
    expect(rows).toHaveLength(6);

    const winners = rows.filter((row) => row.winner);
    expect(winners).toHaveLength(1);
    expect(winners[0]?.sizing).toBe(SIZING_LABEL[result.winner.method]);
    expect(winners[0]?.damage).toBe(result.winner.campaign.totalAvg);
    expect(winners[0]?.marches).toBe(result.winner.campaign.fought);
    expect(winners[0]?.lost).toBe(hiredTotals(result.winner.campaign).lost);
  });
});
