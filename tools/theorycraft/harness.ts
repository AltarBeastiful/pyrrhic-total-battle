/**
 * Theory-crafting harness (investigation 0015). Loads the owner's export, builds the engine request the
 * app would build, and adds what the experiments need on top of the engine's public API:
 *
 *   - two bonus scenarios: **A** the export as it stands (VIP +3 / +3 only, no captain active) and
 *     **B** the bonuses the 2026-09-13 in-game report proved on this account (guardsmen ×2.43 health /
 *     ×2.87 strength, ranged +0.5 / +1 on top, specialist ×1.51 / ×1.71, double damage +3 %);
 *   - `stacksFromCounts`: a StackResult from explicit counts, bypassing the sizer, so an experiment can
 *     test a march the sizer would never produce (every number still comes from `simulateBattle`);
 *   - `describe`: the per-stack table (kill position, hits enemy-first / army-first, damage) that the
 *     report prints so a reader can redo the sums by hand.
 *
 * Run any experiment with `THEORY=1 pnpm vitest run tools/theorycraft/<file>`; each writes its findings
 * to stdout and to `tools/theorycraft/out/<name>.md`.
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { getUnits, unitById } from '../../src/data';
import { aggregateBonuses } from '../../src/engine/bonuses';
import { buildKillOrder } from '../../src/engine/killOrder';
import { simulateBattle } from '../../src/engine/battle';
import { planCampaign } from '../../src/engine/plan';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { sizeStacks } from '../../src/engine/stacker';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import type {
  BattleSummary,
  BonusTotals,
  ResolvedSource,
  Stack,
  StackRequest,
  StackResult,
  UnitDef,
} from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';

export const EXPORT = process.env.PYRRHIC_EXPORT ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-13.json';
/**
 * The owner's export of 2026-09-17: leadership 7 000 / authority 2 180 on its setup, three captains (Aydae
 * 39 ★3, Alexander 19, Leonidas 36), stock EMH 142 · ABT 50 · CHR 20 · LGN 42. The 2026-09-13 file above
 * cannot reproduce his live bar (his march of that day hits for 6 133 203 in the app and 4 986 889 under it);
 * experiments from 93 on read this one.
 */
export const EXPORT_2026_09_17 =
  process.env.PYRRHIC_EXPORT_2026_09_17 ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (2).json';
export const OUT_DIR = new URL('./out/', import.meta.url);

export const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
/**
 * Owner's correction (2026-09-14): the export's authority 200 was a typo — the account's authority is
 * almost always 2,000. At 2,000 the mercenary caps (92 + 76 + 72 + 2 × 37 = 314 authority) bind long
 * before the housing does, so "how many mercenaries to field" is decided by their stock and by the
 * troop stacks' HP, never by authority. Every request the harness hands out carries 2,000.
 */
