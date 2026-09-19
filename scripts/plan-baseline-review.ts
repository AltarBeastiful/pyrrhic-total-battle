/**
 * `pnpm bench:review` — **the review report for a proposed baseline** (S-100).
 *
 * The owner, 2026-09-19: *"the baseline is hard to review; we need a report generation to generate a report
 * from the baseline to help the review."* `tests/engine/plan-baseline.proposed.json` is 40 kB of figures with
 * no story in it, and the rule it exists for (*"the benchmark is like non-regression tests. A given scenario
 * should not be worse, or it's a discrepancy, or a new baseline needs to be registered by me if the trade is
 * ok"*) asks him to judge **every trade** before he registers one. This task turns two of those files into one
 * Markdown page that says, per scenario and per stop, what rose, what fell, what the bar lost and what it
 * gained — and ends with a **Trades to judge** list of every fall in the whole file, sorted by size, so the
 * judgement is one pass down one table.
 *
 * It reads and never writes either side: registering a baseline stays what it has always been — the owner
 * renaming a proposal he has read and setting `registeredBy` to his own name (`tests/engine/plan-baseline.ts`).
 *
 * ## Usage
 *
 * ```
 * pnpm bench:review                                   # the registered baseline → the current proposal
 * pnpm bench:review --from=<path> [--to=<path>]       # any two of: baseline, proposal, benchmark snapshot
 * pnpm bench:review --stages                          # every benchmark-*-NN-*.json in story order, one table a scenario
 * ```
 *
 * `--from` defaults to `tests/engine/plan-baseline.json` when the owner has registered one; there is no
 * default when he has not, because the honest comparison then is against a named previous proposal or a
 * named benchmark snapshot, and this task will not guess which. `--to` defaults to
 * `tests/engine/plan-baseline.proposed.json`. Either side may be a **benchmark snapshot**
 * (`tools/theorycraft/out/benchmark-*.json`): snapshots from S-94 on carry the baseline block whole, and
 * older ones are read from their table rows, which is said in the report's own header because two of their
 * columns are rounded and the plan's own campaign is not in them at all.
 *
 * Output: `tools/theorycraft/out/baseline-review.md`, and `baseline-review-stages.md` under `--stages`
 * (`--out=<path>` moves either). Both sit in the generated-output directory Prettier ignores.
 *
 * ## The reading
 *
 * A figure is only comparable to a figure on the same **reading**, and the reading moved on 2026-09-19:
 * S-94 put every damage column on the march's *worst opening*. A baseline file names its own (`reading`);
 * a snapshot does not, so its reading is taken from its stage number — 12 (`reliable-damage`) is S-94's own
 * snapshot, and everything before it is on the average-damage reading. When the two sides disagree the
 * header says so in bold, because then the whole page is a change of arithmetic and not a change of plan.
 */
/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Baseline, BaselineScenario } from '../tests/engine/plan-baseline.ts';

// ---- The two shapes on disk ------------------------------------------------------------------------

/** One campaign's figures as either side carries them; a snapshot's rows carry fewer than a baseline. */
export interface SideTotals {
  marches: number;
  damage: number;
  silver: number;
  gold?: number;
  seconds?: number;
  burned: number;
  perSilver: number | null;
  perHired: number;
  soldiersLost?: number;
  monstersLost?: number;
  dragonCoins?: number;
  perSoldier?: number;
  perMonster?: number;
}

export interface SideStanding {
  bestSizer: number;
  externals: Record<string, number>;
}

export interface SideScenario {
  stops: Record<string, SideTotals>;
  /** The plan's own campaign; `null` where the side does not carry it (a snapshot older than S-94). */
  plan: SideTotals | null;
  ratios: {
    bestSizer: number;
    externals: Record<string, number>;
    perSoldier?: SideStanding;
    perMonster?: SideStanding;
    perSilver?: SideStanding;
  };
}

/** One side of the comparison, whatever file it came out of. */
export interface Side {
  path: string;
  kind: 'baseline' | 'proposal' | 'snapshot';
  registeredBy: string | null;
  registeredAt: string | null;
  reading: string;
  /** False when the reading was inferred from a snapshot's stage number rather than read off the file. */
  readingKnown: boolean;
  note: string;
  run: string | null;
  scenarios: Record<string, SideScenario>;
  /** True when some scenario was rebuilt from a snapshot's table rows rather than read off its baseline. */
  fromRows: boolean;
}

