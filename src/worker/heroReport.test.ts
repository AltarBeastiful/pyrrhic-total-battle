/**
 * **The hero report** (`docs/plans/hero-report.md`), through its one entry point, `runHeroReport`: the roles
 * (solo, trio), the best trio over the bar, the actions on the upgrade worth list, the situations and their flips.
 * Lineups are synthetic army bonuses, so what a hero is worth is known by construction.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { CampaignInput } from '@/engine/plan';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { runCaptainAdvice } from './captainAdvice';
import { createInlineClient, type CalcClient } from './client';
import { createCalcPool } from './pool';
import type { WorthResult } from './captainUpgrades';
import { runHeroReport, type HeroRoster } from './heroReport';

const TIMEOUT = 120_000;

function withArmy(points: number): BonusTotals {
  const totals = emptyTotals();
  totals.health.army = points;
  totals.strength.army = points;
  return totals;
}

function request(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 30;
  return {
    units: [...troops, ...mercs],
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: withArmy(20),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

function campaign(): CampaignInput {
  return {
    request: request(),
    marchTarget: CAMPAIGN.marches,
    ...CAMPAIGN.planFixes,
    putBack: CAMPAIGN.putBack,
  };
}

function poolOf(size: number) {
  return createCalcPool({
    size,
    createClient: (): CalcClient => ({ ...createInlineClient(), mode: 'worker' }),
  });
}

/** Five heroes whose army bonus is their name's weight; a lineup's bonus is the sum of its heroes'. */
const POINTS: Record<string, number> = { a: 100, b: 40, c: 30, d: 5, e: 0 };

function roster(): HeroRoster {
  const ids = Object.keys(POINTS);
  const lineup = (captainIds: string[]) => ({
    key: captainIds.join(','),
    totals: withArmy(captainIds.reduce((sum, id) => sum + (POINTS[id] ?? 0), 0)),
  });
  const trios: string[][] = [];
  for (let i = 0; i < ids.length; i += 1)
    for (let j = i + 1; j < ids.length; j += 1)
      for (let k = j + 1; k < ids.length; k += 1) trios.push([ids[i]!, ids[j]!, ids[k]!]);
  return {
    heroes: ids.map((captainId) => ({ captainId, name: captainId.toUpperCase(), level: 10, star: 1 })),
    none: { key: '', totals: withArmy(0) },
    solos: ids.map((id) => ({ captainIds: [id], ...lineup([id]) })),
    trios: trios.map((captainIds) => ({ captainIds, ...lineup(captainIds) })),
  };
}

async function leadOf() {
  const pool = poolOf(1);
  const advice = await runCaptainAdvice(campaign(), [{ key: 'now', totals: withArmy(20) }], 'now', pool);
  pool.dispose();
  const stops = advice.plans['now'];
  if (stops === undefined) throw new Error('The baseline plan must be kept under the current key.');
  return { key: 'now', totals: withArmy(20), stops };
}

describe('runHeroReport roles', () => {
  test(
    'scores each hero alone, picks the best trio over the bar, and credits the trio members only',
    async () => {
      const pool = poolOf(2);
      const report = await runHeroReport(campaign(), await leadOf(), roster(), null, pool, {
        situations: false,
      });
      pool.dispose();

      const solo = (id: string) => report.tiles.find((tile) => tile.captainId === id)?.solo ?? NaN;
      expect(solo('a')).toBeGreaterThan(solo('b'));
      expect(solo('b')).toBeGreaterThan(solo('c'));
      expect(solo('c')).toBeGreaterThan(solo('d'));
      expect(solo('e')).toBe(0);

      expect(report.bestTrio?.captainIds).toEqual(['a', 'b', 'c']);
      expect(report.bestTrio?.stops).toHaveLength(report.stops.length);

      const trio = (id: string) => report.tiles.find((tile) => tile.captainId === id)?.trio ?? NaN;
      expect(trio('a')).toBeGreaterThan(trio('b'));
      expect(trio('b')).toBeGreaterThan(trio('c'));
      expect(trio('c')).toBeGreaterThan(0);
      expect(trio('d')).toBe(0);
      expect(trio('e')).toBe(0);
    },
    TIMEOUT,
  );
});

