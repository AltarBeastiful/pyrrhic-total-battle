/**
 * **The report every W14 step owes** (`docs/plans/every-death-order.md` §2; the owner, 2026-09-24: *"make sure the
 * plan doesn't forget to report on all march use cases what it moves on all criterias and redo the bench with
 * TotalStack after"*).
 *
 * One collector, written by experiment 176 for HEAD's baseline (`out/176-baseline.json`) and imported by every later
 * step (177+) for its before/after comparison:
 *
 *  - `reportArmy(scenario, plan)` — every stop, every march each stop plays (the repeated march, the finale, the
 *    troops-only tail, each march of the all-in's sequence), every criterion of §2 per march and per stop, the ten
 *    readings and the bar criteria per army, and TotalStack at matched spend with 162's rows;
 *  - `compareReports(before, after)` — stops paired by pick, `rate(before, after, markerRates)` per stop, better /
 *    equal / worse per army and in total, every worse figure listed with its value, readings and criteria that moved;
 *  - `renderBaseline` / `renderComparison` — the markdown; `saveJson` / `loadJson` — the machine-readable file.
 *
 * Every figure is priced by the test tree's own arithmetic (`campaignOf` / `price` in `tests/engine/plan-campaign.ts`,
 * the benchmark's), plus the best opening off `marchResult`'s recap, so a step's report and the benchmark read the
 * same numbers.
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { lastsMarches, marchResult } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, hiredIds, price } from '../../tests/engine/plan-campaign';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';

export const RATES = CAMPAIGN.markerRates;

export const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
export const short = (pick: string): string => SHORT[pick] ?? pick;

/** A march's identity: its non-zero counts, sorted. */
export const keyOf = (counts: Record<string, number>): string =>
  JSON.stringify(
    Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );

/** The per-march criteria of §2. */
export interface Figures {
  /** Worst-opening damage (the enemy strikes first: the bar's figure, S-94). */
  worst: number;
  /** Best-opening damage (the army strikes first). */
  best: number;
  silver: number;
  gold: number;
  /** Hired chunks burned for good (the authority pool, S-102). */
  hired: number;
  coins: number;
  /** Training-queue seconds. */
  seconds: number;
  /** What the hired stacks themselves dealt, in the worst opening (S-105): the numerator of `perHired`. */
  hiredDamage: number;
  perSilver: number;
  perGold: number;
  perHired: number;
  perCoin: number;
}

export interface MarchReport extends Figures {
  /** `repeat`, `finale`, `tail`, or `sequence N`. */
  role: string;
  times: number;
  key: string;
  counts: Record<string, number>;
  /** The lowest troop stack's HP over the highest hired stack's (Infinity: no hired stack; 0: no troop stack). */
  shelterMargin: number;
}

export interface StopReport {
  pick: string;
  marches: MarchReport[];
  campaign: Figures;
  /** The lowest shelter margin over the stop's marches. */
  shelterMargin: number;
  /**
   * How many marches the hired stocks last: for a repeated stop, `lastsMarches` of every capped hired type its
   * repeat fields (Infinity when none is capped); for a sequence, the marches it plays when every capped type's
   * chunks fit its stock, else the first march that overdraws, minus one.
   */
  sustain: number;
  /** How many times the repeat is played (a sequence: its length). */
  repeats: number;
  /** A test-only note on what put the stop where it is (the fold's substitutions), when the caller knows it. */
  note?: string;
}

export const READINGS = [
  { head: 'most damage', of: (c: Figures) => c.worst, high: true },
  { head: 'least silver', of: (c: Figures) => c.silver, high: false },
  { head: 'fewest hired lost', of: (c: Figures) => c.hired, high: false },
  { head: 'least gold', of: (c: Figures) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Figures) => c.coins, high: false },
  { head: 'shortest queue', of: (c: Figures) => c.seconds, high: false },
  { head: 'dmg a silver', of: (c: Figures) => (c.silver > 0 ? c.worst / c.silver : 0), high: true },
  { head: 'dmg a merc', of: (c: Figures) => c.hiredDamage / Math.max(1, c.hired), high: true },
  { head: 'dmg a gold', of: (c: Figures) => (c.gold > 0 ? c.worst / c.gold : 0), high: true },
  { head: 'dmg a coin', of: (c: Figures) => (c.coins > 0 ? c.worst / c.coins : 0), high: true },
] as const;