export const AUTHORITY = 2000;
export const EIGHT = ['swordsman-1', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;

export interface Owner {
  /** Everything the account can field: 8 troop types + 4 mercenaries. */
  twelve: StackRequest;
  /** The march the export's setup actually fields (ARC1, SP1, RD1, ARC2 left out). */
  eight: StackRequest;
  excluded: string[];
}

/** The export as the app reads it. Scenario A bonuses (the file's own). */
export function loadOwner(file: string = EXPORT): Owner {
  if (!existsSync(file)) throw new Error(`export not found: ${file}`);
  const text = readFileSync(file, 'utf8');
  const parsed = parseImport(text);
  if (parsed.kind !== 'profile') throw new Error('not a profile export');
  const setup = parsed.payload.setups[0];
  if (!setup) throw new Error('no setup');
  const base = buildStackRequest(parsed.payload, setup);
  const raw = JSON.parse(text) as {
    payload: { troops?: { excludedUnitIds?: string[] }; setups?: { excludedUnitIds?: string[] }[] };
  };
  const excluded = raw.payload.setups?.[0]?.excludedUnitIds ?? raw.payload.troops?.excludedUnitIds ?? [];
  const twelve: StackRequest = {
    units: base.units,
    caps: base.caps,
    housing: { ...base.housing, authority: AUTHORITY },
    totals: base.totals,
    options: base.options,
    enemy: base.enemy,
    activeEvents: base.activeEvents,
    recovery: base.recovery,
  };
  const set = new Set(excluded);
  return { twelve, eight: { ...twelve, units: twelve.units.filter((unit) => !set.has(unit.id)) }, excluded };
}

/**
 * Scenario B: the bonuses the 2026-09-13 report proved (fixtures/ingame-2026-09-13/README.md §5):
 * guardsmen melee/mounted ×2.4296 health / ×2.87 strength, ranged ×2.4346 / ×2.88, specialist ×1.51 / ×1.71,
 * double damage +3 % on every unit. Mercenaries carry the `guardsmen` tag, so they get the guardsmen
 * bonus too (the report's EMH line, 22 × 2,030 × 2.87 = 128,174 base, confirms it).
 */
export function reportTotals(): BonusTotals {
  const source: ResolvedSource = {
    id: 'ingame-2026-09-13',
    label: 'bonuses as in the 2026-09-13 report',
    kind: 'custom',
    health: { guardsmen: 143, ranged: 0.5, specialist: 51 },
    strength: { guardsmen: 187, ranged: 1, specialist: 71 },
    special: { doubleDamageChance: 3 },
  };
  return aggregateBonuses([source]);
}

/**
 * Scenario C — the bonuses the 2026-09-14 report (`docs/research/battlereportkai.md`, replayed by
 * `02-kai-report.test.ts`) was fought with, derived from that report's own 30 lines: guardsmen +159 %
 * health / +189 % strength with a category bonus of +2 health / +1 strength on top (ranged +2.5 / +2), the
 * category-less EMH6 therefore at ×2.59 / ×2.89, double damage +3 %. One report newer than B, and the
 * account's current fight — theory-craft numbers are computed under C first and B second.
 */
export function kaiReportTotals(): BonusTotals {
  const source: ResolvedSource = {
    id: 'kai-report-2026-09-14',
    label: 'bonuses as in the 2026-09-14 report',
    kind: 'custom',
    health: { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
    strength: { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
    special: { doubleDamageChance: 3 },
  };
  return aggregateBonuses([source]);
}

export function withTotals(request: StackRequest, totals: BonusTotals): StackRequest {
  return { ...request, totals };
}

/** Scenario B request with the temple the account really has (15, ÷1.53). */
export function scenarioB(request: StackRequest): StackRequest {
  return { ...request, totals: reportTotals(), recovery: { ...request.recovery, templeLevel: 15 } };
}

/** Scenario C request with the account's temple (15, ÷1.53). */
export function scenarioC(request: StackRequest): StackRequest {
  return { ...request, totals: kaiReportTotals(), recovery: { ...request.recovery, templeLevel: 15 } };
}

export function withUnits(request: StackRequest, ids: readonly string[]): StackRequest {
  const set = new Set(ids);
  const known = new Map(request.units.map((unit) => [unit.id, unit]));
  const units: UnitDef[] = [];
  for (const id of ids) {
    const unit = known.get(id) ?? unitById(id);
    if (!unit) throw new Error(`unknown unit ${id}`);
    if (set.has(id)) units.push(unit);
  }
  return { ...request, units };
}

export function withCaps(request: StackRequest, caps: Record<string, number>): StackRequest {
  return { ...request, caps: { ...request.caps, ...caps } };
}

export function withHousing(request: StackRequest, housing: Partial<StackRequest['housing']>): StackRequest {
  return { ...request, housing: { ...request.housing, ...housing } };
}

export function withEnemy(request: StackRequest, enemy: Partial<StackRequest['enemy']>): StackRequest {
  return { ...request, enemy: { melee: 0, ranged: 0, mounted: 0, flying: 0, ...enemy } };
}

export function withMethod(request: StackRequest, method: 'elite' | 'ms' | 'msRelaxed'): StackRequest {
  return {
    ...request,
    options: {
      ...request.options,
      method: method === 'elite' ? 'elite' : 'ms',
      relaxedPreservation: method === 'msRelaxed',
    },
  };
}

export interface Evaluation {
  result: StackResult;
  summary: BattleSummary;
}

/** The engine as the app runs it: size, then fight. */
export function evaluate(request: StackRequest): Evaluation {
  const result = sizeStacks(request);
  return { result, summary: simulateBattle(result, request) };
}

/**
 * A march from explicit counts. Same arithmetic as the sizer's `buildStacks` (per-unit HP rounded, hit
 * damage from `hitDamage`, kill order = total HP descending, ties by the Elite-Preservation ranking), so
 * a count vector the sizer would have produced evaluates to the identical summary.
 */
export function stacksFromCounts(request: StackRequest, counts: Record<string, number>): StackResult {
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, index) => [id, index]));
  const stacks: Stack[] = [];
  const used = { leadership: 0, authority: 0, dominance: 0 };
  for (const unit of request.units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0) continue;
    const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
    const { damage, features } = hitDamage(effective, count);
    used[unit.pool] += count * unit.cost;
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
    leadership: { used: used.leadership, capacity: request.housing.leadership },
    authority: { used: used.authority, capacity: request.housing.authority },
    dominance: { used: used.dominance, capacity: request.housing.dominance },
  };
  const warnings: string[] = [];
  for (const pool of ['leadership', 'authority', 'dominance'] as const) {
    if (used[pool] > request.housing[pool])
      warnings.push(`${pool} over capacity: ${used[pool]} > ${request.housing[pool]}`);
  }
  return { stacks, pools, dropped: [], warnings };
}