interface SnapshotRow {
  name: string;
  kind: 'sizer' | 'plan' | 'external';
  comparable: boolean;
  marches: number;
  damage: number;
  silver: number;
  gold?: number;
  seconds?: number;
  burned: number;
  perSilver: number | null;
  perHired: number;
  soldiersLost?: number;
  monstersLost?: number;
  dragonCoins?: number;
  perSoldier?: number;
  perMonster?: number;
}

interface SnapshotScenario {
  label: string;
  refusal: string | null;
  stops: string[];
  baseline?: BaselineScenario | null;
  rows: SnapshotRow[];
}

interface Snapshot {
  run: string;
  reading?: string;
  note?: string;
  scenarios: SnapshotScenario[];
}

// ---- Formatting (copied from `tools/theorycraft/harness.ts`; scripts may not import it — the node
// tsconfig excludes `tools/theorycraft`, which pulls the whole engine in) ----------------------------

export const n = (value: number): string =>
  Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export function duration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---- The readings a stop is judged on --------------------------------------------------------------

type Kind = 'count' | 'ratio' | 'seconds';
type Better = 'higher' | 'lower';
export type Verdict = '▲' | '▼' | '=';

interface Reading {
  label: string;
  better: Better;
  kind: Kind;
  of: (t: SideTotals) => number | null | undefined;
}

/**
 * In the order the owner reads a stop: what it did, what it cost, what it burned, and what each of those
 * buys. "Worse" follows the reading's own direction — damage and the four ratios higher is better, the five
 * costs lower is better.
 */
export const READINGS: Reading[] = [
  { label: 'damage', better: 'higher', kind: 'count', of: (t) => t.damage },
  { label: 'silver', better: 'lower', kind: 'count', of: (t) => t.silver },
  { label: 'revive gold', better: 'lower', kind: 'count', of: (t) => t.gold },
  { label: 'dragon coins', better: 'lower', kind: 'count', of: (t) => t.dragonCoins },
  { label: 'training queue', better: 'lower', kind: 'seconds', of: (t) => t.seconds },
  { label: 'hired burned', better: 'lower', kind: 'count', of: (t) => t.burned },
  { label: 'soldiers burned', better: 'lower', kind: 'count', of: (t) => t.soldiersLost },
  { label: 'monsters burned', better: 'lower', kind: 'count', of: (t) => t.monstersLost },
  { label: 'damage a silver', better: 'higher', kind: 'ratio', of: (t) => t.perSilver },
  { label: 'damage a hired unit', better: 'higher', kind: 'count', of: (t) => t.perHired },
  { label: 'damage a soldier', better: 'higher', kind: 'count', of: (t) => t.perSoldier },
  { label: 'damage a monster', better: 'higher', kind: 'count', of: (t) => t.perMonster },
];

/** The slack `compareToBaseline` reads a ratio with: two runs of the same tree agree to the unit. */
const SLACK = 1e-9;

export function verdictOf(before: number, after: number, better: Better): Verdict {
  const delta = after - before;
  if (Math.abs(delta) <= Math.max(1, Math.abs(before)) * SLACK) return '=';
  return (better === 'higher' ? delta > 0 : delta < 0) ? '▲' : '▼';
}

function cell(kind: Kind, value: number): string {
  if (kind === 'ratio') return value.toFixed(4);
  if (kind === 'seconds') return `${n(value)} (${duration(value)})`;
  return n(value);
}

function deltaCell(kind: Kind, before: number, after: number): string {
  const delta = after - before;
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
  const size = Math.abs(delta);
  if (kind === 'ratio') return `${sign}${size.toFixed(4)}`;
  if (kind === 'seconds') return `${sign}${n(size)} (${duration(size)})`;
  return `${sign}${n(size)}`;
}

/** The share the change is of the figure it started from, to one decimal; `—` when it started at nought. */
function pctCell(before: number, after: number): string {
  if (before === 0) return after === 0 ? '0.0 %' : '—';
  const share = ((after - before) / Math.abs(before)) * 100;
  const sign = share > 0 ? '+' : '';
  return `${sign}${share.toFixed(1)} %`;
}

const plural = (count: number, word: string): string => `${n(count)} ${word}${count === 1 ? '' : 's'}`;

/** How big a move is, for sorting; a move off nought has no share, and is ranked as a whole one. */
function pctSize(before: number, after: number): number {
  if (before === 0) return after === 0 ? 0 : 100;
  return Math.abs(((after - before) / before) * 100);
}

// ---- Reading a side off disk -----------------------------------------------------------------------