export const CRITERIA = ['order', 'noStopBeaten', 'shelter', 'sustain', 'atMostFive', 'sweetSpot', 's58b'] as const;
export type Criterion = (typeof CRITERIA)[number];

export interface ArmyReport {
  label: string;
  refused?: string;
  stops: StopReport[];
  readings: { head: string; value: number; high: boolean }[];
  criteria: Record<Criterion, { holds: boolean; detail: string }>;
  totalstack: { rows: number; dominated: number; unfitted: number; kept162: number };
  /** Which stops were re-chosen (the fold's band substitutions, S-94 / all-in drops), when the caller traced it. */
  rechosen?: string[];
  planMs?: number;
}

const billOf = (f: Figures): Bill => ({
  damage: f.worst,
  silver: f.silver,
  gold: f.gold,
  hired: f.hired,
  dragonCoins: f.coins,
  seconds: f.seconds,
});
export const billOfFigures = billOf;

const ratios = (f: Omit<Figures, 'perSilver' | 'perGold' | 'perHired' | 'perCoin'>): Figures => ({
  ...f,
  perSilver: f.silver > 0 ? f.worst / f.silver : Infinity,
  perGold: f.gold > 0 ? f.worst / f.gold : Infinity,
  perHired: f.hired > 0 ? f.hiredDamage / f.hired : Infinity,
  perCoin: f.coins > 0 ? f.worst / f.coins : Infinity,
});

/** The marches a stop plays, with their role and how often — the reading of `marchesOf`, grouped. */
export function playedOf(row: PlanTotals): { role: string; counts: Record<string, number>; times: number }[] {
  if (row.sequence) return row.sequence.map((counts, i) => ({ role: `sequence ${String(i + 1)}`, counts, times: 1 }));
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const out = [{ role: 'repeat', counts: row.counts, times: repeats }];
  if (row.finaleCounts) out.push({ role: 'finale', counts: row.finaleCounts, times: 1 });
  if (row.tail && tail > 0) out.push({ role: 'tail', counts: row.tail.counts, times: tail });
  return out.filter((m) => m.times > 0);
}

function marchFigures(request: StackRequest, counts: Record<string, number>): Figures & { shelterMargin: number } {
  const p = price(request, counts);
  const { result, summary } = marchResult(request, counts);
  const mercIds = hiredIds(request);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  const hired = result.stacks.filter((s) => s.pool !== 'leadership');
  const floor = troops.length > 0 ? Math.min(...troops.map((s) => s.totalHp)) : 0;
  const top = hired.length > 0 ? Math.max(...hired.map((s) => s.totalHp)) : 0;
  return {
    ...ratios({
      worst: p.damage,
      best: summary.maxDamage,
      silver: p.silver,
      gold: p.gold,
      hired: mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0),
      coins: p.dragonCoins,
      seconds: p.seconds,
      hiredDamage: p.hiredDamage,
    }),
    shelterMargin: hired.length === 0 ? Infinity : top > 0 ? floor / top : Infinity,
  };
}

function sustainOf(request: StackRequest, row: PlanTotals): number {
  const capped = request.units.filter(
    (u) => u.pool !== 'leadership' && request.caps[u.id] !== undefined,
  );
  if (row.sequence) {
    const used: Record<string, number> = {};
    for (let i = 0; i < row.sequence.length; i += 1) {
      const march = row.sequence[i] as Record<string, number>;
      for (const u of capped) {
        const count = march[u.id] ?? 0;
        if (count <= 0) continue;
        // A march fields `count` out of what is left and loses `chunks(count)` for good (`lastsMarches`).
        if ((used[u.id] ?? 0) + count > (request.caps[u.id] ?? Infinity)) return i;
        used[u.id] = (used[u.id] ?? 0) + chunks(count);
      }
    }
    return row.sequence.length;
  }
  let lasts = Infinity;
  for (const u of capped) {
    const count = row.counts[u.id] ?? 0;
    if (count > 0) lasts = Math.min(lasts, lastsMarches(request.caps[u.id] ?? 0, count));
  }
  return lasts;
}

/** Totals of a stop's marches, priced march by march (`campaignOf`'s arithmetic), with the best opening beside. */
function campaignFigures(request: StackRequest, marches: MarchReport[]): Figures {
  const flat: Record<string, number>[] = [];
  let best = 0;
  for (const m of marches)
    for (let i = 0; i < m.times; i += 1) {
      flat.push(m.counts);
      best += m.best;
    }
  const c: Campaign = campaignOf(request, 'stop', 'plan', flat);
  return ratios({
    worst: c.damage,
    best,
    silver: c.silver,
    gold: c.gold,
    hired: c.burned,
    coins: c.dragonCoins,
    seconds: c.seconds,
    hiredDamage: c.hiredDamage,
  });
}

