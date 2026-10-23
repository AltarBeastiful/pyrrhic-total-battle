/**
 * **The hero champion pass** (`docs/plans/the-hero-champion.md`), through its one entry point, `runHeroChampion`:
 * the grid of star and level points planned in waves, the champion drawn after each wave, the trios last. Lineups
 * are synthetic army bonuses, so who should win is known by construction.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { HeroChampion } from '@/engine/heroChampion';
import type { CampaignInput } from '@/engine/plan';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { createInlineClient, type CalcClient } from './client';
import { runHeroChampion, type ChampionRoster } from './heroChampion';
import { createCalcPool } from './pool';

const TIMEOUT = 300_000;

function withArmy(points: number): BonusTotals {
  const totals = emptyTotals();
  totals.health.army = points;
  totals.strength.army = points;
  return totals;
}

function request(leadership: number): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 30;
  return {
    units: [...troops, ...mercs],
    caps,
    housing: { leadership, authority: 2_000, dominance: 0 },
    totals: withArmy(20),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

const campaign = (leadership: number): CampaignInput => ({
  request: request(leadership),
  marchTarget: CAMPAIGN.marches,
  ...CAMPAIGN.planFixes,
  putBack: CAMPAIGN.putBack,
});

/** a is the strongest hero, then b, then c; a hero gains 2 army points a star and 0.1 a level. */
const BASE: Record<string, number> = { a: 60, b: 40, c: 20, d: 20 };
const power = (id: string, star: number, level: number): number => (BASE[id] ?? 0) + 2 * star + level / 10;

const heroes = [
  { captainId: 'a', name: 'A', level: 20, star: 0 },
  { captainId: 'b', name: 'B', level: 20, star: 0 },
  { captainId: 'c', name: 'C', level: 20, star: 0 },
  { captainId: 'g', name: 'G', level: 20, star: 0, onlyOn: 'group' },
];

function rosterOf(): ChampionRoster {
  return {
    heroes,
    variant: (jitter) => ({
      input: campaign(Math.round(4_000 * (1 + jitter))),
      none: withArmy(0),
      hero: (id, star, level) => withArmy(power(id, star, level)),
      trio: (ids, raise) =>
        withArmy(
          ids.reduce(
            (sum, id) =>
              sum + (raise?.captainId === id ? power(id, raise.star, raise.level) : power(id, 0, 20)),
            0,
          ),
        ),
    }),
  };
}

const poolOf = () =>
  createCalcPool({ size: 1, createClient: (): CalcClient => ({ ...createInlineClient(), mode: 'worker' }) });

describe('runHeroChampion', () => {
  test(
    'names the strongest hero champion, draws after every wave, and reads the trios last',
    async () => {
      const pool = poolOf();
      const waves: HeroChampion[] = [];
      try {
        const result = await runHeroChampion(rosterOf(), pool, {
          budgetMs: 1_000_000,
          onWave: (champion) => waves.push(champion),
        });
        expect(result.champion.champion?.captainId).toBe('a');
        expect(result.champion.challenger?.captainId).toBe('b');
        expect(result.cuts).toEqual([]);
        // The hero that counts on one kind of march is listed apart, never in the race.
        expect(result.champion.situational.map((hero) => hero.captainId)).toEqual(['g']);
        expect(result.champion.board.map((entry) => entry.captainId)).not.toContain('g');
        // Each wave brings more: the first has the stars at the hero's level, the last the trios.
        expect(waves.length).toBeGreaterThanOrEqual(3);
        expect(waves[0]?.trios).toBeUndefined();
        expect(waves.at(-1)?.trios?.advised?.captainIds.slice().sort()).toEqual(['a', 'b', 'c']);
        //         // The champion's and the challenger's star curves were read on three plans, so they are told their valleys.
        expect(Object.keys(result.champion.valleys).sort()).toEqual(['a', 'b']);
        expect(result.champion.tiles[0]?.starPath.map((point) => point.star)).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(result.champion.tiles[0]?.levelPath.at(-1)?.level).toBe(CAMPAIGN.captainMaxLevel);
      } finally {
        pool.dispose();
      }
    },
    TIMEOUT,
  );

  test(
    'a spent clock leaves the first wave out and says so',
    async () => {
      const pool = poolOf();
      try {
        const result = await runHeroChampion(rosterOf(), pool, { budgetMs: 0 });
        expect(result.cuts.length).toBeGreaterThan(0);
        expect(result.champion.champion).toBeNull();
      } finally {
        pool.dispose();
      }
    },
    TIMEOUT,
  );
});
