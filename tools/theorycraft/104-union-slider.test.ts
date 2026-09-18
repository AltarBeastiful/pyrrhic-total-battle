/**
 * 104 — **the union slider** (owner, 2026-09-18, reading his own bar against the reference table under it:
 * *"the row at 3 050 700 silver for 8 862 372 damage is 2.91 a silver — better than anything on the slider —
 * why is it not on it? I want the slider to be a union of mercenary spend and silver spend: every proposal
 * weighed for how interesting it is and placed on the bar, left = low silver, right = high damage / high
 * silver / high mercs"*).
 *
 * The bar runs along one axis today — the hired units a march **burns** — and the reference table runs along
 * another: the silver a campaign spends. This measures what the first axis cannot see. `withFrontier` (added
 * for this experiment, a diagnostic the app does not ask for) hands back every plan the search summarised
 * with the two verdicts passed on it, so each row of the table can be traced to the plan behind it and to the
 * rule that passed it over.
 *
 * Sections: A his screen reproduced · B every curve row identified · C the plane, on the live case and on
 * every benchmark scenario · D four placement rules for a union bar, each computed from the plan's own
 * figures · E the assessment.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/104-union-slider.test.ts`
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { unitById } from '../../src/data';
import { planCampaign } from '../../src/engine';
import { aggregateBonuses } from '../../src/engine/bonuses';
import type {
  CampaignInput,
  CampaignPlan,
  PlanFrontierRow,
  PlanRow,
  PlanTotals,
} from '../../src/engine/plan';
import type { ResolvedSource, StackRequest, UnitDef } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { newProfile } from '../../src/state/defaults';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { EXPORT_2026_09_17, Report, evaluateCounts, label, n } from './harness';

// ---- the scenarios ---------------------------------------------------------------------------------------

/** The horizon the app plans (`src/config.ts`), which is also the benchmark's. */
const HORIZON = CAMPAIGN.marches;
const TOTALSTACK_CAPTURE = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-15-optimize.json',
  import.meta.url,
);
const CAPTAINS = {
  aydae: { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
  alexander: { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
  leonidas: { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
} as const;

/** `tests/engine/plan-benchmark.test.ts` `firstRun`, copied so the same scenarios are measured. */
function firstRun(hired: { id: string; cap: number }, leadership: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [hired];
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, { ...setup, housing: { leadership, authority: 40_000, dominance: 0 } });
}

interface Capture {
  request: {
    inputValue: number;
    authorityValue: number;
    mercenaryCaps: Record<string, number>;
    selectedMercenaryIds: string[];
    relaxedPreservation: boolean;
    healthBonuses: Record<string, number>;
    strengthBonuses: Record<string, number>;
    templeLevel: number;
    enemyFormation: Record<string, number>;
  };
  response: { calculation: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> } };
}

/** The benchmark's `fourThousand`, its request only (the external rows are not read here). */
function fourThousand(): StackRequest {
  const capture = JSON.parse(readFileSync(TOTALSTACK_CAPTURE, 'utf8')) as Capture;
  const query = capture.request;
  const troopIds = Object.keys(capture.response.calculation.troopCounts);
  const units = [...troopIds, ...query.selectedMercenaryIds].map((id) => {
    const unit = unitById(id);
    if (!unit) throw new Error(`unknown unit ${id}`);
    return unit as UnitDef;
  });
  const caps = Object.fromEntries(query.selectedMercenaryIds.map((id) => [id, query.mercenaryCaps[id] ?? 0]));
  const source: ResolvedSource = {
    id: 'totalstack-2026-09-15',
    label: 'the capture request',
    kind: 'custom',
    health: { melee: query.healthBonuses['melee'] ?? 0, army: query.healthBonuses['army'] ?? 0 },
    strength: { melee: query.strengthBonuses['melee'] ?? 0, army: query.strengthBonuses['army'] ?? 0 },
  };
  return {
    units,
    caps,
    housing: { leadership: query.inputValue, authority: query.authorityValue, dominance: 0 },
    totals: aggregateBonuses([source]),
    options: {
      method: 'ms',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: query.relaxedPreservation,
    },
    enemy: {
      melee: query.enemyFormation['melee'] ?? 0,
      ranged: query.enemyFormation['ranged'] ?? 0,
      mounted: query.enemyFormation['mounted'] ?? 0,
      flying: query.enemyFormation['flying'] ?? 0,
    },
    activeEvents: [],
    recovery: {
      templeLevel: query.templeLevel,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    },
  };
}

/** The benchmark's `liveProfile`: the export's army with the captains he had enlisted and a hired selection. */
function liveProfile(profile: Profile, hired: { id: string; cap: number | null }[]): Profile {
  const live = structuredClone(profile);
  live.mercenaries.selected = hired;
  live.sources.captains = [CAPTAINS.aydae, CAPTAINS.alexander, CAPTAINS.leonidas];
  return live;
}

interface Case {
  label: string;
  input: CampaignInput;
}

/** A benchmark scenario's plan input, built exactly as `tests/engine/plan-benchmark.test.ts` builds it. */
const benchInput = (request: StackRequest): CampaignInput => ({
  request,
  marchTarget: HORIZON,
  budgetMs: CAMPAIGN.budgets.plan,
  ...CAMPAIGN.planFixes,
  putBack: CAMPAIGN.putBack,
});

/** Which top guardsmen tiers a form of the profile cuts. */
type TopTier = Profile['troops']['topTierExcluded']['guardsmen'];

/**
 * **His bar, reproduced.** The owner described the screen as *"Aydae 43 ★3 alone, 4 975 leadership"*; of the
 * profile forms swept in §A the one that reproduces his stops, his burns and his six curve rows is the
 * 2026-09-17 export with **all three captains enlisted** — Aydae is the captain who marches, the other two
 * are enlisted and their passives are in the totals — and **no top-tier exclusion** (his "Swordsman I kept"),
 * hunters 83 · legionaries unlimited · chariots 10 · arbalesters 60, authority 2 180, 4 975 leadership,
 * through `buildPlanRequest` so the put-back policy is the one the app passes.
 */
interface Enlisted {
  id: string;
  captainId: string;
  level: number;
  star: number;
}

function liveForm(captains: Enlisted[], cut: TopTier | null): CampaignInput {
  const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
  if (parsed.kind !== 'profile') throw new Error('not a profile export');
  const profile = structuredClone(parsed.payload);
  profile.sources.captains = captains.map((captain) => ({ ...captain }));
  // `null` leaves the export's own tier window exactly as it is — which is what "no top-tier exclusion"
  // means on his account, and not an empty window.
  if (cut !== null) profile.troops.topTierExcluded = { guardsmen: cut, specialists: [] };
  profile.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'legionary-6', cap: null },
    { id: 'chariot-6', cap: 10 },
    { id: 'arbalester-6', cap: 60 },
  ];
  const setup0 = profile.setups[0];
  if (!setup0) throw new Error('no setup');
  return buildPlanRequest(profile, {
    ...setup0,
    housing: { ...setup0.housing, leadership: 4_975, authority: 2_180 },
  });
}

const ALONE: Enlisted[] = [CAPTAINS.aydae];
const THREE: Enlisted[] = [CAPTAINS.aydae, CAPTAINS.leonidas, CAPTAINS.alexander];

/** The six forms §A sweeps against his reading, the first of which is the one that reproduces it. */
const FORMS: { label: string; captains: Enlisted[]; cut: TopTier | null }[] = [
  { label: "three captains enlisted, the export's own tier window", captains: THREE, cut: null },
  { label: "Aydae alone, the export's own tier window", captains: ALONE, cut: null },
  {
    label: 'Aydae alone, top melee + ranged cut (experiment 102)',
    captains: ALONE,
    cut: ['melee', 'ranged'],
  },
  { label: 'three captains, top melee + ranged cut', captains: THREE, cut: ['melee', 'ranged'] },
  { label: 'Aydae alone, top melee cut', captains: ALONE, cut: ['melee'] },
  { label: 'three captains, top melee cut', captains: THREE, cut: ['melee'] },
];

function liveCase(reconstruction: boolean): Case {
  return {
    label: reconstruction
      ? 'LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded)'
      : 'HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975',
    input: reconstruction ? liveForm(ALONE, ['melee', 'ranged']) : liveForm(THREE, null),
  };
}