const HERE = new URL('.', import.meta.url);
const REGISTERED = fileURLToPath(new URL('../tests/engine/plan-baseline.json', HERE));
const PROPOSED = fileURLToPath(new URL('../tests/engine/plan-baseline.proposed.json', HERE));
const OUT_DIR = fileURLToPath(new URL('../tools/theorycraft/out/', HERE));
const REVIEW_OUT = `${OUT_DIR}baseline-review.md`;
const STAGES_OUT = `${OUT_DIR}baseline-review-stages.md`;

const PLAN_ROW = 'Complete optimization · ';
/** Snapshot 12 (`reliable-damage`) is S-94's own; from it on the damage column is the worst opening. */
const WORST_OPENING_FROM = 12;

/** `benchmark-2026-09-18-06-shelter-all-types.json` → the story's place in the order the stories ran. */
export function stageOf(path: string): { index: number; suffix: string; date: string; slug: string } | null {
  const match = /^benchmark-(\d{4}-\d{2}-\d{2})-(\d+)([a-z]?)-(.+)\.json$/.exec(basename(path));
  if (!match) return null;
  const [, date, index, suffix, slug] = match;
  if (date === undefined || index === undefined || slug === undefined) return null;
  return { index: Number(index), suffix: suffix ?? '', date, slug };
}

function totalsOfRow(row: SnapshotRow): SideTotals {
  return {
    marches: row.marches,
    damage: row.damage,
    silver: row.silver,
    ...(row.gold !== undefined ? { gold: row.gold } : {}),
    ...(row.seconds !== undefined ? { seconds: row.seconds } : {}),
    burned: row.burned,
    perSilver: row.perSilver,
    perHired: row.perHired,
    ...(row.soldiersLost !== undefined ? { soldiersLost: row.soldiersLost } : {}),
    ...(row.monstersLost !== undefined ? { monstersLost: row.monstersLost } : {}),
    ...(row.dragonCoins !== undefined ? { dragonCoins: row.dragonCoins } : {}),
    ...(row.perSoldier !== undefined ? { perSoldier: row.perSoldier } : {}),
    ...(row.perMonster !== undefined ? { perMonster: row.perMonster } : {}),
  };
}

/**
 * A scenario rebuilt from a snapshot's table rows — what a snapshot older than S-94 carries. The stops are
 * its `Complete optimization · <pick>` rows and the standings are the same quotients `asBaseline` takes in
 * `plan-benchmark.test.ts`; the plan's **own** campaign is not in the file, so it comes back `null`.
 */
export function scenarioFromRows(scenario: SnapshotScenario): SideScenario | null {
  const plans = scenario.rows.filter((row) => row.kind === 'plan');
  const sizers = scenario.rows.filter((row) => row.kind === 'sizer');
  const externals = scenario.rows.filter((row) => row.kind === 'external' && row.comparable);
  if (plans.length === 0 || sizers.length === 0) return null;
  const stops: Record<string, SideTotals> = {};
  for (const row of plans) {
    const pick = row.name.startsWith(PLAN_ROW) ? row.name.slice(PLAN_ROW.length) : row.name;
    stops[pick] = totalsOfRow(row);
  }
  const best = Math.max(...plans.map((row) => row.damage));
  const bestSizer = Math.max(...sizers.map((row) => row.damage));
  const standing = (of: (row: SnapshotRow) => number | undefined): SideStanding | null => {
    const ours = plans.map(of);
    const theirs = sizers.map(of);
    if ([...ours, ...theirs].some((value) => value === undefined)) return null;
    const mine = Math.max(...(ours as number[]));
    const yours = Math.max(...(theirs as number[]));
    return {
      bestSizer: yours > 0 ? mine / yours : 0,
      externals: Object.fromEntries(
        externals.filter((row) => (of(row) ?? 0) > 0).map((row) => [row.name, mine / (of(row) as number)]),
      ),
    };
  };
  const perSoldier = standing((row) => row.perSoldier);
  const perMonster = standing((row) => row.perMonster);
  const perSilver = standing((row) => row.perSilver ?? undefined);
  return {
    stops,
    plan: null,
    ratios: {
      bestSizer: bestSizer > 0 ? best / bestSizer : 0,
      externals: Object.fromEntries(
        externals.filter((row) => row.damage > 0).map((row) => [row.name, best / row.damage]),
      ),
      ...(perSoldier ? { perSoldier } : {}),
      ...(perMonster ? { perMonster } : {}),
      ...(perSilver ? { perSilver } : {}),
    },
  };
}