const readingOf = (stops: StopReport[], r: (typeof READINGS)[number]): number => {
  const values = stops.map((s) => r.of(s.campaign));
  return r.high ? Math.max(...values) : Math.min(...values);
};

export function reportArmy(
  label: string,
  request: StackRequest,
  plan: CampaignPlan | string,
  externals: { name: string; counts: Record<string, number> }[] = [],
  extra: { rechosen?: string[]; planMs?: number; notes?: Map<string, string> } = {},
): ArmyReport {
  const empty = { holds: true, detail: '' };
  if (typeof plan === 'string')
    return {
      label,
      refused: plan,
      stops: [],
      readings: [],
      criteria: Object.fromEntries(CRITERIA.map((c) => [c, empty])) as ArmyReport['criteria'],
      totalstack: { rows: 0, dominated: 0, unfitted: 0, kept162: 0 },
    };
  const cache = new Map<string, Figures & { shelterMargin: number }>();
  const figuresOf = (counts: Record<string, number>) => {
    const key = keyOf(counts);
    let f = cache.get(key);
    if (!f) {
      f = marchFigures(request, counts);
      cache.set(key, f);
    }
    return f;
  };
  const rows = plan.alternatives;
  const stops: StopReport[] = rows.map((row) => {
    const marches: MarchReport[] = playedOf(row as PlanTotals).map((m) => ({
      role: m.role,
      times: m.times,
      key: keyOf(m.counts),
      counts: Object.fromEntries(Object.entries(m.counts).filter(([, c]) => c > 0)),
      ...figuresOf(m.counts),
    }));
    const note = extra.notes?.get(row.pick);
    return {
      pick: row.pick,
      marches,
      campaign: campaignFigures(request, marches),
      shelterMargin: Math.min(...marches.map((m) => m.shelterMargin)),
      sustain: sustainOf(request, row as PlanTotals),
      repeats: row.sequence ? row.sequence.length : (marches.find((m) => m.role === 'repeat')?.times ?? 0),
      ...(note ? { note } : {}),
    };
  });

  // The bar criteria.
  const crit = {} as ArmyReport['criteria'];
  const rungs = rows.filter((r) => r.pick !== 'all-in').sort(
    (a, b) =>
      a.repeat.mercLost - b.repeat.mercLost || a.repeat.silver - b.repeat.silver || a.repeat.damage - b.repeat.damage,
  );
  const disorder: string[] = [];
  for (let i = 1; i < rungs.length; i += 1) {
    const p = rungs[i - 1] as PlanRow;
    const c = rungs[i] as PlanRow;
    if (c.repeat.mercLost <= p.repeat.mercLost || c.repeat.damage <= p.repeat.damage)
      disorder.push(`${short(c.pick)} not above ${short(p.pick)}`);
  }
  crit.order = { holds: disorder.length === 0, detail: disorder.join('; ') };
  const beaten: string[] = [];
  for (const stop of rows)
    for (const other of rows) {
      if (other === stop) continue;
      if (other.pick === 'all-in' || (stop.pick === 'all-in' && other.mercLost >= stop.mercLost)) continue;
      if (
        other.totalDamage >= stop.totalDamage &&
        other.silver <= stop.silver &&
        other.mercLost <= stop.mercLost &&
        (other.totalDamage > stop.totalDamage || other.silver < stop.silver || other.mercLost < stop.mercLost)
      ) {
        beaten.push(`${short(stop.pick)} by ${short(other.pick)}`);
        break;
      }
    }
  crit.noStopBeaten = { holds: beaten.length === 0, detail: beaten.join('; ') };
  const exposed = stops.flatMap((s) =>
    s.marches.filter((m) => m.shelterMargin <= 1).map((m) => `${short(s.pick)} ${m.role} (${m.shelterMargin.toFixed(3)})`),
  );
  crit.shelter = { holds: exposed.length === 0, detail: exposed.join('; ') };
  const short_ = stops.filter((s) => s.sustain < s.repeats).map((s) => `${short(s.pick)} lasts ${String(s.sustain)} < ${String(s.repeats)}`);
  crit.sustain = { holds: short_.length === 0, detail: short_.join('; ') };
  crit.atMostFive = { holds: rows.length <= 5, detail: `${String(rows.length)} stops` };
  crit.sweetSpot = {
    holds: rows.some((r) => r.pick === 'sweet-spot'),
    detail: rows.some((r) => r.pick === 'sweet-spot') ? '' : 'no sweet spot',
  };
  const stocked = request.units.filter(
    (u) => u.pool === 'authority' && (request.caps[u.id] ?? 0) > 0,
  );
  const unfielded = rows.flatMap((row) =>
    stocked
      .filter((u) => !playedOf(row as PlanTotals).some((m) => (m.counts[u.id] ?? 0) > 0))
      .map((u) => `${short(row.pick)} fields no ${u.id}`),
  );
  crit.s58b = { holds: unfielded.length === 0, detail: unfielded.join('; ') };

  // TotalStack at matched spend (172's reading) and 162's rows.
  const held = new Set(request.units.map((u) => u.id));
  const theirs: Campaign[] = [];
  for (const external of [...externals, ...totalstackRows(label)]) {
    if (!external.name.startsWith('TotalStack')) continue;
    if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
    const row = asCaptured(widenedFor(request, external.counts), external.name, external.counts);
    if (row.damage > 0) theirs.push(row);
  }
  const ours = stops.map(
    (s): Campaign =>
      campaignOf(
        request,
        s.pick,
        'plan',
        s.marches.flatMap((m) => Array.from({ length: m.times }, () => m.counts)),
      ),
  );
  const ms = theirs.length > 0 ? matchedSpend(ours as Contender[], theirs as Contender[]) : { rowsBeaten: 0, unfitted: 0 };
  const cBill = (c: Campaign): Bill => ({
    damage: c.damage,
    silver: c.silver,
    gold: c.gold,
    hired: c.burned,
    dragonCoins: c.dragonCoins,
    seconds: c.seconds,
  });
  const kept162 = theirs.filter(
    (t) => !ours.some((s) => s.damage >= t.damage || rate(cBill(t), cBill(s), RATES) > 0),
  ).length;

  return {
    label,
    stops,
    readings: READINGS.map((r) => ({ head: r.head, value: readingOf(stops, r), high: r.high })),
    criteria: crit,
    totalstack: { rows: theirs.length, dominated: ms.rowsBeaten, unfitted: ms.unfitted, kept162 },
    ...(extra.rechosen ? { rechosen: extra.rechosen } : {}),
    ...(extra.planMs !== undefined ? { planMs: extra.planMs } : {}),
  };
}

