/**
 * **The march horizon** (`docs/plans/the-march-horizon.md`; the owner, 2026-10-14: *"a full benchmark generating
 * all marches, not just offered but computed … its ratings and criterias, and a mark on which one we selected"*).
 *
 * The bar offers four or five marches out of a set the plan computes and never shows. This library lists that
 * set for one army, one row a march, with the ten readings, the army's bar criteria, the owner's rating against
 * the sweet spot (and the cheapest stop), and the marks that say what the bar did with it:
 *
 *  - `horizonOf(label, request)` — ONE `planCampaign` over the request the standing benchmark prices
 *    (`tests/engine/plan-measure.ts`, no `budgetMs`) plus the two diagnostic flags, rows deduped by `keyOf`;
 *  - `renderHorizon` — the giant per-army table (gitignored); `renderSummary` — the committed one-pager;
 *  - `saveHorizon` / `loadHorizon` — the machine-readable file a later plan reads.
 *
 * **Row set**: every frontier row the engine calls undominated, plus the offered stops (a put-back re-size or the
 * all-in is off the frontier, so the band never carries it). A merc-free army has no `frontier` (the troops-only
 * return sets `trade` alone), so the set falls back to `trade` and the census says so.
 *
 * Every figure is the row's `repeat` — what the app's trade table prints, no extra battle. The one battle spent
 * is `reportArmy`'s, on the stops only: their shelter margin, and the army's bar criteria and readings. Campaign
 * totals are the search's own, **before the troops-only tail** (the stop's own tailed totals sit on `stops`).
 */
/// <reference types="node" />
import { CAMPAIGN } from '../../src/config';
import type { PlanFrontierRow, PlanPick, PlanRepeat, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON } from '../../tests/engine/plan-scenarios';
import type { ArmyReport, Criterion, Figures } from './plan-report';
import {
  billOfFigures,
  CRITERIA,
  fmt,
  keyOf,
  loadJson,
  RATES,
  READINGS,
  reportArmy,
  saveJson,
  short,
} from './plan-report';

/** A march's figures without the best opening: that needs a second journal, and no reading divides by it. */
export type RowFigures = Omit<Figures, 'best'>;

/** What the engine's verdicts say about a row, and what the bar did with it. */
export interface Marks {
  undominated: boolean;
  inBand: boolean;
  onFrontier: boolean;
  /** The stop the bar offers this march as. */
  stop?: PlanPick | undefined;
  /** The stop this march is the put-back generator of: it is on the bar, one pass earlier. */
  generatorOf?: PlanPick | undefined;
  /** `undominated && inBand && stop === undefined`: a row the bar could have offered and did not. */
  fifthCandidate: boolean;
}

/**
 * A row against a reference march: the owner's `rate` and the raw deltas. Every `d…` is the percent **change** of
 * the row over the reference (positive: the row has more of it), so a damage delta above zero is better and a
 * cost delta below zero is better. `rate` is pairwise: its hired term reads a 1 → 3 chunk change as −200 % and
 * its queue term divides by 40, so on large deltas it is degenerate; the raw deltas are the primary reading.
 */
export interface Rating {
  rate: number;
  dDamage: number;
  dSilver: number;
  dGold: number;
  dCoins: number;
  dQueue: number;
  dHired: number;
}

export interface CampaignTotals {
  totalDamage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
  seconds: number;
  mercLost: number;
  marches: number;
}

export interface HorizonRow extends RowFigures {
  key: string;
  /** Non-zero counts only. */
  counts: Record<string, number>;
  shape: string;
  label: string;
  campaign: CampaignTotals;
  marks: Marks;
  /** Against the army's sweet spot (`plan.recommend`): *is there a better trade than the one the bar opens on?* */
  rating: Rating;
  /** Against the army's cheapest stop: *what does spending more buy?* */
  vsCheapest: Rating;
  /** `s58b`: fields every hired type the account holds a stock of. `shelter`: the offered stops only (needs a battle). */
  criteria: Partial<Record<Criterion, boolean>>;
  /** The lowest troop stack's HP over the highest hired stack's, for the offered stops only. */
  shelterMargin?: number | undefined;
}