export function sideFromSnapshot(path: string, snapshot: Snapshot): Side {
  const scenarios: Record<string, SideScenario> = {};
  let fromRows = false;
  for (const scenario of snapshot.scenarios) {
    if (scenario.baseline) {
      scenarios[scenario.label] = scenario.baseline;
      continue;
    }
    const built = scenarioFromRows(scenario);
    if (!built) continue;
    fromRows = true;
    scenarios[scenario.label] = built;
  }
  const stage = stageOf(path);
  const inferred = stage !== null && stage.index >= WORST_OPENING_FROM ? 'worst-opening' : 'average damage';
  return {
    path,
    kind: 'snapshot',
    registeredBy: null,
    registeredAt: null,
    reading: snapshot.reading ?? inferred,
    readingKnown: snapshot.reading !== undefined,
    note:
      snapshot.note ??
      (stage === null
        ? 'A benchmark snapshot.'
        : `Benchmark snapshot ${stage.index}${stage.suffix} (${stage.slug}) of ${stage.date}.`),
    run: snapshot.run,
    scenarios,
    fromRows,
  };
}

export function sideFromBaseline(path: string, baseline: Baseline): Side {
  return {
    path,
    kind: baseline.registeredBy === null ? 'proposal' : 'baseline',
    registeredBy: baseline.registeredBy,
    registeredAt: baseline.registeredAt,
    reading: baseline.reading,
    readingKnown: true,
    note: baseline.note,
    run: null,
    scenarios: baseline.scenarios,
    fromRows: false,
  };
}

export function loadSide(path: string): Side {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Baseline | Snapshot;
  return Array.isArray((parsed as Snapshot).scenarios)
    ? sideFromSnapshot(path, parsed as Snapshot)
    : sideFromBaseline(path, parsed as Baseline);
}

/** A side's one-line provenance, for the report's header. */
function provenance(side: Side): string {
  const where = side.path.replace(/^.*\/(?=(tests|tools|scripts)\/)/, '');
  const who =
    side.kind === 'baseline'
      ? `registered by **${side.registeredBy ?? '—'}** on ${side.registeredAt ?? '—'}`
      : side.kind === 'proposal'
        ? '`registeredBy: null` — a **proposal**, not a baseline'
        : `a benchmark snapshot, run ${side.run ?? '—'}`;
  const reading = side.readingKnown ? side.reading : `${side.reading} (inferred from the stage number)`;
  const rows = side.fromRows ? " Rebuilt from the snapshot's table rows." : '';
  return `${where} — ${who}; reading: ${reading}.${rows}`;
}

// ---- The review ------------------------------------------------------------------------------------

interface Move {
  scenario: string;
  where: string;
  reading: string;
  kind: Kind;
  before: number;
  after: number;
  verdict: Verdict;
}

const STOP_ORDER = ['silver-saver', 'sweet-spot', 'more-mercs', 'steady-max', 'all-in'];

function byStopOrder(a: string, b: string): number {
  const ia = STOP_ORDER.indexOf(a);
  const ib = STOP_ORDER.indexOf(b);
  return (ia === -1 ? STOP_ORDER.length : ia) - (ib === -1 ? STOP_ORDER.length : ib) || a.localeCompare(b);
}

function table(header: string[], rows: string[][]): string[] {
  return [
    `| ${header.join(' | ')} |`,
    `|${header.map(() => '---').join('|')}|`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ];
}

/** One stop's twelve readings, and the moves it contributes to the Trades and Rises lists. */
function stopTable(
  scenario: string,
  where: string,
  before: SideTotals,
  after: SideTotals,
  moves: Move[],
): string[] {
  const lines: string[] = [];
  // Two campaigns of different lengths are not on the same footing, and this is not a hypothetical: the
  // plan's stops were priced over the plan's own marches until S-81 and S-89 gave them the horizon, so a
  // snapshot older than those compares a one-march campaign against a four-march one.
  if (before.marches !== after.marches) {
    lines.push(
      `> **Not the same campaign length** — *from* is priced over ${n(before.marches)} ` +
        `march${before.marches === 1 ? '' : 'es'} and *to* over ${n(after.marches)}. Every total below ` +
        'scales with that, and only the four ratios are read on the same footing.',
      '',
    );
  }
  const rows: string[][] = [];
  for (const reading of READINGS) {
    const was = reading.of(before);
    const now = reading.of(after);
    if (was === undefined || was === null || now === undefined || now === null) {
      const one = (value: number | null | undefined): string =>
        value === undefined || value === null ? '—' : cell(reading.kind, value);
      rows.push([reading.label, one(was), one(now), '—', '—', '·']);
      continue;
    }
    const verdict = verdictOf(was, now, reading.better);
    moves.push({
      scenario,
      where,
      reading: reading.label,
      kind: reading.kind,
      before: was,
      after: now,
      verdict,
    });
    rows.push([
      reading.label,
      cell(reading.kind, was),
      cell(reading.kind, now),
      deltaCell(reading.kind, was, now),
      pctCell(was, now),
      verdict,
    ]);
  }
  return [...lines, ...table(['reading', 'from', 'to', 'Δ', 'Δ %', 'verdict'], rows)];
}

