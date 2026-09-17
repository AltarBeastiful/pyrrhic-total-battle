/**
 * **The benchmark, as a standing test** (owner, 2026-09-18: *"always benchmark our total optimization against
 * the two others to understand if we're finding something interesting or just changing numbers without really
 * improving on the current stack algorithm"*).
 *
 * Complete optimization against Tier ladder and Troops first — each as the plain sizer and as Generate runs
 * it on the owner's setup, the priority search on average damage — and every plan stop, all played for the
 * same four marches: the sizer methods re-sized each march on the stock the last one left (a chunk of ten
 * lost per hired stack fielded), the plan as its own sequence of repeats and finale. Every march is priced by
 * `simulateBattle` on its counts. The report form of this is `tools/theorycraft/100-three-methods.test.ts`;
 * the table each case measured here is written to `tools/theorycraft/out/benchmark-latest.md`.
 *
 * What must hold, or the plan is changing numbers rather than improving on the sizers (floors measured on
 * 2026-09-18):
 *
 *  - the most-mercs stop reaches at least 94 % of the best sizer sequence's four-march damage (the sizers
 *    may edge it by burning far more of the stock — measured 1–5 % — but not by more);
 *  - the plan's best stop **a hired unit** beats every sizer sequence on that ratio;
 *  - the plan's best stop **a silver** reaches at least 95 % of the best sizer sequence's.
 *
 * **Known gap, measured 2026-09-18 and pinned below:** on the 2026-09-17 export at its setup the plain
 * Troops-first sequence beats the plan's *sweet spot* on both ratios (2.14 a silver · 426 216 a hired against
 * 1.95 · 376 087); at 12 000 it beats it a silver only. The sizer re-sizes each march smaller as the stock drains — a descending sequence the
 * plan cannot express, since it repeats one march and plays a finale. The pin flips when that shape lands.
 *
 * Runs where the owner's export is (skipped elsewhere): the 2026-09-17 export at its setup and at 12 000
 * leadership, and his live account of 2026-09-18 built from it.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { planCampaign } from '@/engine';
import { simulateBattle } from '@/engine/battle';
import { buildKillOrder } from '@/engine/killOrder';
import { chunks } from '@/engine/recovery';
import { searchPriority } from '@/engine/search';
import { sizeStacks } from '@/engine/stacker';
import type { Stack, StackRequest, StackResult } from '@/engine/types';
import { effectiveUnit, hitDamage } from '@/engine/units';
import { parseImport } from '@/share/exportImport';
import type { BattleSetup, Profile } from '@/state/schema';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';

const OWNER_EXPORT =
  process.env.PYRRHIC_EXPORT_2026_09_17 ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (2).json';
const HORIZON = 4;
const SEARCH_BUDGET_MS = 3_000;
/** Measured 2026-09-18: 94.9 % on the 2026-09-17 export at 12 000 leadership, 95.6 % at 7 000, 100 % live. */
const DAMAGE_FLOOR = 0.94;
const SILVER_FLOOR = 0.95;
const REPORT = new URL('../../tools/theorycraft/out/benchmark-latest.md', import.meta.url);
const n = (value: number): string => Math.round(value).toLocaleString('en-US');

/** A march from explicit counts, priced as the recap prices it. */
function price(request: StackRequest, counts: Record<string, number>): { damage: number; silver: number } {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    stacks.push({
      unitId: unit.id,
      pool: unit.pool,
      count,
      hpPerUnit: effective.hpPerUnit,
      totalHp: count * effective.hpPerUnit,
      strengthPerUnit: effective.strengthPerUnit,
      target: effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: effective.doubleDamageChance,
      strikeTwoSquadsChance: effective.strikeTwoSquadsChance,
    });
  }
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rank.get(a.unitId) ?? 0) - (rank.get(b.unitId) ?? 0));
  const pools = {
    leadership: { used: 0, capacity: request.housing.leadership },
    authority: { used: 0, capacity: request.housing.authority },
    dominance: { used: 0, capacity: request.housing.dominance },
  };
  const result: StackResult = { stacks, pools, dropped: [], warnings: [] };
  const summary = simulateBattle(result, request);
  return { damage: summary.avgDamage, silver: summary.recovery.silver };
}