export interface Census {
  /** Distinct marches the search summarised / that are undominated / that the band kept (`trade`). */
  summarised: number;
  undominated: number;
  band: number;
  /** Rows listed, and of them the fifth candidates. */
  listed: number;
  fifthCandidates: number;
  /** The same three before the `keyOf` dedupe. */
  raw: { summarised: number; undominated: number; band: number };
  /** The army has no `frontier` (the troops-only path): the set is `trade`, and the three counts are one. */
  troopsOnly: boolean;
}

export interface ArmyHorizon {
  label: string;
  refused?: string;
  rows: HorizonRow[];
  census: Census;
  /** The bar's offered stops, with the campaign the bar prices them at (the troops-only tail included). */
  stops: { pick: PlanPick; key: string; campaign: CampaignTotals }[];
  /** The army's bar criteria and ten readings, as `reportArmy` reads them. */
  criteria: ArmyReport['criteria'];
  readings: ArmyReport['readings'];
  meta: { planMs: number; marchTarget: number; budgetBound: boolean };
}

// ---- the pure parts -------------------------------------------------------------------------------------

/** The slice of a plan row the horizon reads, so a fixture need not be a whole `PlanTotals`. */
export type Priced = Pick<
  PlanTotals,
  | 'counts'
  | 'shape'
  | 'repeat'
  | 'totalDamage'
  | 'silver'
  | 'gold'
  | 'dragonCoins'
  | 'seconds'
  | 'mercLost'
  | 'marches'
>;

/**
 * The readings of a march off its `repeat`, as `ratios` in `plan-report.ts` does them (that function is not
 * exported, and the report library is not edited from here).
 */
export function figuresOf(repeat: PlanRepeat): RowFigures {
  const worst = repeat.damage;
  const coins = repeat.dragonCoins ?? 0;
  return {
    worst,
    silver: repeat.silver,
    gold: repeat.gold,
    hired: repeat.mercLost,
    coins,
    seconds: repeat.seconds,
    hiredDamage: repeat.hiredDamage,
    perSilver: repeat.silver > 0 ? worst / repeat.silver : Infinity,
    perGold: repeat.gold > 0 ? worst / repeat.gold : Infinity,
    perHired: repeat.mercLost > 0 ? repeat.hiredDamage / repeat.mercLost : Infinity,
    perCoin: coins > 0 ? worst / coins : Infinity,
  };
}

/** Percent change of `after` over `before`; nought on a reference of nothing (`rating.ts`' `saved` reads it so). */
const change = (before: number, after: number): number =>
  before > 0 ? ((after - before) / before) * 100 : 0;

/** `after` against `before`: the owner's rate, and the five raw deltas beside it. */
export function ratingOf(before: RowFigures, after: RowFigures): Rating {
  return {
    rate: rate(billOfFigures({ ...before, best: 0 }), billOfFigures({ ...after, best: 0 }), RATES),
    dDamage: change(before.worst, after.worst),
    dSilver: change(before.silver, after.silver),
    dGold: change(before.gold, after.gold),
    dCoins: change(before.coins, after.coins),
    dQueue: change(before.seconds, after.seconds),
    dHired: change(before.hired, after.hired),
  };
}

export const marksOf = (m: Omit<Marks, 'fifthCandidate'>): Marks => ({
  ...m,
  fifthCandidate: m.undominated && m.inBand && m.stop === undefined,
});

const nonZero = (counts: Record<string, number>): Record<string, number> =>
  Object.fromEntries(Object.entries(counts).filter(([, c]) => c > 0));