/** A stop only one side carries, as one line of prose and figures. */
function stopLine(totals: SideTotals): string {
  const parts = [
    `${n(totals.damage)} damage`,
    `${n(totals.silver)} silver`,
    `${n(totals.burned)} burned`,
    `${totals.perSilver === null ? '—' : totals.perSilver.toFixed(4)} a silver`,
    `${n(totals.perHired)} a hired`,
  ];
  if (totals.seconds !== undefined) parts.push(duration(totals.seconds));
  return parts.join(' · ');
}

function standingRows(
  scenario: string,
  was: SideScenario,
  now: SideScenario,
  moves: Move[],
): { rows: string[][]; rare: string[] } {
  const rows: string[][] = [];
  const one = (
    label: string,
    before: number | undefined,
    after: number | undefined,
    reading: string,
  ): void => {
    if (before === undefined || after === undefined) {
      rows.push([
        label,
        before === undefined ? '—' : before.toFixed(4),
        after === undefined ? '—' : after.toFixed(4),
        '—',
        '—',
        '·',
      ]);
      return;
    }
    const verdict = verdictOf(before, after, 'higher');
    moves.push({ scenario, where: `standing ${label}`, reading, kind: 'ratio', before, after, verdict });
    rows.push([
      label,
      before.toFixed(4),
      after.toFixed(4),
      deltaCell('ratio', before, after),
      pctCell(before, after),
      verdict,
    ]);
  };
  one('vs the best sizer sequence', was.ratios.bestSizer, now.ratios.bestSizer, 'damage');
  const names = [...new Set([...Object.keys(was.ratios.externals), ...Object.keys(now.ratios.externals)])];
  for (const name of names)
    one(`vs ${name}`, was.ratios.externals[name], now.ratios.externals[name], 'damage');

  // The owner's other three standings — damage a soldier and damage a monster (S-98), damage a silver
  // (S-101). They coincide with the damage standing on most armies, so only the ones that moved are printed
  // — every one of them, and the rest named as unmoved.
  const rare: string[] = [];
  for (const [reading, before, after] of [
    ['damage a silver', was.ratios.perSilver, now.ratios.perSilver],
    ['damage a soldier', was.ratios.perSoldier, now.ratios.perSoldier],
    ['damage a monster', was.ratios.perMonster, now.ratios.perMonster],
  ] as const) {
    if (!before || !after) {
      rare.push(`${reading}: not carried by both sides.`);
      continue;
    }
    const moved: string[] = [];
    const seen = [...new Set([...Object.keys(before.externals), ...Object.keys(after.externals)])];
    const pairs: [string, number | undefined, number | undefined][] = [
      ['the best sizer sequence', before.bestSizer, after.bestSizer],
      ...seen.map<[string, number | undefined, number | undefined]>((name) => [
        name,
        before.externals[name],
        after.externals[name],
      ]),
    ];
    for (const [name, a, b] of pairs) {
      if (a === undefined || b === undefined) {
        moved.push(
          `**${name}**: ${a === undefined ? '—' : a.toFixed(4)} → ${b === undefined ? '—' : b.toFixed(4)}`,
        );
        continue;
      }
      const verdict = verdictOf(a, b, 'higher');
      moves.push({
        scenario,
        where: `standing vs ${name}`,
        reading,
        kind: 'ratio',
        before: a,
        after: b,
        verdict,
      });
      if (verdict === '=') continue;
      moved.push(`${verdict} **${name}** ${a.toFixed(4)} → ${b.toFixed(4)} (${pctCell(a, b)})`);
    }
    rare.push(
      moved.length === 0
        ? `${reading}: unmoved on all ${pairs.length}.`
        : `${reading}: ${moved.join(' · ')}.`,
    );
  }
  return { rows, rare };
}