interface Campaign {
  name: string;
  damage: number;
  silver: number;
  burned: number;
}

function campaignOf(request: StackRequest, name: string, marches: Record<string, number>[]): Campaign {
  const mercIds = request.units.filter((u) => u.pool === 'authority').map((u) => u.id);
  let damage = 0;
  let silver = 0;
  let burned = 0;
  for (const counts of marches) {
    const priced = price(request, counts);
    damage += priced.damage;
    silver += priced.silver;
    burned += mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
  }
  return { name, damage, silver, burned };
}

/** A sizer method played for the horizon the way a player plays it: Generate, march, lose a chunk, again. */
function greedy(
  profile: Profile,
  setup: BattleSetup,
  method: 'elite' | 'ms',
  name: string,
  pick: (request: StackRequest) => Record<string, number>,
): Campaign {
  const first = buildStackRequest(profile, { ...setup, options: { ...setup.options, method } });
  const mercIds = first.units.filter((u) => u.pool === 'authority').map((u) => u.id);
  const caps = { ...first.caps };
  const marches: Record<string, number>[] = [];
  for (let i = 0; i < HORIZON; i += 1) {
    const request = { ...first, caps: { ...caps } };
    const counts = pick(request);
    if (Object.values(counts).every((c) => c <= 0)) break;
    marches.push(counts);
    for (const id of mercIds) caps[id] = Math.max(0, (caps[id] ?? 0) - chunks(counts[id] ?? 0));
  }
  return campaignOf(first, name, marches);
}

const countsOf = (result: StackResult): Record<string, number> =>
  Object.fromEntries(result.stacks.map((s) => [s.unitId, s.count]));
const perSilver = (c: Campaign): number => c.damage / Math.max(1, c.silver);
const perHired = (c: Campaign): number => c.damage / Math.max(1, c.burned);

function benchmark(
  profile: Profile,
  setup: BattleSetup,
): { sizers: Campaign[]; plan: Campaign[]; sweet: Campaign; most: Campaign } {
  const sizers: Campaign[] = [];
  for (const [method, title] of [
    ['elite', 'Tier ladder'],
    ['ms', 'Troops first'],
  ] as const) {
    sizers.push(greedy(profile, setup, method, `${title} · all types`, (r) => countsOf(sizeStacks(r))));
    sizers.push(
      greedy(profile, setup, method, `${title} · Generate (average damage)`, (r) =>
        countsOf(searchPriority({ request: r, objective: 'avgDamage', budgetMs: SEARCH_BUDGET_MS }).result),
      ),
    );
  }
  const input = buildPlanRequest(profile, setup);
  const planned = planCampaign(input);
  const plan = planned.alternatives.map((stop) => {
    const repeats = stop.marches - (stop.finaleCounts ? 1 : 0);
    const marches = Array.from({ length: repeats }, () => stop.counts);
    if (stop.finaleCounts) marches.push(stop.finaleCounts);
    const campaign = campaignOf(input.request, `Complete optimization · ${stop.pick}`, marches);
    // The engine's own campaign figure and the four marches priced one by one must agree.
    expect(Math.abs(campaign.damage - stop.totalDamage)).toBeLessThanOrEqual(1);
    return campaign;
  });
  const sweet = plan.find((c) => c.name.endsWith('sweet-spot'));
  const most = plan[plan.length - 1];
  if (!sweet || !most) throw new Error('no sweet spot or top');
  return { sizers, plan, sweet, most };
}