function cases(): Case[] {
  const list: Case[] = [liveCase(false), liveCase(true)];
  for (const [hired, cap, leadership, title] of [
    ['bear-5', 1, 20_000, 'first-run army, Bear V ×1 (20 000)'],
    ['bear-5', 2, 20_000, 'first-run army, Bear V ×2 (20 000)'],
    ['bear-5', 3, 20_000, 'first-run army, Bear V ×3 (20 000)'],
    ['bear-5', 10, 20_000, 'first-run army, Bear V ×10 (20 000)'],
    ['epic-monster-hunter-6', 83, 20_000, 'first-run army, EMH VI ×83 (20 000 — the e2e seed)'],
  ] as const) {
    list.push({ label: title, input: benchInput(firstRun({ id: hired, cap }, leadership)) });
  }
  list.push({ label: 'the 4 000-leadership case of 2026-09-15', input: benchInput(fourThousand()) });
  const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
  if (parsed.kind !== 'profile') return list;
  const profile = parsed.payload;
  const setup = profile.setups[0];
  if (!setup) return list;
  const at = (leadership: number): StackRequest =>
    buildStackRequest(profile, { ...setup, housing: { ...setup.housing, leadership } });
  const live = (hired: { id: string; cap: number | null }[], leadership: number): StackRequest =>
    buildStackRequest(liveProfile(profile, hired), {
      ...setup,
      housing: { leadership, authority: 2_180, dominance: 0 },
    });
  list.push({
    label: '2026-09-17 export, its setup (7 000)',
    input: benchInput(buildStackRequest(profile, setup)),
  });
  list.push({ label: '2026-09-17 export, 12 000', input: benchInput(at(12_000)) });
  list.push({
    label: 'live account of 2026-09-18 (one hired type, 20 000)',
    input: benchInput(live([{ id: 'epic-monster-hunter-6', cap: 83 }], 20_000)),
  });
  list.push({
    label: 'live account, evening (four hired types, 11 000)',
    input: benchInput(
      live(
        [
          { id: 'epic-monster-hunter-6', cap: 83 },
          { id: 'legionary-6', cap: null },
          { id: 'chariot-6', cap: 10 },
          { id: 'arbalester-6', cap: 60 },
        ],
        11_000,
      ),
    ),
  });
  return list;
}

// ---- reading a plan --------------------------------------------------------------------------------------