export function renderReview(from: Side, to: Side): string {
  const out: string[] = [];
  const moves: Move[] = [];
  const lost: { scenario: string; pick: string; totals: SideTotals }[] = [];
  const gained: { scenario: string; pick: string; totals: SideTotals }[] = [];
  const body: string[] = [];
  let stops = 0;

  const labels = [
    ...Object.keys(to.scenarios),
    ...Object.keys(from.scenarios).filter((label) => !(label in to.scenarios)),
  ];
  for (const label of labels) {
    const was = from.scenarios[label];
    const now = to.scenarios[label];
    body.push('', `## ${label}`, '');
    if (!was) {
      body.push(
        `**New — the *from* side does not hold this scenario.** It offers ${
          now ? Object.keys(now.stops).length : 0
        } stops: ${
          now
            ? Object.keys(now.stops)
                .sort(byStopOrder)
                .map((p) => `\`${p}\``)
                .join(', ')
            : '—'
        }. ` + 'Nothing here is a regression; it is a bar to register for the first time.',
      );
      if (now) {
        body.push('');
        for (const pick of Object.keys(now.stops).sort(byStopOrder)) {
          const totals = now.stops[pick];
          if (totals) body.push(`- \`${pick}\` — ${stopLine(totals)}`);
        }
      }
      continue;
    }
    if (!now) {
      body.push(
        '**Gone — the *to* side does not hold this scenario at all.** Every stop below was registered and ' +
          'is no longer measured; that is a discrepancy to explain before anything is registered.',
      );
      for (const pick of Object.keys(was.stops).sort(byStopOrder)) {
        const totals = was.stops[pick];
        if (totals) {
          body.push(`- \`${pick}\` — ${stopLine(totals)}`);
          lost.push({ scenario: label, pick, totals });
        }
      }
      continue;
    }

    const standings = standingRows(label, was, now, moves);
    body.push(...table(['standing', 'from', 'to', 'Δ', 'Δ %', 'verdict'], standings.rows));
    body.push('', ...standings.rare.map((line) => `- ${line}`));

    const picks = [...new Set([...Object.keys(was.stops), ...Object.keys(now.stops)])].sort(byStopOrder);
    const only = picks.filter((pick) => !(pick in was.stops) || !(pick in now.stops));
    if (only.length > 0) {
      const said = only.map((pick) => {
        const before = was.stops[pick];
        const after = now.stops[pick];
        if (before && !after) {
          lost.push({ scenario: label, pick, totals: before });
          return `**lost \`${pick}\`** (was ${stopLine(before)})`;
        }
        if (after && !before) {
          gained.push({ scenario: label, pick, totals: after });
          return `**gained \`${pick}\`** (${stopLine(after)})`;
        }
        return `\`${pick}\``;
      });
      body.push('', `Stops: ${said.join(' · ')}.`);
    }

    for (const pick of picks) {
      const before = was.stops[pick];
      const after = now.stops[pick];
      if (!before || !after) continue;
      stops += 1;
      body.push('', `### \`${pick}\``, '');
      body.push(...stopTable(label, `\`${pick}\``, before, after, moves));
    }
    if (was.plan && now.plan) {
      stops += 1;
      body.push('', '### the plan itself', '');
      body.push(...stopTable(label, 'the plan itself', was.plan, now.plan, moves));
    } else {
      body.push('', '### the plan itself', '', 'Not carried by both sides — nothing to compare.');
    }
  }

  const falls = moves.filter((move) => move.verdict === '▼');
  const rises = moves.filter((move) => move.verdict === '▲');

  out.push('# The baseline, reviewed', '');
  const same = moves.filter((move) => move.verdict === '=');
  out.push(
    `**${plural(labels.length, 'scenario')} · ${plural(stops, 'campaign')} read · ` +
      `${plural(moves.length, 'reading')} judged · ${n(rises.length)} ▲ · ${n(falls.length)} ▼ · ` +
      `${n(same.length)} = · ${plural(lost.length, 'stop')} lost · ${plural(gained.length, 'stop')} gained · ` +
      `reading: ${to.reading}.** ` +
      'Every fall is listed once more, sorted by size, under [Trades to judge](#trades-to-judge); every rise ' +
      'under [Rises](#rises).',
    '',
  );
  out.push(`- **From** — ${provenance(from)}`);
  out.push(`- **To** — ${provenance(to)}`);
  if (from.reading !== to.reading) {
    out.push(
      '',
      `> **The two sides are on different readings — \`${from.reading}\` against \`${to.reading}\`.** Every ` +
        'damage figure below, and every ratio built on one, changed arithmetic as well as plan (S-94 put the ' +
        "bar on the march's worst opening); a fall against an average-damage side is not by itself a " +
        'regression of the plan.',
    );
  }
  if (from.fromRows || to.fromRows) {
    out.push(
      '',
      "> One side was rebuilt from a snapshot's table rows: its `damage a silver` is rounded to three " +
        "decimals as the table printed it, it carries no gold, queue or rare-stock column, and the plan's " +
        'own campaign is not in it. Those readings are marked `·` rather than judged.',
    );
  }
  out.push(
    '',
    'Read a row as: *from* is what the left-hand file holds, *to* what the right-hand one measured. ' +
      '▲ is better on that reading, ▼ worse, `=` identical, `·` not comparable. Costs — silver, gold, ' +
      'coins, queue and the three burns — are better **lower**; damage and the four ratios better **higher**.',
  );

  out.push(...body);

  out.push('', '## Trades to judge', '');
  if (lost.length > 0) {
    out.push(
      '**Stops the *to* side no longer offers** — the bar lost an answer, which the baseline reads as a failure:',
      '',
    );
    for (const one of lost) out.push(`- **${one.scenario}** — \`${one.pick}\`: ${stopLine(one.totals)}`);
    out.push('');
  }
  if (falls.length === 0) {
    out.push('Nothing fell. Every reading on every stop is equal or better.');
  } else {
    out.push(
      `${falls.length} readings fell, sorted by size. Each is a trade the owner accepts or refuses; ` +
        'registering the proposal accepts all of them.',
      '',
    );
    const sorted = [...falls].sort((a, b) => pctSize(b.before, b.after) - pctSize(a.before, a.after));
    out.push(
      ...table(
        ['#', 'scenario', 'stop', 'reading', 'from', 'to', 'Δ', 'Δ %'],
        sorted.map((move, index) => [
          String(index + 1),
          move.scenario,
          move.where,
          move.reading,
          cell(move.kind, move.before),
          cell(move.kind, move.after),
          deltaCell(move.kind, move.before, move.after),
          pctCell(move.before, move.after),
        ]),
      ),
    );
  }

  out.push('', '## Rises', '');
  if (gained.length > 0) {
    out.push(
      '**Stops the *to* side offers and the *from* side does not** — news to register, not a regression:',
      '',
    );
    for (const one of gained) out.push(`- **${one.scenario}** — \`${one.pick}\`: ${stopLine(one.totals)}`);
    out.push('');
  }
  if (rises.length === 0) {
    out.push('Nothing rose.');
  } else {
    const sorted = [...rises].sort((a, b) => pctSize(b.before, b.after) - pctSize(a.before, a.after));
    out.push(`${rises.length} readings rose, sorted by size.`, '');
    out.push(
      ...table(
        ['#', 'scenario', 'stop', 'reading', 'from', 'to', 'Δ', 'Δ %'],
        sorted.map((move, index) => [
          String(index + 1),
          move.scenario,
          move.where,
          move.reading,
          cell(move.kind, move.before),
          cell(move.kind, move.after),
          deltaCell(move.kind, move.before, move.after),
          pctCell(move.before, move.after),
        ]),
      ),
    );
  }
  out.push('');
  return out.join('\n');
}