function expectPlanWins(
  label: string,
  profile: Profile,
  setup: BattleSetup,
  knownGap: { sweetLosesOnBoth: boolean },
): void {
  const { sizers, plan, sweet, most } = benchmark(profile, setup);
  const rows = [...sizers, ...plan];
  const lines = [
    `## ${label}`,
    '',
    '| sequence | four-march damage | silver | hired burned | a silver | a hired |',
    '|---|---|---|---|---|---|',
    ...rows.map(
      (c) =>
        `| ${c.name} | ${n(c.damage)} | ${n(c.silver)} | ${n(c.burned)} | ${perSilver(c).toFixed(2)} | ${n(perHired(c))} |`,
    ),
    '',
  ];
  appendFileSync(REPORT, `${lines.join('\n')}\n`);

  const bestSizerDamage = Math.max(...sizers.map((c) => c.damage));
  const bestSizerPerSilver = Math.max(...sizers.map(perSilver));
  const bestSizerPerHired = Math.max(...sizers.map(perHired));
  const planPerSilver = Math.max(...plan.map(perSilver));
  const planPerHired = Math.max(...plan.map(perHired));
  const tell = rows.map((c) => `${c.name}: ${n(c.damage)} / ${n(c.silver)} / ${n(c.burned)}`).join('; ');
  expect(most.damage, `most mercs against the best sizer sequence (${tell})`).toBeGreaterThanOrEqual(
    DAMAGE_FLOOR * bestSizerDamage,
  );
  expect(planPerHired, `the plan's best a hired against the sizers (${tell})`).toBeGreaterThan(
    bestSizerPerHired,
  );
  expect(planPerSilver, `the plan's best a silver against the sizers (${tell})`).toBeGreaterThanOrEqual(
    SILVER_FLOOR * bestSizerPerSilver,
  );
  // The pinned state of the sweet spot against the sizer sequences: a change either way is news.
  const sweetLoses = sizers.some((c) => perSilver(c) >= perSilver(sweet) && perHired(c) >= perHired(sweet));
  expect(sweetLoses, `the sweet spot beaten on both ratios by a sizer sequence (${tell})`).toBe(
    knownGap.sweetLosesOnBoth,
  );
}

describe.skipIf(!existsSync(OWNER_EXPORT))(
  'the plan against Tier ladder and Troops first, over four marches',
  () => {
    const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
    const profile = parsed?.kind === 'profile' ? parsed.payload : null;
    const setup = profile?.setups[0];
    if (profile) {
      mkdirSync(new URL('.', REPORT), { recursive: true });
      writeFileSync(
        REPORT,
        '# The plan against Tier ladder and Troops first — the latest run of `tests/engine/plan-benchmark.test.ts`\n\n' +
          'Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate ' +
          'four times), the plan as its own repeats and finale. Each march priced by `simulateBattle` on its counts.\n\n',
      );
    }

    test('on the 2026-09-17 export at its setup', () => {
      if (!profile || !setup) throw new Error('no profile');
      expectPlanWins('2026-09-17 export, its setup (7 000 leadership)', profile, setup, {
        sweetLosesOnBoth: true,
      });
    }, 300_000);

    test('on the 2026-09-17 export at 12 000 leadership', () => {
      if (!profile || !setup) throw new Error('no profile');
      expectPlanWins(
        '2026-09-17 export, 12 000 leadership',
        profile,
        { ...setup, housing: { ...setup.housing, leadership: 12_000 } },
        // Troops first (all types) beats it a silver (1.78 against 1.72) and not a hired (477 687 against 481 063).
        { sweetLosesOnBoth: false },
      );
    }, 300_000);

    test('on the owner’s live account of 2026-09-18 (one hired type, 20 000 leadership)', () => {
      if (!profile || !setup) throw new Error('no profile');
      const live = structuredClone(profile);
      live.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 83 }];
      live.sources.captains = [
        { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
        { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
        { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
      ];
      expectPlanWins(
        'live account of 2026-09-18 (one hired type, 20 000 leadership)',
        live,
        { ...setup, housing: { leadership: 20_000, authority: 2_180, dominance: 0 } },
        { sweetLosesOnBoth: false },
      );
    }, 300_000);
  },
);
