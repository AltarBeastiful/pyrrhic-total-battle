/**
 * S-54 — complete optimization over several marches.
 *
 * Two things are pinned here. First the **arithmetic of a campaign**: the Temple revives 90 % of the
 * fallen (`n − chunks(n)`), so a hired stock of 92 fielded in full goes 92 → 82 → 73 …, while spending
 * half of it sustains 46 a march for ten marches — that is the whole reason a lower spend can buy more
 * battles, and every total the UI shows is a plain sum of the marches actually fought.
 *
 * Then the **fact investigation 0014 §5 measured on the owner's own army**: on his 2026-09-13 export the
 * sizing method matters more than the subset — "Hired last + damage trades" beats "Troops first" by
 * about 5 % on one march, and the gap survives ten. That test reads the owner's export from his Downloads
 * folder (it is his account, not a fixture we may copy into the repo) and is skipped when it is absent.
 */
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  campaignScore,
  clampSpend,
  marchTarget,
  searchComplete,
  simulateCampaign,
  type CompleteCandidate,
  type CompleteMethod,
} from '../../src/engine/campaign';
import type { StackRequest } from '../../src/engine/types';
import { buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { makeRequest } from '../helpers/request';
import { mercenarySet, troopSet } from '../helpers/units';

const EMH6 = 'epic-monster-hunter-6';

/** One troop type and one mercenary the caps — not the housing — decide the size of. */
function hiredArmy(cap: number, housing?: Partial<StackRequest['housing']>): StackRequest {
  return makeRequest({
    units: [...troopSet('SW1'), ...mercenarySet('EMH6')],
    caps: { [EMH6]: cap },
    housing: { leadership: 300, authority: 10_000, ...housing },
  });
}

const countOf = (march: { result: { stacks: { unitId: string; count: number }[] } }, id: string): number =>
  march.result.stacks.find((stack) => stack.unitId === id)?.count ?? 0;

describe('the stock a campaign burns', () => {
  it('loses a tenth of every hired stack it fields, rounded up by the chunk of ten', () => {
    const campaign = simulateCampaign(hiredArmy(92), { marches: 4 });

    expect(campaign.marches.map((march) => march.caps[EMH6])).toEqual([92, 82, 73, 65]);
    expect(campaign.marches.map((march) => countOf(march, EMH6))).toEqual([92, 82, 73, 65]);
    expect(campaign.lost[EMH6]).toBe(10 + 9 + 8 + 7);
    expect(campaign.remaining[EMH6]).toBe(58);
    expect(campaign.fought).toBe(4);
    expect(campaign.stoppedBy).toBe('marches');
  });

  it('sustains 46 of a stock of 92 for ten marches at half spend', () => {
    const campaign = simulateCampaign(hiredArmy(92), { marches: 10, spend: 0.5 });

    expect(campaign.marches).toHaveLength(10);
    for (const march of campaign.marches) expect(countOf(march, EMH6)).toBe(46);
    expect(campaign.lost[EMH6]).toBe(50);
    expect(campaign.remaining[EMH6]).toBe(42);
  });

  it('never leaves an owned stock entirely at home, and never conjures one', () => {
    expect(marchTarget(92, 0.5)).toBe(46);
    expect(marchTarget(3, 0.25)).toBe(1);
    expect(marchTarget(0, 1)).toBe(0);
    expect(simulateCampaign(hiredArmy(0), { marches: 2 }).lost[EMH6]).toBe(0);
  });

  it('leaves troops alone: they are retrained and march again in full', () => {
    const campaign = simulateCampaign(hiredArmy(92), { marches: 3 });
    const swordsmen = campaign.marches.map((march) => countOf(march, 'swordsman-1'));

    expect(new Set(swordsmen).size).toBe(1);
    expect(campaign.lost['swordsman-1']).toBeUndefined();
  });
});

describe('spend', () => {
  it('clamps to a fraction of the stock, and defaults to all of it', () => {
    expect(clampSpend(undefined)).toBe(1);
    expect(clampSpend(Number.NaN)).toBe(1);
    expect(clampSpend(2.5)).toBe(1);
    expect(clampSpend(-1)).toBe(0);
    expect(clampSpend(0.25)).toBe(0.25);
  });

  it('a spend above 1 is the same campaign as a full one', () => {
    const all = simulateCampaign(hiredArmy(92), { marches: 3 });
    const over = simulateCampaign(hiredArmy(92), { marches: 3, spend: 4 });

    expect(over.totalAvg).toBe(all.totalAvg);
    expect(over.lost).toEqual(all.lost);
  });

  it('spends fewer mercenaries per march, and loses fewer of them', () => {
    const all = simulateCampaign(hiredArmy(92), { marches: 5 });
    const half = simulateCampaign(hiredArmy(92), { marches: 5, spend: 0.5 });

    expect(half.lost[EMH6]).toBeLessThan(all.lost[EMH6] ?? 0);
    expect(half.remaining[EMH6]).toBeGreaterThan(all.remaining[EMH6] ?? 0);
    expect(half.totalAvg).toBeLessThan(all.totalAvg);
  });
});

describe('totals', () => {
  const campaign = simulateCampaign(hiredArmy(92), { marches: 5 });
  const sum = (read: (index: number) => number): number =>
    campaign.marches.reduce((total, _march, index) => total + read(index), 0);

  it('are the plain sums of the marches fought', () => {
    expect(campaign.totalMin).toBe(sum((i) => campaign.marches[i]?.summary.minDamage ?? 0));
    expect(campaign.totalAvg).toBe(sum((i) => campaign.marches[i]?.summary.avgDamage ?? 0));
    expect(campaign.totalMax).toBe(sum((i) => campaign.marches[i]?.summary.maxDamage ?? 0));
    expect(campaign.silver).toBe(sum((i) => campaign.marches[i]?.summary.recovery.silver ?? 0));
    expect(campaign.gold).toBe(sum((i) => campaign.marches[i]?.summary.recovery.gold ?? 0));
    expect(campaign.seconds).toBe(sum((i) => campaign.marches[i]?.summary.recovery.seconds ?? 0));
  });

  it('turn into the per-cost objectives, and a cost of nothing scores nothing', () => {
    expect(campaign.damagePerSilver).toBeCloseTo(campaign.totalAvg / campaign.silver, 9);
    expect(campaign.damagePerGold).toBeCloseTo(campaign.totalAvg / campaign.gold, 9);
    expect(campaign.dragonCoins).toBe(0);
    expect(campaign.damagePerDragonCoin).toBe(0);
    // A ratio with no denominator is not a score of zero: nothing can be compared (PLAN §3.6).
    expect(campaignScore(campaign, 'damagePerDragonCoin')).toBe(-Infinity);
    expect(campaignScore(campaign, 'avgDamage')).toBe(campaign.totalAvg);
    expect(campaignScore(campaign, 'minDamage')).toBe(campaign.totalMin);
  });
});

describe('the silver budget', () => {
  const one = simulateCampaign(hiredArmy(92), { marches: 1 }).silver;

  it('stops before the march it could not pay for', () => {
    const campaign = simulateCampaign(hiredArmy(92), { marches: 10, silverBudget: one * 3 + 1 });

    expect(campaign.fought).toBe(3);
    expect(campaign.stoppedBy).toBe('silver');
    expect(campaign.silver).toBeLessThanOrEqual(one * 3 + 1);
  });

  it('fights nothing at all when it cannot pay for the first march', () => {
    const campaign = simulateCampaign(hiredArmy(92), { marches: 10, silverBudget: one - 1 });

    expect(campaign.fought).toBe(0);
    expect(campaign.stoppedBy).toBe('silver');
    expect(campaign.totalAvg).toBe(0);
    expect(campaign.remaining[EMH6]).toBe(92);
  });

  it('is unlimited when it is not given', () => {
    expect(simulateCampaign(hiredArmy(92), { marches: 6 }).stoppedBy).toBe('marches');
  });
});

describe('searchComplete', () => {
  const request = makeRequest({
    units: [...troopSet('SW1', 'RD2', 'RD3'), ...mercenarySet('EMH6', 'LGN6')],
    caps: { [EMH6]: 92, 'legionary-6': 72 },
    housing: { leadership: 1000, authority: 200 },
  });
  const run = () =>
    searchComplete({
      request,
      objective: 'avgDamage',
      campaign: { marches: 5 },
      budgetMs: 30_000,
      seed: 1,
      spendLevels: [1, 0.5],
    });
  const found = run();

  it('answers for every method and every spend level', () => {
    const cells = found.candidates.map((candidate) => `${candidate.method}@${String(candidate.spend)}`);
    expect(new Set(cells).size).toBe(6);
    expect(found.exhaustive).toBe(true);
    expect(found.unmeasurable).toBe(false);
  });

  it('returns the candidates score-descending, winner first', () => {
    const scores = found.candidates.map((candidate) => candidate.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(found.winner).toBe(found.candidates[0]);
  });

  it('scores on the campaign, and the campaign is the one the candidate describes', () => {
    for (const candidate of found.candidates) {
      expect(candidate.campaign.fought).toBe(5);
      expect(candidate.score).toBe(candidate.campaign.totalAvg);
      const first = candidate.campaign.marches[0];
      expect(first?.summary.avgDamage).toBe(candidate.single.summary.avgDamage);
      expect(candidate.single.score).toBe(candidate.single.summary.avgDamage);
    }
  });

  it('is deterministic', () => {
    const again = run();
    const shape = (candidate: CompleteCandidate): string =>
      [candidate.method, candidate.spend, candidate.score, candidate.includedUnitIds.join('+')].join('|');
    expect(again.candidates.map(shape)).toEqual(found.candidates.map(shape));
    expect(again.evaluated).toBe(found.evaluated);
  });

  it('reports an objective it cannot measure', () => {
    // No monsters in this army, so no dragon coin is ever spent and no candidate can be compared.
    const coins = searchComplete({
      request,
      objective: 'damagePerDragonCoin',
      campaign: { marches: 3 },
      budgetMs: 30_000,
      spendLevels: [1],
    });
    expect(coins.unmeasurable).toBe(true);
    expect(coins.winner.campaign.dragonCoins).toBe(0);
  });

  it('stops when it is told to, and says its answer is not exhaustive', () => {
    const cancelled = searchComplete(
      { request, objective: 'avgDamage', campaign: { marches: 3 }, budgetMs: 30_000, spendLevels: [1] },
      undefined,
      () => true,
    );
    expect(cancelled.exhaustive).toBe(false);
    expect(cancelled.candidates).toHaveLength(3);
  });

  it('reports progress while it works', () => {
    const seen: number[] = [];
    searchComplete(
      { request, objective: 'avgDamage', campaign: { marches: 3 }, budgetMs: 30_000, spendLevels: [1] },
      (progress) => seen.push(progress.evaluated),
    );
    expect(seen.length).toBeGreaterThan(1);
    expect(seen[0]).toBe(50);
  });
});

// ---- The owner's own army ------------------------------------------------------------------------
/**
 * His export lives in his Downloads folder, not in the repo: it is account data, and copying it into
 * `tests/fixtures` would publish it. Anyone else's checkout skips this block.
 */
const EXPORT = '/home/remi/Downloads/pyrrhic-my-account-2026-09-13.json';

/**
 * The march the export describes: everything the account can field, minus what that setup left out.
 *
 * The exclusions are read from the **raw file** on purpose. S-53 dropped `BattleSetup.excludedUnitIds`
 * from the schema, so the migrated profile no longer carries them and `buildStackRequest` cannot
 * subtract them; the exported document still does (a schema-1 file keeps them in
 * `troops.excludedUnitIds`, a schema-2 one on the setup). Without them the "8 types" of investigation
 * 0014 would silently become the whole 12-type pool.
 */
function ownerRequest(): { eight: StackRequest; twelve: StackRequest } {
  const text = readFileSync(EXPORT, 'utf8');
  const parsed = parseImport(text);
  if (parsed.kind !== 'profile') throw new Error('the export is not a profile');
  const setup = parsed.payload.setups[0];
  if (!setup) throw new Error('the export has no battle setup');
  const base = buildStackRequest(parsed.payload, setup);

  const raw = JSON.parse(text) as {
    payload: { troops?: { excludedUnitIds?: string[] }; setups?: { excludedUnitIds?: string[] }[] };
  };
  const excluded = new Set(
    raw.payload.setups?.[0]?.excludedUnitIds ?? raw.payload.troops?.excludedUnitIds ?? [],
  );

  // Rebuilt field by field rather than spread, so the request carries exactly the engine contract.
  const twelve: StackRequest = {
    units: base.units,
    caps: base.caps,
    housing: base.housing,
    totals: base.totals,
    options: base.options,
    enemy: base.enemy,
    activeEvents: base.activeEvents,
    recovery: base.recovery,
  };
  return { eight: { ...twelve, units: twelve.units.filter((unit) => !excluded.has(unit.id)) }, twelve };
}

describe.skipIf(!existsSync(EXPORT))("the owner's 2026-09-13 export", () => {
  const bestOf = (candidates: CompleteCandidate[], method: CompleteMethod): CompleteCandidate => {
    const found = candidates.find((candidate) => candidate.method === method);
    if (!found) throw new Error(`no candidate for ${method}`);
    return found;
  };

  it('is the army investigation 0014 measured: 8 types out of a pool of 12, four mercenaries', () => {
    const { eight, twelve } = ownerRequest();
    expect(twelve.units).toHaveLength(12);
    expect(eight.units.map((unit) => unit.label).sort()).toEqual([
      'ABT6',
      'CHR6',
      'EMH6',
      'LGN6',
      'RD2',
      'RD3',
      'SP2',
      'SW1',
    ]);
    expect(eight.caps).toEqual({
      'arbalester-6': 76,
      'chariot-6': 37,
      [EMH6]: 92,
      'legionary-6': 72,
    });
  });

  it('answers "Hired last + damage trades", not "Troops first" — over one march and over ten', () => {
    const { eight } = ownerRequest();
    const found = searchComplete({
      request: eight,
      objective: 'avgDamage',
      campaign: { marches: 10 },
      budgetMs: 60_000,
      seed: 1,
    });

    expect(found.exhaustive).toBe(true);
    expect(found.winner.method).toBe('msRelaxed');
    expect(found.winner.spend).toBe(1);

    const trades = bestOf(found.candidates, 'msRelaxed');
    const troopsFirst = bestOf(found.candidates, 'elite');
    // Investigation 0014 §5: 4,257,493 against 4,064,580 on one march, +4.7 %.
    expect(trades.single.score).toBeGreaterThan(troopsFirst.single.score);
    expect(trades.single.score / troopsFirst.single.score).toBeGreaterThan(1.04);
    // And the gap does not close over the campaign.
    expect(trades.score).toBeGreaterThan(troopsFirst.score);
    expect(trades.campaign.fought).toBe(10);
  });

  it('burns the mercenary stocks it fields, and keeps what it does not', () => {
    const { eight } = ownerRequest();
    const full = simulateCampaign({ ...eight, options: { ...eight.options, method: 'ms' } }, { marches: 10 });
    const half = simulateCampaign(
      { ...eight, options: { ...eight.options, method: 'ms' } },
      { marches: 10, spend: 0.5 },
    );

    const burnt = (lost: Record<string, number>): number =>
      Object.values(lost).reduce((total, count) => total + count, 0);
    expect(burnt(half.lost)).toBeLessThan(burnt(full.lost));
    expect(full.totalAvg).toBeGreaterThan(half.totalAvg);
    // Authority 200 is what sizes this army, not the caps: half the stock still fields the same Epic
    // Monster Hunters, so that one stack loses exactly as many either way.
    expect(half.lost[EMH6]).toBe(full.lost[EMH6]);
    for (const id of Object.keys(eight.caps)) {
      expect(full.remaining[id]).toBeGreaterThanOrEqual(0);
      expect((full.lost[id] ?? 0) + (full.remaining[id] ?? 0)).toBe(eight.caps[id]);
    }
  });
});