// ---- The stage history -----------------------------------------------------------------------------

export interface Stage {
  label: string;
  side: Side;
}

/** Every `benchmark-*-NN-*.json` in `out/`, in the order the stories ran. */
export function stageFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => stageOf(name) !== null)
    .map((name) => ({ name, stage: stageOf(name) }))
    .sort((a, b) =>
      a.stage && b.stage ? a.stage.index - b.stage.index || a.stage.suffix.localeCompare(b.stage.suffix) : 0,
    )
    .map((one) => `${dir}${one.name}`);
}

export function renderStages(stages: Stage[], tail: Stage | null): string {
  const all = tail ? [...stages, tail] : stages;
  const out: string[] = ['# The baseline, stage by stage', ''];
  out.push(
    `${all.length} readings of the bar, in the order the stories ran — every benchmark snapshot in ` +
      "`tools/theorycraft/out/`, so each story's effect on each scenario is one row. A figure carries the " +
      'verdict against the **row above it**: ▲ harder-hitting, ▼ less, `=` identical to the unit, `+` a stop ' +
      'the stage gained, `—` a stop it does not offer.',
    '',
  );
  out.push(
    ...table(
      ['stage', 'reading', 'scenarios', 'run'],
      all.map((stage) => [
        stage.label,
        stage.side.readingKnown ? stage.side.reading : `${stage.side.reading} (inferred)`,
        String(Object.keys(stage.side.scenarios).length),
        stage.side.run ?? '—',
      ]),
    ),
  );

  const labels: string[] = [];
  for (const stage of all) {
    for (const label of Object.keys(stage.side.scenarios)) if (!labels.includes(label)) labels.push(label);
  }
  for (const label of labels) {
    const picks: string[] = [];
    for (const stage of all) {
      const scenario = stage.side.scenarios[label];
      if (!scenario) continue;
      for (const pick of Object.keys(scenario.stops)) if (!picks.includes(pick)) picks.push(pick);
    }
    picks.sort(byStopOrder);
    out.push('', `## ${label}`, '');
    const previous = new Map<string, number>();
    let previousStanding: number | null = null;
    const rows: string[][] = [];
    for (const stage of all) {
      const scenario = stage.side.scenarios[label];
      if (!scenario) {
        rows.push([stage.label, '—', ...picks.map(() => '—'), '—']);
        continue;
      }
      const cells = picks.map((pick) => {
        const totals = scenario.stops[pick];
        if (!totals) return '—';
        const was = previous.get(pick);
        previous.set(pick, totals.damage);
        if (was === undefined) return `+ ${n(totals.damage)}`;
        const verdict = verdictOf(was, totals.damage, 'higher');
        return `${verdict === '=' ? '=' : verdict} ${n(totals.damage)}`;
      });
      const standing = scenario.ratios.bestSizer;
      const mark = previousStanding === null ? '+' : verdictOf(previousStanding, standing, 'higher');
      previousStanding = standing;
      rows.push([
        stage.label,
        String(Object.keys(scenario.stops).length),
        ...cells,
        `${mark} ${standing.toFixed(4)}`,
      ]);
    }
    out.push(
      ...table(['stage', 'stops', ...picks.map((pick) => `\`${pick}\` damage`), 'vs best sizer'], rows),
    );
  }
  out.push('');
  return out.join('\n');
}