export function evaluateCounts(request: StackRequest, counts: Record<string, number>): Evaluation {
  const result = stacksFromCounts(request, counts);
  return { result, summary: simulateBattle(result, request) };
}

export function countsOf(result: StackResult): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const stack of result.stacks) counts[stack.unitId] = stack.count;
  return counts;
}

/** Feasible in game: every pool within its housing, every capped type within its cap. */
export function feasible(request: StackRequest, counts: Record<string, number>): boolean {
  const used = { leadership: 0, authority: 0, dominance: 0 };
  for (const unit of request.units) {
    const count = counts[unit.id] ?? 0;
    if (count < 0) return false;
    const cap = request.caps[unit.id];
    if (cap !== undefined && count > cap) return false;
    used[unit.pool] += count * unit.cost;
  }
  return (
    used.leadership <= request.housing.leadership &&
    used.authority <= request.housing.authority &&
    used.dominance <= request.housing.dominance
  );
}

// ---- Reading a fight -------------------------------------------------------------------------------
export interface StackLine {
  position: number;
  unitId: string;
  label: string;
  pool: string;
  count: number;
  totalHp: number;
  damagePerHit: number;
  baseDamage: number;
  hitsEnemyFirst: number;
  hitsArmyFirst: number;
  damageEnemyFirst: number;
  damageArmyFirst: number;
}

export function label(unitId: string): string {
  return unitById(unitId)?.label ?? unitId;
}

export function lines(evaluation: Evaluation): StackLine[] {
  const { result, summary } = evaluation;
  const hits = (journal: BattleSummary['journals']['enemyFirst']): Map<string, number> => {
    const map = new Map<string, number>();
    for (const entry of journal.entries) {
      if (entry.actor === 'army') map.set(entry.unitId, (map.get(entry.unitId) ?? 0) + 1);
    }
    return map;
  };
  const ef = hits(summary.journals.enemyFirst);
  const af = hits(summary.journals.armyFirst);
  return result.stacks.map((stack, index) => ({
    position: index + 1,
    unitId: stack.unitId,
    label: label(stack.unitId),
    pool: stack.pool,
    count: stack.count,
    totalHp: stack.totalHp,
    damagePerHit: stack.damagePerHit,
    baseDamage: Math.round(stack.count * stack.strengthPerUnit),
    hitsEnemyFirst: ef.get(stack.unitId) ?? 0,
    hitsArmyFirst: af.get(stack.unitId) ?? 0,
    damageEnemyFirst: (ef.get(stack.unitId) ?? 0) * stack.damagePerHit,
    damageArmyFirst: (af.get(stack.unitId) ?? 0) * stack.damagePerHit,
  }));
}