/** A worth list as the pass would give it: only the fields the report reads. */
function worthOf(
  rows: [string, 'level' | 'star', number, number, { amount: number; unit: string }?][],
): WorthResult {
  return {
    lead: 'now',
    inferred: [],
    cut: [],
    failed: [],
    rows: rows.map(([captainId, kind, size, worth, cost]) => ({
      id: `captain:${captainId}:${kind}+${String(size)}`,
      label: `${captainId} ${kind}+${String(size)}`,
      captainId,
      kind,
      size,
      worth,
      ...(cost === undefined ? {} : { cost }),
      tier1: { stops: [], gain: worth, lineups: [] },
    })),
  };
}

async function reportWith(worth: WorthResult, situations = false) {
  const pool = poolOf(2);
  const report = await runHeroReport(campaign(), await leadOf(), roster(), worth, pool, { situations });
  pool.dispose();
  return report;
}

describe('runHeroReport actions', () => {
  test(
    'names level only, stars only, both or hold per hero, and a banner of the best actions',
    async () => {
      const report = await reportWith(
        worthOf([
          ['a', 'level', 5, 4],
          ['a', 'star', 1, 4],
          ['b', 'star', 1, 10],
          ['b', 'level', 5, 1],
          ['c', 'level', 5, 0.2],
          ['d', 'level', 5, 3],
        ]),
      );
      const verdict = (id: string) => report.tiles.find((tile) => tile.captainId === id)?.verdict;
      expect(verdict('a')).toBe('both');
      expect(verdict('b')).toBe('star');
      expect(verdict('c')).toBe('hold');
      expect(verdict('d')).toBe('level');
      expect(verdict('e')).toBe('hold');
      expect(report.banner.map((action) => [action.captainId, action.kind])).toEqual([
        ['b', 'star'],
        ['a', 'level'],
        ['a', 'star'],
      ]);
      expect(report.plan.map((tile) => tile.captainId)).toEqual(['b', 'a', 'd']);
      expect(report.unit).toBeNull();
    },
    TIMEOUT,
  );

  test(
    'the banner shows two when the third gain is marginal, and ranks gain per cost when a cost was typed',
    async () => {
      const marginal = await reportWith(
        worthOf([
          ['a', 'star', 1, 10],
          ['b', 'star', 1, 8],
          ['c', 'star', 1, 1],
        ]),
      );
      expect(marginal.banner.map((action) => action.captainId)).toEqual(['a', 'b']);

      const costed = await reportWith(
        worthOf([
          ['a', 'star', 1, 10, { amount: 100, unit: 'shards' }],
          ['b', 'star', 1, 6, { amount: 20, unit: 'shards' }],
        ]),
      );
      expect(costed.banner.map((action) => action.captainId)).toEqual(['b', 'a']);
      expect(costed.banner[0]?.score).toBeCloseTo(0.3);
      expect(costed.unit).toBe('shards');
    },
    TIMEOUT,
  );

  test(
    'a hero that matters nowhere is flagged to fold, and no worth list leaves every verdict on hold',
    async () => {
      const report = await reportWith(worthOf([]));
      expect(report.tiles.every((tile) => tile.verdict === 'hold')).toBe(true);
      const matters = (id: string) => report.tiles.find((tile) => tile.captainId === id)?.matters;
      expect(matters('a')).toBe(true);
      expect(matters('e')).toBe(false);
    },
    TIMEOUT,
  );
});

describe('runHeroReport situations', () => {
  test(
    'reads the mercenary situations, and says why the monster one could not be read on an army without a monster',
    async () => {
      const report = await reportWith(worthOf([]), true);
      expect(report.situations.map((row) => row.id)).toEqual(['default', 'moreMercs', 'otherMercs']);
      expect(report.skipped).toEqual([{ id: 'monsters', why: 'The army fields no monster.' }]);
      for (const row of report.situations) expect(row.bestSolo).toBe('a');
      expect(report.tiles.every((tile) => tile.flips.length === 0)).toBe(true);
    },
    TIMEOUT,
  );
});

describe('runHeroReport determinism', () => {
  test(
    'one worker and three give the same report, and the inputs are left as they were',
    async () => {
      const lead = await leadOf();
      const input = campaign();
      const before = structuredClone(input);
      const answers = [];
      for (const size of [1, 3]) {
        const pool = poolOf(size);
        answers.push(await runHeroReport(input, lead, roster(), null, pool));
        pool.dispose();
      }
      expect(answers[1]).toEqual(answers[0]);
      expect(answers[0]?.situations.map((row) => row.id)).toContain('moreMercs');
      expect(input).toEqual(before);
    },
    TIMEOUT,
  );
});
