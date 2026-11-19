/**
 * 363 — **what a talent bonus is worth, by troop group** (B-23 c): for every benchmark army, what the sweet-spot
 * march gains when a bonus line rises by a fraction of the *full scale* the talent trees give it, as strength,
 * as health and as double-damage chance.
 *
 * The instrument is the advisor's **re-priced** reading: the plan's own counts, battled again under the raised
 * line (`ShownStop.repriced` over `current`), so no search noise enters and the figure is the engine's own. The
 * sweet-spot stop is the headline, as everywhere in the advisor.
 *
 * Writes `tools/theorycraft/out/363-talent-usefulness.md` (per army and stable ratios) and
 * `tools/theorycraft/out/363-talent-usefulness.json` (the data the shipped table is built from).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/363-talent-usefulness.test.ts`
 * `THEORY_ONLY=<n>` reads army n alone (a trial run).
 */
/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { BonusKey, SpecialKey } from '../../src/data/types';
import { talents } from '../../src/data';
import { headlineOf, type AdvisorRow } from '../../src/engine/advisor';
import type { CampaignInput } from '../../src/engine/plan';
import type { Probe } from '../../src/engine/probes';
import { runAdvisor } from '../../src/worker/advisor';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { newProfile } from '../../src/state/defaults';
import { buildStackRequest } from '../../src/state/derive';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

/**
 * **Measurement armies** the benchmark does not hold (owner, 2026-11-19: add high-tier specialists and more
 * monsters): they exist for this experiment only. They are not registered scenarios; the owner registers one.
 */
function extraArmies(): { label: string; request: StackRequest }[] {
  const build = (
    label: string,
    edit: (p: ReturnType<typeof newProfile>) => void,
    housing: { leadership: number; authority: number; dominance: number },
  ): { label: string; request: StackRequest } => {
    const profile = newProfile('measurement');
    profile.mercenaries.selected = [{ id: 'bear-5', cap: 10 }];
    edit(profile);
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');
    return { label, request: buildStackRequest(profile, { ...setup, housing }) };
  };
  return [
    build(
      'measurement: specialists I–VI, guardsmen I–VI (20 000 / 8 000)',
      (p) => {
        p.troops.guardsmen = { min: 1, max: 6 };
        p.troops.specialists = { min: 1, max: 6 };
      },
      { leadership: 20_000, authority: 8_000, dominance: 0 },
    ),
    build(
      'measurement: specialists IV–IX, guardsmen I–III (20 000 / 8 000)',
      (p) => {
        p.troops.guardsmen = { min: 1, max: 3 };
        p.troops.specialists = { min: 4, max: 9 };
      },
      { leadership: 20_000, authority: 8_000, dominance: 0 },
    ),
    build(
      'measurement: monsters 3–7 at 2 000 dominance, guardsmen I–III',
      (p) => {
        p.troops.monsters = { min: 3, max: 7 };
      },
      { leadership: 20_000, authority: 2_180, dominance: 2_000 },
    ),
    build(
      'measurement: monsters 5–9 at 5 000 dominance, specialists I–IV',
      (p) => {
        p.troops.monsters = { min: 5, max: 9 };
        p.troops.specialists = { min: 1, max: 4 };
      },
      { leadership: 20_000, authority: 4_000, dominance: 5_000 },
    ),
  ];
}