/** One horizon row off a plan row, rated against the sweet spot and the cheapest stop. */
export function rowOf(
  priced: Priced,
  label: string,
  marks: Omit<Marks, 'fifthCandidate'>,
  against: { sweet: RowFigures; cheapest: RowFigures },
  criteria: HorizonRow['criteria'] = {},
  shelterMargin?: number,
): HorizonRow {
  const figures = figuresOf(priced.repeat);
  return {
    key: keyOf(priced.counts),
    counts: nonZero(priced.counts),
    shape: priced.shape,
    label,
    ...figures,
    campaign: campaignOf(priced),
    marks: marksOf(marks),
    rating: ratingOf(against.sweet, figures),
    vsCheapest: ratingOf(against.cheapest, figures),
    criteria,
    ...(shelterMargin !== undefined ? { shelterMargin } : {}),
  };
}

function campaignOf(priced: Priced): CampaignTotals {
  return {
    totalDamage: priced.totalDamage,
    silver: priced.silver,
    gold: priced.gold,
    dragonCoins: priced.dragonCoins,
    seconds: priced.seconds,
    mercLost: priced.mercLost,
    marches: priced.marches,
  };
}

/**
 * One row a `keyOf`, in first-seen order. The band repeats one march many times over under different labels
 * (1,795 rows are 37 marches on the owner's army of 2026-10-13); the verdicts of the copies are or-ed, and the
 * first `stop` / `generatorOf` / shelter margin found wins, so a march is marked if any copy of it is.
 */
export function dedupeRows(rows: HorizonRow[]): HorizonRow[] {
  const byKey = new Map<string, HorizonRow>();
  for (const row of rows) {
    const held = byKey.get(row.key);
    if (!held) {
      byKey.set(row.key, row);
      continue;
    }
    const stop = held.marks.stop ?? row.marks.stop;
    const generatorOf = held.marks.generatorOf ?? row.marks.generatorOf;
    const shelterMargin = held.shelterMargin ?? row.shelterMargin;
    byKey.set(row.key, {
      ...held,
      marks: marksOf({
        undominated: held.marks.undominated || row.marks.undominated,
        inBand: held.marks.inBand || row.marks.inBand,
        onFrontier: held.marks.onFrontier || row.marks.onFrontier,
        ...(stop !== undefined ? { stop } : {}),
        ...(generatorOf !== undefined ? { generatorOf } : {}),
      }),
      criteria: { ...row.criteria, ...held.criteria },
      campaign: held.marks.stop === undefined && row.marks.stop !== undefined ? row.campaign : held.campaign,
      ...(shelterMargin !== undefined ? { shelterMargin } : {}),
    });
  }
  return [...byKey.values()];
}

// ---- one army -------------------------------------------------------------------------------------------

const EMPTY_CENSUS: Census = {
  summarised: 0,
  undominated: 0,
  band: 0,
  listed: 0,
  fifthCandidates: 0,
  raw: { summarised: 0, undominated: 0, band: 0 },
  troopsOnly: false,
};

/** A `frontier` row carries the engine's verdicts; a `trade` row is a bare plan. */
const isFrontierRow = (row: PlanTotals): row is PlanFrontierRow => 'onFrontier' in row;

const distinct = (rows: { counts: Record<string, number> }[]): number =>
  new Set(rows.map((r) => keyOf(r.counts))).size;