// ---- the file ------------------------------------------------------------------------------------------

export function saveJson(file: string | URL, reports: ArmyReport[], meta: Record<string, unknown> = {}): void {
  writeFileSync(
    file,
    `${JSON.stringify({ ...meta, armies: reports }, (_, v: unknown) =>
      typeof v === 'number' && !Number.isFinite(v) ? (Number.isNaN(v) ? 'NaN' : v > 0 ? 'Infinity' : '-Infinity') : v,
    1)}\n`,
  );
}

export function loadJson(file: string | URL): { armies: ArmyReport[] } & Record<string, unknown> {
  return JSON.parse(readFileSync(file, 'utf8'), (_, v: unknown) =>
    v === 'Infinity' ? Infinity : v === '-Infinity' ? -Infinity : v === 'NaN' ? Number.NaN : v,
  ) as { armies: ArmyReport[] } & Record<string, unknown>;
}

// ---- the markdown --------------------------------------------------------------------------------------

export const fmt = (v: number, digits = 0): string =>
  !Number.isFinite(v)
    ? v > 0
      ? '∞'
      : '—'
    : v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const hours = (s: number): string => `${fmt(s / 3600, 1)} h`;
const countsText = (counts: Record<string, number>): string =>
  Object.entries(counts)
    .map(([id, c]) => `${id} ${fmt(c)}`)
    .join(', ');

const FIG_HEAD =
  '| worst | best | silver | gold | hired | coins | queue | dmg/silver | dmg/gold | dmg/hired | dmg/coin |';
const figCells = (f: Figures): string =>
  `| ${fmt(f.worst)} | ${fmt(f.best)} | ${fmt(f.silver)} | ${fmt(f.gold)} | ${fmt(f.hired)} | ${fmt(f.coins)} | ` +
  `${hours(f.seconds)} | ${fmt(f.perSilver, 3)} | ${fmt(f.perGold, 1)} | ${fmt(f.perHired)} | ${fmt(f.perCoin, 1)} |`;