const f3 = (value: number): string => (Number.isFinite(value) ? value.toFixed(3) : '∞');
const pct = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`;
const hiredIdsOf = (request: StackRequest): string[] =>
  request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
const fieldedHired = (counts: Record<string, number>, ids: string[]): number =>
  ids.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
const troopLine = (counts: Record<string, number>, ids: string[]): string =>
  Object.entries(counts)
    .filter(([id, count]) => count > 0 && !ids.includes(id))
    .map(([id, count]) => `${label(id)} ${n(count)}`)
    .join(' · ') || '—';
const hiredLine = (counts: Record<string, number>, ids: string[]): string =>
  ids
    .filter((id) => (counts[id] ?? 0) > 0)
    .map((id) => `${label(id)} ${n(counts[id] ?? 0)}`)
    .join(' · ') || '—';

/**
 * A march's identity, the same canonical key the diagnostic matches stops by: the non-zero counts, sorted.
 * The frontier books one row per *shape scored*, so one march is summarised many times over; every count and
 * every ranking below is made over the distinct marches, or a plan that the search happened to reach by
 * thirty-two routes would read as thirty-two plans the bar left behind.
 */
const keyOf = (counts: Record<string, number>): string =>
  Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, count]) => `${id}:${count}`)
    .join(',');

/**
 * One row a march: the verdicts first (a row the frontier held, and one the band kept, is the one to keep),
 * then the most damage, then the least silver — the same order the engine's own ladder keeps a level by.
 */
function distinct(rows: PlanFrontierRow[]): PlanFrontierRow[] {
  const held = new Map<string, PlanFrontierRow>();
  const better = (row: PlanFrontierRow, than: PlanFrontierRow): boolean => {
    if (row.undominated !== than.undominated) return row.undominated;
    if (row.onFrontier !== than.onFrontier) return row.onFrontier;
    if (row.totalDamage !== than.totalDamage) return row.totalDamage > than.totalDamage;
    return row.silver < than.silver;
  };
  for (const row of rows) {
    const key = keyOf(row.counts);
    const there = held.get(key);
    if (!there || better(row, there)) held.set(key, row);
  }
  return [...held.values()].sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
}

/** Campaign ratios — the figures the reference table under the bar is written in. */
const perSilver = (row: PlanTotals): number => (row.silver > 0 ? row.totalDamage / row.silver : 0);
const perHired = (row: PlanTotals): number => (row.mercLost > 0 ? row.totalDamage / row.mercLost : Infinity);
/** The bar's own ratio — the repeated march, which is what `bestFor` is read off today. */
const repeatPerSilver = (row: PlanTotals): number =>
  row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;

/** On the bar: the row **is** a stop, or it is the march a put-back re-sized into one. */
const onBar = (row: PlanFrontierRow): boolean => row.stop !== undefined || row.generatorOf !== undefined;
const barName = (row: PlanFrontierRow): string =>
  row.stop ?? (row.generatorOf !== undefined ? `${row.generatorOf} (generator)` : '—');

/**
 * The hired units the march does **not** shelter, by the plan's own **static** test (`all-in` in
 * `src/engine/plan.ts`): every hired stack must stand under the lowest troop stack in total HP, since the
 * enemy wipes the highest-HP living stack first. It is a proxy read off the opening order and not a count of
 * strikes taken — the battle's kill order moves as stacks die — so it says "the enemy can reach this stack
 * before the troops are gone", not "this many units died".
 */
function unsheltered(request: StackRequest, counts: Record<string, number>): number {
  const { result } = evaluateCounts(request, counts);
  const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
  if (troops.length === 0) return result.stacks.reduce((sum, stack) => sum + stack.count, 0);
  const floor = Math.min(...troops.map((stack) => stack.totalHp));
  return result.stacks
    .filter((stack) => stack.pool === 'authority' && stack.totalHp >= floor)
    .reduce((sum, stack) => sum + stack.count, 0);
}

/** The engine's own silver bucket (`bucketOf` in `src/engine/plan.ts`), so a curve can be redrawn. */
const bucketOf = (silver: number): number =>
  Math.min(59, Math.max(0, Math.round(Math.log(silver / 10_000) / Math.log(1.2))));

/** The same curve the plan draws, redrawn over a chosen set of plans: one bucket, the best damage in it. */
function curveOver(rows: PlanTotals[]): PlanTotals[] {
  const held = new Map<number, PlanTotals>();
  for (const row of rows) {
    const key = bucketOf(row.silver);
    const there = held.get(key);
    if (!there || row.totalDamage > there.totalDamage) held.set(key, row);
  }
  return [...held.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}

/** Six points of the curve, as the pane samples them (`sampledCurve` in `PlanPanel.tsx`). */
function sampleSix(curve: CampaignPlan['curve']): CampaignPlan['curve'] {
  if (curve.length <= 6) return curve;
  return Array.from(
    { length: 6 },
    (_unused, index) => curve[Math.round((index * (curve.length - 1)) / 5)] as CampaignPlan['curve'][number],
  );
}

/** The upper-left staircase of (cost, damage): every row that nothing cheaper out-hits. */
function paretoByCost(rows: PlanTotals[], cost: (row: PlanTotals) => number): PlanTotals[] {
  const sorted = [...rows].sort((a, b) => cost(a) - cost(b) || b.totalDamage - a.totalDamage);
  const kept: PlanTotals[] = [];
  let top = -Infinity;
  for (const row of sorted) {
    if (row.totalDamage > top) {
      kept.push(row);
      top = row.totalDamage;
    }
  }
  return kept;
}

/** The upper convex hull of (cost, damage) over a staircase: the rows that are best at *some* exchange rate. */
function upperHull(rows: PlanTotals[], cost: (row: PlanTotals) => number): PlanTotals[] {
  const hull: PlanTotals[] = [];
  for (const row of rows) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2] as PlanTotals;
      const b = hull[hull.length - 1] as PlanTotals;
      const cross =
        (cost(b) - cost(a)) * (row.totalDamage - a.totalDamage) -
        (b.totalDamage - a.totalDamage) * (cost(row) - cost(a));
      if (cross >= 0) hull.pop();
      else break;
    }
    hull.push(row);
  }
  return hull;
}

/**
 * The knees of a staircase, as many as the bar is long: the chord rule the sweet spot already uses
 * (`sweetSpotBase`), applied recursively. **Both ends are kept by construction** — a knee is a distance from
 * a chord and a chord needs two ends — so a bar of one stop is widened to two by the rule's own shape rather
 * than by anything the axis found; §D reports the two apart.
 */
function knees(rows: PlanTotals[], cost: (row: PlanTotals) => number, want: number): PlanTotals[] {
  if (rows.length <= want) return rows;
  const first = rows[0] as PlanTotals;
  const last = rows[rows.length - 1] as PlanTotals;
  const picked = new Set<PlanTotals>([first, last]);
  const spanY = last.totalDamage - first.totalDamage || 1;
  while (picked.size < want) {
    const ordered = [...picked].sort((a, b) => cost(a) - cost(b));
    let best: PlanTotals | undefined;
    let bestDistance = 0;
    for (let index = 1; index < ordered.length; index += 1) {
      const left = ordered[index - 1] as PlanTotals;
      const right = ordered[index] as PlanTotals;
      for (const row of rows) {
        if (picked.has(row) || cost(row) <= cost(left) || cost(row) >= cost(right)) continue;
        const t = (cost(row) - cost(left)) / (cost(right) - cost(left) || 1);
        const expected = left.totalDamage + t * (right.totalDamage - left.totalDamage);
        const distance = (row.totalDamage - expected) / spanY;
        if (distance > bestDistance) {
          bestDistance = distance;
          best = row;
        }
      }
    }
    if (!best) break;
    picked.add(best);
  }
  return [...picked].sort((a, b) => cost(a) - cost(b));
}

/** Rows nothing else beats on **both** campaign ratios. */
function ratioUndominated(rows: PlanTotals[]): PlanTotals[] {
  return rows.filter(
    (row) =>
      !rows.some(
        (other) =>
          other !== row &&
          perSilver(other) >= perSilver(row) &&
          perHired(other) >= perHired(row) &&
          (perSilver(other) > perSilver(row) || perHired(other) > perHired(row)),
      ),
  );
}

/** How often a bar read left-to-right runs backwards: more of the cost, less of the damage. */
function violations(bar: PlanTotals[], of: (row: PlanTotals) => number): number {
  const sorted = [...bar].sort((a, b) => of(a) - of(b));
  let count = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index] as PlanTotals;
    const previous = sorted[index - 1] as PlanTotals;
    if (current.totalDamage < previous.totalDamage) count += 1;
  }
  return count;
}

/**
 * The band's own exchange rate between the two costs, read off its extremes. **Its degenerate case is
 * stated, not patched**: when the thriftiest and the dearest rows of the band burn the same stock the band
 * has one burn level, there is no rate to read at all, and the cost axis is the silver alone.
 */
function axisOf(band: PlanTotals[]): { lambda: number; span: number; single: boolean } {
  const thrift = band.reduce((held, row) =>
    row.mercLost < held.mercLost || (row.mercLost === held.mercLost && row.silver < held.silver) ? row : held,
  );
  const dear = band.reduce((held, row) =>
    row.mercLost > held.mercLost || (row.mercLost === held.mercLost && row.silver > held.silver) ? row : held,
  );
  const span = dear.mercLost - thrift.mercLost;
  return span === 0
    ? { lambda: 0, span: 0, single: true }
    : { lambda: (dear.silver - thrift.silver) / span, span, single: false };
}

interface Measured {
  label: string;
  plan: CampaignPlan;
  request: StackRequest;
  hired: string[];
  ms: number;
  /** Every row the diagnostic returned, one per shape scored — the set §B traces a curve point through. */
  entries: PlanFrontierRow[];
  /** One row a march. */
  rows: PlanFrontierRow[];
  undominated: PlanFrontierRow[];
  band: PlanFrontierRow[];
  offBar: PlanFrontierRow[];
  stops: PlanRow[];
}

function measure(one: Case): Measured {
  const started = performance.now();
  const plan = planCampaign({ ...one.input, withFrontier: true });
  const ms = Math.round(performance.now() - started);
  const entries = plan.frontier ?? [];
  const rows = distinct(entries);
  const undom = rows.filter((row) => row.undominated);
  const kept = undom.filter((row) => row.inBand);
  const band = kept.length > 0 ? kept : undom;
  return {
    label: one.label,
    plan,
    request: one.input.request,
    hired: hiredIdsOf(one.input.request),
    ms,
    entries,
    rows,
    undominated: undom,
    band,
    offBar: band.filter((row) => !onBar(row)),
    stops: plan.alternatives,
  };
}

const HIS_CURVE = [
  [2_143_500, 4_783_199, 2.23, 159_440],
  [3_050_700, 8_862_372, 2.91, 167_215],
  [4_260_300, 11_751_442, 2.76, 183_616],
  [6_201_300, 13_859_425, 2.23, 216_554],
  [7_767_600, 16_966_501, 2.18, 287_568],
  [11_223_900, 14_982_553, 1.33, 234_102],
] as const;

// ---- the report ------------------------------------------------------------------------------------------

describe.skipIf(!process.env.THEORY)('104 — the union slider', () => {
  it('measures what the burn axis cannot see, and five rules that would place it', () => {
    if (!existsSync(EXPORT_2026_09_17)) throw new Error(`export not found: ${EXPORT_2026_09_17}`);
    const report = new Report('104-union-slider');
    const all = cases().map(measure);
    const live = all[0] as Measured;
    const recon = all[1] as Measured;

    /**
     * Which of the band's refusals a row fails — asked only of rows the **engine** refused (`row.inBand` is
     * the verdict; this only names it). Every clause is the engine's own, `inBand` in `src/engine/plan.ts`,
     * including the troop-stack test counting the record's keys as it does.
     */
    const bandFailures = (one: Measured, row: PlanTotals): string => {
      const out: string[] = [];
      const goalHired = fieldedHired(one.plan.counts, one.hired);
      if (fieldedHired(row.counts, one.hired) * 2 < goalHired) out.push('token hired field');
      if (row.damagePerSilver * 2 < one.plan.damagePerSilver) out.push('silver sink');
      if (Object.keys(row.counts).filter((id) => !one.hired.includes(id)).length <= 1)
        out.push('one troop stack');
      if (CAMPAIGN.planFixes.refuseDroppedTypes) {
        const stocked = one.hired.filter(
          (id) => one.request.caps[id] === undefined || (one.request.caps[id] ?? 0) > 0,
        );
        const missing = stocked.filter(
          (id) =>
            (row.counts[id] ?? 0) === 0 &&
            (row.finaleCounts?.[id] ?? 0) === 0 &&
            !(row.sequence ?? []).some((march) => (march[id] ?? 0) > 0),
        );
        if (missing.length > 0) out.push(`drops ${missing.map(label).join(', ')}`);
      }
      return out.length > 0 ? out.join('; ') : 'criterion not identified';
    };
    const bandCell = (one: Measured, row: PlanFrontierRow): string =>
      row.inBand ? 'yes' : `no — ${bandFailures(one, row)}`;

    // ---- A -----------------------------------------------------------------------------------------------
    report.h(`A · his screen reproduced — ${live.label} (${live.ms} ms, horizon ${HORIZON})`);
    report.add(
      'The owner described the screen as "Aydae 43 ★3 alone, 4 975". Six forms of his profile were planned and ' +
        'held against the figures he read off it — the worst gap over his six curve rows and over his sweet ' +
        'spot decides. Only the first reproduces the bar.',
    );
    report.add('');
    report.add(
      '| form | stops (pick · repeat damage / silver / burn) | curve buckets | worst Δ over his six curve damages | Δ his sweet spot |',
    );
    report.add('|---|---|---|---|---|');
    for (const form of FORMS) {
      const started = performance.now();
      const plan = planCampaign(liveForm(form.captains, form.cut));
      const ms = Math.round(performance.now() - started);
      const six = sampleSix(plan.curve);
      const worst = six.reduce((held, point, index) => {
        const his = HIS_CURVE[index];
        if (!his) return held;
        return Math.max(held, Math.abs(point.damage / his[1] - 1));
      }, 0);
      const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
      report.add(
        `| ${form.label} (${ms} ms) | ${plan.alternatives.map((stop) => `${stop.pick} ${n(stop.repeat.damage)} / ${n(stop.repeat.silver)} / ${stop.repeat.mercLost}`).join(' · ')} | ${plan.curve.length} | ${(worst * 100).toFixed(2)} % | ${sweet ? pct((sweet.repeat.damage / 3_970_456 - 1) * 100) : '—'} |`,
      );
    }
    report.add('');
    report.add('The stops of the reproducing form, cheapest burn first.');
    report.add('');
    report.add(
      '| # | pick | shape | repeat damage | repeat silver | repeat seconds | repeat burn | campaign damage | campaign silver | campaign burn | marches | a silver | a hired |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    live.stops.forEach((stop, index) => {
      report.add(
        `| ${index + 1} | ${stop.pick} | ${stop.shape} | ${n(stop.repeat.damage)} | ${n(stop.repeat.silver)} | ${n(stop.repeat.seconds)} | ${stop.repeat.mercLost} | ${n(stop.totalDamage)} | ${n(stop.silver)} | ${stop.mercLost} | ${stop.marches} | ${f3(perSilver(stop))} | ${n(Math.round(perHired(stop)))} |`,
      );
    });
    report.add('');
    report.add('| pick | troops | hired | put-back |');
    report.add('|---|---|---|---|');
    for (const stop of live.stops) {
      report.add(
        `| ${stop.pick} | ${troopLine(stop.counts, live.hired)} | ${hiredLine(stop.counts, live.hired)} | ${stop.putBack ? `${label(stop.putBack.unitId)} (${pct(stop.putBack.damage)} damage, ${pct(stop.putBack.silver)} silver saved, ${pct(stop.putBack.seconds)} queue saved)` : '—'} |`,
      );
    }
    report.add('');
    report.add('What the owner read off the bar (a march), against this run:');
    report.add('');
    report.add(
      '| pick | his damage | measured | Δ | his silver | measured | his burn | measured | his a silver | measured | his a hired | measured |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const [pick, damage, silver, burn, aSilver, aHired] of [
      ['sweet-spot', 3_970_456, 1_941_900, 9, 2.045, 441_162],
      ['more-mercs', 342_561 * 12, 2_078_227, 12, 1.978, 342_561],
      ['steady-max', 308_912 * 14, 1_942_000, 14, 2.227, 308_912],
    ] as const) {
      const stop = live.stops.find((row) => row.pick === pick);
      report.add(
        stop
          ? `| ${pick} | ${n(damage)} | ${n(stop.repeat.damage)} | ${pct((stop.repeat.damage / damage - 1) * 100)} | ${n(silver)} | ${n(stop.repeat.silver)} | ${burn} | ${stop.repeat.mercLost} | ${aSilver} | ${f3(repeatPerSilver(stop))} | ${n(aHired)} | ${n(Math.round(stop.repeat.damage / Math.max(1, stop.repeat.mercLost)))} |`
          : `| ${pick} | ${n(damage)} | **absent** | — | ${n(silver)} | — | ${burn} | — | ${aSilver} | — | ${n(aHired)} | — |`,
      );
    }
    report.add('');
    report.add(
      'His more-mercs and steady-max damage and silver above are recovered from the two ratios he quoted (4.1M · 1.978 · 342 561 and 4.3M · 2.227 · 308 912), which pin them exactly.',
    );
    const allIn = live.stops.find((row) => row.pick === 'all-in');
    report.add('');
    report.add('The six curve rows the UI samples (`sampledCurve`, evenly spaced over `plan.curve`):');
    report.add('');
    const sampled = sampleSix(live.plan.curve);
    report.add(
      '| # | his silver | measured | his damage | measured | Δ damage | his a silver | measured | his a merc | measured | mercs lost |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|');
    sampled.forEach((point, index) => {
      const his = HIS_CURVE[index];
      report.add(
        `| ${index + 1} | ${his ? n(his[0]) : '—'} | ${n(point.silver)} | ${his ? n(his[1]) : '—'} | ${n(point.damage)} | ${his ? pct((point.damage / his[1] - 1) * 100) : '—'} | ${his ? his[2] : '—'} | ${f3(point.damagePerSilver)} | ${his ? n(his[3]) : '—'} | ${n(Math.round(point.damage / Math.max(1, point.mercLost)))} | ${point.mercLost} |`,
      );
    });
    const worstCurve = sampled.reduce((held, point, index) => {
      const his = HIS_CURVE[index];
      return his ? Math.max(held, Math.abs(point.damage / his[1] - 1)) : held;
    }, 0);
    const worstSilver = sampled.reduce((held, point, index) => {
      const his = HIS_CURVE[index];
      return his ? Math.max(held, Math.abs(point.silver / his[0] - 1)) : held;
    }, 0);
    report.add('');
    report.add(
      `Every damage is within ${(worstCurve * 100).toFixed(2)} % of his reading and every silver within ${(worstSilver * 100).toFixed(2)} %; the curve has the same ${live.plan.curve.length} buckets his did, so the UI samples the same six rows. ` +
        (allIn
          ? `The bar also carries an all-in (${n(allIn.totalDamage)} / ${n(allIn.silver)} over ${allIn.marches}, ${allIn.mercLost} hired gone).`
          : `**No all-in stop is offered on this army** (the steady max already fields as much hired as the troops shelter). The figures he read as the all-in — 16 966 501 damage, 7 767 600 silver over 4 marches, 59 of the stock — are the **steady max's own campaign**, measured here at ${n(live.stops[live.stops.length - 1]?.totalDamage ?? 0)} / ${n(live.stops[live.stops.length - 1]?.silver ?? 0)} / ${live.stops[live.stops.length - 1]?.mercLost ?? 0}; the same plan is the curve's ninth bucket, which is why the table's fifth row repeats it.`),
    );
    report.add('');
    report.add(
      `\`leftOut\` is ${live.plan.leftOut} — counted off the frontier's **entries**; over distinct marches the frontier holds ${live.rows.length} plans, ${live.undominated.length} of them undominated and ${live.band.length} inside the band, against ${live.entries.length} entries.`,
    );
    report.add('');
    report.add(
      `Experiment 102's reconstruction (${recon.label}) answers a different bar: ` +
        recon.stops
          .map(
            (stop) =>
              `${stop.pick} ${n(stop.repeat.damage)} / ${n(stop.repeat.silver)} / ${stop.repeat.mercLost} burned`,
          )
          .join(' · ') +
        '.',
    );

    // ---- B -----------------------------------------------------------------------------------------------
    report.h('B · every curve row identified');
    report.add(
      'The curve is bucketed by silver (1.2× a bucket) over **every shape the search scores** (`record`), ' +
        'while the frontier the bar is drawn from keeps only **the strongest shape of each mercenary vector** ' +
        '(`consider`, plus that vector’s tight ladder). `withFrontier` carries both, so each row can be ' +
        'named: `on frontier` says whether the plan behind the row is one the bar could ever have offered.',
    );
    report.add('');
    const peak = live.plan.curve.reduce((best, point) =>
      point.damagePerSilver > best.damagePerSilver ? point : best,
    );
    const behind = (silver: number, damage: number): PlanFrontierRow | undefined =>
      live.entries.find(
        (row) => Math.abs(row.silver - silver) < 1 && Math.abs(row.totalDamage - damage) <= 1,
      );
    report.add(
      '| curve silver | curve damage | a silver | the plan behind it | shape | marches | repeat damage | repeat silver | burn a march | burn campaign | hired fielded | on frontier | undominated | inBand | stop |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const point of [...sampled, peak]) {
      const row = behind(point.silver, point.damage);
      report.add(
        row
          ? `| ${n(point.silver)} | ${n(point.damage)} | ${f3(point.damagePerSilver)} | ${row.label} | ${row.shape} | ${row.marches} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ${row.repeat.mercLost} | ${row.mercLost} | ${fieldedHired(row.counts, live.hired)} | ${row.onFrontier ? 'yes' : '**no**'} | ${row.undominated ? 'yes' : 'no'} | ${bandCell(live, row)} | ${barName(row)} |`
          : `| ${n(point.silver)} | ${n(point.damage)} | ${f3(point.damagePerSilver)} | not recovered | — | — | — | — | — | — | — | — | — | — | — |`,
      );
    }
    report.add('');
    report.add(
      `The curve's peak a silver is ${n(peak.silver)} silver / ${n(peak.damage)} damage / ${f3(peak.damagePerSilver)} a silver; the best a silver **on the bar** is ${f3(Math.max(...live.stops.map(perSilver)))}.`,
    );
    report.add('');
    const target = sampled[1] ?? peak;
    const targetRow = behind(target.silver, target.damage);
    report.add(
      `### The ${n(target.silver)} / ${n(target.damage)} / ${f3(target.damagePerSilver)} row in full`,
    );
    report.add('');
    const sweet = live.stops.find((row) => row.pick === 'sweet-spot');
    if (targetRow) {
      report.add(`- **troops** ${troopLine(targetRow.counts, live.hired)}`);
      report.add(`- **hired** ${hiredLine(targetRow.counts, live.hired)}`);
      report.add(
        `- **the campaign** ${targetRow.marches} marches: ${targetRow.finaleCounts ? `${targetRow.marches - 1} repeats of that march plus a finale (${troopLine(targetRow.finaleCounts, live.hired)} · ${hiredLine(targetRow.finaleCounts, live.hired)})` : targetRow.sequence ? 'a sequence' : 'that march repeated, no finale'}`,
      );
      report.add(
        `- **one march** ${n(targetRow.repeat.damage)} damage · ${n(targetRow.repeat.silver)} silver · ${n(targetRow.repeat.seconds)} s of queue · ${targetRow.repeat.mercLost} hired burned · ${fieldedHired(targetRow.counts, live.hired)} hired fielded`,
      );
      report.add(
        `- **the whole run** ${n(targetRow.totalDamage)} damage · ${n(targetRow.silver)} silver · ${targetRow.mercLost} hired burned · ${f3(perSilver(targetRow))} a silver · ${n(Math.round(perHired(targetRow)))} a hired · shape ${targetRow.shape}`,
      );
      report.add(
        `- **verdicts** on the frontier: ${targetRow.onFrontier ? 'yes' : '**no — the search scored this shape and threw it away**'}; undominated: ${targetRow.undominated ? 'yes' : 'no'}; band: ${bandCell(live, targetRow)}; stop: ${barName(targetRow)}`,
      );
      report.add('');
      if (sweet) {
        report.add('Playing it against playing the sweet spot, both for the same horizon:');
        report.add('');
        report.add(
          '| plan | marches | campaign damage | campaign silver | campaign burn | a silver | a hired |',
        );
        report.add('|---|---|---|---|---|---|---|');
        for (const [name, row] of [
          ['the sweet spot', sweet as PlanTotals],
          [`the ${n(target.silver)} row`, targetRow as PlanTotals],
        ] as const) {
          report.add(
            `| ${name} | ${row.marches} | ${n(row.totalDamage)} | ${n(row.silver)} | ${row.mercLost} | ${f3(perSilver(row))} | ${n(Math.round(perHired(row)))} |`,
          );
        }
        report.add('');
        report.add(
          `Same horizon: the sweet spot hits ${(sweet.totalDamage / targetRow.totalDamage).toFixed(2)}× the row's damage for ${(sweet.silver / targetRow.silver).toFixed(2)}× its silver and ${(sweet.mercLost / targetRow.mercLost).toFixed(2)}× its hired stock.`,
        );
        const underRow = live.band
          .filter((row) => row.silver <= targetRow.silver)
          .reduce<PlanFrontierRow | undefined>(
            (held, row) => (held === undefined || row.totalDamage > held.totalDamage ? row : held),
            undefined,
          );
        report.add('');
        report.add(
          underRow
            ? `The best plan the **band** carries at or under ${n(targetRow.silver)} silver: ${n(underRow.totalDamage)} damage for ${n(underRow.silver)} silver, ${underRow.mercLost} hired, ${f3(perSilver(underRow))} a silver.`
            : `The band carries **no plan at all** at or under ${n(targetRow.silver)} silver: its thriftiest campaign is ${n(Math.min(...live.band.map((row) => row.silver)))}.`,
        );
      }
    } else {
      report.add('The plan behind it was not recovered.');
    }

    // ---- C -----------------------------------------------------------------------------------------------
    report.h('C · the plane');
    report.add(
      'Per scenario: the undominated frontier as **distinct marches** (campaign figures unless the column says `repeat`), then what the bar is missing. A row whose stop column reads `(generator)` is the march a put-back re-sized into that stop — the same stop one pass earlier, and on the bar.',
    );
    for (const one of all) {
      report.add(
        `\n### ${one.label}\n\n${one.ms} ms · ${one.entries.length} frontier entries → **${one.rows.length} distinct marches** · ${one.undominated.length} undominated · ${one.band.length} in the band · ${one.stops.length} stops · ${one.offBar.length} band marches off the bar · ${one.plan.curve.length} curve buckets\n`,
      );
      report.add(
        '| silver | damage | burn | marches | repeat silver | repeat burn | a silver | a hired | shape | inBand | stop |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|---|');
      for (const row of one.undominated) {
        report.add(
          `| ${n(row.silver)} | ${n(row.totalDamage)} | ${row.mercLost} | ${row.marches} | ${n(row.repeat.silver)} | ${row.repeat.mercLost} | ${f3(perSilver(row))} | ${n(Math.round(perHired(row)))} | ${row.shape} | ${bandCell(one, row)} | ${barName(row)} |`,
        );
      }
    }
    report.add('\n### What the slider is missing, per scenario — distinct marches throughout\n');
    report.add(
      '| scenario | entries | distinct | undominated | band | stops | band marches off the bar | best a silver off the bar | best a silver on the bar | gain | that march (silver / damage / burn) | curve peak a silver |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
    const bestOffOf = (one: Measured): PlanFrontierRow | undefined =>
      one.offBar.reduce<PlanFrontierRow | undefined>(
        (held, row) => (held === undefined || perSilver(row) > perSilver(held) ? row : held),
        undefined,
      );
    const bestOnOf = (one: Measured): number => Math.max(...one.stops.map(perSilver));
    for (const one of all) {
      const best = bestOffOf(one);
      const onBarBest = bestOnOf(one);
      const curvePeak = one.plan.curve.reduce(
        (held, point) => (point.damagePerSilver > held.damagePerSilver ? point : held),
        one.plan.curve[0] ?? { silver: 0, damage: 0, damagePerSilver: 0, mercLost: 0 },
      );
      report.add(
        `| ${one.label} | ${one.entries.length} | ${one.rows.length} | ${one.undominated.length} | ${one.band.length} | ${one.stops.length} | ${one.offBar.length} | ${best ? f3(perSilver(best)) : '—'} | ${f3(onBarBest)} | ${best ? pct((perSilver(best) / onBarBest - 1) * 100) : '—'} | ${best ? `${n(best.silver)} / ${n(best.totalDamage)} / ${best.mercLost}` : '—'} | ${f3(curvePeak.damagePerSilver)} |`,
      );
    }
    report.add('\n### The reference table against the plans the bar may offer\n');
    report.add(
      'The `curve` is bucketed over every shape `record` sees. Here: how many of its buckets are backed by a plan the frontier kept, how many by a plan the **band** would keep, and what the table would read if it were drawn over the band instead.',
    );
    report.add('');
    report.add(
      '| scenario | curve buckets | backed by a frontier plan | backed by a band plan | table peak a silver | band-table peak | bar best | band table: cheapest campaign |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      let onFront = 0;
      let inBandCount = 0;
      for (const point of one.plan.curve) {
        const row = one.entries.find(
          (other) =>
            Math.abs(other.silver - point.silver) < 1 && Math.abs(other.totalDamage - point.damage) <= 1,
        );
        if (row?.onFrontier) onFront += 1;
        if (row?.inBand) inBandCount += 1;
      }
      const bandPeak = curveOver(one.band).reduce((held, row) =>
        perSilver(row) > perSilver(held) ? row : held,
      );
      const peakPoint = one.plan.curve.reduce((held, point) =>
        point.damagePerSilver > held.damagePerSilver ? point : held,
      );
      report.add(
        `| ${one.label} | ${one.plan.curve.length} | ${onFront} | ${inBandCount} | ${f3(peakPoint.damagePerSilver)} | ${f3(perSilver(bandPeak))} | ${f3(bestOnOf(one))} | ${n(Math.min(...one.band.map((row) => row.silver)))} |`,
      );
    }

    // ---- D -----------------------------------------------------------------------------------------------
    report.h('D · placement rules for a union bar');
    report.add(
      'Every rule is a computation over the plan’s own figures, made over **distinct marches**. Ratios are the **campaign’s** (the reference table’s), which is the reading the owner is holding the bar against. A march that is a stop, or the generator of one, is on the bar and is never a candidate.',
    );
    const barOf = (rows: PlanTotals[]): PlanTotals[] =>
      [...rows].sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
    report.add('');
    report.add('#### 1 · the peak a silver, offered wherever its burn lands');
    report.add('');
    report.add(
      '| scenario | best a silver in the band | its silver | its damage | its burn (march / campaign) | already on the bar? | burns on the bar | where it lands |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      const best = one.band.reduce((held, row) => (perSilver(row) > perSilver(held) ? row : held));
      const burns = one.stops.map((stop) => stop.repeat.mercLost);
      report.add(
        `| ${one.label} | ${f3(perSilver(best))} | ${n(best.silver)} | ${n(best.totalDamage)} | ${best.repeat.mercLost} / ${best.mercLost} | ${onBar(best) ? barName(best) : 'no'} | ${burns.join(' · ')} | ${burns.includes(best.repeat.mercLost) ? 'on an existing rung' : best.repeat.mercLost > Math.max(...burns) ? 'beyond the steady max' : best.repeat.mercLost < Math.min(...burns) ? 'left of the thrift end' : 'between two stops'} |`,
      );
    }
    report.add('');
    report.add('#### 1b · the rung the ladder threw away (one plan a burn level, the most damage)');
    report.add(
      'The burn ladder keeps **one** march at each level — the most damage there — so a march at a level the bar already carries, cheaper and better a silver, is dropped before any stop is chosen. Counted over distinct marches, with the stops and their generators excluded.',
    );
    report.add('');
    report.add(
      '| scenario | off-bar marches at a burn the bar carries | of those, better a silver than the stop there | best gain | that march (silver / damage / a silver) vs the stop |',
    );
    report.add('|---|---|---|---|---|');
    const ladderGain = new Map<string, number>();
    for (const one of all) {
      const burns = new Set(one.stops.map((stop) => stop.repeat.mercLost));
      const shared = one.offBar.filter((row) => burns.has(row.repeat.mercLost));
      let count = 0;
      let bestGain = 0;
      let line = '—';
      for (const row of shared) {
        const stop = one.stops.find((other) => other.repeat.mercLost === row.repeat.mercLost);
        if (!stop || perSilver(row) <= perSilver(stop)) continue;
        count += 1;
        const gain = perSilver(row) / perSilver(stop) - 1;
        if (gain > bestGain) {
          bestGain = gain;
          line = `${n(row.silver)} / ${n(row.totalDamage)} / ${f3(perSilver(row))} vs ${stop.pick} ${n(stop.silver)} / ${n(stop.totalDamage)} / ${f3(perSilver(stop))}`;
        }
      }
      ladderGain.set(one.label, bestGain);
      report.add(
        `| ${one.label} | ${shared.length} | ${count} | ${bestGain > 0 ? pct(bestGain * 100) : '—'} | ${line} |`,
      );
    }
    report.add('');
    report.add('#### 2 · one cost axis, the knees on it');
    report.add(
      'The axis is the band’s own exchange rate: `λ = Δsilver / Δburn` between the thriftiest and the dearest march of the band (campaign figures), and `cost = silver + λ · burn`. **Its degenerate case is stated rather than patched**: when those two marches burn the same stock the band has one burn level, there is no rate to read, and the cost axis is the silver alone. The staircase is the marches nothing cheaper out-hits; the hull is those best at *some* rate; the bar is the chord rule the sweet spot already uses, run until it is as long as the bar is today — and that rule keeps **both hull ends by construction**, so the split below says how many of its rows the axis actually found.',
    );
    report.add('');
    report.add(
      '| scenario | λ (silver a hired) | λ rests on (burn units) | staircase | hull | bar | of which not stops today: hull ends forced | knees found | damage span | silver-monotone breaks | burn-monotone breaks |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|');
    const ruleTwo = new Map<string, { bar: PlanTotals[]; ends: number; kneesFound: number }>();
    for (const one of all) {
      const axis = axisOf(one.band);
      const cost = (row: PlanTotals): number => row.silver + axis.lambda * row.mercLost;
      const stair = paretoByCost(one.band, cost);
      const hull = upperHull(stair, cost);
      const bar = knees(hull, cost, Math.max(one.stops.length, 2));
      const endKeys = new Set(
        [hull[0], hull[hull.length - 1]].filter(Boolean).map((row) => keyOf((row as PlanTotals).counts)),
      );
      const stopKeys = new Set(one.stops.map((stop) => keyOf(stop.counts)));
      const added = bar.filter((row) => !stopKeys.has(keyOf(row.counts)));
      const ends = added.filter((row) => endKeys.has(keyOf(row.counts))).length;
      ruleTwo.set(one.label, { bar, ends, kneesFound: added.length - ends });
      report.add(
        `| ${one.label} | ${axis.single ? '— (one burn level: silver alone)' : n(Math.round(axis.lambda))} | ${axis.span} | ${stair.length} | ${hull.length} | ${bar.length} | ${ends} | ${added.length - ends} | ${n(bar[0]?.totalDamage ?? 0)} → ${n(bar[bar.length - 1]?.totalDamage ?? 0)} | ${violations(bar, (row) => row.silver)} | ${violations(bar, (row) => row.mercLost)} |`,
      );
    }
    report.add('');
    report.add(`The bar rule 2 draws on ${live.label}:`);
    report.add('');
    report.add('| # | silver | damage | burn | marches | a silver | a hired | shape | on the bar today? |');
    report.add('|---|---|---|---|---|---|---|---|---|');
    barOf(ruleTwo.get(live.label)?.bar ?? []).forEach((row, index) => {
      report.add(
        `| ${index + 1} | ${n(row.silver)} | ${n(row.totalDamage)} | ${row.mercLost} | ${row.marches} | ${f3(perSilver(row))} | ${n(Math.round(perHired(row)))} | ${row.shape} | ${barName(row as PlanFrontierRow)} |`,
      );
    });
    report.add('');
    report.add('#### 3 · undominated on both ratios');
    report.add('');
    report.add(
      '| scenario | band | undominated on both ratios | ≤ 6 rows? | of those, on the bar today | silver-monotone breaks | burn-monotone breaks |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const ruleThree = new Map<string, PlanTotals[]>();
    for (const one of all) {
      const kept = ratioUndominated(one.band);
      ruleThree.set(one.label, kept);
      const already = kept.filter((row) => onBar(row as PlanFrontierRow)).length;
      report.add(
        `| ${one.label} | ${one.band.length} | ${kept.length} | ${kept.length <= 6 ? 'yes' : '**no**'} | ${already} | ${violations(kept, (row) => row.silver)} | ${violations(kept, (row) => row.mercLost)} |`,
      );
    }
    report.add('');
    report.add('#### 4 · the union: today’s stops + the peak a silver + the cost-axis knees');
    report.add('');
    report.add(
      '| scenario | today | union | added | of which: the peak | hull ends forced | knees found | best a silver on the union | on the bar today | gain | cheapest campaign (today → union) | silver-monotone breaks | burn-monotone breaks |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    const ruleFour = new Map<string, { union: PlanTotals[]; added: number; reach: number }>();
    for (const one of all) {
      const stopKeys = new Set(one.stops.map((stop) => keyOf(stop.counts)));
      const union: PlanTotals[] = [...one.stops];
      const seen = new Set(stopKeys);
      const best = one.band.reduce((held, row) => (perSilver(row) > perSilver(held) ? row : held));
      let peakAdded = 0;
      if (!seen.has(keyOf(best.counts))) {
        union.push(best);
        seen.add(keyOf(best.counts));
        peakAdded = 1;
      }
      const two = ruleTwo.get(one.label);
      for (const row of two?.bar ?? []) {
        if (seen.has(keyOf(row.counts))) continue;
        union.push(row);
        seen.add(keyOf(row.counts));
      }
      const cheapestToday = Math.min(...one.stops.map((row) => row.silver));
      const cheapestUnion = Math.min(...union.map((row) => row.silver));
      ruleFour.set(one.label, {
        union,
        added: union.length - one.stops.length,
        reach: cheapestUnion / cheapestToday - 1,
      });
      const onUnion = union.reduce((held, row) => (perSilver(row) > perSilver(held) ? row : held));
      const onBarBest = bestOnOf(one);
      report.add(
        `| ${one.label} | ${one.stops.length} | ${union.length} | ${union.length - one.stops.length} | ${peakAdded} | ${two?.ends ?? 0} | ${two?.kneesFound ?? 0} | ${f3(perSilver(onUnion))} | ${f3(onBarBest)} | ${pct((perSilver(onUnion) / onBarBest - 1) * 100)} | ${n(cheapestToday)} → ${n(cheapestUnion)} | ${violations(one.stops, (row) => row.silver)} → ${violations(union, (row) => row.silver)} | ${violations(one.stops, (row) => row.mercLost)} → ${violations(union, (row) => row.mercLost)} |`,
      );
    }
    report.add('');
    report.add(`The union bar on ${live.label}:`);
    report.add('');
    report.add('| # | silver | damage | burn | marches | a silver | a hired | shape | today |');
    report.add('|---|---|---|---|---|---|---|---|---|');
    barOf(ruleFour.get(live.label)?.union ?? []).forEach((row, index) => {
      const asStop = live.stops.find((stop) => keyOf(stop.counts) === keyOf(row.counts));
      report.add(
        `| ${index + 1} | ${n(row.silver)} | ${n(row.totalDamage)} | ${row.mercLost} | ${row.marches} | ${f3(perSilver(row))} | ${n(Math.round(perHired(row)))} | ${row.shape} | ${asStop?.pick ?? '**new**'} |`,
      );
    });
    report.add('');
    report.add('#### 5 · the marginal reading');
    report.add(
      'A cheaper stop is offered only when **the step up to the next stop is a worse deal than the cheaper stop itself**. Stated exactly, over distinct band marches that are neither a stop nor a stop’s generator, in campaign figures:',
    );
    report.add('');
    report.add(
      '1. `C` is **refused outright** when some stop `T` has `silver_T ≤ silver_C`, `damage_T ≥ damage_C` and `burn_T ≤ burn_C` — the bar already dominates it;\n' +
        '2. otherwise `S` is the **nearest stop with `silver_S > silver_C` and `burn_S ≥ burn_C`** (nearest in silver; a tie goes to the lower burn). With no such stop `C` is not a candidate;\n' +
        '3. `C` is offered when `(damage_S − damage_C) / (silver_S − silver_C) < damage_C / silver_C` — the climb to `S` buys damage at less than `C`’s own average rate;\n' +
        '4. among the candidates passing against one `S`, the best damage a silver wins (tie: more damage), and it is placed immediately left of `S`.',
    );
    report.add('');
    interface Marginal {
      row: PlanFrontierRow;
      stop: PlanRow;
      marginal: number;
    }
    const ruleFive = new Map<string, { bar: PlanTotals[]; added: Marginal[]; ms: number }>();
    for (const one of all) {
      const started = performance.now();
      const ordered = [...one.stops].sort((a, b) => a.silver - b.silver || a.mercLost - b.mercLost);
      const bestFor = new Map<PlanRow, Marginal>();
      for (const row of one.offBar) {
        if (row.silver <= 0) continue;
        // 1 — dominated by the bar itself.
        if (
          one.stops.some(
            (stop) =>
              stop.silver <= row.silver &&
              stop.totalDamage >= row.totalDamage &&
              stop.mercLost <= row.mercLost,
          )
        ) {
          continue;
        }
        // 2 — the stop the saving is measured against.
        const next = ordered.find((stop) => stop.silver > row.silver && stop.mercLost >= row.mercLost);
        if (!next) continue;
        // 3 — the step up is a worse deal than the march itself.
        const marginal = (next.totalDamage - row.totalDamage) / (next.silver - row.silver);
        if (marginal >= perSilver(row)) continue;
        // 4 — one offer per stop.
        const held = bestFor.get(next);
        if (
          !held ||
          perSilver(row) > perSilver(held.row) ||
          (perSilver(row) === perSilver(held.row) && row.totalDamage > held.row.totalDamage)
        ) {
          bestFor.set(next, { row, stop: next, marginal });
        }
      }
      const bar: PlanTotals[] = [];
      const added: Marginal[] = [];
      for (const stop of ordered) {
        const add = bestFor.get(stop);
        if (add && !bar.some((other) => keyOf(other.counts) === keyOf(add.row.counts))) {
          bar.push(add.row);
          added.push(add);
        }
        bar.push(stop);
      }
      // "Immediately left of `S`" is the insertion rule; two stops can share a silver, so the bar is read in
      // silver order like every other bar here (the monotonicity counts sort for themselves either way).
      bar.sort((a, b) => a.silver - b.silver || a.totalDamage - b.totalDamage);
      ruleFive.set(one.label, { bar, added, ms: performance.now() - started });
    }
    report.add(
      '| scenario | rows added | the added march (silver / damage / burn) | against | marginal rate | its own a silver | silver saved | damage | queue saved | silver-monotone breaks | burn-monotone breaks | rule 5 ms |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      const five = ruleFive.get(one.label);
      if (!five) continue;
      const join = (parts: string[]): string => parts.join('<br>') || '—';
      report.add(
        `| ${one.label} | ${five.added.length} | ${join(five.added.map((add) => `${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost}`))} | ${join(five.added.map((add) => add.stop.pick))} | ${join(five.added.map((add) => f3(add.marginal)))} | ${join(five.added.map((add) => f3(perSilver(add.row))))} | ${join(five.added.map((add) => pct(((add.stop.silver - add.row.silver) / add.stop.silver) * 100)))} | ${join(five.added.map((add) => pct((add.row.totalDamage / add.stop.totalDamage - 1) * 100)))} | ${join(five.added.map((add) => pct(((add.stop.seconds - add.row.seconds) / Math.max(1, add.stop.seconds)) * 100)))} | ${violations(one.stops, (row) => row.silver)} → ${violations(five.bar, (row) => row.silver)} | ${violations(one.stops, (row) => row.mercLost)} → ${violations(five.bar, (row) => row.mercLost)} | ${five.ms.toFixed(2)} |`,
      );
    }
    report.add('');
    report.add('What each added march actually fields:');
    report.add('');
    report.add('| scenario | silver / damage / burn | shape | marches | troops | hired |');
    report.add('|---|---|---|---|---|---|');
    for (const one of all) {
      for (const add of ruleFive.get(one.label)?.added ?? []) {
        report.add(
          `| ${one.label} | ${n(add.row.silver)} / ${n(add.row.totalDamage)} / ${add.row.mercLost} | ${add.row.shape} | ${add.row.marches} | ${troopLine(add.row.counts, one.hired)} | ${hiredLine(add.row.counts, one.hired)} |`,
        );
      }
    }
    report.add('');
    report.add('The bars rule 5 draws, in order (a row marked **new** is one it added):');
    report.add('');
    report.add('| scenario | # | silver | damage | burn | a silver | a hired | row |');
    report.add('|---|---|---|---|---|---|---|---|');
    for (const one of all) {
      const five = ruleFive.get(one.label);
      if (!five) continue;
      five.bar.forEach((row, index) => {
        const asStop = one.stops.find((stop) => keyOf(stop.counts) === keyOf(row.counts));
        report.add(
          `| ${index === 0 ? one.label : ''} | ${index + 1} | ${n(row.silver)} | ${n(row.totalDamage)} | ${row.mercLost} | ${f3(perSilver(row))} | ${n(Math.round(perHired(row)))} | ${asStop?.pick ?? '**new**'} |`,
        );
      });
    }
    report.add('');
    let fiveNotTwo = 0;
    let twoNotFive = 0;
    for (const one of all) {
      const stopKeys = new Set(one.stops.map((stop) => keyOf(stop.counts)));
      const five = new Set((ruleFive.get(one.label)?.added ?? []).map((add) => keyOf(add.row.counts)));
      const two = new Set(
        (ruleTwo.get(one.label)?.bar ?? [])
          .map((row) => keyOf(row.counts))
          .filter((key) => !stopKeys.has(key)),
      );
      for (const key of five) if (!two.has(key)) fiveNotTwo += 1;
      for (const key of two) if (!five.has(key)) twoNotFive += 1;
    }
    report.add(
      `Rule 5 adds **${fiveNotTwo}** marches over the ${all.length} scenarios that rule 2's λ axis does not put on its bar.`,
    );
    report.add(
      `Rule 2 puts **${twoNotFive}** marches on its bar, over the ${all.length} scenarios, that are neither today's stops nor marches rule 5 adds.`,
    );
    report.add('');
    report.add('#### the hired units the stops leave exposed');
    report.add(
      'Measured by the plan’s own **static** shelter test (`all-in` in `src/engine/plan.ts`): a hired stack is exposed when its total HP is at least the lowest troop stack’s, since the enemy wipes the highest-HP living stack first. It is read off the opening order, **not** a count of strikes taken — the kill order moves as stacks die — so it says the enemy can reach that stack before the troops are gone, not that those units died.',
    );
    report.add('');
    report.add('| scenario | stop | hired fielded | exposed by the static test | troops |');
    report.add('|---|---|---|---|---|');
    const exposure = new Map<string, number>();
    for (const one of all) {
      for (const stop of one.stops) {
        if (stop.pick !== 'more-mercs' && stop.pick !== 'sweet-spot' && stop.pick !== 'steady-max') continue;
        const bare = unsheltered(one.request, stop.counts);
        exposure.set(`${one.label}|${stop.pick}`, bare);
        report.add(
          `| ${one.label} | ${stop.pick} | ${fieldedHired(stop.counts, one.hired)} | ${bare} | ${troopLine(stop.counts, one.hired)} |`,
        );
      }
    }

    // ---- E -----------------------------------------------------------------------------------------------
    report.h('E · assessment');
    const liveBest = bestOffOf(live);
    const liveOnBar = bestOnOf(live);
    const liveBandPeak = curveOver(live.band).reduce((held, row) =>
      perSilver(row) > perSilver(held) ? row : held,
    );
    const liveBacked = live.plan.curve.filter((point) => {
      const row = live.entries.find(
        (other) =>
          Math.abs(other.silver - point.silver) < 1 && Math.abs(other.totalDamage - point.damage) <= 1,
      );
      return row?.onFrontier === true;
    }).length;
    const backwards = all.filter((one) => violations(one.stops, (row) => row.silver) > 0).length;
    const barHoldsPeak = all.filter((one) => {
      const best = bestOffOf(one);
      return best === undefined || perSilver(best) <= bestOnOf(one);
    }).length;
    const unionGain = (one: Measured): number => {
      const four = ruleFour.get(one.label);
      if (!four) return 0;
      const onUnion = four.union.reduce((held, row) => (perSilver(row) > perSilver(held) ? row : held));
      return perSilver(onUnion) / bestOnOf(one) - 1;
    };
    const unionGains = all.filter((one) => unionGain(one) > 0.0001);
    const unionBurnBreaks = all.filter((one) => {
      const four = ruleFour.get(one.label);
      return four
        ? violations(four.union, (row) => row.mercLost) > violations(one.stops, (row) => row.mercLost)
        : false;
    }).length;
    const unionSilverBreaks = all.filter((one) => {
      const four = ruleFour.get(one.label);
      return four
        ? violations(four.union, (row) => row.silver) > violations(one.stops, (row) => row.silver)
        : false;
    }).length;
    let bestLadderGain: [string, number] = ['', 0];
    for (const entry of ladderGain.entries()) {
      if (entry[1] > bestLadderGain[1]) bestLadderGain = [entry[0], entry[1]];
    }
    const ladderCases = [...ladderGain.values()].filter((gain) => gain > 0).length;
    let widestReach: [string, number] = ['', 0];
    for (const [key, value] of ruleFour.entries()) {
      if (value.reach < widestReach[1]) widestReach = [key, value.reach];
    }
    const ratioSizes = all.map((one) => ruleThree.get(one.label)?.length ?? 0);
    const ratioReadable = ratioSizes.filter((size) => size <= 6).length;
    const ratioSilverBreaks = all.filter(
      (one) => violations(ruleThree.get(one.label) ?? [], (row) => row.silver) > 0,
    ).length;
    const ratioBurnBreaks = all.filter(
      (one) => violations(ruleThree.get(one.label) ?? [], (row) => row.mercLost) > 0,
    ).length;
    const ratioOnBar = all.reduce(
      (sum, one) =>
        sum + (ruleThree.get(one.label) ?? []).filter((row) => onBar(row as PlanFrontierRow)).length,
      0,
    );
    const ratioTotal = ratioSizes.reduce((sum, size) => sum + size, 0);
    const liveUnion = ruleFour.get(live.label);
    const cheapestToday = Math.min(...live.stops.map((row) => row.silver));
    const cheapestUnion = Math.min(...(liveUnion?.union ?? live.stops).map((row) => row.silver));
    const mostDistinct = all.reduce((held, one) => (one.band.length > held.band.length ? one : held));
    const steady = live.stops.find((row) => row.pick === 'steady-max');
    const moreMercs = live.stops.find((row) => row.pick === 'more-mercs');
    const exposedStops = [...exposure.entries()].filter((entry) => entry[1] > 0);

    report.add(
      `**Why the ${f3(target.damagePerSilver)} row is not on the bar — two reasons, either of which is enough.**`,
    );
    report.add('');
    report.add(
      `1. *The bar never saw it.* The reference table is bucketed over **every shape the search prices** (\`record\`, once per depth × scale inside \`evaluateVector\`), while the frontier the band, the burn ladder and all five stops are read off keeps only **the strongest shape of each mercenary vector**, plus that vector's tight ladder (\`consider\`). On his own screen ${liveBacked} of ${live.plan.curve.length} table rows is backed by a plan the frontier kept. The ${n(target.silver)} / ${n(target.damage)} plan was priced, booked into the table and dropped in the same breath.`,
    );
    report.add('');
    report.add(
      targetRow && sweet
        ? `2. *It is the extreme the band exists to refuse* — the engine's own verdict on it is **${bandCell(live, targetRow)}**. It is **one troop stack** — ${troopLine(targetRow.counts, live.hired)} — carrying ${fieldedHired(targetRow.counts, live.hired)} hired units. Hired units add damage and are paid for in gold, not silver, so damage a silver is maximised by buying as few troops as the mercenaries can stand behind; the limit of that is a single token stack, which is the owner's own *"the least silver plan would never be chosen … is not a strategy"*. Played for the same horizon it is ${n(targetRow.totalDamage)} damage for ${n(targetRow.silver)} silver against the sweet spot's ${n(sweet.totalDamage)} for ${n(sweet.silver)}: ${((targetRow.totalDamage / sweet.totalDamage) * 100).toFixed(0)} % of the damage for ${((targetRow.silver / sweet.silver) * 100).toFixed(0)} % of the silver. A player who picked it would not be getting a better plan, he would be getting a smaller one.`
        : '2. (the plan behind the row was not recovered)',
    );
    report.add('');
    report.add(
      `So **it is not a defect of the burn axis**. It is the reference table quoting a set the bar is forbidden to draw from: redraw the table over the band and its peak a silver falls from ${f3(peak.damagePerSilver)} to ${f3(perSilver(liveBandPeak))} — which is what the bar already carries (${f3(liveOnBar)}).`,
    );
    report.add('');
    report.add('**What the burn axis does cost**, measured over distinct marches:');
    report.add('');
    report.add(
      `- the ladder keeps **one march a burn level** (the most damage there), so a cheaper, more efficient march at a level the bar already carries is dropped before any stop is chosen. It happens on ${ladderCases} of the ${all.length} scenarios, the widest being ${pct(bestLadderGain[1] * 100)} a silver on "${bestLadderGain[0]}" — always at less damage, so it is a trade and not a free win;`,
    );
    report.add(
      `- the bar **runs backwards in silver** on ${backwards} of the ${all.length} scenarios, his own included, because burn and silver are different orders: ${[
        ...live.stops,
      ]
        .sort((a, b) => a.silver - b.silver)
        .map((stop) => `${stop.pick} ${n(stop.silver)} / ${n(stop.totalDamage)}`)
        .join(' · ')} — one step right is more silver and less damage;`,
    );
    report.add(
      `- the bar has **no thrift end in silver**: his stops cost ${n(cheapestToday)}–${n(Math.max(...live.stops.map((row) => row.silver)))}, while the band carries campaigns down to ${n(Math.min(...live.band.map((row) => row.silver)))};`,
    );
    report.add(
      `- and the band's own efficiency peak is **already on the bar** on ${barHoldsPeak} of the ${all.length} scenarios, so no re-placement over the frontier can buy much efficiency${liveBest ? ` (here the best off-bar march is ${f3(perSilver(liveBest))} against ${f3(liveOnBar)} on it)` : ''}.`,
    );
    report.add('');
    report.add('**Recommendation — two computations, in this order.**');
    report.add('');
    report.add(
      `**(a) Draw the reference table from the plans the bar may offer.** \`curve\` over \`candidates\` (the band) instead of over every recorded shape — the same set every stop is chosen from. Measured on his screen: the table's peak a silver ${f3(peak.damagePerSilver)} → ${f3(perSilver(liveBandPeak))}, and its cheapest row moves from ${n(live.plan.curve[0]?.silver ?? 0)} to ${n(Math.min(...live.band.map((row) => row.silver)))} silver, which is the true news — this army has nothing to sell under ${n(Math.min(...live.band.map((row) => row.silver)))}. Without it, every rule below still leaves a table on screen promising what the bar cannot deliver.`,
    );
    report.add('');
    report.add(
      `**(b) Offer a cheaper stop by the marginal reading (rule 5), not by a second axis.** It is the one rule here that is stated entirely in the plan's own figures, adds at most ${Math.max(...all.map((one) => ruleFive.get(one.label)?.added.length ?? 0))} rows per scenario and never invents a row to fill a chord: a march is offered only when the climb from it to the stop on its right buys damage at less than the march's own rate. Rule 2's λ axis is the alternative, and its own table says why not — the chord rule keeps both hull ends by construction, so ${[...ruleTwo.values()].reduce((sum, two) => sum + two.ends, 0)} of the ${[...ruleTwo.values()].reduce((sum, two) => sum + two.ends + two.kneesFound, 0)} rows it would add over the ${all.length} scenarios are forced ends rather than knees the axis found, and its λ has no meaning at all on the ${all.filter((one) => axisOf(one.band).single).length} scenarios whose band holds a single burn level.`,
    );
    report.add('');
    report.add(
      `Measured gains for the union of today's stops with rule 2 (rule 4 above): **range** — the cheapest campaign on the bar falls ${n(cheapestToday)} → ${n(cheapestUnion)} here (${pct((cheapestUnion / cheapestToday - 1) * 100)}), and the widest is "${widestReach[0]}" at ${pct(widestReach[1] * 100)} — but on the small-stock armies that reach **is the forced hull end**, not something the axis found. **Efficiency**: better than the bar on ${unionGains.length} of the ${all.length} scenarios${unionGains.length > 0 ? ` (${unionGains.map((one) => `${one.label} ${pct(unionGain(one) * 100)}`).join(', ')})` : ''}, and unchanged on the rest.`,
    );
    report.add('');
    report.add(
      `Costs: ${live.stops.length} → ${liveUnion?.union.length ?? live.stops.length} rows here; burn-monotonicity gets worse on ${unionBurnBreaks} of the ${all.length} scenarios and silver-monotonicity on ${unionSilverBreaks}. Rule 5 costs less on both counts (see its own table). Run time is unchanged either way — every rule is arithmetic over the **distinct** marches the plan already holds (${live.band.length} in this band, ${mostDistinct.band.length} at most, against ${live.entries.length} and ${mostDistinct.entries.length} frontier entries) and took ${[...ruleFive.values()].reduce((held, five) => Math.max(held, five.ms), 0).toFixed(2)} ms at worst, where the plan itself took ${live.ms} ms.`,
    );
    report.add('');
    report.add(
      `**Rule 3** (every band march undominated on both ratios) is **readable** once it is counted on distinct marches: ${Math.min(...ratioSizes)}–${Math.max(...ratioSizes)} rows, ${ratioUndominated(live.band).length} of them here, and ≤ 6 on ${ratioReadable} of the ${all.length} scenarios. Its cost is **order, not length**: it runs backwards in silver on ${ratioSilverBreaks} of the ${all.length} scenarios and in burn on ${ratioBurnBreaks}, and only ${ratioOnBar} of the ${ratioTotal} rows it would draw are stops today — so it replaces the bar rather than extending it, and the owner's five names would have to be re-derived over it. It is the rule to reach for only if the bar is being rebuilt from scratch.`,
    );
    report.add('');
    report.add(
      `**The "more mercs" concern, on the record.** By the plan's static shelter test — the opening HP order, not a count of strikes — "more mercs" leaves **0** hired units exposed on every scenario that offers it${moreMercs ? ` (${fieldedHired(moreMercs.counts, live.hired)} fielded here, all of them under the lowest troop stack)` : ''}. The stops the same test finds exposed are ${exposedStops.length > 0 ? exposedStops.map(([key, count]) => `**${key.split('|')[1]}** on "${key.split('|')[0]}" (${count} units)`).join(', ') : 'none'}${steady ? `; here that is the steady max, ${unsheltered(live.request, steady.counts)} of the ${fieldedHired(steady.counts, live.hired)} it fields` : ''}. Keeping "more mercs" costs him nothing this test can see.`,
    );
    report.add('');
    report.add(
      `Run times: ${all.map((one) => `${one.label} ${one.ms} ms`).join(' · ')}. The diagnostic costs the app nothing: \`withFrontier\` is absent from \`buildPlanRequest\`, and the engine only keeps the extra rows when it is asked for them.`,
    );
    report.save();
  }, 900_000);
});