/** The horizon of one army: ONE `planCampaign`, the row set of the module note, rated and marked. */
export function horizonOf(label: string, request: StackRequest): ArmyHorizon {
  const startedAt = performance.now();
  const refused = (why: string): ArmyHorizon => ({
    label,
    refused: why,
    rows: [],
    census: EMPTY_CENSUS,
    stops: [],
    criteria: reportArmy(label, request, why).criteria,
    readings: [],
    meta: { planMs: performance.now() - startedAt, marchTarget: HORIZON, budgetBound: false },
  });
  let plan;
  try {
    // The standing benchmark's own request (`runPlanOnce`, tests/engine/plan-measure.ts), no `budgetMs`, plus
    // the two diagnostic flags the app never sets.
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withTrade: true,
      withFrontier: true,
    });
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
  const planMs = performance.now() - startedAt;
  const offered = plan.alternatives;
  const sweet = plan.recommend ?? offered.find((r) => r.pick === 'sweet-spot') ?? offered[0];
  const cheapest = offered[0];
  if (!sweet || !cheapest) return refused('the plan offers no stop');
  const against = { sweet: figuresOf(sweet.repeat), cheapest: figuresOf(cheapest.repeat) };

  const report = reportArmy(label, request, plan);
  const shelterOf = new Map(report.stops.map((s) => [s.pick, s.shelterMargin]));
  const stopByKey = new Map<string, PlanPick>(offered.map((r) => [keyOf(r.counts), r.pick]));
  const stocked = request.units.filter((u) => u.pool === 'authority' && (request.caps[u.id] ?? 0) > 0);
  const fieldsAll = (row: PlanTotals): boolean => {
    const played = [row.counts, ...(row.finaleCounts ? [row.finaleCounts] : []), ...(row.sequence ?? [])];
    return stocked.every((u) => played.some((counts) => (counts[u.id] ?? 0) > 0));
  };

  const troopsOnly = plan.frontier === undefined;
  const summarised = plan.frontier ?? plan.trade ?? [];
  const candidates: { row: PlanTotals; label: string; marks: Omit<Marks, 'fifthCandidate'> }[] = [];
  for (const row of summarised) {
    const held = isFrontierRow(row) ? row : undefined;
    const stop = held?.stop ?? stopByKey.get(keyOf(row.counts));
    if (held && !held.undominated && stop === undefined) continue;
    candidates.push({
      row,
      label: held?.label ?? row.shape,
      marks: {
        undominated: held?.undominated ?? true,
        inBand: held?.inBand ?? true,
        onFrontier: held?.onFrontier ?? true,
        ...(stop !== undefined ? { stop } : {}),
        ...(held?.generatorOf !== undefined ? { generatorOf: held.generatorOf } : {}),
      },
    });
  }
  // A stop the summary does not carry at all (the troops-only path): the bar's own row stands for it.
  for (const stop of offered)
    if (!candidates.some((c) => keyOf(c.row.counts) === keyOf(stop.counts)))
      candidates.push({
        row: stop,
        label: stop.label,
        marks: { undominated: false, inBand: true, onFrontier: false, stop: stop.pick },
      });

  const rows = dedupeRows(
    candidates.map(({ row, label: rowLabel, marks }) => {
      const criteria: HorizonRow['criteria'] = { s58b: fieldsAll(row) };
      const margin = marks.stop !== undefined ? shelterOf.get(marks.stop) : undefined;
      if (margin !== undefined) criteria.shelter = margin > 1;
      const built = rowOf(row, rowLabel, marks, against, criteria, margin);
      // A stop is priced by the bar with its tail and finale; the summarised row of the same march is not.
      const stopRow = marks.stop !== undefined ? offered.find((o) => o.pick === marks.stop) : undefined;
      return stopRow ? { ...built, campaign: campaignOf(stopRow) } : built;
    }),
  ).sort((a, b) => a.silver - b.silver || a.worst - b.worst);

  const raw = {
    summarised: summarised.length,
    undominated: troopsOnly ? summarised.length : (plan.frontier ?? []).filter((r) => r.undominated).length,
    band: plan.trade?.length ?? 0,
  };
  const census: Census = {
    summarised: distinct(summarised),
    undominated: troopsOnly
      ? distinct(summarised)
      : distinct((plan.frontier ?? []).filter((r) => r.undominated)),
    band: distinct(plan.trade ?? []),
    listed: rows.length,
    fifthCandidates: rows.filter((r) => r.marks.fifthCandidate).length,
    raw,
    troopsOnly,
  };
  return {
    label,
    rows,
    census,
    stops: offered.map((r) => ({ pick: r.pick, key: keyOf(r.counts), campaign: campaignOf(r) })),
    criteria: report.criteria,
    readings: report.readings,
    meta: { planMs, marchTarget: HORIZON, budgetBound: plan.budgetBound === true },
  };
}