export function renderBaseline(reports: ArmyReport[]): string {
  const out: string[] = [];
  for (const army of reports) {
    out.push(`\n### ${army.label}\n`);
    if (army.refused) {
      out.push(`Refused: ${army.refused}\n`);
      continue;
    }
    out.push(
      `| stop | march | × | margin | sustain ${FIG_HEAD} counts |\n|---|---|---:|---:|---:|${'---:|'.repeat(11)}---|`,
    );
    for (const s of army.stops) {
      out.push(
        `| **${short(s.pick)}** | campaign | ${String(s.marches.reduce((a, m) => a + m.times, 0))} | ${fmt(s.shelterMargin, 3)} | ` +
          `${fmt(s.sustain)} ${figCells(s.campaign)} ${s.note ?? ''} |`,
      );
      for (const m of s.marches)
        out.push(
          `| ${short(s.pick)} | ${m.role} | ${String(m.times)} | ${fmt(m.shelterMargin, 3)} | ${fmt(s.sustain)} ${figCells(m)} ${countsText(m.counts)} |`,
        );
    }
    out.push(
      `\n**Ten readings**: ${army.readings.map((r) => `${r.head} ${r.head === 'shortest queue' ? hours(r.value) : fmt(r.value, r.value < 100 ? 3 : 0)}`).join(' · ')}.`,
    );
    out.push(
      `**Bar criteria**: ${CRITERIA.map((c) => `${c} ${army.criteria[c].holds ? '✓' : `✗ (${army.criteria[c].detail})`}`).join(' · ')}.`,
    );
    out.push(
      `**TotalStack** (172's reading, matched spend): ${String(army.totalstack.dominated)} dominated / ${String(army.totalstack.unfitted)} no stop fits, of ${String(army.totalstack.rows)} rows; 162's rows no stop beats on damage or rating: ${String(army.totalstack.kept162)}.` +
        (army.rechosen && army.rechosen.length > 0 ? ` **Re-chosen**: ${army.rechosen.join('; ')}.` : ''),
    );
  }
  return out.join('\n');
}

// ---- the comparison (for 177+) ------------------------------------------------------------------------

export interface StopDelta {
  label: string;
  pick: string;
  verdict: 'better' | 'equal' | 'worse' | 'new' | 'gone';
  rating: number;
  worse: string[];
  marches: { role: string; rating: number; moved: boolean }[];
}

export interface Comparison {
  stops: StopDelta[];
  perArmy: { label: string; better: number; equal: number; worse: number; readingsWorse: string[]; criteriaBroken: string[]; ts: string }[];
  total: { better: number; equal: number; worse: number; tsBefore: string; tsAfter: string; kept162Before: number; kept162After: number };
}

const FIELDS: [keyof Figures, boolean][] = [
  ['worst', true],
  ['best', true],
  ['silver', false],
  ['gold', false],
  ['hired', false],
  ['coins', false],
  ['seconds', false],
  ['perSilver', true],
  ['perGold', true],
  ['perHired', true],
  ['perCoin', true],
];