function lanes(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

/** The fractions of the full scale each line is read at. */
const FRACTIONS = [0.25, 0.5, 0.75, 1] as const;

/** A talent bonus line: the engine key it raises, and the node-name stem that carries it in the table. */
const STAT_LINES: readonly { key: BonusKey; stem: string }[] = [
  { key: 'guardsmen', stem: "Guardsmen's" },
  { key: 'specialist', stem: "Specialists'" },
  { key: 'monster', stem: "Monsters'" },
  { key: 'engineers', stem: "Engineer corps'" },
  { key: 'melee', stem: "Melee units'" },
  { key: 'ranged', stem: "Ranged units'" },
  { key: 'mounted', stem: "Mounted units'" },
  { key: 'flying', stem: "Flying units'" },
  { key: 'army', stem: 'Army' },
];
const CRIT_LINES: readonly { key: SpecialKey; stem: string }[] = [
  { key: 'guardsmenDoubleDamageChance', stem: 'guardsmen' },
  { key: 'specialistsDoubleDamageChance', stem: 'specialists' },
  { key: 'monstersDoubleDamageChance', stem: 'monsters' },
  { key: 'engineersDoubleDamageChance', stem: 'engineer corps' },
];

/** The full scale of a line: every node of the trees that raises it, at its last rank. */
function fullScale(stat: 'UNIT_POWER' | 'UNIT_HEALTH' | 'UNIT_CRIT', stem: string): number {
  let sum = 0;
  for (const t of talents) {
    if (t.tree !== 'battle' && t.tree !== 'expert') continue;
    if (!t.stats.includes(stat)) continue;
    const name = t.name.toLowerCase();
    const hit = stat === 'UNIT_CRIT' ? name.includes(`chance for ${stem} to deal`) : t.name.startsWith(stem);
    if (hit) sum += t.values[t.values.length - 1] ?? 0;
  }
  return sum;
}

interface Line {
  id: string;
  stat: 'strength' | 'health' | 'crit';
  key: string;
  fraction: number;
  delta: number;
  probe: Probe;
}

function lines(): Line[] {
  const out: Line[] = [];
  for (const { key, stem } of STAT_LINES) {
    for (const [stat, talentStat] of [
      ['strength', 'UNIT_POWER'],
      ['health', 'UNIT_HEALTH'],
    ] as const) {
      const scale = fullScale(talentStat, stem);
      if (scale === 0) continue;
      for (const fraction of FRACTIONS) {
        const delta = scale * fraction;
        out.push({
          id: `${stat}:${key}@${fraction}`,
          stat,
          key,
          fraction,
          delta,
          probe: {
            id: `${stat}:${key}@${fraction}`,
            family: stat,
            label: `${stat} +${delta} ${key}`,
            apply: (req) => ({
              ...req,
              totals: {
                ...req.totals,
                [stat]: { ...req.totals[stat], [key]: req.totals[stat][key] + delta },
              },
            }),
          },
        });
      }
    }
  }
  for (const { key, stem } of CRIT_LINES) {
    const scale = fullScale('UNIT_CRIT', stem);
    for (const fraction of FRACTIONS) {
      const delta = scale * fraction;
      out.push({
        id: `crit:${key}@${fraction}`,
        stat: 'crit',
        key,
        fraction,
        delta,
        probe: {
          id: `crit:${key}@${fraction}`,
          family: 'strength',
          label: `crit +${delta} ${key}`,
          apply: (req) => ({
            ...req,
            totals: {
              ...req.totals,
              special: { ...req.totals.special, [key]: req.totals.special[key] + delta },
            },
          }),
        },
      });
    }
  }
  return out;
}

const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/**
 * Two readings of the sweet-spot stop under a raised line, in % of the current damage: the plan's own counts
 * battled again (`repriced`, can be negative: more health moves a stack up the enemy's kill order), and what a
 * new Generate would give (`best`: the re-planned or re-priced march, never below 0 — the advisor's gain).
 */
function damageChange(row: AdvisorRow): { repriced: number; best: number } | null {
  const stop = headlineOf(row);
  if (stop === undefined) return null;
  const before = stop.current.bill.damage;
  if (before <= 0) return null;
  return { repriced: (stop.repriced.bill.damage / before - 1) * 100, best: stop.damagePercent };
}

describe.skipIf(!process.env.THEORY)('363 — what a talent bonus is worth', () => {
  it('reads every line at four fractions of its full scale on every benchmark army', async () => {
    const profile = ownerProfile();
    const all: { label: string; request: StackRequest }[] = [
      ...(profile ? ownerScenarios(profile) : []),
      ...commonScenarios(),
      ...extraArmies(),
    ];
    const only = process.env.THEORY_ONLY === undefined ? undefined : Number(process.env.THEORY_ONLY);
    const scenarios = only === undefined ? all : all.filter((_, i) => i === only);
    mkdirSync('tools/theorycraft/out/363', { recursive: true });
    writeFileSync(
      'tools/theorycraft/out/363/count.txt',
      `${String(all.length)}\n${all.map((s, i) => `${String(i)} ${s.label}`).join('\n')}\n`,
    );
    const set = lines();
    const probes = set.map((l) => l.probe);
    // army label -> line id -> damage % change
    const read: Record<string, Record<string, number | null>> = {};
    const readRepriced: Record<string, Record<string, number | null>> = {};
    const md: string[] = [];

    for (const scenario of scenarios) {
      const input: CampaignInput = {
        request: scenario.request,
        marchTarget: HORIZON,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      const pool = createCalcPool({ size: 1, createClient: lanes });
      const began = performance.now();
      let result;
      try {
        result = await runAdvisor(input, probes, pool, {
          budgetMs: 900_000,
          reading: 'tight',
          screen: null,
        });
      } catch (error) {
        pool.dispose();
        md.push(
          `## ${scenario.label}\n\nRefused: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        continue;
      }
      pool.dispose();
      const wall = performance.now() - began;
      const byId = new Map(result.rows.map((row) => [row.id, row]));
      const mine: Record<string, number | null> = {};
      const mineRe: Record<string, number | null> = {};
      for (const l of set) {
        const row = byId.get(l.id);
        const change = row === undefined ? null : damageChange(row);
        mine[l.id] = change === null ? null : change.best;
        mineRe[l.id] = change === null ? null : change.repriced;
      }
      read[scenario.label] = mine;
      readRepriced[scenario.label] = mineRe;
      md.push(
        `## ${scenario.label}\n\n${f(wall, 0)} ms; ${result.rows.length}/${probes.length} lines read.\n`,
      );
      md.push(
        '| line (gain, re-priced in brackets) | +points | 25 % | 50 % | 75 % | 100 % |\n|---|---|---|---|---|---|',
      );
      for (const stat of ['strength', 'health', 'crit'] as const) {
        const keys = [...new Set(set.filter((l) => l.stat === stat).map((l) => l.key))];
        for (const key of keys) {
          const cells = FRACTIONS.map((fr) => {
            const v = mine[`${stat}:${key}@${fr}`];
            const re = mineRe[`${stat}:${key}@${fr}`];
            return v === null || v === undefined ? '—' : `${f(v, 2)} % (${f(re ?? 0, 2)})`;
          });
          const full = set.find((l) => l.stat === stat && l.key === key && l.fraction === 1)!.delta;
          md.push(`| ${stat} ${key} | ${f(full, 1)} | ${cells.join(' | ')} |`);
        }
      }
      md.push('');
    }

    // The ratio of a line to strength on the same key, per army, at each fraction (value per point).
    const labels = Object.keys(read);
    const ratios: Record<
      string,
      Record<string, { median: number; min: number; max: number; n: number }>
    > = {};
    for (const stat of ['health', 'crit'] as const) {
      const keys = [...new Set(set.filter((l) => l.stat === stat).map((l) => l.key))];
      for (const key of keys) {
        for (const fr of FRACTIONS) {
          const perArmy: number[] = [];
          for (const label of labels) {
            const against = stat === 'crit' ? undefined : read[label]?.[`strength:${key}@${fr}`];
            const mineV = read[label]?.[`${stat}:${key}@${fr}`];
            if (against === undefined || against === null || mineV === undefined || mineV === null) continue;
            if (against <= 0.0005) continue;
            perArmy.push(mineV / against);
          }
          if (perArmy.length === 0) continue;
          (ratios[`${stat}:${key}`] ??= {})[String(fr)] = {
            median: median(perArmy),
            min: Math.min(...perArmy),
            max: Math.max(...perArmy),
            n: perArmy.length,
          };
        }
      }
    }
    md.push('## Health against strength, by key and fraction (median over armies, [min, max], n)\n');
    md.push('| key | 25 % | 50 % | 75 % | 100 % |\n|---|---|---|---|---|');
    for (const [id, byFr] of Object.entries(ratios)) {
      if (!id.startsWith('health:')) continue;
      md.push(
        `| ${id} | ${FRACTIONS.map((fr) => {
          const r = byFr[String(fr)];
          return r === undefined
            ? '—'
            : `${f(r.median, 2)} [${f(r.min, 2)}, ${f(r.max, 2)}] n=${String(r.n)}`;
        }).join(' | ')} |`,
      );
    }
    md.push('');

    if (only !== undefined) {
      writeFileSync(
        `tools/theorycraft/out/363/army-${String(only)}.json`,
        JSON.stringify({ created: new Date().toISOString(), read, readRepriced }, null, 1),
      );
      return;
    }
    writeFileSync(
      'tools/theorycraft/out/363-talent-usefulness.json',
      JSON.stringify(
        { created: new Date().toISOString(), fractions: FRACTIONS, read, readRepriced, ratios },
        null,
        1,
      ),
    );
    writeFileSync(
      'tools/theorycraft/out/363-talent-usefulness.md',
      `# 363 — what a talent bonus is worth\n\n${md.join('\n')}\n`,
    );
    expect(labels.length).toBeGreaterThan(0);
  }, 3_600_000);
});