// ---- the file -------------------------------------------------------------------------------------------

/** The generic replacer / reviver of `plan-report.ts` does not care what the armies are. */
export function saveHorizon(
  file: string | URL,
  armies: ArmyHorizon[],
  meta: Record<string, unknown> = {},
): void {
  saveJson(file, armies as unknown as ArmyReport[], meta);
}

export function loadHorizon(file: string | URL): { armies: ArmyHorizon[] } & Record<string, unknown> {
  return loadJson(file) as unknown as { armies: ArmyHorizon[] } & Record<string, unknown>;
}

// ---- the markdown ---------------------------------------------------------------------------------------

const duration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '—';
  const hours = Math.round(seconds / 3600);
  return hours >= 24 ? `${String(Math.floor(hours / 24))} d ${String(hours % 24)} h` : `${String(hours)} h`;
};
const pct = (v: number): string => `${v > 0 ? '+' : ''}${fmt(v, 1)}`;
const countsText = (counts: Record<string, number>): string =>
  Object.entries(counts)
    .map(([id, c]) => `${id} ${fmt(c)}`)
    .join(', ');

/** `SW` for a stop, `gen SW` for a generator, `5th` for a fifth candidate, then `U` / `B` / `F` for the verdicts. */
const marksText = (m: Marks): string =>
  [
    m.stop !== undefined ? `**${short(m.stop)}**` : '',
    m.generatorOf !== undefined ? `gen ${short(m.generatorOf)}` : '',
    m.fifthCandidate ? '5th' : '',
    m.undominated ? 'U' : '',
    m.inBand ? 'B' : '',
    m.onFrontier ? 'F' : '',
  ]
    .filter((x) => x !== '')
    .join(' ');

const ratingCells = (r: Rating): string =>
  `${pct(r.dDamage)} | ${pct(r.dSilver)} | ${pct(r.dGold)} | ${pct(r.dCoins)} | ${pct(r.dQueue)} | ${pct(r.dHired)} | ${fmt(r.rate, 1)}`;
const RATING_HEAD = 'Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | Δhired % | rate';

const header = (title: string, meta: Record<string, unknown>): string[] => [
  `# ${title}`,
  '',
  Object.entries(meta)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' · '),
  '',
];

const censusText = (c: Census): string =>
  `${String(c.summarised)} summarised ⊇ ${String(c.undominated)} undominated ⊇ ${String(c.band)} in the band (distinct marches; ` +
  `raw ${String(c.raw.summarised)} / ${String(c.raw.undominated)} / ${String(c.raw.band)}); ${String(c.listed)} listed, ` +
  `${String(c.fifthCandidates)} fifth candidates${c.troopsOnly ? '; **troops-only: no frontier, the set is `trade`**' : ''}.`;

const criteriaText = (army: ArmyHorizon): string =>
  `**Bar criteria**: ${CRITERIA.map((c) => `${c} ${army.criteria[c].holds ? '✓' : `✗ (${army.criteria[c].detail})`}`).join(' · ')}.`;