export function compareReports(before: ArmyReport[], after: ArmyReport[]): Comparison {
  const stops: StopDelta[] = [];
  const perArmy: Comparison['perArmy'] = [];
  const total = { better: 0, equal: 0, worse: 0, tsBefore: '', tsAfter: '', kept162Before: 0, kept162After: 0 };
  let tsB = [0, 0, 0];
  let tsA = [0, 0, 0];
  for (const a of after) {
    const b = before.find((x) => x.label === a.label);
    const army = { label: a.label, better: 0, equal: 0, worse: 0, readingsWorse: [] as string[], criteriaBroken: [] as string[], ts: '' };
    if (!b) continue;
    for (const s of a.stops) {
      const o = b.stops.find((x) => x.pick === s.pick);
      if (!o) {
        stops.push({ label: a.label, pick: s.pick, verdict: 'new', rating: Number.NaN, worse: [], marches: [] });
        continue;
      }
      const r = rate(billOf(o.campaign), billOf(s.campaign), RATES);
      const worse = FIELDS.filter(([k, high]) => {
        const x = o.campaign[k];
        const y = s.campaign[k];
        return high ? y < x * (1 - 1e-12) : y > x * (1 + 1e-12);
      }).map(([k]) => `${k} ${fmt(o.campaign[k], 3)} → ${fmt(s.campaign[k], 3)}`);
      if (s.shelterMargin < o.shelterMargin) worse.push(`shelter margin ${fmt(o.shelterMargin, 3)} → ${fmt(s.shelterMargin, 3)}`);
      if (s.sustain < o.sustain) worse.push(`sustain ${fmt(o.sustain)} → ${fmt(s.sustain)}`);
      const verdict = Math.abs(r) < 1e-9 && worse.length === 0 ? 'equal' : r < -1e-9 ? 'worse' : r > 1e-9 ? 'better' : worse.length > 0 ? 'worse' : 'equal';
      army[verdict] += 1;
      total[verdict] += 1;
      stops.push({
        label: a.label,
        pick: s.pick,
        verdict,
        rating: r,
        worse,
        marches: s.marches.map((m) => {
          const om = o.marches.find((x) => x.role === m.role);
          return {
            role: m.role,
            rating: om ? rate(billOf(om), billOf(m), RATES) : Number.NaN,
            moved: !om || om.key !== m.key,
          };
        }),
      });
    }
    for (const o of b.stops)
      if (!a.stops.some((x) => x.pick === o.pick))
        stops.push({ label: a.label, pick: o.pick, verdict: 'gone', rating: Number.NaN, worse: [], marches: [] });
    a.readings.forEach((r, i) => {
      const o = b.readings[i];
      if (!o) return;
      const worse = r.high ? r.value < o.value * (1 - 1e-12) : r.value > o.value * (1 + 1e-12);
      if (worse) army.readingsWorse.push(`${r.head} ${fmt(o.value, 3)} → ${fmt(r.value, 3)}`);
    });
    for (const c of CRITERIA) if (b.criteria[c].holds && !a.criteria[c].holds) army.criteriaBroken.push(`${c}: ${a.criteria[c].detail}`);
    army.ts = `${String(b.totalstack.dominated)}/${String(b.totalstack.unfitted)} → ${String(a.totalstack.dominated)}/${String(a.totalstack.unfitted)}`;
    tsB = [tsB[0]! + b.totalstack.dominated, tsB[1]! + b.totalstack.unfitted, tsB[2]! + b.totalstack.rows];
    tsA = [tsA[0]! + a.totalstack.dominated, tsA[1]! + a.totalstack.unfitted, tsA[2]! + a.totalstack.rows];
    total.kept162Before += b.totalstack.kept162;
    total.kept162After += a.totalstack.kept162;
    perArmy.push(army);
  }
  total.tsBefore = `${String(tsB[0])}/${String(tsB[1])} of ${String(tsB[2])}`;
  total.tsAfter = `${String(tsA[0])}/${String(tsA[1])} of ${String(tsA[2])}`;
  return { stops, perArmy, total };
}

export function renderComparison(c: Comparison): string {
  const out: string[] = [];
  out.push(
    `**Stops better / equal / worse**: ${String(c.total.better)} / ${String(c.total.equal)} / ${String(c.total.worse)}. ` +
      `**TotalStack at matched spend** (dominated / no stop fits): ${c.total.tsBefore} → ${c.total.tsAfter}. ` +
      `**162's rows**: ${String(c.total.kept162Before)} → ${String(c.total.kept162After)}.\n`,
  );
  out.push('| army | stop | verdict | rating | marches (role: rating, moved) | worse figures |\n|---|---|---|---:|---|---|');
  for (const s of c.stops)
    out.push(
      `| ${s.label.slice(0, 44)} | ${short(s.pick)} | ${s.verdict} | ${fmt(s.rating, 3)} | ` +
        `${s.marches.map((m) => `${m.role}: ${fmt(m.rating, 3)}${m.moved ? '' : ' (unchanged)'}`).join('; ')} | ${s.worse.join('; ') || '—'} |`,
    );
  out.push('\n| army | better / equal / worse | readings worse | criteria broken | TotalStack |\n|---|---|---|---|---|');
  for (const a of c.perArmy)
    out.push(
      `| ${a.label.slice(0, 44)} | ${String(a.better)} / ${String(a.equal)} / ${String(a.worse)} | ${a.readingsWorse.join('; ') || '—'} | ${a.criteriaBroken.join('; ') || '—'} | ${a.ts} |`,
    );
  return out.join('\n');
}