export const n = (value: number): string =>
  Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export function table(evaluation: Evaluation): string {
  const rows = lines(evaluation);
  const out = [
    '| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const row of rows) {
    out.push(
      `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${n(row.baseDamage)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(row.damageEnemyFirst)} | ${n(row.damageArmyFirst)} |`,
    );
  }
  const s = evaluation.summary;
  out.push('');
  out.push(
    `min ${n(s.minDamage)} · avg ${n(s.avgDamage)} · max ${n(s.maxDamage)} · hits ${s.journals.enemyFirst.friendlyHits}/${s.journals.armyFirst.friendlyHits} · silver ${n(s.recovery.silver)} · gold ${n(s.recovery.gold)} · time ${duration(s.recovery.seconds)} · pools L ${n(evaluation.result.pools.leadership.used)}/${n(evaluation.result.pools.leadership.capacity)} A ${n(evaluation.result.pools.authority.used)}/${n(evaluation.result.pools.authority.capacity)}`,
  );
  return out.join('\n');
}

export function duration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function byPool(evaluation: Evaluation): Record<'leadership' | 'authority' | 'dominance', number> {
  return evaluation.summary.damageByPool;
}

/** A one-line march description in kill order: `LGN6 47 · SW1 1,794 · …`. */
export function march(result: StackResult): string {
  return result.stacks.map((stack) => `${label(stack.unitId)} ${n(stack.count)}`).join(' · ');
}

// ---- Output ----------------------------------------------------------------------------------------
export class Report {
  private parts: string[] = [];
  private readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  add(text: string): void {
    this.parts.push(text);
    // eslint-disable-next-line no-console -- the experiment's findings are meant to be read on the terminal
    console.log(text);
  }
  h(text: string): void {
    this.add(`\n## ${text}\n`);
  }
  save(): string {
    mkdirSync(OUT_DIR, { recursive: true });
    const file = new URL(`${this.name}.md`, OUT_DIR);
    writeFileSync(file, `${this.parts.join('\n')}\n`);
    return file.pathname;
  }
}

/**
 * S-58 — one campaign planned with either of the two candidate fixes switched on, and the two things the
 * pair of comparison experiments (`80`, `81`) both ask of it: what the frontier **offers**, and which of
 * those offers field **none** of a hired type the account holds a stock of.
 *
 * Written once here rather than twice in the experiments, because the whole point of the pair is that the
 * two fixes are measured by the same arithmetic; a second copy of "what is a hole" would be a second
 * definition of it.
 */
export interface FixedPlan {
  /** How this run is named in a report — "the baseline", "fix A", … */
  label: string;
  plan: CampaignPlan;
  /** The plans the frontier offers, in the order the app draws them. */
  rows: (PlanTotals & { label: string })[];
  /** Of those, the ones that field none of a stocked hired type: the holes the owner is complaining about. */
  holes: (PlanTotals & { label: string })[];
}

/** Is this plan fielding none of a type the account holds? `stocked` is the ids it holds in `request.caps`. */
export function holesIn(
  rows: (PlanTotals & { label: string })[],
  stocked: readonly string[],
): (PlanTotals & { label: string })[] {
  return rows.filter((row) => stocked.some((id) => (row.counts[id] ?? 0) === 0));
}

export function planWithFixes(
  request: StackRequest,
  marchTarget: number,
  flags: { tokenFloor?: boolean; refuseDroppedTypes?: boolean },
  label: string,
): FixedPlan {
  const plan = planCampaign({ request, marchTarget, ...flags });
  const rows = plan.alternatives;
  const stocked = MERC_IDS.filter((id) => (request.caps[id] ?? 0) > 0);
  return { label, plan, rows, holes: holesIn(rows, stocked) };
}

export { getUnits, unitById, simulateBattle, sizeStacks };