// ---- The task --------------------------------------------------------------------------------------

function argument(name: string): string | undefined {
  const found = process.argv.slice(2).find((one) => one.startsWith(`--${name}=`));
  return found?.slice(name.length + 3);
}

function main(): void {
  const wantsStages = process.argv.slice(2).includes('--stages');
  const out = argument('out');

  if (wantsStages) {
    const stages: Stage[] = stageFiles(OUT_DIR).map((path) => {
      const stage = stageOf(path);
      return {
        label: stage === null ? basename(path) : `${stage.index}${stage.suffix} ${stage.slug}`,
        side: loadSide(path),
      };
    });
    const toPath = argument('to') ?? (existsSync(PROPOSED) ? PROPOSED : null);
    const tail: Stage | null =
      toPath === null ? null : { label: `proposal (${basename(toPath)})`, side: loadSide(toPath) };
    const where = out ?? STAGES_OUT;
    writeFileSync(where, renderStages(stages, tail));
    process.stdout.write(`bench:review: ${String(stages.length)} stages → ${where}\n`);
    return;
  }

  const fromPath = argument('from') ?? (existsSync(REGISTERED) ? REGISTERED : null);
  if (fromPath === null) {
    process.stderr.write(
      'bench:review: no baseline is registered (`tests/engine/plan-baseline.json` is absent), so there is ' +
        'no default to compare against. Name the side to compare from:\n' +
        '  pnpm bench:review --from=tests/engine/plan-baseline.proposed.json\n' +
        '  pnpm bench:review --from=tools/theorycraft/out/benchmark-2026-09-19-16-rare-stock-readings.json\n',
    );
    process.exit(1);
    return;
  }
  const toPath = argument('to') ?? PROPOSED;
  for (const path of [fromPath, toPath]) {
    if (existsSync(path)) continue;
    process.stderr.write(`bench:review: ${path} is not there.\n`);
    process.exit(1);
    return;
  }
  const from = loadSide(fromPath);
  const to = loadSide(toPath);
  const where = out ?? REVIEW_OUT;
  writeFileSync(where, renderReview(from, to));
  process.stdout.write(
    `bench:review: ${String(Object.keys(to.scenarios).length)} scenarios of ${basename(toPath)} against ` +
      `${basename(fromPath)} → ${where}\n`,
  );
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) main();
