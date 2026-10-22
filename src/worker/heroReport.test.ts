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
import { runHeroReport, type HeroProbe, type HeroRoster } from './heroReport';

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

const pointsOf = (captainIds: readonly string[]): number =>
  captainIds.reduce((sum, id) => sum + (POINTS[id] ?? 0), 0);

const lineupOf = (captainIds: string[]) => ({
  key: captainIds.join(','),
  totals: withArmy(pointsOf(captainIds)),
});

/** Star `k` of a hero adds `adds[id][k - 1]` army points to the lineup it is read in (negative: a worse trade). */
function upgradesOf(adds: Record<string, number[]>): NonNullable<HeroRoster['upgrades']> {
  return (trio) => {
    const out: HeroProbe[] = [];
    for (const [captainId, steps] of Object.entries(adds))
      steps.forEach((extra, at) => {
        const make = (role: 'solo' | 'trio', members: string[]) => {
          const base = lineupOf(members);
          out.push({
            id: `${role}:${captainId}:${String(at + 1)}`,
            label: `${captainId} ★${String(at + 1)}`,
            captainId,
            role,
            kind: 'star',
            size: at + 1,
            base,
            upgraded: {
              key: `${base.key}+${captainId}${String(at + 1)}`,
              totals: withArmy(pointsOf(members) + extra),
            },
          });
        };
        make('solo', [captainId]);
        if (trio?.includes(captainId) === true) make('trio', [...trio]);
      });
    return out;
  };
}

function roster(upgrades?: HeroRoster['upgrades']): HeroRoster {
  const ids = Object.keys(POINTS);
  const lineup = lineupOf;
  const trios: string[][] = [];
  for (let i = 0; i < ids.length; i += 1)
    for (let j = i + 1; j < ids.length; j += 1)
      for (let k = j + 1; k < ids.length; k += 1) trios.push([ids[i]!, ids[j]!, ids[k]!]);
  return {
    heroes: ids.map((captainId) => ({ captainId, name: captainId.toUpperCase(), level: 10, star: 1 })),
    none: { key: '', totals: withArmy(0) },
    solos: ids.map((id) => ({ captainIds: [id], ...lineup([id]) })),
    trios: trios.map((captainIds) => ({ captainIds, ...lineup(captainIds) })),
    upgrades,
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
      const report = await runHeroReport(campaign(), await leadOf(), roster(), pool, {
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

async function reportWith(upgrades: HeroRoster['upgrades'], situations = false) {
  const pool = poolOf(2);
  const report = await runHeroReport(campaign(), await leadOf(), roster(upgrades), pool, { situations });
  pool.dispose();
  return report;
}

describe('runHeroReport upgrades', () => {
  test(
    'reads each upgrade in the lineup it plays in: every hero alone, the best trio members in the trio',
    async () => {
      const report = await reportWith(upgradesOf({ a: [20], b: [20], d: [20] }));
      const tile = (id: string) => report.tiles.find((candidate) => candidate.captainId === id);
      expect(tile('a')?.soloUp.star?.size).toBe(1);
      expect(tile('d')?.soloUp.star?.size).toBe(1);
      // d is outside the best trio (a, b, c): it has no trio reading.
      expect(tile('d')?.trioUp).toBeUndefined();
      expect(tile('b')?.trioUp?.star?.size).toBe(1);
      expect(report.banner.solo.length).toBeGreaterThan(0);
      // The best of them are planned in full (tier 2): they carry the re-priced gain they started from.
      expect(report.worth.solo.some((row) => row.tier1 !== undefined)).toBe(true);
      expect(report.banner.trio.every((action) => ['a', 'b'].includes(action.captainId))).toBe(true);
    },
    TIMEOUT,
  );

  test(
    'names the star count to add, and a count that worsens the trade by far',
    async () => {
      const report = await reportWith(upgradesOf({ a: [30, 45, -90] }));
      const star = report.tiles.find((tile) => tile.captainId === 'a')?.soloUp.star;
      expect(star?.size).toBeGreaterThanOrEqual(1);
      expect(star?.worse.map((entry) => entry.size)).toContain(3);
      expect(Math.min(...(star?.worse.map((entry) => entry.trade) ?? [0]))).toBeLessThan(
        -CAMPAIGN.heroReport.tradeWarn,
      );
      const trio = report.tiles.find((tile) => tile.captainId === 'a')?.trioUp?.star;
      expect(trio?.worse.map((entry) => entry.size)).toContain(3);
    },
    TIMEOUT,
  );

  test(
    'with no upgrades every hero holds',
    async () => {
      const report = await reportWith(undefined);
      expect(report.tiles.every((tile) => tile.soloUp.verdict === 'hold')).toBe(true);
      expect(report.banner).toEqual({ solo: [], trio: [] });
    },
    TIMEOUT,
  );
});

describe('runHeroReport situations', () => {
  test(
    'reads the mercenary situations, and says why the monster one could not be read on an army without a monster',
    async () => {
      const report = await reportWith(undefined, true);
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
        answers.push(
          await runHeroReport(input, lead, roster(upgradesOf({ a: [20, 30], b: [10] })), pool, {
            budgetMs: 1_000_000_000,
          }),
        );
        pool.dispose();
      }
      expect(answers[1]).toEqual(answers[0]);
      expect(answers[0]?.situations.map((row) => row.id)).toContain('moreMercs');
      expect(input).toEqual(before);
    },
    TIMEOUT,
  );
});