/** The giant per-army table: one row per march, the ten readings, the ratings, the marks. Gitignored. */
export function renderHorizon(armies: ArmyHorizon[], meta: Record<string, unknown> = {}): string {
  const out = header('The march horizon — every march the plan computes', meta);
  out.push(
    'Marks: **bold** = the stop the bar offers · `gen` = the put-back generator of that stop · `5th` = undominated ∧ in band ∧ not a stop · ' +
      'U undominated · B in band · F on the frontier. Rows are one per distinct march (`keyOf`), cheapest silver first. ' +
      'The deltas are percent change over the reference (damage up is better, a cost down is better); ' +
      '`rate` is the owner’s *pairwise* rating and is degenerate on large deltas (hired 1 → 3 reads as −200 %, queue is over 40): read the deltas first.',
    '',
  );
  for (const army of armies) {
    out.push(`## ${army.label}`, '');
    if (army.refused !== undefined) {
      out.push(`Refused: ${army.refused}`, '');
      continue;
    }
    out.push(censusText(army.census), '', criteriaText(army), '');
    out.push(
      `| marks | shape | ${READINGS.map((r) => r.head).join(' | ')} | shelter | s58b | vs sweet: ${RATING_HEAD} | vs cheapest: ${RATING_HEAD} | counts |`,
      `|---|---|${'---:|'.repeat(READINGS.length)}---:|---|${'---:|'.repeat(14)}---|`,
    );
    for (const row of army.rows) {
      const figs = READINGS.map((r) =>
        r.head === 'shortest queue'
          ? duration(row.seconds)
          : fmt(r.of({ ...row, best: 0 }), r.head.startsWith('dmg a') ? 2 : 0),
      );
      out.push(
        `| ${marksText(row.marks)} | ${row.shape} | ${figs.join(' | ')} | ${row.shelterMargin === undefined ? '' : fmt(row.shelterMargin, 2)} | ${row.criteria.s58b === false ? '✗' : '✓'} | ` +
          `${ratingCells(row.rating)} | ${ratingCells(row.vsCheapest)} | ${countsText(row.counts)} |`,
      );
    }
    out.push('');
  }
  return out.join('\n');
}

/** How many fifth candidates a one-pager lists: the rest are in the JSON. */
const SUMMARY_ROWS = 12;

/** The committed one-pager per army: census, the offered stops, the fifth candidates by damage over the sweet spot. */
export function renderSummary(armies: ArmyHorizon[], meta: Record<string, unknown> = {}): string {
  const out = header('The march horizon — summary', meta);
  out.push(
    'One section per army: what the plan computed, the stops the bar offers, and the rows it could have offered and did not ' +
      '(`5th`: undominated ∧ in band ∧ not a stop; a `gen` row is the put-back generator of a stop, so discount it). ' +
      'Every row of every army is in `232-the-march-horizon.json`.',
    '',
  );
  for (const army of armies) {
    out.push(`## ${army.label}`, '');
    if (army.refused !== undefined) {
      out.push(`Refused: ${army.refused}`, '');
      continue;
    }
    out.push(censusText(army.census), '', criteriaText(army), '');
    const line = (row: HorizonRow): string =>
      `| ${marksText(row.marks)} | ${fmt(row.worst)} | ${fmt(row.silver)} | ${fmt(row.hired)} | ${fmt(row.gold)} | ${fmt(row.coins)} | ` +
      `${duration(row.seconds)} | ${row.shelterMargin === undefined ? '' : fmt(row.shelterMargin, 2)} | ${ratingCells(row.rating)} |`;
    const head = `| marks | worst | silver | hired | gold | coins | queue | shelter | vs sweet: ${RATING_HEAD} |\n|---|${'---:|'.repeat(14)}`;
    const stopRows = army.stops
      .map((s) => army.rows.find((r) => r.key === s.key))
      .filter((r): r is HorizonRow => r !== undefined);
    out.push('**Offered stops**', '', head, ...stopRows.map(line), '');
    const fifth = army.rows
      .filter((r) => r.marks.fifthCandidate)
      .sort((a, b) => b.rating.dDamage - a.rating.dDamage);
    if (fifth.length > 0)
      out.push(
        `**Fifth candidates** (top ${String(Math.min(SUMMARY_ROWS, fifth.length))} of ${String(fifth.length)} by damage over the sweet spot)`,
        '',
        head,
        ...fifth.slice(0, SUMMARY_ROWS).map(line),
        '',
      );
  }
  return out.join('\n');
}
